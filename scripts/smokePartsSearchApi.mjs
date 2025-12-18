#!/usr/bin/env node
/**
 * Smoke test: public parts search API
 *
 * Requires a running dev server:
 *   npm run dev
 *
 * Usage:
 *   node scripts/smokePartsSearchApi.mjs
 *   BASE_URL=http://localhost:3000 node scripts/smokePartsSearchApi.mjs
 */

import process from 'node:process';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const CASES = [
  // Prefer category filter (q can be empty when carSlug is provided).
  // This avoids brittle keyword matching on seeded part names.
  { carSlug: 'bmw-m3-e46', category: 'intake' },
  { carSlug: '718-cayman-gt4', category: 'exhaust' },
  { carSlug: 'nissan-370z-nismo', category: 'suspension' },
  { carSlug: 'toyota-gr-supra', category: 'brakes' },
  // Domestic platforms: tune vendors vary; validate a guaranteed seeded category.
  { carSlug: 'c8-corvette-stingray', category: 'brakes' },
];

async function checkOne({ carSlug, category, q = '' }) {
  const url = new URL('/api/parts/search', BASE_URL);
  url.searchParams.set('carSlug', carSlug);
  if (q) url.searchParams.set('q', q);
  if (category) url.searchParams.set('category', category);
  url.searchParams.set('limit', '12');

  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // leave null
  }

  if (!res.ok) {
    const msg = json?.error || `${res.status} ${res.statusText}`;
    return { ok: false, carSlug, q, status: res.status, error: msg };
  }

  const count = Number(json?.count ?? 0);
  const firstName = json?.results?.[0]?.name || null;
  return {
    ok: count > 0,
    carSlug,
    q: q || null,
    category: category || null,
    count,
    firstName,
    error: json?.error || null,
    raw: json ? null : text,
  };
}

async function main() {
  console.log(`[smokePartsSearchApi] BASE_URL=${BASE_URL}`);
  let failed = 0;

  for (const c of CASES) {
    const r = await checkOne(c);
    if (r.ok) {
      console.log(`✓ ${r.carSlug} category=${r.category} count=${r.count} first=${r.firstName || '-'}`);
    } else {
      failed++;
      if (typeof r.count === 'number') {
        console.error(`✗ ${r.carSlug} category=${r.category} count=${r.count}`);
      } else if (r.status) {
        console.error(`✗ ${r.carSlug} category=${r.category} status=${r.status} error=${r.error || 'unknown'}`);
      } else {
        console.error(`✗ ${r.carSlug} category=${r.category} error=${r.error || 'unknown'} raw=${(r.raw || '').slice(0, 120)}`);
      }
    }
  }

  if (failed > 0) process.exit(1);
  console.log('OK: parts search API smoke test passed');
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});





