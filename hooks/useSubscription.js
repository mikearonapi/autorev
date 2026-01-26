/**
 * useSubscription Hook
 * 
 * Provides client-side subscription state management with:
 * - Current tier and status
 * - Tier access checking helpers
 * - Stripe Customer Portal link generation
 * - Trial status awareness
 * - Subscription history (via API)
 * 
 * Data Source: Currently reads from user_profiles via AuthProvider.
 * The Stripe webhook dual-writes to both user_profiles (legacy) and the 
 * new normalized subscriptions table. For server-side operations, use
 * lib/subscriptionService.js to query the new normalized tables directly.
 * 
 * @module hooks/useSubscription
 * 
 * @example
 * const { tier, isPaid, isFree, hasFeature, openCustomerPortal } = useSubscription();
 * 
 * if (!hasFeature('unlimited_al')) {
 *   return <UpgradePrompt />;
 * }
 */

import { useMemo, useCallback, useState } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';

// =============================================================================
// TIER DEFINITIONS
// =============================================================================

/**
 * Subscription tier hierarchy (higher = more features)
 */
export const TIERS = {
  free: 0,
  collector: 1,
  tuner: 2,
  admin: 99, // Admin tier has all access
};

/**
 * Tier display names
 */
export const TIER_NAMES = {
  free: 'Free',
  collector: 'Enthusiast', // Marketing name
  tuner: 'Tuner',
  admin: 'Admin',
};

/**
 * Feature access by minimum tier
 * Features listed here require at least the specified tier
 */
export const FEATURE_TIERS = {
  // Free features (available to all)
  browse_cars: 'free',
  view_specs: 'free',
  al_basic: 'free', // Limited AL queries
  
  // Collector tier features
  unlimited_favorites: 'collector',
  garage_vehicles: 'collector',
  event_calendar: 'collector',
  maintenance_tracking: 'collector',
  
  // Tuner tier features
  unlimited_al: 'tuner',
  build_planning: 'tuner',
  parts_shopping: 'tuner',
  performance_calculator: 'tuner',
  dyno_charts: 'tuner',
  community_posts: 'tuner',
  
  // Admin features
  admin_dashboard: 'admin',
  user_management: 'admin',
};

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * useSubscription Hook
 * 
 * @returns {Object} Subscription state and helpers
 */
export function useSubscription() {
  const { profile, isAuthenticated, isLoading } = useAuth();
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  
  // Extract subscription data from profile
  const subscriptionData = useMemo(() => {
    if (!profile) {
      return {
        tier: 'free',
        status: null,
        subscriptionId: null,
        customerId: null,
        startedAt: null,
        endsAt: null,
        isTrialing: false,
        trialEndsAt: null,
        cancelAtPeriodEnd: false,
      };
    }
    
    const tier = profile.subscription_tier || 'free';
    const status = profile.stripe_subscription_status || null;
    const isTrialing = status === 'trialing';
    
    return {
      tier,
      status,
      subscriptionId: profile.stripe_subscription_id || null,
      customerId: profile.stripe_customer_id || null,
      startedAt: profile.subscription_started_at || null,
      endsAt: profile.subscription_ends_at || null,
      isTrialing,
      trialEndsAt: isTrialing ? profile.subscription_ends_at : null,
      cancelAtPeriodEnd: profile.cancel_at_period_end || false,
    };
  }, [profile]);
  
  // Tier level (numeric for comparisons)
  const tierLevel = TIERS[subscriptionData.tier] ?? TIERS.free;
  
  // Convenience booleans
  const isFree = tierLevel === TIERS.free;
  const isCollector = tierLevel >= TIERS.collector;
  const isTuner = tierLevel >= TIERS.tuner;
  const isAdmin = tierLevel === TIERS.admin;
  const isPaid = tierLevel > TIERS.free;
  
  // Status booleans
  const isActive = subscriptionData.status === 'active' || subscriptionData.status === 'trialing';
  const isCanceled = subscriptionData.status === 'canceled';
  const isPastDue = subscriptionData.status === 'past_due';
  
  // Cancellation tracking - true if subscription will cancel at end of current period
  const willCancel = isActive && subscriptionData.cancelAtPeriodEnd;
  
  // Trial calculations
  const trialDaysRemaining = useMemo(() => {
    if (!subscriptionData.isTrialing || !subscriptionData.trialEndsAt) {
      return null;
    }
    const endsAt = new Date(subscriptionData.trialEndsAt);
    const now = new Date();
    const diffMs = endsAt - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [subscriptionData.isTrialing, subscriptionData.trialEndsAt]);
  
  /**
   * Check if user has access to a specific feature
   * @param {string} feature - Feature key from FEATURE_TIERS
   * @returns {boolean}
   */
  const hasFeature = useCallback((feature) => {
    const requiredTier = FEATURE_TIERS[feature];
    if (!requiredTier) {
      console.warn(`[useSubscription] Unknown feature: ${feature}`);
      return true; // Unknown features default to accessible
    }
    const requiredLevel = TIERS[requiredTier] ?? 0;
    return tierLevel >= requiredLevel;
  }, [tierLevel]);
  
  /**
   * Check if user can access a specific tier level
   * @param {string} requiredTier - Tier name to check against
   * @returns {boolean}
   */
  const hasTier = useCallback((requiredTier) => {
    const requiredLevel = TIERS[requiredTier] ?? 0;
    return tierLevel >= requiredLevel;
  }, [tierLevel]);
  
  /**
   * Open Stripe Customer Portal for subscription management
   * @param {string} [returnUrl] - URL to return to after portal session
   */
  const openCustomerPortal = useCallback(async (returnUrl) => {
    if (!subscriptionData.customerId) {
      console.warn('[useSubscription] No Stripe customer ID found');
      return;
    }
    
    setIsPortalLoading(true);
    
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: returnUrl || window.location.href,
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('[useSubscription] No portal URL returned:', data);
      }
    } catch (error) {
      console.error('[useSubscription] Error opening customer portal:', error);
    } finally {
      setIsPortalLoading(false);
    }
  }, [subscriptionData.customerId]);
  
  /**
   * Get upgrade URL for a specific tier
   * @param {string} targetTier - Target tier to upgrade to
   * @returns {string}
   */
  const getUpgradeUrl = useCallback((targetTier = 'tuner') => {
    // Direct to pricing page with tier preselected
    return `/pricing?tier=${targetTier}`;
  }, []);

  /**
   * Get join/checkout URL with tier preselected
   * @param {string} targetTier - Target tier
   * @param {string} [interval] - 'month' or 'year'
   * @returns {string}
   */
  const getJoinUrl = useCallback((targetTier = 'tuner', interval = 'month') => {
    return `/join?tier=${targetTier}&interval=${interval}`;
  }, []);

  /**
   * Calculate days until subscription renews or expires
   * @returns {number|null}
   */
  const daysUntilRenewal = useMemo(() => {
    if (!subscriptionData.endsAt) return null;
    const endsAt = new Date(subscriptionData.endsAt);
    const now = new Date();
    const diffMs = endsAt - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [subscriptionData.endsAt]);
  
  return {
    // Core subscription data
    tier: subscriptionData.tier,
    tierName: TIER_NAMES[subscriptionData.tier] || 'Free',
    tierLevel,
    status: subscriptionData.status,
    customerId: subscriptionData.customerId,
    subscriptionId: subscriptionData.subscriptionId,
    
    // Tier booleans (at least this tier)
    isFree,
    isCollector, // Collector or higher
    isTuner,     // Tuner or higher
    isAdmin,
    isPaid,      // Any paid tier
    
    // Status booleans
    isActive,
    isTrialing: subscriptionData.isTrialing,
    isCanceled,
    isPastDue,
    
    // Cancellation status
    cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
    willCancel,  // True if active/trialing AND set to cancel at period end
    
    // Trial info
    trialDaysRemaining,
    trialEndsAt: subscriptionData.trialEndsAt,
    
    // Dates
    startedAt: subscriptionData.startedAt,
    endsAt: subscriptionData.endsAt,
    
    // Loading states
    isLoading,
    isPortalLoading,
    isAuthenticated,
    
    // Helper functions
    hasFeature,
    hasTier,
    openCustomerPortal,
    getUpgradeUrl,
    getJoinUrl,
    
    // Calculated values
    daysUntilRenewal,
    
    // Constants for reference
    TIERS,
    TIER_NAMES,
    FEATURE_TIERS,
  };
}

export default useSubscription;
