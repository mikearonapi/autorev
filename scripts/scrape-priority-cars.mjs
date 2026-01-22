#!/usr/bin/env node
/**
 * Priority Car Lap Times Scraper
 * 
 * Scrapes lap times for high-priority cars from the Top 100 Modifications Market list.
 * These are the vehicles our main customers drive.
 * 
 * Usage:
 *   node scripts/scrape-priority-cars.mjs
 *   node scripts/scrape-priority-cars.mjs --dry-run
 *   node scripts/scrape-priority-cars.mjs --batch 1  (run batch 1 of priority cars)
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import lapTimesScraper from '../lib/lapTimesScraper.js';
import firecrawlClient from '../lib/firecrawlClient.js';

// Top 100 Priority cars from Market Research - organized by importance
// These are searchable names optimized for FastestLaps.com
const PRIORITY_CARS = [
  // Tier 1: Market Leaders (Top 10)
  'Ford F-150',
  'Jeep Wrangler',
  'Ford Mustang GT',
  'Ford Mustang GT500',
  'Ford Mustang Boss 302',
  'Chevrolet Silverado',
  'Volkswagen Golf GTI',
  'Chevrolet Corvette',
  'Toyota Tacoma',
  'Subaru WRX STI',
  'Ram 1500',
  'BMW 3 Series',
  'BMW 335i',
  
  // Tier 2: Major Platforms (11-20)
  'Chevrolet Camaro SS',
  'Chevrolet Camaro Z28',
  'Honda Civic Si',
  'Honda Civic Type R',
  'Ford Bronco',
  'Ram 2500 Cummins',
  'Ford F-250 Super Duty',
  'Mazda MX-5 Miata',
  'Mazda Miata',
  'Toyota 4Runner',
  'Dodge Challenger',
  'Dodge Challenger Hellcat',
  'Golf R',
  'BMW M3',
  'BMW M4',
  
  // Tier 3: Strong Enthusiast Platforms (21-30)
  'Porsche 911',
  'Porsche 911 GT3',
  'Porsche 911 Turbo',
  'Dodge Charger',
  'Acura RSX Type-S',
  'Acura Integra Type R',
  'GMC Sierra',
  'Audi S4',
  'Audi A4',
  'Nissan 240SX',
  'Nissan Silvia S15',
  'Toyota Tundra',
  'Ford Focus ST',
  'Nissan 350Z',
  'Nissan 370Z',
  'Jeep Gladiator',
  
  // Tier 4: Established Communities (31-40)
  'Honda S2000',
  'Mitsubishi Lancer Evolution',
  'Mitsubishi Evo X',
  'Ford Ranger',
  'Ford Ranger Raptor',
  'Chevrolet Colorado ZR2',
  'GMC Canyon',
  'Toyota 86',
  'Scion FR-S',
  'Subaru BRZ',
  'Audi RS3',
  'Audi S3',
  'BMW M2',
  'BMW 1 Series M',
  'Mercedes C63 AMG',
  'Toyota Supra',
  'Toyota Supra MK4',
  'Toyota GR Supra',
  
  // Tier 5: Active Niche Communities (41-50)
  'Porsche Cayman',
  'Porsche Boxster',
  'Porsche 718 Cayman GT4',
  'Nissan GT-R',
  'Infiniti G35',
  'Infiniti G37',
  'Jeep Cherokee',
  'Jeep Grand Cherokee',
  'Mazda RX-7',
  'MINI Cooper S',
  'MINI JCW',
  'Audi TT RS',
  'Ford Focus RS',
  'Camaro 1969',
  'Mustang 1967',
  
  // Tier 6: Growing Platforms (51-60)
  'Honda Civic Type R FK8',
  'Toyota GR Corolla',
  'Kia Stinger',
  'Hyundai Veloster N',
  'Pontiac Firebird Trans Am',
  'Tesla Model 3',
  'Tesla Model 3 Performance',
  'Ford Fiesta ST',
  'Mazdaspeed3',
  'Nissan Frontier',
  'Nissan Skyline GT-R',
  'Nissan Skyline R34',
  
  // Tier 7: Dedicated Niches (61-70)
  'Infiniti Q50',
  'Infiniti Q60',
  'BMW M5',
  'Mazda 3',
  'Nissan Z',
  'Genesis G70',
  'Mercedes E63 AMG',
  'Lexus IS300',
  'Lexus IS350',
  'Audi RS5',
  'Chevrolet SS',
  
  // Tier 8: Specialty Platforms (71-80)
  'Hyundai Elantra N',
  'Pontiac GTO',
  'Mazda RX-8',
  'Toyota MR2',
  'Dodge Viper',
  'Honda Accord 2.0T',
  'Lexus RC F',
  'Lexus IS-F',
  'Acura Integra',
  'Porsche Cayenne',
  
  // Tier 9: Legacy Platforms (81-90)
  'Mercedes AMG GT',
  'Dodge SRT-4',
  'Subaru Forester XT',
  'Subaru Legacy GT',
  'Pontiac G8',
  'Mitsubishi Eclipse',
  'Audi R8',
  'Nissan Titan',
  'Acura NSX',
  'BMW 5 Series',
  
  // Tier 10: Emerging (91-100)
  'Toyota Land Cruiser',
  'Lexus LC 500',
  'Ford Maverick',
  'Hyundai Kona N',
  'Subaru Crosstrek',
  'Toyota GR86',
  'Volkswagen Jetta GLI',
  'Ford GT',
  'Rivian R1T',
  'BMW i4 M50',
];

// Parse arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const batchArg = args.find(a => a.startsWith('--batch'));
const batch = batchArg ? parseInt(batchArg.split('=')[1] || args[args.indexOf('--batch') + 1] || '0', 10) : null;
const help = args.includes('--help') || args.includes('-h');

if (help) {
  console.log(`
Priority Car Lap Times Scraper
Targets the Top 100 vehicles by US modifications market.

Usage:
  node scripts/scrape-priority-cars.mjs [options]

Options:
  --batch <n>    Run a specific batch (1-5, ~20 cars each)
  --dry-run      Don't write to database
  --help         Show this help

Examples:
  node scripts/scrape-priority-cars.mjs --batch 1
  node scripts/scrape-priority-cars.mjs --batch 2 --dry-run
`);
  process.exit(0);
}

async function scrapePriorityCar(carName, stats) {
  try {
    const searchUrl = `https://fastestlaps.com/search?query=${encodeURIComponent(carName)}`;
    console.log(`\n🚗 Searching: ${carName}`);
    
    const searchResult = await firecrawlClient.scrapeUrl(searchUrl, {
      formats: ['markdown', 'links'],
      onlyMainContent: true,
    });
    
    if (!searchResult.success) {
      console.log(`   ⚠️ Search failed: ${searchResult.error}`);
      stats.errors.push({ car: carName, error: searchResult.error });
      return;
    }
    
    // Find model links
    const modelLinks = (searchResult.links || [])
      .filter(link => link.includes('/models/'))
      .map(link => {
        if (link.startsWith('http')) {
          try {
            const url = new URL(link);
            return url.pathname;
          } catch { return link; }
        }
        return link;
      })
      .slice(0, 2); // Top 2 matches per search
    
    if (modelLinks.length === 0) {
      console.log(`   ℹ️ No models found on FastestLaps`);
      stats.notFound.push(carName);
      return;
    }
    
    console.log(`   Found ${modelLinks.length} model(s)`);
    
    for (const modelPath of modelLinks) {
      const modelSlug = modelPath.replace(/^\/models\//, '').split('/')[0];
      
      const carResult = await lapTimesScraper.scrapeFastestLapsCarPage(modelSlug);
      
      if (!carResult.success) {
        continue;
      }
      
      stats.lapTimesFound += carResult.lapTimeCount;
      console.log(`   📊 ${modelSlug}: ${carResult.lapTimeCount} lap times`);
      
      // Rate limiting between model pages
      await new Promise(r => setTimeout(r, 1000));
    }
    
    stats.carsProcessed++;
    
  } catch (err) {
    console.error(`   ❌ Error: ${err.message}`);
    stats.errors.push({ car: carName, error: err.message });
  }
  
  // Rate limiting between searches
  await new Promise(r => setTimeout(r, 1500));
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     Priority Car Lap Times Scraper (Top 100 Market)            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  // Check configuration
  console.log('\n📋 Configuration:');
  console.log(`   FIRECRAWL_API_KEY: ${process.env.FIRECRAWL_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Dry Run: ${dryRun ? 'YES' : 'NO'}`);
  console.log(`   Total Priority Cars: ${PRIORITY_CARS.length}`);
  
  if (!firecrawlClient.isFirecrawlConfigured()) {
    console.error('\n❌ FIRECRAWL_API_KEY is required');
    process.exit(1);
  }
  
  // Determine which cars to process
  let carsToProcess;
  const batchSize = 20;
  
  if (batch !== null && batch > 0) {
    const start = (batch - 1) * batchSize;
    const end = start + batchSize;
    carsToProcess = PRIORITY_CARS.slice(start, end);
    console.log(`\n📦 Processing batch ${batch} (cars ${start + 1}-${Math.min(end, PRIORITY_CARS.length)})`);
  } else {
    carsToProcess = PRIORITY_CARS;
    console.log(`\n📦 Processing all ${PRIORITY_CARS.length} priority cars`);
  }
  
  const stats = {
    carsProcessed: 0,
    lapTimesFound: 0,
    notFound: [],
    errors: [],
  };
  
  console.log(`\n🔄 Scraping ${carsToProcess.length} priority cars...`);
  
  for (const carName of carsToProcess) {
    await scrapePriorityCar(carName, stats);
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('═'.repeat(60));
  console.log(`   Cars searched: ${carsToProcess.length}`);
  console.log(`   Cars with results: ${stats.carsProcessed}`);
  console.log(`   Lap times found: ${stats.lapTimesFound}`);
  console.log(`   Not found on FastestLaps: ${stats.notFound.length}`);
  console.log(`   Errors: ${stats.errors.length}`);
  
  if (stats.notFound.length > 0) {
    console.log('\n⚠️ Cars not found on FastestLaps:');
    for (const car of stats.notFound.slice(0, 15)) {
      console.log(`   - ${car}`);
    }
    if (stats.notFound.length > 15) {
      console.log(`   ... and ${stats.notFound.length - 15} more`);
    }
  }
  
  if (stats.errors.length > 0) {
    console.log('\n❌ Errors:');
    for (const err of stats.errors.slice(0, 10)) {
      console.log(`   - ${err.car}: ${err.error}`);
    }
  }
  
  // If not dry run, run the actual import
  if (!dryRun && stats.lapTimesFound > 0) {
    console.log('\n🔄 Now importing lap times to database...');
    console.log('   (Run node scripts/scrape-lap-times.mjs --discover --limit 200 to import)');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
