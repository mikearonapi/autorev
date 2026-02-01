/**
 * Activity Tracker
 *
 * Client-side utility for tracking user activity.
 * Fire-and-forget pattern - doesn't block UI.
 * Uses storage abstraction for cross-platform support (PWA/iOS/Android).
 *
 * NAMING CONVENTION: "Object + Past-Tense Verb" in Title Case
 *
 * @module lib/activityTracker
 */

import { sessionStore } from '@/lib/storage';

/**
 * Generate or retrieve session ID for anonymous tracking
 */
function getSessionId() {
  let sessionId = sessionStore.get('session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStore.set('session_id', sessionId);
  }
  return sessionId;
}

/**
 * Track user activity (fire-and-forget)
 *
 * @param {string} eventType - Event type (must match valid types)
 * @param {Object} eventData - Additional event context
 * @param {string} [userId] - User ID if authenticated
 */
export function trackActivity(eventType, eventData = {}, userId = null) {
  // Don't track in development unless explicitly enabled
  if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_TRACK_DEV) {
    // Skip tracking in dev mode
    return;
  }

  // Fire and forget - don't await
  fetch('/api/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: eventType,
      event_data: eventData,
      user_id: userId,
      session_id: getSessionId(),
    }),
    // Use keepalive to ensure the request completes even if user navigates away
    keepalive: true,
  }).catch(() => {
    // Silently fail - activity tracking should never break the app
  });
}

// =============================================================================
// Convenience Methods
// =============================================================================

/**
 * Track car page view
 * @param {string} carId - Car UUID
 * @param {string} carName - Car display name
 * @param {string} [source='direct'] - Source of view ('search', 'browse', 'comparison', 'direct', etc.)
 * @param {string} [userId] - User ID if authenticated
 */
export function trackCarView(carId, carName, source = 'direct', userId = null) {
  trackActivity(
    'Car Viewed',
    {
      car_id: carId,
      car_name: carName,
      source, // 'search', 'browse', 'comparison', 'direct', etc.
    },
    userId
  );
}

/**
 * Track car favorited
 * @param {string} carId - Car UUID
 * @param {string} carName - Car display name
 * @param {string} [userId] - User ID if authenticated
 */
export function trackFavorite(carId, carName, userId = null) {
  trackActivity(
    'Car Favorited',
    {
      car_id: carId,
      car_name: carName,
    },
    userId
  );
}

/**
 * Track car unfavorited
 * @param {string} carId - Car UUID
 * @param {string} [userId] - User ID if authenticated
 */
export function trackUnfavorite(carId, userId = null) {
  trackActivity(
    'Car Unfavorited',
    {
      car_id: carId,
    },
    userId
  );
}

/**
 * Track comparison started
 * @param {string[]} carIds - Array of car UUIDs
 * @param {string} [userId] - User ID if authenticated
 */
export function trackComparisonStarted(carIds, userId = null) {
  trackActivity(
    'Comparison Started',
    {
      car_ids: carIds,
      count: carIds.length,
    },
    userId
  );
}

/**
 * Track comparison completed
 * @param {string[]} carIds - Array of car UUIDs
 * @param {number} durationSeconds - Duration of comparison in seconds
 * @param {string} [userId] - User ID if authenticated
 */
export function trackComparisonCompleted(carIds, durationSeconds, userId = null) {
  trackActivity(
    'Comparison Completed',
    {
      car_ids: carIds,
      count: carIds.length,
      duration_seconds: durationSeconds,
    },
    userId
  );
}

/**
 * Track search performed
 */
export function trackSearch(query, resultsCount, filters = {}, userId = null) {
  trackActivity(
    'Search Performed',
    {
      query,
      results_count: resultsCount,
      filters,
    },
    userId
  );
}

/**
 * Track filter applied
 */
export function trackFilter(filterType, filterValue, resultsCount, userId = null) {
  trackActivity(
    'Filter Applied',
    {
      filter_type: filterType,
      filter_value: filterValue,
      results_count: resultsCount,
    },
    userId
  );
}

/**
 * Track AI Mechanic (AL) usage
 * @param {string} carId - Car UUID
 * @param {string} questionType - Question type ('general', 'comparison', 'maintenance', etc.)
 * @param {string} [userId] - User ID if authenticated
 */
export function trackALUsage(carId, questionType, userId = null) {
  trackActivity(
    'AL Used',
    {
      car_id: carId,
      question_type: questionType, // 'general', 'comparison', 'maintenance', etc.
    },
    userId
  );
}

/**
 * Track build saved
 * @param {string} carId - Car UUID
 * @param {string} buildName - Name of the build
 * @param {number} totalCost - Total cost of the build
 * @param {number} hpGain - Horsepower gain from the build
 * @param {string} [userId] - User ID if authenticated
 */
export function trackBuildSaved(carId, buildName, totalCost, hpGain, userId = null) {
  trackActivity(
    'Build Saved',
    {
      car_id: carId,
      build_name: buildName,
      total_cost: totalCost,
      hp_gain: hpGain,
    },
    userId
  );
}

/**
 * Track vehicle added to garage
 */
export function trackVehicleAdded(make, model, year, userId = null) {
  trackActivity(
    'Vehicle Added',
    {
      make,
      model,
      year,
    },
    userId
  );
}

const activityTracker = {
  trackActivity,
  trackCarView,
  trackFavorite,
  trackUnfavorite,
  trackComparisonStarted,
  trackComparisonCompleted,
  trackSearch,
  trackFilter,
  trackALUsage,
  trackBuildSaved,
  trackVehicleAdded,
};

export default activityTracker;
