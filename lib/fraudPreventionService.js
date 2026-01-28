/**
 * Fraud Prevention Service
 * 
 * Provides functions for:
 * - Trial abuse prevention (device fingerprinting, email domain tracking)
 * - Velocity checks (rate limiting checkout attempts)
 * - Payment failure tracking
 * 
 * @module lib/fraudPrevention
 */

import { createClient } from '@supabase/supabase-js';

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
// DISPOSABLE EMAIL DOMAINS
// Common disposable email providers to flag
// =============================================================================

const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  'throwaway.email',
  'guerrillamail.com',
  'mailinator.com',
  '10minutemail.com',
  'fakeinbox.com',
  'temp-mail.org',
  'yopmail.com',
  'sharklasers.com',
  'maildrop.cc',
];

// =============================================================================
// TRIAL ELIGIBILITY CHECKS
// =============================================================================

/**
 * Check if a user is eligible for a trial
 * 
 * Checks:
 * 1. If user has had a trial before for this product
 * 2. If device fingerprint has been used for a trial
 * 3. If email domain is disposable
 * 
 * @param {string} userId - User ID
 * @param {string} productId - Stripe product ID
 * @param {Object} [options] - Additional options
 * @param {string} [options.deviceFingerprint] - Device fingerprint
 * @param {string} [options.email] - User email
 * @param {string} [options.ipAddress] - User IP address
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<Object>} { eligible: boolean, reason?: string, flags: string[] }
 */
export async function checkTrialEligibility(userId, productId, options = {}, supabase = null) {
  const db = supabase || getSupabaseAdmin();
  const flags = [];
  
  // 1. Check if user has had a trial for this product
  const { data: userTrial } = await db
    .from('trial_history')
    .select('id, trial_started_at')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (userTrial) {
    return {
      eligible: false,
      reason: 'User has already used a trial for this product',
      flags: ['previous_trial'],
    };
  }

  // 2. Check device fingerprint (if provided)
  if (options.deviceFingerprint) {
    const { data: deviceTrials } = await db
      .from('trial_history')
      .select('id, user_id')
      .eq('device_fingerprint', options.deviceFingerprint)
      .eq('product_id', productId)
      .neq('user_id', userId);

    if (deviceTrials && deviceTrials.length > 0) {
      flags.push('device_used_before');
      
      // If more than 2 trials on this device, block
      if (deviceTrials.length >= 2) {
        return {
          eligible: false,
          reason: 'Device has been used for multiple trials',
          flags: ['device_abuse'],
        };
      }
    }
  }

  // 3. Check email domain
  if (options.email) {
    const emailDomain = options.email.split('@')[1]?.toLowerCase();
    
    if (emailDomain && DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
      flags.push('disposable_email');
      
      // For disposable emails, check if domain has been used before
      const { data: domainTrials } = await db
        .from('trial_history')
        .select('id')
        .eq('email_domain', emailDomain)
        .eq('product_id', productId);

      if (domainTrials && domainTrials.length >= 3) {
        return {
          eligible: false,
          reason: 'Too many trials from this email provider',
          flags: ['email_domain_abuse'],
        };
      }
    }
  }

  // 4. Check IP address (if provided) - basic velocity check
  if (options.ipAddress) {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: ipTrials } = await db
      .from('trial_history')
      .select('id')
      .eq('ip_address', options.ipAddress)
      .eq('product_id', productId)
      .gte('trial_started_at', oneDayAgo.toISOString());

    if (ipTrials && ipTrials.length >= 3) {
      flags.push('ip_velocity');
      return {
        eligible: false,
        reason: 'Too many trial signups from this IP',
        flags: ['ip_abuse'],
      };
    }
  }

  return {
    eligible: true,
    reason: null,
    flags,
  };
}

/**
 * Record a trial start
 * 
 * @param {Object} trialData
 * @param {string} trialData.userId - User ID
 * @param {string} trialData.productId - Stripe product ID
 * @param {string} [trialData.subscriptionId] - Stripe subscription ID
 * @param {string} [trialData.deviceFingerprint] - Device fingerprint
 * @param {string} [trialData.email] - User email
 * @param {string} [trialData.ipAddress] - User IP address
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<boolean>} Success status
 */
export async function recordTrialStart(trialData, supabase = null) {
  const db = supabase || getSupabaseAdmin();
  
  const emailDomain = trialData.email 
    ? trialData.email.split('@')[1]?.toLowerCase() 
    : null;

  const { error } = await db
    .from('trial_history')
    .upsert({
      user_id: trialData.userId,
      product_id: trialData.productId,
      subscription_id: trialData.subscriptionId || null,
      device_fingerprint: trialData.deviceFingerprint || null,
      email_domain: emailDomain,
      ip_address: trialData.ipAddress || null,
      trial_started_at: new Date().toISOString(),
      converted_to_paid: false,
    }, {
      onConflict: 'user_id,product_id',
    });

  if (error) {
    console.error('[FraudPrevention] Error recording trial:', error);
    return false;
  }

  return true;
}

// =============================================================================
// VELOCITY CHECKS
// =============================================================================

/**
 * Check if user has exceeded checkout velocity limits
 * 
 * @param {string} userId - User ID
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<Object>} { allowed: boolean, reason?: string, recentAttempts: number }
 */
export async function checkCheckoutVelocity(userId, supabase = null) {
  const db = supabase || getSupabaseAdmin();
  
  // Check attempts in last hour from processed_webhook_events
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const { data: _recentEvents, count } = await db
    .from('processed_webhook_events')
    .select('id', { count: 'exact' })
    .eq('payload->autorev_user_id', userId)
    .ilike('event_type', 'checkout.session.%')
    .gte('created_at', oneHourAgo.toISOString());

  const attemptCount = count || 0;

  // Allow up to 10 checkout attempts per hour
  if (attemptCount >= 10) {
    return {
      allowed: false,
      reason: 'Too many checkout attempts. Please try again later.',
      recentAttempts: attemptCount,
    };
  }

  return {
    allowed: true,
    reason: null,
    recentAttempts: attemptCount,
  };
}

/**
 * Track payment failures for a customer
 * 
 * @param {string} customerId - Stripe customer ID
 * @param {Object} [supabase] - Optional Supabase client
 * @returns {Promise<Object>} { failureCount: number, shouldFlag: boolean }
 */
export async function checkPaymentFailures(customerId, supabase = null) {
  const db = supabase || getSupabaseAdmin();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: _failures, count } = await db
    .from('processed_webhook_events')
    .select('id', { count: 'exact' })
    .eq('payload->customer', customerId)
    .eq('event_type', 'invoice.payment_failed')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const failureCount = count || 0;

  // Flag accounts with 5+ failures in 30 days
  return {
    failureCount,
    shouldFlag: failureCount >= 5,
  };
}

// =============================================================================
// EXPORT
// =============================================================================

const fraudPrevention = {
  checkTrialEligibility,
  recordTrialStart,
  checkCheckoutVelocity,
  checkPaymentFailures,
  DISPOSABLE_EMAIL_DOMAINS,
};

export default fraudPrevention;
