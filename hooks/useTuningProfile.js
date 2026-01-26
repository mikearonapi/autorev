/**
 * useTuningProfile Hook
 * 
 * Fetches vehicle-specific tuning profile from car_tuning_profiles table.
 * Falls back to generic upgrade data when no profile exists.
 * 
 * Updated to use React Query for caching and deduplication.
 */

import { useMemo, useCallback } from 'react';

import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

// Cache time for tuning profiles (5 minutes)
const TUNING_PROFILE_STALE_TIME = 5 * 60 * 1000;

// Query key factory
const tuningKeys = {
  all: ['tuning'],
  profiles: (carId) => [...tuningKeys.all, 'profiles', carId],
};

/**
 * Fetch tuning profiles from Supabase
 */
async function fetchTuningProfiles(carId) {
  if (!carId || !supabase) {
    return [];
  }

  const { data: profiles, error: fetchError } = await supabase
    .from('car_tuning_profiles')
    .select(`
      *,
      car_variants:car_variant_id (
        id,
        display_name,
        engine
      )
    `)
    .eq('car_id', carId);

  if (fetchError) {
    throw fetchError;
  }

  return profiles || [];
}

/**
 * Hook to fetch and manage tuning profile for a car
 * @param {Object} car - The car object
 * @param {string} variantId - Optional variant UUID
 * @param {string} tuningFocus - Optional focus (performance, off-road, towing)
 * @returns {Object} - { profile, loading, error, hasProfile }
 */
export function useTuningProfile(car, variantId = null, tuningFocus = 'performance') {
  // Use React Query for data fetching with caching
  const {
    data: allProfiles = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: tuningKeys.profiles(car?.id),
    queryFn: () => fetchTuningProfiles(car?.id),
    staleTime: TUNING_PROFILE_STALE_TIME,
    enabled: !!car?.id && !!supabase,
  });

  // Memoize profile selection logic
  const profile = useMemo(() => {
    if (!allProfiles || allProfiles.length === 0) {
      return null;
    }

    // First, try exact match with variant and focus
    if (variantId) {
      const exactMatch = allProfiles.find(p => 
        p.car_variant_id === variantId && p.tuning_focus === tuningFocus
      );
      if (exactMatch) return exactMatch;
    }

    // If no variant match, find by focus
    const focusMatch = allProfiles.find(p => p.tuning_focus === tuningFocus);
    if (focusMatch) return focusMatch;

    // If still no match, just take the first one
    return allProfiles[0];
  }, [allProfiles, variantId, tuningFocus]);

  // Helper to get profile for specific variant
  const getProfileForVariant = useCallback(
    (vId) => allProfiles.find(p => p.car_variant_id === vId),
    [allProfiles]
  );

  return {
    profile,
    allProfiles,
    loading,
    error: queryError?.message || null,
    hasProfile: Boolean(profile),
    getProfileForVariant,
  };
}

/**
 * Get formatted stage progressions from profile
 * @param {Object} profile - Tuning profile
 * @param {number} stockWhp - Stock wheel HP (for computing total)
 * @returns {Object[]} - Formatted stages
 */
export function getFormattedStages(profile, stockWhp = null) {
  if (!profile?.stage_progressions) return [];

  const baseWhp = stockWhp || profile.stock_whp || 0;

  return profile.stage_progressions.map((stage, index) => ({
    ...stage,
    // Compute display values
    hpGainDisplay: stage.hpGainLow && stage.hpGainHigh
      ? `+${stage.hpGainLow}-${stage.hpGainHigh} HP`
      : stage.hpGainLow
        ? `+${stage.hpGainLow}+ HP`
        : 'Handling focus',
    torqueGainDisplay: stage.torqueGainLow && stage.torqueGainHigh
      ? `+${stage.torqueGainLow}-${stage.torqueGainHigh} TQ`
      : null,
    costDisplay: stage.costLow && stage.costHigh
      ? `$${stage.costLow.toLocaleString()} - $${stage.costHigh.toLocaleString()}`
      : stage.costLow
        ? `$${stage.costLow.toLocaleString()}+`
        : 'Varies',
    // Computed total HP at this stage
    totalHpLow: baseWhp && stage.hpGainLow ? baseWhp + stage.hpGainLow : null,
    totalHpHigh: baseWhp && stage.hpGainHigh ? baseWhp + stage.hpGainHigh : null,
    // Stage index for display
    stageIndex: index
  }));
}

/**
 * Get formatted tuning platforms from profile
 * @param {Object} profile - Tuning profile
 * @returns {Object[]} - Formatted platforms
 */
export function getFormattedPlatforms(profile) {
  if (!profile?.tuning_platforms) return [];

  return profile.tuning_platforms.map(platform => ({
    ...platform,
    priceDisplay: platform.priceLow && platform.priceHigh
      ? `$${platform.priceLow} - $${platform.priceHigh}`
      : platform.priceLow
        ? `$${platform.priceLow}+`
        : 'Contact for pricing'
  }));
}

/**
 * Get formatted power limits from profile
 * @param {Object} profile - Tuning profile
 * @returns {Object[]} - Formatted power limits
 */
export function getFormattedPowerLimits(profile) {
  if (!profile?.power_limits) return [];

  // Map for both camelCase and snake_case keys
  const nameMap = {
    // camelCase keys
    stockTurbo: 'Stock Turbo',
    stockFuelSystem: 'Stock Fuel System',
    stockTransmission: 'Transmission',
    stockInternals: 'Stock Internals',
    is38Turbo: 'IS38 Turbo (R)',
    stockDSG: 'Stock DSG',
    stockEngine: 'Stock Engine',
    stockAxles: 'Stock Axles',
    stockClutch: 'Stock Clutch',
    stockRods: 'Stock Rods',
    stockPistons: 'Stock Pistons',
    stockHeadGasket: 'Stock Head Gasket',
    stockValvetrain: 'Stock Valvetrain',
    stockOilPump: 'Stock Oil Pump',
    stockDifferential: 'Stock Differential',
    // snake_case keys (from database/AI)
    stock_turbo: 'Stock Turbo',
    stock_turbo_whp: 'Stock Turbo',
    stock_fuel_system: 'Stock Fuel System',
    stock_fuel_system_hp: 'Stock Fuel System',
    stock_transmission: 'Transmission',
    stock_transmission_tq: 'Transmission',
    stock_internals: 'Stock Internals',
    stock_internals_hp: 'Stock Internals',
    stock_internals_whp: 'Stock Internals',
    is38_turbo: 'IS38 Turbo (R)',
    stock_dsg: 'Stock DSG',
    stock_dsg_tq: 'Stock DSG',
    stock_engine: 'Stock Engine',
    stock_axles: 'Stock Axles',
    stock_axles_tq: 'Stock Axles',
    stock_clutch: 'Stock Clutch',
    stock_clutch_tq: 'Stock Clutch',
    stock_rods: 'Stock Rods',
    stock_rods_hp: 'Stock Rods',
    stock_pistons: 'Stock Pistons',
    stock_pistons_hp: 'Stock Pistons',
    stock_head_gasket: 'Stock Head Gasket',
    stock_valvetrain: 'Stock Valvetrain',
    stock_oil_pump: 'Stock Oil Pump',
    stock_differential: 'Stock Differential',
    stock_differential_tq: 'Stock Differential'
  };

  /**
   * Format a snake_case or camelCase key to human-readable title
   */
  const formatKey = (key) => {
    if (nameMap[key]) return nameMap[key];
    
    // Handle snake_case: stock_internals_hp -> Stock Internals HP
    if (key.includes('_')) {
      return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .replace(/\b(Hp|Whp|Tq)\b/gi, (match) => match.toUpperCase()); // Keep HP, WHP, TQ uppercase
    }
    
    // Handle camelCase: stockInternals -> Stock Internals
    return key.replace(/([A-Z])/g, ' $1').trim();
  };

  return Object.entries(profile.power_limits).map(([key, limit]) => {
    // Extract numeric value from the limit object
    let value = 'N/A';
    if (typeof limit === 'object' && limit !== null) {
      if (limit.whp) value = `${limit.whp} WHP`;
      else if (limit.hp) value = `${limit.hp} HP`;
      else if (limit.tq) value = `${limit.tq} TQ`;
      else if (limit.value) value = limit.value; // Direct value
    } else if (typeof limit === 'number') {
      // If limit is just a number, infer unit from key
      const unit = key.toLowerCase().includes('tq') ? 'TQ' : 
                   key.toLowerCase().includes('whp') ? 'WHP' : 'HP';
      value = `${limit} ${unit}`;
    } else if (typeof limit === 'string') {
      value = limit;
    }

    return {
      key,
      name: formatKey(key),
      value,
      notes: (typeof limit === 'object' && limit?.notes) || null
    };
  });
}

/**
 * Get brand recommendations as category array
 * @param {Object} profile - Tuning profile
 * @returns {Object[]} - Brand recommendations by category
 */
export function getFormattedBrands(profile) {
  if (!profile?.brand_recommendations) return [];

  const nameMap = {
    intakes: 'Intakes',
    exhausts: 'Exhausts',
    intercoolers: 'Intercoolers',
    superchargers: 'Superchargers',
    tuners: 'Tuners',
    downpipes: 'Downpipes',
    suspension: 'Suspension',
    brakes: 'Brakes',
    wheels: 'Wheels',
    lifts: 'Lift Kits',
    bumpers: 'Bumpers/Armor',
    winches: 'Winches',
    tires: 'Tires',
    armor: 'Armor/Skid Plates'
  };

  return Object.entries(profile.brand_recommendations)
    .filter(([, brands]) => Array.isArray(brands) && brands.length > 0)
    .map(([key, brands]) => ({
      key,
      name: nameMap[key] || key.charAt(0).toUpperCase() + key.slice(1),
      brands
    }));
}

/**
 * Get YouTube insights from profile
 * @param {Object} profile - Tuning profile
 * @returns {Object} - YouTube insights
 */
export function getYouTubeInsights(profile) {
  if (!profile?.youtube_insights) {
    return {
      hasData: false,
      videoCount: 0,
      sentiment: null,
      sentimentLabel: null,
      pros: [],
      cons: [],
      tuners: [],
      brands: [],
      quotes: []
    };
  }

  const insights = profile.youtube_insights;
  const sentiment = insights.avgAftermarketSentiment;

  return {
    hasData: (insights.videoCount || 0) > 0,
    videoCount: insights.videoCount || 0,
    sentiment: sentiment ? Math.round(sentiment * 100) : null,
    sentimentLabel: sentiment >= 0.8 ? 'Excellent' : sentiment >= 0.6 ? 'Good' : sentiment >= 0.4 ? 'Fair' : 'Limited',
    pros: insights.commonPros || [],
    cons: insights.commonCons || [],
    tuners: insights.tunerMentions || [],
    brands: insights.brandMentions || [],
    quotes: insights.keyQuotes || []
  };
}

// ============================================================================
// NEW: Objective-Based Upgrade Functions (consolidated data)
// ============================================================================

/**
 * Get upgrades organized by objective from consolidated data
 * @param {Object} profile - Tuning profile
 * @returns {Object} - Upgrades by objective { power: [], handling: [], ... }
 */
export function getUpgradesByObjective(profile) {
  if (!profile?.upgrades_by_objective) {
    return {
      power: [],
      handling: [],
      braking: [],
      cooling: [],
      sound: [],
      aero: []
    };
  }
  return profile.upgrades_by_objective;
}

/**
 * Get platform insights from consolidated data
 * @param {Object} profile - Tuning profile
 * @returns {Object} - Platform insights { strengths: [], weaknesses: [], community_tips: [], youtube_insights: {} }
 */
export function getPlatformInsights(profile) {
  if (!profile?.platform_insights) {
    return {
      strengths: [],
      weaknesses: [],
      community_tips: [],
      youtube_insights: {}
    };
  }
  return profile.platform_insights;
}

/**
 * Get data quality tier
 * @param {Object} profile - Tuning profile
 * @returns {Object} - { tier: string, label: string, description: string }
 */
export function getDataQualityInfo(profile) {
  const tier = profile?.data_quality_tier || 'unknown';
  
  const tierInfo = {
    verified: {
      tier: 'verified',
      label: 'Verified',
      description: 'Manually verified data from multiple trusted sources',
      color: '#10b981' // green
    },
    researched: {
      tier: 'researched',
      label: 'Researched',
      description: 'Data from 3+ sources including static files, database, and YouTube',
      color: '#3b82f6' // blue
    },
    enriched: {
      tier: 'enriched',
      label: 'Enriched',
      description: 'Data from 2 sources, may include auto-extracted content',
      color: '#8b5cf6' // purple
    },
    templated: {
      tier: 'templated',
      label: 'Basic',
      description: 'Limited data from a single source',
      color: '#f59e0b' // yellow
    },
    skeleton: {
      tier: 'skeleton',
      label: 'Limited',
      description: 'Minimal data available - contributions welcome',
      color: '#6b7280' // gray
    },
    unknown: {
      tier: 'unknown',
      label: 'Unknown',
      description: 'Data quality not yet assessed',
      color: '#6b7280' // gray
    }
  };
  
  return tierInfo[tier] || tierInfo.unknown;
}

/**
 * Get total upgrade count across all objectives
 * @param {Object} profile - Tuning profile
 * @returns {number} - Total number of upgrades
 */
export function getTotalUpgradeCount(profile) {
  const objectives = profile?.upgrades_by_objective || {};
  return Object.values(objectives).reduce((sum, arr) => sum + (arr?.length || 0), 0);
}

/**
 * Check if profile has consolidated objective-based data
 * @param {Object} profile - Tuning profile
 * @returns {boolean}
 */
export function hasObjectiveData(profile) {
  return getTotalUpgradeCount(profile) > 0;
}

/**
 * Get curated upgrade packages from profile
 * @param {Object} profile - Tuning profile
 * @returns {Array} - Curated packages array
 */
export function getCuratedPackages(profile) {
  return profile?.curated_packages || [];
}

/**
 * Get upgrades for a specific objective
 * @param {Object} profile - Tuning profile
 * @param {string} objective - Objective key (power, handling, braking, etc.)
 * @returns {Array} - Upgrades for that objective
 */
export function getUpgradesForObjective(profile, objective) {
  const objectives = profile?.upgrades_by_objective || {};
  return objectives[objective] || [];
}

export default useTuningProfile;
