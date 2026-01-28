/**
 * Unified Tire Configuration - Single Source of Truth
 *
 * This module defines all tire compound/category options used across the app.
 * All components should import from here - no hardcoded tire definitions elsewhere.
 *
 * Categories are based on industry-standard classifications (Tire Rack, UTQG ratings).
 *
 * @module lib/tireConfig
 */

// =============================================================================
// TIRE COMPOUND DEFINITIONS
// =============================================================================

/**
 * Canonical tire compound options
 *
 * @property {string} id - Unique identifier (used in all systems)
 * @property {string} label - Display name
 * @property {string} shortLabel - Abbreviated label for compact UI
 * @property {string} description - User-facing description
 * @property {number} gripCoefficient - Physics multiplier (0.88 to 1.30)
 * @property {number} lateralGBonus - Additive lateral G improvement
 * @property {number} brakingImprovement - Feet reduction in 60-0 braking
 * @property {number} lapTimePercent - Percentage lap time improvement
 * @property {number} zeroToSixtyMultiplier - 0-60 time multiplier (lower = faster)
 * @property {string} utqgRange - Typical UTQG treadwear range
 * @property {string} wear - Relative wear indicator
 * @property {string[]} bestFor - Use case recommendations
 * @property {string[]} exampleBrands - Popular tire models in this category
 * @property {boolean} streetLegal - Whether DOT-legal
 * @property {boolean} trackSuitable - Recommended for track use
 */
export const TIRE_COMPOUNDS = [
  {
    id: 'touring-all-season',
    label: 'Touring All-Season',
    shortLabel: 'All-Season',
    icon: '🌤️',
    description: 'Year-round comfort, basic performance',
    gripCoefficient: 0.88,
    lateralGBonus: 0,
    brakingImprovement: 0,
    lapTimePercent: 0,
    zeroToSixtyMultiplier: 1.08,
    utqgRange: '500-700',
    wear: '+++',
    bestFor: ['Daily commute', 'Year-round use', 'Comfort'],
    exampleBrands: ['Michelin Primacy', 'Continental PureContact', 'Bridgestone Turanza'],
    streetLegal: true,
    trackSuitable: false,
  },
  {
    id: 'uhp-all-season',
    label: 'UHP All-Season',
    shortLabel: 'UHP A/S',
    icon: '⛅',
    description: 'Performance with year-round capability',
    gripCoefficient: 0.93,
    lateralGBonus: 0.03,
    brakingImprovement: 4,
    lapTimePercent: 0.015,
    zeroToSixtyMultiplier: 1.04,
    utqgRange: '400-560',
    wear: '++',
    bestFor: ['Year-round performance', 'Light snow capability', 'Daily driver'],
    exampleBrands: [
      'Michelin Pilot Sport A/S 4',
      'Continental ExtremeContact DWS 06+',
      'Pirelli P Zero A/S+',
    ],
    streetLegal: true,
    trackSuitable: false,
  },
  {
    id: 'max-summer',
    label: 'Max Performance Summer',
    shortLabel: 'Max Summer',
    icon: '☀️',
    description: 'Excellent grip, the enthusiast sweet spot',
    gripCoefficient: 1.0,
    lateralGBonus: 0.08,
    brakingImprovement: 10,
    lapTimePercent: 0.03,
    zeroToSixtyMultiplier: 1.0,
    utqgRange: '220-340',
    wear: '+',
    bestFor: ['Spirited driving', 'Occasional track days', 'Best all-around performance'],
    exampleBrands: [
      'Michelin Pilot Sport 4S',
      'Continental ExtremeContact Sport 02',
      'Pirelli P Zero PZ4',
    ],
    streetLegal: true,
    trackSuitable: true,
  },
  {
    id: 'extreme-summer',
    label: 'Extreme Performance',
    shortLabel: 'Extreme',
    icon: '🔥',
    description: 'Street-legal track tire, serious grip',
    gripCoefficient: 1.08,
    lateralGBonus: 0.12,
    brakingImprovement: 15,
    lapTimePercent: 0.05,
    zeroToSixtyMultiplier: 0.97,
    utqgRange: '140-240',
    wear: '',
    bestFor: ['Track days', 'Autocross', 'Canyon runs'],
    exampleBrands: [
      'Michelin Pilot Sport Cup 2',
      'Continental ExtremeContact Force',
      'Pirelli P Zero Trofeo R',
    ],
    streetLegal: true,
    trackSuitable: true,
  },
  {
    id: 'track-200tw',
    label: '200TW Track',
    shortLabel: '200TW',
    icon: '🏁',
    description: 'Competition tire, DOT-legal',
    gripCoefficient: 1.15,
    lateralGBonus: 0.18,
    brakingImprovement: 20,
    lapTimePercent: 0.07,
    zeroToSixtyMultiplier: 0.94,
    utqgRange: '140-200',
    wear: '-',
    bestFor: ['HPDE', 'Autocross competition', 'Time attack'],
    exampleBrands: ['Bridgestone RE-71RS', 'Yokohama A052', 'Falken RT660', 'BFG Rival S 1.5'],
    streetLegal: true,
    trackSuitable: true,
  },
  {
    id: 'r-compound',
    label: 'R-Compound',
    shortLabel: 'R-Comp',
    icon: '🏎️',
    description: 'Maximum grip, barely street-legal',
    gripCoefficient: 1.25,
    lateralGBonus: 0.25,
    brakingImprovement: 25,
    lapTimePercent: 0.1,
    zeroToSixtyMultiplier: 0.9,
    utqgRange: '40-100',
    wear: '--',
    bestFor: ['Time attack', 'Competition', 'Dedicated track car'],
    exampleBrands: ['Toyo R888R', 'Nitto NT01', 'Hoosier A7', 'Kumho V730'],
    streetLegal: true,
    trackSuitable: true,
  },
  {
    id: 'slicks',
    label: 'Racing Slicks',
    shortLabel: 'Slicks',
    icon: '🛞',
    description: 'Maximum grip, NOT street legal',
    gripCoefficient: 1.35,
    lateralGBonus: 0.35,
    brakingImprovement: 30,
    lapTimePercent: 0.13,
    zeroToSixtyMultiplier: 0.85,
    utqgRange: 'N/A',
    wear: '---',
    bestFor: ['Professional racing', 'Dedicated race car'],
    exampleBrands: ['Hoosier Racing', 'Goodyear Racing', 'Pirelli Slicks'],
    streetLegal: false,
    trackSuitable: true,
  },
];

// =============================================================================
// LOOKUP HELPERS
// =============================================================================

/**
 * Get tire compound by ID
 * @param {string} id - Compound ID
 * @returns {Object|null} - Compound object or null
 */
export function getTireCompoundById(id) {
  return TIRE_COMPOUNDS.find((c) => c.id === id) || null;
}

/**
 * Get default/baseline tire compound
 * @returns {Object} - The baseline compound (touring-all-season)
 */
export function getBaselineTireCompound() {
  return TIRE_COMPOUNDS[0]; // touring-all-season
}

/**
 * Get tire compound IDs in order
 * @returns {string[]} - Array of compound IDs
 */
export function getTireCompoundIds() {
  return TIRE_COMPOUNDS.map((c) => c.id);
}

/**
 * Get street-legal tire compounds only
 * @returns {Object[]} - Array of street-legal compounds
 */
export function getStreetLegalCompounds() {
  return TIRE_COMPOUNDS.filter((c) => c.streetLegal);
}

/**
 * Get track-suitable tire compounds
 * @returns {Object[]} - Array of track-suitable compounds
 */
export function getTrackSuitableCompounds() {
  return TIRE_COMPOUNDS.filter((c) => c.trackSuitable);
}

// =============================================================================
// LEGACY KEY MAPPING
// =============================================================================

/**
 * Maps legacy/alternative tire keys to canonical compound IDs.
 * Used for backward compatibility with old data.
 */
export const TIRE_KEY_ALIASES = {
  // Legacy WheelTireConfigurator keys
  'all-season': 'touring-all-season',
  summer: 'max-summer',
  'max-performance': 'extreme-summer',
  track: 'track-200tw',

  // Legacy metricsCalculator keys
  stock: 'touring-all-season',
  'tires-performance': 'max-summer',
  'tires-summer': 'max-summer',
  'tires-track': 'track-200tw',
  'tires-r-compound': 'r-compound',

  // Legacy upgradeEducation keys
  'performance-tires': 'max-summer',
  'competition-tires': 'track-200tw',

  // CalculatedPerformance keys
  'r-comp': 'r-compound',
  'drag-radial': 'r-compound', // Map to closest equivalent
  slick: 'slicks',
};

/**
 * Normalize any tire key to canonical compound ID
 * @param {string} key - Any tire key (legacy or canonical)
 * @returns {string} - Canonical compound ID
 */
export function normalizeTireKey(key) {
  if (!key) return 'touring-all-season';

  const normalized = key.toLowerCase().trim();

  // Check aliases first
  if (TIRE_KEY_ALIASES[normalized]) {
    return TIRE_KEY_ALIASES[normalized];
  }

  // Check if it's already a valid canonical ID
  if (TIRE_COMPOUNDS.find((c) => c.id === normalized)) {
    return normalized;
  }

  // Default to baseline
  return 'touring-all-season';
}

/**
 * Get tire compound for any key (handles legacy keys)
 * @param {string} key - Any tire key
 * @returns {Object} - Compound object (never null)
 */
export function getTireCompound(key) {
  const normalizedId = normalizeTireKey(key);
  return getTireCompoundById(normalizedId) || getBaselineTireCompound();
}

// =============================================================================
// PERFORMANCE CALCULATION HELPERS
// =============================================================================

/**
 * Get grip coefficient for a tire compound
 * Used by metricsCalculator.js for braking/lateral G calculations
 *
 * @param {string} key - Tire key (any format)
 * @returns {number} - Grip coefficient (0.88 to 1.35)
 */
export function getGripCoefficient(key) {
  const compound = getTireCompound(key);
  return compound.gripCoefficient;
}

/**
 * Get 0-60 multiplier for a tire compound
 * Used by CalculatedPerformance.jsx
 *
 * @param {string} key - Tire key (any format)
 * @returns {number} - Multiplier (lower = faster)
 */
export function getZeroToSixtyMultiplier(key) {
  const compound = getTireCompound(key);
  return compound.zeroToSixtyMultiplier;
}

/**
 * Get lateral G bonus for a tire compound
 * Used by UpgradeCenter for direct lateral G adjustment
 *
 * @param {string} key - Tire key (any format)
 * @returns {number} - Lateral G bonus (0 to 0.35)
 */
export function getLateralGBonus(key) {
  const compound = getTireCompound(key);
  return compound.lateralGBonus;
}

/**
 * Get braking improvement for a tire compound
 * Used for 60-0 braking distance reduction
 *
 * @param {string} key - Tire key (any format)
 * @returns {number} - Feet reduction in braking distance
 */
export function getBrakingImprovement(key) {
  const compound = getTireCompound(key);
  return compound.brakingImprovement;
}

/**
 * Get lap time percentage improvement for a tire compound
 * Used by LapTimeEstimator
 *
 * @param {string} key - Tire key (any format)
 * @returns {number} - Percentage improvement (0 to 0.13)
 */
export function getLapTimePercent(key) {
  const compound = getTireCompound(key);
  return compound.lapTimePercent;
}

// =============================================================================
// UI HELPERS
// =============================================================================

/**
 * Get tire compounds formatted for UI selection
 * Used by WheelTireConfigurator
 *
 * @param {Object} options - Filter options
 * @param {boolean} options.streetLegalOnly - Only show street-legal tires
 * @param {boolean} options.trackOnly - Only show track-suitable tires
 * @returns {Object[]} - Array of UI-ready compound objects
 */
export function getTireCompoundsForUI({ streetLegalOnly = true, trackOnly = false } = {}) {
  let compounds = TIRE_COMPOUNDS;

  if (streetLegalOnly) {
    compounds = compounds.filter((c) => c.streetLegal);
  }

  if (trackOnly) {
    compounds = compounds.filter((c) => c.trackSuitable);
  }

  return compounds.map((c) => ({
    id: c.id,
    label: c.label,
    shortLabel: c.shortLabel,
    icon: c.icon,
    description: c.description,
    grip: c.lateralGBonus,
    wear: c.wear,
    bestFor: c.bestFor,
    exampleBrands: c.exampleBrands,
    trackSuitable: c.trackSuitable,
  }));
}

// =============================================================================
// EDUCATIONAL CONTENT
// =============================================================================

/**
 * Educational content for tire categories
 * Used to provide detailed information in UI modals/tooltips
 */
export const TIRE_EDUCATION = {
  'touring-all-season': {
    whatItIs:
      'Touring all-season tires prioritize comfort, long tread life, and year-round capability over outright grip.',
    howItWorks:
      'Harder rubber compounds last longer but grip less. All-season tread patterns compromise between wet, dry, and light snow performance.',
    expectedGains: {
      grip: 'Baseline (other tires compared to this)',
      handling: 'Predictable but limited',
      note: 'Fine for commuting, not recommended for spirited driving.',
    },
    pros: [
      'Long tread life (50,000+ miles)',
      'Year-round capability',
      'Comfortable ride',
      'Affordable',
    ],
    cons: [
      'Limited dry grip',
      'Poor track performance',
      'Slow steering response',
      'Early understeer',
    ],
    cost: { range: '$400 - $800 (set of 4)', low: 400, high: 800 },
  },
  'uhp-all-season': {
    whatItIs:
      'Ultra High Performance all-season tires balance year-round capability with improved dry and wet grip.',
    howItWorks:
      'Softer compounds than touring tires with more aggressive tread patterns. Modern silica compounds improve wet grip.',
    expectedGains: {
      grip: '+3-5% over touring all-seasons',
      handling: 'Noticeably more responsive',
      note: 'Good choice for performance cars driven year-round.',
    },
    pros: [
      'Better grip than touring tires',
      'Year-round capability',
      'Good wet performance',
      'Reasonable tread life',
    ],
    cons: [
      'Not suitable for track',
      'Less grip than summer tires',
      'Compromised in snow',
      'Higher cost',
    ],
    cost: { range: '$600 - $1,200 (set of 4)', low: 600, high: 1200 },
  },
  'max-summer': {
    whatItIs:
      'The enthusiast sweet spot. Max performance summer tires deliver excellent grip while remaining street-practical.',
    howItWorks:
      'Softer, stickier compounds with minimal tread patterns maximize contact patch. Modern designs balance dry grip with acceptable wet performance.',
    expectedGains: {
      grip: '+20-30% over all-seasons',
      handling: 'Dramatic improvement',
      note: 'The single most impactful upgrade for most enthusiasts.',
    },
    pros: [
      'Excellent dry and wet grip',
      'Responsive steering',
      'Capable for occasional track use',
      'Good value for performance',
    ],
    cons: [
      'No winter capability',
      'Faster wear than all-seasons',
      'Reduced cold weather grip',
      'Higher cost',
    ],
    cost: { range: '$800 - $1,600 (set of 4)', low: 800, high: 1600 },
  },
  'extreme-summer': {
    whatItIs:
      'Street-legal track tires. These are designed for track days and serious canyon runs while remaining road-legal.',
    howItWorks:
      'Very soft compounds and minimal tread provide maximum dry grip. Designed to work best when warm. Limited wet capability.',
    expectedGains: {
      grip: '+40-50% over all-seasons',
      handling: 'Transformative',
      note: 'Worth 2-4 seconds per mile on track.',
    },
    pros: [
      'Exceptional dry grip',
      'Track-capable',
      'Precise steering response',
      'DOT-legal for street use',
    ],
    cons: [
      'Poor wet grip',
      'Fast wear',
      'Expensive',
      'Needs heat to work well',
      'Not for daily driving',
    ],
    cost: { range: '$1,200 - $2,000 (set of 4)', low: 1200, high: 2000 },
  },
  'track-200tw': {
    whatItIs:
      '200-treadwear tires designed specifically for autocross and track days. The most popular choice for competitive driving.',
    howItWorks:
      'Extremely soft compounds generate heat quickly for maximum grip. Minimal tread channels water poorly. Heat cycles matter for longevity.',
    expectedGains: {
      grip: '+60-80% over all-seasons',
      handling: 'Race car levels',
      note: 'The standard for autocross and HPDE.',
    },
    pros: [
      'Maximum legal grip for competition',
      'Extremely responsive',
      'Proven in competition',
      'DOT-legal',
    ],
    cons: [
      'Very poor wet grip',
      'Wears quickly (5,000-15,000 miles)',
      'Expensive',
      'Not suitable for daily driving',
      'Needs proper heat cycling',
    ],
    cost: { range: '$1,400 - $2,400 (set of 4)', low: 1400, high: 2400 },
  },
  'r-compound': {
    whatItIs:
      'R-compound (racing compound) tires are barely street-legal race tires. Maximum grip for time attack and competition.',
    howItWorks:
      'The softest legal compounds available. Almost no tread. Designed for dry tracks only. Requires careful heat management.',
    expectedGains: {
      grip: '+100% or more over all-seasons',
      handling: 'Full race car',
      note: 'For dedicated track cars and serious competition.',
    },
    pros: ['Maximum possible DOT-legal grip', 'Worth seconds per lap', 'Competition-proven'],
    cons: [
      'Essentially no wet grip',
      'Very short life (3,000-8,000 miles)',
      'Very expensive',
      'Noisy on street',
      'Not suitable for daily use',
    ],
    cost: { range: '$1,600 - $2,800 (set of 4)', low: 1600, high: 2800 },
  },
  slicks: {
    whatItIs:
      'Racing slicks are NOT street legal. For professional racing and dedicated race cars only.',
    howItWorks:
      'No tread whatsoever - maximum rubber contact with the surface. Designed for specific track conditions and temperatures.',
    expectedGains: {
      grip: '+120-150% over all-seasons',
      handling: 'Professional race car',
      note: 'NOT STREET LEGAL. Race use only.',
    },
    pros: ['Absolute maximum grip', 'Professional racing standard'],
    cons: [
      'NOT STREET LEGAL',
      'Dangerous in any moisture',
      'Requires tire warmers',
      'For race cars only',
    ],
    cost: { range: '$2,000 - $4,000+ (set of 4)', low: 2000, high: 4000 },
  },
};

/**
 * Get educational content for a tire compound
 * @param {string} key - Tire key (any format)
 * @returns {Object|null} - Educational content object
 */
export function getTireEducation(key) {
  const normalizedId = normalizeTireKey(key);
  return TIRE_EDUCATION[normalizedId] || null;
}
