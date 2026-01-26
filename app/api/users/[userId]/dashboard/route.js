/**
 * Dashboard API Route
 * 
 * GET /api/users/:userId/dashboard
 *   - Returns streak, achievements, weekly engagement, total points
 * 
 * POST /api/users/:userId/dashboard
 *   - Various actions: update-title, etc.
 * 
 * Auth: User must be authenticated and can only access their own dashboard
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { errors } from '@/lib/apiErrors';
import { 
  getUserDashboardData, 
  syncWeeklyEngagement,
  updateUserTitle,
} from '@/lib/dashboardScoreService';
import { getUserPoints, getWeeklyPoints, getMonthlyPoints, checkStreakBonus } from '@/lib/pointsService';
import { rateLimit } from '@/lib/rateLimit';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';

// Initialize Supabase client for internal operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Get user streak data
 */
async function getUserStreak(userId) {
  if (!supabase) return { currentStreak: 0, longestStreak: 0, isActiveThisWeek: false };
  
  try {
    // First update the streak (ensures it's current)
    await supabase.rpc('update_user_streak', { p_user_id: userId });
    
    // Then get the streak data
    const { data, error } = await supabase.rpc('get_user_streak', { p_user_id: userId });
    
    if (error || !data || data.length === 0) {
      console.error('[Dashboard API] Error fetching streak:', error);
      return { currentStreak: 0, longestStreak: 0, isActiveThisWeek: false };
    }
    
    const row = data[0];
    return {
      currentStreak: row.current_streak || 0,
      longestStreak: row.longest_streak || 0,
      lastActiveWeek: row.last_active_week,
      isActiveThisWeek: row.is_active_this_week || false,
    };
  } catch (err) {
    console.error('[Dashboard API] Error fetching streak:', err);
    return { currentStreak: 0, longestStreak: 0, isActiveThisWeek: false };
  }
}

/**
 * GET /api/users/:userId/dashboard
 */
async function handleGet(request, { params }) {
  // Rate limit - api preset (60 req/min)
  const limited = rateLimit(request, 'api');
  if (limited) return limited;

  const startTime = Date.now();
  const { userId } = await params;

  if (!userId) {
    return errors.missingField('userId');
  }

  // Get authenticated user
  const bearerToken = getBearerToken(request);
  const authSupabase = bearerToken 
    ? createAuthenticatedClient(bearerToken) 
    : await createServerSupabaseClient();

  if (!authSupabase) {
    return errors.serviceUnavailable('Authentication service');
  }

  const { data: { user }, error: authError } = bearerToken
    ? await authSupabase.auth.getUser(bearerToken)
    : await authSupabase.auth.getUser();
  
  if (authError || !user) {
    return errors.unauthorized();
  }
  
  // Verify the authenticated user matches the userId param
  if (user.id !== userId) {
    return errors.forbidden('Not authorized to view this user\'s dashboard');
  }

  // Sync weekly engagement first
  try {
    await syncWeeklyEngagement(userId);
  } catch (syncError) {
    console.warn('[Dashboard API] Sync warning (non-fatal):', syncError.message);
  }

  // Fetch all data in parallel
  const [streak, dashboardData, totalPoints, weeklyPoints, monthlyPoints] = await Promise.all([
    getUserStreak(userId),
    getUserDashboardData(userId),
    getUserPoints(userId),
    getWeeklyPoints(userId),
    getMonthlyPoints(userId),
  ]);

  // Check and award streak bonuses (non-blocking, but we want to know if awarded)
  let streakBonusAwarded = null;
  if (streak?.currentStreak >= 2) {
    try {
      const bonusResult = await checkStreakBonus(userId, streak.currentStreak);
      if (bonusResult.awarded) {
        streakBonusAwarded = bonusResult;
      }
    } catch (e) {
      console.warn('[Dashboard API] Streak bonus check failed:', e.message);
    }
  }

  // Combine data - streak + points are the focus
  const combinedData = {
    streak,
    points: {
      weekly: weeklyPoints,
      monthly: monthlyPoints,
      lifetime: totalPoints,
    },
    streakBonusAwarded,
    engagement: dashboardData.engagement,
    dailyActivity: dashboardData.dailyActivity,
    monthlyActivity: dashboardData.monthlyActivity,
    yearlyActivity: dashboardData.yearlyActivity,
    achievements: dashboardData.achievements,
    profile: dashboardData.profile,
    completion: dashboardData.completion,
  };

  return NextResponse.json({
    success: true,
    data: combinedData,
    meta: {
      requestTime: Date.now() - startTime,
    },
  });
}

/**
 * POST /api/users/:userId/dashboard
 */
async function handlePost(request, { params }) {
  // Rate limit - api preset (60 req/min)
  const limited = rateLimit(request, 'api');
  if (limited) return limited;

  const startTime = Date.now();
  const { userId } = await params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'refresh';

  if (!userId) {
    return errors.missingField('userId');
  }

  // Get authenticated user
  const bearerToken = getBearerToken(request);
  const authSupabase = bearerToken 
    ? createAuthenticatedClient(bearerToken) 
    : await createServerSupabaseClient();

  if (!authSupabase) {
    return errors.serviceUnavailable('Authentication service');
  }

  const { data: { user }, error: authError } = bearerToken
    ? await authSupabase.auth.getUser(bearerToken)
    : await authSupabase.auth.getUser();
  
  if (authError || !user) {
    return errors.unauthorized();
  }
  
  // Verify the authenticated user matches the userId param
  if (user.id !== userId) {
    return errors.forbidden('Not authorized to modify this user\'s dashboard');
  }

  let result;

  switch (action) {
    case 'update-title':
      const title = searchParams.get('title');
      const success = await updateUserTitle(userId, title);
      result = { success, title, message: success ? 'Title updated' : 'Failed to update title' };
      break;

    case 'refresh':
      // Just sync and return fresh data
      await syncWeeklyEngagement(userId);
      const [refreshStreak, refreshDashboardData, refreshTotalPoints, refreshWeeklyPoints, refreshMonthlyPoints] = await Promise.all([
        getUserStreak(userId),
        getUserDashboardData(userId),
        getUserPoints(userId),
        getWeeklyPoints(userId),
        getMonthlyPoints(userId),
      ]);
      result = {
        streak: refreshStreak,
        points: {
          weekly: refreshWeeklyPoints,
          monthly: refreshMonthlyPoints,
          lifetime: refreshTotalPoints,
        },
        engagement: refreshDashboardData.engagement,
        dailyActivity: refreshDashboardData.dailyActivity,
        monthlyActivity: refreshDashboardData.monthlyActivity,
        yearlyActivity: refreshDashboardData.yearlyActivity,
        achievements: refreshDashboardData.achievements,
        profile: refreshDashboardData.profile,
        completion: refreshDashboardData.completion,
      };
      break;

    default:
      return errors.badRequest(`Unknown action: ${action}`);
  }

  return NextResponse.json({
    success: true,
    action,
    data: result,
    meta: {
      requestTime: Date.now() - startTime,
    },
  });
}

export const GET = withErrorLogging(handleGet, { route: 'users/dashboard', feature: 'dashboard' });
export const POST = withErrorLogging(handlePost, { route: 'users/dashboard', feature: 'dashboard' });
