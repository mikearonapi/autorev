/**
 * Vehicle Data Audit Script
 * Compares database values against OEM reference data
 */

import carData from '../data/cars.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define acceptable variances per the ACCURACY_THRESHOLDS.md
const THRESHOLDS = {
  hp: { percent: 1, absolute: 5 },           // ±1% or ±5 HP
  torque: { percent: 1, absolute: 5 },       // ±1% or ±5 lb-ft
  curbWeight: { percent: 2, absolute: 50 },  // ±2% or ±50 lbs
  zeroToSixty: { absolute: 0.3 },            // ±0.3s
  quarterMile: { absolute: 0.5 }             // ±0.5s
};

// OEM Reference Data (subset - full data in OEM_REFERENCE_DATASET.json)
const OEM_REFERENCE = {
  // Original audited vehicles
  '718-cayman-gt4': { hp: 414, torque: 309, curbWeight: 3227, zeroToSixty: 4.2 },
  '718-cayman-gts-40': { hp: 394, torque: 309, curbWeight: 3153, zeroToSixty: 4.3 },
  'c8-corvette-stingray': { hp: 490, torque: 465, curbWeight: 3535, zeroToSixty: 2.9 },
  'shelby-gt350': { hp: 526, torque: 429, curbWeight: 3760, zeroToSixty: 4.3 },
  'shelby-gt500': { hp: 760, torque: 625, curbWeight: 4171, zeroToSixty: 3.3 },
  'bmw-m2-competition': { hp: 405, torque: 406, curbWeight: 3600, zeroToSixty: 4.0 },
  'nissan-gt-r': { hp: 565, torque: 467, curbWeight: 3933, zeroToSixty: 2.9 },
  'c7-corvette-z06': { hp: 650, torque: 650, curbWeight: 3599, zeroToSixty: 2.95 },
  'c7-corvette-grand-sport': { hp: 460, torque: 465, curbWeight: 3524, zeroToSixty: 3.6 },
  'camaro-zl1': { hp: 650, torque: 650, curbWeight: 4078, zeroToSixty: 3.5 },
  'dodge-viper': { hp: 645, torque: 600, curbWeight: 3374, zeroToSixty: 3.3 },
  'audi-r8-v10': { hp: 525, torque: 398, curbWeight: 3660, zeroToSixty: 3.4 },
  
  // Newly researched vehicles
  'toyota-gr-supra': { hp: 382, torque: 368, curbWeight: 3397, zeroToSixty: 3.9 },
  'bmw-m4-f82': { hp: 425, torque: 406, curbWeight: 3530, zeroToSixty: 4.1 },
  '991-carrera-s': { hp: 400, torque: 325, curbWeight: 3153, zeroToSixty: 3.9 },
  'toyota-86': { hp: 205, torque: 156, curbWeight: 2758, zeroToSixty: 6.2 },
  'toyota-gr86': { hp: 228, torque: 184, curbWeight: 2811, zeroToSixty: 6.1 },
  'honda-s2000': { hp: 237, torque: 162, curbWeight: 2864, zeroToSixty: 6.0 },
  'mazda-rx-7-fd': { hp: 255, torque: 217, curbWeight: 2800, zeroToSixty: 4.9 },
  'mazda-rx-7-fd3s': { hp: 255, torque: 217, curbWeight: 2800, zeroToSixty: 4.9 },
  'mazda-miata-nd': { hp: 181, torque: 151, curbWeight: 2341, zeroToSixty: 5.7 },
  'mazda-mx-5-nd': { hp: 181, torque: 151, curbWeight: 2341, zeroToSixty: 5.7 },
  'bmw-m3-e46': { hp: 333, torque: 262, curbWeight: 3415, zeroToSixty: 4.8 },
  'mitsubishi-evo-x': { hp: 291, torque: 300, curbWeight: 3527, zeroToSixty: 4.7 },
  'lancer-evolution-x': { hp: 291, torque: 300, curbWeight: 3527, zeroToSixty: 4.7 }
};

function isWithinThreshold(field, dbValue, refValue) {
  if (dbValue === undefined || dbValue === null || refValue === undefined) {
    return { withinThreshold: false, variance: null, reason: 'missing_value' };
  }

  const variance = dbValue - refValue;
  const percentVariance = (variance / refValue) * 100;
  const threshold = THRESHOLDS[field];

  if (!threshold) {
    return { withinThreshold: true, variance, reason: 'no_threshold_defined' };
  }

  let withinThreshold = false;

  if (threshold.percent !== undefined) {
    // Check if within percentage OR absolute threshold
    withinThreshold = Math.abs(percentVariance) <= threshold.percent || 
                      Math.abs(variance) <= threshold.absolute;
  } else {
    // Just check absolute threshold
    withinThreshold = Math.abs(variance) <= threshold.absolute;
  }

  return {
    withinThreshold,
    variance,
    percentVariance: percentVariance.toFixed(2),
    threshold
  };
}

function auditVehicle(car) {
  const ref = OEM_REFERENCE[car.slug];
  if (!ref) {
    return {
      slug: car.slug,
      name: car.name,
      status: 'NO_REFERENCE',
      message: 'No OEM reference data available'
    };
  }

  const results = {
    slug: car.slug,
    name: car.name,
    brand: car.brand,
    checks: {},
    status: 'PASS',
    errors: [],
    warnings: []
  };

  // Check each field
  const fieldsToCheck = ['hp', 'torque', 'curbWeight', 'zeroToSixty'];
  
  for (const field of fieldsToCheck) {
    const dbValue = car[field];
    const refValue = ref[field];
    const check = isWithinThreshold(field, dbValue, refValue);
    
    results.checks[field] = {
      database: dbValue,
      reference: refValue,
      ...check
    };

    if (check.reason === 'missing_value') {
      results.warnings.push(`${field}: Missing value (DB: ${dbValue}, Ref: ${refValue})`);
    } else if (!check.withinThreshold) {
      results.errors.push(`${field}: Out of threshold (DB: ${dbValue}, Ref: ${refValue}, Variance: ${check.variance})`);
      results.status = 'FAIL';
    }
  }

  if (results.status !== 'FAIL' && results.warnings.length > 0) {
    results.status = 'WARNING';
  }

  return results;
}

function runAudit() {
  console.log('='.repeat(80));
  console.log('VEHICLE DATA AUDIT REPORT');
  console.log('Generated:', new Date().toISOString());
  console.log('='.repeat(80));
  console.log('');

  const allResults = [];
  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;
  let noRefCount = 0;

  for (const car of carData) {
    const result = auditVehicle(car);
    allResults.push(result);

    switch (result.status) {
      case 'PASS': passCount++; break;
      case 'FAIL': failCount++; break;
      case 'WARNING': warningCount++; break;
      case 'NO_REFERENCE': noRefCount++; break;
    }
  }

  // Print failures first
  const failures = allResults.filter(r => r.status === 'FAIL');
  if (failures.length > 0) {
    console.log('❌ FAILURES (' + failures.length + ')');
    console.log('-'.repeat(80));
    for (const f of failures) {
      console.log(`\n${f.brand} ${f.name} (${f.slug})`);
      for (const err of f.errors) {
        console.log(`  ⛔ ${err}`);
      }
    }
    console.log('');
  }

  // Print warnings
  const warnings = allResults.filter(r => r.status === 'WARNING');
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (' + warnings.length + ')');
    console.log('-'.repeat(80));
    for (const w of warnings) {
      console.log(`\n${w.brand} ${w.name} (${w.slug})`);
      for (const warn of w.warnings) {
        console.log(`  ⚠️  ${warn}`);
      }
    }
    console.log('');
  }

  // Print passes
  const passes = allResults.filter(r => r.status === 'PASS');
  if (passes.length > 0) {
    console.log('✅ PASSED (' + passes.length + ')');
    console.log('-'.repeat(80));
    for (const p of passes) {
      console.log(`  ✓ ${p.brand} ${p.name}`);
    }
    console.log('');
  }

  // Print no reference
  const noRef = allResults.filter(r => r.status === 'NO_REFERENCE');
  if (noRef.length > 0) {
    console.log('📋 PENDING REFERENCE DATA (' + noRef.length + ')');
    console.log('-'.repeat(80));
    for (const n of noRef) {
      console.log(`  - ${n.name}`);
    }
    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Vehicles: ${allResults.length}`);
  console.log(`✅ Passed:      ${passCount}`);
  console.log(`❌ Failed:      ${failCount}`);
  console.log(`⚠️  Warnings:    ${warningCount}`);
  console.log(`📋 No Ref:      ${noRefCount}`);
  console.log(`Pass Rate:      ${((passCount / (passCount + failCount + warningCount)) * 100).toFixed(1)}% (of vehicles with reference data)`);

  // Write detailed results to JSON
  const outputPath = path.join(__dirname, '..', 'audit', 'vehicle-audit-results.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    summary: {
      total: allResults.length,
      passed: passCount,
      failed: failCount,
      warnings: warningCount,
      noReference: noRefCount
    },
    results: allResults
  }, null, 2));
  console.log(`\nDetailed results written to: ${outputPath}`);
}

runAudit();

