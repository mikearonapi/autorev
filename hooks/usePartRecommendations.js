'use client';

/**
 * React Query Hook for AL Part Recommendations
 *
 * Fetches AL-researched part recommendations for a car.
 * Used by PartsSelector to show top recommendations inline in each part tile.
 *
 * Returns recommendations grouped by upgrade type, with part details and pricing.
 *
 * @module hooks/usePartRecommendations
 */

import { useQuery } from '@tanstack/react-query';

import apiClient from '@/lib/apiClient';
import { partsKeys } from '@/lib/queryKeys';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Stale time for recommendations
 * Recommendations don't change frequently, so use a longer stale time
 */
const RECOMMENDATIONS_STALE_TIME = 10 * 60 * 1000; // 10 minutes

// =============================================================================
// FETCHER FUNCTION
// =============================================================================

/**
 * Fetch recommendations from API
 * @param {string} carSlug - Car slug
 * @param {string[]} [upgradeKeys] - Optional array of upgrade keys to filter by
 * @param {number} [limit] - Max recommendations per upgrade type
 */
async function fetchRecommendations(carSlug, upgradeKeys = null, limit = 3) {
  const params = new URLSearchParams();

  if (upgradeKeys && upgradeKeys.length > 0) {
    params.set('upgrade_keys', upgradeKeys.join(','));
  }
  if (limit) {
    params.set('limit', String(limit));
  }

  const queryString = params.toString();
  const url = `/api/cars/${carSlug}/recommendations${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get(url);

  // Defensive: ensure we return the expected shape
  if (response?.success && response?.data?.recommendations) {
    return response.data.recommendations;
  }

  // Return empty object if no data
  return {};
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Fetch AL part recommendations for a car
 *
 * @param {string} carSlug - Car slug to fetch recommendations for
 * @param {Object} [options] - Options
 * @param {string[]} [options.upgradeKeys] - Filter by specific upgrade keys
 * @param {number} [options.limit] - Max recommendations per upgrade (default: 3)
 * @param {boolean} [options.enabled] - Whether to enable the query
 * @returns {Object} TanStack Query result with recommendations grouped by upgrade key
 *
 * @example
 * // Fetch all recommendations for a car
 * const { data, isLoading } = usePartRecommendations('bmw-m3-e46');
 *
 * // Fetch specific upgrade types
 * const { data } = usePartRecommendations('bmw-m3-e46', {
 *   upgradeKeys: ['cold-air-intake', 'exhaust-catback'],
 * });
 *
 * // Access recommendations
 * const intakeRecs = data?.['cold-air-intake'] || [];
 */
export function usePartRecommendations(carSlug, options = {}) {
  const { upgradeKeys = null, limit = 3, enabled = true } = options;

  return useQuery({
    queryKey: partsKeys.recommendationsByUpgrade(carSlug, upgradeKeys),
    queryFn: () => fetchRecommendations(carSlug, upgradeKeys, limit),
    enabled: enabled && !!carSlug,
    staleTime: RECOMMENDATIONS_STALE_TIME,
    // Don't refetch on window focus - recommendations don't change often
    refetchOnWindowFocus: false,
  });
}

/**
 * Helper to get recommendations for a specific upgrade key
 *
 * @param {Object} recommendations - Recommendations object from hook
 * @param {string} upgradeKey - Upgrade key to get recommendations for
 * @returns {Array} Array of recommendations (empty if none)
 */
export function getRecommendationsForUpgrade(recommendations, upgradeKey) {
  if (!recommendations || !upgradeKey) return [];
  return recommendations[upgradeKey] || [];
}

/**
 * Helper to check if any recommendations exist for an upgrade
 *
 * @param {Object} recommendations - Recommendations object from hook
 * @param {string} upgradeKey - Upgrade key to check
 * @returns {boolean} True if recommendations exist
 */
export function hasRecommendations(recommendations, upgradeKey) {
  return getRecommendationsForUpgrade(recommendations, upgradeKey).length > 0;
}

export default usePartRecommendations;
