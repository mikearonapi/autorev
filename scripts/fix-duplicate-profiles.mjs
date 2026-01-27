#!/usr/bin/env node
/**
 * Fix Duplicate Tuning Profiles
 * 
 * Removes duplicate car_tuning_profiles entries and keeps the most complete one.
 * Also removes incompatible tuning platforms from the remaining profiles.
 * 
 * Run: node scripts/fix-duplicate-profiles.mjs [--dry-run]
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const dryRun = process.argv.includes('--dry-run');
console.log(dryRun ? '\n🔍 DRY RUN MODE\n' : '\n⚡ LIVE MODE\n');

// Known incompatible platform/brand combinations
const incompatiblePlatforms = {
  'toyota': ['hondata', 'mhd', 'bootmod3', 'jb4', 'burger tuning'],
  'honda': ['mhd', 'bootmod3', 'cobb', 'accessport'],
  'jeep': [], // DiabloSport and HP Tuners work on Jeep
  'ford': [],
};

// Toyota Supra exception - uses BMW B58 so BMW tools work
const supraSlugs = ['toyota-gr-supra', 'toyota-supra-a90', 'toyota-supra-mk5'];

function scoreProfile(profile) {
  let score = 0;
  
  // Score based on data completeness
  if (profile.platform_insights) score += 10;
  if (profile.tuning_platforms?.length > 0) score += 5;
  if (profile.stage_progressions && Object.keys(profile.stage_progressions).length > 0) score += 5;
  if (profile.data_quality_tier === 'complete') score += 10;
  if (profile.data_quality_tier === 'enriched') score += 7;
  if (profile.data_quality_tier === 'standard') score += 5;
  
  return score;
}

function isIncompatiblePlatform(platformName, carBrand, carSlug) {
  const brand = carBrand.toLowerCase();
  const name = platformName.toLowerCase();
  
  // Exception: Toyota GR Supra uses BMW B58 engine
  if (supraSlugs.includes(carSlug)) {
    return false; // All platforms are potentially valid for Supra
  }
  
  // Check specific incompatibilities
  const incompatible = incompatiblePlatforms[brand] || [];
  return incompatible.some(inc => name.includes(inc));
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('FIX DUPLICATE TUNING PROFILES');
  console.log('═══════════════════════════════════════════════════\n');
  
  // Find all profiles grouped by car_id
  const { data: allProfiles } = await supabase
    .from('car_tuning_profiles')
    .select('*');
  
  const profilesByCarId = {};
  allProfiles.forEach(p => {
    if (!profilesByCarId[p.car_id]) profilesByCarId[p.car_id] = [];
    profilesByCarId[p.car_id].push(p);
  });
  
  let duplicatesFixed = 0;
  let profilesDeleted = 0;
  let platformsRemoved = 0;
  
  for (const [carId, profiles] of Object.entries(profilesByCarId)) {
    if (profiles.length === 1) continue; // No duplicates
    
    // Get car info
    const { data: car } = await supabase.from('cars').select('name, slug, brand').eq('id', carId).single();
    if (!car) continue;
    
    console.log(`\n📁 ${car.name} (${car.slug}) - ${profiles.length} profiles`);
    
    // Score each profile and keep the best one
    const scored = profiles.map(p => ({ ...p, score: scoreProfile(p) }));
    scored.sort((a, b) => b.score - a.score);
    
    const keepProfile = scored[0];
    const deleteProfiles = scored.slice(1);
    
    console.log(`   Keeping profile ${keepProfile.id.slice(0, 8)}... (score: ${keepProfile.score})`);
    
    // Delete the others
    for (const delProfile of deleteProfiles) {
      console.log(`   Deleting profile ${delProfile.id.slice(0, 8)}... (score: ${delProfile.score})`);
      
      if (!dryRun) {
        await supabase.from('car_tuning_profiles').delete().eq('id', delProfile.id);
      }
      profilesDeleted++;
    }
    
    // Check and fix incompatible platforms in the kept profile
    if (keepProfile.tuning_platforms?.length > 0) {
      const originalPlatforms = [...keepProfile.tuning_platforms];
      const validPlatforms = originalPlatforms.filter(p => {
        const isIncompatible = isIncompatiblePlatform(p.name || '', car.brand || car.name.split(' ')[0], car.slug);
        if (isIncompatible) {
          console.log(`   🔧 Removing incompatible platform: ${p.name}`);
          platformsRemoved++;
        }
        return !isIncompatible;
      });
      
      if (validPlatforms.length < originalPlatforms.length) {
        if (!dryRun) {
          await supabase.from('car_tuning_profiles')
            .update({ tuning_platforms: validPlatforms })
            .eq('id', keepProfile.id);
        }
      }
    }
    
    duplicatesFixed++;
  }
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Cars with duplicates fixed: ${duplicatesFixed}`);
  console.log(`  Profiles deleted: ${profilesDeleted}`);
  console.log(`  Incompatible platforms removed: ${platformsRemoved}`);
  
  if (dryRun) {
    console.log('\n  🔍 DRY RUN - no changes made. Run without --dry-run to apply fixes.');
  } else {
    console.log('\n  ✅ All fixes applied!');
  }
}

main().catch(console.error);
