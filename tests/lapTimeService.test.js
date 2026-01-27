/* eslint-disable no-console */
/**
 * Lap Time Service Tests
 *
 * Tests the data-driven lap time estimation service.
 *
 * Run: node tests/lapTimeService.test.js
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import lapTimeService from '../lib/lapTimeService.js';

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║            Lap Time Service Tests                              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const results = { passed: 0, failed: 0 };

  // Test 1: formatLapTime (M:SS.mmm format with 3 decimal places)
  console.log('Test 1: formatLapTime');
  try {
    const formatted = lapTimeService.formatLapTime(95.5);
    if (formatted === '1:35.500') {
      console.log('  ✅ formatLapTime(95.5) = "1:35.500"');
      results.passed++;
    } else {
      console.log(`  ❌ formatLapTime(95.5) expected "1:35.500", got "${formatted}"`);
      results.failed++;
    }

    const nullFormatted = lapTimeService.formatLapTime(null);
    if (nullFormatted === '--:--.---') {
      console.log('  ✅ formatLapTime(null) = "--:--.---"');
      results.passed++;
    } else {
      console.log(`  ❌ formatLapTime(null) expected "--:--.---", got "${nullFormatted}"`);
      results.failed++;
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    results.failed++;
  }

  // Test 2: DRIVER_SKILLS constants
  console.log('\nTest 2: DRIVER_SKILLS constants');
  try {
    const skills = lapTimeService.DRIVER_SKILLS;
    if (skills.beginner && skills.intermediate && skills.advanced && skills.professional) {
      console.log('  ✅ All skill levels defined');
      results.passed++;
    } else {
      console.log('  ❌ Missing skill levels');
      results.failed++;
    }

    if (skills.beginner.modUtilization === 0.2 && skills.professional.modUtilization === 0.95) {
      console.log('  ✅ Mod utilization values correct');
      results.passed++;
    } else {
      console.log(`  ❌ Unexpected mod utilization values`);
      results.failed++;
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    results.failed++;
  }

  // Test 3: MOD_IMPACT constants
  console.log('\nTest 3: MOD_IMPACT constants');
  try {
    const impact = lapTimeService.MOD_IMPACT;
    if (impact.power && impact.tires && impact.suspension) {
      console.log('  ✅ MOD_IMPACT categories defined');
      results.passed++;
    } else {
      console.log('  ❌ Missing MOD_IMPACT categories');
      results.failed++;
    }

    if (impact.tires['r-comp'] === 0.07) {
      console.log('  ✅ R-comp tire impact = 0.07 (7%)');
      results.passed++;
    } else {
      console.log(`  ❌ Unexpected R-comp tire impact: ${impact.tires['r-comp']}`);
      results.failed++;
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    results.failed++;
  }

  // Test 4: getTrackStatsSummary (requires DB connection)
  console.log('\nTest 4: getTrackStatsSummary (requires DB)');
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('  ⚠️ Skipped - No Supabase connection');
    } else {
      // Use Road Atlanta - exists in both tracks and track_venues tables
      const stats = await lapTimeService.getTrackStatsSummary('road-atlanta');

      if (stats && stats.hasData) {
        console.log(`  ✅ Got stats for Road Atlanta: ${stats.count} lap times`);
        console.log(`     Fastest: ${stats.fastest}, Median: ${stats.median}`);
        results.passed++;
      } else if (stats && !stats.hasData) {
        console.log('  ⚠️ No data for this track');
        results.passed++;
      } else {
        console.log('  ❌ Unexpected null response');
        results.failed++;
      }
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    results.failed++;
  }

  // Test 5: estimateLapTime (requires DB connection)
  console.log('\nTest 5: estimateLapTime (requires DB)');
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('  ⚠️ Skipped - No Supabase connection');
    } else {
      const estimate = await lapTimeService.estimateLapTime({
        trackSlug: 'road-atlanta',
        stockHp: 400,
        currentHp: 450,
        weight: 3500,
        driverSkill: 'intermediate',
        mods: {
          tireCompound: 'r-comp',
          suspension: { type: 'coilovers' },
        },
      });

      if (estimate.source === 'real_data') {
        console.log(`  ✅ Got estimate from real data (${estimate.sampleSize} samples)`);
        console.log(
          `     Stock: ${estimate.formatted?.stock}, Modded: ${estimate.formatted?.modded}`
        );
        console.log(`     Improvement: ${estimate.formatted?.improvement}`);
        results.passed++;
      } else if (estimate.source === 'unavailable') {
        console.log('  ⚠️ No data available for this track');
        results.passed++;
      } else {
        console.log(`  ❌ Unexpected source: ${estimate.source}`);
        results.failed++;
      }
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    results.failed++;
  }

  // Test 6: Check database connection and count lap times
  console.log('\nTest 6: Database lap time count');
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('  ⚠️ Skipped - No Supabase connection');
    } else {
      // Query lap time count
      const { createClient } = await import('@supabase/supabase-js');
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { count, error } = await client
        .from('car_track_lap_times')
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null) {
        console.log(`  ✅ Database contains ${count.toLocaleString()} lap times`);

        // Check if we have enough for good estimates
        if (count >= 3000) {
          console.log(`     ✅ Sufficient data for reliable estimates`);
        } else {
          console.log(`     ⚠️ More data would improve estimates`);
        }
        results.passed++;
      } else {
        console.log(`  ❌ Failed to count: ${error?.message}`);
        results.failed++;
      }
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    results.failed++;
  }

  // Test 7: Skill level progression should be reasonable (not race car outliers)
  console.log('\nTest 7: Skill level progression sanity check');
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('  ⚠️ Skipped - No Supabase connection');
    } else {
      // Test with a track that has mixed data (street cars + race cars)
      const beginnerEst = await lapTimeService.estimateLapTime({
        trackSlug: 'vir-full',
        stockHp: 300,
        driverSkill: 'beginner',
      });

      const proEst = await lapTimeService.estimateLapTime({
        trackSlug: 'vir-full',
        stockHp: 300,
        driverSkill: 'professional',
      });

      if (beginnerEst.source === 'real_data' && proEst.source === 'real_data') {
        const beginnerTime = beginnerEst.stockLapTime;
        const proTime = proEst.stockLapTime;
        const improvement = beginnerTime - proTime;

        // Pro should be faster than beginner
        if (proTime < beginnerTime) {
          console.log(
            `  ✅ Pro (${lapTimeService.formatLapTime(proTime)}) is faster than Beginner (${lapTimeService.formatLapTime(beginnerTime)})`
          );
          results.passed++;
        } else {
          console.log(`  ❌ Pro should be faster than Beginner`);
          results.failed++;
        }

        // But not unreasonably faster (race car vs street car = 50%+ improvement)
        // A reasonable skill-based improvement should be < 40% of beginner time
        const improvementPercent = (improvement / beginnerTime) * 100;
        if (improvementPercent < 40) {
          console.log(
            `  ✅ Skill improvement is reasonable: ${improvement.toFixed(1)}s (${improvementPercent.toFixed(1)}%)`
          );
          results.passed++;
        } else {
          console.log(
            `  ❌ Skill improvement too large (${improvementPercent.toFixed(1)}%) - likely includes race car outliers`
          );
          results.failed++;
        }
      } else {
        console.log('  ⚠️ No data for VIR track');
        results.passed++;
      }
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    results.failed++;
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log(`RESULTS: ${results.passed} passed, ${results.failed} failed`);
  console.log('═'.repeat(60));

  process.exit(results.failed > 0 ? 1 : 0);
}

runTests();
