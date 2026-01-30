/**
 * AutoRev - Performance Calculator Constants
 *
 * SINGLE SOURCE OF TRUTH for all performance calculation constants.
 * Consolidated from:
 * - lib/upgradeCalculator.js
 * - lib/performance.js
 * - lib/buildPerformanceCalculator.js
 * - lib/upgrades.js
 *
 * Physics model from performanceCalculatorV2.js was merged in on 2026-01-24.
 *
 * @module lib/performanceCalculator/constants
 */

// =============================================================================
// TUNE AND MOD RELATIONSHIPS
// =============================================================================

/**
 * What mods are typically included/assumed by stage tunes.
 * Stage 2 tune gains are calibrated assuming supporting hardware is installed.
 * Stage 3 tune gains are calibrated assuming fuel system + major power adders.
 *
 * IMPORTANT: The required mods differ by engine type:
 * - Turbo: downpipe + intake for Stage 2
 * - SC: pulley upgrade + intake for Stage 2
 * - NA: headers + intake for Stage 2
 *
 * When both a stage tune AND these mods are selected, the mod gains are reduced
 * because the tune's calibration already assumes they're installed.
 */
export const STAGE_TUNE_INCLUDED_MODS = {
  // Stage 2 - bolt-ons that require a tune
  'stage2-tune': [
    'downpipe',
    'intake',
    'headers',
    'pulley-tune-sc',
    'boost-controller',
    'camshaft-mild',
  ],
  // Stage 3 - major power requiring fuel system
  'stage3-tune': [
    'downpipe',
    'intake',
    'headers',
    'turbo-upgrade-existing',
    'intercooler',
    'supercharger-centrifugal',
    'supercharger-roots',
    'turbo-kit-single',
    'turbo-kit-twin',
    'camshaft-aggressive',
    'nitrous',
    'flex-fuel-e85',
  ],
};

/**
 * Get the mods expected by a tune for a specific engine type.
 * This allows engine-type-aware overlap detection.
 *
 * @param {string} tuneKey - The tune key (stage1-tune, stage2-tune, stage3-tune)
 * @param {string} engineCategory - Engine category ('na', 'turbo', 'sc')
 * @returns {string[]} - Array of mod keys expected by this tune for this engine type
 */
export function getExpectedModsForTune(tuneKey, engineCategory) {
  if (tuneKey === 'stage2-tune') {
    switch (engineCategory) {
      case 'turbo':
        return ['downpipe', 'intake', 'boost-controller'];
      case 'sc':
        return ['pulley-tune-sc', 'intake'];
      case 'na':
      default:
        return ['headers', 'intake', 'camshaft-mild'];
    }
  }

  if (tuneKey === 'stage3-tune') {
    switch (engineCategory) {
      case 'turbo':
        return ['downpipe', 'intake', 'turbo-upgrade-existing', 'intercooler', 'flex-fuel-e85'];
      case 'sc':
        return ['pulley-tune-sc', 'intake', 'intercooler', 'flex-fuel-e85'];
      case 'na':
      default:
        return [
          'headers',
          'intake',
          'supercharger-centrifugal',
          'supercharger-roots',
          'turbo-kit-single',
          'turbo-kit-twin',
          'camshaft-aggressive',
          'nitrous',
          'flex-fuel-e85',
        ];
    }
  }

  // Stage 1 doesn't have required mods
  return [];
}

/**
 * Tune categories - these REPLACE each other, don't stack.
 * Stage 2 includes Stage 1 gains, Stage 3 includes Stage 2.
 * Tunes are now UNIVERSAL across all engine types (NA, Turbo, SC).
 * The gains differ by engine type but all cars can be tuned.
 */
export const TUNE_HIERARCHY = {
  // Priority order: higher number = more comprehensive
  'stage3-tune': { priority: 5, includes: ['stage2-tune', 'stage1-tune'] },
  'stage2-tune': { priority: 4, includes: ['stage1-tune'] },
  'stage1-tune': { priority: 2, includes: [] },
  'piggyback-tuner': { priority: 1.5, includes: [] }, // Separate path, conflicts with flash tunes
};

// =============================================================================
// EXHAUST CATEGORIES
// =============================================================================

/**
 * Exhaust subcategories - mods in same subcategory have diminishing returns.
 * Mods in different subcategories (headers vs catback) also don't fully stack.
 */
export const EXHAUST_SUBCATEGORIES = {
  headers: ['headers'],
  catback: ['exhaust-catback'],
  axleback: ['exhaust-axleback'],
  downpipe: ['downpipe'],
  fullSystem: ['full-exhaust'],
};

// =============================================================================
// CATEGORY CAPS AND LIMITS
// =============================================================================

/**
 * Category caps - max realistic gains from each category.
 * Prevents unrealistic stacking.
 */
export const CATEGORY_CAPS = {
  // Exhaust system total (headers + catback + midpipe etc)
  exhaustTotal: { na: 50, turbo: 40, sc: 35 },
  // Intake category total (intake + throttle body + manifold)
  intakeTotal: { na: 25, turbo: 30, sc: 20 },
  // Tune category - only one tune applies
  tuneTotal: { na: 40, turbo: 150, sc: 100 },
};

/**
 * Simplified category caps for multiplier-based calculations
 */
export const CATEGORY_CAPS_SIMPLE = {
  exhaust: { na: 50, turbo: 40 },
  tune: { na: 40, turbo: 150 },
  intake: { na: 25, turbo: 30 },
};

/**
 * Maximum realistic gains by category as percent of stock HP.
 * Used for physics-based calculations.
 */
export const CATEGORY_CAPS_PERCENT = {
  NA: {
    exhaust: 0.1, // 10% max from exhaust on NA
    intake: 0.05, // 5% max from intake on NA
    tune: 0.08, // 8% max from tune on NA
    bolt_ons_total: 0.15, // 15% max from all bolt-ons combined
    forced_induction: 0.6, // 60% from adding FI
  },
  Turbo: {
    exhaust: 0.08,
    intake: 0.05,
    tune_stage1: 0.25,
    tune_stage2: 0.45,
    tune_stage3: 0.7,
    bolt_ons_total: 0.55,
    turbo_upgrade: 0.35,
  },
  Supercharged: {
    exhaust: 0.06,
    intake: 0.04,
    tune: 0.15, // Pulley + tune
    bolt_ons_total: 0.25,
  },
};

// =============================================================================
// DIMINISHING RETURNS
// =============================================================================

/**
 * Diminishing returns factor for same-subcategory mods.
 * Second mod in same category only gives this % of stated gain.
 */
export const DIMINISHING_RETURNS_FACTOR = 0.3;

/**
 * Cross-category diminishing returns (e.g., headers + catback).
 * These work well together but don't fully stack.
 */
export const EXHAUST_CROSS_CATEGORY_FACTOR = 0.85;

/**
 * Category-specific stacking diminishing returns
 */
export const DIMINISHING_RETURNS = {
  exhaust: 0.85, // Second exhaust mod gives 85% of stated gain
  intake: 0.8,
  tune: 0.0, // Only one tune counts
};

// =============================================================================
// CONFIDENCE TIERS
// =============================================================================

/**
 * Confidence tiers for performance predictions.
 * Tier 1: Verified dyno data
 * Tier 2: Engine family calibration
 * Tier 3: Physics model
 * Tier 4: Generic fallback
 */
export const CONFIDENCE_TIERS = {
  VERIFIED: { tier: 1, min: 0.9, max: 0.99, label: 'Verified' },
  CALIBRATED: { tier: 2, min: 0.7, max: 0.85, label: 'Calibrated' },
  PHYSICS: { tier: 3, min: 0.55, max: 0.7, label: 'Estimated' },
  GENERIC: { tier: 4, min: 0.4, max: 0.5, label: 'Approximate' },
};

// =============================================================================
// PHYSICS CONSTANTS
// =============================================================================

/**
 * Physics model constants based on real-world engine efficiency data.
 */
export const PHYSICS_CONSTANTS = {
  // Drivetrain losses
  DRIVETRAIN_EFFICIENCY: {
    FWD: 0.88,
    RWD: 0.85,
    AWD: 0.8,
  },

  // Aspiration-based boost headroom
  BOOST_MULTIPLIERS: {
    NA: 1.0,
    Turbo: 1.3, // Turbo responds well to mods
    TwinTurbo: 1.25, // Already optimized, less headroom
    Supercharged: 1.15,
    TwinSC: 1.1,
  },

  // Category stacking diminishing returns
  DIMINISHING_RETURNS: {
    exhaust: 0.85,
    intake: 0.8,
    tune: 0.0, // Only one tune counts
  },
};

// =============================================================================
// MOD HP GAINS (Lookup Table)
// =============================================================================

/**
 * Base HP gains by mod type for multiplier-based calculations.
 * Values are {na: X, turbo: Y, sc: Z} for naturally aspirated, turbo, and supercharged engines.
 * SC falls back to turbo values if not specified.
 *
 * Stage tunes are now universal - NA cars get tunes too, just with different gains.
 */
export const MOD_HP_GAINS = {
  // Exhaust
  'exhaust-axleback': { na: 5, turbo: 5, sc: 5 },
  'exhaust-catback': { na: 12, turbo: 12, sc: 10 },
  headers: { na: 25, turbo: 15, sc: 15 },
  downpipe: { na: 0, turbo: 20, sc: 0 }, // Turbo-only

  // Intake
  intake: { na: 12, turbo: 15, sc: 12 },

  // Stage Tunes - Universal across all engine types
  // NA gains are modest (timing/fuel optimization)
  // Turbo/SC gains are larger (boost increase)
  'stage1-tune': { na: 20, turbo: 60, sc: 50 },
  'stage2-tune': { na: 40, turbo: 100, sc: 80 },
  'stage3-tune': { na: 80, turbo: 180, sc: 140 },
  'piggyback-tuner': { na: 15, turbo: 45, sc: 35 },

  // Camshafts - Universal
  'camshaft-mild': { na: 30, turbo: 20, sc: 20 },
  'camshaft-aggressive': { na: 60, turbo: 40, sc: 35 },

  // Cooling
  intercooler: { na: 0, turbo: 20, sc: 15 },

  // Forced induction - Adding to NA cars
  'turbo-upgrade-existing': { na: 0, turbo: 120, sc: 0 },
  'turbo-kit-single': { na: 200, turbo: 0, sc: 0 },
  'turbo-kit-twin': { na: 320, turbo: 0, sc: 0 },
  'supercharger-centrifugal': { na: 160, turbo: 0, sc: 0 },
  'supercharger-roots': { na: 250, turbo: 0, sc: 0 },

  // Turbo/SC specific upgrades
  'boost-controller': { na: 0, turbo: 35, sc: 0 },
  'pulley-tune-sc': { na: 0, turbo: 0, sc: 70 },

  // Fuel
  'flex-fuel-e85': { na: 40, turbo: 70, sc: 60 },
  'fuel-system-upgrade': { na: 0, turbo: 10, sc: 10 },

  // Nitrous - Universal
  nitrous: { na: 100, turbo: 100, sc: 100 },
};

// =============================================================================
// OVERLAP MODIFIERS
// =============================================================================

/**
 * When a mod is "expected" by the active tune, reduce its standalone gain.
 * e.g., Stage 2 tune is calibrated assuming downpipe is installed,
 * so downpipe only gives 50% of its normal gain when combined.
 */
export const TUNE_OVERLAP_MODIFIER = 0.5;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the highest priority tune from a list of tune keys
 * @param {string[]} tuneKeys - Array of tune keys
 * @returns {string|null} - Highest priority tune key
 */
export function getHighestPriorityTune(tuneKeys) {
  if (!tuneKeys || tuneKeys.length === 0) return null;

  let highestKey = null;
  let highestPriority = -1;

  for (const key of tuneKeys) {
    const tuneInfo = TUNE_HIERARCHY[key];
    if (tuneInfo && tuneInfo.priority > highestPriority) {
      highestPriority = tuneInfo.priority;
      highestKey = key;
    }
  }

  return highestKey;
}

/**
 * Check if a mod is expected by the given tune.
 * Now engine-type aware - uses getExpectedModsForTune when engineCategory is provided.
 *
 * @param {string} modKey - Mod key to check
 * @param {string} tuneKey - Active tune key
 * @param {string} [engineCategory] - Optional engine category ('na', 'turbo', 'sc')
 * @returns {boolean} - True if tune expects this mod
 */
export function isModExpectedByTune(modKey, tuneKey, engineCategory = null) {
  if (!tuneKey || !modKey) return false;

  // If engine category is provided, use engine-specific logic
  if (engineCategory) {
    const expectedMods = getExpectedModsForTune(tuneKey, engineCategory);
    return expectedMods.includes(modKey);
  }

  // Fallback: check if mod is in any of the expected mods for this tune
  const includedMods = STAGE_TUNE_INCLUDED_MODS[tuneKey];
  return includedMods?.includes(modKey) || false;
}

/**
 * Get engine category from engine type string
 * @param {string} engineType - Engine type (e.g., 'Turbo I4', 'NA V8')
 * @returns {'na'|'turbo'|'sc'} - Engine category
 */
export function getEngineCategory(engineType) {
  if (!engineType) return 'na';
  const lower = engineType.toLowerCase();
  if (lower.includes('turbo')) return 'turbo';
  if (lower.includes('supercharg') || lower.includes('sc')) return 'sc';
  return 'na';
}

/**
 * Detect detailed aspiration type from car's engine string.
 * More sophisticated than getEngineCategory - returns specific type.
 *
 * @param {Object} car - Car object with engine field
 * @returns {'NA'|'Turbo'|'TwinTurbo'|'Supercharged'|'TwinSC'} - Aspiration type
 */
export function detectAspiration(car) {
  const engine = (car?.engine || '').toLowerCase();

  // Twin turbo detection (check first as it contains 'turbo')
  if (
    engine.includes('twin turbo') ||
    engine.includes('biturbo') ||
    engine.includes('twin-turbo') ||
    engine.includes(' tt ') ||
    engine.match(/\btt\b/)
  ) {
    return 'TwinTurbo';
  }

  // Single turbo
  if (engine.includes('turbo')) return 'Turbo';

  // Twin supercharger (rare)
  if (engine.includes('twin supercharger') || engine.includes('twin sc')) {
    return 'TwinSC';
  }

  // Supercharged
  if (
    engine.includes('supercharged') ||
    engine.includes('supercharger') ||
    engine.match(/\bsc\b/)
  ) {
    return 'Supercharged';
  }

  return 'NA';
}

/**
 * Get percentage-based HP gain for an upgrade based on car's stock HP.
 * Uses physics model from V2 calculator.
 *
 * Stage tunes are now UNIVERSAL - all engine types can be tuned.
 * NA gains are smaller (timing/fuel/throttle optimization).
 * Turbo/SC gains are larger (boost increases).
 *
 * @param {string} upgradeKey - The upgrade key
 * @param {string} aspiration - Aspiration type from detectAspiration()
 * @returns {number} - Percentage of stock HP as gain (e.g., 0.18 = 18%)
 */
export function getPhysicsBasedGainPercent(upgradeKey, aspiration) {
  const key = upgradeKey || '';
  const isTurbo = aspiration === 'Turbo' || aspiration === 'TwinTurbo';
  const isSC = aspiration === 'Supercharged' || aspiration === 'TwinSC';
  const isNA = !isTurbo && !isSC;

  // ==========================================================================
  // STAGE TUNES - Universal across all engine types
  // NA: Modest gains from timing/fuel/throttle optimization
  // Turbo: Large gains from boost increases
  // SC: Moderate gains (pulley determines boost, tune optimizes)
  // ==========================================================================
  if (key === 'stage3-tune' || key.includes('stage3-tune')) {
    if (isTurbo) return 0.45; // 45% HP gain
    if (isSC) return 0.25; // 25% HP gain
    return 0.12; // NA: 12% HP gain (with supporting mods)
  }
  if (key === 'stage2-tune' || key.includes('stage2-tune')) {
    if (isTurbo) return 0.28; // 28% HP gain
    if (isSC) return 0.15; // 15% HP gain
    return 0.08; // NA: 8% HP gain
  }
  if (key === 'stage1-tune' || key.includes('stage1-tune')) {
    if (isTurbo) return 0.15; // 15% HP gain
    if (isSC) return 0.1; // 10% HP gain
    return 0.05; // NA: 5% HP gain
  }
  if (key.includes('piggyback')) {
    if (isTurbo) return 0.1;
    if (isSC) return 0.07;
    return 0.03; // NA: minor gains
  }

  // ==========================================================================
  // EXHAUST - Gains vary by aspiration
  // ==========================================================================
  if (key === 'exhaust-axleback' || key.includes('axleback')) {
    return 0.01; // ~1% (mostly sound, minimal power)
  }
  if (key === 'exhaust-catback' || key.includes('catback')) {
    return isTurbo ? 0.025 : 0.03; // 2.5-3%
  }
  if (key === 'headers' || key.includes('header')) {
    return isTurbo ? 0.03 : 0.06; // NA benefits more from headers
  }
  if (key === 'downpipe' || key.includes('downpipe')) {
    return isTurbo ? 0.05 : 0; // Turbo-only
  }

  // ==========================================================================
  // INTAKE
  // ==========================================================================
  if (key === 'intake' || key.includes('intake')) {
    return isTurbo ? 0.03 : 0.03;
  }

  // ==========================================================================
  // FORCED INDUCTION - Adding to NA cars (Stage 3)
  // ==========================================================================
  if (key === 'supercharger-roots' || key.includes('supercharger-roots')) {
    return isNA ? 0.55 : 0; // Only for NA cars
  }
  if (key === 'supercharger-centrifugal' || key.includes('supercharger-centrifugal')) {
    return isNA ? 0.4 : 0;
  }
  if (key === 'turbo-kit-twin' || key.includes('turbo-kit-twin')) {
    return isNA ? 0.65 : 0;
  }
  if (key === 'turbo-kit-single' || key.includes('turbo-kit-single')) {
    return isNA ? 0.5 : 0;
  }
  if (key === 'turbo-upgrade-existing' || key.includes('turbo-upgrade')) {
    return isTurbo ? 0.25 : 0; // Turbo-only
  }

  // ==========================================================================
  // BOOST CONTROL - Stage 2 mods
  // ==========================================================================
  if (key === 'boost-controller' || key.includes('boost-controller')) {
    return isTurbo ? 0.08 : 0; // Turbo-only
  }
  if (key === 'pulley-tune-sc' || key.includes('pulley')) {
    return isSC ? 0.15 : 0; // SC-only
  }

  // ==========================================================================
  // COOLING - Supporting mods
  // ==========================================================================
  if (key === 'intercooler' || key.includes('intercooler')) {
    if (isTurbo) return 0.04;
    if (isSC) return 0.03;
    return 0; // NA doesn't benefit
  }
  if (key.includes('heat-exchanger')) {
    return isSC ? 0.03 : 0;
  }

  // ==========================================================================
  // CAMSHAFTS - Universal but gains vary
  // ==========================================================================
  if (key === 'camshaft-aggressive' || key.includes('camshaft-aggressive')) {
    return isNA ? 0.12 : 0.08; // NA benefits more
  }
  if (key === 'camshaft-mild' || key.includes('camshaft-mild')) {
    return isNA ? 0.07 : 0.05;
  }
  // Generic cam match for legacy keys
  if (key.includes('cam') && !key.includes('camshaft')) {
    return 0.08;
  }

  // ==========================================================================
  // NITROUS - Universal
  // ==========================================================================
  if (key === 'nitrous' || key.includes('nitrous')) {
    return 0.2; // ~20% HP gain (typical 75-150 shot)
  }

  // ==========================================================================
  // FUEL - E85 gains vary by aspiration
  // ==========================================================================
  if (key === 'flex-fuel-e85' || key.includes('e85') || key.includes('flex')) {
    if (isTurbo) return 0.15;
    if (isSC) return 0.12;
    return 0.08; // NA: E85 still helps via timing
  }
  if (key.includes('methanol')) {
    return isTurbo ? 0.08 : 0.03;
  }

  // ==========================================================================
  // INTERNAL ENGINE MODS (Legacy support)
  // ==========================================================================
  if (key.includes('ported-head')) return 0.1;
  if (key.includes('stroker')) return 0.18;

  // ==========================================================================
  // NON-POWER MODS - No HP gain
  // ==========================================================================
  if (
    key.includes('brake') ||
    key.includes('suspension') ||
    key.includes('coilover') ||
    key.includes('wheel') ||
    key.includes('tire') ||
    key.includes('aero') ||
    key.includes('splitter') ||
    key.includes('wing') ||
    key.includes('clutch') ||
    key.includes('driveshaft') ||
    key.includes('oil-cooler') ||
    key.includes('radiator') ||
    key.includes('trans-cooler')
  ) {
    return 0;
  }

  return 0;
}

/**
 * Get mod gain for engine type
 * @param {string} modKey - Mod key
 * @param {string} engineType - Engine type
 * @returns {number} - HP gain for this mod
 */
export function getModGain(modKey, engineType) {
  const gains = MOD_HP_GAINS[modKey];
  if (!gains) return 0;

  const category = getEngineCategory(engineType);
  if (category === 'turbo') return gains.turbo || 0;
  if (category === 'sc') return gains.sc || gains.turbo || 0;
  return gains.na || 0;
}
