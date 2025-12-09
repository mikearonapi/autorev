#!/usr/bin/env node

/**
 * YouTube Enrichment Pipeline - Master Script
 * 
 * Runs the complete YouTube review enrichment pipeline in order:
 * 1. Discovery - Find videos for cars from whitelisted channels
 * 2. Transcripts - Fetch transcripts for discovered videos
 * 3. AI Processing - Extract summaries, quotes, sentiments
 * 4. Consensus Aggregation - Roll up per-car consensus metrics
 * 
 * Usage:
 *   node scripts/youtube-pipeline.js [options]
 * 
 * Options:
 *   --step <name>     Run only a specific step (discovery, transcripts, ai, consensus)
 *   --car-slug <slug> Process only a specific car
 *   --dry-run         Don't write to database
 *   --limit <n>       Limit items per step
 *   --verbose         Enable verbose logging
 * 
 * Environment Variables:
 *   YOUTUBE_API_KEY       Required for discovery
 *   ANTHROPIC_API_KEY     Required for AI processing
 *   SUPABASE_URL          Required
 *   SUPABASE_SERVICE_KEY  Required
 * 
 * @module scripts/youtube-pipeline
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  step: null,
  carSlug: null,
  dryRun: false,
  limit: null,
  verbose: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--step':
      options.step = args[++i];
      break;
    case '--car-slug':
      options.carSlug = args[++i];
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--limit':
      options.limit = args[++i];
      break;
    case '--verbose':
      options.verbose = true;
      break;
  }
}

// Logging helpers
const log = (...args) => console.log('[pipeline]', ...args);
const logError = (...args) => console.error('[pipeline:error]', ...args);

// Pipeline steps
const STEPS = [
  {
    name: 'discovery',
    script: 'youtube-discovery.js',
    description: 'Discover videos from whitelisted channels',
    requiredEnv: ['GOOGLE_AI_API_KEY']
  },
  {
    name: 'transcripts',
    script: 'youtube-transcripts.js',
    description: 'Fetch transcripts for discovered videos',
    requiredEnv: []
  },
  {
    name: 'ai',
    script: 'youtube-ai-processing.js',
    description: 'AI summarization and extraction',
    requiredEnv: ['ANTHROPIC_API_KEY']
  },
  {
    name: 'consensus',
    script: 'youtube-aggregate-consensus.js',
    description: 'Aggregate per-car consensus metrics',
    requiredEnv: []
  }
];

/**
 * Run a single pipeline step
 * @param {Object} step - Step configuration
 * @returns {Promise<boolean>} Success status
 */
async function runStep(step) {
  log(`\n========================================`);
  log(`Step: ${step.name.toUpperCase()}`);
  log(`${step.description}`);
  log(`========================================\n`);

  // Check required environment variables
  for (const envVar of step.requiredEnv) {
    if (!process.env[envVar]) {
      logError(`Missing required environment variable: ${envVar}`);
      logError(`Skipping step: ${step.name}`);
      return false;
    }
  }

  // Build arguments
  const stepArgs = [];
  if (options.carSlug) stepArgs.push('--car-slug', options.carSlug);
  if (options.dryRun) stepArgs.push('--dry-run');
  if (options.limit) stepArgs.push('--limit', options.limit);
  if (options.verbose) stepArgs.push('--verbose');

  const scriptPath = path.join(__dirname, step.script);

  return new Promise((resolve) => {
    const child = spawn('node', [scriptPath, ...stepArgs], {
      stdio: 'inherit',
      env: process.env
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(`✓ Step ${step.name} completed successfully\n`);
        resolve(true);
      } else {
        logError(`✗ Step ${step.name} failed with code ${code}\n`);
        resolve(false);
      }
    });

    child.on('error', (error) => {
      logError(`✗ Step ${step.name} error:`, error.message);
      resolve(false);
    });
  });
}

async function main() {
  log('YouTube Enrichment Pipeline');
  log('========================================');
  log('Options:', options);
  log('');

  const startTime = Date.now();
  const results = {};

  // Determine which steps to run
  let stepsToRun = STEPS;
  if (options.step) {
    const step = STEPS.find(s => s.name === options.step);
    if (!step) {
      logError(`Unknown step: ${options.step}`);
      logError(`Available steps: ${STEPS.map(s => s.name).join(', ')}`);
      process.exit(1);
    }
    stepsToRun = [step];
  }

  log(`Running ${stepsToRun.length} step(s): ${stepsToRun.map(s => s.name).join(' → ')}`);

  // Run steps in sequence
  for (const step of stepsToRun) {
    const success = await runStep(step);
    results[step.name] = success;

    // If a step fails, continue but log warning
    if (!success) {
      log(`⚠ Warning: Step ${step.name} failed, continuing with next step...`);
    }

    // Brief pause between steps
    await new Promise(r => setTimeout(r, 1000));
  }

  // Print summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  log('\n========================================');
  log('Pipeline Complete');
  log('========================================');
  log(`Total time: ${elapsed}s`);
  log('');
  log('Results:');
  for (const [step, success] of Object.entries(results)) {
    log(`  ${success ? '✓' : '✗'} ${step}`);
  }

  const allSuccess = Object.values(results).every(v => v);
  if (!allSuccess) {
    log('\n⚠ Some steps failed. Check logs above for details.');
  }

  if (options.dryRun) {
    log('\n[DRY RUN] No changes were made to the database');
  }

  process.exit(allSuccess ? 0 : 1);
}

main().catch(error => {
  logError('Fatal error:', error);
  process.exit(1);
});

