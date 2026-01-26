/**
 * Dashboard Score Service
 * 
 * Manages all dashboard-related scoring including:
 * - Completion scores (garage, data)
 * - Weekly engagement tracking
 * - Streak management
 * - Achievement records
 * 
 * @example
 * import { getUserDashboardData, trackActivity } from '@/lib/dashboardScoreService';
 * 
 * // Get all dashboard data
 * const dashboard = await getUserDashboardData(userId);
 * 
 * // Track an activity
 * await trackActivity(userId, 'al_messages');
 */

import { supabaseServiceRole as supabase } from './supabase';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Weekly engagement activity types and their point values
 */
export const ENGAGEMENT_ACTIVITIES = {
  al_conversations: { points: 5, maxWeekly: 25, label: 'AL Conversations' },
  al_messages: { points: 1, maxWeekly: 20, label: 'AL Messages' },
  community_posts: { points: 10, maxWeekly: 30, label: 'Community Posts' },
  community_comments: { points: 3, maxWeekly: 15, label: 'Comments' },
  community_likes_given: { points: 1, maxWeekly: 10, label: 'Likes Given' },
  track_sessions_logged: { points: 15, maxWeekly: 30, label: 'Track Sessions' },
};

/**
 * Achievement types
 */
export const ACHIEVEMENT_TYPES = {
  best_hp: { label: 'Best HP', icon: '⚡', unit: 'HP' },
  best_lap_time: { label: 'Best Lap', icon: '🏁', unit: '' },
  most_mods: { label: 'Most Mods', icon: '🔧', unit: 'mods' },
  vehicle_count: { label: 'Garage Size', icon: '🚗', unit: 'vehicles' },
  longest_streak: { label: 'Longest Streak', icon: '🔥', unit: 'weeks' },
};

// =============================================================================
// MAIN DASHBOARD DATA
// =============================================================================

/**
 * Get all dashboard data for a user in one call
 * 
 * @param {string} userId - UUID of the user
 * @returns {Promise<object>} Complete dashboard data
 */
export async function getUserDashboardData(userId) {
  if (!supabase) {
    console.warn('[dashboardScoreService] Supabase not configured');
    return getEmptyDashboardData();
  }

  try {
    // Fetch all data in parallel
    const [
      completionScores,
      weeklyEngagement,
      streaks,
      achievements,
      userProfile,
      dailyActivity,
      monthlyActivity,
      yearlyActivity,
    ] = await Promise.all([
      getCompletionScores(userId),
      getCurrentWeekEngagement(userId),
      getUserStreaks(userId),
      getUserAchievements(userId),
      getUserProfile(userId),
      getDailyActivityBreakdown(userId),
      getMonthlyActivityBreakdown(userId),
      getYearlyActivityBreakdown(userId),
    ]);

    // Calculate overall profile score
    const overallScore = calculateOverallScore(
      completionScores,
      weeklyEngagement,
      streaks
    );

    return {
      userId,
      overallScore,
      completion: completionScores,
      engagement: weeklyEngagement,
      dailyActivity,
      monthlyActivity,
      yearlyActivity,
      streaks,
      achievements,
      profile: userProfile,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[dashboardScoreService] Error fetching dashboard data:', error);
    return getEmptyDashboardData();
  }
}

/**
 * Get user profile data including name and titles
 * Note: Titles are refreshed during recalculate, not on every fetch
 */
export async function getUserProfile(userId, refreshTitles = false) {
  if (!supabase) return { displayName: null, selectedTitle: null, unlockedTitles: ['rookie'] };

  // Only refresh titles when explicitly requested (during recalculate)
  if (refreshTitles) {
    await supabase.rpc('check_user_titles', { p_user_id: userId }).catch(() => {});
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('display_name, selected_title, unlocked_titles')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[dashboardScoreService] Error fetching profile:', error);
    return { displayName: null, selectedTitle: null, unlockedTitles: ['rookie'] };
  }

  return {
    displayName: data?.display_name || null,
    selectedTitle: data?.selected_title || null,
    unlockedTitles: data?.unlocked_titles || ['rookie'],
  };
}

/**
 * Update user's selected title
 */
export async function updateUserTitle(userId, title) {
  if (!supabase) return false;

  const { error } = await supabase
    .from('user_profiles')
    .update({ selected_title: title })
    .eq('id', userId);

  if (error) {
    console.error('[dashboardScoreService] Error updating title:', error);
    return false;
  }

  return true;
}

/**
 * Calculate overall profile score
 */
function calculateOverallScore(completion, engagement, streaks) {
  const garageScore = completion?.garage_score || 0;
  const dataScore = completion?.data_score || 0;
  const weeklyScore = engagement?.weekly_score || 0;
  
  // Base score is average of completion + engagement
  let baseScore = Math.round((garageScore + dataScore + weeklyScore) / 3);
  
  // Streak bonus: +5% per week of streak (max +25%)
  const currentStreak = streaks?.engagement?.current_streak || 0;
  const streakBonus = Math.min(currentStreak * 5, 25);
  
  // Apply streak bonus
  const finalScore = Math.min(100, Math.round(baseScore * (1 + streakBonus / 100)));
  
  return {
    score: finalScore,
    garageScore,
    dataScore,
    weeklyScore,
    streakBonus,
  };
}

// =============================================================================
// COMPLETION SCORES
// =============================================================================

/**
 * Get completion scores (garage + data) for a user
 */
export async function getCompletionScores(userId) {
  if (!supabase) return getEmptyCompletionScores();

  // First try to get cached scores
  const { data: cached } = await supabase
    .from('user_scores')
    .select('garage_score, garage_breakdown, data_score, data_breakdown, overall_completion, updated_at')
    .eq('user_id', userId)
    .single();

  if (cached) {
    return {
      garage_score: cached.garage_score,
      garage_breakdown: cached.garage_breakdown,
      data_score: cached.data_score,
      data_breakdown: cached.data_breakdown,
      overall_completion: cached.overall_completion,
      updated_at: cached.updated_at,
    };
  }

  // If no cached scores, calculate fresh
  return await recalculateCompletionScores(userId);
}

/**
 * Recalculate and persist completion scores
 */
export async function recalculateCompletionScores(userId) {
  if (!supabase) return getEmptyCompletionScores();

  // Call the database function
  const { data, error } = await supabase
    .rpc('calculate_user_completion_scores', { p_user_id: userId });

  if (error || !data || data.length === 0) {
    console.error('[dashboardScoreService] Error calculating completion scores:', error);
    return getEmptyCompletionScores();
  }

  const result = data[0];

  // Persist to user_scores table
  await supabase
    .from('user_scores')
    .upsert({
      user_id: userId,
      garage_score: result.garage_score,
      garage_breakdown: result.garage_breakdown,
      data_score: result.data_score,
      data_breakdown: result.data_breakdown,
      overall_completion: result.overall_completion,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

  return result;
}

// =============================================================================
// WEEKLY ENGAGEMENT
// =============================================================================

/**
 * Get current week's engagement data plus last week for comparison
 */
export async function getCurrentWeekEngagement(userId) {
  if (!supabase) return getEmptyEngagement();

  const weekStart = getWeekStart();
  const lastWeekStart = getWeekStart(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  // Fetch current week and last week in parallel
  const [currentResult, lastWeekResult] = await Promise.all([
    supabase
      .from('user_weekly_engagement')
      .select('week_start, al_conversations, al_messages, community_posts, community_comments, community_likes_given, track_sessions_logged, weekly_score')
      .eq('user_id', userId)
      .eq('week_start', weekStart)
      .single(),
    supabase
      .from('user_weekly_engagement')
      .select('weekly_score')
      .eq('user_id', userId)
      .eq('week_start', lastWeekStart)
      .single(),
  ]);

  const { data, error } = currentResult;
  const lastWeekData = lastWeekResult.data;

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('[dashboardScoreService] Error fetching engagement:', error);
  }

  if (!data) {
    return {
      ...getEmptyEngagement(),
      last_week_score: lastWeekData?.weekly_score || 0,
    };
  }

  return {
    week_start: data.week_start,
    al_conversations: data.al_conversations,
    al_messages: data.al_messages,
    community_posts: data.community_posts,
    community_comments: data.community_comments,
    community_likes_given: data.community_likes_given,
    track_sessions_logged: data.track_sessions_logged,
    weekly_score: data.weekly_score,
    last_week_score: lastWeekData?.weekly_score || 0,
  };
}

/**
 * Sync weekly engagement from actual database records
 * Useful for fixing drift between tracked counts and actual activity
 * 
 * @param {string} userId - UUID of the user
 * @returns {Promise<void>}
 */
export async function syncWeeklyEngagement(userId) {
  if (!supabase) return;

  try {
    await supabase.rpc('sync_weekly_engagement', { p_user_id: userId });
  } catch (error) {
    console.error('[dashboardScoreService] Error syncing weekly engagement:', error);
  }
}

/**
 * Get daily activity breakdown for the current week
 * Returns array of 7 days (Mon-Sun) with activity totals for chart visualization
 * 
 * @param {string} userId - UUID of the user
 * @returns {Promise<Array>} Array of { al, community, data } for each day
 */
export async function getDailyActivityBreakdown(userId) {
  if (!supabase) return getEmptyDailyActivity();

  const weekStart = getWeekStart();
  const weekStartDate = new Date(weekStart + 'T00:00:00Z');
  
  // Build array of 7 dates for the week
  const dayDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStartDate);
    d.setDate(d.getDate() + i);
    dayDates.push(d.toISOString().split('T')[0]);
  }
  
  try {
    // Fetch all activity data in parallel
    const weekEnd = dayDates[6] + 'T23:59:59Z';
    const weekStartISO = weekStart + 'T00:00:00Z';
    
    const [
      alConversations,
      alMessages,
      communityPosts,
      communityComments,
      communityLikes,
      questionnaireResponses,
      vehicleModifications,
      vehiclePhotos,
    ] = await Promise.all([
      // AL conversations by day
      supabase
        .from('al_conversations')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', weekStartISO)
        .lte('created_at', weekEnd),
      // AL messages by day (via conversation join)
      supabase
        .from('al_messages')
        .select('created_at, al_conversations!inner(user_id)')
        .eq('al_conversations.user_id', userId)
        .eq('role', 'user')
        .gte('created_at', weekStartISO)
        .lte('created_at', weekEnd),
      // Community posts
      supabase
        .from('community_posts')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', weekStartISO)
        .lte('created_at', weekEnd),
      // Community comments
      supabase
        .from('community_post_comments')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', weekStartISO)
        .lte('created_at', weekEnd),
      // Community likes given
      supabase
        .from('community_post_likes')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', weekStartISO)
        .lte('created_at', weekEnd),
      // Profile questionnaire responses
      supabase
        .from('user_questionnaire_responses')
        .select('answered_at')
        .eq('user_id', userId)
        .gte('answered_at', weekStartISO)
        .lte('answered_at', weekEnd),
      // Garage - vehicle modifications (installs, plans)
      supabase
        .from('user_vehicle_modifications')
        .select('created_at, updated_at')
        .eq('user_id', userId)
        .or(`created_at.gte.${weekStartISO},updated_at.gte.${weekStartISO}`)
        .or(`created_at.lte.${weekEnd},updated_at.lte.${weekEnd}`),
      // Garage - vehicle photos
      supabase
        .from('vehicle_photos')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', weekStartISO)
        .lte('created_at', weekEnd),
    ]);

    // Helper to count items by day
    const countByDay = (items, dateField = 'created_at') => {
      const counts = {};
      for (const date of dayDates) {
        counts[date] = 0;
      }
      for (const item of (items || [])) {
        const timestamp = item?.[dateField];
        if (timestamp) {
          const day = timestamp.split('T')[0];
          if (counts[day] !== undefined) {
            counts[day]++;
          }
        }
      }
      return counts;
    };

    const alConvCounts = countByDay(alConversations.data);
    const alMsgCounts = countByDay(alMessages.data);
    const postCounts = countByDay(communityPosts.data);
    const commentCounts = countByDay(communityComments.data);
    const likeCounts = countByDay(communityLikes.data);
    const profileCounts = countByDay(questionnaireResponses.data, 'answered_at');
    const modCounts = countByDay(vehicleModifications.data);
    const photoCounts = countByDay(vehiclePhotos.data);

    // Build daily activity array with all 5 categories
    return dayDates.map(date => ({
      al: (alConvCounts[date] || 0) + (alMsgCounts[date] || 0),
      community: (postCounts[date] || 0) + (commentCounts[date] || 0) + (likeCounts[date] || 0),
      data: 0, // Dyno/track data - would need separate tracking tables
      garage: (modCounts[date] || 0) + (photoCounts[date] || 0),
      profile: profileCounts[date] || 0,
    }));
  } catch (error) {
    console.error('[dashboardScoreService] Error fetching daily activity:', error);
    return getEmptyDailyActivity();
  }
}

/**
 * Get monthly activity breakdown for the current month
 * Returns array of days (1 per day in month) with activity totals for chart visualization
 * 
 * @param {string} userId - UUID of the user
 * @returns {Promise<Array>} Array of { day, al, community, data } for each day
 */
export async function getMonthlyActivityBreakdown(userId) {
  if (!supabase) return getEmptyMonthlyActivity();

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59));
  
  // Build array of dates for the month
  const dayDates = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(Date.UTC(year, month, i));
    dayDates.push(d.toISOString().split('T')[0]);
  }
  
  try {
    const monthStartISO = monthStart.toISOString();
    const monthEndISO = monthEnd.toISOString();
    
    const [
      alConversations,
      alMessages,
      communityPosts,
      communityComments,
      communityLikes,
      questionnaireResponses,
      vehicleModifications,
      vehiclePhotos,
    ] = await Promise.all([
      supabase
        .from('al_conversations')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', monthStartISO)
        .lte('created_at', monthEndISO),
      supabase
        .from('al_messages')
        .select('created_at, al_conversations!inner(user_id)')
        .eq('al_conversations.user_id', userId)
        .eq('role', 'user')
        .gte('created_at', monthStartISO)
        .lte('created_at', monthEndISO),
      supabase
        .from('community_posts')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', monthStartISO)
        .lte('created_at', monthEndISO),
      supabase
        .from('community_post_comments')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', monthStartISO)
        .lte('created_at', monthEndISO),
      supabase
        .from('community_post_likes')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', monthStartISO)
        .lte('created_at', monthEndISO),
      // Profile questionnaire responses
      supabase
        .from('user_questionnaire_responses')
        .select('answered_at')
        .eq('user_id', userId)
        .gte('answered_at', monthStartISO)
        .lte('answered_at', monthEndISO),
      // Garage - vehicle modifications
      supabase
        .from('user_vehicle_modifications')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', monthStartISO)
        .lte('created_at', monthEndISO),
      // Garage - vehicle photos
      supabase
        .from('vehicle_photos')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', monthStartISO)
        .lte('created_at', monthEndISO),
    ]);

    // Helper to count items by day
    const countByDay = (items, dateField = 'created_at') => {
      const counts = {};
      for (const date of dayDates) {
        counts[date] = 0;
      }
      for (const item of (items || [])) {
        const timestamp = item?.[dateField];
        if (timestamp) {
          const day = timestamp.split('T')[0];
          if (counts[day] !== undefined) {
            counts[day]++;
          }
        }
      }
      return counts;
    };

    const alConvCounts = countByDay(alConversations.data);
    const alMsgCounts = countByDay(alMessages.data);
    const postCounts = countByDay(communityPosts.data);
    const commentCounts = countByDay(communityComments.data);
    const likeCounts = countByDay(communityLikes.data);
    const profileCounts = countByDay(questionnaireResponses.data, 'answered_at');
    const modCounts = countByDay(vehicleModifications.data);
    const photoCounts = countByDay(vehiclePhotos.data);

    // Build daily activity array for the month with all 5 categories
    return dayDates.map((date, idx) => ({
      day: idx + 1,
      al: (alConvCounts[date] || 0) + (alMsgCounts[date] || 0),
      community: (postCounts[date] || 0) + (commentCounts[date] || 0) + (likeCounts[date] || 0),
      data: 0,
      garage: (modCounts[date] || 0) + (photoCounts[date] || 0),
      profile: profileCounts[date] || 0,
    }));
  } catch (error) {
    console.error('[dashboardScoreService] Error fetching monthly activity:', error);
    return getEmptyMonthlyActivity();
  }
}

/**
 * Get yearly activity breakdown for the current year
 * Returns array of 12 months with activity totals for chart visualization
 * 
 * @param {string} userId - UUID of the user
 * @returns {Promise<Array>} Array of { month, al, community, data } for each month
 */
export async function getYearlyActivityBreakdown(userId) {
  if (!supabase) return getEmptyYearlyActivity();

  const now = new Date();
  const year = now.getUTCFullYear();
  
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
  
  try {
    const yearStartISO = yearStart.toISOString();
    const yearEndISO = yearEnd.toISOString();
    
    const [
      alConversations,
      alMessages,
      communityPosts,
      communityComments,
      communityLikes,
      questionnaireResponses,
      vehicleModifications,
      vehiclePhotos,
    ] = await Promise.all([
      supabase
        .from('al_conversations')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', yearStartISO)
        .lte('created_at', yearEndISO),
      supabase
        .from('al_messages')
        .select('created_at, al_conversations!inner(user_id)')
        .eq('al_conversations.user_id', userId)
        .eq('role', 'user')
        .gte('created_at', yearStartISO)
        .lte('created_at', yearEndISO),
      supabase
        .from('community_posts')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', yearStartISO)
        .lte('created_at', yearEndISO),
      supabase
        .from('community_post_comments')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', yearStartISO)
        .lte('created_at', yearEndISO),
      supabase
        .from('community_post_likes')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', yearStartISO)
        .lte('created_at', yearEndISO),
      // Profile questionnaire responses
      supabase
        .from('user_questionnaire_responses')
        .select('answered_at')
        .eq('user_id', userId)
        .gte('answered_at', yearStartISO)
        .lte('answered_at', yearEndISO),
      // Garage - vehicle modifications
      supabase
        .from('user_vehicle_modifications')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', yearStartISO)
        .lte('created_at', yearEndISO),
      // Garage - vehicle photos
      supabase
        .from('vehicle_photos')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', yearStartISO)
        .lte('created_at', yearEndISO),
    ]);

    // Helper to count items by month (0-11)
    const countByMonth = (items, dateField = 'created_at') => {
      const counts = Array(12).fill(0);
      for (const item of (items || [])) {
        const timestamp = item?.[dateField];
        if (timestamp) {
          const date = new Date(timestamp);
          const month = date.getUTCMonth();
          counts[month]++;
        }
      }
      return counts;
    };

    const alConvCounts = countByMonth(alConversations.data);
    const alMsgCounts = countByMonth(alMessages.data);
    const postCounts = countByMonth(communityPosts.data);
    const commentCounts = countByMonth(communityComments.data);
    const likeCounts = countByMonth(communityLikes.data);
    const profileCounts = countByMonth(questionnaireResponses.data, 'answered_at');
    const modCounts = countByMonth(vehicleModifications.data);
    const photoCounts = countByMonth(vehiclePhotos.data);

    // Build monthly activity array for the year with all 5 categories
    return Array(12).fill(null).map((_, idx) => ({
      month: idx + 1,
      al: (alConvCounts[idx] || 0) + (alMsgCounts[idx] || 0),
      community: (postCounts[idx] || 0) + (commentCounts[idx] || 0) + (likeCounts[idx] || 0),
      data: 0,
      garage: (modCounts[idx] || 0) + (photoCounts[idx] || 0),
      profile: profileCounts[idx] || 0,
    }));
  } catch (error) {
    console.error('[dashboardScoreService] Error fetching yearly activity:', error);
    return getEmptyYearlyActivity();
  }
}

/**
 * Track an activity and update weekly engagement
 * 
 * @param {string} userId - UUID of the user
 * @param {string} activityType - One of ENGAGEMENT_ACTIVITIES keys
 * @param {number} increment - Amount to increment (default 1)
 * @returns {Promise<number>} New weekly score
 */
export async function trackActivity(userId, activityType, increment = 1) {
  if (!supabase) return 0;

  if (!ENGAGEMENT_ACTIVITIES[activityType]) {
    console.warn(`[dashboardScoreService] Unknown activity type: ${activityType}`);
    return 0;
  }

  try {
    const { data, error } = await supabase
      .rpc('increment_weekly_activity', {
        p_user_id: userId,
        p_activity_type: activityType,
        p_increment: increment,
      });

    if (error) {
      console.error('[dashboardScoreService] Error tracking activity:', error);
      return 0;
    }

    return data || 0;
  } catch (err) {
    console.error('[dashboardScoreService] Error tracking activity:', err);
    return 0;
  }
}

// =============================================================================
// STREAKS
// =============================================================================

/**
 * Get all streaks for a user
 */
export async function getUserStreaks(userId) {
  if (!supabase) return getEmptyStreaks();

  const { data, error } = await supabase
    .from('user_streaks')
    .select('streak_type, current_streak, longest_streak, last_activity_week')
    .eq('user_id', userId);

  if (error) {
    console.error('[dashboardScoreService] Error fetching streaks:', error);
    return getEmptyStreaks();
  }

  // Convert array to object keyed by streak_type
  const streaks = {};
  for (const streak of (data || [])) {
    streaks[streak.streak_type] = {
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      last_activity_week: streak.last_activity_week,
    };
  }

  return streaks;
}

// =============================================================================
// ACHIEVEMENTS
// =============================================================================

/**
 * Get all achievements for a user
 */
export async function getUserAchievements(userId) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_type, value, display_value, vehicle_name, vehicle_id, metadata, achieved_at')
    .eq('user_id', userId)
    .order('achieved_at', { ascending: false });

  if (error) {
    console.error('[dashboardScoreService] Error fetching achievements:', error);
    return [];
  }

  return (data || []).map(a => ({
    type: a.achievement_type,
    value: a.value,
    displayValue: a.display_value,
    vehicleName: a.vehicle_name,
    vehicleId: a.vehicle_id,
    metadata: a.metadata,
    achievedAt: a.achieved_at,
    ...ACHIEVEMENT_TYPES[a.achievement_type],
  }));
}

/**
 * Check and update achievements for a user
 */
export async function refreshAchievements(userId) {
  if (!supabase) return;

  try {
    await supabase.rpc('check_user_achievements', { p_user_id: userId });
  } catch (error) {
    console.error('[dashboardScoreService] Error refreshing achievements:', error);
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get Monday of current week (ISO week start)
 * 
 * IMPORTANT: Uses UTC methods consistently to avoid timezone issues.
 * The database stores dates in UTC, so we must calculate week_start in UTC
 * to ensure the JS-calculated date matches the database's get_week_start().
 */
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  // Use UTC methods to avoid timezone shift when converting to ISO string
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setUTCDate(diff);
  return d.toISOString().split('T')[0];
}

function getEmptyDashboardData() {
  return {
    userId: null,
    overallScore: { score: 0, garageScore: 0, dataScore: 0, weeklyScore: 0, streakBonus: 0 },
    completion: getEmptyCompletionScores(),
    engagement: getEmptyEngagement(),
    dailyActivity: getEmptyDailyActivity(),
    monthlyActivity: getEmptyMonthlyActivity(),
    yearlyActivity: getEmptyYearlyActivity(),
    streaks: getEmptyStreaks(),
    achievements: [],
    updatedAt: null,
  };
}

function getEmptyCompletionScores() {
  return {
    garage_score: 0,
    garage_breakdown: {},
    data_score: 0,
    data_breakdown: {},
    overall_completion: 0,
    updated_at: null,
  };
}

function getEmptyEngagement() {
  return {
    week_start: getWeekStart(),
    al_conversations: 0,
    al_messages: 0,
    community_posts: 0,
    community_comments: 0,
    community_likes_given: 0,
    track_sessions_logged: 0,
    weekly_score: 0,
  };
}

function getEmptyStreaks() {
  return {
    engagement: { current_streak: 0, longest_streak: 0, last_activity_week: null },
  };
}

function getEmptyDailyActivity() {
  return Array(7).fill(null).map(() => ({ al: 0, community: 0, data: 0, garage: 0, profile: 0 }));
}

function getEmptyMonthlyActivity() {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Array(daysInMonth).fill(null).map((_, idx) => ({ day: idx + 1, al: 0, community: 0, data: 0, garage: 0, profile: 0 }));
}

function getEmptyYearlyActivity() {
  return Array(12).fill(null).map((_, idx) => ({ month: idx + 1, al: 0, community: 0, data: 0, garage: 0, profile: 0 }));
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

const dashboardScoreService = {
  ENGAGEMENT_ACTIVITIES,
  ACHIEVEMENT_TYPES,
  getUserDashboardData,
  getCompletionScores,
  recalculateCompletionScores,
  getCurrentWeekEngagement,
  getDailyActivityBreakdown,
  getMonthlyActivityBreakdown,
  getYearlyActivityBreakdown,
  syncWeeklyEngagement,
  trackActivity,
  getUserStreaks,
  getUserAchievements,
  refreshAchievements,
  getUserProfile,
  updateUserTitle,
};

export default dashboardScoreService;
