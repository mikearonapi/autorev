/**
 * Hagerty Valuation Scraper
 * 
 * Scrapes valuation data from Hagerty's public price guide.
 * Hagerty is THE authority on collector car values.
 * 
 * Data includes:
 * - Condition-based valuations (Concours/Excellent/Good/Fair)
 * - Price trends over time
 * - Market insights
 * 
 * @module lib/scrapers/hagertyScraper
 */

import {
  createScraper,
  extractBetween,
  extractJsonLd,
  stripTags,
  decodeEntities,
  parsePrice,
  extractMeta,
} from './scraperFramework.js';

const scraper = createScraper({
  name: 'Hagerty',
  baseUrl: 'https://www.hagerty.com',
  rateLimit: 15, // Conservative
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
});

/**
 * @typedef {Object} HagertyValuation
 * @property {string} vehicle - Vehicle description
 * @property {number} year - Model year
 * @property {string} make - Manufacturer
 * @property {string} model - Model name
 * @property {Object} values - Condition-based values
 * @property {number} values.concours - Condition 1 (show quality)
 * @property {number} values.excellent - Condition 2 (excellent)
 * @property {number} values.good - Condition 3 (good)
 * @property {number} values.fair - Condition 4 (fair/driver)
 * @property {string} trend - Market trend (up/down/stable)
 * @property {number} trendPercent - YoY change percentage
 * @property {string} url - Hagerty page URL
 */

/**
 * Build Hagerty valuation URL
 * @param {number} year 
 * @param {string} make 
 * @param {string} model 
 * @returns {string}
 */
function buildValuationUrl(year, make, model) {
  const normalizedMake = make.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const normalizedModel = model.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `/valuation-tools/vehicle/${year}-${normalizedMake}-${normalizedModel}`;
}

/**
 * Search for vehicles in Hagerty's database
 * @param {string} query - Search query
 * @returns {Promise<Array>}
 */
export async function searchVehicles(query) {
  try {
    // Hagerty's search endpoint
    const searchUrl = `/valuation-tools/search?q=${encodeURIComponent(query)}`;
    const html = await scraper.fetch(searchUrl);
    
    const results = [];
    
    // Extract vehicle links from search results
    const linkPattern = /href="(\/valuation-tools\/vehicle\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    
    while ((match = linkPattern.exec(html)) !== null) {
      const url = match[1];
      const text = stripTags(match[2]).trim();
      
      // Parse year/make/model from URL
      const urlMatch = url.match(/\/vehicle\/(\d{4})-([^/]+)$/);
      
      if (urlMatch && text) {
        results.push({
          url: `https://www.hagerty.com${url}`,
          title: text,
          year: parseInt(urlMatch[1]),
          slug: urlMatch[2],
        });
      }
    }
    
    return results;
  } catch (err) {
    console.error(`[Hagerty] Error searching:`, err.message);
    return [];
  }
}

/**
 * Get valuation for a specific vehicle
 * @param {number} year 
 * @param {string} make 
 * @param {string} model 
 * @returns {Promise<HagertyValuation|null>}
 */
export async function getValuation(year, make, model) {
  if (!year || !make || !model) return null;
  
  try {
    const url = buildValuationUrl(year, make, model);
    const html = await scraper.fetch(url);
    
    // Check if vehicle exists
    if (html.includes('Vehicle not found') || html.includes('No results')) {
      return null;
    }
    
    // Extract JSON-LD structured data if available
    const jsonLd = extractJsonLd(html);
    
    // Extract values by condition
    const values = extractValuations(html);
    
    if (!values || Object.keys(values).length === 0) {
      // Try alternate search
      const searchResults = await searchVehicles(`${year} ${make} ${model}`);
      if (searchResults.length > 0) {
        // Retry with found URL
        const altHtml = await scraper.fetch(searchResults[0].url);
        const altValues = extractValuations(altHtml);
        if (altValues) {
          return {
            vehicle: `${year} ${make} ${model}`,
            year,
            make,
            model,
            values: altValues,
            ...extractTrend(altHtml),
            url: searchResults[0].url,
            source: 'Hagerty',
            scrapedAt: new Date().toISOString(),
          };
        }
      }
      return null;
    }
    
    // Extract market trend
    const trend = extractTrend(html);
    
    return {
      vehicle: `${year} ${make} ${model}`,
      year,
      make,
      model,
      values,
      ...trend,
      url: `https://www.hagerty.com${url}`,
      source: 'Hagerty',
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`[Hagerty] Error fetching valuation:`, err.message);
    return null;
  }
}

/**
 * Extract condition-based valuations from HTML
 * @param {string} html 
 * @returns {Object|null}
 */
function extractValuations(html) {
  const values = {};
  
  // Hagerty condition labels
  const conditions = [
    { key: 'concours', labels: ['condition 1', 'concours', '#1'] },
    { key: 'excellent', labels: ['condition 2', 'excellent', '#2'] },
    { key: 'good', labels: ['condition 3', 'good', '#3'] },
    { key: 'fair', labels: ['condition 4', 'fair', '#4', 'driver'] },
  ];
  
  for (const { key, labels } of conditions) {
    for (const label of labels) {
      // Try various patterns
      const patterns = [
        new RegExp(`${label}[^$]*\\$([0-9,]+)`, 'i'),
        new RegExp(`\\$([0-9,]+)[^<]*${label}`, 'i'),
        new RegExp(`"${key}"[^0-9]*([0-9,]+)`, 'i'),
        new RegExp(`data-condition="${label}"[^>]*>.*?\\$([0-9,]+)`, 'is'),
      ];
      
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          values[key] = parsePrice(match[1]);
          break;
        }
      }
      
      if (values[key]) break;
    }
  }
  
  // Also try to extract from JSON in the page
  const jsonPattern = /"values?":\s*\{([^}]+)\}/i;
  const jsonMatch = html.match(jsonPattern);
  if (jsonMatch) {
    try {
      const valueData = JSON.parse(`{${jsonMatch[1]}}`);
      if (valueData.condition1 || valueData.concours) {
        values.concours = valueData.condition1 || valueData.concours;
      }
      if (valueData.condition2 || valueData.excellent) {
        values.excellent = valueData.condition2 || valueData.excellent;
      }
      if (valueData.condition3 || valueData.good) {
        values.good = valueData.condition3 || valueData.good;
      }
      if (valueData.condition4 || valueData.fair) {
        values.fair = valueData.condition4 || valueData.fair;
      }
    } catch {}
  }
  
  return Object.keys(values).length > 0 ? values : null;
}

/**
 * Extract market trend information
 * @param {string} html 
 * @returns {Object}
 */
function extractTrend(html) {
  const result = {
    trend: 'stable',
    trendPercent: 0,
  };
  
  // Look for trend indicators
  const upPattern = /(?:up|increased?|rising|↑)\s*(\d+(?:\.\d+)?)\s*%/i;
  const downPattern = /(?:down|decreased?|falling|↓)\s*(\d+(?:\.\d+)?)\s*%/i;
  
  const upMatch = html.match(upPattern);
  const downMatch = html.match(downPattern);
  
  if (upMatch) {
    result.trend = 'up';
    result.trendPercent = parseFloat(upMatch[1]);
  } else if (downMatch) {
    result.trend = 'down';
    result.trendPercent = -parseFloat(downMatch[1]);
  }
  
  // Look for trend icons/classes
  if (html.includes('trend-up') || html.includes('trending-up')) {
    result.trend = 'up';
  } else if (html.includes('trend-down') || html.includes('trending-down')) {
    result.trend = 'down';
  }
  
  return result;
}

/**
 * Get price history/trend for a vehicle
 * @param {number} year 
 * @param {string} make 
 * @param {string} model 
 * @returns {Promise<Object|null>}
 */
export async function getPriceHistory(year, make, model) {
  // Hagerty sometimes has historical data embedded in the page
  const valuation = await getValuation(year, make, model);
  
  if (!valuation) return null;
  
  // Try to get additional historical data
  try {
    const url = buildValuationUrl(year, make, model);
    const html = await scraper.fetch(`${url}/price-history`);
    
    // Extract any JSON chart data
    const chartPattern = /(?:chartData|priceHistory)[^=]*=\s*(\[[^\]]+\])/;
    const chartMatch = html.match(chartPattern);
    
    if (chartMatch) {
      const history = JSON.parse(chartMatch[1]);
      return {
        ...valuation,
        history,
      };
    }
  } catch {}
  
  return valuation;
}

/**
 * Get vehicles by category (e.g., "Most Collectible")
 * @param {string} category - Category name
 * @returns {Promise<Array>}
 */
export async function getVehiclesByCategory(category = 'most-collectible') {
  try {
    const url = `/valuation-tools/${category}`;
    const html = await scraper.fetch(url);
    
    const vehicles = [];
    const linkPattern = /href="(\/valuation-tools\/vehicle\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    
    while ((match = linkPattern.exec(html)) !== null) {
      const vehicleUrl = match[1];
      const title = stripTags(match[2]).trim();
      
      if (title && !vehicles.some(v => v.url === vehicleUrl)) {
        vehicles.push({
          url: `https://www.hagerty.com${vehicleUrl}`,
          title,
        });
      }
    }
    
    return vehicles;
  } catch (err) {
    console.error(`[Hagerty] Error fetching category:`, err.message);
    return [];
  }
}

/**
 * Match our car database entry to Hagerty valuation
 * @param {Object} car - Car from our database
 * @returns {Promise<HagertyValuation|null>}
 */
export async function matchCarToHagertyValuation(car) {
  if (!car?.name) return null;
  
  // Extract year - use middle of range if available
  const yearMatch = car.years?.match(/(\d{4})(?:-(\d{4}))?/);
  let year = null;
  
  if (yearMatch) {
    const startYear = parseInt(yearMatch[1]);
    const endYear = yearMatch[2] ? parseInt(yearMatch[2]) : startYear;
    year = Math.floor((startYear + endYear) / 2);
  }
  
  // Extract make and model
  const nameParts = car.name?.split(' ') || [];
  const make = car.brand || nameParts[0];
  const model = nameParts.slice(1).join(' ')
    .replace(/\([^)]+\)/g, '') // Remove parenthetical
    .trim();
  
  if (!year || !make || !model) {
    // Try search instead
    const searchResults = await searchVehicles(car.name);
    if (searchResults.length > 0) {
      const result = searchResults[0];
      const html = await scraper.fetch(result.url);
      const values = extractValuations(html);
      
      if (values) {
        return {
          vehicle: car.name,
          year: result.year,
          make,
          model,
          values,
          ...extractTrend(html),
          url: result.url,
          source: 'Hagerty',
          scrapedAt: new Date().toISOString(),
        };
      }
    }
    return null;
  }
  
  return getValuation(year, make, model);
}

/**
 * Compare our car's value against Hagerty data
 * @param {Object} car - Car from our database with priceAvg
 * @returns {Promise<Object|null>}
 */
export async function compareToHagerty(car) {
  const valuation = await matchCarToHagertyValuation(car);
  
  if (!valuation || !valuation.values) return null;
  
  const ourPrice = car.priceAvg || car.price_avg;
  
  if (!ourPrice) {
    return { valuation, comparison: null };
  }
  
  // Determine which condition our price likely represents
  const { concours, excellent, good, fair } = valuation.values;
  
  let condition = 'unknown';
  let hagertySuggested = null;
  
  if (ourPrice >= (concours * 0.9)) {
    condition = 'concours';
    hagertySuggested = concours;
  } else if (ourPrice >= (excellent * 0.9)) {
    condition = 'excellent';
    hagertySuggested = excellent;
  } else if (ourPrice >= (good * 0.9)) {
    condition = 'good';
    hagertySuggested = good;
  } else {
    condition = 'fair';
    hagertySuggested = fair;
  }
  
  const priceDiff = ourPrice - hagertySuggested;
  const priceDiffPercent = Math.round((priceDiff / hagertySuggested) * 100);
  
  return {
    valuation,
    comparison: {
      ourPrice,
      suggestedCondition: condition,
      hagertyValue: hagertySuggested,
      difference: priceDiff,
      differencePercent: priceDiffPercent,
      assessment: priceDiffPercent > 15 ? 'overpriced' : 
                  priceDiffPercent < -15 ? 'underpriced' : 
                  'fair',
    },
  };
}

export default {
  searchVehicles,
  getValuation,
  getPriceHistory,
  getVehiclesByCategory,
  matchCarToHagertyValuation,
  compareToHagerty,
};






