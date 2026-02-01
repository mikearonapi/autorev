#!/usr/bin/env node

/**
 * AI Batch Car Addition Script
 *
 * Add multiple cars using the full AI automation pipeline.
 * Each car goes through all 8 phases including image generation.
 *
 * Usage:
 *   node scripts/car-pipeline/ai-batch-add-cars.js <cars-file.txt> [options]
 *
 * Options:
 *   --dry-run       Show what would be done without executing
 *   --concurrency=N Max parallel AI processes (default: 1, recommended for image gen)
 *   --delay=N       Delay between cars in ms (default: 10000)
 *   --verbose       Show detailed output
 *   --skip-images   Skip image generation (faster, images can be generated later)
 *
 * Example file format (one car per line):
 *   Porsche 911 GT3 (992)
 *   BMW M3 Competition (G80)
 *   # Comments start with #
 */

import { exec } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Parse command line arguments
const args = process.argv.slice(2);
const carsFile = args.find((arg) => !arg.startsWith('--'));
const flags = {
  // Default to 1 concurrency because image generation is rate-limited
  concurrency: parseInt(args.find((arg) => arg.startsWith('--concurrency='))?.split('=')[1] || '1'),
  // 10s delay between cars to avoid API rate limits
  delay: parseInt(args.find((arg) => arg.startsWith('--delay='))?.split('=')[1] || '10000'),
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
  skipImages: args.includes('--skip-images'),
};

if (!carsFile) {
  console.error('Usage: node ai-batch-add-cars.js <cars-file.txt> [options]');
  console.error('\nFile format (one car per line):');
  console.error('  Porsche 911 GT3 (992)');
  console.error('  BMW M3 Competition (G80)');
  console.error('  # Lines starting with # are ignored');
  console.error('\nOptions:');
  console.error('  --concurrency=N Max parallel processes (default: 1, image gen is slow)');
  console.error('  --delay=N       Delay between cars in ms (default: 10000)');
  console.error('  --dry-run       Show what would be done without executing');
  console.error('  --verbose       Show detailed output');
  console.error('  --skip-images   Skip image generation (can run later)');
  process.exit(1);
}

function log(msg, level = 'info') {
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    progress: '🔄',
    batch: '📦',
  };
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${prefix[level] || ''} ${msg}`);
}

/**
 * Read car names from file
 */
function readCarsFile(filepath) {
  if (!existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }

  const content = readFileSync(filepath, 'utf-8');
  const cars = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  return cars;
}

/**
 * Process single car with AI
 */
async function processCarWithAI(carName) {
  const scriptFlags = [
    flags.dryRun ? '--dry-run' : '',
    flags.verbose ? '--verbose' : '',
    flags.skipImages ? '--skip-images' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const command = `node scripts/car-pipeline/ai-research-car-verified.js "${carName}" ${scriptFlags}`;

  if (flags.verbose) {
    log(`Running: ${command}`, 'progress');
  }

  const startTime = Date.now();

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 900000, // 15 minute timeout per car (images take time)
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (flags.verbose) {
      log(`AI research output for ${carName}:`, 'info');
      console.log(stdout);
    }

    if (stderr && !flags.dryRun) {
      log(`Warnings for ${carName}: ${stderr}`, 'warning');
    }

    return {
      carName,
      success: true,
      duration,
      output: stdout,
    };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    return {
      carName,
      success: false,
      duration,
      error: error.message,
      output: error.stdout || '',
    };
  }
}

/**
 * Process batch with concurrency control
 */
async function processBatch(carNames) {
  const results = [];
  const chunks = [];

  // Split into chunks based on concurrency
  for (let i = 0; i < carNames.length; i += flags.concurrency) {
    chunks.push(carNames.slice(i, i + flags.concurrency));
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    log(`Processing batch ${i + 1}/${chunks.length} (${chunk.length} cars)...`, 'batch');

    const chunkResults = await Promise.all(chunk.map((carName) => processCarWithAI(carName)));

    results.push(...chunkResults);

    // Progress update
    chunkResults.forEach((result) => {
      if (result.success) {
        log(`${result.carName}: ✅ Complete (${result.duration}s)`, 'success');
      } else {
        log(`${result.carName}: ❌ Failed (${result.duration}s) - ${result.error}`, 'error');
      }
    });

    // Delay between batches (except last batch)
    if (i < chunks.length - 1) {
      log(`Waiting ${flags.delay}ms before next batch...`, 'info');
      await new Promise((resolve) => setTimeout(resolve, flags.delay));
    }
  }

  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log('');
  console.log('🚗 AutoRev AI Batch Car Addition');
  console.log('================================');
  console.log(`File: ${carsFile}`);
  console.log(`Concurrency: ${flags.concurrency}`);
  console.log(`Delay: ${flags.delay}ms between cars`);
  if (flags.dryRun) console.log('Mode: DRY RUN (no changes)');
  if (flags.skipImages) console.log('Images: SKIPPED');
  console.log('');

  // Read car names
  let carNames;
  try {
    carNames = readCarsFile(carsFile);
    log(`Found ${carNames.length} car(s) to process`, 'info');
  } catch (err) {
    log(err.message, 'error');
    process.exit(1);
  }

  if (carNames.length === 0) {
    log('No cars to process', 'warning');
    process.exit(0);
  }

  if (flags.verbose) {
    console.log('\nCars to process:');
    carNames.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));
    console.log('');
  }

  // Process all cars
  const startTime = Date.now();
  const results = await processBatch(carNames);
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Summary
  console.log('');
  console.log('📊 Batch Processing Summary');
  console.log('==========================');

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`Total Cars:   ${results.length}`);
  console.log(`Successful:   ${successful.length} ✅`);
  console.log(`Failed:       ${failed.length} ❌`);
  console.log(`Total Time:   ${totalDuration}s`);

  if (successful.length > 0) {
    const avgDuration = (
      successful.reduce((sum, r) => sum + parseFloat(r.duration), 0) / successful.length
    ).toFixed(1);
    console.log(`Avg Per Car:  ${avgDuration}s`);
  }

  if (successful.length > 0) {
    console.log('\n✅ Successfully Added:');
    successful.forEach((r) => console.log(`  - ${r.carName}`));
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed:');
    failed.forEach((r) => console.log(`  - ${r.carName}: ${r.error}`));
  }

  console.log('');

  if (successful.length > 0) {
    console.log('🎉 Cars are now available in AutoRev!');
    console.log('📋 Check the pipeline dashboard: /internal/car-pipeline');
  }

  // Exit code
  if (failed.length > 0) {
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
