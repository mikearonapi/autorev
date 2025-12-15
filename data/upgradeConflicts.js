/**
 * Upgrade Conflicts - Minimal stub
 * 
 * These functions check for conflicts between upgrade modules.
 * Currently returns no conflicts - can be expanded if conflict logic is needed.
 */

/**
 * Check if an upgrade conflicts with currently selected upgrades
 * @param {string} upgradeKey - The upgrade to check
 * @param {string[]} selectedModules - Currently selected upgrades
 * @returns {null} No conflict
 */
export function checkUpgradeConflict(upgradeKey, selectedModules) {
  return null;
}

/**
 * Resolve conflicts by returning the new selection
 * @param {string} newModule - The new module being added
 * @param {string[]} currentModules - Currently selected modules
 * @returns {string[]} Updated module list
 */
export function resolveConflicts(newModule, currentModules) {
  if (currentModules.includes(newModule)) {
    return currentModules;
  }
  return [...currentModules, newModule];
}

/**
 * Get list of upgrades that conflict with the given upgrade
 * @param {string} upgradeKey - The upgrade to check
 * @returns {string[]} Empty array - no conflicts defined
 */
export function getConflictingUpgrades(upgradeKey) {
  return [];
}


