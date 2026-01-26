/**
 * Subscription Metrics Service
 * 
 * Calculates and provides subscription business metrics:
 * - MRR (Monthly Recurring Revenue)
 * - ARR (Annual Recurring Revenue)
 * - Churn Rate
 * - Trial-to-Paid Conversion Rate
 * - LTV (Lifetime Value)
 * - CAC (Customer Acquisition Cost) - requires manual input
 * 
 * @module lib/subscriptionMetrics
 */

import { createClient } from '@supabase/supabase-js';
import { SUBSCRIPTION_TIERS } from './stripe';

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

// =============================================================================
// PRICE LOOKUPS
// =============================================================================

/**
 * Get monthly price for a tier (in cents)
 * For annual subscriptions, calculate monthly equivalent
 */
function getMonthlyPriceForTier(tier, interval = 'month') {
  const config = SUBSCRIPTION_TIERS[tier];
  if (!config) return 0;
  
  if (interval === 'year' && config.annual) {
    return config.annual.monthlyEquivalent || Math.round(config.annual.price / 12);
  }
  
  return config.monthly?.price || config.price || 0;
}

// =============================================================================
// METRIC CALCULATIONS
// =============================================================================

/**
 * Calculate MRR (Monthly Recurring Revenue)
 * 
 * Formula: Sum of monthly subscription prices
 * - Monthly subscriptions: price as-is
 * - Annual subscriptions: price / 12
 * 
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<Object>} { mrr_cents, breakdown }
 */
export async function calculateMRR(supabase = null) {
  const db = supabase || getSupabaseAdmin();
  
  // Query all active subscriptions with their price info
  const { data: subscriptions, error } = await db
    .from('subscriptions')
    .select(`
      id,
      status,
      price_id,
      metadata
    `)
    .in('status', ['active', 'trialing']);

  if (error) {
    console.error('[SubscriptionMetrics] Error calculating MRR:', error);
    return { mrr_cents: 0, breakdown: {} };
  }

  // Also query legacy subscriptions from user_profiles for comparison
  const { data: legacySubscribers } = await db
    .from('user_profiles')
    .select('id, subscription_tier, stripe_subscription_status')
    .in('stripe_subscription_status', ['active', 'trialing'])
    .neq('subscription_tier', 'free');

  let mrrCents = 0;
  const breakdown = {
    collector: { count: 0, monthly: 0, annual: 0 },
    tuner: { count: 0, monthly: 0, annual: 0 },
  };

  // Use new subscriptions table if available
  if (subscriptions && subscriptions.length > 0) {
    for (const sub of subscriptions) {
      const tier = sub.metadata?.tier || 'collector';
      const interval = sub.metadata?.interval || 'month';
      const monthlyPrice = getMonthlyPriceForTier(tier, interval);
      
      mrrCents += monthlyPrice;
      
      if (breakdown[tier]) {
        breakdown[tier].count++;
        if (interval === 'year') {
          breakdown[tier].annual++;
        } else {
          breakdown[tier].monthly++;
        }
      }
    }
  } else if (legacySubscribers) {
    // Fall back to legacy user_profiles
    for (const user of legacySubscribers) {
      const tier = user.subscription_tier;
      const monthlyPrice = getMonthlyPriceForTier(tier, 'month');
      
      mrrCents += monthlyPrice;
      
      if (breakdown[tier]) {
        breakdown[tier].count++;
        breakdown[tier].monthly++;
      }
    }
  }

  return {
    mrr_cents: mrrCents,
    arr_cents: mrrCents * 12,
    breakdown,
  };
}

/**
 * Calculate churn rate for a given period
 * 
 * Formula: (Churned subscribers / Total at period start) * 100
 * 
 * @param {number} [days=30] - Period in days
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<Object>} { churn_rate, churned, total_at_start }
 */
export async function calculateChurnRate(days = 30, supabase = null) {
  const db = supabase || getSupabaseAdmin();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get subscribers at period start (approximation: count current + churned in period)
  const { data: currentActive } = await db
    .from('subscriptions')
    .select('id')
    .in('status', ['active', 'trialing']);

  // Get subscriptions that were canceled in the period
  const { data: churned } = await db
    .from('subscriptions')
    .select('id')
    .eq('status', 'canceled')
    .gte('canceled_at', startDate.toISOString());

  const churnedCount = churned?.length || 0;
  const currentCount = currentActive?.length || 0;
  const totalAtStart = currentCount + churnedCount;

  const churnRate = totalAtStart > 0 
    ? (churnedCount / totalAtStart) * 100 
    : 0;

  return {
    churn_rate: Math.round(churnRate * 100) / 100, // Round to 2 decimal places
    churned: churnedCount,
    total_at_start: totalAtStart,
    period_days: days,
  };
}

/**
 * Calculate trial-to-paid conversion rate
 * 
 * Formula: (Converted trials / Total trials) * 100
 * 
 * @param {number} [days=90] - Period in days
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<Object>} { conversion_rate, converted, total_trials }
 */
export async function calculateTrialConversionRate(days = 90, supabase = null) {
  const db = supabase || getSupabaseAdmin();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all trials from trial_history
  const { data: trials } = await db
    .from('trial_history')
    .select('id, converted_to_paid')
    .gte('trial_started_at', startDate.toISOString());

  if (!trials || trials.length === 0) {
    return {
      conversion_rate: 0,
      converted: 0,
      total_trials: 0,
      period_days: days,
    };
  }

  const totalTrials = trials.length;
  const convertedTrials = trials.filter(t => t.converted_to_paid).length;
  const conversionRate = (convertedTrials / totalTrials) * 100;

  return {
    conversion_rate: Math.round(conversionRate * 100) / 100,
    converted: convertedTrials,
    total_trials: totalTrials,
    period_days: days,
  };
}

/**
 * Calculate LTV (Lifetime Value)
 * 
 * Simple Formula: ARPU / Monthly Churn Rate
 * 
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<Object>} { ltv_cents, arpu_cents, monthly_churn_rate }
 */
export async function calculateLTV(supabase = null) {
  const db = supabase || getSupabaseAdmin();

  // Get MRR and subscriber count
  const { mrr_cents, breakdown } = await calculateMRR(db);
  const totalSubscribers = Object.values(breakdown).reduce(
    (sum, tier) => sum + tier.count, 
    0
  );

  // Calculate ARPU (Average Revenue Per User)
  const arpuCents = totalSubscribers > 0 
    ? mrr_cents / totalSubscribers 
    : 0;

  // Get monthly churn rate
  const { churn_rate } = await calculateChurnRate(30, db);
  const monthlyChurnDecimal = churn_rate / 100;

  // Calculate LTV
  // LTV = ARPU / Churn (if churn > 0)
  let ltvCents = 0;
  if (monthlyChurnDecimal > 0) {
    ltvCents = Math.round(arpuCents / monthlyChurnDecimal);
  } else if (totalSubscribers > 0) {
    // If no churn, use 12 months as default lifetime
    ltvCents = arpuCents * 12;
  }

  return {
    ltv_cents: ltvCents,
    arpu_cents: Math.round(arpuCents),
    monthly_churn_rate: churn_rate,
    total_subscribers: totalSubscribers,
  };
}

/**
 * Get subscriber count by tier
 * 
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<Object>} { total, by_tier }
 */
export async function getSubscriberCounts(supabase = null) {
  const db = supabase || getSupabaseAdmin();

  // Try new subscriptions table first
  const { data: subscriptions } = await db
    .from('subscriptions')
    .select('id, metadata')
    .in('status', ['active', 'trialing']);

  if (subscriptions && subscriptions.length > 0) {
    const byTier = { free: 0, collector: 0, tuner: 0 };
    for (const sub of subscriptions) {
      const tier = sub.metadata?.tier || 'collector';
      if (byTier[tier] !== undefined) {
        byTier[tier]++;
      }
    }

    return {
      total: subscriptions.length,
      by_tier: byTier,
    };
  }

  // Fall back to legacy user_profiles
  const { data: profiles } = await db
    .from('user_profiles')
    .select('id, subscription_tier, stripe_subscription_status')
    .in('stripe_subscription_status', ['active', 'trialing']);

  const byTier = { free: 0, collector: 0, tuner: 0 };
  for (const profile of profiles || []) {
    const tier = profile.subscription_tier || 'free';
    if (byTier[tier] !== undefined) {
      byTier[tier]++;
    }
  }

  return {
    total: profiles?.length || 0,
    by_tier: byTier,
  };
}

/**
 * Get all subscription metrics
 * 
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<Object>} All metrics combined
 */
export async function getAllMetrics(supabase = null) {
  const db = supabase || getSupabaseAdmin();

  const [mrrData, churnData, conversionData, ltvData, subscriberData] = await Promise.all([
    calculateMRR(db),
    calculateChurnRate(30, db),
    calculateTrialConversionRate(90, db),
    calculateLTV(db),
    getSubscriberCounts(db),
  ]);

  return {
    mrr_cents: mrrData.mrr_cents,
    arr_cents: mrrData.arr_cents,
    mrr_breakdown: mrrData.breakdown,
    
    monthly_churn_rate: churnData.churn_rate,
    churned_subscribers: churnData.churned,
    
    trial_conversion_rate: conversionData.conversion_rate,
    trial_conversions: conversionData.converted,
    total_trials: conversionData.total_trials,
    
    ltv_cents: ltvData.ltv_cents,
    arpu_cents: ltvData.arpu_cents,
    
    total_subscribers: subscriberData.total,
    subscribers_by_tier: subscriberData.by_tier,
    
    calculated_at: new Date().toISOString(),
  };
}

/**
 * Save daily metrics snapshot
 * 
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<boolean>} Success status
 */
export async function saveDailySnapshot(supabase = null) {
  const db = supabase || getSupabaseAdmin();
  const metrics = await getAllMetrics(db);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { error } = await db
    .from('subscription_metrics')
    .upsert({
      date: today,
      mrr_cents: metrics.mrr_cents,
      arr_cents: metrics.arr_cents,
      total_subscribers: metrics.total_subscribers,
      new_subscribers: 0, // Would need to calculate from previous day
      churned_subscribers: metrics.churned_subscribers,
      trial_starts: metrics.total_trials,
      trial_conversions: metrics.trial_conversions,
      monthly_churn_rate: metrics.monthly_churn_rate,
      trial_conversion_rate: metrics.trial_conversion_rate,
      by_tier: metrics.subscribers_by_tier,
      by_interval: {}, // Would need additional tracking
    }, {
      onConflict: 'date',
    });

  if (error) {
    console.error('[SubscriptionMetrics] Error saving snapshot:', error);
    return false;
  }

  console.log('[SubscriptionMetrics] Daily snapshot saved:', today);
  return true;
}

/**
 * Get historical metrics
 * 
 * @param {number} [days=30] - Number of days to retrieve
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<Array>} Array of daily metrics
 */
export async function getHistoricalMetrics(days = 30, supabase = null) {
  const db = supabase || getSupabaseAdmin();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const METRICS_COLS = 'id, date, mrr_cents, total_subscribers, new_subscribers, churned_subscribers, trial_starts, trial_conversions, average_revenue_per_user_cents, created_at';
  
  const { data, error } = await db
    .from('subscription_metrics')
    .select(METRICS_COLS)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) {
    console.error('[SubscriptionMetrics] Error fetching history:', error);
    return [];
  }

  return data || [];
}

// =============================================================================
// EXPORT
// =============================================================================

const subscriptionMetrics = {
  calculateMRR,
  calculateChurnRate,
  calculateTrialConversionRate,
  calculateLTV,
  getSubscriberCounts,
  getAllMetrics,
  saveDailySnapshot,
  getHistoricalMetrics,
};

export default subscriptionMetrics;
