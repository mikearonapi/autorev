/**
 * Universal Fitment Resolver
 *
 * Resolves vehicle fitment data from any source (tags, Y/M/M/S, freeform text)
 * to AutoRev car_id. Combines pattern matching, SEMA-style lookups, and
 * fuzzy matching for comprehensive fitment resolution.
 *
 * @module lib/fitmentResolver
 */

import { supabaseServiceRole, isSupabaseConfigured } from './supabase.js';
import { resolveCarSlugsFromTags, PLATFORM_TAG_PATTERNS } from './vendorAdapters.js';

// Cache for cars data
let carsCache = null;
let carsCacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// ============================================================================
// CAR DATA LOADING
// ============================================================================

/**
 * Load all cars from database (cached)
 * @returns {Promise<Array>}
 */
async function loadCars() {
  if (carsCache && Date.now() - carsCacheTime < CACHE_TTL) {
    return carsCache;
  }

  if (!isSupabaseConfigured || !supabaseServiceRole) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabaseServiceRole
    .from('cars')
    .select('id, slug, name')
    .order('name');

  if (error) throw error;

  carsCache = data;
  carsCacheTime = Date.now();
  return data;
}

/**
 * Clear the cars cache
 */
export function clearCache() {
  carsCache = null;
  carsCacheTime = 0;
}

// ============================================================================
// NORMALIZATION UTILITIES
// ============================================================================

/**
 * Normalize make name
 * @param {string} make
 * @returns {string}
 */
export function normalizeMake(make) {
  if (!make) return '';

  const makeMap = {
    chevrolet: ['chevy', 'chevrolet', 'gm'],
    'mercedes-benz': ['mercedes', 'mercedes-benz', 'mercedes benz', 'mb', 'merc'],
    'alfa romeo': ['alfa', 'alfa romeo'],
    bmw: ['bmw', 'bimmer'],
    volkswagen: ['vw', 'volkswagen'],
    'aston martin': ['aston martin', 'aston'],
    'land rover': ['land rover', 'landrover'],
  };

  const lower = make.toLowerCase().trim();

  for (const [canonical, aliases] of Object.entries(makeMap)) {
    if (aliases.includes(lower)) {
      return canonical;
    }
  }

  return lower;
}

/**
 * Normalize model name
 * @param {string} model
 * @returns {string}
 */
export function normalizeModel(model) {
  if (!model) return '';

  return model
    .toLowerCase()
    .trim()
    // Remove common suffixes
    .replace(/\s*(sedan|coupe|hatchback|wagon|convertible|roadster|cab|spyder)$/i, '')
    // Normalize spaces
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse year string to range
 * @param {string} yearStr - Year string like "2015", "2015-2020", "2015+"
 * @returns {{ start: number, end: number } | null}
 */
export function parseYearRange(yearStr) {
  if (!yearStr) return null;

  const str = String(yearStr).trim();

  // Range: "2015-2020"
  const rangeMatch = str.match(/(\d{4})\s*[-–]\s*(\d{4})/);
  if (rangeMatch) {
    return {
      start: parseInt(rangeMatch[1], 10),
      end: parseInt(rangeMatch[2], 10),
    };
  }

  // Plus: "2015+"
  const plusMatch = str.match(/(\d{4})\s*\+/);
  if (plusMatch) {
    return {
      start: parseInt(plusMatch[1], 10),
      end: new Date().getFullYear() + 1,
    };
  }

  // Single year
  const singleMatch = str.match(/\b(19|20)\d{2}\b/);
  if (singleMatch) {
    const year = parseInt(singleMatch[0], 10);
    return { start: year, end: year };
  }

  return null;
}

/**
 * Extract year from car name
 * @param {string} carName
 * @returns {{ start: number, end: number } | null}
 */
function extractYearFromName(carName) {
  if (!carName) return null;

  // Try range pattern first
  const rangeMatch = carName.match(/(\d{4})\s*[-–]\s*(\d{4}|present|current|\+)/i);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const endStr = rangeMatch[2].toLowerCase();
    const end = ['present', 'current', '+'].includes(endStr)
      ? new Date().getFullYear() + 1
      : parseInt(endStr, 10);
    return { start, end };
  }

  // Single year
  const singleMatch = carName.match(/\b(19|20)\d{2}\b/);
  if (singleMatch) {
    const year = parseInt(singleMatch[0], 10);
    // Give ±2 year tolerance for single years in names
    return { start: year - 2, end: year + 2 };
  }

  return null;
}

// ============================================================================
// RESOLUTION METHODS
// ============================================================================

/**
 * Resolution result type
 * @typedef {Object} FitmentMatch
 * @property {string} car_id - UUID of the car
 * @property {string} car_slug - Slug of the car
 * @property {string} car_name - Name of the car
 * @property {number} confidence - 0-1 confidence score
 * @property {string} method - Resolution method used
 */

/**
 * Resolve from Year/Make/Model/Submodel data
 * @param {Object} ymms - Vehicle data
 * @param {number|string} ymms.year - Year
 * @param {string} ymms.make - Make
 * @param {string} ymms.model - Model
 * @param {string} [ymms.submodel] - Submodel/trim
 * @param {Object} [options] - Options
 * @param {number} [options.minConfidence=0.5] - Minimum confidence threshold
 * @returns {Promise<FitmentMatch | null>}
 */
export async function resolveFromYMMS(ymms, options = {}) {
  const { minConfidence = 0.5 } = options;
  const cars = await loadCars();

  const year = parseInt(String(ymms.year), 10);
  const make = normalizeMake(ymms.make);
  const model = normalizeModel(ymms.model);
  const submodel = ymms.submodel?.toLowerCase() || '';

  let bestMatch = null;
  let bestScore = 0;

  for (const car of cars) {
    let score = 0;
    const carName = car.name.toLowerCase();
    const carSlug = car.slug.toLowerCase();

    // Make match (30 points)
    if (carName.includes(make) || carSlug.includes(make.replace(/\s+/g, '-'))) {
      score += 30;
    }

    // Model match (40 points)
    const modelWords = model.split(' ').filter((w) => w.length > 1);
    let modelMatches = 0;
    for (const word of modelWords) {
      if (carName.includes(word) || carSlug.includes(word)) {
        modelMatches++;
      }
    }
    if (modelMatches > 0) {
      score += Math.min(40, (modelMatches / modelWords.length) * 40);
    }

    // Year match (20 points)
    if (!isNaN(year)) {
      const carYearRange = extractYearFromName(car.name);
      if (carYearRange && year >= carYearRange.start && year <= carYearRange.end) {
        score += 20;
      }
    }

    // Submodel/chassis code match (10 points)
    if (submodel) {
      const submodelWords = submodel.split(/\s+/).filter((w) => w.length > 1);
      for (const word of submodelWords) {
        if (carName.includes(word) || carSlug.includes(word)) {
          score += 5;
        }
      }
    }

    // Normalize to 0-1
    const confidence = Math.min(score / 100, 1);

    if (confidence > bestScore && confidence >= minConfidence) {
      bestScore = confidence;
      bestMatch = {
        car_id: car.id,
        car_slug: car.slug,
        car_name: car.name,
        confidence,
        method: 'ymms',
      };
    }
  }

  return bestMatch;
}

/**
 * Resolve from vendor tags using pattern matching
 * @param {string[]} tags - Array of tags
 * @param {Object} [options] - Options
 * @param {string[]} [options.families] - Families to search
 * @param {number} [options.minConfidence=0.5] - Minimum confidence
 * @returns {Promise<FitmentMatch[]>}
 */
export async function resolveFromTags(tags, options = {}) {
  const { families = [], minConfidence = 0.5 } = options;

  // Use vendor adapters pattern matching
  const patternResults = resolveCarSlugsFromTags(tags, families);

  // Filter by confidence
  const validResults = patternResults.filter((r) => r.confidence >= minConfidence);

  // Look up car_id for each result
  const cars = await loadCars();
  const carsMap = new Map(cars.map((c) => [c.slug, c]));

  const results = [];
  for (const result of validResults) {
    const car = carsMap.get(result.car_slug);
    if (car) {
      results.push({
        car_id: car.id,
        car_slug: car.slug,
        car_name: car.name,
        confidence: result.confidence,
        method: 'pattern',
        matched_tags: result.tags,
      });
    }
  }

  return results;
}

/**
 * Resolve from freeform text (product title, description)
 * @param {string} text - Text to parse
 * @param {Object} [options] - Options
 * @param {number} [options.minConfidence=0.5] - Minimum confidence
 * @returns {Promise<FitmentMatch[]>}
 */
export async function resolveFromText(text, options = {}) {
  const { minConfidence = 0.5 } = options;

  if (!text) return [];

  // Extract potential tags/patterns from text
  const potentialTags = [];

  // Add the whole text as a tag
  potentialTags.push(text);

  // Extract year patterns
  const yearPatterns = text.match(/\b(19|20)\d{2}[-–]?(19|20)?\d{0,2}\b/g) || [];
  potentialTags.push(...yearPatterns);

  // Extract chassis codes
  const chassisCodes =
    text.match(
      /\b(MK[78]|E[39][026]|F[89][02]|G[89]0|8[VY]|B[89]|991|997|718|R35|VA|GD|GR|GV|FK8|FL5|S550|S197|C[5678])\b/gi
    ) || [];
  potentialTags.push(...chassisCodes);

  // Extract model names
  const modelPatterns =
    text.match(
      /\b(GTI|Golf R|RS3|TT RS|M3|M4|M5|911|Cayman|GT-R|WRX|STI|Evo|Civic|Type R|Mustang|Camaro|Corvette|Supra|BRZ|86)\b/gi
    ) || [];
  potentialTags.push(...modelPatterns);

  // Use tag resolution
  const results = await resolveFromTags(potentialTags, { minConfidence });

  // Mark method as text
  return results.map((r) => ({ ...r, method: 'text' }));
}

/**
 * Universal resolver - tries all methods
 * @param {Object} input - Input data
 * @param {string[]} [input.tags] - Tags
 * @param {Object} [input.ymms] - Year/Make/Model/Submodel
 * @param {string} [input.text] - Freeform text
 * @param {Object} [options] - Options
 * @returns {Promise<FitmentMatch | null>}
 */
export async function resolve(input, options = {}) {
  const { minConfidence = 0.5 } = options;
  const results = [];

  // Try YMMS first (most reliable)
  if (input.ymms) {
    const ymmsResult = await resolveFromYMMS(input.ymms, { minConfidence });
    if (ymmsResult) {
      results.push(ymmsResult);
    }
  }

  // Try tags
  if (input.tags?.length) {
    const tagResults = await resolveFromTags(input.tags, { minConfidence });
    results.push(...tagResults);
  }

  // Try text
  if (input.text) {
    const textResults = await resolveFromText(input.text, { minConfidence });
    results.push(...textResults);
  }

  // Return best result
  if (results.length === 0) return null;

  // Sort by confidence descending
  results.sort((a, b) => b.confidence - a.confidence);
  return results[0];
}

/**
 * Batch resolve multiple inputs
 * @param {Array<Object>} inputs - Array of inputs
 * @param {Object} [options] - Options
 * @returns {Promise<Map<number, FitmentMatch>>}
 */
export async function resolveBatch(inputs, options = {}) {
  const results = new Map();

  // Pre-load cars
  await loadCars();

  for (let i = 0; i < inputs.length; i++) {
    const result = await resolve(inputs[i], options);
    if (result) {
      results.set(i, result);
    }
  }

  return results;
}

// ============================================================================
// DATABASE SYNC
// ============================================================================

/**
 * Check if a fitment mapping exists
 * @param {string} vendorKey - Vendor key
 * @param {string} tag - Tag
 * @returns {Promise<Object|null>}
 */
export async function getExistingMapping(vendorKey, tag) {
  if (!isSupabaseConfigured) return null;

  const MAPPING_COLS = 'id, vendor_key, vendor_tag, car_id, car_slug, car_variant_id, confidence, source, notes, created_at';
  
  const { data, error } = await supabaseServiceRole
    .from('fitment_tag_mappings')
    .select(MAPPING_COLS)
    .eq('vendor_key', vendorKey)
    .eq('vendor_tag', tag)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Save a resolved fitment as a mapping for future lookups
 * @param {Object} mapping - Mapping data
 * @param {string} mapping.vendorKey - Vendor key
 * @param {string} mapping.tag - Original tag
 * @param {string} mapping.carSlug - Resolved car slug
 * @param {number} mapping.confidence - Confidence score
 * @returns {Promise<void>}
 */
export async function saveMapping(mapping) {
  if (!isSupabaseConfigured) return;

  const { vendorKey, tag, carSlug, confidence } = mapping;

  await supabaseServiceRole.from('fitment_tag_mappings').upsert(
    {
      vendor_key: vendorKey,
      vendor_tag: tag,
      car_slug: carSlug,
      confidence,
      verified: false,
      metadata: {
        resolved_at: new Date().toISOString(),
        method: 'fitmentResolver',
      },
    },
    { onConflict: 'vendor_key,vendor_tag' }
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

const fitmentResolver = {
  // Core resolution
  resolve,
  resolveBatch,
  resolveFromYMMS,
  resolveFromTags,
  resolveFromText,
  // Utilities
  normalizeMake,
  normalizeModel,
  parseYearRange,
  clearCache,
  // Database
  getExistingMapping,
  saveMapping,
};

export default fitmentResolver;
