#!/usr/bin/env node
/**
 * Priority Backfill for Track Events
 * 
 * Track events (HPDE, autocross, time attack) are currently the biggest gap
 * in the events database. This script specifically targets track sources:
 * 
 * Sources (in priority order):
 * 1. Track venue calendars (most reliable - direct from source)
 * 2. MotorsportReg (if not blocked)
 * 3. SCCA (autocross/track)
 * 4. iCal feeds from clubs
 * 
 * Usage:
 *   # Run all track sources
 *   node scripts/backfill-track-events.js
 * 
 *   # Dry run
 *   node scripts/backfill-track-events.js --dryRun
 * 
 *   # Specific region
 *   node scripts/backfill-track-events.js --region=Southeast
 * 
 * @module scripts/backfill-track-events
 */

import 'dotenv/config';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fetchTrackVenueEvents, getTrackVenues, getTracksByRegion } from '../lib/eventSourceFetchers/trackVenueFetcher.js';
import { fetchSCCAEvents } from '../lib/eventSourceFetchers/scca.js';
import { fetchMotorsportRegEvents } from '../lib/eventSourceFetchers/motorsportreg.js';
import { fetchIcalEvents } from '../lib/eventSourceFetchers/icalAggregator.js';
import { deduplicateBatch } from '../lib/eventDeduplication.js';
import { buildEventRows } from '../lib/eventsIngestion/buildEventRows.js';

// Load .env.local
dotenv.config({ path: '.env.local' });

/**
 * Parse command line arguments
 */
function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, ...valueParts] = arg.slice(2).split('=');
      args[key] = valueParts.length > 0 ? valueParts.join('=') : true;
    }
  }
  return args;
}

/**
 * Track event sources to run
 */
const TRACK_SOURCES = [
  { 
    key: 'trackvenue', 
    name: 'Track Venue Calendars',
    fetcher: fetchTrackVenueEvents,
    priority: 1,
  },
  { 
    key: 'scca', 
    name: 'SCCA Calendar',
    fetcher: fetchSCCAEvents,
    priority: 2,
  },
  { 
    key: 'motorsportreg', 
    name: 'MotorsportReg',
    fetcher: fetchMotorsportRegEvents,
    priority: 3,
  },
];

/**
 * Main entry point
 */
async function main() {
  const args = parseArgs(process.argv);
  
  const dryRun = args.dryRun === true || args.dryRun === 'true';
  const region = args.region || null;
  const limit = args.limit ? parseInt(args.limit, 10) : 200;
  
  // Date range: default to next 12 months
  const now = new Date();
  const oneYearFromNow = new Date(now);
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  const rangeStart = args.rangeStart || now.toISOString().slice(0, 10);
  const rangeEnd = args.rangeEnd || oneYearFromNow.toISOString().slice(0, 10);
  
  console.log('');
  console.log('🏎️  Track Events Priority Backfill');
  console.log('='.repeat(50));
  console.log(`Mode:        ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Region:      ${region || 'ALL'}`);
  console.log(`Date Range:  ${rangeStart} to ${rangeEnd}`);
  console.log(`Limit:       ${limit} per source`);
  console.log('='.repeat(50));
  
  // Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
  
  // Load event types
  const { data: eventTypes, error: etError } = await supabase
    .from('event_types')
    .select('id, slug');
  
  if (etError) {
    console.error('Failed to load event_types:', etError.message);
    process.exit(1);
  }
  
  const eventTypeIdBySlug = new Map((eventTypes || []).map(t => [t.slug, t.id]));
  const otherTypeId = eventTypeIdBySlug.get('other') || null;
  
  // Load existing events for deduplication
  const { data: existingEvents, error: existErr } = await supabase
    .from('events')
    .select('id, slug, source_url, start_date, city, state, name')
    .gte('start_date', rangeStart);
  
  const existingEventsList = existingEvents || [];
  const existingSlugs = new Set(existingEventsList.map(e => e.slug));
  const existingSlugByConflictKey = new Map(
    existingEventsList.map(e => [
      `${String(e.source_url || '').trim()}|${String(e.start_date || '').trim()}`,
      e.slug
    ])
  );
  
  console.log(`\nLoaded ${existingEventsList.length} existing events for deduplication`);
  
  // Track results
  const results = {
    total: { fetched: 0, validated: 0, unique: 0, inserted: 0 },
    bySources: {},
    byCategory: {},
    errors: [],
  };
  
  // Print track venues by region
  if (!region) {
    const tracks = getTrackVenues();
    const byRegion = {};
    for (const t of tracks) {
      byRegion[t.region] = (byRegion[t.region] || 0) + 1;
    }
    console.log('\nTrack Venues by Region:');
    for (const [r, count] of Object.entries(byRegion).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${r}: ${count} tracks`);
    }
  }
  
  // Run each source
  for (const source of TRACK_SOURCES) {
    console.log(`\n📡 ${source.name}`);
    console.log('-'.repeat(40));
    
    try {
      // Build source config
      const sourceConfig = { 
        name: source.key,
        scrape_config: {
          eventTypes: ['track-day', 'autocross', 'time-attack', 'hpde'],
        }
      };
      
      // Fetch events
      const { events, errors } = await source.fetcher(sourceConfig, {
        limit,
        rangeStart,
        rangeEnd,
        region,
      });
      
      if (errors?.length > 0) {
        results.errors.push(...errors.slice(0, 5).map(e => `[${source.key}] ${e}`));
      }
      
      results.total.fetched += events.length;
      results.bySources[source.key] = { fetched: events.length, inserted: 0 };
      
      console.log(`  Fetched: ${events.length} events`);
      
      if (events.length === 0) continue;
      
      // Validate
      const validated = events.filter(e => {
        if (!e.name || !e.source_url || !e.start_date) return false;
        try { new URL(e.source_url); } catch { return false; }
        return true;
      });
      
      results.total.validated += validated.length;
      console.log(`  Validated: ${validated.length}`);
      
      // Deduplicate
      const { unique } = deduplicateBatch(validated, existingEventsList);
      results.total.unique += unique.length;
      console.log(`  Unique: ${unique.length}`);
      
      if (unique.length === 0) continue;
      
      // Build rows
      const rows = buildEventRows({
        events: unique,
        source: sourceConfig,
        eventTypeIdBySlug,
        otherTypeId,
        existingSlugs,
        existingSlugByConflictKey,
        verifiedAtIso: new Date().toISOString(),
        scrapeJobId: null,
      });
      
      // Track by category
      for (const row of rows) {
        const slug = eventTypeIdBySlug.get(row.event_type_id) || 
                    Array.from(eventTypeIdBySlug.entries()).find(([_, id]) => id === row.event_type_id)?.[0] ||
                    'unknown';
        results.byCategory[slug] = (results.byCategory[slug] || 0) + 1;
      }
      
      // Insert (if not dry run)
      if (dryRun) {
        console.log(`  [DRY RUN] Would insert ${rows.length} events`);
        continue;
      }
      
      const { data: inserted, error: insertErr } = await supabase
        .from('events')
        .upsert(rows, { onConflict: 'source_url,start_date' })
        .select('id');
      
      if (insertErr) {
        console.error(`  Insert error: ${insertErr.message}`);
        results.errors.push(`[${source.key}] Insert failed: ${insertErr.message}`);
      } else {
        const count = inserted?.length || 0;
        results.total.inserted += count;
        results.bySources[source.key].inserted = count;
        console.log(`  Inserted: ${count}`);
        
        // Add to existing for future dedup
        for (const row of rows) {
          existingEventsList.push({
            slug: row.slug,
            source_url: row.source_url,
            start_date: row.start_date,
            city: row.city,
            state: row.state,
            name: row.name,
          });
        }
      }
      
    } catch (error) {
      console.error(`  Error: ${error.message}`);
      results.errors.push(`[${source.key}] ${error.message}`);
      results.bySources[source.key] = { fetched: 0, inserted: 0, error: error.message };
    }
    
    // Rate limit between sources
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Print summary
  console.log('');
  console.log('='.repeat(50));
  console.log('📊 TRACK EVENTS BACKFILL SUMMARY');
  console.log('='.repeat(50));
  console.log(`Mode:        ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Fetched:     ${results.total.fetched}`);
  console.log(`Validated:   ${results.total.validated}`);
  console.log(`Unique:      ${results.total.unique}`);
  console.log(`Inserted:    ${results.total.inserted}`);
  
  console.log('\nBy Source:');
  for (const [src, data] of Object.entries(results.bySources)) {
    const status = data.error ? '✗' : '✓';
    console.log(`  ${status} ${src}: ${data.fetched} fetched, ${data.inserted} inserted`);
  }
  
  if (Object.keys(results.byCategory).length > 0) {
    console.log('\nBy Category:');
    for (const [cat, count] of Object.entries(results.byCategory).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${cat}: ${count}`);
    }
  }
  
  if (results.errors.length > 0) {
    console.log('\nErrors:');
    for (const err of results.errors.slice(0, 10)) {
      console.log(`  ${err}`);
    }
  }
  
  console.log('='.repeat(50));
  console.log('');
  
  // Exit code
  process.exit(results.errors.length > 5 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

