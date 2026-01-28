/**
 * Reddit Insight Service
 * 
 * Integrates Reddit data from Apify into the community_insights table.
 * Uses the same insight extraction patterns as forum scraping but
 * adapted for Reddit's format.
 * 
 * @module lib/redditInsightService
 */

import { createClient } from '@supabase/supabase-js';

import { scrapeRedditForCarInsights, AUTOMOTIVE_SUBREDDITS } from './apifyClient.js';
import { resolveCarId } from './carResolver.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Insight types that map to community_insights.insight_type
 */
const INSIGHT_TYPES = {
  KNOWN_ISSUE: 'known_issue',
  MAINTENANCE_TIP: 'maintenance_tip',
  MODIFICATION_GUIDE: 'modification_guide',
  TROUBLESHOOTING: 'troubleshooting',
  BUYING_GUIDE: 'buying_guide',
  PERFORMANCE_DATA: 'performance_data',
  RELIABILITY_REPORT: 'reliability_report',
  COST_INSIGHT: 'cost_insight',
  COMPARISON: 'comparison',
};

/**
 * Keywords that indicate insight type from post content
 */
const INSIGHT_KEYWORDS = {
  [INSIGHT_TYPES.KNOWN_ISSUE]: [
    'issue', 'problem', 'failure', 'recall', 'broke', 'failed', 'defect',
    'warning', 'beware', 'watch out', 'heads up', 'tsb', 'common problem',
  ],
  [INSIGHT_TYPES.MAINTENANCE_TIP]: [
    'oil change', 'maintenance', 'service', 'fluid', 'filter', 'brake',
    'schedule', 'interval', 'diy', 'how to', 'tutorial',
  ],
  [INSIGHT_TYPES.MODIFICATION_GUIDE]: [
    'mod', 'upgrade', 'install', 'tune', 'intake', 'exhaust', 'suspension',
    'turbo', 'supercharger', 'wheel', 'tire', 'bolt-on', 'first mod',
  ],
  [INSIGHT_TYPES.TROUBLESHOOTING]: [
    'help', 'noise', 'sound', 'vibration', 'check engine', 'code', 'diagnose',
    'fix', 'repair', 'what could', 'any ideas',
  ],
  [INSIGHT_TYPES.BUYING_GUIDE]: [
    'buy', 'purchase', 'looking at', 'considering', 'worth it', 'should i',
    'pre-purchase', 'inspection', 'what to look for', 'year to get',
  ],
  [INSIGHT_TYPES.RELIABILITY_REPORT]: [
    'reliability', 'reliable', 'long term', 'ownership', 'miles', 'years',
    '100k', '200k', 'daily driver', 'daily driving',
  ],
  [INSIGHT_TYPES.COST_INSIGHT]: [
    'cost', 'price', 'expensive', 'cheap', 'affordable', 'budget',
    'insurance', 'maintenance cost', 'repair cost', 'parts cost',
  ],
};

/**
 * Classify a Reddit post into an insight type
 * @param {Object} post - Reddit post
 * @returns {string} Insight type
 */
function classifyInsightType(post) {
  const text = `${post.title} ${post.selftext}`.toLowerCase();
  
  let bestMatch = INSIGHT_TYPES.KNOWN_ISSUE; // Default
  let bestScore = 0;
  
  for (const [type, keywords] of Object.entries(INSIGHT_KEYWORDS)) {
    const score = keywords.filter(kw => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = type;
    }
  }
  
  return bestMatch;
}

/**
 * Calculate confidence score for a Reddit post
 * Based on engagement and content quality
 * @param {Object} post - Reddit post
 * @returns {number} Confidence score 0-1
 */
function calculateConfidence(post) {
  let score = 0.5; // Base score
  
  // Score based on upvotes
  if (post.score > 100) score += 0.2;
  else if (post.score > 50) score += 0.15;
  else if (post.score > 20) score += 0.1;
  else if (post.score > 10) score += 0.05;
  
  // Score based on comments (indicates discussion)
  if (post.numComments > 50) score += 0.15;
  else if (post.numComments > 20) score += 0.1;
  else if (post.numComments > 10) score += 0.05;
  
  // Score based on content length (more detail = better)
  const textLength = (post.selftext || '').length;
  if (textLength > 1000) score += 0.1;
  else if (textLength > 500) score += 0.05;
  
  // Cap at 0.95 (never fully certain from Reddit)
  return Math.min(score, 0.95);
}

/**
 * Calculate consensus strength
 * Higher if post has good upvote ratio
 * @param {Object} post - Reddit post
 * @returns {string} 'strong', 'moderate', or 'weak'
 */
function calculateConsensusStrength(post) {
  const ratio = post.upvoteRatio || 0.5;
  const score = post.score || 0;
  
  if (ratio > 0.9 && score > 50) return 'strong';
  if (ratio > 0.75 && score > 20) return 'moderate';
  return 'weak';
}

/**
 * Extract a summary from Reddit post content
 * @param {Object} post - Reddit post
 * @returns {string} Summary
 */
function extractSummary(post) {
  // Use title + first paragraph of selftext
  let summary = post.title;
  
  if (post.selftext) {
    const firstPara = post.selftext.split('\n\n')[0];
    if (firstPara && firstPara.length > 50) {
      summary += '. ' + firstPara.substring(0, 300);
      if (firstPara.length > 300) summary += '...';
    }
  }
  
  return summary;
}

/**
 * Transform a Reddit post into a community_insights record
 * 
 * NOTE: community_insights uses car_id (UUID) as FK to cars table.
 * The car_slug is stored in details for reference only.
 * 
 * @param {Object} post - Reddit post
 * @param {string} carSlug - Car slug (for reference)
 * @param {string} carId - Car UUID (required FK)
 * @returns {Object} Insight record
 */
function transformToInsight(post, carSlug, carId) {
  const insightType = classifyInsightType(post);
  const confidence = calculateConfidence(post);
  const consensusStrength = calculateConsensusStrength(post);
  
  return {
    car_id: carId, // FK to cars table - required
    insight_type: insightType,
    title: post.title.substring(0, 255),
    summary: extractSummary(post),
    details: {
      content: post.selftext, // Match existing schema - uses "content" not "fullText"
      tags: extractTags(post),
      all_car_slugs: [carSlug], // Match existing pattern
      source_quotes: post.selftext ? [post.selftext.substring(0, 500)] : [],
      // Reddit-specific metadata
      reddit: {
        author: post.author,
        score: post.score,
        numComments: post.numComments,
        upvoteRatio: post.upvoteRatio,
        flair: post.flair,
        createdUtc: post.createdUtc,
      },
    },
    confidence,
    consensus_strength: consensusStrength,
    source_forum: `reddit:${post.subreddit}`,
    source_urls: [post.url],
  };
}

/**
 * Extract tags from post content for categorization
 */
function extractTags(post) {
  const text = `${post.title} ${post.selftext || ''}`.toLowerCase();
  const tags = [];
  
  const tagPatterns = {
    'reliability': ['reliable', 'reliability', 'dependable'],
    'maintenance': ['maintenance', 'oil', 'service', 'brake'],
    'modification': ['mod', 'upgrade', 'tune', 'exhaust', 'intake'],
    'buying-advice': ['buy', 'purchase', 'worth', 'should i'],
    'troubleshooting': ['help', 'issue', 'problem', 'fix'],
    'track': ['track', 'autocross', 'hpde', 'racing'],
    'daily-driver': ['daily', 'commute', 'practical'],
  };
  
  for (const [tag, keywords] of Object.entries(tagPatterns)) {
    if (keywords.some(kw => text.includes(kw))) {
      tags.push(tag);
    }
  }
  
  // Add flair as tag if present
  if (post.flair) {
    tags.push(post.flair.toLowerCase().replace(/\s+/g, '-'));
  }
  
  return tags.slice(0, 5); // Max 5 tags
}

/**
 * Scrape Reddit for a car and save insights to database
 * 
 * @param {string} carSlug - Car slug (e.g., "bmw-m3-g80")
 * @param {string} carName - Human-readable name (e.g., "BMW M3 G80")
 * @param {Object} options
 * @param {number} [options.minScore=5] - Minimum upvotes to include
 * @param {number} [options.minComments=2] - Minimum comments to include
 * @returns {Promise<Object>} Results summary
 */
export async function scrapeAndSaveRedditInsights(carSlug, carName, options = {}) {
  const { minScore = 5, minComments = 2 } = options;
  
  // Resolve car_id
  const carId = await resolveCarId(carSlug);
  if (!carId) {
    console.error(`[RedditInsights] Car not found: ${carSlug}`);
    return { success: false, error: 'Car not found' };
  }
  
  // Scrape Reddit
  console.log(`[RedditInsights] Scraping Reddit for ${carName}...`);
  const posts = await scrapeRedditForCarInsights(carSlug, carName);
  
  if (!posts || posts.length === 0) {
    console.log(`[RedditInsights] No posts found for ${carName}`);
    return { success: true, postsFound: 0, insightsSaved: 0 };
  }
  
  console.log(`[RedditInsights] Found ${posts.length} posts, filtering...`);
  
  // Filter by quality
  const qualityPosts = posts.filter(post => 
    post.score >= minScore && 
    post.numComments >= minComments &&
    post.selftext && post.selftext.length > 100 // Has substantive content
  );
  
  console.log(`[RedditInsights] ${qualityPosts.length} posts pass quality filter`);
  
  // Transform to insights
  const insights = qualityPosts.map(post => 
    transformToInsight(post, carSlug, carId)
  );
  
  // Check for existing insights to avoid duplicates (using car_id, not car_slug)
  const { data: existing } = await supabase
    .from('community_insights')
    .select('source_urls')
    .eq('car_id', carId)
    .ilike('source_forum', 'reddit:%'); // All Reddit sources for this car
  
  const existingUrls = new Set(
    existing?.flatMap(e => e.source_urls) || []
  );
  
  // Filter out duplicates
  const newInsights = insights.filter(insight => 
    !existingUrls.has(insight.source_urls[0])
  );
  
  console.log(`[RedditInsights] ${newInsights.length} new insights to save`);
  
  if (newInsights.length === 0) {
    return { 
      success: true, 
      postsFound: posts.length,
      qualityPosts: qualityPosts.length,
      insightsSaved: 0,
      message: 'All insights already exist',
    };
  }
  
  // Save to database
  const { data, error } = await supabase
    .from('community_insights')
    .insert(newInsights)
    .select('id');
  
  if (error) {
    console.error(`[RedditInsights] Error saving:`, error);
    return { success: false, error: error.message };
  }
  
  console.log(`[RedditInsights] Saved ${data.length} insights for ${carName}`);
  
  return {
    success: true,
    postsFound: posts.length,
    qualityPosts: qualityPosts.length,
    insightsSaved: data.length,
    carSlug,
    carId,
  };
}

/**
 * Batch scrape Reddit for multiple cars
 * 
 * @param {Array<{slug: string, name: string}>} cars - Cars to scrape
 * @param {Object} options - Options passed to scrapeAndSaveRedditInsights
 * @returns {Promise<Object[]>} Results for each car
 */
export async function batchScrapeRedditInsights(cars, options = {}) {
  const results = [];
  
  for (const car of cars) {
    console.log(`\n[RedditInsights] Processing ${car.name}...`);
    
    const result = await scrapeAndSaveRedditInsights(car.slug, car.name, options);
    results.push({ ...car, ...result });
    
    // Rate limit: wait 2s between cars to avoid Apify rate limits
    await new Promise(r => setTimeout(r, 2000));
  }
  
  const totalInsights = results.reduce((sum, r) => sum + (r.insightsSaved || 0), 0);
  console.log(`\n[RedditInsights] Batch complete: ${totalInsights} total insights saved`);
  
  return results;
}

/**
 * Get cars that have few or no Reddit insights
 * @param {number} limit - Max cars to return
 * @returns {Promise<Array>}
 */
export async function getCarsNeedingRedditInsights(limit = 20) {
  // Get cars with their IDs
  const { data: cars } = await supabase
    .from('cars')
    .select('id, slug, name')
    .order('name');
  
  // Get Reddit insight counts by car_id
  const { data: insightCounts } = await supabase
    .from('community_insights')
    .select('car_id')
    .ilike('source_forum', 'reddit:%');
  
  // Count insights per car_id
  const countMap = {};
  insightCounts?.forEach(i => {
    if (i.car_id) {
      countMap[i.car_id] = (countMap[i.car_id] || 0) + 1;
    }
  });
  
  // Find cars with 0 or few Reddit insights
  const carsNeedingInsights = cars
    .filter(car => (countMap[car.id] || 0) < 5)
    .slice(0, limit);
  
  return carsNeedingInsights;
}

const redditInsightService = {
  scrapeAndSaveRedditInsights,
  batchScrapeRedditInsights,
  getCarsNeedingRedditInsights,
  INSIGHT_TYPES,
  AUTOMOTIVE_SUBREDDITS,
};

export default redditInsightService;
