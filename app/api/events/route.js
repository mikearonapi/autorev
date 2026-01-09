import { NextResponse } from 'next/server';
import { searchEvents } from '@/lib/eventsService';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Force dynamic rendering - this route uses request.url for query params
export const dynamic = 'force-dynamic';

/**
 * GET /api/events
 * 
 * Returns a paginated list of upcoming car events with filtering.
 * Public endpoint - no auth required.
 * 
 * Query params:
 *   - query: Text search for event name (case-insensitive, partial match)
 *   - location: Flexible location input - accepts ZIP code (e.g., "20175") or "City, State" (e.g., "Leesburg, VA")
 *   - zip: ZIP code for location filtering (legacy, prefer location)
 *   - lat: Direct latitude (from Google Places, skips server-side geocoding)
 *   - lng: Direct longitude (from Google Places, skips server-side geocoding)
 *   - radius: Radius in miles (requires location/zip or lat/lng, default 50, max 500)
 *   - city: City name for filtering (exact match)
 *   - state: State code for filtering
 *   - region: Region name (Northeast, Southeast, Midwest, Southwest, West)
 *   - scope: Event scope (local, regional, national)
 *   - type: Event type slug (e.g., 'cars-and-coffee', 'track-day')
 *   - is_track_event: Filter to track events only (boolean)
 *   - is_free: Filter to free events only (boolean)
 *   - brand: Filter by car brand affinity
 *   - car_slug: Filter by specific car affinity
 *   - start_after: ISO date string, events after this date
 *   - start_before: ISO date string, events before this date
 *   - limit: Max results (default 20, max 100)
 *   - offset: Pagination offset (default 0)
 *   - sort: Sort order - 'date', 'featured', or 'distance' (default 'date')
 *   - group_recurring: Group recurring events into single entries (boolean, default false)
 * 
 * Response:
 *   {
 *     events: [{...}],
 *     total: number,
 *     limit: number,
 *     offset: number,
 *     grouped: boolean,
 *     ungrouped_total?: number, // Only when group_recurring=true
 *     searchCenter?: { latitude, longitude, radius, location } // Only when radius search used
 *   }
 * 
 * Note: When radius search is used, events include distance_miles field
 * Note: When group_recurring=true, recurring events include is_recurring, upcoming_occurrences, series info
 */
async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  
  // Build params from query string
  const params = {
    query: searchParams.get('query'),
    location: searchParams.get('location'),
    zip: searchParams.get('zip'),
    lat: searchParams.get('lat'),
    lng: searchParams.get('lng'),
    radius: searchParams.get('radius'),
    city: searchParams.get('city'),
    state: searchParams.get('state'),
    region: searchParams.get('region'),
    scope: searchParams.get('scope'),
    type: searchParams.get('type'),
    is_track_event: searchParams.get('is_track_event'),
    is_free: searchParams.get('is_free'),
    brand: searchParams.get('brand'),
    car_slug: searchParams.get('car_slug'),
    start_after: searchParams.get('start_after'),
    start_before: searchParams.get('start_before'),
    limit: searchParams.get('limit'),
    offset: searchParams.get('offset'),
    sort: searchParams.get('sort'),
    group_recurring: searchParams.get('group_recurring'),
  };
  
  // Remove null/undefined values
  Object.keys(params).forEach(key => {
    if (params[key] === null || params[key] === undefined) {
      delete params[key];
    }
  });
  
  // Parse boolean values
  if (params.is_track_event !== undefined) {
    params.is_track_event = params.is_track_event === 'true';
  }
  if (params.is_free !== undefined) {
    params.is_free = params.is_free === 'true';
  }
  if (params.group_recurring !== undefined) {
    params.group_recurring = params.group_recurring === 'true';
  }
  
  const result = await searchEvents(params);
  
  return NextResponse.json(result);
}

export const GET = withErrorLogging(handleGet, { route: 'events', feature: 'events' });

