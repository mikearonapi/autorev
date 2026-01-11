#!/usr/bin/env node
/**
 * Enhance Existing Vehicles - Tuning Shop Data
 * 
 * Identifies and enhances vehicles that need better tuning shop data.
 * Targets vehicles with:
 * - No upgrades_by_objective data
 * - skeleton/templated quality tier
 * - Missing tuning profiles entirely
 * 
 * Usage:
 *   node scripts/tuning-pipeline/enhance-existing-vehicles.mjs --status
 *   node scripts/tuning-pipeline/enhance-existing-vehicles.mjs --batch needs-enhancement
 *   node scripts/tuning-pipeline/enhance-existing-vehicles.mjs --batch skeleton
 *   node scripts/tuning-pipeline/enhance-existing-vehicles.mjs --batch all --limit 50
 *   node scripts/tuning-pipeline/enhance-existing-vehicles.mjs --slug bmw-m3-g80
 * 
 * Options:
 *   --status           Show current enhancement status across all vehicles
 *   --batch            Run batch enhancement: needs-enhancement, skeleton, templated, all
 *   --slug             Enhance a specific vehicle
 *   --limit            Limit number of vehicles to process (default: no limit)
 *   --dry-run          Preview without saving
 *   --consolidate-only Run only the consolidation step (merge existing data)
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';
import { runPipeline } from './run-pipeline.mjs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// Parse arguments
const { values } = parseArgs({
  options: {
    'status': { type: 'boolean', default: false },
    'batch': { type: 'string' },
    'slug': { type: 'string' },
    'limit': { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    'consolidate-only': { type: 'boolean', default: false },
    'help': { type: 'boolean', short: 'h', default: false },
  },
});

const showStatus = values['status'];
const batchMode = values['batch'];
const specificSlug = values['slug'];
const limit = values['limit'] ? parseInt(values['limit']) : null;
const dryRun = values['dry-run'];
const consolidateOnly = values['consolidate-only'];

function printUsage() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║              ENHANCE EXISTING VEHICLES - TUNING SHOP DATA                     ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Identifies and enhances vehicles that need better tuning shop data.

USAGE:
  # Check current status
  node scripts/tuning-pipeline/enhance-existing-vehicles.mjs --status

  # Enhance vehicles that need it most (no upgrades_by_objective)
  node scripts/tuning-pipeline/enhance-existing-vehicles.mjs --batch needs-enhancement

  # Enhance skeleton profiles (lowest quality)
  node scripts/tuning-pipeline/enhance-existing-vehicles.mjs --batch skeleton

  # Enhance a specific vehicle
  node scripts/tuning-pipeline/enhance-existing-vehicles.mjs --slug bmw-m3-g80

OPTIONS:
  --status             Show enhancement status breakdown
  --batch MODE         Run batch: needs-enhancement, skeleton, templated, all
  --slug SLUG          Enhance specific vehicle by slug
  --limit N            Process at most N vehicles
  --dry-run            Preview changes without saving
  --consolidate-only   Only consolidate existing data (no new research)
  -h, --help           Show this help

BATCH MODES:
  needs-enhancement    Vehicles with 0 upgrades (highest priority)
  skeleton             Vehicles with skeleton quality tier
  templated            Vehicles with templated quality tier
  all                  All vehicles (will update existing data)
`);
}

if (values['help']) {
  printUsage();
  process.exit(0);
}

/**
 * Get comprehensive status of all vehicles
 */
async function getEnhancementStatus() {
  // Get all cars
  const { data: cars, error: carsError } = await supabase
    .from('cars')
    .select('id, slug, name, category')
    .order('name');

  if (carsError) {
    throw new Error(`Failed to fetch cars: ${carsError.message}`);
  }

  // Get all tuning profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('car_tuning_profiles')
    .select('car_id, data_quality_tier, upgrades_by_objective, stage_progressions');

  if (profilesError) {
    throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
  }

  // Build profile map
  const profileMap = new Map();
  for (const p of profiles || []) {
    const objectives = p.upgrades_by_objective || {};
    const totalUpgrades = Object.values(objectives).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    const hasStages = p.stage_progressions?.length > 0;

    profileMap.set(p.car_id, {
      tier: p.data_quality_tier || 'unknown',
      totalUpgrades,
      hasStages,
    });
  }

  // Categorize cars
  const status = {
    total: cars.length,
    withProfile: 0,
    withoutProfile: 0,
    byTier: {
      verified: [],
      researched: [],
      enriched: [],
      templated: [],
      skeleton: [],
      unknown: [],
    },
    needsEnhancement: [], // No upgrades_by_objective data
    hasUpgrades: [],
  };

  for (const car of cars) {
    const profile = profileMap.get(car.id);

    if (!profile) {
      status.withoutProfile++;
      status.byTier.unknown.push(car);
      status.needsEnhancement.push(car);
    } else {
      status.withProfile++;
      status.byTier[profile.tier]?.push(car) || status.byTier.unknown.push(car);

      if (profile.totalUpgrades === 0) {
        status.needsEnhancement.push(car);
      } else {
        status.hasUpgrades.push(car);
      }
    }
  }

  return status;
}

/**
 * Display status summary
 */
async function displayStatus() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              VEHICLE ENHANCEMENT STATUS                                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  const status = await getEnhancementStatus();

  console.log('📊 OVERVIEW');
  console.log('─────────────────────────────────────────────────────────────────────────────────');
  console.log(`   Total vehicles:           ${status.total}`);
  console.log(`   With tuning profile:      ${status.withProfile}`);
  console.log(`   Without tuning profile:   ${status.withoutProfile}`);
  console.log('');

  console.log('📈 BY DATA QUALITY TIER');
  console.log('─────────────────────────────────────────────────────────────────────────────────');
  console.log(`   ✅ Verified:    ${status.byTier.verified.length.toString().padStart(4)} (manually verified, highest quality)`);
  console.log(`   🔵 Researched:  ${status.byTier.researched.length.toString().padStart(4)} (3+ sources, auto-researched)`);
  console.log(`   🟣 Enriched:    ${status.byTier.enriched.length.toString().padStart(4)} (2 sources)`);
  console.log(`   🟡 Templated:   ${status.byTier.templated.length.toString().padStart(4)} (1 source, basic)`);
  console.log(`   ⚪ Skeleton:    ${status.byTier.skeleton.length.toString().padStart(4)} (minimal data)`);
  console.log(`   ❓ Unknown:     ${status.byTier.unknown.length.toString().padStart(4)} (no profile or unset)`);
  console.log('');

  console.log('🎯 ENHANCEMENT PRIORITY');
  console.log('─────────────────────────────────────────────────────────────────────────────────');
  console.log(`   Needs enhancement (0 upgrades): ${status.needsEnhancement.length}`);
  console.log(`   Has upgrades (some data):       ${status.hasUpgrades.length}`);
  console.log('');

  if (status.needsEnhancement.length > 0) {
    console.log('🚨 TOP 10 NEEDING ENHANCEMENT');
    console.log('─────────────────────────────────────────────────────────────────────────────────');
    status.needsEnhancement.slice(0, 10).forEach((car, i) => {
      console.log(`   ${i + 1}. ${car.name} (${car.slug})`);
    });
    console.log('');
    console.log('   To enhance these vehicles:');
    console.log('   node scripts/tuning-pipeline/enhance-existing-vehicles.mjs --batch needs-enhancement');
  }

  console.log('');
}

/**
 * Get vehicles for a batch mode
 */
async function getVehiclesForBatch(mode) {
  const status = await getEnhancementStatus();

  switch (mode) {
    case 'needs-enhancement':
      return status.needsEnhancement;
    case 'skeleton':
      return status.byTier.skeleton;
    case 'templated':
      return status.byTier.templated;
    case 'all':
      // Get all cars with their current profile status
      const { data: cars } = await supabase
        .from('cars')
        .select('id, slug, name, category')
        .order('name');
      return cars || [];
    default:
      throw new Error(`Unknown batch mode: ${mode}`);
  }
}

/**
 * Run consolidation for a car (merge existing data sources)
 */
async function runConsolidation(carSlug) {
  const { spawn } = await import('child_process');
  const path = await import('path');
  const { fileURLToPath } = await import('url');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  return new Promise((resolve, reject) => {
    const child = spawn('node', [
      path.join(__dirname, 'consolidate-tuning-data.mjs'),
      '--slug', carSlug,
      ...(dryRun ? ['--dry-run'] : []),
    ], {
      cwd: path.resolve(__dirname, '../..'),
      stdio: 'pipe',
    });

    let output = '';
    child.stdout?.on('data', (data) => { output += data.toString(); });
    child.stderr?.on('data', (data) => { output += data.toString(); });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        resolve({ success: false, output, error: `Exit code ${code}` });
      }
    });

    child.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

/**
 * Enhance a single vehicle
 */
async function enhanceVehicle(car, index, total) {
  const progress = `[${index + 1}/${total}]`;
  console.log(`\n${progress} 🚗 ${car.name}`);

  try {
    if (consolidateOnly) {
      // Just run consolidation
      console.log(`   Running consolidation...`);
      const result = await runConsolidation(car.slug);
      if (result.success) {
        console.log(`   ✅ Consolidated`);
        return { success: true };
      } else {
        console.log(`   ⚠️  Consolidation issue: ${result.error}`);
        return { success: false, error: result.error };
      }
    } else {
      // Run full pipeline
      const result = await runPipeline(car.slug, {
        carId: car.id,
        tuningFocus: car.category?.toLowerCase().includes('truck') || car.category?.toLowerCase().includes('suv') ? 'off-road' : 'performance',
        dryRun,
        verbose: false,
      });

      if (result.success) {
        const upgradeCount = Object.values(result.profile?.upgrades_by_objective || {})
          .reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
        console.log(`   ✅ Enhanced (${upgradeCount} upgrades, tier: ${result.profile?.data_quality_tier || 'unknown'})`);
        return { success: true, upgradeCount };
      } else {
        console.log(`   ⚠️  Issues: ${result.errors?.join(', ') || 'Unknown'}`);
        return { success: false, errors: result.errors };
      }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Run batch enhancement
 */
async function runBatchEnhancement(mode) {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              BATCH ENHANCEMENT                                                ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`   Mode: ${mode}`);
  console.log(`   Dry run: ${dryRun ? 'Yes' : 'No'}`);
  console.log(`   Consolidate only: ${consolidateOnly ? 'Yes' : 'No'}`);
  console.log(`   Limit: ${limit || 'No limit'}`);
  console.log('');

  let vehicles = await getVehiclesForBatch(mode);

  if (limit) {
    vehicles = vehicles.slice(0, limit);
  }

  console.log(`   Found ${vehicles.length} vehicles to process`);
  console.log('─────────────────────────────────────────────────────────────────────────────────');

  let successCount = 0;
  let failCount = 0;
  let totalUpgrades = 0;

  for (let i = 0; i < vehicles.length; i++) {
    const result = await enhanceVehicle(vehicles[i], i, vehicles.length);
    if (result.success) {
      successCount++;
      totalUpgrades += result.upgradeCount || 0;
    } else {
      failCount++;
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('BATCH COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(`   Processed:  ${vehicles.length}`);
  console.log(`   Successful: ${successCount}`);
  console.log(`   Failed:     ${failCount}`);
  if (!consolidateOnly) {
    console.log(`   Total upgrades added: ${totalUpgrades}`);
  }
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  if (showStatus) {
    await displayStatus();
    return;
  }

  if (specificSlug) {
    // Enhance specific vehicle
    const { data: car } = await supabase
      .from('cars')
      .select('id, slug, name, category')
      .eq('slug', specificSlug)
      .single();

    if (!car) {
      console.error(`❌ Car not found: ${specificSlug}`);
      process.exit(1);
    }

    await enhanceVehicle(car, 0, 1);
    return;
  }

  if (batchMode) {
    await runBatchEnhancement(batchMode);
    return;
  }

  printUsage();
}

main().catch((err) => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
