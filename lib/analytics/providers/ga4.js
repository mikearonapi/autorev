/**
 * Google Analytics 4 Provider Adapter
 * 
 * Adapts GA4 (gtag) to the unified analytics interface.
 * Automatically converts event names from Title Case to snake_case
 * as GA4 convention differs from PostHog.
 * 
 * @module lib/analytics/providers/ga4
 */

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Convert Title Case to snake_case
 * "Car Viewed" -> "car_viewed"
 * 
 * @param {string} str
 * @returns {string}
 */
function toSnakeCase(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '_');
}

/**
 * Get GA4 Measurement ID from environment
 */
const GA_MEASUREMENT_ID = typeof process !== 'undefined' 
  ? process.env?.NEXT_PUBLIC_GA_MEASUREMENT_ID 
  : undefined;

// =============================================================================
// GA4 PROVIDER
// =============================================================================

/**
 * Google Analytics 4 provider adapter
 * @type {import('../manager').AnalyticsProvider}
 */
export const ga4Provider = {
  name: 'ga4',

  /**
   * Check if GA4 is available
   * @returns {boolean}
   */
  isReady() {
    return typeof window !== 'undefined' && typeof window.gtag === 'function';
  },

  /**
   * Track an event to GA4
   * Event names are converted from Title Case to snake_case
   * 
   * @param {string} event - Event name (Title Case, will be converted)
   * @param {Object} [properties={}] - Event properties
   */
  track(event, properties = {}) {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
      return;
    }

    if (!GA_MEASUREMENT_ID) {
      return;
    }

    try {
      // Convert event name to GA4 convention (snake_case)
      const ga4EventName = toSnakeCase(event);
      
      // Remove timestamp from properties (GA4 adds its own)
      const { timestamp: _timestamp, ...ga4Properties } = properties;
      
      window.gtag('event', ga4EventName, ga4Properties);
    } catch (error) {
      console.error('[GA4 Provider] Track failed:', error);
    }
  },

  /**
   * Identify a user in GA4
   * GA4 uses user_id property rather than identify() call
   * 
   * @param {string} userId - User's unique ID
   * @param {Object} [traits={}] - User traits/properties
   */
  identify(userId, traits = {}) {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
      return;
    }

    if (!GA_MEASUREMENT_ID) {
      return;
    }

    try {
      // Set user ID
      window.gtag('config', GA_MEASUREMENT_ID, {
        user_id: userId,
      });

      // Set user properties
      if (Object.keys(traits).length > 0) {
        window.gtag('set', 'user_properties', traits);
      }
    } catch (error) {
      console.error('[GA4 Provider] Identify failed:', error);
    }
  },

  /**
   * Track a page view in GA4
   * 
   * @param {string} [pageName] - Page name/title
   * @param {Object} [properties={}] - Additional properties
   */
  page(pageName, properties = {}) {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
      return;
    }

    if (!GA_MEASUREMENT_ID) {
      return;
    }

    try {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_title: pageName || document.title,
        page_path: window.location.pathname,
        ...properties,
      });
    } catch (error) {
      console.error('[GA4 Provider] Page failed:', error);
    }
  },

  /**
   * Reset user identity in GA4
   * GA4 doesn't have a direct reset, so we set user_id to null
   */
  reset() {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
      return;
    }

    if (!GA_MEASUREMENT_ID) {
      return;
    }

    try {
      window.gtag('config', GA_MEASUREMENT_ID, {
        user_id: null,
      });
    } catch (error) {
      console.error('[GA4 Provider] Reset failed:', error);
    }
  },

  /**
   * Update consent state
   * 
   * @param {'granted'|'denied'} analyticsStorage
   * @param {'granted'|'denied'} [adStorage]
   */
  updateConsent(analyticsStorage, adStorage = analyticsStorage) {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
      return;
    }

    try {
      window.gtag('consent', 'update', {
        analytics_storage: analyticsStorage,
        ad_storage: adStorage,
      });
    } catch (error) {
      console.error('[GA4 Provider] Consent update failed:', error);
    }
  },
};

export default ga4Provider;
