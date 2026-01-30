/**
 * AutoRev - Conflict Detector
 *
 * Detect conflicts and overlaps in selected upgrades.
 * Consolidated from lib/upgradeCalculator.js
 *
 * @module lib/performanceCalculator/conflictDetector
 */

import { getHpGainMultiplier, getEngineType } from '../../data/upgradePackages.js';
import { getUpgradeByKey } from '../upgrades.js';
import {
  STAGE_TUNE_INCLUDED_MODS,
  TUNE_HIERARCHY,
  EXHAUST_SUBCATEGORIES,
  DIMINISHING_RETURNS_FACTOR,
  getHighestPriorityTune,
  getExpectedModsForTune,
  getEngineCategory,
} from './constants.js';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * @typedef {Object} UpgradeConflict
 * @property {string} type - 'overlap' | 'redundant' | 'incompatible'
 * @property {string} severity - 'warning' | 'info'
 * @property {string} message - Human-readable explanation
 * @property {string[]} affectedUpgrades - Keys of conflicting upgrades
 * @property {number} wastedHp - HP that was double-counted
 */

// =============================================================================
// CONFLICT DETECTION
// =============================================================================

/**
 * Detect conflicts and overlaps in selected upgrades
 * @param {string[]} selectedKeys - Array of upgrade keys
 * @param {Object} car - Car object
 * @returns {UpgradeConflict[]} - Array of detected conflicts
 */
export function detectUpgradeConflicts(selectedKeys, car) {
  const conflicts = [];

  if (!selectedKeys || selectedKeys.length === 0) {
    return conflicts;
  }

  // 1. Check for multiple tunes (only highest should apply)
  const tunes = selectedKeys.filter((key) => TUNE_HIERARCHY[key]);
  if (tunes.length > 1) {
    const highestTune = getHighestPriorityTune(tunes);
    const redundantTunes = tunes.filter((t) => t !== highestTune);

    conflicts.push({
      type: 'redundant',
      severity: 'warning',
      message: `You have multiple tunes selected. Only "${getUpgradeByKey(highestTune)?.name || highestTune}" will apply - ${redundantTunes.map((t) => getUpgradeByKey(t)?.name || t).join(', ')} ${redundantTunes.length === 1 ? 'is' : 'are'} redundant.`,
      affectedUpgrades: redundantTunes,
      wastedHp: calculateWastedTuneHp(redundantTunes, car),
    });
  }

  // 2. Check for stage tune + included mods overlap (engine-type aware)
  // Get engine category for smart overlap detection
  const engineType = car ? getEngineType(car) : 'unknown';
  const engineCategory = getEngineCategory(engineType);

  for (const tuneKey of tunes) {
    // Use engine-type-aware mods list instead of generic list
    const expectedMods = car
      ? getExpectedModsForTune(tuneKey, engineCategory)
      : STAGE_TUNE_INCLUDED_MODS[tuneKey] || [];

    const overlappingMods = expectedMods.filter((mod) => selectedKeys.includes(mod));

    if (overlappingMods.length > 0) {
      const tuneName = getUpgradeByKey(tuneKey)?.name || tuneKey;
      const modNames = overlappingMods.map((m) => getUpgradeByKey(m)?.name || m);

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
    const selectedInSubcat = mods.filter((m) => selectedKeys.includes(m));
    if (selectedInSubcat.length > 1) {
      const modNames = selectedInSubcat.map((m) => getUpgradeByKey(m)?.name || m);
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
  if (selectedKeys.includes('piggyback-tuner') && tunes.some((t) => t !== 'piggyback-tuner')) {
    const flashTune = tunes.find((t) => t !== 'piggyback-tuner');
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

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate HP wasted by redundant tunes
 * @private
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
 * @private
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
 * @private
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
// DISPLAY HELPERS
// =============================================================================

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

  const warnings = conflicts.filter((c) => c.severity === 'warning');
  const infos = conflicts.filter((c) => c.severity === 'info');
  const totalWasted = conflicts.reduce((sum, c) => sum + (c.wastedHp || 0), 0);

  return {
    hasConflicts: true,
    warningCount: warnings.length,
    infoCount: infos.length,
    totalWastedHp: totalWasted,
    messages: conflicts.map((c) => ({
      severity: c.severity,
      message: c.message,
      affectedUpgrades: c.affectedUpgrades,
    })),
  };
}

/**
 * Check if a specific upgrade has conflicts with selected upgrades
 * @param {string} upgradeKey - Upgrade to check
 * @param {string[]} selectedKeys - Currently selected upgrades
 * @param {Object} car - Car object
 * @returns {Object} - Conflict info for this upgrade
 */
export function checkUpgradeCompatibility(upgradeKey, selectedKeys, car) {
  const testSelection = [...selectedKeys, upgradeKey];
  const allConflicts = detectUpgradeConflicts(testSelection, car);

  // Filter to conflicts that involve this upgrade
  const relevantConflicts = allConflicts.filter((c) => c.affectedUpgrades.includes(upgradeKey));

  return {
    isCompatible: relevantConflicts.length === 0,
    conflicts: relevantConflicts,
    hasWarnings: relevantConflicts.some((c) => c.severity === 'warning'),
    hasInfo: relevantConflicts.some((c) => c.severity === 'info'),
  };
}
