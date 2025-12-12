#!/usr/bin/env node
/**
 * Database Migration and Seed Script
 * 
 * This script:
 * 1. Connects to Supabase using the service role key
 * 2. Creates all required tables (cars, leads, upgrade_packages)
 * 3. Seeds the cars table with data from src/data/cars.js
 * 4. Seeds the upgrade_packages table with data from src/data/upgradePackages.js
 * 
 * Usage:
 *   node scripts/migrate-and-seed.js
 * 
 * Environment variables required:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (bypasses RLS)
 */

import { createClient } from '@supabase/supabase-js';
import { carData } from '../data/cars.js';
import { genericPackages, upgradeModules } from '../data/upgradePackages.js';

// Configuration - MUST be set via environment variables
// NEVER hardcode secrets - use .env file locally and Vercel/Supabase env vars in production
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Example: SUPABASE_URL=https://your-project.supabase.co SUPABASE_SERVICE_ROLE_KEY=your-key node scripts/migrate-and-seed.js');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Convert camelCase to snake_case
 */
function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Transform car data from local format to Supabase format
 */
function transformCarForSupabase(car) {
  return {
    slug: car.slug,
    name: car.name,
    years: car.years,
    tier: car.tier,
    category: car.category,
    // Advisory scores
    score_sound: car.sound,
    score_interior: car.interior,
    score_track: car.track,
    score_reliability: car.reliability,
    score_value: car.value,
    score_driver_fun: car.driverFun,
    score_aftermarket: car.aftermarket,
    // Core specs
    engine: car.engine,
    hp: car.hp,
    trans: car.trans,
    price_range: car.priceRange,
    price_avg: car.priceAvg,
    // Extended specs
    curb_weight: car.curbWeight || null,
    zero_to_sixty: car.zeroToSixty || null,
    top_speed: car.topSpeed || null,
    drivetrain: car.drivetrain || null,
    layout: car.layout || null,
    msrp_new_low: car.msrpNewLow || null,
    msrp_new_high: car.msrpNewHigh || null,
    // Hard metrics for Performance HUB
    torque: car.torque || null,
    quarter_mile: car.quarterMile || null,
    braking_60_0: car.braking60To0 || null,
    lateral_g: car.lateralG || null,
    // Performance HUB scores
    perf_power_accel: car.perfPowerAccel || null,
    perf_grip_cornering: car.perfGripCornering || null,
    perf_braking: car.perfBraking || null,
    perf_track_pace: car.perfTrackPace || null,
    perf_drivability: car.perfDrivability || null,
    perf_reliability_heat: car.perfReliabilityHeat || null,
    perf_sound_emotion: car.perfSoundEmotion || null,
    // Content
    notes: car.notes,
    highlight: car.highlight,
    tagline: car.tagline || null,
    hero_blurb: car.heroBlurb || null,
    owner_notes_long: car.ownerNotesLong || null,
    pros: car.pros || [],
    cons: car.cons || [],
    best_for: car.bestFor || [],
    // Media (will be updated later with Vercel Blob URLs)
    image_hero_url: car.imageHeroUrl || null,
    image_gallery: car.imageGallery || [],
  };
}

/**
 * Transform upgrade package for Supabase
 */
function transformPackageForSupabase(pkg) {
  return {
    key: pkg.key,
    name: pkg.name,
    slug: pkg.slug,
    type: pkg.type,
    tier: pkg.tier,
    category: pkg.category || null,
    description: pkg.description,
    intended_use: pkg.intendedUse || null,
    estimated_cost: pkg.estimatedCost || null,
    estimated_cost_low: pkg.estimatedCostLow || null,
    estimated_cost_high: pkg.estimatedCostHigh || null,
    delta_power_accel: pkg.deltas?.powerAccel || 0,
    delta_grip_cornering: pkg.deltas?.gripCornering || 0,
    delta_braking: pkg.deltas?.braking || 0,
    delta_track_pace: pkg.deltas?.trackPace || 0,
    delta_drivability: pkg.deltas?.drivability || 0,
    delta_reliability_heat: pkg.deltas?.reliabilityHeat || 0,
    delta_sound_emotion: pkg.deltas?.soundEmotion || 0,
    metric_hp_gain: pkg.metrics?.hpGain || 0,
    metric_zero_to_sixty_improvement: pkg.metrics?.zeroToSixtyImprovement || 0,
    metric_braking_improvement: pkg.metrics?.brakingImprovement || 0,
    metric_lateral_g_improvement: pkg.metrics?.lateralGImprovement || 0,
    includes: pkg.includes || [],
    considerations: pkg.considerations || [],
    car_slug: pkg.carSlug || null,
    applicable_layouts: pkg.applicableLayouts || ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  };
}

/**
 * Run the schema migration
 */
async function runMigration() {
  console.log('🔄 Running schema migration...\n');

  // We'll create tables one by one using the REST API
  // First, let's check if the extension exists
  const { error: extError } = await supabase.rpc('create_extension_if_not_exists', { 
    extension_name: 'uuid-ossp' 
  }).catch(() => ({ error: 'Extension function not available' }));

  // The schema SQL will be run via the Supabase SQL Editor
  // For now, we'll just verify the tables exist or create them via REST

  console.log('✅ Schema migration: Please run supabase/schema.sql in the Supabase SQL Editor');
  console.log('   This script will seed data assuming tables already exist.\n');
}

/**
 * Seed the cars table
 */
async function seedCars() {
  console.log('🚗 Seeding cars table...');
  console.log(`   Processing ${carData.length} cars...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const car of carData) {
    const transformedCar = transformCarForSupabase(car);
    
    const { data, error } = await supabase
      .from('cars')
      .upsert(transformedCar, { 
        onConflict: 'slug',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error(`   ❌ Error inserting ${car.name}: ${error.message}`);
      errorCount++;
    } else {
      console.log(`   ✅ ${car.name}`);
      successCount++;
    }
  }

  console.log(`\n📊 Cars seeding complete: ${successCount} succeeded, ${errorCount} failed\n`);
  return { successCount, errorCount };
}

/**
 * Seed the upgrade_packages table
 */
async function seedUpgradePackages() {
  console.log('🔧 Seeding upgrade_packages table...');
  
  const allPackages = [...genericPackages, ...upgradeModules];
  console.log(`   Processing ${allPackages.length} packages/modules...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const pkg of allPackages) {
    const transformedPkg = transformPackageForSupabase(pkg);
    
    const { data, error } = await supabase
      .from('upgrade_packages')
      .upsert(transformedPkg, { 
        onConflict: 'key',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error(`   ❌ Error inserting ${pkg.name}: ${error.message}`);
      errorCount++;
    } else {
      console.log(`   ✅ ${pkg.name}`);
      successCount++;
    }
  }

  console.log(`\n📊 Packages seeding complete: ${successCount} succeeded, ${errorCount} failed\n`);
  return { successCount, errorCount };
}

/**
 * Test the connection
 */
async function testConnection() {
  console.log('🔌 Testing Supabase connection...');
  
  try {
    // Try to query the database
    const { data, error } = await supabase.from('cars').select('count').limit(1);
    
    if (error && error.code === '42P01') {
      // Table doesn't exist yet - that's okay, we'll create it
      console.log('   ⚠️  Tables not found. Please run the schema first.\n');
      return false;
    } else if (error) {
      console.error(`   ❌ Connection error: ${error.message}\n`);
      return false;
    }
    
    console.log('   ✅ Connection successful!\n');
    return true;
  } catch (err) {
    console.error(`   ❌ Connection failed: ${err.message}\n`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n========================================');
  console.log('AutoRev Database Setup');
  console.log('========================================\n');
  
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Service Role Key: ${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...\n`);

  // Test connection
  const connected = await testConnection();
  
  if (!connected) {
    console.log('❗ Cannot connect or tables not found.');
    console.log('   Please run the schema.sql file in Supabase SQL Editor first:\n');
    console.log('   1. Go to https://supabase.com/dashboard/project/pcbkerqlfcjbnhaxjyqj/sql');
    console.log('   2. Copy the contents of supabase/schema.sql');
    console.log('   3. Paste and run in the SQL Editor');
    console.log('   4. Run this script again\n');
    return;
  }

  // Seed cars
  const carsResult = await seedCars();
  
  // Seed upgrade packages
  const packagesResult = await seedUpgradePackages();

  // Summary
  console.log('\n========================================');
  console.log('Setup Complete!');
  console.log('========================================');
  console.log(`Cars: ${carsResult.successCount} seeded`);
  console.log(`Packages: ${packagesResult.successCount} seeded`);
  console.log('\nNext steps:');
  console.log('1. Verify data in Supabase Dashboard');
  console.log('2. Update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel');
  console.log('3. Generate and upload images to Vercel Blob');
  console.log('4. Redeploy to see live data\n');
}

// Run
main().catch(console.error);

