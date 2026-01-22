/**
 * Cooling System Physics Model
 * 
 * Models engine and drivetrain thermal management:
 * - Radiator heat rejection capacity
 * - Oil cooler effectiveness
 * - Transmission and differential cooling
 * - Heat soak and recovery
 * - Thermal limits and safety
 */

// =============================================================================
// CONSTANTS
// =============================================================================

const WATER_SPECIFIC_HEAT = 4186; // J/(kg·K)
const OIL_SPECIFIC_HEAT = 2000; // J/(kg·K)
const AIR_SPECIFIC_HEAT = 1005; // J/(kg·K)

// =============================================================================
// ENGINE COOLING
// =============================================================================

/**
 * Calculate heat rejection required for engine cooling
 * 
 * Rule of thumb: ~30-35% of fuel energy becomes waste heat to coolant
 * 
 * @param {number} hp - Engine horsepower
 * @param {number} thermalEfficiency - Engine thermal efficiency (0.25-0.40)
 * @returns {Object} Heat rejection requirements
 */
export function calculateHeatRejection(hp, thermalEfficiency = 0.30) {
  // HP to watts
  const powerWatts = hp * 745.7;
  
  // Total fuel energy
  const fuelEnergy = powerWatts / thermalEfficiency;
  
  // Waste heat distribution (typical):
  // - Coolant: 30%
  // - Exhaust: 35%
  // - Oil: 5%
  // - Radiation: 5%
  // - Useful work: 25% (thermal efficiency)
  
  const coolantHeatWatts = fuelEnergy * 0.30;
  const exhaustHeatWatts = fuelEnergy * 0.35;
  const oilHeatWatts = fuelEnergy * 0.05;
  
  // Convert to BTU/hr for US units
  const coolantHeatBtu = coolantHeatWatts * 3.412;
  
  return {
    fuelEnergyWatts: Math.round(fuelEnergy),
    coolantHeatWatts: Math.round(coolantHeatWatts),
    coolantHeatBtuHr: Math.round(coolantHeatBtu),
    exhaustHeatWatts: Math.round(exhaustHeatWatts),
    oilHeatWatts: Math.round(oilHeatWatts),
  };
}

/**
 * Radiator sizing characteristics
 */
export const RADIATOR_SIZES = {
  'stock-small': {
    name: 'Stock (Compact)',
    coreVolumeLiters: 3,
    rows: 1,
    heatRejectionWatts: 40000,
    flowResistance: 'low',
    applications: '4-cyl economy',
  },
  'stock-medium': {
    name: 'Stock (Midsize)',
    coreVolumeLiters: 5,
    rows: 2,
    heatRejectionWatts: 60000,
    flowResistance: 'low',
    applications: '4-6 cyl standard',
  },
  'stock-large': {
    name: 'Stock (Large/V8)',
    coreVolumeLiters: 8,
    rows: 2,
    heatRejectionWatts: 85000,
    flowResistance: 'medium',
    applications: 'V8, performance',
  },
  'performance-aluminum': {
    name: 'Performance Aluminum',
    coreVolumeLiters: 10,
    rows: 2,
    heatRejectionWatts: 100000,
    flowResistance: 'medium',
    applications: 'Track day, modified',
  },
  'race-dual-pass': {
    name: 'Race Dual-Pass Aluminum',
    coreVolumeLiters: 14,
    rows: 3,
    heatRejectionWatts: 140000,
    flowResistance: 'high',
    applications: 'Racing, high HP',
  },
  'race-triple-pass': {
    name: 'Race Triple-Pass',
    coreVolumeLiters: 18,
    rows: 3,
    heatRejectionWatts: 180000,
    flowResistance: 'very-high',
    applications: 'Extreme applications',
  },
};

/**
 * Calculate radiator capacity vs requirements
 * 
 * @param {Object} radiator - Radiator characteristics
 * @param {number} requiredHeatWatts - Heat rejection required
 * @param {number} ambientTempC - Ambient temperature
 * @param {number} vehicleSpeedMph - Vehicle speed (affects airflow)
 * @returns {Object} Cooling capacity analysis
 */
export function analyzeRadiatorCapacity(radiator, requiredHeatWatts, ambientTempC = 25, vehicleSpeedMph = 60) {
  const { heatRejectionWatts } = radiator;
  
  // Speed affects cooling (more airflow at speed)
  const speedFactor = 0.3 + 0.7 * Math.min(1, vehicleSpeedMph / 60);
  
  // Temperature affects cooling (hotter ambient = less delta T)
  const tempFactor = Math.max(0.5, 1 - (ambientTempC - 25) * 0.02);
  
  const effectiveCapacity = heatRejectionWatts * speedFactor * tempFactor;
  const capacityRatio = effectiveCapacity / requiredHeatWatts;
  
  // Estimate coolant temperature
  const baseTemp = 82; // °C (180°F) - thermostat opening
  const overTemp = capacityRatio < 1 ? (1 - capacityRatio) * 30 : 0;
  const estimatedCoolantTemp = baseTemp + overTemp + (ambientTempC - 25) * 0.3;
  
  return {
    requiredWatts: Math.round(requiredHeatWatts),
    availableWatts: Math.round(effectiveCapacity),
    capacityRatio: Math.round(capacityRatio * 100) / 100,
    margin: Math.round((capacityRatio - 1) * 100),
    estimatedCoolantTempC: Math.round(estimatedCoolantTemp),
    status: capacityRatio > 1.2 ? 'excellent' :
            capacityRatio > 1.0 ? 'adequate' :
            capacityRatio > 0.9 ? 'marginal' : 'insufficient',
  };
}

// =============================================================================
// OIL COOLING
// =============================================================================

/**
 * Oil cooler types and characteristics
 */
export const OIL_COOLER_TYPES = {
  'none': {
    name: 'No Oil Cooler',
    heatRejectionWatts: 0,
    description: 'Stock on many cars',
  },
  'stock-integrated': {
    name: 'Stock Oil-to-Coolant',
    heatRejectionWatts: 3000,
    description: 'Uses engine coolant for cooling',
  },
  'air-small': {
    name: 'Small Air-to-Oil',
    heatRejectionWatts: 6000,
    coreRows: 10,
    description: 'Basic external cooler',
  },
  'air-medium': {
    name: 'Medium Air-to-Oil',
    heatRejectionWatts: 10000,
    coreRows: 19,
    description: 'Track day upgrade',
  },
  'air-large': {
    name: 'Large Air-to-Oil',
    heatRejectionWatts: 15000,
    coreRows: 25,
    description: 'Serious track use',
  },
  'race': {
    name: 'Race Oil Cooler',
    heatRejectionWatts: 25000,
    coreRows: 40,
    description: 'Racing applications',
  },
};

/**
 * Calculate oil temperature with/without cooler
 * 
 * @param {number} heatInput - Heat from engine to oil (watts)
 * @param {Object} cooler - Oil cooler characteristics
 * @param {number} ambientTempC - Ambient temperature
 * @param {number} airflowMph - Airflow speed
 * @returns {Object} Oil temperature analysis
 */
export function calculateOilTemperature(heatInput, cooler, ambientTempC = 25, airflowMph = 60) {
  const { heatRejectionWatts } = cooler;
  
  // Speed affects air-to-oil cooler effectiveness
  const airflowFactor = 0.2 + 0.8 * Math.min(1, airflowMph / 60);
  const effectiveCooling = heatRejectionWatts * airflowFactor;
  
  // Net heat retained in oil
  const netHeat = Math.max(0, heatInput - effectiveCooling);
  
  // Estimate oil temperature
  // Base operating temp is ~95°C (200°F)
  // Each kW of unrejected heat raises temp by ~5°C (rough approximation)
  const baseOilTemp = 95;
  const tempRise = (netHeat / 1000) * 5;
  const oilTemp = baseOilTemp + tempRise + (ambientTempC - 25) * 0.5;
  
  // Danger thresholds
  const dangerTemp = 135; // °C - oil breakdown begins
  const warningTemp = 120; // °C - should address cooling
  
  return {
    heatInputWatts: Math.round(heatInput),
    coolingCapacityWatts: Math.round(effectiveCooling),
    estimatedOilTempC: Math.round(oilTemp),
    estimatedOilTempF: Math.round(oilTemp * 1.8 + 32),
    status: oilTemp > dangerTemp ? 'danger' :
            oilTemp > warningTemp ? 'warning' :
            oilTemp > 110 ? 'elevated' : 'normal',
    recommendation: oilTemp > warningTemp ? 'Oil cooler upgrade recommended' : null,
  };
}

// =============================================================================
// TRANSMISSION & DIFFERENTIAL COOLING
// =============================================================================

/**
 * Trans cooler characteristics
 */
export const TRANS_COOLER_TYPES = {
  'none': {
    name: 'No External Cooler',
    heatRejectionWatts: 0,
  },
  'stock-auto': {
    name: 'Stock Auto Trans Cooler',
    heatRejectionWatts: 5000,
    description: 'Integrated in radiator tank',
  },
  'aux-small': {
    name: 'Auxiliary Small Cooler',
    heatRejectionWatts: 8000,
    description: 'Towing upgrade',
  },
  'aux-large': {
    name: 'Auxiliary Large Cooler',
    heatRejectionWatts: 15000,
    description: 'Performance/heavy towing',
  },
  'race-standalone': {
    name: 'Standalone Trans Cooler',
    heatRejectionWatts: 25000,
    description: 'Race applications',
  },
};

/**
 * Differential cooler characteristics
 */
export const DIFF_COOLER_TYPES = {
  'none': {
    name: 'No Diff Cooler',
    heatRejectionWatts: 0,
    description: 'Stock on most cars',
  },
  'pump-cooler': {
    name: 'Differential Pump & Cooler',
    heatRejectionWatts: 5000,
    description: 'For track use',
  },
  'race': {
    name: 'Race Diff Cooler System',
    heatRejectionWatts: 10000,
    description: 'Continuous track use',
  },
};

// =============================================================================
// HEAT SOAK MODELING
// =============================================================================

/**
 * Simulate intake heat soak
 * 
 * Heat soak occurs when the car is stationary and heat from the engine
 * bay increases intake air temperature.
 * 
 * @param {number} idleTimeMinutes - Time at idle/stationary
 * @param {number} engineBayTemp - Engine bay temperature (°C)
 * @param {number} intakeType - 'stock', 'short-ram', 'cold-air'
 * @returns {Object} Heat soak effects
 */
export function simulateIntakeHeatSoak(idleTimeMinutes, engineBayTemp = 70, intakeType = 'stock') {
  // Heat soak rates by intake type
  const heatSoakRates = {
    'stock': 2.5, // °C per minute
    'short-ram': 3.5, // Worse - in engine bay
    'cold-air': 1.0, // Better - isolated
    'insulated': 0.5, // Best - insulated
  };
  
  const rate = heatSoakRates[intakeType] || 2.5;
  const ambientTemp = 25;
  const maxTemp = engineBayTemp - 10; // Intake won't exceed engine bay
  
  // Exponential approach to max temp
  const tempRise = (maxTemp - ambientTemp) * (1 - Math.exp(-rate * idleTimeMinutes / 10));
  const intakeTemp = ambientTemp + tempRise;
  
  // Power loss estimate: ~1% per 10°C above optimal
  const optimalIntakeTemp = 30;
  const tempAboveOptimal = Math.max(0, intakeTemp - optimalIntakeTemp);
  const powerLossPercent = tempAboveOptimal * 0.1;
  
  return {
    intakeTempC: Math.round(intakeTemp),
    tempRiseC: Math.round(tempRise),
    powerLossPercent: Math.round(powerLossPercent * 10) / 10,
    densityLossPercent: Math.round(tempRise * 0.3 * 10) / 10,
    status: intakeTemp > 50 ? 'significant_soak' :
            intakeTemp > 40 ? 'moderate_soak' : 'minimal',
  };
}

/**
 * Calculate intercooler heat soak
 * 
 * @param {number} pulls - Number of full-throttle pulls
 * @param {number} cooldownSeconds - Time between pulls
 * @param {Object} intercooler - IC characteristics
 * @param {number} ambientTempC - Ambient temperature
 * @returns {Object} Heat soak progression
 */
export function simulateIntercoolerHeatSoak(pulls, cooldownSeconds, intercooler, ambientTempC = 25) {
  const { efficiency, heatSoakResistance } = intercooler;
  
  const resistanceMultiplier = {
    'low': 0.5,
    'moderate': 0.7,
    'high': 0.85,
    'very-high': 0.95,
  }[heatSoakResistance] || 0.7;
  
  const results = [];
  let icTemp = ambientTempC;
  let chargeAirAboveAmbient = 15; // Starting point
  
  for (let pull = 1; pull <= pulls; pull++) {
    // Heat added during pull
    const heatAdded = 15 * (1 + (pull * 0.1)); // More heat with each pull
    icTemp += heatAdded * (1 - resistanceMultiplier);
    
    // Cooling during rest
    const cooling = (icTemp - ambientTempC) * (cooldownSeconds / 60) * 0.3;
    icTemp = Math.max(ambientTempC, icTemp - cooling);
    
    // Charge air temp
    chargeAirAboveAmbient = (icTemp - ambientTempC) / efficiency;
    const chargeAirTemp = ambientTempC + chargeAirAboveAmbient;
    
    results.push({
      pull,
      icCoreTempC: Math.round(icTemp),
      chargeAirTempC: Math.round(chargeAirTemp),
      chargeAirAboveAmbientC: Math.round(chargeAirAboveAmbient),
      effectiveEfficiency: Math.round(efficiency * resistanceMultiplier * 100),
    });
  }
  
  return {
    results,
    finalChargeAirTemp: results[results.length - 1].chargeAirTempC,
    heatSoakSeverity: icTemp - ambientTempC > 30 ? 'severe' :
                      icTemp - ambientTempC > 20 ? 'moderate' : 'minimal',
  };
}

// =============================================================================
// COOLING MODIFICATIONS
// =============================================================================

/**
 * Cooling system modifications
 */
export const COOLING_MODS = {
  // Radiator
  'radiator-aluminum': {
    name: 'Aluminum Radiator',
    coolingImprovement: 25, // percent
    weightChange: -10, // lbs
    description: 'Better heat transfer',
  },
  'radiator-dual-pass': {
    name: 'Dual-Pass Radiator',
    coolingImprovement: 40,
    pressureDropIncrease: 15,
    description: 'More efficient cooling',
  },
  'radiator-oversized': {
    name: 'Oversized Radiator',
    coolingImprovement: 50,
    fitmentNote: 'May require modifications',
    description: 'Maximum cooling capacity',
  },
  
  // Fans
  'fan-electric': {
    name: 'Electric Fan Conversion',
    lowSpeedCooling: 30, // percent improvement
    powerFreed: 5, // HP at high RPM
    description: 'Better low-speed cooling',
  },
  'fan-high-flow': {
    name: 'High-Flow Electric Fan',
    lowSpeedCooling: 50,
    description: 'Maximum airflow at low speed',
  },
  'fan-shroud': {
    name: 'Fan Shroud',
    fanEfficiencyIncrease: 20,
    description: 'Directs all air through radiator',
  },
  
  // Coolant
  'coolant-performance': {
    name: 'Performance Coolant',
    heatTransferIncrease: 5,
    boilingPointIncrease: 10, // °C
    description: 'Better heat transfer properties',
  },
  'thermostat-lower': {
    name: 'Lower Temp Thermostat',
    operatingTempReduction: 10, // °C
    warmupTimeIncrease: true,
    description: 'Earlier cooling activation',
  },
  
  // Oil cooling
  'oil-cooler-add': {
    name: 'Add Oil Cooler',
    oilTempReduction: 20, // °C
    description: 'External air-to-oil cooler',
  },
  'oil-cooler-large': {
    name: 'Large Oil Cooler',
    oilTempReduction: 35,
    description: 'For track use',
  },
  
  // Trans cooling
  'trans-cooler-aux': {
    name: 'Auxiliary Trans Cooler',
    transTempReduction: 15,
    description: 'Additional cooling for auto trans',
  },
  
  // Airflow
  'ducting-brake': {
    name: 'Brake Cooling Ducts',
    brakeCoolingImprovement: 30,
    radiatorFlowReduction: 5,
    description: 'Direct air to brakes',
  },
  'hood-vents': {
    name: 'Hood Vents',
    heatExtractionImprovement: 15,
    description: 'Releases underhood heat',
  },
  'grille-delete': {
    name: 'Grille Delete/Opening',
    airflowIncrease: 20,
    description: 'Maximum radiator airflow',
  },
};

/**
 * Calculate cooling improvement from mods
 * 
 * @param {Object} baseCooling - Base cooling system
 * @param {string[]} mods - Array of mod keys
 * @returns {Object} Improved cooling characteristics
 */
export function applyCoolingMods(baseCooling, mods) {
  let coolingCapacity = baseCooling.heatRejectionWatts || 80000;
  let oilCoolingCapacity = baseCooling.oilCoolingWatts || 0;
  let operatingTemp = baseCooling.operatingTempC || 95;
  
  const appliedMods = [];
  
  for (const modKey of mods) {
    const mod = COOLING_MODS[modKey];
    if (!mod) continue;
    
    if (mod.coolingImprovement) {
      coolingCapacity *= (1 + mod.coolingImprovement / 100);
    }
    if (mod.oilTempReduction) {
      oilCoolingCapacity += mod.oilTempReduction * 500; // Rough conversion
    }
    if (mod.operatingTempReduction) {
      operatingTemp -= mod.operatingTempReduction;
    }
    if (mod.lowSpeedCooling) {
      // Modeled as capacity increase
      coolingCapacity *= (1 + mod.lowSpeedCooling / 200);
    }
    
    appliedMods.push({
      key: modKey,
      name: mod.name,
    });
  }
  
  return {
    originalCapacity: baseCooling.heatRejectionWatts || 80000,
    improvedCapacity: Math.round(coolingCapacity),
    capacityIncrease: Math.round((coolingCapacity / (baseCooling.heatRejectionWatts || 80000) - 1) * 100),
    oilCoolingCapacity: Math.round(oilCoolingCapacity),
    operatingTempC: Math.round(operatingTemp),
    appliedMods,
  };
}

// =============================================================================
// THERMAL SAFETY LIMITS
// =============================================================================

/**
 * Temperature limits by component
 */
export const THERMAL_LIMITS = {
  coolant: {
    optimal: 82, // °C
    elevated: 100,
    warning: 110,
    danger: 120,
    damage: 130,
  },
  oil: {
    optimal: 95,
    elevated: 110,
    warning: 120,
    danger: 135,
    damage: 150,
  },
  transmission: {
    optimal: 80,
    elevated: 100,
    warning: 120,
    danger: 140,
    damage: 160,
  },
  differential: {
    optimal: 70,
    elevated: 90,
    warning: 110,
    danger: 130,
    damage: 150,
  },
  brakes: {
    optimal: 200,
    elevated: 400,
    warning: 550,
    danger: 700,
    damage: 800,
  },
  tires: {
    optimal: 80,
    elevated: 100,
    warning: 110,
    danger: 120,
    damage: 130,
  },
  intakeAir: {
    optimal: 30,
    elevated: 45,
    warning: 55,
    danger: 70,
    damage: 90,
  },
};

/**
 * Analyze thermal status of a system
 * 
 * @param {string} system - System name ('coolant', 'oil', etc)
 * @param {number} temperatureC - Current temperature
 * @returns {Object} Thermal status
 */
export function analyzeThermalStatus(system, temperatureC) {
  const limits = THERMAL_LIMITS[system];
  if (!limits) return { status: 'unknown' };
  
  let status, recommendation;
  
  if (temperatureC <= limits.optimal) {
    status = 'optimal';
    recommendation = null;
  } else if (temperatureC <= limits.elevated) {
    status = 'elevated';
    recommendation = 'Monitor temperature';
  } else if (temperatureC <= limits.warning) {
    status = 'warning';
    recommendation = 'Reduce load, improve cooling';
  } else if (temperatureC <= limits.danger) {
    status = 'danger';
    recommendation = 'Stop immediately, allow cooldown';
  } else {
    status = 'critical';
    recommendation = 'STOP NOW - component damage likely';
  }
  
  const margin = limits.warning - temperatureC;
  
  return {
    system,
    temperatureC,
    status,
    marginToWarning: Math.round(margin),
    recommendation,
    limits,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

const coolingModel = {
  calculateHeatRejection,
  analyzeRadiatorCapacity,
  calculateOilTemperature,
  simulateIntakeHeatSoak,
  simulateIntercoolerHeatSoak,
  applyCoolingMods,
  analyzeThermalStatus,
  RADIATOR_SIZES,
  OIL_COOLER_TYPES,
  TRANS_COOLER_TYPES,
  DIFF_COOLER_TYPES,
  COOLING_MODS,
  THERMAL_LIMITS,
};

export default coolingModel;
