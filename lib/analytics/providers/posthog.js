/**
 * PostHog Analytics Provider Adapter
 * 
 * Adapts PostHog SDK to the unified analytics interface.
 * Provides full PostHog functionality including:
 * - Event tracking
 * - User identification
 * - Feature flags (via separate hook)
 * - Session replay
 * 
 * @module lib/analytics/providers/posthog
 */

// =============================================================================
// POSTHOG PROVIDER
// =============================================================================

/**
 * PostHog analytics provider adapter
 * @type {import('../manager').AnalyticsProvider}
 */
export const posthogProvider = {
  name: 'posthog',

  /**
   * Check if PostHog is available
   * @returns {boolean}
   */
  isReady() {
    return typeof window !== 'undefined' && !!window.posthog?.__loaded;
  },

  /**
   * Track an event to PostHog
   * 
   * @param {string} event - Event name (Title Case)
   * @param {Object} [properties={}] - Event properties
   */
  track(event, properties = {}) {
    if (typeof window === 'undefined' || !window.posthog) {
      return;
    }

    try {
      window.posthog.capture(event, properties);
    } catch (error) {
      console.error('[PostHog Provider] Track failed:', error);
    }
  },

  /**
   * Identify a user in PostHog
   * 
   * @param {string} userId - User's unique ID
   * @param {Object} [traits={}] - User traits/properties
   */
  identify(userId, traits = {}) {
    if (typeof window === 'undefined' || !window.posthog) {
      return;
    }

    try {
      window.posthog.identify(userId, traits);
      
      // Also set person properties
      if (traits.email || traits.name) {
        window.posthog.people?.set({
          ...(traits.email && { $email: traits.email }),
          ...(traits.name && { $name: traits.name }),
        });
      }
    } catch (error) {
      console.error('[PostHog Provider] Identify failed:', error);
    }
  },

  /**
   * Track a page view in PostHog
   * 
   * @param {string} [pageName] - Page name
   * @param {Object} [properties={}] - Additional properties
   */
  page(pageName, properties = {}) {
    if (typeof window === 'undefined' || !window.posthog) {
      return;
    }

    try {
      window.posthog.capture('$pageview', {
        ...(pageName && { page_name: pageName }),
        $current_url: window.location.href,
        ...properties,
      });
    } catch (error) {
      console.error('[PostHog Provider] Page failed:', error);
    }
  },

  /**
   * Reset user identity in PostHog
   */
  reset() {
    if (typeof window === 'undefined' || !window.posthog) {
      return;
    }

    try {
      window.posthog.reset();
    } catch (error) {
      console.error('[PostHog Provider] Reset failed:', error);
    }
  },

  /**
   * Set super properties (attached to all future events)
   * 
   * @param {Object} properties - Properties to set
   */
  setOnce(properties) {
    if (typeof window === 'undefined' || !window.posthog) {
      return;
    }

    try {
      window.posthog.register_once(properties);
    } catch (error) {
      console.error('[PostHog Provider] SetOnce failed:', error);
    }
  },

  /**
   * Opt in to capturing (after consent)
   */
  optIn() {
    if (typeof window === 'undefined' || !window.posthog) {
      return;
    }

    try {
      window.posthog.opt_in_capturing();
    } catch (error) {
      console.error('[PostHog Provider] OptIn failed:', error);
    }
  },

  /**
   * Opt out of capturing
   */
  optOut() {
    if (typeof window === 'undefined' || !window.posthog) {
      return;
    }

    try {
      window.posthog.opt_out_capturing();
    } catch (error) {
      console.error('[PostHog Provider] OptOut failed:', error);
    }
  },
};

export default posthogProvider;
