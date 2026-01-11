/**
 * NHTSA Safety Service
 * 
 * Fetches recalls, TSBs (Technical Service Bulletins), complaints, 
 * and safety ratings from NHTSA APIs.
 * 
 * API Documentation: https://api.nhtsa.gov/
 * 
 * @module lib/nhtsaSafetyService
 */

import { logExternalApiError } from '@/lib/serverErrorLogger';

const NHTSA_API_BASE = 'https://api.nhtsa.gov';

/**
 * NHTSA Model Name Mappings
 * NHTSA uses simplified/different model names than we store internally.
 * This maps common variations to what NHTSA expects.
 */
const NHTSA_MODEL_MAPPINGS = {
  // Nissan
  'gt-r': 'GTR',
  'gtr': 'GTR',
  'gt-r nismo': 'GTR',
  'gt-r premium': 'GTR',
  'gt-r black edition': 'GTR',
  '370z nismo': '370Z',
  
  // Honda
  'civic type r': 'Civic',
  'civic type r fk8': 'Civic',
  'civic si': 'Civic',
  'civic hatchback': 'Civic',
  'civic sport': 'Civic',
  'accord sport': 'Accord',
  's2000 ap1': 'S2000',
  's2000 ap2': 'S2000',
  'nsx type s': 'NSX',
  
  // Toyota
  'gr supra': 'Supra',
  'supra a90': 'Supra',
  'supra 3.0': 'Supra',
  'supra 2.0': 'Supra',
  'supra mk4': 'Supra',
  'supra mk4 a80': 'Supra',
  'supra mk4 a80 turbo': 'Supra',
  'gr86': '86',
  'gr corolla': 'Corolla',
  'corolla gr': 'Corolla',
  '86 trd': '86',
  'tacoma trd': 'Tacoma',
  'tacoma trd pro': 'Tacoma',
  'tundra trd': 'Tundra',
  'tundra trd pro': 'Tundra',
  '4runner trd': '4Runner',
  '4runner trd pro': '4Runner',
  
  // Subaru
  'brz ts': 'BRZ',
  'brz limited': 'BRZ',
  'brz zd8': 'BRZ',
  'wrx sti': 'WRX',
  'wrx sti type ra': 'WRX',
  'impreza wrx sti': 'WRX',
  
  // Ford
  'mustang gt': 'Mustang',
  'mustang gt350': 'Mustang',
  'mustang gt350r': 'Mustang',
  'mustang gt500': 'Mustang',
  'mustang shelby gt350': 'Mustang',
  'mustang shelby gt500': 'Mustang',
  'mustang mach 1': 'Mustang',
  'mustang dark horse': 'Mustang',
  'mustang svt cobra': 'Mustang',
  'focus rs': 'Focus',
  'focus st': 'Focus',
  // Ford Trucks
  'f-150 raptor': 'F-150',
  'f-150 raptor r': 'F-150',
  'f-150 lightning': 'F-150',
  'f-150 tremor': 'F-150',
  'f-150 lariat': 'F-150',
  'f-150 xlt': 'F-150',
  'f-150 platinum': 'F-150',
  'f-150 limited': 'F-150',
  'f-250 power stroke': 'F-250',
  'f-250 super duty': 'F-250',
  'f-250 tremor': 'F-250',
  'f-250 lariat': 'F-250',
  'f-350 power stroke': 'F-350',
  'f-350 super duty': 'F-350',
  'ranger raptor': 'Ranger',
  'ranger t6': 'Ranger',
  'ranger t6 facelift': 'Ranger',
  'ranger lariat': 'Ranger',
  'ranger xlt': 'Ranger',
  'bronco raptor': 'Bronco',
  'bronco badlands': 'Bronco',
  'bronco wildtrak': 'Bronco',
  
  // Chevrolet
  'camaro ss': 'Camaro',
  'camaro zl1': 'Camaro',
  'camaro z/28': 'Camaro',
  'camaro 1le': 'Camaro',
  'corvette stingray': 'Corvette',
  'corvette z06': 'Corvette',
  'corvette zr1': 'Corvette',
  'corvette grand sport': 'Corvette',
  // Chevy Trucks/SUVs
  'silverado 1500': 'Silverado 1500',
  'silverado zr2': 'Silverado 1500',
  'silverado trail boss': 'Silverado 1500',
  'silverado rst': 'Silverado 1500',
  'silverado lt': 'Silverado 1500',
  'silverado ltz': 'Silverado 1500',
  'silverado high country': 'Silverado 1500',
  'silverado 2500': 'Silverado 2500',
  'silverado 2500hd': 'Silverado 2500',
  'silverado 3500': 'Silverado 3500',
  'silverado 3500hd': 'Silverado 3500',
  'colorado zr2': 'Colorado',
  'colorado z71': 'Colorado',
  'colorado trail boss': 'Colorado',
  'tahoe z71': 'Tahoe',
  'tahoe rst': 'Tahoe',
  'tahoe premier': 'Tahoe',
  'tahoe high country': 'Tahoe',
  'suburban z71': 'Suburban',
  'suburban rst': 'Suburban',
  'suburban premier': 'Suburban',
  
  // RAM Trucks - CRITICAL for NHTSA safety data
  '1500': '1500',
  '1500 rebel': '1500',
  '1500 trx': '1500',
  '1500 laramie': '1500',
  '1500 limited': '1500',
  '1500 big horn': '1500',
  '1500 lone star': '1500',
  '1500 tradesman': '1500',
  '1500 classic': '1500',
  '2500': '2500',
  '2500 cummins': '2500',
  '2500 power wagon': '2500',
  '2500 laramie': '2500',
  '2500 limited': '2500',
  '2500 tradesman': '2500',
  '3500': '3500',
  '3500 cummins': '3500',
  '3500 laramie': '3500',
  '3500 limited': '3500',
  'ram 1500': '1500',
  'ram 1500 rebel': '1500',
  'ram 1500 trx': '1500',
  'ram 1500 laramie': '1500',
  'ram 1500 limited': '1500',
  'ram 2500': '2500',
  'ram 2500 cummins': '2500',
  'ram 2500 power wagon': '2500',
  'ram 2500 laramie': '2500',
  'ram 3500': '3500',
  'ram 3500 cummins': '3500',
  
  // GMC Trucks/SUVs
  'sierra 1500': 'Sierra 1500',
  'sierra at4': 'Sierra 1500',
  'sierra at4x': 'Sierra 1500',
  'sierra elevation': 'Sierra 1500',
  'sierra denali': 'Sierra 1500',
  'sierra slt': 'Sierra 1500',
  'sierra 2500': 'Sierra 2500',
  'sierra 2500hd': 'Sierra 2500',
  'sierra 2500 at4': 'Sierra 2500',
  'sierra 2500 denali': 'Sierra 2500',
  'sierra 3500': 'Sierra 3500',
  'sierra 3500hd': 'Sierra 3500',
  'canyon at4': 'Canyon',
  'canyon at4x': 'Canyon',
  'canyon denali': 'Canyon',
  'yukon at4': 'Yukon',
  'yukon denali': 'Yukon',
  'yukon slt': 'Yukon',
  'yukon xl': 'Yukon XL',
  'yukon xl denali': 'Yukon XL',
  
  // Dodge
  'challenger srt hellcat': 'Challenger',
  'challenger srt demon': 'Challenger',
  'challenger r/t': 'Challenger',
  'charger srt hellcat': 'Charger',
  'charger srt8': 'Charger',
  'durango srt': 'Durango',
  'durango srt hellcat': 'Durango',
  'durango r/t': 'Durango',
  
  // BMW
  'm2': 'M2',
  'm2 competition': 'M2',
  'm2 cs': 'M2',
  'm3': 'M3',
  'm3 competition': 'M3',
  'm4': 'M4',
  'm4 competition': 'M4',
  'm4 cs': 'M4',
  'm4 gts': 'M4',
  'm5': 'M5',
  'm5 competition': 'M5',
  
  // Porsche
  '911 gt3': '911',
  '911 gt3 rs': '911',
  '911 turbo': '911',
  '911 turbo s': '911',
  '911 carrera': '911',
  '911 gts': '911',
  'cayman gt4': 'Cayman',
  'cayman gt4 rs': 'Cayman',
  'boxster gts': 'Boxster',
  
  // Mazda
  'miata mx-5': 'MX-5 Miata',
  'miata rf': 'MX-5 Miata',
  'mx-5 rf': 'MX-5 Miata',
  'mazda3 turbo': 'Mazda3',
  
  // VW/Audi
  'golf r': 'Golf',
  'golf gti': 'Golf',
  'gti': 'Golf',
  'rs3': 'RS 3',
  'rs3 8v': 'RS 3',
  'rs3 8y': 'RS 3',
  'rs5': 'RS 5',
  'rs5 b8': 'RS 5',
  'rs5 b9': 'RS 5',
  'rs6': 'RS 6',
  'rs6 avant': 'RS 6',
  'rs6 avant c8': 'RS 6',
  'rs7': 'RS 7',
  'rs7 sportback': 'RS 7',
  's4 b5': 'S4',
  's4 b6': 'S4',
  's4 b7': 'S4',
  's4 b8': 'S4',
  's4 b9': 'S4',
  's5 b8': 'S5',
  's5 b9': 'S5',
  'tt rs 8j': 'TT',
  'tt rs 8s': 'TT',
  'a3 1.8 tfsi': 'A3',
  'a3 1.8 tfsi (8v)': 'A3',
  'a4 2.0t b8': 'A4',
  'a4 2.0t b8.5': 'A4',
  'r8 v10': 'R8',
  'r8 v8': 'R8',
  'r8 performance': 'R8',
  'tt rs': 'TT',
  
  // Nissan JDM models
  'skyline gt-r': 'GTR',
  'skyline gt-r r32': 'GTR',
  'skyline gt-r r33': 'GTR',
  'skyline gt-r r34': 'GTR',
  '300zx twin turbo': '300ZX',
  '300zx twin turbo z32': '300ZX',
  '240sx s13': '240SX',
  '240sx s14': '240SX',
  'silvia s15': 'Silvia', // May not be in NHTSA (JDM only)
  '370z nismo': '370Z',
  'gt-r nismo': 'GTR',
  
  // Mazda generations
  'mx-5 miata na': 'MX-5 Miata',
  'mx-5 miata nb': 'MX-5 Miata',
  'mx-5 miata nc': 'MX-5 Miata',
  'mx-5 miata nd': 'MX-5 Miata',
  'rx-7 fd3s': 'RX-7',
  'rx-7 fc3s': 'RX-7',
  'rx-8': 'RX-8',
  'mazdaspeed3': 'MAZDASPEED3',
  'speed3': 'MAZDASPEED3',
  'mazdaspeed6': 'MAZDASPEED6',
  'speed6': 'MAZDASPEED6',
  '3 2.5 turbo': 'Mazda3',
  'mazda 3 2.5 turbo': 'Mazda3',
  '6 2.5 turbo': 'Mazda6',
  'mazda 6 2.5 turbo': 'Mazda6',
  
  // BMW chassis codes
  'm3 e30': 'M3',
  'm3 e36': 'M3',
  'm3 e46': 'M3',
  'm3 e90': 'M3',
  'm3 e92': 'M3',
  'm3 f80': 'M3',
  'm3 g80': 'M3',
  'm4 f82': 'M4',
  'm4 f83': 'M4',
  'm4 g82': 'M4',
  'm4 csl': 'M4',
  'm5 e39': 'M5',
  'm5 e60': 'M5',
  'm5 f10': 'M5',
  'm5 f10 competition': 'M5',
  'm5 f90': 'M5',
  'm5 f90 competition': 'M5',
  'm2 g87': 'M2',
  'm340i g20': '340i',
  '340i f30': '340i',
  '335i e90': '335i',
  '335i e92': '335i',
  '135i n54': '135i',
  '1 series m coupe': '1 Series M',
  'i4 m50': 'i4',
  'z4 m coupe/roadster': 'Z4 M',
  'z4 m coupe': 'Z4 M',
  'z4 m roadster': 'Z4 M',
  
  // Honda generations
  'civic type r fk8': 'Civic',
  'civic type r fl5': 'Civic',
  'civic si em1': 'Civic',
  'civic si ep3': 'Civic',
  'civic si fg2': 'Civic',
  'civic si fa5': 'Civic',
  'crx si': 'CRX',
  'del sol vtec': 'Del Sol',
  'prelude si vtec': 'Prelude',
  'accord 2.0t sport': 'Accord',
  
  // Subaru chassis codes
  'impreza wrx gc8': 'Impreza',
  'impreza wrx gd': 'Impreza',
  'impreza wrx sti gd': 'Impreza',
  'wrx sti gr': 'WRX',
  'wrx sti gr/gv': 'WRX',
  'wrx sti va': 'WRX',
  'wrx sti vb': 'WRX',
  'brz (2nd gen)': 'BRZ',
  'legacy gt spec.b': 'Legacy',
  'forester xt': 'Forester',
  
  // Mitsubishi
  'lancer evolution': 'Lancer',
  'lancer evolution x': 'Lancer',
  'lancer evolution ix': 'Lancer',
  'lancer evolution viii': 'Lancer',
  'lancer evolution viii/ix': 'Lancer',
  'lancer ralliart': 'Lancer',
  '3000gt vr-4': '3000GT',
  'eclipse gsx': 'Eclipse',
  
  // Cadillac (NHTSA uses base model names without -V suffix for some queries)
  'cts-v': 'CTS',
  'cts-v gen 1': 'CTS',
  'cts-v gen 2': 'CTS',
  'cts-v gen 3': 'CTS',
  'ct4-v': 'CT4',
  'ct4-v blackwing': 'CT4',
  'ct5-v': 'CT5',
  'ct5-v blackwing': 'CT5',
  'ats-v': 'ATS',
  
  // Porsche generations
  '911 gt3 996': '911',
  '911 gt3 997': '911',
  '911 gt3 991': '911',
  '911 gt3 991.1': '911',
  '911 gt3 991.2': '911',
  '911 gt3 992': '911',
  '911 gt3 rs 991': '911',
  '911 gt3 rs 992': '911',
  '911 gt2 rs 991': '911',
  '911 turbo 997': '911',
  '911 turbo 997.1': '911',
  '911 turbo 997.2': '911',
  '911 turbo s 992': '911',
  '991.1 carrera s': '911',
  '991.2 carrera s': '911',
  '997.2 carrera s': '911',
  '718 cayman gt4': '718 Cayman',
  '718 cayman gt4 rs': '718 Cayman',
  '718 cayman gts 4.0': '718 Cayman',
  '718 boxster gts 4.0': '718 Boxster',
  '981 cayman s': 'Cayman',
  '981 cayman gts': 'Cayman',
  '987.2 cayman s': 'Cayman',
  'boxster s 986': 'Boxster',
  'boxster s 987': 'Boxster',
  'boxster s 981': 'Boxster',
  'panamera turbo 971': 'Panamera',
  'carrera gt': 'Carrera GT',
  '918 spyder': '918 Spyder',
  
  // Toyota JDM
  'mr2 turbo sw20': 'MR2',
  'mr2 spyder': 'MR2',
  'celica gt-four st205': 'Celica',
  '86 / scion fr-s': '86',
  'land cruiser 200 series': 'Land Cruiser',
  
  // Infiniti
  'g35 coupe': 'G35',
  'g37 coupe': 'G37',
  'g37 sedan': 'G37',
  'q50 red sport 400': 'Q50',
  'q60 red sport 400': 'Q60',
  
  // Lexus
  'is350 f sport': 'IS350',
  'gs f': 'GS F',
  'rc f': 'RC F',
  'is-f': 'IS F',
  'lc 500': 'LC',
  'gx 550': 'GX',
  
  // Hyundai/Kia/Genesis
  'veloster n': 'Veloster',
  'elantra n': 'Elantra',
  'kona n': 'Kona',
  'stinger gt': 'Stinger',
  'k5 gt': 'K5',
  'g70 3.3t': 'G70',
  
  // Pontiac
  'g8 gxp': 'G8',
  'g8 gt': 'G8',
  'firebird trans am ws6': 'Firebird',
  
  // Mercedes-AMG
  'c63 amg w204': 'C63 AMG',
  'c63 w205': 'C63',
  'e63 w212': 'E63',
  'e63 s w213': 'E63',
  'cla 45': 'CLA45 AMG',
  'cla 45 s': 'CLA45 AMG',
  'gt': 'AMG GT',
  'gt r': 'AMG GT',
  'gt black series': 'AMG GT',
  'sls amg': 'SLS AMG',
  'mercedes c63 amg w204': 'C63 AMG',
  
  // MINI
  'cooper s r53': 'Cooper S',
  'cooper s r56': 'Cooper S',
  'john cooper works f56': 'Hardtop',
  
  // Tesla
  'model 3 performance': 'Model 3',
  'model y performance': 'Model Y',
  
  // Rivian
  'r1t': 'R1T',
  'r1s': 'R1S',
  
  // Jeep
  'wrangler rubicon': 'Wrangler',
  'wrangler sahara': 'Wrangler',
  'wrangler sport': 'Wrangler',
  'wrangler unlimited': 'Wrangler',
  'gladiator rubicon': 'Gladiator',
  'gladiator mojave': 'Gladiator',
  'grand cherokee srt': 'Grand Cherokee',
  'grand cherokee trackhawk': 'Grand Cherokee',
  'grand cherokee trailhawk': 'Grand Cherokee',
  'grand cherokee summit': 'Grand Cherokee',
  'grand cherokee limited': 'Grand Cherokee',
};

/**
 * Normalize model name for NHTSA API queries
 * NHTSA often uses simpler base model names without trim levels
 * 
 * @param {string} model - The model name from our database
 * @returns {string} - Normalized model name for NHTSA
 */
function normalizeModelForNHTSA(model) {
  if (!model) return model;
  
  const lowerModel = model.toLowerCase().trim();
  
  // Check direct mapping first
  if (NHTSA_MODEL_MAPPINGS[lowerModel]) {
    return NHTSA_MODEL_MAPPINGS[lowerModel];
  }
  
  // Check if any mapping key is contained in the model name
  for (const [key, value] of Object.entries(NHTSA_MODEL_MAPPINGS)) {
    if (lowerModel.includes(key)) {
      return value;
    }
  }
  
  // Pattern-based normalization for common formats
  let normalized = model;
  
  // Remove BMW chassis codes (E30, E36, E46, E90, E92, F30, F80, G20, G80, etc.)
  normalized = normalized.replace(/\s+[EeFfGg]\d{2}$/i, '');
  
  // Remove Audi chassis codes (B5, B6, B7, B8, B9, 8V, 8Y, 8J, 8S, etc.)
  normalized = normalized.replace(/\s+[Bb]\d$/i, '');
  normalized = normalized.replace(/\s+8[VJYS]$/i, '');
  
  // Remove Porsche generation codes (996, 997, 991, 991.1, 991.2, 992, 986, 987, 981, 718, etc.)
  normalized = normalized.replace(/\s+99[1267](?:\.\d)?$/i, '');
  normalized = normalized.replace(/\s+98[1567]$/i, '');
  
  // Remove Subaru chassis codes (GC8, GD, GR, GV, VA, VB, etc.)
  normalized = normalized.replace(/\s+G[CDRVB]\d?$/i, '');
  normalized = normalized.replace(/\s+V[AB]$/i, '');
  
  // Remove Mazda generation codes (NA, NB, NC, ND, FD3S, FC3S, etc.)
  normalized = normalized.replace(/\s+N[ABCD]$/i, '');
  normalized = normalized.replace(/\s+[EF][CDN]3S$/i, '');
  
  // Remove Nissan/JDM chassis codes (R32, R33, R34, Z32, S13, S14, S15, etc.)
  normalized = normalized.replace(/\s+[RSZ]\d{2}$/i, '');
  
  // Remove Honda chassis codes (FK8, FL5, FG2, EP3, EM1, DC2, DC5, AP1, AP2, etc.)
  normalized = normalized.replace(/\s+[FEDA][GKLPM]\d$/i, '');
  normalized = normalized.replace(/\s+[ADCE][CPNM]\d$/i, '');
  
  // Remove Mercedes chassis codes (W204, W205, W212, W213, C190, R190, etc.)
  normalized = normalized.replace(/\s+[WCR]\d{3}$/i, '');
  
  // Remove generation suffixes (Gen 1, Gen 2, Gen 3, 1st Gen, 2nd Gen, etc.)
  normalized = normalized.replace(/\s+(?:Gen\s*)?\d(?:st|nd|rd|th)?\s*(?:Gen(?:eration)?)?$/i, '');
  
  // Remove common trim/edition suffixes
  normalized = normalized
    .replace(/\s+(?:Type[- ]?[RSX]|Nismo|TRD|RS|GT[S3]?|SS|SRT|SVT|AMG|Competition|Performance)$/i, '')
    .replace(/\s+(?:Sport|Limited|Premium|Touring|Base|Luxury|Executive|Special Edition)$/i, '')
    .replace(/\s+(?:Blackwing|Hellcat|Demon|Trackhawk|Raptor|Lightning|Power Stroke|Cummins|Rebel|TRX)$/i, '')
    .replace(/\s+(?:Coupe|Sedan|Hatchback|Wagon|Roadster|Convertible|Cabrio|Spyder|Spider)$/i, '');
  
  // Remove engine specs commonly appended
  normalized = normalized
    .replace(/\s+\d+\.\d+[TL]?$/i, '') // 2.0T, 3.0L, etc.
    .replace(/\s+(?:V\d+|I\d+|Turbo|Supercharged|TFSI|TSI|VTEC)$/i, '');
  
  // Remove twin turbo / z32 style suffixes
  normalized = normalized.replace(/\s+Twin\s*Turbo(?:\s+Z\d{2})?$/i, '');
  
  // Clean up multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized || model;
}

/**
 * @typedef {Object} Recall
 * @property {string} campaignNumber - NHTSA campaign number
 * @property {string} manufacturer - Manufacturer name
 * @property {string} component - Affected component
 * @property {string} summary - Recall summary
 * @property {string} consequence - Potential consequence
 * @property {string} remedy - Repair remedy
 * @property {string} reportReceivedDate - Date recall was reported
 * @property {boolean} incomplete - Whether recall is incomplete for this VIN
 */

/**
 * @typedef {Object} Complaint
 * @property {number} odiNumber - NHTSA ODI number
 * @property {string} manufacturer - Manufacturer name
 * @property {string} component - Component involved
 * @property {string} summary - Complaint summary
 * @property {string} dateReceived - Date complaint was received
 * @property {boolean} crash - Whether crash occurred
 * @property {boolean} fire - Whether fire occurred
 * @property {number} numberOfDeaths - Number of deaths
 * @property {number} numberOfInjuries - Number of injuries
 */

/**
 * @typedef {Object} Investigation
 * @property {string} investigationId - NHTSA investigation ID
 * @property {string} manufacturer - Manufacturer name
 * @property {string} subject - Investigation subject
 * @property {string} summary - Investigation summary
 * @property {string} openDate - Date investigation opened
 * @property {string} closeDate - Date investigation closed (if applicable)
 * @property {string} status - Current status
 */

/**
 * Fetch recalls by VIN
 * This returns recalls specific to the vehicle identified by VIN
 * 
 * @param {string} vin - 17-character VIN
 * @returns {Promise<{data: Array<Recall>|null, error: string|null}>}
 */
export async function fetchRecallsByVIN(vin) {
  if (!vin || vin.length !== 17) {
    return { data: null, error: 'Invalid VIN' };
  }

  try {
    const response = await fetch(
      `${NHTSA_API_BASE}/recalls/recallsByVehicle?vin=${vin}`
    );

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return { data: [], error: null };
    }

    // Transform to our format
    const recalls = data.results.map(recall => ({
      campaignNumber: recall.NHTSACampaignNumber || recall.CampaignNumber,
      manufacturer: recall.Manufacturer,
      component: recall.Component,
      summary: recall.Summary,
      consequence: recall.Consequence,
      remedy: recall.Remedy,
      reportReceivedDate: recall.ReportReceivedDate,
      notes: recall.Notes,
      // VIN-specific lookup tells us if recall is incomplete
      incomplete: recall.VINInfoSummary?.includes('INCOMPLETE') || false,
    }));

    return { data: recalls, error: null };
  } catch (err) {
    console.error('[NHTSA Safety] Error fetching recalls by VIN:', err);
    logExternalApiError('NHTSA', err, { 
      endpoint: `recalls/recallsByVehicle?vin=${vin}`,
      feature: 'garage',
    }).catch(() => {}); // Non-blocking
    return { data: null, error: err.message };
  }
}

/**
 * Fetch recalls by make, model, year
 * Use this when VIN is not available
 * 
 * @param {number} year - Model year
 * @param {string} make - Manufacturer (e.g., "Ford")
 * @param {string} model - Model name (e.g., "Mustang")
 * @returns {Promise<{data: Array<Recall>|null, error: string|null}>}
 */
export async function fetchRecallsByVehicle(year, make, model) {
  if (!year || !make || !model) {
    return { data: null, error: 'Missing required parameters' };
  }

  // Normalize model name for NHTSA's expected format
  const normalizedModel = normalizeModelForNHTSA(model);

  try {
    const response = await fetch(
      `${NHTSA_API_BASE}/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(normalizedModel)}&modelYear=${year}`
    );

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return { data: [], error: null };
    }

    const recalls = data.results.map(recall => ({
      campaignNumber: recall.NHTSACampaignNumber || recall.CampaignNumber,
      manufacturer: recall.Manufacturer,
      component: recall.Component,
      summary: recall.Summary,
      consequence: recall.Consequence,
      remedy: recall.Remedy,
      reportReceivedDate: recall.ReportReceivedDate,
      notes: recall.Notes,
    }));

    return { data: recalls, error: null };
  } catch (err) {
    console.error('[NHTSA Safety] Error fetching recalls:', err);
    logExternalApiError('NHTSA', err, { 
      endpoint: 'recalls/recallsByVehicle',
      params: { year, make, model, normalizedModel },
      feature: 'browse-cars',
    }).catch(() => {}); // Non-blocking
    return { data: null, error: err.message };
  }
}

/**
 * Fetch complaints by make, model, year
 * 
 * @param {number} year - Model year
 * @param {string} make - Manufacturer
 * @param {string} model - Model name
 * @returns {Promise<{data: Array<Complaint>|null, error: string|null}>}
 */
export async function fetchComplaints(year, make, model) {
  if (!year || !make || !model) {
    return { data: null, error: 'Missing required parameters' };
  }

  // Normalize model name for NHTSA's expected format
  const normalizedModel = normalizeModelForNHTSA(model);

  try {
    const response = await fetch(
      `${NHTSA_API_BASE}/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(normalizedModel)}&modelYear=${year}`
    );

    if (!response.ok) {
      throw new Error(`NHTSA API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return { data: [], error: null };
    }

    // NHTSA API returns lowercase field names with boolean values for crash/fire
    const complaints = data.results.map(complaint => ({
      odiNumber: complaint.odiNumber,
      manufacturer: complaint.manufacturer,
      component: complaint.components, // API uses plural "components"
      summary: complaint.summary,
      dateReceived: complaint.dateComplaintFiled || complaint.dateOfIncident,
      crash: complaint.crash === true || complaint.crash === 'Y',
      fire: complaint.fire === true || complaint.fire === 'Y',
      numberOfDeaths: parseInt(complaint.numberOfDeaths) || 0,
      numberOfInjuries: parseInt(complaint.numberOfInjuries) || 0,
      mileage: complaint.odiMileage,
      speed: complaint.speed,
    }));

    // Sort by date, most recent first
    complaints.sort((a, b) => 
      new Date(b.dateReceived || 0) - new Date(a.dateReceived || 0)
    );

    return { data: complaints, error: null };
  } catch (err) {
    console.error('[NHTSA Safety] Error fetching complaints:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Fetch investigations by make, model, year
 * Investigations are formal NHTSA inquiries that may lead to recalls
 * 
 * @param {number} year - Model year
 * @param {string} make - Manufacturer
 * @param {string} model - Model name
 * @returns {Promise<{data: Array<Investigation>|null, error: string|null}>}
 */
export async function fetchInvestigations(year, make, model) {
  if (!year || !make || !model) {
    return { data: null, error: 'Missing required parameters' };
  }

  // Normalize model name for NHTSA's expected format
  const normalizedModel = normalizeModelForNHTSA(model);

  try {
    const response = await fetch(
      `${NHTSA_API_BASE}/products/vehicle/makes/${encodeURIComponent(make)}/models/${encodeURIComponent(normalizedModel)}/years/${year}/investigations?format=json`
    );

    if (!response.ok) {
      // Investigations endpoint may not exist for all vehicles
      return { data: [], error: null };
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return { data: [], error: null };
    }

    const investigations = data.results.map(inv => ({
      investigationId: inv.NHTSAActionNumber,
      manufacturer: inv.Manufacturer,
      subject: inv.Subject,
      summary: inv.Summary,
      openDate: inv.OpenDate,
      closeDate: inv.CloseDate,
      status: inv.CloseDate ? 'Closed' : 'Open',
      investigationType: inv.InvestigationType,
    }));

    return { data: investigations, error: null };
  } catch (err) {
    console.error('[NHTSA Safety] Error fetching investigations:', err);
    return { data: [], error: null }; // Don't fail on investigation errors
  }
}

/**
 * Get safety ratings by make, model, year
 * 
 * @param {number} year - Model year
 * @param {string} make - Manufacturer
 * @param {string} model - Model name
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function fetchSafetyRatings(year, make, model) {
  if (!year || !make || !model) {
    return { data: null, error: 'Missing required parameters' };
  }

  // Normalize model name for NHTSA's expected format
  const normalizedModel = normalizeModelForNHTSA(model);

  try {
    // First get vehicle ID
    const searchResponse = await fetch(
      `${NHTSA_API_BASE}/SafetyRatings/modelyear/${year}/make/${encodeURIComponent(make)}/model/${encodeURIComponent(normalizedModel)}?format=json`
    );

    if (!searchResponse.ok) {
      return { data: null, error: null };
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.Results || searchData.Results.length === 0) {
      return { data: null, error: null };
    }

    // Get the first vehicle's ratings
    const vehicleId = searchData.Results[0].VehicleId;
    
    const ratingsResponse = await fetch(
      `${NHTSA_API_BASE}/SafetyRatings/VehicleId/${vehicleId}?format=json`
    );

    if (!ratingsResponse.ok) {
      return { data: null, error: null };
    }

    const ratingsData = await ratingsResponse.json();
    const result = ratingsData.Results?.[0];

    if (!result) {
      return { data: null, error: null };
    }

    const ratings = {
      vehicleDescription: result.VehicleDescription,
      overallRating: result.OverallRating,
      overallFrontCrashRating: result.OverallFrontCrashRating,
      frontCrashDriversideRating: result.FrontCrashDriversideRating,
      frontCrashPassengersideRating: result.FrontCrashPassengersideRating,
      overallSideCrashRating: result.OverallSideCrashRating,
      sideCrashDriversideRating: result.SideCrashDriversideRating,
      sideCrashPassengersideRating: result.SideCrashPassengersideRating,
      rolloverRating: result.RolloverRating,
      rolloverRating2: result.RolloverRating2,
      rolloverPossibility: result.RolloverPossibility,
      rolloverPossibility2: result.RolloverPossibility2,
      sidePoleCrashRating: result.SidePoleCrashRating,
      nhtsa5StarSafetyUrl: result.NHTSAForwardCollisionWarning,
      // Convert "Not Rated" to null for cleaner display
      hasRatings: result.OverallRating && result.OverallRating !== 'Not Rated',
    };

    return { data: ratings, error: null };
  } catch (err) {
    console.error('[NHTSA Safety] Error fetching safety ratings:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Fetch all safety data for a vehicle
 * Combines recalls, complaints, investigations, and safety ratings
 * 
 * @param {Object} vehicle - { vin, year, make, model }
 * @returns {Promise<Object>}
 */
export async function fetchAllSafetyData(vehicle) {
  const { vin, year, make, model } = vehicle;
  
  if (!year || !make || !model) {
    return {
      recalls: [],
      complaints: [],
      investigations: [],
      safetyRatings: null,
      error: 'Missing vehicle information',
    };
  }

  try {
    // Fetch all data in parallel
    const [recallsResult, complaintsResult, investigationsResult, ratingsResult] = await Promise.all([
      // Use VIN for recalls if available, otherwise use make/model/year
      vin && vin.length === 17 
        ? fetchRecallsByVIN(vin) 
        : fetchRecallsByVehicle(year, make, model),
      fetchComplaints(year, make, model),
      fetchInvestigations(year, make, model),
      fetchSafetyRatings(year, make, model),
    ]);

    return {
      recalls: recallsResult.data || [],
      complaints: complaintsResult.data || [],
      investigations: investigationsResult.data || [],
      safetyRatings: ratingsResult.data,
      error: null,
    };
  } catch (err) {
    console.error('[NHTSA Safety] Error fetching all safety data:', err);
    return {
      recalls: [],
      complaints: [],
      investigations: [],
      safetyRatings: null,
      error: err.message,
    };
  }
}

/**
 * Group complaints by component for summary view
 * 
 * @param {Array<Complaint>} complaints 
 * @returns {Array<Object>}
 */
export function groupComplaintsByComponent(complaints) {
  if (!complaints || complaints.length === 0) return [];

  const groups = {};
  
  complaints.forEach(complaint => {
    const component = complaint.component || 'Other';
    if (!groups[component]) {
      groups[component] = {
        component,
        count: 0,
        crashes: 0,
        fires: 0,
        injuries: 0,
        deaths: 0,
        complaints: [],
      };
    }
    
    groups[component].count++;
    if (complaint.crash) groups[component].crashes++;
    if (complaint.fire) groups[component].fires++;
    groups[component].injuries += complaint.numberOfInjuries || 0;
    groups[component].deaths += complaint.numberOfDeaths || 0;
    groups[component].complaints.push(complaint);
  });

  // Sort by count, highest first
  return Object.values(groups).sort((a, b) => b.count - a.count);
}

/**
 * Get safety summary for quick display
 * 
 * @param {Object} safetyData - Result from fetchAllSafetyData
 * @returns {Object}
 */
export function getSafetySummary(safetyData) {
  const { recalls, complaints, investigations, safetyRatings } = safetyData;
  
  const openRecalls = recalls.filter(r => r.incomplete).length;
  const totalRecalls = recalls.length;
  const complaintsByComponent = groupComplaintsByComponent(complaints);
  const topComponents = complaintsByComponent.slice(0, 3);
  
  return {
    openRecalls,
    totalRecalls,
    totalComplaints: complaints.length,
    openInvestigations: investigations.filter(i => i.status === 'Open').length,
    overallRating: safetyRatings?.overallRating || null,
    hasRatings: safetyRatings?.hasRatings || false,
    topComplaintComponents: topComponents.map(c => ({
      name: c.component,
      count: c.count,
    })),
    hasSafetyIssues: openRecalls > 0 || investigations.some(i => i.status === 'Open'),
  };
}

// ============================================================================
// TECHNICAL SERVICE BULLETINS (TSBs)
// ============================================================================

/**
 * @typedef {Object} TSB
 * @property {string} tsbId - TSB identifier
 * @property {string} manufacturer - Manufacturer name
 * @property {string} component - Affected component
 * @property {string} summary - TSB summary/description
 * @property {string} dateIssued - Date TSB was issued
 * @property {string} nhtsaId - NHTSA tracking ID
 */

/**
 * Fetch Technical Service Bulletins by make, model, year
 * TSBs are manufacturer notices about known issues and fixes
 * 
 * @param {number} year - Model year
 * @param {string} make - Manufacturer
 * @param {string} model - Model name
 * @returns {Promise<{data: Array<TSB>|null, error: string|null}>}
 */
export async function fetchTSBs(year, make, model) {
  if (!year || !make || !model) {
    return { data: null, error: 'Missing required parameters' };
  }

  // Normalize model name for NHTSA's expected format
  const normalizedModel = normalizeModelForNHTSA(model);

  try {
    // NHTSA TSB endpoint
    const response = await fetch(
      `${NHTSA_API_BASE}/products/vehicle/makes/${encodeURIComponent(make)}/models/${encodeURIComponent(normalizedModel)}/years/${year}/tsbs?format=json`
    );

    if (!response.ok) {
      // TSB endpoint may not be available for all vehicles
      return { data: [], error: null };
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return { data: [], error: null };
    }

    const tsbs = data.results.map(tsb => ({
      tsbId: tsb.TSBId || tsb.ServiceBulletinNumber,
      manufacturer: tsb.Manufacturer || make,
      component: tsb.Component,
      summary: tsb.Summary || tsb.TSBSummary,
      dateIssued: tsb.DateIssued || tsb.TSBDate,
      nhtsaId: tsb.NHTSAActionNumber,
      modelYear: tsb.ModelYear || year,
    }));

    // Sort by date, most recent first
    tsbs.sort((a, b) => 
      new Date(b.dateIssued || 0) - new Date(a.dateIssued || 0)
    );

    return { data: tsbs, error: null };
  } catch (err) {
    console.error('[NHTSA Safety] Error fetching TSBs:', err);
    return { data: [], error: null }; // Don't fail on TSB errors
  }
}

/**
 * Group TSBs by component for summary view
 * 
 * @param {Array<TSB>} tsbs 
 * @returns {Array<Object>}
 */
export function groupTSBsByComponent(tsbs) {
  if (!tsbs || tsbs.length === 0) return [];

  const groups = {};
  
  tsbs.forEach(tsb => {
    const component = tsb.component || 'Other';
    if (!groups[component]) {
      groups[component] = {
        component,
        count: 0,
        tsbs: [],
      };
    }
    
    groups[component].count++;
    groups[component].tsbs.push(tsb);
  });

  // Sort by count, highest first
  return Object.values(groups).sort((a, b) => b.count - a.count);
}

/**
 * Fetch all safety data INCLUDING TSBs for a vehicle
 * Extended version that adds TSBs to the standard safety data
 * 
 * @param {Object} vehicle - { vin, year, make, model }
 * @returns {Promise<Object>}
 */
export async function fetchComprehensiveSafetyData(vehicle) {
  const { vin, year, make, model } = vehicle;
  
  if (!year || !make || !model) {
    return {
      recalls: [],
      complaints: [],
      investigations: [],
      tsbs: [],
      safetyRatings: null,
      error: 'Missing vehicle information',
    };
  }

  try {
    // Fetch all data in parallel including TSBs
    const [recallsResult, complaintsResult, investigationsResult, ratingsResult, tsbsResult] = await Promise.all([
      vin && vin.length === 17 
        ? fetchRecallsByVIN(vin) 
        : fetchRecallsByVehicle(year, make, model),
      fetchComplaints(year, make, model),
      fetchInvestigations(year, make, model),
      fetchSafetyRatings(year, make, model),
      fetchTSBs(year, make, model),
    ]);

    return {
      recalls: recallsResult.data || [],
      complaints: complaintsResult.data || [],
      investigations: investigationsResult.data || [],
      tsbs: tsbsResult.data || [],
      safetyRatings: ratingsResult.data,
      error: null,
    };
  } catch (err) {
    console.error('[NHTSA Safety] Error fetching comprehensive safety data:', err);
    return {
      recalls: [],
      complaints: [],
      investigations: [],
      tsbs: [],
      safetyRatings: null,
      error: err.message,
    };
  }
}

/**
 * Get extended safety summary including TSBs
 * 
 * @param {Object} safetyData - Result from fetchComprehensiveSafetyData
 * @returns {Object}
 */
export function getExtendedSafetySummary(safetyData) {
  const baseSummary = getSafetySummary(safetyData);
  const { tsbs } = safetyData;
  
  const tsbsByComponent = groupTSBsByComponent(tsbs || []);
  const topTsbComponents = tsbsByComponent.slice(0, 3);
  
  return {
    ...baseSummary,
    totalTSBs: tsbs?.length || 0,
    topTSBComponents: topTsbComponents.map(c => ({
      name: c.component,
      count: c.count,
    })),
    // Categories of concern (components with both complaints AND TSBs)
    componentsOfConcern: findComponentsOfConcern(safetyData),
  };
}

/**
 * Find components that appear in both complaints and TSBs
 * These are likely the most important issues to be aware of
 * 
 * @param {Object} safetyData 
 * @returns {Array<string>}
 */
function findComponentsOfConcern(safetyData) {
  const { complaints, tsbs } = safetyData;
  
  if (!complaints?.length || !tsbs?.length) return [];
  
  const complaintComponents = new Set(
    complaints.map(c => normalizeComponent(c.component))
  );
  
  const tsbComponents = new Set(
    tsbs.map(t => normalizeComponent(t.component))
  );
  
  const overlap = [...complaintComponents].filter(c => tsbComponents.has(c));
  
  return overlap.filter(Boolean);
}

/**
 * Normalize component names for comparison
 * @param {string} component 
 * @returns {string}
 */
function normalizeComponent(component) {
  if (!component) return '';
  return component.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}



















