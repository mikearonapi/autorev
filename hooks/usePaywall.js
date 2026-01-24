'use client';

/**
 * usePaywall Hook
 * 
 * Manages paywall state and provides functions for:
 * - Showing/hiding the paywall modal
 * - Tracking paywall placements
 * - Checking if a feature should trigger the paywall
 * 
 * @module hooks/usePaywall
 */

import { useState, useCallback, useMemo } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { trackActivity } from '@/lib/activityTracker';

/**
 * Paywall state and helpers hook
 * 
 * @example
 * const { showPaywall, isOpen, closePaywall, shouldGate } = usePaywall();
 * 
 * if (shouldGate('dynoDatabase')) {
 *   showPaywall({ feature: 'Dyno Database', placement: 'feature_page' });
 *   return null;
 * }
 */
export function usePaywall() {
  const { tier, tierLevel, hasFeature, TIERS } = useSubscription();
  
  const [isOpen, setIsOpen] = useState(false);
  const [paywallConfig, setPaywallConfig] = useState({
    placement: 'default',
    feature: null,
    preselectedTier: 'collector',
    showAnnualFirst: true,
  });

  /**
   * Show the paywall modal
   * @param {Object} config - Paywall configuration
   * @param {string} [config.placement] - Where the paywall was triggered
   * @param {string} [config.feature] - Feature that triggered it
   * @param {'collector'|'tuner'} [config.preselectedTier] - Default tier
   * @param {boolean} [config.showAnnualFirst] - Show annual pricing first
   */
  const showPaywall = useCallback((config = {}) => {
    const fullConfig = {
      placement: config.placement || 'default',
      feature: config.feature || null,
      preselectedTier: config.preselectedTier || 'collector',
      showAnnualFirst: config.showAnnualFirst !== false,
    };
    
    setPaywallConfig(fullConfig);
    setIsOpen(true);

    // Track paywall impression
    try {
      trackActivity('paywall_shown', {
        placement: fullConfig.placement,
        feature: fullConfig.feature,
        user_tier: tier,
      });
    } catch (e) {
      console.error('[usePaywall] Tracking error:', e);
    }
  }, [tier]);

  /**
   * Close the paywall modal
   */
  const closePaywall = useCallback(() => {
    setIsOpen(false);
    
    // Track paywall close
    try {
      trackActivity('paywall_dismissed', {
        placement: paywallConfig.placement,
        feature: paywallConfig.feature,
      });
    } catch (e) {
      console.error('[usePaywall] Tracking error:', e);
    }
  }, [paywallConfig]);

  /**
   * Check if a feature should trigger the paywall
   * Returns true if user doesn't have access
   * @param {string} featureKey - Feature to check
   * @returns {boolean}
   */
  const shouldGate = useCallback((featureKey) => {
    return !hasFeature(featureKey);
  }, [hasFeature]);

  /**
   * Show paywall if user doesn't have feature access
   * Returns true if paywall was shown
   * @param {string} featureKey - Feature key to check
   * @param {Object} [config] - Paywall config
   * @returns {boolean} - True if paywall shown
   */
  const gateFeature = useCallback((featureKey, config = {}) => {
    if (shouldGate(featureKey)) {
      showPaywall({
        feature: config.featureName || featureKey,
        placement: config.placement || 'feature_gate',
        ...config,
      });
      return true;
    }
    return false;
  }, [shouldGate, showPaywall]);

  /**
   * Get recommended tier for user to upgrade to
   * Based on current tier, returns next tier
   */
  const recommendedTier = useMemo(() => {
    if (tierLevel < TIERS.collector) {
      return 'collector';
    }
    if (tierLevel < TIERS.tuner) {
      return 'tuner';
    }
    return null; // Already at max tier
  }, [tierLevel, TIERS]);

  return {
    // Modal state
    isOpen,
    paywallConfig,
    
    // Actions
    showPaywall,
    closePaywall,
    
    // Helpers
    shouldGate,
    gateFeature,
    recommendedTier,
    
    // Re-export useful subscription data
    currentTier: tier,
    hasFeature,
  };
}

export default usePaywall;
