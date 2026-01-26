/**
 * Event Attendees API
 * 
 * GET /api/events/[slug]/attendees - Get list of people attending/interested in event
 * 
 * Public endpoint - returns attendees based on their visibility settings.
 * Authenticated users see more attendees (those with "attendees" visibility).
 */

import { NextResponse } from 'next/server';

import { withErrorLogging } from '@/lib/serverErrorLogger';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken, getPublicClient } from '@/lib/supabaseServer';

/**
 * GET - Get event attendees
 * 
 * Query params:
 * - status: Filter by RSVP status ('going' | 'interested' | null for all)
 * - limit: Max results (default 20, max 50)
 */
async function handleGet(request, { params }) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: 'Event slug is required' }, { status: 400 });
  }

  // Parse query params
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

  // Try to get authenticated user (optional - affects visibility)
  let viewerId = null;
  const bearerToken = getBearerToken(request);
  
  if (bearerToken) {
    const authClient = createAuthenticatedClient(bearerToken);
    if (authClient) {
      const { data: { user } } = await authClient.auth.getUser(bearerToken);
      viewerId = user?.id || null;
    }
  } else {
    // Try cookie-based auth
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      viewerId = user?.id || null;
    }
  }

  // Use public client for the query (RLS handles visibility)
  const supabase = getPublicClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  // Get event by slug
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, name')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Build query for attendees with user profiles
  let query = supabase
    .from('event_rsvps')
    .select(`
      id,
      user_id,
      status,
      visibility,
      notes,
      created_at,
      user_profiles!inner (
        display_name,
        avatar_url
      )
    `)
    .eq('event_id', event.id)
    .order('status', { ascending: true }) // 'going' comes before 'interested'
    .order('created_at', { ascending: true })
    .limit(limit);

  // Filter by status if provided
  if (statusFilter && ['going', 'interested'].includes(statusFilter)) {
    query = query.eq('status', statusFilter);
  }

  // Filter by visibility:
  // - Public RSVPs are visible to everyone
  // - 'attendees' visibility requires viewer to also have an RSVP
  // Note: RLS handles private visibility (never returned for non-owner)
  
  const { data: rsvps, error: queryError } = await query;

  if (queryError) {
    console.error('[API/events/attendees] Error fetching attendees:', queryError);
    return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 });
  }

  // Get RSVP counts
  const { data: countData } = await supabase
    .from('event_rsvps')
    .select('status')
    .eq('event_id', event.id);

  const counts = {
    going: 0,
    interested: 0,
    total: 0,
  };

  if (countData) {
    counts.total = countData.length;
    counts.going = countData.filter(r => r.status === 'going').length;
    counts.interested = countData.filter(r => r.status === 'interested').length;
  }

  // Transform response
  const attendees = (rsvps || []).map(rsvp => ({
    userId: rsvp.user_id,
    displayName: rsvp.user_profiles?.display_name || 'Anonymous',
    avatarUrl: rsvp.user_profiles?.avatar_url || null,
    status: rsvp.status,
    // Only show notes if public visibility or viewer is the owner
    notes: (rsvp.visibility === 'public' || rsvp.user_id === viewerId) ? rsvp.notes : null,
    joinedAt: rsvp.created_at,
    isCurrentUser: rsvp.user_id === viewerId,
  }));

  return NextResponse.json({
    eventId: event.id,
    eventName: event.name,
    counts,
    attendees,
    viewerIsAttending: viewerId ? attendees.some(a => a.isCurrentUser) : false,
  });
}

export const GET = withErrorLogging(handleGet, { route: 'events/attendees', feature: 'events' });
