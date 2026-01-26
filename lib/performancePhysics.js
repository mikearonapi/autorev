/**
 * AutoRev - Performance Physics Engine
 * 
 * Physics-based calculations for vehicle performance metrics.
 * These provide baseline estimates that are then calibrated by real data.
 * 
 * FUTURE PERFORMANCE MODEL - Do not use in production yet.
 * This is part of the hybrid physics + calibration system.
 */

// ============================================================================
// PHYSICAL CONSTANTS
// ============================================================================

export const PHYSICS = {
  // Gravitational acceleration (m/s²)
  GRAVITY: 9.81,
  
  // Air density at sea level (kg/m³)
  AIR_DENSITY_SEA_LEVEL: 1.225,
  
  // Speed conversions
  MPH_TO_MS: 0.44704,
  MS_TO_MPH: 2.23694,
  
  // Weight conversions
  LB_TO_KG: 0.453592,
  KG_TO_LB: 2.20462,
  
  // Power conversions
  HP_TO_WATTS: 745.7,
  WATTS_TO_HP: 0.00134102,
};

// ============================================================================
// DRIVETRAIN EFFICIENCY
// ============================================================================

/**
 * Drivetrain power loss percentages (crank HP to wheel HP)
 * Based on industry averages from dyno data
 */
export const DRIVETRAIN_LOSS = {
  FWD: 0.12,      // 12% loss - single transaxle
  RWD_MANUAL: 0.15, // 15% loss - transmission + driveshaft + diff
  RWD_AUTO: 0.17,   // 17% loss - torque converter adds loss
  AWD_MANUAL: 0.20, // 20% loss - additional transfer case + front diff
  AWD_AUTO: 0.22,   // 22% loss
  AWD_DCT: 0.18,    // 18% loss - DCT is more efficient
};

/**
 * Get drivetrain efficiency (WHP / Crank HP ratio)
 */
export function getDrivetrainEfficiency(drivetrain, transmission = 'auto') {
  const dt = drivetrain?.toUpperCase() || 'RWD';
  const trans = transmission?.toLowerCase() || 'auto';
  
  if (dt.includes('AWD') || dt.includes('4WD') || dt === 'AWD') {
    if (trans.includes('dct') || trans.includes('pdk') || trans.includes('dual')) {
      return 1 - DRIVETRAIN_LOSS.AWD_DCT;
    }
    return trans.includes('manual') ? (1 - DRIVETRAIN_LOSS.AWD_MANUAL) : (1 - DRIVETRAIN_LOSS.AWD_AUTO);
  }
  
  if (dt.includes('FWD') || dt === 'FWD') {
    return 1 - DRIVETRAIN_LOSS.FWD;
  }
  
  // Default to RWD
  return trans.includes('manual') ? (1 - DRIVETRAIN_LOSS.RWD_MANUAL) : (1 - DRIVETRAIN_LOSS.RWD_AUTO);
}

/**
 * Convert crank HP to wheel HP
 */
export function crankToWheelHp(crankHp, drivetrain, transmission) {
  return Math.round(crankHp * getDrivetrainEfficiency(drivetrain, transmission));
}

/**
 * Convert wheel HP to crank HP
 */
export function wheelToCrankHp(wheelHp, drivetrain, transmission) {
  return Math.round(wheelHp / getDrivetrainEfficiency(drivetrain, transmission));
}

// ============================================================================
// 0-60 MPH CALCULATION
// ============================================================================

/**
 * Tire grip coefficients by type
 * Affects launch traction-limited acceleration
 */
const TIRE_GRIP = {
  'all-season': 0.85,
  'summer': 0.95,
  'performance-summer': 1.0,
  'max-performance': 1.05,
  'r-compound': 1.15,
  'slick': 1.30,
};

/**
 * Launch efficiency factors
 * How well power is put to the ground during launch
 */
const LAUNCH_EFFICIENCY = {
  FWD: 0.70,      // Torque steer, wheel spin
  RWD: 0.75,      // Wheel spin on hard launch
  AWD: 0.90,      // Best traction
  AWD_LAUNCH: 0.95, // AWD with launch control
};

/**
 * Calculate 0-60 mph time using physics model
 * 
 * Simplified model that accounts for:
 * - Traction-limited launch (0-20 mph)
 * - Power-limited acceleration (20-60 mph)
 * - Air drag (small effect at these speeds)
 * 
 * @param {Object} params
 * @param {number} params.wheelHp - Wheel horsepower
 * @param {number} params.torque - Peak torque (lb-ft)
 * @param {number} params.weightLbs - Curb weight in pounds
 * @param {string} params.drivetrain - FWD, RWD, AWD
 * @param {string} params.tireType - Tire compound type
 * @param {boolean} params.hasLaunchControl - Whether car has launch control
 * @returns {number} - Estimated 0-60 time in seconds
 */
export function calculate060Time({
  wheelHp,
  torque,
  weightLbs,
  drivetrain = 'RWD',
  tireType = 'summer',
  hasLaunchControl = false,
}) {
  // Convert to metric
  const weightKg = weightLbs * PHYSICS.LB_TO_KG;
  const powerWatts = wheelHp * PHYSICS.HP_TO_WATTS;
  
  // Get tire grip coefficient
  const tireGrip = TIRE_GRIP[tireType] || TIRE_GRIP['summer'];
  
  // Get launch efficiency
  let launchEff = LAUNCH_EFFICIENCY[drivetrain.toUpperCase()] || LAUNCH_EFFICIENCY.RWD;
  if (hasLaunchControl && drivetrain.toUpperCase().includes('AWD')) {
    launchEff = LAUNCH_EFFICIENCY.AWD_LAUNCH;
  }
  
  // Phase 1: Traction-limited (0-20 mph typically)
  // Maximum acceleration = grip * g * launch_efficiency
  const maxAccelMs2 = tireGrip * PHYSICS.GRAVITY * launchEff;
  const v1 = 20 * PHYSICS.MPH_TO_MS; // 20 mph in m/s
  const t1 = v1 / maxAccelMs2; // Time to 20 mph
  
  // Phase 2: Power-limited (20-60 mph)
  // Average velocity during this phase
  const v2Start = v1;
  const v2End = 60 * PHYSICS.MPH_TO_MS;
  const vAvg = (v2Start + v2End) / 2;
  
  // Force available at average velocity: P = F * v, so F = P / v
  const forceAvailable = powerWatts / vAvg;
  
  // Account for air drag (simplified)
  const dragCoeff = 0.32; // Typical sports car
  const frontalArea = 2.2; // m² typical
  const airDrag = 0.5 * PHYSICS.AIR_DENSITY_SEA_LEVEL * dragCoeff * frontalArea * (vAvg * vAvg);
  
  const netForce = forceAvailable - airDrag;
  const accelPhase2 = netForce / weightKg;
  
  // Time for phase 2
  const deltaV = v2End - v2Start;
  const t2 = deltaV / accelPhase2;
  
  // Total time
  let totalTime = t1 + t2;
  
  // Apply real-world correction factor (accounts for shift times, boost lag, etc.)
  // Turbo cars typically lose 0.2-0.3s to boost build
  // Manual cars lose 0.1-0.2s per shift
  const realWorldFactor = 1.08; // 8% slower than theoretical
  totalTime *= realWorldFactor;
  
  // Clamp to reasonable range
  return Math.max(2.0, Math.min(15.0, Math.round(totalTime * 100) / 100));
}

/**
 * Estimate 0-60 improvement from HP gain
 * Uses simplified power-to-weight relationship
 * 
 * @param {number} stockTime - Stock 0-60 time
 * @param {number} stockHp - Stock HP
 * @param {number} hpGain - HP gained from mods
 * @returns {number} - Estimated time reduction in seconds
 */
export function estimate060Improvement(stockTime, stockHp, hpGain) {
  if (!stockTime || !stockHp || !hpGain) return 0;
  
  // Power-to-time relationship is roughly: t ∝ 1/√P
  // So: t_new/t_old = √(P_old/P_new)
  const newHp = stockHp + hpGain;
  const timeRatio = Math.sqrt(stockHp / newHp);
  const newTime = stockTime * timeRatio;
  
  // Apply diminishing returns at very high power levels
  // (traction becomes the limit, not power)
  let improvement = stockTime - newTime;
  
  // Cap improvement based on power-to-weight
  // Beyond ~600 HP, gains are increasingly traction-limited
  if (newHp > 600) {
    improvement *= 0.85;
  }
  if (newHp > 800) {
    improvement *= 0.75;
  }
  
  return Math.round(improvement * 100) / 100;
}

// ============================================================================
// QUARTER MILE CALCULATION
// ============================================================================

/**
 * Calculate quarter mile time using physics model
 * Based on ET = 5.825 * (weight/power)^0.333 approximation with corrections
 * 
 * @param {Object} params
 * @param {number} params.wheelHp - Wheel horsepower
 * @param {number} params.weightLbs - Curb weight in pounds
 * @param {string} params.drivetrain - FWD, RWD, AWD
 * @param {string} params.tireType - Tire compound type
 * @returns {Object} - { et: elapsed time, trapSpeed: trap speed mph }
 */
export function calculateQuarterMile({
  wheelHp,
  weightLbs,
  drivetrain = 'RWD',
  tireType = 'summer',
}) {
  // Classic formula: ET = 5.825 * (W/P)^0.333
  // Where W = weight in lbs, P = power in HP
  const ratio = weightLbs / wheelHp;
  let et = 5.825 * Math.pow(ratio, 0.333);
  
  // Trap speed formula: MPH = 234 * (P/W)^0.333
  const trapSpeed = 234 * Math.pow(wheelHp / weightLbs, 0.333);
  
  // Apply drivetrain efficiency for launch
  const launchEff = LAUNCH_EFFICIENCY[drivetrain.toUpperCase()] || LAUNCH_EFFICIENCY.RWD;
  et *= (1 / launchEff) * 1.02; // Worse traction = slower ET
  
  // Apply tire grip factor
  const tireGrip = TIRE_GRIP[tireType] || TIRE_GRIP['summer'];
  et *= (1 / tireGrip) * 1.01;
  
  // Real-world correction (street vs drag strip)
  et *= 1.03; // Street tires, no prep, etc.
  
  return {
    et: Math.round(et * 100) / 100,
    trapSpeed: Math.round(trapSpeed * 10) / 10,
  };
}

/**
 * Estimate quarter mile improvement from HP gain
 */
export function estimateQuarterMileImprovement(stockEt, stockHp, hpGain, weightLbs) {
  if (!stockEt || !stockHp || !hpGain) return { etImprovement: 0, trapSpeedGain: 0 };
  
  // Recalculate with new power
  const newHp = stockHp + hpGain;
  
  // ET scales roughly with (W/P)^0.333
  const stockRatio = weightLbs / stockHp;
  const newRatio = weightLbs / newHp;
  const etRatio = Math.pow(newRatio / stockRatio, 0.333);
  const newEt = stockEt * etRatio;
  
  // Trap speed scales with (P/W)^0.333
  const trapSpeedRatio = Math.pow(newHp / stockHp, 0.333);
  
  return {
    etImprovement: Math.round((stockEt - newEt) * 100) / 100,
    trapSpeedGain: Math.round((trapSpeedRatio - 1) * 100), // As percentage
  };
}

// ============================================================================
// HP GAIN PHYSICS MODEL
// ============================================================================

/**
 * Engine breathing efficiency by aspiration type
 * Affects how much power gain is possible from airflow mods
 */
const ASPIRATION_EFFICIENCY = {
  NA: {
    maxVE: 0.95,        // Max volumetric efficiency achievable
    tuneGainPercent: 0.05, // 5% max from tune alone
    intakeGainPercent: 0.03,
    exhaustGainPercent: 0.06,
    camsGainPercent: 0.10,
    headworkGainPercent: 0.12,
  },
  Turbo: {
    maxBoost: 30,       // PSI typical max with stock internals
    tuneGainPerPsi: 0.03, // 3% HP per PSI of boost increase
    stage1BoostIncrease: 4, // PSI increase for Stage 1
    stage2BoostIncrease: 7,
    stage3BoostIncrease: 12,
  },
  Supercharged: {
    pulleyGainPercent: 0.12, // 12% from smaller pulley
    tuneGainPercent: 0.08,
  },
};

/**
 * Calculate expected HP gain from a tune based on engine physics
 * 
 * @param {Object} params
 * @param {number} params.stockHp - Stock crank HP
 * @param {string} params.aspiration - 'NA', 'Turbo', 'TwinTurbo', 'Supercharged'
 * @param {string} params.tuneStage - 'stage1', 'stage2', 'stage3'
 * @param {number} params.stockBoostPsi - Stock boost (for turbo/SC cars)
 * @returns {Object} - { hpGain, boostIncrease, confidence }
 */
export function calculateTuneGain({
  stockHp,
  aspiration,
  tuneStage = 'stage1',
  stockBoostPsi = 0,
}) {
  const aspirationType = aspiration?.includes('Turbo') ? 'Turbo' 
    : aspiration?.includes('Supercharged') || aspiration?.includes('SC') ? 'Supercharged'
    : 'NA';
  
  let hpGain = 0;
  let boostIncrease = 0;
  let confidence = 0.6;
  
  if (aspirationType === 'Turbo') {
    const config = ASPIRATION_EFFICIENCY.Turbo;
    
    // Boost increase based on stage
    switch (tuneStage) {
      case 'stage1':
        boostIncrease = config.stage1BoostIncrease;
        break;
      case 'stage2':
        boostIncrease = config.stage2BoostIncrease;
        break;
      case 'stage3':
        boostIncrease = config.stage3BoostIncrease;
        break;
    }
    
    // HP gain from boost increase
    hpGain = stockHp * (boostIncrease * config.tuneGainPerPsi);
    confidence = 0.65;
    
  } else if (aspirationType === 'Supercharged') {
    const config = ASPIRATION_EFFICIENCY.Supercharged;
    
    if (tuneStage === 'stage1') {
      // Just tune, no pulley
      hpGain = stockHp * config.tuneGainPercent;
    } else {
      // Pulley + tune
      hpGain = stockHp * (config.pulleyGainPercent + config.tuneGainPercent);
    }
    confidence = 0.65;
    
  } else {
    // NA engine
    const config = ASPIRATION_EFFICIENCY.NA;
    hpGain = stockHp * config.tuneGainPercent;
    confidence = 0.55;
  }
  
  return {
    hpGain: Math.round(hpGain),
    boostIncrease: Math.round(boostIncrease * 10) / 10,
    confidence,
  };
}

/**
 * Calculate expected HP gain from adding forced induction to NA engine
 * 
 * @param {Object} params
 * @param {number} params.stockHp - Stock crank HP
 * @param {number} params.displacement - Displacement in liters
 * @param {string} params.fiType - 'supercharger-roots', 'supercharger-centrifugal', 'turbo-single', 'turbo-twin'
 * @param {number} params.targetBoostPsi - Target boost level
 * @returns {Object} - { hpGain, confidence }
 */
export function calculateForcedInductionGain({
  stockHp,
  displacement,
  fiType,
  targetBoostPsi = 8,
}) {
  // Base gain from pressurizing intake
  // Rule of thumb: Each PSI of boost adds ~7% HP (varies by efficiency)
  const boostEfficiency = {
    'supercharger-roots': 0.08,      // 8% per PSI, positive displacement
    'supercharger-centrifugal': 0.065, // 6.5% per PSI, less efficient at low RPM
    'turbo-single': 0.07,            // 7% per PSI
    'turbo-twin': 0.075,             // 7.5% per PSI, better spool
  };
  
  const efficiency = boostEfficiency[fiType] || 0.07;
  const baseGainPercent = targetBoostPsi * efficiency;
  
  // Larger displacement engines make more absolute power from boost
  const displacementFactor = Math.min(1.3, 0.8 + (displacement / 10));
  
  const hpGain = stockHp * baseGainPercent * displacementFactor;
  
  return {
    hpGain: Math.round(hpGain),
    confidence: 0.60,
    formula: `${stockHp} × ${(baseGainPercent * 100).toFixed(0)}% × ${displacementFactor.toFixed(2)} = ${Math.round(hpGain)} HP`,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

const performancePhysics = {
  PHYSICS,
  getDrivetrainEfficiency,
  crankToWheelHp,
  wheelToCrankHp,
  calculate060Time,
  estimate060Improvement,
  calculateQuarterMile,
  estimateQuarterMileImprovement,
  calculateTuneGain,
  calculateForcedInductionGain,
};

export default performancePhysics;
