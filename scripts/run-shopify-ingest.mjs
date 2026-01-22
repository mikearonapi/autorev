#!/usr/bin/env node
/**
 * Run Shopify Vendor Ingestion
 * 
 * Usage:
 *   node scripts/run-shopify-ingest.mjs --vendor ftspeed
 *   node scripts/run-shopify-ingest.mjs --vendor ftspeed --max-pages 5
 *   node scripts/run-shopify-ingest.mjs --list-vendors
 */

// Load env vars FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  // Dynamic import AFTER dotenv has loaded
  const { 
    ingestShopifyVendor, 
    SHOPIFY_VENDOR_PRESETS, 
    getShopifyPreset 
  } = await import('../lib/partsVendorIngestionService.js');

  const args = process.argv.slice(2);
  
  function printUsage() {
    console.log(`
Shopify Vendor Ingestion Script

Usage:
  node scripts/run-shopify-ingest.mjs --vendor <key> [options]
  node scripts/run-shopify-ingest.mjs --list-vendors

Options:
  --vendor <key>      Vendor key (e.g., ftspeed, jhpusa, maperformance)
  --max-pages <n>     Max pages to fetch (default: 30)
  --max-products <n>  Max products to process (default: 5000)
  --list-vendors      Show available vendors

Available Vendors:
${Object.entries(SHOPIFY_VENDOR_PRESETS).map(([key, v]) => 
  `  ${key.padEnd(20)} - ${v.vendorName} (${v.families.join(', ')})`
).join('\n')}
`);
  }
  
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }
  
  if (args.includes('--list-vendors')) {
    console.log('\nConfigured Shopify Vendors:\n');
    for (const [key, preset] of Object.entries(SHOPIFY_VENDOR_PRESETS)) {
      console.log(`  ${key}`);
      console.log(`    Name: ${preset.vendorName}`);
      console.log(`    URL: ${preset.vendorUrl}`);
      console.log(`    Families: ${preset.families.join(', ')}`);
      console.log('');
    }
    process.exit(0);
  }
  
  const vendorIdx = args.indexOf('--vendor');
  if (vendorIdx === -1 || !args[vendorIdx + 1]) {
    console.error('Error: --vendor <key> is required');
    printUsage();
    process.exit(1);
  }
  
  const vendorKey = args[vendorIdx + 1];
  const preset = getShopifyPreset(vendorKey);
  
  if (!preset) {
    console.error(`Error: Unknown vendor "${vendorKey}"`);
    console.log('Use --list-vendors to see available options');
    process.exit(1);
  }
  
  // Parse options
  const maxPagesIdx = args.indexOf('--max-pages');
  const maxPages = maxPagesIdx !== -1 ? parseInt(args[maxPagesIdx + 1], 10) : 30;
  
  const maxProductsIdx = args.indexOf('--max-products');
  const maxProducts = maxProductsIdx !== -1 ? parseInt(args[maxProductsIdx + 1], 10) : 5000;
  
  console.log('='.repeat(60));
  console.log('SHOPIFY VENDOR INGESTION');
  console.log('='.repeat(60));
  console.log(`Vendor: ${preset.vendorName} (${vendorKey})`);
  console.log(`URL: ${preset.vendorUrl}`);
  console.log(`Families: ${preset.families.join(', ')}`);
  console.log(`Max Pages: ${maxPages}`);
  console.log(`Max Products: ${maxProducts}`);
  console.log('='.repeat(60));
  console.log('');
  
  try {
    const result = await ingestShopifyVendor({
      vendorKey,
      vendorName: preset.vendorName,
      vendorUrl: preset.vendorUrl,
      maxPages,
      maxProducts,
      pageSize: 250,
      sleepMs: 300,
      requireExplicitMapping: false,
      minConfidence: 0.60,
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('INGESTION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Products Processed: ${result.processedProducts || 0}`);
    console.log(`Parts Ingested: ${result.ingestedParts || 0}`);
    console.log(`Fitments Written: ${result.estimatedFitmentsWritten || 0}`);
    console.log(`Fitments Inferred: ${result.inferredFitments || 0}`);
    console.log(`Skipped (no fitment): ${result.skippedNoFitment || 0}`);
    console.log(`Duration: ${((result.durationMs || 0) / 1000).toFixed(1)}s`);
    console.log('='.repeat(60));
    
  } catch (err) {
    console.error('\nFATAL ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
