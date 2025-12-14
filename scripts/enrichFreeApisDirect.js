#!/usr/bin/env node

/**
 * Direct Free API Enrichment
 * 
 * Directly fetches data from FREE APIs (EPA, NHTSA) without using the job queue.
 * This is faster for the free APIs since they don't have strict rate limits.
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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Import services
const EPA_API_BASE = 'https://www.fueleconomy.gov/ws/rest';
const NHTSA_API_BASE = 'https://api.nhtsa.gov';

// Parse arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value === undefined ? true : value;
  }
  return acc;
}, {});

const LIMIT = args.limit ? parseInt(args.limit) : null;
const SKIP = args.skip ? parseInt(args.skip) : 0;
const DELAY_MS = args.delay ? parseInt(args.delay) : 500;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// EPA Functions
// ============================================================================

async function searchEpaVehicle(year, make, model) {
  try {
    const optionsUrl = `${EPA_API_BASE}/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`;
    const response = await fetch(optionsUrl);
    if (!response.ok) return null;
    
    const data = await response.json();
    const items = data.menuItem;
    if (!items) return null;
    
    const options = Array.isArray(items) ? items : [items];
    if (options.length === 0) return null;
    
    // Get the first vehicle's details
    const vehicleId = options[0].value;
    const vehicleResponse = await fetch(`${EPA_API_BASE}/vehicle/${vehicleId}`);
    if (!vehicleResponse.ok) return null;
    
    const vehicleData = await vehicleResponse.json();
    return vehicleData;
  } catch (err) {
    return null;
  }
}

async function getEpaData(car) {
  // Parse year/make/model from car name
  const yearMatch = car.years?.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  
  const nameParts = car.name?.split(' ') || [];
  const make = car.brand || nameParts[0];
  const model = nameParts.slice(1).join(' ')
    .replace(/\([^)]+\)/g, '')
    .replace(/E\d{2}|F\d{2}|G\d{2}/gi, '')
    .trim();
  
  if (!year || !make || !model) return null;
  
  // Try to find the vehicle in EPA database
  const epaData = await searchEpaVehicle(year, make, model);
  
  if (!epaData) {
    // Try alternative model names
    const modelVariants = [
      model.split(' ')[0], // First word only
      model.replace(/\s+/g, ''), // No spaces
    ];
    
    for (const variant of modelVariants) {
      const altData = await searchEpaVehicle(year, make, variant);
      if (altData) return altData;
    }
    
    return null;
  }
  
  return epaData;
}

// ============================================================================
// NHTSA Functions
// ============================================================================

async function getNhtsaData(car) {
  const yearMatch = car.years?.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  
  const nameParts = car.name?.split(' ') || [];
  const make = car.brand || nameParts[0];
  const model = nameParts.slice(1).join(' ')
    .replace(/\([^)]+\)/g, '')
    .replace(/E\d{2}|F\d{2}|G\d{2}/gi, '')
    .trim();
  
  if (!year || !make || !model) return null;
  
  const results = {
    recalls: [],
    complaints: [],
    tsbs: [],
    safetyRatings: null,
  };
  
  try {
    // Fetch recalls
    const recallsResponse = await fetch(
      `${NHTSA_API_BASE}/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`
    );
    if (recallsResponse.ok) {
      const data = await recallsResponse.json();
      results.recalls = data.results || [];
    }
  } catch {}
  
  try {
    // Fetch complaints
    const complaintsResponse = await fetch(
      `${NHTSA_API_BASE}/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`
    );
    if (complaintsResponse.ok) {
      const data = await complaintsResponse.json();
      results.complaints = data.results || [];
    }
  } catch {}
  
  try {
    // Fetch safety ratings
    const ratingsSearchResponse = await fetch(
      `${NHTSA_API_BASE}/SafetyRatings/modelyear/${year}/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}?format=json`
    );
    if (ratingsSearchResponse.ok) {
      const searchData = await ratingsSearchResponse.json();
      if (searchData.Results?.length > 0) {
        const vehicleId = searchData.Results[0].VehicleId;
        const ratingsResponse = await fetch(
          `${NHTSA_API_BASE}/SafetyRatings/VehicleId/${vehicleId}?format=json`
        );
        if (ratingsResponse.ok) {
          const ratingsData = await ratingsResponse.json();
          results.safetyRatings = ratingsData.Results?.[0];
        }
      }
    }
  } catch {}
  
  return results;
}

// ============================================================================
// Save Functions
// ============================================================================

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

async function saveSafetyData(carSlug, nhtsaData) {
  if (!nhtsaData) return false;
  
  const record = {
    car_slug: carSlug,
    nhtsa_overall_rating: nhtsaData.safetyRatings?.OverallRating 
      ? parseInt(nhtsaData.safetyRatings.OverallRating) : null,
    nhtsa_front_crash_rating: nhtsaData.safetyRatings?.OverallFrontCrashRating 
      ? parseInt(nhtsaData.safetyRatings.OverallFrontCrashRating) : null,
    nhtsa_side_crash_rating: nhtsaData.safetyRatings?.OverallSideCrashRating 
      ? parseInt(nhtsaData.safetyRatings.OverallSideCrashRating) : null,
    nhtsa_rollover_rating: nhtsaData.safetyRatings?.RolloverRating 
      ? parseInt(nhtsaData.safetyRatings.RolloverRating) : null,
    recall_count: nhtsaData.recalls?.length || 0,
    complaint_count: nhtsaData.complaints?.length || 0,
    investigation_count: 0,
    tsb_count: nhtsaData.tsbs?.length || 0,
    has_open_recalls: false,
    nhtsa_fetched_at: new Date().toISOString(),
  };
  
  try {
    const { error } = await supabase
      .from('car_safety_data')
      .upsert(record, { onConflict: 'car_slug' });
    
    // Save individual recalls
    if (nhtsaData.recalls?.length > 0) {
      const recallRecords = nhtsaData.recalls.slice(0, 20).map(r => ({
        car_slug: carSlug,
        campaign_number: r.NHTSACampaignNumber || r.CampaignNumber || 'unknown',
        component: r.Component,
        summary: r.Summary,
        consequence: r.Consequence,
        remedy: r.Remedy,
        report_received_date: r.ReportReceivedDate,
        is_incomplete: false,
      }));
      
      await supabase
        .from('car_recalls')
        .upsert(recallRecords, { onConflict: 'car_slug,campaign_number' })
        .catch(() => {});
    }
    
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
  console.log('Direct Free API Enrichment');
  console.log('='.repeat(60));
  console.log(`Delay between requests: ${DELAY_MS}ms`);
  console.log(`Skip: ${SKIP}, Limit: ${LIMIT || 'all'}`);
  console.log('='.repeat(60));
  
  // Fetch all cars
  let query = supabase
    .from('cars')
    .select('slug, name, brand, years')
    .order('name');
  
  const { data: cars, error } = await query;
  
  if (error || !cars) {
    console.error('Error fetching cars:', error?.message);
    process.exit(1);
  }
  
  // Apply skip and limit
  let carsToProcess = cars.slice(SKIP);
  if (LIMIT) {
    carsToProcess = carsToProcess.slice(0, LIMIT);
  }
  
  console.log(`\nProcessing ${carsToProcess.length} cars...\n`);
  
  let epaSuccess = 0;
  let nhtsaSuccess = 0;
  let epaFail = 0;
  let nhtsaFail = 0;
  
  for (let i = 0; i < carsToProcess.length; i++) {
    const car = carsToProcess[i];
    
    process.stdout.write(`[${i + 1}/${carsToProcess.length}] ${car.name.padEnd(40)}`);
    
    // Fetch EPA data
    const epaData = await getEpaData(car);
    const epaSaved = await saveFuelEconomy(car.slug, epaData);
    
    if (epaSaved) {
      epaSuccess++;
      process.stdout.write(' EPA:✅');
    } else {
      epaFail++;
      process.stdout.write(' EPA:❌');
    }
    
    await sleep(DELAY_MS / 2);
    
    // Fetch NHTSA data
    const nhtsaData = await getNhtsaData(car);
    const nhtsaSaved = await saveSafetyData(car.slug, nhtsaData);
    
    if (nhtsaSaved) {
      nhtsaSuccess++;
      process.stdout.write(' NHTSA:✅');
    } else {
      nhtsaFail++;
      process.stdout.write(' NHTSA:❌');
    }
    
    console.log('');
    
    await sleep(DELAY_MS);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`EPA:   ${epaSuccess} success, ${epaFail} failed`);
  console.log(`NHTSA: ${nhtsaSuccess} success, ${nhtsaFail} failed`);
  console.log('='.repeat(60));
}

main().catch(console.error);
