'use client';

/**
 * Navigation Prefetch Hook
 * 
 * Prefetches data for upcoming route navigation to eliminate loading screens.
 * Call this on hover/touch of navigation links to start loading data before
 * the user actually navigates.
 * 
 * @module hooks/usePrefetchNavigation
 */

import { useCallback } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/components/providers/AuthProvider';
import apiClient from '@/lib/apiClient';
import { userKeys, carKeys, communityKeys, alKeys } from '@/lib/queryKeys';

// Cache times (aligned with useCarData.js)
const CACHE_TIMES = {
  FAST: 5 * 60 * 1000,      // 5 minutes
  STANDARD: 10 * 60 * 1000, // 10 minutes
};

/**
 * Fetcher functions for prefetching
 */
const fetchers = {
  // Dashboard data
  dashboard: async (userId) => {
    const response = await fetch(`/api/users/${userId}/dashboard`);
    if (!response.ok) throw new Error('Failed to fetch dashboard');
    return response.json();
  },
  
  // User vehicles (garage)
  vehicles: async (userId) => {
    return apiClient.get(`/api/users/${userId}/vehicles`);
  },
  
  // User insights
  insights: async (userId) => {
    const response = await fetch(`/api/users/${userId}/insights`);
    if (!response.ok) throw new Error('Failed to fetch insights');
    const data = await response.json();
    return data.data;
  },
  
  // AL conversations
  conversations: async (userId) => {
    return apiClient.get(`/api/users/${userId}/al-conversations?limit=20`);
  },
  
  // Community builds (infinite query initial page)
  communityBuilds: async () => {
    return apiClient.get('/api/community/builds?limit=20');
  },
  
  // Cars list
  carsList: async () => {
    const data = await apiClient.get('/api/cars');
    return data.cars || data;
  },
};

/**
 * Hook to prefetch data for navigation destinations
 * 
 * @returns {Object} Prefetch functions
 * 
 * @example
 * const { prefetchRoute, prefetchDashboard, prefetchGarage } = usePrefetchNavigation();
 * 
 * <Link href="/dashboard" onMouseEnter={prefetchDashboard}>
 *   Dashboard
 * </Link>
 */
export function usePrefetchNavigation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  /**
   * Prefetch dashboard data
   */
  const prefetchDashboard = useCallback(() => {
    if (!userId) return;
    
    queryClient.prefetchQuery({
      queryKey: userKeys.dashboard(userId),
      queryFn: () => fetchers.dashboard(userId),
      staleTime: CACHE_TIMES.FAST,
    });
  }, [queryClient, userId]);

  /**
   * Prefetch garage/vehicles data
   */
  const prefetchGarage = useCallback(() => {
    if (!userId) return;
    
    // Vehicles are already prefetched by OwnedVehiclesProvider,
    // but this ensures React Query cache is warm
    queryClient.prefetchQuery({
      queryKey: userKeys.vehicles(userId),
      queryFn: () => fetchers.vehicles(userId),
      staleTime: CACHE_TIMES.STANDARD,
    });
    
    // Also prefetch car list for vehicle matching
    queryClient.prefetchQuery({
      queryKey: carKeys.lists(),
      queryFn: fetchers.carsList,
      staleTime: CACHE_TIMES.FAST,
    });
  }, [queryClient, userId]);

  /**
   * Prefetch data page (vehicles + cars)
   */
  const prefetchData = useCallback(() => {
    if (!userId) return;
    
    queryClient.prefetchQuery({
      queryKey: userKeys.vehicles(userId),
      queryFn: () => fetchers.vehicles(userId),
      staleTime: CACHE_TIMES.STANDARD,
    });
  }, [queryClient, userId]);

  /**
   * Prefetch insights page data
   */
  const prefetchInsights = useCallback(() => {
    if (!userId) return;
    
    queryClient.prefetchQuery({
      queryKey: [...userKeys.all, userId, 'insights'],
      queryFn: () => fetchers.insights(userId),
      staleTime: CACHE_TIMES.FAST,
    });
  }, [queryClient, userId]);

  /**
   * Prefetch community page data
   */
  const prefetchCommunity = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: communityKeys.builds({}),
      queryFn: fetchers.communityBuilds,
      staleTime: CACHE_TIMES.FAST,
    });
  }, [queryClient]);

  /**
   * Prefetch AL page data
   */
  const prefetchAL = useCallback(() => {
    if (!userId) return;
    
    queryClient.prefetchQuery({
      queryKey: alKeys.conversations(userId),
      queryFn: () => fetchers.conversations(userId),
      staleTime: CACHE_TIMES.FAST,
    });
  }, [queryClient, userId]);

  /**
   * Prefetch data for a specific route
   * @param {string} route - The route path to prefetch for
   */
  const prefetchRoute = useCallback((route) => {
    // Normalize route (remove trailing slash, get base path)
    const normalizedRoute = route.split('?')[0].replace(/\/$/, '');
    
    switch (normalizedRoute) {
      case '/dashboard':
        prefetchDashboard();
        break;
        
      case '/garage':
      case '/garage/my-build':
      case '/garage/my-specs':
      case '/garage/my-parts':
      case '/garage/my-performance':
      case '/garage/my-install':
      case '/garage/my-photos':
        prefetchGarage();
        break;
        
      case '/data':
      case '/data/track':
        prefetchData();
        break;
        
      case '/insights':
        prefetchInsights();
        break;
        
      case '/community':
        prefetchCommunity();
        break;
        
      case '/al':
        prefetchAL();
        break;
        
      default:
        // For unknown routes, prefetch common data
        if (userId) {
          prefetchGarage();
        }
    }
  }, [prefetchDashboard, prefetchGarage, prefetchData, prefetchInsights, prefetchCommunity, prefetchAL, userId]);

  return {
    prefetchRoute,
    prefetchDashboard,
    prefetchGarage,
    prefetchData,
    prefetchInsights,
    prefetchCommunity,
    prefetchAL,
  };
}

export default usePrefetchNavigation;
