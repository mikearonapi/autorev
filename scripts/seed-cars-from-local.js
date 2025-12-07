#!/usr/bin/env node
/**
 * SuperNatural Motorsports - Database Seed Script
 * 
 * This script syncs local car data from src/data/cars.js to Supabase.
 * Run this when setting up a new environment or after adding/modifying cars locally.
 * 
 * Usage:
 *   node scripts/seed-cars-from-local.js
 * 
 * Requirements:
 *   - Node.js 18+
 *   - Environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   - Run 'npm install' first
 * 
 * This script uses the SERVICE_ROLE_KEY (not the anon key) because:
 *   - RLS policies block writes from the anon key
 *   - Admin operations need full access
 *   - SERVICE_ROLE_KEY should NEVER be exposed to the browser
 */

import { createClient } from '@supabase/supabase-js';
import { carData } from '../src/data/cars.js';
import { genericPackages, upgradeModules } from '../src/data/upgradePackages.js';

// Get environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables.');
  console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Example: SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/seed-cars-from-local.js');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Transform local car data to Supabase format (camelCase → snake_case)
 */
function transformCarForSupabase(car) {
  return {
    slug: car.slug,
    name: car.name,
    years: car.years,
    tier: car.tier,
    category: car.category,
    
    // Advisory Scores
    score_sound: car.sound,
    score_interior: car.interior,
    score_track: car.track,
    score_reliability: car.reliability,
    score_value: car.value,
    score_driver_fun: car.driverFun,
    score_aftermarket: car.aftermarket,
    
    // Core Specs
    engine: car.engine,
    hp: car.hp,
    trans: car.trans,
    price_range: car.priceRange,
    price_avg: car.priceAvg,
    drivetrain: car.drivetrain || null,
    
    // Extended Specs
    curb_weight: car.curbWeight || null,
    zero_to_sixty: car.zeroToSixty || null,
    top_speed: car.topSpeed || null,
    layout: car.layout || null,
    msrp_new_low: car.msrpNewLow || null,
    msrp_new_high: car.msrpNewHigh || null,
    torque: car.torque || null,
    quarter_mile: car.quarterMile || null,
    braking_60_0: car.braking60To0 || null,
    lateral_g: car.lateralG || null,
    
    // Performance HUB Scores
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
    recommendation_highlight: car.recommendationHighlight || null,
    
    // Media
    image_hero_url: car.imageHeroUrl || null,
    image_gallery: car.imageGallery || [],
    video_url: car.videoUrl || null,
    
    // CTA
    cta_copy: car.ctaCopy || null,
  };
}

/**
 * Transform upgrade package for Supabase format
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
    
    // Performance Deltas
    delta_power_accel: pkg.deltas?.powerAccel || 0,
    delta_grip_cornering: pkg.deltas?.gripCornering || 0,
    delta_braking: pkg.deltas?.braking || 0,
    delta_track_pace: pkg.deltas?.trackPace || 0,
    delta_drivability: pkg.deltas?.drivability || 0,
    delta_reliability_heat: pkg.deltas?.reliabilityHeat || 0,
    delta_sound_emotion: pkg.deltas?.soundEmotion || 0,
    
    // Metric Changes
    metric_hp_gain: pkg.metricChanges?.hpGain || 0,
    metric_zero_to_sixty_improvement: pkg.metricChanges?.zeroToSixtyImprovement || 0,
    metric_braking_improvement: pkg.metricChanges?.brakingImprovement || 0,
    metric_lateral_g_improvement: pkg.metricChanges?.lateralGImprovement || 0,
    
    includes: pkg.includes || [],
    considerations: pkg.considerations || [],
    
    car_slug: pkg.carSlug || null,
    applicable_layouts: pkg.applicableLayouts || ['Mid-Engine', 'Front-Engine', 'Rear-Engine'],
  };
}

async function seedCars() {
  console.log(`\n📦 Seeding ${carData.length} cars...`);
  
  for (const car of carData) {
    const transformed = transformCarForSupabase(car);
    
    const { error } = await supabase
      .from('cars')
      .upsert(transformed, { onConflict: 'slug' });
    
    if (error) {
      console.error(`   ❌ ${car.name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${car.name}`);
    }
  }
}

async function seedUpgradePackages() {
  const allPackages = [...genericPackages, ...upgradeModules];
  console.log(`\n🔧 Seeding ${allPackages.length} upgrade packages/modules...`);
  
  for (const pkg of allPackages) {
    const transformed = transformPackageForSupabase(pkg);
    
    const { error } = await supabase
      .from('upgrade_packages')
      .upsert(transformed, { onConflict: 'key' });
    
    if (error) {
      console.error(`   ❌ ${pkg.name}: ${error.message}`);
    } else {
      console.log(`   ✅ ${pkg.name}`);
    }
  }
}

async function main() {
  console.log('🚀 SuperNatural Motorsports - Database Seed Script');
  console.log('   Target:', SUPABASE_URL);
  
  try {
    await seedCars();
    await seedUpgradePackages();
    
    console.log('\n✨ Seeding complete!');
    console.log('   Run your app and verify data loads from Supabase.');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

main();

