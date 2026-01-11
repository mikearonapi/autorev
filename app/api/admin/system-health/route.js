/**
 * System Health API
 * 
 * Aggregates errors, pipeline status, and system metrics.
 * 
 * @route GET /api/admin/system-health
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/adminAccess';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  // Verify admin access
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // =========================================================================
    // Error Tracking - Show ALL errors and breakdown by status
    // =========================================================================
    const RESOLVED_STATUSES = ['resolved', 'fixed', 'closed', 'wont_fix'];
    
    // Count ALL errors in last 24h (regardless of status) - shows volume
    const { count: totalErrors24h } = await supabase
      .from('user_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'auto-error')
      .gte('created_at', last24h.toISOString());
    
    // Count ALL errors in last 7 days (regardless of status)
    const { count: totalErrors7d } = await supabase
      .from('user_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'auto-error')
      .gte('created_at', last7d.toISOString());
    
    // Count FIXED errors in last 24h
    const { count: fixedErrors24h } = await supabase
      .from('user_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'auto-error')
      .gte('created_at', last24h.toISOString())
      .in('status', RESOLVED_STATUSES);
    
    // Count FIXED errors in last 7 days
    const { count: fixedErrors7d } = await supabase
      .from('user_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'auto-error')
      .gte('created_at', last7d.toISOString())
      .in('status', RESOLVED_STATUSES);
    
    // Get recent UNRESOLVED errors for display
    const { data: recentErrors } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('category', 'auto-error')
      .not('status', 'in', `(${RESOLVED_STATUSES.join(',')})`)
      .order('created_at', { ascending: false })
      .limit(10);
    
    // Get ALL unresolved errors (total count)
    const { count: totalUnresolvedCount } = await supabase
      .from('user_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'auto-error')
      .not('status', 'in', `(${RESOLVED_STATUSES.join(',')})`);
    
    // Error count by severity (only unresolved)
    const { data: errorsBySeverity } = await supabase
      .from('user_feedback')
      .select('severity, status')
      .eq('category', 'auto-error')
      .not('status', 'in', `(${RESOLVED_STATUSES.join(',')})`);
    
    const severityCounts = (errorsBySeverity || []).reduce((acc, e) => {
      acc[e.severity || 'unknown'] = (acc[e.severity || 'unknown'] || 0) + 1;
      return acc;
    }, {});
    
    // Count blocking errors specifically (unresolved only)
    const blockingErrors = (errorsBySeverity || []).filter(e => 
      e.severity === 'blocking'
    ).length;
    
    // =========================================================================
    // Data Pipeline Status
    // =========================================================================
    // Note: car_slug column no longer exists on scrape_jobs, use car_id
    const { data: recentJobs } = await supabase
      .from('scrape_jobs')
      .select('id, job_type, status, car_id, created_at, completed_at, error_message')
      .gte('created_at', last24h.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);
    
    const jobStats = (recentJobs || []).reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});
    
    // =========================================================================
    // YouTube Pipeline Status
    // =========================================================================
    const { data: videoStats } = await supabase
      .from('youtube_videos')
      .select('processing_status')
      .gte('created_at', last7d.toISOString());
    
    const videoStatusCounts = (videoStats || []).reduce((acc, v) => {
      acc[v.processing_status] = (acc[v.processing_status] || 0) + 1;
      return acc;
    }, {});
    
    // =========================================================================
    // Forum Scraping Status
    // =========================================================================
    const { data: forumRuns } = await supabase
      .from('forum_scrape_runs')
      .select('status, threads_scraped, insights_extracted, error_message')
      .gte('created_at', last7d.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);
    
    // =========================================================================
    // Content Freshness
    // =========================================================================
    const { data: staleContent } = await supabase
      .from('cars')
      .select('slug, name, updated_at')
      .lt('updated_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10);
    
    // =========================================================================
    // API Usage (from usage_metrics)
    // =========================================================================
    const { data: dailyErrors } = await supabase
      .from('usage_metrics')
      .select('metric_date, metric_value')
      .eq('service_name', 'PLATFORM')
      .eq('metric_type', 'DAILY_ERRORS')
      .gte('metric_date', last7d.toISOString().split('T')[0])
      .order('metric_date', { ascending: false });
    
    // =========================================================================
    // Generate Alerts
    // =========================================================================
    const alerts = [];
    
    // High error rate alert (based on total errors, not just unresolved)
    if ((totalErrors24h || 0) > 10) {
      alerts.push({
        type: 'error',
        severity: 'high',
        message: `${totalErrors24h} errors in last 24 hours`,
        action: 'Review error logs',
      });
    }
    
    // Unresolved blocking errors
    if (blockingErrors > 0) {
      alerts.push({
        type: 'error',
        severity: 'critical',
        message: `${blockingErrors} unresolved blocking errors`,
        action: 'Fix immediately',
      });
    }
    
    // Failed scrape jobs
    const failedJobs = jobStats.failed || 0;
    if (failedJobs > 3) {
      alerts.push({
        type: 'warning',
        severity: 'medium',
        message: `${failedJobs} scrape jobs failed recently`,
        action: 'Check job logs',
      });
    }
    
    // Stale content
    if ((staleContent?.length || 0) > 5) {
      alerts.push({
        type: 'info',
        severity: 'low',
        message: `${staleContent?.length} vehicles not updated in 30+ days`,
        action: 'Schedule content refresh',
      });
    }
    
    // Pending videos
    const pendingVideos = videoStatusCounts.pending || 0;
    if (pendingVideos > 20) {
      alerts.push({
        type: 'warning',
        severity: 'medium',
        message: `${pendingVideos} videos pending processing`,
        action: 'Check YouTube pipeline',
      });
    }
    
    return NextResponse.json({
      errors: {
        // Total errors in time periods (regardless of status)
        total24h: totalErrors24h || 0,
        total7d: totalErrors7d || 0,
        // Fixed/resolved errors
        fixed24h: fixedErrors24h || 0,
        fixed7d: fixedErrors7d || 0,
        // Unresolved errors
        unresolved: totalUnresolvedCount || 0,
        blocking: blockingErrors,
        bySeverity: severityCounts,
        // Recent unresolved errors for display
        recent: (recentErrors || []).map(e => ({
          id: e.id,
          message: e.message,
          severity: e.severity,
          status: e.status,
          page: e.page_url,
          createdAt: e.created_at,
          occurrences: e.occurrence_count || 1,
        })),
      },
      
      pipeline: {
        scrapeJobs: {
          total: recentJobs?.length || 0,
          byStatus: jobStats,
          recent: (recentJobs || []).slice(0, 5).map(j => ({
            id: j.id,
            type: j.job_type,
            status: j.status,
            car_id: j.car_id,
            error: j.error_message,
          })),
        },
        
        youtube: {
          byStatus: videoStatusCounts,
          totalRecent: videoStats?.length || 0,
        },
        
        forum: {
          runs: (forumRuns || []).map(r => ({
            status: r.status,
            threads: r.threads_scraped,
            insights: r.insights_extracted,
            error: r.error_message,
          })),
        },
      },
      
      content: {
        staleCount: staleContent?.length || 0,
        staleItems: (staleContent || []).map(c => ({
          slug: c.slug,
          name: c.name,
          lastUpdated: c.updated_at,
        })),
      },
      
      trends: {
        dailyErrors: (dailyErrors || []).map(d => ({
          date: d.metric_date,
          count: d.metric_value,
        })),
      },
      
      alerts,
      
      health: {
        status: alerts.some(a => a.severity === 'critical') ? 'critical' :
                alerts.some(a => a.severity === 'high') ? 'warning' :
                alerts.length > 0 ? 'info' : 'healthy',
        lastChecked: now.toISOString(),
      },
      
      timestamp: now.toISOString(),
    });
    
  } catch (err) {
    console.error('[System Health API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch system health' }, { status: 500 });
  }
}

