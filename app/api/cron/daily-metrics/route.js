/**
 * Daily Metrics Cron Job
 * 
 * Runs at midnight to capture daily metrics snapshot.
 * Called by Vercel Cron or external scheduler.
 * 
 * @route GET /api/cron/daily-metrics
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { logCronError, withErrorLogging } from '@/lib/serverErrorLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

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
    console.error('[daily-metrics] Unauthorized request. CRON_SECRET set:', Boolean(CRON_SECRET), 'x-vercel-cron:', request.headers.get('x-vercel-cron'));
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate daily metrics snapshot
    const { data, error } = await supabase.rpc('generate_daily_metrics_snapshot');
    
    if (error) {
      console.error('[daily-metrics] Failed to generate snapshot:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to generate metrics snapshot' 
      }, { status: 500 });
    }
    
    const SNAPSHOT_COLS = 'id, snapshot_date, total_users, active_users, new_users, total_cars, total_parts, total_posts, revenue_cents, created_at';
    
    // Get the generated snapshot for logging
    const { data: snapshot } = await supabase
      .from('daily_metrics_snapshot')
      .select(SNAPSHOT_COLS)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();
    
    const duration = Date.now() - startTime;
    
    console.log('[daily-metrics] Snapshot generated:', {
      snapshotId: data,
      totalUsers: snapshot?.total_users,
      newUsersToday: snapshot?.new_users_today,
      activeUsersToday: snapshot?.active_users_today,
      errorsToday: snapshot?.errors_today,
      duration: `${duration}ms`,
    });
    
    // Note: Discord notification removed - the daily-digest cron (9 AM CST) 
    // handles all Discord notifications. This cron only captures DB snapshots.
    
    return NextResponse.json({
      success: true,
      snapshotId: data,
      summary: {
        date: snapshot?.snapshot_date,
        totalUsers: snapshot?.total_users,
        newUsersToday: snapshot?.new_users_today,
        activeUsersToday: snapshot?.active_users_today,
        alConversationsToday: snapshot?.al_conversations_today,
        errorsToday: snapshot?.errors_today,
        criticalErrorsToday: snapshot?.critical_errors_today,
      },
      durationMs: duration,
    });
    
  } catch (err) {
    console.error('[daily-metrics] Unexpected error:', err);
    await logCronError('daily-metrics', err, { phase: 'snapshot-generation' });
    return NextResponse.json({ 
      success: false, 
      error: 'Daily metrics cron job failed' 
    }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cron/daily-metrics', feature: 'cron' });
