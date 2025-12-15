#!/usr/bin/env node

/**
 * Test Bring a Trailer with Stealth Techniques
 * 
 * BaT is better for enthusiast cars because it shows ACTUAL SOLD prices,
 * not just asking prices like Cars.com.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Rotate through different User Agents
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Test different approaches to access BaT
 */
async function testBaT() {
  console.log('='.repeat(70));
  console.log('Bring a Trailer Stealth Test');
  console.log('='.repeat(70));
  
  const testCar = 'Porsche 718 Cayman GT4';
  const searchQuery = encodeURIComponent('porsche 718 cayman gt4');
  
  // Test 1: Direct search page
  console.log('\n📋 Test 1: Direct Search Page');
  console.log('-'.repeat(50));
  
  const searchUrl = `https://bringatrailer.com/search/?s=${searchQuery}`;
  console.log(`URL: ${searchUrl}`);
  
  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
      },
    });
    
    console.log(`Status: ${response.status}`);
    
    const html = await response.text();
    console.log(`HTML Length: ${html.length}`);
    
    // Check for blocking indicators
    const isBlocked = html.includes('captcha') || 
                      html.includes('blocked') ||
                      html.includes('Access Denied') ||
                      html.includes('Please verify') ||
                      response.status === 403;
    
    if (isBlocked) {
      console.log('❌ BLOCKED - Captcha or access denied detected');
    } else {
      console.log('✅ Page loaded');
      
      // Look for auction listings
      const hasAuctions = html.includes('listing-card') || 
                          html.includes('auction') ||
                          html.includes('sold for') ||
                          html.includes('Sold');
      
      console.log(`Has auction content: ${hasAuctions ? 'Yes' : 'No'}`);
      
      // Try to extract sold prices
      const soldMatches = [...html.matchAll(/sold\s+for\s+\$?([\d,]+)/gi)];
      console.log(`Sold prices found: ${soldMatches.length}`);
      
      if (soldMatches.length > 0) {
        const prices = soldMatches.map(m => parseInt(m[1].replace(/,/g, '')));
        console.log(`Sample prices: ${prices.slice(0, 5).map(p => '$' + p.toLocaleString()).join(', ')}`);
      }
      
      // Look for JSON-LD data
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      if (jsonLdMatch) {
        console.log('Found JSON-LD structured data');
      }
    }
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
  
  await sleep(2000);
  
  // Test 2: BaT's auction results API (if they have one)
  console.log('\n📋 Test 2: Completed Auctions Filter');
  console.log('-'.repeat(50));
  
  const completedUrl = `https://bringatrailer.com/porsche/718-cayman-gt4/`;
  console.log(`URL: ${completedUrl}`);
  
  try {
    const response = await fetch(completedUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
      },
    });
    
    console.log(`Status: ${response.status}`);
    
    const html = await response.text();
    console.log(`HTML Length: ${html.length}`);
    
    const isBlocked = html.includes('captcha') || response.status === 403;
    
    if (isBlocked) {
      console.log('❌ BLOCKED');
    } else {
      console.log('✅ Page loaded');
      
      // Extract sold prices from auction results
      // BaT format: "Sold for $XXX,XXX" or "Bid to $XXX,XXX"
      const soldMatches = [...html.matchAll(/sold\s+for\s+\$?([\d,]+)/gi)];
      const bidMatches = [...html.matchAll(/bid\s+to\s+\$?([\d,]+)/gi)];
      
      console.log(`"Sold for" prices: ${soldMatches.length}`);
      console.log(`"Bid to" prices: ${bidMatches.length}`);
      
      if (soldMatches.length > 0) {
        const prices = soldMatches.map(m => parseInt(m[1].replace(/,/g, '')));
        console.log(`Sold prices: ${prices.slice(0, 8).map(p => '$' + p.toLocaleString()).join(', ')}`);
        
        // Calculate stats
        if (prices.length >= 3) {
          const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
          const sorted = prices.sort((a, b) => a - b);
          const median = sorted[Math.floor(sorted.length / 2)];
          console.log(`\nStats (${prices.length} sales):`);
          console.log(`  Average: $${avg.toLocaleString()}`);
          console.log(`  Median:  $${median.toLocaleString()}`);
          console.log(`  Range:   $${sorted[0].toLocaleString()} - $${sorted[sorted.length-1].toLocaleString()}`);
        }
      }
      
      // Look for year/mileage context
      const yearMileageMatches = [...html.matchAll(/(\d{4})\s+.*?(\d{1,3},?\d{3})\s*miles/gi)];
      if (yearMileageMatches.length > 0) {
        console.log(`\nYear/Mileage samples:`);
        yearMileageMatches.slice(0, 5).forEach(m => {
          console.log(`  ${m[1]} - ${m[2]} miles`);
        });
      }
    }
  } catch (err) {
    console.log(`Error: ${err.message}`);
  }
  
  await sleep(2000);
  
  // Test 3: Try the API endpoint
  console.log('\n📋 Test 3: API Endpoint (if available)');
  console.log('-'.repeat(50));
  
  // BaT might have an internal API for search results
  const apiUrl = `https://bringatrailer.com/wp-json/bat/v1/search?q=${searchQuery}`;
  console.log(`URL: ${apiUrl}`);
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'application/json',
      },
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API accessible');
      console.log(`Response type: ${typeof data}`);
      if (Array.isArray(data)) {
        console.log(`Items: ${data.length}`);
      }
    } else {
      console.log('❌ API not accessible or not found');
    }
  } catch (err) {
    console.log(`Not a JSON API or error: ${err.message}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('Test Complete');
  console.log('='.repeat(70));
}

testBaT().catch(console.error);

