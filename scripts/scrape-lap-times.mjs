#!/usr/bin/env node
/**
 * Lap Times Scraper Script
 * 
 * Scrapes lap times from FastestLaps.com and imports to database.
 * 
 * Usage:
 *   node scripts/scrape-lap-times.mjs --car "Porsche 911 GT3"
 *   node scripts/scrape-lap-times.mjs --track nurburgring-nordschleife
 *   node scripts/scrape-lap-times.mjs --discover --limit 10
 *   node scripts/scrape-lap-times.mjs --test-url "https://fastestlaps.com/tests/xyz"
 *   node scripts/scrape-lap-times.mjs --dry-run --discover
 * 
 * Environment:
 *   FIRECRAWL_API_KEY - Required
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY - Required for DB writes
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import lapTimesScraper from '../lib/lapTimesScraper.js';
import firecrawlClient from '../lib/firecrawlClient.js';

// Parse arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return null;
  if (args[idx + 1]?.startsWith('--')) return true;
  return args[idx + 1] || true;
};

const carName = getArg('car');
const trackSlug = getArg('track');
const testUrl = getArg('test-url');
const discover = args.includes('--discover');
const dryRun = args.includes('--dry-run');
const limit = parseInt(getArg('limit') || '10', 10);
const help = args.includes('--help') || args.includes('-h');

if (help) {
  console.log(`
Lap Times Scraper - Import lap times from FastestLaps.com

Usage:
  node scripts/scrape-lap-times.mjs [options]

Options:
  --car <name>       Scrape lap times for a specific car
  --track <slug>     Scrape all lap times for a track
  --test-url <url>   Scrape a specific FastestLaps test page
  --discover         Auto-discover and scrape for cars in database
  --limit <n>        Limit number of cars to process (default: 10)
  --dry-run          Don't write to database, just show what would happen
  --help             Show this help message

Examples:
  node scripts/scrape-lap-times.mjs --car "Porsche 911 GT3"
  node scripts/scrape-lap-times.mjs --track laguna-seca
  node scripts/scrape-lap-times.mjs --discover --limit 5 --dry-run
`);
  process.exit(0);
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              Lap Times Scraper                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  // Check configuration
  console.log('\n📋 Configuration:');
  console.log(`   FIRECRAWL_API_KEY: ${process.env.FIRECRAWL_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Dry Run: ${dryRun ? 'YES' : 'NO'}`);
  
  if (!firecrawlClient.isFirecrawlConfigured()) {
    console.error('\n❌ FIRECRAWL_API_KEY is required');
    process.exit(1);
  }

  try {
    // Mode 1: Scrape specific test URL
    if (testUrl) {
      console.log(`\n🔍 Scraping test URL: ${testUrl}`);
      const result = await lapTimesScraper.scrapeFastestLapsTestPage(testUrl);
      console.log('\nResult:', JSON.stringify(result, null, 2));
      return;
    }

    // Mode 2: Scrape specific car
    if (carName) {
      console.log(`\n🚗 Scraping lap times for: ${carName}`);
      
      // Search FastestLaps
      const searchUrl = `https://fastestlaps.com/search?query=${encodeURIComponent(carName)}`;
      console.log(`   Searching: ${searchUrl}`);
      
      const searchResult = await firecrawlClient.scrapeUrl(searchUrl, {
        formats: ['markdown', 'links'],
        onlyMainContent: true,
      });
      
      if (!searchResult.success) {
        console.error('   ❌ Search failed:', searchResult.error);
        return;
      }
      
      // Find model links
      const modelLinks = (searchResult.links || [])
        .filter(link => link.includes('/models/'))
        .map(link => {
          // Extract just the path if it's a full URL
          if (link.startsWith('http')) {
            try {
              const url = new URL(link);
              return url.pathname;
            } catch { return link; }
          }
          return link;
        });
      
      console.log(`   Found ${modelLinks.length} model pages`);
      
      if (modelLinks.length === 0) {
        console.log('   Checking markdown for car info...');
        console.log(searchResult.markdown?.substring(0, 1000));
        return;
      }
      
      // Scrape first match - extract slug from path like /models/porsche-911-gt3-992
      const modelPath = modelLinks[0];
      const modelSlug = modelPath.replace(/^\/models\//, '').split('/')[0];
      console.log(`   Scraping model page: ${modelSlug}`);
      
      const carResult = await lapTimesScraper.scrapeFastestLapsCarPage(modelSlug);
      
      if (carResult.success) {
        console.log(`\n✅ Found ${carResult.lapTimeCount} lap times:`);
        for (const lt of carResult.lapTimes.slice(0, 20)) {
          const trackDisplay = lt.track_name || 'Unknown track';
          const tiresDisplay = lt.tires ? ` [${lt.tires}]` : '';
          console.log(`   ${trackDisplay}: ${lt.lap_time_text} ${lt.is_stock ? '(stock)' : '(modified)'}${tiresDisplay}`);
        }
        if (carResult.lapTimes.length > 20) {
          console.log(`   ... and ${carResult.lapTimes.length - 20} more`);
        }
        
        // Show raw data for debugging if verbose
        if (process.env.DEBUG && carResult.lapTimes.length > 0) {
          console.log('\n   📝 Sample raw data:');
          console.log(JSON.stringify(carResult.lapTimes[0], null, 2));
        }
      } else {
        console.error('   ❌ Failed:', carResult.error);
      }
      return;
    }

    // Mode 3: Scrape specific track
    if (trackSlug) {
      console.log(`\n🏁 Scraping lap times for track: ${trackSlug}`);
      
      const result = await lapTimesScraper.importLapTimesForTrack(trackSlug, { dryRun });
      
      if (result.success) {
        console.log(`\n✅ Results for ${result.stats.track}:`);
        console.log(`   Lap times found: ${result.stats.lapTimesFound}`);
        console.log(`   Cars matched: ${result.stats.matched}`);
        console.log(`   Inserted: ${result.stats.inserted}`);
        console.log(`   Skipped (duplicates): ${result.stats.skipped}`);
        
        if (result.stats.unmatched.length > 0) {
          console.log(`\n   ⚠️ Unmatched cars (${result.stats.unmatched.length}):`);
          for (const car of result.stats.unmatched.slice(0, 10)) {
            console.log(`      - ${car}`);
          }
        }
      } else {
        console.error('   ❌ Failed:', result.error);
      }
      return;
    }

    // Mode 4: Discover and scrape
    if (discover) {
      console.log(`\n🔄 Auto-discovering lap times for ${limit} cars...`);
      
      const result = await lapTimesScraper.discoverAndScrapeFastestLaps({
        limit,
        dryRun,
      });
      
      console.log('\n📊 Results:');
      console.log(`   Cars processed: ${result.carsProcessed}`);
      console.log(`   Lap times found: ${result.lapTimesFound}`);
      console.log(`   Lap times inserted: ${result.lapTimesInserted}`);
      console.log(`   Skipped (duplicates): ${result.lapTimesSkipped}`);
      console.log(`   Tracks created: ${result.tracksCreated}`);
      console.log(`   Errors: ${result.errors.length}`);
      
      if (result.errors.length > 0) {
        console.log('\n   Errors:');
        for (const err of result.errors.slice(0, 5)) {
          console.log(`      - ${err.car}: ${err.error}`);
        }
      }
      return;
    }

    // No mode specified - show quick stats and help
    console.log('\n📊 Current database stats:');
    
    const carLookup = await lapTimesScraper.getCarLookup();
    const trackLookup = await lapTimesScraper.getTrackLookup();
    
    console.log(`   Cars in database: ${carLookup.size}`);
    console.log(`   Tracks in database: ${trackLookup.size}`);
    
    console.log('\n💡 Run with --help for usage options');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (process.env.DEBUG) console.error(err.stack);
    process.exit(1);
  }
}

main();
