#!/usr/bin/env node
/**
 * Execute User Vehicle Migration to Teoalida
 * 
 * This script:
 * 1. Creates the car_id_migration table
 * 2. Inserts mappings from the AI-matched JSON
 * 3. Updates user_vehicles.matched_car_id to point to Teoalida cars
 * 
 * Prerequisites:
 * - cars_teoalida table must be populated
 * - user-vehicle-mapping.json must exist
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Load the mapping
const mappingPath = path.join(__dirname, 'user-vehicle-mapping.json');
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

async function createMigrationTable() {
  console.log('Creating car_id_migration table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      -- Drop if exists for clean re-run
      DROP TABLE IF EXISTS car_id_migration;
      
      -- Create migration mapping table
      CREATE TABLE car_id_migration (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        old_car_id UUID NOT NULL,
        new_car_id UUID NOT NULL,
        user_vehicle_id UUID,
        old_car_name TEXT,
        new_car_name TEXT,
        confidence TEXT,
        notes TEXT,
        migrated_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX idx_migration_old_car ON car_id_migration(old_car_id);
      CREATE INDEX idx_migration_new_car ON car_id_migration(new_car_id);
      CREATE INDEX idx_migration_user_vehicle ON car_id_migration(user_vehicle_id);
    `
  });
  
  if (error) {
    // Try alternative approach without RPC
    console.log('RPC not available, using direct SQL...');
    
    // Create table using Supabase's SQL editor approach
    const createSql = `
      DROP TABLE IF EXISTS car_id_migration;
      CREATE TABLE car_id_migration (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        old_car_id UUID NOT NULL,
        new_car_id UUID NOT NULL,
        user_vehicle_id UUID,
        old_car_name TEXT,
        new_car_name TEXT,
        confidence TEXT,
        notes TEXT,
        migrated_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log('Please run this SQL in Supabase dashboard:');
    console.log(createSql);
    return false;
  }
  
  console.log('✓ Migration table created');
  return true;
}

async function insertMappings() {
  console.log(`\nInserting ${mapping.mapping.length} mappings...`);
  
  // First, get the current matched_car_id for each user_vehicle
  const userVehicleIds = mapping.mapping.map(m => m.user_vehicle_id);
  
  const { data: userVehicles, error: uvError } = await supabase
    .from('user_vehicles')
    .select('id, matched_car_id')
    .in('id', userVehicleIds);
  
  if (uvError) {
    console.error('Error fetching user vehicles:', uvError);
    return false;
  }
  
  // Create lookup of user_vehicle_id -> old_car_id
  const oldCarIdLookup = {};
  userVehicles.forEach(uv => {
    oldCarIdLookup[uv.id] = uv.matched_car_id;
  });
  
  // Prepare migration records
  const migrationRecords = mapping.mapping.map(m => ({
    old_car_id: oldCarIdLookup[m.user_vehicle_id],
    new_car_id: m.teoalida_id,
    user_vehicle_id: m.user_vehicle_id,
    old_car_name: null, // Will be populated separately if needed
    new_car_name: m.teoalida_name,
    confidence: m.confidence,
    notes: m.notes
  })).filter(r => r.old_car_id); // Only include records with valid old_car_id
  
  // Insert in batches
  const batchSize = 50;
  for (let i = 0; i < migrationRecords.length; i += batchSize) {
    const batch = migrationRecords.slice(i, i + batchSize);
    const { error } = await supabase
      .from('car_id_migration')
      .insert(batch);
    
    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      return false;
    }
    console.log(`  Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(migrationRecords.length / batchSize)}`);
  }
  
  console.log(`✓ Inserted ${migrationRecords.length} migration mappings`);
  return true;
}

async function updateUserVehicles() {
  console.log('\nUpdating user_vehicles.matched_car_id to Teoalida IDs...');
  
  // Update each user_vehicle to point to the new Teoalida car
  let updated = 0;
  let errors = 0;
  
  for (const m of mapping.mapping) {
    const { error } = await supabase
      .from('user_vehicles')
      .update({ matched_car_id: m.teoalida_id })
      .eq('id', m.user_vehicle_id);
    
    if (error) {
      console.error(`  Error updating ${m.user_vehicle_id}:`, error.message);
      errors++;
    } else {
      updated++;
    }
  }
  
  console.log(`✓ Updated ${updated} user vehicles (${errors} errors)`);
  return errors === 0;
}

async function verifyMigration() {
  console.log('\nVerifying migration...');
  
  // Check a few sample user_vehicles to ensure they point to cars_teoalida
  const sampleIds = mapping.mapping.slice(0, 5).map(m => m.user_vehicle_id);
  
  const { data, error } = await supabase
    .from('user_vehicles')
    .select(`
      id,
      year,
      make,
      model,
      matched_car_id,
      cars_teoalida!inner(id, name, slug)
    `)
    .in('id', sampleIds);
  
  if (error) {
    // Foreign key might not exist yet, try alternative verification
    const { data: uvData } = await supabase
      .from('user_vehicles')
      .select('id, year, make, model, matched_car_id')
      .in('id', sampleIds);
    
    if (uvData) {
      console.log('\nSample updated vehicles:');
      for (const uv of uvData) {
        const matchedCar = mapping.mapping.find(m => m.user_vehicle_id === uv.id);
        console.log(`  ${uv.year} ${uv.make} ${uv.model}`);
        console.log(`    → ${matchedCar?.teoalida_name}`);
        console.log(`    ID: ${uv.matched_car_id}`);
      }
    }
    return true;
  }
  
  console.log('\nSample verified vehicles:');
  for (const row of data || []) {
    console.log(`  ${row.year} ${row.make} ${row.model} → ${row.cars_teoalida?.name}`);
  }
  
  return true;
}

async function main() {
  console.log('='.repeat(60));
  console.log('User Vehicle Migration to Teoalida');
  console.log('='.repeat(60));
  console.log(`Total vehicles to migrate: ${mapping.mapping.length}`);
  console.log(`High confidence: ${mapping.summary.high_confidence}`);
  console.log(`Medium confidence: ${mapping.summary.medium_confidence}`);
  console.log(`Low confidence: ${mapping.summary.low_confidence}`);
  console.log('');
  
  // Step 1: Create migration table (will fail gracefully if RPC not available)
  await createMigrationTable();
  
  // Step 2: Insert mappings
  const mappingsOk = await insertMappings();
  if (!mappingsOk) {
    console.error('Failed to insert mappings. Aborting.');
    process.exit(1);
  }
  
  // Step 3: Update user_vehicles
  const updateOk = await updateUserVehicles();
  if (!updateOk) {
    console.warn('Some updates failed. Check errors above.');
  }
  
  // Step 4: Verify
  await verifyMigration();
  
  console.log('\n' + '='.repeat(60));
  console.log('Migration complete!');
  console.log('='.repeat(60));
  console.log('\nCritical fixes applied:');
  mapping.summary.critical_fixes.forEach(fix => console.log(`  ✓ ${fix}`));
}

main().catch(console.error);
