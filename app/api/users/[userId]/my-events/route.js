/**
 * User My Events API
 * 
 * GET /api/users/[userId]/my-events
 * Returns events the user has RSVP'd to OR saved/hearted.
 * 
 * Query params:
 * - includeExpired: boolean (default: false) - Include events with start_date < today
 */

import { NextResponse } from 'next/server';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import { withErrorLogging } from '@/lib/serverErrorLogger';

async function handleGet(request, { params }) {
  const { userId } = await params;
  
  console.log('[API/users/my-events] GET request for userId:', userId);
  
  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
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
  
  // User can only access their own events
  if (user.id !== userId) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }
  
  // Parse query params
  const { searchParams } = new URL(request.url);
  const includeExpired = searchParams.get('includeExpired') === 'true';
  
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch RSVPs with full event details
  const { data: rsvps, error: rsvpError } = await supabase
    .from('event_rsvps')
    .select(`
      id,
      status,
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
  
  if (rsvpError) {
    console.error('[API/users/my-events] Error fetching RSVPs:', rsvpError);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
  
  // Fetch saved events with full event details
  const { data: saves, error: saveError } = await supabase
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
  
  if (saveError) {
    console.error('[API/users/my-events] Error fetching saves:', saveError);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
  
  // Helper to transform event data
  const transformEvent = (eventData) => ({
    id: eventData.id,
    slug: eventData.slug,
    name: eventData.name,
    description: eventData.description,
    start_date: eventData.start_date,
    end_date: eventData.end_date,
    start_time: eventData.start_time,
    end_time: eventData.end_time,
    timezone: eventData.timezone,
    venue_name: eventData.venue_name,
    city: eventData.city,
    state: eventData.state,
    zip: eventData.zip,
    region: eventData.region,
    scope: eventData.scope,
    source_url: eventData.source_url,
    source_name: eventData.source_name,
    registration_url: eventData.registration_url,
    image_url: eventData.image_url,
    cost_text: eventData.cost_text,
    is_free: eventData.is_free,
    featured: eventData.featured,
    event_type: eventData.event_types ? {
      slug: eventData.event_types.slug,
      name: eventData.event_types.name,
      icon: eventData.event_types.icon,
      is_track_event: eventData.event_types.is_track_event,
    } : null,
  });
  
  // Track unique events by ID to prevent duplicates (user might RSVP and save same event)
  const seenEventIds = new Set();
  const myEvents = [];
  
  // Process RSVPs first (higher priority - user explicitly committed)
  for (const rsvp of rsvps || []) {
    // Skip if event was deleted or not approved
    if (!rsvp.events || rsvp.events.status !== 'approved') {
      continue;
    }
    // Filter out expired events unless requested
    if (!includeExpired && rsvp.events.start_date < today) {
      continue;
    }
    
    seenEventIds.add(rsvp.events.id);
    myEvents.push({
      ...transformEvent(rsvp.events),
      user_status: {
        type: 'rsvp',
        rsvp_status: rsvp.status, // 'going' or 'interested'
        notes: rsvp.notes,
        added_at: rsvp.created_at,
      },
    });
  }
  
  // Process saves (only if not already in RSVPs)
  for (const save of saves || []) {
    // Skip if event was deleted or not approved
    if (!save.events || save.events.status !== 'approved') {
      continue;
    }
    // Skip if already added via RSVP
    if (seenEventIds.has(save.events.id)) {
      // Update the existing entry to include saved status
      const existing = myEvents.find(e => e.id === save.events.id);
      if (existing) {
        existing.user_status.is_saved = true;
        existing.user_status.saved_at = save.created_at;
      }
      continue;
    }
    // Filter out expired events unless requested
    if (!includeExpired && save.events.start_date < today) {
      continue;
    }
    
    seenEventIds.add(save.events.id);
    myEvents.push({
      ...transformEvent(save.events),
      user_status: {
        type: 'saved',
        is_saved: true,
        notes: save.notes,
        added_at: save.created_at,
        saved_at: save.created_at,
      },
    });
  }
  
  // Sort by start_date (upcoming first)
  myEvents.sort((a, b) => {
    const dateA = new Date(a.start_date);
    const dateB = new Date(b.start_date);
    return dateA - dateB;
  });
  
  return NextResponse.json({
    events: myEvents,
    count: myEvents.length,
    rsvp_count: (rsvps || []).filter(r => r.events?.status === 'approved').length,
    saved_count: (saves || []).filter(s => s.events?.status === 'approved').length,
  });
}

export const GET = withErrorLogging(handleGet, { route: 'users/my-events', feature: 'events' });
