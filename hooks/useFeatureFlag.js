'use client';

/**
 * Feature Flag Hook
 * 
 * Provides access to PostHog feature flags for A/B testing and feature rollouts.
 * Integrates with PostHog's feature flag system for:
 * - Boolean feature flags (enabled/disabled)
 * - Multivariate flags (variant strings)
 * - Payload data attached to flags
 * 
 * @module hooks/useFeatureFlag
 * 
 * @example
 * // Boolean flag
 * const { enabled, loading } = useFeatureFlag('new-checkout-flow');
 * 
 * // Multivariate flag
 * const { variant, loading } = useFeatureFlag('pricing-page-experiment');
 * // variant could be 'control', 'variant-a', 'variant-b', etc.
 * 
 * // With payload
 * const { enabled, payload, loading } = useFeatureFlag('dynamic-config');
 */

import { useState, useEffect, useCallback } from 'react';
import { usePostHog } from '@/components/providers/PostHogProvider';

/**
 * Hook to access PostHog feature flags
 * 
 * @param {string} flagKey - The feature flag key defined in PostHog
 * @param {boolean|string} defaultValue - Default value while loading or if flag not found
 * @returns {{
 *   enabled: boolean,
 *   variant: string|boolean|null,
 *   payload: any,
 *   loading: boolean,
 *   error: Error|null
 * }}
 */
export function useFeatureFlag(flagKey, defaultValue = false) {
  const { posthog, isReady } = usePostHog();
  const [state, setState] = useState({
    enabled: typeof defaultValue === 'boolean' ? defaultValue : false,
    variant: typeof defaultValue === 'string' ? defaultValue : null,
    payload: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Wait for PostHog to be ready
    if (!isReady || !posthog) {
      return;
    }

    // Handle feature flags being loaded
    const handleFlagsLoaded = () => {
      try {
        // Get the flag value (could be boolean or string variant)
        const flagValue = posthog.getFeatureFlag(flagKey);
        
        // Get any payload attached to the flag
        const flagPayload = posthog.getFeatureFlagPayload(flagKey);
        
        // Determine if it's enabled (true for boolean flags, truthy for variants)
        const isEnabled = flagValue === true || (typeof flagValue === 'string' && flagValue !== 'control');
        
        setState({
          enabled: isEnabled,
          variant: flagValue,
          payload: flagPayload,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error(`[useFeatureFlag] Error getting flag "${flagKey}":`, error);
        setState(prev => ({
          ...prev,
          loading: false,
          error,
        }));
      }
    };

    // Check if flags are already loaded
    if (posthog.isFeatureEnabled !== undefined) {
      // Use onFeatureFlags for proper async handling
      posthog.onFeatureFlags(handleFlagsLoaded);
    }

    // Cleanup
    return () => {
      // PostHog doesn't have an unsubscribe for onFeatureFlags
      // The callback is only called once anyway
    };
  }, [posthog, isReady, flagKey]);

  return state;
}

/**
 * Hook to check multiple feature flags at once
 * 
 * @param {string[]} flagKeys - Array of feature flag keys
 * @returns {{
 *   flags: Record<string, boolean>,
 *   variants: Record<string, string|boolean|null>,
 *   loading: boolean
 * }}
 * 
 * @example
 * const { flags, variants, loading } = useFeatureFlags(['flag-a', 'flag-b']);
 * if (flags['flag-a']) { ... }
 */
export function useFeatureFlags(flagKeys) {
  const { posthog, isReady } = usePostHog();
  const [state, setState] = useState({
    flags: {},
    variants: {},
    loading: true,
  });

  useEffect(() => {
    if (!isReady || !posthog) {
      return;
    }

    const handleFlagsLoaded = () => {
      const flags = {};
      const variants = {};

      for (const key of flagKeys) {
        const value = posthog.getFeatureFlag(key);
        flags[key] = value === true || (typeof value === 'string' && value !== 'control');
        variants[key] = value;
      }

      setState({
        flags,
        variants,
        loading: false,
      });
    };

    posthog.onFeatureFlags(handleFlagsLoaded);
  }, [posthog, isReady, flagKeys.join(',')]);

  return state;
}

/**
 * Hook to reload feature flags (useful after user identification changes)
 * 
 * @returns {{ reloadFlags: () => Promise<void>, isReloading: boolean }}
 */
export function useReloadFeatureFlags() {
  const { posthog, isReady } = usePostHog();
  const [isReloading, setIsReloading] = useState(false);

  const reloadFlags = useCallback(async () => {
    if (!isReady || !posthog) {
      console.warn('[useReloadFeatureFlags] PostHog not ready');
      return;
    }

    setIsReloading(true);
    try {
      await posthog.reloadFeatureFlags();
    } finally {
      setIsReloading(false);
    }
  }, [posthog, isReady]);

  return { reloadFlags, isReloading };
}

export default useFeatureFlag;
