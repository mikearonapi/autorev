/**
 * SEMA Fitment Mapper
 *
 * Maps SEMA Year/Make/Model/Submodel data to AutoRev car_id.
 * Provides utilities for resolving SEMA vehicle data to our database.
 *
 * @module lib/semaFitmentMapper
 */

import { supabaseServiceRole, isSupabaseConfigured } from './supabase.js';
import { mapCategory } from './semaDataClient.js';

// Cache for car lookups to reduce DB queries
const carCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Normalize make name for matching
 * @param {string} make - Make name
 * @returns {string}
 */
function normalizeMake(make) {
  if (!make) return '';

  const makeMap = {
    chevrolet: ['chevy', 'chevrolet'],
    'mercedes-benz': ['mercedes', 'mercedes-benz', 'mercedes benz', 'mb'],
    'alfa romeo': ['alfa', 'alfa romeo'],
    bmw: ['bmw'],
    volkswagen: ['vw', 'volkswagen'],
    porsche: ['porsche'],
    audi: ['audi'],
    ford: ['ford'],
    dodge: ['dodge'],
    toyota: ['toyota'],
    honda: ['honda'],
    acura: ['acura'],
    lexus: ['lexus'],
    nissan: ['nissan'],
    infiniti: ['infiniti'],
    subaru: ['subaru'],
    mazda: ['mazda'],
    mitsubishi: ['mitsubishi'],
    cadillac: ['cadillac'],
    pontiac: ['pontiac'],
    shelby: ['shelby'],
    scion: ['scion'],
    lotus: ['lotus'],
    maserati: ['maserati'],
    lamborghini: ['lamborghini'],
    ferrari: ['ferrari'],
    mclaren: ['mclaren'],
    'aston martin': ['aston martin', 'aston'],
    jaguar: ['jaguar'],
    genesis: ['genesis'],
    hyundai: ['hyundai'],
    kia: ['kia'],
  };

  const lowerMake = make.toLowerCase().trim();

  for (const [canonical, aliases] of Object.entries(makeMap)) {
    if (aliases.includes(lowerMake)) {
      return canonical;
    }
  }

  return lowerMake;
}

/**
 * Normalize model name for matching
 * @param {string} model - Model name
 * @returns {string}
 */
function normalizeModel(model) {
  if (!model) return '';

  return model
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Extract year range from car name
 * @param {string} carName - Car name from DB
 * @returns {{ startYear: number, endYear: number } | null}
 */
function extractYearRange(carName) {
  if (!carName) return null;

  // Patterns like "2015-2021", "2020+", "2019-present"
  const rangeMatch = carName.match(/(\d{4})\s*[-–]\s*(\d{4}|present|now|\+)/i);
  if (rangeMatch) {
    const startYear = parseInt(rangeMatch[1], 10);
    const endYearStr = rangeMatch[2].toLowerCase();
    const endYear =
      endYearStr === 'present' || endYearStr === 'now' || endYearStr === '+'
        ? new Date().getFullYear() + 1
        : parseInt(endYearStr, 10);
    return { startYear, endYear };
  }

  // Single year pattern
  const singleMatch = carName.match(/\b(19|20)\d{2}\b/);
  if (singleMatch) {
    const year = parseInt(singleMatch[0], 10);
    return { startYear: year, endYear: year };
  }

  return null;
}

/**
 * Get all cars from database (cached)
 * @returns {Promise<Array>}
 */
async function getAllCars() {
  const cacheKey = 'all_cars';
  const cached = carCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  if (!isSupabaseConfigured || !supabaseServiceRole) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabaseServiceRole
    .from('cars')
    .select('id, slug, name')
    .order('name');

  if (error) throw error;

  carCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

/**
 * Build search patterns for a car
 * @param {Object} car - Car object from DB
 * @returns {Object}
 */
function buildSearchPatterns(car) {
  const name = car.name.toLowerCase();
  const slug = car.slug.toLowerCase();

  // Extract key identifiers
  const patterns = {
    name,
    slug,
    makes: [],
    models: [],
    generations: [],
    yearRange: extractYearRange(car.name),
  };

  // Common make patterns
  const makePatterns = [
    { pattern: /\b(bmw)\b/i, make: 'bmw' },
    { pattern: /\b(audi)\b/i, make: 'audi' },
    { pattern: /\b(volkswagen|vw)\b/i, make: 'volkswagen' },
    { pattern: /\b(porsche)\b/i, make: 'porsche' },
    { pattern: /\b(toyota)\b/i, make: 'toyota' },
    { pattern: /\b(lexus)\b/i, make: 'lexus' },
    { pattern: /\b(honda)\b/i, make: 'honda' },
    { pattern: /\b(acura)\b/i, make: 'acura' },
    { pattern: /\b(nissan)\b/i, make: 'nissan' },
    { pattern: /\b(infiniti)\b/i, make: 'infiniti' },
    { pattern: /\b(subaru)\b/i, make: 'subaru' },
    { pattern: /\b(mazda)\b/i, make: 'mazda' },
    { pattern: /\b(mitsubishi)\b/i, make: 'mitsubishi' },
    { pattern: /\b(ford)\b/i, make: 'ford' },
    { pattern: /\b(chevrolet|chevy)\b/i, make: 'chevrolet' },
    { pattern: /\b(dodge)\b/i, make: 'dodge' },
    { pattern: /\b(cadillac)\b/i, make: 'cadillac' },
    { pattern: /\b(shelby)\b/i, make: 'shelby' },
    { pattern: /\b(mercedes)\b/i, make: 'mercedes-benz' },
    { pattern: /\bcamaro\b/i, make: 'chevrolet' },
    { pattern: /\bcorvette\b/i, make: 'chevrolet' },
    { pattern: /\bmustang\b/i, make: 'ford' },
    { pattern: /\bchallenger|charger\b/i, make: 'dodge' },
    { pattern: /\bsupra\b/i, make: 'toyota' },
    { pattern: /\bgte?86|brz|fr-?s\b/i, make: 'toyota' },
  ];

  for (const { pattern, make } of makePatterns) {
    if (pattern.test(name) || pattern.test(slug)) {
      patterns.makes.push(make);
    }
  }

  // Model patterns
  const modelPatterns = [
    { pattern: /\bm3\b/i, model: 'm3' },
    { pattern: /\bm4\b/i, model: 'm4' },
    { pattern: /\bm5\b/i, model: 'm5' },
    { pattern: /\bm2\b/i, model: 'm2' },
    { pattern: /\brs3\b/i, model: 'rs3' },
    { pattern: /\brs5\b/i, model: 'rs5' },
    { pattern: /\btt\s?rs\b/i, model: 'tt rs' },
    { pattern: /\bgti\b/i, model: 'gti' },
    { pattern: /\bgolf\s?r\b/i, model: 'golf r' },
    { pattern: /\b911\b/i, model: '911' },
    { pattern: /\bcayman\b/i, model: 'cayman' },
    { pattern: /\bboxster\b/i, model: 'boxster' },
    { pattern: /\bgt-?r\b/i, model: 'gt-r' },
    { pattern: /\b370z\b/i, model: '370z' },
    { pattern: /\b350z\b/i, model: '350z' },
    { pattern: /\bwrx\b/i, model: 'wrx' },
    { pattern: /\bsti\b/i, model: 'wrx sti' },
    { pattern: /\bevo\s?(x|10|8|9|viii|ix)\b/i, model: 'lancer evolution' },
    { pattern: /\bcivic.*type\s?r\b/i, model: 'civic type r' },
    { pattern: /\bcivic.*si\b/i, model: 'civic si' },
    { pattern: /\bs2000\b/i, model: 's2000' },
    { pattern: /\bintegra\b/i, model: 'integra' },
    { pattern: /\brsx\b/i, model: 'rsx' },
    { pattern: /\bmustang\b/i, model: 'mustang' },
    { pattern: /\bgt350\b/i, model: 'mustang shelby gt350' },
    { pattern: /\bgt500\b/i, model: 'mustang shelby gt500' },
    { pattern: /\bcamaro\b/i, model: 'camaro' },
    { pattern: /\bzl1\b/i, model: 'camaro zl1' },
    { pattern: /\bcorvette\b/i, model: 'corvette' },
    { pattern: /\bsupra\b/i, model: 'supra' },
    { pattern: /\bgr86|gt86\b/i, model: 'gr86' },
    { pattern: /\bbrz\b/i, model: 'brz' },
    { pattern: /\bmiata|mx-?5\b/i, model: 'mx-5 miata' },
    { pattern: /\brx-?7\b/i, model: 'rx-7' },
    { pattern: /\bhellcat\b/i, model: 'challenger' },
    { pattern: /\bcts-?v\b/i, model: 'cts-v' },
    { pattern: /\bss\b.*\bchevrolet\b|\bchevrolet\b.*\bss\b/i, model: 'ss' },
    { pattern: /\bc63\b/i, model: 'c63 amg' },
    { pattern: /\be63\b/i, model: 'e63 amg' },
  ];

  for (const { pattern, model } of modelPatterns) {
    if (pattern.test(name) || pattern.test(slug)) {
      patterns.models.push(model);
    }
  }

  // Generation patterns
  const genPatterns = [
    { pattern: /\be46\b/i, gen: 'e46' },
    { pattern: /\be92|e90\b/i, gen: 'e92' },
    { pattern: /\bf80\b/i, gen: 'f80' },
    { pattern: /\bf82\b/i, gen: 'f82' },
    { pattern: /\bg80\b/i, gen: 'g80' },
    { pattern: /\b8v\b/i, gen: '8v' },
    { pattern: /\b8y\b/i, gen: '8y' },
    { pattern: /\bb9\b/i, gen: 'b9' },
    { pattern: /\bmk7\b/i, gen: 'mk7' },
    { pattern: /\bmk8\b/i, gen: 'mk8' },
    { pattern: /\b997\b/i, gen: '997' },
    { pattern: /\b991\b/i, gen: '991' },
    { pattern: /\b981\b/i, gen: '981' },
    { pattern: /\b718\b/i, gen: '718' },
    { pattern: /\br35\b/i, gen: 'r35' },
    { pattern: /\bva\b/i, gen: 'va' },
    { pattern: /\bgr\s?gv|gd\b/i, gen: 'gr/gv' },
    { pattern: /\ba90\b/i, gen: 'a90' },
    { pattern: /\ba80\b/i, gen: 'a80' },
    { pattern: /\bfk8\b/i, gen: 'fk8' },
    { pattern: /\bfl5\b/i, gen: 'fl5' },
    { pattern: /\bs550\b/i, gen: 's550' },
    { pattern: /\bc8\b/i, gen: 'c8' },
    { pattern: /\bc7\b/i, gen: 'c7' },
    { pattern: /\bc6\b/i, gen: 'c6' },
    { pattern: /\bc5\b/i, gen: 'c5' },
  ];

  for (const { pattern, gen } of genPatterns) {
    if (pattern.test(name) || pattern.test(slug)) {
      patterns.generations.push(gen);
    }
  }

  return patterns;
}

/**
 * Calculate match score between SEMA vehicle and AutoRev car
 * @param {Object} semaVehicle - SEMA vehicle data
 * @param {Object} carPatterns - Patterns from buildSearchPatterns
 * @returns {number} - Score 0-100
 */
function calculateMatchScore(semaVehicle, carPatterns) {
  let score = 0;
  const { year, make, model, submodel } = semaVehicle;

  const semaMake = normalizeMake(make);
  const semaModel = normalizeModel(model);
  const semaSubmodel = normalizeModel(submodel || '');

  // Make match (30 points)
  if (carPatterns.makes.includes(semaMake)) {
    score += 30;
  }

  // Model match (40 points)
  for (const carModel of carPatterns.models) {
    if (semaModel.includes(carModel) || carModel.includes(semaModel)) {
      score += 40;
      break;
    }
    // Partial match
    if (
      semaModel.split(' ').some((word) => carModel.includes(word)) ||
      carModel.split(' ').some((word) => semaModel.includes(word))
    ) {
      score += 20;
      break;
    }
  }

  // Year match (20 points)
  if (carPatterns.yearRange) {
    const semaYear = parseInt(year, 10);
    if (semaYear >= carPatterns.yearRange.startYear && semaYear <= carPatterns.yearRange.endYear) {
      score += 20;
    }
  }

  // Generation/trim match from submodel (10 points)
  for (const gen of carPatterns.generations) {
    if (semaSubmodel.includes(gen) || semaModel.includes(gen)) {
      score += 10;
      break;
    }
  }

  return Math.min(score, 100);
}

/**
 * Resolve SEMA vehicle to AutoRev car_id
 * @param {Object} semaVehicle - SEMA vehicle data
 * @param {number} semaVehicle.year - Year
 * @param {string} semaVehicle.make - Make name
 * @param {string} semaVehicle.model - Model name
 * @param {string} [semaVehicle.submodel] - Submodel name
 * @param {Object} [options] - Options
 * @param {number} [options.minScore=60] - Minimum score threshold
 * @returns {Promise<{ car_id: string, car_slug: string, confidence: number } | null>}
 */
export async function resolveSemaVehicle(semaVehicle, options = {}) {
  const { minScore = 60 } = options;
  const cars = await getAllCars();

  let bestMatch = null;
  let bestScore = 0;

  for (const car of cars) {
    const patterns = buildSearchPatterns(car);
    const score = calculateMatchScore(semaVehicle, patterns);

    if (score > bestScore && score >= minScore) {
      bestScore = score;
      bestMatch = car;
    }
  }

  if (!bestMatch) {
    return null;
  }

  return {
    car_id: bestMatch.id,
    car_slug: bestMatch.slug,
    confidence: bestScore / 100,
    matched_name: bestMatch.name,
  };
}

/**
 * Resolve multiple SEMA vehicles to car_ids (batched)
 * @param {Array<Object>} semaVehicles - Array of SEMA vehicle objects
 * @param {Object} [options] - Options
 * @returns {Promise<Map<string, Object>>}
 */
export async function resolveSemaVehiclesBatch(semaVehicles, options = {}) {
  const results = new Map();

  // Pre-fetch all cars once
  const cars = await getAllCars();
  const carPatternsCache = new Map();

  for (const car of cars) {
    carPatternsCache.set(car.id, buildSearchPatterns(car));
  }

  for (const semaVehicle of semaVehicles) {
    const key = `${semaVehicle.year}-${semaVehicle.make}-${semaVehicle.model}-${semaVehicle.submodel || ''}`;

    if (results.has(key)) continue;

    let bestMatch = null;
    let bestScore = 0;

    for (const car of cars) {
      const patterns = carPatternsCache.get(car.id);
      const score = calculateMatchScore(semaVehicle, patterns);

      if (score > bestScore && score >= (options.minScore || 60)) {
        bestScore = score;
        bestMatch = car;
      }
    }

    if (bestMatch) {
      results.set(key, {
        car_id: bestMatch.id,
        car_slug: bestMatch.slug,
        confidence: bestScore / 100,
        matched_name: bestMatch.name,
      });
    }
  }

  return results;
}

/**
 * Map SEMA product to AutoRev part format
 * @param {Object} semaProduct - SEMA product data
 * @param {Object} [fitment] - Resolved fitment data
 * @returns {Object}
 */
export function mapSemaProductToPart(semaProduct, fitment = null) {
  const {
    PartNumber,
    ProductName,
    BrandName,
    BrandID,
    Description,
    Category,
    SubCategory,
    ListPrice,
    JobberPrice,
    RetailPrice,
  } = semaProduct;

  // Determine category
  let category = 'other';
  if (Category) {
    category = mapCategory(Category);
  }

  // Build attributes
  const attributes = {
    system: category,
    subSystem: SubCategory || null,
    vehicleTags: [],
    fitment: {
      notes: null,
      modelYears: null,
      engineCodes: [],
      drivetrain: null,
      transmission: null,
    },
    gains: {
      hp: null,
      tq: null,
      notes: null,
    },
    compliance: {
      emissions: null,
      emissionsNotes: null,
      noiseNotes: null,
    },
    install: {
      difficulty: null,
      laborHours: null,
      requiresTune: null,
      requiresSupportingMods: [],
    },
    source: {
      vendor: 'sema_data',
      externalId: `${BrandID}-${PartNumber}`,
      brandId: BrandID,
      category: Category,
      subCategory: SubCategory,
      raw: {
        listPrice: ListPrice,
        jobberPrice: JobberPrice,
        retailPrice: RetailPrice,
      },
    },
  };

  // Determine price (prefer retail, then list, then jobber)
  let priceCents = null;
  const price = RetailPrice || ListPrice || JobberPrice;
  if (price) {
    priceCents = Math.round(parseFloat(price) * 100);
  }

  return {
    brand_name: BrandName,
    name: ProductName,
    part_number: PartNumber,
    category,
    description: Description || null,
    attributes,
    quality_tier: 'standard',
    street_legal: null,
    source_urls: ['https://www.semadata.org'],
    confidence: 0.75, // SEMA data is generally reliable
    is_active: true,
    // Fitment data if resolved
    fitment: fitment
      ? {
          car_id: fitment.car_id,
          confidence: fitment.confidence,
        }
      : null,
    // Pricing
    price_cents: priceCents,
  };
}

/**
 * Clear the car cache
 */
export function clearCache() {
  carCache.clear();
}

// ============================================================================
// EXPORTS
// ============================================================================

const semaFitmentMapper = {
  resolveSemaVehicle,
  resolveSemaVehiclesBatch,
  mapSemaProductToPart,
  clearCache,
  // Utilities
  normalizeMake,
  normalizeModel,
  extractYearRange,
};

export default semaFitmentMapper;
