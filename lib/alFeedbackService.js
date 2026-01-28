/**
 * AL Feedback Service
 *
 * Handles collection and analysis of user feedback on AL responses.
 * Provides thumbs up/down tracking for quality monitoring and DPO training.
 *
 * Usage:
 *   import { recordFeedback, getFeedbackStats } from '@/lib/alFeedbackService';
 *
 *   await recordFeedback({
 *     conversationId: 'uuid',
 *     messageId: 'uuid',
 *     userId: 'uuid',
 *     feedbackType: 'thumbs_up',
 *     queryText: 'What HP does the M3 have?',
 *     responseText: 'The M3 produces 473 HP...',
 *   });
 */

import { createClient } from '@supabase/supabase-js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const FEEDBACK_CATEGORIES = {
  // Positive categories
  helpful: 'helpful',
  accurate: 'accurate',
  wellExplained: 'well_explained',

  // Negative categories
  inaccurate: 'inaccurate',
  unhelpful: 'unhelpful',
  confusing: 'confusing',
  missingInfo: 'missing_info',
  offTopic: 'off_topic',
  unsafe: 'unsafe',
  other: 'other',
};

const FEEDBACK_TYPES = {
  thumbsUp: 'thumbs_up',
  thumbsDown: 'thumbs_down',
};

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Record feedback for an AL response
 *
 * @param {Object} params
 * @param {string} params.conversationId - UUID of the conversation
 * @param {string} params.messageId - UUID of the specific message
 * @param {string} params.userId - UUID of the user giving feedback
 * @param {string} params.feedbackType - 'thumbs_up' or 'thumbs_down'
 * @param {string} [params.feedbackReason] - Optional free-text reason
 * @param {string} [params.feedbackCategory] - Category from FEEDBACK_CATEGORIES
 * @param {string} [params.queryText] - The user's original query
 * @param {string} [params.responseText] - AL's response (will be truncated)
 * @param {string[]} [params.toolsUsed] - Array of tool names used
 * @param {string} [params.carContextSlug] - Car slug for context (what car was being discussed)
 * @param {string} [params.agentType] - Which specialist agent responded
 * @param {string} [params.promptVersionId] - UUID of prompt version
 * @param {number} [params.responseTokens] - Token count of response
 * @returns {Promise<{success: boolean, feedbackId?: string, error?: string}>}
 */
export async function recordFeedback({
  conversationId,
  messageId,
  userId,
  feedbackType,
  feedbackReason = null,
  feedbackCategory = null,
  queryText = null,
  responseText = null,
  toolsUsed = [],
  carContextSlug = null,
  agentType = null,
  promptVersionId = null,
  responseTokens = null,
}) {
  // Validation
  if (!messageId) {
    return { success: false, error: 'messageId is required' };
  }
  if (!feedbackType || !Object.values(FEEDBACK_TYPES).includes(feedbackType)) {
    return { success: false, error: 'Invalid feedbackType. Must be thumbs_up or thumbs_down' };
  }
  if (feedbackCategory && !Object.values(FEEDBACK_CATEGORIES).includes(feedbackCategory)) {
    return { success: false, error: 'Invalid feedbackCategory' };
  }

  try {
    const supabase = getSupabaseClient();

    // Truncate response text to prevent huge storage (keep first 2000 chars)
    const truncatedResponse = responseText ? responseText.substring(0, 2000) : null;

    // Truncate query text too (keep first 1000 chars)
    const truncatedQuery = queryText ? queryText.substring(0, 1000) : null;

    const { data, error } = await supabase
      .from('al_response_feedback')
      .insert({
        conversation_id: conversationId || null,
        message_id: messageId,
        user_id: userId || null,
        feedback_type: feedbackType,
        feedback_reason: feedbackReason,
        feedback_category: feedbackCategory,
        query_text: truncatedQuery,
        response_text: truncatedResponse,
        tools_used: toolsUsed,
        car_context_slug: carContextSlug,
        agent_type: agentType,
        prompt_version_id: promptVersionId,
        response_tokens: responseTokens,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[AL Feedback] Error recording feedback:', error);
      return { success: false, error: error.message };
    }

    console.log(
      `[AL Feedback] Recorded ${feedbackType} feedback for message ${messageId}${feedbackCategory ? ` (${feedbackCategory})` : ''}`
    );

    return { success: true, feedbackId: data.id };
  } catch (err) {
    console.error('[AL Feedback] Exception recording feedback:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get feedback statistics summary
 *
 * @param {Object} [options]
 * @param {Date} [options.startDate] - Start of period (default: 30 days ago)
 * @param {Date} [options.endDate] - End of period (default: now)
 * @returns {Promise<Object>}
 */
export async function getFeedbackStats(options = {}) {
  const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } =
    options;

  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.rpc('get_al_feedback_summary', {
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
    });

    if (error) {
      console.error('[AL Feedback] Error getting stats:', error);
      return null;
    }

    return (
      data?.[0] || {
        total_feedback: 0,
        thumbs_up: 0,
        thumbs_down: 0,
        approval_rate: 0,
        top_negative_categories: [],
        unreviewed_count: 0,
      }
    );
  } catch (err) {
    console.error('[AL Feedback] Exception getting stats:', err);
    return null;
  }
}

/**
 * Get feedback trend over time
 *
 * @param {number} [days=30] - Number of days to look back
 * @returns {Promise<Array>}
 */
export async function getFeedbackTrend(days = 30) {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.rpc('get_al_feedback_trend', {
      p_days: days,
    });

    if (error) {
      console.error('[AL Feedback] Error getting trend:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[AL Feedback] Exception getting trend:', err);
    return [];
  }
}

/**
 * Get feedback by prompt version (for A/B testing analysis)
 *
 * @returns {Promise<Array>}
 */
export async function getFeedbackByPromptVersion() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.rpc('get_feedback_by_prompt_version');

    if (error) {
      console.error('[AL Feedback] Error getting feedback by version:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[AL Feedback] Exception getting feedback by version:', err);
    return [];
  }
}

/**
 * Get recent negative feedback for review
 *
 * @param {number} [limit=50] - Number of items to return
 * @returns {Promise<Array>}
 */
export async function getRecentNegativeFeedback(limit = 50) {
  try {
    const supabase = getSupabaseClient();

    const FEEDBACK_COLUMNS =
      'id, user_id, conversation_id, message_id, feedback_type, feedback_category, query_text, response_text, expected_response, notes, created_at';

    const { data, error } = await supabase
      .from('al_response_feedback')
      .select(FEEDBACK_COLUMNS)
      .eq('feedback_type', FEEDBACK_TYPES.thumbsDown)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[AL Feedback] Error getting negative feedback:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[AL Feedback] Exception getting negative feedback:', err);
    return [];
  }
}

/**
 * Get user's feedback history
 *
 * @param {string} userId - User ID
 * @param {number} [limit=20] - Number of items to return
 * @returns {Promise<Array>}
 */
export async function getUserFeedbackHistory(userId, limit = 20) {
  if (!userId) return [];

  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('al_response_feedback')
      .select('id, feedback_type, feedback_category, query_text, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[AL Feedback] Error getting user history:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[AL Feedback] Exception getting user history:', err);
    return [];
  }
}

/**
 * Check if user already gave feedback for a message
 *
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 * @returns {Promise<{hasFeedback: boolean, feedbackType?: string}>}
 */
export async function checkExistingFeedback(messageId, userId) {
  if (!messageId || !userId) {
    return { hasFeedback: false };
  }

  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('al_response_feedback')
      .select('feedback_type')
      .eq('message_id', messageId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[AL Feedback] Error checking existing:', error);
      return { hasFeedback: false };
    }

    return {
      hasFeedback: Boolean(data),
      feedbackType: data?.feedback_type,
    };
  } catch (err) {
    console.error('[AL Feedback] Exception checking existing:', err);
    return { hasFeedback: false };
  }
}

/**
 * Update existing feedback (change from up to down or vice versa)
 *
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 * @param {string} newFeedbackType - New feedback type
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updateFeedback(messageId, userId, newFeedbackType) {
  if (!messageId || !userId) {
    return { success: false, error: 'messageId and userId required' };
  }

  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('al_response_feedback')
      .update({
        feedback_type: newFeedbackType,
        feedback_reason: null, // Clear reason on type change
        feedback_category: null,
      })
      .eq('message_id', messageId)
      .eq('user_id', userId);

    if (error) {
      console.error('[AL Feedback] Error updating feedback:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[AL Feedback] Exception updating feedback:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete feedback
 *
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFeedback(messageId, userId) {
  if (!messageId || !userId) {
    return { success: false, error: 'messageId and userId required' };
  }

  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('al_response_feedback')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', userId);

    if (error) {
      console.error('[AL Feedback] Error deleting feedback:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[AL Feedback] Exception deleting feedback:', err);
    return { success: false, error: err.message };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const CATEGORIES = FEEDBACK_CATEGORIES;
export const TYPES = FEEDBACK_TYPES;

const alFeedbackService = {
  recordFeedback,
  getFeedbackStats,
  getFeedbackTrend,
  getFeedbackByPromptVersion,
  getRecentNegativeFeedback,
  getUserFeedbackHistory,
  checkExistingFeedback,
  updateFeedback,
  deleteFeedback,
  CATEGORIES: FEEDBACK_CATEGORIES,
  TYPES: FEEDBACK_TYPES,
};

export default alFeedbackService;
