/**
 * Car Request Service
 *
 * Handles user requests for cars not in the AutoRev database.
 * Requests are stored in the car_requests table for review.
 */

import { supabase, isSupabaseConfigured } from './supabase.js';

/**
 * Submit a car request to the database
 * @param {Object} request - The car request
 * @param {number} request.year - Year of the vehicle
 * @param {string} request.make - Make/brand of the vehicle
 * @param {string} request.model - Model of the vehicle
 * @param {string} [request.trim] - Optional trim level
 * @param {string} [userId] - Optional user ID (null for anonymous requests)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function submitCarRequest(request, userId = null) {
  if (!isSupabaseConfigured || !supabase) {
    console.error('[carRequestService] Supabase not configured');
    return { data: null, error: new Error('Database not available') };
  }

  const { year, make, model, trim } = request;

  // Validate required fields
  if (!year || !make || !model) {
    return { data: null, error: new Error('Year, make, and model are required') };
  }

  try {
    // Check for duplicate request from same user
    if (userId) {
      const { data: existing } = await supabase
        .from('car_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('year', year)
        .eq('make', make)
        .eq('model', model)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        return { data: existing, error: null }; // Already requested
      }
    }

    const { data, error } = await supabase
      .from('car_requests')
      .insert({
        user_id: userId,
        year,
        make,
        model,
        trim: trim || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[carRequestService] Error submitting request:', error);
      return { data: null, error };
    }

    console.log('[carRequestService] Request submitted:', data.id);
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
      .from('car_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[carRequestService] Error fetching requests:', error);
      return { data: null, error };
    }

    return { data, error: null };
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
      .from('car_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[carRequestService] Error fetching pending requests:', error);
      return { data: null, error };
    }

    return { data, error: null };
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
