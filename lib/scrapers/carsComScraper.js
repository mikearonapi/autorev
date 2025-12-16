/**
 * Cars.com Pricing Scraper
 * 
 * Scrapes current for-sale listings from Cars.com to get:
 * - Real market pricing (not theoretical values)
 * - Inventory levels
 * - Price distribution by mileage/condition
 * - Geographic pricing differences
 * 
 * This provides "what you'll actually pay" data vs theoretical valuations.
 * 
 * @module lib/scrapers/carsComScraper
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
  name: 'CarsCom',
  baseUrl: 'https://www.cars.com',
  rateLimit: 15,
  cacheTTL: 2 * 60 * 60 * 1000, // 2 hours (listings change frequently)
});

/**
 * @typedef {Object} CarsComListing
 * @property {string} id - Listing ID
 * @property {string} title - Listing title
 * @property {string} url - Listing URL
 * @property {number} price - Asking price
 * @property {number} year - Model year
 * @property {string} make - Manufacturer
 * @property {string} model - Model name
 * @property {string} trim - Trim level
 * @property {number} mileage - Odometer reading
 * @property {string} transmission - Transmission type
 * @property {string} exteriorColor - Exterior color
 * @property {string} interiorColor - Interior color
 * @property {string} dealerName - Dealer name
 * @property {string} location - Dealer location (city, state)
 * @property {number} distance - Distance from search location (miles)
 * @property {string} thumbnailUrl - Listing image
 */

/**
 * @typedef {Object} CarsComMarketData
 * @property {string} vehicle - Vehicle description
 * @property {number} listingCount - Number of listings found
 * @property {number} averagePrice - Average asking price
 * @property {number} medianPrice - Median asking price
 * @property {number} minPrice - Lowest price
 * @property {number} maxPrice - Highest price
 * @property {number} averageMileage - Average mileage
 * @property {Object} priceByMileage - Price ranges by mileage bands
 * @property {Array<CarsComListing>} listings - Sample listings
 */

/**
 * Build Cars.com search URL
 * @param {Object} params
 * @returns {string}
 */
function buildSearchUrl(params) {
  const {
    make,
    model,
    keyword,
    yearMin,
    yearMax,
    priceMin,
    priceMax,
    mileageMax,
    zipCode = '90210', // Default to LA area
    radius = 500, // Search within 500 miles
    sortBy = 'best_match',
  } = params;
  
  // Cars.com expects array-style parameters like makes[] and models[]
  // Using URLSearchParams with bracket keys ensures correct encoding.
  const urlParams = new URLSearchParams();
  urlParams.set('stock_type', 'all'); // Include new, used, certified
  urlParams.set('maximum_distance', String(radius));
  urlParams.set('zip', String(zipCode));
  urlParams.set('sort', String(sortBy));
  
  if (keyword) urlParams.set('keyword', String(keyword));
  
  // If keyword isn't provided, use structured make/model search
  if (!keyword) {
    if (make) urlParams.append('makes[]', String(make));
    if (make && model) urlParams.append('models[]', `${make}-${model}`);
  }
  
  if (priceMin) urlParams.set('list_price_min', String(priceMin));
  if (priceMax) urlParams.set('list_price_max', String(priceMax));
  
  if (yearMin) urlParams.set('year_min', yearMin);
  if (yearMax) urlParams.set('year_max', yearMax);
  if (mileageMax) urlParams.set('mileage_max', mileageMax);
  
  return `/shopping/results/?${urlParams.toString()}`;
}

/**
 * Filter listings by include/exclude keywords against title/trim
 * @param {CarsComListing[]} listings
 * @param {string[]} [includeKeywords]
 * @param {string[]} [excludeKeywords]
 * @returns {CarsComListing[]}
 */
function filterListingsByKeywords(listings, includeKeywords = [], excludeKeywords = []) {
  const includes = (includeKeywords || []).map(k => String(k).toLowerCase()).filter(Boolean);
  const excludes = (excludeKeywords || []).map(k => String(k).toLowerCase()).filter(Boolean);
  
  if (includes.length === 0 && excludes.length === 0) return listings;
  
  return listings.filter(l => {
    const haystack = `${l?.title || ''} ${l?.trim || ''} ${l?.model || ''}`.toLowerCase();
    const hasInclude = includes.length === 0 || includes.every(k => haystack.includes(k));
    const hasExclude = excludes.some(k => haystack.includes(k));
    return hasInclude && !hasExclude;
  });
}

/**
 * Compute percentile price from sorted array
 * @param {number[]} sortedPrices
 * @param {number} p - 0..1
 */
function percentile(sortedPrices, p) {
  if (!sortedPrices || sortedPrices.length === 0) return null;
  const idx = Math.max(0, Math.min(sortedPrices.length - 1, Math.floor((sortedPrices.length - 1) * p)));
  return sortedPrices[idx];
}

/**
 * Get validated, year-by-year market data for a specific Cars.com make/model slug.
 * This is stricter than `getMarketData` and is intended for accurate enrichment.
 *
 * @param {string} make - Cars.com make slug (e.g. "porsche")
 * @param {string} model - Cars.com model slug (e.g. "718_cayman")
 * @param {Object} options
 * @param {number} options.yearMin
 * @param {number} options.yearMax
 * @param {string[]} [options.includeKeywords] - all must be present
 * @param {string[]} [options.excludeKeywords] - none may be present
 * @param {number} [options.minSample=6] - minimum filtered listings required per year
 * @param {string} [options.zipCode]
 * @returns {Promise<{vehicle:string, years:Array, overall:Object}>}
 */
export async function getYearlyMarketData(make, model, options = {}) {
  const {
    yearMin,
    yearMax,
    keyword,
    includeKeywords = [],
    excludeKeywords = [],
    minSample = 6,
    detailValidation = false,
    detailValidationMax = 25,
    zipCode,
  } = options;
  
  const yMin = Number.isFinite(yearMin) ? yearMin : null;
  const yMax = Number.isFinite(yearMax) ? yearMax : yMin;
  
  if ((!keyword && (!make || !model)) || !yMin || !yMax) {
    return { vehicle: keyword || `${make || ''} ${model || ''}`.trim(), years: [], overall: null };
  }
  
  const years = [];
  
  for (let y = yMin; y <= yMax; y++) {
    const rawListings = await searchListings({
      make,
      model,
      keyword,
      yearMin: y,
      yearMax: y,
      zipCode,
      limit: 100,
    });
    
    let listings = filterListingsByKeywords(rawListings, includeKeywords, excludeKeywords)
      .filter(l => l?.price && l?.year === y);
    
    // If the search results page doesn't contain enough trim info (common on Cars.com),
    // optionally validate by fetching a limited number of listing detail pages.
    if (detailValidation && listings.length < minSample && rawListings.length > 0) {
      const validated = [];
      const maxToCheck = Math.min(detailValidationMax, rawListings.length);
      
      for (let i = 0; i < maxToCheck; i++) {
        const candidate = rawListings[i];
        if (!candidate?.id) continue;
        
        try {
          const details = await getListingDetails(candidate.id);
          const merged = details ? { ...candidate, ...details } : candidate;
          
          const passes = filterListingsByKeywords([merged], includeKeywords, excludeKeywords)
            .filter(l => l?.price && l?.year === y);
          
          if (passes.length > 0) {
            validated.push(passes[0]);
            if (validated.length >= minSample) break;
          }
        } catch {
          // ignore per-listing failures
        }
      }
      
      if (validated.length >= minSample) {
        listings = validated;
      }
    }
    
    if (listings.length < minSample) {
      continue;
    }
    
    const prices = listings.map(l => l.price).filter(Boolean).sort((a, b) => a - b);
    const mileages = listings.map(l => l.mileage).filter(Number.isFinite);
    
    const averagePrice = prices.length > 0
      ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
      : null;
    
    const medianPrice = prices.length > 0
      ? prices[Math.floor(prices.length / 2)]
      : null;
    
    const averageMileage = mileages.length > 0
      ? Math.round(mileages.reduce((a, b) => a + b, 0) / mileages.length)
      : null;
    
    years.push({
      year: y,
      listingCount: listings.length,
      averagePrice,
      medianPrice,
      minPrice: prices[0] || null,
      maxPrice: prices[prices.length - 1] || null,
      p10Price: percentile(prices, 0.10),
      p90Price: percentile(prices, 0.90),
      averageMileage,
      priceByMileage: calculatePriceByMileage(listings),
      // keep only a small sample to avoid bloating payloads
      sampleListings: listings.slice(0, 10),
    });
  }
  
  if (years.length === 0) {
    return { vehicle: keyword || `${make} ${model}`, years: [], overall: null };
  }
  
  // Aggregate across valid years (using median of medians for stability)
  const medians = years.map(y => y.medianPrice).filter(Boolean).sort((a, b) => a - b);
  const overallMedian = medians[Math.floor(medians.length / 2)] || null;
  const overallAverage = Math.round(years.map(y => y.averagePrice).filter(Boolean).reduce((a, b) => a + b, 0) / years.length);
  const overallMin = Math.min(...years.map(y => y.minPrice).filter(Boolean));
  const overallMax = Math.max(...years.map(y => y.maxPrice).filter(Boolean));
  const overallListings = years.reduce((sum, y) => sum + (y.listingCount || 0), 0);
  
  return {
    vehicle: keyword || `${make} ${model}`,
    years,
    overall: {
      yearMin: yMin,
      yearMax: yMax,
      yearsCovered: years.map(y => y.year),
      listingCount: overallListings,
      averagePrice: Number.isFinite(overallAverage) ? overallAverage : null,
      medianPrice: overallMedian,
      minPrice: Number.isFinite(overallMin) ? overallMin : null,
      maxPrice: Number.isFinite(overallMax) ? overallMax : null,
    },
  };
}

/**
 * Search for vehicles on Cars.com
 * @param {Object} params - Search parameters
 * @param {string} params.make - Make (e.g., "BMW")
 * @param {string} params.model - Model (e.g., "M3")
 * @param {number} [params.yearMin] - Minimum year
 * @param {number} [params.yearMax] - Maximum year
 * @param {number} [params.limit=20] - Max results
 * @returns {Promise<CarsComListing[]>}
 */
export async function searchListings(params) {
  const { limit = 20 } = params;
  
  try {
    const url = buildSearchUrl(params);
    const html = await scraper.fetch(url);
    
    const listings = parseSearchResults(html);
    
    return listings.slice(0, limit);
  } catch (err) {
    console.error(`[Cars.com] Error searching:`, err.message);
    return [];
  }
}

/**
 * Parse search results from HTML
 * @param {string} html 
 * @returns {CarsComListing[]}
 */
function parseSearchResults(html) {
  const listings = [];
  
  // Try to extract JSON data first (Cars.com often includes structured data)
  const jsonPattern = /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});/;
  const jsonMatch = html.match(jsonPattern);
  
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      if (data?.vehicles || data?.listings) {
        const vehicleList = data.vehicles || data.listings || [];
        return vehicleList.map(v => normalizeListingData(v));
      }
    } catch {}
  }
  
  // Fallback to HTML parsing
  // Cars.com markup is deeply nested and changes often; avoid brittle single-regex parsing.
  // Instead, slice the HTML into chunks between each `<div class="vehicle-card"...>` start.
  const startMatches = [...html.matchAll(/<div\s+class="vehicle-card"[^>]*>/gi)];
  if (startMatches.length === 0) return listings;
  
  for (let i = 0; i < startMatches.length; i++) {
    const startIdx = startMatches[i].index ?? -1;
    const endIdx = i + 1 < startMatches.length
      ? (startMatches[i + 1].index ?? html.length)
      : html.length;
    
    if (startIdx < 0 || endIdx <= startIdx) continue;
    const cardHtml = html.substring(startIdx, endIdx);
    const listing = parseListingCard(cardHtml);
    if (listing) listings.push(listing);
  }
  
  return listings;
}

/**
 * Parse a single listing card
 * @param {string} cardHtml 
 * @returns {CarsComListing|null}
 */
function parseListingCard(cardHtml) {
  try {
    // Extract URL and ID
    const urlMatch = cardHtml.match(/href="(\/vehicledetail\/[^"]+)"/);
    const url = urlMatch ? `https://www.cars.com${urlMatch[1]}` : null;
    const id = url?.match(/vehicledetail\/([^/?]+)/)?.[1] || null;
    
    // Extract title
    const titleMatch = cardHtml.match(/<h2[^>]*>([^<]+)<\/h2>/i) ||
                       cardHtml.match(/class="[^"]*title[^"]*"[^>]*>([^<]+)/i);
    const title = titleMatch ? decodeEntities(stripTags(titleMatch[1])) : null;
    
    // Extract price
    // Only trust the real listing price element; avoid capturing financing/downpayment widgets.
    const priceMatch = cardHtml.match(/primary-price[^>]*>\s*\$([0-9,]+)/i);
    const price = priceMatch ? parsePrice(priceMatch[1]) : null;
    
    // Extract mileage
    const mileageMatch = cardHtml.match(/([0-9,]+)\s*(?:mi|miles)/i);
    const mileage = mileageMatch ? parseInt(mileageMatch[1].replace(/,/g, '')) : null;
    
    // Extract location
    const locationMatch = cardHtml.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})/);
    const location = locationMatch ? locationMatch[1] : null;
    
    // Extract dealer
    const dealerMatch = cardHtml.match(/class="[^"]*dealer[^"]*"[^>]*>([^<]+)/i);
    const dealerName = dealerMatch ? stripTags(dealerMatch[1]).trim() : null;
    
    // Parse vehicle info from title
    const { year, make, model, trim } = parseVehicleFromTitle(title);
    
    // Extract thumbnail
    const imgMatch = cardHtml.match(/src="([^"]+cars\.com[^"]+)"/);
    const thumbnailUrl = imgMatch ? imgMatch[1] : null;
    
    if (!title || !price) return null;
    
    return {
      id,
      title,
      url,
      price,
      year,
      make,
      model,
      trim,
      mileage,
      dealerName,
      location,
      thumbnailUrl,
      source: 'Cars.com',
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('[Cars.com] Error parsing listing:', err.message);
    return null;
  }
}

/**
 * Normalize listing data from JSON
 * @param {Object} data 
 * @returns {CarsComListing}
 */
function normalizeListingData(data) {
  return {
    id: data.id || data.listing_id,
    title: data.title || `${data.year} ${data.make} ${data.model}`,
    url: data.detail_page_url || data.url,
    price: data.price || data.list_price,
    year: data.year,
    make: data.make,
    model: data.model,
    trim: data.trim,
    mileage: data.mileage,
    transmission: data.transmission,
    exteriorColor: data.exterior_color,
    interiorColor: data.interior_color,
    dealerName: data.dealer_name || data.seller_name,
    location: data.dealer_city ? `${data.dealer_city}, ${data.dealer_state}` : null,
    distance: data.distance,
    thumbnailUrl: data.primary_photo_url || data.thumbnail,
    source: 'Cars.com',
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Parse vehicle info from title
 * @param {string} title 
 * @returns {Object}
 */
function parseVehicleFromTitle(title) {
  if (!title) return { year: null, make: null, model: null, trim: null };
  
  // Pattern: Year Make Model Trim
  const match = title.match(/^(\d{4})\s+([A-Za-z-]+)\s+([A-Za-z0-9-]+)\s*(.*)?$/);
  
  if (match) {
    return {
      year: parseInt(match[1]),
      make: match[2],
      model: match[3],
      trim: match[4]?.trim() || null,
    };
  }
  
  return { year: null, make: null, model: null, trim: null };
}

/**
 * Get market data analysis for a vehicle
 * @param {string} make 
 * @param {string} model 
 * @param {Object} options
 * @returns {Promise<CarsComMarketData>}
 */
export async function getMarketData(make, model, options = {}) {
  const { yearMin, yearMax, zipCode } = options;
  
  const listings = await searchListings({
    make,
    model,
    yearMin,
    yearMax,
    zipCode,
    limit: 100, // Get more for statistical analysis
  });
  
  if (listings.length === 0) {
    return {
      vehicle: `${make} ${model}`,
      listingCount: 0,
      averagePrice: null,
      medianPrice: null,
      minPrice: null,
      maxPrice: null,
      averageMileage: null,
      priceByMileage: null,
      listings: [],
    };
  }
  
  // Calculate statistics
  const prices = listings.map(l => l.price).filter(Boolean).sort((a, b) => a - b);
  const mileages = listings.map(l => l.mileage).filter(Boolean);
  
  const averagePrice = prices.length > 0
    ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
    : null;
  
  const medianPrice = prices.length > 0
    ? prices[Math.floor(prices.length / 2)]
    : null;
  
  const averageMileage = mileages.length > 0
    ? Math.round(mileages.reduce((a, b) => a + b, 0) / mileages.length)
    : null;
  
  // Price by mileage bands
  const priceByMileage = calculatePriceByMileage(listings);
  
  return {
    vehicle: `${make} ${model}`,
    listingCount: listings.length,
    averagePrice,
    medianPrice,
    minPrice: prices.length > 0 ? prices[0] : null,
    maxPrice: prices.length > 0 ? prices[prices.length - 1] : null,
    averageMileage,
    priceByMileage,
    listings: listings.slice(0, 20), // Return top 20 listings
    analysisDate: new Date().toISOString(),
  };
}

/**
 * Calculate average prices by mileage bands
 * @param {CarsComListing[]} listings 
 * @returns {Object}
 */
function calculatePriceByMileage(listings) {
  const bands = {
    'under25k': { min: 0, max: 25000, listings: [] },
    '25k-50k': { min: 25000, max: 50000, listings: [] },
    '50k-75k': { min: 50000, max: 75000, listings: [] },
    '75k-100k': { min: 75000, max: 100000, listings: [] },
    'over100k': { min: 100000, max: Infinity, listings: [] },
  };
  
  for (const listing of listings) {
    if (!listing.mileage || !listing.price) continue;
    
    for (const [key, band] of Object.entries(bands)) {
      if (listing.mileage >= band.min && listing.mileage < band.max) {
        band.listings.push(listing);
        break;
      }
    }
  }
  
  const result = {};
  for (const [key, band] of Object.entries(bands)) {
    const prices = band.listings.map(l => l.price);
    if (prices.length > 0) {
      result[key] = {
        count: prices.length,
        averagePrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
      };
    }
  }
  
  return result;
}

/**
 * Get a specific listing by ID
 * @param {string} listingId 
 * @returns {Promise<Object|null>}
 */
export async function getListingDetails(listingId) {
  try {
    const url = `/vehicledetail/${listingId}/`;
    const html = await scraper.fetch(url);
    
    // Extract JSON-LD
    const jsonLd = extractJsonLd(html);
    
    // Parse the page for detailed info
    const listing = parseListingCard(`<div>${html}</div>`);
    
    if (listing && jsonLd) {
      return {
        ...listing,
        structured: jsonLd,
      };
    }
    
    return listing;
  } catch (err) {
    console.error(`[Cars.com] Error fetching listing:`, err.message);
    return null;
  }
}

/**
 * Match our car database entry to Cars.com market data
 * @param {Object} car - Car from our database
 * @returns {Promise<CarsComMarketData|null>}
 */
export async function matchCarToMarketData(car) {
  if (!car?.name) return null;
  
  // Extract make and model
  const nameParts = car.name?.split(' ') || [];
  const make = car.brand || nameParts[0];
  const model = nameParts.slice(1).join(' ')
    .replace(/\([^)]+\)/g, '') // Remove parenthetical like (996)
    .replace(/E\d{2}|F\d{2}|G\d{2}/gi, '') // Remove BMW chassis codes
    .trim();
  
  // Extract year range
  const yearMatch = car.years?.match(/(\d{4})(?:-(\d{4}))?/);
  const yearMin = yearMatch ? parseInt(yearMatch[1]) : null;
  const yearMax = yearMatch && yearMatch[2] ? parseInt(yearMatch[2]) : yearMin;
  
  if (!make || !model) return null;
  
  return getMarketData(make, model, { yearMin, yearMax });
}

/**
 * Compare our car's price against Cars.com market data
 * @param {Object} car - Car from our database with priceAvg
 * @returns {Promise<Object|null>}
 */
export async function compareToMarket(car) {
  const marketData = await matchCarToMarketData(car);
  
  if (!marketData || !marketData.averagePrice) return null;
  
  const ourPrice = car.priceAvg || car.price_avg;
  
  if (!ourPrice) {
    return { marketData, comparison: null };
  }
  
  const priceDiff = ourPrice - marketData.averagePrice;
  const priceDiffPercent = Math.round((priceDiff / marketData.averagePrice) * 100);
  
  return {
    marketData,
    comparison: {
      ourPrice,
      marketAverage: marketData.averagePrice,
      marketMedian: marketData.medianPrice,
      difference: priceDiff,
      differencePercent: priceDiffPercent,
      position: priceDiffPercent > 10 ? 'above market' :
                priceDiffPercent < -10 ? 'below market' :
                'at market',
      inventoryLevel: marketData.listingCount > 50 ? 'high' :
                      marketData.listingCount > 20 ? 'moderate' :
                      'low',
    },
  };
}

export default {
  searchListings,
  getMarketData,
  getListingDetails,
  matchCarToMarketData,
  compareToMarket,
};


