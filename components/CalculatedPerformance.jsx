'use client';

/**
 * Calculated Performance - Physics-based 0-60, 1/4 mile, braking estimates
 * Uses validated empirical formulas for realistic performance predictions
 */

import React from 'react';
import styles from './CalculatedPerformance.module.css';

export default function CalculatedPerformance({
  stockHp,
  estimatedHp,
  weight = 3500,
  drivetrain = 'AWD',
  tireCompound = 'summer',
  weightMod = 0, 
  driverWeight = 180, 
  finalDrive = null,
  wheelWeight = null, // lbs per wheel (stock ~25, forged ~18)
  handlingScore = 100,
  brakingScore = 100,
}) {
  // Guard against invalid inputs
  const safeStockHp = (typeof stockHp === 'number' && !isNaN(stockHp) && stockHp > 0) ? stockHp : 300;
  const safeEstimatedHp = (typeof estimatedHp === 'number' && !isNaN(estimatedHp) && estimatedHp > 0) ? estimatedHp : safeStockHp;
  const safeWeight = (typeof weight === 'number' && !isNaN(weight) && weight > 0) ? weight : 3500;
  
  // Adjust weight for modifications and driver
  const totalWeight = safeWeight + (weightMod || 0) + (driverWeight || 180);
  const stockTotalWeight = safeWeight + 180; // Stock with driver
  
  // Wheel weight affects rotational inertia (lighter wheels = faster accel)
  // Rule of thumb: 1lb of wheel weight = 4-5lbs of static weight for acceleration
  const stockWheelWeight = 25; // Average stock wheel
  const currentWheelWeight = wheelWeight || stockWheelWeight;
  const wheelWeightDiff = (stockWheelWeight - currentWheelWeight) * 4; // Effective weight savings
  const effectiveWeight = totalWeight - wheelWeightDiff;
  const stockEffectiveWeight = stockTotalWeight;
  
  // Tire grip multiplier for launch (affects 0-60 more than 1/4)
  const tireGripMap = {
    'all-season': 0.82,
    'summer': 0.90,
    'max-performance': 0.95,
    'r-comp': 1.05,
    'drag-radial': 1.25, // Massive launch advantage
    'slick': 1.35,
  };
  const tireGrip = tireGripMap[tireCompound] || 0.90;
  
  // Power to weight ratio (hp per ton, where ton = 2000 lbs)
  const powerToWeight = (safeEstimatedHp / effectiveWeight) * 2000;
  const stockPtw = (safeStockHp / stockEffectiveWeight) * 2000;
  
  // ==========================================================================
  // 0-60 MPH CALCULATION
  // ==========================================================================
  // Empirical formula validated against real-world data:
  // 0-60 = sqrt(weight/hp) * k, where k varies by drivetrain
  // AWD: k ≈ 1.2 (best launch, minimal wheelspin)
  // RWD: k ≈ 1.35 (wheelspin limited)
  // FWD: k ≈ 1.4 (torque steer, weight transfer issues)
  
  const drivetrainK = {
    'AWD': 1.20,
    'RWD': 1.35,
    'FWD': 1.40,
    '4WD': 1.25,
  };
  const baseK = drivetrainK[drivetrain] || 1.30;
  
  // Tire grip affects launch (drag radials are huge for RWD)
  const tireKMultiplier = {
    'all-season': 1.08,
    'summer': 1.0,
    'max-performance': 0.97,
    'r-comp': 0.93,
    'drag-radial': 0.85, // Massive launch improvement
    'slick': 0.82,
  };
  const kTire = tireKMultiplier[tireCompound] || 1.0;
  
  // Calculate 0-60
  const weightToHp = effectiveWeight / safeEstimatedHp;
  const stockWeightToHp = stockEffectiveWeight / safeStockHp;
  
  // Minimum realistic 0-60 times (even hypercars can't beat physics)
  const estimated060 = Math.max(2.0, Math.sqrt(weightToHp) * baseK * kTire);
  const stock060 = Math.max(2.5, Math.sqrt(stockWeightToHp) * baseK);
  
  // ==========================================================================
  // 1/4 MILE CALCULATION  
  // ==========================================================================
  // Classic empirical formula: ET = 5.825 * (weight/hp)^0.333
  // This is well-validated across many vehicles
  const tractionBonus = tireCompound === 'drag-radial' ? 0.94 : tireCompound === 'slick' ? 0.92 : 1.0;
  const estimatedQuarter = 5.825 * Math.pow(weightToHp, 0.333) * tractionBonus;
  const stockQuarter = 5.825 * Math.pow(stockWeightToHp, 0.333);

  // ==========================================================================
  // TRAP SPEED CALCULATION
  // ==========================================================================
  // Formula: Trap Speed (mph) = 234 * (hp/weight)^0.333
  // Adjusted from 224 to 234 based on modern vehicle data
  const finalDriveFactor = finalDrive ? Math.min(1.02, 3.5 / finalDrive) : 1.0;
  const estimatedTrap = 234 * Math.pow(safeEstimatedHp / effectiveWeight, 0.333) * finalDriveFactor;
  const stockTrap = 234 * Math.pow(safeStockHp / stockEffectiveWeight, 0.333);
  
  // Braking distance (60-0) estimation
  // Base: ~120ft for average car at 60mph
  // Better brakes/tires reduce this
  const stockBraking60 = 120; // feet
  const brakingImprovement = (brakingScore - 100) / 100; // percentage improvement
  const estimatedBraking60 = Math.round(stockBraking60 * (1 - brakingImprovement * 0.25));
  
  // Lateral G estimation
  // Stock sedan ~0.85g, sport car ~0.95g
  const baseG = 0.90;
  const handlingImprovement = (handlingScore - 100) / 100;
  const estimatedLateralG = (baseG * (1 + handlingImprovement * 0.3)).toFixed(2);
  const stockLateralG = baseG.toFixed(2);
  
  // Safe number formatting to prevent NaN display
  const safeFixed = (num, decimals = 1, fallback = '—') => {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) return fallback;
    return num.toFixed(decimals);
  };
  
  const safeDelta = (from, to, decimals = 1) => {
    const diff = from - to;
    if (isNaN(diff) || !isFinite(diff)) return '0';
    return diff.toFixed(decimals);
  };

  return (
    <div className={styles.calcPerformance}>
      <div className={styles.calcHeader}>
        <span className={styles.calcTitle}>Calculated Performance</span>
        <span className={styles.calcSubtitle}>Based on {safeWeight.toLocaleString()} lbs, {drivetrain}</span>
      </div>
      <div className={styles.calcGrid}>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>0-60 mph</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{safeFixed(stock060)}s</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{safeFixed(estimated060)}s</span>
          </div>
          <div className={styles.calcDelta}>-{safeDelta(stock060, estimated060)}s</div>
        </div>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>1/4 Mile</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{safeFixed(stockQuarter)}s</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{safeFixed(estimatedQuarter)}s</span>
          </div>
          <div className={styles.calcDelta}>-{safeDelta(stockQuarter, estimatedQuarter)}s</div>
        </div>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>Trap Speed</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{safeFixed(stockTrap, 0)}</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{safeFixed(estimatedTrap, 0)} mph</span>
          </div>
          <div className={styles.calcDelta}>+{safeDelta(stockTrap, estimatedTrap, 0)} mph</div>
        </div>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>Power/Weight</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{safeFixed(stockPtw, 0)}</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{safeFixed(powerToWeight, 0)} hp/ton</span>
          </div>
          <div className={styles.calcDelta}>+{safeDelta(stockPtw, powerToWeight, 0)}</div>
        </div>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>60-0 Braking</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{stockBraking60}ft</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{estimatedBraking60} ft</span>
          </div>
          <div className={styles.calcDelta}>{estimatedBraking60 <= stockBraking60 ? '-' : '+'}{Math.abs(stockBraking60 - estimatedBraking60)} ft</div>
        </div>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>Lateral G</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{stockLateralG}g</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{estimatedLateralG}g</span>
          </div>
          <div className={styles.calcDelta}>+{safeFixed(parseFloat(estimatedLateralG) - parseFloat(stockLateralG), 2, '0.00')}g</div>
        </div>
      </div>
    </div>
  );
}
