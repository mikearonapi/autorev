import { NextResponse } from 'next/server';
import { getEventTypes } from '@/lib/eventsService';

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
export async function GET() {
  try {
    const types = await getEventTypes();
    
    // Event types rarely change - cache for 24 hours
    return new NextResponse(JSON.stringify({ types }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
      },
    });
  } catch (err) {
    console.error('[API/events/types] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch event types', code: 'EVENT_TYPES_FETCH_ERROR' },
      { status: 500 }
    );
  }
}

