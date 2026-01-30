#!/usr/bin/env node
/**
 * Extract Model and Trim from Car Names
 * 
 * Uses Claude AI to parse existing car names into model and trim fields.
 * Outputs a CSV for human review before backfilling.
 * 
 * Usage:
 *   node scripts/extract-model-trim.mjs
 *   node scripts/extract-model-trim.mjs --dry-run
 *   node scripts/extract-model-trim.mjs --verbose
 * 
 * Output:
 *   scripts/model-trim-extraction.csv
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { parseArgs } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

if (!anthropicKey) {
  console.error('❌ Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);
const anthropic = new Anthropic({ apiKey: anthropicKey });

const { values } = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
    'verbose': { type: 'boolean', default: false },
  },
});

const dryRun = values['dry-run'];
const verbose = values['verbose'];

// Output file
const OUTPUT_FILE = path.join(__dirname, 'model-trim-extraction.csv');

/**
 * Fetch all cars from database
 */
async function fetchAllCars() {
  const { data, error } = await supabase
    .from('cars')
    .select('id, slug, name, brand, years')
    .order('brand', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ Error fetching cars:', error);
    process.exit(1);
  }

  return data;
}

/**
 * Use Claude to extract model and trim from car names
 */
async function extractModelTrim(cars) {
  const carList = cars.map(c => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    brand: c.brand,
    years: c.years
  }));

  const systemPrompt = `You are an automotive data expert. Your task is to parse car names into model and trim fields.

RULES:
1. Model = base model name WITH generation code (e.g., "718 Cayman", "C8 Corvette", "992 911", "E46 M3")
2. Trim = performance/feature variant (e.g., "GT4", "GTS 4.0", "S", "Competition", "ZL1", "NISMO")
3. If there is no distinct trim variant, use "Standard"
4. Generation codes (718, 981, 991, 992, C7, C8, E46, FK8, etc.) should stay with the model
5. Model should be recognizable without the trim

EXAMPLES:
| name | brand | model | trim |
| 718 Cayman GT4 | Porsche | 718 Cayman | GT4 |
| 718 Cayman GTS 4.0 | Porsche | 718 Cayman | GTS 4.0 |
| 981 Cayman S | Porsche | 981 Cayman | S |
| 981 Cayman GTS | Porsche | 981 Cayman | GTS |
| 987.2 Cayman S | Porsche | 987.2 Cayman | S |
| 991.1 Carrera S | Porsche | 991.1 Carrera | S |
| 997.2 Carrera S | Porsche | 997.2 Carrera | S |
| 911 GT3 992 | Porsche | 992 911 | GT3 |
| BMW M2 Competition | BMW | M2 | Competition |
| BMW M4 F82 | BMW | F82 M4 | Standard |
| Camaro ZL1 | Chevrolet | Camaro | ZL1 |
| Camaro SS 1LE | Chevrolet | Camaro | SS 1LE |
| C8 Corvette Stingray | Chevrolet | C8 Corvette | Stingray |
| C7 Corvette Grand Sport | Chevrolet | C7 Corvette | Grand Sport |
| C7 Corvette Z06 | Chevrolet | C7 Corvette | Z06 |
| Nissan GT-R | Nissan | GT-R | Standard |
| Nissan 370Z NISMO | Nissan | 370Z | NISMO |
| Honda S2000 | Honda | S2000 | Standard |
| Mazda MX-5 Miata ND | Mazda | ND MX-5 Miata | Standard |
| Mazda MX-5 Miata NA | Mazda | NA MX-5 Miata | Standard |
| Toyota GR86 | Toyota | GR86 | Standard |
| Toyota 86 / Scion FR-S | Toyota | 86 | Standard |
| Subaru BRZ | Subaru | BRZ | Standard |
| Subaru BRZ (2nd Gen) | Subaru | BRZ 2nd Gen | Standard |
| Subaru WRX STI VA | Subaru | VA WRX | STI |
| Subaru WRX STI GR/GV | Subaru | GR/GV WRX | STI |
| Subaru Impreza WRX STI GD | Subaru | GD Impreza WRX | STI |
| Mitsubishi Lancer Evolution X | Mitsubishi | Lancer Evolution X | Standard |
| Mitsubishi Lancer Evolution VIII/IX | Mitsubishi | Lancer Evolution VIII/IX | Standard |
| Shelby GT500 | Ford | Mustang Shelby | GT500 |
| Shelby GT350 | Ford | Mustang Shelby | GT350 |
| Mustang GT PP2 | Ford | Mustang | GT PP2 |
| Audi R8 V10 | Audi | R8 | V10 |
| Audi R8 V8 | Audi | R8 | V8 |
| Audi RS7 Sportback | Audi | RS7 | Sportback |
| Lexus LC 500 | Lexus | LC | 500 |
| Lexus RC F | Lexus | RC F | Standard |
| Mercedes C63 AMG W204 | Mercedes-AMG | W204 C63 AMG | Standard |
| Toyota GR Supra | Toyota | GR Supra | Standard |
| Toyota Supra Mk4 A80 Turbo | Toyota | A80 Supra | Turbo |
| Dodge Viper | Dodge | Viper | Standard |
| Alfa Romeo 4C | Alfa Romeo | 4C | Standard |
| Aston Martin V8 Vantage | Aston Martin | V8 Vantage | Standard |
| Jaguar F-Type R | Jaguar | F-Type | R |
| Jaguar F-Type V6 S | Jaguar | F-Type | V6 S |
| Lamborghini Gallardo | Lamborghini | Gallardo | Standard |
| Lotus Emira | Lotus | Emira | Standard |
| Lotus Evora GT | Lotus | Evora | GT |
| Lotus Evora S | Lotus | Evora | S |
| Maserati GranTurismo | Maserati | GranTurismo | Standard |
| Mazda RX-7 FD3S | Mazda | FD3S RX-7 | Standard |
| Nissan 300ZX Twin Turbo Z32 | Nissan | Z32 300ZX | Twin Turbo |
| Nissan 350Z | Nissan | 350Z | Standard |
| Nissan Z | Nissan | Z | Standard |

Return a valid JSON array with objects containing: id, slug, name, brand, model, trim`;

  const userPrompt = `Parse these cars into model and trim:

${JSON.stringify(carList, null, 2)}

Return ONLY a valid JSON array, no markdown or explanation.`;

  if (verbose) {
    console.log('📤 Sending', cars.length, 'cars to Claude for extraction...');
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [
      { role: 'user', content: userPrompt }
    ],
    system: systemPrompt
  });

  const content = response.content[0].text;
  
  // Parse JSON response
  try {
    // Handle potential markdown code blocks
    let jsonStr = content;
    if (content.includes('```')) {
      const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonStr = match[1].trim();
      }
    }
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('❌ Failed to parse Claude response:', e);
    console.error('Response:', content);
    process.exit(1);
  }
}

/**
 * Write results to CSV
 */
function writeCsv(results) {
  const headers = ['id', 'slug', 'name', 'brand', 'model', 'trim'];
  const rows = results.map(r => [
    r.id,
    r.slug,
    `"${r.name.replace(/"/g, '""')}"`,
    `"${r.brand.replace(/"/g, '""')}"`,
    `"${r.model.replace(/"/g, '""')}"`,
    `"${r.trim.replace(/"/g, '""')}"`
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  fs.writeFileSync(OUTPUT_FILE, csv);
  console.log(`✅ Wrote ${results.length} rows to ${OUTPUT_FILE}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚗 Model/Trim Extraction Script');
  console.log('================================\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be written\n');
  }

  // Fetch all cars
  console.log('📥 Fetching cars from database...');
  const cars = await fetchAllCars();
  console.log(`   Found ${cars.length} cars\n`);

  // Process in batches to avoid token limits
  const BATCH_SIZE = 40;
  const allResults = [];

  for (let i = 0; i < cars.length; i += BATCH_SIZE) {
    const batch = cars.slice(i, i + BATCH_SIZE);
    console.log(`📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(cars.length / BATCH_SIZE)} (${batch.length} cars)...`);
    
    const results = await extractModelTrim(batch);
    allResults.push(...results);

    if (verbose) {
      results.forEach(r => {
        console.log(`   ${r.name} → model: "${r.model}", trim: "${r.trim}"`);
      });
    }

    // Rate limiting
    if (i + BATCH_SIZE < cars.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n✅ Extracted model/trim for ${allResults.length} cars\n`);

  // Display summary
  const models = [...new Set(allResults.map(r => r.model))].sort();
  const trims = [...new Set(allResults.map(r => r.trim))].sort();
  
  console.log('📊 Summary:');
  console.log(`   Unique models: ${models.length}`);
  console.log(`   Unique trims: ${trims.length}`);
  console.log(`   Standard trims: ${allResults.filter(r => r.trim === 'Standard').length}`);

  if (verbose) {
    console.log('\n📋 All trims:', trims.join(', '));
  }

  // Write CSV
  if (!dryRun) {
    writeCsv(allResults);
    console.log('\n📝 Next steps:');
    console.log('   1. Review the CSV file for accuracy');
    console.log('   2. Make corrections as needed');
    console.log('   3. Run: node scripts/backfill-model-trim.mjs');
  } else {
    console.log('\n🔍 Dry run complete. Run without --dry-run to generate CSV.');
  }
}

main().catch(console.error);
