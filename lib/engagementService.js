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

