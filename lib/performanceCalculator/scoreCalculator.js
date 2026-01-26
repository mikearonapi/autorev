/**
 * AutoRev - Score Calculator
 * 
 * Calculate performance HUB scores for stock and upgraded cars.
 * Consolidated from lib/performance.js
 * 
 * @module lib/performanceCalculator/scoreCalculator
 */

import { calculateUpgradedMetrics } from './metricsCalculator.js';
import { performanceCategories, scoreLabelMap, mapCarToPerformanceScores } from '../../data/performanceCategories.js';
import { genericPackages, upgradeModules } from '../../data/upgradePackages.js';

/**
 * Get the stock performance scores for a car.
 * ALWAYS calculates from hard metrics using the recalibrated formulas.
 * This ensures consistent scoring and leaves headroom for upgrades.
 * 
 * Scoring Philosophy:
 * - Stock cars score 5-8 (depending on actual performance)
 * - Scores 8.5-10 reserved for modified builds
 * - This allows upgrades to show meaningful visual improvement
 * 
 * @param {Object} car - Car object
 * @returns {Object} - Performance scores by category key
 */
export function getStockPerformanceScores(car) {
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
 * Validate performance scores for consistency
 * Logs warnings if scores seem inconsistent with hard metrics
 * @param {Object} car - Car object
 * @param {Object} scores - Performance scores to validate
 * @returns {Object} - Validation result with any warnings
 */
export function validatePerformanceScores(car, scores) {
  const warnings = [];
  
  // Validate power score against 0-60 time
  if (car.zeroToSixty && scores.powerAccel) {
    const expectedPower = Math.round(11 - (car.zeroToSixty * 1.5));
    if (Math.abs(scores.powerAccel - expectedPower) > 2) {
      warnings.push(`Power score (${scores.powerAccel}) may not match 0-60 time (${car.zeroToSixty}s)`);
    }
  }
  
  // Validate grip score against lateral G
  if (car.lateralG && scores.gripCornering) {
    const expectedGrip = Math.round((car.lateralG - 0.75) * 20);
    if (Math.abs(scores.gripCornering - expectedGrip) > 2) {
      warnings.push(`Grip score (${scores.gripCornering}) may not match lateral G (${car.lateralG}g)`);
    }
  }
  
  // Validate braking score against 60-0 distance
  if (car.braking60To0 && scores.braking) {
    const expectedBraking = Math.round(22 - (car.braking60To0 / 5));
    if (Math.abs(scores.braking - expectedBraking) > 2) {
      warnings.push(`Braking score (${scores.braking}) may not match 60-0 distance (${car.braking60To0}ft)`);
    }
  }
  
  return {
    isValid: warnings.length === 0,
    warnings,
    scores
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
  
  // Guard: ensure selectedUpgradeKeys is always an array
  const safeUpgradeKeys = Array.isArray(selectedUpgradeKeys) ? selectedUpgradeKeys : [];
  
  // Get the actual upgrade objects from keys
  const allUpgrades = [...genericPackages, ...upgradeModules];
  const selectedUpgrades = safeUpgradeKeys
    .map(key => allUpgrades.find(u => u.key === key))
    .filter(Boolean);
  
  const upgradedScores = safeUpgradeKeys.length > 0
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
  
  const upgradedMetrics = safeUpgradeKeys.length > 0
    ? calculateUpgradedMetrics(car, selectedUpgrades)
    : stockMetrics;
  
  return {
    car,
    stockScores,
    upgradedScores,
    stockMetrics,
    upgradedMetrics,
    selectedUpgrades,
    hasUpgrades: safeUpgradeKeys.length > 0,
  };
}

/**
 * Calculate the average score across all categories
 * @param {Object} scores - Performance scores by category
 * @returns {number} - Average score (1-10)
 */
export function calculateAverageScore(scores) {
  const values = Object.values(scores).filter(v => typeof v === 'number');
  if (values.length === 0) return 5;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

/**
 * Get top performance categories for a car
 * @param {Object} scores - Performance scores
 * @param {number} count - Number of top categories to return
 * @returns {Object[]} - Top categories with scores
 */
export function getTopCategories(scores, count = 3) {
  return performanceCategories
    .map(cat => ({
      ...cat,
      score: scores[cat.key] || 5,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

/**
 * Get categories that would improve most with upgrades
 * @param {Object} stockScores - Stock scores
 * @param {Object[]} availableUpgrades - Available upgrades
 * @returns {Object[]} - Categories with potential improvement
 */
export function getImprovementOpportunities(stockScores, availableUpgrades) {
  const opportunities = [];
  
  for (const cat of performanceCategories) {
    const stockScore = stockScores[cat.key] || 5;
    
    // Find upgrades that improve this category
    const relevantUpgrades = availableUpgrades.filter(u => 
      u.deltas && u.deltas[cat.key] && u.deltas[cat.key] > 0
    );
    
    if (relevantUpgrades.length > 0) {
      const maxDelta = Math.max(...relevantUpgrades.map(u => u.deltas[cat.key]));
      opportunities.push({
        category: cat,
        stockScore,
        maxPotential: Math.min(10, stockScore + maxDelta),
        improvementPotential: maxDelta,
        upgradeCount: relevantUpgrades.length,
      });
    }
  }
  
  return opportunities.sort((a, b) => b.improvementPotential - a.improvementPotential);
}
