/**
 * IIHS Safety Ratings Scraper
 * 
 * Scrapes crash test results and safety ratings from the Insurance
 * Institute for Highway Safety (IIHS).
 * 
 * Data includes:
 * - Crashworthiness ratings (small overlap, moderate overlap, side, roof)
 * - Crash avoidance ratings (front crash prevention)
 * - Headlight ratings
 * - Child seat LATCH ease of use
 * 
 * @module lib/scrapers/iihsScraper
 */

import {
  createScraper,
  extractBetween,
  extractAll,
  stripTags,
  decodeEntities,
  extractJsonLd,
  parseDate,
} from './scraperFramework.js';

const scraper = createScraper({
  name: 'IIHS',
  baseUrl: 'https://www.iihs.org',
  rateLimit: 20, // Be respectful
  cacheTTL: 7 * 24 * 60 * 60 * 1000, // 7 days (ratings don't change often)
});

/**
 * @typedef {Object} IIHSRating
 * @property {string} vehicle - Vehicle description
 * @property {number} year - Model year
 * @property {string} make - Manufacturer
 * @property {string} model - Model name
 * @property {string} overallRating - Overall safety rating
 * @property {Object} crashworthiness - Crash test results
 * @property {Object} crashAvoidance - Crash prevention ratings
 * @property {string} headlightRating - Headlight rating
 * @property {boolean} topSafetyPick - Top Safety Pick status
 * @property {boolean} topSafetyPickPlus - Top Safety Pick+ status
 * @property {string} url - IIHS page URL
 */

/**
 * Build search URL for IIHS
 * @param {number} year 
 * @param {string} make 
 * @param {string} model 
 * @returns {string}
 */
function buildSearchUrl(year, make, model) {
  const params = new URLSearchParams({
    selectedYear: year,
    selectedMake: make,
    selectedModel: model,
  });
  return `/ratings/vehicle/${encodeURIComponent(make)}/${encodeURIComponent(model)}/${year}`;
}

/**
 * Normalize IIHS rating to standard format
 * @param {string} rating 
 * @returns {string}
 */
function normalizeRating(rating) {
  if (!rating) return null;
  
  const r = rating.toLowerCase().trim();
  if (r.includes('good')) return 'Good';
  if (r.includes('acceptable')) return 'Acceptable';
  if (r.includes('marginal')) return 'Marginal';
  if (r.includes('poor')) return 'Poor';
  if (r.includes('superior')) return 'Superior';
  if (r.includes('advanced')) return 'Advanced';
  if (r.includes('basic')) return 'Basic';
  if (r.includes('not available') || r === 'n/a') return null;
  
  return rating;
}

/**
 * Parse the rating from an IIHS rating element
 * @param {string} html - HTML content
 * @param {string} testName - Name of the test to find
 * @returns {string|null}
 */
function parseRatingFromHtml(html, testName) {
  // IIHS uses various patterns for ratings
  const patterns = [
    new RegExp(`${testName}[^<]*<[^>]*class="[^"]*rating[^"]*"[^>]*>([^<]+)`, 'i'),
    new RegExp(`<[^>]*data-test="${testName}"[^>]*>.*?<[^>]*class="[^"]*rating[^"]*"[^>]*>([^<]+)`, 'is'),
    new RegExp(`${testName}.*?(?:Good|Acceptable|Marginal|Poor|Superior|Advanced|Basic)`, 'i'),
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return normalizeRating(match[1] || match[0]);
    }
  }
  
  return null;
}

/**
 * Get IIHS safety ratings for a vehicle
 * @param {number} year - Model year
 * @param {string} make - Manufacturer
 * @param {string} model - Model name
 * @returns {Promise<IIHSRating|null>}
 */
export async function getIIHSRatings(year, make, model) {
  if (!year || !make || !model) return null;
  
  try {
    // Normalize make/model for URL
    const normalizedMake = make.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const normalizedModel = model.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const url = `/ratings/vehicle/${normalizedMake}/${normalizedModel}/${year}`;
    
    const html = await scraper.fetch(url);
    
    // Check if page exists (IIHS returns 200 even for missing vehicles)
    if (html.includes('No ratings found') || html.includes('We haven\'t tested')) {
      return null;
    }
    
    // Extract JSON-LD structured data if available
    const jsonLd = extractJsonLd(html);
    
    // Parse ratings from HTML
    const ratings = {
      vehicle: `${year} ${make} ${model}`,
      year,
      make,
      model,
      url: `https://www.iihs.org${url}`,
      
      // Crashworthiness (structure protection)
      crashworthiness: {
        smallOverlapFront: parseRatingFromHtml(html, 'small overlap front'),
        moderateOverlapFront: parseRatingFromHtml(html, 'moderate overlap front'),
        side: parseRatingFromHtml(html, 'side'),
        roofStrength: parseRatingFromHtml(html, 'roof strength'),
        headRestraints: parseRatingFromHtml(html, 'head restraints'),
      },
      
      // Crash avoidance
      crashAvoidance: {
        frontCrashPrevention: parseRatingFromHtml(html, 'front crash prevention'),
        vehicleToVehicle: parseRatingFromHtml(html, 'vehicle-to-vehicle'),
        vehicleToPedestrian: parseRatingFromHtml(html, 'vehicle-to-pedestrian'),
      },
      
      // Other ratings
      headlightRating: parseRatingFromHtml(html, 'headlight'),
      childSeatLatch: parseRatingFromHtml(html, 'LATCH'),
      
      // Awards
      topSafetyPick: html.includes('Top Safety Pick') && !html.includes('Top Safety Pick+'),
      topSafetyPickPlus: html.includes('Top Safety Pick+'),
      
      // Source info
      source: 'IIHS',
      scrapedAt: new Date().toISOString(),
    };
    
    // Calculate overall based on crashworthiness ratings
    ratings.overallAssessment = calculateOverallAssessment(ratings);
    
    return ratings;
  } catch (err) {
    console.error(`[IIHS] Error fetching ratings for ${year} ${make} ${model}:`, err.message);
    return null;
  }
}

/**
 * Calculate an overall assessment based on individual ratings
 * @param {Object} ratings 
 * @returns {string}
 */
function calculateOverallAssessment(ratings) {
  if (ratings.topSafetyPickPlus) return 'Excellent';
  if (ratings.topSafetyPick) return 'Very Good';
  
  const crashRatings = Object.values(ratings.crashworthiness).filter(Boolean);
  if (crashRatings.length === 0) return 'Not Rated';
  
  const goodCount = crashRatings.filter(r => r === 'Good').length;
  const poorCount = crashRatings.filter(r => r === 'Poor' || r === 'Marginal').length;
  
  if (goodCount >= crashRatings.length * 0.8) return 'Good';
  if (poorCount >= crashRatings.length * 0.3) return 'Below Average';
  return 'Average';
}

/**
 * Search for vehicles tested by IIHS
 * @param {string} make - Manufacturer
 * @param {string} model - Model name (optional)
 * @returns {Promise<Array>}
 */
export async function searchIIHSVehicles(make, model = '') {
  try {
    const searchUrl = `/ratings/ratings.aspx?make=${encodeURIComponent(make)}${model ? `&model=${encodeURIComponent(model)}` : ''}`;
    
    const html = await scraper.fetch(searchUrl);
    
    // Extract vehicle links from search results
    const vehiclePattern = /\/ratings\/vehicle\/([^"]+)\/([^"]+)\/(\d{4})/g;
    const matches = [];
    let match;
    
    while ((match = vehiclePattern.exec(html)) !== null) {
      matches.push({
        make: decodeURIComponent(match[1]).replace(/-/g, ' '),
        model: decodeURIComponent(match[2]).replace(/-/g, ' '),
        year: parseInt(match[3]),
        url: `https://www.iihs.org/ratings/vehicle/${match[1]}/${match[2]}/${match[3]}`,
      });
    }
    
    // Deduplicate
    const unique = matches.filter((v, i, arr) => 
      arr.findIndex(x => x.year === v.year && x.make === v.make && x.model === v.model) === i
    );
    
    return unique.sort((a, b) => b.year - a.year);
  } catch (err) {
    console.error(`[IIHS] Error searching vehicles:`, err.message);
    return [];
  }
}

/**
 * Get list of Top Safety Pick vehicles for a year
 * @param {number} year 
 * @returns {Promise<Array>}
 */
export async function getTopSafetyPicks(year) {
  try {
    const url = `/ratings/top-safety-picks/${year || ''}`;
    const html = await scraper.fetch(url);
    
    const picks = [];
    
    // Extract Top Safety Pick+ vehicles
    const tspPlusSection = extractBetween(html, 'Top Safety Pick+', 'Top Safety Pick</h2>') || 
                           extractBetween(html, 'TOP SAFETY PICK+', 'TOP SAFETY PICK</h2>');
    if (tspPlusSection) {
      const vehicles = extractVehiclesFromSection(tspPlusSection);
      vehicles.forEach(v => {
        v.award = 'Top Safety Pick+';
        picks.push(v);
      });
    }
    
    // Extract Top Safety Pick vehicles
    const tspSection = extractBetween(html, 'Top Safety Pick</h2>', '</article>') ||
                       extractBetween(html, 'TOP SAFETY PICK</h2>', '</article>');
    if (tspSection) {
      const vehicles = extractVehiclesFromSection(tspSection);
      vehicles.forEach(v => {
        v.award = 'Top Safety Pick';
        picks.push(v);
      });
    }
    
    return picks;
  } catch (err) {
    console.error(`[IIHS] Error fetching Top Safety Picks:`, err.message);
    return [];
  }
}

/**
 * Extract vehicle names from HTML section
 * @param {string} html 
 * @returns {Array}
 */
function extractVehiclesFromSection(html) {
  const vehicles = [];
  
  // Try to extract from list items
  const listPattern = /<li[^>]*>([^<]+)<\/li>/gi;
  let match;
  
  while ((match = listPattern.exec(html)) !== null) {
    const name = stripTags(match[1]).trim();
    if (name && name.length > 3) {
      const parsed = parseVehicleName(name);
      if (parsed) vehicles.push(parsed);
    }
  }
  
  return vehicles;
}

/**
 * Parse a vehicle name like "2024 Honda Accord" into components
 * @param {string} name 
 * @returns {Object|null}
 */
function parseVehicleName(name) {
  const match = name.match(/^(\d{4})\s+([A-Za-z-]+)\s+(.+)$/);
  if (!match) return null;
  
  return {
    year: parseInt(match[1]),
    make: match[2],
    model: match[3],
    name,
  };
}

/**
 * Match our car database entry to IIHS data
 * @param {Object} car - Car from our database
 * @returns {Promise<IIHSRating|null>}
 */
export async function matchCarToIIHS(car) {
  if (!car) return null;
  
  // Extract year from car data
  const yearMatch = car.years?.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  
  // Extract make from car name or brand field
  const nameParts = car.name?.split(' ') || [];
  const make = car.brand || nameParts[0];
  
  // Model is everything after the make
  const model = nameParts.slice(1).join(' ').split('(')[0].trim();
  
  if (!year || !make || !model) return null;
  
  return getIIHSRatings(year, make, model);
}

export default {
  getIIHSRatings,
  searchIIHSVehicles,
  getTopSafetyPicks,
  matchCarToIIHS,
};


