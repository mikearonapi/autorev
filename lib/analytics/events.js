/**
 * Analytics Event Schema
 * 
 * Type-safe event definitions for PostHog and other analytics providers.
 * All events follow the "Object + Past-Tense Verb" naming convention in Title Case.
 * 
 * @module lib/analytics/events
 * 
 * @example
 * import { EVENTS, trackEvent } from '@/lib/analytics/events';
 * 
 * trackEvent(EVENTS.SIGNUP_COMPLETED, { method: 'google' });
 * trackEvent(EVENTS.CAR_VIEWED, { car_id: '123', car_slug: 'bmw-m3' });
 */

// =============================================================================
// SCHEMA VERSION
// =============================================================================

/**
 * Schema version for event tracking
 * Increment when making breaking changes to event properties.
 * This allows for backwards-compatible event evolution.
 * 
 * Version history:
 * - 1.0: Initial event schema (January 2026)
 */
export const SCHEMA_VERSION = '1.0';

// =============================================================================
// EVENT DEFINITIONS
// =============================================================================

/**
 * Analytics event names
 * Format: "Object + Past-Tense Verb" in Title Case
 */
export const EVENTS = {
  // =====================
  // Authentication Events
  // =====================
  /** User creates a new account */
  SIGNUP_COMPLETED: 'Signup Completed',
  /** User logs in to existing account */
  LOGIN_COMPLETED: 'Login Completed',
  /** User logs out */
  LOGOUT_COMPLETED: 'Logout Completed',
  /** Password reset initiated */
  PASSWORD_RESET_REQUESTED: 'Password Reset Requested',
  
  // =====================
  // Onboarding Events
  // =====================
  /** Onboarding flow started */
  ONBOARDING_STARTED: 'Onboarding Started',
  /** Onboarding step completed */
  ONBOARDING_STEP_COMPLETED: 'Onboarding Step Completed',
  /** Full onboarding flow completed */
  ONBOARDING_COMPLETED: 'Onboarding Completed',
  /** User skipped onboarding */
  ONBOARDING_SKIPPED: 'Onboarding Skipped',
  
  // =====================
  // Car Discovery Events
  // =====================
  /** User views a car detail page */
  CAR_VIEWED: 'Car Viewed',
  /** User uses car search */
  CAR_SEARCHED: 'Car Searched',
  /** User applies filters */
  CARS_FILTERED: 'Cars Filtered',
  /** User compares cars */
  CARS_COMPARED: 'Cars Compared',
  
  // =====================
  // Garage Events
  // =====================
  /** User adds vehicle to garage */
  GARAGE_VEHICLE_ADDED: 'Garage Vehicle Added',
  /** User removes vehicle from garage */
  GARAGE_VEHICLE_REMOVED: 'Garage Vehicle Removed',
  /** User updates vehicle details */
  GARAGE_VEHICLE_UPDATED: 'Garage Vehicle Updated',
  /** User adds car to favorites */
  FAVORITE_ADDED: 'Favorite Added',
  /** User removes car from favorites */
  FAVORITE_REMOVED: 'Favorite Removed',
  
  // =====================
  // Build/Tuning Events
  // =====================
  /** User creates a new build project */
  BUILD_CREATED: 'Build Created',
  /** User saves build changes */
  BUILD_SAVED: 'Build Saved',
  /** User adds upgrade to build */
  BUILD_UPGRADE_ADDED: 'Build Upgrade Added',
  /** User removes upgrade from build */
  BUILD_UPGRADE_REMOVED: 'Build Upgrade Removed',
  /** User views performance calculations */
  BUILD_PERFORMANCE_VIEWED: 'Build Performance Viewed',
  /** User shares build to community */
  BUILD_SHARED: 'Build Shared',
  
  // =====================
  // AL (AI Assistant) Events
  // =====================
  /** User starts conversation with AL */
  AL_CONVERSATION_STARTED: 'AL Conversation Started',
  /** User sends message to AL */
  AL_MESSAGE_SENT: 'AL Message Sent',
  /** AL provides response */
  AL_RESPONSE_RECEIVED: 'AL Response Received',
  /** User provides feedback on AL response */
  AL_FEEDBACK_GIVEN: 'AL Feedback Given',
  /** AL credits consumed */
  AL_CREDITS_USED: 'AL Credits Used',
  
  // =====================
  // Events Calendar
  // =====================
  /** User views an event */
  EVENT_VIEWED: 'Event Viewed',
  /** User saves event */
  EVENT_SAVED: 'Event Saved',
  /** User registers for event */
  EVENT_REGISTERED: 'Event Registered',
  /** User shares event */
  EVENT_SHARED: 'Event Shared',
  
  // =====================
  // Community Events
  // =====================
  /** User views community post */
  COMMUNITY_POST_VIEWED: 'Community Post Viewed',
  /** User creates community post */
  COMMUNITY_POST_CREATED: 'Community Post Created',
  /** User likes community post */
  COMMUNITY_POST_LIKED: 'Community Post Liked',
  /** User comments on community post */
  COMMUNITY_POST_COMMENTED: 'Community Post Commented',
  
  // =====================
  // Subscription Events
  // =====================
  /** User views pricing page */
  PRICING_VIEWED: 'Pricing Viewed',
  /** User starts checkout */
  CHECKOUT_STARTED: 'Checkout Started',
  /** User completes checkout */
  CHECKOUT_COMPLETED: 'Checkout Completed',
  /** Subscription created */
  SUBSCRIPTION_CREATED: 'Subscription Created',
  /** Subscription upgraded */
  SUBSCRIPTION_UPGRADED: 'Subscription Upgraded',
  /** Subscription downgraded */
  SUBSCRIPTION_DOWNGRADED: 'Subscription Downgraded',
  /** Subscription canceled */
  SUBSCRIPTION_CANCELED: 'Subscription Canceled',
  /** User purchases AL credits */
  AL_CREDITS_PURCHASED: 'AL Credits Purchased',
  
  // =====================
  // Engagement Events
  // =====================
  /** User clicks CTA button */
  CTA_CLICKED: 'CTA Clicked',
  /** User shares content */
  CONTENT_SHARED: 'Content Shared',
  /** User submits feedback */
  FEEDBACK_SUBMITTED: 'Feedback Submitted',
  /** User contacts support */
  CONTACT_FORM_SUBMITTED: 'Contact Form Submitted',
  
  // =====================
  // Feature Discovery
  // =====================
  /** User discovers new feature */
  FEATURE_DISCOVERED: 'Feature Discovered',
  /** User hits feature gate */
  FEATURE_GATE_HIT: 'Feature Gate Hit',
  /** User upgrades after gate */
  FEATURE_GATE_CONVERTED: 'Feature Gate Converted',
  
  // =====================
  // A/B Testing & Experiments
  // =====================
  /** User is exposed to an experiment variant */
  EXPERIMENT_VIEWED: 'Experiment Viewed',
  /** User converts in an experiment (completes goal action) */
  EXPERIMENT_CONVERTED: 'Experiment Converted',
};

// =============================================================================
// EVENT PROPERTY SCHEMAS (JSDoc Type Definitions)
// =============================================================================

/**
 * @typedef {Object} SignupProperties
 * @property {'google'|'facebook'|'email'} method - Signup method used
 * @property {string} [referral_code] - Referral code if used
 */

/**
 * @typedef {Object} LoginProperties
 * @property {'google'|'facebook'|'email'} method - Login method used
 */

/**
 * @typedef {Object} CarViewedProperties
 * @property {string} car_id - Database car ID
 * @property {string} car_slug - Car URL slug
 * @property {string} car_name - Full car name
 * @property {string} [source] - How user arrived (search, browse, direct)
 */

/**
 * @typedef {Object} BuildEventProperties
 * @property {string} build_id - Build project ID
 * @property {string} car_id - Associated car ID
 * @property {string} car_slug - Associated car slug
 * @property {number} [upgrade_count] - Number of upgrades
 * @property {number} [hp_gain] - HP gain from build
 */

/**
 * @typedef {Object} ALEventProperties
 * @property {string} [conversation_id] - Conversation ID
 * @property {string} [message_id] - Message ID
 * @property {string} [query_type] - Type of query (specs, troubleshooting, etc.)
 * @property {number} [credits_used] - Credits consumed
 * @property {number} [response_time_ms] - Response latency
 * @property {'positive'|'negative'} [feedback] - User feedback
 */

/**
 * @typedef {Object} SubscriptionEventProperties
 * @property {'free'|'collector'|'tuner'} tier - Subscription tier
 * @property {number} [amount_cents] - Amount in cents
 * @property {string} [previous_tier] - Previous tier for upgrades/downgrades
 * @property {boolean} [is_trial] - Whether this is a trial
 */

/**
 * @typedef {Object} CTAClickedProperties
 * @property {string} cta_name - CTA identifier
 * @property {string} cta_location - Where on page
 * @property {string} [cta_text] - Button/link text
 */

/**
 * @typedef {Object} FeatureGateProperties
 * @property {string} feature_name - Feature being gated
 * @property {'free'|'collector'|'tuner'} required_tier - Tier needed
 * @property {'free'|'collector'|'tuner'} user_tier - User's current tier
 * @property {string} [location] - Where gate was hit
 */

// =============================================================================
// TRACKING UTILITIES
// =============================================================================

/**
 * Track an analytics event to PostHog (if available)
 * 
 * @param {string} eventName - Event name from EVENTS constant
 * @param {Object} [properties={}] - Event properties
 * @returns {void}
 * 
 * @example
 * trackEvent(EVENTS.CAR_VIEWED, { car_id: '123', car_slug: 'bmw-m3' });
 */
export function trackEvent(eventName, properties = {}) {
  // Validate event name is from our schema
  const validEvents = Object.values(EVENTS);
  if (!validEvents.includes(eventName)) {
    console.warn(`[Analytics] Unknown event: ${eventName}`);
  }
  
  // Add common properties including schema version for backwards compatibility
  const enrichedProperties = {
    ...properties,
    schema_version: SCHEMA_VERSION,
    timestamp: new Date().toISOString(),
  };
  
  // Track to PostHog
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.capture(eventName, enrichedProperties);
  }
  
  // Also track to GA4 if available (for comparison)
  if (typeof window !== 'undefined' && window.gtag) {
    // Convert to GA4 format (snake_case)
    const ga4EventName = eventName.toLowerCase().replace(/ /g, '_');
    window.gtag('event', ga4EventName, enrichedProperties);
  }
}

/**
 * Identify user in analytics (PostHog)
 * 
 * @param {string} userId - User's unique ID
 * @param {Object} [traits={}] - User traits/properties
 */
export function identifyUser(userId, traits = {}) {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.identify(userId, traits);
  }
}

/**
 * Reset analytics identity (on logout)
 */
export function resetAnalyticsIdentity() {
  if (typeof window !== 'undefined' && window.posthog) {
    window.posthog.reset();
  }
}

/**
 * Create a typed event tracker with pre-filled properties
 * 
 * @template {Object} T
 * @param {string} eventName - Event name
 * @param {Partial<T>} [defaultProperties={}] - Default properties
 * @returns {function(T): void}
 * 
 * @example
 * const trackCarViewed = createEventTracker(EVENTS.CAR_VIEWED, { source: 'browse' });
 * trackCarViewed({ car_id: '123', car_slug: 'bmw-m3', car_name: 'BMW M3' });
 */
export function createEventTracker(eventName, defaultProperties = {}) {
  return (properties) => {
    trackEvent(eventName, { ...defaultProperties, ...properties });
  };
}

// =============================================================================
// FUNNEL TRACKING
// =============================================================================

/**
 * @typedef {Object} FunnelStepProperties
 * @property {string} funnel_name - Name of the funnel (e.g., 'signup', 'checkout', 'onboarding')
 * @property {number} step_number - Step number in the funnel (1-indexed)
 * @property {string} step_name - Human-readable step name
 * @property {Object} [additional_props] - Additional properties for this step
 */

/**
 * Track a funnel step completion
 * 
 * Use this for consistent funnel tracking across the app.
 * Each funnel should have steps numbered from 1.
 * 
 * @param {number} step - Step number (1-indexed)
 * @param {string} stepName - Human-readable step name
 * @param {string} funnelName - Funnel identifier (e.g., 'signup', 'checkout', 'onboarding')
 * @param {Object} [additionalProps={}] - Additional properties for this step
 * 
 * @example
 * // Signup funnel
 * trackFunnelStep(1, 'Email Entered', 'signup');
 * trackFunnelStep(2, 'Password Created', 'signup');
 * trackFunnelStep(3, 'Profile Completed', 'signup');
 * 
 * // Checkout funnel with additional properties
 * trackFunnelStep(1, 'Cart Viewed', 'checkout', { item_count: 3, cart_value: 299 });
 * trackFunnelStep(2, 'Shipping Selected', 'checkout', { shipping_method: 'express' });
 * trackFunnelStep(3, 'Payment Completed', 'checkout', { payment_method: 'card' });
 */
export function trackFunnelStep(step, stepName, funnelName, additionalProps = {}) {
  trackEvent('Funnel Step Completed', {
    funnel_name: funnelName,
    step_number: step,
    step_name: stepName,
    ...additionalProps,
  });
}

/**
 * Pre-defined funnel names for consistency
 */
export const FUNNELS = {
  /** User signup/registration flow */
  SIGNUP: 'signup',
  /** User onboarding after signup */
  ONBOARDING: 'onboarding',
  /** Subscription checkout flow */
  CHECKOUT: 'checkout',
  /** Build creation flow */
  BUILD_CREATION: 'build_creation',
  /** Vehicle addition to garage */
  GARAGE_ADDITION: 'garage_addition',
  /** AL chat interaction */
  AL_CONVERSATION: 'al_conversation',
};

/**
 * Create a funnel tracker for a specific funnel
 * 
 * @param {string} funnelName - Name of the funnel
 * @returns {function(number, string, Object=): void}
 * 
 * @example
 * const trackSignupFunnel = createFunnelTracker('signup');
 * trackSignupFunnel(1, 'Email Entered');
 * trackSignupFunnel(2, 'Password Created');
 */
export function createFunnelTracker(funnelName) {
  return (step, stepName, additionalProps = {}) => {
    trackFunnelStep(step, stepName, funnelName, additionalProps);
  };
}

// Pre-built funnel trackers
export const trackSignupFunnel = createFunnelTracker(FUNNELS.SIGNUP);
export const trackOnboardingFunnel = createFunnelTracker(FUNNELS.ONBOARDING);
export const trackCheckoutFunnel = createFunnelTracker(FUNNELS.CHECKOUT);
export const trackBuildCreationFunnel = createFunnelTracker(FUNNELS.BUILD_CREATION);

// =============================================================================
// PRE-BUILT TRACKERS
// =============================================================================

/**
 * Track car viewed event
 * @param {CarViewedProperties} properties
 */
export const trackCarViewed = createEventTracker(EVENTS.CAR_VIEWED);

/**
 * Track build saved event
 * @param {BuildEventProperties} properties
 */
export const trackBuildSaved = createEventTracker(EVENTS.BUILD_SAVED);

/**
 * Track AL conversation started
 * @param {ALEventProperties} properties
 */
export const trackALConversationStarted = createEventTracker(EVENTS.AL_CONVERSATION_STARTED);

/**
 * Track checkout completed
 * @param {SubscriptionEventProperties} properties
 */
export const trackCheckoutCompleted = createEventTracker(EVENTS.CHECKOUT_COMPLETED);

/**
 * Track CTA clicked
 * @param {CTAClickedProperties} properties
 */
export const trackCTAClicked = createEventTracker(EVENTS.CTA_CLICKED);

/**
 * Track feature gate hit
 * @param {FeatureGateProperties} properties
 */
export const trackFeatureGateHit = createEventTracker(EVENTS.FEATURE_GATE_HIT);

// =============================================================================
// EXPERIMENT TRACKING
// =============================================================================

/**
 * @typedef {Object} ExperimentProperties
 * @property {string} experiment_key - The experiment/feature flag key
 * @property {string|boolean} variant - The variant the user was assigned
 * @property {boolean} [enabled] - Whether the experiment variant is enabled
 * @property {number} [value] - Conversion value (for revenue experiments)
 * @property {string} [goal] - The conversion goal achieved
 */

/**
 * Track experiment exposure (when user sees an experiment variant)
 * 
 * @param {string} experimentKey - The experiment key
 * @param {string|boolean} variant - The variant the user was assigned
 * @param {Object} [additionalProps] - Additional properties
 * 
 * @example
 * trackExperimentViewed('checkout-redesign', 'variant-b');
 */
export function trackExperimentViewed(experimentKey, variant, additionalProps = {}) {
  trackEvent(EVENTS.EXPERIMENT_VIEWED, {
    experiment_key: experimentKey,
    variant: variant ?? 'control',
    ...additionalProps,
  });
}

/**
 * Track experiment conversion (when user completes the goal action)
 * 
 * @param {string} experimentKey - The experiment key
 * @param {string|boolean} variant - The variant the user was in
 * @param {Object} [additionalProps] - Additional properties (value, goal, etc.)
 * 
 * @example
 * trackExperimentConverted('checkout-redesign', 'variant-b', { value: 99.99 });
 */
export function trackExperimentConverted(experimentKey, variant, additionalProps = {}) {
  trackEvent(EVENTS.EXPERIMENT_CONVERTED, {
    experiment_key: experimentKey,
    variant: variant ?? 'unknown',
    ...additionalProps,
  });
}

/**
 * Unified experiment tracking helper
 * 
 * @param {string} experimentKey - The experiment key
 * @param {string|boolean} variant - The variant
 * @param {boolean} [converted=false] - Whether this is a conversion event
 * @param {Object} [additionalProps] - Additional properties
 * 
 * @example
 * // Track exposure
 * trackExperiment('pricing-test', 'variant-a');
 * 
 * // Track conversion
 * trackExperiment('pricing-test', 'variant-a', true, { plan: 'tuner' });
 */
export function trackExperiment(experimentKey, variant, converted = false, additionalProps = {}) {
  if (converted) {
    trackExperimentConverted(experimentKey, variant, additionalProps);
  } else {
    trackExperimentViewed(experimentKey, variant, additionalProps);
  }
}

export default {
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
};
