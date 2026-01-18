#!/usr/bin/env node
/**
 * Owner's Manual Reference Finder
 * 
 * LEGAL APPROACH:
 * - Finds links to official OEM owner's manuals (no content extraction)
 * - Uses publicly available specification databases (EPA, NHTSA)
 * - Only extracts factual specifications which are NOT copyrightable
 * - Does NOT download, cache, or redistribute copyrighted manual content
 * - Stores references/links only, not content
 * 
 * This tool helps LOCATE authoritative sources for manual verification,
 * it does NOT scrape or store copyrighted content.
 * 
 * Usage:
 *   node scripts/vehicle-data-pipeline/manual-extractor.mjs --vehicle "2023 Honda Civic Type R"
 */

import { Exa } from 'exa-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArgs } from 'node:util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(projectRoot, '.env.local') });

// Official OEM owner resources pages (linking is fine)
const OEM_OWNER_PORTALS = {
  'Toyota': 'https://www.toyota.com/owners/resources/warranty-owners-manuals',
  'Honda': 'https://owners.honda.com/vehicles/information',
  'Ford': 'https://www.ford.com/support/vehicle/owners-manuals/',
  'Chevrolet': 'https://my.chevrolet.com/resources/manuals',
  'BMW': 'https://www.bmwusa.com/owners-manuals.html',
  'Mercedes-Benz': 'https://www.mbusa.com/en/owners/manuals',
  'Audi': 'https://www.audiusa.com/owners/manuals',
  'Volkswagen': 'https://www.vw.com/en/owners/manuals.html',
  'Porsche': 'https://www.porsche.com/usa/accessoriesandservices/porscheservice/',
  'Subaru': 'https://www.subaru.com/owners/index.html',
  'Mazda': 'https://www.mazdausa.com/owners',
  'Nissan': 'https://www.nissanusa.com/owners/manuals-guides.html',
  'Hyundai': 'https://www.hyundaiusa.com/us/en/owners',
  'Kia': 'https://www.kia.com/us/en/owners-resources',
  'Lexus': 'https://www.lexus.com/owners',
  'Acura': 'https://owners.acura.com/',
  'Ram': 'https://www.ramtrucks.com/owners.html',
  'Dodge': 'https://www.dodge.com/owners.html',
  'Jeep': 'https://www.jeep.com/owners.html',
  'Chrysler': 'https://www.chrysler.com/owners.html'
};

// PUBLIC government/industry data sources (no copyright issues)
const PUBLIC_DATA_SOURCES = {
  epa: {
    name: 'EPA Fuel Economy',
    url: 'https://www.fueleconomy.gov/',
    description: 'Official US government fuel economy data',
    dataTypes: ['fuel_economy', 'fuel_type', 'engine_specs']
  },
  nhtsa: {
    name: 'NHTSA',
    url: 'https://www.nhtsa.gov/',
    description: 'Official US government safety data, recalls, complaints',
    dataTypes: ['safety_ratings', 'recalls', 'complaints', 'tsbs']
  },
  carQuery: {
    name: 'CarQuery API',
    url: 'https://www.carqueryapi.com/',
    description: 'Open vehicle specification database',
    dataTypes: ['basic_specs', 'dimensions', 'engine_specs']
  }
};

/**
 * Find official OEM manual portal link for a brand
 * This just returns the link - no scraping
 */
function getOEMManualPortal(brand) {
  const normalizedBrand = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
  return OEM_OWNER_PORTALS[normalizedBrand] || null;
}

/**
 * Search for manual references using Exa
 * Only returns links, does NOT extract content
 */
async function findManualReferences(car) {
  const exa = process.env.EXA_API_KEY ? new Exa(process.env.EXA_API_KEY) : null;
  
  if (!exa) {
    console.log('⚠️  Exa API not configured - returning OEM portal link only');
    return {
      oemPortal: getOEMManualPortal(car.brand),
      references: []
    };
  }
  
  const brand = car.brand || '';
  const name = car.name || '';
  const year = car.years?.split('-')[0] || '';
  
  console.log(`\n🔍 Finding manual references for ${year} ${brand} ${name}...`);
  
  // Search for official manual pages (not the PDFs themselves)
  const queries = [
    `${brand} ${name} ${year} owner's manual official site:${brand.toLowerCase()}.com`,
    `${year} ${brand} ${name} specifications official`
  ];
  
  const references = [];
  
  for (const query of queries) {
    try {
      const results = await exa.search(query, {
        numResults: 3,
        type: 'auto'
      });
      
      for (const result of results.results || []) {
        // Only include official-looking results
        const isOfficial = result.url.includes(brand.toLowerCase()) ||
                          result.url.includes('nhtsa.gov') ||
                          result.url.includes('fueleconomy.gov');
        
        if (isOfficial) {
          references.push({
            title: result.title,
            url: result.url,
            isOfficial: true,
            note: 'Reference link only - visit for full manual'
          });
        }
      }
    } catch (e) {
      console.warn(`   Search failed: ${e.message}`);
    }
  }
  
  // Dedupe
  const unique = references.filter((r, i, arr) => 
    arr.findIndex(x => x.url === r.url) === i
  );
  
  return {
    oemPortal: getOEMManualPortal(brand),
    references: unique.slice(0, 5)
  };
}

/**
 * Get publicly available specs from government sources
 * These are explicitly public domain / freely available
 */
async function getPublicSpecs(car) {
  const specs = {
    source: 'public_government_data',
    legal_note: 'Data from US government sources (EPA, NHTSA) is public domain',
    data: {}
  };
  
  // EPA data would be fetched via their API (already in pipeline)
  // NHTSA data would be fetched via their API (already in pipeline)
  
  // This function is a placeholder - actual API calls are in the main pipeline
  console.log('📊 Public data sources available:');
  for (const [key, source] of Object.entries(PUBLIC_DATA_SOURCES)) {
    console.log(`   • ${source.name}: ${source.url}`);
  }
  
  return specs;
}

/**
 * Generate manual verification report
 * Provides links and guidance, not extracted content
 */
async function generateVerificationReport(car, existingSpecs = {}) {
  console.log('\n' + '═'.repeat(60));
  console.log('  MANUAL VERIFICATION GUIDE');
  console.log('═'.repeat(60));
  console.log(`\n  Vehicle: ${car.name}`);
  console.log(`  Brand: ${car.brand}`);
  console.log(`  Years: ${car.years || 'Unknown'}`);
  
  // Get OEM portal
  const oemPortal = getOEMManualPortal(car.brand);
  
  console.log('\n' + '─'.repeat(60));
  console.log('  OFFICIAL OEM RESOURCES');
  console.log('─'.repeat(60));
  
  if (oemPortal) {
    console.log(`\n  📖 Official Owner's Manual Portal:`);
    console.log(`     ${oemPortal}`);
    console.log(`\n     → Visit this link to access the official owner's manual`);
    console.log(`     → Look for "Maintenance Schedule" or "Specifications" section`);
  } else {
    console.log(`\n  ⚠️  No known portal for ${car.brand}`);
    console.log(`     Try searching: "${car.brand} owner's manual"`);
  }
  
  console.log('\n' + '─'.repeat(60));
  console.log('  PUBLIC GOVERNMENT DATA SOURCES');
  console.log('─'.repeat(60));
  
  console.log(`\n  These sources are public domain and freely usable:`);
  console.log(`\n  • EPA Fuel Economy: https://www.fueleconomy.gov/`);
  console.log(`    → Official MPG, fuel type, engine specs`);
  console.log(`\n  • NHTSA: https://www.nhtsa.gov/`);
  console.log(`    → Safety ratings, recalls, TSBs, complaints`);
  
  console.log('\n' + '─'.repeat(60));
  console.log('  SPECS TO VERIFY MANUALLY');
  console.log('─'.repeat(60));
  
  // List specs that should be verified
  const criticalSpecs = [
    { field: 'oil_viscosity', current: existingSpecs.oil_viscosity },
    { field: 'oil_capacity_quarts', current: existingSpecs.oil_capacity_quarts },
    { field: 'spark_plug_gap_mm', current: existingSpecs.spark_plug_gap_mm },
    { field: 'wheel_lug_torque_ft_lbs', current: existingSpecs.wheel_lug_torque_ft_lbs },
    { field: 'fuel_octane_minimum', current: existingSpecs.fuel_octane_minimum }
  ];
  
  console.log(`\n  Please verify these specs in the owner's manual:\n`);
  for (const spec of criticalSpecs) {
    const status = spec.current ? `Current: ${spec.current}` : 'Missing';
    console.log(`  • ${spec.field}: ${status}`);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('  LEGAL NOTE');
  console.log('═'.repeat(60));
  console.log(`
  This tool provides LINKS to official resources only.
  It does NOT download, cache, or redistribute copyrighted content.
  
  Factual specifications (oil viscosity, torque values, etc.) are
  not copyrightable, but the presentation in manuals is protected.
  
  For commercial use, verify specs directly from official sources.
`);
  
  return {
    oemPortal,
    publicSources: PUBLIC_DATA_SOURCES,
    specsToVerify: criticalSpecs,
    legalNote: 'Links only - no copyrighted content extracted'
  };
}

/**
 * Simplified verification - just checks if we have a manual reference
 * Does NOT extract copyrighted content
 */
async function verifyAgainstManual(car, dbSpecs, options = {}) {
  const report = await generateVerificationReport(car, dbSpecs);
  
  return {
    verified: false, // Can't auto-verify without reading copyrighted content
    manualRequired: true,
    oemPortal: report.oemPortal,
    guidance: 'Please manually verify critical specs at the OEM portal',
    specsToCheck: report.specsToVerify.filter(s => !s.current || options.checkAll)
  };
}

// CLI
async function main() {
  const { values } = parseArgs({
    options: {
      'vehicle': { type: 'string', short: 'v' },
      'brand': { type: 'string', short: 'b' },
      'year': { type: 'string', short: 'y' },
      'help': { type: 'boolean', short: 'h' }
    }
  });
  
  if (values.help) {
    console.log(`
Owner's Manual Reference Finder

LEGAL APPROACH:
  • Finds LINKS to official OEM owner's manuals
  • Uses public government data (EPA, NHTSA)
  • Does NOT extract or store copyrighted content
  • Provides guidance for manual verification

Usage:
  node manual-extractor.mjs -v "2023 Honda Civic Type R"
  node manual-extractor.mjs -b "Honda" -y "2023" -v "Civic Type R"
  
Options:
  -v, --vehicle    Vehicle name
  -b, --brand      Brand name  
  -y, --year       Model year
  -h, --help       Show help
`);
    return;
  }
  
  if (!values.vehicle) {
    console.error('Error: --vehicle required');
    process.exit(1);
  }
  
  // Parse brand from vehicle name if not provided
  let brand = values.brand;
  if (!brand && values.vehicle) {
    const words = values.vehicle.split(' ');
    // Common brand detection
    const brands = Object.keys(OEM_OWNER_PORTALS);
    brand = brands.find(b => words.some(w => w.toLowerCase() === b.toLowerCase())) || words[0];
  }
  
  const car = {
    name: values.vehicle,
    brand: brand,
    years: values.year || null
  };
  
  await generateVerificationReport(car);
}

export {
  verifyAgainstManual,
  findManualReferences,
  getOEMManualPortal,
  generateVerificationReport,
  getPublicSpecs,
  OEM_OWNER_PORTALS,
  PUBLIC_DATA_SOURCES
};

main().catch(console.error);
