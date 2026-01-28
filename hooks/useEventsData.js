'use client';

/**
 * React Query Hooks for Events Data
 * 
 * Provides cached, deduplicated data fetching for events-related data.
 * Includes events list, event details, and save/unsave functionality.
 * 
 * Uses apiClient for standardized error handling and cross-platform support.
 * 
 * @module hooks/useEventsData
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import apiClient from '@/lib/apiClient';

import { CACHE_TIMES } from './useCarData';
import { userKeys } from './useUserData';

// =============================================================================
// QUERY KEY FACTORIES
// =============================================================================

/**
 * Standardized query keys for events data.
 * Using factories ensures consistent cache invalidation.
 */
export const eventsKeys = {
  all: ['events'],
  
  // Events list
  lists: () => [...eventsKeys.all, 'list'],
  list: (filters) => [...eventsKeys.lists(), filters],
  
  // Event detail
  details: () => [...eventsKeys.all, 'detail'],
  detail: (slug) => [...eventsKeys.details(), slug],
  
  // Related events
  related: (slug, filters) => [...eventsKeys.all, 'related', slug, filters],
  
  // Event types
  types: () => [...eventsKeys.all, 'types'],
  
  // Tracks list
  tracks: () => [...eventsKeys.all, 'tracks'],
};

// =============================================================================
// FETCHER FUNCTIONS (using apiClient)
// =============================================================================

/**
 * Build query params for events list
 */
function buildEventsParams(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.location) params.append('location', filters.location);
  if (filters.type) params.append('type', filters.type);
  if (filters.brand) params.append('brand', filters.brand);
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  if (filters.featured) params.append('featured', 'true');
  if (filters.includePast) params.append('includePast', 'true');
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.sort) params.append('sort', filters.sort);
  
  return params.toString();
}

/**
 * Fetch events list
 */
async function fetchEvents(filters = {}) {
  const params = buildEventsParams(filters);
  const data = await apiClient.get(`/api/events?${params}`);
  return {
    events: data.events || [],
    pagination: data.pagination,
    total: data.total,
  };
}

/**
 * Fetch single event details
 */
async function fetchEventDetail(slug) {
  return fetcher(`/api/events/${slug}`);
}

/**
 * Fetch event types
 */
async function fetchEventTypes() {
  const data = await apiClient.get('/api/events/types');
  return data.types || [];
}

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Hook to fetch events list
 * @param {object} filters - Filter options
 * @param {object} options - React Query options
 */
export function useEvents(filters = {}, options = {}) {
  return useQuery({
    queryKey: eventsKeys.list(filters),
    queryFn: () => fetchEvents(filters),
    staleTime: CACHE_TIMES.FAST,
    ...options,
  });
}

/**
 * Hook to fetch a single event's details
 * @param {string} slug - Event slug
 * @param {object} options - React Query options
 */
export function useEventDetail(slug, options = {}) {
  return useQuery({
    queryKey: eventsKeys.detail(slug),
    queryFn: () => fetchEventDetail(slug),
    staleTime: CACHE_TIMES.STANDARD,
    enabled: !!slug,
    ...options,
  });
}

/**
 * Hook to fetch related events
 * @param {string} slug - Current event slug (to exclude)
 * @param {object} filters - Filter options
 * @param {object} options - React Query options
 */
export function useRelatedEvents(slug, filters = {}, options = {}) {
  return useQuery({
    queryKey: eventsKeys.related(slug, filters),
    queryFn: async () => {
      const data = await fetchEvents({ ...filters, limit: 5 });
      // Filter out the current event
      return {
        ...data,
        events: data.events.filter(e => e.slug !== slug).slice(0, 4),
      };
    },
    staleTime: CACHE_TIMES.STANDARD,
    enabled: !!slug,
    ...options,
  });
}

/**
 * Hook to fetch event types
 * @param {object} options - React Query options
 */
export function useEventTypes(options = {}) {
  return useQuery({
    queryKey: eventsKeys.types(),
    queryFn: fetchEventTypes,
    staleTime: CACHE_TIMES.SLOW, // Types change rarely
    ...options,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Hook to toggle save/unsave an event
 */
export function useSaveEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventSlug, save, headers = {} }) => {
      const res = await fetch(`/api/events/${eventSlug}/save`, {
        method: save ? 'POST' : 'DELETE',
        headers,
      });
      if (!res.ok) {
        const error = new Error(`Failed to ${save ? 'save' : 'unsave'} event`);
        error.status = res.status;
        throw error;
      }
      return res.json();
    },
    onSuccess: (data, { eventSlug, save }) => {
      // Invalidate saved events cache for all users
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      // Update the event detail if cached
      queryClient.setQueryData(eventsKeys.detail(eventSlug), (old) => {
        if (!old) return old;
        return {
          ...old,
          isSaved: save,
        };
      });
    },
  });
}

/**
 * Hook to submit a new event
 */
export function useSubmitEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventData) => {
      const res = await fetch('/api/events/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const error = new Error(body.error || 'Failed to submit event');
        error.details = body;
        throw error;
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate events list to show new event
      queryClient.invalidateQueries({ queryKey: eventsKeys.lists() });
    },
  });
}

/**
 * Hook to fetch tracks list for lap time estimation
 * 
 * @example
 * const { data: tracks, isLoading } = useTracks();
 */
export function useTracks(options = {}) {
  return useQuery({
    queryKey: eventsKeys.tracks(),
    queryFn: async () => {
      const data = await apiClient.get('/api/tracks');
      return data.tracks || [];
    },
    staleTime: CACHE_TIMES.SLOW, // 30 min - tracks rarely change
    ...options,
  });
}

// =============================================================================
// EVENT RSVP HOOKS
// =============================================================================

/**
 * Query key factory for RSVP data
 */
export const rsvpKeys = {
  all: ['eventRsvp'],
  rsvp: (eventSlug) => [...rsvpKeys.all, 'status', eventSlug],
  attendees: (eventSlug, filters) => [...rsvpKeys.all, 'attendees', eventSlug, filters],
};

/**
 * Hook to get user's RSVP status for an event
 * @param {string} eventSlug - Event slug
 * @param {object} options - React Query options
 */
export function useEventRsvp(eventSlug, options = {}) {
  return useQuery({
    queryKey: rsvpKeys.rsvp(eventSlug),
    queryFn: async () => {
      const data = await apiClient.get(`/api/events/${eventSlug}/rsvp`);
      return data;
    },
    staleTime: CACHE_TIMES.FAST,
    enabled: !!eventSlug,
    ...options,
  });
}

/**
 * Hook to get event attendees
 * @param {string} eventSlug - Event slug
 * @param {object} filters - Filter options { status?: 'going' | 'interested', limit?: number }
 * @param {object} options - React Query options
 */
export function useEventAttendees(eventSlug, filters = {}, options = {}) {
  return useQuery({
    queryKey: rsvpKeys.attendees(eventSlug, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const data = await apiClient.get(`/api/events/${eventSlug}/attendees?${params.toString()}`);
      return data;
    },
    staleTime: CACHE_TIMES.FAST,
    enabled: !!eventSlug,
    ...options,
  });
}

/**
 * Hook to set/update RSVP for an event
 */
export function useSetEventRsvp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventSlug, status, visibility = 'public', notes, headers = {} }) => {
      const res = await fetch(`/api/events/${eventSlug}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ status, visibility, notes }),
      });
      if (!res.ok) {
        const error = new Error('Failed to set RSVP');
        error.status = res.status;
        throw error;
      }
      return res.json();
    },
    onSuccess: (data, { eventSlug }) => {
      // Invalidate RSVP status cache
      queryClient.invalidateQueries({ queryKey: rsvpKeys.rsvp(eventSlug) });
      // Invalidate ALL attendees queries for this event (use partial key match)
      queryClient.invalidateQueries({ queryKey: [...rsvpKeys.all, 'attendees', eventSlug] });
      // Update event detail if cached
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(eventSlug) });
    },
  });
}

/**
 * Hook to remove RSVP from an event
 */
export function useRemoveEventRsvp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventSlug, headers = {} }) => {
      const res = await fetch(`/api/events/${eventSlug}/rsvp`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const error = new Error('Failed to remove RSVP');
        error.status = res.status;
        throw error;
      }
      return res.json();
    },
    onSuccess: (data, { eventSlug }) => {
      // Invalidate RSVP status cache
      queryClient.invalidateQueries({ queryKey: rsvpKeys.rsvp(eventSlug) });
      // Invalidate ALL attendees queries for this event (use partial key match)
      queryClient.invalidateQueries({ queryKey: [...rsvpKeys.all, 'attendees', eventSlug] });
      // Update event detail if cached
      queryClient.invalidateQueries({ queryKey: eventsKeys.detail(eventSlug) });
    },
  });
}
