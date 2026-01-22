'use client';

/**
 * React Query Hooks for User Data
 * 
 * Provides cached, deduplicated data fetching for user-related data.
 * Includes conversations, credits, track times, saved events, and vehicles.
 * 
 * Uses apiClient for standardized error handling and cross-platform support.
 * 
 * @module hooks/useUserData
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import { CACHE_TIMES } from './useCarData';

// =============================================================================
// QUERY KEY FACTORIES
// =============================================================================

/**
 * Standardized query keys for user data.
 * Using factories ensures consistent cache invalidation.
 */
export const userKeys = {
  all: ['user'],
  
  // Conversations
  conversations: (userId) => [...userKeys.all, userId, 'conversations'],
  conversation: (userId, conversationId) => [...userKeys.all, userId, 'conversation', conversationId],
  
  // Credits
  credits: (userId) => [...userKeys.all, userId, 'credits'],
  
  // Track times
  trackTimes: (userId, carSlug) => [...userKeys.all, userId, 'track-times', carSlug || 'all'],
  
  // Saved events
  savedEvents: (userId, filters) => [...userKeys.all, userId, 'saved-events', filters],
  
  // Vehicles
  vehicle: (userId, vehicleId) => [...userKeys.all, userId, 'vehicle', vehicleId],
  garage: (userId) => [...userKeys.all, userId, 'garage'],
};

// =============================================================================
// FETCHER FUNCTIONS (using apiClient)
// =============================================================================

/**
 * Fetch user's AL conversations
 */
async function fetchConversations(userId, limit = 20) {
  const data = await apiClient.get(`/api/users/${userId}/al-conversations?limit=${limit}`);
  return data.conversations || [];
}

/**
 * Fetch a single conversation with messages
 */
async function fetchConversation(userId, conversationId) {
  const data = await apiClient.get(`/api/users/${userId}/al-conversations/${conversationId}`);
  return {
    ...data,
    messages: data.messages?.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.created_at,
    })) || [],
  };
}

/**
 * Fetch user's AL credits
 */
async function fetchCredits(userId) {
  const data = await apiClient.get(`/api/users/${userId}/al-credits`);
  return {
    fuel: data.balanceCents || 0,
    isUnlimited: data.isUnlimited || false,
  };
}

/**
 * Fetch user's track times
 */
async function fetchTrackTimes(userId, carSlug, limit = 10) {
  const params = new URLSearchParams();
  if (carSlug) params.append('carSlug', carSlug);
  if (limit) params.append('limit', limit.toString());
  
  const data = await apiClient.get(`/api/users/${userId}/track-times?${params.toString()}`);
  return data.times || [];
}

/**
 * Fetch user's saved events
 */
async function fetchSavedEvents(userId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.includeExpired) params.append('includeExpired', 'true');
  if (filters.limit) params.append('limit', filters.limit.toString());
  
  // Build auth headers if we have a token
  const data = await apiClient.get(`/api/users/${userId}/saved-events?${params.toString()}`);
  return data;
}

/**
 * Fetch a specific vehicle
 */
async function fetchVehicle(userId, vehicleId) {
  const data = await apiClient.get(`/api/users/${userId}/vehicles/${vehicleId}`);
  // API returns { vehicle: {...} } - extract vehicle data
  return data.vehicle || data;
}

/**
 * Fetch user's garage
 */
async function fetchGarage(userId) {
  const data = await apiClient.get(`/api/users/${userId}/garage`);
  return data.vehicles || data;
}

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Hook to fetch user's AL conversations
 * @param {string} userId - User ID
 * @param {object} options - React Query options
 */
export function useUserConversations(userId, options = {}) {
  return useQuery({
    queryKey: userKeys.conversations(userId),
    queryFn: () => fetchConversations(userId, options.limit || 20),
    staleTime: CACHE_TIMES.FAST,
    enabled: !!userId,
    ...options,
  });
}

/**
 * Hook to fetch a single conversation with messages
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation ID
 * @param {object} options - React Query options
 */
export function useUserConversation(userId, conversationId, options = {}) {
  return useQuery({
    queryKey: userKeys.conversation(userId, conversationId),
    queryFn: () => fetchConversation(userId, conversationId),
    staleTime: CACHE_TIMES.FAST,
    enabled: !!userId && !!conversationId,
    ...options,
  });
}

/**
 * Hook to fetch user's AL credits/fuel balance
 * @param {string} userId - User ID
 * @param {object} options - React Query options
 */
export function useUserCredits(userId, options = {}) {
  return useQuery({
    queryKey: userKeys.credits(userId),
    queryFn: () => fetchCredits(userId),
    staleTime: CACHE_TIMES.FAST,
    enabled: !!userId,
    ...options,
  });
}

/**
 * Hook to fetch user's track times
 * @param {string} userId - User ID
 * @param {string} carSlug - Optional car slug to filter by
 * @param {object} options - React Query options
 */
export function useUserTrackTimes(userId, carSlug = null, options = {}) {
  return useQuery({
    queryKey: userKeys.trackTimes(userId, carSlug),
    queryFn: () => fetchTrackTimes(userId, carSlug, options.limit || 10),
    staleTime: CACHE_TIMES.STANDARD,
    enabled: !!userId,
    ...options,
  });
}

/**
 * Hook to fetch user's saved events
 * @param {string} userId - User ID
 * @param {object} filters - Filter options (includeExpired, limit)
 * @param {object} options - React Query options
 */
export function useUserSavedEvents(userId, filters = {}, options = {}) {
  return useQuery({
    queryKey: userKeys.savedEvents(userId, filters),
    queryFn: () => fetchSavedEvents(userId, filters),
    staleTime: CACHE_TIMES.FAST,
    enabled: !!userId,
    ...options,
  });
}

/**
 * Hook to fetch a specific user vehicle
 * @param {string} userId - User ID
 * @param {string} vehicleId - Vehicle ID
 * @param {object} options - React Query options
 */
export function useUserVehicle(userId, vehicleId, options = {}) {
  return useQuery({
    queryKey: userKeys.vehicle(userId, vehicleId),
    queryFn: () => fetchVehicle(userId, vehicleId),
    staleTime: CACHE_TIMES.STANDARD,
    enabled: !!userId && !!vehicleId,
    ...options,
  });
}

/**
 * Hook to fetch user's garage
 * @param {string} userId - User ID
 * @param {object} options - React Query options
 */
export function useUserGarage(userId, options = {}) {
  return useQuery({
    queryKey: userKeys.garage(userId),
    queryFn: () => fetchGarage(userId),
    staleTime: CACHE_TIMES.FAST,
    enabled: !!userId,
    ...options,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Hook to add a new track time
 */
export function useAddTrackTime() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, trackTime }) => {
      const res = await fetch(`/api/users/${userId}/track-times`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackTime),
      });
      if (!res.ok) {
        const error = new Error('Failed to save track time');
        try {
          const body = await res.json();
          error.message = body.error || error.message;
        } catch {}
        throw error;
      }
      return res.json();
    },
    onSuccess: (data, { userId, trackTime }) => {
      // Invalidate track times cache
      queryClient.invalidateQueries({ queryKey: userKeys.trackTimes(userId, trackTime.carSlug) });
      queryClient.invalidateQueries({ queryKey: userKeys.trackTimes(userId, null) });
    },
  });
}

/**
 * Hook to analyze track times for a car
 */
export function useAnalyzeTrackTimes() {
  return useMutation({
    mutationFn: async ({ userId, carSlug }) => {
      const res = await fetch(`/api/users/${userId}/track-times/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carSlug }),
      });
      if (!res.ok) {
        const error = new Error('Failed to analyze track times');
        try {
          const body = await res.json();
          error.message = body.error || error.message;
        } catch {}
        throw error;
      }
      return res.json();
    },
  });
}

/**
 * Hook to clear user data
 */
export function useClearUserData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, scope }) => {
      const res = await fetch(`/api/users/${userId}/clear-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope }),
      });
      if (!res.ok) {
        throw new Error('Failed to clear data');
      }
      return res.json();
    },
    onSuccess: (data, { userId }) => {
      // Invalidate all user data
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

/**
 * Hook to delete user account
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async ({ userId, reason, details, confirmText }) => {
      const res = await fetch(`/api/users/${userId}/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          details: details?.trim() || null,
          confirmText,
        }),
      });
      if (!res.ok) {
        const error = new Error('Failed to delete account');
        try {
          const body = await res.json();
          error.message = body.error || error.message;
        } catch {}
        throw error;
      }
      return res.json();
    },
  });
}

/**
 * Hook to save/unsave an event
 */
export function useSaveEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, eventId, action = 'save' }) => {
      const res = await fetch(`/api/users/${userId}/saved-events`, {
        method: action === 'save' ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) {
        throw new Error(`Failed to ${action} event`);
      }
      return res.json();
    },
    onSuccess: (data, { userId }) => {
      // Invalidate saved events cache
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, userId, 'saved-events'] });
    },
  });
}

/**
 * Hook to update a user vehicle
 */
export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, vehicleId, updates }) => {
      const res = await fetch(`/api/users/${userId}/vehicles/${vehicleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = new Error('Failed to update vehicle');
        try {
          const body = await res.json();
          error.message = body.error || error.message;
        } catch {}
        throw error;
      }
      return res.json();
    },
    onSuccess: (data, { userId, vehicleId }) => {
      // Update the vehicle cache with new data
      queryClient.setQueryData(userKeys.vehicle(userId, vehicleId), data.vehicle || data);
      // Also invalidate garage in case the update affects the list
      queryClient.invalidateQueries({ queryKey: userKeys.garage(userId) });
    },
  });
}

// =============================================================================
// VEHICLE DATA HOOKS
// =============================================================================

/**
 * Hook to fetch dyno results for a vehicle
 */
export function useDynoResults(vehicleId, options = {}) {
  return useQuery({
    queryKey: [...userKeys.all, 'dyno-results', vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/dyno-results?vehicleId=${vehicleId}&limit=10`);
      if (!res.ok) {
        throw new Error('Failed to fetch dyno results');
      }
      const data = await res.json();
      return data.results || [];
    },
    staleTime: CACHE_TIMES.STANDARD,
    enabled: !!vehicleId,
    ...options,
  });
}

/**
 * Hook to fetch vehicle build data
 */
export function useVehicleBuild(vehicleId, options = {}) {
  return useQuery({
    queryKey: [...userKeys.all, 'vehicle-build', vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles/${vehicleId}/build`);
      if (!res.ok) {
        if (res.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch vehicle build');
      }
      return res.json();
    },
    staleTime: CACHE_TIMES.STANDARD,
    enabled: !!vehicleId,
    ...options,
  });
}

/**
 * Hook to fetch garage enrichment data for unmatched vehicles
 */
export function useGarageEnrich(vehicleId, options = {}) {
  return useQuery({
    queryKey: [...userKeys.all, 'garage-enrich', vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/garage/enrich?vehicleId=${vehicleId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch enrichment data');
      }
      return res.json();
    },
    staleTime: CACHE_TIMES.SLOW,
    enabled: !!vehicleId,
    ...options,
  });
}

/**
 * Hook to update vehicle build data
 */
export function useUpdateVehicleBuild() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ vehicleId, buildData }) => {
      const res = await fetch(`/api/vehicles/${vehicleId}/build`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildData),
      });
      if (!res.ok) {
        throw new Error('Failed to save build');
      }
      return res.json();
    },
    onSuccess: (data, { vehicleId }) => {
      // Invalidate the vehicle build cache
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'vehicle-build', vehicleId] });
    },
  });
}

// =============================================================================
// VIN AND VEHICLE RESOLUTION HOOKS
// =============================================================================

/**
 * Hook to fetch vehicle safety data via VIN
 */
export function useVinSafety() {
  return useMutation({
    mutationFn: async ({ vin, year, make, model }) => {
      const res = await fetch('/api/vin/safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin, year, make, model }),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch safety data');
      }
      return res.json();
    },
  });
}

/**
 * Hook to resolve VIN to a car variant
 */
export function useVinResolve() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ vehicleId, decoded }) => {
      const res = await fetch('/api/vin/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decoded,
          vehicleId,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to resolve VIN');
      }
      return res.json();
    },
    onSuccess: (data, { vehicleId }) => {
      // Invalidate vehicle-related caches
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'garage-enrich', vehicleId] });
      queryClient.invalidateQueries({ queryKey: userKeys.garage });
    },
  });
}

/**
 * Hook to trigger enrichment for an unmatched vehicle
 */
export function useTriggerEnrichment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ vehicleId }) => {
      const res = await fetch('/api/garage/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to trigger enrichment');
      }
      return res.json();
    },
    onSuccess: (data, { vehicleId }) => {
      // Invalidate enrichment cache
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'garage-enrich', vehicleId] });
    },
  });
}

// =============================================================================
// AL PREFERENCES HOOKS
// =============================================================================

const DEFAULT_AL_PREFERENCES = {
  response_mode: 'database',
  web_search_enabled: true,
  forum_insights_enabled: true,
  youtube_reviews_enabled: true,
  event_search_enabled: true,
};

/**
 * Hook to fetch AL preferences
 */
export function useALPreferences(options = {}) {
  return useQuery({
    queryKey: [...userKeys.all, 'al-preferences'],
    queryFn: async () => {
      const res = await fetch('/api/al/preferences');
      if (!res.ok) {
        // Return defaults on error
        return DEFAULT_AL_PREFERENCES;
      }
      const data = await res.json();
      return {
        response_mode: data.response_mode || 'database',
        web_search_enabled: data.web_search_enabled ?? true,
        forum_insights_enabled: data.forum_insights_enabled ?? true,
        youtube_reviews_enabled: data.youtube_reviews_enabled ?? true,
        event_search_enabled: data.event_search_enabled ?? true,
      };
    },
    staleTime: CACHE_TIMES.STANDARD,
    ...options,
  });
}

/**
 * Hook to update AL preferences
 */
export function useUpdateALPreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (preferences) => {
      const res = await fetch('/api/al/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });
      if (!res.ok) {
        throw new Error('Failed to save preferences');
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Update the preferences cache
      queryClient.setQueryData([...userKeys.all, 'al-preferences'], data);
    },
  });
}

// =============================================================================
// REFERRAL HOOKS
// =============================================================================

/**
 * Hook to fetch referral data for current user
 * Uses /api/referrals which gets user from session
 */
export function useReferralData(options = {}) {
  return useQuery({
    queryKey: [...userKeys.all, 'referral'],
    queryFn: async () => {
      const res = await fetch('/api/referrals');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to fetch referral data');
      }
      return res.json();
    },
    staleTime: CACHE_TIMES.STANDARD,
    ...options,
  });
}

/**
 * Hook to send a referral invite
 */
export function useSendReferralInvite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email }) => {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invite');
      }
      return data;
    },
    onSuccess: () => {
      // Invalidate referral data cache
      queryClient.invalidateQueries({ queryKey: [...userKeys.all, 'referral'] });
    },
  });
}

/**
 * Hook to resend a referral invite
 */
export function useResendReferralInvite() {
  return useMutation({
    mutationFn: async ({ referralId }) => {
      const res = await fetch('/api/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referral_id: referralId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend invite');
      }
      return data;
    },
  });
}

// =============================================================================
// LOCATION AND BILLING HOOKS
// =============================================================================

/**
 * Hook to lookup city/state from zip code
 */
export function useZipLookup() {
  return useMutation({
    mutationFn: async ({ zip }) => {
      const res = await fetch(`/api/user/location?zip=${zip}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to lookup zip');
      }
      return data;
    },
  });
}

/**
 * Hook to save user location
 */
export function useSaveLocation() {
  return useMutation({
    mutationFn: async ({ zip }) => {
      const res = await fetch('/api/user/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zip }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save location');
      }
      return res.json();
    },
  });
}

/**
 * Hook to get billing portal URL
 */
export function useBillingPortal() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get billing portal');
      }
      return data;
    },
  });
}
