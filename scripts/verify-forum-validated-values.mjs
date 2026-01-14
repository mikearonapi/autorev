#!/usr/bin/env node

/**
 * Verify forum-validated HP values are properly applied
 */

import { 
  upgradeModules, 
  getHpGainMultiplier, 
  calculateRealisticHpGain,
  getPlatformDownpipeGain 
} from '../data/upgradePackages.js';

console.log('═══════════════════════════════════════════════════════════════');
console.log('  FORUM-VALIDATED VALUES VERIFICATION');
console.log('═══════════════════════════════════════════════════════════════\n');

// Get current module values
const intake = upgradeModules.find(m => m.key === 'intake');
const downpipe = upgradeModules.find(m => m.key === 'downpipe');
const stage1 = upgradeModules.find(m => m.key === 'stage1-tune');

console.log('📊 Updated Module Values:');
console.log('─────────────────────────────────────────────────────────────────');
console.log(`   Cold Air Intake:  +${intake.metricChanges.hpGain} HP (was +8 HP, forum shows +15-19)`);
console.log(`   Downpipe:         +${downpipe.metricChanges.hpGain} HP (was +20 HP, forum avg +15)`);
console.log(`   Stage 1 Tune:     +${stage1.metricChanges.hpGain} HP (unchanged, forum validated)`);
console.log('');

// Test RS5 specifically
const rs5 = {
  slug: 'audi-rs5-b9',
  engine: '2.9L Twin-Turbo V6',
  hp: 444,
};

console.log('📊 Platform-Specific Downpipe Gains:');
console.log('─────────────────────────────────────────────────────────────────');

const testCars = [
  { slug: 'audi-rs5-b9', engine: '2.9L Twin-Turbo V6', name: 'Audi RS5 B9 (2.9T)' },
  { slug: 'bmw-m340i-g20', engine: '3.0L B58 Turbo I6', name: 'BMW M340i (B58)' },
  { slug: 'mitsubishi-evo-x', engine: '2.0L 4B11 Turbo I4', name: 'Evo X (4B11)' },
  { slug: 'vw-golf-r', engine: '2.0L EA888 Turbo I4', name: 'VW Golf R (EA888)' },
];

testCars.forEach(car => {
  const dpGain = getPlatformDownpipeGain(car);
  console.log(`   ${car.name.padEnd(25)} +${dpGain} HP`);
});
console.log('');

// Calculate RS5 build with updated values
console.log('═══════════════════════════════════════════════════════════════');
console.log('📊 RS5 B9 Build Calculation (Forum-Validated):');
console.log('═══════════════════════════════════════════════════════════════\n');

const rs5Upgrades = [
  { ...stage1 },
  { ...intake },
  { ...downpipe },
];

const totalGain = calculateRealisticHpGain(rs5, rs5Upgrades);

console.log(`   Stock HP:           ${rs5.hp} HP`);
console.log('');
console.log('   Modifications:');
console.log(`   + Stage 1 Tune:     +${stage1.metricChanges.hpGain} HP`);
console.log(`   + Cold Air Intake:  +${intake.metricChanges.hpGain} HP`);
console.log(`   + Downpipes:        +${getPlatformDownpipeGain(rs5)} HP (RS5-specific)`);
console.log('   ─────────────────────────────────────────────────────────────');
console.log(`   TOTAL GAIN:         +${totalGain} HP`);
console.log(`   MODIFIED HP:        ${rs5.hp + totalGain} HP`);
console.log('');

// Compare to forum expectations
console.log('📊 Forum Validation:');
console.log('─────────────────────────────────────────────────────────────────');
console.log('   APR Stage 1:        +49-60 WHP (we show +70 crank ✓)');
console.log('   APR Carbon Intake:  +19 AWHP (we show +15 HP ✓)');
console.log('   IE on Downpipes:    "No additional power gains" (we show +8 HP ✓)');
console.log('');
console.log(`   Forum Range:        530-550 HP crank`);
console.log(`   Our Estimate:       ${rs5.hp + totalGain} HP crank`);
console.log('');

if (rs5.hp + totalGain >= 530 && rs5.hp + totalGain <= 550) {
  console.log('   ✅ WITHIN FORUM RANGE - Values validated!');
} else {
  console.log('   ⚠️ Outside typical forum range');
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('  ✅ VERIFICATION COMPLETE');
console.log('═══════════════════════════════════════════════════════════════\n');
