#!/usr/bin/env node

/**
 * Scrape Working Sources v2 - Improved
 * 
 * Better URL generation and data extraction for Cars.com
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

const LIMIT = args.limit ? parseInt(args.limit) : 20;
const SKIP = args.skip ? parseInt(args.skip) : 0;
const DELAY = args.delay ? parseInt(args.delay) : 3000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

// Cars.com model slug mapping for better search accuracy
const CARSCOM_MODELS = {
  // Porsche
  '718 Cayman GT4': { make: 'porsche', model: '718_cayman', trim: 'gt4' },
  '718 Cayman GTS 4.0': { make: 'porsche', model: '718_cayman', trim: 'gts' },
  '981 Cayman GTS': { make: 'porsche', model: 'cayman', trim: 'gts' },
  '981 Cayman S': { make: 'porsche', model: 'cayman', trim: 's' },
  '987.2 Cayman S': { make: 'porsche', model: 'cayman', trim: 's' },
  '991.1 Carrera S': { make: 'porsche', model: '911', trim: 'carrera_s' },
  '997.2 Carrera S': { make: 'porsche', model: '911', trim: 'carrera_s' },
  'Porsche 911 GT3 996': { make: 'porsche', model: '911', trim: 'gt3' },
  'Porsche 911 GT3 997': { make: 'porsche', model: '911', trim: 'gt3' },
  'Porsche 911 Turbo 997.1': { make: 'porsche', model: '911', trim: 'turbo' },
  'Porsche 911 Turbo 997.2': { make: 'porsche', model: '911', trim: 'turbo' },
  
  // BMW
  'BMW M2 Competition': { make: 'bmw', model: 'm2' },
  'BMW M3 E46': { make: 'bmw', model: 'm3' },
  'BMW M3 E92': { make: 'bmw', model: 'm3' },
  'BMW M3 F80': { make: 'bmw', model: 'm3' },
  'BMW M4 F82': { make: 'bmw', model: 'm4' },
  'BMW M5 E39': { make: 'bmw', model: 'm5' },
  'BMW M5 E60': { make: 'bmw', model: 'm5' },
  'BMW M5 F10 Competition': { make: 'bmw', model: 'm5' },
  'BMW M5 F90 Competition': { make: 'bmw', model: 'm5' },
  'BMW 1 Series M Coupe': { make: 'bmw', model: '1_series_m' },
  'BMW Z4 M Coupe/Roadster': { make: 'bmw', model: 'z4_m' },
  
  // Corvette
  'C7 Corvette Grand Sport': { make: 'chevrolet', model: 'corvette', trim: 'grand_sport' },
  'C7 Corvette Z06': { make: 'chevrolet', model: 'corvette', trim: 'z06' },
  'C8 Corvette Stingray': { make: 'chevrolet', model: 'corvette_stingray' },
  'Chevrolet Corvette C5 Z06': { make: 'chevrolet', model: 'corvette', trim: 'z06' },
  'Chevrolet Corvette C6 Grand Sport': { make: 'chevrolet', model: 'corvette', trim: 'grand_sport' },
  'Chevrolet Corvette C6 Z06': { make: 'chevrolet', model: 'corvette', trim: 'z06' },
  
  // Muscle
  'Camaro SS 1LE': { make: 'chevrolet', model: 'camaro', trim: 'ss' },
  'Camaro ZL1': { make: 'chevrolet', model: 'camaro', trim: 'zl1' },
  'Mustang GT PP2': { make: 'ford', model: 'mustang', trim: 'gt' },
  'Shelby GT350': { make: 'ford', model: 'mustang_shelby_gt350' },
  'Shelby GT500': { make: 'ford', model: 'mustang_shelby_gt500' },
  'Ford Mustang Boss 302': { make: 'ford', model: 'mustang', trim: 'boss_302' },
  
  // Dodge
  'Dodge Challenger Hellcat': { make: 'dodge', model: 'challenger', trim: 'srt_hellcat' },
  'Dodge Challenger SRT 392': { make: 'dodge', model: 'challenger', trim: 'srt_392' },
  'Dodge Charger Hellcat': { make: 'dodge', model: 'charger', trim: 'srt_hellcat' },
  'Dodge Charger SRT 392': { make: 'dodge', model: 'charger', trim: 'srt_392' },
  'Dodge Viper': { make: 'dodge', model: 'viper' },
  
  // Japanese
  'Honda Civic Type R FK8': { make: 'honda', model: 'civic_type_r' },
  'Honda Civic Type R FL5': { make: 'honda', model: 'civic_type_r' },
  'Honda S2000': { make: 'honda', model: 's2000' },
  'Mazda MX-5 Miata NA': { make: 'mazda', model: 'mx-5_miata' },
  'Mazda MX-5 Miata NB': { make: 'mazda', model: 'mx-5_miata' },
  'Mazda MX-5 Miata NC': { make: 'mazda', model: 'mx-5_miata' },
  'Mazda MX-5 Miata ND': { make: 'mazda', model: 'mx-5_miata' },
  'Mazda RX-7 FD3S': { make: 'mazda', model: 'rx-7' },
  'Toyota GR Supra': { make: 'toyota', model: 'gr_supra' },
  'Toyota GR86': { make: 'toyota', model: 'gr86' },
  'Toyota 86 / Scion FR-S': { make: 'scion', model: 'fr-s' },
  'Toyota Supra Mk4 A80 Turbo': { make: 'toyota', model: 'supra' },
  'Subaru BRZ': { make: 'subaru', model: 'brz' },
  'Subaru BRZ (2nd Gen)': { make: 'subaru', model: 'brz' },
  'Subaru WRX STI VA': { make: 'subaru', model: 'wrx_sti' },
  'Subaru WRX STI GR/GV': { make: 'subaru', model: 'impreza_wrx_sti' },
  'Subaru Impreza WRX STI GD': { make: 'subaru', model: 'impreza_wrx_sti' },
  'Nissan 350Z': { make: 'nissan', model: '350z' },
  'Nissan 370Z NISMO': { make: 'nissan', model: '370z', trim: 'nismo' },
  'Nissan GT-R': { make: 'nissan', model: 'gt-r' },
  'Nissan Z': { make: 'nissan', model: 'z' },
  'Nissan 300ZX Twin Turbo Z32': { make: 'nissan', model: '300zx' },
  'Mitsubishi Lancer Evolution VIII/IX': { make: 'mitsubishi', model: 'lancer_evolution' },
  'Mitsubishi Lancer Evolution X': { make: 'mitsubishi', model: 'lancer' },
  
  // European
  'Audi R8 V10': { make: 'audi', model: 'r8' },
  'Audi R8 V8': { make: 'audi', model: 'r8' },
  'Audi RS3 8V': { make: 'audi', model: 'rs_3' },
  'Audi RS3 8Y': { make: 'audi', model: 'rs_3' },
  'Audi RS5 B8': { make: 'audi', model: 'rs_5' },
  'Audi RS5 B9': { make: 'audi', model: 'rs_5' },
  'Audi TT RS 8J': { make: 'audi', model: 'tt_rs' },
  'Audi TT RS 8S': { make: 'audi', model: 'tt_rs' },
  'Volkswagen Golf R Mk7': { make: 'volkswagen', model: 'golf_r' },
  'Volkswagen Golf R Mk8': { make: 'volkswagen', model: 'golf_r' },
  'Volkswagen GTI Mk7': { make: 'volkswagen', model: 'golf_gti' },
  'Mercedes C63 AMG W204': { make: 'mercedes-benz', model: 'c63_amg' },
  'Mercedes-AMG C63 W205': { make: 'mercedes-benz', model: 'amg_c_63' },
  'Mercedes-AMG E63 S W213': { make: 'mercedes-benz', model: 'amg_e_63' },
  'Mercedes-AMG E63 W212': { make: 'mercedes-benz', model: 'e63_amg' },
  'Mercedes-AMG GT': { make: 'mercedes-benz', model: 'amg_gt' },
  'Alfa Romeo 4C': { make: 'alfa_romeo', model: '4c' },
  'Alfa Romeo Giulia Quadrifoglio': { make: 'alfa_romeo', model: 'giulia' },
  'Jaguar F-Type R': { make: 'jaguar', model: 'f-type' },
  'Jaguar F-Type V6 S': { make: 'jaguar', model: 'f-type' },
  'Aston Martin V8 Vantage': { make: 'aston_martin', model: 'v8_vantage' },
  'Maserati GranTurismo': { make: 'maserati', model: 'granturismo' },
  'Lamborghini Gallardo': { make: 'lamborghini', model: 'gallardo' },
  
  // Other
  'Acura Integra Type R': { make: 'acura', model: 'integra' },
  'Cadillac CTS-V Gen 2': { make: 'cadillac', model: 'cts-v' },
  'Cadillac CTS-V Gen 3': { make: 'cadillac', model: 'cts-v' },
  'Ford Focus RS': { make: 'ford', model: 'focus_rs' },
  'Lexus LC 500': { make: 'lexus', model: 'lc_500' },
  'Lexus RC F': { make: 'lexus', model: 'rc_f' },
  'Lotus Elise S2': { make: 'lotus', model: 'elise' },
  'Lotus Emira': { make: 'lotus', model: 'emira' },
  'Lotus Evora GT': { make: 'lotus', model: 'evora' },
  'Lotus Evora S': { make: 'lotus', model: 'evora' },
  'Lotus Exige S': { make: 'lotus', model: 'exige' },
  'Tesla Model 3 Performance': { make: 'tesla', model: 'model_3' },
};

async function scrapeCarsComForCar(car) {
  // Get mapping or generate from name
  const mapping = CARSCOM_MODELS[car.name];
  
  let make, model, trim;
  
  if (mapping) {
    make = mapping.make;
    model = mapping.model;
    trim = mapping.trim;
  } else {
    // Fallback: generate from car data
    make = (car.brand || car.name.split(' ')[0]).toLowerCase().replace(/\s+/g, '_');
    model = car.name.split(' ').slice(1).join('_').toLowerCase()
      .replace(/[()]/g, '')
      .replace(/\s+/g, '_');
  }
  
  // Get year range
  const yearMatch = car.years?.match(/(\d{4})/g);
  const startYear = yearMatch ? parseInt(yearMatch[0]) : 2015;
  const endYear = yearMatch && yearMatch[1] ? parseInt(yearMatch[1]) : startYear + 5;
  
  try {
    let url = `https://www.cars.com/shopping/results/?makes[]=${make}&models[]=${make}-${model}&maximum_distance=all&stock_type=all&year_min=${startYear}&year_max=${endYear}`;
    
    // Add trim filter if available
    if (trim) {
      url += `&trims[]=${make}-${model}-${trim}`;
    }
    
    const response = await fetch(url, { headers: HEADERS });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    
    // Extract prices from primary-price class
    const prices = [];
    const priceMatches = html.matchAll(/primary-price[^>]*>\s*\$(\d{1,3}(?:,\d{3})*)/gi);
    
    for (const match of priceMatches) {
      const price = parseInt(match[1].replace(/,/g, ''));
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

async function saveCarsComData(carSlug, data) {
  if (!data) return false;
  
  try {
    const { data: existing } = await supabase
      .from('car_market_pricing')
      .select('id')
      .eq('car_slug', carSlug)
      .single();
    
    if (existing) {
      const { error } = await supabase
        .from('car_market_pricing')
        .update(data)
        .eq('car_slug', carSlug);
      return !error;
    } else {
      const { error } = await supabase
        .from('car_market_pricing')
        .insert({ car_slug: carSlug, ...data });
      return !error;
    }
  } catch {
    return false;
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('Cars.com Scraper v2 - Improved Model Matching');
  console.log('='.repeat(70));
  console.log(`Limit: ${LIMIT}, Skip: ${SKIP}, Delay: ${DELAY}ms`);
  console.log('='.repeat(70));
  
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
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];
    
    process.stdout.write(`[${i + 1}/${cars.length}] ${car.name.padEnd(40)}`);
    
    const data = await scrapeCarsComForCar(car);
    const saved = await saveCarsComData(car.slug, data);
    
    if (saved && data) {
      success++;
      const priceStr = `$${data.carscom_avg_price.toLocaleString()}`;
      const rangeStr = `($${data.carscom_min_price.toLocaleString()}-$${data.carscom_max_price.toLocaleString()})`;
      console.log(` ✅ ${priceStr.padStart(10)} ${rangeStr} [${data.carscom_listing_count} listings]`);
    } else {
      failed++;
      console.log(' ❌ No data');
    }
    
    if (i < cars.length - 1) {
      await sleep(DELAY);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`Summary: ${success} success, ${failed} failed`);
  console.log('='.repeat(70));
}

main().catch(console.error);


