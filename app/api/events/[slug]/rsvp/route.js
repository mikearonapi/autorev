/**
 * Event RSVP API
 * 
 * POST /api/events/[slug]/rsvp - Create or update RSVP (going/interested)
 * GET /api/events/[slug]/rsvp - Get user's RSVP status for this event
 * DELETE /api/events/[slug]/rsvp - Remove RSVP
 * 
 * Requires authentication for all operations.
 */

import { NextResponse } from 'next/server';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import { hasTierAccess, IS_BETA } from '@/lib/tierAccess';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Valid RSVP statuses
const VALID_STATUSES = ['going', 'interested'];
const VALID_VISIBILITY = ['public', 'attendees', 'private'];

/**
 * Get Supabase client and authenticate user
 */
async function authenticateRequest(request) {
  const bearerToken = getBearerToken(request);
  const supabase = bearerToken 
    ? createAuthenticatedClient(bearerToken) 
    : await createServerSupabaseClient();

  if (!supabase) {
    return { error: 'Authentication service not configured', status: 503 };
  }

  const { data: { user }, error: authError } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Authentication required', status: 401 };
  }

  return { supabase, user };
}

/**
 * Get event by slug (approved only for public API)
 */
async function getEventBySlug(supabase, slug) {
  const { data: event, error } = await supabase
    .from('events')
    .select('id, name, start_date')
    .eq('slug', slug)
    .eq('status', 'approved')
    .single();

  if (error || !event) {
    return null;
  }

  return event;
}

/**
 * GET - Get user's RSVP status for an event
 */
async function handleGet(request, { params }) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: 'Event slug is required' }, { status: 400 });
  }

  const auth = await authenticateRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { supabase, user } = auth;

  // Get event
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Get user's RSVP
  const { data: rsvp, error } = await supabase
    .from('event_rsvps')
    .select('id, status, visibility, notes, created_at')
    .eq('user_id', user.id)
    .eq('event_id', event.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[API/events/rsvp] Error fetching RSVP:', error);
    return NextResponse.json({ error: 'Failed to fetch RSVP' }, { status: 500 });
  }

  return NextResponse.json({
    hasRsvp: !!rsvp,
    rsvp: rsvp || null,
  });
}

/**
 * POST - Create or update RSVP
 */
async function handlePost(request, { params }) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: 'Event slug is required' }, { status: 400 });
  }

  // Parse body
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { status, visibility = 'public', notes } = body;

  // Validate status
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  // Validate visibility
  if (visibility && !VALID_VISIBILITY.includes(visibility)) {
    return NextResponse.json(
      { error: `Invalid visibility. Must be one of: ${VALID_VISIBILITY.join(', ')}` },
      { status: 400 }
    );
  }

  const auth = await authenticateRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { supabase, user } = auth;

  // Get user profile for tier check (free tier can RSVP during beta, or check tier access)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const userTier = profile?.subscription_tier || 'free';
  
  // All authenticated users can RSVP (lowering barrier for community engagement)
  // Could gate to Enthusiast+ tier if needed:
  // const hasAccess = IS_BETA || hasTierAccess(userTier, 'collector');
  const hasAccess = true;

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'This feature requires a paid subscription', requiredTier: 'collector' },
      { status: 403 }
    );
  }

  // Get event
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Upsert RSVP (create or update)
  const { data: rsvp, error: upsertError } = await supabase
    .from('event_rsvps')
    .upsert(
      {
        user_id: user.id,
        event_id: event.id,
        status,
        visibility,
        notes: notes || null,
      },
      { 
        onConflict: 'user_id,event_id',
        ignoreDuplicates: false,
      }
    )
    .select('id, status, visibility, notes, created_at, updated_at')
    .single();

  if (upsertError) {
    console.error('[API/events/rsvp] Error upserting RSVP:', upsertError);
    return NextResponse.json({ error: 'Failed to save RSVP' }, { status: 500 });
  }

  console.log(`[API/events/rsvp] User ${user.id} RSVP'd "${status}" to event ${slug}`);

  return NextResponse.json({
    success: true,
    rsvp,
    eventName: event.name,
  });
}

/**
 * DELETE - Remove RSVP
 */
async function handleDelete(request, { params }) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: 'Event slug is required' }, { status: 400 });
  }

  const auth = await authenticateRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { supabase, user } = auth;

  // Get event
  const event = await getEventBySlug(supabase, slug);
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  // Delete RSVP
  const { error: deleteError } = await supabase
    .from('event_rsvps')
    .delete()
    .eq('user_id', user.id)
    .eq('event_id', event.id);

  if (deleteError) {
    console.error('[API/events/rsvp] Error deleting RSVP:', deleteError);
    return NextResponse.json({ error: 'Failed to remove RSVP' }, { status: 500 });
  }

  console.log(`[API/events/rsvp] User ${user.id} removed RSVP from event ${slug}`);

  return NextResponse.json({
    success: true,
    removed: true,
  });
}

export const GET = withErrorLogging(handleGet, { route: 'events/rsvp', feature: 'events' });
export const POST = withErrorLogging(handlePost, { route: 'events/rsvp', feature: 'events' });
export const DELETE = withErrorLogging(handleDelete, { route: 'events/rsvp', feature: 'events' });
