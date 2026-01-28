/**
 * Tire Physics Model
 * 
 * Models tire behavior and grip characteristics:
 * - Tire grip coefficients by compound
 * - Slip angle and lateral force curves
 * - Load sensitivity (grip vs vertical load)
 * - Temperature effects on grip
 * - Treadwear and compound ratings
 * - Contact patch and pressure effects
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const _LB_TO_N = 4.44822;
const DEG_TO_RAD = Math.PI / 180;

// =============================================================================
// TIRE COMPOUND DEFINITIONS
// =============================================================================

/**
 * Tire compound characteristics by category
 * 
 * peakGrip: Maximum friction coefficient at optimal conditions
 * optimalSlipAngle: Slip angle for peak grip (degrees)
 * loadSensitivity: How much grip drops with load (per 100lb)
 * tempOptimal: Optimal operating temperature (°C)
 * tempRange: Usable temperature range ±(°C)
 * treadwear: Relative wear rate (higher = more durable)
 */
export const TIRE_COMPOUNDS = {
  // All-season
  'all-season-economy': {
    name: 'Economy All-Season',
    peakGrip: 0.82,
    optimalSlipAngle: 10,
    loadSensitivity: 0.008,
    tempOptimal: 35,
    tempRange: 40,
    treadwear: 600,
    wetGrip: 0.65,
    description: 'Long-lasting, basic grip',
  },
  'all-season-performance': {
    name: 'Performance All-Season',
    peakGrip: 0.92,
    optimalSlipAngle: 9,
    loadSensitivity: 0.007,
    tempOptimal: 40,
    tempRange: 35,
    treadwear: 400,
    wetGrip: 0.72,
    description: 'Good balance of grip and wear',
  },
  
  // Summer performance
  'summer-sport': {
    name: 'Summer Sport',
    peakGrip: 1.00,
    optimalSlipAngle: 8,
    loadSensitivity: 0.006,
    tempOptimal: 50,
    tempRange: 30,
    treadwear: 300,
    wetGrip: 0.75,
    description: 'Sporty driving in warm conditions',
  },
  'summer-max-performance': {
    name: 'Max Performance Summer',
    peakGrip: 1.08,
    optimalSlipAngle: 7,
    loadSensitivity: 0.005,
    tempOptimal: 60,
    tempRange: 25,
    treadwear: 200,
    wetGrip: 0.70,
    description: 'Track-capable street tire',
  },
  'summer-extreme': {
    name: 'Extreme Performance',
    peakGrip: 1.15,
    optimalSlipAngle: 6,
    loadSensitivity: 0.004,
    tempOptimal: 70,
    tempRange: 20,
    treadwear: 140,
    wetGrip: 0.60,
    description: '200TW street-legal track tire',
  },
  
  // Track/competition
  'track-200tw': {
    name: '200TW Track Tire',
    peakGrip: 1.20,
    optimalSlipAngle: 6,
    loadSensitivity: 0.004,
    tempOptimal: 80,
    tempRange: 20,
    treadwear: 200,
    wetGrip: 0.50,
    needsHeat: true,
    description: 'Time attack, autocross',
  },
  'track-100tw': {
    name: '100TW R-Compound',
    peakGrip: 1.30,
    optimalSlipAngle: 5,
    loadSensitivity: 0.003,
    tempOptimal: 90,
    tempRange: 15,
    treadwear: 100,
    wetGrip: 0.35,
    needsHeat: true,
    description: 'DOT-legal race tire',
  },
  'slick-soft': {
    name: 'Soft Slick',
    peakGrip: 1.50,
    optimalSlipAngle: 4,
    loadSensitivity: 0.003,
    tempOptimal: 100,
    tempRange: 15,
    treadwear: 40,
    wetGrip: 0,
    needsHeat: true,
    description: 'Maximum dry grip, short life',
  },
  'slick-medium': {
    name: 'Medium Slick',
    peakGrip: 1.40,
    optimalSlipAngle: 5,
    loadSensitivity: 0.003,
    tempOptimal: 95,
    tempRange: 20,
    treadwear: 60,
    wetGrip: 0,
    needsHeat: true,
    description: 'Balanced race slick',
  },
  'slick-hard': {
    name: 'Hard Slick',
    peakGrip: 1.30,
    optimalSlipAngle: 6,
    loadSensitivity: 0.004,
    tempOptimal: 90,
    tempRange: 25,
    treadwear: 100,
    wetGrip: 0,
    needsHeat: true,
    description: 'Durable race slick',
  },
  
  // Wet
  'wet-intermediate': {
    name: 'Intermediate',
    peakGrip: 1.10,
    optimalSlipAngle: 7,
    loadSensitivity: 0.005,
    tempOptimal: 70,
    tempRange: 30,
    treadwear: 80,
    wetGrip: 0.90,
    description: 'Damp track conditions',
  },
  'wet-full': {
    name: 'Full Wet',
    peakGrip: 0.90,
    optimalSlipAngle: 9,
    loadSensitivity: 0.006,
    tempOptimal: 50,
    tempRange: 40,
    treadwear: 150,
    wetGrip: 1.10,
    description: 'Standing water conditions',
  },
  
  // Winter
  'winter-performance': {
    name: 'Performance Winter',
    peakGrip: 0.88,
    optimalSlipAngle: 10,
    loadSensitivity: 0.007,
    tempOptimal: 10,
    tempRange: 30,
    treadwear: 350,
    wetGrip: 0.80,
    snowGrip: 0.85,
    iceGrip: 0.50,
    description: 'Sporty winter driving',
  },
  'winter-studded': {
    name: 'Studded Winter',
    peakGrip: 0.70,
    optimalSlipAngle: 12,
    loadSensitivity: 0.009,
    tempOptimal: -5,
    tempRange: 25,
    treadwear: 400,
    wetGrip: 0.75,
    snowGrip: 0.95,
    iceGrip: 0.90,
    description: 'Maximum ice traction',
  },
};

// =============================================================================
// SLIP ANGLE AND LATERAL FORCE
// =============================================================================

/**
 * Pacejka "Magic Formula" tire model (simplified)
 * 
 * Calculates lateral force based on slip angle using the Magic Formula:
 * Fy = D × sin(C × arctan(B × α - E × (B × α - arctan(B × α))))
 * 
 * @param {number} slipAngle - Slip angle in degrees
 * @param {number} verticalLoad - Vertical load in lbs
 * @param {Object} compound - Tire compound characteristics
 * @returns {number} Lateral force in lbs
 */
export function calculateLateralForce(slipAngle, verticalLoad, compound) {
  const {
    peakGrip,
    optimalSlipAngle: _optimalSlipAngle,
    loadSensitivity,
  } = compound;
  
  // Adjust grip for load (load sensitivity)
  const loadGripReduction = (verticalLoad / 100) * loadSensitivity;
  const effectiveGrip = Math.max(0.5, peakGrip - loadGripReduction);
  
  // Magic Formula parameters (simplified)
  const D = verticalLoad * effectiveGrip; // Peak force
  const B = 0.1; // Stiffness factor
  const C = 1.9; // Shape factor
  const E = 0.97; // Curvature factor
  
  const alpha = Math.abs(slipAngle) * DEG_TO_RAD;
  
  // Magic Formula
  const Bx = B * alpha;
  const Fy = D * Math.sin(C * Math.atan(Bx - E * (Bx - Math.atan(Bx))));
  
  return Fy * Math.sign(slipAngle);
}

/**
 * Generate a complete slip angle curve
 * 
 * @param {number} verticalLoad - Vertical load in lbs
 * @param {Object} compound - Tire compound
 * @param {number} maxAngle - Maximum slip angle to calculate
 * @returns {Object[]} Array of {slipAngle, lateralForce, gripCoeff}
 */
export function generateSlipAngleCurve(verticalLoad, compound, maxAngle = 15) {
  const curve = [];
  
  for (let angle = 0; angle <= maxAngle; angle += 0.5) {
    const force = calculateLateralForce(angle, verticalLoad, compound);
    curve.push({
      slipAngle: angle,
      lateralForce: Math.round(force),
      gripCoeff: Math.round((force / verticalLoad) * 100) / 100,
    });
  }
  
  // Find peak
  const peak = curve.reduce((max, point) => 
    Math.abs(point.lateralForce) > Math.abs(max.lateralForce) ? point : max
  );
  
  return {
    curve,
    peakSlipAngle: peak.slipAngle,
    peakGripCoeff: peak.gripCoeff,
    peakLateralForce: peak.lateralForce,
  };
}

// =============================================================================
// LOAD SENSITIVITY
// =============================================================================

/**
 * Calculate grip coefficient at different loads
 * 
 * @param {Object} compound - Tire compound
 * @param {number[]} loads - Array of vertical loads in lbs
 * @returns {Object[]} Grip at each load
 */
export function calculateLoadSensitivity(compound, loads = [200, 400, 600, 800, 1000, 1200, 1500]) {
  return loads.map(load => {
    const loadGripReduction = (load / 100) * compound.loadSensitivity;
    const effectiveGrip = Math.max(0.5, compound.peakGrip - loadGripReduction);
    
    return {
      loadLbs: load,
      gripCoeff: Math.round(effectiveGrip * 100) / 100,
      maxLateralForce: Math.round(load * effectiveGrip),
      gripDropPercent: Math.round((1 - effectiveGrip / compound.peakGrip) * 100),
    };
  });
}

// =============================================================================
// TEMPERATURE EFFECTS
// =============================================================================

/**
 * Calculate grip multiplier based on tire temperature
 * 
 * @param {number} temperatureC - Tire surface temperature
 * @param {Object} compound - Tire compound
 * @returns {Object} Grip multiplier and status
 */
export function calculateTempGripMultiplier(temperatureC, compound) {
  const { tempOptimal, tempRange, needsHeat } = compound;
  
  const tempDiff = Math.abs(temperatureC - tempOptimal);
  
  // Gaussian-like falloff from optimal temp
  const multiplier = Math.exp(-(tempDiff * tempDiff) / (2 * tempRange * tempRange));
  
  // Extra penalty if tire needs heat and is cold
  let coldPenalty = 1.0;
  if (needsHeat && temperatureC < tempOptimal - 20) {
    coldPenalty = 0.6 + 0.4 * (temperatureC / (tempOptimal - 20));
    coldPenalty = Math.max(0.4, coldPenalty);
  }
  
  const finalMultiplier = multiplier * coldPenalty;
  
  // Determine status
  let status;
  if (tempDiff <= tempRange * 0.5) {
    status = 'optimal';
  } else if (tempDiff <= tempRange) {
    status = 'good';
  } else if (temperatureC < tempOptimal) {
    status = needsHeat ? 'too_cold' : 'cold';
  } else {
    status = 'overheating';
  }
  
  return {
    multiplier: Math.round(finalMultiplier * 100) / 100,
    status,
    currentTemp: temperatureC,
    optimalTemp: tempOptimal,
    tempRange,
  };
}

/**
 * Simulate tire temperature buildup
 * 
 * @param {Object} compound - Tire compound
 * @param {number} ambientTempC - Ambient temperature
 * @param {number} drivingIntensity - 0-1 (0 = cruising, 1 = max attack)
 * @param {number} laps - Number of laps
 * @returns {Object[]} Temperature progression
 */
export function simulateTireTemperature(compound, ambientTempC, drivingIntensity = 0.7, laps = 10) {
  const { tempOptimal, tempRange } = compound;
  
  let temperature = ambientTempC;
  const progression = [];
  
  for (let lap = 1; lap <= laps; lap++) {
    // Heat generation (intensity dependent)
    const heatGeneration = drivingIntensity * 15; // °C per lap at max attack
    
    // Cooling (approaches ambient)
    const coolingRate = 0.1; // 10% of difference per lap
    const cooling = (temperature - ambientTempC) * coolingRate;
    
    temperature = temperature + heatGeneration - cooling;
    
    // Cap at reasonable max
    temperature = Math.min(temperature, tempOptimal + tempRange * 2);
    
    const gripMultiplier = calculateTempGripMultiplier(temperature, compound);
    
    progression.push({
      lap,
      temperature: Math.round(temperature),
      gripMultiplier: gripMultiplier.multiplier,
      status: gripMultiplier.status,
    });
  }
  
  return progression;
}

// =============================================================================
// CONTACT PATCH AND PRESSURE
// =============================================================================

/**
 * Calculate contact patch area
 * 
 * @param {number} tireWidth - Tire width in mm
 * @param {number} inflationPressure - Inflation pressure in PSI
 * @param {number} verticalLoad - Vertical load in lbs
 * @returns {Object} Contact patch dimensions
 */
export function calculateContactPatch(tireWidth, inflationPressure, verticalLoad) {
  // Contact patch area ≈ Load / Pressure
  const areaInch2 = verticalLoad / inflationPressure;
  
  // Contact patch is roughly elliptical
  // Width is roughly tire width (with some bulge)
  const widthInch = (tireWidth / 25.4) * 0.85; // 85% of tire width typical
  
  // Length = Area / Width
  const lengthInch = areaInch2 / widthInch;
  
  return {
    areaInch2: Math.round(areaInch2 * 10) / 10,
    widthInch: Math.round(widthInch * 10) / 10,
    lengthInch: Math.round(lengthInch * 10) / 10,
    averagePressure: inflationPressure, // By definition
  };
}

/**
 * Calculate optimal tire pressure for conditions
 * 
 * @param {string} useCase - 'street', 'autocross', 'track', 'drag'
 * @param {number} coldPressure - Cold starting pressure
 * @param {number} expectedTempIncrease - Expected temperature increase
 * @returns {Object} Pressure recommendations
 */
export function calculateOptimalPressure(useCase, _coldPressure = 35, expectedTempIncrease = 20) {
  // Ideal hot pressure targets by use case
  const hotTargets = {
    street: { front: 35, rear: 33 },
    autocross: { front: 38, rear: 36 },
    track: { front: 40, rear: 38 },
    drag: { front: 32, rear: 18 }, // Very low rear for traction
  };
  
  const target = hotTargets[useCase] || hotTargets.street;
  
  // Pressure increases ~1 PSI per 10°F
  const pressureIncrease = (expectedTempIncrease * 1.8 / 10);
  
  return {
    useCase,
    recommendedColdFront: Math.round(target.front - pressureIncrease),
    recommendedColdRear: Math.round(target.rear - pressureIncrease),
    targetHotFront: target.front,
    targetHotRear: target.rear,
    expectedIncrease: Math.round(pressureIncrease),
  };
}

// =============================================================================
// TIRE SIZE EFFECTS
// =============================================================================

/**
 * Calculate effect of tire size change on performance
 * 
 * @param {Object} original - Original tire {width, aspect, wheel}
 * @param {Object} newSize - New tire {width, aspect, wheel}
 * @returns {Object} Performance effects
 */
export function calculateTireSizeEffect(original, newSize) {
  // Overall diameter
  const originalDiameter = original.wheel + 2 * (original.width * original.aspect / 100 / 25.4);
  const newDiameter = newSize.wheel + 2 * (newSize.width * newSize.aspect / 100 / 25.4);
  
  const diameterChange = (newDiameter / originalDiameter - 1) * 100;
  
  // Width effect on grip (wider = more grip, roughly linear)
  const widthChange = (newSize.width / original.width - 1) * 100;
  const gripChangeFromWidth = widthChange * 0.3; // ~30% of width change translates to grip
  
  // Aspect ratio effect (lower = stiffer sidewall = better response)
  const aspectChange = newSize.aspect - original.aspect;
  const responseChange = -aspectChange * 2; // Lower aspect = better response
  
  // Unsprung weight change (rough estimate)
  const originalWeight = original.width * original.aspect * 0.001; // Arbitrary scaling
  const newWeight = newSize.width * newSize.aspect * 0.001;
  const weightChangePercent = (newWeight / originalWeight - 1) * 100;
  
  return {
    diameterChangePercent: Math.round(diameterChange * 10) / 10,
    speedometerErrorPercent: Math.round(-diameterChange * 10) / 10, // Negative = reads high
    gripChangePercent: Math.round(gripChangeFromWidth),
    responseChangePercent: Math.round(responseChange),
    unsprungWeightChangePercent: Math.round(weightChangePercent),
    sidewallStiffness: newSize.aspect < original.aspect ? 'stiffer' : 
                       newSize.aspect > original.aspect ? 'softer' : 'same',
  };
}

// =============================================================================
// TIRE MODIFICATIONS
// =============================================================================

/**
 * Tire-related modifications
 */
export const TIRE_MODS = {
  // Compound changes (reference TIRE_COMPOUNDS)
  'tires-summer-sport': { compound: 'summer-sport' },
  'tires-max-performance': { compound: 'summer-max-performance' },
  'tires-extreme': { compound: 'summer-extreme' },
  'tires-200tw': { compound: 'track-200tw' },
  'tires-100tw': { compound: 'track-100tw' },
  'tires-slick': { compound: 'slick-medium' },
  
  // Size changes
  'tires-wider-10mm': {
    name: '+10mm Width',
    widthChange: 10,
    gripChange: 3, // percent
    description: 'Slightly wider for more grip',
  },
  'tires-wider-20mm': {
    name: '+20mm Width',
    widthChange: 20,
    gripChange: 5,
    description: 'Noticeably wider contact patch',
  },
  'tires-wider-30mm': {
    name: '+30mm Width',
    widthChange: 30,
    gripChange: 7,
    fitmentNote: 'May require fender work',
    description: 'Significantly wider',
  },
  
  // Aspect ratio
  'tires-lower-profile': {
    name: 'Lower Profile (-10)',
    aspectChange: -10,
    responseChange: 15, // percent improvement
    comfortChange: -20, // percent worse
    description: 'Sharper response, harsher ride',
  },
  
  // Wheel diameter
  'wheels-plus1': {
    name: '+1" Wheel Diameter',
    wheelChange: 1,
    unsprungWeightChange: 2, // lbs per wheel
    brakeClrance: true,
    description: 'Allows larger brakes',
  },
  'wheels-plus2': {
    name: '+2" Wheel Diameter',
    wheelChange: 2,
    unsprungWeightChange: 4,
    brakeClrance: true,
    description: 'Significant brake upgrade space',
  },
  
  // Lightweight wheels
  'wheels-lightweight': {
    name: 'Lightweight Forged Wheels',
    weightReduction: 4, // lbs per wheel
    costMultiplier: 3,
    description: 'Improved acceleration and handling',
  },
  'wheels-ultralight': {
    name: 'Ultra-Lightweight Racing Wheels',
    weightReduction: 8,
    costMultiplier: 5,
    strengthNote: 'May be fragile on street',
    description: 'Maximum weight reduction',
  },
};

/**
 * Calculate lateral grip improvement from tire mods
 * 
 * @param {Object} baseTire - Base tire characteristics
 * @param {string[]} mods - Array of mod keys
 * @returns {Object} Modified tire characteristics
 */
export function applyTireMods(baseTire, mods) {
  let grip = baseTire.peakGrip || 1.0;
  let response = 100;
  let comfort = 100;
  let weight = 0;
  let compound = baseTire.compound || TIRE_COMPOUNDS['summer-sport'];
  
  const appliedMods = [];
  
  for (const modKey of mods) {
    const mod = TIRE_MODS[modKey];
    if (!mod) continue;
    
    if (mod.compound) {
      compound = TIRE_COMPOUNDS[mod.compound];
      grip = compound.peakGrip;
    }
    if (mod.gripChange) grip *= (1 + mod.gripChange / 100);
    if (mod.responseChange) response += mod.responseChange;
    if (mod.comfortChange) comfort += mod.comfortChange;
    if (mod.weightReduction) weight -= mod.weightReduction;
    if (mod.unsprungWeightChange) weight += mod.unsprungWeightChange;
    
    appliedMods.push({
      key: modKey,
      name: mod.name || compound.name,
    });
  }
  
  return {
    peakGrip: Math.round(grip * 100) / 100,
    responsePercent: Math.round(response),
    comfortPercent: Math.round(comfort),
    weightChangePerWheel: weight,
    compound,
    appliedMods,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

const tireModel = {
  calculateLateralForce,
  generateSlipAngleCurve,
  calculateLoadSensitivity,
  calculateTempGripMultiplier,
  simulateTireTemperature,
  calculateContactPatch,
  calculateOptimalPressure,
  calculateTireSizeEffect,
  applyTireMods,
  TIRE_COMPOUNDS,
  TIRE_MODS,
};

export default tireModel;
