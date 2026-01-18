#!/usr/bin/env node

/**
 * Full Vehicle Database Export
 * 
 * Creates a comprehensive CSV file with ALL data for ALL vehicles
 * for manual verification and audit purposes.
 * 
 * Usage: node scripts/export-full-vehicle-audit.mjs
 * Output: audit/vehicle_data_export_YYYY-MM-DD.csv
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Escape CSV value (handle commas, quotes, newlines)
 */
function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  // Convert objects/arrays to JSON string
  if (typeof value === 'object') {
    value = JSON.stringify(value);
  }
  
  // Convert to string
  value = String(value);
  
  // If contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    value = '"' + value.replace(/"/g, '""') + '"';
  }
  
  return value;
}

/**
 * Flatten JSONB array to count or first few items
 */
function flattenJsonArray(arr, maxItems = 3) {
  if (!arr || !Array.isArray(arr)) return '';
  if (arr.length === 0) return '(empty)';
  
  const items = arr.slice(0, maxItems).map(item => {
    if (typeof item === 'object') {
      return item.name || item.title || item.label || JSON.stringify(item).slice(0, 50);
    }
    return String(item);
  });
  
  const suffix = arr.length > maxItems ? ` (+${arr.length - maxItems} more)` : '';
  return items.join('; ') + suffix;
}

/**
 * Check if JSONB field has meaningful content
 */
function hasContent(value) {
  if (value === null || value === undefined) return 'MISSING';
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.length > 0 ? `✓ (${value.length} items)` : 'EMPTY';
    }
    const keys = Object.keys(value);
    return keys.length > 0 ? `✓ (${keys.length} keys)` : 'EMPTY';
  }
  if (typeof value === 'string') {
    return value.trim().length > 0 ? '✓' : 'EMPTY';
  }
  return value !== null ? '✓' : 'MISSING';
}

async function exportVehicleData() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('              FULL VEHICLE DATABASE EXPORT                      ');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Fetch all cars with tuning profiles
  const { data: cars, error } = await supabase
    .from('cars')
    .select(`
      *,
      car_tuning_profiles (*)
    `)
    .order('brand')
    .order('name');
  
  if (error) {
    console.error('Error fetching cars:', error);
    process.exit(1);
  }
  
  console.log(`Fetched ${cars.length} vehicles\n`);
  
  // Fetch related data counts
  const { data: issueCounts } = await supabase
    .from('car_issues')
    .select('car_id')
    .then(res => ({
      data: res.data?.reduce((acc, row) => {
        acc[row.car_id] = (acc[row.car_id] || 0) + 1;
        return acc;
      }, {})
    }));
  
  const { data: partCounts } = await supabase
    .from('part_fitments')
    .select('car_id')
    .then(res => ({
      data: res.data?.reduce((acc, row) => {
        acc[row.car_id] = (acc[row.car_id] || 0) + 1;
        return acc;
      }, {})
    }));
  
  const { data: videoCounts } = await supabase
    .from('youtube_video_car_links')
    .select('car_id')
    .then(res => ({
      data: res.data?.reduce((acc, row) => {
        acc[row.car_id] = (acc[row.car_id] || 0) + 1;
        return acc;
      }, {})
    }));
  
  // Define columns for the export (organized by category)
  const columns = [
    // === IDENTIFICATION ===
    { key: 'id', label: 'CAR_ID' },
    { key: 'slug', label: 'SLUG' },
    { key: 'name', label: 'NAME' },
    { key: 'brand', label: 'BRAND' },
    { key: 'years', label: 'YEARS' },
    { key: 'generation_code', label: 'GENERATION_CODE' },
    { key: 'category', label: 'CATEGORY' },
    { key: 'vehicle_type', label: 'VEHICLE_TYPE' },
    { key: 'tier', label: 'TIER' },
    { key: 'country', label: 'COUNTRY' },
    
    // === CORE SPECS ===
    { key: 'engine', label: 'ENGINE' },
    { key: 'hp', label: 'HP' },
    { key: 'torque', label: 'TORQUE' },
    { key: 'trans', label: 'TRANSMISSION' },
    { key: 'drivetrain', label: 'DRIVETRAIN' },
    { key: 'layout', label: 'LAYOUT' },
    { key: 'curb_weight', label: 'CURB_WEIGHT' },
    { key: 'seats', label: 'SEATS' },
    { key: 'manual_available', label: 'MANUAL_AVAILABLE' },
    
    // === PERFORMANCE NUMBERS ===
    { key: 'zero_to_sixty', label: '0-60_MPH' },
    { key: 'quarter_mile', label: 'QUARTER_MILE' },
    { key: 'top_speed', label: 'TOP_SPEED' },
    { key: 'braking_60_0', label: 'BRAKING_60-0' },
    { key: 'lateral_g', label: 'LATERAL_G' },
    
    // === PRICING ===
    { key: 'price_range', label: 'PRICE_RANGE' },
    { key: 'price_avg', label: 'PRICE_AVG' },
    { key: 'msrp_new_low', label: 'MSRP_NEW_LOW' },
    { key: 'msrp_new_high', label: 'MSRP_NEW_HIGH' },
    
    // === SCORES ===
    { key: 'score_sound', label: 'SCORE_SOUND' },
    { key: 'score_interior', label: 'SCORE_INTERIOR' },
    { key: 'score_track', label: 'SCORE_TRACK' },
    { key: 'score_reliability', label: 'SCORE_RELIABILITY' },
    { key: 'score_value', label: 'SCORE_VALUE' },
    { key: 'score_driver_fun', label: 'SCORE_DRIVER_FUN' },
    { key: 'score_aftermarket', label: 'SCORE_AFTERMARKET' },
    
    // === PERFORMANCE SCORES ===
    { key: 'perf_power_accel', label: 'PERF_POWER_ACCEL' },
    { key: 'perf_grip_cornering', label: 'PERF_GRIP_CORNERING' },
    { key: 'perf_braking', label: 'PERF_BRAKING' },
    { key: 'perf_track_pace', label: 'PERF_TRACK_PACE' },
    { key: 'perf_drivability', label: 'PERF_DRIVABILITY' },
    { key: 'perf_reliability_heat', label: 'PERF_RELIABILITY_HEAT' },
    { key: 'perf_sound_emotion', label: 'PERF_SOUND_EMOTION' },
    
    // === OWNERSHIP ===
    { key: 'daily_usability_tag', label: 'DAILY_USABILITY_TAG' },
    { key: 'maintenance_cost_index', label: 'MAINTENANCE_COST_INDEX' },
    { key: 'insurance_cost_index', label: 'INSURANCE_COST_INDEX' },
    { key: 'fuel_economy_combined', label: 'FUEL_ECONOMY' },
    { key: 'platform_cost_tier', label: 'PLATFORM_COST_TIER' },
    { key: 'parts_availability', label: 'PARTS_AVAILABILITY' },
    { key: 'diy_friendliness', label: 'DIY_FRIENDLINESS' },
    
    // === TEXTUAL CONTENT ===
    { key: 'tagline', label: 'TAGLINE', check: true },
    { key: 'highlight', label: 'HIGHLIGHT', check: true },
    { key: 'hero_blurb', label: 'HERO_BLURB', check: true },
    { key: 'notes', label: 'NOTES', check: true },
    { key: 'essence', label: 'ESSENCE', check: true },
    { key: 'heritage', label: 'HERITAGE', check: true },
    { key: 'design_philosophy', label: 'DESIGN_PHILOSOPHY', check: true },
    { key: 'motorsport_history', label: 'MOTORSPORT_HISTORY', check: true },
    { key: 'engine_character', label: 'ENGINE_CHARACTER', check: true },
    { key: 'transmission_feel', label: 'TRANSMISSION_FEEL', check: true },
    { key: 'chassis_dynamics', label: 'CHASSIS_DYNAMICS', check: true },
    { key: 'steering_feel', label: 'STEERING_FEEL', check: true },
    { key: 'sound_signature', label: 'SOUND_SIGNATURE', check: true },
    { key: 'ideal_owner', label: 'IDEAL_OWNER', check: true },
    { key: 'buyers_summary', label: 'BUYERS_SUMMARY', check: true },
    { key: 'market_commentary', label: 'MARKET_COMMENTARY', check: true },
    
    // === JSONB ARRAYS (status check) ===
    { key: 'pros', label: 'PROS_STATUS', check: true },
    { key: 'cons', label: 'CONS_STATUS', check: true },
    { key: 'best_for', label: 'BEST_FOR_STATUS', check: true },
    { key: 'common_issues', label: 'COMMON_ISSUES_STATUS', check: true },
    { key: 'defining_strengths', label: 'DEFINING_STRENGTHS_STATUS', check: true },
    { key: 'honest_weaknesses', label: 'HONEST_WEAKNESSES_STATUS', check: true },
    { key: 'best_years_detailed', label: 'BEST_YEARS_STATUS', check: true },
    { key: 'years_to_avoid_detailed', label: 'YEARS_TO_AVOID_STATUS', check: true },
    { key: 'must_have_options', label: 'MUST_HAVE_OPTIONS_STATUS', check: true },
    { key: 'pre_inspection_checklist', label: 'PRE_INSPECTION_STATUS', check: true },
    { key: 'price_guide', label: 'PRICE_GUIDE_STATUS', check: true },
    { key: 'common_issues_detailed', label: 'COMMON_ISSUES_DETAILED_STATUS', check: true },
    { key: 'direct_competitors', label: 'DIRECT_COMPETITORS_STATUS', check: true },
    { key: 'key_resources', label: 'KEY_RESOURCES_STATUS', check: true },
    
    // === MEDIA ===
    { key: 'image_hero_url', label: 'HAS_HERO_IMAGE', check: true },
    { key: 'image_gallery', label: 'GALLERY_STATUS', check: true },
    { key: 'video_url', label: 'HAS_VIDEO', check: true },
    
    // === TUNING PROFILE DATA ===
    { key: 'tuning_engine_family', label: 'TUNING_ENGINE_FAMILY' },
    { key: 'tuning_stock_whp', label: 'TUNING_STOCK_WHP' },
    { key: 'tuning_stock_wtq', label: 'TUNING_STOCK_WTQ' },
    { key: 'tuning_data_quality', label: 'TUNING_DATA_QUALITY_TIER' },
    { key: 'tuning_verified', label: 'TUNING_VERIFIED' },
    { key: 'tuning_stage_progressions', label: 'TUNING_STAGES_STATUS', check: true },
    { key: 'tuning_platforms', label: 'TUNING_PLATFORMS_STATUS', check: true },
    { key: 'tuning_power_limits', label: 'TUNING_POWER_LIMITS_STATUS', check: true },
    { key: 'tuning_upgrades', label: 'TUNING_UPGRADES_STATUS', check: true },
    { key: 'tuning_insights', label: 'TUNING_INSIGHTS_STATUS', check: true },
    
    // === RELATED DATA COUNTS ===
    { key: 'issues_count', label: 'ISSUES_COUNT' },
    { key: 'parts_count', label: 'PARTS_COUNT' },
    { key: 'videos_count', label: 'VIDEOS_COUNT' },
    
    // === VALIDATION FLAGS ===
    { key: 'whp_validation', label: 'WHP_VALIDATION' },
    { key: 'engine_match', label: 'ENGINE_FAMILY_MATCH' },
  ];
  
  // Build rows
  const rows = cars.map(car => {
    const tuning = car.car_tuning_profiles?.[0] || {};
    const issueCount = issueCounts?.[car.id] || 0;
    const partCount = partCounts?.[car.id] || 0;
    const videoCount = videoCounts?.[car.id] || 0;
    
    // Calculate expected WHP
    const expectedWhp = car.hp ? Math.round(car.hp * 0.85) : null;
    const whpDiff = tuning.stock_whp && expectedWhp 
      ? Math.abs(tuning.stock_whp - expectedWhp) 
      : null;
    const whpValid = whpDiff === null ? 'N/A' 
      : whpDiff > (car.hp * 0.25) ? '❌ CRITICAL MISMATCH'
      : whpDiff > (car.hp * 0.15) ? '⚠️ CHECK' 
      : '✓ OK';
    
    // Check engine family match
    const engineMatch = !tuning.engine_family ? 'N/A'
      : car.engine?.toLowerCase().includes('v8') && tuning.engine_family?.toLowerCase().includes('v6') ? '❌ V8→V6 MISMATCH'
      : car.engine?.toLowerCase().includes('v6') && tuning.engine_family?.toLowerCase().includes('v8') ? '❌ V6→V8 MISMATCH'
      : car.engine?.toLowerCase().includes('electric') && !tuning.engine_family?.toLowerCase().includes('electric') ? '❌ EV MISMATCH'
      : '✓ CHECK MANUALLY';
    
    const row = {};
    
    for (const col of columns) {
      let value;
      
      // Special handling for different column types
      if (col.key.startsWith('tuning_')) {
        const tuningKey = col.key.replace('tuning_', '');
        if (tuningKey === 'engine_family') value = tuning.engine_family;
        else if (tuningKey === 'stock_whp') value = tuning.stock_whp;
        else if (tuningKey === 'stock_wtq') value = tuning.stock_wtq;
        else if (tuningKey === 'data_quality') value = tuning.data_quality_tier;
        else if (tuningKey === 'verified') value = tuning.verified;
        else if (tuningKey === 'stage_progressions') value = hasContent(tuning.stage_progressions);
        else if (tuningKey === 'platforms') value = hasContent(tuning.tuning_platforms);
        else if (tuningKey === 'power_limits') value = hasContent(tuning.power_limits);
        else if (tuningKey === 'upgrades') value = hasContent(tuning.upgrades_by_objective);
        else if (tuningKey === 'insights') value = hasContent(tuning.platform_insights);
      } else if (col.key === 'issues_count') {
        value = issueCount;
      } else if (col.key === 'parts_count') {
        value = partCount;
      } else if (col.key === 'videos_count') {
        value = videoCount;
      } else if (col.key === 'whp_validation') {
        value = whpValid;
      } else if (col.key === 'engine_match') {
        value = engineMatch;
      } else if (col.check) {
        value = hasContent(car[col.key]);
      } else {
        value = car[col.key];
      }
      
      row[col.label] = value;
    }
    
    return row;
  });
  
  // Create CSV
  const headers = columns.map(c => c.label);
  const csvLines = [
    headers.join(','),
    ...rows.map(row => headers.map(h => escapeCSV(row[h])).join(','))
  ];
  
  const csv = csvLines.join('\n');
  
  // Write to file
  const auditDir = join(__dirname, '..', 'audit');
  if (!existsSync(auditDir)) {
    mkdirSync(auditDir, { recursive: true });
  }
  
  const date = new Date().toISOString().split('T')[0];
  const filename = `vehicle_data_export_${date}.csv`;
  const filepath = join(auditDir, filename);
  
  writeFileSync(filepath, csv, 'utf8');
  
  console.log(`✅ Export complete: ${filepath}`);
  console.log(`   ${cars.length} vehicles exported`);
  console.log(`   ${headers.length} columns per vehicle`);
  
  // Also create a summary of issues
  const summaryLines = [
    '═══════════════════════════════════════════════════════════════',
    '                    DATA QUALITY SUMMARY                        ',
    '═══════════════════════════════════════════════════════════════',
    '',
    `Total Vehicles: ${cars.length}`,
    '',
    'MISSING CORE DATA:',
  ];
  
  const missingCounts = {};
  const criticalFields = ['hp', 'engine', 'trans', 'drivetrain', 'seats', 'zero_to_sixty', 'curb_weight', 'price_avg'];
  
  for (const field of criticalFields) {
    const missing = cars.filter(c => c[field] === null || c[field] === undefined || c[field] === '');
    missingCounts[field] = missing.length;
    if (missing.length > 0) {
      summaryLines.push(`  ${field}: ${missing.length} vehicles missing`);
    }
  }
  
  summaryLines.push('');
  summaryLines.push('TUNING DATA STATUS:');
  
  const tuningStats = {
    skeleton: 0,
    templated: 0,
    enriched: 0,
    researched: 0,
    verified: 0,
    missing: 0,
  };
  
  for (const car of cars) {
    const tier = car.car_tuning_profiles?.[0]?.data_quality_tier || 'missing';
    tuningStats[tier] = (tuningStats[tier] || 0) + 1;
  }
  
  for (const [tier, count] of Object.entries(tuningStats)) {
    summaryLines.push(`  ${tier}: ${count} vehicles`);
  }
  
  const summaryFilepath = join(auditDir, `vehicle_data_summary_${date}.txt`);
  writeFileSync(summaryFilepath, summaryLines.join('\n'), 'utf8');
  
  console.log(`\n✅ Summary: ${summaryFilepath}`);
  
  return { filepath, cars: cars.length, columns: headers.length };
}

// Run export
exportVehicleData()
  .then(result => {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                      EXPORT COMPLETE                           ');
    console.log('═══════════════════════════════════════════════════════════════');
  })
  .catch(err => {
    console.error('Export failed:', err);
    process.exit(1);
  });
