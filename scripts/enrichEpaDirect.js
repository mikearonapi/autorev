#!/usr/bin/env node

/**
 * Direct EPA Enrichment with Better Matching
 * 
 * The EPA database uses specific naming conventions that differ from
 * enthusiast car names. This script uses multiple search strategies.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const EPA_API_BASE = 'https://www.fueleconomy.gov/ws/rest';

// Map our car names to EPA-friendly search terms
const EPA_MAPPINGS = {
  // Porsche
  '718 Cayman GT4': { make: 'Porsche', model: '718 Cayman' },
  '718 Cayman GTS 4.0': { make: 'Porsche', model: '718 Cayman' },
  '981 Cayman GTS': { make: 'Porsche', model: 'Cayman' },
  '981 Cayman S': { make: 'Porsche', model: 'Cayman' },
  '987.2 Cayman S': { make: 'Porsche', model: 'Cayman' },
  '991.1 Carrera S': { make: 'Porsche', model: '911' },
  '997.2 Carrera S': { make: 'Porsche', model: '911' },
  'Porsche 911 GT3 996': { make: 'Porsche', model: '911' },
  'Porsche 911 GT3 997': { make: 'Porsche', model: '911' },
  'Porsche 911 Turbo 997.1': { make: 'Porsche', model: '911' },
  'Porsche 911 Turbo 997.2': { make: 'Porsche', model: '911' },
  
  // BMW
  'BMW 1 Series M Coupe': { make: 'BMW', model: '1 Series M' },
  'BMW M2 Competition': { make: 'BMW', model: 'M2' },
  'BMW M3 E46': { make: 'BMW', model: 'M3' },
  'BMW M3 E92': { make: 'BMW', model: 'M3' },
  'BMW M3 F80': { make: 'BMW', model: 'M3' },
  'BMW M4 F82': { make: 'BMW', model: 'M4' },
  'BMW M5 E39': { make: 'BMW', model: 'M5' },
  'BMW M5 E60': { make: 'BMW', model: 'M5' },
  'BMW M5 F10 Competition': { make: 'BMW', model: 'M5' },
  'BMW M5 F90 Competition': { make: 'BMW', model: 'M5' },
  'BMW Z4 M Coupe/Roadster': { make: 'BMW', model: 'Z4 M' },
  
  // Corvette
  'C7 Corvette Grand Sport': { make: 'Chevrolet', model: 'Corvette' },
  'C7 Corvette Z06': { make: 'Chevrolet', model: 'Corvette' },
  'C8 Corvette Stingray': { make: 'Chevrolet', model: 'Corvette' },
  'Chevrolet Corvette C5 Z06': { make: 'Chevrolet', model: 'Corvette' },
  'Chevrolet Corvette C6 Grand Sport': { make: 'Chevrolet', model: 'Corvette' },
  'Chevrolet Corvette C6 Z06': { make: 'Chevrolet', model: 'Corvette' },
  
  // Muscle
  'Camaro SS 1LE': { make: 'Chevrolet', model: 'Camaro' },
  'Camaro ZL1': { make: 'Chevrolet', model: 'Camaro' },
  'Mustang GT PP2': { make: 'Ford', model: 'Mustang' },
  'Shelby GT350': { make: 'Ford', model: 'Mustang' },
  'Shelby GT500': { make: 'Ford', model: 'Mustang' },
  'Ford Mustang Boss 302': { make: 'Ford', model: 'Mustang' },
  
  // Dodge
  'Dodge Challenger Hellcat': { make: 'Dodge', model: 'Challenger' },
  'Dodge Challenger SRT 392': { make: 'Dodge', model: 'Challenger' },
  'Dodge Charger Hellcat': { make: 'Dodge', model: 'Charger' },
  'Dodge Charger SRT 392': { make: 'Dodge', model: 'Charger' },
  'Dodge Viper': { make: 'Dodge', model: 'Viper' },
  
  // Japanese
  'Nissan 350Z': { make: 'Nissan', model: '350Z' },
  'Nissan 370Z NISMO': { make: 'Nissan', model: '370Z' },
  'Nissan GT-R': { make: 'Nissan', model: 'GT-R' },
  'Nissan Z': { make: 'Nissan', model: 'Z' },
  'Nissan 300ZX Twin Turbo Z32': { make: 'Nissan', model: '300ZX' },
  'Honda Civic Type R FK8': { make: 'Honda', model: 'Civic Type R' },
  'Honda Civic Type R FL5': { make: 'Honda', model: 'Civic Type R' },
  'Honda S2000': { make: 'Honda', model: 'S2000' },
  'Mazda RX-7 FD3S': { make: 'Mazda', model: 'RX-7' },
  'Mazda MX-5 Miata NA': { make: 'Mazda', model: 'MX-5 Miata' },
  'Mazda MX-5 Miata NB': { make: 'Mazda', model: 'MX-5 Miata' },
  'Mazda MX-5 Miata NC': { make: 'Mazda', model: 'MX-5 Miata' },
  'Mazda MX-5 Miata ND': { make: 'Mazda', model: 'MX-5 Miata' },
  'Toyota GR Supra': { make: 'Toyota', model: 'GR Supra' },
  'Toyota GR86': { make: 'Toyota', model: 'GR86' },
  'Toyota 86 / Scion FR-S': { make: 'Scion', model: 'FR-S' },
  'Toyota Supra Mk4 A80 Turbo': { make: 'Toyota', model: 'Supra' },
  'Subaru BRZ': { make: 'Subaru', model: 'BRZ' },
  'Subaru BRZ (2nd Gen)': { make: 'Subaru', model: 'BRZ' },
  'Subaru Impreza WRX STI GD': { make: 'Subaru', model: 'Impreza WRX STI' },
  'Subaru WRX STI GR/GV': { make: 'Subaru', model: 'Impreza WRX STI' },
  'Subaru WRX STI VA': { make: 'Subaru', model: 'WRX STI' },
  'Mitsubishi Lancer Evolution VIII/IX': { make: 'Mitsubishi', model: 'Lancer Evolution' },
  'Mitsubishi Lancer Evolution X': { make: 'Mitsubishi', model: 'Lancer' },
  
  // European
  'Audi R8 V10': { make: 'Audi', model: 'R8' },
  'Audi R8 V8': { make: 'Audi', model: 'R8' },
  'Audi RS3 8V': { make: 'Audi', model: 'RS 3' },
  'Audi RS3 8Y': { make: 'Audi', model: 'RS 3' },
  'Audi RS5 B8': { make: 'Audi', model: 'RS 5' },
  'Audi RS5 B9': { make: 'Audi', model: 'RS 5' },
  'Audi TT RS 8J': { make: 'Audi', model: 'TT RS' },
  'Audi TT RS 8S': { make: 'Audi', model: 'TT RS' },
  'Volkswagen Golf R Mk7': { make: 'Volkswagen', model: 'Golf R' },
  'Volkswagen Golf R Mk8': { make: 'Volkswagen', model: 'Golf R' },
  'Volkswagen GTI Mk7': { make: 'Volkswagen', model: 'Golf GTI' },
  'Mercedes C63 AMG W204': { make: 'Mercedes-Benz', model: 'C63 AMG' },
  'Mercedes-AMG C63 W205': { make: 'Mercedes-Benz', model: 'AMG C 63' },
  'Mercedes-AMG E63 S W213': { make: 'Mercedes-Benz', model: 'AMG E 63' },
  'Mercedes-AMG E63 W212': { make: 'Mercedes-Benz', model: 'E63 AMG' },
  'Mercedes-AMG GT': { make: 'Mercedes-Benz', model: 'AMG GT' },
  'Alfa Romeo 4C': { make: 'Alfa Romeo', model: '4C' },
  'Alfa Romeo Giulia Quadrifoglio': { make: 'Alfa Romeo', model: 'Giulia' },
  'Jaguar F-Type R': { make: 'Jaguar', model: 'F-Type' },
  'Jaguar F-Type V6 S': { make: 'Jaguar', model: 'F-Type' },
  'Aston Martin V8 Vantage': { make: 'Aston Martin', model: 'V8 Vantage' },
  'Maserati GranTurismo': { make: 'Maserati', model: 'GranTurismo' },
  'Lamborghini Gallardo': { make: 'Lamborghini', model: 'Gallardo' },
  
  // Other
  'Acura Integra Type R': { make: 'Acura', model: 'Integra' },
  'Cadillac CTS-V Gen 2': { make: 'Cadillac', model: 'CTS-V' },
  'Cadillac CTS-V Gen 3': { make: 'Cadillac', model: 'CTS-V' },
  'Ford Focus RS': { make: 'Ford', model: 'Focus RS' },
  'Lexus LC 500': { make: 'Lexus', model: 'LC 500' },
  'Lexus RC F': { make: 'Lexus', model: 'RC F' },
  'Lotus Elise S2': { make: 'Lotus', model: 'Elise' },
  'Lotus Emira': { make: 'Lotus', model: 'Emira' },
  'Lotus Evora GT': { make: 'Lotus', model: 'Evora' },
  'Lotus Evora S': { make: 'Lotus', model: 'Evora' },
  'Lotus Exige S': { make: 'Lotus', model: 'Exige' },
  'Tesla Model 3 Performance': { make: 'Tesla', model: 'Model 3' },
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const EPA_HEADERS = {
  'Accept': 'application/json',
};

async function searchEpa(year, make, model) {
  try {
    // First get available models for this make/year
    const modelsUrl = `${EPA_API_BASE}/vehicle/menu/model?year=${year}&make=${encodeURIComponent(make)}`;
    const modelsResponse = await fetch(modelsUrl, { headers: EPA_HEADERS });
    
    if (!modelsResponse.ok) return null;
    
    const modelsData = await modelsResponse.json();
    const items = modelsData.menuItem;
    if (!items) return null;
    
    const availableModels = Array.isArray(items) ? items : [items];
    
    // Find the best matching model
    const targetModel = model.toLowerCase();
    let bestMatch = availableModels.find(m => 
      m.value.toLowerCase() === targetModel ||
      m.value.toLowerCase().includes(targetModel) ||
      targetModel.includes(m.value.toLowerCase())
    );
    
    if (!bestMatch && availableModels.length > 0) {
      // Try partial match
      bestMatch = availableModels.find(m => {
        const modelWords = targetModel.split(' ');
        return modelWords.some(word => 
          m.value.toLowerCase().includes(word) && word.length > 2
        );
      });
    }
    
    if (!bestMatch) return null;
    
    // Get vehicle options
    const optionsUrl = `${EPA_API_BASE}/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(bestMatch.value)}`;
    const optionsResponse = await fetch(optionsUrl, { headers: EPA_HEADERS });
    
    if (!optionsResponse.ok) return null;
    
    const optionsData = await optionsResponse.json();
    const options = optionsData.menuItem;
    if (!options) return null;
    
    const optionsList = Array.isArray(options) ? options : [options];
    if (optionsList.length === 0) return null;
    
    // Get the first (or best) vehicle
    const vehicleId = optionsList[0].value;
    const vehicleResponse = await fetch(`${EPA_API_BASE}/vehicle/${vehicleId}`, { headers: EPA_HEADERS });
    
    if (!vehicleResponse.ok) return null;
    
    return await vehicleResponse.json();
  } catch (err) {
    return null;
  }
}

async function getEpaDataForCar(car) {
  // Get year
  const yearMatch = car.years?.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  
  if (!year) return null;
  
  // Check for manual mapping
  const mapping = EPA_MAPPINGS[car.name];
  
  if (mapping) {
    const data = await searchEpa(year, mapping.make, mapping.model);
    if (data) return data;
    
    // Try adjacent years
    const adjacentData = await searchEpa(year + 1, mapping.make, mapping.model) ||
                         await searchEpa(year - 1, mapping.make, mapping.model);
    if (adjacentData) return adjacentData;
  }
  
  // Try with brand name
  const nameParts = car.name?.split(' ') || [];
  const make = car.brand || nameParts[0];
  const model = nameParts.slice(1).join(' ')
    .replace(/\([^)]+\)/g, '')
    .replace(/E\d{2}|F\d{2}|G\d{2}/gi, '')
    .trim();
  
  if (make && model) {
    const data = await searchEpa(year, make, model);
    if (data) return data;
  }
  
  return null;
}

async function saveFuelEconomy(carSlug, epaData) {
  if (!epaData) return false;
  
  const record = {
    car_slug: carSlug,
    epa_vehicle_id: parseInt(epaData.id) || null,
    city_mpg: parseFloat(epaData.city08) || null,
    highway_mpg: parseFloat(epaData.highway08) || null,
    combined_mpg: parseFloat(epaData.comb08) || null,
    fuel_type: epaData.fuelType1,
    annual_fuel_cost: parseInt(epaData.fuelCost08) || null,
    co2_emissions: parseInt(epaData.co2) || null,
    ghg_score: parseInt(epaData.ghgScore) || null,
    is_electric: epaData.atvType === 'EV' || epaData.fuelType1 === 'Electricity',
    is_hybrid: epaData.atvType === 'Hybrid' || epaData.atvType === 'Plug-in Hybrid',
    ev_range: parseInt(epaData.range) || null,
    source: 'EPA',
    fetched_at: new Date().toISOString(),
  };
  
  try {
    const { error } = await supabase
      .from('car_fuel_economy')
      .upsert(record, { onConflict: 'car_slug' });
    
    return !error;
  } catch {
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('EPA Enrichment with Better Matching');
  console.log('='.repeat(60));
  
  const { data: cars, error } = await supabase
    .from('cars')
    .select('slug, name, brand, years')
    .order('name');
  
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
    
    const epaData = await getEpaDataForCar(car);
    const saved = await saveFuelEconomy(car.slug, epaData);
    
    if (saved && epaData) {
      success++;
      console.log(` ✅ ${epaData.comb08}mpg`);
    } else {
      failed++;
      console.log(' ❌');
    }
    
    await sleep(400);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`EPA: ${success} success, ${failed} failed`);
  console.log('='.repeat(60));
}

main().catch(console.error);
