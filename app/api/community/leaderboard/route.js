/**
 * Community Leaderboard API
 * 
 * GET /api/community/leaderboard - Get points leaderboard
 * 
 * Returns top users by points earned. Supports both monthly and all-time views.
 * 
 * @route /api/community/leaderboard
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { errors } from '@/lib/apiErrors';
import { createServerSupabaseClient, getBearerToken, createAuthenticatedClient } from '@/lib/supabaseServer';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get the start of the current month in ISO format
 */
function getMonthStart() {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return monthStart.toISOString();
}

/**
 * Get the month name for display
 */
function getCurrentMonthName() {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * GET /api/community/leaderboard
 * Get points leaderboard
 * 
 * Query params:
 * - limit: max users to return (default 20, max 50)
 * - offset: pagination offset (default 0)
 * - period: 'monthly' (default) or 'all-time'
 */
async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = parseInt(searchParams.get('offset') || '0');
  const period = searchParams.get('period') || 'monthly';
  
  const isAllTime = period === 'all-time';
  const monthStart = getMonthStart();

  // For all-time, we can use the pre-aggregated total_points from user_profiles
  if (isAllTime) {
    return handleAllTimeLeaderboard(request, limit, offset);
  }

  // Monthly leaderboard - aggregate from history
  // Step 1: Get all points earned this month
  const { data: pointsData, error: pointsError } = await supabaseAdmin
    .from('user_points_history')
    .select('user_id, points')
    .gte('created_at', monthStart);

  if (pointsError) {
    console.error('[Leaderboard API] Points query error:', pointsError);
    return errors.database('Failed to fetch points data');
  }

  // Step 2: Aggregate points by user
  const pointsMap = new Map();
  for (const row of pointsData || []) {
    const current = pointsMap.get(row.user_id) || 0;
    pointsMap.set(row.user_id, current + (row.points || 0));
  }

  // If no points this month, return empty leaderboard
  const userIds = Array.from(pointsMap.keys());
  if (userIds.length === 0) {
    return NextResponse.json({
      leaderboard: [],
      period: 'monthly',
      periodLabel: getCurrentMonthName(),
      currentUserRank: null,
      hasMore: false,
      total: 0,
    });
  }

  // Step 3: Get user profiles for users with points
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, display_name, avatar_url, selected_title, total_points')
    .in('id', userIds);

  if (profileError) {
    console.error('[Leaderboard API] Profile query error:', profileError);
    return errors.database('Failed to fetch user profiles');
  }

  // Step 4: Build complete sorted list then paginate
  const allUsers = (profiles || [])
    .filter(p => p.display_name) // Only users with display names
    .map(profile => ({
      userId: profile.id,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      selectedTitle: profile.selected_title,
      totalPoints: profile.total_points || 0,
      points: pointsMap.get(profile.id) || 0,
    }))
    .filter(u => u.points > 0)
    .sort((a, b) => b.points - a.points);
  
  const total = allUsers.length;
  
  // Apply pagination with correct rank numbers
  const finalLeaderboard = allUsers
    .slice(offset, offset + limit)
    .map((user, index) => ({
      ...user,
      rank: offset + index + 1, // Rank considers offset
    }));

  // Step 5: Get current user's rank if authenticated
  const currentUserRank = await getCurrentUserRank(request, pointsMap, 'monthly');

  return NextResponse.json({
    leaderboard: finalLeaderboard,
    period: 'monthly',
    periodLabel: getCurrentMonthName(),
    currentUserRank,
    hasMore: offset + limit < total,
    total,
  });
}

/**
 * Handle all-time leaderboard using pre-aggregated total_points
 */
async function handleAllTimeLeaderboard(request, limit, offset) {
  // Get total count first
  const { count: total } = await supabaseAdmin
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .gt('total_points', 0)
    .not('display_name', 'is', null);

  // Get paginated users with points, sorted by total_points
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, display_name, avatar_url, selected_title, total_points')
    .gt('total_points', 0)
    .not('display_name', 'is', null)
    .order('total_points', { ascending: false })
    .range(offset, offset + limit - 1);

  if (profileError) {
    console.error('[Leaderboard API] All-time profile query error:', profileError);
    return errors.database('Failed to fetch user profiles');
  }

  // Build leaderboard with correct rank numbers
  const finalLeaderboard = (profiles || []).map((profile, index) => ({
    userId: profile.id,
    displayName: profile.display_name,
    avatarUrl: profile.avatar_url,
    selectedTitle: profile.selected_title,
    totalPoints: profile.total_points || 0,
    points: profile.total_points || 0,
    rank: offset + index + 1, // Rank considers offset
  }));

  // Build points map for current user rank calculation
  const pointsMap = new Map();
  
  // Get all users' total points for accurate ranking
  const { data: allPoints } = await supabaseAdmin
    .from('user_profiles')
    .select('id, total_points')
    .gt('total_points', 0);
  
  for (const row of allPoints || []) {
    pointsMap.set(row.id, row.total_points || 0);
  }

  const currentUserRank = await getCurrentUserRank(request, pointsMap, 'all-time');

  return NextResponse.json({
    leaderboard: finalLeaderboard,
    period: 'all-time',
    periodLabel: 'All Time',
    currentUserRank,
    hasMore: offset + limit < (total || 0),
    total: total || 0,
  });
}

/**
 * Get current user's rank from the points map
 */
async function getCurrentUserRank(request, pointsMap, period) {
  try {
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken 
      ? createAuthenticatedClient(bearerToken) 
      : await createServerSupabaseClient();

    if (supabase) {
      const { data: { user } } = bearerToken
        ? await supabase.auth.getUser(bearerToken)
        : await supabase.auth.getUser();

      if (user) {
        const userPoints = pointsMap.get(user.id) || 0;
        if (userPoints > 0) {
          // Count how many users have more points
          const usersAbove = Array.from(pointsMap.entries())
            .filter(([_, points]) => points > userPoints).length;
          return {
            rank: usersAbove + 1,
            points: userPoints,
          };
        }
      }
    }
  } catch (authError) {
    // Ignore auth errors - user just won't see their rank
    console.warn('[Leaderboard API] Auth check failed:', authError.message);
  }
  return null;
}

// Export wrapped handler with error logging
export const GET = withErrorLogging(handleGet, { route: 'community/leaderboard', feature: 'gamification' });
