/**
 * SuperNatural Motorsports - Performance HUB Categories
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
 * @type {Object[]}
 */
export const upgradeModuleCategories = [
  {
    key: 'power',
    label: 'Power',
    description: 'Engine, exhaust, intake, tune',
    icon: 'engine',
  },
  {
    key: 'chassis',
    label: 'Chassis',
    description: 'Suspension, bushings, sway bars',
    icon: 'suspension',
  },
  {
    key: 'brakes',
    label: 'Brakes',
    description: 'Rotors, pads, fluid, lines',
    icon: 'brake',
  },
  {
    key: 'aero',
    label: 'Aero',
    description: 'Splitters, wings, diffusers',
    icon: 'aero',
  },
  {
    key: 'cooling',
    label: 'Cooling',
    description: 'Oil coolers, radiators, ducting',
    icon: 'thermometer',
  },
  {
    key: 'wheels',
    label: 'Wheels & Tires',
    description: 'Lightweight wheels, performance tires',
    icon: 'tire',
  }
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
 * Maps the existing advisory scores to the new performance categories
 * @param {Object} car - Car object from carData
 * @returns {Object} - Performance scores for each category
 */
export function mapCarToPerformanceScores(car) {
  // Map existing scores to new performance categories
  // This creates a baseline that can be enhanced with hard metrics later
  return {
    powerAccel: calculatePowerScore(car),
    gripCornering: calculateGripScore(car),
    braking: calculateBrakingScore(car),
    trackPace: car.track || 5,
    drivability: calculateDrivabilityScore(car),
    reliabilityHeat: car.reliability || 5,
    soundEmotion: car.sound || 5,
  };
}

/**
 * Calculate power score from available metrics
 */
function calculatePowerScore(car) {
  // Base on HP and weight if available, otherwise use track score as proxy
  if (car.hp && car.curbWeight) {
    const powerToWeight = car.hp / (car.curbWeight / 1000);
    // 200 hp/ton = 5, 300 hp/ton = 7, 400+ hp/ton = 9+
    return Math.min(10, Math.max(1, Math.round(powerToWeight / 45)));
  }
  // Fallback: average of track and driverFun scores
  return Math.round((car.track + car.driverFun) / 2) || 5;
}

/**
 * Calculate grip score from available metrics
 */
function calculateGripScore(car) {
  // Use track score as primary indicator, modified by category
  let base = car.track || 5;
  // Mid-engine cars typically have better balance
  if (car.category === 'Mid-Engine') base = Math.min(10, base + 0.5);
  return Math.round(base);
}

/**
 * Calculate braking score
 */
function calculateBrakingScore(car) {
  // Premium and track-focused cars typically have better brakes
  let base = car.track || 5;
  if (car.tier === 'premium') base = Math.min(10, base + 1);
  return Math.round(base);
}

/**
 * Calculate drivability score
 */
function calculateDrivabilityScore(car) {
  // Higher interior + reliability = better drivability
  // Lower track = more comfort-focused
  const comfortBias = 10 - (car.track || 5);
  return Math.round((car.interior + car.reliability + comfortBias) / 3) || 5;
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

