#!/usr/bin/env node
/**
 * Prioritized Lap Time Enrichment Script
 * 
 * Systematically scrapes lap time data from FastestLaps.com
 * using a tiered priority system to maximize coverage for
 * tracks that users care about most.
 * 
 * Priority Tiers:
 * 1. Popular US tracks with < 10 lap times
 * 2. Other US tracks with < 10 lap times (by state/region)
 * 3. International tracks (Nürburgring, Spa, etc.)
 * 
 * Usage:
 *   node scripts/enrich-lap-times-prioritized.mjs --tier=1 --limit=10
 *   node scripts/enrich-lap-times-prioritized.mjs --tier=2 --state=CA
 *   node scripts/enrich-lap-times-prioritized.mjs --dry-run
 * 
 * @module scripts/enrich-lap-times-prioritized
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import lapTimesScraper from '../lib/lapTimesScraper.js';
import { isFirecrawlConfigured } from '../lib/firecrawlClient.js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =============================================================================
// FASTESTLAPS TRACK SLUG MAPPING
// Maps our track slugs to FastestLaps slugs for scraping
// =============================================================================

const TRACK_SLUG_TO_FASTESTLAPS = {
  // Popular US Tracks
  'laguna-seca': 'laguna-seca',
  'road-atlanta': 'road-atlanta',
  'road-america': 'road-america',
  'watkins-glen': 'watkins-glen',
  'cota-full': 'circuit-of-the-americas',
  'sebring-full': 'sebring-international-raceway',
  'mid-ohio-full': 'mid-ohio-sports-car-course',
  'barber': 'barber-motorsports-park',
  'sonoma-full': 'sonoma-raceway',
  'willow-springs-big': 'willow-springs',
  'buttonwillow-13cw': 'buttonwillow-configuration-13',
  'thunderhill-west': 'thunderhill-raceway',
  'vir-full': 'virginia-international-raceway',
  'vir-grand-east': 'virginia-international-raceway-grand-east-course-post-01-2014',
  'vir-north': 'virginia-international-raceway-north',
  'ncm-motorsports-park': 'ncm-motorsports-park',
  'lime-rock': 'lime-rock-park',
  'summit-point-main': 'summit-point-raceway',
  'pit-motorsports-park': 'pittsburgh-international-race-complex',
  'gingerman': 'gingerman-raceway',
  'grattan-raceway': 'grattan-raceway',
  'autobahn-full': 'autobahn-country-club-full-course',
  'heartland-motorsports-park': 'heartland-motorsports-park',
  'motorsports-ranch-cresson': 'motorsport-ranch-cresson',
  'hallett-motor-racing-circuit': 'hallett-motor-racing-circuit',
  'utah-motorsports-campus': 'utah-motorsports-campus',
  'portland-international': 'portland-international-raceway',
  'pacific-raceways': 'pacific-raceways',
  'the-ridge': 'ridge-motorsports-park',
  'buttonwillow-25-cw': 'buttonwillow-raceway-park',
  
  // International Tracks
  'nurburgring-nordschleife': 'nordschleife',
  'nurburgring-gp': 'nurburgring-gp',
  'spa-francorchamps': 'spa-francorchamps',
  'silverstone': 'silverstone',
  'brands-hatch': 'brands-hatch',
  'suzuka': 'suzuka',
  'tsukuba': 'tsukuba',
  'hockenheim-gp': 'hockenheim-gp',
  'monza': 'monza',
  'imola': 'imola',
};

// =============================================================================
// PRIORITY DEFINITIONS
// =============================================================================

/**
 * Tier 1: Popular tracks that MUST have good data
 * These are the most commonly visited by users
 */
const TIER_1_TRACKS = [
  'laguna-seca',
  'road-atlanta',
  'road-america',
  'watkins-glen',
  'cota-full',
  'sebring-full',
  'mid-ohio-full',
  'barber',
  'sonoma-full',
  'willow-springs-big',
  'buttonwillow-13cw',
  'vir-full',
  'vir-grand-east',
  'thunderhill-west',
  'ncm-motorsports-park',
  'lime-rock',
];

/**
 * Tier 2: Regional US tracks by state
 */
const TIER_2_BY_STATE = {
  'CA': ['buttonwillow-25-cw', 'thunderhill-east', 'auto-club-speedway', 'chuckwalla-valley'],
  'TX': ['cota-short', 'motorsports-ranch-cresson', 'harris-hill', 'circuit-of-the-americas'],
  'FL': ['sebring-short', 'homestead-miami', 'daytona-roval', 'palm-beach-intl'],
  'GA': ['atlanta-motorsports-park', 'roebling-road'],
  'VA': ['vir-north', 'vir-south', 'vir-patriot', 'summit-point-main'],
  'NC': ['carolina-motorsports-park', 'charlotte-roval'],
  'OH': ['mid-ohio-short', 'nelson-ledges', 'pittsburgh-intl'],
  'MI': ['gingerman', 'grattan-raceway', 'waterford-hills'],
  'WI': ['road-america', 'blackhawk-farms'],
  'IL': ['autobahn-full', 'autobahn-south'],
  'PA': ['pit-motorsports-park', 'pocono'],
  'NJ': ['njmp-thunderbolt', 'njmp-lightning'],
  'NY': ['watkins-glen-short', 'lime-rock', 'monticello'],
};

/**
 * Tier 3: International tracks
 */
const TIER_3_TRACKS = [
  'nurburgring-nordschleife',
  'nurburgring-gp',
  'spa-francorchamps',
  'silverstone',
  'brands-hatch',
  'suzuka',
  'tsukuba',
  'hockenheim-gp',
  'monza',
  'imola',
];

// =============================================================================
// HELPERS
// =============================================================================

async function getTrackLapTimeCount(trackSlug) {
  const { data: track } = await supabase
    .from('tracks')
    .select('id')
    .eq('slug', trackSlug)
    .single();
  
  if (!track) return { exists: false, count: 0 };
  
  const { count } = await supabase
    .from('car_track_lap_times')
    .select('*', { count: 'exact', head: true })
    .eq('track_id', track.id);
  
  return { exists: true, count: count || 0 };
}

async function getTracksNeedingData(trackSlugs, threshold = 10) {
  const needsData = [];
  
  for (const slug of trackSlugs) {
    const { exists, count } = await getTrackLapTimeCount(slug);
    if (count < threshold) {
      needsData.push({ slug, exists, count, needed: threshold - count });
    }
  }
  
  // Sort by count ascending (most needed first)
  return needsData.sort((a, b) => a.count - b.count);
}

async function scrapeTrack(ourSlug, dryRun = false) {
  const fastestLapsSlug = TRACK_SLUG_TO_FASTESTLAPS[ourSlug];
  
  if (!fastestLapsSlug) {
    console.log(`  ⚠️ No FastestLaps mapping for: ${ourSlug}`);
    return { skipped: true, reason: 'no_mapping' };
  }
  
  console.log(`  Scraping: ${fastestLapsSlug} -> ${ourSlug}`);
  
  try {
    const result = await lapTimesScraper.importLapTimesForTrack(fastestLapsSlug, { dryRun });
    
    if (result.success) {
      console.log(`    Found: ${result.stats.lapTimesFound}, Matched: ${result.stats.matched}, Inserted: ${result.stats.inserted}`);
      return result;
    } else {
      console.log(`    Error: ${result.error}`);
      return result;
    }
  } catch (err) {
    console.log(`    Error: ${err.message}`);
    return { error: err.message };
  }
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

async function enrichTier1(options = {}) {
  const { limit = 20, dryRun = false, threshold = 10 } = options;
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║              TIER 1: POPULAR TRACKS                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const tracksNeedingData = await getTracksNeedingData(TIER_1_TRACKS, threshold);
  
  console.log(`Found ${tracksNeedingData.length} tracks needing data (< ${threshold} lap times)\n`);
  
  const toProcess = tracksNeedingData.slice(0, limit);
  const stats = { processed: 0, inserted: 0, errors: [] };
  
  for (const track of toProcess) {
    console.log(`\n[${track.slug}] Current: ${track.count} lap times`);
    
    const result = await scrapeTrack(track.slug, dryRun);
    stats.processed++;
    
    if (result.success) {
      stats.inserted += result.stats?.inserted || 0;
    } else if (result.error) {
      stats.errors.push({ slug: track.slug, error: result.error });
    }
    
    // Rate limit
    if (!dryRun) {
      await new Promise(r => setTimeout(r, 2500));
    }
  }
  
  return stats;
}

async function enrichTier2(options = {}) {
  const { state, limit = 20, dryRun = false, threshold = 10 } = options;
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log(`║              TIER 2: REGIONAL TRACKS${state ? ` (${state})` : ''}                        ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  let trackSlugs;
  if (state && TIER_2_BY_STATE[state]) {
    trackSlugs = TIER_2_BY_STATE[state];
  } else {
    // All states
    trackSlugs = Object.values(TIER_2_BY_STATE).flat();
  }
  
  const tracksNeedingData = await getTracksNeedingData(trackSlugs, threshold);
  
  console.log(`Found ${tracksNeedingData.length} tracks needing data\n`);
  
  const toProcess = tracksNeedingData.slice(0, limit);
  const stats = { processed: 0, inserted: 0, errors: [] };
  
  for (const track of toProcess) {
    console.log(`\n[${track.slug}] Current: ${track.count} lap times`);
    
    const result = await scrapeTrack(track.slug, dryRun);
    stats.processed++;
    
    if (result.success) {
      stats.inserted += result.stats?.inserted || 0;
    } else if (result.error) {
      stats.errors.push({ slug: track.slug, error: result.error });
    }
    
    if (!dryRun) {
      await new Promise(r => setTimeout(r, 2500));
    }
  }
  
  return stats;
}

async function enrichTier3(options = {}) {
  const { limit = 10, dryRun = false, threshold = 10 } = options;
  
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║              TIER 3: INTERNATIONAL TRACKS                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  const tracksNeedingData = await getTracksNeedingData(TIER_3_TRACKS, threshold);
  
  console.log(`Found ${tracksNeedingData.length} tracks needing data\n`);
  
  const toProcess = tracksNeedingData.slice(0, limit);
  const stats = { processed: 0, inserted: 0, errors: [] };
  
  for (const track of toProcess) {
    console.log(`\n[${track.slug}] Current: ${track.count} lap times`);
    
    const result = await scrapeTrack(track.slug, dryRun);
    stats.processed++;
    
    if (result.success) {
      stats.inserted += result.stats?.inserted || 0;
    } else if (result.error) {
      stats.errors.push({ slug: track.slug, error: result.error });
    }
    
    if (!dryRun) {
      await new Promise(r => setTimeout(r, 2500));
    }
  }
  
  return stats;
}

async function showStatus() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║              LAP TIME DATA STATUS                              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  // Tier 1 status
  console.log('TIER 1 - POPULAR TRACKS:');
  console.log('-'.repeat(55));
  console.log('Track'.padEnd(30) + 'Times'.padStart(8) + '  Status');
  
  for (const slug of TIER_1_TRACKS) {
    const { exists, count } = await getTrackLapTimeCount(slug);
    const status = !exists ? '❓ Not Found' : 
                   count >= 10 ? '✅ Tier 1' : 
                   count >= 3 ? '⚠️ Tier 2' : 
                   count >= 1 ? '🔶 Tier 3' : '❌ No Data';
    console.log(`${slug.padEnd(30)}${String(count).padStart(8)}  ${status}`);
  }
  
  // Summary
  const tier1Needs = await getTracksNeedingData(TIER_1_TRACKS, 10);
  const tier3Needs = await getTracksNeedingData(TIER_3_TRACKS, 10);
  
  console.log('\nSUMMARY:');
  console.log(`  Tier 1 tracks needing data: ${tier1Needs.length}/${TIER_1_TRACKS.length}`);
  console.log(`  Tier 3 tracks needing data: ${tier3Needs.length}/${TIER_3_TRACKS.length}`);
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : null;
  };
  const hasFlag = (name) => args.includes(`--${name}`);
  
  // Check Firecrawl configuration
  if (!isFirecrawlConfigured() && !hasFlag('status')) {
    console.error('ERROR: FIRECRAWL_API_KEY not configured');
    console.log('Set FIRECRAWL_API_KEY in .env.local to enable scraping');
    process.exit(1);
  }
  
  const tier = getArg('tier') || '1';
  const limit = parseInt(getArg('limit') || '10', 10);
  const state = getArg('state');
  const dryRun = hasFlag('dry-run');
  const threshold = parseInt(getArg('threshold') || '10', 10);
  
  if (hasFlag('status')) {
    await showStatus();
    return;
  }
  
  if (hasFlag('help')) {
    console.log(`
Lap Time Enrichment Script

Usage:
  node scripts/enrich-lap-times-prioritized.mjs [options]

Options:
  --tier=1|2|3    Priority tier to process (default: 1)
  --limit=N       Max tracks to process (default: 10)
  --state=XX      For tier 2, limit to specific state (e.g., CA, TX)
  --threshold=N   Lap time threshold for "needs data" (default: 10)
  --dry-run       Don't actually insert data, just show what would happen
  --status        Show current data status for all priority tracks
  --help          Show this help

Examples:
  node scripts/enrich-lap-times-prioritized.mjs --status
  node scripts/enrich-lap-times-prioritized.mjs --tier=1 --limit=5
  node scripts/enrich-lap-times-prioritized.mjs --tier=2 --state=CA
  node scripts/enrich-lap-times-prioritized.mjs --tier=3 --dry-run
`);
    return;
  }
  
  console.log('='.repeat(60));
  console.log('LAP TIME ENRICHMENT');
  console.log(`Tier: ${tier} | Limit: ${limit} | Dry Run: ${dryRun}`);
  console.log('='.repeat(60));
  
  let stats;
  
  switch (tier) {
    case '1':
      stats = await enrichTier1({ limit, dryRun, threshold });
      break;
    case '2':
      stats = await enrichTier2({ state, limit, dryRun, threshold });
      break;
    case '3':
      stats = await enrichTier3({ limit, dryRun, threshold });
      break;
    default:
      console.error(`Unknown tier: ${tier}`);
      process.exit(1);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('ENRICHMENT COMPLETE');
  console.log(`Processed: ${stats.processed} tracks`);
  console.log(`Inserted: ${stats.inserted} lap times`);
  if (stats.errors.length > 0) {
    console.log(`Errors: ${stats.errors.length}`);
    stats.errors.forEach(e => console.log(`  - ${e.slug}: ${e.error}`));
  }
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
