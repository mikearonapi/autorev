/**
 * Calculate Engagement Scores Cron Job
 * 
 * Runs daily to:
 * 1. Recalculate engagement scores for all users
 * 2. Update inactivity alerts
 * 3. Check return milestones
 * 
 * Schedule: Daily at 2 AM UTC (via Vercel cron)
 * 
 * @route GET /api/cron/calculate-engagement
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logCronError, withErrorLogging } from '@/lib/serverErrorLogger';

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for batch processing

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

async function handleGet(request) {
  // Verify authorization
  if (!isAuthorized(request)) {
    console.error('[EngagementCron] Unauthorized. CRON_SECRET set:', Boolean(CRON_SECRET), 'x-vercel-cron:', request.headers.get('x-vercel-cron'));
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    inactivityAlerts: { users_flagged_7d: 0, users_flagged_14d: 0 },
    scoresRecalculated: 0,
    returnMilestonesChecked: 0,
    errors: [],
  };

  try {
    console.log('[EngagementCron] Starting daily engagement calculation...');

    // Step 1: Update inactivity alerts
    console.log('[EngagementCron] Updating inactivity alerts...');
    const { data: alertData, error: alertError } = await supabase.rpc('update_inactivity_alerts');
    
    if (alertError) {
      console.error('[EngagementCron] Inactivity alert error:', alertError);
      results.errors.push({ step: 'inactivity_alerts', error: alertError.message });
    } else if (alertData && alertData.length > 0) {
      results.inactivityAlerts = alertData[0];
      console.log('[EngagementCron] Inactivity alerts updated:', results.inactivityAlerts);
    }

    // Step 2: Get all users with engagement records
    console.log('[EngagementCron] Fetching users for score recalculation...');
    const { data: users, error: usersError } = await supabase
      .from('user_engagement_scores')
      .select('user_id')
      .order('last_activity_at', { ascending: false, nullsFirst: false });

    if (usersError) {
      console.error('[EngagementCron] Users fetch error:', usersError);
      results.errors.push({ step: 'fetch_users', error: usersError.message });
    } else if (users && users.length > 0) {
      console.log(`[EngagementCron] Recalculating scores for ${users.length} users...`);
      
      // Process in batches of 50 to avoid timeouts
      const batchSize = 50;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        
        // Recalculate scores for batch
        await Promise.all(
          batch.map(async ({ user_id }) => {
            try {
              // Recalculate score
              await supabase.rpc('update_user_engagement_score', { p_user_id: user_id });
              results.scoresRecalculated++;
              
              // Check return milestones
              await supabase.rpc('check_return_milestones', { p_user_id: user_id });
              results.returnMilestonesChecked++;
            } catch (err) {
              console.warn(`[EngagementCron] Error processing user ${user_id}:`, err);
            }
          })
        );
        
        console.log(`[EngagementCron] Processed batch ${i / batchSize + 1}/${Math.ceil(users.length / batchSize)}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[EngagementCron] Completed in ${duration}ms`, results);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      results,
    });

  } catch (error) {
    console.error('[EngagementCron] Fatal error:', error);
    await logCronError('calculate-engagement', error, { phase: 'engagement-calculation', results });
    
    return NextResponse.json({
      success: false,
      error: 'Engagement calculation cron job failed',
      results,
    }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cron/calculate-engagement', feature: 'cron' });
