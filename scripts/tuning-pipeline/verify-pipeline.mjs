#!/usr/bin/env node
/**
 * Verify Tuning Pipeline Configuration
 * 
 * Checks that all pipeline scripts are properly configured to use
 * upgrades_by_objective as the source of truth per DATABASE.md
 * 
 * Usage:
 *   node scripts/tuning-pipeline/verify-pipeline.mjs
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function verifyPipeline() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('TUNING PIPELINE VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // 1. Check database schema has required columns
  console.log('\n📋 1. DATABASE SCHEMA CHECK');
  console.log('─────────────────────────────────────────────────────────────');
  
  const { data: sample, error: sampleError } = await supabase
    .from('car_tuning_profiles')
    .select('*')
    .limit(1);
  
  if (sampleError) {
    console.log('   ❌ Cannot access car_tuning_profiles:', sampleError.message);
    return;
  }
  
  const requiredColumns = [
    'upgrades_by_objective',  // SOURCE OF TRUTH
    'platform_insights',
    'curated_packages',
    'data_quality_tier',
    'data_sources',
    'stage_progressions',     // Legacy
    'tuning_platforms',
    'power_limits',
    'brand_recommendations'
  ];
  
  const sampleRow = sample?.[0] || {};
  const presentColumns = requiredColumns.filter(col => col in sampleRow);
  const missingColumns = requiredColumns.filter(col => !(col in sampleRow));
  
  console.log(`   Present columns: ${presentColumns.length}/${requiredColumns.length}`);
  presentColumns.forEach(col => console.log(`     ✅ ${col}`));
  
  if (missingColumns.length > 0) {
    console.log('   Missing columns:');
    missingColumns.forEach(col => console.log(`     ❌ ${col}`));
  }
  
  // 2. Check data quality distribution
  console.log('\n📊 2. DATA QUALITY DISTRIBUTION');
  console.log('─────────────────────────────────────────────────────────────');
  
  const { data: profiles } = await supabase
    .from('car_tuning_profiles')
    .select('id, data_quality_tier, upgrades_by_objective, stage_progressions');
  
  const tierCounts = {};
  let withUpgrades = 0;
  let withStages = 0;
  let withBoth = 0;
  let withNeither = 0;
  
  profiles?.forEach(p => {
    const tier = p.data_quality_tier || 'unknown';
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    
    const objectives = p.upgrades_by_objective || {};
    const totalUpgrades = Object.values(objectives).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    const hasUpgrades = totalUpgrades > 0;
    const hasStages = p.stage_progressions?.length > 0;
    
    if (hasUpgrades) withUpgrades++;
    if (hasStages) withStages++;
    if (hasUpgrades && hasStages) withBoth++;
    if (!hasUpgrades && !hasStages) withNeither++;
  });
  
  console.log('   Quality Tier Distribution:');
  Object.entries(tierCounts).sort((a, b) => b[1] - a[1]).forEach(([tier, count]) => {
    console.log(`     ${tier}: ${count}`);
  });
  
  console.log('\n   Data Coverage:');
  console.log(`     Total profiles: ${profiles?.length || 0}`);
  console.log(`     With upgrades_by_objective (source of truth): ${withUpgrades}`);
  console.log(`     With stage_progressions (legacy): ${withStages}`);
  console.log(`     With both: ${withBoth}`);
  console.log(`     With neither (need enrichment): ${withNeither}`);
  
  // 3. Check YouTube linkage
  console.log('\n🔗 3. YOUTUBE VIDEO LINKAGE');
  console.log('─────────────────────────────────────────────────────────────');
  
  const { count: totalVideos } = await supabase
    .from('youtube_videos')
    .select('*', { count: 'exact', head: true });
  
  const { count: linkedVideos } = await supabase
    .from('youtube_videos')
    .select('*', { count: 'exact', head: true })
    .not('car_id', 'is', null);
  
  console.log(`   Total videos: ${totalVideos}`);
  console.log(`   Linked to cars: ${linkedVideos} (${Math.round((linkedVideos/totalVideos)*100)}%)`);
  console.log(`   Unlinked: ${totalVideos - linkedVideos}`);
  
  // 4. Sample profile analysis
  console.log('\n🔍 4. SAMPLE PROFILE ANALYSIS');
  console.log('─────────────────────────────────────────────────────────────');
  
  const { data: goodProfile } = await supabase
    .from('car_tuning_profiles')
    .select('*, cars(name, slug)')
    .eq('data_quality_tier', 'researched')
    .limit(1)
    .single();
  
  if (goodProfile) {
    const objectives = goodProfile.upgrades_by_objective || {};
    const totalUpgrades = Object.values(objectives).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    
    console.log(`   Sample "researched" profile: ${goodProfile.cars?.name}`);
    console.log(`   - Data quality tier: ${goodProfile.data_quality_tier}`);
    console.log(`   - Total upgrades (source of truth): ${totalUpgrades}`);
    Object.entries(objectives).forEach(([key, arr]) => {
      if (arr?.length > 0) {
        console.log(`     • ${key}: ${arr.length} upgrades`);
      }
    });
    console.log(`   - Stages (legacy): ${goodProfile.stage_progressions?.length || 0}`);
    console.log(`   - Platforms: ${goodProfile.tuning_platforms?.length || 0}`);
    console.log(`   - Data sources: ${JSON.stringify(goodProfile.data_sources || {})}`);
  } else {
    console.log('   No "researched" profile found');
  }
  
  // 5. Pipeline readiness summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('PIPELINE READINESS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const schemaOk = missingColumns.length === 0;
  const dataOk = withUpgrades > 0;
  const ytOk = linkedVideos > 0;
  
  console.log(`   Schema:     ${schemaOk ? '✅ OK' : '❌ Missing columns'}`);
  console.log(`   Data:       ${dataOk ? '✅ OK' : '⚠️  No profiles with upgrades_by_objective'}`);
  console.log(`   YouTube:    ${ytOk ? '✅ OK' : '⚠️  No videos linked to cars'}`);
  console.log('');
  
  if (schemaOk && dataOk && ytOk) {
    console.log('   ✅ Pipeline is properly configured and ready to run');
    console.log('');
    console.log('   To enhance vehicles:');
    console.log('     node scripts/tuning-pipeline/run-pipeline.mjs --batch all');
    console.log('');
    console.log('   To research skeleton profiles:');
    console.log('     node scripts/tuning-pipeline/research-with-exa.mjs --batch skeleton');
  } else {
    console.log('   ⚠️  Pipeline has issues that need to be addressed');
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
}

verifyPipeline().catch(console.error);
