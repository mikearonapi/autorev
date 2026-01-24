/**
 * Google Analytics 4 (GA4) Tracking Utilities
 * 
 * Provides typed functions for tracking GA4 conversion events.
 * All functions safely handle cases where gtag is undefined (ad blockers).
 * 
 * NAMING CONVENTION: "Object + Past-Tense Verb" in Title Case
 * 
 * Events tracked:
 * - Sign Up: User creates account via Google OAuth
 * - Car Selector Completed: User finishes Car Selector and sees results
 * - AL Conversation Started: User sends first message to AL
 * - Garage Vehicle Added: User adds a car to their garage/favorites
 * - Car Detail Viewed: User views a car detail page
 * 
 * @module lib/ga4
 */

// GA4 Measurement ID from environment
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Safely call gtag function
 * Handles cases where gtag is undefined (ad blockers, script not loaded)
 */
function safeGtag(
  command: 'config' | 'event' | 'js' | 'set' | 'consent',
  ...args: unknown[]
): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  if (!GA_MEASUREMENT_ID) return;
  
  try {
    (window.gtag as Function)(command, ...args);
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.warn('[GA4] gtag call failed:', error);
  }
}

/**
 * Track page view (auto-tracked by GA4, but available for manual SPA routing)
 */
export function trackPageView(url: string, title?: string): void {
  safeGtag('config', GA_MEASUREMENT_ID!, {
    page_path: url,
    page_title: title,
  });
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  parameters?: Record<string, string | number | boolean | undefined>
): void {
  safeGtag('event', eventName, parameters);
}

// ============================================
// CONVERSION EVENTS
// ============================================

/**
 * Track sign_up conversion
 * Fire when user creates account via Google OAuth
 */
export function trackSignUp(method: string = 'google'): void {
  trackEvent('Sign Up', {
    method,
  });
}

// ============================================
// BUILD FUNNEL CONVERSIONS (Primary metrics)
// ============================================

/**
 * Track tuning_shop_visit conversion
 * Fire when user first visits the Tuning Shop / Build Planner
 */
export function trackTuningShopVisit(params: {
  entryPoint?: string;
  isAuthenticated: boolean;
}): void {
  trackEvent('Tuning Shop Visited', {
    entry_point: params.entryPoint,
    is_authenticated: params.isAuthenticated,
  });
}

/**
 * Track build_car_selected conversion
 * Fire when user selects a car to build/configure
 */
export function trackBuildCarSelected(params: {
  carSlug: string;
  carName: string;
  carCategory?: string;
}): void {
  trackEvent('Build Car Selected', {
    car_slug: params.carSlug,
    car_name: params.carName,
    car_category: params.carCategory,
  });
}

/**
 * Track build_mod_added conversion
 * Fire when user adds a modification to their build
 */
export function trackBuildModAdded(params: {
  carSlug: string;
  modCategory: string;
  modName: string;
  estimatedCost?: number;
  estimatedHpGain?: number;
}): void {
  trackEvent('Build Mod Added', {
    car_slug: params.carSlug,
    mod_category: params.modCategory,
    mod_name: params.modName,
    estimated_cost: params.estimatedCost,
    estimated_hp_gain: params.estimatedHpGain,
  });
}

/**
 * Track build_project_saved conversion
 * Fire when user saves their build project
 */
export function trackBuildProjectSaved(params: {
  carSlug: string;
  carName: string;
  totalMods: number;
  estimatedTotalCost?: number;
  estimatedTotalHpGain?: number;
  isFirstProject: boolean;
}): void {
  trackEvent('Build Project Saved', {
    car_slug: params.carSlug,
    car_name: params.carName,
    total_mods: params.totalMods,
    estimated_total_cost: params.estimatedTotalCost,
    estimated_total_hp_gain: params.estimatedTotalHpGain,
    is_first_project: params.isFirstProject,
  });
}

/**
 * Track build_shared conversion
 * Fire when user shares their build with the community
 */
export function trackBuildShared(params: {
  carSlug: string;
  shareMethod: string;
  totalMods: number;
}): void {
  trackEvent('Build Shared', {
    car_slug: params.carSlug,
    share_method: params.shareMethod,
    total_mods: params.totalMods,
  });
}

/**
 * Track part_pricing_clicked conversion
 * Fire when user clicks to view part pricing/purchase link
 */
export function trackPartPricingClicked(params: {
  partId: string;
  partName: string;
  partCategory: string;
  carSlug?: string;
  vendor?: string;
}): void {
  trackEvent('Part Pricing Clicked', {
    part_id: params.partId,
    part_name: params.partName,
    part_category: params.partCategory,
    car_slug: params.carSlug,
    vendor: params.vendor,
  });
}

/**
 * Track al_build_chat conversion
 * Fire when user asks AL a build-related question
 */
export function trackALBuildChat(params: {
  carSlug?: string;
  questionType?: string;
  page?: string;
}): void {
  trackEvent('AL Build Chat', {
    car_slug: params.carSlug,
    question_type: params.questionType,
    page: params.page,
  });
}

// ============================================
// LEGACY CONVERSION EVENTS (kept for backwards compatibility)
// ============================================

/**
 * Track car_selector_complete conversion
 * @deprecated Use Build funnel events instead
 */
export function trackCarSelectorComplete(params: {
  resultsCount: number;
  topCarSlug?: string;
  topCarName?: string;
  filtersApplied?: number;
}): void {
  trackEvent('Car Selector Completed', {
    results_count: params.resultsCount,
    top_car_slug: params.topCarSlug,
    top_car_name: params.topCarName,
    filters_applied: params.filtersApplied,
  });
}

/**
 * Track al_conversation_start conversion
 * Fire when user sends their first message to AL in a session
 */
export function trackALConversationStart(params: {
  carSlug?: string;
  carName?: string;
  page?: string;
}): void {
  trackEvent('AL Conversation Started', {
    car_slug: params.carSlug,
    car_name: params.carName,
    page: params.page,
  });
}

/**
 * Track add_to_garage conversion
 * Fire when user adds a car to their garage (favorites)
 */
export function trackAddToGarage(params: {
  carSlug: string;
  carName: string;
  carCategory?: string;
  isAuthenticated: boolean;
}): void {
  trackEvent('Garage Vehicle Added', {
    car_slug: params.carSlug,
    car_name: params.carName,
    car_category: params.carCategory,
    is_authenticated: params.isAuthenticated,
  });
}

/**
 * Track car_detail_view conversion
 * Fire when user views a car detail page
 */
export function trackCarDetailView(params: {
  carSlug: string;
  carName: string;
  carCategory?: string;
  priceRange?: string;
}): void {
  trackEvent('Car Detail Viewed', {
    car_slug: params.carSlug,
    car_name: params.carName,
    car_category: params.carCategory,
    price_range: params.priceRange,
  });
}

// ============================================
// ADDITIONAL USEFUL EVENTS
// ============================================

/**
 * Track login event
 */
export function trackLogin(method: string = 'google'): void {
  trackEvent('Login', {
    method,
  });
}

/**
 * Track search event
 */
export function trackSearch(searchTerm: string): void {
  trackEvent('Search Performed', {
    search_term: searchTerm,
  });
}

/**
 * Track share event
 */
export function trackShare(params: {
  method: string;
  contentType: string;
  itemId?: string;
}): void {
  trackEvent('Share', {
    method: params.method,
    content_type: params.contentType,
    item_id: params.itemId,
  });
}

// Export all functions
export const ga4 = {
  trackPageView,
  trackEvent,
  trackSignUp,
  // Build funnel (primary)
  trackTuningShopVisit,
  trackBuildCarSelected,
  trackBuildModAdded,
  trackBuildProjectSaved,
  trackBuildShared,
  trackPartPricingClicked,
  trackALBuildChat,
  // Legacy (backwards compatibility)
  trackCarSelectorComplete,
  trackALConversationStart,
  trackAddToGarage,
  trackCarDetailView,
  trackLogin,
  trackSearch,
  trackShare,
};

export default ga4;

