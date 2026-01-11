#!/usr/bin/env node
/**
 * Complete Car Addition Pipeline
 * 
 * Unified script that populates ALL car-related tables:
 * 
 * PHASE 1 - Car Pipeline:
 *   - cars (140 columns - specs, scores, editorial)
 *   - car_issues (known problems)
 *   - vehicle_maintenance_specs (oil, fluids, tires)
 *   - vehicle_service_intervals (service schedules)
 *   - car_fuel_economy (EPA data)
 *   - car_safety_data (NHTSA ratings)
 *   - car_tuning_profiles (skeleton)
 * 
 * PHASE 2 - Tuning Pipeline:
 *   - car_tuning_profiles.upgrades_by_objective (SOURCE OF TRUTH)
 *   - car_tuning_profiles.platform_insights
 *   - car_tuning_profiles.data_quality_tier upgrade
 *   - youtube_videos.car_id (links existing videos)
 * 
 * Usage:
 *   node scripts/car-pipeline/add-car-complete.mjs "BMW M3 Competition (G80)"
 *   node scripts/car-pipeline/add-car-complete.mjs "Ford Mustang GT (S550)" --verbose
 *   node scripts/car-pipeline/add-car-complete.mjs "Porsche 911 GT3" --dry-run
 *   node scripts/car-pipeline/add-car-complete.mjs --slug existing-car-slug --tuning-only
 *   node scripts/car-pipeline/add-car-complete.mjs --slug bmw-m3-g80 --audit
 * 
 * Options:
 *   --dry-run      Preview without saving
 *   --verbose      Detailed logging
 *   --tuning-only  Skip car creation, only run tuning enhancement (for existing cars)
 *   --slug         Use existing car slug instead of creating new car
 *   --audit        Show data coverage for an existing car (no changes)
 */

import { spawn } from 'child_process';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// Parse arguments
const { values, positionals } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    'verbose': { type: 'boolean', default: false },
    'tuning-only': { type: 'boolean', default: false },
    'slug': { type: 'string' },
    'audit': { type: 'boolean', default: false },
    'help': { type: 'boolean', short: 'h', default: false },
  },
  allowPositionals: true,
});

const carName = positionals[0];
const dryRun = values['dry-run'];
const verbose = values['verbose'];
const tuningOnly = values['tuning-only'];
const existingSlug = values['slug'];
const auditMode = values['audit'];

function printUsage() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                    COMPLETE CAR ADDITION PIPELINE                          ║
╚════════════════════════════════════════════════════════════════════════════╝

This script runs BOTH the Car Pipeline and Tuning Pipeline to ensure
complete, enriched data for every vehicle.

USAGE:
  Add a new car (full pipeline):
    node scripts/car-pipeline/add-car-complete.mjs "BMW M3 Competition (G80)"

  Enhance an existing car (tuning only):
    node scripts/car-pipeline/add-car-complete.mjs --slug bmw-m3-g80 --tuning-only

OPTIONS:
  --dry-run       Preview changes without saving to database
  --verbose       Show detailed logging
  --tuning-only   Skip car creation, only run tuning enhancement
  --slug          Specify existing car slug (required with --tuning-only)
  -h, --help      Show this help message

EXAMPLES:
  # New car - creates entry + enriches tuning data
  node scripts/car-pipeline/add-car-complete.mjs "Porsche 911 GT3 (992)"

  # Existing car - only enhance tuning shop data  
  node scripts/car-pipeline/add-car-complete.mjs --slug porsche-911-gt3 --tuning-only

  # Dry run to preview
  node scripts/car-pipeline/add-car-complete.mjs "Ferrari 296 GTB" --dry-run --verbose
`);
}

if (values['help']) {
  printUsage();
  process.exit(0);
}

if (!carName && !existingSlug) {
  console.error('❌ Please provide a car name or --slug');
  printUsage();
  process.exit(1);
}

if (tuningOnly && !existingSlug) {
  console.error('❌ --tuning-only requires --slug to specify the existing car');
  process.exit(1);
}

if (auditMode && !existingSlug) {
  console.error('❌ --audit requires --slug to specify the car to audit');
  process.exit(1);
}

/**
 * Run a child script and capture output
 */
function runScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath, ...args], {
      cwd: projectRoot,
      stdio: verbose ? 'inherit' : 'pipe',
    });

    let stdout = '';
    let stderr = '';

    if (!verbose) {
      child.stdout?.on('data', (data) => { stdout += data.toString(); });
      child.stderr?.on('data', (data) => { stderr += data.toString(); });
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, stdout, stderr });
      } else {
        reject(new Error(`Script exited with code ${code}\n${stderr || stdout}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Get car slug from the database by name pattern
 */
async function findCarSlug(carName) {
  // Generate expected slug pattern
  const slugPattern = carName
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Try exact match first
  const { data: exactMatch } = await supabase
    .from('cars')
    .select('slug, name')
    .ilike('slug', slugPattern)
    .single();

  if (exactMatch) return exactMatch.slug;

  // Try partial match
  const { data: partialMatches } = await supabase
    .from('cars')
    .select('slug, name')
    .ilike('name', `%${carName}%`)
    .limit(1);

  if (partialMatches?.length > 0) {
    return partialMatches[0].slug;
  }

  return null;
}

/**
 * Get car details by slug
 */
async function getCarBySlug(slug) {
  const { data, error } = await supabase
    .from('cars')
    .select('id, slug, name, category')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data;
}

/**
 * Check if tuning profile exists
 */
async function checkTuningProfile(carId) {
  const { data, error } = await supabase
    .from('car_tuning_profiles')
    .select('id, data_quality_tier, upgrades_by_objective')
    .eq('car_id', carId)
    .eq('tuning_focus', 'performance')
    .single();

  if (error || !data) return null;

  const objectives = data.upgrades_by_objective || {};
  const totalUpgrades = Object.values(objectives).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

  return {
    ...data,
    totalUpgrades,
  };
}

/**
 * Audit data coverage for a car across ALL related tables
 */
async function auditCarData(slug) {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    CAR DATA COVERAGE AUDIT                                 ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Get car record
  const { data: car, error: carError } = await supabase
    .from('cars')
    .select('id, slug, name, brand, years, hp, torque, score_sound, score_track, score_reliability')
    .eq('slug', slug)
    .single();

  if (carError || !car) {
    console.error(`❌ Car not found: ${slug}`);
    process.exit(1);
  }

  console.log(`🚗 ${car.name}`);
  console.log(`   Slug: ${car.slug}`);
  console.log(`   ID: ${car.id}`);
  console.log('');

  const results = [];

  // Check each related table
  const checks = [
    { table: 'cars', query: () => supabase.from('cars').select('id, hp, torque, price_avg, score_sound, image_hero_url').eq('slug', slug).single(), single: true },
    { table: 'car_tuning_profiles', query: () => supabase.from('car_tuning_profiles').select('id, data_quality_tier, upgrades_by_objective, stage_progressions').eq('car_id', car.id) },
    { table: 'car_issues', query: () => supabase.from('car_issues').select('id').eq('car_id', car.id) },
    { table: 'vehicle_maintenance_specs', query: () => supabase.from('vehicle_maintenance_specs').select('id, oil_type, oil_capacity_liters').eq('car_id', car.id) },
    { table: 'vehicle_service_intervals', query: () => supabase.from('vehicle_service_intervals').select('id').eq('car_id', car.id) },
    { table: 'car_fuel_economy', query: () => supabase.from('car_fuel_economy').select('id, combined_mpg').eq('car_id', car.id) },
    { table: 'car_safety_data', query: () => supabase.from('car_safety_data').select('id, nhtsa_overall_rating').eq('car_id', car.id) },
    { table: 'car_recalls', query: () => supabase.from('car_recalls').select('id').eq('car_id', car.id) },
    { table: 'car_variants', query: () => supabase.from('car_variants').select('id').eq('car_id', car.id) },
    { table: 'youtube_video_car_links', query: () => supabase.from('youtube_video_car_links').select('id').eq('car_id', car.id) },
    { table: 'community_insights', query: () => supabase.from('community_insights').select('id').eq('car_id', car.id) },
    { table: 'car_dyno_runs', query: () => supabase.from('car_dyno_runs').select('id').eq('car_id', car.id) },
    { table: 'car_track_lap_times', query: () => supabase.from('car_track_lap_times').select('id').eq('car_id', car.id) },
    { table: 'car_market_pricing', query: () => supabase.from('car_market_pricing').select('id').eq('car_id', car.id) },
    { table: 'document_chunks', query: () => supabase.from('document_chunks').select('id').eq('car_id', car.id) },
  ];

  console.log('📊 DATA COVERAGE');
  console.log('─────────────────────────────────────────────────────────────────────────────');

  for (const check of checks) {
    const { data, error } = await check.query();
    
    if (check.single) {
      const record = data;
      if (record) {
        // Check data quality for cars table
        const hasScores = record.score_sound != null;
        const hasSpecs = record.hp != null && record.torque != null;
        const hasImage = record.image_hero_url != null;
        const quality = [hasScores, hasSpecs, hasImage].filter(Boolean).length;
        results.push({ table: check.table, count: 1, status: quality >= 2 ? '✅' : '⚠️', note: `specs:${hasSpecs} scores:${hasScores} image:${hasImage}` });
        console.log(`   ✅ ${check.table.padEnd(28)} 1 record (specs:${hasSpecs ? '✓' : '✗'} scores:${hasScores ? '✓' : '✗'} image:${hasImage ? '✓' : '✗'})`);
      } else {
        results.push({ table: check.table, count: 0, status: '❌' });
        console.log(`   ❌ ${check.table.padEnd(28)} MISSING`);
      }
    } else {
      const count = data?.length || 0;
      let status = count > 0 ? '✅' : '⚪';
      let note = '';
      
      // Special handling for tuning profiles
      if (check.table === 'car_tuning_profiles' && count > 0) {
        const profile = data[0];
        const objectives = profile.upgrades_by_objective || {};
        const totalUpgrades = Object.values(objectives).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
        note = `tier:${profile.data_quality_tier || 'unknown'} upgrades:${totalUpgrades}`;
        status = totalUpgrades > 0 ? '✅' : '⚠️';
      }
      
      results.push({ table: check.table, count, status, note });
      const countStr = count > 0 ? `${count} record${count > 1 ? 's' : ''}` : 'empty';
      console.log(`   ${status} ${check.table.padEnd(28)} ${countStr}${note ? ` (${note})` : ''}`);
    }
  }

  // Summary
  const populated = results.filter(r => r.count > 0).length;
  const total = results.length;
  const critical = ['cars', 'car_tuning_profiles', 'car_issues', 'vehicle_maintenance_specs', 'vehicle_service_intervals'];
  const criticalMissing = critical.filter(t => {
    const r = results.find(x => x.table === t);
    return !r || r.count === 0;
  });

  console.log('');
  console.log('═════════════════════════════════════════════════════════════════════════════');
  console.log(`COVERAGE: ${populated}/${total} tables populated`);
  
  if (criticalMissing.length > 0) {
    console.log(`⚠️  CRITICAL MISSING: ${criticalMissing.join(', ')}`);
  } else {
    console.log('✅ All critical tables populated');
  }

  // Tuning profile specific check
  const tuningResult = results.find(r => r.table === 'car_tuning_profiles');
  if (tuningResult && tuningResult.note) {
    if (tuningResult.note.includes('upgrades:0')) {
      console.log('');
      console.log('💡 Tuning profile needs enhancement. Run:');
      console.log(`   node scripts/tuning-pipeline/run-pipeline.mjs --car-slug ${slug}`);
    }
  }

  console.log('═════════════════════════════════════════════════════════════════════════════');
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  // Handle audit mode
  if (auditMode && existingSlug) {
    await auditCarData(existingSlug);
    return;
  }

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    COMPLETE CAR ADDITION PIPELINE                          ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  const startTime = Date.now();
  let carSlug = existingSlug;
  let carData = null;

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: CAR PIPELINE (skip if tuning-only)
  // ═══════════════════════════════════════════════════════════════════════════

  if (!tuningOnly) {
    console.log('┌──────────────────────────────────────────────────────────────────────────┐');
    console.log('│ PHASE 1: CAR PIPELINE - Creating car entry with core data               │');
    console.log('└──────────────────────────────────────────────────────────────────────────┘');
    console.log(`   Car: ${carName}`);
    console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log('');

    try {
      const carPipelineScript = path.join(projectRoot, 'scripts/car-pipeline/ai-research-car.js');
      const args = [carName];
      if (dryRun) args.push('--dry-run');
      if (verbose) args.push('--verbose');

      console.log('   Running ai-research-car.js...');
      await runScript(carPipelineScript, args);
      console.log('   ✅ Car pipeline completed');
      console.log('');

      // Find the created car slug
      if (!dryRun) {
        carSlug = await findCarSlug(carName);
        if (!carSlug) {
          throw new Error(`Could not find car slug after creation. Car name: ${carName}`);
        }
        console.log(`   📍 Car slug: ${carSlug}`);
      }
    } catch (error) {
      console.error(`   ❌ Car pipeline failed: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log('┌──────────────────────────────────────────────────────────────────────────┐');
    console.log('│ PHASE 1: SKIPPED (--tuning-only mode)                                   │');
    console.log('└──────────────────────────────────────────────────────────────────────────┘');
    console.log(`   Using existing car: ${existingSlug}`);
    console.log('');
  }

  // Get car data for tuning pipeline
  if (carSlug && !dryRun) {
    carData = await getCarBySlug(carSlug);
    if (!carData) {
      console.error(`   ❌ Car not found: ${carSlug}`);
      process.exit(1);
    }

    // Check existing tuning profile
    const existingProfile = await checkTuningProfile(carData.id);
    if (existingProfile) {
      console.log(`   Existing tuning profile:`);
      console.log(`     - Quality tier: ${existingProfile.data_quality_tier || 'unknown'}`);
      console.log(`     - Total upgrades: ${existingProfile.totalUpgrades}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: TUNING PIPELINE - Enhance tuning shop data
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('┌──────────────────────────────────────────────────────────────────────────┐');
  console.log('│ PHASE 2: TUNING PIPELINE - Enhancing tuning shop data                   │');
  console.log('└──────────────────────────────────────────────────────────────────────────┘');

  if (dryRun) {
    console.log('   [DRY RUN] Would run tuning pipeline');
    console.log('');
  } else if (carSlug) {
    try {
      const tuningPipelineScript = path.join(projectRoot, 'scripts/tuning-pipeline/run-pipeline.mjs');
      const args = ['--car-slug', carSlug];
      if (verbose) args.push('--verbose');

      console.log(`   Running tuning pipeline for: ${carSlug}...`);
      await runScript(tuningPipelineScript, args);
      console.log('   ✅ Tuning pipeline completed');
      console.log('');

      // Show final tuning profile status
      const finalProfile = await checkTuningProfile(carData.id);
      if (finalProfile) {
        console.log('   📊 Final tuning profile:');
        console.log(`     - Quality tier: ${finalProfile.data_quality_tier || 'unknown'}`);
        console.log(`     - Total upgrades: ${finalProfile.totalUpgrades}`);
      }
    } catch (error) {
      console.error(`   ⚠️  Tuning pipeline had issues: ${error.message}`);
      console.log('   (Car was still created - tuning can be retried later)');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                           PIPELINE COMPLETE                               ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log(`   Car: ${carData?.name || carName}`);
  console.log(`   Slug: ${carSlug || '(dry run)'}`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  // Show data coverage audit for completed car
  if (!dryRun && carSlug) {
    await auditCarData(carSlug);
    
    console.log('   Next steps:');
    console.log(`   1. Verify at: /cars/${carSlug}`);
    console.log(`   2. Check tuning shop: /cars/${carSlug}?tab=tuning`);
    console.log('');
  }
}

main().catch((err) => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
