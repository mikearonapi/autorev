/**
 * Alerts Engine API
 * 
 * Auto-generates actionable alerts based on platform metrics.
 * 
 * @route GET /api/admin/alerts
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/adminAccess';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Alert thresholds
const THRESHOLDS = {
  // Financial
  MONTHLY_BURN_WARNING: 500, // $500
  MONTHLY_BURN_CRITICAL: 1000, // $1000
  VARIABLE_COST_SPIKE: 50, // 50% increase
  
  // Users
  ZERO_SIGNUPS_DAYS: 7, // Alert if no signups for 7 days
  LOW_ENGAGEMENT_PERCENT: 20, // Less than 20% weekly active
  
  // Content
  STALE_CONTENT_DAYS: 30, // Content not updated in 30 days
  LOW_COVERAGE_PERCENT: 50, // Less than 50% coverage
  
  // System
  ERROR_RATE_WARNING: 5, // 5 errors in 24h
  ERROR_RATE_CRITICAL: 20, // 20 errors in 24h
  FAILED_JOBS_WARNING: 3,
  FAILED_JOBS_CRITICAL: 10,
  
  // AI
  HIGH_TOKEN_USAGE: 100000, // 100K tokens/day
  COST_PER_USER_WARNING: 50, // $0.50 per active user
};

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
    const alerts = [];
    
    // =========================================================================
    // FINANCIAL ALERTS
    // =========================================================================
    
    // Get current month financials
    const { data: currentMonth } = await supabase
      .from('monthly_financials')
      .select('*')
      .eq('fiscal_year', now.getFullYear())
      .eq('fiscal_month', now.getMonth() + 1)
      .single();
    
    if (currentMonth) {
      const totalCosts = (currentMonth.total_fixed_costs_cents + currentMonth.total_variable_costs_cents) / 100;
      
      if (totalCosts > THRESHOLDS.MONTHLY_BURN_CRITICAL) {
        alerts.push({
          id: 'burn-critical',
          type: 'financial',
          severity: 'critical',
          title: 'High Monthly Burn Rate',
          message: `Monthly costs at $${totalCosts.toFixed(0)} (excl. R&D)`,
          action: 'Review cost breakdown and optimize spending',
          metric: totalCosts,
          threshold: THRESHOLDS.MONTHLY_BURN_CRITICAL,
        });
      } else if (totalCosts > THRESHOLDS.MONTHLY_BURN_WARNING) {
        alerts.push({
          id: 'burn-warning',
          type: 'financial',
          severity: 'warning',
          title: 'Elevated Monthly Burn',
          message: `Monthly costs at $${totalCosts.toFixed(0)}`,
          action: 'Monitor for increases',
          metric: totalCosts,
          threshold: THRESHOLDS.MONTHLY_BURN_WARNING,
        });
      }
      
      // No revenue alert
      if (currentMonth.total_revenue_cents === 0 && currentMonth.paying_users === 0) {
        alerts.push({
          id: 'no-revenue',
          type: 'financial',
          severity: 'info',
          title: 'Pre-Revenue Phase',
          message: 'No revenue generated yet - expected during early stage',
          action: 'Focus on user acquisition and product-market fit',
          metric: 0,
        });
      }
    }
    
    // =========================================================================
    // USER GROWTH ALERTS
    // =========================================================================
    
    // Check recent signups
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { count: recentSignups } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());
    
    if (recentSignups === 0) {
      alerts.push({
        id: 'no-signups',
        type: 'growth',
        severity: 'warning',
        title: 'No New Signups',
        message: 'No new users in the past 7 days',
        action: 'Review acquisition channels and marketing efforts',
        metric: 0,
        threshold: THRESHOLDS.ZERO_SIGNUPS_DAYS,
      });
    }
    
    // Check engagement
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    
    const { data: activeUsers } = await supabase
      .from('al_conversations')
      .select('user_id')
      .gte('last_message_at', weekAgo.toISOString());
    
    const uniqueActiveUsers = new Set((activeUsers || []).map(a => a.user_id)).size;
    const engagementRate = totalUsers > 0 ? (uniqueActiveUsers / totalUsers) * 100 : 0;
    
    if (totalUsers > 5 && engagementRate < THRESHOLDS.LOW_ENGAGEMENT_PERCENT) {
      alerts.push({
        id: 'low-engagement',
        type: 'growth',
        severity: 'warning',
        title: 'Low User Engagement',
        message: `Only ${engagementRate.toFixed(0)}% of users active this week`,
        action: 'Improve onboarding and feature discovery',
        metric: engagementRate,
        threshold: THRESHOLDS.LOW_ENGAGEMENT_PERCENT,
      });
    }
    
    // =========================================================================
    // CONTENT ALERTS
    // =========================================================================
    
    // Check content coverage
    const { data: contentStats } = await supabase
      .from('cars')
      .select('image_hero_url, embedding');
    
    if (contentStats && contentStats.length > 0) {
      const withImages = contentStats.filter(c => c.image_hero_url).length;
      const imageCoverage = (withImages / contentStats.length) * 100;
      
      if (imageCoverage < THRESHOLDS.LOW_COVERAGE_PERCENT) {
        alerts.push({
          id: 'low-image-coverage',
          type: 'content',
          severity: 'info',
          title: 'Low Image Coverage',
          message: `Only ${imageCoverage.toFixed(0)}% of vehicles have hero images`,
          action: 'Run image scraper to improve coverage',
          metric: imageCoverage,
          threshold: THRESHOLDS.LOW_COVERAGE_PERCENT,
        });
      }
      
      const withEmbeddings = contentStats.filter(c => c.embedding).length;
      const embeddingCoverage = (withEmbeddings / contentStats.length) * 100;
      
      if (embeddingCoverage < THRESHOLDS.LOW_COVERAGE_PERCENT) {
        alerts.push({
          id: 'low-embedding-coverage',
          type: 'content',
          severity: 'warning',
          title: 'Low Embedding Coverage',
          message: `Only ${embeddingCoverage.toFixed(0)}% of vehicles have embeddings`,
          action: 'Run embedding generation for AL search quality',
          metric: embeddingCoverage,
          threshold: THRESHOLDS.LOW_COVERAGE_PERCENT,
        });
      }
    }
    
    // =========================================================================
    // SYSTEM ALERTS
    // =========================================================================
    
    // Check error rate (ONLY unresolved errors)
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const RESOLVED_STATUSES = ['resolved', 'fixed', 'closed', 'wont_fix'];
    const { count: errorCount } = await supabase
      .from('user_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'auto-error')
      .gte('created_at', dayAgo.toISOString())
      .not('status', 'in', `(${RESOLVED_STATUSES.join(',')})`);
    
    if ((errorCount || 0) >= THRESHOLDS.ERROR_RATE_CRITICAL) {
      alerts.push({
        id: 'errors-critical',
        type: 'system',
        severity: 'critical',
        title: 'High Error Rate',
        message: `${errorCount} errors in last 24 hours`,
        action: 'Investigate and fix immediately',
        metric: errorCount,
        threshold: THRESHOLDS.ERROR_RATE_CRITICAL,
      });
    } else if ((errorCount || 0) >= THRESHOLDS.ERROR_RATE_WARNING) {
      alerts.push({
        id: 'errors-warning',
        type: 'system',
        severity: 'warning',
        title: 'Elevated Error Rate',
        message: `${errorCount} errors in last 24 hours`,
        action: 'Review error logs',
        metric: errorCount,
        threshold: THRESHOLDS.ERROR_RATE_WARNING,
      });
    }
    
    // Check failed jobs
    const { data: failedJobs } = await supabase
      .from('scrape_jobs')
      .select('id')
      .eq('status', 'failed')
      .gte('created_at', dayAgo.toISOString());
    
    const failedCount = failedJobs?.length || 0;
    if (failedCount >= THRESHOLDS.FAILED_JOBS_CRITICAL) {
      alerts.push({
        id: 'jobs-critical',
        type: 'system',
        severity: 'critical',
        title: 'Many Failed Jobs',
        message: `${failedCount} scrape jobs failed today`,
        action: 'Check job logs and fix pipeline issues',
        metric: failedCount,
        threshold: THRESHOLDS.FAILED_JOBS_CRITICAL,
      });
    } else if (failedCount >= THRESHOLDS.FAILED_JOBS_WARNING) {
      alerts.push({
        id: 'jobs-warning',
        type: 'system',
        severity: 'warning',
        title: 'Job Failures Detected',
        message: `${failedCount} scrape jobs failed today`,
        action: 'Monitor pipeline health',
        metric: failedCount,
        threshold: THRESHOLDS.FAILED_JOBS_WARNING,
      });
    }
    
    // =========================================================================
    // AI USAGE ALERTS
    // =========================================================================
    
    // Check AI costs per active user
    const { data: usageLogs } = await supabase
      .from('al_usage_logs')
      .select('cost_cents')
      .gte('created_at', dayAgo.toISOString());
    
    const dailyAICost = (usageLogs || []).reduce((sum, l) => sum + parseFloat(l.cost_cents || 0), 0);
    const costPerUser = uniqueActiveUsers > 0 ? dailyAICost / uniqueActiveUsers : 0;
    
    if (costPerUser > THRESHOLDS.COST_PER_USER_WARNING) {
      alerts.push({
        id: 'ai-cost-high',
        type: 'financial',
        severity: 'warning',
        title: 'High AI Cost per User',
        message: `$${(costPerUser / 100).toFixed(2)} per active user per day`,
        action: 'Review AL usage patterns and optimize prompts',
        metric: costPerUser,
        threshold: THRESHOLDS.COST_PER_USER_WARNING,
      });
    }
    
    // Sort alerts by severity
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    return NextResponse.json({
      alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length,
      },
      thresholds: THRESHOLDS,
      timestamp: now.toISOString(),
    });
    
  } catch (err) {
    console.error('[Alerts API] Error:', err);
    return NextResponse.json({ error: 'Failed to generate alerts' }, { status: 500 });
  }
}

