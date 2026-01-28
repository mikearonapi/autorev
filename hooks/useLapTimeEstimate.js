'use client';

/**
 * React Query Hook for Lap Time Estimation
 *
 * Uses the centralized lapTimeService via API.
 * Provides cached, deduplicated lap time estimates.
 *
 * @module hooks/useLapTimeEstimate
 */

import { useQuery } from '@tanstack/react-query';

import apiClient from '@/lib/apiClient';

// =============================================================================
// QUERY KEY FACTORY
// =============================================================================

export const lapTimeKeys = {
  all: ['lapTimes'],
  estimates: () => [...lapTimeKeys.all, 'estimate'],
  estimate: (params) => [...lapTimeKeys.estimates(), params],
  stats: () => [...lapTimeKeys.all, 'stats'],
  trackStats: (trackSlug) => [...lapTimeKeys.stats(), trackSlug],
};

// =============================================================================
// DRIVER SKILLS (client-side reference)
// =============================================================================

export const DRIVER_SKILLS = {
  beginner: {
    label: 'Beginner',
    description: '0-2 years track experience',
    tip: 'The best mod for you is seat time! Consider a driving school before spending on parts.',
    insight:
      'At your skill level, improving your driving will gain you 3-5x more time than any modification.',
  },
  intermediate: {
    label: 'Intermediate',
    description: '2-5 years, consistent laps',
    tip: 'Grip mods (tires, suspension) will help you most. Consider advanced driving instruction!',
    insight: 'You can extract about half of what mods offer. More seat time will unlock the rest.',
  },
  advanced: {
    label: 'Advanced',
    description: '5+ years, pushing limits',
    tip: 'You can extract most performance from mods. Focus on balanced upgrades.',
    insight: 'Your skill extracts 80%+ of mod potential. Fine-tuning setup is your next step.',
  },
  professional: {
    label: 'Pro',
    description: 'Instructor / racer',
    tip: "You're extracting the car's full potential. Mods directly translate to lap time.",
    insight: 'This represents the theoretical maximum - what the modifications can truly deliver.',
  },
};

/**
 * Estimation confidence tiers
 * Tier 1: Statistical (10+ real times) - Most accurate
 * Tier 2: Reference-scaled (pro reference) - Very reliable
 * Tier 3: Similar car interpolation - Reasonable estimate
 * Tier 4: Insufficient data - No reliable estimate
 */
export const ESTIMATION_TIERS = {
  1: { label: 'Based on real lap time data', confidence: 0.9, icon: '●●●' },
  2: { label: 'Based on professional reference', confidence: 0.8, icon: '●●○' },
  3: { label: 'Estimated from similar vehicles', confidence: 0.65, icon: '●○○' },
  4: { label: 'Insufficient data', confidence: 0, icon: '○○○' },
};

// =============================================================================
// FETCHER FUNCTIONS
// =============================================================================

/**
 * Fetch lap time estimate from API
 */
async function fetchLapTimeEstimate(params) {
  const response = await apiClient.post('/api/lap-times/estimate', params);
  return response;
}

/**
 * Fetch track statistics
 */
async function fetchTrackStats(trackSlug) {
  const response = await apiClient.get(`/api/lap-times/estimate?trackSlug=${trackSlug}`);
  return response;
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Hook to get lap time estimate for a car at a track
 *
 * @param {Object} params - Estimation parameters
 * @param {string} params.trackSlug - Track identifier
 * @param {number} params.stockHp - Stock horsepower
 * @param {number} params.currentHp - Current horsepower (with mods)
 * @param {number} params.weight - Vehicle weight
 * @param {string} params.driverSkill - Driver skill level
 * @param {Object} params.mods - Modification summary
 * @param {Object} options - Query options
 */
export function useLapTimeEstimate(params, options = {}) {
  const { trackSlug, stockHp, currentHp, weight, driverSkill, mods } = params || {};

  const enabled = options.enabled !== false && !!trackSlug;

  return useQuery({
    queryKey: lapTimeKeys.estimate({
      trackSlug,
      stockHp,
      currentHp,
      weight,
      driverSkill,
      modsHash: JSON.stringify(mods || {}),
    }),
    queryFn: () =>
      fetchLapTimeEstimate({
        trackSlug,
        stockHp,
        currentHp,
        weight,
        driverSkill,
        mods,
      }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (React Query v5: gcTime replaces cacheTime)
    ...options,
  });
}

/**
 * Hook to get track statistics
 *
 * @param {string} trackSlug - Track identifier
 * @param {Object} options - Query options
 */
export function useTrackStats(trackSlug, options = {}) {
  const enabled = options.enabled !== false && !!trackSlug;

  return useQuery({
    queryKey: lapTimeKeys.trackStats(trackSlug),
    queryFn: () => fetchTrackStats(trackSlug),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour (React Query v5: gcTime replaces cacheTime)
    ...options,
  });
}

/**
 * Format seconds to lap time string (M:SS.mmm)
 * Uses 3 decimal places for millisecond precision
 */
export function formatLapTime(seconds) {
  if (!seconds || isNaN(seconds)) return '--:--.---';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${mins}:${secs}`;
}

const lapTimeEstimateModule = {
  useLapTimeEstimate,
  useTrackStats,
  DRIVER_SKILLS,
  formatLapTime,
  lapTimeKeys,
};

export default lapTimeEstimateModule;
