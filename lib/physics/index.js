/**
 * AutoRev Physics Engine - Unified Vehicle Dynamics Calculator
 * 
 * This module integrates all physics models to provide comprehensive
 * vehicle performance analysis and lap time estimation.
 * 
 * Models included:
 * - Gearing & acceleration
 * - Aerodynamics
 * - Suspension & handling
 * - Braking
 * - Tires & grip
 * - Weight & balance
 * - Forced induction
 * - Cooling & thermal
 */

// Import all physics models
import * as gearing from './gearingModel.js';
import * as aero from './aerodynamicsModel.js';
import * as suspension from './suspensionModel.js';
import * as braking from './brakingModel.js';
import * as tires from './tireModel.js';
import * as weight from './weightModel.js';
import * as forcedInduction from './forcedInductionModel.js';
import * as cooling from './coolingModel.js';

// =============================================================================
// VEHICLE STATE OBJECT
// =============================================================================

/**
 * Create a complete vehicle state from car data and modifications
 * 
 * @param {Object} car - Car data from database
 * @param {Object} physicsParams - Physics parameters from vehicle_physics_params
 * @param {string[]} mods - Array of modification keys
 * @returns {Object} Complete vehicle state
 */
export function createVehicleState(car, physicsParams = {}, mods = []) {
  // Start with base values from car and physics params
  const state = {
    // Identity
    name: car.name,
    slug: car.slug,
    
    // Weight
    weight: physicsParams.curb_weight_lbs || car.curbWeight || 3500,
    frontWeightPercent: physicsParams.front_weight_percent || 50,
    cgHeight: physicsParams.cg_height_inches || weight.estimateCgHeight(car.bodyStyle || 'sedan'),
    unsprungWeightFront: physicsParams.unsprung_weight_front_lbs || 60,
    unsprungWeightRear: physicsParams.unsprung_weight_rear_lbs || 55,
    
    // Dimensions
    wheelbase: physicsParams.wheelbase_inches || 108,
    trackWidthFront: physicsParams.track_width_front_inches || 62,
    trackWidthRear: physicsParams.track_width_rear_inches || 62,
    
    // Drivetrain
    drivetrain: physicsParams.drivetrain || car.drivetrain || 'RWD',
    transmissionType: physicsParams.transmission_type || 'manual',
    gearRatios: physicsParams.gear_ratios || [3.5, 2.1, 1.4, 1.0, 0.8, 0.65],
    finalDrive: physicsParams.final_drive_ratio || 3.55,
    
    // Engine
    hp: physicsParams.peak_hp || car.hp || 300,
    hpRpm: physicsParams.peak_hp_rpm || 6500,
    torque: physicsParams.peak_torque_lb_ft || car.torque || 300,
    torqueRpm: physicsParams.peak_torque_rpm || 4500,
    redline: physicsParams.redline_rpm || 7000,
    aspiration: physicsParams.aspiration || detectAspiration(car),
    boostPsi: physicsParams.boost_psi_stock || 0,
    
    // Aero
    dragCoefficient: physicsParams.drag_coefficient || 0.32,
    frontalArea: physicsParams.frontal_area_sqft || 22,
    liftCoefficientFront: physicsParams.lift_coefficient_front || 0.05,
    liftCoefficientRear: physicsParams.lift_coefficient_rear || 0.08,
    
    // Suspension
    springRateFront: physicsParams.spring_rate_front_lbs_in || 350,
    springRateRear: physicsParams.spring_rate_rear_lbs_in || 300,
    swayBarFront: physicsParams.sway_bar_front_mm || 25,
    swayBarRear: physicsParams.sway_bar_rear_mm || 20,
    rollCenterFront: physicsParams.roll_center_front_inches || 2,
    rollCenterRear: physicsParams.roll_center_rear_inches || 4,
    
    // Brakes
    brakeRotorFront: physicsParams.brake_rotor_front_mm || 330,
    brakeRotorRear: physicsParams.brake_rotor_rear_mm || 310,
    brakePistonsFront: physicsParams.brake_caliper_pistons_front || 4,
    brakePistonsRear: physicsParams.brake_caliper_pistons_rear || 2,
    
    // Tires
    tireWidthFront: physicsParams.tire_width_front_mm || 255,
    tireAspectFront: physicsParams.tire_aspect_front || 40,
    wheelDiameterFront: physicsParams.wheel_diameter_front || 18,
    tireWidthRear: physicsParams.tire_width_rear_mm || 275,
    tireAspectRear: physicsParams.tire_aspect_rear || 40,
    wheelDiameterRear: physicsParams.wheel_diameter_rear || 18,
    tireCompound: physicsParams.tire_compound_stock || 'summer-sport',
    
    // Cooling
    radiatorType: physicsParams.radiator_type || 'stock-medium',
    hasOilCooler: physicsParams.oil_cooler || false,
    
    // Modifications applied
    mods: [...mods],
  };
  
  // Apply modifications
  return applyModifications(state, mods);
}

/**
 * Apply modifications to vehicle state
 */
function applyModifications(state, mods) {
  const modified = { ...state };
  
  // Apply weight mods
  const weightMods = mods.filter(m => weight.WEIGHT_MODS[m]);
  if (weightMods.length > 0) {
    const result = weight.applyWeightMods(state.weight, state.frontWeightPercent, weightMods);
    modified.weight = result.newWeight;
    modified.frontWeightPercent = result.newFrontPercent;
    modified.cgHeight += result.cgHeightChange;
  }
  
  // Apply tire mods
  const tireMods = mods.filter(m => tires.TIRE_MODS[m]);
  if (tireMods.length > 0) {
    const result = tires.applyTireMods({ compound: tires.TIRE_COMPOUNDS[state.tireCompound] }, tireMods);
    modified.tireCompound = result.compound?.name || state.tireCompound;
    modified.tireGrip = result.peakGrip;
  }
  
  // Apply aero mods
  const aeroMods = mods.filter(m => aero.AERO_MODS[m]);
  if (aeroMods.length > 0) {
    const result = aero.applyAeroMods({
      cd: state.dragCoefficient,
      clFront: state.liftCoefficientFront,
      clRear: state.liftCoefficientRear,
      frontalArea: state.frontalArea,
    }, aeroMods);
    modified.dragCoefficient = result.cd;
    modified.liftCoefficientFront = result.clFront;
    modified.liftCoefficientRear = result.clRear;
  }
  
  // Apply brake mods
  const brakeMods = mods.filter(m => braking.BRAKE_MODS[m]);
  if (brakeMods.length > 0) {
    const result = braking.applyBrakeMods({
      frontRotorDiameter: state.brakeRotorFront,
      frontPistonArea: state.brakePistonsFront * 2, // Rough estimate
      frictionCoeff: 0.4,
    }, brakeMods);
    modified.brakeRotorFront = result.frontRotorDiameter;
  }
  
  // Apply suspension mods
  const suspMods = mods.filter(m => suspension.SUSPENSION_MODS[m]);
  for (const modKey of suspMods) {
    const mod = suspension.SUSPENSION_MODS[modKey];
    if (mod.springRateIncrease) {
      modified.springRateFront *= (1 + mod.springRateIncrease / 100);
      modified.springRateRear *= (1 + mod.springRateIncrease / 100);
    }
    if (mod.rideHeightChange) {
      modified.cgHeight += mod.rideHeightChange * 0.4;
    }
  }
  
  // Apply FI mods (power gains calculated separately)
  const fiMods = mods.filter(m => forcedInduction.FI_MODS[m]);
  if (fiMods.length > 0 && modified.boostPsi > 0) {
    for (const modKey of fiMods) {
      const mod = forcedInduction.FI_MODS[modKey];
      if (mod.boostIncrease) {
        modified.boostPsi += mod.boostIncrease;
      }
    }
  }
  
  return modified;
}

/**
 * Detect aspiration from car data
 */
function detectAspiration(car) {
  const engine = (car.engine || '').toLowerCase();
  if (engine.includes('twin turbo') || engine.includes('biturbo') || engine.includes('tt')) {
    return 'TwinTurbo';
  }
  if (engine.includes('turbo')) return 'Turbo';
  if (engine.includes('supercharged') || engine.includes(' sc')) return 'Supercharged';
  return 'NA';
}

// =============================================================================
// COMPREHENSIVE PERFORMANCE ANALYSIS
// =============================================================================

/**
 * Analyze complete vehicle performance
 * 
 * @param {Object} vehicleState - Complete vehicle state
 * @param {Object} options - Analysis options
 * @returns {Object} Comprehensive performance analysis
 */
export function analyzePerformance(vehicleState, options = {}) {
  const {
    ambientTempC = 25,
    altitudeFt = 0,
    surfaceGrip = 1.0,
  } = options;
  
  const results = {
    vehicle: {
      name: vehicleState.name,
      weight: vehicleState.weight,
      hp: vehicleState.hp,
      torque: vehicleState.torque,
      drivetrain: vehicleState.drivetrain,
    },
    
    // Power to weight
    powerToWeight: weight.calculatePowerToWeight(
      vehicleState.hp,
      vehicleState.weight,
      vehicleState.torque
    ),
    
    // Weight distribution
    weightDistribution: weight.calculateCornerWeights(
      vehicleState.weight,
      vehicleState.frontWeightPercent
    ),
    
    // Tire grip
    tireGrip: null,
    
    // Acceleration
    acceleration: null,
    
    // Top speed
    topSpeed: aero.calculateTopSpeed(
      vehicleState.hp,
      vehicleState.dragCoefficient,
      vehicleState.frontalArea,
      getDrivetrainLoss(vehicleState.drivetrain),
      altitudeFt
    ),
    
    // Braking
    braking: null,
    
    // Aerodynamics
    aeroEffects: aero.calculateSpeedEffects(
      {
        cd: vehicleState.dragCoefficient,
        clFront: vehicleState.liftCoefficientFront,
        clRear: vehicleState.liftCoefficientRear,
        frontalArea: vehicleState.frontalArea,
      },
      vehicleState.weight
    ),
    
    // Handling
    handling: null,
    
    // Thermal
    thermal: null,
  };
  
  // Tire grip analysis
  const compound = tires.TIRE_COMPOUNDS[vehicleState.tireCompound] || tires.TIRE_COMPOUNDS['summer-sport'];
  results.tireGrip = {
    peakGrip: compound.peakGrip * surfaceGrip,
    compound: compound.name,
    loadSensitivity: tires.calculateLoadSensitivity(compound),
    temperatureGrip: tires.calculateTempGripMultiplier(80, compound), // Assume 80°C operating
  };
  
  // Acceleration simulation
  const tireCirc = gearing.calculateTireCircumference(
    vehicleState.tireWidthRear,
    vehicleState.tireAspectRear,
    vehicleState.wheelDiameterRear
  );
  
  results.acceleration = gearing.simulateAcceleration({
    weight: vehicleState.weight,
    hp: vehicleState.hp,
    torque: vehicleState.torque,
    peakHpRpm: vehicleState.hpRpm,
    peakTorqueRpm: vehicleState.torqueRpm,
    redline: vehicleState.redline,
    aspiration: vehicleState.aspiration,
    gearRatios: vehicleState.gearRatios,
    finalDrive: vehicleState.finalDrive,
    tireWidth: vehicleState.tireWidthRear,
    tireAspect: vehicleState.tireAspectRear,
    wheelDiameter: vehicleState.wheelDiameterRear,
    dragCoefficient: vehicleState.dragCoefficient,
    frontalArea: vehicleState.frontalArea,
    drivetrain: vehicleState.drivetrain,
  });
  
  // Braking analysis
  const maxDecel = braking.calculateMaxDeceleration(
    {
      frontRotorDiameter: vehicleState.brakeRotorFront,
      rearRotorDiameter: vehicleState.brakeRotorRear,
      frontPadHeight: 50,
      rearPadHeight: 45,
      frontPistonArea: vehicleState.brakePistonsFront * 1.5,
      rearPistonArea: vehicleState.brakePistonsRear * 1.2,
      maxLinePressure: 1200,
      frictionCoeff: 0.45,
      tireRadius: tireCirc / (2 * Math.PI),
    },
    vehicleState.weight,
    compound.peakGrip * surfaceGrip
  );
  
  results.braking = {
    maxDeceleration: maxDecel,
    stoppingFrom60: braking.calculateStoppingDistance(60, maxDecel.decelerationG),
    stoppingFrom100: braking.calculateStoppingDistance(100, maxDecel.decelerationG),
  };
  
  // Handling analysis
  const frontWheelRate = suspension.calculateWheelRate(vehicleState.springRateFront);
  const rearWheelRate = suspension.calculateWheelRate(vehicleState.springRateRear);
  const frontRideFreq = suspension.calculateRideFrequency(frontWheelRate, vehicleState.weight * vehicleState.frontWeightPercent / 100 / 2);
  const rearRideFreq = suspension.calculateRideFrequency(rearWheelRate, vehicleState.weight * (100 - vehicleState.frontWeightPercent) / 100 / 2);
  
  const frontRollStiffness = suspension.calculateRollStiffness(frontWheelRate, vehicleState.trackWidthFront);
  const rearRollStiffness = suspension.calculateRollStiffness(rearWheelRate, vehicleState.trackWidthRear);
  
  results.handling = {
    rideFrequency: {
      front: Math.round(frontRideFreq * 100) / 100,
      rear: Math.round(rearRideFreq * 100) / 100,
    },
    rollDistribution: suspension.calculateRollDistribution(frontRollStiffness, rearRollStiffness),
    bodyRollAt1G: suspension.calculateBodyRoll(
      1.0,
      vehicleState.weight * 0.9, // Sprung weight
      (vehicleState.rollCenterFront + vehicleState.rollCenterRear) / 2,
      vehicleState.cgHeight,
      frontRollStiffness + rearRollStiffness
    ),
    yawMoi: weight.calculateYawMoi(
      vehicleState.weight,
      vehicleState.wheelbase,
      (vehicleState.trackWidthFront + vehicleState.trackWidthRear) / 2,
      vehicleState.frontWeightPercent
    ),
  };
  
  // Thermal analysis
  const heatRejection = cooling.calculateHeatRejection(vehicleState.hp);
  const radiator = cooling.RADIATOR_SIZES[vehicleState.radiatorType] || cooling.RADIATOR_SIZES['stock-medium'];
  
  results.thermal = {
    heatGenerated: heatRejection,
    radiatorCapacity: cooling.analyzeRadiatorCapacity(radiator, heatRejection.coolantHeatWatts, ambientTempC, 60),
    oilTemp: vehicleState.hasOilCooler 
      ? cooling.calculateOilTemperature(heatRejection.oilHeatWatts, cooling.OIL_COOLER_TYPES['air-medium'], ambientTempC)
      : cooling.calculateOilTemperature(heatRejection.oilHeatWatts, cooling.OIL_COOLER_TYPES['none'], ambientTempC),
  };
  
  // Performance summary
  results.summary = {
    zeroTo60: results.acceleration.zeroTo60,
    quarterMile: results.acceleration.quarterMile,
    quarterMileSpeed: results.acceleration.quarterMileSpeed,
    topSpeed: results.topSpeed.topSpeedMph,
    brakingFrom60: results.braking.stoppingFrom60.totalDistanceFt,
    maxLateralG: compound.peakGrip * surfaceGrip,
    bodyRollDeg: results.handling.bodyRollAt1G,
    powerToWeightRatio: results.powerToWeight.hpPerTon,
  };
  
  return results;
}

/**
 * Get drivetrain loss factor
 */
function getDrivetrainLoss(drivetrain) {
  return {
    FWD: 0.12,
    RWD: 0.15,
    AWD: 0.20,
    '4WD': 0.22,
  }[drivetrain] || 0.15;
}

// =============================================================================
// COMPARISON UTILITIES
// =============================================================================

/**
 * Compare two vehicle configurations
 * 
 * @param {Object} baseline - Baseline vehicle state
 * @param {Object} modified - Modified vehicle state
 * @returns {Object} Comparison results
 */
export function compareConfigurations(baseline, modified) {
  const baseAnalysis = analyzePerformance(baseline);
  const modAnalysis = analyzePerformance(modified);
  
  return {
    baseline: baseAnalysis.summary,
    modified: modAnalysis.summary,
    differences: {
      zeroTo60: {
        change: modAnalysis.summary.zeroTo60 - baseAnalysis.summary.zeroTo60,
        percentChange: ((modAnalysis.summary.zeroTo60 - baseAnalysis.summary.zeroTo60) / baseAnalysis.summary.zeroTo60) * 100,
        improved: modAnalysis.summary.zeroTo60 < baseAnalysis.summary.zeroTo60,
      },
      quarterMile: {
        change: modAnalysis.summary.quarterMile - baseAnalysis.summary.quarterMile,
        percentChange: ((modAnalysis.summary.quarterMile - baseAnalysis.summary.quarterMile) / baseAnalysis.summary.quarterMile) * 100,
        improved: modAnalysis.summary.quarterMile < baseAnalysis.summary.quarterMile,
      },
      topSpeed: {
        change: modAnalysis.summary.topSpeed - baseAnalysis.summary.topSpeed,
        percentChange: ((modAnalysis.summary.topSpeed - baseAnalysis.summary.topSpeed) / baseAnalysis.summary.topSpeed) * 100,
        improved: modAnalysis.summary.topSpeed > baseAnalysis.summary.topSpeed,
      },
      braking: {
        change: modAnalysis.summary.brakingFrom60 - baseAnalysis.summary.brakingFrom60,
        percentChange: ((modAnalysis.summary.brakingFrom60 - baseAnalysis.summary.brakingFrom60) / baseAnalysis.summary.brakingFrom60) * 100,
        improved: modAnalysis.summary.brakingFrom60 < baseAnalysis.summary.brakingFrom60,
      },
      lateralG: {
        change: modAnalysis.summary.maxLateralG - baseAnalysis.summary.maxLateralG,
        percentChange: ((modAnalysis.summary.maxLateralG - baseAnalysis.summary.maxLateralG) / baseAnalysis.summary.maxLateralG) * 100,
        improved: modAnalysis.summary.maxLateralG > baseAnalysis.summary.maxLateralG,
      },
    },
    modsApplied: modified.mods.filter(m => !baseline.mods.includes(m)),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

// Re-export all individual models
export { gearing, aero, suspension, braking, tires, weight, forcedInduction, cooling };

// Export main functions
const index = {
  createVehicleState,
  analyzePerformance,
  compareConfigurations,
  gearing,
  aero,
  suspension,
  braking,
  tires,
  weight,
  forcedInduction,
  cooling,
};

export default index;
