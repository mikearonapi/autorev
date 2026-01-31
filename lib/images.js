/**
 * Image Service Utility
 *
 * Handles image URLs for the AutoRev site.
 * Images are stored in Vercel Blob and referenced via URLs in Supabase.
 *
 * This utility provides:
 * - URL builders for different image types
 * - Fallback images for missing assets
 * - Placeholder generation for development
 * - Image optimization helpers
 */

// =============================================================================
// Configuration
// =============================================================================

/**
 * Base URL for Vercel Blob storage
 * Set via environment variable in production, with fallback to known URL
 */
/**
 * Base URL for Vercel Blob storage - sanitized to remove any stray newlines
 */
const RAW_BLOB_URL =
  process.env.NEXT_PUBLIC_VERCEL_BLOB_URL ||
  'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com';
const BLOB_BASE_URL = RAW_BLOB_URL.replace(/\\[nr]/g, '')
  .replace(/[\r\n]/g, '')
  .trim();

/**
 * Whether we're in development mode (no real images)
 */
const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * Default fallback gradient colors for placeholders
 * These match the brand color system
 */
const PLACEHOLDER_COLORS = {
  primary: ['#1a1a2e', '#16213e', '#0f3460'],
  accent: ['#e94560', '#ff6b6b', '#ffa502'],
  neutral: ['#2d3436', '#4a5568', '#718096'],
};

// =============================================================================
// Image Path Builders
// =============================================================================

/**
 * Car image type definitions with metadata
 * Each type has a specific purpose and use case across the site
 */
export const CAR_IMAGE_TYPES = {
  hero: {
    name: 'Hero',
    description: 'Premium 3/4 front angle in scenic environment',
    aspectRatio: '16:9',
    quality: 'premium',
    useCases: ['Car detail page hero', 'OG/social images', 'Featured cards'],
  },
  rear: {
    name: 'Rear 3/4',
    description: 'Rear 3/4 angle showing back styling, exhaust, design',
    aspectRatio: '16:9',
    quality: 'premium',
    useCases: ['Gallery view', 'Buying guide', 'Design appreciation'],
  },
  interior: {
    name: 'Interior',
    description: "Cockpit view from driver's perspective",
    aspectRatio: '16:9',
    quality: 'premium',
    useCases: ['Buying guide tab', 'Ownership section', 'Interior quality showcase'],
  },
  action: {
    name: 'Action',
    description: 'Dynamic motion shot with sense of speed',
    aspectRatio: '16:9',
    quality: 'standard',
    useCases: ['Card hover effects', 'Dynamic galleries', 'Excitement/energy'],
  },
  detail: {
    name: 'Detail',
    description: 'Close-up of engine bay, wheels, or signature detail',
    aspectRatio: '1:1',
    quality: 'standard',
    useCases: ['Thumbnail', 'Enthusiast details', 'Technical appreciation'],
  },
};

/**
 * Standard image paths for cars stored in Vercel Blob
 * Structure: cars/{slug}/{type}.{ext}
 */
export const CAR_IMAGE_PATHS = {
  hero: (slug) => `cars/${slug}/hero.webp`,
  rear: (slug) => `cars/${slug}/rear.webp`,
  interior: (slug) => `cars/${slug}/interior.webp`,
  action: (slug) => `cars/${slug}/action.webp`,
  detail: (slug) => `cars/${slug}/detail.webp`,
  thumbnail: (slug) => `cars/${slug}/thumb.webp`,
  gallery: (slug, index) => `cars/${slug}/gallery-${index}.webp`,
  og: (slug) => `cars/${slug}/og.jpg`, // OpenGraph image
  // Exclusive garage images - premium studio photography, only shown in garage
  garage: (slug) => `garage/${slug}/exclusive.webp`,
};

/**
 * Standard image paths for page-level images
 * Structure: pages/{page}/{type}.{ext}
 *
 * All images are enthusiast-focused - capturing the weekend warrior / hobbyist spirit
 */
export const PAGE_IMAGE_PATHS = {
  // ==========================================================================
  // PAGE HERO IMAGES
  // ==========================================================================

  // Home page
  homeHero: 'pages/home/hero.webp', // Sunday morning drive on mountain road
  homeValue: 'pages/home/value-section.webp', // Enthusiast in home garage, Saturday session
  homeFeature: 'pages/home/feature-car.webp', // Sports car at scenic overlook

  // Advisory page (Car Finder)
  advisoryHero: 'pages/advisory/hero.webp', // Cars & coffee meet, diverse sports cars

  // Performance HUB
  performanceHero: 'pages/performance/hero.webp', // Track day or canyon carving scene

  // Upgrades page (legacy - redirects to Performance HUB)
  upgradesHero: 'pages/upgrades/hero.webp', // Aftermarket parts on workbench
  upgradesGarage: 'pages/upgrades/garage.webp', // DIY project in home garage

  // Services page (Service Center)
  servicesHero: 'pages/services/hero.webp', // Friendly independent shop
  servicesWorkshop: 'pages/services/workshop.webp', // Owner and mechanic collaborating

  // Contact page
  contactHero: 'pages/contact/hero.webp', // Warm abstract automotive background

  // ==========================================================================
  // ATMOSPHERIC / DETAIL IMAGES (for use across the site)
  // ==========================================================================

  // Detail shots
  engineBay: 'shared/engine-bay.webp', // Clean V8 or flat-6 engine bay
  brakeDetail: 'shared/brake-detail.webp', // Upgraded brake system close-up
  cockpitView: 'shared/cockpit-view.webp', // Driver POV, hands on wheel
  exhaustTips: 'shared/exhaust-tips.webp', // Aftermarket exhaust detail
  wheelDetail: 'shared/wheel-detail.webp', // Quality aftermarket wheel
  suspensionSetup: 'shared/suspension-setup.webp', // Coilover visible through wheel

  // Atmospheric shots
  garageMood: 'shared/garage-mood.webp', // Moody home garage at dusk
  carsAndCoffee: 'shared/cars-and-coffee.webp', // Casual car meet community
  canyonRoad: 'shared/canyon-road.webp', // Empty winding driving road
  trackDayFun: 'shared/track-day-fun.webp', // Amateur track day scene
  sunsetDrive: 'shared/sunset-drive.webp', // Car silhouette at sunset

  // Legacy (keeping for compatibility)
  trackBackground: 'shared/canyon-road.webp', // Alias to canyonRoad
  logoMark: 'shared/logo-mark.svg',
};

// =============================================================================
// URL Builders
// =============================================================================

/**
 * Build the full URL for an image stored in Vercel Blob
 * @param {string} path - Relative path within the blob storage
 * @returns {string|null} - Full URL or null if not available
 */
export function getBlobUrl(path) {
  if (!BLOB_BASE_URL || !path) return null;
  return `${BLOB_BASE_URL}/${path}`;
}

// =============================================================================
// UI / ONBOARDING IMAGE CONSTANTS
// =============================================================================

/**
 * UI images stored in the public folder (already TinyPNG-optimized).
 * NOTE: These are referenced in multiple client components; keeping them
 * centralized prevents hardcoded paths from drifting.
 */
export const UI_IMAGES = {
  // Optimized 64x64 version (8KB vs 316KB original) for UI buttons
  alMascot: '/images/al-mascot-64.png',
  // Full-size version for emails and larger displays
  alMascotFull: '/images/al-mascot.png',
  // Email logo (AR logo resized for email templates)
  logoEmail: '/images/autorev-email-logo.png',
};

/**
 * Site Design Images v2 - Jan 30 2026 App Redesign
 * Fresh screenshots from the new app design, stored in Vercel Blob CDN
 *
 * These are the primary images for marketing pages - optimized for page speed
 */
export const SITE_DESIGN_IMAGES = {
  // ==========================================================================
  // HERO SECTION - 3 phone display (most important for homepage)
  // ==========================================================================
  heroCenter: `${BLOB_BASE_URL}/site-design-v2/garage-audi-rs5-hero.webp`, // Garage with RS5 hero card - Mike's Garage
  heroLeft: `${BLOB_BASE_URL}/site-design-v2/insights-recommended-upgrades.webp`, // Recommended upgrades
  heroRight: `${BLOB_BASE_URL}/site-design-v2/al-chat-exhaust-recommendations.webp`, // AL chat response

  // ==========================================================================
  // FEATURE SECTIONS - Used in homepage feature cards
  // ==========================================================================
  garageOverview: `${BLOB_BASE_URL}/site-design-v2/garage-audi-rs5-hero.webp`, // "Your Garage" section - Mike's Garage
  garageData: `${BLOB_BASE_URL}/site-design-v2/data-virtual-dyno-chart.webp`, // "Virtual Dyno" section
  garageMetrics: `${BLOB_BASE_URL}/site-design-v2/data-performance-metrics-scores.webp`, // Performance metrics
  tuningOverview: `${BLOB_BASE_URL}/site-design-v2/build-categories-overview.webp`, // "Plan Your Build" section
  performanceMetrics: `${BLOB_BASE_URL}/site-design-v2/data-performance-metrics-scores.webp`, // "Know Your Numbers"
  lapTimeEstimator: `${BLOB_BASE_URL}/site-design-v2/data-track-lap-time-estimator.webp`, // "Track Your Times"
  communityFeed: `${BLOB_BASE_URL}/site-design-v2/community-builds-evo-x-track.webp`, // "Community Builds"
  alChatResponse: `${BLOB_BASE_URL}/site-design-v2/al-chat-exhaust-recommendations.webp`, // "Ask AL Anything"

  // ==========================================================================
  // BUILD SECTION - Upgrade category pickers
  // ==========================================================================
  buildCategories: `${BLOB_BASE_URL}/site-design-v2/build-categories-overview.webp`,
  buildEngine: `${BLOB_BASE_URL}/site-design-v2/build-engine-performance-picker.webp`,
  buildExhaust: `${BLOB_BASE_URL}/site-design-v2/build-exhaust-picker.webp`,
  buildForcedInduction: `${BLOB_BASE_URL}/site-design-v2/build-forced-induction-picker.webp`,
  buildSuspension: `${BLOB_BASE_URL}/site-design-v2/build-suspension-handling-picker.webp`,
  buildBrakes: `${BLOB_BASE_URL}/site-design-v2/build-brakes-picker.webp`,
  buildCooling: `${BLOB_BASE_URL}/site-design-v2/build-cooling-picker.webp`,
  buildWheels: `${BLOB_BASE_URL}/site-design-v2/build-wheels-tires-picker.webp`,
  buildAero: `${BLOB_BASE_URL}/site-design-v2/build-body-aero-picker.webp`,
  buildDrivetrain: `${BLOB_BASE_URL}/site-design-v2/build-drivetrain-picker.webp`,
  tuningRecommendations: `${BLOB_BASE_URL}/site-design-v2/insights-recommended-upgrades.webp`,

  // ==========================================================================
  // DATA SECTION - Dyno, metrics, lap times
  // ==========================================================================
  dataVirtualDyno: `${BLOB_BASE_URL}/site-design-v2/data-virtual-dyno-chart.webp`,
  dataPerformanceMetrics: `${BLOB_BASE_URL}/site-design-v2/data-performance-metrics-scores.webp`,
  dataPowerBreakdown: `${BLOB_BASE_URL}/site-design-v2/data-power-breakdown-chart.webp`,
  dataLapTimeEstimator: `${BLOB_BASE_URL}/site-design-v2/data-track-lap-time-estimator.webp`,
  dataPersonalBest: `${BLOB_BASE_URL}/site-design-v2/data-track-personal-best.webp`,
  logDynoForm: `${BLOB_BASE_URL}/site-design-v2/data-log-dyno-result-modal.webp`,
  logLapTimeForm: `${BLOB_BASE_URL}/site-design-v2/data-log-lap-time-modal.webp`,
  powerBreakdown: `${BLOB_BASE_URL}/site-design-v2/data-power-breakdown-chart.webp`,

  // ==========================================================================
  // AL CHAT SECTION - Various states and responses
  // ==========================================================================
  alChatHome: `${BLOB_BASE_URL}/site-design-v2/al-chat-welcome.webp`,
  alChatWelcome: `${BLOB_BASE_URL}/site-design-v2/al-chat-welcome.webp`,
  alChatThinking: `${BLOB_BASE_URL}/site-design-v2/al-chat-thinking-state.webp`,
  alChatSuggestions: `${BLOB_BASE_URL}/site-design-v2/ask-al-parts-suggestions-modal.webp`,
  alChatExhaustResponse: `${BLOB_BASE_URL}/site-design-v2/al-chat-exhaust-recommendations.webp`,
  alChatComparisonResponse: `${BLOB_BASE_URL}/site-design-v2/al-chat-cayman-vs-gt350-response.webp`,
  alChatHeadersResponse: `${BLOB_BASE_URL}/site-design-v2/al-chat-headers-tune-response.webp`,
  alChatTireResponse: `${BLOB_BASE_URL}/site-design-v2/al-chat-tire-fitment-response.webp`,
  alChatHistory: `${BLOB_BASE_URL}/site-design-v2/al-conversation-history-sidebar.webp`,

  // ==========================================================================
  // COMMUNITY SECTION
  // ==========================================================================
  communityBuildsFeed: `${BLOB_BASE_URL}/site-design-v2/community-builds-evo-x-track.webp`,
  communityBuildEvoX: `${BLOB_BASE_URL}/site-design-v2/community-builds-evo-x-track.webp`,
  communityBuildMetrics: `${BLOB_BASE_URL}/site-design-v2/community-build-detail-metrics.webp`,
  communityComments: `${BLOB_BASE_URL}/site-design-v2/community-comments-section.webp`,
  communityEvents: `${BLOB_BASE_URL}/site-design-v2/community-events-calendar.webp`,
  communityLeaderboard: `${BLOB_BASE_URL}/site-design-v2/community-monthly-leaderboard.webp`,

  // ==========================================================================
  // INSIGHTS SECTION
  // ==========================================================================
  insightsRecommended: `${BLOB_BASE_URL}/site-design-v2/insights-recommended-upgrades.webp`,
  insightsBuildProgression: `${BLOB_BASE_URL}/site-design-v2/insights-build-progression.webp`,
  insightsBuildStages: `${BLOB_BASE_URL}/site-design-v2/insights-build-stages-detail.webp`,
  insightsPlatformTips: `${BLOB_BASE_URL}/site-design-v2/insights-platform-tips.webp`,
  recommendedUpgrades: `${BLOB_BASE_URL}/site-design-v2/insights-recommended-upgrades.webp`,
  platformInsights: `${BLOB_BASE_URL}/site-design-v2/insights-platform-tips.webp`,
  tuningProgression: `${BLOB_BASE_URL}/site-design-v2/insights-build-progression.webp`,
  tuningAnalysis: `${BLOB_BASE_URL}/site-design-v2/insights-build-stages-detail.webp`,

  // ==========================================================================
  // GARAGE & SPECS
  // ==========================================================================
  garageHero: `${BLOB_BASE_URL}/site-design-v2/garage-audi-rs5-hero.webp`, // Mike's Garage hero
  specsPerformance: `${BLOB_BASE_URL}/site-design-v2/specs-stock-performance.webp`,
  specsVehicleSelector: `${BLOB_BASE_URL}/site-design-v2/specs-vehicle-selector.webp`,
  photosGallery: `${BLOB_BASE_URL}/site-design-v2/photos-gallery-hero.webp`,
  vehicleSpecs: `${BLOB_BASE_URL}/site-design-v2/specs-stock-performance.webp`,
  specsDropdown: `${BLOB_BASE_URL}/site-design-v2/specs-vehicle-selector.webp`,

  // ==========================================================================
  // INSTALL & PARTS
  // ==========================================================================
  partsShoppingList: `${BLOB_BASE_URL}/site-design-v2/parts-shopping-list-al-picks.webp`,
  installGuideDiy: `${BLOB_BASE_URL}/site-design-v2/install-guide-diy-list.webp`,
  installTools: `${BLOB_BASE_URL}/site-design-v2/install-tools-needed.webp`,
  installVideos: `${BLOB_BASE_URL}/site-design-v2/install-videos-exhaust.webp`,

  // ==========================================================================
  // ONBOARDING & MISC
  // ==========================================================================
  splashLogo: `${BLOB_BASE_URL}/site-design-v2/splash-screen-logo.webp`,
  onboardingGarage: `${BLOB_BASE_URL}/site-design-v2/onboarding-welcome-garage.webp`,
  onboardingData: `${BLOB_BASE_URL}/site-design-v2/onboarding-welcome-data.webp`,
  profileDashboard: `${BLOB_BASE_URL}/site-design-v2/profile-dashboard-stats.webp`,

  // ==========================================================================
  // LEGACY ALIASES (keeping for backward compatibility)
  // ==========================================================================
  communityBuildRS5: `${BLOB_BASE_URL}/site-design-v2/community-builds-evo-x-track.webp`,
  addVehicleModal: `${BLOB_BASE_URL}/site-design-v2/specs-vehicle-selector.webp`,
  knownIssues: `${BLOB_BASE_URL}/site-design-v2/insights-recommended-upgrades.webp`,
  powerUpgradesModal: `${BLOB_BASE_URL}/site-design-v2/build-engine-performance-picker.webp`,
  profileSettings: `${BLOB_BASE_URL}/site-design-v2/profile-dashboard-stats.webp`,
  advancedTuning: `${BLOB_BASE_URL}/site-design-v2/build-categories-overview.webp`,
  fuelConfig: `${BLOB_BASE_URL}/site-design-v2/build-engine-performance-picker.webp`,
  configureUpgrades: `${BLOB_BASE_URL}/site-design-v2/build-categories-overview.webp`,
  garageLoading: `${BLOB_BASE_URL}/site-design-v2/splash-screen-logo.webp`,
};

/**
 * Onboarding screenshots - Using Vercel Blob CDN v2 for optimal performance
 * These are used in the onboarding flow to showcase each feature
 * Updated Jan 30 2026 with new app design screenshots
 *
 * Images organized by feature:
 * - My Garage: Vehicle cards, specs, photos
 * - My Data: Performance metrics, dyno charts, lap times
 * - Community: Build feeds, event details
 * - Ask AL: Chat interface, responses
 */
export const ONBOARDING_IMAGES = {
  // ==========================================================================
  // MY GARAGE - Track your cars, see specs, upload photos
  // ==========================================================================
  garageCard: `${BLOB_BASE_URL}/site-design-v2/garage-audi-rs5-hero.webp`, // Mike's Garage card
  garageAddVehicle: `${BLOB_BASE_URL}/site-design-v2/specs-vehicle-selector.webp`,
  garagePhotos: `${BLOB_BASE_URL}/site-design-v2/photos-gallery-hero.webp`,
  garageSpecs: `${BLOB_BASE_URL}/site-design-v2/specs-stock-performance.webp`,
  garageKnownIssues: `${BLOB_BASE_URL}/site-design-v2/insights-recommended-upgrades.webp`,

  // ==========================================================================
  // MY DATA - Performance metrics, virtual dyno, lap times
  // ==========================================================================
  dataPerformanceMetrics: `${BLOB_BASE_URL}/site-design-v2/data-performance-metrics-scores.webp`,
  dataVirtualDyno: `${BLOB_BASE_URL}/site-design-v2/data-virtual-dyno-chart.webp`,
  dataLapTimeEstimator: `${BLOB_BASE_URL}/site-design-v2/data-track-lap-time-estimator.webp`,
  dataExperienceScores: `${BLOB_BASE_URL}/site-design-v2/data-performance-metrics-scores.webp`,
  dataPowerBreakdown: `${BLOB_BASE_URL}/site-design-v2/data-power-breakdown-chart.webp`,

  // ==========================================================================
  // COMMUNITY - Browse builds, discover events
  // ==========================================================================
  communityFeed: `${BLOB_BASE_URL}/site-design-v2/community-builds-evo-x-track.webp`,
  communityBuildEvoX: `${BLOB_BASE_URL}/site-design-v2/community-builds-evo-x-track.webp`,
  communityBuildRS5: `${BLOB_BASE_URL}/site-design-v2/community-builds-evo-x-track.webp`,
  communityBuildMods: `${BLOB_BASE_URL}/site-design-v2/community-build-detail-metrics.webp`,
  communityEvents: `${BLOB_BASE_URL}/site-design-v2/community-events-calendar.webp`,
  communityLeaderboard: `${BLOB_BASE_URL}/site-design-v2/community-monthly-leaderboard.webp`,

  // ==========================================================================
  // ASK AL - AI assistant for car questions
  // ==========================================================================
  alChatHome: `${BLOB_BASE_URL}/site-design-v2/al-chat-welcome.webp`,
  alChatSuggestions: `${BLOB_BASE_URL}/site-design-v2/ask-al-parts-suggestions-modal.webp`,
  alChatThinking: `${BLOB_BASE_URL}/site-design-v2/al-chat-thinking-state.webp`,
  alChatResponse: `${BLOB_BASE_URL}/site-design-v2/al-chat-exhaust-recommendations.webp`,

  // ==========================================================================
  // BUILD - Upgrade categories and pickers
  // ==========================================================================
  buildCategories: `${BLOB_BASE_URL}/site-design-v2/build-categories-overview.webp`,
  buildEngine: `${BLOB_BASE_URL}/site-design-v2/build-engine-performance-picker.webp`,
  buildExhaust: `${BLOB_BASE_URL}/site-design-v2/build-exhaust-picker.webp`,
  buildSuspension: `${BLOB_BASE_URL}/site-design-v2/build-suspension-handling-picker.webp`,

  // ==========================================================================
  // INSIGHTS
  // ==========================================================================
  insightsRecommended: `${BLOB_BASE_URL}/site-design-v2/insights-recommended-upgrades.webp`,
  insightsBuildProgression: `${BLOB_BASE_URL}/site-design-v2/insights-build-progression.webp`,
  insightsPlatformTips: `${BLOB_BASE_URL}/site-design-v2/insights-platform-tips.webp`,

  // ==========================================================================
  // INSTALL & PARTS
  // ==========================================================================
  partsShoppingList: `${BLOB_BASE_URL}/site-design-v2/parts-shopping-list-al-picks.webp`,
  installGuideDiy: `${BLOB_BASE_URL}/site-design-v2/install-guide-diy-list.webp`,
  installVideos: `${BLOB_BASE_URL}/site-design-v2/install-videos-exhaust.webp`,

  // ==========================================================================
  // LEGACY MAPPINGS - Kept for backward compatibility
  // ==========================================================================
  garageOverview: `${BLOB_BASE_URL}/site-design-v2/garage-audi-rs5-hero.webp`, // Mike's Garage
  tuningShopOverview: `${BLOB_BASE_URL}/site-design-v2/build-categories-overview.webp`,
  aiAlResponseMods: `${BLOB_BASE_URL}/site-design-v2/al-chat-exhaust-recommendations.webp`,
  communityEventsList: `${BLOB_BASE_URL}/site-design-v2/community-events-calendar.webp`,

  // Legacy local paths (some pages may still reference these)
  browseCarsHero: '/images/onboarding/browse-cars-01-hero.png',
  browseCarsOverview: '/images/onboarding/browse-cars-02-overview.png',
  browseCarsBuyingGuide: '/images/onboarding/browse-cars-03-buying-guide.png',
  carSelectorPreferences: '/images/onboarding/car-selector-01-preferences.webp',
  carSelectorResults: '/images/onboarding/car-selector-02-results.webp',
  garageHero: `${BLOB_BASE_URL}/site-design-v2/garage-audi-rs5-hero.webp`, // Mike's Garage hero
  garageDetails: `${BLOB_BASE_URL}/site-design-v2/specs-stock-performance.webp`,
  garageReference: `${BLOB_BASE_URL}/site-design-v2/specs-stock-performance.webp`,
  garageSafety: `${BLOB_BASE_URL}/site-design-v2/insights-recommended-upgrades.webp`,
  garageHealth: `${BLOB_BASE_URL}/site-design-v2/insights-recommended-upgrades.webp`,
  tuningShopWheels: `${BLOB_BASE_URL}/site-design-v2/build-wheels-tires-picker.webp`,
  tuningShopPresets: `${BLOB_BASE_URL}/site-design-v2/build-categories-overview.webp`,
  tuningShopPowerList: `${BLOB_BASE_URL}/site-design-v2/build-engine-performance-picker.webp`,
  tuningShopPartDetail: `${BLOB_BASE_URL}/site-design-v2/parts-shopping-list-al-picks.webp`,
  tuningShopMetrics: `${BLOB_BASE_URL}/site-design-v2/data-performance-metrics-scores.webp`,
  communityEventDetail: `${BLOB_BASE_URL}/site-design-v2/community-events-calendar.webp`,
  aiAlIntro: `${BLOB_BASE_URL}/site-design-v2/al-chat-welcome.webp`,
  aiAlThinking: `${BLOB_BASE_URL}/site-design-v2/al-chat-thinking-state.webp`,
  aiAlResponseAnalysis: `${BLOB_BASE_URL}/site-design-v2/al-chat-exhaust-recommendations.webp`,
};

/**
 * Local image paths for cars stored in public folder
 * Structure: /images/cars/{slug}-{type}.{ext}
 *
 * Note: Local fallback images are currently PNG files in /public/images/cars/
 * These are used when a car doesn't have a Vercel Blob URL in the database.
 * Most production cars have Blob URLs, so these are rarely used.
 */
export const LOCAL_CAR_IMAGE_PATHS = {
  hero: (slug) => `/images/cars/${slug}-hero.png`,
  rear: (slug) => `/images/cars/${slug}-rear.png`,
  interior: (slug) => `/images/cars/${slug}-interior.png`,
  action: (slug) => `/images/cars/${slug}-action.png`,
  detail: (slug) => `/images/cars/${slug}-detail.png`,
  thumbnail: (slug) => `/images/cars/${slug}-hero.png`, // Use hero as thumbnail fallback
};

/**
 * Page image paths - Using compressed Vercel Blob images where available
 * Blob images are 80-90% smaller than local PNG/JPG files
 */
export const LOCAL_PAGE_IMAGE_PATHS = {
  // Homepage - compressed blob versions
  homeHero: `${BLOB_BASE_URL}/pages/home/hero.webp`, // 238KB vs 2.4MB local
  homeValue: `${BLOB_BASE_URL}/pages/home/value-section.webp`, // 295KB compressed
  homeFeature: `${BLOB_BASE_URL}/pages/home/feature-car.webp`, // 162KB compressed

  // Page heroes - compressed blob versions
  advisoryHero: `${BLOB_BASE_URL}/pages/advisory/hero.webp`, // 239KB compressed
  performanceHero: `${BLOB_BASE_URL}/pages/performance/hero.webp`, // 66KB compressed
  upgradesHero: `${BLOB_BASE_URL}/pages/upgrades/hero.webp`, // 339KB compressed
  upgradesGarage: `${BLOB_BASE_URL}/pages/upgrades/garage.webp`, // 248KB compressed
  servicesHero: `${BLOB_BASE_URL}/pages/services/hero.webp`, // 337KB compressed
  servicesWorkshop: `${BLOB_BASE_URL}/pages/services/workshop.webp`, // 259KB compressed
  contactHero: `${BLOB_BASE_URL}/pages/contact/hero.webp`, // 168KB compressed

  // Shared images - compressed blob versions
  engineBay: `${BLOB_BASE_URL}/shared/engine-bay.webp`,
  brakeDetail: `${BLOB_BASE_URL}/shared/brake-detail.webp`,
  cockpitView: `${BLOB_BASE_URL}/shared/cockpit-view.webp`,
  exhaustTips: `${BLOB_BASE_URL}/shared/exhaust-tips.webp`,
  wheelDetail: `${BLOB_BASE_URL}/shared/wheel-detail.webp`,
  suspensionSetup: `${BLOB_BASE_URL}/shared/suspension-setup.webp`,
  garageMood: `${BLOB_BASE_URL}/shared/garage-mood.webp`,
  carsAndCoffee: `${BLOB_BASE_URL}/shared/cars-and-coffee.webp`,
  canyonRoad: `${BLOB_BASE_URL}/shared/canyon-road.webp`,
  trackDayFun: `${BLOB_BASE_URL}/shared/track-day-fun.webp`,
  sunsetDrive: `${BLOB_BASE_URL}/shared/sunset-drive.webp`,
  trackBackground: `${BLOB_BASE_URL}/shared/canyon-road.webp`,
};

/**
 * Get car hero image URL
 * Priority order:
 * 1. Vercel Blob URL from database (imageHeroUrl) - works in both dev and prod
 * 2. Local image file as fallback (/images/cars/{slug}-hero.png)
 * @param {Object} car - Car object from database/local data
 * @returns {string|null} - Image URL or null for placeholder
 */
export function getCarHeroImage(car) {
  if (!car?.slug) return null;

  // Always prefer Vercel Blob URL if available (it exists and is fast)
  if (car.imageHeroUrl) {
    return car.imageHeroUrl;
  }

  // Fallback to local images for cars that don't have Blob URLs yet
  return LOCAL_CAR_IMAGE_PATHS.hero(car.slug);
}

/**
 * Get car thumbnail image URL - uses hero image since dedicated thumbnails don't exist
 * @param {Object} car - Car object
 * @returns {string|null}
 */
export function getCarThumbnail(car) {
  // If explicit thumbnail URL set, use it
  if (car.imageThumbnailUrl) {
    return car.imageThumbnailUrl;
  }

  // Use hero image for thumbnails (same logic as getCarHeroImage)
  return getCarHeroImage(car);
}

/**
 * Get exclusive garage image URL
 * These are premium studio-style images exclusive to the garage page.
 * Features: industrial warehouse with golden lighting, dramatic atmosphere.
 *
 * @param {Object} car - Car object
 * @returns {string|null} - Garage image URL or null if not available
 */
export function getCarGarageImage(car) {
  if (!car?.slug) return null;

  // Check for explicit garage image URL from database
  if (car.imageGarageUrl) {
    return car.imageGarageUrl;
  }

  // Try Vercel Blob path for garage images
  const garagePath = CAR_IMAGE_PATHS.garage(car.slug);
  const baseUrl = getBlobUrl(garagePath);

  // Add cache-busting version to ensure fresh images are loaded
  // Update this version number when garage images are regenerated
  const GARAGE_IMAGE_VERSION = 'v4';
  return baseUrl ? `${baseUrl}?${GARAGE_IMAGE_VERSION}` : null;
}

/**
 * Get car image URL by type
 * Supports: hero, rear, interior, action, detail
 * @param {Object} car - Car object from database/local data
 * @param {string} type - Image type (hero, rear, interior, action, detail)
 * @returns {string|null} - Image URL or null for placeholder
 */
export function getCarImageByType(car, type = 'hero') {
  if (!car?.slug) return null;

  // Map of database field names for each image type
  const dbFieldMap = {
    hero: 'imageHeroUrl',
    rear: 'imageRearUrl',
    interior: 'imageInteriorUrl',
    action: 'imageActionUrl',
    detail: 'imageDetailUrl',
  };

  // Check for Vercel Blob URL from database
  const dbField = dbFieldMap[type];
  if (dbField && car[dbField]) {
    return car[dbField];
  }

  // Fallback to local images
  const localPathFn = LOCAL_CAR_IMAGE_PATHS[type];
  if (localPathFn) {
    return localPathFn(car.slug);
  }

  // Final fallback to hero
  return getCarHeroImage(car);
}

/**
 * Get all available images for a car
 * Returns object with URLs for each image type that exists
 * @param {Object} car - Car object
 * @returns {Object} - Object with image type keys and URL values
 */
export function getAllCarImages(car) {
  if (!car?.slug) return {};

  const images = {};
  const types = ['hero', 'rear', 'interior', 'action', 'detail'];

  types.forEach((type) => {
    const url = getCarImageByType(car, type);
    if (url) {
      images[type] = url;
    }
  });

  // Add gallery images if available
  const gallery = getCarGalleryImages(car);
  if (gallery.length > 0) {
    images.gallery = gallery;
  }

  return images;
}

/**
 * Get image type metadata
 * @param {string} type - Image type
 * @returns {Object|null} - Type metadata or null
 */
export function getImageTypeInfo(type) {
  return CAR_IMAGE_TYPES[type] || null;
}

/**
 * Get car gallery images
 * @param {Object} car - Car object
 * @returns {string[]} - Array of image URLs
 */
export function getCarGalleryImages(car) {
  // From database JSONB array
  if (car.imageGallery && Array.isArray(car.imageGallery) && car.imageGallery.length > 0) {
    return car.imageGallery;
  }

  // No gallery available
  return [];
}

/**
 * Get page-level image URL from Vercel Blob
 * @param {string} key - Key from PAGE_IMAGE_PATHS
 * @returns {string|null}
 */
export function getPageImage(key) {
  // Use Vercel Blob as primary source
  const path = PAGE_IMAGE_PATHS[key];
  if (!path) return null;
  return getBlobUrl(path);
}

// =============================================================================
// Placeholder Generators
// =============================================================================

/**
 * Generate a gradient placeholder style for when images aren't available
 * @param {string} seed - Seed for deterministic gradient (e.g., car slug)
 * @param {string} variant - 'primary' | 'accent' | 'neutral'
 * @returns {Object} - CSS style object for background
 */
export function getPlaceholderGradient(seed = 'default', variant = 'primary') {
  const colors = PLACEHOLDER_COLORS[variant] || PLACEHOLDER_COLORS.primary;

  // Simple hash function for deterministic variation
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const angle = hash % 360;

  return {
    background: `linear-gradient(${angle}deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
  };
}

/**
 * Generate placeholder with car name text
 * @param {Object} car - Car object
 * @returns {Object} - Props for a placeholder component
 */
export function getCarPlaceholderProps(car) {
  return {
    style: getPlaceholderGradient(car.slug || car.name, 'primary'),
    text: car.name,
    subtext: car.years,
  };
}

// =============================================================================
// Image Component Helpers
// =============================================================================

/**
 * Get image props with srcSet for responsive images
 * @param {string} baseUrl - Base image URL
 * @param {number[]} widths - Array of widths to generate
 * @returns {Object} - Props for img element
 */
export function getResponsiveImageProps(baseUrl, widths = [320, 640, 960, 1280]) {
  if (!baseUrl) return {};

  // For Vercel Blob, you can use image optimization parameters
  // Format: url?w=WIDTH&q=QUALITY
  const srcSet = widths.map((w) => `${baseUrl}?w=${w} ${w}w`).join(', ');

  return {
    src: baseUrl,
    srcSet,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  };
}

/**
 * Preload an image for better UX
 * Uses both link preload (for browser hint) and Image object (for immediate download)
 * @param {string} url - Image URL to preload
 * @returns {Promise<void>} - Resolves when image is loaded
 */
export function preloadImage(url) {
  if (!url || typeof window === 'undefined') return Promise.resolve();

  // Check if already preloaded to avoid duplicates
  const existingLink = document.querySelector(`link[rel="preload"][href="${url}"]`);
  if (existingLink) return Promise.resolve();

  // Add preload link hint for browser optimization
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  link.fetchPriority = 'high'; // Signal high priority to browser
  document.head.appendChild(link);

  // Also use Image object to immediately start the download
  // This ensures the image is actually fetched, not just hinted
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Resolve even on error to avoid blocking
    img.src = url;
  });
}

// =============================================================================
// Image Existence Check (for conditional rendering)
// =============================================================================

/**
 * Check if a car has any images available
 * @param {Object} car - Car object
 * @returns {boolean}
 */
export function hasCarImages(car) {
  return !!(
    car.slug || // Local images are available via slug
    car.imageHeroUrl ||
    (car.imageGallery && car.imageGallery.length > 0)
  );
}

/**
 * Check if we should show a placeholder instead of image
 * @param {Object} car - Car object
 * @returns {boolean}
 */
export function shouldShowPlaceholder(car) {
  // In dev mode without blob URL configured, always show placeholder
  if (IS_DEV && !BLOB_BASE_URL) {
    return true;
  }

  // No images available
  return !hasCarImages(car);
}

// =============================================================================
// Image Generation Metadata (for scripts)
// =============================================================================

/**
 * Generate prompt metadata for AI image generation
 * This is used by the offline image generation script
 * @param {Object} car - Car object
 * @returns {Object} - Metadata for image generation
 */
export function getImageGenMetadata(car) {
  return {
    slug: car.slug,
    name: car.name,
    category: car.category,
    tier: car.tier,
    // Suggested prompt elements
    promptHints: {
      carType:
        car.category === 'Mid-Engine'
          ? 'mid-engine sports car'
          : car.category === 'Rear-Engine'
            ? 'rear-engine sports car'
            : 'front-engine sports car',
      era: getEraFromYears(car.years),
      brand: extractBrand(car.name),
      style:
        car.tier === 'premium'
          ? 'exotic, dramatic'
          : car.tier === 'budget'
            ? 'approachable, sporty'
            : 'performance-focused',
    },
    // Output paths
    outputPaths: {
      hero: CAR_IMAGE_PATHS.hero(car.slug),
      thumbnail: CAR_IMAGE_PATHS.thumbnail(car.slug),
      og: CAR_IMAGE_PATHS.og(car.slug),
    },
  };
}

/**
 * Extract era descriptor from year range
 * @param {string} years - Year range string (e.g., "2020-2024")
 * @returns {string} - Era description
 */
function getEraFromYears(years) {
  const match = years.match(/(\d{4})/);
  if (!match) return 'modern';
  const year = parseInt(match[1], 10);
  if (year >= 2020) return 'modern';
  if (year >= 2015) return 'contemporary';
  if (year >= 2010) return 'recent classic';
  return 'classic';
}

/**
 * Extract brand from car name
 * @param {string} name - Car name
 * @returns {string} - Brand name or 'sports car'
 */
function extractBrand(name) {
  const brands = [
    'Porsche',
    'Ferrari',
    'Lamborghini',
    'Audi',
    'BMW',
    'Mercedes',
    'Chevrolet',
    'Ford',
    'Dodge',
    'Nissan',
    'Toyota',
    'Lexus',
    'Lotus',
    'Jaguar',
    'Aston Martin',
    'Maserati',
    'Alfa Romeo',
  ];

  for (const brand of brands) {
    if (name.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }

  // Check for model names that imply brands
  if (name.includes('Cayman') || name.includes('Carrera') || name.includes('911')) return 'Porsche';
  if (name.includes('Corvette') || name.includes('Camaro')) return 'Chevrolet';
  if (name.includes('Mustang') || name.includes('GT350') || name.includes('GT500')) return 'Ford';
  if (name.includes('Viper')) return 'Dodge';
  if (name.includes('GT-R')) return 'Nissan';
  if (name.includes('Supra')) return 'Toyota';
  if (name.includes('Gallardo')) return 'Lamborghini';
  if (name.includes('R8')) return 'Audi';
  if (name.includes('Emira') || name.includes('Evora')) return 'Lotus';
  if (name.includes('F-Type')) return 'Jaguar';
  if (name.includes('Vantage')) return 'Aston Martin';
  if (name.includes('GranTurismo')) return 'Maserati';
  if (name.includes('4C')) return 'Alfa Romeo';
  if (name.includes('M2') || name.includes('M4')) return 'BMW';
  if (name.includes('C63') || name.includes('AMG')) return 'Mercedes';
  if (name.includes('RC F') || name.includes('LC 500')) return 'Lexus';

  return 'sports car';
}

// =============================================================================
// Export All
// =============================================================================

const images = {
  getBlobUrl,
  getCarHeroImage,
  getCarThumbnail,
  getCarGarageImage,
  getCarImageByType,
  getAllCarImages,
  getImageTypeInfo,
  getCarGalleryImages,
  getPageImage,
  getPlaceholderGradient,
  getCarPlaceholderProps,
  getResponsiveImageProps,
  preloadImage,
  hasCarImages,
  shouldShowPlaceholder,
  getImageGenMetadata,
  CAR_IMAGE_TYPES,
  CAR_IMAGE_PATHS,
  PAGE_IMAGE_PATHS,
  LOCAL_CAR_IMAGE_PATHS,
  LOCAL_PAGE_IMAGE_PATHS,
};

export default images;
