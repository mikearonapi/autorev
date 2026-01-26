/**
 * AL Usage Service - Token-Based Cost Tracking
 * 
 * Manages the token/dollar-based usage system for AL:
 * - Track actual token usage (input/output) from each API call
 * - Calculate real costs based on Anthropic pricing
 * - Deduct from user's balance in cents
 * - Handle monthly balance refills
 * - Process balance top-ups (purchases)
 */

import { 
  ANTHROPIC_PRICING,
  calculateTokenCost,
  AL_PLANS,
  AL_TOPUP_PACKAGES,
  getPlan,
  calculateTankPercentage,
  getTankStatus,
  formatCentsAsDollars,
} from './alConfig';
import { supabase, isSupabaseConfigured, supabaseServiceRole } from './supabase';
import { getEffectiveTier, isInTrial } from './tierAccess';

// Use service role for server-side operations (bypasses RLS)
const getServerClient = () => supabaseServiceRole || supabase;
const getClientForContext = (isServer = true) => isServer ? getServerClient() : supabase;

// =============================================================================
// USER BALANCE OPERATIONS
// =============================================================================

/**
 * Get user's current balance and usage stats
 * @param {string} userId - User ID
 * @returns {Object} Balance info and stats
 */
export async function getUserBalance(userId) {
  if (!isSupabaseConfigured || !userId) {
    return {
      balanceCents: 0,
      plan: 'free',
      tank: { percentage: 0, status: getTankStatus(0) },
      error: 'Not configured',
    };
  }

  const client = getClientForContext(true);

  try {
    const { data: usage, error } = await client
      .from('al_user_credits')
      .select('id, user_id, subscription_tier, current_credits, purchased_credits, credits_used_this_month, messages_this_month, last_refill_date, created_at, updated_at, balance_cents, purchased_cents, spent_cents_this_month, input_tokens_this_month, output_tokens_this_month, is_unlimited')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No record found, initialize user
      return await initializeUserBalance(userId);
    }

    if (error) {
      console.error('[AL Usage] Error fetching balance:', error);
      return { balanceCents: 0, plan: 'free', error: error.message };
    }

    const plan = getPlan(usage.subscription_tier);
    const isUnlimited = usage.is_unlimited || false;
    const percentage = isUnlimited ? 100 : calculateTankPercentage(usage.balance_cents, usage.subscription_tier);

    return {
      balanceCents: usage.balance_cents || 0,
      plan: usage.subscription_tier,
      planName: isUnlimited ? 'Founder' : plan.name,
      monthlyAllocationCents: isUnlimited ? Infinity : plan.allocation.monthlyCents,
      purchasedCents: usage.purchased_cents || 0,
      spentThisMonthCents: parseFloat(usage.spent_cents_this_month) || 0,
      inputTokensThisMonth: usage.input_tokens_this_month || 0,
      outputTokensThisMonth: usage.output_tokens_this_month || 0,
      messagesThisMonth: usage.messages_this_month || 0,
      lastRefillDate: usage.last_refill_date,
      isUnlimited,
      tank: {
        percentage,
        status: isUnlimited 
          ? { label: 'Unlimited', color: '#8b5cf6', icon: '♾️' }
          : getTankStatus(percentage),
        label: isUnlimited ? 'Founder Tank ♾️' : plan.tankLabel,
      },
    };
  } catch (err) {
    console.error('[AL Usage] Error:', err);
    return { balanceCents: 0, plan: 'free', error: err.message };
  }
}

// Legacy alias for backwards compatibility
export const getUserCredits = getUserBalance;

/**
 * Get user's effective tier (considering trial status)
 * Fetches from user_profiles to check trial_ends_at
 * @param {string} userId - User ID
 * @returns {string} Effective tier ('free', 'collector', 'tuner')
 */
async function getUserEffectiveTier(userId) {
  if (!isSupabaseConfigured || !userId) return 'free';
  
  const client = getServerClient();
  
  try {
    const { data: profile, error } = await client
      .from('user_profiles')
      .select('subscription_tier, trial_ends_at')
      .eq('id', userId)
      .maybeSingle();
    
    if (error || !profile) return 'free';
    
    // Use the shared getEffectiveTier function
    return getEffectiveTier(profile);
  } catch (err) {
    console.error('[AL Usage] Error getting effective tier:', err);
    return 'free';
  }
}

/**
 * Initialize balance for a new user
 * Uses effective tier which considers trial status
 * @param {string} userId - User ID
 * @param {string} planId - Plan ID (default: will auto-detect from user profile)
 * @returns {Object} Initial balance info
 */
export async function initializeUserBalance(userId, planId = null) {
  if (!isSupabaseConfigured) {
    return { balanceCents: 0, plan: 'free', error: 'Not configured' };
  }

  const client = getServerClient();
  
  // If no planId provided, get effective tier (which considers trial)
  const effectiveTier = planId || await getUserEffectiveTier(userId);
  const plan = getPlan(effectiveTier);
  const initialCents = plan.allocation.monthlyCents + (plan.allocation.bonusCents || 0);

  try {
    const { data, error } = await client
      .from('al_user_credits')
      .upsert({
        user_id: userId,
        subscription_tier: effectiveTier,
        balance_cents: initialCents,
        purchased_cents: 0,
        spent_cents_this_month: 0,
        input_tokens_this_month: 0,
        output_tokens_this_month: 0,
        messages_this_month: 0,
        last_refill_date: new Date().toISOString(),
        // Keep legacy fields for backwards compatibility
        current_credits: initialCents,
        purchased_credits: 0,
        credits_used_this_month: 0,
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    const percentage = calculateTankPercentage(initialCents, effectiveTier);

    return {
      balanceCents: initialCents,
      plan: effectiveTier,
      planName: plan.name,
      tank: {
        percentage,
        status: getTankStatus(percentage),
        label: plan.tankLabel,
      },
    };
  } catch (err) {
    console.error('[AL Usage] Error initializing balance:', err);
    return { balanceCents: 0, plan: 'free', error: err.message };
  }
}

// Legacy alias
export const initializeUserCredits = initializeUserBalance;

/**
 * Deduct cost from user's balance based on actual token usage
 * 
 * @param {string} userId - User ID
 * @param {Object} usage - Usage details from Claude API response
 * @param {number} usage.inputTokens - Number of input tokens used
 * @param {number} usage.outputTokens - Number of output tokens used
 * @param {string[]} usage.toolCalls - Array of tool names called (for logging)
 * @param {string} [usage.carSlug] - Car being discussed (for analytics)
 * @param {string} [usage.pageContext] - Page context (for analytics)
 * @returns {Object} Result with new balance and cost details
 */
export async function deductUsage(userId, { inputTokens = 0, outputTokens = 0, toolCalls = [], carSlug = null, pageContext = null, promptVersionId = null }) {
  if (!isSupabaseConfigured || !userId) {
    return { success: false, error: 'Not configured' };
  }

  const client = getServerClient();
  
  // Calculate actual cost in cents based on token usage
  const costCents = calculateTokenCost(inputTokens, outputTokens);
  
  try {
    // Get current balance and check if user has unlimited access
    const { data: current, error: fetchError } = await client
      .from('al_user_credits')
      .select('balance_cents, spent_cents_this_month, input_tokens_this_month, output_tokens_this_month, messages_this_month, is_unlimited')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        await initializeUserBalance(userId);
        return deductUsage(userId, { inputTokens, outputTokens, toolCalls });
      }
      throw fetchError;
    }

    // If user has unlimited access, skip balance check and deduction
    if (current.is_unlimited) {
      // Still update usage stats for tracking, but don't deduct balance
      const { error: updateError } = await client
        .from('al_user_credits')
        .update({
          input_tokens_this_month: (current.input_tokens_this_month || 0) + inputTokens,
          output_tokens_this_month: (current.output_tokens_this_month || 0) + outputTokens,
          messages_this_month: (current.messages_this_month || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Log the usage for analytics (with zero cost since it's free for them)
      // Note: estimated_cost_cents is still tracked in logUsage for analytics
      await logUsage(userId, { inputTokens, outputTokens, costCents: 0, toolCalls, carSlug, pageContext, promptVersionId });

      return {
        success: true,
        costCents: 0,
        newBalanceCents: current.balance_cents,
        inputTokens,
        outputTokens,
        isUnlimited: true,
      };
    }

    // Check if user has enough balance
    if (current.balance_cents < costCents) {
      return {
        success: false,
        error: 'insufficient_balance',
        balanceCents: current.balance_cents,
        requiredCents: costCents,
        message: `Not enough balance. You have ${formatCentsAsDollars(current.balance_cents)}, this would cost ${formatCentsAsDollars(Math.ceil(costCents))}`,
      };
    }

    // Deduct from balance and update stats
    const newBalance = current.balance_cents - costCents;
    const { error: updateError } = await client
      .from('al_user_credits')
      .update({
        balance_cents: newBalance,
        spent_cents_this_month: (parseFloat(current.spent_cents_this_month) || 0) + costCents,
        input_tokens_this_month: (current.input_tokens_this_month || 0) + inputTokens,
        output_tokens_this_month: (current.output_tokens_this_month || 0) + outputTokens,
        messages_this_month: (current.messages_this_month || 0) + 1,
        updated_at: new Date().toISOString(),
        // Keep legacy fields in sync
        current_credits: Math.round(newBalance),
        credits_used_this_month: Math.round((parseFloat(current.spent_cents_this_month) || 0) + costCents),
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Log the usage with full details
    await logUsage(userId, { inputTokens, outputTokens, costCents, toolCalls, carSlug, pageContext, promptVersionId });

    return {
      success: true,
      costCents,
      newBalanceCents: newBalance,
      inputTokens,
      outputTokens,
    };
  } catch (err) {
    console.error('[AL Usage] Error deducting usage:', err);
    return { success: false, error: err.message };
  }
}

// Legacy alias with adapter
export async function deductCredits(userId, { toolCalls = [], responseTokens = 0, hasContext = false }) {
  // Estimate tokens if not provided directly
  const inputTokens = hasContext ? 2000 : 1000;
  const outputTokens = responseTokens || 500;
  return deductUsage(userId, { inputTokens, outputTokens, toolCalls });
}

/**
 * Add purchased balance to user's account
 * @param {string} userId - User ID
 * @param {string} packageId - Top-up package ID
 * @returns {Object} Result with new balance
 */
export async function purchaseTopup(userId, packageId) {
  if (!isSupabaseConfigured || !userId) {
    return { success: false, error: 'Not configured' };
  }

  const client = getServerClient();
  const package_ = AL_TOPUP_PACKAGES.find(p => p.id === packageId);
  
  if (!package_) {
    return { success: false, error: 'Invalid package' };
  }

  try {
    const { data: current, error: fetchError } = await client
      .from('al_user_credits')
      .select('balance_cents, purchased_cents')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        await initializeUserBalance(userId);
        return purchaseTopup(userId, packageId);
      }
      throw fetchError;
    }

    // Add purchased cents to balance
    const newBalance = current.balance_cents + package_.cents;
    const newPurchased = (current.purchased_cents || 0) + package_.cents;

    const { error: updateError } = await client
      .from('al_user_credits')
      .update({
        balance_cents: newBalance,
        purchased_cents: newPurchased,
        updated_at: new Date().toISOString(),
        // Legacy sync
        current_credits: newBalance,
        purchased_credits: newPurchased,
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Log the purchase
    await logPurchase(userId, packageId, package_.cents, package_.price);

    return {
      success: true,
      centsAdded: package_.cents,
      newBalanceCents: newBalance,
    };
  } catch (err) {
    console.error('[AL Usage] Error purchasing top-up:', err);
    return { success: false, error: err.message };
  }
}

// Legacy alias
export const purchaseCredits = purchaseTopup;

/**
 * Process monthly balance refill for a user
 * @param {string} userId - User ID
 * @returns {Object} Result with new balance
 */
export async function processMonthlyRefill(userId) {
  if (!isSupabaseConfigured || !userId) {
    return { success: false, error: 'Not configured' };
  }

  const client = getServerClient();

  try {
    const { data: current, error: fetchError } = await client
      .from('al_user_credits')
      .select('subscription_tier, balance_cents')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const plan = getPlan(current.subscription_tier);
    const monthlyAllocation = plan.allocation.monthlyCents;
    const maxCarryover = plan.allocation.maxCarryoverCents;

    // Calculate carryover (unused balance up to max)
    const carryover = Math.min(current.balance_cents, maxCarryover);
    const newBalance = monthlyAllocation + carryover;

    const { error: updateError } = await client
      .from('al_user_credits')
      .update({
        balance_cents: newBalance,
        spent_cents_this_month: 0,
        input_tokens_this_month: 0,
        output_tokens_this_month: 0,
        messages_this_month: 0,
        last_refill_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Legacy sync
        current_credits: newBalance,
        credits_used_this_month: 0,
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return {
      success: true,
      newBalanceCents: newBalance,
      carryoverCents: carryover,
      monthlyAllocationCents: monthlyAllocation,
    };
  } catch (err) {
    console.error('[AL Usage] Error processing refill:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update user's subscription tier
 * @param {string} userId - User ID
 * @param {string} newTier - New tier ID
 * @returns {Object} Result with updated balance
 */
export async function updateSubscriptionTier(userId, newTier) {
  if (!isSupabaseConfigured || !userId) {
    return { success: false, error: 'Not configured' };
  }

  const client = getServerClient();
  const plan = getPlan(newTier);

  try {
    const { data: current, error: fetchError } = await client
      .from('al_user_credits')
      .select('balance_cents, subscription_tier')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return await initializeUserBalance(userId, newTier);
      }
      throw fetchError;
    }

    // If upgrading, add bonus cents
    const isUpgrade = ['free', 'collector', 'tuner'].indexOf(newTier) > 
                      ['free', 'collector', 'tuner'].indexOf(current.subscription_tier);
    const bonusCents = isUpgrade ? (plan.allocation.bonusCents || 0) : 0;
    const newBalance = current.balance_cents + bonusCents;

    const { error: updateError } = await client
      .from('al_user_credits')
      .update({
        subscription_tier: newTier,
        balance_cents: newBalance,
        updated_at: new Date().toISOString(),
        current_credits: newBalance,
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return {
      success: true,
      newTier,
      newBalanceCents: newBalance,
      bonusCentsAdded: bonusCents,
    };
  } catch (err) {
    console.error('[AL Usage] Error updating tier:', err);
    return { success: false, error: err.message };
  }
}

// =============================================================================
// USAGE LOGGING & ANALYTICS
// =============================================================================

/**
 * Log a usage event with full token details
 * 
 * Always tracks estimated_cost_cents for analytics, even for unlimited users
 * where cost_cents = 0
 */
async function logUsage(userId, { inputTokens, outputTokens, costCents, toolCalls, carSlug = null, pageContext = null, promptVersionId = null }) {
  if (!isSupabaseConfigured) return;

  const client = getServerClient();
  
  // Calculate the actual cost (for analytics) - this is always tracked
  const estimatedCostCents = calculateTokenCost(inputTokens, outputTokens);
  
  try {
    await client.from('al_usage_logs').insert({
      user_id: userId,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_cents: costCents, // What was actually charged (0 for unlimited)
      estimated_cost_cents: estimatedCostCents, // Actual cost for analytics
      tool_calls: toolCalls,
      model: ANTHROPIC_PRICING.model,
      purpose: 'user_chat',
      source: 'user_chat',
      car_slug: carSlug,
      page_context: pageContext,
      prompt_version_id: promptVersionId, // For A/B testing analysis
      // Legacy fields
      credits_used: Math.ceil(costCents),
      response_tokens: outputTokens,
    });
  } catch (err) {
    console.warn('[AL Usage] Error logging usage:', err);
  }
}

/**
 * Log a purchase event
 */
async function logPurchase(userId, packageId, cents, price) {
  if (!isSupabaseConfigured) return;

  const client = getServerClient();
  
  try {
    await client.from('al_credit_purchases').insert({
      user_id: userId,
      package_id: packageId,
      credits_purchased: cents, // Using cents now
      amount_paid: price,
    });
  } catch (err) {
    console.warn('[AL Usage] Error logging purchase:', err);
  }
}

/**
 * Get user's usage history
 * @param {string} userId - User ID
 * @param {number} limit - Max records to return
 * @returns {Array} Usage history with token and cost details
 */
export async function getUsageHistory(userId, limit = 50) {
  if (!isSupabaseConfigured || !userId) {
    return [];
  }

  const client = getClientForContext(true);

  const LOG_COLS = 'id, user_id, conversation_id, message_id, credits_used, model, prompt_tokens, completion_tokens, response_time_ms, car_slug, tool_calls, created_at';
  
  try {
    const { data, error } = await client
      .from('al_usage_logs')
      .select(LOG_COLS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[AL Usage] Error fetching history:', err);
    return [];
  }
}

/**
 * Get usage statistics for a user
 * @param {string} userId - User ID
 * @returns {Object} Usage statistics
 */
export async function getUsageStats(userId) {
  if (!isSupabaseConfigured || !userId) {
    return { error: 'Not configured' };
  }

  const client = getClientForContext(true);

  try {
    // Get this month's stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthStats, error } = await client
      .from('al_usage_logs')
      .select('input_tokens, output_tokens, cost_cents, tool_calls')
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) throw error;

    const totalInputTokens = monthStats?.reduce((sum, log) => sum + (log.input_tokens || 0), 0) || 0;
    const totalOutputTokens = monthStats?.reduce((sum, log) => sum + (log.output_tokens || 0), 0) || 0;
    const totalCostCents = monthStats?.reduce((sum, log) => sum + (parseFloat(log.cost_cents) || 0), 0) || 0;
    const totalMessages = monthStats?.length || 0;

    // Tool usage breakdown
    const toolUsage = {};
    monthStats?.forEach(log => {
      if (log.tool_calls) {
        log.tool_calls.forEach(tool => {
          toolUsage[tool] = (toolUsage[tool] || 0) + 1;
        });
      }
    });

    return {
      thisMonth: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        costCents: totalCostCents,
        costFormatted: formatCentsAsDollars(totalCostCents),
        messages: totalMessages,
        avgCostPerMessage: totalMessages > 0 
          ? formatCentsAsDollars(totalCostCents / totalMessages)
          : '$0.00',
      },
      topTools: Object.entries(toolUsage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tool, count]) => ({ tool, count })),
    };
  } catch (err) {
    console.error('[AL Usage] Error fetching stats:', err);
    return { error: err.message };
  }
}

/**
 * Check if user needs a monthly refill
 * @param {string} userId - User ID
 * @returns {boolean} Whether refill is needed
 */
export async function needsMonthlyRefill(userId) {
  if (!isSupabaseConfigured || !userId) return false;

  const client = getClientForContext(true);

  try {
    const { data, error } = await client
      .from('al_user_credits')
      .select('last_refill_date')
      .eq('user_id', userId)
      .single();

    if (error || !data) return false;

    const lastRefill = new Date(data.last_refill_date);
    const now = new Date();
    
    // Check if we're in a new month
    return lastRefill.getMonth() !== now.getMonth() || 
           lastRefill.getFullYear() !== now.getFullYear();
  } catch (err) {
    console.error('[AL Usage] Error checking refill:', err);
    return false;
  }
}

/**
 * Estimate cost for a query before sending
 * This helps users understand what an interaction might cost
 * 
 * @param {string} query - User's query text
 * @param {boolean} hasContext - Whether there's car context
 * @returns {Object} Estimated cost range in cents
 */
export function estimateQueryCost(query, hasContext = false) {
  // Rough token estimates
  const queryTokens = Math.ceil(query.length / 4);
  const contextTokens = hasContext ? 1500 : 0;
  const systemPromptTokens = 800;
  
  // Estimate input: query + context + system prompt
  const estimatedInput = queryTokens + contextTokens + systemPromptTokens;
  
  // Estimate output: typical response 300-800 tokens
  const estimatedOutputMin = 300;
  const estimatedOutputMax = 800;
  
  const minCost = calculateTokenCost(estimatedInput, estimatedOutputMin);
  const maxCost = calculateTokenCost(estimatedInput, estimatedOutputMax);
  
  return {
    estimatedInputTokens: estimatedInput,
    estimatedOutputTokensRange: [estimatedOutputMin, estimatedOutputMax],
    estimatedCostCentsMin: minCost,
    estimatedCostCentsMax: maxCost,
    formatted: `${formatCentsAsDollars(minCost)} - ${formatCentsAsDollars(maxCost)}`,
  };
}

// =============================================================================
// DAILY USAGE TRACKING
// =============================================================================

// Import beta flag from tierAccess for consistency
import { IS_BETA } from './tierAccess';

/**
 * Get user's daily usage stats
 * @param {string} userId - User ID
 * @returns {Object} Daily usage info including count, beta status, etc.
 */
export async function getDailyUsage(userId) {
  if (!isSupabaseConfigured || !userId) {
    return {
      queriesToday: 0,
      isNewDay: false,
      isUnlimited: false,
      isBeta: IS_BETA,
      messagesThisMonth: 0,
      balanceCents: 0,
    };
  }

  const client = getClientForContext(true);

  try {
    const { data, error } = await client.rpc('get_daily_al_usage', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[AL Usage] Error fetching daily usage:', error);
      return {
        queriesToday: 0,
        isNewDay: true,
        isUnlimited: false,
        isBeta: IS_BETA,
        messagesThisMonth: 0,
        balanceCents: 0,
        error: error.message,
      };
    }

    const result = data?.[0] || {};
    
    return {
      queriesToday: result.queries_today || 0,
      lastQueryDate: result.last_query_date,
      isUnlimited: result.is_unlimited || false,
      isBeta: IS_BETA,
      messagesThisMonth: result.messages_this_month || 0,
      balanceCents: result.balance_cents || 0,
    };
  } catch (err) {
    console.error('[AL Usage] Error in getDailyUsage:', err);
    return {
      queriesToday: 0,
      isNewDay: true,
      isUnlimited: false,
      isBeta: IS_BETA,
      messagesThisMonth: 0,
      balanceCents: 0,
      error: err.message,
    };
  }
}

/**
 * Increment daily query counter
 * Automatically resets if it's a new day
 * @param {string} userId - User ID
 * @returns {Object} Result with new count and flags
 */
export async function incrementDailyQuery(userId) {
  if (!isSupabaseConfigured || !userId) {
    return {
      success: false,
      queriesToday: 0,
      isNewDay: false,
      isUnlimited: false,
      isBeta: IS_BETA,
      error: 'Not configured',
    };
  }

  const client = getServerClient();

  try {
    const { data, error } = await client.rpc('increment_daily_al_query', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[AL Usage] Error incrementing daily query:', error);
      return {
        success: false,
        queriesToday: 0,
        isNewDay: false,
        isUnlimited: false,
        isBeta: IS_BETA,
        error: error.message,
      };
    }

    const result = data?.[0] || {};
    
    return {
      success: true,
      queriesToday: result.queries_today || 1,
      isNewDay: result.is_new_day || false,
      isUnlimited: result.is_unlimited || false,
      isBeta: IS_BETA,
    };
  } catch (err) {
    console.error('[AL Usage] Error in incrementDailyQuery:', err);
    return {
      success: false,
      queriesToday: 0,
      isNewDay: false,
      isUnlimited: false,
      isBeta: IS_BETA,
      error: err.message,
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

const alUsageService = {
  // Main operations
  getUserBalance,
  getUserCredits, // Legacy alias
  initializeUserBalance,
  initializeUserCredits, // Legacy alias
  deductUsage,
  deductCredits, // Legacy alias
  purchaseTopup,
  purchaseCredits, // Legacy alias
  processMonthlyRefill,
  updateSubscriptionTier,
  
  // Daily tracking
  getDailyUsage,
  incrementDailyQuery,
  
  // Analytics
  getUsageHistory,
  getUsageStats,
  needsMonthlyRefill,
  estimateQueryCost,
  
  // Beta flag
  IS_BETA,
};

export default alUsageService;
