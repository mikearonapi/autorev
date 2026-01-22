/**
 * Forced Induction Physics Model
 * 
 * Models turbocharger and supercharger dynamics:
 * - Turbo spool and lag characteristics
 * - Compressor maps and efficiency
 * - Boost curves vs RPM
 * - Intercooler effects
 * - Supercharger parasitic loss
 * - Wastegate and boost control
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const AIR_DENSITY_SEA_LEVEL = 1.204; // kg/m³
const AIR_GAS_CONSTANT = 287; // J/(kg·K)
const SPECIFIC_HEAT_RATIO = 1.4; // γ for air
const AMBIENT_TEMP_K = 298; // 25°C

// =============================================================================
// TURBO COMPRESSOR MODELING
// =============================================================================

/**
 * Turbo compressor characteristics
 * 
 * Based on typical turbo sizing for different applications
 */
export const TURBO_SIZES = {
  'small-journal': {
    name: 'Small Journal Bearing',
    wheelDiameterMm: 44,
    maxFlowLbMin: 35,
    peakEfficiency: 0.72,
    spoolRpm: 2500,
    maxBoostPsi: 22,
    lagCharacteristic: 'quick',
    applications: 'Small 4-cyl (1.5-2.0L)',
  },
  'medium-journal': {
    name: 'Medium Journal Bearing',
    wheelDiameterMm: 54,
    maxFlowLbMin: 55,
    peakEfficiency: 0.74,
    spoolRpm: 3200,
    maxBoostPsi: 25,
    lagCharacteristic: 'moderate',
    applications: 'Medium 4-cyl (2.0-2.5L), small 6-cyl',
  },
  'large-journal': {
    name: 'Large Journal Bearing',
    wheelDiameterMm: 66,
    maxFlowLbMin: 80,
    peakEfficiency: 0.76,
    spoolRpm: 4000,
    maxBoostPsi: 30,
    lagCharacteristic: 'lazy',
    applications: 'Large 6-cyl, small V8',
  },
  'small-ball-bearing': {
    name: 'Small Ball Bearing',
    wheelDiameterMm: 44,
    maxFlowLbMin: 35,
    peakEfficiency: 0.73,
    spoolRpm: 2000,
    maxBoostPsi: 25,
    lagCharacteristic: 'very-quick',
    applications: 'Performance 4-cyl',
  },
  'medium-ball-bearing': {
    name: 'Medium Ball Bearing',
    wheelDiameterMm: 54,
    maxFlowLbMin: 58,
    peakEfficiency: 0.76,
    spoolRpm: 2600,
    maxBoostPsi: 28,
    lagCharacteristic: 'quick',
    applications: 'Performance 4-6 cyl',
  },
  'large-ball-bearing': {
    name: 'Large Ball Bearing',
    wheelDiameterMm: 66,
    maxFlowLbMin: 85,
    peakEfficiency: 0.78,
    spoolRpm: 3400,
    maxBoostPsi: 35,
    lagCharacteristic: 'moderate',
    applications: 'Performance 6-8 cyl',
  },
  'gtx-gen2': {
    name: 'GTX Gen2 (billet wheel)',
    wheelDiameterMm: 58,
    maxFlowLbMin: 65,
    peakEfficiency: 0.80,
    spoolRpm: 2400,
    maxBoostPsi: 35,
    lagCharacteristic: 'quick',
    applications: 'High-performance 4-6 cyl',
  },
  'efr': {
    name: 'EFR (high-flow)',
    wheelDiameterMm: 62,
    maxFlowLbMin: 75,
    peakEfficiency: 0.82,
    spoolRpm: 2800,
    maxBoostPsi: 40,
    lagCharacteristic: 'quick',
    applications: 'Race applications',
  },
};

/**
 * Calculate compressor outlet temperature
 * 
 * @param {number} pressureRatio - Pressure ratio (absolute out / absolute in)
 * @param {number} inletTempK - Inlet temperature in Kelvin
 * @param {number} compressorEfficiency - Compressor efficiency (0-1)
 * @returns {Object} Outlet temperature and heat
 */
export function calculateCompressorOutletTemp(pressureRatio, inletTempK, compressorEfficiency) {
  // Ideal (isentropic) temperature rise
  const idealTempRatio = Math.pow(pressureRatio, (SPECIFIC_HEAT_RATIO - 1) / SPECIFIC_HEAT_RATIO);
  const idealOutletTemp = inletTempK * idealTempRatio;
  
  // Actual temperature rise (accounting for efficiency)
  const actualTempRise = (idealOutletTemp - inletTempK) / compressorEfficiency;
  const actualOutletTemp = inletTempK + actualTempRise;
  
  return {
    idealOutletTempK: Math.round(idealOutletTemp),
    actualOutletTempK: Math.round(actualOutletTemp),
    idealOutletTempC: Math.round(idealOutletTemp - 273),
    actualOutletTempC: Math.round(actualOutletTemp - 273),
    heatAddedK: Math.round(actualTempRise),
  };
}

/**
 * Calculate mass airflow for given boost and engine parameters
 * 
 * @param {number} displacement - Engine displacement in liters
 * @param {number} rpm - Engine RPM
 * @param {number} boostPsi - Boost pressure in PSI
 * @param {number} volumetricEfficiency - VE (0-1, typically 0.85-0.95 for turbo)
 * @returns {Object} Mass airflow
 */
export function calculateMassAirflow(displacement, rpm, boostPsi, volumetricEfficiency = 0.90) {
  // Convert units
  const displacementM3 = displacement / 1000;
  const pressureRatio = (14.7 + boostPsi) / 14.7;
  
  // Air density with boost
  const boostedDensity = AIR_DENSITY_SEA_LEVEL * pressureRatio;
  
  // Volume flow rate (4-stroke: 2 revolutions per cycle)
  const volumeFlowM3PerMin = (displacementM3 * rpm * volumetricEfficiency) / 2;
  
  // Mass flow rate
  const massFlowKgPerMin = volumeFlowM3PerMin * boostedDensity;
  const massFlowLbPerMin = massFlowKgPerMin * 2.205;
  
  return {
    massFlowKgMin: Math.round(massFlowKgPerMin * 100) / 100,
    massFlowLbMin: Math.round(massFlowLbPerMin * 10) / 10,
    pressureRatio: Math.round(pressureRatio * 100) / 100,
    airDensityKgM3: Math.round(boostedDensity * 100) / 100,
  };
}

/**
 * Calculate turbo spool characteristics
 * 
 * @param {Object} turbo - Turbo size characteristics
 * @param {number} engineDisplacement - Engine displacement in liters
 * @param {number} exhaustGasTemp - Exhaust gas temperature in °C
 * @returns {Object} Spool characteristics
 */
export function calculateTurboSpool(turbo, engineDisplacement, exhaustGasTemp = 900) {
  const { wheelDiameterMm, spoolRpm, lagCharacteristic } = turbo;
  
  // Larger turbo on smaller engine = more lag
  const sizeMismatchFactor = wheelDiameterMm / (engineDisplacement * 25);
  
  // Higher EGT = faster spool
  const egtFactor = exhaustGasTemp / 900;
  
  // Adjust spool RPM
  const adjustedSpoolRpm = spoolRpm * sizeMismatchFactor / egtFactor;
  
  // Lag time estimate (seconds to target boost from idle)
  const lagTimeBase = {
    'very-quick': 0.3,
    'quick': 0.5,
    'moderate': 0.8,
    'lazy': 1.2,
  }[lagCharacteristic] || 0.6;
  
  const adjustedLagTime = lagTimeBase * sizeMismatchFactor;
  
  return {
    fullBoostRpm: Math.round(adjustedSpoolRpm),
    estimatedLagTime: Math.round(adjustedLagTime * 100) / 100,
    spoolCharacteristic: adjustedLagTime < 0.4 ? 'very-responsive' :
                         adjustedLagTime < 0.6 ? 'responsive' :
                         adjustedLagTime < 0.9 ? 'moderate-lag' : 'significant-lag',
    sizingNote: sizeMismatchFactor > 1.2 ? 'turbo oversized for engine' :
                sizeMismatchFactor < 0.8 ? 'turbo undersized for engine' : 'well-matched',
  };
}

/**
 * Generate boost curve vs RPM
 * 
 * @param {Object} turbo - Turbo characteristics
 * @param {number} targetBoost - Target boost in PSI
 * @param {number} spoolRpm - RPM where full boost is achieved
 * @param {number} redline - Engine redline
 * @returns {Object[]} Boost vs RPM curve
 */
export function generateBoostCurve(turbo, targetBoost, spoolRpm, redline) {
  const curve = [];
  
  for (let rpm = 1000; rpm <= redline; rpm += 500) {
    let boost;
    
    if (rpm < spoolRpm * 0.5) {
      // Below spool threshold - minimal boost
      boost = targetBoost * 0.1 * (rpm / (spoolRpm * 0.5));
    } else if (rpm < spoolRpm) {
      // Building boost - rapid rise
      const progress = (rpm - spoolRpm * 0.5) / (spoolRpm * 0.5);
      boost = targetBoost * (0.1 + 0.9 * Math.pow(progress, 0.7));
    } else {
      // Full boost - slight rise or flat
      boost = targetBoost * (1 + 0.05 * (rpm - spoolRpm) / (redline - spoolRpm));
    }
    
    curve.push({
      rpm,
      boostPsi: Math.round(boost * 10) / 10,
      boostBar: Math.round(boost * 0.0689 * 100) / 100,
    });
  }
  
  return curve;
}

// =============================================================================
// SUPERCHARGER MODELING
// =============================================================================

/**
 * Supercharger types and characteristics
 */
export const SUPERCHARGER_TYPES = {
  'roots-2.3': {
    name: '2.3L Roots-Type',
    type: 'roots',
    displacement: 2.3,
    maxBoostPsi: 12,
    peakEfficiency: 0.55,
    parasiticLoss: 0.08, // 8% of crank power at full boost
    powerBand: 'low-mid',
    heatGeneration: 'high',
    applications: 'Muscle cars, trucks',
  },
  'roots-2.9': {
    name: '2.9L Roots-Type (TVS)',
    type: 'roots',
    displacement: 2.9,
    maxBoostPsi: 15,
    peakEfficiency: 0.65,
    parasiticLoss: 0.07,
    powerBand: 'low-mid',
    heatGeneration: 'moderate',
    applications: 'High-performance V8',
  },
  'twin-screw-2.3': {
    name: '2.3L Twin-Screw',
    type: 'twin-screw',
    displacement: 2.3,
    maxBoostPsi: 18,
    peakEfficiency: 0.70,
    parasiticLoss: 0.06,
    powerBand: 'broad',
    heatGeneration: 'moderate',
    applications: 'Performance applications',
  },
  'twin-screw-2.9': {
    name: '2.9L Twin-Screw',
    type: 'twin-screw',
    displacement: 2.9,
    maxBoostPsi: 22,
    peakEfficiency: 0.72,
    parasiticLoss: 0.065,
    powerBand: 'broad',
    heatGeneration: 'moderate',
    applications: 'High-performance V8',
  },
  'centrifugal-small': {
    name: 'Small Centrifugal',
    type: 'centrifugal',
    flowCapacity: 800, // CFM
    maxBoostPsi: 15,
    peakEfficiency: 0.78,
    parasiticLoss: 0.04,
    powerBand: 'top-end',
    heatGeneration: 'low',
    applications: 'Compact performance',
  },
  'centrifugal-large': {
    name: 'Large Centrifugal',
    type: 'centrifugal',
    flowCapacity: 1500,
    maxBoostPsi: 25,
    peakEfficiency: 0.80,
    parasiticLoss: 0.05,
    powerBand: 'top-end',
    heatGeneration: 'low',
    applications: 'High-HP builds',
  },
};

/**
 * Calculate supercharger parasitic power loss
 * 
 * @param {Object} supercharger - Supercharger characteristics
 * @param {number} crankPower - Crank horsepower
 * @param {number} boostPsi - Current boost level
 * @param {number} rpm - Engine RPM
 * @returns {Object} Power loss details
 */
export function calculateSuperchargerLoss(supercharger, crankPower, boostPsi, rpm) {
  const { parasiticLoss, maxBoostPsi, type } = supercharger;
  
  // Loss scales with boost (roughly linear)
  const boostRatio = boostPsi / maxBoostPsi;
  const baseLoss = crankPower * parasiticLoss * boostRatio;
  
  // Different types have different RPM characteristics
  let rpmFactor;
  if (type === 'centrifugal') {
    // Centrifugal: loss increases with RPM squared
    rpmFactor = Math.pow(rpm / 6000, 2);
  } else if (type === 'roots') {
    // Roots: relatively flat loss curve
    rpmFactor = 0.8 + 0.2 * (rpm / 6000);
  } else {
    // Twin-screw: moderate RPM dependency
    rpmFactor = 0.9 + 0.1 * (rpm / 6000);
  }
  
  const totalLoss = baseLoss * rpmFactor;
  const netPower = crankPower - totalLoss;
  
  return {
    grossPower: Math.round(crankPower),
    parasiticLoss: Math.round(totalLoss),
    netPower: Math.round(netPower),
    lossPercent: Math.round((totalLoss / crankPower) * 100 * 10) / 10,
  };
}

/**
 * Generate supercharger boost curve vs RPM
 * 
 * @param {Object} supercharger - Supercharger characteristics
 * @param {number} pulleyRatio - Drive ratio (higher = more boost)
 * @param {number} redline - Engine redline
 * @returns {Object[]} Boost vs RPM curve
 */
export function generateSuperchargerBoostCurve(supercharger, pulleyRatio, redline) {
  const { type, maxBoostPsi } = supercharger;
  const targetBoost = maxBoostPsi * Math.min(1, pulleyRatio);
  
  const curve = [];
  
  for (let rpm = 1000; rpm <= redline; rpm += 500) {
    let boost;
    
    if (type === 'centrifugal') {
      // Centrifugal: boost rises with RPM squared
      const rpmRatio = rpm / redline;
      boost = targetBoost * Math.pow(rpmRatio, 1.8);
    } else if (type === 'roots') {
      // Roots: instant boost, slight drop at high RPM
      const rpmRatio = rpm / redline;
      boost = targetBoost * (0.85 + 0.15 * Math.min(1, rpm / 3000));
      if (rpm > 5500) {
        boost *= 0.95; // Slight efficiency drop
      }
    } else {
      // Twin-screw: instant boost, maintains well
      const rpmRatio = rpm / redline;
      boost = targetBoost * (0.90 + 0.10 * Math.min(1, rpm / 2500));
    }
    
    curve.push({
      rpm,
      boostPsi: Math.round(boost * 10) / 10,
      boostBar: Math.round(boost * 0.0689 * 100) / 100,
    });
  }
  
  return curve;
}

// =============================================================================
// INTERCOOLER MODELING
// =============================================================================

/**
 * Intercooler types and characteristics
 */
export const INTERCOOLER_TYPES = {
  'stock': {
    name: 'Stock Intercooler',
    efficiency: 0.65,
    pressureDrop: 0.5, // PSI
    heatSoakResistance: 'low',
    description: 'Factory intercooler',
  },
  'upgraded-bar-plate': {
    name: 'Upgraded Bar & Plate',
    efficiency: 0.75,
    pressureDrop: 0.8,
    heatSoakResistance: 'moderate',
    description: 'Larger core, better cooling',
  },
  'fmic-large': {
    name: 'Large Front-Mount IC',
    efficiency: 0.85,
    pressureDrop: 1.0,
    heatSoakResistance: 'high',
    description: 'Maximum cooling capacity',
  },
  'air-water': {
    name: 'Air-to-Water Intercooler',
    efficiency: 0.90,
    pressureDrop: 0.3,
    heatSoakResistance: 'very-high',
    description: 'Best for repeated pulls',
  },
  'chargecooler': {
    name: 'Chargecooler (SC)',
    efficiency: 0.88,
    pressureDrop: 0.4,
    heatSoakResistance: 'high',
    description: 'For supercharger applications',
  },
};

/**
 * Calculate charge air temperature after intercooler
 * 
 * @param {number} compressorOutletTempC - Compressor outlet temp in °C
 * @param {number} ambientTempC - Ambient temperature in °C
 * @param {number} intercoolerEfficiency - IC efficiency (0-1)
 * @returns {Object} Charge air temperature
 */
export function calculateChargeAirTemp(compressorOutletTempC, ambientTempC, intercoolerEfficiency) {
  // Intercooler cools toward ambient
  const tempDrop = (compressorOutletTempC - ambientTempC) * intercoolerEfficiency;
  const chargeTemp = compressorOutletTempC - tempDrop;
  
  return {
    compressorOutletC: Math.round(compressorOutletTempC),
    chargeAirTempC: Math.round(chargeTemp),
    tempDropC: Math.round(tempDrop),
    aboveAmbientC: Math.round(chargeTemp - ambientTempC),
  };
}

/**
 * Calculate density improvement from intercooling
 * 
 * @param {number} chargeAirTempK - Charge air temp in Kelvin
 * @param {number} nonIntercooledTempK - Temp without intercooler in Kelvin
 * @returns {Object} Density improvement
 */
export function calculateDensityImprovement(chargeAirTempK, nonIntercooledTempK) {
  // Density inversely proportional to temperature (ideal gas law)
  const densityRatio = nonIntercooledTempK / chargeAirTempK;
  const improvement = (densityRatio - 1) * 100;
  
  return {
    densityRatio: Math.round(densityRatio * 1000) / 1000,
    densityImprovementPercent: Math.round(improvement * 10) / 10,
    approximatePowerGain: Math.round(improvement * 0.8), // ~80% translates to power
  };
}

// =============================================================================
// BOOST CONTROL
// =============================================================================

/**
 * Wastegate and boost control methods
 */
export const BOOST_CONTROL = {
  'internal-actuator': {
    name: 'Internal Wastegate Actuator',
    precision: 'moderate',
    maxBoostPsi: 18,
    boostCreep: 'possible',
    description: 'Stock-style control',
  },
  'external-wastegate': {
    name: 'External Wastegate',
    precision: 'high',
    maxBoostPsi: 35,
    boostCreep: 'unlikely',
    description: 'Better high-boost control',
  },
  'electronic-boost-controller': {
    name: 'Electronic Boost Controller',
    precision: 'very-high',
    maxBoostPsi: 40,
    boostCreep: 'prevented',
    description: 'Precise, adjustable control',
  },
  'open-loop': {
    name: 'Open Loop (no control)',
    precision: 'none',
    maxBoostPsi: 50,
    boostCreep: 'likely',
    description: 'Race-only, dangerous',
  },
};

/**
 * Calculate boost target with altitude correction
 * 
 * @param {number} seaLevelBoost - Target boost at sea level (PSI)
 * @param {number} altitudeFt - Altitude in feet
 * @returns {Object} Altitude-corrected boost
 */
export function calculateAltitudeBoostCorrection(seaLevelBoost, altitudeFt) {
  // Atmospheric pressure drops ~1 PSI per 1800 ft
  const atmPressure = 14.7 - (altitudeFt / 1800);
  const pressureRatio = atmPressure / 14.7;
  
  // To maintain same absolute pressure, need more gauge boost
  const correctedBoost = seaLevelBoost + (14.7 - atmPressure);
  
  // Or, if running same gauge boost, effective boost is less
  const effectiveBoost = seaLevelBoost * pressureRatio;
  
  return {
    atmosphericPressure: Math.round(atmPressure * 10) / 10,
    boostToMatchSeaLevel: Math.round(correctedBoost * 10) / 10,
    effectiveBoostAtAltitude: Math.round(effectiveBoost * 10) / 10,
    powerLossPercent: Math.round((1 - pressureRatio) * 100),
  };
}

// =============================================================================
// FORCED INDUCTION UPGRADES
// =============================================================================

/**
 * Forced induction modifications
 */
export const FI_MODS = {
  // Turbo upgrades
  'turbo-larger': {
    name: 'Larger Turbo Upgrade',
    flowIncrease: 30, // percent
    lagIncrease: 25, // percent
    boostPotentialIncrease: 40, // percent
    description: 'More top-end power, more lag',
  },
  'turbo-ball-bearing': {
    name: 'Ball Bearing Turbo',
    lagReduction: 30, // percent
    efficiencyIncrease: 5,
    description: 'Faster spool, better response',
  },
  'turbo-billet-wheel': {
    name: 'Billet Compressor Wheel',
    flowIncrease: 15,
    efficiencyIncrease: 3,
    description: 'Improved flow and strength',
  },
  'twin-turbo-conversion': {
    name: 'Twin Turbo Conversion',
    flowIncrease: 80,
    lagReduction: 20,
    complexity: 'very-high',
    description: 'Two smaller turbos for better response',
  },
  
  // Supercharger upgrades
  'sc-pulley-smaller': {
    name: 'Smaller Supercharger Pulley',
    boostIncrease: 3, // PSI typical
    heatIncrease: 15, // percent
    description: 'More boost, more heat',
  },
  'sc-pulley-2step': {
    name: '2-Step Smaller Pulley',
    boostIncrease: 5,
    heatIncrease: 25,
    description: 'Significant boost increase',
  },
  'sc-ported': {
    name: 'Ported Supercharger',
    efficiencyIncrease: 8,
    flowIncrease: 10,
    description: 'Improved inlet flow',
  },
  
  // Intercooler upgrades
  'ic-upgraded': {
    name: 'Upgraded Intercooler',
    efficiencyIncrease: 15, // percent
    pressureDropIncrease: 0.3, // PSI
    description: 'Better cooling, slight pressure drop',
  },
  'ic-fmic': {
    name: 'Front-Mount Intercooler',
    efficiencyIncrease: 25,
    pressureDropIncrease: 0.5,
    description: 'Maximum cooling capacity',
  },
  'ic-air-water': {
    name: 'Air-to-Water IC System',
    efficiencyIncrease: 35,
    consistencyImprovement: 'excellent',
    description: 'Best for repeated pulls',
  },
  
  // Supporting mods
  'downpipe-catless': {
    name: 'Catless Downpipe',
    boostThresholdReduction: 300, // RPM
    exhaustFlowIncrease: 30,
    emissions: 'illegal',
    description: 'Faster spool, more flow',
  },
  'exhaust-3inch': {
    name: '3" Exhaust System',
    exhaustFlowIncrease: 20,
    backpressureReduction: 25,
    description: 'Reduced back pressure',
  },
  'intake-upgraded': {
    name: 'Upgraded Intake',
    flowIncrease: 10,
    filtrationReduction: 'slight',
    description: 'More airflow to compressor',
  },
};

/**
 * Calculate forced induction power gains
 * 
 * @param {number} stockPower - Stock horsepower
 * @param {number} stockBoost - Stock boost in PSI (0 for NA)
 * @param {number} targetBoost - Target boost in PSI
 * @param {Object} options - Additional options
 * @returns {Object} Power estimates
 */
export function calculateFIPowerGain(stockPower, stockBoost, targetBoost, options = {}) {
  const {
    intercoolerEfficiency = 0.75,
    tuneQuality = 'good', // 'conservative', 'good', 'aggressive'
    fuelType = 'premium', // 'regular', 'premium', 'e85'
  } = options;
  
  // Boost multiplier (rough rule: +1 PSI ≈ +3-5% power on turbo cars)
  const boostIncrease = targetBoost - stockBoost;
  const baseMultiplier = 0.04; // 4% per PSI baseline
  
  // Tune quality affects gains
  const tuneMultiplier = {
    'conservative': 0.85,
    'good': 1.0,
    'aggressive': 1.15,
  }[tuneQuality] || 1.0;
  
  // Fuel affects gains
  const fuelMultiplier = {
    'regular': 0.85,
    'premium': 1.0,
    'e85': 1.25,
  }[fuelType] || 1.0;
  
  // Intercooler affects consistency
  const icFactor = 0.8 + (intercoolerEfficiency * 0.25);
  
  const powerMultiplier = 1 + (boostIncrease * baseMultiplier * tuneMultiplier * fuelMultiplier * icFactor);
  const estimatedPower = stockPower * powerMultiplier;
  
  return {
    stockPower,
    boostIncrease,
    powerMultiplier: Math.round(powerMultiplier * 100) / 100,
    estimatedPower: Math.round(estimatedPower),
    powerGain: Math.round(estimatedPower - stockPower),
    powerGainPercent: Math.round((powerMultiplier - 1) * 100),
    confidence: intercoolerEfficiency > 0.8 ? 'high' : 'moderate',
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

const forcedInductionModel = {
  calculateCompressorOutletTemp,
  calculateMassAirflow,
  calculateTurboSpool,
  generateBoostCurve,
  calculateSuperchargerLoss,
  generateSuperchargerBoostCurve,
  calculateChargeAirTemp,
  calculateDensityImprovement,
  calculateAltitudeBoostCorrection,
  calculateFIPowerGain,
  TURBO_SIZES,
  SUPERCHARGER_TYPES,
  INTERCOOLER_TYPES,
  BOOST_CONTROL,
  FI_MODS,
};

export default forcedInductionModel;
