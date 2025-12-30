#!/usr/bin/env node
/**
 * Matrix Scenario Tester
 * 
 * Tests the Connected Tissue Matrix with various example builds to verify
 * the dependency checking logic produces sensible warnings and synergies.
 * 
 * Run: node scripts/test-matrix-scenarios.mjs
 */

import {
  checkDependencies,
  getUpgradeDependencies,
  getAffectedSystems,
  upgradeNodeMap,
  dependencyRules,
  systems,
} from '../data/connectedTissueMatrix.js';
import { getEngineType } from '../data/upgradePackages.js';

// =============================================================================
// INLINE IMPLEMENTATION (mirrors lib/dependencyChecker.js for Node.js)
// =============================================================================

const SEVERITY = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info',
  POSITIVE: 'positive',
};

function validateUpgradeSelection(selectedUpgradeKeys, car, options = {}) {
  const { usageProfile = 'mixed' } = options;
  const engineType = car ? getEngineType(car) : 'unknown';
  
  // Run all dependency rules
  const ruleResults = checkDependencies(selectedUpgradeKeys);
  
  // Filter results
  const filteredResults = ruleResults.filter(result => {
    if (result.ruleId?.includes('boost') || result.ruleId?.includes('intercooler')) {
      if (!engineType.includes('Turbo') && !engineType.includes('SC')) {
        return false;
      }
    }
    return true;
  });
  
  // Group by severity
  const grouped = {
    critical: filteredResults.filter(r => r.severity === SEVERITY.CRITICAL),
    warnings: filteredResults.filter(r => r.severity === SEVERITY.WARNING),
    info: filteredResults.filter(r => r.severity === SEVERITY.INFO),
  };
  
  // Check synergies
  const synergies = checkPositiveSynergies(selectedUpgradeKeys);
  
  // Get affected systems
  const affectedSystems = getAffectedSystems(selectedUpgradeKeys);
  
  return {
    isValid: grouped.critical.length === 0,
    critical: grouped.critical,
    warnings: grouped.warnings,
    info: grouped.info,
    synergies,
    affectedSystems: Array.from(affectedSystems).map(s => systems[s]),
    totalIssues: grouped.critical.length + grouped.warnings.length,
  };
}

function checkPositiveSynergies(selectedUpgradeKeys) {
  const synergies = [];
  
  // Bolt-on synergy
  const hasIntake = selectedUpgradeKeys.some(k => k.includes('intake'));
  const hasExhaust = selectedUpgradeKeys.some(k => k.includes('exhaust') || k === 'headers' || k === 'downpipe');
  const hasTune = selectedUpgradeKeys.some(k => k.includes('tune'));
  
  if (hasIntake && hasExhaust && hasTune) {
    synergies.push({
      type: 'positive',
      name: 'Full Bolt-On Package',
      message: 'Intake + exhaust + tune work together for maximum bolt-on gains',
    });
  }
  
  // Suspension synergy
  const hasSuspension = selectedUpgradeKeys.some(k => 
    k.includes('coilovers') || k.includes('lowering-springs')
  );
  const hasAlignment = selectedUpgradeKeys.includes('performance-alignment');
  const hasSwayBars = selectedUpgradeKeys.includes('sway-bars');
  
  if (hasSuspension && (hasAlignment || hasSwayBars)) {
    synergies.push({
      type: 'positive',
      name: 'Complete Chassis Package',
      message: 'Suspension upgrades combined with proper setup for balanced handling',
    });
  }
  
  // Power + cooling synergy
  const hasPowerMod = selectedUpgradeKeys.some(k => 
    k.includes('supercharger') || k.includes('turbo') || k.includes('stage3')
  );
  const hasCooling = selectedUpgradeKeys.includes('oil-cooler') || 
                     selectedUpgradeKeys.includes('radiator-upgrade');
  
  if (hasPowerMod && hasCooling) {
    synergies.push({
      type: 'positive',
      name: 'Power with Proper Cooling',
      message: 'High power output supported by adequate thermal management',
    });
  }
  
  return synergies;
}

// Scenario analysis (simplified inline version)
function analyzeScenario(scenarioType) {
  const scenarios = {
    boost_increase: {
      name: 'ECU Tune / Boost Increase',
      description: 'Increasing boost pressure affects multiple interconnected systems',
      chainOfEffects: [
        { step: 1, action: 'Increase boost via ECU tune' },
        { step: 2, action: 'Higher boost needs more fuel' },
        { step: 3, action: 'Higher temps increase knock risk' },
        { step: 4, action: 'More exhaust volume produced' },
        { step: 5, action: 'Intercooler works harder' },
        { step: 6, action: 'More heat generated overall' },
        { step: 7, action: 'More torque to drivetrain' },
      ],
      recommendedUpgrades: ['hpfp-upgrade', 'intercooler', 'oil-cooler', 'clutch-upgrade'],
    },
    sticky_tires: {
      name: 'Stickier Tires (Track Compound)',
      description: 'Higher grip tires increase demands on braking and suspension systems',
      chainOfEffects: [
        { step: 1, action: 'Install 200TW or R-compound tires' },
        { step: 2, action: 'Brakes can now work much harder' },
        { step: 3, action: 'Brake fluid heats up faster' },
        { step: 4, action: 'Rotors absorb more heat' },
        { step: 5, action: 'ABS sees different slip ratios' },
        { step: 6, action: 'If upgrading brakes, bias changes' },
        { step: 7, action: 'Tire width may require alignment' },
      ],
      recommendedUpgrades: ['brake-pads-track', 'brake-fluid-lines', 'big-brake-kit'],
    },
    lowering: {
      name: 'Lowering the Car',
      description: 'Reducing ride height affects suspension geometry and damper operation',
      chainOfEffects: [
        { step: 1, action: 'Install lowering springs or coilovers' },
        { step: 2, action: 'Dampers operate in different range' },
        { step: 3, action: 'Control arm angles change' },
        { step: 4, action: 'Camber changes (usually more negative)' },
        { step: 5, action: 'Roll center drops' },
        { step: 6, action: 'Bump steer may increase' },
        { step: 7, action: 'Extreme drops affect Ackermann' },
      ],
      recommendedUpgrades: ['performance-alignment', 'sway-bars'],
    },
    bbk: {
      name: 'Big Brake Kit',
      description: 'Larger brakes require supporting mods and affect balance',
      chainOfEffects: [
        { step: 1, action: 'Install larger rotors and calipers' },
        { step: 2, action: 'Front brake torque increases' },
        { step: 3, action: 'More heat generated in calipers' },
        { step: 4, action: 'Larger rotors benefit from cooling' },
        { step: 5, action: 'May require different wheels' },
      ],
      recommendedUpgrades: ['brake-pads-track', 'brake-fluid-lines'],
    },
  };
  
  return scenarios[scenarioType] || null;
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
};

// Example cars
const turboCar = {
  slug: 'bmw-m3',
  make: 'BMW',
  model: 'M3',
  year: 2021,
  hp: 473,
  torque: 406,
  engine: 'Twin-Turbo 3.0L I6 (S58)',
  zeroToSixty: 3.8,
};

const naCar = {
  slug: 'porsche-911-gt3',
  make: 'Porsche',
  model: '911 GT3',
  year: 2022,
  hp: 502,
  torque: 346,
  engine: 'NA 4.0L Flat-6',
  zeroToSixty: 3.2,
};

const muscleCar = {
  slug: 'shelby-gt350',
  make: 'Ford',
  model: 'Shelby GT350',
  year: 2020,
  hp: 526,
  torque: 429,
  engine: 'NA 5.2L V8 (Voodoo)',
  zeroToSixty: 3.9,
};

// Test scenarios
const scenarios = [
  {
    name: 'Stage 2 Turbo Street Build',
    car: turboCar,
    upgrades: ['stage2-tune', 'downpipe', 'intercooler'],
    expectedCritical: 0,
    expectedWarnings: 1, // Charge pipes warning
    description: 'Complete Stage 2 build with supporting mods',
  },
  {
    name: 'Stage 2 Without Supporting Mods',
    car: turboCar,
    upgrades: ['stage2-tune'],
    expectedCritical: 0,
    expectedWarnings: 2, // Intercooler + charge pipes recommended
    description: 'Stage 2 tune alone should flag supporting mod recommendations',
  },
  {
    name: 'Stage 3 Without Fuel System',
    car: turboCar,
    upgrades: ['stage3-tune', 'turbo-upgrade-existing', 'intercooler'],
    expectedCritical: 1, // Missing fuel system
    description: 'Big power mods without fuel support',
  },
  // Note: Tire-related test scenarios removed - tire compound is now handled by WheelTireConfigurator
  {
    name: 'Complete Suspension Build',
    car: muscleCar,
    upgrades: ['coilovers-track', 'sway-bars', 'performance-alignment', 'chassis-bracing'],
    expectedSynergies: 1, // Suspension synergy
    description: 'Proper suspension upgrade with alignment',
  },
  {
    name: 'Lowering Without Alignment',
    car: muscleCar,
    upgrades: ['lowering-springs'],
    expectedInfo: 1, // Alignment recommended
    description: 'Lowering should suggest alignment',
  },
  {
    name: 'Big Supercharger Build Without Engine Build',
    car: muscleCar,
    upgrades: ['supercharger-roots', 'fuel-system-upgrade', 'intercooler', 'clutch-upgrade'],
    expectedWarnings: 1, // Forged internals recommendation
    description: 'FI kit should suggest engine internals for reliability',
  },
  {
    name: 'Ultimate Power Build - Complete',
    car: muscleCar,
    upgrades: [
      'supercharger-roots', 'fuel-system-upgrade', 'heat-exchanger-sc',
      'forged-internals', 'clutch-upgrade', 'oil-cooler', 'radiator-upgrade'
    ],
    expectedCritical: 0,
    expectedSynergies: 1, // Power + cooling synergy
    description: 'Complete high-power build with supporting mods',
  },
];

// Run tests
console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║       Connected Tissue Matrix - Scenario Tests              ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

let passed = 0;
let failed = 0;

scenarios.forEach((scenario, index) => {
  console.log(`${colors.cyan}── Test ${index + 1}: ${scenario.name} ────────────────────${colors.reset}`);
  console.log(`   ${colors.dim}${scenario.description}${colors.reset}`);
  console.log(`   ${colors.dim}Car: ${scenario.car.make} ${scenario.car.model} (${scenario.car.engine})${colors.reset}`);
  console.log(`   ${colors.dim}Upgrades: ${scenario.upgrades.join(', ')}${colors.reset}`);
  console.log('');
  
  const result = validateUpgradeSelection(scenario.upgrades, scenario.car);
  
  // Display results
  console.log(`   ${colors.bold}Results:${colors.reset}`);
  console.log(`   • Valid: ${result.isValid ? colors.green + '✓' : colors.red + '✗'} ${result.isValid}${colors.reset}`);
  console.log(`   • Critical Issues: ${result.critical.length}`);
  console.log(`   • Warnings: ${result.warnings.length}`);
  console.log(`   • Info: ${result.info.length}`);
  console.log(`   • Synergies: ${result.synergies.length}`);
  
  if (result.critical.length > 0) {
    console.log(`   ${colors.red}Critical:${colors.reset}`);
    result.critical.forEach(c => console.log(`     - ${c.message}`));
  }
  
  if (result.warnings.length > 0) {
    console.log(`   ${colors.yellow}Warnings:${colors.reset}`);
    result.warnings.forEach(w => console.log(`     - ${w.message}`));
  }
  
  if (result.synergies.length > 0) {
    console.log(`   ${colors.green}Synergies:${colors.reset}`);
    result.synergies.forEach(s => console.log(`     - ${s.name}: ${s.message}`));
  }
  
  // Check expectations
  let testPassed = true;
  const issues = [];
  
  if (scenario.expectedCritical !== undefined && result.critical.length !== scenario.expectedCritical) {
    testPassed = false;
    issues.push(`Expected ${scenario.expectedCritical} critical, got ${result.critical.length}`);
  }
  
  if (scenario.expectedWarnings !== undefined && result.warnings.length < scenario.expectedWarnings) {
    testPassed = false;
    issues.push(`Expected at least ${scenario.expectedWarnings} warnings, got ${result.warnings.length}`);
  }
  
  if (scenario.expectedInfo !== undefined && result.info.length < scenario.expectedInfo) {
    testPassed = false;
    issues.push(`Expected at least ${scenario.expectedInfo} info, got ${result.info.length}`);
  }
  
  if (scenario.expectedSynergies !== undefined && result.synergies.length < scenario.expectedSynergies) {
    testPassed = false;
    issues.push(`Expected at least ${scenario.expectedSynergies} synergies, got ${result.synergies.length}`);
  }
  
  if (testPassed) {
    console.log(`   ${colors.green}✓ Test Passed${colors.reset}`);
    passed++;
  } else {
    console.log(`   ${colors.red}✗ Test Failed${colors.reset}`);
    issues.forEach(issue => console.log(`     ${colors.red}• ${issue}${colors.reset}`));
    failed++;
  }
  
  console.log('');
});

// Scenario Analysis Demo
console.log(`${colors.cyan}── Scenario Analysis Demo ────────────────────────────────────${colors.reset}`);

['boost_increase', 'sticky_tires', 'lowering', 'bbk'].forEach(type => {
  const analysis = analyzeScenario(type);
  if (analysis) {
    console.log(`\n   ${colors.magenta}${analysis.name}${colors.reset}`);
    console.log(`   ${colors.dim}${analysis.description}${colors.reset}`);
    console.log(`   ${colors.dim}Chain has ${analysis.chainOfEffects.length} steps${colors.reset}`);
    console.log(`   ${colors.dim}Recommended: ${analysis.recommendedUpgrades.join(', ')}${colors.reset}`);
  }
});

// Summary
console.log(`\n${colors.cyan}══════════════════════════════════════════════════════════════${colors.reset}`);
console.log(`   ${colors.bold}Test Summary:${colors.reset} ${colors.green}${passed} passed${colors.reset}, ${failed > 0 ? colors.red : colors.dim}${failed} failed${colors.reset}`);
console.log(`${colors.cyan}══════════════════════════════════════════════════════════════${colors.reset}\n`);

process.exit(failed > 0 ? 1 : 0);

