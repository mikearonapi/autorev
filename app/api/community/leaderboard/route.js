/**
 * Community Leaderboard API
 *
 * GET /api/community/leaderboard - Get points leaderboard
 *
 * Returns top users by points earned. Supports both monthly and all-time views.
 * Uses pre-computed monthly_leaderboard table for fast, accurate results.
 *
 * @route /api/community/leaderboard
 */

// Force dynamic to prevent static prerendering (uses cookies/headers)
export const dynamic = 'force-dynamic';
// Disable fetch caching at runtime
export const fetchCache = 'force-no-store';
// Revalidate every request
export const revalidate = 0;

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { errors } from '@/lib/apiErrors';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import {
  createServerSupabaseClient,
  getBearerToken,
  createAuthenticatedClient,
} from '@/lib/supabaseServer';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get current year-month string in YYYY-MM format
 */
function getCurrentYearMonth() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get the month name for display
 */
function getCurrentMonthName() {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Standard no-cache headers for all responses
 */
const NO_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
  'Surrogate-Control': 'no-store',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

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

  // For all-time, use the pre-aggregated total_points from user_profiles
  if (isAllTime) {
    return handleAllTimeLeaderboard(request, limit, offset);
  }

  // Monthly leaderboard - use pre-computed monthly_leaderboard table
  const currentYearMonth = getCurrentYearMonth();

  // Get total count first
  const { count: total, error: countError } = await supabaseAdmin
    .from('monthly_leaderboard')
    .select('*', { count: 'exact', head: true })
    .eq('year_month', currentYearMonth)
    .gt('total_points', 0);

  if (countError) {
    console.error('[Leaderboard API] Count query error:', countError);
    return errors.database('Failed to fetch leaderboard count');
  }

  // If no data in monthly_leaderboard, return empty
  if (!total || total === 0) {
    return NextResponse.json(
      {
        leaderboard: [],
        period: 'monthly',
        periodLabel: getCurrentMonthName(),
        currentUserRank: null,
        hasMore: false,
        total: 0,
      },
      { headers: NO_CACHE_HEADERS }
    );
  }

  // Get paginated leaderboard data (sorted by points)
  const { data: leaderboardData, error: leaderboardError } = await supabaseAdmin
    .from('monthly_leaderboard')
    .select('user_id, total_points')
    .eq('year_month', currentYearMonth)
    .gt('total_points', 0)
    .order('total_points', { ascending: false })
    .range(offset, offset + limit - 1);

  if (leaderboardError) {
    console.error('[Leaderboard API] Leaderboard query error:', leaderboardError);
    return errors.database('Failed to fetch leaderboard data');
  }

  // Get user IDs from leaderboard
  const userIds = (leaderboardData || []).map((entry) => entry.user_id);

  // If no users in result, return empty
  if (userIds.length === 0) {
    return NextResponse.json(
      {
        leaderboard: [],
        period: 'monthly',
        periodLabel: getCurrentMonthName(),
        currentUserRank: null,
        hasMore: false,
        total: total || 0,
      },
      { headers: NO_CACHE_HEADERS }
    );
  }

  // Get user profiles for these users
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('id, display_name, avatar_url, selected_title, total_points')
    .in('id', userIds);

  if (profileError) {
    console.error('[Leaderboard API] Profile query error:', profileError);
    return errors.database('Failed to fetch user profiles');
  }

  // Create profile lookup map
  const profileMap = new Map();
  for (const profile of profiles || []) {
    profileMap.set(profile.id, profile);
  }

  // Build final leaderboard (maintain order from leaderboardData)
  const finalLeaderboard = (leaderboardData || [])
    .map((entry, index) => {
      const profile = profileMap.get(entry.user_id);
      // Skip users without display names
      if (!profile || !profile.display_name) return null;
      return {
        userId: entry.user_id,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        selectedTitle: profile.selected_title,
        totalPoints: profile.total_points || 0,
        points: entry.total_points,
        rank: offset + index + 1,
      };
    })
    .filter(Boolean);

  // Get current user's rank if authenticated
  const currentUserRank = await getCurrentUserRankMonthly(request, currentYearMonth);

  return NextResponse.json(
    {
      leaderboard: finalLeaderboard,
      period: 'monthly',
      periodLabel: getCurrentMonthName(),
      currentUserRank,
      hasMore: offset + limit < (total || 0),
      total: total || 0,
    },
    { headers: NO_CACHE_HEADERS }
  );
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
    rank: offset + index + 1,
  }));

  // Get current user's rank
  const currentUserRank = await getCurrentUserRankAllTime(request);

  return NextResponse.json(
    {
      leaderboard: finalLeaderboard,
      period: 'all-time',
      periodLabel: 'All Time',
      currentUserRank,
      hasMore: offset + limit < (total || 0),
      total: total || 0,
    },
    { headers: NO_CACHE_HEADERS }
  );
}

/**
 * Get current user's monthly rank from monthly_leaderboard table
 */
async function getCurrentUserRankMonthly(request, yearMonth) {
  try {
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken
      ? createAuthenticatedClient(bearerToken)
      : await createServerSupabaseClient();

    if (supabase) {
      const {
        data: { user },
      } = bearerToken ? await supabase.auth.getUser(bearerToken) : await supabase.auth.getUser();

      if (user) {
        // Get user's points for this month
        const { data: userEntry } = await supabaseAdmin
          .from('monthly_leaderboard')
          .select('total_points')
          .eq('user_id', user.id)
          .eq('year_month', yearMonth)
          .single();

        if (userEntry && userEntry.total_points > 0) {
          // Count how many users have more points this month
          const { count: usersAbove } = await supabaseAdmin
            .from('monthly_leaderboard')
            .select('*', { count: 'exact', head: true })
            .eq('year_month', yearMonth)
            .gt('total_points', userEntry.total_points);

          return {
            rank: (usersAbove || 0) + 1,
            points: userEntry.total_points,
          };
        }
      }
    }
  } catch (authError) {
    console.warn('[Leaderboard API] Auth check failed:', authError.message);
  }
  return null;
}

/**
 * Get current user's all-time rank from user_profiles
 */
async function getCurrentUserRankAllTime(request) {
  try {
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken
      ? createAuthenticatedClient(bearerToken)
      : await createServerSupabaseClient();

    if (supabase) {
      const {
        data: { user },
      } = bearerToken ? await supabase.auth.getUser(bearerToken) : await supabase.auth.getUser();

      if (user) {
        // Get user's total points
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('total_points')
          .eq('id', user.id)
          .single();

        if (profile && profile.total_points > 0) {
          // Count how many users have more points
          const { count: usersAbove } = await supabaseAdmin
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .gt('total_points', profile.total_points);

          return {
            rank: (usersAbove || 0) + 1,
            points: profile.total_points,
          };
        }
      }
    }
  } catch (authError) {
    console.warn('[Leaderboard API] Auth check failed:', authError.message);
  }
  return null;
}

// Export wrapped handler with error logging
export const GET = withErrorLogging(handleGet, {
  route: 'community/leaderboard',
  feature: 'gamification',
});
