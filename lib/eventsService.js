/**
 * Events Service
 * 
 * Provides functions to fetch and manage car events data from Supabase.
 * Supports filtering by location, event type, date range, car affinities,
 * and radius-based search using geocoding.
 * 
 * @module lib/eventsService
 */

import { supabase, supabaseServiceRole, isSupabaseConfigured } from './supabase.js';
import { geocodeZip, geocodeLocation, calculateDistanceMiles } from './geocodingService.js';

/**
 * Default pagination limits
 */
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Valid region values for filtering
 */
export const REGIONS = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'];

/**
 * Valid scope values for filtering
 */
export const SCOPES = ['local', 'regional', 'national'];

/**
 * Default and max radius for search
 */
const DEFAULT_RADIUS = 50;
const MAX_RADIUS = 500;

/**
 * Search events with filters
 * 
 * @param {Object} params - Search parameters
 * @param {string} [params.location] - Flexible location input - ZIP code or "City, State"
 * @param {string} [params.zip] - ZIP code for location filtering (legacy, prefer location)
 * @param {number} [params.radius] - Radius in miles (requires location/zip, default 50, max 500)
 * @param {string} [params.city] - City name for exact filtering
 * @param {string} [params.state] - State code for filtering
 * @param {string} [params.region] - Region name (Northeast, Southeast, etc.)
 * @param {string} [params.scope] - Event scope (local, regional, national)
 * @param {string} [params.type] - Event type slug
 * @param {boolean} [params.is_track_event] - Filter to track events only
 * @param {boolean} [params.is_free] - Filter to free events only
 * @param {string} [params.brand] - Filter by car brand affinity
 * @param {string} [params.car_slug] - Filter by specific car affinity
 * @param {string} [params.start_after] - ISO date string, events after this date
 * @param {string} [params.start_before] - ISO date string, events before this date
 * @param {number} [params.limit=20] - Max results (capped at 100)
 * @param {number} [params.offset=0] - Pagination offset
 * @param {string} [params.sort='date'] - Sort order: 'date', 'featured', or 'distance' (when radius search)
 * @returns {Promise<{events: Object[], total: number, limit: number, offset: number, searchCenter?: Object}>}
 */
export async function searchEvents(params = {}) {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[eventsService] Supabase not configured');
    return { events: [], total: 0, limit: DEFAULT_LIMIT, offset: 0 };
  }

  try {
    const {
      location,
      zip,
      radius,
      city,
      state,
      region,
      scope,
      type,
      is_track_event,
      is_free,
      brand,
      car_slug,
      start_after,
      start_before,
      limit = DEFAULT_LIMIT,
      offset = 0,
      sort = 'date',
    } = params;
    
    // Handle radius search - use location param or fall back to zip
    let searchCenter = null;
    let effectiveRadius = null;
    let locationInput = location || zip;
    
    if (locationInput && radius) {
      effectiveRadius = Math.min(Math.max(1, parseInt(radius, 10) || DEFAULT_RADIUS), MAX_RADIUS);
      
      // Use the flexible geocodeLocation function that handles both ZIP and "City, State"
      searchCenter = await geocodeLocation(locationInput);
      
      if (!searchCenter) {
        console.warn('[eventsService] Could not geocode location:', locationInput);
        // Fall back to exact city/state match if geocoding fails
      }
    }

    // Clamp limit
    const effectiveLimit = Math.min(Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT), MAX_LIMIT);
    const effectiveOffset = Math.max(0, parseInt(offset, 10) || 0);

    // Build base query - select events with type info
    // Include latitude/longitude for radius search
    let query = supabase
      .from('events')
      .select(`
        id,
        slug,
        name,
        description,
        event_type_id,
        start_date,
        end_date,
        start_time,
        end_time,
        timezone,
        venue_name,
        city,
        state,
        zip,
        latitude,
        longitude,
        region,
        scope,
        source_url,
        source_name,
        registration_url,
        image_url,
        cost_text,
        is_free,
        featured,
        event_types!inner (
          slug,
          name,
          icon,
          is_track_event
        )
      `, { count: 'exact' })
      .eq('status', 'approved');
    
    // Only filter to upcoming events if no start_after date is provided
    // This allows the caller to explicitly request past events
    if (!start_after) {
      query = query.gte('start_date', new Date().toISOString().split('T')[0]);
    }

    // Location filters
    // If doing radius search with valid center, skip exact ZIP match
    if (zip && !searchCenter) {
      query = query.eq('zip', zip);
    }
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }
    if (state) {
      query = query.eq('state', state.toUpperCase());
    }
    if (region && REGIONS.includes(region)) {
      query = query.eq('region', region);
    }
    if (scope && SCOPES.includes(scope)) {
      query = query.eq('scope', scope);
    }

    // Event type filters
    if (type) {
      query = query.eq('event_types.slug', type);
    }
    if (is_track_event === true || is_track_event === 'true') {
      query = query.eq('event_types.is_track_event', true);
    }
    if (is_free === true || is_free === 'true') {
      query = query.eq('is_free', true);
    }

    // Date range filters
    if (start_after) {
      query = query.gte('start_date', start_after);
    }
    if (start_before) {
      query = query.lte('start_date', start_before);
    }

    // Sorting
    if (sort === 'featured') {
      query = query.order('featured', { ascending: false }).order('start_date', { ascending: true });
    } else {
      // Default: featured first, then by date
      query = query.order('featured', { ascending: false }).order('start_date', { ascending: true });
    }

    // Pagination
    query = query.range(effectiveOffset, effectiveOffset + effectiveLimit - 1);

    const { data: events, error, count } = await query;

    if (error) {
      console.error('[eventsService] Error searching events:', error);
      throw error;
    }

    // If brand or car_slug filter, we need to filter by affinities
    let filteredEvents = events || [];
    
    if (brand || car_slug) {
      // Get event IDs that have matching affinities
      const eventIds = filteredEvents.map(e => e.id);
      
      if (eventIds.length > 0) {
        let affinityQuery = supabase
          .from('event_car_affinities')
          .select('event_id')
          .in('event_id', eventIds);
        
        if (brand) {
          affinityQuery = affinityQuery.ilike('brand', `%${brand}%`);
        }
        
        if (car_slug) {
          // Join with cars table to get car_id from slug
          const { data: carData } = await supabase
            .from('cars')
            .select('id')
            .eq('slug', car_slug)
            .single();
          
          if (carData) {
            affinityQuery = affinityQuery.eq('car_id', carData.id);
          }
        }
        
        const { data: matchingAffinities } = await affinityQuery;
        
        if (matchingAffinities) {
          const matchingEventIds = new Set(matchingAffinities.map(a => a.event_id));
          filteredEvents = filteredEvents.filter(e => matchingEventIds.has(e.id));
        }
      }
    }

    // Fetch car affinities for all events
    const eventIds = filteredEvents.map(e => e.id);
    let affinitiesMap = {};
    
    if (eventIds.length > 0) {
      const { data: affinities } = await supabase
        .from('event_car_affinities')
        .select(`
          event_id,
          car_id,
          brand,
          affinity_type,
          cars (
            slug,
            name
          )
        `)
        .in('event_id', eventIds);

      if (affinities) {
        affinities.forEach(aff => {
          if (!affinitiesMap[aff.event_id]) {
            affinitiesMap[aff.event_id] = [];
          }
          affinitiesMap[aff.event_id].push({
            car_id: aff.car_id,
            car_slug: aff.cars?.slug || null,
            car_name: aff.cars?.name || null,
            brand: aff.brand,
            affinity_type: aff.affinity_type,
          });
        });
      }
    }

    // Apply radius filtering if we have a search center
    if (searchCenter && effectiveRadius) {
      filteredEvents = filteredEvents.filter(event => {
        if (!event.latitude || !event.longitude) {
          // Include events without coordinates if they're in the same state/region
          // This is a fallback for events that haven't been geocoded yet
          return false;
        }
        
        const distance = calculateDistanceMiles(
          searchCenter.latitude,
          searchCenter.longitude,
          parseFloat(event.latitude),
          parseFloat(event.longitude)
        );
        
        // Add distance to event for response
        event._distance_miles = Math.round(distance * 10) / 10;
        
        return distance <= effectiveRadius;
      });
      
      // Sort by distance when doing radius search (unless explicitly sorting by something else)
      if (sort === 'distance' || sort === 'date') {
        filteredEvents.sort((a, b) => {
          // Featured events still first if sorting by date
          if (sort === 'date' && a.featured !== b.featured) {
            return b.featured ? 1 : -1;
          }
          // Then by distance
          return (a._distance_miles || 0) - (b._distance_miles || 0);
        });
      }
    }

    // Transform events to response shape
    const transformedEvents = filteredEvents.map(event => {
      const transformed = {
        id: event.id,
        slug: event.slug,
        name: event.name,
        description: event.description,
        event_type: event.event_types ? {
          slug: event.event_types.slug,
          name: event.event_types.name,
          icon: event.event_types.icon,
          is_track_event: event.event_types.is_track_event,
        } : null,
        start_date: event.start_date,
        end_date: event.end_date,
        start_time: event.start_time,
        end_time: event.end_time,
        timezone: event.timezone,
        venue_name: event.venue_name,
        city: event.city,
        state: event.state,
        zip: event.zip,
        region: event.region,
        scope: event.scope,
        source_url: event.source_url,
        source_name: event.source_name,
        registration_url: event.registration_url,
        image_url: event.image_url,
        cost_text: event.cost_text,
        is_free: event.is_free,
        featured: event.featured,
        car_affinities: affinitiesMap[event.id] || [],
      };
      
      // Include distance if radius search was used
      if (event._distance_miles !== undefined) {
        transformed.distance_miles = event._distance_miles;
      }
      
      return transformed;
    });

    const response = {
      events: transformedEvents,
      total: searchCenter ? transformedEvents.length : (count || transformedEvents.length),
      limit: effectiveLimit,
      offset: effectiveOffset,
    };
    
    // Include search center info when radius search is used
    if (searchCenter) {
      response.searchCenter = {
        latitude: searchCenter.latitude,
        longitude: searchCenter.longitude,
        radius: effectiveRadius,
        location: locationInput,
      };
    }
    
    return response;
  } catch (err) {
    console.error('[eventsService] Unexpected error:', err);
    return { events: [], total: 0, limit: DEFAULT_LIMIT, offset: 0 };
  }
}

/**
 * Get a single event by slug
 * 
 * @param {string} slug - Event slug
 * @returns {Promise<Object|null>} - Event object or null if not found/not approved
 */
export async function getEventBySlug(slug) {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[eventsService] Supabase not configured');
    return null;
  }

  if (!slug) {
    return null;
  }

  try {
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        event_types (
          slug,
          name,
          description,
          icon,
          is_track_event
        )
      `)
      .eq('slug', slug)
      .eq('status', 'approved')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('[eventsService] Error fetching event by slug:', error);
      throw error;
    }

    if (!event) {
      return null;
    }

    // Fetch car affinities
    const { data: affinities } = await supabase
      .from('event_car_affinities')
      .select(`
        car_id,
        brand,
        affinity_type,
        cars (
          slug,
          name
        )
      `)
      .eq('event_id', event.id);

    // Transform to response shape
    return {
      id: event.id,
      slug: event.slug,
      name: event.name,
      description: event.description,
      event_type: event.event_types ? {
        slug: event.event_types.slug,
        name: event.event_types.name,
        description: event.event_types.description,
        icon: event.event_types.icon,
        is_track_event: event.event_types.is_track_event,
      } : null,
      start_date: event.start_date,
      end_date: event.end_date,
      start_time: event.start_time,
      end_time: event.end_time,
      timezone: event.timezone,
      venue_name: event.venue_name,
      address: event.address,
      city: event.city,
      state: event.state,
      zip: event.zip,
      country: event.country,
      latitude: event.latitude,
      longitude: event.longitude,
      region: event.region,
      scope: event.scope,
      source_url: event.source_url,
      source_name: event.source_name,
      registration_url: event.registration_url,
      image_url: event.image_url,
      cost_text: event.cost_text,
      is_free: event.is_free,
      featured: event.featured,
      car_affinities: (affinities || []).map(aff => ({
        car_id: aff.car_id,
        car_slug: aff.cars?.slug || null,
        car_name: aff.cars?.name || null,
        brand: aff.brand,
        affinity_type: aff.affinity_type,
      })),
    };
  } catch (err) {
    console.error('[eventsService] Unexpected error fetching event:', err);
    return null;
  }
}

/**
 * Get all event types
 * 
 * @returns {Promise<Object[]>} - Array of event type objects
 */
export async function getEventTypes() {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[eventsService] Supabase not configured');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('event_types')
      .select('slug, name, description, icon, is_track_event, sort_order')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[eventsService] Error fetching event types:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('[eventsService] Unexpected error fetching event types:', err);
    return [];
  }
}

/**
 * Get related events (same type OR same region)
 * 
 * @param {string} eventSlug - Current event slug to exclude
 * @param {Object} criteria - Criteria for related events
 * @param {string} [criteria.eventTypeSlug] - Event type slug
 * @param {string} [criteria.region] - Region name
 * @param {number} [limit=4] - Max results
 * @returns {Promise<Object[]>} - Array of related event objects
 */
export async function getRelatedEvents(eventSlug, criteria = {}, limit = 4) {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('[eventsService] Supabase not configured');
    return [];
  }

  try {
    const { eventTypeSlug, region } = criteria;
    
    // Get event type id if we have a slug
    let eventTypeId = null;
    if (eventTypeSlug) {
      const { data: typeData } = await supabase
        .from('event_types')
        .select('id')
        .eq('slug', eventTypeSlug)
        .single();
      eventTypeId = typeData?.id;
    }

    let query = supabase
      .from('events')
      .select(`
        id,
        slug,
        name,
        start_date,
        start_time,
        city,
        state,
        image_url,
        is_free,
        cost_text,
        event_types (
          slug,
          name,
          icon,
          is_track_event
        )
      `)
      .eq('status', 'approved')
      .neq('slug', eventSlug)
      .gte('start_date', new Date().toISOString().split('T')[0]);

    // Filter by type or region
    if (eventTypeId && region) {
      // Match either type or region
      query = query.or(`event_type_id.eq.${eventTypeId},region.eq.${region}`);
    } else if (eventTypeId) {
      query = query.eq('event_type_id', eventTypeId);
    } else if (region) {
      query = query.eq('region', region);
    }

    query = query
      .order('start_date', { ascending: true })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      console.error('[eventsService] Error fetching related events:', error);
      throw error;
    }

    return (data || []).map(event => ({
      id: event.id,
      slug: event.slug,
      name: event.name,
      start_date: event.start_date,
      start_time: event.start_time,
      city: event.city,
      state: event.state,
      image_url: event.image_url,
      is_free: event.is_free,
      cost_text: event.cost_text,
      event_type: event.event_types ? {
        slug: event.event_types.slug,
        name: event.event_types.name,
        icon: event.event_types.icon,
        is_track_event: event.event_types.is_track_event,
      } : null,
    }));
  } catch (err) {
    console.error('[eventsService] Unexpected error fetching related events:', err);
    return [];
  }
}

export default {
  searchEvents,
  getEventBySlug,
  getEventTypes,
  getRelatedEvents,
  REGIONS,
  SCOPES,
};

