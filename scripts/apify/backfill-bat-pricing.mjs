#!/usr/bin/env node
/**
 * Backfill BaT Market Pricing via Apify
 * 
 * Scrapes completed BaT auctions for cars in our database
 * and updates the car_market_pricing table.
 * 
 * Usage:
 *   node scripts/apify/backfill-bat-pricing.mjs                    # All cars missing BaT data
 *   node scripts/apify/backfill-bat-pricing.mjs --limit=10         # First 10 cars
 *   node scripts/apify/backfill-bat-pricing.mjs --car=bmw-m3-g80   # Single car
 *   node scripts/apify/backfill-bat-pricing.mjs --dry-run          # Preview without saving
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { ApifyClient } from 'apify-client';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

// Parse CLI args
const args = process.argv.slice(2);
const flags = {
  limit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]) || null,
  car: args.find(a => a.startsWith('--car='))?.split('=')[1] || null,
  dryRun: args.includes('--dry-run'),
  help: args.includes('--help') || args.includes('-h'),
};

if (flags.help) {
  console.log(`
Backfill BaT Market Pricing

Usage:
  node scripts/apify/backfill-bat-pricing.mjs [options]

Options:
  --limit=N      Process only N cars
  --car=SLUG     Process single car by slug
  --dry-run      Preview without saving to database
  --help, -h     Show this help
  `);
  process.exit(0);
}

/**
 * Search BaT for completed auctions using Apify
 * 
 * Uses startUrl with BaT's search URL format to get sold auctions.
 * Format: https://bringatrailer.com/?s=search+terms&status=sold
 */
async function searchBaTAuctions(carName, options = {}) {
  const { maxItems = 50 } = options;
  
  // Build BaT search URL for sold auctions
  const searchTerms = encodeURIComponent(carName).replace(/%20/g, '+');
  const searchUrl = `https://bringatrailer.com/?s=${searchTerms}&status=sold`;
  
  console.log(`  [BaT] Searching: ${searchUrl}`);
  
  try {
    const run = await apify.actor('parseforge/bringatrailer-auctions-scraper').call({
      startUrl: searchUrl,
      maxItems,
      proxyConfiguration: { useApifyProxy: true },
    });
    
    const { items } = await apify.dataset(run.defaultDatasetId).listItems();
    return items || [];
  } catch (err) {
    console.error(`  [BaT] Error:`, err.message);
    return [];
  }
}

/**
 * Filter auctions to match a car's year range
 * Uses year from data or extracts from title
 */
function filterByYearRange(auctions, yearStart, yearEnd) {
  if (!yearStart && !yearEnd) return auctions;
  
  return auctions.filter(a => {
    // Try data year first, then extract from title
    let year = a.year;
    if (!year || year === 0) {
      year = extractYearFromTitle(a.title);
    }
    if (!year) return false;
    if (yearStart && year < yearStart) return false;
    if (yearEnd && year > yearEnd) return false;
    return true;
  });
}

/**
 * Calculate market pricing stats from auction results
 */
function calculatePricingStats(auctions) {
  // Only use sold auctions
  const soldAuctions = auctions.filter(a => 
    a.auctionStatus === 'sold' || 
    (a.currentBid && a.reserveMet !== false)
  );
  
  if (soldAuctions.length === 0) {
    return null;
  }
  
  const prices = soldAuctions
    .map(a => a.currentBid || a.soldPrice)
    .filter(p => p && p > 0)
    .sort((a, b) => a - b);
  
  if (prices.length === 0) {
    return null;
  }
  
  const sum = prices.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / prices.length);
  const median = prices.length % 2 === 0
    ? Math.round((prices[prices.length/2 - 1] + prices[prices.length/2]) / 2)
    : prices[Math.floor(prices.length/2)];
  
  // Calculate sell-through rate (sold / total)
  const reserveNotMetCount = auctions.filter(a => a.reserveMet === false).length;
  const sellThrough = auctions.length > 0 
    ? (soldAuctions.length / (soldAuctions.length + reserveNotMetCount))
    : null;
  
  return {
    bat_avg_price: avg,
    bat_median_price: median,
    bat_min_price: Math.min(...prices),
    bat_max_price: Math.max(...prices),
    bat_sample_size: prices.length,
    bat_sell_through_rate: sellThrough ? Math.round(sellThrough * 100) / 100 : null,
    bat_fetched_at: new Date().toISOString(),
  };
}

/**
 * Get or create car_market_pricing record
 */
async function upsertMarketPricing(carId, batStats) {
  // Check if record exists
  const { data: existing } = await supabase
    .from('car_market_pricing')
    .select('id')
    .eq('car_id', carId)
    .single();
  
  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('car_market_pricing')
      .update(batStats)
      .eq('car_id', carId);
    
    return { updated: true, error };
  } else {
    // Insert new
    const { error } = await supabase
      .from('car_market_pricing')
      .insert({ car_id: carId, ...batStats });
    
    return { inserted: true, error };
  }
}

/**
 * Simplify car name for BaT search
 * BaT doesn't use generation codes like "996", "E92", "G80"
 * But we want to KEEP model variants like "GT3", "M3", "STI"
 * 
 * @param {string} name - Full car name (e.g., "Porsche 911 GT3 996")
 * @returns {string} Simplified name for BaT search
 */
function simplifyNameForSearch(name) {
  // Only remove generation codes at the end, keep model names
  // Pattern: only match 3-digit numbers at end that aren't part of model name
  const generationPatterns = [
    /\s+\d{3}(\.\d)?$/,          // "996", "997.2" at end
    /\s+[A-Z]\d{2,3}$/,          // "E92", "F80", "G80" at end
    /\s+[A-Z]{2}\d+$/,           // "VA", "GD" at end
    /\s+(mk\d+|MK\d+)$/i,        // "MK4", "mk7" at end
    /\s+gen\s*\d+$/i,            // "Gen 2" at end
    /\s+(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)\s+generation$/i,
  ];
  
  let simplified = name;
  for (const pattern of generationPatterns) {
    simplified = simplified.replace(pattern, '');
  }
  
  return simplified.trim();
}

/**
 * Extract year from BaT auction title
 * Titles often contain year at the start: "2004 Porsche 911 GT3"
 */
function extractYearFromTitle(title) {
  if (!title) return null;
  const match = title.match(/^(\d{4})\s+/);
  if (match) return parseInt(match[1]);
  // Also try extracting year anywhere in title
  const anyMatch = title.match(/\b(19\d{2}|20\d{2})\b/);
  return anyMatch ? parseInt(anyMatch[1]) : null;
}

/**
 * Parse years string (e.g., "2004-2005") into start/end
 */
function parseYears(yearsStr) {
  if (!yearsStr) return { yearStart: null, yearEnd: null };
  
  const match = yearsStr.match(/(\d{4})\s*-\s*(\d{4}|present)?/i);
  if (match) {
    const yearStart = parseInt(match[1]);
    const yearEnd = match[2]?.toLowerCase() === 'present' 
      ? new Date().getFullYear() 
      : parseInt(match[2]) || yearStart;
    return { yearStart, yearEnd };
  }
  
  // Single year
  const singleYear = yearsStr.match(/(\d{4})/);
  if (singleYear) {
    const year = parseInt(singleYear[1]);
    return { yearStart: year, yearEnd: year };
  }
  
  return { yearStart: null, yearEnd: null };
}

/**
 * Get cars that need BaT pricing data
 */
async function getCarsNeedingBaTData(limit = null) {
  // Get all cars
  let query = supabase
    .from('cars')
    .select('id, slug, name, years')
    .order('name');
  
  const { data: cars } = await query;
  
  // Get cars that already have BaT data
  const { data: withBaT } = await supabase
    .from('car_market_pricing')
    .select('car_id')
    .not('bat_avg_price', 'is', null);
  
  const hasData = new Set(withBaT?.map(r => r.car_id) || []);
  
  // Filter to cars without BaT data and parse years
  let needsData = cars
    .filter(c => !hasData.has(c.id))
    .map(c => {
      const { yearStart, yearEnd } = parseYears(c.years);
      return { ...c, yearStart, yearEnd };
    });
  
  if (limit) {
    needsData = needsData.slice(0, limit);
  }
  
  return needsData;
}

/**
 * Process a single car
 */
async function processCar(car, options = {}) {
  const { dryRun = false } = options;
  
  console.log(`\n📊 Processing: ${car.name} (${car.slug})`);
  console.log(`   Years: ${car.yearStart || '?'} - ${car.yearEnd || '?'}`);
  
  // Build search query - simplify name for BaT (remove generation codes)
  // BaT doesn't use codes like "996", "E92", etc.
  const searchQuery = simplifyNameForSearch(car.name);
  console.log(`   Search query: "${searchQuery}"`);
  
  // Search BaT for sold auctions
  const auctions = await searchBaTAuctions(searchQuery, { maxItems: 50 });
  console.log(`   Found ${auctions.length} auction results`);
  
  if (auctions.length === 0) {
    return { car: car.slug, success: false, reason: 'No auctions found' };
  }
  
  // Filter by year range if specified
  const filtered = filterByYearRange(auctions, car.yearStart, car.yearEnd);
  console.log(`   ${filtered.length} match year range (${car.yearStart}-${car.yearEnd})`);
  
  // Calculate stats
  const stats = calculatePricingStats(filtered);
  
  if (!stats) {
    return { car: car.slug, success: false, reason: 'No sold auctions' };
  }
  
  console.log(`   Stats: avg=$${stats.bat_avg_price?.toLocaleString()}, samples=${stats.bat_sample_size}`);
  
  if (dryRun) {
    console.log('   [DRY RUN] Would save:', JSON.stringify(stats, null, 2));
    return { car: car.slug, success: true, dryRun: true, stats };
  }
  
  // Save to database
  const result = await upsertMarketPricing(car.id, stats);
  
  if (result.error) {
    console.error(`   ❌ Error saving:`, result.error.message);
    return { car: car.slug, success: false, error: result.error.message };
  }
  
  console.log(`   ✅ ${result.updated ? 'Updated' : 'Created'} pricing record`);
  return { car: car.slug, success: true, stats };
}

/**
 * Main
 */
async function main() {
  console.log('🚗 BaT Market Pricing Backfill\n');
  
  if (!process.env.APIFY_API_TOKEN) {
    console.error('❌ APIFY_API_TOKEN not set in .env.local');
    process.exit(1);
  }
  
  let cars = [];
  
  if (flags.car) {
    // Single car mode
    const { data: car, error } = await supabase
      .from('cars')
      .select('id, slug, name, years')
      .eq('slug', flags.car)
      .single();
    
    if (!car || error) {
      console.error(`❌ Car not found: ${flags.car}`);
      if (error) console.error('   Error:', error.message);
      process.exit(1);
    }
    
    const { yearStart, yearEnd } = parseYears(car.years);
    cars = [{ ...car, yearStart, yearEnd }];
  } else {
    // Batch mode - get cars needing data
    cars = await getCarsNeedingBaTData(flags.limit);
    console.log(`Found ${cars.length} cars needing BaT data`);
  }
  
  if (cars.length === 0) {
    console.log('✅ All cars already have BaT pricing data!');
    return;
  }
  
  if (flags.dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be saved\n');
  }
  
  const results = [];
  
  for (const car of cars) {
    const result = await processCar(car, { dryRun: flags.dryRun });
    results.push(result);
    
    // Rate limit: 3s between cars
    if (cars.indexOf(car) < cars.length - 1) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\nFailed cars:');
    failed.forEach(r => console.log(`  - ${r.car}: ${r.reason || r.error}`));
  }
  
  if (successful.length > 0 && !flags.dryRun) {
    console.log('\n🎉 BaT pricing data updated successfully!');
    console.log('   View in: MarketValueSection on car detail pages');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
