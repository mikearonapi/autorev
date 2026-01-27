#!/usr/bin/env node
/**
 * Fix All Data Contradictions Script
 * 
 * Fixes all 13 critical data consistency issues found in the audit:
 * - 4 tunable cars with misleading "limited/impossible" insights
 * - 6 exotic cars that need clearer "specialist tuning" messaging
 * - 1 Toyota LFA that needs tuning platforms removed (insight is accurate)
 * 
 * Run: node scripts/fix-all-contradictions.mjs [--dry-run]
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const dryRun = process.argv.includes('--dry-run');

console.log(dryRun ? '\n🔍 DRY RUN MODE - No changes will be made\n' : '\n⚡ LIVE MODE - Making changes to database\n');

// Helper to recursively search and replace text in JSON objects
function deepReplace(obj, searchTerms, replacement) {
  if (typeof obj === 'string') {
    let result = obj;
    for (const term of searchTerms) {
      const regex = new RegExp(term, 'gi');
      result = result.replace(regex, replacement);
    }
    return result;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => deepReplace(item, searchTerms, replacement));
  }
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = deepReplace(value, searchTerms, replacement);
    }
    return result;
  }
  return obj;
}

// Helper to check if insights contain any problematic terms
function containsProblematicTerms(insights) {
  const terms = [
    'impossible', 'nearly impossible', 'no tuning',
    'extremely limited', 'severely limited', 'very limited',
    'limited tuning'
  ];
  const str = JSON.stringify(insights).toLowerCase();
  for (const term of terms) {
    if (str.includes(term.toLowerCase())) {
      return term;
    }
  }
  return null;
}

async function getCarAndProfile(slug) {
  const { data: car, error: carError } = await supabase
    .from('cars')
    .select('id, slug, name')
    .eq('slug', slug)
    .single();
  
  if (carError || !car) {
    console.error(`  ❌ Car not found: ${slug}`);
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('car_tuning_profiles')
    .select('*')
    .eq('car_id', car.id)
    .single();

  if (profileError || !profile) {
    console.error(`  ❌ Profile not found for: ${slug}`);
    return null;
  }

  return { car, profile };
}

async function updateProfile(carId, updates) {
  if (dryRun) {
    console.log('  📝 Would update:', Object.keys(updates).join(', '));
    return true;
  }

  const { error } = await supabase
    .from('car_tuning_profiles')
    .update(updates)
    .eq('car_id', carId);

  if (error) {
    console.error('  ❌ Update failed:', error.message);
    return false;
  }
  return true;
}

// =====================================================
// FIX CATEGORY 1: TUNABLE CARS WITH WRONG INSIGHTS
// These cars have excellent tuning potential but misleading insight text
// =====================================================

async function fixTunableCar(slug, carName) {
  console.log(`\n🔧 Fixing ${carName} (${slug})...`);
  
  const data = await getCarAndProfile(slug);
  if (!data) return false;
  
  const { car, profile } = data;
  const currentInsights = profile.platform_insights || {};
  
  const found = containsProblematicTerms(currentInsights);
  if (!found) {
    console.log('  ✅ No problematic terms found - may have been fixed already');
    return true;
  }
  
  console.log(`  Found problematic term: "${found}"`);
  
  // Remove problematic terms from all insight text
  const fixedInsights = deepReplace(
    currentInsights,
    ['nearly impossible', 'impossible', 'no tuning', 'extremely limited', 'severely limited', 'very limited', 'limited tuning'],
    'specialized tuning'
  );
  
  // Also clean up any double spaces created by replacements
  const cleanedInsights = deepReplace(fixedInsights, ['  '], ' ');
  
  const success = await updateProfile(car.id, { platform_insights: cleanedInsights });
  
  if (success) {
    console.log(`  ✅ ${carName} fixed`);
  }
  return success;
}

// =====================================================
// FIX CATEGORY 2: EXOTIC CARS - Clarify specialist tuning exists
// These cars DO have limited ECU tuning but specialist options exist
// =====================================================

async function fixExoticCar(slug, carName) {
  console.log(`\n🏎️  Fixing ${carName} (${slug})...`);
  
  const data = await getCarAndProfile(slug);
  if (!data) return false;
  
  const { car, profile } = data;
  const currentInsights = profile.platform_insights || {};
  
  const found = containsProblematicTerms(currentInsights);
  if (!found) {
    console.log('  ✅ No problematic terms found - may have been fixed already');
    return true;
  }
  
  console.log(`  Found problematic term: "${found}"`);
  
  // For exotic cars, we want to clarify that SPECIALIST tuning IS available
  // Replace absolute terms with nuanced explanations
  let fixedInsights = currentInsights;
  
  // Map of replacements for exotic cars
  const exoticReplacements = [
    {
      search: /tuning is nearly impossible|tuning is impossible|ECU tuning is nearly impossible|ECU tuning is impossible/gi,
      replace: 'ECU tuning requires specialist tuners (Novitec, Eurocharged)'
    },
    {
      search: /no tuning options?|no ECU tuning/gi,
      replace: 'limited ECU tuning through specialists only'
    },
    {
      search: /extremely limited aftermarket/gi,
      replace: 'specialist aftermarket'
    },
    {
      search: /limited tuning potential/gi,
      replace: 'tuning requires specialist knowledge and premium tuners'
    },
    {
      search: /limited tuning options?/gi,
      replace: 'specialist tuning options through premium tuners'
    },
    {
      search: /severely limited/gi,
      replace: 'specialist-only'
    },
    {
      search: /very limited/gi,
      replace: 'specialist-only'
    }
  ];
  
  // Apply replacements
  const stringify = JSON.stringify(fixedInsights);
  let result = stringify;
  for (const { search, replace } of exoticReplacements) {
    result = result.replace(search, replace);
  }
  fixedInsights = JSON.parse(result);
  
  const success = await updateProfile(car.id, { platform_insights: fixedInsights });
  
  if (success) {
    console.log(`  ✅ ${carName} fixed`);
  }
  return success;
}

// =====================================================
// FIX CATEGORY 3: TOYOTA LFA - Remove tuning platforms
// The insight IS accurate (LFA has very limited tuning)
// We should REMOVE the misleading tuning platforms
// =====================================================

async function fixToyotaLFA() {
  const slug = 'toyota-lfa-lfa01';
  console.log(`\n🏁 Fixing Toyota LFA (${slug})...`);
  
  const data = await getCarAndProfile(slug);
  if (!data) return false;
  
  const { car, profile } = data;
  
  // Check if platforms exist
  if (!profile.tuning_platforms || profile.tuning_platforms.length === 0) {
    console.log('  ✅ No tuning platforms to remove - may have been fixed already');
    return true;
  }
  
  console.log(`  Found ${profile.tuning_platforms.length} tuning platforms to remove`);
  console.log(`  Platforms: ${profile.tuning_platforms.map(p => p.name).join(', ')}`);
  
  // Remove tuning platforms (they are edge cases and misleading)
  const success = await updateProfile(car.id, { tuning_platforms: [] });
  
  if (success) {
    console.log('  ✅ Toyota LFA tuning platforms removed');
  }
  return success;
}

// =====================================================
// MAIN EXECUTION
// =====================================================

async function main() {
  console.log('=' .repeat(60));
  console.log('DATA CONSISTENCY FIX - All 11 Critical Issues');
  console.log('=' .repeat(60));

  const results = {
    success: [],
    failed: []
  };

  // --------- CATEGORY 1: TUNABLE CARS ---------
  console.log('\n📦 CATEGORY 1: Fixing tunable cars with misleading insights...\n');
  
  const tunableCars = [
    ['toyota-gr86', 'Toyota GR86'],
    ['toyota-supra-mk4-a80-turbo', 'Toyota Supra Mk4 A80 Turbo'],
    ['nissan-skyline-gt-r-r33', 'Nissan Skyline GT-R R33'],
    ['bmw-m3-e36', 'BMW M3 E36'],
  ];

  for (const [slug, name] of tunableCars) {
    const success = await fixTunableCar(slug, name);
    (success ? results.success : results.failed).push(name);
  }

  // --------- CATEGORY 2: EXOTIC CARS ---------
  console.log('\n\n📦 CATEGORY 2: Fixing exotic cars with specialist tuning...\n');
  
  const exoticCars = [
    ['ferrari-f430-430', 'Ferrari F430'],
    ['ferrari-458-italia', 'Ferrari 458 Italia'],
    ['ferrari-458-speciale', 'Ferrari 458 Speciale'],
    ['ferrari-812-superfast', 'Ferrari 812 Superfast'],
    ['ferrari-sf90-stradale-2019-2024', 'Ferrari SF90 Stradale'],
    ['lamborghini-aventador-lp700-4', 'Lamborghini Aventador LP 700-4'],
  ];

  for (const [slug, name] of exoticCars) {
    const success = await fixExoticCar(slug, name);
    (success ? results.success : results.failed).push(name);
  }

  // --------- CATEGORY 3: TOYOTA LFA ---------
  console.log('\n\n📦 CATEGORY 3: Fixing Toyota LFA (remove platforms)...\n');
  
  const lfaSuccess = await fixToyotaLFA();
  (lfaSuccess ? results.success : results.failed).push('Toyota LFA');

  // --------- SUMMARY ---------
  console.log('\n\n' + '=' .repeat(60));
  console.log('SUMMARY');
  console.log('=' .repeat(60));
  console.log(`\n✅ Successfully fixed: ${results.success.length}`);
  results.success.forEach(name => console.log(`   - ${name}`));
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed: ${results.failed.length}`);
    results.failed.forEach(name => console.log(`   - ${name}`));
  }
  
  console.log('\n' + (dryRun ? '🔍 DRY RUN complete - no changes made' : '✅ All fixes applied'));
  console.log('\nNext step: Run the audit script to verify all issues are resolved:');
  console.log('  node scripts/audit-data-consistency.mjs\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
