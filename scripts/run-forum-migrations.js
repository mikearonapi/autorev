#!/usr/bin/env node
/**
 * Run Forum Intelligence Migrations
 * 
 * This script runs the forum intelligence schema and seed migrations
 * directly via the Supabase client.
 * 
 * Usage:
 *   node scripts/run-forum-migrations.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Import supabase after env is loaded
const { supabaseServiceRole } = await import('../lib/supabase.js');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function checkTableExists(tableName) {
  const { data, error } = await supabaseServiceRole
    .from(tableName)
    .select('*')
    .limit(0);
  return !error;
}

async function runMigration(filename, description) {
  log(`\n📦 Running: ${description}`, 'cyan');
  log(`   File: ${filename}`, 'dim');
  
  const filepath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  
  try {
    // Read the migration file
    const sql = await fs.readFile(filepath, 'utf8');
    
    // Execute via Supabase REST API - we need to use raw SQL
    // Unfortunately, supabase-js doesn't support raw SQL execution
    // We'll need to use the management API or run via psql
    
    // For now, let's check if tables exist and report status
    log(`   ⚠️  Cannot run raw SQL via supabase-js client`, 'yellow');
    log(`   To run this migration, use one of these methods:`, 'dim');
    log(`   1. Run via Supabase Dashboard > SQL Editor`, 'dim');
    log(`   2. Run via psql: psql <connection_string> -f ${filepath}`, 'dim');
    log(`   3. Use supabase CLI: supabase db push`, 'dim');
    
    return false;
  } catch (err) {
    log(`   ✗ Error: ${err.message}`, 'red');
    return false;
  }
}

async function main() {
  console.log('\n' + '═'.repeat(60));
  log('  FORUM INTELLIGENCE MIGRATION STATUS', 'cyan');
  console.log('═'.repeat(60));

  if (!supabaseServiceRole) {
    log('\n✗ Supabase service role not configured', 'red');
    log('  Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY', 'dim');
    process.exit(1);
  }

  log('\nChecking table status...', 'cyan');

  // Check each table
  const tables = [
    'forum_sources',
    'forum_scrape_runs',
    'forum_scraped_threads',
    'community_insights',
    'community_insight_sources'
  ];

  let allExist = true;
  for (const table of tables) {
    const exists = await checkTableExists(table);
    if (exists) {
      log(`  ✓ ${table} exists`, 'green');
    } else {
      log(`  ✗ ${table} does not exist`, 'yellow');
      allExist = false;
    }
  }

  if (allExist) {
    log('\n✓ All tables exist!', 'green');
    
    // Check if forum_sources has data
    const { data: sources, error } = await supabaseServiceRole
      .from('forum_sources')
      .select('slug, name, is_active')
      .limit(10);
    
    if (sources && sources.length > 0) {
      log('\nForum sources seeded:', 'cyan');
      for (const s of sources) {
        log(`  - ${s.name} (${s.slug}) - ${s.is_active ? 'active' : 'inactive'}`, 'dim');
      }
    } else {
      log('\n⚠️  Forum sources table is empty. Run the seed migration.', 'yellow');
    }
    
    return;
  }

  // Tables don't exist - provide instructions
  log('\n' + '─'.repeat(60), 'dim');
  log('\nMigrations need to be run. Options:', 'yellow');
  
  log('\n1. Via Supabase Dashboard:', 'cyan');
  log('   - Go to your Supabase project', 'dim');
  log('   - Click "SQL Editor" in the sidebar', 'dim');
  log('   - Copy & paste the contents of these files:', 'dim');
  log('     a. supabase/migrations/046_forum_intelligence_schema.sql', 'dim');
  log('     b. supabase/migrations/047_seed_forum_sources.sql', 'dim');
  log('   - Click "Run" for each', 'dim');
  
  log('\n2. Via Supabase CLI:', 'cyan');
  log('   supabase link --project-ref <your-project-ref>', 'dim');
  log('   supabase db push', 'dim');
  
  log('\n3. Via psql (if you have direct DB access):', 'cyan');
  log('   psql <connection_string> -f supabase/migrations/046_forum_intelligence_schema.sql', 'dim');
  log('   psql <connection_string> -f supabase/migrations/047_seed_forum_sources.sql', 'dim');

  console.log('\n' + '═'.repeat(60) + '\n');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});






