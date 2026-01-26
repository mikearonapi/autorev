/**
 * MotorTrend Scraper
 * 
 * Scrapes editorial content from MotorTrend including:
 * - Expert reviews and ratings
 * - First drive impressions
 * - Long-term tests
 * - Comparison tests
 * - Car of the Year data
 * 
 * MotorTrend (formerly Motor Trend) is one of the oldest and most
 * respected automotive publications.
 * 
 * @module lib/scrapers/motorTrendScraper
 */

import { createBrowserScraper } from './browserScraper.js';
import {
  createScraper,
  extractBetween,
  extractJsonLd,
  stripTags,
  decodeEntities,
  extractMeta,
  parseDate,
} from './scraperFramework.js';

const scraper = createScraper({
  name: 'MotorTrend',
  baseUrl: 'https://www.motortrend.com',
  rateLimit: 15,
  cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
});

const browserScraper = createBrowserScraper({
  name: 'MotorTrendBrowser',
  baseUrl: 'https://www.motortrend.com',
  cacheTTL: 7 * 24 * 60 * 60 * 1000,
  timeout: 45000,
});

async function fetchHtmlWithFallback(url) {
  try {
    return await scraper.fetch(url);
  } catch (err) {
    const msg = String(err?.message || err);
    // MotorTrend often returns 404/403 to bots; use browser fallback.
    if (msg.includes('HTTP 403') || msg.includes('HTTP 404') || msg.includes('HTTP 429')) {
      return await browserScraper.fetch(url, { waitUntil: 'networkidle2' });
    }
    throw err;
  }
}

/**
 * @typedef {Object} MotorTrendReview
 * @property {string} title - Review title
 * @property {string} url - Review URL
 * @property {string} vehicle - Vehicle name
 * @property {number} year - Model year
 * @property {string} make - Manufacturer
 * @property {string} model - Model name
 * @property {number} rating - Overall rating (out of 10)
 * @property {Object} categoryRatings - Ratings by category
 * @property {string[]} pros - Positive points
 * @property {string[]} cons - Negative points
 * @property {string} verdict - Summary/verdict
 * @property {Object} testData - Performance test data
 * @property {string} reviewType - Type of review (first drive, comparison, etc.)
 */

/**
 * Search for MotorTrend articles
 * @param {string} query - Search query
 * @param {Object} options
 * @returns {Promise<Array>}
 */
export async function searchArticles(query, options = {}) {
  const { limit = 10, type = 'all' } = options;
  
  try {
    const searchUrl = `/search/?q=${encodeURIComponent(query)}`;
    const html = await fetchHtmlWithFallback(searchUrl);
    
    const results = [];
    
    // Extract article links
    const articlePatterns = [
      /href="([^"]*\/cars\/[^"]*\/[^"]*\/(?:review|first-drive|comparison)[^"]*)"/gi,
      /href="([^"]*\/reviews\/[^"]+)"/gi,
    ];
    
    for (const pattern of articlePatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const url = match[1].startsWith('http') ? match[1] : `https://www.motortrend.com${match[1]}`;
        
        if (!results.some(r => r.url === url)) {
          results.push({
            url,
            type: url.includes('comparison') ? 'comparison' :
                  url.includes('first-drive') ? 'first_drive' : 'review',
          });
        }
      }
    }
    
    return results.slice(0, limit);
  } catch (err) {
    console.error(`[MotorTrend] Error searching:`, err.message);
    return [];
  }
}

/**
 * Get a specific review by URL
 * @param {string} url - Review URL
 * @returns {Promise<MotorTrendReview|null>}
 */
export async function getReview(url) {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://www.motortrend.com${url}`;
    const html = await fetchHtmlWithFallback(fullUrl);
    
    // Extract structured data
    const jsonLd = extractJsonLd(html);
    
    // Extract meta info
    const title = extractMeta(html, 'og:title') || extractBetween(html, '<title>', '</title>');
    const description = extractMeta(html, 'og:description');
    const publishDate = extractMeta(html, 'article:published_time');
    
    // Parse vehicle info
    const { year, make, model } = parseVehicleFromTitle(title);
    
    // Extract rating
    const rating = extractRating(html);
    
    // Extract category ratings
    const categoryRatings = extractCategoryRatings(html);
    
    // Extract pros and cons
    const pros = extractProsCons(html, 'pros');
    const cons = extractProsCons(html, 'cons');
    
    // Extract verdict
    const verdict = extractVerdict(html);
    
    // Extract test data
    const testData = extractTestData(html);
    
    // Determine review type
    const reviewType = url.includes('first-drive') ? 'first_drive' :
                       url.includes('comparison') ? 'comparison' :
                       url.includes('long-term') ? 'long_term' : 'review';
    
    return {
      title: stripTags(title),
      url: fullUrl,
      vehicle: `${year || ''} ${make || ''} ${model || ''}`.trim(),
      year,
      make,
      model,
      rating,
      categoryRatings,
      pros,
      cons,
      verdict,
      testData,
      reviewType,
      description: stripTags(description),
      publishDate: parseDate(publishDate),
      source: 'MotorTrend',
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`[MotorTrend] Error fetching review:`, err.message);
    return null;
  }
}

/**
 * Parse vehicle info from title
 * @param {string} title 
 * @returns {Object}
 */
function parseVehicleFromTitle(title) {
  if (!title) return { year: null, make: null, model: null };
  
  const cleaned = stripTags(title)
    .replace(/First Drive:?\s*/i, '')
    .replace(/Review:?\s*/i, '')
    .replace(/Tested:?\s*/i, '')
    .replace(/Long-Term:?\s*/i, '')
    .trim();
  
  const match = cleaned.match(/^(\d{4})\s+([A-Za-z-]+)\s+(.+?)(?:\s+(?:Review|First|Test|vs\.|:)|$)/i);
  
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
 * Extract overall rating
 * @param {string} html 
 * @returns {number|null}
 */
function extractRating(html) {
  const patterns = [
    /(?:overall|rating|score)[^0-9]*(\d+(?:\.\d)?)\s*(?:\/\s*10|out of 10)?/i,
    /class="[^"]*overall-rating[^"]*"[^>]*>(\d+(?:\.\d)?)/i,
    /(\d+(?:\.\d)?)\s*\/\s*10/,
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
 * Extract category-specific ratings
 * @param {string} html 
 * @returns {Object}
 */
function extractCategoryRatings(html) {
  const categories = {};
  const categoryNames = [
    'performance', 'handling', 'comfort', 'interior',
    'exterior', 'value', 'safety', 'technology', 'quality',
  ];
  
  for (const category of categoryNames) {
    const pattern = new RegExp(`${category}[^0-9]*?(\\d+(?:\\.\\d)?)[^<]*(?:\\/\\s*10)?`, 'i');
    const match = html.match(pattern);
    if (match) {
      const rating = parseFloat(match[1]);
      if (rating > 0 && rating <= 10) {
        categories[category] = rating;
      }
    }
  }
  
  return Object.keys(categories).length > 0 ? categories : null;
}

/**
 * Extract pros or cons
 * @param {string} html 
 * @param {string} type 
 * @returns {string[]}
 */
function extractProsCons(html, type) {
  const items = [];
  
  const sectionPattern = new RegExp(`(?:${type}|${type === 'pros' ? 'likes|good' : 'dislikes|bad'}).*?<ul[^>]*>(.*?)<\\/ul>`, 'is');
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
 * Extract verdict/summary
 * @param {string} html 
 * @returns {string|null}
 */
function extractVerdict(html) {
  const patterns = [
    /(?:verdict|bottom\s*line|summary)[^<]*<p[^>]*>(.*?)<\/p>/is,
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
 * Extract performance test data
 * @param {string} html 
 * @returns {Object}
 */
function extractTestData(html) {
  const testData = {};
  
  // 0-60 time
  const zeroToSixty = html.match(/0[-–]60\s*(?:mph)?[^0-9]*(\d+\.?\d*)\s*sec/i);
  if (zeroToSixty) testData.zeroToSixty = parseFloat(zeroToSixty[1]);
  
  // Quarter mile
  const quarterMile = html.match(/(?:1\/4|quarter)[-\s]*mile[^0-9]*(\d+\.?\d*)\s*sec/i);
  if (quarterMile) testData.quarterMile = parseFloat(quarterMile[1]);
  
  // Braking
  const braking = html.match(/(?:60|70)[-–]0[^0-9]*(\d+)\s*(?:ft|feet)/i);
  if (braking) testData.braking = parseInt(braking[1]);
  
  // Figure 8
  const figure8 = html.match(/figure\s*8[^0-9]*(\d+\.?\d*)\s*sec/i);
  if (figure8) testData.figure8 = parseFloat(figure8[1]);
  
  // Lateral G
  const lateralG = html.match(/(?:lateral|skidpad)[^0-9]*(\d+\.?\d*)\s*g/i);
  if (lateralG) testData.lateralG = parseFloat(lateralG[1]);
  
  return Object.keys(testData).length > 0 ? testData : null;
}

/**
 * Get reviews for a specific vehicle
 * @param {number} year 
 * @param {string} make 
 * @param {string} model 
 * @returns {Promise<MotorTrendReview[]>}
 */
export async function getVehicleReviews(year, make, model) {
  const query = `${year} ${make} ${model}`;
  const searchResults = await searchArticles(query);
  
  const reviews = [];
  
  for (const result of searchResults.slice(0, 3)) {
    const review = await getReview(result.url);
    if (review) reviews.push(review);
  }
  
  return reviews;
}

/**
 * Get Car of the Year winners
 * @param {number} [year] - Specific year, or current if not specified
 * @returns {Promise<Array>}
 */
export async function getCarOfTheYear(year) {
  try {
    const url = year 
      ? `/news/car-of-the-year/${year}/`
      : '/news/car-of-the-year/';
    
    const html = await scraper.fetch(url);
    
    const winners = [];
    
    // Look for winner announcements
    const winnerPattern = /(?:winner|car of the year)[^<]*<[^>]*>([^<]+)/gi;
    let match;
    
    while ((match = winnerPattern.exec(html)) !== null) {
      const vehicle = stripTags(match[1]).trim();
      if (vehicle && !winners.includes(vehicle)) {
        winners.push(vehicle);
      }
    }
    
    return winners;
  } catch (err) {
    console.error(`[MotorTrend] Error fetching Car of the Year:`, err.message);
    return [];
  }
}

/**
 * Match our car database entry to MotorTrend reviews
 * @param {Object} car - Car from our database
 * @returns {Promise<Object|null>}
 */
export async function matchCarToReviews(car) {
  if (!car?.name) return null;
  
  const yearMatch = car.years?.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  
  const nameParts = car.name?.split(' ') || [];
  const make = car.brand || nameParts[0];
  const model = nameParts.slice(1).join(' ')
    .replace(/\([^)]+\)/g, '')
    .trim();
  
  const reviews = year 
    ? await getVehicleReviews(year, make, model)
    : await searchArticles(`${make} ${model}`);
  
  if (reviews.length === 0) return null;
  
  return {
    car: car.name,
    reviewCount: reviews.length,
    primaryReview: reviews[0],
    allReviews: reviews,
    source: 'MotorTrend',
  };
}

const motorTrendScraper = {
  searchArticles,
  getReview,
  getVehicleReviews,
  getCarOfTheYear,
  matchCarToReviews,
};

export default motorTrendScraper;














