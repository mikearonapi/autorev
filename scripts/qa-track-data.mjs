#!/usr/bin/env node
/**
 * Track Data QA Script
 * 
 * Audits track lap time data to identify potentially misaligned entries.
 * Validates that lap times make sense for track length and configuration.
 * 
 * Usage:
 *   node scripts/qa-track-data.mjs                    # Audit all tracks
 *   node scripts/qa-track-data.mjs --track vir-full   # Audit specific track
 *   node scripts/qa-track-data.mjs --fix              # Fix identified issues (dry-run)
 *   node scripts/qa-track-data.mjs --fix --commit     # Actually commit fixes
 * 
 * @module scripts/qa-track-data
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
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

// Expected lap time ranges per mile (in seconds)
// Based on typical sports car performance
const EXPECTED_PACE = {
  fast: 32,      // ~32 sec/mile for fast GT cars (Corvette Z06, GT3, etc.)
  typical: 38,   // ~38 sec/mile for typical sports cars
  slow: 50,      // ~50 sec/mile for slower cars or poor conditions
  suspiciousMultiplier: 1.5, // Times > 1.5x expected max are suspicious
};

// Track-specific configurations with expected pro times
const TRACK_EXPECTATIONS = {
  'vir-full': {
    lengthMiles: 3.27,
    proTimeMin: 115,  // 1:55 - fast GT car
    proTimeMax: 125,  // 2:05 - typical sports car
    suspiciousMin: 90,   // Below this is likely race car (exclude)
    suspiciousMax: 150,  // Above this is likely wrong track config (Grand course?)
    description: 'VIR Full Course - 3.27 miles',
  },
  'vir-north': {
    lengthMiles: 2.25,
    proTimeMin: 80,
    proTimeMax: 95,
    suspiciousMin: 60,
    suspiciousMax: 110,
    description: 'VIR North Course - 2.25 miles',
  },
  'vir-south': {
    lengthMiles: 1.65,
    proTimeMin: 62,
    proTimeMax: 72,
    suspiciousMin: 45,
    suspiciousMax: 90,
    description: 'VIR South Course - 1.65 miles',
  },
  'vir-grand-east': {
    lengthMiles: 4.2,
    proTimeMin: 145,
    proTimeMax: 165,
    suspiciousMin: 120,
    suspiciousMax: 200,
    description: 'VIR Grand East Course - 4.2 miles',
  },
  'vir-grand-west': {
    lengthMiles: 3.97,
    proTimeMin: 138,
    proTimeMax: 158,
    suspiciousMin: 115,
    suspiciousMax: 190,
    description: 'VIR Grand West Course - 3.97 miles',
  },
  'vir-patriot': {
    lengthMiles: 1.1,
    proTimeMin: 42,
    proTimeMax: 52,
    suspiciousMin: 30,
    suspiciousMax: 70,
    description: 'VIR Patriot Course - 1.1 miles',
  },
};

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
// AUDIT FUNCTIONS
// ============================================================================

/**
 * Fetch all tracks with their lap time counts
 */
async function getTracksWithLapCounts() {
  const { data: tracks, error } = await supabase
    .from('tracks')
    .select(`
      id,
      slug,
      name,
      length_miles,
      configuration,
      pro_reference_time
    `)
    .order('slug');

  if (error) {
    console.error('Error fetching tracks:', error);
    return [];
  }

  // Get lap time counts for each track
  const tracksWithCounts = await Promise.all(
    tracks.map(async (track) => {
      const { count, error: countError } = await supabase
        .from('car_track_lap_times')
        .select('*', { count: 'exact', head: true })
        .eq('track_id', track.id);

      return {
        ...track,
        lapTimeCount: countError ? 0 : count,
      };
    })
  );

  return tracksWithCounts.filter(t => t.lapTimeCount > 0);
}

/**
 * Audit lap times for a specific track
 */
async function auditTrack(trackSlug) {
  // Get track info
  const { data: track, error: trackError } = await supabase
    .from('tracks')
    .select('id, slug, name, length_miles, pro_reference_time')
    .eq('slug', trackSlug)
    .single();

  if (trackError || !track) {
    console.error(`Track not found: ${trackSlug}`);
    return null;
  }

  // Get lap times with car info
  const { data: lapTimes, error: lapError } = await supabase
    .from('car_track_lap_times')
    .select(`
      id,
      lap_time_ms,
      lap_time_text,
      is_stock,
      source_url,
      car_id,
      created_at
    `)
    .eq('track_id', track.id)
    .not('lap_time_ms', 'is', null)
    .order('lap_time_ms', { ascending: true });

  if (lapError) {
    console.error(`Error fetching lap times for ${trackSlug}:`, lapError);
    return null;
  }

  if (!lapTimes || lapTimes.length === 0) {
    return { track, lapTimes: [], stats: null, issues: [] };
  }

  // Get car info
  const carIds = [...new Set(lapTimes.filter(l => l.car_id).map(l => l.car_id))];
  let carsMap = new Map();
  
  if (carIds.length > 0) {
    const { data: cars } = await supabase
      .from('cars')
      .select('id, slug, name, hp')
      .in('id', carIds);
    carsMap = new Map((cars || []).map(c => [c.id, c]));
  }

  // Enrich lap times with car data
  const enrichedLapTimes = lapTimes.map(lt => ({
    ...lt,
    car: carsMap.get(lt.car_id) || null,
    lapTimeSeconds: lt.lap_time_ms / 1000,
  }));

  // Calculate statistics
  const times = enrichedLapTimes.map(lt => lt.lapTimeSeconds).sort((a, b) => a - b);
  const stats = {
    count: times.length,
    fastest: times[0],
    slowest: times[times.length - 1],
    median: percentile(times, 0.5),
    p5: percentile(times, 0.05),
    p25: percentile(times, 0.25),
    p75: percentile(times, 0.75),
    p95: percentile(times, 0.95),
  };

  // Identify issues
  const issues = [];
  const expectations = TRACK_EXPECTATIONS[trackSlug];

  if (expectations) {
    // Check for times that are too fast (likely race cars or different track)
    const tooFast = enrichedLapTimes.filter(lt => lt.lapTimeSeconds < expectations.suspiciousMin);
    if (tooFast.length > 0) {
      issues.push({
        type: 'too_fast',
        severity: 'warning',
        count: tooFast.length,
        message: `${tooFast.length} lap times below ${formatLapTime(expectations.suspiciousMin)} (expected min for track length)`,
        items: tooFast.slice(0, 5).map(lt => ({
          id: lt.id,
          time: formatLapTime(lt.lapTimeSeconds),
          car: lt.car?.name || 'Unknown',
          source: lt.source_url,
        })),
      });
    }

    // Check for times that are too slow (likely wrong track configuration)
    const tooSlow = enrichedLapTimes.filter(lt => lt.lapTimeSeconds > expectations.suspiciousMax);
    if (tooSlow.length > 0) {
      issues.push({
        type: 'too_slow',
        severity: 'error',
        count: tooSlow.length,
        message: `${tooSlow.length} lap times above ${formatLapTime(expectations.suspiciousMax)} - likely misaligned from longer track config`,
        items: tooSlow.map(lt => ({
          id: lt.id,
          time: formatLapTime(lt.lapTimeSeconds),
          car: lt.car?.name || 'Unknown',
          source: lt.source_url,
        })),
      });
    }

    // Check if median is outside expected range
    if (stats.median < expectations.proTimeMin || stats.median > expectations.suspiciousMax) {
      issues.push({
        type: 'median_out_of_range',
        severity: 'error',
        message: `Median time ${formatLapTime(stats.median)} is outside expected range (${formatLapTime(expectations.proTimeMin)} - ${formatLapTime(expectations.suspiciousMax)})`,
      });
    }
  } else {
    // Generic checks based on track length
    const lengthMiles = track.length_miles || 2.5;
    const expectedMin = lengthMiles * EXPECTED_PACE.fast;
    const expectedMax = lengthMiles * EXPECTED_PACE.slow * EXPECTED_PACE.suspiciousMultiplier;

    const suspicious = enrichedLapTimes.filter(
      lt => lt.lapTimeSeconds < expectedMin * 0.7 || lt.lapTimeSeconds > expectedMax
    );

    if (suspicious.length > 0) {
      issues.push({
        type: 'suspicious_times',
        severity: 'warning',
        count: suspicious.length,
        message: `${suspicious.length} potentially suspicious lap times for ${lengthMiles.toFixed(2)}mi track`,
        items: suspicious.slice(0, 5).map(lt => ({
          id: lt.id,
          time: formatLapTime(lt.lapTimeSeconds),
          car: lt.car?.name || 'Unknown',
        })),
      });
    }
  }

  return {
    track,
    lapTimes: enrichedLapTimes,
    stats,
    issues,
    expectations,
  };
}

/**
 * Print audit results for a track
 */
function printTrackAudit(result) {
  if (!result) return;

  const { track, stats, issues, expectations } = result;

  console.log('\n' + '='.repeat(80));
  console.log(`TRACK: ${track.name} (${track.slug})`);
  console.log(`Length: ${track.length_miles?.toFixed(2) || 'N/A'} miles`);
  console.log(`Pro Reference Time: ${track.pro_reference_time ? formatLapTime(track.pro_reference_time) : 'N/A'}`);
  console.log('='.repeat(80));

  if (!stats) {
    console.log('No lap time data available');
    return;
  }

  console.log('\nSTATISTICS:');
  console.log(`  Total lap times: ${stats.count}`);
  console.log(`  Fastest: ${formatLapTime(stats.fastest)}`);
  console.log(`  Slowest: ${formatLapTime(stats.slowest)}`);
  console.log(`  Median:  ${formatLapTime(stats.median)}`);
  console.log(`  P5:      ${formatLapTime(stats.p5)} (Pro estimate)`);
  console.log(`  P25:     ${formatLapTime(stats.p25)} (Advanced)`);
  console.log(`  P75:     ${formatLapTime(stats.p75)}`);
  console.log(`  P95:     ${formatLapTime(stats.p95)} (Beginner)`);

  if (expectations) {
    console.log('\nEXPECTED RANGES:');
    console.log(`  Pro time: ${formatLapTime(expectations.proTimeMin)} - ${formatLapTime(expectations.proTimeMax)}`);
    console.log(`  Suspicious below: ${formatLapTime(expectations.suspiciousMin)}`);
    console.log(`  Suspicious above: ${formatLapTime(expectations.suspiciousMax)}`);
  }

  if (issues.length > 0) {
    console.log('\nISSUES FOUND:');
    for (const issue of issues) {
      const icon = issue.severity === 'error' ? '❌' : '⚠️';
      console.log(`  ${icon} [${issue.type}] ${issue.message}`);
      if (issue.items) {
        for (const item of issue.items.slice(0, 5)) {
          console.log(`     - ${item.time} | ${item.car}${item.source ? ` | ${item.source}` : ''}`);
        }
        if (issue.items.length > 5) {
          console.log(`     ... and ${issue.items.length - 5} more`);
        }
      }
    }
  } else {
    console.log('\n✅ No issues found');
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const trackSlug = args.find(a => a.startsWith('--track='))?.split('=')[1] ||
                    args.find((a, i) => args[i - 1] === '--track');
  const virOnly = args.includes('--vir');
  const showAll = args.includes('--all');

  console.log('Track Data QA Audit');
  console.log('===================\n');

  if (trackSlug) {
    // Audit specific track
    const result = await auditTrack(trackSlug);
    printTrackAudit(result);
  } else if (virOnly) {
    // Audit all VIR tracks
    const virTracks = ['vir-full', 'vir-north', 'vir-south', 'vir-grand-east', 'vir-grand-west', 'vir-patriot'];
    
    console.log('Auditing VIR track configurations...\n');
    
    let totalIssues = 0;
    const summary = [];

    for (const slug of virTracks) {
      const result = await auditTrack(slug);
      if (result) {
        printTrackAudit(result);
        totalIssues += result.issues.length;
        summary.push({
          track: slug,
          count: result.stats?.count || 0,
          issues: result.issues.length,
        });
      } else {
        console.log(`\n⚠️ Track ${slug} not found in database`);
        summary.push({ track: slug, count: 0, issues: 0, notFound: true });
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('VIR AUDIT SUMMARY');
    console.log('='.repeat(80));
    console.log('\n| Track            | Lap Times | Issues |');
    console.log('|------------------|-----------|--------|');
    for (const s of summary) {
      const status = s.notFound ? '(not found)' : '';
      console.log(`| ${s.track.padEnd(16)} | ${String(s.count).padStart(9)} | ${String(s.issues).padStart(6)} | ${status}`);
    }
    console.log(`\nTotal issues: ${totalIssues}`);
  } else if (showAll) {
    // Audit all tracks with data
    const tracks = await getTracksWithLapCounts();
    console.log(`Found ${tracks.length} tracks with lap time data\n`);

    let totalIssues = 0;
    const tracksWithIssues = [];

    for (const track of tracks) {
      const result = await auditTrack(track.slug);
      if (result && result.issues.length > 0) {
        totalIssues += result.issues.length;
        tracksWithIssues.push({
          slug: track.slug,
          name: track.name,
          count: result.stats?.count || 0,
          issues: result.issues,
        });
      }
    }

    console.log('TRACKS WITH ISSUES:');
    console.log('='.repeat(80));
    for (const track of tracksWithIssues) {
      console.log(`\n${track.name} (${track.slug}) - ${track.count} lap times`);
      for (const issue of track.issues) {
        const icon = issue.severity === 'error' ? '❌' : '⚠️';
        console.log(`  ${icon} ${issue.message}`);
      }
    }
    console.log(`\nTotal tracks with issues: ${tracksWithIssues.length}`);
    console.log(`Total issues: ${totalIssues}`);
  } else {
    // Default: show VIR audit
    console.log('Usage:');
    console.log('  node scripts/qa-track-data.mjs --vir        # Audit VIR configurations');
    console.log('  node scripts/qa-track-data.mjs --track=slug # Audit specific track');
    console.log('  node scripts/qa-track-data.mjs --all        # Audit all tracks with data');
    console.log('\nRunning VIR audit by default...\n');
    
    // Run VIR audit
    const virTracks = ['vir-full', 'vir-north', 'vir-south'];
    for (const slug of virTracks) {
      const result = await auditTrack(slug);
      printTrackAudit(result);
    }
  }
}

main().catch(console.error);
