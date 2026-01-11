#!/usr/bin/env node
/**
 * Comprehensive Vehicle Data Audit
 * 
 * Checks ALL car-related tables for every vehicle to identify data gaps.
 * 
 * Usage:
 *   node scripts/tuning-pipeline/audit-all-vehicles.mjs
 *   node scripts/tuning-pipeline/audit-all-vehicles.mjs --export
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';
import fs from 'fs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const { values } = parseArgs({
  options: {
    'export': { type: 'boolean', default: false },
  },
});

const exportResults = values['export'];

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              COMPREHENSIVE VEHICLE DATA AUDIT                                 ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Fetching all data... (this may take a moment)');
  console.log('');

  // Fetch all cars
  const { data: cars, error: carsError } = await supabase
    .from('cars')
    .select('id, slug, name, brand, category, hp, torque, score_sound, score_track, image_hero_url')
    .order('name');

  if (carsError) {
    console.error('Failed to fetch cars:', carsError.message);
    process.exit(1);
  }

  console.log(`Found ${cars.length} vehicles in database`);
  console.log('');

  // Fetch all related data in bulk (more efficient than per-car queries)
  const [
    tuningProfiles,
    issues,
    maintenanceSpecs,
    serviceIntervals,
    fuelEconomy,
    safetyData,
    recalls,
    variants,
    youtubeLinks,
    communityInsights,
    dynoRuns,
    lapTimes,
    marketPricing,
    documentChunks
  ] = await Promise.all([
    supabase.from('car_tuning_profiles').select('car_id, data_quality_tier, upgrades_by_objective, stage_progressions'),
    supabase.from('car_issues').select('car_id'),
    supabase.from('vehicle_maintenance_specs').select('car_id'),
    supabase.from('vehicle_service_intervals').select('car_id'),
    supabase.from('car_fuel_economy').select('car_id'),
    supabase.from('car_safety_data').select('car_id'),
    supabase.from('car_recalls').select('car_id'),
    supabase.from('car_variants').select('car_id'),
    supabase.from('youtube_video_car_links').select('car_id'),
    supabase.from('community_insights').select('car_id'),
    supabase.from('car_dyno_runs').select('car_id'),
    supabase.from('car_track_lap_times').select('car_id'),
    supabase.from('car_market_pricing').select('car_id'),
    supabase.from('document_chunks').select('car_id'),
  ]);

  // Build lookup maps for efficient checking
  const buildCountMap = (data) => {
    const map = new Map();
    (data.data || []).forEach(row => {
      if (row.car_id) {
        map.set(row.car_id, (map.get(row.car_id) || 0) + 1);
      }
    });
    return map;
  };

  const tuningMap = new Map();
  (tuningProfiles.data || []).forEach(p => {
    const objectives = p.upgrades_by_objective || {};
    const totalUpgrades = Object.values(objectives).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    tuningMap.set(p.car_id, {
      tier: p.data_quality_tier || 'unknown',
      upgrades: totalUpgrades,
      stages: p.stage_progressions?.length || 0
    });
  });

  const issuesMap = buildCountMap(issues);
  const maintenanceMap = buildCountMap(maintenanceSpecs);
  const intervalsMap = buildCountMap(serviceIntervals);
  const fuelMap = buildCountMap(fuelEconomy);
  const safetyMap = buildCountMap(safetyData);
  const recallsMap = buildCountMap(recalls);
  const variantsMap = buildCountMap(variants);
  const youtubeMap = buildCountMap(youtubeLinks);
  const insightsMap = buildCountMap(communityInsights);
  const dynoMap = buildCountMap(dynoRuns);
  const lapMap = buildCountMap(lapTimes);
  const pricingMap = buildCountMap(marketPricing);
  const chunksMap = buildCountMap(documentChunks);

  // Analyze each car
  const results = [];
  const gaps = {
    noTuningProfile: [],
    noUpgrades: [],
    skeletonTier: [],
    templatedTier: [],
    noIssues: [],
    noMaintenance: [],
    noIntervals: [],
    noFuelEconomy: [],
    noSafety: [],
    noRecalls: [],
    noYoutube: [],
    noCommunityInsights: [],
    noSpecs: [],
    noScores: [],
    noImage: [],
  };

  for (const car of cars) {
    const tuning = tuningMap.get(car.id);
    const hasSpecs = car.hp != null && car.torque != null;
    const hasScores = car.score_sound != null;
    const hasImage = car.image_hero_url != null;

    const carResult = {
      slug: car.slug,
      name: car.name,
      brand: car.brand,
      category: car.category,
      hasSpecs,
      hasScores,
      hasImage,
      tuningTier: tuning?.tier || 'none',
      tuningUpgrades: tuning?.upgrades || 0,
      issues: issuesMap.get(car.id) || 0,
      maintenance: maintenanceMap.get(car.id) || 0,
      intervals: intervalsMap.get(car.id) || 0,
      fuelEconomy: fuelMap.get(car.id) || 0,
      safety: safetyMap.get(car.id) || 0,
      recalls: recallsMap.get(car.id) || 0,
      variants: variantsMap.get(car.id) || 0,
      youtube: youtubeMap.get(car.id) || 0,
      insights: insightsMap.get(car.id) || 0,
      dyno: dynoMap.get(car.id) || 0,
      lapTimes: lapMap.get(car.id) || 0,
      pricing: pricingMap.get(car.id) || 0,
      chunks: chunksMap.get(car.id) || 0,
    };

    results.push(carResult);

    // Track gaps
    if (!tuning) gaps.noTuningProfile.push(car);
    else if (tuning.upgrades === 0) gaps.noUpgrades.push(car);
    else if (tuning.tier === 'skeleton') gaps.skeletonTier.push(car);
    else if (tuning.tier === 'templated') gaps.templatedTier.push(car);
    
    if (carResult.issues === 0) gaps.noIssues.push(car);
    if (carResult.maintenance === 0) gaps.noMaintenance.push(car);
    if (carResult.intervals === 0) gaps.noIntervals.push(car);
    if (carResult.fuelEconomy === 0) gaps.noFuelEconomy.push(car);
    if (carResult.safety === 0) gaps.noSafety.push(car);
    if (carResult.recalls === 0) gaps.noRecalls.push(car);
    if (carResult.youtube === 0) gaps.noYoutube.push(car);
    if (carResult.insights === 0) gaps.noCommunityInsights.push(car);
    if (!hasSpecs) gaps.noSpecs.push(car);
    if (!hasScores) gaps.noScores.push(car);
    if (!hasImage) gaps.noImage.push(car);
  }

  // Calculate needs enhancement (comprehensive definition)
  const needsEnhancement = results.filter(r => 
    r.tuningUpgrades === 0 || 
    r.tuningTier === 'skeleton' ||
    r.issues === 0 ||
    r.maintenance === 0 ||
    r.intervals === 0
  );

  const needsTuningOnly = results.filter(r => 
    r.tuningUpgrades === 0 || r.tuningTier === 'skeleton'
  );

  // Print summary
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('CORE DATA COVERAGE');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`   Total Vehicles:                 ${cars.length}`);
  console.log('');
  console.log('   📊 CAR BASICS');
  console.log(`      With specs (hp/torque):      ${cars.length - gaps.noSpecs.length}/${cars.length} (${Math.round((cars.length - gaps.noSpecs.length) / cars.length * 100)}%)`);
  console.log(`      With scores:                 ${cars.length - gaps.noScores.length}/${cars.length} (${Math.round((cars.length - gaps.noScores.length) / cars.length * 100)}%)`);
  console.log(`      With hero image:             ${cars.length - gaps.noImage.length}/${cars.length} (${Math.round((cars.length - gaps.noImage.length) / cars.length * 100)}%)`);
  console.log('');
  console.log('   🔧 TUNING PROFILES');
  console.log(`      Has tuning profile:          ${cars.length - gaps.noTuningProfile.length}/${cars.length}`);
  console.log(`      With upgrades_by_objective:  ${cars.length - gaps.noUpgrades.length - gaps.noTuningProfile.length}/${cars.length} (${Math.round((cars.length - gaps.noUpgrades.length - gaps.noTuningProfile.length) / cars.length * 100)}%)`);
  console.log(`      Skeleton tier:               ${gaps.skeletonTier.length}`);
  console.log(`      Templated tier:              ${gaps.templatedTier.length}`);
  console.log('');
  console.log('   🛠️ MAINTENANCE DATA');
  console.log(`      With known issues:           ${cars.length - gaps.noIssues.length}/${cars.length} (${Math.round((cars.length - gaps.noIssues.length) / cars.length * 100)}%)`);
  console.log(`      With maintenance specs:      ${cars.length - gaps.noMaintenance.length}/${cars.length} (${Math.round((cars.length - gaps.noMaintenance.length) / cars.length * 100)}%)`);
  console.log(`      With service intervals:      ${cars.length - gaps.noIntervals.length}/${cars.length} (${Math.round((cars.length - gaps.noIntervals.length) / cars.length * 100)}%)`);
  console.log('');
  console.log('   📋 REGULATORY DATA');
  console.log(`      With fuel economy (EPA):     ${cars.length - gaps.noFuelEconomy.length}/${cars.length} (${Math.round((cars.length - gaps.noFuelEconomy.length) / cars.length * 100)}%)`);
  console.log(`      With safety data (NHTSA):    ${cars.length - gaps.noSafety.length}/${cars.length} (${Math.round((cars.length - gaps.noSafety.length) / cars.length * 100)}%)`);
  console.log(`      With recalls:                ${cars.length - gaps.noRecalls.length}/${cars.length} (${Math.round((cars.length - gaps.noRecalls.length) / cars.length * 100)}%)`);
  console.log('');
  console.log('   📺 CONTENT DATA');
  console.log(`      With YouTube links:          ${cars.length - gaps.noYoutube.length}/${cars.length} (${Math.round((cars.length - gaps.noYoutube.length) / cars.length * 100)}%)`);
  console.log(`      With community insights:     ${cars.length - gaps.noCommunityInsights.length}/${cars.length} (${Math.round((cars.length - gaps.noCommunityInsights.length) / cars.length * 100)}%)`);
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('ENHANCEMENT NEEDS');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`   🔴 Need TUNING enhancement:        ${needsTuningOnly.length} vehicles`);
  console.log(`      (0 upgrades or skeleton tier)`);
  console.log('');
  console.log(`   🟠 Need ANY core data:             ${needsEnhancement.length} vehicles`);
  console.log(`      (tuning + issues + maintenance + intervals)`);
  console.log('');

  // Break down by brand
  const brandGaps = {};
  needsTuningOnly.forEach(r => {
    const brand = r.brand || 'Unknown';
    brandGaps[brand] = (brandGaps[brand] || 0) + 1;
  });

  console.log('   By Brand (needing tuning):');
  Object.entries(brandGaps)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([brand, count]) => {
      console.log(`      ${brand.padEnd(20)} ${count}`);
    });

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('TOP 20 VEHICLES NEEDING TUNING ENHANCEMENT');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');

  needsTuningOnly.slice(0, 20).forEach((r, i) => {
    console.log(`   ${(i + 1).toString().padStart(2)}. ${r.name}`);
    console.log(`       Tier: ${r.tuningTier}, Upgrades: ${r.tuningUpgrades}, Issues: ${r.issues}`);
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('RECOMMENDED ACTIONS');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`   1. Enhance ${needsTuningOnly.length} vehicles with tuning data:`);
  console.log('      node scripts/tuning-pipeline/enhance-existing-vehicles.mjs --batch needs-enhancement');
  console.log('');
  if (gaps.noMaintenance.length > 0) {
    console.log(`   2. ${gaps.noMaintenance.length} vehicles missing maintenance specs`);
    console.log('      (May need to re-run car pipeline or add manually)');
    console.log('');
  }
  if (gaps.noIssues.length > 0) {
    console.log(`   3. ${gaps.noIssues.length} vehicles missing known issues`);
    console.log('      (May need to re-run car pipeline)');
    console.log('');
  }

  // Export if requested
  if (exportResults) {
    const exportData = {
      summary: {
        totalVehicles: cars.length,
        needsTuning: needsTuningOnly.length,
        needsAnyCore: needsEnhancement.length,
        gaps: {
          noTuningProfile: gaps.noTuningProfile.length,
          noUpgrades: gaps.noUpgrades.length,
          skeletonTier: gaps.skeletonTier.length,
          templatedTier: gaps.templatedTier.length,
          noIssues: gaps.noIssues.length,
          noMaintenance: gaps.noMaintenance.length,
          noIntervals: gaps.noIntervals.length,
        }
      },
      vehiclesNeedingTuning: needsTuningOnly.map(r => ({
        slug: r.slug,
        name: r.name,
        tier: r.tuningTier,
        upgrades: r.tuningUpgrades
      })),
      allVehicles: results
    };

    const filename = `audit-results-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    console.log(`   📁 Results exported to: ${filename}`);
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════════════════════');
}

main().catch(console.error);
