/**
 * Beta Dashboard API
 * 
 * Provides comprehensive analytics summary for monitoring beta launch.
 * Returns user growth, engagement, errors, and health metrics.
 * 
 * @route GET /api/admin/beta-dashboard
 */

import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user for auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check admin status (simple check - user ID in admin list or tier check)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();
    
    // Allow admin and tuner tiers to view
    const allowedTiers = ['admin', 'tuner'];
    const isAdmin = allowedTiers.includes(profile?.subscription_tier) || 
                    user.email?.endsWith('@autorev.app') ||
                    user.email === 'mjaron5@gmail.com'; // Founder access
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Parallel queries for better performance
    const [
      usersResult,
      signupsResult,
      activityResult,
      alResult,
      errorsResult,
      feedbackResult,
      snapshotsResult,
      recentErrorsResult,
    ] = await Promise.all([
      // Total users
      supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true }),
      
      // Signups this week
      supabase
        .from('user_profiles')
        .select('id, created_at')
        .gte('created_at', weekAgo)
        .order('created_at', { ascending: false }),
      
      // Activity metrics (last 7 days)
      supabase
        .from('user_activity')
        .select('event_type, user_id, session_id, created_at')
        .gte('created_at', weekAgo),
      
      // AL usage metrics
      supabase
        .from('al_conversations')
        .select('id, user_id, message_count, created_at')
        .gte('created_at', weekAgo),
      
      // Errors (last 24 hours)
      supabase
        .from('application_errors')
        .select('id, severity, status, created_at')
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()),
      
      // User feedback (last 7 days)
      supabase
        .from('user_feedback')
        .select('id, category, severity, status, created_at')
        .gte('created_at', weekAgo),
      
      // Historical snapshots
      supabase
        .from('daily_metrics_snapshot')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(7),
      
      // Recent unresolved errors
      supabase
        .from('application_errors')
        .select('message, severity, occurrence_count, first_seen_at, last_seen_at')
        .eq('status', 'new')
        .order('last_seen_at', { ascending: false })
        .limit(5),
    ]);
    
    // Calculate metrics
    const totalUsers = usersResult.count || 0;
    const signupsThisWeek = signupsResult.data?.length || 0;
    
    // Activity breakdown
    const activities = activityResult.data || [];
    const uniqueActiveSessions = new Set(activities.map(a => a.session_id)).size;
    const uniqueActiveUsers = new Set(activities.filter(a => a.user_id).map(a => a.user_id)).size;
    const activityByType = activities.reduce((acc, a) => {
      acc[a.event_type] = (acc[a.event_type] || 0) + 1;
      return acc;
    }, {});
    
    // AL metrics
    const alConversations = alResult.data || [];
    const totalALChats = alConversations.length;
    const totalALMessages = alConversations.reduce((sum, c) => sum + (c.message_count || 0), 0);
    const uniqueALUsers = new Set(alConversations.filter(c => c.user_id).map(c => c.user_id)).size;
    
    // Error metrics
    const errors24h = errorsResult.data || [];
    const errorCount = errors24h.length;
    const criticalErrors = errors24h.filter(e => ['blocking', 'major'].includes(e.severity)).length;
    const unresolvedErrors = errors24h.filter(e => e.status === 'new').length;
    
    // Feedback metrics
    const feedback = feedbackResult.data || [];
    const feedbackCount = feedback.length;
    const bugReports = feedback.filter(f => f.category === 'bug').length;
    const unresolvedFeedback = feedback.filter(f => ['new', 'reviewed'].includes(f.status)).length;
    
    // Trend calculation from snapshots
    const snapshots = snapshotsResult.data || [];
    const todaySnapshot = snapshots.find(s => s.snapshot_date === today);
    const yesterdaySnapshot = snapshots[1];
    
    // Recent errors for display
    const recentErrors = recentErrorsResult.data || [];
    
    // Calculate health score (0-100)
    let healthScore = 100;
    if (criticalErrors > 0) healthScore -= 20 * Math.min(criticalErrors, 3);
    if (unresolvedErrors > 10) healthScore -= 10;
    if (errorCount > 50) healthScore -= 15;
    healthScore = Math.max(0, healthScore);
    
    // Build response
    const response = {
      timestamp: now.toISOString(),
      
      // User Growth
      users: {
        total: totalUsers,
        signupsThisWeek,
        activeThisWeek: uniqueActiveUsers,
        sessionsThisWeek: uniqueActiveSessions,
        trend: yesterdaySnapshot ? {
          userChange: totalUsers - (yesterdaySnapshot.total_users || 0),
        } : null,
      },
      
      // Engagement
      engagement: {
        totalActivities: activities.length,
        byType: activityByType,
        topActions: Object.entries(activityByType)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([type, count]) => ({ type, count })),
      },
      
      // AL Metrics
      al: {
        conversationsThisWeek: totalALChats,
        messagesThisWeek: totalALMessages,
        uniqueUsersThisWeek: uniqueALUsers,
        avgMessagesPerConversation: totalALChats > 0 
          ? Math.round(totalALMessages / totalALChats * 10) / 10 
          : 0,
      },
      
      // Error Tracking
      errors: {
        last24h: errorCount,
        critical: criticalErrors,
        unresolved: unresolvedErrors,
        recentUnresolved: recentErrors.map(e => ({
          message: e.message?.slice(0, 100),
          severity: e.severity,
          count: e.occurrence_count,
          lastSeen: e.last_seen_at,
        })),
      },
      
      // Feedback
      feedback: {
        thisWeek: feedbackCount,
        bugs: bugReports,
        unresolved: unresolvedFeedback,
      },
      
      // Health Summary
      health: {
        score: healthScore,
        status: healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'degraded' : 'critical',
        alerts: [
          criticalErrors > 0 && `${criticalErrors} critical errors in last 24h`,
          unresolvedErrors > 10 && `${unresolvedErrors} unresolved errors need attention`,
          bugReports > 5 && `${bugReports} bug reports this week`,
        ].filter(Boolean),
      },
      
      // Historical Data
      history: snapshots.map(s => ({
        date: s.snapshot_date,
        users: s.total_users,
        newUsers: s.new_users_today,
        activeUsers: s.active_users_today,
        alChats: s.al_conversations_today,
        errors: s.errors_today,
      })),
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('[beta-dashboard] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to load dashboard',
      details: error.message,
    }, { status: 500 });
  }
}

