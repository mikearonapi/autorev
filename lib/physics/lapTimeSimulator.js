/**
 * Lap Time Simulator
 * 
 * Estimates lap times by simulating a vehicle through a track,
 * using all physics models to calculate speed through each segment.
 * 
 * This is a simplified point-mass simulator suitable for lap time
 * comparison, not a full driving simulator.
 */

import * as gearing from './gearingModel.js';
import * as aero from './aerodynamicsModel.js';
import * as braking from './brakingModel.js';
import * as tires from './tireModel.js';

// =============================================================================
// TRACK DEFINITIONS
// =============================================================================

/**
 * Track segment types
 */
export const SEGMENT_TYPES = {
  STRAIGHT: 'straight',
  CORNER: 'corner',
  CHICANE: 'chicane',
  HAIRPIN: 'hairpin',
  SWEEPER: 'sweeper',
  KINK: 'kink',
  CREST: 'crest',
  BRAKING_ZONE: 'braking_zone',
};

/**
 * Sample track definitions
 * Each track is an array of segments with distance and characteristics
 */
export const TRACKS = {
  'laguna-seca': {
    name: 'Laguna Seca',
    country: 'USA',
    lengthMiles: 2.238,
    segments: [
      { type: 'straight', distance: 1800, description: 'Start/Finish Straight' },
      { type: 'corner', radius: 200, angle: 90, description: 'Turn 1' },
      { type: 'straight', distance: 400, description: 'Short straight' },
      { type: 'corner', radius: 150, angle: 120, description: 'Turn 2' },
      { type: 'straight', distance: 600, description: 'Uphill' },
      { type: 'corner', radius: 250, angle: 45, description: 'Turn 3' },
      { type: 'corner', radius: 200, angle: 60, description: 'Turn 4' },
      { type: 'straight', distance: 500, description: 'Before Turn 5' },
      { type: 'corner', radius: 180, angle: 90, description: 'Turn 5' },
      { type: 'straight', distance: 800, description: 'Before Corkscrew' },
      { type: 'chicane', radius: 100, description: 'Corkscrew' },
      { type: 'straight', distance: 400, description: 'After Corkscrew' },
      { type: 'corner', radius: 120, angle: 90, description: 'Turn 9' },
      { type: 'straight', distance: 600, description: 'Before Turn 10' },
      { type: 'corner', radius: 200, angle: 100, description: 'Turn 10' },
      { type: 'corner', radius: 250, angle: 70, description: 'Turn 11' },
    ],
    elevation_change_ft: 180,
  },
  
  'nurburgring-gp': {
    name: 'Nürburgring GP',
    country: 'Germany',
    lengthMiles: 3.199,
    segments: [
      { type: 'straight', distance: 2200, description: 'Start/Finish' },
      { type: 'corner', radius: 80, angle: 180, description: 'Turn 1 Hairpin' },
      { type: 'straight', distance: 500, description: 'Short straight' },
      { type: 'corner', radius: 300, angle: 90, description: 'Mercedes Arena entry' },
      { type: 'sweeper', radius: 200, angle: 120, description: 'Mercedes Arena' },
      { type: 'straight', distance: 800, description: 'Back straight section' },
      { type: 'corner', radius: 150, angle: 90, description: 'Turn 5' },
      { type: 'sweeper', radius: 180, angle: 100, description: 'Turn 6' },
      { type: 'straight', distance: 600, description: 'Mid section' },
      { type: 'corner', radius: 120, angle: 90, description: 'Turn 7' },
      { type: 'straight', distance: 1200, description: 'Long straight' },
      { type: 'chicane', radius: 80, description: 'Schumacher S' },
      { type: 'straight', distance: 400, description: 'After chicane' },
      { type: 'corner', radius: 200, angle: 90, description: 'Turn 10' },
      { type: 'sweeper', radius: 250, angle: 80, description: 'Turn 11' },
      { type: 'straight', distance: 500, description: 'Final straight' },
      { type: 'corner', radius: 150, angle: 90, description: 'Final turn' },
    ],
    elevation_change_ft: 60,
  },
  
  'spa-francorchamps': {
    name: 'Spa-Francorchamps',
    country: 'Belgium',
    lengthMiles: 4.352,
    segments: [
      { type: 'straight', distance: 800, description: 'Start' },
      { type: 'corner', radius: 100, angle: 180, description: 'La Source Hairpin' },
      { type: 'straight', distance: 3000, description: 'Kemmel Straight' },
      { type: 'corner', radius: 150, angle: 90, description: 'Les Combes 1' },
      { type: 'corner', radius: 120, angle: 80, description: 'Les Combes 2' },
      { type: 'straight', distance: 600, description: 'After Les Combes' },
      { type: 'sweeper', radius: 200, angle: 100, description: 'Malmedy' },
      { type: 'corner', radius: 250, angle: 60, description: 'Rivage' },
      { type: 'straight', distance: 500, description: 'To Pouhon' },
      { type: 'sweeper', radius: 180, angle: 140, description: 'Pouhon' },
      { type: 'straight', distance: 800, description: 'After Pouhon' },
      { type: 'corner', radius: 200, angle: 90, description: 'Fagnes' },
      { type: 'straight', distance: 600, description: 'To Stavelot' },
      { type: 'corner', radius: 100, angle: 120, description: 'Stavelot' },
      { type: 'straight', distance: 400, description: 'To Paul Frere' },
      { type: 'corner', radius: 250, angle: 80, description: 'Paul Frere' },
      { type: 'straight', distance: 1000, description: 'Blanchimont entry' },
      { type: 'sweeper', radius: 300, angle: 60, description: 'Blanchimont' },
      { type: 'chicane', radius: 60, description: 'Bus Stop Chicane' },
    ],
    elevation_change_ft: 340,
  },
  
  'autocross-standard': {
    name: 'Standard Autocross Course',
    country: 'USA',
    lengthMiles: 0.5,
    segments: [
      { type: 'straight', distance: 200, description: 'Launch' },
      { type: 'corner', radius: 80, angle: 90, description: 'Turn 1' },
      { type: 'straight', distance: 150, description: 'Short straight' },
      { type: 'corner', radius: 60, angle: 180, description: 'Hairpin' },
      { type: 'straight', distance: 100, description: 'Slalom entry' },
      { type: 'chicane', radius: 40, description: 'Slalom' },
      { type: 'straight', distance: 100, description: 'After slalom' },
      { type: 'corner', radius: 70, angle: 90, description: 'Turn 4' },
      { type: 'corner', radius: 100, angle: 120, description: 'Sweeper' },
      { type: 'straight', distance: 200, description: 'Final straight' },
    ],
    elevation_change_ft: 0,
  },
};

// =============================================================================
// CORNER SPEED CALCULATION
// =============================================================================

/**
 * Calculate maximum cornering speed
 * 
 * @param {number} radius - Corner radius in feet
 * @param {number} grip - Tire grip coefficient
 * @param {number} downforce - Downforce at current speed (iterative)
 * @param {number} weight - Vehicle weight
 * @returns {number} Maximum speed in MPH
 */
export function calculateCornerSpeed(radius, grip, downforce = 0, weight = 3500) {
  // v = sqrt(g × r × μ)
  // With downforce: effective μ increases with speed
  const g = 32.174; // ft/s²
  
  // Effective grip with downforce
  const effectiveWeight = weight + downforce;
  const effectiveGrip = grip * (effectiveWeight / weight);
  
  const speedFtS = Math.sqrt(g * radius * effectiveGrip);
  return speedFtS * 0.681818; // ft/s to mph
}

/**
 * Calculate corner speed with downforce iteration
 * Downforce depends on speed, speed depends on grip which includes downforce
 * 
 * @param {number} radius - Corner radius in feet
 * @param {Object} vehicle - Vehicle state with aero params
 * @param {number} grip - Base tire grip
 * @returns {Object} Corner speed and effective grip
 */
export function calculateCornerSpeedWithAero(radius, vehicle, grip) {
  const { weight, liftCoefficientFront, liftCoefficientRear, frontalArea } = vehicle;
  
  // Iterate to find equilibrium
  let speed = calculateCornerSpeed(radius, grip, 0, weight);
  
  for (let i = 0; i < 5; i++) {
    // Calculate downforce at this speed
    const balance = aero.calculateAeroBalance(
      speed,
      liftCoefficientFront,
      liftCoefficientRear,
      frontalArea
    );
    
    // Recalculate speed with downforce
    const newSpeed = calculateCornerSpeed(radius, grip, balance.totalDownforceLbs, weight);
    
    if (Math.abs(newSpeed - speed) < 0.1) break;
    speed = newSpeed;
  }
  
  return {
    speedMph: Math.round(speed * 10) / 10,
    effectiveGrip: grip * ((weight + aero.calculateDownforce(speed, (liftCoefficientFront + liftCoefficientRear) / 2, frontalArea)) / weight),
  };
}

// =============================================================================
// SEGMENT SIMULATION
// =============================================================================

/**
 * Simulate vehicle through a straight segment
 * 
 * @param {Object} vehicle - Vehicle state
 * @param {number} entrySpeed - Entry speed in MPH
 * @param {number} distance - Segment distance in feet
 * @param {number} exitSpeedLimit - Speed limit at exit (e.g., for upcoming corner)
 * @returns {Object} Segment time and exit speed
 */
export function simulateStraight(vehicle, entrySpeed, distance, exitSpeedLimit = 200) {
  const { weight, hp, dragCoefficient, frontalArea, drivetrain } = vehicle;
  
  // Simplified acceleration model
  const drivetrainEff = { FWD: 0.88, RWD: 0.85, AWD: 0.80 }[drivetrain] || 0.85;
  const wheelHp = hp * drivetrainEff;
  
  // Average acceleration through segment
  // P = F × v, F = m × a
  // a = P / (m × v)
  let currentSpeed = entrySpeed;
  let distanceTraveled = 0;
  let time = 0;
  const dt = 0.01; // 10ms time step
  
  while (distanceTraveled < distance && currentSpeed < exitSpeedLimit) {
    const speedMs = currentSpeed * 0.44704;
    const speedFtS = currentSpeed * 1.46667;
    
    // Power available (watts)
    const powerW = wheelHp * 745.7;
    
    // Drag force
    const dragForceN = 0.5 * 1.2 * dragCoefficient * (frontalArea * 0.0929) * speedMs * speedMs;
    const dragForceLb = dragForceN * 0.2248;
    
    // Net force and acceleration
    const driveForce = speedMs > 0 ? (powerW / speedMs) * 0.2248 : wheelHp * 10; // lb
    const netForce = driveForce - dragForceLb;
    const mass = weight / 32.174; // slugs
    const acceleration = netForce / mass; // ft/s²
    
    // Update speed and distance
    currentSpeed += (acceleration / 1.46667) * dt; // mph
    distanceTraveled += speedFtS * dt;
    time += dt;
    
    // Check if we need to start braking
    const brakingDistance = calculateBrakingDistance(currentSpeed, exitSpeedLimit, vehicle);
    if (distanceTraveled + brakingDistance >= distance) {
      break;
    }
    
    // Safety limit
    if (time > 60) break;
  }
  
  // If we need to brake to hit exit speed
  if (currentSpeed > exitSpeedLimit) {
    const brakingResult = simulateBraking(vehicle, currentSpeed, exitSpeedLimit);
    time += brakingResult.time;
    distanceTraveled += brakingResult.distance;
    currentSpeed = exitSpeedLimit;
  }
  
  return {
    time: Math.round(time * 1000) / 1000,
    exitSpeed: Math.round(currentSpeed * 10) / 10,
    maxSpeed: Math.round(currentSpeed * 10) / 10,
    distanceTraveled: Math.round(distanceTraveled),
  };
}

/**
 * Calculate braking distance
 */
function calculateBrakingDistance(fromSpeed, toSpeed, vehicle) {
  if (fromSpeed <= toSpeed) return 0;
  
  const grip = vehicle.tireGrip || 1.0;
  const decelG = Math.min(grip * 0.95, 1.3); // Limited by tires
  
  // d = (v1² - v2²) / (2 × a)
  const v1 = fromSpeed * 1.46667; // ft/s
  const v2 = toSpeed * 1.46667;
  const a = decelG * 32.174;
  
  return (v1 * v1 - v2 * v2) / (2 * a);
}

/**
 * Simulate braking
 */
function simulateBraking(vehicle, fromSpeed, toSpeed) {
  if (fromSpeed <= toSpeed) return { time: 0, distance: 0 };
  
  const grip = vehicle.tireGrip || 1.0;
  const decelG = Math.min(grip * 0.95, 1.3);
  
  const v1 = fromSpeed * 1.46667;
  const v2 = toSpeed * 1.46667;
  const a = decelG * 32.174;
  
  const distance = (v1 * v1 - v2 * v2) / (2 * a);
  const time = (v1 - v2) / a;
  
  return {
    time: Math.round(time * 1000) / 1000,
    distance: Math.round(distance),
  };
}

/**
 * Simulate vehicle through a corner segment
 * 
 * @param {Object} vehicle - Vehicle state
 * @param {number} entrySpeed - Entry speed in MPH
 * @param {number} radius - Corner radius in feet
 * @param {number} angle - Corner angle in degrees
 * @returns {Object} Segment time and exit speed
 */
export function simulateCorner(vehicle, entrySpeed, radius, angle) {
  const grip = vehicle.tireGrip || 1.0;
  
  // Maximum corner speed
  const maxCornerSpeed = calculateCornerSpeedWithAero(radius, vehicle, grip);
  
  // Slow to corner speed if needed
  const cornerEntrySpeed = Math.min(entrySpeed, maxCornerSpeed.speedMph);
  
  // Distance through corner
  const arcLength = (angle / 360) * 2 * Math.PI * radius;
  
  // Time at constant corner speed
  const cornerSpeedFtS = cornerEntrySpeed * 1.46667;
  const cornerTime = arcLength / cornerSpeedFtS;
  
  // Braking time if needed
  let brakingTime = 0;
  if (entrySpeed > cornerEntrySpeed) {
    const brakingResult = simulateBraking(vehicle, entrySpeed, cornerEntrySpeed);
    brakingTime = brakingResult.time;
  }
  
  return {
    time: Math.round((cornerTime + brakingTime) * 1000) / 1000,
    exitSpeed: Math.round(cornerEntrySpeed * 10) / 10,
    maxCornerSpeed: maxCornerSpeed.speedMph,
    lateralG: grip,
    arcLength: Math.round(arcLength),
  };
}

// =============================================================================
// FULL LAP SIMULATION
// =============================================================================

/**
 * Simulate a complete lap
 * 
 * @param {Object} vehicle - Vehicle state
 * @param {string|Object} track - Track key or track definition
 * @returns {Object} Lap time and segment breakdown
 */
export function simulateLap(vehicle, track) {
  // Get track definition
  const trackDef = typeof track === 'string' ? TRACKS[track] : track;
  if (!trackDef) {
    throw new Error(`Unknown track: ${track}`);
  }
  
  // Ensure vehicle has tire grip
  if (!vehicle.tireGrip) {
    const compound = tires.TIRE_COMPOUNDS[vehicle.tireCompound] || tires.TIRE_COMPOUNDS['summer-sport'];
    vehicle.tireGrip = compound.peakGrip;
  }
  
  const segments = trackDef.segments;
  let currentSpeed = 50; // Starting grid speed
  let totalTime = 0;
  const segmentResults = [];
  
  // First pass: calculate corner speeds to know exit requirements
  const cornerSpeeds = segments.map(seg => {
    if (seg.type === 'corner' || seg.type === 'sweeper' || seg.type === 'hairpin') {
      const radius = seg.radius || (seg.type === 'hairpin' ? 50 : 150);
      return calculateCornerSpeedWithAero(radius, vehicle, vehicle.tireGrip).speedMph;
    }
    if (seg.type === 'chicane') {
      const radius = seg.radius || 60;
      return calculateCornerSpeedWithAero(radius, vehicle, vehicle.tireGrip).speedMph * 0.85;
    }
    if (seg.type === 'kink') {
      return 999; // High speed, minimal impact
    }
    return 999; // Straight - no limit
  });
  
  // Second pass: simulate each segment
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const nextCornerSpeed = cornerSpeeds[(i + 1) % segments.length];
    
    let result;
    
    switch (segment.type) {
      case 'straight':
        result = simulateStraight(vehicle, currentSpeed, segment.distance, nextCornerSpeed);
        break;
        
      case 'corner':
      case 'sweeper':
        result = simulateCorner(
          vehicle,
          currentSpeed,
          segment.radius || 150,
          segment.angle || 90
        );
        break;
        
      case 'hairpin':
        result = simulateCorner(
          vehicle,
          currentSpeed,
          segment.radius || 50,
          segment.angle || 180
        );
        break;
        
      case 'chicane':
        // Chicane is like two quick corners
        const chicaneResult1 = simulateCorner(vehicle, currentSpeed, segment.radius || 60, 45);
        const chicaneResult2 = simulateCorner(vehicle, chicaneResult1.exitSpeed, segment.radius || 60, 45);
        result = {
          time: chicaneResult1.time + chicaneResult2.time,
          exitSpeed: chicaneResult2.exitSpeed,
          description: 'chicane',
        };
        break;
        
      case 'kink':
        // High-speed kink - slight lift
        result = {
          time: 0.5,
          exitSpeed: currentSpeed * 0.98,
        };
        break;
        
      default:
        // Default to straight behavior
        result = simulateStraight(vehicle, currentSpeed, segment.distance || 500, nextCornerSpeed);
    }
    
    totalTime += result.time;
    currentSpeed = result.exitSpeed;
    
    segmentResults.push({
      segment: i + 1,
      type: segment.type,
      description: segment.description,
      time: result.time,
      exitSpeed: result.exitSpeed,
      maxSpeed: result.maxSpeed,
      lateralG: result.lateralG,
    });
  }
  
  // Format lap time
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;
  const lapTimeFormatted = `${minutes}:${seconds.toFixed(3).padStart(6, '0')}`;
  
  return {
    track: trackDef.name,
    lapTimeSeconds: Math.round(totalTime * 1000) / 1000,
    lapTimeFormatted,
    averageSpeedMph: Math.round((trackDef.lengthMiles * 3600) / totalTime),
    segments: segmentResults,
    vehicle: {
      name: vehicle.name,
      hp: vehicle.hp,
      weight: vehicle.weight,
      grip: vehicle.tireGrip,
    },
  };
}

/**
 * Compare lap times between configurations
 * 
 * @param {Object} baseline - Baseline vehicle
 * @param {Object} modified - Modified vehicle
 * @param {string} track - Track key
 * @returns {Object} Lap time comparison
 */
export function compareLapTimes(baseline, modified, track) {
  const baseLap = simulateLap(baseline, track);
  const modLap = simulateLap(modified, track);
  
  const delta = modLap.lapTimeSeconds - baseLap.lapTimeSeconds;
  
  return {
    track: baseLap.track,
    baseline: {
      lapTime: baseLap.lapTimeFormatted,
      seconds: baseLap.lapTimeSeconds,
    },
    modified: {
      lapTime: modLap.lapTimeFormatted,
      seconds: modLap.lapTimeSeconds,
    },
    delta: {
      seconds: Math.round(delta * 1000) / 1000,
      percent: Math.round((delta / baseLap.lapTimeSeconds) * 10000) / 100,
      faster: delta < 0,
    },
    segmentComparison: baseLap.segments.map((baseSeg, i) => ({
      segment: baseSeg.description,
      baseTime: baseSeg.time,
      modTime: modLap.segments[i].time,
      delta: Math.round((modLap.segments[i].time - baseSeg.time) * 1000) / 1000,
    })),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  calculateCornerSpeed,
  calculateCornerSpeedWithAero,
  simulateStraight,
  simulateCorner,
  simulateLap,
  compareLapTimes,
  TRACKS,
  SEGMENT_TYPES,
};
