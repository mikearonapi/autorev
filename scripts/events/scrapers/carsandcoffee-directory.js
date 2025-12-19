#!/usr/bin/env node
/**
 * Cars & Coffee Directory Scraper
 * 
 * Scrapes carsandcoffeedirectory.com for Cars & Coffee events across all US states.
 * 
 * Usage:
 *   node scripts/events/scrapers/carsandcoffee-directory.js
 *   node scripts/events/scrapers/carsandcoffee-directory.js --state=CA
 *   node scripts/events/scrapers/carsandcoffee-directory.js --dry-run
 * 
 * @module scripts/events/scrapers/carsandcoffee-directory
 */

import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '..', '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '..', '..', '.env') });
import * as cheerio from 'cheerio';
import {
  buildEventSlug,
  mapRegion,
  getEventTypeId,
  upsertEvent,
  generateRecurringDates,
  createClientOrThrow,
} from '../lib/event-helpers.js';

const BASE_URL = 'https://www.carsandcoffeedirectory.com';
const YEAR = 2026;
const EVENT_TYPE_SLUG = 'cars-and-coffee';

// All US states
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

// State name to abbreviation mapping
const STATE_NAMES = {
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
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC', 'washington dc': 'DC'
};

/**
 * Parse CLI arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    state: null,
    dryRun: false,
    verbose: false,
  };
  
  for (const arg of args) {
    if (arg.startsWith('--state=')) {
      options.state = arg.split('=')[1].toUpperCase();
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    }
  }
  
  return options;
}

/**
 * Fetch HTML from URL with retry
 */
async function fetchHtml(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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
 * Parse recurrence from text like "Every Saturday" or "1st Sunday of each month"
 */
function parseRecurrence(text) {
  if (!text) return null;
  
  const lower = text.toLowerCase();
  
  // "Every Saturday", "Every Sunday"
  if (lower.includes('every saturday')) return 'Every Saturday';
  if (lower.includes('every sunday')) return 'Every Sunday';
  
  // "1st Saturday", "2nd Sunday", "3rd Saturday", "4th Sunday"
  const nthMatch = lower.match(/(\d)(st|nd|rd|th)\s+(saturday|sunday)/);
  if (nthMatch) {
    const nth = nthMatch[1];
    const suffix = nthMatch[2];
    const day = nthMatch[3].charAt(0).toUpperCase() + nthMatch[3].slice(1);
    return `${nth}${suffix} ${day} monthly`;
  }
  
  // "Last Saturday of each month"
  if (lower.includes('last saturday')) return 'Last Saturday monthly';
  if (lower.includes('last sunday')) return 'Last Sunday monthly';
  
  return null;
}

/**
 * Extract state abbreviation from location text
 */
function extractState(text) {
  if (!text) return null;
  
  // Try direct 2-letter state code at end
  const stateMatch = text.match(/,\s*([A-Z]{2})\s*$/);
  if (stateMatch && US_STATES.includes(stateMatch[1])) {
    return stateMatch[1];
  }
  
  // Try full state name
  const lower = text.toLowerCase();
  for (const [name, abbrev] of Object.entries(STATE_NAMES)) {
    if (lower.includes(name)) {
      return abbrev;
    }
  }
  
  return null;
}

/**
 * Extract city from location text
 */
function extractCity(text) {
  if (!text) return null;
  
  // "City, ST" format
  const match = text.match(/^([^,]+),/);
  if (match) {
    return match[1].trim();
  }
  
  return text.trim();
}

/**
 * Scrape events from a state page
 */
async function scrapeStatePage(stateAbbrev, verbose = false) {
  const stateLower = stateAbbrev.toLowerCase();
  const url = `${BASE_URL}/state/${stateLower}`;
  
  if (verbose) console.log(`  Fetching ${url}...`);
  
  const html = await fetchHtml(url);
  if (!html) {
    console.warn(`  ⚠️  Could not fetch ${stateAbbrev}`);
    return [];
  }
  
  const $ = cheerio.load(html);
  const events = [];
  
  // The directory uses card-based layouts - look for event entries
  // This selector may need adjustment based on actual site structure
  $('article, .event-card, .listing-card, [class*="event"], [class*="listing"]').each((_, el) => {
    const $el = $(el);
    
    // Extract event name
    const name = $el.find('h2, h3, .event-name, .title').first().text().trim();
    if (!name || name.length < 3) return;
    
    // Extract location
    const locationText = $el.find('.location, .address, [class*="location"]').first().text().trim() ||
                         $el.find('p').filter((_, p) => $(p).text().includes(',')).first().text().trim();
    
    const city = extractCity(locationText);
    const state = extractState(locationText) || stateAbbrev;
    
    // Extract venue/address
    const venue = $el.find('.venue, .venue-name').first().text().trim() || '';
    const address = $el.find('.address, .street-address').first().text().trim() || '';
    
    // Extract recurrence/schedule
    const scheduleText = $el.find('.schedule, .when, .time, [class*="schedule"]').first().text().trim() ||
                         $el.find('p').filter((_, p) => {
                           const t = $(p).text().toLowerCase();
                           return t.includes('saturday') || t.includes('sunday') || t.includes('every');
                         }).first().text().trim();
    
    const recurrence = parseRecurrence(scheduleText);
    
    // Extract source URL
    const sourceUrl = $el.find('a[href*="http"]').attr('href') ||
                      $el.find('a').attr('href') ||
                      url;
    
    // Extract description
    const description = $el.find('.description, .excerpt, p').first().text().trim().slice(0, 500);
    
    if (city) {
      events.push({
        name: name.includes('Cars') ? name : `${name} Cars & Coffee`,
        city,
        state,
        venue_name: venue || null,
        address: address || null,
        recurrence: recurrence || 'Every Saturday', // Default assumption
        source_url: sourceUrl.startsWith('http') ? sourceUrl : `${BASE_URL}${sourceUrl}`,
        description: description || `Cars & Coffee gathering in ${city}, ${state}`,
        cost_text: 'Free',
        is_free: true,
      });
    }
  });
  
  // Also try parsing the main content if no cards found
  if (events.length === 0) {
    // Try alternative parsing - look for lists or paragraphs with event info
    $('li, p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length < 20 || text.length > 500) return;
      
      // Look for patterns like "Event Name - City, ST - Schedule"
      const parts = text.split(/[-–—]/);
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const locationPart = parts[1] || '';
        const city = extractCity(locationPart);
        const state = extractState(locationPart) || stateAbbrev;
        
        if (name.length > 3 && city) {
          events.push({
            name: name.includes('Cars') ? name : `${name} Cars & Coffee`,
            city,
            state,
            recurrence: parseRecurrence(text) || 'Every Saturday',
            source_url: url,
            description: `Cars & Coffee gathering in ${city}, ${state}`,
            cost_text: 'Free',
            is_free: true,
          });
        }
      }
    });
  }
  
  if (verbose) console.log(`  Found ${events.length} events in ${stateAbbrev}`);
  
  return events;
}

/**
 * Main scraper function
 */
async function main() {
  const options = parseArgs();
  
  console.log('🚗 Cars & Coffee Directory Scraper\n');
  console.log(`Options: ${JSON.stringify(options)}\n`);
  
  const statesToScrape = options.state ? [options.state] : US_STATES;
  const allEvents = [];
  
  // Scrape each state
  for (const state of statesToScrape) {
    console.log(`📍 Scraping ${state}...`);
    const events = await scrapeStatePage(state, options.verbose);
    allEvents.push(...events);
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n📊 Total events scraped: ${allEvents.length}\n`);
  
  if (allEvents.length === 0) {
    console.log('⚠️  No events found. The site structure may have changed.');
    console.log('   Consider manual data entry or alternative sources.');
    return;
  }
  
  if (options.dryRun) {
    console.log('🔍 Dry run - not saving to database\n');
    console.log('Sample events:');
    allEvents.slice(0, 10).forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.name} - ${e.city}, ${e.state} (${e.recurrence})`);
    });
    return;
  }
  
  // Save to database
  const client = createClientOrThrow();
  const event_type_id = await getEventTypeId(client, EVENT_TYPE_SLUG);
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const baseEvent of allEvents) {
    try {
      // Generate dates for the recurrence pattern
      const dates = generateRecurringDates(baseEvent.recurrence, YEAR);
      
      if (dates.length === 0) {
        // If no recurrence parsed, create a single placeholder
        console.warn(`  ⚠️  No dates for ${baseEvent.name} (${baseEvent.recurrence})`);
        continue;
      }
      
      // Create event for each date
      for (const start_date of dates) {
        const slug = buildEventSlug(baseEvent.name, baseEvent.city, start_date);
        const region = mapRegion(baseEvent.state);
        
        const eventPayload = {
          ...baseEvent,
          slug,
          start_date,
          end_date: start_date,
          event_type_id,
          region,
          scope: 'local',
          featured: false,
        };
        
        const { data: existing } = await client
          .from('events')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();
        
        await upsertEvent(client, eventPayload);
        
        if (existing?.id) {
          updated++;
        } else {
          created++;
        }
      }
      
      console.log(`  ✅ ${baseEvent.name} - ${baseEvent.city}, ${baseEvent.state} (${dates.length} dates)`);
    } catch (err) {
      errors++;
      console.error(`  ❌ Error processing ${baseEvent.name}: ${err.message}`);
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

