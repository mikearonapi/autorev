'use client';

/**
 * App Data Prefetcher
 * 
 * Ensures React Query cache is populated from prefetch.js data when available.
 * 
 * Primary data loading happens during the splash screen via prefetchAllUserData().
 * This component handles secondary prefetches for data not critical to initial render.
 * 
 * Data flow:
 * 1. Splash screen shows → prefetchAllUserData() loads vehicles, cars, dashboard, etc.
 * 2. Splash dismisses → user lands on /garage
 * 3. Garage uses prefetched data from React Query cache (via placeholderData)
 * 4. This component prefetches secondary data (insights, community) for other tabs
 * 
 * @module components/AppDataPrefetcher
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/providers/AuthProvider';
import { userKeys, carKeys } from '@/lib/queryKeys';
import { getPrefetchedData } from '@/lib/prefetch';

// Cache times (aligned with useCarData.js and providers)
const CACHE_TIMES = {
  FAST: 5 * 60 * 1000,      // 5 minutes
  STANDARD: 10 * 60 * 1000, // 10 minutes
};

/**
 * AppDataPrefetcher Component
 * 
 * Renders nothing (returns null) but ensures React Query cache
 * is warm with prefetched data and loads secondary data.
 */
export function AppDataPrefetcher() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated, isDataFetchReady } = useAuth();
  const hasPrefetchedRef = useRef(false);
  const lastUserIdRef = useRef(null);

  useEffect(() => {
    // Wait for auth to be ready and user to be authenticated
    if (!isDataFetchReady || !isAuthenticated || !user?.id) {
      return;
    }

    // Reset prefetch flag if user changed
    if (lastUserIdRef.current !== user.id) {
      hasPrefetchedRef.current = false;
      lastUserIdRef.current = user.id;
    }

    // Only prefetch once per user session
    if (hasPrefetchedRef.current) {
      return;
    }

    hasPrefetchedRef.current = true;
    const userId = user.id;

    console.log('[AppDataPrefetcher] Hydrating React Query cache from prefetch');

    // Hydrate React Query cache with prefetched data (if available)
    // This ensures data is in the cache even if hooks haven't been called yet
    
    const prefetchedCars = getPrefetchedData('carsList');
    if (prefetchedCars) {
      queryClient.setQueryData(carKeys.lists(), prefetchedCars);
      console.log('[AppDataPrefetcher] Hydrated cars list:', prefetchedCars.length);
    }
    
    const prefetchedDashboard = getPrefetchedData('dashboard', userId);
    if (prefetchedDashboard) {
      queryClient.setQueryData([...userKeys.all, userId, 'dashboard'], prefetchedDashboard);
      console.log('[AppDataPrefetcher] Hydrated dashboard data');
    }

    // Prefetch secondary data for other tabs (insights, etc.)
    // These are lower priority - user might navigate to these tabs after garage

    queryClient.prefetchQuery({
      queryKey: [...userKeys.all, userId, 'insights'],
      queryFn: async () => {
        const response = await fetch(`/api/users/${userId}/insights`);
        if (!response.ok) throw new Error('Failed to fetch insights');
        const data = await response.json();
        return data.data;
      },
      staleTime: CACHE_TIMES.FAST,
    }).catch(err => {
      console.warn('[AppDataPrefetcher] Insights prefetch failed:', err);
    });

  }, [isDataFetchReady, isAuthenticated, user?.id, queryClient]);

  // This component renders nothing - it's just for side effects
  return null;
}

export default AppDataPrefetcher;
