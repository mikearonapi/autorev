#!/usr/bin/env node

/**
 * Batch Recalls Enrichment
 * 
 * Fetches NHTSA recalls for all cars missing recall data.
 * Uses the existing recallService.js infrastructure.
 * 
 * Usage:
 *   node scripts/enrichRecallsAll.js                    # All missing cars
 *   node scripts/enrichRecallsAll.js --limit=10        # First 10 missing
 *   node scripts/enrichRecallsAll.js --all             # All cars (re-fetch)
 *   node scripts/enrichRecallsAll.js --car=bmw-m3-e46  # Single car
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchRecallRowsForCar, upsertRecallRows } from '../lib/recallService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Parse arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value === undefined ? true : value;
  }
  return acc;
}, {});

const LIMIT = args.limit ? parseInt(args.limit) : null;
const SKIP = args.skip ? parseInt(args.skip) : 0;
const DELAY_MS = args.delay ? parseInt(args.delay) : 1000;
const ALL_CARS = args.all || false;
const SINGLE_CAR = args.car || null;
const DRY_RUN = args['dry-run'] || false;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('='.repeat(70));
  console.log('🔄 NHTSA Recalls Enrichment');
  console.log('='.repeat(70));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Delay: ${DELAY_MS}ms between cars`);
  console.log('='.repeat(70));

  let carsToProcess = [];

  if (SINGLE_CAR) {
    // Single car mode
    const { data: car, error } = await supabase
      .from('cars')
      .select('slug, name, brand, years')
      .eq('slug', SINGLE_CAR)
      .single();

    if (error || !car) {
      console.error(`❌ Car not found: ${SINGLE_CAR}`);
      process.exit(1);
    }
    carsToProcess = [car];
    console.log(`Single car mode: ${car.name}`);
  } else if (ALL_CARS) {
    // All cars mode (re-fetch everything)
    const { data: cars, error } = await supabase
      .from('cars')
      .select('slug, name, brand, years')
      .order('name');

    if (error || !cars) {
      console.error('❌ Error fetching cars:', error?.message);
      process.exit(1);
    }
    carsToProcess = cars;
    console.log(`All cars mode: ${carsToProcess.length} cars`);
  } else {
    // Missing cars mode (default)
    const { data: existingRecalls } = await supabase
      .from('car_recalls')
      .select('car_slug');

    const carsWithRecalls = new Set(existingRecalls?.map(r => r.car_slug) || []);

    const { data: allCars, error } = await supabase
      .from('cars')
      .select('slug, name, brand, years')
      .order('name');

    if (error || !allCars) {
      console.error('❌ Error fetching cars:', error?.message);
      process.exit(1);
    }

    carsToProcess = allCars.filter(car => !carsWithRecalls.has(car.slug));
    console.log(`Missing cars mode: ${carsToProcess.length} of ${allCars.length} cars need recalls`);
  }

  // Apply skip and limit
  carsToProcess = carsToProcess.slice(SKIP);
  if (LIMIT) {
    carsToProcess = carsToProcess.slice(0, LIMIT);
  }

  console.log(`\nProcessing: ${carsToProcess.length} cars\n`);
  console.log('='.repeat(70));

  let totalRecalls = 0;
  let totalUpserted = 0;
  let carsWithRecalls = 0;
  let carsWithErrors = 0;

  for (let i = 0; i < carsToProcess.length; i++) {
    const car = carsToProcess[i];

    process.stdout.write(`[${String(i + 1).padStart(3)}/${carsToProcess.length}] ${car.name.padEnd(45)}`);

    try {
      const { rows, errors } = await fetchRecallRowsForCar({
        car,
        maxYears: 25,
        perRequestTimeoutMs: 15000,
        retries: 2,
      });

      if (errors.length > 0) {
        console.log(` ⚠️  ${errors.length} errors`);
        carsWithErrors++;
        if (args.verbose) {
          errors.forEach(e => console.log(`      ${e}`));
        }
      }

      if (rows.length > 0) {
        if (!DRY_RUN) {
          const { upserted, success, error } = await upsertRecallRows({
            client: supabase,
            rows,
          });

          if (success) {
            console.log(` ✅ ${rows.length} recalls`);
            totalRecalls += rows.length;
            totalUpserted += upserted;
            carsWithRecalls++;
          } else {
            console.log(` ❌ DB Error: ${error}`);
            carsWithErrors++;
          }
        } else {
          console.log(` [DRY RUN] ${rows.length} recalls found`);
          totalRecalls += rows.length;
          carsWithRecalls++;
        }
      } else {
        console.log(` ⭕ No recalls`);
      }
    } catch (err) {
      console.log(` ❌ Error: ${err.message}`);
      carsWithErrors++;
    }

    if (i < carsToProcess.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 Summary');
  console.log('='.repeat(70));
  console.log(`Cars processed:    ${carsToProcess.length}`);
  console.log(`Cars with recalls: ${carsWithRecalls}`);
  console.log(`Cars with errors:  ${carsWithErrors}`);
  console.log(`Total recalls:     ${totalRecalls}`);
  console.log(`Rows upserted:     ${totalUpserted}`);
  console.log('='.repeat(70));

  // Show final coverage
  const { count: totalCars } = await supabase
    .from('cars')
    .select('*', { count: 'exact', head: true });

  const { data: recallCoverage } = await supabase
    .from('car_recalls')
    .select('car_slug');

  const uniqueCarsWithRecalls = new Set(recallCoverage?.map(r => r.car_slug) || []);

  console.log(`\n📈 Coverage: ${uniqueCarsWithRecalls.size}/${totalCars} cars (${Math.round(uniqueCarsWithRecalls.size / totalCars * 100)}%)`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

