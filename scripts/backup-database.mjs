#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * Exports key tables to JSON files for backup purposes.
 * Can be restored by re-inserting the JSON data.
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BACKUP_DIR = `./backups/${new Date().toISOString().split('T')[0]}_${Date.now()}`;

// Tables to backup (in order of importance)
const TABLES_TO_BACKUP = [
  'cars',
  'user_vehicles',
  'user_favorites',
  'car_tuning_profiles',
  'car_issues',
  'car_variants',
  'car_track_lap_times',
  'vehicle_maintenance_specs',
  'vehicle_service_intervals',
];

async function backupTable(tableName) {
  console.log(`  Backing up ${tableName}...`);
  
  const { data, error, count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact' });
  
  if (error) {
    console.error(`    Error: ${error.message}`);
    return { table: tableName, success: false, error: error.message };
  }
  
  const filename = `${BACKUP_DIR}/${tableName}.json`;
  writeFileSync(filename, JSON.stringify(data, null, 2));
  console.log(`    ✓ ${count} records saved to ${filename}`);
  
  return { table: tableName, success: true, count };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                         DATABASE BACKUP                                       ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  // Create backup directory
  mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`📁 Backup directory: ${BACKUP_DIR}\n`);
  
  console.log('📥 Backing up tables...\n');
  
  const results = [];
  for (const table of TABLES_TO_BACKUP) {
    const result = await backupTable(table);
    results.push(result);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('BACKUP SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Successfully backed up: ${successful.length} tables`);
  successful.forEach(r => console.log(`   - ${r.table}: ${r.count} records`));
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length} tables`);
    failed.forEach(r => console.log(`   - ${r.table}: ${r.error}`));
  }
  
  const totalRecords = successful.reduce((sum, r) => sum + r.count, 0);
  console.log(`\n📊 Total records backed up: ${totalRecords.toLocaleString()}`);
  console.log(`📁 Backup location: ${BACKUP_DIR}`);
  
  // Create a manifest
  const manifest = {
    timestamp: new Date().toISOString(),
    tables: results,
    totalRecords,
  };
  writeFileSync(`${BACKUP_DIR}/manifest.json`, JSON.stringify(manifest, null, 2));
  console.log(`📝 Manifest saved to ${BACKUP_DIR}/manifest.json`);
}

main().catch(console.error);
