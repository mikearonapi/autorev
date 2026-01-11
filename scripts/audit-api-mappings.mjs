#!/usr/bin/env node
/**
 * API Mapping Audit Script
 * 
 * Identifies vehicles in our database that may have mapping issues
 * with external APIs (NHTSA, EPA, etc.)
 * 
 * Run with: node scripts/audit-api-mappings.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const NHTSA_API_BASE = 'https://api.nhtsa.gov';

// Rate limiting helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Test if a vehicle returns data from NHTSA
 */
async function testNHTSARecalls(make, model, year) {
  try {
    const url = `${NHTSA_API_BASE}/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
    const response = await fetch(url);
    if (!response.ok) return { count: -1, error: response.status };
    const data = await response.json();
    return { count: data.Count || 0, error: null };
  } catch (err) {
    return { count: -1, error: err.message };
  }
}

/**
 * Test if a vehicle returns complaints from NHTSA
 */
async function testNHTSAComplaints(make, model, year) {
  try {
    const url = `${NHTSA_API_BASE}/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
    const response = await fetch(url);
    if (!response.ok) return { count: -1, error: response.status };
    const data = await response.json();
    return { count: data.results?.length || 0, error: null };
  } catch (err) {
    return { count: -1, error: err.message };
  }
}

/**
 * Extract model name from full vehicle name
 * e.g., "Ram 1500 Rebel" -> "1500 Rebel" (for Ram brand)
 */
function extractModelFromName(name, brand) {
  if (!name || !brand) return name;
  
  // Remove brand prefix if present
  let model = name;
  if (name.toLowerCase().startsWith(brand.toLowerCase())) {
    model = name.slice(brand.length).trim();
  }
  
  return model;
}

/**
 * Parse year from years string
 */
function parseYear(yearsStr) {
  if (!yearsStr) return null;
  const match = yearsStr.match(/(\d{4})/);
  return match ? parseInt(match[1]) : null;
}

/**
 * Main audit function
 */
async function auditAPIMappings() {
  console.log('🔍 API Mapping Audit\n');
  console.log('=' .repeat(80));
  
  // Fetch all cars from database
  console.log('\n📊 Fetching vehicles from database...');
  const { data: cars, error } = await supabase
    .from('cars')
    .select('brand, name, years')
    .not('brand', 'is', null)
    .order('brand');
  
  if (error) {
    console.error('Failed to fetch cars:', error);
    return;
  }
  
  console.log(`Found ${cars.length} vehicles to audit\n`);
  
  // Group results
  const results = {
    noData: [],           // 0 recalls AND 0 complaints
    lowData: [],          // Very few results (< 3 combined)
    hasData: [],          // Good data
    errors: [],           // API errors
    skipped: [],          // Exotic/rare makes we skip
  };
  
  // Makes to skip (exotic/rare - limited NHTSA data)
  const skipMakes = new Set([
    'Ferrari', 'Lamborghini', 'McLaren', 'Pagani', 'Koenigsegg',
    'Bugatti', 'Aston Martin', 'Lotus', 'Maserati', 'Bentley',
    'Rolls-Royce', 'Alfa Romeo', 'Noble', 'TVR', 'Morgan',
  ]);
  
  let processed = 0;
  const total = cars.length;
  
  for (const car of cars) {
    processed++;
    
    const { brand, name, years } = car;
    const year = parseYear(years);
    const model = extractModelFromName(name, brand);
    
    // Skip exotic makes
    if (skipMakes.has(brand)) {
      results.skipped.push({ brand, model, year, name });
      continue;
    }
    
    // Skip if no year
    if (!year) {
      results.skipped.push({ brand, model, year, name, reason: 'No year' });
      continue;
    }
    
    // Progress indicator
    process.stdout.write(`\r[${processed}/${total}] Testing: ${brand} ${model} (${year})`.padEnd(80));
    
    // Test NHTSA APIs
    const recallsResult = await testNHTSARecalls(brand, model, year);
    await delay(100); // Rate limiting
    const complaintsResult = await testNHTSAComplaints(brand, model, year);
    await delay(100);
    
    const entry = {
      brand,
      model,
      year,
      name,
      recalls: recallsResult.count,
      complaints: complaintsResult.count,
    };
    
    if (recallsResult.error || complaintsResult.error) {
      entry.error = recallsResult.error || complaintsResult.error;
      results.errors.push(entry);
    } else if (recallsResult.count === 0 && complaintsResult.count === 0) {
      results.noData.push(entry);
    } else if (recallsResult.count + complaintsResult.count < 3) {
      results.lowData.push(entry);
    } else {
      results.hasData.push(entry);
    }
  }
  
  // Clear progress line
  process.stdout.write('\r' + ' '.repeat(80) + '\r');
  
  // Print report
  console.log('\n' + '='.repeat(80));
  console.log('📋 AUDIT REPORT');
  console.log('='.repeat(80));
  
  console.log('\n🚨 CRITICAL: Vehicles with ZERO NHTSA data (likely need mappings):');
  console.log('-'.repeat(80));
  
  if (results.noData.length === 0) {
    console.log('  ✅ No critical issues found!');
  } else {
    // Group by brand for easier reading
    const byBrand = {};
    results.noData.forEach(v => {
      if (!byBrand[v.brand]) byBrand[v.brand] = [];
      byBrand[v.brand].push(v);
    });
    
    for (const [brand, vehicles] of Object.entries(byBrand).sort()) {
      console.log(`\n  ${brand}:`);
      vehicles.forEach(v => {
        console.log(`    - "${v.model}" (${v.year}) → stored as "${v.name}"`);
      });
    }
  }
  
  console.log('\n\n⚠️  WARNING: Vehicles with very little NHTSA data (< 3 total):');
  console.log('-'.repeat(80));
  
  if (results.lowData.length === 0) {
    console.log('  ✅ No warnings!');
  } else {
    const byBrand = {};
    results.lowData.forEach(v => {
      if (!byBrand[v.brand]) byBrand[v.brand] = [];
      byBrand[v.brand].push(v);
    });
    
    for (const [brand, vehicles] of Object.entries(byBrand).sort()) {
      console.log(`\n  ${brand}:`);
      vehicles.forEach(v => {
        console.log(`    - "${v.model}" (${v.year}) → recalls: ${v.recalls}, complaints: ${v.complaints}`);
      });
    }
  }
  
  console.log('\n\n✅ HEALTHY: Vehicles with good NHTSA data:');
  console.log('-'.repeat(80));
  console.log(`  ${results.hasData.length} vehicles have sufficient data`);
  
  console.log('\n\n📊 SUMMARY:');
  console.log('-'.repeat(80));
  console.log(`  Total vehicles audited: ${cars.length}`);
  console.log(`  ✅ Has data:            ${results.hasData.length}`);
  console.log(`  ⚠️  Low data:            ${results.lowData.length}`);
  console.log(`  🚨 No data (CRITICAL):  ${results.noData.length}`);
  console.log(`  ⏭️  Skipped (exotic):    ${results.skipped.length}`);
  console.log(`  ❌ Errors:              ${results.errors.length}`);
  
  // Generate suggested mappings
  if (results.noData.length > 0) {
    console.log('\n\n📝 SUGGESTED MAPPINGS TO ADD:');
    console.log('-'.repeat(80));
    console.log('Add these to NHTSA_MODEL_MAPPINGS in lib/nhtsaSafetyService.js:\n');
    
    const suggestions = new Map();
    results.noData.forEach(v => {
      const key = v.model.toLowerCase();
      // Try to guess the base model
      const baseModel = guessBaseModel(v.model);
      if (baseModel && baseModel.toLowerCase() !== key) {
        suggestions.set(key, baseModel);
      }
    });
    
    if (suggestions.size > 0) {
      console.log('const additionalMappings = {');
      for (const [key, value] of suggestions) {
        console.log(`  '${key}': '${value}',`);
      }
      console.log('};');
    } else {
      console.log('  No automatic suggestions - manual review needed.');
    }
  }
  
  // Return results for programmatic use
  return results;
}

/**
 * Try to guess the base model from a full model name
 */
function guessBaseModel(model) {
  if (!model) return null;
  
  // Common patterns to strip
  const patterns = [
    // Generation codes
    /\s+(E\d{2}|F\d{2}|G\d{2}|W\d{3}|FK\d+|ZD\d+|NA\d?|NC\d?|ND\d?|NB\d?|A\d{2}|B\d)$/i,
    // Performance trims
    /\s+(Type R|Type S|Type RS|Nismo|TRD|GT|GTS|GT3|GT4|RS|SS|SRT|SVT|AMG|M Sport)$/i,
    // Trim levels
    /\s+(Sport|Limited|Premium|Touring|Base|Luxury|Executive|Competition|Performance)$/i,
    // Specific model suffixes
    /\s+(Hellcat|Demon|Trackhawk|Blackwing|Raptor|Lightning|Power Stroke|Cummins|Rebel|TRX)$/i,
    // Body styles
    /\s+(Coupe|Sedan|Hatchback|Wagon|Roadster|Convertible|Cabrio|Spyder|Spider)$/i,
    // Engine specs
    /\s+(\d+\.\d+T?|V\d+|I\d+|Turbo|Supercharged|TFSI|TSI|VTEC)$/i,
  ];
  
  let base = model;
  for (const pattern of patterns) {
    base = base.replace(pattern, '');
  }
  
  return base.trim() || null;
}

// Run the audit
auditAPIMappings()
  .then(results => {
    if (results?.noData?.length > 0) {
      console.log('\n\n⚠️  Action Required: Review vehicles with no data and add appropriate mappings.');
      process.exit(1);
    } else {
      console.log('\n\n✅ All vehicles have NHTSA data coverage.');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('Audit failed:', err);
    process.exit(2);
  });
