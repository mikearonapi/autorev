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
    console.debug('[ActivityTracker] Skipping in dev:', eventType, eventData);
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
  }).catch((err) => {
    // Silently fail - activity tracking should never break the app
    console.debug('[ActivityTracker] Failed to track:', err.message);
  });
}

// =============================================================================
// Convenience Methods
// =============================================================================

/**
 * Track car page view
 */
export function trackCarView(carSlug, carName, source = 'direct', userId = null) {
  trackActivity('Car Viewed', {
    car_slug: carSlug,
    car_name: carName,
    source, // 'search', 'browse', 'comparison', 'direct', etc.
  }, userId);
}

/**
 * Track car favorited
 */
export function trackFavorite(carSlug, carName, userId = null) {
  trackActivity('Car Favorited', {
    car_slug: carSlug,
    car_name: carName,
  }, userId);
}

/**
 * Track car unfavorited
 */
export function trackUnfavorite(carSlug, userId = null) {
  trackActivity('Car Unfavorited', {
    car_slug: carSlug,
  }, userId);
}

/**
 * Track comparison started
 */
export function trackComparisonStarted(carSlugs, userId = null) {
  trackActivity('Comparison Started', {
    car_slugs: carSlugs,
    count: carSlugs.length,
  }, userId);
}

/**
 * Track comparison completed
 */
export function trackComparisonCompleted(carSlugs, durationSeconds, userId = null) {
  trackActivity('Comparison Completed', {
    car_slugs: carSlugs,
    count: carSlugs.length,
    duration_seconds: durationSeconds,
  }, userId);
}

/**
 * Track search performed
 */
export function trackSearch(query, resultsCount, filters = {}, userId = null) {
  trackActivity('Search Performed', {
    query,
    results_count: resultsCount,
    filters,
  }, userId);
}

/**
 * Track filter applied
 */
export function trackFilter(filterType, filterValue, resultsCount, userId = null) {
  trackActivity('Filter Applied', {
    filter_type: filterType,
    filter_value: filterValue,
    results_count: resultsCount,
  }, userId);
}

/**
 * Track AI Mechanic (AL) usage
 */
export function trackALUsage(carSlug, questionType, userId = null) {
  trackActivity('AL Used', {
    car_slug: carSlug,
    question_type: questionType, // 'general', 'comparison', 'maintenance', etc.
  }, userId);
}

/**
 * Track build saved
 */
export function trackBuildSaved(carSlug, buildName, totalCost, hpGain, userId = null) {
  trackActivity('Build Saved', {
    car_slug: carSlug,
    build_name: buildName,
    total_cost: totalCost,
    hp_gain: hpGain,
  }, userId);
}

/**
 * Track vehicle added to garage
 */
export function trackVehicleAdded(make, model, year, userId = null) {
  trackActivity('Vehicle Added', {
    make,
    model,
    year,
  }, userId);
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

