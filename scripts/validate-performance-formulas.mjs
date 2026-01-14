#!/usr/bin/env node

/**
 * Validate Performance Calculation Formulas
 * Tests against known real-world data
 */

console.log('═══════════════════════════════════════════════════════════════');
console.log('  PERFORMANCE FORMULA VALIDATION');
console.log('═══════════════════════════════════════════════════════════════\n');

// Test vehicles with known performance data
const testVehicles = [
  {
    name: 'Audi RS5 B9',
    hp: 444,
    weight: 4012, // curb_weight from database
    drivetrain: 'AWD',
    actual060: 3.7,
    actualQuarter: 12.0,
    actualTrap: 114,
  },
  {
    name: 'Audi RS5 B9 (Modified +99 HP)',
    hp: 543, // 444 + 99
    weight: 4012,
    drivetrain: 'AWD',
    actual060: null, // Unknown, but should be ~3.2-3.4s
    actualQuarter: null,
    actualTrap: null,
  },
  {
    name: 'Ford Mustang GT (S550)',
    hp: 460,
    weight: 3705,
    drivetrain: 'RWD',
    actual060: 4.3,
    actualQuarter: 12.4,
    actualTrap: 116,
  },
  {
    name: 'Toyota Supra MK5',
    hp: 382,
    weight: 3397,
    drivetrain: 'RWD',
    actual060: 4.1,
    actualQuarter: 12.3,
    actualTrap: 114,
  },
  {
    name: 'Porsche 911 Carrera S (992)',
    hp: 443,
    weight: 3382,
    drivetrain: 'RWD',
    actual060: 3.5,
    actualQuarter: 11.6,
    actualTrap: 122,
  },
  {
    name: 'BMW M3 (G80)',
    hp: 473,
    weight: 3840,
    drivetrain: 'RWD',
    actual060: 4.1,
    actualQuarter: 12.2,
    actualTrap: 118,
  },
  {
    name: 'Tesla Model 3 Performance',
    hp: 450,
    weight: 4048,
    drivetrain: 'AWD',
    actual060: 3.1,
    actualQuarter: 11.6,
    actualTrap: 118,
  },
];

// Formula constants
const drivetrainK = {
  'AWD': 1.20,
  'RWD': 1.35,
  'FWD': 1.40,
};

function calculate060(hp, weight, drivetrain) {
  const driverWeight = 180;
  const totalWeight = weight + driverWeight;
  const weightToHp = totalWeight / hp;
  const k = drivetrainK[drivetrain] || 1.30;
  return Math.max(2.0, Math.sqrt(weightToHp) * k);
}

function calculateQuarter(hp, weight) {
  const driverWeight = 180;
  const totalWeight = weight + driverWeight;
  const weightToHp = totalWeight / hp;
  return 5.825 * Math.pow(weightToHp, 0.333);
}

function calculateTrap(hp, weight) {
  const driverWeight = 180;
  const totalWeight = weight + driverWeight;
  return 234 * Math.pow(hp / totalWeight, 0.333);
}

console.log('📊 FORMULA VALIDATION RESULTS:');
console.log('─────────────────────────────────────────────────────────────────\n');

let totalError060 = 0;
let totalErrorQuarter = 0;
let totalErrorTrap = 0;
let count = 0;

testVehicles.forEach(car => {
  const calc060 = calculate060(car.hp, car.weight, car.drivetrain);
  const calcQuarter = calculateQuarter(car.hp, car.weight);
  const calcTrap = calculateTrap(car.hp, car.weight);
  
  console.log(`${car.name}:`);
  console.log(`   HP: ${car.hp} | Weight: ${car.weight} lbs | ${car.drivetrain}`);
  console.log('');
  
  // 0-60
  if (car.actual060) {
    const error060 = Math.abs(calc060 - car.actual060);
    const pctError060 = ((error060 / car.actual060) * 100).toFixed(1);
    console.log(`   0-60:    Calc: ${calc060.toFixed(2)}s | Actual: ${car.actual060}s | Error: ${error060.toFixed(2)}s (${pctError060}%)`);
    totalError060 += error060;
    count++;
  } else {
    console.log(`   0-60:    Calc: ${calc060.toFixed(2)}s | Actual: TBD`);
  }
  
  // 1/4 mile
  if (car.actualQuarter) {
    const errorQuarter = Math.abs(calcQuarter - car.actualQuarter);
    const pctErrorQuarter = ((errorQuarter / car.actualQuarter) * 100).toFixed(1);
    console.log(`   1/4 mi:  Calc: ${calcQuarter.toFixed(2)}s | Actual: ${car.actualQuarter}s | Error: ${errorQuarter.toFixed(2)}s (${pctErrorQuarter}%)`);
    totalErrorQuarter += errorQuarter;
  } else {
    console.log(`   1/4 mi:  Calc: ${calcQuarter.toFixed(2)}s | Actual: TBD`);
  }
  
  // Trap speed
  if (car.actualTrap) {
    const errorTrap = Math.abs(calcTrap - car.actualTrap);
    const pctErrorTrap = ((errorTrap / car.actualTrap) * 100).toFixed(1);
    console.log(`   Trap:    Calc: ${calcTrap.toFixed(0)} mph | Actual: ${car.actualTrap} mph | Error: ${errorTrap.toFixed(0)} mph (${pctErrorTrap}%)`);
    totalErrorTrap += errorTrap;
  } else {
    console.log(`   Trap:    Calc: ${calcTrap.toFixed(0)} mph | Actual: TBD`);
  }
  
  console.log('');
});

console.log('═══════════════════════════════════════════════════════════════');
console.log('📊 AVERAGE ERRORS:');
console.log('─────────────────────────────────────────────────────────────────');
console.log(`   0-60 Average Error:     ${(totalError060 / count).toFixed(2)}s`);
console.log(`   1/4 Mile Average Error: ${(totalErrorQuarter / count).toFixed(2)}s`);
console.log(`   Trap Speed Average Error: ${(totalErrorTrap / count).toFixed(0)} mph`);
console.log('');

if ((totalError060 / count) < 0.5 && (totalErrorQuarter / count) < 0.5) {
  console.log('   ✅ FORMULAS VALIDATED - Errors within acceptable range');
} else {
  console.log('   ⚠️ FORMULAS NEED ADJUSTMENT');
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════\n');

// Show what RS5 should display
console.log('📊 YOUR RS5 SHOULD SHOW:');
console.log('─────────────────────────────────────────────────────────────────');
const rs5Stock = testVehicles[0];
const rs5Mod = testVehicles[1];
console.log('');
console.log('   STOCK RS5 B9:');
console.log(`   0-60:      ${calculate060(rs5Stock.hp, rs5Stock.weight, rs5Stock.drivetrain).toFixed(1)}s`);
console.log(`   1/4 Mile:  ${calculateQuarter(rs5Stock.hp, rs5Stock.weight).toFixed(1)}s`);
console.log(`   Trap:      ${calculateTrap(rs5Stock.hp, rs5Stock.weight).toFixed(0)} mph`);
console.log('');
console.log('   MODIFIED RS5 B9 (+99 HP):');
console.log(`   0-60:      ${calculate060(rs5Mod.hp, rs5Mod.weight, rs5Mod.drivetrain).toFixed(1)}s`);
console.log(`   1/4 Mile:  ${calculateQuarter(rs5Mod.hp, rs5Mod.weight).toFixed(1)}s`);
console.log(`   Trap:      ${calculateTrap(rs5Mod.hp, rs5Mod.weight).toFixed(0)} mph`);
console.log('');
