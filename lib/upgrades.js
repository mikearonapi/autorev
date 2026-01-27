/**
 * AutoRev - Unified Upgrade API
 *
 * This module provides a unified interface for accessing upgrade data,
 * joining educational content from upgradeEducation.js with performance
 * data from upgradePackages.js.
 *
 * Usage:
 * - getUpgradeByKey('cold-air-intake') - Get full upgrade object with education + performance data
 * - getUpgradesByCategory('power') - Get all upgrades in a category
 * - getUpgradesForCar(car) - Get compatible upgrades for a specific car
 * - getCanonicalCategories() - Get the unified category definitions
 */

import { upgradeCategories, upgradeDetails } from '../data/upgradeEducation.js';
import {
  upgradeModules,
  getModulesForCar as getModulesForCarFromPackages,
  getPackagesForCar,
  getEngineType,
  isUpgradeCompatible,
  getHpGainMultiplier,
  calculateRealisticHpGain,
} from '../data/upgradePackages.js';

/**
 * Canonical category definitions that unify education and performance categories
 * These are the authoritative category definitions for the entire app
 */
export const canonicalCategories = {
  power: {
    key: 'power',
    name: 'Power & Engine',
    icon: 'bolt',
    description: 'Bolt-on upgrades that increase horsepower, torque, and throttle response.',
    color: '#e74c3c',
    aliases: ['engine', 'power', 'performance'],
  },
  forcedInduction: {
    key: 'forcedInduction',
    name: 'Forced Induction',
    icon: 'turbo',
    description:
      'Superchargers, turbochargers, and supporting modifications for massive power gains.',
    color: '#9b59b6',
    aliases: ['turbo', 'supercharger', 'boost'],
  },
  exhaust: {
    key: 'exhaust',
    name: 'Exhaust & Sound',
    icon: 'sound',
    description:
      "Exhaust modifications improve flow, reduce restriction, and change your car's voice.",
    color: '#8e44ad',
    aliases: ['sound', 'muffler', 'headers'],
  },
  suspension: {
    key: 'suspension',
    name: 'Suspension & Chassis',
    icon: 'car',
    description:
      'Suspension upgrades transform how your car handles corners and responds to input.',
    color: '#3498db',
    aliases: ['chassis', 'handling', 'coilovers'],
  },
  brakes: {
    key: 'brakes',
    name: 'Brakes & Stopping',
    icon: 'brake',
    description: 'Brake upgrades improve stopping power, fade resistance, and pedal feel.',
    color: '#f39c12',
    aliases: ['stopping', 'pads', 'rotors'],
  },
  wheels: {
    key: 'wheels',
    name: 'Wheels & Tires',
    icon: 'tire',
    description:
      'The only thing connecting your car to the road. Quality wheels and tires are crucial.',
    color: '#2ecc71',
    aliases: ['tires', 'rims', 'rubber'],
  },
  cooling: {
    key: 'cooling',
    name: 'Cooling & Reliability',
    icon: 'thermometer',
    description: 'Keep your engine, transmission, and brakes running cool under stress.',
    color: '#1abc9c',
    aliases: ['radiator', 'oil cooler', 'thermal'],
  },
  aero: {
    key: 'aero',
    name: 'Aerodynamics',
    icon: 'wind',
    description: 'Aerodynamic upgrades create downforce and improve high-speed stability.',
    color: '#34495e',
    aliases: ['wing', 'splitter', 'downforce'],
  },
  drivetrain: {
    key: 'drivetrain',
    name: 'Drivetrain & Gearing',
    icon: 'gears',
    description: 'Upgrades to the clutch, flywheel, differential, and driveline components.',
    color: '#e67e22',
    aliases: ['clutch', 'diff', 'transmission', 'lsd'],
  },
  safety: {
    key: 'safety',
    name: 'Safety & Track Prep',
    icon: 'shield',
    description: 'Safety equipment for track use: harnesses, seats, roll protection.',
    color: '#c0392b',
    aliases: ['harness', 'cage', 'helmet'],
  },
  weightReduction: {
    key: 'weightReduction',
    name: 'Weight Reduction',
    icon: 'feather',
    description: 'Lightweight components and weight reduction strategies.',
    color: '#7f8c8d',
    aliases: ['lightweight', 'carbon', 'diet'],
  },
  engineSwaps: {
    key: 'engineSwaps',
    name: 'Engine Swaps',
    icon: 'engine',
    description: 'Complete engine swap options and crate engine upgrades.',
    color: '#2c3e50',
    aliases: ['swap', 'crate', 'conversion'],
  },
};

/**
 * Map from old/alternative category keys to canonical keys
 */
const categoryKeyMap = {
  chassis: 'suspension',
  handling: 'suspension',
  power: 'power',
  engine: 'power',
  sound: 'exhaust',
  forcedInduction: 'forcedInduction',
  turbo: 'forcedInduction',
  brakes: 'brakes',
  wheels: 'wheels',
  tires: 'wheels',
  cooling: 'cooling',
  aero: 'aero',
  aerodynamics: 'aero',
  drivetrain: 'drivetrain',
  safety: 'safety',
  weightReduction: 'weightReduction',
  engineSwaps: 'engineSwaps',
};

/**
 * Get the canonical category key from any alias or legacy key
 * @param {string} key - Any category key or alias
 * @returns {string} - Canonical category key
 */
export function getCanonicalCategoryKey(key) {
  return categoryKeyMap[key] || key;
}

/**
 * Get all canonical category definitions
 * @returns {Object} - Map of category keys to category objects
 */
export function getCanonicalCategories() {
  return canonicalCategories;
}

/**
 * Get a single canonical category by key
 * @param {string} key - Category key
 * @returns {Object|null} - Category object or null
 */
export function getCategoryByKey(key) {
  const canonicalKey = getCanonicalCategoryKey(key);
  return canonicalCategories[canonicalKey] || null;
}

/**
 * Key mapping from module keys to education keys
 * This bridges the gap between performance modules and educational content
 * Module Key (upgradePackages.js) -> Education Key (upgradeEducation.js)
 */
const moduleToEducationKeyMap = {
  // ============================================================================
  // POWER & ENGINE
  // ============================================================================
  intake: 'cold-air-intake',
  'exhaust-catback': 'cat-back-exhaust',
  headers: 'headers',
  'stage1-tune': 'ecu-tune',
  'stage2-tune': 'ecu-tune',
  'stage3-tune': 'ecu-tune',
  'piggyback-tuner': 'piggyback-tune',
  downpipe: 'downpipe',
  // Note: charge-pipe-upgrade and hpfp-upgrade removed
  'flex-fuel-e85': 'fuel-system-upgrade',
  // Note: methanol-injection removed
  'dct-tune': 'ecu-tune',
  // Note: camshafts, ported-heads, forged-internals, stroker-kit, throttle-body, intake-manifold removed

  // ============================================================================
  // FORCED INDUCTION
  // ============================================================================
  'supercharger-centrifugal': 'supercharger-centrifugal',
  'supercharger-roots': 'supercharger-roots',
  'turbo-kit-single': 'turbo-kit-single',
  'turbo-kit-twin': 'turbo-kit-twin',
  'turbo-upgrade-existing': 'turbo-upgrade-existing',
  'pulley-tune-sc': 'pulley-tune-sc',
  // Note: heat-exchanger-sc merged into intercooler
  intercooler: 'intercooler',

  // ============================================================================
  // SUSPENSION & CHASSIS
  // ============================================================================
  'lowering-springs': 'lowering-springs',
  'coilovers-street': 'coilovers',
  'coilovers-track': 'coilovers',
  'sway-bars': 'sway-bars',
  'chassis-bracing': 'strut-tower-brace', // Maps to strut tower brace as primary chassis bracing

  // ============================================================================
  // BRAKES
  // ============================================================================
  'brake-pads-street': 'brake-pads-performance',
  'brake-pads-track': 'brake-pads-performance',
  'brake-fluid-lines': 'braided-brake-lines',
  'big-brake-kit': 'big-brake-kit',
  'slotted-rotors': 'brake-rotors',

  // ============================================================================
  // COOLING
  // ============================================================================
  'oil-cooler': 'oil-cooler',
  'trans-cooler': 'trans-cooler',
  'radiator-upgrade': 'radiator-upgrade',

  // ============================================================================
  // WHEELS (tire compound handled by WheelTireConfigurator)
  // ============================================================================
  'wheels-lightweight': 'lightweight-wheels',

  // ============================================================================
  // AERO
  // ============================================================================
  splitter: 'front-splitter',
  wing: 'rear-wing',

  // ============================================================================
  // DRIVETRAIN
  // ============================================================================
  'clutch-upgrade': 'clutch-upgrade',
  'diff-upgrade': 'limited-slip-diff',
  'short-shifter': 'short-shifter',
};

/**
 * Get the education key for a module key
 * @param {string} moduleKey - The module key
 * @returns {string} - The education key (or original if no mapping exists)
 */
function getEducationKey(moduleKey) {
  return moduleToEducationKeyMap[moduleKey] || moduleKey;
}

/**
 * Get a unified upgrade object by key
 * Merges educational content with performance module data if both exist
 * @param {string} key - Upgrade key
 * @returns {Object|null} - Unified upgrade object or null
 */
export function getUpgradeByKey(key) {
  // Try to find in upgrade modules (performance data)
  const moduleData = upgradeModules.find((m) => m.key === key || m.slug === key);

  // Get the education key (might be different from module key)
  const educationKey = moduleData ? getEducationKey(moduleData.key) : key;

  // Try to find in educational data
  const educationData = upgradeDetails[educationKey] || upgradeDetails[key];

  if (!educationData && !moduleData) {
    return null;
  }

  // If we have both, merge them
  if (educationData && moduleData) {
    return {
      ...educationData,
      // Override name from module if different (e.g., "Stage 1 ECU Tune" vs generic "ECU Tune")
      name: moduleData.name || educationData.name,
      key: moduleData.key,
      // Add performance-specific fields from module
      deltas: moduleData.deltas,
      metricChanges: moduleData.metricChanges,
      estimatedCostLow: moduleData.estimatedCostLow || educationData.cost?.low,
      estimatedCostHigh: moduleData.estimatedCostHigh || educationData.cost?.high,
      applicableLayouts: moduleData.applicableLayouts,
      applicableEngines: moduleData.applicableEngines,
      type: 'module',
      // Keep education fields as primary
      source: 'unified',
    };
  }

  // If only education data exists
  if (educationData) {
    return {
      ...educationData,
      type: 'educational',
      source: 'education',
    };
  }

  // If only module data exists - create minimal education-like structure
  return {
    key: moduleData.key,
    name: moduleData.name,
    category: moduleData.category,
    tier: moduleData.tier,
    shortDescription: moduleData.description,
    cost: {
      range: moduleData.estimatedCost,
      low: moduleData.estimatedCostLow,
      high: moduleData.estimatedCostHigh,
    },
    deltas: moduleData.deltas,
    metricChanges: moduleData.metricChanges,
    applicableLayouts: moduleData.applicableLayouts,
    applicableEngines: moduleData.applicableEngines,
    type: 'module',
    source: 'packages',
  };
}

/**
 * Get all upgrades in a category
 * @param {string} categoryKey - Category key (uses canonical mapping)
 * @returns {Object[]} - Array of unified upgrade objects
 */
export function getUpgradesByCategory(categoryKey) {
  const canonicalKey = getCanonicalCategoryKey(categoryKey);

  // Get education entries for this category
  const educationUpgrades = Object.values(upgradeDetails).filter(
    (u) => u.category === canonicalKey
  );

  // Get module entries for this category
  const moduleUpgrades = upgradeModules.filter(
    (m) => getCanonicalCategoryKey(m.category) === canonicalKey
  );

  // Create a map of all upgrades by key
  const upgradeMap = new Map();

  // Add education upgrades
  educationUpgrades.forEach((u) => {
    upgradeMap.set(u.key, {
      ...u,
      type: 'educational',
      source: 'education',
    });
  });

  // Merge or add module upgrades
  moduleUpgrades.forEach((m) => {
    if (upgradeMap.has(m.key)) {
      // Merge with existing education data
      const existing = upgradeMap.get(m.key);
      upgradeMap.set(m.key, {
        ...existing,
        deltas: m.deltas,
        metricChanges: m.metricChanges,
        estimatedCostLow: m.estimatedCostLow,
        estimatedCostHigh: m.estimatedCostHigh,
        applicableLayouts: m.applicableLayouts,
        applicableEngines: m.applicableEngines,
        type: 'module',
        source: 'unified',
      });
    } else {
      // Add as module-only upgrade
      upgradeMap.set(m.key, {
        key: m.key,
        name: m.name,
        category: canonicalKey,
        tier: m.tier,
        shortDescription: m.description,
        cost: {
          range: m.estimatedCost,
          low: m.estimatedCostLow,
          high: m.estimatedCostHigh,
        },
        deltas: m.deltas,
        metricChanges: m.metricChanges,
        applicableLayouts: m.applicableLayouts,
        applicableEngines: m.applicableEngines,
        type: 'module',
        source: 'packages',
      });
    }
  });

  return Array.from(upgradeMap.values());
}

/**
 * Get all upgrades grouped by category
 * @returns {Object} - Map of category keys to arrays of upgrades
 */
export function getAllUpgradesGrouped() {
  const grouped = {};

  Object.keys(canonicalCategories).forEach((catKey) => {
    grouped[catKey] = {
      ...canonicalCategories[catKey],
      upgrades: getUpgradesByCategory(catKey),
    };
  });

  return grouped;
}

/**
 * Get compatible upgrades for a specific car
 * @param {Object} car - Car object with engine, layout, etc.
 * @returns {Object} - Object with packages and modules arrays
 */
export function getUpgradesForCar(car) {
  if (!car) {
    return { packages: [], modules: [] };
  }

  const layout = car.category || car.layout || 'Front-Engine';

  // Get compatible packages
  const packages = getPackagesForCar(car.slug, layout).map((pkg) => ({
    ...pkg,
    type: 'package',
  }));

  // Get compatible modules with education data merged
  const modules = getModulesForCarFromPackages(car, layout).map((mod) => {
    const educationData = upgradeDetails[mod.key];
    if (educationData) {
      return {
        ...educationData,
        ...mod,
        type: 'module',
        source: 'unified',
      };
    }
    return {
      ...mod,
      type: 'module',
      source: 'packages',
    };
  });

  return { packages, modules };
}

/**
 * Search upgrades by name or description
 * @param {string} query - Search query
 * @returns {Object[]} - Matching upgrades
 */
export function searchUpgrades(query) {
  const lowerQuery = query.toLowerCase();
  const results = [];
  const seenKeys = new Set();

  // Search education data
  Object.values(upgradeDetails).forEach((u) => {
    if (
      u.name.toLowerCase().includes(lowerQuery) ||
      u.shortDescription?.toLowerCase().includes(lowerQuery) ||
      u.category?.toLowerCase().includes(lowerQuery)
    ) {
      results.push({
        ...u,
        source: 'education',
      });
      seenKeys.add(u.key);
    }
  });

  // Search module data (only add if not already found)
  upgradeModules.forEach((m) => {
    if (seenKeys.has(m.key)) return;

    if (
      m.name.toLowerCase().includes(lowerQuery) ||
      m.description?.toLowerCase().includes(lowerQuery) ||
      m.category?.toLowerCase().includes(lowerQuery)
    ) {
      results.push({
        key: m.key,
        name: m.name,
        category: m.category,
        shortDescription: m.description,
        source: 'packages',
      });
    }
  });

  return results;
}

/**
 * Get all upgrade keys across both data sources
 * @returns {string[]} - Array of all unique upgrade keys
 */
export function getAllUpgradeKeys() {
  const keys = new Set();

  Object.keys(upgradeDetails).forEach((k) => keys.add(k));
  upgradeModules.forEach((m) => keys.add(m.key));

  return Array.from(keys);
}

/**
 * Check if an upgrade is compatible with a car
 * @param {Object} car - Car object
 * @param {Object} upgrade - Upgrade object
 * @returns {boolean}
 */
export function checkUpgradeCompatibility(car, upgrade) {
  // If upgrade has applicableEngines, check engine compatibility
  if (upgrade.applicableEngines && upgrade.applicableEngines.length > 0) {
    return isUpgradeCompatible(car, upgrade);
  }

  // If upgrade has applicableLayouts, check layout
  if (upgrade.applicableLayouts && upgrade.applicableLayouts.length > 0) {
    const carLayout = car.category || car.layout || 'Front-Engine';
    return upgrade.applicableLayouts.includes(carLayout);
  }

  // No restrictions = compatible
  return true;
}

/**
 * Calculate HP gains for a car with selected upgrades
 * @param {Object} car - Car object
 * @param {Object[]} upgrades - Array of upgrade objects
 * @returns {number} - Total HP gain
 */
export function calculateHpGainsForCar(car, upgrades) {
  return calculateRealisticHpGain(car, upgrades);
}

/**
 * Get cost estimate for a set of upgrades on a specific car
 * Uses platform cost multipliers from upgradePricing
 * @param {Object} car - Car object
 * @param {Object[]} upgrades - Array of upgrade objects
 * @returns {Object} - { low, high, range }
 */
export function getUpgradeCostEstimate(car, upgrades) {
  let totalLow = 0;
  let totalHigh = 0;

  // Platform multiplier based on brand
  let multiplier = 1.0;
  if (car.make) {
    const make = car.make.toLowerCase();
    if (['porsche', 'ferrari', 'lamborghini', 'mclaren', 'aston martin'].includes(make)) {
      multiplier = 1.5;
    } else if (['bmw', 'mercedes', 'audi', 'lexus'].includes(make)) {
      multiplier = 1.25;
    }
  }

  upgrades.forEach((u) => {
    const low = u.cost?.low || u.estimatedCostLow || 0;
    const high = u.cost?.high || u.estimatedCostHigh || 0;
    totalLow += low;
    totalHigh += high;
  });

  totalLow = Math.round(totalLow * multiplier);
  totalHigh = Math.round(totalHigh * multiplier);

  return {
    low: totalLow,
    high: totalHigh,
    range: `$${totalLow.toLocaleString()} - $${totalHigh.toLocaleString()}`,
  };
}

/**
 * What mods are typically included/assumed by stage tunes
 * Stage 2 tune gains are calibrated assuming downpipe + intake are installed
 * Stage 3 tune gains are calibrated assuming turbo upgrade, intercooler, etc.
 */
const STAGE_TUNE_INCLUDED_MODS = {
  'stage2-tune': ['downpipe', 'intake'],
  'stage3-tune': ['downpipe', 'intake', 'turbo-upgrade-existing', 'intercooler'],
};

/**
 * @deprecated USE `@/lib/performanceCalculator` INSTEAD
 *
 * This function is DEPRECATED. Import from the single source of truth:
 * ```javascript
 * import { calculateAllModificationGains } from '@/lib/performanceCalculator';
 * ```
 *
 * See docs/SOURCE_OF_TRUTH.md - Rule 8: Performance Calculations Use `performanceCalculator/`
 *
 * This legacy function exists only for backwards compatibility and may be removed.
 *
 * @param {string[]} installedMods - Array of upgrade/module keys
 * @param {Object} car - Optional car object for engine-specific calculations
 * @returns {Object} - All metric gains { hpGain, torqueGain, zeroToSixtyImprovement, brakingImprovement, lateralGImprovement }
 */
export function calculateAllModificationGains(installedMods, car = null) {
  // eslint-disable-next-line no-console
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '[DEPRECATED] calculateAllModificationGains from lib/upgrades.js is deprecated. ' +
        'Use @/lib/performanceCalculator instead. See docs/SOURCE_OF_TRUTH.md Rule 8.'
    );
  }
  if (!installedMods || installedMods.length === 0) {
    return {
      hpGain: 0,
      torqueGain: 0,
      zeroToSixtyImprovement: 0,
      brakingImprovement: 0,
      lateralGImprovement: 0,
    };
  }

  let totalHpGain = 0;
  let totalTorqueGain = 0;
  let totalZeroToSixtyImprovement = 0;
  let totalBrakingImprovement = 0;
  let totalLateralGImprovement = 0;

  const _engineType = car ? getEngineType(car) : null;

  // Detect which tune is active (highest stage wins) to check for overlap
  const activeTune =
    installedMods.find((m) => m === 'stage3-tune') ||
    installedMods.find((m) => m === 'stage2-tune') ||
    installedMods.find((m) => m === 'stage1-tune');

  installedMods.forEach((modKey) => {
    const upgrade = getUpgradeByKey(modKey);
    if (!upgrade?.metricChanges) return;

    const changes = upgrade.metricChanges;

    // Check if this mod is "expected" by the active tune (avoid double-counting)
    // e.g., Stage 3 tune is calibrated assuming turbo upgrade + intercooler are installed
    const isExpectedByTune = activeTune && STAGE_TUNE_INCLUDED_MODS[activeTune]?.includes(modKey);

    // Overlap modifier: 50% if tune already accounts for this hardware
    const overlapModifier = isExpectedByTune ? 0.5 : 1.0;

    // HP gain - apply engine-specific multiplier if car provided
    if (changes.hpGain) {
      if (car) {
        const multiplier = getHpGainMultiplier(car, upgrade);
        totalHpGain += Math.round(changes.hpGain * multiplier * overlapModifier);
      } else {
        totalHpGain += Math.round(changes.hpGain * overlapModifier);
      }
    }

    // Torque gain - apply similar scaling to HP
    if (changes.torqueGain) {
      if (car) {
        const multiplier = getHpGainMultiplier(car, upgrade);
        totalTorqueGain += Math.round(changes.torqueGain * multiplier * overlapModifier);
      } else {
        totalTorqueGain += Math.round(changes.torqueGain * overlapModifier);
      }
    }

    // Other metrics - direct summation (no overlap concerns for handling/braking)
    if (changes.zeroToSixtyImprovement) {
      totalZeroToSixtyImprovement += changes.zeroToSixtyImprovement;
    }
    if (changes.brakingImprovement) {
      totalBrakingImprovement += changes.brakingImprovement;
    }
    if (changes.lateralGImprovement) {
      totalLateralGImprovement += changes.lateralGImprovement;
    }
  });

  return {
    hpGain: totalHpGain,
    torqueGain: totalTorqueGain,
    zeroToSixtyImprovement: Math.round(totalZeroToSixtyImprovement * 100) / 100, // Round to 2 decimal places
    brakingImprovement: Math.round(totalBrakingImprovement),
    lateralGImprovement: Math.round(totalLateralGImprovement * 100) / 100, // Round to 2 decimal places
  };
}

// Re-export useful functions from other modules
export { getEngineType, getHpGainMultiplier, upgradeCategories, upgradeDetails };

const upgrades = {
  getUpgradeByKey,
  getUpgradesByCategory,
  getAllUpgradesGrouped,
  getUpgradesForCar,
  searchUpgrades,
  getAllUpgradeKeys,
  checkUpgradeCompatibility,
  calculateHpGainsForCar,
  getUpgradeCostEstimate,
  getCanonicalCategories,
  getCategoryByKey,
  getCanonicalCategoryKey,
  calculateAllModificationGains,
};

export default upgrades;
