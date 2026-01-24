/**
 * AutoRev - Performance Calculator Module
 * 
 * SINGLE SOURCE OF TRUTH for all performance calculations.
 * 
 * This module consolidates functionality from:
 * - lib/performance.js
 * - lib/buildPerformanceCalculator.js
 * - lib/upgradeCalculator.js
 * 
 * Physics model from performanceCalculatorV2.js was merged into this module on 2026-01-24.
 * - lib/upgrades.js (calculation parts)
 * 
 * Usage:
 * ```javascript
 * import { calculateSmartHpGain, getStockPerformanceScores } from '@/lib/performanceCalculator';
 * 
 * const result = calculateSmartHpGain(car, ['stage2-tune', 'downpipe', 'intake']);
 * console.log(result.projectedHp);
 * ```
 * 
 * @module lib/performanceCalculator
 */

// =============================================================================
// CONSTANTS
// =============================================================================

export {
  // Tune and mod relationships
  STAGE_TUNE_INCLUDED_MODS,
  TUNE_HIERARCHY,
  
  // Category definitions
  EXHAUST_SUBCATEGORIES,
  CATEGORY_CAPS,
  CATEGORY_CAPS_SIMPLE,
  CATEGORY_CAPS_PERCENT,
  
  // Diminishing returns
  DIMINISHING_RETURNS_FACTOR,
  EXHAUST_CROSS_CATEGORY_FACTOR,
  DIMINISHING_RETURNS,
  TUNE_OVERLAP_MODIFIER,
  
  // Confidence tiers
  CONFIDENCE_TIERS,
  
  // Physics constants
  PHYSICS_CONSTANTS,
  
  // Mod HP gains lookup
  MOD_HP_GAINS,
  
  // Helper functions
  getHighestPriorityTune,
  isModExpectedByTune,
  getEngineCategory,
  getModGain,
  
  // Physics-based calculation helpers (new)
  detectAspiration,
  getPhysicsBasedGainPercent,
} from './constants.js';

// =============================================================================
// HP CALCULATION
// =============================================================================

export {
  // Main HP calculation functions
  calculateSmartHpGain,
  calculateAllModificationGains,
  calculateMultiplierBased,
  calculateBuildPerformance,
  
  // Build Progress Ring calculations
  calculateMaxPotential,
  calculateHandlingScore,
  calculateReliabilityScore,
  
  // Display helpers
  formatHpDisplay,
  
  // Utility functions
  isExhaustMod,
  isIntakeMod,
  isForcedInductionMod,
} from './hpCalculator.js';

// =============================================================================
// METRICS CALCULATION
// =============================================================================

export {
  calculateUpgradedMetrics,
  estimateZeroToSixty,
  estimateQuarterMile,
  estimateTrapSpeed,
} from './metricsCalculator.js';

// =============================================================================
// SCORE CALCULATION
// =============================================================================

export {
  getStockPerformanceScores,
  applyUpgradeDeltas,
  getScoreComparison,
  getScoreLabel,
  validatePerformanceScores,
  getPerformanceProfile,
  calculateAverageScore,
  getTopCategories,
  getImprovementOpportunities,
} from './scoreCalculator.js';

// =============================================================================
// CONFLICT DETECTION
// =============================================================================

export {
  detectUpgradeConflicts,
  getConflictSummary,
  checkUpgradeCompatibility,
} from './conflictDetector.js';

// =============================================================================
// DEFAULT EXPORT (for backwards compatibility)
// =============================================================================

import { calculateSmartHpGain, calculateAllModificationGains, calculateBuildPerformance, formatHpDisplay, calculateMaxPotential, calculateHandlingScore, calculateReliabilityScore } from './hpCalculator.js';
import { calculateUpgradedMetrics } from './metricsCalculator.js';
import { getStockPerformanceScores, applyUpgradeDeltas, getPerformanceProfile } from './scoreCalculator.js';
import { detectUpgradeConflicts, getConflictSummary } from './conflictDetector.js';
import { STAGE_TUNE_INCLUDED_MODS, TUNE_HIERARCHY, CATEGORY_CAPS } from './constants.js';

const performanceCalculator = {
  // HP calculations
  calculateSmartHpGain,
  calculateAllModificationGains,
  calculateBuildPerformance,
  formatHpDisplay,
  
  // Build Progress Ring calculations
  calculateMaxPotential,
  calculateHandlingScore,
  calculateReliabilityScore,
  
  // Metrics
  calculateUpgradedMetrics,
  
  // Scores
  getStockPerformanceScores,
  applyUpgradeDeltas,
  getPerformanceProfile,
  
  // Conflicts
  detectUpgradeConflicts,
  getConflictSummary,
  
  // Constants
  STAGE_TUNE_INCLUDED_MODS,
  TUNE_HIERARCHY,
  CATEGORY_CAPS,
};

export default performanceCalculator;
