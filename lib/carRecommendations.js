/**
 * Car Recommendations Helper Functions
 * 
 * Helper functions to work with car-specific upgrade recommendations
 * stored in the database (cars.upgrade_recommendations JSONB column).
 * 
 * Schema:
 * {
 *   primaryFocus: 'cooling' | 'handling' | 'braking' | 'power' | 'sound',
 *   focusReason: string,
 *   coreUpgrades: string[],      // Upgrade keys that address the primary weakness
 *   enhancementUpgrades: string[], // Secondary recommended upgrades
 *   platformStrengths: string[], // What the car does well
 *   watchOuts: string[]          // Known issues or considerations
 * }
 */

import { getUpgradeByKey } from './upgrades.js';

/**
 * Focus area labels for display
 */
export const focusLabels = {
  cooling: 'Cooling & Heat Management',
  handling: 'Handling & Chassis',
  braking: 'Braking Performance',
  power: 'Power & Engine',
  sound: 'Sound & Exhaust',
};

/**
 * Focus area icons (for UI consistency)
 */
export const focusIcons = {
  cooling: 'thermometer',
  handling: 'tire',
  braking: 'brake',
  power: 'bolt',
  sound: 'sound',
};

/**
 * Get the display label for a focus area
 * @param {string} focus - Focus key (cooling, handling, etc.)
 * @returns {string} - Human-readable label
 */
export function getFocusLabel(focus) {
  return focusLabels[focus] || focus;
}

/**
 * Get the icon name for a focus area
 * @param {string} focus - Focus key
 * @returns {string} - Icon key for the Icons component
 */
export function getFocusIcon(focus) {
  return focusIcons[focus] || 'flag';
}

/**
 * Check if a car has upgrade recommendations
 * @param {Object} car - Car object with upgradeRecommendations field
 * @returns {boolean}
 */
export function hasRecommendations(car) {
  return car?.upgradeRecommendations?.primaryFocus != null;
}

/**
 * Get the primary focus for a car
 * @param {Object} car - Car object
 * @returns {Object|null} - { key, label, reason } or null
 */
export function getPrimaryFocus(car) {
  const recs = car?.upgradeRecommendations;
  if (!recs?.primaryFocus) return null;
  
  return {
    key: recs.primaryFocus,
    label: getFocusLabel(recs.primaryFocus),
    icon: getFocusIcon(recs.primaryFocus),
    reason: recs.focusReason || null,
  };
}

/**
 * Get core upgrades with full details
 * @param {Object} car - Car object
 * @returns {Object[]} - Array of upgrade objects with details
 */
export function getCoreUpgrades(car) {
  const recs = car?.upgradeRecommendations;
  if (!recs?.coreUpgrades) return [];
  
  return recs.coreUpgrades
    .map(key => {
      const upgrade = getUpgradeByKey(key);
      return upgrade ? { ...upgrade, key } : null;
    })
    .filter(Boolean);
}

/**
 * Get enhancement (secondary) upgrades with full details
 * @param {Object} car - Car object
 * @returns {Object[]} - Array of upgrade objects with details
 */
export function getEnhancementUpgrades(car) {
  const recs = car?.upgradeRecommendations;
  if (!recs?.enhancementUpgrades) return [];
  
  return recs.enhancementUpgrades
    .map(key => {
      const upgrade = getUpgradeByKey(key);
      return upgrade ? { ...upgrade, key } : null;
    })
    .filter(Boolean);
}

/**
 * Get all recommended upgrade keys (core + enhancement)
 * @param {Object} car - Car object
 * @returns {string[]} - Array of upgrade keys
 */
export function getAllRecommendedKeys(car) {
  const recs = car?.upgradeRecommendations;
  if (!recs) return [];
  
  return [
    ...(recs.coreUpgrades || []),
    ...(recs.enhancementUpgrades || []),
  ];
}

/**
 * Get platform strengths
 * @param {Object} car - Car object
 * @returns {string[]} - Array of strength descriptions
 */
export function getPlatformStrengths(car) {
  return car?.upgradeRecommendations?.platformStrengths || [];
}

/**
 * Get watch-outs (known issues/concerns)
 * @param {Object} car - Car object
 * @returns {string[]} - Array of concern descriptions
 */
export function getWatchOuts(car) {
  return car?.upgradeRecommendations?.watchOuts || [];
}

/**
 * Check which recommended upgrades are already selected
 * @param {Object} car - Car object
 * @param {string[]} selectedKeys - Currently selected upgrade keys
 * @returns {Object} - { selected: string[], notSelected: string[], progress: number }
 */
export function getRecommendationProgress(car, selectedKeys = []) {
  const allRecommended = getAllRecommendedKeys(car);
  if (allRecommended.length === 0) {
    return { selected: [], notSelected: [], progress: 0 };
  }
  
  const selectedSet = new Set(selectedKeys);
  const selected = allRecommended.filter(key => selectedSet.has(key));
  const notSelected = allRecommended.filter(key => !selectedSet.has(key));
  const progress = Math.round((selected.length / allRecommended.length) * 100);
  
  return { selected, notSelected, progress };
}

/**
 * Get recommendation summary for display
 * @param {Object} car - Car object
 * @param {string[]} selectedKeys - Currently selected upgrade keys
 * @returns {Object} - Full recommendation data for UI
 */
export function getRecommendationSummary(car, selectedKeys = []) {
  if (!hasRecommendations(car)) {
    return null;
  }
  
  const primaryFocus = getPrimaryFocus(car);
  const coreUpgrades = getCoreUpgrades(car);
  const enhancementUpgrades = getEnhancementUpgrades(car);
  const strengths = getPlatformStrengths(car);
  const watchOuts = getWatchOuts(car);
  const progress = getRecommendationProgress(car, selectedKeys);
  
  return {
    carName: car.name,
    primaryFocus,
    coreUpgrades,
    enhancementUpgrades,
    strengths,
    watchOuts,
    progress,
  };
}

export default {
  hasRecommendations,
  getPrimaryFocus,
  getCoreUpgrades,
  getEnhancementUpgrades,
  getAllRecommendedKeys,
  getPlatformStrengths,
  getWatchOuts,
  getRecommendationProgress,
  getRecommendationSummary,
  getFocusLabel,
  getFocusIcon,
};












