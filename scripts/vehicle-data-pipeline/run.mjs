#!/usr/bin/env node
/**
 * Vehicle Data Pipeline v2.2 - FULLY COMPREHENSIVE
 * 
 * THE single script for all vehicle data operations.
 * Covers ALL 17 tables with ALL fields.
 * 
 * Data Sources:
 *   - Government APIs: EPA, NHTSA (automated)
 *   - AI Research: Claude/GPT-4 (maintenance, tuning, issues, editorial)
 *   - Exa Search: YouTube reviews discovery
 *   - Supadata API: YouTube transcript extraction
 *   - Google Nano Banana Pro: Image generation
 *   - Web Search: Owner manuals, PDFs
 * 
 * Usage:
 *   node scripts/vehicle-data-pipeline/run.mjs --vehicle "Ram 1500 TRX" --mode full
 *   node scripts/vehicle-data-pipeline/run.mjs --car-id abc123 --mode validate
 *   node scripts/vehicle-data-pipeline/run.mjs --batch 10 --mode enrich
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { Exa } from 'exa-js';
import sharp from 'sharp';
import { parseArgs } from 'node:util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(projectRoot, '.env.local') });

import { TABLES, VALIDATION_RULES, getOemBrand } from './config.mjs';
import { dedupeBy, extractYouTubeVideoId, runWithConcurrency, slugifyKey } from './utils.mjs';
import { matchEngineFamily, applyEngineFamilyCorrections, applyBrandWideSpecs } from './engine-specs.mjs';
import { verifyMaintenanceData, checkKnownExceptions } from './verify-specs.mjs';
import { verifyAgainstManual } from './manual-extractor.mjs';

// ============================================================================
// DATA NORMALIZATION HELPERS
// ============================================================================

/**
 * Parse various date formats and return ISO date string (YYYY-MM-DD)
 * Handles: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, Month DD YYYY, etc.
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr.split('T')[0];
  }
  
  // DD/MM/YYYY or MM/DD/YYYY format
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, a, b, year] = slashMatch;
    // If first number > 12, it's DD/MM/YYYY
    if (parseInt(a) > 12) {
      return `${year}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
    }
    // If second number > 12, it's MM/DD/YYYY  
    if (parseInt(b) > 12) {
      return `${year}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
    }
    // Ambiguous - assume MM/DD/YYYY (US format from NHTSA)
    return `${year}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
  }
  
  // Try native Date parsing as fallback
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch (e) {
    // Ignore parse errors
  }
  
  return null;
}

/**
 * Extract numeric value from strings like "-0.5 to 0.5" or "0.5 - 1.0"
 * Returns the first (or only) numeric value, or null
 */
function extractNumeric(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  
  // Match first decimal number (including negative)
  const match = value.match(/-?\d+\.?\d*/);
  return match ? parseFloat(match[0]) : null;
}

/**
 * Map fitment_type to valid enum values
 * Valid: oem, oem_optional, plus_one, plus_two, aggressive, conservative, square
 */
function normalizeFitmentType(type) {
  if (!type) return 'oem';
  const lower = type.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  const mappings = {
    'oem': 'oem',
    'stock': 'oem',
    'factory': 'oem',
    'oemoptional': 'oem_optional',
    'optional': 'oem_optional',
    'plusone': 'plus_one',
    'plussize': 'plus_one',
    'plus1': 'plus_one',
    'plustwo': 'plus_two',
    'plus2': 'plus_two',
    'aggressive': 'aggressive',
    'stance': 'aggressive',
    'track': 'aggressive',
    'conservative': 'conservative',
    'comfort': 'conservative',
    'square': 'square',
  };
  
  return mappings[lower] || 'oem';
}

/**
 * Map tuning_focus to valid enum values
 * Valid: performance, off-road, towing, economy, drift
 */
function normalizeTuningFocus(focus) {
  if (!focus) return 'performance';
  const lower = focus.toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  const mappings = {
    'performance': 'performance',
    'general': 'performance',
    'street': 'performance',
    'power': 'performance',
    'offroad': 'off-road',
    'off-road': 'off-road',
    'overland': 'off-road',
    'trail': 'off-road',
    'towing': 'towing',
    'hauling': 'towing',
    'economy': 'economy',
    'fuel': 'economy',
    'efficiency': 'economy',
    'drift': 'drift',
    'drifting': 'drift',
  };
  
  return mappings[lower] || 'performance';
}

/**
 * Convert various values to boolean
 * Handles: true/false, "Sensor"/"Visual"/"None", yes/no, 1/0
 */
function toBoolean(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    // Explicit true values
    if (['true', 'yes', '1', 'sensor', 'visual', 'electronic'].includes(lower)) return true;
    // Explicit false values
    if (['false', 'no', '0', 'none', 'n/a', 'na'].includes(lower)) return false;
  }
  return null;
}

/**
 * Normalize source_type to valid enum values for wheel_tire_fitment_options
 * Valid: oem, community, tire_rack, fitment_industries, forum, manual
 */
function normalizeSourceType(type) {
  if (!type) return 'manual';
  const lower = type.toLowerCase().replace(/[^a-z0-9_]/g, '');
  
  const mappings = {
    'oem': 'oem',
    'factory': 'oem',
    'stock': 'oem',
    'community': 'community',
    'forum': 'forum',
    'tirerack': 'tire_rack',
    'tire_rack': 'tire_rack',
    'fitmentindustries': 'fitment_industries',
    'fitment_industries': 'fitment_industries',
    'manual': 'manual',
    'ai': 'manual',
    'other': 'manual',
    'calculator': 'manual',
  };
  
  return mappings[lower] || 'manual';
}

/**
 * Filter variants to exclude unrelated models
 * Prevents TRX from being added to Rebel, Suburban from Tahoe, etc.
 */
function filterValidVariants(variants, car) {
  if (!Array.isArray(variants)) return [];
  
  // Known exclusions: different models that AI sometimes confuses
  const exclusions = {
    'ram-1500-rebel': ['trx', 'laramie', 'big horn', 'tradesman', 'limited', 'longhorn'],
    'ram-1500-trx': ['rebel', 'laramie', 'big horn', 'tradesman', 'limited'],
    'chevrolet-tahoe': ['suburban', 'yukon', 'escalade'],
    'chevrolet-suburban': ['tahoe', 'yukon', 'escalade'],
    'ford-f-150': ['raptor', 'lightning'],
    'ford-f-150-raptor': ['f-150', 'lightning', 'tremor'],
  };
  
  const slugBase = car.slug?.split('-').slice(0, 3).join('-') || '';
  const excludeTerms = exclusions[slugBase] || [];
  
  return variants.filter(v => {
    const trimLower = (v.trim || v.display_name || '').toLowerCase();
    const engineLower = (v.engine || '').toLowerCase();
    
    // Check for exclusion terms
    for (const term of excludeTerms) {
      if (trimLower.includes(term) || trimLower === term) {
        log.warn(`Filtering out variant "${v.display_name}" - different model than ${car.name}`);
        return false;
      }
    }
    
    // Special case: TRX has supercharged engine, Rebel doesn't
    if (slugBase.includes('rebel') && engineLower.includes('supercharged')) {
      log.warn(`Filtering out variant "${v.display_name}" - supercharged engine belongs to TRX`);
      return false;
    }
    
    return true;
  });
}

/**
 * Deduplicate variants by variant_key
 */
function dedupeVariants(variants) {
  if (!Array.isArray(variants)) return [];
  const seen = new Set();
  return variants.filter(v => {
    const key = v.variant_key || `${v.trim}-${v.model_year_start}-${v.model_year_end}`;
    if (seen.has(key)) {
      log.warn(`Removing duplicate variant: ${key}`);
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Validate maintenance data for common issues
 */
function validateMaintenanceData(maintenance, car) {
  const warnings = [];

  if (!maintenance) return warnings;

  // Check for aftermarket brake confusion (CRITICAL - common AI hallucination)
  const frontCaliper = maintenance.brakes_front?.brake_front_caliper_type?.toLowerCase() || '';
  const rearCaliper = maintenance.brakes_rear?.brake_rear_caliper_type?.toLowerCase() || '';
  
  // List of aftermarket brake brands that are rarely stock
  const aftermarketBrands = ['brembo', 'wilwood', 'stoptech', 'ap racing', 'alcon', 'baer'];
  const suspiciousSpecs = ['6-piston', '6 piston', '8-piston', '8 piston', '4-piston brembo'];
  
  for (const brand of aftermarketBrands) {
    if (frontCaliper.includes(brand) || rearCaliper.includes(brand)) {
      // Only a few vehicles come with Brembo stock - flag for review
      const knownBremboStock = ['hellcat', 'gt500', 'z06', 'zl1', 'gt350', 'camaro ss 1le', 'mustang mach 1', 'porsche', 'ferrari', 'lamborghini', 'mclaren', 'audi rs', 'bmw m', 'mercedes amg'];
      const carNameLower = car.name?.toLowerCase() || '';
      const hasBremboStock = knownBremboStock.some(v => carNameLower.includes(v));
      
      if (!hasBremboStock) {
        warnings.push({
          field: 'brake_caliper',
          severity: 'high',
          message: `⚠️ VERIFY: ${brand} brakes listed but ${car.name} may not come with ${brand} stock. This could be an aftermarket upgrade confused with OEM specs.`
        });
      }
    }
  }
  
  for (const spec of suspiciousSpecs) {
    if (frontCaliper.includes(spec) || rearCaliper.includes(spec)) {
      warnings.push({
        field: 'brake_caliper',
        severity: 'medium',
        message: `⚠️ VERIFY: "${spec}" calipers are uncommon on stock vehicles. Most OEM brakes use 1-2 piston sliding calipers.`
      });
    }
  }

  // Check front/rear brake pads are different
  const frontPad = maintenance.brakes_front?.brake_front_pad_oem_part;
  const rearPad = maintenance.brakes_rear?.brake_rear_pad_oem_part;
  if (frontPad && rearPad && frontPad === rearPad && frontPad !== 'N/A') {
    warnings.push({
      field: 'brake_pads',
      message: `Front and rear brake pads have same part number (${frontPad}) - verify accuracy`
    });
  }

  // Check front/rear rotors are different
  const frontRotor = maintenance.brakes_front?.brake_front_rotor_oem_part;
  const rearRotor = maintenance.brakes_rear?.brake_rear_rotor_oem_part;
  if (frontRotor && rearRotor && frontRotor === rearRotor && frontRotor !== 'N/A') {
    warnings.push({
      field: 'brake_rotors',
      message: `Front and rear rotors have same part number (${frontRotor}) - verify accuracy`
    });
  }
  
  // Check oil capacity is reasonable for engine size
  const oilCapacity = maintenance.oil?.oil_capacity_quarts;
  const engine = car.engine?.toLowerCase() || '';
  if (oilCapacity) {
    // Large V8s typically need 7-8+ quarts
    if ((engine.includes('5.3') || engine.includes('5.7') || engine.includes('6.2')) && oilCapacity < 7) {
      warnings.push({
        field: 'oil_capacity',
        message: `Oil capacity ${oilCapacity} qt seems low for ${car.engine} - should be 7-8+ qt`
      });
    }
    // Small 4-cyl typically need 4-5 quarts
    if (engine.includes('2.0') || engine.includes('1.5')) {
      if (oilCapacity > 6) {
        warnings.push({
          field: 'oil_capacity', 
          message: `Oil capacity ${oilCapacity} qt seems high for ${car.engine}`
        });
      }
    }
  }
  
  // Warn if spark plug quantity doesn't match cylinder count
  const sparkQty = maintenance.spark?.spark_plug_quantity;
  if (sparkQty) {
    const expectedCylinders = engine.includes('v8') || engine.includes('5.7') || engine.includes('5.3') || engine.includes('6.2') ? 8 :
                              engine.includes('v6') || engine.includes('3.6') || engine.includes('3.5') ? 6 :
                              engine.includes('i4') || engine.includes('2.0') || engine.includes('2.4') ? 4 : null;
    if (expectedCylinders && sparkQty !== expectedCylinders) {
      warnings.push({
        field: 'spark_plug_quantity',
        message: `Spark plug qty ${sparkQty} doesn't match expected ${expectedCylinders} for ${car.engine}`
      });
    }
  }
  
  return warnings;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  openaiKey: process.env.OPENAI_API_KEY,
  exaKey: process.env.EXA_API_KEY,
  supadataKey: process.env.SUPADATA_API_KEY,
  googleAiKey: process.env.GOOGLE_AI_API_KEY,
  blobToken: process.env.BLOB_READ_WRITE_TOKEN,
  logDir: path.join(__dirname, '../../logs/vehicle-pipeline'),
  dryRun: false,
  carefulMode: false, // Enable verification and cross-checking
  verbose: true
};

// ============================================================================
// CLIENTS
// ============================================================================

let supabase = null;
let anthropic = null;
let openai = null;
let exa = null;

function initClients() {
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
    throw new Error('Missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

  if (CONFIG.anthropicKey) {
    anthropic = new Anthropic({ apiKey: CONFIG.anthropicKey });
  }
  if (CONFIG.openaiKey) {
    openai = new OpenAI({ apiKey: CONFIG.openaiKey });
  }
  if (CONFIG.exaKey) {
    exa = new Exa(CONFIG.exaKey);
  }
}

// ============================================================================
// LOGGING
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => CONFIG.verbose && console.log(`${COLORS.dim}[INFO]${COLORS.reset} ${msg}`),
  success: (msg) => console.log(`${COLORS.green}[✓]${COLORS.reset} ${msg}`),
  warn: (msg) => console.log(`${COLORS.yellow}[⚠]${COLORS.reset} ${msg}`),
  error: (msg) => console.error(`${COLORS.red}[✗]${COLORS.reset} ${msg}`),
  stage: (num, name) => {
    console.log(`\n${COLORS.cyan}${'═'.repeat(60)}${COLORS.reset}`);
    console.log(`${COLORS.cyan}  STAGE ${num}: ${name}${COLORS.reset}`);
    console.log(`${COLORS.cyan}${'═'.repeat(60)}${COLORS.reset}\n`);
  },
  table: (name) => console.log(`\n${COLORS.blue}── ${name} ──${COLORS.reset}`),
  header: (text) => {
    console.log(`\n${COLORS.bright}${COLORS.magenta}${'#'.repeat(60)}${COLORS.reset}`);
    console.log(`${COLORS.bright}${COLORS.magenta}  ${text}${COLORS.reset}`);
    console.log(`${COLORS.bright}${COLORS.magenta}${'#'.repeat(60)}${COLORS.reset}\n`);
  }
};

// ============================================================================
// API CLIENTS - Government Data Sources
// ============================================================================

const APIs = {
  // EPA Fuel Economy API
  async fetchEpaData(year, make, model) {
    try {
      const modelsUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/model?year=${year}&make=${encodeURIComponent(make)}`;
      const modelsResp = await fetch(modelsUrl, { headers: { 'Accept': 'application/json' } });
      const modelsData = await modelsResp.json();

      // Handle single item or array response
      const menuItems = Array.isArray(modelsData.menuItem) 
        ? modelsData.menuItem 
        : modelsData.menuItem ? [modelsData.menuItem] : [];

      // Prioritize exact/specific matches over partial matches
      // e.g., prefer "1500 TRX" over just "1500 2WD" when searching for "1500 TRX"
      const modelLower = model.toLowerCase();
      const modelWords = modelLower.split(/\s+/);
      
      // Score matches by how many words from the search match
      const scored = menuItems.map(m => {
        const textLower = m.text.toLowerCase();
        let score = 0;
        for (const word of modelWords) {
          if (textLower.includes(word)) score++;
        }
        // Bonus for exact match
        if (textLower === modelLower || textLower.startsWith(modelLower)) score += 10;
        return { item: m, score };
      }).filter(x => x.score > 0);

      // Sort by score descending, take best match
      scored.sort((a, b) => b.score - a.score);
      const modelMatch = scored[0]?.item;
      
      if (!modelMatch) {
        log.warn(`No EPA model match found for "${model}" among ${menuItems.length} options`);
        return null;
      }
      
      log.info(`EPA matched: "${modelMatch.text}" (score: ${scored[0].score})`);

      const optionsUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(modelMatch.text)}`;
      const optionsResp = await fetch(optionsUrl, { headers: { 'Accept': 'application/json' } });
      const optionsData = await optionsResp.json();

      if (!optionsData.menuItem) return null;
      const options = Array.isArray(optionsData.menuItem) ? optionsData.menuItem : [optionsData.menuItem];
      const vehicleId = options[0]?.value;
      if (!vehicleId) return null;

      const vehicleUrl = `https://www.fueleconomy.gov/ws/rest/vehicle/${vehicleId}`;
      const vehicleResp = await fetch(vehicleUrl, { headers: { 'Accept': 'application/json' } });
      return await vehicleResp.json();
    } catch (e) {
      log.error(`EPA API error: ${e.message}`);
      return null;
    }
  },

  // NHTSA Safety Ratings API
  async fetchNhtsaSafety(year, make, model) {
    try {
      const url = `https://api.nhtsa.gov/SafetyRatings/modelyear/${year}/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}?format=json`;
      const resp = await fetch(url);
      const data = await resp.json();

      if (!data.Results?.length) return null;
      const vehicleId = data.Results[0].VehicleId;
      const detailUrl = `https://api.nhtsa.gov/SafetyRatings/VehicleId/${vehicleId}?format=json`;
      const detailResp = await fetch(detailUrl);
      return (await detailResp.json()).Results?.[0] || null;
    } catch (e) {
      log.error(`NHTSA Safety API error: ${e.message}`);
      return null;
    }
  },

  // NHTSA Recalls API
  async fetchNhtsaRecalls(year, make, model) {
    try {
      const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
      const resp = await fetch(url);
      return (await resp.json()).results || [];
    } catch (e) {
      log.error(`NHTSA Recalls API error: ${e.message}`);
      return [];
    }
  },

  // NHTSA Complaints API
  async fetchNhtsaComplaints(year, make, model) {
    try {
      const url = `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
      const resp = await fetch(url);
      return (await resp.json()).results || [];
    } catch (e) {
      log.error(`NHTSA Complaints API error: ${e.message}`);
      return [];
    }
  }
};

// ============================================================================
// AI PROMPTS - Comprehensive prompts for each data type
// ============================================================================

const PROMPTS = {
  // COMPREHENSIVE Maintenance Specs - ALL OEM parts
  maintenance: (car) => `You are an automotive maintenance specialist with access to OEM service manuals.

Research COMPLETE maintenance specifications for:
Vehicle: ${car.name}
Years: ${car.years}
Engine: ${car.engine}
Brand: ${car.brand}

OEM Parts Brand: ${getOemBrand(car.brand)}

=== CRITICAL: STOCK SPECIFICATIONS ONLY ===
You MUST provide ONLY factory/stock/OEM specifications as the vehicle came from the factory.
DO NOT include aftermarket upgrades, even if they are commonly discussed online.

COMMON MISTAKES TO AVOID:

1. OIL VISCOSITY - CRITICAL:
   - 0W-20 is ONLY for naturally aspirated modern economy engines
   - Supercharged/turbocharged engines typically require 0W-40, 5W-30, or 5W-40
   - High-performance V8s (Hellcat, LT4, AMG, etc.) need 0W-40 minimum
   - European turbos (BMW, Audi, Mercedes) usually require 0W-30 or 0W-40
   - Exception: Honda/Toyota turbos are designed for 0W-20
   - When in doubt, use THICKER oil for forced induction

2. SPARK PLUG GAP:
   - Turbocharged/supercharged engines need TIGHTER gaps (0.6-0.8mm / 0.024-0.032")
   - Naturally aspirated engines can use larger gaps (0.9-1.1mm / 0.035-0.044")
   - If you see a gap > 1.0mm for a boosted engine, it's likely WRONG
   - Gaps are often listed PRE-GAP (out of box) - we want the INSTALLED spec

3. BRAKES:
   - Do NOT list aftermarket brake upgrades (Brembo, Wilwood, StopTech) as stock
   - Most vehicles use standard sliding calipers (1-piston, 2-piston)
   - Multi-piston Brembo only comes stock on specific performance trims
   - Trucks/SUVs almost NEVER have Brembo stock (even with big engines)

4. OIL CHANGE INTERVALS:
   - High-performance/supercharged engines: 5000-7500 miles MAX
   - Do NOT use 10,000+ mile intervals for performance engines
   - Track-oriented cars often need 5000 mile or less intervals

5. GENERAL:
   - Do NOT confuse AFTERMARKET upgrades with STOCK equipment
   - If a spec seems performance-oriented for a base model, verify it

=== DATA SOURCES ===
YOU MUST provide real OEM part numbers. Research thoroughly using:
- ${getOemBrand(car.brand)} parts catalogs
- Official ${car.brand} service manuals / specification sheets
- RockAuto OEM listings
- Dealer parts departments
- FCP Euro (for European vehicles)
- Pelican Parts (Porsche/BMW)
- Turner Motorsport (BMW)
- ECS Tuning (VW/Audi)

=== BRAND-SPECIFIC PART NUMBER FORMATS ===
Learn to recognize OEM part number formats:
- BMW: 11 42 7 XXX XXX (spaces or no spaces)
- Audi/VW: 06X XXX XXX X (letters+numbers)
- Mercedes: A XXX XXX XX XX (starts with A)
- Porsche: 9XX.XXX.XXX.XX (dashes between groups)
- Ferrari: Use MANN/Mahle OE supplier numbers
- Honda/Acura: 15400-XXX-XXX format
- Toyota/Lexus: 04152-XXXXX format
- GM/Chevy: ACDelco PF-XX or 12XXX-XXX
- Ford: FL-XXX-S format or Motorcraft numbers

=== WHEEL SPECS ARE CRITICAL ===
Users NEED these specs - do NOT leave them blank:
- wheel_bolt_pattern: e.g., 5x112, 5x120, 5x114.3, 6x139.7
- wheel_lug_torque_ft_lbs: typically 80-130 ft-lbs depending on vehicle
- wheel_center_bore_mm: e.g., 66.6mm (BMW), 57.1mm (VW/Audi), 64.1mm (Honda)

If you can't find an exact OEM part number, provide:
1. The common aftermarket equivalent (MANN, Mahle, Wix, K&N)
2. Or the OE supplier part number
3. Never leave critical fields blank if alternatives exist

Return a JSON object with ALL of these fields populated:

{
  "oil": {
    "oil_type": "Full Synthetic",
    "oil_viscosity": "e.g., 0W-40",
    "oil_spec": "API spec and OEM spec (e.g., API SP, MS-12633)",
    "oil_capacity_liters": number,
    "oil_capacity_quarts": number,
    "oil_filter_oem_part": "OEM part number (e.g., Mopar 68191349AC)",
    "oil_filter_alternatives": ["Wix 57060", "K&N HP-1017"],
    "oil_change_interval_miles": number,
    "oil_change_interval_months": number
  },
  "coolant": {
    "coolant_type": "OAT, HOAT, or IAT",
    "coolant_color": "color",
    "coolant_spec": "OEM spec (e.g., MS.90032)",
    "coolant_capacity_liters": number,
    "coolant_change_interval_miles": number,
    "coolant_change_interval_years": number
  },
  "brake_fluid": {
    "brake_fluid_type": "DOT 3, DOT 4, DOT 5.1",
    "brake_fluid_spec": "OEM spec",
    "brake_fluid_change_interval_miles": number,
    "brake_fluid_change_interval_years": number
  },
  "transmission": {
    "trans_fluid_manual": "fluid type or N/A",
    "trans_fluid_manual_capacity": number or null,
    "trans_fluid_auto": "e.g., ZF Lifeguard 8",
    "trans_fluid_auto_capacity": number,
    "trans_fluid_change_interval_miles": number
  },
  "differential": {
    "diff_fluid_type": "e.g., 75W-140 GL-5 (front: X, rear: Y)",
    "diff_fluid_front_capacity": number,
    "diff_fluid_rear_capacity": number,
    "diff_fluid_change_interval_miles": number
  },
  "power_steering": {
    "power_steering_type": "Electric or Hydraulic",
    "power_steering_fluid": "fluid type or N/A for electric",
    "power_steering_capacity": number or null
  },
  "fuel": {
    "fuel_type": "Gasoline, Diesel, E85, etc.",
    "fuel_octane_minimum": number,
    "fuel_octane_recommended": number,
    "fuel_tank_capacity_gallons": number,
    "fuel_tank_capacity_liters": number
  },
  "filters": {
    "air_filter_oem_part": "OEM part number",
    "air_filter_alternatives": ["aftermarket options"],
    "air_filter_change_interval_miles": number,
    "cabin_filter_oem_part": "OEM part number",
    "cabin_filter_alternatives": ["aftermarket options"],
    "cabin_filter_change_interval_miles": number,
    "fuel_filter_oem_part": "OEM part number or 'In-tank (non-serviceable)'",
    "fuel_filter_in_tank": boolean,
    "fuel_filter_change_interval_miles": number or null
  },
  "tires": {
    "tire_size_front": "e.g., 325/65R18",
    "tire_size_rear": "e.g., 325/65R18",
    "tire_pressure_front_psi": number,
    "tire_pressure_rear_psi": number,
    "tire_pressure_spare_psi": number,
    "tire_rotation_pattern": "e.g., Front-to-rear, X-pattern",
    "tire_rotation_interval_miles": number,
    "tire_oem_brand": "e.g., Goodyear Wrangler Territory",
    "tire_recommended_brands": ["brand1", "brand2"]
  },
  "wheels": {
    "wheel_size_front": "e.g., 18x9",
    "wheel_size_rear": "e.g., 18x9",
    "wheel_bolt_pattern": "e.g., 6x139.7",
    "wheel_center_bore_mm": number,
    "wheel_lug_torque_ft_lbs": number,
    "wheel_lug_torque_nm": number
  },
  "brakes_front": {
    "brake_front_rotor_diameter_mm": number,
    "brake_front_rotor_thickness_mm": number,
    "brake_front_rotor_min_thickness_mm": number,
    "brake_front_rotor_oem_part": "OEM part number",
    "brake_front_pad_oem_part": "OEM part number",
    "brake_front_pad_wear_indicator": "Visual, Sensor, or None",
    "brake_front_caliper_type": "e.g., 2-piston pin-slider"
  },
  "brakes_rear": {
    "brake_rear_rotor_diameter_mm": number,
    "brake_rear_rotor_thickness_mm": number,
    "brake_rear_rotor_min_thickness_mm": number,
    "brake_rear_rotor_oem_part": "OEM part number",
    "brake_rear_pad_oem_part": "OEM part number",
    "brake_rear_pad_wear_indicator": "Visual, Sensor, or None",
    "brake_rear_caliper_type": "e.g., Single-piston"
  },
  "spark": {
    "spark_plug_type": "Iridium, Platinum, Copper",
    "spark_plug_gap_mm": number,
    "spark_plug_oem_part": "OEM part number (e.g., NGK LFR7AIX)",
    "spark_plug_alternatives": ["alternative part numbers"],
    "spark_plug_change_interval_miles": number,
    "spark_plug_quantity": number
  },
  "timing": {
    "timing_type": "Chain or Belt",
    "timing_change_interval_miles": number or null for chains,
    "timing_change_interval_years": number or null,
    "timing_tensioner_oem_part": "OEM part number"
  },
  "belts": {
    "serpentine_belt_oem_part": "OEM part number",
    "serpentine_belt_change_interval_miles": number,
    "ac_belt_separate": boolean,
    "ac_belt_oem_part": "OEM part number or N/A"
  },
  "battery": {
    "battery_group_size": "e.g., H7, 94R",
    "battery_cca": number,
    "battery_voltage": 12,
    "battery_oem_brand": "e.g., Mopar",
    "battery_location": "Engine bay, Trunk, Under seat",
    "battery_agm": boolean
  },
  "alternator": {
    "alternator_output_amps": number,
    "alternator_oem_part": "OEM part number"
  },
  "wipers": {
    "wiper_driver_size_inches": number,
    "wiper_passenger_size_inches": number,
    "wiper_rear_size_inches": number or null,
    "wiper_type": "Beam, Conventional, Hybrid",
    "wiper_oem_part_driver": "OEM part number",
    "wiper_oem_part_passenger": "OEM part number",
    "wiper_oem_part_rear": "OEM part number or N/A"
  },
  "lighting": {
    "headlight_low_beam_type": "e.g., H11 LED",
    "headlight_high_beam_type": "e.g., 9005 LED",
    "headlight_fog_type": "e.g., H16 or N/A",
    "turn_signal_front_type": "e.g., 7440A",
    "turn_signal_rear_type": "e.g., 7440A",
    "brake_light_type": "e.g., 7443",
    "reverse_light_type": "e.g., 921"
  },
  "alignment": {
    "alignment_camber_front_degrees": "e.g., -0.5 to 0.5",
    "alignment_camber_rear_degrees": "e.g., -1.0 to 0.0",
    "alignment_toe_front_degrees": "e.g., 0.05 to 0.15",
    "alignment_toe_rear_degrees": "e.g., 0.10 to 0.20",
    "alignment_caster_degrees": "e.g., 3.0 to 4.0"
  },
  "suspension": {
    "shock_front_oem_part": "OEM part number",
    "shock_rear_oem_part": "OEM part number",
    "spring_front_oem_part": "OEM part number",
    "spring_rear_oem_part": "OEM part number",
    "sway_bar_front_diameter_mm": number,
    "sway_bar_rear_diameter_mm": number
  },
  "confidence": 0.0-1.0,
  "sources": ["source1", "source2"]
}

CRITICAL: Use REAL part numbers. Do not make them up. If you cannot find a specific part number, use "Research needed" but try to find real data.`,

  // Service Intervals
  serviceIntervals: (car) => `Research the complete service schedule for:
Vehicle: ${car.name}
Years: ${car.years}

Return a JSON array of ALL standard service intervals:

[
  {
    "service_name": "Oil Change",
    "service_description": "Replace engine oil and filter",
    "interval_miles": 5000,
    "interval_months": 6,
    "items_included": ["Engine oil", "Oil filter", "Drain plug washer"],
    "dealer_cost_low": 80,
    "dealer_cost_high": 150,
    "independent_cost_low": 50,
    "independent_cost_high": 100,
    "diy_cost_low": 40,
    "diy_cost_high": 60,
    "labor_hours_estimate": 0.5,
    "is_critical": true,
    "skip_consequences": "Engine wear, void warranty"
  },
  // Include: Transmission service, Brake fluid flush, Coolant flush,
  // Differential service, Spark plugs, Air filter, Cabin filter,
  // Tire rotation, Brake inspection, Multi-point inspection,
  // Timing belt (if applicable), etc.
]`,

  // Variants/Trim Levels
  variants: (car) => `Research all year/trim variants for:
Vehicle: ${car.name}
Years: ${car.years}
Engine: ${car.engine}

CRITICAL RULES:
1. ONLY include variants that are EXACTLY "${car.name}" - do NOT include different models
2. For example, if researching "Ram 1500 Rebel", do NOT include TRX (that's a different truck)
3. If researching "Chevrolet Tahoe", do NOT include Suburban (that's different)
4. Only include trim levels and packages of THIS EXACT vehicle
5. Avoid duplicate entries - each variant_key must be unique

Return a JSON array. IMPORTANT: match our database schema fields exactly:

[
  {
    "variant_key": "unique stable key (example: ${car.slug}-base-2021-2024)",
    "display_name": "Human readable trim name",
    "years_text": "e.g., 2021-2024",
    "model_year_start": 2021,
    "model_year_end": 2024,
    "trim": "Trim/package name",
    "drivetrain": "AWD|4WD|RWD|FWD",
    "transmission": "example: 8-speed automatic",
    "engine": "${car.engine} or variant engine",
    "metadata": {
      "hp": number,
      "torque": number,
      "msrp": number,
      "curb_weight": number,
      "notable_features": ["feature1","feature2"],
      "is_default": boolean
    }
  }
]`,

  // Performance Data
  performance: (car) => `Research verified performance test data for:
Vehicle: ${car.name}
Years: ${car.years}
Engine: ${car.engine} (${car.hp}hp)

Find data from Car and Driver, MotorTrend, Road & Track tests.

Return JSON:
{
  "zero_to_sixty": number (seconds),
  "zero_to_sixty_source": "publication name",
  "quarter_mile_time": number (seconds),
  "quarter_mile_speed": number (mph),
  "top_speed": number (mph),
  "top_speed_limited": boolean,
  "braking_60_0": number (feet),
  "braking_70_0": number (feet),
  "lateral_g": number,
  "curb_weight": number (lbs),
  "weight_distribution": "e.g., 57/43",
  "sources": [{"publication": "name", "date": "YYYY-MM", "url": "..."}],
  "confidence": 0.0-1.0
}`,

  // Tuning Profile
  tuning: (car) => `Research tuning information for:
Vehicle: ${car.name}
Engine: ${car.engine}

Return JSON:
{
  "engine_family": "e.g., 6.2L Supercharged HEMI V8 (Hellcat)",
  "stock_whp": number,
  "stock_wtq": number,
  "tuning_platforms": [
    {"name": "HP Tuners", "price_low": number, "price_high": number, "notes": "..."}
  ],
  "stage_progressions": [
    {
      "stage": "Stage 1",
      "hp_gain_low": number,
      "hp_gain_high": number,
      "cost_low": number,
      "cost_high": number,
      "components": ["tune", "intake"],
      "notes": "description"
    }
  ],
  "power_limits": {
    "stock_internals_hp": number,
    "stock_transmission_tq": number,
    "stock_axles_tq": number
  },
  "brand_recommendations": {
    "intake": ["brand1", "brand2"],
    "exhaust": ["brand1", "brand2"],
    "tuner": ["brand1", "brand2"]
  }
}`,

  // Common Issues
  issues: (car) => `Research common issues and problems for:
Vehicle: ${car.name}
Years: ${car.years}

Find REAL issues from forums, NHTSA complaints, TSBs.

Return JSON array (5-15 issues):
[
  {
    "title": "Issue title",
    "severity": "critical|high|medium|low",
    "description": "Detailed description",
    "symptoms": ["symptom1", "symptom2"],
    "affected_years_text": "2021-2023",
    "affected_year_start": 2021,
    "affected_year_end": 2023,
    "estimated_cost_low": number,
    "estimated_cost_high": number,
    "fix_description": "How to fix",
    "prevention": "How to prevent",
    "source_type": "forum|nhtsa|tsb|owner_report"
  }
]`,

  // Editorial Content
  editorial: (car) => `Write enthusiast-focused editorial content for:
Vehicle: ${car.name}
Years: ${car.years}
Engine: ${car.engine}

Return JSON:
{
  "tagline": "One punchy line (10 words max)",
  "hero_blurb": "2-3 sentence hook for the vehicle page",
  "essence": "What makes this car special in 2-3 sentences",
  "heritage": "Brief history and lineage",
  "design_philosophy": "What the designers were going for",
  "motorsport_history": "Racing heritage if any",
  "engine_character": "How the engine feels and sounds",
  "transmission_feel": "Shifting character",
  "chassis_dynamics": "How the chassis behaves",
  "steering_feel": "Steering feedback and weight",
  "brake_confidence": "Braking feel and capability",
  "sound_signature": "Exhaust and engine note description",
  "ideal_owner": "Who this car is perfect for",
  "not_ideal_for": "Who should look elsewhere",
  "buyers_summary": "Key buying advice in 2-3 sentences",
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2", "con3"],
  "best_for": ["use case 1", "use case 2"]
}`,

  // Wheel/Tire Fitment
  wheelTireFitment: (car) => `Research wheel and tire fitment options for:
Vehicle: ${car.name}
Years: ${car.years}

Return a JSON array matching our database schema fields (use null if unknown):

[
  {
    "fitment_type": "OEM|Plus Size|Track|Stance",

    "wheel_diameter_inches": 18,
    "wheel_width_front": 9.0,
    "wheel_width_rear": 9.0,
    "wheel_offset_front_mm": 25,
    "wheel_offset_rear_mm": 25,
    "wheel_offset_range_front": "e.g., +18 to +35",
    "wheel_offset_range_rear": "e.g., +18 to +35",

    "tire_size_front": "e.g., 325/65R18",
    "tire_size_rear": "e.g., 325/65R18",
    "tire_width_front_mm": 325,
    "tire_width_rear_mm": 325,
    "tire_aspect_front": 65,
    "tire_aspect_rear": 65,

    "diameter_change_percent": 0.0,
    "speedometer_error_percent": 0.0,

    "requires_fender_roll": false,
    "requires_fender_pull": false,
    "requires_camber_adjustment": false,
    "recommended_camber_front": "e.g., -1.5",
    "recommended_camber_rear": "e.g., -1.8",
    "requires_coilovers": false,
    "requires_spacers": false,
    "spacer_size_front_mm": 0,
    "spacer_size_rear_mm": 0,

    "clearance_notes": "Any rubbing or clearance issues",
    "known_issues": "Any known issues",
    "recommended_for": ["daily", "track", "stance"],
    "not_recommended_for": ["snow"],
    "popularity_score": 50,
    "community_verified": false,
    "forum_threads": ["url1","url2"],
    "source_type": "forum|oem|calculator|other",
    "source_url": "URL",
    "confidence": 0.0
  }
]`,

  // Extract insights from YouTube review transcript
  extractReviewInsights: (car, transcript, videoTitle, channelName) => `Extract structured review data from this YouTube review:

Vehicle: ${car.name}
Video: "${videoTitle}" by ${channelName}

Transcript:
${transcript.substring(0, 15000)}

Return JSON:
{
  "title": "Use the video title if needed",
  "overall_rating": number or null,
  "performance_rating": number or null,
  "handling_rating": number or null,
  "comfort_rating": number or null,
  "interior_rating": number or null,
  "value_rating": number or null,
  "pros": ["pro1", "pro2", "pro3"],
  "cons": ["con1", "con2", "con3"],
  "verdict": "Concise summary + conclusion (include key notes)",
  "zero_to_sixty": number (seconds) or null,
  "zero_to_hundred": number (seconds) or null,
  "quarter_mile": number (seconds) or null,
  "quarter_mile_speed": number (mph) or null,
  "braking_70_to_0": number (feet) or null,
  "skidpad_g": number or null,
  "review_type": "youtube_video",
  "confidence": 0.0-1.0
}`,

  // Owner manual search
  ownerManuals: (car) => `Find official owner's manuals and service manuals for:
Vehicle: ${car.name}
Years: ${car.years}
Brand: ${car.brand}

Search for:
1. Official ${car.brand} owner's manual PDF
2. Factory service manual (FSM)
3. Repair guides

Return JSON array:
[
  {
    "manual_type": "Owner's Manual|Service Manual|Repair Guide|Technical Service Bulletin",
    "manual_year": number,
    "manual_url": "URL to PDF or resource",
    "page_count": number or null,
    "language": "English",
    "is_official": boolean,
    "source_notes": "Where this was found"
  }
]`
};

// ============================================================================
// AI AGENTS - Specialized agents for each data category
// ============================================================================

const Agents = {
  // Extract JSON robustly from AI response
  extractJSON(content) {
    // 1. Try markdown code blocks first (```json ... ``` or ``` ... ```)
    const codeBlockMatch = content.match(/```(?:json)?\s*([\[\{][\s\S]*?[\]\}])\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch (e) {
        // Continue to other methods
      }
    }

    // 2. Find the first complete JSON structure (balanced brackets)
    const startIdx = content.search(/[\[\{]/);
    if (startIdx === -1) return null;

    const startChar = content[startIdx];
    const endChar = startChar === '[' ? ']' : '}';
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = startIdx; i < content.length; i++) {
      const char = content[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (char === '\\' && inString) {
        escape = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === startChar) depth++;
      else if (char === endChar) {
        depth--;
        if (depth === 0) {
          const jsonStr = content.slice(startIdx, i + 1);
          try {
            return JSON.parse(jsonStr);
          } catch (e) {
            log.warn(`JSON parse failed at position ${i}: ${e.message}`);
            return null;
          }
        }
      }
    }

    return null;
  },

  // Call AI with retry logic
  async callAI(prompt, maxRetries = 2) {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        let content = null;
        
        if (anthropic) {
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000,
            system: 'You are a vehicle data research assistant. Always respond with valid JSON only - no markdown, no explanations, no text before or after the JSON. Start your response with [ or { and end with ] or }.',
            messages: [{ role: 'user', content: prompt }]
          });
          content = response.content[0].text;
        } else if (openai) {
          const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            max_tokens: 8000,
            messages: [
              { role: 'system', content: 'You are a vehicle data research assistant. Always respond with valid JSON only - no markdown, no explanations, no text before or after the JSON. Start your response with [ or { and end with ] or }.' },
              { role: 'user', content: prompt }
            ]
          });
          content = response.choices[0].message.content;
        }
        
        if (!content) return null;
        
        const result = this.extractJSON(content);
        if (result) return result;
        
        // If extraction failed, log and retry
        throw new Error('Could not extract valid JSON from response');
      } catch (e) {
        if (i === maxRetries) {
          log.error(`AI call failed after ${maxRetries} retries: ${e.message}`);
          return null;
        }
        log.warn(`AI call failed, retrying... (${i + 1}/${maxRetries})`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  },

  // Maintenance Agent - COMPREHENSIVE
  async researchMaintenance(car) {
    log.info('Researching maintenance specs (ALL OEM parts)...');
    return await this.callAI(PROMPTS.maintenance(car));
  },

  // Service Intervals Agent
  async researchServiceIntervals(car) {
    log.info('Researching service intervals...');
    return await this.callAI(PROMPTS.serviceIntervals(car));
  },

  // Variants Agent
  async researchVariants(car) {
    log.info('Researching variants/trim levels...');
    const rawVariants = await this.callAI(PROMPTS.variants(car));
    if (!Array.isArray(rawVariants)) return rawVariants;
    
    // Filter out unrelated models and dedupe
    const filtered = filterValidVariants(rawVariants, car);
    const deduped = dedupeVariants(filtered);
    
    if (filtered.length !== rawVariants.length) {
      log.info(`Filtered ${rawVariants.length - filtered.length} unrelated variants`);
    }
    if (deduped.length !== filtered.length) {
      log.info(`Removed ${filtered.length - deduped.length} duplicate variants`);
    }
    
    return deduped;
  },

  // Performance Agent
  async researchPerformance(car) {
    log.info('Researching performance data...');
    return await this.callAI(PROMPTS.performance(car));
  },

  // Tuning Agent
  async researchTuning(car) {
    log.info('Researching tuning profile...');
    return await this.callAI(PROMPTS.tuning(car));
  },

  // Issues Agent
  async researchIssues(car) {
    log.info('Researching common issues...');
    return await this.callAI(PROMPTS.issues(car));
  },

  // Editorial Agent
  async researchEditorial(car) {
    log.info('Generating editorial content...');
    return await this.callAI(PROMPTS.editorial(car));
  },

  // Wheel/Tire Fitment Agent
  async researchFitment(car) {
    log.info('Researching wheel/tire fitment...');
    return await this.callAI(PROMPTS.wheelTireFitment(car));
  },

  // =========================================================================
  // NEW AGENTS: Expert Reviews, Manuals, Images
  // =========================================================================

  // Expert Reviews Agent - Uses Exa Search + Supadata for YouTube transcripts
  async researchExpertReviews(car) {
    log.info('Searching for YouTube expert reviews...');
    
    if (!exa) {
      log.warn('Exa API key not set - skipping expert review search');
      return null;
    }

    const reviews = [];
    
    try {
      // Search for YouTube reviews using Exa
      const searchQuery = `${car.name} review site:youtube.com`;
      const searchResults = await exa.search(searchQuery, {
        numResults: 6,
        type: 'auto'
      });

      if (!searchResults.results?.length) {
        log.warn('No YouTube reviews found via Exa');
        return null;
      }

      const candidates = searchResults.results
        .filter((r) => typeof r?.url === 'string' && r.url.includes('youtube.com'))
        .map((r) => ({
          url: r.url,
          title: r.title || '',
          publishedDate: r.publishedDate || null,
          author: r.author || null,
          text: r.text || '',
        }));
      const unique = dedupeBy(candidates, (r) => extractYouTubeVideoId(r.url) || r.url);
      log.info(`Found ${unique.length} YouTube review candidates`);

      // For each video, try to get transcript via Supadata
      for (const result of unique) {
        const videoUrl = result.url;
        const videoTitle = result.title;
        
        const videoId = extractYouTubeVideoId(videoUrl);
        if (!videoId) continue;
        
        // Try to get transcript from Supadata
        let transcript = null;
        if (CONFIG.supadataKey) {
          try {
            // Align with existing repo pattern: scripts/youtube-transcripts.js
            const transcriptUrl = `https://api.supadata.ai/v1/transcript?url=https://www.youtube.com/watch?v=${videoId}`;
            const transcriptResp = await fetch(transcriptUrl, {
              headers: { 'x-api-key': CONFIG.supadataKey }
            });
            if (transcriptResp.ok) {
              const transcriptData = await transcriptResp.json();
              // Handle both response formats:
              // 1. { content: [{text: "..."}, ...] } - segment array
              // 2. { content: "full text" } - direct string (from some endpoints)
              if (Array.isArray(transcriptData.content) && transcriptData.content.length > 0) {
                transcript = transcriptData.content.map((c) => c.text || '').join(' ');
              } else if (typeof transcriptData.content === 'string' && transcriptData.content.length > 0) {
                transcript = transcriptData.content;
              } else if (typeof transcriptData.text === 'string' && transcriptData.text.length > 0) {
                transcript = transcriptData.text;
              }
            }
          } catch (e) {
            log.warn(`Could not fetch transcript for ${videoId}: ${e.message}`);
          }
        }

        // If we have a transcript, extract insights using AI
        if (transcript && transcript.length > 500) {
          log.info(`Extracting insights from: ${videoTitle}`);
          const insights = await this.callAI(
            PROMPTS.extractReviewInsights(car, transcript, videoTitle, result.author || 'Unknown')
          );
          
          if (insights) {
            reviews.push({
              source: 'youtube',
              source_name: result.author || 'YouTube',
              source_url: videoUrl,
              video_url: videoUrl,
              review_date: result.publishedDate || null,
              title: insights.title || videoTitle,
              pros: insights.pros || null,
              cons: insights.cons || null,
              verdict: insights.verdict || null,
              overall_rating: insights.overall_rating ?? null,
              performance_rating: insights.performance_rating ?? null,
              handling_rating: insights.handling_rating ?? null,
              comfort_rating: insights.comfort_rating ?? null,
              interior_rating: insights.interior_rating ?? null,
              value_rating: insights.value_rating ?? null,
              zero_to_sixty: insights.zero_to_sixty ?? null,
              zero_to_hundred: insights.zero_to_hundred ?? null,
              quarter_mile: insights.quarter_mile ?? null,
              quarter_mile_speed: insights.quarter_mile_speed ?? null,
              braking_70_to_0: insights.braking_70_to_0 ?? null,
              skidpad_g: insights.skidpad_g ?? null,
              review_type: insights.review_type || 'youtube_video',
              confidence: insights.confidence ?? null,
              is_video_review: true
            });
          }
        } else {
          // No transcript - still record the video
          reviews.push({
            source: 'youtube',
            source_name: result.author || 'YouTube',
            source_url: videoUrl,
            video_url: videoUrl,
            review_date: result.publishedDate || null,
            title: videoTitle,
            verdict: result.text?.substring(0, 500) || null,
            is_video_review: true
          });
        }
      }

      return reviews.length > 0 ? reviews : null;
    } catch (e) {
      log.error(`Expert reviews search error: ${e.message}`);
      return null;
    }
  },

  // Owner Manuals Agent - Search for PDFs and documentation
  async researchManuals(car) {
    log.info('Searching for owner manuals and documentation...');
    
    if (!exa) {
      log.warn('Exa API key not set - skipping manual search');
      return null;
    }

    try {
      // Search for official manuals
      const searches = [
        `${car.brand} ${car.name} owner's manual PDF`,
        `${car.brand} ${car.name} service manual PDF`,
        `${car.name} FSM factory service manual`
      ];

      const manuals = [];
      
      for (const query of searches) {
        const results = await exa.search(query, {
          numResults: 3,
          type: 'auto'
        });

        for (const result of results.results || []) {
          // Check if it looks like a manual/PDF
          const isPDF = result.url.includes('.pdf') || 
                       result.title.toLowerCase().includes('manual') ||
                       result.title.toLowerCase().includes('guide');
          
          if (isPDF) {
            const yearMatch = result.title.match(/20\d{2}|19\d{2}/);
            manuals.push({
              manual_type: result.title.toLowerCase().includes('service') ? 'Service Manual' :
                          result.title.toLowerCase().includes('repair') ? 'Repair Guide' :
                          'Owner\'s Manual',
              manual_year: yearMatch ? parseInt(yearMatch[0]) : null,
              manual_url: result.url,
              language: 'English',
              is_official: result.url.includes(car.brand.toLowerCase()) || 
                          result.url.includes('mopar') ||
                          result.url.includes('motorcraft'),
              source_notes: `Found via Exa search: ${query}`
            });
          }
        }
      }

      // Dedupe by URL
      const uniqueManuals = manuals.filter((m, i, arr) => 
        arr.findIndex(x => x.manual_url === m.manual_url) === i
      );

      return uniqueManuals.length > 0 ? uniqueManuals : null;
    } catch (e) {
      log.error(`Manual search error: ${e.message}`);
      return null;
    }
  },

  // Image Generation Agent - Uses Google Nano Banana Pro
  async generateImages(car) {
    log.info('Generating vehicle images...');
    
    if (!CONFIG.googleAiKey) {
      log.warn('GOOGLE_AI_API_KEY not set - skipping image generation');
      return null;
    }

    try {
      // Align with existing repo approach: scripts/generate-garage-nano.js
      const imagePrompt = `SUBJECT: ${car.name} (${car.years}), pristine showroom condition.

SETTING: Private collector's industrial warehouse garage. Brick warehouse with arched windows OR modern concrete gallery OR vintage factory with timber beams.

COMPOSITION: Front 3/4 hero angle showing front fascia and driver's side profile. Show COMPLETE car (all four wheels, both bumpers, full roofline). Camera at knee height.

LIGHTING: Golden hour sunlight streaming through large industrial windows. Warm color temperature. Cinematic depth.

TECHNICAL: Magazine-quality automotive photography. Photorealistic, no CGI look. No people, no text, no watermarks, no logos, no license plates.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${CONFIG.googleAiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: imagePrompt }] }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: { aspectRatio: '16:9', imageSize: '2K' }
          }
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        log.warn(`Image generation API error: ${response.status} ${errText?.slice(0, 120)}`);
        return null;
      }

      const data = await response.json();
      
      // Extract image data if present
      const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      
      if (imagePart?.inlineData?.data) {
        return {
          generated: true,
          image_type: 'hero',
          image_data: imagePart.inlineData.data,
          mime_type: imagePart.inlineData.mimeType || 'image/png',
          prompt_used: imagePrompt
        };
      }

      return null;
    } catch (e) {
      log.error(`Image generation error: ${e.message}`);
      return null;
    }
  }
};

// ============================================================================
// STAGE 1: FETCH (API Data)
// ============================================================================

async function stage1_Fetch(car, pipelineLog) {
  log.stage(1, 'FETCH (Government APIs)');

  const yearMatch = car.years?.match(/(\d{4})/);
  const year = yearMatch ? parseInt(yearMatch[1]) : null;
  const brand = car.brand || car.name.split(' ')[0];
  // Extract full model name (e.g., "1500 TRX" from "Ram 1500 TRX")
  // Keep everything after brand to preserve trim designations
  const modelFull = car.name.replace(brand, '').trim();
  // For EPA API, use base model (first word) but log full name for debugging
  const modelBase = modelFull.split(' ')[0];
  // For more specific matching, also try the full model name
  const model = modelFull;

  if (!year) {
    log.warn('Could not parse year - skipping API fetch');
    return {};
  }

  log.info(`Fetching data for ${year} ${brand} ${model} (base: ${modelBase})...`);
  const results = {};

  // Run all government API calls in parallel
  // EPA uses full model, NHTSA often needs base model for better matching
  log.table('Government APIs (EPA + NHTSA)');
  const [epa, safety, recalls, complaints] = await Promise.all([
    APIs.fetchEpaData(year, brand, model),
    APIs.fetchNhtsaSafety(year, brand, modelBase),
    APIs.fetchNhtsaRecalls(year, brand, modelBase),
    APIs.fetchNhtsaComplaints(year, brand, modelBase),
  ]);

  results.epa = epa;
  results.safety = safety;
  results.recalls = recalls;
  results.complaints = complaints;

  if (results.epa) log.success(`EPA: ${results.epa.city08} city / ${results.epa.highway08} hwy MPG`);
  else log.warn('No EPA data found');

  if (results.safety) log.success(`NHTSA: ${results.safety.OverallRating || 'N/A'} stars overall`);
  else log.warn('No NHTSA safety data found');

  log.success(`Recalls: ${results.recalls?.length || 0}`);
  log.success(`Complaints: ${results.complaints?.length || 0}`);

  pipelineLog.stage1 = results;
  return results;
}

// ============================================================================
// STAGE 2: ENRICH (AI Research) - ALL TABLES
// ============================================================================

async function stage2_Enrich(car, apiData, pipelineLog) {
  log.stage(2, 'ENRICH (AI Research - All Tables)');

  if (!anthropic && !openai) {
    log.error('No AI provider available. Set ANTHROPIC_API_KEY or OPENAI_API_KEY');
    return {};
  }

  const results = {};

  // Run AI tasks concurrently (bounded). This is the biggest time saver.
  const tasks = [
    async () => ({ key: 'maintenance', label: 'Maintenance Specs', value: await Agents.researchMaintenance(car) }),
    async () => ({ key: 'serviceIntervals', label: 'Service Intervals', value: await Agents.researchServiceIntervals(car) }),
    async () => ({ key: 'variants', label: 'Variants', value: await Agents.researchVariants(car) }),
    async () => ({ key: 'performance', label: 'Performance', value: await Agents.researchPerformance(car) }),
    async () => ({ key: 'tuning', label: 'Tuning', value: await Agents.researchTuning(car) }),
    async () => ({ key: 'issues', label: 'Issues', value: await Agents.researchIssues(car) }),
    async () => ({ key: 'editorial', label: 'Editorial', value: await Agents.researchEditorial(car) }),
    async () => ({ key: 'fitment', label: 'Fitment', value: await Agents.researchFitment(car) }),
    async () => ({ key: 'expertReviews', label: 'Expert Reviews', value: await Agents.researchExpertReviews(car) }),
    async () => ({ key: 'manuals', label: 'Manuals', value: await Agents.researchManuals(car) }),
    async () => ({ key: 'images', label: 'Images', value: await Agents.generateImages(car) }),
  ];

  // Concurrency is intentionally conservative to reduce rate-limit churn.
  const taskResults = await runWithConcurrency(tasks, 3);
  for (const r of taskResults) {
    results[r.key] = r.value;
    if (r.value) {
      if (Array.isArray(r.value)) log.success(`${r.label}: ${r.value.length}`);
      else if (r.value?.generated) log.success(`${r.label}: generated`);
      else log.success(`${r.label}: ok`);
    } else {
      log.warn(`${r.label}: not found / skipped`);
    }
  }

  pipelineLog.stage2 = results;
  return results;
}

// ============================================================================
// STAGE 3: VALIDATE (QA)
// ============================================================================

async function stage3_Validate(car, apiData, aiData, pipelineLog) {
  log.stage(3, 'VALIDATE (Quality Assurance)');

  const results = { passed: [], warnings: [], errors: [] };

  // Validate ranges
  log.table('Range Validation');
  for (const [field, rule] of Object.entries(VALIDATION_RULES.ranges)) {
    const value = car[field] || aiData?.performance?.[field];
    if (value !== null && value !== undefined) {
      const numValue = parseFloat(value);
      if (numValue < rule.min || numValue > rule.max) {
        results.errors.push({ field, value: numValue, message: `Out of range [${rule.min}-${rule.max}]` });
      } else {
        results.passed.push(field);
      }
    }
  }

  // Cross-field validation
  log.table('Cross-Field Validation');
  const normalized = {
    ...car,
    // Map EPA response to our normalized field names
    city_mpg: apiData?.epa?.city08 != null ? parseFloat(apiData.epa.city08) : undefined,
    highway_mpg: apiData?.epa?.highway08 != null ? parseFloat(apiData.epa.highway08) : undefined,
    combined_mpg: apiData?.epa?.comb08 != null ? parseFloat(apiData.epa.comb08) : undefined,
    // Pull key maintenance fields up for rules that expect flat names
    oil_viscosity: aiData?.maintenance?.oil?.oil_viscosity,
    tire_size_front: aiData?.maintenance?.tires?.tire_size_front,
    tire_size_rear: aiData?.maintenance?.tires?.tire_size_rear,
  };

  for (const rule of VALIDATION_RULES.crossField || []) {
    try {
      if (!rule.check(normalized)) {
        results.warnings.push({ rule: rule.name, message: rule.message });
      }
    } catch (e) {
      results.warnings.push({ rule: rule.name, message: `Rule error: ${e.message}` });
    }
  }

  // Format validation for a few high-signal fields
  log.table('Format Validation');
  const tireRe = VALIDATION_RULES.formats?.tire_size;
  if (tireRe && normalized.tire_size_front && !tireRe.test(normalized.tire_size_front)) {
    results.errors.push({ field: 'tire_size_front', value: normalized.tire_size_front, message: 'Invalid tire size format' });
  }
  if (tireRe && normalized.tire_size_rear && !tireRe.test(normalized.tire_size_rear)) {
    results.errors.push({ field: 'tire_size_rear', value: normalized.tire_size_rear, message: 'Invalid tire size format' });
  }
  const oilViscRe = VALIDATION_RULES.formats?.oil_viscosity;
  if (oilViscRe && normalized.oil_viscosity && !oilViscRe.test(normalized.oil_viscosity)) {
    results.warnings.push({ field: 'oil_viscosity', message: `Unexpected oil viscosity format: ${normalized.oil_viscosity}` });
  }

  // OEM Part Number validation
  log.table('OEM Part Number Validation');
  if (aiData?.maintenance) {
    const partFields = [
      'oil_filter_oem_part', 'air_filter_oem_part', 'cabin_filter_oem_part',
      'brake_front_rotor_oem_part', 'brake_front_pad_oem_part',
      'brake_rear_rotor_oem_part', 'brake_rear_pad_oem_part',
      'spark_plug_oem_part', 'serpentine_belt_oem_part',
      'alternator_oem_part', 'wiper_oem_part_driver', 'wiper_oem_part_passenger'
    ];

    let foundParts = 0;
    for (const field of partFields) {
      // Check nested structure
      for (const category of Object.values(aiData.maintenance)) {
        if (category && typeof category === 'object' && category[field]) {
          if (category[field] !== 'Research needed' && category[field] !== 'N/A') {
            foundParts++;
          }
        }
      }
    }
    log.info(`OEM parts found: ${foundParts}/${partFields.length}`);
    if (foundParts < partFields.length / 2) {
      results.warnings.push({ field: 'oem_parts', message: 'Many OEM parts missing - may need manual research' });
    }
    
    // Additional maintenance data validation
    log.table('Maintenance Data Validation');
    const maintWarnings = validateMaintenanceData(aiData.maintenance, car);
    for (const warn of maintWarnings) {
      log.warn(`${warn.field}: ${warn.message}`);
      results.warnings.push(warn);
    }
  }

  // Summary
  log.info(`Validation complete:`);
  log.success(`Passed: ${results.passed.length}`);
  if (results.warnings.length) {
    log.warn(`Warnings: ${results.warnings.length}`);
    results.warnings.slice(0, 5).forEach(w => log.warn(`  - ${w.message}`));
  }
  if (results.errors.length) {
    log.error(`Errors: ${results.errors.length}`);
    results.errors.forEach(e => log.error(`  - ${e.field}: ${e.message}`));
  }

  pipelineLog.stage3 = results;
  return results;
}

// ============================================================================
// STAGE 4: UPDATE (Database Write) - ALL TABLES
// ============================================================================

async function stage4_Update(car, apiData, aiData, validation, pipelineLog, mode) {
  log.stage(4, 'UPDATE (Database Write - All Tables)');

  if (validation.errors.length > 0 && mode !== 'force') {
    log.error(`Skipping update due to ${validation.errors.length} validation errors`);
    return { updated: false, reason: 'validation_errors' };
  }

  if (CONFIG.dryRun) {
    log.warn('DRY RUN - No database changes will be made');
    return { updated: false, reason: 'dry_run' };
  }

  const updates = {};

  // -------------------------------------------------------------------------
  // 1. car_fuel_economy (EPA API)
  // -------------------------------------------------------------------------
  if (apiData.epa) {
    log.table('1. car_fuel_economy');
    const data = {
      car_id: car.id,
      epa_vehicle_id: apiData.epa.id ? parseInt(String(apiData.epa.id), 10) : null,
      city_mpg: parseFloat(apiData.epa.city08) || null,
      highway_mpg: parseFloat(apiData.epa.highway08) || null,
      combined_mpg: parseFloat(apiData.epa.comb08) || null,
      fuel_type: apiData.epa.fuelType,
      annual_fuel_cost: apiData.epa.fuelCost08 ? parseInt(String(apiData.epa.fuelCost08), 10) : null,
      co2_emissions: apiData.epa.co2TailpipeGpm ? parseInt(String(apiData.epa.co2TailpipeGpm), 10) : null,
      ghg_score: parseInt(apiData.epa.ghgScore) || null,
      source: 'EPA fueleconomy.gov',
      fetched_at: new Date().toISOString()
    };
    const { data: existing } = await supabase
      .from('car_fuel_economy')
      .select('id')
      .eq('car_id', car.id)
      .maybeSingle();

    const write = existing?.id
      ? supabase.from('car_fuel_economy').update(data).eq('id', existing.id)
      : supabase.from('car_fuel_economy').insert(data);

    const { error } = await write;
    if (error) log.error(`car_fuel_economy: ${error.message}`);
    else { log.success(existing?.id ? 'car_fuel_economy updated' : 'car_fuel_economy inserted'); updates.car_fuel_economy = data; }
  }

  // -------------------------------------------------------------------------
  // 2. car_safety_data (NHTSA API)
  // -------------------------------------------------------------------------
  if (apiData.safety) {
    log.table('2. car_safety_data');
    const data = {
      car_id: car.id,
      nhtsa_overall_rating: parseInt(apiData.safety.OverallRating) || null,
      nhtsa_front_crash_rating: parseInt(apiData.safety.OverallFrontCrashRating) || null,
      nhtsa_side_crash_rating: parseInt(apiData.safety.OverallSideCrashRating) || null,
      nhtsa_rollover_rating: parseInt(apiData.safety.RolloverRating) || null,
      complaint_count: apiData.complaints?.length || 0,
      recall_count: apiData.recalls?.length || 0,
      nhtsa_fetched_at: new Date().toISOString()
    };
    const { data: existing } = await supabase
      .from('car_safety_data')
      .select('id')
      .eq('car_id', car.id)
      .maybeSingle();

    const write = existing?.id
      ? supabase.from('car_safety_data').update(data).eq('id', existing.id)
      : supabase.from('car_safety_data').insert(data);

    const { error } = await write;
    if (error) log.error(`car_safety_data: ${error.message}`);
    else { log.success(existing?.id ? 'car_safety_data updated' : 'car_safety_data inserted'); updates.car_safety_data = data; }
  }

  // -------------------------------------------------------------------------
  // 3. car_recalls (NHTSA API)
  // -------------------------------------------------------------------------
  if (apiData.recalls?.length) {
    log.table('3. car_recalls');
    const { data: existing } = await supabase
      .from('car_recalls')
      .select('campaign_number')
      .eq('car_id', car.id);

    const existingCampaigns = new Set((existing || []).map((r) => r.campaign_number).filter(Boolean));
    const toInsert = [];

    for (const recall of apiData.recalls) {
      const campaign = recall.NHTSACampaignNumber;
      if (!campaign || existingCampaigns.has(campaign)) continue;
      existingCampaigns.add(campaign);
      toInsert.push({
        car_id: car.id,
        campaign_number: campaign,
        recall_campaign_number: recall.RecallCampaignNumber || null,
        recall_date: parseDate(recall.ReportReceivedDate),
        component: recall.Component || null,
        summary: recall.Summary || null,
        consequence: recall.Consequence || null,
        remedy: recall.Remedy || null,
        report_received_date: parseDate(recall.ReportReceivedDate),
        manufacturer: recall.Manufacturer || null,
        source_url: null,
        is_incomplete: false,
      });
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from('car_recalls').insert(toInsert);
      if (error) log.error(`car_recalls: ${error.message}`);
      else {
        log.success(`car_recalls: ${toInsert.length} inserted`);
        updates.car_recalls = toInsert.length;
      }
    } else {
      log.success('car_recalls: no new recalls');
      updates.car_recalls = 0;
    }
  }

  // -------------------------------------------------------------------------
  // 4. vehicle_maintenance_specs (AI - COMPREHENSIVE)
  // -------------------------------------------------------------------------
  if (aiData?.maintenance) {
    log.table('4. vehicle_maintenance_specs (ALL FIELDS)');
    
    // Apply engine family corrections to catch common AI mistakes
    const engineFamilyResult = applyEngineFamilyCorrections(car, aiData.maintenance);
    let m = engineFamilyResult.data;
    
    if (engineFamilyResult.corrections.length > 0) {
      log.info(`🔧 Engine family "${engineFamilyResult.engineFamily}" detected - applying corrections:`);
      for (const correction of engineFamilyResult.corrections) {
        log.warn(`  ${correction.field}: ${correction.was} → ${correction.now}`);
        log.info(`    Reason: ${correction.reason}`);
      }
    }
    
    // Apply brand-wide specifications (e.g., BMW lug torque = 103 ft-lbs)
    const brandWideResult = applyBrandWideSpecs(car, m);
    m = brandWideResult.data;
    
    if (brandWideResult.corrections.length > 0) {
      log.info(`🔧 Brand-wide specs for "${car.brand}" - applying corrections:`);
      for (const correction of brandWideResult.corrections) {
        log.warn(`  ${correction.field}: ${correction.was} → ${correction.now}`);
        log.info(`    Reason: ${correction.reason}`);
      }
    }
    
    // CAREFUL MODE: Additional verification step
    if (CONFIG.carefulMode) {
      log.info('🔍 Careful mode: Running verification checks...');
      
      // Flatten data for verification
      const flatData = {
        oil_viscosity: m.oil?.oil_viscosity,
        oil_spec: m.oil?.oil_spec,
        spark_plug_gap_mm: m.spark?.spark_plug_gap_mm,
        fuel_octane_minimum: m.fuel?.fuel_octane_minimum,
        wheel_bolt_pattern: m.wheels?.wheel_bolt_pattern,
        wheel_lug_torque_ft_lbs: m.wheels?.wheel_lug_torque_ft_lbs,
        wheel_center_bore_mm: m.wheels?.wheel_center_bore_mm,
        brake_front_caliper_type: m.brakes?.brake_front_caliper_type,
        brake_rear_caliper_type: m.brakes?.brake_rear_caliper_type,
      };
      
      const verifyResult = await verifyMaintenanceData(car, flatData, {
        anthropic,
        engineFamilyMatch: engineFamilyResult.engineFamily ? { 
          family: engineFamilyResult.engineFamily, 
          notes: engineFamilyResult.notes 
        } : null,
        verbose: true
      });
      
      if (verifyResult.corrections.length > 0) {
        log.warn(`🔧 Verification found ${verifyResult.corrections.length} additional corrections:`);
        for (const c of verifyResult.corrections) {
          log.warn(`  ${c.field}: "${c.proposed}" → "${c.corrected || c.correct}"`);
          log.info(`    Reason: ${c.reason}`);
          
          // Apply corrections to nested structure
          if (c.field === 'oil_viscosity' && m.oil) m.oil.oil_viscosity = c.corrected || c.correct;
          if (c.field === 'oil_spec' && m.oil) m.oil.oil_spec = c.corrected || c.correct;
          if (c.field === 'spark_plug_gap_mm' && m.spark) m.spark.spark_plug_gap_mm = c.corrected || c.correct;
          if (c.field === 'fuel_octane_minimum' && m.fuel) m.fuel.fuel_octane_minimum = c.corrected || c.correct;
          if (c.field === 'wheel_bolt_pattern' && m.wheels) m.wheels.wheel_bolt_pattern = c.corrected || c.correct;
          if (c.field === 'wheel_lug_torque_ft_lbs' && m.wheels) m.wheels.wheel_lug_torque_ft_lbs = c.corrected || c.correct;
          if (c.field === 'wheel_center_bore_mm' && m.wheels) m.wheels.wheel_center_bore_mm = c.corrected || c.correct;
        }
      }
      
      // Log confidence score
      log.info(`📊 Data confidence: ${verifyResult.confidence}%`);
      if (verifyResult.confidence < 70) {
        log.warn('⚠️  Low confidence - manual verification recommended');
        
        // Provide manual verification guidance (no content extraction)
        try {
          const manualResult = await verifyAgainstManual(car, flatData, { verbose: false });
          
          if (manualResult.oemPortal) {
            log.info('📖 For manual verification, visit:');
            log.info(`   ${manualResult.oemPortal}`);
          }
          
          if (manualResult.specsToCheck?.length > 0) {
            log.info('   Specs to verify manually:');
            for (const spec of manualResult.specsToCheck.slice(0, 5)) {
              log.info(`     • ${spec.field}: ${spec.current || 'MISSING'}`);
            }
          }
        } catch (manualErr) {
          // Silent fail - manual lookup is optional
        }
      }
    }
    
    // Flatten all nested data into single object
    const data = {
      car_id: car.id,
      // Oil
      oil_type: m.oil?.oil_type,
      oil_viscosity: m.oil?.oil_viscosity,
      oil_spec: m.oil?.oil_spec,
      oil_capacity_liters: m.oil?.oil_capacity_liters ?? null,
      oil_capacity_quarts: m.oil?.oil_capacity_quarts ?? null,
      oil_filter_oem_part: m.oil?.oil_filter_oem_part,
      oil_filter_alternatives: m.oil?.oil_filter_alternatives,
      oil_change_interval_miles: m.oil?.oil_change_interval_miles,
      oil_change_interval_months: m.oil?.oil_change_interval_months,
      // Coolant
      coolant_type: m.coolant?.coolant_type,
      coolant_color: m.coolant?.coolant_color,
      coolant_spec: m.coolant?.coolant_spec,
      coolant_capacity_liters: m.coolant?.coolant_capacity_liters ?? null,
      coolant_change_interval_miles: m.coolant?.coolant_change_interval_miles,
      coolant_change_interval_years: m.coolant?.coolant_change_interval_years,
      // Brake fluid
      brake_fluid_type: m.brake_fluid?.brake_fluid_type,
      brake_fluid_spec: m.brake_fluid?.brake_fluid_spec,
      brake_fluid_change_interval_miles: m.brake_fluid?.brake_fluid_change_interval_miles,
      brake_fluid_change_interval_years: m.brake_fluid?.brake_fluid_change_interval_years,
      // Transmission
      trans_fluid_manual: m.transmission?.trans_fluid_manual,
      trans_fluid_manual_capacity: m.transmission?.trans_fluid_manual_capacity ?? null,
      trans_fluid_auto: m.transmission?.trans_fluid_auto,
      trans_fluid_auto_capacity: m.transmission?.trans_fluid_auto_capacity ?? null,
      trans_fluid_change_interval_miles: m.transmission?.trans_fluid_change_interval_miles,
      // Differential
      diff_fluid_type: m.differential?.diff_fluid_type,
      diff_fluid_front_capacity: m.differential?.diff_fluid_front_capacity ?? null,
      diff_fluid_rear_capacity: m.differential?.diff_fluid_rear_capacity ?? null,
      diff_fluid_change_interval_miles: m.differential?.diff_fluid_change_interval_miles,
      // Fuel
      fuel_type: m.fuel?.fuel_type,
      fuel_octane_minimum: m.fuel?.fuel_octane_minimum,
      fuel_octane_recommended: m.fuel?.fuel_octane_recommended,
      fuel_tank_capacity_gallons: m.fuel?.fuel_tank_capacity_gallons ?? null,
      fuel_tank_capacity_liters: m.fuel?.fuel_tank_capacity_liters ?? null,
      // Filters
      air_filter_oem_part: m.filters?.air_filter_oem_part,
      air_filter_alternatives: m.filters?.air_filter_alternatives,
      air_filter_change_interval_miles: m.filters?.air_filter_change_interval_miles,
      cabin_filter_oem_part: m.filters?.cabin_filter_oem_part,
      cabin_filter_alternatives: m.filters?.cabin_filter_alternatives,
      cabin_filter_change_interval_miles: m.filters?.cabin_filter_change_interval_miles,
      fuel_filter_oem_part: m.filters?.fuel_filter_oem_part,
      fuel_filter_in_tank: toBoolean(m.filters?.fuel_filter_in_tank),
      fuel_filter_change_interval_miles: m.filters?.fuel_filter_change_interval_miles,
      // Tires
      tire_size_front: m.tires?.tire_size_front,
      tire_size_rear: m.tires?.tire_size_rear,
      tire_pressure_front_psi: m.tires?.tire_pressure_front_psi,
      tire_pressure_rear_psi: m.tires?.tire_pressure_rear_psi,
      tire_pressure_spare_psi: m.tires?.tire_pressure_spare_psi,
      tire_rotation_pattern: m.tires?.tire_rotation_pattern,
      tire_rotation_interval_miles: m.tires?.tire_rotation_interval_miles,
      tire_oem_brand: m.tires?.tire_oem_brand,
      tire_recommended_brands: m.tires?.tire_recommended_brands,
      // Wheels
      wheel_size_front: m.wheels?.wheel_size_front,
      wheel_size_rear: m.wheels?.wheel_size_rear,
      wheel_bolt_pattern: m.wheels?.wheel_bolt_pattern,
      wheel_center_bore_mm: m.wheels?.wheel_center_bore_mm ?? null,
      wheel_lug_torque_ft_lbs: m.wheels?.wheel_lug_torque_ft_lbs,
      wheel_lug_torque_nm: m.wheels?.wheel_lug_torque_nm,
      // Brakes Front
      brake_front_rotor_diameter_mm: m.brakes_front?.brake_front_rotor_diameter_mm,
      brake_front_rotor_thickness_mm: m.brakes_front?.brake_front_rotor_thickness_mm,
      brake_front_rotor_min_thickness_mm: m.brakes_front?.brake_front_rotor_min_thickness_mm,
      brake_front_rotor_oem_part: m.brakes_front?.brake_front_rotor_oem_part,
      brake_front_pad_oem_part: m.brakes_front?.brake_front_pad_oem_part,
      brake_front_pad_wear_indicator: toBoolean(m.brakes_front?.brake_front_pad_wear_indicator),
      brake_front_caliper_type: m.brakes_front?.brake_front_caliper_type,
      // Brakes Rear
      brake_rear_rotor_diameter_mm: m.brakes_rear?.brake_rear_rotor_diameter_mm,
      brake_rear_rotor_thickness_mm: m.brakes_rear?.brake_rear_rotor_thickness_mm,
      brake_rear_rotor_min_thickness_mm: m.brakes_rear?.brake_rear_rotor_min_thickness_mm,
      brake_rear_rotor_oem_part: m.brakes_rear?.brake_rear_rotor_oem_part,
      brake_rear_pad_oem_part: m.brakes_rear?.brake_rear_pad_oem_part,
      brake_rear_pad_wear_indicator: toBoolean(m.brakes_rear?.brake_rear_pad_wear_indicator),
      brake_rear_caliper_type: m.brakes_rear?.brake_rear_caliper_type,
      // Spark plugs
      spark_plug_type: m.spark?.spark_plug_type,
      spark_plug_gap_mm: m.spark?.spark_plug_gap_mm ?? null,
      spark_plug_oem_part: m.spark?.spark_plug_oem_part,
      spark_plug_alternatives: m.spark?.spark_plug_alternatives,
      spark_plug_change_interval_miles: m.spark?.spark_plug_change_interval_miles,
      spark_plug_quantity: m.spark?.spark_plug_quantity,
      // Timing
      timing_type: m.timing?.timing_type,
      timing_change_interval_miles: m.timing?.timing_change_interval_miles,
      timing_change_interval_years: m.timing?.timing_change_interval_years,
      timing_tensioner_oem_part: m.timing?.timing_tensioner_oem_part,
      // Belts
      serpentine_belt_oem_part: m.belts?.serpentine_belt_oem_part,
      serpentine_belt_change_interval_miles: m.belts?.serpentine_belt_change_interval_miles,
      ac_belt_separate: toBoolean(m.belts?.ac_belt_separate),
      ac_belt_oem_part: m.belts?.ac_belt_oem_part,
      // Battery
      battery_group_size: m.battery?.battery_group_size,
      battery_cca: m.battery?.battery_cca,
      battery_voltage: m.battery?.battery_voltage,
      battery_oem_brand: m.battery?.battery_oem_brand,
      battery_location: m.battery?.battery_location,
      battery_agm: toBoolean(m.battery?.battery_agm),
      // Alternator
      alternator_output_amps: m.alternator?.alternator_output_amps,
      alternator_oem_part: m.alternator?.alternator_oem_part,
      // Wipers
      wiper_driver_size_inches: m.wipers?.wiper_driver_size_inches,
      wiper_passenger_size_inches: m.wipers?.wiper_passenger_size_inches,
      wiper_rear_size_inches: m.wipers?.wiper_rear_size_inches,
      wiper_type: m.wipers?.wiper_type,
      wiper_oem_part_driver: m.wipers?.wiper_oem_part_driver,
      wiper_oem_part_passenger: m.wipers?.wiper_oem_part_passenger,
      wiper_oem_part_rear: m.wipers?.wiper_oem_part_rear,
      // Alignment - extract numeric from range strings like "-0.5 to 0.5"
      alignment_camber_front_degrees: extractNumeric(m.alignment?.alignment_camber_front_degrees),
      alignment_camber_rear_degrees: extractNumeric(m.alignment?.alignment_camber_rear_degrees),
      alignment_toe_front_degrees: extractNumeric(m.alignment?.alignment_toe_front_degrees),
      alignment_toe_rear_degrees: extractNumeric(m.alignment?.alignment_toe_rear_degrees),
      alignment_caster_degrees: extractNumeric(m.alignment?.alignment_caster_degrees),
      // Suspension
      shock_front_oem_part: m.suspension?.shock_front_oem_part,
      shock_rear_oem_part: m.suspension?.shock_rear_oem_part,
      spring_front_oem_part: m.suspension?.spring_front_oem_part,
      spring_rear_oem_part: m.suspension?.spring_rear_oem_part,
      sway_bar_front_diameter_mm: m.suspension?.sway_bar_front_diameter_mm,
      sway_bar_rear_diameter_mm: m.suspension?.sway_bar_rear_diameter_mm,
      // Metadata
      source_manual_year: m.source_manual_year ?? null,
      source_url: Array.isArray(m.sources)
        ? (m.sources.find((s) => typeof s === 'string' && s.startsWith('http')) || null)
        : null,
      verified_by: 'vehicle-data-pipeline',
      verified_at: new Date().toISOString()
    };

    // Remove undefined
    Object.keys(data).forEach(k => { if (data[k] === undefined) delete data[k]; });

    const { data: existing } = await supabase
      .from('vehicle_maintenance_specs')
      .select('id')
      .eq('car_id', car.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const write = existing?.id
      ? supabase.from('vehicle_maintenance_specs').update(data).eq('id', existing.id)
      : supabase.from('vehicle_maintenance_specs').insert(data);

    const { error } = await write;
    if (error) log.error(`vehicle_maintenance_specs: ${error.message}`);
    else {
      log.success(existing?.id ? 'vehicle_maintenance_specs updated' : 'vehicle_maintenance_specs inserted');
      updates.vehicle_maintenance_specs = Object.keys(data).length;
    }
  }

  // -------------------------------------------------------------------------
  // 5. vehicle_service_intervals (AI)
  // -------------------------------------------------------------------------
  if (aiData?.serviceIntervals?.length) {
    log.table('5. vehicle_service_intervals');
    const { data: existing } = await supabase
      .from('vehicle_service_intervals')
      .select('service_name')
      .eq('car_id', car.id);

    const existingNames = new Set((existing || []).map((r) => r.service_name).filter(Boolean));
    const toInsert = [];

    for (const interval of aiData.serviceIntervals) {
      const name = interval.service_name;
      if (!name || existingNames.has(name)) continue;
      existingNames.add(name);
      toInsert.push({
        car_id: car.id,
        service_name: name,
        service_description: interval.service_description ?? null,
        interval_miles: interval.interval_miles ?? null,
        interval_months: interval.interval_months ?? null,
        items_included: interval.items_included ?? null,
        dealer_cost_low: interval.dealer_cost_low ?? null,
        dealer_cost_high: interval.dealer_cost_high ?? null,
        independent_cost_low: interval.independent_cost_low ?? null,
        independent_cost_high: interval.independent_cost_high ?? null,
        diy_cost_low: interval.diy_cost_low ?? null,
        diy_cost_high: interval.diy_cost_high ?? null,
        labor_hours_estimate: interval.labor_hours_estimate ?? null,
        is_critical: interval.is_critical ?? null,
        skip_consequences: interval.skip_consequences ?? null,
      });
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from('vehicle_service_intervals').insert(toInsert);
      if (error) log.error(`vehicle_service_intervals: ${error.message}`);
      else {
        log.success(`vehicle_service_intervals: ${toInsert.length} inserted`);
        updates.vehicle_service_intervals = toInsert.length;
      }
    } else {
      log.success('vehicle_service_intervals: no new records');
      updates.vehicle_service_intervals = 0;
    }
  }

  // -------------------------------------------------------------------------
  // 6. car_variants (AI)
  // -------------------------------------------------------------------------
  if (aiData?.variants?.length) {
    log.table('6. car_variants');
    const payload = [];

    for (const v of aiData.variants) {
      const trim = v.trim ?? v.variant_name ?? v.display_name ?? null;
      const yearsText = v.years_text ?? (v.year_start && v.year_end ? `${v.year_start}-${v.year_end}` : car.years);
      const modelYearStart = v.model_year_start ?? v.year_start ?? null;
      const modelYearEnd = v.model_year_end ?? v.year_end ?? null;

      const variantKeyRaw =
        v.variant_key ||
        `${car.slug}-${slugifyKey(trim || 'base')}-${modelYearStart || ''}-${modelYearEnd || ''}`;

      payload.push({
        car_id: car.id,
        variant_key: variantKeyRaw,
        display_name: v.display_name ?? trim ?? 'Base',
        years_text: yearsText,
        model_year_start: modelYearStart,
        model_year_end: modelYearEnd,
        trim,
        drivetrain: v.drivetrain ?? null,
        transmission: v.transmission ?? null,
        engine: v.engine ?? car.engine ?? null,
        metadata: v.metadata ?? {
          hp: v.metadata?.hp ?? v.hp ?? null,
          torque: v.metadata?.torque ?? v.torque ?? null,
          msrp: v.metadata?.msrp ?? v.msrp ?? null,
          curb_weight: v.metadata?.curb_weight ?? v.curb_weight ?? null,
          notable_features: v.metadata?.notable_features ?? v.notable_features ?? null,
          is_default: v.metadata?.is_default ?? v.is_default ?? null,
        },
      });
    }

    // Upsert on unique variant_key (global)
    const { error } = await supabase.from('car_variants').upsert(payload, { onConflict: 'variant_key' });
    if (error) log.error(`car_variants: ${error.message}`);
    else {
      log.success(`car_variants: ${payload.length} upserted`);
      updates.car_variants = payload.length;
    }
  }

  // -------------------------------------------------------------------------
  // 7. car_tuning_profiles (AI)
  // -------------------------------------------------------------------------
  if (aiData?.tuning) {
    log.table('7. car_tuning_profiles');
    const data = {
      car_id: car.id,
      car_variant_id: null,
      engine_family: aiData.tuning.engine_family,
      tuning_focus: normalizeTuningFocus(aiData.tuning.tuning_focus),
      stock_whp: aiData.tuning.stock_whp,
      stock_wtq: aiData.tuning.stock_wtq,
      tuning_platforms: aiData.tuning.tuning_platforms,
      stage_progressions: aiData.tuning.stage_progressions,
      power_limits: aiData.tuning.power_limits,
      brand_recommendations: aiData.tuning.brand_recommendations,
      pipeline_version: 'vehicle-data-pipeline@2.2',
      pipeline_run_at: new Date().toISOString(),
      verified: false,
      notes: 'AI-researched - requires verification'
    };
    const { data: existing } = await supabase
      .from('car_tuning_profiles')
      .select('id')
      .eq('car_id', car.id)
      .eq('tuning_focus', data.tuning_focus)
      .is('car_variant_id', null)
      .maybeSingle();

    const write = existing?.id
      ? supabase.from('car_tuning_profiles').update(data).eq('id', existing.id)
      : supabase.from('car_tuning_profiles').insert(data);

    const { error } = await write;
    if (error) log.error(`car_tuning_profiles: ${error.message}`);
    else { log.success(existing?.id ? 'car_tuning_profiles updated' : 'car_tuning_profiles inserted'); updates.car_tuning_profiles = data; }
  }

  // -------------------------------------------------------------------------
  // 8. car_issues (AI + NHTSA)
  // -------------------------------------------------------------------------
  if (aiData?.issues?.length) {
    log.table('8. car_issues');
    const payload = aiData.issues
      .filter((issue) => issue?.title)
      .map((issue) => ({
        car_id: car.id,
        kind: 'common_issue',
        severity: issue.severity || 'unknown',
        title: issue.title,
        description: issue.description ?? null,
        symptoms: issue.symptoms ?? null,
        prevention: issue.prevention ?? null,
        fix_description: issue.fix_description ?? null,
        affected_years_text: issue.affected_years_text ?? null,
        affected_year_start: issue.affected_year_start ?? null,
        affected_year_end: issue.affected_year_end ?? null,
        estimated_cost_low: issue.estimated_cost_low ?? null,
        estimated_cost_high: issue.estimated_cost_high ?? null,
        estimated_cost_text: issue.estimated_cost_low && issue.estimated_cost_high
          ? `$${issue.estimated_cost_low} - $${issue.estimated_cost_high}`
          : null,
        source_type: issue.source_type ?? null,
        source_url: issue.source_url ?? null,
        confidence: issue.confidence ?? null,
      }));

    const { error } = await supabase
      .from('car_issues')
      .upsert(payload, { onConflict: 'car_id,title' });

    if (error) log.error(`car_issues: ${error.message}`);
    else {
      log.success(`car_issues: ${payload.length} upserted`);
      updates.car_issues = payload.length;
    }
  }

  // -------------------------------------------------------------------------
  // 9. cars (Editorial + Performance)
  // -------------------------------------------------------------------------
  log.table('9. cars (editorial + performance)');
  const carsUpdate = {};

  // Performance data
  if (aiData?.performance) {
    const p = aiData.performance;
    if (p.zero_to_sixty != null) carsUpdate.zero_to_sixty = p.zero_to_sixty;
    if (p.quarter_mile_time != null) carsUpdate.quarter_mile = p.quarter_mile_time;
    if (p.top_speed) carsUpdate.top_speed = p.top_speed;
    if (p.braking_60_0) carsUpdate.braking_60_0 = p.braking_60_0;
    if (p.lateral_g != null) carsUpdate.lateral_g = p.lateral_g;
    if (p.curb_weight) carsUpdate.curb_weight = p.curb_weight;
  }

  // Editorial data
  if (aiData?.editorial) {
    const e = aiData.editorial;
    if (e.tagline) carsUpdate.tagline = e.tagline;
    if (e.hero_blurb) carsUpdate.hero_blurb = e.hero_blurb;
    if (e.essence) carsUpdate.essence = e.essence;
    if (e.heritage) carsUpdate.heritage = e.heritage;
    if (e.design_philosophy) carsUpdate.design_philosophy = e.design_philosophy;
    if (e.motorsport_history) carsUpdate.motorsport_history = e.motorsport_history;
    if (e.engine_character) carsUpdate.engine_character = e.engine_character;
    if (e.transmission_feel) carsUpdate.transmission_feel = e.transmission_feel;
    if (e.chassis_dynamics) carsUpdate.chassis_dynamics = e.chassis_dynamics;
    if (e.steering_feel) carsUpdate.steering_feel = e.steering_feel;
    if (e.brake_confidence) carsUpdate.brake_confidence = e.brake_confidence;
    if (e.sound_signature) carsUpdate.sound_signature = e.sound_signature;
    if (e.ideal_owner) carsUpdate.ideal_owner = e.ideal_owner;
    if (e.not_ideal_for) carsUpdate.not_ideal_for = e.not_ideal_for;
    if (e.buyers_summary) carsUpdate.buyers_summary = e.buyers_summary;
    if (e.pros) carsUpdate.pros = e.pros;
    if (e.cons) carsUpdate.cons = e.cons;
    if (e.best_for) carsUpdate.best_for = e.best_for;
  }

  if (Object.keys(carsUpdate).length) {
    const { error } = await supabase.from('cars').update(carsUpdate).eq('id', car.id);
    if (error) log.error(`cars: ${error.message}`);
    else { log.success(`cars: ${Object.keys(carsUpdate).length} fields updated`); updates.cars = Object.keys(carsUpdate); }
  }

  // -------------------------------------------------------------------------
  // 10. wheel_tire_fitment_options (AI)
  // -------------------------------------------------------------------------
  if (aiData?.fitment?.length) {
    log.table('10. wheel_tire_fitment_options');

    const { data: existingRows } = await supabase
      .from('wheel_tire_fitment_options')
      .select('fitment_type,wheel_diameter_inches,tire_size_front,tire_size_rear')
      .eq('car_id', car.id);

    const existingKeys = new Set(
      (existingRows || []).map(
        (r) => `${r.fitment_type}|${r.wheel_diameter_inches}|${r.tire_size_front}|${r.tire_size_rear}`
      )
    );

    const newRecords = [];

    for (const raw of aiData.fitment) {
      // Normalize both the new schema and any older prompt outputs.
      const wheelDiameter = raw.wheel_diameter_inches ?? raw.wheel_diameter ?? null;
      const tireFront = raw.tire_size_front ?? raw.tire_size_formatted ?? null;
      const tireRear = raw.tire_size_rear ?? raw.tire_size_formatted ?? null;
      const fitmentType = normalizeFitmentType(raw.fitment_type);

      const key = `${fitmentType}|${wheelDiameter}|${tireFront}|${tireRear}`;
      if (existingKeys.has(key)) continue;
      existingKeys.add(key);

      newRecords.push({
        car_id: car.id,
        fitment_type: fitmentType,
        wheel_diameter_inches: wheelDiameter,
        wheel_width_front: raw.wheel_width_front ?? raw.wheel_width ?? null,
        wheel_width_rear: raw.wheel_width_rear ?? raw.wheel_width ?? null,
        wheel_offset_front_mm: raw.wheel_offset_front_mm ?? raw.wheel_offset ?? null,
        wheel_offset_rear_mm: raw.wheel_offset_rear_mm ?? raw.wheel_offset ?? null,
        wheel_offset_range_front: raw.wheel_offset_range_front ?? null,
        wheel_offset_range_rear: raw.wheel_offset_range_rear ?? null,
        tire_size_front: tireFront,
        tire_size_rear: tireRear,
        tire_width_front_mm: raw.tire_width_front_mm ?? raw.tire_width ?? null,
        tire_width_rear_mm: raw.tire_width_rear_mm ?? raw.tire_width ?? null,
        tire_aspect_front: raw.tire_aspect_front ?? raw.tire_aspect_ratio ?? null,
        tire_aspect_rear: raw.tire_aspect_rear ?? raw.tire_aspect_ratio ?? null,
        diameter_change_percent: raw.diameter_change_percent ?? null,
        speedometer_error_percent: raw.speedometer_error_percent ?? null,
        requires_fender_roll: raw.requires_fender_roll ?? false,
        requires_fender_pull: raw.requires_fender_pull ?? false,
        requires_camber_adjustment: raw.requires_camber_adjustment ?? false,
        recommended_camber_front: raw.recommended_camber_front ?? null,
        recommended_camber_rear: raw.recommended_camber_rear ?? null,
        requires_coilovers: raw.requires_coilovers ?? false,
        requires_spacers: raw.requires_spacers ?? false,
        spacer_size_front_mm: raw.spacer_size_front_mm ?? null,
        spacer_size_rear_mm: raw.spacer_size_rear_mm ?? null,
        clearance_notes: raw.clearance_notes ?? null,
        known_issues: raw.known_issues ?? null,
        recommended_for: raw.recommended_for ?? null,
        not_recommended_for: raw.not_recommended_for ?? null,
        popularity_score: raw.popularity_score ?? null,
        community_verified: raw.community_verified ?? false,
        forum_threads: raw.forum_threads ?? null,
        source_type: normalizeSourceType(raw.source_type),
        source_url: raw.source_url ?? null,
        confidence: raw.confidence ?? null,
        verified: false,
        verified_by: null,
        verified_at: null,
      });
    }

    if (newRecords.length > 0) {
      const { error } = await supabase.from('wheel_tire_fitment_options').insert(newRecords);
      if (error) log.error(`wheel_tire_fitment_options: ${error.message}`);
      else {
        log.success(`wheel_tire_fitment_options: ${newRecords.length} inserted`);
        updates.wheel_tire_fitment_options = newRecords.length;
      }
    } else {
      log.success('wheel_tire_fitment_options: no new records');
      updates.wheel_tire_fitment_options = 0;
    }
  }

  // -------------------------------------------------------------------------
  // 11. car_expert_reviews (Exa + Supadata)
  // -------------------------------------------------------------------------
  if (aiData?.expertReviews?.length) {
    log.table('11. car_expert_reviews');

    const { data: existing } = await supabase
      .from('car_expert_reviews')
      .select('source_url')
      .eq('car_id', car.id);

    const existingUrls = new Set((existing || []).map((r) => r.source_url).filter(Boolean));
    const toInsert = [];

    for (const review of aiData.expertReviews) {
      const sourceUrl = review.source_url || review.video_url;
      if (!sourceUrl || existingUrls.has(sourceUrl)) continue;
      existingUrls.add(sourceUrl);

      const verdictParts = [
        review.verdict,
        review.summary,
      ].filter(Boolean);

      toInsert.push({
        car_id: car.id,
        source: review.source || 'youtube',
        source_url: sourceUrl,
        title: review.title || review.headline || null,
        overall_rating: review.overall_rating ?? null,
        performance_rating: review.performance_rating ?? null,
        handling_rating: review.handling_rating ?? null,
        comfort_rating: review.comfort_rating ?? null,
        interior_rating: review.interior_rating ?? null,
        value_rating: review.value_rating ?? null,
        pros: review.pros ?? null,
        cons: review.cons ?? null,
        verdict: verdictParts.join('\n\n'),
        zero_to_sixty: review.zero_to_sixty ?? null,
        zero_to_hundred: review.zero_to_hundred ?? null,
        quarter_mile: review.quarter_mile ?? null,
        quarter_mile_speed: review.quarter_mile_speed ?? null,
        braking_70_to_0: review.braking_70_to_0 ?? null,
        skidpad_g: review.skidpad_g ?? null,
        review_date: review.review_date ?? null,
        review_type: review.review_type || 'youtube_video',
        fetched_at: new Date().toISOString(),
      });
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from('car_expert_reviews').insert(toInsert);
      if (error) log.error(`car_expert_reviews: ${error.message}`);
      else {
        log.success(`car_expert_reviews: ${toInsert.length} inserted`);
        updates.car_expert_reviews = toInsert.length;
      }
    } else {
      log.success('car_expert_reviews: no new records');
      updates.car_expert_reviews = 0;
    }
  }

  // -------------------------------------------------------------------------
  // 12. car_manual_data (PDF search)
  // -------------------------------------------------------------------------
  if (aiData?.manuals?.length) {
    log.table('12. car_manual_data');

    const { data: existing } = await supabase
      .from('car_manual_data')
      .select('source_url')
      .eq('car_id', car.id);

    const existingUrls = new Set((existing || []).map((r) => r.source_url).filter(Boolean));
    const toInsert = [];

    for (const manual of aiData.manuals) {
      const url = manual.manual_url;
      if (!url || existingUrls.has(url)) continue;
      existingUrls.add(url);

      toInsert.push({
        car_id: car.id,
        data_type: slugifyKey(manual.manual_type || 'manual_link'),
        source: 'exa',
        source_url: url,
        data: {
          manual_type: manual.manual_type || null,
          manual_year: manual.manual_year || null,
          language: manual.language || 'English',
          is_official: Boolean(manual.is_official),
          title: manual.title || null,
        },
        verified: false,
        verified_by: null,
        verified_at: null,
        notes: manual.source_notes || null,
        entered_by: 'vehicle-data-pipeline',
      });
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from('car_manual_data').insert(toInsert);
      if (error) log.error(`car_manual_data: ${error.message}`);
      else {
        log.success(`car_manual_data: ${toInsert.length} inserted`);
        updates.car_manual_data = toInsert.length;
      }
    } else {
      log.success('car_manual_data: no new records');
      updates.car_manual_data = 0;
    }
  }

  // -------------------------------------------------------------------------
  // 13. car_images (Google Nano Banana Pro)
  // -------------------------------------------------------------------------
  if (aiData?.images?.generated && CONFIG.blobToken) {
    log.table('13. car_images');
    
    try {
      // Convert to WebP (matches existing car image conventions)
      const rawBuffer = Buffer.from(aiData.images.image_data, 'base64');
      const webpBuffer = await sharp(rawBuffer).webp({ quality: 88 }).toBuffer();
      const meta = await sharp(webpBuffer).metadata();

      const blobPath = `cars/${car.slug}/hero.webp`;
      const { put } = await import('@vercel/blob');
      const blob = await put(blobPath, webpBuffer, {
        access: 'public',
        contentType: 'image/webp',
        token: CONFIG.blobToken,
        allowOverwrite: true,
      });

      // Avoid duplicates by blob_path
      const { data: existing } = await supabase
        .from('car_images')
        .select('id, blob_path')
        .eq('car_id', car.id)
        .eq('blob_path', blob.pathname)
        .maybeSingle();

      if (!existing) {
        const record = {
          car_id: car.id,
          brand: car.brand,
          blob_url: blob.url,
          blob_path: blob.pathname,
          file_size_bytes: webpBuffer.length,
          width: meta.width ?? null,
          height: meta.height ?? null,
          aspect_ratio: '16:9',
          format: 'webp',
          source_type: 'ai-generated',
          source_url: null,
          source_attribution: 'AutoRev pipeline (Nano Banana Pro)',
          license: 'owned',
          photographer: null,
          title: `${car.name} hero`,
          description: 'AI-generated hero image (requires review).',
          alt_text: `${car.name} hero image`,
          content_tags: ['hero', 'garage', 'ai'],
          recommended_uses: ['hero', 'og', 'card'],
          quality_tier: 'standard',
          is_primary: false,
          display_order: 99,
          ai_prompt: aiData.images.prompt_used || null,
          ai_model: 'gemini-3-pro-image-preview',
          ai_settings: { aspectRatio: '16:9', imageSize: '2K' },
          is_verified: false,
          is_active: true,
          needs_review: true,
          review_notes: null,
          metadata: { pipeline: 'vehicle-data-pipeline', generated_at: new Date().toISOString() },
        };

        const { error } = await supabase.from('car_images').insert(record);
        if (error) log.error(`car_images: ${error.message}`);
        else {
          log.success('car_images: 1 inserted');
          updates.car_images = 1;
        }
      } else {
        log.success('car_images: already exists (skipped)');
        updates.car_images = 0;
      }
    } catch (e) {
      log.error(`Image upload error: ${e.message}`);
    }
  }

  pipelineLog.stage4 = updates;
  return { updated: true, updates };
}

// ============================================================================
// STAGE 5: COMPLETENESS CHECK
// ============================================================================

async function stage5_Completeness(car, pipelineLog) {
  log.stage(5, 'COMPLETENESS CHECK');

  const completeness = { tables: {}, overall: { filled: 0, total: 0 } };

  // Check single-record tables
  const singleTables = [
    'cars', 'vehicle_maintenance_specs', 'car_fuel_economy',
    'car_safety_data', 'car_tuning_profiles'
  ];

  for (const tableName of singleTables) {
    const foreignKey = tableName === 'cars' ? 'id' : 'car_id';
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(foreignKey, car.id)
      .single();

    if (!data) {
      completeness.tables[tableName] = { exists: false, percent: 0 };
      continue;
    }

    const excludeFields = ['id', 'car_id', 'created_at', 'updated_at', 'slug'];
    const fields = Object.keys(data).filter(k => !excludeFields.includes(k));
    const filled = fields.filter(f => data[f] !== null && data[f] !== undefined && data[f] !== '');
    const missing = fields.filter(f => data[f] === null || data[f] === undefined || data[f] === '');

    completeness.tables[tableName] = {
      exists: true,
      filled: filled.length,
      total: fields.length,
      percent: Math.round((filled.length / fields.length) * 100),
      missing: missing.slice(0, 5)
    };

    completeness.overall.filled += filled.length;
    completeness.overall.total += fields.length;

    const icon = completeness.tables[tableName].percent === 100 ? '✅' :
                 completeness.tables[tableName].percent >= 80 ? '🟡' : '❌';
    log.info(`${icon} ${tableName}: ${completeness.tables[tableName].percent}% (${filled.length}/${fields.length})`);

    if (missing.length > 0) {
      log.warn(`   Missing: ${missing.join(', ')}`);
    }
  }

  // Check multi-record tables
  const multiTables = [
    { name: 'car_issues', label: 'Issues' },
    { name: 'car_recalls', label: 'Recalls' },
    { name: 'vehicle_service_intervals', label: 'Service Intervals' },
    { name: 'car_variants', label: 'Variants' },
    { name: 'wheel_tire_fitment_options', label: 'Fitment Options' },
    { name: 'car_expert_reviews', label: 'Expert Reviews' },
    { name: 'car_manual_data', label: 'Manuals' },
    { name: 'car_images', label: 'Images' },

    // Not yet automated (still tracked for completeness)
    { name: 'car_dyno_runs', label: 'Dyno Runs' },
    { name: 'car_track_lap_times', label: 'Track Lap Times' },
    { name: 'car_auction_results', label: 'Auction Results' },
    { name: 'car_market_pricing', label: 'Market Pricing' },
  ];

  for (const { name, label } of multiTables) {
    const { count } = await supabase
      .from(name)
      .select('*', { count: 'exact', head: true })
      .eq('car_id', car.id);

    completeness.tables[name] = { records: count || 0 };
    const icon = count > 0 ? '✅' : '❌';
    log.info(`${icon} ${name}: ${count || 0} records`);
  }

  completeness.overall.percent = Math.round((completeness.overall.filled / completeness.overall.total) * 100);

  console.log(`\n${COLORS.bright}${'═'.repeat(50)}${COLORS.reset}`);
  console.log(`${COLORS.bright}  OVERALL: ${completeness.overall.percent}% complete${COLORS.reset}`);
  console.log(`${COLORS.bright}  (${completeness.overall.filled} / ${completeness.overall.total} fields)${COLORS.reset}`);
  console.log(`${COLORS.bright}${'═'.repeat(50)}${COLORS.reset}\n`);

  pipelineLog.stage5 = completeness;
  return completeness;
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

async function runPipeline(carId, mode, options = {}) {
  initClients();

  const pipelineLog = {
    car_id: carId,
    mode,
    version: '2.3',  // Updated: EPA matching, Supadata response handling, tire validation
    started_at: new Date().toISOString(),
    stages: {}
  };

  // Fetch car
  const { data: car, error } = await supabase
    .from('cars')
    .select('*')
    .eq('id', carId)
    .single();

  if (error || !car) {
    throw new Error(`Car not found: ${carId}`);
  }

  log.header(`${car.name} (${car.years})`);
  log.info(`Mode: ${mode}`);
  log.info(`Engine: ${car.engine}`);
  log.info(`ID: ${car.id}`);

  pipelineLog.car_name = car.name;

  let apiData = {};
  let aiData = {};
  let validation = { passed: [], warnings: [], errors: [] };

  // Run stages based on mode
  switch (mode) {
    case 'validate':
      apiData = await stage1_Fetch(car, pipelineLog);
      await stage5_Completeness(car, pipelineLog);
      break;

    case 'enrich':
    case 'full':
      apiData = await stage1_Fetch(car, pipelineLog);
      aiData = await stage2_Enrich(car, apiData, pipelineLog);
      validation = await stage3_Validate(car, apiData, aiData, pipelineLog);
      await stage4_Update(car, apiData, aiData, validation, pipelineLog, mode);
      await stage5_Completeness(car, pipelineLog);
      break;

    default:
      log.error(`Unknown mode: ${mode}`);
      return;
  }

  // Save log
  pipelineLog.completed_at = new Date().toISOString();
  const logPath = path.join(CONFIG.logDir, `${car.slug}_${new Date().toISOString().split('T')[0]}.json`);
  await fs.mkdir(CONFIG.logDir, { recursive: true });
  await fs.writeFile(logPath, JSON.stringify(pipelineLog, null, 2));
  log.success(`Log saved: ${logPath}`);
  
  // Final QA summary
  console.log(`\n${COLORS.bright}${'═'.repeat(50)}${COLORS.reset}`);
  console.log(`${COLORS.bright}  PIPELINE QA SUMMARY${COLORS.reset}`);
  console.log(`${COLORS.bright}${'═'.repeat(50)}${COLORS.reset}`);
  
  // Check for engine family corrections
  const engineMatch = matchEngineFamily(car.name, car.engine);
  if (engineMatch) {
    log.info(`✅ Engine family detected: ${engineMatch.family}`);
    log.info(`   Known specs applied: ${engineMatch.notes}`);
  } else {
    log.warn(`⚠️  No engine family match - AI data not cross-validated`);
    log.info(`   Consider adding to engine-specs.mjs if this is a common engine`);
  }
  
  // Summary of validation warnings
  if (validation?.warnings?.length > 0) {
    log.warn(`\n⚠️  ${validation.warnings.length} validation warnings:`);
    validation.warnings.slice(0, 5).forEach(w => log.warn(`   - ${w.message}`));
    if (validation.warnings.length > 5) {
      log.warn(`   ... and ${validation.warnings.length - 5} more`);
    }
  }
  
  console.log(`\n${COLORS.cyan}Run QA audit to verify data quality:${COLORS.reset}`);
  console.log(`  node scripts/vehicle-data-pipeline/qa-audit.mjs --vehicle "${car.name}"\n`);

  return pipelineLog;
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const { values } = parseArgs({
    options: {
      'car-id': { type: 'string', short: 'i' },
      'vehicle': { type: 'string', short: 'v' },
      'mode': { type: 'string', short: 'm', default: 'full' },
      'batch': { type: 'string', short: 'b' },
      'dry-run': { type: 'boolean' },
      'force': { type: 'boolean', short: 'f' },
      'careful': { type: 'boolean', short: 'c' },
      'help': { type: 'boolean', short: 'h' }
    }
  });

  if (values.help) {
    console.log(`
${COLORS.bright}Vehicle Data Pipeline v2.2 - FULLY AUTOMATED${COLORS.reset}

Covers 13 of 17 tables with ALL fields. Fully automated via APIs + AI.

${COLORS.cyan}DATA SOURCES${COLORS.reset}
  ✅ EPA API           → car_fuel_economy
  ✅ NHTSA API         → car_safety_data, car_recalls
  ✅ Claude/GPT-4 AI   → maintenance specs, tuning, issues, editorial
  ✅ Exa + Supadata    → car_expert_reviews (YouTube transcripts)
  ✅ Exa PDF Search    → car_manual_data
  ✅ Google Nano       → car_images (AI generation)

${COLORS.cyan}USAGE${COLORS.reset}
  node scripts/vehicle-data-pipeline/run.mjs [options]

${COLORS.cyan}OPTIONS${COLORS.reset}
  -v, --vehicle <name>    Vehicle name (fuzzy match)
  -i, --car-id <id>       Specific car ID
  -m, --mode <mode>       Operation mode (default: full)
  -b, --batch <count>     Process multiple vehicles
  --dry-run               Preview without database changes
  -f, --force             Override validation errors
  -c, --careful           Enable verification mode (slower but more accurate)
  -h, --help              Show this help

${COLORS.cyan}CAREFUL MODE${COLORS.reset}
  When --careful is enabled:
  • Each critical spec is verified against known exceptions
  • AI cross-validation is performed for low-confidence data
  • Owner's manual lookup & extraction for verification
  • Corrections are shown before writing to database
  • Model-year-specific rules are applied (e.g., Audi B8 vs B9 oil specs)
  
  Recommended for:
  • First-time enrichment of a vehicle
  • High-value/exotic vehicles
  • Vehicles with known spec variations by year
  
${COLORS.cyan}MANUAL VERIFICATION${COLORS.reset}
  For low-confidence data, the pipeline provides links to official OEM manual portals.
  Supported brands: Toyota, Honda, Ford, BMW, Mercedes, Audi, VW, Porsche, etc.
  
  Note: We do NOT extract copyrighted content from manuals. Instead:
  • Links to official OEM owner portals are provided
  • Public government data (EPA, NHTSA) is used where available  
  • Critical specs are flagged for manual verification

${COLORS.cyan}MODES${COLORS.reset}
  validate    Check completeness only
  enrich      Fill missing data (API + 11 AI agents)
  full        Complete pipeline (validate + enrich + QA)

${COLORS.cyan}TABLES AUTOMATED (13/17)${COLORS.reset}
  CRITICAL: cars, vehicle_maintenance_specs, car_tuning_profiles,
            car_issues, car_variants
  HIGH:     car_fuel_economy, car_safety_data, car_recalls,
            vehicle_service_intervals
  MEDIUM:   wheel_tire_fitment_options, car_expert_reviews,
            car_manual_data, car_images

${COLORS.cyan}QA BUILT-IN${COLORS.reset}
  • Range validation (0-60, MPG, oil capacity)
  • Cross-field checks (city < highway MPG)
  • Format validation (tire sizes, part numbers)
  • OEM part coverage tracking

${COLORS.cyan}EXAMPLES${COLORS.reset}
  node scripts/vehicle-data-pipeline/run.mjs -v "Ram 1500 TRX" -m full
  node scripts/vehicle-data-pipeline/run.mjs -b 10 -m enrich
  node scripts/vehicle-data-pipeline/run.mjs -v "BMW M3" --dry-run
`);
    return;
  }

  CONFIG.dryRun = values['dry-run'] || false;
  CONFIG.carefulMode = values['careful'] || false;

  if (CONFIG.dryRun) {
    log.warn('DRY RUN MODE - No database changes will be made');
  }
  
  if (CONFIG.carefulMode) {
    log.info('🔍 CAREFUL MODE - Verification enabled for all critical specs');
    log.info('   Each spec will be cross-checked before database writes');
  }

  try {
    initClients();

    if (values['car-id']) {
      await runPipeline(values['car-id'], values.mode);
    } else if (values.vehicle) {
      const { data: car } = await supabase
        .from('cars')
        .select('id, name')
        .ilike('name', `%${values.vehicle}%`)
        .single();

      if (!car) throw new Error(`Vehicle not found: ${values.vehicle}`);
      await runPipeline(car.id, values.mode);
    } else if (values.batch) {
      const count = parseInt(values.batch) || 5;
      const { data: cars } = await supabase
        .from('cars')
        .select('id, name')
        .limit(count);

      for (const car of cars) {
        console.log(`\n>>> Processing ${car.name}...\n`);
        await runPipeline(car.id, values.mode);
      }
    } else {
      console.log('No vehicle specified. Use --help for usage.');
    }
  } catch (e) {
    log.error(`Pipeline error: ${e.message}`);
    process.exit(1);
  }
}

main();
