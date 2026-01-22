/**
 * Community Leaderboard API
 * 
 * GET /api/community/leaderboard - Get monthly points leaderboard
 * 
 * Returns top users by points earned in the current month
 * to drive engagement and friendly competition.
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
 * Get monthly points leaderboard
 * 
 * Query params:
 * - limit: max users to return (default 20, max 50)
 */
async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  
  const monthStart = getMonthStart();
  
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
      month: getCurrentMonthName(),
      monthStart,
      currentUserRank: null,
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

  // Step 4: Build final leaderboard
  const finalLeaderboard = (profiles || [])
    .filter(p => p.display_name) // Only users with display names
    .map(profile => ({
      userId: profile.id,
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
      selectedTitle: profile.selected_title,
      totalPoints: profile.total_points || 0,
      monthlyPoints: pointsMap.get(profile.id) || 0,
    }))
    .filter(u => u.monthlyPoints > 0)
    .sort((a, b) => b.monthlyPoints - a.monthlyPoints)
    .slice(0, limit)
    .map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

  // Step 5: Get current user's rank if authenticated
  let currentUserRank = null;
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
        const userMonthlyPoints = pointsMap.get(user.id) || 0;
        if (userMonthlyPoints > 0) {
          // Count how many users have more points
          const usersAbove = Array.from(pointsMap.entries())
            .filter(([_, points]) => points > userMonthlyPoints).length;
          currentUserRank = {
            rank: usersAbove + 1,
            monthlyPoints: userMonthlyPoints,
          };
        }
      }
    }
  } catch (authError) {
    // Ignore auth errors - user just won't see their rank
    console.warn('[Leaderboard API] Auth check failed:', authError.message);
  }

  return NextResponse.json({
    leaderboard: finalLeaderboard,
    month: getCurrentMonthName(),
    monthStart,
    currentUserRank,
  });
}

// Export wrapped handler with error logging
export const GET = withErrorLogging(handleGet, { route: 'community/leaderboard', feature: 'gamification' });
