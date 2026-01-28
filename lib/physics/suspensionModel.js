/**
 * Suspension Physics Model
 * 
 * Models suspension dynamics and handling characteristics:
 * - Spring rates and natural frequency
 * - Damping ratios and response
 * - Roll stiffness and weight transfer
 * - Camber gain and tire contact
 * - Anti-squat/anti-dive geometry
 * - Handling balance (understeer/oversteer)
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const GRAVITY = 32.174; // ft/s²
const _LB_TO_N = 4.44822;
const _IN_TO_M = 0.0254;
const LB_PER_IN_TO_N_PER_M = 175.127;

// =============================================================================
// SPRING RATE CALCULATIONS
// =============================================================================

/**
 * Calculate wheel rate from spring rate (for coilover setups)
 * 
 * @param {number} springRate - Spring rate in lb/in
 * @param {number} motionRatio - Motion ratio (wheel travel / spring travel)
 * @returns {number} Wheel rate in lb/in
 */
export function calculateWheelRate(springRate, motionRatio = 1.0) {
  // Wheel rate = Spring rate × (Motion ratio)²
  return springRate * motionRatio * motionRatio;
}

/**
 * Calculate ride frequency (natural frequency of suspension)
 * 
 * @param {number} wheelRate - Wheel rate in lb/in
 * @param {number} sprungWeight - Sprung weight on that corner in lbs
 * @returns {number} Ride frequency in Hz
 */
export function calculateRideFrequency(wheelRate, sprungWeight) {
  // f = (1/2π) × √(k/m) where k is stiffness, m is mass
  // Converting units: lb/in and lbs
  const k = wheelRate * 12; // lb/ft
  const m = sprungWeight / GRAVITY; // slugs
  return (1 / (2 * Math.PI)) * Math.sqrt(k / m);
}

/**
 * Recommended ride frequencies by vehicle type
 */
export const RIDE_FREQUENCY_TARGETS = {
  luxury: { front: 1.0, rear: 1.15, description: 'Soft, comfortable ride' },
  sport_touring: { front: 1.3, rear: 1.45, description: 'Balanced comfort/handling' },
  sport: { front: 1.6, rear: 1.75, description: 'Firm, responsive handling' },
  track_day: { front: 2.0, rear: 2.2, description: 'Stiff, precise handling' },
  race: { front: 2.5, rear: 2.7, description: 'Very stiff, race setup' },
  formula: { front: 3.5, rear: 3.8, description: 'Extreme stiffness' },
};

/**
 * Calculate required spring rate for target ride frequency
 * 
 * @param {number} targetFrequency - Target ride frequency in Hz
 * @param {number} sprungWeight - Sprung weight in lbs
 * @param {number} motionRatio - Motion ratio
 * @returns {number} Required spring rate in lb/in
 */
export function calculateRequiredSpringRate(targetFrequency, sprungWeight, motionRatio = 1.0) {
  // Rearranging: k = m × (2πf)²
  const m = sprungWeight / GRAVITY; // slugs
  const wheelRate = m * Math.pow(2 * Math.PI * targetFrequency, 2) / 12; // lb/in
  return wheelRate / (motionRatio * motionRatio);
}

// =============================================================================
// DAMPER CALCULATIONS
// =============================================================================

/**
 * Calculate critical damping coefficient
 * 
 * @param {number} springRate - Spring rate in lb/in
 * @param {number} sprungMass - Sprung mass in lbs
 * @returns {number} Critical damping in lb-s/in
 */
export function calculateCriticalDamping(springRate, sprungMass) {
  const k = springRate * LB_PER_IN_TO_N_PER_M;
  const m = sprungMass * 0.453592;
  const cCritical = 2 * Math.sqrt(k * m);
  return cCritical / LB_PER_IN_TO_N_PER_M;
}

/**
 * Recommended damping ratios
 */
export const DAMPING_RATIOS = {
  comfort: {
    bump: 0.20,
    rebound: 0.40,
    description: 'Soft, absorbs bumps well',
  },
  sport: {
    bump: 0.35,
    rebound: 0.55,
    description: 'Balanced control and comfort',
  },
  track: {
    bump: 0.50,
    rebound: 0.70,
    description: 'Tight body control',
  },
  race: {
    bump: 0.65,
    rebound: 0.85,
    description: 'Minimal body movement',
  },
};

/**
 * Calculate damper settings for target damping ratio
 * 
 * @param {number} criticalDamping - Critical damping coefficient
 * @param {number} bumpRatio - Bump damping ratio (0-1)
 * @param {number} reboundRatio - Rebound damping ratio (0-1)
 * @returns {Object} Damper settings
 */
export function calculateDamperSettings(criticalDamping, bumpRatio = 0.35, reboundRatio = 0.55) {
  return {
    bumpDamping: criticalDamping * bumpRatio,
    reboundDamping: criticalDamping * reboundRatio,
    bumpRatio,
    reboundRatio,
    reboundToBumpRatio: reboundRatio / bumpRatio,
  };
}

// =============================================================================
// ROLL STIFFNESS CALCULATIONS
// =============================================================================

/**
 * Calculate roll stiffness for an axle
 * 
 * @param {number} wheelRate - Wheel rate in lb/in
 * @param {number} trackWidth - Track width in inches
 * @param {number} swayBarRate - Sway bar rate in lb/in (at wheel)
 * @returns {number} Roll stiffness in lb-ft/degree
 */
export function calculateRollStiffness(wheelRate, trackWidth, swayBarRate = 0) {
  // Roll stiffness from springs
  const springRollRate = (wheelRate * trackWidth * trackWidth) / (2 * 180 / Math.PI);
  
  // Add sway bar contribution
  const swayBarRollRate = (swayBarRate * trackWidth * trackWidth) / (2 * 180 / Math.PI);
  
  return (springRollRate + swayBarRollRate) / 12; // Convert to lb-ft/degree
}

/**
 * Calculate body roll angle in cornering
 * 
 * @param {number} lateralG - Lateral acceleration in Gs
 * @param {number} sprungWeight - Total sprung weight in lbs
 * @param {number} rollCenterHeight - Roll center height in inches
 * @param {number} cgHeight - Center of gravity height in inches
 * @param {number} totalRollStiffness - Combined front + rear roll stiffness
 * @returns {number} Body roll in degrees
 */
export function calculateBodyRoll(lateralG, sprungWeight, rollCenterHeight, cgHeight, totalRollStiffness) {
  // Roll moment = Weight × Lateral G × (CG height - Roll center height)
  const momentArm = (cgHeight - rollCenterHeight) / 12; // feet
  const rollMoment = sprungWeight * lateralG * momentArm;
  
  return rollMoment / totalRollStiffness;
}

/**
 * Calculate roll stiffness distribution (affects handling balance)
 * 
 * @param {number} frontRollStiffness - Front roll stiffness
 * @param {number} rearRollStiffness - Rear roll stiffness
 * @returns {Object} Distribution and handling tendency
 */
export function calculateRollDistribution(frontRollStiffness, rearRollStiffness) {
  const total = frontRollStiffness + rearRollStiffness;
  const frontPercent = (frontRollStiffness / total) * 100;
  
  let tendency;
  if (frontPercent > 55) {
    tendency = 'understeer';
  } else if (frontPercent < 45) {
    tendency = 'oversteer';
  } else {
    tendency = 'neutral';
  }
  
  return {
    frontPercent: Math.round(frontPercent),
    rearPercent: Math.round(100 - frontPercent),
    tendency,
    description: `${Math.round(frontPercent)}% front / ${Math.round(100 - frontPercent)}% rear`,
  };
}

// =============================================================================
// WEIGHT TRANSFER CALCULATIONS
// =============================================================================

/**
 * Calculate lateral weight transfer in cornering
 * 
 * @param {number} lateralG - Lateral acceleration in Gs
 * @param {number} totalWeight - Total vehicle weight in lbs
 * @param {number} cgHeight - CG height in inches
 * @param {number} trackWidth - Track width in inches
 * @param {number} rollStiffnessPercent - % of roll stiffness on this axle
 * @returns {number} Weight transfer in lbs
 */
export function calculateLateralWeightTransfer(lateralG, totalWeight, cgHeight, trackWidth, rollStiffnessPercent) {
  // Total lateral weight transfer
  const totalTransfer = (lateralG * totalWeight * cgHeight) / trackWidth;
  
  // Portion on this axle based on roll stiffness distribution
  return totalTransfer * (rollStiffnessPercent / 100);
}

/**
 * Calculate longitudinal weight transfer (accel/braking)
 * 
 * @param {number} longitudinalG - Longitudinal acceleration in Gs
 * @param {number} totalWeight - Total vehicle weight in lbs
 * @param {number} cgHeight - CG height in inches
 * @param {number} wheelbase - Wheelbase in inches
 * @returns {number} Weight transfer in lbs (positive = rear)
 */
export function calculateLongitudinalWeightTransfer(longitudinalG, totalWeight, cgHeight, wheelbase) {
  return (longitudinalG * totalWeight * cgHeight) / wheelbase;
}

/**
 * Calculate corner weights under cornering
 * 
 * @param {Object} staticWeights - Static corner weights { fl, fr, rl, rr }
 * @param {number} lateralG - Lateral G (positive = right turn)
 * @param {number} longitudinalG - Longitudinal G (positive = accel)
 * @param {Object} vehicleParams - Vehicle parameters
 * @returns {Object} Dynamic corner weights
 */
export function calculateDynamicCornerWeights(staticWeights, lateralG, longitudinalG, vehicleParams) {
  const { cgHeight, trackWidthFront, trackWidthRear, wheelbase, frontRollStiffnessPercent } = vehicleParams;
  
  const totalWeight = staticWeights.fl + staticWeights.fr + staticWeights.rl + staticWeights.rr;
  
  // Lateral transfer
  const frontLateralTransfer = calculateLateralWeightTransfer(
    lateralG, totalWeight, cgHeight, trackWidthFront, frontRollStiffnessPercent
  );
  const rearLateralTransfer = calculateLateralWeightTransfer(
    lateralG, totalWeight, cgHeight, trackWidthRear, 100 - frontRollStiffnessPercent
  );
  
  // Longitudinal transfer
  const longTransfer = calculateLongitudinalWeightTransfer(
    longitudinalG, totalWeight, cgHeight, wheelbase
  );
  
  // Apply transfers
  return {
    fl: staticWeights.fl - frontLateralTransfer - (longTransfer / 2),
    fr: staticWeights.fr + frontLateralTransfer - (longTransfer / 2),
    rl: staticWeights.rl - rearLateralTransfer + (longTransfer / 2),
    rr: staticWeights.rr + rearLateralTransfer + (longTransfer / 2),
    totalTransferLateral: Math.abs(frontLateralTransfer) + Math.abs(rearLateralTransfer),
    totalTransferLongitudinal: Math.abs(longTransfer),
  };
}

// =============================================================================
// GEOMETRY CALCULATIONS
// =============================================================================

/**
 * Calculate camber change through suspension travel
 * 
 * @param {number} travel - Suspension travel in inches
 * @param {number} camberGain - Camber gain in degrees per inch of travel
 * @param {number} staticCamber - Static camber in degrees (negative = top in)
 * @returns {number} Dynamic camber in degrees
 */
export function calculateDynamicCamber(travel, camberGain, staticCamber) {
  return staticCamber + (travel * camberGain);
}

/**
 * Typical camber gain values by suspension type
 */
export const CAMBER_GAIN_PROFILES = {
  macpherson: {
    gain: 0.3, // deg/inch (poor)
    description: 'MacPherson strut - minimal camber gain',
  },
  double_wishbone: {
    gain: 1.2, // deg/inch (good)
    description: 'Double wishbone - good camber control',
  },
  multilink: {
    gain: 1.0, // deg/inch (good)
    description: 'Multi-link - balanced geometry',
  },
  solid_axle: {
    gain: 0, // deg/inch (none)
    description: 'Solid axle - no camber change',
  },
};

/**
 * Calculate anti-squat percentage
 * 
 * @param {number} instantCenterHeight - Instant center height in inches
 * @param {number} cgHeight - CG height in inches
 * @returns {number} Anti-squat percentage
 */
export function calculateAntiSquat(instantCenterHeight, cgHeight) {
  return (instantCenterHeight / cgHeight) * 100;
}

/**
 * Calculate anti-dive percentage
 * 
 * @param {number} instantCenterHeight - Instant center height in inches
 * @param {number} cgHeight - CG height in inches
 * @param {number} brakeBias - Front brake bias (0-1)
 * @returns {number} Anti-dive percentage
 */
export function calculateAntiDive(instantCenterHeight, cgHeight, brakeBias = 0.6) {
  return (instantCenterHeight / cgHeight) * 100 * brakeBias;
}

// =============================================================================
// HANDLING CHARACTERISTICS
// =============================================================================

/**
 * Calculate understeer gradient
 * 
 * @param {Object} vehicleParams - Vehicle parameters
 * @returns {number} Understeer gradient (deg/g) - positive = understeer
 */
export function calculateUndersteerGradient(vehicleParams) {
  const {
    frontWeight, // lbs
    rearWeight, // lbs
    frontTireStiffness, // lb/deg (cornering stiffness)
    rearTireStiffness,
    wheelbase: _wheelbase, // inches
  } = vehicleParams;
  
  // K = (Wf/Cαf - Wr/Cαr) × (180/π) × (wheelbase / g)
  const Wf = frontWeight;
  const Wr = rearWeight;
  const Caf = frontTireStiffness;
  const Car = rearTireStiffness;
  
  const understeerGradient = (Wf / Caf - Wr / Car) * (180 / Math.PI);
  
  return understeerGradient;
}

/**
 * Describe handling balance from understeer gradient
 * 
 * @param {number} understeerGradient - Understeer gradient in deg/g
 * @returns {Object} Handling description
 */
export function describeHandlingBalance(understeerGradient) {
  if (understeerGradient > 3) {
    return {
      rating: 'heavy_understeer',
      description: 'Significant push in corners, safe but slow',
      recommendation: 'Reduce front roll stiffness or add rear',
    };
  } else if (understeerGradient > 1) {
    return {
      rating: 'mild_understeer',
      description: 'Slight push at limit, predictable',
      recommendation: 'Good balance for street driving',
    };
  } else if (understeerGradient > -1) {
    return {
      rating: 'neutral',
      description: 'Balanced handling, responsive',
      recommendation: 'Ideal for experienced drivers',
    };
  } else if (understeerGradient > -3) {
    return {
      rating: 'mild_oversteer',
      description: 'Rear wants to rotate, requires skill',
      recommendation: 'Great for track, needs attention on street',
    };
  } else {
    return {
      rating: 'heavy_oversteer',
      description: 'Very loose rear, snap oversteer risk',
      recommendation: 'Add rear roll stiffness or soften front',
    };
  }
}

// =============================================================================
// SUSPENSION MODIFICATIONS
// =============================================================================

/**
 * Suspension modifications and their typical effects
 */
export const SUSPENSION_MODS = {
  // Springs
  'springs-lowering-mild': {
    name: 'Mild Lowering Springs',
    rideHeightChange: -1.0, // inches
    springRateIncrease: 15, // percent
    rideFrequencyChange: 0.2, // Hz
    description: '1" drop, 15% stiffer',
  },
  'springs-lowering-aggressive': {
    name: 'Aggressive Lowering Springs',
    rideHeightChange: -2.0,
    springRateIncrease: 35,
    rideFrequencyChange: 0.4,
    description: '2" drop, 35% stiffer',
  },
  'springs-linear-race': {
    name: 'Linear Rate Race Springs',
    springRateIncrease: 100,
    rideFrequencyChange: 0.8,
    description: 'Double rate for track use',
  },
  
  // Coilovers
  'coilovers-street': {
    name: 'Street Coilovers',
    adjustable: true,
    rideFrequencyRange: [1.4, 1.8],
    dampingAdjustable: true,
    description: 'Height and damping adjustable',
  },
  'coilovers-track': {
    name: 'Track Coilovers',
    adjustable: true,
    rideFrequencyRange: [1.8, 2.5],
    dampingAdjustable: true,
    rebuildable: true,
    description: 'Monotube, high-performance valving',
  },
  'coilovers-race': {
    name: 'Race Coilovers (2-way)',
    adjustable: true,
    rideFrequencyRange: [2.2, 3.5],
    dampingAdjustable: true,
    separateBumpRebound: true,
    rebuildable: true,
    description: 'Remote reservoir, 2-way adjustable',
  },
  'coilovers-race-3way': {
    name: 'Race Coilovers (3-way)',
    adjustable: true,
    rideFrequencyRange: [2.5, 4.0],
    dampingAdjustable: true,
    separateBumpRebound: true,
    highSpeedAdjustable: true,
    rebuildable: true,
    description: '3-way adjustable, pro-level',
  },
  
  // Sway bars
  'swaybar-front-upgrade': {
    name: 'Front Sway Bar Upgrade',
    rollStiffnessIncrease: 30, // percent
    affectsBalance: 'understeer',
    description: 'Reduces body roll, adds understeer',
  },
  'swaybar-rear-upgrade': {
    name: 'Rear Sway Bar Upgrade',
    rollStiffnessIncrease: 40, // percent
    affectsBalance: 'oversteer',
    description: 'Reduces body roll, adds oversteer',
  },
  'swaybar-adjustable-front': {
    name: 'Adjustable Front Sway Bar',
    rollStiffnessRange: [20, 60], // percent increase range
    adjustable: true,
    description: 'Fine-tune front roll stiffness',
  },
  'swaybar-adjustable-rear': {
    name: 'Adjustable Rear Sway Bar',
    rollStiffnessRange: [30, 80],
    adjustable: true,
    description: 'Fine-tune rear roll stiffness',
  },
  
  // Bushings
  'bushings-poly': {
    name: 'Polyurethane Bushings',
    complianceReduction: 40, // percent
    nvhIncrease: 20,
    description: 'Reduces deflection, increases precision',
  },
  'bushings-spherical': {
    name: 'Spherical Bearings',
    complianceReduction: 95,
    nvhIncrease: 100,
    description: 'Zero compliance, race only',
  },
  
  // Alignment
  'camber-plates': {
    name: 'Adjustable Camber Plates',
    camberAdjustmentRange: 3.0, // degrees
    description: 'Allows negative camber beyond stock',
  },
  'toe-links-adjustable': {
    name: 'Adjustable Toe Links',
    toeAdjustmentRange: 2.0,
    description: 'Precise toe adjustment',
  },
  'control-arms-adjustable': {
    name: 'Adjustable Control Arms',
    casterAdjustmentRange: 2.0,
    camberAdjustmentRange: 2.0,
    description: 'Full geometry adjustment',
  },
};

/**
 * Calculate handling score from suspension setup
 * 
 * @param {Object} setup - Suspension setup parameters
 * @returns {Object} Handling scores (0-100)
 */
export function calculateHandlingScore(setup) {
  const {
    frontRideFrequency,
    rearRideFrequency: _rearRideFrequency,
    frontDampingRatio,
    rearDampingRatio,
    bodyRollDegrees,
    understeerGradient,
  } = setup;
  
  // Response score (higher frequency = more responsive)
  const responseScore = Math.min(100, (frontRideFrequency / 2.5) * 100);
  
  // Stability score (proper damping ratio)
  const idealDamping = 0.5;
  const dampingError = Math.abs(frontDampingRatio - idealDamping) + Math.abs(rearDampingRatio - idealDamping);
  const stabilityScore = Math.max(0, 100 - dampingError * 100);
  
  // Body control score (less roll = better)
  const bodyControlScore = Math.max(0, 100 - bodyRollDegrees * 20);
  
  // Balance score (neutral is best)
  const balanceScore = Math.max(0, 100 - Math.abs(understeerGradient) * 20);
  
  // Overall handling score
  const overallScore = (responseScore + stabilityScore + bodyControlScore + balanceScore) / 4;
  
  return {
    responseScore: Math.round(responseScore),
    stabilityScore: Math.round(stabilityScore),
    bodyControlScore: Math.round(bodyControlScore),
    balanceScore: Math.round(balanceScore),
    overallScore: Math.round(overallScore),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

const suspensionModel = {
  calculateWheelRate,
  calculateRideFrequency,
  calculateRequiredSpringRate,
  calculateCriticalDamping,
  calculateDamperSettings,
  calculateRollStiffness,
  calculateBodyRoll,
  calculateRollDistribution,
  calculateLateralWeightTransfer,
  calculateLongitudinalWeightTransfer,
  calculateDynamicCornerWeights,
  calculateDynamicCamber,
  calculateAntiSquat,
  calculateAntiDive,
  calculateUndersteerGradient,
  describeHandlingBalance,
  calculateHandlingScore,
  RIDE_FREQUENCY_TARGETS,
  DAMPING_RATIOS,
  CAMBER_GAIN_PROFILES,
  SUSPENSION_MODS,
};

export default suspensionModel;
