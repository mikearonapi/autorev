/**
 * iCal Feed Aggregator
 * 
 * Fetches events from iCal/ICS feeds published by car clubs, tracks, and organizations.
 * iCal feeds are the most reliable structured data source since they follow RFC 5545.
 * 
 * Data Sources:
 * - PCA (Porsche Club of America) regional calendars
 * - SCCA regional calendars (many use iCal)
 * - Track venue iCal feeds
 * - Local car club Google Calendars
 * 
 * @module lib/eventSourceFetchers/icalAggregator
 */

import { mapEventType, getRegionFromState } from './index.js';

/**
 * Known iCal feeds for automotive events
 * 
 * Format: { name, url, category, region?, clubType? }
 */
const ICAL_FEEDS = [
  // PCA Regional Calendars (Many PCA regions publish iCal feeds)
  {
    name: 'PCA Potomac Region',
    url: 'https://potomac-pca.org/events/?ical=1',
    category: 'club-meetup',
    region: 'Mid-Atlantic',
    clubType: 'porsche',
  },
  {
    name: 'PCA Golden Gate Region',
    url: 'https://ggc.pca.org/events/?ical=1',
    category: 'club-meetup',
    region: 'Pacific',
    clubType: 'porsche',
  },
  {
    name: 'PCA Lone Star Region',
    url: 'https://lsr.pca.org/events/?ical=1',
    category: 'club-meetup',
    region: 'Southwest',
    clubType: 'porsche',
  },
  
  // SCCA Regional Calendars
  {
    name: 'SCCA Washington DC Region',
    url: 'https://www.wdcr-scca.org/events/?ical=1',
    category: 'autocross',
    region: 'Mid-Atlantic',
    clubType: 'scca',
  },
  
  // BMW CCA Calendars
  {
    name: 'BMW CCA National Capital Chapter',
    url: 'https://nccbmwcca.org/events/?ical=1',
    category: 'club-meetup',
    region: 'Mid-Atlantic',
    clubType: 'bmw',
  },
  
  // Track Calendars (those that publish iCal)
  // Add more as discovered
];

/**
 * Parse iCal date string to ISO format
 * Handles both DATE and DATE-TIME formats
 * 
 * @param {string} icalDate - iCal date string (YYYYMMDD or YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ)
 * @returns {Object} { date: string, time: string|null }
 */
function parseIcalDate(icalDate) {
  if (!icalDate) return { date: null, time: null };
  
  // Clean up the string
  let dateStr = String(icalDate).trim();
  
  // Handle DTSTART;VALUE=DATE:20260101 format
  if (dateStr.includes(':')) {
    dateStr = dateStr.split(':').pop();
  }
  
  // Remove timezone suffix if present
  dateStr = dateStr.replace(/Z$/, '');
  
  // Handle YYYYMMDDTHHMMSS format
  if (dateStr.length >= 15 && dateStr.includes('T')) {
    const datePart = dateStr.slice(0, 8);
    const timePart = dateStr.slice(9, 15);
    
    const year = datePart.slice(0, 4);
    const month = datePart.slice(4, 6);
    const day = datePart.slice(6, 8);
    
    const hour = timePart.slice(0, 2);
    const minute = timePart.slice(2, 4);
    
    return {
      date: `${year}-${month}-${day}`,
      time: `${hour}:${minute}:00`,
    };
  }
  
  // Handle YYYYMMDD format
  if (dateStr.length >= 8) {
    const year = dateStr.slice(0, 4);
    const month = dateStr.slice(4, 6);
    const day = dateStr.slice(6, 8);
    
    return {
      date: `${year}-${month}-${day}`,
      time: null,
    };
  }
  
  // Try to parse as regular date
  try {
    const d = new Date(icalDate);
    if (!isNaN(d.getTime())) {
      return {
        date: d.toISOString().slice(0, 10),
        time: d.toISOString().slice(11, 19),
      };
    }
  } catch (_e) {
    // Silently ignore invalid iCal date format - returns null below
  }
  
  return { date: null, time: null };
}

/**
 * Parse location string to extract city and state
 * 
 * @param {string} location 
 * @returns {Object} { venue: string|null, city: string|null, state: string|null, address: string|null }
 */
function parseLocation(location) {
  if (!location) return { venue: null, city: null, state: null, address: null };
  
  // Clean up escaped characters
  let loc = location.replace(/\\n/g, ', ').replace(/\\\\/g, '').replace(/\\,/g, ',').trim();
  
  // Try to extract city, state pattern
  // Common formats: "Venue Name, City, ST 12345" or "City, ST"
  const statePattern = /,\s*([A-Z]{2})\s*(\d{5})?(?:,\s*(?:US|USA|United States))?$/i;
  const match = loc.match(statePattern);
  
  if (match) {
    const state = match[1].toUpperCase();
    const beforeState = loc.slice(0, match.index);
    const parts = beforeState.split(',').map(p => p.trim()).filter(Boolean);
    
    if (parts.length >= 2) {
      // Last part before state is city
      const city = parts.pop();
      // Everything else is venue/address
      const venue = parts.shift() || null;
      const address = parts.length > 0 ? parts.join(', ') : null;
      
      return { venue, city, state, address };
    } else if (parts.length === 1) {
      // Just city before state
      return { venue: null, city: parts[0], state, address: null };
    }
  }
  
  // Fallback: just return the whole thing as venue
  return { venue: loc, city: null, state: null, address: null };
}

/**
 * Simple iCal parser
 * Parses raw iCal text into an array of VEVENT objects
 * 
 * @param {string} icalText - Raw iCal/ICS content
 * @returns {Object[]} Array of parsed events
 */
function parseIcal(icalText) {
  const events = [];
  const lines = icalText.split(/\r?\n/);
  
  let currentEvent = null;
  let currentKey = null;
  let currentValue = '';
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Handle line folding (continuation lines start with space or tab)
    while (i + 1 < lines.length && /^[ \t]/.test(lines[i + 1])) {
      i++;
      line += lines[i].slice(1);
    }
    
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
      continue;
    }
    
    if (line === 'END:VEVENT' && currentEvent) {
      events.push(currentEvent);
      currentEvent = null;
      continue;
    }
    
    if (currentEvent) {
      // Parse key:value or key;params:value
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        let key = line.slice(0, colonIndex);
        const value = line.slice(colonIndex + 1);
        
        // Strip parameters from key (e.g., DTSTART;VALUE=DATE becomes DTSTART)
        const semiIndex = key.indexOf(';');
        if (semiIndex > 0) {
          key = key.slice(0, semiIndex);
        }
        
        currentEvent[key] = value;
      }
    }
  }
  
  return events;
}

/**
 * Fetch and parse an iCal feed
 * 
 * @param {Object} feedConfig - Feed configuration
 * @param {Object} options - Fetch options
 * @returns {Promise<{events: Object[], errors: string[]}>}
 */
async function fetchIcalFeed(feedConfig, options = {}) {
  const { limit = 50, rangeStart, rangeEnd } = options;
  const events = [];
  const errors = [];
  
  try {
    console.log(`[iCal] Fetching: ${feedConfig.name} (${feedConfig.url})`);
    
    const response = await fetch(feedConfig.url, {
      headers: {
        'User-Agent': 'AutoRev/1.0 (https://autorev.app)',
        'Accept': 'text/calendar, application/calendar+xml, */*',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const icalText = await response.text();
    
    // Check if we got valid iCal data
    if (!icalText.includes('BEGIN:VCALENDAR')) {
      throw new Error('Response is not valid iCal format');
    }
    
    const rawEvents = parseIcal(icalText);
    console.log(`[iCal] Parsed ${rawEvents.length} events from ${feedConfig.name}`);
    
    for (const raw of rawEvents) {
      if (events.length >= limit) break;
      
      // Parse dates
      const start = parseIcalDate(raw.DTSTART);
      const end = parseIcalDate(raw.DTEND);
      
      if (!start.date) continue;
      
      // Check date range
      if (rangeStart || rangeEnd) {
        const sd = new Date(`${start.date}T00:00:00Z`);
        if (rangeStart && sd < new Date(rangeStart)) continue;
        if (rangeEnd && sd > new Date(rangeEnd)) continue;
      }
      
      // Parse location
      const loc = parseLocation(raw.LOCATION);
      
      // Determine event type from name/description
      const name = (raw.SUMMARY || '').replace(/\\,/g, ',').replace(/\\n/g, ' ').trim();
      const description = (raw.DESCRIPTION || '').replace(/\\n/g, '\n').replace(/\\,/g, ',').trim();
      const eventTypeSlug = mapEventType(`${name} ${description}`, 'ical');
      
      // Skip non-automotive events if category hints suggest otherwise
      // (Some club calendars include non-car events)
      const combined = `${name} ${description}`.toLowerCase();
      if (feedConfig.category === 'club-meetup' && 
          !combined.includes('car') && !combined.includes('drive') && 
          !combined.includes('meet') && !combined.includes('track') &&
          !combined.includes('autocross') && !combined.includes('porsche') &&
          !combined.includes('bmw') && !combined.includes('race')) {
        // Likely not a car event, skip
        continue;
      }
      
      const event = {
        name,
        description: description.slice(0, 2000) || null, // Limit description length
        event_type_slug: eventTypeSlug,
        start_date: start.date,
        end_date: end.date,
        start_time: start.time,
        end_time: end.time,
        timezone: 'America/New_York', // TODO: extract from VTIMEZONE
        venue_name: loc.venue,
        address: loc.address,
        city: loc.city,
        state: loc.state,
        zip: null,
        country: 'USA',
        region: loc.state ? getRegionFromState(loc.state) : feedConfig.region || null,
        scope: 'local',
        source_url: raw.URL || feedConfig.url,
        source_name: feedConfig.name,
        registration_url: raw.URL || null,
        image_url: null,
        cost_text: null,
        is_free: false,
        latitude: null,
        longitude: null,
      };
      
      // Add brand affinity if known
      if (feedConfig.clubType) {
        event.brand_affinity = feedConfig.clubType;
      }
      
      events.push(event);
    }
    
    console.log(`[iCal] ✓ ${feedConfig.name}: ${events.length} automotive events`);
    
  } catch (err) {
    errors.push(`${feedConfig.name}: ${err.message}`);
    console.log(`[iCal] ✗ ${feedConfig.name}: ${err.message}`);
  }
  
  return { events, errors };
}

/**
 * Fetch events from all configured iCal feeds
 * 
 * @param {Object} source - Source configuration from database
 * @param {Object} options - Fetch options
 * @returns {Promise<{events: Object[], errors: string[]}>}
 */
export async function fetchIcalEvents(source, options = {}) {
  const { limit = 200, dryRun = false, rangeStart, rangeEnd, region = null, clubType = null } = options;
  const allEvents = [];
  const allErrors = [];
  
  if (dryRun) {
    console.log('[iCal] Dry run - skipping actual fetch');
    return { events: [], errors: [] };
  }
  
  // Filter feeds
  let feedsToFetch = ICAL_FEEDS;
  if (region) {
    feedsToFetch = feedsToFetch.filter(f => f.region === region);
  }
  if (clubType) {
    feedsToFetch = feedsToFetch.filter(f => f.clubType === clubType);
  }
  
  console.log(`[iCal] Fetching from ${feedsToFetch.length} iCal feeds...`);
  
  for (const feed of feedsToFetch) {
    if (allEvents.length >= limit) break;
    
    const { events, errors } = await fetchIcalFeed(feed, {
      limit: Math.ceil(limit / feedsToFetch.length),
      rangeStart,
      rangeEnd,
    });
    
    allEvents.push(...events);
    allErrors.push(...errors);
    
    // Rate limit between feeds
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`[iCal] Total: ${allEvents.length} events from ${feedsToFetch.length} feeds`);
  
  return { 
    events: allEvents.slice(0, limit), 
    errors: allErrors 
  };
}

/**
 * Add a custom iCal feed at runtime
 * 
 * @param {Object} feedConfig 
 */
export function addIcalFeed(feedConfig) {
  if (feedConfig.name && feedConfig.url) {
    ICAL_FEEDS.push({
      name: feedConfig.name,
      url: feedConfig.url,
      category: feedConfig.category || 'other',
      region: feedConfig.region || null,
      clubType: feedConfig.clubType || null,
    });
  }
}

/**
 * Get list of configured iCal feeds
 * 
 * @returns {Object[]}
 */
export function getIcalFeeds() {
  return ICAL_FEEDS;
}

/**
 * Fetch from a single iCal URL (for ad-hoc use)
 * 
 * @param {string} url - iCal feed URL
 * @param {string} sourceName - Name for the source
 * @param {Object} options - Fetch options
 * @returns {Promise<{events: Object[], errors: string[]}>}
 */
export async function fetchFromIcalUrl(url, sourceName, options = {}) {
  const feedConfig = {
    name: sourceName,
    url,
    category: options.category || 'other',
    region: options.region || null,
    clubType: options.clubType || null,
  };
  
  return fetchIcalFeed(feedConfig, options);
}

export default fetchIcalEvents;











