/**
 * Analytics Type Definitions
 * 
 * Type-safe event schemas using TypeScript discriminated unions.
 * All events follow the "Object + Past-Tense Verb" naming convention.
 * 
 * @module lib/analytics/types
 */

// =============================================================================
// EVENT PROPERTY INTERFACES
// =============================================================================

/** Properties for signup events */
export interface SignupProperties {
  method: 'google' | 'facebook' | 'email';
  referral_code?: string;
}

/** Properties for login events */
export interface LoginProperties {
  method: 'google' | 'facebook' | 'email';
}

/** Properties for car viewed events */
export interface CarViewedProperties {
  car_id: string;
  car_slug: string;
  car_name: string;
  source?: 'search' | 'browse' | 'direct' | 'recommendation' | 'comparison';
}

/** Properties for car search events */
export interface CarSearchedProperties {
  query: string;
  results_count: number;
  filters_applied?: Record<string, unknown>;
}

/** Properties for build events */
export interface BuildEventProperties {
  build_id: string;
  car_id: string;
  car_slug: string;
  upgrade_count?: number;
  hp_gain?: number;
  total_cost?: number;
}

/** Properties for build upgrade events */
export interface BuildUpgradeProperties {
  build_id: string;
  car_id: string;
  upgrade_category: string;
  upgrade_name: string;
  upgrade_cost?: number;
  hp_gain?: number;
}

/** Properties for AL (AI Assistant) events */
export interface ALEventProperties {
  conversation_id?: string;
  message_id?: string;
  query_type?: 'specs' | 'troubleshooting' | 'maintenance' | 'comparison' | 'general';
  credits_used?: number;
  response_time_ms?: number;
  feedback?: 'positive' | 'negative';
  car_context?: string;
}

/** Properties for subscription events */
export interface SubscriptionEventProperties {
  tier: 'free' | 'collector' | 'tuner';
  amount_cents?: number;
  previous_tier?: 'free' | 'collector' | 'tuner';
  is_trial?: boolean;
  payment_method?: 'card' | 'apple_pay' | 'google_pay';
}

/** Properties for CTA click events */
export interface CTAClickedProperties {
  cta_name: string;
  cta_location: string;
  cta_text?: string;
  destination?: string;
}

/** Properties for feature gate events */
export interface FeatureGateProperties {
  feature_name: string;
  required_tier: 'free' | 'collector' | 'tuner';
  user_tier: 'free' | 'collector' | 'tuner';
  location?: string;
}

/** Properties for garage events */
export interface GarageEventProperties {
  vehicle_id?: string;
  car_id?: string;
  car_slug?: string;
  car_name?: string;
  year?: number;
  make?: string;
  model?: string;
}

/** Properties for event calendar events */
export interface EventProperties {
  event_id: string;
  event_name: string;
  event_type?: string;
  event_date?: string;
  location?: string;
}

/** Properties for community events */
export interface CommunityPostProperties {
  post_id: string;
  post_type?: 'build' | 'question' | 'discussion';
  author_id?: string;
}

/** Properties for onboarding events */
export interface OnboardingProperties {
  step?: number;
  step_name?: string;
  skipped_steps?: string[];
  time_spent_seconds?: number;
}

/** Properties for funnel step events */
export interface FunnelStepProperties {
  funnel_name: string;
  step_number: number;
  step_name: string;
  [key: string]: unknown;
}

/** Properties for feedback events */
export interface FeedbackProperties {
  category: 'bug' | 'feature' | 'question' | 'other';
  page_url?: string;
  feature_context?: string;
  severity?: 'minor' | 'major' | 'blocking';
}

// =============================================================================
// DISCRIMINATED UNION FOR ALL EVENTS
// =============================================================================

/**
 * Type-safe analytics event union
 * 
 * Use this for compile-time checking of event names and properties.
 * Each event variant ensures the correct properties are passed.
 */
export type AnalyticsEvent =
  // Authentication Events
  | { name: 'Signup Completed'; properties: SignupProperties }
  | { name: 'Login Completed'; properties: LoginProperties }
  | { name: 'Logout Completed'; properties: Record<string, never> }
  | { name: 'Password Reset Requested'; properties: { email?: string } }
  
  // Onboarding Events
  | { name: 'Onboarding Started'; properties: OnboardingProperties }
  | { name: 'Onboarding Step Completed'; properties: OnboardingProperties }
  | { name: 'Onboarding Completed'; properties: OnboardingProperties }
  | { name: 'Onboarding Skipped'; properties: OnboardingProperties }
  
  // Car Discovery Events
  | { name: 'Car Viewed'; properties: CarViewedProperties }
  | { name: 'Car Searched'; properties: CarSearchedProperties }
  | { name: 'Cars Filtered'; properties: { filters: Record<string, unknown>; results_count: number } }
  | { name: 'Cars Compared'; properties: { car_slugs: string[]; count: number } }
  
  // Garage Events
  | { name: 'Garage Vehicle Added'; properties: GarageEventProperties }
  | { name: 'Garage Vehicle Removed'; properties: GarageEventProperties }
  | { name: 'Garage Vehicle Updated'; properties: GarageEventProperties }
  | { name: 'Favorite Added'; properties: { car_id: string; car_slug: string } }
  | { name: 'Favorite Removed'; properties: { car_id: string; car_slug: string } }
  
  // Build/Tuning Events
  | { name: 'Build Created'; properties: BuildEventProperties }
  | { name: 'Build Saved'; properties: BuildEventProperties }
  | { name: 'Build Upgrade Added'; properties: BuildUpgradeProperties }
  | { name: 'Build Upgrade Removed'; properties: BuildUpgradeProperties }
  | { name: 'Build Performance Viewed'; properties: BuildEventProperties }
  | { name: 'Build Shared'; properties: BuildEventProperties & { share_method?: string } }
  
  // AL (AI Assistant) Events
  | { name: 'AL Conversation Started'; properties: ALEventProperties }
  | { name: 'AL Message Sent'; properties: ALEventProperties }
  | { name: 'AL Response Received'; properties: ALEventProperties }
  | { name: 'AL Feedback Given'; properties: ALEventProperties }
  | { name: 'AL Credits Used'; properties: ALEventProperties }
  
  // Events Calendar
  | { name: 'Event Viewed'; properties: EventProperties }
  | { name: 'Event Saved'; properties: EventProperties }
  | { name: 'Event Registered'; properties: EventProperties }
  | { name: 'Event Shared'; properties: EventProperties }
  
  // Community Events
  | { name: 'Community Post Viewed'; properties: CommunityPostProperties }
  | { name: 'Community Post Created'; properties: CommunityPostProperties }
  | { name: 'Community Post Liked'; properties: CommunityPostProperties }
  | { name: 'Community Post Commented'; properties: CommunityPostProperties }
  
  // Subscription Events
  | { name: 'Pricing Viewed'; properties: { page?: string } }
  | { name: 'Checkout Started'; properties: SubscriptionEventProperties }
  | { name: 'Checkout Completed'; properties: SubscriptionEventProperties }
  | { name: 'Subscription Created'; properties: SubscriptionEventProperties }
  | { name: 'Subscription Upgraded'; properties: SubscriptionEventProperties }
  | { name: 'Subscription Downgraded'; properties: SubscriptionEventProperties }
  | { name: 'Subscription Canceled'; properties: SubscriptionEventProperties }
  | { name: 'AL Credits Purchased'; properties: { pack: string; credits: number; amount_cents: number } }
  
  // Engagement Events
  | { name: 'CTA Clicked'; properties: CTAClickedProperties }
  | { name: 'Content Shared'; properties: { content_type: string; content_id?: string; method: string } }
  | { name: 'Feedback Submitted'; properties: FeedbackProperties }
  | { name: 'Contact Form Submitted'; properties: { subject?: string; category?: string } }
  
  // Feature Discovery
  | { name: 'Feature Discovered'; properties: { feature_name: string; discovery_method?: string } }
  | { name: 'Feature Gate Hit'; properties: FeatureGateProperties }
  | { name: 'Feature Gate Converted'; properties: FeatureGateProperties }
  
  // Funnel Tracking
  | { name: 'Funnel Step Completed'; properties: FunnelStepProperties };

// =============================================================================
// TYPE-SAFE TRACK FUNCTION
// =============================================================================

/**
 * Type-safe event tracking function signature
 * 
 * This ensures compile-time checking that the event name and properties match.
 */
export type TrackEventFn = <T extends AnalyticsEvent>(
  name: T['name'],
  properties: T['properties']
) => void;

// =============================================================================
// EVENT NAME TYPE
// =============================================================================

/**
 * Union type of all valid event names
 * 
 * Use this for type checking event names without properties.
 */
export type EventName = AnalyticsEvent['name'];

// =============================================================================
// FUNNEL NAMES
// =============================================================================

/**
 * Pre-defined funnel names for type safety
 */
export type FunnelName = 
  | 'signup'
  | 'onboarding'
  | 'checkout'
  | 'build_creation'
  | 'garage_addition'
  | 'al_conversation';

// =============================================================================
// USER TRAITS
// =============================================================================

/**
 * User traits for identification
 */
export interface UserTraits {
  email?: string;
  name?: string;
  subscription_tier?: 'free' | 'collector' | 'tuner';
  created_at?: string;
  stripe_customer_id?: string;
  onboarding_completed?: boolean;
  [key: string]: unknown;
}
