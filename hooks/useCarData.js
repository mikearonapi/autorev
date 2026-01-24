'use client';

/**
 * React Query Hooks for Car Data
 * 
 * Provides cached, deduplicated data fetching for car-related data.
 * All queries share a common cache, preventing redundant network requests
 * and enabling instant navigation between previously visited pages.
 * 
 * Uses apiClient for standardized error handling and cross-platform support.
 * 
 * @module hooks/useCarData
 */

import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';

// =============================================================================
// FETCHER HELPER
// =============================================================================
// Simple wrapper around apiClient.get for consistency with existing code

/**
 * Fetch data from an API endpoint using apiClient
 * @param {string} url - API URL to fetch
 * @returns {Promise<any>} - Response data
 */
async function fetcher(url) {
  return apiClient.get(url);
}

// =============================================================================
// CACHING STRATEGY
// =============================================================================
// Standardized stale times for consistent data freshness across the app.
// These values balance freshness against API load.

export const CACHE_TIMES = {
  // Dynamic data that changes frequently (car list as new cars are added)
  FAST: 5 * 60 * 1000,           // 5 minutes
  
  // Standard data (individual car enriched data, reviews)
  STANDARD: 10 * 60 * 1000,      // 10 minutes
  
  // Slow-changing data (recalls, maintenance specs, safety ratings)
  SLOW: 30 * 60 * 1000,          // 30 minutes
};

// =============================================================================
// QUERY KEY FACTORIES
// =============================================================================

/**
 * Standardized query keys for React Query.
 * Using factories ensures consistent cache invalidation.
 */
export const carKeys = {
  all: ['cars'],
  lists: () => [...carKeys.all, 'list'],
  list: (filters) => [...carKeys.lists(), filters],
  expertReviewedList: (limit) => [...carKeys.all, 'expert-reviewed', { limit }],
  details: () => [...carKeys.all, 'detail'],
  detail: (slug) => [...carKeys.details(), slug],
  enriched: (slug) => [...carKeys.detail(slug), 'enriched'],
  efficiency: (slug) => [...carKeys.detail(slug), 'efficiency'],
  safety: (slug) => [...carKeys.detail(slug), 'safety'],
  priceByYear: (slug) => [...carKeys.detail(slug), 'price-by-year'],
  marketValue: (slug) => [...carKeys.detail(slug), 'market-value'],
  expertReviews: (slug) => [...carKeys.detail(slug), 'expert-reviews'],
  expertConsensus: (slug) => [...carKeys.detail(slug), 'expert-consensus'],
  lapTimes: (slug) => [...carKeys.detail(slug), 'lap-times'],
  popularParts: (slug) => [...carKeys.detail(slug), 'popular-parts'],
  recalls: (slug) => [...carKeys.detail(slug), 'recalls'],
  maintenance: (slug) => [...carKeys.detail(slug), 'maintenance'],
  issues: (slug) => [...carKeys.detail(slug), 'issues'],
};

/**
 * Query keys for parts data (not car-specific)
 */
export const partsKeys = {
  all: ['parts'],
  turbos: () => [...partsKeys.all, 'turbos'],
};

// =============================================================================
// FETCHER FUNCTIONS (using apiClient)
// =============================================================================

/**
 * Fetch all cars list
 * Returns the cars array from the API response (API returns { cars, count, source })
 */
async function fetchCarsList() {
  const data = await fetcher('/api/cars');
  // Defensive: ensure we always return an array
  if (data && Array.isArray(data.cars)) {
    return data.cars;
  }
  // If API returns array directly (legacy format)
  if (Array.isArray(data)) {
    return data;
  }
  console.warn('[useCarData] Unexpected API response format:', data);
  return [];
}

/**
 * Fetch fuel efficiency data for a car
 */
async function fetchEfficiency(slug) {
  const data = await apiClient.get(`/api/cars/${slug}/efficiency`);
  return data.efficiency;
}

/**
 * Fetch safety ratings for a car
 */
async function fetchSafety(slug) {
  const data = await apiClient.get(`/api/cars/${slug}/safety-ratings`);
  return data.safety;
}

/**
 * Fetch price by year data for a car
 */
async function fetchPriceByYear(slug) {
  return fetcher(`/api/cars/${slug}/price-by-year`);
}

/**
 * Fetch expert reviews for a car
 */
async function fetchExpertReviews(slug, options = {}) {
  const { limit = 10, role } = options;
  let url = `/api/cars/${slug}/expert-reviews?limit=${limit}`;
  if (role) url += `&role=${role}`;
  return fetcher(url);
}

/**
 * Fetch expert consensus for a car
 */
async function fetchExpertConsensus(slug) {
  return fetcher(`/api/cars/${slug}/expert-consensus`);
}

/**
 * Fetch lap times for a car
 */
async function fetchLapTimes(slug, options = {}) {
  const { limit = 10, track } = options;
  let url = `/api/cars/${slug}/lap-times?limit=${limit}`;
  if (track) url += `&track=${encodeURIComponent(track)}`;
  return fetcher(url);
}

/**
 * Fetch dyno runs for a car
 */
async function fetchDynoRuns(slug, options = {}) {
  const { limit = 20 } = options;
  let url = `/api/cars/${slug}/dyno?limit=${limit}`;
  return fetcher(url);
}

/**
 * Fetch popular parts for a car
 */
async function fetchPopularParts(slug, limit = 8) {
  const data = await apiClient.get(`/api/parts/popular?carSlug=${encodeURIComponent(slug)}&limit=${limit}`);
  return data.results || [];
}

/**
 * Fetch recalls for a car
 */
async function fetchRecalls(slug) {
  return fetcher(`/api/cars/${slug}/recalls`);
}

/**
 * Fetch maintenance schedule for a car
 */
async function fetchMaintenance(slug) {
  return fetcher(`/api/cars/${slug}/maintenance`);
}

/**
 * Fetch known issues for a car
 */
async function fetchIssues(slug) {
  const data = await apiClient.get(`/api/cars/${slug}/issues`);
  return data.issues || [];
}

/**
 * Fetch cars with expert reviews for homepage strip
 */
async function fetchExpertReviewedCars(limit = 8) {
  const data = await apiClient.get(`/api/cars/expert-reviewed?limit=${limit}`);
  return data.cars || [];
}

/**
 * Fetch market value data for a car
 */
async function fetchMarketValue(slug) {
  const data = await apiClient.get(`/api/cars/${slug}/market-value`);
  return data.pricing || null;
}

// =============================================================================
// REACT QUERY HOOKS
// =============================================================================

/**
 * Hook to fetch all cars list
 * 
 * @example
 * const { data: cars, isLoading } = useCarsList();
 */
export function useCarsList(options = {}) {
  return useQuery({
    queryKey: carKeys.lists(),
    queryFn: fetchCarsList,
    staleTime: CACHE_TIMES.FAST, // 5 min - car list updates when new cars are added
    ...options,
  });
}

/**
 * Fetch a single car by slug from API
 */
async function fetchCarBySlug(slug) {
  const data = await fetcher(`/api/cars/${slug}`);
  return data.car || data || null;
}

/**
 * Hook to fetch a single car by slug
 * Useful as fallback when the full car list isn't available
 * 
 * @param {string} slug - Car slug
 * @param {Object} options - React Query options
 * @example
 * const { data: car, isLoading } = useCarBySlug('audi-rs5-sportback');
 */
export function useCarBySlug(slug, options = {}) {
  return useQuery({
    queryKey: carKeys.detail(slug),
    queryFn: () => fetchCarBySlug(slug),
    enabled: !!slug,
    staleTime: CACHE_TIMES.STANDARD, // 10 min
    ...options,
  });
}

/**
 * Hook to fetch fuel efficiency data
 * 
 * @param {string} slug - Car slug
 * @example
 * const { data: efficiency, isLoading } = useCarEfficiency('porsche-911-gt3');
 */
export function useCarEfficiency(slug, options = {}) {
  return useQuery({
    queryKey: carKeys.efficiency(slug),
    queryFn: () => fetchEfficiency(slug),
    enabled: !!slug,
    ...options,
  });
}

/**
 * Hook to fetch safety ratings
 * 
 * @param {string} slug - Car slug
 * @example
 * const { data: safety, isLoading } = useCarSafety('porsche-911-gt3');
 */
export function useCarSafety(slug, options = {}) {
  return useQuery({
    queryKey: carKeys.safety(slug),
    queryFn: () => fetchSafety(slug),
    enabled: !!slug,
    ...options,
  });
}

/**
 * Hook to fetch price by year data
 * 
 * @param {string} slug - Car slug
 * @example
 * const { data: prices, isLoading } = useCarPriceByYear('porsche-911-gt3');
 */
export function useCarPriceByYear(slug, options = {}) {
  return useQuery({
    queryKey: carKeys.priceByYear(slug),
    queryFn: () => fetchPriceByYear(slug),
    enabled: !!slug,
    ...options,
  });
}

/**
 * Hook to fetch expert reviews
 * 
 * @param {string} slug - Car slug
 * @param {Object} queryOptions - Query options (limit, role)
 * @example
 * const { data: reviews, isLoading } = useCarExpertReviews('porsche-911-gt3', { limit: 5 });
 */
export function useCarExpertReviews(slug, queryOptions = {}, options = {}) {
  return useQuery({
    queryKey: [...carKeys.expertReviews(slug), queryOptions],
    queryFn: () => fetchExpertReviews(slug, queryOptions),
    enabled: !!slug,
    ...options,
  });
}

/**
 * Hook to fetch expert consensus
 * 
 * @param {string} slug - Car slug
 * @example
 * const { data: consensus, isLoading } = useCarExpertConsensus('porsche-911-gt3');
 */
export function useCarExpertConsensus(slug, options = {}) {
  return useQuery({
    queryKey: carKeys.expertConsensus(slug),
    queryFn: () => fetchExpertConsensus(slug),
    enabled: !!slug,
    ...options,
  });
}

/**
 * Hook to fetch lap times
 * 
 * @param {string} slug - Car slug
 * @param {Object} queryOptions - Query options (limit, track)
 * @example
 * const { data: lapTimes, isLoading } = useCarLapTimes('porsche-911-gt3');
 */
export function useCarLapTimes(slug, queryOptions = {}, options = {}) {
  return useQuery({
    queryKey: [...carKeys.lapTimes(slug), queryOptions],
    queryFn: () => fetchLapTimes(slug, queryOptions),
    enabled: !!slug,
    ...options,
  });
}

/**
 * Hook to fetch dyno runs
 * 
 * @param {string} slug - Car slug
 * @param {Object} queryOptions - Query options (limit)
 * @example
 * const { data: dynoData, isLoading } = useCarDynoRuns('porsche-911-gt3');
 */
export function useCarDynoRuns(slug, queryOptions = {}, options = {}) {
  return useQuery({
    queryKey: ['car', 'dyno', slug, queryOptions],
    queryFn: () => fetchDynoRuns(slug, queryOptions),
    enabled: !!slug,
    ...options,
  });
}

/**
 * Hook to fetch popular parts
 * 
 * @param {string} slug - Car slug
 * @param {number} limit - Max parts to fetch
 * @example
 * const { data: parts, isLoading } = useCarPopularParts('porsche-911-gt3');
 */
export function useCarPopularParts(slug, limit = 8, options = {}) {
  return useQuery({
    queryKey: [...carKeys.popularParts(slug), { limit }],
    queryFn: () => fetchPopularParts(slug, limit),
    enabled: !!slug,
    ...options,
  });
}

/**
 * Hook to fetch recalls
 * 
 * @param {string} slug - Car slug
 * @example
 * const { data: recalls, isLoading } = useCarRecalls('porsche-911-gt3');
 */
export function useCarRecalls(slug, options = {}) {
  return useQuery({
    queryKey: carKeys.recalls(slug),
    queryFn: () => fetchRecalls(slug),
    enabled: !!slug,
    staleTime: CACHE_TIMES.SLOW, // 30 min - recalls rarely change
    ...options,
  });
}

/**
 * Hook to fetch maintenance schedule
 * 
 * @param {string} slug - Car slug
 * @example
 * const { data: maintenance, isLoading } = useCarMaintenance('porsche-911-gt3');
 */
export function useCarMaintenance(slug, options = {}) {
  return useQuery({
    queryKey: carKeys.maintenance(slug),
    queryFn: () => fetchMaintenance(slug),
    enabled: !!slug,
    staleTime: CACHE_TIMES.SLOW, // 30 min - maintenance specs rarely change
    ...options,
  });
}

/**
 * Hook to fetch known issues for a car
 * 
 * @param {string} slug - Car slug
 * @param {Object} options - Additional query options
 * @example
 * const { data: issues, isLoading } = useCarIssues('bmw-m3-g80');
 */
export function useCarIssues(slug, options = {}) {
  return useQuery({
    queryKey: carKeys.issues(slug),
    queryFn: () => fetchIssues(slug),
    enabled: !!slug,
    staleTime: CACHE_TIMES.SLOW, // 30 min - known issues rarely change
    ...options,
  });
}

/**
 * Hook to fetch all enriched data for a car in parallel
 * 
 * @deprecated Prefer `useCarEnrichedBundle` which makes 1 API request instead of 4.
 * This hook is kept for backwards compatibility but new code should use the bundle.
 * 
 * @param {string} slug - Car slug
 * @example
 * // OLD (4 requests):
 * const { efficiency, safety, priceByYear, parts, isLoading } = useCarEnrichedData('porsche-911-gt3');
 * 
 * // PREFERRED (1 request):
 * const { data, isLoading } = useCarEnrichedBundle('porsche-911-gt3');
 * const { efficiency, safety, priceByYear, popularParts } = data || {};
 */
export function useCarEnrichedData(slug) {
  const results = useQueries({
    queries: [
      {
        queryKey: carKeys.efficiency(slug),
        queryFn: () => fetchEfficiency(slug),
        enabled: !!slug,
      },
      {
        queryKey: carKeys.safety(slug),
        queryFn: () => fetchSafety(slug),
        enabled: !!slug,
      },
      {
        queryKey: carKeys.priceByYear(slug),
        queryFn: () => fetchPriceByYear(slug),
        enabled: !!slug,
      },
      {
        queryKey: [...carKeys.popularParts(slug), { limit: 8 }],
        queryFn: () => fetchPopularParts(slug, 8),
        enabled: !!slug,
      },
    ],
  });

  const [efficiencyQuery, safetyQuery, priceByYearQuery, partsQuery] = results;

  return {
    efficiency: efficiencyQuery.data,
    efficiencyLoading: efficiencyQuery.isLoading,
    efficiencyError: efficiencyQuery.error,

    safety: safetyQuery.data,
    safetyLoading: safetyQuery.isLoading,
    safetyError: safetyQuery.error,

    priceByYear: priceByYearQuery.data,
    priceByYearLoading: priceByYearQuery.isLoading,
    priceByYearError: priceByYearQuery.error,

    parts: partsQuery.data,
    partsLoading: partsQuery.isLoading,
    partsError: partsQuery.error,

    // Combined loading state
    isLoading: results.some((r) => r.isLoading),
    // Combined error state (any error)
    hasError: results.some((r) => r.error),
  };
}

/**
 * Hook to fetch all enriched data via the bundled endpoint
 * 
 * RECOMMENDED: This is the preferred hook for car detail pages.
 * Makes 1 API request instead of 4, reducing latency and server load.
 * 
 * Returns: { efficiency, safety, priceByYear, popularParts, recalls, maintenance }
 * 
 * @param {string} slug - Car slug
 * @param {Object} options - React Query options
 * @example
 * const { data, isLoading, error } = useCarEnrichedBundle('porsche-911-gt3');
 * if (data) {
 *   const { efficiency, safety, priceByYear, popularParts } = data;
 * }
 */
export function useCarEnrichedBundle(slug, options = {}) {
  return useQuery({
    queryKey: carKeys.enriched(slug),
    queryFn: async () => {
      const res = await fetch(`/api/cars/${slug}/enriched`);
      if (!res.ok) throw new Error('Failed to fetch enriched data');
      return res.json();
    },
    enabled: !!slug,
    staleTime: CACHE_TIMES.STANDARD, // 10 min - bundled enriched data
    ...options,
  });
}

/**
 * Hook to prefetch car enriched data (for hover prefetching)
 * Returns a function that can be called to trigger prefetch.
 * Uses the bundled endpoint for efficiency.
 * 
 * @example
 * const prefetch = usePrefetchCarData();
 * <Link onMouseEnter={() => prefetch('porsche-911-gt3')} />
 */
export function usePrefetchCarData() {
  const queryClient = useQueryClient();

  return (slug) => {
    if (!slug) return;

    // Prefetch bundled enriched data (single request)
    queryClient.prefetchQuery({
      queryKey: carKeys.enriched(slug),
      queryFn: async () => {
        const res = await fetch(`/api/cars/${slug}/enriched`);
        if (!res.ok) throw new Error('Failed to fetch enriched data');
        return res.json();
      },
    });
  };
}

/**
 * Hook to fetch expert-reviewed cars for homepage strip
 * 
 * @param {number} limit - Max number of cars to fetch
 * @example
 * const { data: cars, isLoading } = useExpertReviewedCars(8);
 */
export function useExpertReviewedCars(limit = 8, options = {}) {
  return useQuery({
    queryKey: carKeys.expertReviewedList(limit),
    queryFn: () => fetchExpertReviewedCars(limit),
    staleTime: CACHE_TIMES.STANDARD, // 10 min - expert reviews don't change frequently
    ...options,
  });
}

/**
 * Hook to fetch market value data for a car
 * 
 * @param {string} slug - Car slug
 * @example
 * const { data: marketData, isLoading } = useCarMarketValue('porsche-911-gt3');
 */
export function useCarMarketValue(slug, options = {}) {
  return useQuery({
    queryKey: carKeys.marketValue(slug),
    queryFn: () => fetchMarketValue(slug),
    enabled: !!slug,
    staleTime: CACHE_TIMES.SLOW, // 30 min - market data updates slowly
    ...options,
  });
}

/**
 * Hook to fetch available turbo options
 * Used by UpgradeCenter for turbo selection
 * 
 * @example
 * const { data: turbos = [], isLoading } = useTurbos();
 */
export function useTurbos(options = {}) {
  return useQuery({
    queryKey: partsKeys.turbos(),
    queryFn: async () => {
      const data = await apiClient.get('/api/parts/turbos');
      return data.turbos || [];
    },
    staleTime: CACHE_TIMES.SLOW, // 30 min - turbo list rarely changes
    ...options,
  });
}

export default {
  useCarsList,
  useCarEfficiency,
  useCarSafety,
  useCarPriceByYear,
  useCarExpertReviews,
  useCarExpertConsensus,
  useCarLapTimes,
  useCarDynoRuns,
  useCarPopularParts,
  useCarRecalls,
  useCarMaintenance,
  useCarIssues,
  useCarEnrichedData,
  useCarEnrichedBundle,
  usePrefetchCarData,
  useExpertReviewedCars,
  useCarMarketValue,
  useTurbos,
  carKeys,
  partsKeys,
};

