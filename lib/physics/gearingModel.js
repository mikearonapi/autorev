/**
 * Gearing & Acceleration Physics Model
 * 
 * Models the complete drivetrain from engine to wheels:
 * - Engine torque curves
 * - Gear ratios and final drive
 * - Optimal shift points
 * - Acceleration simulation through gears
 * - Launch and traction modeling
 */

// =============================================================================
// CONSTANTS
// =============================================================================

// Air density at sea level, 20°C (kg/m³)
const AIR_DENSITY_SEA_LEVEL = 1.204;

// Gravitational acceleration (m/s²)
const GRAVITY = 9.81;

// Conversion factors
const MPH_TO_MS = 0.44704;
const MS_TO_MPH = 2.23694;
const HP_TO_WATTS = 745.7;
const LB_TO_KG = 0.453592;
const FT_TO_M = 0.3048;
const IN_TO_M = 0.0254;

// =============================================================================
// ENGINE TORQUE MODELING
// =============================================================================

/**
 * Generate a realistic torque curve based on engine characteristics
 * 
 * @param {Object} engine - Engine parameters
 * @param {number} engine.peakHp - Peak horsepower
 * @param {number} engine.peakHpRpm - RPM at peak HP
 * @param {number} engine.peakTorque - Peak torque (lb-ft)
 * @param {number} engine.peakTorqueRpm - RPM at peak torque
 * @param {number} engine.redline - Redline RPM
 * @param {string} engine.aspiration - 'NA', 'Turbo', 'TwinTurbo', 'Supercharged'
 * @returns {Function} torqueAtRpm(rpm) - Returns torque in lb-ft
 */
export function generateTorqueCurve(engine) {
  const {
    peakHp,
    peakHpRpm,
    peakTorque,
    peakTorqueRpm,
    redline,
    aspiration = 'NA',
  } = engine;

  // Calculate torque at peak HP for curve shaping
  // HP = Torque × RPM / 5252
  const torqueAtPeakHp = (peakHp * 5252) / peakHpRpm;

  return function torqueAtRpm(rpm) {
    if (rpm <= 0) return 0;
    if (rpm > redline * 1.05) return 0; // Rev limiter

    // Different curve shapes based on aspiration
    if (aspiration === 'NA') {
      return naTorqueCurve(rpm, peakTorque, peakTorqueRpm, torqueAtPeakHp, peakHpRpm, redline);
    } else if (aspiration === 'Turbo' || aspiration === 'TwinTurbo') {
      return turboTorqueCurve(rpm, peakTorque, peakTorqueRpm, torqueAtPeakHp, peakHpRpm, redline);
    } else if (aspiration === 'Supercharged') {
      return scTorqueCurve(rpm, peakTorque, peakTorqueRpm, torqueAtPeakHp, peakHpRpm, redline);
    }

    return naTorqueCurve(rpm, peakTorque, peakTorqueRpm, torqueAtPeakHp, peakHpRpm, redline);
  };
}

/**
 * NA engine torque curve - peaks early/mid, gradual decline
 */
function naTorqueCurve(rpm, peakTorque, peakTorqueRpm, torqueAtPeakHp, peakHpRpm, redline) {
  const idleRpm = 800;
  
  if (rpm < idleRpm) {
    return peakTorque * 0.3 * (rpm / idleRpm);
  }
  
  if (rpm <= peakTorqueRpm) {
    // Rising portion - cubic rise
    const progress = (rpm - idleRpm) / (peakTorqueRpm - idleRpm);
    const startTorque = peakTorque * 0.5;
    return startTorque + (peakTorque - startTorque) * (3 * progress * progress - 2 * progress * progress * progress);
  }
  
  if (rpm <= peakHpRpm) {
    // Plateau/slight decline to peak HP
    const progress = (rpm - peakTorqueRpm) / (peakHpRpm - peakTorqueRpm);
    return peakTorque - (peakTorque - torqueAtPeakHp) * progress;
  }
  
  // Decline after peak HP
  const progress = (rpm - peakHpRpm) / (redline - peakHpRpm);
  const endTorque = torqueAtPeakHp * 0.75;
  return torqueAtPeakHp - (torqueAtPeakHp - endTorque) * progress;
}

/**
 * Turbo engine torque curve - builds boost, then flat plateau
 */
function turboTorqueCurve(rpm, peakTorque, peakTorqueRpm, torqueAtPeakHp, peakHpRpm, redline) {
  const idleRpm = 800;
  const boostThreshold = Math.min(2500, peakTorqueRpm * 0.6); // When boost comes on
  
  if (rpm < idleRpm) {
    return peakTorque * 0.2 * (rpm / idleRpm);
  }
  
  if (rpm < boostThreshold) {
    // Off-boost - low torque
    const progress = (rpm - idleRpm) / (boostThreshold - idleRpm);
    return peakTorque * 0.35 + peakTorque * 0.15 * progress;
  }
  
  if (rpm <= peakTorqueRpm) {
    // Building boost - rapid rise
    const progress = (rpm - boostThreshold) / (peakTorqueRpm - boostThreshold);
    const startTorque = peakTorque * 0.5;
    // Steep exponential rise simulating boost building
    return startTorque + (peakTorque - startTorque) * Math.pow(progress, 0.6);
  }
  
  if (rpm <= peakHpRpm) {
    // Flat torque plateau (turbo characteristic)
    const progress = (rpm - peakTorqueRpm) / (peakHpRpm - peakTorqueRpm);
    // Only slight decline
    return peakTorque - (peakTorque - torqueAtPeakHp) * progress * 0.3;
  }
  
  // Gradual decline after peak HP
  const progress = (rpm - peakHpRpm) / (redline - peakHpRpm);
  return torqueAtPeakHp - (torqueAtPeakHp - torqueAtPeakHp * 0.8) * progress;
}

/**
 * Supercharged torque curve - linear boost, instant response
 */
function scTorqueCurve(rpm, peakTorque, peakTorqueRpm, torqueAtPeakHp, peakHpRpm, redline) {
  const idleRpm = 800;
  
  if (rpm < idleRpm) {
    return peakTorque * 0.25 * (rpm / idleRpm);
  }
  
  if (rpm <= peakTorqueRpm) {
    // Linear rise - SC provides instant boost
    const progress = (rpm - idleRpm) / (peakTorqueRpm - idleRpm);
    const startTorque = peakTorque * 0.55;
    return startTorque + (peakTorque - startTorque) * progress;
  }
  
  if (rpm <= peakHpRpm) {
    // Slight decline - parasitic loss increases with RPM
    const progress = (rpm - peakTorqueRpm) / (peakHpRpm - peakTorqueRpm);
    return peakTorque - (peakTorque - torqueAtPeakHp) * progress;
  }
  
  // Steeper decline at high RPM (parasitic loss)
  const progress = (rpm - peakHpRpm) / (redline - peakHpRpm);
  return torqueAtPeakHp - (torqueAtPeakHp - torqueAtPeakHp * 0.7) * progress;
}

// =============================================================================
// GEAR RATIO CALCULATIONS
// =============================================================================

/**
 * Common transmission gear ratios by type
 */
export const COMMON_TRANSMISSIONS = {
  // Manual transmissions
  'tremec-t56': {
    name: 'Tremec T56',
    type: 'manual',
    gears: [2.66, 1.78, 1.30, 1.00, 0.74, 0.50],
    reverseRatio: 2.90,
  },
  'getrag-420g': {
    name: 'Getrag 420G (BMW)',
    type: 'manual',
    gears: [4.23, 2.52, 1.66, 1.22, 1.00, 0.83],
    reverseRatio: 3.68,
  },
  'cd009': {
    name: 'CD009 (Nissan 350Z/G35)',
    type: 'manual',
    gears: [3.79, 2.32, 1.62, 1.27, 1.00, 0.79],
    reverseRatio: 3.28,
  },
  'mt82': {
    name: 'MT82 (Mustang)',
    type: 'manual',
    gears: [3.66, 2.43, 1.69, 1.32, 1.00, 0.65],
    reverseRatio: 3.83,
  },
  'k-series-6mt': {
    name: 'K-Series 6MT (Honda)',
    type: 'manual',
    gears: [3.27, 2.13, 1.52, 1.15, 0.92, 0.74],
    reverseRatio: 3.58,
  },
  
  // Dual-clutch transmissions
  'pdk': {
    name: 'Porsche PDK',
    type: 'dct',
    gears: [3.91, 2.29, 1.58, 1.18, 0.94, 0.79, 0.62],
    reverseRatio: 3.55,
    shiftTime: 0.08, // seconds
  },
  'dsg-dq250': {
    name: 'VW DSG DQ250',
    type: 'dct',
    gears: [3.46, 1.97, 1.26, 0.87, 0.68, 0.59],
    reverseRatio: 3.99,
    shiftTime: 0.08,
  },
  'm-dct': {
    name: 'BMW M-DCT',
    type: 'dct',
    gears: [4.78, 3.15, 2.27, 1.68, 1.32, 1.07, 0.88],
    reverseRatio: 4.02,
    shiftTime: 0.10,
  },
  
  // Automatic transmissions
  'zf-8hp': {
    name: 'ZF 8HP',
    type: 'auto',
    gears: [4.71, 3.14, 2.10, 1.67, 1.29, 1.00, 0.84, 0.67],
    reverseRatio: 3.30,
    shiftTime: 0.20,
    torqueConverterMultiplier: 1.8, // At stall
  },
  '10r80': {
    name: 'Ford 10R80',
    type: 'auto',
    gears: [4.70, 2.99, 2.15, 1.77, 1.52, 1.28, 1.00, 0.85, 0.69, 0.64],
    reverseRatio: 4.87,
    shiftTime: 0.15,
    torqueConverterMultiplier: 1.7,
  },
};

/**
 * Calculate wheel torque for a given engine RPM and gear
 * 
 * @param {number} engineTorque - Engine torque in lb-ft
 * @param {number} gearRatio - Current gear ratio
 * @param {number} finalDrive - Final drive ratio
 * @param {number} drivetrainEfficiency - 0-1 efficiency factor
 * @returns {number} Wheel torque in lb-ft
 */
export function calculateWheelTorque(engineTorque, gearRatio, finalDrive, drivetrainEfficiency = 0.85) {
  return engineTorque * gearRatio * finalDrive * drivetrainEfficiency;
}

/**
 * Calculate vehicle speed for a given RPM and gear
 * 
 * @param {number} rpm - Engine RPM
 * @param {number} gearRatio - Current gear ratio
 * @param {number} finalDrive - Final drive ratio
 * @param {number} tireCircumference - Tire circumference in inches
 * @returns {number} Speed in MPH
 */
export function rpmToSpeed(rpm, gearRatio, finalDrive, tireCircumference) {
  // RPM → wheel RPM → distance per minute → MPH
  const wheelRpm = rpm / (gearRatio * finalDrive);
  const distancePerMinute = wheelRpm * (tireCircumference / 12); // feet per minute
  const mph = distancePerMinute * 60 / 5280;
  return mph;
}

/**
 * Calculate RPM for a given speed and gear
 * 
 * @param {number} mph - Speed in MPH
 * @param {number} gearRatio - Current gear ratio
 * @param {number} finalDrive - Final drive ratio
 * @param {number} tireCircumference - Tire circumference in inches
 * @returns {number} Engine RPM
 */
export function speedToRpm(mph, gearRatio, finalDrive, tireCircumference) {
  const feetPerMinute = mph * 5280 / 60;
  const wheelRpm = feetPerMinute / (tireCircumference / 12);
  const engineRpm = wheelRpm * gearRatio * finalDrive;
  return engineRpm;
}

/**
 * Calculate tire circumference from size
 * 
 * @param {number} width - Tire width in mm (e.g., 255)
 * @param {number} aspectRatio - Aspect ratio (e.g., 40)
 * @param {number} wheelDiameter - Wheel diameter in inches (e.g., 18)
 * @returns {number} Tire circumference in inches
 */
export function calculateTireCircumference(width, aspectRatio, wheelDiameter) {
  // Sidewall height in mm
  const sidewallHeight = width * (aspectRatio / 100);
  // Total diameter in inches
  const tireDiameter = wheelDiameter + (2 * sidewallHeight / 25.4);
  // Circumference
  return Math.PI * tireDiameter;
}

/**
 * Find optimal shift point between two gears
 * 
 * @param {Function} torqueCurve - torqueAtRpm function
 * @param {number} currentGearRatio - Current gear ratio
 * @param {number} nextGearRatio - Next gear ratio
 * @param {number} finalDrive - Final drive ratio
 * @param {number} redline - Engine redline RPM
 * @returns {Object} { shiftRpm, speedGain }
 */
export function findOptimalShiftPoint(torqueCurve, currentGearRatio, nextGearRatio, finalDrive, redline) {
  let bestShiftRpm = redline;
  let bestWheelTorqueAfterShift = 0;
  
  // Search from peak torque RPM to redline
  for (let rpm = 3000; rpm <= redline; rpm += 100) {
    // Calculate wheel torque in current gear
    const currentWheelTorque = torqueCurve(rpm) * currentGearRatio * finalDrive;
    
    // Calculate RPM after upshift
    const rpmAfterShift = rpm * (nextGearRatio / currentGearRatio);
    
    // Calculate wheel torque after shift
    const wheelTorqueAfterShift = torqueCurve(rpmAfterShift) * nextGearRatio * finalDrive;
    
    // Find the RPM where wheel torque after shift equals current wheel torque
    // (crossing point is optimal shift)
    if (wheelTorqueAfterShift >= currentWheelTorque && rpmAfterShift > 2000) {
      // We want to shift just before this point for maximum acceleration
      bestShiftRpm = rpm;
      bestWheelTorqueAfterShift = wheelTorqueAfterShift;
    }
  }
  
  // If no good crossing point found, shift at redline
  return {
    shiftRpm: Math.min(bestShiftRpm, redline),
    rpmAfterShift: bestShiftRpm * (nextGearRatio / currentGearRatio),
  };
}

// =============================================================================
// ACCELERATION SIMULATION
// =============================================================================

/**
 * Simulate acceleration run (0-60, 0-100, 1/4 mile)
 * 
 * @param {Object} vehicle - Vehicle parameters
 * @param {Object} options - Simulation options
 * @returns {Object} Simulation results
 */
export function simulateAcceleration(vehicle, options = {}) {
  const {
    weight, // curb weight in lbs
    hp,
    torque,
    peakHpRpm,
    peakTorqueRpm,
    redline,
    aspiration,
    gearRatios, // array of gear ratios
    finalDrive,
    tireWidth,
    tireAspect,
    wheelDiameter,
    dragCoefficient = 0.32,
    frontalArea = 22, // sq ft
    drivetrain = 'RWD',
    launchRpm = 3500,
  } = vehicle;

  const {
    targetSpeed = 150, // mph
    trackLength = 1320, // feet (1/4 mile)
    timeStep = 0.001, // seconds
    includeShiftTime = true,
    shiftTime = 0.3, // seconds for manual
  } = options;

  // Generate torque curve
  const torqueCurve = generateTorqueCurve({
    peakHp: hp,
    peakHpRpm: peakHpRpm || 6500,
    peakTorque: torque,
    peakTorqueRpm: peakTorqueRpm || 4500,
    redline: redline || 7000,
    aspiration,
  });

  // Calculate tire circumference
  const tireCirc = calculateTireCircumference(
    tireWidth || 255,
    tireAspect || 40,
    wheelDiameter || 18
  );

  // Drivetrain efficiency
  const drivetrainEff = {
    FWD: 0.88,
    RWD: 0.85,
    AWD: 0.80,
  }[drivetrain] || 0.85;

  // Convert weight to mass (kg)
  const mass = weight * LB_TO_KG;

  // Convert frontal area to m²
  const frontalAreaM2 = frontalArea * FT_TO_M * FT_TO_M;

  // Initialize simulation state
  let time = 0;
  let distance = 0; // feet
  let velocity = 0; // m/s
  let currentGear = 0;
  let rpm = launchRpm;
  let shifting = false;
  let shiftTimer = 0;

  // Results tracking
  const results = {
    zeroTo60: null,
    zeroTo100: null,
    quarterMile: null,
    quarterMileSpeed: null,
    eighthMile: null,
    eighthMileSpeed: null,
    topSpeedInGear: [],
    shiftPoints: [],
    timeHistory: [],
  };

  // Calculate optimal shift points for each gear
  const shiftPoints = [];
  for (let i = 0; i < gearRatios.length - 1; i++) {
    const optimal = findOptimalShiftPoint(
      torqueCurve,
      gearRatios[i],
      gearRatios[i + 1],
      finalDrive,
      redline
    );
    shiftPoints.push(optimal.shiftRpm);
  }
  shiftPoints.push(redline); // Last gear shifts at redline
  results.shiftPoints = shiftPoints;

  // Traction limit (simplified)
  const tractionLimit = calculateTractionLimit(weight, drivetrain);

  // Main simulation loop
  while (distance < trackLength && velocity * MS_TO_MPH < targetSpeed && time < 30) {
    // Handle shifting
    if (shifting) {
      shiftTimer -= timeStep;
      if (shiftTimer <= 0) {
        shifting = false;
        currentGear++;
        rpm = speedToRpm(velocity * MS_TO_MPH, gearRatios[currentGear], finalDrive, tireCirc);
      }
      time += timeStep;
      distance += velocity * timeStep * 3.28084; // m/s to ft/s
      continue;
    }

    // Calculate current RPM from speed
    rpm = speedToRpm(velocity * MS_TO_MPH, gearRatios[currentGear], finalDrive, tireCirc);

    // Check for upshift
    if (currentGear < gearRatios.length - 1 && rpm >= shiftPoints[currentGear]) {
      if (includeShiftTime) {
        shifting = true;
        shiftTimer = shiftTime;
      } else {
        currentGear++;
        rpm = speedToRpm(velocity * MS_TO_MPH, gearRatios[currentGear], finalDrive, tireCirc);
      }
      continue;
    }

    // Calculate engine torque at current RPM
    const engineTorque = torqueCurve(rpm);

    // Calculate wheel torque
    const wheelTorque = calculateWheelTorque(
      engineTorque,
      gearRatios[currentGear],
      finalDrive,
      drivetrainEff
    );

    // Calculate wheel force (convert lb-ft to N)
    const tireRadius = (tireCirc / Math.PI / 2) * IN_TO_M;
    let wheelForce = (wheelTorque * 1.3558) / tireRadius;

    // Apply traction limit
    wheelForce = Math.min(wheelForce, tractionLimit);

    // Calculate drag force
    const dragForce = 0.5 * AIR_DENSITY_SEA_LEVEL * dragCoefficient * frontalAreaM2 * velocity * velocity;

    // Calculate rolling resistance (simplified)
    const rollingResistance = mass * GRAVITY * 0.01;

    // Net force and acceleration
    const netForce = wheelForce - dragForce - rollingResistance;
    const acceleration = netForce / mass;

    // Update velocity and position
    velocity += acceleration * timeStep;
    distance += velocity * timeStep * 3.28084; // m to ft
    time += timeStep;

    // Record milestones
    const speedMph = velocity * MS_TO_MPH;

    if (!results.zeroTo60 && speedMph >= 60) {
      results.zeroTo60 = time;
    }
    if (!results.zeroTo100 && speedMph >= 100) {
      results.zeroTo100 = time;
    }
    if (!results.eighthMile && distance >= 660) {
      results.eighthMile = time;
      results.eighthMileSpeed = speedMph;
    }
    if (!results.quarterMile && distance >= 1320) {
      results.quarterMile = time;
      results.quarterMileSpeed = speedMph;
    }

    // Sample time history (every 0.1s)
    if (Math.floor(time * 10) > results.timeHistory.length) {
      results.timeHistory.push({
        time: Math.round(time * 1000) / 1000,
        speed: Math.round(speedMph * 10) / 10,
        distance: Math.round(distance),
        gear: currentGear + 1,
        rpm: Math.round(rpm),
      });
    }
  }

  // Calculate top speed in each gear
  for (let i = 0; i < gearRatios.length; i++) {
    const topSpeedRpm = Math.min(redline, shiftPoints[i]);
    results.topSpeedInGear.push(
      Math.round(rpmToSpeed(topSpeedRpm, gearRatios[i], finalDrive, tireCirc))
    );
  }

  return results;
}

/**
 * Calculate traction-limited force
 */
function calculateTractionLimit(weight, drivetrain) {
  const weightOnDriveWheels = {
    FWD: 0.60, // 60% front weight
    RWD: 0.55, // 55% rear weight (with transfer)
    AWD: 0.95, // Most weight available
  }[drivetrain] || 0.55;

  const frictionCoeff = 1.0; // Street tire on dry pavement

  // Force in Newtons
  const normalForce = weight * LB_TO_KG * GRAVITY * weightOnDriveWheels;
  return normalForce * frictionCoeff;
}

// =============================================================================
// UPGRADE EFFECTS ON GEARING
// =============================================================================

/**
 * Calculate effect of gear ratio changes
 */
export function calculateGearingChange(original, modified) {
  const changes = {
    accelerationChange: 0, // % change in 0-60
    topSpeedChange: 0, // % change in top speed
    cruisingRpmChange: 0, // RPM change at 70 mph
  };

  // Shorter gears = faster acceleration, lower top speed
  const ratioChange = modified.finalDrive / original.finalDrive;
  
  changes.accelerationChange = (ratioChange - 1) * 100 * 0.5; // ~50% correlation
  changes.topSpeedChange = (1 / ratioChange - 1) * 100;
  changes.cruisingRpmChange = (ratioChange - 1) * 2500; // Assuming 2500 RPM at 70

  return changes;
}

/**
 * Calculate effect of tire size change
 */
export function calculateTireSizeEffect(originalSize, newSize) {
  const originalCirc = calculateTireCircumference(
    originalSize.width,
    originalSize.aspect,
    originalSize.wheel
  );
  const newCirc = calculateTireCircumference(
    newSize.width,
    newSize.aspect,
    newSize.wheel
  );

  const sizeChange = newCirc / originalCirc;

  return {
    // Larger tire = lower RPM at speed = effectively taller gearing
    effectiveGearingChange: sizeChange,
    speedometerError: (sizeChange - 1) * 100, // % speedometer will read low
    rpmChange: (1 - sizeChange) * 100, // % RPM change at same speed
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

const gearingModel = {
  generateTorqueCurve,
  calculateWheelTorque,
  rpmToSpeed,
  speedToRpm,
  calculateTireCircumference,
  findOptimalShiftPoint,
  simulateAcceleration,
  calculateGearingChange,
  calculateTireSizeEffect,
  COMMON_TRANSMISSIONS,
};

export default gearingModel;
