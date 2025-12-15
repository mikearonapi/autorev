#!/usr/bin/env node

/**
 * AI-Powered Transmission Fluid Data Enrichment
 * 
 * Uses OpenAI to research and fill transmission fluid specs for vehicles
 * that are missing this data.
 * 
 * Usage:
 *   node scripts/enrichTransFluidAI.js                    # All missing
 *   node scripts/enrichTransFluidAI.js --limit=10         # First 10
 *   node scripts/enrichTransFluidAI.js --car=bmw-m3-e46   # Single car
 *   node scripts/enrichTransFluidAI.js --dry-run          # Preview only
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

if (!openaiKey) {
  console.error('❌ Missing OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const openai = new OpenAI({ apiKey: openaiKey });

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
const DELAY_MS = args.delay ? parseInt(args.delay) : 2000;
const SINGLE_CAR = args.car || null;
const DRY_RUN = args['dry-run'] || false;
const VERBOSE = args.verbose || args.v || false;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Use AI to research transmission fluid specs for a vehicle
 */
async function researchTransFluid(car) {
  const prompt = `You are an automotive fluids specialist. I need accurate transmission fluid specifications for the following vehicle:

Vehicle: ${car.name}
Brand: ${car.brand}
Years: ${car.years}
Transmission: (see vehicle specs)

Please provide the following information in JSON format:
{
  "trans_fluid_manual": "Manual transmission fluid type/spec (e.g., 'MTF-LT-2', 'GL-4 75W-90') or null if N/A",
  "trans_fluid_manual_capacity": "Capacity in quarts (e.g., '2.1') or null if N/A",
  "trans_fluid_auto": "Automatic/DCT fluid type/spec (e.g., 'ATF+4', 'Dexron VI') or null if N/A", 
  "trans_fluid_auto_capacity": "Capacity in quarts (e.g., '9.0') or null if N/A",
  "trans_fluid_change_interval_miles": 60000,
  "transmission_types_available": ["manual", "auto", "dct"],
  "confidence": "high/medium/low",
  "source_notes": "Brief note on the specification source"
}

IMPORTANT:
- Many performance cars have BOTH manual and automatic/DCT options - fill in BOTH if applicable
- Use OEM-specified fluid types when known
- If the car only comes with one transmission type, set the other to null
- Return ONLY valid JSON, no other text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    // Extract JSON from response
    let jsonStr = content;
    if (content.includes('```')) {
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) jsonStr = match[1].trim();
    }

    const data = JSON.parse(jsonStr);
    return {
      trans_fluid_manual: data.trans_fluid_manual || null,
      trans_fluid_manual_capacity: data.trans_fluid_manual_capacity || null,
      trans_fluid_auto: data.trans_fluid_auto || null,
      trans_fluid_auto_capacity: data.trans_fluid_auto_capacity || null,
      trans_fluid_change_interval_miles: data.trans_fluid_change_interval_miles ? parseInt(data.trans_fluid_change_interval_miles) : null,
      confidence: data.confidence || 'medium',
      source_notes: data.source_notes || 'AI-researched',
    };
  } catch (err) {
    if (VERBOSE) console.log(`    AI Error: ${err.message}`);
    return null;
  }
}

/**
 * Update the database with transmission fluid data
 */
async function updateTransFluidData(carSlug, data) {
  if (DRY_RUN) {
    const info = data.trans_fluid_manual || data.trans_fluid_auto || 'Unknown';
    console.log(`    [DRY RUN] Would update: ${info}`);
    return true;
  }

  try {
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Only update fields that have values
    if (data.trans_fluid_manual) updateData.trans_fluid_manual = data.trans_fluid_manual;
    if (data.trans_fluid_manual_capacity) updateData.trans_fluid_manual_capacity = data.trans_fluid_manual_capacity;
    if (data.trans_fluid_auto) updateData.trans_fluid_auto = data.trans_fluid_auto;
    if (data.trans_fluid_auto_capacity) updateData.trans_fluid_auto_capacity = data.trans_fluid_auto_capacity;
    if (data.trans_fluid_change_interval_miles) updateData.trans_fluid_change_interval_miles = data.trans_fluid_change_interval_miles;

    const { error } = await supabase
      .from('vehicle_maintenance_specs')
      .update(updateData)
      .eq('car_slug', carSlug);

    if (error) throw error;
    return true;
  } catch (err) {
    if (VERBOSE) console.log(`    DB Error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('⚙️  AI-Powered Transmission Fluid Enrichment');
  console.log('='.repeat(70));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Model: gpt-4o-mini`);
  console.log(`Delay: ${DELAY_MS}ms between cars`);
  console.log('='.repeat(70));

  let carsToProcess = [];

  if (SINGLE_CAR) {
    const { data: car, error } = await supabase
      .from('cars')
      .select('id, slug, name, brand, years')
      .eq('slug', SINGLE_CAR)
      .single();

    if (error || !car) {
      console.error(`❌ Car not found: ${SINGLE_CAR}`);
      process.exit(1);
    }
    carsToProcess = [car];
    console.log(`Single car mode: ${car.name}`);
  } else {
    // Get cars missing transmission fluid data
    const { data: existingSpecs } = await supabase
      .from('vehicle_maintenance_specs')
      .select('car_slug, trans_fluid_manual, trans_fluid_auto');

    // Cars missing BOTH manual and auto fluid specs
    const carsMissingFluid = existingSpecs?.filter(r => 
      !r.trans_fluid_manual && !r.trans_fluid_auto
    ).map(r => r.car_slug) || [];

    const missingSet = new Set(carsMissingFluid);

    const { data: allCars, error } = await supabase
      .from('cars')
      .select('id, slug, name, brand, years')
      .order('name');

    if (error || !allCars) {
      console.error('❌ Error fetching cars:', error?.message);
      process.exit(1);
    }

    carsToProcess = allCars.filter(car => missingSet.has(car.slug));
    console.log(`Missing trans fluid: ${carsToProcess.length} of ${allCars.length} cars`);
  }

  // Apply skip and limit
  carsToProcess = carsToProcess.slice(SKIP);
  if (LIMIT) {
    carsToProcess = carsToProcess.slice(0, LIMIT);
  }

  console.log(`\nProcessing: ${carsToProcess.length} cars\n`);
  console.log('='.repeat(70));

  let totalSuccess = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (let i = 0; i < carsToProcess.length; i++) {
    const car = carsToProcess[i];

    process.stdout.write(`[${String(i + 1).padStart(3)}/${carsToProcess.length}] ${car.name.padEnd(40)}`);

    const data = await researchTransFluid(car);

    if (!data) {
      console.log(` ❌ AI research failed`);
      totalFailed++;
    } else if (data.confidence === 'low') {
      console.log(` ⚠️  Low confidence - skipped`);
      totalSkipped++;
    } else {
      const saved = await updateTransFluidData(car.slug, data);
      if (saved) {
        const info = [];
        if (data.trans_fluid_manual) info.push(`M: ${data.trans_fluid_manual}`);
        if (data.trans_fluid_auto) info.push(`A: ${data.trans_fluid_auto}`);
        console.log(` ✅ ${info.join(' | ') || 'Updated'}`);
        totalSuccess++;
      } else {
        console.log(` ❌ DB save failed`);
        totalFailed++;
      }
    }

    if (i < carsToProcess.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 Summary');
  console.log('='.repeat(70));
  console.log(`Cars processed:  ${carsToProcess.length}`);
  console.log(`Successful:      ${totalSuccess}`);
  console.log(`Failed:          ${totalFailed}`);
  console.log(`Low confidence:  ${totalSkipped}`);
  console.log('='.repeat(70));

  // Show final coverage
  const { count: totalCars } = await supabase
    .from('cars')
    .select('*', { count: 'exact', head: true });

  const { data: fluidCoverage } = await supabase
    .from('vehicle_maintenance_specs')
    .select('car_slug, trans_fluid_manual, trans_fluid_auto');

  const covered = fluidCoverage?.filter(r => r.trans_fluid_manual || r.trans_fluid_auto).length || 0;
  console.log(`\n📈 Coverage: ${covered}/${totalCars} cars (${Math.round(covered / totalCars * 100)}%)`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

