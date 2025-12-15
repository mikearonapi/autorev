#!/usr/bin/env node

/**
 * Backfill Event Geocodes
 * 
 * Script to geocode existing events that are missing latitude/longitude.
 * Uses OpenStreetMap Nominatim with 1 request/second rate limiting.
 * 
 * Usage:
 *   node scripts/backfill-event-geocodes.js [options]
 * 
 * Options:
 *   --limit N       Max events to process (default: 100)
 *   --dry-run       Don't update database, just log what would happen
 *   --status S      Filter by status (default: approved)
 *   --verbose       Show detailed progress
 * 
 * Environment:
 *   Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { geocodeEvent, clearCache, getCacheStats } from '../lib/geocodingService.js';

// Parse command line args
const args = process.argv.slice(2);
const options = {
  limit: 100,
  dryRun: false,
  status: 'approved',
  verbose: false,
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--limit':
      options.limit = parseInt(args[++i], 10);
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--status':
      options.status = args[++i];
      break;
    case '--verbose':
      options.verbose = true;
      break;
    case '--help':
      console.log(`
Backfill Event Geocodes

Usage:
  node scripts/backfill-event-geocodes.js [options]

Options:
  --limit N       Max events to process (default: 100)
  --dry-run       Don't update database, just log what would happen
  --status S      Filter by status (default: approved)
  --verbose       Show detailed progress
  --help          Show this help message
`);
      process.exit(0);
  }
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('='.repeat(60));
  console.log('Event Geocode Backfill');
  console.log('='.repeat(60));
  console.log(`Options: ${JSON.stringify(options)}`);
  console.log('');
  
  // Fetch events without coordinates
  console.log('Fetching events without coordinates...');
  
  let query = supabase
    .from('events')
    .select('id, slug, name, venue_name, address, city, state, zip, country')
    .is('latitude', null)
    .order('start_date', { ascending: true });
  
  if (options.status) {
    query = query.eq('status', options.status);
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  const { data: events, error } = await query;
  
  if (error) {
    console.error('Error fetching events:', error);
    process.exit(1);
  }
  
  if (!events || events.length === 0) {
    console.log('No events found that need geocoding.');
    process.exit(0);
  }
  
  console.log(`Found ${events.length} event(s) to geocode`);
  console.log('');
  
  // Process events
  let geocoded = 0;
  let failed = 0;
  let skipped = 0;
  
  const startTime = Date.now();
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const progress = `[${i + 1}/${events.length}]`;
    
    // Skip events without city (can't geocode)
    if (!event.city) {
      if (options.verbose) {
        console.log(`${progress} SKIP (no city): ${event.name}`);
      }
      skipped++;
      continue;
    }
    
    if (options.verbose) {
      console.log(`${progress} Geocoding: ${event.name}`);
      console.log(`    Location: ${event.city}, ${event.state || 'N/A'}`);
    }
    
    // Geocode the event
    const coords = await geocodeEvent(event);
    
    if (coords) {
      if (options.verbose) {
        console.log(`    Result: ${coords.latitude}, ${coords.longitude}`);
      }
      
      // Update database
      if (!options.dryRun) {
        const { error: updateError } = await supabase
          .from('events')
          .update({
            latitude: coords.latitude,
            longitude: coords.longitude,
          })
          .eq('id', event.id);
        
        if (updateError) {
          console.error(`${progress} ERROR updating ${event.slug}:`, updateError.message);
          failed++;
        } else {
          geocoded++;
          if (!options.verbose) {
            process.stdout.write('.');
          }
        }
      } else {
        geocoded++;
        if (options.verbose) {
          console.log(`    [DRY RUN] Would update with coordinates`);
        } else {
          process.stdout.write('.');
        }
      }
    } else {
      if (options.verbose) {
        console.log(`    Result: FAILED to geocode`);
      }
      failed++;
    }
    
    // Progress bar every 10 events
    if (!options.verbose && (i + 1) % 10 === 0) {
      process.stdout.write(` ${i + 1}/${events.length}\n`);
    }
  }
  
  // Final newline if not verbose
  if (!options.verbose && events.length % 10 !== 0) {
    console.log();
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // Summary
  console.log('');
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total events processed: ${events.length}`);
  console.log(`Successfully geocoded:  ${geocoded}`);
  console.log(`Failed to geocode:      ${failed}`);
  console.log(`Skipped (no city):      ${skipped}`);
  console.log(`Duration:               ${duration}s`);
  console.log(`Dry run:                ${options.dryRun ? 'Yes' : 'No'}`);
  
  const cacheStats = getCacheStats();
  console.log(`Memory cache size:      ${cacheStats.memoryCacheSize}`);
  
  if (options.dryRun) {
    console.log('');
    console.log('Note: This was a dry run. No changes were made to the database.');
    console.log('Run without --dry-run to apply changes.');
  }
}

// Run
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

