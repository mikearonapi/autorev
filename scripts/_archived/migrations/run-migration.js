#!/usr/bin/env node

/**
 * Run YouTube Enrichment Migration
 * 
 * Executes the 005_youtube_enrichment_tables.sql migration against Supabase.
 * Uses the service role key for admin-level access.
 * 
 * Usage: node scripts/run-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!SUPABASE_URL) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role (admin) access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Starting YouTube Enrichment Migration...\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  
  // Read the migration file
  const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '005_youtube_enrichment_tables.sql');
  let migrationSQL;
  
  try {
    migrationSQL = readFileSync(migrationPath, 'utf8');
    console.log(`✅ Loaded migration file: ${migrationPath}\n`);
  } catch (error) {
    console.error(`❌ Failed to read migration file: ${error.message}`);
    process.exit(1);
  }

  // Split by semicolons but be careful about strings containing semicolons
  // For safety, we'll execute the entire migration as individual statements
  const statements = migrationSQL
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 80).replace(/\n/g, ' ');
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        // Try direct query if RPC doesn't exist
        throw error;
      }
      
      successCount++;
      console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`);
    } catch (rpcError) {
      // The exec_sql RPC might not exist, which is expected
      // We'll track this and provide instructions
      if (rpcError.message?.includes('function') || rpcError.code === 'PGRST202') {
        console.log(`⚠️  Statement ${i + 1}: Needs direct DB access (RPC not available)`);
        errorCount++;
        errors.push({ index: i + 1, statement: preview, error: 'Needs Supabase Dashboard or direct DB connection' });
      } else {
        errorCount++;
        errors.push({ index: i + 1, statement: preview, error: rpcError.message });
        console.log(`❌ [${i + 1}/${statements.length}] Failed: ${rpcError.message?.substring(0, 50)}...`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed/Skipped: ${errorCount}`);
  console.log('='.repeat(60) + '\n');

  if (errorCount > 0) {
    console.log('⚠️  Some statements could not be executed via the REST API.');
    console.log('   You need to run the migration directly in Supabase:\n');
    console.log('   1. Go to your Supabase Dashboard: https://supabase.com/dashboard');
    console.log('   2. Select your project');
    console.log('   3. Go to "SQL Editor"');
    console.log('   4. Paste and run the contents of:');
    console.log(`      supabase/migrations/005_youtube_enrichment_tables.sql\n`);
    
    console.log('   Or use the Supabase CLI with a direct database connection:');
    console.log('   npx supabase db push\n');
  }
}

// Check if tables already exist
async function checkExistingTables() {
  console.log('🔍 Checking for existing YouTube tables...\n');
  
  const tables = ['youtube_channels', 'youtube_videos', 'youtube_video_car_links'];
  const existingTables = [];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    if (!error) {
      existingTables.push(table);
      console.log(`   ✅ ${table} - exists`);
    } else if (error.code === '42P01') {
      console.log(`   ⬜ ${table} - does not exist`);
    } else {
      console.log(`   ⚠️  ${table} - ${error.message}`);
    }
  }
  
  return existingTables;
}

async function main() {
  const existingTables = await checkExistingTables();
  
  console.log('');
  
  if (existingTables.length === 3) {
    console.log('✅ All YouTube enrichment tables already exist!');
    console.log('   Migration has already been applied.\n');
    
    // Check for seed data
    const { data: channels } = await supabase
      .from('youtube_channels')
      .select('channel_name, credibility_tier')
      .limit(5);
    
    if (channels && channels.length > 0) {
      console.log('📺 Sample channels in database:');
      channels.forEach(ch => console.log(`   - ${ch.channel_name} (${ch.credibility_tier})`));
    }
    
    return;
  }
  
  // If tables don't exist, provide instructions
  console.log('📋 YouTube tables need to be created.');
  console.log('   Please run the migration in Supabase Dashboard:\n');
  console.log('   1. Go to: https://supabase.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Go to "SQL Editor"');
  console.log('   4. Copy and paste the contents of:');
  console.log('      supabase/migrations/005_youtube_enrichment_tables.sql');
  console.log('   5. Click "Run"\n');
}

main().catch(console.error);






