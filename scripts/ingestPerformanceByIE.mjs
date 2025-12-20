/**
 * Pilot parts ingestion: Integrated Engineering (performancebyie.com)
 *
 * Strategy:
 * - Use public Shopify JSON feed (`/products.json`) with conservative paging.
 * - Only ingest products that match our current sports-car catalog coverage:
 *   - Audi RS3 8V (audi-rs3-8v)
 *   - Audi RS3 8Y (audi-rs3-8y)
 *   - VW GTI Mk7 (volkswagen-gti-mk7)
 *
 * Writes:
 * - part_brands (Integrated Engineering)
 * - parts
 * - part_fitments (car_id mapping via tag normalization)
 * - part_pricing_snapshots (from Shopify variant prices)
 *
 * Env (.env.local):
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * Run:
 *   node scripts/ingestPerformanceByIE.mjs
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { resolveFitmentFromTags } from '../lib/fitmentNormalizer.js';

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

const VENDOR = {
  key: 'performancebyie',
  name: 'Integrated Engineering',
  baseUrl: 'https://performancebyie.com',
  vendorUrl: 'https://performancebyie.com',
};

// VAG pilot mapping (vendor platform tags -> our car slugs)
const TAG_TO_CAR_SLUG = new Map([
  ['8V-RS3', 'audi-rs3-8v'],
  ['8Y-RS3', 'audi-rs3-8y'],
  ['MK7-GTI', 'volkswagen-gti-mk7'],
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function categorize({ title, productType, tags }) {
  const t = `${title || ''} ${productType || ''} ${(tags || []).join(' ')}`.toLowerCase();

  if (t.includes('intake') || t.includes('inlet') || t.includes('turbo inlet')) return 'intake';
  if (t.includes('catback') || t.includes('cat-back') || t.includes('exhaust')) return 'exhaust';
  if (t.includes('downpipe') || t.includes('header')) return 'exhaust';
  if (t.includes('intercooler') || t.includes('heat exchanger') || t.includes('cooling')) return 'cooling';
  if (t.includes('turbo') || t.includes('supercharger')) return 'forced_induction';
  if (t.includes('coilover') || t.includes('suspension') || t.includes('subframe') || t.includes('mount')) return 'suspension';
  if (t.includes('brake') || t.includes('pad') || t.includes('rotor')) return 'brakes';
  if (t.includes('wheel') || t.includes('tire')) return 'wheels_tires';
  if (t.includes('ethanol') || t.includes('fuel') || t.includes('hpfp') || t.includes('injector')) return 'fuel_system';
  if (t.includes('flash') || t.includes('tune') || t.includes('software')) return 'tune';
  return 'other';
}

function extractVehicleTags(tags = []) {
  const out = [];
  for (const tag of tags) {
    const normalized = String(tag).trim();
    if (TAG_TO_CAR_SLUG.has(normalized)) out.push(normalized);
  }
  return out;
}

async function ensureBrand() {
  const { data: existing, error } = await supabase
    .from('part_brands')
    .select('id')
    .eq('name', VENDOR.name)
    .maybeSingle();

  if (!error && existing?.id) return existing.id;

  const { data: inserted, error: insErr } = await supabase
    .from('part_brands')
    .insert({
      name: VENDOR.name,
      website: VENDOR.vendorUrl,
      notes: 'Pilot ingestion via Shopify products.json',
    })
    .select('id')
    .single();

  if (insErr) throw insErr;
  return inserted.id;
}

async function getCarIds() {
  const slugs = [...new Set([...TAG_TO_CAR_SLUG.values()])];
  const { data, error } = await supabase
    .from('cars')
    .select('id,slug')
    .in('slug', slugs);

  if (error) throw error;
  const map = new Map();
  for (const row of data || []) map.set(row.slug, row.id);
  return map;
}

async function fetchProductsPage(page, limit = 250) {
  const url = `${VENDOR.baseUrl}/products.json?limit=${limit}&page=${page}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'AutoRev/parts-ingestion (pilot)' } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return await res.json();
}

function pickPrimarySku(product) {
  const variants = product?.variants || [];
  for (const v of variants) {
    const sku = String(v?.sku || '').trim();
    if (sku) return sku;
  }
  return `IE-${product?.id}`;
}

function pickPriceCents(product) {
  const variants = product?.variants || [];
  const prices = [];
  for (const v of variants) {
    const price = Number(v?.price);
    if (Number.isFinite(price)) prices.push(price);
  }
  if (prices.length === 0) return null;
  const min = Math.min(...prices);
  return Math.round(min * 100);
}

async function upsertPart({ brandId, product, category }) {
  const title = product.title;
  const handle = product.handle;
  const sku = pickPrimarySku(product);
  const description = stripHtml(product.body_html);
  const tags = product.tags || [];
  const productUrl = `${VENDOR.baseUrl}/products/${handle}`;

  const attributes = {
    system: category,
    subSystem: null,
    vehicleTags: extractVehicleTags(tags),
    fitment: { notes: null, modelYears: null, engineCodes: [], drivetrain: null, transmission: null },
    gains: { hp: null, tq: null, notes: null },
    compliance: { emissions: null, emissionsNotes: null, noiseNotes: null },
    install: { difficulty: null, laborHours: null, requiresTune: null, requiresSupportingMods: [] },
    source: {
      vendor: VENDOR.key,
      externalId: String(product.id),
      handle,
      productType: product.product_type || null,
      tagsRaw: tags,
      variants: (product.variants || []).slice(0, 10).map(v => ({
        id: v.id,
        sku: v.sku,
        title: v.title,
        price: v.price,
        available: v.available,
      })),
      raw: {
        // Keep small and stable
        vendor: VENDOR.key,
        published_at: product.published_at,
        updated_at: product.updated_at,
      },
    },
  };

  const { data, error } = await supabase
    .from('parts')
    .upsert({
      brand_id: brandId,
      brand_name: VENDOR.name,
      name: title,
      part_number: sku,
      category,
      description: description || null,
      attributes,
      quality_tier: 'premium',
      street_legal: null,
      source_urls: [productUrl],
      confidence: 0.6,
      is_active: true,
    }, { onConflict: 'brand_name,part_number' })
    .select('id,part_number')
    .single();

  if (error) throw error;
  return { partId: data.id, partNumber: data.part_number, productUrl };
}

async function upsertPricingSnapshot({ partId, product, productUrl }) {
  const priceCents = pickPriceCents(product);
  if (!priceCents) return;

  const { error } = await supabase.from('part_pricing_snapshots').upsert({
    part_id: partId,
    vendor_name: VENDOR.name,
    vendor_url: VENDOR.vendorUrl,
    product_url: productUrl,
    currency: 'USD',
    price_cents: priceCents,
    in_stock: null,
    recorded_at: new Date().toISOString().slice(0, 10),
    metadata: {
      vendor: VENDOR.key,
      price_source: 'shopify_min_variant_price',
    },
  }, { onConflict: 'part_id,vendor_name,recorded_at' });

  if (error) throw error;
}

async function insertFitments({ partId, product, carIdsBySlug }) {
  const tags = product.tags || [];
  const vehicleTags = extractVehicleTags(tags);
  const matchedCarSlugs = [...new Set(vehicleTags.map(t => TAG_TO_CAR_SLUG.get(t)).filter(Boolean))];

  for (const carSlug of matchedCarSlugs) {
    const carId = carIdsBySlug.get(carSlug);
    if (!carId) continue;

    // Prefer variant mapping when we can resolve it
    let carVariantId = null;
    try {
      const tagsForThisCar = vehicleTags.filter(t => TAG_TO_CAR_SLUG.get(t) === carSlug);
      const resolved = await resolveFitmentFromTags({
        client: supabase,
        vendorKey: VENDOR.key,
        tags: tagsForThisCar,
      });
      if (resolved?.carVariantId) carVariantId = resolved.carVariantId;
    } catch {}

    // Avoid duplicate fitments for the same part/car
    const { data: existing, error: exErr } = await supabase
      .from('part_fitments')
      .select('id,car_variant_id')
      .eq('part_id', partId)
      .eq('car_id', carId)
      .maybeSingle();
    if (exErr) throw exErr;
    if (existing?.id) {
      // Backfill variant_id if we have it and the row doesn't yet.
      if (carVariantId && existing.car_variant_id !== carVariantId) {
        const { error: upErr } = await supabase
          .from('part_fitments')
          .update({
            car_variant_id: carVariantId,
            fitment_notes: `Matched via IE tags: ${vehicleTags.join(', ')} (variant mapped)`,
          })
          .eq('id', existing.id);
        if (upErr) throw upErr;
      }
      continue;
    }

    const { error } = await supabase.from('part_fitments').insert({
      part_id: partId,
      car_id: carId,
      car_variant_id: carVariantId,
      fitment_notes: `Matched via IE tags: ${vehicleTags.join(', ')}${carVariantId ? ' (variant mapped)' : ''}`,
      requires_tune: null,
      install_difficulty: null,
      estimated_labor_hours: null,
      verified: false,
      confidence: 0.45,
      source_url: `${VENDOR.baseUrl}/products/${product.handle}`,
      metadata: { vendor: VENDOR.key, tags: tags },
    });
    if (error) throw error;
  }
}

async function main() {
  console.log(`Pilot ingest: ${VENDOR.name} (${VENDOR.baseUrl})`);
  const brandId = await ensureBrand();
  const carIdsBySlug = await getCarIds();

  const maxPartsToIngest = 75;
  const pageLimit = 250;
  const maxPages = 12; // hard stop
  const requestDelayMs = 650;

  let ingested = 0;
  let scanned = 0;
  let page = 1;

  while (page <= maxPages && ingested < maxPartsToIngest) {
    const json = await fetchProductsPage(page, pageLimit);
    const products = json?.products || [];
    if (products.length === 0) break;

    for (const product of products) {
      scanned++;
      const tags = product.tags || [];
      const category = categorize({ title: product.title, productType: product.product_type, tags });
      const vehicleTags = extractVehicleTags(tags);
      if (vehicleTags.length === 0) continue; // skip non-matching platforms in pilot

      const { partId, productUrl } = await upsertPart({ brandId, product, category });
      await upsertPricingSnapshot({ partId, product, productUrl });
      await insertFitments({ partId, product, carIdsBySlug });

      ingested++;
      if (ingested % 10 === 0) {
        console.log(`- ingested ${ingested}/${maxPartsToIngest} (scanned ${scanned}, page ${page})`);
      }

      if (ingested >= maxPartsToIngest) break;
    }

    page++;
    await sleep(requestDelayMs);
  }

  console.log(`✅ Done. Ingested ${ingested} parts (scanned ${scanned} products).`);
}

main().catch((err) => {
  console.error('❌ Failed:', err?.message || err);
  process.exit(1);
});













