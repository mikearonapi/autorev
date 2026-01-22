/**
 * Points Service
 * 
 * Manages user points for gamification. Points accumulate over time
 * and encourage engagement across the app.
 * 
 * @example
 * import { awardPoints, POINTS_CONFIG } from '@/lib/pointsService';
 * 
 * // Award points for adding a vehicle
 * await awardPoints(userId, 'garage_add_vehicle', { vehicleId: '...' });
 * 
 * // Get user's total points
 * const total = await getUserPoints(userId);
 * 
 * // Check and award streak bonuses
 * await checkStreakBonus(userId, currentStreak);
 */

import { supabaseServiceRole as supabase } from './supabase';

// =============================================================================
// POINTS CONFIGURATION
// =============================================================================

/**
 * Points awarded for each action type.
 * 
 * Categories:
 * - garage_*: Building your car
 * - data_*: Logging performance data
 * - community_*: Social engagement
 * - al_*: AI assistant usage
 */
export const POINTS_CONFIG = {
  // Garage: Building Your Car
  garage_add_vehicle: {
    points: 100,
    label: 'Add a vehicle',
    description: 'Add a new vehicle to your garage',
    category: 'garage',
  },
  garage_add_modification: {
    points: 50,
    label: 'Add a modification',
    description: 'Log a modification on your vehicle',
    category: 'garage',
  },
  garage_upload_photo: {
    points: 25,
    label: 'Upload a photo',
    description: 'Add a photo to your vehicle',
    category: 'garage',
  },
  garage_add_part_details: {
    points: 25,
    label: 'Add part details',
    description: 'Enter brand/part info for a modification',
    category: 'garage',
  },

  // Data: Logging Performance
  data_log_dyno: {
    points: 75,
    label: 'Log dyno data',
    description: 'Record a dyno run for your vehicle',
    category: 'data',
  },
  data_log_track_time: {
    points: 75,
    label: 'Log track time',
    description: 'Record a track session time',
    category: 'data',
  },

  // Community: Engaging
  community_like_post: {
    points: 5,
    label: 'Like a post',
    description: 'Like a community post',
    category: 'community',
  },
  community_comment: {
    points: 10,
    label: 'Post a comment',
    description: 'Comment on a community post',
    category: 'community',
  },
  community_share_build: {
    points: 100,
    label: 'Share your build',
    description: 'Share your build to the community',
    category: 'community',
  },

  // AL: Getting Help
  al_ask_question: {
    points: 25,
    label: 'Ask AL',
    description: 'Ask AL a question',
    category: 'al',
  },

  // Streak Bonuses (awarded automatically)
  streak_bonus_2_weeks: {
    points: 10,
    label: '2 week streak',
    description: 'Used the app for 2 weeks in a row',
    category: 'streak',
  },
  streak_bonus_4_weeks: {
    points: 50,
    label: '4 week streak',
    description: 'Used the app for 4 weeks in a row',
    category: 'streak',
  },
  streak_bonus_6_weeks: {
    points: 200,
    label: '6 week streak',
    description: 'Used the app for 6 weeks in a row',
    category: 'streak',
  },
  streak_bonus_8_weeks: {
    points: 500,
    label: '8 week streak',
    description: 'Used the app for 8 weeks in a row',
    category: 'streak',
  },
  streak_bonus_12_weeks: {
    points: 1000,
    label: '12 week streak',
    description: 'Used the app for 12 weeks in a row',
    category: 'streak',
  },
};

/**
 * Streak milestone thresholds
 * Maps streak length (in weeks) to the action type for bonus
 */
export const STREAK_MILESTONES = {
  2: 'streak_bonus_2_weeks',
  4: 'streak_bonus_4_weeks',
  6: 'streak_bonus_6_weeks',
  8: 'streak_bonus_8_weeks',
  12: 'streak_bonus_12_weeks',
};

/**
 * Get points config grouped by category for UI display
 */
export function getPointsConfigByCategory() {
  const categories = {
    garage: { label: 'Garage', icon: '🚗', actions: [] },
    data: { label: 'Data', icon: '📊', actions: [] },
    community: { label: 'Community', icon: '👥', actions: [] },
    al: { label: 'AL', icon: '🤖', actions: [] },
  };

  for (const [key, config] of Object.entries(POINTS_CONFIG)) {
    if (categories[config.category]) {
      categories[config.category].actions.push({
        key,
        ...config,
      });
    }
  }

  return categories;
}

// =============================================================================
// POINTS OPERATIONS
// =============================================================================

/**
 * Award points to a user for an action
 * 
 * @param {string} userId - UUID of the user
 * @param {string} actionType - Key from POINTS_CONFIG
 * @param {object} metadata - Optional metadata about the action
 * @returns {Promise<{success: boolean, newTotal: number, pointsAwarded: number}>}
 */
export async function awardPoints(userId, actionType, metadata = {}) {
  if (!supabase) {
    console.warn('[pointsService] Supabase not configured');
    return { success: false, newTotal: 0, pointsAwarded: 0 };
  }

  const config = POINTS_CONFIG[actionType];
  if (!config) {
    console.warn(`[pointsService] Unknown action type: ${actionType}`);
    return { success: false, newTotal: 0, pointsAwarded: 0 };
  }

  try {
    const { data, error } = await supabase.rpc('award_points', {
      p_user_id: userId,
      p_points: config.points,
      p_action_type: actionType,
      p_action_description: config.label,
      p_metadata: metadata,
    });

    if (error) {
      console.error('[pointsService] Error awarding points:', error);
      return { success: false, newTotal: 0, pointsAwarded: 0 };
    }

    return {
      success: true,
      newTotal: data || 0,
      pointsAwarded: config.points,
    };
  } catch (err) {
    console.error('[pointsService] Error awarding points:', err);
    return { success: false, newTotal: 0, pointsAwarded: 0 };
  }
}

/**
 * Get user's total points
 * 
 * @param {string} userId - UUID of the user
 * @returns {Promise<number>}
 */
export async function getUserPoints(userId) {
  if (!supabase) return 0;

  try {
    const { data, error } = await supabase.rpc('get_user_points', {
      p_user_id: userId,
    });

    if (error) {
      console.error('[pointsService] Error getting points:', error);
      return 0;
    }

    return data || 0;
  } catch (err) {
    console.error('[pointsService] Error getting points:', err);
    return 0;
  }
}

/**
 * Get user's points history (recent activity)
 * 
 * @param {string} userId - UUID of the user
 * @param {number} limit - Max records to return
 * @returns {Promise<Array>}
 */
export async function getPointsHistory(userId, limit = 20) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('user_points_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[pointsService] Error getting history:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      points: row.points,
      actionType: row.action_type,
      description: row.action_description,
      metadata: row.metadata,
      createdAt: row.created_at,
      config: POINTS_CONFIG[row.action_type],
    }));
  } catch (err) {
    console.error('[pointsService] Error getting history:', err);
    return [];
  }
}

/**
 * Get points earned this week
 * 
 * @param {string} userId - UUID of the user
 * @returns {Promise<number>}
 */
export async function getWeeklyPoints(userId) {
  if (!supabase) return 0;

  // Calculate Monday of current week (UTC)
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), diff));
  const weekStartISO = weekStart.toISOString();

  try {
    const { data, error } = await supabase
      .from('user_points_history')
      .select('points')
      .eq('user_id', userId)
      .gte('created_at', weekStartISO);

    if (error) {
      console.error('[pointsService] Error getting weekly points:', error);
      return 0;
    }

    return (data || []).reduce((sum, row) => sum + (row.points || 0), 0);
  } catch (err) {
    console.error('[pointsService] Error getting weekly points:', err);
    return 0;
  }
}

/**
 * Get points earned this month
 * 
 * @param {string} userId - UUID of the user
 * @returns {Promise<number>}
 */
export async function getMonthlyPoints(userId) {
  if (!supabase) return 0;

  // Calculate first of current month (UTC)
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthStartISO = monthStart.toISOString();

  try {
    const { data, error } = await supabase
      .from('user_points_history')
      .select('points')
      .eq('user_id', userId)
      .gte('created_at', monthStartISO);

    if (error) {
      console.error('[pointsService] Error getting monthly points:', error);
      return 0;
    }

    return (data || []).reduce((sum, row) => sum + (row.points || 0), 0);
  } catch (err) {
    console.error('[pointsService] Error getting monthly points:', err);
    return 0;
  }
}

/**
 * Check and award streak bonus points
 * Called when a user's streak is updated
 * 
 * @param {string} userId - UUID of the user
 * @param {number} currentStreak - Current streak in weeks
 * @returns {Promise<{awarded: boolean, actionType?: string, points?: number}>}
 */
export async function checkStreakBonus(userId, currentStreak) {
  if (!supabase || !currentStreak) {
    return { awarded: false };
  }

  // Find the highest milestone reached
  const milestones = Object.keys(STREAK_MILESTONES)
    .map(Number)
    .sort((a, b) => b - a); // Descending order

  for (const milestone of milestones) {
    if (currentStreak >= milestone) {
      const actionType = STREAK_MILESTONES[milestone];
      
      // Check if this milestone was already awarded
      const { data: existing } = await supabase
        .from('user_points_history')
        .select('id')
        .eq('user_id', userId)
        .eq('action_type', actionType)
        .limit(1);

      if (existing && existing.length > 0) {
        // Already awarded, check lower milestones
        continue;
      }

      // Award the bonus
      const result = await awardPoints(userId, actionType, { 
        streakWeeks: currentStreak,
        milestone,
      });

      if (result.success) {
        return {
          awarded: true,
          actionType,
          points: result.pointsAwarded,
          milestone,
        };
      }
    }
  }

  return { awarded: false };
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

const pointsService = {
  POINTS_CONFIG,
  STREAK_MILESTONES,
  getPointsConfigByCategory,
  awardPoints,
  getUserPoints,
  getPointsHistory,
  getWeeklyPoints,
  getMonthlyPoints,
  checkStreakBonus,
};

export default pointsService;
