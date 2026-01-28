#!/usr/bin/env node
/**
 * Update VIR Reference Times Script
 * 
 * Updates pro_reference_time for VIR tracks based on actual lap time data.
 * Uses P5 (5th percentile) from real data as the pro reference.
 * 
 * Usage:
 *   node scripts/update-vir-reference-times.mjs           # Show analysis
 *   node scripts/update-vir-reference-times.mjs --commit  # Apply updates
 * 
 * @module scripts/update-vir-reference-times
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatLapTime(seconds) {
  if (!seconds || isNaN(seconds)) return '--:--.---';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${mins}:${secs}`;
}

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  if (sortedArr.length === 1) return sortedArr[0];
  const index = p * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;
  return sortedArr[lower] + fraction * (sortedArr[upper] - sortedArr[lower]);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes('--commit');

  console.log('VIR Reference Time Validation');
  console.log('=============================');
  console.log(`Mode: ${commit ? 'COMMIT' : 'DRY-RUN'}\n`);

  // VIR tracks to analyze
  const virSlugs = ['vir-full', 'vir-north', 'vir-south', 'vir-grand-east', 'vir-grand-west', 'vir-patriot'];

  const updates = [];

  for (const slug of virSlugs) {
    // Get track info
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('id, slug, name, length_miles, pro_reference_time')
      .eq('slug', slug)
      .single();

    if (trackError || !track) {
      console.log(`${slug}: Not found`);
      continue;
    }

    // Get lap times
    const { data: lapTimes } = await supabase
      .from('car_track_lap_times')
      .select('lap_time_ms')
      .eq('track_id', track.id)
      .order('lap_time_ms', { ascending: true });

    console.log(`\n${track.name} (${slug})`);
    console.log(`  Length: ${track.length_miles} miles`);
    console.log(`  Current pro_reference_time: ${track.pro_reference_time ? formatLapTime(track.pro_reference_time) : 'N/A'}`);

    if (!lapTimes || lapTimes.length === 0) {
      console.log(`  Lap times: 0 (no data to calibrate)`);
      
      // For tracks without data, estimate based on track length
      // Using ~38 sec/mile as baseline for typical sports car
      const estimatedPro = Math.round(track.length_miles * 38);
      console.log(`  Estimated pro time (38 sec/mile): ${formatLapTime(estimatedPro)}`);
      
      if (track.pro_reference_time !== estimatedPro) {
        updates.push({
          id: track.id,
          slug: track.slug,
          currentTime: track.pro_reference_time,
          newTime: estimatedPro,
          source: 'estimated',
        });
      }
      continue;
    }

    const times = lapTimes.map(lt => lt.lap_time_ms / 1000).sort((a, b) => a - b);
    const p5 = percentile(times, 0.05);
    const p10 = percentile(times, 0.10);
    const fastest = times[0];

    console.log(`  Lap times: ${times.length}`);
    console.log(`  Fastest: ${formatLapTime(fastest)}`);
    console.log(`  P5:  ${formatLapTime(p5)}`);
    console.log(`  P10: ${formatLapTime(p10)}`);

    // Use P5 as pro reference, rounded to nearest second
    const recommendedPro = Math.round(p5);
    console.log(`  Recommended pro_reference_time: ${formatLapTime(recommendedPro)}`);

    if (track.pro_reference_time !== recommendedPro) {
      const diff = recommendedPro - (track.pro_reference_time || 0);
      console.log(`  ⚠️  Difference from current: ${diff > 0 ? '+' : ''}${diff.toFixed(0)}s`);
      updates.push({
        id: track.id,
        slug: track.slug,
        currentTime: track.pro_reference_time,
        newTime: recommendedPro,
        source: 'p5_data',
      });
    } else {
      console.log(`  ✓ Current reference time is accurate`);
    }
  }

  // Apply updates
  if (updates.length > 0) {
    console.log('\n=============================');
    console.log('PROPOSED UPDATES');
    console.log('=============================\n');

    for (const update of updates) {
      console.log(`${update.slug}:`);
      console.log(`  Current: ${update.currentTime ? formatLapTime(update.currentTime) : 'N/A'}`);
      console.log(`  New:     ${formatLapTime(update.newTime)} (${update.source})`);
    }

    if (commit) {
      console.log('\nApplying updates...');
      for (const update of updates) {
        const { error } = await supabase
          .from('tracks')
          .update({ pro_reference_time: update.newTime })
          .eq('id', update.id);

        if (error) {
          console.log(`✗ Failed to update ${update.slug}: ${error.message}`);
        } else {
          console.log(`✓ Updated ${update.slug} to ${formatLapTime(update.newTime)}`);
        }
      }
    } else {
      console.log('\n[DRY-RUN] No changes made. Run with --commit to apply.');
    }
  } else {
    console.log('\n✅ All reference times are accurate. No updates needed.');
  }
}

main().catch(console.error);
