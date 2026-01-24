'use client';

/**
 * A/B Test Component
 * 
 * Declarative component for rendering different variants based on PostHog feature flags.
 * Supports boolean flags (control vs variant) and multivariate experiments.
 * 
 * @module components/ABTest
 * 
 * @example
 * // Simple boolean A/B test
 * <ABTest experimentKey="new-checkout-flow">
 *   {(variant) => variant ? <NewCheckout /> : <OldCheckout />}
 * </ABTest>
 * 
 * @example
 * // Multivariate test with explicit variants
 * <ABTest 
 *   experimentKey="pricing-page"
 *   variants={{
 *     control: <PricingPageA />,
 *     'variant-a': <PricingPageB />,
 *     'variant-b': <PricingPageC />,
 *   }}
 *   fallback={<PricingPageA />}
 * />
 */

import { useEffect, useRef } from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { trackEvent, EVENTS } from '@/lib/analytics/events';

/**
 * A/B Test wrapper component
 * 
 * @param {Object} props
 * @param {string} props.experimentKey - PostHog feature flag key
 * @param {Record<string, React.ReactNode>} [props.variants] - Map of variant keys to components
 * @param {React.ReactNode} [props.fallback] - Fallback while loading or if no variant matched
 * @param {function(boolean|string): React.ReactNode} [props.children] - Render function receiving variant
 * @param {boolean} [props.trackExposure=true] - Whether to track experiment exposure
 * @param {string} [props.loadingComponent] - Component to show while loading flags
 */
export function ABTest({ 
  experimentKey, 
  variants = {}, 
  fallback = null, 
  children,
  trackExposure = true,
  loadingComponent = null,
}) {
  const { variant, enabled, loading, payload } = useFeatureFlag(experimentKey);
  const hasTrackedRef = useRef(false);

  // Track experiment exposure once
  useEffect(() => {
    if (loading || hasTrackedRef.current || !trackExposure) {
      return;
    }

    // Track that user was exposed to this experiment
    trackEvent(EVENTS.EXPERIMENT_VIEWED || 'Experiment Viewed', {
      experiment_key: experimentKey,
      variant: variant ?? 'control',
      enabled,
    });
    
    hasTrackedRef.current = true;
  }, [loading, experimentKey, variant, enabled, trackExposure]);

  // Show loading state
  if (loading) {
    return loadingComponent || fallback;
  }

  // If children is a render function, use that
  if (typeof children === 'function') {
    return children(variant, { enabled, payload });
  }

  // Use variants map for multivariate tests
  if (variants && Object.keys(variants).length > 0) {
    // Try to find the matching variant
    const variantKey = typeof variant === 'string' ? variant : (enabled ? 'treatment' : 'control');
    
    if (variants[variantKey]) {
      return variants[variantKey];
    }

    // Fallback to 'control' if specified
    if (variants.control) {
      return variants.control;
    }
  }

  return fallback;
}

/**
 * Helper to track experiment conversion
 * Call this when the user completes the goal action
 * 
 * @param {string} experimentKey - The experiment key
 * @param {string} [variant] - The variant the user was in (optional, for logging)
 * @param {Object} [properties] - Additional properties to track
 * 
 * @example
 * // In a checkout success handler
 * trackExperimentConversion('new-checkout-flow', variant, { value: 99.99 });
 */
export function trackExperimentConversion(experimentKey, variant, properties = {}) {
  trackEvent(EVENTS.EXPERIMENT_CONVERTED || 'Experiment Converted', {
    experiment_key: experimentKey,
    variant: variant ?? 'unknown',
    ...properties,
  });
}

/**
 * Feature Flag Wrapper Component
 * 
 * Simple wrapper that shows content only if a feature flag is enabled.
 * 
 * @param {Object} props
 * @param {string} props.flag - Feature flag key
 * @param {React.ReactNode} props.children - Content to show if flag is enabled
 * @param {React.ReactNode} [props.fallback] - Content to show if flag is disabled
 * 
 * @example
 * <FeatureFlag flag="new-feature">
 *   <NewFeatureComponent />
 * </FeatureFlag>
 */
export function FeatureFlag({ flag, children, fallback = null }) {
  const { enabled, loading } = useFeatureFlag(flag);

  if (loading) {
    return fallback;
  }

  return enabled ? children : fallback;
}

export default ABTest;
