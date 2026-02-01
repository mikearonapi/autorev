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
 * Performance: PostHog is lazy-loaded after initial render to avoid
 * blocking LCP with polyfills. The ~21 KiB of core-js polyfills in
 * posthog-js are deferred until after the page is interactive.
 *
 * @module components/providers/PostHogProvider
 */

import { useEffect, useCallback, createContext, useContext, useState, useRef } from 'react';

import { usePathname, useSearchParams } from 'next/navigation';

// Note: posthog-js is lazy-loaded in useEffect to avoid blocking initial render
// This removes ~21 KiB of polyfills from the critical path

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
function PageViewTracker({ posthogInstance }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || typeof window === 'undefined' || !posthogInstance) return;

    // Construct full URL
    const url = searchParams?.size ? `${pathname}?${searchParams.toString()}` : pathname;

    // Track page view in PostHog
    posthogInstance.capture('$pageview', {
      $current_url: window.location.origin + url,
    });
  }, [pathname, searchParams, posthogInstance]);

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
 * PostHog is lazy-loaded after initial render to improve LCP by ~21 KiB.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function PostHogProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const posthogRef = useRef(null);
  const { user, profile, isAuthenticated } = useAuth();

  // Lazy load and initialize PostHog on mount
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (!key) {
      console.warn('[PostHog] Missing NEXT_PUBLIC_POSTHOG_KEY - analytics disabled');
      return;
    }

    // Lazy load posthog-js to avoid blocking initial render
    // This defers ~21 KiB of polyfills until after LCP
    import('posthog-js')
      .then(({ default: posthog }) => {
        // Don't reinitialize if already done
        if (posthog.__loaded) {
          posthogRef.current = posthog;
          setIsReady(true);
          return;
        }

        // Check if user has previously given consent
        const hasStoredConsent =
          typeof window !== 'undefined' && localStorage.getItem('autorev_cookie_consent');
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

              posthogRef.current = ph;
              setIsReady(true);
              console.log(
                '[PostHog] Initialized successfully',
                hasAnalyticsConsent ? '(consent granted)' : '(awaiting consent)'
              );
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
      })
      .catch((error) => {
        console.error('[PostHog] Failed to load:', error);
      });

    // Cleanup on unmount
    return () => {
      // Don't shutdown - PostHog handles this internally
    };
  }, []);

  // Identify user when authentication changes
  useEffect(() => {
    if (!isReady || !posthogRef.current) return;

    const posthog = posthogRef.current;

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
  const capture = useCallback(
    (event, properties = {}) => {
      if (!isReady || !posthogRef.current) return;
      posthogRef.current.capture(event, properties);
    },
    [isReady]
  );

  const identify = useCallback(
    (distinctId, properties = {}) => {
      if (!isReady || !posthogRef.current) return;
      posthogRef.current.identify(distinctId, properties);
    },
    [isReady]
  );

  const reset = useCallback(() => {
    if (!isReady || !posthogRef.current) return;
    posthogRef.current.reset();
  }, [isReady]);

  const contextValue = {
    capture,
    identify,
    reset,
    isReady,
    // Expose posthog instance for advanced usage
    posthog: posthogRef.current,
  };

  return (
    <PostHogContext.Provider value={contextValue}>
      {/* Page view tracker - wrapped in Suspense */}
      {isReady && posthogRef.current && <PageViewTracker posthogInstance={posthogRef.current} />}
      {children}
    </PostHogContext.Provider>
  );
}

export default PostHogProvider;
