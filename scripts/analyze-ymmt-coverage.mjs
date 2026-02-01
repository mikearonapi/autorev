#!/usr/bin/env node

/**
 * Year/Make/Model/Trim (YMMT) Coverage Analysis
 * 
 * Expands both the Top 100 list and database into individual
 * YEAR + MAKE + MODEL + TRIM combinations for precise gap analysis.
 * 
 * Usage: node scripts/analyze-ymmt-coverage.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Top 100 vehicles with their expected YEAR ranges and TRIM levels
// This defines what combinations SHOULD exist for full coverage
const TOP_100_EXPECTED = [
  // Tier 1: Market Leaders
  { rank: 1, make: 'Ford', model: 'F-150', yearStart: 2015, yearEnd: 2024, trims: ['Standard', 'XLT', 'Lariat', 'Platinum', 'Limited', 'Raptor'] },
  { rank: 2, make: 'Jeep', model: 'Wrangler', yearStart: 2007, yearEnd: 2024, trims: ['Sport', 'Sahara', 'Rubicon', 'Rubicon 392'] },
  { rank: 3, make: 'Ford', model: 'Mustang', yearStart: 2015, yearEnd: 2024, trims: ['EcoBoost', 'GT', 'GT Premium', 'Mach 1', 'GT350', 'GT500', 'Dark Horse'] },
  { rank: 4, make: 'Chevrolet', model: 'Silverado 1500', yearStart: 2014, yearEnd: 2024, trims: ['WT', 'Custom', 'LT', 'RST', 'LTZ', 'High Country', 'ZR2', 'Trail Boss'] },
  { rank: 5, make: 'Volkswagen', model: 'Golf GTI', yearStart: 2015, yearEnd: 2024, trims: ['S', 'SE', 'Autobahn'] },
  { rank: 6, make: 'Chevrolet', model: 'Corvette', yearStart: 2014, yearEnd: 2024, trims: ['Stingray', 'Z51', 'Grand Sport', 'Z06', 'ZR1'] },
  { rank: 7, make: 'Toyota', model: 'Tacoma', yearStart: 2016, yearEnd: 2024, trims: ['SR', 'SR5', 'TRD Sport', 'TRD Off-Road', 'TRD Pro', 'Limited'] },
  { rank: 8, make: 'Subaru', model: 'WRX', yearStart: 2015, yearEnd: 2024, trims: ['Base', 'Premium', 'Limited', 'STI', 'STI Limited'] },
  { rank: 9, make: 'Ram', model: '1500', yearStart: 2019, yearEnd: 2024, trims: ['Tradesman', 'Big Horn', 'Laramie', 'Rebel', 'Limited', 'TRX'] },
  { rank: 10, make: 'BMW', model: '3 Series', yearStart: 2012, yearEnd: 2024, trims: ['320i', '328i', '330i', '340i', 'M340i'] },
  
  // Tier 2: Major Platforms
  { rank: 11, make: 'Chevrolet', model: 'Camaro', yearStart: 2016, yearEnd: 2024, trims: ['LT', 'SS', 'SS 1LE', 'ZL1', 'ZL1 1LE'] },
  { rank: 12, make: 'Honda', model: 'Civic', yearStart: 2016, yearEnd: 2024, trims: ['LX', 'Sport', 'EX', 'Touring', 'Si', 'Type R'] },
  { rank: 13, make: 'Ford', model: 'Bronco', yearStart: 2021, yearEnd: 2024, trims: ['Base', 'Big Bend', 'Black Diamond', 'Outer Banks', 'Badlands', 'Wildtrak', 'Raptor'] },
  { rank: 14, make: 'Ram', model: '2500', yearStart: 2019, yearEnd: 2024, trims: ['Tradesman', 'Big Horn', 'Laramie', 'Power Wagon', 'Limited'] },
  { rank: 15, make: 'Ford', model: 'F-250', yearStart: 2017, yearEnd: 2024, trims: ['XL', 'XLT', 'Lariat', 'King Ranch', 'Platinum', 'Limited', 'Tremor'] },
  { rank: 16, make: 'Mazda', model: 'MX-5 Miata', yearStart: 2016, yearEnd: 2024, trims: ['Sport', 'Club', 'Grand Touring'] },
  { rank: 17, make: 'Toyota', model: '4Runner', yearStart: 2014, yearEnd: 2024, trims: ['SR5', 'Trail', 'TRD Off-Road', 'TRD Pro', 'Limited'] },
  { rank: 18, make: 'Dodge', model: 'Challenger', yearStart: 2015, yearEnd: 2023, trims: ['SXT', 'GT', 'R/T', 'R/T Scat Pack', 'SRT 392', 'SRT Hellcat', 'SRT Demon'] },
  { rank: 19, make: 'Volkswagen', model: 'Golf R', yearStart: 2015, yearEnd: 2024, trims: ['Base'] },
  { rank: 20, make: 'BMW', model: 'M3', yearStart: 2015, yearEnd: 2024, trims: ['Base', 'Competition'] },
  
  // Tier 3: Strong Enthusiast Platforms
  { rank: 21, make: 'Porsche', model: '911', yearStart: 2012, yearEnd: 2024, trims: ['Carrera', 'Carrera S', 'Carrera 4S', 'GTS', 'Turbo', 'Turbo S', 'GT3', 'GT3 RS', 'GT2 RS'] },
  { rank: 22, make: 'Dodge', model: 'Charger', yearStart: 2015, yearEnd: 2023, trims: ['SXT', 'GT', 'R/T', 'R/T Scat Pack', 'SRT 392', 'SRT Hellcat'] },
  { rank: 23, make: 'Acura', model: 'Integra', yearStart: 2023, yearEnd: 2024, trims: ['Base', 'A-Spec', 'Type S'] },
  { rank: 24, make: 'GMC', model: 'Sierra 1500', yearStart: 2019, yearEnd: 2024, trims: ['Elevation', 'SLE', 'SLT', 'AT4', 'AT4X', 'Denali'] },
  { rank: 25, make: 'Audi', model: 'S4', yearStart: 2018, yearEnd: 2024, trims: ['Premium', 'Premium Plus', 'Prestige'] },
  { rank: 26, make: 'Nissan', model: '370Z', yearStart: 2009, yearEnd: 2020, trims: ['Base', 'Sport', 'Touring', 'NISMO'] },
  { rank: 27, make: 'Toyota', model: 'Tundra', yearStart: 2022, yearEnd: 2024, trims: ['SR', 'SR5', 'Limited', 'Platinum', 'TRD Pro', '1794 Edition', 'Capstone'] },
  { rank: 28, make: 'Ford', model: 'Focus ST', yearStart: 2013, yearEnd: 2018, trims: ['ST', 'ST2', 'ST3'] },
  { rank: 29, make: 'Nissan', model: '350Z', yearStart: 2003, yearEnd: 2008, trims: ['Base', 'Enthusiast', 'Touring', 'Track', 'NISMO'] },
  { rank: 30, make: 'Jeep', model: 'Gladiator', yearStart: 2020, yearEnd: 2024, trims: ['Sport', 'Overland', 'Rubicon', 'Mojave', 'High Altitude'] },
  
  // Tier 4: Established Modification Communities
  { rank: 31, make: 'Honda', model: 'S2000', yearStart: 2000, yearEnd: 2009, trims: ['Base', 'CR'] },
  { rank: 32, make: 'Mitsubishi', model: 'Lancer Evolution', yearStart: 2003, yearEnd: 2015, trims: ['GSR', 'MR', 'Final Edition'] },
  { rank: 33, make: 'Ford', model: 'Ranger', yearStart: 2019, yearEnd: 2024, trims: ['XL', 'XLT', 'Lariat', 'Raptor'] },
  { rank: 34, make: 'Chevrolet', model: 'Colorado', yearStart: 2015, yearEnd: 2024, trims: ['WT', 'LT', 'Z71', 'ZR2', 'Trail Boss'] },
  { rank: 35, make: 'Subaru', model: 'BRZ', yearStart: 2013, yearEnd: 2024, trims: ['Premium', 'Limited', 'tS'] },
  { rank: 36, make: 'Audi', model: 'RS3', yearStart: 2017, yearEnd: 2024, trims: ['Base'] },
  { rank: 37, make: 'BMW', model: 'M2', yearStart: 2016, yearEnd: 2024, trims: ['Base', 'Competition', 'CS'] },
  { rank: 38, make: 'Mercedes-AMG', model: 'C63', yearStart: 2015, yearEnd: 2024, trims: ['Base', 'S'] },
  { rank: 39, make: 'Toyota', model: 'Supra', yearStart: 2020, yearEnd: 2024, trims: ['2.0', '3.0', '3.0 Premium', 'A91 Edition'] },
  { rank: 40, make: 'Toyota', model: 'Supra MK4', yearStart: 1993, yearEnd: 1998, trims: ['Base', 'Turbo'] },
  
  // Tier 5: Active Niche Communities
  { rank: 41, make: 'Porsche', model: 'Cayman', yearStart: 2014, yearEnd: 2024, trims: ['Base', 'S', 'GTS', 'GT4', 'GT4 RS'] },
  { rank: 42, make: 'Nissan', model: 'GT-R', yearStart: 2009, yearEnd: 2024, trims: ['Premium', 'Track Edition', 'NISMO'] },
  { rank: 43, make: 'Infiniti', model: 'G37', yearStart: 2008, yearEnd: 2013, trims: ['Base', 'Journey', 'x', 'Sport', 'IPL'] },
  { rank: 44, make: 'Jeep', model: 'Grand Cherokee', yearStart: 2011, yearEnd: 2024, trims: ['Laredo', 'Limited', 'Overland', 'Summit', 'SRT', 'Trackhawk'] },
  { rank: 45, make: 'Mazda', model: 'RX-7', yearStart: 1993, yearEnd: 2002, trims: ['Base', 'Touring', 'R1', 'R2'] },
  { rank: 46, make: 'MINI', model: 'Cooper', yearStart: 2014, yearEnd: 2024, trims: ['Base', 'S', 'JCW'] },
  { rank: 47, make: 'Audi', model: 'TT RS', yearStart: 2018, yearEnd: 2024, trims: ['Base'] },
  { rank: 48, make: 'Ford', model: 'Focus RS', yearStart: 2016, yearEnd: 2018, trims: ['Base'] },
  { rank: 49, make: 'Chevrolet', model: 'Camaro (Classic)', yearStart: 1967, yearEnd: 1969, trims: ['Base', 'SS', 'RS', 'Z28'] },
  { rank: 50, make: 'Ford', model: 'Mustang (Classic)', yearStart: 1965, yearEnd: 1970, trims: ['Base', 'GT', 'Mach 1', 'Boss 302', 'Boss 429'] },
  
  // Tier 6: Growing and Emerging Platforms
  { rank: 51, make: 'Honda', model: 'Civic Type R', yearStart: 2017, yearEnd: 2024, trims: ['Base', 'Limited Edition'] },
  { rank: 52, make: 'Toyota', model: 'GR Corolla', yearStart: 2023, yearEnd: 2024, trims: ['Core', 'Circuit Edition', 'Morizo Edition'] },
  { rank: 53, make: 'Kia', model: 'Stinger', yearStart: 2018, yearEnd: 2023, trims: ['GT-Line', 'GT', 'GT1', 'GT2'] },
  { rank: 54, make: 'Hyundai', model: 'Veloster N', yearStart: 2019, yearEnd: 2023, trims: ['Base'] },
  { rank: 55, make: 'Pontiac', model: 'Firebird', yearStart: 1998, yearEnd: 2002, trims: ['Base', 'Formula', 'Trans Am', 'WS6'] },
  { rank: 56, make: 'Tesla', model: 'Model 3', yearStart: 2018, yearEnd: 2024, trims: ['Standard Range', 'Long Range', 'Performance'] },
  { rank: 57, make: 'Ford', model: 'Fiesta ST', yearStart: 2014, yearEnd: 2019, trims: ['Base'] },
  { rank: 58, make: 'Mazda', model: 'Mazdaspeed3', yearStart: 2007, yearEnd: 2013, trims: ['Base', 'Touring', 'Grand Touring'] },
  { rank: 59, make: 'Nissan', model: 'Frontier', yearStart: 2022, yearEnd: 2024, trims: ['S', 'SV', 'PRO-X', 'PRO-4X'] },
  { rank: 60, make: 'Nissan', model: 'Skyline GT-R', yearStart: 1999, yearEnd: 2002, trims: ['Base', 'V-Spec', 'V-Spec II', 'Nur'] },
  
  // Tier 7: Dedicated Enthusiast Niches
  { rank: 61, make: 'Infiniti', model: 'Q50', yearStart: 2014, yearEnd: 2024, trims: ['2.0t', '3.0t', 'Red Sport 400'] },
  { rank: 62, make: 'BMW', model: 'M5', yearStart: 2012, yearEnd: 2024, trims: ['Base', 'Competition', 'CS'] },
  { rank: 63, make: 'Mazda', model: 'Mazda3', yearStart: 2019, yearEnd: 2024, trims: ['Base', 'Select', 'Preferred', 'Premium', 'Turbo'] },
  { rank: 64, make: 'Nissan', model: 'Z', yearStart: 2023, yearEnd: 2024, trims: ['Sport', 'Performance', 'NISMO'] },
  { rank: 65, make: 'Jeep', model: 'Compass', yearStart: 2017, yearEnd: 2024, trims: ['Sport', 'Latitude', 'Limited', 'Trailhawk'] },
  { rank: 66, make: 'Genesis', model: 'G70', yearStart: 2019, yearEnd: 2024, trims: ['2.0T', '3.3T'] },
  { rank: 67, make: 'Mercedes-AMG', model: 'E63', yearStart: 2018, yearEnd: 2024, trims: ['Base', 'S'] },
  { rank: 68, make: 'Lexus', model: 'IS', yearStart: 2014, yearEnd: 2024, trims: ['200t', '250', '300', '350', '350 F Sport', '500'] },
  { rank: 69, make: 'Audi', model: 'RS5', yearStart: 2018, yearEnd: 2024, trims: ['Base'] },
  { rank: 70, make: 'Chevrolet', model: 'SS', yearStart: 2014, yearEnd: 2017, trims: ['Base'] },
  
  // Tier 8: Specialty and Collector Platforms
  { rank: 71, make: 'Hyundai', model: 'Elantra N', yearStart: 2022, yearEnd: 2024, trims: ['Base'] },
  { rank: 72, make: 'Pontiac', model: 'GTO', yearStart: 2004, yearEnd: 2006, trims: ['Base'] },
  { rank: 73, make: 'Mazda', model: 'RX-8', yearStart: 2004, yearEnd: 2012, trims: ['Base', 'Touring', 'Grand Touring', 'R3'] },
  { rank: 74, make: 'Toyota', model: 'MR2', yearStart: 2000, yearEnd: 2005, trims: ['Base'] },
  { rank: 75, make: 'Dodge', model: 'Viper', yearStart: 2013, yearEnd: 2017, trims: ['GTS', 'GT', 'ACR'] },
  { rank: 76, make: 'Honda', model: 'Accord', yearStart: 2018, yearEnd: 2024, trims: ['Sport', 'Sport 2.0T', 'EX-L', 'Touring'] },
  { rank: 77, make: 'Lexus', model: 'RC F', yearStart: 2015, yearEnd: 2024, trims: ['Base', 'Track Edition'] },
  { rank: 78, make: 'Lexus', model: 'IS F', yearStart: 2008, yearEnd: 2014, trims: ['Base'] },
  { rank: 79, make: 'Acura', model: 'NSX', yearStart: 2017, yearEnd: 2022, trims: ['Base', 'Type S'] },
  { rank: 80, make: 'Porsche', model: 'Cayenne', yearStart: 2019, yearEnd: 2024, trims: ['Base', 'S', 'GTS', 'Turbo', 'Turbo GT'] },
  
  // Tier 9: Legacy and Declining Platforms
  { rank: 81, make: 'Mercedes-AMG', model: 'GT', yearStart: 2016, yearEnd: 2024, trims: ['Base', 'S', 'C', 'R', 'Black Series'] },
  { rank: 82, make: 'Dodge', model: 'Neon SRT-4', yearStart: 2003, yearEnd: 2005, trims: ['Base'] },
  { rank: 83, make: 'Subaru', model: 'Forester XT', yearStart: 2014, yearEnd: 2018, trims: ['Touring'] },
  { rank: 84, make: 'Subaru', model: 'Legacy GT', yearStart: 2005, yearEnd: 2012, trims: ['Base', 'spec.B'] },
  { rank: 85, make: 'Pontiac', model: 'G8', yearStart: 2008, yearEnd: 2009, trims: ['GT', 'GXP'] },
  { rank: 86, make: 'Mitsubishi', model: 'Eclipse GSX', yearStart: 1995, yearEnd: 1999, trims: ['Base'] },
  { rank: 87, make: 'Audi', model: 'R8', yearStart: 2008, yearEnd: 2024, trims: ['V8', 'V10', 'V10 Plus', 'V10 Performance'] },
  { rank: 88, make: 'Nissan', model: 'Titan', yearStart: 2016, yearEnd: 2024, trims: ['S', 'SV', 'Pro-4X', 'SL', 'Platinum Reserve'] },
  { rank: 89, make: 'Acura', model: 'NSX (Classic)', yearStart: 1991, yearEnd: 2005, trims: ['Base', 'Type S', 'Type S-Zero'] },
  { rank: 90, make: 'BMW', model: '5 Series', yearStart: 2017, yearEnd: 2024, trims: ['530i', '540i', 'M550i'] },
  
  // Tier 10: Micro-niche and Emerging
  { rank: 91, make: 'Toyota', model: 'Land Cruiser', yearStart: 2008, yearEnd: 2024, trims: ['Base', 'Heritage Edition'] },
  { rank: 92, make: 'Lexus', model: 'LC', yearStart: 2018, yearEnd: 2024, trims: ['500', '500h'] },
  { rank: 93, make: 'Ford', model: 'Maverick', yearStart: 2022, yearEnd: 2024, trims: ['XL', 'XLT', 'Lariat', 'Tremor'] },
  { rank: 94, make: 'Hyundai', model: 'Kona N', yearStart: 2022, yearEnd: 2024, trims: ['Base'] },
  { rank: 95, make: 'Subaru', model: 'Crosstrek', yearStart: 2018, yearEnd: 2024, trims: ['Base', 'Premium', 'Limited', 'Sport'] },
  { rank: 96, make: 'Toyota', model: 'GR86', yearStart: 2022, yearEnd: 2024, trims: ['Base', 'Premium'] },
  { rank: 97, make: 'Volkswagen', model: 'Jetta GLI', yearStart: 2019, yearEnd: 2024, trims: ['S', 'Autobahn'] },
  { rank: 98, make: 'Ford', model: 'GT', yearStart: 2017, yearEnd: 2022, trims: ['Base', 'Carbon Series', 'Heritage Edition'] },
  { rank: 99, make: 'Rivian', model: 'R1T', yearStart: 2022, yearEnd: 2024, trims: ['Explore', 'Adventure'] },
  { rank: 100, make: 'BMW', model: 'i4', yearStart: 2022, yearEnd: 2024, trims: ['eDrive40', 'M50'] },
];

/**
 * Expand a year range string into individual years
 */
function expandYearRange(yearStr) {
  if (!yearStr) return [];
  
  const currentYear = new Date().getFullYear();
  const years = [];
  
  // Handle "present"
  const cleanStr = yearStr.replace('present', currentYear.toString());
  
  // Split by dash
  const parts = cleanStr.split('-').map(p => parseInt(p.trim()));
  
  if (parts.length === 1 && !isNaN(parts[0])) {
    return [parts[0]];
  }
  
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    for (let y = parts[0]; y <= parts[1]; y++) {
      years.push(y);
    }
  }
  
  return years;
}

/**
 * Generate all YMMT combinations for a vehicle spec
 */
function generateExpectedYMMT(spec) {
  const combinations = [];
  
  for (let year = spec.yearStart; year <= spec.yearEnd; year++) {
    for (const trim of spec.trims) {
      combinations.push({
        year,
        make: spec.make,
        model: spec.model,
        trim,
        rank: spec.rank,
        key: `${year}|${spec.make}|${spec.model}|${trim}`.toLowerCase()
      });
    }
  }
  
  return combinations;
}

/**
 * Generate all YMMT combinations from a database record
 */
function generateDbYMMT(car) {
  const combinations = [];
  const years = expandYearRange(car.years);
  
  for (const year of years) {
    combinations.push({
      year,
      make: car.brand,
      model: car.model,
      trim: car.trim,
      dbName: car.name,
      key: `${year}|${car.brand}|${car.model}|${car.trim}`.toLowerCase()
    });
  }
  
  return combinations;
}

async function fetchAllCars() {
  const { data, error } = await supabase
    .from('cars')
    .select('id, name, brand, model, trim, years')
    .order('brand, model, trim, years');
  
  if (error) {
    console.error('Error fetching cars:', error);
    process.exit(1);
  }
  
  return data;
}

function normalizeForMatch(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findBestMatch(expected, dbCombinations) {
  const expMake = normalizeForMatch(expected.make);
  const expModel = normalizeForMatch(expected.model);
  const expTrim = normalizeForMatch(expected.trim);
  
  // Find all DB entries for same year and make
  const candidates = dbCombinations.filter(db => {
    if (db.year !== expected.year) return false;
    
    const dbMake = normalizeForMatch(db.make);
    if (dbMake !== expMake) return false;
    
    return true;
  });
  
  // Try to match model and trim
  for (const candidate of candidates) {
    const dbModel = normalizeForMatch(candidate.model);
    const dbTrim = normalizeForMatch(candidate.trim);
    
    // Check for model match (allowing partial)
    const modelMatch = dbModel.includes(expModel) || expModel.includes(dbModel) ||
                       dbModel.split(' ').some(w => expModel.includes(w)) ||
                       expModel.split(' ').some(w => dbModel.includes(w));
    
    if (!modelMatch) continue;
    
    // Check for trim match
    const trimMatch = dbTrim === expTrim ||
                      dbTrim.includes(expTrim) || expTrim.includes(dbTrim) ||
                      (expTrim === 'base' && dbTrim === 'standard') ||
                      (expTrim === 'standard' && dbTrim === 'base');
    
    if (trimMatch) {
      return { match: candidate, type: 'exact' };
    }
  }
  
  // If no exact match, check if at least year/make/model exists
  for (const candidate of candidates) {
    const dbModel = normalizeForMatch(candidate.model);
    const modelMatch = dbModel.includes(expModel) || expModel.includes(dbModel);
    if (modelMatch) {
      return { match: candidate, type: 'model_only' };
    }
  }
  
  return null;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║       YEAR/MAKE/MODEL/TRIM (YMMT) COVERAGE ANALYSIS                          ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  // Fetch database cars
  const dbCars = await fetchAllCars();
  console.log(`📊 Database contains ${dbCars.length} vehicle records\n`);
  
  // Expand database into YMMT combinations
  const dbCombinations = [];
  for (const car of dbCars) {
    dbCombinations.push(...generateDbYMMT(car));
  }
  console.log(`📊 Database expands to ${dbCombinations.length} YEAR/MAKE/MODEL/TRIM combinations\n`);
  
  // Generate expected YMMT combinations from Top 100
  const expectedCombinations = [];
  for (const spec of TOP_100_EXPECTED) {
    expectedCombinations.push(...generateExpectedYMMT(spec));
  }
  console.log(`📊 Top 100 expects ${expectedCombinations.length} YEAR/MAKE/MODEL/TRIM combinations\n`);
  
  // Analyze coverage
  const results = {
    exactMatch: [],
    modelOnlyMatch: [],
    missing: []
  };
  
  for (const expected of expectedCombinations) {
    const matchResult = findBestMatch(expected, dbCombinations);
    
    if (matchResult?.type === 'exact') {
      results.exactMatch.push({ expected, db: matchResult.match });
    } else if (matchResult?.type === 'model_only') {
      results.modelOnlyMatch.push({ expected, db: matchResult.match });
    } else {
      results.missing.push(expected);
    }
  }
  
  // Summary
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('                              EXECUTIVE SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
  
  const total = expectedCombinations.length;
  console.log(`✅ Exact Match:       ${results.exactMatch.length}/${total} (${(results.exactMatch.length/total*100).toFixed(1)}%)`);
  console.log(`⚠️  Model Match Only:  ${results.modelOnlyMatch.length}/${total} (${(results.modelOnlyMatch.length/total*100).toFixed(1)}%) - Have model but different trim`);
  console.log(`❌ Missing:           ${results.missing.length}/${total} (${(results.missing.length/total*100).toFixed(1)}%)\n`);
  
  // Group missing by rank tier
  const missingByTier = {};
  for (const m of results.missing) {
    const tier = Math.ceil(m.rank / 10);
    if (!missingByTier[tier]) missingByTier[tier] = [];
    missingByTier[tier].push(m);
  }
  
  console.log('Missing by Tier:');
  console.log('─────────────────────────────────────────────────────');
  for (let tier = 1; tier <= 10; tier++) {
    const count = missingByTier[tier]?.length || 0;
    const priority = tier <= 3 ? '🔴' : tier <= 6 ? '🟡' : '🟢';
    console.log(`  ${priority} Tier ${tier}: ${count} missing combinations`);
  }
  
  // Unique missing vehicles (by make/model/trim, ignoring year)
  const uniqueMissing = new Map();
  for (const m of results.missing) {
    const key = `${m.make}|${m.model}|${m.trim}`;
    if (!uniqueMissing.has(key)) {
      uniqueMissing.set(key, { ...m, years: [] });
    }
    uniqueMissing.get(key).years.push(m.year);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('                    MISSING MAKE/MODEL/TRIM COMBINATIONS');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
  
  const sortedMissing = Array.from(uniqueMissing.values()).sort((a, b) => a.rank - b.rank);
  
  for (const m of sortedMissing) {
    const tier = Math.ceil(m.rank / 10);
    const priority = tier <= 3 ? '🔴 HIGH' : tier <= 6 ? '🟡 MED' : '🟢 LOW';
    const yearRange = m.years.length > 1 
      ? `${Math.min(...m.years)}-${Math.max(...m.years)}`
      : m.years[0].toString();
    
    console.log(`#${m.rank} ${m.make} ${m.model} ${m.trim} (${yearRange}) [${priority}]`);
  }
  
  // Model-only matches (have the model but not specific trim)
  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('                  TRIM GAPS (Have Model, Missing Specific Trim)');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
  
  const trimGaps = new Map();
  for (const m of results.modelOnlyMatch) {
    const key = `${m.expected.make}|${m.expected.model}|${m.expected.trim}`;
    if (!trimGaps.has(key)) {
      trimGaps.set(key, { 
        ...m.expected, 
        years: [],
        existingTrims: new Set()
      });
    }
    trimGaps.get(key).years.push(m.expected.year);
    trimGaps.get(key).existingTrims.add(m.db.trim);
  }
  
  const sortedTrimGaps = Array.from(trimGaps.values()).sort((a, b) => a.rank - b.rank);
  
  for (const m of sortedTrimGaps.slice(0, 30)) {
    const tier = Math.ceil(m.rank / 10);
    const priority = tier <= 3 ? '🔴' : tier <= 6 ? '🟡' : '🟢';
    const yearRange = m.years.length > 1 
      ? `${Math.min(...m.years)}-${Math.max(...m.years)}`
      : m.years[0].toString();
    
    console.log(`${priority} #${m.rank} ${m.make} ${m.model} - Missing: "${m.trim}" (${yearRange})`);
    console.log(`         Have: ${Array.from(m.existingTrims).join(', ')}`);
  }
  
  if (sortedTrimGaps.length > 30) {
    console.log(`\n   ... and ${sortedTrimGaps.length - 30} more trim gaps`);
  }
  
  // Export to CSV
  const csvRows = [
    'Status,Priority,Rank,Year,Make,Model,Trim,YearRange'
  ];
  
  // Add missing
  for (const m of sortedMissing) {
    const tier = Math.ceil(m.rank / 10);
    const priority = tier <= 3 ? 'HIGH' : tier <= 6 ? 'MEDIUM' : 'LOW';
    const yearRange = m.years.length > 1 
      ? `${Math.min(...m.years)}-${Math.max(...m.years)}`
      : m.years[0].toString();
    
    for (const year of m.years) {
      csvRows.push(`MISSING,${priority},${m.rank},${year},"${m.make}","${m.model}","${m.trim}","${yearRange}"`);
    }
  }
  
  // Add trim gaps
  for (const m of sortedTrimGaps) {
    const tier = Math.ceil(m.rank / 10);
    const priority = tier <= 3 ? 'HIGH' : tier <= 6 ? 'MEDIUM' : 'LOW';
    const yearRange = m.years.length > 1 
      ? `${Math.min(...m.years)}-${Math.max(...m.years)}`
      : m.years[0].toString();
    
    for (const year of m.years) {
      csvRows.push(`TRIM_GAP,${priority},${m.rank},${year},"${m.make}","${m.model}","${m.trim}","${yearRange}"`);
    }
  }
  
  const csvPath = 'audit/ymmt-coverage-gaps.csv';
  fs.writeFileSync(csvPath, csvRows.join('\n'));
  console.log(`\n\n📁 Full YMMT gaps exported to: ${csvPath}`);
  
  // Export summary JSON
  const summaryPath = 'audit/ymmt-coverage-summary.json';
  fs.writeFileSync(summaryPath, JSON.stringify({
    summary: {
      totalExpected: total,
      exactMatch: results.exactMatch.length,
      modelOnlyMatch: results.modelOnlyMatch.length,
      missing: results.missing.length,
      databaseRecords: dbCars.length,
      databaseCombinations: dbCombinations.length
    },
    missingByTier,
    uniqueMissing: sortedMissing,
    trimGaps: sortedTrimGaps
  }, null, 2));
  console.log(`📁 Summary JSON exported to: ${summaryPath}`);
  
  // What's in DB but NOT in top 100?
  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('                    DATABASE VEHICLES NOT IN TOP 100');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
  
  const top100Makes = new Set(TOP_100_EXPECTED.map(s => normalizeForMatch(s.make)));
  const top100Models = new Set(TOP_100_EXPECTED.map(s => `${normalizeForMatch(s.make)}|${normalizeForMatch(s.model)}`));
  
  const notInTop100 = dbCars.filter(car => {
    const make = normalizeForMatch(car.brand);
    const model = `${make}|${normalizeForMatch(car.model)}`;
    
    // Check if this make/model is roughly in the top 100
    const makeMatch = top100Makes.has(make);
    if (!makeMatch) return true;
    
    // Check model match (fuzzy)
    let hasModelMatch = false;
    for (const [_, spec] of TOP_100_EXPECTED.entries()) {
      if (normalizeForMatch(spec.make) !== make) continue;
      const specModel = normalizeForMatch(spec.model);
      const carModel = normalizeForMatch(car.model);
      if (carModel.includes(specModel) || specModel.includes(carModel)) {
        hasModelMatch = true;
        break;
      }
    }
    
    return !hasModelMatch;
  });
  
  console.log(`Found ${notInTop100.length} vehicles in DB that aren't in Top 100 list:`);
  for (const car of notInTop100.slice(0, 20)) {
    console.log(`  - ${car.brand} ${car.model} ${car.trim} (${car.years})`);
  }
  if (notInTop100.length > 20) {
    console.log(`  ... and ${notInTop100.length - 20} more`);
  }
}

main().catch(console.error);
