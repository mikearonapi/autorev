/**
 * Weight & Balance Physics Model
 * 
 * Models vehicle mass properties and their effects:
 * - Static weight distribution
 * - Center of gravity location
 * - Moment of inertia (yaw, pitch, roll)
 * - Weight transfer calculations
 * - Effects of weight modifications
 * - Power-to-weight ratio calculations
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const GRAVITY = 32.174; // ft/s²
const LB_TO_KG = 0.453592;
const IN_TO_FT = 1/12;
const HP_TO_KW = 0.7457;

// =============================================================================
// WEIGHT DISTRIBUTION
// =============================================================================

/**
 * Calculate static corner weights from total weight and distribution
 * 
 * @param {number} totalWeight - Total vehicle weight in lbs
 * @param {number} frontPercent - Front weight percentage (0-100)
 * @param {number} leftPercent - Left side weight percentage (0-100, typically ~50)
 * @returns {Object} Corner weights
 */
export function calculateCornerWeights(totalWeight, frontPercent, leftPercent = 50) {
  const frontWeight = totalWeight * (frontPercent / 100);
  const rearWeight = totalWeight - frontWeight;
  
  const leftFrontPercent = leftPercent / 100;
  const leftRearPercent = leftPercent / 100;
  
  return {
    frontLeft: Math.round(frontWeight * leftFrontPercent),
    frontRight: Math.round(frontWeight * (1 - leftFrontPercent)),
    rearLeft: Math.round(rearWeight * leftRearPercent),
    rearRight: Math.round(rearWeight * (1 - leftRearPercent)),
    totalWeight: Math.round(totalWeight),
    frontPercent: Math.round(frontPercent),
    rearPercent: Math.round(100 - frontPercent),
    crossWeight: Math.round(leftPercent), // Diagonal weight
  };
}

/**
 * Calculate weight distribution from corner weights
 * 
 * @param {Object} corners - {fl, fr, rl, rr} weights in lbs
 * @returns {Object} Weight distribution analysis
 */
export function analyzeWeightDistribution(corners) {
  const { fl, fr, rl, rr } = corners;
  const total = fl + fr + rl + rr;
  const front = fl + fr;
  const rear = rl + rr;
  const left = fl + rl;
  const right = fr + rr;
  
  // Cross weights (diagonals)
  const leftCross = fl + rr;
  const rightCross = fr + rl;
  
  return {
    total,
    frontPercent: Math.round((front / total) * 100 * 10) / 10,
    rearPercent: Math.round((rear / total) * 100 * 10) / 10,
    leftPercent: Math.round((left / total) * 100 * 10) / 10,
    rightPercent: Math.round((right / total) * 100 * 10) / 10,
    crossWeightPercent: Math.round((leftCross / total) * 100 * 10) / 10,
    isBalanced: Math.abs(left - right) < total * 0.02, // Within 2%
    frontRearBalance: front / total < 0.52 && front / total > 0.48 ? 'balanced' :
                      front / total >= 0.52 ? 'front-heavy' : 'rear-heavy',
  };
}

// =============================================================================
// CENTER OF GRAVITY
// =============================================================================

/**
 * Estimate CG height from vehicle type and modifications
 * 
 * @param {string} vehicleType - 'sedan', 'coupe', 'suv', 'truck', 'supercar'
 * @param {number} rideHeight - Ride height in inches
 * @param {Object} mods - Modifications {lowered, rollCage, etc}
 * @returns {number} Estimated CG height in inches
 */
export function estimateCgHeight(vehicleType, rideHeight = 6, mods = {}) {
  // Base CG heights by vehicle type (inches from ground)
  const baseCgHeights = {
    sedan: 20,
    coupe: 18,
    hatchback: 19,
    suv: 28,
    truck: 30,
    sports: 17,
    supercar: 15,
    formula: 10,
  };
  
  let cgHeight = baseCgHeights[vehicleType] || 19;
  
  // Adjust for ride height changes
  // CG drops roughly 40% of ride height drop
  const rideHeightChange = rideHeight - 6; // Assume 6" is stock
  cgHeight += rideHeightChange * 0.4;
  
  // Modifications
  if (mods.lowered) cgHeight -= mods.lowered * 0.4;
  if (mods.rollCage) cgHeight += 0.5; // Roll cage adds weight up high
  if (mods.carbonRoof) cgHeight -= 0.3;
  if (mods.heavyWheels) cgHeight -= 0.2; // Weight lower on car
  if (mods.lightweightWheels) cgHeight += 0.1;
  
  return Math.round(cgHeight * 10) / 10;
}

/**
 * Calculate CG location from corner weights and measurements
 * 
 * @param {Object} corners - Corner weights {fl, fr, rl, rr}
 * @param {number} wheelbase - Wheelbase in inches
 * @param {number} trackWidth - Average track width in inches
 * @returns {Object} CG location relative to front axle
 */
export function calculateCgLocation(corners, wheelbase, trackWidth) {
  const { fl, fr, rl, rr } = corners;
  const total = fl + fr + rl + rr;
  const rear = rl + rr;
  const right = fr + rr;
  
  // Longitudinal CG location (from front axle)
  const cgFromFront = (rear / total) * wheelbase;
  
  // Lateral CG location (from left side)
  const cgFromLeft = (right / total) * trackWidth;
  
  return {
    longitudinalFromFront: Math.round(cgFromFront * 10) / 10,
    lateralFromLeft: Math.round(cgFromLeft * 10) / 10,
    longitudinalPercent: Math.round((cgFromFront / wheelbase) * 100),
    lateralOffsetFromCenter: Math.round((cgFromLeft - trackWidth / 2) * 10) / 10,
  };
}

// =============================================================================
// MOMENT OF INERTIA
// =============================================================================

/**
 * Estimate yaw moment of inertia
 * 
 * Yaw MOI affects how quickly the car rotates about its vertical axis.
 * Lower MOI = quicker direction changes, more responsive.
 * 
 * @param {number} mass - Vehicle mass in lbs
 * @param {number} wheelbase - Wheelbase in inches
 * @param {number} trackWidth - Track width in inches
 * @param {number} frontPercent - Front weight percentage
 * @returns {Object} Yaw moment of inertia
 */
export function calculateYawMoi(mass, wheelbase, trackWidth, frontPercent = 50) {
  // Convert to metric
  const massKg = mass * LB_TO_KG;
  const wheelbaseM = wheelbase * IN_TO_FT * 0.3048;
  const trackWidthM = trackWidth * IN_TO_FT * 0.3048;
  
  // Simplified: treat car as a rectangular mass
  // Izz = m/12 × (L² + W²) for uniform rectangle
  const rectangleMoi = (massKg / 12) * (wheelbaseM * wheelbaseM + trackWidthM * trackWidthM);
  
  // Adjust for mass distribution (more concentrated mass = lower MOI)
  // Engines, passengers, etc. concentrated in middle reduce MOI
  const concentrationFactor = 0.85; // Typical for road cars
  
  const yawMoi = rectangleMoi * concentrationFactor;
  
  return {
    yawMoiKgM2: Math.round(yawMoi),
    yawMoiSlugFt2: Math.round(yawMoi * 0.7376),
    radiusOfGyrationFt: Math.round(Math.sqrt(yawMoi / massKg) / 0.3048 * 10) / 10,
  };
}

/**
 * Typical MOI values for reference
 */
export const MOI_REFERENCE = {
  compact: { yaw: 2000, description: 'Miata, BRZ' },
  sports: { yaw: 3000, description: 'Mustang, Camaro' },
  sedan: { yaw: 3500, description: 'M3, C63' },
  gt: { yaw: 4000, description: 'DB11, Continental' },
  suv: { yaw: 5500, description: 'X5, Cayenne' },
  supercar: { yaw: 2500, description: '488, Huracan' },
  hypercar: { yaw: 2200, description: 'P1, LaFerrari' },
};

// =============================================================================
// POWER TO WEIGHT
// =============================================================================

/**
 * Calculate power-to-weight metrics
 * 
 * @param {number} hp - Horsepower
 * @param {number} weightLbs - Weight in lbs
 * @param {number} torque - Torque in lb-ft
 * @returns {Object} Power-to-weight metrics
 */
export function calculatePowerToWeight(hp, weightLbs, torque = null) {
  const hpPerTon = hp / (weightLbs / 2000);
  const hpPerKg = hp / (weightLbs * LB_TO_KG);
  const lbsPerHp = weightLbs / hp;
  const kgPerHp = (weightLbs * LB_TO_KG) / hp;
  
  // HP per liter (if displacement known)
  // Torque per ton
  const torquePerTon = torque ? torque / (weightLbs / 2000) : null;
  
  // Estimate 0-60 from power to weight (rough correlation)
  // Typical formula: 0-60 ≈ 15 × (weight/hp)^0.8 for RWD
  const estimated060 = 15 * Math.pow(lbsPerHp, 0.8) / 2.5;
  
  return {
    hpPerTon: Math.round(hpPerTon),
    hpPer1000Lbs: Math.round(hp / (weightLbs / 1000) * 10) / 10,
    kgPerHp: Math.round(kgPerHp * 10) / 10,
    lbsPerHp: Math.round(lbsPerHp * 10) / 10,
    torquePerTon: torquePerTon ? Math.round(torquePerTon) : null,
    estimated060: Math.round(estimated060 * 10) / 10,
    category: hpPerTon > 500 ? 'hypercar' :
              hpPerTon > 350 ? 'supercar' :
              hpPerTon > 250 ? 'sports' :
              hpPerTon > 150 ? 'sporty' :
              hpPerTon > 100 ? 'average' : 'economy',
  };
}

/**
 * Calculate effect of weight change on performance
 * 
 * @param {number} originalWeight - Original weight in lbs
 * @param {number} weightChange - Weight change in lbs (negative = reduction)
 * @param {number} hp - Horsepower
 * @param {number} original060 - Original 0-60 time
 * @returns {Object} Performance changes
 */
export function calculateWeightChangeEffect(originalWeight, weightChange, hp, original060) {
  const newWeight = originalWeight + weightChange;
  const weightChangePercent = (weightChange / originalWeight) * 100;
  
  const originalPtw = calculatePowerToWeight(hp, originalWeight);
  const newPtw = calculatePowerToWeight(hp, newWeight);
  
  // 0-60 improvement: roughly linear with weight reduction
  // 100 lb reduction ≈ 0.1s improvement for typical sports car
  const time060Improvement = -weightChange * 0.001 * (original060 / 4);
  
  // Top speed: minimal effect (limited by aero/power)
  // Acceleration: proportional to weight change
  const accelerationImprovement = -weightChangePercent;
  
  // Braking distance: proportional to weight
  const brakingImprovement = -weightChangePercent;
  
  // Lateral grip: depends on where weight is removed
  // Lower weight generally helps, but reduces tire load
  const lateralGripChange = -weightChangePercent * 0.3; // Partial correlation
  
  return {
    newWeight,
    weightChangePercent: Math.round(weightChangePercent * 10) / 10,
    ptwChange: Math.round((newPtw.hpPerTon - originalPtw.hpPerTon)),
    time060Improvement: Math.round(time060Improvement * 100) / 100,
    new060Estimate: Math.round((original060 - time060Improvement) * 100) / 100,
    accelerationImprovementPercent: Math.round(accelerationImprovement * 10) / 10,
    brakingImprovementPercent: Math.round(brakingImprovement * 10) / 10,
  };
}

// =============================================================================
// WEIGHT MODIFICATIONS
// =============================================================================

/**
 * Weight reduction modifications
 */
export const WEIGHT_MODS = {
  // Body panels
  'hood-carbon': {
    name: 'Carbon Fiber Hood',
    weightChange: -20,
    location: 'front',
    cgEffect: -0.3,
    cost: 1500,
  },
  'hood-aluminum': {
    name: 'Aluminum Hood',
    weightChange: -12,
    location: 'front',
    cgEffect: -0.2,
    cost: 800,
  },
  'trunk-carbon': {
    name: 'Carbon Fiber Trunk',
    weightChange: -15,
    location: 'rear',
    cgEffect: -0.2,
    cost: 1200,
  },
  'roof-carbon': {
    name: 'Carbon Fiber Roof',
    weightChange: -25,
    location: 'top',
    cgEffect: -0.8, // Significant CG drop
    cost: 3000,
    oem: true, // Available on some cars from factory
  },
  'fenders-carbon': {
    name: 'Carbon Fiber Fenders',
    weightChange: -16,
    location: 'corners',
    cgEffect: -0.2,
    cost: 2000,
  },
  'doors-carbon': {
    name: 'Carbon Fiber Doors',
    weightChange: -40,
    location: 'sides',
    cgEffect: -0.3,
    cost: 5000,
    note: 'May affect crash safety',
  },
  
  // Interior
  'seats-bucket': {
    name: 'Lightweight Bucket Seats',
    weightChange: -30,
    location: 'interior',
    cgEffect: -0.2,
    cost: 2500,
  },
  'seats-carbon': {
    name: 'Carbon Fiber Race Seats',
    weightChange: -50,
    location: 'interior',
    cgEffect: -0.4,
    cost: 6000,
  },
  'rear-seat-delete': {
    name: 'Rear Seat Delete',
    weightChange: -40,
    location: 'rear-interior',
    cgEffect: 0,
    cost: 200,
  },
  'interior-strip': {
    name: 'Interior Strip (carpet, sound deadening)',
    weightChange: -80,
    location: 'interior',
    cgEffect: -0.2,
    cost: 0,
    nvhNote: 'Significantly louder',
  },
  
  // Glass
  'windows-lexan': {
    name: 'Lexan Windows (rear/sides)',
    weightChange: -25,
    location: 'upper',
    cgEffect: -0.4,
    cost: 500,
    note: 'Not street legal in most areas',
  },
  
  // Wheels
  'wheels-lightweight': {
    name: 'Lightweight Wheels (-4 lbs each)',
    weightChange: -16,
    location: 'corners-unsprung',
    cgEffect: -0.1,
    rotationalInertiaReduction: 15, // percent
    cost: 3000,
  },
  'wheels-ultralight': {
    name: 'Ultra-Light Wheels (-8 lbs each)',
    weightChange: -32,
    location: 'corners-unsprung',
    cgEffect: -0.2,
    rotationalInertiaReduction: 25,
    cost: 6000,
  },
  
  // Battery
  'battery-lightweight': {
    name: 'Lightweight Battery',
    weightChange: -25,
    location: 'front', // Usually
    cgEffect: -0.3,
    cost: 300,
  },
  'battery-relocate-rear': {
    name: 'Battery Relocation (rear)',
    weightChange: 0,
    distributionChange: -2, // 2% more rear
    cgEffect: 0,
    cost: 400,
  },
  
  // Exhaust
  'exhaust-titanium': {
    name: 'Titanium Exhaust',
    weightChange: -25,
    location: 'rear-low',
    cgEffect: -0.1,
    cost: 4000,
  },
  
  // Safety (adds weight)
  'roll-cage-full': {
    name: 'Full Roll Cage',
    weightChange: 100,
    location: 'throughout',
    cgEffect: 0.3, // Raises CG slightly
    rigidityIncrease: 200, // percent
    cost: 5000,
  },
  'roll-bar': {
    name: 'Roll Bar',
    weightChange: 40,
    location: 'rear-upper',
    cgEffect: 0.2,
    rigidityIncrease: 20,
    cost: 1500,
  },
  'harness-bar': {
    name: 'Harness Bar',
    weightChange: 15,
    location: 'rear-upper',
    cgEffect: 0.1,
    cost: 300,
  },
};

/**
 * Calculate total weight modification effects
 * 
 * @param {number} baseWeight - Base vehicle weight in lbs
 * @param {number} baseFrontPercent - Base front weight percentage
 * @param {string[]} mods - Array of mod keys
 * @returns {Object} Modified weight and distribution
 */
export function applyWeightMods(baseWeight, baseFrontPercent, mods) {
  let totalWeightChange = 0;
  let cgHeightChange = 0;
  let frontWeightChange = 0;
  let rearWeightChange = 0;
  
  const appliedMods = [];
  
  for (const modKey of mods) {
    const mod = WEIGHT_MODS[modKey];
    if (!mod) continue;
    
    totalWeightChange += mod.weightChange;
    cgHeightChange += mod.cgEffect || 0;
    
    // Track front/rear changes
    if (mod.location?.includes('front')) {
      frontWeightChange += mod.weightChange;
    } else if (mod.location?.includes('rear')) {
      rearWeightChange += mod.weightChange;
    } else {
      // Split evenly
      frontWeightChange += mod.weightChange / 2;
      rearWeightChange += mod.weightChange / 2;
    }
    
    if (mod.distributionChange) {
      const shift = baseWeight * (mod.distributionChange / 100);
      frontWeightChange -= shift;
      rearWeightChange += shift;
    }
    
    appliedMods.push({
      key: modKey,
      name: mod.name,
      weightChange: mod.weightChange,
    });
  }
  
  const newWeight = baseWeight + totalWeightChange;
  const baseFrontWeight = baseWeight * (baseFrontPercent / 100);
  const baseRearWeight = baseWeight - baseFrontWeight;
  
  const newFrontWeight = baseFrontWeight + frontWeightChange;
  const newRearWeight = baseRearWeight + rearWeightChange;
  const newFrontPercent = (newFrontWeight / newWeight) * 100;
  
  return {
    originalWeight: baseWeight,
    newWeight: Math.round(newWeight),
    weightChange: Math.round(totalWeightChange),
    weightChangePercent: Math.round((totalWeightChange / baseWeight) * 100 * 10) / 10,
    originalFrontPercent: baseFrontPercent,
    newFrontPercent: Math.round(newFrontPercent * 10) / 10,
    cgHeightChange: Math.round(cgHeightChange * 10) / 10,
    appliedMods,
  };
}

// =============================================================================
// UNSPRUNG WEIGHT
// =============================================================================

/**
 * Calculate unsprung weight effects
 * 
 * Unsprung weight is everything not supported by the suspension:
 * wheels, tires, brakes, hubs, portion of control arms/axles
 * 
 * @param {number} unsprungWeight - Unsprung weight per corner in lbs
 * @param {number} sprungWeight - Sprung weight per corner in lbs
 * @returns {Object} Unsprung weight analysis
 */
export function analyzeUnsprungWeight(unsprungWeight, sprungWeight) {
  const ratio = unsprungWeight / sprungWeight;
  
  // Lower ratio = better handling and ride
  // Typical values: 0.10-0.15 for sports cars, 0.08-0.10 for supercars
  
  return {
    ratio: Math.round(ratio * 100) / 100,
    quality: ratio < 0.10 ? 'excellent' :
             ratio < 0.12 ? 'good' :
             ratio < 0.15 ? 'average' :
             ratio < 0.18 ? 'heavy' : 'very_heavy',
    wheelFollowQuality: ratio < 0.12 ? 'excellent' : ratio < 0.15 ? 'good' : 'compromised',
    rideQualityImpact: ratio < 0.12 ? 'minimal' : ratio < 0.15 ? 'moderate' : 'significant',
  };
}

/**
 * Calculate effect of unsprung weight reduction
 * 
 * @param {number} originalUnsprung - Original unsprung weight per corner
 * @param {number} reduction - Weight reduction per corner
 * @param {number} sprungWeight - Sprung weight per corner
 * @returns {Object} Effects of reduction
 */
export function calculateUnsprungReductionEffect(originalUnsprung, reduction, sprungWeight) {
  const originalRatio = originalUnsprung / sprungWeight;
  const newRatio = (originalUnsprung - reduction) / sprungWeight;
  
  // Rule of thumb: 1 lb unsprung = 10-15 lbs sprung for handling
  const equivalentSprungReduction = reduction * 12;
  
  return {
    originalRatio: Math.round(originalRatio * 100) / 100,
    newRatio: Math.round(newRatio * 100) / 100,
    ratioImprovement: Math.round((originalRatio - newRatio) * 1000) / 1000,
    equivalentSprungReduction: Math.round(equivalentSprungReduction),
    accelerationBenefit: 'high', // Rotational inertia reduction
    rideBenefit: 'moderate',
    handlingBenefit: 'high',
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  calculateCornerWeights,
  analyzeWeightDistribution,
  estimateCgHeight,
  calculateCgLocation,
  calculateYawMoi,
  calculatePowerToWeight,
  calculateWeightChangeEffect,
  applyWeightMods,
  analyzeUnsprungWeight,
  calculateUnsprungReductionEffect,
  WEIGHT_MODS,
  MOI_REFERENCE,
};
