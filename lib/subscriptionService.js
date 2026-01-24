/**
 * Subscription Service
 * 
 * Centralized data access layer for subscription-related operations.
 * Provides functions to:
 * - Query subscription status from the new normalized schema
 * - Check feature entitlements
 * - Get subscription history
 * - Calculate subscription metrics
 * 
 * Uses the new normalized tables (subscriptions, customers, plans, etc.)
 * with fallback to user_profiles for backward compatibility.
 * 
 * @module lib/subscriptionService
 */

import { createClient } from '@supabase/supabase-js';

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

/**
 * Create a Supabase client for server-side operations
 * Uses service role for full access to subscription data
 */
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

// =============================================================================
// SUBSCRIPTION QUERIES
// =============================================================================

/**
 * Get user's active subscription from the new subscriptions table
 * Falls back to user_profiles if no record in new table
 * 
 * @param {string} userId - Supabase user ID
 * @param {Object} [supabase] - Optional Supabase client (defaults to admin)
 * @returns {Promise<Object|null>} Subscription data or null
 */
export async function getUserSubscription(userId, supabase = null) {
  const db = supabase || getSupabaseAdmin();
  
  // Try new subscriptions table first
  const { data: subscription, error } = await db
    .from('subscriptions')
    .select(`
      id,
      user_id,
      status,
      price_id,
      quantity,
      cancel_at_period_end,
      cancel_at,
      canceled_at,
      current_period_start,
      current_period_end,
      trial_start,
      trial_end,
      ended_at,
      metadata,
      created_at,
      updated_at,
      prices (
        id,
        product_id,
        unit_amount,
        currency,
        interval,
        interval_count,
        products (
          id,
          name,
          description
        )
      )
    `)
    .eq('user_id', userId)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('[SubscriptionService] Error fetching subscription:', error);
  }

  if (subscription) {
    // Get plan ID from the product
    const productId = subscription.prices?.product_id;
    let planId = 'free';
    
    if (productId) {
      const { data: plan } = await db
        .from('plans')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();
      
      if (plan) {
        planId = plan.id;
      }
    }

    return {
      ...subscription,
      plan_id: planId,
      // Derived status flags
      isActive: subscription.status === 'active',
      isTrialing: subscription.status === 'trialing',
      isPastDue: subscription.status === 'past_due',
      willCancel: subscription.cancel_at_period_end,
    };
  }

  // Fallback: Check user_profiles for legacy data
  const { data: profile } = await db
    .from('user_profiles')
    .select(`
      subscription_tier,
      stripe_subscription_id,
      stripe_subscription_status,
      subscription_started_at,
      subscription_ends_at,
      cancel_at_period_end
    `)
    .eq('id', userId)
    .maybeSingle();

  if (profile && profile.stripe_subscription_id) {
    return {
      id: profile.stripe_subscription_id,
      user_id: userId,
      status: profile.stripe_subscription_status,
      plan_id: profile.subscription_tier || 'free',
      current_period_start: profile.subscription_started_at,
      current_period_end: profile.subscription_ends_at,
      cancel_at_period_end: profile.cancel_at_period_end || false,
      // Derived status flags
      isActive: profile.stripe_subscription_status === 'active',
      isTrialing: profile.stripe_subscription_status === 'trialing',
      isPastDue: profile.stripe_subscription_status === 'past_due',
      willCancel: profile.cancel_at_period_end || false,
      // Mark as legacy data
      _source: 'user_profiles',
    };
  }

  return null;
}

/**
 * Get user's current plan ID
 * 
 * @param {string} userId - Supabase user ID
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<string>} Plan ID ('free', 'collector', 'tuner')
 */
export async function getUserPlanId(userId, supabase = null) {
  const subscription = await getUserSubscription(userId, supabase);
  
  if (subscription && ['active', 'trialing'].includes(subscription.status)) {
    return subscription.plan_id || 'free';
  }
  
  return 'free';
}

/**
 * Get user's subscription history (all subscriptions, including canceled)
 * 
 * @param {string} userId - Supabase user ID
 * @param {Object} [options] - Query options
 * @param {number} [options.limit] - Max records to return (default: 10)
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<Array>} Array of subscription records
 */
export async function getSubscriptionHistory(userId, options = {}, supabase = null) {
  const db = supabase || getSupabaseAdmin();
  const { limit = 10 } = options;

  const { data, error } = await db
    .from('subscriptions')
    .select(`
      id,
      status,
      price_id,
      current_period_start,
      current_period_end,
      trial_start,
      trial_end,
      canceled_at,
      ended_at,
      created_at,
      prices (
        unit_amount,
        currency,
        interval,
        products (
          name
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[SubscriptionService] Error fetching history:', error);
    return [];
  }

  return data || [];
}

// =============================================================================
// ENTITLEMENT CHECKS
// =============================================================================

/**
 * Check if user has access to a specific feature
 * 
 * @param {string} userId - Supabase user ID
 * @param {string} featureId - Feature key (e.g., 'vinDecode', 'dynoDatabase')
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<Object>} { hasAccess: boolean, limitValue: number|null, planId: string }
 */
export async function checkFeatureAccess(userId, featureId, supabase = null) {
  const db = supabase || getSupabaseAdmin();

  // Get user's current plan
  const planId = await getUserPlanId(userId, db);

  // Check entitlement
  const { data: entitlement, error } = await db
    .from('plan_entitlements')
    .select('value, limit_value')
    .eq('plan_id', planId)
    .eq('feature_id', featureId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('[SubscriptionService] Error checking entitlement:', error);
  }

  if (entitlement) {
    // Parse value as boolean (stored as JSONB 'true' or 'false')
    const hasAccess = entitlement.value === true || entitlement.value === 'true';
    return {
      hasAccess,
      limitValue: entitlement.limit_value,
      planId,
    };
  }

  // No entitlement found - no access
  return {
    hasAccess: false,
    limitValue: null,
    planId,
  };
}

/**
 * Get all entitlements for a user's current plan
 * 
 * @param {string} userId - Supabase user ID
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<Object>} Map of featureId -> { hasAccess, limitValue }
 */
export async function getUserEntitlements(userId, supabase = null) {
  const db = supabase || getSupabaseAdmin();

  // Get user's current plan
  const planId = await getUserPlanId(userId, db);

  // Get all entitlements for this plan
  const { data: entitlements, error } = await db
    .from('plan_entitlements')
    .select('feature_id, value, limit_value')
    .eq('plan_id', planId);

  if (error) {
    console.error('[SubscriptionService] Error fetching entitlements:', error);
    return {};
  }

  // Convert to map
  const result = {};
  for (const ent of entitlements || []) {
    result[ent.feature_id] = {
      hasAccess: ent.value === true || ent.value === 'true',
      limitValue: ent.limit_value,
    };
  }

  return result;
}

// =============================================================================
// PLAN & PRICING QUERIES
// =============================================================================

/**
 * Get all available plans with their pricing
 * 
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<Array>} Array of plans with prices
 */
export async function getAvailablePlans(supabase = null) {
  const db = supabase || getSupabaseAdmin();

  const { data: plans, error } = await db
    .from('plans')
    .select(`
      id,
      name,
      description,
      display_order,
      is_default,
      product_id,
      products (
        id,
        name,
        active,
        prices (
          id,
          unit_amount,
          currency,
          interval,
          interval_count,
          trial_period_days,
          active
        )
      )
    `)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('[SubscriptionService] Error fetching plans:', error);
    return [];
  }

  return plans || [];
}

/**
 * Get features for a specific plan
 * 
 * @param {string} planId - Plan ID ('free', 'collector', 'tuner')
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<Array>} Array of features with access info
 */
export async function getPlanFeatures(planId, supabase = null) {
  const db = supabase || getSupabaseAdmin();

  const { data, error } = await db
    .from('plan_entitlements')
    .select(`
      feature_id,
      value,
      limit_value,
      features (
        id,
        name,
        description,
        feature_type
      )
    `)
    .eq('plan_id', planId);

  if (error) {
    console.error('[SubscriptionService] Error fetching plan features:', error);
    return [];
  }

  return (data || []).map(ent => ({
    id: ent.feature_id,
    name: ent.features?.name,
    description: ent.features?.description,
    featureType: ent.features?.feature_type,
    hasAccess: ent.value === true || ent.value === 'true',
    limitValue: ent.limit_value,
  }));
}

// =============================================================================
// CUSTOMER QUERIES
// =============================================================================

/**
 * Get user's Stripe customer ID
 * 
 * @param {string} userId - Supabase user ID
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<string|null>} Stripe customer ID or null
 */
export async function getStripeCustomerId(userId, supabase = null) {
  const db = supabase || getSupabaseAdmin();

  // Try new customers table first
  const { data: customer } = await db
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle();

  if (customer?.stripe_customer_id) {
    return customer.stripe_customer_id;
  }

  // Fallback to user_profiles
  const { data: profile } = await db
    .from('user_profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle();

  return profile?.stripe_customer_id || null;
}

/**
 * Get user ID by Stripe customer ID
 * 
 * @param {string} stripeCustomerId - Stripe customer ID
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<string|null>} User ID or null
 */
export async function getUserIdByStripeCustomer(stripeCustomerId, supabase = null) {
  const db = supabase || getSupabaseAdmin();

  // Try new customers table first
  const { data: customer } = await db
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();

  if (customer?.id) {
    return customer.id;
  }

  // Fallback to user_profiles
  const { data: profile } = await db
    .from('user_profiles')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();

  return profile?.id || null;
}

// =============================================================================
// TRIAL QUERIES
// =============================================================================

/**
 * Get user's trial history
 * 
 * @param {string} userId - Supabase user ID
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<Array>} Array of trial history records
 */
export async function getTrialHistory(userId, supabase = null) {
  const db = supabase || getSupabaseAdmin();

  const { data, error } = await db
    .from('trial_history')
    .select(`
      id,
      product_id,
      device_fingerprint,
      email_domain,
      trial_started_at,
      trial_ended_at,
      converted_to_paid,
      subscription_id,
      created_at
    `)
    .eq('user_id', userId)
    .order('trial_started_at', { ascending: false });

  if (error) {
    console.error('[SubscriptionService] Error fetching trial history:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if user has already had a trial for a product
 * 
 * @param {string} userId - Supabase user ID
 * @param {string} productId - Stripe product ID
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<boolean>} True if user has had a trial
 */
export async function hasHadTrial(userId, productId, supabase = null) {
  const db = supabase || getSupabaseAdmin();

  const { data } = await db
    .from('trial_history')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  return !!data;
}

// =============================================================================
// EXPORT
// =============================================================================

const subscriptionService = {
  // Subscription queries
  getUserSubscription,
  getUserPlanId,
  getSubscriptionHistory,
  
  // Entitlement checks
  checkFeatureAccess,
  getUserEntitlements,
  
  // Plan & pricing
  getAvailablePlans,
  getPlanFeatures,
  
  // Customer queries
  getStripeCustomerId,
  getUserIdByStripeCustomer,
  
  // Trial queries
  getTrialHistory,
  hasHadTrial,
};

export default subscriptionService;
