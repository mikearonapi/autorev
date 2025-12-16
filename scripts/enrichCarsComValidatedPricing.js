#!/usr/bin/env node

/**
 * Cars.com validated pricing enrichment
 *
 * Goals:
 * - Avoid wrong matches (only persist if enough listings match)
 * - Capture nuance: per-year stats + mileage bands
 * - Persist:
 *   - `car_market_pricing_years` (per-year)
 *   - `car_market_pricing` (Cars.com summary columns)
 *   - `car_price_history` (daily point, using median)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { getYearlyMarketData } from '../lib/scrapers/carsComScraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const args = process.argv.slice(2).reduce((acc, arg) => {
  if (!arg.startsWith('--')) return acc;
  const [k, v] = arg.slice(2).split('=');
  acc[k] = v === undefined ? true : v;
  return acc;
}, /** @type {Record<string, string | boolean>} */ ({}));

const LIMIT = args.limit ? parseInt(String(args.limit)) : 10;
const SKIP = args.skip ? parseInt(String(args.skip)) : 0;
const MIN_SAMPLE = args.minSample ? parseInt(String(args.minSample)) : 6;
const YEAR_DELAY_MS = args.yearDelayMs ? parseInt(String(args.yearDelayMs)) : 1200;
const CAR_DELAY_MS = args.carDelayMs ? parseInt(String(args.carDelayMs)) : 1500;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseYearRange(yearsStr) {
  const m = (yearsStr || '').match(/(\d{4})(?:\s*-\s*(\d{4}))?/);
  if (!m) return { yearMin: null, yearMax: null };
  const yearMin = parseInt(m[1]);
  const yearMax = m[2] ? parseInt(m[2]) : yearMin;
  return { yearMin, yearMax };
}

function norm(s) {
  return String(s || '').toLowerCase();
}

function deriveKeywordFilters(car) {
  const name = norm(car.name);
  const brand = norm(car.brand);

  /** @type {string[]} */
  const include = [];
  /** @type {string[]} */
  const exclude = [];

  // Include signals (trim / variant)
  const rules = [
    { if: /\bgt4\b/, include: ['gt4'], exclude: ['gts'] },
    { if: /\bgts\b/, include: ['gts'], exclude: ['gt4'] },
    { if: /\bz06\b/, include: ['z06'], exclude: ['zr1', 'grand sport'] },
    { if: /\bgrand\s+sport\b/, include: ['grand sport'], exclude: ['z06', 'zr1'] },
    { if: /\bzl1\b/, include: ['zl1'], exclude: [] },
    { if: /\bhellcat\b/, include: ['hellcat'], exclude: ['demon', 'redeye', 'jailbreak'] },
    { if: /\btype\s*r\b/, include: ['type r'], exclude: [] },
    { if: /\bnismo\b/, include: ['nismo'], exclude: [] },
    { if: /\bquadrifoglio\b/, include: ['quadrifoglio'], exclude: [] },
    { if: /\bcompetition\b/, include: ['competition'], exclude: ['cs', 'gts'] },
    { if: /\bgt350\b/, include: ['gt350'], exclude: ['gt500'] },
    { if: /\bgt500\b/, include: ['gt500'], exclude: ['gt350'] },
    { if: /\bgolf\s*r\b/, include: ['golf r'], exclude: ['gti'] },
    { if: /\brs\s*3\b|\brs3\b/, include: ['rs3'], exclude: ['s3'] },
    { if: /\brs\s*5\b|\brs5\b/, include: ['rs5'], exclude: ['s5'] },
    { if: /\btt\s*rs\b/, include: ['tt', 'rs'], exclude: [] },
  ];

  for (const r of rules) {
    if (r.if.test(name)) {
      include.push(...r.include);
      exclude.push(...r.exclude);
    }
  }

  // Generic disambiguation
  if (name.includes('bmw m3')) {
    include.push('m3');
    exclude.push('m340', 'm3cs');
  }
  if (name.includes('bmw m4')) {
    include.push('m4');
    exclude.push('m440', 'm4cs', 'm4 gts');
  }

  // Porsche disambiguation: keyword searches can return other Porsche models
  if (brand === 'porsche') {
    // Avoid SUVs / sedans when targeting sports cars
    exclude.push('cayenne', 'macan', 'panamera', 'taycan');

    if (name.includes('carrera')) {
      include.push('911', 'carrera');
      // More specific variants
      if (name.includes('carrera s')) include.push('carrera s');
      if (name.includes('turbo')) include.push('turbo');
      if (name.includes('gt3')) include.push('gt3');
    }

    if (name.includes('cayman')) {
      include.push('cayman');
      if (name.includes('cayman s')) include.push('cayman s');
      if (name.includes('cayman gts')) include.push('cayman gts');
      if (name.includes('gt4')) include.push('gt4');
      exclude.push('boxster');
    }
  }

  // De-dupe
  const uniq = (arr) => [...new Set(arr.map(norm).filter(Boolean))];
  return { include: uniq(include), exclude: uniq(exclude) };
}

function deriveCarsComKeyword(car) {
  const rawName = String(car?.name || '').trim();
  const brand = String(car?.brand || '').trim();
  const lowerBrand = brand.toLowerCase();

  // Tokenize (keep simple)
  const tokens = rawName.split(/\s+/).filter(Boolean);

  const cleaned = tokens.filter((t) => {
    const token = t.replace(/[(),]/g, '');

    // Keep 718 (Porsche model family)
    if (token === '718') return true;

    // Drop chassis/generation codes (E46, F80, W204, C7, 8V, Z32, Mk7, etc.)
    if (/^[A-Z]{1,3}\d{1,3}([/-][A-Z]{1,3}\d{1,3})?$/.test(token)) return false;
    if (/^Mk\d+$/i.test(token)) return false;

    // Drop Porsche generation numbers like 981, 987.2, 991.1, 997.2, 996
    if (/^\d{3}(\.\d)?$/.test(token)) return false;

    return true;
  });

  let keyword = cleaned.join(' ').replace(/\s+/g, ' ').trim();

  // Add implied Porsche base models when the name doesn't include them
  if (lowerBrand === 'porsche') {
    const lower = keyword.toLowerCase();
    if ((lower.includes('carrera') || lower.includes('turbo') || lower.includes('gt3')) && !lower.includes('911')) {
      keyword = `911 ${keyword}`.trim();
    }
  }

  // Prepend brand if the name doesn't already include it
  if (brand && !keyword.toLowerCase().includes(lowerBrand)) {
    keyword = `${brand} ${keyword}`.trim();
  }

  return keyword;
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

async function upsertSummaryRows(carSlug, yearRows, overall) {
  // Weighted avg mileage
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

  // price history point (median is more stable)
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

async function main() {
  console.log('='.repeat(90));
  console.log('Cars.com VALIDATED pricing enrichment');
  console.log('='.repeat(90));
  console.log(`limit=${LIMIT} skip=${SKIP} minSample=${MIN_SAMPLE} yearDelayMs=${YEAR_DELAY_MS} carDelayMs=${CAR_DELAY_MS}`);

  const { data: cars, error } = await supabase
    .from('cars')
    .select('slug, name, brand, years')
    .order('name')
    .range(SKIP, SKIP + LIMIT - 1);

  if (error) {
    console.error('Error loading cars:', error.message);
    process.exit(1);
  }

  let ok = 0;
  let skipped = 0;

  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    const { yearMin, yearMax } = parseYearRange(car.years);

    console.log(`\n[${i + 1}/${cars.length}] ${car.name} (${car.slug}) years=${car.years}`);

    if (!yearMin || !yearMax) {
      console.log('  ⚠️  Skipping: no year range');
      skipped++;
      continue;
    }

    // Use keyword search to reduce wrong mapping risk.
    const keyword = deriveCarsComKeyword(car);
    const { include, exclude } = deriveKeywordFilters(car);

    if (include.length > 0) {
      console.log(`  include=${include.join('|')} exclude=${exclude.join('|') || 'none'}`);
    }

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
      console.log('  ❌ No validated data (insufficient matching listings)');
      skipped++;
      await sleep(CAR_DELAY_MS);
      continue;
    }

    // Print a compact summary
    console.log(
      `  ✅ years=${res.overall.yearsCovered.join(',')} median=${formatMoney(res.overall.medianPrice)} ` +
      `range=${formatMoney(res.overall.minPrice)}-${formatMoney(res.overall.maxPrice)} listings=${res.overall.listingCount}`
    );

    const saveYears = await upsertYearRows(car.slug, res.years);
    if (!saveYears.ok) {
      console.log(`  ❌ Save yearly failed: ${saveYears.error.message}`);
      await sleep(CAR_DELAY_MS);
      continue;
    }

    const saveSummary = await upsertSummaryRows(car.slug, res.years, res.overall);
    if (!saveSummary.ok) {
      console.log(`  ❌ Save summary failed: ${saveSummary.error?.message || saveSummary.historyError?.message}`);
      await sleep(CAR_DELAY_MS);
      continue;
    }

    console.log(`  💾 Saved: ${res.years.length} year rows + summary`);
    ok++;

    // Delay between cars
    await sleep(CAR_DELAY_MS);
  }

  console.log('\n' + '='.repeat(90));
  console.log(`Done. Saved=${ok}, skipped=${skipped}`);
  console.log('='.repeat(90));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


