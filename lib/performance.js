/**
 * AutoRev - Performance HUB Helpers
 * 
 * This module provides functions for computing Performance HUB scores,
 * applying upgrade deltas, and calculating derived metrics.
 * 
 * SOURCE OF TRUTH: For performance calculations, see lib/performanceCalculator/
 * This file re-exports calculation functions from there for backwards compatibility.
 * 
 * @see docs/SOURCE_OF_TRUTH.md
 */

import { performanceCategories, scoreLabelMap, mapCarToPerformanceScores } from '../data/performanceCategories.js';
import { 
  genericPackages, 
  upgradeModules, 
  getPackagesForCar, 
  getModulesForCar,
  getEngineType,
  getHpGainMultiplier,
  isUpgradeCompatible,
  calculateRealisticHpGain,
  getPlatformDownpipeGain
} from '../data/upgradePackages.js';
import {
  getCostTier,
  getAdjustedUpgradeCost,
  formatUpgradeCost,
  platformCostMultipliers,
} from '../data/upgradePricing.js';

// =============================================================================
// RE-EXPORTS FROM SOURCE OF TRUTH: lib/performanceCalculator/
// For backwards compatibility - new code should import directly from performanceCalculator
// =============================================================================
import {
  STAGE_TUNE_INCLUDED_MODS,
  TUNE_OVERLAP_MODIFIER,
} from './performanceCalculator/constants.js';

// Re-export for backwards compatibility
export { STAGE_TUNE_INCLUDED_MODS } from './performanceCalculator/constants.js';

/**
 * Get the stock performance scores for a car
 * ALWAYS calculates from hard metrics using the recalibrated formulas
 * This ensures consistent scoring and leaves headroom for upgrades
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
  // ALWAYS use the calculated scores from mapCarToPerformanceScores
  // The old manual perfXXX scores were calibrated to give 9-10 to stock cars,
  // which doesn't leave room for upgrades to show improvement
  return mapCarToPerformanceScores(car);
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

// STAGE_TUNE_INCLUDED_MODS now imported from performanceCalculator/constants.js (source of truth)

/**
 * Calculate derived metrics after upgrades
 * Uses engine-type-aware HP calculations for realistic gains
 * @param {Object} car - Car object with specs
 * @param {Object[]} selectedUpgrades - Array of upgrade packages/modules
 * @returns {Object} - Updated hard metrics
 */
export function calculateUpgradedMetrics(car, selectedUpgrades) {
  let totalHpGain = 0;
  let totalZeroToSixtyImprovement = 0;
  let totalBrakingImprovement = 0;
  let totalLateralGImprovement = 0;
  
  const engineType = getEngineType(car);
  
  // Detect which tune is active (highest stage wins) to check for overlap
  const activeTune = selectedUpgrades.find(u => u.key === 'stage3-tune')?.key ||
                     selectedUpgrades.find(u => u.key === 'stage2-tune')?.key ||
                     selectedUpgrades.find(u => u.key === 'stage1-tune')?.key;
  
  // Sum all metric changes from selected upgrades with engine-aware scaling
  for (const upgrade of selectedUpgrades) {
    if (upgrade.metricChanges) {
      // Use engine-type-aware HP calculation for forced induction and power mods
      if (upgrade.metricChanges.hpGain) {
        const multiplier = getHpGainMultiplier(car, upgrade);
        
        // Check if this mod is "expected" by the active tune (avoid double-counting)
        // e.g., Stage 3 tune is calibrated assuming turbo upgrade + intercooler are installed
        const isExpectedByTune = activeTune && 
          STAGE_TUNE_INCLUDED_MODS[activeTune]?.includes(upgrade.key);
        
        // Overlap modifier: reduced if tune already accounts for this hardware
        const overlapModifier = isExpectedByTune ? TUNE_OVERLAP_MODIFIER : 1.0;
        
        // Special handling for specific car + upgrade combos we know well
        if (car.slug === 'shelby-gt350' && upgrade.key === 'supercharger-roots') {
          // Whipple on GT350 Voodoo = ~280 HP gain (526 -> 800+ HP)
          totalHpGain += 280;
        } else if (car.slug === 'shelby-gt350' && upgrade.key === 'supercharger-centrifugal') {
          // ProCharger on GT350 = ~200 HP gain (526 -> 720+ HP)
          totalHpGain += 200;
        } else if (car.slug === 'shelby-gt350' && upgrade.key === 'turbo-kit-twin') {
          // Twin turbo on GT350 = ~350 HP gain (526 -> 875+ HP)
          totalHpGain += 350;
        } else if (car.slug === 'shelby-gt500' && upgrade.key === 'pulley-tune-sc') {
          // GT500 pulley + tune = ~100 HP (760 -> 860+ HP)
          totalHpGain += 100;
        } else if (upgrade.key === 'ultimatePower' || upgrade.tier === 'ultimatePower') {
          // Ultimate Power package - scale by engine type
          if (engineType === 'NA V8') {
            totalHpGain += 250; // Typical supercharger on NA V8
          } else if (engineType.includes('Turbo')) {
            totalHpGain += 150; // Turbo upgrade
          } else if (engineType.includes('SC')) {
            totalHpGain += 100; // SC upgrade (pulley, etc)
          } else {
            totalHpGain += upgrade.metricChanges.hpGain * multiplier;
          }
        } else if (upgrade.key === 'downpipe') {
          // Platform-specific downpipe gains (forum-validated)
          // Some platforms (RS5 2.9T) have efficient factory DPs with minimal gain
          // Others (B58, Evo X) have restrictive factory DPs with good gains
          totalHpGain += Math.round(getPlatformDownpipeGain(car) * overlapModifier);
        } else {
          // Standard calculation with multiplier and overlap modifier
          totalHpGain += Math.round(upgrade.metricChanges.hpGain * multiplier * overlapModifier);
        }
      }
      
      // 0-60 improvement scales with HP gains relative to weight
      if (upgrade.metricChanges.zeroToSixtyImprovement) {
        let zeroToSixtyGain = upgrade.metricChanges.zeroToSixtyImprovement;
        // More HP = more acceleration improvement
        if (totalHpGain > 200) {
          zeroToSixtyGain *= 1.5;
        } else if (totalHpGain > 100) {
          zeroToSixtyGain *= 1.2;
        }
        totalZeroToSixtyImprovement += zeroToSixtyGain;
      }
      
      totalBrakingImprovement += upgrade.metricChanges.brakingImprovement || 0;
      totalLateralGImprovement += upgrade.metricChanges.lateralGImprovement || 0;
    }
  }
  
  // Calculate new HP
  const newHp = (car.hp || 0) + totalHpGain;
  
  // Calculate 0-60 based on HP gain (if not explicitly calculated)
  // Rule of thumb: 10% HP gain = ~0.2s faster 0-60 for a ~500 HP car
  let zeroToSixtyReduction = totalZeroToSixtyImprovement;
  if (totalHpGain > 0 && zeroToSixtyReduction === 0 && car.zeroToSixty) {
    // Estimate 0-60 improvement from HP gain
    const hpPercentGain = totalHpGain / (car.hp || 400);
    zeroToSixtyReduction = car.zeroToSixty * hpPercentGain * 0.4; // Conservative estimate
  }
  
  return {
    hp: newHp,
    zeroToSixty: car.zeroToSixty ? Math.max(2.0, car.zeroToSixty - zeroToSixtyReduction) : null,
    braking60To0: car.braking60To0 ? Math.max(70, car.braking60To0 - totalBrakingImprovement) : null,
    lateralG: car.lateralG ? Math.min(1.6, car.lateralG + totalLateralGImprovement) : null,
    // Pass through unchanged metrics
    torque: car.torque,
    curbWeight: car.curbWeight,
    quarterMile: car.quarterMile,
    powerToWeight: car.curbWeight && newHp 
      ? (newHp / (car.curbWeight / 1000)).toFixed(1)
      : null,
    // Include engine type for display purposes
    engineType: engineType,
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
 * Now supports brand-specific pricing using platformCostTier
 * Returns confidence scoring based on how prices were determined
 * 
 * @param {Object[]} selectedUpgrades - Array of upgrade objects
 * @param {Object} [car] - Optional car object for brand-specific pricing
 * @returns {Object} - Cost range with confidence info
 */
export function calculateTotalCost(selectedUpgrades, car = null) {
  let totalLow = 0;
  let totalHigh = 0;
  let verifiedCount = 0;
  let highConfidenceCount = 0;
  let estimatedCount = 0;
  
  for (const upgrade of selectedUpgrades) {
    if (car) {
      // Use brand-specific pricing if car is provided
      const adjusted = getAdjustedUpgradeCost(car, upgrade);
      totalLow += adjusted.low || 0;
      totalHigh += adjusted.high || 0;
      
      // Track confidence levels
      if (adjusted.confidence === 'verified') verifiedCount++;
      else if (adjusted.confidence === 'high') highConfidenceCount++;
      else estimatedCount++;
    } else {
      // Fallback to generic pricing
      totalLow += upgrade.estimatedCostLow || 0;
      totalHigh += upgrade.estimatedCostHigh || 0;
      estimatedCount++;
    }
  }
  
  const formatCost = (val) => {
    if (val >= 1000) {
      return `$${(val / 1000).toFixed(0)}K`;
    }
    return `$${val}`;
  };
  
  // Get tier info if car provided
  const tier = car ? getCostTier(car) : 'mainstream';
  const tierConfig = platformCostMultipliers[tier] || platformCostMultipliers.mainstream;
  
  // Calculate overall confidence
  const totalUpgrades = selectedUpgrades.length;
  let overallConfidence = 'estimated';
  let confidencePercent = 0;
  
  if (totalUpgrades > 0) {
    const highOrVerified = verifiedCount + highConfidenceCount;
    confidencePercent = Math.round((highOrVerified / totalUpgrades) * 100);
    
    if (verifiedCount === totalUpgrades) {
      overallConfidence = 'verified';
    } else if (highOrVerified >= totalUpgrades * 0.7) {
      overallConfidence = 'high';
    } else {
      overallConfidence = 'estimated';
    }
  }
  
  return {
    low: totalLow,
    high: totalHigh,
    display: totalLow > 0 ? `${formatCost(totalLow)} - ${formatCost(totalHigh)}` : 'Stock',
    tier,
    tierLabel: tier.charAt(0).toUpperCase() + tier.slice(1),
    tierDescription: tierConfig.description,
    // Confidence info
    confidence: overallConfidence,
    confidencePercent,
    verifiedCount,
    highConfidenceCount,
    estimatedCount,
  };
}

/**
 * Get all applicable upgrades for a car, organized by tier/category
 * Filters modules by engine type compatibility
 * Includes brand-specific pricing information
 * @param {Object} car - Car object
 * @returns {Object} - Organized upgrades { packages, modules, engineType, costTier, costTierLabel }
 */
export function getAvailableUpgrades(car) {
  const packages = getPackagesForCar(car.slug, car.category);
  // Pass full car object to enable engine type filtering
  const modules = getModulesForCar(car, car.category);
  
  // Get engine type for UI display
  const engineType = getEngineType(car);
  
  // Get cost tier for pricing
  const costTier = getCostTier(car);
  const tierConfig = platformCostMultipliers[costTier] || platformCostMultipliers.mainstream;
  
  // Add adjusted pricing to each package
  const packagesWithPricing = packages.map(pkg => ({
    ...pkg,
    adjustedCost: getAdjustedUpgradeCost(car, pkg),
  }));
  
  // Add adjusted pricing to each module
  const modulesWithPricing = modules.map(mod => ({
    ...mod,
    adjustedCost: getAdjustedUpgradeCost(car, mod),
  }));
  
  // Group modules by category
  const modulesByCategory = {};
  for (const mod of modulesWithPricing) {
    const cat = mod.category || 'other';
    if (!modulesByCategory[cat]) {
      modulesByCategory[cat] = [];
    }
    modulesByCategory[cat].push(mod);
  }
  
  return {
    packages: packagesWithPricing,
    modules: modulesWithPricing,
    modulesByCategory,
    engineType,
    costTier,
    costTierLabel: costTier.charAt(0).toUpperCase() + costTier.slice(1),
    costTierDescription: tierConfig.description,
    costMultiplier: tierConfig.multiplier,
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

/**
 * Export pricing utilities for components that need brand-aware pricing
 */
export { getCostTier, getAdjustedUpgradeCost, formatUpgradeCost };

const performance = {
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
  getCostTier,
  getAdjustedUpgradeCost,
  formatUpgradeCost,
};

export default performance;

