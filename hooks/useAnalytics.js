'use client';

/**
 * useAnalytics Hook
 * 
 * Provides easy event tracking throughout the app.
 * Automatically includes session context, user info, and UTM params.
 * 
 * Usage:
 *   const { trackEvent } = useAnalytics();
 *   trackEvent('button_clicked', { buttonId: 'signup-cta' });
 * 
 * Standard Events:
 *   - Onboarding: signup_started, signup_completed, onboarding_step_N, onboarding_completed
 *   - Features: car_selected, car_favorited, garage_added, al_conversation_started
 *   - Conversion: pricing_viewed, checkout_started, subscription_created
 *   - Navigation: cta_clicked, search_performed
 */

import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePathname, useSearchParams } from 'next/navigation';

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
 * Analytics hook for event tracking
 */
export function useAnalytics() {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastEventRef = useRef({});
  
  // Store UTM params on mount and URL changes
  useEffect(() => {
    storeUtmParams(searchParams);
  }, [searchParams]);
  
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
   * Track feature usage
   */
  const trackFeature = useCallback((featureName, data = {}) => {
    trackEvent(`feature_${featureName}`, data, { category: 'feature' });
  }, [trackEvent]);
  
  /**
   * Track conversion events
   */
  const trackConversion = useCallback((conversionType, data = {}) => {
    trackEvent(conversionType, data, { category: 'conversion' });
  }, [trackEvent]);
  
  return {
    trackEvent,
    trackSignup,
    trackOnboardingStep,
    trackFeature,
    trackConversion,
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
  CAR_FAVORITED: 'car_favorited',
  CAR_COMPARED: 'car_compared',
  GARAGE_ADDED: 'garage_added',
  AL_CONVERSATION_STARTED: 'al_conversation_started',
  AL_QUESTION_ASKED: 'al_question_asked',
  BUILD_CREATED: 'build_created',
  BUILD_SAVED: 'build_saved',
  
  // Conversion
  PRICING_VIEWED: 'pricing_viewed',
  CHECKOUT_STARTED: 'checkout_started',
  SUBSCRIPTION_CREATED: 'subscription_created',
  UPGRADE_COMPLETED: 'upgrade_completed',
  
  // Navigation
  CTA_CLICKED: 'cta_clicked',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  
  // Engagement
  PAGE_SCROLLED: 'page_scrolled',
  VIDEO_PLAYED: 'video_played',
  SHARE_CLICKED: 'share_clicked'
};

export default useAnalytics;

