/**
 * Parts Research Service
 * 
 * Handles storage of AL-researched parts with proper manufacturer attribution.
 * Used by both batch research and real-time AL conversations.
 * 
 * Key features:
 * - Separates manufacturer (who makes it) from vendor (who sells it)
 * - Validates manufacturer names against known registry
 * - Stores AL recommendations for quick display in parts tiles
 * - Tracks pricing from multiple vendors
 */

import { supabaseServiceRole, isSupabaseConfigured } from './supabase.js';
import { 
  extractManufacturerFromName, 
  isKnownRetailer,
  buildManufacturerLookup,
} from '../data/seedManufacturers.js';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Common spelling variations to normalize for deduplication.
 * Format: [regex pattern, replacement]
 * Applied in order, so more specific patterns should come first.
 */
const NAME_NORMALIZATIONS = [
  // Exhaust variations
  [/\bcat[\s-]?back\b/gi, 'catback'],
  [/\baxle[\s-]?back\b/gi, 'axleback'],
  [/\bdown[\s-]?pipe\b/gi, 'downpipe'],
  [/\btest[\s-]?pipe/gi, 'testpipe'],
  
  // Intake variations - normalize all intake terms
  [/\bcold[\s-]?air[\s-]?intake\b/gi, 'intake'],
  [/\bintake[\s-]?systems?\b/gi, 'intake'],
  [/\bair[\s-]?intake\b/gi, 'intake'],
  [/\bcai\b/gi, 'intake'],
  
  // Brake variations
  [/\bbig[\s-]?brake[\s-]?kit\b/gi, 'big brake kit'],
  [/\bbrake[\s-]?lines?\b/gi, 'brake line'],
  [/\bss\b/gi, 'stainless steel'], // SS = stainless steel
  [/\bstainless[\s-]?steel[\s-]?braided\b/gi, 'stainless steel braided'],
  
  // Tune/ECU variations
  [/\becu[\s-]?tune\b/gi, 'tune'],
  [/\bstage[\s-]?(\d)\+?\b/gi, 'stage$1'], // stage 1+ -> stage1
  [/\bsoftware[\s-]?tune\b/gi, 'tune'],
  [/\becu\s+software\b/gi, 'tune'],
  
  // Suspension
  [/\bcoil[\s-]?overs?\b/gi, 'coilover'],
  [/\blowering[\s-]?springs?\b/gi, 'lowering spring'],
  [/\bsway[\s-]?bars?\b/gi, 'sway bar'],
  
  // Forced induction
  [/\binter[\s-]?cooler\b/gi, 'intercooler'],
  [/\bsuper[\s-]?charger\b/gi, 'supercharger'],
  
  // Carbon fiber variations
  [/\bcarbon[\s-]?fiber\b/gi, 'cf'],
  [/\bcarbon\b/gi, 'cf'],
  
  // Exhaust type normalization
  [/\bexhaust[\s-]?system\b/gi, 'exhaust'],
  [/\bexhaust[\s-]?kit\b/gi, 'exhaust'],
  
  // General cleanup
  [/\s+/g, ' '], // Collapse multiple spaces
];

/**
 * Words to remove from product names (often redundant descriptors)
 * These are removed AFTER other normalizations - both at END and as standalone words
 */
const WORDS_TO_STRIP = [
  'system', 'systems', 'kit', 'kits', 'set', 'sets', 'upgrade', 'upgrades',
  'for', 'with', 'and', 'the',
];

/**
 * Normalize a product name for consistent storage and comparison.
 * This catches spelling variations like "Cat Back" vs "Catback",
 * and removes redundant suffixes like "System" or "Kit".
 * 
 * @param {string} name - Original product name
 * @returns {string} - Normalized name for storage/comparison
 */
export function normalizePartName(name) {
  if (!name) return '';
  
  let normalized = name.trim();
  
  // Apply all normalization patterns
  for (const [pattern, replacement] of NAME_NORMALIZATIONS) {
    normalized = normalized.replace(pattern, replacement);
  }
  
  // Remove trailing redundant words (check multiple times for chained words)
  let changed = true;
  while (changed) {
    changed = false;
    const words = normalized.trim().split(/\s+/);
    const lastWord = words[words.length - 1]?.toLowerCase();
    
    if (lastWord && WORDS_TO_STRIP.includes(lastWord)) {
      words.pop();
      normalized = words.join(' ');
      changed = true;
    }
  }
  
  // Final cleanup: trim, collapse spaces
  normalized = normalized
    .trim()
    .replace(/\s+/g, ' ');
  
  return normalized;
}

/**
 * Generate a "comparison key" for fuzzy matching.
 * This is more aggressive normalization used for checking if two names
 * are likely the same product. It removes filler words and normalizes
 * everything to create a canonical form.
 * 
 * @param {string} name - Product name
 * @returns {string} - Comparison key (lowercase, minimal)
 */
export function generateComparisonKey(name) {
  if (!name) return '';
  
  let key = normalizePartName(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove all filler words for comparison
  const fillerWords = new Set([
    'system', 'systems', 'kit', 'kits', 'set', 'sets', 
    'upgrade', 'upgrades', 'for', 'with', 'and', 'the',
    'a', 'an', 'by', 'from', 'to', 'of', 'in', 'on',
  ]);
  
  key = key
    .split(/\s+/)
    .filter(word => !fillerWords.has(word))
    .join(' ');
  
  return key;
}

const UPGRADE_KEY_TO_CATEGORY = {
  'intake': 'intake',
  'cold-air-intake': 'intake',
  'exhaust-catback': 'exhaust',
  'exhaust-axleback': 'exhaust',
  'catback': 'exhaust',
  'downpipe': 'exhaust',
  'headers': 'exhaust',
  'stage1-tune': 'tune',
  'stage2-tune': 'tune',
  'stage3-tune': 'tune',
  'tune': 'tune',
  'ecu-tune': 'tune',
  'coilovers-street': 'suspension',
  'coilovers-track': 'suspension',
  'coilovers': 'suspension',
  'lowering-springs': 'suspension',
  'sway-bars': 'suspension',
  'big-brake-kit': 'brakes',
  'brake-pads-track': 'brakes',
  'brake-pads-street': 'brakes',
  'intercooler': 'cooling',
  'oil-cooler': 'cooling',
  'radiator-upgrade': 'cooling',
  'turbo-upgrade-existing': 'forced_induction',
  'turbo-upgrade-larger': 'forced_induction',
  'supercharger-kit': 'forced_induction',
  'turbo-kit-single': 'forced_induction',
  'clutch-upgrade': 'drivetrain',
  'driveshaft-upgrade': 'drivetrain',
  'flex-fuel-e85': 'fuel_system',
  'fuel-system-upgrade': 'fuel_system',
  'wheels-lightweight': 'wheels_tires',
  'wheels-forged': 'wheels_tires',
  'tires-summer': 'wheels_tires',
  'wing': 'aero',
  'splitter': 'aero',
  'diffuser': 'aero',
};

// ============================================================================
// MANUFACTURER UTILITIES
// ============================================================================

let manufacturerLookupCache = null;

function getManufacturerLookup() {
  if (!manufacturerLookupCache) {
    manufacturerLookupCache = buildManufacturerLookup();
  }
  return manufacturerLookupCache;
}

/**
 * Look up manufacturer website from our registry
 */
export function getManufacturerUrl(manufacturerName) {
  if (!manufacturerName) return null;
  
  const lookup = getManufacturerLookup();
  const mfg = lookup.get(manufacturerName.toLowerCase());
  return mfg?.website || null;
}

/**
 * Validate and normalize manufacturer name
 * Returns null if the name appears to be a retailer
 */
export function validateManufacturerName(name) {
  if (!name) return null;
  
  // Check if it's a known retailer (should not be used as manufacturer)
  if (isKnownRetailer(name)) {
    return null;
  }
  
  // Check if it matches a known manufacturer
  const lookup = getManufacturerLookup();
  const mfg = lookup.get(name.toLowerCase());
  
  if (mfg) {
    // Return the canonical name
    return mfg.name;
  }
  
  // Not in our registry, but might still be valid
  // Return as-is but flag for review
  return name;
}

/**
 * Extract manufacturer from a product name
 * E.g., "APR Tuning Catback Exhaust" -> "APR"
 */
export function extractManufacturer(productName) {
  if (!productName) return null;
  
  const mfg = extractManufacturerFromName(productName);
  if (mfg) {
    return {
      name: mfg.name,
      website: mfg.website,
      confidence: 0.9,
    };
  }
  
  // Try to extract from first word(s) of product name
  const firstWord = productName.split(/\s+/)[0];
  if (firstWord && !isKnownRetailer(firstWord)) {
    return {
      name: firstWord,
      website: null,
      confidence: 0.5,
    };
  }
  
  return null;
}

// ============================================================================
// PART STORAGE
// ============================================================================

function requireServiceRole() {
  if (!isSupabaseConfigured || !supabaseServiceRole) {
    throw new Error('Supabase service role not configured');
  }
  return supabaseServiceRole;
}

/**
 * Upsert a part with proper manufacturer attribution
 * 
 * Uses NORMALIZED name matching on (manufacturer_name, name, category) to prevent duplicates.
 * The normalization catches spelling variations like "Cat Back" vs "Catback" and
 * removes redundant suffixes like "System" or "Kit".
 * 
 * The database has a unique constraint on these fields.
 * 
 * @param {object} options
 * @param {string} options.manufacturerName - Actual manufacturer (APR, Borla, etc.)
 * @param {string} options.productName - Product name (without manufacturer prefix)
 * @param {string} options.category - Part category (exhaust, intake, etc.)
 * @param {string} [options.upgradeKey] - Upgrade key if known
 * @param {string} [options.manufacturerUrl] - Manufacturer website
 * @param {string} [options.manufacturerProductUrl] - Product page on manufacturer site
 * @param {string} [options.qualityTier] - budget/mid/premium/ultra-premium
 * @param {string} [options.description] - Part description
 * @param {string} [options.partNumber] - SKU or part number
 * @param {number} [options.confidence] - Data confidence (0-1)
 * @returns {Promise<{partId: string, isNew: boolean}>}
 */
export async function upsertPart({
  manufacturerName,
  productName,
  category,
  upgradeKey,
  manufacturerUrl,
  manufacturerProductUrl,
  qualityTier = 'mid',
  description,
  partNumber,
  confidence = 0.7,
}) {
  const client = requireServiceRole();

  // Validate manufacturer
  const validatedMfg = validateManufacturerName(manufacturerName);
  if (!validatedMfg) {
    throw new Error(`Invalid manufacturer name (appears to be retailer): ${manufacturerName}`);
  }

  // Look up manufacturer URL if not provided
  const mfgUrl = manufacturerUrl || getManufacturerUrl(validatedMfg);

  // Determine category from upgrade key if not provided
  const partCategory = category || UPGRADE_KEY_TO_CATEGORY[upgradeKey] || 'other';

  // Normalize product name for consistent storage and deduplication
  // This catches spelling variations like "Cat Back" vs "Catback",
  // "Intake System" vs "Intake", etc.
  const normalizedName = normalizePartName(productName);
  const comparisonKey = generateComparisonKey(productName);

  // DEDUPLICATION STRATEGY:
  // 1. First, try exact match on part_number (most reliable)
  // 2. Then, try exact match on manufacturer + normalized name + category
  // 3. Then, try fuzzy match using comparison key (catches more variations)
  // 4. If no match found, insert new part (let DB constraint catch any edge cases)

  // Strategy 1: Check by part_number if provided (most reliable identifier)
  if (partNumber) {
    const { data: existingByPartNumber } = await client
      .from('parts')
      .select('id')
      .eq('manufacturer_name', validatedMfg)
      .eq('part_number', partNumber)
      .maybeSingle();

    if (existingByPartNumber?.id) {
      await client
        .from('parts')
        .update({
          manufacturer_url: mfgUrl,
          manufacturer_product_url: manufacturerProductUrl,
          quality_tier: qualityTier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingByPartNumber.id);

      return { partId: existingByPartNumber.id, isNew: false };
    }
  }

  // Strategy 2: Check by exact manufacturer + normalized name + category match
  // This matches the unique constraint: ux_parts_manufacturer_name_category
  const { data: existingByName } = await client
    .from('parts')
    .select('id, name')
    .eq('manufacturer_name', validatedMfg)
    .eq('name', normalizedName)
    .eq('category', partCategory)
    .maybeSingle();

  if (existingByName?.id) {
    // Update existing part with any new info
    await client
      .from('parts')
      .update({
        manufacturer_url: mfgUrl,
        manufacturer_product_url: manufacturerProductUrl,
        quality_tier: qualityTier,
        part_number: partNumber || undefined, // Add part_number if we have it now
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingByName.id);

    return { partId: existingByName.id, isNew: false };
  }

  // Strategy 3: Fuzzy match using comparison key
  // This catches cases where normalization produces different stored names
  // but the comparison keys match (e.g., "X34 Cold Air Intake" vs "X34 Intake")
  const { data: similarParts } = await client
    .from('parts')
    .select('id, name')
    .eq('manufacturer_name', validatedMfg)
    .eq('category', partCategory)
    .limit(50); // Get all parts from this manufacturer in this category

  if (similarParts && similarParts.length > 0) {
    // Check if any existing part has the same comparison key
    for (const part of similarParts) {
      const existingKey = generateComparisonKey(part.name);
      if (existingKey === comparisonKey) {
        // Found a match - update and return existing
        await client
          .from('parts')
          .update({
            manufacturer_url: mfgUrl,
            manufacturer_product_url: manufacturerProductUrl,
            quality_tier: qualityTier,
            part_number: partNumber || undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', part.id);

        return { partId: part.id, isNew: false };
      }
    }
  }

  // Strategy 4: Insert new part
  // Use upsert with onConflict to handle race conditions
  const { data: newPart, error } = await client
    .from('parts')
    .upsert({
      name: normalizedName,
      manufacturer_name: validatedMfg,
      manufacturer_url: mfgUrl,
      manufacturer_product_url: manufacturerProductUrl,
      brand_name: validatedMfg, // Backward compatibility
      category: partCategory,
      quality_tier: qualityTier,
      description: description || null,
      part_number: partNumber || null,
      confidence: confidence,
      data_source: 'al_research',
      is_active: true,
    }, {
      onConflict: 'manufacturer_name,name,category',
      ignoreDuplicates: false, // Update on conflict
    })
    .select('id')
    .single();

  if (error) {
    // If error is duplicate key violation, try to fetch the existing record
    if (error.code === '23505') {
      const { data: existingPart } = await client
        .from('parts')
        .select('id')
        .eq('manufacturer_name', validatedMfg)
        .eq('name', normalizedName)
        .eq('category', partCategory)
        .single();
      
      if (existingPart?.id) {
        return { partId: existingPart.id, isNew: false };
      }
    }
    throw error;
  }
  
  return { partId: newPart.id, isNew: true };
}

/**
 * Add a vendor pricing snapshot for a part
 * 
 * @param {object} options
 * @param {string} options.partId - UUID of the part
 * @param {string} options.vendorName - Retailer name (BMP Tuning, FT Speed, etc.)
 * @param {number} options.priceCents - Price in cents
 * @param {string} [options.productUrl] - Product URL on vendor site
 * @param {string} [options.vendorUrl] - Vendor website
 * @param {boolean} [options.inStock] - Availability
 */
export async function addVendorPricing({
  partId,
  vendorName,
  priceCents,
  productUrl,
  vendorUrl,
  inStock,
}) {
  const client = requireServiceRole();

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await client
    .from('part_pricing_snapshots')
    .upsert({
      part_id: partId,
      vendor_name: vendorName,
      vendor_url: vendorUrl || null,
      product_url: productUrl || null,
      price_cents: priceCents,
      currency: 'USD',
      in_stock: inStock ?? null,
      recorded_at: today,
    }, {
      onConflict: 'part_id,vendor_name,recorded_at',
    });

  if (error) throw error;
}

/**
 * Add a fitment record linking a part to a car
 * 
 * Uses upsert to handle the unique constraint on (part_id, car_id).
 * 
 * @param {object} options
 * @param {string} options.partId - UUID of the part
 * @param {string} options.carId - UUID of the car
 * @param {number} [options.confidence] - Fitment confidence (0-1)
 * @param {boolean} [options.verified] - Is fitment verified
 * @param {string} [options.sourceUrl] - Source of fitment info
 * @param {string} [options.notes] - Fitment notes
 */
export async function addPartFitment({
  partId,
  carId,
  confidence = 0.7,
  verified = false,
  sourceUrl,
  notes,
}) {
  const client = requireServiceRole();

  // Use upsert with onConflict to handle the unique constraint on (part_id, car_id)
  const { data: fitment, error } = await client
    .from('part_fitments')
    .upsert({
      part_id: partId,
      car_id: carId,
      confidence: Math.max(confidence, 0),
      verified: verified,
      source_url: sourceUrl || null,
      fitment_notes: notes || null,
    }, {
      onConflict: 'part_id,car_id',
      ignoreDuplicates: false, // Update on conflict
    })
    .select('id')
    .single();

  if (error) {
    // If conflict error, try to fetch existing record
    if (error.code === '23505') {
      const { data: existing } = await client
        .from('part_fitments')
        .select('id')
        .eq('part_id', partId)
        .eq('car_id', carId)
        .single();
      
      if (existing?.id) {
        return existing.id;
      }
    }
    throw error;
  }
  
  return fitment.id;
}

/**
 * Save an AL recommendation for display in parts tiles
 * 
 * The al_part_recommendations table has two unique constraints:
 * 1. (car_id, upgrade_key, part_id) - A part can only be recommended once per car+upgrade
 * 2. (car_id, upgrade_key, rank) - Each rank can only be used once per car+upgrade
 * 
 * This function handles both by:
 * - First checking if the part is already recommended for this car+upgrade
 * - If so, updating the existing record's rank
 * - If not, inserting with the new rank (which may shift existing ranks)
 * 
 * @param {object} options
 * @param {string} options.carId - UUID of the car
 * @param {string} options.upgradeKey - Upgrade key (intake, exhaust-catback, etc.)
 * @param {string} options.partId - UUID of the recommended part
 * @param {number} options.rank - Rank (1 = best)
 * @param {string} [options.conversationId] - AL conversation that generated this
 * @param {string} [options.source] - Source of recommendation
 */
export async function saveALRecommendation({
  carId,
  upgradeKey,
  partId,
  rank,
  conversationId,
  source = 'al_research',
}) {
  const client = requireServiceRole();

  // Check if this part is already recommended for this car+upgrade
  const { data: existingByPart } = await client
    .from('al_part_recommendations')
    .select('id, rank')
    .eq('car_id', carId)
    .eq('upgrade_key', upgradeKey)
    .eq('part_id', partId)
    .maybeSingle();

  if (existingByPart?.id) {
    // Part already recommended - update rank if different
    if (existingByPart.rank !== rank) {
      // First, clear the target rank if occupied
      await client
        .from('al_part_recommendations')
        .delete()
        .eq('car_id', carId)
        .eq('upgrade_key', upgradeKey)
        .eq('rank', rank);

      // Then update this record's rank
      await client
        .from('al_part_recommendations')
        .update({
          rank: rank,
          conversation_id: conversationId || null,
          source: source,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingByPart.id);
    }
    return;
  }

  // Check if the rank is already occupied by a different part
  const { data: existingByRank } = await client
    .from('al_part_recommendations')
    .select('id')
    .eq('car_id', carId)
    .eq('upgrade_key', upgradeKey)
    .eq('rank', rank)
    .maybeSingle();

  if (existingByRank?.id) {
    // Rank occupied - delete the existing recommendation at this rank
    await client
      .from('al_part_recommendations')
      .delete()
      .eq('id', existingByRank.id);
  }

  // Insert new recommendation
  const { error } = await client
    .from('al_part_recommendations')
    .insert({
      car_id: carId,
      upgrade_key: upgradeKey,
      part_id: partId,
      rank: rank,
      conversation_id: conversationId || null,
      source: source,
    });

  if (error) {
    // Handle race condition - if duplicate key, it's OK (another request won)
    if (error.code === '23505') {
      console.log('[saveALRecommendation] Duplicate key - record already exists');
      return;
    }
    throw error;
  }
}

/**
 * Complete flow: Save a researched part with all related data
 * 
 * @param {object} options
 * @param {string} options.carId - UUID of the car
 * @param {string} options.upgradeKey - Upgrade key
 * @param {object} options.part - Part data from AI extraction
 * @returns {Promise<{partId: string, success: boolean}>}
 */
export async function saveResearchedPart({
  carId,
  upgradeKey,
  part,
}) {
  try {
    // 1. Validate and save the part
    const { partId, isNew } = await upsertPart({
      manufacturerName: part.manufacturer_name,
      productName: part.product_name,
      category: part.category,
      upgradeKey: upgradeKey,
      manufacturerUrl: part.manufacturer_url,
      qualityTier: part.quality_tier,
      confidence: part.confidence || 0.7,
    });

    // 2. Add vendor pricing if available
    if (part.vendor_name && part.price_cents) {
      await addVendorPricing({
        partId,
        vendorName: part.vendor_name,
        priceCents: part.price_cents,
        productUrl: part.product_url,
        vendorUrl: part.vendor_url,
      });
    }

    // 3. Add fitment record
    await addPartFitment({
      partId,
      carId,
      confidence: part.confidence || 0.7,
      verified: false,
      sourceUrl: part.product_url,
    });

    // 4. Save AL recommendation if rank is provided
    if (part.rank) {
      await saveALRecommendation({
        carId,
        upgradeKey,
        partId,
        rank: part.rank,
        source: 'batch_research',
      });
    }

    return { partId, success: true, isNew };
  } catch (err) {
    console.error('[partsResearchService] Error saving part:', err.message);
    return { partId: null, success: false, error: err.message };
  }
}

/**
 * Bulk save multiple researched parts
 * 
 * @param {string} carId - UUID of the car
 * @param {string} upgradeKey - Upgrade key
 * @param {object[]} parts - Array of parts from AI extraction
 * @returns {Promise<{saved: number, failed: number, partIds: string[]}>}
 */
export async function bulkSaveResearchedParts(carId, upgradeKey, parts) {
  let saved = 0;
  let failed = 0;
  const partIds = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    // Ensure rank is set
    if (!part.rank) {
      part.rank = i + 1;
    }

    const result = await saveResearchedPart({
      carId,
      upgradeKey,
      part,
    });

    if (result.success) {
      saved++;
      partIds.push(result.partId);
    } else {
      failed++;
    }
  }

  return { saved, failed, partIds };
}

const partsResearchService = {
  upsertPart,
  addVendorPricing,
  addPartFitment,
  saveALRecommendation,
  saveResearchedPart,
  bulkSaveResearchedParts,
  extractManufacturer,
  validateManufacturerName,
  getManufacturerUrl,
  normalizePartName,
  generateComparisonKey,
};

export default partsResearchService;
