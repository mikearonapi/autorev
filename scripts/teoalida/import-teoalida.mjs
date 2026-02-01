#!/usr/bin/env node

/**
 * Import Teoalida YMMT Database
 * 
 * This script imports the full Teoalida Year-Make-Model-Trim database
 * into a new cars_teoalida table for analysis and eventual migration.
 * 
 * Usage:
 *   node scripts/teoalida/import-teoalida.mjs --analyze    # Analyze only, no import
 *   node scripts/teoalida/import-teoalida.mjs --import     # Import to database
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const CSV_PATH = './Database - Teoalida Purchase/Year-Make-Model-Trim-Full-Specs-by-Teoalida.csv';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Generate URL-friendly slug from YMMT
 * Uses a counter suffix for duplicates
 */
const slugCounts = new Map();

function generateSlug(year, make, model, trim, teoalidaId) {
  const parts = [year, make, model, trim].filter(Boolean);
  let baseSlug = parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // Track slug usage and add suffix for duplicates
  const count = slugCounts.get(baseSlug) || 0;
  slugCounts.set(baseSlug, count + 1);
  
  // First occurrence keeps base slug, subsequent get suffix
  if (count > 0) {
    return `${baseSlug}-${count + 1}`;
  }
  return baseSlug;
}

/**
 * Generate display name
 */
function generateDisplayName(year, make, model, trim) {
  const parts = [year, make, model, trim].filter(Boolean);
  return parts.join(' ');
}

/**
 * Parse numeric value, return null if invalid
 */
function parseNumber(value) {
  if (!value || value === '' || value === '-') return null;
  const num = parseFloat(value.replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

/**
 * Parse integer value
 */
function parseIntValue(value) {
  const num = parseNumber(value);
  return num !== null ? Math.round(num) : null;
}

/**
 * Parse MSRP (remove $ and commas)
 */
function parseMSRP(value) {
  if (!value || value === '' || value === '-') return null;
  const cleaned = value.replace(/[$,]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : Math.round(num);
}

/**
 * Transform Teoalida row to our schema
 */
function transformRow(row) {
  const year = parseIntValue(row['Year']);
  const make = row['Make']?.trim();
  const model = row['Model']?.trim();
  const trim = row['Trim']?.trim() || null;
  const teoalidaId = row['ID'];
  
  if (!year || !make || !model) {
    return null;
  }
  
  return {
    teoalida_id: teoalidaId,
    year,
    make,
    model,
    trim,
    trim_description: row['Trim (description)'] || null,
    slug: generateSlug(year, make, model, trim, teoalidaId),
    name: generateDisplayName(year, make, model, trim),
    
    // Specs
    hp: parseIntValue(row['Horsepower (HP)']),
    hp_rpm: parseIntValue(row['Horsepower (rpm)']),
    torque: parseIntValue(row['Torque (ft-lbs)']),
    torque_rpm: parseIntValue(row['Torque (rpm)']),
    engine_size: parseNumber(row['Engine size (l)']),
    cylinders: row['Cylinders']?.trim() || null,
    engine_type: row['Engine type']?.trim() || null,
    transmission: row['Transmission']?.trim() || null,
    drive_type: row['Drive type']?.trim() || null,
    
    // Dimensions
    curb_weight: parseIntValue(row['Curb weight (lbs)']),
    length_in: parseNumber(row['Length (in)']),
    width_in: parseNumber(row['Width (in)']),
    height_in: parseNumber(row['Height (in)']),
    wheelbase_in: parseNumber(row['Wheelbase (in)']),
    ground_clearance_in: parseNumber(row['Ground clearance (in)']),
    
    // Pricing
    msrp: parseMSRP(row['Base MSRP']),
    
    // Classification
    body_type: row['Body type']?.trim() || null,
    platform_code: row['Platform code / generation number']?.trim() || null,
    car_classification: row['Car classification']?.trim() || null,
    country_of_origin: row['Country of origin']?.trim() || null,
    
    // Fuel
    fuel_type: row['Fuel type']?.trim() || null,
    mpg_city: parseIntValue(row['EPA city/highway MPG']?.split('/')[0]),
    mpg_highway: parseIntValue(row['EPA city/highway MPG']?.split('/')[1]?.replace(' MPG', '')),
    mpg_combined: parseIntValue(row['EPA combined MPG']),
    fuel_tank_capacity: parseNumber(row['Fuel tank capacity (gal)']),
    
    // Towing/Payload
    max_towing: parseIntValue(row['Maximum towing capacity (lbs)']),
    max_payload: parseIntValue(row['Maximum payload (lbs)']),
    
    // Image
    image_url: row['Image URL']?.trim() || null,
    
    // Source
    source_url: row['Source URL']?.trim() || null,
  };
}

/**
 * Read and parse CSV file
 */
async function readCSV() {
  return new Promise((resolve, reject) => {
    const records = [];
    
    createReadStream(CSV_PATH, { encoding: 'latin1' })
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
      }))
      .on('data', (row) => {
        const transformed = transformRow(row);
        if (transformed) {
          records.push(transformed);
        }
      })
      .on('end', () => resolve(records))
      .on('error', reject);
  });
}

/**
 * Analyze the data without importing
 */
async function analyze() {
  console.log('📊 Analyzing Teoalida CSV...\n');
  
  const records = await readCSV();
  
  console.log(`Total records: ${records.length.toLocaleString()}`);
  
  // Unique makes
  const makes = [...new Set(records.map(r => r.make))].sort();
  console.log(`\nUnique makes: ${makes.length}`);
  
  // Year range
  const years = records.map(r => r.year).filter(Boolean);
  console.log(`Year range: ${Math.min(...years)} - ${Math.max(...years)}`);
  
  // HP coverage
  const withHP = records.filter(r => r.hp);
  console.log(`\nRecords with HP: ${withHP.length.toLocaleString()} (${(withHP.length/records.length*100).toFixed(1)}%)`);
  
  // Torque coverage
  const withTorque = records.filter(r => r.torque);
  console.log(`Records with Torque: ${withTorque.length.toLocaleString()} (${(withTorque.length/records.length*100).toFixed(1)}%)`);
  
  // MSRP coverage
  const withMSRP = records.filter(r => r.msrp);
  console.log(`Records with MSRP: ${withMSRP.length.toLocaleString()} (${(withMSRP.length/records.length*100).toFixed(1)}%)`);
  
  // Platform codes
  const withPlatform = records.filter(r => r.platform_code && r.platform_code !== '-');
  console.log(`Records with Platform Code: ${withPlatform.length.toLocaleString()} (${(withPlatform.length/records.length*100).toFixed(1)}%)`);
  
  // Sample records
  console.log('\n📝 Sample records:');
  const samples = [
    records.find(r => r.make === 'Ford' && r.model === 'Mustang' && r.trim?.includes('GT') && r.year === 2020),
    records.find(r => r.make === 'BMW' && r.model?.includes('M3') && r.year >= 2020),
    records.find(r => r.make === 'Chevrolet' && r.trim?.includes('Z06')),
    records.find(r => r.make === 'Dodge' && r.trim?.includes('Hellcat')),
  ].filter(Boolean);
  
  for (const s of samples) {
    console.log(`  ${s.name}: ${s.hp} HP, ${s.torque} lb-ft, ${s.msrp ? '$' + s.msrp.toLocaleString() : 'No MSRP'}`);
    console.log(`    Platform: ${s.platform_code || 'N/A'}, Slug: ${s.slug}`);
  }
  
  return records;
}

/**
 * Create the cars_teoalida table
 */
async function createTable() {
  const sql = `
    -- Drop if exists (for clean re-import)
    DROP TABLE IF EXISTS cars_teoalida;
    
    -- Create new table
    CREATE TABLE cars_teoalida (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      teoalida_id TEXT UNIQUE,
      
      -- YMMT
      year INTEGER NOT NULL,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      trim TEXT,
      trim_description TEXT,
      
      -- Naming/Routing
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      
      -- Specs
      hp INTEGER,
      hp_rpm INTEGER,
      torque INTEGER,
      torque_rpm INTEGER,
      engine_size DECIMAL(4,2),
      cylinders TEXT,
      engine_type TEXT,
      transmission TEXT,
      drive_type TEXT,
      
      -- Dimensions
      curb_weight INTEGER,
      length_in DECIMAL(6,2),
      width_in DECIMAL(6,2),
      height_in DECIMAL(6,2),
      wheelbase_in DECIMAL(6,2),
      ground_clearance_in DECIMAL(6,2),
      
      -- Pricing
      msrp INTEGER,
      
      -- Classification
      body_type TEXT,
      platform_code TEXT,
      car_classification TEXT,
      country_of_origin TEXT,
      
      -- Fuel
      fuel_type TEXT,
      mpg_city INTEGER,
      mpg_highway INTEGER,
      mpg_combined INTEGER,
      fuel_tank_capacity DECIMAL(5,2),
      
      -- Towing
      max_towing INTEGER,
      max_payload INTEGER,
      
      -- Image
      image_url TEXT,
      source_url TEXT,
      
      -- Metadata
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Indexes
    CREATE INDEX idx_teoalida_ymmt ON cars_teoalida(year, make, model, trim);
    CREATE INDEX idx_teoalida_make_model ON cars_teoalida(make, model);
    CREATE INDEX idx_teoalida_slug ON cars_teoalida(slug);
    CREATE INDEX idx_teoalida_platform ON cars_teoalida(platform_code);
    CREATE INDEX idx_teoalida_year ON cars_teoalida(year);
  `;
  
  console.log('🔨 Creating cars_teoalida table...');
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    // Try direct query if RPC doesn't exist
    console.log('Note: Using individual statements...');
    // Table will be created via migration instead
    throw new Error('Please run the SQL migration manually or create exec_sql RPC');
  }
  
  console.log('✅ Table created');
}

/**
 * Import records in batches
 */
async function importRecords(records) {
  const BATCH_SIZE = 500;
  let imported = 0;
  let errors = 0;
  
  console.log(`\n📥 Importing ${records.length.toLocaleString()} records...`);
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    
    const { error } = await supabase
      .from('cars_teoalida')
      .insert(batch);
    
    if (error) {
      console.error(`❌ Batch ${i}-${i + BATCH_SIZE} failed:`, error.message);
      errors += batch.length;
    } else {
      imported += batch.length;
    }
    
    // Progress update
    if ((i + BATCH_SIZE) % 5000 === 0 || i + BATCH_SIZE >= records.length) {
      const pct = ((i + BATCH_SIZE) / records.length * 100).toFixed(1);
      console.log(`  Progress: ${Math.min(i + BATCH_SIZE, records.length).toLocaleString()} / ${records.length.toLocaleString()} (${pct}%)`);
    }
  }
  
  console.log(`\n✅ Import complete: ${imported.toLocaleString()} imported, ${errors} errors`);
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const shouldImport = args.includes('--import');
  
  try {
    // Always analyze first
    const records = await analyze();
    
    if (shouldImport) {
      console.log('\n' + '='.repeat(50));
      console.log('Starting import to database...');
      console.log('='.repeat(50));
      
      // Note: Table creation requires manual SQL execution
      // await createTable();
      
      await importRecords(records);
    } else {
      console.log('\n💡 Run with --import to import to database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
