/**
 * Data Aggregator Service
 * 
 * Unifies data from all external sources (APIs and scrapers) into
 * a single, enriched view of vehicle data.
 * 
 * Sources integrated:
 * - EPA Fuel Economy (FREE API)
 * - NHTSA Safety (FREE API) - recalls, complaints, TSBs, ratings
 * - IIHS Safety (scraper)
 * - Bring a Trailer (scraper) - auction prices
 * - Hagerty (scraper) - collector valuations
 * - Cars.com (scraper) - market pricing
 * - Car and Driver (scraper) - expert reviews
 * - MotorTrend (scraper) - expert reviews
 * 
 * @module lib/dataAggregator
 */

import * as epaService from './epaFuelEconomyService.js';
import * as nhtsaService from './nhtsaSafetyService.js';
import * as iihsScraper from './scrapers/iihsScraper.js';
import * as batScraper from './scrapers/bringATrailerScraper.js';
import * as hagertyScraper from './scrapers/hagertyScraper.js';
import * as carsComScraper from './scrapers/carsComScraper.js';
import * as cadScraper from './scrapers/carAndDriverScraper.js';
import * as mtScraper from './scrapers/motorTrendScraper.js';

/**
 * @typedef {Object} EnrichedCarData
 * @property {Object} car - Original car data
 * @property {Object} fuelEconomy - EPA fuel economy data
 * @property {Object} safety - Combined NHTSA + IIHS safety data
 * @property {Object} pricing - Market pricing from BaT, Hagerty, Cars.com
 * @property {Object} reviews - Expert reviews from C&D, MotorTrend
 * @property {Object} metadata - Aggregation metadata
 */

/**
 * Parse year/make/model from our car database entry
 * @param {Object} car 
 * @returns {Object}
 */
function parseCarIdentifiers(car) {
  if (!car) return { year: null, make: null, model: null };
  
  // Extract year range
  const yearMatch = car.years?.match(/(\d{4})(?:-(\d{4}))?/);
  let year = null;
  if (yearMatch) {
    const startYear = parseInt(yearMatch[1]);
    const endYear = yearMatch[2] ? parseInt(yearMatch[2]) : startYear;
    // Use middle of range for lookups
    year = Math.floor((startYear + endYear) / 2);
  }
  
  // Extract make
  const nameParts = car.name?.split(' ') || [];
  const make = car.brand || nameParts[0];
  
  // Extract model (everything after make, cleaned up)
  const model = nameParts.slice(1).join(' ')
    .replace(/\([^)]+\)/g, '') // Remove (996) style annotations
    .replace(/E\d{2}|F\d{2}|G\d{2}|W\d{3}/gi, '') // Remove BMW/Mercedes chassis codes
    .replace(/\s+/g, ' ')
    .trim();
  
  return { year, make, model };
}

/**
 * Fetch all data for a car from external sources
 * This is the main aggregation function
 * 
 * @param {Object} car - Car from our database
 * @param {Object} options
 * @param {boolean} [options.includeScraped=true] - Include scraped data
 * @param {boolean} [options.includeApis=true] - Include API data
 * @param {string[]} [options.sources] - Specific sources to fetch (null = all)
 * @returns {Promise<EnrichedCarData>}
 */
export async function aggregateCarData(car, options = {}) {
  const {
    includeScraped = true,
    includeApis = true,
    sources = null, // null means all sources
  } = options;
  
  const { year, make, model } = parseCarIdentifiers(car);
  
  const result = {
    car,
    identifiers: { year, make, model },
    fuelEconomy: null,
    safety: {
      nhtsa: null,
      iihs: null,
    },
    pricing: {
      bringATrailer: null,
      hagerty: null,
      carsCom: null,
    },
    reviews: {
      carAndDriver: null,
      motorTrend: null,
    },
    metadata: {
      aggregatedAt: new Date().toISOString(),
      sources: [],
      errors: [],
    },
  };
  
  if (!year || !make || !model) {
    result.metadata.errors.push('Could not parse year/make/model from car data');
    return result;
  }
  
  // Build list of fetch operations
  const fetchOperations = [];
  
  // === FREE APIs ===
  if (includeApis) {
    // EPA Fuel Economy
    if (!sources || sources.includes('epa')) {
      fetchOperations.push({
        name: 'epa',
        promise: epaService.getComprehensiveFuelData(car),
        handler: (data) => {
          if (data) {
            result.fuelEconomy = data;
            result.metadata.sources.push('EPA');
          }
        },
      });
    }
    
    // NHTSA Safety (comprehensive including TSBs)
    if (!sources || sources.includes('nhtsa')) {
      fetchOperations.push({
        name: 'nhtsa',
        promise: nhtsaService.fetchComprehensiveSafetyData({ year, make, model }),
        handler: (data) => {
          if (data && !data.error) {
            result.safety.nhtsa = data;
            result.metadata.sources.push('NHTSA');
          }
        },
      });
    }
  }
  
  // === SCRAPED DATA ===
  if (includeScraped) {
    // IIHS Safety
    if (!sources || sources.includes('iihs')) {
      fetchOperations.push({
        name: 'iihs',
        promise: iihsScraper.getIIHSRatings(year, make, model),
        handler: (data) => {
          if (data) {
            result.safety.iihs = data;
            result.metadata.sources.push('IIHS');
          }
        },
      });
    }
    
    // Bring a Trailer pricing
    if (!sources || sources.includes('bat')) {
      fetchOperations.push({
        name: 'bat',
        promise: batScraper.matchCarToBaTData(car),
        handler: (data) => {
          if (data && data.sampleSize > 0) {
            result.pricing.bringATrailer = data;
            result.metadata.sources.push('Bring a Trailer');
          }
        },
      });
    }
    
    // Hagerty valuations
    if (!sources || sources.includes('hagerty')) {
      fetchOperations.push({
        name: 'hagerty',
        promise: hagertyScraper.matchCarToHagertyValuation(car),
        handler: (data) => {
          if (data && data.values) {
            result.pricing.hagerty = data;
            result.metadata.sources.push('Hagerty');
          }
        },
      });
    }
    
    // Cars.com market data
    if (!sources || sources.includes('carscom')) {
      fetchOperations.push({
        name: 'carscom',
        promise: carsComScraper.matchCarToMarketData(car),
        handler: (data) => {
          if (data && data.listingCount > 0) {
            result.pricing.carsCom = data;
            result.metadata.sources.push('Cars.com');
          }
        },
      });
    }
    
    // Car and Driver reviews
    if (!sources || sources.includes('cad')) {
      fetchOperations.push({
        name: 'cad',
        promise: cadScraper.matchCarToCaDReviews(car),
        handler: (data) => {
          if (data && data.reviewCount > 0) {
            result.reviews.carAndDriver = data;
            result.metadata.sources.push('Car and Driver');
          }
        },
      });
    }
    
    // MotorTrend reviews
    if (!sources || sources.includes('motortrend')) {
      fetchOperations.push({
        name: 'motortrend',
        promise: mtScraper.matchCarToReviews(car),
        handler: (data) => {
          if (data && data.reviewCount > 0) {
            result.reviews.motorTrend = data;
            result.metadata.sources.push('MotorTrend');
          }
        },
      });
    }
  }
  
  // Execute all operations in parallel with error handling
  await Promise.all(
    fetchOperations.map(async (op) => {
      try {
        const data = await op.promise;
        op.handler(data);
      } catch (err) {
        console.error(`[DataAggregator] Error fetching ${op.name}:`, err.message);
        result.metadata.errors.push(`${op.name}: ${err.message}`);
      }
    })
  );
  
  // Add computed summaries
  result.summary = computeSummary(result);
  
  return result;
}

/**
 * Compute summary statistics from aggregated data
 * @param {EnrichedCarData} data 
 * @returns {Object}
 */
function computeSummary(data) {
  const summary = {
    hasData: data.metadata.sources.length > 0,
    sourceCount: data.metadata.sources.length,
  };
  
  // Fuel economy summary
  if (data.fuelEconomy?.epa) {
    summary.fuelEconomy = {
      combinedMpg: data.fuelEconomy.epa.combinedMpg,
      annualFuelCost: data.fuelEconomy.annualCostEstimate,
    };
  }
  
  // Safety summary
  summary.safety = {};
  
  if (data.safety.nhtsa) {
    const nhtsa = data.safety.nhtsa;
    summary.safety.recallCount = nhtsa.recalls?.length || 0;
    summary.safety.complaintCount = nhtsa.complaints?.length || 0;
    summary.safety.tsbCount = nhtsa.tsbs?.length || 0;
    summary.safety.nhtsaRating = nhtsa.safetyRatings?.overallRating;
  }
  
  if (data.safety.iihs) {
    summary.safety.iihsRating = data.safety.iihs.overallAssessment;
    summary.safety.topSafetyPick = data.safety.iihs.topSafetyPick || data.safety.iihs.topSafetyPickPlus;
  }
  
  // Pricing summary
  summary.pricing = {};
  
  const priceSources = [];
  
  if (data.pricing.bringATrailer?.averagePrice) {
    priceSources.push({
      source: 'BaT',
      price: data.pricing.bringATrailer.averagePrice,
      type: 'auction',
    });
    summary.pricing.batAverage = data.pricing.bringATrailer.averagePrice;
    summary.pricing.batSampleSize = data.pricing.bringATrailer.sampleSize;
  }
  
  if (data.pricing.hagerty?.values?.good) {
    priceSources.push({
      source: 'Hagerty',
      price: data.pricing.hagerty.values.good,
      type: 'valuation',
    });
    summary.pricing.hagertyGood = data.pricing.hagerty.values.good;
    summary.pricing.hagertyTrend = data.pricing.hagerty.trend;
  }
  
  if (data.pricing.carsCom?.averagePrice) {
    priceSources.push({
      source: 'Cars.com',
      price: data.pricing.carsCom.averagePrice,
      type: 'listing',
    });
    summary.pricing.carsComAverage = data.pricing.carsCom.averagePrice;
    summary.pricing.carsComInventory = data.pricing.carsCom.listingCount;
  }
  
  // Calculate consensus price
  if (priceSources.length > 0) {
    const prices = priceSources.map(p => p.price);
    summary.pricing.consensusPrice = Math.round(
      prices.reduce((a, b) => a + b, 0) / prices.length
    );
    summary.pricing.priceRange = {
      low: Math.min(...prices),
      high: Math.max(...prices),
    };
    summary.pricing.sourcesUsed = priceSources.length;
  }
  
  // Reviews summary
  summary.reviews = {};
  
  if (data.reviews.carAndDriver?.primaryReview?.rating) {
    summary.reviews.carAndDriverRating = data.reviews.carAndDriver.primaryReview.rating;
  }
  
  if (data.reviews.motorTrend?.primaryReview?.rating) {
    summary.reviews.motorTrendRating = data.reviews.motorTrend.primaryReview.rating;
  }
  
  // Calculate average expert rating
  const ratings = [
    summary.reviews.carAndDriverRating,
    summary.reviews.motorTrendRating,
  ].filter(Boolean);
  
  if (ratings.length > 0) {
    summary.reviews.averageRating = Math.round(
      (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10
    ) / 10;
  }
  
  return summary;
}

/**
 * Fetch only FREE API data (no scraping)
 * Use this for fast, reliable data without rate limit concerns
 * 
 * @param {Object} car 
 * @returns {Promise<Object>}
 */
export async function fetchFreeApiData(car) {
  return aggregateCarData(car, {
    includeScraped: false,
    includeApis: true,
    sources: ['epa', 'nhtsa'],
  });
}

/**
 * Fetch pricing data only
 * @param {Object} car 
 * @returns {Promise<Object>}
 */
export async function fetchPricingData(car) {
  return aggregateCarData(car, {
    includeScraped: true,
    includeApis: false,
    sources: ['bat', 'hagerty', 'carscom'],
  });
}

/**
 * Fetch safety data only
 * @param {Object} car 
 * @returns {Promise<Object>}
 */
export async function fetchSafetyData(car) {
  return aggregateCarData(car, {
    includeScraped: true,
    includeApis: true,
    sources: ['nhtsa', 'iihs'],
  });
}

/**
 * Fetch expert reviews only
 * @param {Object} car 
 * @returns {Promise<Object>}
 */
export async function fetchReviewData(car) {
  return aggregateCarData(car, {
    includeScraped: true,
    includeApis: false,
    sources: ['cad', 'motortrend'],
  });
}

/**
 * Batch fetch data for multiple cars
 * Useful for building/updating database
 * 
 * @param {Object[]} cars - Array of cars
 * @param {Object} options
 * @param {number} [options.concurrency=3] - Max concurrent fetches
 * @param {Function} [options.onProgress] - Progress callback
 * @returns {Promise<EnrichedCarData[]>}
 */
export async function batchAggregateCarData(cars, options = {}) {
  const { concurrency = 3, onProgress } = options;
  
  const results = [];
  
  // Process in batches to avoid overwhelming APIs
  for (let i = 0; i < cars.length; i += concurrency) {
    const batch = cars.slice(i, i + concurrency);
    
    const batchResults = await Promise.all(
      batch.map(car => aggregateCarData(car, options))
    );
    
    results.push(...batchResults);
    
    if (onProgress) {
      onProgress({
        completed: results.length,
        total: cars.length,
        percent: Math.round((results.length / cars.length) * 100),
      });
    }
    
    // Small delay between batches to be respectful
    if (i + concurrency < cars.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Get data quality score for aggregated data
 * @param {EnrichedCarData} data 
 * @returns {Object}
 */
export function assessDataQuality(data) {
  const scores = {
    fuelEconomy: data.fuelEconomy ? 1 : 0,
    nhtsaSafety: data.safety.nhtsa ? 1 : 0,
    iihsSafety: data.safety.iihs ? 1 : 0,
    batPricing: data.pricing.bringATrailer?.sampleSize > 0 ? 1 : 0,
    hagertyPricing: data.pricing.hagerty?.values ? 1 : 0,
    carsComPricing: data.pricing.carsCom?.listingCount > 0 ? 1 : 0,
    cadReviews: data.reviews.carAndDriver?.reviewCount > 0 ? 1 : 0,
    mtReviews: data.reviews.motorTrend?.reviewCount > 0 ? 1 : 0,
  };
  
  const totalPossible = Object.keys(scores).length;
  const totalAchieved = Object.values(scores).reduce((a, b) => a + b, 0);
  
  return {
    scores,
    overall: Math.round((totalAchieved / totalPossible) * 100),
    grade: totalAchieved >= 7 ? 'A' :
           totalAchieved >= 5 ? 'B' :
           totalAchieved >= 3 ? 'C' :
           totalAchieved >= 1 ? 'D' : 'F',
    missing: Object.entries(scores)
      .filter(([_, v]) => v === 0)
      .map(([k]) => k),
  };
}

export default {
  aggregateCarData,
  fetchFreeApiData,
  fetchPricingData,
  fetchSafetyData,
  fetchReviewData,
  batchAggregateCarData,
  assessDataQuality,
};
