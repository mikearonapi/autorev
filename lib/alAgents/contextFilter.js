/**
 * Smart Context Filter for AL Multi-Agent System
 *
 * Provides only relevant context based on:
 * 1. Classified intent
 * 2. Keywords in the user's message
 * 3. Available context data
 *
 * Goal: Right context, right time - no overload, no missing info
 *
 * @module lib/alAgents/contextFilter
 */

import { INTENT_TYPES } from './index.js';

/**
 * Context types and when they're relevant
 */
const CONTEXT_RELEVANCE = {
  // When to include user's garage vehicles
  garage: {
    intents: [
      INTENT_TYPES.BUILD_PLANNING,
      INTENT_TYPES.PARTS_RESEARCH,
      INTENT_TYPES.PERFORMANCE_DATA,
      INTENT_TYPES.VISION,
      INTENT_TYPES.GENERALIST,
    ],
    keywords: [
      'my car',
      'my build',
      'my vehicle',
      'my garage',
      "i've got",
      'i have a',
      'i own',
      'my rs5',
      'my ram',
      'my porsche',
      'my audi',
      'my bmw',
      'my ford',
      'my chevy',
      'my toyota',
      'my honda',
      'my mazda',
      'my nissan',
      'my mercedes',
      'my vw',
      'my volkswagen',
      'my subaru',
      'my corvette',
      'my mustang',
      'my camaro',
    ],
    // Always include if user has vehicles and query seems personal
    personalIndicators: ['should i', 'can i', 'recommend', 'best for', 'work on'],
  },

  // When to include user location
  location: {
    intents: [INTENT_TYPES.COMMUNITY_EVENTS],
    keywords: [
      'near me',
      'nearby',
      'local',
      'around here',
      'in my area',
      'close to me',
      'events',
      'track day',
      'cars and coffee',
      'meetup',
      'shop',
      'mechanic',
      'tuner',
      'dyno',
    ],
  },

  // When to include user favorites (only if no garage)
  favorites: {
    intents: [INTENT_TYPES.CAR_DISCOVERY],
    keywords: ['looking to buy', 'thinking about', 'shopping for', 'considering', 'should i get'],
    // Only use if user has no garage vehicles
    fallbackOnly: true,
  },

  // When to include current page car
  currentCar: {
    intents: [
      INTENT_TYPES.CAR_DISCOVERY,
      INTENT_TYPES.BUILD_PLANNING,
      INTENT_TYPES.PARTS_RESEARCH,
      INTENT_TYPES.PERFORMANCE_DATA,
    ],
    keywords: ['this car', 'this vehicle', 'the car', 'it'],
    // Always include if user is on a car page
    alwaysIfAvailable: true,
  },

  // When to include user profile/personalization
  profile: {
    intents: [INTENT_TYPES.BUILD_PLANNING, INTENT_TYPES.PARTS_RESEARCH, INTENT_TYPES.CAR_DISCOVERY],
    keywords: ['budget', 'beginner', 'daily', 'track', 'street', 'goals', 'experience'],
    // Include for recommendation-type queries
    recommendationIndicators: ['recommend', 'suggest', 'best', 'should i', 'which'],
  },
};

/**
 * Check if message matches any keywords
 * @param {string} message - User message
 * @param {string[]} keywords - Keywords to match
 * @returns {boolean}
 */
function matchesKeywords(message, keywords) {
  if (!message || !keywords?.length) return false;
  const lower = message.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * Determine which context to include based on intent and message
 *
 * @param {Object} params
 * @param {string} params.intent - Classified intent type
 * @param {string} params.message - User's message
 * @param {Object} params.fullContext - All available context
 * @returns {Object} Filtered context with only relevant data
 */
export function filterContextForIntent({ intent, message, fullContext }) {
  const filtered = {
    // Always include current page context if available
    currentPage: fullContext.currentPage,
    // Always include stats (lightweight)
    stats: fullContext.stats,
  };

  const lower = message?.toLowerCase() || '';

  // === GARAGE VEHICLES ===
  const garageConfig = CONTEXT_RELEVANCE.garage;
  const includeGarage =
    garageConfig.intents.includes(intent) ||
    matchesKeywords(message, garageConfig.keywords) ||
    (fullContext.allOwnedVehicles?.length > 0 &&
      matchesKeywords(message, garageConfig.personalIndicators));

  if (includeGarage && fullContext.allOwnedVehicles?.length > 0) {
    filtered.allOwnedVehicles = fullContext.allOwnedVehicles;
    filtered.userVehicle = fullContext.userVehicle;
  }

  // === LOCATION ===
  const locationConfig = CONTEXT_RELEVANCE.location;
  const includeLocation =
    locationConfig.intents.includes(intent) || matchesKeywords(message, locationConfig.keywords);

  if (includeLocation && fullContext.userProfile) {
    // Only include location-relevant profile data
    filtered.userProfile = {
      location_city: fullContext.userProfile.location_city,
      location_state: fullContext.userProfile.location_state,
      location_zip: fullContext.userProfile.location_zip,
    };
  }

  // === FAVORITES ===
  const favoritesConfig = CONTEXT_RELEVANCE.favorites;
  const includeFavorites =
    (favoritesConfig.intents.includes(intent) ||
      matchesKeywords(message, favoritesConfig.keywords)) &&
    // Only use favorites if no garage vehicles (fallback)
    !fullContext.allOwnedVehicles?.length;

  if (includeFavorites && fullContext.userFavorites?.length > 0) {
    filtered.userFavorites = fullContext.userFavorites;
  }

  // === CURRENT CAR (from page) ===
  const currentCarConfig = CONTEXT_RELEVANCE.currentCar;
  const includeCurrentCar =
    currentCarConfig.intents.includes(intent) ||
    matchesKeywords(message, currentCarConfig.keywords) ||
    currentCarConfig.alwaysIfAvailable;

  if (includeCurrentCar && fullContext.car) {
    filtered.car = fullContext.car;
  }

  // === USER PROFILE (for recommendations) ===
  const profileConfig = CONTEXT_RELEVANCE.profile;
  const includeProfile =
    profileConfig.intents.includes(intent) ||
    matchesKeywords(message, profileConfig.keywords) ||
    matchesKeywords(message, profileConfig.recommendationIndicators);

  if (includeProfile && fullContext.userPersonalization) {
    filtered.userPersonalization = fullContext.userPersonalization;
  }

  // Log what was filtered for debugging (remove in production if noisy)
  const includedKeys = Object.keys(filtered).filter((k) => filtered[k] != null);
  const excludedKeys = Object.keys(fullContext).filter((k) => !includedKeys.includes(k));

  filtered._contextMeta = {
    intent,
    included: includedKeys,
    excluded: excludedKeys.filter((k) => fullContext[k] != null),
  };

  return filtered;
}

/**
 * Get a summary of what context was selected (for debugging/logging)
 */
export function getContextSummary(filteredContext) {
  const meta = filteredContext._contextMeta;
  if (!meta) return 'No context metadata';

  return `Intent: ${meta.intent} | Included: [${meta.included.join(', ')}] | Excluded: [${meta.excluded.join(', ')}]`;
}

const contextFilter = {
  filterContextForIntent,
  getContextSummary,
  CONTEXT_RELEVANCE,
};

export default contextFilter;
