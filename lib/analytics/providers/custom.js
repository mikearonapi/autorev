/**
 * Custom Analytics Provider Adapter
 * 
 * Sends analytics events to our own backend API for storage in Supabase.
 * This provides first-party analytics data that we fully control.
 * 
 * @module lib/analytics/providers/custom
 */

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get or create session ID for anonymous tracking
 * @returns {string|null}
 */
function getSessionId() {
  if (typeof window === 'undefined') return null;
  
  let sessionId = sessionStorage.getItem('_ar_sid');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('_ar_sid', sessionId);
  }
  return sessionId;
}

/**
 * Get or create visitor ID (persists across sessions)
 * @returns {string|null}
 */
function getVisitorId() {
  if (typeof window === 'undefined') return null;
  
  let visitorId = localStorage.getItem('_ar_vid');
  if (!visitorId) {
    visitorId = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('_ar_vid', visitorId);
  }
  return visitorId;
}

// =============================================================================
// CUSTOM PROVIDER
// =============================================================================

/** @type {string|null} */
let currentUserId = null;

/**
 * Custom analytics provider that sends to our API
 * @type {import('../manager').AnalyticsProvider}
 */
export const customProvider = {
  name: 'custom',

  /**
   * Check if the provider is ready
   * @returns {boolean}
   */
  isReady() {
    return typeof window !== 'undefined';
  },

  /**
   * Track an event to our backend
   * 
   * @param {string} event - Event name
   * @param {Object} [properties={}] - Event properties
   */
  track(event, properties = {}) {
    if (typeof window === 'undefined') {
      return;
    }

    // Don't track in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_TRACK_DEV) {
      return;
    }

    const payload = {
      event,
      properties,
      user_id: currentUserId,
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      page_url: window.location.href,
      page_path: window.location.pathname,
      referrer: document.referrer || null,
      timestamp: new Date().toISOString(),
    };

    // Use sendBeacon for reliability (doesn't block navigation)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/event', JSON.stringify(payload));
    } else {
      // Fallback to fetch
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Silently fail - analytics should never break the app
      });
    }
  },

  /**
   * Identify a user
   * 
   * @param {string} userId - User's unique ID
   * @param {Object} [traits={}] - User traits
   */
  identify(userId, traits = {}) {
    currentUserId = userId;

    // Optionally send identify event to backend
    if (typeof window === 'undefined') {
      return;
    }

    const payload = {
      user_id: userId,
      traits,
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      timestamp: new Date().toISOString(),
    };

    fetch('/api/analytics/identify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Silently fail
    });
  },

  /**
   * Track a page view
   * 
   * @param {string} [pageName] - Page name
   * @param {Object} [properties={}] - Additional properties
   */
  page(pageName, properties = {}) {
    if (typeof window === 'undefined') {
      return;
    }

    // Don't track in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_TRACK_DEV) {
      return;
    }

    const payload = {
      path: window.location.pathname,
      page_name: pageName || document.title,
      user_id: currentUserId,
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      referrer: document.referrer || null,
      page_url: window.location.href,
      ...properties,
    };

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/track', JSON.stringify(payload));
    } else {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  },

  /**
   * Reset user identity
   */
  reset() {
    currentUserId = null;
    
    // Generate new session ID
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('_ar_sid');
    }
  },
};

export default customProvider;
