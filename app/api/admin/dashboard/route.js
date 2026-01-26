/**
 * Admin Dashboard API
 * 
 * Provides comprehensive stats for the executive admin dashboard.
 * Supports time-range filtering: day, week, month, all
 * Only accessible to authorized admin users.
 * 
 * @route GET /api/admin/dashboard?range=week
 */

import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - NEVER cache this API route
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';

import { isAdminEmail } from '@/lib/adminAccess';
import { getTotalUsersCount, getUserTierBreakdown } from '@/lib/adminMetricsService';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getAuthUsersTotalSafe(supabase) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) return null;
    if (typeof data?.total === 'number') return data.total;
    return Array.isArray(data?.users) ? data.users.length : null;
  } catch (err) {
    // Some environments/SDK versions can throw if options are unsupported
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) return null;
      if (typeof data?.total === 'number') return data.total;
      return Array.isArray(data?.users) ? data.users.length : null;
    } catch {
      return null;
    }
  }
}

// Fixed monthly costs (from COST_ANALYSIS_PL.md)
const FIXED_COSTS = {
  supabase: { name: 'Supabase Pro', amount: 45, category: 'infrastructure' },
  vercel: { name: 'Vercel Pro', amount: 20, category: 'infrastructure' },
  domain: { name: 'Domain', amount: 1, category: 'infrastructure' },
  cursor: { name: 'Cursor Max', amount: 200, category: 'development' },
  claude: { name: 'Claude Pro', amount: 100, category: 'development' },
};

const R_AND_D_MONTHLY = 300; // Cursor + Claude dev tools

// Get date range based on period
function getDateRange(range) {
  const now = new Date();
  let startDate;
  let previousStartDate;
  let previousEndDate;
  
  switch (range) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - 1);
      previousEndDate = new Date(startDate);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - 7);
      previousEndDate = new Date(startDate);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - 30);
      previousEndDate = new Date(startDate);
      break;
    case 'all':
    default:
      startDate = new Date('2024-01-01');
      previousStartDate = null;
      previousEndDate = null;
      break;
  }
  
  return {
    start: startDate.toISOString(),
    end: now.toISOString(),
    previousStart: previousStartDate?.toISOString() || null,
    previousEnd: previousEndDate?.toISOString() || null,
  };
}

// Calculate variable costs based on usage
function estimateVariableCosts(stats) {
  const alConversations = stats.engagement?.alConversations || 0;
  const avgTokensPerChat = 2000;
  const inputCostPerMillion = 3;
  const outputCostPerMillion = 15;
  
  const estimatedInputTokens = alConversations * avgTokensPerChat * 0.7;
  const estimatedOutputTokens = alConversations * avgTokensPerChat * 0.3;
  
  const anthropicCost = (
    (estimatedInputTokens / 1_000_000) * inputCostPerMillion +
    (estimatedOutputTokens / 1_000_000) * outputCostPerMillion
  );
  
  return {
    anthropic: { name: 'Anthropic API', amount: Math.round(anthropicCost * 100) / 100, category: 'ai' },
    openai: { name: 'OpenAI Embeddings', amount: 2, category: 'ai' },
    vercelOverages: { name: 'Vercel Overages', amount: 0, category: 'infrastructure' },
  };
}

// Generate daily data points for sparklines
function generateDailyData(records, dateField, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  
  // Create a map of date -> count
  const countByDate = {};
  records.forEach(record => {
    const date = new Date(record[dateField]).toISOString().split('T')[0];
    countByDate[date] = (countByDate[date] || 0) + 1;
  });
  
  // Generate array for each day
  const result = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    result.push({
      date: dateStr,
      count: countByDate[dateStr] || 0,
    });
  }
  
  return result;
}

// Generate cumulative data for growth chart
function generateCumulativeData(records, dateField) {
  if (!records || records.length === 0) return [];
  
  // Sort by date
  const sorted = [...records].sort((a, b) => 
    new Date(a[dateField]) - new Date(b[dateField])
  );
  
  // Group by date and calculate cumulative
  const byDate = {};
  sorted.forEach(record => {
    const date = new Date(record[dateField]).toISOString().split('T')[0];
    byDate[date] = (byDate[date] || 0) + 1;
  });
  
  const result = [];
  let cumulative = 0;
  Object.entries(byDate).sort().forEach(([date, count]) => {
    cumulative += count;
    result.push({ date, count: cumulative });
  });
  
  return result;
}

async function handleGet(request) {
  // Get time range from query params
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'week';
  
  // Verify admin access
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const dateRange = getDateRange(range);
    
    // Fetch all data in parallel
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const [
      allUsersResult,
      periodUsersResult,
      previousPeriodUsersResult,
      alConversationsResult,
      previousAlConversationsResult,
      alBalancesResult,
      approvedEventsResult,
      carsResult,
      partsResult,
      youtubeResult,
      activeInsightsResult,
      chunksResult,
      errorsResult,
      feedbackResult,
      pendingEventsResult,
      upcomingEventsResult,
      weeklyActiveUsersResult,
    ] = await Promise.all([
      // Users for charts (created_at used for cumulative growth). Do NOT use data.length for totals.
      supabase.from('user_profiles').select('id, subscription_tier, created_at'),
      
      // Users created in current period
      supabase.from('user_profiles')
        .select('id, subscription_tier, created_at')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end),
      
      // Users created in previous period (for comparison)
      dateRange.previousStart ? supabase.from('user_profiles')
        .select('id, created_at')
        .gte('created_at', dateRange.previousStart)
        .lte('created_at', dateRange.previousEnd) : Promise.resolve({ data: [] }),
      
      // AL conversations in current period
      supabase.from('al_conversations')
        .select('id, user_id, created_at')
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end),
      
      // AL conversations in previous period
      dateRange.previousStart ? supabase.from('al_conversations')
        .select('id, created_at')
        .gte('created_at', dateRange.previousStart)
        .lte('created_at', dateRange.previousEnd) : Promise.resolve({ data: [] }),
      
      // AL credit balances
      supabase.from('al_credit_balances').select('id, user_id, balance, lifetime_earned, lifetime_spent, last_activity_at, created_at'),
      
      // Events - use count queries instead of fetching all rows (can be 7000+)
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      
      // Cars (with image and embedding coverage)
      supabase.from('cars').select('id, image_hero_url, embedding'),
      
      // Parts
      supabase.from('parts').select('id, category'),
      
      // YouTube videos (with status)
      supabase.from('youtube_videos').select('id, processing_status'),
      
      // Community insights - use count query
      supabase.from('community_insights').select('id', { count: 'exact', head: true }).eq('is_active', true),
      
      // Document chunks
      supabase.from('document_chunks').select('id', { count: 'exact', head: true }),
      
      // Errors (last 7 days regardless of range)
      supabase.from('error_logs')
        .select('id, severity, created_at', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Feedback (last 30 days)
      supabase.from('user_feedback')
        .select('id, category, rating, created_at', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Pending event submissions
      supabase.from('events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      
      // Upcoming events (approved + future date)
      supabase.from('events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved')
        .gt('start_date', new Date().toISOString()),
      
      // Weekly active users (from user_activity table - true WAU)
      supabase.from('user_activity')
        .select('user_id')
        .gte('created_at', weekAgo),
    ]);
    
    // Process user data (include ALL users for consistent counts across dashboard)
    const allUsers = allUsersResult.data || [];
    const periodUsers = periodUsersResult.data || [];
    const previousPeriodUsers = previousPeriodUsersResult.data || [];

    // Single source of truth for totals: exact DB counts (head:true) to avoid row-cap / partial result issues.
    const [totalUsers, usersByTier] = await Promise.all([
      getTotalUsersCount(supabase),
      getUserTierBreakdown(supabase),
    ]);
    
    // Calculate growth percentage
    const newThisPeriod = periodUsers.length;
    const newPreviousPeriod = previousPeriodUsers.length;
    const growthPercent = newPreviousPeriod > 0 
      ? Math.round(((newThisPeriod - newPreviousPeriod) / newPreviousPeriod) * 100)
      : (newThisPeriod > 0 ? 100 : 0);
    
    // Generate daily signup data for sparkline
    const usersByDay = generateDailyData(periodUsers, 'created_at', dateRange.start, dateRange.end);
    
    // Generate cumulative growth data for chart
    const cumulativeGrowth = generateCumulativeData(allUsers, 'created_at');
    
    // Process AL engagement data (include ALL users for consistent counts)
    const alConversations = alConversationsResult.data || [];
    const previousAlConversations = previousAlConversationsResult.data || [];
    const alBalances = alBalancesResult.data || [];
    
    // Unique users with AL conversations
    const alUserIds = new Set(alConversations.map(c => c.user_id));
    const alUsers = alUserIds.size;
    
    // Weekly active users (from user_activity table - true WAU)
    const weeklyActivityData = weeklyActiveUsersResult.data || [];
    const weeklyActiveUserIds = new Set(weeklyActivityData.map(a => a.user_id));
    const weeklyActiveUsers = weeklyActiveUserIds.size;
    const wauPercent = totalUsers > 0 
      ? Math.round((weeklyActiveUsers / totalUsers) * 100)
      : 0;
    
    // Conversations per user
    const conversationsPerUser = alUsers > 0 
      ? Math.round((alConversations.length / alUsers) * 10) / 10
      : 0;
    
    // AL engagement change
    const engagementChange = previousAlConversations.length > 0
      ? Math.round(((alConversations.length - previousAlConversations.length) / previousAlConversations.length) * 100)
      : (alConversations.length > 0 ? 100 : 0);
    
    // Generate daily conversation data for sparkline
    const conversationsByDay = generateDailyData(alConversations, 'created_at', dateRange.start, dateRange.end);
    
    // Calculate funnel
    const funnel = {
      signups: totalUsers,
      activeUsers: weeklyActiveUsers,
      alUsers,
      conversionRates: {
        signupToActive: totalUsers > 0 ? Math.round((weeklyActiveUsers / totalUsers) * 100) : 0,
        activeToAL: weeklyActiveUsers > 0 ? Math.round((alUsers / weeklyActiveUsers) * 100) : 0,
      },
    };
    
    // Build stats object for cost calculation
    const statsForCosts = {
      engagement: { alConversations: alConversations.length },
    };
    
    // Calculate costs
    const variableCosts = estimateVariableCosts(statsForCosts);
    const fixedTotal = Object.values(FIXED_COSTS).reduce((sum, c) => sum + c.amount, 0);
    const variableTotal = Object.values(variableCosts).reduce((sum, c) => sum + c.amount, 0);
    const totalMonthly = fixedTotal + variableTotal;
    
    // Break-even calculation
    const avgRevenuePerUser = 7.5; // Blended average
    const conversionRate = 0.1; // 10%
    const usersNeeded = Math.ceil(totalMonthly / (avgRevenuePerUser * conversionRate));
    const breakEvenProgress = Math.min(Math.round((totalUsers / usersNeeded) * 100), 100);
    
    // System health - check actual status
    // Database: Check if we got data successfully (we reached this point, so DB is working)
    const databaseStatus = allUsers.length >= 0 ? 'healthy' : 'degraded';
    
    // Cron: Check scrape_jobs for recent activity
    const recentJobsCheck = await supabase
      .from('scrape_jobs')
      .select('completed_at')
      .order('completed_at', { ascending: false })
      .limit(1);
    
    const lastCronRun = recentJobsCheck.data?.[0]?.completed_at || null;
    const hoursSinceLastCron = lastCronRun 
      ? (Date.now() - new Date(lastCronRun).getTime()) / (1000 * 60 * 60) 
      : 999;
    
    const cronStatus = hoursSinceLastCron < 24 ? 'healthy' : 
                       hoursSinceLastCron < 72 ? 'degraded' : 'down';
    
    // API: If we're returning this response, API is working
    const apiStatus = 'healthy';
    
    const system = {
      database: databaseStatus,
      api: apiStatus,
      cron: cronStatus,
      lastCronRun: lastCronRun || 'Never',
    };
    
    // Build alerts
    const alerts = [];
    
    // Check for pending events
    const pendingEventsCount = pendingEventsResult.count || 0;
    if (pendingEventsCount > 0) {
      alerts.push({
        type: 'info',
        message: `${pendingEventsCount} event${pendingEventsCount > 1 ? 's' : ''} pending approval`,
        action: 'Review',
        href: '/internal/events',
      });
    }
    
    // Check for errors
    const errorCount = errorsResult.count || 0;
    if (errorCount > 10) {
      alerts.push({
        type: 'warning',
        message: `${errorCount} errors in the last 7 days`,
        action: 'View Errors',
        href: '/internal/errors',
      });
    }
    
    // Check for feedback
    const feedbackCount = feedbackResult.count || 0;
    if (feedbackCount > 0) {
      alerts.push({
        type: 'info',
        message: `${feedbackCount} feedback submissions this month`,
        action: 'Review',
        href: '/internal/feedback',
      });
    }
    
    // Build response
    const response = {
      timeRange: range,
      
      users: {
        total: totalUsers,
        newThisPeriod,
        growthPercent,
        byDay: usersByDay,
        byTier: usersByTier,
        cumulativeGrowth,
      },
      
      engagement: {
        weeklyActiveUsers,
        wauPercent,
        alConversations: alConversations.length,
        conversationsPerUser,
        engagementChange,
        alUsers,
        byDay: conversationsByDay,
      },
      
      funnel,
      
      costs: {
        fixed: FIXED_COSTS,
        variable: variableCosts,
        rAndD: R_AND_D_MONTHLY,
        totalMonthly,
        fixedTotal,
        variableTotal,
      },
      
      breakEven: {
        currentUsers: totalUsers,
        usersNeeded,
        progressPercent: breakEvenProgress,
      },
      
      system,
      
      content: {
        // Vehicle data (small dataset, can use .data)
        vehicles: carsResult.data?.length || 0,
        vehiclesWithImages: carsResult.data?.filter(c => c.image_hero_url).length || 0,
        vehiclesWithEmbeddings: carsResult.data?.filter(c => c.embedding).length || 0,
        
        // Events data (large dataset, use count)
        events: approvedEventsResult.count || 0,
        upcomingEvents: upcomingEventsResult.count || 0,
        
        // Video data (can be large, filter safely)
        videos: youtubeResult.data?.filter(v => v.processing_status === 'processed').length || 0,
        pendingVideos: youtubeResult.data?.filter(v => v.processing_status === 'pending').length || 0,
        
        // Parts data (can be large)
        parts: partsResult.data?.length || 0,
        partsWithFitment: partsResult.data?.filter(p => p.category).length || 0,
        
        // Other content (large, use count)
        insights: activeInsightsResult.count || 0,
        kbChunks: chunksResult.count || 0,
        forumThreads: 0, // Future: add forum table
      },
      
      alerts,
      
      timestamp: new Date().toISOString(),
    };
    
    // Add debug timestamp to verify fresh data
    response._debug = {
      timestamp: new Date().toISOString(),
      totalUsersFromQuery: allUsers.length,
      source: 'user_profiles direct query'
    };

    // Return with aggressive cache-control to prevent ALL caching
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'CDN-Cache-Control': 'no-store'
      },
    });
    
  } catch (err) {
    console.error('[Admin Dashboard] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/dashboard', feature: 'internal' });
