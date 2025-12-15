#!/usr/bin/env node
/**
 * Forum Scrape Test Runner
 * 
 * Runs a limited scrape to verify meaningful data collection.
 * Can run in dry-run mode (no DB writes) or real mode (writes to DB).
 * 
 * Usage:
 *   node scripts/run-forum-scrape-test.js                     # Dry-run mode
 *   node scripts/run-forum-scrape-test.js --real              # Real mode (writes to DB)
 *   node scripts/run-forum-scrape-test.js --forum rennlist    # Specific forum
 *   node scripts/run-forum-scrape-test.js --max-threads 5     # Limit threads
 * 
 * @module scripts/run-forum-scrape-test
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables FIRST, before any other imports
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Dynamic imports - executed after environment is configured
let ForumScraperService, InsightExtractor, FORUM_CONFIGS, getActiveForumConfigs;

async function loadModules() {
  const scraperModule = await import('../lib/forumScraper/index.js');
  ForumScraperService = scraperModule.ForumScraperService;
  
  const extractorModule = await import('../lib/forumScraper/insightExtractor.js');
  InsightExtractor = extractorModule.InsightExtractor;
  
  const configModule = await import('../lib/forumConfigs.js');
  FORUM_CONFIGS = configModule.FORUM_CONFIGS;
  getActiveForumConfigs = configModule.getActiveForumConfigs;
}

// Parse CLI arguments
const args = process.argv.slice(2);
const flags = {
  real: args.includes('--real'),
  forum: args.find((a, i) => args[i - 1] === '--forum') || 'rennlist',
  maxThreads: parseInt(args.find((a, i) => args[i - 1] === '--max-threads') || '5', 10),
  extract: args.includes('--extract'),
  help: args.includes('--help') || args.includes('-h'),
};

if (flags.help) {
  console.log(`
Forum Scrape Test Runner
========================

Runs a limited scrape to verify meaningful data collection.

Usage:
  node scripts/run-forum-scrape-test.js [options]

Options:
  --real                   Write to database (default: dry-run)
  --forum <slug>           Forum to scrape (default: rennlist)
  --max-threads <n>        Max threads to scrape (default: 5)
  --extract                Also run AI insight extraction
  --help, -h               Show this help message

Examples:
  node scripts/run-forum-scrape-test.js
  node scripts/run-forum-scrape-test.js --real --forum rennlist --max-threads 10
  node scripts/run-forum-scrape-test.js --real --extract
`);
  process.exit(0);
}

// Color helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '─'.repeat(60));
  log(title, 'bright');
  console.log('─'.repeat(60));
}

/**
 * Analyze thread quality for meaningful content
 */
function analyzeThreadQuality(threads) {
  const analysis = {
    total: threads.length,
    withCarSlugs: 0,
    highRelevance: 0,
    goodEngagement: 0,
    qualityIndicators: [],
  };

  for (const thread of threads) {
    // Check car slug detection
    if (thread.car_slugs_detected?.length > 0 || thread.carSlugsDetected?.length > 0) {
      analysis.withCarSlugs++;
    }

    // Check relevance
    const relevance = thread.relevance_score ?? thread.relevanceScore ?? 0;
    if (relevance >= 0.3) {
      analysis.highRelevance++;
    }

    // Check engagement
    const replies = thread.reply_count ?? thread.replyCount ?? 0;
    if (replies >= 10) {
      analysis.goodEngagement++;
    }

    // Identify quality indicators in title
    const title = (thread.thread_title ?? thread.title ?? '').toLowerCase();
    const indicators = ['diy', 'guide', 'how to', 'issue', 'problem', 'fix', 'install', 'track', 'review'];
    for (const indicator of indicators) {
      if (title.includes(indicator) && !analysis.qualityIndicators.includes(indicator)) {
        analysis.qualityIndicators.push(indicator);
      }
    }
  }

  return analysis;
}

/**
 * Display sample threads for verification
 */
function displaySampleThreads(threads, count = 3) {
  log('\nSample Threads:', 'cyan');
  
  const samples = threads.slice(0, count);
  for (let i = 0; i < samples.length; i++) {
    const t = samples[i];
    const title = t.thread_title ?? t.title ?? 'Unknown';
    const url = t.thread_url ?? t.url ?? '';
    const replies = t.reply_count ?? t.replyCount ?? 0;
    const views = t.view_count ?? t.viewCount ?? 0;
    const relevance = (t.relevance_score ?? t.relevanceScore ?? 0).toFixed(2);
    const carSlugs = t.car_slugs_detected ?? t.carSlugsDetected ?? [];
    const postsCount = t.posts?.length ?? t.posts_count ?? 0;

    console.log(`\n  ${i + 1}. ${colors.bright}${title.substring(0, 60)}${title.length > 60 ? '...' : ''}${colors.reset}`);
    console.log(`     ${colors.dim}URL: ${url.substring(0, 70)}${url.length > 70 ? '...' : ''}${colors.reset}`);
    console.log(`     Replies: ${replies} | Views: ${views || 'N/A'} | Posts: ${postsCount} | Relevance: ${relevance}`);
    console.log(`     ${colors.cyan}Car Slugs: ${carSlugs.length > 0 ? carSlugs.join(', ') : 'None detected'}${colors.reset}`);
    
    // Show first post snippet if available
    if (t.posts && t.posts.length > 0) {
      const firstPost = t.posts[0].content ?? '';
      if (firstPost) {
        const snippet = firstPost.substring(0, 150).replace(/\n/g, ' ').trim();
        console.log(`     ${colors.dim}Content: "${snippet}..."${colors.reset}`);
      }
    }
  }
}

/**
 * Main runner
 */
async function main() {
  // Load modules after environment is configured
  await loadModules();
  
  console.log('\n' + '═'.repeat(60));
  log('  FORUM SCRAPE TEST RUNNER', 'bright');
  console.log('═'.repeat(60));
  console.log(`  Mode: ${flags.real ? 'REAL (writes to DB)' : 'DRY-RUN (no DB writes)'}`);
  console.log(`  Forum: ${flags.forum}`);
  console.log(`  Max Threads: ${flags.maxThreads}`);
  console.log(`  Extract Insights: ${flags.extract ? 'Yes' : 'No'}`);
  console.log('═'.repeat(60));

  // Verify forum exists
  const forumConfig = FORUM_CONFIGS[flags.forum];
  if (!forumConfig) {
    log(`\n✗ Forum not found: ${flags.forum}`, 'red');
    log(`  Available forums: ${Object.keys(FORUM_CONFIGS).join(', ')}`, 'dim');
    process.exit(1);
  }

  // Check if forum is active
  if (forumConfig.priority === 0) {
    log(`\n⚠ Forum "${flags.forum}" is disabled (priority=0)`, 'yellow');
    log(`  Reason: ${forumConfig.slug === 'miata-net' ? 'Blocking bots (403)' : 'Check configuration'}`, 'dim');
    process.exit(1);
  }

  try {
    // Initialize scraper
    logSection('Initializing Scraper');
    const scraperService = new ForumScraperService({ dryRun: !flags.real });
    
    if (!flags.real) {
      log('Running in DRY-RUN mode - no database writes', 'yellow');
    } else {
      log('Running in REAL mode - will write to database', 'green');
    }

    // Run scrape
    logSection(`Scraping: ${forumConfig.name}`);
    log(`Base URL: ${forumConfig.baseUrl}`, 'dim');
    log(`Platform: ${forumConfig.platformType}`, 'dim');
    log(`Car Slugs: ${forumConfig.carSlugs?.slice(0, 5).join(', ')}${forumConfig.carSlugs?.length > 5 ? '...' : ''}`, 'dim');

    const startTime = Date.now();
    const result = await scraperService.scrape(flags.forum, { 
      maxThreads: flags.maxThreads,
      dryRun: !flags.real 
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Results
    logSection('Scrape Results');
    log(`✓ Threads Found: ${result.results.threadsFound}`, 'green');
    log(`✓ Threads Scraped: ${result.results.threadsScraped}`, 'green');
    log(`✓ Posts Scraped: ${result.results.postsScraped}`, 'green');
    log(`  Duration: ${duration}s`, 'dim');

    // Analyze quality
    const threads = flags.real ? [] : (result.dryRunResults || []);
    if (threads.length > 0) {
      logSection('Data Quality Analysis');
      const analysis = analyzeThreadQuality(threads);
      
      log(`Total Threads: ${analysis.total}`);
      log(`With Car Slugs: ${analysis.withCarSlugs} (${Math.round(100 * analysis.withCarSlugs / analysis.total)}%)`);
      log(`High Relevance (≥0.3): ${analysis.highRelevance} (${Math.round(100 * analysis.highRelevance / analysis.total)}%)`);
      log(`Good Engagement (≥10 replies): ${analysis.goodEngagement} (${Math.round(100 * analysis.goodEngagement / analysis.total)}%)`);
      
      if (analysis.qualityIndicators.length > 0) {
        log(`\nQuality Indicators Found: ${analysis.qualityIndicators.join(', ')}`, 'cyan');
      }

      // Display samples
      displaySampleThreads(threads);
    }

    // Run insight extraction if requested
    if (flags.extract && flags.real) {
      logSection('Running AI Insight Extraction');
      
      // Check for required API keys
      if (!process.env.ANTHROPIC_API_KEY) {
        log('⚠ ANTHROPIC_API_KEY not set - cannot run extraction', 'yellow');
      } else {
        const extractor = new InsightExtractor();
        const pendingThreads = await scraperService.getPendingThreads(Math.min(flags.maxThreads, 5));
        
        if (pendingThreads.length === 0) {
          log('No pending threads to process', 'dim');
        } else {
          log(`Processing ${pendingThreads.length} threads...`, 'dim');
          const extractResult = await extractor.processBatch(pendingThreads);
          
          log(`\n✓ Threads Processed: ${extractResult.processed}`, 'green');
          log(`✓ Insights Extracted: ${extractResult.insights}`, 'green');
          log(`✗ Errors: ${extractResult.errors}`, extractResult.errors > 0 ? 'red' : 'dim');
          
          if (extractResult.tokenUsage) {
            log(`\nToken Usage:`, 'dim');
            log(`  Input: ${extractResult.tokenUsage.input}`, 'dim');
            log(`  Output: ${extractResult.tokenUsage.output}`, 'dim');
          }
          if (extractResult.costEstimate) {
            log(`  Estimated Cost: $${extractResult.costEstimate.toFixed(4)}`, 'dim');
          }
        }
      }
    }

    // Summary
    logSection('Summary');
    
    if (!flags.real) {
      log('DRY-RUN Complete', 'green');
      log('Run with --real flag to write to database', 'dim');
      
      if (threads.length > 0) {
        const analysis = analyzeThreadQuality(threads);
        const carSlugRate = Math.round(100 * analysis.withCarSlugs / analysis.total);
        
        if (carSlugRate >= 80) {
          log(`✓ Car slug detection: ${carSlugRate}% (target: >80%)`, 'green');
        } else {
          log(`⚠ Car slug detection: ${carSlugRate}% (target: >80%)`, 'yellow');
        }
        
        if (analysis.highRelevance >= analysis.total * 0.5) {
          log(`✓ High relevance threads: ${analysis.highRelevance}/${analysis.total}`, 'green');
        } else {
          log(`⚠ Low relevance threads found - may need filter adjustment`, 'yellow');
        }
      }
    } else {
      log('REAL Scrape Complete', 'green');
      log(`Data written to database. Run validation queries to verify.`, 'dim');
    }

    console.log('\n' + '═'.repeat(60) + '\n');

  } catch (error) {
    log(`\n✗ Error: ${error.message}`, 'red');
    if (error.message.includes('not configured') || error.message.includes('SUPABASE')) {
      log('Database not configured. Check your .env.local file.', 'dim');
    }
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});

