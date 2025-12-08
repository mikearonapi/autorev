#!/usr/bin/env node
/**
 * Matrix Coverage Checker
 * 
 * This script validates that all upgrade keys from upgradePackages are mapped
 * in the connectedTissueMatrix's upgradeNodeMap.
 * 
 * Run: node scripts/check-matrix-coverage.mjs
 */

import { upgradeNodeMap, nodes, systems, dependencyRules } from '../data/connectedTissueMatrix.js';
import genericPackages, { upgradeModules } from '../data/upgradePackages.js';
import { upgradeDetails } from '../data/upgradeEducation.js';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║       Connected Tissue Matrix - Coverage Checker            ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

// =============================================================================
// 1. Collect all upgrade keys from different sources
// =============================================================================

const upgradePackageKeys = new Set();
const upgradeModuleKeys = new Set();
const educationKeys = new Set();

// From genericPackages (tier-based packages)
genericPackages.forEach(pkg => {
  if (pkg.includedUpgradeKeys) {
    pkg.includedUpgradeKeys.forEach(key => upgradePackageKeys.add(key));
  }
});

// From upgradeModules (individual modules)
upgradeModules.forEach(mod => {
  if (mod.key) {
    upgradeModuleKeys.add(mod.key);
  }
});

// From upgradeDetails (encyclopedia)
Object.keys(upgradeDetails).forEach(key => {
  educationKeys.add(key);
});

// Combine all
const allUpgradeKeys = new Set([...upgradePackageKeys, ...upgradeModuleKeys, ...educationKeys]);

// =============================================================================
// 2. Check coverage in upgradeNodeMap
// =============================================================================

const mappedKeys = new Set(Object.keys(upgradeNodeMap));
const missingFromMatrix = [];
const mappedButNoModule = [];

allUpgradeKeys.forEach(key => {
  if (!mappedKeys.has(key)) {
    missingFromMatrix.push(key);
  }
});

mappedKeys.forEach(key => {
  if (!allUpgradeKeys.has(key)) {
    mappedButNoModule.push(key);
  }
});

// =============================================================================
// 3. Report Results
// =============================================================================

console.log(`${colors.cyan}── Matrix Statistics ─────────────────────────────────────────${colors.reset}`);
console.log(`   Systems defined:        ${Object.keys(systems).length}`);
console.log(`   Nodes defined:          ${Object.keys(nodes).length}`);
console.log(`   Dependency rules:       ${dependencyRules.length}`);
console.log(`   Upgrades in NodeMap:    ${mappedKeys.size}`);
console.log(`   Total unique upgrades:  ${allUpgradeKeys.size}`);
console.log('');

// Coverage percentage
const coverage = ((mappedKeys.size / allUpgradeKeys.size) * 100).toFixed(1);
const coverageColor = coverage >= 80 ? colors.green : coverage >= 50 ? colors.yellow : colors.red;
console.log(`${colors.cyan}── Coverage ──────────────────────────────────────────────────${colors.reset}`);
console.log(`   ${coverageColor}${coverage}% of upgrades are mapped in the matrix${colors.reset}`);
console.log('');

// Missing from matrix (upgrades exist but aren't mapped)
if (missingFromMatrix.length > 0) {
  console.log(`${colors.yellow}── Missing from Matrix (${missingFromMatrix.length}) ────────────────────────────${colors.reset}`);
  console.log(`   ${colors.dim}These upgrades exist but aren't mapped in upgradeNodeMap:${colors.reset}`);
  missingFromMatrix.sort().forEach(key => {
    console.log(`   ${colors.yellow}•${colors.reset} ${key}`);
  });
  console.log('');
} else {
  console.log(`${colors.green}✓ All upgrades are mapped in the matrix!${colors.reset}\n`);
}

// Mapped but no module (in matrix but not in upgradePackages)
if (mappedButNoModule.length > 0) {
  console.log(`${colors.dim}── In Matrix but not in Packages (${mappedButNoModule.length}) ────────────────────${colors.reset}`);
  console.log(`   ${colors.dim}These are in upgradeNodeMap but not found in upgrade modules:${colors.reset}`);
  mappedButNoModule.sort().forEach(key => {
    console.log(`   ${colors.dim}•${colors.reset} ${key}`);
  });
  console.log('');
}

// =============================================================================
// 4. Check for invalid node references in upgradeNodeMap
// =============================================================================

const allNodeKeys = new Set(Object.keys(nodes));
const invalidNodeRefs = [];

Object.entries(upgradeNodeMap).forEach(([upgradeKey, mapping]) => {
  const allRefs = [
    ...(mapping.improves || []),
    ...(mapping.modifies || []),
    ...(mapping.stresses || []),
    ...(mapping.invalidates || []),
    ...(mapping.compromises || []),
  ];
  
  allRefs.forEach(nodeKey => {
    if (!allNodeKeys.has(nodeKey)) {
      invalidNodeRefs.push({ upgradeKey, nodeKey });
    }
  });
});

if (invalidNodeRefs.length > 0) {
  console.log(`${colors.red}── Invalid Node References (${invalidNodeRefs.length}) ──────────────────────────${colors.reset}`);
  console.log(`   ${colors.dim}These upgradeNodeMap entries reference non-existent nodes:${colors.reset}`);
  invalidNodeRefs.forEach(({ upgradeKey, nodeKey }) => {
    console.log(`   ${colors.red}•${colors.reset} ${upgradeKey} → ${nodeKey}`);
  });
  console.log('');
} else {
  console.log(`${colors.green}✓ All node references are valid!${colors.reset}\n`);
}

// =============================================================================
// 5. Summary
// =============================================================================

const hasIssues = missingFromMatrix.length > 0 || invalidNodeRefs.length > 0;

console.log(`${colors.cyan}══════════════════════════════════════════════════════════════${colors.reset}`);
if (hasIssues) {
  console.log(`${colors.yellow}⚠ Matrix has some gaps - consider adding missing mappings${colors.reset}`);
} else {
  console.log(`${colors.green}✓ Matrix coverage is complete!${colors.reset}`);
}
console.log(`${colors.cyan}══════════════════════════════════════════════════════════════${colors.reset}\n`);

// Exit with error code if there are issues
process.exit(hasIssues ? 1 : 0);

