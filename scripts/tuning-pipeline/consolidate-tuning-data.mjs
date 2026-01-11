#!/usr/bin/env node
/**
 * Consolidate Tuning Data - Merge all sources into objective-based structure
 * 
 * Reads from:
 * - data/carUpgradeRecommendations.js (static file)
 * - cars.upgrade_recommendations (database JSONB)
 * - car_tuning_profiles (existing stage data)
 * - youtube_videos (linked transcripts)
 * - cars.popular_track_mods (database)
 * 
 * Writes to:
 * - car_tuning_profiles.upgrades_by_objective
 * - car_tuning_profiles.platform_insights
 * - car_tuning_profiles.curated_packages
 * - car_tuning_profiles.data_quality_tier
 * 
 * Usage:
 *   node scripts/tuning-pipeline/consolidate-tuning-data.mjs
 *   node scripts/tuning-pipeline/consolidate-tuning-data.mjs --car-slug volkswagen-gti-mk7
 *   node scripts/tuning-pipeline/consolidate-tuning-data.mjs --dry-run
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

/**
 * Load carUpgradeRecommendations from JS file
 */
async function loadStaticRecommendations() {
  try {
    const module = await import(join(projectRoot, 'data', 'carUpgradeRecommendations.js'));
    return module.carUpgradeRecommendations || {};
  } catch (error) {
    console.log('Could not load carUpgradeRecommendations.js:', error.message);
    return {};
  }
}

/**
 * Convert tier-based recommendations to objective-based upgrades
 */
function convertTierToObjective(tierRecs, carName) {
  const objectives = {
    power: [],
    handling: [],
    braking: [],
    cooling: [],
    sound: [],
    aero: []
  };

  // Module name to objective mapping
  const moduleObjectiveMap = {
    // Power
    'cold-air-intake': 'power',
    'high-flow-air-filter': 'power',
    'cat-back-exhaust': 'power',
    'turbo-back-exhaust': 'power',
    'headers': 'power',
    'ecu-tune': 'power',
    'intercooler': 'power',
    'downpipe': 'power',
    'supercharger': 'power',
    'turbo-kit': 'power',
    'fuel-system': 'power',
    
    // Handling
    'coilovers': 'handling',
    'lowering-springs': 'handling',
    'sway-bars': 'handling',
    'strut-brace': 'handling',
    'performance-alignment': 'handling',
    'camber-arms': 'handling',
    'toe-arms': 'handling',
    'bushings': 'handling',
    'lightweight-wheels': 'handling',
    
    // Braking
    'brake-pads-performance': 'braking',
    'brake-pads-track': 'braking',
    'high-temp-brake-fluid': 'braking',
    'big-brake-kit': 'braking',
    'braided-brake-lines': 'braking',
    'brake-ducts': 'braking',
    
    // Cooling
    'oil-cooler': 'cooling',
    'radiator-upgrade': 'cooling',
    'intercooler': 'cooling', // Also cooling
    'transmission-cooler': 'cooling',
    
    // Sound
    'cat-back-exhaust': 'sound', // Also sound
    'resonator-delete': 'sound',
    'muffler-delete': 'sound',
    
    // Aero
    'front-splitter': 'aero',
    'rear-wing': 'aero',
    'diffuser': 'aero',
    'side-skirts': 'aero',
  };

  // Track which modules we've added to avoid duplicates
  const addedModules = new Set();

  // Process each tier
  const tiers = tierRecs.tiers || {};
  for (const [tierName, tierData] of Object.entries(tiers)) {
    const allModules = [
      ...(tierData.mustHave || []),
      ...(tierData.recommended || []),
      ...(tierData.niceToHave || [])
    ];

    for (const moduleName of allModules) {
      if (addedModules.has(moduleName)) continue;
      addedModules.add(moduleName);

      const objective = moduleObjectiveMap[moduleName] || 'power';
      
      // Create upgrade entry
      const upgrade = {
        name: moduleName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        module_key: moduleName,
        difficulty: tierData.mustHave?.includes(moduleName) ? 'essential' : 
                   tierData.recommended?.includes(moduleName) ? 'recommended' : 'optional',
        tier_source: tierName
      };

      objectives[objective].push(upgrade);
    }
  }

  return objectives;
}

/**
 * Convert cars.upgrade_recommendations to objective-based
 */
function convertDbRecsToObjective(dbRecs) {
  const objectives = {
    power: [],
    handling: [],
    braking: [],
    cooling: [],
    sound: [],
    aero: []
  };

  if (!dbRecs || !Array.isArray(dbRecs)) return objectives;

  // dbRecs format: [{ tier: "entry", items: [...], gains: "40-60 HP", cost: "$500-1500" }]
  for (const tierData of dbRecs) {
    const items = tierData.items || [];
    const gainsMatch = tierData.gains?.match(/(\d+)-?(\d+)?\s*HP/i);
    const costMatch = tierData.cost?.match(/\$(\d+[\d,]*)-?\$?(\d+[\d,]*)?/);

    for (const item of items) {
      const itemLower = item.toLowerCase();
      let objective = 'power';

      // Determine objective from item name
      if (/coilover|spring|sway|suspension|alignment/i.test(itemLower)) {
        objective = 'handling';
      } else if (/brake|rotor|caliper/i.test(itemLower)) {
        objective = 'braking';
      } else if (/cooler|radiator/i.test(itemLower)) {
        objective = 'cooling';
      } else if (/exhaust|muffler|resonator/i.test(itemLower)) {
        objective = 'sound';
      } else if (/wing|splitter|diffuser|aero/i.test(itemLower)) {
        objective = 'aero';
      }

      objectives[objective].push({
        name: item,
        tier: tierData.tier,
        gains: gainsMatch ? { hp: { low: parseInt(gainsMatch[1]), high: parseInt(gainsMatch[2] || gainsMatch[1]) } } : null,
        cost: costMatch ? { low: parseInt(costMatch[1].replace(/,/g, '')), high: parseInt((costMatch[2] || costMatch[1]).replace(/,/g, '')) } : null
      });
    }
  }

  return objectives;
}

/**
 * Convert stage_progressions to objective-based (primarily power)
 */
function convertStagesToObjective(stages) {
  const objectives = {
    power: []
  };

  if (!stages || !Array.isArray(stages)) return objectives;

  for (const stage of stages) {
    if (!stage.components) continue;

    for (const component of stage.components) {
      const upgrade = {
        name: component,
        stage_source: stage.stage,
        gains: stage.hpGainLow && stage.hpGainHigh ? {
          hp: { low: stage.hpGainLow, high: stage.hpGainHigh }
        } : null,
        cost: stage.costLow && stage.costHigh ? {
          low: stage.costLow,
          high: stage.costHigh
        } : null
      };
      objectives.power.push(upgrade);
    }
  }

  return objectives;
}

/**
 * Extract platform insights from YouTube videos
 */
async function extractYouTubeInsights(carId) {
  const { data: videos, error } = await supabase
    .from('youtube_videos')
    .select('id, title, summary, pros_mentioned, cons_mentioned, key_points, stock_strengths, stock_weaknesses')
    .eq('car_id', carId);

  if (error || !videos?.length) return null;

  const insights = {
    youtube_video_count: videos.length,
    pros: [],
    cons: [],
    key_points: [],
    strengths: [],
    weaknesses: []
  };

  for (const video of videos) {
    if (video.pros_mentioned) insights.pros.push(...video.pros_mentioned);
    if (video.cons_mentioned) insights.cons.push(...video.cons_mentioned);
    if (video.key_points) insights.key_points.push(...video.key_points);
    if (video.stock_strengths) insights.strengths.push(...video.stock_strengths);
    if (video.stock_weaknesses) insights.weaknesses.push(...video.stock_weaknesses);
  }

  // Dedupe
  insights.pros = [...new Set(insights.pros)].slice(0, 10);
  insights.cons = [...new Set(insights.cons)].slice(0, 10);
  insights.key_points = [...new Set(insights.key_points)].slice(0, 10);
  insights.strengths = [...new Set(insights.strengths)].slice(0, 5);
  insights.weaknesses = [...new Set(insights.weaknesses)].slice(0, 5);

  return insights;
}

/**
 * Merge multiple objective structures, deduping by name
 */
function mergeObjectives(...objectiveSets) {
  const merged = {
    power: [],
    handling: [],
    braking: [],
    cooling: [],
    sound: [],
    aero: []
  };

  const seenNames = {
    power: new Set(),
    handling: new Set(),
    braking: new Set(),
    cooling: new Set(),
    sound: new Set(),
    aero: new Set()
  };

  for (const objectives of objectiveSets) {
    if (!objectives) continue;
    
    for (const [key, upgrades] of Object.entries(objectives)) {
      if (!merged[key]) continue;
      
      for (const upgrade of upgrades) {
        const normalizedName = (upgrade.name || '').toLowerCase().trim();
        if (normalizedName && !seenNames[key].has(normalizedName)) {
          seenNames[key].add(normalizedName);
          merged[key].push(upgrade);
        }
      }
    }
  }

  return merged;
}

/**
 * Determine data quality tier based on sources
 */
function determineQualityTier(dataSources) {
  const { staticRecs, dbRecs, stageData, youtubeInsights } = dataSources;
  
  const hasStatic = staticRecs && Object.keys(staticRecs).length > 0;
  const hasDbRecs = dbRecs && dbRecs.length > 0;
  const hasStages = stageData && stageData.length > 0;
  const hasYoutube = youtubeInsights && youtubeInsights.youtube_video_count > 0;
  
  const sourceCount = [hasStatic, hasDbRecs, hasStages, hasYoutube].filter(Boolean).length;
  
  if (sourceCount >= 3) return 'researched';
  if (sourceCount === 2) return 'enriched';
  if (sourceCount === 1) return 'templated';
  return 'skeleton';
}

/**
 * Process a single car
 */
async function processCar(car, profile, staticRecommendations, dryRun) {
  const carSlug = car.slug;
  const carName = car.name;
  
  console.log(`\n📦 Processing: ${carName}`);
  
  // Gather data from all sources
  const dataSources = {
    staticRecs: null,
    dbRecs: null,
    stageData: null,
    youtubeInsights: null
  };
  
  // 1. Static file recommendations
  const staticRecs = staticRecommendations[carSlug];
  if (staticRecs) {
    dataSources.staticRecs = staticRecs;
    console.log('   ✓ Found static recommendations');
  }
  
  // 2. Database upgrade_recommendations
  const dbRecs = car.upgrade_recommendations;
  if (dbRecs && (Array.isArray(dbRecs) ? dbRecs.length > 0 : Object.keys(dbRecs).length > 0)) {
    dataSources.dbRecs = dbRecs;
    console.log('   ✓ Found DB upgrade_recommendations');
  }
  
  // 3. Existing stage_progressions
  const stageData = profile?.stage_progressions;
  if (stageData && stageData.length > 0) {
    dataSources.stageData = stageData;
    console.log('   ✓ Found existing stage data');
  }
  
  // 4. YouTube insights
  const youtubeInsights = await extractYouTubeInsights(car.id);
  if (youtubeInsights && youtubeInsights.youtube_video_count > 0) {
    dataSources.youtubeInsights = youtubeInsights;
    console.log(`   ✓ Found ${youtubeInsights.youtube_video_count} YouTube videos`);
  }
  
  // Convert each source to objective-based structure
  const objectives1 = staticRecs ? convertTierToObjective(staticRecs, carName) : null;
  const objectives2 = dbRecs ? convertDbRecsToObjective(dbRecs) : null;
  const objectives3 = stageData ? convertStagesToObjective(stageData) : null;
  
  // Merge all objectives (priority: static > db > stages)
  const mergedObjectives = mergeObjectives(objectives1, objectives2, objectives3);
  
  // Build platform insights
  const platformInsights = {
    strengths: [],
    weaknesses: [],
    community_tips: [],
    youtube_insights: youtubeInsights || {}
  };
  
  // Add from static file
  if (staticRecs?.platformNotes) {
    platformInsights.strengths.push(...staticRecs.platformNotes);
  }
  if (staticRecs?.knownIssues) {
    platformInsights.weaknesses.push(...staticRecs.knownIssues);
  }
  
  // Add from YouTube
  if (youtubeInsights) {
    if (youtubeInsights.strengths) platformInsights.strengths.push(...youtubeInsights.strengths);
    if (youtubeInsights.weaknesses) platformInsights.weaknesses.push(...youtubeInsights.weaknesses);
  }
  
  // Dedupe
  platformInsights.strengths = [...new Set(platformInsights.strengths)].slice(0, 10);
  platformInsights.weaknesses = [...new Set(platformInsights.weaknesses)].slice(0, 10);
  
  // Determine quality tier
  const qualityTier = determineQualityTier(dataSources);
  console.log(`   Quality tier: ${qualityTier}`);
  
  // Build data sources tracking
  const dataSourcesTracking = {
    has_static_file: !!staticRecs,
    has_db_recommendations: !!dbRecs,
    has_stage_data: !!stageData,
    has_youtube: !!youtubeInsights,
    youtube_video_count: youtubeInsights?.youtube_video_count || 0
  };
  
  // Count total upgrades
  const totalUpgrades = Object.values(mergedObjectives).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`   Total upgrades: ${totalUpgrades}`);
  
  if (dryRun) {
    console.log('   [DRY RUN] Would update profile');
    return { success: true, upgrades: totalUpgrades, tier: qualityTier };
  }
  
  // Update the profile
  if (profile) {
    const { error } = await supabase
      .from('car_tuning_profiles')
      .update({
        upgrades_by_objective: mergedObjectives,
        platform_insights: platformInsights,
        data_quality_tier: qualityTier,
        data_sources: dataSourcesTracking,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  } else {
    // Create new profile
    const { error } = await supabase
      .from('car_tuning_profiles')
      .insert({
        car_id: car.id,
        upgrades_by_objective: mergedObjectives,
        platform_insights: platformInsights,
        data_quality_tier: qualityTier,
        data_sources: dataSourcesTracking,
        tuning_focus: 'performance'
      });
    
    if (error) {
      console.log(`   ❌ Error creating profile: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
  
  console.log('   ✅ Updated');
  return { success: true, upgrades: totalUpgrades, tier: qualityTier };
}

/**
 * Main execution
 */
async function main() {
  const { values } = parseArgs({
    options: {
      'car-slug': { type: 'string' },
      'dry-run': { type: 'boolean', default: false }
    }
  });
  
  const carSlug = values['car-slug'];
  const dryRun = values['dry-run'];
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('CONSOLIDATE TUNING DATA');
  console.log('═══════════════════════════════════════════════════════════════');
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be saved\n');
  }
  
  // Load static recommendations
  console.log('Loading data sources...');
  const staticRecommendations = await loadStaticRecommendations();
  console.log(`   Static file: ${Object.keys(staticRecommendations).length} cars`);
  
  // Get cars with their data
  let carsQuery = supabase
    .from('cars')
    .select('id, name, slug, upgrade_recommendations, popular_track_mods');
  
  if (carSlug) {
    carsQuery = carsQuery.eq('slug', carSlug);
  }
  
  const { data: cars, error: carsError } = await carsQuery;
  
  if (carsError) {
    console.error('Error fetching cars:', carsError.message);
    process.exit(1);
  }
  
  console.log(`   Database: ${cars.length} cars to process`);
  
  // Get existing profiles
  const { data: profiles } = await supabase
    .from('car_tuning_profiles')
    .select('id, car_id, stage_progressions, tuning_platforms, power_limits, brand_recommendations');
  
  const profileMap = new Map();
  profiles?.forEach(p => profileMap.set(p.car_id, p));
  
  console.log(`   Existing profiles: ${profiles?.length || 0}`);
  
  // Process each car
  let successCount = 0;
  let failCount = 0;
  const tierCounts = { verified: 0, researched: 0, enriched: 0, templated: 0, skeleton: 0 };
  
  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    const profile = profileMap.get(car.id);
    
    console.log(`\n[${i + 1}/${cars.length}]`);
    
    try {
      const result = await processCar(car, profile, staticRecommendations, dryRun);
      if (result.success) {
        successCount++;
        if (result.tier) tierCounts[result.tier]++;
      } else {
        failCount++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failCount++;
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(63));
  console.log('CONSOLIDATION COMPLETE');
  console.log('═'.repeat(63));
  console.log(`Total processed: ${cars.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('\nQuality Tier Distribution:');
  console.log(`  Verified:   ${tierCounts.verified}`);
  console.log(`  Researched: ${tierCounts.researched}`);
  console.log(`  Enriched:   ${tierCounts.enriched}`);
  console.log(`  Templated:  ${tierCounts.templated}`);
  console.log(`  Skeleton:   ${tierCounts.skeleton}`);
}

main().catch(console.error);
