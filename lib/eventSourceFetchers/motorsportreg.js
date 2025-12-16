/**
 * MotorsportReg Event Fetcher
 * 
 * Fetches track events (HPDE, autocross, time attack) from MotorsportReg.com
 * Uses their public calendar page.
 * 
 * Rate limiting: Be respectful, add delays between requests
 * 
 * @module lib/eventSourceFetchers/motorsportreg
 */

import { mapEventType, getRegionFromState } from './index.js';

// MotorsportReg base URL
const BASE_URL = 'https://www.motorsportreg.com';

// Delay between requests to be respectful
const REQUEST_DELAY_MS = 2000;

/**
 * Fetch events from MotorsportReg
 * 
 * MotorsportReg has blocked their JSON API, so we now use HTML parsing
 * of their calendar and search pages.
 * 
 * @param {Object} source - Source configuration
 * @param {Object} [options] - Fetch options
 * @returns {Promise<{events: Object[], errors: string[]}>}
 */
export async function fetchMotorsportRegEvents(source, options = {}) {
  const { limit = 100, dryRun = false, rangeStart, rangeEnd } = options;
  const events = [];
  const errors = [];
  
  if (dryRun) {
    console.log('[MotorsportReg] Dry run - skipping actual fetch');
    return { events: [], errors: [] };
  }
  
  const eventTypes = source.scrape_config?.eventTypes || ['track-day', 'autocross', 'time-attack'];
  
  try {
    // Use HTML scraping approach - their JSON API no longer works
    console.log('[MotorsportReg] Using HTML calendar scraping...');
    
    // Scrape different event type pages
    const typePages = [
      { url: `${BASE_URL}/calendar/?type=hpde`, type: 'track-day' },
      { url: `${BASE_URL}/calendar/?type=autocross`, type: 'autocross' },
      { url: `${BASE_URL}/calendar/?type=time-attack`, type: 'time-attack' },
      { url: `${BASE_URL}/calendar/`, type: 'all' },
    ];
    
    for (const typePage of typePages) {
      if (events.length >= limit) break;
      
      try {
        console.log(`[MotorsportReg] Fetching: ${typePage.url}`);
        
        const response = await fetch(typePage.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.motorsportreg.com/',
          },
        });
        
        if (!response.ok) {
          console.warn(`[MotorsportReg] ${typePage.url} returned ${response.status}`);
          continue;
        }
        
        const html = await response.text();
        
        // Check if we got a valid page (not a bot block)
        if (html.includes('Access Denied') || html.includes('blocked') || html.length < 1000) {
          console.warn('[MotorsportReg] Page appears to be blocked or empty');
          continue;
        }
        
        // Extract event links from the calendar
        const eventLinks = extractEventLinks(html);
        console.log(`[MotorsportReg] Found ${eventLinks.length} event links on ${typePage.type} page`);
        
        // Fetch details for each event (limited to avoid rate limiting)
        const maxPerType = Math.floor(limit / typePages.length);
        for (const link of eventLinks.slice(0, maxPerType)) {
          if (events.length >= limit) break;
          
          try {
            await new Promise(r => setTimeout(r, REQUEST_DELAY_MS));
            
            const eventData = await fetchEventDetails(link.url);
            if (eventData && eventData.name && eventData.start_date) {
              // Set event type based on the page we got it from
              eventData.event_type_slug = typePage.type !== 'all' 
                ? typePage.type 
                : mapEventType(eventData.name, 'motorsportreg');
              
              if (eventTypes.includes(eventData.event_type_slug) || eventTypes.includes('all')) {
                events.push(eventData);
              }
            }
          } catch (err) {
            errors.push(`Failed to fetch ${link.url}: ${err.message}`);
          }
        }
        
        await new Promise(r => setTimeout(r, REQUEST_DELAY_MS));
        
      } catch (err) {
        errors.push(`Failed to fetch ${typePage.url}: ${err.message}`);
      }
    }
    
    console.log(`[MotorsportReg] Normalized ${events.length} events`);
    
  } catch (err) {
    console.error('[MotorsportReg] Error fetching events:', err);
    errors.push(err.message);
  }
  
  return { events, errors };
}

/**
 * Extract event links from calendar HTML
 * 
 * @param {string} html
 * @returns {Array<{url: string, name: string}>}
 */
function extractEventLinks(html) {
  const links = [];
  const seen = new Set();
  
  // Match event links in various formats
  const patterns = [
    // Standard event links
    /<a[^>]+href="(\/events\/[^"]+)"[^>]*>([^<]+)<\/a>/gi,
    // Calendar list items
    /<a[^>]+href="(https?:\/\/www\.motorsportreg\.com\/events\/[^"]+)"[^>]*>/gi,
    // Event cards
    /href="(\/events\/[^"]+)"[^>]*class="[^"]*event/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let url = match[1];
      const name = match[2] || '';
      
      // Ensure full URL
      if (url.startsWith('/')) {
        url = `${BASE_URL}${url}`;
      }
      
      // Skip if already seen
      if (seen.has(url)) continue;
      seen.add(url);
      
      // Skip non-event pages
      if (!url.includes('/events/')) continue;
      if (url.includes('/register') || url.includes('/results')) continue;
      
      links.push({ url, name: name.trim() });
    }
  }
  
  return links;
}

/**
 * Fallback: Fetch from HTML calendar page
 * 
 * @param {Object} source
 * @param {Object} options
 * @returns {Promise<{events: Object[], errors: string[]}>}
 */
async function fetchFromHtmlCalendar(source, options = {}) {
  const { limit = 50 } = options;
  const events = [];
  const errors = [];
  
  try {
    // Fetch the main calendar page
    const response = await fetch(`${BASE_URL}/calendar`, {
      headers: {
        'User-Agent': 'AutoRev/1.0 (https://autorev.app)',
        'Accept': 'text/html',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Parse events from HTML
    // This is a simple regex-based parser - more robust parsing would use a proper HTML parser
    const eventMatches = html.matchAll(
      /<a[^>]+href="(\/events\/[^"]+)"[^>]*>([^<]+)<\/a>/g
    );
    
    const eventUrls = [];
    for (const match of eventMatches) {
      if (eventUrls.length >= limit) break;
      const [, url, name] = match;
      if (url && name && !eventUrls.some(e => e.url === url)) {
        eventUrls.push({ url: `${BASE_URL}${url}`, name: name.trim() });
      }
    }
    
    console.log(`[MotorsportReg] Found ${eventUrls.length} event URLs from HTML`);
    
    // Fetch details for each event (with rate limiting)
    for (const { url, name } of eventUrls.slice(0, Math.min(limit, 20))) {
      try {
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
        
        const eventDetails = await fetchEventDetails(url);
        if (eventDetails) {
          events.push(eventDetails);
        }
      } catch (err) {
        errors.push(`Failed to fetch ${name}: ${err.message}`);
      }
    }
    
  } catch (err) {
    errors.push(`HTML fallback failed: ${err.message}`);
  }
  
  return { events, errors };
}

/**
 * Fetch details for a single event
 * 
 * @param {string} url - Event URL
 * @returns {Promise<Object|null>}
 */
async function fetchEventDetails(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AutoRev/1.0 (https://autorev.app)',
        'Accept': 'text/html',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract event details from HTML
    // Look for structured data (JSON-LD) first
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd['@type'] === 'Event') {
          return normalizeJsonLdEvent(jsonLd, url);
        }
      } catch {
        // Fall through to HTML parsing
      }
    }
    
    // Fallback to HTML parsing
    const name = extractFromHtml(html, /<h1[^>]*>([^<]+)<\/h1>/);
    const dateText = extractFromHtml(html, /class="event-date"[^>]*>([^<]+)</);
    const location = extractFromHtml(html, /class="event-location"[^>]*>([^<]+)</);
    const venue = extractFromHtml(html, /class="venue-name"[^>]*>([^<]+)</);
    
    if (!name) return null;
    
    // Parse date
    const dateInfo = parseDateText(dateText);
    
    // Parse location
    const locationInfo = parseLocationText(location);
    
    return {
      name: name.trim(),
      description: null,
      event_type_slug: 'track-day', // Default for motorsportreg
      start_date: dateInfo?.start || null,
      end_date: dateInfo?.end || null,
      start_time: null,
      end_time: null,
      timezone: 'America/New_York',
      venue_name: venue?.trim() || null,
      address: null,
      city: locationInfo?.city || null,
      state: locationInfo?.state || null,
      zip: null,
      country: 'USA',
      region: locationInfo?.state ? getRegionFromState(locationInfo.state) : null,
      scope: 'regional',
      source_url: url,
      source_name: 'MotorsportReg',
      registration_url: url,
      image_url: null,
      cost_text: null,
      is_free: false,
      latitude: null,
      longitude: null,
    };
    
  } catch (err) {
    console.error(`[MotorsportReg] Error fetching event details from ${url}:`, err);
    return null;
  }
}

/**
 * Normalize a MotorsportReg event from their JSON API
 * 
 * @param {Object} raw - Raw event object
 * @returns {Object} - Normalized event
 */
function normalizeMotorsportRegEvent(raw) {
  // Handle different possible field names from their API
  const name = raw.title || raw.name || raw.eventName;
  const startDate = raw.start || raw.startDate || raw.date;
  const endDate = raw.end || raw.endDate;
  const location = raw.location || raw.venue || {};
  
  // Parse location string if it's a string
  let city = null;
  let state = null;
  let venueName = null;
  
  if (typeof location === 'string') {
    const parsed = parseLocationText(location);
    city = parsed?.city;
    state = parsed?.state;
    venueName = location;
  } else if (typeof location === 'object') {
    city = location.city;
    state = location.state || location.region;
    venueName = location.name || location.venue;
  }
  
  return {
    name,
    description: raw.description || raw.summary || null,
    event_type_slug: mapEventType(raw.eventType || raw.type || raw.category, 'motorsportreg'),
    start_date: formatDate(new Date(startDate)),
    end_date: endDate ? formatDate(new Date(endDate)) : null,
    start_time: extractTime(startDate),
    end_time: extractTime(endDate),
    timezone: raw.timezone || 'America/New_York',
    venue_name: venueName,
    address: raw.address || location?.address || null,
    city,
    state,
    zip: raw.zip || raw.postalCode || location?.zip || null,
    country: raw.country || 'USA',
    region: state ? getRegionFromState(state) : null,
    scope: 'regional',
    source_url: raw.url || raw.link || `${BASE_URL}/events/${raw.id || raw.eventId}`,
    source_name: 'MotorsportReg',
    registration_url: raw.registrationUrl || raw.url || null,
    image_url: raw.image || raw.imageUrl || null,
    cost_text: raw.price || raw.cost || null,
    is_free: raw.isFree || raw.price === 'Free' || false,
    latitude: raw.latitude || raw.lat || null,
    longitude: raw.longitude || raw.lng || null,
  };
}

/**
 * Normalize a JSON-LD Event object
 * 
 * @param {Object} jsonLd - JSON-LD event object
 * @param {string} url - Source URL
 * @returns {Object}
 */
function normalizeJsonLdEvent(jsonLd, url) {
  const location = jsonLd.location || {};
  const address = location.address || {};
  
  let city = null;
  let state = null;
  let venueName = location.name || null;
  
  if (typeof address === 'string') {
    const parsed = parseLocationText(address);
    city = parsed?.city;
    state = parsed?.state;
  } else if (typeof address === 'object') {
    city = address.addressLocality;
    state = address.addressRegion;
  }
  
  return {
    name: jsonLd.name,
    description: jsonLd.description || null,
    event_type_slug: 'track-day',
    start_date: jsonLd.startDate ? formatDate(new Date(jsonLd.startDate)) : null,
    end_date: jsonLd.endDate ? formatDate(new Date(jsonLd.endDate)) : null,
    start_time: extractTime(jsonLd.startDate),
    end_time: extractTime(jsonLd.endDate),
    timezone: 'America/New_York',
    venue_name: venueName,
    address: typeof address === 'string' ? address : address.streetAddress || null,
    city,
    state,
    zip: address.postalCode || null,
    country: address.addressCountry || 'USA',
    region: state ? getRegionFromState(state) : null,
    scope: 'regional',
    source_url: url,
    source_name: 'MotorsportReg',
    registration_url: url,
    image_url: jsonLd.image || null,
    cost_text: jsonLd.offers?.price ? `$${jsonLd.offers.price}` : null,
    is_free: jsonLd.isAccessibleForFree || false,
    latitude: location.geo?.latitude || null,
    longitude: location.geo?.longitude || null,
  };
}

/**
 * Helper: Extract content from HTML using regex
 * 
 * @param {string} html
 * @param {RegExp} pattern
 * @returns {string|null}
 */
function extractFromHtml(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1] : null;
}

/**
 * Helper: Parse date text to ISO date
 * 
 * @param {string} text
 * @returns {{start: string, end: string|null}|null}
 */
function parseDateText(text) {
  if (!text) return null;
  
  // Try to parse various date formats
  // "December 15, 2025"
  // "Dec 15-16, 2025"
  // "12/15/2025"
  
  try {
    // Simple single date
    const singleDate = new Date(text);
    if (!isNaN(singleDate.getTime())) {
      return { start: formatDate(singleDate), end: null };
    }
    
    // Date range "Dec 15-16, 2025"
    const rangeMatch = text.match(/(\w+ \d+)-(\d+),?\s*(\d{4})/);
    if (rangeMatch) {
      const [, startPart, endDay, year] = rangeMatch;
      const startDate = new Date(`${startPart}, ${year}`);
      const endDate = new Date(startDate);
      endDate.setDate(parseInt(endDay, 10));
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        return { start: formatDate(startDate), end: formatDate(endDate) };
      }
    }
  } catch {
    // Ignore parsing errors
  }
  
  return null;
}

/**
 * Helper: Parse location text to city/state
 * 
 * @param {string} text
 * @returns {{city: string, state: string}|null}
 */
function parseLocationText(text) {
  if (!text) return null;
  
  // Try "City, ST" or "City, State" format
  const match = text.match(/([^,]+),\s*([A-Z]{2})\b/i);
  if (match) {
    return { city: match[1].trim(), state: match[2].toUpperCase() };
  }
  
  // Try to find a state code anywhere
  const stateMatch = text.match(/\b([A-Z]{2})\b/);
  if (stateMatch) {
    // Everything before the state is probably the city
    const parts = text.split(stateMatch[0]);
    return { 
      city: parts[0].replace(/,\s*$/, '').trim() || null, 
      state: stateMatch[1] 
    };
  }
  
  return null;
}

/**
 * Helper: Format date as ISO date string (YYYY-MM-DD)
 * 
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  if (!date || isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

/**
 * Helper: Extract time from ISO datetime string
 * 
 * @param {string} datetime
 * @returns {string|null} - Time in HH:MM format
 */
function extractTime(datetime) {
  if (!datetime) return null;
  
  try {
    const date = new Date(datetime);
    if (isNaN(date.getTime())) return null;
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // Don't return time if it's midnight (probably not a real time)
    if (hours === '00' && minutes === '00') return null;
    
    return `${hours}:${minutes}`;
  } catch {
    return null;
  }
}

export default fetchMotorsportRegEvents;

