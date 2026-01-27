/**
 * AutoRev - Dependency Checker
 *
 * This module provides the interface between the Performance Hub UI and the
 * Connected Tissue Matrix. It evaluates upgrade selections in real-time and
 * generates actionable warnings and recommendations.
 *
 * USAGE:
 * 1. Call validateUpgradeSelection() when user toggles an upgrade
 * 2. Display the returned warnings in the UI
 * 3. Use getRecommendedUpgrades() to suggest supporting mods
 * 4. Use getUpgradeImpactSummary() to show what systems are affected
 *
 * INTEGRATION POINTS:
 * - PerformanceHub.jsx: DependencyWarnings component
 * - upgradePackages.js: Package includedUpgradeKeys
 * - performance.js: getPerformanceProfile()
 */

import {
  checkDependencies,
  getUpgradeDependencies,
  getAffectedSystems,
  getUpgradeSummary,
  upgradeNodeMap,
  nodes,
  systems,
  dependencyRules,
} from '@/data/connectedTissueMatrix.js';
import { getEngineType, calculateRealisticHpGain } from '@/data/upgradePackages.js';
import { getUpgradeByKey } from '@/lib/upgrades.js';

// =============================================================================
// SEVERITY LEVELS
// =============================================================================

export const SEVERITY = {
  CRITICAL: 'critical', // Must address - upgrade won't work properly
  WARNING: 'warning', // Should address - significantly impacts performance/safety
  INFO: 'info', // Nice to know - optimization opportunity
  POSITIVE: 'positive', // Good synergy - you did something right
};

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

/**
 * Validate a set of selected upgrades and return all warnings/recommendations
 * This is the main entry point for the Performance Hub
 *
 * @param {string[]} selectedUpgradeKeys - Array of upgrade keys the user has selected
 * @param {Object} car - Car object (for engine type filtering, etc.)
 * @param {Object} options - Optional settings
 * @param {string} options.usageProfile - 'street' | 'track' | 'mixed'
 * @returns {Object} - Validation results
 */
export function validateUpgradeSelection(selectedUpgradeKeys, car, options = {}) {
  const { usageProfile = 'mixed' } = options;
  const engineType = car ? getEngineType(car) : 'unknown';
  const selectedUpgradeObjects = selectedUpgradeKeys
    .map((key) => getUpgradeByKey(key))
    .filter(Boolean);
  const totalHpGain =
    car && selectedUpgradeObjects.length > 0
      ? calculateRealisticHpGain(car, selectedUpgradeObjects)
      : 0;

  // Run all dependency rules
  const ruleResults = checkDependencies(selectedUpgradeKeys);

  // Filter and enhance results based on engine type, usage, and overall HP gain
  const filteredResults = filterResultsByContext(
    ruleResults,
    engineType,
    usageProfile,
    totalHpGain
  );

  // Group by severity
  const grouped = {
    critical: filteredResults.filter((r) => r.severity === SEVERITY.CRITICAL),
    warnings: filteredResults.filter((r) => r.severity === SEVERITY.WARNING),
    info: filteredResults.filter((r) => r.severity === SEVERITY.INFO),
  };

  // Get affected systems for summary
  const affectedSystems = getAffectedSystems(selectedUpgradeKeys);

  // Check for positive synergies
  const synergies = checkPositiveSynergies(selectedUpgradeKeys);

  return {
    isValid: grouped.critical.length === 0,
    critical: grouped.critical,
    warnings: grouped.warnings,
    info: grouped.info,
    synergies,
    affectedSystems: Array.from(affectedSystems).map((s) => systems[s]),
    totalIssues: grouped.critical.length + grouped.warnings.length,
    summary: generateValidationSummary(grouped, synergies),
  };
}

/**
 * Filter results based on engine type, usage profile, and overall HP gain
 */
function filterResultsByContext(results, engineType, usageProfile, totalHpGain) {
  return results.filter((result) => {
    // Boost-related rules only apply to forced induction cars
    if (result.ruleId?.includes('boost') || result.ruleId?.includes('intercooler')) {
      if (!engineType.includes('Turbo') && !engineType.includes('SC')) {
        return false;
      }
    }

    // Some rules are more critical for track use
    if (usageProfile === 'street') {
      // Downgrade some warnings to info for street-only use
      if (result.ruleId === 'grip-brakes-pads' || result.ruleId === 'slicks-bbk') {
        result.severity = SEVERITY.INFO;
      }
    }

    // Use total HP gain to gate certain power-related rules
    if (
      result.ruleId === 'power-clutch' ||
      result.ruleId === 'power-cooling' ||
      result.ruleId === 'power-bottom-end'
    ) {
      // If the total HP gain from selected upgrades is modest, downgrade to info
      if (totalHpGain > 0 && totalHpGain < 80) {
        result.severity = SEVERITY.INFO;
      }
    }

    return true;
  });
}

/**
 * Check for positive synergies between selected upgrades
 */
function checkPositiveSynergies(selectedUpgradeKeys) {
  const synergies = [];

  // Intake + Exhaust + Tune = full bolt-on synergy
  const hasIntake = selectedUpgradeKeys.includes('intake');
  const hasExhaust = selectedUpgradeKeys.some((k) => k === 'exhaust-catback' || k === 'headers');
  const hasTune = selectedUpgradeKeys.some(
    (k) =>
      k === 'tune-street' ||
      k === 'tune-track' ||
      k === 'stage1-tune' ||
      k === 'stage2-tune' ||
      k === 'stage3-tune'
  );

  if (hasIntake && hasExhaust && hasTune) {
    synergies.push({
      type: 'positive',
      name: 'Full Bolt-On Package',
      message: 'Intake + exhaust + tune work together for maximum bolt-on gains',
      upgrades: ['intake', 'exhaust-catback', 'tune-street'],
    });
  }

  // Suspension + alignment synergy
  const hasSuspension = selectedUpgradeKeys.some(
    (k) => k === 'coilovers-street' || k === 'coilovers-track' || k === 'lowering-springs'
  );
  const hasAlignment = selectedUpgradeKeys.includes('performance-alignment');
  const hasSwayBars = selectedUpgradeKeys.includes('sway-bars');

  if (hasSuspension && (hasAlignment || hasSwayBars)) {
    synergies.push({
      type: 'positive',
      name: 'Complete Chassis Package',
      message: 'Suspension upgrades combined with proper setup for balanced handling',
      upgrades: ['coilovers', 'sway-bars', 'alignment'],
    });
  }

  // Power + cooling synergy
  const hasPowerMod = selectedUpgradeKeys.some(
    (k) => k.includes('supercharger') || k.includes('turbo') || k.includes('stage3')
  );
  const hasCooling =
    selectedUpgradeKeys.includes('oil-cooler') || selectedUpgradeKeys.includes('radiator-upgrade');

  if (hasPowerMod && hasCooling) {
    synergies.push({
      type: 'positive',
      name: 'Power with Proper Cooling',
      message: 'High power output supported by adequate thermal management',
      upgrades: ['oil-cooler', 'radiator-upgrade'],
    });
  }

  return synergies;
}

/**
 * Generate a human-readable validation summary
 */
function generateValidationSummary(grouped, synergies) {
  if (grouped.critical.length > 0) {
    return `${grouped.critical.length} critical issue(s) need attention before proceeding`;
  }

  if (grouped.warnings.length > 0) {
    const base = `${grouped.warnings.length} recommendation(s) for optimal results`;
    if (synergies.length > 0) {
      return `${base}, but ${synergies.length} good synergy(s) found`;
    }
    return base;
  }

  if (synergies.length > 0) {
    return `Great build! ${synergies.length} positive synergy(s) detected`;
  }

  return 'Build looks good - no issues detected';
}

// =============================================================================
// RECOMMENDATION FUNCTIONS
// =============================================================================

/**
 * Get recommended supporting upgrades based on current selection
 *
 * @param {string[]} selectedUpgradeKeys - Currently selected upgrades
 * @param {Object} car - Car object
 * @returns {Object[]} - Array of recommended upgrades with reasoning
 */
export function getRecommendedUpgrades(selectedUpgradeKeys, car) {
  const recommendations = [];
  const alreadySelected = new Set(selectedUpgradeKeys);

  // Collect all recommendations from the validation
  const validation = validateUpgradeSelection(selectedUpgradeKeys, car);

  // Extract recommendations from critical/warning results
  for (const issue of [...validation.critical, ...validation.warnings]) {
    if (issue.recommendation && issue.recommendation.length > 0) {
      for (const recKey of issue.recommendation) {
        if (!alreadySelected.has(recKey)) {
          const upgrade = getUpgradeByKey(recKey);
          if (upgrade) {
            recommendations.push({
              upgradeKey: recKey,
              upgrade,
              reason: issue.message,
              severity: issue.severity,
              ruleName: issue.ruleName,
            });
          }
        }
      }
    }
  }

  // Also check each selected upgrade's direct recommendations
  for (const key of selectedUpgradeKeys) {
    const deps = getUpgradeDependencies(key);
    if (deps?.recommends) {
      for (const recKey of deps.recommends) {
        if (!alreadySelected.has(recKey)) {
          const upgrade = getUpgradeByKey(recKey);
          const parentUpgrade = getUpgradeByKey(key);
          if (upgrade && !recommendations.find((r) => r.upgradeKey === recKey)) {
            recommendations.push({
              upgradeKey: recKey,
              upgrade,
              reason: `Pairs well with ${parentUpgrade?.name || key}`,
              severity: SEVERITY.INFO,
              ruleName: 'synergy',
            });
          }
        }
      }
    }
  }

  // Deduplicate and sort by severity
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  const unique = recommendations.reduce((acc, rec) => {
    const existing = acc.find((r) => r.upgradeKey === rec.upgradeKey);
    if (!existing || severityOrder[rec.severity] < severityOrder[existing.severity]) {
      return [...acc.filter((r) => r.upgradeKey !== rec.upgradeKey), rec];
    }
    return acc;
  }, []);

  return unique.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * Equivalent upgrade mappings - some requirements can be satisfied by multiple variants
 * For example, 'ecu-tune' requirement is satisfied by any tune variant
 */
const EQUIVALENT_UPGRADES = {
  'ecu-tune': [
    'tune-street',
    'tune-track',
    'stage1-tune',
    'stage2-tune',
    'stage3-tune',
    'dct-tune',
    'piggyback-tuner',
  ],
};

/**
 * Check if a requirement is satisfied by the selected upgrades
 * Handles equivalent upgrades (e.g., any tune variant satisfies 'ecu-tune')
 */
function isRequirementSatisfied(reqKey, selectedUpgradeKeys) {
  // Direct match
  if (selectedUpgradeKeys.includes(reqKey)) return true;

  // Check if any equivalent upgrade is selected
  const equivalents = EQUIVALENT_UPGRADES[reqKey];
  if (equivalents) {
    return equivalents.some((eq) => selectedUpgradeKeys.includes(eq));
  }

  return false;
}

/**
 * Get required upgrades (hard dependencies) for current selection
 * These are recommended to achieve maximum performance gains
 *
 * @param {string[]} selectedUpgradeKeys - Currently selected upgrades
 * @param {Object} car - Car object
 * @returns {Object[]} - Array of required upgrades
 */
export function getRequiredUpgrades(selectedUpgradeKeys, car) {
  const required = [];

  for (const key of selectedUpgradeKeys) {
    const deps = getUpgradeDependencies(key);
    if (deps?.requires) {
      for (const reqKey of deps.requires) {
        // Use equivalent check - e.g., tune-track satisfies ecu-tune requirement
        if (!isRequirementSatisfied(reqKey, selectedUpgradeKeys)) {
          const upgrade = getUpgradeByKey(reqKey);
          const parentUpgrade = getUpgradeByKey(key);
          if (upgrade && !required.find((r) => r.upgradeKey === reqKey)) {
            required.push({
              upgradeKey: reqKey,
              upgrade,
              requiredBy: parentUpgrade?.name || key,
              reason: `Recommended to achieve max performance gains from ${parentUpgrade?.name || key}`,
            });
          }
        }
      }
    }
  }

  return required;
}

// =============================================================================
// IMPACT SUMMARY FUNCTIONS
// =============================================================================

/**
 * Get a detailed impact summary for an upgrade
 * Shows what systems are affected and how
 *
 * @param {string} upgradeKey - The upgrade to analyze
 * @returns {Object|null} - Impact summary or null if upgrade not found
 */
export function getUpgradeImpactSummary(upgradeKey) {
  const summary = getUpgradeSummary(upgradeKey);
  if (!summary) return null;

  const upgrade = getUpgradeByKey(upgradeKey);

  return {
    upgrade: upgrade || { key: upgradeKey, name: upgradeKey },
    impacts: {
      improves: summary.improves.map((name) => ({
        name,
        icon: '↑',
        type: 'positive',
        description: `Directly improves ${name.toLowerCase()}`,
      })),
      modifies: summary.modifies.map((name) => ({
        name,
        icon: '↔',
        type: 'neutral',
        description: `Changes ${name.toLowerCase()} - may require adjustment`,
      })),
      stresses: summary.stresses.map((name) => ({
        name,
        icon: '⚠',
        type: 'warning',
        description: `Increases load on ${name.toLowerCase()} - verify capacity`,
      })),
      invalidates: summary.invalidates.map((name) => ({
        name,
        icon: '⟳',
        type: 'info',
        description: `${name} needs recalibration/realignment`,
      })),
      compromises: summary.compromises.map((name) => ({
        name,
        icon: '⚡',
        type: 'caution',
        description: `May negatively affect ${name.toLowerCase()}`,
      })),
    },
    dependencies: {
      requires: summary.requires,
      recommends: summary.recommends,
    },
  };
}

/**
 * Get a compact summary of all systems affected by selected upgrades
 *
 * @param {string[]} selectedUpgradeKeys - Selected upgrade keys
 * @returns {Object[]} - Array of affected systems with impact counts
 */
export function getSystemImpactOverview(selectedUpgradeKeys) {
  const systemImpacts = {};

  for (const key of selectedUpgradeKeys) {
    const deps = getUpgradeDependencies(key);
    if (!deps) continue;

    // Process all impact types
    const impactTypes = ['improves', 'modifies', 'stresses', 'invalidates', 'compromises'];

    for (const impactType of impactTypes) {
      const impactedNodes = deps[impactType] || [];

      for (const nodeKey of impactedNodes) {
        const systemKey = nodeKey.split('.')[0];
        const system = systems[systemKey];

        if (system) {
          if (!systemImpacts[systemKey]) {
            systemImpacts[systemKey] = {
              system,
              improves: 0,
              modifies: 0,
              stresses: 0,
              invalidates: 0,
              compromises: 0,
              affectedNodes: new Set(),
            };
          }

          systemImpacts[systemKey][impactType]++;
          systemImpacts[systemKey].affectedNodes.add(nodeKey);
        }
      }
    }
  }

  // Convert to array and add summary
  return Object.values(systemImpacts)
    .map((impact) => ({
      ...impact,
      affectedNodes: Array.from(impact.affectedNodes),
      totalImpacts:
        impact.improves +
        impact.modifies +
        impact.stresses +
        impact.invalidates +
        impact.compromises,
      netImpact: impact.improves - impact.stresses - impact.compromises,
    }))
    .sort((a, b) => b.totalImpacts - a.totalImpacts);
}

// =============================================================================
// SCENARIO ANALYSIS
// =============================================================================

/**
 * Analyze a specific scenario and explain the chain of dependencies
 * Useful for educational content in the UI
 *
 * @param {string} scenarioType - 'boost_increase' | 'sticky_tires' | 'lowering' | 'bbk'
 * @param {Object} options - Scenario-specific options
 * @returns {Object} - Detailed scenario analysis
 */
export function analyzeScenario(scenarioType, options = {}) {
  const scenarios = {
    boost_increase: {
      name: 'ECU Tune / Boost Increase',
      description: 'Increasing boost pressure affects multiple interconnected systems',
      primaryEffect: 'More power through higher cylinder pressure',
      chainOfEffects: [
        {
          step: 1,
          action: 'Increase boost via ECU tune',
          affects: 'Cylinder pressure, combustion temps',
          consequence: 'More power, but increased stress on engine',
        },
        {
          step: 2,
          action: 'Higher boost needs more fuel',
          affects: 'Injectors, HPFP, fuel pressure',
          consequence: 'Must verify fuel system can deliver required volume',
        },
        {
          step: 3,
          action: 'Higher temps increase knock risk',
          affects: 'Timing, spark plugs, knock sensors',
          consequence: 'May need colder plugs, timing adjustment, higher octane fuel',
        },
        {
          step: 4,
          action: 'More exhaust volume produced',
          affects: 'Exhaust flow, backpressure, cat converter',
          consequence: 'Stock exhaust may become a bottleneck',
        },
        {
          step: 5,
          action: 'Intercooler works harder',
          affects: 'Charge air temps, intercooler capacity',
          consequence: 'Heat soak becomes a concern on hot days/track',
        },
        {
          step: 6,
          action: 'More heat generated overall',
          affects: 'Radiator, oil cooler capacity',
          consequence: 'Sustained high-boost use needs better cooling',
        },
        {
          step: 7,
          action: 'More torque to drivetrain',
          affects: 'Clutch, transmission, axles',
          consequence: 'Stock clutch may slip, axles may be weak link',
        },
      ],
      recommendedUpgrades: ['hpfp-upgrade', 'intercooler', 'oil-cooler', 'clutch-upgrade'],
    },

    sticky_tires: {
      name: 'Stickier Tires (Track Compound)',
      description: 'Higher grip tires increase demands on braking and suspension systems',
      primaryEffect: 'More mechanical grip, higher cornering speeds',
      chainOfEffects: [
        {
          step: 1,
          action: 'Install 200TW or R-compound tires',
          affects: 'Grip coefficient, contact patch',
          consequence: 'Much higher cornering and braking forces possible',
        },
        {
          step: 2,
          action: 'Brakes can now work much harder',
          affects: 'Brake pad temps, rotor temps',
          consequence: 'Stock pads may overheat and fade quickly',
        },
        {
          step: 3,
          action: 'Brake fluid heats up faster',
          affects: 'Fluid boiling point, pedal feel',
          consequence: 'DOT 3/4 fluid may boil - spongy/no pedal',
        },
        {
          step: 4,
          action: 'Rotors absorb more heat',
          affects: 'Thermal capacity, rotor warping',
          consequence: 'May need larger rotors or better cooling',
        },
        {
          step: 5,
          action: 'ABS sees different slip ratios',
          affects: 'ABS calibration, intervention',
          consequence: 'Factory ABS may intervene too early or late',
        },
        {
          step: 6,
          action: 'If upgrading brakes, bias changes',
          affects: 'Front/rear brake balance',
          consequence: 'Must verify brake bias is still appropriate',
        },
        {
          step: 7,
          action: 'Tire width may require alignment',
          affects: 'Camber, toe settings',
          consequence: 'New tires often benefit from alignment adjustment',
        },
      ],
      recommendedUpgrades: ['brake-pads-track', 'brake-fluid-lines', 'big-brake-kit'],
    },

    lowering: {
      name: 'Lowering the Car',
      description: 'Reducing ride height affects suspension geometry and damper operation',
      primaryEffect: 'Lower center of gravity, reduced body roll',
      chainOfEffects: [
        {
          step: 1,
          action: 'Install lowering springs or coilovers',
          affects: 'Ride height, spring rate',
          consequence: 'Lower CG, but geometry changes',
        },
        {
          step: 2,
          action: 'Dampers operate in different range',
          affects: 'Damper stroke, bump travel',
          consequence: 'May bottom out on bumps, dampers not in optimal range',
        },
        {
          step: 3,
          action: 'Control arm angles change',
          affects: 'Suspension geometry, roll center',
          consequence: 'May need roll center correction kit',
        },
        {
          step: 4,
          action: 'Camber changes (usually more negative)',
          affects: 'Tire wear, grip balance',
          consequence: 'Need alignment, possible camber correction',
        },
        {
          step: 5,
          action: 'Roll center drops',
          affects: 'Jacking force, steering feel',
          consequence: 'May feel less responsive, steering lighter',
        },
        {
          step: 6,
          action: 'Bump steer may increase',
          affects: 'Toe change over travel',
          consequence: 'Car may dart over bumps',
        },
        {
          step: 7,
          action: 'Extreme drops affect Ackermann',
          affects: 'Steering geometry, turn-in',
          consequence: 'Very low cars may need steering geometry correction',
        },
      ],
      recommendedUpgrades: ['performance-alignment', 'sway-bars'],
    },

    bbk: {
      name: 'Big Brake Kit',
      description: 'Larger brakes require supporting mods and affect balance',
      primaryEffect: 'More stopping power and thermal capacity',
      chainOfEffects: [
        {
          step: 1,
          action: 'Install larger rotors and calipers',
          affects: 'Brake torque, thermal mass',
          consequence: 'Much stronger braking, better heat management',
        },
        {
          step: 2,
          action: 'Front brake torque increases',
          affects: 'Brake bias',
          consequence: 'May have more front bias than ideal',
        },
        {
          step: 3,
          action: 'More heat generated in calipers',
          affects: 'Brake fluid temperature',
          consequence: 'High-temp fluid more important than ever',
        },
        {
          step: 4,
          action: 'Larger rotors benefit from cooling',
          affects: 'Rotor surface temps',
          consequence: 'Brake ducts become more effective',
        },
        {
          step: 5,
          action: 'May require different wheels',
          affects: 'Wheel clearance',
          consequence: 'Stock wheels may not clear larger calipers',
        },
      ],
      recommendedUpgrades: ['brake-pads-track', 'brake-fluid-lines'],
    },
  };

  return scenarios[scenarioType] || null;
}

// =============================================================================
// EXPORTS
// =============================================================================

const dependencyChecker = {
  validateUpgradeSelection,
  getRecommendedUpgrades,
  getRequiredUpgrades,
  getUpgradeImpactSummary,
  getSystemImpactOverview,
  analyzeScenario,
  SEVERITY,
};

export default dependencyChecker;
