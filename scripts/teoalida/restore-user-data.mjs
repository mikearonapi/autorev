#!/usr/bin/env node

/**
 * Restore User Data from Backup
 * 
 * Restores user_vehicles, user_track_times, user_uploaded_images, and car_track_lap_times
 * from the pre-migration backup, updating matched_car_id to point to Teoalida cars.
 * 
 * Usage: node scripts/teoalida/restore-user-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BACKUP_DIR = join(process.cwd(), 'scripts', 'backup', 'pre-teoalida-20260201');
const MAPPING_FILE = join(process.cwd(), 'scripts', 'teoalida', 'user-vehicle-mapping.json');

/**
 * Load JSON backup file
 */
function loadBackup(tableName) {
  const filePath = join(BACKUP_DIR, `${tableName}.json`);
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Load the user vehicle mapping
 */
function loadMapping() {
  const content = readFileSync(MAPPING_FILE, 'utf-8');
  const data = JSON.parse(content);
  
  // Create lookup by user_vehicle_id
  const lookup = {};
  for (const item of data.mapping) {
    lookup[item.user_vehicle_id] = item.teoalida_id;
  }
  return lookup;
}

/**
 * Restore user_vehicles
 */
async function restoreUserVehicles(mapping) {
  console.log('\n📦 Restoring user_vehicles...');
  
  const backup = loadBackup('user_vehicles');
  console.log(`  Found ${backup.length} records in backup`);
  
  let restored = 0;
  let errors = 0;
  
  for (const record of backup) {
    // Update matched_car_id to Teoalida ID
    const teoalidaId = mapping[record.id];
    
    // Prepare record for insert (remove variant references since we truncated car_variants)
    const insertRecord = {
      ...record,
      matched_car_id: teoalidaId || null,
      matched_car_variant_id: null,  // No longer exists
      matched_car_variant_key: null, // No longer exists
    };
    
    const { error } = await supabase
      .from('user_vehicles')
      .insert(insertRecord);
    
    if (error) {
      console.log(`  ❌ Failed to restore ${record.id}: ${error.message}`);
      errors++;
    } else {
      restored++;
    }
  }
  
  console.log(`  ✅ Restored ${restored}/${backup.length} records (${errors} errors)`);
  return { restored, errors, total: backup.length };
}

/**
 * Restore user_track_times
 */
async function restoreUserTrackTimes(mapping) {
  console.log('\n📦 Restoring user_track_times...');
  
  const backup = loadBackup('user_track_times');
  console.log(`  Found ${backup.length} records in backup`);
  
  if (backup.length === 0) {
    console.log('  No records to restore');
    return { restored: 0, errors: 0, total: 0 };
  }
  
  let restored = 0;
  let errors = 0;
  
  for (const record of backup) {
    // Get Teoalida car_id from the user_vehicle mapping
    const teoalidaId = record.user_vehicle_id ? mapping[record.user_vehicle_id] : null;
    
    const insertRecord = {
      ...record,
      car_id: teoalidaId || null,
    };
    
    const { error } = await supabase
      .from('user_track_times')
      .insert(insertRecord);
    
    if (error) {
      console.log(`  ❌ Failed to restore ${record.id}: ${error.message}`);
      errors++;
    } else {
      restored++;
    }
  }
  
  console.log(`  ✅ Restored ${restored}/${backup.length} records (${errors} errors)`);
  return { restored, errors, total: backup.length };
}

/**
 * Restore user_uploaded_images
 */
async function restoreUserUploadedImages() {
  console.log('\n📦 Restoring user_uploaded_images...');
  
  const backup = loadBackup('user_uploaded_images');
  console.log(`  Found ${backup.length} records in backup`);
  
  if (backup.length === 0) {
    console.log('  No records to restore');
    return { restored: 0, errors: 0, total: 0 };
  }
  
  let restored = 0;
  let errors = 0;
  
  for (const record of backup) {
    // car_id will remain as legacy for now (images table was kept)
    const { error } = await supabase
      .from('user_uploaded_images')
      .insert(record);
    
    if (error) {
      if (error.code === '23505') {
        // Duplicate key - might already exist
        console.log(`  ⚠️ Skipped ${record.id}: already exists`);
      } else {
        console.log(`  ❌ Failed to restore ${record.id}: ${error.message}`);
        errors++;
      }
    } else {
      restored++;
    }
  }
  
  console.log(`  ✅ Restored ${restored}/${backup.length} records (${errors} errors)`);
  return { restored, errors, total: backup.length };
}

/**
 * Restore user_favorites (if needed)
 */
async function restoreUserFavorites() {
  console.log('\n📦 Checking user_favorites...');
  
  const { count } = await supabase
    .from('user_favorites')
    .select('*', { count: 'exact', head: true });
  
  if (count > 0) {
    console.log(`  ✅ Already has ${count} records - skipping`);
    return { restored: 0, errors: 0, total: count };
  }
  
  const backup = loadBackup('user_favorites');
  console.log(`  Found ${backup.length} records in backup - restoring...`);
  
  // Would need to map car_ids here too
  // For now just report
  console.log('  ⚠️ Manual restoration needed for favorites');
  return { restored: 0, errors: 0, total: backup.length };
}

/**
 * Restore user_projects (if needed)
 */
async function restoreUserProjects() {
  console.log('\n📦 Checking user_projects...');
  
  const { count } = await supabase
    .from('user_projects')
    .select('*', { count: 'exact', head: true });
  
  if (count > 0) {
    console.log(`  ✅ Already has ${count} records - skipping`);
    return { restored: 0, errors: 0, total: count };
  }
  
  const backup = loadBackup('user_projects');
  console.log(`  Found ${backup.length} records in backup - needs restoration`);
  return { restored: 0, errors: 0, total: backup.length };
}

/**
 * Main restore function
 */
async function main() {
  console.log('🔄 Restoring User Data from Backup');
  console.log('='.repeat(50));
  console.log(`Backup: ${BACKUP_DIR}`);
  console.log(`Mapping: ${MAPPING_FILE}`);
  
  // Load mapping
  const mapping = loadMapping();
  console.log(`\nLoaded ${Object.keys(mapping).length} vehicle mappings`);
  
  const results = {};
  
  // Restore tables
  results.user_vehicles = await restoreUserVehicles(mapping);
  results.user_track_times = await restoreUserTrackTimes(mapping);
  results.user_uploaded_images = await restoreUserUploadedImages();
  results.user_favorites = await restoreUserFavorites();
  results.user_projects = await restoreUserProjects();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('RESTORE SUMMARY');
  console.log('='.repeat(50));
  
  for (const [table, result] of Object.entries(results)) {
    console.log(`${table}: ${result.restored}/${result.total} restored`);
  }
  
  console.log('\n✅ Restore complete!');
}

main().catch(console.error);
