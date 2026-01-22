#!/usr/bin/env node
/**
 * Simple Apify Test Script
 * Tests both BaT and Reddit scrapers without complex imports
 */

import { config } from 'dotenv';
import { ApifyClient } from 'apify-client';

// Load .env.local
config({ path: '.env.local' });

const token = process.env.APIFY_API_TOKEN;

if (!token) {
  console.error('❌ APIFY_API_TOKEN not found in .env.local');
  process.exit(1);
}

console.log('✅ Apify token found:', token.substring(0, 15) + '...\n');

const client = new ApifyClient({ token });

// ============================================================================
// TEST 1: Reddit Scraper (crawlerbros/reddit-scraper)
// ============================================================================
async function testReddit() {
  console.log('='.repeat(60));
  console.log('TEST 1: Reddit Scraper (r/cars)');
  console.log('='.repeat(60));
  
  try {
    console.log('\nRunning crawlerbros/reddit-scraper...');
    console.log('This may take 30-60 seconds...\n');
    
    const run = await client.actor('crawlerbros/reddit-scraper').call({
      subreddits: ['cars'],
      maxPosts: 10,
      sort: 'hot',
    });
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    console.log(`✅ Retrieved ${items.length} posts from r/cars\n`);
    
    // Show sample data
    console.log('Sample posts:');
    console.log('-'.repeat(60));
    
    items.slice(0, 5).forEach((post, i) => {
      console.log(`\n${i + 1}. [${post.score || post.ups || '?'} upvotes] ${post.title?.substring(0, 70)}...`);
      console.log(`   Author: u/${post.author}`);
      console.log(`   Comments: ${post.num_comments || post.numComments || '?'}`);
      console.log(`   URL: ${post.url?.substring(0, 60)}...`);
      if (post.selftext) {
        console.log(`   Preview: ${post.selftext.substring(0, 100).replace(/\n/g, ' ')}...`);
      }
    });
    
    console.log('\n' + '-'.repeat(60));
    console.log('Reddit data structure sample:');
    console.log(JSON.stringify(items[0], null, 2).substring(0, 1500) + '...\n');
    
    return items;
  } catch (error) {
    console.error('❌ Reddit scraper error:', error.message);
    return null;
  }
}

// ============================================================================
// TEST 2: Bring a Trailer Scraper (parseforge/bringatrailer-auctions-scraper)
// ============================================================================
async function testBaT() {
  console.log('='.repeat(60));
  console.log('TEST 2: Bring a Trailer Scraper');
  console.log('='.repeat(60));
  
  try {
    console.log('\nRunning parseforge/bringatrailer-auctions-scraper...');
    console.log('Searching for: "BMW M3"');
    console.log('This may take 30-60 seconds...\n');
    
    const run = await client.actor('parseforge/bringatrailer-auctions-scraper').call({
      searchQuery: 'BMW M3',
      maxItems: 10,
      proxyConfiguration: { useApifyProxy: true },
    });
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    console.log(`✅ Retrieved ${items.length} auctions\n`);
    
    // Show sample data
    console.log('Sample auctions:');
    console.log('-'.repeat(60));
    
    items.slice(0, 5).forEach((auction, i) => {
      const price = auction.currentBid || auction.price || auction.soldPrice;
      console.log(`\n${i + 1}. ${auction.title?.substring(0, 60)}...`);
      console.log(`   Price: $${price?.toLocaleString() || '?'}`);
      console.log(`   Status: ${auction.status || auction.timeRemaining || '?'}`);
      console.log(`   URL: ${auction.url?.substring(0, 60)}...`);
    });
    
    console.log('\n' + '-'.repeat(60));
    console.log('BaT data structure sample:');
    console.log(JSON.stringify(items[0], null, 2).substring(0, 1500) + '...\n');
    
    return items;
  } catch (error) {
    console.error('❌ BaT scraper error:', error.message);
    return null;
  }
}

// ============================================================================
// TEST 3: Reddit car-specific search (for community insights)
// ============================================================================
async function testRedditCarSearch() {
  console.log('='.repeat(60));
  console.log('TEST 3: Reddit Car-Specific Search');
  console.log('='.repeat(60));
  
  try {
    console.log('\nSearching Reddit for "BMW M3 reliability issues"...');
    console.log('This may take 30-60 seconds...\n');
    
    const run = await client.actor('crawlerbros/reddit-scraper').call({
      subreddits: ['cars', 'BMW'],
      searchQuery: 'M3 reliability issues problems',
      maxPosts: 15,
      sort: 'top', // crawlerbros supports: hot, new, top, rising, controversial
      time: 'year',
    });
    
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    console.log(`✅ Retrieved ${items.length} posts about BMW M3 reliability\n`);
    
    // Analyze for insight potential
    const withContent = items.filter(p => p.selftext && p.selftext.length > 100);
    const highEngagement = items.filter(p => (p.score || p.ups || 0) > 10);
    
    console.log('Insight Potential Analysis:');
    console.log(`  Posts with substantive content (>100 chars): ${withContent.length}`);
    console.log(`  High engagement posts (>10 upvotes): ${highEngagement.length}`);
    
    console.log('\nTop posts that could become insights:');
    console.log('-'.repeat(60));
    
    items
      .filter(p => p.selftext && p.selftext.length > 100)
      .slice(0, 3)
      .forEach((post, i) => {
        console.log(`\n${i + 1}. [${post.score || post.ups || '?'}↑] ${post.title}`);
        console.log(`   Subreddit: r/${post.subreddit}`);
        console.log(`   Comments: ${post.num_comments || post.numComments || '?'}`);
        console.log(`   Content preview: ${post.selftext.substring(0, 200).replace(/\n/g, ' ')}...`);
      });
    
    return items;
  } catch (error) {
    console.error('❌ Reddit car search error:', error.message);
    return null;
  }
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('\n🚀 AutoRev Apify Integration Test\n');
  
  const results = {
    reddit: null,
    bat: null,
    redditCarSearch: null,
  };
  
  // Test 1: Basic Reddit
  results.reddit = await testReddit();
  
  // Test 2: BaT
  results.bat = await testBaT();
  
  // Test 3: Reddit car-specific search
  results.redditCarSearch = await testRedditCarSearch();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n  Reddit basic:      ${results.reddit ? '✅ PASS (' + results.reddit.length + ' posts)' : '❌ FAIL'}`);
  console.log(`  BaT auctions:      ${results.bat ? '✅ PASS (' + results.bat.length + ' auctions)' : '❌ FAIL'}`);
  console.log(`  Reddit car search: ${results.redditCarSearch ? '✅ PASS (' + results.redditCarSearch.length + ' posts)' : '❌ FAIL'}`);
  
  const allPassed = results.reddit && results.bat && results.redditCarSearch;
  console.log(`\n  Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}\n`);
  
  if (allPassed) {
    console.log('Next steps:');
    console.log('  1. Run: npm run apify:reddit -- --car=bmw-m3-g80 --name="BMW M3"');
    console.log('  2. Run: npm run apify:bat -- --car=porsche-911-992 --save');
    console.log('  3. Set up a cron job for regular data collection\n');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
