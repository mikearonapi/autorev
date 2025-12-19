/**
 * Track Venue Calendar Fetcher
 * 
 * Fetches events directly from major US racing track venue calendars.
 * This is the most reliable source for HPDE, autocross, and time attack events
 * since it comes straight from the venues themselves.
 * 
 * Data Sources:
 * - iCal feeds (preferred - structured, reliable)
 * - Google Calendar embeds
 * - JSON APIs (if available)
 * - Structured data (JSON-LD) from event pages
 * 
 * @module lib/eventSourceFetchers/trackVenueFetcher
 */

import { mapEventType, getRegionFromState } from './index.js';

/**
 * US Racing Tracks Database
 * 
 * Priority tracks with known calendar sources.
 * calendarType: 'ical' | 'json' | 'html' | 'google'
 */
const TRACK_VENUES = [
  // Southeast Region
  {
    slug: 'road-atlanta',
    name: 'Road Atlanta',
    city: 'Braselton',
    state: 'GA',
    calendarUrl: 'https://www.roadatlanta.com/calendar/',
    calendarType: 'html',
    region: 'Southeast',
  },
  {
    slug: 'barber-motorsports-park',
    name: 'Barber Motorsports Park',
    city: 'Birmingham',
    state: 'AL',
    calendarUrl: 'https://www.barberracingevents.com/calendar/',
    calendarType: 'html',
    region: 'Southeast',
  },
  {
    slug: 'sebring',
    name: 'Sebring International Raceway',
    city: 'Sebring',
    state: 'FL',
    calendarUrl: 'https://www.sebringraceway.com/calendar/',
    calendarType: 'html',
    region: 'Southeast',
  },
  {
    slug: 'daytona',
    name: 'Daytona International Speedway',
    city: 'Daytona Beach',
    state: 'FL',
    calendarUrl: 'https://www.daytonainternationalspeedway.com/events/',
    calendarType: 'html',
    region: 'Southeast',
  },
  {
    slug: 'atlanta-motorsports-park',
    name: 'Atlanta Motorsports Park',
    city: 'Dawsonville',
    state: 'GA',
    calendarUrl: 'https://www.atlantamotorsportspark.com/calendar/',
    calendarType: 'html',
    region: 'Southeast',
  },
  
  // Mid-Atlantic Region
  {
    slug: 'vir',
    name: 'Virginia International Raceway',
    city: 'Alton',
    state: 'VA',
    calendarUrl: 'https://virnow.com/events/',
    calendarType: 'html',
    region: 'Mid-Atlantic',
  },
  {
    slug: 'summit-point',
    name: 'Summit Point Motorsports Park',
    city: 'Summit Point',
    state: 'WV',
    calendarUrl: 'https://summitpoint-raceway.com/calendar/',
    calendarType: 'html',
    region: 'Mid-Atlantic',
  },
  {
    slug: 'njmp',
    name: 'New Jersey Motorsports Park',
    city: 'Millville',
    state: 'NJ',
    calendarUrl: 'https://njmp.com/schedule/',
    calendarType: 'html',
    region: 'Mid-Atlantic',
  },
  {
    slug: 'pocono',
    name: 'Pocono Raceway',
    city: 'Long Pond',
    state: 'PA',
    calendarUrl: 'https://www.poconoraceway.com/events/',
    calendarType: 'html',
    region: 'Mid-Atlantic',
  },
  
  // Northeast Region
  {
    slug: 'watkins-glen',
    name: 'Watkins Glen International',
    city: 'Watkins Glen',
    state: 'NY',
    calendarUrl: 'https://www.theglen.com/events/',
    calendarType: 'html',
    region: 'New England',
  },
  {
    slug: 'lime-rock',
    name: 'Lime Rock Park',
    city: 'Lakeville',
    state: 'CT',
    calendarUrl: 'https://www.limerock.com/events/',
    calendarType: 'html',
    region: 'New England',
  },
  {
    slug: 'thompson-speedway',
    name: 'Thompson Speedway Motorsports Park',
    city: 'Thompson',
    state: 'CT',
    calendarUrl: 'https://thompsonspeedway.com/events/',
    calendarType: 'html',
    region: 'New England',
  },
  
  // Great Lakes Region
  {
    slug: 'road-america',
    name: 'Road America',
    city: 'Elkhart Lake',
    state: 'WI',
    calendarUrl: 'https://www.roadamerica.com/events/',
    calendarType: 'html',
    region: 'Great Lakes',
  },
  {
    slug: 'mid-ohio',
    name: 'Mid-Ohio Sports Car Course',
    city: 'Lexington',
    state: 'OH',
    calendarUrl: 'https://www.midohio.com/events/',
    calendarType: 'html',
    region: 'Great Lakes',
  },
  {
    slug: 'grattan',
    name: 'Grattan Raceway',
    city: 'Belding',
    state: 'MI',
    calendarUrl: 'https://www.grfrp.org/schedule/',
    calendarType: 'html',
    region: 'Great Lakes',
  },
  {
    slug: 'autobahn-country-club',
    name: 'Autobahn Country Club',
    city: 'Joliet',
    state: 'IL',
    calendarUrl: 'https://autobahncc.com/calendar/',
    calendarType: 'html',
    region: 'Great Lakes',
  },
  {
    slug: 'gingerman',
    name: 'GingerMan Raceway',
    city: 'South Haven',
    state: 'MI',
    calendarUrl: 'https://gingermanraceway.com/schedule/',
    calendarType: 'html',
    region: 'Great Lakes',
  },
  
  // Pacific Region
  {
    slug: 'laguna-seca',
    name: 'WeatherTech Raceway Laguna Seca',
    city: 'Monterey',
    state: 'CA',
    calendarUrl: 'https://www.weathertechraceway.com/events',
    calendarType: 'html',
    region: 'Pacific',
  },
  {
    slug: 'sonoma',
    name: 'Sonoma Raceway',
    city: 'Sonoma',
    state: 'CA',
    calendarUrl: 'https://www.sonomaraceway.com/events/',
    calendarType: 'html',
    region: 'Pacific',
  },
  {
    slug: 'thunderhill',
    name: 'Thunderhill Raceway Park',
    city: 'Willows',
    state: 'CA',
    calendarUrl: 'https://thunderhill.com/calendar/',
    calendarType: 'html',
    region: 'Pacific',
  },
  {
    slug: 'buttonwillow',
    name: 'Buttonwillow Raceway Park',
    city: 'Buttonwillow',
    state: 'CA',
    calendarUrl: 'https://buttonwillowraceway.com/schedule/',
    calendarType: 'html',
    region: 'Pacific',
  },
  {
    slug: 'pacific-raceways',
    name: 'Pacific Raceways',
    city: 'Kent',
    state: 'WA',
    calendarUrl: 'https://www.pacificraceways.com/schedule/',
    calendarType: 'html',
    region: 'Pacific',
  },
  {
    slug: 'portland',
    name: 'Portland International Raceway',
    city: 'Portland',
    state: 'OR',
    calendarUrl: 'https://portlandraceway.com/schedule/',
    calendarType: 'html',
    region: 'Pacific',
  },
  
  // Southwest Region
  {
    slug: 'cota',
    name: 'Circuit of the Americas',
    city: 'Austin',
    state: 'TX',
    calendarUrl: 'https://www.circuitoftheamericas.com/events',
    calendarType: 'html',
    region: 'Southwest',
  },
  {
    slug: 'motorsport-ranch',
    name: 'Motorsport Ranch',
    city: 'Cresson',
    state: 'TX',
    calendarUrl: 'https://www.motorsportranch.com/schedule/',
    calendarType: 'html',
    region: 'Southwest',
  },
  {
    slug: 'harris-hill',
    name: 'Harris Hill Raceway',
    city: 'San Marcos',
    state: 'TX',
    calendarUrl: 'https://harrishillraceway.com/calendar/',
    calendarType: 'html',
    region: 'Southwest',
  },
  {
    slug: 'phoenix-raceway',
    name: 'Phoenix Raceway',
    city: 'Avondale',
    state: 'AZ',
    calendarUrl: 'https://www.phoenixraceway.com/events/',
    calendarType: 'html',
    region: 'Southwest',
  },
  
  // Mountain Region
  {
    slug: 'high-plains',
    name: 'High Plains Raceway',
    city: 'Deer Trail',
    state: 'CO',
    calendarUrl: 'https://highplainsraceway.com/schedule/',
    calendarType: 'html',
    region: 'Mountain',
  },
  {
    slug: 'utah-motorsports-campus',
    name: 'Utah Motorsports Campus',
    city: 'Tooele',
    state: 'UT',
    calendarUrl: 'https://utahmotorsportscampus.com/calendar/',
    calendarType: 'html',
    region: 'Mountain',
  },
];

/**
 * Request delay to be respectful to track websites
 */
const REQUEST_DELAY_MS = 1500;

/**
 * User agent for requests
 */
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch HTML with retries
 * 
 * @param {string} url 
 * @param {number} retries 
 * @returns {Promise<string>}
 */
async function fetchHtml(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      if (attempt === retries) throw error;
      await sleep(1000 * (attempt + 1));
    }
  }
}

/**
 * Extract JSON-LD structured data from HTML
 * 
 * @param {string} html 
 * @returns {Object[]} Array of Event objects
 */
function extractJsonLdEvents(html) {
  const events = [];
  
  // Find all JSON-LD script tags
  const jsonLdPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  
  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      
      // Handle single event or array of events
      const items = Array.isArray(data) ? data : (data['@graph'] || [data]);
      
      for (const item of items) {
        if (item['@type'] === 'Event' || 
            (Array.isArray(item['@type']) && item['@type'].includes('Event'))) {
          events.push(item);
        }
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  }
  
  return events;
}

/**
 * Parse a JSON-LD Event object to our format
 * 
 * @param {Object} jsonLd - JSON-LD Event object
 * @param {Object} track - Track venue info
 * @returns {Object|null}
 */
function parseJsonLdEvent(jsonLd, track) {
  if (!jsonLd.name || !jsonLd.startDate) return null;
  
  const location = jsonLd.location || {};
  const address = location.address || {};
  
  // Parse start date
  let startDate = null;
  let startTime = null;
  try {
    const sd = new Date(jsonLd.startDate);
    if (!isNaN(sd.getTime())) {
      startDate = sd.toISOString().slice(0, 10);
      const time = sd.toISOString().slice(11, 16);
      if (time !== '00:00') {
        startTime = `${time}:00`;
      }
    }
  } catch (e) {}
  
  // Parse end date
  let endDate = null;
  let endTime = null;
  if (jsonLd.endDate) {
    try {
      const ed = new Date(jsonLd.endDate);
      if (!isNaN(ed.getTime())) {
        endDate = ed.toISOString().slice(0, 10);
        const time = ed.toISOString().slice(11, 16);
        if (time !== '00:00') {
          endTime = `${time}:00`;
        }
      }
    } catch (e) {}
  }
  
  if (!startDate) return null;
  
  // Determine event type from name
  const eventTypeSlug = mapEventType(jsonLd.name, 'trackVenue');
  
  return {
    name: jsonLd.name.trim(),
    description: jsonLd.description || null,
    event_type_slug: eventTypeSlug,
    start_date: startDate,
    end_date: endDate,
    start_time: startTime,
    end_time: endTime,
    timezone: 'America/New_York', // TODO: derive from track location
    venue_name: track.name,
    address: typeof address === 'string' ? address : address.streetAddress || null,
    city: track.city,
    state: track.state,
    zip: address.postalCode || null,
    country: 'USA',
    region: track.region || getRegionFromState(track.state),
    scope: 'regional',
    source_url: jsonLd.url || track.calendarUrl,
    source_name: `Track: ${track.name}`,
    registration_url: jsonLd.url || null,
    image_url: jsonLd.image || null,
    cost_text: jsonLd.offers?.price ? `$${jsonLd.offers.price}` : null,
    is_free: jsonLd.isAccessibleForFree || false,
    latitude: location.geo?.latitude || null,
    longitude: location.geo?.longitude || null,
  };
}

/**
 * Extract event links from track calendar HTML
 * 
 * @param {string} html 
 * @param {string} baseUrl 
 * @returns {string[]} Array of event URLs
 */
function extractEventLinks(html, baseUrl) {
  const links = new Set();
  
  // Common patterns for event links
  const patterns = [
    // Generic event links
    /href=["'](\/events?\/[^"']+)["']/gi,
    /href=["'](https?:\/\/[^"']*\/events?\/[^"']+)["']/gi,
    // Specific calendar patterns
    /href=["'](\/calendar\/[^"']+)["']/gi,
    /href=["'](\/schedule\/[^"']+)["']/gi,
    // Event ID patterns
    /href=["'](\/event\/\d+[^"']*)["']/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let url = match[1];
      
      // Make absolute URL
      if (url.startsWith('/')) {
        try {
          const base = new URL(baseUrl);
          url = `${base.origin}${url}`;
        } catch (e) {
          continue;
        }
      }
      
      // Filter out non-event pages
      if (url.includes('/login') || url.includes('/register') || 
          url.includes('/cart') || url.includes('/checkout') ||
          url.includes('/contact') || url.includes('/about') ||
          url.includes('.pdf') || url.includes('.jpg') || url.includes('.png')) {
        continue;
      }
      
      links.add(url);
    }
  }
  
  return Array.from(links);
}

/**
 * Parse event details from an event page HTML
 * 
 * @param {string} html 
 * @param {string} url 
 * @param {Object} track 
 * @returns {Object|null}
 */
function parseEventPage(html, url, track) {
  // First try JSON-LD
  const jsonLdEvents = extractJsonLdEvents(html);
  if (jsonLdEvents.length > 0) {
    const parsed = parseJsonLdEvent(jsonLdEvents[0], track);
    if (parsed) {
      parsed.source_url = url;
      return parsed;
    }
  }
  
  // Fallback to HTML parsing
  let name = null;
  let startDate = null;
  let description = null;
  
  // Try common title patterns
  const titlePatterns = [
    /<h1[^>]*>([^<]+)<\/h1>/i,
    /<title>([^<|]+)/i,
    /property="og:title"\s+content="([^"]+)"/i,
    /name="og:title"\s+content="([^"]+)"/i,
  ];
  
  for (const pattern of titlePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      name = match[1].trim();
      // Clean up common suffixes
      name = name.replace(/\s*\|.*$/, '').replace(/\s*-.*Track.*$/i, '').trim();
      break;
    }
  }
  
  // Try to find date
  const datePatterns = [
    // ISO date in meta tags
    /property="event:start_time"\s+content="([^"]+)"/i,
    /name="event:start_time"\s+content="([^"]+)"/i,
    // Common date formats in text
    /(\w+\s+\d{1,2},?\s+\d{4})/,
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{4}-\d{2}-\d{2})/,
  ];
  
  for (const pattern of datePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      try {
        const d = new Date(match[1]);
        if (!isNaN(d.getTime())) {
          startDate = d.toISOString().slice(0, 10);
          break;
        }
      } catch (e) {}
    }
  }
  
  // Get description from meta
  const descMatch = html.match(/property="og:description"\s+content="([^"]+)"/i) ||
                    html.match(/name="description"\s+content="([^"]+)"/i);
  if (descMatch) {
    description = descMatch[1].trim();
  }
  
  if (!name || !startDate) return null;
  
  const eventTypeSlug = mapEventType(name, 'trackVenue');
  
  return {
    name,
    description,
    event_type_slug: eventTypeSlug,
    start_date: startDate,
    end_date: null,
    start_time: null,
    end_time: null,
    timezone: 'America/New_York',
    venue_name: track.name,
    address: null,
    city: track.city,
    state: track.state,
    zip: null,
    country: 'USA',
    region: track.region || getRegionFromState(track.state),
    scope: 'regional',
    source_url: url,
    source_name: `Track: ${track.name}`,
    registration_url: url,
    image_url: null,
    cost_text: null,
    is_free: false,
    latitude: null,
    longitude: null,
  };
}

/**
 * Fetch events from a single track venue
 * 
 * @param {Object} track - Track venue configuration
 * @param {Object} options - Fetch options
 * @returns {Promise<{events: Object[], errors: string[]}>}
 */
export async function fetchEventsForTrack(track, options = {}) {
  const { limit = 20, rangeStart, rangeEnd } = options;
  const events = [];
  const errors = [];
  
  try {
    console.log(`[TrackVenue] Fetching: ${track.name} (${track.calendarUrl})`);
    
    const html = await fetchHtml(track.calendarUrl);
    
    // First, try to extract JSON-LD events from the calendar page itself
    const jsonLdEvents = extractJsonLdEvents(html);
    if (jsonLdEvents.length > 0) {
      console.log(`[TrackVenue] Found ${jsonLdEvents.length} JSON-LD events on ${track.name}`);
      
      for (const jsonLd of jsonLdEvents.slice(0, limit)) {
        const parsed = parseJsonLdEvent(jsonLd, track);
        if (parsed && isWithinRange(parsed.start_date, rangeStart, rangeEnd)) {
          events.push(parsed);
        }
      }
    }
    
    // If no JSON-LD, try to find and follow event links
    if (events.length === 0) {
      const eventLinks = extractEventLinks(html, track.calendarUrl);
      console.log(`[TrackVenue] Found ${eventLinks.length} event links on ${track.name}`);
      
      for (const eventUrl of eventLinks.slice(0, Math.min(limit, 10))) {
        if (events.length >= limit) break;
        
        try {
          await sleep(REQUEST_DELAY_MS);
          
          const eventHtml = await fetchHtml(eventUrl);
          const parsed = parseEventPage(eventHtml, eventUrl, track);
          
          if (parsed && isWithinRange(parsed.start_date, rangeStart, rangeEnd)) {
            events.push(parsed);
          }
        } catch (err) {
          errors.push(`${track.name}: Failed to fetch ${eventUrl}: ${err.message}`);
        }
      }
    }
    
    console.log(`[TrackVenue] ✓ ${track.name}: ${events.length} events`);
    
  } catch (err) {
    errors.push(`${track.name}: ${err.message}`);
    console.log(`[TrackVenue] ✗ ${track.name}: ${err.message}`);
  }
  
  return { events, errors };
}

/**
 * Check if a date is within range
 * 
 * @param {string} startDate - ISO date string
 * @param {string} rangeStart - ISO date string
 * @param {string} rangeEnd - ISO date string
 * @returns {boolean}
 */
function isWithinRange(startDate, rangeStart, rangeEnd) {
  if (!startDate) return false;
  
  const sd = new Date(`${startDate}T00:00:00Z`);
  if (isNaN(sd.getTime())) return false;
  
  if (rangeStart) {
    const rs = new Date(rangeStart);
    if (!isNaN(rs.getTime()) && sd < rs) return false;
  }
  
  if (rangeEnd) {
    const re = new Date(rangeEnd);
    if (!isNaN(re.getTime()) && sd > re) return false;
  }
  
  return true;
}

/**
 * Fetch events from all track venues
 * 
 * @param {Object} source - Source configuration from database
 * @param {Object} options - Fetch options
 * @returns {Promise<{events: Object[], errors: string[]}>}
 */
export async function fetchTrackVenueEvents(source, options = {}) {
  const { limit = 200, dryRun = false, rangeStart, rangeEnd, region = null } = options;
  const allEvents = [];
  const allErrors = [];
  
  if (dryRun) {
    console.log('[TrackVenue] Dry run - skipping actual fetch');
    return { events: [], errors: [] };
  }
  
  // Filter tracks by region if specified
  let tracksToFetch = TRACK_VENUES;
  if (region) {
    tracksToFetch = TRACK_VENUES.filter(t => t.region === region);
  }
  
  console.log(`[TrackVenue] Fetching from ${tracksToFetch.length} track venues...`);
  
  for (const track of tracksToFetch) {
    if (allEvents.length >= limit) break;
    
    const { events, errors } = await fetchEventsForTrack(track, {
      limit: Math.ceil(limit / tracksToFetch.length),
      rangeStart,
      rangeEnd,
    });
    
    allEvents.push(...events);
    allErrors.push(...errors);
    
    // Rate limit between tracks
    await sleep(REQUEST_DELAY_MS);
  }
  
  console.log(`[TrackVenue] Total: ${allEvents.length} events from ${tracksToFetch.length} tracks`);
  
  return { 
    events: allEvents.slice(0, limit), 
    errors: allErrors 
  };
}

/**
 * Get list of all track venues
 * 
 * @returns {Object[]}
 */
export function getTrackVenues() {
  return TRACK_VENUES;
}

/**
 * Get tracks by region
 * 
 * @param {string} region 
 * @returns {Object[]}
 */
export function getTracksByRegion(region) {
  return TRACK_VENUES.filter(t => t.region === region);
}

export default fetchTrackVenueEvents;



