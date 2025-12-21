#!/usr/bin/env node

/**
 * Batch Car Enrichment Script
 * 
 * Processes multiple cars from a file (one slug per line).
 * 
 * Usage:
 *   node scripts/car-pipeline/batch-enrich.js <slugs-file.txt> [options]
 * 
 * Options:
 *   --phase=3       Run only Phase 3 enrichment
 *   --concurrency=N Max parallel requests (default: 3)
 *   --delay=N       Delay between batches in ms (default: 2000)
 *   --dry-run       Show what would be done without executing
 *   --verbose       Show detailed output
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
// Note: fetch is global in Node.js 18+

// Load environment variables
config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const slugsFile = args.find(arg => !arg.startsWith('--'));
const flags = {
  phase: args.find(arg => arg.startsWith('--phase='))?.split('=')[1],
  concurrency: parseInt(args.find(arg => arg.startsWith('--concurrency='))?.split('=')[1] || '3'),
  delay: parseInt(args.find(arg => arg.startsWith('--delay='))?.split('=')[1] || '2000'),
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
};

if (!slugsFile) {
  console.error('Usage: node batch-enrich.js <slugs-file.txt> [options]');
  console.error('\nOptions:');
  console.error('  --phase=3       Run only Phase 3 enrichment');
  console.error('  --concurrency=N Max parallel requests (default: 3)');
  console.error('  --delay=N       Delay between batches in ms (default: 2000)');
  console.error('  --dry-run       Show what would be done without executing');
  console.error('  --verbose       Show detailed output');
  process.exit(1);
}

// Determine base URL for API calls
const BASE_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function log(msg, level = 'info') {
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    progress: '🔄',
  };
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${prefix[level] || ''} ${msg}`);
}

/**
 * Read slugs from file
 */
function readSlugsFile(filepath) {
  if (!existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
  
  const content = readFileSync(filepath, 'utf-8');
  const slugs = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
  
  return slugs;
}

/**
 * Verify car exists
 */
async function verifyCar(slug) {
  const { data, error } = await supabase
    .from('cars')
    .select('id, slug, name')
    .eq('slug', slug)
    .single();
  
  return { exists: !error && !!data, data };
}

/**
 * Enrich single car
 */
async function enrichCar(slug) {
  const results = { slug, epa: null, safety: null, recalls: null };
  
  if (flags.dryRun) {
    return { ...results, dryRun: true, success: true };
  }
  
  // EPA
  try {
    const response = await fetch(`${BASE_URL}/api/cars/${slug}/fuel-economy`);
    results.epa = response.ok ? 'success' : 'failed';
  } catch (err) {
    results.epa = 'error';
  }
  
  // Safety
  try {
    const response = await fetch(`${BASE_URL}/api/cars/${slug}/safety`);
    results.safety = response.ok ? 'success' : 'failed';
  } catch (err) {
    results.safety = 'error';
  }
  
  // Recalls - check existing
  try {
    const { data } = await supabase
      .from('car_recalls')
      .select('id')
      .eq('car_slug', slug);
    results.recalls = `${data?.length || 0} found`;
  } catch (err) {
    results.recalls = 'error';
  }
  
  // Update pipeline run
  try {
    await supabase
      .from('car_pipeline_runs')
      .update({
        phase3_fuel_economy: results.epa === 'success',
        phase3_safety_ratings: results.safety === 'success',
        phase3_recalls: true,
      })
      .eq('car_slug', slug);
  } catch (err) {
    // Ignore - pipeline run may not exist
  }
  
  return {
    ...results,
    success: results.epa === 'success' && results.safety === 'success',
  };
}

/**
 * Process batch with concurrency control
 */
async function processBatch(slugs) {
  const results = [];
  const chunks = [];
  
  // Split into chunks based on concurrency
  for (let i = 0; i < slugs.length; i += flags.concurrency) {
    chunks.push(slugs.slice(i, i + flags.concurrency));
  }
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    log(`Processing batch ${i + 1}/${chunks.length} (${chunk.length} cars)...`, 'progress');
    
    const chunkResults = await Promise.all(
      chunk.map(async (slug) => {
        const exists = await verifyCar(slug);
        if (!exists.exists) {
          return { slug, success: false, error: 'Car not found' };
        }
        return enrichCar(slug);
      })
    );
    
    results.push(...chunkResults);
    
    // Progress update
    chunkResults.forEach(r => {
      if (r.success) {
        log(`  ${r.slug}: ✅ Done`, 'success');
      } else if (r.error) {
        log(`  ${r.slug}: ❌ ${r.error}`, 'error');
      } else {
        log(`  ${r.slug}: ⚠️ Partial (EPA: ${r.epa}, Safety: ${r.safety})`, 'warning');
      }
    });
    
    // Delay between batches
    if (i < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, flags.delay));
    }
  }
  
  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log('');
  console.log('🚗 Batch Car Enrichment Script');
  console.log('==============================');
  console.log(`File: ${slugsFile}`);
  console.log(`Concurrency: ${flags.concurrency}`);
  console.log(`Delay: ${flags.delay}ms`);
  if (flags.dryRun) console.log('Mode: DRY RUN');
  console.log('');
  
  // Read slugs
  let slugs;
  try {
    slugs = readSlugsFile(slugsFile);
    log(`Found ${slugs.length} car(s) in file`, 'info');
  } catch (err) {
    log(err.message, 'error');
    process.exit(1);
  }
  
  if (slugs.length === 0) {
    log('No slugs to process', 'warning');
    process.exit(0);
  }
  
  if (flags.verbose) {
    console.log('\nCars to process:');
    slugs.forEach(s => console.log(`  - ${s}`));
    console.log('');
  }
  
  // Process
  const startTime = Date.now();
  const results = await processBatch(slugs);
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  // Summary
  console.log('');
  console.log('📊 Summary');
  console.log('----------');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`Total:      ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed:     ${failed}`);
  console.log(`Duration:   ${duration}s`);
  
  if (failed > 0) {
    console.log('\nFailed cars:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`  - ${r.slug}: ${r.error || 'Partial failure'}`));
  }
  
  // Exit code
  if (failed > 0) {
    process.exit(1);
  }
  
  console.log('\n✅ Batch enrichment complete');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

