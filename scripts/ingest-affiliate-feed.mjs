#!/usr/bin/env node
/**
 * Affiliate Feed Ingestion Script
 *
 * Ingests parts data from affiliate network datafeeds (Rakuten, CJ, ShareASale).
 * Parses CSV/XML feeds and saves to AutoRev database.
 *
 * Usage:
 *   node scripts/ingest-affiliate-feed.mjs --vendor <vendorKey> --file <path>
 *   node scripts/ingest-affiliate-feed.mjs --list-vendors
 *
 * Example:
 *   node scripts/ingest-affiliate-feed.mjs --vendor ecstuning --file ./feeds/ecs-feed.csv
 *
 * @module scripts/ingest-affiliate-feed
 */

import 'dotenv/config';
import { existsSync } from 'fs';
import {
  parseFeed,
  mapProductToPart,
  getFeedConfig,
  getConfiguredVendors,
  getVendorsByNetwork,
} from '../lib/affiliateFeedClient.js';
import { resolveSemaVehicle } from '../lib/semaFitmentMapper.js';
import { supabaseServiceRole, isSupabaseConfigured } from '../lib/supabase.js';
import { logValidationResults, createValidationReport } from '../lib/dataValidation.js';
import { PipelineRun } from '../lib/pipelineLogger.js';

// ============================================================================
// HELPERS
// ============================================================================

function log(msg) {
  console.log(`[Affiliate-Ingest] ${msg}`);
}

function error(msg) {
  console.error(`[Affiliate-Ingest] ERROR: ${msg}`);
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
      notes: 'Ingested from affiliate feed',
    })
    .select('id')
    .single();

  if (insErr) throw insErr;
  return inserted.id;
}

async function upsertPart(partData) {
  const { fitment, price_cents, affiliate_url, ...partFields } = partData;

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
        fitment_notes: 'Resolved from affiliate feed Y/M/M data',
        requires_tune: false,
        verified: false,
        confidence: fitment.confidence,
        source_url: affiliate_url,
        metadata: {
          source: 'affiliate_feed',
          vendor: partFields.attributes?.source?.vendor,
        },
      },
      { onConflict: 'part_id,car_id' }
    );

    if (fitErr) {
      console.warn(`[Affiliate-Ingest] Fitment upsert warning: ${fitErr.message}`);
    }
  }

  // Upsert pricing snapshot if available
  if (price_cents) {
    const today = new Date().toISOString().slice(0, 10);
    const vendorName = partFields.attributes?.source?.vendor || 'Affiliate';

    await supabaseServiceRole.from('part_pricing_snapshots').upsert(
      {
        part_id: partId,
        vendor_name: vendorName,
        vendor_url: affiliate_url,
        product_url: affiliate_url,
        currency: 'USD',
        price_cents,
        recorded_at: today,
        metadata: {
          source: 'affiliate_feed',
          is_affiliate_link: true,
        },
      },
      { onConflict: 'part_id,vendor_name,recorded_at' }
    );
  }

  return partId;
}

// ============================================================================
// INGESTION
// ============================================================================

async function ingestFeed(vendorKey, filePath, options = {}) {
  const { limit, dryRun = false, skipFitment = false } = options;

  const config = getFeedConfig(vendorKey);
  if (!config) {
    throw new Error(`Unknown vendor: ${vendorKey}`);
  }

  // Initialize pipeline run logging
  const pipelineRun = new PipelineRun(`ingest-affiliate-feed:${vendorKey}`, {
    params: { filePath, limit, dryRun, skipFitment },
    triggeredBy: 'manual',
  });

  log(`Starting ingestion for ${config.vendorName} from ${filePath}`);
  log(`  Network: ${config.network}`);
  log(`  Families: ${config.families.join(', ')}`);
  log(`  Dry run: ${dryRun}`);

  // Parse the feed
  log('Parsing feed...');
  const products = await parseFeed(filePath, vendorKey, { limit });
  log(`Parsed ${products.length} products`);

  if (dryRun) {
    log('Dry run - showing sample products:');
    for (const p of products.slice(0, 5)) {
      console.log(`  - ${p.brand} ${p.partNumber}: ${p.name} ($${p.priceCents ? (p.priceCents / 100).toFixed(2) : 'N/A'})`);
    }
    return {
      totalProducts: products.length,
      ingestedParts: 0,
      ingestedFitments: 0,
      errors: 0,
    };
  }

  // Start pipeline tracking
  await pipelineRun.start();

  try {
    // Process products
    let ingestedParts = 0;
    let ingestedFitments = 0;
    let errors = 0;

    const batchSize = 20;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      for (const product of batch) {
        try {
          // Try to resolve fitment if vehicle data is available
          let fitment = null;
          if (!skipFitment && product.vehicle?.year && product.vehicle?.make && product.vehicle?.model) {
            fitment = await resolveSemaVehicle({
              year: product.vehicle.year,
              make: product.vehicle.make,
              model: product.vehicle.model,
            });

            if (fitment) {
              ingestedFitments++;
            }
          }

          // Map and save the part
          const partData = mapProductToPart(product, fitment);
          await upsertPart(partData);
          ingestedParts++;
          pipelineRun.recordCreated();
        } catch (err) {
          errors++;
          pipelineRun.recordFailed(1, err.message);
          if (errors < 5) {
            error(`Failed to ingest ${product.partNumber}: ${err.message}`);
          }
        }
      }

      // Progress update
      if ((i + batchSize) % 200 === 0 || i + batchSize >= products.length) {
        log(`Progress: ${Math.min(i + batchSize, products.length)}/${products.length} (${ingestedParts} parts, ${ingestedFitments} fitments)`);
      }

      // Small delay
      await sleep(50);
    }

    // Complete pipeline run
    await pipelineRun.complete();

    // Log validation results
    logValidationResults(`ingest-affiliate-feed:${vendorKey}`, {
      total: products.length,
      valid: Array(ingestedParts).fill({}),
      invalid: Array(errors).fill({ reason: 'Failed to ingest' }),
    });

    return {
      totalProducts: products.length,
      ingestedParts,
      ingestedFitments,
      errors,
      fitmentCoverage: products.length > 0 ? ((ingestedFitments / products.length) * 100).toFixed(1) + '%' : '0%',
    };
  } catch (err) {
    await pipelineRun.fail(err);
    throw err;
  }
}

function listVendors() {
  console.log('\nConfigured Affiliate Feed Vendors:');
  console.log('==================================\n');

  const networks = ['rakuten', 'cj', 'shareasale'];

  for (const network of networks) {
    const vendors = getVendorsByNetwork(network);
    if (vendors.length === 0) continue;

    console.log(`${network.toUpperCase()}:`);
    for (const v of vendors) {
      console.log(`  ${v.key}`);
      console.log(`    Name: ${v.vendorName}`);
      console.log(`    Families: ${v.families.join(', ')}`);
      console.log(`    Format: ${v.feedFormat}`);
      console.log('');
    }
  }

  console.log('Usage:');
  console.log('  1. Download datafeed from affiliate network dashboard');
  console.log('  2. Run: node scripts/ingest-affiliate-feed.mjs --vendor <key> --file <path>');
  console.log('');
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Affiliate Feed Ingestion Script

Usage:
  node scripts/ingest-affiliate-feed.mjs --vendor <vendorKey> --file <path> [options]
  node scripts/ingest-affiliate-feed.mjs --list-vendors

Options:
  --vendor <key>    Vendor key (e.g., ecstuning, fcpeuro, summitracing)
  --file <path>     Path to datafeed file (CSV or XML)
  --limit <n>       Max products to process
  --dry-run         Preview without saving to database
  --skip-fitment    Skip fitment resolution (faster)
  --list-vendors    List configured vendors

Example:
  node scripts/ingest-affiliate-feed.mjs --vendor ecstuning --file ./feeds/ecs-feed.csv --limit 1000
`);
    process.exit(0);
  }

  if (args.includes('--list-vendors')) {
    listVendors();
    process.exit(0);
  }

  // Parse arguments
  const vendorIdx = args.indexOf('--vendor');
  const fileIdx = args.indexOf('--file');
  const limitIdx = args.indexOf('--limit');
  const dryRun = args.includes('--dry-run');
  const skipFitment = args.includes('--skip-fitment');

  if (vendorIdx === -1 || fileIdx === -1) {
    error('Missing required arguments: --vendor and --file');
    process.exit(1);
  }

  const vendorKey = args[vendorIdx + 1];
  const filePath = args[fileIdx + 1];
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : undefined;

  // Validate
  if (!getFeedConfig(vendorKey)) {
    error(`Unknown vendor: ${vendorKey}`);
    console.log('Use --list-vendors to see available vendors');
    process.exit(1);
  }

  if (!existsSync(filePath)) {
    error(`File not found: ${filePath}`);
    process.exit(1);
  }

  if (!isSupabaseConfigured) {
    error('Supabase not configured');
    process.exit(1);
  }

  // Run ingestion
  try {
    const result = await ingestFeed(vendorKey, filePath, {
      limit,
      dryRun,
      skipFitment,
    });

    console.log('\n========================================');
    console.log('Ingestion Complete');
    console.log('========================================');
    console.log(`Total Products: ${result.totalProducts}`);
    console.log(`Ingested Parts: ${result.ingestedParts}`);
    console.log(`Ingested Fitments: ${result.ingestedFitments}`);
    console.log(`Errors: ${result.errors}`);
  } catch (err) {
    error(`Fatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
