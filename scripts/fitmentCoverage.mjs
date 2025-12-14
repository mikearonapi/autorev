#!/usr/bin/env node
/**
 * Fitment Coverage Report Script
 *
 * Generates a comprehensive report of part fitment coverage across all cars.
 * Use this to track progress toward 100% coverage of all 98 cars.
 *
 * Usage:
 *   node scripts/fitmentCoverage.mjs [options]
 *
 * Options:
 *   --json          Output as JSON instead of table
 *   --min=N         Only show cars with fewer than N fitments (default: show all)
 *   --brand=NAME    Filter by brand name
 *   --family=NAME   Filter by vendor family (vag, bmw, porsche, etc.)
 *
 * @module scripts/fitmentCoverage
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (keeps script runnable without manually exporting vars)
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// ============================================================================
// CONFIGURATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check for Supabase MCP fallback
const USE_DIRECT_SQL = !supabaseUrl || !supabaseServiceKey;

let supabase = null;
if (!USE_DIRECT_SQL) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    json: false,
    min: null,
    brand: null,
    family: null,
  };

  for (const arg of args) {
    if (arg === '--json') options.json = true;
    else if (arg.startsWith('--min=')) options.min = parseInt(arg.split('=')[1], 10);
    else if (arg.startsWith('--brand=')) options.brand = arg.split('=')[1];
    else if (arg.startsWith('--family=')) options.family = arg.split('=')[1];
    else if (arg === '--help' || arg === '-h') {
      console.log(`
Fitment Coverage Report Script

Usage:
  node scripts/fitmentCoverage.mjs [options]

Options:
  --json          Output as JSON instead of table
  --min=N         Only show cars with fewer than N fitments
  --brand=NAME    Filter by brand name
  --family=NAME   Filter by vendor family (vag, bmw, porsche, etc.)

Examples:
  node scripts/fitmentCoverage.mjs
  node scripts/fitmentCoverage.mjs --min=5 --brand=BMW
  node scripts/fitmentCoverage.mjs --json > coverage.json
      `);
      process.exit(0);
    }
  }

  return options;
}

// ============================================================================
// BRAND FAMILY MAPPING
// ============================================================================

const BRAND_FAMILY_MAP = {
  // VAG
  'Audi': 'vag',
  'Volkswagen': 'vag',

  // BMW
  'BMW': 'bmw',

  // Porsche
  'Porsche': 'porsche',

  // Nissan/Infiniti
  'Nissan': 'nissan',
  'Infiniti': 'nissan',

  // Toyota/Subaru/Scion
  'Toyota': 'toyota',
  'Subaru': 'subaru',
  'Scion': 'toyota',

  // Domestic
  'Chevrolet': 'domestic',
  'Ford': 'domestic',
  'Dodge': 'domestic',
  'Cadillac': 'domestic',

  // Honda/Acura
  'Honda': 'honda',
  'Acura': 'honda',

  // Mazda
  'Mazda': 'mazda',

  // Mitsubishi
  'Mitsubishi': 'mitsubishi',

  // Other
  'Alfa Romeo': 'other',
  'Aston Martin': 'other',
  'Jaguar': 'other',
  'Lamborghini': 'other',
  'Lexus': 'other',
  'Lotus': 'other',
  'Maserati': 'other',
  'Mercedes-AMG': 'mercedes',
  'Tesla': 'other',
};

function getBrandFamily(brand) {
  return BRAND_FAMILY_MAP[brand] || 'other';
}

// ============================================================================
// COVERAGE QUERY
// ============================================================================

async function getCoverageData() {
  if (!supabase) {
    console.error('ERROR: Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    console.log('\nRun this query directly in Supabase Dashboard:\n');
    console.log(`
SELECT 
  c.slug,
  c.name,
  c.brand,
  c.category,
  COUNT(DISTINCT pf.id) as fitment_count,
  COUNT(DISTINCT p.category) as category_count,
  COALESCE(
    STRING_AGG(DISTINCT p.category, ', ' ORDER BY p.category),
    ''
  ) as categories,
  MAX(pf.confidence) as max_confidence
FROM cars c
LEFT JOIN part_fitments pf ON pf.car_id = c.id
LEFT JOIN parts p ON p.id = pf.part_id AND p.is_active = true
GROUP BY c.id, c.slug, c.name, c.brand, c.category
ORDER BY fitment_count ASC, c.brand, c.name;
    `);
    process.exit(1);
  }

  // Query all cars with fitment counts
  const { data: cars, error: carsErr } = await supabase
    .from('cars')
    .select('id, slug, name, brand, category');
  if (carsErr) throw carsErr;

  // Query fitments with parts
  const { data: fitments, error: fitErr } = await supabase
    .from('part_fitments')
    .select('id, car_id, confidence, parts(id, category, is_active)')
    .eq('parts.is_active', true);
  if (fitErr) throw fitErr;

  // Build coverage map
  const coverageMap = new Map();

  for (const car of cars) {
    coverageMap.set(car.id, {
      slug: car.slug,
      name: car.name,
      brand: car.brand,
      category: car.category,
      family: getBrandFamily(car.brand),
      fitment_count: 0,
      categories: new Set(),
      max_confidence: 0,
    });
  }

  for (const fit of fitments || []) {
    const coverage = coverageMap.get(fit.car_id);
    if (!coverage) continue;

    coverage.fitment_count++;
    if (fit.parts?.category) {
      coverage.categories.add(fit.parts.category);
    }
    if (fit.confidence && fit.confidence > coverage.max_confidence) {
      coverage.max_confidence = fit.confidence;
    }
  }

  // Convert to array
  return [...coverageMap.values()].map((c) => ({
    ...c,
    category_count: c.categories.size,
    categories: [...c.categories].sort().join(', '),
  }));
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport(data, options) {
  // Filter data
  let filtered = data;

  if (options.min !== null) {
    filtered = filtered.filter((c) => c.fitment_count < options.min);
  }
  if (options.brand) {
    const brandLower = options.brand.toLowerCase();
    filtered = filtered.filter((c) => c.brand.toLowerCase().includes(brandLower));
  }
  if (options.family) {
    const familyLower = options.family.toLowerCase();
    filtered = filtered.filter((c) => c.family === familyLower);
  }

  // Sort by fitment count (ascending)
  filtered.sort((a, b) => a.fitment_count - b.fitment_count);

  // Calculate summary stats
  const summary = {
    total_cars: data.length,
    cars_with_fitments: data.filter((c) => c.fitment_count > 0).length,
    cars_without_fitments: data.filter((c) => c.fitment_count === 0).length,
    cars_with_min_5: data.filter((c) => c.fitment_count >= 5).length,
    total_fitments: data.reduce((sum, c) => sum + c.fitment_count, 0),
    avg_fitments_per_car: (data.reduce((sum, c) => sum + c.fitment_count, 0) / data.length).toFixed(1),
    coverage_by_family: {},
  };

  // Group by family
  const families = [...new Set(data.map((c) => c.family))];
  for (const family of families) {
    const familyCars = data.filter((c) => c.family === family);
    const withFitments = familyCars.filter((c) => c.fitment_count > 0).length;
    summary.coverage_by_family[family] = {
      total: familyCars.length,
      with_fitments: withFitments,
      coverage_pct: ((withFitments / familyCars.length) * 100).toFixed(0) + '%',
    };
  }

  return { data: filtered, summary };
}

function printReport(report, options) {
  const { data, summary } = report;

  if (options.json) {
    console.log(JSON.stringify({ summary, cars: data }, null, 2));
    return;
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('               FITMENT COVERAGE REPORT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  // Summary
  console.log('SUMMARY');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  Total cars:              ${summary.total_cars}`);
  console.log(`  Cars with fitments:      ${summary.cars_with_fitments} (${((summary.cars_with_fitments / summary.total_cars) * 100).toFixed(0)}%)`);
  console.log(`  Cars WITHOUT fitments:   ${summary.cars_without_fitments} ⚠️`);
  console.log(`  Cars with 5+ fitments:   ${summary.cars_with_min_5}`);
  console.log(`  Total fitments:          ${summary.total_fitments}`);
  console.log(`  Avg fitments/car:        ${summary.avg_fitments_per_car}`);
  console.log('');

  // Coverage by family
  console.log('COVERAGE BY BRAND FAMILY');
  console.log('───────────────────────────────────────────────────────────────');
  console.log('  Family       | Cars | With Fitments | Coverage');
  console.log('  -------------|------|---------------|----------');
  for (const [family, stats] of Object.entries(summary.coverage_by_family)) {
    const familyPad = family.padEnd(12);
    const totalPad = String(stats.total).padStart(4);
    const withPad = String(stats.with_fitments).padStart(13);
    const pctPad = stats.coverage_pct.padStart(8);
    console.log(`  ${familyPad} | ${totalPad} | ${withPad} | ${pctPad}`);
  }
  console.log('');

  // Cars without fitments (priority)
  const carsWithoutFitments = data.filter((c) => c.fitment_count === 0);
  if (carsWithoutFitments.length > 0) {
    console.log('CARS WITHOUT FITMENTS (PRIORITY)');
    console.log('───────────────────────────────────────────────────────────────');
    for (const car of carsWithoutFitments) {
      console.log(`  ❌ ${car.name} (${car.brand}) [${car.family}]`);
    }
    console.log('');
  }

  // Cars with low fitments
  const lowFitmentCars = data.filter((c) => c.fitment_count > 0 && c.fitment_count < 5);
  if (lowFitmentCars.length > 0) {
    console.log('CARS WITH LOW FITMENTS (<5)');
    console.log('───────────────────────────────────────────────────────────────');
    for (const car of lowFitmentCars) {
      console.log(`  ⚠️  ${car.name}: ${car.fitment_count} fitments (${car.categories || 'none'})`);
    }
    console.log('');
  }

  // Full table (if not too many)
  if (data.length <= 50) {
    console.log('ALL CARS');
    console.log('───────────────────────────────────────────────────────────────');
    console.log('  Car                                      | Fitments | Categories');
    console.log('  -----------------------------------------|----------|------------');
    for (const car of data) {
      const namePad = `${car.name}`.slice(0, 40).padEnd(40);
      const fitPad = String(car.fitment_count).padStart(8);
      const catPad = (car.categories || '-').slice(0, 30);
      const icon = car.fitment_count >= 5 ? '✓' : car.fitment_count > 0 ? '⚠️' : '❌';
      console.log(`  ${icon} ${namePad} | ${fitPad} | ${catPad}`);
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const options = parseArgs();

  try {
    console.log('Loading coverage data...');
    const data = await getCoverageData();
    const report = generateReport(data, options);
    printReport(report, options);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
