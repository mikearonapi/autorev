/**
 * SuperNatural Motorsports - Upgrade Packages & Modules
 * 
 * This file defines the upgrade packages and individual modules available
 * for the Performance HUB. Each package/module specifies performance deltas
 * that modify the base car's performance scores.
 * 
 * Structure:
 * - Generic packages that apply to most cars (scaled by car characteristics)
 * - Car-specific packages for special cases
 * - Individual modules for advanced users to fine-tune
 */

/**
 * @typedef {Object} UpgradePackage
 * @property {string} key - Unique identifier
 * @property {string} name - Display name
 * @property {string} slug - URL-friendly identifier
 * @property {'package'|'module'} type - Package (curated set) or module (individual item)
 * @property {'streetSport'|'trackPack'|'timeAttack'} tier - Performance tier
 * @property {string} description - What this package includes/does
 * @property {string} intendedUse - Who should consider this
 * @property {string} estimatedCost - Price range string
 * @property {number} estimatedCostLow - Low end of cost estimate
 * @property {number} estimatedCostHigh - High end of cost estimate
 * @property {Object} deltas - Performance score changes per category
 * @property {Object} metricChanges - Hard metric changes (hp, 0-60, etc.)
 * @property {string[]} includes - What's included in this package
 * @property {string[]} considerations - Trade-offs or things to know
 * @property {string|null} carSlug - If null, applies to all cars; otherwise car-specific
 * @property {string[]} applicableLayouts - Which car layouts this applies to
 */

/**
 * Generic upgrade packages that apply to most cars
 * Deltas are baseline values that may be scaled based on car characteristics
 * @type {UpgradePackage[]}
 */
export const genericPackages = [
  // ============================================================================
  // STREET SPORT TIER
  // ============================================================================
  {
    key: 'streetSport',
    name: 'Street Sport Package',
    slug: 'street-sport',
    type: 'package',
    tier: 'streetSport',
    description: 'Enhanced street performance with improved throttle response, better exhaust note, and slightly sharper handling while maintaining daily drivability.',
    intendedUse: 'Spirited street driving, occasional canyon runs, weekend cruising',
    estimatedCost: '$3,000 - $6,000',
    estimatedCostLow: 3000,
    estimatedCostHigh: 6000,
    deltas: {
      powerAccel: 1,
      gripCornering: 0.5,
      braking: 0.5,
      trackPace: 1,
      drivability: 0, // Maintains daily usability
      reliabilityHeat: 0,
      soundEmotion: 1.5,
    },
    metricChanges: {
      hpGain: 15, // Typical from intake + tune
      zeroToSixtyImprovement: 0.2, // seconds faster
    },
    includes: [
      'Performance air intake',
      'ECU tune (street map)',
      'Performance exhaust (cat-back)',
      'Lowering springs or mild coilovers',
    ],
    considerations: [
      'Maintains factory warranty (intake may vary)',
      'Improved sound may be louder than stock',
      'Slightly firmer ride with lowering',
    ],
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },

  // ============================================================================
  // TRACK PACK TIER
  // ============================================================================
  {
    key: 'trackPack',
    name: 'Track Pack',
    slug: 'track-pack',
    type: 'package',
    tier: 'trackPack',
    description: 'Serious track capability with upgraded brakes, suspension, and cooling while remaining street legal. Built for regular HPDE and track day events.',
    intendedUse: 'Regular track days, HPDE events, time attack competition',
    estimatedCost: '$12,000 - $20,000',
    estimatedCostLow: 12000,
    estimatedCostHigh: 20000,
    deltas: {
      powerAccel: 1.5,
      gripCornering: 2,
      braking: 2,
      trackPace: 2.5,
      drivability: -1, // Some street compromise
      reliabilityHeat: 1.5,
      soundEmotion: 2,
    },
    metricChanges: {
      hpGain: 30,
      zeroToSixtyImprovement: 0.4,
      brakingImprovement: 8, // feet shorter stopping distance
      lateralGImprovement: 0.1,
    },
    includes: [
      'Full coilover suspension',
      'Big brake kit (front)',
      'High-performance brake pads',
      'Stainless brake lines',
      'Performance alignment',
      'Oil cooler upgrade',
      'Track-focused ECU tune',
      'Performance exhaust system',
    ],
    considerations: [
      'Firmer ride on street',
      'May void powertrain warranty (tune)',
      'Requires more frequent brake pad changes',
      'Oil cooler essential for sustained track use',
    ],
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },

  // ============================================================================
  // TIME ATTACK TIER
  // ============================================================================
  {
    key: 'timeAttack',
    name: 'Time Attack Build',
    slug: 'time-attack',
    type: 'package',
    tier: 'timeAttack',
    description: 'Maximum performance build for competitive time attack. Significant power gains, aggressive aero, and race-spec components. Some street compromises.',
    intendedUse: 'Competitive time attack, dedicated track car, serious lap times',
    estimatedCost: '$30,000 - $50,000+',
    estimatedCostLow: 30000,
    estimatedCostHigh: 50000,
    deltas: {
      powerAccel: 3,
      gripCornering: 3,
      braking: 2.5,
      trackPace: 3.5,
      drivability: -2.5, // Significant street compromise
      reliabilityHeat: 2,
      soundEmotion: 2.5,
    },
    metricChanges: {
      hpGain: 80,
      zeroToSixtyImprovement: 0.8,
      brakingImprovement: 15,
      lateralGImprovement: 0.25,
    },
    includes: [
      'Forged internals (if needed)',
      'Turbo upgrade or supercharger',
      'Full race exhaust',
      'Competition coilovers',
      'Full big brake kit (front + rear)',
      'Lightweight wheels',
      'Semi-slick tires',
      'Aero package (splitter, wing)',
      'Full cooling package',
      'Roll bar (recommended)',
      'Data acquisition',
    ],
    considerations: [
      'Not recommended for daily driving',
      'Voids factory warranty',
      'Requires race fuel for some tunes',
      'May affect insurance',
      'Regular maintenance intervals shortened',
    ],
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
];

/**
 * Individual upgrade modules for fine-tuning
 * These can be combined by advanced users
 * @type {UpgradePackage[]}
 */
export const upgradeModules = [
  // ============================================================================
  // POWER MODULES
  // ============================================================================
  {
    key: 'intake',
    name: 'Performance Intake',
    slug: 'intake',
    type: 'module',
    category: 'power',
    tier: 'streetSport',
    description: 'Improved airflow and throttle response',
    estimatedCost: '$300 - $600',
    estimatedCostLow: 300,
    estimatedCostHigh: 600,
    deltas: {
      powerAccel: 0.3,
      soundEmotion: 0.5,
    },
    metricChanges: {
      hpGain: 8,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'exhaust-catback',
    name: 'Cat-Back Exhaust',
    slug: 'exhaust-catback',
    type: 'module',
    category: 'power',
    tier: 'streetSport',
    description: 'Better flow and improved exhaust note',
    estimatedCost: '$800 - $2,000',
    estimatedCostLow: 800,
    estimatedCostHigh: 2000,
    deltas: {
      powerAccel: 0.3,
      soundEmotion: 1.5,
    },
    metricChanges: {
      hpGain: 10,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'tune-street',
    name: 'Street ECU Tune',
    slug: 'tune-street',
    type: 'module',
    category: 'power',
    tier: 'streetSport',
    description: 'Optimized fueling and ignition timing',
    estimatedCost: '$500 - $1,000',
    estimatedCostLow: 500,
    estimatedCostHigh: 1000,
    deltas: {
      powerAccel: 0.5,
      trackPace: 0.3,
    },
    metricChanges: {
      hpGain: 15,
      zeroToSixtyImprovement: 0.15,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'tune-track',
    name: 'Track ECU Tune',
    slug: 'tune-track',
    type: 'module',
    category: 'power',
    tier: 'trackPack',
    description: 'Aggressive tuning for maximum power',
    estimatedCost: '$800 - $1,500',
    estimatedCostLow: 800,
    estimatedCostHigh: 1500,
    deltas: {
      powerAccel: 1,
      trackPace: 0.5,
      reliabilityHeat: -0.3,
    },
    metricChanges: {
      hpGain: 30,
      zeroToSixtyImprovement: 0.3,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },

  // ============================================================================
  // CHASSIS MODULES
  // ============================================================================
  {
    key: 'lowering-springs',
    name: 'Lowering Springs',
    slug: 'lowering-springs',
    type: 'module',
    category: 'chassis',
    tier: 'streetSport',
    description: 'Lower center of gravity, improved handling',
    estimatedCost: '$400 - $800',
    estimatedCostLow: 400,
    estimatedCostHigh: 800,
    deltas: {
      gripCornering: 0.5,
      trackPace: 0.3,
      drivability: -0.3,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'coilovers-street',
    name: 'Street Coilovers',
    slug: 'coilovers-street',
    type: 'module',
    category: 'chassis',
    tier: 'streetSport',
    description: 'Adjustable height and damping for street use',
    estimatedCost: '$1,500 - $3,000',
    estimatedCostLow: 1500,
    estimatedCostHigh: 3000,
    deltas: {
      gripCornering: 1,
      trackPace: 0.5,
      drivability: -0.5,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'coilovers-track',
    name: 'Track Coilovers',
    slug: 'coilovers-track',
    type: 'module',
    category: 'chassis',
    tier: 'trackPack',
    description: 'Competition dampers with full adjustability',
    estimatedCost: '$3,000 - $6,000',
    estimatedCostLow: 3000,
    estimatedCostHigh: 6000,
    deltas: {
      gripCornering: 2,
      trackPace: 1.5,
      drivability: -1.5,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'sway-bars',
    name: 'Upgraded Sway Bars',
    slug: 'sway-bars',
    type: 'module',
    category: 'chassis',
    tier: 'trackPack',
    description: 'Adjustable anti-roll bars for balance tuning',
    estimatedCost: '$600 - $1,200',
    estimatedCostLow: 600,
    estimatedCostHigh: 1200,
    deltas: {
      gripCornering: 0.5,
      trackPace: 0.3,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },

  // ============================================================================
  // BRAKE MODULES
  // ============================================================================
  {
    key: 'brake-pads-street',
    name: 'Performance Brake Pads',
    slug: 'brake-pads-street',
    type: 'module',
    category: 'brakes',
    tier: 'streetSport',
    description: 'Better bite and shorter stopping distances',
    estimatedCost: '$200 - $500',
    estimatedCostLow: 200,
    estimatedCostHigh: 500,
    deltas: {
      braking: 0.5,
      trackPace: 0.2,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'brake-fluid-lines',
    name: 'Brake Fluid & SS Lines',
    slug: 'brake-fluid-lines',
    type: 'module',
    category: 'brakes',
    tier: 'trackPack',
    description: 'High-temp fluid and stainless lines for better pedal feel',
    estimatedCost: '$200 - $400',
    estimatedCostLow: 200,
    estimatedCostHigh: 400,
    deltas: {
      braking: 0.5,
      reliabilityHeat: 0.3,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'big-brake-kit',
    name: 'Big Brake Kit',
    slug: 'big-brake-kit',
    type: 'module',
    category: 'brakes',
    tier: 'trackPack',
    description: 'Larger rotors and calipers for improved stopping',
    estimatedCost: '$2,500 - $5,000',
    estimatedCostLow: 2500,
    estimatedCostHigh: 5000,
    deltas: {
      braking: 1.5,
      trackPace: 0.5,
      reliabilityHeat: 0.5,
    },
    metricChanges: {
      brakingImprovement: 10,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },

  // ============================================================================
  // COOLING MODULES
  // ============================================================================
  {
    key: 'oil-cooler',
    name: 'Oil Cooler',
    slug: 'oil-cooler',
    type: 'module',
    category: 'cooling',
    tier: 'trackPack',
    description: 'Keep oil temps in check during track sessions',
    estimatedCost: '$800 - $1,500',
    estimatedCostLow: 800,
    estimatedCostHigh: 1500,
    deltas: {
      reliabilityHeat: 1,
      trackPace: 0.3,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'trans-cooler',
    name: 'Transmission Cooler',
    slug: 'trans-cooler',
    type: 'module',
    category: 'cooling',
    tier: 'trackPack',
    description: 'Protect your gearbox during extended track use',
    estimatedCost: '$600 - $1,200',
    estimatedCostLow: 600,
    estimatedCostHigh: 1200,
    deltas: {
      reliabilityHeat: 0.8,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'radiator-upgrade',
    name: 'Performance Radiator',
    slug: 'radiator-upgrade',
    type: 'module',
    category: 'cooling',
    tier: 'trackPack',
    description: 'Increased cooling capacity for track days',
    estimatedCost: '$500 - $1,000',
    estimatedCostLow: 500,
    estimatedCostHigh: 1000,
    deltas: {
      reliabilityHeat: 0.7,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },

  // ============================================================================
  // WHEELS & TIRES MODULES
  // ============================================================================
  {
    key: 'wheels-lightweight',
    name: 'Lightweight Wheels',
    slug: 'wheels-lightweight',
    type: 'module',
    category: 'wheels',
    tier: 'trackPack',
    description: 'Reduced unsprung weight for better handling',
    estimatedCost: '$2,000 - $4,000',
    estimatedCostLow: 2000,
    estimatedCostHigh: 4000,
    deltas: {
      gripCornering: 0.5,
      braking: 0.3,
      trackPace: 0.5,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'tires-performance',
    name: 'Performance Summer Tires',
    slug: 'tires-performance',
    type: 'module',
    category: 'wheels',
    tier: 'streetSport',
    description: 'Stickier compound for improved grip',
    estimatedCost: '$800 - $1,500',
    estimatedCostLow: 800,
    estimatedCostHigh: 1500,
    deltas: {
      gripCornering: 1,
      braking: 0.5,
      trackPace: 0.5,
    },
    metricChanges: {
      lateralGImprovement: 0.05,
      brakingImprovement: 3,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'tires-track',
    name: '200TW Track Tires',
    slug: 'tires-track',
    type: 'module',
    category: 'wheels',
    tier: 'trackPack',
    description: 'Semi-slick tires for maximum grip',
    estimatedCost: '$1,200 - $2,000',
    estimatedCostLow: 1200,
    estimatedCostHigh: 2000,
    deltas: {
      gripCornering: 2,
      braking: 1,
      trackPace: 1.5,
      drivability: -1, // Wear fast, noisy
    },
    metricChanges: {
      lateralGImprovement: 0.15,
      brakingImprovement: 8,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },

  // ============================================================================
  // AERO MODULES
  // ============================================================================
  {
    key: 'splitter',
    name: 'Front Splitter',
    slug: 'splitter',
    type: 'module',
    category: 'aero',
    tier: 'trackPack',
    description: 'Improved front-end downforce',
    estimatedCost: '$400 - $1,200',
    estimatedCostLow: 400,
    estimatedCostHigh: 1200,
    deltas: {
      gripCornering: 0.3,
      trackPace: 0.3,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'wing',
    name: 'Rear Wing',
    slug: 'wing',
    type: 'module',
    category: 'aero',
    tier: 'timeAttack',
    description: 'Significant rear downforce for high-speed stability',
    estimatedCost: '$1,000 - $3,000',
    estimatedCostLow: 1000,
    estimatedCostHigh: 3000,
    deltas: {
      gripCornering: 0.5,
      trackPace: 0.5,
      powerAccel: -0.2, // Drag penalty
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
];

/**
 * Get all packages for a specific car
 * @param {string} carSlug - The car's slug
 * @param {string} carLayout - The car's layout (Mid-Engine, Front-Engine, Rear-Engine)
 * @returns {UpgradePackage[]}
 */
export function getPackagesForCar(carSlug, carLayout) {
  return genericPackages.filter(pkg => 
    pkg.applicableLayouts.includes(carLayout) &&
    (pkg.carSlug === null || pkg.carSlug === carSlug)
  );
}

/**
 * Get all modules for a specific car
 * @param {string} carSlug - The car's slug
 * @param {string} carLayout - The car's layout
 * @returns {UpgradePackage[]}
 */
export function getModulesForCar(carSlug, carLayout) {
  return upgradeModules.filter(mod => 
    mod.applicableLayouts.includes(carLayout) &&
    (mod.carSlug === null || mod.carSlug === carSlug)
  );
}

/**
 * Get modules by category
 * @param {string} category - Module category key
 * @returns {UpgradePackage[]}
 */
export function getModulesByCategory(category) {
  return upgradeModules.filter(mod => mod.category === category);
}

export default genericPackages;

