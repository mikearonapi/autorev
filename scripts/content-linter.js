/**
 * AutoRev - Content Linter
 * 
 * Validates educational content, descriptions, and metadata for quality issues.
 * Run with: node scripts/content-linter.js
 */

import carData from '../data/cars.js';
import { systems, nodes, edges } from '../data/connectedTissueMatrix.js';
import { upgradeCategories } from '../data/upgradeEducation.js';
import { performanceCategories } from '../data/performanceCategories.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// LINT CONFIGURATION
// =============================================================================

const LINT_RULES = {
  // Prohibited phrases that indicate low-quality or unsafe content
  prohibitedPhrases: [
    { pattern: /guaranteed/i, message: 'Avoid absolute guarantees' },
    { pattern: /100% safe/i, message: 'No modification is 100% safe' },
    { pattern: /no risk/i, message: 'All mods have some risk' },
    { pattern: /monkey see.*monkey do/i, message: 'Unprofessional language' },
    { pattern: /ez|noob/i, message: 'Informal gaming language' },
    { pattern: /trust me bro/i, message: 'Unprofessional language' },
    { pattern: /def(?:initely)?\s+won'?t.*break/i, message: 'Avoid absolute safety claims' },
  ],
  
  // Required disclaimer topics
  requiredDisclaimers: [
    { topic: 'forced induction', keywords: ['turbo', 'supercharg', 'boost'] },
    { topic: 'fuel system', keywords: ['fuel pump', 'injector'] },
    { topic: 'transmission', keywords: ['clutch', 'gear'] },
  ],
  
  // Unit consistency checks
  units: {
    power: ['hp', 'horsepower', 'bhp', 'whp'],
    torque: ['lb-ft', 'ft-lb', 'nm'],
    weight: ['lbs', 'pounds', 'kg'],
    speed: ['mph', 'km/h'],
    pressure: ['psi', 'bar'],
    displacement: ['L', 'cc', 'ci'],
  },
  
  // Minimum content lengths
  minLengths: {
    description: 50,
    overview: 100,
    systemDescription: 30,
    nodeDescription: 20,
  },
  
  // Required metadata fields
  requiredMetadata: {
    car: ['name', 'slug', 'brand', 'engine', 'drivetrain'],
    upgrade: ['name', 'description', 'tier'],
    node: ['name', 'system'],
    system: ['name', 'description'],
  },
};

// =============================================================================
// LINT RESULTS
// =============================================================================

const lintResults = {
  errors: [],
  warnings: [],
  info: [],
  checked: {
    cars: 0,
    systems: 0,
    nodes: 0,
    upgrades: 0,
    categories: 0,
  },
};

function error(source, field, message, value = null) {
  lintResults.errors.push({ source, field, message, value });
  console.log(`  ❌ ERROR [${source}] ${field}: ${message}`);
}

function warning(source, field, message, value = null) {
  lintResults.warnings.push({ source, field, message, value });
  console.log(`  ⚠️  WARN  [${source}] ${field}: ${message}`);
}

function info(source, field, message) {
  lintResults.info.push({ source, field, message });
  // Don't log info by default to reduce noise
}

// =============================================================================
// LINT CHECKS
// =============================================================================

function lintText(source, field, text) {
  if (!text || typeof text !== 'string') return;
  
  // Check for prohibited phrases
  for (const rule of LINT_RULES.prohibitedPhrases) {
    if (rule.pattern.test(text)) {
      warning(source, field, rule.message, text.substring(0, 100));
    }
  }
  
  // Check for inconsistent units
  const hasHP = /\d+\s*hp/i.test(text);
  const hasBHP = /\d+\s*bhp/i.test(text);
  const hasWHP = /\d+\s*whp/i.test(text);
  if (hasHP && hasBHP) {
    warning(source, field, 'Mixed HP/BHP units in same text');
  }
  
  // Check for broken links (markdown style)
  const brokenLinks = text.match(/\[([^\]]+)\]\(\s*\)/g);
  if (brokenLinks) {
    error(source, field, `Broken link(s): ${brokenLinks.length}`);
  }
  
  // Check for unclosed HTML tags (basic)
  const unclosedTags = text.match(/<(?:b|i|strong|em)[^>]*>(?:(?!<\/\1>).)*$/gi);
  if (unclosedTags) {
    warning(source, field, 'Potentially unclosed HTML tag');
  }
}

function lintCars() {
  console.log('\n🚗 LINTING CAR DATA');
  console.log('-'.repeat(50));
  
  for (const car of carData) {
    lintResults.checked.cars++;
    const source = car.slug || car.name || 'unknown';
    
    // Check required fields
    for (const field of LINT_RULES.requiredMetadata.car) {
      if (!car[field]) {
        error(source, field, 'Missing required field');
      }
    }
    
    // Check description length
    if (car.description) {
      if (car.description.length < LINT_RULES.minLengths.description) {
        warning(source, 'description', `Too short (${car.description.length} chars, min ${LINT_RULES.minLengths.description})`);
      }
      lintText(source, 'description', car.description);
    }
    
    // Check for common data entry errors
    if (car.hp && car.torque) {
      // HP and torque shouldn't be identical (unlikely for any car)
      if (car.hp === car.torque) {
        warning(source, 'hp/torque', 'HP and torque are identical (possible data error)');
      }
    }
    
    // Check 0-60 reasonableness
    if (car.zeroToSixty && car.hp && car.curbWeight) {
      const expectedMin = Math.max(2.0, 8 - (car.hp / car.curbWeight) * 30);
      if (car.zeroToSixty < expectedMin - 1) {
        info(source, 'zeroToSixty', 'Faster than typical for power-to-weight');
      }
    }
    
    // Check slug format
    if (car.slug && !/^[a-z0-9-]+$/.test(car.slug)) {
      error(source, 'slug', 'Invalid slug format (should be lowercase with hyphens)');
    }
  }
}

function lintSystems() {
  console.log('\n🔧 LINTING SYSTEMS');
  console.log('-'.repeat(50));
  
  for (const [key, system] of Object.entries(systems)) {
    lintResults.checked.systems++;
    
    // Check required fields
    if (!system.name) {
      error(key, 'name', 'Missing system name');
    }
    
    if (!system.description) {
      error(key, 'description', 'Missing system description');
    } else if (system.description.length < LINT_RULES.minLengths.systemDescription) {
      warning(key, 'description', `Too short (${system.description.length} chars)`);
    } else {
      lintText(key, 'description', system.description);
    }
  }
}

function lintNodes() {
  console.log('\n📦 LINTING NODES');
  console.log('-'.repeat(50));
  
  for (const [key, node] of Object.entries(nodes)) {
    lintResults.checked.nodes++;
    
    // Check required fields
    if (!node.name) {
      error(key, 'name', 'Missing node name');
    }
    
    if (!node.system) {
      error(key, 'system', 'Missing system reference');
    } else if (!systems[node.system]) {
      error(key, 'system', `References non-existent system: ${node.system}`);
    }
    
    // Check description if present
    if (node.description) {
      lintText(key, 'description', node.description);
    }
    
    // Check subsystem reference
    if (node.subsystem && !nodes[node.subsystem]) {
      warning(key, 'subsystem', `References non-existent subsystem: ${node.subsystem}`);
    }
  }
  
  // Check edge validity
  console.log('\n  Edge validation:');
  let edgeIssues = 0;
  
  for (const edge of edges) {
    if (!nodes[edge.from]) {
      error('edges', 'from', `Invalid source node: ${edge.from}`);
      edgeIssues++;
    }
    if (!nodes[edge.to]) {
      error('edges', 'to', `Invalid target node: ${edge.to}`);
      edgeIssues++;
    }
    if (!edge.type) {
      warning('edges', 'type', `Missing edge type: ${edge.from} -> ${edge.to}`);
    }
  }
  
  if (edgeIssues === 0) {
    console.log('  ✅ All edges reference valid nodes');
  }
}

function lintUpgradeEducation() {
  console.log('\n📚 LINTING UPGRADE EDUCATION');
  console.log('-'.repeat(50));
  
  if (!upgradeCategories || typeof upgradeCategories !== 'object') {
    error('upgradeCategories', 'root', 'Upgrade categories data not found or invalid');
    return;
  }
  
  for (const [category, content] of Object.entries(upgradeCategories)) {
    lintResults.checked.upgrades++;
    
    if (!content.name) {
      error(category, 'name', 'Missing category name');
    }
    
    if (!content.description) {
      warning(category, 'description', 'Missing category description');
    } else {
      lintText(category, 'description', content.description);
    }
    
    // Check tiers
    if (content.tiers) {
      for (const [tierKey, tier] of Object.entries(content.tiers)) {
        if (!tier.name) {
          warning(`${category}.${tierKey}`, 'name', 'Missing tier name');
        }
        if (!tier.description) {
          info(`${category}.${tierKey}`, 'description', 'Missing tier description');
        } else if (tier.description.length < 20) {
          warning(`${category}.${tierKey}`, 'description', 'Tier description too brief');
        }
      }
    }
  }
}

function lintPerformanceCategories() {
  console.log('\n📊 LINTING PERFORMANCE CATEGORIES');
  console.log('-'.repeat(50));
  
  const seenKeys = new Set();
  
  for (const category of performanceCategories) {
    lintResults.checked.categories++;
    
    if (!category.key) {
      error('category', 'key', 'Missing category key');
      continue;
    }
    
    if (seenKeys.has(category.key)) {
      error(category.key, 'key', 'Duplicate category key');
    }
    seenKeys.add(category.key);
    
    if (!category.label) {
      error(category.key, 'label', 'Missing category label');
    }
    
    if (!category.description) {
      warning(category.key, 'description', 'Missing category description');
    } else {
      lintText(category.key, 'description', category.description);
    }
  }
}

function lintCrossReferences() {
  console.log('\n🔗 LINTING CROSS-REFERENCES');
  console.log('-'.repeat(50));
  
  const carSlugs = new Set(carData.map(c => c.slug));
  const systemKeys = new Set(Object.keys(systems));
  const nodeKeys = new Set(Object.keys(nodes));
  
  // Check if any referenced slugs don't exist
  // This is placeholder - would need actual references to check
  
  console.log(`  ✅ ${carSlugs.size} car slugs available`);
  console.log(`  ✅ ${systemKeys.size} system keys available`);
  console.log(`  ✅ ${nodeKeys.size} node keys available`);
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function runLinter() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Content Linter - Quality Validation                       ║');
  console.log('║  Version 1.0.0                                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\nRunning at: ${new Date().toISOString()}`);
  
  // Run all lint checks
  lintCars();
  lintSystems();
  lintNodes();
  lintUpgradeEducation();
  lintPerformanceCategories();
  lintCrossReferences();
  
  // Print summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                     LINT SUMMARY                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  console.log('\n📊 Items Checked:');
  console.log(`   Cars: ${lintResults.checked.cars}`);
  console.log(`   Systems: ${lintResults.checked.systems}`);
  console.log(`   Nodes: ${lintResults.checked.nodes}`);
  console.log(`   Upgrade Categories: ${lintResults.checked.upgrades}`);
  console.log(`   Performance Categories: ${lintResults.checked.categories}`);
  
  console.log('\n📋 Results:');
  console.log(`   ❌ Errors: ${lintResults.errors.length}`);
  console.log(`   ⚠️  Warnings: ${lintResults.warnings.length}`);
  console.log(`   ℹ️  Info: ${lintResults.info.length}`);
  
  if (lintResults.errors.length > 0) {
    console.log('\n❌ ERRORS (must fix):');
    for (const err of lintResults.errors.slice(0, 10)) {
      console.log(`   • [${err.source}] ${err.field}: ${err.message}`);
    }
    if (lintResults.errors.length > 10) {
      console.log(`   ... and ${lintResults.errors.length - 10} more`);
    }
  }
  
  // Write results to JSON
  const outputPath = path.join(__dirname, '..', 'audit', 'content-lint-results.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    runAt: new Date().toISOString(),
    summary: {
      errors: lintResults.errors.length,
      warnings: lintResults.warnings.length,
      info: lintResults.info.length,
      itemsChecked: lintResults.checked,
    },
    errors: lintResults.errors,
    warnings: lintResults.warnings,
    info: lintResults.info,
  }, null, 2));
  
  console.log(`\n📄 Results saved to: ${outputPath}`);
  
  // Exit with error if critical issues found
  if (lintResults.errors.length > 0) {
    console.log('\n⚠️  Content lint errors found. Please review and fix.');
    process.exit(1);
  } else if (lintResults.warnings.length > 10) {
    console.log('\n⚠️  Many warnings found. Consider reviewing.');
    process.exit(0);
  } else {
    console.log('\n✅ Content lint passed!');
    process.exit(0);
  }
}

// Run
runLinter().catch(console.error);

