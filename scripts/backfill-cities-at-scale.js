#!/usr/bin/env node
/**
 * Large-Scale City-by-City Event Backfill
 * 
 * Systematically processes all 494 target cities using EventbriteSearch
 * with multiple query types. Designed to run in batches with progress tracking.
 * 
 * Strategy:
 * - Process cities by priority tier (1 → 4)
 * - Run all 6 query types per city
 * - Track progress in database (target_cities.events_last_scraped_at)
 * - Resume from where we left off
 * - Rate limit to avoid blocks
 * 
 * Usage:
 *   # Process next batch of cities (default 25)
 *   node scripts/backfill-cities-at-scale.js
 * 
 *   # Process specific tier
 *   node scripts/backfill-cities-at-scale.js --tier=1
 * 
 *   # Process more cities per run
 *   node scripts/backfill-cities-at-scale.js --batchSize=50
 * 
 *   # Dry run
 *   node scripts/backfill-cities-at-scale.js --dryRun
 * 
 *   # Force re-process cities (ignore last scraped date)
 *   node scripts/backfill-cities-at-scale.js --force
 * 
 * @module scripts/backfill-cities-at-scale
 */

import 'dotenv/config';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fetchFromSource } from '../lib/eventSourceFetchers/index.js';
import { deduplicateBatch } from '../lib/eventDeduplication.js';
import { buildEventRows } from '../lib/eventsIngestion/buildEventRows.js';

dotenv.config({ path: '.env.local' });

// Configuration
const DEFAULT_BATCH_SIZE = 25;
const EVENTS_PER_CITY_LIMIT = 50;
const DELAY_BETWEEN_CITIES_MS = 3000;
const DELAY_BETWEEN_QUERIES_MS = 1000;

// Date range: next 12 months
const now = new Date();
const RANGE_START = now.toISOString().slice(0, 10);
const oneYearFromNow = new Date(now);
oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
const RANGE_END = oneYearFromNow.toISOString().slice(0, 10);

/**
 * Parse CLI args
 */
function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, ...rest] = arg.slice(2).split('=');
      args[key] = rest.length > 0 ? rest.join('=') : true;
    }
  }
  return args;
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Main execution
 */
async function main() {
  const args = parseArgs(process.argv);
  
  const dryRun = args.dryRun === true || args.dryRun === 'true';
  const force = args.force === true || args.force === 'true';
  const batchSize = args.batchSize ? parseInt(args.batchSize, 10) : DEFAULT_BATCH_SIZE;
  const tierFilter = args.tier ? parseInt(args.tier, 10) : null;
  
  console.log('');
  console.log('🌆 Large-Scale City Event Backfill');
  console.log('='.repeat(60));
  console.log(`Mode:           ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Batch Size:     ${batchSize} cities`);
  console.log(`Tier Filter:    ${tierFilter || 'ALL'}`);
  console.log(`Force Reprocess: ${force}`);
  console.log(`Date Range:     ${RANGE_START} to ${RANGE_END}`);
  console.log('='.repeat(60));
  
  // Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase credentials');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
  
  // Load EventbriteSearch source
  const { data: source, error: srcErr } = await supabase
    .from('event_sources')
    .select('*')
    .eq('name', 'EventbriteSearch')
    .single();
  
  if (srcErr || !source) {
    console.error('Error: EventbriteSearch source not found');
    process.exit(1);
  }
  
  // Load event types
  const { data: eventTypes } = await supabase.from('event_types').select('id, slug');
  const eventTypeIdBySlug = new Map((eventTypes || []).map(t => [t.slug, t.id]));
  const otherTypeId = eventTypeIdBySlug.get('other') || null;
  
  // Get cities to process
  let cityQuery = supabase
    .from('target_cities')
    .select('id, city, state, priority_tier, population_rank, last_coverage_check, total_event_count')
    .order('priority_tier', { ascending: true })
    .order('population_rank', { ascending: true });
  
  if (tierFilter) {
    cityQuery = cityQuery.eq('priority_tier', tierFilter);
  }
  
  if (!force) {
    // Only get cities not recently scraped (within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    cityQuery = cityQuery.or(`last_coverage_check.is.null,last_coverage_check.lt.${sevenDaysAgo.toISOString()}`);
  }
  
  const { data: cities, error: cityErr } = await cityQuery.limit(batchSize);
  
  if (cityErr) {
    console.error('Error loading cities:', cityErr.message);
    process.exit(1);
  }
  
  if (!cities || cities.length === 0) {
    console.log('\n✅ All cities in scope have been recently processed!');
    console.log('   Use --force to reprocess, or --tier=X to target specific tier.');
    process.exit(0);
  }
  
  console.log(`\nProcessing ${cities.length} cities...\n`);
  
  // Load existing events for deduplication
  const { data: existingEvents } = await supabase
    .from('events')
    .select('id, slug, source_url, start_date, city, state, name')
    .gte('start_date', RANGE_START);
  
  const existingEventsList = existingEvents || [];
  const existingSlugs = new Set(existingEventsList.map(e => e.slug));
  const existingSlugByConflictKey = new Map(
    existingEventsList.map(e => [
      `${String(e.source_url || '').trim()}|${String(e.start_date || '').trim()}`,
      e.slug
    ])
  );
  
  // Results tracking
  const results = {
    citiesProcessed: 0,
    citiesWithEvents: 0,
    totalFetched: 0,
    totalInserted: 0,
    byCategory: {},
    errors: [],
  };
  
  // Process each city
  for (const city of cities) {
    const cityLabel = `${city.city}, ${city.state}`;
    console.log(`\n📍 ${cityLabel} (Tier ${city.priority_tier}, Rank #${city.population_rank})`);
    
    let cityFetched = 0;
    let cityInserted = 0;
    
    // Create scrape job for this city
    let scrapeJobId = null;
    if (!dryRun) {
      const { data: job } = await supabase
        .from('scrape_jobs')
        .insert({
          job_type: 'events_city_backfill',
          status: 'running',
          priority: 5,
          source_key: 'EventbriteSearch',
          started_at: new Date().toISOString(),
          sources_attempted: ['EventbriteSearch'],
          job_payload: {
            kind: 'events_city_backfill',
            city: city.city,
            state: city.state,
            tier: city.priority_tier,
          },
        })
        .select('id')
        .single();
      
      scrapeJobId = job?.id;
    }
    
    try {
      // Fetch events for this city
      const { events, errors } = await fetchFromSource(source, {
        limit: EVENTS_PER_CITY_LIMIT,
        rangeStart: RANGE_START,
        rangeEnd: RANGE_END,
        location: { city: city.city, state: city.state },
      });
      
      if (errors?.length > 0) {
        results.errors.push(...errors.slice(0, 2).map(e => `[${cityLabel}] ${e}`));
      }
      
      cityFetched = events.length;
      results.totalFetched += cityFetched;
      console.log(`   Fetched: ${cityFetched}`);
      
      if (events.length > 0) {
        // Deduplicate
        const { unique } = deduplicateBatch(events, existingEventsList);
        console.log(`   Unique: ${unique.length}`);
        
        if (unique.length > 0 && !dryRun && scrapeJobId) {
          // Build and insert rows
          const rows = buildEventRows({
            events: unique,
            source,
            eventTypeIdBySlug,
            otherTypeId,
            existingSlugs,
            existingSlugByConflictKey,
            verifiedAtIso: new Date().toISOString(),
            scrapeJobId,
          });
          
          if (rows.length > 0) {
            const { data: inserted, error: insertErr } = await supabase
              .from('events')
              .upsert(rows, { onConflict: 'source_url,start_date' })
              .select('id, event_type_id');
            
            if (insertErr) {
              results.errors.push(`[${cityLabel}] Insert failed: ${insertErr.message}`);
            } else {
              cityInserted = inserted?.length || 0;
              results.totalInserted += cityInserted;
              
              // Track by category
              for (const row of inserted || []) {
                const slug = Array.from(eventTypeIdBySlug.entries())
                  .find(([_, id]) => id === row.event_type_id)?.[0] || 'other';
                results.byCategory[slug] = (results.byCategory[slug] || 0) + 1;
              }
              
              // Add to existing for dedup
              for (const row of rows) {
                existingEventsList.push({
                  slug: row.slug,
                  source_url: row.source_url,
                  start_date: row.start_date,
                  city: row.city,
                  state: row.state,
                  name: row.name,
                });
                existingSlugs.add(row.slug);
              }
            }
          }
          
          console.log(`   Inserted: ${cityInserted}`);
        } else if (dryRun) {
          console.log(`   [DRY RUN] Would insert ${unique.length}`);
        }
      }
      
      results.citiesProcessed++;
      if (cityInserted > 0) {
        results.citiesWithEvents++;
      }
      
      // Update city's last scraped timestamp
      if (!dryRun) {
        await supabase
          .from('target_cities')
          .update({ 
            last_coverage_check: new Date().toISOString(),
            total_event_count: (city.total_event_count || 0) + cityInserted,
          })
          .eq('id', city.id);
        
        // Update scrape job
        if (scrapeJobId) {
          await supabase
            .from('scrape_jobs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              sources_succeeded: ['EventbriteSearch'],
            })
            .eq('id', scrapeJobId);
        }
      }
      
    } catch (err) {
      results.errors.push(`[${cityLabel}] ${err.message}`);
      console.log(`   Error: ${err.message}`);
      
      if (scrapeJobId && !dryRun) {
        await supabase
          .from('scrape_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: err.message,
          })
          .eq('id', scrapeJobId);
      }
    }
    
    // Rate limit between cities
    await sleep(DELAY_BETWEEN_CITIES_MS);
  }
  
  // Print summary
  console.log('');
  console.log('='.repeat(60));
  console.log('📊 BATCH SUMMARY');
  console.log('='.repeat(60));
  console.log(`Cities Processed:    ${results.citiesProcessed}`);
  console.log(`Cities with Events:  ${results.citiesWithEvents}`);
  console.log(`Total Fetched:       ${results.totalFetched}`);
  console.log(`Total Inserted:      ${results.totalInserted}`);
  
  if (Object.keys(results.byCategory).length > 0) {
    console.log('\nBy Category:');
    for (const [cat, count] of Object.entries(results.byCategory).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${cat}: ${count}`);
    }
  }
  
  // Calculate remaining cities
  const { count: remainingCount } = await supabase
    .from('target_cities')
    .select('*', { count: 'exact', head: true })
    .or(`last_coverage_check.is.null,last_coverage_check.lt.${new Date(Date.now() - 7*24*60*60*1000).toISOString()}`);
  
  console.log(`\nRemaining Cities:    ${remainingCount || 'unknown'}`);
  
  if (results.errors.length > 0) {
    console.log(`\nErrors (${results.errors.length}):`);
    for (const err of results.errors.slice(0, 10)) {
      console.log(`  ${err}`);
    }
  }
  
  console.log('='.repeat(60));
  
  // Get total events in DB
  const { count: totalEvents } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📈 Total Events in Database: ${totalEvents}`);
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

