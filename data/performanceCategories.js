/**
 * AutoRev - Performance HUB Categories
 * 
 * This file defines the 7 core performance categories used in the Performance HUB.
 * Each category blends hard metrics with experience-based scoring to give users
 * a Gran Turismo–style view of their car's capabilities and upgrade potential.
 * 
 * Categories are designed to:
 * 1. Be memorable and intuitive
 * 2. Map to real-world driving experiences
 * 3. Show clear improvement paths through upgrades
 */

/**
 * @typedef {Object} PerformanceCategory
 * @property {string} key - Unique identifier for the category
 * @property {string} label - Display label
 * @property {string} shortLabel - Abbreviated label for compact displays
 * @property {string} description - Full description of what the category measures
 * @property {string} icon - Icon identifier for UI (matches Icons component)
 * @property {string[]} hardMetrics - Real metrics that feed into this score
 * @property {string[]} experienceFactors - Subjective factors considered
 * @property {Object} scoreGuide - What each score range means
 */

/**
 * The 7 core Performance HUB categories
 * @type {PerformanceCategory[]}
 */
export const performanceCategories = [
  {
    key: 'powerAccel',
    label: 'Power & Acceleration',
    shortLabel: 'Power',
    description: 'Straight-line speed, throttle response, and passing power',
    icon: 'tachometer',
    hardMetrics: ['hp', 'torque', 'zeroToSixty', 'quarterMile', 'powerToWeight'],
    experienceFactors: ['In-gear pull', 'Throttle response', 'Power delivery character'],
    scoreGuide: {
      '1-3': 'Modest power, adequate for street use',
      '4-5': 'Solid performance, fun acceleration',
      '6-7': 'Strong power, confident passing ability',
      '8-9': 'Serious power, track-ready acceleration',
      '10': 'Exceptional power, supercar-level thrust'
    },
    color: 'var(--perf-power)',
  },
  {
    key: 'gripCornering',
    label: 'Grip & Cornering',
    shortLabel: 'Grip',
    description: 'Cornering confidence, mechanical grip, and chassis balance',
    icon: 'tire',
    hardMetrics: ['lateralG', 'curbWeight', 'tireWidth', 'suspensionType'],
    experienceFactors: ['Turn-in response', 'Mid-corner balance', 'Confidence at limit', 'Tire grip feel'],
    scoreGuide: {
      '1-3': 'Basic handling, body roll present',
      '4-5': 'Competent grip, enjoyable cornering',
      '6-7': 'Strong grip, communicative chassis',
      '8-9': 'Excellent grip, track-ready handling',
      '10': 'Exceptional grip, race car levels of mechanical grip'
    },
    color: 'var(--perf-grip)',
  },
  {
    key: 'braking',
    label: 'Braking',
    shortLabel: 'Brakes',
    description: 'Stopping power, pedal feel, and fade resistance',
    icon: 'brake',
    hardMetrics: ['braking60To0', 'brakeSize', 'brakeType'],
    experienceFactors: ['Pedal feel', 'Initial bite', 'Fade resistance', 'ABS calibration'],
    scoreGuide: {
      '1-3': 'Adequate braking, some fade under hard use',
      '4-5': 'Good braking, reliable under spirited driving',
      '6-7': 'Strong braking, track-capable',
      '8-9': 'Excellent braking, minimal fade, great feel',
      '10': 'Race-grade braking, exceptional stopping power and feel'
    },
    color: 'var(--perf-braking)',
  },
  {
    key: 'trackPace',
    label: 'Track Pace',
    shortLabel: 'Track',
    description: 'Overall lap time capability and sustained performance',
    icon: 'flag',
    hardMetrics: ['lapTimeEstimate', 'coolingCapacity', 'aeroDownforce'],
    experienceFactors: ['Consistency over laps', 'Heat management', 'Driver confidence', 'Setup flexibility'],
    scoreGuide: {
      '1-3': 'Street-focused, not ideal for track use',
      '4-5': 'Track day capable with limitations',
      '6-7': 'Solid track performer, competitive in class',
      '8-9': 'Serious track weapon, time attack ready',
      '10': 'Race-bred performance, professional-level pace'
    },
    color: 'var(--perf-track)',
  },
  {
    key: 'drivability',
    label: 'Drivability & Comfort',
    shortLabel: 'Comfort',
    description: 'Daily usability, ride quality, and driver fatigue',
    icon: 'comfort',
    hardMetrics: ['rideHeight', 'suspensionTravel', 'nvhLevels'],
    experienceFactors: ['Ride quality', 'Noise levels', 'Ease of use', 'Visibility', 'Ergonomics'],
    scoreGuide: {
      '1-3': 'Track-focused, harsh for daily use',
      '4-5': 'Sporty but livable, some compromises',
      '6-7': 'Good daily driver, comfortable for long trips',
      '8-9': 'Excellent comfort, GT-level refinement',
      '10': 'Luxury-level comfort with sports car capability'
    },
    color: 'var(--perf-comfort)',
  },
  {
    key: 'reliabilityHeat',
    label: 'Reliability & Heat Management',
    shortLabel: 'Reliability',
    description: 'Dependability under stress, thermal performance, and longevity',
    icon: 'thermometer',
    hardMetrics: ['oilCoolerSize', 'radiatorCapacity', 'transCooling'],
    experienceFactors: ['Track session durability', 'Consumable life', 'Known issues', 'Maintenance costs'],
    scoreGuide: {
      '1-3': 'Requires careful monitoring, known weak points',
      '4-5': 'Decent reliability, some track limitations',
      '6-7': 'Good reliability, handles track days well',
      '8-9': 'Excellent reliability, robust under stress',
      '10': 'Bulletproof, race-ready thermal management'
    },
    color: 'var(--perf-reliability)',
  },
  {
    key: 'soundEmotion',
    label: 'Sound & Emotion',
    shortLabel: 'Sound',
    description: 'Exhaust character, engine note, and emotional engagement',
    icon: 'sound',
    hardMetrics: ['exhaustType', 'engineConfig', 'inductionType'],
    experienceFactors: ['Exhaust note character', 'Intake sound', 'Throttle blips', 'Overall drama'],
    scoreGuide: {
      '1-3': 'Quiet, refined, not emotionally engaging',
      '4-5': 'Pleasant sound, some character',
      '6-7': 'Good sound, enjoyable exhaust note',
      '8-9': 'Excellent sound, makes you smile',
      '10': 'Spine-tingling, concert-hall exhaust experience'
    },
    color: 'var(--perf-sound)',
  }
];

/**
 * Upgrade package tiers and their intended use cases
 * @type {Object}
 */
export const upgradeTiers = {
  stock: {
    key: 'stock',
    label: 'Stock',
    shortLabel: 'Stock',
    description: 'Factory configuration',
    intendedUse: 'As delivered from the factory',
    priceRange: null,
    color: 'var(--color-gray-400)',
  },
  streetSport: {
    key: 'streetSport',
    label: 'Street Sport',
    shortLabel: 'Street',
    description: 'Enhanced street performance with improved daily drivability',
    intendedUse: 'Spirited street driving, occasional canyon runs',
    priceRange: '$2,000 - $8,000',
    color: 'var(--sn-primary)',
  },
  trackPack: {
    key: 'trackPack',
    label: 'Track Pack',
    shortLabel: 'Track',
    description: 'Serious track capability while maintaining street legality',
    intendedUse: 'Regular track days, HPDE events, time attack',
    priceRange: '$8,000 - $20,000',
    color: 'var(--sn-accent)',
  },
  timeAttack: {
    key: 'timeAttack',
    label: 'Time Attack',
    shortLabel: 'Attack',
    description: 'Maximum performance, some street compromises',
    intendedUse: 'Competitive time attack, dedicated track car',
    priceRange: '$20,000 - $50,000+',
    color: 'var(--color-error)',
  }
};

/**
 * Upgrade module categories (for fine-tuning)
 * Now expanded to include all categories from the unified upgrade taxonomy
 * @type {Object[]}
 */
export const upgradeModuleCategories = [
  {
    key: 'power',
    label: 'Power & Engine',
    description: 'Intake, exhaust, tune, headers',
    icon: 'bolt',
  },
  {
    key: 'forcedInduction',
    label: 'Forced Induction',
    description: 'Superchargers, turbos, intercoolers',
    icon: 'turbo',
  },
  {
    key: 'exhaust',
    label: 'Exhaust & Sound',
    description: 'Cat-backs, headers, mufflers',
    icon: 'sound',
  },
  {
    key: 'suspension',
    label: 'Suspension',
    description: 'Coilovers, springs, sway bars',
    icon: 'car',
  },
  {
    key: 'brakes',
    label: 'Brakes',
    description: 'Pads, rotors, BBK, fluid',
    icon: 'brake',
  },
  {
    key: 'wheels',
    label: 'Wheels & Tires',
    description: 'Lightweight wheels, track tires',
    icon: 'tire',
  },
  {
    key: 'cooling',
    label: 'Cooling',
    description: 'Oil coolers, radiators, ducting',
    icon: 'thermometer',
  },
  {
    key: 'aero',
    label: 'Aerodynamics',
    description: 'Splitters, wings, diffusers',
    icon: 'wind',
  },
  {
    key: 'drivetrain',
    label: 'Drivetrain',
    description: 'Clutch, flywheel, LSD, axles',
    icon: 'gears',
  },
  {
    key: 'safety',
    label: 'Safety & Track Prep',
    description: 'Harnesses, seats, roll bars',
    icon: 'shield',
  },
  {
    key: 'weightReduction',
    label: 'Weight Reduction',
    description: 'Carbon panels, battery, interior',
    icon: 'feather',
  },
  {
    key: 'engineSwaps',
    label: 'Engine Swaps',
    description: 'LS, Coyote, 2JZ, K-series',
    icon: 'engine',
  },
];

/**
 * Get a performance category by key
 * @param {string} key
 * @returns {PerformanceCategory|undefined}
 */
export function getCategoryByKey(key) {
  return performanceCategories.find(cat => cat.key === key);
}

/**
 * Get default stock performance scores for a car based on its existing scores
 * Maps the existing advisory scores to the new performance categories using hard metrics when available
 * Prioritizes expert-curated scores (perf*) when present, falls back to calculated scores
 * @param {Object} car - Car object from carData
 * @returns {Object} - Performance scores for each category
 */
export function mapCarToPerformanceScores(car) {
  // ALWAYS calculate from hard metrics using the new upgrade-headroom calibration
  // This ensures consistent scoring across all cars and leaves room for upgrades
  // The old perfXXX scores were calibrated to give 9-10 to stock cars, which doesn't
  // leave room for upgrades to show meaningful improvement.
  
  // Sound scoring - cap at 8.5 to leave room for exhaust upgrades (+1-2 points)
  // Cars with already great exhaust notes (9+) get capped at 8.5
  // Cars with lower sound scores keep their actual value
  const rawSound = car.sound || 5;
  const soundScore = Math.min(8.5, rawSound);
  
  return {
    powerAccel: calculatePowerScore(car),
    gripCornering: calculateGripScore(car),
    braking: calculateBrakingScore(car),
    trackPace: calculateTrackPaceScore(car),
    drivability: calculateDrivabilityScore(car),
    reliabilityHeat: Math.min(7.5, car.reliability ?? 5), // Cap at 7.5, cooling mods improve
    soundEmotion: soundScore,
  };
}

/**
 * Calculate power score from available hard metrics
 * 
 * SCORING PHILOSOPHY (leaving headroom for upgrades):
 * - 10 = Maximum modified (1000+ HP, supercharged/turbo builds)
 * - 9 = Heavily modified (800-1000 HP)
 * - 8 = Moderately modified or exceptional stock (700-800 HP)
 * - 7 = Light mods or strong stock (550-700 HP, sub-3.5s 0-60)
 * - 6 = Good sports car stock (400-550 HP, 3.5-4.0s 0-60)
 * - 5 = Entry sports car (300-400 HP, 4.0-5.0s 0-60)
 * - 4 = Hot hatch (200-300 HP, 5.0-6.0s 0-60)
 * 
 * Stock cars should generally score 5-7.5, reserving 8-10 for modified builds.
 */
function calculatePowerScore(car) {
  let score = 5; // default
  
  // Primary: Use 0-60 time if available (measures actual acceleration)
  if (car.zeroToSixty) {
    // New calibration leaving headroom for upgrades:
    // 2.5s = 7.5 (stock supercar, upgradeable to 9+)
    // 3.0s = 7.0
    // 3.5s = 6.5
    // 4.0s = 6.0
    // 4.5s = 5.5
    // 5.0s = 5.0
    // 6.0s = 4.0
    score = 10 - (car.zeroToSixty * 1.0);
  }
  // Secondary: Use power-to-weight if no 0-60 available
  else if (car.hp && car.curbWeight) {
    const powerToWeight = car.hp / (car.curbWeight / 1000);
    // Scale: 150 hp/ton = 4, 200 = 5, 250 = 6, 300 = 7, 350 = 7.5
    score = 2 + (powerToWeight / 60);
  }
  // Fallback: Use advisory scores
  else {
    score = Math.round((car.track + car.driverFun) / 2) || 5;
  }
  
  // Small HP adjustment for perceived power (smaller than before to not overshoot)
  // High HP cars feel powerful even with slower 0-60 (heavy muscle cars)
  if (car.hp) {
    if (car.hp >= 700) score += 0.5;      // Exceptional (GT500, ZL1)
    else if (car.hp >= 600) score += 0.3; // Strong (Viper, GT-R)
    else if (car.hp >= 500) score += 0.2; // Good (M4, Camaro SS)
  }
  
  // Cap stock cars at 8.0 - reserve 8.5-10 for modified builds
  const stockCap = 8.0;
  score = Math.min(score, stockCap);
  
  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
}

/**
 * Calculate grip score from available hard metrics
 * 
 * SCORING PHILOSOPHY (leaving headroom for upgrades):
 * - 10 = Maximum (1.35g+ with slicks and aero)
 * - 9 = Track slicks (1.25-1.35g)
 * - 8 = R-compound tires + coilovers (1.18-1.25g)
 * - 7 = Good street tires + suspension mods (1.10-1.18g)
 * - 6.5 = Premium stock sports car (1.05-1.10g)
 * - 6 = Good stock sports car (1.00-1.05g)
 * - 5.5 = Average sports car (0.95-1.00g)
 * - 5 = Entry sports car (0.90-0.95g)
 * 
 * Stock cars on street tires should score 5-7.5, reserving 8-10 for track setups.
 */
function calculateGripScore(car) {
  // Primary: Use lateral G if available (direct measurement of grip)
  if (car.lateralG) {
    // New calibration with headroom for track tires/suspension:
    // 0.90g = 5.0 (baseline)
    // 0.95g = 5.5
    // 1.00g = 6.0
    // 1.05g = 6.5
    // 1.10g = 7.0
    // 1.15g = 7.5
    // 1.20g = 8.0 (R-compound territory)
    // 1.30g = 9.0 (slicks)
    // 1.40g = 10.0 (full aero + slicks)
    const score = 4 + ((car.lateralG - 0.85) * 12);
    
    // Cap stock street cars at 7.5 - reserve 8-10 for track setups
    const stockCap = 7.5;
    return Math.max(1, Math.min(stockCap, Math.round(score * 10) / 10));
  }
  
  // Fallback: Use track score with chassis type modifier
  let base = car.track || 5;
  
  // Mid-engine cars typically have better weight distribution
  if (car.category === 'Mid-Engine') base = Math.min(7.5, base + 0.3);
  // Rear-engine premium cars have excellent grip when engineered properly
  else if (car.category === 'Rear-Engine' && car.tier === 'premium') base = Math.min(7.5, base + 0.2);
  
  return Math.round(base * 10) / 10;
}

/**
 * Calculate braking score from available hard metrics
 * 
 * SCORING PHILOSOPHY (leaving headroom for upgrades):
 * - 10 = Full race setup (carbon ceramics, slicks, <80ft)
 * - 9 = Big brake kit + track pads + R-compound (80-85ft)
 * - 8 = Big brake kit + track pads (85-90ft)
 * - 7.5 = Upgraded pads + good rotors (90-93ft)
 * - 7 = Stock premium brakes (93-97ft)
 * - 6.5 = Good stock brakes (97-102ft)
 * - 6 = Average stock brakes (102-108ft)
 * - 5.5 = Entry level (108-115ft)
 * 
 * Stock cars should score 5.5-7.5, reserving 8-10 for BBK and track setups.
 */
function calculateBrakingScore(car) {
  // Primary: Use 60-0 braking distance if available
  if (car.braking60To0) {
    // New calibration with headroom for brake upgrades:
    // 80ft = 9.4 (BBK + track pads + R-compound)
    // 85ft = 8.8
    // 90ft = 8.2
    // 95ft = 7.6
    // 100ft = 7.0
    // 105ft = 6.4
    // 110ft = 5.8
    // 115ft = 5.2
    const score = 19 - (car.braking60To0 * 0.12);
    
    // Cap stock cars at 7.5 - reserve 8-10 for BBK and track pads
    const stockCap = 7.5;
    return Math.max(1, Math.min(stockCap, Math.round(score * 10) / 10));
  }
  
  // Fallback: Use track score with tier modifier
  let base = car.track || 5;
  
  // Premium and track-focused cars typically have better brakes
  if (car.tier === 'premium') base = Math.min(7.5, base + 0.5);
  else if (car.tier === 'upper-mid') base = Math.min(7.5, base + 0.3);
  
  return Math.round(base * 10) / 10;
}

/**
 * Calculate track pace score
 * 
 * SCORING PHILOSOPHY (leaving headroom for upgrades):
 * - 10 = Full race build (aero, slicks, weight reduction, tuned suspension)
 * - 9 = Time attack build (coilovers, R-compounds, bolt-ons)
 * - 8 = Track pack car (upgraded suspension, track pads, good tires)
 * - 7-7.5 = Track-ready stock sports car (GT4, Z06, GT350)
 * - 6-6.5 = Good sports car on track (M4, Camaro SS)
 * - 5-5.5 = Average sports car on track
 * 
 * Stock cars should score 5-7.5, reserving 8-10 for track-built cars.
 */
function calculateTrackPaceScore(car) {
  // Calculate from component scores (power, grip, braking)
  // Weight grip and braking higher for track relevance
  const powerScore = calculatePowerScore(car);
  const gripScore = calculateGripScore(car);
  const brakingScore = calculateBrakingScore(car);
  
  // Weighted average: grip and braking matter more on track
  let score = (powerScore * 0.3) + (gripScore * 0.35) + (brakingScore * 0.35);
  
  // Boost for track-focused variants (GT4, Z06, GT350R, ACR, etc.)
  if (car.name && (
    car.name.includes('GT4') || 
    car.name.includes('GT3') || 
    car.name.includes('Z06') || 
    car.name.includes('GT350') ||
    car.name.includes('ACR') ||
    car.name.includes('Track') ||
    car.name.includes('1LE')
  )) {
    score += 0.5;
  }
  
  // Cap stock cars at 8.0 - reserve 8.5-10 for modified track builds
  const stockCap = 8.0;
  return Math.max(1, Math.min(stockCap, Math.round(score * 10) / 10));
}

/**
 * Calculate drivability score
 * 
 * SCORING PHILOSOPHY:
 * Drivability is INVERSELY affected by track upgrades (stiffer = less comfortable)
 * Stock scores should be accurate - mods typically DECREASE this score
 * No cap needed since this score goes DOWN with performance mods, not up
 * 
 * - 10 = Luxury GT, daily driver comfort
 * - 8-9 = Premium sports car with good daily usability
 * - 6-7 = Track-capable car with some street compromise
 * - 4-5 = Hardcore track car, rough daily
 * - 2-3 = Race car with plates
 */
function calculateDrivabilityScore(car) {
  // Calculate from car characteristics - don't use old manual scores
  const interiorScore = car.interior || 5;
  const reliabilityScore = car.reliability || 5;
  const trackScore = car.track || 5;
  
  // Base: Interior quality is the strongest indicator of daily comfort
  let base = interiorScore;
  
  // Premium tiers typically have better daily usability (adaptive dampers, quieter)
  if (car.tier === 'premium') base = Math.min(10, base + 0.5);
  else if (car.tier === 'upper-mid') base = Math.min(10, base + 0.3);
  
  // Track-focused variants sacrifice comfort (track suspensions are stiff)
  // GT4, GT3, Z06, ACR, etc. are designed for track, not comfort
  if (car.name && (
    car.name.includes('GT4') || 
    car.name.includes('GT3') || 
    car.name.includes('Z06') || 
    car.name.includes('ACR') ||
    car.name.includes('1LE') ||
    car.name.includes('Track')
  )) {
    base -= 1.5;
  } else if (trackScore >= 9) {
    base -= 1.0;
  } else if (trackScore >= 8) {
    base -= 0.5;
  }
  
  // Reliability contributes to drivability (fewer worries on daily drives)
  base = (base * 0.7) + (reliabilityScore * 0.3);
  
  return Math.max(1, Math.min(10, Math.round(base * 10) / 10));
}

/**
 * Score labels for display
 */
export const scoreLabelMap = {
  1: 'Poor',
  2: 'Poor',
  3: 'Below Average',
  4: 'Average',
  5: 'Average',
  6: 'Good',
  7: 'Good',
  8: 'Excellent',
  9: 'Excellent',
  10: 'Exceptional'
};

export function getScoreLabel(score) {
  return scoreLabelMap[Math.round(score)] || 'Average';
}

export default performanceCategories;

