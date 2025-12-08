/**
 * SuperNatural Motorsports - DB Data Quality Queries
 * 
 * These queries can be run against the database to detect data quality issues.
 * Run with: node scripts/data-quality-queries.js
 */

import carData from '../data/cars.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// DATA QUALITY CHECKS
// =============================================================================

const checks = [];

function check(name, description, query, severity = 'error') {
  const results = query(carData);
  checks.push({
    name,
    description,
    severity,
    passed: results.length === 0,
    issues: results,
    count: results.length,
  });
  
  const icon = results.length === 0 ? '✅' : severity === 'error' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${results.length === 0 ? 'PASS' : results.length + ' issues'}`);
  if (results.length > 0 && results.length <= 5) {
    results.forEach(r => console.log(`   → ${r}`));
  } else if (results.length > 5) {
    results.slice(0, 5).forEach(r => console.log(`   → ${r}`));
    console.log(`   ... and ${results.length - 5} more`);
  }
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  Data Quality Queries - Validation Report                  ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// =============================================================================
// 1. IMPOSSIBLE COMBINATIONS
// =============================================================================

console.log('📊 1. IMPOSSIBLE COMBINATIONS');
console.log('-'.repeat(50));

check(
  'Negative HP',
  'HP values must be positive',
  (data) => data.filter(c => c.hp <= 0).map(c => `${c.name}: ${c.hp} hp`),
  'error'
);

check(
  'Negative Torque',
  'Torque values must be positive',
  (data) => data.filter(c => c.torque <= 0).map(c => `${c.name}: ${c.torque} lb-ft`),
  'error'
);

check(
  'Negative Weight',
  'Weight values must be positive',
  (data) => data.filter(c => c.curbWeight <= 0).map(c => `${c.name}: ${c.curbWeight} lbs`),
  'error'
);

check(
  'Negative 0-60',
  '0-60 times must be positive',
  (data) => data.filter(c => c.zeroToSixty <= 0).map(c => `${c.name}: ${c.zeroToSixty}s`),
  'error'
);

check(
  'Impossible HP (too high)',
  'HP values over 1500 are suspicious for production sports cars',
  (data) => data.filter(c => c.hp > 1500).map(c => `${c.name}: ${c.hp} hp`),
  'warning'
);

check(
  'Impossible Weight (too low)',
  'Weight under 1500 lbs is suspicious for street-legal cars',
  (data) => data.filter(c => c.curbWeight < 1500).map(c => `${c.name}: ${c.curbWeight} lbs`),
  'warning'
);

check(
  'Impossible 0-60 (too fast)',
  '0-60 under 2.0s is suspicious for production cars',
  (data) => data.filter(c => c.zeroToSixty < 2.0).map(c => `${c.name}: ${c.zeroToSixty}s`),
  'warning'
);

// =============================================================================
// 2. MISSING REQUIRED FIELDS
// =============================================================================

console.log('\n📋 2. MISSING REQUIRED FIELDS');
console.log('-'.repeat(50));

const requiredFields = [
  { field: 'id', type: 'number' },
  { field: 'name', type: 'string' },
  { field: 'slug', type: 'string' },
  { field: 'brand', type: 'string' },
  { field: 'hp', type: 'number' },
  { field: 'torque', type: 'number' },
  { field: 'curbWeight', type: 'number' },
  { field: 'zeroToSixty', type: 'number' },
  { field: 'drivetrain', type: 'string' },
  { field: 'engine', type: 'string' },
];

for (const { field, type } of requiredFields) {
  check(
    `Missing ${field}`,
    `${field} is required and must be ${type}`,
    (data) => data.filter(c => {
      if (c[field] === undefined || c[field] === null || c[field] === '') return true;
      if (type === 'number' && typeof c[field] !== 'number') return true;
      if (type === 'string' && typeof c[field] !== 'string') return true;
      return false;
    }).map(c => `${c.name || c.slug || 'Unknown'}`),
    'error'
  );
}

// =============================================================================
// 3. ENUM VALIDATIONS
// =============================================================================

console.log('\n🔢 3. ENUM VALIDATIONS');
console.log('-'.repeat(50));

const validDrivetrains = ['RWD', 'AWD', 'FWD', '4WD'];
check(
  'Invalid Drivetrain',
  `Drivetrain must be one of: ${validDrivetrains.join(', ')}`,
  (data) => data.filter(c => !validDrivetrains.includes(c.drivetrain)).map(c => `${c.name}: ${c.drivetrain}`),
  'error'
);

const validAspirations = ['Naturally Aspirated', 'Turbocharged', 'Supercharged', 'Twin-Turbo', 'Electric'];
check(
  'Invalid Aspiration',
  `Aspiration should be one of: ${validAspirations.join(', ')}`,
  (data) => data.filter(c => c.aspiration && !validAspirations.includes(c.aspiration))
    .map(c => `${c.name}: ${c.aspiration}`),
  'warning'
);

// =============================================================================
// 4. DUPLICATE DETECTION
// =============================================================================

console.log('\n🔍 4. DUPLICATE DETECTION');
console.log('-'.repeat(50));

check(
  'Duplicate Slugs',
  'Each car must have a unique slug',
  (data) => {
    const slugs = data.map(c => c.slug);
    const duplicates = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    return [...new Set(duplicates)];
  },
  'error'
);

check(
  'Duplicate IDs',
  'Each car must have a unique ID',
  (data) => {
    const ids = data.map(c => c.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    return [...new Set(duplicates)].map(id => `ID: ${id}`);
  },
  'error'
);

// =============================================================================
// 5. CONSISTENCY CHECKS
// =============================================================================

console.log('\n🔗 5. CONSISTENCY CHECKS');
console.log('-'.repeat(50));

check(
  'Torque/HP Ratio',
  'Torque/HP ratio should be reasonable (0.5-2.0 for most engines)',
  (data) => data.filter(c => {
    const ratio = c.torque / c.hp;
    return ratio < 0.5 || ratio > 2.0;
  }).map(c => `${c.name}: ratio ${(c.torque / c.hp).toFixed(2)}`),
  'warning'
);

check(
  'Power-to-Weight vs 0-60',
  '0-60 should correlate with power-to-weight',
  (data) => {
    const issues = [];
    for (const car of data) {
      const ptw = car.hp / (car.curbWeight / 2205); // hp per metric ton
      // Very rough: 200 hp/ton = ~5s, 300 hp/ton = ~4s, 400 hp/ton = ~3.5s
      const expectedRange = {
        min: Math.max(2.5, 7 - ptw / 100),
        max: Math.min(8, 9 - ptw / 100),
      };
      if (car.zeroToSixty < expectedRange.min - 0.5) {
        issues.push(`${car.name}: ${car.zeroToSixty}s faster than expected for ${Math.round(ptw)} hp/ton`);
      }
    }
    return issues;
  },
  'warning'
);

// =============================================================================
// 6. DATA FRESHNESS / COMPLETENESS
// =============================================================================

console.log('\n📅 6. COMPLETENESS CHECKS');
console.log('-'.repeat(50));

check(
  'Missing Year Ranges',
  'Cars should have year information',
  (data) => data.filter(c => !c.years && !c.yearStart).map(c => c.name),
  'warning'
);

check(
  'Missing Description',
  'Cars should have descriptions',
  (data) => data.filter(c => !c.description || c.description.length < 20).map(c => c.name),
  'info'
);

check(
  'Missing Image',
  'Cars should have images',
  (data) => data.filter(c => !c.image).map(c => c.name),
  'warning'
);

// =============================================================================
// SUMMARY
// =============================================================================

console.log('\n');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║                    SUMMARY REPORT                          ║');
console.log('╚════════════════════════════════════════════════════════════╝');

const errors = checks.filter(c => c.severity === 'error' && !c.passed);
const warnings = checks.filter(c => c.severity === 'warning' && !c.passed);
const passed = checks.filter(c => c.passed);

console.log(`\n✅ Passed: ${passed.length}/${checks.length}`);
console.log(`❌ Errors: ${errors.length}`);
console.log(`⚠️  Warnings: ${warnings.length}`);
console.log(`📊 Total vehicles: ${carData.length}`);

if (errors.length > 0) {
  console.log('\n❌ CRITICAL ERRORS TO FIX:');
  errors.forEach(e => {
    console.log(`   • ${e.name}: ${e.count} issues`);
  });
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS TO REVIEW:');
  warnings.forEach(w => {
    console.log(`   • ${w.name}: ${w.count} issues`);
  });
}

// Write results to JSON
const outputPath = path.join(__dirname, '..', 'audit', 'data-quality-report.json');
fs.writeFileSync(outputPath, JSON.stringify({
  runAt: new Date().toISOString(),
  vehicleCount: carData.length,
  summary: {
    totalChecks: checks.length,
    passed: passed.length,
    errors: errors.length,
    warnings: warnings.length,
  },
  checks,
}, null, 2));

console.log(`\n📄 Report saved to: ${outputPath}`);

// Exit with error if critical issues found
if (errors.length > 0) {
  process.exit(1);
}

