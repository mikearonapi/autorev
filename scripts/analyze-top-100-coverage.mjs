#!/usr/bin/env node

/**
 * Top 100 Modification Market Vehicle Coverage Analysis
 * 
 * Compares the Top 100 vehicles by US modification market size
 * against the AutoRev database to identify coverage gaps.
 * 
 * Usage: node scripts/analyze-top-100-coverage.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Top 100 vehicles from research document with expanded year/make/model/trim combinations
// Each entry includes: name, make, model patterns, typical years, and expected trims
const TOP_100_VEHICLES = [
  // Tier 1: Market Leaders
  { rank: 1, name: 'Ford F-150', make: 'Ford', model: 'F-150', years: ['2015-2020', '2021-2024'], trims: ['Standard', 'Raptor', 'Raptor R', 'Lightning'] },
  { rank: 2, name: 'Jeep Wrangler (JK/JL)', make: 'Jeep', models: ['JK Wrangler', 'JL Wrangler'], years: ['2007-2018', '2018-2024'], trims: ['Standard', 'Rubicon 392'] },
  { rank: 3, name: 'Ford Mustang (all generations)', make: 'Ford', models: ['Mustang', 'Mustang Shelby', 'Fox Body Mustang', 'SN95 Mustang'], years: ['1967-1968', '1987-1993', '1996-1998', '2003-2004', '2012-2013', '2015-2023', '2016-2020', '2018-2023', '2020-2022', '2024-present'], trims: ['Fastback', 'GT', 'EcoBoost', 'Boss 302', 'GT PP2', 'Mach 1', 'SVT Cobra', 'SVT Cobra Terminator', 'GT350', 'GT500'] },
  { rank: 4, name: 'Chevrolet Silverado 1500', make: 'Chevrolet', model: 'Silverado 1500', years: ['2019-2024'], trims: ['Standard', 'ZR2'] },
  { rank: 5, name: 'Volkswagen Golf GTI (Mk4-Mk8)', make: 'Volkswagen', models: ['Mk4 GTI', 'Mk5 GTI', 'Mk6 GTI', 'Mk7 GTI', 'Mk8 GTI'], years: ['1999-2005', '2006-2009', '2010-2014', '2015-2021', '2022-2024'], trims: ['Standard'] },
  { rank: 6, name: 'Chevrolet Corvette (C5-C8)', make: 'Chevrolet', models: ['C5 Corvette', 'C6 Corvette', 'C7 Corvette', 'C8 Corvette'], years: ['2001-2004', '2006-2013', '2010-2013', '2015-2019', '2017-2019', '2020-2024', '2023-2024'], trims: ['Z06', 'Grand Sport', 'Stingray'] },
  { rank: 7, name: 'Toyota Tacoma', make: 'Toyota', models: ['Tacoma', 'N300 Tacoma', 'Tacoma 3rd Gen'], years: ['2016-2023', '2024-present'], trims: ['Standard', 'TRD Pro'] },
  { rank: 8, name: 'Subaru WRX/STI', make: 'Subaru', models: ['GC8 Impreza WRX', 'GD Impreza WRX', 'GR/GV WRX', 'VA WRX'], years: ['1992-2000', '1994-2000', '2004-2007', '2008-2014', '2015-2021'], trims: ['Standard', 'STI'] },
  { rank: 9, name: 'Ram 1500', make: 'Ram', model: '1500', years: ['2019-2024'], trims: ['Standard', 'Rebel', 'TRX'] },
  { rank: 10, name: 'BMW 3 Series (E46/E90/F30/G20)', make: 'BMW', models: ['E46 M3', 'E90 335i', 'F30 340i', 'G20 3 Series'], years: ['2001-2006', '2007-2013', '2016-2019', '2019-2024'], trims: ['Standard', 'M340i'] },
  
  // Tier 2: Major Platforms
  { rank: 11, name: 'Chevrolet Camaro (5th/6th gen)', make: 'Chevrolet', models: ['Camaro', 'Camaro LS1', 'Camaro 1969'], years: ['1969', '1970-1973', '1998-2002', '2017-2023'], trims: ['SS', 'SS 1LE', 'Z28', 'ZL1'] },
  { rank: 12, name: 'Honda Civic (Si/Type R)', make: 'Honda', models: ['EM1 Civic', 'EP3 Civic', 'FG2 Civic', 'FK8 Civic', 'FL5 Civic'], years: ['1999-2000', '2002-2005', '2006-2011', '2017-2021', '2023-2024'], trims: ['Si', 'Type R'] },
  { rank: 13, name: 'Ford Bronco (2021+)', make: 'Ford', model: 'Bronco', years: ['2021-2024'], trims: ['Standard', 'Raptor'] },
  { rank: 14, name: 'Ram 2500/3500 (Cummins)', make: 'Ram', models: ['2500'], years: ['2017-2024', '2019-2024'], trims: ['Cummins', 'Power Wagon'] },
  { rank: 15, name: 'Ford F-250/F-350 Super Duty', make: 'Ford', model: 'F-250', years: ['2017-2024'], trims: ['Power Stroke'] },
  { rank: 16, name: 'Mazda MX-5 Miata (NA-ND)', make: 'Mazda', models: ['NA MX-5 Miata', 'NB MX-5 Miata', 'NC MX-5 Miata', 'ND MX-5 Miata'], years: ['1990-1997', '1999-2005', '2006-2015', '2016-2024'], trims: ['Standard'] },
  { rank: 17, name: 'Toyota 4Runner', make: 'Toyota', model: '4Runner', years: ['2015-2024'], trims: ['TRD Pro'] },
  { rank: 18, name: 'Dodge Challenger', make: 'Dodge', model: 'Challenger', years: ['2011-2023', '2015-2023'], trims: ['SRT 392', 'Hellcat'] },
  { rank: 19, name: 'Golf R / R32', make: 'Volkswagen', models: ['Mk4 R32', 'Mk7 Golf', 'Mk8 Golf'], years: ['2003-2004', '2015-2019', '2022-2024'], trims: ['Standard', 'R'] },
  { rank: 20, name: 'BMW M3/M4 (E36-G80)', make: 'BMW', models: ['E30 M3', 'E36 M3', 'E46 M3', 'E92 M3', 'F80 M3', 'F82 M4', 'G80 M3', 'M4'], years: ['1988-1991', '1995-1999', '2001-2006', '2008-2013', '2015-2018', '2015-2020', '2019-2021', '2021-2024', '2022-2023'], trims: ['Standard', 'Competition', 'CSL'] },
  
  // Tier 3: Strong Enthusiast Platforms
  { rank: 21, name: 'Porsche 911 (996-992)', make: 'Porsche', models: ['996 911', '997 911', '991 911', '991.1 Carrera', '991.2 911', '992 911', '997.1 911', '997.2 911', '997.2 Carrera'], years: ['2004-2005', '2007-2011', '2007-2009', '2009-2012', '2010-2013', '2012-2016', '2017-2019', '2020-2024', '2021-2024', '2022-2024'], trims: ['GT3', 'GT2 RS', 'GT3 RS', 'Turbo', 'Turbo S', 'S'] },
  { rank: 22, name: 'Dodge Charger', make: 'Dodge', model: 'Charger', years: ['2012-2023', '2015-2023'], trims: ['SRT 392', 'Hellcat'] },
  { rank: 23, name: 'Acura RSX / Integra (DC2/DC5)', make: 'Acura', models: ['RSX', 'Integra'], years: ['1997-2001', '2002-2006', '2024-present'], trims: ['Type R', 'Type-S', 'Type S'] },
  { rank: 24, name: 'GMC Sierra', make: 'GMC', models: ['Sierra', 'Sierra 1500'], years: ['2019-2024', '2022-2024'], trims: ['Standard', 'AT4X'] },
  { rank: 25, name: 'Audi S4/A4 (B5-B9)', make: 'Audi', models: ['B5 S4', 'B6 S4', 'B7 S4', 'B8 A4', 'B8 S4', 'B8.5 A4', 'B9 S4'], years: ['1997-2002', '2004-2005', '2005-2008', '2009-2012', '2010-2016', '2013-2016', '2017-2024'], trims: ['Standard', '2.0T'] },
  { rank: 26, name: 'Nissan 240SX/Silvia (S13-S15)', make: 'Nissan', models: ['S13 240SX', 'S14 240SX', 'S15 Silvia'], years: ['1989-1994', '1995-1998', '1999-2002'], trims: ['Standard'] },
  { rank: 27, name: 'Toyota Tundra', make: 'Toyota', models: ['Tundra 3rd Gen', 'XK70 Tundra'], years: ['2022-2024'], trims: ['Standard', 'TRD Pro'] },
  { rank: 28, name: 'Ford Focus ST', make: 'Ford', models: ['Mk3 Focus'], years: ['2013-2018'], trims: ['ST'] },
  { rank: 29, name: 'Nissan 350Z/370Z', make: 'Nissan', models: ['350Z', '370Z'], years: ['2003-2008', '2009-2020'], trims: ['Standard', 'NISMO'] },
  { rank: 30, name: 'Jeep Gladiator', make: 'Jeep', model: 'Gladiator', years: ['2020-2024'], trims: ['Standard', 'Rubicon', 'Mojave'] },
  
  // Tier 4: Established Modification Communities
  { rank: 31, name: 'Honda S2000', make: 'Honda', model: 'S2000', years: ['1999-2009'], trims: ['Standard'] },
  { rank: 32, name: 'Mitsubishi Lancer Evolution', make: 'Mitsubishi', models: ['Lancer Evolution VIII', 'Lancer Evolution VIII/IX', 'Lancer Evolution IX', 'Lancer Evolution X'], years: ['2003-2005', '2003-2007', '2005-2007', '2008-2015'], trims: ['Standard'] },
  { rank: 33, name: 'Ford Ranger', make: 'Ford', models: ['Ranger', 'T6 Ranger'], years: ['2019-2024', '2023-present'], trims: ['Facelift', 'Raptor'] },
  { rank: 34, name: 'Chevrolet Colorado / GMC Canyon', make: 'Chevrolet', models: ['Colorado'], years: ['2017-2024'], trims: ['ZR2'] },
  { rank: 34.1, name: 'GMC Canyon', make: 'GMC', models: ['Canyon'], years: ['2017-2024'], trims: ['AT4'] },
  { rank: 35, name: 'BRZ/86/FR-S (FT86 platform)', make: 'Subaru', models: ['BRZ', 'BRZ 2nd Gen'], years: ['2013-2020', '2022-2024'], trims: ['Standard'] },
  { rank: 35.1, name: 'Toyota 86/GR86', make: 'Toyota', models: ['86', 'GR86'], years: ['2013-2020', '2022-2024'], trims: ['Standard'] },
  { rank: 36, name: 'Audi RS3/S3/A3', make: 'Audi', models: ['8V A3', '8V RS3', '8Y RS3'], years: ['2014-2020', '2017-2020', '2022-2024'], trims: ['1.8 TFSI', 'Standard'] },
  { rank: 37, name: 'BMW M2/1 Series', make: 'BMW', models: ['1 Series M', '135i', 'M2', 'G87 M2'], years: ['2008-2010', '2011', '2019-2021', '2023-2024'], trims: ['Coupe', 'N54', 'Competition', 'Standard'] },
  { rank: 38, name: 'Mercedes-AMG C63', make: 'Mercedes-AMG', models: ['W204 C63 AMG', 'W205 C63'], years: ['2008-2014', '2015-2021'], trims: ['Standard'] },
  { rank: 39, name: 'Toyota Supra MkIV (A80)', make: 'Toyota', model: 'A80 Supra', years: ['1993-2002'], trims: ['Turbo'] },
  { rank: 40, name: 'Toyota GR Supra (A90/A91)', make: 'Toyota', model: 'GR Supra', years: ['2020-2024'], trims: ['Standard'] },
  
  // Tier 5: Active Niche Communities
  { rank: 41, name: 'Porsche Cayman/Boxster', make: 'Porsche', models: ['986 Boxster', '987 Boxster', '981 Boxster', '981 Cayman', '987.2 Cayman', '718 Boxster', '718 Cayman'], years: ['1997-2004', '2005-2012', '2009-2012', '2012-2016', '2013-2016', '2015-2016', '2020-2024', '2022-2024'], trims: ['S', 'GTS', 'GT4', 'GT4 RS', 'GTS 4.0'] },
  { rank: 42, name: 'Nissan GT-R R35', make: 'Nissan', models: ['GT-R', 'R35 GT-R'], years: ['2014-2024', '2017-2024'], trims: ['Standard', 'NISMO'] },
  { rank: 43, name: 'Infiniti G35/G37', make: 'Infiniti', models: ['G35', 'G37'], years: ['2003-2007', '2008-2013', '2009-2013'], trims: ['Coupe', 'Sedan'] },
  { rank: 44, name: 'Jeep Cherokee / Grand Cherokee', make: 'Jeep', models: ['Grand Cherokee'], years: ['2011-2024', '2018-2021'], trims: ['Standard', 'Trackhawk'] },
  { rank: 45, name: 'Mazda RX-7 (FD)', make: 'Mazda', model: 'FD3S RX-7', years: ['1992-2002'], trims: ['Standard'] },
  { rank: 46, name: 'MINI Cooper S / JCW', make: 'MINI', models: ['R53 Cooper', 'R56 Cooper', 'F56 Cooper'], years: ['2002-2006', '2007-2013', '2014-2024'], trims: ['S', 'John Cooper Works'] },
  { rank: 47, name: 'Audi TT/TT RS', make: 'Audi', models: ['8J TT', '8S TT'], years: ['2012-2013', '2018-2024'], trims: ['RS'] },
  { rank: 48, name: 'Ford Focus RS', make: 'Ford', model: 'Focus', years: ['2016-2018'], trims: ['RS'] },
  { rank: 49, name: 'Classic Camaro (1967-1981)', make: 'Chevrolet', models: ['Camaro 1969', 'Camaro'], years: ['1969', '1970-1973'], trims: ['SS', 'Z28'] },
  { rank: 50, name: 'Classic Mustang (1964-1973)', make: 'Ford', model: 'Mustang', years: ['1967-1968'], trims: ['Fastback'] },
  
  // Tier 6: Growing and Emerging Platforms
  { rank: 51, name: 'Honda Civic Type R (FK8/FL5)', make: 'Honda', models: ['FK8 Civic', 'FL5 Civic'], years: ['2017-2021', '2023-2024'], trims: ['Type R'] },
  { rank: 52, name: 'Toyota GR Corolla', make: 'Toyota', model: 'GR Corolla', years: ['2023-2024'], trims: ['Standard'] },
  { rank: 53, name: 'Kia Stinger', make: 'Kia', model: 'Stinger', years: ['2018-2023'], trims: ['GT'] },
  { rank: 54, name: 'Hyundai Veloster N', make: 'Hyundai', model: 'Veloster', years: ['2019-2023'], trims: ['N'] },
  { rank: 55, name: 'Pontiac Firebird/Trans Am', make: 'Pontiac', model: 'Firebird', years: ['1998-2002'], trims: ['Trans Am WS6'] },
  { rank: 56, name: 'Tesla Model 3/Model Y', make: 'Tesla', models: ['Model 3', 'Model Y'], years: ['2018-2024', '2020-2024'], trims: ['Performance'] },
  { rank: 57, name: 'Ford Fiesta ST', make: 'Ford', model: 'Fiesta', years: ['2013-2019'], trims: ['ST'], missing: true },
  { rank: 58, name: 'Mazdaspeed 3', make: 'Mazda', model: 'BL Mazdaspeed3', years: ['2007-2013'], trims: ['Standard'] },
  { rank: 59, name: 'Nissan Frontier', make: 'Nissan', model: 'D23 Frontier', years: ['2022-2024'], trims: ['Standard'] },
  { rank: 60, name: 'Nissan Skyline GT-R (R32-R34)', make: 'Nissan', models: ['R32 Skyline', 'R33 Skyline', 'R34 Skyline'], years: ['1989-1994', '1995-1998', '1999-2002'], trims: ['GT-R'] },
  
  // Tier 7: Dedicated Enthusiast Niches
  { rank: 61, name: 'Q50/Q60 Red Sport', make: 'Infiniti', models: ['Q50', 'Q60'], years: ['2016-2024', '2017-2024'], trims: ['Red Sport 400'] },
  { rank: 62, name: 'BMW M5 (E39-F90)', make: 'BMW', models: ['E39 M5', 'E60 M5', 'F10 M5', 'F90 M5'], years: ['1999-2003', '2006-2010', '2014-2016', '2018-2024'], trims: ['Standard', 'Competition'] },
  { rank: 63, name: 'Mazda 3 (standard)', make: 'Mazda', model: '3', years: ['2021-2024'], trims: ['2.5 Turbo'] },
  { rank: 64, name: 'Nissan Z (400Z)', make: 'Nissan', model: 'RZ34 Z', years: ['2023-2024'], trims: ['Standard'] },
  { rank: 65, name: 'Jeep Renegade/Compass', make: 'Jeep', models: ['Renegade', 'Compass'], years: ['2015-2024'], trims: ['Standard'], missing: true },
  { rank: 66, name: 'Genesis G70', make: 'Genesis', model: 'G70', years: ['2019-2024'], trims: ['3.3T'] },
  { rank: 67, name: 'Mercedes-AMG E63', make: 'Mercedes-AMG', models: ['W212 E63', 'W213 E63'], years: ['2012-2016', '2018-2024'], trims: ['Standard', 'S'] },
  { rank: 68, name: 'Lexus IS (IS300/IS350)', make: 'Lexus', models: ['XE10 IS', 'XE20 IS', 'XE30 IS'], years: ['2001-2005', '2006-2013', '2014-2020'], trims: ['300', '350', '350 F Sport'] },
  { rank: 69, name: 'Audi RS4/RS5', make: 'Audi', models: ['B8 RS5', 'B9 RS5'], years: ['2013-2015', '2018-2024'], trims: ['Standard'] },
  { rank: 70, name: 'Chevrolet SS (2014-2017)', make: 'Chevrolet', model: 'SS', years: ['2014-2017'], trims: ['Standard'] },
  
  // Tier 8: Specialty and Collector Platforms
  { rank: 71, name: 'Hyundai Elantra N', make: 'Hyundai', model: 'Elantra', years: ['2022-2024'], trims: ['N'] },
  { rank: 72, name: 'Pontiac GTO (2004-2006)', make: 'Pontiac', model: 'GTO', years: ['2004-2006'], trims: ['Standard'], missing: true },
  { rank: 73, name: 'Mazda RX-8', make: 'Mazda', model: 'RX-8', years: ['2004-2012'], trims: ['Standard'] },
  { rank: 74, name: 'Toyota MR2', make: 'Toyota', models: ['SW20 MR2', 'ZZW30 MR2'], years: ['1991-1995', '1999-2007'], trims: ['Turbo', 'Spyder'] },
  { rank: 75, name: 'Dodge Viper', make: 'Dodge', model: 'Viper', years: ['2013-2017'], trims: ['Standard'] },
  { rank: 76, name: 'Honda Accord (2.0T)', make: 'Honda', model: 'Accord', years: ['2018-2022'], trims: ['2.0T Sport'] },
  { rank: 77, name: 'Lexus RC F', make: 'Lexus', model: 'RC F', years: ['2015-2022'], trims: ['Standard'] },
  { rank: 78, name: 'Lexus IS F', make: 'Lexus', model: 'IS-F', years: ['2008-2014'], trims: ['Standard'] },
  { rank: 79, name: 'Acura Integra (2023+)', make: 'Acura', model: 'Integra', years: ['2024-present'], trims: ['Type S'] },
  { rank: 80, name: 'Porsche Cayenne', make: 'Porsche', models: ['Cayenne'], years: ['2011-2024'], trims: ['Standard', 'Turbo', 'GTS'], missing: true },
  
  // Tier 9: Legacy and Declining Platforms
  { rank: 81, name: 'Mercedes-AMG GT', make: 'Mercedes-AMG', models: ['GT', 'C190 GT'], years: ['2015-2020', '2017-2021', '2020-2022'], trims: ['Standard', 'R', 'Black Series'] },
  { rank: 82, name: 'Dodge SRT-4', make: 'Dodge', model: 'SRT-4', years: ['2003-2005'], trims: ['Standard'] },
  { rank: 83, name: 'Subaru Forester XT', make: 'Subaru', model: 'Forester', years: ['2004-2008'], trims: ['XT'] },
  { rank: 84, name: 'Subaru Legacy GT', make: 'Subaru', model: 'Legacy GT', years: ['2006-2009'], trims: ['Spec.B'] },
  { rank: 85, name: 'Pontiac G8 GT/GXP', make: 'Pontiac', model: 'G8', years: ['2008-2009', '2009'], trims: ['GT', 'GXP'] },
  { rank: 86, name: 'Mitsubishi Eclipse (DSM)', make: 'Mitsubishi', model: '2G Eclipse', years: ['1995-1999'], trims: ['GSX'] },
  { rank: 87, name: 'Audi R8', make: 'Audi', model: 'R8', years: ['2008-2015', '2010-2015'], trims: ['V8', 'V10'] },
  { rank: 88, name: 'Nissan Titan', make: 'Nissan', model: 'Titan', years: ['2016-2024'], trims: ['Standard'], missing: true },
  { rank: 89, name: 'Acura NSX (Original)', make: 'Acura', model: 'NA1 NSX', years: ['1991-2005'], trims: ['Standard'] },
  { rank: 90, name: 'BMW 5 Series (non-M)', make: 'BMW', models: ['5 Series'], years: ['2017-2024'], trims: ['Standard'], missing: true },
  
  // Tier 10: Micro-niche and Emerging
  { rank: 91, name: 'Toyota Land Cruiser', make: 'Toyota', model: 'Land Cruiser 200 Series', years: ['2008-2021'], trims: ['Standard'] },
  { rank: 92, name: 'Lexus LC', make: 'Lexus', model: 'LC', years: ['2018-2024'], trims: ['500'] },
  { rank: 93, name: 'Ford Maverick', make: 'Ford', model: 'Maverick', years: ['2022-2024'], trims: ['Standard'] },
  { rank: 94, name: 'Hyundai Kona N', make: 'Hyundai', model: 'Kona', years: ['2022-2024'], trims: ['N'] },
  { rank: 95, name: 'Subaru Crosstrek', make: 'Subaru', model: 'Crosstrek', years: ['2018-2024'], trims: ['Standard'] },
  { rank: 96, name: 'Toyota GR86 (2nd gen)', make: 'Toyota', model: 'GR86', years: ['2022-2024'], trims: ['Standard'] },
  { rank: 97, name: 'VW Jetta GLI', make: 'Volkswagen', models: ['Mk6 Jetta', 'Mk7 Jetta'], years: ['2012-2018', '2019-2024'], trims: ['GLI'] },
  { rank: 98, name: 'Ford GT', make: 'Ford', model: 'GT', years: ['2005-2006', '2017-2022'], trims: ['Standard'], missing: true },
  { rank: 99, name: 'Rivian R1T/R1S', make: 'Rivian', models: ['R1T', 'R1S'], years: ['2022-2024'], trims: ['Standard'] },
  { rank: 100, name: 'BMW i4 M50 / iX', make: 'BMW', model: 'i4', years: ['2022-2024'], trims: ['M50'] },
];

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

function normalizeString(str) {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function findMatchingCars(vehicle, dbCars) {
  const matches = [];
  const makes = [vehicle.make];
  const models = vehicle.models || [vehicle.model];
  
  for (const car of dbCars) {
    const carBrand = normalizeString(car.brand);
    const carModel = normalizeString(car.model);
    const carTrim = normalizeString(car.trim);
    
    const makeMatch = makes.some(m => normalizeString(m) === carBrand);
    if (!makeMatch) continue;
    
    const modelMatch = models.some(m => {
      const normModel = normalizeString(m);
      return carModel.includes(normModel) || normModel.includes(carModel);
    });
    
    if (modelMatch) {
      matches.push(car);
    }
  }
  
  return matches;
}

function analyzeGaps(vehicle, matches) {
  const gaps = [];
  const expectedTrims = vehicle.trims || ['Standard'];
  const expectedYears = vehicle.years || [];
  
  // Check for missing trims
  for (const trim of expectedTrims) {
    const hasTrim = matches.some(m => 
      normalizeString(m.trim).includes(normalizeString(trim)) ||
      normalizeString(trim).includes(normalizeString(m.trim))
    );
    if (!hasTrim) {
      gaps.push({ type: 'trim', value: trim });
    }
  }
  
  // Check for year coverage
  for (const yearRange of expectedYears) {
    const [startYear, endYear] = yearRange.split('-').map(y => 
      y === 'present' ? new Date().getFullYear() : parseInt(y)
    );
    
    const hasYearCoverage = matches.some(m => {
      if (!m.years) return false;
      const [mStart, mEnd] = m.years.split('-').map(y => 
        y === 'present' ? new Date().getFullYear() : parseInt(y)
      );
      // Check for any overlap
      return mStart <= endYear && mEnd >= startYear;
    });
    
    if (!hasYearCoverage) {
      gaps.push({ type: 'years', value: yearRange });
    }
  }
  
  return gaps;
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║        TOP 100 MODIFICATION MARKET VEHICLE COVERAGE ANALYSIS                 ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  
  const dbCars = await fetchAllCars();
  console.log(`📊 Database contains ${dbCars.length} vehicles\n`);
  
  const results = {
    fullCoverage: [],
    partialCoverage: [],
    noCoverage: [],
    byTier: {}
  };
  
  for (const vehicle of TOP_100_VEHICLES) {
    const tier = Math.ceil(vehicle.rank / 10);
    if (!results.byTier[tier]) {
      results.byTier[tier] = { full: 0, partial: 0, missing: 0 };
    }
    
    if (vehicle.missing) {
      results.noCoverage.push({
        rank: vehicle.rank,
        name: vehicle.name,
        make: vehicle.make,
        models: vehicle.models || [vehicle.model],
        expectedTrims: vehicle.trims,
        expectedYears: vehicle.years,
        matches: [],
        gaps: [{ type: 'vehicle', value: 'Not in database' }]
      });
      results.byTier[tier].missing++;
      continue;
    }
    
    const matches = findMatchingCars(vehicle, dbCars);
    const gaps = analyzeGaps(vehicle, matches);
    
    const result = {
      rank: vehicle.rank,
      name: vehicle.name,
      make: vehicle.make,
      models: vehicle.models || [vehicle.model],
      expectedTrims: vehicle.trims,
      expectedYears: vehicle.years,
      matches: matches.map(m => ({
        name: m.name,
        model: m.model,
        trim: m.trim,
        years: m.years
      })),
      gaps
    };
    
    if (matches.length === 0) {
      results.noCoverage.push(result);
      results.byTier[tier].missing++;
    } else if (gaps.length > 0) {
      results.partialCoverage.push(result);
      results.byTier[tier].partial++;
    } else {
      results.fullCoverage.push(result);
      results.byTier[tier].full++;
    }
  }
  
  // Summary statistics
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('                              EXECUTIVE SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
  
  const total = TOP_100_VEHICLES.length;
  console.log(`✅ Full Coverage:    ${results.fullCoverage.length}/${total} (${(results.fullCoverage.length/total*100).toFixed(1)}%)`);
  console.log(`⚠️  Partial Coverage: ${results.partialCoverage.length}/${total} (${(results.partialCoverage.length/total*100).toFixed(1)}%)`);
  console.log(`❌ No Coverage:      ${results.noCoverage.length}/${total} (${(results.noCoverage.length/total*100).toFixed(1)}%)\n`);
  
  // Coverage by tier
  console.log('Coverage by Tier (Tier 1 = Most Important Markets):');
  console.log('─────────────────────────────────────────────────────');
  for (let tier = 1; tier <= 10; tier++) {
    const t = results.byTier[tier] || { full: 0, partial: 0, missing: 0 };
    const tierTotal = t.full + t.partial + t.missing;
    const coverage = ((t.full + t.partial * 0.5) / tierTotal * 100).toFixed(0);
    console.log(`  Tier ${tier}: ${t.full} full, ${t.partial} partial, ${t.missing} missing (${coverage}% effective coverage)`);
  }
  
  // Priority gaps (Tier 1-3 missing or partial)
  console.log('\n═══════════════════════════════════════════════════════════════════════════════');
  console.log('                      HIGH PRIORITY GAPS (Tier 1-3)');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
  
  const highPriorityGaps = [...results.noCoverage, ...results.partialCoverage]
    .filter(v => v.rank <= 30)
    .sort((a, b) => a.rank - b.rank);
  
  for (const vehicle of highPriorityGaps) {
    console.log(`#${vehicle.rank} ${vehicle.name}`);
    console.log(`   Make: ${vehicle.make}`);
    console.log(`   Models: ${vehicle.models.join(', ')}`);
    if (vehicle.matches.length > 0) {
      console.log(`   Current coverage: ${vehicle.matches.length} variants`);
      for (const m of vehicle.matches) {
        console.log(`     - ${m.name} (${m.years})`);
      }
    }
    console.log(`   Gaps:`);
    for (const gap of vehicle.gaps) {
      console.log(`     - Missing ${gap.type}: ${gap.value}`);
    }
    console.log('');
  }
  
  // All missing vehicles
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('                         COMPLETELY MISSING VEHICLES');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
  
  for (const vehicle of results.noCoverage.sort((a, b) => a.rank - b.rank)) {
    const tier = Math.ceil(vehicle.rank / 10);
    const priority = tier <= 3 ? '🔴 HIGH' : tier <= 6 ? '🟡 MED' : '🟢 LOW';
    console.log(`#${vehicle.rank} ${vehicle.name} [${priority}]`);
    console.log(`   Make: ${vehicle.make}, Models: ${vehicle.models.join(', ')}`);
    console.log(`   Expected trims: ${(vehicle.expectedTrims || ['Standard']).join(', ')}`);
    console.log(`   Expected years: ${(vehicle.expectedYears || ['Various']).join(', ')}`);
    console.log('');
  }
  
  // Vehicles to add recommendations
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('                        RECOMMENDED ADDITIONS BY PRIORITY');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
  
  // Generate specific recommendations
  const recommendations = [];
  
  for (const vehicle of [...results.noCoverage, ...results.partialCoverage].sort((a, b) => a.rank - b.rank)) {
    const tier = Math.ceil(vehicle.rank / 10);
    const priority = tier <= 3 ? 'HIGH' : tier <= 6 ? 'MEDIUM' : 'LOW';
    
    if (vehicle.matches.length === 0) {
      // Completely missing - add all variants
      const models = vehicle.models || [vehicle.model];
      const trims = vehicle.expectedTrims || ['Standard'];
      const years = vehicle.expectedYears || ['2020-2024'];
      
      for (const model of models) {
        for (const trim of trims) {
          for (const yearRange of years) {
            recommendations.push({
              priority,
              rank: vehicle.rank,
              make: vehicle.make,
              model,
              trim,
              years: yearRange,
              status: 'NEW'
            });
          }
        }
      }
    } else {
      // Partial coverage - add missing trims/years
      for (const gap of vehicle.gaps) {
        if (gap.type === 'trim') {
          recommendations.push({
            priority,
            rank: vehicle.rank,
            make: vehicle.make,
            model: (vehicle.models || [vehicle.model])[0],
            trim: gap.value,
            years: (vehicle.expectedYears || ['2020-2024'])[0],
            status: 'ADD_TRIM'
          });
        } else if (gap.type === 'years') {
          recommendations.push({
            priority,
            rank: vehicle.rank,
            make: vehicle.make,
            model: (vehicle.models || [vehicle.model])[0],
            trim: (vehicle.expectedTrims || ['Standard'])[0],
            years: gap.value,
            status: 'ADD_YEARS'
          });
        }
      }
    }
  }
  
  // Output recommendations grouped by priority
  for (const priorityLevel of ['HIGH', 'MEDIUM', 'LOW']) {
    const priorityRecs = recommendations.filter(r => r.priority === priorityLevel);
    if (priorityRecs.length === 0) continue;
    
    console.log(`\n${priorityLevel} PRIORITY (${priorityRecs.length} additions needed):`);
    console.log('─────────────────────────────────────────────────────');
    
    for (const rec of priorityRecs.slice(0, priorityLevel === 'HIGH' ? 50 : 20)) {
      const statusIcon = rec.status === 'NEW' ? '🆕' : rec.status === 'ADD_TRIM' ? '➕' : '📅';
      console.log(`  ${statusIcon} #${rec.rank} ${rec.make} ${rec.model} ${rec.trim} (${rec.years})`);
    }
    
    if (priorityRecs.length > (priorityLevel === 'HIGH' ? 50 : 20)) {
      console.log(`  ... and ${priorityRecs.length - (priorityLevel === 'HIGH' ? 50 : 20)} more`);
    }
  }
  
  // Export to CSV
  const csvRows = [
    'Priority,Rank,Make,Model,Trim,Years,Status'
  ];
  
  for (const rec of recommendations) {
    csvRows.push(`${rec.priority},${rec.rank},${rec.make},"${rec.model}","${rec.trim}","${rec.years}",${rec.status}`);
  }
  
  const csvPath = 'audit/top-100-coverage-gaps.csv';
  const fs = await import('fs');
  fs.writeFileSync(csvPath, csvRows.join('\n'));
  console.log(`\n\n📁 Full recommendations exported to: ${csvPath}`);
  
  // Also export detailed JSON
  const jsonPath = 'audit/top-100-coverage-analysis.json';
  fs.writeFileSync(jsonPath, JSON.stringify({
    summary: {
      totalVehicles: total,
      fullCoverage: results.fullCoverage.length,
      partialCoverage: results.partialCoverage.length,
      noCoverage: results.noCoverage.length,
      databaseVehicles: dbCars.length
    },
    byTier: results.byTier,
    recommendations,
    fullCoverage: results.fullCoverage,
    partialCoverage: results.partialCoverage,
    noCoverage: results.noCoverage
  }, null, 2));
  console.log(`📁 Detailed analysis exported to: ${jsonPath}`);
}

main().catch(console.error);
