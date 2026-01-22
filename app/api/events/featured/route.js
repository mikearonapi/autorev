import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { getPublicClient, isConfigured } from '@/lib/supabaseServer';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Force dynamic rendering - this route uses request.url for query params
export const dynamic = 'force-dynamic';

/**
 * GET /api/events/featured
 * 
 * Returns featured upcoming events.
 * Public endpoint - no auth required.
 * 
 * Query params:
 *   - limit: Max results (default 4, max 20)
 * 
 * Response:
 *   {
 *     events: [{...}],
 *     total: number
 *   }
 */
async function handleGet(request) {
  const supabase = getPublicClient();
  if (!isConfigured || !supabase) {
    return NextResponse.json({ events: [], total: 0 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit'), 10) || 4), 20);

  const { data: events, error, count } = await supabase
    .from('events')
    .select(`
      id,
      slug,
      name,
      description,
      start_date,
      end_date,
      start_time,
      end_time,
      venue_name,
      city,
      state,
      image_url,
      is_free,
      cost_text,
      featured,
      event_types (
        slug,
        name,
        icon,
        is_track_event
      )
    `, { count: 'exact' })
    .eq('status', 'approved')
    .eq('featured', true)
    .gte('start_date', new Date().toISOString().split('T')[0])
    .order('start_date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[API/events/featured] Error:', error);
    throw error;
  }

  // Transform to response shape
  const transformedEvents = (events || []).map(event => ({
    id: event.id,
    slug: event.slug,
    name: event.name,
    description: event.description,
    start_date: event.start_date,
    end_date: event.end_date,
    start_time: event.start_time,
    end_time: event.end_time,
    venue_name: event.venue_name,
    city: event.city,
    state: event.state,
    image_url: event.image_url,
    is_free: event.is_free,
    cost_text: event.cost_text,
    featured: event.featured,
    event_type: event.event_types ? {
      slug: event.event_types.slug,
      name: event.event_types.name,
      icon: event.event_types.icon,
      is_track_event: event.event_types.is_track_event,
    } : null,
  }));

  return NextResponse.json({
    events: transformedEvents,
    total: count || transformedEvents.length,
  });
}

export const GET = withErrorLogging(handleGet, { route: 'events/featured', feature: 'events' });








