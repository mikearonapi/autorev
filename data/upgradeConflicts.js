/**
 * Upgrade Conflicts - Real conflict detection
 *
 * These functions check for conflicts between upgrade modules:
 * - Mutually exclusive groups (suspension types, brake pads, camshafts, FI kits)
 * - Multiple tunes (only highest priority applies)
 * - Stage tune overlap with hardware mods (INFO ONLY - not a replacement trigger)
 * - Piggyback vs flash tune conflicts
 * - Multiple exhaust mods in same subcategory
 *
 * IMPORTANT: Conflict types determine behavior:
 * - 'exclusive': Hard conflict - MUST replace (mutually exclusive items)
 * - 'redundant': Should replace (e.g., lower tune when adding higher)
 * - 'upgrade': Should replace (e.g., lower tunes when upgrading)
 * - 'incompatible': Hard conflict - MUST replace (e.g., piggyback vs flash)
 * - 'overlap': INFO ONLY - does NOT trigger replacement, just shows warning
 */

import {
  detectUpgradeConflicts,
  TUNE_HIERARCHY,
  STAGE_TUNE_INCLUDED_MODS,
  getExclusiveConflicts,
  getMutuallyExclusiveGroup,
} from '@/lib/performanceCalculator';
import { getUpgradeByKey } from '@/lib/upgrades.js';

/**
 * Check if an upgrade conflicts with currently selected upgrades
 * @param {string} upgradeKey - The upgrade to check
 * @param {string[]} selectedModules - Currently selected upgrades
 * @param {Object} car - Optional car object for context
 * @returns {Object|null} - Conflict info or null if no conflict
 */
export function checkUpgradeConflict(upgradeKey, selectedModules, _car = null) {
  // 1. Check mutually exclusive groups FIRST (suspension, brake pads, camshafts, FI kits)
  // These are hard conflicts that MUST be resolved
  const exclusiveConflicts = getExclusiveConflicts(upgradeKey, selectedModules);
  if (exclusiveConflicts.length > 0) {
    const group = getMutuallyExclusiveGroup(upgradeKey);
    const conflictNames = exclusiveConflicts
      .map((key) => getUpgradeByKey(key)?.name || key)
      .join(' and ');

    // Create user-friendly group descriptions
    const groupDescriptions = {
      suspension: 'suspension setup',
      brakePads: 'brake pad compound',
      camshafts: 'camshaft profile',
      forcedInductionKit: 'forced induction kit',
      rearExhaust: 'rear exhaust section',
    };
    const groupDesc = groupDescriptions[group?.groupName] || 'upgrade';

    return {
      type: 'exclusive',
      severity: 'warning',
      message: `Only one ${groupDesc} can be selected. "${conflictNames}" will be replaced.`,
      conflictsWith: exclusiveConflicts,
      isHardConflict: true, // Flag for UI to know this triggers replacement
    };
  }

  // 2. Tune hierarchy conflicts
  if (TUNE_HIERARCHY[upgradeKey]) {
    const existingTunes = selectedModules.filter((key) => TUNE_HIERARCHY[key]);
    if (existingTunes.length > 0) {
      const newPriority = TUNE_HIERARCHY[upgradeKey]?.priority || 0;
      const highestExisting = existingTunes.reduce((highest, key) => {
        const priority = TUNE_HIERARCHY[key]?.priority || 0;
        return priority > (TUNE_HIERARCHY[highest]?.priority || 0) ? key : highest;
      }, existingTunes[0]);
      const highestPriority = TUNE_HIERARCHY[highestExisting]?.priority || 0;

      if (newPriority <= highestPriority) {
        return {
          type: 'redundant',
          severity: 'warning',
          message: `This tune is less comprehensive than your current tune. Consider removing the lower-tier tune.`,
          conflictsWith: [highestExisting],
          isHardConflict: true,
        };
      } else {
        return {
          type: 'upgrade',
          severity: 'info',
          message: `This tune supersedes your current tune(s). The lower-tier tune(s) will become redundant.`,
          conflictsWith: existingTunes,
          isHardConflict: true,
        };
      }
    }
  }

  // 3. Piggyback + flash tune conflict
  if (upgradeKey === 'piggyback-tuner') {
    const flashTunes = selectedModules.filter(
      (key) => TUNE_HIERARCHY[key] && key !== 'piggyback-tuner'
    );
    if (flashTunes.length > 0) {
      return {
        type: 'incompatible',
        severity: 'warning',
        message: `Piggyback tuners typically conflict with flash ECU tunes. Choose one approach.`,
        conflictsWith: flashTunes,
        isHardConflict: true,
      };
    }
  }

  // 4. Check if this mod is "expected" by an existing stage tune
  // IMPORTANT: This is INFO ONLY - it does NOT trigger replacement!
  // Stage tunes BUILD ON hardware mods, they don't conflict with them.
  // The tune calibration assumes the hardware is installed.
  const stageTunes = selectedModules.filter((key) => STAGE_TUNE_INCLUDED_MODS[key]);
  for (const tuneKey of stageTunes) {
    if (STAGE_TUNE_INCLUDED_MODS[tuneKey]?.includes(upgradeKey)) {
      return {
        type: 'overlap',
        severity: 'info',
        message: `Your ${tuneKey.replace('-', ' ')} is calibrated for this mod. HP gains won't fully stack, but you can still add it.`,
        conflictsWith: [], // Empty! This is info only, no replacement
        isHardConflict: false, // Explicitly mark as NOT a hard conflict
      };
    }
  }

  return null;
}

/**
 * Resolve conflicts by returning the new selection
 * For tunes, removes lower-priority tunes when adding higher-priority one
 * @param {string} newModule - The new module being added
 * @param {string[]} currentModules - Currently selected modules
 * @param {Object} options - Resolution options
 * @param {boolean} options.autoRemoveLowerTunes - If true, auto-remove lower priority tunes
 * @returns {string[]} Updated module list
 */
export function resolveConflicts(newModule, currentModules, options = {}) {
  const { autoRemoveLowerTunes = false } = options;

  if (currentModules.includes(newModule)) {
    return currentModules;
  }

  let updatedModules = [...currentModules];

  // If adding a tune and auto-resolve is enabled
  if (autoRemoveLowerTunes && TUNE_HIERARCHY[newModule]) {
    const newPriority = TUNE_HIERARCHY[newModule]?.priority || 0;

    // Remove any tunes with lower or equal priority
    updatedModules = updatedModules.filter((key) => {
      if (!TUNE_HIERARCHY[key]) return true;
      const existingPriority = TUNE_HIERARCHY[key]?.priority || 0;
      return existingPriority > newPriority;
    });
  }

  return [...updatedModules, newModule];
}

/**
 * Get list of upgrades that conflict with the given upgrade
 * @param {string} upgradeKey - The upgrade to check
 * @returns {string[]} - Array of conflicting upgrade keys
 */
export function getConflictingUpgrades(upgradeKey) {
  const conflicts = [];

  // Tunes conflict with each other (same-tier or lower)
  if (TUNE_HIERARCHY[upgradeKey]) {
    const thisPriority = TUNE_HIERARCHY[upgradeKey]?.priority || 0;

    for (const [tuneKey, tuneInfo] of Object.entries(TUNE_HIERARCHY)) {
      if (tuneKey !== upgradeKey && tuneInfo.priority <= thisPriority) {
        conflicts.push(tuneKey);
      }
    }

    // Piggyback conflicts with all flash tunes
    if (upgradeKey === 'piggyback-tuner') {
      conflicts.push(...Object.keys(TUNE_HIERARCHY).filter((k) => k !== 'piggyback-tuner'));
    }
  }

  return conflicts;
}

/**
 * Get all conflicts for a set of selected upgrades
 * Wrapper around the calculator's detectUpgradeConflicts
 * @param {string[]} selectedModules - Currently selected upgrades
 * @param {Object} car - Car object
 * @returns {Object[]} - Array of conflict objects
 */
export function getAllConflicts(selectedModules, car = null) {
  return detectUpgradeConflicts(selectedModules, car);
}
