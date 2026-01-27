/**
 * AutoRev - HP Calculator
 *
 * Consolidated HP/power calculation logic.
 * Combines functionality from:
 * - lib/upgradeCalculator.js (calculateSmartHpGain)
 * - lib/buildPerformanceCalculator.js (calculateBuildPerformance)
 * - lib/upgrades.js (calculateAllModificationGains)
 *
 * @module lib/performanceCalculator/hpCalculator
 */

import {
  getEngineType,
  getHpGainMultiplier,
  getPlatformDownpipeGain,
} from '../../data/upgradePackages.js';
import { getUpgradeByKey } from '../upgrades.js';
import {
  STAGE_TUNE_INCLUDED_MODS,
  TUNE_HIERARCHY,
  CATEGORY_CAPS,
  CATEGORY_CAPS_SIMPLE,
  MOD_HP_GAINS,
  EXHAUST_CROSS_CATEGORY_FACTOR,
  TUNE_OVERLAP_MODIFIER,
  CONFIDENCE_TIERS,
  getHighestPriorityTune,
  isModExpectedByTune,
  getEngineCategory,
  detectAspiration,
  getPhysicsBasedGainPercent,
} from './constants.js';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * @typedef {Object} HpCalculationResult
 * @property {number} stockHp - Car's stock horsepower
 * @property {number} totalGain - Net HP gain after adjustments
 * @property {number} projectedHp - Stock + gain
 * @property {number} rawGain - Unadjusted sum of all mod gains
 * @property {number} adjustmentAmount - How much was reduced for overlap/diminishing returns
 * @property {Object[]} conflicts - Detected conflicts
 * @property {Object} breakdown - Per-upgrade breakdown of applied gains
 * @property {Object} categoryGains - Gains by category
 * @property {number} confidence - Confidence score 0-1 (from CONFIDENCE_TIERS)
 * @property {string} confidenceLabel - Human-readable confidence label
 * @property {number} tier - Confidence tier (1=Verified, 2=Calibrated, 3=Physics, 4=Generic)
 * @property {string} aspiration - Detected aspiration type (NA, Turbo, TwinTurbo, etc.)
 */

/**
 * @typedef {Object} ModificationGains
 * @property {number} hpGain - Total HP gain
 * @property {number} torqueGain - Total torque gain
 * @property {number} zeroToSixtyImprovement - 0-60 improvement in seconds
 * @property {number} brakingImprovement - Braking improvement in feet
 * @property {number} lateralGImprovement - Lateral G improvement
 */

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if an upgrade is an exhaust mod
 * @param {string} key - Upgrade key
 * @returns {boolean}
 */
function isExhaustMod(key) {
  return (
    key === 'headers' || key === 'exhaust-catback' || key === 'downpipe' || key.includes('exhaust')
  );
}

/**
 * Check if an upgrade is an intake mod
 * @param {string} key - Upgrade key
 * @returns {boolean}
 */
function isIntakeMod(key) {
  return key === 'intake';
  // Note: throttle-body and intake-manifold removed from upgrade options
}

/**
 * Check if an upgrade is a forced induction mod
 * @param {string} key - Upgrade key
 * @returns {boolean}
 */
function isForcedInductionMod(key) {
  return key.includes('turbo') || key.includes('supercharger') || key === 'intercooler';
}

// =============================================================================
// MAIN CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate realistic HP gains with diminishing returns and overlap handling.
 * This is the main HP calculation function that should be used by all components.
 *
 * @param {Object} car - Car object with hp, engine, etc.
 * @param {string[]} selectedKeys - Array of upgrade keys
 * @param {Object} options - Additional options
 * @param {boolean} options.includeConflicts - Whether to detect conflicts (default: true)
 * @returns {HpCalculationResult}
 */
export function calculateSmartHpGain(car, selectedKeys, options = {}) {
  const { includeConflicts = true } = options;

  // Detect aspiration for physics-based calculations
  const aspiration = detectAspiration(car);
  // NOTE: boostMultiplier is NOT used anymore - aspiration is already factored into
  // getPhysicsBasedGainPercent() which returns different values for NA vs Turbo

  if (!car || !selectedKeys || selectedKeys.length === 0) {
    return {
      stockHp: car?.hp || 0,
      totalGain: 0,
      projectedHp: car?.hp || 0,
      rawGain: 0,
      adjustmentAmount: 0,
      conflicts: [],
      breakdown: {},
      categoryGains: {},
      // Confidence fields
      confidence: 1.0,
      confidenceLabel: 'Verified',
      tier: 1,
      aspiration,
    };
  }

  const engineType = getEngineType(car);
  const engineCategory = getEngineCategory(engineType);
  const stockHp = car.hp || 0;

  // Detect conflicts if requested
  const conflicts = includeConflicts ? detectUpgradeConflictsInternal(selectedKeys, car) : [];

  // Get all upgrade objects
  const upgrades = selectedKeys
    .map((key) => ({ key, upgrade: getUpgradeByKey(key) }))
    .filter(({ upgrade }) => upgrade);

  // Track gains by category for caps
  const categoryGains = {
    exhaust: 0,
    intake: 0,
    tune: 0,
    forcedInduction: 0,
    other: 0,
  };

  // Track per-upgrade breakdown
  const breakdown = {};
  let rawGain = 0;
  let adjustedGain = 0;

  // Track confidence (start high, reduce if we have to fall back)
  let minConfidence = CONFIDENCE_TIERS.PHYSICS.max; // Start at physics tier
  let maxTier = 3; // Physics model tier

  // 1. Determine which tune applies (only one)
  const selectedTunes = selectedKeys.filter((key) => TUNE_HIERARCHY[key]);
  const activeTune = selectedTunes.length > 0 ? getHighestPriorityTune(selectedTunes) : null;

  // 2. Process each upgrade
  for (const { key, upgrade } of upgrades) {
    // =========================================================================
    // PHYSICS-BASED CALCULATION (Simplified - no double counting)
    //
    // Primary: Use physics model (% of stock HP, already accounts for aspiration)
    // Fallback: Use rule-based if physics model doesn't have this upgrade
    //
    // PLATFORM-SPECIFIC OVERRIDES:
    // Some mods (like downpipe) have platform-specific gains based on forum research.
    // These override the generic physics model for more accurate predictions.
    // =========================================================================

    let fullGain;
    let calculationMethod;
    let physicsBasedGain;
    let ruleBasedGain;

    // ==========================================================================
    // DOWNPIPE: Use platform-specific gains (forum-validated)
    // Some platforms (RS5 2.9T, Porsche turbo) have efficient factory downpipes
    // with minimal aftermarket gains. Others (B58, Evo X) are restrictive.
    // ==========================================================================
    if (key === 'downpipe') {
      // Use platform-specific downpipe gain (returns HP, not percentage)
      fullGain = getPlatformDownpipeGain(car);
      calculationMethod = 'platform-calibrated';
      physicsBasedGain = fullGain;
      ruleBasedGain = fullGain;
      // Calibrated values have higher confidence
      if (minConfidence > CONFIDENCE_TIERS.CALIBRATED.min) {
        minConfidence = CONFIDENCE_TIERS.CALIBRATED.min;
      }
      maxTier = Math.min(maxTier, 2); // Calibrated tier
    } else {
      // Standard physics-based: percentage of stock HP (already has aspiration baked in)
      const physicsPercent = getPhysicsBasedGainPercent(key, aspiration);
      physicsBasedGain = Math.round(stockHp * physicsPercent);

      // Rule-based fallback: use upgrade definitions for mods not in physics model
      const baseHpGain = upgrade.metricChanges?.hpGain || 0;
      const multiplier = getHpGainMultiplier(car, upgrade);
      ruleBasedGain = Math.round(baseHpGain * multiplier);

      if (physicsPercent > 0) {
        // Use physics model (preferred - no double counting)
        fullGain = physicsBasedGain;
        calculationMethod = 'physics';
        if (minConfidence > CONFIDENCE_TIERS.PHYSICS.min) {
          minConfidence = CONFIDENCE_TIERS.PHYSICS.min;
        }
      } else if (ruleBasedGain > 0) {
        // Fallback to rule-based for mods not in physics model
        fullGain = ruleBasedGain;
        calculationMethod = 'rule-based';
        minConfidence = Math.min(minConfidence, CONFIDENCE_TIERS.GENERIC.max);
        maxTier = Math.max(maxTier, 4);
      } else {
        fullGain = 0;
        calculationMethod = 'none';
      }
    }

    rawGain += fullGain;

    let appliedGain = fullGain;
    let adjustmentReason = null;

    // Handle tunes - only active tune counts
    if (TUNE_HIERARCHY[key]) {
      if (key === activeTune) {
        const tuneCap = CATEGORY_CAPS.tuneTotal[engineCategory];
        appliedGain = Math.min(fullGain, tuneCap - categoryGains.tune);
        categoryGains.tune += appliedGain;
        if (appliedGain < fullGain) {
          adjustmentReason = 'tune cap reached';
        }
      } else {
        // Redundant tune - don't count
        appliedGain = 0;
        adjustmentReason = `superseded by ${getUpgradeByKey(activeTune)?.name || activeTune}`;
      }
    }
    // Handle exhaust mods
    else if (isExhaustMod(key)) {
      // Check if this mod is expected by a stage tune
      if (isModExpectedByTune(key, activeTune)) {
        appliedGain = Math.round(fullGain * TUNE_OVERLAP_MODIFIER);
        adjustmentReason = `partially included in ${getUpgradeByKey(activeTune)?.name || activeTune}`;
      }

      // Apply exhaust category cap
      const exhaustCap = CATEGORY_CAPS.exhaustTotal[engineCategory];
      const remainingCap = exhaustCap - categoryGains.exhaust;
      if (appliedGain > remainingCap) {
        appliedGain = Math.max(0, remainingCap);
        adjustmentReason = adjustmentReason
          ? `${adjustmentReason}, exhaust cap reached`
          : 'exhaust system cap reached';
      }

      // Apply cross-category diminishing returns if multiple exhaust mods
      const otherExhaustMods = selectedKeys.filter((k) => k !== key && isExhaustMod(k));
      if (otherExhaustMods.length > 0) {
        const diminishedGain = Math.round(appliedGain * EXHAUST_CROSS_CATEGORY_FACTOR);
        if (diminishedGain < appliedGain) {
          appliedGain = diminishedGain;
          adjustmentReason = adjustmentReason
            ? `${adjustmentReason}, diminishing returns`
            : 'diminishing returns with other exhaust mods';
        }
      }

      categoryGains.exhaust += appliedGain;
    }
    // Handle intake mods
    else if (isIntakeMod(key)) {
      if (isModExpectedByTune(key, activeTune)) {
        appliedGain = Math.round(fullGain * TUNE_OVERLAP_MODIFIER);
        adjustmentReason = `partially included in ${getUpgradeByKey(activeTune)?.name || activeTune}`;
      }

      const intakeCap = CATEGORY_CAPS.intakeTotal[engineCategory];
      const remainingCap = intakeCap - categoryGains.intake;
      if (appliedGain > remainingCap) {
        appliedGain = Math.max(0, remainingCap);
        adjustmentReason = adjustmentReason
          ? `${adjustmentReason}, intake cap reached`
          : 'intake system cap reached';
      }

      categoryGains.intake += appliedGain;
    }
    // Handle forced induction
    else if (isForcedInductionMod(key) || upgrade.category === 'forcedInduction') {
      if (isModExpectedByTune(key, activeTune)) {
        appliedGain = Math.round(fullGain * TUNE_OVERLAP_MODIFIER);
        adjustmentReason = `partially included in ${getUpgradeByKey(activeTune)?.name || activeTune}`;
      }

      categoryGains.forcedInduction += appliedGain;
    }
    // Other mods
    else {
      categoryGains.other += appliedGain;
    }

    adjustedGain += appliedGain;

    breakdown[key] = {
      name: upgrade.name,
      rawGain: fullGain,
      appliedGain,
      adjustmentReason,
      calculationMethod,
      physicsBasedGain,
      ruleBasedGain,
    };
  }

  // Determine confidence label based on tier
  let confidenceLabel;
  if (maxTier <= 2) {
    confidenceLabel = CONFIDENCE_TIERS.CALIBRATED.label;
  } else if (maxTier === 3) {
    confidenceLabel = CONFIDENCE_TIERS.PHYSICS.label;
  } else {
    confidenceLabel = CONFIDENCE_TIERS.GENERIC.label;
  }

  return {
    stockHp: stockHp,
    totalGain: adjustedGain,
    projectedHp: stockHp + adjustedGain,
    rawGain,
    adjustmentAmount: rawGain - adjustedGain,
    conflicts,
    breakdown,
    categoryGains,
    // Confidence fields - new in upgraded calculator
    confidence: minConfidence,
    confidenceLabel,
    tier: maxTier,
    aspiration,
  };
}

/**
 * Calculate all modification gains from a list of installed modification keys.
 *
 * USES calculateSmartHpGain() INTERNALLY for HP to ensure consistent calculations
 * with category caps, diminishing returns, and proper tune hierarchy handling.
 *
 * This is the RECOMMENDED function for all HP display purposes.
 *
 * @param {string[]|Object[]} installedMods - Array of upgrade/module keys OR full mod objects
 *   - Accepts strings: ['intake', 'stage1-tune', 'downpipe']
 *   - Accepts objects: [{key: 'intake', ...}, {key: 'stage1-tune', ...}]
 *   - Database stores full objects, UI may pass strings - handles both
 * @param {Object} car - Car object for engine-specific calculations (required for accurate HP)
 * @returns {ModificationGains}
 */
export function calculateAllModificationGains(installedMods, car = null) {
  if (!installedMods || installedMods.length === 0) {
    return {
      hpGain: 0,
      torqueGain: 0,
      zeroToSixtyImprovement: 0,
      brakingImprovement: 0,
      lateralGImprovement: 0,
    };
  }

  // ==========================================================================
  // INPUT NORMALIZATION
  // Database stores full mod objects, but calculators expect string keys.
  // Extract keys from objects, or use strings directly.
  // ==========================================================================
  const modKeys = installedMods
    .map((mod) => {
      if (typeof mod === 'string') return mod;
      // Handle full mod objects from database (has key or slug property)
      return mod?.key || mod?.slug || null;
    })
    .filter(Boolean);

  if (modKeys.length === 0) {
    return {
      hpGain: 0,
      torqueGain: 0,
      zeroToSixtyImprovement: 0,
      brakingImprovement: 0,
      lateralGImprovement: 0,
    };
  }

  // ==========================================================================
  // HP CALCULATION - Use calculateSmartHpGain for consistency
  // This applies: category caps, diminishing returns, tune hierarchy, overlap
  // ==========================================================================
  let hpGain = 0;

  if (car) {
    // Use the sophisticated calculator with all the smart logic
    const smartResult = calculateSmartHpGain(car, modKeys, { includeConflicts: false });
    hpGain = smartResult.totalGain;
  } else {
    // Fallback for when no car is provided (rare, but handle gracefully)
    // Use simple summation with basic overlap detection
    const activeTune =
      modKeys.find((m) => m === 'stage3-tune') ||
      modKeys.find((m) => m === 'stage2-tune') ||
      modKeys.find((m) => m === 'stage1-tune');

    modKeys.forEach((modKey) => {
      const upgrade = getUpgradeByKey(modKey);
      if (!upgrade?.metricChanges?.hpGain) return;

      const overlapModifier = isModExpectedByTune(modKey, activeTune) ? TUNE_OVERLAP_MODIFIER : 1.0;

      hpGain += Math.round(upgrade.metricChanges.hpGain * overlapModifier);
    });
  }

  // ==========================================================================
  // TORQUE - Physics-based calculation with aspiration awareness
  // Turbo cars gain more torque than HP due to boost characteristics
  // ==========================================================================
  let totalTorqueGain = 0;

  if (car && hpGain > 0) {
    // Use physics-based torque calculation
    const aspiration = detectAspiration(car);
    // Torque multipliers by aspiration type
    const TORQUE_MULTIPLIERS = {
      NA: 0.95, // NA cars gain slightly less torque than HP
      Turbo: 1.2, // Turbo cars gain more torque (low-end boost)
      TwinTurbo: 1.25, // Twin turbo even more torque
      Supercharged: 1.1, // Supercharged moderate torque advantage
      TwinSC: 1.12,
    };
    const torqueMultiplier = TORQUE_MULTIPLIERS[aspiration] || TORQUE_MULTIPLIERS.NA;
    totalTorqueGain = Math.round(hpGain * torqueMultiplier);
  } else {
    // Fallback: sum from metricChanges (for when no car context)
    const activeTune =
      modKeys.find((m) => m === 'stage3-tune') ||
      modKeys.find((m) => m === 'stage2-tune') ||
      modKeys.find((m) => m === 'stage1-tune');

    modKeys.forEach((modKey) => {
      const upgrade = getUpgradeByKey(modKey);
      if (!upgrade?.metricChanges?.torqueGain) return;

      const overlapModifier = isModExpectedByTune(modKey, activeTune) ? TUNE_OVERLAP_MODIFIER : 1.0;

      totalTorqueGain += Math.round(upgrade.metricChanges.torqueGain * overlapModifier);
    });
  }

  // ==========================================================================
  // OTHER METRICS - Simple summation for braking, lateral G
  // (These are still rule-based - the full physics model is in metricsCalculator)
  // ==========================================================================
  let totalZeroToSixtyImprovement = 0;
  let totalBrakingImprovement = 0;
  let totalLateralGImprovement = 0;

  modKeys.forEach((modKey) => {
    const upgrade = getUpgradeByKey(modKey);
    if (!upgrade?.metricChanges) return;

    const changes = upgrade.metricChanges;

    if (changes.zeroToSixtyImprovement) {
      totalZeroToSixtyImprovement += changes.zeroToSixtyImprovement;
    }
    if (changes.brakingImprovement) {
      totalBrakingImprovement += changes.brakingImprovement;
    }
    if (changes.lateralGImprovement) {
      totalLateralGImprovement += changes.lateralGImprovement;
    }
  });

  return {
    hpGain,
    torqueGain: totalTorqueGain,
    zeroToSixtyImprovement: Math.round(totalZeroToSixtyImprovement * 100) / 100,
    brakingImprovement: Math.round(totalBrakingImprovement),
    lateralGImprovement: Math.round(totalLateralGImprovement * 100) / 100,
  };
}

/**
 * Calculate performance using multiplier-based approach.
 * Used for basic builds without detailed specs.
 *
 * @param {Object} params
 * @param {number} params.stockHp - Stock horsepower
 * @param {number} params.stockTorque - Stock torque
 * @param {string} params.engineType - Engine type
 * @param {string[]} params.installedMods - Array of mod keys
 * @returns {Object} Performance estimate
 */
export function calculateMultiplierBased({ stockHp, stockTorque, engineType, installedMods }) {
  const isTurbo = engineType?.toLowerCase().includes('turbo');
  const engineCategory = isTurbo ? 'turbo' : 'na';

  const categoryGains = {
    exhaust: 0,
    intake: 0,
    tune: 0,
    forced: 0,
    fuel: 0,
    other: 0,
  };

  const breakdown = { mods: [] };

  // Detect active tune
  const activeTune =
    installedMods.find((m) => m === 'stage3-tune') ||
    installedMods.find((m) => m === 'stage2-tune') ||
    installedMods.find((m) => m === 'stage1-tune');

  for (const modKey of installedMods) {
    const modGains = MOD_HP_GAINS[modKey];
    if (!modGains) continue;

    let gain = modGains[engineCategory] || 0;
    if (gain === 0) continue;

    // Categorize the mod
    let category = 'other';
    if (['exhaust-catback', 'headers', 'downpipe'].includes(modKey)) {
      category = 'exhaust';
    } else if (['intake'].includes(modKey)) {
      category = 'intake';
    } else if (modKey.includes('tune')) {
      category = 'tune';
    } else if (['flex-fuel-e85', 'fuel-system-upgrade'].includes(modKey)) {
      category = 'fuel';
    } else if (
      ['turbo-upgrade-existing', 'turbo-kit-single', 'supercharger-roots', 'intercooler'].includes(
        modKey
      )
    ) {
      category = 'forced';
    }

    // Check tune overlap
    if (isModExpectedByTune(modKey, activeTune)) {
      gain = Math.round(gain * TUNE_OVERLAP_MODIFIER);
    }

    // Apply category cap
    const cap = CATEGORY_CAPS_SIMPLE[category]?.[engineCategory];
    let appliedGain = gain;

    if (cap && categoryGains[category] + gain > cap) {
      appliedGain = Math.max(0, cap - categoryGains[category]);
    }

    categoryGains[category] += appliedGain;

    if (appliedGain > 0) {
      breakdown.mods.push({
        mod: modKey,
        gain: appliedGain,
        capped: appliedGain < gain,
      });
    }
  }

  const totalGain = Object.values(categoryGains).reduce((sum, g) => sum + g, 0);

  return {
    estimatedWhp: stockHp + totalGain,
    estimatedWtq: stockTorque ? Math.round(stockTorque * (1 + totalGain / stockHp)) : null,
    hpGain: totalGain,
    confidence: 0.6,
    confidenceLevel: 'estimated',
    confidenceLabel: 'Multiplier-based estimate',
    source: 'multiplier',
    breakdown,
  };
}

/**
 * Main build performance calculation function.
 * Handles both basic and advanced calculation modes.
 *
 * IMPORTANT: When user has provided dyno data, that takes ABSOLUTE PRIORITY
 * over any calculated/estimated values. This ensures users see their actual
 * measured data reflected throughout the app.
 *
 * Data Source Priority:
 * 1. Verified user dyno data (confidence: 1.0, source: 'verified')
 * 2. User-provided dyno data (confidence: 0.95, source: 'measured')
 * 3. Calibrated estimates (confidence: 0.75, source: 'calibrated')
 * 4. Physics-based estimates (confidence: 0.6, source: 'estimated')
 *
 * @param {Object} params
 * @param {number} params.stockHp - Stock horsepower
 * @param {number} params.stockTorque - Stock torque
 * @param {string} params.engineType - Engine type
 * @param {string[]} params.installedMods - Array of mod keys
 * @param {Object} params.customSpecs - Advanced build specs (optional)
 * @param {Object} params.userDyno - User's dyno result data (optional)
 * @param {Object} params.turboData - Turbo model data (optional)
 * @param {string} params.drivetrain - Drivetrain type for WHP calculations
 * @returns {Object} Performance estimate with confidence and source metadata
 */
export function calculateBuildPerformance({
  stockHp,
  stockTorque,
  engineType = 'unknown',
  installedMods = [],
  customSpecs = {},
  userDyno = null,
  turboData: _turboData = null,
  drivetrain = 'RWD',
}) {
  // Drivetrain loss for WHP to crank HP conversion
  const DRIVETRAIN_LOSS = {
    FWD: 0.12,
    RWD: 0.15,
    AWD: 0.2,
    '4WD': 0.22,
  };
  const loss = DRIVETRAIN_LOSS[drivetrain?.toUpperCase()] || DRIVETRAIN_LOSS.RWD;

  // ==========================================================================
  // PRIORITY 1: User-provided dyno data (from userDyno param or customSpecs)
  // This takes ABSOLUTE PRIORITY - when users provide dyno data, we use it
  // ==========================================================================
  const dynoData = userDyno || customSpecs?.dyno;

  if (dynoData?.hasResults && dynoData?.whp && dynoData.whp > 0) {
    const isVerified = dynoData.isVerified === true;
    const crankHp = dynoData.crankHp || Math.round(dynoData.whp / (1 - loss));
    const crankTq =
      dynoData.crankTq || (dynoData.wtq ? Math.round(dynoData.wtq / (1 - loss)) : null);

    return {
      // Performance values
      estimatedWhp: dynoData.whp,
      estimatedWtq: dynoData.wtq || null,
      estimatedHp: crankHp,
      estimatedTq: crankTq,
      hpGain: crankHp - stockHp,
      torqueGain: crankTq ? crankTq - stockTorque : null,

      // Source metadata - CRITICAL for UI display
      confidence: isVerified ? 1.0 : 0.95,
      confidenceLevel: isVerified ? 'verified' : 'measured',
      confidenceLabel: isVerified ? 'Verified dyno data' : 'User dyno data',
      source: isVerified ? 'verified' : 'measured',
      dataSource: isVerified ? 'verified' : 'measured',
      isUserProvided: true,

      // Detailed source info for UI badges
      sourceDetails: {
        hp: {
          source: isVerified ? 'verified' : 'measured',
          label: 'Dyno',
          detail: dynoData.dynoShop,
        },
        torque: {
          source: isVerified ? 'verified' : 'measured',
          label: 'Dyno',
          detail: dynoData.dynoShop,
        },
        whp: {
          source: isVerified ? 'verified' : 'measured',
          label: 'Dyno',
          detail: dynoData.dynoType,
        },
        wtq: dynoData.wtq ? { source: isVerified ? 'verified' : 'measured', label: 'Dyno' } : null,
        boost: dynoData.boostPsi
          ? { source: isVerified ? 'verified' : 'measured', value: dynoData.boostPsi }
          : null,
      },

      // Breakdown for debugging/display
      breakdown: {
        dyno: {
          whp: dynoData.whp,
          wtq: dynoData.wtq,
          crankHp,
          crankTq,
          boost: dynoData.boostPsi,
          fuel: dynoData.fuelType,
          type: dynoData.dynoType,
          shop: dynoData.dynoShop,
          date: dynoData.dynoDate,
          isVerified,
        },
      },
    };
  }

  // ==========================================================================
  // PRIORITY 2: Fall back to multiplier-based calculation
  // ==========================================================================
  const calculated = calculateMultiplierBased({
    stockHp,
    stockTorque,
    engineType,
    installedMods,
  });

  // Enhance with source metadata
  return {
    ...calculated,
    isUserProvided: false,
    dataSource: calculated.source || 'estimated',

    // Source details for all metrics (all estimated)
    sourceDetails: {
      hp: { source: 'estimated', label: 'Est.', detail: calculated.confidenceLabel },
      torque: { source: 'estimated', label: 'Est.', detail: 'Physics model' },
    },
  };
}

// =============================================================================
// CONFLICT DETECTION (Internal)
// =============================================================================

/**
 * Detect conflicts and overlaps in selected upgrades (internal use)
 * @private
 */
function detectUpgradeConflictsInternal(selectedKeys, _car) {
  const conflicts = [];

  // 1. Check for multiple tunes
  const tunes = selectedKeys.filter((key) => TUNE_HIERARCHY[key]);
  if (tunes.length > 1) {
    const highestTune = getHighestPriorityTune(tunes);
    const redundantTunes = tunes.filter((t) => t !== highestTune);

    conflicts.push({
      type: 'redundant',
      severity: 'warning',
      message: `Multiple tunes selected. Only "${getUpgradeByKey(highestTune)?.name || highestTune}" applies.`,
      affectedUpgrades: redundantTunes,
    });
  }

  // 2. Check for stage tune + included mods overlap
  for (const tuneKey of tunes) {
    const includedMods = STAGE_TUNE_INCLUDED_MODS[tuneKey] || [];
    const overlappingMods = includedMods.filter((mod) => selectedKeys.includes(mod));

    if (overlappingMods.length > 0) {
      const tuneName = getUpgradeByKey(tuneKey)?.name || tuneKey;
      const modNames = overlappingMods.map((m) => getUpgradeByKey(m)?.name || m);

      conflicts.push({
        type: 'overlap',
        severity: 'info',
        message: `${tuneName} is calibrated for ${modNames.join(' and ')}. HP gains don't fully stack.`,
        affectedUpgrades: overlappingMods,
      });
    }
  }

  return conflicts;
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Format HP display string
 * @param {HpCalculationResult} result - Calculation result
 * @returns {Object} Formatted display strings
 */
export function formatHpDisplay(result) {
  const { stockHp, projectedHp, totalGain, adjustmentAmount } = result;

  return {
    full: `Stock ${stockHp} HP → Projected ${projectedHp} HP (+${totalGain})`,
    compact: `${stockHp} → ${projectedHp} HP (+${totalGain})`,
    stock: stockHp,
    projected: projectedHp,
    gain: totalGain,
    hasAdjustment: adjustmentAmount > 5,
    adjustmentNote:
      adjustmentAmount > 5 ? `${adjustmentAmount} HP reduced for realistic stacking` : null,
  };
}

// =============================================================================
// BUILD PROGRESS RING CALCULATIONS
// =============================================================================

/**
 * Calculate the maximum potential HP/torque gains for a vehicle.
 * Used for the Power ring in Build Progress visualization.
 *
 * Stage 3 maximums are based on CATEGORY_CAPS_PERCENT:
 * - Turbo/TwinTurbo: ~70% HP gain (Stage 3 tune + turbo upgrade + supporting mods)
 * - Supercharged: ~50% HP gain (pulley upgrade + tune + supporting mods)
 * - NA: ~25% HP gain (bolt-ons only, no forced induction conversion)
 *
 * @param {Object} car - Car object with hp, torque, engine fields
 * @returns {{ maxHpGain: number, maxTorqueGain: number, aspiration: string, stockHp: number, stockTorque: number }}
 */
export function calculateMaxPotential(car) {
  const stockHp = car?.hp || 400;
  const stockTorque = car?.torque || Math.round(stockHp * 0.9);
  const aspiration = detectAspiration(car);

  // Stage 3 maximums from CATEGORY_CAPS_PERCENT
  // These represent realistic max gains without engine internals work
  let maxPercent;
  switch (aspiration) {
    case 'Turbo':
    case 'TwinTurbo':
      // Turbo cars have massive headroom: Stage 3 tune (55%) + turbo upgrade (25%) + supporting mods
      // Capped at 70% to be realistic (beyond requires internals)
      maxPercent = 0.7;
      break;
    case 'Supercharged':
    case 'TwinSC':
      // Supercharged cars: pulley upgrade + tune can push ~50%
      maxPercent = 0.5;
      break;
    default:
      // NA cars: bolt-ons max out around 25% without adding forced induction
      // This includes headers, intake, tune, exhaust
      maxPercent = 0.25;
  }

  return {
    maxHpGain: Math.round(stockHp * maxPercent),
    maxTorqueGain: Math.round(stockTorque * maxPercent),
    aspiration,
    stockHp,
    stockTorque,
  };
}

/**
 * Calculate handling score based on installed handling modifications.
 * Used for the Handling ring in Build Progress visualization.
 *
 * IMPORTANT: Stock vehicles start at 50% (they handle fine stock).
 * Handling mods ADD to this baseline, up to 100%.
 * This prevents the ring from looking "empty" for non-handling-focused builds.
 *
 * Scoring breakdown (50 points from mods, 50 baseline):
 * - BASELINE: 50 points (stock handling)
 * - Suspension: up to 20 points (coilovers, sway bars, etc.)
 * - Brakes: up to 15 points (BBK, pads, fluid, lines)
 * - Tires/Wheels: up to 10 points (performance tires, lightweight wheels)
 * - Chassis: up to 5 points (bracing, roll cage)
 *
 * @param {string[]} installedMods - Array of installed mod keys
 * @returns {{ current: number, max: number, percent: number, breakdown: Object, isStock: boolean }}
 */
export function calculateHandlingScore(installedMods) {
  const BASELINE = 50; // Stock cars handle fine - start at 50%
  const MOD_MAX = 50; // Mods can add up to 50 more points

  const breakdown = { baseline: BASELINE, suspension: 0, brakes: 0, tires: 0, chassis: 0 };

  if (!installedMods || installedMods.length === 0) {
    return {
      current: BASELINE,
      max: 100,
      percent: BASELINE,
      breakdown,
      isStock: true,
    };
  }

  // ==========================================================================
  // SUSPENSION: 20 points max (from mods)
  // ==========================================================================
  if (installedMods.includes('coilovers-track')) {
    breakdown.suspension += 18;
  } else if (installedMods.includes('coilovers-street') || installedMods.includes('coilovers')) {
    breakdown.suspension += 12;
  } else if (installedMods.includes('lowering-springs')) {
    breakdown.suspension += 6;
  }

  if (installedMods.includes('sway-bars')) {
    breakdown.suspension += 3;
  }

  breakdown.suspension = Math.min(breakdown.suspension, 20);

  // ==========================================================================
  // BRAKES: 15 points max
  // ==========================================================================
  if (installedMods.includes('big-brake-kit')) {
    breakdown.brakes += 10;
  }

  if (installedMods.includes('brake-pads-track')) {
    breakdown.brakes += 4;
  } else if (
    installedMods.includes('brake-pads-street') ||
    installedMods.includes('brake-pads-performance')
  ) {
    breakdown.brakes += 2;
  }

  if (installedMods.includes('high-temp-brake-fluid')) {
    breakdown.brakes += 2;
  }
  if (
    installedMods.includes('braided-brake-lines') ||
    installedMods.includes('brake-fluid-lines')
  ) {
    breakdown.brakes += 2;
  }

  breakdown.brakes = Math.min(breakdown.brakes, 15);

  // ==========================================================================
  // TIRES/WHEELS: 10 points max
  // ==========================================================================
  if (installedMods.includes('tires-track') || installedMods.includes('tires-r-compound')) {
    breakdown.tires += 8;
  } else if (
    installedMods.includes('tires-performance') ||
    installedMods.includes('tires-summer')
  ) {
    breakdown.tires += 5;
  }

  if (installedMods.includes('wheels-lightweight') || installedMods.includes('forged-wheels')) {
    breakdown.tires += 3;
  }

  breakdown.tires = Math.min(breakdown.tires, 10);

  // ==========================================================================
  // CHASSIS: 5 points max
  // ==========================================================================
  if (installedMods.includes('roll-cage')) {
    breakdown.chassis += 4;
  }
  if (installedMods.includes('chassis-bracing') || installedMods.includes('strut-tower-brace')) {
    breakdown.chassis += 2;
  }

  breakdown.chassis = Math.min(breakdown.chassis, 5);

  // ==========================================================================
  // TOTAL: Baseline + Mods
  // ==========================================================================
  const modPoints = breakdown.suspension + breakdown.brakes + breakdown.tires + breakdown.chassis;
  const total = BASELINE + Math.min(modPoints, MOD_MAX);
  const hasHandlingMods = modPoints > 0;

  return {
    current: total,
    max: 100,
    percent: total, // Already 0-100 scale
    breakdown,
    isStock: !hasHandlingMods,
  };
}

/**
 * Calculate reliability score based on power level and supporting modifications.
 * Used for the Reliability ring in Build Progress visualization.
 *
 * PHILOSOPHY: Adding power inherently adds stress to the engine.
 * Supporting mods help RESTORE reliability lost from power gains.
 *
 * Formula:
 * - Stock = 100% reliable
 * - Each 10% HP gain = -5% reliability (power stresses components)
 * - Supporting mods restore reliability:
 *   - Intercooler: +10%
 *   - Oil cooler: +5%
 *   - Fuel system upgrade: +5%
 *   - Catch can: +3%
 *   - High-temp brake fluid: +2%
 *
 * Example: +25% HP gain (-12.5%) + intercooler (+10%) = 97.5% reliable
 *
 * @param {string[]} installedMods - Array of installed mod keys
 * @param {number} hpGainPercent - HP gain as percentage of stock (0.25 = 25%)
 * @returns {{ current: number, max: number, percent: number, warnings: string[], status: string, breakdown: Object }}
 */
export function calculateReliabilityScore(installedMods, hpGainPercent = 0) {
  const breakdown = {
    base: 100,
    powerPenalty: 0,
    supportBonus: 0,
  };
  const warnings = [];

  // Stock vehicle = 100% reliable
  if (!installedMods || installedMods.length === 0 || hpGainPercent === 0) {
    return {
      current: 100,
      max: 100,
      percent: 100,
      warnings: [],
      status: 'stock',
      breakdown,
    };
  }

  // ==========================================================================
  // POWER PENALTY: More power = more stress on components
  // Each 10% HP gain costs 5% reliability
  // ==========================================================================
  const powerPenalty = Math.round(hpGainPercent * 50); // 10% HP = 5% penalty
  breakdown.powerPenalty = powerPenalty;

  // ==========================================================================
  // SUPPORTING MODS: Restore reliability
  // ==========================================================================
  let supportBonus = 0;

  // Cooling upgrades
  if (installedMods.includes('intercooler')) {
    supportBonus += 12;
  }
  if (installedMods.includes('oil-cooler')) {
    supportBonus += 6;
  }
  if (installedMods.includes('radiator-upgrade') || installedMods.includes('radiator')) {
    supportBonus += 4;
  }

  // Fuel system
  if (installedMods.includes('fuel-system-upgrade')) {
    supportBonus += 6;
  }

  // Engine protection
  if (installedMods.includes('catch-can')) {
    supportBonus += 3;
  }

  // Proper supporting exhaust for forced induction
  if (installedMods.includes('downpipe')) {
    supportBonus += 3; // Reduces back pressure, less stress
  }

  breakdown.supportBonus = supportBonus;

  // ==========================================================================
  // CALCULATE FINAL SCORE
  // ==========================================================================
  let score = breakdown.base - powerPenalty + supportBonus;

  // Cap at 100 (can't be more reliable than stock) and floor at 0
  score = Math.min(100, Math.max(0, score));

  // ==========================================================================
  // GENERATE WARNINGS based on imbalance
  // ==========================================================================
  const netPenalty = powerPenalty - supportBonus;

  if (netPenalty > 20 && !installedMods.includes('intercooler')) {
    warnings.push('Significant power gains without intercooler may cause heat soak');
  }

  if (hpGainPercent > 0.4 && !installedMods.includes('fuel-system-upgrade')) {
    warnings.push('40%+ HP gain may benefit from fuel system upgrades');
  }

  if (
    hpGainPercent > 0.25 &&
    !installedMods.includes('oil-cooler') &&
    !installedMods.includes('intercooler')
  ) {
    warnings.push('Consider cooling upgrades for sustained performance');
  }

  // ==========================================================================
  // DETERMINE STATUS
  // ==========================================================================
  let status;
  if (score >= 95) {
    status = 'excellent';
  } else if (score >= 85) {
    status = 'good';
  } else if (score >= 70) {
    status = 'monitor';
  } else {
    status = 'at-risk';
  }

  return {
    current: Math.round(score),
    max: 100,
    percent: Math.round(score),
    warnings,
    status,
    breakdown,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export { isExhaustMod, isIntakeMod, isForcedInductionMod };
