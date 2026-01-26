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
 *   trackEvent('Button Clicked', { buttonId: 'signup-cta' });
 *   trackFeatureUsage('al_chat');
 *   trackSearch('nissan gtr', 'car_search', 15);
 *   trackGoal('signup_completed');
 * 
 * Note: This hook safely handles useSearchParams by catching any errors during
 * SSR/prerendering. UTM params will be captured on client-side hydration.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { usePathname } from 'next/navigation';

import { useAuth } from '@/components/providers/AuthProvider';

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
      await trackEvent('Signup Completed', { method: 'email' });
      
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
    trackEvent(`Onboarding Step ${step}`, {
      step,
      stepName,
      ...data
    }, { category: 'onboarding' });
  }, [trackEvent]);
  
  /**
   * Track feature usage (stored separately for adoption analysis)
   */
  const trackFeature = useCallback((featureName, data = {}) => {
    trackEvent(`Feature ${featureName}`, data, { category: 'feature' });
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
      trackEvent('Feature Used', { featureKey, carContext }, { category: 'feature' });
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
    trackEvent('Error Occurred', {
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
 * Updated to work with Title Case event names
 */
function inferCategory(eventName) {
  const lower = eventName.toLowerCase();
  if (lower.includes('signup') || lower.includes('onboarding')) return 'onboarding';
  if (lower.includes('subscription') || lower.includes('checkout') || lower.includes('upgrade')) return 'conversion';
  if (lower.includes('car') || lower.includes('garage') || lower.includes('al ')) return 'feature';
  if (lower.includes('click') || lower.includes('nav') || lower.includes('search')) return 'navigation';
  return 'engagement';
}

/**
 * Standard event names for consistency
 * 
 * NAMING CONVENTION: "Object + Past-Tense Verb" in Title Case
 * Examples: "User Signed Up", "Car Viewed", "Build Shared"
 * 
 * BUILD PIVOT: Events organized around the Build user journey
 */
export const ANALYTICS_EVENTS = {
  // Onboarding
  SIGNUP_STARTED: 'Signup Started',
  SIGNUP_COMPLETED: 'Signup Completed',
  ONBOARDING_STARTED: 'Onboarding Started',
  ONBOARDING_COMPLETED: 'Onboarding Completed',
  ONBOARDING_SKIPPED: 'Onboarding Skipped',
  
  // BUILD FUNNEL - Core events for the Build pivot
  // Step 1: Discovery
  TUNING_SHOP_VIEWED: 'Tuning Shop Viewed',
  BUILD_CAR_SELECTED: 'Build Car Selected',
  BUILD_CONFIGURATION_STARTED: 'Build Configuration Started',
  
  // Step 2: Configuration
  MOD_CATEGORY_VIEWED: 'Mod Category Viewed',
  MOD_ADDED_TO_BUILD: 'Mod Added To Build',
  MOD_REMOVED_FROM_BUILD: 'Mod Removed From Build',
  PERFORMANCE_PREVIEW_VIEWED: 'Performance Preview Viewed',
  COST_SUMMARY_VIEWED: 'Cost Summary Viewed',
  
  // Step 3: Project Management
  BUILD_PROJECT_CREATED: 'Build Project Created',
  BUILD_PROJECT_SAVED: 'Build Project Saved',
  BUILD_PROJECT_UPDATED: 'Build Project Updated',
  BUILD_PROJECT_DELETED: 'Build Project Deleted',
  MOD_MARKED_INSTALLED: 'Mod Marked Installed',
  MOD_MARKED_PURCHASED: 'Mod Marked Purchased',
  
  // Step 4: Community
  BUILD_SHARED: 'Build Shared',
  BUILD_LIKED: 'Build Liked',
  BUILD_COMMENTED: 'Build Commented',
  COMMUNITY_BUILD_VIEWED: 'Community Build Viewed',
  BUILD_CLONED: 'Build Cloned',
  
  // Parts Research
  PARTS_SEARCH_PERFORMED: 'Parts Search Performed',
  PARTS_FILTER_APPLIED: 'Parts Filter Applied',
  PART_VIEWED: 'Part Viewed',
  PART_ADDED_TO_BUILD: 'Part Added To Build',
  PART_PRICING_CLICKED: 'Part Pricing Clicked',
  
  // AI Assistant (Build-focused)
  AL_CONVERSATION_STARTED: 'AL Conversation Started',
  AL_BUILD_QUESTION_ASKED: 'AL Build Question Asked',
  AL_PART_RECOMMENDATION: 'AL Part Recommendation Received',
  AL_COMPATIBILITY_CHECK: 'AL Compatibility Checked',
  AL_RESPONSE_RATED: 'AL Response Rated',
  
  // Car Interactions
  CAR_SELECTED: 'Car Selected',
  CAR_VIEWED: 'Car Viewed',
  CAR_FAVORITED: 'Car Favorited',
  CAR_UNFAVORITED: 'Car Unfavorited',
  CAR_COMPARED: 'Car Compared',
  CAR_SHARED: 'Car Shared',
  GARAGE_ADDED: 'Garage Vehicle Added',
  GARAGE_REMOVED: 'Garage Vehicle Removed',
  AL_QUESTION_ASKED: 'AL Question Asked',
  BUILD_CREATED: 'Build Created',
  BUILD_SAVED: 'Build Saved',
  
  // Conversion
  PRICING_VIEWED: 'Pricing Viewed',
  CHECKOUT_STARTED: 'Checkout Started',
  CHECKOUT_COMPLETED: 'Checkout Completed',
  SUBSCRIPTION_CREATED: 'Subscription Created',
  UPGRADE_COMPLETED: 'Upgrade Completed',
  TRIAL_STARTED: 'Trial Started',
  
  // Navigation
  CTA_CLICKED: 'CTA Clicked',
  SEARCH_PERFORMED: 'Search Performed',
  SEARCH_RESULT_CLICKED: 'Search Result Clicked',
  FILTER_APPLIED: 'Filter Applied',
  NAVIGATION_CLICKED: 'Navigation Clicked',
  
  // Engagement
  PAGE_SCROLLED: 'Page Scrolled',
  VIDEO_PLAYED: 'Video Played',
  VIDEO_COMPLETED: 'Video Completed',
  SHARE_CLICKED: 'Share Clicked',
  COPY_PERFORMED: 'Copy Performed',
  LINK_CLICKED: 'Link Clicked',
  
  // User actions
  PROFILE_UPDATED: 'Profile Updated',
  SETTINGS_CHANGED: 'Settings Changed',
  NOTIFICATION_CLICKED: 'Notification Clicked',
  
  // Errors
  ERROR_OCCURRED: 'Error Occurred',
  PAGE_NOT_FOUND: 'Page Not Found'
};

/**
 * Feature keys for adoption tracking
 * BUILD PIVOT: Features organized around Build functionality
 */
export const FEATURE_KEYS = {
  // BUILD CORE (Primary metrics)
  TUNING_SHOP: 'tuning_shop',
  BUILD_PLANNER: 'build_planner',
  MOD_CONFIGURATOR: 'mod_configurator',
  PERFORMANCE_PREVIEW: 'performance_preview',
  COST_TRACKER: 'cost_tracker',
  
  // Project Management
  MY_BUILDS: 'my_builds',
  PROJECT_CREATE: 'project_create',
  PROJECT_UPDATE: 'project_update',
  MOD_TRACKING: 'mod_tracking',
  
  // Parts Research
  PARTS_BROWSER: 'parts_browser',
  PARTS_SEARCH: 'parts_search',
  PARTS_FILTER: 'parts_filter',
  PART_DETAIL: 'part_detail',
  
  // AI Assistant (Build-focused)
  AL_BUILD_CHAT: 'al_build_chat',
  AL_COMPATIBILITY: 'al_compatibility',
  AL_RECOMMENDATIONS: 'al_recommendations',
  
  // Community
  COMMUNITY_BUILDS: 'community_builds',
  BUILD_SHARE: 'build_share',
  EVENTS: 'events',
  
  // Discovery
  ENCYCLOPEDIA: 'encyclopedia',
  
  // Legacy (kept for backwards compatibility)
  CAR_BROWSE: 'car_browse',
  CAR_VIEW: 'car_view',
  CAR_SEARCH: 'car_search',
  CAR_FILTER: 'car_filter',
  CAR_FAVORITE: 'car_favorite',
  CAR_COMPARE: 'car_compare',
  CAR_SHARE: 'car_share',
  GARAGE: 'garage',
  PROFILE: 'profile',
  SETTINGS: 'settings',
  AL_CHAT: 'al_chat',
  MOD_PLANNER: 'mod_planner',
  VEHICLE_HEALTH: 'vehicle_health',
  COMMUNITY: 'community',
  DAILY_DOSE: 'daily_dose'
};

/**
 * Goal keys for conversion tracking
 * 
 * NAMING CONVENTION: "Object + Past-Tense Verb" in Title Case
 * BUILD PIVOT: Goals focused on Build funnel progression
 */
export const GOAL_KEYS = {
  // Acquisition
  SIGNUP: 'Signup Completed',
  ONBOARDING: 'Onboarding Completed',
  
  // BUILD FUNNEL ACTIVATION (Primary metrics)
  FIRST_TUNING_SHOP_VISIT: 'First Tuning Shop Visited',
  FIRST_CAR_SELECTED_FOR_BUILD: 'First Car Selected For Build',
  FIRST_MOD_ADDED: 'First Mod Added',
  FIRST_PROJECT_SAVED: 'First Project Saved',
  FIRST_BUILD_SHARED: 'First Build Shared',
  
  // BUILD ENGAGEMENT
  MULTIPLE_PROJECTS: 'Multiple Projects Created',
  BUILD_COMPLETED: 'Build Marked Completed',
  COMMUNITY_INTERACTION: 'Community Build Interaction',
  
  // Parts Engagement
  FIRST_PART_SEARCH: 'First Part Searched',
  PART_PRICING_CLICKED: 'Part Pricing Clicked',
  
  // AI Engagement (Build-focused)
  FIRST_AL_BUILD_CHAT: 'First AL Build Chat',
  AL_RECOMMENDATION_FOLLOWED: 'AL Recommendation Followed',
  
  // Revenue
  SUBSCRIPTION: 'Subscription Created',
  UPGRADE: 'Upgrade Completed',
  
  // Car Interactions
  FIRST_CAR_VIEW: 'First Car Viewed',
  FIRST_FAVORITE: 'First Favorite Added',
  FIRST_AL_CHAT: 'First AL Chat',
  
  // Engagement
  DEEP_ENGAGEMENT: 'Deep Engagement Achieved',
  RETURN_VISIT: 'Return Visit'
};

export default useAnalytics;

