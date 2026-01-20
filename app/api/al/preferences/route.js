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

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Create Supabase client for route handlers
 */
async function createSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
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
export async function GET() {
  try {
    const supabase = await createSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Fetch user preferences
    const { data: preferences, error: fetchError } = await supabase
      .from('al_user_preferences')
      .select('*')
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
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('AL preferences GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/al/preferences
 * Update user's AL preferences (upserts if none exist)
 */
export async function PUT(request) {
  try {
    const supabase = await createSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate and sanitize input
    const updates = {};
    
    if (body.response_mode !== undefined) {
      if (!['quick', 'deep', 'database'].includes(body.response_mode)) {
        return NextResponse.json(
          { error: 'Invalid response_mode. Must be quick, deep, or database' },
          { status: 400 }
        );
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
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(preferences);
  } catch (error) {
    console.error('AL preferences PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
