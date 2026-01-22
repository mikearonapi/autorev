#!/usr/bin/env node
/**
 * Firecrawl Parts Extraction Script
 *
 * Uses Firecrawl AI to extract structured parts data from vendor websites.
 * Supports both single URL extraction and batch/crawl extraction.
 *
 * Usage:
 *   node scripts/firecrawl-parts-extract.mjs --vendor <vendorKey> --url <url>
 *   node scripts/firecrawl-parts-extract.mjs --vendor <vendorKey> --crawl
 *   node scripts/firecrawl-parts-extract.mjs --list-vendors
 *
 * @module scripts/firecrawl-parts-extract
 */

import 'dotenv/config';
import {
  extractStructured,
  scrapeUrl,
  startCrawl,
  waitForCrawl,
  scrapeBatch,
} from '../lib/firecrawlClient.js';
import {
  getExtractorConfig,
  getConfiguredExtractors,
  mapExtractedCategory,
} from '../lib/vendorExtractors/index.js';
import { resolveSemaVehicle } from '../lib/semaFitmentMapper.js';
import { supabaseServiceRole, isSupabaseConfigured } from '../lib/supabase.js';

// ============================================================================
// HELPERS
// ============================================================================

function log(msg) {
  console.log(`[Firecrawl-Extract] ${msg}`);
}

function error(msg) {
  console.error(`[Firecrawl-Extract] ERROR: ${msg}`);
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
      notes: 'Ingested via Firecrawl extraction',
    })
    .select('id')
    .single();

  if (insErr) throw insErr;
  return inserted.id;
}

async function upsertPart(partData) {
  const { fitment, price_cents, source_url, ...partFields } = partData;

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
    await supabaseServiceRole.from('part_fitments').upsert(
      {
        part_id: partId,
        car_id: fitment.car_id,
        fitment_notes: 'Extracted via Firecrawl AI',
        requires_tune: false,
        verified: false,
        confidence: fitment.confidence,
        source_url,
        metadata: {
          source: 'firecrawl_extraction',
          vendor: partFields.attributes?.source?.vendor,
        },
      },
      { onConflict: 'part_id,car_id' }
    );
  }

  // Upsert pricing
  if (price_cents) {
    const today = new Date().toISOString().slice(0, 10);
    await supabaseServiceRole.from('part_pricing_snapshots').upsert(
      {
        part_id: partId,
        vendor_name: partFields.brand_name,
        vendor_url: source_url,
        product_url: source_url,
        currency: 'USD',
        price_cents,
        recorded_at: today,
        metadata: { source: 'firecrawl_extraction' },
      },
      { onConflict: 'part_id,vendor_name,recorded_at' }
    );
  }

  return partId;
}

// ============================================================================
// EXTRACTION
// ============================================================================

/**
 * Map extracted data to AutoRev part format
 */
function mapExtractedToPart(extracted, vendorConfig, sourceUrl) {
  const {
    name,
    partNumber,
    price,
    brand,
    category,
    description,
    gains,
    fitment,
    stage,
    requirements,
  } = extracted;

  // Map category
  const mappedCategory = mapExtractedCategory(category, vendorConfig.vendorKey);

  // Build attributes
  const attributes = {
    system: mappedCategory,
    subSystem: null,
    vehicleTags: [],
    fitment: {
      notes: null,
      modelYears: null,
      engineCodes: [],
      drivetrain: null,
      transmission: null,
    },
    gains: gains || { hp: null, tq: null, notes: null },
    compliance: {
      emissions: null,
      emissionsNotes: null,
      noiseNotes: null,
    },
    install: {
      difficulty: null,
      laborHours: null,
      requiresTune: stage ? true : null,
      requiresSupportingMods: requirements || [],
    },
    source: {
      vendor: vendorConfig.vendorKey,
      vendorName: vendorConfig.vendorName,
      extractedAt: new Date().toISOString(),
      sourceUrl,
    },
  };

  // Add stage info if tune
  if (stage) {
    attributes.stage = stage;
  }

  // Parse price
  let priceCents = null;
  if (price) {
    priceCents = Math.round(price * 100);
  }

  return {
    brand_name: brand || vendorConfig.vendorName,
    name: name || 'Unknown Product',
    part_number: partNumber || `${vendorConfig.vendorKey}-${Date.now()}`,
    category: mappedCategory,
    description: description || null,
    attributes,
    quality_tier: 'standard',
    street_legal: null,
    source_urls: [sourceUrl],
    confidence: vendorConfig.confidenceBase,
    is_active: true,
    price_cents: priceCents,
    source_url: sourceUrl,
    // Fitment to be resolved separately
    _rawFitment: fitment,
  };
}

/**
 * Extract and save a single product page
 */
async function extractSingleProduct(url, vendorKey, options = {}) {
  const { dryRun = false } = options;

  const config = getExtractorConfig(vendorKey);
  if (!config) {
    throw new Error(`Unknown vendor: ${vendorKey}`);
  }

  log(`Extracting from: ${url}`);

  // Use Firecrawl structured extraction
  const result = await extractStructured(url, config.schema, {
    timeout: 30000,
  });

  if (!result?.data) {
    error('No data extracted');
    return null;
  }

  log(`Extracted: ${result.data.name || 'Unknown'}`);

  if (dryRun) {
    console.log('\nExtracted Data:');
    console.log(JSON.stringify(result.data, null, 2));
    return result.data;
  }

  // Map to part format
  const partData = mapExtractedToPart(result.data, config, url);

  // Try to resolve fitment
  let fitment = null;
  if (partData._rawFitment?.length > 0) {
    const firstFit = partData._rawFitment[0];
    fitment = await resolveSemaVehicle({
      year: firstFit.year || firstFit.years,
      make: firstFit.make,
      model: firstFit.model,
    });
  }

  delete partData._rawFitment;
  partData.fitment = fitment;

  // Save to database
  const partId = await upsertPart(partData);
  log(`Saved part ID: ${partId}`);

  return { partId, data: result.data };
}

/**
 * Extract multiple product URLs
 */
async function extractBatch(urls, vendorKey, options = {}) {
  const { dryRun = false, maxConcurrent = 3 } = options;

  const config = getExtractorConfig(vendorKey);
  if (!config) {
    throw new Error(`Unknown vendor: ${vendorKey}`);
  }

  log(`Batch extracting ${urls.length} URLs for ${config.vendorName}`);

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  // Process in batches
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);

    const batchPromises = batch.map(async (url) => {
      try {
        const result = await extractSingleProduct(url, vendorKey, { dryRun });
        if (result) {
          successCount++;
          return { url, success: true, data: result };
        }
        errorCount++;
        return { url, success: false };
      } catch (err) {
        errorCount++;
        return { url, success: false, error: err.message };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Progress
    log(`Progress: ${Math.min(i + maxConcurrent, urls.length)}/${urls.length} (${successCount} success, ${errorCount} errors)`);

    // Rate limiting
    if (i + maxConcurrent < urls.length) {
      await sleep(1000);
    }
  }

  return { results, successCount, errorCount };
}

/**
 * Crawl vendor catalog and extract products
 */
async function crawlAndExtract(vendorKey, options = {}) {
  const { maxPages = 50, dryRun = false } = options;

  const config = getExtractorConfig(vendorKey);
  if (!config) {
    throw new Error(`Unknown vendor: ${vendorKey}`);
  }

  if (!config.catalogUrls?.length) {
    error(`No catalog URLs configured for ${vendorKey}`);
    return null;
  }

  log(`Starting crawl for ${config.vendorName}`);
  log(`Catalog URLs: ${config.catalogUrls.length}`);

  const allProductUrls = new Set();

  // Crawl each catalog URL
  for (const catalogUrl of config.catalogUrls) {
    log(`Crawling: ${catalogUrl}`);

    try {
      const crawlResult = await startCrawl(catalogUrl, {
        limit: maxPages,
        allowBackwardCrawling: false,
      });

      if (crawlResult?.id) {
        const completed = await waitForCrawl(crawlResult.id, { timeout: 120000 });

        if (completed?.data) {
          // Extract product URLs from crawled pages
          for (const page of completed.data) {
            // Check if URL matches product pattern
            for (const pattern of config.urlPatterns) {
              if (pattern.test(page.url)) {
                allProductUrls.add(page.url);
                break;
              }
            }
          }
        }
      }
    } catch (err) {
      error(`Crawl failed for ${catalogUrl}: ${err.message}`);
    }
  }

  log(`Found ${allProductUrls.size} product URLs`);

  if (allProductUrls.size === 0) {
    return { productUrls: [], results: [], successCount: 0, errorCount: 0 };
  }

  // Extract from discovered URLs
  const urls = Array.from(allProductUrls);
  const { results, successCount, errorCount } = await extractBatch(urls, vendorKey, { dryRun });

  return { productUrls: urls, results, successCount, errorCount };
}

// ============================================================================
// CLI
// ============================================================================

function listVendors() {
  console.log('\nConfigured Firecrawl Extractors:');
  console.log('================================\n');

  for (const key of getConfiguredExtractors()) {
    const config = getExtractorConfig(key);
    console.log(`  ${key}`);
    console.log(`    Name: ${config.vendorName}`);
    console.log(`    URL: ${config.vendorUrl}`);
    console.log(`    Families: ${config.families.join(', ')}`);
    if (config.catalogUrls?.length) {
      console.log(`    Catalog URLs: ${config.catalogUrls.length}`);
    }
    console.log('');
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Firecrawl Parts Extraction Script

Usage:
  node scripts/firecrawl-parts-extract.mjs --vendor <key> --url <url> [--dry-run]
  node scripts/firecrawl-parts-extract.mjs --vendor <key> --urls <file> [--dry-run]
  node scripts/firecrawl-parts-extract.mjs --vendor <key> --crawl [--max-pages <n>] [--dry-run]
  node scripts/firecrawl-parts-extract.mjs --list-vendors

Options:
  --vendor <key>    Vendor key (apr, cobbtuning, kw, stoptech, z1motorsports)
  --url <url>       Single product URL to extract
  --urls <file>     File with list of URLs (one per line)
  --crawl           Crawl vendor catalog and extract products
  --max-pages <n>   Max pages to crawl per catalog URL (default: 50)
  --dry-run         Preview without saving to database
  --list-vendors    List configured vendors

Environment:
  FIRECRAWL_API_KEY   Firecrawl API key

Example:
  node scripts/firecrawl-parts-extract.mjs --vendor apr --url https://www.goapr.com/products/software/stage-1-ecu-upgrade
`);
    process.exit(0);
  }

  if (args.includes('--list-vendors')) {
    listVendors();
    process.exit(0);
  }

  // Parse arguments
  const vendorIdx = args.indexOf('--vendor');
  const urlIdx = args.indexOf('--url');
  const urlsIdx = args.indexOf('--urls');
  const crawlMode = args.includes('--crawl');
  const maxPagesIdx = args.indexOf('--max-pages');
  const dryRun = args.includes('--dry-run');

  if (vendorIdx === -1) {
    error('Missing required argument: --vendor');
    process.exit(1);
  }

  const vendorKey = args[vendorIdx + 1];
  const maxPages = maxPagesIdx !== -1 ? parseInt(args[maxPagesIdx + 1], 10) : 50;

  // Validate vendor
  if (!getExtractorConfig(vendorKey)) {
    error(`Unknown vendor: ${vendorKey}`);
    console.log('Use --list-vendors to see available vendors');
    process.exit(1);
  }

  // Check Firecrawl config
  if (!process.env.FIRECRAWL_API_KEY) {
    error('FIRECRAWL_API_KEY not configured');
    process.exit(1);
  }

  if (!dryRun && !isSupabaseConfigured) {
    error('Supabase not configured');
    process.exit(1);
  }

  try {
    if (crawlMode) {
      // Crawl and extract
      const result = await crawlAndExtract(vendorKey, { maxPages, dryRun });
      console.log('\n========================================');
      console.log('Crawl & Extract Complete');
      console.log('========================================');
      console.log(`Product URLs Found: ${result.productUrls.length}`);
      console.log(`Successfully Extracted: ${result.successCount}`);
      console.log(`Errors: ${result.errorCount}`);
    } else if (urlIdx !== -1) {
      // Single URL
      const url = args[urlIdx + 1];
      await extractSingleProduct(url, vendorKey, { dryRun });
      log('Done!');
    } else if (urlsIdx !== -1) {
      // Batch from file
      const fs = await import('fs/promises');
      const filePath = args[urlsIdx + 1];
      const content = await fs.readFile(filePath, 'utf-8');
      const urls = content.split('\n').map((l) => l.trim()).filter(Boolean);

      const result = await extractBatch(urls, vendorKey, { dryRun });
      console.log('\n========================================');
      console.log('Batch Extract Complete');
      console.log('========================================');
      console.log(`Total URLs: ${urls.length}`);
      console.log(`Successfully Extracted: ${result.successCount}`);
      console.log(`Errors: ${result.errorCount}`);
    } else {
      error('Must specify --url, --urls, or --crawl');
      process.exit(1);
    }
  } catch (err) {
    error(`Fatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

main();
