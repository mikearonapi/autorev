/**
 * Admin Users helpers (used by /api/admin/users).
 *
 * Goal: keep admin user listing resilient if `user_profiles` rows are missing,
 * and avoid repeated per-user admin API calls where possible.
 */

/**
 * @typedef {Object} AuthAdminUser
 * @property {string} id
 * @property {Record<string, unknown>=} user_metadata
 * @property {Record<string, unknown>=} raw_user_meta_data
 */

/**
 * Build a minimal `user_profiles` insert row from an auth user.
 *
 * @param {AuthAdminUser} authUser
 * @returns {{ id: string, display_name: string|null, avatar_url: string|null }}
 */
export function buildUserProfileRowFromAuthUser(authUser) {
  const meta =
    (authUser && typeof authUser.user_metadata === 'object' && authUser.user_metadata) ||
    (authUser && typeof authUser.raw_user_meta_data === 'object' && authUser.raw_user_meta_data) ||
    {};

  const displayName =
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta.name === 'string' && meta.name.trim()) ||
    null;

  const avatarUrl = (typeof meta.avatar_url === 'string' && meta.avatar_url.trim()) || null;

  return {
    id: authUser.id,
    display_name: displayName,
    avatar_url: avatarUrl,
  };
}

/**
 * Compute missing `user_profiles` rows we should insert, based on auth users.
 *
 * @param {AuthAdminUser[]} authUsers
 * @param {Set<string>} existingProfileIds
 * @returns {{ id: string, display_name: string|null, avatar_url: string|null }[]}
 */
export function computeMissingUserProfileRows(authUsers, existingProfileIds) {
  const rows = [];
  for (const u of authUsers) {
    if (!u?.id) continue;
    if (existingProfileIds.has(u.id)) continue;
    rows.push(buildUserProfileRowFromAuthUser(u));
  }
  return rows;
}

/**
 * Build pagination metadata.
 *
 * @param {{ page: number, limit: number, total: number }} args
 * @returns {{ page: number, limit: number, total: number, totalPages: number, offset: number }}
 */
export function buildPagination({ page, limit, total }) {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 25;
  const safeTotal = Number.isFinite(total) && total >= 0 ? Math.floor(total) : 0;
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeLimit));
  const safePage = Math.min(Math.max(1, Number.isFinite(page) ? Math.floor(page) : 1), totalPages);
  const offset = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, total: safeTotal, totalPages, offset };
}

/**
 * Create a synthetic "profile-like" object for an auth user when `user_profiles` row is missing.
 * This keeps admin UI resilient and avoids dropping users from the table.
 *
 * @param {AuthAdminUser & { created_at?: string|null }} authUser
 * @returns {Record<string, any>}
 */
export function buildSyntheticProfileFromAuthUser(authUser) {
  return {
    id: authUser.id,
    display_name: null,
    preferred_units: null,
    subscription_tier: 'free',
    referral_tier_granted: null,
    referral_tier_expires_at: null,
    referral_tier_lifetime: false,
    referred_by_code: null,
    cars_viewed_count: 0,
    comparisons_made_count: 0,
    projects_saved_count: 0,
    created_at: authUser.created_at || null,
    updated_at: null,
  };
}

/**
 * Given an auth-user page and a map of profiles, produce an array of profiles in auth order.
 *
 * @param {(AuthAdminUser & { created_at?: string|null })[]} authUsers
 * @param {Map<string, any>} profileById
 * @returns {any[]}
 */
export function buildProfilesForAuthUsers(authUsers, profileById) {
  const out = [];
  for (const u of authUsers) {
    if (!u?.id) continue;
    out.push(profileById.get(u.id) || buildSyntheticProfileFromAuthUser(u));
  }
  return out;
}


