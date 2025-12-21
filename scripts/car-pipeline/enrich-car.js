#!/usr/bin/env node

/**
 * Car Enrichment Script
 * 
 * Runs automated enrichment for a single car.
 * 
 * Usage:
 *   node scripts/car-pipeline/enrich-car.js <car-slug> [options]
 * 
 * Options:
 *   --phase=3       Run only Phase 3 enrichment
 *   --epa-only      Run only EPA fuel economy enrichment
 *   --safety-only   Run only NHTSA safety enrichment
 *   --recalls-only  Run only NHTSA recalls enrichment
 *   --dry-run       Show what would be done without executing
 *   --verbose       Show detailed output
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
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
const carSlug = args.find(arg => !arg.startsWith('--'));
const flags = {
  phase: args.find(arg => arg.startsWith('--phase='))?.split('=')[1],
  epaOnly: args.includes('--epa-only'),
  safetyOnly: args.includes('--safety-only'),
  recallsOnly: args.includes('--recalls-only'),
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
};

if (!carSlug) {
  console.error('Usage: node enrich-car.js <car-slug> [options]');
  console.error('\nOptions:');
  console.error('  --phase=3       Run only Phase 3 enrichment');
  console.error('  --epa-only      Run only EPA fuel economy enrichment');
  console.error('  --safety-only   Run only NHTSA safety enrichment');
  console.error('  --recalls-only  Run only NHTSA recalls enrichment');
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
    verbose: '  ',
  };
  console.log(`${prefix[level] || ''} ${msg}`);
}

function verboseLog(msg) {
  if (flags.verbose) {
    log(msg, 'verbose');
  }
}

/**
 * Verify car exists in database
 */
async function verifyCar(slug) {
  const { data, error } = await supabase
    .from('cars')
    .select('id, slug, name, years, brand')
    .eq('slug', slug)
    .single();
  
  if (error || !data) {
    throw new Error(`Car not found: ${slug}`);
  }
  
  return data;
}

/**
 * Run EPA fuel economy enrichment
 */
async function enrichEPA(slug) {
  log(`Running EPA fuel economy enrichment for ${slug}...`);
  
  if (flags.dryRun) {
    log('DRY RUN: Would call /api/cars/{slug}/fuel-economy', 'verbose');
    return { success: true, dryRun: true };
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/cars/${slug}/fuel-economy`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'EPA enrichment failed');
    }
    
    if (data.fuelEconomy?.epa) {
      log(`EPA data retrieved: ${data.fuelEconomy.epa.combinedMpg} MPG combined`, 'success');
      verboseLog(`  City: ${data.fuelEconomy.epa.cityMpg} MPG`);
      verboseLog(`  Highway: ${data.fuelEconomy.epa.highwayMpg} MPG`);
      verboseLog(`  Fuel Type: ${data.fuelEconomy.epa.fuelType}`);
    } else {
      log('No EPA data available for this vehicle', 'warning');
    }
    
    return { success: true, data: data.fuelEconomy };
  } catch (err) {
    log(`EPA enrichment failed: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

/**
 * Run NHTSA safety enrichment
 */
async function enrichSafety(slug) {
  log(`Running NHTSA safety enrichment for ${slug}...`);
  
  if (flags.dryRun) {
    log('DRY RUN: Would call /api/cars/{slug}/safety', 'verbose');
    return { success: true, dryRun: true };
  }
  
  try {
    const response = await fetch(`${BASE_URL}/api/cars/${slug}/safety`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Safety enrichment failed');
    }
    
    if (data.safety) {
      log(`Safety data retrieved: ${data.safety.nhtsa_overall_rating || 'N/A'}/5 stars`, 'success');
      verboseLog(`  Front Crash: ${data.safety.nhtsa_front_crash_rating || 'N/A'}/5`);
      verboseLog(`  Side Crash: ${data.safety.nhtsa_side_crash_rating || 'N/A'}/5`);
      verboseLog(`  Rollover: ${data.safety.nhtsa_rollover_rating || 'N/A'}/5`);
    } else {
      log('No safety data available for this vehicle', 'warning');
    }
    
    return { success: true, data: data.safety };
  } catch (err) {
    log(`Safety enrichment failed: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

/**
 * Run NHTSA recalls enrichment
 */
async function enrichRecalls(slug, car) {
  log(`Running NHTSA recalls enrichment for ${slug}...`);
  
  if (flags.dryRun) {
    log('DRY RUN: Would call recall service directly', 'verbose');
    return { success: true, dryRun: true };
  }
  
  try {
    // For recalls, we query directly since there's no dedicated single-car endpoint
    const { data: existingRecalls } = await supabase
      .from('car_recalls')
      .select('id')
      .eq('car_slug', slug);
    
    const recallCount = existingRecalls?.length || 0;
    
    if (recallCount > 0) {
      log(`Found ${recallCount} existing recalls for ${slug}`, 'success');
    } else {
      log(`No recalls found for ${slug} (this may be correct if none exist)`, 'warning');
    }
    
    return { success: true, count: recallCount };
  } catch (err) {
    log(`Recalls check failed: ${err.message}`, 'error');
    return { success: false, error: err.message };
  }
}

/**
 * Update pipeline run status
 */
async function updatePipelineRun(slug, updates) {
  if (flags.dryRun) {
    verboseLog('DRY RUN: Would update pipeline run');
    return;
  }
  
  try {
    const { error } = await supabase
      .from('car_pipeline_runs')
      .update(updates)
      .eq('car_slug', slug);
    
    if (error) {
      verboseLog(`Pipeline run update failed: ${error.message}`);
    } else {
      verboseLog('Pipeline run updated');
    }
  } catch (err) {
    verboseLog(`Pipeline run update error: ${err.message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('');
  console.log('🚗 Car Enrichment Script');
  console.log('========================');
  console.log(`Car: ${carSlug}`);
  if (flags.dryRun) console.log('Mode: DRY RUN');
  console.log('');
  
  // Verify car exists
  let car;
  try {
    car = await verifyCar(carSlug);
    log(`Found car: ${car.name} (${car.years})`, 'success');
  } catch (err) {
    log(err.message, 'error');
    process.exit(1);
  }
  
  const results = {
    epa: null,
    safety: null,
    recalls: null,
  };
  
  // Determine which enrichments to run
  const runEPA = flags.epaOnly || (!flags.safetyOnly && !flags.recallsOnly);
  const runSafety = flags.safetyOnly || (!flags.epaOnly && !flags.recallsOnly);
  const runRecalls = flags.recallsOnly || (!flags.epaOnly && !flags.safetyOnly);
  
  console.log('');
  
  // Run enrichments
  if (runEPA) {
    results.epa = await enrichEPA(carSlug);
    console.log('');
  }
  
  if (runSafety) {
    results.safety = await enrichSafety(carSlug);
    console.log('');
  }
  
  if (runRecalls) {
    results.recalls = await enrichRecalls(carSlug, car);
    console.log('');
  }
  
  // Update pipeline run if exists
  const pipelineUpdates = {};
  if (results.epa?.success) pipelineUpdates.phase3_fuel_economy = true;
  if (results.safety?.success) pipelineUpdates.phase3_safety_ratings = true;
  if (results.recalls?.success) pipelineUpdates.phase3_recalls = true;
  
  if (Object.keys(pipelineUpdates).length > 0) {
    await updatePipelineRun(carSlug, pipelineUpdates);
  }
  
  // Summary
  console.log('📊 Summary');
  console.log('----------');
  if (runEPA) console.log(`EPA:     ${results.epa?.success ? '✅ Success' : '❌ Failed'}`);
  if (runSafety) console.log(`Safety:  ${results.safety?.success ? '✅ Success' : '❌ Failed'}`);
  if (runRecalls) console.log(`Recalls: ${results.recalls?.success ? '✅ Success' : '❌ Failed'}`);
  
  // Exit with error if any failed
  const allSuccess = Object.values(results).every(r => !r || r.success);
  if (!allSuccess) {
    process.exit(1);
  }
  
  console.log('\n✅ Enrichment complete');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

