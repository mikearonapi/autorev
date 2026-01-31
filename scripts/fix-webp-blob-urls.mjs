#!/usr/bin/env node
/**
 * Fix Blob URLs After WebP Conversion
 * 
 * Updates database URLs to reference .webp files after images were converted.
 * This script should be run after convert-blob-images-to-webp.mjs
 * 
 * Tables updated:
 * - user_car_media (blob_url column)
 * - user_build_images (blob_url column)
 * - community_post_media (blob_url column)
 * - al_articles (hero_image_url column)
 * - feedback_submissions (screenshot_url column)
 * 
 * Usage:
 *   node scripts/fix-webp-blob-urls.mjs --dry-run  # Preview changes
 *   node scripts/fix-webp-blob-urls.mjs            # Apply changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables
function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        let value = valueParts.join('=');
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (key && value) process.env[key] = value;
      }
    }
  }
}

loadEnv();

const DRY_RUN = process.argv.includes('--dry-run');

// Tables and columns to update
// These are all tables that store Vercel Blob URLs which may have been converted
const TABLES_TO_UPDATE = [
  // User-uploaded media (actual table name is user_uploaded_images)
  { table: 'user_uploaded_images', column: 'blob_url', idColumn: 'id' },
  { table: 'user_uploaded_images', column: 'thumbnail_url', idColumn: 'id' },
  { table: 'user_uploaded_images', column: 'video_thumbnail_url', idColumn: 'id' },
  
  // Articles
  { table: 'al_articles', column: 'hero_image_url', idColumn: 'id' },
  
  // Car images library (if used)
  { table: 'car_images', column: 'blob_url', idColumn: 'id' },
  
  // Events (if they use blob storage for images)
  { table: 'events', column: 'image_url', idColumn: 'id' },
  
  // Cars table (hero images)
  { table: 'cars', column: 'image_hero_url', idColumn: 'id' },
];

// Folders that were converted (from convert-blob-images-to-webp.mjs)
const CONVERTED_FOLDERS = [
  'user-uploads',
  'feedback-screenshots',
  'articles',
  'site-design-v2',
  'site-design',
  // Note: 'cars' folder only had JPGs converted, not PNGs
];

/**
 * Check if a URL points to a file in a converted folder
 */
function shouldConvertUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Check if it's a PNG or JPG URL
  const lowerUrl = url.toLowerCase();
  if (!lowerUrl.endsWith('.png') && !lowerUrl.endsWith('.jpg') && !lowerUrl.endsWith('.jpeg')) {
    return false;
  }
  
  // Check if it's in a converted folder
  return CONVERTED_FOLDERS.some(folder => url.includes(`/${folder}/`));
}

/**
 * Convert a URL from PNG/JPG to WebP
 */
function convertUrl(url) {
  return url.replace(/\.(png|jpe?g)$/i, '.webp');
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     FIX BLOB URLs AFTER WebP CONVERSION                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Missing Supabase credentials');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  let totalUpdated = 0;
  let totalSkipped = 0;
  const errors = [];
  
  for (const { table, column, idColumn } of TABLES_TO_UPDATE) {
    console.log(`\n📋 Processing ${table}.${column}...`);
    
    try {
      // Fetch all rows with PNG/JPG URLs (we'll filter in JS for converted folders)
      // This is more reliable than complex OR queries
      const { data: rows, error: selectError } = await supabase
        .from(table)
        .select(`${idColumn}, ${column}`)
        .not(column, 'is', null)
        .or(`${column}.ilike.%.png,${column}.ilike.%.jpg,${column}.ilike.%.jpeg`);
      
      if (selectError) {
        // Table might not exist, that's OK
        if (selectError.code === '42P01' || selectError.message.includes('does not exist')) {
          console.log(`   ⏭️  Table doesn't exist, skipping`);
          continue;
        }
        console.error(`   ❌ Error querying ${table}: ${selectError.message}`);
        errors.push({ table, column, error: selectError.message });
        continue;
      }
      
      if (!rows || rows.length === 0) {
        console.log(`   ✓ No rows to update`);
        continue;
      }
      
      // Filter to only URLs that should be converted
      const toUpdate = rows.filter(row => shouldConvertUrl(row[column]));
      
      if (toUpdate.length === 0) {
        console.log(`   ✓ No rows need conversion`);
        totalSkipped += rows.length;
        continue;
      }
      
      console.log(`   Found ${toUpdate.length} URLs to convert`);
      
      if (DRY_RUN) {
        // Show sample of what would be updated
        const sample = toUpdate.slice(0, 3);
        for (const row of sample) {
          console.log(`   ${row[column]}`);
          console.log(`     → ${convertUrl(row[column])}`);
        }
        if (toUpdate.length > 3) {
          console.log(`   ... and ${toUpdate.length - 3} more`);
        }
        totalUpdated += toUpdate.length;
        continue;
      }
      
      // Apply updates
      let updated = 0;
      for (const row of toUpdate) {
        const newUrl = convertUrl(row[column]);
        
        const { error: updateError } = await supabase
          .from(table)
          .update({ [column]: newUrl })
          .eq(idColumn, row[idColumn]);
        
        if (updateError) {
          errors.push({ table, column, id: row[idColumn], error: updateError.message });
        } else {
          updated++;
        }
      }
      
      console.log(`   ✅ Updated ${updated}/${toUpdate.length} rows`);
      totalUpdated += updated;
      
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
      errors.push({ table, column, error: err.message });
    }
  }
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                       SUMMARY                                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  if (DRY_RUN) {
    console.log(`📊 Would update ${totalUpdated} URLs`);
    console.log('\n✅ Dry run complete. Run without --dry-run to apply changes.');
  } else {
    console.log(`✅ Updated: ${totalUpdated} URLs`);
  }
  
  if (errors.length > 0) {
    console.log(`\n⚠️  Errors (${errors.length}):`);
    errors.forEach(e => console.log(`   ${e.table}.${e.column}: ${e.error}`));
  }
  
  console.log('\n📋 Next steps:');
  console.log('   1. Clear browser cache and test the app');
  console.log('   2. Check that images load correctly in Garage');
  console.log('   3. Verify user-uploaded images display properly');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
