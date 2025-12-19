/**
 * AutoRev - Upgrade Calculator
 * 
 * Smart HP/performance calculation with:
 * - Diminishing returns for same-category mods
 * - Stage tune overlap detection
 * - Category-based gain caps
 * - Conflict warnings for overlapping mods
 * 
 * This module addresses the issues where:
 * 1. Header + catback fully stack (unrealistic)
 * 2. Stage 2 tune + downpipe double-counts gains
 * 3. Multiple tunes selected simultaneously
 */

import { getUpgradeByKey } from './upgrades.js';
import { getEngineType, getHpGainMultiplier } from '../data/upgradePackages.js';

// =============================================================================
// CATEGORY DEFINITIONS - What types of mods overlap/conflict
// =============================================================================

/**
 * Exhaust subcategories - mods in same subcategory have diminishing returns
 * Mods in different subcategories (headers vs catback) also don't fully stack
 */
export const EXHAUST_SUBCATEGORIES = {
  headers: ['headers'],
  catback: ['exhaust-catback'],
  downpipe: ['downpipe'],
  fullSystem: ['full-exhaust'], // If we add this later
};

/**
 * Tune categories - these REPLACE each other, don't stack
 * Stage 2 includes Stage 1 gains, Stage 3 includes Stage 2
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

/**
 * What mods are typically included in stage tunes
 * Stage 2 tune assumes you have downpipe + intake
 * Stage 3 assumes turbo upgrade
 */
export const STAGE_TUNE_INCLUDED_MODS = {
  'stage2-tune': ['downpipe', 'intake'], // Stage 2 tune is designed for cars WITH these
  'stage3-tune': ['downpipe', 'intake', 'turbo-upgrade-existing', 'intercooler'],
};

/**
 * Category caps - max realistic gains from each category
 * Prevents unrealistic stacking
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
 * Diminishing returns factor for same-subcategory mods
 * Second mod in same category only gives this % of stated gain
 */
export const DIMINISHING_RETURNS_FACTOR = 0.3;

/**
 * Cross-category diminishing returns (e.g., headers + catback)
 * These work well together but don't fully stack
 */
export const EXHAUST_CROSS_CATEGORY_FACTOR = 0.85;

// =============================================================================
// CONFLICT DETECTION
// =============================================================================

/**
 * @typedef {Object} UpgradeConflict
 * @property {string} type - 'overlap' | 'redundant' | 'incompatible'
 * @property {string} severity - 'warning' | 'info'
 * @property {string} message - Human-readable explanation
 * @property {string[]} affectedUpgrades - Keys of conflicting upgrades
 * @property {number} wastedHp - HP that was double-counted
 */

/**
 * Detect conflicts and overlaps in selected upgrades
 * @param {string[]} selectedKeys - Array of upgrade keys
 * @param {Object} car - Car object
 * @returns {UpgradeConflict[]} - Array of detected conflicts
 */
export function detectUpgradeConflicts(selectedKeys, car) {
  const conflicts = [];
  const upgrades = selectedKeys.map(key => getUpgradeByKey(key)).filter(Boolean);
  
  // 1. Check for multiple tunes (only highest should apply)
  const tunes = selectedKeys.filter(key => TUNE_HIERARCHY[key]);
  if (tunes.length > 1) {
    const highestTune = getHighestPriorityTune(tunes);
    const redundantTunes = tunes.filter(t => t !== highestTune);
    
    conflicts.push({
      type: 'redundant',
      severity: 'warning',
      message: `You have multiple tunes selected. Only "${getUpgradeByKey(highestTune)?.name || highestTune}" will apply - ${redundantTunes.map(t => getUpgradeByKey(t)?.name || t).join(', ')} ${redundantTunes.length === 1 ? 'is' : 'are'} redundant.`,
      affectedUpgrades: redundantTunes,
      wastedHp: calculateWastedTuneHp(redundantTunes, car),
    });
  }
  
  // 2. Check for stage tune + included mods overlap
  for (const tuneKey of tunes) {
    const includedMods = STAGE_TUNE_INCLUDED_MODS[tuneKey] || [];
    const overlappingMods = includedMods.filter(mod => selectedKeys.includes(mod));
    
    if (overlappingMods.length > 0) {
      const tuneName = getUpgradeByKey(tuneKey)?.name || tuneKey;
      const modNames = overlappingMods.map(m => getUpgradeByKey(m)?.name || m);
      
      conflicts.push({
        type: 'overlap',
        severity: 'info',
        message: `${tuneName} is calibrated assuming ${modNames.join(' and ')} ${modNames.length === 1 ? 'is' : 'are'} installed. HP gains don't fully stack.`,
        affectedUpgrades: overlappingMods,
        wastedHp: calculateOverlapWastedHp(overlappingMods, tuneKey, car),
      });
    }
  }
  
  // 3. Check for multiple exhaust mods in same subcategory
  for (const [subcategory, mods] of Object.entries(EXHAUST_SUBCATEGORIES)) {
    const selectedInSubcat = mods.filter(m => selectedKeys.includes(m));
    if (selectedInSubcat.length > 1) {
      const modNames = selectedInSubcat.map(m => getUpgradeByKey(m)?.name || m);
      conflicts.push({
        type: 'redundant',
        severity: 'warning',
        message: `Multiple ${subcategory} mods selected (${modNames.join(', ')}). Consider choosing one - gains don't fully stack.`,
        affectedUpgrades: selectedInSubcat.slice(1),
        wastedHp: calculateDiminishingReturnsWasted(selectedInSubcat.slice(1), car),
      });
    }
  }
  
  // 4. Check for piggyback tuner + flash tune conflict
  if (selectedKeys.includes('piggyback-tuner') && tunes.some(t => t !== 'piggyback-tuner')) {
    const flashTune = tunes.find(t => t !== 'piggyback-tuner');
    conflicts.push({
      type: 'incompatible',
      severity: 'warning',
      message: `Piggyback tuner (JB4) typically conflicts with flash tunes. Choose one or the other.`,
      affectedUpgrades: ['piggyback-tuner', flashTune],
      wastedHp: getUpgradeByKey('piggyback-tuner')?.metricChanges?.hpGain || 50,
    });
  }
  
  return conflicts;
}

/**
 * Get the highest priority tune from a list
 */
function getHighestPriorityTune(tuneKeys) {
  return tuneKeys.reduce((highest, current) => {
    const currentPriority = TUNE_HIERARCHY[current]?.priority || 0;
    const highestPriority = TUNE_HIERARCHY[highest]?.priority || 0;
    return currentPriority > highestPriority ? current : highest;
  }, tuneKeys[0]);
}

/**
 * Calculate HP wasted by redundant tunes
 */
function calculateWastedTuneHp(redundantTunes, car) {
  return redundantTunes.reduce((total, tuneKey) => {
    const tune = getUpgradeByKey(tuneKey);
    const baseGain = tune?.metricChanges?.hpGain || 0;
    const multiplier = car ? getHpGainMultiplier(car, tune) : 1;
    return total + Math.round(baseGain * multiplier);
  }, 0);
}

/**
 * Calculate HP wasted by stage tune overlap with hardware
 */
function calculateOverlapWastedHp(overlappingMods, tuneKey, car) {
  // Stage tunes expect these mods, so we reduce the mod's contribution
  // by about 50% since the tune already accounts for them
  return overlappingMods.reduce((total, modKey) => {
    const mod = getUpgradeByKey(modKey);
    const baseGain = mod?.metricChanges?.hpGain || 0;
    const multiplier = car ? getHpGainMultiplier(car, mod) : 1;
    return total + Math.round(baseGain * multiplier * 0.5);
  }, 0);
}

/**
 * Calculate HP wasted by diminishing returns
 */
function calculateDiminishingReturnsWasted(additionalMods, car) {
  return additionalMods.reduce((total, modKey) => {
    const mod = getUpgradeByKey(modKey);
    const baseGain = mod?.metricChanges?.hpGain || 0;
    const multiplier = car ? getHpGainMultiplier(car, mod) : 1;
    const fullGain = Math.round(baseGain * multiplier);
    const actualGain = Math.round(fullGain * DIMINISHING_RETURNS_FACTOR);
    return total + (fullGain - actualGain);
  }, 0);
}

// =============================================================================
// SMART HP CALCULATION
// =============================================================================

/**
 * @typedef {Object} HpCalculationResult
 * @property {number} stockHp - Car's stock horsepower
 * @property {number} totalGain - Net HP gain after adjustments
 * @property {number} projectedHp - Stock + gain
 * @property {number} rawGain - Unadjusted sum of all mod gains (for comparison)
 * @property {number} adjustmentAmount - How much was reduced for overlap/diminishing returns
 * @property {UpgradeConflict[]} conflicts - Detected conflicts
 * @property {Object} breakdown - Per-upgrade breakdown of applied gains
 */

/**
 * Calculate realistic HP gains with diminishing returns and overlap handling
 * @param {Object} car - Car object with hp, engine, etc.
 * @param {string[]} selectedKeys - Array of upgrade keys
 * @returns {HpCalculationResult}
 */
export function calculateSmartHpGain(car, selectedKeys) {
  if (!car || !selectedKeys || selectedKeys.length === 0) {
    return {
      stockHp: car?.hp || 0,
      totalGain: 0,
      projectedHp: car?.hp || 0,
      rawGain: 0,
      adjustmentAmount: 0,
      conflicts: [],
      breakdown: {},
    };
  }
  
  const engineType = getEngineType(car);
  const isTurbo = engineType.includes('Turbo');
  const isSC = engineType.includes('SC');
  const engineCategory = isTurbo ? 'turbo' : isSC ? 'sc' : 'na';
  
  // Detect conflicts
  const conflicts = detectUpgradeConflicts(selectedKeys, car);
  
  // Get all upgrade objects
  const upgrades = selectedKeys
    .map(key => ({ key, upgrade: getUpgradeByKey(key) }))
    .filter(({ upgrade }) => upgrade);
  
  // Track gains by category for caps
  const categoryGains = {
    exhaust: 0,
    intake: 0,
    tune: 0,
    forcedInduction: 0,
    other: 0,
  };
  
  // Track which upgrades have been processed
  const breakdown = {};
  let rawGain = 0;
  let adjustedGain = 0;
  
  // 1. First, determine which tune applies (only one)
  const selectedTunes = selectedKeys.filter(key => TUNE_HIERARCHY[key]);
  const activeTune = selectedTunes.length > 0 ? getHighestPriorityTune(selectedTunes) : null;
  
  // 2. Process each upgrade
  for (const { key, upgrade } of upgrades) {
    const baseHpGain = upgrade.metricChanges?.hpGain || 0;
    const multiplier = getHpGainMultiplier(car, upgrade);
    const fullGain = Math.round(baseHpGain * multiplier);
    
    rawGain += fullGain;
    
    let appliedGain = fullGain;
    let adjustmentReason = null;
    
    // Handle tunes - only active tune counts
    if (TUNE_HIERARCHY[key]) {
      if (key === activeTune) {
        // This is the active tune - apply with tune cap
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
      // Check if this mod is "expected" by a stage tune
      const isExpectedByTune = activeTune && 
        STAGE_TUNE_INCLUDED_MODS[activeTune]?.includes(key);
      
      if (isExpectedByTune) {
        // Reduce gain since tune already accounts for it
        appliedGain = Math.round(fullGain * 0.5);
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
      const otherExhaustMods = selectedKeys.filter(k => k !== key && isExhaustMod(k));
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
      const isExpectedByTune = activeTune && 
        STAGE_TUNE_INCLUDED_MODS[activeTune]?.includes(key);
      
      if (isExpectedByTune) {
        appliedGain = Math.round(fullGain * 0.5);
        adjustmentReason = `partially included in ${getUpgradeByKey(activeTune)?.name || activeTune}`;
      }
      
      // Apply intake cap
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
    else if (upgrade.category === 'forcedInduction') {
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
    };
  }
  
  return {
    stockHp: car.hp || 0,
    totalGain: adjustedGain,
    projectedHp: (car.hp || 0) + adjustedGain,
    rawGain,
    adjustmentAmount: rawGain - adjustedGain,
    conflicts,
    breakdown,
    categoryGains,
  };
}

/**
 * Check if an upgrade is an exhaust mod
 */
function isExhaustMod(key) {
  return key === 'headers' || 
         key === 'exhaust-catback' || 
         key === 'downpipe' ||
         key.includes('exhaust');
}

/**
 * Check if an upgrade is an intake mod
 */
function isIntakeMod(key) {
  return key === 'intake' || 
         key === 'throttle-body' ||
         key === 'intake-manifold';
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Format HP display string in "Stock X → Projected Y (+Z)" format
 * @param {HpCalculationResult} result - Calculation result
 * @returns {Object} - Formatted display strings
 */
export function formatHpDisplay(result) {
  const { stockHp, projectedHp, totalGain, adjustmentAmount } = result;
  
  return {
    // Full format: "Stock 525 HP → Projected 689 HP (+164)"
    full: `Stock ${stockHp} HP → Projected ${projectedHp} HP (+${totalGain})`,
    // Compact format: "525 → 689 HP (+164)"
    compact: `${stockHp} → ${projectedHp} HP (+${totalGain})`,
    // Arrow format for UI components
    stock: stockHp,
    projected: projectedHp,
    gain: totalGain,
    // Show adjustment note if significant
    hasAdjustment: adjustmentAmount > 5,
    adjustmentNote: adjustmentAmount > 5 
      ? `${adjustmentAmount} HP reduced for realistic stacking`
      : null,
  };
}

/**
 * Get a summary of conflicts for UI display
 * @param {UpgradeConflict[]} conflicts 
 * @returns {Object}
 */
export function getConflictSummary(conflicts) {
  if (!conflicts || conflicts.length === 0) {
    return {
      hasConflicts: false,
      warningCount: 0,
      infoCount: 0,
      totalWastedHp: 0,
      messages: [],
    };
  }
  
  const warnings = conflicts.filter(c => c.severity === 'warning');
  const infos = conflicts.filter(c => c.severity === 'info');
  const totalWasted = conflicts.reduce((sum, c) => sum + (c.wastedHp || 0), 0);
  
  return {
    hasConflicts: true,
    warningCount: warnings.length,
    infoCount: infos.length,
    totalWastedHp: totalWasted,
    messages: conflicts.map(c => ({
      severity: c.severity,
      message: c.message,
      affectedUpgrades: c.affectedUpgrades,
    })),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  calculateSmartHpGain,
  detectUpgradeConflicts,
  formatHpDisplay,
  getConflictSummary,
  TUNE_HIERARCHY,
  CATEGORY_CAPS,
  STAGE_TUNE_INCLUDED_MODS,
};



