/**
 * Cron Job: Expire Free Trials
 * 
 * Processes users whose 7-day Pro trial has ended.
 * This job doesn't actually need to change subscription_tier since we use
 * getEffectiveTier() which automatically falls back to 'free' when trial expires.
 * 
 * However, this job:
 * 1. Logs trial expiration for analytics
 * 2. Sends "trial ended" email
 * 3. Records in trial_history for fraud prevention
 * 
 * Should be triggered daily by Vercel Cron.
 * 
 * POST /api/cron/expire-trials
 * 
 * Headers:
 *   Authorization: Bearer CRON_SECRET
 * 
 * @module app/api/cron/expire-trials/route
 */

import { NextResponse } from 'next/server';

import { sendTrialEndedEmail } from '@/lib/emailService';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { supabaseServiceRole } from '@/lib/supabase';
import { TRIAL_CONFIG } from '@/lib/tierAccess';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Check if request is authorized via CRON_SECRET or Vercel cron header
 */
function isAuthorized(request) {
  const authHeader = request.headers.get('authorization');
  const vercelCron = request.headers.get('x-vercel-cron');
  
  if (vercelCron === 'true') return true;
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;
  
  return false;
}

async function handlePost(request) {
  if (!isAuthorized(request)) {
    console.error('[Expire Trials] Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Expire Trials] Starting cron job...');
  
  const results = {
    processed: 0,
    expired: 0,
    emailsSent: 0,
    errors: [],
    alreadyExpired: 0,
  };

  try {
    const supabase = supabaseServiceRole;
    if (!supabase) {
      throw new Error('Supabase service role not configured');
    }

    const now = new Date();
    
    // Find users whose trial has ended in the last 24 hours
    // (trial_ends_at is in the past, but we haven't processed them yet)
    const oneDayAgo = new Date(now);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { data: expiredTrialUsers, error: queryError } = await supabase
      .from('user_profiles')
      .select('id, display_name, email, subscription_tier, trial_ends_at, trial_expired_processed')
      .not('trial_ends_at', 'is', null)
      .lt('trial_ends_at', now.toISOString())
      .gte('trial_ends_at', oneDayAgo.toISOString())
      .or('trial_expired_processed.is.null,trial_expired_processed.eq.false');

    if (queryError) {
      throw queryError;
    }

    console.log(`[Expire Trials] Found ${expiredTrialUsers?.length || 0} users with recently expired trials`);

    for (const profile of expiredTrialUsers || []) {
      results.processed++;
      
      // Skip if user has upgraded to a paid tier
      if (profile.subscription_tier !== 'free') {
        console.log(`[Expire Trials] User ${profile.id} has upgraded to ${profile.subscription_tier}, skipping`);
        results.alreadyExpired++;
        continue;
      }
      
      // Get user email from auth if not in profile
      let email = profile.email;
      if (!email) {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
        email = authUser?.user?.email;
      }

      // Record trial expiration
      await supabase
        .from('user_profiles')
        .update({ 
          trial_expired_processed: true,
          trial_expired_at: now.toISOString(),
        })
        .eq('id', profile.id);

      // Log to trial_history for analytics
      await supabase.from('trial_history').insert({
        user_id: profile.id,
        product_id: null, // Free trial, no Stripe product
        trial_started_at: new Date(new Date(profile.trial_ends_at).getTime() - (TRIAL_CONFIG.durationDays * 24 * 60 * 60 * 1000)).toISOString(),
        trial_ended_at: profile.trial_ends_at,
        converted_to_paid: false,
      }).catch(err => {
        console.warn(`[Expire Trials] Failed to log trial history for ${profile.id}:`, err.message);
      });

      results.expired++;

      // Send trial ended email
      if (email) {
        try {
          const emailResult = await sendTrialEndedEmail({
            userId: profile.id,
            email,
            userName: profile.display_name,
            trialTier: TRIAL_CONFIG.tier,
          });

          if (emailResult?.success) {
            results.emailsSent++;
            console.log(`[Expire Trials] Sent trial ended email to ${email}`);
          }
        } catch (emailErr) {
          console.warn(`[Expire Trials] Failed to send email to ${profile.id}:`, emailErr.message);
          results.errors.push({ userId: profile.id, error: 'Email send failed' });
        }
      }
      
      // Rate limit
      await new Promise(r => setTimeout(r, 50));
    }

    console.log(`[Expire Trials] Complete: ${results.expired} expired, ${results.emailsSent} emails sent`);

    return NextResponse.json({
      success: true,
      ...results,
    });

  } catch (error) {
    console.error('[Expire Trials] Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      ...results,
    }, { status: 500 });
  }
}

// Support GET for testing in development
async function handleGet(request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'GET only allowed in development' }, { status: 405 });
  }
  return handlePost(request);
}

export const POST = withErrorLogging(handlePost, { route: 'cron/expire-trials', feature: 'cron' });
export const GET = withErrorLogging(handleGet, { route: 'cron/expire-trials', feature: 'cron' });
