/**
 * Car and Driver Scraper
 * 
 * Scrapes editorial content from Car and Driver including:
 * - Expert reviews and ratings
 * - Comparison tests
 * - Instrumented test data (0-60, 1/4 mile, skidpad, braking)
 * - Highs and lows summaries
 * - Editor ratings
 * 
 * Car and Driver is one of the most respected automotive publications
 * with rigorous instrumented testing.
 * 
 * @module lib/scrapers/carAndDriverScraper
 */

import {
  createScraper,
  extractBetween,
  extractAll,
  stripTags,
  decodeEntities,
  extractJsonLd,
  extractMeta,
  parseDate,
} from './scraperFramework.js';
import { createBrowserScraper } from './browserScraper.js';

const scraper = createScraper({
  name: 'CarAndDriver',
  baseUrl: 'https://www.caranddriver.com',
  rateLimit: 15, // Conservative rate limit
  cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days (reviews don't change)
});

const browserScraper = createBrowserScraper({
  name: 'CarAndDriverBrowser',
  baseUrl: 'https://www.caranddriver.com',
  cacheTTL: 7 * 24 * 60 * 60 * 1000,
  timeout: 45000,
});

async function fetchHtmlWithFallback(url) {
  try {
    return await scraper.fetch(url);
  } catch (err) {
    const msg = String(err?.message || err);
    // Car and Driver commonly blocks basic fetches (403). Use browser fallback.
    if (msg.includes('HTTP 403') || msg.toLowerCase().includes('forbidden') || msg.includes('HTTP 429')) {
      return await browserScraper.fetch(url, { waitUntil: 'networkidle2' });
    }
    throw err;
  }
}

/**
 * @typedef {Object} CaDReview
 * @property {string} title - Review title
 * @property {string} url - Review URL
 * @property {string} vehicle - Vehicle name
 * @property {number} year - Model year
 * @property {string} make - Manufacturer
 * @property {string} model - Model name
 * @property {number} rating - Editor rating (out of 10)
 * @property {string[]} highs - Positive points
 * @property {string[]} lows - Negative points
 * @property {string} verdict - Editor verdict/summary
 * @property {Object} testData - Instrumented test results
 * @property {Object} specs - Vehicle specifications
 * @property {string} reviewDate - Publication date
 */

/**
 * @typedef {Object} CaDTestData
 * @property {number} zeroToSixty - 0-60 mph time (seconds)
 * @property {number} zeroToHundred - 0-100 mph time (seconds)
 * @property {number} quarterMile - 1/4 mile time (seconds)
 * @property {number} quarterMileSpeed - 1/4 mile trap speed (mph)
 * @property {number} topSpeed - Top speed tested (mph)
 * @property {number} braking70to0 - 70-0 braking distance (feet)
 * @property {number} braking100to0 - 100-0 braking distance (feet)
 * @property {number} skidpad - Lateral grip (g)
 * @property {string} testDate - When test was conducted
 */

/**
 * Search for Car and Driver reviews
 * @param {string} query - Search query
 * @param {Object} options
 * @returns {Promise<Array>}
 */
export async function searchReviews(query, options = {}) {
  const { limit = 10 } = options;
  
  try {
    const searchUrl = `/search/?q=${encodeURIComponent(query)}`;
    const html = await fetchHtmlWithFallback(searchUrl);
    
    // Extract search results
    const results = [];
    
    // C&D uses various patterns for search results
    const linkPattern = /<a[^>]*href="([^"]*\/reviews\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    
    while ((match = linkPattern.exec(html)) !== null) {
      const url = match[1].startsWith('http') ? match[1] : `https://www.caranddriver.com${match[1]}`;
      const text = stripTags(match[2]).trim();
      
      if (text && !results.some(r => r.url === url)) {
        results.push({
          url,
          title: text,
          type: url.includes('comparison') ? 'comparison' : 'review',
        });
      }
    }
    
    return results.slice(0, limit);
  } catch (err) {
    console.error(`[Car&Driver] Error searching:`, err.message);
    return [];
  }
}

/**
 * Get a specific review by URL
 * @param {string} url - Review URL
 * @returns {Promise<CaDReview|null>}
 */
export async function getReview(url) {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://www.caranddriver.com${url}`;
    const html = await fetchHtmlWithFallback(fullUrl);
    
    // Extract JSON-LD structured data
    const jsonLd = extractJsonLd(html);
    
    // Extract meta information
    const title = extractMeta(html, 'og:title') || extractBetween(html, '<title>', '</title>');
    const description = extractMeta(html, 'og:description');
    const publishDate = extractMeta(html, 'article:published_time');
    
    // Parse vehicle info from title
    const { year, make, model } = parseVehicleFromTitle(title);
    
    // Extract rating
    const rating = extractRating(html);
    
    // Extract highs and lows
    const highs = extractHighsLows(html, 'highs');
    const lows = extractHighsLows(html, 'lows');
    
    // Extract verdict
    const verdict = extractVerdict(html);
    
    // Extract test data
    const testData = extractTestData(html);
    
    // Extract specs
    const specs = extractSpecs(html);
    
    return {
      title: stripTags(title),
      url: fullUrl,
      vehicle: `${year || ''} ${make || ''} ${model || ''}`.trim(),
      year,
      make,
      model,
      rating,
      highs,
      lows,
      verdict,
      testData,
      specs,
      reviewDate: parseDate(publishDate),
      description: stripTags(description),
      source: 'Car and Driver',
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`[Car&Driver] Error fetching review:`, err.message);
    return null;
  }
}

/**
 * Parse vehicle info from review title
 * @param {string} title 
 * @returns {Object}
 */
function parseVehicleFromTitle(title) {
  if (!title) return { year: null, make: null, model: null };
  
  // Clean title
  const cleaned = stripTags(title)
    .replace(/Tested:?\s*/i, '')
    .replace(/Review:?\s*/i, '')
    .replace(/First Drive:?\s*/i, '')
    .trim();
  
  // Pattern: Year Make Model
  const match = cleaned.match(/^(\d{4})\s+([A-Za-z-]+)\s+(.+?)(?:\s+(?:Review|Tested|First|Comparison|vs\.|:)|$)/i);
  
  if (match) {
    return {
      year: parseInt(match[1]),
      make: match[2],
      model: match[3].trim(),
    };
  }
  
  return { year: null, make: null, model: null };
}

/**
 * Extract editor rating from HTML
 * @param {string} html 
 * @returns {number|null}
 */
function extractRating(html) {
  // Look for rating patterns
  const patterns = [
    /(?:rating|score)[^0-9]*(\d+(?:\.\d)?)\s*(?:\/\s*10|out of 10)?/i,
    /(\d+(?:\.\d)?)\s*\/\s*10/,
    /class="[^"]*rating[^"]*"[^>]*>(\d+(?:\.\d)?)/i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const rating = parseFloat(match[1]);
      if (rating > 0 && rating <= 10) return rating;
    }
  }
  
  return null;
}

/**
 * Extract highs or lows list
 * @param {string} html 
 * @param {string} type - 'highs' or 'lows'
 * @returns {string[]}
 */
function extractHighsLows(html, type) {
  const items = [];
  
  // Look for highs/lows section
  const sectionPattern = new RegExp(`(?:${type}|${type === 'highs' ? 'pros' : 'cons'}).*?<ul[^>]*>(.*?)<\\/ul>`, 'is');
  const sectionMatch = html.match(sectionPattern);
  
  if (sectionMatch) {
    const listHtml = sectionMatch[1];
    const itemPattern = /<li[^>]*>(.*?)<\/li>/gi;
    let itemMatch;
    
    while ((itemMatch = itemPattern.exec(listHtml)) !== null) {
      const text = stripTags(itemMatch[1]).trim();
      if (text) items.push(text);
    }
  }
  
  return items;
}

/**
 * Extract editor verdict/summary
 * @param {string} html 
 * @returns {string|null}
 */
function extractVerdict(html) {
  // Look for verdict section
  const patterns = [
    /(?:verdict|summary|conclusion)[^<]*<p[^>]*>(.*?)<\/p>/is,
    /class="[^"]*verdict[^"]*"[^>]*>(.*?)</is,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const text = stripTags(match[1]).trim();
      if (text.length > 50) return text;
    }
  }
  
  return null;
}

/**
 * Extract instrumented test data
 * @param {string} html 
 * @returns {CaDTestData}
 */
function extractTestData(html) {
  const testData = {};
  
  // 0-60 time
  const zeroToSixty = html.match(/0[-–]60\s*(?:mph)?[^0-9]*(\d+\.?\d*)\s*sec/i);
  if (zeroToSixty) testData.zeroToSixty = parseFloat(zeroToSixty[1]);
  
  // 0-100 time
  const zeroToHundred = html.match(/0[-–]100\s*(?:mph)?[^0-9]*(\d+\.?\d*)\s*sec/i);
  if (zeroToHundred) testData.zeroToHundred = parseFloat(zeroToHundred[1]);
  
  // Quarter mile
  const quarterMile = html.match(/(?:1\/4|quarter)[-\s]*mile[^0-9]*(\d+\.?\d*)\s*sec[^0-9]*@?\s*(\d+\.?\d*)?\s*(?:mph)?/i);
  if (quarterMile) {
    testData.quarterMile = parseFloat(quarterMile[1]);
    if (quarterMile[2]) testData.quarterMileSpeed = parseFloat(quarterMile[2]);
  }
  
  // Top speed
  const topSpeed = html.match(/top\s*speed[^0-9]*(\d+)\s*mph/i);
  if (topSpeed) testData.topSpeed = parseInt(topSpeed[1]);
  
  // Braking 70-0
  const braking70 = html.match(/(?:70[-–]0|braking)[^0-9]*(\d+)\s*(?:ft|feet)/i);
  if (braking70) testData.braking70to0 = parseInt(braking70[1]);
  
  // Braking 100-0
  const braking100 = html.match(/100[-–]0[^0-9]*(\d+)\s*(?:ft|feet)/i);
  if (braking100) testData.braking100to0 = parseInt(braking100[1]);
  
  // Skidpad
  const skidpad = html.match(/(?:skidpad|lateral)[^0-9]*(\d+\.?\d*)\s*g/i);
  if (skidpad) testData.skidpad = parseFloat(skidpad[1]);
  
  return Object.keys(testData).length > 0 ? testData : null;
}

/**
 * Extract vehicle specifications
 * @param {string} html 
 * @returns {Object}
 */
function extractSpecs(html) {
  const specs = {};
  
  // Look for specs table or list
  const specPatterns = [
    { key: 'engine', pattern: /engine[^<]*<[^>]*>([^<]+)/i },
    { key: 'hp', pattern: /(\d{2,4})\s*(?:hp|horsepower)/i },
    { key: 'torque', pattern: /(\d{2,4})\s*(?:lb-ft|lb·ft|pound-feet)/i },
    { key: 'transmission', pattern: /transmission[^<]*<[^>]*>([^<]+)/i },
    { key: 'curbWeight', pattern: /(?:curb\s*)?weight[^0-9]*(\d{2,4}[,\d]*)\s*(?:lb|pounds)/i },
    { key: 'basePrice', pattern: /(?:base\s*)?price[^$]*\$([0-9,]+)/i },
  ];
  
  for (const { key, pattern } of specPatterns) {
    const match = html.match(pattern);
    if (match) {
      let value = match[1];
      if (key === 'hp' || key === 'torque' || key === 'curbWeight') {
        value = parseInt(value.replace(/,/g, ''));
      } else if (key === 'basePrice') {
        value = parseInt(value.replace(/,/g, ''));
      } else {
        value = stripTags(value).trim();
      }
      specs[key] = value;
    }
  }
  
  return Object.keys(specs).length > 0 ? specs : null;
}

/**
 * Get reviews for a specific vehicle
 * @param {number} year 
 * @param {string} make 
 * @param {string} model 
 * @returns {Promise<CaDReview[]>}
 */
export async function getVehicleReviews(year, make, model) {
  const query = `${year} ${make} ${model}`;
  const searchResults = await searchReviews(query);
  
  // Fetch full reviews for top results
  const reviews = [];
  
  for (const result of searchResults.slice(0, 3)) {
    const review = await getReview(result.url);
    if (review) reviews.push(review);
  }
  
  return reviews;
}

/**
 * Get comparison tests involving a vehicle
 * @param {string} vehicle - Vehicle name/query
 * @returns {Promise<Array>}
 */
export async function getComparisons(vehicle) {
  try {
    const searchUrl = `/search/?q=${encodeURIComponent(vehicle + ' comparison')}`;
    const html = await scraper.fetch(searchUrl);
    
    // Extract comparison test links
    const comparisonPattern = /href="([^"]*\/comparison[s]?-test[s]?\/[^"]+)"/gi;
    const comparisons = [];
    let match;
    
    while ((match = comparisonPattern.exec(html)) !== null) {
      const url = match[1].startsWith('http') ? match[1] : `https://www.caranddriver.com${match[1]}`;
      if (!comparisons.includes(url)) {
        comparisons.push(url);
      }
    }
    
    return comparisons.map(url => ({ url, type: 'comparison' }));
  } catch (err) {
    console.error(`[Car&Driver] Error fetching comparisons:`, err.message);
    return [];
  }
}

/**
 * Match our car database entry to Car and Driver reviews
 * @param {Object} car - Car from our database
 * @returns {Promise<Object|null>}
 */
export async function matchCarToCaDReviews(car) {
  if (!car?.name) return null;
  
  // Extract year
  const yearMatch = car.years?.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  
  // Build search query
  const query = car.name
    .replace(/\([^)]+\)/g, '') // Remove parenthetical
    .trim();
  
  const reviews = year
    ? await getVehicleReviews(year, car.brand || query.split(' ')[0], query)
    : await searchReviews(query);
  
  if (reviews.length === 0) return null;
  
  // Return aggregated data
  const review = Array.isArray(reviews) && reviews[0]?.rating ? reviews[0] : null;
  
  return {
    car: car.name,
    reviewCount: reviews.length,
    primaryReview: review,
    allReviews: reviews,
    source: 'Car and Driver',
  };
}

export default {
  searchReviews,
  getReview,
  getVehicleReviews,
  getComparisons,
  matchCarToCaDReviews,
};





