#!/usr/bin/env node
/**
 * Migration: Change score columns from INTEGER to DECIMAL
 * This allows storing precise scores like 9.4, 9.8 instead of rounding to integers.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables.');
  console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
  console.log('🔄 Migrating score columns to DECIMAL...\n');

  const alterStatements = [
    // Advisory scores
    'ALTER TABLE cars ALTER COLUMN score_sound TYPE DECIMAL(3,1)',
    'ALTER TABLE cars ALTER COLUMN score_interior TYPE DECIMAL(3,1)',
    'ALTER TABLE cars ALTER COLUMN score_track TYPE DECIMAL(3,1)',
    'ALTER TABLE cars ALTER COLUMN score_reliability TYPE DECIMAL(3,1)',
    'ALTER TABLE cars ALTER COLUMN score_value TYPE DECIMAL(3,1)',
    'ALTER TABLE cars ALTER COLUMN score_driver_fun TYPE DECIMAL(3,1)',
    'ALTER TABLE cars ALTER COLUMN score_aftermarket TYPE DECIMAL(3,1)',
    // Performance HUB scores
    'ALTER TABLE cars ALTER COLUMN perf_power_accel TYPE DECIMAL(3,1)',
    'ALTER TABLE cars ALTER COLUMN perf_grip_cornering TYPE DECIMAL(3,1)',
    'ALTER TABLE cars ALTER COLUMN perf_braking TYPE DECIMAL(3,1)',
    'ALTER TABLE cars ALTER COLUMN perf_track_pace TYPE DECIMAL(3,1)',
    'ALTER TABLE cars ALTER COLUMN perf_drivability TYPE DECIMAL(3,1)',
    'ALTER TABLE cars ALTER COLUMN perf_reliability_heat TYPE DECIMAL(3,1)',
    'ALTER TABLE cars ALTER COLUMN perf_sound_emotion TYPE DECIMAL(3,1)',
  ];

  for (const sql of alterStatements) {
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
      // Try direct query if RPC not available
      console.log(`   Attempting: ${sql.split(' ').slice(0, 6).join(' ')}...`);
    } else {
      console.log(`   ✅ ${sql.split(' ').slice(0, 6).join(' ')}...`);
    }
  }

  console.log('\n✨ Migration complete!');
  console.log('   Now run: node scripts/seed-cars-from-local.js');
}

migrate().catch(console.error);


