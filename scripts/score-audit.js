#!/usr/bin/env node
/**
 * Score Audit Script
 * 
 * This script analyzes car scores to identify potential issues:
 * 1. Cars with inflated overall rankings due to value/aftermarket weighting
 * 2. Sound scores that don't match expert consensus
 * 3. Interior scores that don't match reality
 * 4. Cars that should rank higher but are being penalized
 */

import { carData, categories } from '../data/cars.js';

// ============================================================================
// EXPERT CONSENSUS DATA
// Cars that should have 10/10 sound based on universal expert agreement
// ============================================================================
const LEGENDARY_SOUND_CARS = [
  'shelby-gt350',        // Flat-plane V8 - universally praised
  'lamborghini-gallardo', // V10 scream
  'dodge-viper',         // V10 rumble
  'porsche-911-gt3-997', // Mezger flat-6
  'porsche-911-gt3-996', // Mezger flat-6
  'audi-r8-v10',         // V10 howl (should be 9.5-10)
  'bmw-m3-e46',          // S54 straight-6 (should be ~9)
  'lexus-lfa',           // V10 - if we had it
];

// Cars that should NOT have high sound scores (turbocharged, muted)
const MUTED_SOUND_CARS = [
  'porsche-911-turbo-997.2',  // Twin-turbo mutes sound
  'nissan-gt-r',              // Known for being quiet
  'audi-rs3-8v',              // 5-cyl is good but not legendary
];

// ============================================================================
// INTERIOR REALITY CHECK
// Based on expert reviews and owner feedback
// ============================================================================
const INTERIOR_ADJUSTMENTS = {
  // Corvettes - generally criticized interiors
  'c8-corvette-stingray': { current: null, suggested: 6.5, reason: 'Cheap plastics, awkward button layout, widely criticized' },
  'c7-corvette-grand-sport': { current: null, suggested: 5.5, reason: 'Dated design, cheap materials, small screens' },
  'c7-corvette-z06': { current: null, suggested: 5.5, reason: 'Same as Grand Sport - dated C7 interior' },
  'c6-corvette-z06': { current: null, suggested: 5.0, reason: 'Very dated, rental car quality buttons' },
  
  // Muscle cars - basic interiors
  'camaro-zl1': { current: null, suggested: 5.0, reason: 'Poor visibility, cheap materials, cramped' },
  'camaro-ss-1le': { current: null, suggested: 4.5, reason: 'Base Camaro interior is not good' },
  'shelby-gt350': { current: null, suggested: 5.0, reason: 'Still a Mustang interior - functional but basic' },
  'dodge-challenger-hellcat': { current: null, suggested: 5.5, reason: 'Old Mercedes platform, feels dated' },
  
  // Premium cars that deserve high scores
  'porsche-911-gt3-997': { current: null, suggested: 8.0, reason: 'Classic Porsche quality, analog gauges, great materials' },
  '718-cayman-gt4': { current: null, suggested: 8.5, reason: 'Excellent Porsche fit/finish, functional layout' },
  'lexus-lc-500': { current: null, suggested: 9.5, reason: 'Exceptional craftsmanship, Lexus luxury' },
  'audi-r8-v10': { current: null, suggested: 8.8, reason: 'Audi quality, excellent ergonomics' },
};

// ============================================================================
// ANALYZE SCORES
// ============================================================================

console.log('='.repeat(80));
console.log('SPORTS CAR ADVISORY - SCORE AUDIT REPORT');
console.log('='.repeat(80));
console.log('');

// Calculate total score for each car
const carsWithTotals = carData.map(car => {
  const total = (car.sound || 0) + 
                (car.interior || 0) + 
                (car.track || 0) + 
                (car.reliability || 0) + 
                (car.value || 0) + 
                (car.driverFun || 0) + 
                (car.aftermarket || 0);
  return { ...car, total };
}).sort((a, b) => b.total - a.total);

// ============================================================================
// SECTION 1: TOP 20 CARS BY OVERALL SCORE
// ============================================================================
console.log('SECTION 1: TOP 20 CARS BY OVERALL SCORE');
console.log('-'.repeat(80));
console.log('');
console.log('Rank | Car Name                          | Total | Sound | Int  | Track | Rely | Value | Fun  | Aft');
console.log('-'.repeat(110));

carsWithTotals.slice(0, 20).forEach((car, i) => {
  const name = car.name.padEnd(34).slice(0, 34);
  console.log(
    `${String(i + 1).padStart(4)} | ${name} | ${car.total.toFixed(1).padStart(5)} | ${(car.sound || 0).toFixed(1).padStart(5)} | ${(car.interior || 0).toFixed(1).padStart(4)} | ${(car.track || 0).toFixed(1).padStart(5)} | ${(car.reliability || 0).toFixed(1).padStart(4)} | ${(car.value || 0).toFixed(1).padStart(5)} | ${(car.driverFun || 0).toFixed(1).padStart(4)} | ${(car.aftermarket || 0).toFixed(1).padStart(4)}`
  );
});

// ============================================================================
// SECTION 2: BRAND DISTRIBUTION IN TOP 20
// ============================================================================
console.log('');
console.log('');
console.log('SECTION 2: BRAND DISTRIBUTION IN TOP 20');
console.log('-'.repeat(80));
const top20Brands = {};
carsWithTotals.slice(0, 20).forEach(car => {
  const brand = car.brand || 'Unknown';
  top20Brands[brand] = (top20Brands[brand] || 0) + 1;
});
Object.entries(top20Brands).sort((a, b) => b[1] - a[1]).forEach(([brand, count]) => {
  console.log(`  ${brand}: ${count} cars (${(count/20*100).toFixed(0)}%)`);
});

// ============================================================================
// SECTION 3: SOUND SCORE AUDIT
// ============================================================================
console.log('');
console.log('');
console.log('SECTION 3: SOUND SCORE AUDIT');
console.log('-'.repeat(80));
console.log('');

// Cars with sound = 10
const perfectSoundCars = carData.filter(c => c.sound === 10);
console.log('Cars with SOUND = 10 (Perfect):');
perfectSoundCars.forEach(car => {
  const isLegendary = LEGENDARY_SOUND_CARS.includes(car.slug);
  const status = isLegendary ? '✓ VALID' : '⚠ NEEDS REVIEW';
  console.log(`  ${status} - ${car.name} (${car.engine})`);
});

console.log('');
console.log('Cars that SHOULD have SOUND = 9.5-10 but don\'t:');
LEGENDARY_SOUND_CARS.forEach(slug => {
  const car = carData.find(c => c.slug === slug);
  if (car && car.sound < 9.5) {
    console.log(`  ⚠ ${car.name}: sound = ${car.sound} (should be 9.5-10)`);
  } else if (car && car.sound >= 9.5) {
    console.log(`  ✓ ${car.name}: sound = ${car.sound} (correct)`);
  }
});

// ============================================================================
// SECTION 4: INTERIOR SCORE AUDIT
// ============================================================================
console.log('');
console.log('');
console.log('SECTION 4: INTERIOR SCORE AUDIT');
console.log('-'.repeat(80));
console.log('');

console.log('Potentially INFLATED interior scores:');
Object.entries(INTERIOR_ADJUSTMENTS).forEach(([slug, adj]) => {
  const car = carData.find(c => c.slug === slug);
  if (car) {
    adj.current = car.interior;
    if (car.interior > adj.suggested + 0.5) {
      console.log(`  ⚠ ${car.name}: ${car.interior} → suggested ${adj.suggested}`);
      console.log(`     Reason: ${adj.reason}`);
    }
  }
});

// ============================================================================
// SECTION 5: VALUE/AFTERMARKET IMPACT ANALYSIS
// ============================================================================
console.log('');
console.log('');
console.log('SECTION 5: VALUE + AFTERMARKET IMPACT ANALYSIS');
console.log('-'.repeat(80));
console.log('');
console.log('These two categories alone can add up to 20 points to a car\'s total.');
console.log('');

// Calculate "enthusiast score" (excluding value and aftermarket)
const enthusiastScores = carsWithTotals.map(car => ({
  ...car,
  enthusiastScore: (car.sound || 0) + (car.interior || 0) + (car.track || 0) + 
                   (car.reliability || 0) + (car.driverFun || 0),
  valueAftermarket: (car.value || 0) + (car.aftermarket || 0),
})).sort((a, b) => b.enthusiastScore - a.enthusiastScore);

console.log('TOP 15 BY ENTHUSIAST SCORE (Sound + Interior + Track + Reliability + Driver Fun):');
console.log('-'.repeat(100));
console.log('Rank | Car Name                          | Enth  | Total | Val+Aft | Difference');
console.log('-'.repeat(100));

enthusiastScores.slice(0, 15).forEach((car, i) => {
  const totalRank = carsWithTotals.findIndex(c => c.slug === car.slug) + 1;
  const name = car.name.padEnd(34).slice(0, 34);
  const diff = totalRank - (i + 1);
  const diffStr = diff > 0 ? `↓${diff}` : diff < 0 ? `↑${Math.abs(diff)}` : '=';
  console.log(
    `${String(i + 1).padStart(4)} | ${name} | ${car.enthusiastScore.toFixed(1).padStart(5)} | ${car.total.toFixed(1).padStart(5)} | ${car.valueAftermarket.toFixed(1).padStart(7)} | ${diffStr.padStart(3)} (Total Rank: ${totalRank})`
  );
});

// ============================================================================
// SECTION 6: CARS BEING UNFAIRLY PENALIZED
// ============================================================================
console.log('');
console.log('');
console.log('SECTION 6: ENTHUSIAST CARS PENALIZED BY VALUE SCORE');
console.log('-'.repeat(80));
console.log('');
console.log('These cars rank high on driving metrics but low overall due to poor "value" scores:');
console.log('');

const penalizedCars = enthusiastScores
  .filter(car => {
    const totalRank = carsWithTotals.findIndex(c => c.slug === car.slug) + 1;
    const enthRank = enthusiastScores.findIndex(c => c.slug === car.slug) + 1;
    return totalRank - enthRank >= 5 && car.value < 6;
  })
  .slice(0, 10);

penalizedCars.forEach(car => {
  const totalRank = carsWithTotals.findIndex(c => c.slug === car.slug) + 1;
  const enthRank = enthusiastScores.findIndex(c => c.slug === car.slug) + 1;
  console.log(`  ${car.name}`);
  console.log(`     Enthusiast Rank: ${enthRank} → Overall Rank: ${totalRank} (dropped ${totalRank - enthRank} spots)`);
  console.log(`     Value: ${car.value}/10 | Aftermarket: ${car.aftermarket}/10`);
  console.log('');
});

// ============================================================================
// SECTION 7: RECOMMENDED SCORE ADJUSTMENTS
// ============================================================================
console.log('');
console.log('='.repeat(80));
console.log('RECOMMENDED SCORE ADJUSTMENTS');
console.log('='.repeat(80));
console.log('');

const adjustments = [];

// Interior adjustments
Object.entries(INTERIOR_ADJUSTMENTS).forEach(([slug, adj]) => {
  const car = carData.find(c => c.slug === slug);
  if (car && car.interior > adj.suggested + 0.3) {
    adjustments.push({
      slug,
      name: car.name,
      field: 'interior',
      current: car.interior,
      suggested: adj.suggested,
      reason: adj.reason,
    });
  }
});

if (adjustments.length > 0) {
  console.log('INTERIOR ADJUSTMENTS:');
  adjustments.filter(a => a.field === 'interior').forEach(adj => {
    console.log(`  ${adj.name}:`);
    console.log(`     interior: ${adj.current} → ${adj.suggested}`);
    console.log(`     Reason: ${adj.reason}`);
    console.log('');
  });
}

// ============================================================================
// SECTION 8: SUMMARY
// ============================================================================
console.log('');
console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log('');
console.log('KEY FINDINGS:');
console.log('');
console.log('1. BRAND CONCENTRATION: Chevrolet/GM cars dominate rankings due to high');
console.log('   Value (9+) and Aftermarket (10) scores, not driving excellence.');
console.log('');
console.log('2. INTERIOR INFLATION: Several Corvette/Camaro interior scores are 1-2');
console.log('   points higher than expert consensus suggests.');
console.log('');
console.log('3. WEIGHTING ISSUE: Equal weighting of all 7 categories favors');
console.log('   "practical" cars over "exciting" cars. Consider:');
console.log('   - Reducing weight of Value and Aftermarket in default rankings');
console.log('   - Or creating separate "Enthusiast Score" ranking');
console.log('');
console.log('4. SPECIFIC ADJUSTMENTS NEEDED:');
adjustments.slice(0, 5).forEach(adj => {
  console.log(`   - ${adj.name}: ${adj.field} ${adj.current} → ${adj.suggested}`);
});
console.log('');
