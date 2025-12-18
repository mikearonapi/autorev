/**
 * User Saved Events API
 * 
 * GET /api/users/[userId]/saved-events
 * Returns the user's saved events with full event details.
 * 
 * Query params:
 * - includeExpired: boolean (default: false) - Include events with start_date < today
 */

import { NextResponse } from 'next/server';
import { createAuthenticatedClient, getBearerToken } from '@/lib/supabaseServer';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    
    console.log('[API/users/saved-events] GET request for userId:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get authenticated user (support both cookie-based SSR sessions and Bearer token auth)
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken ? createAuthenticatedClient(bearerToken) : createRouteHandlerClient({ cookies });

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
    
    // User can only access their own saved events
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Parse query params
    const { searchParams } = new URL(request.url);
    const includeExpired = searchParams.get('includeExpired') === 'true';
    
    // Fetch saved events with full event details
    let query = supabase
      .from('event_saves')
      .select(`
        id,
        created_at,
        notes,
        events (
          id,
          slug,
          name,
          description,
          start_date,
          end_date,
          start_time,
          end_time,
          timezone,
          venue_name,
          city,
          state,
          zip,
          region,
          scope,
          source_url,
          source_name,
          registration_url,
          image_url,
          cost_text,
          is_free,
          featured,
          status,
          event_types (
            slug,
            name,
            icon,
            is_track_event
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    const { data: saves, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('[API/users/saved-events] Error fetching saved events:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch saved events' },
        { status: 500 }
      );
    }
    
    // Filter and transform results
    const today = new Date().toISOString().split('T')[0];
    
    const savedEvents = (saves || [])
      .filter(save => {
        // Skip if event was deleted or not approved
        if (!save.events || save.events.status !== 'approved') {
          return false;
        }
        // Filter out expired events unless requested
        if (!includeExpired && save.events.start_date < today) {
          return false;
        }
        return true;
      })
      .map(save => ({
        saved_at: save.created_at,
        notes: save.notes,
        event: {
          id: save.events.id,
          slug: save.events.slug,
          name: save.events.name,
          description: save.events.description,
          start_date: save.events.start_date,
          end_date: save.events.end_date,
          start_time: save.events.start_time,
          end_time: save.events.end_time,
          timezone: save.events.timezone,
          venue_name: save.events.venue_name,
          city: save.events.city,
          state: save.events.state,
          zip: save.events.zip,
          region: save.events.region,
          scope: save.events.scope,
          source_url: save.events.source_url,
          source_name: save.events.source_name,
          registration_url: save.events.registration_url,
          image_url: save.events.image_url,
          cost_text: save.events.cost_text,
          is_free: save.events.is_free,
          featured: save.events.featured,
          event_type: save.events.event_types ? {
            slug: save.events.event_types.slug,
            name: save.events.event_types.name,
            icon: save.events.event_types.icon,
            is_track_event: save.events.event_types.is_track_event,
          } : null,
        },
      }));
    
    return NextResponse.json({
      savedEvents,
      count: savedEvents.length,
    });
  } catch (err) {
    console.error('[API/users/saved-events] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

