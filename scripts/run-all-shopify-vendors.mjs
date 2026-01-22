#!/usr/bin/env node
/**
 * Run All Shopify Vendor Ingestions
 * 
 * Runs each vendor sequentially to avoid rate limiting.
 * Logs results to console and summary file.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const { 
    ingestShopifyVendor, 
    SHOPIFY_VENDOR_PRESETS, 
    getShopifyPreset 
  } = await import('../lib/partsVendorIngestionService.js');

  const vendors = Object.keys(SHOPIFY_VENDOR_PRESETS);
  const results = [];
  const startTime = Date.now();

  console.log('='.repeat(70));
  console.log('BATCH SHOPIFY VENDOR INGESTION');
  console.log('='.repeat(70));
  console.log(`Vendors to process: ${vendors.length}`);
  console.log(`Vendors: ${vendors.join(', ')}`);
  console.log('='.repeat(70));
  console.log('');

  for (const vendorKey of vendors) {
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
      console.log(`  Skipped: ${result.skippedNoFitment}`);
      console.log(`  Duration: ${(result.durationMs / 1000).toFixed(1)}s`);

      results.push({
        vendor: vendorKey,
        vendorName: preset.vendorName,
        success: true,
        ...result,
      });

    } catch (err) {
      console.error(`✗ Failed: ${preset.vendorName}`);
      console.error(`  Error: ${err.message}`);
      
      results.push({
        vendor: vendorKey,
        vendorName: preset.vendorName,
        success: false,
        error: err.message,
      });
    }

    // Small delay between vendors
    await new Promise(r => setTimeout(r, 2000));
  }

  // Summary
  const totalDuration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const successful = results.filter(r => r.success);
  const totalParts = successful.reduce((sum, r) => sum + (r.ingestedParts || 0), 0);
  const totalFitments = successful.reduce((sum, r) => sum + (r.estimatedFitmentsWritten || 0), 0);
  const totalProducts = successful.reduce((sum, r) => sum + (r.processedProducts || 0), 0);

  console.log('\n' + '='.repeat(70));
  console.log('BATCH INGESTION COMPLETE');
  console.log('='.repeat(70));
  console.log(`Total Duration: ${totalDuration} minutes`);
  console.log(`Vendors Processed: ${successful.length}/${vendors.length}`);
  console.log(`Total Products Scanned: ${totalProducts.toLocaleString()}`);
  console.log(`Total Parts Ingested: ${totalParts.toLocaleString()}`);
  console.log(`Total Fitments Created: ${totalFitments.toLocaleString()}`);
  console.log('');
  console.log('Per-Vendor Summary:');
  console.log('─'.repeat(70));
  
  for (const r of results) {
    if (r.success) {
      console.log(`  ${r.vendorName.padEnd(25)} ${String(r.ingestedParts).padStart(5)} parts, ${String(r.estimatedFitmentsWritten).padStart(5)} fitments`);
    } else {
      console.log(`  ${r.vendorName.padEnd(25)} FAILED: ${r.error}`);
    }
  }
  
  console.log('='.repeat(70));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
