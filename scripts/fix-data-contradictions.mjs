#!/usr/bin/env node
/**
 * Fix Data Contradictions Script
 * 
 * Fixes contradictions identified by audit-data-consistency.mjs
 * 
 * Two types of fixes:
 * 1. PLATFORM_FIX: For exotics (Ferrari, Lamborghini, McLaren) - update insights to be more specific
 *    about what tuning IS possible (bolt-ons) vs what's not (full ECU flash)
 * 2. INSIGHT_FIX: For mainstream tunable cars (GR86, RS3) - remove/rephrase misleading insight text
 * 
 * Usage:
 *   node scripts/fix-data-contradictions.mjs --dry-run  # Preview changes
 *   node scripts/fix-data-contradictions.mjs            # Apply changes
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// ============================================================================
// FIX CONFIGURATIONS
// ============================================================================

// Cars where ECU tuning IS actually limited - keep the insight but make it more specific
const EXOTIC_PLATFORMS_WITH_LIMITED_TUNING = [
  'ferrari-458-speciale',
  'ferrari-458-italia',
  'ferrari-488-pista',
  'ferrari-sf90-stradale-2019-2024',
  'ferrari-f430-430',
  'mclaren-765lt-2020-2022',
  'lamborghini-aventador-lp700-4',
  'porsche-carrera-gt-980',
  'acura-nsx-nc1',
];

// Cars where tuning IS readily available - the insight text is misleading
const TUNABLE_CARS_WITH_BAD_INSIGHTS = [
  'toyota-gr86',
  'audi-rs3-8y',
  'nissan-skyline-gt-r-r33',
  'porsche-panamera-turbo-971',
  'porsche-911-gt3-992',
  'gmc-hummer-ev-t1xx', // EV - different constraints
];

// Replacement insight text for exotics
const EXOTIC_INSIGHT_REPLACEMENT = {
  weaknessesToAdd: [
    {
      title: 'ECU Tuning Constraints',
      description: 'Factory ECU is encrypted/locked. Gains come primarily from bolt-on modifications (exhaust, intake, wheels) rather than software tuning. Specialized tuners may offer limited ECU work at premium prices.',
    },
  ],
  termsToRemove: [
    'impossible',
    'nearly impossible',
    'extremely limited',
    'no tuning',
    'cannot be tuned',
  ],
};

// ============================================================================
// FIX FUNCTIONS
// ============================================================================

async function fixExoticPlatform(carSlug) {
  console.log(`\n  Fixing exotic platform: ${carSlug}`);
  
  // Get the tuning profile
  const { data: car } = await supabase
    .from('cars')
    .select('id, name')
    .eq('slug', carSlug)
    .single();
  
  if (!car) {
    console.log(`    ⚠️  Car not found: ${carSlug}`);
    return null;
  }
  
  const { data: profile } = await supabase
    .from('car_tuning_profiles')
    .select('id, platform_insights, tuning_platforms')
    .eq('car_id', car.id)
    .single();
  
  if (!profile) {
    console.log(`    ⚠️  No tuning profile found`);
    return null;
  }
  
  const platformInsights = profile.platform_insights || {};
  const weaknesses = platformInsights.weaknesses || [];
  
  // Check if already has ECU constraint weakness
  const hasEcuConstraint = weaknesses.some(w => {
    const title = typeof w === 'string' ? w : w.title || '';
    return title.toLowerCase().includes('ecu') && title.toLowerCase().includes('constraint');
  });
  
  if (hasEcuConstraint) {
    console.log(`    ✓ Already has proper ECU constraint warning`);
    return null;
  }
  
  // Clean up existing weaknesses - remove overly negative terms
  const cleanedWeaknesses = weaknesses.map(w => {
    if (typeof w === 'string') {
      let cleaned = w;
      for (const term of EXOTIC_INSIGHT_REPLACEMENT.termsToRemove) {
        cleaned = cleaned.replace(new RegExp(term, 'gi'), 'limited');
      }
      return cleaned;
    } else {
      let cleaned = { ...w };
      if (cleaned.title) {
        for (const term of EXOTIC_INSIGHT_REPLACEMENT.termsToRemove) {
          cleaned.title = cleaned.title.replace(new RegExp(term, 'gi'), 'limited');
        }
      }
      if (cleaned.description) {
        for (const term of EXOTIC_INSIGHT_REPLACEMENT.termsToRemove) {
          cleaned.description = cleaned.description.replace(new RegExp(term, 'gi'), 'limited');
        }
      }
      return cleaned;
    }
  });
  
  // Add the proper ECU constraint weakness
  const newWeaknesses = [...cleanedWeaknesses, ...EXOTIC_INSIGHT_REPLACEMENT.weaknessesToAdd];
  
  const updatedInsights = {
    ...platformInsights,
    weaknesses: newWeaknesses,
  };
  
  console.log(`    → Adding ECU constraint weakness`);
  console.log(`    → Cleaned ${weaknesses.length} existing weaknesses`);
  
  if (dryRun) {
    console.log(`    [DRY RUN] Would update platform_insights`);
    return { carSlug, action: 'would_update', weaknessCount: newWeaknesses.length };
  }
  
  const { error } = await supabase
    .from('car_tuning_profiles')
    .update({ platform_insights: updatedInsights })
    .eq('id', profile.id);
  
  if (error) {
    console.log(`    ❌ Update failed: ${error.message}`);
    return null;
  }
  
  console.log(`    ✅ Updated platform_insights`);
  return { carSlug, action: 'updated', weaknessCount: newWeaknesses.length };
}

async function fixTunableCarInsight(carSlug) {
  console.log(`\n  Fixing tunable car insight: ${carSlug}`);
  
  // Get the tuning profile
  const { data: car } = await supabase
    .from('cars')
    .select('id, name')
    .eq('slug', carSlug)
    .single();
  
  if (!car) {
    console.log(`    ⚠️  Car not found: ${carSlug}`);
    return null;
  }
  
  const { data: profile } = await supabase
    .from('car_tuning_profiles')
    .select('id, platform_insights')
    .eq('car_id', car.id)
    .single();
  
  if (!profile) {
    console.log(`    ⚠️  No tuning profile found`);
    return null;
  }
  
  const platformInsights = profile.platform_insights || {};
  const weaknesses = platformInsights.weaknesses || [];
  const communityTips = platformInsights.community_tips || [];
  
  // Remove or fix misleading tuning difficulty statements
  const problematicTerms = [
    'encrypted ecu',
    'extremely limited',
    'impossible',
    'nearly impossible',
    'no tuning',
    'cannot be tuned',
  ];
  
  let changed = false;
  
  // Fix weaknesses
  const fixedWeaknesses = weaknesses.map(w => {
    const text = typeof w === 'string' ? w : (w.title || '') + ' ' + (w.description || '');
    const hasProblematicTerm = problematicTerms.some(term => text.toLowerCase().includes(term));
    
    if (hasProblematicTerm) {
      changed = true;
      if (typeof w === 'string') {
        // Remove the problematic statement entirely if it's just about tuning
        if (/tuning|ecu|flash/i.test(w)) {
          console.log(`    → Removing misleading weakness: "${w.substring(0, 50)}..."`);
          return null; // Will be filtered out
        }
        return w;
      } else {
        // Check if the whole weakness is about tuning difficulty
        if (/tuning|ecu|flash/i.test(w.title || '')) {
          console.log(`    → Removing misleading weakness: "${w.title}"`);
          return null;
        }
        return w;
      }
    }
    return w;
  }).filter(Boolean);
  
  // Fix community tips
  const fixedTips = communityTips.map(t => {
    const text = typeof t === 'string' ? t : t.text || '';
    const hasProblematicTerm = problematicTerms.some(term => text.toLowerCase().includes(term));
    
    if (hasProblematicTerm && /tuning|ecu|flash/i.test(text)) {
      changed = true;
      console.log(`    → Removing misleading tip: "${text.substring(0, 50)}..."`);
      return null;
    }
    return t;
  }).filter(Boolean);
  
  if (!changed) {
    console.log(`    ✓ No problematic insights found`);
    return null;
  }
  
  const updatedInsights = {
    ...platformInsights,
    weaknesses: fixedWeaknesses,
    community_tips: fixedTips,
  };
  
  if (dryRun) {
    console.log(`    [DRY RUN] Would update platform_insights`);
    return { carSlug, action: 'would_update' };
  }
  
  const { error } = await supabase
    .from('car_tuning_profiles')
    .update({ platform_insights: updatedInsights })
    .eq('id', profile.id);
  
  if (error) {
    console.log(`    ❌ Update failed: ${error.message}`);
    return null;
  }
  
  console.log(`    ✅ Updated platform_insights`);
  return { carSlug, action: 'updated' };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DATA CONTRADICTION FIX SCRIPT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will update database)'}`);
  console.log('');
  
  const results = {
    exoticsFixes: [],
    tunableCarFixes: [],
  };
  
  // Fix exotic platforms
  console.log('─────────────────────────────────────────────────────────────');
  console.log('FIXING EXOTIC PLATFORMS (adding proper ECU constraint warnings)');
  console.log('─────────────────────────────────────────────────────────────');
  
  for (const slug of EXOTIC_PLATFORMS_WITH_LIMITED_TUNING) {
    const result = await fixExoticPlatform(slug);
    if (result) results.exoticsFixes.push(result);
  }
  
  // Fix tunable cars with bad insights
  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('FIXING TUNABLE CARS (removing misleading insights)');
  console.log('─────────────────────────────────────────────────────────────');
  
  for (const slug of TUNABLE_CARS_WITH_BAD_INSIGHTS) {
    const result = await fixTunableCarInsight(slug);
    if (result) results.tunableCarFixes.push(result);
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Exotic platforms processed: ${EXOTIC_PLATFORMS_WITH_LIMITED_TUNING.length}`);
  console.log(`Exotic platforms ${dryRun ? 'would be ' : ''}updated: ${results.exoticsFixes.length}`);
  console.log(`Tunable cars processed: ${TUNABLE_CARS_WITH_BAD_INSIGHTS.length}`);
  console.log(`Tunable cars ${dryRun ? 'would be ' : ''}updated: ${results.tunableCarFixes.length}`);
  
  if (dryRun) {
    console.log('\n⚠️  This was a dry run. No changes were made.');
    console.log('Run without --dry-run to apply changes.');
  }
  
  return results;
}

main().then(() => {
  console.log('\n✅ Done');
  process.exit(0);
}).catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
