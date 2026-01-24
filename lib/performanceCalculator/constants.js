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
 * Stage 2 tune gains are calibrated assuming downpipe + intake are installed.
 * Stage 3 tune gains are calibrated assuming turbo upgrade, intercooler, etc.
 * 
 * When both a stage tune AND these mods are selected, the mod gains are reduced
 * because the tune's calibration already assumes they're installed.
 */
export const STAGE_TUNE_INCLUDED_MODS = {
  'stage2-tune': ['downpipe', 'intake'],
  'stage3-tune': ['downpipe', 'intake', 'turbo-upgrade-existing', 'intercooler'],
};

/**
 * Tune categories - these REPLACE each other, don't stack.
 * Stage 2 includes Stage 1 gains, Stage 3 includes Stage 2.
 */
export const TUNE_HIERARCHY = {
  // Priority order: higher number = more comprehensive
  'stage3-tune': { priority: 5, includes: ['stage2-tune', 'stage1-tune', 'tune-track', 'tune-street'] },
  'stage2-tune': { priority: 4, includes: ['stage1-tune', 'tune-track'] },
  'tune-track': { priority: 3, includes: ['tune-street'] },
  'stage1-tune': { priority: 2, includes: [] },
  'tune-street': { priority: 1, includes: [] },
  'piggyback-tuner': { priority: 1.5, includes: [] }, // Separate path, can conflict with flash tunes
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
    exhaust: 0.10,         // 10% max from exhaust on NA
    intake: 0.05,          // 5% max from intake on NA
    tune: 0.08,            // 8% max from tune on NA
    bolt_ons_total: 0.15,  // 15% max from all bolt-ons combined
    forced_induction: 0.60, // 60% from adding FI
  },
  Turbo: {
    exhaust: 0.08,
    intake: 0.05,
    tune_stage1: 0.25,
    tune_stage2: 0.45,
    tune_stage3: 0.70,
    bolt_ons_total: 0.55,
    turbo_upgrade: 0.35,
  },
  Supercharged: {
    exhaust: 0.06,
    intake: 0.04,
    tune: 0.15,            // Pulley + tune
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
  exhaust: 0.85,   // Second exhaust mod gives 85% of stated gain
  intake: 0.80,
  tune: 0.0,       // Only one tune counts
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
  VERIFIED: { tier: 1, min: 0.90, max: 0.99, label: 'Verified' },
  CALIBRATED: { tier: 2, min: 0.70, max: 0.85, label: 'Calibrated' },
  PHYSICS: { tier: 3, min: 0.55, max: 0.70, label: 'Estimated' },
  GENERIC: { tier: 4, min: 0.40, max: 0.50, label: 'Approximate' },
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
    AWD: 0.80,
  },
  
  // Aspiration-based boost headroom
  BOOST_MULTIPLIERS: {
    NA: 1.0,
    Turbo: 1.3,       // Turbo responds well to mods
    TwinTurbo: 1.25,  // Already optimized, less headroom
    Supercharged: 1.15,
    TwinSC: 1.1,
  },
  
  // Category stacking diminishing returns
  DIMINISHING_RETURNS: {
    exhaust: 0.85,
    intake: 0.80,
    tune: 0.0,        // Only one tune counts
  },
};

// =============================================================================
// MOD HP GAINS (Lookup Table)
// =============================================================================

/**
 * Base HP gains by mod type for multiplier-based calculations.
 * Values are {na: X, turbo: Y} for naturally aspirated vs turbo engines.
 */
export const MOD_HP_GAINS = {
  // Exhaust
  'exhaust-catback': { na: 10, turbo: 10 },
  'headers': { na: 20, turbo: 15 },
  'downpipe': { na: 0, turbo: 30 },
  
  // Intake
  'intake': { na: 10, turbo: 15 },
  
  // Tunes
  'stage1-tune': { na: 15, turbo: 50 },
  'stage2-tune': { na: 25, turbo: 80 },
  'stage3-tune': { na: 35, turbo: 120 },
  
  // Cooling
  'intercooler': { na: 0, turbo: 20 },
  
  // Forced induction
  'turbo-upgrade-existing': { na: 0, turbo: 120 },
  'turbo-kit-single': { na: 200, turbo: 150 },
  'supercharger-roots': { na: 250, turbo: 0 },
  
  // Fuel
  'flex-fuel-e85': { na: 30, turbo: 80 },
  'fuel-system-upgrade': { na: 0, turbo: 10 },
  'hpfp-upgrade': { na: 0, turbo: 5 },
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
 * Check if a mod is expected by the given tune
 * @param {string} modKey - Mod key to check
 * @param {string} tuneKey - Active tune key
 * @returns {boolean} - True if tune expects this mod
 */
export function isModExpectedByTune(modKey, tuneKey) {
  if (!tuneKey || !modKey) return false;
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
  if (engine.includes('twin turbo') || 
      engine.includes('biturbo') || 
      engine.includes('twin-turbo') ||
      engine.includes(' tt ') ||
      engine.match(/\btt\b/)) {
    return 'TwinTurbo';
  }
  
  // Single turbo
  if (engine.includes('turbo')) return 'Turbo';
  
  // Twin supercharger (rare)
  if (engine.includes('twin supercharger') || engine.includes('twin sc')) {
    return 'TwinSC';
  }
  
  // Supercharged
  if (engine.includes('supercharged') || 
      engine.includes('supercharger') ||
      engine.match(/\bsc\b/)) {
    return 'Supercharged';
  }
  
  return 'NA';
}

/**
 * Get percentage-based HP gain for an upgrade based on car's stock HP.
 * Uses physics model from V2 calculator.
 * 
 * @param {string} upgradeKey - The upgrade key
 * @param {string} aspiration - Aspiration type from detectAspiration()
 * @returns {number} - Percentage of stock HP as gain (e.g., 0.18 = 18%)
 */
export function getPhysicsBasedGainPercent(upgradeKey, aspiration) {
  const key = upgradeKey || '';
  const isTurbo = aspiration === 'Turbo' || aspiration === 'TwinTurbo';
  const isSC = aspiration === 'Supercharged' || aspiration === 'TwinSC';
  
  // Stage tunes - major gains on forced induction
  if (key.includes('stage3-tune') || key === 'stage3-tune') return isTurbo ? 0.55 : 0.08;
  if (key.includes('stage2-tune') || key === 'stage2-tune') return isTurbo ? 0.35 : 0.06;
  if (key.includes('stage1-tune') || key === 'stage1-tune') return isTurbo ? 0.18 : 0.05;
  if (key.includes('tune-track')) return isTurbo ? 0.10 : 0.04;
  if (key.includes('tune-street')) return isTurbo ? 0.08 : 0.03;
  if (key.includes('piggyback')) return isTurbo ? 0.12 : 0.02;
  
  // Intake/exhaust - smaller gains
  if (key.includes('intake')) return isTurbo ? 0.03 : 0.03;
  if (key.includes('downpipe')) return isTurbo ? 0.05 : 0;
  if (key.includes('catback') || key === 'exhaust-catback') return isTurbo ? 0.02 : 0.03;
  if (key.includes('header')) return isTurbo ? 0.02 : 0.05;
  
  // Forced induction additions (adding to NA car)
  if (key.includes('supercharger-roots')) return 0.50;
  if (key.includes('supercharger-centrifugal')) return 0.40;
  if (key.includes('turbo-kit-twin')) return 0.65;
  if (key.includes('turbo-kit-single')) return 0.50;
  if (key.includes('turbo-upgrade')) return isTurbo ? 0.25 : 0;
  
  // SC upgrades
  if (key.includes('pulley') && isSC) return 0.12;
  if (key.includes('heat-exchanger')) return 0.03;
  if (key.includes('intercooler')) return isTurbo ? 0.04 : 0.02;
  
  // NA engine mods
  if (key.includes('cam')) return 0.08;
  if (key.includes('ported-head')) return 0.10;
  if (key.includes('stroker')) return 0.18;
  
  // Fuel
  if (key.includes('e85') || key.includes('flex')) return isTurbo ? 0.12 : 0.05;
  if (key.includes('methanol')) return isTurbo ? 0.08 : 0.03;
  
  // Brakes, suspension, etc. - no HP gain
  if (key.includes('brake') || key.includes('suspension') || key.includes('coilover')) return 0;
  
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
