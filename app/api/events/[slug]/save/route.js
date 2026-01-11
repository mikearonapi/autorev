/**
 * Event Save/Unsave API
 * 
 * POST /api/events/[slug]/save - Save an event (requires Enthusiast+ tier)
 * DELETE /api/events/[slug]/save - Unsave an event
 * 
 * Requires authentication for both operations.
 */

import { NextResponse } from 'next/server';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import { hasTierAccess, IS_BETA } from '@/lib/tierAccess';
import { withErrorLogging } from '@/lib/serverErrorLogger';

/**
 * POST - Save an event
 */
async function handlePost(request, { params }) {
  const { slug } = await params;
    
    console.log('[API/events/save] POST request for slug:', slug);
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Event slug is required' },
        { status: 400 }
      );
    }
    
    // Get authenticated user (support both cookie-based SSR sessions and Bearer token auth)
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken ? createAuthenticatedClient(bearerToken) : await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service not configured' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user profile for tier check
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();
    
    const userTier = profile?.subscription_tier || 'free';
    
    // Check tier access (Enthusiast+ required)
    // During beta, all authenticated users have access
    const hasAccess = IS_BETA || hasTierAccess(userTier, 'collector');
    
    if (!hasAccess) {
      return NextResponse.json(
        { 
          error: 'This feature requires Enthusiast tier or higher',
          requiredTier: 'collector',
        },
        { status: 403 }
      );
    }
    
    // Get event by slug
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'approved')
      .single();
    
    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found or not approved' },
        { status: 404 }
      );
    }
    
    // Check if already saved
    const { data: existingSave } = await supabase
      .from('event_saves')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', event.id)
      .single();
    
    if (existingSave) {
      return NextResponse.json({
        saved: true,
        alreadySaved: true,
      });
    }
    
    // Create save
    const { error: insertError } = await supabase
      .from('event_saves')
      .insert({
        user_id: user.id,
        event_id: event.id,
      });
    
    if (insertError) {
      console.error('[API/events/save] Error saving event:', insertError);
      return NextResponse.json(
        { error: 'Failed to save event' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      saved: true,
      alreadySaved: false,
    });
}

/**
 * DELETE - Unsave an event
 */
async function handleDelete(request, { params }) {
  const { slug } = await params;
    
    console.log('[API/events/save] DELETE request for slug:', slug);
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Event slug is required' },
        { status: 400 }
      );
    }
    
    // Get authenticated user (support both cookie-based SSR sessions and Bearer token auth)
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken ? createAuthenticatedClient(bearerToken) : await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service not configured' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get event by slug
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Delete save
    const { error: deleteError } = await supabase
      .from('event_saves')
      .delete()
      .eq('user_id', user.id)
      .eq('event_id', event.id);
    
    if (deleteError) {
      console.error('[API/events/save] Error unsaving event:', deleteError);
      return NextResponse.json(
        { error: 'Failed to unsave event' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      saved: false,
    });
}

export const POST = withErrorLogging(handlePost, { route: 'events/save', feature: 'events' });
export const DELETE = withErrorLogging(handleDelete, { route: 'events/save', feature: 'events' });