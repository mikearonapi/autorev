/**
 * Error Analysis Utilities
 * 
 * Provides functions for analyzing application errors, detecting regressions,
 * and managing error fix status.
 * 
 * Usage:
 *   import { getUnresolvedErrors, markErrorsFixed, getRegressionErrors } from '@/lib/errorAnalysis';
 *   
 *   // Get all unresolved errors
 *   const errors = await getUnresolvedErrors();
 *   
 *   // Mark errors as fixed
 *   await markErrorsFixed(['-19a1e347', '16097c6f'], 'v1.2.3', 'Fixed in PR #123');
 */

import { createClient } from '@supabase/supabase-js';

// Use service role for error analysis (admin operations)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Severity priority for sorting
 */
const _SEVERITY_PRIORITY = {
  blocking: 1,
  major: 2,
  minor: 3,
  unknown: 4,
};

/**
 * Get all unresolved errors from the database
 * These are errors that have NOT been marked as fixed or resolved
 * 
 * @param {Object} options
 * @param {number} options.limit - Max results (default 50)
 * @param {number} options.daysBack - Look back period in days (default 7)
 * @param {string} options.severity - Filter by severity ('blocking', 'major', 'minor')
 * @param {string} options.featureContext - Filter by feature context
 * @returns {Promise<Array>} List of unresolved errors
 */
export async function getUnresolvedErrors({
  limit = 50,
  daysBack = 7,
  severity = null,
  featureContext = null,
} = {}) {
  const ERROR_COLS = 'id, fingerprint, message, stack, severity, feature_context, occurrence_count, first_seen, last_seen, status, resolved_at, resolution_notes, created_at';
  
  let query = supabaseAdmin
    .from('v_unresolved_errors')
    .select(ERROR_COLS)
    .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString())
    .limit(limit);

  if (severity) {
    query = query.eq('severity', severity);
  }

  if (featureContext) {
    query = query.eq('feature_context', featureContext);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[ErrorAnalysis] Failed to get unresolved errors:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get regression errors - errors that were fixed but have come back
 * 
 * @param {Object} options
 * @param {number} options.limit - Max results (default 20)
 * @returns {Promise<Array>} List of regression errors
 */
export async function getRegressionErrors({ limit = 20 } = {}) {
  const REGRESSION_COLS = 'id, fingerprint, message, severity, feature_context, previous_resolution, regressed_at, occurrence_count, created_at';
  
  const { data, error } = await supabaseAdmin
    .from('v_regression_errors')
    .select(REGRESSION_COLS)
    .limit(limit);

  if (error) {
    console.error('[ErrorAnalysis] Failed to get regression errors:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get error summary statistics grouped by error hash
 * Useful for seeing overall error landscape
 * 
 * @param {Object} options
 * @param {boolean} options.unresolvedOnly - Only show errors with unresolved instances
 * @param {boolean} options.withRegressions - Only show errors that have regressed
 * @returns {Promise<Array>} Error summary statistics
 */
export async function getErrorSummary({
  unresolvedOnly = false,
  withRegressions = false,
} = {}) {
  const SUMMARY_COLS = 'fingerprint, message, severity, feature_context, total_occurrences, first_seen, last_seen, has_unresolved, has_regression, status';
  
  let query = supabaseAdmin
    .from('v_error_summary')
    .select(SUMMARY_COLS)
    .order('last_seen', { ascending: false });

  if (unresolvedOnly) {
    query = query.eq('has_unresolved', true);
  }

  if (withRegressions) {
    query = query.eq('has_regression', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[ErrorAnalysis] Failed to get error summary:', error);
    throw error;
  }

  return data || [];
}

/**
 * Mark errors as fixed by their error hash(es)
 * This updates all instances of the error with the given hash
 * 
 * @param {string|string[]} errorHashes - Error hash(es) to mark as fixed
 * @param {string} version - Version/commit where the fix was applied
 * @param {string} notes - Notes about the fix
 * @returns {Promise<Object>} Result with count of updated records
 */
export async function markErrorsFixed(errorHashes, version = null, notes = null) {
  const hashes = Array.isArray(errorHashes) ? errorHashes : [errorHashes];
  const results = { total: 0, byHash: {} };

  for (const hash of hashes) {
    const { data, error } = await supabaseAdmin.rpc('mark_error_fixed', {
      p_error_hash: hash,
      p_fixed_in_version: version,
      p_fix_notes: notes,
    });

    if (error) {
      console.error(`[ErrorAnalysis] Failed to mark error ${hash} as fixed:`, error);
      results.byHash[hash] = { error: error.message };
    } else {
      results.byHash[hash] = { updated: data };
      results.total += data;
    }
  }

  return results;
}

/**
 * Get a quick analysis report of error status
 * Designed to be called for quick "how are we doing?" checks
 * 
 * @returns {Promise<Object>} Analysis report
 */
export async function getErrorAnalysisReport() {
  const [unresolved, regressions, summary] = await Promise.all([
    getUnresolvedErrors({ limit: 100 }),
    getRegressionErrors({ limit: 50 }),
    getErrorSummary({ unresolvedOnly: true }),
  ]);

  // Group unresolved by severity
  const bySeverity = {
    blocking: unresolved.filter(e => e.severity === 'blocking'),
    major: unresolved.filter(e => e.severity === 'major'),
    minor: unresolved.filter(e => e.severity === 'minor'),
  };

  // Group by feature context
  const byFeature = {};
  unresolved.forEach(e => {
    const ctx = e.feature_context || 'unknown';
    if (!byFeature[ctx]) byFeature[ctx] = [];
    byFeature[ctx].push(e);
  });

  // Deduplicate by error_hash for unique error count
  const uniqueErrorHashes = [...new Set(unresolved.map(e => e.error_hash).filter(Boolean))];

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalUnresolvedRecords: unresolved.length,
      uniqueUnresolvedErrors: uniqueErrorHashes.length,
      totalRegressions: regressions.length,
      byLevel: {
        blocking: bySeverity.blocking.length,
        major: bySeverity.major.length,
        minor: bySeverity.minor.length,
      },
    },
    blocking: bySeverity.blocking.map(simplifyError),
    major: bySeverity.major.map(simplifyError),
    minor: bySeverity.minor.slice(0, 10).map(simplifyError), // Limit minor errors
    regressions: regressions.slice(0, 10).map(e => ({
      errorHash: e.error_hash,
      message: truncate(e.message, 100),
      feature: e.feature_context,
      recurred: e.recurred_at,
      originallyFixed: e.originally_fixed_at,
    })),
    byFeature: Object.entries(byFeature)
      .map(([feature, errors]) => ({
        feature,
        count: errors.length,
        severities: {
          blocking: errors.filter(e => e.severity === 'blocking').length,
          major: errors.filter(e => e.severity === 'major').length,
          minor: errors.filter(e => e.severity === 'minor').length,
        },
      }))
      .sort((a, b) => b.count - a.count),
  };
}

/**
 * Simplify an error record for reporting
 */
function simplifyError(error) {
  return {
    errorHash: error.error_hash,
    message: truncate(error.message, 100),
    severity: error.severity,
    feature: error.feature_context,
    page: error.page_url,
    firstSeen: error.created_at,
    occurrences: error.occurrence_count || 1,
    isRegression: error.is_regression,
  };
}

/**
 * Truncate string to max length
 */
function truncate(str, maxLen) {
  if (!str) return str;
  return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

/**
 * Export for convenience
 */
const errorAnalysis = {
  getUnresolvedErrors,
  getRegressionErrors,
  getErrorSummary,
  markErrorsFixed,
  getErrorAnalysisReport,
};

export default errorAnalysis;

