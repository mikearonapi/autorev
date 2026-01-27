#!/usr/bin/env node
/**
 * Fix Logic Issues Script
 * 
 * Fixes critical logical inconsistencies found by the audit:
 * 1. Remove incompatible tuning platforms
 * 2. Remove/fix turbo-specific content from NA cars
 * 
 * Run: node scripts/fix-logic-issues.mjs [--dry-run]
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

// Define incompatible platform/car combinations to fix
const platformFixes = [
  // Hondata only works on Honda/Acura - remove from others
  { slug: 'lotus-elise-s2', removePlatforms: ['Hondata FlashPro'] },
  { slug: 'toyota-tacoma-2024', removePlatforms: ['Hondata FlashPro'] },
  { slug: 'toyota-tacoma-trd-pro-3rd-gen', removePlatforms: ['Hondata FlashPro'] },
  { slug: 'toyota-mr2-spyder-zzw30', removePlatforms: ['Hondata FlashPro', 'Hondata'] },
  { slug: 'toyota-tundra-3rd-gen', removePlatforms: ['Hondata', 'HP Tuners'] },
  
  // BMW-specific tools (bootmod3, MHD, JB4) don't work on Toyota
  { slug: 'toyota-tacoma-n300', removePlatforms: ['bootmod3', 'MHD Flasher', 'Burger Tuning JB4', 'MHD', 'bm3'] },
  { slug: 'toyota-tundra-trd-pro-xk70', removePlatforms: ['bootmod3', 'MHD', 'JB4'] },
  
  // SCT doesn't work on GM vehicles
  { slug: 'chevrolet-corvette-c6-z06', removePlatforms: ['SCT X4 Power Flash', 'SCT'] },
  { slug: 'chevrolet-corvette-c5-z06', removePlatforms: ['SCT'] },
  
  // APR is VAG-specific, doesn't work on Mercedes or Lamborghini (despite Audi connections)
  { slug: 'mercedes-amg-cla-45-c117', removePlatforms: ['APR'] },
  { slug: 'lamborghini-huracan-sto', removePlatforms: ['APR'] },
  { slug: 'lamborghini-huracan-lp610-4', removePlatforms: ['APR'] },
  
  // Unitronic is VAG-only
  { slug: 'hyundai-veloster-n-js', removePlatforms: ['Unitronic'] },
  
  // EcuTek doesn't support Kia
  { slug: 'kia-stinger-gt-ck', removePlatforms: ['EcuTek'] },
];

// Cars with NA engines that incorrectly mention turbo mods
const naTurboFixes = [
  { slug: 'audi-s4-b7', term: 'bov' },
  { slug: 'ford-mustang-gt-fox-body', term: 'bov' },
  { slug: 'subaru-brz-zd8', term: 'bov' },
  { slug: 'nissan-240sx-s13', term: 'boost controller' },
  { slug: 'ford-mustang-svt-cobra-sn95', term: 'intercooler' },
  { slug: 'chevrolet-silverado-zr2-t1xx', term: 'intercooler' },
  { slug: 'bmw-m3-e36', term: 'wastegate' },
  { slug: 'honda-civic-si-em1', term: 'blow-off valve' },
  { slug: 'ram-1500-trx-dt', term: 'wastegate' }, // Supercharged, not turbo
];

async function fixIncompatiblePlatforms() {
  console.log('═══════════════════════════════════════════════════');
  console.log('FIXING INCOMPATIBLE TUNING PLATFORMS');
  console.log('═══════════════════════════════════════════════════\n');
  
  let fixed = 0;
  
  for (const { slug, removePlatforms } of platformFixes) {
    const { data: car } = await supabase.from('cars').select('id, name').eq('slug', slug).single();
    if (!car) {
      console.log(`  ⚠️  Car not found: ${slug}`);
      continue;
    }
    
    const { data: profile } = await supabase.from('car_tuning_profiles')
      .select('tuning_platforms')
      .eq('car_id', car.id)
      .single();
    
    if (!profile) continue;
    
    const currentPlatforms = profile.tuning_platforms || [];
    const updatedPlatforms = currentPlatforms.filter(p => {
      const shouldRemove = removePlatforms.some(rp => 
        p.name?.toLowerCase().includes(rp.toLowerCase())
      );
      return !shouldRemove;
    });
    
    if (updatedPlatforms.length < currentPlatforms.length) {
      const removed = currentPlatforms.length - updatedPlatforms.length;
      console.log(`  🔧 ${car.name}: Removing ${removed} incompatible platform(s)`);
      console.log(`     Removed: ${removePlatforms.join(', ')}`);
      
      if (!dryRun) {
        await supabase.from('car_tuning_profiles')
          .update({ tuning_platforms: updatedPlatforms })
          .eq('car_id', car.id);
      }
      fixed++;
    }
  }
  
  console.log(`\n  ✅ Fixed ${fixed} cars with incompatible platforms\n`);
  return fixed;
}

async function fixNATurboContent() {
  console.log('═══════════════════════════════════════════════════');
  console.log('FIXING NA CARS WITH TURBO MOD RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════\n');
  
  let fixed = 0;
  
  for (const { slug, term } of naTurboFixes) {
    const { data: car } = await supabase.from('cars').select('id, name, engine').eq('slug', slug).single();
    if (!car) {
      console.log(`  ⚠️  Car not found: ${slug}`);
      continue;
    }
    
    const { data: profile } = await supabase.from('car_tuning_profiles')
      .select('platform_insights')
      .eq('car_id', car.id)
      .single();
    
    if (!profile?.platform_insights) continue;
    
    const insights = profile.platform_insights;
    let modified = false;
    
    // Check and fix community_tips
    if (insights.community_tips) {
      const originalLength = insights.community_tips.length;
      insights.community_tips = insights.community_tips.filter(tip => {
        const text = typeof tip === 'string' ? tip : tip.text || '';
        // Keep tip if it mentions turbo conversion/kit context
        if (text.toLowerCase().includes('turbo kit') || 
            text.toLowerCase().includes('turbo conversion') ||
            text.toLowerCase().includes('add turbo') ||
            text.toLowerCase().includes('after turbo')) {
          return true;
        }
        // Remove tip if it mentions the problematic term without conversion context
        return !text.toLowerCase().includes(term.toLowerCase());
      });
      
      if (insights.community_tips.length < originalLength) {
        modified = true;
        console.log(`  🔧 ${car.name}: Removed tip mentioning "${term}" (NA engine: ${car.engine})`);
      }
    }
    
    // Check and fix weaknesses
    if (insights.weaknesses) {
      const originalLength = insights.weaknesses.length;
      insights.weaknesses = insights.weaknesses.filter(w => {
        const text = typeof w === 'string' ? w : (w.title || w.description || '');
        if (text.toLowerCase().includes('turbo kit') || text.toLowerCase().includes('turbo conversion')) {
          return true;
        }
        return !text.toLowerCase().includes(term.toLowerCase());
      });
      
      if (insights.weaknesses.length < originalLength) {
        modified = true;
        console.log(`  🔧 ${car.name}: Removed weakness mentioning "${term}"`);
      }
    }
    
    if (modified) {
      if (!dryRun) {
        await supabase.from('car_tuning_profiles')
          .update({ platform_insights: insights })
          .eq('car_id', car.id);
      }
      fixed++;
    } else {
      // Check where the term actually appears
      const allText = JSON.stringify(insights).toLowerCase();
      if (allText.includes(term.toLowerCase())) {
        console.log(`  ℹ️  ${car.name}: "${term}" found but in context that may be valid - manual review needed`);
      }
    }
  }
  
  console.log(`\n  ✅ Fixed ${fixed} cars with NA turbo mod issues\n`);
  return fixed;
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('LOGIC ISSUES FIX SCRIPT');
  console.log('═══════════════════════════════════════════════════\n');
  
  const platformsFixed = await fixIncompatiblePlatforms();
  const naFixed = await fixNATurboContent();
  
  console.log('═══════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Incompatible platforms fixed: ${platformsFixed}`);
  console.log(`  NA turbo content fixed: ${naFixed}`);
  console.log(`  Total fixes: ${platformsFixed + naFixed}`);
  
  if (dryRun) {
    console.log('\n  🔍 DRY RUN - no changes made. Run without --dry-run to apply fixes.');
  } else {
    console.log('\n  ✅ All fixes applied!');
    console.log('\n  Next step: Re-run the logic audit to verify:');
    console.log('  node scripts/logic-accuracy-audit.mjs');
  }
}

main().catch(console.error);
