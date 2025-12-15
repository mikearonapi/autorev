#!/usr/bin/env node

/**
 * AI-Powered Spark Plug Data Enrichment
 * 
 * Uses OpenAI to research and fill spark plug specifications for all vehicles.
 * This data is static (doesn't change) so we only need to run this once.
 * 
 * Usage:
 *   node scripts/enrichSparkPlugsAI.js                    # All missing
 *   node scripts/enrichSparkPlugsAI.js --limit=10         # First 10
 *   node scripts/enrichSparkPlugsAI.js --car=bmw-m3-e46   # Single car
 *   node scripts/enrichSparkPlugsAI.js --dry-run          # Preview only
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
 * Use AI to research spark plug specs for a vehicle
 */
async function researchSparkPlugs(car) {
  const prompt = `You are an automotive parts specialist. I need accurate spark plug specifications for the following vehicle:

Vehicle: ${car.name}
Brand: ${car.brand}
Years: ${car.years}
Engine: (see vehicle specs)

Please provide the following information in JSON format:
{
  "spark_plug_type": "Iridium/Platinum/Copper (e.g., 'NGK Iridium IX')",
  "spark_plug_oem_part": "OEM part number (e.g., 'NGK 6619 LFR6AIX-11')",
  "spark_plug_alternatives": ["Alternative compatible part numbers"],
  "spark_plug_gap_mm": 0.0,  // Gap in millimeters (typical range 0.7-1.3mm)
  "spark_plug_quantity": 0,   // Number of spark plugs (e.g., 4, 6, 8)
  "spark_plug_change_interval_miles": 0, // Recommended change interval
  "confidence": "high/medium/low",
  "source_notes": "Brief note on where this info typically comes from"
}

IMPORTANT:
- Be accurate. If you're not sure, indicate low confidence.
- Use real OEM part numbers that actually exist.
- The gap should be a decimal number in mm (e.g., 0.8, 1.1)
- Return ONLY valid JSON, no other text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3, // Lower temperature for more consistent/accurate results
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    if (content.includes('```')) {
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) jsonStr = match[1].trim();
    }

    const data = JSON.parse(jsonStr);
    return {
      spark_plug_type: data.spark_plug_type || null,
      spark_plug_oem_part: data.spark_plug_oem_part || null,
      spark_plug_alternatives: data.spark_plug_alternatives || null,
      spark_plug_gap_mm: data.spark_plug_gap_mm ? parseFloat(data.spark_plug_gap_mm) : null,
      spark_plug_quantity: data.spark_plug_quantity ? parseInt(data.spark_plug_quantity) : null,
      spark_plug_change_interval_miles: data.spark_plug_change_interval_miles ? parseInt(data.spark_plug_change_interval_miles) : null,
      confidence: data.confidence || 'medium',
      source_notes: data.source_notes || 'AI-researched',
    };
  } catch (err) {
    if (VERBOSE) console.log(`    AI Error: ${err.message}`);
    return null;
  }
}

/**
 * Update the database with spark plug data
 */
async function updateSparkPlugData(carSlug, data) {
  if (DRY_RUN) {
    console.log(`    [DRY RUN] Would update: ${data.spark_plug_oem_part} (gap: ${data.spark_plug_gap_mm}mm)`);
    return true;
  }

  try {
    const { error } = await supabase
      .from('vehicle_maintenance_specs')
      .update({
        spark_plug_type: data.spark_plug_type,
        spark_plug_oem_part: data.spark_plug_oem_part,
        spark_plug_alternatives: data.spark_plug_alternatives,
        spark_plug_gap_mm: data.spark_plug_gap_mm,
        spark_plug_quantity: data.spark_plug_quantity,
        spark_plug_change_interval_miles: data.spark_plug_change_interval_miles,
        updated_at: new Date().toISOString(),
      })
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
  console.log('🔌 AI-Powered Spark Plug Enrichment');
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
    // Get cars missing spark plug data
    const { data: existingSpecs } = await supabase
      .from('vehicle_maintenance_specs')
      .select('car_slug, spark_plug_oem_part')
      .not('spark_plug_oem_part', 'is', null);

    const carsWithSparkPlugs = new Set(existingSpecs?.map(r => r.car_slug) || []);

    const { data: allCars, error } = await supabase
      .from('cars')
      .select('id, slug, name, brand, years')
      .order('name');

    if (error || !allCars) {
      console.error('❌ Error fetching cars:', error?.message);
      process.exit(1);
    }

    carsToProcess = allCars.filter(car => !carsWithSparkPlugs.has(car.slug));
    console.log(`Missing spark plugs: ${carsToProcess.length} of ${allCars.length} cars`);
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

    const data = await researchSparkPlugs(car);

    if (!data) {
      console.log(` ❌ AI research failed`);
      totalFailed++;
    } else if (data.confidence === 'low') {
      console.log(` ⚠️  Low confidence - skipped`);
      totalSkipped++;
    } else {
      const saved = await updateSparkPlugData(car.slug, data);
      if (saved) {
        console.log(` ✅ ${data.spark_plug_oem_part} (${data.spark_plug_gap_mm}mm)`);
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

  const { data: sparkPlugCoverage } = await supabase
    .from('vehicle_maintenance_specs')
    .select('car_slug')
    .not('spark_plug_oem_part', 'is', null);

  console.log(`\n📈 Coverage: ${sparkPlugCoverage?.length || 0}/${totalCars} cars (${Math.round((sparkPlugCoverage?.length || 0) / totalCars * 100)}%)`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

