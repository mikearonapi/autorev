/**
 * Feature Flags & A/B Testing Framework
 * 
 * Provides feature flag management for controlled rollouts and A/B testing.
 * Integrates with PostHog for remote flag management, with local fallbacks.
 * 
 * Features:
 * - Local flag definitions with default values
 * - PostHog integration for remote flag control
 * - User segment targeting
 * - A/B test variant tracking
 * - SSR-safe implementation
 * 
 * Usage:
 *   import { useFeatureFlag, getFeatureFlag, FLAGS } from '@/lib/featureFlags';
 *   
 *   // In components (client-side)
 *   const showNewPricing = useFeatureFlag('new_pricing_page');
 *   
 *   // In server components/API routes
 *   const variant = await getFeatureFlag('pricing_experiment', { userId: 'xxx' });
 * 
 * @module lib/featureFlags
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import posthog from 'posthog-js';

// =============================================================================
// FLAG DEFINITIONS
// =============================================================================

/**
 * Feature flag definitions with metadata
 * 
 * @typedef {Object} FlagDefinition
 * @property {string} key - Unique flag identifier
 * @property {string} description - What this flag controls
 * @property {boolean|string} defaultValue - Default value if not set remotely
 * @property {'boolean'|'multivariate'} type - Flag type
 * @property {string[]} [variants] - Possible variants for multivariate flags
 * @property {string} [experiment] - Associated experiment name
 */

export const FLAGS = {
  // Pricing experiments
  NEW_PRICING_PAGE: {
    key: 'new_pricing_page',
    description: 'Show redesigned pricing page',
    defaultValue: false,
    type: 'boolean',
  },
  PRICING_VARIANT: {
    key: 'pricing_variant',
    description: 'A/B test for pricing page variants',
    defaultValue: 'control',
    type: 'multivariate',
    variants: ['control', 'variant_a', 'variant_b'],
    experiment: 'pricing_page_test',
  },
  
  // Paywall experiments
  PAYWALL_STYLE: {
    key: 'paywall_style',
    description: 'Paywall presentation style',
    defaultValue: 'modal',
    type: 'multivariate',
    variants: ['modal', 'inline', 'banner'],
    experiment: 'paywall_style_test',
  },
  SHOW_ANNUAL_TOGGLE: {
    key: 'show_annual_toggle',
    description: 'Show monthly/annual pricing toggle',
    defaultValue: true,
    type: 'boolean',
  },
  
  // Upgrade prompt experiments
  UPGRADE_CTA_TEXT: {
    key: 'upgrade_cta_text',
    description: 'CTA text on upgrade prompts',
    defaultValue: 'Upgrade Now',
    type: 'multivariate',
    variants: ['Upgrade Now', 'Get Full Access', 'Unlock Features', 'Go Pro'],
    experiment: 'upgrade_cta_test',
  },
  
  // Feature rollouts
  ENABLE_DARK_MODE: {
    key: 'enable_dark_mode',
    description: 'Enable dark mode toggle for users',
    defaultValue: false,
    type: 'boolean',
  },
  ENABLE_AI_RERANK: {
    key: 'enable_ai_rerank',
    description: 'Enable Cohere reranking for AL queries',
    defaultValue: true,
    type: 'boolean',
  },
  
  // Trial experiments
  TRIAL_LENGTH: {
    key: 'trial_length_days',
    description: 'Number of days for free trial',
    defaultValue: '7',
    type: 'multivariate',
    variants: ['7', '14', '30'],
    experiment: 'trial_length_test',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get a unique identifier for the current user/session
 * @returns {string}
 */
function getDistinctId() {
  if (typeof window === 'undefined') return 'server';
  
  // Try PostHog distinct ID first
  if (posthog?.get_distinct_id) {
    return posthog.get_distinct_id();
  }
  
  // Fallback to localStorage
  let id = localStorage.getItem('feature_flag_distinct_id');
  if (!id) {
    id = `anon_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('feature_flag_distinct_id', id);
  }
  return id;
}

/**
 * Hash a string to a number between 0-100 for consistent bucketing
 * @param {string} str
 * @returns {number}
 */
function hashToBucket(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 100);
}

/**
 * Get variant based on consistent hashing
 * @param {string} flagKey
 * @param {string[]} variants
 * @param {string} distinctId
 * @returns {string}
 */
function getVariantFromHash(flagKey, variants, distinctId) {
  const bucket = hashToBucket(`${flagKey}_${distinctId}`);
  const variantIndex = Math.floor((bucket / 100) * variants.length);
  return variants[Math.min(variantIndex, variants.length - 1)];
}

// =============================================================================
// MAIN API
// =============================================================================

/**
 * Get feature flag value (async, for server-side)
 * 
 * @param {string} flagKey - Flag key from FLAGS
 * @param {Object} [context] - Additional context
 * @param {string} [context.userId] - User ID for targeting
 * @param {Object} [context.properties] - User properties for targeting
 * @returns {Promise<boolean|string>}
 */
export async function getFeatureFlag(flagKey, context = {}) {
  const flagDef = Object.values(FLAGS).find(f => f.key === flagKey);
  if (!flagDef) {
    console.warn(`[FeatureFlags] Unknown flag: ${flagKey}`);
    return false;
  }
  
  const distinctId = context.userId || getDistinctId();
  
  // Try PostHog first (if on client and initialized)
  if (typeof window !== 'undefined' && posthog?.isFeatureEnabled) {
    const postHogValue = posthog.getFeatureFlag(flagKey);
    if (postHogValue !== undefined) {
      return postHogValue;
    }
  }
  
  // Fall back to local evaluation
  if (flagDef.type === 'multivariate' && flagDef.variants) {
    return getVariantFromHash(flagKey, flagDef.variants, distinctId);
  }
  
  return flagDef.defaultValue;
}

/**
 * React hook for feature flags (client-side)
 * 
 * @param {string} flagKey - Flag key from FLAGS
 * @returns {boolean|string|null} Flag value (null while loading)
 */
export function useFeatureFlag(flagKey) {
  const [value, setValue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const flagDef = Object.values(FLAGS).find(f => f.key === flagKey);
    
    if (!flagDef) {
      console.warn(`[FeatureFlags] Unknown flag: ${flagKey}`);
      setValue(false);
      setIsLoading(false);
      return;
    }
    
    // Check PostHog first
    if (posthog?.isFeatureEnabled) {
      const postHogValue = posthog.getFeatureFlag(flagKey);
      if (postHogValue !== undefined) {
        setValue(postHogValue);
        setIsLoading(false);
        return;
      }
    }
    
    // Fall back to local evaluation
    const distinctId = getDistinctId();
    
    if (flagDef.type === 'multivariate' && flagDef.variants) {
      setValue(getVariantFromHash(flagKey, flagDef.variants, distinctId));
    } else {
      setValue(flagDef.defaultValue);
    }
    
    setIsLoading(false);
    
    // Listen for PostHog flag updates
    const handleFlagsLoaded = () => {
      const newValue = posthog.getFeatureFlag(flagKey);
      if (newValue !== undefined) {
        setValue(newValue);
      }
    };
    
    if (posthog?.onFeatureFlags) {
      posthog.onFeatureFlags(handleFlagsLoaded);
    }
    
  }, [flagKey]);
  
  return isLoading ? null : value;
}

/**
 * Track when a user is exposed to an experiment variant
 * 
 * @param {string} experimentName - Experiment identifier
 * @param {string} variant - Variant the user saw
 * @param {Object} [properties] - Additional properties
 */
export function trackExperimentExposure(experimentName, variant, properties = {}) {
  if (typeof window === 'undefined') return;
  
  // Track in PostHog
  if (posthog?.capture) {
    posthog.capture('$experiment_started', {
      $experiment_name: experimentName,
      $experiment_variant: variant,
      ...properties,
    });
  }
  
  // Track in console for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Experiment] ${experimentName}: ${variant}`, properties);
  }
}

/**
 * Track experiment conversion
 * 
 * @param {string} experimentName - Experiment identifier
 * @param {string} conversionEvent - What converted
 * @param {Object} [properties] - Additional properties
 */
export function trackExperimentConversion(experimentName, conversionEvent, properties = {}) {
  if (typeof window === 'undefined') return;
  
  if (posthog?.capture) {
    posthog.capture('$experiment_converted', {
      $experiment_name: experimentName,
      $experiment_conversion: conversionEvent,
      ...properties,
    });
  }
}

// =============================================================================
// HIGHER-ORDER COMPONENTS
// =============================================================================

/**
 * Conditional rendering based on feature flag
 * 
 * @example
 * <FeatureFlag flag="new_pricing_page" fallback={<OldPricing />}>
 *   <NewPricing />
 * </FeatureFlag>
 */
export function FeatureFlag({ flag, children, fallback = null }) {
  const value = useFeatureFlag(flag);
  
  // Still loading
  if (value === null) {
    return fallback;
  }
  
  return value ? children : fallback;
}

/**
 * A/B test variant renderer
 * 
 * @example
 * <ABTest experiment="pricing_variant">
 *   <ABTest.Variant name="control"><ControlPricing /></ABTest.Variant>
 *   <ABTest.Variant name="variant_a"><NewPricing /></ABTest.Variant>
 * </ABTest>
 */
export function ABTest({ experiment, children }) {
  const flagDef = Object.values(FLAGS).find(f => f.experiment === experiment);
  const variant = useFeatureFlag(flagDef?.key);
  
  useEffect(() => {
    if (variant && flagDef) {
      trackExperimentExposure(experiment, variant);
    }
  }, [variant, experiment, flagDef]);
  
  // Find matching variant child
  const variants = Array.isArray(children) ? children : [children];
  const matchingVariant = variants.find(
    child => child?.props?.name === variant
  );
  
  return matchingVariant || variants[0] || null;
}

ABTest.Variant = function Variant({ children }) {
  return children;
};

export default {
  FLAGS,
  getFeatureFlag,
  useFeatureFlag,
  trackExperimentExposure,
  trackExperimentConversion,
  FeatureFlag,
  ABTest,
};
