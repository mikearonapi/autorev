/**
 * AutoRev - Performance Model Comparison Utility
 * 
 * PURPOSE:
 * Compare the CURRENT (legacy) performance calculator with the 
 * FUTURE (hybrid physics + calibration) model side-by-side.
 * 
 * This allows us to:
 * 1. Validate the new model produces reasonable results
 * 2. Compare against real dyno data when available
 * 3. Build confidence before switching over
 * 
 * USAGE:
 * - Run via script: node scripts/compare-performance-models.mjs
 * - Or import in admin tools for UI comparison
 * 
 * NOTE: This file is for DEVELOPMENT/TESTING only.
 * The actual switch to the new model will be controlled by feature flag.
 */

// CURRENT MODEL (legacy)
import { calculateSmartHpGain } from './upgradeCalculator.js';
import { calculateUpgradedMetrics, getPerformanceProfile } from './performance.js';
import { getUpgradeByKey } from './upgrades.js';

// FUTURE MODEL (hybrid physics + calibration)
import { 
  calculateBuildPerformance, 
  calculateSmartHpGainV2,
  calculateUpgradedMetricsV2,
  CONFIDENCE_TIERS,
} from './performanceCalculatorV2.js';

/**
 * @typedef {Object} ModelComparisonResult
 * @property {Object} car - The car being analyzed
 * @property {string[]} upgrades - The upgrades being applied
 * @property {Object} legacy - Results from current model
 * @property {Object} future - Results from new model
 * @property {Object} difference - Delta between models
 * @property {Object} realWorld - Real dyno data if available
 * @property {Object} accuracy - Accuracy comparison if real data available
 */

/**
 * Compare performance calculations between legacy and future models
 * 
 * @param {Object} car - Car object with hp, engine, etc.
 * @param {string[]} upgradeKeys - Array of upgrade keys to apply
 * @param {Object} [realDynoData] - Optional real dyno data for validation
 * @returns {Promise<ModelComparisonResult>}
 */
export async function compareModels(car, upgradeKeys, realDynoData = null) {
  // Get upgrade objects
  const upgrades = upgradeKeys.map(key => getUpgradeByKey(key)).filter(Boolean);
  
  // =========================================================================
  // LEGACY MODEL (current implementation)
  // =========================================================================
  const legacySmartHp = calculateSmartHpGain(car, upgradeKeys);
  const legacyMetrics = calculateUpgradedMetrics(car, upgrades);
  
  const legacy = {
    projectedHp: legacySmartHp.projectedHp,
    totalGain: legacySmartHp.totalGain,
    rawGain: legacySmartHp.rawGain,
    adjustmentAmount: legacySmartHp.adjustmentAmount,
    breakdown: legacySmartHp.breakdown,
    zeroToSixty: legacyMetrics.zeroToSixty,
    confidence: null, // Legacy doesn't have confidence
    source: 'Hardcoded values with engine-type multipliers',
  };
  
  // =========================================================================
  // FUTURE MODEL (hybrid physics + calibration)
  // =========================================================================
  const futureResult = await calculateBuildPerformance(car, upgradeKeys, {
    getUpgradeByKey,
  });
  
  const future = {
    projectedHp: futureResult.projectedHp,
    totalGain: futureResult.totalGain,
    rawGain: futureResult.rawGain,
    adjustmentAmount: futureResult.adjustmentAmount,
    breakdown: futureResult.breakdown,
    zeroToSixty: null, // Calculate separately if needed
    confidence: futureResult.confidence,
    confidenceLabel: futureResult.confidenceLabel,
    tier: futureResult.tier,
    source: getSourceDescription(futureResult.tier),
  };
  
  // =========================================================================
  // CALCULATE DIFFERENCES
  // =========================================================================
  const difference = {
    hpDelta: future.projectedHp - legacy.projectedHp,
    hpDeltaPercent: legacy.projectedHp > 0 
      ? ((future.projectedHp - legacy.projectedHp) / legacy.projectedHp * 100).toFixed(1)
      : 0,
    gainDelta: future.totalGain - legacy.totalGain,
    agreement: Math.abs(future.totalGain - legacy.totalGain) < 20 ? 'AGREE' : 'DIVERGE',
  };
  
  // =========================================================================
  // COMPARE TO REAL DATA (if available)
  // =========================================================================
  let accuracy = null;
  if (realDynoData) {
    const realGain = realDynoData.moddedHp - realDynoData.stockHp;
    
    accuracy = {
      realStockHp: realDynoData.stockHp,
      realModdedHp: realDynoData.moddedHp,
      realGain,
      legacyError: legacy.totalGain - realGain,
      legacyErrorPercent: ((legacy.totalGain - realGain) / realGain * 100).toFixed(1),
      futureError: future.totalGain - realGain,
      futureErrorPercent: ((future.totalGain - realGain) / realGain * 100).toFixed(1),
      winner: Math.abs(future.totalGain - realGain) < Math.abs(legacy.totalGain - realGain) 
        ? 'FUTURE' 
        : 'LEGACY',
    };
  }
  
  return {
    car: {
      name: car.name,
      slug: car.slug,
      stockHp: car.hp,
      engine: car.engine,
      engineFamilyId: car.engine_family_id,
    },
    upgrades: upgradeKeys,
    legacy,
    future,
    difference,
    realWorld: realDynoData,
    accuracy,
  };
}

/**
 * Compare models across multiple cars with the same upgrades
 * Useful for validating consistency
 */
export async function compareModelsAcrossCars(cars, upgradeKeys) {
  const results = [];
  
  for (const car of cars) {
    const comparison = await compareModels(car, upgradeKeys);
    results.push(comparison);
  }
  
  // Summary statistics
  const summary = {
    totalCars: cars.length,
    agreementCount: results.filter(r => r.difference.agreement === 'AGREE').length,
    averageHpDelta: results.reduce((sum, r) => sum + r.difference.hpDelta, 0) / results.length,
    maxDivergence: Math.max(...results.map(r => Math.abs(r.difference.hpDelta))),
    futureHigherCount: results.filter(r => r.difference.hpDelta > 0).length,
    legacyHigherCount: results.filter(r => r.difference.hpDelta < 0).length,
  };
  
  return { results, summary };
}

/**
 * Generate a formatted comparison report
 */
export function formatComparisonReport(comparison) {
  const { car, upgrades, legacy, future, difference, accuracy } = comparison;
  
  let report = `
════════════════════════════════════════════════════════════════
PERFORMANCE MODEL COMPARISON
════════════════════════════════════════════════════════════════

CAR: ${car.name}
Engine: ${car.engine}
Stock HP: ${car.stockHp}

UPGRADES APPLIED:
${upgrades.map(u => `  • ${u}`).join('\n')}

────────────────────────────────────────────────────────────────
                    LEGACY (Current)    FUTURE (Recommended)
────────────────────────────────────────────────────────────────
Projected HP:       ${legacy.projectedHp.toString().padEnd(18)} ${future.projectedHp}
HP Gain:            +${legacy.totalGain.toString().padEnd(17)} +${future.totalGain}
Raw Gain:           +${legacy.rawGain.toString().padEnd(17)} +${future.rawGain}
Adjustments:        -${legacy.adjustmentAmount.toString().padEnd(17)} -${future.adjustmentAmount}
Confidence:         ${(legacy.confidence || 'N/A').toString().padEnd(18)} ${future.confidence?.toFixed(2) || 'N/A'} (${future.confidenceLabel})
Source:             ${legacy.source.substring(0, 18).padEnd(18)} ${future.source}
────────────────────────────────────────────────────────────────

DIFFERENCE: ${difference.hpDelta > 0 ? '+' : ''}${difference.hpDelta} HP (${difference.hpDeltaPercent}%)
STATUS: ${difference.agreement}
`;

  if (accuracy) {
    report += `
────────────────────────────────────────────────────────────────
REAL WORLD VALIDATION
────────────────────────────────────────────────────────────────
Real Dyno Result: ${accuracy.realStockHp} → ${accuracy.realModdedHp} HP (+${accuracy.realGain})

Legacy Error:  ${accuracy.legacyError > 0 ? '+' : ''}${accuracy.legacyError} HP (${accuracy.legacyErrorPercent}%)
Future Error:  ${accuracy.futureError > 0 ? '+' : ''}${accuracy.futureError} HP (${accuracy.futureErrorPercent}%)

WINNER: ${accuracy.winner} MODEL (closer to real dyno)
────────────────────────────────────────────────────────────────
`;
  }

  report += `
════════════════════════════════════════════════════════════════

BREAKDOWN (Future Model):
${future.breakdown.map(b => 
  `  ${b.name.padEnd(30)} +${b.hp.toString().padStart(3)} HP  (${b.source})`
).join('\n')}

════════════════════════════════════════════════════════════════
`;

  return report;
}

/**
 * Get human-readable source description for tier
 */
function getSourceDescription(tier) {
  switch (tier) {
    case 1: return 'Verified dyno data';
    case 2: return 'Engine family calibration';
    case 3: return 'Physics model estimate';
    case 4: return 'Generic fallback';
    default: return 'Unknown';
  }
}

// ============================================================================
// QUICK TEST SCENARIOS
// ============================================================================

/**
 * Pre-defined test scenarios for common builds
 */
export const TEST_SCENARIOS = {
  // Turbo 4-cyl Stage 1
  gti_stage1: {
    name: 'GTI MK7 Stage 1',
    carSlug: 'volkswagen-gti-mk7',
    upgrades: ['stage1-tune'],
    expectedGain: { min: 50, max: 80 }, // Real-world range
  },
  
  // Turbo 4-cyl Stage 2
  gti_stage2: {
    name: 'GTI MK7 Stage 2',
    carSlug: 'volkswagen-gti-mk7',
    upgrades: ['stage2-tune', 'downpipe', 'intake'],
    expectedGain: { min: 80, max: 120 },
  },
  
  // BMW B58 Stage 1
  supra_stage1: {
    name: 'Supra 3.0 Stage 1',
    carSlug: 'toyota-gr-supra',
    upgrades: ['stage1-tune'],
    expectedGain: { min: 60, max: 100 },
  },
  
  // NA V8 bolt-ons
  mustang_gt_boltons: {
    name: 'Mustang GT Bolt-ons',
    carSlug: 'ford-mustang-gt-s550',
    upgrades: ['intake', 'exhaust-catback', 'tune-street'],
    expectedGain: { min: 25, max: 50 },
  },
  
  // NA V8 supercharger
  mustang_gt_supercharged: {
    name: 'Mustang GT Whipple',
    carSlug: 'ford-mustang-gt-s550',
    upgrades: ['supercharger-roots'],
    expectedGain: { min: 200, max: 300 },
  },
  
  // GT350 Voodoo supercharger
  gt350_whipple: {
    name: 'GT350 Whipple',
    carSlug: 'shelby-gt350',
    upgrades: ['supercharger-roots'],
    expectedGain: { min: 250, max: 320 },
  },
};

/**
 * Run all test scenarios and generate summary
 */
export async function runTestSuite(getCar) {
  const results = [];
  
  for (const [key, scenario] of Object.entries(TEST_SCENARIOS)) {
    const car = await getCar(scenario.carSlug);
    if (!car) {
      results.push({ scenario: key, status: 'SKIP', reason: 'Car not found' });
      continue;
    }
    
    const comparison = await compareModels(car, scenario.upgrades);
    
    // Check if within expected range
    const inRange = comparison.future.totalGain >= scenario.expectedGain.min &&
                    comparison.future.totalGain <= scenario.expectedGain.max;
    
    results.push({
      scenario: key,
      name: scenario.name,
      status: inRange ? 'PASS' : 'REVIEW',
      legacyGain: comparison.legacy.totalGain,
      futureGain: comparison.future.totalGain,
      expectedRange: `${scenario.expectedGain.min}-${scenario.expectedGain.max}`,
      confidence: comparison.future.confidenceLabel,
    });
  }
  
  return results;
}

// ============================================================================
// EXPORTS
// ============================================================================

const performanceModelComparison = {
  compareModels,
  compareModelsAcrossCars,
  formatComparisonReport,
  TEST_SCENARIOS,
  runTestSuite,
};

export default performanceModelComparison;
