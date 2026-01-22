/**
 * Centralized Data Validation Layer
 * 
 * Provides consistent validation for all data pipelines to ensure
 * proper foreign key relationships and data integrity.
 * 
 * Use this module in all ingestion scripts to validate references
 * before inserting data.
 * 
 * @module lib/dataValidation
 */

import { resolveCarId, resolveCarIds } from './carResolver';
import { supabase, isSupabaseConfigured } from './supabase';

// =============================================================================
// CUSTOM ERROR CLASS
// =============================================================================

/**
 * Custom error for data validation failures
 */
export class DataValidationError extends Error {
  constructor(message, { field, value, table, suggestion } = {}) {
    super(message);
    this.name = 'DataValidationError';
    this.field = field;
    this.value = value;
    this.table = table;
    this.suggestion = suggestion;
  }
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate and resolve a car reference (slug → id)
 * Throws DataValidationError if car doesn't exist
 * 
 * @param {string} carSlug - The car slug to validate
 * @param {Object} options - Options
 * @param {boolean} options.throwOnNotFound - Whether to throw on not found (default: true)
 * @returns {Promise<string|null>} The car_id or null if not found and throwOnNotFound is false
 * @throws {DataValidationError} If car not found and throwOnNotFound is true
 */
export async function validateCarReference(carSlug, { throwOnNotFound = true } = {}) {
  if (!carSlug) {
    if (throwOnNotFound) {
      throw new DataValidationError('Car slug is required', {
        field: 'car_slug',
        value: carSlug,
        table: 'cars',
      });
    }
    return null;
  }

  const carId = await resolveCarId(carSlug);

  if (!carId && throwOnNotFound) {
    throw new DataValidationError(`Car not found: ${carSlug}`, {
      field: 'car_slug',
      value: carSlug,
      table: 'cars',
      suggestion: 'Check car slug spelling or add the car to the database first',
    });
  }

  return carId;
}

/**
 * Validate multiple car references in batch
 * 
 * @param {string[]} carSlugs - Array of car slugs to validate
 * @param {Object} options - Options
 * @param {boolean} options.throwOnNotFound - Whether to throw if ANY slug not found (default: false)
 * @returns {Promise<{valid: Map<string, string>, invalid: string[]}>} Maps of valid (slug→id) and invalid slugs
 */
export async function validateCarReferences(carSlugs, { throwOnNotFound = false } = {}) {
  if (!carSlugs || carSlugs.length === 0) {
    return { valid: new Map(), invalid: [] };
  }

  const slugToIdMap = await resolveCarIds(carSlugs);
  const valid = slugToIdMap;
  const invalid = carSlugs.filter(slug => !slugToIdMap.has(slug));

  if (throwOnNotFound && invalid.length > 0) {
    throw new DataValidationError(`${invalid.length} car(s) not found: ${invalid.slice(0, 5).join(', ')}...`, {
      field: 'car_slug',
      value: invalid,
      table: 'cars',
    });
  }

  return { valid, invalid };
}

/**
 * Validate a track reference (track_id exists)
 * 
 * @param {string} trackId - The track UUID to validate
 * @param {Object} options - Options
 * @param {boolean} options.throwOnNotFound - Whether to throw on not found (default: true)
 * @returns {Promise<boolean>} True if valid
 * @throws {DataValidationError} If track not found
 */
export async function validateTrackReference(trackId, { throwOnNotFound = true } = {}) {
  if (!trackId) {
    if (throwOnNotFound) {
      throw new DataValidationError('Track ID is required', {
        field: 'track_id',
        value: trackId,
        table: 'tracks',
      });
    }
    return false;
  }

  if (!isSupabaseConfigured || !supabase) {
    console.warn('[dataValidation] Supabase not configured, skipping track validation');
    return true; // Assume valid if we can't check
  }

  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('id')
      .eq('id', trackId)
      .single();

    if (error || !data) {
      if (throwOnNotFound) {
        throw new DataValidationError(`Track not found: ${trackId}`, {
          field: 'track_id',
          value: trackId,
          table: 'tracks',
          suggestion: 'Verify track exists in tracks table or add it first',
        });
      }
      return false;
    }

    return true;
  } catch (err) {
    if (err instanceof DataValidationError) throw err;
    console.error('[dataValidation] Error validating track:', err);
    return !throwOnNotFound;
  }
}

/**
 * Validate a track by slug and return its ID
 * 
 * @param {string} trackSlug - The track slug to validate
 * @param {Object} options - Options
 * @param {boolean} options.throwOnNotFound - Whether to throw on not found (default: true)
 * @returns {Promise<string|null>} The track_id or null
 */
export async function validateTrackBySlug(trackSlug, { throwOnNotFound = true } = {}) {
  if (!trackSlug) {
    if (throwOnNotFound) {
      throw new DataValidationError('Track slug is required', {
        field: 'track_slug',
        value: trackSlug,
        table: 'tracks',
      });
    }
    return null;
  }

  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('id')
      .eq('slug', trackSlug)
      .single();

    if (error || !data) {
      if (throwOnNotFound) {
        throw new DataValidationError(`Track not found: ${trackSlug}`, {
          field: 'track_slug',
          value: trackSlug,
          table: 'tracks',
          suggestion: 'Check track slug or add the track first',
        });
      }
      return null;
    }

    return data.id;
  } catch (err) {
    if (err instanceof DataValidationError) throw err;
    console.error('[dataValidation] Error validating track by slug:', err);
    return null;
  }
}

/**
 * Validate a part reference (part_id exists and is active)
 * 
 * @param {string} partId - The part UUID to validate
 * @param {Object} options - Options
 * @param {boolean} options.requireActive - Require part to be active (default: true)
 * @param {boolean} options.throwOnNotFound - Whether to throw on not found (default: true)
 * @returns {Promise<boolean>} True if valid
 */
export async function validatePartReference(partId, { requireActive = true, throwOnNotFound = true } = {}) {
  if (!partId) {
    if (throwOnNotFound) {
      throw new DataValidationError('Part ID is required', {
        field: 'part_id',
        value: partId,
        table: 'parts',
      });
    }
    return false;
  }

  if (!isSupabaseConfigured || !supabase) {
    return true;
  }

  try {
    let query = supabase
      .from('parts')
      .select('id, is_active')
      .eq('id', partId);

    if (requireActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      if (throwOnNotFound) {
        throw new DataValidationError(`Part not found or inactive: ${partId}`, {
          field: 'part_id',
          value: partId,
          table: 'parts',
        });
      }
      return false;
    }

    return true;
  } catch (err) {
    if (err instanceof DataValidationError) throw err;
    console.error('[dataValidation] Error validating part:', err);
    return !throwOnNotFound;
  }
}

// =============================================================================
// VALIDATION WRAPPERS
// =============================================================================

/**
 * Create a validated insert function wrapper
 * Runs pre-insert validation based on field configuration
 * 
 * @param {Function} insertFn - The insert function to wrap
 * @param {Object} fieldConfig - Configuration for which fields to validate
 * @returns {Function} Wrapped function that validates before inserting
 * 
 * @example
 * const validatedInsert = withValidation(
 *   (data) => supabase.from('car_track_lap_times').insert(data),
 *   { carSlug: 'car_slug', trackId: 'track_id' }
 * );
 * await validatedInsert({ car_slug: 'bmw-m3-e46', track_id: 'uuid-here', lap_time_ms: 90000 });
 */
export function withValidation(insertFn, fieldConfig = {}) {
  return async (data) => {
    const validatedData = { ...data };
    const errors = [];

    // Validate car reference
    if (fieldConfig.carSlug && data[fieldConfig.carSlug]) {
      try {
        const carId = await validateCarReference(data[fieldConfig.carSlug]);
        validatedData.car_id = carId;
      } catch (err) {
        errors.push(err);
      }
    }

    // Validate track reference
    if (fieldConfig.trackId && data[fieldConfig.trackId]) {
      try {
        await validateTrackReference(data[fieldConfig.trackId]);
      } catch (err) {
        errors.push(err);
      }
    }

    // Validate track by slug
    if (fieldConfig.trackSlug && data[fieldConfig.trackSlug]) {
      try {
        const trackId = await validateTrackBySlug(data[fieldConfig.trackSlug]);
        if (trackId) validatedData.track_id = trackId;
      } catch (err) {
        errors.push(err);
      }
    }

    // Validate part reference
    if (fieldConfig.partId && data[fieldConfig.partId]) {
      try {
        await validatePartReference(data[fieldConfig.partId]);
      } catch (err) {
        errors.push(err);
      }
    }

    // If any validation errors, throw with aggregate info
    if (errors.length > 0) {
      const combined = new DataValidationError(
        `Validation failed: ${errors.map(e => e.message).join('; ')}`,
        { field: 'multiple', value: data }
      );
      combined.errors = errors;
      throw combined;
    }

    // Run the actual insert
    return insertFn(validatedData);
  };
}

/**
 * Batch validation helper - validates multiple records and returns valid/invalid splits
 * 
 * @param {Array} records - Array of records to validate
 * @param {Object} fieldConfig - Field configuration (same as withValidation)
 * @returns {Promise<{valid: Array, invalid: Array}>} Split arrays
 */
export async function batchValidate(records, fieldConfig = {}) {
  const valid = [];
  const invalid = [];

  // Extract all car slugs for batch resolution
  if (fieldConfig.carSlug) {
    const slugs = [...new Set(records.map(r => r[fieldConfig.carSlug]).filter(Boolean))];
    const { valid: validSlugs, invalid: invalidSlugs } = await validateCarReferences(slugs);

    for (const record of records) {
      const slug = record[fieldConfig.carSlug];
      if (slug && !validSlugs.has(slug)) {
        invalid.push({ record, reason: `Car not found: ${slug}` });
      } else {
        valid.push({
          ...record,
          car_id: slug ? validSlugs.get(slug) : null,
        });
      }
    }
  } else {
    valid.push(...records);
  }

  return { valid, invalid };
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Create a standardized validation report
 * 
 * @param {Object} results - Validation results
 * @returns {Object} Formatted report
 */
export function createValidationReport(results) {
  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalRecords: results.total || 0,
      validRecords: results.valid?.length || 0,
      invalidRecords: results.invalid?.length || 0,
      successRate: results.total 
        ? ((results.valid?.length || 0) / results.total * 100).toFixed(2) + '%'
        : '0%',
    },
    errors: results.invalid?.slice(0, 10) || [], // First 10 errors
    ...(results.invalid?.length > 10 && {
      truncatedErrors: results.invalid.length - 10,
    }),
  };
}

/**
 * Log validation results in a standardized format
 * 
 * @param {string} pipelineName - Name of the pipeline
 * @param {Object} results - Validation results
 */
export function logValidationResults(pipelineName, results) {
  const report = createValidationReport(results);
  console.log(`\n[${pipelineName}] Validation Report:`);
  console.log(`  Total: ${report.summary.totalRecords}`);
  console.log(`  Valid: ${report.summary.validRecords}`);
  console.log(`  Invalid: ${report.summary.invalidRecords}`);
  console.log(`  Success Rate: ${report.summary.successRate}`);
  
  if (report.errors.length > 0) {
    console.log(`\n  Sample Errors:`);
    report.errors.slice(0, 5).forEach((err, i) => {
      console.log(`    ${i + 1}. ${err.reason || err.message || JSON.stringify(err)}`);
    });
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

const dataValidation = {
  // Error class
  DataValidationError,
  
  // Validation functions
  validateCarReference,
  validateCarReferences,
  validateTrackReference,
  validateTrackBySlug,
  validatePartReference,
  
  // Wrappers
  withValidation,
  batchValidate,
  
  // Utilities
  createValidationReport,
  logValidationResults,
};

export default dataValidation;
