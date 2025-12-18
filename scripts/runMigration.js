#!/usr/bin/env node

/**
 * Run Migration Script
 * 
 * Executes SQL migrations against Supabase.
 * 
 * Usage:
 *   node scripts/runMigration.js <migration-file>
 *   node scripts/runMigration.js supabase/migrations/021_enriched_car_data.sql
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function runMigration(filePath) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  
  console.log('='.repeat(60));
  console.log('Running Migration');
  console.log('='.repeat(60));
  console.log(`File: ${filePath}`);
  console.log(`Full Path: ${fullPath}`);
  console.log('='.repeat(60));
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(fullPath, 'utf8');
  
  // Split by statement (simple split on semicolons, being careful with functions)
  // For complex migrations, we'll run as a single statement
  console.log(`\nSQL Length: ${sql.length} characters`);
  console.log('\nExecuting migration...\n');
  
  try {
    // Use the rpc endpoint for raw SQL execution
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If the rpc doesn't exist, try alternative approach
      if (error.message.includes('function') || error.code === '42883') {
        console.log('Direct SQL execution not available via RPC.');
        console.log('Attempting table-by-table creation...\n');
        
        // Parse and execute CREATE TABLE statements individually
        await executeStatementsIndividually(sql);
      } else {
        throw error;
      }
    } else {
      console.log('✅ Migration completed successfully!');
    }
  } catch (err) {
    console.error('Migration error:', err.message);
    
    // If it's a "already exists" error, that's often OK
    if (err.message.includes('already exists')) {
      console.log('\n⚠️  Some objects already exist (migration may have been partially applied)');
    } else {
      process.exit(1);
    }
  }
}

async function executeStatementsIndividually(sql) {
  // Extract CREATE TABLE statements
  const tableMatches = sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g);
  const tables = [...tableMatches].map(m => m[1]);
  
  console.log(`Found ${tables.length} tables to check/create:`);
  tables.forEach(t => console.log(`  - ${t}`));
  console.log('');
  
  // For each table, check if it exists and try to create it
  for (const table of tables) {
    try {
      // Try to select from the table to see if it exists
      const { error } = await supabase.from(table).select('*').limit(1);
      
      if (error && error.code === '42P01') {
        // Table doesn't exist - this is expected for new tables
        console.log(`⏳ Table ${table} doesn't exist yet...`);
      } else if (!error) {
        console.log(`✅ Table ${table} already exists`);
      } else {
        console.log(`⚠️  Table ${table}: ${error.message}`);
      }
    } catch (err) {
      console.log(`❌ Error checking ${table}: ${err.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('IMPORTANT: Manual Migration Required');
  console.log('='.repeat(60));
  console.log('\nThe migration SQL needs to be run directly in Supabase.');
  console.log('\nOptions:');
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Copy the contents of the migration file');
  console.log('3. Paste and run in the SQL Editor');
  console.log('\nMigration file location:');
  console.log('  supabase/migrations/021_enriched_car_data.sql');
  console.log('\nAlternatively, use the Supabase CLI:');
  console.log('  npx supabase db push');
  console.log('='.repeat(60));
}

// Get migration file from args
const migrationFile = process.argv[2] || 'supabase/migrations/021_enriched_car_data.sql';

runMigration(migrationFile);





