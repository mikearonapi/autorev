/**
 * Admin Authentication Utilities
 * 
 * Consolidates admin auth check logic used across internal API routes:
 * - app/api/internal/parts/fitments/route.js
 * - app/api/internal/car-variants/route.js
 * - app/api/internal/maintenance/variant-overrides/route.js
 * - app/api/internal/dyno/runs/route.js
 * - app/api/internal/track/lap-times/route.js
 * - app/api/internal/knowledge/ingest/route.js
 * 
 * @module lib/adminAuth
 */

const INTERNAL_ADMIN_KEY = process.env.INTERNAL_ADMIN_KEY;

/**
 * Verify admin authorization from request headers.
 * Checks x-internal-admin-key header against INTERNAL_ADMIN_KEY env var.
 * 
 * @param {Request} request - Next.js request object
 * @returns {{ ok: boolean, error?: string }}
 */
export function requireAdmin(request) {
  if (!INTERNAL_ADMIN_KEY) {
    return { ok: false, error: 'INTERNAL_ADMIN_KEY not configured' };
  }
  
  const provided = request.headers.get('x-internal-admin-key');
  if (!provided || provided !== INTERNAL_ADMIN_KEY) {
    return { ok: false, error: 'Unauthorized' };
  }
  
  return { ok: true };
}

/**
 * Get appropriate HTTP status code for auth error.
 * @param {{ ok: boolean, error?: string }} authResult
 * @returns {number}
 */
export function getAuthErrorStatus(authResult) {
  if (authResult.ok) return 200;
  if (authResult.error === 'Unauthorized') return 401;
  return 500;
}

/**
 * Check if admin auth is configured.
 * @returns {boolean}
 */
export function isAdminAuthConfigured() {
  return Boolean(INTERNAL_ADMIN_KEY);
}

export default {
  requireAdmin,
  getAuthErrorStatus,
  isAdminAuthConfigured,
};

