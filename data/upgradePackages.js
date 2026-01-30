/**
 * AutoRev - Upgrade Packages & Modules
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
    description:
      'Enhanced street performance with improved throttle response, better exhaust note, and slightly sharper handling while maintaining daily drivability.',
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
      brakingImprovement: 3, // feet
      lateralGImprovement: 0.02,
    },
    includes: [
      'Cold air intake system (K&N, AEM, or OEM+)',
      'ECU tune/flash (street-focused calibration)',
      'Cat-back exhaust system (improved flow + sound)',
      'Lowering springs (0.75"-1.25" drop)',
      'Performance brake pads (street compound)',
      'Alignment to factory sport specs',
    ],
    // Module keys that match upgradeModules for grid selection
    includedUpgradeKeys: ['intake', 'exhaust-catback', 'lowering-springs', 'brake-pads-street'],
    considerations: [
      'Most work maintains factory warranty',
      'ECU tune may affect warranty - check dealer policy',
      'Sound improvement is noticeable but not intrusive',
      'Slightly firmer ride acceptable for daily driving',
      'All parts reversible if needed for warranty claims',
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
    description:
      'Serious track capability with upgraded brakes, suspension, and cooling while remaining street legal. Built for regular HPDE and track day events.',
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
      'Full adjustable coilover system (KW, Ohlins, or equivalent)',
      'Front big brake kit (larger rotors + 4/6-piston calipers)',
      'Performance brake pads (track compound: Hawk DTC-60, Ferodo DS2500)',
      'Stainless steel braided brake lines',
      'High-temp brake fluid (DOT 4 racing spec)',
      'Oil cooler kit with thermostatic sandwich plate',
      'Track-focused ECU tune (timing + fueling optimization)',
      'Performance exhaust (headers or full system)',
      'Adjustable sway bars (front and rear)',
      'Performance alignment (aggressive camber + toe)',
    ],
    // Module keys that match upgradeModules for grid selection
    includedUpgradeKeys: [
      'coilovers-track',
      'big-brake-kit',
      'brake-pads-track',
      'brake-fluid-lines',
      'oil-cooler',
      'headers',
      'sway-bars',
    ],
    considerations: [
      'Noticeably firmer ride on street - not harsh but sporty',
      'ECU tune will likely void powertrain warranty',
      'Track brake pads may squeal when cold',
      'Budget for more frequent brake pad changes (track use)',
      'Oil cooler prevents thermal breakdown at sustained high RPM',
      'Consider dedicated track wheel/tire setup',
    ],
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },

  // ============================================================================
  // TIME ATTACK TIER (Full chassis + NA optimization)
  // ============================================================================
  {
    key: 'timeAttack',
    name: 'Time Attack Build',
    slug: 'time-attack',
    type: 'package',
    tier: 'timeAttack',
    description:
      'Maximum track performance with full chassis optimization, aggressive aero, and race-spec components. Some street compromises.',
    intendedUse: 'Competitive time attack, dedicated track car, serious lap times',
    estimatedCost: '$25,000 - $40,000',
    estimatedCostLow: 25000,
    estimatedCostHigh: 40000,
    deltas: {
      powerAccel: 2,
      gripCornering: 3,
      braking: 2.5,
      trackPace: 3.5,
      drivability: -2.5, // Significant street compromise
      reliabilityHeat: 2,
      soundEmotion: 2.5,
    },
    metricChanges: {
      hpGain: 60, // NA optimization: cams, exhaust, tune
      zeroToSixtyImprovement: 0.5,
      brakingImprovement: 15,
      lateralGImprovement: 0.25,
    },
    includes: [
      'Full race exhaust (headers/manifold + X-pipe + muffler)',
      'Standalone ECU or aggressive tune (E85 capable)',
      'High-flow fuel system (injectors, pump)',
      '3-way adjustable coilovers (compression/rebound/height)',
      'Full brake kit (front + rear big brake upgrade)',
      'Race brake pads (Endless, Pagid, or equivalent)',
      'Lightweight forged wheels (18" or 19")',
      '200-treadwear tires (Yokohama A052, RE-71RS, or similar)',
      'Aero package (front splitter + rear wing + diffuser)',
      'Full cooling package (radiator, oil cooler, trans cooler)',
      'Roll bar or half cage (safety + chassis stiffness)',
      'Data acquisition system (AiM Solo or similar)',
    ],
    // Module keys that match upgradeModules for grid selection
    // Note: Tire compound selection handled by WheelTireConfigurator
    includedUpgradeKeys: [
      'headers',
      'exhaust-catback',
      'coilovers-track',
      'big-brake-kit',
      'brake-pads-track',
      'wheels-lightweight',
      'splitter',
      'wing',
      'radiator-upgrade',
      'oil-cooler',
      'trans-cooler',
    ],
    considerations: [
      'Serious build - not recommended for daily driving',
      'All warranties voided',
      'May require race gas or E85 for aggressive tunes',
      'Insurance implications - check coverage for track use',
      'Shorter maintenance intervals (oil, fluids, consumables)',
      'Semi-slick tires wear fast and have minimal wet grip',
      'Aero components may scrape on street - adjust for driveways',
    ],
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },

  // ============================================================================
  // ULTIMATE POWER TIER (Forced Induction)
  // ============================================================================
  {
    key: 'ultimatePower',
    name: 'Ultimate Power Build',
    slug: 'ultimate-power',
    type: 'package',
    tier: 'ultimatePower',
    description:
      'Maximum horsepower through forced induction. Supercharger or turbo kit with supporting mods for massive power gains. Street or track monster.',
    intendedUse: 'Maximum power builds, drag racing, roll racing, ultimate street machine',
    estimatedCost: '$15,000 - $35,000+',
    estimatedCostLow: 15000,
    estimatedCostHigh: 35000,
    deltas: {
      powerAccel: 4.5,
      gripCornering: 1,
      braking: 1,
      trackPace: 3,
      drivability: -1.5, // Power comes with some compromise
      reliabilityHeat: -1, // Heat management critical
      soundEmotion: 3,
    },
    metricChanges: {
      // Base gains - scaled by engine type in performance.js
      hpGain: 250, // Typical supercharger on NA V8
      zeroToSixtyImprovement: 1.0,
      brakingImprovement: 0,
      lateralGImprovement: 0,
    },
    includes: [
      'Supercharger OR twin-turbo kit (Whipple, Roush, ProCharger, Hellion)',
      'Supporting fuel system (1000cc+ injectors, dual pump)',
      'Upgraded intercooler/heat exchanger',
      'Custom ECU tune (dyno-tuned for your setup)',
      'Upgraded clutch or torque converter (if applicable)',
      'Full exhaust with downpipes/headers',
      'Oil cooler + upgraded cooling system',
      'Supporting drive components (belts, pulleys)',
    ],
    // Module keys that match upgradeModules for grid selection
    // Note: supercharger-roots OR supercharger-centrifugal will be shown based on engine type
    includedUpgradeKeys: [
      'supercharger-roots',
      'supercharger-centrifugal',
      'intercooler',
      'stage3-tune',
      'headers',
      'exhaust-catback',
      'oil-cooler',
      'radiator-upgrade',
      'trans-cooler',
    ],
    considerations: [
      'Major power increase requires quality fuel (91+ octane, E85 for max power)',
      'All warranties voided - engine is significantly modified',
      'May need upgraded axles/driveshaft for high power',
      'Heat management critical - monitor temps carefully',
      'Tire wear increases dramatically with power',
      'Insurance may be affected - check with provider',
      'Professional installation and tuning strongly recommended',
      'Budget for supporting mods (cooling, drivetrain)',
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
    name: 'Cold Air Intake',
    slug: 'intake',
    type: 'module',
    category: 'power',
    tier: 'streetSport',
    stage: 1,
    description:
      'Increased airflow with improved induction sound. No tune required. Brands: K&N, AEM, Injen, Eventuri.',
    estimatedCost: '$300 - $600',
    estimatedCostLow: 300,
    estimatedCostHigh: 600,
    deltas: {
      powerAccel: 0.4,
      soundEmotion: 0.5,
    },
    metricChanges: {
      hpGain: 15,
    },
    carSlug: null,
    // Universal - all cars benefit from improved airflow
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'exhaust-catback',
    name: 'Cat-Back Exhaust',
    slug: 'exhaust-catback',
    type: 'module',
    category: 'exhaust',
    tier: 'streetSport',
    stage: 1,
    description: 'Improved exhaust flow and enhanced sound. Brands: Borla, Akrapovic, AWE.',
    estimatedCost: '$800 - $2,000',
    estimatedCostLow: 800,
    estimatedCostHigh: 2000,
    deltas: {
      powerAccel: 0.3,
      soundEmotion: 1.5,
    },
    metricChanges: {
      hpGain: 12,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'exhaust-axleback',
    name: 'Axle-Back Exhaust',
    slug: 'exhaust-axleback',
    type: 'module',
    category: 'exhaust',
    tier: 'streetSport',
    stage: 1,
    description:
      'Muffler and tip replacement for improved sound with minimal power gain. Easy install. Brands: Borla, Corsa, MagnaFlow.',
    estimatedCost: '$400 - $1,000',
    estimatedCostLow: 400,
    estimatedCostHigh: 1000,
    deltas: {
      powerAccel: 0.1,
      soundEmotion: 1.0,
    },
    metricChanges: {
      hpGain: 5,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'headers',
    name: 'Performance Headers',
    slug: 'headers',
    type: 'module',
    category: 'exhaust',
    tier: 'trackPack',
    stage: 2,
    description:
      'Long-tube or equal-length headers for significant power gains. Requires tune for proper air/fuel ratio.',
    estimatedCost: '$1,500 - $3,500',
    estimatedCostLow: 1500,
    estimatedCostHigh: 3500,
    deltas: {
      powerAccel: 0.8,
      soundEmotion: 1.0,
    },
    metricChanges: {
      hpGain: 25,
      zeroToSixtyImprovement: 0.1,
    },
    // Headers require a tune for the engine to compensate for changed exhaust flow
    requires: ['stage2-tune'],
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  // ==========================================================================
  // STAGE TUNES - Universal across all engine types
  // Stage 1: Optimizes intake + cat-back mods (tune optional for Stage 1 hardware)
  // Stage 2: Required for headers, downpipe, mild cams, pulley (bolt-ons that need tune)
  // Stage 3: Required for forced induction, aggressive cams, fuel system upgrades
  // ==========================================================================
  {
    key: 'stage1-tune',
    name: 'Stage 1 Tune',
    slug: 'stage1-tune',
    type: 'module',
    category: 'power',
    tier: 'streetSport',
    stage: 1,
    description:
      'ECU flash tune optimizing timing, fuel, and throttle response. Maximizes gains from intake and cat-back exhaust. 91+ octane recommended. Brands: APR, Cobb, Unitronic, VF Engineering.',
    estimatedCost: '$500 - $1,000',
    estimatedCostLow: 500,
    estimatedCostHigh: 1000,
    deltas: {
      powerAccel: 1.0,
      trackPace: 0.5,
      soundEmotion: 0.3,
    },
    metricChanges: {
      // Performance calculator will scale based on engine type
      // Turbo/SC cars see higher gains, NA cars see modest gains
      hpGain: 25,
      torqueGain: 30,
      zeroToSixtyImprovement: 0.2,
    },
    stronglyRecommended: ['intake', 'exhaust-catback'],
    carSlug: null,
    // Universal - available for all engine types
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'stage2-tune',
    name: 'Stage 2 Tune',
    slug: 'stage2-tune',
    type: 'module',
    category: 'power',
    tier: 'trackPack',
    stage: 2,
    description:
      'Aggressive tune calibrated for bolt-on hardware that requires ECU compensation. Required for headers, downpipe (turbo), pulley (SC), or mild cams. Brands: APR, GIAC, Unitronic, IE.',
    estimatedCost: '$700 - $1,500',
    estimatedCostLow: 700,
    estimatedCostHigh: 1500,
    deltas: {
      powerAccel: 2.0,
      trackPace: 1.0,
      reliabilityHeat: -0.3,
      soundEmotion: 0.8,
    },
    metricChanges: {
      // Performance calculator will scale based on engine type
      hpGain: 50,
      torqueGain: 60,
      zeroToSixtyImprovement: 0.4,
    },
    // Stage 2 requires one of: headers (all), downpipe (turbo), pulley (SC), or mild cams
    stronglyRecommended: ['headers', 'intake', 'exhaust-catback'],
    carSlug: null,
    // Universal - available for all engine types
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'stage3-tune',
    name: 'Stage 3 Tune',
    slug: 'stage3-tune',
    type: 'module',
    category: 'power',
    tier: 'ultimatePower',
    stage: 3,
    description:
      'Maximum power tune for builds exceeding stock fuel system capacity. Required for forced induction kits, turbo upgrades, aggressive cams, or E85. Brands: APR, IE, Unitronic, custom dyno tuners.',
    estimatedCost: '$1,500 - $3,000',
    estimatedCostLow: 1500,
    estimatedCostHigh: 3000,
    deltas: {
      powerAccel: 4,
      trackPace: 2,
      reliabilityHeat: -1,
      soundEmotion: 1.5,
    },
    metricChanges: {
      // Performance calculator will scale based on engine type and mods
      hpGain: 100,
      torqueGain: 120,
      zeroToSixtyImprovement: 0.8,
    },
    requires: ['fuel-system-upgrade'],
    stronglyRecommended: ['clutch-upgrade', 'oil-cooler', 'trans-cooler'],
    carSlug: null,
    // Universal - available for all engine types
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  // Piggyback ECU tuners - universal
  {
    key: 'piggyback-tuner',
    name: 'Piggyback Tuner',
    slug: 'piggyback-tuner',
    type: 'module',
    category: 'power',
    tier: 'streetSport',
    stage: 1,
    description:
      'Plug-and-play tuning module. No ECU flash required, warranty-friendly removal. Brands: JB4, Burger Motorsports, RaceChip, Pedal Commander.',
    estimatedCost: '$300 - $700',
    estimatedCostLow: 300,
    estimatedCostHigh: 700,
    deltas: {
      powerAccel: 0.8,
      trackPace: 0.4,
    },
    metricChanges: {
      // Performance calculator will scale based on engine type
      // Turbo cars see higher gains from boost control
      hpGain: 20,
      torqueGain: 25,
      zeroToSixtyImprovement: 0.15,
    },
    carSlug: null,
    // Universal - available for all engine types
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  // Downpipe - Turbo cars only, Stage 2 mod
  // NOTE: Gains are HIGHLY platform-specific. Forum research shows:
  // - BMW B58, Evo X 4B11: +15-25 HP (restrictive factory downpipes)
  // - Audi 2.9T (RS5/RS4): +0-10 HP (factory DP already efficient, mainly for sound)
  // - VW/Audi EA888: +10-20 HP
  // Using +15 HP as moderate cross-platform average
  {
    key: 'downpipe',
    name: 'Downpipe',
    slug: 'downpipe',
    type: 'module',
    category: 'exhaust',
    tier: 'trackPack',
    stage: 2,
    description:
      'High-flow or catless downpipe for turbo cars. Reduces exhaust restriction post-turbo. Requires tune. Brands: AWE, Milltek, Soul Performance.',
    estimatedCost: '$600 - $1,500',
    estimatedCostLow: 600,
    estimatedCostHigh: 1500,
    deltas: {
      powerAccel: 0.6,
      soundEmotion: 1.2,
      trackPace: 0.2,
    },
    metricChanges: {
      hpGain: 15,
      torqueGain: 25,
    },
    requires: ['stage2-tune'],
    carSlug: null,
    // Turbo cars only - downpipe is the section after the turbocharger
    applicableEngines: ['Turbo V8', 'Turbo V6', 'Turbo I6', 'Turbo I4', 'Turbo Flat-6'],
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  // E85/Flex Fuel - Stage 3 mod (requires fuel system upgrade)
  {
    key: 'flex-fuel-e85',
    name: 'E85/Flex Fuel Kit',
    slug: 'flex-fuel-e85',
    type: 'module',
    category: 'power',
    tier: 'ultimatePower',
    stage: 3,
    description:
      'Ethanol fuel system conversion allowing E85 use for significant power gains. E85 requires ~30% more fuel flow. Includes sensor, tune, and often injector upgrades. Brands: Zeitronix, IE, Flex Fuel Sensor Kit.',
    estimatedCost: '$1,500 - $3,500',
    estimatedCostLow: 1500,
    estimatedCostHigh: 3500,
    deltas: {
      powerAccel: 2,
      trackPace: 1,
      reliabilityHeat: -0.3,
    },
    metricChanges: {
      hpGain: 50,
      torqueGain: 60,
      zeroToSixtyImprovement: 0.4,
    },
    requires: ['fuel-system-upgrade', 'stage3-tune'],
    carSlug: null,
    // Universal - E85 works on any engine with proper fuel system support
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  // Nitrous Oxide - Stage 3 mod
  {
    key: 'nitrous',
    name: 'Nitrous Oxide Kit',
    slug: 'nitrous',
    type: 'module',
    category: 'power',
    tier: 'ultimatePower',
    stage: 3,
    description:
      'Nitrous oxide injection for instant power on demand. Available in wet or dry configurations. Brands: NOS, Nitrous Express, ZEX.',
    estimatedCost: '$800 - $2,500',
    estimatedCostLow: 800,
    estimatedCostHigh: 2500,
    deltas: {
      powerAccel: 3,
      trackPace: 1.5,
      reliabilityHeat: -1.5,
    },
    metricChanges: {
      hpGain: 100, // 75-150+ HP shot typical
      torqueGain: 100,
      zeroToSixtyImprovement: 0.6,
    },
    requires: ['fuel-system-upgrade', 'stage3-tune'],
    stronglyRecommended: ['clutch-upgrade'],
    carSlug: null,
    // Universal - nitrous works on any engine
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  // DCT/Transmission Tune
  {
    key: 'dct-tune',
    name: 'Transmission Software Upgrade',
    slug: 'dct-tune',
    type: 'module',
    category: 'power',
    tier: 'streetSport',
    description:
      'Transmission software for faster shifts and higher torque limits. Works with DCT, PDK, automatic, and SMG transmissions. Brands: Cobb, APR, Porsche Motorsport.',
    estimatedCost: '$800 - $2,000',
    estimatedCostLow: 800,
    estimatedCostHigh: 2000,
    deltas: {
      powerAccel: 0.3,
      trackPace: 0.5,
    },
    metricChanges: {
      zeroToSixtyImprovement: 0.2,
    },
    carSlug: null,
    // Universal - works with any electronically controlled transmission
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },

  // ==========================================================================
  // CAMSHAFT MODULES
  // ==========================================================================
  {
    key: 'camshaft-mild',
    name: 'Mild Performance Camshafts',
    slug: 'camshaft-mild',
    type: 'module',
    category: 'power',
    tier: 'trackPack',
    stage: 2,
    description:
      'Street-friendly performance cams with increased lift and duration. Maintains idle quality and drivability. Requires tune. Brands: Comp Cams, Brian Crower, Kelford.',
    estimatedCost: '$1,200 - $2,500',
    estimatedCostLow: 1200,
    estimatedCostHigh: 2500,
    deltas: {
      powerAccel: 1.2,
      trackPace: 0.8,
      soundEmotion: 0.8,
      drivability: -0.3,
    },
    metricChanges: {
      hpGain: 30,
      torqueGain: 20,
      zeroToSixtyImprovement: 0.2,
    },
    requires: ['stage2-tune'],
    stronglyRecommended: ['headers', 'intake'],
    carSlug: null,
    // Universal - all engines can benefit from cam upgrades
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'camshaft-aggressive',
    name: 'Aggressive Race Camshafts',
    slug: 'camshaft-aggressive',
    type: 'module',
    category: 'power',
    tier: 'ultimatePower',
    stage: 3,
    description:
      'Race-oriented cams with aggressive profiles. Significant top-end power but compromised idle and low-RPM drivability. May require valve spring upgrades. Brands: Comp Cams, Brian Crower, Kelford.',
    estimatedCost: '$2,000 - $4,500',
    estimatedCostLow: 2000,
    estimatedCostHigh: 4500,
    deltas: {
      powerAccel: 2.5,
      trackPace: 1.5,
      soundEmotion: 1.5,
      drivability: -1.5,
      reliabilityHeat: -0.5,
    },
    metricChanges: {
      hpGain: 60,
      torqueGain: 40,
      zeroToSixtyImprovement: 0.35,
    },
    requires: ['stage3-tune', 'fuel-system-upgrade'],
    stronglyRecommended: ['headers', 'intake', 'exhaust-catback'],
    carSlug: null,
    // Universal - but most common on NA cars
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },

  // ============================================================================
  // FORCED INDUCTION MODULES
  // ============================================================================
  {
    key: 'supercharger-centrifugal',
    name: 'Centrifugal Supercharger Kit',
    slug: 'supercharger-centrifugal',
    type: 'module',
    category: 'forcedInduction',
    tier: 'ultimatePower',
    stage: 3,
    description:
      'ProCharger or Vortech centrifugal supercharger for NA cars. Linear power delivery that builds with RPM. Brands: ProCharger, Vortech, Paxton.',
    estimatedCost: '$6,000 - $9,000',
    estimatedCostLow: 6000,
    estimatedCostHigh: 9000,
    deltas: {
      powerAccel: 3.5,
      trackPace: 2,
      reliabilityHeat: -0.5,
      soundEmotion: 2,
    },
    metricChanges: {
      hpGain: 180,
      torqueGain: 150,
      zeroToSixtyImprovement: 0.8,
    },
    includes: [
      'Centrifugal supercharger unit',
      'Intercooler (if kit includes)',
      'Intake/piping components',
    ],
    requires: ['fuel-system-upgrade', 'stage3-tune'],
    stronglyRecommended: ['oil-cooler', 'clutch-upgrade', 'intercooler'],
    carSlug: null,
    // NA cars only - adds forced induction
    applicableEngines: ['NA V8', 'NA V6', 'NA I6', 'NA I4', 'NA Flat-6'],
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'supercharger-roots',
    name: 'Roots/TVS Supercharger Kit',
    slug: 'supercharger-roots',
    type: 'module',
    category: 'forcedInduction',
    tier: 'ultimatePower',
    stage: 3,
    description:
      'Whipple or Roush TVS positive displacement supercharger for NA cars. Instant boost from idle. Brands: Whipple, Roush, Magnuson, Edelbrock.',
    estimatedCost: '$8,000 - $12,000',
    estimatedCostLow: 8000,
    estimatedCostHigh: 12000,
    deltas: {
      powerAccel: 4.5,
      trackPace: 2.5,
      reliabilityHeat: -0.8,
      soundEmotion: 2.5,
    },
    metricChanges: {
      hpGain: 280,
      torqueGain: 250,
      zeroToSixtyImprovement: 1.2,
    },
    includes: [
      'TVS-style positive displacement supercharger',
      'Integrated heat exchanger',
      'Upgraded intake manifold',
    ],
    requires: ['fuel-system-upgrade', 'stage3-tune'],
    stronglyRecommended: ['oil-cooler', 'clutch-upgrade', 'driveshaft-upgrade'],
    carSlug: null,
    // NA V8 cars primarily - most kits are V8 specific
    applicableEngines: ['NA V8'],
    applicableLayouts: ['Front-Engine', 'Mid-Engine'],
  },
  {
    key: 'turbo-kit-single',
    name: 'Single Turbo Kit',
    slug: 'turbo-kit-single',
    type: 'module',
    category: 'forcedInduction',
    tier: 'ultimatePower',
    stage: 3,
    description:
      'Single turbo conversion for NA cars. Maximum power potential with proper supporting mods. Brands: Garrett, Precision, BorgWarner.',
    estimatedCost: '$5,000 - $10,000',
    estimatedCostLow: 5000,
    estimatedCostHigh: 10000,
    deltas: {
      powerAccel: 4,
      trackPace: 2,
      reliabilityHeat: -1,
      soundEmotion: 2,
    },
    metricChanges: {
      hpGain: 220,
      torqueGain: 200,
      zeroToSixtyImprovement: 1.0,
    },
    includes: [
      'Single turbocharger',
      'Turbo manifold',
      'Downpipe',
      'Intercooler',
      'Wastegate',
      'BOV/Diverter valve',
    ],
    requires: ['fuel-system-upgrade', 'stage3-tune'],
    stronglyRecommended: ['oil-cooler', 'clutch-upgrade'],
    carSlug: null,
    // NA cars only - adds turbo to naturally aspirated engine
    applicableEngines: ['NA V8', 'NA V6', 'NA I6', 'NA I4'],
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'turbo-kit-twin',
    name: 'Twin Turbo Kit',
    slug: 'turbo-kit-twin',
    type: 'module',
    category: 'forcedInduction',
    tier: 'ultimatePower',
    stage: 3,
    description:
      'Twin turbo setup for NA V8 cars. Better spool and power distribution than single turbo. Brands: Hellion, On3, FI Interchillers.',
    estimatedCost: '$8,000 - $15,000',
    estimatedCostLow: 8000,
    estimatedCostHigh: 15000,
    deltas: {
      powerAccel: 5,
      trackPace: 2.5,
      reliabilityHeat: -1.2,
      soundEmotion: 2.5,
    },
    metricChanges: {
      hpGain: 350,
      torqueGain: 320,
      zeroToSixtyImprovement: 1.5,
    },
    includes: [
      'Twin turbochargers',
      'Turbo manifolds (both sides)',
      'Twin intercooler or single large',
      'Downpipes',
      'Wastegates',
      'Complete piping kit',
    ],
    requires: ['fuel-system-upgrade', 'stage3-tune'],
    stronglyRecommended: ['oil-cooler', 'clutch-upgrade', 'driveshaft-upgrade'],
    carSlug: null,
    // NA V8 cars primarily
    applicableEngines: ['NA V8'],
    applicableLayouts: ['Front-Engine', 'Mid-Engine'],
  },
  {
    key: 'turbo-upgrade-existing',
    name: 'Turbo Upgrade (Larger Turbos)',
    slug: 'turbo-upgrade-existing',
    type: 'module',
    category: 'forcedInduction',
    tier: 'ultimatePower',
    stage: 3,
    description:
      'Upgraded turbos for factory turbo cars. Larger compressor/turbine wheels for more flow and higher boost. Requires fuel system upgrade. Brands: Pure Turbos, Vargas, Precision.',
    estimatedCost: '$4,000 - $12,000',
    estimatedCostLow: 4000,
    estimatedCostHigh: 12000,
    deltas: {
      powerAccel: 2.5,
      trackPace: 1.5,
      reliabilityHeat: -0.5,
      soundEmotion: 1,
    },
    metricChanges: {
      hpGain: 120,
      torqueGain: 140,
      zeroToSixtyImprovement: 0.6,
    },
    includes: ['Upgraded turbocharger(s)', 'Supporting intake piping', 'Upgraded downpipe(s)'],
    requires: ['fuel-system-upgrade', 'stage3-tune'],
    stronglyRecommended: ['intercooler', 'oil-cooler', 'clutch-upgrade'],
    carSlug: null,
    // Turbo cars only
    applicableEngines: ['Turbo V8', 'Turbo V6', 'Turbo I6', 'Turbo I4', 'Turbo Flat-6'],
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  // Boost Controller - Turbo cars, Stage 2
  {
    key: 'boost-controller',
    name: 'Boost Controller / Wastegate Upgrade',
    slug: 'boost-controller',
    type: 'module',
    category: 'forcedInduction',
    tier: 'trackPack',
    stage: 2,
    description:
      'Electronic or manual boost controller to increase boost within stock turbo limits. Requires tune. Brands: Turbosmart, GFB, Cobb.',
    estimatedCost: '$300 - $800',
    estimatedCostLow: 300,
    estimatedCostHigh: 800,
    deltas: {
      powerAccel: 1.0,
      trackPace: 0.6,
      reliabilityHeat: -0.3,
    },
    metricChanges: {
      hpGain: 40,
      torqueGain: 50,
      zeroToSixtyImprovement: 0.25,
    },
    requires: ['stage2-tune'],
    carSlug: null,
    // Turbo cars only
    applicableEngines: ['Turbo V8', 'Turbo V6', 'Turbo I6', 'Turbo I4', 'Turbo Flat-6'],
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  // Pulley Upgrade - SC cars, Stage 2
  {
    key: 'pulley-tune-sc',
    name: 'SC Pulley + Tune',
    slug: 'pulley-tune-sc',
    type: 'module',
    category: 'forcedInduction',
    tier: 'trackPack',
    stage: 2,
    description:
      'Smaller supercharger pulley to increase boost on factory SC cars. Requires tune for safe operation. Brands: GripTec, Metco, Whipple.',
    estimatedCost: '$1,500 - $3,000',
    estimatedCostLow: 1500,
    estimatedCostHigh: 3000,
    deltas: {
      powerAccel: 1.5,
      trackPace: 1,
      reliabilityHeat: -0.3,
      soundEmotion: 0.5,
    },
    metricChanges: {
      hpGain: 75,
      torqueGain: 80,
      zeroToSixtyImprovement: 0.3,
    },
    includes: [
      'Smaller supercharger pulley',
      'Crank pulley (if needed)',
      'Updated ECU calibration',
    ],
    requires: ['stage2-tune'],
    stronglyRecommended: ['intercooler'],
    carSlug: null,
    // SC cars only
    applicableEngines: ['SC V8', 'SC V6'],
    applicableLayouts: ['Front-Engine', 'Mid-Engine'],
  },
  // Intercooler / Heat Exchanger - Forced induction cars only
  {
    key: 'intercooler',
    name: 'Intercooler / Heat Exchanger',
    slug: 'intercooler',
    type: 'module',
    category: 'forcedInduction',
    tier: 'trackPack',
    description:
      'Upgraded intercooler (turbo) or heat exchanger (SC) for lower intake temps and consistent power. Essential for track use and higher boost levels.',
    estimatedCost: '$600 - $2,000',
    estimatedCostLow: 600,
    estimatedCostHigh: 2000,
    deltas: {
      reliabilityHeat: 1,
      powerAccel: 0.3,
      trackPace: 0.3,
    },
    metricChanges: {
      hpGain: 20,
    },
    carSlug: null,
    // Forced induction cars only - NA cars don't compress air
    applicableEngines: [
      'Turbo V8',
      'Turbo V6',
      'Turbo I6',
      'Turbo I4',
      'Turbo Flat-6',
      'SC V8',
      'SC V6',
    ],
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'fuel-system-upgrade',
    name: 'Fuel System Upgrade',
    slug: 'fuel-system-upgrade',
    type: 'module',
    category: 'power',
    tier: 'ultimatePower',
    stage: 3,
    description:
      'Upgraded injectors, fuel pump, and fuel lines to support high-power applications. Required for forced induction, E85, or aggressive tunes.',
    estimatedCost: '$1,200 - $3,000',
    estimatedCostLow: 1200,
    estimatedCostHigh: 3000,
    deltas: {
      reliabilityHeat: 0.5,
    },
    metricChanges: {
      hpGain: 0, // Enables higher power, doesn't add directly
    },
    carSlug: null,
    // Universal - any car making significant power needs fuel support
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },

  // Note: Engine internals (camshafts, ported-heads, forged-internals, stroker-kit) removed
  // These are specialist engine build mods that <5% of enthusiasts pursue
  // Note: throttle-body and intake-manifold removed - marginal gains, very niche applications

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
    description: 'Lower CG, improved handling. Brands: Eibach, H&R, Swift. Drop: 0.75"-1.25"',
    estimatedCost: '$400 - $800',
    estimatedCostLow: 400,
    estimatedCostHigh: 800,
    deltas: {
      gripCornering: 0.5,
      trackPace: 0.3,
      drivability: -0.3,
    },
    metricChanges: {
      lateralGImprovement: 0.02,
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
    description: 'Adjustable height + damping. Brands: KW V1/V2, BC Racing, Fortune Auto.',
    estimatedCost: '$1,500 - $3,000',
    estimatedCostLow: 1500,
    estimatedCostHigh: 3000,
    deltas: {
      gripCornering: 1,
      trackPace: 0.5,
      drivability: -0.5,
    },
    metricChanges: {
      lateralGImprovement: 0.05,
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
    description: '2/3-way adjustable dampers. Brands: KW V3, Ohlins, JRZ, MCS.',
    estimatedCost: '$3,000 - $6,000',
    estimatedCostLow: 3000,
    estimatedCostHigh: 6000,
    deltas: {
      gripCornering: 2,
      trackPace: 1.5,
      drivability: -1.5,
    },
    metricChanges: {
      lateralGImprovement: 0.1,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'sway-bars',
    name: 'Adjustable Sway Bars',
    slug: 'sway-bars',
    type: 'module',
    category: 'chassis',
    tier: 'trackPack',
    description: 'Tune understeer/oversteer balance. Brands: Whiteline, Hotchkis, Progress.',
    estimatedCost: '$600 - $1,200',
    estimatedCostLow: 600,
    estimatedCostHigh: 1200,
    deltas: {
      gripCornering: 0.5,
      trackPace: 0.3,
    },
    metricChanges: {
      lateralGImprovement: 0.02,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'chassis-bracing',
    name: 'Chassis Bracing',
    slug: 'chassis-bracing',
    type: 'module',
    category: 'chassis',
    tier: 'trackPack',
    description: 'Strut tower bars, subframe braces. Reduces flex, improves response.',
    estimatedCost: '$500 - $1,500',
    estimatedCostLow: 500,
    estimatedCostHigh: 1500,
    deltas: {
      gripCornering: 0.3,
      trackPace: 0.2,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },

  // ============================================================================
  // BRAKE MODULES
  // ============================================================================
  {
    key: 'brake-pads-street',
    name: 'Performance Pads',
    slug: 'brake-pads-street',
    type: 'module',
    category: 'brakes',
    tier: 'streetSport',
    description: 'Street compound with improved bite. Brands: EBC Yellowstuff, Hawk HPS.',
    estimatedCost: '$200 - $500',
    estimatedCostLow: 200,
    estimatedCostHigh: 500,
    deltas: {
      braking: 0.5,
      trackPace: 0.2,
    },
    metricChanges: {
      brakingImprovement: 3,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'brake-pads-track',
    name: 'Track Brake Pads',
    slug: 'brake-pads-track',
    type: 'module',
    category: 'brakes',
    tier: 'trackPack',
    description: 'High-temp track compound. Brands: Hawk DTC-60, Ferodo DS2500, Pagid.',
    estimatedCost: '$400 - $800',
    estimatedCostLow: 400,
    estimatedCostHigh: 800,
    deltas: {
      braking: 1.0,
      trackPace: 0.4,
      drivability: -0.3, // Cold bite reduced
    },
    metricChanges: {
      brakingImprovement: 6,
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
    description: 'Motul RBF 600 fluid + stainless braided lines for firm pedal feel.',
    estimatedCost: '$200 - $400',
    estimatedCostLow: 200,
    estimatedCostHigh: 400,
    deltas: {
      braking: 0.5,
      reliabilityHeat: 0.3,
    },
    metricChanges: {
      brakingImprovement: 2,
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
    description: 'Larger rotors + multi-piston calipers. Brands: StopTech, Brembo, AP Racing.',
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
  {
    key: 'slotted-rotors',
    name: 'Slotted/Drilled Rotors',
    slug: 'slotted-rotors',
    type: 'module',
    category: 'brakes',
    tier: 'streetSport',
    description: 'Better heat dissipation and pad degassing. Brands: StopTech, Brembo.',
    estimatedCost: '$400 - $800',
    estimatedCostLow: 400,
    estimatedCostHigh: 800,
    deltas: {
      braking: 0.3,
      reliabilityHeat: 0.2,
    },
    metricChanges: {
      brakingImprovement: 2,
    },
    carSlug: null,
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },

  // ============================================================================
  // DRIVETRAIN MODULES
  // ============================================================================
  {
    key: 'clutch-upgrade',
    name: 'Performance Clutch / Torque Converter',
    slug: 'clutch-upgrade',
    type: 'module',
    category: 'drivetrain',
    tier: 'trackPack',
    description:
      'Upgraded clutch (manual/DCT) or torque converter (automatic) for higher torque capacity. Essential for high-power builds. Brands: ACT, Clutch Masters, Exedy, South Bend, Circle D.',
    estimatedCost: '$800 - $2,500',
    estimatedCostLow: 800,
    estimatedCostHigh: 2500,
    deltas: {
      reliabilityHeat: 0.5,
      drivability: -0.2,
    },
    metricChanges: {},
    carSlug: null,
    // Universal - applies to all transmission types
    applicableLayouts: ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  },
  {
    key: 'driveshaft-upgrade',
    name: 'Performance Driveshaft',
    slug: 'driveshaft-upgrade',
    type: 'module',
    category: 'drivetrain',
    tier: 'trackPack',
    description:
      'Carbon fiber or aluminum driveshaft. Reduces rotational mass and handles higher torque. Essential for high-power RWD/AWD builds. Brands: Driveshaft Shop, QA1.',
    estimatedCost: '$600 - $1,500',
    estimatedCostLow: 600,
    estimatedCostHigh: 1500,
    deltas: {
      reliabilityHeat: 0.3,
    },
    metricChanges: {
      zeroToSixtyImprovement: 0.05,
    },
    carSlug: null,
    // Universal for RWD/AWD layouts - not applicable to FWD
    applicableLayouts: ['Front-Engine', 'Mid-Engine', 'Rear-Engine'],
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
  // WHEELS MODULE
  // Note: Tire compound selection is handled by WheelTireConfigurator
  // ============================================================================
  {
    key: 'wheels-lightweight',
    name: 'Lightweight Wheels',
    slug: 'wheels-lightweight',
    type: 'module',
    category: 'wheels',
    tier: 'trackPack',
    description:
      'Forged or flow-formed wheels reduce unsprung & rotational mass. Brands: BBS, Volk, Enkei, Apex.',
    estimatedCost: '$2,000 - $4,000',
    estimatedCostLow: 2000,
    estimatedCostHigh: 4000,
    deltas: {
      gripCornering: 0.5,
      braking: 0.3,
      trackPace: 0.5,
    },
    metricChanges: {
      zeroToSixtyImprovement: 0.1, // Less rotational mass
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
 * Detect engine type from car data for upgrade compatibility
 * @param {Object} car - Car object with engine field
 * @returns {string} - Engine type identifier
 */
export function getEngineType(car) {
  if (!car || !car.engine) return 'unknown';

  const engine = car.engine.toLowerCase();

  // Supercharged engines
  if (engine.includes('sc') || engine.includes('supercharged')) {
    if (engine.includes('v8')) return 'SC V8';
    if (engine.includes('v6')) return 'SC V6';
    return 'SC';
  }

  // Turbocharged engines
  if (engine.includes('turbo') || engine.includes('tt') || engine.includes('biturbo')) {
    if (engine.includes('v8')) return 'Turbo V8';
    if (engine.includes('v6')) return 'Turbo V6';
    if (engine.includes('v12')) return 'Turbo V12';
    if (engine.includes('flat') || engine.includes('h6')) return 'Turbo Flat-6';
    if (engine.includes('i6') || engine.includes('l6') || engine.match(/[0-9]\.[0-9]l?\s*(i6|6)/))
      return 'Turbo I6';
    if (engine.includes('i4') || engine.includes('4-cyl') || engine.match(/[12]\.[0-9]l?\s*t/))
      return 'Turbo I4';
    return 'Turbo';
  }

  // Naturally aspirated engines
  // Check for flat-plane or flat engines (Porsche, some Ferraris)
  if (engine.includes('flat') || engine.includes('h6') || engine.includes('fp')) {
    if (engine.includes('v8') || engine.includes('fp v8') || engine.includes('fp8')) return 'NA V8'; // Flat-plane V8 like GT350
    return 'NA Flat-6';
  }

  // Standard NA engines
  if (engine.includes('v12')) return 'NA V12';
  if (engine.includes('v10')) return 'NA V10';
  if (engine.includes('v8')) return 'NA V8';
  if (engine.includes('v6')) return 'NA V6';
  if (engine.includes('i6') || engine.includes('l6')) return 'NA I6';
  if (engine.includes('i4') || engine.includes('4-cyl')) return 'NA I4';

  // Check by displacement patterns
  if (engine.match(/5\.[0-9]l|6\.[0-9]l|7\.[0-9]l/)) return 'NA V8';
  if (engine.match(/3\.[0-9]l|4\.[0-9]l/) && !engine.includes('turbo')) return 'NA V6';

  return 'unknown';
}

/**
 * Get HP gain multiplier based on engine type and upgrade type
 * @param {Object} car - Car object
 * @param {Object} upgrade - Upgrade object
 * @returns {number} - Multiplier for HP gains
 */
export function getHpGainMultiplier(car, upgrade) {
  const engineType = getEngineType(car);
  const baseHp = car.hp || 400;

  // For forced induction upgrades, scale based on engine type
  if (upgrade.category === 'forcedInduction') {
    // Already turbocharged/supercharged cars get less gain from "adding" FI
    if (engineType.includes('Turbo') || engineType.includes('SC')) {
      // These cars are upgrading existing FI, not adding new
      if (upgrade.key.includes('upgrade') || upgrade.key.includes('pulley')) {
        return 1.0; // Full gains for appropriate upgrades
      }
      return 0; // Can't add supercharger to turbo car etc
    }

    // NA V8s respond best to forced induction
    if (engineType === 'NA V8') {
      // Scale by displacement/power - higher HP cars get more from boost
      if (baseHp > 500) return 1.2; // High-strung NA V8s like GT350 Voodoo
      if (baseHp > 400) return 1.0;
      return 0.85;
    }

    // NA V6s get good gains
    if (engineType === 'NA V6') return 0.7;

    // Flat-6 (Porsche GT3 etc) - limited FI options
    if (engineType === 'NA Flat-6') return 0.5;

    // Exotic NA engines (V10, V12) - limited but possible
    if (engineType === 'NA V10') return 0.6;
    if (engineType === 'NA V12') return 0.5;
  }

  // For NA bolt-ons, scale by engine type
  if (upgrade.category === 'power' && !upgrade.key.includes('forged')) {
    // Stage tunes (stage1, stage2, stage3) are already calibrated for their engine types
    // Do NOT apply the turbo multiplier to them - their HP gains are accurate as-is
    const isPreCalibratedTune =
      upgrade.key?.includes('stage1') ||
      upgrade.key?.includes('stage2') ||
      upgrade.key?.includes('stage3') ||
      upgrade.key?.includes('piggyback');

    if (isPreCalibratedTune) {
      return 1.0; // Stage tunes already have accurate gains for turbo/SC cars
    }

    // NA V8s respond well to bolt-ons
    if (engineType === 'NA V8') return 1.0;
    // Turbo cars get gains from intake/exhaust due to boost increase potential
    // But gains are modest for individual bolt-ons (intake ~8HP, downpipe ~20HP)
    if (engineType.includes('Turbo')) return 1.0; // Changed from 1.3 - values already calibrated
    // SC cars get moderate gains
    if (engineType.includes('SC')) return 1.0; // Changed from 1.1 - values already calibrated
    // Smaller engines get proportionally less
    if (engineType.includes('V6')) return 0.85;
    if (engineType.includes('I4')) return 0.7;
    if (engineType.includes('Flat-6')) return 0.9;
  }

  return 1.0;
}

/**
 * Check if an upgrade is compatible with a car's engine type
 * @param {Object} car - Car object
 * @param {Object} upgrade - Upgrade object
 * @returns {boolean}
 */
export function isUpgradeCompatible(car, upgrade) {
  const engineType = getEngineType(car);

  // If upgrade doesn't specify engine requirements, it's universal
  if (!upgrade.applicableEngines || upgrade.applicableEngines.length === 0) {
    return true;
  }

  // Check if car's engine type matches any applicable engine
  return upgrade.applicableEngines.some((applicable) => {
    // Exact match
    if (engineType === applicable) return true;

    // Check aspiration compatibility - turbo upgrades only for turbo cars, etc.
    const upgradeIsTurbo = applicable.startsWith('Turbo');
    const upgradeIsSC = applicable.startsWith('SC');
    const upgradeIsNA = applicable.startsWith('NA');

    const carIsTurbo = engineType.startsWith('Turbo');
    const carIsSC = engineType.startsWith('SC');
    const carIsNA = engineType.startsWith('NA');

    // If upgrade specifically requires Turbo, only allow Turbo cars
    if (upgradeIsTurbo && !carIsTurbo) return false;
    // If upgrade specifically requires SC, only allow SC cars
    if (upgradeIsSC && !carIsSC) return false;
    // If upgrade specifically requires NA, only allow NA cars
    if (upgradeIsNA && !carIsNA) return false;

    // Now check engine size/type compatibility (V8, V6, I4, Flat-6, etc.)
    const getBaseEngine = (type) => type.replace(/^(NA |Turbo |SC )/, '');
    const upgradeBaseEngine = getBaseEngine(applicable);
    const carBaseEngine = getBaseEngine(engineType);

    // Match if base engine types are the same
    if (carBaseEngine === upgradeBaseEngine) return true;

    // Allow generic V8/V6 to match any V8/V6 regardless of aspiration prefix
    // ONLY if the upgrade doesn't specify aspiration
    if (!upgradeIsTurbo && !upgradeIsSC && !upgradeIsNA) {
      if (carBaseEngine === applicable || carBaseEngine.includes(applicable)) return true;
    }

    return false;
  });
}

/**
 * Get all packages for a specific car
 * @param {string} carSlug - The car's slug
 * @param {string} carLayout - The car's layout (Mid-Engine, Front-Engine, Rear-Engine)
 * @returns {UpgradePackage[]}
 */
export function getPackagesForCar(carSlug, carLayout) {
  return genericPackages.filter(
    (pkg) =>
      pkg.applicableLayouts.includes(carLayout) && (pkg.carSlug === null || pkg.carSlug === carSlug)
  );
}

/**
 * Get all modules for a specific car, filtered by engine compatibility
 * @param {Object} car - Full car object (needs engine field for compatibility check)
 * @param {string} carLayout - The car's layout
 * @returns {UpgradePackage[]}
 */
export function getModulesForCar(car, carLayout) {
  const carSlug = typeof car === 'string' ? car : car?.slug;

  return upgradeModules.filter((mod) => {
    // Check layout compatibility
    if (!mod.applicableLayouts.includes(carLayout)) return false;

    // Check car-specific restriction
    if (mod.carSlug !== null && mod.carSlug !== carSlug) return false;

    // Check engine compatibility if car object provided
    if (typeof car === 'object' && car !== null) {
      if (!isUpgradeCompatible(car, mod)) return false;
    }

    return true;
  });
}

/**
 * Get modules by category
 * @param {string} category - Module category key
 * @returns {UpgradePackage[]}
 */
export function getModulesByCategory(category) {
  return upgradeModules.filter((mod) => mod.category === category);
}

/**
 * Platform-specific downpipe gain overrides
 * Based on forum research: some platforms have efficient factory downpipes
 * that provide minimal power gains from aftermarket replacements
 * @param {Object} car - Car object with slug and engine
 * @returns {number} - Adjusted HP gain for downpipe (default 15)
 */
export function getPlatformDownpipeGain(car) {
  const slug = car?.slug?.toLowerCase() || '';
  const engine = car?.engine?.toLowerCase() || '';

  // Audi 2.9T EA839 (RS5, RS4, RS6, RS7): Factory DP already efficient
  // IE Engineering confirms Stage 2 ≈ Stage 1 power on this platform
  if (
    engine.includes('2.9') &&
    (slug.includes('rs5') || slug.includes('rs4') || slug.includes('rs6') || slug.includes('rs7'))
  ) {
    return 8; // Mainly for sound, minimal power
  }

  // Porsche turbos: Generally well-optimized from factory
  if (slug.includes('911') && engine.includes('turbo')) {
    return 10;
  }

  // BMW B58 (M340i, Supra): Known to be restrictive
  if (engine.includes('b58') || slug.includes('m340') || slug.includes('supra')) {
    return 20; // Good gains from downpipe
  }

  // Evo X 4B11: Very restrictive factory downpipe
  if (slug.includes('evo') && (slug.includes('x') || slug.includes('10'))) {
    return 25;
  }

  // Default: Use standard value
  return 15;
}

/**
 * Calculate realistic HP gains for a car with specific upgrades
 * @param {Object} car - Car object
 * @param {Object[]} upgrades - Array of upgrade objects
 * @returns {number} - Total HP gain
 */
export function calculateRealisticHpGain(car, upgrades) {
  let totalGain = 0;
  const _engineType = getEngineType(car);

  upgrades.forEach((upgrade) => {
    if (!upgrade.metricChanges?.hpGain) return;

    let baseGain = upgrade.metricChanges.hpGain;
    const multiplier = getHpGainMultiplier(car, upgrade);

    // Platform-specific downpipe adjustment
    if (upgrade.key === 'downpipe') {
      baseGain = getPlatformDownpipeGain(car);
    }

    // For supercharger on GT350 Voodoo, we should see ~250-300 HP
    // The Voodoo is particularly receptive to forced induction
    if (car.slug === 'shelby-gt350' && upgrade.key === 'supercharger-roots') {
      totalGain += 280; // Whipple on GT350 = ~750-800+ HP
    } else if (car.slug === 'shelby-gt350' && upgrade.key === 'supercharger-centrifugal') {
      totalGain += 200; // ProCharger on GT350 = ~700+ HP
    } else {
      totalGain += baseGain * multiplier;
    }
  });

  return Math.round(totalGain);
}

export default genericPackages;
