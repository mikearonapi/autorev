#!/usr/bin/env node
/**
 * Unified Data Pipeline Runner
 * 
 * Single entry point for running any data pipeline in the AutoRev system.
 * 
 * Usage:
 *   node scripts/data-pipelines/run-pipeline.mjs <pipeline> [options]
 * 
 * Pipelines (aligned to AutoRev's 6 core problems):
 *   parts           - Parts & fitments (#2 "Which parts?")
 *   dyno            - Dyno data (#3 "What will it do?")
 *   laptimes        - Lap time data (#3 & #4 Performance)
 *   tuning          - Tuning profiles (#1 "What upgrades?")
 *   community       - Community insights (#5 & #6)
 *   youtube         - Expert reviews (#6 AL knowledge)
 *   knowledge       - Knowledge base (#6 AL)
 * 
 * Options:
 *   --limit=N       Limit items to process
 *   --car=SLUG      Process single car
 *   --dry-run       Preview without saving
 *   --verbose       Enable verbose logging
 *   --help          Show this help
 * 
 * Examples:
 *   node scripts/data-pipelines/run-pipeline.mjs parts --limit=100
 *   node scripts/data-pipelines/run-pipeline.mjs market --car=bmw-m3-e46
 *   node scripts/data-pipelines/run-pipeline.mjs youtube --dry-run
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// Parse arguments
const args = process.argv.slice(2);
const pipelineName = args[0];
const options = args.slice(1);

// Pipeline definitions - aligned to AutoRev's 6 core problems
// #1 What upgrades? #2 Which parts? #3 What will it do? #4 Now what? #5 Community #6 Quick questions
const PIPELINES = {
  // CRITICAL: Problem #2 "Which parts should I buy?"
  parts: {
    script: 'scripts/data-pipelines/parts/run-shopify-ingest.mjs',
    description: 'Ingest parts & fitments from vendor feeds (#2 Parts)',
    problem: '#2',
  },
  // CRITICAL: Problem #3 "What will this actually do?"
  dyno: {
    script: 'scripts/seedDynoRunsEstimated.mjs',
    description: 'Seed dyno data from tuning profiles (#3 Visualization)',
    problem: '#3',
  },
  // CRITICAL: Problems #3 & #4 (Visualization + Progression)
  laptimes: {
    script: 'scripts/scrape-lap-times.mjs',
    description: 'Scrape lap time data (#3 & #4 Performance)',
    problem: '#3 & #4',
  },
  // CRITICAL: Problem #1 "What should I do to my car?"
  tuning: {
    script: 'scripts/tuning-pipeline/run-pipeline.mjs',
    description: 'Generate tuning profiles (#1 Upgrades)',
    requires: ['ANTHROPIC_API_KEY'],
    problem: '#1',
  },
  // IMPORTANT: Problems #5 & #6 (Community + AL)
  community: {
    script: 'scripts/apify/backfill-reddit-insights.mjs',
    description: 'Fetch community insights from Reddit (#5 & #6)',
    requires: ['APIFY_API_TOKEN'],
    problem: '#5 & #6',
  },
  // IMPORTANT: Problem #6 "Quick questions" (AL knowledge)
  youtube: {
    script: 'scripts/youtube-pipeline.js',
    description: 'YouTube expert reviews for AL (#6 Knowledge)',
    requires: ['YOUTUBE_API_KEY', 'ANTHROPIC_API_KEY'],
    problem: '#6',
  },
  // IMPORTANT: Problem #6 (AL knowledge base)
  knowledge: {
    script: 'scripts/indexKnowledgeBase.mjs',
    description: 'Index knowledge base for AL (#6 Knowledge)',
    requires: ['OPENAI_API_KEY'],
    problem: '#6',
  },
  // Supporting: Forum insights for AL
  forums: {
    script: 'scripts/run-insight-extraction.js',
    description: 'Extract insights from forum threads (#6)',
    problem: '#6',
  },
};

function showHelp() {
  console.log(`
Unified Data Pipeline Runner

Usage:
  node scripts/data-pipelines/run-pipeline.mjs <pipeline> [options]

Available Pipelines:
`);
  for (const [name, config] of Object.entries(PIPELINES)) {
    console.log(`  ${name.padEnd(12)} ${config.description}`);
    if (config.requires?.length) {
      console.log(`               Requires: ${config.requires.join(', ')}`);
    }
  }
  console.log(`
Common Options:
  --limit=N       Limit items to process
  --car=SLUG      Process single car
  --dry-run       Preview without saving
  --verbose       Enable verbose logging
  --help          Show this help

Examples:
  node scripts/data-pipelines/run-pipeline.mjs parts --limit=100
  node scripts/data-pipelines/run-pipeline.mjs market --car=bmw-m3-e46
  node scripts/data-pipelines/run-pipeline.mjs youtube --dry-run
`);
}

function checkRequirements(pipeline) {
  const config = PIPELINES[pipeline];
  if (!config.requires) return true;

  const missing = config.requires.filter(envVar => !process.env[envVar]);
  if (missing.length > 0) {
    console.error(`\n❌ Missing required environment variables for ${pipeline}:`);
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nPlease set these in .env.local and try again.\n');
    return false;
  }
  return true;
}

async function runPipeline(pipeline, args) {
  const config = PIPELINES[pipeline];
  const scriptPath = path.join(projectRoot, config.script);

  console.log('═'.repeat(70));
  console.log(`RUNNING PIPELINE: ${pipeline.toUpperCase()}`);
  console.log('═'.repeat(70));
  console.log(`Script: ${config.script}`);
  console.log(`Args: ${args.length > 0 ? args.join(' ') : '(none)'}`);
  console.log('─'.repeat(70));
  console.log('');

  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath, ...args], {
      stdio: 'inherit',
      cwd: projectRoot,
      env: { ...process.env },
    });

    child.on('close', (code) => {
      console.log('');
      console.log('─'.repeat(70));
      if (code === 0) {
        console.log(`✅ Pipeline ${pipeline} completed successfully`);
        resolve(code);
      } else {
        console.log(`❌ Pipeline ${pipeline} failed with exit code ${code}`);
        reject(new Error(`Pipeline failed with code ${code}`));
      }
    });

    child.on('error', (err) => {
      console.error('Failed to start pipeline:', err);
      reject(err);
    });
  });
}

async function main() {
  if (!pipelineName || pipelineName === '--help' || pipelineName === '-h') {
    showHelp();
    process.exit(0);
  }

  if (!PIPELINES[pipelineName]) {
    console.error(`\n❌ Unknown pipeline: ${pipelineName}`);
    console.error(`\nAvailable pipelines: ${Object.keys(PIPELINES).join(', ')}`);
    console.error('\nRun with --help for more information.\n');
    process.exit(1);
  }

  if (!checkRequirements(pipelineName)) {
    process.exit(1);
  }

  try {
    await runPipeline(pipelineName, options);
  } catch (err) {
    process.exit(1);
  }
}

main();
