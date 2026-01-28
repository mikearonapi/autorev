/**
 * Article Research Service
 * 
 * Uses Exa search to discover trending automotive topics for content creation.
 * Generates monthly article pipelines based on search trends and user interests.
 * 
 * @module lib/articleResearchService
 */

import Anthropic from '@anthropic-ai/sdk';

import { supabase } from './supabase';

// =============================================================================
// CONFIGURATION
// =============================================================================

const EXA_API_KEY = process.env.EXA_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Article categories and their search focus areas
const CATEGORY_RESEARCH_QUERIES = {
  comparisons: [
    'best sports cars comparison 2025',
    'vs review head to head new cars',
    'car buying guide comparison which to choose',
    'affordable sports cars under price',
    'best performance sedans comparison',
    'luxury sports car vs alternatives',
    'new car reviews comparison test',
  ],
  enthusiast: [
    'car culture news automotive trends',
    'automotive history classic cars stories',
    'car meets events community',
    'future of sports cars electric performance',
    'JDM culture japanese cars import',
    'car photography tips automotive',
    'racing history motorsport heritage',
  ],
  technical: [
    'car modification guide how to upgrade',
    'performance tuning tips aftermarket',
    'suspension setup handling improvement',
    'ECU tuning boost performance gains',
    'brake upgrade guide stopping power',
    'exhaust system upgrade sound performance',
    'maintenance tips enthusiast cars',
  ],
};

// Subcategory mappings
const _SUBCATEGORY_MAPPING = {
  comparisons: {
    keywords: {
      'vs': 'head_to_head',
      'versus': 'head_to_head',
      'comparison': 'head_to_head',
      'best under': 'best_under',
      'affordable': 'best_under',
      'budget': 'best_under',
      'buyer guide': 'buyer_guide',
      'buying': 'buyer_guide',
      'alternative': 'alternatives',
      'instead of': 'alternatives',
      'three': 'three_way',
      'showdown': 'three_way',
    },
    default: 'buyer_guide',
  },
  enthusiast: {
    keywords: {
      'news': 'news',
      'announce': 'news',
      'reveal': 'news',
      'history': 'history',
      'heritage': 'history',
      'classic': 'history',
      'culture': 'culture',
      'community': 'community',
      'meet': 'events',
      'event': 'events',
      'show': 'events',
    },
    default: 'culture',
  },
  technical: {
    keywords: {
      'mod': 'mod_guide',
      'upgrade': 'mod_guide',
      'install': 'mod_guide',
      'how to': 'how_to',
      'diy': 'how_to',
      'guide': 'how_to',
      'dyno': 'dyno_results',
      'power': 'dyno_results',
      'maintenance': 'maintenance',
      'service': 'maintenance',
      'troubleshoot': 'troubleshooting',
      'problem': 'troubleshooting',
    },
    default: 'mod_guide',
  },
};

// =============================================================================
// EXA SEARCH
// =============================================================================

/**
 * Search Exa for trending automotive topics
 * 
 * @param {string} query - Search query
 * @param {number} numResults - Number of results to return
 * @returns {Promise<Array>} - Search results
 */
async function searchExa(query, numResults = 10) {
  if (!EXA_API_KEY) {
    console.warn('[ArticleResearch] EXA_API_KEY not configured');
    return [];
  }
  
  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY,
      },
      body: JSON.stringify({
        query,
        num_results: numResults,
        use_autoprompt: true,
        type: 'auto',
        category: 'news',
        start_published_date: getDateMonthsAgo(3), // Last 3 months
        contents: {
          text: { max_characters: 500 },
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Exa API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('[ArticleResearch] Exa search error:', error);
    return [];
  }
}

/**
 * Get ISO date string for N months ago
 */
function getDateMonthsAgo(months) {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().split('T')[0];
}

// =============================================================================
// TOPIC ANALYSIS
// =============================================================================

/**
 * Use Claude to analyze search results and generate article ideas
 * 
 * @param {Array} searchResults - Combined search results
 * @param {string} category - Article category
 * @param {Array} existingArticles - Existing article slugs to avoid duplicates
 * @returns {Promise<Array>} - Article ideas
 */
async function analyzeTopicsWithAI(searchResults, category, existingArticles = []) {
  if (!ANTHROPIC_API_KEY) {
    console.warn('[ArticleResearch] ANTHROPIC_API_KEY not configured');
    return [];
  }
  
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  
  // Prepare context
  const searchContext = searchResults.slice(0, 20).map(r => ({
    title: r.title,
    snippet: r.text?.slice(0, 200),
    url: r.url,
  }));
  
  const existingSlugs = existingArticles.join(', ');
  
  const prompt = `You are an automotive content strategist for AutoRev, a sports car enthusiast platform.

Based on these trending automotive topics and searches, generate 10 unique article ideas for the "${category}" category.

TRENDING TOPICS:
${JSON.stringify(searchContext, null, 2)}

EXISTING ARTICLES (avoid similar topics):
${existingSlugs || 'None yet'}

CATEGORY GUIDELINES:
${getCategoryGuidelines(category)}

Generate exactly 10 article ideas. For each, provide:
1. title: SEO-optimized title (60-70 chars)
2. slug: URL-friendly slug (lowercase, hyphens)
3. subcategory: ${getSubcategoryOptions(category)}
4. meta_description: 150-160 character SEO description
5. excerpt: 1-2 sentence preview
6. tags: Array of 4-6 relevant tags
7. car_slugs: Array of relevant car slugs if applicable (format: "2024-brand-model")
8. estimated_read_time: Minutes (7-12 for most articles)

Return ONLY valid JSON array. No markdown, no explanation.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });
    
    const content = response.content[0].text;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[ArticleResearch] Could not parse AI response');
      return [];
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('[ArticleResearch] AI analysis error:', error);
    return [];
  }
}

function getCategoryGuidelines(category) {
  const guidelines = {
    comparisons: `
- Focus on head-to-head comparisons, buyer guides, and "best of" lists
- Include specific car models when relevant
- Target buyers researching purchase decisions
- Example: "2025 Toyota Supra vs Nissan Z: Which Japanese Sports Car?"`,
    enthusiast: `
- Cover car culture, history, events, and community stories
- Appeal to passionate enthusiasts who love cars beyond ownership
- Include historical context and cultural significance
- Example: "The Complete Guide to Cars & Coffee Events"`,
    technical: `
- Provide actionable modification and maintenance guides
- Include technical details and real-world results
- Help enthusiasts improve their cars
- Example: "Suspension Tuning 101: Getting Your Setup Right"`,
  };
  return guidelines[category] || guidelines.comparisons;
}

function getSubcategoryOptions(category) {
  const options = {
    comparisons: 'head_to_head, three_way, best_under, best_for, alternatives, buyer_guide',
    enthusiast: 'news, culture, history, events, community',
    technical: 'mod_guide, how_to, dyno_results, maintenance, troubleshooting',
  };
  return options[category] || options.comparisons;
}

// =============================================================================
// DEDUPLICATION
// =============================================================================

/**
 * Check if a topic is too similar to existing articles
 * 
 * @param {string} title - Proposed title
 * @param {Array} existingTitles - Existing article titles
 * @returns {boolean} - True if topic is unique enough
 */
function isUniqueEnough(title, existingTitles) {
  const normalizedNew = normalizeForComparison(title);
  
  for (const existing of existingTitles) {
    const normalizedExisting = normalizeForComparison(existing);
    const similarity = calculateSimilarity(normalizedNew, normalizedExisting);
    
    if (similarity > 0.6) {
      console.log(`[ArticleResearch] Skipping similar topic: "${title}" ~= "${existing}"`);
      return false;
    }
  }
  
  return true;
}

function normalizeForComparison(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .sort()
    .join(' ');
}

function calculateSimilarity(a, b) {
  const wordsA = new Set(a.split(' '));
  const wordsB = new Set(b.split(' '));
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size; // Jaccard similarity
}

// =============================================================================
// MAIN RESEARCH FUNCTION
// =============================================================================

/**
 * Research and generate article pipeline for a specific category
 * 
 * @param {string} category - Article category
 * @param {number} count - Number of articles to generate
 * @returns {Promise<Array>} - Article ideas
 */
export async function researchCategoryTopics(category, count = 10) {
  console.log(`[ArticleResearch] Researching ${count} topics for category: ${category}`);
  
  // Get existing articles to avoid duplicates
  const { data: existingArticles } = await supabase
    .from('al_articles')
    .select('slug, title')
    .eq('category', category);
  
  const existingSlugs = (existingArticles || []).map(a => a.slug);
  const existingTitles = (existingArticles || []).map(a => a.title);
  
  // Search for trending topics
  const queries = CATEGORY_RESEARCH_QUERIES[category] || [];
  let allResults = [];
  
  for (const query of queries.slice(0, 3)) {
    const results = await searchExa(query, 5);
    allResults = allResults.concat(results);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
  }
  
  // Generate article ideas with AI
  const ideas = await analyzeTopicsWithAI(allResults, category, existingSlugs);
  
  // Filter out duplicates
  const uniqueIdeas = ideas.filter(idea => 
    !existingSlugs.includes(idea.slug) && 
    isUniqueEnough(idea.title, existingTitles)
  );
  
  console.log(`[ArticleResearch] Generated ${uniqueIdeas.length} unique ideas`);
  return uniqueIdeas.slice(0, count);
}

/**
 * Generate complete monthly article pipeline
 * 
 * @param {number} articlesPerCategory - Articles per category (default 10)
 * @returns {Promise<Object>} - Pipeline with articles for each category
 */
export async function generateMonthlyPipeline(articlesPerCategory = 10) {
  console.log('[ArticleResearch] Generating monthly article pipeline...');
  
  const pipeline = {
    generatedAt: new Date().toISOString(),
    month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    categories: {},
    totalArticles: 0,
  };
  
  for (const category of ['comparisons', 'enthusiast', 'technical']) {
    const ideas = await researchCategoryTopics(category, articlesPerCategory);
    pipeline.categories[category] = ideas;
    pipeline.totalArticles += ideas.length;
    
    // Delay between categories
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`[ArticleResearch] Pipeline complete: ${pipeline.totalArticles} articles`);
  return pipeline;
}

/**
 * Save pipeline to database
 * 
 * @param {Object} pipeline - Generated pipeline
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function savePipelineToDatabase(pipeline) {
  try {
    // Insert into article_pipeline table (we'll create this)
    const { error } = await supabase
      .from('article_pipeline')
      .insert({
        month: pipeline.month,
        generated_at: pipeline.generatedAt,
        pipeline_data: pipeline,
        status: 'pending',
        articles_published: 0,
        articles_total: pipeline.totalArticles,
      });
    
    if (error) {
      // Table might not exist yet, that's ok
      console.warn('[ArticleResearch] Could not save pipeline:', error.message);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('[ArticleResearch] Save error:', error);
    return { success: false, error: error.message };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  searchExa,
  isUniqueEnough,
  CATEGORY_RESEARCH_QUERIES,
};

