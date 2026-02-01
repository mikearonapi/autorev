/**
 * Engine Platform Identification
 *
 * Maps cars to their specific engine platforms for accurate tuning data.
 * This is the foundation for platform-based tuning templates.
 *
 * IMPORTANT: Engine platform must be identified from cars.engine field,
 * NOT from tuning profile data (to prevent circular contamination).
 */

/**
 * Engine platform definitions
 * Each platform has:
 * - patterns: Regex patterns to match against cars.engine
 * - manufacturers: Which car brands use this platform
 * - stockWhpRange: Expected WHP range for validation
 * - displayName: Human-readable name for UI
 */
export const ENGINE_PLATFORMS = {
  // ============================================================================
  // AUDI / VOLKSWAGEN PLATFORMS
  // ============================================================================

  EA888_GEN1: {
    key: 'EA888_GEN1',
    displayName: 'EA888 Gen1 2.0T',
    patterns: [/2\.0L.*Turbo.*I4/i],
    manufacturers: ['volkswagen', 'audi'],
    modelHints: ['GTI Mk5', 'GTI Mk6', 'A4 B8', 'A3 8P'],
    stockWhpRange: [170, 220],
    years: [2008, 2013],
  },

  EA888_GEN3: {
    key: 'EA888_GEN3',
    displayName: 'EA888 Gen3 2.0T',
    patterns: [/2\.0L.*Turbo.*I4/i],
    manufacturers: ['volkswagen', 'audi'],
    modelHints: ['GTI Mk7', 'GTI Mk8', 'Golf R', 'S3', 'A3 8V'],
    stockWhpRange: [200, 280],
    years: [2014, 2026],
  },

  '25_TFSI': {
    key: '25_TFSI',
    displayName: '2.5L TFSI 5-Cylinder',
    patterns: [/2\.5L.*Turbo.*I5/i, /2\.5L.*TFSI/i, /2\.5.*Turbo.*5/i],
    manufacturers: ['audi'],
    modelHints: ['RS3', 'TT RS'],
    stockWhpRange: [320, 380],
    years: [2011, 2026],
  },

  '29_TFSI': {
    key: '29_TFSI',
    displayName: '2.9L TFSI Twin-Turbo V6',
    patterns: [/2\.9L.*TT.*V6/i, /2\.9L.*Twin.*Turbo.*V6/i, /2\.9.*TFSI/i, /2\.9L.*Turbo.*V6/i],
    manufacturers: ['audi'],
    modelHints: ['RS5', 'RS4', 'S6', 'S7'],
    stockWhpRange: [360, 420],
    years: [2017, 2026],
  },

  '30_TFSI_SC': {
    key: '30_TFSI_SC',
    displayName: '3.0L TFSI Supercharged V6',
    patterns: [/3\.0L.*Supercharged.*V6/i, /3\.0.*SC.*V6/i],
    manufacturers: ['audi'],
    modelHints: ['S4 B8', 'S5 B8', 'A6', 'A7'],
    stockWhpRange: [280, 340],
    years: [2009, 2017],
  },

  '40_TFSI': {
    key: '40_TFSI',
    displayName: '4.0L TFSI Twin-Turbo V8',
    patterns: [/4\.0L.*Twin.*Turbo.*V8/i, /4\.0L.*TT.*V8/i, /4\.0.*TFSI/i],
    manufacturers: ['audi'],
    modelHints: ['RS6', 'RS7', 'S8'],
    stockWhpRange: [480, 560],
    years: [2013, 2026],
  },

  // ============================================================================
  // BMW PLATFORMS
  // ============================================================================

  N54: {
    key: 'N54',
    displayName: 'N54 3.0L Twin-Turbo I6',
    patterns: [/N54/i, /3\.0L.*Twin.*Turbo.*I6.*\(N54\)/i, /3\.0L.*TT.*I6.*N54/i],
    manufacturers: ['bmw'],
    modelHints: ['135i', '335i E90', '535i'],
    stockWhpRange: [260, 320],
    years: [2006, 2013],
  },

  N55: {
    key: 'N55',
    displayName: 'N55 3.0L Turbo I6',
    patterns: [/N55/i, /3\.0L.*Turbo.*I6.*\(N55\)/i],
    manufacturers: ['bmw'],
    modelHints: ['335i F30', 'M235i', 'X5 35i'],
    stockWhpRange: [280, 340],
    years: [2010, 2018],
  },

  S55: {
    key: 'S55',
    displayName: 'S55 3.0L Twin-Turbo I6',
    patterns: [/S55/i, /3\.0L.*TT.*I6.*S55/i],
    manufacturers: ['bmw'],
    modelHints: ['M3 F80', 'M4 F82', 'M2 Competition'],
    stockWhpRange: [340, 400],
    years: [2014, 2020],
  },

  B58: {
    key: 'B58',
    displayName: 'B58 3.0L Turbo I6',
    patterns: [/B58/i, /3\.0L.*Turbo.*I6.*\(B58\)/i],
    manufacturers: ['bmw', 'toyota'],
    modelHints: ['M340i', 'Supra A90', 'Z4 M40i'],
    stockWhpRange: [300, 380],
    years: [2015, 2026],
  },

  S58: {
    key: 'S58',
    displayName: 'S58 3.0L Twin-Turbo I6',
    patterns: [/S58/i, /3\.0L.*Twin.*Turbo.*I6.*\(S58\)/i, /3\.0L.*TT.*Inline-6.*\(S58\)/i],
    manufacturers: ['bmw'],
    modelHints: ['M3 G80', 'M4 G82', 'M2 G87', 'X3M', 'X4M'],
    stockWhpRange: [400, 480],
    years: [2020, 2026],
  },

  S54: {
    key: 'S54',
    displayName: 'S54 3.2L NA I6',
    patterns: [/S54/i, /3\.2L.*NA.*I6.*S54/i],
    manufacturers: ['bmw'],
    modelHints: ['M3 E46', 'Z4M'],
    stockWhpRange: [280, 340],
    years: [2000, 2008],
  },

  S65: {
    key: 'S65',
    displayName: 'S65 4.0L NA V8',
    patterns: [/S65/i, /4\.0L.*NA.*V8.*S65/i],
    manufacturers: ['bmw'],
    modelHints: ['M3 E90', 'M3 E92', 'M3 E93'],
    stockWhpRange: [360, 400],
    years: [2007, 2013],
  },

  // ============================================================================
  // FORD PLATFORMS
  // ============================================================================

  ECOBOOST_23: {
    key: 'ECOBOOST_23',
    displayName: '2.3L EcoBoost I4',
    patterns: [/2\.3L.*EcoBoost/i, /2\.3L.*Turbo.*I4/i],
    manufacturers: ['ford'],
    modelHints: ['Mustang EcoBoost', 'Focus RS', 'Ranger'],
    stockWhpRange: [280, 340],
    years: [2015, 2026],
  },

  ECOBOOST_35: {
    key: 'ECOBOOST_35',
    displayName: '3.5L EcoBoost V6',
    patterns: [/3\.5L.*EcoBoost/i, /3\.5L.*Twin.*Turbo.*V6/i],
    manufacturers: ['ford'],
    modelHints: ['F-150', 'Raptor', 'Explorer ST'],
    stockWhpRange: [320, 420],
    years: [2011, 2026],
  },

  COYOTE: {
    key: 'COYOTE',
    displayName: '5.0L Coyote V8',
    patterns: [/Coyote/i, /5\.0L.*V8/i, /5\.0L.*NA.*V8/i],
    manufacturers: ['ford'],
    modelHints: ['Mustang GT', 'F-150 5.0'],
    stockWhpRange: [380, 440],
    years: [2011, 2026],
  },

  VOODOO: {
    key: 'VOODOO',
    displayName: '5.2L Voodoo Flat-Plane V8',
    patterns: [/Voodoo/i, /5\.2L.*V8/i, /Flat.*Plane/i],
    manufacturers: ['ford'],
    modelHints: ['GT350', 'GT350R'],
    stockWhpRange: [480, 520],
    years: [2015, 2020],
  },

  // ============================================================================
  // SUBARU PLATFORMS
  // ============================================================================

  EJ257: {
    key: 'EJ257',
    displayName: 'EJ257 2.5L Turbo Boxer',
    patterns: [/EJ257/i, /2\.5L.*Turbo.*Boxer/i, /2\.5L.*Turbo.*H4/i],
    manufacturers: ['subaru'],
    modelHints: ['WRX STI'],
    stockWhpRange: [260, 300],
    years: [2004, 2021],
  },

  FA20_TURBO: {
    key: 'FA20_TURBO',
    displayName: 'FA20 2.0L Turbo Boxer',
    patterns: [/FA20.*Turbo/i, /2\.0L.*Turbo.*Boxer/i],
    manufacturers: ['subaru'],
    modelHints: ['WRX VA'],
    stockWhpRange: [240, 280],
    years: [2015, 2021],
  },

  FA24_TURBO: {
    key: 'FA24_TURBO',
    displayName: 'FA24 2.4L Turbo Boxer',
    patterns: [/FA24/i, /2\.4L.*Turbo.*Boxer/i],
    manufacturers: ['subaru'],
    modelHints: ['WRX VB'],
    stockWhpRange: [250, 290],
    years: [2022, 2026],
  },

  // ============================================================================
  // HONDA PLATFORMS
  // ============================================================================

  K20C1: {
    key: 'K20C1',
    displayName: 'K20C1 2.0L Turbo I4',
    patterns: [/K20C1/i, /2\.0L.*Turbo.*I4.*K20/i],
    manufacturers: ['honda'],
    modelHints: ['Civic Type R FK8', 'Civic Type R FL5'],
    stockWhpRange: [270, 320],
    years: [2017, 2026],
  },

  // ============================================================================
  // GM PLATFORMS
  // ============================================================================

  LT1_C7: {
    key: 'LT1_C7',
    displayName: 'LT1 6.2L V8',
    patterns: [/LT1/i, /6\.2L.*V8.*LT1/i],
    manufacturers: ['chevrolet'],
    modelHints: ['Corvette C7', 'Camaro SS'],
    stockWhpRange: [420, 480],
    years: [2014, 2019],
  },

  LT2: {
    key: 'LT2',
    displayName: 'LT2 6.2L V8',
    patterns: [/LT2/i, /6\.2L.*V8.*LT2/i],
    manufacturers: ['chevrolet'],
    modelHints: ['Corvette C8'],
    stockWhpRange: [420, 460],
    years: [2020, 2026],
  },

  LT4: {
    key: 'LT4',
    displayName: 'LT4 6.2L Supercharged V8',
    patterns: [/LT4/i, /6\.2L.*Supercharged.*V8/i],
    manufacturers: ['chevrolet'],
    modelHints: ['Corvette Z06 C7', 'Camaro ZL1'],
    stockWhpRange: [560, 620],
    years: [2015, 2026],
  },
};

/**
 * Identify the engine platform for a car
 * @param {Object} car - Car object with engine, slug, name, years fields
 * @returns {Object|null} - Platform info or null if unknown
 */
export function identifyEnginePlatform(car) {
  if (!car || !car.engineType) {
    return null;
  }

  const engine = car.engineType;
  const manufacturer = car.slug?.split('-')[0]?.toLowerCase() || '';
  const carName = car.name?.toLowerCase() || '';
  const carSlug = car.slug?.toLowerCase() || '';

  // Get car year from new schema (year integer) or old schema (years string)
  let carYear = null;
  if (car.year) {
    carYear = car.year;
  } else if (car.yearStart) {
    carYear = car.yearStart;
  } else if (car.years) {
    const yearMatch = car.years.match(/(\d{4})/);
    if (yearMatch) carYear = parseInt(yearMatch[1]);
  }

  // Find matching platforms
  const candidates = [];

  for (const [platformKey, platform] of Object.entries(ENGINE_PLATFORMS)) {
    // Skip if manufacturer doesn't match
    if (platform.manufacturers && platform.manufacturers.length > 0) {
      const mfrMatch = platform.manufacturers.some(
        (mfr) => manufacturer.includes(mfr) || carSlug.includes(mfr)
      );
      if (!mfrMatch) continue;
    }

    // Check if engine matches any pattern
    const patternMatch = platform.patterns.some((pattern) => pattern.test(engine));
    if (!patternMatch) continue;

    // Calculate confidence score
    let confidence = 50; // Base score for pattern match

    // Boost if model hints match
    if (platform.modelHints) {
      const modelMatch = platform.modelHints.some(
        (hint) =>
          carName.includes(hint.toLowerCase()) ||
          carSlug.includes(hint.toLowerCase().replace(/\s+/g, '-'))
      );
      if (modelMatch) confidence += 30;
    }

    // Boost if year range matches
    if (carYear && platform.years) {
      if (carYear >= platform.years[0] && carYear <= platform.years[1]) {
        confidence += 20;
      } else {
        confidence -= 20; // Penalty for year mismatch
      }
    }

    candidates.push({
      platform: platformKey,
      config: platform,
      confidence,
    });
  }

  // Return highest confidence match
  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  const best = candidates[0];

  // Only return if confidence is reasonable
  if (best.confidence < 40) {
    return null;
  }

  return {
    platform: best.platform,
    displayName: best.config.displayName,
    config: best.config,
    confidence: best.confidence,
  };
}

/**
 * Get all platforms for a manufacturer
 * @param {string} manufacturer - e.g., 'audi', 'bmw'
 * @returns {Object[]} - Array of platform configs
 */
export function getPlatformsForManufacturer(manufacturer) {
  const mfr = manufacturer.toLowerCase();
  return Object.values(ENGINE_PLATFORMS).filter((p) => p.manufacturers?.includes(mfr));
}

/**
 * Validate that a stock WHP value is reasonable for a platform
 * @param {string} platformKey - Platform key
 * @param {number} stockWhp - Claimed stock WHP
 * @returns {Object} - { valid: boolean, expected: [min, max], message: string }
 */
export function validateStockWhp(platformKey, stockWhp) {
  const platform = ENGINE_PLATFORMS[platformKey];
  if (!platform || !platform.stockWhpRange) {
    return { valid: true, message: 'No validation data for platform' };
  }

  const [min, max] = platform.stockWhpRange;
  const tolerance = 50; // Allow 50 WHP tolerance

  if (stockWhp < min - tolerance || stockWhp > max + tolerance) {
    return {
      valid: false,
      expected: platform.stockWhpRange,
      message: `Stock WHP ${stockWhp} outside expected range ${min}-${max} for ${platform.displayName}`,
    };
  }

  return { valid: true, expected: platform.stockWhpRange };
}

const enginePlatforms = {
  ENGINE_PLATFORMS,
  identifyEnginePlatform,
  getPlatformsForManufacturer,
  validateStockWhp,
};

export default enginePlatforms;
