#!/usr/bin/env node

/**
 * Batch Market Pricing Enrichment
 * 
 * Populates car_market_pricing for ALL 98 cars using Cars.com data.
 * Processes cars by tier (premium → upper-mid → mid → budget) to prioritize
 * the most valuable vehicles first.
 * 
 * Usage:
 *   node scripts/batchEnrichAllMarketPricing.js [options]
 * 
 * Options:
 *   --tier=<tier>       Process only specified tier (premium|upper-mid|mid|budget)
 *   --skip=<n>          Skip first N cars in the selected tier
 *   --limit=<n>         Process max N cars (default: all)
 *   --delay=<ms>        Delay between cars in ms (default: 2000)
 *   --minSample=<n>     Minimum listings required (default: 4)
 *   --dryRun            Show what would be processed without fetching
 * 
 * Rate Limiting:
 *   Cars.com allows ~30 requests/minute. With yearMin-yearMax spanning multiple
 *   years, each car may make 5-10 requests. Default 2000ms delay is conservative.
 * 
 * @module scripts/batchEnrichAllMarketPricing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { getYearlyMarketData } from '../lib/scrapers/carsComScraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Parse command-line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (!arg.startsWith('--')) return acc;
  const [k, v] = arg.slice(2).split('=');
  acc[k] = v === undefined ? true : v;
  return acc;
}, /** @type {Record<string, string | boolean>} */ ({}));

const TIER = args.tier || null; // null = all tiers
const SKIP = args.skip ? parseInt(String(args.skip)) : 0;
const LIMIT = args.limit ? parseInt(String(args.limit)) : Infinity;
const DELAY_MS = args.delay ? parseInt(String(args.delay)) : 2000;
const MIN_SAMPLE = args.minSample ? parseInt(String(args.minSample)) : 4;
const DRY_RUN = !!args.dryRun;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

// Tier priority order
const TIER_ORDER = ['premium', 'upper-mid', 'mid', 'budget'];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseYearRange(yearsStr) {
  const m = (yearsStr || '').match(/(\d{4})(?:\s*[-–]\s*(\d{4}))?/);
  if (!m) return { yearMin: null, yearMax: null };
  const yearMin = parseInt(m[1]);
  const yearMax = m[2] ? parseInt(m[2]) : yearMin;
  return { yearMin, yearMax };
}

function norm(s) {
  return String(s || '').toLowerCase();
}

/**
 * Generate keyword search and include/exclude filters for accurate matching
 */
function deriveSearchParams(car) {
  const name = norm(car.name);
  const brand = norm(car.brand);

  const include = [];
  const exclude = [];

  // Trim-specific rules
  const rules = [
    { if: /\bgt4\b/, include: ['gt4'], exclude: ['gts'] },
    { if: /\bgts\b/, include: ['gts'], exclude: ['gt4'] },
    { if: /\bz06\b/, include: ['z06'], exclude: ['zr1', 'grand sport', 'stingray'] },
    { if: /\bgrand\s*sport\b/, include: ['grand sport'], exclude: ['z06', 'zr1'] },
    { if: /\bzl1\b/, include: ['zl1'], exclude: ['ss'] },
    { if: /\bhellcat\b/, include: ['hellcat'], exclude: ['demon', 'redeye', 'jailbreak'] },
    { if: /\bsrt\s*392\b/, include: ['srt', '392'], exclude: ['hellcat', 'demon'] },
    { if: /\btype\s*r\b/, include: ['type r'], exclude: [] },
    { if: /\bnismo\b/, include: ['nismo'], exclude: [] },
    { if: /\bquadrifoglio\b/, include: ['quadrifoglio'], exclude: [] },
    { if: /\bcompetition\b/, include: ['competition'], exclude: ['cs', 'gts'] },
    { if: /\bgt350\b/, include: ['gt350'], exclude: ['gt500'] },
    { if: /\bgt500\b/, include: ['gt500'], exclude: ['gt350'] },
    { if: /\bgolf\s*r\b/, include: ['golf r'], exclude: ['gti'] },
    { if: /\bgti\b/, include: ['gti'], exclude: ['golf r'] },
    { if: /\brs\s*3\b|\brs3\b/, include: ['rs3', 'rs 3'], exclude: ['s3'] },
    { if: /\brs\s*5\b|\brs5\b/, include: ['rs5', 'rs 5'], exclude: ['s5'] },
    { if: /\btt\s*rs\b/, include: ['tt', 'rs'], exclude: [] },
    { if: /\bpp2\b/, include: ['gt', 'performance'], exclude: ['gt350', 'gt500'] },
    { if: /\b1le\b/, include: ['ss', '1le'], exclude: ['zl1'] },
    { if: /\bboss\s*302\b/, include: ['boss 302'], exclude: [] },
    { if: /\bstingray\b/, include: ['stingray'], exclude: ['z06', 'zr1'] },
    { if: /\br8\b/, include: ['r8'], exclude: ['rs', 'a8'] },
    { if: /\bv10\b/, include: ['v10'], exclude: ['v8'] },
    { if: /\bv8\b/, include: ['v8'], exclude: ['v10'] },
    { if: /\bturbo\b/, include: ['turbo'], exclude: ['gt3'] },
    { if: /\bgt3\b/, include: ['gt3'], exclude: ['turbo'] },
    { if: /\bgt-r\b|\bgtr\b/, include: ['gt-r'], exclude: [] },
  ];

  for (const r of rules) {
    if (r.if.test(name)) {
      include.push(...r.include);
      exclude.push(...r.exclude);
    }
  }

  // Brand-specific disambiguation
  if (brand === 'porsche') {
    exclude.push('cayenne', 'macan', 'panamera', 'taycan');
    if (name.includes('cayman')) {
      include.push('cayman');
      exclude.push('boxster');
    }
    if (name.includes('carrera') || name.includes('turbo') || name.includes('gt3')) {
      include.push('911');
    }
  }

  if (brand === 'bmw') {
    if (name.includes('m3')) {
      include.push('m3');
      exclude.push('m340', 'm3cs');
    }
    if (name.includes('m4')) {
      include.push('m4');
      exclude.push('m440', 'm4cs');
    }
    if (name.includes('m5')) {
      include.push('m5');
      exclude.push('m550');
    }
  }

  // Build keyword from car name (strip chassis codes)
  let keyword = String(car.name || '')
    .replace(/\([^)]+\)/g, '') // Remove parenthetical annotations
    .replace(/\b[A-Z]{1,2}\d{2,3}\b/g, '') // E46, F80, W204, etc.
    .replace(/\b\d{3}\.\d\b/g, '') // 991.1, 997.2
    .replace(/\bMk\d+\b/gi, '') // Mk7, Mk8
    .replace(/\s+/g, ' ')
    .trim();

  // Prepend brand if not already included
  if (car.brand && !keyword.toLowerCase().includes(car.brand.toLowerCase())) {
    keyword = `${car.brand} ${keyword}`;
  }

  // De-duplicate
  const uniq = (arr) => [...new Set(arr.map(norm).filter(Boolean))];
  
  return {
    keyword,
    include: uniq(include),
    exclude: uniq(exclude),
  };
}

function formatMoney(n) {
  if (!Number.isFinite(n)) return 'N/A';
  return `$${n.toLocaleString()}`;
}

async function upsertYearRows(carSlug, yearRows) {
  const records = yearRows.map((y) => ({
    car_slug: carSlug,
    source: 'carscom',
    year: y.year,
    median_price: y.medianPrice ?? null,
    average_price: y.averagePrice ?? null,
    min_price: y.minPrice ?? null,
    max_price: y.maxPrice ?? null,
    p10_price: y.p10Price ?? null,
    p90_price: y.p90Price ?? null,
    listing_count: y.listingCount ?? 0,
    average_mileage: y.averageMileage ?? null,
    price_by_mileage: y.priceByMileage ?? null,
    fetched_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('car_market_pricing_years')
    .upsert(records, { onConflict: 'car_slug,source,year' });

  return { ok: !error, error };
}

async function upsertSummaryRow(carSlug, yearRows, overall) {
  // Calculate weighted average mileage across years
  const mileageParts = yearRows
    .filter((y) => Number.isFinite(y.averageMileage) && Number.isFinite(y.listingCount))
    .map((y) => ({ miles: y.averageMileage, w: y.listingCount }));

  const totalW = mileageParts.reduce((s, p) => s + p.w, 0);
  const avgMileage = totalW > 0
    ? Math.round(mileageParts.reduce((s, p) => s + p.miles * p.w, 0) / totalW)
    : null;

  const record = {
    car_slug: carSlug,
    carscom_avg_price: overall.averagePrice,
    carscom_median_price: overall.medianPrice,
    carscom_min_price: overall.minPrice,
    carscom_max_price: overall.maxPrice,
    carscom_listing_count: overall.listingCount,
    carscom_avg_mileage: avgMileage,
    carscom_fetched_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('car_market_pricing')
    .upsert(record, { onConflict: 'car_slug' });

  // Also add a price history point (median is more stable than average)
  const today = new Date().toISOString().split('T')[0];
  const { error: historyError } = await supabase
    .from('car_price_history')
    .upsert({
      car_slug: carSlug,
      source: 'carscom',
      price: overall.medianPrice,
      recorded_at: today,
    }, { onConflict: 'car_slug,source,recorded_at' });

  return { ok: !error && !historyError, error, historyError };
}

async function processCarPricing(car) {
  const { yearMin, yearMax } = parseYearRange(car.years);
  
  if (!yearMin || !yearMax) {
    return { success: false, reason: 'no year range' };
  }

  const { keyword, include, exclude } = deriveSearchParams(car);

  const res = await getYearlyMarketData(null, null, {
    keyword,
    yearMin,
    yearMax,
    includeKeywords: include,
    excludeKeywords: exclude,
    minSample: MIN_SAMPLE,
    zipCode: '90210',
  });

  if (!res.overall) {
    return { success: false, reason: 'insufficient listings', keyword, include, exclude };
  }

  const saveYears = await upsertYearRows(car.slug, res.years);
  if (!saveYears.ok) {
    return { success: false, reason: `save years failed: ${saveYears.error?.message}` };
  }

  const saveSummary = await upsertSummaryRow(car.slug, res.years, res.overall);
  if (!saveSummary.ok) {
    return { success: false, reason: `save summary failed: ${saveSummary.error?.message}` };
  }

  return {
    success: true,
    data: {
      medianPrice: res.overall.medianPrice,
      avgPrice: res.overall.averagePrice,
      minPrice: res.overall.minPrice,
      maxPrice: res.overall.maxPrice,
      listingCount: res.overall.listingCount,
      yearsCovered: res.overall.yearsCovered,
    },
  };
}

async function main() {
  console.log('═'.repeat(80));
  console.log('BATCH MARKET PRICING ENRICHMENT');
  console.log('═'.repeat(80));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no data will be saved)' : 'LIVE'}`);
  console.log(`Tier filter: ${TIER || 'all tiers'}`);
  console.log(`Skip: ${SKIP}, Limit: ${LIMIT === Infinity ? 'none' : LIMIT}`);
  console.log(`Delay between cars: ${DELAY_MS}ms`);
  console.log(`Minimum sample size: ${MIN_SAMPLE}`);
  console.log('─'.repeat(80));

  // Build query - order by tier priority, then name
  let query = supabase
    .from('cars')
    .select('slug, name, brand, years, tier')
    .order('tier')
    .order('name');

  if (TIER) {
    query = query.eq('tier', TIER);
  }

  const { data: allCars, error } = await query;

  if (error) {
    console.error('Error loading cars:', error.message);
    process.exit(1);
  }

  // Sort by tier priority
  const tierPriority = { premium: 0, 'upper-mid': 1, mid: 2, budget: 3 };
  const sortedCars = allCars.sort((a, b) => {
    const tierDiff = (tierPriority[a.tier] ?? 99) - (tierPriority[b.tier] ?? 99);
    if (tierDiff !== 0) return tierDiff;
    return a.name.localeCompare(b.name);
  });

  // Apply skip and limit
  const cars = sortedCars.slice(SKIP, SKIP + LIMIT);

  console.log(`\nTotal cars available: ${allCars.length}`);
  console.log(`Cars to process: ${cars.length}`);
  console.log('─'.repeat(80));

  if (DRY_RUN) {
    console.log('\nDRY RUN - Cars that would be processed:');
    cars.forEach((car, i) => {
      const { keyword, include, exclude } = deriveSearchParams(car);
      console.log(`  ${i + 1}. [${car.tier}] ${car.name} (${car.years})`);
      console.log(`     keyword: "${keyword}"`);
      if (include.length) console.log(`     include: ${include.join(', ')}`);
      if (exclude.length) console.log(`     exclude: ${exclude.join(', ')}`);
    });
    console.log('\nRun without --dryRun to execute.');
    process.exit(0);
  }

  // Track results
  const results = { success: 0, failed: 0, skipped: 0 };
  const failedCars = [];

  let currentTier = null;

  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    
    // Print tier header when it changes
    if (car.tier !== currentTier) {
      currentTier = car.tier;
      console.log(`\n${'━'.repeat(80)}`);
      console.log(`TIER: ${currentTier.toUpperCase()}`);
      console.log('━'.repeat(80));
    }

    const progress = `[${i + 1}/${cars.length}]`;
    process.stdout.write(`${progress} ${car.name.padEnd(45)} `);

    try {
      const result = await processCarPricing(car);

      if (result.success) {
        results.success++;
        const d = result.data;
        console.log(`✅ ${formatMoney(d.medianPrice).padStart(10)} (${d.listingCount} listings)`);
      } else {
        results.failed++;
        failedCars.push({ name: car.name, slug: car.slug, reason: result.reason });
        console.log(`❌ ${result.reason}`);
      }
    } catch (err) {
      results.failed++;
      failedCars.push({ name: car.name, slug: car.slug, reason: err.message });
      console.log(`❌ Error: ${err.message}`);
    }

    // Rate limiting delay
    if (i < cars.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log('SUMMARY');
  console.log('═'.repeat(80));
  console.log(`✅ Success: ${results.success}`);
  console.log(`❌ Failed:  ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  
  if (failedCars.length > 0) {
    console.log('\nFailed cars:');
    failedCars.forEach((f) => {
      console.log(`  - ${f.name}: ${f.reason}`);
    });
  }

  console.log('\n' + '═'.repeat(80));
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});












