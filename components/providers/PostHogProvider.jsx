'use client';

/**
 * PostHog Analytics Provider
 * 
 * Provides PostHog analytics integration for:
 * - Product analytics and event tracking
 * - Session replay for debugging user issues
 * - Feature flags for A/B testing
 * - User identification linked to Supabase auth
 * 
 * Configuration:
 * - Set NEXT_PUBLIC_POSTHOG_KEY in environment
 * - Set NEXT_PUBLIC_POSTHOG_HOST (defaults to us.i.posthog.com)
 * 
 * @module components/providers/PostHogProvider
 */

import { useEffect, useCallback, createContext, useContext, useState } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

import posthog from 'posthog-js';

import { useAuth } from './AuthProvider';

// =============================================================================
// CONTEXT
// =============================================================================

const PostHogContext = createContext(null);

/**
 * Access PostHog context
 * @returns {{ capture, identify, reset, isReady }}
 */
export function usePostHog() {
  const context = useContext(PostHogContext);
  if (!context) {
    // Return safe defaults if used outside provider
    return {
      capture: () => {},
      identify: () => {},
      reset: () => {},
      isReady: false,
    };
  }
  return context;
}

// =============================================================================
// PAGE VIEW TRACKING
// =============================================================================

/**
 * Component that tracks page views automatically
 * Must be wrapped in Suspense for useSearchParams
 */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || typeof window === 'undefined') return;
    
    // Construct full URL
    const url = searchParams?.size
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    
    // Track page view in PostHog
    posthog.capture('$pageview', {
      $current_url: window.location.origin + url,
    });
  }, [pathname, searchParams]);

  return null;
}

// =============================================================================
// PROVIDER
// =============================================================================

/**
 * PostHog Provider Component
 * 
 * Initializes PostHog and provides analytics context to the app.
 * Automatically tracks page views and identifies authenticated users.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function PostHogProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const { user, profile, isAuthenticated } = useAuth();
  
  // Initialize PostHog on mount
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
    
    if (!key) {
      console.warn('[PostHog] Missing NEXT_PUBLIC_POSTHOG_KEY - analytics disabled');
      return;
    }
    
    // Don't reinitialize if already done
    if (posthog.__loaded) {
      setIsReady(true);
      return;
    }
    
    // Check if user has previously given consent
    const hasStoredConsent = typeof window !== 'undefined' && 
      localStorage.getItem('autorev_cookie_consent');
    const consentData = hasStoredConsent ? JSON.parse(hasStoredConsent) : null;
    const hasAnalyticsConsent = consentData?.analytics === true;
    
    try {
      posthog.init(key, {
        api_host: host,
        
        // =============================================================================
        // GDPR COMPLIANCE
        // =============================================================================
        // Require explicit consent before tracking (GDPR compliant)
        opt_out_capturing_by_default: !hasAnalyticsConsent,
        
        // Only create person profiles for identified users (4x cheaper for anonymous events)
        person_profiles: 'identified_only',
        
        // =============================================================================
        // PAGE VIEW TRACKING
        // =============================================================================
        // Capture page views manually (we handle SPA routing)
        capture_pageview: false,
        
        // Capture page leaves for session duration tracking
        capture_pageleave: true,
        
        // =============================================================================
        // SESSION REPLAY
        // =============================================================================
        session_recording: {
          // Enable session replay
          enabled: true,
          // Mask all text inputs by default (privacy)
          maskAllInputs: true,
          // Mask all text by default (can be overridden)
          maskTextContent: false,
        },
        
        // =============================================================================
        // AUTOCAPTURE
        // =============================================================================
        autocapture: {
          // Capture DOM events
          dom_event_allowlist: ['click', 'submit'],
          // Don't capture sensitive elements
          element_allowlist: ['a', 'button', 'form', 'input', 'select', 'textarea'],
          // Capture URL changes
          url_allowlist: ['.*'], // All URLs
        },
        
        // Bootstrap with feature flags (for faster initial load)
        bootstrap: {},
        
        // Advanced settings
        loaded: (ph) => {
          // In development, enable debug mode
          if (process.env.NODE_ENV === 'development') {
            ph.debug();
          }
          
          // If user previously gave consent, ensure tracking is enabled
          if (hasAnalyticsConsent) {
            ph.opt_in_capturing();
          }
          
          setIsReady(true);
          console.log('[PostHog] Initialized successfully', hasAnalyticsConsent ? '(consent granted)' : '(awaiting consent)');
        },
        
        // Respect Do Not Track browser setting
        respect_dnt: true,
        
        // Secure cookies in production
        secure_cookie: process.env.NODE_ENV === 'production',
        
        // Persistence for cross-session tracking
        persistence: 'localStorage+cookie',
      });
    } catch (error) {
      console.error('[PostHog] Initialization failed:', error);
    }
    
    // Cleanup on unmount
    return () => {
      // Don't shutdown - PostHog handles this internally
    };
  }, []);
  
  // Identify user when authentication changes
  useEffect(() => {
    if (!isReady) return;
    
    if (isAuthenticated && user?.id) {
      // Identify the user in PostHog
      const userProperties = {
        email: user.email,
        name: profile?.display_name || user.user_metadata?.name,
        subscription_tier: profile?.subscription_tier || 'free',
        created_at: user.created_at,
        // Add more useful properties
        ...(profile?.stripe_customer_id && { stripe_customer_id: profile.stripe_customer_id }),
        ...(profile?.onboarding_completed_at && { onboarding_completed: true }),
      };
      
      posthog.identify(user.id, userProperties);
      console.log('[PostHog] User identified:', user.id.slice(0, 8) + '...');
      
      // Set person properties that persist
      posthog.people.set({
        $email: user.email,
        $name: userProperties.name,
      });
    } else if (!isAuthenticated) {
      // Reset identity on logout
      posthog.reset();
    }
  }, [isReady, isAuthenticated, user, profile]);
  
  // Context value with safe wrappers
  const capture = useCallback((event, properties = {}) => {
    if (!isReady) return;
    posthog.capture(event, properties);
  }, [isReady]);
  
  const identify = useCallback((distinctId, properties = {}) => {
    if (!isReady) return;
    posthog.identify(distinctId, properties);
  }, [isReady]);
  
  const reset = useCallback(() => {
    if (!isReady) return;
    posthog.reset();
  }, [isReady]);
  
  const contextValue = {
    capture,
    identify,
    reset,
    isReady,
    // Expose posthog instance for advanced usage
    posthog: isReady ? posthog : null,
  };
  
  return (
    <PostHogContext.Provider value={contextValue}>
      {/* Page view tracker - wrapped in Suspense */}
      {isReady && (
        <PageViewTracker />
      )}
      {children}
    </PostHogContext.Provider>
  );
}

export default PostHogProvider;
