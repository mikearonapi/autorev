/**
 * PCA (Porsche Club of America) Event Fetcher
 * 
 * Fetches Porsche-related events from PCA.org
 * Covers track days, autocross, tours, and club meetups.
 * 
 * @module lib/eventSourceFetchers/pca
 */

import { mapEventType, getRegionFromState } from './index.js';

// PCA base URL
const BASE_URL = 'https://www.pca.org';

const STATE_NAME_TO_CODE = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO', connecticut: 'CT',
  delaware: 'DE', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI',
  minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH',
  'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
  oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD',
  tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY', 'washington d.c.': 'DC', 'washington dc': 'DC', dc: 'DC',
};

function normalizeState(input) {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  const key = trimmed.toLowerCase().replace(/\./g, '').trim();
  return STATE_NAME_TO_CODE[key] || null;
}

/**
 * Fetch events from PCA
 * 
 * @param {Object} source - Source configuration
 * @param {Object} [options] - Fetch options
 * @returns {Promise<{events: Object[], errors: string[]}>}
 */
export async function fetchPCAEvents(source, options = {}) {
  const { limit = 100, dryRun = false, rangeStart, rangeEnd } = options;
  const events = [];
  const errors = [];
  
  if (dryRun) {
    console.log('[PCA] Dry run - skipping actual fetch');
    return { events: [], errors: [] };
  }
  
  try {
    // PCA has an events calendar
    const eventsUrl = `${BASE_URL}/events`;
    
    console.log(`[PCA] Fetching: ${eventsUrl}`);
    
    const response = await fetch(eventsUrl, {
      headers: {
        'User-Agent': 'AutoRev/1.0 (https://autorev.app)',
        'Accept': 'text/html',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();

    // PCA is server-rendered but doesn’t expose JSON-LD consistently; crawl event detail pages.
    const linkMatches = html.matchAll(/href="(https?:\/\/pca\.org\/events\/[^"#?]+)"/g);
    const urls = new Set();
    for (const m of linkMatches) {
      const u = m[1];
      if (!u) continue;
      if (u.includes('/events/cat/')) continue;
      urls.add(u.split('#')[0]);
      if (urls.size >= Math.min(limit, 60)) break;
    }

    console.log(`[PCA] Found ${urls.size} event detail URLs`);

    for (const url of Array.from(urls)) {
      if (events.length >= limit) break;
      try {
        const detail = await fetchPcaEventDetail(url);
        if (!detail) continue;
        if (!isWithinRange(detail.start_date, rangeStart, rangeEnd)) continue;
        // Add Porsche affinity marker (not stored directly; future: create affinities table rows)
        detail.brand_affinity = 'Porsche';
        events.push(detail);
      } catch (err) {
        errors.push(`Failed to fetch event detail (${url}): ${err.message}`);
      }
    }

    console.log(`[PCA] Normalized ${events.length} events`);
    
  } catch (err) {
    console.error('[PCA] Error fetching events:', err);
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

function formatDate(date) {
  if (!date || isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

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

async function fetchPcaEventDetail(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'AutoRev/1.0 (https://autorev.app)',
      Accept: 'text/html',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const titleMatch = html.match(/property=\"og:title\" content=\"([^\"]+)\"/);
  const ogTitle = titleMatch ? titleMatch[1].trim() : null;
  const name = ogTitle ? ogTitle.replace(/\s*\\|\\s*Porsche Club of America\\s*$/i, '').trim() : null;

  // Date range line: "Saturday February 21, 2026 to Sunday February 22, 2026"
  const dateLineMatch = html.match(/class=\"normaltext\"[^>]*>\\s*([^<]*20\\d\\d[^<]*)\\s*(?:<span class=\"separator\">|<\/h5>)/i);
  const dateLine = dateLineMatch ? dateLineMatch[1].replace(/\s+/g, ' ').trim() : null;

  let start_date = null;
  let end_date = null;
  if (dateLine) {
    const m = dateLine.match(/([A-Za-z]+\\s+[A-Za-z]+\\s+\\d{1,2},\\s+20\\d\\d)\\s+to\\s+([A-Za-z]+\\s+[A-Za-z]+\\s+\\d{1,2},\\s+20\\d\\d)/);
    if (m) {
      start_date = formatDate(new Date(m[1]));
      end_date = formatDate(new Date(m[2]));
    } else {
      const m2 = dateLine.match(/([A-Za-z]+\\s+\\d{1,2},\\s+20\\d\\d)/);
      if (m2) start_date = formatDate(new Date(m2[1]));
    }
  }

  // Location block: <h6>Location:</h6> then next <h5> has address lines with <br>
  const locBlockMatch = html.match(/<h6[^>]*>\\s*Location:\\s*<\/h6>\\s*<h5[^>]*>([\\s\\S]*?)<\/h5>/i);
  const locHtml = locBlockMatch ? locBlockMatch[1] : null;
  const locText = locHtml ? locHtml.replace(/<br\\s*\/?>/gi, '\\n').replace(/<[^>]+>/g, '').trim() : null;
  const locLines = locText ? locText.split('\\n').map((l) => l.trim()).filter(Boolean) : [];

  let venue_name = null;
  let address = null;
  let city = null;
  let state = null;
  let zip = null;

  if (locLines.length > 0) {
    // Usually: street line(s) then "City, State ZIP"
    const last = locLines[locLines.length - 1];
    // Support either "City, PA 18045" or "City, Pennsylvania 18045"
    const m = last.match(/^(.+?),\\s*([A-Za-z .]+)\\s+(\\d{5}(?:-\\d{4})?)$/);
    if (m) {
      city = m[1].trim();
      state = normalizeState(m[2]);
      zip = m[3];
    }
    address = locLines.slice(0, Math.max(0, locLines.length - 1)).join(', ') || null;
  }

  const typeMatch = html.match(/Event Type:\\s*<span[^>]*>([^<]+)<\/span>/i);
  const typeText = typeMatch ? typeMatch[1].trim() : null;
  const event_type_slug = mapEventType(`${typeText || ''} ${name || ''}`, 'pca');

  if (!name || !start_date || !city) return null;

  return {
    name,
    description: null,
    event_type_slug,
    start_date,
    end_date,
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
    source_name: 'PCA',
    registration_url: url,
    image_url: null,
    cost_text: null,
    is_free: false,
    latitude: null,
    longitude: null,
  };
}

export default fetchPCAEvents;

