/**
 * SCCA Event Fetcher
 * 
 * Fetches autocross and time-attack events from SCCA.com
 * Uses their public events API/calendar.
 * 
 * @module lib/eventSourceFetchers/scca
 */

import { mapEventType, getRegionFromState } from './index.js';

// SCCA base URL
const BASE_URL = 'https://www.scca.com';

// Delay between requests
const REQUEST_DELAY_MS = 2000;

/**
 * Fetch events from SCCA
 * 
 * @param {Object} source - Source configuration
 * @param {Object} [options] - Fetch options
 * @returns {Promise<{events: Object[], errors: string[]}>}
 */
export async function fetchSCCAEvents(source, options = {}) {
  const { limit = 100, dryRun = false, rangeStart, rangeEnd } = options;
  const events = [];
  const errors = [];
  
  if (dryRun) {
    console.log('[SCCA] Dry run - skipping actual fetch');
    return { events: [], errors: [] };
  }
  
  try {
    // Prefer their calendar JSON feed (much more reliable than scraping HTML)
    const calendarUrl = rangeStart && rangeEnd
      ? `${BASE_URL}/events/calendar.json?start=${encodeURIComponent(rangeStart.slice(0, 10))}&end=${encodeURIComponent(rangeEnd.slice(0, 10))}`
      : `${BASE_URL}/events/calendar.json`;

    console.log(`[SCCA] Fetching calendar: ${calendarUrl}`);

    const response = await fetch(calendarUrl, {
      headers: {
        'User-Agent': 'AutoRev/1.0 (https://autorev.app)',
        Accept: 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const json = await response.json().catch(() => null);
    if (!Array.isArray(json)) {
      throw new Error('Unexpected SCCA calendar JSON format');
    }

    // Filter by range first, then fetch details for location parsing.
    const candidates = [];
    for (const item of json) {
      const start = item?.start;
      const urlPath = item?.url;
      const title = item?.title;
      if (!start || !urlPath || !title) continue;
      if (!isWithinRange(start, rangeStart, rangeEnd)) continue;
      candidates.push({ title, start_date: start, end_date: item?.end || null, url: urlPath.startsWith('http') ? urlPath : `${BASE_URL}${urlPath}` });
      if (candidates.length >= Math.min(limit, 80)) break;
    }

    console.log(`[SCCA] Candidate events in range: ${candidates.length}`);

    for (const item of candidates) {
      if (events.length >= limit) break;
      try {
        const detail = await fetchSccaEventDetail(item.url, { title: item.title, start_date: item.start_date, end_date: item.end_date });
        if (!detail) continue;
        events.push(detail);
      } catch (err) {
        errors.push(`Failed to fetch event detail (${item.url}): ${err.message}`);
      }
    }

    console.log(`[SCCA] Normalized ${events.length} events`);
    
  } catch (err) {
    console.error('[SCCA] Error fetching events:', err);
    errors.push(err.message);
  }
  
  return { events, errors };
}

function isWithinRange(startDate, rangeStart, rangeEnd) {
  if (!startDate) return false;
  const sd = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(sd.getTime())) return false;
  if (rangeStart) {
    const rs = new Date(rangeStart);
    if (!Number.isNaN(rs.getTime()) && sd < rs) return false;
  }
  if (rangeEnd) {
    const re = new Date(rangeEnd);
    if (!Number.isNaN(re.getTime()) && sd > re) return false;
  }
  return true;
}

/**
 * Format date as ISO date string
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  if (!date || isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

/**
 * Extract time from datetime
 * @param {string} datetime
 * @returns {string|null}
 */
function extractTime(datetime) {
  if (!datetime) return null;
  
  try {
    const date = new Date(datetime);
    if (isNaN(date.getTime())) return null;
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    if (hours === '00' && minutes === '00') return null;
    
    return `${hours}:${minutes}`;
  } catch {
    return null;
  }
}

async function fetchSccaEventDetail(url, preset = {}) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'AutoRev/1.0 (https://autorev.app)',
      Accept: 'text/html',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const name = preset.title || (() => {
    const titleMatch = html.match(/property=\"og:title\" content=\"([^\"]+)\"/);
    return titleMatch ? titleMatch[1].trim() : null;
  })();

  const start_date = preset.start_date || (() => {
    const dateMatch = html.match(/class=\"start date\">\\s*([^<]+)\\s*</);
    const startDateText = dateMatch ? dateMatch[1].trim() : null;
    return startDateText ? formatDate(new Date(startDateText)) : null;
  })();

  const venueMatch = html.match(/class=\"event_location\"[\\s\\S]*?class=\"location\"[\\s\\S]*?>([^<]+)</);
  const venue_name = venueMatch ? venueMatch[1].trim() : null;

  const addrMatch = html.match(/class=\"event_address\"[\\s\\S]*?<span>\\s*([^<]+?)\\s*<\/span>/);
  const addressLine = addrMatch ? addrMatch[1].trim() : null;

  let address = null;
  let city = null;
  let state = null;
  let zip = null;

  if (addressLine) {
    // e.g. "County Road 18, Newton, AL, 36352"
    const parts = addressLine.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 4) {
      address = parts.slice(0, parts.length - 3).join(', ');
      city = parts[parts.length - 3] || null;
      state = parts[parts.length - 2] || null;
      zip = parts[parts.length - 1] || null;
    } else if (parts.length === 3) {
      address = parts[0] || null;
      city = parts[1] || null;
      const stateZip = parts[2].split(/\s+/).filter(Boolean);
      state = stateZip[0] || null;
      zip = stateZip[1] || null;
    }
  }

  if (!name || !start_date || !city) {
    if (process.env.DEBUG_SCCA === 'true') {
      console.log('[SCCA][debug] drop event', {
        url,
        name,
        start_date,
        addressLine,
        city,
        state,
        zip,
      });
    }
    return null;
  }

  return {
    name,
    description: null,
    event_type_slug: mapEventType(name, 'scca'),
    start_date,
    end_date: preset.end_date || null,
    start_time: null,
    end_time: null,
    timezone: 'America/New_York',
    venue_name,
    address,
    city,
    state,
    zip,
    country: 'USA',
    region: state ? getRegionFromState(state) : null,
    scope: 'regional',
    source_url: url,
    source_name: 'SCCA',
    registration_url: url,
    image_url: null,
    cost_text: null,
    is_free: false,
    latitude: null,
    longitude: null,
  };
}

export default fetchSCCAEvents;

