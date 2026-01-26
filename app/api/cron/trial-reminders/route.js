/**
 * Cron Job: Trial Expiration Reminders
 * 
 * Sends email notifications to users whose trials are ending soon.
 * Should be triggered daily by Vercel Cron or similar scheduler.
 * 
 * Sends reminders:
 * - 3 days before trial ends
 * - 1 day before trial ends
 * 
 * POST /api/cron/trial-reminders
 * 
 * Headers:
 *   Authorization: Bearer CRON_SECRET
 * 
 * @module app/api/cron/trial-reminders/route
 */

import { NextResponse } from 'next/server';
import { supabaseServiceRole } from '@/lib/supabase';
import { sendTrialEndingEmail } from '@/lib/emailService';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Check if request is authorized via CRON_SECRET or Vercel cron header
 * SECURITY: Requires either valid secret or Vercel cron header
 */
function isAuthorized(request) {
  const authHeader = request.headers.get('authorization');
  const vercelCron = request.headers.get('x-vercel-cron');
  
  // Accept Vercel's automatic cron header
  if (vercelCron === 'true') return true;
  
  // Accept Bearer token with CRON_SECRET
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;
  
  return false;
}

async function handlePost(request) {
  // Verify authorization
  if (!isAuthorized(request)) {
    console.error('[Trial Reminders] Unauthorized. CRON_SECRET set:', Boolean(CRON_SECRET), 'x-vercel-cron:', request.headers.get('x-vercel-cron'));
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Trial Reminders] Starting cron job...');
  
  const results = {
    processed: 0,
    sent: 0,
    errors: [],
    skipped: 0,
  };

  try {
    const supabase = supabaseServiceRole;
    if (!supabase) {
      throw new Error('Supabase service role not configured');
    }

    // Get current date in UTC
    const now = new Date();
    
    // Calculate dates for reminders (3 days and 1 day from now)
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(0, 0, 0, 0);
    
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    oneDayFromNow.setHours(0, 0, 0, 0);
    
    const fourDaysFromNow = new Date(now);
    fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);
    fourDaysFromNow.setHours(0, 0, 0, 0);
    
    const twoDaysFromNow = new Date(now);
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    twoDaysFromNow.setHours(0, 0, 0, 0);

    // Query users with trialing status whose trial ends in 3 days or 1 day
    // Note: subscription_ends_at should be when trial ends
    const { data: trialingUsers, error: queryError } = await supabase
      .from('profiles')
      .select('id, display_name, subscription_tier, subscription_ends_at, stripe_subscription_status')
      .eq('stripe_subscription_status', 'trialing')
      .not('subscription_ends_at', 'is', null);

    if (queryError) {
      throw queryError;
    }

    console.log(`[Trial Reminders] Found ${trialingUsers?.length || 0} trialing users`);

    for (const profile of trialingUsers || []) {
      results.processed++;
      
      const trialEnd = new Date(profile.subscription_ends_at);
      const daysUntilEnd = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
      
      // Only send for 3 days or 1 day remaining
      if (daysUntilEnd !== 3 && daysUntilEnd !== 1) {
        results.skipped++;
        continue;
      }
      
      // Get user email from auth
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);
      
      if (authError || !authUser?.user?.email) {
        console.error(`[Trial Reminders] Could not get email for user ${profile.id}`);
        results.errors.push({ userId: profile.id, error: 'No email found' });
        continue;
      }

      // Check if we've already sent this reminder
      const reminderKey = `trial_reminder_${daysUntilEnd}d`;
      const { data: existingLog } = await supabase
        .from('email_logs')
        .select('id')
        .eq('user_id', profile.id)
        .eq('template_slug', reminderKey)
        .gte('sent_at', new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())
        .maybeSingle();

      if (existingLog) {
        console.log(`[Trial Reminders] Already sent ${daysUntilEnd}d reminder to ${profile.id}`);
        results.skipped++;
        continue;
      }

      // Send the email
      const emailResult = await sendTrialEndingEmail({
        userId: profile.id,
        email: authUser.user.email,
        userName: profile.display_name || authUser.user.user_metadata?.full_name,
        daysRemaining: daysUntilEnd,
        trialEndDate: trialEnd.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        }),
        tier: profile.subscription_tier,
      });

      if (emailResult.success) {
        results.sent++;
        
        // Log that we sent this reminder
        await supabase.from('email_logs').insert({
          user_id: profile.id,
          template_slug: reminderKey,
          to_email: authUser.user.email,
          sent_at: new Date().toISOString(),
          metadata: { days_remaining: daysUntilEnd },
        }).catch(() => {}); // Don't fail if logging fails
        
        console.log(`[Trial Reminders] Sent ${daysUntilEnd}d reminder to ${authUser.user.email}`);
      } else {
        results.errors.push({ userId: profile.id, error: emailResult.error });
      }
      
      // Rate limit
      await new Promise(r => setTimeout(r, 100));
    }

    console.log(`[Trial Reminders] Complete: ${results.sent} sent, ${results.skipped} skipped, ${results.errors.length} errors`);

    return NextResponse.json({
      success: true,
      ...results,
    });

  } catch (error) {
    console.error('[Trial Reminders] Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: 'Trial reminders cron job failed',
      ...results,
    }, { status: 500 });
  }
}

// Also support GET for manual testing
async function handleGet(request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'GET only allowed in development' }, { status: 405 });
  }
  return handlePost(request);
}

export const POST = withErrorLogging(handlePost, { route: 'cron/trial-reminders', feature: 'cron' });
export const GET = withErrorLogging(handleGet, { route: 'cron/trial-reminders', feature: 'cron' });
