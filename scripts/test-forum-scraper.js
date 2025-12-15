#!/usr/bin/env node
/**
 * Forum Scraper Test Script
 * 
 * Dry-run validation script for testing forum scraping adapters.
 * Tests each configured forum without writing to the database.
 * 
 * Usage:
 *   node scripts/test-forum-scraper.js                    # Test all forums
 *   node scripts/test-forum-scraper.js --forum rennlist   # Test specific forum
 *   node scripts/test-forum-scraper.js --platform xenforo # Test all XenForo forums
 *   node scripts/test-forum-scraper.js --verbose          # Show detailed output
 * 
 * @module scripts/test-forum-scraper
 */

import { FORUM_CONFIGS, CAR_KEYWORD_MAPPINGS } from '../lib/forumConfigs.js';
import { BaseForumAdapter } from '../lib/forumScraper/baseAdapter.js';
import { XenForoAdapter } from '../lib/forumScraper/adapters/xenforoAdapter.js';
import { VBulletinAdapter } from '../lib/forumScraper/adapters/vbulletinAdapter.js';
import * as cheerio from 'cheerio';

// Parse CLI arguments
const args = process.argv.slice(2);
const flags = {
  forum: args.find((a, i) => args[i - 1] === '--forum') || null,
  platform: args.find((a, i) => args[i - 1] === '--platform') || null,
  verbose: args.includes('--verbose') || args.includes('-v'),
  help: args.includes('--help') || args.includes('-h'),
};

if (flags.help) {
  console.log(`
Forum Scraper Test Script
=========================

Tests forum scraping adapters without writing to the database (dry-run mode).

Usage:
  node scripts/test-forum-scraper.js [options]

Options:
  --forum <slug>      Test a specific forum (e.g., rennlist, bimmerpost)
  --platform <type>   Test all forums of a platform type (xenforo, vbulletin)
  --verbose, -v       Show detailed output including parsed data
  --help, -h          Show this help message

Examples:
  node scripts/test-forum-scraper.js
  node scripts/test-forum-scraper.js --forum rennlist --verbose
  node scripts/test-forum-scraper.js --platform xenforo
`);
  process.exit(0);
}

// Color helpers for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

const DEFAULT_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '─'.repeat(60));
  log(title, 'bright');
  console.log('─'.repeat(60));
}

function logSuccess(msg) { log(`✓ ${msg}`, 'green'); }
function logWarning(msg) { log(`⚠ ${msg}`, 'yellow'); }
function logError(msg) { log(`✗ ${msg}`, 'red'); }
function logInfo(msg) { log(`  ${msg}`, 'dim'); }

/**
 * Mock scraper service for dry-run mode
 */
class MockScraperService {
  constructor() {
    this.savedThreads = [];
  }

  async saveScrapedThread(scrapeRunId, forumSourceId, threadData) {
    this.savedThreads.push({
      scrapeRunId,
      forumSourceId,
      ...threadData
    });
    return { id: `mock-${Date.now()}`, ...threadData };
  }
}

/**
 * Test forum URL accessibility
 */
async function testForumUrl(url, name) {
  async function tryRequest(method) {
    const response = await fetch(url, {
      method,
      headers: {
        'User-Agent': DEFAULT_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    return response;
  }

  try {
    // Some forums block HEAD but allow GET. We try HEAD first to reduce bandwidth, then fallback to GET.
    let response = await tryRequest('HEAD');
    if (!response.ok && (response.status === 403 || response.status === 405)) {
      response = await tryRequest('GET');
    }

    if (response.ok) {
      logSuccess(`${name}: ${url} (${response.status})`);
      return { success: true, status: response.status };
    } else {
      logWarning(`${name}: ${url} (${response.status})`);
      return { success: false, status: response.status, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    logError(`${name}: ${url} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Test adapter thread list parsing
 */
async function testAdapterThreadList(forumConfig, adapter) {
  const config = forumConfig.scrapeConfig;
  const subforums = Object.keys(config.subforums || {});
  
  if (subforums.length === 0) {
    logWarning('No subforums configured');
    return { threads: [], errors: ['No subforums configured'] };
  }

  const firstSubforum = subforums[0];
  const subforumCarSlugs = config.subforums[firstSubforum] || forumConfig.carSlugs || [];
  const listUrl = `${forumConfig.baseUrl}${firstSubforum}`;

  logInfo(`Testing thread list: ${listUrl}`);

  try {
    // Be conservative: even in dry-run validation, we should not hammer forums.
    const delayMs = Math.max(500, Math.min(config.rateLimitMs || 2000, 3000));
    const html = await adapter.fetchWithRateLimit(listUrl, config, delayMs);
    const threads = adapter.parseThreadList(html, config, subforumCarSlugs, forumConfig.baseUrl);

    if (threads.length > 0) {
      logSuccess(`Parsed ${threads.length} threads from list`);
      
      // Validate thread structure
      const validThreads = threads.filter(t => 
        t.title && t.url && typeof t.replyCount === 'number'
      );
      
      if (validThreads.length !== threads.length) {
        logWarning(`${threads.length - validThreads.length} threads have invalid structure`);
      }

      // Show sample thread if verbose
      if (flags.verbose && threads[0]) {
        logInfo(`Sample thread: "${threads[0].title.substring(0, 50)}..."`);
        logInfo(`  URL: ${threads[0].url}`);
        logInfo(`  Replies: ${threads[0].replyCount}, Views: ${threads[0].viewCount || 'N/A'}`);
        logInfo(`  Relevance: ${threads[0].relevanceScore.toFixed(2)}`);
        logInfo(`  Car slugs: ${threads[0].carSlugsDetected.join(', ') || 'None detected'}`);
      }

      return { threads, errors: [] };
    } else {
      logWarning('No threads parsed - selectors may be incorrect');
      if (flags.verbose) {
        const $ = cheerio.load(html);
        const hints = {
          xenforo_struct_threads: $('.structItem--thread').length,
          xenforo_struct_container: $('.structItemContainer').length,
          vbulletin_thread_title_anchors: $('a[id^="thread_title_"]').length,
          vbulletin_trow_rows: $('.trow.text-center').length,
          vbulletin_threadbit: $('.threadbit').length,
        };
        logInfo(`HTML hints: ${JSON.stringify(hints)}`);
      }
      return { threads: [], errors: ['No threads parsed'] };
    }
  } catch (error) {
    logError(`Failed to parse thread list: ${error.message}`);
    return { threads: [], errors: [error.message] };
  }
}

/**
 * Test adapter thread content scraping
 */
async function testAdapterThreadContent(forumConfig, adapter, threadUrl) {
  const config = forumConfig.scrapeConfig;
  const subforumCarSlugs = forumConfig.carSlugs || [];

  logInfo(`Testing thread content: ${threadUrl.substring(0, 60)}...`);

  try {
    const fullThread = await adapter.scrapeThread(
      threadUrl,
      config,
      'test-subforum',
      subforumCarSlugs,
      forumConfig.baseUrl
    );

    if (fullThread && fullThread.posts && fullThread.posts.length > 0) {
      logSuccess(`Scraped thread: ${fullThread.posts.length} posts`);
      
      // Validate post structure
      const validPosts = fullThread.posts.filter(p =>
        p.content && p.post_number && typeof p.is_op === 'boolean'
      );

      if (validPosts.length !== fullThread.posts.length) {
        logWarning(`${fullThread.posts.length - validPosts.length} posts have invalid structure`);
      }

      if (flags.verbose) {
        logInfo(`Title: ${fullThread.title?.substring(0, 50) || 'N/A'}...`);
        logInfo(`Date: ${fullThread.originalPostDate || 'N/A'}`);
        logInfo(`Car slugs: ${fullThread.carSlugsDetected?.join(', ') || 'None'}`);
        logInfo(`First post: ${fullThread.posts[0]?.content?.substring(0, 100) || 'N/A'}...`);
      }

      return { thread: fullThread, errors: [] };
    } else {
      logWarning('No posts parsed - content selectors may be incorrect');
      return { thread: null, errors: ['No posts parsed'] };
    }
  } catch (error) {
    logError(`Failed to scrape thread: ${error.message}`);
    return { thread: null, errors: [error.message] };
  }
}

/**
 * Test car slug detection
 */
function testCarSlugDetection() {
  logSection('Car Slug Detection Test');

  const testCases = [
    // IMPORTANT: expected slugs must exist in the `cars` table (canonical slugs)
    { text: 'My 997 GT3 has an IMS bearing issue', expected: ['997-2-carrera-s', 'porsche-911-gt3-996', 'porsche-911-gt3-997'] },
    { text: 'Just bought a 2019 Miata ND RF', expected: ['mazda-mx5-miata-nd'] },
    { text: 'BRZ valve spring recall discussion', expected: ['subaru-brz-zc6', 'subaru-brz-zd8'] },
    { text: 'C8 vs C7 Z06 comparison', expected: ['c8-corvette-stingray', 'c7-corvette-z06'] },
    { text: 'Golf R MK7 stage 2 tune', expected: ['volkswagen-golf-r-mk7', 'volkswagen-gti-mk7'] },
  ];

  const adapter = new BaseForumAdapter({});
  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    const allSlugs = Object.values(CAR_KEYWORD_MAPPINGS).flat();
    const detected = adapter.detectCarSlugs(test.text, allSlugs);
    
    // Check if any expected slugs were detected
    const hasExpected = test.expected.some(exp => detected.includes(exp));
    
    if (hasExpected) {
      logSuccess(`"${test.text.substring(0, 40)}..." → ${detected.join(', ')}`);
      passed++;
    } else {
      logError(`"${test.text.substring(0, 40)}..." → Got: ${detected.join(', ') || 'none'}, Expected: ${test.expected.join(', ')}`);
      failed++;
    }
  }

  return { passed, failed };
}

/**
 * Test relevance scoring
 */
function testRelevanceScoring() {
  logSection('Relevance Scoring Test');

  const adapter = new BaseForumAdapter({});
  const config = {
    threadFilters: {
      titleInclude: ['DIY', 'guide', 'issue', 'problem', 'track'],
      titleExclude: ['WTB', 'WTS', 'FOR SALE'],
    },
  };

  const testCases = [
    { title: 'DIY IMS bearing replacement guide', replies: 150, views: 50000, minScore: 0.5 },
    { title: 'Complete track build thread', replies: 80, views: 30000, minScore: 0.4 },
    // Basic engagement-only thread (no high-value keywords) should not be filtered out.
    { title: 'Simple question about oil', replies: 6, views: 500, minScore: 0.05 },
    { title: 'WTS: Part for sale cheap', replies: 10, views: 1000, maxScore: 0.05 },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    const score = adapter.calculateRelevanceScore(test.title, test.replies, test.views, config);
    
    let ok = true;
    if (test.minScore && score < test.minScore) ok = false;
    if (test.maxScore && score > test.maxScore) ok = false;

    if (ok) {
      logSuccess(`"${test.title.substring(0, 35)}..." → ${score.toFixed(2)}`);
      passed++;
    } else {
      logError(`"${test.title.substring(0, 35)}..." → ${score.toFixed(2)} (expected ${test.minScore ? `>= ${test.minScore}` : `<= ${test.maxScore}`})`);
      failed++;
    }
  }

  return { passed, failed };
}

/**
 * Test a single forum end-to-end
 */
async function testForum(slug, forumConfig) {
  logSection(`Testing: ${forumConfig.name} (${forumConfig.platformType})`);

  const results = {
    forum: slug,
    name: forumConfig.name,
    platform: forumConfig.platformType,
    urlAccessible: false,
    threadListParsed: false,
    threadContentParsed: false,
    errors: [],
    stats: {},
  };

  // 1. Test URL accessibility
  log('\n1. URL Accessibility:', 'cyan');
  const urlResult = await testForumUrl(forumConfig.baseUrl, forumConfig.name);
  results.urlAccessible = urlResult.success;
  if (!urlResult.success) {
    results.errors.push(`URL check failed: ${urlResult.error}`);
    return results;
  }

  // 2. Create appropriate adapter
  const mockService = new MockScraperService();
  let adapter;
  
  if (forumConfig.platformType === 'xenforo') {
    adapter = new XenForoAdapter(mockService);
  } else if (forumConfig.platformType === 'vbulletin') {
    adapter = new VBulletinAdapter(mockService);
  } else {
    logError(`Unknown platform type: ${forumConfig.platformType}`);
    results.errors.push(`Unknown platform: ${forumConfig.platformType}`);
    return results;
  }

  // 3. Test thread list parsing
  log('\n2. Thread List Parsing:', 'cyan');
  const listResult = await testAdapterThreadList(forumConfig, adapter);
  results.threadListParsed = listResult.threads.length > 0;
  results.stats.threadsFound = listResult.threads.length;
  results.errors.push(...listResult.errors);

  if (!results.threadListParsed) {
    return results;
  }

  // 4. Test thread content parsing (pick a qualifying thread)
  log('\n3. Thread Content Parsing:', 'cyan');
  const qualifyingThread = listResult.threads.find(t => 
    t.relevanceScore > 0.1 && t.replyCount >= 3
  ) || listResult.threads[0];

  if (qualifyingThread) {
    const contentResult = await testAdapterThreadContent(forumConfig, adapter, qualifyingThread.url);
    results.threadContentParsed = contentResult.thread !== null;
    results.stats.postsInSample = contentResult.thread?.posts?.length || 0;
    results.stats.carSlugsDetected = contentResult.thread?.carSlugsDetected?.length || 0;
    results.errors.push(...contentResult.errors);
  }

  // 5. Summary
  log('\n4. Summary:', 'cyan');
  if (results.urlAccessible && results.threadListParsed && results.threadContentParsed) {
    logSuccess(`${forumConfig.name} passed all tests`);
  } else {
    logWarning(`${forumConfig.name} had issues - see errors above`);
  }

  return results;
}

/**
 * Main test runner
 */
async function main() {
  console.log('\n' + '═'.repeat(60));
  log('  FORUM SCRAPER DRY-RUN VALIDATION', 'bright');
  console.log('═'.repeat(60));
  console.log(`  Mode: ${flags.forum ? `Single forum (${flags.forum})` : flags.platform ? `Platform (${flags.platform})` : 'All forums'}`);
  console.log(`  Verbose: ${flags.verbose ? 'Yes' : 'No'}`);
  console.log('═'.repeat(60));

  // Run unit tests first
  const slugResults = testCarSlugDetection();
  const scoreResults = testRelevanceScoring();

  // Determine which forums to test
  let forumsToTest = Object.entries(FORUM_CONFIGS);
  
  if (flags.forum) {
    forumsToTest = forumsToTest.filter(([slug]) => slug === flags.forum);
    if (forumsToTest.length === 0) {
      logError(`Forum not found: ${flags.forum}`);
      logInfo(`Available forums: ${Object.keys(FORUM_CONFIGS).join(', ')}`);
      process.exit(1);
    }
  }
  
  if (flags.platform) {
    forumsToTest = forumsToTest.filter(([, config]) => config.platformType === flags.platform);
    if (forumsToTest.length === 0) {
      logError(`No forums found for platform: ${flags.platform}`);
      process.exit(1);
    }
  }

  // Test each forum
  const results = [];
  
  for (let i = 0; i < forumsToTest.length; i++) {
    const [slug, config] = forumsToTest[i];
    const result = await testForum(slug, config);
    results.push(result);
    
    // Rate limit between forums
    if (i < forumsToTest.length - 1) {
      logInfo('Waiting 3 seconds before next forum...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  // Final summary
  logSection('FINAL RESULTS');

  const passed = results.filter(r => r.urlAccessible && r.threadListParsed && r.threadContentParsed);
  const partial = results.filter(r => r.urlAccessible && (r.threadListParsed || r.threadContentParsed) && !(r.threadListParsed && r.threadContentParsed));
  const failed = results.filter(r => !r.urlAccessible);

  console.log('\nForum Results:');
  for (const r of results) {
    const status = r.urlAccessible && r.threadListParsed && r.threadContentParsed 
      ? '✓ PASS' 
      : r.urlAccessible 
        ? '⚠ PARTIAL'
        : '✗ FAIL';
    const color = status.includes('PASS') ? 'green' : status.includes('PARTIAL') ? 'yellow' : 'red';
    log(`  ${r.name.padEnd(20)} ${status}`, color);
    
    if (flags.verbose && r.errors.length > 0) {
      for (const err of r.errors) {
        logInfo(`    └─ ${err}`);
      }
    }
  }

  console.log('\nUnit Tests:');
  log(`  Car Slug Detection: ${slugResults.passed}/${slugResults.passed + slugResults.failed} passed`, slugResults.failed ? 'yellow' : 'green');
  log(`  Relevance Scoring:  ${scoreResults.passed}/${scoreResults.passed + scoreResults.failed} passed`, scoreResults.failed ? 'yellow' : 'green');

  console.log('\nSummary:');
  log(`  Forums passed:  ${passed.length}/${results.length}`, passed.length === results.length ? 'green' : 'yellow');
  log(`  Forums partial: ${partial.length}/${results.length}`, partial.length ? 'yellow' : 'dim');
  log(`  Forums failed:  ${failed.length}/${results.length}`, failed.length ? 'red' : 'dim');

  console.log('\n' + '═'.repeat(60));

  // Exit with appropriate code
  process.exit(failed.length > 0 ? 1 : 0);
}

// Run
main().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
});

