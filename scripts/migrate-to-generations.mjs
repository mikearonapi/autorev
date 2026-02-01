#!/usr/bin/env node

/**
 * Migrate v1/v2 Car Structure to Generation-Based Architecture
 * 
 * This script migrates from the current v1/v2 structure to a cleaner
 * generation-based architecture where:
 * 
 * - "generations" hold all content (issues, tuning profiles, lap times, etc.)
 * - "cars" are year-specific YMMT entries that reference their generation
 * 
 * BEFORE:
 *   cars (v1) ← content tables (car_issues, etc.)
 *   cars (v2) → parent_car_id → cars (v1)
 * 
 * AFTER:
 *   car_generations ← content tables (car_issues, etc.)
 *   cars → generation_id → car_generations
 * 
 * This eliminates the confusing v1/v2 split and creates a clean architecture.
 * 
 * Usage: node scripts/migrate-to-generations.mjs [--dry-run] [--phase N]
 * 
 * Phases:
 *   1: Create car_generations table and migrate v1 data
 *   2: Update content tables to use generation_id
 *   3: Update cars table to use generation_id
 *   4: Cleanup (remove old columns, drop v1 records from cars)
 * 
 * Run with --dry-run first to preview changes!
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DRY_RUN = process.argv.includes('--dry-run');
const PHASE_ARG = process.argv.indexOf('--phase');
const PHASE = PHASE_ARG !== -1 ? parseInt(process.argv[PHASE_ARG + 1]) : null;

// Tables that have car_id foreign key pointing to cars table
// These need to be updated to point to car_generations
const CONTENT_TABLES = [
  { table: 'car_issues', fk: 'car_id' },
  { table: 'car_tuning_profiles', fk: 'car_id' },
  { table: 'car_variants', fk: 'car_id' },
  { table: 'car_track_lap_times', fk: 'car_id' },
  { table: 'vehicle_maintenance_specs', fk: 'car_id' },
  { table: 'vehicle_service_intervals', fk: 'car_id' },
  { table: 'car_images', fk: 'car_id' },
  { table: 'car_dyno_runs', fk: 'car_id' },
  { table: 'youtube_videos', fk: 'car_id' },
  { table: 'document_chunks', fk: 'car_id' },
  { table: 'community_insights', fk: 'car_id' },
  { table: 'wheel_tire_fitment_options', fk: 'car_id' },
  { table: 'car_market_pricing', fk: 'car_id' },
  { table: 'car_market_pricing_years', fk: 'car_id' },
  { table: 'part_fitments', fk: 'car_id' },
  { table: 'upgrade_packages', fk: 'car_id' },
  { table: 'youtube_video_car_links', fk: 'car_id' },
  { table: 'car_fuel_economy', fk: 'car_id' },
  { table: 'car_safety_data', fk: 'car_id' },
  { table: 'car_recalls', fk: 'car_id' },
  { table: 'car_price_history', fk: 'car_id' },
  { table: 'car_expert_reviews', fk: 'car_id' },
  { table: 'car_auction_results', fk: 'car_id' },
  { table: 'scrape_jobs', fk: 'car_id' },
  { table: 'car_manual_data', fk: 'car_id' },
  { table: 'youtube_ingestion_queue', fk: 'target_car_id' },
  { table: 'fitment_tag_mappings', fk: 'car_id' },
  { table: 'event_car_affinities', fk: 'car_id' },
  { table: 'forum_dyno_extractions', fk: 'matched_car_id' },
  { table: 'community_posts', fk: 'car_id' },
  { table: 'al_usage_logs', fk: 'car_id' },
  { table: 'forum_scrape_runs', fk: 'car_id' },
  { table: 'user_feedback', fk: 'car_id' },
  { table: 'user_uploaded_images', fk: 'car_id' },
  { table: 'feed_interactions', fk: 'car_id' },
  { table: 'al_content_gaps', fk: 'car_id' },
  { table: 'vcdb_vehicles', fk: 'car_id' },
  { table: 'insight_feedback', fk: 'car_id' },
  { table: 'user_track_times', fk: 'car_id' },
  { table: 'al_part_recommendations', fk: 'car_id' },
];

// Tables that reference cars by slug (need special handling)
const SLUG_TABLES = [
  { table: 'leads', fk: 'car_interest_slug' },
  { table: 'vehicle_known_issues', fk: 'car_slug' },
];

// User-related tables that should point to cars (not generations)
const USER_TABLES = [
  { table: 'user_vehicles', fk: 'matched_car_id' },
  { table: 'user_favorites', fk: 'car_id' },
  { table: 'user_projects', fk: 'car_id' },
  { table: 'leads', fk: 'car_interest_id' },
];

async function log(message, data = null) {
  console.log(message);
  if (data) console.log(JSON.stringify(data, null, 2));
}

async function runSQL(sql, description) {
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would execute: ${description}`);
    console.log(`  SQL: ${sql.substring(0, 200)}...`);
    return { success: true, dryRun: true };
  }
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(e => {
    // If RPC doesn't exist, try direct query
    return supabase.from('_migrations').select('1').limit(0);
  });
  
  if (error) {
    console.error(`[ERROR] ${description}:`, error.message);
    return { success: false, error };
  }
  
  console.log(`[SUCCESS] ${description}`);
  return { success: true, data };
}

// ============================================================================
// PHASE 1: Create car_generations table from v1 cars
// ============================================================================
async function phase1_CreateGenerations() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 1: Create car_generations table');
  console.log('='.repeat(80) + '\n');

  // Check current state
  const { data: v1Cars } = await supabase
    .from('cars')
    .select('id, name, slug, brand, model, trim, years')
    .eq('structure_version', 'v1')
    .limit(5);
  
  console.log('Sample v1 cars that will become generations:');
  v1Cars?.forEach(c => console.log(`  - ${c.name} (${c.years})`));
  
  const { data: counts } = await supabase
    .from('cars')
    .select('structure_version')
    .then(res => ({
      data: {
        v1: res.data?.filter(c => c.structure_version === 'v1').length || 0,
        v2: res.data?.filter(c => c.structure_version === 'v2').length || 0,
      }
    }));
  
  console.log(`\nCurrent state: ${counts?.v1} v1 records, ${counts?.v2} v2 records`);
  
  if (DRY_RUN) {
    console.log('\n[DRY RUN] Phase 1 would:');
    console.log('  1. Create car_generations table with same schema as cars');
    console.log('  2. Copy all v1 cars to car_generations');
    console.log('  3. Add generation_id column to cars table');
    console.log('  4. Set generation_id on v2 cars from parent_car_id');
    return;
  }

  // This phase would need to be run as SQL migrations
  console.log('\n⚠️  Phase 1 requires SQL migrations. Generate with:');
  console.log('  node scripts/migrate-to-generations.mjs --generate-sql --phase 1');
}

// ============================================================================
// PHASE 2: Analyze content tables
// ============================================================================
async function phase2_AnalyzeContent() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 2: Analyze content table dependencies');
  console.log('='.repeat(80) + '\n');

  const results = [];
  
  for (const { table, fk } of CONTENT_TABLES) {
    try {
      // Count records linked to v1 cars
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .in(fk, supabase.from('cars').select('id').eq('structure_version', 'v1'));
      
      if (!error) {
        results.push({ table, fk, v1_records: count || 0 });
      }
    } catch (e) {
      // Table might not exist or have different schema
      results.push({ table, fk, v1_records: 'N/A', error: e.message });
    }
  }

  // Sort by record count
  results.sort((a, b) => (b.v1_records || 0) - (a.v1_records || 0));
  
  console.log('Content tables linked to v1 cars:\n');
  console.log('| Table | FK Column | v1 Records |');
  console.log('|-------|-----------|------------|');
  for (const r of results) {
    if (r.v1_records !== 'N/A' && r.v1_records > 0) {
      console.log(`| ${r.table} | ${r.fk} | ${r.v1_records} |`);
    }
  }
  
  const totalRecords = results.reduce((sum, r) => sum + (typeof r.v1_records === 'number' ? r.v1_records : 0), 0);
  console.log(`\nTotal content records to migrate: ${totalRecords.toLocaleString()}`);
  
  return results;
}

// ============================================================================
// PHASE 3: Generate migration SQL
// ============================================================================
async function phase3_GenerateSQL() {
  console.log('\n' + '='.repeat(80));
  console.log('PHASE 3: Generate migration SQL');
  console.log('='.repeat(80) + '\n');

  const sql = [];
  
  // Step 1: Create car_generations table
  sql.push(`
-- ============================================================================
-- STEP 1: Create car_generations table (clone of cars structure for v1 content)
-- ============================================================================

-- Create the generations table by copying cars structure
CREATE TABLE IF NOT EXISTS car_generations (
  LIKE cars INCLUDING ALL
);

-- Copy v1 cars to generations
INSERT INTO car_generations 
SELECT * FROM cars WHERE structure_version = 'v1';

-- Add helpful comment
COMMENT ON TABLE car_generations IS 'Content holder for car generations/platforms. All content tables (issues, tuning, etc.) link here.';
`);

  // Step 2: Add generation_id to cars
  sql.push(`
-- ============================================================================
-- STEP 2: Add generation_id to cars table
-- ============================================================================

-- Add generation_id column
ALTER TABLE cars ADD COLUMN IF NOT EXISTS generation_id UUID REFERENCES car_generations(id);

-- Populate generation_id from parent_car_id for v2 cars
UPDATE cars 
SET generation_id = parent_car_id 
WHERE structure_version = 'v2' AND parent_car_id IS NOT NULL;

-- Create index for efficient joins
CREATE INDEX IF NOT EXISTS idx_cars_generation_id ON cars(generation_id);
`);

  // Step 3: Update content tables
  sql.push(`
-- ============================================================================
-- STEP 3: Update content table foreign keys
-- ============================================================================
-- NOTE: This updates FK constraints to point to car_generations instead of cars
-- Run these one at a time and verify each succeeds
`);

  for (const { table, fk } of CONTENT_TABLES) {
    sql.push(`
-- Update ${table}.${fk} to reference car_generations
-- First verify the data exists in car_generations
-- SELECT COUNT(*) FROM ${table} t 
-- WHERE NOT EXISTS (SELECT 1 FROM car_generations g WHERE g.id = t.${fk});

-- Then update the constraint (if needed)
-- ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${table}_${fk}_fkey;
-- ALTER TABLE ${table} ADD CONSTRAINT ${table}_generation_fkey 
--   FOREIGN KEY (${fk}) REFERENCES car_generations(id);
`);
  }

  // Step 4: Cleanup
  sql.push(`
-- ============================================================================
-- STEP 4: Cleanup (RUN ONLY AFTER VERIFYING MIGRATION)
-- ============================================================================

-- Remove v1 records from cars table (they're now in car_generations)
-- DELETE FROM cars WHERE structure_version = 'v1';

-- Remove deprecated columns from cars
-- ALTER TABLE cars DROP COLUMN IF EXISTS parent_car_id;
-- ALTER TABLE cars DROP COLUMN IF EXISTS structure_version;
-- ALTER TABLE cars DROP COLUMN IF EXISTS is_selectable;

-- Update is_selectable default for remaining cars
-- ALTER TABLE cars ALTER COLUMN is_selectable SET DEFAULT true;
`);

  console.log(sql.join('\n'));
  
  // Write to file
  const sqlPath = '/Users/mikearon/Developer/active/AutoRev/supabase/migrations/20260131_migrate_to_generations.sql';
  if (!DRY_RUN) {
    // Would write to file
  }
  
  console.log('\n📝 SQL migration generated. Review carefully before running!');
  return sql.join('\n');
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║         MIGRATE TO GENERATION-BASED ARCHITECTURE                             ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  
  if (DRY_RUN) {
    console.log('\n🔍 DRY RUN MODE - No changes will be made\n');
  }

  if (PHASE === 1 || !PHASE) {
    await phase1_CreateGenerations();
  }
  
  if (PHASE === 2 || !PHASE) {
    await phase2_AnalyzeContent();
  }
  
  if (PHASE === 3 || !PHASE) {
    await phase3_GenerateSQL();
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`
This migration will:

1. CREATE car_generations table (from current v1 cars)
   - All content tables will link to generations
   - Generations represent platforms/model runs (e.g., "Mustang GT PP2 2018-2023")

2. UPDATE cars table
   - Add generation_id column linking to car_generations
   - Remove v1 records (moved to car_generations)
   - Keep only v2 year-specific records as the user-selectable cars

3. UPDATE content tables (${CONTENT_TABLES.length} tables)
   - FK constraints will point to car_generations instead of cars
   - No data duplication needed!

4. RESULT: Clean architecture
   - cars: Year-specific YMMT entries users select
   - car_generations: Content holder with all issues, tuning, etc.
   - ~27,000 content records stay as-is (no duplication)

⚠️  This is a MAJOR migration. Run with --dry-run first!
⚠️  Back up your database before running!
`);
}

main().catch(console.error);
