/**
 * Google Analytics 4 (GA4) Tracking Utilities
 * 
 * Provides typed functions for tracking GA4 conversion events.
 * All functions safely handle cases where gtag is undefined (ad blockers).
 * 
 * Events tracked:
 * - sign_up: User creates account via Google OAuth
 * - car_selector_complete: User finishes Car Selector and sees results
 * - al_conversation_start: User sends first message to AL
 * - add_to_garage: User adds a car to their garage/favorites
 * - car_detail_view: User views a car detail page
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.gtag as any)(command, ...args);
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
  trackEvent('sign_up', {
    method,
  });
}

/**
 * Track car_selector_complete conversion
 * Fire when user finishes Car Selector and sees personalized results
 */
export function trackCarSelectorComplete(params: {
  resultsCount: number;
  topCarSlug?: string;
  topCarName?: string;
  filtersApplied?: number;
}): void {
  trackEvent('car_selector_complete', {
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
  trackEvent('al_conversation_start', {
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
  trackEvent('add_to_garage', {
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
  trackEvent('car_detail_view', {
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
  trackEvent('login', {
    method,
  });
}

/**
 * Track search event
 */
export function trackSearch(searchTerm: string): void {
  trackEvent('search', {
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
  trackEvent('share', {
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
  trackCarSelectorComplete,
  trackALConversationStart,
  trackAddToGarage,
  trackCarDetailView,
  trackLogin,
  trackSearch,
  trackShare,
};

export default ga4;

