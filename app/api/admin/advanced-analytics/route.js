/**
 * Advanced Analytics API
 * 
 * GET /api/admin/advanced-analytics
 * 
 * Returns comprehensive analytics including:
 * - Engagement metrics (scroll depth, time on page, engagement tiers)
 * - Feature adoption data
 * - User lifecycle distribution
 * - Goal completions
 * - Search analytics
 * - Active user counts (DAU, WAU, MAU)
 * - User health metrics
 */

import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - this route uses request.headers and request.url
export const dynamic = 'force-dynamic';
import { isAdminEmail } from '@/lib/adminAccess';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { rateLimit } from '@/lib/rateLimit';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Paths to exclude from analytics (internal admin pages only)
const EXCLUDED_PATHS = ['/admin', '/internal'];

function getDateRange(range) {
  const now = new Date();
  let startDate;
  
  switch (range) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  return {
    startDate: startDate.toISOString(),
    endDate: now.toISOString()
  };
}

async function handleGet(request) {
  // Rate limit - prevent DoS on expensive analytics queries
  const limited = rateLimit(request, 'api');
  if (limited) return limited;

  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user || !isAdminEmail(user.email)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get date range
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';
    const { startDate, endDate } = getDateRange(range);
    
    // Fetch all data in parallel
    const [
      engagementData,
      featureData,
      lifecycleData,
      goalData,
      searchData,
      activeUsersData
    ] = await Promise.all([
      // Engagement metrics
      getEngagementMetrics(startDate, endDate),
      // Feature adoption
      getFeatureAdoption(startDate, endDate),
      // User lifecycle
      getLifecycleDistribution(),
      // Goals
      getGoalCompletions(startDate, endDate),
      // Searches
      getSearchAnalytics(startDate, endDate),
      // Active users
      getActiveUserCounts()
    ]);
    
    return Response.json({
      engagement: engagementData,
      features: featureData,
      lifecycle: lifecycleData,
      goals: goalData,
      searches: searchData,
      activeUsers: activeUsersData,
      userHealth: await getUserHealth()
    });
    
  } catch (error) {
    console.error('[Advanced Analytics API] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getEngagementMetrics(startDate, endDate) {
  try {
    // Get engagement tier distribution
    // Note: page_engagement uses 'path' not 'page_path' and has no user_id column
    const { data: tierData } = await supabaseAdmin
      .from('page_engagement')
      .select('engagement_tier, path')
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    // Filter out internal paths only (no user_id in this table)
    const filteredTierData = (tierData || []).filter(row => {
      if (EXCLUDED_PATHS.some(excluded => row.path?.startsWith(excluded))) return false;
      return true;
    });
    
    const tiers = { bounced: 0, light: 0, engaged: 0, deep: 0 };
    filteredTierData.forEach(row => {
      if (row.engagement_tier && tiers[row.engagement_tier] !== undefined) {
        tiers[row.engagement_tier]++;
      }
    });
    
    // Get average metrics
    const { data: avgData } = await supabaseAdmin
      .from('page_engagement')
      .select('max_scroll_depth_percent, time_on_page_seconds, engaged_time_seconds, click_count, engagement_score, path')
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    // Filter out internal paths only
    const filteredAvgData = (avgData || []).filter(row => {
      if (EXCLUDED_PATHS.some(excluded => row.path?.startsWith(excluded))) return false;
      return true;
    });
    
    const count = filteredAvgData.length || 1;
    const avgScrollDepth = filteredAvgData.reduce((sum, r) => sum + (r.max_scroll_depth_percent || 0), 0) / count;
    const avgTimeOnPage = filteredAvgData.reduce((sum, r) => sum + (r.time_on_page_seconds || 0), 0) / count;
    const avgEngagedTime = filteredAvgData.reduce((sum, r) => sum + (r.engaged_time_seconds || 0), 0) / count;
    const avgClicks = filteredAvgData.reduce((sum, r) => sum + (r.click_count || 0), 0) / count;
    const avgScore = filteredAvgData.reduce((sum, r) => sum + (r.engagement_score || 0), 0) / count;
    
    // Get session duration (include all users, filter internal paths only)
    const { data: sessionData } = await supabaseAdmin
      .from('page_views')
      .select('session_id, user_id, path, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });
    
    // Filter out internal paths only (include all users)
    const filteredSessionData = (sessionData || []).filter(pv => {
      if (EXCLUDED_PATHS.some(excluded => pv.path?.startsWith(excluded))) return false;
      return true;
    });
    
    // Calculate pages per session
    const sessionsMap = new Map();
    filteredSessionData.forEach(pv => {
      if (!sessionsMap.has(pv.session_id)) {
        sessionsMap.set(pv.session_id, { count: 0, first: pv.created_at, last: pv.created_at });
      }
      const session = sessionsMap.get(pv.session_id);
      session.count++;
      session.last = pv.created_at;
    });
    
    const sessionCount = sessionsMap.size || 1;
    const totalPages = Array.from(sessionsMap.values()).reduce((sum, s) => sum + s.count, 0);
    const pagesPerSession = totalPages / sessionCount;
    
    // Calculate average session duration
    let totalDuration = 0;
    sessionsMap.forEach(s => {
      totalDuration += new Date(s.last).getTime() - new Date(s.first).getTime();
    });
    const avgSessionDuration = (totalDuration / sessionCount) / 1000; // in seconds
    
    return {
      tiers,
      avgScrollDepth,
      avgTimeOnPage,
      avgEngagedTime,
      avgClicksPerPage: avgClicks,
      avgScore,
      pagesPerSession,
      avgSessionDuration
    };
  } catch (error) {
    console.error('[Engagement Metrics Error]:', error);
    return null;
  }
}

async function getFeatureAdoption(startDate, endDate) {
  try {
    const { data } = await supabaseAdmin
      .from('feature_usage')
      .select('feature_key, user_id')
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    // Include all users for consistent counts
    const allData = data || [];
    
    // Aggregate by feature
    const featureMap = new Map();
    allData.forEach(row => {
      const count = featureMap.get(row.feature_key) || 0;
      featureMap.set(row.feature_key, count + 1);
    });
    
    // Convert to array and sort
    const features = Array.from(featureMap.entries())
      .map(([feature_key, usage_count]) => ({ feature_key, usage_count }))
      .sort((a, b) => b.usage_count - a.usage_count);
    
    return features;
  } catch (error) {
    console.error('[Feature Adoption Error]:', error);
    return [];
  }
}

async function getLifecycleDistribution() {
  try {
    const { data } = await supabaseAdmin
      .from('user_lifecycle_status')
      .select('user_id, current_status');
    
    // Include all users for consistent counts
    const allData = data || [];
    
    const lifecycle = { new: 0, active: 0, at_risk: 0, churned: 0 };
    allData.forEach(row => {
      if (row.current_status && lifecycle[row.current_status] !== undefined) {
        lifecycle[row.current_status]++;
      }
    });
    
    return lifecycle;
  } catch (error) {
    console.error('[Lifecycle Distribution Error]:', error);
    return null;
  }
}

async function getGoalCompletions(startDate, endDate) {
  try {
    // Get goals with completions
    const { data: goals } = await supabaseAdmin
      .from('analytics_goals')
      .select('id, goal_key, goal_name')
      .eq('is_active', true);
    
    if (!goals || goals.length === 0) return [];
    
    // Get completions for each goal
    const goalResults = await Promise.all(
      goals.map(async (goal) => {
        const { data: completions } = await supabaseAdmin
          .from('goal_completions')
          .select('value_cents')
          .eq('goal_id', goal.id)
          .gte('created_at', startDate)
          .lte('created_at', endDate);
        
        const count = completions?.length || 0;
        const totalValue = completions?.reduce((sum, c) => sum + (c.value_cents || 0), 0) || 0;
        
        // Get visitor count for conversion rate
        const { count: visitorCount } = await supabaseAdmin
          .from('page_views')
          .select('session_id', { count: 'exact', head: true })
          .gte('created_at', startDate)
          .lte('created_at', endDate);
        
        return {
          goal_key: goal.goal_key,
          goal_name: goal.goal_name,
          completions: count,
          conversion_rate: visitorCount > 0 ? (count / visitorCount) * 100 : 0,
          total_value_cents: totalValue
        };
      })
    );
    
    return goalResults.sort((a, b) => b.completions - a.completions);
  } catch (error) {
    console.error('[Goal Completions Error]:', error);
    return [];
  }
}

async function getSearchAnalytics(startDate, endDate) {
  try {
    const { data } = await supabaseAdmin
      .from('search_analytics')
      .select('search_query, results_count, clicked_result_position')
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    // Aggregate searches
    const searchMap = new Map();
    data?.forEach(row => {
      const query = row.search_query?.toLowerCase().trim();
      if (!query) return;
      
      if (!searchMap.has(query)) {
        searchMap.set(query, { count: 0, clicks: 0, totalResults: 0 });
      }
      const stats = searchMap.get(query);
      stats.count++;
      if (row.clicked_result_position) stats.clicks++;
      stats.totalResults += row.results_count || 0;
    });
    
    // Convert to array
    const searches = Array.from(searchMap.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        click_rate: stats.count > 0 ? stats.clicks / stats.count : 0,
        avg_results: stats.count > 0 ? stats.totalResults / stats.count : 0
      }))
      .sort((a, b) => b.count - a.count);
    
    return searches;
  } catch (error) {
    console.error('[Search Analytics Error]:', error);
    return [];
  }
}

async function getActiveUserCounts() {
  try {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Fetch user IDs (include all users for consistent counts)
    const [dailyData, weeklyData, monthlyData] = await Promise.all([
      supabaseAdmin
        .from('page_views')
        .select('user_id, path')
        .not('user_id', 'is', null)
        .gte('created_at', dayAgo.toISOString()),
      supabaseAdmin
        .from('page_views')
        .select('user_id, path')
        .not('user_id', 'is', null)
        .gte('created_at', weekAgo.toISOString()),
      supabaseAdmin
        .from('page_views')
        .select('user_id, path')
        .not('user_id', 'is', null)
        .gte('created_at', monthAgo.toISOString())
    ]);
    
    // Filter internal paths only (include all users), get unique user counts
    const filterAndCount = (data) => {
      const filtered = (data?.data || []).filter(pv => {
        if (EXCLUDED_PATHS.some(excluded => pv.path?.startsWith(excluded))) return false;
        return true;
      });
      return new Set(filtered.map(pv => pv.user_id)).size;
    };
    
    return {
      daily: filterAndCount(dailyData),
      weekly: filterAndCount(weeklyData),
      monthly: filterAndCount(monthlyData)
    };
  } catch (error) {
    console.error('[Active Users Error]:', error);
    return { daily: 0, weekly: 0, monthly: 0 };
  }
}

async function getUserHealth() {
  try {
    const { data } = await supabaseAdmin
      .from('user_lifecycle_status')
      .select('user_id, engagement_score, current_status');
    
    // Include all users for consistent counts
    const allData = data || [];
    
    const total = allData.length || 1;
    const avgScore = allData.reduce((sum, u) => sum + (u.engagement_score || 0), 0) / total;
    const atRiskCount = allData.filter(u => u.current_status === 'at_risk').length;
    const churnedCount = allData.filter(u => u.current_status === 'churned').length;
    
    return {
      avgScore,
      atRiskCount,
      churnedCount,
      totalUsers: total
    };
  } catch (error) {
    console.error('[User Health Error]:', error);
    return null;
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/advanced-analytics', feature: 'admin' });
