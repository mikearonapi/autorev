/**
 * AutoRev - Upgrade Calculator
 * 
 * @deprecated This file is a BACKWARDS COMPATIBILITY WRAPPER.
 * 
 * SOURCE OF TRUTH: lib/performanceCalculator/
 * 
 * All performance calculation logic has been consolidated into lib/performanceCalculator/
 * This file re-exports from that module to maintain backwards compatibility.
 * 
 * FOR NEW CODE: Import directly from the source of truth:
 *   import { calculateSmartHpGain, detectUpgradeConflicts } from '@/lib/performanceCalculator';
 * 
 * This file will be removed once all consumers are migrated.
 */

// =============================================================================
// RE-EXPORTS FROM SOURCE OF TRUTH: lib/performanceCalculator/
// =============================================================================

// Constants
export {
  STAGE_TUNE_INCLUDED_MODS,
  TUNE_HIERARCHY,
  EXHAUST_SUBCATEGORIES,
  CATEGORY_CAPS,
  DIMINISHING_RETURNS_FACTOR,
  EXHAUST_CROSS_CATEGORY_FACTOR,
} from './performanceCalculator/constants.js';

// HP Calculation Functions
export {
  calculateSmartHpGain,
  formatHpDisplay,
  isExhaustMod,
  isIntakeMod,
  isForcedInductionMod,
} from './performanceCalculator/hpCalculator.js';

// Conflict Detection
export {
  detectUpgradeConflicts,
  getConflictSummary,
  checkUpgradeCompatibility,
} from './performanceCalculator/conflictDetector.js';

// =============================================================================
// DEFAULT EXPORT (for backwards compatibility)
// =============================================================================


import {
  detectUpgradeConflicts,
  getConflictSummary,
} from './performanceCalculator/conflictDetector.js';
import {
  TUNE_HIERARCHY,
  CATEGORY_CAPS,
  STAGE_TUNE_INCLUDED_MODS,
} from './performanceCalculator/constants.js';
import {
  calculateSmartHpGain,
  formatHpDisplay,
} from './performanceCalculator/hpCalculator.js';

const upgradeCalculator = {
  calculateSmartHpGain,
  detectUpgradeConflicts,
  formatHpDisplay,
  getConflictSummary,
  TUNE_HIERARCHY,
  CATEGORY_CAPS,
  STAGE_TUNE_INCLUDED_MODS,
};

export default upgradeCalculator;
