#!/usr/bin/env node

/**
 * Pre-Migration Database Backup
 * 
 * Creates complete JSON backups of all tables that reference the cars table
 * before the Teoalida migration.
 * 
 * Usage: node scripts/teoalida/backup-pre-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// All tables that reference cars (from plan Appendix A)
const TABLES_TO_BACKUP = {
  // Core cars table
  core: ['cars'],
  
  // User-critical tables (must preserve)
  userCritical: [
    'user_vehicles',
    'user_favorites', 
    'user_projects',
    'user_feedback',
    'user_uploaded_images',
    'user_track_times',
    'community_posts',
    'community_insights',
  ],
  
  // Content tables (will regenerate but backup for safety)
  content: [
    'car_issues',
    'car_tuning_profiles',
    'vehicle_maintenance_specs',
    'vehicle_service_intervals',
    'car_track_lap_times',
    'car_dyno_runs',
    'car_fuel_economy',
    'car_safety_data',
    'car_market_pricing',
    'car_market_pricing_years',
    'car_price_history',
    'car_recalls',
    'car_expert_reviews',
    'car_images',
    'car_manual_data',
    'car_variants',
    'car_auction_results',
  ],
  
  // System tables (backup for reference)
  system: [
    'al_content_gaps',
    'al_part_recommendations',
    'al_usage_logs',
    'document_chunks',
    'event_car_affinities',
    'feed_interactions',
    'fitment_tag_mappings',
    'forum_dyno_extractions',
    'forum_scrape_runs',
    'insight_feedback',
    'leads',
    'part_fitments',
    'scrape_jobs',
    'upgrade_packages',
    'vcdb_vehicles',
    'vehicle_known_issues',
    'wheel_tire_fitment_options',
    'youtube_ingestion_queue',
    'youtube_video_car_links',
    'youtube_videos',
  ],
};

/**
 * Backup a single table to JSON
 */
async function backupTable(tableName, backupDir) {
  try {
    // Fetch all records (paginated for large tables)
    let allData = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) {
        // Table might not exist or have permissions issues
        console.log(`  ⚠️  ${tableName}: ${error.message}`);
        return { table: tableName, count: 0, error: error.message };
      }
      
      if (data && data.length > 0) {
        allData = allData.concat(data);
        page++;
        hasMore = data.length === pageSize;
      } else {
        hasMore = false;
      }
    }
    
    // Write to file
    const filePath = join(backupDir, `${tableName}.json`);
    writeFileSync(filePath, JSON.stringify(allData, null, 2));
    
    console.log(`  ✅ ${tableName}: ${allData.length.toLocaleString()} records`);
    return { table: tableName, count: allData.length, error: null };
    
  } catch (err) {
    console.log(`  ❌ ${tableName}: ${err.message}`);
    return { table: tableName, count: 0, error: err.message };
  }
}

/**
 * Main backup function
 */
async function main() {
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const backupDir = join(process.cwd(), 'scripts', 'backup', `pre-teoalida-${timestamp}`);
  
  console.log('🔒 Pre-Migration Database Backup');
  console.log('='.repeat(50));
  console.log(`Backup location: ${backupDir}`);
  console.log();
  
  // Create backup directory
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }
  
  const results = {
    timestamp: new Date().toISOString(),
    backupDir,
    tables: [],
    summary: {
      total: 0,
      success: 0,
      failed: 0,
      totalRecords: 0,
    },
  };
  
  // Backup all table categories
  for (const [category, tables] of Object.entries(TABLES_TO_BACKUP)) {
    console.log(`\n📁 ${category.toUpperCase()} TABLES:`);
    
    for (const table of tables) {
      const result = await backupTable(table, backupDir);
      results.tables.push({ ...result, category });
      results.summary.total++;
      
      if (result.error) {
        results.summary.failed++;
      } else {
        results.summary.success++;
        results.summary.totalRecords += result.count;
      }
    }
  }
  
  // Write manifest
  const manifestPath = join(backupDir, '_manifest.json');
  writeFileSync(manifestPath, JSON.stringify(results, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('BACKUP SUMMARY');
  console.log('='.repeat(50));
  console.log(`Tables backed up: ${results.summary.success}/${results.summary.total}`);
  console.log(`Total records: ${results.summary.totalRecords.toLocaleString()}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Location: ${backupDir}`);
  
  if (results.summary.failed > 0) {
    console.log('\n⚠️  Some tables failed to backup:');
    results.tables.filter(t => t.error).forEach(t => {
      console.log(`  - ${t.table}: ${t.error}`);
    });
  }
  
  console.log('\n✅ Backup complete!');
  
  return results;
}

main().catch(console.error);
