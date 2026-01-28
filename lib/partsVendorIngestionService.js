/**
 * @deprecated This module is DEPRECATED as of 2026-01-28.
 * 
 * PROBLEM: This vendor scraping approach incorrectly stores RETAILERS as brand_name
 * instead of actual MANUFACTURERS. For example, an APR exhaust sold by BMP Tuning
 * gets stored with brand_name="BMP Tuning" instead of brand_name="APR".
 * 
 * REPLACEMENT: Use lib/partsResearchService.js with AL batch research instead.
 * The new approach:
 * 1. Uses AL's research_parts_live tool to find parts via web search
 * 2. Extracts actual manufacturer names using AI
 * 3. Stores manufacturer_name separately from vendor information
 * 4. Creates curated recommendations in al_part_recommendations table
 * 
 * To run the new batch research:
 *   node scripts/batchPartsResearch.mjs --pilot   (test with 5 cars)
 *   node scripts/batchPartsResearch.mjs           (full run)
 * 
 * DO NOT use ingestShopifyVendor() or runPartsVendorIngestJob() for new data.
 * Existing scraped data has been flagged with data_source='vendor_scrape' for cleanup.
 */

import { supabaseServiceRole, isSupabaseConfigured } from './supabase.js';
import {
  resolveCarSlugsFromTags,
  getVendorConfig,
} from './vendorAdapters.js';

// ============================================================================
// DEPRECATION WARNING
// ============================================================================
const DEPRECATION_WARNING = `
[DEPRECATED] partsVendorIngestionService is deprecated.
This module incorrectly stores retailer names as brand_name instead of actual manufacturers.
Use lib/partsResearchService.js with AL batch research instead.
See: scripts/batchPartsResearch.mjs
`.trim();

let deprecationWarningLogged = false;
function logDeprecationWarning() {
  if (!deprecationWarningLogged) {
    console.warn(DEPRECATION_WARNING);
    deprecationWarningLogged = true;
  }
}

function requireServiceRole() {
  if (!isSupabaseConfigured || !supabaseServiceRole) {
    throw new Error('Supabase service role not configured');
  }
  return supabaseServiceRole;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitShopifyTags(tags) {
  // Shopify returns `tags` as a comma-separated string.
  return String(tags || '')
    .split(',')
    .map((t) => String(t).trim())
    .filter(Boolean);
}

function categorize({ title, productType, tags }) {
  const t = `${title || ''} ${productType || ''} ${(tags || []).join(' ')}`.toLowerCase();

  if (t.includes('intake') || t.includes('inlet') || t.includes('turbo inlet')) return 'intake';
  if (t.includes('catback') || t.includes('cat-back') || t.includes('exhaust') || t.includes('muffler')) return 'exhaust';
  if (t.includes('downpipe') || t.includes('header')) return 'exhaust';
  if (t.includes('intercooler') || t.includes('heat exchanger') || t.includes('radiator') || t.includes('cooling')) return 'cooling';
  if (t.includes('turbo') || t.includes('supercharger')) return 'forced_induction';
  if (t.includes('coilover') || t.includes('suspension') || t.includes('mount') || t.includes('subframe') || t.includes('sway bar')) return 'suspension';
  if (t.includes('brake') || t.includes('pad') || t.includes('rotor')) return 'brakes';
  if (t.includes('wheel') || t.includes('tire')) return 'wheels_tires';
  if (t.includes('ethanol') || t.includes('fuel') || t.includes('hpfp') || t.includes('injector')) return 'fuel_system';
  if (t.includes('flash') || t.includes('tune') || t.includes('software') || t.includes('stage 1') || t.includes('stage 2')) return 'tune';
  return 'other';
}

function pickPrimarySku(product) {
  const variants = product?.variants || [];
  for (const v of variants) {
    const sku = String(v?.sku || '').trim();
    if (sku) return sku;
  }
  return `${product?.id || 'shopify'}-${String(product?.handle || '').slice(0, 24)}`;
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

async function ensureBrand({ client, brandName, vendorUrl }) {
  const { data: existing, error } = await client
    .from('part_brands')
    .select('id')
    .eq('name', brandName)
    .maybeSingle();

  if (!error && existing?.id) return existing.id;

  const { data: inserted, error: insErr } = await client
    .from('part_brands')
    .insert({
      name: brandName,
      website: vendorUrl || null,
      notes: 'Ingested via Shopify products.json',
    })
    .select('id')
    .single();

  if (insErr) throw insErr;
  return inserted.id;
}

async function getFitmentMappingsForTags({ client, vendorKey, tags }) {
  const normalizedTags = (tags || []).map((t) => String(t).trim()).filter(Boolean);
  if (!vendorKey || normalizedTags.length === 0) return [];

  const { data, error } = await client
    .from('fitment_tag_mappings')
    .select('tag,car_id,car_variant_id,confidence,source_url,notes,metadata')
    .eq('vendor_key', vendorKey)
    .in('tag', normalizedTags);
  if (error) throw error;

  return data || [];
}

/**
 * Infer fitments using pattern matching when no explicit tag mappings exist.
 * This uses the vendorAdapters pattern matching as a fallback.
 *
 * @param {object} options
 * @param {object} options.client - Supabase client
 * @param {string} options.vendorKey - Vendor identifier
 * @param {string[]} options.tags - Product tags
 * @param {string} [options.productUrl] - Product URL for source attribution
 * @returns {Promise<Array>} Inferred fitment mappings
 */
async function inferFitmentsFromPatterns({ client, vendorKey, tags, productUrl }) {
  const normalizedTags = (tags || []).map((t) => String(t).trim()).filter(Boolean);
  if (normalizedTags.length === 0) return [];

  // Get vendor config to determine which families to search
  const vendorConfig = getVendorConfig(vendorKey);
  const families = vendorConfig?.families || [];

  // Resolve car slugs using pattern matching
  const matches = resolveCarSlugsFromTags(normalizedTags, families);
  if (matches.length === 0) return [];

  // Look up car_id for each matched slug
  const carSlugs = matches.map((m) => m.car_slug);
  const { data: cars, error: carsErr } = await client
    .from('cars')
    .select('id, slug')
    .in('slug', carSlugs);
  if (carsErr) throw carsErr;

  const carIdBySlug = new Map((cars || []).map((c) => [c.slug, c.id]));

  // Build fitment mappings
  const result = [];
  for (const match of matches) {
    const carId = carIdBySlug.get(match.car_slug);
    if (!carId) continue;

    result.push({
      tag: match.tags.join(', '),
      car_id: carId,
      car_variant_id: null,
      confidence: match.confidence,
      source_url: productUrl || null,
      notes: `Pattern-inferred from: ${match.tags.join(', ')}`,
      metadata: {
        inference_source: 'vendorAdapters',
        family: match.family,
        matched_patterns: match.tags,
      },
    });
  }

  return result;
}

async function upsertPart({ client, brandId, vendorKey, brandName, vendorUrl, product, category }) {
  const title = product?.title;
  const handle = product?.handle;
  const sku = pickPrimarySku(product);
  const description = stripHtml(product?.body_html);
  const tags = splitShopifyTags(product?.tags);
  const productUrl = `${String(vendorUrl || '').replace(/\/$/, '')}/products/${handle}`;

  const attributes = {
    system: category,
    subSystem: null,
    vehicleTags: tags,
    fitment: { notes: null, modelYears: null, engineCodes: [], drivetrain: null, transmission: null },
    gains: { hp: null, tq: null, notes: null },
    compliance: { emissions: null, emissionsNotes: null, noiseNotes: null },
    install: { difficulty: null, laborHours: null, requiresTune: null, requiresSupportingMods: [] },
    source: {
      vendor: vendorKey,
      externalId: String(product?.id),
      handle,
      productType: product?.product_type || null,
      tagsRaw: tags,
      variants: (product?.variants || []).slice(0, 12).map((v) => ({
        id: v?.id,
        sku: v?.sku,
        title: v?.title,
        price: v?.price,
        available: v?.available,
      })),
      raw: {
        vendor: vendorKey,
        published_at: product?.published_at || null,
        updated_at: product?.updated_at || null,
      },
    },
  };

  const { data, error } = await client
    .from('parts')
    .upsert(
      {
        brand_id: brandId,
        brand_name: brandName,
        name: title,
        part_number: sku,
        category,
        description: description || null,
        attributes,
        quality_tier: 'standard',
        street_legal: null,
        source_urls: [productUrl],
        confidence: 0.55,
        is_active: true,
      },
      { onConflict: 'brand_name,part_number' }
    )
    .select('id,part_number')
    .single();

  if (error) throw error;
  return { partId: data.id, partNumber: data.part_number, productUrl };
}

async function upsertPricingSnapshot({ client, vendorKey, vendorName, vendorUrl, partId, product, productUrl }) {
  const priceCents = pickPriceCents(product);
  if (!priceCents) return;

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await client
    .from('part_pricing_snapshots')
    .upsert(
      {
        part_id: partId,
        vendor_name: vendorName,
        vendor_url: vendorUrl,
        product_url: productUrl,
        currency: 'USD',
        price_cents: priceCents,
        in_stock: null,
        recorded_at: today,
        metadata: {
          vendor: vendorKey,
          price_source: 'shopify_min_variant_price',
        },
      },
      { onConflict: 'part_id,vendor_name,recorded_at' }
    );

  if (error) throw error;
}

async function upsertFitments({ client, partId, productUrl, mappings }) {
  for (const m of mappings) {
    const carId = m?.car_id || null;
    const carVariantId = m?.car_variant_id || null;
    if (!carId && !carVariantId) continue;

    const baseRow = {
      part_id: partId,
      car_id: carId,
      car_variant_id: carVariantId,
      fitment_notes: m?.notes || null,
      requires_tune: false,
      install_difficulty: null,
      estimated_labor_hours: null,
      verified: false,
      confidence: m?.confidence ?? null,
      source_url: m?.source_url || productUrl || null,
      metadata: {
        vendor_mapping_tag: m?.tag || null,
        vendor_mapping: true,
        vendor_mapping_meta: m?.metadata || {},
      },
    };

    // We avoid PostgREST upsert here because partial unique indexes can't be
    // inferred by ON CONFLICT (...) without a matching WHERE clause.
    if (carVariantId) {
      const { data: existing, error: selErr } = await client
        .from('part_fitments')
        .select('id')
        .eq('part_id', partId)
        .eq('car_variant_id', carVariantId)
        .maybeSingle();
      if (selErr) throw selErr;

      if (existing?.id) {
        const { error: updErr } = await client
          .from('part_fitments')
          .update(baseRow)
          .eq('id', existing.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await client
          .from('part_fitments')
          .insert(baseRow);
        if (insErr) throw insErr;
      }
    } else if (carId) {
      const { data: existing, error: selErr } = await client
        .from('part_fitments')
        .select('id')
        .eq('part_id', partId)
        .eq('car_id', carId)
        .is('car_variant_id', null)
        .maybeSingle();
      if (selErr) throw selErr;

      if (existing?.id) {
        const { error: updErr } = await client
          .from('part_fitments')
          .update({ ...baseRow, car_variant_id: null })
          .eq('id', existing.id);
        if (updErr) throw updErr;
      } else {
        const { error: insErr } = await client
          .from('part_fitments')
          .insert({ ...baseRow, car_variant_id: null });
        if (insErr) throw insErr;
      }
    }
  }
}

async function fetchProductsPage({ vendorUrl, page, limit }) {
  const base = String(vendorUrl || '').replace(/\/$/, '');
  const url = `${base}/products.json?limit=${limit}&page=${page}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'AutoRev/parts-ingestion (queue)' } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return await res.json();
}

/**
 * Ingest Shopify vendor into parts tables (fitment-aware, tag-mapping driven).
 *
 * Fitment strategy (in order):
 * 1. Explicit tag mappings from `fitment_tag_mappings` table
 * 2. Pattern-based inference using `vendorAdapters` (fallback)
 *
 * Set `options.requireExplicitMapping = true` to skip pattern inference.
 */
/**
 * @deprecated Use lib/partsResearchService.js with AL batch research instead.
 */
export async function ingestShopifyVendor(options) {
  // LOG DEPRECATION WARNING
  logDeprecationWarning();
  console.warn('[DEPRECATED] ingestShopifyVendor() called - this function will be removed in a future release');

  const client = requireServiceRole();
  const {
    vendorKey,
    vendorName,
    vendorUrl,
    maxPages = 30,
    pageSize = 250,
    sleepMs = 250,
    maxProducts = 5000,
    requireExplicitMapping = false, // If true, skip products without explicit tag mappings
    minConfidence = 0.60, // Minimum confidence for pattern-inferred fitments
  } = options || {};

  if (!vendorKey || !vendorName || !vendorUrl) {
    throw new Error('vendorKey, vendorName, and vendorUrl are required');
  }

  const startedAt = Date.now();
  const brandId = await ensureBrand({ client, brandName: vendorName, vendorUrl });

  let page = 1;
  let processed = 0;
  let ingestedParts = 0;
  let ingestedFitments = 0;
  let skippedNoFitment = 0;
  let inferredFitments = 0;

  while (page <= maxPages && processed < maxProducts) {
    const payload = await fetchProductsPage({ vendorUrl, page, limit: pageSize });
    const products = payload?.products || [];
    if (!Array.isArray(products) || products.length === 0) break;

    for (const product of products) {
      if (processed >= maxProducts) break;
      processed++;

      const tags = splitShopifyTags(product?.tags);
      const handle = product?.handle;
      const productUrl = `${String(vendorUrl || '').replace(/\/$/, '')}/products/${handle}`;

      // Strategy 1: Explicit tag mappings
      let mappings = await getFitmentMappingsForTags({ client, vendorKey, tags });

      // Strategy 2: Pattern-based inference (if no explicit mappings)
      if ((!mappings || mappings.length === 0) && !requireExplicitMapping) {
        const inferred = await inferFitmentsFromPatterns({
          client,
          vendorKey,
          tags,
          productUrl,
        });
        // Filter by minimum confidence
        mappings = inferred.filter((m) => (m.confidence || 0) >= minConfidence);
        if (mappings.length > 0) {
          inferredFitments += mappings.length;
        }
      }

      // Skip if no fitments found
      if (!mappings || mappings.length === 0) {
        skippedNoFitment++;
        continue;
      }

      const category = categorize({ title: product?.title, productType: product?.product_type, tags });
      const { partId } = await upsertPart({
        client,
        brandId,
        vendorKey,
        brandName: vendorName,
        vendorUrl,
        product,
        category,
      });
      ingestedParts++;

      await upsertPricingSnapshot({ client, vendorKey, vendorName, vendorUrl, partId, product, productUrl });
      await upsertFitments({ client, partId, productUrl, mappings });
      ingestedFitments += mappings.length;
    }

    page++;
    if (sleepMs > 0) await sleep(sleepMs);
  }

  return {
    vendorKey,
    vendorName,
    vendorUrl,
    processedProducts: processed,
    ingestedParts,
    estimatedFitmentsWritten: ingestedFitments,
    inferredFitments,
    skippedNoFitment,
    durationMs: Date.now() - startedAt,
  };
}

/**
 * Shopify vendor presets for parts ingestion.
 *
 * These vendors expose /products.json feeds that can be ingested directly.
 * Additional vendor configs are defined in lib/vendorAdapters.js.
 */
export const SHOPIFY_VENDOR_PRESETS = {
  // VAG Specialists
  eqtuning: {
    vendorKey: 'eqtuning',
    vendorName: 'EQTuning',
    vendorUrl: 'https://eqtuning.com',
    families: ['vag'],
  },
  bmptuning: {
    vendorKey: 'bmptuning',
    vendorName: 'BMP Tuning',
    vendorUrl: 'https://www.bmptuning.com',
    families: ['vag'],
  },
  performancebyie: {
    vendorKey: 'performancebyie',
    vendorName: 'Integrated Engineering',
    vendorUrl: 'https://performancebyie.com',
    families: ['vag'],
  },

  // Toyota/Subaru Specialists (verified 2026-01-21)
  ftspeed: {
    vendorKey: 'ftspeed',
    vendorName: 'FT Speed',
    vendorUrl: 'https://www.ftspeed.com',
    families: ['toyotasubaru', 'subaru'],
  },
  titanmotorsports: {
    vendorKey: 'titanmotorsports',
    vendorName: 'Titan Motorsports',
    vendorUrl: 'https://www.titanmotorsports.com',
    families: ['toyotasubaru'],
  },

  // Honda/Acura Specialists (verified 2026-01-21)
  jhpusa: {
    vendorKey: 'jhpusa',
    vendorName: 'JHP USA',
    vendorUrl: 'https://www.jhpusa.com',
    families: ['honda'],
  },

  // Multi-Brand (verified 2026-01-21)
  maperformance: {
    vendorKey: 'maperformance',
    vendorName: 'MAPerformance',
    vendorUrl: 'https://www.maperformance.com',
    families: ['mitsubishi', 'subaru', 'domestic', 'toyotasubaru'],
  },

  // Additional Subaru / Japanese (NEW - Verified Shopify)
  subimods: {
    vendorKey: 'subimods',
    vendorName: 'Subimods',
    vendorUrl: 'https://www.subimods.com',
    families: ['subaru'],
  },

  // NOTE: The following vendors do NOT have Shopify JSON feeds
  // They require affiliate feed integration (Rakuten/CJ) or manual export:
  // - americanmuscle (Mustang/Camaro/Challenger) - custom platform
  // - extremeterrain (Jeep/Bronco) - custom platform
  // - realtruck (Trucks) - custom platform
  // - twentysevenWon (Civic Type R) - custom platform
  // These are defined in vendorAdapters.js with ingestionType: 'affiliate_feed' or 'manual_export'
};

/**
 * Get preset configuration for a vendor, merging with vendorAdapters config.
 * @param {string} vendorKey
 * @returns {object|null}
 */
export function getShopifyPreset(vendorKey) {
  const preset = SHOPIFY_VENDOR_PRESETS[vendorKey];
  if (!preset) return null;

  // Merge with vendorAdapters config if available
  const adapterConfig = getVendorConfig(vendorKey);
  return {
    ...preset,
    ...adapterConfig,
    vendorKey: preset.vendorKey, // Ensure vendorKey from preset takes precedence
  };
}

/**
 * @deprecated Use lib/partsResearchService.js with AL batch research instead.
 */
export async function runPartsVendorIngestJob(job) {
  // LOG DEPRECATION WARNING
  logDeprecationWarning();
  console.warn('[DEPRECATED] runPartsVendorIngestJob() called - this function will be removed in a future release');

  const vendorKey = job?.source_key || job?.sourceKey || job?.vendorKey || null;
  const payload = job?.job_payload || job?.jobPayload || {};
  const preset = vendorKey ? getShopifyPreset(vendorKey) : null;

  const vendorUrl = payload?.vendorUrl || payload?.vendor_url || preset?.vendorUrl;
  const vendorName = payload?.vendorName || payload?.vendor_name || preset?.vendorName;

  return await ingestShopifyVendor({
    vendorKey,
    vendorName,
    vendorUrl,
    maxPages: payload?.maxPages ?? 30,
    pageSize: payload?.pageSize ?? 250,
    sleepMs: payload?.sleepMs ?? 250,
    maxProducts: payload?.maxProducts ?? 5000,
    requireExplicitMapping: payload?.requireExplicitMapping ?? false,
    minConfidence: payload?.minConfidence ?? 0.60,
  });
}















