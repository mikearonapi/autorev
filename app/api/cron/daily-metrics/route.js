/**
 * Daily Metrics Cron Job
 * 
 * Runs at midnight to capture daily metrics snapshot.
 * Called by Vercel Cron or external scheduler.
 * 
 * @route GET /api/cron/daily-metrics
 */

import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { notifyBetaMetrics } from '@/lib/discord';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.warn('[daily-metrics] CRON_SECRET not set, allowing request');
    return true;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request) {
  // Verify authorization
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  
  try {
    const supabase = createClient();
    
    // Generate daily metrics snapshot
    const { data, error } = await supabase.rpc('generate_daily_metrics_snapshot');
    
    if (error) {
      console.error('[daily-metrics] Failed to generate snapshot:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }
    
    // Get the generated snapshot for logging
    const { data: snapshot } = await supabase
      .from('daily_metrics_snapshot')
      .select('*')
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
    
    // Send beta metrics to Discord for daily monitoring
    if (snapshot) {
      await notifyBetaMetrics({
        totalUsers: snapshot.total_users,
        newUsersToday: snapshot.new_users_today,
        activeUsersToday: snapshot.active_users_today,
        alConversationsToday: snapshot.al_conversations_today,
        errorsToday: snapshot.errors_today,
        criticalErrorsToday: snapshot.critical_errors_today,
        feedbackToday: 0, // Can be enhanced to track this
        date: snapshot.snapshot_date,
      });
    }
    
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
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}
