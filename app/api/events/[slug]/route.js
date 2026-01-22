import { NextResponse } from 'next/server';
import { getEventBySlug } from '@/lib/eventsService';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { errors } from '@/lib/apiErrors';

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
async function handleGet(request, { params }) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return errors.missingField('slug');
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
    return errors.internal('Failed to fetch event');
  }
}

export const GET = withErrorLogging(handleGet, { route: 'events/[slug]', feature: 'events' });

