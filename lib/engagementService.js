/**
 * Engagement Service
 * 
 * Handles user engagement scoring and retention tracking.
 * Based on research showing outcome-based metrics correlate 6X better
 * with actual retention than satisfaction surveys.
 * 
 * Scoring Formula:
 * Score = (garage_cars × 2) + (al_conversations × 3) + (events_saved × 2) + 
 *         (parts_searches × 1) + (builds_saved × 3) + (comparisons × 1) -
 *         (days_since_last_activity × 0.5)
 * 
 * @module lib/engagementService
 */

import { supabase, isSupabaseConfigured } from './supabase';

// =============================================================================
// ACTIVITY TYPES
// =============================================================================

export const ACTIVITY_TYPES = {
  GARAGE_CAR: 'garage_car',
  AL_CONVERSATION: 'al_conversation',
  EVENT_SAVED: 'event_saved',
  PARTS_SEARCH: 'parts_search',
  BUILD_SAVED: 'build_saved',
  COMPARISON: 'comparison',
};

// Activity weights for scoring
const ACTIVITY_WEIGHTS = {
  garage_car: 2,
  al_conversation: 3,
  event_saved: 2,
  parts_search: 1,
  build_saved: 3,
  comparison: 1,
};

// Inactivity penalty: 0.5 points per day, capped at 30 points
const INACTIVITY_PENALTY_PER_DAY = 0.5;
const MAX_INACTIVITY_PENALTY = 30;

// =============================================================================
// SCORE CALCULATION (Client-side mirror of SQL function)
// =============================================================================

/**
 * Calculate engagement score locally
 * This mirrors the SQL function for client-side estimation
 * 
 * @param {Object} counts - Activity counts
 * @param {Date|null} lastActivityAt - Last activity timestamp
 * @returns {number} Calculated engagement score
 */
export function calculateEngagementScore(counts, lastActivityAt) {
  const {
    garage_cars_count = 0,
    al_conversations_count = 0,
    events_saved_count = 0,
    parts_searches_count = 0,
    builds_saved_count = 0,
    comparisons_count = 0,
  } = counts;

  // Calculate days since last activity
  let daysInactive = 30; // Default if no activity
  if (lastActivityAt) {
    const lastActivity = new Date(lastActivityAt);
    const now = new Date();
    daysInactive = Math.max(0, Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24)));
  }

  // Calculate inactivity penalty (capped)
  const inactivityPenalty = Math.min(
    MAX_INACTIVITY_PENALTY,
    Math.floor(daysInactive * INACTIVITY_PENALTY_PER_DAY)
  );

  // Calculate base score from activities
  const baseScore =
    garage_cars_count * ACTIVITY_WEIGHTS.garage_car +
    al_conversations_count * ACTIVITY_WEIGHTS.al_conversation +
    events_saved_count * ACTIVITY_WEIGHTS.event_saved +
    parts_searches_count * ACTIVITY_WEIGHTS.parts_search +
    builds_saved_count * ACTIVITY_WEIGHTS.build_saved +
    comparisons_count * ACTIVITY_WEIGHTS.comparison;

  // Return score (minimum 0)
  return Math.max(0, baseScore - inactivityPenalty);
}

// =============================================================================
// TRACK ACTIVITY
// =============================================================================

/**
 * Track a user activity and update their engagement score
 * 
 * @param {string} userId - User's UUID
 * @param {string} activityType - One of ACTIVITY_TYPES
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function trackEngagementActivity(userId, activityType) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    console.debug('[EngagementService] Skipping - not configured or no user');
    return { data: null, error: null };
  }

  if (!Object.values(ACTIVITY_TYPES).includes(activityType)) {
    console.warn('[EngagementService] Unknown activity type:', activityType);
    return { data: null, error: new Error(`Unknown activity type: ${activityType}`) };
  }

  try {
    // Call the RPC function to increment activity and recalculate score
    const { data, error } = await supabase.rpc('increment_engagement_activity', {
      p_user_id: userId,
      p_activity_type: activityType,
    });

    if (error) {
      console.warn('[EngagementService] Error tracking activity:', error);
      return { data: null, error };
    }

    console.debug('[EngagementService] Activity tracked:', activityType, data);
    return { data, error: null };
  } catch (err) {
    console.error('[EngagementService] Exception:', err);
    return { data: null, error: err };
  }
}

// =============================================================================
// FETCH ENGAGEMENT DATA
// =============================================================================

/**
 * Fetch a user's engagement score and milestones
 * 
 * @param {string} userId - User's UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function fetchEngagementScore(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  try {
    const { data, error } = await supabase
      .from('user_engagement_scores')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (user hasn't engaged yet)
      return { data: null, error };
    }

    // Return defaults if no record exists
    if (!data) {
      return {
        data: {
          user_id: userId,
          score: 0,
          peak_score: 0,
          garage_cars_count: 0,
          al_conversations_count: 0,
          events_saved_count: 0,
          parts_searches_count: 0,
          builds_saved_count: 0,
          comparisons_count: 0,
          milestone_first_car: false,
          milestone_first_al_chat: false,
          milestone_first_event: false,
          milestone_first_build: false,
          milestone_returned_7d: false,
          milestone_returned_30d: false,
        },
        error: null,
      };
    }

    return { data, error: null };
  } catch (err) {
    console.error('[EngagementService] Exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Get milestone completion status for a user
 * 
 * @param {string} userId - User's UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function fetchMilestones(userId) {
  const { data, error } = await fetchEngagementScore(userId);
  
  if (error || !data) {
    return { data: null, error };
  }

  // Extract just milestone data
  const milestones = {
    firstCar: {
      completed: data.milestone_first_car,
      completedAt: data.milestone_first_car_at,
      label: 'Add your first car',
      points: ACTIVITY_WEIGHTS.garage_car,
    },
    firstALChat: {
      completed: data.milestone_first_al_chat,
      completedAt: data.milestone_first_al_chat_at,
      label: 'Have your first AL conversation',
      points: ACTIVITY_WEIGHTS.al_conversation,
    },
    firstEvent: {
      completed: data.milestone_first_event,
      completedAt: data.milestone_first_event_at,
      label: 'Save your first event',
      points: ACTIVITY_WEIGHTS.event_saved,
    },
    firstBuild: {
      completed: data.milestone_first_build,
      completedAt: data.milestone_first_build_at,
      label: 'Create your first build',
      points: ACTIVITY_WEIGHTS.build_saved,
    },
    returned7d: {
      completed: data.milestone_returned_7d,
      completedAt: data.milestone_returned_7d_at,
      label: 'Return after 7 days',
      points: 5, // Bonus points
    },
    returned30d: {
      completed: data.milestone_returned_30d,
      completedAt: data.milestone_returned_30d_at,
      label: 'Still active after 30 days',
      points: 10, // Bigger bonus
    },
  };

  const completedCount = Object.values(milestones).filter(m => m.completed).length;
  const totalCount = Object.keys(milestones).length;

  return {
    data: {
      milestones,
      completedCount,
      totalCount,
      progress: Math.round((completedCount / totalCount) * 100),
    },
    error: null,
  };
}

// =============================================================================
// ADMIN FUNCTIONS
// =============================================================================

/**
 * Get users needing re-engagement (admin only)
 * 
 * @param {string} alertType - 'score_dropped', 'inactive_7d', or 'inactive_14d'
 * @param {number} limit - Max users to return
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getUsersNeedingReengagement(alertType, limit = 100) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Not configured') };
  }

  try {
    const { data, error } = await supabase.rpc('get_users_needing_reengagement', {
      p_alert_type: alertType,
      p_limit: limit,
    });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('[EngagementService] Exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Trigger inactivity alert checks (called by cron)
 * 
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateInactivityAlerts() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Not configured') };
  }

  try {
    const { data, error } = await supabase.rpc('update_inactivity_alerts');

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('[EngagementService] Exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Recalculate engagement score for a user
 * 
 * @param {string} userId - User's UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function recalculateScore(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or missing user') };
  }

  try {
    const { data, error } = await supabase.rpc('update_user_engagement_score', {
      p_user_id: userId,
    });

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('[EngagementService] Exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Check and update return milestones for a user
 * 
 * @param {string} userId - User's UUID
 * @returns {Promise<{error: Error|null}>}
 */
export async function checkReturnMilestones(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { error: new Error('Not configured or missing user') };
  }

  try {
    const { error } = await supabase.rpc('check_return_milestones', {
      p_user_id: userId,
    });

    return { error };
  } catch (err) {
    console.error('[EngagementService] Exception:', err);
    return { error: err };
  }
}

// =============================================================================
// ENGAGEMENT SCORE TIERS
// =============================================================================

/**
 * Get the engagement tier based on score
 * Used for gamification and display
 * 
 * @param {number} score - Engagement score
 * @returns {Object} Tier info with name, color, and next tier threshold
 */
export function getEngagementTier(score) {
  if (score >= 100) {
    return {
      tier: 'legend',
      name: 'Legend',
      color: '#f59e0b',
      icon: '🏆',
      nextTier: null,
      pointsToNext: 0,
    };
  }
  if (score >= 50) {
    return {
      tier: 'enthusiast',
      name: 'Enthusiast',
      color: '#8b5cf6',
      icon: '🔥',
      nextTier: 'Legend',
      pointsToNext: 100 - score,
    };
  }
  if (score >= 20) {
    return {
      tier: 'gearhead',
      name: 'Gearhead',
      color: '#3b82f6',
      icon: '⚙️',
      nextTier: 'Enthusiast',
      pointsToNext: 50 - score,
    };
  }
  if (score >= 5) {
    return {
      tier: 'rookie',
      name: 'Rookie',
      color: '#10b981',
      icon: '🚗',
      nextTier: 'Gearhead',
      pointsToNext: 20 - score,
    };
  }
  return {
    tier: 'newcomer',
    name: 'Newcomer',
    color: '#6b7280',
    icon: '👋',
    nextTier: 'Rookie',
    pointsToNext: 5 - score,
  };
}

// =============================================================================
// STREAK FUNCTIONS
// =============================================================================

// Streak milestones for celebrations
export const STREAK_MILESTONES = [7, 14, 30, 50, 100, 365];

/**
 * Get a user's streak status
 * 
 * @param {string} userId - User's UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getStreakStatus(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or missing user') };
  }

  try {
    const { data, error } = await supabase.rpc('get_streak_status', {
      p_user_id: userId,
    });

    if (error) {
      console.warn('[EngagementService] Error getting streak status:', error);
      return { data: null, error };
    }

    // Transform the result
    const result = data?.[0] || {
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null,
      is_at_risk: false,
      hours_remaining: 24,
      is_frozen: false,
      frozen_until: null,
    };

    return {
      data: {
        currentStreak: result.current_streak,
        longestStreak: result.longest_streak,
        lastActivityDate: result.last_activity_date,
        isAtRisk: result.is_at_risk,
        hoursRemaining: Math.max(0, Math.floor(result.hours_remaining)),
        isFrozen: result.is_frozen,
        frozenUntil: result.frozen_until,
        // Calculate next milestone
        nextMilestone: getNextStreakMilestone(result.current_streak),
        daysToNextMilestone: getNextStreakMilestone(result.current_streak) - result.current_streak,
      },
      error: null,
    };
  } catch (err) {
    console.error('[EngagementService] Exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Get the next streak milestone
 * 
 * @param {number} currentStreak - Current streak count
 * @returns {number|null} Next milestone or null if all achieved
 */
export function getNextStreakMilestone(currentStreak) {
  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak < milestone) {
      return milestone;
    }
  }
  return null;
}

/**
 * Get streak display info for UI
 * 
 * @param {number} streak - Current streak
 * @returns {Object} Display info with icon, color, and message
 */
export function getStreakDisplayInfo(streak) {
  if (streak >= 365) {
    return {
      icon: '🔥',
      color: '#f59e0b',
      label: 'Legendary Streak',
      message: 'A full year of dedication!',
    };
  }
  if (streak >= 100) {
    return {
      icon: '🔥',
      color: '#ef4444',
      label: '100+ Day Streak',
      message: 'Triple-digit legend!',
    };
  }
  if (streak >= 50) {
    return {
      icon: '🔥',
      color: '#f97316',
      label: '50+ Day Streak',
      message: 'Impressive dedication!',
    };
  }
  if (streak >= 30) {
    return {
      icon: '🔥',
      color: '#fb923c',
      label: '30+ Day Streak',
      message: 'A month of consistency!',
    };
  }
  if (streak >= 14) {
    return {
      icon: '🔥',
      color: '#fbbf24',
      label: '2 Week Streak',
      message: 'Building strong habits!',
    };
  }
  if (streak >= 7) {
    return {
      icon: '🔥',
      color: '#fcd34d',
      label: 'Week Streak',
      message: 'Great momentum!',
    };
  }
  if (streak >= 3) {
    return {
      icon: '🔥',
      color: '#fde68a',
      label: `${streak} Day Streak`,
      message: 'Keep it going!',
    };
  }
  if (streak >= 1) {
    return {
      icon: '🔥',
      color: '#fef3c7',
      label: streak === 1 ? 'Day 1' : `${streak} Days`,
      message: streak === 1 ? 'Start of something great!' : 'Building momentum!',
    };
  }
  return {
    icon: '💤',
    color: '#9ca3af',
    label: 'No Streak',
    message: 'Start your streak today!',
  };
}

/**
 * Get streak notification copy based on urgency
 * 
 * @param {number} streakDays - Current streak
 * @param {number} hoursLeft - Hours until streak expires
 * @returns {Object} Notification content
 */
export function getStreakReminderCopy(streakDays, hoursLeft) {
  if (hoursLeft <= 2) {
    return {
      title: `Your ${streakDays} day streak expires soon!`,
      body: `Only ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left. Don't lose your progress!`,
      urgency: 'critical',
    };
  }
  if (hoursLeft <= 6) {
    return {
      title: `Keep your ${streakDays} day streak alive!`,
      body: 'Just a quick visit keeps your streak going.',
      urgency: 'high',
    };
  }
  return {
    title: `Continue your ${streakDays} day streak`,
    body: 'Check in today to keep your momentum!',
    urgency: 'normal',
  };
}

/**
 * Apply a streak freeze (premium feature)
 * 
 * @param {string} userId - User's UUID
 * @param {number} days - Number of days to freeze (1-3)
 * @returns {Promise<{data: boolean, error: Error|null}>}
 */
export async function applyStreakFreeze(userId, days = 1) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: false, error: new Error('Not configured or missing user') };
  }

  try {
    const { data, error } = await supabase.rpc('apply_streak_freeze', {
      p_user_id: userId,
      p_days: days,
    });

    if (error) {
      return { data: false, error };
    }

    return { data: data || false, error: null };
  } catch (err) {
    return { data: false, error: err };
  }
}
