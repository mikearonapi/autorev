#!/usr/bin/env node
/**
 * MotorsportReg Web Scraper
 * 
 * Since the API requires authentication for most endpoints, this scraper
 * extracts event data from the public MotorsportReg website.
 * 
 * Strategy:
 * 1. Use the public event search: https://www.motorsportreg.com/events/
 * 2. Filter by location (postal code) and date range
 * 3. Parse the HTML to extract event details
 * 4. Follow links to individual event pages for full details
 * 
 * @see https://www.motorsportreg.com/events/
 */

import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '..', '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '..', '..', '.env') });

import {
  buildEventSlug,
  mapRegion,
  getEventTypeId,
  upsertEvent,
  createClientOrThrow,
} from '../lib/event-helpers.js';

const BASE_URL = 'https://www.motorsportreg.com';

// US State abbreviations for parsing
const STATE_ABBREVS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

// Event type keywords to category mapping
const TYPE_KEYWORDS = {
  'hpde': 'track-day',
  'high performance': 'track-day',
  'track day': 'track-day',
  'open track': 'track-day',
  'lapping': 'track-day',
  'autocross': 'autocross',
  'solo': 'autocross',
  'autox': 'autocross',
  'time trial': 'time-attack',
  'time attack': 'time-attack',
  'rally': 'cruise',
  'rallycross': 'autocross',
  'concours': 'car-show',
  'car show': 'car-show',
  'meeting': 'club-meetup',
  'social': 'club-meetup',
  'tech session': 'club-meetup',
};

/**
 * Fetch HTML with retry logic
 */
async function fetchHtml(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.text();
    } catch (err) {
      console.warn(`Fetch attempt ${i + 1} failed for ${url}: ${err.message}`);
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
  return null;
}

/**
 * Parse location string to extract city and state
 */
function parseLocation(locationStr) {
  if (!locationStr) return { city: null, state: null };
  
  // Try "City, ST" format
  const match = locationStr.match(/([^,]+),\s*([A-Z]{2})/);
  if (match) {
    return { city: match[1].trim(), state: match[2] };
  }
  
  // Try to find state abbreviation anywhere
  for (const state of STATE_ABBREVS) {
    if (locationStr.includes(state)) {
      const parts = locationStr.split(state);
      return { 
        city: parts[0].replace(/[,\s]+$/, '').trim() || null,
        state 
      };
    }
  }
  
  return { city: locationStr.trim(), state: null };
}

/**
 * Determine event type from name and description
 */
function determineEventType(name, description = '') {
  const text = `${name} ${description}`.toLowerCase();
  
  for (const [keyword, type] of Object.entries(TYPE_KEYWORDS)) {
    if (text.includes(keyword)) {
      return type;
    }
  }
  
  // Default for motorsport events
  return 'track-day';
}

/**
 * Parse date string to YYYY-MM-DD format
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Scrape events from MSR event search page
 */
async function scrapeEventSearch(options = {}) {
  const params = new URLSearchParams();
  
  // Location filtering
  if (options.postalCode) {
    params.append('within', options.radius || 200);
    params.append('zip', options.postalCode);
  }
  
  // Country filter
  params.append('country', options.country || 'US');
  
  const url = `${BASE_URL}/events/?${params.toString()}`;
  console.log(`Fetching: ${url}`);
  
  const html = await fetchHtml(url);
  if (!html) {
    console.error('Failed to fetch event search page');
    return [];
  }
  
  const $ = cheerio.load(html);
  const events = [];
  
  // Parse event listings - MSR uses various selectors
  $('article.event, .event-listing, [data-event-id], .calendar-event').each((_, el) => {
    const $el = $(el);
    
    // Extract event details
    const name = $el.find('h2, h3, .event-name, .title').first().text().trim();
    const dateText = $el.find('.date, .event-date, time').first().text().trim();
    const locationText = $el.find('.location, .venue, .event-location').first().text().trim();
    const link = $el.find('a[href*="/events/"]').first().attr('href');
    const description = $el.find('.description, .excerpt, p').first().text().trim();
    const orgName = $el.find('.organization, .host, .organizer').first().text().trim();
    
    if (!name || name.length < 3) return;
    
    const { city, state } = parseLocation(locationText);
    const eventType = determineEventType(name, description);
    const startDate = parseDate(dateText);
    
    events.push({
      name,
      city,
      state,
      start_date: startDate,
      end_date: startDate, // Will be updated from detail page if multi-day
      source_url: link ? (link.startsWith('http') ? link : `${BASE_URL}${link}`) : url,
      description: description.slice(0, 500),
      event_type_slug: eventType,
      organizer: orgName,
      venue_name: locationText.split(',')[0]?.trim() || null,
    });
  });
  
  // Also try parsing list/table formats
  if (events.length === 0) {
    $('tr, li').each((_, el) => {
      const $el = $(el);
      const text = $el.text();
      
      // Skip if too short or too long
      if (text.length < 20 || text.length > 1000) return;
      
      // Look for event patterns
      const link = $el.find('a[href*="/events/"]').first();
      if (link.length) {
        const name = link.text().trim();
        const href = link.attr('href');
        
        if (name && name.length > 3) {
          events.push({
            name,
            source_url: href?.startsWith('http') ? href : `${BASE_URL}${href}`,
            event_type_slug: determineEventType(name),
            // Other fields will be populated from detail page
          });
        }
      }
    });
  }
  
  return events;
}

/**
 * Scrape detailed event info from individual event page
 */
async function scrapeEventDetail(eventUrl) {
  const html = await fetchHtml(eventUrl);
  if (!html) return null;
  
  const $ = cheerio.load(html);
  
  // Extract detailed info
  const details = {
    name: $('h1, .event-title').first().text().trim(),
    description: $('.description, .event-description, [itemprop="description"]').first().text().trim().slice(0, 1000),
    start_date: null,
    end_date: null,
    venue_name: null,
    address: null,
    city: null,
    state: null,
    zip: null,
    latitude: null,
    longitude: null,
    cost_text: null,
  };
  
  // Extract venue info
  const venueEl = $('.venue, .location, [itemprop="location"]');
  if (venueEl.length) {
    details.venue_name = venueEl.find('.name, [itemprop="name"]').first().text().trim();
    details.address = venueEl.find('.address, [itemprop="streetAddress"]').first().text().trim();
    details.city = venueEl.find('.city, [itemprop="addressLocality"]').first().text().trim();
    details.state = venueEl.find('.state, [itemprop="addressRegion"]').first().text().trim();
    details.zip = venueEl.find('.zip, [itemprop="postalCode"]').first().text().trim();
  }
  
  // Extract dates
  const dateEl = $('.date, .event-date, [itemprop="startDate"]');
  if (dateEl.length) {
    const startAttr = dateEl.attr('datetime') || dateEl.attr('content');
    if (startAttr) {
      details.start_date = parseDate(startAttr);
    }
  }
  
  const endDateEl = $('[itemprop="endDate"]');
  if (endDateEl.length) {
    const endAttr = endDateEl.attr('datetime') || endDateEl.attr('content');
    if (endAttr) {
      details.end_date = parseDate(endAttr);
    }
  }
  
  // Extract cost
  const priceEl = $('.price, .cost, .fee, [itemprop="price"]');
  if (priceEl.length) {
    details.cost_text = priceEl.text().trim();
  }
  
  // Extract coordinates from map embed if available
  const mapEl = $('[data-lat], [data-lng], .map');
  if (mapEl.length) {
    const lat = mapEl.attr('data-lat');
    const lng = mapEl.attr('data-lng');
    if (lat && lng) {
      details.latitude = parseFloat(lat);
      details.longitude = parseFloat(lng);
    }
  }
  
  return details;
}

/**
 * Main scraper function
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse CLI options
  const options = {
    postalCode: null,
    radius: 200,
    country: 'US',
    dryRun: false,
    limit: 50,
  };
  
  for (const arg of args) {
    if (arg.startsWith('--zip=')) {
      options.postalCode = arg.split('=')[1];
    } else if (arg.startsWith('--radius=')) {
      options.radius = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    }
  }
  
  console.log('🏎️ MotorsportReg Web Scraper\n');
  console.log(`Options: ${JSON.stringify(options)}\n`);
  
  if (!options.postalCode) {
    console.log('Usage:');
    console.log('  node motorsportreg-scraper.js --zip=22066 [--radius=200] [--dry-run] [--limit=50]');
    console.log('\nExample:');
    console.log('  node motorsportreg-scraper.js --zip=22066 --radius=100 --dry-run');
    console.log('\nThis will scrape MotorsportReg events within the specified radius of the zip code.');
    return;
  }
  
  // Scrape event search
  console.log('Scraping event search page...');
  const events = await scrapeEventSearch(options);
  
  console.log(`Found ${events.length} events in search results\n`);
  
  if (events.length === 0) {
    console.log('No events found. The page structure may have changed.');
    console.log('Consider checking https://www.motorsportreg.com/events/ manually.');
    return;
  }
  
  // Optionally fetch detail pages
  const detailedEvents = [];
  const eventsToProcess = events.slice(0, options.limit);
  
  for (const event of eventsToProcess) {
    console.log(`Processing: ${event.name}`);
    
    if (event.source_url && event.source_url.includes('/events/')) {
      const details = await scrapeEventDetail(event.source_url);
      if (details) {
        detailedEvents.push({ ...event, ...details });
      } else {
        detailedEvents.push(event);
      }
    } else {
      detailedEvents.push(event);
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\nProcessed ${detailedEvents.length} events\n`);
  
  if (options.dryRun) {
    console.log('🔍 Dry run - not saving to database\n');
    console.log('Sample events:');
    for (const event of detailedEvents.slice(0, 10)) {
      console.log(`\n📅 ${event.name}`);
      console.log(`   Date: ${event.start_date || 'TBD'}`);
      console.log(`   Location: ${event.city || 'TBD'}, ${event.state || 'TBD'}`);
      console.log(`   Venue: ${event.venue_name || 'TBD'}`);
      console.log(`   Type: ${event.event_type_slug}`);
      console.log(`   URL: ${event.source_url}`);
    }
    return;
  }
  
  // Save to database
  const client = createClientOrThrow();
  const typeCache = new Map();
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const event of detailedEvents) {
    try {
      if (!event.name || !event.start_date) {
        console.warn(`⚠️  Skipping event with missing name or date`);
        continue;
      }
      
      const eventTypeSlug = event.event_type_slug || 'track-day';
      
      if (!typeCache.has(eventTypeSlug)) {
        typeCache.set(eventTypeSlug, await getEventTypeId(client, eventTypeSlug));
      }
      const event_type_id = typeCache.get(eventTypeSlug);
      
      const slug = buildEventSlug(event.name, event.city || 'unknown', event.start_date);
      const region = mapRegion(event.state);
      
      const payload = {
        name: event.name,
        slug,
        city: event.city,
        state: event.state,
        venue_name: event.venue_name,
        address: event.address,
        zip: event.zip,
        latitude: event.latitude,
        longitude: event.longitude,
        start_date: event.start_date,
        end_date: event.end_date || event.start_date,
        source_url: event.source_url,
        description: event.description,
        cost_text: event.cost_text,
        is_free: false,
        event_type_id,
        region,
        country: 'USA',
        scope: 'regional',
        featured: false,
      };
      
      const { data: existing } = await client
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
      await upsertEvent(client, payload);
      
      if (existing?.id) {
        updated++;
        console.log(`🔄 Updated: ${event.name}`);
      } else {
        created++;
        console.log(`✅ Created: ${event.name}`);
      }
    } catch (err) {
      errors++;
      console.error(`❌ Error: ${event.name} - ${err.message}`);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Errors: ${errors}`);
}

main().catch((err) => {
  console.error('❌ Scraper failed:', err);
  process.exit(1);
});







