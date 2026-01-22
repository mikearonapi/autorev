#!/usr/bin/env node
/**
 * Test script for Firecrawl integration
 * 
 * Usage:
 *   node scripts/test-firecrawl.js
 *   node scripts/test-firecrawl.js --url "https://example.com/forum/thread"
 *   node scripts/test-firecrawl.js --forum rennlist
 * 
 * Environment:
 *   FIRECRAWL_API_KEY - Required for all tests
 *   EXA_API_KEY - Optional, for combined Exa+Firecrawl tests
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import firecrawlClient from '../lib/firecrawlClient.js';
import { ForumScraperService } from '../lib/forumScraper/index.js';

const args = process.argv.slice(2);
const urlArg = args.find(a => a.startsWith('--url='))?.split('=')[1] 
  || args[args.indexOf('--url') + 1];
const forumArg = args.find(a => a.startsWith('--forum='))?.split('=')[1]
  || args[args.indexOf('--forum') + 1];

async function testBasicScrape() {
  console.log('\n=== Test 1: Basic URL Scrape ===\n');
  
  const testUrl = urlArg || 'https://rennlist.com/forums/987-forum-125/1313691-complete-diy-exhaust-manifold-install-guide.html';
  
  console.log(`Scraping: ${testUrl}`);
  
  const result = await firecrawlClient.scrapeUrl(testUrl, {
    formats: ['markdown'],
    onlyMainContent: true,
  });
  
  if (result.success) {
    console.log('\n✅ Scrape successful!');
    console.log(`   Title: ${result.title}`);
    console.log(`   Word count: ${result.wordCount}`);
    console.log(`   Markdown preview (first 500 chars):\n`);
    console.log('   ' + result.markdown.substring(0, 500).replace(/\n/g, '\n   ') + '...\n');
  } else {
    console.log(`\n❌ Scrape failed: ${result.error}`);
  }
  
  return result.success;
}

async function testForumThreadScrape() {
  console.log('\n=== Test 2: Forum Thread Extraction ===\n');
  
  const testUrl = urlArg || 'https://rennlist.com/forums/987-forum-125/1313691-complete-diy-exhaust-manifold-install-guide.html';
  
  console.log(`Extracting forum thread: ${testUrl}`);
  
  const result = await firecrawlClient.scrapeForumThread(testUrl, {
    extractPosts: true,
  });
  
  if (result.success) {
    console.log('\n✅ Thread extraction successful!');
    console.log(`   Title: ${result.title}`);
    console.log(`   Word count: ${result.wordCount}`);
    console.log(`   Posts found: ${result.postCount}`);
    
    if (result.posts?.length > 0) {
      console.log('\n   First post preview:');
      const firstPost = result.posts[0];
      console.log(`   Author: ${firstPost.author || 'Unknown'}`);
      console.log(`   Words: ${firstPost.wordCount}`);
      console.log(`   Content: ${firstPost.content?.substring(0, 200)}...`);
    }
  } else {
    console.log(`\n❌ Thread extraction failed: ${result.error}`);
  }
  
  return result.success;
}

async function testDiscoverAndExtract() {
  console.log('\n=== Test 3: Combined Exa Discovery + Firecrawl Extraction ===\n');
  
  const forumSlug = forumArg || 'rennlist';
  const service = new ForumScraperService();
  
  console.log(`Running discoverAndExtract for forum: ${forumSlug}`);
  console.log('(This uses Exa to find threads, Firecrawl to extract content)\n');
  
  const result = await service.discoverAndExtract(forumSlug, {
    maxDiscovered: 5,
    maxExtracted: 3,
    useExa: !!process.env.EXA_API_KEY,
    useFirecrawl: true,
  });
  
  console.log(`Discovery method: ${result.discoveryMethod || 'none'}`);
  console.log(`Extraction method: ${result.extractionMethod || 'none'}`);
  console.log(`Stats:`, result.stats);
  
  if (result.threads.length > 0) {
    console.log(`\n✅ Found ${result.threads.length} threads:`);
    result.threads.forEach((t, i) => {
      console.log(`\n   ${i + 1}. ${t.title || t.firecrawlTitle || 'Unknown title'}`);
      console.log(`      URL: ${t.url}`);
      console.log(`      Words: ${t.wordCount || 0}`);
      console.log(`      Posts: ${t.postCount || 0}`);
      if (t.markdown) {
        console.log(`      Content preview: ${t.markdown.substring(0, 150)}...`);
      }
    });
  } else {
    console.log('\n⚠️ No threads found');
  }
  
  return result.threads.length > 0;
}

async function testSmartDiscover() {
  console.log('\n=== Test 4: Smart Discovery (Auto-selects best method) ===\n');
  
  const forumSlug = forumArg || 'rennlist';
  const service = new ForumScraperService();
  
  console.log(`Running smartDiscover for forum: ${forumSlug}`);
  
  const result = await service.smartDiscover(forumSlug, {
    extractContent: true,
    maxThreads: 3,
  });
  
  console.log(`\nDiscovery method: ${result.method || 'none'}`);
  console.log(`Extraction method: ${result.extractionMethod || 'none'}`);
  console.log(`Fallback used: ${result.fallbackUsed}`);
  console.log(`Stats:`, result.stats);
  
  if (result.threads.length > 0) {
    console.log(`\n✅ Found ${result.threads.length} threads`);
  } else {
    console.log('\n⚠️ No threads discovered');
  }
  
  return result.threads.length > 0;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║           Firecrawl Integration Test Suite                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  // Check configuration
  console.log('\n📋 Configuration Check:');
  console.log(`   FIRECRAWL_API_KEY: ${process.env.FIRECRAWL_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`   EXA_API_KEY: ${process.env.EXA_API_KEY ? '✅ Set' : '⚠️ Not set (optional)'}`);
  
  if (!process.env.FIRECRAWL_API_KEY) {
    console.log('\n❌ FIRECRAWL_API_KEY is required. Add it to .env.local:');
    console.log('   FIRECRAWL_API_KEY=fc-your-api-key-here\n');
    process.exit(1);
  }
  
  const results = {
    basicScrape: false,
    forumThread: false,
    discoverAndExtract: false,
    smartDiscover: false,
  };
  
  try {
    // Test 1: Basic scrape
    results.basicScrape = await testBasicScrape();
  } catch (err) {
    console.log(`\n❌ Test 1 error: ${err.message}`);
  }
  
  try {
    // Test 2: Forum thread extraction
    results.forumThread = await testForumThreadScrape();
  } catch (err) {
    console.log(`\n❌ Test 2 error: ${err.message}`);
  }
  
  try {
    // Test 3: Combined discovery + extraction
    results.discoverAndExtract = await testDiscoverAndExtract();
  } catch (err) {
    console.log(`\n❌ Test 3 error: ${err.message}`);
  }
  
  try {
    // Test 4: Smart discovery
    results.smartDiscover = await testSmartDiscover();
  } catch (err) {
    console.log(`\n❌ Test 4 error: ${err.message}`);
  }
  
  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Test Summary                            ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Basic URL Scrape:          ${results.basicScrape ? '✅ PASS' : '❌ FAIL'}                       ║`);
  console.log(`║  Forum Thread Extraction:   ${results.forumThread ? '✅ PASS' : '❌ FAIL'}                       ║`);
  console.log(`║  Discover + Extract:        ${results.discoverAndExtract ? '✅ PASS' : '❌ FAIL'}                       ║`);
  console.log(`║  Smart Discovery:           ${results.smartDiscover ? '✅ PASS' : '❌ FAIL'}                       ║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const allPassed = Object.values(results).every(v => v);
  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
