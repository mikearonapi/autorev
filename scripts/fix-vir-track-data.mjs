#!/usr/bin/env node
/**
 * Fix VIR Track Data Script
 * 
 * This script:
 * 1. Creates missing VIR track configurations (Grand East, Grand West, Patriot)
 * 2. Analyzes lap times on vir-full that are too slow
 * 3. Reassigns them to the correct Grand course configuration based on source URLs
 * 
 * Usage:
 *   node scripts/fix-vir-track-data.mjs           # Dry run (show what would change)
 *   node scripts/fix-vir-track-data.mjs --commit  # Actually make the changes
 * 
 * @module scripts/fix-vir-track-data
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../.env.local') });

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// VIR track configurations to create
const VIR_NEW_TRACKS = [
  {
    slug: 'vir-grand-east',
    name: 'Virginia International Raceway - Grand East',
    short_name: 'VIR Grand East',
    city: 'Alton',
    state: 'VA',
    country: 'USA',
    region: 'Southeast',
    length_miles: 4.2,
    corners: 24,
    elevation_change_ft: 200,
    longest_straight_ft: 3000,
    track_type: 'road_course',
    configuration: 'grand-east',
    pro_reference_time: 158,
    power_gain_max: 6.0,
    grip_gain_max: 5.5,
    susp_gain_max: 4.5,
    brake_gain_max: 4.0,
    aero_gain_max: 3.5,
    weight_gain_max: 3.0,
    beginner_penalty: 42,
    intermediate_penalty: 17,
    advanced_penalty: 5,
    character_tags: ['technical', 'elevation', 'challenging', 'long'],
    icon: '🌲',
    is_popular: false,
    popularity_rank: 45,
    data_source: 'manual',
  },
  {
    slug: 'vir-grand-west',
    name: 'Virginia International Raceway - Grand West',
    short_name: 'VIR Grand West',
    city: 'Alton',
    state: 'VA',
    country: 'USA',
    region: 'Southeast',
    length_miles: 3.97,
    corners: 22,
    elevation_change_ft: 180,
    longest_straight_ft: 2800,
    track_type: 'road_course',
    configuration: 'grand-west',
    pro_reference_time: 150,
    power_gain_max: 5.8,
    grip_gain_max: 5.3,
    susp_gain_max: 4.3,
    brake_gain_max: 3.8,
    aero_gain_max: 3.3,
    weight_gain_max: 2.8,
    beginner_penalty: 40,
    intermediate_penalty: 16,
    advanced_penalty: 5,
    character_tags: ['technical', 'elevation', 'challenging'],
    icon: '🌲',
    is_popular: false,
    popularity_rank: 55,
    data_source: 'manual',
  },
  {
    slug: 'vir-patriot',
    name: 'Virginia International Raceway - Patriot',
    short_name: 'VIR Patriot',
    city: 'Alton',
    state: 'VA',
    country: 'USA',
    region: 'Southeast',
    length_miles: 1.1,
    corners: 6,
    elevation_change_ft: 50,
    longest_straight_ft: 1200,
    track_type: 'road_course',
    configuration: 'patriot',
    pro_reference_time: 48,
    power_gain_max: 3.0,
    grip_gain_max: 3.5,
    susp_gain_max: 2.5,
    brake_gain_max: 2.0,
    aero_gain_max: 1.5,
    weight_gain_max: 1.0,
    beginner_penalty: 15,
    intermediate_penalty: 6,
    advanced_penalty: 2,
    character_tags: ['short', 'club', 'beginner-friendly'],
    icon: '🌲',
    is_popular: false,
    popularity_rank: 80,
    data_source: 'manual',
  },
];

// Threshold for VIR Full - times above this are likely from Grand course
const VIR_FULL_MAX_REASONABLE_TIME = 150000; // 2:30.000 in ms

// URL patterns that indicate Grand course
const GRAND_COURSE_URL_PATTERNS = [
  /grand.*east/i,
  /grand.*west/i,
  /east.*course/i,
  /west.*course/i,
];

// ============================================================================
// FUNCTIONS
// ============================================================================

function formatLapTime(ms) {
  if (!ms || isNaN(ms)) return '--:--.---';
  const seconds = ms / 1000;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${mins}:${secs}`;
}

/**
 * Create the missing VIR track configurations
 */
async function createMissingTracks(commit = false) {
  console.log('\n=== Step 1: Create Missing VIR Track Configurations ===\n');

  for (const track of VIR_NEW_TRACKS) {
    // Check if track already exists
    const { data: existing } = await supabase
      .from('tracks')
      .select('id, slug')
      .eq('slug', track.slug)
      .single();

    if (existing) {
      console.log(`✓ Track ${track.slug} already exists (id: ${existing.id})`);
      continue;
    }

    if (!commit) {
      console.log(`[DRY-RUN] Would create track: ${track.name} (${track.slug})`);
      console.log(`  Length: ${track.length_miles} miles, ${track.corners} corners`);
      console.log(`  Pro time: ${formatLapTime(track.pro_reference_time * 1000)}`);
    } else {
      const { data, error } = await supabase
        .from('tracks')
        .insert(track)
        .select()
        .single();

      if (error) {
        console.error(`✗ Failed to create ${track.slug}:`, error.message);
      } else {
        console.log(`✓ Created track: ${track.name} (id: ${data.id})`);
      }
    }
  }
}

/**
 * Analyze and fix misaligned lap times on vir-full
 */
async function fixMisalignedLapTimes(commit = false) {
  console.log('\n=== Step 2: Fix Misaligned Lap Times on VIR Full ===\n');

  // Get vir-full track ID
  const { data: virFull } = await supabase
    .from('tracks')
    .select('id')
    .eq('slug', 'vir-full')
    .single();

  if (!virFull) {
    console.error('Could not find vir-full track');
    return;
  }

  // Get vir-grand-east track ID (for reassignment)
  const { data: virGrandEast } = await supabase
    .from('tracks')
    .select('id')
    .eq('slug', 'vir-grand-east')
    .single();

  // Get lap times that are too slow for vir-full
  const { data: slowTimes, error } = await supabase
    .from('car_track_lap_times')
    .select(`
      id,
      lap_time_ms,
      lap_time_text,
      source_url,
      car_id
    `)
    .eq('track_id', virFull.id)
    .gt('lap_time_ms', VIR_FULL_MAX_REASONABLE_TIME)
    .order('lap_time_ms', { ascending: true });

  if (error) {
    console.error('Error fetching lap times:', error.message);
    return;
  }

  if (!slowTimes || slowTimes.length === 0) {
    console.log('No misaligned lap times found on vir-full');
    return;
  }

  console.log(`Found ${slowTimes.length} lap times on vir-full that are above ${formatLapTime(VIR_FULL_MAX_REASONABLE_TIME)}\n`);

  // Get car info for display
  const carIds = [...new Set(slowTimes.filter(t => t.car_id).map(t => t.car_id))];
  let carsMap = new Map();
  if (carIds.length > 0) {
    const { data: cars } = await supabase
      .from('cars')
      .select('id, name')
      .in('id', carIds);
    carsMap = new Map((cars || []).map(c => [c.id, c]));
  }

  // Analyze each lap time
  const toReassign = [];
  const toReview = [];

  for (const lt of slowTimes) {
    const car = carsMap.get(lt.car_id);
    const carName = car?.name || 'Unknown Car';
    const url = lt.source_url || '';

    // Check if URL indicates Grand course
    const isGrandCourse = GRAND_COURSE_URL_PATTERNS.some(p => p.test(url));

    // Heuristic: Times between 2:30 and 3:30 are likely Grand East (4.2mi)
    // Times above 3:30 might need manual review
    const lapSeconds = lt.lap_time_ms / 1000;
    const likelyGrandEast = lapSeconds >= 150 && lapSeconds <= 210;

    if (isGrandCourse || likelyGrandEast) {
      toReassign.push({
        ...lt,
        carName,
        targetTrack: 'vir-grand-east',
        reason: isGrandCourse ? 'URL indicates Grand course' : 'Time consistent with 4.2mi Grand East',
      });
    } else {
      toReview.push({
        ...lt,
        carName,
        reason: 'Time too slow but pattern unclear - needs manual review',
      });
    }
  }

  // Print reassignment plan
  if (toReassign.length > 0) {
    console.log(`\nWill reassign ${toReassign.length} lap times to vir-grand-east:\n`);
    for (const lt of toReassign) {
      console.log(`  ${formatLapTime(lt.lap_time_ms)} | ${lt.carName}`);
      console.log(`    Reason: ${lt.reason}`);
      if (lt.source_url) console.log(`    URL: ${lt.source_url}`);
    }

    if (!commit) {
      console.log('\n[DRY-RUN] No changes made. Run with --commit to apply.\n');
    } else if (!virGrandEast) {
      console.log('\n✗ Cannot reassign - vir-grand-east track not found in database');
      console.log('  Please run this script with --commit first to create tracks\n');
    } else {
      // Actually reassign
      console.log(`\nReassigning to track_id: ${virGrandEast.id}...`);
      
      const ids = toReassign.map(lt => lt.id);
      const { error: updateError } = await supabase
        .from('car_track_lap_times')
        .update({ track_id: virGrandEast.id })
        .in('id', ids);

      if (updateError) {
        console.error('✗ Error updating lap times:', updateError.message);
      } else {
        console.log(`✓ Successfully reassigned ${toReassign.length} lap times to vir-grand-east`);
      }
    }
  }

  // Print items needing review
  if (toReview.length > 0) {
    console.log(`\n⚠️  ${toReview.length} lap times need manual review:\n`);
    for (const lt of toReview) {
      console.log(`  ${formatLapTime(lt.lap_time_ms)} | ${lt.carName}`);
      console.log(`    Reason: ${lt.reason}`);
      if (lt.source_url) console.log(`    URL: ${lt.source_url}`);
    }
  }
}

/**
 * Verify the fix by showing updated statistics
 */
async function verifyFix() {
  console.log('\n=== Step 3: Verify Fix ===\n');

  const virTracks = ['vir-full', 'vir-grand-east', 'vir-grand-west', 'vir-patriot'];

  for (const slug of virTracks) {
    const { data: track } = await supabase
      .from('tracks')
      .select('id, name, length_miles')
      .eq('slug', slug)
      .single();

    if (!track) {
      console.log(`${slug}: Not found`);
      continue;
    }

    const { data: lapTimes } = await supabase
      .from('car_track_lap_times')
      .select('lap_time_ms')
      .eq('track_id', track.id)
      .order('lap_time_ms', { ascending: true });

    if (!lapTimes || lapTimes.length === 0) {
      console.log(`${slug}: 0 lap times`);
      continue;
    }

    const times = lapTimes.map(lt => lt.lap_time_ms);
    const fastest = formatLapTime(times[0]);
    const median = formatLapTime(times[Math.floor(times.length / 2)]);
    const slowest = formatLapTime(times[times.length - 1]);

    console.log(`${track.name}:`);
    console.log(`  Length: ${track.length_miles} mi | Count: ${times.length}`);
    console.log(`  Fastest: ${fastest} | Median: ${median} | Slowest: ${slowest}`);
    console.log();
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes('--commit');

  console.log('VIR Track Data Fix Script');
  console.log('=========================');
  console.log(`Mode: ${commit ? 'COMMIT (making changes)' : 'DRY-RUN (preview only)'}\n`);

  // Step 1: Create missing tracks
  await createMissingTracks(commit);

  // Step 2: Fix misaligned lap times
  await fixMisalignedLapTimes(commit);

  // Step 3: Show verification
  if (commit) {
    await verifyFix();
  }

  console.log('\nDone!');
  if (!commit) {
    console.log('\nTo apply changes, run: node scripts/fix-vir-track-data.mjs --commit');
  }
}

main().catch(console.error);
