/**
 * Tier Access Utilities
 * 
 * Centralized feature access control based on subscription tiers.
 * 
 * Tiers (in order of access):
 * - free: Basic discovery and education
 * - collector: Ownership intelligence (garage features)
 * - tuner: Performance intelligence (tuning shop features)
 * 
 * @module lib/tierAccess
 */

// Tier hierarchy (higher index = more access)
export const TIER_HIERARCHY = ['free', 'collector', 'tuner'];

// Tier display names and colors
export const TIER_CONFIG = {
  free: {
    id: 'free',
    name: 'Free',
    color: '#059669',
    price: 'Free',
    priceNote: 'Forever',
  },
  collector: {
    id: 'collector',
    name: 'Collector',
    color: '#2563eb',
    price: '$4.99/mo',
    priceNote: 'After beta',
  },
  tuner: {
    id: 'tuner',
    name: 'Tuner',
    color: '#7c3aed',
    price: '$9.99/mo',
    priceNote: 'After beta',
  },
};

// Feature definitions with required tier
export const FEATURES = {
  // ===== FREE TIER FEATURES =====
  // Discovery & buying research - available to everyone
  carSelector: { tier: 'free', name: 'Car Selector', description: 'Find and compare sports cars' },
  carDetailPages: { tier: 'free', name: 'Car Detail Pages', description: 'Full specs and buying guides' },
  basicGarage: { tier: 'free', name: 'Basic Garage', description: 'Save cars to your garage' },
  favorites: { tier: 'free', name: 'Favorites', description: 'Save favorite cars' },
  partsTeaser: { tier: 'free', name: 'Parts Preview', description: 'See top 3 popular parts' },
  lapTimesTeaser: { tier: 'free', name: 'Lap Times Preview', description: 'See top 2 lap times' },
  // Buying research data (FREE - easily Googleable)
  fuelEconomy: { tier: 'free', name: 'Fuel Economy', description: 'EPA fuel economy data' },
  safetyRatings: { tier: 'free', name: 'Safety Ratings', description: 'NHTSA and IIHS safety ratings' },
  priceByYear: { tier: 'free', name: 'Price by Year', description: 'Best value model years' },
  alBasic: { tier: 'free', name: 'AL Basic', description: '25 AI chats per month' },

  // ===== COLLECTOR TIER FEATURES =====
  // Ownership intelligence - for YOUR specific car
  vinDecode: { tier: 'collector', name: 'VIN Decode', description: 'Decode your exact vehicle variant' },
  ownerReference: { tier: 'collector', name: "Owner's Reference", description: 'Maintenance specs for your car' },
  serviceLog: { tier: 'collector', name: 'Service Log', description: 'Track your maintenance history' },
  serviceReminders: { tier: 'collector', name: 'Service Reminders', description: 'Get notified when service is due' },
  recallAlerts: { tier: 'collector', name: 'Recall Alerts', description: 'Active recalls for YOUR VIN' },
  safetyData: { tier: 'collector', name: 'Your Safety Data', description: 'Recalls and complaints for your VIN' },
  marketValue: { tier: 'collector', name: 'Market Value', description: 'Track what your car is worth' },
  priceHistory: { tier: 'collector', name: 'Price History', description: 'Historical price trends' },
  fullCompare: { tier: 'collector', name: 'Full Compare', description: 'Side-by-side comparison tool' },
  collections: { tier: 'collector', name: 'Collections', description: 'Organize cars into collections' },
  exportData: { tier: 'collector', name: 'Export Data', description: 'Export your garage data' },
  alCollector: { tier: 'collector', name: 'AL Collector', description: '75 AI chats per month' },

  // ===== TUNER TIER FEATURES =====
  // Performance intelligence
  dynoDatabase: { tier: 'tuner', name: 'Dyno Database', description: 'Real HP/torque from actual cars' },
  fullLapTimes: { tier: 'tuner', name: 'Lap Times Library', description: 'Complete track benchmark data' },
  fullPartsCatalog: { tier: 'tuner', name: 'Parts Catalog', description: 'Full parts database with pricing' },
  buildProjects: { tier: 'tuner', name: 'Build Projects', description: 'Save and organize build plans' },
  buildAnalytics: { tier: 'tuner', name: 'Build Analytics', description: 'Cost projections and HP gains' },
  partsCompatibility: { tier: 'tuner', name: 'Parts Compatibility', description: 'Check what works together' },
  modImpactAnalysis: { tier: 'tuner', name: 'Mod Impact', description: 'Before/after performance data' },
  pdfExport: { tier: 'tuner', name: 'PDF Export', description: 'Export builds as PDF' },
  earlyAccess: { tier: 'tuner', name: 'Early Access', description: 'First access to new features' },
  alTuner: { tier: 'tuner', name: 'AL Tuner', description: '150 AI chats per month' },

  // ===== EVENTS FEATURES =====
  // Community events discovery and management
  eventsBrowse: { tier: 'free', name: 'Browse Events', description: 'Browse car events and meetups' },
  eventsMapView: { tier: 'free', name: 'Map View', description: 'View events on a map' },
  eventsCalendarView: { tier: 'collector', name: 'Calendar View', description: 'Monthly calendar view of events' },
  eventsSave: { tier: 'collector', name: 'Save Events', description: 'Bookmark events for later' },
  eventsCalendarExport: { tier: 'collector', name: 'Calendar Export', description: 'Add events to your calendar' },
  eventsForMyCars: { tier: 'collector', name: 'Events for My Cars', description: 'Filter events by your garage vehicles' },
  eventsSubmit: { tier: 'free', name: 'Submit Events', description: 'Submit new events for review' },
};

/**
 * Get the numeric level of a tier (for comparison)
 * @param {string} tier - Tier name
 * @returns {number} - Tier level (0-2)
 */
export function getTierLevel(tier) {
  const index = TIER_HIERARCHY.indexOf(tier);
  return index >= 0 ? index : 0;
}

/**
 * Check if a user's tier has access to a feature
 * @param {string} userTier - User's subscription tier
 * @param {string} featureKey - Feature key from FEATURES
 * @returns {boolean} - Whether user has access
 */
export function hasFeatureAccess(userTier, featureKey) {
  const feature = FEATURES[featureKey];
  if (!feature) {
    console.warn(`[tierAccess] Unknown feature: ${featureKey}`);
    return false;
  }
  
  const userLevel = getTierLevel(userTier || 'free');
  const requiredLevel = getTierLevel(feature.tier);
  
  return userLevel >= requiredLevel;
}

/**
 * Check if a user's tier meets a minimum tier requirement
 * @param {string} userTier - User's subscription tier
 * @param {string} requiredTier - Minimum required tier
 * @returns {boolean} - Whether user meets requirement
 */
export function hasTierAccess(userTier, requiredTier) {
  const userLevel = getTierLevel(userTier || 'free');
  const requiredLevel = getTierLevel(requiredTier);
  
  return userLevel >= requiredLevel;
}

/**
 * Get the next tier up from user's current tier
 * @param {string} userTier - User's current tier
 * @returns {string|null} - Next tier or null if at highest
 */
export function getNextTier(userTier) {
  const currentLevel = getTierLevel(userTier || 'free');
  const nextLevel = currentLevel + 1;
  
  if (nextLevel < TIER_HIERARCHY.length) {
    return TIER_HIERARCHY[nextLevel];
  }
  return null;
}

/**
 * Get the required tier for a feature
 * @param {string} featureKey - Feature key from FEATURES
 * @returns {string} - Required tier
 */
export function getRequiredTier(featureKey) {
  const feature = FEATURES[featureKey];
  return feature?.tier || 'free';
}

/**
 * Get feature config by key
 * @param {string} featureKey - Feature key
 * @returns {Object|null} - Feature config
 */
export function getFeatureConfig(featureKey) {
  return FEATURES[featureKey] || null;
}

/**
 * Get all features available at a tier level (including lower tiers)
 * @param {string} tier - Tier name
 * @returns {Object[]} - Array of feature configs
 */
export function getFeaturesForTier(tier) {
  const tierLevel = getTierLevel(tier);
  
  return Object.entries(FEATURES)
    .filter(([_, feature]) => getTierLevel(feature.tier) <= tierLevel)
    .map(([key, feature]) => ({ key, ...feature }));
}

/**
 * Get features that would be unlocked by upgrading
 * @param {string} currentTier - User's current tier
 * @param {string} targetTier - Target upgrade tier
 * @returns {Object[]} - Array of feature configs that would be unlocked
 */
export function getUnlockableFeatures(currentTier, targetTier) {
  const currentLevel = getTierLevel(currentTier);
  const targetLevel = getTierLevel(targetTier);
  
  return Object.entries(FEATURES)
    .filter(([_, feature]) => {
      const featureLevel = getTierLevel(feature.tier);
      return featureLevel > currentLevel && featureLevel <= targetLevel;
    })
    .map(([key, feature]) => ({ key, ...feature }));
}

/**
 * Get upgrade CTA text based on required tier
 * @param {string} requiredTier - Required tier for feature
 * @returns {Object} - CTA config with text and href
 */
export function getUpgradeCTA(requiredTier) {
  const config = TIER_CONFIG[requiredTier];
  
  return {
    tier: requiredTier,
    tierName: config?.name || 'Premium',
    tierColor: config?.color || '#7c3aed',
    price: config?.price || '',
    text: `Upgrade to ${config?.name || 'Premium'}`,
    href: `/join?upgrade=${requiredTier}`,
  };
}

/**
 * Teaser limits for free tier
 * Controls how much content free users see before upgrade prompt
 */
export const TEASER_LIMITS = {
  popularParts: 3,      // Show 3 parts, then upgrade prompt
  lapTimes: 2,          // Show 2 lap times, then upgrade prompt
  dynoRuns: 0,          // Show none, upgrade prompt only
  compareCars: 2,       // Compare up to 2 cars free
  savedProjects: 0,     // Can't save projects on free
  aiChatsPerMonth: {
    free: 25,
    collector: 75,
    tuner: 150,
  },
};

/**
 * Check if user is in beta (all features free)
 * Toggle this when moving out of beta
 */
export const IS_BETA = true;

/**
 * Override access check during beta
 * When IS_BETA is true, all features are accessible
 * @param {string} userTier - User's tier
 * @param {string} featureKey - Feature to check
 * @returns {boolean} - Whether user has access (always true in beta if authenticated)
 */
export function hasAccess(userTier, featureKey, isAuthenticated = false) {
  // During beta, authenticated users get all features
  if (IS_BETA && isAuthenticated) {
    return true;
  }
  
  return hasFeatureAccess(userTier, featureKey);
}

/**
 * Check if feature should show upgrade prompt
 * @param {string} userTier - User's tier
 * @param {string} featureKey - Feature key
 * @param {boolean} isAuthenticated - Whether user is logged in
 * @returns {boolean} - Whether to show upgrade prompt
 */
export function shouldShowUpgradePrompt(userTier, featureKey, isAuthenticated = false) {
  // During beta, don't show upgrade prompts for authenticated users
  if (IS_BETA && isAuthenticated) {
    return false;
  }
  
  return !hasFeatureAccess(userTier, featureKey);
}

export default {
  TIER_HIERARCHY,
  TIER_CONFIG,
  FEATURES,
  TEASER_LIMITS,
  IS_BETA,
  getTierLevel,
  hasFeatureAccess,
  hasTierAccess,
  hasAccess,
  getNextTier,
  getRequiredTier,
  getFeatureConfig,
  getFeaturesForTier,
  getUnlockableFeatures,
  getUpgradeCTA,
  shouldShowUpgradePrompt,
};




