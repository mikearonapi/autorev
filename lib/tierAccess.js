/**
 * Tier Access Utilities
 * 
 * Centralized feature access control based on subscription tiers.
 * 
 * Tiers (in order of access):
 * - free: Basic discovery and education
 * - collector: Enthusiast ownership intelligence (garage features)
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
    maxCars: 1,
  },
  collector: {
    id: 'collector',
    name: 'Enthusiast',
    color: '#2563eb',
    price: '$9.99/mo',
    priceAnnual: '$79/yr',
    priceNote: '2 months free',
    maxCars: 3,
  },
  tuner: {
    id: 'tuner',
    name: 'Pro',
    color: '#7c3aed',
    price: '$19.99/mo',
    priceAnnual: '$149/yr',
    priceNote: '2 months free',
    maxCars: Infinity,
  },
};

// Feature definitions with required tier
// SIMPLIFIED MODEL (Jan 2026):
// - Free: Full garage for 1 car, community, events, limited AL
// - Enthusiast: +Insights, +Data tabs, 3 cars, more AL
// - Pro: Unlimited cars, maximum AL, priority support
export const FEATURES = {
  // ===== FREE TIER FEATURES =====
  // Full garage experience for 1 car
  basicGarage: { tier: 'free', name: 'Garage', description: 'Add your car to garage' },
  vinDecode: { tier: 'free', name: 'VIN Decode', description: 'Decode your exact vehicle variant' },
  mySpecs: { tier: 'free', name: 'My Specs', description: 'View all your car specifications' },
  myBuild: { tier: 'free', name: 'My Build', description: 'Plan your upgrades' },
  myPerformance: { tier: 'free', name: 'My Performance', description: 'See HP and metric gains' },
  myParts: { tier: 'free', name: 'My Parts', description: 'Research specific parts' },
  myInstall: { tier: 'free', name: 'My Install', description: 'Track installation progress' },
  myPhotos: { tier: 'free', name: 'My Photos', description: 'Upload vehicle photos' },
  // Community - free for everyone
  communityBrowse: { tier: 'free', name: 'Community', description: 'Browse and share builds' },
  communityShare: { tier: 'free', name: 'Share Builds', description: 'Share your build publicly' },
  leaderboard: { tier: 'free', name: 'Leaderboard', description: 'View rankings and standings' },
  // Events - free for everyone
  eventsBrowse: { tier: 'free', name: 'Browse Events', description: 'Browse car events and meetups' },
  eventsMapView: { tier: 'free', name: 'Map View', description: 'View events on a map' },
  eventsSave: { tier: 'free', name: 'Save Events', description: 'Bookmark events for later' },
  eventsCalendarExport: { tier: 'free', name: 'Calendar Export', description: 'Add events to your calendar' },
  eventsSubmit: { tier: 'free', name: 'Submit Events', description: 'Submit new events for review' },
  // Dashboard - free for everyone
  dashboard: { tier: 'free', name: 'Dashboard', description: 'Points, streaks, achievements' },
  // AL - free tier (chat = one AL response)
  alBasic: { tier: 'free', name: 'AL Basic', description: '~15 chats per month' },

  // ===== ENTHUSIAST TIER FEATURES =====
  // Insights & Data tabs - premium value
  insightsTab: { tier: 'collector', name: 'Insights', description: 'Health scores and recommendations' },
  dataTab: { tier: 'collector', name: 'Data', description: 'Virtual Dyno and Lap Time Estimator' },
  virtualDyno: { tier: 'collector', name: 'Virtual Dyno', description: 'HP/TQ curves visualization' },
  dynoLogging: { tier: 'collector', name: 'Dyno Logging', description: 'Log your dyno results' },
  lapTimeEstimator: { tier: 'collector', name: 'Lap Time Estimator', description: 'Estimate track times' },
  trackTimeLogging: { tier: 'collector', name: 'Track Logging', description: 'Log your track times' },
  // More cars
  multipleCars: { tier: 'collector', name: 'Multiple Cars', description: 'Add up to 3 cars' },
  // AL - enthusiast tier
  alEnthusiast: { tier: 'collector', name: 'AL Enthusiast', description: '~130 chats per month' },

  // ===== PRO TIER FEATURES =====
  // Unlimited cars
  unlimitedCars: { tier: 'tuner', name: 'Unlimited Cars', description: 'No limit on garage size' },
  // AL - pro tier
  alPro: { tier: 'tuner', name: 'AL Pro', description: '~350 chats per month' },
  // Premium support
  prioritySupport: { tier: 'tuner', name: 'Priority Support', description: 'Faster response times' },
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
 * Tier limits
 * Controls how many cars each tier can have
 */
export const TIER_LIMITS = {
  maxCars: {
    free: 1,
    collector: 3,
    tuner: Infinity,
  },
};

/**
 * AL chat estimates per tier
 * A "chat" = one AL response (prompt + response = token cost)
 * A "conversation" = a thread that may contain multiple chats
 * Based on monthly dollar allocation divided by ~$0.015 avg cost per chat
 */
export const AL_ESTIMATES = {
  free: '~15 chats',       // $0.25/mo budget
  collector: '~130 chats', // $2.00/mo budget
  tuner: '~350 chats',     // $5.00/mo budget
};

/**
 * Check if user is in beta (all features free)
 * Toggle this when moving out of beta
 */
export const IS_BETA = true;

/**
 * Trial configuration
 * New users get 7 days of Pro tier access
 */
export const TRIAL_CONFIG = {
  enabled: true,
  durationDays: 7,
  tier: 'tuner', // Pro tier during trial
  alBudgetCents: 500, // $5.00 AL budget during trial (Pro level)
};

/**
 * Calculate trial end date from signup
 * @param {Date} signupDate - When user signed up
 * @returns {Date} - Trial end date
 */
export function calculateTrialEndDate(signupDate = new Date()) {
  const endDate = new Date(signupDate);
  endDate.setDate(endDate.getDate() + TRIAL_CONFIG.durationDays);
  return endDate;
}

/**
 * Check if a user is currently in their trial period
 * @param {Object} profile - User profile with trial_ends_at field
 * @returns {boolean} - Whether user is in trial
 */
export function isInTrial(profile) {
  if (!profile?.trial_ends_at) return false;
  
  const trialEnd = new Date(profile.trial_ends_at);
  const now = new Date();
  
  return now < trialEnd;
}

/**
 * Get remaining trial days
 * @param {Object} profile - User profile with trial_ends_at field
 * @returns {number} - Days remaining (0 if expired or no trial)
 */
export function getTrialDaysRemaining(profile) {
  if (!profile?.trial_ends_at) return 0;
  
  const trialEnd = new Date(profile.trial_ends_at);
  const now = new Date();
  
  if (now >= trialEnd) return 0;
  
  const msRemaining = trialEnd.getTime() - now.getTime();
  return Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
}

/**
 * Get the effective tier for a user (considering trial status)
 * This is the MAIN function to use when checking what tier a user has access to
 * 
 * @param {Object} profile - User profile with subscription_tier and trial_ends_at
 * @returns {string} - Effective tier ('free', 'collector', or 'tuner')
 */
export function getEffectiveTier(profile) {
  if (!profile) return 'free';
  
  // If user has a paid subscription, use that
  const baseTier = profile.subscription_tier || 'free';
  
  // If user is in trial and their base tier is lower than trial tier, use trial tier
  if (isInTrial(profile)) {
    const baseTierLevel = getTierLevel(baseTier);
    const trialTierLevel = getTierLevel(TRIAL_CONFIG.tier);
    
    if (trialTierLevel > baseTierLevel) {
      return TRIAL_CONFIG.tier;
    }
  }
  
  return baseTier;
}

/**
 * Get trial status for display
 * @param {Object} profile - User profile
 * @returns {Object|null} - Trial status or null if not in trial
 */
export function getTrialStatus(profile) {
  if (!isInTrial(profile)) return null;
  
  const daysRemaining = getTrialDaysRemaining(profile);
  const effectiveTier = getEffectiveTier(profile);
  
  return {
    isActive: true,
    daysRemaining,
    endsAt: new Date(profile.trial_ends_at),
    tier: effectiveTier,
    tierName: TIER_CONFIG[effectiveTier]?.name || 'Pro',
  };
}

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

const tierAccess = {
  TIER_HIERARCHY,
  TIER_CONFIG,
  FEATURES,
  TIER_LIMITS,
  TRIAL_CONFIG,
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
  // Trial functions
  calculateTrialEndDate,
  isInTrial,
  getTrialDaysRemaining,
  getEffectiveTier,
  getTrialStatus,
};

export default tierAccess;







