#!/usr/bin/env node

/**
 * Scrape Working Sources
 * 
 * Scrapes data from sources that passed the test:
 * - IIHS (safety ratings)
 * - Cars.com (market pricing)
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

// Parse args
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value === undefined ? true : value;
  }
  return acc;
}, {});

const LIMIT = args.limit ? parseInt(args.limit) : 10;
const SKIP = args.skip ? parseInt(args.skip) : 0;
const DELAY = args.delay ? parseInt(args.delay) : 2000;
const SOURCE = args.source || 'all'; // 'iihs', 'carscom', 'all'

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
};

// ============================================================================
// Cars.com Scraper
// ============================================================================

async function scrapeCarsComForCar(car) {
  const make = car.brand?.toLowerCase() || car.name.split(' ')[0].toLowerCase();
  const modelParts = car.name.split(' ').slice(1);
  const model = modelParts.join('-').toLowerCase()
    .replace(/[()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-');
  
  // Get year range
  const yearMatch = car.years?.match(/(\d{4})/g);
  const startYear = yearMatch ? parseInt(yearMatch[0]) : 2015;
  const endYear = yearMatch && yearMatch[1] ? parseInt(yearMatch[1]) : startYear + 5;
  
  try {
    const searchUrl = `https://www.cars.com/shopping/results/?makes[]=${make}&models[]=${make}-${model}&list_price_max=&maximum_distance=all&stock_type=all&year_min=${startYear}&year_max=${endYear}`;
    
    const response = await fetch(searchUrl, { headers: HEADERS });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    
    // Extract prices from the primary-price class (actual listing prices)
    // This avoids capturing fees, deposits, and other junk prices
    const prices = [];
    const priceMatches = html.matchAll(/primary-price[^>]*>\s*\$(\d{1,3}(?:,\d{3})*)/gi);
    
    for (const match of priceMatches) {
      const price = parseInt(match[1].replace(/,/g, ''));
      // Filter reasonable car prices (actual vehicles, not fees)
      if (price >= 10000 && price <= 1000000) {
        prices.push(price);
      }
    }
    
    if (prices.length === 0) {
      return null;
    }
    
    // Calculate stats
    const sortedPrices = prices.sort((a, b) => a - b);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
    const minPrice = sortedPrices[0];
    const maxPrice = sortedPrices[sortedPrices.length - 1];
    
    return {
      carscom_avg_price: avgPrice,
      carscom_median_price: medianPrice,
      carscom_min_price: minPrice,
      carscom_max_price: maxPrice,
      carscom_listing_count: prices.length,
      carscom_fetched_at: new Date().toISOString(),
    };
  } catch (err) {
    return null;
  }
}

// ============================================================================
// IIHS Scraper
// ============================================================================

async function scrapeIIHSForCar(car) {
  const make = car.brand?.toLowerCase() || car.name.split(' ')[0].toLowerCase();
  
  // Get representative year
  const yearMatch = car.years?.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : 2018;
  
  // IIHS model name mapping
  const modelMappings = {
    'm3': '3-series',
    'm4': '4-series',
    'm5': '5-series',
    'm2': '2-series',
    'corvette': 'corvette',
    'mustang': 'mustang',
    'camaro': 'camaro',
    'challenger': 'challenger',
    'charger': 'charger',
    'civic type r': 'civic',
    'golf r': 'golf',
    'golf gti': 'gti',
    'wrx': 'wrx',
    'brz': 'brz',
    '86': '86',
    'gr86': '86',
    'mx-5': 'mx-5',
    'miata': 'mx-5',
    '350z': '350z',
    '370z': '370z',
    'gt-r': 'gt-r',
    'supra': 'supra',
    'cayman': '718',
    '911': '911',
  };
  
  // Find model mapping
  const carNameLower = car.name.toLowerCase();
  let model = null;
  
  for (const [key, value] of Object.entries(modelMappings)) {
    if (carNameLower.includes(key)) {
      model = value;
      break;
    }
  }
  
  if (!model) {
    // Try to extract model from name
    model = car.name.split(' ').slice(1).join('-').toLowerCase()
      .replace(/[()]/g, '').replace(/\s+/g, '-');
  }
  
  try {
    const searchUrl = `https://www.iihs.org/ratings/vehicle/${make}/${model}/${year}`;
    
    const response = await fetch(searchUrl, { 
      headers: HEADERS,
      redirect: 'follow',
    });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    
    // Check for Top Safety Pick
    const isTopSafetyPickPlus = html.includes('TOP SAFETY PICK+') || html.includes('Top Safety Pick+');
    const isTopSafetyPick = !isTopSafetyPickPlus && (html.includes('TOP SAFETY PICK') || html.includes('Top Safety Pick'));
    
    // Try to extract ratings
    const ratings = {};
    
    // Look for rating patterns
    const ratingPatterns = [
      { key: 'iihs_small_overlap_front', pattern: /small overlap front[^<]*<[^>]*>([^<]*Good|Acceptable|Marginal|Poor)/i },
      { key: 'iihs_moderate_overlap_front', pattern: /moderate overlap front[^<]*<[^>]*>([^<]*Good|Acceptable|Marginal|Poor)/i },
      { key: 'iihs_side', pattern: /side[^<]*<[^>]*>([^<]*Good|Acceptable|Marginal|Poor)/i },
      { key: 'iihs_roof_strength', pattern: /roof strength[^<]*<[^>]*>([^<]*Good|Acceptable|Marginal|Poor)/i },
    ];
    
    for (const { key, pattern } of ratingPatterns) {
      const match = html.match(pattern);
      if (match) {
        ratings[key] = match[1].trim();
      }
    }
    
    // If we found any ratings or safety pick status, return data
    if (isTopSafetyPick || isTopSafetyPickPlus || Object.keys(ratings).length > 0) {
      return {
        iihs_top_safety_pick: isTopSafetyPick,
        iihs_top_safety_pick_plus: isTopSafetyPickPlus,
        iihs_fetched_at: new Date().toISOString(),
        ...ratings,
      };
    }
    
    return null;
  } catch (err) {
    return null;
  }
}

// ============================================================================
// Save Functions
// ============================================================================

async function saveCarsComData(carSlug, data) {
  if (!data) return false;
  
  try {
    // Check if record exists
    const { data: existing } = await supabase
      .from('car_market_pricing')
      .select('id')
      .eq('car_slug', carSlug)
      .single();
    
    if (existing) {
      // Update
      const { error } = await supabase
        .from('car_market_pricing')
        .update(data)
        .eq('car_slug', carSlug);
      return !error;
    } else {
      // Insert
      const { error } = await supabase
        .from('car_market_pricing')
        .insert({ car_slug: carSlug, ...data });
      return !error;
    }
  } catch {
    return false;
  }
}

async function saveIIHSData(carSlug, data) {
  if (!data) return false;
  
  try {
    const { error } = await supabase
      .from('car_safety_data')
      .update(data)
      .eq('car_slug', carSlug);
    
    return !error;
  } catch {
    return false;
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log('Scraping Working Sources');
  console.log('='.repeat(60));
  console.log(`Source: ${SOURCE}`);
  console.log(`Limit: ${LIMIT}, Skip: ${SKIP}, Delay: ${DELAY}ms`);
  console.log('='.repeat(60));
  
  // Fetch cars
  const { data: cars, error } = await supabase
    .from('cars')
    .select('slug, name, brand, years')
    .order('name')
    .range(SKIP, SKIP + LIMIT - 1);
  
  if (error || !cars) {
    console.error('Error fetching cars:', error?.message);
    process.exit(1);
  }
  
  console.log(`\nProcessing ${cars.length} cars...\n`);
  
  let carscomSuccess = 0;
  let iihsSuccess = 0;
  
  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    
    process.stdout.write(`[${i + 1}/${cars.length}] ${car.name.padEnd(35)}`);
    
    // Cars.com
    if (SOURCE === 'all' || SOURCE === 'carscom') {
      const carscomData = await scrapeCarsComForCar(car);
      const saved = await saveCarsComData(car.slug, carscomData);
      
      if (saved && carscomData) {
        carscomSuccess++;
        process.stdout.write(` Cars.com:✅ $${carscomData.carscom_avg_price?.toLocaleString()}`);
      } else {
        process.stdout.write(' Cars.com:❌');
      }
      
      await sleep(DELAY / 2);
    }
    
    // IIHS
    if (SOURCE === 'all' || SOURCE === 'iihs') {
      const iihsData = await scrapeIIHSForCar(car);
      const saved = await saveIIHSData(car.slug, iihsData);
      
      if (saved && iihsData) {
        iihsSuccess++;
        const badge = iihsData.iihs_top_safety_pick_plus ? ' TSP+' : 
                      iihsData.iihs_top_safety_pick ? ' TSP' : '';
        process.stdout.write(` IIHS:✅${badge}`);
      } else {
        process.stdout.write(' IIHS:❌');
      }
      
      await sleep(DELAY / 2);
    }
    
    console.log('');
    
    // Delay between cars
    if (i < cars.length - 1) {
      await sleep(DELAY);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  
  if (SOURCE === 'all' || SOURCE === 'carscom') {
    console.log(`Cars.com: ${carscomSuccess}/${cars.length} cars with pricing data`);
  }
  if (SOURCE === 'all' || SOURCE === 'iihs') {
    console.log(`IIHS:     ${iihsSuccess}/${cars.length} cars with safety ratings`);
  }
  
  console.log('='.repeat(60));
}

main().catch(console.error);














