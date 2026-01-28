'use client';

/**
 * App Configuration Hook
 * 
 * Provides React hooks and context for accessing app configuration from Supabase.
 * All configuration is now stored in the app_config table.
 * 
 * This hook preloads configs on mount and provides synchronous access after loading.
 * 
 * @example
 * // In a component:
 * const { tierConfig, categories, isLoading } = useAppConfig();
 * if (isLoading) return <Loading />;
 * // Use tierConfig, categories synchronously
 */

import { createContext, useContext, useState, useEffect, useMemo } from 'react';

import { fetchConfigs } from '@/lib/configClient.js';

// All config keys we need to preload (single batch fetch instead of 7 separate requests)
const CONFIG_KEYS = [
  'tierConfig',
  'categories', 
  'recommendationTypes',
  'priorityDescriptors',
  'performanceCategories',
  'upgradeTiers',
  'upgradeModuleCategories',
];

// Default values (used during loading and as fallback)
const DEFAULT_CONFIG = {
  tierConfig: {
    premium: { label: 'Premium', priceRange: '$75K+', order: 1 },
    'upper-mid': { label: 'Upper', priceRange: '$55-75K', order: 2 },
    mid: { label: 'Mid', priceRange: '$40-55K', order: 3 },
    budget: { label: 'Entry', priceRange: '$25-40K', order: 4 },
  },
  categories: [],
  recommendationTypes: [],
  priorityDescriptors: {},
  performanceCategories: [],
  upgradeTiers: {},
  upgradeModuleCategories: [],
  isLoading: true,
  error: null,
};

// Context
const AppConfigContext = createContext(DEFAULT_CONFIG);

/**
 * Provider component that fetches and provides app configuration
 */
export function AppConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG);

  useEffect(() => {
    let mounted = true;

    async function loadConfigs() {
      try {
        // Batch fetch all configs in a SINGLE request (reduces from 7 requests to 1)
        const configs = await fetchConfigs(CONFIG_KEYS);

        if (mounted) {
          setConfig({
            tierConfig: configs.tierConfig || DEFAULT_CONFIG.tierConfig,
            categories: configs.categories || [],
            recommendationTypes: configs.recommendationTypes || [],
            priorityDescriptors: configs.priorityDescriptors || {},
            performanceCategories: configs.performanceCategories || [],
            upgradeTiers: configs.upgradeTiers || {},
            upgradeModuleCategories: configs.upgradeModuleCategories || [],
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        console.error('[useAppConfig] Failed to load configs:', err);
        if (mounted) {
          setConfig(prev => ({
            ...prev,
            isLoading: false,
            error: err.message,
          }));
        }
      }
    }

    loadConfigs();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AppConfigContext.Provider value={config}>
      {children}
    </AppConfigContext.Provider>
  );
}

/**
 * Hook to access all app configuration
 * @returns {Object} Config object with tierConfig, categories, etc.
 */
export function useAppConfig() {
  return useContext(AppConfigContext);
}

/**
 * Hook to get tier configuration
 * @returns {{ tierConfig: Object, isLoading: boolean }}
 */
export function useTierConfig() {
  const { tierConfig, isLoading, error } = useAppConfig();
  return { tierConfig, isLoading, error };
}

/**
 * Hook to get advisory categories
 * @returns {{ categories: Array, isLoading: boolean }}
 */
export function useCategories() {
  const { categories, isLoading, error } = useAppConfig();
  return { categories, isLoading, error };
}

/**
 * Hook to get recommendation types
 * @returns {{ recommendationTypes: Array, isLoading: boolean }}
 */
export function useRecommendationTypes() {
  const { recommendationTypes, isLoading, error } = useAppConfig();
  return { recommendationTypes, isLoading, error };
}

/**
 * Hook to get priority descriptors for selector UI
 * @returns {{ priorityDescriptors: Object, isLoading: boolean }}
 */
export function usePriorityDescriptors() {
  const { priorityDescriptors, isLoading, error } = useAppConfig();
  return { priorityDescriptors, isLoading, error };
}

/**
 * Hook to get performance categories for Performance HUB
 * @returns {{ performanceCategories: Array, isLoading: boolean }}
 */
export function usePerformanceCategories() {
  const { performanceCategories, isLoading, error } = useAppConfig();
  return { performanceCategories, isLoading, error };
}

/**
 * Hook to get upgrade tiers
 * @returns {{ upgradeTiers: Object, isLoading: boolean }}
 */
export function useUpgradeTiers() {
  const { upgradeTiers, isLoading, error } = useAppConfig();
  return { upgradeTiers, isLoading, error };
}

/**
 * Hook to get upgrade module categories
 * @returns {{ upgradeModuleCategories: Array, isLoading: boolean }}
 */
export function useUpgradeModuleCategories() {
  const { upgradeModuleCategories, isLoading, error } = useAppConfig();
  return { upgradeModuleCategories, isLoading, error };
}

/**
 * Get descriptor text for a specific priority and value
 * @param {string} key - Priority key (e.g., 'sound', 'track')
 * @param {number} value - Slider value (0-3)
 * @returns {string} - Descriptor text
 */
export function useDescriptorForValue(key, value) {
  const { priorityDescriptors } = useAppConfig();
  
  return useMemo(() => {
    const descriptor = priorityDescriptors[key];
    if (!descriptor?.levels) return '';

    // Find the closest matching level
    const levels = Object.keys(descriptor.levels)
      .map(Number)
      .sort((a, b) => a - b);
    
    const closestLevel = levels.reduce((prev, curr) => 
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );

    return descriptor.levels[closestLevel] || '';
  }, [priorityDescriptors, key, value]);
}

/**
 * Utility: Get descriptor for value (non-hook version for use in callbacks)
 * Must be called within AppConfigProvider context
 */
export function getDescriptorForValueSync(priorityDescriptors, key, value) {
  const descriptor = priorityDescriptors[key];
  if (!descriptor?.levels) return '';

  const levels = Object.keys(descriptor.levels)
    .map(Number)
    .sort((a, b) => a - b);
  
  const closestLevel = levels.reduce((prev, curr) => 
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );

  return descriptor.levels[closestLevel] || '';
}

export default useAppConfig;

