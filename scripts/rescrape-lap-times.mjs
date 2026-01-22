#!/usr/bin/env node
/**
 * Re-scrape Lap Times - Track-Based Approach
 * 
 * Uses the corrected scraper that extracts car names from track pages,
 * ensuring accurate car-to-time mapping.
 * 
 * Usage:
 *   node scripts/rescrape-lap-times.mjs                    # Scrape popular tracks
 *   node scripts/rescrape-lap-times.mjs --dry-run          # Test without inserting
 *   node scripts/rescrape-lap-times.mjs --limit 10         # Limit tracks
 *   node scripts/rescrape-lap-times.mjs --tracks nurburgring-nordschleife,laguna-seca
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import lapTimesScraper from '../lib/lapTimesScraper.js';
import firecrawlClient from '../lib/firecrawlClient.js';

// Popular tracks to prioritize
const POPULAR_TRACKS = [
  'nurburgring-nordschleife',
  'laguna-seca',
  'road-atlanta',
  'road-america',
  'watkins-glen',
  'willow-springs',
  'virginia-international-raceway',
  'hockenheimring',
  'spa-francorchamps',
  'silverstone',
  'tsukuba',
  'fuji-speedway',
  'magny-cours',
  'monza',
  'brands-hatch',
  'sonoma-raceway',
  'sebring',
  'daytona',
  'circuit-of-the-americas',
  'mid-ohio',
  'barber-motorsports-park',
  'lime-rock',
  'thunderhill',
  'buttonwillow',
  'phillip-island',
  'suzuka',
  'sepang',
  'zandvoort',
  'portimao',
  'imola',
];

// Parse arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit'));
const limit = limitArg ? parseInt(limitArg.split('=')[1] || args[args.indexOf('--limit') + 1] || '30', 10) : 30;
const tracksArg = args.find(a => a.startsWith('--tracks='));
const specificTracks = tracksArg ? tracksArg.split('=')[1].split(',') : null;
const help = args.includes('--help') || args.includes('-h');

if (help) {
  console.log(`
Re-scrape Lap Times (Track-Based)

Uses the corrected scraper to extract lap times from FastestLaps track pages.
This approach ensures accurate car-to-time mapping.

Usage:
  node scripts/rescrape-lap-times.mjs [options]

Options:
  --dry-run           Don't write to database
  --limit <n>         Limit number of tracks (default: 30)
  --tracks <slugs>    Comma-separated track slugs to scrape
  --help              Show this help

Examples:
  node scripts/rescrape-lap-times.mjs --dry-run --limit 5
  node scripts/rescrape-lap-times.mjs --tracks nurburgring-nordschleife,laguna-seca
`);
  process.exit(0);
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     Re-scrape Lap Times (Track-Based - Corrected)              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  // Check configuration
  console.log('\n📋 Configuration:');
  console.log(`   FIRECRAWL_API_KEY: ${process.env.FIRECRAWL_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Dry Run: ${dryRun ? 'YES' : 'NO'}`);
  console.log(`   Limit: ${limit} tracks`);
  
  if (!firecrawlClient.isFirecrawlConfigured()) {
    console.error('\n❌ FIRECRAWL_API_KEY is required');
    process.exit(1);
  }
  
  // Determine tracks to scrape
  const tracksToProcess = specificTracks || POPULAR_TRACKS.slice(0, limit);
  console.log(`\n📍 Tracks to process: ${tracksToProcess.length}`);
  
  // Run the scraper
  console.log('\n🔄 Starting track-based scrape...\n');
  
  const result = await lapTimesScraper.discoverAndScrapeByTracks({
    trackSlugs: tracksToProcess,
    dryRun,
    limit,
  });
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('═'.repeat(60));
  
  if (result.success) {
    console.log(`   Tracks processed: ${result.stats.tracksProcessed}`);
    console.log(`   Lap times found: ${result.stats.lapTimesFound}`);
    console.log(`   Cars matched: ${result.stats.carsMatched}`);
    console.log(`   Lap times inserted: ${result.stats.lapTimesInserted}`);
    console.log(`   Lap times skipped: ${result.stats.lapTimesSkipped}`);
    console.log(`   Cars unmatched: ${result.stats.carsUnmatched?.length || 0}`);
    console.log(`   Errors: ${result.stats.errors?.length || 0}`);
    
    if (result.stats.carsUnmatched?.length > 0) {
      console.log('\n⚠️ Top unmatched cars (add to DB for better coverage):');
      const counts = {};
      for (const car of result.stats.carsUnmatched) {
        counts[car] = (counts[car] || 0) + 1;
      }
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 20);
      for (const [car, count] of sorted) {
        console.log(`   - ${car} (${count})`);
      }
    }
    
    if (result.stats.errors?.length > 0) {
      console.log('\n❌ Errors:');
      for (const err of result.stats.errors.slice(0, 10)) {
        console.log(`   - ${err.track}: ${err.error}`);
      }
    }
  } else {
    console.log(`   ❌ Scrape failed: ${result.error}`);
  }
  
  console.log('\n' + '═'.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
