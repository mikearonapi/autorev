/**
 * Article Generation Service
 * 
 * Uses AI to generate SEO-optimized article content with proper structure,
 * soft CTAs, and automotive expertise.
 * 
 * @module lib/articleGenerationService
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';
import { createArticleHeroImage } from './articleImageService';
import { ARTICLE_CATEGORIES } from './articlesService';

// =============================================================================
// CONFIGURATION
// =============================================================================

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Target word counts for SEO optimization
const SEO_WORD_COUNTS = {
  minimum: 1500,
  optimal: 1800,
  maximum: 2400,
};

// CTA templates by category
const CTA_TEMPLATES = {
  comparisons: [
    { text: 'Want to see detailed specs for these cars? <a href="/browse-cars">Browse our complete database</a> to compare side by side.', context: 'after conclusion' },
    { text: 'Can\'t decide between these options? <a href="/car-selector">Take our Sports Car Match quiz</a> to find your perfect match.', context: 'mid-article' },
    { text: 'Curious which car fits your lifestyle? <a href="/al">Ask AL, our AI automotive expert</a>, for personalized recommendations.', context: 'after conclusion' },
  ],
  enthusiast: [
    { text: 'Looking for automotive events near you? <a href="/community/events">Check our events calendar</a> for meets, shows, and track days.', context: 'for events' },
    { text: 'Want to learn more about these cars? <a href="/encyclopedia">Explore our automotive encyclopedia</a> for detailed history and specs.', context: 'for history' },
    { text: 'Share your passion with other enthusiasts! <a href="/community/builds">Browse community builds</a> and share your own.', context: 'for community' },
  ],
  technical: [
    { text: 'Planning this modification? <a href="/tuning-shop">Use our Tuning Shop</a> to document your build and track progress.', context: 'for mods' },
    { text: 'Tracking your maintenance schedule? <a href="/garage">My Garage</a> helps you log service intervals and set reminders.', context: 'for maintenance' },
    { text: 'Want to see what others have done? <a href="/tuning-shop">Browse builds</a> in our Tuning Shop for inspiration.', context: 'general' },
  ],
};

// =============================================================================
// CONTENT GENERATION
// =============================================================================

/**
 * Generate full article content using Claude
 * 
 * @param {Object} articleIdea - Article idea with title, slug, etc.
 * @returns {Promise<{success: boolean, content?: Object, error?: string}>}
 */
export async function generateArticleContent(articleIdea) {
  if (!ANTHROPIC_API_KEY) {
    return { success: false, error: 'ANTHROPIC_API_KEY not configured' };
  }
  
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const categoryInfo = ARTICLE_CATEGORIES[articleIdea.category] || {};
  
  const prompt = buildContentPrompt(articleIdea, categoryInfo);
  
  try {
    console.log(`[ArticleGen] Generating content for: ${articleIdea.title}`);
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });
    
    const content = response.content[0].text;
    
    // Parse the structured response
    const parsed = parseArticleResponse(content, articleIdea);
    
    if (!parsed.content_html) {
      return { success: false, error: 'Failed to parse article content' };
    }
    
    // Add soft CTA
    parsed.content_html = injectCTA(parsed.content_html, articleIdea.category, articleIdea.subcategory);
    
    console.log(`[ArticleGen] Generated ${countWords(parsed.content_html)} words`);
    
    return { success: true, content: parsed };
  } catch (error) {
    console.error('[ArticleGen] Generation error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Build the content generation prompt
 * IMPROVED: Based on QA learnings - includes year awareness, contextual accuracy, and value requirements
 */
function buildContentPrompt(articleIdea, categoryInfo) {
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  
  // Extract price context if present
  const priceMatch = articleIdea.title.match(/under\s*\$?(\d+)k?/i) || articleIdea.title.match(/\$?(\d+)k?\s*budget/i);
  let priceContext = '';
  if (priceMatch) {
    const maxPrice = parseInt(priceMatch[1]) * (priceMatch[1].length <= 3 ? 1000 : 1);
    priceContext = `\n- PRICE CONSTRAINT: Article focuses on cars under $${maxPrice.toLocaleString()}. ONLY mention cars realistically available at this price point. Do NOT mention supercars, hypercars, or vehicles costing significantly more.`;
    
    // Suggest appropriate cars based on budget
    if (maxPrice <= 30000) {
      priceContext += `\n- APPROPRIATE CARS: Mazda MX-5 Miata, Toyota GR86, Subaru BRZ, VW Golf GTI, Ford Mustang EcoBoost, Civic Si`;
    } else if (maxPrice <= 50000) {
      priceContext += `\n- APPROPRIATE CARS: Toyota GR Supra, Nissan Z, Ford Mustang GT, Porsche Boxster (used), BMW M240i, Camaro SS, S2000`;
    } else if (maxPrice <= 75000) {
      priceContext += `\n- APPROPRIATE CARS: BMW M3/M4, Porsche Cayman S, Corvette Stingray, Mustang GT350, Mercedes-AMG C63`;
    }
  }

  return `You are AL, AutoRev's expert AI automotive journalist. Write a comprehensive, SEO-optimized article that provides GENUINE VALUE to sports car enthusiasts.

ARTICLE DETAILS:
- Title: ${articleIdea.title}
- Category: ${articleIdea.category} (${categoryInfo.name || ''})
- Subcategory: ${articleIdea.subcategory}
- Target Keywords: ${(articleIdea.tags || []).join(', ')}
${articleIdea.car_slugs?.length ? `- Featured Cars: ${articleIdea.car_slugs.join(', ')}` : ''}${priceContext}

CRITICAL REQUIREMENTS:

1. DATE AWARENESS (CRITICAL):
   - Current year is ${currentYear}
   - Use "${currentYear}" for current/new releases, latest information
   - Use "${lastYear}" for recent/last year references
   - NEVER use years like 2024 or earlier as "current" - these are outdated
   - For pricing, use ${currentYear} MSRP or specify "as of ${currentYear}"

2. LENGTH: Write ${SEO_WORD_COUNTS.optimal}-${SEO_WORD_COUNTS.maximum} words (MINIMUM ${SEO_WORD_COUNTS.minimum})
   - This is non-negotiable for SEO
   - Every section must have substance - NO filler

3. CONTEXTUAL ACCURACY:
   - Only mention cars that make sense for the article's topic
   - If discussing budget cars, don't mention $300k supercars
   - Use specific, accurate specs and pricing${priceContext ? '\n   - RESPECT THE PRICE CONSTRAINT ABOVE' : ''}

4. GENUINE VALUE (NO FLUFF):
   - Include specific numbers: horsepower, 0-60 times, prices, lap times
   - Provide actionable advice readers can actually use
   - Compare pros/cons with real data
   - Share insider knowledge enthusiasts would appreciate
   - For technical articles: include step-by-step guidance, costs, difficulty levels

5. STRUCTURE:
   - Use proper HTML: <h2>, <h3>, <p>, <ul>/<li>, <strong>
   - Opening: Hook + establish relevance (2-3 paragraphs)
   - Main sections: 4-6 detailed sections with h2 headings
   - Subsections: Use h3 for deeper dives
   - Conclusion: Clear takeaways, not just summary

6. TONE:
   - Authoritative but approachable
   - Enthusiast-to-enthusiast, not marketing speak
   - Data-driven, not opinion-driven
   - Passionate about cars, not just informative

DO NOT INCLUDE:
- Any CTA links (we add those separately)
- Placeholder text like [INSERT X]
- Generic filler content ("In conclusion...", "As we've seen...")
- Outdated year references (2024 or earlier as "current")
- Cars that don't match the article's price/category context

RETURN FORMAT:
Return ONLY the HTML content wrapped in <article> tags. No markdown, no explanations.
Start directly with <article> and end with </article>.`;
}

/**
 * Parse the AI response into structured content
 */
function parseArticleResponse(response, articleIdea) {
  // Extract content between article tags
  const articleMatch = response.match(/<article>([\s\S]*?)<\/article>/i);
  let htmlContent = articleMatch ? articleMatch[1].trim() : response.trim();
  
  // Clean up the content
  htmlContent = htmlContent
    .replace(/<article>/gi, '')
    .replace(/<\/article>/gi, '')
    .trim();
  
  // Ensure proper structure
  if (!htmlContent.startsWith('<')) {
    htmlContent = `<p>${htmlContent}</p>`;
  }
  
  return {
    content_html: htmlContent,
    word_count: countWords(htmlContent),
  };
}

/**
 * Count words in HTML content
 */
function countWords(html) {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').length;
}

/**
 * Inject a soft CTA at the end of the article
 */
function injectCTA(content, category, subcategory) {
  const templates = CTA_TEMPLATES[category] || CTA_TEMPLATES.comparisons;
  
  // Select appropriate CTA based on subcategory
  let selectedCTA = templates[0]; // Default
  
  if (subcategory) {
    if (subcategory.includes('event')) {
      selectedCTA = templates.find(t => t.context.includes('event')) || selectedCTA;
    } else if (subcategory.includes('history')) {
      selectedCTA = templates.find(t => t.context.includes('history')) || selectedCTA;
    } else if (subcategory.includes('maintenance')) {
      selectedCTA = templates.find(t => t.context.includes('maintenance')) || selectedCTA;
    }
  }
  
  // Add CTA paragraph at the end
  const ctaHtml = `\n\n<p class="article-cta">${selectedCTA.text}</p>`;
  
  return content + ctaHtml;
}

// =============================================================================
// FULL ARTICLE CREATION
// =============================================================================

/**
 * Create a complete article with content and image
 * 
 * @param {Object} articleIdea - Article idea from research service
 * @param {Object} options - Options like generateImage
 * @returns {Promise<{success: boolean, articleId?: string, error?: string}>}
 */
export async function createCompleteArticle(articleIdea, options = {}) {
  const { generateImage = true, publishImmediately = false } = options;
  
  console.log(`[ArticleGen] Creating complete article: ${articleIdea.title}`);
  
  try {
    // 1. Generate content
    const contentResult = await generateArticleContent(articleIdea);
    if (!contentResult.success) {
      return { success: false, error: `Content generation failed: ${contentResult.error}` };
    }
    
    // 2. Generate hero image (optional)
    let heroImageUrl = null;
    if (generateImage) {
      const imageResult = await createArticleHeroImage(articleIdea);
      if (imageResult.success) {
        heroImageUrl = imageResult.imageUrl;
      } else {
        console.warn(`[ArticleGen] Image generation failed: ${imageResult.error}`);
      }
    }
    
    // 3. Prepare article data
    const articleData = {
      slug: articleIdea.slug,
      title: articleIdea.title,
      category: articleIdea.category,
      subcategory: articleIdea.subcategory || null,
      meta_description: articleIdea.meta_description,
      excerpt: articleIdea.excerpt,
      content_html: contentResult.content.content_html,
      hero_image_url: heroImageUrl,
      car_slugs: articleIdea.car_slugs || null,
      tags: articleIdea.tags || null,
      read_time_minutes: articleIdea.estimated_read_time || Math.ceil(contentResult.content.word_count / 200),
      author_name: 'AL',
      is_published: publishImmediately,
      published_at: publishImmediately ? new Date().toISOString() : null,
    };
    
    // 4. Insert into database
    const { data, error } = await supabase
      .from('al_articles')
      .insert(articleData)
      .select('id')
      .single();
    
    if (error) {
      // Check if it's a duplicate
      if (error.code === '23505') {
        return { success: false, error: 'Article with this slug already exists' };
      }
      return { success: false, error: error.message };
    }
    
    console.log(`[ArticleGen] Created article: ${data.id}`);
    return { success: true, articleId: data.id, slug: articleIdea.slug };
  } catch (error) {
    console.error('[ArticleGen] Creation error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Publish a draft article
 * 
 * @param {string} articleId - Article UUID
 * @param {Date} publishDate - When to set as published_at
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function publishArticle(articleId, publishDate = new Date()) {
  try {
    const { error } = await supabase
      .from('al_articles')
      .update({
        is_published: true,
        published_at: publishDate.toISOString(),
      })
      .eq('id', articleId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get next unpublished article from pipeline
 * 
 * @returns {Promise<Object|null>} - Next article to publish
 */
export async function getNextArticleToPublish() {
  const { data, error } = await supabase
    .from('al_articles')
    .select('*')
    .eq('is_published', false)
    .not('content_html', 'is', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data;
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Generate multiple articles from pipeline
 * 
 * @param {Array} articleIdeas - Array of article ideas
 * @param {Object} options - Options for generation
 * @returns {Promise<Object>} - Results summary
 */
export async function batchGenerateArticles(articleIdeas, options = {}) {
  const { generateImages = true, delayMs = 5000 } = options;
  
  const results = {
    success: [],
    failed: [],
    total: articleIdeas.length,
  };
  
  for (const idea of articleIdeas) {
    const result = await createCompleteArticle(idea, { generateImage: generateImages });
    
    if (result.success) {
      results.success.push({ slug: idea.slug, articleId: result.articleId });
    } else {
      results.failed.push({ slug: idea.slug, error: result.error });
    }
    
    // Delay between articles
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.log(`[ArticleGen] Batch complete: ${results.success.length}/${results.total} succeeded`);
  return results;
}

