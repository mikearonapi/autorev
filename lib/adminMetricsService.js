/**
 * Admin metrics helpers.
 *
 * Goal: provide a single source of truth for key admin metrics so
 * different dashboards don't drift due to differing query logic.
 *
 * NOTE: We intentionally use `{ count: 'exact', head: true }` for accuracy.
 * Using `data.length` can be wrong if PostgREST applies row caps.
 */

/**
 * @typedef {{ message?: string } | null} SupabaseError
 */

/**
 * @param {{ from: (table: string) => any }} supabase
 * @returns {Promise<number>}
 */
export async function getTotalUsersCount(supabase) {
  const { count, error } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true });

  if (error) {
    const msg = /** @type {SupabaseError} */ (error)?.message || 'Unknown error';
    throw new Error(`Failed to count users: ${msg}`);
  }

  return typeof count === 'number' ? count : 0;
}

/**
 * Returns a breakdown of users by tier based on `user_profiles.subscription_tier`.
 *
 * `subscription_tier` can be null for older rows; those are treated as `free`.
 *
 * @param {{ from: (table: string) => any }} supabase
 * @returns {Promise<{ free: number, collector: number, tuner: number, admin: number }>}
 */
export async function getUserTierBreakdown(supabase) {
  const countTier = async (tier) => {
    const { count, error } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('subscription_tier', tier);

    if (error) {
      const msg = /** @type {SupabaseError} */ (error)?.message || 'Unknown error';
      throw new Error(`Failed to count tier "${tier}": ${msg}`);
    }

    return typeof count === 'number' ? count : 0;
  };

  const countNullTier = async () => {
    const { count, error } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .is('subscription_tier', null);

    if (error) {
      const msg = /** @type {SupabaseError} */ (error)?.message || 'Unknown error';
      throw new Error(`Failed to count null tiers: ${msg}`);
    }

    return typeof count === 'number' ? count : 0;
  };

  const [freeCount, nullCount, collector, tuner, admin] = await Promise.all([
    countTier('free'),
    countNullTier(),
    countTier('collector'),
    countTier('tuner'),
    countTier('admin'),
  ]);

  return {
    free: freeCount + nullCount,
    collector,
    tuner,
    admin,
  };
}










