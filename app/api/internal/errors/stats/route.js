/**
 * Internal API - Error Statistics
 * 
 * Provides aggregated error statistics for the dashboard.
 * Uses the error_statistics view and get_error_trend function.
 */

import { NextResponse } from 'next/server';

import { withErrorLogging } from '@/lib/serverErrorLogger';

// Force dynamic rendering - this route uses request.url
export const dynamic = 'force-dynamic';
import { getServiceClient } from '@/lib/supabaseServer';

async function handleGet(request) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const trendHours = parseInt(searchParams.get('trend_hours') || '168', 10); // 7 days default
    const bucketHours = parseInt(searchParams.get('bucket_hours') || '24', 10); // Daily default

    const STATS_COLS = 'total_errors, unresolved_errors, resolved_errors, errors_today, errors_this_week, top_severity';
    
    // Get overall statistics from view
    const { data: statsData, error: statsError } = await supabase
      .from('error_statistics')
      .select(STATS_COLS)
      .single();

    if (statsError) {
      console.error('[Error Stats API] Stats view error:', statsError);
      // Fallback to manual query if view fails
    }

    // Get error trend using the function
    const { data: trendData, error: trendError } = await supabase
      .rpc('get_error_trend', {
        lookback_hours: trendHours,
        bucket_hours: bucketHours,
      });

    if (trendError) {
      console.error('[Error Stats API] Trend function error:', trendError);
    }

    // Get counts by error source
    const { data: sourceData, error: sourceError } = await supabase
      .from('user_feedback')
      .select('error_source')
      .eq('category', 'auto-error')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const sourceBreakdown = {};
    if (sourceData && !sourceError) {
      sourceData.forEach(item => {
        const source = item.error_source || 'unknown';
        sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
      });
    }

    // Get counts by feature
    const { data: featureData, error: featureError } = await supabase
      .from('user_feedback')
      .select('feature_context')
      .eq('category', 'auto-error')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const featureBreakdown = {};
    if (featureData && !featureError) {
      featureData.forEach(item => {
        const feature = item.feature_context || 'unknown';
        featureBreakdown[feature] = (featureBreakdown[feature] || 0) + 1;
      });
    }

    // Get recent deployments with errors
    const { data: versionData, error: versionError } = await supabase
      .from('user_feedback')
      .select('app_version, created_at')
      .eq('category', 'auto-error')
      .not('app_version', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    const versionBreakdown = {};
    if (versionData && !versionError) {
      versionData.forEach(item => {
        const version = item.app_version || 'unknown';
        versionBreakdown[version] = (versionBreakdown[version] || 0) + 1;
      });
    }

    // Get top recurring errors (last 24 hours)
    const { data: recurringData, error: recurringError } = await supabase
      .from('user_feedback')
      .select('message, error_hash, severity, feature_context, occurrence_count, created_at')
      .eq('category', 'auto-error')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('occurrence_count', { ascending: false })
      .limit(10);

    // Calculate some derived stats
    const stats = statsData || {};
    const unresolvedByPriority = {
      blocking: stats.blocking_unresolved || 0,
      major: stats.major_unresolved || 0,
      minor: stats.minor_unresolved || 0,
    };

    return NextResponse.json({
      summary: {
        errorsLastHour: stats.errors_last_hour || 0,
        errorsLast24h: stats.errors_last_24h || 0,
        errorsLast7d: stats.errors_last_7d || 0,
        unresolvedTotal: stats.unresolved_total || 0,
        unresolvedByPriority,
      },
      trend: trendData || [],
      breakdown: {
        bySource: sourceBreakdown,
        byFeature: featureBreakdown,
        byVersion: versionBreakdown,
      },
      topRecurring: recurringData || [],
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Error Stats API] Unexpected error:', err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'internal-errors-stats', feature: 'internal' });



