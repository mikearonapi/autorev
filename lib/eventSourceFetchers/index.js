/**
 * Event Source Fetchers
 * 
 * Central dispatcher for event source fetchers.
 * Each fetcher is responsible for fetching events from a specific source
 * and normalizing them to our internal format.
 * 
 * @module lib/eventSourceFetchers
 */

import { fetchMotorsportRegEvents } from './motorsportreg.js';
import { fetchSCCAEvents } from './scca.js';
import { fetchPCAEvents } from './pca.js';
import { fetchEventbriteEvents } from './eventbrite.js';
import { fetchEventbriteSearchEvents } from './eventbritesearch.js';
import { fetchCarsAndCoffeeEvents } from './carsandcoffeeevents.js';
import { fetchFacebookEvents } from './facebookEvents.js';
import { fetchRideologyEvents } from './rideology.js';
import { fetchTrackVenueEvents } from './trackVenueFetcher.js';
import { fetchIcalEvents } from './icalAggregator.js';

/**
 * Map of source names to fetcher functions
 */
const FETCHERS = {
  motorsportreg: fetchMotorsportRegEvents,
  scca: fetchSCCAEvents,
  pca: fetchPCAEvents,
  eventbrite: fetchEventbriteEvents,
  eventbritesearch: fetchEventbriteSearchEvents,
  carsandcoffeeevents: fetchCarsAndCoffeeEvents,
  facebookevents: fetchFacebookEvents,
  rideology: fetchRideologyEvents,
  trackvenue: fetchTrackVenueEvents,
  ical: fetchIcalEvents,
};

/**
 * Get the appropriate fetcher for a source
 * 
 * @param {string} sourceName - Name of the event source
 * @returns {Function|null} - Fetcher function or null if not found
 */
export function getFetcher(sourceName) {
  const normalized = sourceName.toLowerCase().replace(/[^a-z]/g, '');
  return FETCHERS[normalized] || null;
}

/**
 * Fetch events from a source
 * 
 * @param {Object} source - Source configuration from event_sources table
 * @param {Object} [options] - Fetch options
 * @param {number} [options.limit] - Max events to fetch
 * @param {boolean} [options.dryRun] - Don't make actual requests
 * @returns {Promise<Object>} - { events: Event[], errors: string[] }
 */
export async function fetchFromSource(source, options = {}) {
  const fetcher = getFetcher(source.name);
  
  if (!fetcher) {
    console.error(`[EventSourceFetchers] No fetcher found for source: ${source.name}`);
    return {
      events: [],
      errors: [`No fetcher implemented for source: ${source.name}`],
    };
  }
  
  try {
    console.log(`[EventSourceFetchers] Fetching from ${source.name}...`);
    const result = await fetcher(source, options);
    console.log(`[EventSourceFetchers] Fetched ${result.events?.length || 0} events from ${source.name}`);
    return result;
  } catch (err) {
    console.error(`[EventSourceFetchers] Error fetching from ${source.name}:`, err);
    return {
      events: [],
      errors: [err.message],
    };
  }
}

/**
 * Normalize event data to our internal format
 * 
 * @param {Object} rawEvent - Raw event from source
 * @param {string} sourceName - Name of the source
 * @returns {Object} - Normalized event object
 */
export function normalizeEvent(rawEvent, sourceName) {
  return {
    name: rawEvent.name || rawEvent.title || 'Untitled Event',
    description: rawEvent.description || rawEvent.summary || null,
    event_type_slug: rawEvent.event_type_slug || rawEvent.type || 'other',
    start_date: rawEvent.start_date || rawEvent.date || null,
    end_date: rawEvent.end_date || null,
    start_time: rawEvent.start_time || null,
    end_time: rawEvent.end_time || null,
    timezone: rawEvent.timezone || 'America/New_York',
    venue_name: rawEvent.venue_name || rawEvent.venue || rawEvent.location || null,
    address: rawEvent.address || null,
    city: rawEvent.city || null,
    state: rawEvent.state || null,
    zip: rawEvent.zip || rawEvent.postal_code || null,
    country: rawEvent.country || 'USA',
    region: rawEvent.region || null,
    scope: rawEvent.scope || 'local',
    source_url: rawEvent.source_url || rawEvent.url || rawEvent.link || null,
    source_name: sourceName,
    registration_url: rawEvent.registration_url || rawEvent.register_url || null,
    image_url: rawEvent.image_url || rawEvent.image || null,
    cost_text: rawEvent.cost_text || rawEvent.price || null,
    is_free: rawEvent.is_free || rawEvent.price === 'Free' || rawEvent.price === '$0' || false,
    // Will be geocoded later
    latitude: rawEvent.latitude || null,
    longitude: rawEvent.longitude || null,
  };
}

/**
 * Map event type from source to our event_types slugs
 * 
 * @param {string} sourceType - Type string from source
 * @param {string} sourceName - Name of the source
 * @returns {string} - Our event_type slug
 */
export function mapEventType(sourceType, sourceName) {
  if (!sourceType) return 'other';
  
  const normalized = sourceType.toLowerCase();
  
  // Track events
  if (normalized.includes('track day') || normalized.includes('hpde') || 
      normalized.includes('open lapping') || normalized.includes('track rental')) {
    return 'track-day';
  }
  if (normalized.includes('autocross') || normalized.includes('autox') || 
      normalized.includes('solo') || normalized.includes('slalom')) {
    return 'autocross';
  }
  if (normalized.includes('time attack') || normalized.includes('time-attack')) {
    return 'time-attack';
  }
  
  // Social events
  if (normalized.includes('cars and coffee') || normalized.includes('cars & coffee') ||
      normalized.includes('c&c') || normalized.includes('morning meet')) {
    return 'cars-and-coffee';
  }
  if (normalized.includes('car show') || normalized.includes('concours') ||
      normalized.includes('show and shine') || normalized.includes('car display')) {
    return 'car-show';
  }
  if (normalized.includes('club') || normalized.includes('meetup') ||
      normalized.includes('meet up') || normalized.includes('gathering')) {
    return 'club-meetup';
  }
  if (normalized.includes('cruise') || normalized.includes('drive') ||
      normalized.includes('rally') || normalized.includes('tour')) {
    return 'cruise';
  }
  
  // Industry/other
  if (normalized.includes('auction')) {
    return 'auction';
  }
  if (normalized.includes('sema') || normalized.includes('show') && normalized.includes('industry')) {
    return 'industry';
  }
  
  return 'other';
}

/**
 * US Regions - More granular breakdown for better event filtering
 * 
 * Regions:
 * - New England: Traditional New England states
 * - Mid-Atlantic: NY to VA corridor including DC metro
 * - Southeast: Deep South + Florida
 * - Great Lakes: Industrial Midwest around the lakes
 * - Plains: Agricultural heartland
 * - Southwest: TX, OK, and desert states
 * - Mountain: Rocky Mountain states
 * - Pacific: West Coast + Alaska/Hawaii
 */
export const REGIONS = {
  'New England': ['ME', 'NH', 'VT', 'MA', 'RI', 'CT'],
  'Mid-Atlantic': ['NY', 'NJ', 'PA', 'DE', 'MD', 'DC', 'VA', 'WV'],
  'Southeast': ['NC', 'SC', 'GA', 'FL', 'AL', 'MS', 'LA', 'TN', 'KY', 'AR'],
  'Great Lakes': ['OH', 'MI', 'IN', 'IL', 'WI', 'MN'],
  'Plains': ['IA', 'MO', 'KS', 'NE', 'SD', 'ND'],
  'Southwest': ['TX', 'OK', 'AZ', 'NM'],
  'Mountain': ['CO', 'UT', 'WY', 'MT', 'ID'],
  'Pacific': ['CA', 'NV', 'OR', 'WA', 'AK', 'HI'],
};

// Build reverse lookup: state -> region
const STATE_TO_REGION = {};
for (const [region, states] of Object.entries(REGIONS)) {
  for (const state of states) {
    STATE_TO_REGION[state] = region;
  }
}

/**
 * Determine region from state code
 * 
 * @param {string} state - US state code
 * @returns {string|null} - Region name or null
 */
export function getRegionFromState(state) {
  if (!state) return null;
  return STATE_TO_REGION[state.toUpperCase()] || null;
}

/**
 * Get all states in a region
 * 
 * @param {string} region - Region name
 * @returns {string[]} - Array of state codes
 */
export function getStatesInRegion(region) {
  return REGIONS[region] || [];
}

/**
 * Get all region names
 * 
 * @returns {string[]} - Array of region names
 */
export function getAllRegions() {
  return Object.keys(REGIONS);
}

const eventSourceFetchers = {
  getFetcher,
  fetchFromSource,
  normalizeEvent,
  mapEventType,
  getRegionFromState,
  getStatesInRegion,
  getAllRegions,
  REGIONS,
};

export default eventSourceFetchers;

