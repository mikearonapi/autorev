/**
 * SEMA Data Co-Op Service
 * 
 * Integration with SEMA Data Co-Op for industry-standard ACES/PIES parts data.
 * 
 * Prerequisites:
 * - SEMA membership
 * - Auto Care Association reference database subscription
 * 
 * This service provides:
 * - ACES (Aftermarket Catalog Exchange Standard) fitment data parsing
 * - PIES (Product Information Exchange Standard) product data parsing
 * - VCdb (Vehicle Configuration Database) vehicle mapping
 * - Integration with AutoRev cars and part_fitments tables
 * 
 * @module lib/semaDataService
 * @see docs/TURN14_SEMA_RESEARCH.md for implementation details
 */

import { supabaseServiceRole, isSupabaseConfigured } from './supabase.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * SEMA Data Co-Op configuration
 * These credentials would be obtained after SEMA membership approval
 */
const SEMA_CONFIG = {
  // API credentials (placeholder - obtain from SEMA membership)
  apiKey: process.env.SEMA_API_KEY || null,
  apiSecret: process.env.SEMA_API_SECRET || null,
  
  // Data format settings
  acesVersion: '4.2',  // Current version as of Jan 2025
  piesVersion: '7.2',  // Current version as of Jan 2025
  
  // Supported data formats (JSON recommended, ASCII/MySQL deprecated Jan 2026)
  preferredFormat: 'json',
};

// ============================================================================
// ACES DATA STRUCTURES
// ============================================================================

/**
 * ACES Fitment record structure
 * @typedef {Object} ACESFitment
 * @property {number} baseVehicleId - VCdb Base Vehicle ID
 * @property {number} subModelId - VCdb SubModel ID
 * @property {string} partNumber - Manufacturer part number
 * @property {string} brandId - AAIA Brand ID
 * @property {string[]} qualifiers - Additional fitment qualifiers
 * @property {string} notes - Fitment notes
 */

/**
 * VCdb Vehicle record structure
 * @typedef {Object} VCdbVehicle
 * @property {number} vehicleId - VCdb Vehicle ID
 * @property {number} baseVehicleId - Base vehicle grouping
 * @property {number} yearId - Model year ID
 * @property {number} makeId - Make ID
 * @property {number} modelId - Model ID
 * @property {number} subModelId - SubModel ID (optional)
 * @property {number} year - Actual year
 * @property {string} make - Make name
 * @property {string} model - Model name
 * @property {string} subModel - SubModel name
 */

// ============================================================================
// SERVICE STATUS
// ============================================================================

/**
 * Check if SEMA integration is configured and available
 * @returns {Object} Status object
 */
export function getServiceStatus() {
  return {
    configured: Boolean(SEMA_CONFIG.apiKey && SEMA_CONFIG.apiSecret),
    acesVersion: SEMA_CONFIG.acesVersion,
    piesVersion: SEMA_CONFIG.piesVersion,
    message: SEMA_CONFIG.apiKey 
      ? 'SEMA Data Co-Op integration ready'
      : 'SEMA credentials not configured. Set SEMA_API_KEY and SEMA_API_SECRET env vars.',
  };
}

// ============================================================================
// VCDB VEHICLE MAPPING
// ============================================================================

/**
 * Map VCdb vehicle IDs to AutoRev car_id
 * 
 * This creates/updates the vcdb_vehicles reference table to enable
 * ACES fitment data to link to our cars table.
 * 
 * @param {VCdbVehicle[]} vehicles - Array of VCdb vehicle records
 * @returns {Promise<Object>} Result with mapped counts
 */
export async function mapVcdbToAutoCars(vehicles) {
  if (!isSupabaseConfigured || !supabaseServiceRole) {
    throw new Error('Supabase not configured');
  }

  const results = {
    processed: 0,
    mapped: 0,
    unmatched: [],
  };

  for (const vehicle of vehicles) {
    results.processed++;

    // Try to find matching car in our database
    const carId = await findMatchingCar({
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      subModel: vehicle.subModel,
    });

    if (carId) {
      // Upsert to vcdb_vehicles mapping table
      const { error } = await supabaseServiceRole
        .from('vcdb_vehicles')
        .upsert({
          vcdb_id: vehicle.vehicleId,
          year_id: vehicle.yearId,
          make_id: vehicle.makeId,
          model_id: vehicle.modelId,
          submodel_id: vehicle.subModelId,
          base_vehicle_id: vehicle.baseVehicleId,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          submodel: vehicle.subModel,
          car_id: carId,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'vcdb_id',
        });

      if (!error) {
        results.mapped++;
      }
    } else {
      results.unmatched.push({
        vcdbId: vehicle.vehicleId,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
      });
    }
  }

  return results;
}

/**
 * Find matching car in our database based on year/make/model
 * Uses fuzzy matching to handle naming variations
 * 
 * @param {Object} vehicle - Vehicle details to match
 * @returns {Promise<string|null>} car_id or null if not found
 */
async function findMatchingCar({ year, make, model, subModel }) {
  // Build search pattern
  const searchName = `${make} ${model}`.toLowerCase();
  
  // First try exact match on name
  const { data: exactMatch } = await supabaseServiceRole
    .from('cars')
    .select('id, name, years')
    .ilike('name', `%${searchName}%`)
    .limit(10);

  if (exactMatch && exactMatch.length > 0) {
    // Filter by year range
    for (const car of exactMatch) {
      if (isYearInRange(year, car.years)) {
        return car.id;
      }
    }
  }

  // Try variant table for more specific matches
  const { data: variantMatch } = await supabaseServiceRole
    .from('car_variants')
    .select('car_id, variant_name, years')
    .ilike('variant_name', `%${subModel || model}%`)
    .limit(10);

  if (variantMatch && variantMatch.length > 0) {
    for (const variant of variantMatch) {
      if (isYearInRange(year, variant.years)) {
        return variant.car_id;
      }
    }
  }

  return null;
}

/**
 * Check if a year falls within a year range string
 * @param {number} year - Year to check
 * @param {string} yearsStr - Year range string (e.g., "2020-2024")
 * @returns {boolean}
 */
function isYearInRange(year, yearsStr) {
  if (!yearsStr) return false;
  
  const match = yearsStr.match(/(\d{4})\s*-\s*(\d{4}|present)?/i);
  if (match) {
    const start = parseInt(match[1]);
    const end = match[2]?.toLowerCase() === 'present' 
      ? new Date().getFullYear() + 1
      : parseInt(match[2]) || start;
    return year >= start && year <= end;
  }
  
  // Single year
  const singleYear = yearsStr.match(/(\d{4})/);
  return singleYear && parseInt(singleYear[1]) === year;
}

// ============================================================================
// ACES FITMENT PARSING
// ============================================================================

/**
 * Parse ACES XML/JSON fitment data
 * 
 * @param {string|Object} acesData - Raw ACES data (XML string or parsed JSON)
 * @param {string} format - Data format ('xml' or 'json')
 * @returns {ACESFitment[]} Parsed fitment records
 */
export function parseACESFitments(acesData, format = 'json') {
  if (format === 'json') {
    return parseACESJson(acesData);
  } else if (format === 'xml') {
    return parseACESXml(acesData);
  }
  throw new Error(`Unsupported ACES format: ${format}`);
}

/**
 * Parse ACES JSON format
 * @private
 */
function parseACESJson(data) {
  const fitments = [];
  
  // ACES JSON structure: { ACES: { App: [...] } }
  const apps = data?.ACES?.App || data?.apps || [];
  
  for (const app of apps) {
    fitments.push({
      baseVehicleId: app.BaseVehicle || app.baseVehicleId,
      subModelId: app.SubModel || app.subModelId,
      partNumber: app.Part || app.partNumber,
      brandId: app.Brand || app.brandId,
      qualifiers: app.Qual || app.qualifiers || [],
      notes: app.Note || app.notes || null,
    });
  }
  
  return fitments;
}

/**
 * Parse ACES XML format
 * @private
 */
function parseACESXml(xmlString) {
  // Note: For production, use a proper XML parser like xml2js
  console.warn('[SEMA] XML parsing not fully implemented - use JSON format');
  return [];
}

// ============================================================================
// FITMENT INGESTION
// ============================================================================

/**
 * Ingest ACES fitment data into part_fitments table
 * 
 * @param {ACESFitment[]} fitments - Parsed ACES fitment records
 * @param {Object} options - Ingestion options
 * @returns {Promise<Object>} Ingestion results
 */
export async function ingestACESFitments(fitments, options = {}) {
  if (!isSupabaseConfigured || !supabaseServiceRole) {
    throw new Error('Supabase not configured');
  }

  const {
    brandName = null,
    sourceUrl = null,
    dryRun = false,
  } = options;

  const results = {
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const fitment of fitments) {
    results.processed++;

    try {
      // 1. Find part by part_number
      const { data: part } = await supabaseServiceRole
        .from('parts')
        .select('id')
        .eq('part_number', fitment.partNumber)
        .maybeSingle();

      if (!part) {
        results.skipped++;
        results.errors.push({
          partNumber: fitment.partNumber,
          reason: 'Part not found in database',
        });
        continue;
      }

      // 2. Map VCdb vehicle to car_id
      const { data: vcdbMapping } = await supabaseServiceRole
        .from('vcdb_vehicles')
        .select('car_id')
        .eq('vcdb_id', fitment.baseVehicleId)
        .maybeSingle();

      if (!vcdbMapping?.car_id) {
        results.skipped++;
        results.errors.push({
          partNumber: fitment.partNumber,
          vcdbId: fitment.baseVehicleId,
          reason: 'VCdb vehicle not mapped to car_id',
        });
        continue;
      }

      if (dryRun) {
        results.created++;
        continue;
      }

      // 3. Upsert fitment
      const fitmentRow = {
        part_id: part.id,
        car_id: vcdbMapping.car_id,
        confidence: 0.95, // ACES = high confidence
        fitment_notes: fitment.notes,
        source_url: sourceUrl,
        verified: true,
        metadata: {
          source: 'sema_aces',
          aces_version: SEMA_CONFIG.acesVersion,
          vcdb_base_vehicle_id: fitment.baseVehicleId,
          vcdb_submodel_id: fitment.subModelId,
          brand_id: fitment.brandId,
          qualifiers: fitment.qualifiers,
        },
      };

      const { data: existing } = await supabaseServiceRole
        .from('part_fitments')
        .select('id')
        .eq('part_id', part.id)
        .eq('car_id', vcdbMapping.car_id)
        .is('car_variant_id', null)
        .maybeSingle();

      if (existing) {
        await supabaseServiceRole
          .from('part_fitments')
          .update(fitmentRow)
          .eq('id', existing.id);
        results.updated++;
      } else {
        await supabaseServiceRole
          .from('part_fitments')
          .insert(fitmentRow);
        results.created++;
      }
    } catch (err) {
      results.errors.push({
        partNumber: fitment.partNumber,
        error: err.message,
      });
    }
  }

  return results;
}

// ============================================================================
// PIES PRODUCT DATA PARSING
// ============================================================================

/**
 * Parse PIES product attribute data
 * 
 * @param {string|Object} piesData - Raw PIES data
 * @param {string} format - Data format ('xml' or 'json')
 * @returns {Object[]} Parsed product records
 */
export function parsePIESProducts(piesData, format = 'json') {
  if (format === 'json') {
    return parsePIESJson(piesData);
  }
  throw new Error(`Unsupported PIES format: ${format}`);
}

/**
 * Parse PIES JSON format
 * @private
 */
function parsePIESJson(data) {
  const products = [];
  
  const items = data?.PIES?.Item || data?.items || [];
  
  for (const item of items) {
    products.push({
      partNumber: item.PartNumber || item.partNumber,
      brandId: item.BrandID || item.brandId,
      descriptions: {
        short: item.Descriptions?.Short || item.shortDescription,
        long: item.Descriptions?.Long || item.longDescription,
        marketing: item.Descriptions?.Marketing || item.marketingDescription,
      },
      dimensions: {
        length: item.Dimensions?.Length,
        width: item.Dimensions?.Width,
        height: item.Dimensions?.Height,
        weight: item.Dimensions?.Weight,
      },
      prices: {
        msrp: item.Prices?.MSRP,
        map: item.Prices?.MAP,
        jobber: item.Prices?.Jobber,
      },
      images: item.DigitalAssets?.Images || [],
      attributes: item.ExtendedAttributes || [],
    });
  }
  
  return products;
}

// ============================================================================
// FULL SYNC WORKFLOW
// ============================================================================

/**
 * Full SEMA Data sync workflow
 * 
 * 1. Download latest VCdb reference data
 * 2. Map VCdb vehicles to AutoRev cars
 * 3. Download ACES fitment data
 * 4. Ingest fitments into part_fitments
 * 
 * @param {Object} options - Sync options
 * @returns {Promise<Object>} Sync results
 */
export async function runFullSync(options = {}) {
  const status = getServiceStatus();
  
  if (!status.configured) {
    throw new Error(status.message);
  }

  console.log('[SEMA] Starting full sync...');
  console.log(`[SEMA] ACES version: ${status.acesVersion}`);
  console.log(`[SEMA] PIES version: ${status.piesVersion}`);

  // TODO: Implement actual SEMA API calls when credentials available
  // For now, return placeholder indicating manual intervention needed

  return {
    success: false,
    message: 'SEMA Data Co-Op sync requires API credentials. Please configure SEMA_API_KEY and SEMA_API_SECRET.',
    documentation: 'See docs/TURN14_SEMA_RESEARCH.md for implementation details',
    steps: [
      '1. Join SEMA Data Co-Op (sema.org/data)',
      '2. Subscribe to Auto Care Association reference database API',
      '3. Set SEMA_API_KEY and SEMA_API_SECRET environment variables',
      '4. Run this sync again',
    ],
  };
}

// ============================================================================
// DATA VALIDATION APPROACH (NON-SEMA SOURCES)
// ============================================================================

/**
 * DATA VALIDATION STRATEGY
 * 
 * While SEMA Data Co-Op provides industry-standard fitment data, it requires
 * significant investment (~$500/month subscription + SEMA membership).
 * 
 * For cost-effective data collection, AutoRev uses validated Shopify vendor
 * feeds and community sources with the following quality controls:
 * 
 * ──────────────────────────────────────────────────────────────────────────
 * SHOPIFY VENDOR VALIDATION (lib/partsVendorIngestionService.js)
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * 1. PATTERN MATCHING CONFIDENCE SCORING:
 *    - Each vendor has a confidenceBase (0.65-0.80)
 *    - Tag patterns in vendorAdapters.js have individual confidence (0.65-0.90)
 *    - Final confidence = min(vendorBase, patternConfidence)
 *    - Only fitments with confidence >= 0.60 are written
 * 
 * 2. MULTI-STAGE VALIDATION:
 *    a) Tag extraction from Shopify product tags
 *    b) Pattern matching against PLATFORM_TAG_PATTERNS
 *    c) car_id resolution via lib/carResolver.js
 *    d) Duplicate detection before insert
 * 
 * 3. VERIFIED SHOPIFY VENDORS (as of Jan 2026):
 *    - subimods: WRX/STI specialist (0.75 base confidence)
 *    - ftspeed: 86/BRZ/Supra/GR Corolla specialist (0.72)
 *    - jhpusa: Honda/Acura specialist (0.72)
 *    - maperformance: Multi-brand including Evo/WRX (0.68)
 *    - eqtuning/bmptuning/performancebyie: VAG specialists (0.70-0.75)
 * 
 * 4. VENDORS REQUIRING AFFILIATE FEED INTEGRATION:
 *    - americanmuscle: Mustang/Camaro/Challenger (custom platform)
 *    - extremeterrain: Jeep/Bronco (custom platform)
 *    - realtruck: Trucks (custom platform)
 *    - These require CJ/Rakuten affiliate feed setup
 * 
 * ──────────────────────────────────────────────────────────────────────────
 * YOUTUBE VIDEO VALIDATION (lib/youtubeClient.js)
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * 1. CREDIBILITY TIERS:
 *    - tier1: Official manufacturer/OEM channels
 *    - tier2: Established enthusiast channels (>100K subs, verified content)
 *    - tier3: Community channels (useful but lower authority)
 * 
 * 2. CONTENT VALIDATION:
 *    - Title/description must contain car identifiers
 *    - AI-assisted car_id resolution from video metadata
 *    - Deduplication by video_id
 * 
 * ──────────────────────────────────────────────────────────────────────────
 * FORUM INSIGHT VALIDATION (lib/forumConfigs.js)
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * 1. THREAD QUALITY FILTERS:
 *    - minReplies: 3-5 (varies by forum)
 *    - minViews: 300-1000 (varies by forum)
 *    - titleInclude: DIY, guide, issue, track, etc.
 *    - titleExclude: WTS, FS:, FOR SALE, etc.
 * 
 * 2. FORUM PRIORITY SCORING:
 *    - priority 10: Specialist forums (Rennlist, F150Forum)
 *    - priority 8-9: Strong brand forums (FT86Club, S2Ki)
 *    - priority 0: Disabled forums (403 blocks)
 * 
 * ──────────────────────────────────────────────────────────────────────────
 * FUTURE SEMA INTEGRATION PATH
 * ──────────────────────────────────────────────────────────────────────────
 * 
 * When budget allows ($500/month + SEMA membership):
 * 
 * 1. Subscribe to SEMA Data Co-Op
 * 2. Populate vcdb_vehicles table with VCdb reference data
 * 3. Import ACES fitment data at 0.95 confidence
 * 4. Use SEMA data to validate/boost existing Shopify-sourced fitments
 * 5. Add ACES brand_id and turn14_item_id to parts table (columns exist)
 * 
 * The vcdb_vehicles table is already created and ready for SEMA integration.
 * See docs/TURN14_SEMA_RESEARCH.md for detailed implementation steps.
 */

/**
 * Validation confidence tiers for data quality assessment
 */
export const DATA_CONFIDENCE_TIERS = {
  // SEMA ACES data (industry standard)
  sema_aces: { minConfidence: 0.95, label: 'verified', source: 'SEMA Data Co-Op' },
  
  // Shopify vendor feeds with tag pattern matching
  shopify_vendor: { minConfidence: 0.60, label: 'extracted', source: 'Vendor Feed' },
  
  // Community sources (forums, YouTube, Reddit)
  community: { minConfidence: 0.50, label: 'community', source: 'Community' },
  
  // AI-enhanced data (extracted from video transcripts, etc.)
  ai_enhanced: { minConfidence: 0.55, label: 'ai-enhanced', source: 'AI Extraction' },
};

/**
 * Get validation tier for a given confidence score
 * @param {number} confidence - Confidence score (0-1)
 * @returns {Object} Tier information
 */
export function getConfidenceTier(confidence) {
  if (confidence >= 0.95) return DATA_CONFIDENCE_TIERS.sema_aces;
  if (confidence >= 0.60) return DATA_CONFIDENCE_TIERS.shopify_vendor;
  if (confidence >= 0.55) return DATA_CONFIDENCE_TIERS.ai_enhanced;
  return DATA_CONFIDENCE_TIERS.community;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getServiceStatus,
  mapVcdbToAutoCars,
  parseACESFitments,
  ingestACESFitments,
  parsePIESProducts,
  runFullSync,
  // Validation utilities
  DATA_CONFIDENCE_TIERS,
  getConfidenceTier,
};
