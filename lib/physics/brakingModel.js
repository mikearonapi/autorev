/**
 * Braking Physics Model
 * 
 * Models braking performance and thermal behavior:
 * - Brake torque and stopping power
 * - Rotor thermal capacity and heat dissipation
 * - Pad compound characteristics
 * - Brake fade modeling
 * - ABS and brake bias effects
 * - Stopping distance calculations
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const GRAVITY = 9.81; // m/s²
const MPH_TO_MS = 0.44704;
const LB_TO_KG = 0.453592;
const IN_TO_M = 0.0254;
const FT_TO_M = 0.3048;

// Thermal properties
const STEEL_SPECIFIC_HEAT = 500; // J/(kg·K)
const CAST_IRON_SPECIFIC_HEAT = 460; // J/(kg·K)
const CARBON_CERAMIC_SPECIFIC_HEAT = 800; // J/(kg·K)

// =============================================================================
// BRAKE TORQUE CALCULATIONS
// =============================================================================

/**
 * Calculate brake torque for a single brake
 * 
 * @param {number} linePressure - Brake line pressure in PSI
 * @param {number} pistonArea - Total piston area in sq inches
 * @param {number} frictionCoeff - Pad friction coefficient (0.3-0.6)
 * @param {number} effectiveRadius - Effective rotor radius in inches
 * @param {number} numPads - Number of pads (typically 2 for single caliper)
 * @returns {number} Brake torque in lb-ft
 */
export function calculateBrakeTorque(linePressure, pistonArea, frictionCoeff, effectiveRadius, numPads = 2) {
  // Force = Pressure × Area
  const clampForce = linePressure * pistonArea;
  
  // Friction force = Clamp force × coefficient × number of friction surfaces
  const frictionForce = clampForce * frictionCoeff * numPads;
  
  // Torque = Force × Radius
  return (frictionForce * effectiveRadius) / 12; // Convert to lb-ft
}

/**
 * Calculate caliper piston area from piston diameters
 * 
 * @param {number[]} pistonDiameters - Array of piston diameters in mm
 * @returns {number} Total piston area in sq inches
 */
export function calculatePistonArea(pistonDiameters) {
  return pistonDiameters.reduce((total, diameter) => {
    const radiusInches = (diameter / 25.4) / 2;
    return total + Math.PI * radiusInches * radiusInches;
  }, 0);
}

/**
 * Calculate effective rotor radius
 * 
 * @param {number} rotorDiameter - Rotor diameter in mm
 * @param {number} padHeight - Pad height in mm
 * @returns {number} Effective radius in inches
 */
export function calculateEffectiveRadius(rotorDiameter, padHeight) {
  const outerRadius = rotorDiameter / 2;
  const innerRadius = outerRadius - padHeight;
  const effectiveRadiusMm = (outerRadius + innerRadius) / 2;
  return effectiveRadiusMm / 25.4;
}

// =============================================================================
// DECELERATION CALCULATIONS
// =============================================================================

/**
 * Calculate maximum deceleration from brake system
 * 
 * @param {Object} brakeParams - Brake system parameters
 * @param {number} vehicleWeight - Vehicle weight in lbs
 * @param {number} tireGrip - Tire grip coefficient (typically 0.8-1.2)
 * @returns {Object} Deceleration capabilities
 */
export function calculateMaxDeceleration(brakeParams, vehicleWeight, tireGrip = 1.0) {
  const {
    frontRotorDiameter, // mm
    rearRotorDiameter,
    frontPadHeight, // mm
    rearPadHeight,
    frontPistonArea, // sq in
    rearPistonArea,
    maxLinePressure, // PSI
    frictionCoeff,
    tireRadius, // inches
  } = brakeParams;
  
  // Calculate torques
  const frontEffectiveRadius = calculateEffectiveRadius(frontRotorDiameter, frontPadHeight);
  const rearEffectiveRadius = calculateEffectiveRadius(rearRotorDiameter, rearPadHeight);
  
  const frontTorque = calculateBrakeTorque(maxLinePressure, frontPistonArea, frictionCoeff, frontEffectiveRadius);
  const rearTorque = calculateBrakeTorque(maxLinePressure, rearPistonArea, frictionCoeff, rearEffectiveRadius);
  
  // Total braking force at wheels
  const frontForce = (frontTorque * 2 * 12) / tireRadius; // 2 wheels, convert to inches
  const rearForce = (rearTorque * 2 * 12) / tireRadius;
  const totalBrakeForce = frontForce + rearForce;
  
  // Maximum force limited by tire grip
  const maxTireForce = vehicleWeight * tireGrip;
  const effectiveForce = Math.min(totalBrakeForce, maxTireForce);
  
  // Deceleration in Gs
  const decelerationG = effectiveForce / vehicleWeight;
  
  return {
    maxBrakeForce: Math.round(totalBrakeForce),
    maxTireForce: Math.round(maxTireForce),
    effectiveForce: Math.round(effectiveForce),
    limitedBy: totalBrakeForce > maxTireForce ? 'tire_grip' : 'brake_capacity',
    decelerationG: Math.round(decelerationG * 100) / 100,
    frontBias: Math.round((frontForce / totalBrakeForce) * 100),
  };
}

/**
 * Calculate stopping distance
 * 
 * @param {number} initialSpeedMph - Initial speed in MPH
 * @param {number} decelerationG - Deceleration in Gs
 * @param {number} reactionTime - Driver reaction time in seconds
 * @returns {Object} Stopping distance breakdown
 */
export function calculateStoppingDistance(initialSpeedMph, decelerationG, reactionTime = 0.2) {
  const initialSpeedMs = initialSpeedMph * MPH_TO_MS;
  
  // Reaction distance
  const reactionDistanceM = initialSpeedMs * reactionTime;
  
  // Braking distance: d = v²/(2a)
  const decelerationMs2 = decelerationG * GRAVITY;
  const brakingDistanceM = (initialSpeedMs * initialSpeedMs) / (2 * decelerationMs2);
  
  // Total distance
  const totalDistanceM = reactionDistanceM + brakingDistanceM;
  
  // Braking time
  const brakingTime = initialSpeedMs / decelerationMs2;
  
  return {
    reactionDistanceFt: Math.round(reactionDistanceM / FT_TO_M),
    brakingDistanceFt: Math.round(brakingDistanceM / FT_TO_M),
    totalDistanceFt: Math.round(totalDistanceM / FT_TO_M),
    brakingTimeSeconds: Math.round(brakingTime * 100) / 100,
    totalTimeSeconds: Math.round((reactionTime + brakingTime) * 100) / 100,
  };
}

// =============================================================================
// THERMAL MODELING
// =============================================================================

/**
 * Calculate rotor thermal capacity
 * 
 * @param {number} rotorDiameter - Diameter in mm
 * @param {number} rotorThickness - Thickness in mm
 * @param {string} material - 'cast_iron', 'carbon_ceramic'
 * @param {boolean} vented - Is rotor vented
 * @returns {Object} Thermal properties
 */
export function calculateRotorThermalCapacity(rotorDiameter, rotorThickness, material = 'cast_iron', vented = true) {
  // Approximate rotor mass
  const outerRadius = rotorDiameter / 2 / 1000; // meters
  const innerRadius = outerRadius * 0.4; // Assume 40% hub
  const thickness = rotorThickness / 1000; // meters
  
  // Volume (simplified ring)
  let volume = Math.PI * (outerRadius * outerRadius - innerRadius * innerRadius) * thickness;
  if (vented) {
    volume *= 0.7; // Vented rotors are ~30% less material
  }
  
  // Density and specific heat by material
  let density, specificHeat, maxTemp;
  if (material === 'carbon_ceramic') {
    density = 1800; // kg/m³
    specificHeat = CARBON_CERAMIC_SPECIFIC_HEAT;
    maxTemp = 1200; // °C
  } else {
    density = 7200; // kg/m³ (cast iron)
    specificHeat = CAST_IRON_SPECIFIC_HEAT;
    maxTemp = 700; // °C
  }
  
  const mass = volume * density;
  const thermalCapacity = mass * specificHeat; // J/K
  
  return {
    massKg: Math.round(mass * 100) / 100,
    thermalCapacityJK: Math.round(thermalCapacity),
    maxTempC: maxTemp,
    material,
    vented,
  };
}

/**
 * Calculate rotor temperature rise from a stop
 * 
 * @param {number} vehicleWeightKg - Vehicle weight in kg
 * @param {number} initialSpeedMs - Initial speed in m/s
 * @param {number} thermalCapacity - Rotor thermal capacity in J/K
 * @param {number} rotorCount - Number of rotors
 * @param {number} frontBias - Front brake bias (0-1)
 * @returns {Object} Temperature rise
 */
export function calculateTemperatureRise(vehicleWeightKg, initialSpeedMs, thermalCapacity, rotorCount = 4, frontBias = 0.65) {
  // Kinetic energy: KE = 0.5 × m × v²
  const kineticEnergy = 0.5 * vehicleWeightKg * initialSpeedMs * initialSpeedMs;
  
  // Energy absorbed by brakes (all KE goes to brakes)
  // Distributed by bias: front rotors absorb more
  const frontEnergyPerRotor = (kineticEnergy * frontBias) / 2;
  const rearEnergyPerRotor = (kineticEnergy * (1 - frontBias)) / 2;
  
  // Temperature rise: ΔT = Q / C
  const frontTempRise = frontEnergyPerRotor / thermalCapacity;
  const rearTempRise = rearEnergyPerRotor / thermalCapacity;
  
  return {
    totalEnergyJ: Math.round(kineticEnergy),
    frontEnergyPerRotorJ: Math.round(frontEnergyPerRotor),
    rearEnergyPerRotorJ: Math.round(rearEnergyPerRotor),
    frontTempRiseC: Math.round(frontTempRise),
    rearTempRiseC: Math.round(rearTempRise),
  };
}

/**
 * Calculate rotor temperature after multiple stops (track simulation)
 * 
 * @param {Object} brakeParams - Brake parameters
 * @param {Object[]} stops - Array of {speedMph, cooldownSeconds}
 * @param {number} ambientTempC - Ambient temperature
 * @returns {Object} Temperature history
 */
export function simulateBrakeTemperature(brakeParams, stops, ambientTempC = 25) {
  const {
    vehicleWeightLbs,
    frontRotorThermalCapacity,
    rearRotorThermalCapacity,
    frontBias = 0.65,
    coolingCoefficient = 0.02, // Per second
  } = brakeParams;
  
  const vehicleWeightKg = vehicleWeightLbs * LB_TO_KG;
  
  let frontTemp = ambientTempC;
  let rearTemp = ambientTempC;
  let maxFrontTemp = ambientTempC;
  let maxRearTemp = ambientTempC;
  
  const history = [];
  
  for (const stop of stops) {
    const { speedMph, cooldownSeconds } = stop;
    const speedMs = speedMph * MPH_TO_MS;
    
    // Temperature rise from stop
    const rise = calculateTemperatureRise(
      vehicleWeightKg,
      speedMs,
      frontRotorThermalCapacity,
      4,
      frontBias
    );
    
    frontTemp += rise.frontTempRiseC;
    rearTemp += rise.rearTempRiseC;
    
    maxFrontTemp = Math.max(maxFrontTemp, frontTemp);
    maxRearTemp = Math.max(maxRearTemp, rearTemp);
    
    // Cooling during cooldown period
    // Newton's law of cooling (simplified)
    const frontCooling = (frontTemp - ambientTempC) * coolingCoefficient * cooldownSeconds;
    const rearCooling = (rearTemp - ambientTempC) * coolingCoefficient * cooldownSeconds;
    
    frontTemp = Math.max(ambientTempC, frontTemp - frontCooling);
    rearTemp = Math.max(ambientTempC, rearTemp - rearCooling);
    
    history.push({
      speedMph,
      frontTempAfterStop: Math.round(maxFrontTemp),
      rearTempAfterStop: Math.round(maxRearTemp),
      frontTempAfterCooldown: Math.round(frontTemp),
      rearTempAfterCooldown: Math.round(rearTemp),
    });
  }
  
  return {
    maxFrontTempC: Math.round(maxFrontTemp),
    maxRearTempC: Math.round(maxRearTemp),
    finalFrontTempC: Math.round(frontTemp),
    finalRearTempC: Math.round(rearTemp),
    history,
  };
}

// =============================================================================
// BRAKE FADE MODELING
// =============================================================================

/**
 * Pad compound characteristics
 */
export const PAD_COMPOUNDS = {
  'oem': {
    name: 'OEM Compound',
    coldFriction: 0.38,
    hotFriction: 0.32,
    fadeOnsetC: 350,
    maxTempC: 500,
    wearRate: 1.0,
    dustLevel: 'medium',
    noiseLevel: 'low',
  },
  'street-performance': {
    name: 'Street Performance',
    coldFriction: 0.42,
    hotFriction: 0.40,
    fadeOnsetC: 450,
    maxTempC: 600,
    wearRate: 1.3,
    dustLevel: 'medium-high',
    noiseLevel: 'low-medium',
  },
  'track-day': {
    name: 'Track Day',
    coldFriction: 0.38,
    hotFriction: 0.50,
    fadeOnsetC: 550,
    maxTempC: 750,
    wearRate: 1.8,
    dustLevel: 'high',
    noiseLevel: 'medium',
    needsHeatToWork: true,
  },
  'race': {
    name: 'Race Compound',
    coldFriction: 0.30,
    hotFriction: 0.55,
    fadeOnsetC: 650,
    maxTempC: 900,
    wearRate: 2.5,
    dustLevel: 'very-high',
    noiseLevel: 'high',
    needsHeatToWork: true,
  },
  'carbon-metallic': {
    name: 'Carbon Metallic',
    coldFriction: 0.35,
    hotFriction: 0.48,
    fadeOnsetC: 600,
    maxTempC: 800,
    wearRate: 0.8,
    dustLevel: 'medium',
    noiseLevel: 'medium-high',
    rotorWear: 1.5,
  },
};

/**
 * Calculate friction coefficient at temperature
 * 
 * @param {Object} padCompound - Pad compound characteristics
 * @param {number} temperatureC - Current brake temperature
 * @returns {number} Effective friction coefficient
 */
export function calculateFrictionAtTemp(padCompound, temperatureC) {
  const { coldFriction, hotFriction, fadeOnsetC, maxTempC } = padCompound;
  
  // Cold: use cold friction
  if (temperatureC < 100) {
    return coldFriction * (padCompound.needsHeatToWork ? 0.7 : 1.0);
  }
  
  // Warming up: transition to hot friction
  if (temperatureC < fadeOnsetC) {
    const progress = (temperatureC - 100) / (fadeOnsetC - 100);
    return coldFriction + (hotFriction - coldFriction) * progress;
  }
  
  // In fade zone: declining friction
  if (temperatureC < maxTempC) {
    const fadeProgress = (temperatureC - fadeOnsetC) / (maxTempC - fadeOnsetC);
    const fadeFriction = hotFriction * (1 - fadeProgress * 0.4); // Up to 40% fade
    return fadeFriction;
  }
  
  // Above max: severe fade
  return hotFriction * 0.3;
}

/**
 * Calculate fade characteristics for a compound
 * 
 * @param {string} compoundKey - Pad compound key
 * @param {number[]} temperatures - Array of temperatures to evaluate
 * @returns {Object[]} Friction vs temperature curve
 */
export function calculateFadeCurve(compoundKey, temperatures = [50, 100, 200, 300, 400, 500, 600, 700, 800]) {
  const compound = PAD_COMPOUNDS[compoundKey];
  if (!compound) return [];
  
  return temperatures.map(temp => ({
    temperatureC: temp,
    frictionCoeff: Math.round(calculateFrictionAtTemp(compound, temp) * 100) / 100,
    status: temp < compound.fadeOnsetC ? 'optimal' :
            temp < compound.maxTempC ? 'fading' : 'overheated',
  }));
}

// =============================================================================
// BRAKE MODIFICATIONS
// =============================================================================

/**
 * Brake modifications and their effects
 */
export const BRAKE_MODS = {
  // Rotors
  'rotors-slotted': {
    name: 'Slotted Rotors',
    fadeResistanceImprovement: 10, // percent
    biteImprovement: 5,
    wearIncrease: 20,
    description: 'Better gas/pad venting',
  },
  'rotors-drilled': {
    name: 'Drilled Rotors',
    fadeResistanceImprovement: 5,
    weightReduction: 2, // lbs per rotor
    crackRisk: true,
    description: 'Lighter, look good, crack risk',
  },
  'rotors-2piece': {
    name: '2-Piece Rotors',
    weightReduction: 4,
    fadeResistanceImprovement: 15,
    coolingImprovement: 10,
    description: 'Aluminum hat reduces weight',
  },
  'rotors-carbon-ceramic': {
    name: 'Carbon Ceramic Rotors',
    weightReduction: 12,
    fadeResistanceImprovement: 40,
    maxTempIncrease: 400,
    costMultiplier: 10,
    description: 'Ultimate fade resistance, expensive',
  },
  
  // Big brake kits
  'bbk-4piston': {
    name: '4-Piston BBK',
    rotorSizeIncrease: 30, // mm
    caliperPistonArea: 6.5, // sq in
    weightChange: 2, // lbs heavier
    description: 'Significant stopping improvement',
  },
  'bbk-6piston': {
    name: '6-Piston BBK',
    rotorSizeIncrease: 50,
    caliperPistonArea: 9.0,
    weightChange: 4,
    description: 'Race-level braking',
  },
  'bbk-6piston-rear': {
    name: '6-Piston Rear BBK',
    rotorSizeIncrease: 40,
    caliperPistonArea: 7.0,
    weightChange: 3,
    description: 'Balanced front-rear braking',
  },
  
  // Pads (reference PAD_COMPOUNDS)
  'pads-street-performance': { compound: 'street-performance' },
  'pads-track-day': { compound: 'track-day' },
  'pads-race': { compound: 'race' },
  
  // Lines and fluid
  'lines-braided': {
    name: 'Braided Brake Lines',
    pedalFeelImprovement: 20,
    description: 'Firmer pedal, no expansion',
  },
  'fluid-racing': {
    name: 'Racing Brake Fluid',
    boilingPointC: 310, // vs ~230 for DOT4
    description: 'Higher boiling point for track use',
  },
  
  // Master cylinder
  'master-cylinder-larger': {
    name: 'Larger Master Cylinder',
    pedalTravelReduction: 20,
    pedalForceIncrease: 15,
    description: 'Less travel, more force needed',
  },
  
  // Cooling
  'brake-ducts': {
    name: 'Brake Cooling Ducts',
    coolingImprovement: 30,
    description: 'Direct airflow to rotors',
  },
  'rotor-shields-delete': {
    name: 'Rotor Shield Delete',
    coolingImprovement: 10,
    description: 'Remove dust shields for airflow',
  },
};

/**
 * Calculate braking performance improvement from mods
 * 
 * @param {Object} baseBrakes - Base brake parameters
 * @param {string[]} mods - Array of mod keys
 * @returns {Object} Modified brake performance
 */
export function applyBrakeMods(baseBrakes, mods) {
  let rotorDiameter = baseBrakes.frontRotorDiameter;
  let pistonArea = baseBrakes.frontPistonArea;
  let frictionCoeff = baseBrakes.frictionCoeff;
  let fadeResistance = 100;
  let cooling = 100;
  let weight = 0;
  
  const appliedMods = [];
  
  for (const modKey of mods) {
    const mod = BRAKE_MODS[modKey];
    if (!mod) continue;
    
    if (mod.rotorSizeIncrease) rotorDiameter += mod.rotorSizeIncrease;
    if (mod.caliperPistonArea) pistonArea = mod.caliperPistonArea;
    if (mod.fadeResistanceImprovement) fadeResistance += mod.fadeResistanceImprovement;
    if (mod.coolingImprovement) cooling += mod.coolingImprovement;
    if (mod.weightChange) weight += mod.weightChange;
    if (mod.weightReduction) weight -= mod.weightReduction;
    
    if (mod.compound) {
      const compound = PAD_COMPOUNDS[mod.compound];
      if (compound) {
        frictionCoeff = compound.hotFriction;
      }
    }
    
    appliedMods.push({
      key: modKey,
      name: mod.name,
    });
  }
  
  return {
    frontRotorDiameter: rotorDiameter,
    frontPistonArea: pistonArea,
    frictionCoeff,
    fadeResistancePercent: fadeResistance,
    coolingPercent: cooling,
    weightChangePerCorner: weight,
    appliedMods,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  calculateBrakeTorque,
  calculatePistonArea,
  calculateEffectiveRadius,
  calculateMaxDeceleration,
  calculateStoppingDistance,
  calculateRotorThermalCapacity,
  calculateTemperatureRise,
  simulateBrakeTemperature,
  calculateFrictionAtTemp,
  calculateFadeCurve,
  applyBrakeMods,
  PAD_COMPOUNDS,
  BRAKE_MODS,
};
