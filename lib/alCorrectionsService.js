/**
 * AL Corrections Service
 *
 * Provides access to the al_corrections table for preventing
 * outdated or inaccurate information in AL responses.
 *
 * Usage:
 *   import { getActiveCorrections, getMythCorrections } from '@/lib/alCorrectionsService';
 *
 *   const myths = await getMythCorrections();
 *   const yearSpecific = await getYearSpecificCorrections('mustang', '1997');
 */

import { createClient } from '@supabase/supabase-js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CORRECTION_TYPES = {
  myth: 'myth',
  yearSpecific: 'year_specific',
  brandInfo: 'brand_info',
  maintenance: 'maintenance',
  general: 'general',
};

const SEVERITY_LEVELS = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
};

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Get all active corrections
 *
 * @returns {Promise<Array>}
 */
export async function getActiveCorrections() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('al_corrections')
      .select('*')
      .eq('is_active', true)
      .order('severity', { ascending: false });

    if (error) {
      console.error('[AL Corrections] Error fetching corrections:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[AL Corrections] Exception:', err);
    return [];
  }
}

/**
 * Get myth corrections (for prompt injection)
 *
 * @returns {Promise<Array>}
 */
export async function getMythCorrections() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('al_corrections')
      .select('topic, incorrect_claim, correct_info, severity')
      .eq('correction_type', CORRECTION_TYPES.myth)
      .eq('is_active', true)
      .order('severity', { ascending: false });

    if (error) {
      console.error('[AL Corrections] Error fetching myths:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[AL Corrections] Exception:', err);
    return [];
  }
}

/**
 * Get year-specific corrections for a car
 *
 * @param {string} model - Model name (e.g., 'mustang', 'boxster')
 * @param {string|number} year - Model year
 * @returns {Promise<Array>}
 */
export async function getYearSpecificCorrections(model, year) {
  try {
    const supabase = getSupabaseClient();
    const yearNum = parseInt(year, 10);

    const { data, error } = await supabase
      .from('al_corrections')
      .select('*')
      .eq('correction_type', CORRECTION_TYPES.yearSpecific)
      .eq('is_active', true)
      .ilike('topic', `%${model}%`);

    if (error) {
      console.error('[AL Corrections] Error fetching year-specific:', error);
      return [];
    }

    // Filter by year range
    const filtered = (data || []).filter((correction) => {
      if (!correction.applies_to_years) return true;

      // Parse year range like "1996-1998" or "2009-2012"
      const [startYear, endYear] = correction.applies_to_years.split('-').map(Number);
      return yearNum >= startYear && yearNum <= endYear;
    });

    return filtered;
  } catch (err) {
    console.error('[AL Corrections] Exception:', err);
    return [];
  }
}

/**
 * Get critical corrections (high and critical severity)
 *
 * @returns {Promise<Array>}
 */
export async function getCriticalCorrections() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('al_corrections')
      .select('*')
      .eq('is_active', true)
      .in('severity', [SEVERITY_LEVELS.high, SEVERITY_LEVELS.critical])
      .order('severity', { ascending: false });

    if (error) {
      console.error('[AL Corrections] Error fetching critical:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('[AL Corrections] Exception:', err);
    return [];
  }
}

/**
 * Format corrections for prompt injection
 *
 * @param {Array} corrections - Array of correction objects
 * @returns {string} - Formatted text for prompt
 */
export function formatCorrectionsForPrompt(corrections) {
  if (!corrections || corrections.length === 0) return '';

  const lines = corrections.map((c) => {
    return `| **${c.incorrect_claim}** | ${c.correct_info} |`;
  });

  return `## Known Corrections (DO NOT propagate these myths)

| Myth/Incorrect Claim | Correct Information |
|---------------------|---------------------|
${lines.join('\n')}`;
}

/**
 * Add a new correction
 *
 * @param {Object} correction - Correction data
 * @returns {Promise<{success: boolean, id?: string, error?: string}>}
 */
export async function addCorrection(correction) {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('al_corrections')
      .insert({
        correction_type: correction.type,
        topic: correction.topic,
        incorrect_claim: correction.incorrectClaim,
        correct_info: correction.correctInfo,
        applies_to_years: correction.yearsAffected || null,
        applies_to_makes: correction.makes || null,
        applies_to_models: correction.models || null,
        source_url: correction.sourceUrl || null,
        source_description: correction.sourceDescription || null,
        severity: correction.severity || 'medium',
        created_by: correction.createdBy || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[AL Corrections] Error adding correction:', error);
      return { success: false, error: error.message };
    }

    console.log(`[AL Corrections] Added correction: ${correction.topic}`);
    return { success: true, id: data.id };
  } catch (err) {
    console.error('[AL Corrections] Exception adding:', err);
    return { success: false, error: err.message };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export const TYPES = CORRECTION_TYPES;
export const SEVERITY = SEVERITY_LEVELS;

const alCorrectionsService = {
  getActiveCorrections,
  getMythCorrections,
  getYearSpecificCorrections,
  getCriticalCorrections,
  formatCorrectionsForPrompt,
  addCorrection,
  TYPES: CORRECTION_TYPES,
  SEVERITY: SEVERITY_LEVELS,
};

export default alCorrectionsService;
