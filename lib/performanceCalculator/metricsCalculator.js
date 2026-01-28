/**
 * AutoRev - Metrics Calculator
 * 
 * Calculate derived metrics (0-60, 1/4 mile, trap speed, braking, lateral G) after upgrades.
 * 
 * USES calculateSmartHpGain() for HP to ensure consistent calculations
 * with category caps, diminishing returns, and proper tune hierarchy.
 * 
 * ENHANCED (2026-01-25):
 * - Now uses physics models for 0-60, 1/4 mile, and trap speed
 * - Physics-based torque calculation with aspiration-aware multipliers
 * - Weight tracking for mods that add/remove weight
 * - Improved braking and lateral G with tire compound awareness
 * 
 * @module lib/performanceCalculator/metricsCalculator
 */

import { detectAspiration } from './constants.js';
import { calculateSmartHpGain } from './hpCalculator.js';
import { getEngineType } from '../../data/upgradePackages.js';
import { getUpgradeByKey } from '../upgrades.js';

// =============================================================================
// WEIGHT CHANGE CONSTANTS
// Mods that add or remove weight from the vehicle
// =============================================================================
const WEIGHT_CHANGES = {
  // Forced induction adds weight
  'supercharger-roots': 75,
  'supercharger-centrifugal': 45,
  'turbo-kit-single': 60,
  'turbo-kit-twin': 90,
  'intercooler': 15,
  
  // Safety equipment adds weight
  'roll-cage': 100,
  'harness': 5,
  'fire-extinguisher': 8,
  'bucket-seats': -10, // Lighter than stock
  
  // Weight reduction removes weight
  'carbon-hood': -25,
  'carbon-trunk': -18,
  'carbon-roof': -20,
  'carbon-fenders': -12,
  'wheels-lightweight': -35,
  'forged-wheels': -30,
  'battery-lightweight': -25,
  'titanium-exhaust': -15,
  'exhaust-catback': 0, // Usually similar weight
  'headers': -5, // Lighter than stock typically
  
  // BBK usually adds weight
  'big-brake-kit': 15,
};

// =============================================================================
// TIRE GRIP COEFFICIENTS
// Used for braking and lateral G calculations
// =============================================================================
const TIRE_GRIP_COEFFICIENT = {
  stock: 0.90,           // OEM all-season
  'tires-performance': 0.95,  // Performance summer
  'tires-summer': 0.95,
  'tires-track': 1.05,   // Extreme performance summer
  'tires-r-compound': 1.15,   // R-compound (Hoosier, NT01, etc.)
  'slicks': 1.30,        // Full slicks (not street legal)
};

// =============================================================================
// TORQUE MULTIPLIERS BY ASPIRATION
// Turbo cars gain more torque than HP due to boost
// =============================================================================
const TORQUE_MULTIPLIERS = {
  NA: 0.95,           // NA cars gain slightly less torque than HP
  Turbo: 1.20,        // Turbo cars gain more torque (low-end boost)
  TwinTurbo: 1.25,    // Twin turbo even more torque
  Supercharged: 1.10, // Supercharged moderate torque advantage
  TwinSC: 1.12,
};

/**
 * Calculate weight change from installed modifications
 * 
 * @param {string[]} upgradeKeys - Array of upgrade keys
 * @returns {number} - Net weight change in lbs (positive = heavier, negative = lighter)
 */
export function calculateWeightChange(upgradeKeys) {
  if (!upgradeKeys || upgradeKeys.length === 0) return 0;
  
  return upgradeKeys.reduce((total, key) => {
    return total + (WEIGHT_CHANGES[key] || 0);
  }, 0);
}

/**
 * Get the best tire grip coefficient from installed mods
 * 
 * @param {string[]} upgradeKeys - Array of upgrade keys
 * @returns {number} - Grip coefficient (higher = more grip)
 */
function getTireGripCoefficient(upgradeKeys) {
  if (!upgradeKeys || upgradeKeys.length === 0) return TIRE_GRIP_COEFFICIENT.stock;
  
  // Find the best tire upgrade
  const tireUpgrades = ['slicks', 'tires-r-compound', 'tires-track', 'tires-summer', 'tires-performance'];
  for (const tire of tireUpgrades) {
    if (upgradeKeys.includes(tire)) {
      return TIRE_GRIP_COEFFICIENT[tire];
    }
  }
  
  return TIRE_GRIP_COEFFICIENT.stock;
}

/**
 * Calculate torque gain based on HP gain and aspiration
 * 
 * Turbo cars gain disproportionately more torque than HP because
 * boost increases torque throughout the rev range, especially low-end.
 * 
 * @param {number} hpGain - HP gain from modifications
 * @param {string} aspiration - Engine aspiration type
 * @param {number} stockTorque - Stock torque for percentage calculation
 * @returns {number} - Estimated torque gain
 */
export function calculateTorqueGain(hpGain, aspiration, _stockTorque) {
  if (!hpGain || hpGain === 0) return 0;
  
  const multiplier = TORQUE_MULTIPLIERS[aspiration] || TORQUE_MULTIPLIERS.NA;
  return Math.round(hpGain * multiplier);
}

/**
 * Calculate derived metrics after upgrades
 * 
 * USES calculateSmartHpGain() INTERNALLY for HP to ensure consistency
 * across all calculation paths in the app.
 * 
 * NOW USES PHYSICS MODELS for 0-60, 1/4 mile, and trap speed instead of
 * simple rule-of-thumb estimates.
 * 
 * @param {Object} car - Car object with specs
 * @param {Object[]} selectedUpgrades - Array of upgrade packages/modules (with .key property)
 * @returns {Object} - Updated hard metrics
 */
export function calculateUpgradedMetrics(car, selectedUpgrades) {
  const engineType = getEngineType(car);
  const aspiration = detectAspiration(car);
  
  // ==========================================================================
  // HP CALCULATION - Use calculateSmartHpGain for consistency
  // This is the SINGLE SOURCE OF TRUTH for HP calculations
  // ==========================================================================
  const upgradeKeys = selectedUpgrades.map(u => u.key).filter(Boolean);
  const smartResult = calculateSmartHpGain(car, upgradeKeys, { includeConflicts: false });
  const totalHpGain = smartResult.totalGain;
  
  // ==========================================================================
  // TORQUE CALCULATION - Physics-based with aspiration awareness
  // Turbo cars gain more torque than HP due to boost characteristics
  // ==========================================================================
  const stockTorque = car.torque || Math.round((car.hp || 300) * 0.9);
  const torqueGain = calculateTorqueGain(totalHpGain, aspiration, stockTorque);
  const newTorque = stockTorque + torqueGain;
  
  // ==========================================================================
  // WEIGHT CALCULATION - Track weight changes from mods
  // ==========================================================================
  const weightChange = calculateWeightChange(upgradeKeys);
  const stockWeight = car.curbWeight || car.weight || 3500;
  const newWeight = stockWeight + weightChange;
  
  // Calculate new HP
  const newHp = (car.hp || 0) + totalHpGain;
  
  // ==========================================================================
  // 0-60 TIME - Use physics model instead of rule-of-thumb
  // ==========================================================================
  const newZeroToSixty = estimateZeroToSixty(newHp, newWeight, {
    drivetrain: car.drivetrain || 'RWD',
    transmission: detectTransmissionType(car),
  });
  
  // ==========================================================================
  // QUARTER MILE - Use stock as baseline, apply physics-based improvement
  // Modern cars with launch control, DCT, and AWD outperform classic formulas,
  // so we calculate the IMPROVEMENT from power gains rather than absolute values.
  // ==========================================================================
  const newQuarterMile = estimateQuarterMileImproved(
    car.hp || 400,
    newHp,
    newWeight,
    car.quarterMile,
    { drivetrain: car.drivetrain || 'RWD' }
  );
  
  // ==========================================================================
  // TRAP SPEED - Use stock as baseline, apply physics-based improvement
  // If no stock trap speed, estimate from quarter mile time
  // ==========================================================================
  const newTrapSpeed = estimateTrapSpeedImproved(
    car.hp || 400,
    newHp,
    newWeight,
    car.trapSpeed,
    { 
      drivetrain: car.drivetrain || 'RWD',
      stockQuarterMile: car.quarterMile,
    }
  );
  
  // ==========================================================================
  // BRAKING - Physics-based with tire compound awareness
  // Look up full upgrade data to get metricChanges
  // ==========================================================================
  const tireGrip = getTireGripCoefficient(upgradeKeys);
  let brakingImprovement = 0;
  let lateralGImprovement = 0;
  
  for (const upgradeRef of selectedUpgrades) {
    // Look up full upgrade data by key
    const fullUpgrade = upgradeRef.metricChanges 
      ? upgradeRef  // Already has full data
      : getUpgradeByKey(upgradeRef.key);  // Look up by key
    
    if (fullUpgrade?.metricChanges?.brakingImprovement) {
      brakingImprovement += fullUpgrade.metricChanges.brakingImprovement;
    }
    if (fullUpgrade?.metricChanges?.lateralGImprovement) {
      lateralGImprovement += fullUpgrade.metricChanges.lateralGImprovement;
    }
  }
  
  const newBraking = estimateBrakingDistance(
    newWeight, 
    brakingImprovement,
    tireGrip,
    car.braking60To0
  );
  
  // ==========================================================================
  // LATERAL G - Physics-based with tire/suspension/aero awareness
  // Add any explicit lateralGImprovement from mods on top of physics model
  // ==========================================================================
  let newLateralG = estimateLateralG(
    car.lateralG || 0.95,
    upgradeKeys,
    tireGrip
  );
  
  // Add explicit improvements from mods (e.g., sway bars have lateralGImprovement)
  if (lateralGImprovement > 0) {
    newLateralG = Math.min(1.50, newLateralG + lateralGImprovement);
  }
  
  // ==========================================================================
  // POWER TO WEIGHT - Now accounts for weight changes
  // ==========================================================================
  const powerToWeight = newWeight && newHp 
    ? (newHp / (newWeight / 1000)).toFixed(1)
    : null;
  
  return {
    hp: newHp,
    torque: newTorque,
    zeroToSixty: newZeroToSixty,
    quarterMile: newQuarterMile,
    trapSpeed: newTrapSpeed,
    braking60To0: newBraking,
    lateralG: newLateralG,
    curbWeight: newWeight,
    powerToWeight,
    // Include gains for display purposes
    hpGain: totalHpGain,
    torqueGain,
    weightChange,
    engineType,
    aspiration,
    // Confidence from HP calculation
    confidence: smartResult.confidence,
    confidenceLabel: smartResult.confidenceLabel,
  };
}

/**
 * Detect transmission type from car object
 * @param {Object} car 
 * @returns {string} - 'manual', 'automatic', 'dct', or 'cvt'
 */
function detectTransmissionType(car) {
  const trans = (car.trans || car.transmission || '').toLowerCase();
  
  if (trans.includes('dct') || trans.includes('pdk') || trans.includes('dual-clutch') || trans.includes('dual clutch')) {
    return 'dct';
  }
  if (trans.includes('manual') || trans.includes('mt') || trans.includes('6-speed') && !trans.includes('auto')) {
    return 'manual';
  }
  if (trans.includes('cvt')) {
    return 'cvt';
  }
  return 'automatic';
}

/**
 * Physics constants for 0-60 and quarter mile calculations
 */
const ACCELERATION_PHYSICS = {
  // Drivetrain efficiency losses (wheel HP = crank HP * efficiency)
  DRIVETRAIN_EFFICIENCY: {
    FWD: 0.88,
    RWD: 0.85,
    AWD: 0.80,
  },
  
  // Traction-limited launches (affects 0-60 more than 1/4 mile)
  LAUNCH_TRACTION: {
    FWD: 0.75,   // Traction limited, can't use all power
    RWD: 0.85,   // Better weight transfer
    AWD: 0.95,   // Best traction
  },
  
  // Shift time penalty (seconds per gear change)
  SHIFT_TIME: {
    manual: 0.4,
    automatic: 0.2,
    dct: 0.1,
    cvt: 0.0,
  },
  
  // Typical gears to 60 mph by car type
  GEARS_TO_60: 2.5, // Average - some do it in 2, some need 3
};

/**
 * Calculate 0-60 time from HP, weight, and drivetrain
 * Uses physics-based model with drivetrain losses and traction limits.
 * 
 * @param {number} hp - Crank horsepower
 * @param {number} weight - Weight in lbs
 * @param {Object} options - Optional parameters
 * @param {string} options.drivetrain - 'FWD', 'RWD', or 'AWD'
 * @param {string} options.transmission - 'manual', 'automatic', 'dct', 'cvt'
 * @returns {number|null} - Estimated 0-60 time in seconds
 */
export function estimateZeroToSixty(hp, weight, options = {}) {
  if (!hp || !weight) return null;
  
  const { drivetrain = 'RWD', transmission = 'automatic' } = options;
  
  // Normalize drivetrain to uppercase
  const dt = (drivetrain || 'RWD').toUpperCase();
  
  // Calculate wheel horsepower (account for drivetrain losses)
  const drivetrainEff = ACCELERATION_PHYSICS.DRIVETRAIN_EFFICIENCY[dt] || 0.85;
  const whp = hp * drivetrainEff;
  
  // Apply launch traction factor (FWD can't use all power off the line)
  const tractionFactor = ACCELERATION_PHYSICS.LAUNCH_TRACTION[dt] || 0.85;
  const effectiveWHP = whp * tractionFactor;
  
  // Physics-based calculation
  // Power = Force × Velocity, so acceleration depends on power-to-weight
  // Empirical model calibrated against real 0-60 times:
  // RS5 (444 HP, 4000 lbs, AWD) = 3.7s, M5 (600 HP, 4400 lbs, RWD) = 3.1s
  const k = 0.22; // Calibration constant based on real data
  const powerToWeight = weight / effectiveWHP;
  
  // Base time from physics (power of 0.85 gives better fit across power range)
  let baseTime = k * Math.pow(powerToWeight, 0.85) + 1.5;
  
  // Add shift time (approximately 2-3 shifts to 60)
  const shiftPenalty = (ACCELERATION_PHYSICS.SHIFT_TIME[transmission] || 0.2) * ACCELERATION_PHYSICS.GEARS_TO_60;
  baseTime += shiftPenalty;
  
  // Clamp to realistic range (no car goes 0-60 faster than 1.8s or slower than 15s)
  const result = Math.max(1.8, Math.min(15, baseTime));
  
  return Math.round(result * 10) / 10;
}

/**
 * Calculate quarter mile time from HP and weight
 * Uses physics-based ET prediction formula.
 * 
 * @param {number} hp - Horsepower
 * @param {number} weight - Weight in lbs
 * @param {Object} options - Optional parameters
 * @param {string} options.drivetrain - 'FWD', 'RWD', or 'AWD'
 * @returns {number|null} - Estimated quarter mile time in seconds
 */
export function estimateQuarterMile(hp, weight, options = {}) {
  if (!hp || !weight) return null;
  
  const { drivetrain = 'RWD' } = options;
  const dt = (drivetrain || 'RWD').toUpperCase();
  
  // Calculate wheel horsepower
  const drivetrainEff = ACCELERATION_PHYSICS.DRIVETRAIN_EFFICIENCY[dt] || 0.85;
  const whp = hp * drivetrainEff;
  
  // Refined ET formula (based on drag strip data analysis)
  // ET ≈ 5.825 × (weight / whp)^0.333 + traction_adjustment
  const baseET = 5.825 * Math.pow(weight / whp, 0.333);
  
  // AWD gets slightly better times due to consistent launches
  const tractionBonus = dt === 'AWD' ? -0.2 : (dt === 'FWD' ? 0.3 : 0);
  
  const et = baseET + tractionBonus;
  
  // Clamp to realistic range (7s to 20s)
  return Math.round(Math.max(7, Math.min(20, et)) * 10) / 10;
}

/**
 * Calculate improved quarter mile time using stock as baseline.
 * 
 * Modern cars with launch control, DCT, and AWD outperform classic drag formulas.
 * This function calculates the IMPROVEMENT from power gains rather than absolute values,
 * which gives more accurate projections for modified cars.
 * 
 * @param {number} stockHp - Stock horsepower
 * @param {number} upgradedHp - Upgraded horsepower
 * @param {number} weight - Current weight
 * @param {number|null} stockQuarterMile - Stock quarter mile time if known
 * @param {Object} options - Optional parameters
 * @returns {number|null} - Estimated upgraded quarter mile time
 */
export function estimateQuarterMileImproved(stockHp, upgradedHp, weight, stockQuarterMile, options = {}) {
  if (!stockHp || !upgradedHp || !weight) return null;
  
  // If no stock value, fall back to formula-based calculation
  if (!stockQuarterMile) {
    return estimateQuarterMile(upgradedHp, weight, options);
  }
  
  // Calculate the power ratio improvement
  // ET scales approximately with (power)^(-1/3) for the same weight
  // So if power increases by factor X, ET decreases by factor X^(1/3)
  const powerRatio = upgradedHp / stockHp;
  const etImprovement = 1 - Math.pow(1 / powerRatio, 0.333);
  
  // Apply improvement to stock time
  const newET = stockQuarterMile * (1 - etImprovement);
  
  // Clamp to realistic range
  return Math.round(Math.max(7, Math.min(20, newET)) * 10) / 10;
}

/**
 * Calculate trap speed from HP and weight
 * Trap speed at the 1/4 mile finish line.
 * 
 * @param {number} hp - Horsepower
 * @param {number} weight - Weight in lbs
 * @param {Object} options - Optional parameters
 * @param {string} options.drivetrain - 'FWD', 'RWD', or 'AWD'
 * @returns {number|null} - Estimated trap speed in MPH
 */
export function estimateTrapSpeed(hp, weight, options = {}) {
  if (!hp || !weight) return null;
  
  const { drivetrain = 'RWD' } = options;
  const dt = (drivetrain || 'RWD').toUpperCase();
  
  // Calculate wheel horsepower
  const drivetrainEff = ACCELERATION_PHYSICS.DRIVETRAIN_EFFICIENCY[dt] || 0.85;
  const whp = hp * drivetrainEff;
  
  // Refined formula: trap speed ≈ 224 × (whp / weight)^0.333
  const mph = 224 * Math.pow(whp / weight, 0.333);
  
  // Clamp to realistic range (60 mph to 200 mph)
  return Math.round(Math.max(60, Math.min(200, mph)));
}

/**
 * Calculate improved trap speed using stock as baseline.
 * 
 * Trap speed scales with the cube root of power, so this uses the stock value
 * (if known) and applies the physics-based improvement factor.
 * 
 * If stock trap speed isn't known but quarter mile time is, we can estimate
 * trap speed from the quarter mile time using the relationship:
 * trap ≈ 1320 / (ET - 5.5) for most performance cars
 * 
 * @param {number} stockHp - Stock horsepower
 * @param {number} upgradedHp - Upgraded horsepower
 * @param {number} weight - Current weight
 * @param {number|null} stockTrapSpeed - Stock trap speed if known
 * @param {Object} options - Optional parameters
 * @param {number} options.stockQuarterMile - Stock quarter mile time for trap estimation
 * @returns {number|null} - Estimated upgraded trap speed
 */
export function estimateTrapSpeedImproved(stockHp, upgradedHp, weight, stockTrapSpeed, options = {}) {
  if (!stockHp || !upgradedHp || !weight) return null;
  
  let effectiveStockTrap = stockTrapSpeed;
  
  // If no stock trap speed but we have quarter mile time, estimate from ET
  // Empirical relationship calibrated against real data:
  // RS5 (12.1s ET → 117 mph), M5 (11.0s → 125 mph), GTR (10.8s → 128 mph)
  // Formula: trap ≈ 243 - (ET × 10.4)
  if (!effectiveStockTrap && options.stockQuarterMile) {
    effectiveStockTrap = Math.round(243 - (options.stockQuarterMile * 10.4));
    // Clamp to realistic range
    effectiveStockTrap = Math.max(90, Math.min(150, effectiveStockTrap));
  }
  
  // If still no baseline, fall back to formula-based calculation
  if (!effectiveStockTrap) {
    return estimateTrapSpeed(upgradedHp, weight, options);
  }
  
  // Trap speed scales with (power)^(1/3)
  const powerRatio = upgradedHp / stockHp;
  const speedImprovement = Math.pow(powerRatio, 0.333) - 1;
  
  // Apply improvement to stock speed
  const newTrapSpeed = effectiveStockTrap * (1 + speedImprovement);
  
  // Clamp to realistic range
  return Math.round(Math.max(60, Math.min(200, newTrapSpeed)));
}

/**
 * Estimate 60-0 braking distance with physics model
 * 
 * Formula: d = v² / (2 × μ × g)
 * where μ is coefficient of friction (tire-dependent)
 * 
 * IMPORTANT: Stock tires should NEVER make braking worse than stock value.
 * Only performance tire upgrades improve braking distance.
 * 
 * @param {number} weight - Vehicle weight in lbs
 * @param {number} brakeUpgradeBonus - Feet improvement from brake mods
 * @param {number} tireGrip - Tire grip coefficient (0.9 stock to 1.3 slicks)
 * @param {number|null} stockBraking - Stock 60-0 distance if known
 * @returns {number|null} - Estimated 60-0 braking distance in feet
 */
export function estimateBrakingDistance(weight, brakeUpgradeBonus = 0, tireGrip = 0.95, stockBraking = null) {
  // Stock grip baseline - anything at or below this doesn't penalize
  const STOCK_GRIP_BASELINE = 0.95;
  
  // If we have stock braking, use it as baseline and apply improvements
  if (stockBraking) {
    // Tire grip improvement - ONLY applies if grip is BETTER than stock
    // Stock tires (0.90-0.95) should not make braking worse
    let distanceReduction = 0;
    if (tireGrip > STOCK_GRIP_BASELINE) {
      const gripImprovement = (tireGrip / STOCK_GRIP_BASELINE) - 1;
      distanceReduction = stockBraking * gripImprovement * 0.85; // 85% of theoretical
    }
    
    // Brake upgrade improvements (pads, fluid, BBK)
    const newDistance = stockBraking - distanceReduction - brakeUpgradeBonus;
    
    // Clamp to realistic range (can't brake better than physics allows)
    // Best modern cars: ~80ft, worst sports cars: ~130ft
    return Math.round(Math.max(75, Math.min(140, newDistance)));
  }
  
  // Physics-based calculation if no stock value
  const v = 88; // 60 mph in ft/s
  const g = 32.2; // ft/s²
  
  // Use the better of tireGrip or baseline for calculation
  const effectiveGrip = Math.max(tireGrip, STOCK_GRIP_BASELINE);
  
  // Base distance from physics
  const baseDistance = (v * v) / (2 * effectiveGrip * g);
  
  // Apply brake upgrade bonus
  const finalDistance = baseDistance - brakeUpgradeBonus;
  
  return Math.round(Math.max(75, Math.min(140, finalDistance)));
}

/**
 * Estimate lateral G with physics model
 * 
 * Lateral G is primarily determined by:
 * 1. Tire compound (biggest factor - 60%)
 * 2. Suspension setup (20%)
 * 3. Aero downforce (10% at high speed)
 * 4. Weight distribution (10%)
 * 
 * IMPORTANT: Stock tires should NEVER degrade lateral G below stock value.
 * Only performance tire upgrades improve lateral G.
 * 
 * @param {number} baseLateralG - Stock lateral G
 * @param {string[]} upgradeKeys - Installed mod keys
 * @param {number} tireGrip - Tire grip coefficient
 * @returns {number} - Estimated lateral G
 */
export function estimateLateralG(baseLateralG, upgradeKeys = [], tireGrip = 0.95) {
  if (!baseLateralG) baseLateralG = 0.90; // Default for average sports car
  
  let multiplier = 1.0;
  
  // Stock grip baseline - anything at or below this doesn't penalize
  const STOCK_GRIP_BASELINE = 0.95;
  
  // ==========================================================================
  // TIRE COMPOUND - Primary factor (only IMPROVES if better than stock)
  // ==========================================================================
  // Tire grip directly correlates to lateral G capability
  // Stock tires should not degrade lateral G below stock value
  if (tireGrip > STOCK_GRIP_BASELINE) {
    const gripImprovement = (tireGrip / STOCK_GRIP_BASELINE) - 1;
    multiplier += gripImprovement * 0.80; // 80% of grip improvement transfers to lateral G
  }
  
  // ==========================================================================
  // SUSPENSION - Secondary factor
  // ==========================================================================
  if (upgradeKeys.includes('coilovers-track')) {
    multiplier += 0.06; // Track coilovers: +6%
  } else if (upgradeKeys.includes('coilovers-street') || upgradeKeys.includes('coilovers')) {
    multiplier += 0.04; // Street coilovers: +4%
  } else if (upgradeKeys.includes('lowering-springs')) {
    multiplier += 0.02; // Lowering springs: +2%
  }
  
  if (upgradeKeys.includes('sway-bars')) {
    multiplier += 0.02; // Sway bars: +2%
  }
  
  // ==========================================================================
  // AERO - Adds downforce at speed
  // Note: Lateral G tests are typically at 60-80mph where aero has moderate effect
  // ==========================================================================
  if (upgradeKeys.includes('wing') || upgradeKeys.includes('gt-wing')) {
    multiplier += 0.03;
  }
  if (upgradeKeys.includes('splitter')) {
    multiplier += 0.02;
  }
  if (upgradeKeys.includes('diffuser')) {
    multiplier += 0.02;
  }
  
  // ==========================================================================
  // WEIGHT - Lighter cars have slightly better lateral G (less inertia)
  // ==========================================================================
  const weightMods = ['carbon-hood', 'carbon-trunk', 'carbon-roof', 'wheels-lightweight', 
                      'forged-wheels', 'battery-lightweight'];
  const hasWeightReduction = weightMods.some(mod => upgradeKeys.includes(mod));
  if (hasWeightReduction) {
    multiplier += 0.01; // Minor improvement from weight reduction
  }
  
  const result = baseLateralG * multiplier;
  
  // Clamp to realistic range
  // Best street tires: ~1.15g, R-compound: ~1.30g, Slicks: ~1.50g
  return Math.round(Math.max(0.75, Math.min(1.50, result)) * 100) / 100;
}
