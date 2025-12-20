#!/usr/bin/env node

/**
 * Test Cars.com Yearly + Mileage pricing (validated)
 *
 * Runs the new Cars.com yearly market data function for a couple cars,
 * then saves the year rows to `car_market_pricing_years`.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { getYearlyMarketData } from '../lib/scrapers/carsComScraper.js';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && serviceRoleKey)
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : null;

// Keep it small + high-signal
const TESTS = [
  {
    carSlug: '718-cayman-gt4',
    make: 'porsche',
    model: '718_cayman',
    yearMin: 2020,
    yearMax: 2024,
    includeKeywords: ['gt4'],
    excludeKeywords: ['gts', 'base'],
  },
  {
    carSlug: 'bmw-m3-f80',
    make: 'bmw',
    model: 'm3',
    yearMin: 2015,
    yearMax: 2018,
    includeKeywords: ['m3'],
    excludeKeywords: ['m340', 'm3cs'],
  },
];

function formatMoney(n) {
  if (!Number.isFinite(n)) return 'N/A';
  return `$${n.toLocaleString()}`;
}

async function main() {
  console.log('='.repeat(80));
  console.log('Cars.com Yearly Pricing Test');
  console.log('='.repeat(80));

  if (!supabase) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
    process.exit(1);
  }

  for (const t of TESTS) {
    console.log(`\n${t.carSlug}: ${t.make}/${t.model} ${t.yearMin}-${t.yearMax}`);
    console.log(`  include: ${t.includeKeywords?.join(', ') || 'none'}`);
    console.log(`  exclude: ${t.excludeKeywords?.join(', ') || 'none'}`);

    const result = await getYearlyMarketData(t.make, t.model, {
      yearMin: t.yearMin,
      yearMax: t.yearMax,
      includeKeywords: t.includeKeywords,
      excludeKeywords: t.excludeKeywords,
      minSample: 6,
    });

    if (!result.overall) {
      console.log('  ❌ No validated yearly data');
      continue;
    }

    console.log(`  ✅ years: ${result.years.map(y => y.year).join(', ')}`);
    console.log(
      `  overall median: ${formatMoney(result.overall.medianPrice)} | ` +
      `min: ${formatMoney(result.overall.minPrice)} | max: ${formatMoney(result.overall.maxPrice)} | listings: ${result.overall.listingCount}`
    );

    for (const y of result.years) {
      console.log(
        `    ${y.year}: median ${formatMoney(y.medianPrice)} (p10 ${formatMoney(y.p10Price)} / p90 ${formatMoney(y.p90Price)}) ` +
        `| listings ${y.listingCount} | avg mi ${y.averageMileage ?? 'N/A'}`
      );
      if (y.priceByMileage && Object.keys(y.priceByMileage).length > 0) {
        const band = y.priceByMileage.under25k;
        if (band) {
          console.log(`      under25k mi: avg ${formatMoney(band.averagePrice)} (${band.count} listings)`);
        }
      }
    }

    const records = result.years.map(y => ({
      car_slug: t.carSlug,
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

    if (error) {
      console.log(`  ❌ Save failed: ${error.message}`);
    } else {
      console.log(`  💾 Saved ${records.length} year rows to car_market_pricing_years`);
    }
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});













