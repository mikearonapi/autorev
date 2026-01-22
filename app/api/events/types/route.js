import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { getEventTypes } from '@/lib/eventsService';
import { withErrorLogging } from '@/lib/serverErrorLogger';

/**
 * GET /api/events/types
 * 
 * Returns all event types for filtering and display.
 * Public endpoint - no auth required.
 * Ordered by sort_order ascending.
 * 
 * Response:
 *   {
 *     types: [{
 *       slug: string,
 *       name: string,
 *       description: string,
 *       icon: string,
 *       is_track_event: boolean,
 *       sort_order: number
 *     }]
 *   }
 */
async function handleGet() {
  const types = await getEventTypes();
  
  // Event types rarely change - cache for 24 hours
  return new NextResponse(JSON.stringify({ types }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
    },
  });
}

export const GET = withErrorLogging(handleGet, { route: 'events/types', feature: 'events' });

