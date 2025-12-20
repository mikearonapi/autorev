#!/usr/bin/env node
/**
 * Run the Event Ingestion Pipeline
 * 
 * Orchestrates fetching from multiple sources with fault tolerance,
 * deduplication, and provenance tracking.
 * 
 * Usage:
 *   # Run all enabled sources
 *   node scripts/run-event-pipeline.js --all
 * 
 *   # Run specific sources
 *   node scripts/run-event-pipeline.js --source=trackvenue
 *   node scripts/run-event-pipeline.js --source=trackvenue,ical,carsandcoffeeevents
 * 
 *   # Dry run (no database writes)
 *   node scripts/run-event-pipeline.js --all --dryRun
 * 
 *   # With date range
 *   node scripts/run-event-pipeline.js --all --rangeStart=2026-01-01 --rangeEnd=2026-12-31
 * 
 *   # Limit events per source
 *   node scripts/run-event-pipeline.js --all --limitPerSource=50
 * 
 * @module scripts/run-event-pipeline
 */

import 'dotenv/config';
import dotenv from 'dotenv';
import { runPipeline } from '../lib/eventIngestionPipeline.js';

// Load .env.local
dotenv.config({ path: '.env.local' });

/**
 * Parse command line arguments
 */
function parseArgs(argv) {
  const args = {};
  
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, ...valueParts] = arg.slice(2).split('=');
      const value = valueParts.length > 0 ? valueParts.join('=') : true;
      args[key] = value;
    }
  }
  
  return args;
}

/**
 * Print usage help
 */
function printHelp() {
  console.log(`
AutoRev Event Ingestion Pipeline

Usage:
  node scripts/run-event-pipeline.js [options]

Options:
  --all                  Run all enabled sources
  --source=NAME          Run specific source(s), comma-separated
                         Sources: eventbritesearch, carsandcoffeeevents, 
                                  motorsportreg, scca, pca, trackvenue, ical
  --dryRun               Don't insert to database, just fetch and validate
  --rangeStart=DATE      Only fetch events after this date (ISO format)
  --rangeEnd=DATE        Only fetch events before this date (ISO format)
  --limitPerSource=N     Max events to fetch per source (default: 100)
  --help                 Show this help message

Examples:
  # Full pipeline run
  node scripts/run-event-pipeline.js --all

  # Track events only (highest priority gap)
  node scripts/run-event-pipeline.js --source=trackvenue,motorsportreg

  # Test run with dry run
  node scripts/run-event-pipeline.js --all --dryRun --limitPerSource=10

  # 2026 events only
  node scripts/run-event-pipeline.js --all --rangeStart=2026-01-01 --rangeEnd=2026-12-31
`);
}

/**
 * Main entry point
 */
async function main() {
  const args = parseArgs(process.argv);
  
  // Show help
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  
  // Validate args
  if (!args.all && !args.source) {
    console.error('Error: Must specify --all or --source=NAME');
    printHelp();
    process.exit(1);
  }
  
  // Build options
  const options = {
    dryRun: args.dryRun === true || args.dryRun === 'true',
    rangeStart: args.rangeStart || null,
    rangeEnd: args.rangeEnd || null,
    limitPerSource: args.limitPerSource ? parseInt(args.limitPerSource, 10) : 100,
    jobId: `pipeline-${Date.now()}`,
  };
  
  // Build source filter
  let sourceFilter = null;
  if (args.source && typeof args.source === 'string') {
    sourceFilter = args.source.split(',').map(s => s.trim().toLowerCase());
  }
  
  // Print banner
  console.log('');
  console.log('🏁 AutoRev Event Ingestion Pipeline');
  console.log('='.repeat(50));
  console.log(`Sources:         ${sourceFilter ? sourceFilter.join(', ') : 'ALL'}`);
  console.log(`Dry Run:         ${options.dryRun}`);
  console.log(`Date Range:      ${options.rangeStart || 'any'} to ${options.rangeEnd || 'any'}`);
  console.log(`Limit/Source:    ${options.limitPerSource}`);
  console.log('='.repeat(50));
  
  try {
    const stats = await runPipeline(options, sourceFilter);
    
    // Exit code based on results
    if (stats.inserted > 0 || stats.fetched > 0) {
      console.log('\n✅ Pipeline completed successfully');
      process.exit(0);
    } else {
      console.log('\n⚠️  Pipeline completed but no events were processed');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();












