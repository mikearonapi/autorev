/**
 * Centralized Query Key Factory
 *
 * Provides type-safe, consistent query keys for TanStack Query.
 * Using a centralized factory ensures:
 * - No duplicate or mismatched keys
 * - Easy cache invalidation
 * - Consistent patterns across the app
 *
 * Pattern: Each domain gets a factory with hierarchical keys.
 *
 * @example
 * // In a hook
 * import { carKeys } from '@/lib/queryKeys';
 *
 * const { data } = useQuery({
 *   queryKey: carKeys.bySlug(slug),
 *   queryFn: () => fetchCar(slug),
 * });
 *
 * // Invalidate all car queries
 * queryClient.invalidateQueries({ queryKey: carKeys.all });
 *
 * // Invalidate specific car
 * queryClient.invalidateQueries({ queryKey: carKeys.bySlug(slug) });
 *
 * @module lib/queryKeys
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */

// =============================================================================
// CAR QUERIES
// =============================================================================

export const carKeys = {
  /** All car-related queries */
  all: ['cars'],

  /** List of all cars (browse page) */
  list: () => [...carKeys.all, 'list'],

  /** Single car by slug */
  bySlug: (slug) => [...carKeys.all, 'detail', slug],

  /** Enriched car data (includes tuning, consensus, etc.) */
  enriched: (slug) => [...carKeys.all, 'enriched', slug],

  /** Car dyno data */
  dyno: (slug) => [...carKeys.all, 'dyno', slug],

  /** Car issues and recalls */
  issues: (slug) => [...carKeys.all, 'issues', slug],

  /** Car maintenance schedule */
  maintenance: (slug) => [...carKeys.all, 'maintenance', slug],

  /** Car lap times */
  lapTimes: (slug) => [...carKeys.all, 'lapTimes', slug],

  /** Car pricing data */
  pricing: (slug) => [...carKeys.all, 'pricing', slug],

  /** Expert consensus for a car */
  consensus: (slug) => [...carKeys.all, 'consensus', slug],

  /** Community insights for a car */
  insights: (slug) => [...carKeys.all, 'insights', slug],

  /** Cars with expert reviews */
  expertReviewed: () => [...carKeys.all, 'expertReviewed'],
};

// =============================================================================
// USER QUERIES
// =============================================================================

export const userKeys = {
  /** All user-related queries */
  all: ['user'],

  /** Current authenticated user */
  current: () => [...userKeys.all, 'current'],

  /** User profile by ID */
  byId: (userId) => [...userKeys.all, 'profile', userId],

  /** User's garage (owned vehicles) */
  garage: (userId) => [...userKeys.all, 'garage', userId],

  /** User's vehicles list */
  vehicles: (userId) => [...userKeys.all, 'vehicles', userId],

  /** Specific vehicle */
  vehicle: (userId, vehicleId) => [...userKeys.all, 'vehicles', userId, vehicleId],

  /** User's saved events */
  savedEvents: (userId) => [...userKeys.all, 'savedEvents', userId],

  /** User's preferences */
  preferences: (userId) => [...userKeys.all, 'preferences', userId],

  /** User's subscription status */
  subscription: (userId) => [...userKeys.all, 'subscription', userId],

  /** User's AL credits */
  alCredits: (userId) => [...userKeys.all, 'alCredits', userId],

  /** User's dashboard data */
  dashboard: (userId) => [...userKeys.all, 'dashboard', userId],

  /** User's track times */
  trackTimes: (userId) => [...userKeys.all, 'trackTimes', userId],

  /** User's onboarding state */
  onboarding: (userId) => [...userKeys.all, 'onboarding', userId],
};

// =============================================================================
// EVENT QUERIES
// =============================================================================

export const eventKeys = {
  /** All event-related queries */
  all: ['events'],

  /** List of events with optional filters */
  list: (filters) => [...eventKeys.all, 'list', filters],

  /** Single event by slug */
  bySlug: (slug) => [...eventKeys.all, 'detail', slug],

  /** Featured events */
  featured: () => [...eventKeys.all, 'featured'],

  /** Event types (for filtering) */
  types: () => [...eventKeys.all, 'types'],

  /** User's saved events */
  saved: (userId) => [...eventKeys.all, 'saved', userId],
};

// =============================================================================
// COMMUNITY QUERIES
// =============================================================================

export const communityKeys = {
  /** All community-related queries */
  all: ['community'],

  /** Community builds list */
  builds: (filters) => [...communityKeys.all, 'builds', filters],

  /** Single community build */
  build: (slug) => [...communityKeys.all, 'builds', 'detail', slug],

  /** User's builds */
  userBuilds: (userId) => [...communityKeys.all, 'builds', 'user', userId],

  /** Community feed */
  feed: (userId) => [...communityKeys.all, 'feed', userId],
};

// =============================================================================
// AL (AI ASSISTANT) QUERIES
// =============================================================================

export const alKeys = {
  /** All AL-related queries */
  all: ['al'],

  /** AL conversations for a user */
  conversations: (userId) => [...alKeys.all, 'conversations', userId],

  /** Single conversation */
  conversation: (userId, conversationId) => [
    ...alKeys.all,
    'conversations',
    userId,
    conversationId,
  ],

  /** AL usage stats */
  stats: (userId) => [...alKeys.all, 'stats', userId],

  /** AL preferences */
  preferences: (userId) => [...alKeys.all, 'preferences', userId],
};

// =============================================================================
// PARTS QUERIES
// =============================================================================

export const partsKeys = {
  /** All parts-related queries */
  all: ['parts'],

  /** Search results */
  search: (query, filters) => [...partsKeys.all, 'search', query, filters],

  /** Popular parts for a car */
  popular: (carSlug) => [...partsKeys.all, 'popular', carSlug],

  /** Part relationships (requires, suggests, conflicts) */
  relationships: (partId) => [...partsKeys.all, 'relationships', partId],

  /** Turbo options for a car */
  turbos: (carSlug) => [...partsKeys.all, 'turbos', carSlug],
};

// =============================================================================
// ADMIN QUERIES
// =============================================================================

export const adminKeys = {
  /** All admin-related queries */
  all: ['admin'],

  /** Admin dashboard */
  dashboard: () => [...adminKeys.all, 'dashboard'],

  /** User management */
  users: (filters) => [...adminKeys.all, 'users', filters],

  /** Analytics data */
  analytics: (type, range) => [...adminKeys.all, 'analytics', type, range],

  /** System health */
  systemHealth: () => [...adminKeys.all, 'systemHealth'],

  /** Feedback management */
  feedback: (filters) => [...adminKeys.all, 'feedback', filters],
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a query key with automatic filtering of undefined values
 * Useful when some filter params are optional
 *
 * @param {Array} baseKey - The base query key array
 * @param {Object} filters - Filter object (undefined values are removed)
 * @returns {Array} Query key with serialized filters
 */
export function createFilteredKey(baseKey, filters) {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters || {}).filter(([, v]) => v !== undefined)
  );
  return [...baseKey, cleanFilters];
}

/**
 * Invalidate all queries for a specific domain
 * Helper for batch invalidation after mutations
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {Array} domainKey - The domain's base key (e.g., carKeys.all)
 */
export function invalidateDomain(queryClient, domainKey) {
  return queryClient.invalidateQueries({ queryKey: domainKey });
}

export default {
  carKeys,
  userKeys,
  eventKeys,
  communityKeys,
  alKeys,
  partsKeys,
  adminKeys,
  createFilteredKey,
  invalidateDomain,
};
