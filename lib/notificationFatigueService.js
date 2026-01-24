/**
 * Notification Fatigue Service
 *
 * Detects when users are experiencing notification fatigue and
 * automatically adjusts notification frequency to prevent opt-outs.
 *
 * Fatigue Indicators:
 * - High dismiss rate (>80% of notifications dismissed without action)
 * - Low click rate (<5% of notifications clicked)
 * - Recent opt-out from any notification category
 * - Rapid dismissal pattern (multiple notifications dismissed quickly)
 *
 * @module lib/notificationFatigueService
 */

import { supabase, supabaseServiceRole, isSupabaseConfigured } from './supabase';

// =============================================================================
// FATIGUE THRESHOLDS
// =============================================================================

const FATIGUE_CONFIG = {
  // Time window for analyzing user behavior (in days)
  analysisWindow: 14,

  // Dismiss rate threshold (percentage)
  dismissRateThreshold: 80,

  // Click rate threshold (percentage)
  clickRateThreshold: 5,

  // Minimum notifications to analyze (avoid false positives for new users)
  minNotificationsForAnalysis: 10,

  // Recent opt-out window (in days)
  recentOptOutWindow: 7,

  // Cooldown period after fatigue detected (in days)
  fatigueCooldownDays: 7,

  // Frequency reduction factors
  reductionFactors: {
    mild: 0.5, // Reduce by 50%
    moderate: 0.25, // Reduce by 75%
    severe: 0.1, // Reduce by 90%
  },
};

// =============================================================================
// FATIGUE DETECTION
// =============================================================================

/**
 * Analyze a user's notification fatigue level
 *
 * @param {string} userId - User's UUID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function detectFatigue(userId) {
  if (!isSupabaseConfigured || !userId) {
    return { data: null, error: new Error('Not configured or missing user') };
  }

  try {
    const client = supabaseServiceRole || supabase;
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - FATIGUE_CONFIG.analysisWindow);

    // Get notification interactions in the analysis window
    const { data: interactions, error: interactionError } = await client
      .from('notification_interactions')
      .select('interaction_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', windowStart.toISOString());

    if (interactionError) {
      return { data: null, error: interactionError };
    }

    // Get total notifications sent in the window
    const { count: totalSent, error: countError } = await client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', windowStart.toISOString());

    if (countError) {
      return { data: null, error: countError };
    }

    // Not enough data for analysis
    if (totalSent < FATIGUE_CONFIG.minNotificationsForAnalysis) {
      return {
        data: {
          isFatigued: false,
          reason: 'insufficient_data',
          metrics: { totalSent },
          severity: 'none',
        },
        error: null,
      };
    }

    // Calculate metrics
    const clickedCount = interactions.filter((i) => i.interaction_type === 'clicked').length;
    const dismissedCount = interactions.filter((i) => i.interaction_type === 'dismissed').length;
    const viewedCount = interactions.filter((i) => i.interaction_type === 'viewed').length;

    const clickRate = totalSent > 0 ? (clickedCount / totalSent) * 100 : 0;
    const dismissRate =
      viewedCount + dismissedCount > 0
        ? (dismissedCount / (viewedCount + dismissedCount)) * 100
        : 0;

    // Check for recent category opt-outs
    const optOutWindow = new Date();
    optOutWindow.setDate(optOutWindow.getDate() - FATIGUE_CONFIG.recentOptOutWindow);

    const { data: recentPrefsChanges, error: _prefsError } = await client
      .from('notification_category_preferences')
      .select('updated_at, email_enabled, in_app_enabled')
      .eq('user_id', userId)
      .gte('updated_at', optOutWindow.toISOString())
      .or('email_enabled.eq.false,in_app_enabled.eq.false');

    const hasRecentOptOut = (recentPrefsChanges?.length || 0) > 0;

    // Determine fatigue level
    const metrics = {
      totalSent,
      clickedCount,
      dismissedCount,
      viewedCount,
      clickRate: Math.round(clickRate * 10) / 10,
      dismissRate: Math.round(dismissRate * 10) / 10,
      hasRecentOptOut,
    };

    let isFatigued = false;
    let severity = 'none';
    const reasons = [];

    // Check dismiss rate
    if (dismissRate >= FATIGUE_CONFIG.dismissRateThreshold) {
      isFatigued = true;
      reasons.push('high_dismiss_rate');
    }

    // Check click rate
    if (clickRate < FATIGUE_CONFIG.clickRateThreshold) {
      isFatigued = true;
      reasons.push('low_click_rate');
    }

    // Check recent opt-outs
    if (hasRecentOptOut) {
      isFatigued = true;
      reasons.push('recent_opt_out');
    }

    // Determine severity
    if (isFatigued) {
      const fatigueScore = reasons.length;
      if (fatigueScore >= 3) {
        severity = 'severe';
      } else if (fatigueScore >= 2) {
        severity = 'moderate';
      } else {
        severity = 'mild';
      }
    }

    return {
      data: {
        isFatigued,
        severity,
        reasons,
        metrics,
        recommendedAction: isFatigued ? getRecommendedAction(severity, reasons) : null,
      },
      error: null,
    };
  } catch (err) {
    console.error('[FatigueService] Exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Get recommended action based on fatigue severity
 */
function getRecommendedAction(severity, _reasons) {
  switch (severity) {
    case 'severe':
      return {
        type: 'reduce_significantly',
        factor: FATIGUE_CONFIG.reductionFactors.severe,
        message: 'Reduce notifications to essential only',
        actions: [
          'Switch to weekly digest for marketing notifications',
          'Only send system and urgent notifications',
          'Consider re-engagement campaign after cooldown',
        ],
      };
    case 'moderate':
      return {
        type: 'reduce_moderately',
        factor: FATIGUE_CONFIG.reductionFactors.moderate,
        message: 'Reduce notification frequency',
        actions: [
          'Switch to daily digest for low-priority notifications',
          'Reduce social notification frequency',
          'Focus on high-value notifications only',
        ],
      };
    case 'mild':
      return {
        type: 'reduce_slightly',
        factor: FATIGUE_CONFIG.reductionFactors.mild,
        message: 'Slightly reduce notification frequency',
        actions: ['Batch similar notifications', 'Increase time between non-urgent notifications'],
      };
    default:
      return null;
  }
}

// =============================================================================
// AUTOMATIC FREQUENCY ADJUSTMENT
// =============================================================================

/**
 * Record a notification interaction for fatigue tracking
 *
 * @param {string} notificationId - Notification UUID
 * @param {string} userId - User's UUID
 * @param {string} interactionType - 'viewed', 'clicked', or 'dismissed'
 */
export async function recordInteraction(notificationId, userId, interactionType) {
  if (!isSupabaseConfigured || !notificationId || !userId) {
    return { error: null };
  }

  try {
    const client = supabaseServiceRole || supabase;
    const { error } = await client.from('notification_interactions').insert({
      notification_id: notificationId,
      user_id: userId,
      interaction_type: interactionType,
    });

    return { error };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Check if we should send a notification based on fatigue status
 *
 * @param {string} userId - User's UUID
 * @param {string} category - Notification category
 * @param {boolean} isUrgent - Whether the notification is urgent
 * @returns {Promise<{shouldSend: boolean, reason: string}>}
 */
export async function shouldSendNotification(userId, category, isUrgent = false) {
  // Always send urgent notifications
  if (isUrgent) {
    return { shouldSend: true, reason: 'urgent' };
  }

  // Always send system notifications
  if (category === 'system') {
    return { shouldSend: true, reason: 'system_category' };
  }

  try {
    const { data: fatigueData } = await detectFatigue(userId);

    if (!fatigueData || !fatigueData.isFatigued) {
      return { shouldSend: true, reason: 'no_fatigue_detected' };
    }

    // Apply probability-based reduction
    const factor = FATIGUE_CONFIG.reductionFactors[fatigueData.severity] || 1;
    const shouldSend = Math.random() < factor;

    return {
      shouldSend,
      reason: shouldSend
        ? `passed_probability_check_${fatigueData.severity}`
        : `blocked_by_fatigue_${fatigueData.severity}`,
    };
  } catch (err) {
    // On error, err on the side of sending
    console.warn('[FatigueService] Error checking fatigue:', err);
    return { shouldSend: true, reason: 'error_defaulting_to_send' };
  }
}

// =============================================================================
// ADMIN/ANALYTICS FUNCTIONS
// =============================================================================

/**
 * Get fatigue metrics for admin dashboard
 *
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getFatigueMetrics() {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Not configured') };
  }

  try {
    const client = supabaseServiceRole || supabase;
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - FATIGUE_CONFIG.analysisWindow);

    // Get aggregate interaction stats
    const { data: interactionStats, error: interactionError } = await client
      .from('notification_interactions')
      .select('interaction_type, user_id')
      .gte('created_at', windowStart.toISOString());

    if (interactionError) {
      return { data: null, error: interactionError };
    }

    // Get total notifications sent
    const { count: totalSent, error: countError } = await client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', windowStart.toISOString());

    if (countError) {
      return { data: null, error: countError };
    }

    // Calculate aggregate metrics
    const uniqueUsers = [...new Set(interactionStats.map((i) => i.user_id))].length;
    const clickedCount = interactionStats.filter((i) => i.interaction_type === 'clicked').length;
    const dismissedCount = interactionStats.filter(
      (i) => i.interaction_type === 'dismissed'
    ).length;
    const viewedCount = interactionStats.filter((i) => i.interaction_type === 'viewed').length;

    const overallClickRate = totalSent > 0 ? (clickedCount / totalSent) * 100 : 0;
    const overallDismissRate =
      viewedCount + dismissedCount > 0
        ? (dismissedCount / (viewedCount + dismissedCount)) * 100
        : 0;

    return {
      data: {
        period: {
          start: windowStart.toISOString(),
          end: new Date().toISOString(),
          days: FATIGUE_CONFIG.analysisWindow,
        },
        totals: {
          notificationsSent: totalSent,
          uniqueUsersReached: uniqueUsers,
          totalInteractions: interactionStats.length,
        },
        interactions: {
          clicked: clickedCount,
          dismissed: dismissedCount,
          viewed: viewedCount,
        },
        rates: {
          clickRate: Math.round(overallClickRate * 10) / 10,
          dismissRate: Math.round(overallDismissRate * 10) / 10,
        },
        thresholds: {
          clickRateThreshold: FATIGUE_CONFIG.clickRateThreshold,
          dismissRateThreshold: FATIGUE_CONFIG.dismissRateThreshold,
        },
        health: {
          status:
            overallDismissRate < 50 && overallClickRate > 10
              ? 'healthy'
              : overallDismissRate < 70 && overallClickRate > 5
                ? 'warning'
                : 'critical',
        },
      },
      error: null,
    };
  } catch (err) {
    console.error('[FatigueService] Exception:', err);
    return { data: null, error: err };
  }
}

/**
 * Get list of users showing fatigue symptoms
 *
 * @param {number} limit - Max users to return
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function getFatiguedUsers(limit = 50) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Not configured') };
  }

  try {
    const client = supabaseServiceRole || supabase;

    // This would ideally be a materialized view or computed column
    // For now, we'll query users with high dismiss rates
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - FATIGUE_CONFIG.analysisWindow);

    const { data: usersWithDismisses, error } = await client
      .from('notification_interactions')
      .select('user_id')
      .eq('interaction_type', 'dismissed')
      .gte('created_at', windowStart.toISOString())
      .limit(limit * 3); // Get more to account for filtering

    if (error) {
      return { data: null, error };
    }

    // Count dismisses per user
    const dismissCounts = {};
    usersWithDismisses.forEach(({ user_id }) => {
      dismissCounts[user_id] = (dismissCounts[user_id] || 0) + 1;
    });

    // Get top users by dismiss count
    const topUsers = Object.entries(dismissCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([userId, count]) => ({
        userId,
        dismissCount: count,
      }));

    return { data: topUsers, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}
