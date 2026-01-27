/**
 * AutoRev Database Type Definitions
 *
 * This file documents the structure of JSONB columns and provides TypeScript
 * type definitions for database operations.
 *
 * Last Updated: January 11, 2026
 */

// ============================================================================
// UPGRADE & TUNING TYPES
// ============================================================================

/** Upgrade key identifiers used across the platform */
export type UpgradeKey =
  | 'intake'
  | 'exhaust-catback'
  | 'exhaust-axleback'
  | 'headers'
  | 'downpipe'
  | 'stage1-tune'
  | 'stage2-tune'
  | 'stage3-tune'
  // Note: charge-pipe-upgrade and hpfp-upgrade removed
  | 'flex-fuel-e85'
  | 'fuel-system-upgrade'
  | 'intercooler'
  | 'turbo-upgrade-existing'
  | 'turbo-upgrade-larger'
  | 'supercharger-kit'
  | 'coilovers-street'
  | 'coilovers-track'
  | 'lowering-springs'
  | 'sway-bars'
  | 'chassis-bracing'
  | 'strut-tower-brace'
  | 'big-brake-kit'
  | 'brake-pads-street'
  | 'brake-pads-track'
  | 'brake-fluid-lines'
  | 'slotted-rotors'
  | 'drilled-rotors'
  | 'wheels-lightweight'
  | 'wheels-forged'
  | 'tires-summer'
  | 'tires-slicks'
  | 'oil-cooler'
  | 'trans-cooler'
  | 'radiator-upgrade'
  | 'wing'
  | 'splitter'
  | 'diffuser'
  | 'widebody-kit';

/** Upgrade objective/tier names */
export type UpgradeObjective = 'streetSport' | 'trackPack' | 'timeAttack' | 'ultimatePower';

/** Categories for organizing upgrades */
export type UpgradeCategory =
  | 'power'
  | 'forcedInduction'
  | 'chassis'
  | 'brakes'
  | 'wheels'
  | 'cooling'
  | 'aero';

/**
 * Structure of upgrades_by_objective in car_tuning_profiles
 * Maps objectives to arrays of upgrade keys for each category
 */
export interface UpgradesByObjective {
  [objective: string]: {
    [category in UpgradeCategory]?: UpgradeKey[];
  };
}

/**
 * Performance potential data in car_tuning_profiles
 */
export interface PerformancePotential {
  maxHp?: number;
  maxTorque?: number;
  zeroToSixty?: string;
  quarterMile?: string;
}

// ============================================================================
// USER VEHICLE TYPES
// ============================================================================

/**
 * installed_modifications in user_vehicles
 * Array of upgrade keys representing mods installed on the vehicle
 */
export type InstalledModifications = UpgradeKey[];

/**
 * Battery status for vehicle tracking
 */
export type BatteryStatus = 'good' | 'fair' | 'weak' | 'dead' | 'unknown';

/**
 * Vehicle usage type for maintenance calculations
 */
export type UsageType = 'daily' | 'weekend' | 'track' | 'stored';

// ============================================================================
// COMMUNITY INSIGHTS TYPES
// ============================================================================

/** Types of community insights */
export type InsightType =
  | 'known_issue'
  | 'maintenance_tip'
  | 'modification_guide'
  | 'troubleshooting'
  | 'buying_guide'
  | 'performance_data'
  | 'reliability_report'
  | 'cost_insight'
  | 'comparison';

/**
 * Structure of details JSONB in community_insights
 */
export interface CommunityInsightDetails {
  /** Main content/description */
  content: string;
  /** Related topic tags */
  tags?: string[];
  /** All related car slugs */
  all_car_slugs?: string[];
  /** Quotes from source material */
  source_quotes?: string[];
  /** Affected model years */
  affected_years?: string;
  /** Severity (for issues) */
  severity?: 'low' | 'medium' | 'high' | 'critical';
  /** Estimated fix cost range */
  fix_cost_low?: number;
  fix_cost_high?: number;
}

// ============================================================================
// ERROR & FEEDBACK TYPES
// ============================================================================

/**
 * Structure of metadata JSONB in application_errors
 */
export interface ApplicationErrorMetadata {
  /** Error type classification */
  errorType: 'unhandled_exception' | 'api_error' | 'network_error' | 'validation_error';
  /** Hash for deduplication */
  errorHash: string;
  /** Error message */
  errorMessage: string;
  /** Full stack trace */
  stackTrace?: string;
  /** URL where error occurred */
  url: string;
  /** Page URL (may differ from url) */
  pageUrl?: string;
  /** Browser name */
  browser?: string;
  /** Operating system */
  os?: string;
  /** Is mobile device */
  isMobile?: boolean;
  /** Screen size (e.g., "360x772") */
  screenSize?: string;
  /** Viewport size */
  viewportSize?: string;
  /** Referrer URL */
  referrer?: string | null;
  /** Server-side error flag */
  serverSide?: boolean;
  /** API route if applicable */
  apiRoute?: string | null;
  /** HTTP method if applicable */
  httpMethod?: string | null;
  /** Request duration in ms */
  requestDuration?: number | null;
  /** React component name */
  componentName?: string | null;
  /** React component stack */
  componentStack?: string | null;
  /** Error code if applicable */
  errorCode?: string | null;
  /** Number of occurrences */
  occurrenceCount?: number | null;
}

/**
 * Structure of error_metadata JSONB in user_feedback
 * Same structure as ApplicationErrorMetadata
 */
export type UserFeedbackErrorMetadata = ApplicationErrorMetadata;

// ============================================================================
// PARTS & FITMENTS TYPES
// ============================================================================

/**
 * Part quality tier
 */
export type PartQualityTier = 'budget' | 'value' | 'premium' | 'race';

/**
 * Part relationship types
 */
export type PartRelationType = 'requires' | 'suggests' | 'conflicts';

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

/**
 * Event data structure for user_events
 */
export interface UserEventData {
  /** Type of event */
  event_type: string;
  /** Event-specific properties */
  properties?: Record<string, unknown>;
  /** Page URL */
  page_url?: string;
  /** Referrer */
  referrer?: string;
}

// ============================================================================
// SUBSCRIPTION & TIER TYPES
// ============================================================================

/** User subscription tiers */
export type SubscriptionTier = 'free' | 'collector' | 'tuner' | 'admin';

/** Stripe subscription status */
export type StripeSubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';

// ============================================================================
// EVENT TYPES
// ============================================================================

/** Event status */
export type EventStatus = 'draft' | 'pending' | 'approved' | 'cancelled';

/** Event affinity type */
export type EventAffinityType = 'featured' | 'welcome' | 'exclusive';

// ============================================================================
// FORUM & SCRAPING TYPES
// ============================================================================

/**
 * Structure of posts JSONB in forum_scraped_threads
 */
export interface ForumPost {
  author: string;
  content: string;
  date?: string;
  post_number?: number;
}

/**
 * Structure of scrape_config in forum_sources
 */
export interface ForumScrapeConfig {
  /** Subforums to scrape */
  subforums?: string[];
  /** Thread URL patterns */
  thread_patterns?: string[];
  /** CSS selectors for content */
  selectors?: {
    thread_title?: string;
    post_content?: string;
    post_author?: string;
    post_date?: string;
  };
}

// ============================================================================
// DATABASE TABLE TYPES (Simplified)
// ============================================================================

/**
 * Core car record
 */
export interface Car {
  id: string;
  slug: string;
  name: string;
  brand: string;
  years: string;
  vehicle_type: string;
  category: string;
  hp: number;
  torque: number;
  price_avg?: number;
  // ... many more fields
}

/**
 * User profile record
 */
export interface UserProfile {
  id: string;
  display_name?: string;
  avatar_url?: string;
  subscription_tier: SubscriptionTier;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  stripe_subscription_status?: StripeSubscriptionStatus;
  al_credits_purchased: number;
  location_zip?: string;
  location_city?: string;
  location_state?: string;
  onboarding_completed_at?: string;
  referral_code?: string;
  created_at: string;
  updated_at: string;
}

/**
 * User vehicle record
 */
export interface UserVehicle {
  id: string;
  user_id: string;
  matched_car_slug?: string;
  matched_car_id?: string;
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  nickname?: string;
  installed_modifications: InstalledModifications;
  current_mileage?: number;
  usage_type: UsageType;
  battery_status: BatteryStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Car tuning profile
 */
export interface CarTuningProfile {
  id: string;
  car_id: string;
  car_slug: string;
  upgrades_by_objective?: UpgradesByObjective;
  performance_potential?: PerformancePotential;
  platform_strengths?: string;
  platform_weaknesses?: string;
  tuning_community_notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Community insight record
 */
export interface CommunityInsight {
  id: string;
  car_slug: string;
  car_id?: string;
  insight_type: InsightType;
  title: string;
  summary: string;
  details?: CommunityInsightDetails;
  confidence: number;
  consensus_strength?: string;
  source_forum?: string;
  source_urls?: string[];
  created_at: string;
  updated_at: string;
}
