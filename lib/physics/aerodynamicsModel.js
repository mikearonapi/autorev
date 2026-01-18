/**
 * Aerodynamics Physics Model
 * 
 * Models air resistance and downforce effects on vehicle performance:
 * - Drag coefficient and frontal area
 * - Downforce generation
 * - Top speed calculations
 * - Aero balance (front/rear downforce distribution)
 * - Effect of aero modifications (wings, splitters, diffusers)
 */

// =============================================================================
// CONSTANTS
// =============================================================================

// Air density at sea level, 20°C (kg/m³)
const AIR_DENSITY_SEA_LEVEL = 1.204;

// Air density variation with altitude
const AIR_DENSITY_PER_1000FT = 0.035; // ~3.5% reduction per 1000ft

// Conversion factors
const MPH_TO_MS = 0.44704;
const HP_TO_WATTS = 745.7;
const LB_TO_N = 4.44822;
const SQFT_TO_SQM = 0.0929;

// =============================================================================
// BASELINE AERODYNAMIC PROFILES
// =============================================================================

/**
 * Typical aerodynamic values by vehicle type
 */
export const AERO_PROFILES = {
  // Sports cars
  sports_coupe: {
    cd: 0.32,      // Drag coefficient
    frontalArea: 21.5, // sq ft
    clFront: 0.05,  // Lift coefficient front (positive = lift)
    clRear: 0.08,   // Lift coefficient rear
    description: 'Typical sports coupe (Mustang, Camaro, 370Z)',
  },
  sports_sedan: {
    cd: 0.30,
    frontalArea: 23.0,
    clFront: 0.08,
    clRear: 0.10,
    description: 'Sports sedan (M3, C63, RS5)',
  },
  supercar: {
    cd: 0.35,
    frontalArea: 20.0,
    clFront: -0.10,  // Negative = downforce
    clRear: -0.15,
    description: 'Mid-engine supercar (458, Huracan)',
  },
  hypercar: {
    cd: 0.38,
    frontalArea: 19.5,
    clFront: -0.25,
    clRear: -0.40,
    description: 'Track-focused hypercar (P1, 918)',
  },
  gt_car: {
    cd: 0.33,
    frontalArea: 21.0,
    clFront: 0.02,
    clRear: 0.05,
    description: 'Grand tourer (DB11, Continental GT)',
  },
  hot_hatch: {
    cd: 0.33,
    frontalArea: 22.0,
    clFront: 0.10,
    clRear: 0.12,
    description: 'Hot hatchback (Golf R, Focus RS)',
  },
  truck: {
    cd: 0.45,
    frontalArea: 35.0,
    clFront: 0.15,
    clRear: 0.15,
    description: 'Pickup truck (F-150, Silverado)',
  },
  suv: {
    cd: 0.38,
    frontalArea: 30.0,
    clFront: 0.12,
    clRear: 0.14,
    description: 'Performance SUV (X5M, Cayenne)',
  },
};

// =============================================================================
// DRAG CALCULATIONS
// =============================================================================

/**
 * Calculate aerodynamic drag force
 * 
 * @param {number} velocity - Speed in m/s
 * @param {number} cd - Drag coefficient
 * @param {number} frontalArea - Frontal area in m²
 * @param {number} airDensity - Air density in kg/m³
 * @returns {number} Drag force in Newtons
 */
export function calculateDragForce(velocity, cd, frontalArea, airDensity = AIR_DENSITY_SEA_LEVEL) {
  return 0.5 * airDensity * cd * frontalArea * velocity * velocity;
}

/**
 * Calculate power required to overcome drag
 * 
 * @param {number} velocity - Speed in m/s
 * @param {number} cd - Drag coefficient
 * @param {number} frontalArea - Frontal area in m²
 * @param {number} airDensity - Air density in kg/m³
 * @returns {number} Power in Watts
 */
export function calculateDragPower(velocity, cd, frontalArea, airDensity = AIR_DENSITY_SEA_LEVEL) {
  const dragForce = calculateDragForce(velocity, cd, frontalArea, airDensity);
  return dragForce * velocity;
}

/**
 * Calculate theoretical top speed (where power = drag)
 * 
 * @param {number} hp - Engine horsepower
 * @param {number} cd - Drag coefficient
 * @param {number} frontalArea - Frontal area in sq ft
 * @param {number} drivetrainLoss - Drivetrain loss factor (0.15 = 15%)
 * @param {number} altitudeFt - Altitude in feet
 * @returns {Object} { topSpeedMph, powerAtTopSpeed }
 */
export function calculateTopSpeed(hp, cd, frontalArea, drivetrainLoss = 0.15, altitudeFt = 0) {
  // Convert to metric
  const wheelPowerWatts = hp * HP_TO_WATTS * (1 - drivetrainLoss);
  const frontalAreaM2 = frontalArea * SQFT_TO_SQM;
  
  // Adjust air density for altitude
  const altitudeReduction = (altitudeFt / 1000) * AIR_DENSITY_PER_1000FT;
  const airDensity = AIR_DENSITY_SEA_LEVEL * (1 - altitudeReduction);
  
  // Power = 0.5 * ρ * Cd * A * v³
  // v = (2 * P / (ρ * Cd * A))^(1/3)
  const velocityMs = Math.pow(
    (2 * wheelPowerWatts) / (airDensity * cd * frontalAreaM2),
    1/3
  );
  
  const topSpeedMph = velocityMs / MPH_TO_MS;
  const powerAtTopSpeed = hp * (1 - drivetrainLoss);
  
  return {
    topSpeedMph: Math.round(topSpeedMph),
    powerAtTopSpeed: Math.round(powerAtTopSpeed),
    dragForceAtTopSpeed: Math.round(calculateDragForce(velocityMs, cd, frontalAreaM2, airDensity) / LB_TO_N),
  };
}

/**
 * Calculate top speed change from aero modifications
 * 
 * @param {Object} original - Original aero params
 * @param {Object} modified - Modified aero params
 * @param {number} hp - Horsepower
 * @returns {Object} Speed and efficiency changes
 */
export function calculateAeroModEffect(original, modified, hp) {
  const originalTopSpeed = calculateTopSpeed(hp, original.cd, original.frontalArea);
  const modifiedTopSpeed = calculateTopSpeed(hp, modified.cd, modified.frontalArea);
  
  // Calculate drag change at 100 mph
  const testVelocity = 100 * MPH_TO_MS;
  const originalDrag = calculateDragPower(
    testVelocity,
    original.cd,
    original.frontalArea * SQFT_TO_SQM
  );
  const modifiedDrag = calculateDragPower(
    testVelocity,
    modified.cd,
    modified.frontalArea * SQFT_TO_SQM
  );
  
  return {
    topSpeedChange: modifiedTopSpeed.topSpeedMph - originalTopSpeed.topSpeedMph,
    dragChangePercent: ((modifiedDrag - originalDrag) / originalDrag) * 100,
    powerSavedAt100mph: Math.round((originalDrag - modifiedDrag) / HP_TO_WATTS),
  };
}

// =============================================================================
// DOWNFORCE CALCULATIONS
// =============================================================================

/**
 * Calculate downforce at a given speed
 * 
 * @param {number} velocityMph - Speed in MPH
 * @param {number} cl - Lift coefficient (negative = downforce)
 * @param {number} frontalArea - Reference area in sq ft
 * @param {number} airDensity - Air density kg/m³
 * @returns {number} Downforce in lbs (positive = downward)
 */
export function calculateDownforce(velocityMph, cl, frontalArea, airDensity = AIR_DENSITY_SEA_LEVEL) {
  const velocityMs = velocityMph * MPH_TO_MS;
  const areaM2 = frontalArea * SQFT_TO_SQM;
  
  // Lift force (negative cl = downforce)
  const liftForceN = 0.5 * airDensity * cl * areaM2 * velocityMs * velocityMs;
  
  // Return as downforce (positive = pushes car down)
  return -liftForceN / LB_TO_N;
}

/**
 * Calculate aero balance (front/rear downforce distribution)
 * 
 * @param {number} velocityMph - Speed in MPH
 * @param {number} clFront - Front lift coefficient
 * @param {number} clRear - Rear lift coefficient
 * @param {number} frontalArea - Reference area in sq ft
 * @returns {Object} Front and rear downforce
 */
export function calculateAeroBalance(velocityMph, clFront, clRear, frontalArea) {
  const frontDownforce = calculateDownforce(velocityMph, clFront, frontalArea * 0.5);
  const rearDownforce = calculateDownforce(velocityMph, clRear, frontalArea * 0.5);
  
  const totalDownforce = frontDownforce + rearDownforce;
  const balance = totalDownforce > 0 
    ? (frontDownforce / totalDownforce) * 100 
    : 50;
  
  return {
    frontDownforceLbs: Math.round(frontDownforce),
    rearDownforceLbs: Math.round(rearDownforce),
    totalDownforceLbs: Math.round(totalDownforce),
    balancePercent: Math.round(balance), // % front
    description: balance > 55 ? 'Front-heavy (understeer tendency)' :
                 balance < 45 ? 'Rear-heavy (oversteer tendency)' :
                 'Balanced',
  };
}

/**
 * Calculate grip increase from downforce
 * 
 * @param {number} downforceLbs - Total downforce in lbs
 * @param {number} carWeightLbs - Car weight in lbs
 * @param {number} baseGripG - Base lateral grip in Gs
 * @returns {Object} Grip improvement
 */
export function calculateDownforceGripBenefit(downforceLbs, carWeightLbs, baseGripG = 1.0) {
  // Effective weight increase from downforce
  const effectiveWeight = carWeightLbs + downforceLbs;
  
  // Grip scales with normal force (simplified linear relationship)
  const gripMultiplier = effectiveWeight / carWeightLbs;
  const newGripG = baseGripG * Math.sqrt(gripMultiplier); // Square root due to tire load sensitivity
  
  return {
    effectiveWeightLbs: Math.round(effectiveWeight),
    gripMultiplier: Math.round(gripMultiplier * 100) / 100,
    newGripG: Math.round(newGripG * 100) / 100,
    gripGainPercent: Math.round((newGripG / baseGripG - 1) * 100),
  };
}

// =============================================================================
// AERO MODIFICATION EFFECTS
// =============================================================================

/**
 * Aero modifications and their typical effects
 */
export const AERO_MODS = {
  // Wings and spoilers
  'wing-low': {
    name: 'Low Profile Wing',
    cdChange: 0.01,
    clRearChange: -0.08,
    description: 'Small rear wing, mild downforce',
  },
  'wing-medium': {
    name: 'GT-Style Wing',
    cdChange: 0.02,
    clRearChange: -0.15,
    description: 'Medium rear wing with adjustable angle',
  },
  'wing-high': {
    name: 'High Downforce Wing',
    cdChange: 0.04,
    clRearChange: -0.30,
    description: 'Large swan-neck wing for track use',
  },
  'wing-active': {
    name: 'Active Aero Wing',
    cdChange: 0.01, // Low drag mode
    clRearChange: -0.25, // High downforce mode
    description: 'DRS-style adjustable wing',
  },
  
  // Front aero
  'splitter-small': {
    name: 'Front Lip Splitter',
    cdChange: 0.005,
    clFrontChange: -0.05,
    description: 'Small front splitter, reduces lift',
  },
  'splitter-large': {
    name: 'Race Splitter',
    cdChange: 0.015,
    clFrontChange: -0.15,
    description: 'Extended splitter with endplates',
  },
  'canards': {
    name: 'Front Canards',
    cdChange: 0.01,
    clFrontChange: -0.08,
    description: 'Dive planes for front downforce',
  },
  
  // Underbody
  'diffuser-small': {
    name: 'Rear Diffuser',
    cdChange: -0.01, // Reduces drag!
    clRearChange: -0.10,
    description: 'Basic rear diffuser, improves airflow',
  },
  'diffuser-large': {
    name: 'Race Diffuser',
    cdChange: -0.02,
    clRearChange: -0.20,
    description: 'Multi-element diffuser with strakes',
  },
  'flat-floor': {
    name: 'Flat Underbody Panel',
    cdChange: -0.015,
    clFrontChange: -0.02,
    clRearChange: -0.03,
    description: 'Smooth underbody reduces drag',
  },
  
  // Side aero
  'side-skirts': {
    name: 'Aero Side Skirts',
    cdChange: -0.005,
    description: 'Seals gap between body and ground',
  },
  'vortex-generators': {
    name: 'Roof Vortex Generators',
    cdChange: 0.002,
    clRearChange: -0.02,
    description: 'Improves airflow attachment over rear window',
  },
  
  // Cooling
  'hood-vents': {
    name: 'Hood Vents',
    cdChange: 0.008,
    clFrontChange: -0.02,
    description: 'Reduces underhood pressure, extracts heat',
  },
  'fender-vents': {
    name: 'Fender Vents',
    cdChange: -0.005,
    description: 'Releases wheel well pressure',
  },
  
  // Full kits
  'aero-kit-street': {
    name: 'Street Aero Package',
    cdChange: 0.01,
    clFrontChange: -0.08,
    clRearChange: -0.12,
    description: 'Front lip, side skirts, rear lip',
  },
  'aero-kit-track': {
    name: 'Track Aero Package',
    cdChange: 0.03,
    clFrontChange: -0.20,
    clRearChange: -0.35,
    description: 'Full splitter, wing, diffuser package',
  },
  'aero-kit-time-attack': {
    name: 'Time Attack Aero',
    cdChange: 0.06,
    clFrontChange: -0.40,
    clRearChange: -0.60,
    description: 'Maximum downforce setup',
  },
};

/**
 * Apply aero modifications and calculate new values
 * 
 * @param {Object} baseAero - Base aerodynamic values
 * @param {string[]} mods - Array of mod keys
 * @returns {Object} Modified aero values
 */
export function applyAeroMods(baseAero, mods) {
  let cd = baseAero.cd;
  let clFront = baseAero.clFront || 0.05;
  let clRear = baseAero.clRear || 0.08;
  
  const appliedMods = [];
  
  for (const modKey of mods) {
    const mod = AERO_MODS[modKey];
    if (!mod) continue;
    
    cd += mod.cdChange || 0;
    clFront += mod.clFrontChange || 0;
    clRear += mod.clRearChange || 0;
    
    appliedMods.push({
      key: modKey,
      name: mod.name,
      effects: {
        cdChange: mod.cdChange,
        clFrontChange: mod.clFrontChange,
        clRearChange: mod.clRearChange,
      },
    });
  }
  
  return {
    cd: Math.round(cd * 1000) / 1000,
    clFront: Math.round(clFront * 1000) / 1000,
    clRear: Math.round(clRear * 1000) / 1000,
    frontalArea: baseAero.frontalArea,
    appliedMods,
    changes: {
      cdChange: Math.round((cd - baseAero.cd) * 1000) / 1000,
      clFrontChange: Math.round((clFront - (baseAero.clFront || 0.05)) * 1000) / 1000,
      clRearChange: Math.round((clRear - (baseAero.clRear || 0.08)) * 1000) / 1000,
    },
  };
}

// =============================================================================
// SPEED-DEPENDENT EFFECTS
// =============================================================================

/**
 * Calculate aero effects at various speeds
 * 
 * @param {Object} aero - Aero parameters
 * @param {number} carWeightLbs - Car weight
 * @param {number[]} speeds - Array of speeds to calculate (mph)
 * @returns {Object[]} Effects at each speed
 */
export function calculateSpeedEffects(aero, carWeightLbs, speeds = [60, 80, 100, 120, 150]) {
  const { cd, clFront, clRear, frontalArea } = aero;
  
  return speeds.map(speed => {
    const dragForce = calculateDragForce(
      speed * MPH_TO_MS,
      cd,
      frontalArea * SQFT_TO_SQM
    );
    const dragPower = calculateDragPower(
      speed * MPH_TO_MS,
      cd,
      frontalArea * SQFT_TO_SQM
    );
    
    const balance = calculateAeroBalance(speed, clFront, clRear, frontalArea);
    const gripBenefit = calculateDownforceGripBenefit(
      balance.totalDownforceLbs,
      carWeightLbs
    );
    
    return {
      speedMph: speed,
      dragForceLbs: Math.round(dragForce / LB_TO_N),
      dragPowerHp: Math.round(dragPower / HP_TO_WATTS),
      downforceLbs: balance.totalDownforceLbs,
      frontDownforceLbs: balance.frontDownforceLbs,
      rearDownforceLbs: balance.rearDownforceLbs,
      balancePercent: balance.balancePercent,
      gripGainPercent: gripBenefit.gripGainPercent,
    };
  });
}

/**
 * Calculate critical cornering speeds with downforce
 * 
 * @param {Object} aero - Aero parameters
 * @param {number} carWeightLbs - Car weight
 * @param {number} baseGripG - Base grip in Gs
 * @param {number} cornerRadiusFt - Corner radius in feet
 * @returns {Object} Cornering speed comparison
 */
export function calculateCorneringSpeed(aero, carWeightLbs, baseGripG, cornerRadiusFt) {
  // v = sqrt(g * r * μ)
  // Where μ is the friction coefficient (proportional to grip in Gs)
  
  const g = 32.174; // ft/s²
  const baseSpeedFtS = Math.sqrt(g * cornerRadiusFt * baseGripG);
  const baseSpeedMph = baseSpeedFtS * 0.681818;
  
  // With downforce, grip increases at speed
  // Need to solve iteratively since downforce depends on speed
  let currentSpeed = baseSpeedMph;
  for (let i = 0; i < 10; i++) {
    const balance = calculateAeroBalance(currentSpeed, aero.clFront, aero.clRear, aero.frontalArea);
    const gripBenefit = calculateDownforceGripBenefit(balance.totalDownforceLbs, carWeightLbs, baseGripG);
    
    const newSpeedFtS = Math.sqrt(g * cornerRadiusFt * gripBenefit.newGripG);
    const newSpeedMph = newSpeedFtS * 0.681818;
    
    if (Math.abs(newSpeedMph - currentSpeed) < 0.1) break;
    currentSpeed = newSpeedMph;
  }
  
  return {
    baseCorneringSpeedMph: Math.round(baseSpeedMph),
    aeroCorneringSpeedMph: Math.round(currentSpeed),
    speedGainMph: Math.round(currentSpeed - baseSpeedMph),
    speedGainPercent: Math.round((currentSpeed / baseSpeedMph - 1) * 100),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  calculateDragForce,
  calculateDragPower,
  calculateTopSpeed,
  calculateAeroModEffect,
  calculateDownforce,
  calculateAeroBalance,
  calculateDownforceGripBenefit,
  applyAeroMods,
  calculateSpeedEffects,
  calculateCorneringSpeed,
  AERO_PROFILES,
  AERO_MODS,
};
