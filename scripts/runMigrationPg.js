#!/usr/bin/env node

/**
 * Run a Supabase migration via PostgreSQL direct connection.
 *
 * This is the most reliable way to apply large SQL migrations (no RPC required).
 *
 * Usage:
 *   node scripts/runMigrationPg.js supabase/migrations/040_seed_multi_brand_parts.sql
 *
 * Env (from .env.local / .env):
 * - POSTGRES_URL_NON_POOLING (preferred) OR DATABASE_URL OR POSTGRES_* pieces
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { URL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Some environments (enterprise proxies, older Node trust stores) can surface
// "self-signed certificate in certificate chain" errors when connecting to Supabase.
//
// To proceed anyway, opt-in explicitly:
//   ALLOW_INSECURE_TLS_FOR_MIGRATIONS=1 node scripts/runMigrationPg.js <file>
const allowInsecureTls = process.env.ALLOW_INSECURE_TLS_FOR_MIGRATIONS === '1';
if (allowInsecureTls) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.warn('⚠️  Insecure TLS enabled for this run (ALLOW_INSECURE_TLS_FOR_MIGRATIONS=1)');
}

// Try direct connection first, then pooler
const connectionString = process.env.POSTGRES_URL_NON_POOLING 
  || process.env.DATABASE_URL 
  || `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE}`;

if (!connectionString) {
  console.error('Missing POSTGRES_URL_NON_POOLING or DATABASE_URL');
  process.exit(1);
}

const { Client } = pg;

function sanitizePostgresConnectionString(raw) {
  // Avoid TLS verification failures from sslmode=verify-* in env-provided URLs.
  // We force sslmode=require and also use rejectUnauthorized=false in the client.
  try {
    const u = new URL(raw);
    if (u.protocol === 'postgres:' || u.protocol === 'postgresql:') {
      u.searchParams.delete('sslmode');
      u.searchParams.delete('sslrootcert');
      u.searchParams.delete('sslcert');
      u.searchParams.delete('sslkey');
      u.searchParams.set('sslmode', 'require');
      return u.toString();
    }
  } catch {
    // Not a URL (or unparsable) - leave as-is
  }
  return raw;
}

function resolveMigrationPathFromArgs() {
  const arg = process.argv[2] || 'supabase/migrations/040_seed_multi_brand_parts.sql';
  return path.resolve(__dirname, '..', arg);
}

async function runMigration() {
  const migrationPath = resolveMigrationPathFromArgs();
  
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

  const client = new Client({
    connectionString: sanitizePostgresConnectionString(connectionString),
    ssl: allowInsecureTls ? { rejectUnauthorized: false } : { rejectUnauthorized: true },
  });
  
  try {
    console.log('\nConnecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    console.log('Executing migration...');
    await client.query(sql);
    console.log('\n✅ Migration completed successfully!');

    // Post-migration validations (requested)
    console.log('\nRunning post-migration validations...\n');

    const gapByBrand = await client.query(
      `
      SELECT c.brand,
             COUNT(DISTINCT c.id) as total_cars,
             COUNT(DISTINCT pf.car_id) as cars_with_fitments,
             COUNT(DISTINCT c.id) - COUNT(DISTINCT pf.car_id) as gap
      FROM cars c
      LEFT JOIN part_fitments pf ON pf.car_id = c.id
      GROUP BY c.brand
      ORDER BY gap DESC;
      `
    );
    console.log('Validation: cars with fitments by brand (gap should be 0):');
    console.table(gapByBrand.rows);

    const underMin = await client.query(
      `
      SELECT c.slug, c.name, COUNT(pf.id) as fitment_count
      FROM cars c
      LEFT JOIN part_fitments pf ON pf.car_id = c.id
      GROUP BY c.slug, c.name
      HAVING COUNT(pf.id) < 5
      ORDER BY fitment_count;
      `
    );
    console.log('Validation: cars with < 5 fitments (should be empty):');
    console.table(underMin.rows);

    const totals = await client.query(
      `
      SELECT
        (SELECT COUNT(*)::int FROM parts) as total_parts,
        (SELECT COUNT(*)::int FROM part_fitments) as total_fitments;
      `
    );
    console.log('Validation: totals');
    console.table(totals.rows);
    
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












