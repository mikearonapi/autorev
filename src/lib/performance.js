/**
 * SuperNatural Motorsports - Performance HUB Helpers
 * 
 * This module provides functions for computing Performance HUB scores,
 * applying upgrade deltas, and calculating derived metrics.
 */

import { performanceCategories, scoreLabelMap, mapCarToPerformanceScores } from '../data/performanceCategories.js';
import { genericPackages, upgradeModules, getPackagesForCar, getModulesForCar } from '../data/upgradePackages.js';

/**
 * Get the stock performance scores for a car
 * Uses explicit perf scores if available, otherwise derives them from advisory scores
 * @param {Object} car - Car object
 * @returns {Object} - Performance scores by category key
 */
export function getStockPerformanceScores(car) {
  // If the car has explicit Performance HUB scores, use them
  if (car.perfPowerAccel !== undefined) {
    return {
      powerAccel: car.perfPowerAccel,
      gripCornering: car.perfGripCornering,
      braking: car.perfBraking,
      trackPace: car.perfTrackPace,
      drivability: car.perfDrivability,
      reliabilityHeat: car.perfReliabilityHeat,
      soundEmotion: car.perfSoundEmotion,
    };
  }
  
  // Otherwise, derive from existing scores
  return mapCarToPerformanceScores(car);
}

/**
 * Apply upgrade package/module deltas to stock scores
 * @param {Object} stockScores - Base performance scores
 * @param {Object[]} selectedUpgrades - Array of upgrade packages/modules
 * @returns {Object} - Updated performance scores (clamped to 1-10)
 */
export function applyUpgradeDeltas(stockScores, selectedUpgrades) {
  const upgraded = { ...stockScores };
  
  // Sum all deltas from selected upgrades
  for (const upgrade of selectedUpgrades) {
    if (upgrade.deltas) {
      for (const [key, delta] of Object.entries(upgrade.deltas)) {
        if (upgraded[key] !== undefined && delta !== undefined) {
          upgraded[key] += delta;
        }
      }
    }
  }
  
  // Clamp all scores to 1-10 range
  for (const key of Object.keys(upgraded)) {
    upgraded[key] = Math.max(1, Math.min(10, Math.round(upgraded[key] * 10) / 10));
  }
  
  return upgraded;
}

/**
 * Calculate derived metrics after upgrades
 * @param {Object} car - Car object with specs
 * @param {Object[]} selectedUpgrades - Array of upgrade packages/modules
 * @returns {Object} - Updated hard metrics
 */
export function calculateUpgradedMetrics(car, selectedUpgrades) {
  let totalHpGain = 0;
  let totalZeroToSixtyImprovement = 0;
  let totalBrakingImprovement = 0;
  let totalLateralGImprovement = 0;
  
  // Sum all metric changes from selected upgrades
  for (const upgrade of selectedUpgrades) {
    if (upgrade.metricChanges) {
      totalHpGain += upgrade.metricChanges.hpGain || 0;
      totalZeroToSixtyImprovement += upgrade.metricChanges.zeroToSixtyImprovement || 0;
      totalBrakingImprovement += upgrade.metricChanges.brakingImprovement || 0;
      totalLateralGImprovement += upgrade.metricChanges.lateralGImprovement || 0;
    }
  }
  
  return {
    hp: (car.hp || 0) + totalHpGain,
    zeroToSixty: car.zeroToSixty ? Math.max(0, car.zeroToSixty - totalZeroToSixtyImprovement) : null,
    braking60To0: car.braking60To0 ? Math.max(0, car.braking60To0 - totalBrakingImprovement) : null,
    lateralG: car.lateralG ? car.lateralG + totalLateralGImprovement : null,
    // Pass through unchanged metrics
    torque: car.torque,
    curbWeight: car.curbWeight,
    quarterMile: car.quarterMile,
    powerToWeight: car.curbWeight && car.hp 
      ? ((car.hp + totalHpGain) / (car.curbWeight / 1000)).toFixed(1)
      : null,
  };
}

/**
 * Get the full performance profile for a car with selected upgrades
 * @param {Object} car - Car object
 * @param {string[]} selectedUpgradeKeys - Array of upgrade keys to apply
 * @returns {Object} - Complete performance profile
 */
export function getPerformanceProfile(car, selectedUpgradeKeys = []) {
  const stockScores = getStockPerformanceScores(car);
  
  // Get the actual upgrade objects from keys
  const allUpgrades = [...genericPackages, ...upgradeModules];
  const selectedUpgrades = selectedUpgradeKeys
    .map(key => allUpgrades.find(u => u.key === key))
    .filter(Boolean);
  
  const upgradedScores = selectedUpgradeKeys.length > 0
    ? applyUpgradeDeltas(stockScores, selectedUpgrades)
    : stockScores;
  
  const stockMetrics = {
    hp: car.hp,
    torque: car.torque,
    zeroToSixty: car.zeroToSixty,
    braking60To0: car.braking60To0,
    lateralG: car.lateralG,
    curbWeight: car.curbWeight,
    quarterMile: car.quarterMile,
    powerToWeight: car.curbWeight && car.hp 
      ? (car.hp / (car.curbWeight / 1000)).toFixed(1)
      : null,
  };
  
  const upgradedMetrics = selectedUpgradeKeys.length > 0
    ? calculateUpgradedMetrics(car, selectedUpgrades)
    : stockMetrics;
  
  return {
    car,
    stockScores,
    upgradedScores,
    stockMetrics,
    upgradedMetrics,
    selectedUpgrades,
    hasUpgrades: selectedUpgradeKeys.length > 0,
  };
}

/**
 * Get score comparison data for bar chart visualization
 * @param {Object} stockScores - Stock performance scores
 * @param {Object} upgradedScores - Upgraded performance scores
 * @returns {Object[]} - Array of comparison data for each category
 */
export function getScoreComparison(stockScores, upgradedScores) {
  return performanceCategories.map(cat => ({
    key: cat.key,
    label: cat.label,
    shortLabel: cat.shortLabel,
    description: cat.description,
    icon: cat.icon,
    color: cat.color,
    stockScore: stockScores[cat.key] || 5,
    upgradedScore: upgradedScores[cat.key] || stockScores[cat.key] || 5,
    stockLabel: getScoreLabel(stockScores[cat.key]),
    upgradedLabel: getScoreLabel(upgradedScores[cat.key]),
    delta: (upgradedScores[cat.key] || 0) - (stockScores[cat.key] || 0),
    improved: (upgradedScores[cat.key] || 0) > (stockScores[cat.key] || 0),
  }));
}

/**
 * Get score label text for a numeric score
 * @param {number} score 
 * @returns {string}
 */
export function getScoreLabel(score) {
  if (!score) return 'Average';
  const roundedScore = Math.round(score);
  return scoreLabelMap[roundedScore] || 'Average';
}

/**
 * Calculate total estimated cost for selected upgrades
 * @param {Object[]} selectedUpgrades - Array of upgrade objects
 * @returns {Object} - Cost range { low, high, display }
 */
export function calculateTotalCost(selectedUpgrades) {
  let totalLow = 0;
  let totalHigh = 0;
  
  for (const upgrade of selectedUpgrades) {
    totalLow += upgrade.estimatedCostLow || 0;
    totalHigh += upgrade.estimatedCostHigh || 0;
  }
  
  const formatCost = (val) => {
    if (val >= 1000) {
      return `$${(val / 1000).toFixed(0)}K`;
    }
    return `$${val}`;
  };
  
  return {
    low: totalLow,
    high: totalHigh,
    display: totalLow > 0 ? `${formatCost(totalLow)} - ${formatCost(totalHigh)}` : 'Stock',
  };
}

/**
 * Get all applicable upgrades for a car, organized by tier/category
 * @param {Object} car - Car object
 * @returns {Object} - Organized upgrades { packages, modules }
 */
export function getAvailableUpgrades(car) {
  const packages = getPackagesForCar(car.slug, car.category);
  const modules = getModulesForCar(car.slug, car.category);
  
  // Group modules by category
  const modulesByCategory = {};
  for (const mod of modules) {
    const cat = mod.category || 'other';
    if (!modulesByCategory[cat]) {
      modulesByCategory[cat] = [];
    }
    modulesByCategory[cat].push(mod);
  }
  
  return {
    packages,
    modules,
    modulesByCategory,
  };
}

/**
 * Get a narrative summary of what changed with selected upgrades
 * @param {Object[]} selectedUpgrades - Array of upgrade objects
 * @returns {string} - Human-readable summary
 */
export function getUpgradeSummary(selectedUpgrades) {
  if (selectedUpgrades.length === 0) {
    return 'Factory configuration with no modifications.';
  }
  
  // Find the main package if any
  const mainPackage = selectedUpgrades.find(u => u.type === 'package');
  const modules = selectedUpgrades.filter(u => u.type === 'module');
  
  if (mainPackage) {
    const baseDesc = mainPackage.description;
    if (modules.length > 0) {
      const moduleNames = modules.map(m => m.name).join(', ');
      return `${baseDesc} Plus additional modules: ${moduleNames}.`;
    }
    return baseDesc;
  }
  
  // Custom module combination
  const moduleNames = modules.map(m => m.name).join(', ');
  return `Custom build with: ${moduleNames}.`;
}

/**
 * Check if a car supports Performance HUB (has enough data)
 * @param {Object} car - Car object
 * @returns {boolean}
 */
export function supportsPerformanceHub(car) {
  // Requires at least HP and either explicit perf scores or advisory scores
  return car && car.hp && (car.track || car.perfTrackPace);
}

/**
 * Export performanceCategories for use in components
 */
export { performanceCategories };

export default {
  getStockPerformanceScores,
  applyUpgradeDeltas,
  calculateUpgradedMetrics,
  getPerformanceProfile,
  getScoreComparison,
  getScoreLabel,
  calculateTotalCost,
  getAvailableUpgrades,
  getUpgradeSummary,
  supportsPerformanceHub,
  performanceCategories,
};

