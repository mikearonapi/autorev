/**
 * Activity Tracker
 * 
 * Client-side utility for tracking user activity.
 * Fire-and-forget pattern - doesn't block UI.
 * 
 * @module lib/activityTracker
 */

/**
 * Generate or retrieve session ID for anonymous tracking
 */
function getSessionId() {
  if (typeof window === 'undefined') return null;
  
  let sessionId = sessionStorage.getItem('autorev_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('autorev_session_id', sessionId);
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
  trackActivity('car_viewed', {
    car_slug: carSlug,
    car_name: carName,
    source, // 'search', 'browse', 'comparison', 'direct', etc.
  }, userId);
}

/**
 * Track car favorited
 */
export function trackFavorite(carSlug, carName, userId = null) {
  trackActivity('car_favorited', {
    car_slug: carSlug,
    car_name: carName,
  }, userId);
}

/**
 * Track car unfavorited
 */
export function trackUnfavorite(carSlug, userId = null) {
  trackActivity('car_unfavorited', {
    car_slug: carSlug,
  }, userId);
}

/**
 * Track comparison started
 */
export function trackComparisonStarted(carSlugs, userId = null) {
  trackActivity('comparison_started', {
    car_slugs: carSlugs,
    count: carSlugs.length,
  }, userId);
}

/**
 * Track comparison completed
 */
export function trackComparisonCompleted(carSlugs, durationSeconds, userId = null) {
  trackActivity('comparison_completed', {
    car_slugs: carSlugs,
    count: carSlugs.length,
    duration_seconds: durationSeconds,
  }, userId);
}

/**
 * Track search performed
 */
export function trackSearch(query, resultsCount, filters = {}, userId = null) {
  trackActivity('search_performed', {
    query,
    results_count: resultsCount,
    filters,
  }, userId);
}

/**
 * Track filter applied
 */
export function trackFilter(filterType, filterValue, resultsCount, userId = null) {
  trackActivity('filter_applied', {
    filter_type: filterType,
    filter_value: filterValue,
    results_count: resultsCount,
  }, userId);
}

/**
 * Track AI Mechanic (AL) usage
 */
export function trackALUsage(carSlug, questionType, userId = null) {
  trackActivity('ai_mechanic_used', {
    car_slug: carSlug,
    question_type: questionType, // 'general', 'comparison', 'maintenance', etc.
  }, userId);
}

/**
 * Track build saved
 */
export function trackBuildSaved(carSlug, buildName, totalCost, hpGain, userId = null) {
  trackActivity('build_saved', {
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
  trackActivity('vehicle_added', {
    make,
    model,
    year,
  }, userId);
}

export default {
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

