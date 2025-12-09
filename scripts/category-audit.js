#!/usr/bin/env node
/**
 * Category-by-Category Score Audit
 * 
 * Reviews each scoring category to ensure:
 * 1. Relative rankings make sense (best to worst)
 * 2. Absolute scores are justified (is a 10 really deserved?)
 * 3. No obviously wrong scores
 */

import { carData } from '../data/cars.js';

const CATEGORIES = [
  { key: 'sound', label: 'SOUND', desc: 'Exhaust note, engine character' },
  { key: 'interior', label: 'INTERIOR', desc: 'Materials, design, tech' },
  { key: 'track', label: 'TRACK', desc: 'Lap times, handling, cooling' },
  { key: 'reliability', label: 'RELIABILITY', desc: 'Ownership costs, issues' },
  { key: 'value', label: 'VALUE', desc: 'Performance per dollar' },
  { key: 'driverFun', label: 'DRIVER FUN', desc: 'Steering feel, engagement' },
  { key: 'aftermarket', label: 'AFTERMARKET', desc: 'Tuning, parts availability' },
];

// Reference cars NOT in our database that could be "better"
// This helps calibrate whether a 10 is deserved
const REFERENCE_CARS = {
  sound: {
    better: ['Lexus LFA (V10 screamer)', 'Ferrari 458 Italia', 'Carrera GT', 'McLaren F1'],
    notes: 'A 10 should only go to cars that rival these legendary sounds'
  },
  interior: {
    better: ['Bentley Continental GT', 'Mercedes S-Class', 'Rolls Royce'],
    notes: 'No sports car should be 10 - luxury sedans are objectively better'
  },
  track: {
    better: ['992 GT3 RS', 'Ferrari 488 Pista', 'McLaren 720S', 'Porsche 918'],
    notes: 'A 10 is reserved for cars that are genuinely track-focused weapons'
  },
  reliability: {
    better: ['Toyota Camry', 'Lexus ES', 'Honda Accord'],
    notes: 'Sports cars inherently sacrifice some reliability for performance'
  },
  value: {
    better: ['Mazda Miata', 'Used Corvette C5'],
    notes: 'Value is relative to performance delivered per dollar'
  },
  driverFun: {
    better: ['Ariel Atom', 'Caterham 7', 'Lotus 3-Eleven'],
    notes: 'Pure driving machines with no comfort compromises'
  },
  aftermarket: {
    better: ['Honda Civic (tuner culture)', 'Subaru WRX/STI'],
    notes: 'Some economy cars have even bigger aftermarket than sports cars'
  }
};

console.log('='.repeat(100));
console.log('CATEGORY-BY-CATEGORY SCORE AUDIT');
console.log('='.repeat(100));
console.log('');

CATEGORIES.forEach(cat => {
  console.log('');
  console.log('█'.repeat(100));
  console.log(`█ ${cat.label}: ${cat.desc}`);
  console.log('█'.repeat(100));
  console.log('');
  
  // Sort cars by this category
  const sorted = [...carData]
    .filter(c => c[cat.key] != null)
    .sort((a, b) => (b[cat.key] || 0) - (a[cat.key] || 0));
  
  // Get score distribution
  const scores = sorted.map(c => c[cat.key]);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  const tens = sorted.filter(c => c[cat.key] === 10).length;
  const nines = sorted.filter(c => c[cat.key] >= 9 && c[cat.key] < 10).length;
  
  console.log(`Distribution: Max=${max}, Min=${min}, Avg=${avg}`);
  console.log(`Perfect 10s: ${tens} cars | 9.0-9.9: ${nines} cars`);
  console.log('');
  
  if (REFERENCE_CARS[cat.key]) {
    console.log(`⚠ CALIBRATION NOTE: ${REFERENCE_CARS[cat.key].notes}`);
    console.log(`  Better cars not in DB: ${REFERENCE_CARS[cat.key].better.join(', ')}`);
    console.log('');
  }
  
  // Show top 15
  console.log('TOP 15:');
  console.log('-'.repeat(80));
  sorted.slice(0, 15).forEach((car, i) => {
    const score = car[cat.key].toFixed(1);
    const engine = car.engine || '';
    const flag = car[cat.key] === 10 ? ' ← PERFECT 10' : car[cat.key] >= 9.5 ? ' ← NEAR PERFECT' : '';
    console.log(`${String(i + 1).padStart(2)}. ${score} | ${car.name.padEnd(35)} | ${engine.padEnd(20)}${flag}`);
  });
  
  // Show bottom 10
  console.log('');
  console.log('BOTTOM 10:');
  console.log('-'.repeat(80));
  sorted.slice(-10).reverse().forEach((car, i) => {
    const score = car[cat.key].toFixed(1);
    const rank = sorted.length - 9 + i;
    console.log(`${String(rank).padStart(2)}. ${score} | ${car.name.padEnd(35)} | ${car.engine || ''}`);
  });
  
  // Flag potential issues
  console.log('');
  console.log('POTENTIAL ISSUES:');
  console.log('-'.repeat(80));
  
  let issues = [];
  
  // Check for too many 10s
  if (tens > 4) {
    issues.push(`⚠ ${tens} cars have perfect 10s - consider if all truly deserve it`);
  }
  
  // Category-specific checks
  if (cat.key === 'sound') {
    // V10s and flat-plane V8s should be at top
    const topSound = sorted.slice(0, 5);
    const hasV10orFP = topSound.some(c => 
      c.engine?.includes('V10') || 
      c.engine?.includes('FP') ||
      c.engine?.includes('Flat-6')
    );
    if (!hasV10orFP) {
      issues.push('⚠ No V10/Flat-plane/Flat-6 engines in top 5 sound - check rankings');
    }
    
    // Check specific cars
    const viper = sorted.find(c => c.slug === 'dodge-viper');
    const gt350 = sorted.find(c => c.slug === 'shelby-gt350');
    const gallardo = sorted.find(c => c.slug === 'lamborghini-gallardo');
    const gt3_997 = sorted.find(c => c.slug === 'porsche-911-gt3-997');
    
    if (viper && viper.sound < 9.5) issues.push(`⚠ Dodge Viper V10 at ${viper.sound} - should be 9.5+`);
    if (gt350 && gt350.sound < 9.5) issues.push(`⚠ GT350 Voodoo at ${gt350.sound} - should be 9.5+`);
    if (gallardo && gallardo.sound < 9.5) issues.push(`⚠ Gallardo V10 at ${gallardo.sound} - should be 9.5+`);
    if (gt3_997 && gt3_997.sound < 9.5) issues.push(`⚠ GT3 997 Mezger at ${gt3_997.sound} - should be 9.5+`);
  }
  
  if (cat.key === 'interior') {
    // No sports car should really be 10
    if (tens > 0) {
      const perfects = sorted.filter(c => c[cat.key] === 10);
      perfects.forEach(c => {
        issues.push(`⚠ ${c.name} has interior=10 - is it really Bentley-level?`);
      });
    }
    
    // Lexus LC500 should be near top
    const lc500 = sorted.find(c => c.slug === 'lexus-lc-500');
    if (lc500 && sorted.indexOf(lc500) > 3) {
      issues.push(`⚠ Lexus LC 500 at interior=${lc500.interior} - Lexus craftsmanship should be top 3`);
    }
    
    // Corvettes should NOT be near top
    const corvettes = sorted.slice(0, 10).filter(c => c.name.includes('Corvette'));
    if (corvettes.length > 0) {
      issues.push(`⚠ Corvette(s) in top 10 interior: ${corvettes.map(c => c.name).join(', ')}`);
    }
  }
  
  if (cat.key === 'track') {
    // GT3, Z06, GT4 should be near top
    const gt3 = sorted.find(c => c.slug === 'porsche-911-gt3-997');
    if (gt3 && sorted.indexOf(gt3) > 3) {
      issues.push(`⚠ GT3 997 at track=${gt3.track} rank ${sorted.indexOf(gt3)+1} - should be top 3`);
    }
  }
  
  if (cat.key === 'reliability') {
    // German exotics should NOT be at top
    const topReliable = sorted.slice(0, 5);
    const germanExotics = topReliable.filter(c => 
      c.name.includes('M5 E60') || 
      c.name.includes('M3 E46') ||
      c.name.includes('Maserati')
    );
    if (germanExotics.length > 0) {
      issues.push(`⚠ Known unreliable cars in top 5: ${germanExotics.map(c => c.name).join(', ')}`);
    }
    
    // Lexus should be near top
    const lexusCars = sorted.filter(c => c.brand === 'Lexus');
    lexusCars.forEach(c => {
      if (c.reliability < 9) {
        issues.push(`⚠ Lexus ${c.name} at reliability=${c.reliability} - Lexus should be 9+`);
      }
    });
  }
  
  if (cat.key === 'value') {
    // C5 Z06 should be near top
    const c5z06 = sorted.find(c => c.slug === 'chevrolet-corvette-c5-z06');
    if (c5z06 && sorted.indexOf(c5z06) > 3) {
      issues.push(`⚠ C5 Z06 at value=${c5z06.value} - legendary value should be top 3`);
    }
    
    // GT3s should NOT be high value
    const gt3s = sorted.slice(0, 10).filter(c => c.name.includes('GT3'));
    if (gt3s.length > 0) {
      issues.push(`⚠ GT3 in top 10 value - these are expensive cars`);
    }
  }
  
  if (cat.key === 'driverFun') {
    // Miatas, Caymans, Lotuses should be near top
    const lotus = sorted.filter(c => c.brand === 'Lotus');
    lotus.forEach(c => {
      if (c.driverFun < 9) {
        issues.push(`⚠ Lotus ${c.name} at driverFun=${c.driverFun} - Lotus should be 9+`);
      }
    });
  }
  
  if (cat.key === 'aftermarket') {
    // Mustang, Camaro, Corvette should dominate
    const topAftermarket = sorted.slice(0, 10);
    const american = topAftermarket.filter(c => 
      c.brand === 'Ford' || c.brand === 'Chevrolet' || c.brand === 'Dodge'
    );
    if (american.length < 5) {
      issues.push(`⚠ Only ${american.length} American cars in top 10 aftermarket - they should dominate`);
    }
  }
  
  if (issues.length === 0) {
    console.log('✓ No obvious issues detected');
  } else {
    issues.forEach(issue => console.log(issue));
  }
  
  console.log('');
});

// Final summary
console.log('');
console.log('='.repeat(100));
console.log('CARS WITH MULTIPLE PERFECT 10s');
console.log('='.repeat(100));
console.log('');

carData.forEach(car => {
  const tens = CATEGORIES.filter(cat => car[cat.key] === 10);
  if (tens.length >= 2) {
    console.log(`${car.name}:`);
    tens.forEach(cat => console.log(`  - ${cat.label} = 10`));
    console.log('');
  }
});

console.log('');
console.log('='.repeat(100));
console.log('SCORE ADJUSTMENT RECOMMENDATIONS');
console.log('='.repeat(100));
console.log('');
console.log('Based on the audit, consider these adjustments:');
console.log('');
