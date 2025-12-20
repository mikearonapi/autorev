#!/usr/bin/env node
/**
 * Run AI Insight Extraction
 * 
 * Processes pending forum threads and extracts structured insights using Claude.
 * 
 * Usage:
 *   node scripts/run-insight-extraction.js                  # Extract from 5 threads
 *   node scripts/run-insight-extraction.js --max 10         # Extract from 10 threads
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables FIRST
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Dynamic imports after env is loaded
const { ForumScraperService } = await import('../lib/forumScraper/index.js');
const { InsightExtractor } = await import('../lib/forumScraper/insightExtractor.js');

// Parse CLI arguments
const args = process.argv.slice(2);
const maxThreads = parseInt(args.find((a, i) => args[i - 1] === '--max') || '5', 10);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bright: '\x1b[1m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function main() {
  console.log('\n' + '═'.repeat(60));
  log('  AI INSIGHT EXTRACTION', 'bright');
  console.log('═'.repeat(60));
  console.log(`  Max Threads: ${maxThreads}`);
  console.log('═'.repeat(60));

  // Check for required API keys
  if (!process.env.ANTHROPIC_API_KEY) {
    log('\n✗ ANTHROPIC_API_KEY not set', 'red');
    process.exit(1);
  }
  log('\n✓ Anthropic API key configured', 'green');

  if (!process.env.OPENAI_API_KEY) {
    log('⚠ OPENAI_API_KEY not set - embeddings will not be generated', 'yellow');
  } else {
    log('✓ OpenAI API key configured', 'green');
  }

  try {
    // Get pending threads
    log('\nFetching pending threads...', 'cyan');
    const scraper = new ForumScraperService();
    const pendingThreads = await scraper.getPendingThreads(maxThreads);
    
    if (pendingThreads.length === 0) {
      log('\nNo pending threads to process', 'yellow');
      log('All threads have already been processed or the database is empty.', 'dim');
      process.exit(0);
    }

    log(`Found ${pendingThreads.length} pending threads:`, 'green');
    for (let i = 0; i < Math.min(pendingThreads.length, 5); i++) {
      const t = pendingThreads[i];
      log(`  ${i + 1}. ${t.thread_title.substring(0, 50)}... (relevance: ${(t.relevance_score || 0).toFixed(2)})`, 'dim');
    }
    if (pendingThreads.length > 5) {
      log(`  ... and ${pendingThreads.length - 5} more`, 'dim');
    }

    // Run extraction
    log('\n' + '─'.repeat(60), 'dim');
    log('\nExtracting insights with Claude...', 'cyan');
    
    const extractor = new InsightExtractor();
    const startTime = Date.now();
    const result = await extractor.processBatch(pendingThreads);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Results
    log('\n' + '─'.repeat(60), 'dim');
    log('\nResults:', 'bright');
    log(`✓ Threads Processed: ${result.processed}`, 'green');
    log(`✓ Insights Extracted: ${result.insights}`, 'green');
    log(`✗ Errors: ${result.errors}`, result.errors > 0 ? 'red' : 'dim');
    log(`  Duration: ${duration}s`, 'dim');

    if (result.tokenUsage) {
      log('\nToken Usage:', 'cyan');
      log(`  Input tokens:  ${result.tokenUsage.input}`, 'dim');
      log(`  Output tokens: ${result.tokenUsage.output}`, 'dim');
    }
    if (result.costEstimate) {
      log(`  Estimated cost: $${result.costEstimate.toFixed(4)}`, 'dim');
    }

    // Show sample insights
    if (result.sampleInsights && result.sampleInsights.length > 0) {
      log('\nSample Insights:', 'cyan');
      for (const insight of result.sampleInsights.slice(0, 3)) {
        log(`\n  [${insight.insight_type}] ${insight.title}`, 'bright');
        log(`  ${insight.summary?.substring(0, 150)}...`, 'dim');
        log(`  Confidence: ${(insight.confidence * 100).toFixed(0)}%`, 'dim');
      }
    }

    console.log('\n' + '═'.repeat(60) + '\n');

  } catch (error) {
    log(`\n✗ Error: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  }
}

main().catch(console.error);













