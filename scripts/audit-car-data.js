#!/usr/bin/env node
/**
 * Car Data Audit Script
 * 
 * Audits all car data for completeness and consistency across:
 * - Advisory scores (7 categories)
 * - Performance HUB scores (7 categories)
 * - Hard metrics (hp, torque, 0-60, braking, lateral G, etc.)
 * - Required fields (name, slug, tier, category, etc.)
 */

import { carData, categories } from '../data/cars.js';
import { performanceCategories, mapCarToPerformanceScores } from '../data/performanceCategories.js';
import { getPerformanceProfile, validatePerformanceScores } from '../lib/performance.js';

// Advisory score keys
const advisoryScoreKeys = categories.map(c => c.key);

// Performance score keys
const perfScoreKeys = ['perfPowerAccel', 'perfGripCornering', 'perfBraking', 'perfTrackPace', 'perfDrivability', 'perfReliabilityHeat', 'perfSoundEmotion'];

// Required fields
const requiredFields = ['id', 'name', 'slug', 'years', 'tier', 'category', 'engine', 'hp', 'trans', 'priceRange', 'priceAvg'];

// Hard metrics (optional but important for Performance HUB)
const hardMetrics = ['torque', 'curbWeight', 'zeroToSixty', 'quarterMile', 'braking60To0', 'lateralG', 'drivetrain'];

// Content fields
const contentFields = ['notes', 'highlight', 'tagline', 'bestFor', 'pros', 'cons'];

// Results tracking
const issues = {
  missingRequired: [],
  missingAdvisoryScores: [],
  outOfRangeAdvisoryScores: [],
  missingPerfScores: [],
  outOfRangePerfScores: [],
  missingHardMetrics: [],
  missingContentFields: [],
  perfScoreMismatches: [],
};

console.log('==========================================');
console.log('CAR DATA AUDIT REPORT');
console.log('==========================================\n');

console.log(`Total cars in database: ${carData.length}\n`);

// Audit each car
carData.forEach(car => {
  // Check required fields
  requiredFields.forEach(field => {
    if (car[field] === undefined || car[field] === null || car[field] === '') {
      issues.missingRequired.push({ car: car.name || car.id, field });
    }
  });

  // Check advisory scores
  advisoryScoreKeys.forEach(key => {
    const score = car[key];
    if (score === undefined || score === null) {
      issues.missingAdvisoryScores.push({ car: car.name, field: key });
    } else if (score < 1 || score > 10) {
      issues.outOfRangeAdvisoryScores.push({ car: car.name, field: key, value: score });
    }
  });

  // Check performance scores
  perfScoreKeys.forEach(key => {
    const score = car[key];
    if (score === undefined || score === null) {
      issues.missingPerfScores.push({ car: car.name, field: key });
    } else if (score < 1 || score > 10) {
      issues.outOfRangePerfScores.push({ car: car.name, field: key, value: score });
    }
  });

  // Check hard metrics
  hardMetrics.forEach(field => {
    if (car[field] === undefined || car[field] === null) {
      issues.missingHardMetrics.push({ car: car.name, field });
    }
  });

  // Check content fields
  contentFields.forEach(field => {
    if (car[field] === undefined || car[field] === null || 
        (Array.isArray(car[field]) && car[field].length === 0) ||
        (typeof car[field] === 'string' && car[field].trim() === '')) {
      issues.missingContentFields.push({ car: car.name, field });
    }
  });

  // Validate performance scores against hard metrics
  try {
    const stockScores = mapCarToPerformanceScores(car);
    const validation = validatePerformanceScores(car, stockScores);
    if (!validation.isValid) {
      issues.perfScoreMismatches.push({ car: car.name, warnings: validation.warnings });
    }
  } catch (err) {
    console.error(`Error validating ${car.name}:`, err.message);
  }
});

// Print results
console.log('--- REQUIRED FIELDS ---');
if (issues.missingRequired.length === 0) {
  console.log('✅ All cars have all required fields');
} else {
  console.log(`❌ ${issues.missingRequired.length} missing required fields:`);
  issues.missingRequired.forEach(i => console.log(`   - ${i.car}: missing "${i.field}"`));
}

console.log('\n--- ADVISORY SCORES (7 categories) ---');
if (issues.missingAdvisoryScores.length === 0) {
  console.log('✅ All cars have all 7 advisory scores');
} else {
  console.log(`❌ ${issues.missingAdvisoryScores.length} missing advisory scores:`);
  issues.missingAdvisoryScores.forEach(i => console.log(`   - ${i.car}: missing "${i.field}"`));
}

if (issues.outOfRangeAdvisoryScores.length === 0) {
  console.log('✅ All advisory scores are in valid range (1-10)');
} else {
  console.log(`❌ ${issues.outOfRangeAdvisoryScores.length} out-of-range advisory scores:`);
  issues.outOfRangeAdvisoryScores.forEach(i => console.log(`   - ${i.car}: "${i.field}" = ${i.value}`));
}

console.log('\n--- PERFORMANCE HUB SCORES (7 categories) ---');
if (issues.missingPerfScores.length === 0) {
  console.log('✅ All cars have all 7 performance scores');
} else {
  console.log(`⚠️  ${issues.missingPerfScores.length} missing performance scores (will be derived):`);
  // Group by car for cleaner output
  const byCarPerf = {};
  issues.missingPerfScores.forEach(i => {
    if (!byCarPerf[i.car]) byCarPerf[i.car] = [];
    byCarPerf[i.car].push(i.field);
  });
  Object.entries(byCarPerf).forEach(([car, fields]) => {
    console.log(`   - ${car}: missing ${fields.join(', ')}`);
  });
}

if (issues.outOfRangePerfScores.length === 0) {
  console.log('✅ All performance scores are in valid range (1-10)');
} else {
  console.log(`❌ ${issues.outOfRangePerfScores.length} out-of-range performance scores:`);
  issues.outOfRangePerfScores.forEach(i => console.log(`   - ${i.car}: "${i.field}" = ${i.value}`));
}

console.log('\n--- HARD METRICS (for Performance HUB accuracy) ---');
const uniqueCarsWithMissingMetrics = [...new Set(issues.missingHardMetrics.map(i => i.car))];
console.log(`⚠️  ${uniqueCarsWithMissingMetrics.length} cars have incomplete hard metrics:`);
const byCarMetrics = {};
issues.missingHardMetrics.forEach(i => {
  if (!byCarMetrics[i.car]) byCarMetrics[i.car] = [];
  byCarMetrics[i.car].push(i.field);
});
Object.entries(byCarMetrics).slice(0, 10).forEach(([car, fields]) => {
  console.log(`   - ${car}: missing ${fields.join(', ')}`);
});
if (Object.keys(byCarMetrics).length > 10) {
  console.log(`   ... and ${Object.keys(byCarMetrics).length - 10} more cars`);
}

console.log('\n--- PERFORMANCE SCORE vs HARD METRIC VALIDATION ---');
if (issues.perfScoreMismatches.length === 0) {
  console.log('✅ All performance scores align with hard metrics');
} else {
  console.log(`⚠️  ${issues.perfScoreMismatches.length} cars have potential score/metric mismatches:`);
  issues.perfScoreMismatches.forEach(i => {
    console.log(`   - ${i.car}:`);
    i.warnings.forEach(w => console.log(`     • ${w}`));
  });
}

console.log('\n--- CONTENT FIELDS ---');
const uniqueCarsWithMissingContent = [...new Set(issues.missingContentFields.map(i => i.car))];
if (uniqueCarsWithMissingContent.length === 0) {
  console.log('✅ All cars have complete content fields');
} else {
  console.log(`⚠️  ${uniqueCarsWithMissingContent.length} cars have incomplete content:`);
  const byCarContent = {};
  issues.missingContentFields.forEach(i => {
    if (!byCarContent[i.car]) byCarContent[i.car] = [];
    byCarContent[i.car].push(i.field);
  });
  Object.entries(byCarContent).slice(0, 10).forEach(([car, fields]) => {
    console.log(`   - ${car}: missing ${fields.join(', ')}`);
  });
  if (Object.keys(byCarContent).length > 10) {
    console.log(`   ... and ${Object.keys(byCarContent).length - 10} more cars`);
  }
}

// Summary statistics
console.log('\n==========================================');
console.log('SUMMARY');
console.log('==========================================');

const carsWithAllAdvisory = carData.filter(car => 
  advisoryScoreKeys.every(key => car[key] !== undefined && car[key] !== null && car[key] >= 1 && car[key] <= 10)
).length;

const carsWithAllPerf = carData.filter(car => 
  perfScoreKeys.every(key => car[key] !== undefined && car[key] !== null && car[key] >= 1 && car[key] <= 10)
).length;

const carsWithAllHardMetrics = carData.filter(car =>
  hardMetrics.every(field => car[field] !== undefined && car[field] !== null)
).length;

console.log(`Cars with complete advisory scores: ${carsWithAllAdvisory}/${carData.length}`);
console.log(`Cars with complete perf scores:     ${carsWithAllPerf}/${carData.length}`);
console.log(`Cars with all hard metrics:         ${carsWithAllHardMetrics}/${carData.length}`);

// Check scoring logic alignment
console.log('\n==========================================');
console.log('SCORING LOGIC CHECK');
console.log('==========================================');

console.log('\nAdvisory Categories defined:', categories.length);
categories.forEach(c => console.log(`  - ${c.key}: "${c.label}" - ${c.desc}`));

console.log('\nPerformance Categories defined:', performanceCategories.length);
performanceCategories.forEach(c => console.log(`  - ${c.key}: "${c.label}"`));

console.log('\n✅ Audit complete.');


