#!/usr/bin/env node
/**
 * SEMA Data Ingestion Script
 *
 * Batch ingests parts data from SEMA Data API into AutoRev database.
 * Supports ingestion by brand, category, or vehicle fitment.
 *
 * Usage:
 *   node scripts/ingest-sema-data.mjs --brand <brandId>
 *   node scripts/ingest-sema-data.mjs --category <categoryId>
 *   node scripts/ingest-sema-data.mjs --vehicle <year> <make> <model>
 *   node scripts/ingest-sema-data.mjs --list-brands
 *   node scripts/ingest-sema-data.mjs --list-categories
 *
 * Environment variables:
 *   SEMA_DATA_USERNAME - SEMA Data API username
 *   SEMA_DATA_PASSWORD - SEMA Data API password
 *
 * @module scripts/ingest-sema-data
 */

import 'dotenv/config';
import {
  isSemaDataConfigured,
  getBrands,
  getCategories,
  getBulkProductsByBrand,
  getProductsByCategory,
  getProductsByVehicle,
  getProductVehicles,
  mapCategory,
} from '../lib/semaDataClient.js';
import {
  resolveSemaVehicle,
  resolveSemaVehiclesBatch,
  mapSemaProductToPart,
} from '../lib/semaFitmentMapper.js';
import { supabaseServiceRole, isSupabaseConfigured } from '../lib/supabase.js';

// ============================================================================
// HELPERS
// ============================================================================

function log(msg) {
  console.log(`[SEMA-Ingest] ${msg}`);
}

function error(msg) {
  console.error(`[SEMA-Ingest] ERROR: ${msg}`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ensureBrand(brandName) {
  const { data: existing, error: selErr } = await supabaseServiceRole
    .from('part_brands')
    .select('id')
    .eq('name', brandName)
    .maybeSingle();

  if (selErr) throw selErr;
  if (existing?.id) return existing.id;

  const { data: inserted, error: insErr } = await supabaseServiceRole
    .from('part_brands')
    .insert({
      name: brandName,
      notes: 'Ingested from SEMA Data',
    })
    .select('id')
    .single();

  if (insErr) throw insErr;
  return inserted.id;
}

async function upsertPart(partData) {
  const { fitment, price_cents, ...partFields } = partData;

  // Upsert the part
  const { data, error: partErr } = await supabaseServiceRole
    .from('parts')
    .upsert(partFields, { onConflict: 'brand_name,part_number' })
    .select('id')
    .single();

  if (partErr) throw partErr;

  const partId = data.id;

  // Upsert fitment if available
  if (fitment?.car_id) {
    const { error: fitErr } = await supabaseServiceRole.from('part_fitments').upsert(
      {
        part_id: partId,
        car_id: fitment.car_id,
        fitment_notes: 'Resolved from SEMA Data Y/M/M/S',
        requires_tune: false,
        verified: false,
        confidence: fitment.confidence,
        source_url: 'https://www.semadata.org',
        metadata: {
          source: 'sema_data',
          resolved_via: 'semaFitmentMapper',
        },
      },
      { onConflict: 'part_id,car_id' }
    );

    if (fitErr) {
      console.warn(`[SEMA-Ingest] Fitment upsert warning: ${fitErr.message}`);
    }
  }

  // Upsert pricing snapshot if available
  if (price_cents) {
    const today = new Date().toISOString().slice(0, 10);
    await supabaseServiceRole.from('part_pricing_snapshots').upsert(
      {
        part_id: partId,
        vendor_name: 'SEMA Data',
        vendor_url: 'https://www.semadata.org',
        currency: 'USD',
        price_cents,
        recorded_at: today,
        metadata: { source: 'sema_data' },
      },
      { onConflict: 'part_id,vendor_name,recorded_at' }
    );
  }

  return partId;
}

// ============================================================================
// INGESTION METHODS
// ============================================================================

async function ingestByBrand(brandId, options = {}) {
  const { maxPages = 50, dryRun = false } = options;

  log(`Starting brand ingestion for brand ID: ${brandId}`);

  let totalProducts = 0;
  let ingestedParts = 0;
  let ingestedFitments = 0;
  let errors = 0;

  const products = await getBulkProductsByBrand(brandId, {
    maxPages,
    onPage: (pageProducts, pageNum) => {
      log(`  Fetched page ${pageNum}: ${pageProducts.length} products`);
    },
  });

  log(`Total products fetched: ${products.length}`);
  totalProducts = products.length;

  if (dryRun) {
    log('Dry run - not saving to database');
    return { totalProducts, ingestedParts: 0, ingestedFitments: 0, errors: 0 };
  }

  // Process products in batches
  const batchSize = 10;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);

    for (const product of batch) {
      try {
        // Get vehicle fitments for this product
        let fitment = null;
        try {
          const vehicleData = await getProductVehicles(product.PartNumber, brandId);
          const vehicles = vehicleData?.Vehicles || vehicleData?.vehicles || [];

          if (vehicles.length > 0) {
            // Resolve first vehicle fitment
            const firstVehicle = vehicles[0];
            fitment = await resolveSemaVehicle({
              year: firstVehicle.Year || firstVehicle.year,
              make: firstVehicle.Make || firstVehicle.make || firstVehicle.MakeName,
              model: firstVehicle.Model || firstVehicle.model || firstVehicle.ModelName,
              submodel: firstVehicle.SubModel || firstVehicle.submodel || firstVehicle.SubModelName,
            });

            if (fitment) {
              ingestedFitments++;
            }
          }
        } catch (vehicleErr) {
          // Vehicle lookup may fail for some products
        }

        // Map and save the part
        const partData = mapSemaProductToPart(product, fitment);
        await upsertPart(partData);
        ingestedParts++;
      } catch (err) {
        errors++;
        if (errors < 5) {
          error(`Failed to ingest ${product.PartNumber}: ${err.message}`);
        }
      }
    }

    // Progress update
    if ((i + batchSize) % 100 === 0 || i + batchSize >= products.length) {
      log(`Progress: ${Math.min(i + batchSize, products.length)}/${products.length} (${ingestedParts} parts, ${ingestedFitments} fitments)`);
    }

    // Small delay between batches
    await sleep(100);
  }

  return { totalProducts, ingestedParts, ingestedFitments, errors };
}

async function ingestByCategory(categoryId, options = {}) {
  const { maxPages = 20, dryRun = false } = options;

  log(`Starting category ingestion for category ID: ${categoryId}`);

  let totalProducts = 0;
  let ingestedParts = 0;
  let errors = 0;

  let page = 1;
  let hasMore = true;

  while (hasMore && page <= maxPages) {
    try {
      const result = await getProductsByCategory(categoryId, { page, pageSize: 100 });
      const products = result.Products || result.products || [];

      if (products.length === 0) {
        hasMore = false;
        continue;
      }

      log(`  Page ${page}: ${products.length} products`);
      totalProducts += products.length;

      if (!dryRun) {
        for (const product of products) {
          try {
            const partData = mapSemaProductToPart(product, null);
            await upsertPart(partData);
            ingestedParts++;
          } catch (err) {
            errors++;
          }
        }
      }

      page++;
      await sleep(200);
    } catch (err) {
      error(`Failed to fetch page ${page}: ${err.message}`);
      hasMore = false;
    }
  }

  return { totalProducts, ingestedParts, ingestedFitments: 0, errors };
}

async function listBrands() {
  log('Fetching brands from SEMA Data...');
  const brands = await getBrands();
  console.log('\nAvailable Brands:');
  console.log('=================');

  // Sort alphabetically
  const sortedBrands = [...brands].sort((a, b) =>
    (a.BrandName || a.Name || '').localeCompare(b.BrandName || b.Name || '')
  );

  for (const brand of sortedBrands.slice(0, 100)) {
    const id = brand.BrandID || brand.ID || brand.id;
    const name = brand.BrandName || brand.Name || brand.name;
    console.log(`  ${id}: ${name}`);
  }

  if (sortedBrands.length > 100) {
    console.log(`  ... and ${sortedBrands.length - 100} more`);
  }

  console.log(`\nTotal: ${brands.length} brands`);
}

async function listCategories() {
  log('Fetching categories from SEMA Data...');
  const categories = await getCategories();
  console.log('\nAvailable Categories:');
  console.log('=====================');

  for (const cat of categories.slice(0, 50)) {
    const id = cat.CategoryID || cat.ID || cat.id;
    const name = cat.CategoryName || cat.Name || cat.name;
    console.log(`  ${id}: ${name}`);
  }

  if (categories.length > 50) {
    console.log(`  ... and ${categories.length - 50} more`);
  }

  console.log(`\nTotal: ${categories.length} categories`);
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
SEMA Data Ingestion Script

Usage:
  node scripts/ingest-sema-data.mjs --brand <brandId> [--max-pages <n>] [--dry-run]
  node scripts/ingest-sema-data.mjs --category <categoryId> [--max-pages <n>] [--dry-run]
  node scripts/ingest-sema-data.mjs --list-brands
  node scripts/ingest-sema-data.mjs --list-categories

Options:
  --brand <id>      Ingest all products from a brand
  --category <id>   Ingest all products from a category
  --list-brands     List available brands
  --list-categories List available categories
  --max-pages <n>   Maximum pages to fetch (default: 50)
  --dry-run         Preview without saving to database

Environment:
  SEMA_DATA_USERNAME  SEMA Data API username
  SEMA_DATA_PASSWORD  SEMA Data API password
`);
    process.exit(0);
  }

  // Check configuration
  if (!isSemaDataConfigured()) {
    error('SEMA Data not configured. Set SEMA_DATA_USERNAME and SEMA_DATA_PASSWORD');
    process.exit(1);
  }

  if (!isSupabaseConfigured) {
    error('Supabase not configured');
    process.exit(1);
  }

  const dryRun = args.includes('--dry-run');
  const maxPagesIdx = args.indexOf('--max-pages');
  const maxPages = maxPagesIdx !== -1 ? parseInt(args[maxPagesIdx + 1], 10) : 50;

  try {
    if (args.includes('--list-brands')) {
      await listBrands();
    } else if (args.includes('--list-categories')) {
      await listCategories();
    } else if (args.includes('--brand')) {
      const brandIdx = args.indexOf('--brand');
      const brandId = parseInt(args[brandIdx + 1], 10);

      if (!brandId) {
        error('Invalid brand ID');
        process.exit(1);
      }

      const result = await ingestByBrand(brandId, { maxPages, dryRun });
      console.log('\n========================================');
      console.log('Ingestion Complete');
      console.log('========================================');
      console.log(`Total Products: ${result.totalProducts}`);
      console.log(`Ingested Parts: ${result.ingestedParts}`);
      console.log(`Ingested Fitments: ${result.ingestedFitments}`);
      console.log(`Errors: ${result.errors}`);
    } else if (args.includes('--category')) {
      const catIdx = args.indexOf('--category');
      const categoryId = parseInt(args[catIdx + 1], 10);

      if (!categoryId) {
        error('Invalid category ID');
        process.exit(1);
      }

      const result = await ingestByCategory(categoryId, { maxPages, dryRun });
      console.log('\n========================================');
      console.log('Ingestion Complete');
      console.log('========================================');
      console.log(`Total Products: ${result.totalProducts}`);
      console.log(`Ingested Parts: ${result.ingestedParts}`);
      console.log(`Errors: ${result.errors}`);
    } else {
      error('Unknown command. Use --help for usage.');
      process.exit(1);
    }
  } catch (err) {
    error(`Fatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
