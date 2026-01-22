/**
 * Apify Client Integration
 * 
 * Unified client for running Apify actors (scrapers) to supplement
 * our custom scrapers with maintained, anti-bot-resistant solutions.
 * 
 * Currently supports:
 * - Bring a Trailer auctions (parseforge/bringatrailer-auctions-scraper)
 * - Reddit posts/comments (crawlerbros/reddit-scraper)
 * 
 * @module lib/apifyClient
 */

import { ApifyClient } from 'apify-client';

// Singleton client instance
let client = null;

/**
 * Get or create the Apify client instance
 * @returns {ApifyClient}
 */
function getClient() {
  if (!client) {
    const token = process.env.APIFY_API_TOKEN;
    if (!token) {
      throw new Error('APIFY_API_TOKEN environment variable is required');
    }
    client = new ApifyClient({ token });
  }
  return client;
}

/**
 * Check if Apify is configured
 * @returns {boolean}
 */
export function isApifyConfigured() {
  return !!process.env.APIFY_API_TOKEN;
}

// ============================================================================
// BRING A TRAILER SCRAPER
// Actor: parseforge/bringatrailer-auctions-scraper
// Docs: https://apify.com/parseforge/bringatrailer-auctions-scraper
// ============================================================================

/**
 * @typedef {Object} BaTAuctionResult
 * @property {string} title - Auction title
 * @property {string} url - Auction URL
 * @property {number|null} currentBid - Current/final bid amount
 * @property {string} timeRemaining - Time remaining or "Ended"
 * @property {string} status - Auction status
 * @property {Object} vehicle - Vehicle details (year, make, model, mileage)
 * @property {Object} seller - Seller information
 * @property {string[]} highlights - Key features
 * @property {string} imageUrl - Main image
 * @property {string} scrapedAt - Timestamp
 */

/**
 * Search Bring a Trailer completed auctions using Apify
 * This is more reliable than our custom scraper which faces Cloudflare blocks
 * 
 * @param {string} searchQuery - Search query (e.g., "Porsche 911 GT3")
 * @param {Object} options
 * @param {number} [options.maxItems=50] - Maximum results to return
 * @param {boolean} [options.completedOnly=true] - Only completed auctions
 * @returns {Promise<BaTAuctionResult[]>}
 */
export async function scrapeBringATrailer(searchQuery, options = {}) {
  const { maxItems = 50, completedOnly = true } = options;
  
  if (!isApifyConfigured()) {
    console.warn('[Apify] Not configured, falling back to custom scraper');
    return null; // Caller should fall back to custom scraper
  }
  
  try {
    console.log(`[Apify/BaT] Searching for: "${searchQuery}" (max: ${maxItems})`);
    
    const apify = getClient();
    
    // Run the BaT scraper actor
    const run = await apify.actor('parseforge/bringatrailer-auctions-scraper').call({
      searchQuery,
      maxItems,
      proxyConfiguration: { useApifyProxy: true },
    });
    
    // Fetch results from the dataset
    const { items } = await apify.dataset(run.defaultDatasetId).listItems();
    
    console.log(`[Apify/BaT] Retrieved ${items.length} auctions`);
    
    // Normalize to our format
    return items.map(normalizeApifyBaTResult);
  } catch (error) {
    console.error(`[Apify/BaT] Error:`, error.message);
    return null; // Caller should fall back
  }
}

/**
 * Normalize Apify BaT result to match our existing BaT scraper format
 * @param {Object} item - Raw Apify result
 * @returns {BaTAuctionResult}
 */
function normalizeApifyBaTResult(item) {
  // Extract year, make, model from title if not provided
  const titleParts = parseVehicleFromTitle(item.title);
  
  // Determine sold status
  const isSold = item.status?.toLowerCase() === 'sold' || 
                 item.timeRemaining?.toLowerCase() === 'ended' ||
                 item.currentBid > 0;
  
  const reserveNotMet = item.title?.toLowerCase().includes('reserve not met') ||
                        item.status?.toLowerCase().includes('reserve');
  
  return {
    id: item.url?.split('/').pop() || null,
    title: item.title,
    url: item.url,
    soldPrice: isSold && !reserveNotMet ? item.currentBid : null,
    highBid: item.currentBid,
    year: item.vehicle?.year || titleParts.year,
    make: item.vehicle?.make || titleParts.make,
    model: item.vehicle?.model || titleParts.model,
    mileage: item.vehicle?.mileage || null,
    transmission: item.vehicle?.transmission || null,
    location: item.seller?.location || null,
    endDate: item.endDate || null,
    sold: isSold && !reserveNotMet,
    reserveNotMet,
    bidCount: item.bidCount || null,
    commentCount: item.commentCount || null,
    thumbnailUrl: item.imageUrl || null,
    highlights: item.highlights || [],
    source: 'apify',
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Parse vehicle info from BaT title
 * @param {string} title 
 * @returns {Object}
 */
function parseVehicleFromTitle(title) {
  if (!title) return { year: null, make: null, model: null };
  
  const match = title.match(/^(\d{4})\s+([A-Za-z-]+)\s+(.+?)(?:\s*[-–]\s*|$)/);
  if (match) {
    return {
      year: parseInt(match[1]),
      make: match[2],
      model: match[3].trim(),
    };
  }
  
  const yearMatch = title.match(/\b(19|20)\d{2}\b/);
  return { 
    year: yearMatch ? parseInt(yearMatch[0]) : null, 
    make: null, 
    model: null 
  };
}

// ============================================================================
// REDDIT SCRAPER
// Actor: crawlerbros/reddit-scraper (5.0 rating, $2.50/1K results)
// Docs: https://apify.com/crawlerbros/reddit-scraper
// ============================================================================

/**
 * @typedef {Object} RedditPost
 * @property {string} id - Post ID
 * @property {string} title - Post title
 * @property {string} selftext - Post body text
 * @property {string} url - Reddit URL
 * @property {string} subreddit - Subreddit name
 * @property {string} author - Author username
 * @property {number} score - Upvotes minus downvotes
 * @property {number} numComments - Comment count
 * @property {string} createdUtc - Creation timestamp
 * @property {string} flair - Post flair
 * @property {boolean} isStickied - Is pinned
 * @property {Object[]} comments - Top comments (if included)
 */

/**
 * Automotive subreddits relevant to AutoRev
 */
export const AUTOMOTIVE_SUBREDDITS = {
  // General
  cars: 'r/cars',
  autos: 'r/Autos',
  carporn: 'r/carporn',
  projectcar: 'r/projectcar',
  mechanicadvice: 'r/MechanicAdvice',
  cartalk: 'r/Cartalk',
  whatcarshouldibuy: 'r/whatcarshouldIBuy',
  
  // Brand-specific
  bmw: 'r/BMW',
  porsche: 'r/Porsche',
  miata: 'r/Miata',
  subaru: 'r/subaru',
  wrx: 'r/WRX',
  mustang: 'r/Mustang',
  corvette: 'r/Corvette',
  toyota: 'r/Toyota',
  honda: 'r/Honda',
  mazda: 'r/mazda',
  ford: 'r/Ford',
  chevrolet: 'r/Chevrolet',
  nissan: 'r/Nissan',
  lexus: 'r/Lexus',
  audi: 'r/Audi',
  mercedes: 'r/mercedes_benz',
  volkswagen: 'r/Volkswagen',
  
  // Enthusiast/Track
  trackdays: 'r/Trackdays',
  autocross: 'r/Autocross',
  carmodification: 'r/CarModification',
};

/**
 * Scrape Reddit posts from a subreddit
 * 
 * @param {string} subreddit - Subreddit name (e.g., "cars" or "BMW")
 * @param {Object} options
 * @param {string} [options.searchQuery] - Optional search within subreddit
 * @param {number} [options.maxPosts=100] - Maximum posts to return
 * @param {string} [options.sort='hot'] - Sort by: hot, new, top, rising
 * @param {string} [options.time='all'] - Time filter: hour, day, week, month, year, all
 * @param {boolean} [options.includeComments=false] - Include top comments
 * @returns {Promise<RedditPost[]>}
 */
export async function scrapeReddit(subreddit, options = {}) {
  const { 
    searchQuery = null,
    maxPosts = 100, 
    sort = 'hot',
    time = 'all',
    includeComments = false,
  } = options;
  
  if (!isApifyConfigured()) {
    console.warn('[Apify] Not configured');
    return null;
  }
  
  try {
    // Normalize subreddit name (remove r/ prefix if present)
    const subName = subreddit.replace(/^r\//i, '');
    
    console.log(`[Apify/Reddit] Scraping r/${subName} (max: ${maxPosts}, sort: ${sort})`);
    
    const apify = getClient();
    
    // Build input for crawlerbros/reddit-scraper
    const input = {
      subreddits: [subName],
      maxPosts,
      sort,
      time,
    };
    
    // Add search query if provided
    if (searchQuery) {
      input.searchQuery = searchQuery;
    }
    
    // Run the Reddit scraper actor
    const run = await apify.actor('crawlerbros/reddit-scraper').call(input);
    
    // Fetch results from the dataset
    const { items } = await apify.dataset(run.defaultDatasetId).listItems();
    
    console.log(`[Apify/Reddit] Retrieved ${items.length} posts from r/${subName}`);
    
    // Normalize to our format
    return items.map(normalizeApifyRedditPost);
  } catch (error) {
    console.error(`[Apify/Reddit] Error:`, error.message);
    return null;
  }
}

/**
 * Search Reddit for car-related content across multiple subreddits
 * 
 * @param {string} query - Search query (e.g., "BMW M3 reliability issues")
 * @param {Object} options
 * @param {string[]} [options.subreddits] - Subreddits to search (defaults to general car subs)
 * @param {number} [options.maxPostsPerSub=50] - Max posts per subreddit
 * @param {string} [options.sort='relevance'] - Sort by: relevance, hot, top, new
 * @param {string} [options.time='year'] - Time filter
 * @returns {Promise<RedditPost[]>}
 */
export async function searchRedditForCar(query, options = {}) {
  const {
    subreddits = ['cars', 'Autos', 'whatcarshouldIBuy', 'MechanicAdvice'],
    maxPostsPerSub = 50,
    sort = 'top', // crawlerbros/reddit-scraper supports: hot, new, top, rising, controversial
    time = 'year',
  } = options;
  
  if (!isApifyConfigured()) {
    console.warn('[Apify] Not configured');
    return null;
  }
  
  try {
    console.log(`[Apify/Reddit] Searching "${query}" in ${subreddits.length} subreddits`);
    
    const apify = getClient();
    
    // Run the Reddit scraper with search
    const run = await apify.actor('crawlerbros/reddit-scraper').call({
      subreddits: subreddits.map(s => s.replace(/^r\//i, '')),
      searchQuery: query,
      maxPosts: maxPostsPerSub,
      sort,
      time,
    });
    
    const { items } = await apify.dataset(run.defaultDatasetId).listItems();
    
    console.log(`[Apify/Reddit] Retrieved ${items.length} posts for "${query}"`);
    
    return items.map(normalizeApifyRedditPost);
  } catch (error) {
    console.error(`[Apify/Reddit] Error:`, error.message);
    return null;
  }
}

/**
 * Search Reddit for known issues and ownership experiences for a specific car
 * Useful for populating community_insights table
 * 
 * @param {string} carSlug - Car slug (e.g., "bmw-m3-g80")
 * @param {string} carName - Human-readable car name (e.g., "BMW M3")
 * @returns {Promise<RedditPost[]>}
 */
export async function scrapeRedditForCarInsights(carSlug, carName) {
  // Determine brand-specific subreddit
  const brand = carSlug.split('-')[0].toLowerCase();
  const brandSubreddits = {
    bmw: ['BMW', 'BmwTech'],
    porsche: ['Porsche'],
    mazda: ['mazda', 'Miata'],
    toyota: ['Toyota', 'ft86'],
    subaru: ['subaru', 'WRX'],
    ford: ['Ford', 'Mustang'],
    chevrolet: ['Chevrolet', 'Corvette', 'Camaro'],
    nissan: ['Nissan', 'Nissan_Altima', 'Infiniti'],
    honda: ['Honda', 'Civic_Si'],
    mercedes: ['mercedes_benz', 'AMG'],
    audi: ['Audi'],
    volkswagen: ['Volkswagen', 'GolfGTI'],
    lexus: ['Lexus'],
  };
  
  const targetSubs = [
    'cars',
    'whatcarshouldIBuy', 
    'MechanicAdvice',
    ...(brandSubreddits[brand] || []),
  ];
  
  // Search queries for different insight types
  const searchQueries = [
    `${carName} issues problems`,
    `${carName} reliability`,
    `${carName} maintenance`,
    `${carName} modifications mods`,
    `${carName} owner review`,
  ];
  
  const allPosts = [];
  
  for (const query of searchQueries) {
    const posts = await searchRedditForCar(query, {
      subreddits: targetSubs,
      maxPostsPerSub: 20,
      sort: 'relevance',
      time: 'all',
    });
    
    if (posts) {
      allPosts.push(...posts);
    }
  }
  
  // Deduplicate by post ID
  const seen = new Set();
  const unique = allPosts.filter(post => {
    if (seen.has(post.id)) return false;
    seen.add(post.id);
    return true;
  });
  
  console.log(`[Apify/Reddit] Found ${unique.length} unique posts for ${carName}`);
  
  return unique;
}

/**
 * Normalize Apify Reddit result to our format
 * @param {Object} item - Raw Apify result
 * @returns {RedditPost}
 */
function normalizeApifyRedditPost(item) {
  return {
    id: item.id || item.name?.replace('t3_', ''),
    title: item.title,
    selftext: item.selftext || item.body || '',
    url: item.url || `https://reddit.com${item.permalink}`,
    permalink: item.permalink,
    subreddit: item.subreddit || item.subreddit_name_prefixed?.replace('r/', ''),
    author: item.author,
    score: item.score || item.ups || 0,
    upvoteRatio: item.upvote_ratio || null,
    numComments: item.num_comments || item.numComments || 0,
    createdUtc: item.created_utc ? new Date(item.created_utc * 1000).toISOString() : null,
    flair: item.link_flair_text || null,
    isStickied: item.stickied || false,
    isSelfPost: item.is_self || !item.url?.startsWith('http'),
    domain: item.domain || null,
    comments: item.comments || [],
    source: 'apify',
    scrapedAt: new Date().toISOString(),
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the status of the last Apify run for an actor
 * @param {string} actorId - Actor ID (e.g., "parseforge/bringatrailer-auctions-scraper")
 * @returns {Promise<Object>}
 */
export async function getLastRunStatus(actorId) {
  if (!isApifyConfigured()) return null;
  
  try {
    const apify = getClient();
    const lastRun = apify.actor(actorId).lastRun();
    return await lastRun.get();
  } catch (error) {
    console.error(`[Apify] Error getting run status:`, error.message);
    return null;
  }
}

/**
 * Get usage statistics for the Apify account
 * @returns {Promise<Object>}
 */
export async function getUsageStats() {
  if (!isApifyConfigured()) return null;
  
  try {
    const apify = getClient();
    const user = await apify.user().get();
    return {
      username: user.username,
      plan: user.plan,
      // Usage info varies by account type
    };
  } catch (error) {
    console.error(`[Apify] Error getting usage stats:`, error.message);
    return null;
  }
}

export default {
  isApifyConfigured,
  scrapeBringATrailer,
  scrapeReddit,
  searchRedditForCar,
  scrapeRedditForCarInsights,
  getLastRunStatus,
  getUsageStats,
  AUTOMOTIVE_SUBREDDITS,
};
