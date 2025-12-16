#!/usr/bin/env node

/**
 * Test Scrapers
 * 
 * Tests all scrapers against a single car to verify they work.
 * This helps identify which sources are accessible before batch processing.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Test car - using a popular car that should have data everywhere
const TEST_CAR = {
  name: 'BMW M3',
  slug: 'bmw-m3-f80',
  brand: 'BMW',
  model: 'M3',
  years: '2015-2018',
  year: 2017,
};

// Parse arguments
const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose') || args.includes('-v');

function log(msg) {
  console.log(msg);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// IIHS Scraper Test
// ============================================================================

async function testIIHS() {
  log('\n📋 Testing IIHS Scraper...');
  
  try {
    const searchUrl = `https://www.iihs.org/ratings/vehicle/${TEST_CAR.brand.toLowerCase()}/${TEST_CAR.model.toLowerCase()}/${TEST_CAR.year}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    if (!response.ok) {
      // Try alternative URL format
      const altUrl = `https://www.iihs.org/ratings/vehicle/bmw/3-series/${TEST_CAR.year}`;
      const altResponse = await fetch(altUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });
      
      if (altResponse.ok) {
        const html = await altResponse.text();
        const hasRatings = html.includes('rating') || html.includes('Good') || html.includes('Acceptable');
        return {
          success: true,
          source: 'IIHS',
          status: altResponse.status,
          note: hasRatings ? 'Found ratings page' : 'Page loaded but no ratings found',
          dataFound: hasRatings,
        };
      }
    }
    
    const html = await response.text();
    const hasRatings = html.includes('rating') || html.includes('Good') || html.includes('Acceptable');
    
    return {
      success: response.ok,
      source: 'IIHS',
      status: response.status,
      note: hasRatings ? 'Found ratings data' : 'Page loaded but no ratings',
      dataFound: hasRatings,
    };
  } catch (err) {
    return { success: false, source: 'IIHS', error: err.message };
  }
}

// ============================================================================
// Bring a Trailer Test
// ============================================================================

async function testBringATrailer() {
  log('\n🏎️  Testing Bring a Trailer Scraper...');
  
  try {
    const searchQuery = `${TEST_CAR.brand} ${TEST_CAR.model}`;
    const searchUrl = `https://bringatrailer.com/search/?s=${encodeURIComponent(searchQuery)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    
    const html = await response.text();
    
    // Check for auction listings
    const hasListings = html.includes('listing-card') || 
                        html.includes('auction-item') ||
                        html.includes('search-result');
    
    // Check for sold prices
    const hasPrices = html.includes('$') && (html.includes('Sold') || html.includes('sold'));
    
    // Check for anti-bot
    const isBlocked = html.includes('captcha') || 
                      html.includes('blocked') ||
                      html.includes('Access Denied') ||
                      response.status === 403;
    
    if (isBlocked) {
      return {
        success: false,
        source: 'Bring a Trailer',
        status: response.status,
        note: '🚫 Blocked - CAPTCHA or access denied',
        dataFound: false,
      };
    }
    
    return {
      success: response.ok,
      source: 'Bring a Trailer',
      status: response.status,
      note: hasListings ? (hasPrices ? 'Found listings with prices' : 'Found listings') : 'No listings found',
      dataFound: hasListings,
    };
  } catch (err) {
    return { success: false, source: 'Bring a Trailer', error: err.message };
  }
}

// ============================================================================
// Cars.com Test
// ============================================================================

async function testCarsCom() {
  log('\n🚗 Testing Cars.com Scraper...');
  
  try {
    const searchUrl = `https://www.cars.com/shopping/results/?makes[]=${TEST_CAR.brand.toLowerCase()}&models[]=${TEST_CAR.brand.toLowerCase()}-${TEST_CAR.model.toLowerCase()}&maximum_distance=all&stock_type=all`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    const html = await response.text();
    
    // Check for listings
    const hasListings = html.includes('vehicle-card') || 
                        html.includes('listing-row') ||
                        html.includes('srp-list-item');
    
    // Check for prices
    const priceMatch = html.match(/\$[\d,]+/g);
    const hasPrices = priceMatch && priceMatch.length > 0;
    
    // Check for blocking
    const isBlocked = html.includes('captcha') || 
                      html.includes('blocked') ||
                      response.status === 403;
    
    if (isBlocked) {
      return {
        success: false,
        source: 'Cars.com',
        status: response.status,
        note: '🚫 Blocked',
        dataFound: false,
      };
    }
    
    return {
      success: response.ok,
      source: 'Cars.com',
      status: response.status,
      note: hasListings ? `Found listings (${priceMatch?.length || 0} prices detected)` : 'No listings found',
      dataFound: hasListings && hasPrices,
    };
  } catch (err) {
    return { success: false, source: 'Cars.com', error: err.message };
  }
}

// ============================================================================
// Hagerty Test
// ============================================================================

async function testHagerty() {
  log('\n💰 Testing Hagerty Valuation Scraper...');
  
  try {
    // Hagerty's valuation tool uses a different URL structure
    const searchUrl = `https://www.hagerty.com/marketplace/search?searchQuery=${encodeURIComponent(TEST_CAR.brand + ' ' + TEST_CAR.model)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    const html = await response.text();
    
    // Hagerty has a valuation tool that requires specific vehicle lookup
    const hasValuation = html.includes('valuation') || 
                         html.includes('price-guide') ||
                         html.includes('condition');
    
    const isBlocked = html.includes('captcha') || response.status === 403;
    
    if (isBlocked) {
      return {
        success: false,
        source: 'Hagerty',
        status: response.status,
        note: '🚫 Blocked',
        dataFound: false,
      };
    }
    
    return {
      success: response.ok,
      source: 'Hagerty',
      status: response.status,
      note: hasValuation ? 'Valuation data accessible' : 'Page loaded (may need specific vehicle lookup)',
      dataFound: hasValuation,
    };
  } catch (err) {
    return { success: false, source: 'Hagerty', error: err.message };
  }
}

// ============================================================================
// Car and Driver Test
// ============================================================================

async function testCarAndDriver() {
  log('\n📰 Testing Car and Driver Scraper...');
  
  try {
    const searchUrl = `https://www.caranddriver.com/search/?q=${encodeURIComponent(TEST_CAR.brand + ' ' + TEST_CAR.model + ' review')}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    const html = await response.text();
    
    // Check for review content
    const hasReviews = html.includes('review') || 
                       html.includes('article') ||
                       html.includes('search-result');
    
    // Check for ratings/scores
    const hasRatings = html.includes('rating') || html.includes('score');
    
    const isBlocked = html.includes('captcha') || 
                      html.includes('Access Denied') ||
                      response.status === 403;
    
    if (isBlocked) {
      return {
        success: false,
        source: 'Car and Driver',
        status: response.status,
        note: '🚫 Blocked',
        dataFound: false,
      };
    }
    
    return {
      success: response.ok,
      source: 'Car and Driver',
      status: response.status,
      note: hasReviews ? 'Found search results' : 'No results found',
      dataFound: hasReviews,
    };
  } catch (err) {
    return { success: false, source: 'Car and Driver', error: err.message };
  }
}

// ============================================================================
// MotorTrend Test
// ============================================================================

async function testMotorTrend() {
  log('\n📰 Testing MotorTrend Scraper...');
  
  try {
    const searchUrl = `https://www.motortrend.com/search/?q=${encodeURIComponent(TEST_CAR.brand + ' ' + TEST_CAR.model)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    const html = await response.text();
    
    const hasContent = html.includes('search') || 
                       html.includes('article') ||
                       html.includes('result');
    
    const isBlocked = html.includes('captcha') || response.status === 403;
    
    if (isBlocked) {
      return {
        success: false,
        source: 'MotorTrend',
        status: response.status,
        note: '🚫 Blocked',
        dataFound: false,
      };
    }
    
    return {
      success: response.ok,
      source: 'MotorTrend',
      status: response.status,
      note: hasContent ? 'Found content' : 'Page loaded',
      dataFound: hasContent,
    };
  } catch (err) {
    return { success: false, source: 'MotorTrend', error: err.message };
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('Scraper Test Suite');
  console.log('='.repeat(60));
  console.log(`Test Car: ${TEST_CAR.name} (${TEST_CAR.years})`);
  console.log('='.repeat(60));
  
  const results = [];
  
  // Test each scraper with delays between
  results.push(await testIIHS());
  await sleep(1000);
  
  results.push(await testBringATrailer());
  await sleep(1000);
  
  results.push(await testCarsCom());
  await sleep(1000);
  
  results.push(await testHagerty());
  await sleep(1000);
  
  results.push(await testCarAndDriver());
  await sleep(1000);
  
  results.push(await testMotorTrend());
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Results Summary');
  console.log('='.repeat(60));
  
  const working = [];
  const blocked = [];
  const partial = [];
  
  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    const dataStatus = result.dataFound ? '📊' : '⚠️';
    
    console.log(`${status} ${result.source.padEnd(20)} ${dataStatus} ${result.note || result.error || ''}`);
    
    if (result.success && result.dataFound) {
      working.push(result.source);
    } else if (result.success && !result.dataFound) {
      partial.push(result.source);
    } else {
      blocked.push(result.source);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Recommendations');
  console.log('='.repeat(60));
  
  if (working.length > 0) {
    console.log(`\n✅ WORKING (${working.length}): ${working.join(', ')}`);
    console.log('   → Safe to scrape with standard rate limiting');
  }
  
  if (partial.length > 0) {
    console.log(`\n⚠️  PARTIAL (${partial.length}): ${partial.join(', ')}`);
    console.log('   → May need adjusted selectors or different URLs');
  }
  
  if (blocked.length > 0) {
    console.log(`\n❌ BLOCKED (${blocked.length}): ${blocked.join(', ')}`);
    console.log('   → Need stealth mode or browser automation');
  }
  
  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);


