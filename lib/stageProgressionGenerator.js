/**
 * Stage Progression Generator
 *
 * Generates canonical Stage 1/2/3 progressions from upgradeModules data.
 * This ensures the Build Progression tile aligns with the documented stage logic
 * from docs/UPGRADE-CATEGORY-LOGIC.md
 *
 * Stage Definitions:
 * - Stage 1: Bolt-ons (intake, cat-back exhaust). Tune optional but optimizes.
 * - Stage 2: Mods requiring tune (headers, downpipe, mild cams, pulley, boost).
 * - Stage 3: Major power mods (forced induction, turbo upgrades, E85, nitrous). Upgraded fuel required.
 */

import { upgradeModules, getModulesForCar } from '@/data/upgradePackages';

/**
 * Stage configuration matching UPGRADE-CATEGORY-LOGIC.md
 */
export const STAGE_DEFINITIONS = {
  1: {
    key: 'stage1',
    stage: 'Stage 1',
    notes:
      'Bolt-on modifications that improve power. Tune optional but recommended for best results.',
    tuneRequired: false,
    fuelSystem: 'stock',
  },
  2: {
    key: 'stage2',
    stage: 'Stage 2',
    notes: 'Modifications that require ECU recalibration to run properly and safely.',
    tuneRequired: true,
    fuelSystem: 'stock',
  },
  3: {
    key: 'stage3',
    stage: 'Stage 3',
    notes:
      'High-power modifications that exceed stock fuel system capacity or involve internal engine changes.',
    tuneRequired: true,
    fuelSystem: 'upgraded',
  },
};

/**
 * Get all modules grouped by their canonical stage
 * @returns {Object} - Modules grouped by stage number (1, 2, 3)
 */
export function getModulesByStage() {
  const grouped = { 1: [], 2: [], 3: [] };

  upgradeModules.forEach((mod) => {
    if (mod.stage && grouped[mod.stage]) {
      grouped[mod.stage].push(mod);
    }
  });

  return grouped;
}

/**
 * Get modules for a specific car grouped by stage
 * @param {Object} car - Car object with engine field for compatibility check
 * @param {string} carLayout - Car layout (Mid-Engine, Front-Engine, Rear-Engine)
 * @returns {Object} - Modules grouped by stage number, filtered for car compatibility
 */
export function getCarModulesByStage(car, carLayout) {
  const compatibleModules = getModulesForCar(car, carLayout);
  const grouped = { 1: [], 2: [], 3: [] };

  compatibleModules.forEach((mod) => {
    if (mod.stage && grouped[mod.stage]) {
      grouped[mod.stage].push(mod);
    }
  });

  return grouped;
}

/**
 * Generate canonical stage progressions for a car
 * This creates the stage progression structure used by BuildProgressAnalysis
 *
 * @param {Object} car - Car object with engine field
 * @param {string} carLayout - Car layout
 * @param {Object} options - Optional configuration
 * @param {Object} options.tuningProfile - Tuning profile for HP/cost estimates
 * @returns {Object[]} - Array of stage progression objects
 */
export function generateStageProgressions(car, carLayout, options = {}) {
  const { tuningProfile = null } = options;
  const modulesByStage = getCarModulesByStage(car, carLayout);

  // Get cost/HP estimates from tuning profile if available
  const profileStages = tuningProfile?.stage_progressions || [];
  const profileStageMap = {};
  profileStages.forEach((ps) => {
    // Map profile stages to canonical stages (handle "Stage 1+", "Stage 2+", etc.)
    const stageNum = extractStageNumber(ps.key || ps.stage);
    if (stageNum && !profileStageMap[stageNum]) {
      profileStageMap[stageNum] = ps;
    }
  });

  const progressions = [];

  // Generate Stage 1, 2, 3 in order
  [1, 2, 3].forEach((stageNum) => {
    const stageMods = modulesByStage[stageNum] || [];
    const stageDef = STAGE_DEFINITIONS[stageNum];
    const profileStage = profileStageMap[stageNum];

    // Skip stages with no applicable modules for this car
    if (stageMods.length === 0) {
      return;
    }

    // Get display-friendly component names
    const components = stageMods.map((mod) => mod.name);
    const componentKeys = stageMods.map((mod) => mod.key);

    // Aggregate cost estimates from modules
    const costs = aggregateModuleCosts(stageMods);

    // Use tuning profile estimates if available, otherwise use module aggregates
    const hpGainLow = profileStage?.hpGainLow || costs.hpGainLow;
    const hpGainHigh = profileStage?.hpGainHigh || costs.hpGainHigh;
    const costLow = profileStage?.costLow || costs.costLow;
    const costHigh = profileStage?.costHigh || costs.costHigh;

    progressions.push({
      key: stageDef.key,
      stage: stageDef.stage,
      components,
      componentKeys,
      notes: profileStage?.notes || stageDef.notes,
      tuneRequired: stageDef.tuneRequired,
      fuelSystem: stageDef.fuelSystem,
      hpGainLow,
      hpGainHigh,
      costLow,
      costHigh,
      // Include torque if available from profile
      torqueGainLow: profileStage?.torqueGainLow || 0,
      torqueGainHigh: profileStage?.torqueGainHigh || 0,
      // Track which mods are power-related (for progress tracking)
      powerModKeys: stageMods
        .filter((m) => m.category === 'power' || m.category === 'forcedInduction')
        .map((m) => m.key),
    });
  });

  return progressions;
}

/**
 * Extract stage number from stage key or name
 * Handles: "stage1", "Stage 1", "Stage 1+", "stage2plus", etc.
 * @param {string} stageIdentifier - Stage key or name
 * @returns {number|null} - Stage number (1, 2, or 3) or null if not parseable
 */
function extractStageNumber(stageIdentifier) {
  if (!stageIdentifier) return null;

  const str = stageIdentifier.toLowerCase();

  // Match patterns like "stage1", "stage 1", "stage1+", "stage1plus"
  const match = str.match(/stage\s*(\d)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 3) {
      return num;
    }
  }

  return null;
}

/**
 * Aggregate cost and HP estimates from modules
 * @param {Object[]} modules - Array of upgrade modules
 * @returns {Object} - Aggregated estimates
 */
function aggregateModuleCosts(modules) {
  let costLow = 0;
  let costHigh = 0;
  let hpGainLow = 0;
  let hpGainHigh = 0;

  modules.forEach((mod) => {
    // Parse cost from estimatedCost string or use direct values
    if (mod.estimatedCostLow) {
      costLow += mod.estimatedCostLow;
      costHigh += mod.estimatedCostHigh || mod.estimatedCostLow;
    } else if (mod.estimatedCost) {
      const parsed = parseCostRange(mod.estimatedCost);
      costLow += parsed.low;
      costHigh += parsed.high;
    }

    // Aggregate HP gains
    if (mod.metricChanges?.hpGain) {
      // Use a range around the stated gain
      const gain = mod.metricChanges.hpGain;
      hpGainLow += Math.round(gain * 0.8);
      hpGainHigh += Math.round(gain * 1.2);
    }
  });

  return { costLow, costHigh, hpGainLow, hpGainHigh };
}

/**
 * Parse cost range from string like "$800 - $2,000"
 * @param {string} costString - Cost string
 * @returns {Object} - { low, high }
 */
function parseCostRange(costString) {
  if (!costString) return { low: 0, high: 0 };

  const numbers = costString.match(/[\d,]+/g);
  if (!numbers || numbers.length === 0) return { low: 0, high: 0 };

  const values = numbers.map((n) => parseInt(n.replace(/,/g, ''), 10));

  return {
    low: values[0] || 0,
    high: values[1] || values[0] || 0,
  };
}

/**
 * Check if an installed upgrade matches any component in a stage
 * @param {string} installedKey - Key of installed upgrade
 * @param {string[]} componentKeys - Array of component keys in the stage
 * @returns {boolean}
 */
export function upgradeMatchesStage(installedKey, componentKeys) {
  if (!installedKey || !componentKeys) return false;

  const normalizedInstalled = normalizeKey(installedKey);

  return componentKeys.some((compKey) => {
    const normalizedComp = normalizeKey(compKey);
    return (
      normalizedInstalled === normalizedComp ||
      normalizedInstalled.includes(normalizedComp) ||
      normalizedComp.includes(normalizedInstalled)
    );
  });
}

/**
 * Normalize a key for comparison
 * @param {string} key - Module key
 * @returns {string} - Normalized key
 */
function normalizeKey(key) {
  if (!key) return '';
  return key.toLowerCase().replace(/[-_\s]+/g, '');
}

const stageProgressionGenerator = {
  STAGE_DEFINITIONS,
  getModulesByStage,
  getCarModulesByStage,
  generateStageProgressions,
  upgradeMatchesStage,
};

export default stageProgressionGenerator;
