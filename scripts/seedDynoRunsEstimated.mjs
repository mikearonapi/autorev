#!/usr/bin/env node
/**
 * Seed baseline + "modded estimate" dyno runs for ALL cars with tuning profiles.
 *
 * Usage:
 *   node scripts/seedDynoRunsEstimated.mjs                    # Process all cars
 *   node scripts/seedDynoRunsEstimated.mjs --limit=50         # Process first 50 cars
 *   node scripts/seedDynoRunsEstimated.mjs --car=bmw-m3-e46   # Process single car
 *   node scripts/seedDynoRunsEstimated.mjs --dry-run          # Preview without writing
 *   node scripts/seedDynoRunsEstimated.mjs --skip-existing    # Only process cars without dyno data
 *
 * Notes:
 * - Baseline runs use the car's stored HP/TQ as "OEM rated" (not a dyno pull).
 * - Modded runs are estimates derived from AutoRev's upgrade package model (not measured).
 * - All rows are inserted as verified=false with moderate confidence.
 * 
 * UPDATED 2026-01-21: Expanded to process ALL cars with tuning profiles
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { calculateRealisticHpGain, genericPackages } from '../data/upgradePackages.js';

config({ path: '.env.local' });

// Simple validation helper (avoids complex ESM import issues)
class DataValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'DataValidationError';
    Object.assign(this, details);
  }
}

function logValidationResults(pipelineName, results) {
  console.log(`\n[${pipelineName}] Validation Report:`);
  console.log(`  Total: ${results.total || 0}`);
  console.log(`  Valid: ${results.valid?.length || 0}`);
  console.log(`  Invalid: ${results.invalid?.length || 0}`);
  const successRate = results.total 
    ? ((results.valid?.length || 0) / results.total * 100).toFixed(2) + '%'
    : '0%';
  console.log(`  Success Rate: ${successRate}`);
}

// Parse CLI arguments
const args = process.argv.slice(2);
const getArg = (name) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
};
const hasFlag = (name) => args.includes(`--${name}`);

const limitArg = getArg('limit');
const carArg = getArg('car');
const dryRun = hasFlag('dry-run');
const skipExisting = hasFlag('skip-existing');
const showHelp = hasFlag('help') || hasFlag('h');

if (showHelp) {
  console.log(`
Dyno Data Seeding Script - Populates car_dyno_runs with estimated data

Usage:
  node scripts/seedDynoRunsEstimated.mjs [options]

Options:
  --limit=N         Process only first N cars (default: all)
  --car=SLUG        Process single car by slug
  --dry-run         Preview without writing to database
  --skip-existing   Only process cars that don't have dyno data
  --help            Show this help message

Examples:
  node scripts/seedDynoRunsEstimated.mjs --dry-run --limit=5
  node scripts/seedDynoRunsEstimated.mjs --car=bmw-m3-e46
  node scripts/seedDynoRunsEstimated.mjs --skip-existing
`);
  process.exit(0);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const baselineSourceUrl = 'repo://data/cars.js';
const moddedSourceUrl = 'repo://data/upgradePackages.js';

function pickPackage(key) {
  return (genericPackages || []).find((p) => p?.key === key) || null;
}

async function alreadyExists({ carId, runKind, sourceUrl }) {
  const { data, error } = await supabase
    .from('car_dyno_runs')
    .select('id')
    .eq('car_id', carId)
    .eq('run_kind', runKind)
    .eq('source_url', sourceUrl)
    .limit(1);
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

async function insertRun(payload, carName) {
  if (dryRun) {
    console.log(`  [DRY RUN] Would insert ${payload.run_kind} run for ${carName}: ${payload.peak_hp || 'N/A'} HP`);
    return;
  }
  const { error } = await supabase.from('car_dyno_runs').insert(payload);
  if (error) throw error;
}

// Validate car reference (resolve slug to ID)
async function validateCarReference(slug) {
  const { data, error } = await supabase
    .from('cars')
    .select('id')
    .eq('slug', slug)
    .single();
  
  if (error || !data) {
    throw new DataValidationError(`Car not found: ${slug}`, { field: 'car_slug', value: slug });
  }
  return data.id;
}

async function getCarsToProcess() {
  // If specific car requested
  if (carArg) {
    const { data, error } = await supabase
      .from('cars')
      .select('id, slug, name, hp, torque, engine')
      .eq('slug', carArg);
    if (error) throw error;
    if (!data || data.length === 0) {
      console.error(`Car not found: ${carArg}`);
      process.exit(1);
    }
    return data;
  }

  // Get all cars with tuning profiles
  let query = supabase
    .from('cars')
    .select('id, slug, name, hp, torque, engine')
    .not('hp', 'is', null)
    .order('slug');

  // If skip-existing, filter out cars that already have dyno data
  if (skipExisting) {
    const { data: existingCars } = await supabase
      .from('car_dyno_runs')
      .select('car_slug')
      .eq('source_url', baselineSourceUrl);
    
    const existingSlugs = new Set((existingCars || []).map(c => c.car_slug));
    
    const { data: allCars, error } = await query;
    if (error) throw error;
    
    const filteredCars = (allCars || []).filter(c => !existingSlugs.has(c.slug));
    console.log(`Found ${filteredCars.length} cars without existing dyno data (filtered from ${allCars?.length || 0} total)`);
    
    if (limitArg) {
      return filteredCars.slice(0, parseInt(limitArg, 10));
    }
    return filteredCars;
  }

  if (limitArg) {
    query = query.limit(parseInt(limitArg, 10));
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function main() {
  console.log('═'.repeat(70));
  console.log('DYNO DATA SEEDING');
  console.log('═'.repeat(70));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log(`Skip Existing: ${skipExisting ? 'Yes' : 'No'}`);
  console.log(`Limit: ${limitArg || 'None (all cars)'}`);
  console.log(`Single Car: ${carArg || 'None'}`);
  console.log('─'.repeat(70));

  const trackPack = pickPackage('trackPack');
  if (!trackPack) throw new Error('Could not find genericPackages trackPack');

  const cars = await getCarsToProcess();
  console.log(`\nProcessing ${cars.length} cars...\n`);

  let inserted = 0;
  let skipped = 0;
  let validationErrors = [];
  let processed = 0;

  for (const car of cars) {
    processed++;
    const progress = `[${processed}/${cars.length}]`;
    
    try {
      // Validate car reference
      const carId = await validateCarReference(car.slug);

      // Baseline (OEM-rated, not dyno)
      if (await alreadyExists({ carId, runKind: 'baseline', sourceUrl: baselineSourceUrl })) {
        skipped++;
      } else {
        await insertRun({
          car_id: carId,
          run_kind: 'baseline',
          recorded_at: null,
          dyno_type: 'oem_rated',
          correction: null,
          drivetrain: null,
          transmission: null,
          gear: null,
          fuel: null,
          is_wheel: false,
          peak_whp: null,
          peak_wtq: null,
          peak_hp: Number.isFinite(Number(car.hp)) ? Number(car.hp) : null,
          peak_tq: Number.isFinite(Number(car.torque)) ? Number(car.torque) : null,
          boost_psi_max: null,
          curve: {},
          conditions: { source: 'internal_specs' },
          modifications: {},
          notes: 'Seeded from internal car specs (OEM-rated; not a dyno pull).',
          source_url: baselineSourceUrl,
          confidence: 0.6,
          verified: false,
        }, car.name);
        inserted++;
        console.log(`${progress} ✅ ${car.name}: Baseline (${car.hp} HP)`);
      }

      // Modded (estimated)
      const hpGain = calculateRealisticHpGain(
        { slug: car.slug, engine: car.engine, hp: car.hp },
        [trackPack]
      );
      const baseHp = Number.isFinite(Number(car.hp)) ? Number(car.hp) : null;
      const estHp = baseHp !== null ? baseHp + Number(hpGain || 0) : null;

      if (await alreadyExists({ carId, runKind: 'modded', sourceUrl: moddedSourceUrl })) {
        skipped++;
      } else {
        await insertRun({
          car_id: carId,
          run_kind: 'modded',
          recorded_at: null,
          dyno_type: 'estimated_from_package_model',
          correction: null,
          drivetrain: null,
          transmission: null,
          gear: null,
          fuel: null,
          is_wheel: false,
          peak_whp: null,
          peak_wtq: null,
          peak_hp: estHp,
          peak_tq: null,
          boost_psi_max: null,
          curve: {},
          conditions: { source: 'estimate', model: 'upgradePackages.trackPack' },
          modifications: {
            estimate: true,
            package: { key: trackPack.key, name: trackPack.name, hpGain },
          },
          notes: `Estimated from AutoRev upgrade package model (${trackPack.name}); not a measured dyno pull.`,
          source_url: moddedSourceUrl,
          confidence: 0.55,
          verified: false,
        }, car.name);
        inserted++;
        console.log(`${progress} ✅ ${car.name}: Modded (${estHp} HP, +${hpGain})`);
      }
    } catch (err) {
      if (err instanceof DataValidationError) {
        validationErrors.push({ carSlug: car.slug, reason: err.message });
        console.warn(`${progress} ⚠️  Skipped ${car.slug}: ${err.message}`);
      } else {
        throw err;
      }
    }
  }

  // Log validation results
  console.log('\n' + '─'.repeat(70));
  logValidationResults('seedDynoRunsEstimated', {
    total: cars.length * 2, // baseline + modded per car
    valid: Array(inserted + skipped).fill({}),
    invalid: validationErrors,
  });

  console.log('\n' + '═'.repeat(70));
  console.log('SUMMARY');
  console.log('═'.repeat(70));
  console.log(`Cars processed: ${processed}`);
  console.log(`Dyno runs inserted: ${inserted}`);
  console.log(`Dyno runs skipped (already existed): ${skipped}`);
  console.log(`Validation errors: ${validationErrors.length}`);
  if (dryRun) {
    console.log('\n⚠️  DRY RUN - No data was written to the database');
    console.log('   Remove --dry-run flag to actually insert data');
  }
  console.log('═'.repeat(70));
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
