/**
 * Parts Quality Service
 *
 * Provides quality validation, duplicate detection, and data integrity
 * checks for parts and fitment data.
 *
 * @module lib/partsQualityService
 */

import { supabaseServiceRole, isSupabaseConfigured } from './supabase.js';

// ============================================================================
// QUALITY THRESHOLDS
// ============================================================================

export const QUALITY_THRESHOLDS = {
  // Minimum confidence for fitments
  MIN_FITMENT_CONFIDENCE: 0.60,

  // Required fields for a complete part
  REQUIRED_FIELDS: ['name', 'part_number', 'category', 'brand_name'],

  // Maximum duplicate ratio before alert
  MAX_DUPLICATE_RATIO: 0.05,

  // Minimum description length
  MIN_DESCRIPTION_LENGTH: 20,

  // Price sanity bounds
  MIN_PRICE_CENTS: 100, // $1 minimum
  MAX_PRICE_CENTS: 50000000, // $500k maximum
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a single part record
 * @param {Object} part - Part to validate
 * @returns {{ isValid: boolean, errors: string[], warnings: string[] }}
 */
export function validatePart(part) {
  const errors = [];
  const warnings = [];

  // Check required fields
  for (const field of QUALITY_THRESHOLDS.REQUIRED_FIELDS) {
    if (!part[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Part number format check
  if (part.part_number) {
    if (part.part_number.length < 3) {
      warnings.push('Part number seems too short');
    }
    if (/^\d+$/.test(part.part_number)) {
      warnings.push('Part number is numeric only (may be internal ID)');
    }
  }

  // Name sanity
  if (part.name) {
    if (part.name.length < 5) {
      warnings.push('Name seems too short');
    }
    if (part.name.length > 500) {
      warnings.push('Name seems too long');
    }
    if (/test|placeholder|dummy/i.test(part.name)) {
      errors.push('Name contains test/placeholder text');
    }
  }

  // Category validation
  const validCategories = [
    'intake',
    'exhaust',
    'suspension',
    'brakes',
    'forced_induction',
    'cooling',
    'fuel_system',
    'tune',
    'wheels_tires',
    'engine',
    'drivetrain',
    'exterior',
    'interior',
    'other',
  ];

  if (part.category && !validCategories.includes(part.category)) {
    warnings.push(`Unknown category: ${part.category}`);
  }

  // Description length
  if (part.description && part.description.length < QUALITY_THRESHOLDS.MIN_DESCRIPTION_LENGTH) {
    warnings.push('Description is very short');
  }

  // Confidence check
  if (part.confidence !== undefined && part.confidence !== null) {
    if (part.confidence < QUALITY_THRESHOLDS.MIN_FITMENT_CONFIDENCE) {
      warnings.push(`Low confidence score: ${part.confidence}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate fitment record
 * @param {Object} fitment - Fitment to validate
 * @returns {{ isValid: boolean, errors: string[], warnings: string[] }}
 */
export function validateFitment(fitment) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!fitment.part_id) {
    errors.push('Missing part_id');
  }
  if (!fitment.car_id) {
    errors.push('Missing car_id');
  }

  // Confidence check
  if (fitment.confidence !== undefined && fitment.confidence !== null) {
    if (fitment.confidence < QUALITY_THRESHOLDS.MIN_FITMENT_CONFIDENCE) {
      warnings.push(`Low confidence: ${fitment.confidence}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate price
 * @param {number} priceCents - Price in cents
 * @returns {{ isValid: boolean, errors: string[], warnings: string[] }}
 */
export function validatePrice(priceCents) {
  const errors = [];
  const warnings = [];

  if (priceCents === null || priceCents === undefined) {
    warnings.push('No price set');
    return { isValid: true, errors, warnings };
  }

  if (priceCents < QUALITY_THRESHOLDS.MIN_PRICE_CENTS) {
    warnings.push(`Price seems too low: $${(priceCents / 100).toFixed(2)}`);
  }

  if (priceCents > QUALITY_THRESHOLDS.MAX_PRICE_CENTS) {
    errors.push(`Price exceeds maximum: $${(priceCents / 100).toFixed(2)}`);
  }

  return { isValid: errors.length === 0, errors, warnings };
}

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

/**
 * Find potential duplicate parts
 * @param {Object} part - Part to check
 * @returns {Promise<Array>}
 */
export async function findDuplicates(part) {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabaseServiceRole
    .from('parts')
    .select('id, name, part_number, brand_name')
    .or(
      `part_number.eq.${part.part_number},` +
        `and(brand_name.eq.${part.brand_name},name.ilike.%${part.name.slice(0, 50)}%)`
    )
    .neq('id', part.id || '00000000-0000-0000-0000-000000000000')
    .limit(10);

  if (error) {
    console.error('[PartsQuality] Duplicate check error:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Get duplicate statistics across the database
 * @returns {Promise<Object>}
 */
export async function getDuplicateStats() {
  if (!isSupabaseConfigured) return null;

  // Find parts with same part_number but different IDs
  const { data, error } = await supabaseServiceRole.rpc('get_duplicate_parts_count');

  if (error) {
    // Fallback query if RPC doesn't exist
    const { data: fallback, error: fallbackErr } = await supabaseServiceRole
      .from('parts')
      .select('part_number, brand_name')
      .limit(10000);

    if (fallbackErr) return null;

    // Count duplicates manually
    const seen = new Map();
    let duplicates = 0;

    for (const p of fallback || []) {
      const key = `${p.brand_name}|${p.part_number}`;
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.set(key, true);
      }
    }

    return {
      totalParts: fallback?.length || 0,
      duplicates,
      duplicateRatio: duplicates / (fallback?.length || 1),
    };
  }

  return data;
}

// ============================================================================
// DATABASE QUALITY QUERIES
// ============================================================================

/**
 * Get parts with low confidence fitments
 * @param {Object} [options] - Options
 * @param {number} [options.threshold] - Confidence threshold
 * @param {number} [options.limit] - Max results
 * @returns {Promise<Array>}
 */
export async function getPartsWithLowConfidenceFitments(options = {}) {
  const { threshold = QUALITY_THRESHOLDS.MIN_FITMENT_CONFIDENCE, limit = 50 } = options;

  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabaseServiceRole
    .from('part_fitments')
    .select(
      `
      id,
      confidence,
      fitment_notes,
      parts (id, name, part_number, brand_name),
      cars (id, slug, name)
    `
    )
    .lt('confidence', threshold)
    .order('confidence', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[PartsQuality] Low confidence query error:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Get parts missing required data
 * @param {Object} [options] - Options
 * @param {number} [options.limit] - Max results
 * @returns {Promise<Array>}
 */
export async function getPartsMissingData(options = {}) {
  const { limit = 50 } = options;

  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabaseServiceRole
    .from('parts')
    .select('id, name, part_number, brand_name, category, description')
    .or('category.is.null,description.is.null,description.eq.')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[PartsQuality] Missing data query error:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Get parts without any fitments
 * @param {Object} [options] - Options
 * @param {number} [options.limit] - Max results
 * @returns {Promise<Array>}
 */
export async function getPartsWithoutFitments(options = {}) {
  const { limit = 100 } = options;

  if (!isSupabaseConfigured) return [];

  // This is a bit tricky - we need parts that have no fitments
  const { data, error } = await supabaseServiceRole.rpc('get_parts_without_fitments', {
    p_limit: limit,
  });

  if (error) {
    // Fallback if RPC doesn't exist
    const { data: allParts } = await supabaseServiceRole
      .from('parts')
      .select('id, name, part_number, brand_name')
      .limit(1000);

    const { data: fitmentPartIds } = await supabaseServiceRole
      .from('part_fitments')
      .select('part_id')
      .limit(10000);

    const fitmentSet = new Set((fitmentPartIds || []).map((f) => f.part_id));
    const partsWithoutFitments = (allParts || []).filter((p) => !fitmentSet.has(p.id));

    return partsWithoutFitments.slice(0, limit);
  }

  return data || [];
}

/**
 * Get parts pending review (flagged)
 * @param {Object} [options] - Options
 * @param {number} [options.limit] - Max results
 * @returns {Promise<Array>}
 */
export async function getPartsPendingReview(options = {}) {
  const { limit = 50 } = options;

  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabaseServiceRole
    .from('parts')
    .select('id, name, part_number, brand_name, attributes')
    .filter('attributes->_flagged', 'eq', true)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[PartsQuality] Pending review query error:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Flag a part for review
 * @param {string} partId - Part ID
 * @param {string} reason - Flag reason
 * @returns {Promise<void>}
 */
export async function flagForReview(partId, reason) {
  if (!isSupabaseConfigured) return;

  const { error } = await supabaseServiceRole.rpc('flag_part_for_review', {
    p_part_id: partId,
    p_reason: reason,
  });

  if (error) {
    // Fallback: update attributes directly
    const { data: part } = await supabaseServiceRole
      .from('parts')
      .select('attributes')
      .eq('id', partId)
      .single();

    const attributes = part?.attributes || {};
    attributes._flagged = true;
    attributes._flagReason = reason;
    attributes._flaggedAt = new Date().toISOString();

    await supabaseServiceRole.from('parts').update({ attributes }).eq('id', partId);
  }
}

/**
 * Clear review flag from a part
 * @param {string} partId - Part ID
 * @returns {Promise<void>}
 */
export async function clearReviewFlag(partId) {
  if (!isSupabaseConfigured) return;

  const { data: part } = await supabaseServiceRole
    .from('parts')
    .select('attributes')
    .eq('id', partId)
    .single();

  if (part?.attributes) {
    const { _flagged, _flagReason, _flaggedAt, ...rest } = part.attributes;
    await supabaseServiceRole.from('parts').update({ attributes: rest }).eq('id', partId);
  }
}

// ============================================================================
// QUALITY SUMMARY
// ============================================================================

/**
 * Get overall quality summary for the parts database
 * @returns {Promise<Object>}
 */
export async function getQualitySummary() {
  if (!isSupabaseConfigured) return null;

  const [
    totalPartsResult,
    totalFitmentsResult,
    lowConfidenceFitments,
    partsMissingData,
    partsWithoutFitments,
    pendingReview,
  ] = await Promise.all([
    supabaseServiceRole.from('parts').select('id', { count: 'exact', head: true }),
    supabaseServiceRole.from('part_fitments').select('id', { count: 'exact', head: true }),
    getPartsWithLowConfidenceFitments({ limit: 1000 }),
    getPartsMissingData({ limit: 1000 }),
    getPartsWithoutFitments({ limit: 1000 }),
    getPartsPendingReview({ limit: 1000 }),
  ]);

  const totalParts = totalPartsResult.count || 0;
  const totalFitments = totalFitmentsResult.count || 0;

  return {
    totalParts,
    totalFitments,
    averageFitmentsPerPart: totalParts > 0 ? (totalFitments / totalParts).toFixed(2) : 0,
    issues: {
      lowConfidenceFitments: lowConfidenceFitments.length,
      partsMissingData: partsMissingData.length,
      partsWithoutFitments: partsWithoutFitments.length,
      pendingReview: pendingReview.length,
    },
    healthScore: calculateHealthScore({
      totalParts,
      totalFitments,
      lowConfidence: lowConfidenceFitments.length,
      missingData: partsMissingData.length,
      noFitments: partsWithoutFitments.length,
      flagged: pendingReview.length,
    }),
  };
}

/**
 * Calculate overall health score
 * @param {Object} stats - Stats object
 * @returns {number} - Score 0-100
 */
function calculateHealthScore(stats) {
  const { totalParts, totalFitments, lowConfidence, missingData, noFitments, flagged } = stats;

  if (totalParts === 0) return 0;

  // Start with 100
  let score = 100;

  // Deduct for low confidence fitments (up to 20 points)
  const lowConfidenceRatio = lowConfidence / Math.max(totalFitments, 1);
  score -= Math.min(20, lowConfidenceRatio * 100);

  // Deduct for missing data (up to 20 points)
  const missingDataRatio = missingData / totalParts;
  score -= Math.min(20, missingDataRatio * 100);

  // Deduct for parts without fitments (up to 30 points)
  const noFitmentsRatio = noFitments / totalParts;
  score -= Math.min(30, noFitmentsRatio * 100);

  // Deduct for flagged parts (up to 10 points)
  const flaggedRatio = flagged / totalParts;
  score -= Math.min(10, flaggedRatio * 100);

  // Bonus for good fitment coverage
  if (totalFitments / totalParts > 2) {
    score += 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ============================================================================
// EXPORTS
// ============================================================================

const partsQualityService = {
  // Thresholds
  QUALITY_THRESHOLDS,
  // Validation
  validatePart,
  validateFitment,
  validatePrice,
  // Duplicates
  findDuplicates,
  getDuplicateStats,
  // Queries
  getPartsWithLowConfidenceFitments,
  getPartsMissingData,
  getPartsWithoutFitments,
  getPartsPendingReview,
  // Flagging
  flagForReview,
  clearReviewFlag,
  // Summary
  getQualitySummary,
};

export default partsQualityService;
