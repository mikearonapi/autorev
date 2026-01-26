/**
 * AL User Preferences API
 * 
 * GET: Fetch user's AL preferences
 * PUT: Update user's AL preferences
 * 
 * Preferences include:
 * - response_mode: 'quick' | 'deep' | 'database'
 * - web_search_enabled: boolean
 * - forum_insights_enabled: boolean
 * - youtube_reviews_enabled: boolean
 * - event_search_enabled: boolean
 */

// Force dynamic to prevent static prerendering (uses cookies/headers)
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import { errors } from '@/lib/apiErrors';
import { withErrorLogging } from '@/lib/serverErrorLogger';

/**
 * Create Supabase client for route handlers (supports both cookie and Bearer token)
 */
async function createSupabaseClient(request) {
  const bearerToken = getBearerToken(request);
  return bearerToken 
    ? { supabase: createAuthenticatedClient(bearerToken), bearerToken }
    : { supabase: await createServerSupabaseClient(), bearerToken: null };
}

// Default preferences for new users
const DEFAULT_PREFERENCES = {
  response_mode: 'database',
  web_search_enabled: true,
  forum_insights_enabled: true,
  youtube_reviews_enabled: true,
  event_search_enabled: true,
  custom_preferences: {}
};

/**
 * GET /api/al/preferences
 * Fetch user's AL preferences (creates defaults if none exist)
 */
async function handleGet(request) {
  try {
    const { supabase, bearerToken } = await createSupabaseClient(request);
    
    if (!supabase) {
      return errors.serviceUnavailable('Authentication service');
    }
    
    // Get current user
    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      return errors.unauthorized();
    }
    
    const PREF_COLS = 'id, user_id, response_style, technical_level, focus_areas, preferred_topics, communication_tone, created_at, updated_at';
    
    // Fetch user preferences
    const { data: preferences, error: fetchError } = await supabase
      .from('al_user_preferences')
      .select(PREF_COLS)
      .eq('user_id', user.id)
      .single();
    
    // If no preferences exist, return defaults (don't create yet)
    if (fetchError && fetchError.code === 'PGRST116') {
      return NextResponse.json({
        ...DEFAULT_PREFERENCES,
        user_id: user.id,
        is_default: true
      });
    }
    
    if (fetchError) {
      console.error('Error fetching AL preferences:', fetchError);
      return errors.database('Failed to fetch preferences');
    }
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('AL preferences GET error:', error);
    return errors.internal();
  }
}

/**
 * PUT /api/al/preferences
 * Update user's AL preferences (upserts if none exist)
 */
async function handlePut(request) {
  try {
    const { supabase, bearerToken } = await createSupabaseClient(request);
    
    if (!supabase) {
      return errors.serviceUnavailable('Authentication service');
    }
    
    // Get current user
    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      return errors.unauthorized();
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate and sanitize input
    const updates = {};
    
    if (body.response_mode !== undefined) {
      if (!['quick', 'deep', 'database'].includes(body.response_mode)) {
        return errors.invalidInput('Invalid response_mode. Must be quick, deep, or database', { field: 'response_mode' });
      }
      updates.response_mode = body.response_mode;
    }
    
    if (body.web_search_enabled !== undefined) {
      updates.web_search_enabled = Boolean(body.web_search_enabled);
    }
    
    if (body.forum_insights_enabled !== undefined) {
      updates.forum_insights_enabled = Boolean(body.forum_insights_enabled);
    }
    
    if (body.youtube_reviews_enabled !== undefined) {
      updates.youtube_reviews_enabled = Boolean(body.youtube_reviews_enabled);
    }
    
    if (body.event_search_enabled !== undefined) {
      updates.event_search_enabled = Boolean(body.event_search_enabled);
    }
    
    if (body.custom_preferences !== undefined) {
      updates.custom_preferences = body.custom_preferences;
    }
    
    // Upsert preferences
    const { data: preferences, error: upsertError } = await supabase
      .from('al_user_preferences')
      .upsert(
        {
          user_id: user.id,
          ...updates
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false
        }
      )
      .select()
      .single();
    
    if (upsertError) {
      console.error('Error upserting AL preferences:', upsertError);
      return errors.database('Failed to update preferences');
    }
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('AL preferences PUT error:', error);
    return errors.internal();
  }
}

export const GET = withErrorLogging(handleGet, { route: 'al/preferences', feature: 'al' });
export const PUT = withErrorLogging(handlePut, { route: 'al/preferences', feature: 'al' });
