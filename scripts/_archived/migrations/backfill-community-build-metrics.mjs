#!/usr/bin/env node
/**
 * Backfill Community Build Performance Metrics
 * 
 * This script calculates and stores performance metrics (0-60, braking, grip)
 * for all user_projects that are linked to community posts.
 * 
 * Usage: node scripts/backfill-community-build-metrics.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Upgrade module metric changes - extracted from upgradePackages.js
 * This is a simplified version for the backfill script
 */
const upgradeMetricChanges = {
  // Power modules
  'intake': { hpGain: 15 },
  'exhaust-catback': { hpGain: 12 },
  'headers': { hpGain: 20, zeroToSixtyImprovement: 0.1 },
  'tune-street': { hpGain: 25, zeroToSixtyImprovement: 0.2 },
  'tune-track': { hpGain: 35, zeroToSixtyImprovement: 0.3 },
  'stage1-tune': { hpGain: 70, torqueGain: 90, zeroToSixtyImprovement: 0.4 },
  'stage2-tune': { hpGain: 120, torqueGain: 150, zeroToSixtyImprovement: 0.7 },
  'stage3-tune': { hpGain: 200, torqueGain: 250, zeroToSixtyImprovement: 1.2 },
  'downpipe': { hpGain: 15, torqueGain: 25 },
  'charge-pipe-upgrade': { hpGain: 0 },
  'hpfp-upgrade': { hpGain: 0 },
  'flex-fuel-e85': { hpGain: 50, zeroToSixtyImprovement: 0.3 },
  'fuel-system-upgrade': { hpGain: 0 },
  'intercooler': { hpGain: 10 },
  
  // Forced induction
  'turbo-upgrade-existing': { hpGain: 120, zeroToSixtyImprovement: 0.6 },
  'supercharger-centrifugal': { hpGain: 150, zeroToSixtyImprovement: 0.8 },
  'supercharger-roots': { hpGain: 280, zeroToSixtyImprovement: 1.2 },
  'turbo-kit-single': { hpGain: 200, zeroToSixtyImprovement: 1.0 },
  'turbo-kit-twin': { hpGain: 300, zeroToSixtyImprovement: 1.5 },
  
  // Suspension
  'lowering-springs': { lateralGImprovement: 0.02 },
  'coilovers-street': { lateralGImprovement: 0.04, zeroToSixtyImprovement: 0.05 },
  'coilovers-track': { lateralGImprovement: 0.08, zeroToSixtyImprovement: 0.1 },
  'sway-bars': { lateralGImprovement: 0.03 },
  'chassis-bracing': { lateralGImprovement: 0.02 },
  
  // Brakes
  'brake-pads-street': { brakingImprovement: 3 },
  'brake-pads-track': { brakingImprovement: 6 },
  'brake-fluid-lines': { brakingImprovement: 2 },
  'big-brake-kit': { brakingImprovement: 10 },
  'slotted-rotors': { brakingImprovement: 2 },
  
  // Wheels & Tires
  'wheels-lightweight': { zeroToSixtyImprovement: 0.1, lateralGImprovement: 0.01 },
  'tires-slicks': { lateralGImprovement: 0.15, brakingImprovement: 8, zeroToSixtyImprovement: 0.2 },
  'tires-r-compound': { lateralGImprovement: 0.1, brakingImprovement: 5, zeroToSixtyImprovement: 0.15 },
  
  // Cooling
  'oil-cooler': {},
  'trans-cooler': {},
  'radiator-upgrade': {},
  
  // Aero
  'wing': { lateralGImprovement: 0.02 },
  'splitter': { lateralGImprovement: 0.02 },
  
  // Drivetrain
  'clutch-upgrade': { zeroToSixtyImprovement: 0.05 },
  'diff-upgrade': { zeroToSixtyImprovement: 0.1, lateralGImprovement: 0.02 },
  'short-shifter': {},
};

/**
 * Calculate performance improvements from selected upgrades
 */
function calculatePerformanceImprovements(selectedUpgrades, wheelFitment = null) {
  let totalZeroToSixtyImprovement = 0;
  let totalBrakingImprovement = 0;
  let totalLateralGImprovement = 0;
  
  // Get upgrade keys from the selected_upgrades object
  const upgradeKeys = Array.isArray(selectedUpgrades) 
    ? selectedUpgrades 
    : (selectedUpgrades?.upgrades || []);
  
  for (const key of upgradeKeys) {
    const metrics = upgradeMetricChanges[key];
    if (metrics) {
      totalZeroToSixtyImprovement += metrics.zeroToSixtyImprovement || 0;
      totalBrakingImprovement += metrics.brakingImprovement || 0;
      totalLateralGImprovement += metrics.lateralGImprovement || 0;
    }
  }
  
  // Add tire compound bonus if available
  if (wheelFitment?.gripBonus) {
    totalLateralGImprovement += wheelFitment.gripBonus;
    // Better tires also improve braking
    totalBrakingImprovement += wheelFitment.gripBonus * 50; // ~5ft per 0.1g grip
  }
  
  return {
    zeroToSixtyImprovement: Math.round(totalZeroToSixtyImprovement * 100) / 100,
    brakingImprovement: Math.round(totalBrakingImprovement),
    lateralGImprovement: Math.round(totalLateralGImprovement * 1000) / 1000,
  };
}

async function backfillCommunityBuilds() {
  console.log('🚀 Starting community build performance metrics backfill...\n');
  
  // Get all user_projects that are linked to community posts
  const { data: communityBuilds, error: fetchError } = await supabase
    .from('community_posts')
    .select(`
      id,
      title,
      user_build_id,
      user_projects!community_posts_user_build_id_fkey (
        id,
        project_name,
        car_slug,
        selected_upgrades,
        total_hp_gain,
        final_hp,
        stock_hp,
        final_zero_to_sixty,
        stock_zero_to_sixty,
        final_braking_60_0,
        stock_braking_60_0,
        final_lateral_g,
        stock_lateral_g
      )
    `)
    .not('user_build_id', 'is', null);
  
  if (fetchError) {
    console.error('❌ Error fetching community builds:', fetchError);
    return;
  }
  
  console.log(`📊 Found ${communityBuilds.length} community builds with linked projects\n`);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const post of communityBuilds) {
    const project = post.user_projects;
    if (!project) {
      console.log(`⏭️  Skipping ${post.title} - no linked project`);
      skipped++;
      continue;
    }
    
    // Get car stock data
    const { data: carData, error: carError } = await supabase
      .from('cars')
      .select('hp, zero_to_sixty, braking_60_0, lateral_g')
      .eq('slug', project.car_slug)
      .single();
    
    if (carError || !carData) {
      console.log(`⏭️  Skipping ${project.project_name} - car not found: ${project.car_slug}`);
      skipped++;
      continue;
    }
    
    // Calculate improvements from upgrades
    const wheelFitment = project.selected_upgrades?.wheelFitment || null;
    const improvements = calculatePerformanceImprovements(project.selected_upgrades, wheelFitment);
    
    // Calculate final values
    const stockHp = carData.hp || 0;
    const stockZeroToSixty = parseFloat(carData.zero_to_sixty) || null;
    const stockBraking = carData.braking_60_0 || 110;
    const stockLateralG = parseFloat(carData.lateral_g) || 0.9;
    
    const finalZeroToSixty = stockZeroToSixty 
      ? Math.max(1.5, Math.round((stockZeroToSixty - improvements.zeroToSixtyImprovement) * 10) / 10)
      : null;
    const finalBraking = Math.max(70, stockBraking - improvements.brakingImprovement);
    const finalLateralG = Math.min(1.6, Math.round((stockLateralG + improvements.lateralGImprovement) * 100) / 100);
    
    console.log(`\n📝 ${project.project_name} (${project.car_slug})`);
    console.log(`   HP: ${stockHp} → ${project.final_hp || stockHp + (project.total_hp_gain || 0)}`);
    console.log(`   0-60: ${stockZeroToSixty}s → ${finalZeroToSixty}s (improvement: -${improvements.zeroToSixtyImprovement}s)`);
    console.log(`   Braking: ${stockBraking}ft → ${finalBraking}ft (improvement: -${improvements.brakingImprovement}ft)`);
    console.log(`   Grip: ${stockLateralG}g → ${finalLateralG}g (improvement: +${improvements.lateralGImprovement}g)`);
    
    // Update the user_project
    const { error: updateError } = await supabase
      .from('user_projects')
      .update({
        stock_hp: stockHp,
        stock_zero_to_sixty: stockZeroToSixty,
        stock_braking_60_0: stockBraking,
        stock_lateral_g: stockLateralG,
        final_zero_to_sixty: finalZeroToSixty,
        final_braking_60_0: finalBraking,
        final_lateral_g: finalLateralG,
        zero_to_sixty_improvement: improvements.zeroToSixtyImprovement,
        braking_improvement: improvements.brakingImprovement,
        lateral_g_improvement: improvements.lateralGImprovement,
      })
      .eq('id', project.id);
    
    if (updateError) {
      console.log(`   ❌ Error updating: ${updateError.message}`);
      errors++;
    } else {
      console.log(`   ✅ Updated successfully`);
      updated++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Backfill complete!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
}

// Run the backfill
backfillCommunityBuilds().catch(console.error);
