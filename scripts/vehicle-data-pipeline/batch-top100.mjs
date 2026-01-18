#!/usr/bin/env node
/**
 * Batch Processor for Top 100 US Modification Market Vehicles
 * Processes vehicles in priority order based on market size/community
 * 
 * Usage:
 *   node batch-top100.mjs                    # Process all unprocessed vehicles
 *   node batch-top100.mjs --tier 1           # Process only Tier 1 vehicles
 *   node batch-top100.mjs --tier 1,2         # Process Tier 1 and 2
 *   node batch-top100.mjs --resume           # Resume from last progress
 *   node batch-top100.mjs --status           # Show current progress
 *   node batch-top100.mjs --dry-run          # Show what would be processed
 */

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { parseArgs } from 'util';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../../.env.local') });

// =============================================================================
// TOP 100 VEHICLES BY US MODIFICATION MARKET - PRIORITY MAPPED
// =============================================================================

const TOP_100_VEHICLES = [
  // TIER 1: Market Leaders (Massive communities, billions in aftermarket)
  { rank: 1, name: 'Ford F-150', tier: 1, slugs: ['ford-f150-thirteenth', 'ford-f150-fourteenth-generation'] },
  { rank: 2, name: 'Jeep Wrangler JK/JL', tier: 1, slugs: ['jeep-wrangler-jk', 'jeep-wrangler-jl'] },
  { rank: 3, name: 'Ford Mustang', tier: 1, slugs: ['ford-mustang-gt-fox-body', 'ford-mustang-gt-sn95', 'ford-mustang-svt-cobra-sn95', 'ford-mustang-cobra-terminator', 'ford-mustang-boss-302', 'mustang-gt-pp2', 'shelby-gt350', 'shelby-gt500', 'ford-mustang-fastback-1967-1968'] },
  { rank: 4, name: 'Chevrolet Silverado 1500', tier: 1, slugs: ['chevrolet-silverado-1500-fourth-generation', 'chevrolet-silverado-zr2-t1xx'] },
  { rank: 5, name: 'Volkswagen Golf GTI', tier: 1, slugs: ['volkswagen-gti-mk4', 'volkswagen-gti-mk5', 'volkswagen-gti-mk6', 'volkswagen-gti-mk7'] },
  { rank: 6, name: 'Chevrolet Corvette', tier: 1, slugs: ['chevrolet-corvette-c5-z06', 'chevrolet-corvette-c6-z06', 'chevrolet-corvette-c6-grand-sport', 'c7-corvette-z06', 'c7-corvette-grand-sport', 'c8-corvette-stingray', 'chevrolet-corvette-z06-c8'] },
  { rank: 7, name: 'Toyota Tacoma', tier: 1, slugs: ['toyota-tacoma-n300', 'toyota-tacoma-trd-pro-3rd-gen', 'toyota-tacoma-2024'] },
  { rank: 8, name: 'Subaru WRX/STI', tier: 1, slugs: ['subaru-impreza-wrx-gc8', 'subaru-wrx-sti-gc8', 'subaru-wrx-sti-gd', 'subaru-wrx-sti-gr-gv', 'subaru-wrx-sti-va'] },
  { rank: 9, name: 'Ram 1500', tier: 1, slugs: ['ram-1500-dt', 'ram-1500-rebel-dt', 'ram-1500-trx-dt'] },
  { rank: 10, name: 'BMW 3 Series', tier: 1, slugs: ['bmw-335i-e90', 'bmw-340i-f30', 'bmw-m340i-g20'] },

  // TIER 2: Major Platforms (Very large communities, established aftermarket)
  { rank: 11, name: 'Chevrolet Camaro', tier: 2, slugs: ['chevrolet-camaro-ss-ls1', 'chevrolet-camaro-z28-second-generation', 'chevrolet-camaro-ss-1969', 'camaro-ss-1le', 'camaro-zl1'] },
  { rank: 12, name: 'Honda Civic Si/Type R', tier: 2, slugs: ['honda-civic-si-em1', 'honda-civic-si-ep3', 'honda-civic-si-fg2', 'honda-civic-type-r-fk8', 'honda-civic-type-r-fl5'] },
  { rank: 13, name: 'Ford Bronco', tier: 2, slugs: ['ford-bronco-sixth-generation', 'ford-bronco-raptor-sixth-generation'] },
  { rank: 14, name: 'Ram 2500/3500 Cummins', tier: 2, slugs: ['ram-2500-cummins-ds', 'ram-power-wagon-dt'] },
  { rank: 15, name: 'Ford F-250/F-350 Super Duty', tier: 2, slugs: ['ford-f250-powerstroke-fourth-generation'] },
  { rank: 16, name: 'Mazda MX-5 Miata', tier: 2, slugs: ['mazda-mx5-miata-na', 'mazda-mx5-miata-nb', 'mazda-mx5-miata-nc', 'mazda-mx5-miata-nd'] },
  { rank: 17, name: 'Toyota 4Runner', tier: 2, slugs: ['toyota-4runner-trd-pro-n280'] },
  { rank: 18, name: 'Dodge Challenger', tier: 2, slugs: ['dodge-challenger-srt-392', 'dodge-challenger-hellcat'] },
  { rank: 19, name: 'Volkswagen Golf R', tier: 2, slugs: ['volkswagen-golf-r-mk7', 'volkswagen-golf-r-mk8', 'volkswagen-r32-mk4'] },
  { rank: 20, name: 'BMW M3/M4', tier: 2, slugs: ['bmw-m3-e30', 'bmw-m3-e36', 'bmw-m3-e46', 'bmw-m3-e92', 'bmw-m3-f80', 'bmw-m3-g80', 'bmw-m4-f82', 'bmw-m4-csl-g82'] },

  // TIER 3: Strong Enthusiast Platforms
  { rank: 21, name: 'Porsche 911', tier: 3, slugs: ['porsche-911-gt3-996', 'porsche-911-gt3-997', 'porsche-911-gt3-9912', 'porsche-911-gt3-992', 'porsche-911-gt3-rs-992', 'porsche-911-gt2-rs-991', 'porsche-911-turbo-997-1', 'porsche-911-turbo-997-2', 'porsche-911-turbo-s-992', '991-1-carrera-s', '997-2-carrera-s'] },
  { rank: 22, name: 'Dodge Charger', tier: 3, slugs: ['dodge-charger-srt-392', 'dodge-charger-hellcat'] },
  { rank: 23, name: 'Acura Integra/RSX', tier: 3, slugs: ['acura-integra-type-r-dc2', 'acura-integra-type-s-dc5', 'acura-rsx-type-s-dc5'] },
  { rank: 24, name: 'GMC Sierra', tier: 3, slugs: ['gmc-sierra-1500-fourth-generation', 'gmc-sierra-at4x-k2xx'] },
  { rank: 25, name: 'Audi S4/A4', tier: 3, slugs: ['audi-s4-b5', 'audi-s4-b6', 'audi-s4-b7', 'audi-s4-b8', 'audi-s4-b9', 'audi-a4-b8', 'audi-a4-b8-5'] },
  { rank: 26, name: 'Nissan 240SX/Silvia', tier: 3, slugs: ['nissan-240sx-s13', 'nissan-240sx-s14', 'nissan-silvia-s15'] },
  { rank: 27, name: 'Toyota Tundra', tier: 3, slugs: ['toyota-tundra-3rd-gen', 'toyota-tundra-trd-pro-xk70'] },
  { rank: 28, name: 'Ford Focus ST', tier: 3, slugs: ['ford-focus-st-mk3'] },
  { rank: 29, name: 'Nissan 350Z/370Z', tier: 3, slugs: ['nissan-350z', 'nissan-370z-nismo'] },
  { rank: 30, name: 'Jeep Gladiator', tier: 3, slugs: ['jeep-gladiator-jt', 'jeep-gladiator-rubicon-jt', 'jeep-gladiator-mojave-jt'] },

  // TIER 4: Established Modification Communities
  { rank: 31, name: 'Honda S2000', tier: 4, slugs: ['honda-s2000'] },
  { rank: 32, name: 'Mitsubishi Lancer Evolution', tier: 4, slugs: ['mitsubishi-lancer-evolution-viii', 'mitsubishi-lancer-evolution-ix', 'mitsubishi-lancer-evolution-x', 'mitsubishi-lancer-evo-x', 'mitsubishi-lancer-evo-8-9'] },
  { rank: 33, name: 'Ford Ranger', tier: 4, slugs: ['ford-ranger-t6-facelift', 'ford-ranger-raptor-2024'] },
  { rank: 34, name: 'Chevrolet Colorado/GMC Canyon', tier: 4, slugs: ['chevrolet-colorado-zr2-2017-2024', 'gmc-canyon-at4-2017-2024'] },
  { rank: 35, name: 'Toyota 86/Subaru BRZ', tier: 4, slugs: ['toyota-86-scion-frs', 'toyota-gr86', 'subaru-brz-zc6', 'subaru-brz-zd8'] },
  { rank: 36, name: 'Audi RS3/S3/A3', tier: 4, slugs: ['audi-rs3-8v', 'audi-rs3-8y', 'audi-a3-1-8-tfsi-8v'] },
  { rank: 37, name: 'BMW M2/1 Series', tier: 4, slugs: ['bmw-1m-coupe-e82', 'bmw-135i-e82', 'bmw-m2-competition', 'bmw-m2-g87'] },
  { rank: 38, name: 'Mercedes-AMG C63', tier: 4, slugs: ['mercedes-c63-amg-w204', 'mercedes-amg-c63-w205'] },
  { rank: 39, name: 'Toyota Supra MkIV', tier: 4, slugs: ['toyota-supra-mk4-a80-turbo'] },
  { rank: 40, name: 'Toyota GR Supra A90', tier: 4, slugs: ['toyota-gr-supra'] },

  // TIER 5: Active Niche Communities
  { rank: 41, name: 'Porsche Cayman/Boxster', tier: 5, slugs: ['981-cayman-s', '981-cayman-gts', '987-2-cayman-s', '718-cayman-gt4', '718-cayman-gts-40', 'porsche-718-cayman-gt4-rs-982', 'porsche-boxster-s-986', 'porsche-boxster-s-987', 'porsche-boxster-s-981', 'porsche-718-boxster-gts-40-982'] },
  { rank: 42, name: 'Nissan GT-R R35', tier: 5, slugs: ['nissan-gt-r', 'nissan-gt-r-nismo-r35'] },
  { rank: 43, name: 'Infiniti G35/G37', tier: 5, slugs: ['infiniti-g35-coupe-v35', 'infiniti-g37-coupe-cv36', 'infiniti-g37-sedan'] },
  { rank: 44, name: 'Jeep Cherokee/Grand Cherokee', tier: 5, slugs: ['jeep-grand-cherokee-wk2', 'jeep-grand-cherokee-trackhawk-wk2'] },
  { rank: 45, name: 'Mazda RX-7 FD', tier: 5, slugs: ['mazda-rx7-fd3s'] },
  { rank: 46, name: 'MINI Cooper S/JCW', tier: 5, slugs: ['mini-cooper-s-r53', 'mini-cooper-s-r56', 'mini-john-cooper-works-f56'] },
  { rank: 47, name: 'Audi TT/TT RS', tier: 5, slugs: ['audi-tt-rs-8j', 'audi-tt-rs-8s'] },
  { rank: 48, name: 'Ford Focus RS', tier: 5, slugs: ['ford-focus-rs'] },
  { rank: 49, name: 'Classic Camaro', tier: 5, slugs: ['chevrolet-camaro-ss-1969', 'chevrolet-camaro-z28-second-generation'] },
  { rank: 50, name: 'Classic Mustang', tier: 5, slugs: ['ford-mustang-fastback-1967-1968'] },

  // TIER 6: Growing and Emerging Platforms
  { rank: 51, name: 'Honda Civic Type R FK8/FL5', tier: 6, slugs: ['honda-civic-type-r-fk8', 'honda-civic-type-r-fl5'] },
  { rank: 52, name: 'Toyota GR Corolla', tier: 6, slugs: ['toyota-gr-corolla-e210'] },
  { rank: 53, name: 'Kia Stinger', tier: 6, slugs: ['kia-stinger-gt-ck'] },
  { rank: 54, name: 'Hyundai Veloster N', tier: 6, slugs: ['hyundai-veloster-n-js'] },
  { rank: 55, name: 'Pontiac Firebird/Trans Am', tier: 6, slugs: ['pontiac-firebird-trans-am-ws6'] },
  { rank: 56, name: 'Tesla Model 3/Y', tier: 6, slugs: ['tesla-model-3-performance', 'tesla-model-y-performance-2020'] },
  { rank: 57, name: 'Ford Fiesta ST', tier: 6, slugs: [] }, // Not in DB
  { rank: 58, name: 'Mazdaspeed 3', tier: 6, slugs: ['mazda-mazdaspeed3-bl'] },
  { rank: 59, name: 'Nissan Frontier', tier: 6, slugs: ['nissan-frontier-d23'] },
  { rank: 60, name: 'Nissan Skyline GT-R', tier: 6, slugs: ['nissan-skyline-gt-r-r32', 'nissan-skyline-gt-r-r33', 'nissan-skyline-gt-r-r34'] },

  // TIER 7: Dedicated Enthusiast Niches
  { rank: 61, name: 'Infiniti Q50/Q60 Red Sport', tier: 7, slugs: ['infiniti-q50-red-sport-400', 'infiniti-q60-red-sport-400'] },
  { rank: 62, name: 'BMW M5', tier: 7, slugs: ['bmw-m5-e39', 'bmw-m5-e60', 'bmw-m5-f10-competition', 'bmw-m5-f90-competition'] },
  { rank: 63, name: 'Mazda 3', tier: 7, slugs: ['mazda-3-25-turbo-2021'] },
  { rank: 64, name: 'Nissan Z (400Z)', tier: 7, slugs: ['nissan-z-rz34'] },
  { rank: 65, name: 'Jeep Renegade/Compass', tier: 7, slugs: [] }, // Not in DB
  { rank: 66, name: 'Genesis G70', tier: 7, slugs: ['genesis-g70-33t-ik'] },
  { rank: 67, name: 'Mercedes-AMG E63', tier: 7, slugs: ['mercedes-amg-e63-w212', 'mercedes-amg-e63s-w213'] },
  { rank: 68, name: 'Lexus IS', tier: 7, slugs: ['lexus-is300-xe10', 'lexus-is350-xe20', 'lexus-is350-f-sport-xe30'] },
  { rank: 69, name: 'Audi RS4/RS5', tier: 7, slugs: ['audi-rs5-b8', 'audi-rs5-b9'] },
  { rank: 70, name: 'Chevrolet SS', tier: 7, slugs: ['chevrolet-ss-vf'] },

  // TIER 8: Specialty and Collector Platforms
  { rank: 71, name: 'Hyundai Elantra N', tier: 8, slugs: ['hyundai-elantra-n-cn7'] },
  { rank: 72, name: 'Pontiac GTO', tier: 8, slugs: [] }, // Not in DB
  { rank: 73, name: 'Mazda RX-8', tier: 8, slugs: ['mazda-rx-8-se3p'] },
  { rank: 74, name: 'Toyota MR2', tier: 8, slugs: ['toyota-mr2-turbo-sw20', 'toyota-mr2-spyder-zzw30'] },
  { rank: 75, name: 'Dodge Viper', tier: 8, slugs: ['dodge-viper'] },
  { rank: 76, name: 'Honda Accord 2.0T', tier: 8, slugs: ['honda-accord-sport-2-0t-tenth-generation'] },
  { rank: 77, name: 'Lexus RC F', tier: 8, slugs: ['lexus-rc-f'] },
  { rank: 78, name: 'Lexus IS F', tier: 8, slugs: ['lexus-is-f-use20'] },
  { rank: 79, name: 'Acura Integra 2023+', tier: 8, slugs: ['acura-integra-type-s-dc5'] },
  { rank: 80, name: 'Porsche Cayenne', tier: 8, slugs: [] }, // Not in DB

  // TIER 9: Legacy and Declining Platforms
  { rank: 81, name: 'Mercedes-AMG GT', tier: 9, slugs: ['mercedes-amg-gt', 'mercedes-amg-gt-r-c190', 'mercedes-amg-gt-black-series-c190'] },
  { rank: 82, name: 'Dodge SRT-4', tier: 9, slugs: ['dodge-srt-4-2003-2005'] },
  { rank: 83, name: 'Subaru Forester XT', tier: 9, slugs: ['subaru-forester-xt-sg'] },
  { rank: 84, name: 'Subaru Legacy GT', tier: 9, slugs: ['subaru-legacy-gt-spec-b-bl'] },
  { rank: 85, name: 'Pontiac G8', tier: 9, slugs: ['pontiac-g8-gt', 'pontiac-g8-gxp-2009'] },
  { rank: 86, name: 'Mitsubishi Eclipse DSM', tier: 9, slugs: ['mitsubishi-eclipse-gsx-2g'] },
  { rank: 87, name: 'Audi R8', tier: 9, slugs: ['audi-r8-v8', 'audi-r8-v10'] },
  { rank: 88, name: 'Nissan Titan', tier: 9, slugs: [] }, // Not in DB
  { rank: 89, name: 'Acura NSX Original', tier: 9, slugs: ['acura-nsx-na1'] },
  { rank: 90, name: 'BMW 5 Series', tier: 9, slugs: [] }, // Non-M not in DB

  // TIER 10: Micro-Niche and Emerging
  { rank: 91, name: 'Toyota Land Cruiser', tier: 10, slugs: ['toyota-land-cruiser-200-series'] },
  { rank: 92, name: 'Lexus LC', tier: 10, slugs: ['lexus-lc-500'] },
  { rank: 93, name: 'Ford Maverick', tier: 10, slugs: ['ford-maverick-2022-2024'] },
  { rank: 94, name: 'Hyundai Kona N', tier: 10, slugs: ['hyundai-kona-n-2022'] },
  { rank: 95, name: 'Subaru Crosstrek', tier: 10, slugs: ['subaru-crosstrek-xv'] },
  { rank: 96, name: 'Toyota GR86 2nd Gen', tier: 10, slugs: ['toyota-gr86'] },
  { rank: 97, name: 'VW Jetta GLI', tier: 10, slugs: ['volkswagen-jetta-gli-mk6', 'volkswagen-jetta-gli-mk7'] },
  { rank: 98, name: 'Ford GT', tier: 10, slugs: [] }, // Not in DB
  { rank: 99, name: 'Rivian R1T/R1S', tier: 10, slugs: ['rivian-r1t-gen1', 'rivian-r1s-first-generation'] },
  { rank: 100, name: 'BMW i4 M50', tier: 10, slugs: ['bmw-i4-m50-g26'] },
];

// =============================================================================
// CONFIGURATION
// =============================================================================

const PROGRESS_FILE = resolve(__dirname, '.batch-progress.json');
const BATCH_DELAY_MS = 5000; // 5 seconds between vehicles to avoid rate limits

// =============================================================================
// HELPERS
// =============================================================================

function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { processed: [], failed: [], skipped: [], lastRun: null };
}

function saveProgress(progress) {
  progress.lastRun = new Date().toISOString();
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runPipeline(carId, carName) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`🚗 Processing: ${carName}`);
    console.log(`   Car ID: ${carId}`);
    console.log(`${'─'.repeat(60)}`);

    const proc = spawn('node', [
      'scripts/vehicle-data-pipeline/run.mjs',
      '-i', carId,
      '-m', 'full'
    ], {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: process.env
    });

    let output = '';
    let completionPercent = 0;

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      // Extract completion percentage
      const match = text.match(/OVERALL:\s*(\d+)%\s*complete/);
      if (match) {
        completionPercent = parseInt(match[1], 10);
      }
      
      // Show progress indicators
      if (text.includes('[✓]')) {
        process.stdout.write('✓');
      } else if (text.includes('[✗]')) {
        process.stdout.write('✗');
      }
    });

    proc.stderr.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(''); // New line after progress dots
      
      if (code === 0) {
        console.log(`✅ Complete: ${completionPercent}% in ${duration}s`);
        resolve({ success: true, completion: completionPercent, duration });
      } else {
        console.log(`❌ Failed (exit code ${code}) after ${duration}s`);
        resolve({ success: false, error: `Exit code ${code}`, duration, output: output.slice(-1000) });
      }
    });

    proc.on('error', (err) => {
      console.log(`❌ Error: ${err.message}`);
      resolve({ success: false, error: err.message });
    });
  });
}

// =============================================================================
// MAIN BATCH PROCESSOR
// =============================================================================

async function processBatch(options = {}) {
  const { tiers = null, resume = false, dryRun = false, statusOnly = false } = options;
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Load progress
  const progress = loadProgress();
  
  if (statusOnly) {
    console.log('\n📊 BATCH PROCESSING STATUS');
    console.log('═'.repeat(60));
    console.log(`Last run: ${progress.lastRun || 'Never'}`);
    console.log(`Processed: ${progress.processed.length} vehicles`);
    console.log(`Failed: ${progress.failed.length} vehicles`);
    console.log(`Skipped (not in DB): ${progress.skipped.length} vehicles`);
    
    // Calculate remaining
    const allSlugs = TOP_100_VEHICLES.flatMap(v => v.slugs);
    const processedSet = new Set(progress.processed.map(p => p.slug));
    const remaining = allSlugs.filter(s => !processedSet.has(s));
    console.log(`Remaining: ${remaining.length} vehicles`);
    
    if (progress.failed.length > 0) {
      console.log('\n❌ Failed vehicles:');
      progress.failed.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
    }
    return;
  }

  // Build queue of vehicles to process
  let queue = [];
  
  for (const vehicle of TOP_100_VEHICLES) {
    // Filter by tier if specified
    if (tiers && !tiers.includes(vehicle.tier)) continue;
    
    for (const slug of vehicle.slugs) {
      // Skip if already processed (unless not resuming)
      if (resume && progress.processed.some(p => p.slug === slug)) {
        continue;
      }
      
      queue.push({
        rank: vehicle.rank,
        tier: vehicle.tier,
        name: vehicle.name,
        slug
      });
    }
  }

  // Sort by tier (priority) then by rank
  queue.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.rank - b.rank;
  });

  // Get car IDs from database
  const slugList = queue.map(q => q.slug);
  const { data: cars, error } = await supabase
    .from('cars')
    .select('id, slug, name')
    .in('slug', slugList);

  if (error) {
    console.error('Database error:', error);
    return;
  }

  const carMap = new Map(cars.map(c => [c.slug, { id: c.id, name: c.name }]));

  // Update queue with car IDs
  queue = queue.map(item => {
    const car = carMap.get(item.slug);
    return { ...item, carId: car?.id, dbName: car?.name };
  }).filter(item => {
    if (!item.carId) {
      if (!progress.skipped.includes(item.slug)) {
        progress.skipped.push(item.slug);
      }
      return false;
    }
    return true;
  });

  console.log('\n🏁 TOP 100 BATCH PROCESSOR');
  console.log('═'.repeat(60));
  console.log(`Tiers: ${tiers ? tiers.join(', ') : 'All'}`);
  console.log(`Resume mode: ${resume ? 'Yes' : 'No'}`);
  console.log(`Vehicles in queue: ${queue.length}`);
  console.log(`Already processed: ${progress.processed.length}`);
  console.log(`Not in database: ${progress.skipped.length}`);
  
  if (dryRun) {
    console.log('\n📋 DRY RUN - Would process:');
    queue.forEach((item, i) => {
      console.log(`   ${i + 1}. [Tier ${item.tier}] ${item.dbName} (${item.slug})`);
    });
    return;
  }

  if (queue.length === 0) {
    console.log('\n✅ All vehicles already processed!');
    return;
  }

  // Process queue
  console.log('\n🚀 Starting batch processing...\n');
  const startTime = Date.now();
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    console.log(`\n[${i + 1}/${queue.length}] Tier ${item.tier} | Rank #${item.rank}`);
    
    const result = await runPipeline(item.carId, item.dbName);
    
    if (result.success) {
      successCount++;
      progress.processed.push({
        slug: item.slug,
        name: item.dbName,
        completion: result.completion,
        processedAt: new Date().toISOString()
      });
    } else {
      failCount++;
      progress.failed.push({
        slug: item.slug,
        name: item.dbName,
        error: result.error,
        failedAt: new Date().toISOString()
      });
    }
    
    // Save progress after each vehicle
    saveProgress(progress);
    
    // Delay between vehicles (except last one)
    if (i < queue.length - 1) {
      console.log(`\n⏳ Waiting ${BATCH_DELAY_MS / 1000}s before next vehicle...`);
      await sleep(BATCH_DELAY_MS);
    }
  }

  // Final summary
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 BATCH COMPLETE');
  console.log('═'.repeat(60));
  console.log(`Total time: ${totalTime} minutes`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Total processed: ${progress.processed.length}`);
  
  const avgCompletion = progress.processed.length > 0
    ? (progress.processed.reduce((sum, p) => sum + (p.completion || 0), 0) / progress.processed.length).toFixed(1)
    : 0;
  console.log(`Average completion: ${avgCompletion}%`);
}

// =============================================================================
// CLI
// =============================================================================

const { values } = parseArgs({
  options: {
    tier: { type: 'string', short: 't' },
    resume: { type: 'boolean', short: 'r', default: false },
    'dry-run': { type: 'boolean', short: 'd', default: false },
    status: { type: 'boolean', short: 's', default: false },
    help: { type: 'boolean', short: 'h', default: false },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Top 100 US Modification Market - Batch Pipeline Processor

Usage:
  node batch-top100.mjs [options]

Options:
  -t, --tier <n>    Process specific tiers (e.g., "1" or "1,2,3")
  -r, --resume      Skip already-processed vehicles
  -d, --dry-run     Show what would be processed without running
  -s, --status      Show current processing status
  -h, --help        Show this help message

Examples:
  node batch-top100.mjs --status           # Check progress
  node batch-top100.mjs --tier 1 --dry-run # Preview Tier 1 vehicles
  node batch-top100.mjs --tier 1           # Process Tier 1 only
  node batch-top100.mjs --resume           # Continue from where you left off
  node batch-top100.mjs                    # Process everything
`);
  process.exit(0);
}

const tierFilter = values.tier ? values.tier.split(',').map(Number) : null;

processBatch({
  tiers: tierFilter,
  resume: values.resume,
  dryRun: values['dry-run'],
  statusOnly: values.status,
}).catch(console.error);
