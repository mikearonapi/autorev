/**
 * Education Data Layer
 * 
 * Provides educational content from static data file.
 * 
 * Data Source:
 * - Static file: data/upgradeEducation.js (49 upgrade education entries)
 * 
 * Note: The upgrade_education database table does not exist. All data comes from
 * the static file, which is the authoritative source per DATABASE.md.
 */

import { upgradeCategories, upgradeDetails, getAllUpgradesGrouped } from '@/data/upgradeEducation';
import { systems, nodes, edges, relationshipTypes } from '@/data/connectedTissueMatrix';

// =============================================================================
// GOAL-BASED BUILD PATHS
// These define curated learning journeys for users with specific goals
// =============================================================================

export const buildGoals = {
  power: {
    key: 'power',
    name: 'More Power',
    icon: 'bolt',
    description: 'Increase horsepower and torque for faster acceleration',
    color: '#e74c3c',
    tagline: 'From bolt-ons to full builds',
  },
  handling: {
    key: 'handling',
    name: 'Better Handling',
    icon: 'car',
    description: 'Improve cornering, response, and driver connection',
    color: '#3498db',
    tagline: 'Transform how your car feels',
  },
  trackReady: {
    key: 'trackReady',
    name: 'Track Ready',
    icon: 'flag',
    description: 'Prepare your car for track days and high-performance driving',
    color: '#9b59b6',
    tagline: 'From street to circuit',
  },
  stopping: {
    key: 'stopping',
    name: 'Better Stopping',
    icon: 'brake',
    description: 'Upgrade brakes for shorter stops and fade resistance',
    color: '#f39c12',
    tagline: 'Stop faster, drive harder',
  },
  sound: {
    key: 'sound',
    name: 'Better Sound',
    icon: 'sound',
    description: 'Improve exhaust note and engine character',
    color: '#8e44ad',
    tagline: 'Make it sing',
  },
  reliability: {
    key: 'reliability',
    name: 'Reliability & Cooling',
    icon: 'thermometer',
    description: 'Keep your car running cool and reliable under stress',
    color: '#1abc9c',
    tagline: 'Built to last',
  },
};

// =============================================================================
// BUILD PATHS - Staged progressions for each goal
// =============================================================================

export const buildPaths = {
  power: {
    goal: buildGoals.power,
    stages: [
      {
        stage: 1,
        name: 'First Steps',
        budget: '$500 - $1,500',
        description: 'Safe, reversible modifications that unlock hidden potential',
        upgrades: ['cold-air-intake', 'high-flow-air-filter', 'ecu-tune'],
        primaryUpgrade: 'ecu-tune',
        expectedGains: '15-40 hp (varies by platform)',
        concepts: [
          { type: 'PAIRS_WELL', text: 'Intake + tune work together - the tune adjusts for increased airflow' },
        ],
        considerations: [
          'Turbocharged cars see much larger gains from tuning',
          'Always use the fuel octane your tune requires',
        ],
      },
      {
        stage: 2,
        name: 'Serious Gains',
        budget: '$2,000 - $5,000',
        description: 'Significant power increases that may require supporting mods',
        upgrades: ['downpipe', 'intercooler', 'cat-back-exhaust', 'hpfp-upgrade'],
        primaryUpgrade: 'downpipe',
        expectedGains: '40-80 hp on turbo cars',
        concepts: [
          { type: 'REQUIRES', text: 'Stage 2+ tunes REQUIRE a downpipe - it\'s not optional' },
          { type: 'STRESSES', text: 'More power stresses your clutch - watch for slipping' },
        ],
        prerequisites: ['Stage 1 tune or be prepared to retune'],
        considerations: [
          'Downpipes may have emissions implications',
          'Intercooler upgrades prevent heat soak on hot days',
        ],
      },
      {
        stage: 3,
        name: 'Maximum Attack',
        budget: '$8,000 - $20,000+',
        description: 'Major power builds requiring comprehensive upgrades',
        upgrades: ['turbo-upgrade-existing', 'fuel-system-upgrade', 'clutch-upgrade', 'forged-internals'],
        primaryUpgrade: 'turbo-upgrade-existing',
        expectedGains: '100-300+ hp',
        concepts: [
          { type: 'REQUIRES', text: 'Big turbos REQUIRE upgraded fuel systems - stock can\'t keep up' },
          { type: 'STRESSES', text: 'This power level stresses drivetrain, cooling, and engine internals' },
        ],
        prerequisites: ['Complete Stage 1 & 2', 'Upgraded clutch', 'Consider engine internals'],
        considerations: [
          'Professional installation and tuning essential',
          'Budget for supporting mods (cooling, drivetrain)',
          'Consider engine internals for longevity',
        ],
      },
    ],
  },
  handling: {
    goal: buildGoals.handling,
    stages: [
      {
        stage: 1,
        name: 'Foundation',
        budget: '$1,000 - $2,500',
        description: 'Improve response and reduce body roll without sacrificing ride quality',
        upgrades: ['performance-tires', 'sway-bars', 'performance-alignment'],
        primaryUpgrade: 'performance-tires',
        expectedGains: 'Noticeably sharper turn-in and grip',
        concepts: [
          { type: 'PAIRS_WELL', text: 'Tires + alignment go together - new tires need proper setup' },
        ],
        considerations: [
          'Tires are the single biggest handling upgrade',
          'Sway bars reduce roll without harshening the ride',
        ],
      },
      {
        stage: 2,
        name: 'Dialed In',
        budget: '$2,500 - $5,000',
        description: 'Comprehensive handling upgrade with adjustability',
        upgrades: ['coilovers-street', 'chassis-bracing', 'lightweight-wheels'],
        primaryUpgrade: 'coilovers-street',
        expectedGains: 'Transformed handling character',
        concepts: [
          { type: 'INVALIDATES', text: 'Coilovers change ride height → alignment is REQUIRED after install' },
          { type: 'PAIRS_WELL', text: 'Chassis bracing + coilovers maximize suspension effectiveness' },
        ],
        prerequisites: ['Performance alignment budget'],
        considerations: [
          'Quality coilovers maintain ride comfort while improving handling',
          'Cheap coilovers often ride worse than stock',
        ],
      },
      {
        stage: 3,
        name: 'Track Weapon',
        budget: '$5,000 - $12,000+',
        description: 'Track-focused handling with aggressive spring rates',
        upgrades: ['coilovers-track', 'control-arms', 'polyurethane-bushings', 'competition-tires'],
        primaryUpgrade: 'coilovers-track',
        expectedGains: 'Lap time focused - may sacrifice daily comfort',
        concepts: [
          { type: 'COMPROMISES', text: 'Track suspension compromises street comfort' },
          { type: 'REQUIRES', text: 'Aggressive camber may require adjustable control arms' },
        ],
        prerequisites: ['Stage 2 handling', 'Brake upgrades recommended'],
        considerations: [
          'Stiff springs require matched damper valving',
          'Not recommended as daily driver setup',
        ],
      },
    ],
  },
  trackReady: {
    goal: buildGoals.trackReady,
    stages: [
      {
        stage: 1,
        name: 'Track Day Starter',
        budget: '$1,500 - $3,000',
        description: 'Essential upgrades for your first track days',
        upgrades: ['brake-pads-track', 'brake-fluid-lines', 'performance-tires', 'high-temp-fluids'],
        primaryUpgrade: 'brake-pads-track',
        expectedGains: 'Safe, confident track driving',
        concepts: [
          { type: 'REQUIRES', text: 'Track pads REQUIRE high-temp brake fluid - stock fluid will boil' },
          { type: 'STRESSES', text: 'Track driving stresses brakes heavily - pads and fluid are safety items' },
        ],
        considerations: [
          'Track pads have reduced cold bite - may be grabby on street',
          'Change brake fluid before every track day',
        ],
      },
      {
        stage: 2,
        name: 'Competitive Pace',
        budget: '$5,000 - $10,000',
        description: 'Upgrades for serious lap times and repeated hard use',
        upgrades: ['big-brake-kit', 'coilovers-track', 'oil-cooler', 'brake-cooling-ducts'],
        primaryUpgrade: 'big-brake-kit',
        expectedGains: '2-5 seconds per lap on most tracks',
        concepts: [
          { type: 'INVALIDATES', text: 'BBK changes brake bias - may need rear adjustment' },
          { type: 'PAIRS_WELL', text: 'Oil cooler + track coilovers = sustainable performance' },
        ],
        prerequisites: ['Stage 1 track prep', 'Know your car\'s limits'],
        considerations: [
          'Big brakes require wheels that clear larger calipers',
          'Oil temp is critical - overheating destroys engines',
        ],
      },
      {
        stage: 3,
        name: 'Time Attack',
        budget: '$15,000 - $40,000+',
        description: 'Full track build with aero, safety, and maximum grip',
        upgrades: ['tires-slicks', 'front-splitter', 'rear-wing', 'roll-bar', 'racing-harness'],
        primaryUpgrade: 'tires-slicks',
        expectedGains: '5-10+ seconds per lap',
        concepts: [
          { type: 'REQUIRES', text: 'Slicks require roll bar for most sanctioning bodies' },
          { type: 'INVALIDATES', text: 'Major aero changes the handling balance completely' },
        ],
        prerequisites: ['Complete Stage 1 & 2', 'Driver skill development'],
        considerations: [
          'R-compound tires are track-only - dangerous in rain',
          'Aero must be balanced front/rear',
          'Safety equipment is not optional at this level',
        ],
      },
    ],
  },
  stopping: {
    goal: buildGoals.stopping,
    stages: [
      {
        stage: 1,
        name: 'Better Bite',
        budget: '$400 - $800',
        description: 'Improve stopping power and pedal feel with simple upgrades',
        upgrades: ['brake-pads-street', 'brake-fluid-lines'],
        primaryUpgrade: 'brake-pads-street',
        expectedGains: 'Shorter stops, better pedal feel',
        concepts: [
          { type: 'PAIRS_WELL', text: 'Pads + stainless lines = firm, consistent pedal' },
        ],
        considerations: [
          'Match pad compound to your driving style',
          'Stainless lines eliminate spongy pedal feel',
        ],
      },
      {
        stage: 2,
        name: 'Fade Fighter',
        budget: '$800 - $2,000',
        description: 'Reduce brake fade during spirited driving',
        upgrades: ['brake-pads-track', 'slotted-rotors', 'high-temp-brake-fluid'],
        primaryUpgrade: 'brake-pads-track',
        expectedGains: 'Consistent stopping even when hot',
        concepts: [
          { type: 'REQUIRES', text: 'Track pads need high-temp fluid - they run much hotter' },
          { type: 'COMPROMISES', text: 'Track pads have less bite when cold' },
        ],
        considerations: [
          'Great for canyon drives and occasional track use',
          'May be noisy on street',
        ],
      },
      {
        stage: 3,
        name: 'Big Brake Kit',
        budget: '$3,000 - $8,000+',
        description: 'Maximum stopping power with larger rotors and calipers',
        upgrades: ['big-brake-kit', 'brake-cooling-ducts'],
        primaryUpgrade: 'big-brake-kit',
        expectedGains: 'Dramatically shorter stops, no fade',
        concepts: [
          { type: 'INVALIDATES', text: 'BBK changes brake bias - verify balance is safe' },
          { type: 'REQUIRES', text: 'Verify wheel clearance before purchasing' },
        ],
        prerequisites: ['Wheels that clear larger calipers'],
        considerations: [
          'Most impactful for track use',
          'Overkill for street-only use on most cars',
        ],
      },
    ],
  },
  sound: {
    goal: buildGoals.sound,
    stages: [
      {
        stage: 1,
        name: 'Subtle Enhancement',
        budget: '$300 - $800',
        description: 'Open up the exhaust note without being obnoxious',
        upgrades: ['muffler-delete', 'resonator-delete'],
        primaryUpgrade: 'muffler-delete',
        expectedGains: 'Deeper, more present exhaust note',
        concepts: [],
        considerations: [
          'Reversible and cheap to try',
          'May be too loud for some - test before committing',
        ],
      },
      {
        stage: 2,
        name: 'Proper Exhaust',
        budget: '$800 - $2,500',
        description: 'Quality cat-back system with engineered tone',
        upgrades: ['cat-back-exhaust'],
        primaryUpgrade: 'cat-back-exhaust',
        expectedGains: 'Refined, purposeful exhaust note + small power gains',
        concepts: [
          { type: 'PAIRS_WELL', text: 'Exhaust + tune together maximize both sound and power' },
        ],
        considerations: [
          'Quality systems are tuned to avoid drone',
          'Match loudness to your tolerance and neighbors',
        ],
      },
      {
        stage: 3,
        name: 'Full System',
        budget: '$2,000 - $5,000+',
        description: 'Headers and full exhaust for maximum sound and power',
        upgrades: ['headers', 'cat-back-exhaust', 'downpipe'],
        primaryUpgrade: 'headers',
        expectedGains: 'Significant power + dramatic sound change',
        concepts: [
          { type: 'REQUIRES', text: 'Headers REQUIRE a tune to run properly' },
          { type: 'INVALIDATES', text: 'Full exhaust changes AFR - tune is mandatory' },
        ],
        prerequisites: ['ECU tune (budgeted)'],
        considerations: [
          'Headers are labor-intensive to install',
          'May have emissions/legal implications',
        ],
      },
    ],
  },
  reliability: {
    goal: buildGoals.reliability,
    stages: [
      {
        stage: 1,
        name: 'Temperature Control',
        budget: '$500 - $1,500',
        description: 'Keep operating temps in check during hard driving',
        upgrades: ['oil-cooler', 'high-temp-fluids'],
        primaryUpgrade: 'oil-cooler',
        expectedGains: 'Consistent oil temps under load',
        concepts: [
          { type: 'PAIRS_WELL', text: 'Oil cooler + quality fluids protect your engine investment' },
        ],
        considerations: [
          'Essential for track use or hot climates',
          'Monitor temps to verify effectiveness',
        ],
      },
      {
        stage: 2,
        name: 'Complete Cooling',
        budget: '$1,500 - $3,500',
        description: 'Comprehensive cooling for sustained high-performance use',
        upgrades: ['radiator-upgrade', 'trans-cooler', 'diff-cooler'],
        primaryUpgrade: 'radiator-upgrade',
        expectedGains: 'Run hard without heat-related issues',
        concepts: [
          { type: 'STRESSES', text: 'Power mods increase heat - cooling keeps everything safe' },
        ],
        prerequisites: ['Oil cooler (if not included)'],
        considerations: [
          'Aluminum radiators cool better and are lighter',
          'Trans cooler critical for automatic transmissions',
        ],
      },
      {
        stage: 3,
        name: 'Built to Last',
        budget: '$3,000 - $10,000+',
        description: 'Drivetrain upgrades to handle increased power reliably',
        upgrades: ['clutch-upgrade', 'axles-halfshafts', 'forged-internals'],
        primaryUpgrade: 'clutch-upgrade',
        expectedGains: 'Reliable power delivery at higher levels',
        concepts: [
          { type: 'STRESSES', text: 'High power stresses clutch, axles, diff - upgrade proactively' },
        ],
        prerequisites: ['Know your power goals'],
        considerations: [
          'Upgrade before parts fail, not after',
          'Match component strength to power target',
        ],
      },
    ],
  },
};

// =============================================================================
// DATA FETCHING FUNCTIONS
// =============================================================================

/**
 * Get upgrade education content from static data.
 * 
 * Note: The upgrade_education database table does not exist.
 * All data comes from the static file data/upgradeEducation.js.
 * 
 * @returns {{ data: Object, source: string }} Grouped upgrade education data
 */
export async function getUpgradeEducation() {
  // Data comes from static file - no database table exists
  return { data: getAllUpgradesGrouped(), source: 'static' };
}


/**
 * Get a single upgrade by key from static data.
 * 
 * Note: The upgrade_education database table does not exist.
 * All data comes from the static file data/upgradeEducation.js.
 * 
 * @param {string} key - The upgrade key to look up
 * @returns {{ data: Object|null, source: string }} Upgrade data if found
 */
export async function getUpgradeByKey(key) {
  // Data comes from static file - no database table exists
  const upgrade = upgradeDetails[key] || null;
  return { data: upgrade, source: 'static' };
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Re-export local data for fallback and reference
  upgradeCategories,
  upgradeDetails,
  getAllUpgradesGrouped,
  systems,
  nodes,
  edges,
  relationshipTypes,
};

export default {
  buildGoals,
  buildPaths,
  getUpgradeEducation,
  getUpgradeByKey,
  upgradeCategories,
  upgradeDetails,
  systems,
  nodes,
  edges,
};





















