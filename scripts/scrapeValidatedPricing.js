#!/usr/bin/env node

/**
 * Validated Pricing Scraper
 * 
 * Scrapes Cars.com with strict validation:
 * 1. Queries each year separately
 * 2. Validates search results match our car
 * 3. Filters outliers (removes top/bottom 10%)
 * 4. Stores year-specific pricing
 * 5. Shows detailed output for verification
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value === undefined ? true : value;
  }
  return acc;
}, {});

const LIMIT = args.limit ? parseInt(args.limit) : 5;
const SKIP = args.skip ? parseInt(args.skip) : 0;
const DELAY = args.delay ? parseInt(args.delay) : 3000;
const DRY_RUN = args['dry-run'] || false;
const VERBOSE = args.verbose || args.v || false;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Import complete mappings from centralized file
import { CARS_COM_MAPPINGS as VERIFIED_MAPPINGS } from './carMappings.js';

/**
 * Parse years from car data
 */
function parseYears(yearsStr) {
  if (!yearsStr) return [];
  
  const match = yearsStr.match(/(\d{4})(?:\s*-\s*(\d{4}))?/);
  if (!match) return [];
  
  const startYear = parseInt(match[1]);
  const endYear = match[2] ? parseInt(match[2]) : startYear;
  
  const years = [];
  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }
  
  return years;
}

/**
 * Filter outliers using IQR method
 */
function filterOutliers(prices) {
  if (prices.length < 4) return prices;
  
  const sorted = [...prices].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return sorted.filter(p => p >= lowerBound && p <= upperBound);
}

/**
 * Scrape Cars.com for a specific car and year
 */
async function scrapeCarsComForYear(car, year, mapping) {
  const url = `https://www.cars.com/shopping/results/?makes[]=${mapping.make}&models[]=${mapping.make}-${mapping.model}&maximum_distance=all&stock_type=all&year_min=${year}&year_max=${year}`;
  
  if (VERBOSE) {
    console.log(`    URL: ${url}`);
  }
  
  try {
    const response = await fetch(url, { headers: HEADERS });
    
    if (!response.ok) {
      return { error: `HTTP ${response.status}` };
    }
    
    const html = await response.text();
    
    // Extract listing titles and prices together for validation
    const listings = [];
    
    // Look for vehicle cards with titles and prices
    // Cars.com structure: title contains the car name, price in primary-price
    const titleMatches = [...html.matchAll(/class="[^"]*title[^"]*"[^>]*>([^<]+)</gi)];
    const priceMatches = [...html.matchAll(/primary-price[^>]*>\s*\$(\d{1,3}(?:,\d{3})*)/gi)];
    
    // Get titles for validation
    const titles = titleMatches
      .map(m => m[1].toLowerCase().trim())
      .filter(t => t.length > 5);
    
    // Get prices
    const allPrices = priceMatches
      .map(m => parseInt(m[1].replace(/,/g, '')))
      .filter(p => p >= 10000 && p <= 500000); // Reasonable range
    
    if (allPrices.length === 0) {
      return { error: 'No listings found', listingCount: 0 };
    }
    
    // Validate that listings match our car
    // Check if any titles contain our search terms
    const searchTerms = mapping.searchTerms || [];
    const excludeTerms = mapping.excludeTerms || [];
    
    let validatedPrices = allPrices;
    
    if (searchTerms.length > 0 && titles.length > 0) {
      // Count how many titles match our criteria
      const matchingTitles = titles.filter(title => {
        const hasSearchTerm = searchTerms.some(term => title.includes(term.toLowerCase()));
        const hasExcludeTerm = excludeTerms.some(term => title.includes(term.toLowerCase()));
        return hasSearchTerm && !hasExcludeTerm;
      });
      
      const matchRate = matchingTitles.length / titles.length;
      
      if (VERBOSE) {
        console.log(`    Titles found: ${titles.length}, Matching: ${matchingTitles.length} (${Math.round(matchRate * 100)}%)`);
      }
      
      // If less than 50% of listings match, the search might be too broad
      if (matchRate < 0.3) {
        return { 
          error: `Low match rate (${Math.round(matchRate * 100)}%)`, 
          warning: true,
          sampleTitles: titles.slice(0, 3),
        };
      }
    }
    
    // Filter outliers
    const filteredPrices = filterOutliers(validatedPrices);
    
    if (filteredPrices.length === 0) {
      return { error: 'All prices filtered as outliers' };
    }
    
    // Calculate statistics
    const avg = Math.round(filteredPrices.reduce((a, b) => a + b, 0) / filteredPrices.length);
    const sorted = filteredPrices.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    
    return {
      year,
      avgPrice: avg,
      medianPrice: median,
      minPrice: min,
      maxPrice: max,
      listingCount: filteredPrices.length,
      rawCount: allPrices.length,
      outliersRemoved: allPrices.length - filteredPrices.length,
    };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Save year-specific pricing to database
 */
async function saveYearPricing(carSlug, yearData) {
  if (DRY_RUN) {
    console.log(`    [DRY RUN] Would save: ${yearData.year} - $${yearData.medianPrice.toLocaleString()}`);
    return true;
  }
  
  try {
    // Save to car_price_history for year-specific data
    const { error: historyError } = await supabase
      .from('car_price_history')
      .upsert({
        car_slug: carSlug,
        source: 'carscom',
        price: yearData.medianPrice, // Use median as it's more stable
        recorded_at: new Date().toISOString().split('T')[0],
      }, { 
        onConflict: 'car_slug,source,recorded_at' 
      });
    
    if (historyError) {
      console.log(`    Error saving history: ${historyError.message}`);
    }
    
    return !historyError;
  } catch (err) {
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

/**
 * Save aggregated pricing to car_market_pricing
 */
async function saveAggregatedPricing(carSlug, yearResults) {
  if (DRY_RUN) return true;
  
  const validResults = yearResults.filter(r => r.avgPrice);
  if (validResults.length === 0) return false;
  
  // Calculate overall stats from year data
  const allPrices = validResults.flatMap(r => [r.minPrice, r.maxPrice]);
  const avgPrice = Math.round(validResults.reduce((sum, r) => sum + r.avgPrice, 0) / validResults.length);
  const medianPrice = Math.round(validResults.reduce((sum, r) => sum + r.medianPrice, 0) / validResults.length);
  const totalListings = validResults.reduce((sum, r) => sum + r.listingCount, 0);
  
  const data = {
    car_slug: carSlug,
    carscom_avg_price: avgPrice,
    carscom_median_price: medianPrice,
    carscom_min_price: Math.min(...allPrices),
    carscom_max_price: Math.max(...allPrices),
    carscom_listing_count: totalListings,
    carscom_fetched_at: new Date().toISOString(),
  };
  
  try {
    const { data: existing } = await supabase
      .from('car_market_pricing')
      .select('id')
      .eq('car_slug', carSlug)
      .single();
    
    if (existing) {
      await supabase.from('car_market_pricing').update(data).eq('car_slug', carSlug);
    } else {
      await supabase.from('car_market_pricing').insert(data);
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Main
 */
async function main() {
  console.log('='.repeat(80));
  console.log('Validated Pricing Scraper');
  console.log('='.repeat(80));
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no saves)' : 'LIVE'}`);
  console.log(`Limit: ${LIMIT}, Skip: ${SKIP}, Delay: ${DELAY}ms`);
  console.log(`Verbose: ${VERBOSE}`);
  console.log('='.repeat(80));
  
  // Get cars that have verified mappings
  const { data: cars, error } = await supabase
    .from('cars')
    .select('slug, name, brand, years')
    .order('name');
  
  if (error || !cars) {
    console.error('Error fetching cars:', error?.message);
    process.exit(1);
  }
  
  // Filter to only cars with verified mappings
  const carsWithMappings = cars.filter(car => VERIFIED_MAPPINGS[car.name]);
  
  console.log(`\nTotal cars: ${cars.length}`);
  console.log(`Cars with verified mappings: ${carsWithMappings.length}`);
  console.log(`Processing: ${Math.min(LIMIT, carsWithMappings.length)} cars (skip ${SKIP})\n`);
  
  const carsToProcess = carsWithMappings.slice(SKIP, SKIP + LIMIT);
  
  let totalSuccess = 0;
  let totalFailed = 0;
  
  for (let i = 0; i < carsToProcess.length; i++) {
    const car = carsToProcess[i];
    const mapping = VERIFIED_MAPPINGS[car.name];
    const years = parseYears(car.years);
    
    console.log(`\n[${i + 1}/${carsToProcess.length}] ${car.name}`);
    console.log(`  Years: ${car.years} → [${years.join(', ')}]`);
    console.log(`  Mapping: ${mapping.make}/${mapping.model}`);
    console.log(`  Search terms: ${mapping.searchTerms?.join(', ') || 'none'}`);
    console.log(`  Exclude terms: ${mapping.excludeTerms?.join(', ') || 'none'}`);
    
    const yearResults = [];
    
    for (const year of years) {
      console.log(`  ${year}:`);
      
      const result = await scrapeCarsComForYear(car, year, mapping);
      
      if (result.error) {
        console.log(`    ❌ ${result.error}`);
        if (result.sampleTitles) {
          console.log(`    Sample titles: ${result.sampleTitles.slice(0, 2).join(', ')}`);
        }
      } else {
        console.log(`    ✅ Median: $${result.medianPrice.toLocaleString()} | Range: $${result.minPrice.toLocaleString()}-$${result.maxPrice.toLocaleString()} | ${result.listingCount} listings`);
        yearResults.push(result);
        await saveYearPricing(car.slug, result);
      }
      
      await sleep(DELAY);
    }
    
    // Save aggregated data
    if (yearResults.length > 0) {
      await saveAggregatedPricing(car.slug, yearResults);
      totalSuccess++;
      
      // Show summary
      const avgMedian = Math.round(yearResults.reduce((s, r) => s + r.medianPrice, 0) / yearResults.length);
      console.log(`  Summary: $${avgMedian.toLocaleString()} avg median across ${yearResults.length} years`);
    } else {
      totalFailed++;
      console.log(`  ⚠️  No valid pricing data found`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`Results: ${totalSuccess} success, ${totalFailed} failed`);
  console.log('='.repeat(80));
}

main().catch(console.error);

