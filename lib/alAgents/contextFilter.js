/**
 * Smart Context Filter for AL Multi-Agent System
 *
 * Design Philosophy:
 * 1. INTENT is the primary driver (orchestrator already classified it)
 * 2. Patterns are supplements for edge cases
 * 3. Data-aware: only include what exists and is relevant
 * 4. Flexible: regex patterns, not exhaustive keyword lists
 *
 * @module lib/alAgents/contextFilter
 */

import { INTENT_TYPES } from './index.js';

// =============================================================================
// CONTEXT MATRIX BY INTENT
// =============================================================================

/**
 * What context each intent typically needs
 * This is the PRIMARY decision driver
 *
 * Values: 'always' | 'ifAvailable' | 'never' | 'conditional'
 */
const INTENT_CONTEXT_MATRIX = {
  [INTENT_TYPES.CAR_DISCOVERY]: {
    car: 'always', // They're researching cars
    garage: 'conditional', // Only if comparing to what they own
    location: 'never', // Not relevant for car research
    favorites: 'ifAvailable', // Shows their interests
    profile: 'conditional', // If asking for recommendations
  },

  [INTENT_TYPES.BUILD_PLANNING]: {
    car: 'ifAvailable', // Current page car for reference
    garage: 'always', // They're planning mods for THEIR car
    location: 'never', // Not relevant
    favorites: 'never', // They're working on owned cars
    profile: 'always', // Budget, goals, experience matter
  },

  [INTENT_TYPES.PARTS_RESEARCH]: {
    car: 'ifAvailable', // What car are parts for
    garage: 'always', // Usually for their car
    location: 'conditional', // If looking for local shops
    favorites: 'never', // Parts are for owned cars
    profile: 'always', // Budget matters for parts
  },

  [INTENT_TYPES.KNOWLEDGE]: {
    car: 'conditional', // If asking about specific car's tech
    garage: 'conditional', // If asking about their car's systems
    location: 'never', // Educational doesn't need location
    favorites: 'never', // Not relevant
    profile: 'conditional', // Skill level affects explanation depth
  },

  [INTENT_TYPES.COMMUNITY_EVENTS]: {
    car: 'never', // Events aren't car-specific
    garage: 'ifAvailable', // What cars they'd bring to events
    location: 'always', // Events are location-based
    favorites: 'never', // Not relevant
    profile: 'never', // Not relevant
  },

  [INTENT_TYPES.PERFORMANCE_DATA]: {
    car: 'ifAvailable', // Comparing performance data
    garage: 'always', // Usually about their car's performance
    location: 'never', // Not relevant
    favorites: 'never', // Not relevant
    profile: 'conditional', // Track vs street affects recommendations
  },

  [INTENT_TYPES.VISION]: {
    car: 'ifAvailable', // May be analyzing a car photo
    garage: 'always', // Often photos of their car
    location: 'never', // Not relevant
    favorites: 'never', // Not relevant
    profile: 'never', // Not relevant
  },

  [INTENT_TYPES.GENERALIST]: {
    car: 'ifAvailable', // Context helps
    garage: 'ifAvailable', // Personalization helps
    location: 'conditional', // Sometimes relevant
    favorites: 'conditional', // Sometimes relevant
    profile: 'ifAvailable', // Helps personalize
  },
};

// =============================================================================
// PATTERN-BASED BOOSTERS
// =============================================================================

/**
 * Regex patterns that BOOST context inclusion regardless of intent
 * These catch edge cases the intent classification might miss
 *
 * Using regex for flexibility instead of exhaustive keyword lists
 */
const CONTEXT_BOOST_PATTERNS = {
  // Boost GARAGE context when user references their vehicle
  garage: [
    /\bmy\s+(car|vehicle|truck|suv|build|ride|daily|project)/i,
    /\bi\s+(have|own|drive|bought|got)\s+a?\s*\w/i,
    /\b(on|for|to|in)\s+my\s+\w/i,
    /\bmy\s+\d{4}\b/i, // "my 2020"
    /\bmy\s+[a-z]{2,}\b/i, // "my RS5", "my Porsche" - any "my [word]"
    /\b(upgrade|modify|tune|mod)\s+(my|the)\b/i,
    /\binstalled\s+on\s+(my|mine)/i,
    /\b(next|first|best)\s+mod/i,
    /\bshould\s+i\s+(get|buy|install|add)/i,
  ],

  // Boost LOCATION context for local searches
  location: [
    /\bnear\s+(me|here|by)\b/i,
    /\b(local|nearby|around\s+here|in\s+my\s+area)/i,
    /\b(find|looking\s+for)\s+a?\s*(shop|mechanic|tuner|dealer|installer)/i,
    /\bwhere\s+(can|do|should)\s+i\b/i,
    /\b(events?|meet|meetup|track\s*day|cars\s*and\s*coffee)/i,
  ],

  // Boost PROFILE context for recommendation queries
  profile: [
    /\b(recommend|suggest|advice|help\s+me|guide)/i,
    /\bshould\s+i\b/i,
    /\b(best|worth|budget|afford|expensive|cheap)/i,
    /\b(beginner|newbie|first\s+time|experienced)/i,
    /\b(daily|track|street|weekend|commute)/i,
    /\bwhat\s+(do\s+you|would\s+you)\s+think/i,
  ],

  // Boost CAR context when referencing page car
  car: [
    /\b(this|the)\s+(car|vehicle|one)\b/i,
    /\babout\s+it\b/i,
    /\b(its?|it'?s)\s+\w/i,
    /\bfor\s+(it|this)\b/i,
  ],

  // Boost FAVORITES for shopping queries (only if no garage)
  favorites: [
    /\b(looking|thinking|planning)\s+(to\s+)?(buy|get|purchase)/i,
    /\bshould\s+i\s+(buy|get)\b/i,
    /\b(shopping|deciding|choosing|between)\b/i,
    /\b(next|new|first|dream)\s+car\b/i,
  ],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if message matches any patterns
 */
function matchesPatterns(message, patterns) {
  if (!message || !patterns?.length) return false;
  return patterns.some((pattern) => pattern.test(message));
}

/**
 * Check if user's message references one of their owned vehicles
 * More flexible than exact matching - looks for make/model mentions
 */
function referencesOwnedVehicle(message, ownedVehicles) {
  if (!message || !ownedVehicles?.length) return false;
  const lower = message.toLowerCase();

  for (const v of ownedVehicles) {
    // Check make (audi, porsche, etc.)
    if (v.make && lower.includes(v.make.toLowerCase())) return true;

    // Check model (rs5, 911, etc.)
    if (v.model && lower.includes(v.model.toLowerCase())) return true;

    // Check trim (gt3, type r, etc.)
    if (v.trim && lower.includes(v.trim.toLowerCase())) return true;

    // Check year + any identifier
    if (v.year && lower.includes(v.year.toString())) {
      if (v.make && lower.includes(v.make.toLowerCase())) return true;
      if (v.model && lower.includes(v.model.toLowerCase())) return true;
    }
  }

  return false;
}

/**
 * Determine if context should be included based on matrix value and conditions
 */
function shouldInclude(matrixValue, hasData, messageBoost, additionalCondition = true) {
  if (!hasData) return false;

  switch (matrixValue) {
    case 'always':
      return true;
    case 'never':
      return messageBoost; // Only if explicitly triggered by message pattern
    case 'ifAvailable':
      return true; // We already checked hasData
    case 'conditional':
      return messageBoost || additionalCondition;
    default:
      return false;
  }
}

// =============================================================================
// MAIN FILTER FUNCTION
// =============================================================================

/**
 * Intelligently filter context based on intent and message
 *
 * @param {Object} params
 * @param {string} params.intent - Classified intent type
 * @param {string} params.message - User's message
 * @param {Object} params.fullContext - All available context
 * @returns {Object} Filtered context with relevant data only
 */
export function filterContextForIntent({ intent, message, fullContext }) {
  // Get the context matrix for this intent
  const matrix = INTENT_CONTEXT_MATRIX[intent] || INTENT_CONTEXT_MATRIX[INTENT_TYPES.GENERALIST];

  // Check pattern boosts
  const boosts = {
    garage:
      matchesPatterns(message, CONTEXT_BOOST_PATTERNS.garage) ||
      referencesOwnedVehicle(message, fullContext.allOwnedVehicles),
    location: matchesPatterns(message, CONTEXT_BOOST_PATTERNS.location),
    profile: matchesPatterns(message, CONTEXT_BOOST_PATTERNS.profile),
    car: matchesPatterns(message, CONTEXT_BOOST_PATTERNS.car),
    favorites: matchesPatterns(message, CONTEXT_BOOST_PATTERNS.favorites),
  };

  // Start with always-included lightweight data
  const filtered = {
    currentPage: fullContext.currentPage,
    stats: fullContext.stats,
  };

  // Track inclusion decisions for logging
  const decisions = {};

  // === GARAGE (allOwnedVehicles + userVehicle) ===
  const hasGarage = fullContext.allOwnedVehicles?.length > 0;
  if (shouldInclude(matrix.garage, hasGarage, boosts.garage)) {
    filtered.allOwnedVehicles = fullContext.allOwnedVehicles;
    filtered.userVehicle = fullContext.userVehicle;
    decisions.garage = boosts.garage ? 'pattern_boost' : 'intent_matrix';
  }

  // === LOCATION (from userProfile) ===
  const hasLocation =
    fullContext.userProfile?.location_city || fullContext.userProfile?.location_state;
  if (shouldInclude(matrix.location, hasLocation, boosts.location)) {
    // Only include location fields, not full profile
    filtered.userProfile = {
      location_city: fullContext.userProfile?.location_city,
      location_state: fullContext.userProfile?.location_state,
      location_zip: fullContext.userProfile?.location_zip,
    };
    decisions.location = boosts.location ? 'pattern_boost' : 'intent_matrix';
  }

  // === FAVORITES (only if no garage - fallback for shoppers) ===
  const hasFavorites = fullContext.userFavorites?.length > 0;
  const noGarage = !hasGarage;
  if (shouldInclude(matrix.favorites, hasFavorites && noGarage, boosts.favorites)) {
    filtered.userFavorites = fullContext.userFavorites;
    decisions.favorites = 'shopping_fallback';
  }

  // === CURRENT CAR (page context) ===
  const hasCar = Boolean(fullContext.car);
  if (shouldInclude(matrix.car, hasCar, boosts.car)) {
    filtered.car = fullContext.car;
    decisions.car = boosts.car ? 'pattern_boost' : 'intent_matrix';
  }

  // === PROFILE/PERSONALIZATION ===
  const hasProfile = Boolean(fullContext.userPersonalization);
  if (shouldInclude(matrix.profile, hasProfile, boosts.profile)) {
    filtered.userPersonalization = fullContext.userPersonalization;
    decisions.profile = boosts.profile ? 'pattern_boost' : 'intent_matrix';
  }

  // === METADATA for debugging ===
  filtered._contextMeta = {
    intent,
    matrix: matrix,
    boosts: boosts,
    decisions: decisions,
    included: Object.keys(filtered).filter((k) => !k.startsWith('_') && filtered[k] != null),
    excluded: Object.keys(fullContext).filter(
      (k) => !k.startsWith('_') && fullContext[k] != null && !filtered[k]
    ),
  };

  return filtered;
}

/**
 * Get a concise summary for logging
 */
export function getContextSummary(filteredContext) {
  const meta = filteredContext._contextMeta;
  if (!meta) return 'No metadata';

  const boostList = Object.entries(meta.boosts)
    .filter(([_, v]) => v)
    .map(([k]) => k)
    .join(',');

  return `[${meta.intent}] +[${meta.included.join(',')}]${boostList ? ` boosts:[${boostList}]` : ''}`;
}

// =============================================================================
// EXPORTS
// =============================================================================

const contextFilter = {
  filterContextForIntent,
  getContextSummary,
  // Expose for testing/debugging
  INTENT_CONTEXT_MATRIX,
  CONTEXT_BOOST_PATTERNS,
};

export default contextFilter;
