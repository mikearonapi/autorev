#!/usr/bin/env node
/**
 * Tuning Shop Enhancement Pipeline - Main Orchestrator
 * 
 * Runs the complete pipeline for a car or batch of cars:
 * 1. Mine existing database data
 * 2. Analyze gaps
 * 3. Create/update tuning profile
 * 4. Validate the result
 * 
 * Usage:
 *   node scripts/tuning-pipeline/run-pipeline.mjs --car-slug ford-f150-thirteenth
 *   node scripts/tuning-pipeline/run-pipeline.mjs --batch top10
 *   node scripts/tuning-pipeline/run-pipeline.mjs --car-slug ford-f150-thirteenth --analyze-only
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';
import { mineDatabase, formatMinedDataReport } from './mine-database.mjs';
import { analyzeGaps, formatGapReport } from './analyze-gaps.mjs';
import { createProfile } from './create-profile.mjs';
import { validateProfile, formatValidationResult } from './validate-profile.mjs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const PIPELINE_VERSION = '1.0.0';

/**
 * Top 30 vehicles by US modification market
 */
const TOP_30_VEHICLES = {
  top10: [
    { slug: 'ford-f150-thirteenth', name: 'Ford F-150', variants: ['3.5L EcoBoost', '5.0L Coyote'] },
    { slug: 'jeep-wrangler-jl', name: 'Jeep Wrangler JL', focus: 'off-road' },
    { slug: 'ford-mustang-gt-s550', name: 'Ford Mustang GT S550', variants: ['5.0L Coyote'] },
    { slug: 'chevrolet-silverado-1500', name: 'Chevrolet Silverado 1500', variants: ['5.3L V8', '6.2L V8'] },
    { slug: 'volkswagen-gti-mk7', name: 'VW GTI Mk7', variants: ['EA888 Gen3'] },
    { slug: 'chevrolet-corvette-c8', name: 'Corvette C8' },
    { slug: 'toyota-tacoma-third-gen', name: 'Toyota Tacoma', focus: 'off-road' },
    { slug: 'subaru-wrx-sti-va', name: 'Subaru WRX STI VA' },
    { slug: 'ram-1500-fifth-gen', name: 'Ram 1500', variants: ['5.7L HEMI', '3.0L EcoDiesel'] },
    { slug: 'bmw-m3-f80', name: 'BMW M3 F80' }
  ],
  tier2: [
    { slug: 'chevrolet-camaro-ss-zl1', name: 'Camaro SS/ZL1' },
    { slug: 'honda-civic-type-r-fk8', name: 'Civic Type R FK8' },
    { slug: 'ford-bronco-sixth-gen', name: 'Ford Bronco', focus: 'off-road' },
    { slug: 'ram-2500-cummins', name: 'Ram 2500 Cummins', focus: 'towing' },
    { slug: 'ford-f250-super-duty', name: 'Ford F-250 Super Duty', focus: 'towing' },
    { slug: 'mazda-mx5-miata-nd', name: 'Mazda MX-5 Miata ND' },
    { slug: 'toyota-4runner-fifth-gen', name: 'Toyota 4Runner', focus: 'off-road' },
    { slug: 'dodge-challenger-hellcat', name: 'Dodge Challenger Hellcat' },
    { slug: 'volkswagen-golf-r-mk7', name: 'VW Golf R Mk7' },
    { slug: 'bmw-m3-e46', name: 'BMW M3 E46' }
  ],
  tier3: [
    { slug: 'porsche-911-991', name: 'Porsche 911 991' },
    { slug: 'audi-rs3-8v', name: 'Audi RS3 8V' },
    { slug: 'ford-focus-rs', name: 'Ford Focus RS' },
    { slug: 'toyota-supra-a90', name: 'Toyota Supra A90' },
    { slug: 'nissan-370z', name: 'Nissan 370Z' },
    { slug: 'subaru-brz-first-gen', name: 'Subaru BRZ' },
    { slug: 'mercedes-amg-c63-w205', name: 'Mercedes-AMG C63' },
    { slug: 'chevrolet-colorado-zr2', name: 'Chevrolet Colorado ZR2', focus: 'off-road' },
    { slug: 'bmw-m2-f87', name: 'BMW M2' },
    { slug: 'jeep-gladiator', name: 'Jeep Gladiator', focus: 'off-road' }
  ]
};

/**
 * Run the complete pipeline for a single car
 */
export async function runPipeline(options) {
  const {
    carSlug,
    carId,
    engineFamily,
    tuningFocus = 'performance',
    analyzeOnly = false,
    dryRun = false,
    verbose = true
  } = options;

  const results = {
    car: null,
    minedData: null,
    gapReport: null,
    profile: null,
    validation: null,
    success: false,
    errors: []
  };

  const log = verbose ? console.log : () => {};

  log('\n' + '═'.repeat(60));
  log('TUNING SHOP ENHANCEMENT PIPELINE v' + PIPELINE_VERSION);
  log('═'.repeat(60));
  log(`Car: ${carSlug}`);
  if (engineFamily) log(`Engine: ${engineFamily}`);
  log(`Focus: ${tuningFocus}`);
  log('═'.repeat(60));

  try {
    // STEP 1: Mine database
    log('\n📦 STEP 1: DATABASE MINING');
    log('─'.repeat(40));
    results.minedData = await mineDatabase(carSlug, carId);
    results.car = results.minedData.car;
    
    log(`   ✓ Car: ${results.car.name}`);
    log(`   ✓ YouTube videos: ${results.minedData.youtubeVideos.length}`);
    log(`   ✓ Issues: ${results.minedData.issues.length}`);
    log(`   ✓ Parts: ${results.minedData.parts.length}`);
    log(`   ✓ Dyno runs: ${results.minedData.dynoRuns.length}`);
    log(`   ✓ Variants: ${results.minedData.variants.length}`);

    // STEP 2: Analyze gaps
    log('\n🔍 STEP 2: GAP ANALYSIS');
    log('─'.repeat(40));
    results.gapReport = analyzeGaps(results.minedData);
    
    log(`   Data Quality Score: ${results.gapReport.dataQuality.score}/100`);
    log(`   Gaps found: ${results.gapReport.gaps.length}`);
    if (results.gapReport.gaps.length > 0) {
      const critical = results.gapReport.gaps.filter(g => g.severity === 'critical').length;
      const high = results.gapReport.gaps.filter(g => g.severity === 'high').length;
      if (critical > 0) log(`   ⚠️  Critical gaps: ${critical}`);
      if (high > 0) log(`   ⚠️  High gaps: ${high}`);
    }
    
    if (results.gapReport.youtubeInsights.tunerMentions?.length > 0) {
      log(`   YouTube tuners: ${results.gapReport.youtubeInsights.tunerMentions.join(', ')}`);
    }

    if (analyzeOnly) {
      log('\n📋 ANALYZE ONLY - Stopping before profile creation');
      log(formatGapReport(results.gapReport));
      results.success = true;
      return results;
    }

    // STEP 3: Create profile
    log('\n🔧 STEP 3: PROFILE CREATION');
    log('─'.repeat(40));
    
    const profileResult = await createProfile({
      carSlug,
      carId: results.car.id,
      engineFamily,
      tuningFocus,
      minedData: results.minedData,
      dryRun
    });
    
    results.profile = profileResult.profile;
    
    if (profileResult.saved) {
      log(`   ✓ Profile ${results.minedData.existingProfile ? 'updated' : 'created'}`);
    } else {
      log(`   ℹ️  Dry run - profile not saved`);
    }

    // STEP 4: Validate
    log('\n✅ STEP 4: VALIDATION');
    log('─'.repeat(40));
    
    results.validation = validateProfile(results.profile);
    
    log(`   Valid: ${results.validation.valid ? 'Yes' : 'No'}`);
    log(`   Score: ${results.validation.score}/100`);
    log(`   Errors: ${results.validation.errors.length}`);
    log(`   Warnings: ${results.validation.warnings.length}`);

    results.success = results.validation.valid;

    // Summary
    log('\n' + '═'.repeat(60));
    log('PIPELINE COMPLETE');
    log('═'.repeat(60));
    log(`Car: ${results.car.name}`);
    log(`Profile Valid: ${results.validation.valid ? '✅ Yes' : '❌ No'}`);
    log(`Quality Score: ${results.validation.score}/100`);
    log(`Stages: ${results.profile.stage_progressions?.length || 0}`);
    log(`Platforms: ${results.profile.tuning_platforms?.length || 0}`);
    log(`Power Limits: ${Object.keys(results.profile.power_limits || {}).length}`);
    log('═'.repeat(60));

  } catch (error) {
    results.errors.push(error.message);
    log(`\n❌ Error: ${error.message}`);
    results.success = false;
  }

  return results;
}

/**
 * Run pipeline for a batch of cars
 */
export async function runBatch(batchName, options = {}) {
  const { dryRun = false, verbose = false } = options;
  
  let vehicles = [];
  
  switch (batchName) {
    case 'top10':
      vehicles = TOP_30_VEHICLES.top10;
      break;
    case 'tier2':
      vehicles = TOP_30_VEHICLES.tier2;
      break;
    case 'tier3':
      vehicles = TOP_30_VEHICLES.tier3;
      break;
    case 'top30':
      vehicles = [
        ...TOP_30_VEHICLES.top10,
        ...TOP_30_VEHICLES.tier2,
        ...TOP_30_VEHICLES.tier3
      ];
      break;
    case 'all':
      // Fetch ALL cars from database
      console.log('\n📥 Fetching all vehicles from database...');
      const { data: allCars, error: fetchError } = await supabase
        .from('cars')
        .select('id, slug, name, category')
        .order('name');
      
      if (fetchError) {
        throw new Error(`Failed to fetch cars: ${fetchError.message}`);
      }
      
      // Determine focus based on category
      vehicles = allCars.map(car => ({
        slug: car.slug,
        name: car.name,
        id: car.id,
        focus: ['truck', 'suv', 'off-road'].some(cat => 
          car.category?.toLowerCase().includes(cat) || 
          car.name?.toLowerCase().includes('wrangler') ||
          car.name?.toLowerCase().includes('bronco') ||
          car.name?.toLowerCase().includes('4runner') ||
          car.name?.toLowerCase().includes('tacoma') ||
          car.name?.toLowerCase().includes('gladiator')
        ) ? 'off-road' : 'performance'
      }));
      
      console.log(`   Found ${vehicles.length} vehicles`);
      break;
    default:
      throw new Error(`Unknown batch: ${batchName}. Use: top10, tier2, tier3, top30, all`);
  }

  console.log(`\n🚀 Running batch: ${batchName}`);
  console.log(`   Vehicles: ${vehicles.length}`);
  console.log(`   Dry run: ${dryRun}`);
  console.log('═'.repeat(60));

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];
    const progress = `[${i + 1}/${vehicles.length}]`;
    console.log(`\n📍 ${progress} Processing: ${vehicle.name}`);
    
    // Skip lookup if we already have ID (from 'all' batch)
    if (!vehicle.id) {
      // Check if car exists in database
      const { data: car } = await supabase
        .from('cars')
        .select('id, slug, name')
        .eq('slug', vehicle.slug)
        .single();

      if (!car) {
        // Try to find by partial match
        const { data: matches } = await supabase
          .from('cars')
          .select('id, slug, name')
          .ilike('slug', `%${vehicle.slug.split('-').slice(0, 2).join('-')}%`)
          .limit(1);
        
        if (matches && matches.length > 0) {
          console.log(`   ⚠️  Using closest match: ${matches[0].slug}`);
          vehicle.slug = matches[0].slug;
          vehicle.id = matches[0].id;
        } else {
          console.log(`   ⚠️  Car not found: ${vehicle.slug}`);
          results.push({ vehicle, success: false, error: 'Car not found' });
          failCount++;
          continue;
        }
      } else {
        vehicle.id = car.id;
      }
    }

    // If vehicle has variants, create profile for each
    if (vehicle.variants && vehicle.variants.length > 0) {
      for (const variant of vehicle.variants) {
        try {
          const result = await runPipeline({
            carSlug: vehicle.slug,
            carId: vehicle.id,
            engineFamily: variant,
            tuningFocus: vehicle.focus || 'performance',
            dryRun,
            verbose
          });
          results.push({ vehicle, variant, result });
          if (result.success) successCount++;
          else failCount++;
        } catch (error) {
          console.log(`   ❌ Error (${variant}): ${error.message}`);
          results.push({ vehicle, variant, success: false, error: error.message });
          failCount++;
        }
      }
    } else {
      // Single profile
      try {
        const result = await runPipeline({
          carSlug: vehicle.slug,
          carId: vehicle.id,
          tuningFocus: vehicle.focus || 'performance',
          dryRun,
          verbose
        });
        results.push({ vehicle, result });
        if (result.success) successCount++;
        else failCount++;
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.push({ vehicle, success: false, error: error.message });
        failCount++;
      }
    }
  }

  // Batch summary
  console.log('\n' + '═'.repeat(60));
  console.log('BATCH COMPLETE');
  console.log('═'.repeat(60));
  console.log(`Total vehicles: ${vehicles.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('═'.repeat(60));

  return { results, successCount, failCount };
}

// CLI execution
async function main() {
  const { values } = parseArgs({
    options: {
      'car-slug': { type: 'string' },
      'car-id': { type: 'string' },
      'engine': { type: 'string' },
      'focus': { type: 'string', default: 'performance' },
      'batch': { type: 'string' },
      'analyze-only': { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      'verbose': { type: 'boolean', short: 'v', default: true },
      'quiet': { type: 'boolean', short: 'q', default: false },
      'help': { type: 'boolean', short: 'h' }
    }
  });

  if (values.help) {
    console.log(`
Tuning Shop Enhancement Pipeline - Main Orchestrator

Usage:
  node run-pipeline.mjs --car-slug <slug> [options]
  node run-pipeline.mjs --batch <batch-name> [options]

Options:
  --car-slug      Car slug to process
  --car-id        Car UUID to process
  --engine        Engine family (e.g., "3.5L EcoBoost")
  --focus         Tuning focus: performance, off-road, towing (default: performance)
  --batch         Run batch: top10, tier2, tier3, top30, all
  --analyze-only  Only run mining and gap analysis (no profile creation)
  --dry-run       Create profile but don't save to database
  -v, --verbose   Verbose output (default: true)
  -q, --quiet     Minimal output
  -h, --help      Show this help message

Examples:
  # Single car
  node run-pipeline.mjs --car-slug ford-f150-thirteenth --engine "3.5L EcoBoost"
  
  # Analyze only (no changes)
  node run-pipeline.mjs --car-slug volkswagen-gti-mk7 --analyze-only
  
  # Batch processing
  node run-pipeline.mjs --batch top10 --dry-run
  
  # All top 30 vehicles
  node run-pipeline.mjs --batch top30
`);
    process.exit(0);
  }

  try {
    if (values.batch) {
      // Batch mode
      await runBatch(values.batch, {
        dryRun: values['dry-run'],
        verbose: !values.quiet
      });
    } else if (values['car-slug'] || values['car-id']) {
      // Single car mode
      await runPipeline({
        carSlug: values['car-slug'],
        carId: values['car-id'],
        engineFamily: values.engine,
        tuningFocus: values.focus,
        analyzeOnly: values['analyze-only'],
        dryRun: values['dry-run'],
        verbose: !values.quiet
      });
    } else {
      console.log('❌ Please specify --car-slug, --car-id, or --batch');
      console.log('   Use --help for usage information');
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMainModule) {
  main().catch(console.error);
}
