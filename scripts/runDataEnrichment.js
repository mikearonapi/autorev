#!/usr/bin/env node

/**
 * Master Data Enrichment Script
 * 
 * Runs all enrichment scripts in sequence to fill database gaps.
 * 
 * Usage:
 *   node scripts/runDataEnrichment.js                    # Run all steps
 *   node scripts/runDataEnrichment.js --step=recalls     # Run specific step
 *   node scripts/runDataEnrichment.js --dry-run          # Preview only
 *   node scripts/runDataEnrichment.js --status           # Show current coverage
 */

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Parse arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value === undefined ? true : value;
  }
  return acc;
}, {});

const STEP = args.step || null;
const DRY_RUN = args['dry-run'] || false;
const STATUS_ONLY = args.status || false;

/**
 * Run a child script and capture output
 */
function runScript(scriptPath, scriptArgs = []) {
  return new Promise((resolve, reject) => {
    console.log(`\n📦 Running: node ${scriptPath} ${scriptArgs.join(' ')}\n`);
    
    const child = spawn('node', [scriptPath, ...scriptArgs], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

/**
 * Get current database coverage stats
 */
async function getCoverageStats() {
  const { count: totalCars } = await supabase
    .from('cars')
    .select('*', { count: 'exact', head: true });

  // Market Pricing
  const { data: pricingData } = await supabase
    .from('car_market_pricing')
    .select('car_slug');
  const pricingCars = new Set(pricingData?.map(r => r.car_slug) || []);

  // Recalls
  const { data: recallData } = await supabase
    .from('car_recalls')
    .select('car_slug');
  const recallCars = new Set(recallData?.map(r => r.car_slug) || []);

  // Known Issues
  const { data: issueData } = await supabase
    .from('car_issues')
    .select('car_slug');
  const issueCars = new Set(issueData?.map(r => r.car_slug) || []);

  // Maintenance Specs - check spark plugs specifically
  const { data: maintenanceData } = await supabase
    .from('vehicle_maintenance_specs')
    .select('car_slug, spark_plug_oem_part, trans_fluid_manual');
  
  const sparkPlugCars = maintenanceData?.filter(r => r.spark_plug_oem_part)?.length || 0;
  const transFluidCars = maintenanceData?.filter(r => r.trans_fluid_manual)?.length || 0;

  return {
    totalCars,
    marketPricing: { count: pricingCars.size, pct: Math.round(pricingCars.size / totalCars * 100) },
    recalls: { count: recallCars.size, pct: Math.round(recallCars.size / totalCars * 100) },
    knownIssues: { count: issueCars.size, pct: Math.round(issueCars.size / totalCars * 100) },
    sparkPlugs: { count: sparkPlugCars, pct: Math.round(sparkPlugCars / totalCars * 100) },
    transFluid: { count: transFluidCars, pct: Math.round(transFluidCars / totalCars * 100) },
  };
}

/**
 * Display coverage status
 */
async function showStatus() {
  console.log('='.repeat(70));
  console.log('📊 AutoRev Database Coverage Status');
  console.log('='.repeat(70));

  const stats = await getCoverageStats();

  console.log(`\nTotal Vehicles: ${stats.totalCars}\n`);

  const rows = [
    ['Market Pricing', stats.marketPricing, 90, '🔴'],
    ['Recalls', stats.recalls, 95, '⚠️'],
    ['Known Issues', stats.knownIssues, 95, '⚠️'],
    ['Spark Plugs', stats.sparkPlugs, 90, '🔴'],
    ['Trans Fluid', stats.transFluid, 95, '⚠️'],
  ];

  console.log('Data Category'.padEnd(20) + 'Current'.padEnd(15) + 'Target'.padEnd(10) + 'Status');
  console.log('-'.repeat(55));

  for (const [name, data, target, icon] of rows) {
    const status = data.pct >= target ? '✅' : icon;
    console.log(
      name.padEnd(20) + 
      `${data.count}/${stats.totalCars} (${data.pct}%)`.padEnd(15) + 
      `${target}%`.padEnd(10) + 
      status
    );
  }

  console.log('\n' + '='.repeat(70));
}

/**
 * Run enrichment steps
 */
async function runEnrichment() {
  console.log('='.repeat(70));
  console.log('🚀 AutoRev Data Enrichment Pipeline');
  console.log('='.repeat(70));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (preview only)' : 'LIVE'}`);
  
  const dryRunArg = DRY_RUN ? ['--dry-run'] : [];

  // Show initial status
  console.log('\n📊 Initial Coverage:');
  await showStatus();

  const steps = [
    {
      name: 'recalls',
      description: 'NHTSA Recalls',
      script: 'scripts/enrichRecallsAll.js',
      args: [...dryRunArg],
    },
    {
      name: 'issues',
      description: 'NHTSA Complaints → Known Issues',
      script: 'scripts/enrichIssuesFromComplaints.js',
      args: [...dryRunArg, '--threshold=3'],
    },
    {
      name: 'pricing',
      description: 'Cars.com Market Pricing',
      script: 'scripts/scrapeValidatedPricing.js',
      args: [...dryRunArg, '--limit=20'], // Start with 20 to test
    },
    {
      name: 'free-apis',
      description: 'EPA + NHTSA Safety',
      script: 'scripts/enrichFreeApisDirect.js',
      args: [],
    },
  ];

  // Filter to specific step if requested
  const stepsToRun = STEP 
    ? steps.filter(s => s.name === STEP)
    : steps;

  if (stepsToRun.length === 0) {
    console.error(`❌ Unknown step: ${STEP}`);
    console.log('Available steps:', steps.map(s => s.name).join(', '));
    process.exit(1);
  }

  for (const step of stepsToRun) {
    console.log('\n' + '='.repeat(70));
    console.log(`📋 Step: ${step.description}`);
    console.log('='.repeat(70));

    try {
      await runScript(step.script, step.args);
      console.log(`\n✅ ${step.description} completed`);
    } catch (err) {
      console.error(`\n❌ ${step.description} failed:`, err.message);
      // Continue to next step
    }
  }

  // Show final status
  console.log('\n' + '='.repeat(70));
  console.log('📊 Final Coverage:');
  await showStatus();
}

async function main() {
  if (STATUS_ONLY) {
    await showStatus();
  } else {
    await runEnrichment();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

