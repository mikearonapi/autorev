'use client';

/**
 * useAnalytics Hook
 * 
 * Comprehensive analytics tracking for:
 * - Custom events with automatic context
 * - User signup & attribution
 * - Feature adoption tracking
 * - Search analytics
 * - Conversion/goal completion
 * - Session and visitor identification
 * 
 * Usage:
 *   const { trackEvent, trackFeatureUsage, trackSearch, trackGoal } = useAnalytics();
 *   trackEvent('button_clicked', { buttonId: 'signup-cta' });
 *   trackFeatureUsage('al_chat');
 *   trackSearch('nissan gtr', 'car_search', 15);
 *   trackGoal('signup_completed');
 * 
 * Note: This hook safely handles useSearchParams by catching any errors during
 * SSR/prerendering. UTM params will be captured on client-side hydration.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePathname } from 'next/navigation';

// Get or create session ID
function getSessionId() {
  if (typeof window === 'undefined') return null;
  
  let sessionId = sessionStorage.getItem('_ar_sid');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('_ar_sid', sessionId);
  }
  return sessionId;
}

// Get stored UTM params
function getStoredUtmParams() {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = sessionStorage.getItem('_ar_utm');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Store UTM params from URL
function storeUtmParams(searchParams) {
  if (typeof window === 'undefined') return;
  
  const utmParams = {
    utm_source: searchParams.get('utm_source'),
    utm_medium: searchParams.get('utm_medium'),
    utm_campaign: searchParams.get('utm_campaign'),
    utm_term: searchParams.get('utm_term'),
    utm_content: searchParams.get('utm_content')
  };
  
  // Only store if we have at least one UTM param
  if (Object.values(utmParams).some(v => v)) {
    sessionStorage.setItem('_ar_utm', JSON.stringify(utmParams));
    
    // Also store first touch if not already set
    if (!localStorage.getItem('_ar_first_touch')) {
      localStorage.setItem('_ar_first_touch', JSON.stringify({
        ...utmParams,
        referrer: document.referrer || null,
        landing_page: window.location.pathname,
        timestamp: new Date().toISOString()
      }));
    }
  }
}

// Get first touch data
function getFirstTouch() {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('_ar_first_touch');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Get current URL search params safely (client-side only)
 */
function getSearchParams() {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return null;
  }
}

/**
 * Analytics hook for event tracking
 */
export function useAnalytics() {
  const { user } = useAuth();
  const pathname = usePathname();
  const lastEventRef = useRef({});
  const [isClient, setIsClient] = useState(false);
  
  // Mark as client-side after mount
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Store UTM params on mount (client-side only)
  useEffect(() => {
    if (!isClient) return;
    const searchParams = getSearchParams();
    if (searchParams) {
      storeUtmParams(searchParams);
    }
  }, [isClient, pathname]); // Re-check when pathname changes
  
  /**
   * Track a custom event
   */
  const trackEvent = useCallback(async (eventName, properties = {}, options = {}) => {
    try {
      const sessionId = getSessionId();
      if (!sessionId) return;
      
      // Debounce duplicate events (same event within 500ms)
      const eventKey = `${eventName}-${JSON.stringify(properties)}`;
      const now = Date.now();
      if (lastEventRef.current[eventKey] && now - lastEventRef.current[eventKey] < 500) {
        return;
      }
      lastEventRef.current[eventKey] = now;
      
      const utmParams = getStoredUtmParams();
      
      const payload = {
        eventName,
        eventCategory: options.category || inferCategory(eventName),
        properties,
        sessionId,
        userId: user?.id || null,
        pagePath: pathname,
        pageTitle: typeof document !== 'undefined' ? document.title : null,
        utmSource: utmParams.utm_source,
        utmMedium: utmParams.utm_medium,
        utmCampaign: utmParams.utm_campaign
      };
      
      // Use sendBeacon for reliability
      const url = '/api/analytics/event';
      const body = JSON.stringify(payload);
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, body);
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true
        }).catch(() => {});
      }
    } catch {
      // Silently fail - analytics should never break the app
    }
  }, [user?.id, pathname]);
  
  /**
   * Track user signup with attribution
   */
  const trackSignup = useCallback(async (userId) => {
    try {
      const utmParams = getStoredUtmParams();
      const firstTouch = getFirstTouch();
      
      // Track signup event
      await trackEvent('signup_completed', { method: 'email' });
      
      // Save attribution
      const attributionData = {
        userId,
        source: firstTouch?.utm_source || utmParams.utm_source || null,
        medium: firstTouch?.utm_medium || utmParams.utm_medium || null,
        campaign: firstTouch?.utm_campaign || utmParams.utm_campaign || null,
        referrer: firstTouch?.referrer || document.referrer || null,
        landingPage: firstTouch?.landing_page || null,
        signupPage: pathname
      };
      
      fetch('/api/analytics/attribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attributionData)
      }).catch(() => {});
      
    } catch {
      // Silently fail
    }
  }, [trackEvent, pathname]);
  
  /**
   * Track onboarding step completion
   */
  const trackOnboardingStep = useCallback((step, stepName, data = {}) => {
    trackEvent(`onboarding_step_${step}`, {
      step,
      stepName,
      ...data
    }, { category: 'onboarding' });
  }, [trackEvent]);
  
  /**
   * Track feature usage (stored separately for adoption analysis)
   */
  const trackFeature = useCallback((featureName, data = {}) => {
    trackEvent(`feature_${featureName}`, data, { category: 'feature' });
  }, [trackEvent]);
  
  /**
   * Track detailed feature usage (for feature adoption dashboard)
   */
  const trackFeatureUsage = useCallback(async (featureKey, carContext = null, timeSpentSeconds = null) => {
    try {
      const sessionId = getSessionId();
      if (!sessionId) return;
      
      const payload = {
        sessionId,
        userId: user?.id || null,
        featureKey,
        entryPath: pathname,
        carContext,
        timeSpentSeconds
      };
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/feature', JSON.stringify(payload));
      } else {
        fetch('/api/analytics/feature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {});
      }
      
      // Also track as regular event
      trackEvent(`feature_used`, { featureKey, carContext }, { category: 'feature' });
    } catch {
      // Silently fail
    }
  }, [user?.id, pathname, trackEvent]);
  
  /**
   * Track search queries and results
   */
  const trackSearch = useCallback(async (query, searchType = 'global', resultsCount = null, filters = {}) => {
    try {
      const sessionId = getSessionId();
      if (!sessionId || !query) return;
      
      const payload = {
        sessionId,
        userId: user?.id || null,
        searchQuery: query,
        searchType,
        resultsCount,
        pageContext: pathname,
        filtersApplied: filters
      };
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/search', JSON.stringify(payload));
      } else {
        fetch('/api/analytics/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {});
      }
    } catch {
      // Silently fail
    }
  }, [user?.id, pathname]);
  
  /**
   * Track search result click
   */
  const trackSearchClick = useCallback(async (query, searchType, position, resultId, resultType) => {
    try {
      const sessionId = getSessionId();
      if (!sessionId) return;
      
      const payload = {
        sessionId,
        userId: user?.id || null,
        searchQuery: query,
        searchType,
        clickedResultPosition: position,
        clickedResultId: resultId,
        clickedResultType: resultType,
        pageContext: pathname
      };
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/search', JSON.stringify(payload));
      } else {
        fetch('/api/analytics/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {});
      }
    } catch {
      // Silently fail
    }
  }, [user?.id, pathname]);
  
  /**
   * Track conversion events
   */
  const trackConversion = useCallback((conversionType, data = {}) => {
    trackEvent(conversionType, data, { category: 'conversion' });
  }, [trackEvent]);
  
  /**
   * Track goal completion (for goal tracking dashboard)
   */
  const trackGoal = useCallback(async (goalKey, valueCents = null) => {
    try {
      const sessionId = getSessionId();
      if (!sessionId || !goalKey) return;
      
      const utmParams = getStoredUtmParams();
      const firstTouch = getFirstTouch();
      
      const payload = {
        goalKey,
        sessionId,
        userId: user?.id || null,
        pagePath: pathname,
        referrer: document.referrer || null,
        utmSource: utmParams.utm_source,
        utmMedium: utmParams.utm_medium,
        utmCampaign: utmParams.utm_campaign,
        valueCents,
        attributionSource: firstTouch?.utm_source || utmParams.utm_source,
        attributionMedium: firstTouch?.utm_medium || utmParams.utm_medium
      };
      
      // Use fetch for reliability (goals are important)
      fetch('/api/analytics/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
      
      // Also track as event
      trackEvent(goalKey, { valueCents }, { category: 'conversion' });
    } catch {
      // Silently fail
    }
  }, [user?.id, pathname, trackEvent]);
  
  /**
   * Track CTA click with context
   */
  const trackCTA = useCallback((ctaId, ctaText, destination = null) => {
    trackEvent(ANALYTICS_EVENTS.CTA_CLICKED, {
      ctaId,
      ctaText,
      destination,
      position: pathname
    }, { category: 'navigation' });
  }, [trackEvent, pathname]);
  
  /**
   * Track error for monitoring
   */
  const trackError = useCallback((errorType, errorMessage, context = {}) => {
    trackEvent('error_occurred', {
      errorType,
      errorMessage: errorMessage?.substring(0, 500),
      ...context
    }, { category: 'error' });
  }, [trackEvent]);
  
  return {
    trackEvent,
    trackSignup,
    trackOnboardingStep,
    trackFeature,
    trackFeatureUsage,
    trackSearch,
    trackSearchClick,
    trackConversion,
    trackGoal,
    trackCTA,
    trackError,
    getSessionId,
    getFirstTouch
  };
}

/**
 * Infer event category from event name
 */
function inferCategory(eventName) {
  if (eventName.includes('signup') || eventName.includes('onboarding')) return 'onboarding';
  if (eventName.includes('subscription') || eventName.includes('checkout') || eventName.includes('upgrade')) return 'conversion';
  if (eventName.includes('car_') || eventName.includes('garage') || eventName.includes('al_')) return 'feature';
  if (eventName.includes('click') || eventName.includes('nav') || eventName.includes('search')) return 'navigation';
  return 'engagement';
}

/**
 * Standard event names for consistency
 */
export const ANALYTICS_EVENTS = {
  // Onboarding
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',
  
  // Feature adoption
  CAR_SELECTED: 'car_selected',
  CAR_VIEWED: 'car_viewed',
  CAR_FAVORITED: 'car_favorited',
  CAR_UNFAVORITED: 'car_unfavorited',
  CAR_COMPARED: 'car_compared',
  CAR_SHARED: 'car_shared',
  GARAGE_ADDED: 'garage_added',
  GARAGE_REMOVED: 'garage_removed',
  AL_CONVERSATION_STARTED: 'al_conversation_started',
  AL_QUESTION_ASKED: 'al_question_asked',
  AL_RESPONSE_RATED: 'al_response_rated',
  BUILD_CREATED: 'build_created',
  BUILD_SAVED: 'build_saved',
  BUILD_SHARED: 'build_shared',
  
  // Conversion
  PRICING_VIEWED: 'pricing_viewed',
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_COMPLETED: 'checkout_completed',
  SUBSCRIPTION_CREATED: 'subscription_created',
  UPGRADE_COMPLETED: 'upgrade_completed',
  TRIAL_STARTED: 'trial_started',
  
  // Navigation
  CTA_CLICKED: 'cta_clicked',
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',
  FILTER_APPLIED: 'filter_applied',
  NAVIGATION_CLICKED: 'navigation_clicked',
  
  // Engagement
  PAGE_SCROLLED: 'page_scrolled',
  VIDEO_PLAYED: 'video_played',
  VIDEO_COMPLETED: 'video_completed',
  SHARE_CLICKED: 'share_clicked',
  COPY_PERFORMED: 'copy_performed',
  LINK_CLICKED: 'link_clicked',
  
  // User actions
  PROFILE_UPDATED: 'profile_updated',
  SETTINGS_CHANGED: 'settings_changed',
  NOTIFICATION_CLICKED: 'notification_clicked',
  
  // Errors
  ERROR_OCCURRED: 'error_occurred',
  PAGE_NOT_FOUND: 'page_not_found'
};

/**
 * Feature keys for adoption tracking
 */
export const FEATURE_KEYS = {
  // Core
  CAR_BROWSE: 'car_browse',
  CAR_VIEW: 'car_view',
  CAR_SEARCH: 'car_search',
  CAR_FILTER: 'car_filter',
  
  // Engagement
  CAR_FAVORITE: 'car_favorite',
  CAR_COMPARE: 'car_compare',
  CAR_SHARE: 'car_share',
  
  // Account
  GARAGE: 'garage',
  PROFILE: 'profile',
  SETTINGS: 'settings',
  
  // Premium
  AL_CHAT: 'al_chat',
  TUNING_SHOP: 'tuning_shop',
  MOD_PLANNER: 'mod_planner',
  VEHICLE_HEALTH: 'vehicle_health',
  
  // Community
  EVENTS: 'events',
  COMMUNITY: 'community',
  
  // Discovery
  ENCYCLOPEDIA: 'encyclopedia',
  DAILY_DOSE: 'daily_dose'
};

/**
 * Goal keys for conversion tracking
 */
export const GOAL_KEYS = {
  // Acquisition
  SIGNUP: 'signup_completed',
  ONBOARDING: 'onboarding_completed',
  
  // Activation
  FIRST_CAR_VIEW: 'first_car_view',
  FIRST_FAVORITE: 'first_favorite',
  FIRST_AL_CHAT: 'first_al_chat',
  
  // Revenue
  SUBSCRIPTION: 'subscription_created',
  UPGRADE: 'upgrade_completed',
  
  // Engagement
  DEEP_ENGAGEMENT: 'deep_engagement',
  RETURN_VISIT: 'return_visit'
};

export default useAnalytics;

