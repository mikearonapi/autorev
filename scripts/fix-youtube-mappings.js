#!/usr/bin/env node

/**
 * Fix Specific YouTube Video-Car Mapping Errors
 * 
 * This script fixes known incorrect mappings identified by audit.
 * 
 * Usage:
 *   node scripts/fix-youtube-mappings.js [--dry-run]
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const dryRun = process.argv.includes('--dry-run');

const log = (...args) => console.log('[fix]', ...args);
const logError = (...args) => console.error('[fix:error]', ...args);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Definite mapping fixes - video_id -> { remove: [slugs], add: [slugs], keep: [slugs] }
const FIXES = [
  {
    // Toyota GR Supra video incorrectly assigned to multiple wrong cars
    video_id: 'lyS5wwpENew',
    video_title: 'Toyota GR Supra | Raising Questions',
    remove_from: [
      '718-cayman-gts-40',
      'c8-corvette-stingray', 
      'lexus-lc-500',
      'nissan-z-rz34'
    ],
    correct_car: 'toyota-gr-supra',
    reason: 'GR Supra video was incorrectly linked to multiple unrelated cars during batch processing'
  }
];

async function main() {
  log('========================================');
  log('YouTube Video Mapping Fixes');
  log('========================================');
  log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  log(`Fixes to apply: ${FIXES.length}`);
  log('');

  let totalRemoved = 0;
  let totalAdded = 0;
  let errors = 0;

  for (const fix of FIXES) {
    log(`\n🎬 Video: "${fix.video_title}" (${fix.video_id})`);
    log(`   Reason: ${fix.reason}`);
    
    // Remove incorrect links
    for (const wrongSlug of fix.remove_from) {
      log(`   ❌ Removing link to: ${wrongSlug}`);
      
      if (!dryRun) {
        const { error } = await supabase
          .from('youtube_video_car_links')
          .delete()
          .eq('video_id', fix.video_id)
          .eq('car_slug', wrongSlug);
        
        if (error) {
          logError(`      Failed to remove: ${error.message}`);
          errors++;
        } else {
          totalRemoved++;
        }
      } else {
        totalRemoved++;
      }
    }
    
    // Ensure correct link exists
    if (fix.correct_car) {
      log(`   ✅ Ensuring link to: ${fix.correct_car}`);
      
      if (!dryRun) {
        // Check if link already exists
        const { data: existing } = await supabase
          .from('youtube_video_car_links')
          .select('*')
          .eq('video_id', fix.video_id)
          .eq('car_slug', fix.correct_car)
          .single();
        
        if (existing) {
          log(`      Already exists`);
        } else {
          // Create the link
          const { error } = await supabase
            .from('youtube_video_car_links')
            .insert({
              video_id: fix.video_id,
              car_slug: fix.correct_car,
              role: 'primary',
              match_confidence: 0.95,
              match_method: 'manual_fix'
            });
          
          if (error) {
            logError(`      Failed to add: ${error.message}`);
            errors++;
          } else {
            totalAdded++;
            log(`      Added successfully`);
          }
        }
      } else {
        totalAdded++;
      }
    }
  }

  log('\n========================================');
  log('Fix Summary');
  log('========================================');
  log(`Links removed: ${totalRemoved}`);
  log(`Links added:   ${totalAdded}`);
  log(`Errors:        ${errors}`);
  
  if (dryRun) {
    log('\n[DRY RUN] No changes were made');
    log('Run without --dry-run to apply fixes');
  }
}

main().catch(error => {
  logError('Fatal error:', error);
  process.exit(1);
});
