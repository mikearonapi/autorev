#!/usr/bin/env node

/**
 * Run Migration via PostgreSQL Direct Connection
 * 
 * Uses the pg package to execute SQL directly against the database.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Try direct connection first, then pooler
const connectionString = process.env.POSTGRES_URL_NON_POOLING 
  || process.env.DATABASE_URL 
  || `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE}`;

if (!connectionString) {
  console.error('Missing POSTGRES_URL_NON_POOLING or DATABASE_URL');
  process.exit(1);
}

const { Client } = pg;

async function runMigration() {
  const migrationPath = path.join(__dirname, '..', 'supabase/migrations/021_enriched_car_data.sql');
  
  console.log('='.repeat(60));
  console.log('Running Migration via Direct PostgreSQL Connection');
  console.log('='.repeat(60));
  console.log(`Migration file: ${migrationPath}`);
  
  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found!');
    process.exit(1);
  }
  
  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log(`SQL size: ${sql.length} characters`);
  console.log('='.repeat(60));
  
  // Direct connection to Supabase
  const directConnectionString = `postgresql://postgres:${process.env.POSTGRES_PASSWORD}@db.pcbkerqlfcjbnhaxjyqj.supabase.co:5432/postgres`;
  
  const client = new Client({
    connectionString: directConnectionString,
    ssl: true,
  });
  
  try {
    console.log('\nConnecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    console.log('Executing migration...');
    await client.query(sql);
    console.log('\n✅ Migration completed successfully!');
    
    // Verify tables were created
    console.log('\nVerifying tables...\n');
    
    const tables = [
      'car_fuel_economy',
      'car_safety_data',
      'car_recalls',
      'car_market_pricing',
      'car_price_history',
      'car_expert_reviews',
      'car_auction_results',
      'scrape_jobs',
      'car_manual_data',
    ];
    
    for (const table of tables) {
      try {
        const result = await client.query(
          `SELECT COUNT(*) FROM information_schema.tables WHERE table_name = $1`,
          [table]
        );
        if (result.rows[0].count > 0) {
          console.log(`  ✅ ${table}`);
        } else {
          console.log(`  ❌ ${table} - NOT FOUND`);
        }
      } catch (err) {
        console.log(`  ❌ ${table} - ERROR: ${err.message}`);
      }
    }
    
  } catch (err) {
    console.error('\n❌ Migration error:', err.message);
    
    if (err.message.includes('already exists')) {
      console.log('\n⚠️  Some objects already exist. This is usually OK.');
    } else {
      process.exit(1);
    }
  } finally {
    await client.end();
    console.log('\nConnection closed.');
  }
}

runMigration();
