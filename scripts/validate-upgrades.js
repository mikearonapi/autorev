#!/usr/bin/env node
/**
 * AutoRev - Upgrade Data Consistency Validator
 * 
 * This script validates that all upgrade keys referenced across the codebase
 * resolve to actual entries in the upgrade encyclopedia or modules.
 * 
 * Run with: node scripts/validate-upgrades.js
 */

const { upgradeDetails } = require('../data/upgradeEducation.js');
const { upgradeModules, genericPackages } = require('../data/upgradePackages.js');
const { carUpgradeRecommendations } = require('../data/carUpgradeRecommendations.js');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  log(`═══════════════════════════════════════════════════════════════`, colors.cyan);
  log(` ${title}`, colors.bright + colors.cyan);
  log(`═══════════════════════════════════════════════════════════════`, colors.cyan);
}

function logSuccess(message) {
  log(`  ✓ ${message}`, colors.green);
}

function logError(message) {
  log(`  ✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`  ⚠ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`  ℹ ${message}`, colors.blue);
}

// Collect all available upgrade keys
const educationKeys = new Set(Object.keys(upgradeDetails));
const moduleKeys = new Set(upgradeModules.map(m => m.key));
const allAvailableKeys = new Set([...educationKeys, ...moduleKeys]);

let totalErrors = 0;
let totalWarnings = 0;

// ============================================================================
// Validate Generic Packages
// ============================================================================
logSection('Validating Generic Packages (includedUpgradeKeys)');

genericPackages.forEach(pkg => {
  if (!pkg.includedUpgradeKeys) {
    logWarning(`Package "${pkg.key}" has no includedUpgradeKeys defined`);
    totalWarnings++;
    return;
  }
  
  const missing = pkg.includedUpgradeKeys.filter(k => !allAvailableKeys.has(k));
  
  if (missing.length > 0) {
    logError(`Package "${pkg.key}" has unresolved keys: ${missing.join(', ')}`);
    totalErrors += missing.length;
  } else {
    logSuccess(`Package "${pkg.key}": All ${pkg.includedUpgradeKeys.length} keys resolve`);
  }
});

// ============================================================================
// Validate Module Dependencies
// ============================================================================
logSection('Validating Module Dependencies (requires/stronglyRecommended)');

upgradeModules.forEach(mod => {
  const allDeps = [...(mod.requires || []), ...(mod.stronglyRecommended || [])];
  
  if (allDeps.length === 0) return;
  
  const missing = allDeps.filter(k => !allAvailableKeys.has(k));
  
  if (missing.length > 0) {
    logError(`Module "${mod.key}" has unresolved dependencies: ${missing.join(', ')}`);
    totalErrors += missing.length;
  } else {
    logSuccess(`Module "${mod.key}": All ${allDeps.length} dependencies resolve`);
  }
});

// ============================================================================
// Validate Car-Specific Recommendations
// ============================================================================
logSection('Validating Car Upgrade Recommendations');

let totalCars = 0;
let carsWithIssues = 0;

Object.entries(carUpgradeRecommendations).forEach(([carSlug, rec]) => {
  totalCars++;
  let carHasIssues = false;
  
  if (!rec.tiers) {
    logWarning(`Car "${carSlug}" has no tier recommendations defined`);
    totalWarnings++;
    return;
  }
  
  Object.entries(rec.tiers).forEach(([tier, tierRec]) => {
    const allKeys = [
      ...(tierRec.mustHave || []),
      ...(tierRec.recommended || []),
      ...(tierRec.niceToHave || []),
    ];
    
    const missing = allKeys.filter(k => !allAvailableKeys.has(k));
    
    if (missing.length > 0) {
      logError(`${carSlug}/${tier} has unresolved keys: ${missing.join(', ')}`);
      totalErrors += missing.length;
      carHasIssues = true;
    }
  });
  
  if (carHasIssues) {
    carsWithIssues++;
  }
});

logInfo(`Checked ${totalCars} cars, ${carsWithIssues} have issues`);

// ============================================================================
// Validate Upgrade Encyclopedia Completeness
// ============================================================================
logSection('Validating Encyclopedia Entry Completeness');

let incompleteEntries = 0;

Object.entries(upgradeDetails).forEach(([key, upgrade]) => {
  const issues = [];
  
  if (!upgrade.name) issues.push('missing name');
  if (!upgrade.category) issues.push('missing category');
  if (!upgrade.shortDescription) issues.push('missing shortDescription');
  if (!upgrade.fullDescription) issues.push('missing fullDescription');
  if (!upgrade.cost) issues.push('missing cost');
  if (!upgrade.difficulty) issues.push('missing difficulty');
  if (!upgrade.pros || upgrade.pros.length === 0) issues.push('missing pros');
  if (!upgrade.cons || upgrade.cons.length === 0) issues.push('missing cons');
  if (!upgrade.bestFor || upgrade.bestFor.length === 0) issues.push('missing bestFor');
  
  if (issues.length > 0) {
    logWarning(`"${key}": ${issues.join(', ')}`);
    incompleteEntries++;
    totalWarnings += issues.length;
  }
});

if (incompleteEntries === 0) {
  logSuccess(`All ${Object.keys(upgradeDetails).length} encyclopedia entries are complete`);
} else {
  logInfo(`${incompleteEntries} entries have incomplete data`);
}

// ============================================================================
// Cross-Reference Analysis
// ============================================================================
logSection('Cross-Reference Analysis');

// Find keys in modules but not in education
const modulesOnlyKeys = [...moduleKeys].filter(k => !educationKeys.has(k));
if (modulesOnlyKeys.length > 0) {
  logInfo(`Keys in modules but not encyclopedia (${modulesOnlyKeys.length}):`);
  modulesOnlyKeys.forEach(k => log(`    - ${k}`, colors.yellow));
}

// Find keys in education but not in modules
const educationOnlyKeys = [...educationKeys].filter(k => !moduleKeys.has(k));
if (educationOnlyKeys.length > 0) {
  logInfo(`Keys in encyclopedia but not modules (${educationOnlyKeys.length}):`);
  logInfo(`  (This is normal - encyclopedia has educational content for upgrades not yet in performance modules)`);
}

// ============================================================================
// Test Specific Cars
// ============================================================================
logSection('Testing Key Car Scenarios');

const testCars = [
  '718-cayman-gt4',
  'shelby-gt350',
  'audi-rs5-b9',
  'bmw-m2-competition',
  'c7-corvette-z06',
];

testCars.forEach(carSlug => {
  const rec = carUpgradeRecommendations[carSlug];
  
  if (!rec) {
    logWarning(`Test car "${carSlug}" not found in recommendations`);
    return;
  }
  
  const tierCount = rec.tiers ? Object.keys(rec.tiers).length : 0;
  const defaultTier = rec.defaultTier || 'none';
  const hasNotes = rec.platformNotes && rec.platformNotes.length > 0;
  
  logInfo(`${carSlug}:`);
  log(`    Default tier: ${defaultTier}`, colors.reset);
  log(`    Tiers defined: ${tierCount}`, colors.reset);
  log(`    Has platform notes: ${hasNotes ? 'Yes' : 'No'}`, colors.reset);
  
  // Count total recommendations
  let totalRecs = 0;
  if (rec.tiers) {
    Object.values(rec.tiers).forEach(tierRec => {
      totalRecs += (tierRec.mustHave?.length || 0) +
                   (tierRec.recommended?.length || 0) +
                   (tierRec.niceToHave?.length || 0);
    });
  }
  log(`    Total recommendations: ${totalRecs}`, colors.reset);
});

// ============================================================================
// Summary
// ============================================================================
logSection('Summary');

console.log('');
log(`  Total Available Upgrade Keys: ${allAvailableKeys.size}`, colors.cyan);
log(`    - Encyclopedia entries: ${educationKeys.size}`, colors.reset);
log(`    - Module entries: ${moduleKeys.size}`, colors.reset);
console.log('');

if (totalErrors === 0 && totalWarnings === 0) {
  log(`  ✓ All validations passed!`, colors.green + colors.bright);
} else {
  if (totalErrors > 0) {
    log(`  ✗ Errors found: ${totalErrors}`, colors.red + colors.bright);
  }
  if (totalWarnings > 0) {
    log(`  ⚠ Warnings found: ${totalWarnings}`, colors.yellow + colors.bright);
  }
}

console.log('');

// Exit with error code if there are errors
process.exit(totalErrors > 0 ? 1 : 0);






