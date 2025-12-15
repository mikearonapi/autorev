import { NextResponse } from 'next/server';
import { getEventBySlug } from '@/lib/eventsService';

/**
 * GET /api/events/[slug]
 * 
 * Returns a single event by its slug.
 * Public endpoint - no auth required.
 * Only returns approved events.
 * 
 * Response:
 *   Full event object with car_affinities
 * 
 * Error responses:
 *   404 - Event not found or not approved
 *   500 - Server error
 */
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Event slug is required', code: 'MISSING_SLUG' },
        { status: 400 }
      );
    }
    
    const event = await getEventBySlug(slug);
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ event });
  } catch (err) {
    console.error('[API/events/[slug]] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch event', code: 'EVENT_FETCH_ERROR' },
      { status: 500 }
    );
  }
}

