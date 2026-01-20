#!/usr/bin/env node
/**
 * YouTube Insight Extraction Pipeline
 * 
 * Extracts REAL upgrade recommendations and insights from YouTube video data
 * and aggregates them into car_tuning_profiles with proper provenance tracking.
 * 
 * This script focuses on extracting REAL data from REAL sources:
 * - Parts mentioned in videos (diy_insights.parts_mentioned)
 * - Pros/cons from video analysis
 * - Key points and recommendations
 * - Performance numbers and claims
 * 
 * Data is stored with source: "youtube_transcript" for full provenance.
 * 
 * Usage:
 *   node scripts/youtube-insight-extraction.mjs --dry-run
 *   node scripts/youtube-insight-extraction.mjs --car-slug volkswagen-gti-mk7
 *   node scripts/youtube-insight-extraction.mjs --limit 50
 *   node scripts/youtube-insight-extraction.mjs --all
 * 
 * @module scripts/youtube-insight-extraction
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// Parse CLI args
const { values } = parseArgs({
  options: {
    'car-slug': { type: 'string' },
    'limit': { type: 'string', default: '20' },
    'dry-run': { type: 'boolean', default: false },
    'verbose': { type: 'boolean', default: false },
    'all': { type: 'boolean', default: false },
    'min-videos': { type: 'string', default: '3' },
  },
});

const carSlug = values['car-slug'];
const limit = parseInt(values['limit'], 10);
const dryRun = values['dry-run'];
const verbose = values['verbose'];
const processAll = values['all'];
const minVideos = parseInt(values['min-videos'], 10);

const log = (...args) => console.log('[yt-extract]', ...args);
const logVerbose = (...args) => verbose && console.log('[yt-extract:verbose]', ...args);

/**
 * Get cars with YouTube videos that have extracted insights
 */
async function getCarsWithVideoInsights(limitCount) {
  // Get all car links with video data
  const { data: links, error } = await supabase
    .from('youtube_video_car_links')
    .select(`
      car_id,
      video_id,
      cars!inner(id, slug, name),
      youtube_videos!inner(
        id,
        video_id,
        title,
        pros_mentioned,
        cons_mentioned,
        key_points,
        stock_strengths,
        stock_weaknesses,
        diy_insights,
        processing_status
      )
    `)
    .eq('youtube_videos.processing_status', 'processed')
    .limit(5000);

  if (error) {
    console.error('Query error:', error);
    throw error;
  }

  // Group by car
  const carMap = new Map();
  for (const link of links || []) {
    if (!link.cars || !link.youtube_videos) continue;
    
    const carId = link.car_id;
    
    if (!carMap.has(carId)) {
      carMap.set(carId, {
        car_id: carId,
        car_slug: link.cars.slug,
        car_name: link.cars.name,
        video_count: 0,
        videos: []
      });
    }
    
    const car = carMap.get(carId);
    car.video_count++;
    car.videos.push(link.youtube_videos);
  }

  // Filter by min videos and sort
  return Array.from(carMap.values())
    .filter(c => c.video_count >= minVideos)
    .sort((a, b) => b.video_count - a.video_count)
    .slice(0, limitCount);
}

/**
 * Get all video insights for a specific car
 */
async function getVideoInsightsForCar(carId) {
  const { data, error } = await supabase
    .from('youtube_video_car_links')
    .select(`
      video_id,
      youtube_videos!inner (
        id,
        video_id,
        title,
        url,
        channel_name,
        view_count,
        pros_mentioned,
        cons_mentioned,
        key_points,
        stock_strengths,
        stock_weaknesses,
        diy_insights,
        quality_score,
        processing_status
      )
    `)
    .eq('car_id', carId)
    .eq('youtube_videos.processing_status', 'processed');

  if (error) throw error;
  return data?.map(d => d.youtube_videos).filter(v => v) || [];
}

/**
 * Aggregate parts mentioned across all videos for a car
 */
function aggregatePartsMentioned(videos) {
  const partsMap = new Map();
  
  for (const video of videos) {
    const parts = video.diy_insights?.parts_mentioned || [];
    
    for (const part of parts) {
      if (!part.name) continue;
      
      const key = `${part.name.toLowerCase()}-${(part.brand || '').toLowerCase()}`;
      
      if (!partsMap.has(key)) {
        partsMap.set(key, {
          name: part.name,
          brand: part.brand || null,
          purpose: part.purpose || null,
          quality_tier: part.quality_tier || null,
          mention_count: 0,
          video_sources: [],
          sentiment_scores: []
        });
      }
      
      const existing = partsMap.get(key);
      existing.mention_count++;
      existing.video_sources.push({
        video_id: video.video_id,
        title: video.title,
        channel: video.channel_name
      });
    }
  }
  
  // Sort by mention count and return top parts
  return Array.from(partsMap.values())
    .sort((a, b) => b.mention_count - a.mention_count);
}

/**
 * Aggregate pros/cons across videos
 */
function aggregateProsAndCons(videos) {
  const prosMap = new Map();
  const consMap = new Map();
  
  for (const video of videos) {
    // Process pros
    const pros = video.pros_mentioned || [];
    for (const pro of pros) {
      const text = typeof pro === 'string' ? pro : pro.text;
      if (!text) continue;
      
      const key = text.toLowerCase().substring(0, 50);
      if (!prosMap.has(key)) {
        prosMap.set(key, {
          text: text,
          category: pro.category || 'general',
          mention_count: 0,
          sources: []
        });
      }
      prosMap.get(key).mention_count++;
      prosMap.get(key).sources.push(video.video_id);
    }
    
    // Process cons
    const cons = video.cons_mentioned || [];
    for (const con of cons) {
      const text = typeof con === 'string' ? con : con.text;
      if (!text) continue;
      
      const key = text.toLowerCase().substring(0, 50);
      if (!consMap.has(key)) {
        consMap.set(key, {
          text: text,
          category: con.category || 'general',
          mention_count: 0,
          sources: []
        });
      }
      consMap.get(key).mention_count++;
      consMap.get(key).sources.push(video.video_id);
    }
  }
  
  return {
    pros: Array.from(prosMap.values()).sort((a, b) => b.mention_count - a.mention_count),
    cons: Array.from(consMap.values()).sort((a, b) => b.mention_count - a.mention_count)
  };
}

/**
 * Aggregate stock strengths and weaknesses
 */
function aggregateStockTraits(videos) {
  const strengthsMap = new Map();
  const weaknessesMap = new Map();
  
  for (const video of videos) {
    // Stock strengths
    const strengths = video.stock_strengths || [];
    for (const item of strengths) {
      const text = typeof item === 'string' ? item : item.text || item.tag;
      if (!text) continue;
      
      const key = text.toLowerCase();
      if (!strengthsMap.has(key)) {
        strengthsMap.set(key, { text, count: 0 });
      }
      strengthsMap.get(key).count++;
    }
    
    // Stock weaknesses
    const weaknesses = video.stock_weaknesses || [];
    for (const item of weaknesses) {
      const text = typeof item === 'string' ? item : item.text || item.tag;
      if (!text) continue;
      
      const key = text.toLowerCase();
      if (!weaknessesMap.has(key)) {
        weaknessesMap.set(key, { text, count: 0 });
      }
      weaknessesMap.get(key).count++;
    }
  }
  
  return {
    strengths: Array.from(strengthsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(s => s.text),
    weaknesses: Array.from(weaknessesMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(w => w.text)
  };
}

/**
 * Extract key points and tips
 */
function extractKeyPointsAndTips(videos) {
  const tips = [];
  
  for (const video of videos) {
    const keyPoints = video.key_points || [];
    
    for (const kp of keyPoints) {
      const text = typeof kp === 'string' ? kp : kp.text;
      if (!text) continue;
      
      // Filter for actionable tips (contains verbs like "should", "must", "can", etc.)
      const actionWords = ['should', 'must', 'can', 'recommend', 'suggest', 'avoid', 'upgrade', 'install', 'check'];
      const isActionable = actionWords.some(word => text.toLowerCase().includes(word));
      
      if (isActionable || (kp.category && ['maintenance', 'modification', 'performance'].includes(kp.category))) {
        tips.push({
          text: text.length > 200 ? text.substring(0, 200) + '...' : text,
          category: kp.category || 'general',
          source_video: video.video_id
        });
      }
    }
    
    // Also extract from diy_insights.maintenance_tips if available
    const maintenanceTips = video.diy_insights?.maintenance_tips || [];
    for (const tip of maintenanceTips) {
      const text = typeof tip === 'string' ? tip : tip.tip || tip.text;
      if (text) {
        tips.push({
          text: text.length > 200 ? text.substring(0, 200) + '...' : text,
          category: 'maintenance',
          source_video: video.video_id
        });
      }
    }
  }
  
  // Dedupe and limit
  const uniqueTips = [];
  const seen = new Set();
  
  for (const tip of tips) {
    const key = tip.text.toLowerCase().substring(0, 30);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueTips.push(tip);
    }
  }
  
  return uniqueTips.slice(0, 15);
}

/**
 * Convert aggregated parts to upgrade recommendations
 */
function partsToUpgradeRecommendations(partsList) {
  // Group by category/purpose
  const categories = {
    power: [],
    handling: [],
    braking: [],
    cooling: [],
    sound: [],
    aero: [],
    other: []
  };
  
  for (const part of partsList) {
    if (part.mention_count < 1) continue;
    
    const purpose = (part.purpose || '').toLowerCase();
    const name = (part.name || '').toLowerCase();
    
    // Categorize based on purpose/name keywords
    let category = 'other';
    
    if (purpose.includes('intake') || purpose.includes('exhaust') || purpose.includes('turbo') ||
        purpose.includes('tune') || purpose.includes('intercooler') || purpose.includes('fuel') ||
        name.includes('intake') || name.includes('exhaust') || name.includes('turbo') ||
        name.includes('downpipe') || name.includes('ecu') || name.includes('injector')) {
      category = 'power';
    } else if (purpose.includes('suspension') || purpose.includes('coilover') || purpose.includes('sway') ||
               purpose.includes('handling') || name.includes('coilover') || name.includes('strut') ||
               name.includes('spring') || name.includes('bushing')) {
      category = 'handling';
    } else if (purpose.includes('brake') || name.includes('brake') || name.includes('rotor') ||
               name.includes('caliper') || name.includes('pad')) {
      category = 'braking';
    } else if (purpose.includes('cool') || purpose.includes('radiator') || purpose.includes('oil') ||
               name.includes('radiator') || name.includes('cooler')) {
      category = 'cooling';
    } else if (purpose.includes('exhaust') || purpose.includes('sound') || name.includes('muffler') ||
               name.includes('resonator') || name.includes('catback')) {
      category = 'sound';
    } else if (purpose.includes('aero') || purpose.includes('spoiler') || purpose.includes('wing') ||
               name.includes('splitter') || name.includes('diffuser') || name.includes('wing')) {
      category = 'aero';
    }
    
    const upgrade = {
      name: part.name,
      brand: part.brand,
      purpose: part.purpose,
      mention_count: part.mention_count,
      quality_tier: part.quality_tier,
      video_sources: part.video_sources.slice(0, 3), // Limit sources
      source: 'youtube_transcript'
    };
    
    categories[category].push(upgrade);
  }
  
  // Sort each category by mention count and limit
  for (const cat of Object.keys(categories)) {
    categories[cat] = categories[cat]
      .sort((a, b) => b.mention_count - a.mention_count)
      .slice(0, 10);
  }
  
  // Remove empty categories and 'other'
  const result = {};
  for (const [cat, items] of Object.entries(categories)) {
    if (items.length > 0 && cat !== 'other') {
      result[cat] = items;
    }
  }
  
  return result;
}

/**
 * Process a single car - extract and aggregate YouTube insights
 */
async function processCarInsights(carId, carSlug, carName) {
  log(`\n📹 Processing: ${carName} (${carSlug})`);
  
  // Get all video insights for this car
  const videos = await getVideoInsightsForCar(carId);
  
  if (videos.length === 0) {
    log(`   ⚠️ No processed videos found`);
    return null;
  }
  
  log(`   Found ${videos.length} processed videos`);
  
  // Aggregate parts mentioned
  const partsList = aggregatePartsMentioned(videos);
  logVerbose(`   Parts mentioned: ${partsList.length}`);
  
  // Aggregate pros and cons
  const { pros, cons } = aggregateProsAndCons(videos);
  logVerbose(`   Pros: ${pros.length}, Cons: ${cons.length}`);
  
  // Aggregate stock traits
  const { strengths, weaknesses } = aggregateStockTraits(videos);
  logVerbose(`   Strengths: ${strengths.length}, Weaknesses: ${weaknesses.length}`);
  
  // Extract tips
  const tips = extractKeyPointsAndTips(videos);
  logVerbose(`   Tips extracted: ${tips.length}`);
  
  // Convert to upgrade recommendations
  const upgradesByCategory = partsToUpgradeRecommendations(partsList);
  const totalUpgrades = Object.values(upgradesByCategory).reduce((sum, arr) => sum + arr.length, 0);
  
  log(`   ✅ Extracted: ${totalUpgrades} upgrades, ${strengths.length} strengths, ${weaknesses.length} weaknesses, ${tips.length} tips`);
  
  // Build the update payload
  const youtubeInsights = {
    video_count: videos.length,
    extraction_date: new Date().toISOString(),
    parts_mentioned: partsList.slice(0, 50),
    pros_aggregated: pros.slice(0, 20),
    cons_aggregated: cons.slice(0, 20),
    community_tips: tips
  };
  
  const platformInsights = {
    strengths: strengths,
    weaknesses: weaknesses,
    community_tips: tips.map(t => t.text).slice(0, 10),
    source: 'youtube_extraction',
    video_count: videos.length
  };
  
  return {
    car_id: carId,
    youtube_insights: youtubeInsights,
    platform_insights: platformInsights,
    upgrades_by_objective: upgradesByCategory,
    data_sources: {
      youtube_extraction: true,
      youtube_video_count: videos.length,
      extraction_date: new Date().toISOString(),
      source_videos: videos.slice(0, 10).map(v => ({
        video_id: v.video_id,
        title: v.title,
        channel: v.channel_name
      }))
    }
  };
}

/**
 * Update tuning profile with YouTube insights
 */
async function updateTuningProfile(carId, insights) {
  // Check if profile exists
  const { data: existing } = await supabase
    .from('car_tuning_profiles')
    .select('id, upgrades_by_objective, platform_insights, youtube_insights, data_sources, confidence_tier')
    .eq('car_id', carId)
    .single();
  
  // Merge with existing data if present
  let mergedUpgrades = insights.upgrades_by_objective;
  let mergedInsights = insights.platform_insights;
  let mergedYoutubeInsights = insights.youtube_insights;
  let newConfidenceTier = 'extracted'; // YouTube data is Tier 2 (extracted from real sources)
  
  if (existing) {
    // Merge upgrades - YouTube data supplements existing
    if (existing.upgrades_by_objective) {
      mergedUpgrades = { ...existing.upgrades_by_objective };
      
      for (const [category, upgrades] of Object.entries(insights.upgrades_by_objective)) {
        if (!mergedUpgrades[category]) {
          mergedUpgrades[category] = [];
        }
        
        // Add YouTube-sourced upgrades, marking them
        for (const upgrade of upgrades) {
          const exists = mergedUpgrades[category].some(
            u => u.name?.toLowerCase() === upgrade.name?.toLowerCase()
          );
          
          if (!exists) {
            mergedUpgrades[category].push(upgrade);
          }
        }
      }
    }
    
    // Merge platform insights
    if (existing.platform_insights) {
      mergedInsights = {
        ...existing.platform_insights,
        ...insights.platform_insights,
        // Merge arrays
        strengths: [...new Set([
          ...(existing.platform_insights.strengths || []),
          ...(insights.platform_insights.strengths || [])
        ])].slice(0, 10),
        weaknesses: [...new Set([
          ...(existing.platform_insights.weaknesses || []),
          ...(insights.platform_insights.weaknesses || [])
        ])].slice(0, 10),
        community_tips: [...new Set([
          ...(existing.platform_insights.community_tips || []),
          ...(insights.platform_insights.community_tips || [])
        ])].slice(0, 15)
      };
    }
    
    // Merge YouTube insights
    if (existing.youtube_insights) {
      mergedYoutubeInsights = {
        ...existing.youtube_insights,
        ...insights.youtube_insights
      };
    }
    
    // If existing was verified, keep it verified
    if (existing.confidence_tier === 'verified') {
      newConfidenceTier = 'verified';
    }
  }
  
  const updateData = {
    youtube_insights: mergedYoutubeInsights,
    platform_insights: mergedInsights,
    upgrades_by_objective: mergedUpgrades,
    data_sources: {
      ...(existing?.data_sources || {}),
      ...insights.data_sources,
      has_youtube_extraction: true
    },
    confidence_tier: newConfidenceTier,
    data_quality_tier: existing?.data_quality_tier === 'verified' ? 'verified' : 'enriched',
    updated_at: new Date().toISOString()
  };
  
  if (existing?.id) {
    const { error } = await supabase
      .from('car_tuning_profiles')
      .update(updateData)
      .eq('id', existing.id);
    
    if (error) throw error;
    return 'updated';
  } else {
    const { error } = await supabase
      .from('car_tuning_profiles')
      .insert({
        car_id: carId,
        tuning_focus: 'performance',
        stage_progressions: {},
        ...updateData
      });
    
    if (error) throw error;
    return 'created';
  }
}

/**
 * Main function
 */
async function main() {
  console.log('');
  console.log('📹 YouTube Insight Extraction Pipeline');
  console.log('======================================');
  console.log('Philosophy: REAL DATA from REAL sources');
  console.log('');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
  }
  
  let carsToProcess = [];
  
  if (carSlug) {
    // Process specific car
    const { data: car } = await supabase
      .from('cars')
      .select('id, slug, name')
      .eq('slug', carSlug)
      .single();
    
    if (!car) {
      console.error(`❌ Car not found: ${carSlug}`);
      process.exit(1);
    }
    
    carsToProcess = [{ car_id: car.id, car_slug: car.slug, car_name: car.name }];
  } else {
    // Get cars with video insights
    console.log(`Finding cars with ${minVideos}+ processed videos...`);
    carsToProcess = await getCarsWithVideoInsights(processAll ? 500 : limit);
    console.log(`Found ${carsToProcess.length} cars to process`);
  }
  
  if (carsToProcess.length === 0) {
    console.log('No cars to process');
    process.exit(0);
  }
  
  const results = {
    processed: 0,
    updated: 0,
    created: 0,
    failed: 0,
    skipped: 0
  };
  
  for (const car of carsToProcess) {
    try {
      const insights = await processCarInsights(car.car_id, car.car_slug, car.car_name);
      
      if (!insights) {
        results.skipped++;
        continue;
      }
      
      const totalUpgrades = Object.values(insights.upgrades_by_objective)
        .reduce((sum, arr) => sum + arr.length, 0);
      
      if (totalUpgrades === 0 && insights.platform_insights.strengths.length === 0) {
        log(`   ⏭️ No meaningful insights extracted, skipping`);
        results.skipped++;
        continue;
      }
      
      if (dryRun) {
        log(`   [DRY RUN] Would update profile with ${totalUpgrades} upgrades`);
        results.processed++;
      } else {
        const action = await updateTuningProfile(car.car_id, insights);
        log(`   ✅ Profile ${action}`);
        
        results.processed++;
        if (action === 'updated') results.updated++;
        if (action === 'created') results.created++;
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${car.car_slug}: ${error.message}`);
      results.failed++;
    }
  }
  
  // Summary
  console.log('');
  console.log('======================================');
  console.log('📊 Summary');
  console.log('======================================');
  console.log(`Processed: ${results.processed}`);
  console.log(`Updated: ${results.updated}`);
  console.log(`Created: ${results.created}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Failed: ${results.failed}`);
  console.log('');
  console.log('Data source: youtube_transcript (Tier 2 - extracted)');
}

main().catch(console.error);
