/**
 * Car Request Service
 *
 * Handles user requests for cars not in the AutoRev database.
 * Requests are stored in the user_feedback table with feedback_type: 'car_request'
 *
 * This consolidates car requests into the existing feedback system for:
 * - Single source of truth for all user requests
 * - Existing admin review workflow
 * - Discord notifications for new requests
 */

import { supabase, isSupabaseConfigured } from './supabase.js';

/**
 * Submit a car request via the feedback API
 * This ensures Discord notifications and other side effects are triggered
 *
 * @param {Object} request - The car request
 * @param {number} request.year - Year of the vehicle
 * @param {string} request.make - Make/brand of the vehicle
 * @param {string} request.model - Model of the vehicle
 * @param {string} [request.trim] - Optional trim level
 * @param {string} [request.source] - Where the request came from (e.g., 'garage', 'al-chat')
 * @param {string} [userId] - Optional user ID (null for anonymous requests)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function submitCarRequest(request, userId = null) {
  const { year, make, model, trim, source = 'garage' } = request;

  // Validate required fields
  if (!year || !make || !model) {
    return { data: null, error: new Error('Year, make, and model are required') };
  }

  // Build the message for the feedback entry
  const carDescription = trim ? `${year} ${make} ${model} ${trim}` : `${year} ${make} ${model}`;

  const message = `Car Request: ${carDescription}`;

  try {
    // Check for duplicate request from same user (within last 30 days)
    // Only check if we have supabase configured and userId
    if (userId && isSupabaseConfigured && supabase) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: existing } = await supabase
        .from('user_feedback')
        .select('id, created_at')
        .eq('user_id', userId)
        .eq('feedback_type', 'car_request')
        .ilike('message', `%${year} ${make} ${model}%`)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .maybeSingle();

      if (existing) {
        console.log('[carRequestService] Duplicate request found:', existing.id);
        return { data: existing, error: null }; // Already requested recently
      }
    }

    // Insert directly into user_feedback table
    // Note: Using direct insert instead of /api/feedback because this runs server-side
    // where relative URLs don't work
    if (!isSupabaseConfigured || !supabase) {
      console.warn('[carRequestService] Supabase not configured, cannot submit car request');
      return { data: null, error: new Error('Database not available') };
    }

    const { data, error } = await supabase
      .from('user_feedback')
      .insert({
        user_id: userId || null,
        feedback_type: 'car_request',
        message,
        feature_context: source,
        tags: ['car-request', make.toLowerCase(), `year-${year}`],
        browser_info: {
          car_request: {
            year: parseInt(year, 10),
            make,
            model,
            trim: trim || null,
          },
        },
      })
      .select()
      .single();

    if (error) {
      console.error('[carRequestService] Database error:', error.message);
      return { data: null, error: new Error(error.message) };
    }

    console.log('[carRequestService] Car request submitted:', data?.id, carDescription);
    return { data, error: null };
  } catch (err) {
    console.error('[carRequestService] Unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Get all car requests for a user
 * @param {string} userId - User ID
 * @returns {Promise<{data: Object[]|null, error: Error|null}>}
 */
export async function getUserCarRequests(userId) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not available') };
  }

  if (!userId) {
    return { data: [], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('id, message, status, created_at, browser_info')
      .eq('user_id', userId)
      .eq('feedback_type', 'car_request')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[carRequestService] Error fetching requests:', error);
      return { data: null, error };
    }

    // Transform to expected format
    const requests = (data || []).map((item) => ({
      id: item.id,
      ...item.browser_info?.car_request,
      status: item.status === 'new' ? 'pending' : item.status,
      created_at: item.created_at,
    }));

    return { data: requests, error: null };
  } catch (err) {
    console.error('[carRequestService] Unexpected error:', err);
    return { data: null, error: err };
  }
}

/**
 * Get all pending car requests (admin use)
 * @returns {Promise<{data: Object[]|null, error: Error|null}>}
 */
export async function getPendingCarRequests() {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not available') };
  }

  try {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('id, user_id, message, status, created_at, browser_info')
      .eq('feedback_type', 'car_request')
      .eq('status', 'new')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[carRequestService] Error fetching pending requests:', error);
      return { data: null, error };
    }

    // Transform to expected format
    const requests = (data || []).map((item) => ({
      id: item.id,
      user_id: item.user_id,
      ...item.browser_info?.car_request,
      status: 'pending',
      created_at: item.created_at,
    }));

    return { data: requests, error: null };
  } catch (err) {
    console.error('[carRequestService] Unexpected error:', err);
    return { data: null, error: err };
  }
}

const carRequestService = {
  submitCarRequest,
  getUserCarRequests,
  getPendingCarRequests,
};

export default carRequestService;
