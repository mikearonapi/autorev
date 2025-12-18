/**
 * Enrich car_expert_reviews via existing scrapers (pilot run).
 *
 * This populates `car_expert_reviews` which we then index into the knowledge base
 * (`source_documents` / `document_chunks`) for citeable retrieval.
 *
 * Env (.env.local):
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * Run:
 *   node scripts/enrichEditorialReviewsPilot.mjs
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as cadScraper from '../lib/scrapers/carAndDriverScraper.js';
import * as mtScraper from '../lib/scrapers/motorTrendScraper.js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PILOT_CAR_SLUGS = [
  'volkswagen-gti-mk7',
  'audi-rs3-8v',
  'audi-rs3-8y',
];

function normalizeSource(source) {
  return String(source || '').toLowerCase().replace(/\s+/g, '');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function toRecord({ car, review }) {
  return {
    car_slug: car.slug,
    car_id: car.id,
    source: normalizeSource(review.source),
    source_url: review.url,
    title: review.title,
    overall_rating: review.rating ?? null,
    performance_rating: review.categoryRatings?.performance ?? null,
    handling_rating: review.categoryRatings?.handling ?? null,
    comfort_rating: review.categoryRatings?.comfort ?? null,
    interior_rating: review.categoryRatings?.interior ?? null,
    value_rating: review.categoryRatings?.value ?? null,
    pros: review.highs || review.pros || null,
    cons: review.lows || review.cons || null,
    verdict: review.verdict || null,
    zero_to_sixty: review.testData?.zeroToSixty ?? null,
    zero_to_hundred: review.testData?.zeroToHundred ?? null,
    quarter_mile: review.testData?.quarterMile ?? null,
    quarter_mile_speed: review.testData?.quarterMileSpeed ?? null,
    braking_70_to_0: review.testData?.braking70to0 ?? null,
    skidpad_g: review.testData?.skidpad ?? null,
    review_date: review.reviewDate || review.publishDate || null,
    review_type: review.reviewType || 'review',
    fetched_at: new Date().toISOString(),
  };
}

async function upsertReviewsForCar(car) {
  const inserted = [];

  const cad = await cadScraper.matchCarToCaDReviews(car);
  const cadReviews = cad?.allReviews || [];
  for (const r of cadReviews) {
    if (!r?.url) continue;
    inserted.push(toRecord({ car, review: r }));
  }

  // Small delay between sources (be nice)
  await sleep(500);

  const mt = await mtScraper.matchCarToReviews(car);
  const mtReviews = mt?.allReviews || [];
  for (const r of mtReviews) {
    if (!r?.url) continue;
    inserted.push(toRecord({ car, review: r }));
  }

  // De-dupe by (car_slug, source, source_url)
  const dedup = new Map();
  for (const rec of inserted) {
    const k = `${rec.car_slug}::${rec.source}::${rec.source_url}`;
    if (!dedup.has(k)) dedup.set(k, rec);
  }
  const rows = [...dedup.values()];
  if (rows.length === 0) return { inserted: 0, bySource: {} };

  const { data, error } = await supabase
    .from('car_expert_reviews')
    .upsert(rows, { onConflict: 'car_slug,source,source_url' })
    .select('id,source,car_slug');
  if (error) throw error;

  const bySource = {};
  for (const row of data || []) {
    bySource[row.source] = (bySource[row.source] || 0) + 1;
  }

  return { inserted: (data || []).length, bySource };
}

async function main() {
  const { data: cars, error } = await supabase
    .from('cars')
    .select('id,slug,name,brand,years')
    .in('slug', PILOT_CAR_SLUGS);
  if (error) throw error;

  let total = 0;
  const totalsBySource = {};

  for (const car of cars || []) {
    console.log(`Enriching expert reviews for ${car.slug}...`);
    try {
      const res = await upsertReviewsForCar(car);
      total += res.inserted;
      for (const [k, v] of Object.entries(res.bySource)) totalsBySource[k] = (totalsBySource[k] || 0) + v;
      console.log(`- upserted: ${res.inserted}`);
    } catch (err) {
      console.error(`- failed: ${err?.message || err}`);
    }
    await sleep(900);
  }

  console.log('✅ Done');
  console.log('Total upserted:', total);
  console.log('By source:', totalsBySource);
}

main().catch((err) => {
  console.error('Fatal:', err?.message || err);
  process.exit(1);
});






