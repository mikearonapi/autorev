/**
 * AutoRev - Unified Performance Calculator V2
 * 
 * Hybrid physics + data calibration system with tiered confidence levels.
 * 
 * MIGRATION SAFETY:
 * - This file is NEW and does not modify any existing code
 * - Existing calculators remain untouched
 * - Feature flag controls which calculator is used
 * - Output shape matches existing calculators for drop-in replacement
 * 
 * ARCHITECTURE:
 * Tier 1: Verified dyno data (confidence: 90-99%)
 * Tier 2: Engine family calibration (confidence: 70-85%)
 * Tier 3: Physics model (confidence: 55-70%)
 * Tier 4: Generic fallback (confidence: 40-50%)
 */

import { createClient } from '@supabase/supabase-js';

// Create a lightweight client for server-side use
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Lazy init to avoid issues during build
let _supabase = null;
function getSupabase() {
  if (!_supabase && supabaseUrl && supabaseAnonKey) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Confidence tiers for predictions
 */
export const CONFIDENCE_TIERS = {
  VERIFIED: { tier: 1, min: 0.90, max: 0.99, label: 'Verified' },
  CALIBRATED: { tier: 2, min: 0.70, max: 0.85, label: 'Calibrated' },
  PHYSICS: { tier: 3, min: 0.55, max: 0.70, label: 'Estimated' },
  GENERIC: { tier: 4, min: 0.40, max: 0.50, label: 'Approximate' },
};

/**
 * Physics model constants
 * Based on real-world engine efficiency data
 */
const PHYSICS_CONSTANTS = {
  // Drivetrain losses
  DRIVETRAIN_EFFICIENCY: {
    FWD: 0.88,
    RWD: 0.85,
    AWD: 0.80,
  },
  
  // Aspiration-based boost headroom
  BOOST_MULTIPLIERS: {
    NA: 1.0,
    Turbo: 1.3,      // Turbo responds well to mods
    TwinTurbo: 1.25, // Already optimized, less headroom
    Supercharged: 1.15,
    TwinSC: 1.1,
  },
  
  // Category stacking diminishing returns (same as upgradeCalculator.js for compatibility)
  DIMINISHING_RETURNS: {
    exhaust: 0.85,   // Second exhaust mod gives 85% of stated gain
    intake: 0.80,
    tune: 0.0,       // Only one tune counts
  },
  
  // Maximum realistic gains by category (percent of stock HP)
  CATEGORY_CAPS: {
    NA: {
      exhaust: 0.10,      // 10% max from exhaust on NA
      intake: 0.05,       // 5% max from intake on NA
      tune: 0.08,         // 8% max from tune on NA
      bolt_ons_total: 0.15, // 15% max from all bolt-ons combined
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
      tune: 0.15,          // Pulley + tune
      bolt_ons_total: 0.25,
    },
  },
};

// ============================================================================
// CACHING
// ============================================================================

// In-memory cache for engine families and calibrations (avoids repeated DB calls)
let _engineFamiliesCache = null;
let _calibrationCache = null;
let _cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getEngineFamiliesMap() {
  const now = Date.now();
  if (_engineFamiliesCache && (now - _cacheTimestamp) < CACHE_TTL_MS) {
    return _engineFamiliesCache;
  }
  
  const supabase = getSupabase();
  if (!supabase) return new Map();
  
  const { data, error } = await supabase
    .from('engine_families')
    .select('*');
  
  if (error || !data) {
    console.warn('[PerformanceCalcV2] Failed to load engine families:', error?.message);
    return new Map();
  }
  
  _engineFamiliesCache = new Map(data.map(ef => [ef.id, ef]));
  _cacheTimestamp = now;
  return _engineFamiliesCache;
}

async function getCalibrationMap() {
  const now = Date.now();
  if (_calibrationCache && (now - _cacheTimestamp) < CACHE_TTL_MS) {
    return _calibrationCache;
  }
  
  const supabase = getSupabase();
  if (!supabase) return new Map();
  
  const { data, error } = await supabase
    .from('performance_calibration')
    .select('*');
  
  if (error || !data) {
    console.warn('[PerformanceCalcV2] Failed to load calibrations:', error?.message);
    return new Map();
  }
  
  // Map by engine_family_id + upgrade_category
  _calibrationCache = new Map();
  data.forEach(cal => {
    const key = `${cal.engine_family_id}:${cal.upgrade_category}`;
    _calibrationCache.set(key, cal);
  });
  _cacheTimestamp = now;
  return _calibrationCache;
}

// ============================================================================
// TIER 1: VERIFIED DYNO DATA
// ============================================================================

/**
 * Check for verified dyno results for this exact car + mod combination
 */
async function checkVerifiedDynoData(car, modCombination) {
  const supabase = getSupabase();
  if (!supabase || !car?.id) return null;
  
  // Sort mod combination for consistent hashing
  const sortedMods = [...modCombination].sort();
  
  const { data, error } = await supabase
    .from('verified_mod_results')
    .select('*')
    .eq('car_id', car.id)
    .eq('verified', true)
    .gte('confidence', 0.8)
    .limit(1);
  
  if (error || !data || data.length === 0) return null;
  
  // Check if mod combination matches
  const result = data.find(r => {
    const resultMods = [...(r.mod_combination || [])].sort();
    return JSON.stringify(resultMods) === JSON.stringify(sortedMods);
  });
  
  if (!result) return null;
  
  return {
    actualGain: result.actual_gain,
    stockWhp: result.stock_whp,
    moddedWhp: result.modded_whp,
    confidence: Math.min(0.99, result.confidence + 0.1), // Boost confidence for exact match
    sourceUrl: result.source_url,
    dynoType: result.dyno_type,
    fuelType: result.fuel_type,
    tier: 1,
  };
}

// ============================================================================
// TIER 2: ENGINE FAMILY CALIBRATION
// ============================================================================

/**
 * Get calibration for engine family + upgrade category
 */
async function getEngineFamilyCalibration(engineFamilyId, upgradeCategory) {
  if (!engineFamilyId) return null;
  
  const calibrations = await getCalibrationMap();
  const key = `${engineFamilyId}:${upgradeCategory}`;
  
  return calibrations.get(key) || null;
}

/**
 * Map upgrade keys to calibration categories
 */
function getCalibrationCategory(upgradeKey) {
  // Stage tunes
  if (upgradeKey.includes('stage1')) return 'tune_stage1';
  if (upgradeKey.includes('stage2')) return 'tune_stage2';
  if (upgradeKey.includes('stage3')) return 'tune_stage3';
  if (upgradeKey.includes('tune')) return 'tune_stage1';
  
  // Intake/exhaust
  if (upgradeKey.includes('intake')) return 'intake';
  if (upgradeKey.includes('downpipe')) return 'downpipe';
  if (upgradeKey.includes('exhaust') || upgradeKey.includes('catback')) return 'exhaust_catback';
  if (upgradeKey.includes('header')) return 'headers_na';
  
  // Forced induction
  if (upgradeKey.includes('supercharger')) return 'supercharger';
  if (upgradeKey.includes('turbo-kit')) return 'turbo_kit';
  if (upgradeKey.includes('turbo-upgrade')) return 'turbo_upgrade';
  if (upgradeKey.includes('intercooler')) return 'intercooler';
  if (upgradeKey.includes('pulley')) return 'tune'; // Pulley + tune for SC cars
  
  // Fuel
  if (upgradeKey.includes('e85') || upgradeKey.includes('flex')) return 'e85_conversion';
  
  // NA engine mods
  if (upgradeKey.includes('cam')) return 'cams_na';
  
  return 'other';
}

// ============================================================================
// TIER 3: PHYSICS MODEL
// ============================================================================

/**
 * Calculate HP gain using physics-based model
 */
function calculatePhysicsBasedGain(car, upgrade, currentHp, engineFamily) {
  const stockHp = car.hp || 400;
  const aspiration = engineFamily?.aspiration || detectAspiration(car);
  
  // Get base gain percent from upgrade definition
  const baseGainPercent = getBaseGainPercent(upgrade, aspiration);
  if (baseGainPercent === 0) return { hp: 0, confidence: 0.5 };
  
  // Apply aspiration multiplier
  const aspirationMult = PHYSICS_CONSTANTS.BOOST_MULTIPLIERS[aspiration] || 1.0;
  
  // Apply volumetric efficiency scaling (better-engineered engines respond better)
  const veMult = engineFamily?.volumetric_efficiency_stock || 0.85;
  const veScaling = 0.8 + (veMult * 0.25); // 0.8-1.05 range
  
  // Calculate gain
  const gainPercent = baseGainPercent * aspirationMult * veScaling;
  const hpGain = Math.round(currentHp * gainPercent);
  
  // Confidence based on how much data we have
  const confidence = engineFamily ? 0.65 : 0.55;
  
  return {
    hp: hpGain,
    confidence,
    formula: `${currentHp} × ${(gainPercent * 100).toFixed(1)}% = ${hpGain} HP`,
    tier: 3,
  };
}

/**
 * Get base gain percentage for an upgrade type
 */
function getBaseGainPercent(upgrade, aspiration) {
  const key = upgrade.key || '';
  const isTurbo = aspiration === 'Turbo' || aspiration === 'TwinTurbo';
  const isSC = aspiration === 'Supercharged' || aspiration === 'TwinSC';
  
  // Stage tunes
  if (key.includes('stage3')) return isTurbo ? 0.55 : 0.08;
  if (key.includes('stage2')) return isTurbo ? 0.35 : 0.06;
  if (key.includes('stage1')) return isTurbo ? 0.18 : 0.05;
  if (key.includes('tune-track')) return isTurbo ? 0.10 : 0.04;
  if (key.includes('tune-street')) return isTurbo ? 0.08 : 0.03;
  if (key.includes('piggyback')) return isTurbo ? 0.12 : 0.02;
  
  // Intake/exhaust
  if (key.includes('intake')) return isTurbo ? 0.02 : 0.02;
  if (key.includes('downpipe')) return isTurbo ? 0.05 : 0;
  if (key.includes('catback') || key.includes('exhaust')) return isTurbo ? 0.01 : 0.03;
  if (key.includes('header')) return isTurbo ? 0.02 : 0.05;
  
  // Forced induction additions
  if (key.includes('supercharger-roots')) return 0.50;
  if (key.includes('supercharger-centrifugal')) return 0.40;
  if (key.includes('turbo-kit-twin')) return 0.65;
  if (key.includes('turbo-kit-single')) return 0.50;
  if (key.includes('turbo-upgrade')) return isTurbo ? 0.25 : 0;
  
  // SC upgrades
  if (key.includes('pulley') && isSC) return 0.12;
  if (key.includes('heat-exchanger')) return 0.03;
  if (key.includes('intercooler')) return isTurbo ? 0.03 : 0.02;
  
  // NA engine mods
  if (key.includes('cam')) return 0.08;
  if (key.includes('ported-head')) return 0.10;
  if (key.includes('stroker')) return 0.18;
  
  // Fuel
  if (key.includes('e85') || key.includes('flex')) return isTurbo ? 0.12 : 0.05;
  if (key.includes('methanol')) return isTurbo ? 0.08 : 0.03;
  
  return 0;
}

/**
 * Detect aspiration from car data
 */
function detectAspiration(car) {
  const engine = (car.engine || '').toLowerCase();
  
  if (engine.includes('twin turbo') || engine.includes('biturbo') || engine.includes('tt')) {
    return 'TwinTurbo';
  }
  if (engine.includes('turbo')) return 'Turbo';
  if (engine.includes('supercharged') || engine.includes(' sc')) return 'Supercharged';
  
  return 'NA';
}

// ============================================================================
// TIER 4: GENERIC FALLBACK
// ============================================================================

/**
 * Fall back to upgrade's stated metricChanges (current behavior)
 */
function getGenericGain(upgrade, car) {
  const baseGain = upgrade.metricChanges?.hpGain || 0;
  
  // Apply simple aspiration multiplier (matches current getHpGainMultiplier logic)
  const aspiration = detectAspiration(car);
  let multiplier = 1.0;
  
  if (aspiration === 'Turbo' || aspiration === 'TwinTurbo') {
    multiplier = 1.3;
  } else if (aspiration === 'Supercharged') {
    multiplier = 1.1;
  }
  
  return {
    hp: Math.round(baseGain * multiplier),
    confidence: 0.45,
    source: 'Industry average estimate',
    tier: 4,
  };
}

// ============================================================================
// MAIN CALCULATION FUNCTION
// ============================================================================

/**
 * @typedef {Object} UpgradeGainResult
 * @property {number} hp - HP gain from this upgrade
 * @property {number} confidence - 0-1 confidence score
 * @property {string} source - Human-readable source description
 * @property {number} tier - 1-4 tier level
 * @property {string} [formula] - Optional calculation formula
 */

/**
 * @typedef {Object} BuildPerformanceResult
 * @property {number} stockHp - Car's stock HP
 * @property {number} projectedHp - Total HP after upgrades
 * @property {number} totalGain - Net HP gain
 * @property {number} confidence - Overall confidence (lowest of all upgrades)
 * @property {string} confidenceLabel - Human-readable confidence label
 * @property {number} tier - Overall tier (highest/worst of all upgrades)
 * @property {Object[]} breakdown - Per-upgrade breakdown
 * @property {Object} conflicts - Detected conflicts (for compatibility)
 * @property {number} rawGain - Unadjusted sum (for compatibility)
 * @property {number} adjustmentAmount - Reduction for diminishing returns (for compatibility)
 */

/**
 * Calculate build performance using tiered approach
 * 
 * @param {Object} car - Car object with hp, engine, etc.
 * @param {string[]} selectedUpgradeKeys - Array of upgrade keys
 * @param {Object} [options] - Options
 * @param {Function} [options.getUpgradeByKey] - Function to get upgrade object by key
 * @returns {Promise<BuildPerformanceResult>}
 */
export async function calculateBuildPerformance(car, selectedUpgradeKeys, options = {}) {
  const { getUpgradeByKey } = options;
  
  // Initialize result
  const result = {
    stockHp: car?.hp || 0,
    projectedHp: car?.hp || 0,
    totalGain: 0,
    rawGain: 0,
    adjustmentAmount: 0,
    confidence: 1.0,
    confidenceLabel: 'Verified',
    tier: 1,
    breakdown: [],
    conflicts: [],
    categoryGains: {},
  };
  
  if (!car || !selectedUpgradeKeys || selectedUpgradeKeys.length === 0) {
    return result;
  }
  
  // Load engine family for this car
  let engineFamily = null;
  if (car.engine_family_id) {
    const families = await getEngineFamiliesMap();
    engineFamily = families.get(car.engine_family_id);
  }
  
  // Track category gains for diminishing returns
  const categoryGains = {
    exhaust: 0,
    intake: 0,
    tune: 0,
    forcedInduction: 0,
  };
  
  // Track tune hierarchy (only highest applies)
  const tunes = selectedUpgradeKeys.filter(k => 
    k.includes('tune') || k.includes('stage') || k.includes('piggyback')
  );
  const activeTune = getHighestPriorityTune(tunes);
  
  // Process each upgrade
  let currentHp = car.hp || 400;
  
  for (const upgradeKey of selectedUpgradeKeys) {
    // Get upgrade object
    const upgrade = getUpgradeByKey ? getUpgradeByKey(upgradeKey) : { key: upgradeKey };
    if (!upgrade) continue;
    
    // Skip redundant tunes
    if (isTuneUpgrade(upgradeKey) && upgradeKey !== activeTune) {
      result.breakdown.push({
        key: upgradeKey,
        name: upgrade.name || upgradeKey,
        hp: 0,
        confidence: 0,
        source: `Superseded by ${activeTune}`,
        tier: 4,
        skipped: true,
      });
      continue;
    }
    
    // Calculate gain using tiered approach
    const gain = await calculateUpgradeGain(
      car, 
      upgrade, 
      currentHp, 
      engineFamily,
      selectedUpgradeKeys,
      categoryGains
    );
    
    // Track raw gain for compatibility
    const rawGain = upgrade.metricChanges?.hpGain || gain.hp;
    result.rawGain += rawGain;
    
    // Apply diminishing returns for same-category upgrades
    let appliedGain = gain.hp;
    const category = getUpgradeCategory(upgradeKey);
    
    if (categoryGains[category] > 0 && PHYSICS_CONSTANTS.DIMINISHING_RETURNS[category]) {
      const diminishedGain = Math.round(gain.hp * PHYSICS_CONSTANTS.DIMINISHING_RETURNS[category]);
      result.adjustmentAmount += (gain.hp - diminishedGain);
      appliedGain = diminishedGain;
    }
    
    // Update running totals
    currentHp += appliedGain;
    categoryGains[category] = (categoryGains[category] || 0) + appliedGain;
    
    // Track lowest confidence
    if (gain.confidence < result.confidence) {
      result.confidence = gain.confidence;
      result.tier = gain.tier;
    }
    
    result.breakdown.push({
      key: upgradeKey,
      name: upgrade.name || upgradeKey,
      hp: appliedGain,
      rawHp: gain.hp,
      confidence: gain.confidence,
      source: gain.source,
      tier: gain.tier,
      formula: gain.formula,
    });
  }
  
  // Final calculations
  result.projectedHp = currentHp;
  result.totalGain = currentHp - (car.hp || 0);
  result.categoryGains = categoryGains;
  result.confidenceLabel = getConfidenceLabel(result.confidence);
  
  return result;
}

/**
 * Calculate gain for a single upgrade using tiered approach
 */
async function calculateUpgradeGain(car, upgrade, currentHp, engineFamily, allUpgrades, categoryGains) {
  const upgradeKey = upgrade.key || '';
  
  // Tier 1: Check for verified dyno data
  try {
    const verified = await checkVerifiedDynoData(car, allUpgrades);
    if (verified) {
      // We have verified data for this exact combo
      // Attribute proportionally based on this upgrade's expected contribution
      const expectedContribution = getExpectedContribution(upgrade, allUpgrades);
      const attributedGain = Math.round(verified.actualGain * expectedContribution);
      
      return {
        hp: attributedGain,
        confidence: verified.confidence,
        source: `Verified dyno: ${verified.sourceUrl || 'documented result'}`,
        tier: 1,
      };
    }
  } catch (e) {
    // Tier 1 failed, continue to Tier 2
  }
  
  // Tier 2: Check engine family calibration
  const calibrationCategory = getCalibrationCategory(upgradeKey);
  const calibration = engineFamily?.id 
    ? await getEngineFamilyCalibration(engineFamily.id, calibrationCategory)
    : null;
  
  if (calibration && calibration.sample_size >= 3) {
    const baseGainPercent = calibration.base_gain_percent;
    const correctedGain = baseGainPercent * calibration.correction_factor;
    const hpGain = Math.round(currentHp * correctedGain);
    
    // Confidence scales with sample size
    const confidence = Math.min(0.85, 0.65 + (calibration.sample_size * 0.02));
    
    return {
      hp: hpGain,
      confidence,
      source: `Based on ${calibration.sample_size} verified ${engineFamily.display_name} builds`,
      tier: 2,
      formula: `${currentHp} × ${(correctedGain * 100).toFixed(1)}% = ${hpGain} HP`,
    };
  }
  
  // Tier 3: Physics model
  const physicsResult = calculatePhysicsBasedGain(car, upgrade, currentHp, engineFamily);
  if (physicsResult.hp > 0) {
    return {
      ...physicsResult,
      source: engineFamily 
        ? `Estimated for ${engineFamily.display_name}`
        : 'Estimated from engine characteristics',
    };
  }
  
  // Tier 4: Generic fallback
  return getGenericGain(upgrade, car);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isTuneUpgrade(key) {
  return key.includes('tune') || key.includes('stage') || key.includes('piggyback');
}

function getHighestPriorityTune(tunes) {
  const TUNE_PRIORITY = {
    'stage3-tune': 5,
    'stage2-tune': 4,
    'tune-track': 3,
    'stage1-tune': 2,
    'tune-street': 1,
    'piggyback-tuner': 1.5,
  };
  
  return tunes.reduce((highest, current) => {
    const currentPriority = TUNE_PRIORITY[current] || 0;
    const highestPriority = TUNE_PRIORITY[highest] || 0;
    return currentPriority > highestPriority ? current : highest;
  }, tunes[0]);
}

function getUpgradeCategory(key) {
  if (key.includes('exhaust') || key.includes('catback') || key.includes('header') || key.includes('downpipe')) {
    return 'exhaust';
  }
  if (key.includes('intake')) return 'intake';
  if (key.includes('tune') || key.includes('stage') || key.includes('piggyback')) return 'tune';
  if (key.includes('turbo') || key.includes('supercharger')) return 'forcedInduction';
  return 'other';
}

function getExpectedContribution(upgrade, allUpgrades) {
  // Simple equal distribution for now
  // TODO: Weight by typical gain ratios
  return 1 / allUpgrades.length;
}

function getConfidenceLabel(confidence) {
  if (confidence >= 0.90) return 'Verified';
  if (confidence >= 0.70) return 'High confidence';
  if (confidence >= 0.55) return 'Estimated';
  return 'Approximate';
}

// ============================================================================
// COMPATIBILITY LAYER
// ============================================================================

/**
 * Drop-in replacement for calculateSmartHpGain from upgradeCalculator.js
 * Returns same shape for backward compatibility
 */
export async function calculateSmartHpGainV2(car, selectedKeys, options = {}) {
  const result = await calculateBuildPerformance(car, selectedKeys, options);
  
  // Match exact shape of original calculateSmartHpGain
  return {
    stockHp: result.stockHp,
    totalGain: result.totalGain,
    projectedHp: result.projectedHp,
    rawGain: result.rawGain,
    adjustmentAmount: result.adjustmentAmount,
    conflicts: result.conflicts,
    breakdown: Object.fromEntries(
      result.breakdown.map(b => [b.key, {
        name: b.name,
        rawGain: b.rawHp || b.hp,
        appliedGain: b.hp,
        adjustmentReason: b.source,
      }])
    ),
    categoryGains: result.categoryGains,
    // V2 additions
    confidence: result.confidence,
    confidenceLabel: result.confidenceLabel,
    tier: result.tier,
  };
}

/**
 * Drop-in replacement for calculateUpgradedMetrics from performance.js
 * Returns same shape for backward compatibility
 */
export async function calculateUpgradedMetricsV2(car, selectedUpgrades, options = {}) {
  const upgradeKeys = selectedUpgrades.map(u => u.key || u);
  const hpResult = await calculateBuildPerformance(car, upgradeKeys, options);
  
  // Calculate 0-60 improvement from HP gain
  let zeroToSixtyReduction = 0;
  if (hpResult.totalGain > 0 && car.zeroToSixty) {
    const hpPercentGain = hpResult.totalGain / (car.hp || 400);
    zeroToSixtyReduction = car.zeroToSixty * hpPercentGain * 0.4;
  }
  
  // Sum handling improvements from upgrades
  let brakingImprovement = 0;
  let lateralGImprovement = 0;
  
  for (const upgrade of selectedUpgrades) {
    if (upgrade.metricChanges) {
      brakingImprovement += upgrade.metricChanges.brakingImprovement || 0;
      lateralGImprovement += upgrade.metricChanges.lateralGImprovement || 0;
    }
  }
  
  // Match exact shape of original calculateUpgradedMetrics
  return {
    hp: hpResult.projectedHp,
    zeroToSixty: car.zeroToSixty ? Math.max(2.0, car.zeroToSixty - zeroToSixtyReduction) : null,
    braking60To0: car.braking60To0 ? Math.max(70, car.braking60To0 - brakingImprovement) : null,
    lateralG: car.lateralG ? Math.min(1.6, car.lateralG + lateralGImprovement) : null,
    torque: car.torque,
    curbWeight: car.curbWeight,
    quarterMile: car.quarterMile,
    powerToWeight: car.curbWeight && hpResult.projectedHp 
      ? (hpResult.projectedHp / (car.curbWeight / 1000)).toFixed(1)
      : null,
    engineType: detectAspiration(car),
    // V2 additions
    confidence: hpResult.confidence,
    confidenceLabel: hpResult.confidenceLabel,
    breakdown: hpResult.breakdown,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  calculateBuildPerformance,
  calculateSmartHpGainV2,
  calculateUpgradedMetricsV2,
  CONFIDENCE_TIERS,
};
