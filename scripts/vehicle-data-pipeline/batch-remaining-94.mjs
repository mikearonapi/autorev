#!/usr/bin/env node
/**
 * Batch processor for the 94 vehicles NOT in Top 100 list
 */

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const REMAINING_SLUGS = [
  'acura-nsx-nc1', 'acura-tl-type-s-ua6', 'acura-tsx-cl9', 'acura-tsx-cu2',
  'alfa-romeo-4c', 'alfa-romeo-giulia-quadrifoglio',
  'aston-martin-db11-db11', 'aston-martin-db9-first-generation', 'aston-martin-dbs-superleggera-2018',
  'aston-martin-v12-vantage-1st-gen', 'aston-martin-v8-vantage', 'aston-martin-vantage-2018-2024',
  'audi-rs5-b8', 'audi-rs5-b9', 'audi-rs6-avant-c8', 'audi-rs7-c8', 'audi-s5-b8', 'audi-s5-b9',
  'bmw-i4-m50-g26', 'bmw-m5-e39', 'bmw-m5-e60', 'bmw-m5-f10-competition', 'bmw-m5-f90-competition', 'bmw-z4m-e85-e86',
  'buick-grand-national-g-body',
  'cadillac-ats-v-first-generation', 'cadillac-ct4-v-blackwing', 'cadillac-ct5-v-blackwing',
  'cadillac-cts-v-gen1', 'cadillac-cts-v-gen2', 'cadillac-cts-v-gen3',
  'chevrolet-ss-vf',
  'dodge-viper',
  'ferrari-296-gtb-2022-2024', 'ferrari-458-italia', 'ferrari-458-speciale',
  'ferrari-488-gtb-2015-2019', 'ferrari-488-pista', 'ferrari-812-superfast',
  'ferrari-f430-430', 'ferrari-f8-tributo', 'ferrari-roma-2020', 'ferrari-sf90-stradale-2019-2024',
  'ford-crown-victoria-p71', 'ford-f-150-raptor-2021-2024', 'ford-f150-lightning-1st-gen',
  'ford-f150-raptor-r-third-generation', 'ford-f150-raptor-second-generation',
  'ford-fusion-sport-cd538', 'ford-mustang-mach-1-sn95', 'ford-maverick-2022-2024',
  'genesis-g70-33t-ik',
  'gmc-hummer-ev-t1xx',
  'honda-accord-sport-2-0t-tenth-generation', 'honda-crx-si-ef', 'honda-del-sol-vtec-eg', 'honda-prelude-si-vtec-bb4',
  'hyundai-elantra-n-cn7', 'hyundai-kona-n-2022',
  'infiniti-q50-red-sport-400', 'infiniti-q60-red-sport-400',
  'jaguar-f-type-r', 'jaguar-f-type-v6-s', 'jaguar-xe-s-x760',
  'jeep-wrangler-rubicon-392-jl',
  'kia-k5-gt-2021',
  'lamborghini-aventador-lp700-4', 'lamborghini-aventador-svj', 'lamborghini-gallardo',
  'lamborghini-huracan-lp610-4', 'lamborghini-huracan-performante', 'lamborghini-huracan-sto',
  'lamborghini-huracan-tecnica', 'lamborghini-revuelto-lp780-4',
  'lexus-gs-f-url2', 'lexus-gs350-l10', 'lexus-gx-550-j460', 'lexus-is-f-use20',
  'lexus-is300-xe10', 'lexus-is350-f-sport-xe30', 'lexus-is350-xe20', 'lexus-lc-500', 'lexus-rc-f',
  'lotus-elise-s2', 'lotus-emira', 'lotus-evora-gt', 'lotus-evora-s', 'lotus-exige-s',
  'maserati-granturismo', 'maserati-mc20-2021',
  'mazda-3-25-turbo-2021', 'mazda-6-2.5-turbo-gj', 'mazda-mazdaspeed6-gy', 'mazda-rx-8-se3p',
  'mclaren-570s-2015', 'mclaren-600lt-2018-2020', 'mclaren-650s-mp4-12c-successor',
  'mclaren-720s', 'mclaren-765lt-2020-2022', 'mclaren-artura-1st-gen', 'mclaren-mp4-12c-first-generation',
  'mercedes-amg-cla-45-c117', 'mercedes-amg-cla-45-s-c118', 'mercedes-amg-e63-w212', 'mercedes-amg-e63s-w213',
  'mercedes-amg-gt', 'mercedes-amg-gt-black-series-c190', 'mercedes-amg-gt-r-c190', 'mercedes-amg-sls-c197',
  'mercedes-c63-amg-w204',
  'mitsubishi-3000gt-vr4-z16a', 'mitsubishi-eclipse-gsx-2g', 'mitsubishi-lancer-ralliart-cz4a',
  'nissan-300zx-twin-turbo-z32', 'nissan-frontier-d23', 'nissan-maxima-a36',
  'nissan-skyline-gt-r-r32', 'nissan-skyline-gt-r-r33', 'nissan-skyline-gt-r-r34', 'nissan-z-rz34',
  'pontiac-g8-gt', 'pontiac-g8-gxp-2009',
  'porsche-918-spyder-918', 'porsche-carrera-gt-980', 'porsche-panamera-turbo-971',
  'rivian-r1t-gen1',
  'subaru-crosstrek-xv', 'subaru-forester-xt-sg', 'subaru-legacy-gt-spec-b-bl',
  'toyota-celica-gt-four-st205', 'toyota-land-cruiser-200-series', 'toyota-lfa-lfa01',
  'toyota-mr2-spyder-zzw30', 'toyota-mr2-turbo-sw20', 'toyota-sequoia-trd-pro-xk80',
  'volkswagen-corrado-vr6-53i', 'volkswagen-golf-tsi-mk7', 'volkswagen-jetta-gli-mk6', 'volkswagen-jetta-gli-mk7'
];

async function runPipeline(carId, carName) {
  return new Promise((resolve) => {
    const proc = spawn('node', [
      'scripts/vehicle-data-pipeline/run.mjs',
      '-i', carId
    ], { 
      cwd: '/Volumes/10TB External HD/01. Apps - WORKING/AutoRev',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    proc.stdout.on('data', d => { 
      output += d;
      process.stdout.write('✓');
    });
    proc.stderr.on('data', d => output += d);
    
    proc.on('close', (code) => {
      const match = output.match(/OVERALL: (\d+)% complete/);
      const pct = match ? parseInt(match[1]) : 0;
      resolve({ success: code === 0, completion: pct });
    });
  });
}

async function main() {
  console.log('\n🚗 REMAINING VEHICLES BATCH PROCESSOR');
  console.log('════════════════════════════════════════════════════════════');
  
  // Look up car IDs from database
  const { data: cars, error } = await supabase
    .from('cars')
    .select('id, name, slug')
    .in('slug', REMAINING_SLUGS);
  
  if (error) {
    console.error('Failed to fetch cars:', error);
    process.exit(1);
  }
  
  console.log(`Found ${cars.length} vehicles to process\n`);
  
  const startTime = Date.now();
  let successful = 0;
  let failed = 0;
  let totalCompletion = 0;
  
  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    console.log(`\n[${i + 1}/${cars.length}]`);
    console.log('─'.repeat(60));
    console.log(`🚗 Processing: ${car.name}`);
    console.log(`   Car ID: ${car.id}`);
    console.log('─'.repeat(60));
    
    const result = await runPipeline(car.id, car.name);
    console.log('');
    
    if (result.success) {
      successful++;
      totalCompletion += result.completion;
      console.log(`✅ Complete: ${result.completion}%`);
    } else {
      failed++;
      console.log(`❌ Failed`);
    }
    
    // Brief pause between vehicles
    if (i < cars.length - 1) {
      console.log('\n⏳ Waiting 5s before next vehicle...');
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const avgCompletion = successful > 0 ? (totalCompletion / successful).toFixed(1) : 0;
  
  console.log('\n\n════════════════════════════════════════════════════════════');
  console.log('📊 BATCH COMPLETE');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`Total time: ${totalTime} minutes`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Average completion: ${avgCompletion}%`);
}

main().catch(console.error);
