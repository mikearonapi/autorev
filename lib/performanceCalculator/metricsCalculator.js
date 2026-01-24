/**
 * AutoRev - Metrics Calculator
 * 
 * Calculate derived metrics (0-60, braking, lateral G) after upgrades.
 * 
 * USES calculateSmartHpGain() for HP to ensure consistent calculations
 * with category caps, diminishing returns, and proper tune hierarchy.
 * 
 * @module lib/performanceCalculator/metricsCalculator
 */

import { getEngineType } from '../../data/upgradePackages.js';
import { calculateSmartHpGain } from './hpCalculator.js';

/**
 * Calculate derived metrics after upgrades
 * 
 * USES calculateSmartHpGain() INTERNALLY for HP to ensure consistency
 * across all calculation paths in the app.
 * 
 * @param {Object} car - Car object with specs
 * @param {Object[]} selectedUpgrades - Array of upgrade packages/modules (with .key property)
 * @returns {Object} - Updated hard metrics
 */
export function calculateUpgradedMetrics(car, selectedUpgrades) {
  const engineType = getEngineType(car);
  
  // ==========================================================================
  // HP CALCULATION - Use calculateSmartHpGain for consistency
  // This is the SINGLE SOURCE OF TRUTH for HP calculations
  // ==========================================================================
  const upgradeKeys = selectedUpgrades.map(u => u.key).filter(Boolean);
  const smartResult = calculateSmartHpGain(car, upgradeKeys, { includeConflicts: false });
  const totalHpGain = smartResult.totalGain;
  
  // ==========================================================================
  // OTHER METRICS - Braking, lateral G, 0-60 improvements
  // ==========================================================================
  let totalZeroToSixtyImprovement = 0;
  let totalBrakingImprovement = 0;
  let totalLateralGImprovement = 0;
  
  for (const upgrade of selectedUpgrades) {
    if (upgrade.metricChanges) {
      // 0-60 improvement scales with HP gains relative to weight
      if (upgrade.metricChanges.zeroToSixtyImprovement) {
        let zeroToSixtyGain = upgrade.metricChanges.zeroToSixtyImprovement;
        // More HP = more acceleration improvement
        if (totalHpGain > 200) {
          zeroToSixtyGain *= 1.5;
        } else if (totalHpGain > 100) {
          zeroToSixtyGain *= 1.2;
        }
        totalZeroToSixtyImprovement += zeroToSixtyGain;
      }
      
      totalBrakingImprovement += upgrade.metricChanges.brakingImprovement || 0;
      totalLateralGImprovement += upgrade.metricChanges.lateralGImprovement || 0;
    }
  }
  
  // Calculate new HP
  const newHp = (car.hp || 0) + totalHpGain;
  
  // Calculate 0-60 based on HP gain (if not explicitly calculated)
  // Rule of thumb: 10% HP gain = ~0.2s faster 0-60 for a ~500 HP car
  let zeroToSixtyReduction = totalZeroToSixtyImprovement;
  if (totalHpGain > 0 && zeroToSixtyReduction === 0 && car.zeroToSixty) {
    // Estimate 0-60 improvement from HP gain
    const hpPercentGain = totalHpGain / (car.hp || 400);
    zeroToSixtyReduction = car.zeroToSixty * hpPercentGain * 0.4; // Conservative estimate
  }
  
  return {
    hp: newHp,
    zeroToSixty: car.zeroToSixty ? Math.max(2.0, car.zeroToSixty - zeroToSixtyReduction) : null,
    braking60To0: car.braking60To0 ? Math.max(70, car.braking60To0 - totalBrakingImprovement) : null,
    lateralG: car.lateralG ? Math.min(1.6, car.lateralG + totalLateralGImprovement) : null,
    // Pass through unchanged metrics
    torque: car.torque,
    curbWeight: car.curbWeight,
    quarterMile: car.quarterMile,
    powerToWeight: car.curbWeight && newHp 
      ? (newHp / (car.curbWeight / 1000)).toFixed(1)
      : null,
    // Include gains for display purposes
    hpGain: totalHpGain,
    engineType: engineType,
  };
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
  
  // Calculate wheel horsepower (account for drivetrain losses)
  const drivetrainEff = ACCELERATION_PHYSICS.DRIVETRAIN_EFFICIENCY[drivetrain] || 0.85;
  const whp = hp * drivetrainEff;
  
  // Apply launch traction factor (FWD can't use all power off the line)
  const tractionFactor = ACCELERATION_PHYSICS.LAUNCH_TRACTION[drivetrain] || 0.85;
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
  
  // Calculate wheel horsepower
  const drivetrainEff = ACCELERATION_PHYSICS.DRIVETRAIN_EFFICIENCY[drivetrain] || 0.85;
  const whp = hp * drivetrainEff;
  
  // Refined ET formula (based on drag strip data analysis)
  // ET ≈ 5.825 × (weight / whp)^0.333 + traction_adjustment
  const baseET = 5.825 * Math.pow(weight / whp, 0.333);
  
  // AWD gets slightly better times due to consistent launches
  const tractionBonus = drivetrain === 'AWD' ? -0.2 : (drivetrain === 'FWD' ? 0.3 : 0);
  
  const et = baseET + tractionBonus;
  
  // Clamp to realistic range (7s to 20s)
  return Math.round(Math.max(7, Math.min(20, et)) * 10) / 10;
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
  
  // Calculate wheel horsepower
  const drivetrainEff = ACCELERATION_PHYSICS.DRIVETRAIN_EFFICIENCY[drivetrain] || 0.85;
  const whp = hp * drivetrainEff;
  
  // Refined formula: trap speed ≈ 224 × (whp / weight)^0.333
  const mph = 224 * Math.pow(whp / weight, 0.333);
  
  // Clamp to realistic range (60 mph to 200 mph)
  return Math.round(Math.max(60, Math.min(200, mph)));
}
