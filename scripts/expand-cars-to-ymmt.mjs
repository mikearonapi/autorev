#!/usr/bin/env node

/**
 * Expand v1 Cars to v2 YMMT Records
 * 
 * This script reads existing v1 car records (with year ranges like "2015-2020")
 * and creates year-specific v2 records for each individual year.
 * 
 * Features:
 * - Parses year ranges ("2015-2020", "2024-present", "1969")
 * - Creates individual year records with proper naming
 * - Links v2 records to v1 parent for content inheritance
 * - Generates unique slugs for each year
 * - Preserves all existing data on v1 records
 * 
 * Usage: node scripts/expand-cars-to-ymmt.mjs [--dry-run] [--limit N]
 * 
 * Options:
 *   --dry-run  Preview changes without inserting
 *   --limit N  Only process N cars (for testing)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CURRENT_YEAR = new Date().getFullYear();
const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.indexOf('--limit');
const LIMIT = LIMIT_ARG !== -1 ? parseInt(process.argv[LIMIT_ARG + 1]) : null;

/**
 * Parse a year string into an array of individual years
 * Handles: "2015-2020", "2024-present", "1969", "2020-2024"
 */
function parseYearRange(yearsStr) {
  if (!yearsStr) return [];
  
  const years = [];
  const cleanStr = yearsStr.trim().toLowerCase();
  
  // Handle "present" keyword
  const normalized = cleanStr.replace('present', CURRENT_YEAR.toString());
  
  // Check if it's a range (contains dash)
  if (normalized.includes('-')) {
    const parts = normalized.split('-').map(p => parseInt(p.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const [start, end] = parts;
      // Validate reasonable year range
      if (start >= 1960 && start <= CURRENT_YEAR + 2 && 
          end >= start && end <= CURRENT_YEAR + 2) {
        for (let y = start; y <= end; y++) {
          years.push(y);
        }
      }
    }
  } else {
    // Single year
    const year = parseInt(normalized);
    if (!isNaN(year) && year >= 1960 && year <= CURRENT_YEAR + 2) {
      years.push(year);
    }
  }
  
  return years;
}

/**
 * Generate a slug for a year-specific car
 */
function generateYearSlug(originalSlug, year) {
  // Prepend year to existing slug
  return `${year}-${originalSlug}`;
}

/**
 * Generate a display name for a year-specific car
 */
function generateYearName(brand, model, trim, year) {
  const parts = [year, brand];
  
  // Add model if it doesn't already contain brand
  if (model && !model.toLowerCase().includes(brand?.toLowerCase() || '')) {
    parts.push(model);
  } else if (model) {
    parts.push(model);
  }
  
  // Add trim if not "Standard"
  if (trim && trim !== 'Standard') {
    parts.push(trim);
  }
  
  return parts.filter(Boolean).join(' ');
}

/**
 * Create v2 records from a v1 car
 */
function createV2Records(v1Car) {
  const years = parseYearRange(v1Car.years);
  
  if (years.length === 0) {
    console.warn(`  ⚠️ Could not parse years: "${v1Car.years}" for ${v1Car.name}`);
    return [];
  }
  
  return years.map(year => ({
    // New fields for v2
    slug: generateYearSlug(v1Car.slug, year),
    name: generateYearName(v1Car.brand, v1Car.model, v1Car.trim, year),
    year: year,
    years: year.toString(),
    structure_version: 'v2',
    parent_car_id: v1Car.id,
    is_selectable: true,
    
    // Inherited from v1 parent
    brand: v1Car.brand,
    model: v1Car.model,
    trim: v1Car.trim,
    tier: v1Car.tier,
    category: v1Car.category,
    country: v1Car.country,
    vehicle_type: v1Car.vehicle_type,
    
    // Specs (inherited, can be updated later with year-specific data)
    engine: v1Car.engine,
    hp: v1Car.hp,
    torque: v1Car.torque,
    trans: v1Car.trans,
    drivetrain: v1Car.drivetrain,
    curb_weight: v1Car.curb_weight,
    zero_to_sixty: v1Car.zero_to_sixty,
    top_speed: v1Car.top_speed,
    quarter_mile: v1Car.quarter_mile,
    braking_60_0: v1Car.braking_60_0,
    lateral_g: v1Car.lateral_g,
    layout: v1Car.layout,
    manual_available: v1Car.manual_available,
    seats: v1Car.seats,
    fuel_economy_combined: v1Car.fuel_economy_combined,
    
    // Pricing (will need year-specific updates)
    price_range: v1Car.price_range,
    price_avg: v1Car.price_avg,
    msrp_new_low: v1Car.msrp_new_low,
    msrp_new_high: v1Car.msrp_new_high,
    
    // Scores (inherited from parent)
    score_sound: v1Car.score_sound,
    score_interior: v1Car.score_interior,
    score_track: v1Car.score_track,
    score_reliability: v1Car.score_reliability,
    score_value: v1Car.score_value,
    score_driver_fun: v1Car.score_driver_fun,
    score_aftermarket: v1Car.score_aftermarket,
    
    // Performance scores (inherited)
    perf_power_accel: v1Car.perf_power_accel,
    perf_grip_cornering: v1Car.perf_grip_cornering,
    perf_braking: v1Car.perf_braking,
    perf_track_pace: v1Car.perf_track_pace,
    perf_drivability: v1Car.perf_drivability,
    perf_reliability_heat: v1Car.perf_reliability_heat,
    perf_sound_emotion: v1Car.perf_sound_emotion,
    
    // Content (inherited - points back to parent)
    notes: v1Car.notes,
    highlight: v1Car.highlight,
    tagline: v1Car.tagline,
    hero_blurb: v1Car.hero_blurb,
    
    // Daily driver fields
    daily_usability_tag: v1Car.daily_usability_tag,
    maintenance_cost_index: v1Car.maintenance_cost_index,
    insurance_cost_index: v1Car.insurance_cost_index,
    
    // Arrays/JSON (inherited)
    pros: v1Car.pros,
    cons: v1Car.cons,
    best_for: v1Car.best_for,
    common_issues: v1Car.common_issues,
    defining_strengths: v1Car.defining_strengths,
    honest_weaknesses: v1Car.honest_weaknesses,
    
    // Media (inherited)
    image_hero_url: v1Car.image_hero_url,
    image_gallery: v1Car.image_gallery,
    video_url: v1Car.video_url,
  }));
}

async function fetchV1Cars() {
  let query = supabase
    .from('cars')
    .select('*')
    .eq('structure_version', 'v1')
    .order('brand', { ascending: true })
    .order('model', { ascending: true });
  
  if (LIMIT) {
    query = query.limit(LIMIT);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching v1 cars:', error);
    process.exit(1);
  }
  
  return data;
}

async function insertV2Cars(v2Cars) {
  // Insert in batches of 50 to avoid timeout
  const BATCH_SIZE = 50;
  let inserted = 0;
  let errors = 0;
  
  for (let i = 0; i < v2Cars.length; i += BATCH_SIZE) {
    const batch = v2Cars.slice(i, i + BATCH_SIZE);
    
    const { data, error } = await supabase
      .from('cars')
      .insert(batch)
      .select('id');
    
    if (error) {
      console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
      errors += batch.length;
    } else {
      inserted += data.length;
    }
    
    // Progress indicator
    process.stdout.write(`\r  Inserted ${inserted}/${v2Cars.length} records...`);
  }
  
  console.log(''); // New line after progress
  return { inserted, errors };
}

async function markV1AsNonSelectable(v1Ids) {
  const { error } = await supabase
    .from('cars')
    .update({ is_selectable: false })
    .in('id', v1Ids);
  
  if (error) {
    console.error('Error marking v1 cars as non-selectable:', error);
    return false;
  }
  
  return true;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║             EXPAND v1 CARS TO v2 YMMT RECORDS                                ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  // Fetch v1 cars
  console.log('📥 Fetching v1 car records...');
  const v1Cars = await fetchV1Cars();
  console.log(`   Found ${v1Cars.length} v1 cars to expand\n`);
  
  // Generate v2 records
  console.log('🔄 Generating v2 year-specific records...');
  const allV2Records = [];
  const v1ToExpand = [];
  const stats = {
    totalYears: 0,
    skipped: 0,
    byBrand: {}
  };
  
  for (const v1Car of v1Cars) {
    const v2Records = createV2Records(v1Car);
    
    if (v2Records.length > 0) {
      allV2Records.push(...v2Records);
      v1ToExpand.push(v1Car.id);
      stats.totalYears += v2Records.length;
      
      // Track by brand
      const brand = v1Car.brand || 'Unknown';
      stats.byBrand[brand] = (stats.byBrand[brand] || 0) + v2Records.length;
      
      console.log(`   ✓ ${v1Car.name} (${v1Car.years}) → ${v2Records.length} years`);
    } else {
      stats.skipped++;
      console.log(`   ⚠️ ${v1Car.name} - Could not parse years: "${v1Car.years}"`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   v1 records processed: ${v1Cars.length}`);
  console.log(`   v2 records to create: ${allV2Records.length}`);
  console.log(`   Skipped (unparseable): ${stats.skipped}`);
  console.log(`   Average years per car: ${(stats.totalYears / (v1Cars.length - stats.skipped)).toFixed(1)}`);
  
  console.log(`\n📈 Records by brand (top 10):`);
  const sortedBrands = Object.entries(stats.byBrand)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [brand, count] of sortedBrands) {
    console.log(`   ${brand}: ${count} v2 records`);
  }
  
  if (DRY_RUN) {
    console.log('\n✅ DRY RUN COMPLETE - No changes made');
    console.log('\nTo actually create records, run without --dry-run:');
    console.log('  node scripts/expand-cars-to-ymmt.mjs');
    return;
  }
  
  // Insert v2 records
  console.log('\n📤 Inserting v2 records...');
  const { inserted, errors } = await insertV2Cars(allV2Records);
  console.log(`   ✓ Inserted: ${inserted}`);
  if (errors > 0) {
    console.log(`   ✗ Errors: ${errors}`);
  }
  
  // Mark v1 records as non-selectable
  console.log('\n🔒 Marking v1 records as non-selectable for new users...');
  const marked = await markV1AsNonSelectable(v1ToExpand);
  if (marked) {
    console.log(`   ✓ Marked ${v1ToExpand.length} v1 records`);
  }
  
  // Final count
  const { data: finalCount } = await supabase
    .from('cars')
    .select('structure_version')
    .then(res => ({
      data: {
        v1: res.data.filter(c => c.structure_version === 'v1').length,
        v2: res.data.filter(c => c.structure_version === 'v2').length
      }
    }));
  
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                           EXPANSION COMPLETE                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log(`\n📊 Final Database State:`);
  console.log(`   v1 records (legacy): ${finalCount?.v1 || 'unknown'}`);
  console.log(`   v2 records (YMMT):   ${finalCount?.v2 || inserted}`);
  console.log(`   Total cars:          ${(finalCount?.v1 || 0) + (finalCount?.v2 || inserted)}`);
}

main().catch(console.error);
