#!/usr/bin/env node
/**
 * Parts Pipeline - Shopify Vendor Ingestion
 * 
 * Unified entry point for ingesting parts from Shopify vendor feeds.
 * Wraps partsVendorIngestionService.js with CLI interface.
 * 
 * Usage:
 *   node scripts/data-pipelines/parts/run-shopify-ingest.mjs                # All vendors
 *   node scripts/data-pipelines/parts/run-shopify-ingest.mjs --vendor=eqtuning
 *   node scripts/data-pipelines/parts/run-shopify-ingest.mjs --list         # List vendors
 *   node scripts/data-pipelines/parts/run-shopify-ingest.mjs --dry-run     # Preview only
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const args = process.argv.slice(2);
const flags = {
  vendor: args.find(a => a.startsWith('--vendor='))?.split('=')[1],
  list: args.includes('--list'),
  dryRun: args.includes('--dry-run'),
  help: args.includes('--help') || args.includes('-h'),
};

if (flags.help) {
  console.log(`
Parts Pipeline - Shopify Vendor Ingestion

Usage:
  node scripts/data-pipelines/parts/run-shopify-ingest.mjs [options]

Options:
  --vendor=KEY   Ingest single vendor (e.g., eqtuning)
  --list         List available vendor presets
  --dry-run      Preview without saving to database
  --help, -h     Show this help

Available Vendors:
  eqtuning, bmptuning, performancebyie, ftspeed, 
  titanmotorsports, jhpusa, maperformance
  `);
  process.exit(0);
}

async function main() {
  const { 
    ingestShopifyVendor, 
    SHOPIFY_VENDOR_PRESETS, 
    getShopifyPreset 
  } = await import('../../../lib/partsVendorIngestionService.js');

  const vendors = Object.keys(SHOPIFY_VENDOR_PRESETS);

  if (flags.list) {
    console.log('Available Shopify Vendor Presets:');
    console.log('─'.repeat(60));
    for (const key of vendors) {
      const preset = SHOPIFY_VENDOR_PRESETS[key];
      console.log(`  ${key.padEnd(20)} ${preset.vendorName.padEnd(25)} ${preset.families.join(', ')}`);
    }
    return;
  }

  if (flags.dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be saved\n');
  }

  const vendorsToProcess = flags.vendor ? [flags.vendor] : vendors;
  const results = [];
  const startTime = Date.now();

  console.log('='.repeat(70));
  console.log('PARTS PIPELINE - SHOPIFY VENDOR INGESTION');
  console.log('='.repeat(70));
  console.log(`Vendors to process: ${vendorsToProcess.length}`);
  console.log(`Vendors: ${vendorsToProcess.join(', ')}`);
  console.log('='.repeat(70));

  for (const vendorKey of vendorsToProcess) {
    const preset = getShopifyPreset(vendorKey);
    if (!preset) {
      console.log(`⚠ Skipping ${vendorKey}: no preset found`);
      continue;
    }

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`▶ Starting: ${preset.vendorName} (${vendorKey})`);
    console.log(`  URL: ${preset.vendorUrl}`);
    console.log(`  Families: ${preset.families.join(', ')}`);
    console.log('─'.repeat(70));

    if (flags.dryRun) {
      console.log('  [DRY RUN] Would ingest from this vendor');
      results.push({ vendor: vendorKey, success: true, dryRun: true });
      continue;
    }

    try {
      const result = await ingestShopifyVendor({
        vendorKey,
        vendorName: preset.vendorName,
        vendorUrl: preset.vendorUrl,
        maxPages: 50,
        maxProducts: 10000,
        pageSize: 250,
        sleepMs: 350,
        requireExplicitMapping: false,
        minConfidence: 0.60,
      });

      console.log(`✓ Complete: ${preset.vendorName}`);
      console.log(`  Products: ${result.processedProducts}`);
      console.log(`  Parts: ${result.ingestedParts}`);
      console.log(`  Fitments: ${result.estimatedFitmentsWritten}`);
      console.log(`  Duration: ${(result.durationMs / 1000).toFixed(1)}s`);

      results.push({ vendor: vendorKey, success: true, ...result });
    } catch (err) {
      console.error(`✗ Failed: ${preset.vendorName}`);
      console.error(`  Error: ${err.message}`);
      results.push({ vendor: vendorKey, success: false, error: err.message });
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  // Summary
  const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const successful = results.filter(r => r.success);
  const totalParts = successful.reduce((sum, r) => sum + (r.ingestedParts || 0), 0);
  const totalFitments = successful.reduce((sum, r) => sum + (r.estimatedFitmentsWritten || 0), 0);

  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Duration: ${totalDuration} minutes`);
  console.log(`Vendors Processed: ${successful.length}/${vendorsToProcess.length}`);
  console.log(`Total Parts: ${totalParts.toLocaleString()}`);
  console.log(`Total Fitments: ${totalFitments.toLocaleString()}`);
  console.log('='.repeat(70));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
