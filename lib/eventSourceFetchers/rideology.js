/**
 * Rideology.io Event Fetcher
 *
 * Rideology is a user-submitted car meet directory with thousands of events nationwide.
 * The site has a structured format that allows scraping of meet details.
 * 
 * Site structure:
 * - List page: /Car-Meets (shows meets by date/location)
 * - Detail page: /Car-Meets/Car-Meet-Details/{id}
 * 
 * Config expected in event_sources.scrape_config:
 * {
 *   "baseUrl": "https://www.rideology.io",
 *   "maxPages": 10
 * }
 */

import { load } from 'cheerio';

import { mapEventType, getRegionFromState } from './index.js';

function absUrl(base, href) {
  if (!href) return null;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function parseDateToIsoDate(maybeDate) {
  if (!maybeDate) return null;
  const d = new Date(maybeDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * Extract state abbreviation from address text
 */
function extractState(text) {
  if (!text) return null;
  
  // Look for 2-letter state code
  const stateMatch = text.match(/\b([A-Z]{2})\b/);
  if (stateMatch) return stateMatch[1];
  
  // Full state name mappings
  const stateNames = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY'
  };
  
  const lowerText = text.toLowerCase();
  for (const [name, abbrev] of Object.entries(stateNames)) {
    if (lowerText.includes(name)) return abbrev;
  }
  
  return null;
}

/**
 * Extract city from address text
 */
function extractCity(text) {
  if (!text) return null;
  
  // Try to find city before state abbreviation
  const cityStateMatch = text.match(/([A-Za-z\s]+),?\s*([A-Z]{2})\b/);
  if (cityStateMatch) {
    return cityStateMatch[1].trim();
  }
  
  // Just return first part before comma
  const parts = text.split(',');
  if (parts.length > 0) {
    return parts[0].trim();
  }
  
  return null;
}

async function fetchText(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          // Use browser-like headers to avoid bot detection
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"macOS"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const text = await res.text();
      
      // Check for bot protection pages
      if (text.includes('Incapsula') || text.includes('_Incapsula_Resource') || 
          text.includes('Request unsuccessful') || text.includes('Access Denied')) {
        throw new Error('Bot protection detected - site is blocking automated access');
      }
      
      return text;
    } catch (err) {
      if (attempt === retries) throw err;
      // Exponential backoff
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
}

/**
 * Parse the main car meets listing page
 */
function parseListPage(html, baseUrl) {
  const $ = load(html);
  const meets = [];
  
  // Rideology uses a card-based layout for meets
  // Look for meet links and basic info
  $('a[href*="/Car-Meets/Car-Meet-Details/"]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const url = absUrl(baseUrl, href);
    
    if (!url) return;
    
    // Extract meet ID from URL
    const idMatch = href.match(/\/(\d+)$/);
    const meetId = idMatch ? idMatch[1] : null;
    
    // Get name from link text or nearby heading
    let name = $el.text().trim();
    if (!name || name.length < 3) {
      name = $el.closest('.card, .meet-item, [class*=meet]').find('h2, h3, h4, .title').first().text().trim();
    }
    
    if (name && meetId) {
      meets.push({
        meetId,
        name,
        detailUrl: url,
      });
    }
  });
  
  // Deduplicate by meetId
  const seen = new Set();
  return meets.filter(m => {
    if (seen.has(m.meetId)) return false;
    seen.add(m.meetId);
    return true;
  });
}

/**
 * Parse individual meet detail page
 */
function parseMeetDetailPage(html, baseUrl, meetId) {
  const $ = load(html);
  
  // Extract meet name
  const name = $('h1, h2').first().text().trim() || 
               $('[class*=title]').first().text().trim();
  
  if (!name) return null;
  
  // Look for structured data
  const hoursText = $('*:contains("Hours:")').text() || '';
  const whenText = $('*:contains("When:")').text() || '';
  const costText = $('*:contains("Cost:")').text() || '';
  
  // Extract times
  let startTime = null;
  let endTime = null;
  const timeMatch = hoursText.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (timeMatch) {
    startTime = timeMatch[1].padStart(5, '0') + ':00';
    endTime = timeMatch[2].padStart(5, '0') + ':00';
  }
  
  // Extract frequency/schedule
  const isWeekly = /weekly/i.test(whenText);
  const isMonthly = /monthly/i.test(whenText);
  
  // Extract venue/address info
  const addressEl = $('[class*=address], [class*=location], [class*=venue]').first();
  const addressText = addressEl.text().trim() || 
                      $('*:contains("Location:")').text().replace(/Location:/i, '').trim();
  
  const city = extractCity(addressText);
  const state = extractState(addressText);
  
  // Extract venue name (often the first line of location)
  let venueName = null;
  const venueMatch = addressText.match(/^([^;,\n]+)/);
  if (venueMatch && venueMatch[1].length < 100) {
    venueName = venueMatch[1].trim();
  }
  
  // Determine if free
  const isFree = /free/i.test(costText) || costText.trim() === '' || costText.includes('$0');
  
  // Build event type slug
  const eventTypeSlug = mapEventType(name, 'rideology');
  
  // Get next occurrence date (default to next Saturday for weekly meets)
  let startDate = null;
  const dateMatch = whenText.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (dateMatch) {
    const d = new Date(`${dateMatch[1]} ${dateMatch[2]}, ${dateMatch[3]}`);
    if (!Number.isNaN(d.getTime())) {
      startDate = d.toISOString().slice(0, 10);
    }
  }
  
  // If no specific date, generate upcoming dates for recurring events
  if (!startDate && (isWeekly || isMonthly)) {
    const now = new Date();
    // Find next occurrence (default to next Saturday for C&C events)
    const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + daysUntilSaturday);
    startDate = nextDate.toISOString().slice(0, 10);
  }
  
  if (!startDate) {
    // Default to 30 days from now
    const future = new Date();
    future.setDate(future.getDate() + 30);
    startDate = future.toISOString().slice(0, 10);
  }
  
  return {
    name,
    description: `Car meet found on Rideology. ${isWeekly ? 'Weekly event.' : isMonthly ? 'Monthly event.' : ''}`.trim(),
    event_type_slug: eventTypeSlug,
    start_date: startDate,
    end_date: null,
    start_time: startTime,
    end_time: endTime,
    timezone: 'America/New_York', // Default, should be derived from state
    venue_name: venueName,
    address: addressText.slice(0, 200),
    city,
    state,
    zip: null,
    country: 'USA',
    region: state ? getRegionFromState(state) : null,
    scope: 'local',
    source_url: `${baseUrl}/Car-Meets/Car-Meet-Details/${meetId}`,
    registration_url: null,
    image_url: null,
    cost_text: isFree ? 'Free' : costText.slice(0, 50) || null,
    is_free: isFree,
    latitude: null,
    longitude: null,
  };
}

/**
 * Main fetcher function
 */
export async function fetchRideologyEvents(source, options = {}) {
  const { limit = 100, dryRun = false } = options;
  const events = [];
  const errors = [];
  
  if (dryRun) return { events: [], errors: [] };
  
  const baseUrl = source?.base_url || 'https://www.rideology.io';
  
  try {
    console.log(`[Rideology] Attempting to fetch meets from ${baseUrl}`);
    
    // Try to fetch main listing page
    const listHtml = await fetchText(`${baseUrl}/Car-Meets`);
    const meetsList = parseListPage(listHtml, baseUrl);
    
    console.log(`[Rideology] Found ${meetsList.length} meets on listing page`);
    
    if (meetsList.length > 0) {
      // Fetch details for each meet (up to limit)
      const meetsToFetch = meetsList.slice(0, Math.min(limit, meetsList.length));
      
      for (const meet of meetsToFetch) {
        if (events.length >= limit) break;
        
        try {
          await new Promise(r => setTimeout(r, 500));
          
          const detailHtml = await fetchText(meet.detailUrl);
          const eventData = parseMeetDetailPage(detailHtml, baseUrl, meet.meetId);
          
          if (eventData && eventData.name && eventData.city && eventData.state) {
            events.push(eventData);
            console.log(`[Rideology] Parsed: ${eventData.name} (${eventData.city}, ${eventData.state})`);
          }
        } catch (err) {
          errors.push(`Failed to fetch meet ${meet.meetId}: ${err.message}`);
        }
      }
    }
    
  } catch (err) {
    console.warn(`[Rideology] Live scraping failed: ${err.message}`);
    errors.push(`Live scraping failed: ${err.message}`);
  }
  
  console.log(`[Rideology] Completed: ${events.length} events, ${errors.length} errors`);
  
  return { events, errors };
}

export default fetchRideologyEvents;

