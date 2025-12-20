/**
 * Modification Categories - Restructured
 * 
 * This module defines the new 12-category structure for Modifications
 * as part of the Encyclopedia 3-section restructure.
 * 
 * Changes from original upgradeCategories:
 * - Renamed categories to align with Automotive Systems
 * - Added linkedLearnTopic requirements
 * - Created new categories: fuel-system, ecu-tuning
 * - Marked safety and weightReduction for Build Guide migration
 * 
 * @module modificationCategories
 */

// =============================================================================
// CATEGORY DEFINITIONS (12 total, 10 active + 2 migrated to Build Guides)
// =============================================================================

export const modificationCategories = {
  // ---------------------------------------------------------------------------
  // ENGINE MODS (renamed from 'power')
  // ---------------------------------------------------------------------------
  engine: {
    key: 'engine',
    name: 'Engine Mods',
    icon: 'bolt',
    description: 'Internal engine modifications that increase horsepower, torque, and engine capability. From camshafts to forged internals.',
    color: '#e74c3c',
    linkedSystems: ['engine'],
    sortOrder: 1,
  },

  // ---------------------------------------------------------------------------
  // COOLING MODS (split from 'cooling')
  // ---------------------------------------------------------------------------
  cooling: {
    key: 'cooling',
    name: 'Cooling Mods',
    icon: 'thermometer',
    description: 'Keep your engine, transmission, and differentials running cool under stress. Essential for track days and hot climates.',
    color: '#1abc9c',
    linkedSystems: ['cooling', 'engine'],
    sortOrder: 2,
  },

  // ---------------------------------------------------------------------------
  // DRIVETRAIN MODS (renamed from 'drivetrain')
  // ---------------------------------------------------------------------------
  drivetrain: {
    key: 'drivetrain',
    name: 'Drivetrain Mods',
    icon: 'gears',
    description: 'Upgrades to the clutch, flywheel, differential, and driveline components. Critical for putting power to the ground reliably.',
    color: '#e67e22',
    linkedSystems: ['drivetrain'],
    sortOrder: 3,
  },

  // ---------------------------------------------------------------------------
  // FUEL SYSTEM MODS (NEW - extracted from power)
  // ---------------------------------------------------------------------------
  'fuel-system': {
    key: 'fuel-system',
    name: 'Fuel System Mods',
    icon: 'fuel',
    description: 'Fuel delivery upgrades for increased power demands. From high-pressure fuel pumps to complete fuel system overhauls.',
    color: '#f1c40f',
    linkedSystems: ['fuel-system'],
    sortOrder: 4,
  },

  // ---------------------------------------------------------------------------
  // ECU & TUNING (NEW - consolidated tuning content)
  // ---------------------------------------------------------------------------
  'ecu-tuning': {
    key: 'ecu-tuning',
    name: 'ECU & Tuning',
    icon: 'cpu',
    description: 'Electronic control unit modifications and engine calibration. The brain of your engine—unlock hidden power through software.',
    color: '#9b59b6',
    linkedSystems: ['engine-management'],
    sortOrder: 5,
  },

  // ---------------------------------------------------------------------------
  // INTAKE & FORCED INDUCTION MODS (renamed from 'forcedInduction')
  // ---------------------------------------------------------------------------
  'intake-fi': {
    key: 'intake-fi',
    name: 'Intake & Forced Induction Mods',
    icon: 'turbo',
    description: 'Air intake improvements and forced induction systems. From cold air intakes to superchargers and turbo kits for massive power gains.',
    color: '#8e44ad',
    linkedSystems: ['intake-forced-induction'],
    sortOrder: 6,
  },

  // ---------------------------------------------------------------------------
  // EXHAUST MODS (renamed from 'exhaust')
  // ---------------------------------------------------------------------------
  exhaust: {
    key: 'exhaust',
    name: 'Exhaust Mods',
    icon: 'sound',
    description: 'Exhaust modifications improve flow, reduce restriction, and change your car\'s voice. From subtle tone improvements to aggressive race notes.',
    color: '#8e44ad',
    linkedSystems: ['exhaust'],
    sortOrder: 7,
  },

  // ---------------------------------------------------------------------------
  // SUSPENSION & STEERING MODS (renamed from 'suspension')
  // ---------------------------------------------------------------------------
  suspension: {
    key: 'suspension',
    name: 'Suspension & Steering Mods',
    icon: 'car',
    description: 'Suspension upgrades transform how your car handles corners, responds to driver input, and manages weight transfer. The foundation of any serious build.',
    color: '#3498db',
    linkedSystems: ['suspension-steering'],
    sortOrder: 8,
  },

  // ---------------------------------------------------------------------------
  // AERO MODS (renamed from 'aero')
  // ---------------------------------------------------------------------------
  aero: {
    key: 'aero',
    name: 'Aero Mods',
    icon: 'wind',
    description: 'Aerodynamic upgrades create downforce and improve high-speed stability. From subtle improvements to full race aero packages.',
    color: '#34495e',
    linkedSystems: ['aerodynamics'],
    sortOrder: 9,
  },

  // ---------------------------------------------------------------------------
  // BRAKE MODS (renamed from 'brakes')
  // ---------------------------------------------------------------------------
  brakes: {
    key: 'brakes',
    name: 'Brake Mods',
    icon: 'brake',
    description: 'Brake upgrades improve stopping power, fade resistance, and pedal feel. Critical for track use and spirited driving.',
    color: '#f39c12',
    linkedSystems: ['brakes'],
    sortOrder: 10,
  },

  // ---------------------------------------------------------------------------
  // WHEELS & TIRES (unchanged)
  // ---------------------------------------------------------------------------
  wheels: {
    key: 'wheels',
    name: 'Wheels & Tires',
    icon: 'tire',
    description: 'The only thing connecting your car to the road. Quality wheels and tires are often the single biggest performance upgrade you can make.',
    color: '#2ecc71',
    linkedSystems: ['suspension-steering'],
    sortOrder: 11,
  },

  // ---------------------------------------------------------------------------
  // ENGINE SWAPS (unchanged)
  // ---------------------------------------------------------------------------
  engineSwaps: {
    key: 'engineSwaps',
    name: 'Engine Swaps',
    icon: 'engine',
    description: 'Complete engine replacement with a more powerful or capable powerplant. The ultimate performance modification.',
    color: '#c0392b',
    linkedSystems: ['engine', 'drivetrain', 'engine-management'],
    sortOrder: 12,
  },

  // ---------------------------------------------------------------------------
  // DEPRECATED: These categories migrate to Build Guides
  // Content is preserved but not shown in Modifications navigation
  // ---------------------------------------------------------------------------
  safety: {
    key: 'safety',
    name: 'Safety & Track Prep',
    icon: 'shield',
    description: 'Safety equipment for track use. DEPRECATED: This content has been moved to the Track Day Prep build guide.',
    color: '#c0392b',
    linkedSystems: [],
    sortOrder: 99,
    deprecated: true,
    migratedTo: 'track-day-prep', // Build guide slug
  },

  weightReduction: {
    key: 'weightReduction',
    name: 'Weight Reduction',
    icon: 'feather',
    description: 'Lightweight components and weight reduction strategies. DEPRECATED: This content has been moved to the Weight Reduction build guide.',
    color: '#7f8c8d',
    linkedSystems: [],
    sortOrder: 99,
    deprecated: true,
    migratedTo: 'weight-reduction', // Build guide slug
  },
};

// =============================================================================
// ACTIVE CATEGORIES (excludes deprecated)
// =============================================================================

export const activeCategories = Object.fromEntries(
  Object.entries(modificationCategories).filter(([_, cat]) => !cat.deprecated)
);

export const activeCategoryKeys = Object.keys(activeCategories);

// =============================================================================
// CATEGORY KEY MIGRATION MAP (old key → new key)
// =============================================================================

export const categoryKeyMigration = {
  'power': 'engine',           // power → engine (partial, some go to ecu-tuning/fuel-system/intake-fi)
  'forcedInduction': 'intake-fi',
  'exhaust': 'exhaust',        // unchanged
  'suspension': 'suspension',  // unchanged
  'brakes': 'brakes',          // unchanged  
  'wheels': 'wheels',          // unchanged
  'cooling': 'cooling',        // unchanged
  'aero': 'aero',              // unchanged
  'drivetrain': 'drivetrain',  // unchanged
  'safety': 'safety',          // deprecated
  'weightReduction': 'weightReduction', // deprecated
  'engineSwaps': 'engineSwaps', // unchanged
};

// =============================================================================
// MODIFICATION → TOPIC LINKING
// Maps each modification to its related Automotive Systems topic(s)
// =============================================================================

export const modificationTopicLinks = {
  // Engine Mods (from power category)
  'camshafts': ['cam-profiles', 'cam-timing'],
  'ported-heads': ['cylinder-head', 'port-flow'],
  'forged-internals': ['connecting-rods', 'pistons', 'crankshaft'],
  'stroker-kit': ['displacement', 'stroke'],
  
  // Fuel System Mods (extracted from power)
  'hpfp-upgrade': ['lpfp-hpfp', 'injector-sizing'],
  'fuel-system-upgrade': ['lpfp-hpfp', 'injector-sizing', 'fuel-octane'],
  
  // ECU & Tuning (extracted from power)
  'ecu-tune': ['ecu-basics', 'ignition-timing', 'fuel-octane'],
  'piggyback-tune': ['ecu-basics'],
  
  // Intake & Forced Induction Mods
  'cold-air-intake': ['intake-airflow', 'maf-sensor'],
  'high-flow-air-filter': ['intake-airflow'],
  'throttle-body': ['throttle-body-basics'],
  'intake-manifold': ['intake-manifold-design'],
  'charge-pipe-upgrade': ['turbo-fundamentals', 'intercooler-types'],
  'supercharger-centrifugal': ['supercharger-types'],
  'supercharger-roots': ['supercharger-types'],
  'turbo-kit-single': ['turbo-fundamentals', 'turbo-sizing'],
  'turbo-kit-twin': ['turbo-fundamentals', 'turbo-sizing'],
  'turbo-upgrade-existing': ['turbo-fundamentals', 'turbo-sizing'],
  'pulley-tune-sc': ['supercharger-types'],
  'intercooler': ['intercooler-types'],
  'heat-exchanger-sc': ['supercharger-types'],
  
  // Exhaust Mods
  'cat-back-exhaust': ['exhaust-sound', 'exhaust-flow'],
  'headers': ['header-design'],
  'downpipe': ['downpipe-importance'],
  'resonator-delete': ['exhaust-sound'],
  'muffler-delete': ['exhaust-sound'],
  
  // Suspension & Steering Mods
  'coilovers': ['coilover-adjustment', 'spring-rate-basics', 'damper-valving'],
  'lowering-springs': ['spring-rate-basics'],
  'sway-bars': ['sway-bar-tuning'],
  'strut-tower-brace': ['chassis-bracing'],
  'subframe-connectors': ['chassis-bracing'],
  'control-arms': ['control-arm-types'],
  'polyurethane-bushings': ['bushing-materials'],
  'performance-alignment': ['alignment-settings'],
  
  // Brake Mods
  'brake-pads-performance': ['pad-compounds'],
  'brake-rotors': ['rotor-design'],
  'big-brake-kit': ['bbk-basics'],
  'braided-brake-lines': ['brake-fluid-types'],
  'high-temp-brake-fluid': ['brake-fluid-types'],
  'brake-cooling-ducts': ['brake-cooling-ducts'],
  
  // Wheels & Tires
  'performance-tires': ['tire-compound-construction', 'tire-sizing'],
  'competition-tires': ['tire-compound-construction'],
  'lightweight-wheels': ['wheel-fitment'],
  'wheel-spacers': ['wheel-fitment'],
  
  // Cooling Mods
  'oil-cooler': ['oil-cooling'],
  'radiator-upgrade': ['coolant-system'],
  'trans-cooler': ['automatic-transmission'],
  'diff-cooler': ['differential-types'],
  'high-temp-fluids': ['oil-cooling', 'coolant-system'],
  
  // Aero Mods
  'front-splitter': ['splitter-function'],
  'rear-wing': ['wing-vs-spoiler'],
  'rear-diffuser': ['diffuser-function'],
  'canards': ['downforce-drag'],
  'undertray': ['downforce-drag', 'aero-balance-tuning'],
  
  // Drivetrain Mods
  'clutch-upgrade': ['clutch-basics'],
  'lightweight-flywheel': ['flywheel-mass'],
  'limited-slip-diff': ['differential-types', 'lsd-types'],
  'short-shifter': ['manual-transmission'],
  'driveshaft-upgrade': ['driveshaft-cv-joints'],
  'axles-halfshafts': ['axle-strength'],
  
  // Safety (migrated to Build Guides)
  'racing-harness': [],
  'racing-seat': [],
  'roll-bar': [],
  'roll-cage': [],
  'fire-extinguisher': [],
  'helmet': [],
  
  // Weight Reduction (migrated to Build Guides)
  'lightweight-battery': [],
  'carbon-fiber-hood': [],
  'interior-delete': [],
  
  // Engine Swaps
  'engine-ls-family': ['displacement', 'connecting-rods'],
  'engine-coyote': ['displacement', 'cam-profiles'],
  'engine-2jz': ['turbo-fundamentals'],
  'engine-b58': ['turbo-fundamentals'],
  'engine-k-series': ['cam-profiles', 'intake-manifold-design'],
  'engine-vr38dett': ['turbo-fundamentals'],
  'engine-porsche-flat6': ['displacement'],
  'engine-swap-kit-generic': [],
};

// =============================================================================
// MODIFICATION CATEGORY REASSIGNMENT
// Maps each modification to its NEW category
// =============================================================================

export const modificationCategoryReassignment = {
  // From 'power' → split across engine, fuel-system, ecu-tuning, intake-fi
  'cold-air-intake': 'intake-fi',
  'high-flow-air-filter': 'intake-fi',
  'throttle-body': 'intake-fi',
  'intake-manifold': 'intake-fi',
  'ecu-tune': 'ecu-tuning',
  'piggyback-tune': 'ecu-tuning',
  'camshafts': 'engine',
  'ported-heads': 'engine',
  'hpfp-upgrade': 'fuel-system',
  'fuel-system-upgrade': 'fuel-system',
  'charge-pipe-upgrade': 'intake-fi',
  'forged-internals': 'engine',
  'stroker-kit': 'engine',
  
  // From 'forcedInduction' → intake-fi
  'supercharger-centrifugal': 'intake-fi',
  'supercharger-roots': 'intake-fi',
  'turbo-kit-single': 'intake-fi',
  'turbo-kit-twin': 'intake-fi',
  'turbo-upgrade-existing': 'intake-fi',
  'pulley-tune-sc': 'intake-fi',
  'intercooler': 'intake-fi',
  'heat-exchanger-sc': 'intake-fi',
  
  // From 'exhaust' → exhaust (unchanged)
  'cat-back-exhaust': 'exhaust',
  'headers': 'exhaust',
  'downpipe': 'exhaust',
  'resonator-delete': 'exhaust',
  'muffler-delete': 'exhaust',
  
  // From 'suspension' → suspension (unchanged)
  'coilovers': 'suspension',
  'lowering-springs': 'suspension',
  'sway-bars': 'suspension',
  'strut-tower-brace': 'suspension',
  'subframe-connectors': 'suspension',
  'control-arms': 'suspension',
  'polyurethane-bushings': 'suspension',
  'performance-alignment': 'suspension',
  
  // From 'brakes' → brakes (unchanged)
  'brake-pads-performance': 'brakes',
  'brake-rotors': 'brakes',
  'big-brake-kit': 'brakes',
  'braided-brake-lines': 'brakes',
  'high-temp-brake-fluid': 'brakes',
  'brake-cooling-ducts': 'brakes',
  
  // From 'wheels' → wheels (unchanged)
  'performance-tires': 'wheels',
  'competition-tires': 'wheels',
  'lightweight-wheels': 'wheels',
  'wheel-spacers': 'wheels',
  
  // From 'cooling' → cooling (unchanged)
  'oil-cooler': 'cooling',
  'radiator-upgrade': 'cooling',
  'trans-cooler': 'cooling',
  'diff-cooler': 'cooling',
  'high-temp-fluids': 'cooling',
  
  // From 'aero' → aero (unchanged)
  'front-splitter': 'aero',
  'rear-wing': 'aero',
  'rear-diffuser': 'aero',
  'canards': 'aero',
  'undertray': 'aero',
  
  // From 'drivetrain' → drivetrain (unchanged)
  'clutch-upgrade': 'drivetrain',
  'lightweight-flywheel': 'drivetrain',
  'limited-slip-diff': 'drivetrain',
  'short-shifter': 'drivetrain',
  'driveshaft-upgrade': 'drivetrain',
  'axles-halfshafts': 'drivetrain',
  
  // From 'safety' → safety (deprecated, migrated to Build Guides)
  'racing-harness': 'safety',
  'racing-seat': 'safety',
  'roll-bar': 'safety',
  'roll-cage': 'safety',
  'fire-extinguisher': 'safety',
  'helmet': 'safety',
  
  // From 'weightReduction' → weightReduction (deprecated, migrated to Build Guides)
  'lightweight-battery': 'weightReduction',
  'carbon-fiber-hood': 'weightReduction',
  'interior-delete': 'weightReduction',
  
  // From 'engineSwaps' → engineSwaps (unchanged)
  'engine-ls-family': 'engineSwaps',
  'engine-coyote': 'engineSwaps',
  'engine-2jz': 'engineSwaps',
  'engine-b58': 'engineSwaps',
  'engine-k-series': 'engineSwaps',
  'engine-vr38dett': 'engineSwaps',
  'engine-porsche-flat6': 'engineSwaps',
  'engine-swap-kit-generic': 'engineSwaps',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the new category for a modification
 * @param {string} modKey - The modification key
 * @returns {string} The new category key
 */
export function getNewCategory(modKey) {
  return modificationCategoryReassignment[modKey] || null;
}

/**
 * Get linked topics for a modification
 * @param {string} modKey - The modification key
 * @returns {string[]} Array of topic slugs
 */
export function getLinkedTopics(modKey) {
  return modificationTopicLinks[modKey] || [];
}

/**
 * Get the primary linked topic for a modification
 * @param {string} modKey - The modification key
 * @returns {string|null} Primary topic slug or null
 */
export function getPrimaryLinkedTopic(modKey) {
  const topics = modificationTopicLinks[modKey];
  return topics && topics.length > 0 ? topics[0] : null;
}

/**
 * Check if a category is deprecated (migrated to Build Guides)
 * @param {string} categoryKey - The category key
 * @returns {boolean}
 */
export function isCategoryDeprecated(categoryKey) {
  const cat = modificationCategories[categoryKey];
  return cat?.deprecated === true;
}

/**
 * Get modifications by new category
 * @param {string} categoryKey - The new category key
 * @returns {string[]} Array of modification keys
 */
export function getModificationsByCategory(categoryKey) {
  return Object.entries(modificationCategoryReassignment)
    .filter(([_, cat]) => cat === categoryKey)
    .map(([modKey]) => modKey);
}

/**
 * Get category statistics
 * @returns {Object} Stats about the categories
 */
export function getCategoryStats() {
  const stats = {};
  
  for (const categoryKey of Object.keys(modificationCategories)) {
    const mods = getModificationsByCategory(categoryKey);
    stats[categoryKey] = {
      name: modificationCategories[categoryKey].name,
      count: mods.length,
      deprecated: modificationCategories[categoryKey].deprecated || false,
    };
  }
  
  return {
    categories: stats,
    totalCategories: Object.keys(modificationCategories).length,
    activeCategories: activeCategoryKeys.length,
    deprecatedCategories: Object.keys(modificationCategories).length - activeCategoryKeys.length,
    totalModifications: Object.keys(modificationCategoryReassignment).length,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  modificationCategories,
  activeCategories,
  activeCategoryKeys,
  categoryKeyMigration,
  modificationTopicLinks,
  modificationCategoryReassignment,
  getNewCategory,
  getLinkedTopics,
  getPrimaryLinkedTopic,
  isCategoryDeprecated,
  getModificationsByCategory,
  getCategoryStats,
};












