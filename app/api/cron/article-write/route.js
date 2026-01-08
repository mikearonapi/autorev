/**
 * Daily Article Writing Cron Job
 * 
 * Runs daily at 5am (before 8am publish) to ensure there's always content in the queue.
 * 
 * Workflow:
 * 1. Check if queue is below threshold (< 7 articles = 1 week buffer)
 * 2. If yes, generate 1 new article from pipeline ideas OR auto-research new topic
 * 3. Article includes: SEO content, hero image, car database alignment
 * 
 * Schedule: 0 5 * * * (5am daily)
 * 
 * @route GET /api/cron/article-write
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateArticleContent, createCompleteArticle } from '@/lib/articleGenerationService';
import { researchCategoryTopics, searchExa } from '@/lib/articleResearchService';
import Anthropic from '@anthropic-ai/sdk';

// Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Minimum queue size before we generate new content
const MIN_QUEUE_SIZE = 7; // 1 week buffer

export const maxDuration = 300; // 5 minute timeout
export const dynamic = 'force-dynamic';

// Categories to rotate through
const CATEGORIES = ['comparisons', 'enthusiast', 'technical'];

export async function GET(request) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log('[ArticleWrite] Starting daily article generation...');
  
  const results = {
    success: false,
    queueSize: 0,
    action: 'none',
    articleGenerated: null,
    error: null,
  };
  
  try {
    // ==========================================================================
    // Step 1: Check current queue size
    // ==========================================================================
    
    const { count: queueSize, error: countError } = await supabase
      .from('al_articles')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', false)
      .not('content_html', 'is', null);
    
    if (countError) {
      throw new Error(`Queue count error: ${countError.message}`);
    }
    
    results.queueSize = queueSize || 0;
    console.log(`[ArticleWrite] Current queue size: ${results.queueSize}`);
    
    // Skip if queue is healthy
    if (results.queueSize >= MIN_QUEUE_SIZE) {
      console.log(`[ArticleWrite] Queue is healthy (${results.queueSize} >= ${MIN_QUEUE_SIZE}), skipping`);
      results.success = true;
      results.action = 'skipped_queue_healthy';
      return NextResponse.json(results);
    }
    
    // ==========================================================================
    // Step 2: Determine category to write for (rotate evenly)
    // ==========================================================================
    
    // Check article distribution by category
    const { data: categoryDist } = await supabase
      .from('al_articles')
      .select('category')
      .eq('is_published', false);
    
    const categoryCounts = CATEGORIES.reduce((acc, cat) => {
      acc[cat] = (categoryDist || []).filter(a => a.category === cat).length;
      return acc;
    }, {});
    
    // Pick category with fewest unpublished articles
    const targetCategory = CATEGORIES.reduce((min, cat) => 
      categoryCounts[cat] < categoryCounts[min] ? cat : min
    );
    
    console.log(`[ArticleWrite] Target category: ${targetCategory}`);
    
    // ==========================================================================
    // Step 3: Generate a fresh article idea using Exa + Claude
    // ==========================================================================
    
    const articleIdea = await generateFreshArticleIdea(targetCategory);
    
    if (!articleIdea) {
      results.action = 'failed_no_idea';
      results.error = 'Could not generate article idea';
      return NextResponse.json(results, { status: 500 });
    }
    
    console.log(`[ArticleWrite] Generated idea: ${articleIdea.title}`);
    
    // ==========================================================================
    // Step 4: Create the complete article (content + image)
    // ==========================================================================
    
    const articleResult = await createCompleteArticle(articleIdea, {
      generateImage: true,
      publishImmediately: false, // Goes to queue, published at 8am
    });
    
    if (!articleResult.success) {
      results.action = 'failed_generation';
      results.error = articleResult.error;
      return NextResponse.json(results, { status: 500 });
    }
    
    results.success = true;
    results.action = 'article_generated';
    results.articleGenerated = {
      id: articleResult.articleId,
      slug: articleIdea.slug,
      title: articleIdea.title,
      category: targetCategory,
    };
    
    console.log(`[ArticleWrite] ✅ Created article: ${articleIdea.slug}`);
    
    // Update queue count
    const { count: newQueueSize } = await supabase
      .from('al_articles')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', false)
      .not('content_html', 'is', null);
    
    results.queueSize = newQueueSize || 0;
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('[ArticleWrite] Error:', error);
    results.error = error.message;
    return NextResponse.json(results, { status: 500 });
  }
}

/**
 * Generate a fresh article idea using Exa research + Claude analysis
 */
async function generateFreshArticleIdea(category) {
  if (!ANTHROPIC_API_KEY) {
    console.warn('[ArticleWrite] ANTHROPIC_API_KEY not configured');
    return null;
  }
  
  try {
    // Get existing articles to avoid duplicates
    const { data: existingArticles } = await supabase
      .from('al_articles')
      .select('slug, title')
      .eq('category', category);
    
    const existingSlugs = (existingArticles || []).map(a => a.slug);
    const existingTitles = (existingArticles || []).map(a => a.title);
    
    // Get recent trending topics from Exa
    const trendingTopics = await getTrendingTopics(category);
    
    // Get top cars from our database for context
    const { data: topCars } = await supabase
      .from('cars')
      .select('name, slug, price_avg, hp, score_driver_fun, score_value')
      .order('score_driver_fun', { ascending: false })
      .limit(20);
    
    // Generate article idea with Claude
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    
    const currentYear = new Date().getFullYear();
    
    const prompt = `You are an automotive content strategist for AutoRev, a sports car enthusiast platform.

Generate ONE highly valuable, SEO-optimized article idea for the "${category}" category.

TRENDING TOPICS RIGHT NOW:
${trendingTopics.join('\n')}

OUR TOP CARS (for context):
${topCars.map(c => `- ${c.name}: $${c.price_avg?.toLocaleString() || 'N/A'}, ${c.hp}hp`).join('\n')}

EXISTING ARTICLES (do NOT duplicate these topics):
${existingTitles.slice(-20).join('\n')}

REQUIREMENTS:
1. Title must be SEO-optimized (60-70 chars), compelling, and include "${currentYear}" if timely
2. Topic must provide GENUINE VALUE to sports car enthusiasts
3. Must be searchable - think about what people actually Google
4. For ${category}:
   ${category === 'comparisons' ? '- Focus on head-to-head comparisons, budget guides, or buyer alternatives' : ''}
   ${category === 'enthusiast' ? '- Focus on car culture, history, events, community stories' : ''}
   ${category === 'technical' ? '- Focus on mods, maintenance, DIY guides, performance tuning' : ''}

Return ONLY valid JSON with these fields:
{
  "title": "SEO-optimized title",
  "slug": "url-friendly-slug",
  "subcategory": "${getSubcategoryOptions(category)}",
  "meta_description": "150-160 char SEO description",
  "excerpt": "1-2 sentence preview",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "car_slugs": ["car-slug-if-relevant"],
  "estimated_read_time": 9
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });
    
    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('[ArticleWrite] Could not parse AI response');
      return null;
    }
    
    const idea = JSON.parse(jsonMatch[0]);
    
    // Validate slug isn't a duplicate
    if (existingSlugs.includes(idea.slug)) {
      idea.slug = `${idea.slug}-${currentYear}`;
    }
    
    // Add category
    idea.category = category;
    
    return idea;
  } catch (error) {
    console.error('[ArticleWrite] Idea generation error:', error);
    return null;
  }
}

/**
 * Get trending topics from Exa search
 */
async function getTrendingTopics(category) {
  try {
    const queries = {
      comparisons: ['best sports cars 2025', 'car comparison review', 'affordable performance cars'],
      enthusiast: ['car culture news', 'automotive events 2025', 'classic car stories'],
      technical: ['car modification guide', 'performance tuning tips', 'DIY car maintenance'],
    };
    
    const categoryQueries = queries[category] || queries.comparisons;
    let topics = [];
    
    for (const query of categoryQueries.slice(0, 2)) {
      const results = await searchExa(query, 5);
      topics = topics.concat(results.map(r => r.title).filter(Boolean));
    }
    
    return topics.slice(0, 10);
  } catch (error) {
    console.warn('[ArticleWrite] Exa search failed:', error.message);
    return [];
  }
}

function getSubcategoryOptions(category) {
  const options = {
    comparisons: 'head_to_head, three_way, best_under, best_for, alternatives, buyer_guide',
    enthusiast: 'news, culture, history, events, community',
    technical: 'mod_guide, how_to, dyno_results, maintenance, troubleshooting',
  };
  return options[category] || options.comparisons;
}

