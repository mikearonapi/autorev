/**
 * Analytics Module
 * 
 * Centralized analytics utilities for tracking user behavior.
 * Provides both high-level event tracking and low-level provider access.
 * 
 * @module lib/analytics
 * 
 * @example
 * // High-level API (recommended)
 * import { EVENTS, trackEvent, trackCarViewed } from '@/lib/analytics';
 * 
 * trackEvent(EVENTS.CAR_VIEWED, { car_id: '123', car_slug: 'bmw-m3' });
 * trackCarViewed({ car_id: '123', car_slug: 'bmw-m3', car_name: 'BMW M3' });
 * 
 * @example
 * // Low-level API (for custom providers)
 * import { analytics } from '@/lib/analytics';
 * import { posthogProvider, ga4Provider } from '@/lib/analytics/providers';
 * 
 * analytics.registerProvider(posthogProvider);
 * analytics.registerProvider(ga4Provider);
 * analytics.track('Custom Event', { key: 'value' });
 */

// =============================================================================
// EVENT TRACKING (High-Level API)
// =============================================================================

export {
  EVENTS,
  FUNNELS,
  trackEvent,
  identifyUser,
  resetAnalyticsIdentity,
  createEventTracker,
  // Funnel tracking
  trackFunnelStep,
  createFunnelTracker,
  trackSignupFunnel,
  trackOnboardingFunnel,
  trackCheckoutFunnel,
  trackBuildCreationFunnel,
  // Pre-built trackers
  trackCarViewed,
  trackBuildSaved,
  trackALConversationStarted,
  trackCheckoutCompleted,
  trackCTAClicked,
  trackFeatureGateHit,
  // Experiment tracking
  trackExperiment,
  trackExperimentViewed,
  trackExperimentConverted,
} from './events';

// =============================================================================
// ANALYTICS MANAGER (Low-Level API)
// =============================================================================

export { analytics, AnalyticsManager } from './manager';

// =============================================================================
// PROVIDER ADAPTERS
// =============================================================================

export { posthogProvider, ga4Provider, customProvider } from './providers';
