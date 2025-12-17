/**
 * Bring a Trailer Scraper
 * 
 * Scrapes auction data from Bring a Trailer (BaT) to get:
 * - Recent sale prices for specific vehicles
 * - Price trends over time
 * - What specs/options affect values
 * - Market velocity (how fast cars sell)
 * 
 * This is essential for enthusiast car valuations as BaT is THE
 * marketplace for collector and enthusiast vehicles.
 * 
 * @module lib/scrapers/bringATrailerScraper
 */

import {
  createScraper,
  extractBetween,
  extractAll,
  stripTags,
  decodeEntities,
  extractJsonLd,
  parsePrice,
  parseDate,
  extractLinks,
} from './scraperFramework.js';
import { createFallbackScraper } from './browserScraper.js';

const httpScraper = createScraper({
  name: 'BringATrailer',
  baseUrl: 'https://bringatrailer.com',
  rateLimit: 20, // Be respectful to BaT
  cacheTTL: 4 * 60 * 60 * 1000, // 4 hours (auction data changes frequently)
});

// BaT is frequently protected; use automatic fallback to a real browser when blocked.
const scraper = createFallbackScraper(httpScraper, {
  headless: true,
  timeout: 45000,
  simulateHuman: true,
});

function isBlockedHtml(html) {
  if (!html) return true;
  const lower = html.toLowerCase();
  const indicators = [
    'g-recaptcha',
    'h-captcha',
    'cf-turnstile',
    'captcha',
    'verify you are human',
    'security check',
    'access denied',
    'cloudflare',
    'cf-chl',
    'challenge-platform',
  ];
  return indicators.some(i => lower.includes(i));
}

/**
 * @typedef {Object} BaTAuction
 * @property {string} id - Auction ID
 * @property {string} title - Listing title
 * @property {string} url - Auction URL
 * @property {number|null} soldPrice - Final sale price (null if no sale/reserve not met)
 * @property {number} year - Vehicle year
 * @property {string} make - Manufacturer
 * @property {string} model - Model name
 * @property {number|null} mileage - Odometer reading
 * @property {string} transmission - Transmission type
 * @property {string} location - Seller location
 * @property {string} endDate - Auction end date
 * @property {boolean} sold - Whether the car sold
 * @property {boolean} reserveNotMet - Whether reserve was not met
 * @property {number} bidCount - Number of bids
 * @property {number} commentCount - Number of comments
 * @property {string} thumbnailUrl - Listing image URL
 * @property {Array<string>} highlights - Key features mentioned
 */

/**
 * @typedef {Object} BaTMarketData
 * @property {string} vehicle - Vehicle description
 * @property {number} sampleSize - Number of auctions analyzed
 * @property {number} averagePrice - Average sold price
 * @property {number} medianPrice - Median sold price
 * @property {number} minPrice - Lowest sale price
 * @property {number} maxPrice - Highest sale price
 * @property {number} sellThroughRate - Percentage that sold (vs reserve not met)
 * @property {number} averageMileage - Average mileage of sold vehicles
 * @property {Array<BaTAuction>} recentSales - Recent auctions
 */

/**
 * Search for completed auctions on BaT
 * @param {string} query - Search query (e.g., "Porsche 911 GT3")
 * @param {Object} options
 * @param {number} [options.limit=20] - Max results to return
 * @param {boolean} [options.soldOnly=true] - Only return sold vehicles
 * @param {number} [options.minYear] - Minimum year filter
 * @param {number} [options.maxYear] - Maximum year filter
 * @returns {Promise<BaTAuction[]>}
 */
export async function searchCompletedAuctions(query, options = {}) {
  const { limit = 20, soldOnly = true, minYear, maxYear } = options;
  
  try {
    // BaT search URL for completed auctions
    const searchQuery = encodeURIComponent(query);
    const url = `/auctions/?s=${searchQuery}&results=completed`;
    
    // Avoid caching block pages; BaT blocks are often returned with HTTP 200.
    let html = await httpScraper.fetch(url, { skipCache: true });
    if (isBlockedHtml(html)) {
      console.warn('[BaT] Detected block page on HTTP fetch; using browser...');
      html = await scraper.browserScraper.fetch(url, { skipCache: true });
    }
    
    const auctions = parseAuctionListing(html);
    
    // Filter by options
    let filtered = auctions;
    
    if (soldOnly) {
      filtered = filtered.filter(a => a.sold && !a.reserveNotMet);
    }
    
    if (minYear) {
      filtered = filtered.filter(a => a.year >= minYear);
    }
    
    if (maxYear) {
      filtered = filtered.filter(a => a.year <= maxYear);
    }
    
    return filtered.slice(0, limit);
  } catch (err) {
    console.error(`[BaT] Error searching auctions:`, err.message);
    return [];
  }
}

/**
 * Parse auction listings from HTML
 * @param {string} html 
 * @returns {BaTAuction[]}
 */
function parseAuctionListing(html) {
  const auctions = [];
  
  // BaT uses specific patterns for auction cards
  // This regex pattern matches their listing structure
  const listingPattern = /<a[^>]*class="[^"]*listing-card[^"]*"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<\/a>/gi;
  const cardPattern = /<article[^>]*class="[^"]*listing-card[^"]*"[^>]*>[\s\S]*?<\/article>/gi;
  
  // Try both patterns
  let matches = html.match(cardPattern) || html.match(listingPattern) || [];
  
  // Fallback: try to find auction data in JSON
  const jsonMatch = html.match(/<script[^>]*type="application\/json"[^>]*id="[^"]*auctions[^"]*"[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      if (Array.isArray(data)) {
        return data.map(normalizeAuctionData);
      }
    } catch {}
  }
  
  // Parse each listing card
  for (const cardHtml of matches) {
    const auction = parseAuctionCard(cardHtml);
    if (auction) {
      auctions.push(auction);
    }
  }
  
  return auctions;
}

/**
 * Parse a single auction card HTML
 * @param {string} cardHtml 
 * @returns {BaTAuction|null}
 */
function parseAuctionCard(cardHtml) {
  try {
    // Extract URL
    const urlMatch = cardHtml.match(/href="([^"]*bringatrailer\.com\/listing\/[^"]+)"/);
    const url = urlMatch ? urlMatch[1] : null;
    
    // Extract title
    const titleMatch = cardHtml.match(/<h3[^>]*>([^<]+)<\/h3>/i) ||
                       cardHtml.match(/class="[^"]*title[^"]*"[^>]*>([^<]+)</i);
    const title = titleMatch ? decodeEntities(stripTags(titleMatch[1])) : null;
    
    // Extract price - look for sold price or bid amount
    const priceMatch = cardHtml.match(/\$([0-9,]+)/) ||
                       cardHtml.match(/class="[^"]*price[^"]*"[^>]*>([^<]+)</i);
    const price = priceMatch ? parsePrice(priceMatch[1]) : null;
    
    // Check if sold vs reserve not met
    const sold = cardHtml.toLowerCase().includes('sold') || 
                 cardHtml.includes('Sold for') ||
                 (price && !cardHtml.toLowerCase().includes('reserve not met'));
    const reserveNotMet = cardHtml.toLowerCase().includes('reserve not met') ||
                          cardHtml.toLowerCase().includes('bid to');
    
    // Extract year, make, model from title
    const { year, make, model } = parseVehicleFromTitle(title);
    
    // Extract mileage
    const mileageMatch = cardHtml.match(/([0-9,]+)\s*(?:miles|mi\b)/i);
    const mileage = mileageMatch ? parseInt(mileageMatch[1].replace(/,/g, '')) : null;
    
    // Extract bid count
    const bidMatch = cardHtml.match(/(\d+)\s*(?:bids?|comments?)/i);
    const bidCount = bidMatch ? parseInt(bidMatch[1]) : null;
    
    // Extract thumbnail
    const imgMatch = cardHtml.match(/src="([^"]+)"/);
    const thumbnailUrl = imgMatch ? imgMatch[1] : null;
    
    // Extract location
    const locationMatch = cardHtml.match(/(?:in|from|located)\s+([A-Z][a-z]+(?:,\s*[A-Z]{2})?)/i);
    const location = locationMatch ? locationMatch[1] : null;
    
    // Extract transmission
    const transMatch = cardHtml.match(/(manual|automatic|dct|pdk|smg|dsg|cvt)/i);
    const transmission = transMatch ? normalizeTransmission(transMatch[1]) : null;
    
    if (!title) return null;
    
    return {
      id: url?.split('/').pop() || null,
      title,
      url,
      soldPrice: sold && !reserveNotMet ? price : null,
      highBid: reserveNotMet ? price : null,
      year,
      make,
      model,
      mileage,
      transmission,
      location,
      sold,
      reserveNotMet,
      bidCount,
      thumbnailUrl,
      highlights: extractHighlights(cardHtml),
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[BaT] Error parsing auction card:', err.message);
    return null;
  }
}

/**
 * Parse vehicle info from auction title
 * @param {string} title - e.g., "2019 Porsche 911 GT3 RS"
 * @returns {Object}
 */
function parseVehicleFromTitle(title) {
  if (!title) return { year: null, make: null, model: null };
  
  // Pattern: Year Make Model...
  const match = title.match(/^(\d{4})\s+([A-Za-z-]+)\s+(.+?)(?:\s*[-�]\s*|$)/);
  
  if (match) {
    return {
      year: parseInt(match[1]),
      make: match[2],
      model: match[3].trim(),
    };
  }
  
  // Try without strict pattern
  const yearMatch = title.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? parseInt(yearMatch[0]) : null;
  
  return { year, make: null, model: null };
}

/**
 * Extract notable features/highlights from listing
 * @param {string} html 
 * @returns {string[]}
 */
function extractHighlights(html) {
  const highlights = [];
  const text = stripTags(html).toLowerCase();
  
  // Look for notable keywords
  const keywords = [
    'original owner', 'one owner', 'low miles', 'documented', 'matching numbers',
    'factory', 'rare', 'limited', 'special edition', 'pdk', 'manual', '6-speed',
    'turbo', 'supercharged', 'v8', 'v10', 'v12', 'flat-six', 'convertible',
    'hardtop', 'coupe', 'clean title', 'service records', 'recent service',
  ];
  
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      highlights.push(keyword);
    }
  }
  
  return highlights;
}

/**
 * Normalize transmission string
 * @param {string} trans 
 * @returns {string}
 */
function normalizeTransmission(trans) {
  if (!trans) return null;
  const t = trans.toLowerCase();
  if (t.includes('manual') || t.includes('6-speed') || t.includes('5-speed')) return 'Manual';
  if (t.includes('pdk') || t.includes('dct') || t.includes('dsg')) return 'DCT';
  if (t.includes('smg')) return 'SMG';
  if (t.includes('auto')) return 'Automatic';
  return trans;
}

/**
 * Normalize raw auction data (if extracted from JSON)
 * @param {Object} data 
 * @returns {BaTAuction}
 */
function normalizeAuctionData(data) {
  return {
    id: data.id || data.slug,
    title: data.title,
    url: data.url || `https://bringatrailer.com/listing/${data.slug}`,
    soldPrice: data.sold_price || data.sale_price,
    highBid: data.current_bid || data.high_bid,
    year: data.year,
    make: data.make,
    model: data.model,
    mileage: data.mileage,
    transmission: normalizeTransmission(data.transmission),
    location: data.location,
    endDate: data.end_date || data.auction_end,
    sold: data.sold === true || data.status === 'sold',
    reserveNotMet: data.reserve_not_met === true,
    bidCount: data.bid_count || data.bids,
    commentCount: data.comment_count,
    thumbnailUrl: data.thumbnail_url || data.image,
    highlights: [],
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Get market data for a specific vehicle
 * Aggregates recent auction results
 * @param {string} query - Search query
 * @param {Object} options
 * @returns {Promise<BaTMarketData>}
 */
export async function getMarketData(query, options = {}) {
  const auctions = await searchCompletedAuctions(query, {
    ...options,
    limit: 50,
    soldOnly: false, // Get all to calculate sell-through rate
  });
  
  if (auctions.length === 0) {
    return {
      vehicle: query,
      sampleSize: 0,
      averagePrice: null,
      medianPrice: null,
      minPrice: null,
      maxPrice: null,
      sellThroughRate: null,
      averageMileage: null,
      recentSales: [],
    };
  }
  
  // Separate sold vs unsold
  const sold = auctions.filter(a => a.sold && !a.reserveNotMet && a.soldPrice);
  const allCompleted = auctions.filter(a => a.sold || a.reserveNotMet);
  
  // Calculate statistics for sold vehicles
  const prices = sold.map(a => a.soldPrice).filter(Boolean).sort((a, b) => a - b);
  const mileages = sold.map(a => a.mileage).filter(Boolean);
  
  const averagePrice = prices.length > 0 
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : null;
  
  const medianPrice = prices.length > 0
    ? prices[Math.floor(prices.length / 2)]
    : null;
  
  const averageMileage = mileages.length > 0
    ? Math.round(mileages.reduce((a, b) => a + b, 0) / mileages.length)
    : null;
  
  return {
    vehicle: query,
    sampleSize: sold.length,
    totalAuctions: allCompleted.length,
    averagePrice,
    medianPrice,
    minPrice: prices.length > 0 ? prices[0] : null,
    maxPrice: prices.length > 0 ? prices[prices.length - 1] : null,
    sellThroughRate: allCompleted.length > 0 
      ? Math.round((sold.length / allCompleted.length) * 100) 
      : null,
    averageMileage,
    recentSales: sold.slice(0, 10),
    analysisDate: new Date().toISOString(),
  };
}

/**
 * Get a specific auction by URL or ID
 * @param {string} urlOrId - BaT URL or listing ID
 * @returns {Promise<Object|null>}
 */
export async function getAuctionDetails(urlOrId) {
  try {
    const url = urlOrId.startsWith('http') 
      ? urlOrId 
      : `/listing/${urlOrId}`;
    
    const html = await scraper.fetch(url);
    
    // Extract detailed information from the auction page
    const title = extractBetween(html, '<h1', '</h1>');
    const description = extractBetween(html, 'class="post-excerpt"', '</div>');
    
    // Get JSON-LD data if available
    const jsonLd = extractJsonLd(html);
    
    // Parse the full listing
    const auction = parseAuctionCard(`<div>${html}</div>`);
    
    if (auction) {
      // Enhance with additional details from full page
      auction.description = description ? stripTags(description) : null;
      auction.fullTitle = title ? stripTags(title) : auction.title;
      
      if (jsonLd) {
        auction.structured = jsonLd;
      }
    }
    
    return auction;
  } catch (err) {
    console.error(`[BaT] Error fetching auction details:`, err.message);
    return null;
  }
}

/**
 * Match our car database entry to BaT market data
 * @param {Object} car - Car from our database
 * @returns {Promise<BaTMarketData|null>}
 */
export async function matchCarToBaTData(car) {
  if (!car?.name) return null;
  
  // Build search query from car name
  // Our names are like "Porsche 911 GT3 (996)" or "BMW M3 E46"
  let query = car.name
    .replace(/\([^)]+\)/g, '') // Remove parenthetical like (996)
    .replace(/E\d{2}|F\d{2}|G\d{2}/g, '') // Remove BMW chassis codes
    .trim();
  
  // Add year range if available
  const yearMatch = car.years?.match(/(\d{4})/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    return getMarketData(query, {
      minYear: year - 2,
      maxYear: year + 2,
    });
  }
  
  return getMarketData(query);
}

export default {
  searchCompletedAuctions,
  getMarketData,
  getAuctionDetails,
  matchCarToBaTData,
};



