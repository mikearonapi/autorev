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


