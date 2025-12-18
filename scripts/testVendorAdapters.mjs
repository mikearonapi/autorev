#!/usr/bin/env node
/**
 * Test Vendor Adapters Pattern Matching
 *
 * Verifies that the vendorAdapters patterns correctly match tags to car slugs.
 *
 * Usage:
 *   node scripts/testVendorAdapters.mjs
 *
 * @module scripts/testVendorAdapters
 */

import {
  resolveCarSlugFromTag,
  resolveCarSlugsFromTags,
  parseShopifyTags,
  getVendorConfig,
  getShopifyVendors,
  PRIORITY_CARS,
} from '../lib/vendorAdapters.js';

// ============================================================================
// TEST CASES
// ============================================================================

const TEST_CASES = [
  // VAG
  { tag: 'MK7-GTI', expected: 'volkswagen-gti-mk7', family: 'vag' },
  { tag: 'MK7 GTI 2.0T I4 [MQB]', expected: 'volkswagen-gti-mk7', family: 'vag' },
  { tag: 'GTI 2.0T (Mk7)', expected: 'volkswagen-gti-mk7', family: 'vag' },
  { tag: 'MK7-R', expected: 'volkswagen-golf-r-mk7', family: 'vag' },
  { tag: 'Golf R 2.0T (Mk7)', expected: 'volkswagen-golf-r-mk7', family: 'vag' },
  { tag: '8V-RS3', expected: 'audi-rs3-8v', family: 'vag' },
  { tag: 'RS3 2.5T (8V)', expected: 'audi-rs3-8v', family: 'vag' },
  { tag: '8Y-RS3', expected: 'audi-rs3-8y', family: 'vag' },
  { tag: '8S-TTRS', expected: 'audi-tt-rs-8s', family: 'vag' },
  { tag: 'R8 V10', expected: 'audi-r8-v10', family: 'vag' },

  // BMW
  { tag: 'E46 M3', expected: 'bmw-m3-e46', family: 'bmw' },
  { tag: 'E92 M3', expected: 'bmw-m3-e92', family: 'bmw' },
  { tag: 'F80 M3', expected: 'bmw-m3-f80', family: 'bmw' },
  { tag: 'F82 M4', expected: 'bmw-m4-f82', family: 'bmw' },
  { tag: 'M2 Competition', expected: 'bmw-m2-competition', family: 'bmw' },
  { tag: 'S55', expected: 'bmw-m3-f80', family: 'bmw' }, // Engine code

  // Porsche
  { tag: '718 GT4', expected: '718-cayman-gt4', family: 'porsche' },
  { tag: 'Cayman GT4', expected: '718-cayman-gt4', family: 'porsche' },
  { tag: '981 GTS', expected: '981-cayman-gts', family: 'porsche' },
  { tag: '997 GT3', expected: 'porsche-911-gt3-997', family: 'porsche' },

  // Nissan
  { tag: 'R35 GT-R', expected: 'nissan-gt-r', family: 'nissan' },
  { tag: '370Z NISMO', expected: 'nissan-370z-nismo', family: 'nissan' },
  { tag: '350Z', expected: 'nissan-350z', family: 'nissan' },

  // Toyota
  { tag: 'GR Supra', expected: 'toyota-gr-supra', family: 'toyota' },
  { tag: 'A90 Supra', expected: 'toyota-gr-supra', family: 'toyota' },
  { tag: 'GR86', expected: 'toyota-gr86', family: 'toyota' },
  { tag: 'FR-S', expected: 'toyota-86-scion-frs', family: 'toyota' },

  // Domestic
  { tag: 'C8 Corvette', expected: 'c8-corvette-stingray', family: 'domestic' },
  { tag: 'GT350', expected: 'shelby-gt350', family: 'domestic' },
  { tag: 'Camaro ZL1', expected: 'camaro-zl1', family: 'domestic' },

  // Honda
  { tag: 'FK8 Type R', expected: 'honda-civic-type-r-fk8', family: 'honda' },
  { tag: 'Honda S2000', expected: 'honda-s2000', family: 'honda' },

  // Mazda
  { tag: 'ND Miata', expected: 'mazda-mx5-miata-nd', family: 'mazda' },
  { tag: 'FD3S RX-7', expected: 'mazda-rx7-fd3s', family: 'mazda' },

  // Mercedes
  { tag: 'W204 C63', expected: 'mercedes-c63-amg-w204', family: 'mercedes' },

  // Misc / Exotic
  { tag: 'Giulia Quadrifoglio', expected: 'alfa-romeo-giulia-quadrifoglio', family: 'misc' },
  { tag: 'Model 3 Performance', expected: 'tesla-model-3-performance', family: 'misc' },

  // Domestic (expanded)
  { tag: 'CTS-V Gen 3', expected: 'cadillac-cts-v-gen3', family: 'domestic' },
  { tag: 'Viper', expected: 'dodge-viper', family: 'domestic' },
];

// ============================================================================
// TEST RUNNER
// ============================================================================

function runTests() {
  console.log('========================================');
  console.log('VENDOR ADAPTERS TEST SUITE');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  console.log('Pattern Matching Tests:\n');

  for (const { tag, expected, family } of TEST_CASES) {
    const result = resolveCarSlugFromTag(tag, [family]);

    if (result?.car_slug === expected) {
      console.log(`  ✓ "${tag}" → ${expected} (conf: ${result.confidence.toFixed(2)})`);
      passed++;
    } else {
      console.log(`  ✗ "${tag}" → expected ${expected}, got ${result?.car_slug || 'null'}`);
      failed++;
    }
  }

  console.log('\n----------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('----------------------------------------\n');

  // Test multi-tag resolution
  console.log('Multi-Tag Resolution Test:\n');
  const multiTags = ['MK7 GTI 2.0T I4 [MQB]', 'MQB', 'VAG', 'Turbo'];
  const multiResult = resolveCarSlugsFromTags(multiTags, ['vag']);
  console.log(`  Tags: ${multiTags.join(', ')}`);
  console.log(`  Resolved: ${multiResult.map((r) => r.car_slug).join(', ') || 'none'}`);
  console.log('');

  // Test vendor config
  console.log('Vendor Configuration Test:\n');
  const vendors = ['performancebyie', 'eqtuning', 'bmptuning'];
  for (const key of vendors) {
    const config = getVendorConfig(key);
    if (config) {
      console.log(`  ✓ ${key}: ${config.vendorName} (${config.families?.join(', ')})`);
    } else {
      console.log(`  ✗ ${key}: not found`);
    }
  }
  console.log('');

  // Show priority cars summary
  console.log('Priority Cars Summary:\n');
  console.log(`  Tier 1 (High Priority): ${PRIORITY_CARS.tier1.length} cars`);
  console.log(`  Tier 2 (Medium): ${PRIORITY_CARS.tier2.length} cars`);
  console.log(`  Tier 3 (Standard): ${PRIORITY_CARS.tier3.length} cars`);
  console.log('');

  // Show Shopify vendors
  console.log('Shopify Vendors Available:\n');
  const shopifyVendors = getShopifyVendors();
  for (const v of shopifyVendors) {
    console.log(`  - ${v.vendorName} (${v.vendorKey})`);
  }
  console.log('');

  console.log('========================================');
  console.log(failed === 0 ? 'ALL TESTS PASSED ✓' : `${failed} TESTS FAILED ✗`);
  console.log('========================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();




