#!/usr/bin/env node
/**
 * Backfill Model and Trim to Database
 * 
 * Reads the reviewed CSV from extract-model-trim.mjs and updates the database.
 * 
 * Usage:
 *   node scripts/backfill-model-trim.mjs
 *   node scripts/backfill-model-trim.mjs --dry-run
 *   node scripts/backfill-model-trim.mjs --csv path/to/file.csv
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    'csv': { type: 'string', default: path.join(__dirname, 'model-trim-extraction.csv') },
    'verbose': { type: 'boolean', default: false },
  },
});

const dryRun = values['dry-run'];
const csvPath = values['csv'];
const verbose = values['verbose'];

/**
 * Parse CSV file
 */
function parseCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ CSV file not found: ${filePath}`);
    console.error('   Run extract-model-trim.mjs first to generate it.');
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Skip header
  const dataLines = lines.slice(1);
  
  return dataLines.map(line => {
    // Parse CSV with quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current); // Last field

    const [id, slug, name, brand, model, trim] = values;
    return { id, slug, name, brand, model, trim };
  });
}

/**
 * Update database with model/trim values
 */
async function updateDatabase(records) {
  let updated = 0;
  let errors = 0;

  for (const record of records) {
    if (!record.id || !record.model || !record.trim) {
      console.error(`⚠️  Skipping invalid record:`, record);
      errors++;
      continue;
    }

    if (dryRun) {
      if (verbose) {
        console.log(`   Would update ${record.slug}: model="${record.model}", trim="${record.trim}"`);
      }
      updated++;
      continue;
    }

    const { error } = await supabase
      .from('cars')
      .update({
        model: record.model,
        trim: record.trim
      })
      .eq('id', record.id);

    if (error) {
      console.error(`❌ Error updating ${record.slug}:`, error.message);
      errors++;
    } else {
      if (verbose) {
        console.log(`   ✅ Updated ${record.slug}: model="${record.model}", trim="${record.trim}"`);
      }
      updated++;
    }
  }

  return { updated, errors };
}

/**
 * Verify the update
 */
async function verifyUpdate() {
  const { data, error } = await supabase
    .from('cars')
    .select('id, name, model, trim')
    .is('model', null)
    .limit(10);

  if (error) {
    console.error('❌ Error verifying:', error);
    return;
  }

  if (data.length === 0) {
    console.log('✅ All cars have model/trim populated');
  } else {
    console.log(`⚠️  ${data.length} cars still missing model/trim:`);
    data.forEach(car => console.log(`   - ${car.name}`));
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚗 Model/Trim Backfill Script');
  console.log('==============================\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No database changes will be made\n');
  }

  // Parse CSV
  console.log(`📥 Reading CSV from: ${csvPath}`);
  const records = parseCsv(csvPath);
  console.log(`   Found ${records.length} records\n`);

  // Preview
  console.log('📋 Sample records:');
  records.slice(0, 5).forEach(r => {
    console.log(`   ${r.name} → model: "${r.model}", trim: "${r.trim}"`);
  });
  console.log();

  // Update database
  console.log('📤 Updating database...');
  const { updated, errors } = await updateDatabase(records);
  
  console.log(`\n📊 Results:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors: ${errors}`);

  // Verify
  if (!dryRun) {
    console.log('\n🔍 Verifying update...');
    await verifyUpdate();
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
