#!/usr/bin/env node

/**
 * Migrate Car Images to Generation-Based Structure
 * 
 * Maps legacy car images to Teoalida generations using make + model + platform_code
 * 
 * Usage: node scripts/teoalida/migrate-images-to-generations.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Normalize generation code for matching
 * e.g., "B8" matches "B8 - 8K", "DC2" matches "DC1-DC2, DC4"
 */
function normalizeGenerationCode(code) {
  if (!code) return null;
  // Remove spaces, convert to uppercase for comparison
  return code.trim().toUpperCase();
}

/**
 * Check if legacy generation_code matches Teoalida platform_code
 */
function generationMatches(legacyCode, teoalidaPlatform) {
  if (!legacyCode || !teoalidaPlatform) return false;
  
  const legacy = normalizeGenerationCode(legacyCode);
  const teo = teoalidaPlatform.toUpperCase();
  
  // Exact match or starts with
  if (teo.startsWith(legacy)) return true;
  if (teo.includes(legacy)) return true;
  
  // Handle common patterns
  // "B8" should match "B8 - 8K"
  if (teo.includes(`${legacy} -`)) return true;
  if (teo.includes(`${legacy}/`)) return true;
  if (teo.includes(`-${legacy}`)) return true;
  
  return false;
}

/**
 * Find matching Teoalida generations for a legacy car image
 */
async function findMatchingGenerations(brand, model, generationCode) {
  // Normalize brand/make
  const make = brand === 'Mercedes-AMG' ? 'Mercedes-Benz' : brand;
  
  // Get all unique generations for this make
  const { data: generations, error } = await supabase
    .from('cars')
    .select('make, model, platform_code')
    .eq('make', make)
    .not('platform_code', 'is', null);
  
  if (error) {
    console.error(`Error fetching generations for ${make}:`, error.message);
    return [];
  }
  
  // Find matching generations
  const matches = [];
  const seen = new Set();
  
  for (const gen of generations) {
    const key = `${gen.make}|${gen.model}|${gen.platform_code}`;
    if (seen.has(key)) continue;
    
    // Check if model matches (fuzzy)
    const modelMatches = 
      gen.model.toLowerCase().includes(model.toLowerCase().split(' ')[0]) ||
      model.toLowerCase().includes(gen.model.toLowerCase().split(' ')[0]);
    
    // Check if generation matches
    const genMatches = generationMatches(generationCode, gen.platform_code);
    
    if (modelMatches && genMatches) {
      matches.push(gen);
      seen.add(key);
    }
  }
  
  return matches;
}

/**
 * Main migration function
 */
async function main() {
  console.log('🖼️  Migrating Car Images to Generation-Based Structure');
  console.log('='.repeat(60));
  
  // Get all legacy images with their car data
  const { data: images, error: imgError } = await supabase
    .from('car_images')
    .select(`
      id,
      blob_url,
      blob_path,
      source_type,
      source_url,
      alt_text,
      car_id
    `);
  
  if (imgError) {
    console.error('Error fetching images:', imgError.message);
    return;
  }
  
  console.log(`Found ${images.length} images to migrate\n`);
  
  // Get legacy car data
  const { data: legacyCars, error: carError } = await supabase
    .from('cars_v1_legacy')
    .select('id, brand, model, generation_code');
  
  if (carError) {
    console.error('Error fetching legacy cars:', carError.message);
    return;
  }
  
  // Create lookup
  const legacyLookup = {};
  for (const car of legacyCars) {
    legacyLookup[car.id] = car;
  }
  
  let migrated = 0;
  let failed = 0;
  let duplicates = 0;
  
  for (const image of images) {
    const legacy = legacyLookup[image.car_id];
    if (!legacy) {
      console.log(`⚠️  No legacy car found for image ${image.id}`);
      failed++;
      continue;
    }
    
    const { brand, model, generation_code } = legacy;
    
    // Find matching Teoalida generations
    const matches = await findMatchingGenerations(brand, model, generation_code);
    
    if (matches.length === 0) {
      // Fallback: use legacy data directly
      console.log(`⚠️  No Teoalida match for ${brand} ${model} (${generation_code}) - using legacy values`);
      
      // Insert with legacy values
      const { error: insertError } = await supabase
        .from('car_generation_images')
        .insert({
          make: brand,
          model: model,
          platform_code: generation_code || 'unknown',
          blob_url: image.blob_url,
          blob_path: image.blob_path,
          source_type: image.source_type,
          source_url: image.source_url,
          alt_text: image.alt_text,
          is_primary: true,
          quality_tier: 'hero',
        })
        .select();
      
      if (insertError) {
        if (insertError.code === '23505') {
          duplicates++;
        } else {
          console.log(`  ❌ Insert failed: ${insertError.message}`);
          failed++;
        }
      } else {
        migrated++;
      }
    } else {
      // Use first match (could be multiple generations with same image)
      const match = matches[0];
      
      const { error: insertError } = await supabase
        .from('car_generation_images')
        .insert({
          make: match.make,
          model: match.model,
          platform_code: match.platform_code,
          blob_url: image.blob_url,
          blob_path: image.blob_path,
          source_type: image.source_type,
          source_url: image.source_url,
          alt_text: image.alt_text,
          is_primary: true,
          quality_tier: 'hero',
        })
        .select();
      
      if (insertError) {
        if (insertError.code === '23505') {
          duplicates++;
        } else {
          console.log(`  ❌ Insert failed for ${match.make} ${match.model}: ${insertError.message}`);
          failed++;
        }
      } else {
        console.log(`  ✅ ${match.make} ${match.model} (${match.platform_code})`);
        migrated++;
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total images: ${images.length}`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Duplicates skipped: ${duplicates}`);
  console.log(`Failed: ${failed}`);
  
  // Verify
  const { count } = await supabase
    .from('car_generation_images')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\nTotal records in car_generation_images: ${count}`);
  
  console.log('\n✅ Migration complete!');
}

main().catch(console.error);
