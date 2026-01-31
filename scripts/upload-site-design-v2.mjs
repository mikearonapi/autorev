#!/usr/bin/env node
/**
 * Upload New Site Design Images to Vercel Blob
 * 
 * Uploads all the new Jan 30 2026 site design screenshots to Vercel Blob CDN.
 * After upload, updates lib/images.js with the new URLs.
 * 
 * Usage:
 *   node scripts/upload-site-design-v2.mjs
 *   
 * Requires:
 *   BLOB_READ_WRITE_TOKEN in .env.local
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        let value = valueParts.join('=');
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

// Source folder for new images
const SOURCE_FOLDER = 'public/images/new site design - Jan 30';

// =============================================================================
// IMAGE MAPPING - Maps local filename to blob path and semantic key
// =============================================================================
// 
// These are organized by app section for clarity
//
const IMAGES_TO_UPLOAD = [
  // ============================================
  // ONBOARDING & SPLASH
  // ============================================
  {
    filename: 'splash-screen-logo.png',
    blobPath: 'site-design-v2/splash-screen-logo.png',
    key: 'splashLogo',
    description: 'App splash screen with AR logo',
  },
  {
    filename: 'onboarding-welcome-garage.png',
    blobPath: 'site-design-v2/onboarding-welcome-garage.png',
    key: 'onboardingGarage',
    description: 'Onboarding modal - Welcome to Your Garage',
  },
  {
    filename: 'onboarding-welcome-data.png',
    blobPath: 'site-design-v2/onboarding-welcome-data.png',
    key: 'onboardingData',
    description: 'Onboarding modal - Welcome to My Data',
  },

  // ============================================
  // GARAGE - Hero & Specs
  // ============================================
  {
    filename: 'garage-audi-rs5-hero.png',
    blobPath: 'site-design-v2/garage-audi-rs5-hero.png',
    key: 'garageHero',
    description: 'Garage main view with RS5 hero card and stats',
    homepage: 'heroCenter', // Maps to homepage section
  },
  {
    filename: 'specs-stock-performance.png',
    blobPath: 'site-design-v2/specs-stock-performance.png',
    key: 'specsPerformance',
    description: 'Vehicle specs - stock performance numbers',
  },
  {
    filename: 'specs-vehicle-selector.png',
    blobPath: 'site-design-v2/specs-vehicle-selector.png',
    key: 'specsVehicleSelector',
    description: 'Vehicle selector dropdown',
  },
  {
    filename: 'photos-gallery-hero.png',
    blobPath: 'site-design-v2/photos-gallery-hero.png',
    key: 'photosGallery',
    description: 'Photos gallery with hero image selection',
  },

  // ============================================
  // BUILD - Upgrade Categories & Pickers
  // ============================================
  {
    filename: 'build-categories-overview.png',
    blobPath: 'site-design-v2/build-categories-overview.png',
    key: 'buildCategories',
    description: 'Build page - upgrade categories overview',
    homepage: 'tuningOverview',
  },
  {
    filename: 'build-engine-performance-picker.png',
    blobPath: 'site-design-v2/build-engine-performance-picker.png',
    key: 'buildEngine',
    description: 'Engine & Performance parts picker',
  },
  {
    filename: 'build-exhaust-picker.png',
    blobPath: 'site-design-v2/build-exhaust-picker.png',
    key: 'buildExhaust',
    description: 'Exhaust parts picker',
  },
  {
    filename: 'build-forced-induction-picker.png',
    blobPath: 'site-design-v2/build-forced-induction-picker.png',
    key: 'buildForcedInduction',
    description: 'Forced induction parts picker',
  },
  {
    filename: 'build-suspension-handling-picker.png',
    blobPath: 'site-design-v2/build-suspension-handling-picker.png',
    key: 'buildSuspension',
    description: 'Suspension & Handling parts picker',
  },
  {
    filename: 'build-brakes-picker.png',
    blobPath: 'site-design-v2/build-brakes-picker.png',
    key: 'buildBrakes',
    description: 'Brakes parts picker',
  },
  {
    filename: 'build-cooling-picker.png',
    blobPath: 'site-design-v2/build-cooling-picker.png',
    key: 'buildCooling',
    description: 'Cooling parts picker',
  },
  {
    filename: 'build-wheels-tires-picker.png',
    blobPath: 'site-design-v2/build-wheels-tires-picker.png',
    key: 'buildWheels',
    description: 'Wheels & Tires parts picker',
  },
  {
    filename: 'build-body-aero-picker.png',
    blobPath: 'site-design-v2/build-body-aero-picker.png',
    key: 'buildAero',
    description: 'Body & Aero parts picker',
  },
  {
    filename: 'build-drivetrain-picker.png',
    blobPath: 'site-design-v2/build-drivetrain-picker.png',
    key: 'buildDrivetrain',
    description: 'Drivetrain parts picker',
  },

  // ============================================
  // PARTS & INSTALL
  // ============================================
  {
    filename: 'parts-shopping-list-al-picks.png',
    blobPath: 'site-design-v2/parts-shopping-list-al-picks.png',
    key: 'partsShoppingList',
    description: 'Parts shopping list with AL top picks',
  },
  {
    filename: 'ask-al-parts-suggestions-modal.png',
    blobPath: 'site-design-v2/ask-al-parts-suggestions-modal.png',
    key: 'askAlPartsModal',
    description: 'Ask AL about parts suggestions modal',
  },
  {
    filename: 'install-parts-list-share.png',
    blobPath: 'site-design-v2/install-parts-list-share.png',
    key: 'installPartsList',
    description: 'Install parts list with share option',
  },
  {
    filename: 'install-guide-diy-list.png',
    blobPath: 'site-design-v2/install-guide-diy-list.png',
    key: 'installGuideDiy',
    description: 'DIY install guide with difficulty ratings',
  },
  {
    filename: 'install-tools-needed.png',
    blobPath: 'site-design-v2/install-tools-needed.png',
    key: 'installTools',
    description: 'Tools needed for install',
  },
  {
    filename: 'install-videos-exhaust.png',
    blobPath: 'site-design-v2/install-videos-exhaust.png',
    key: 'installVideos',
    description: 'Install videos for exhaust',
  },

  // ============================================
  // DATA - Dyno & Performance Metrics
  // ============================================
  {
    filename: 'data-virtual-dyno-chart.png',
    blobPath: 'site-design-v2/data-virtual-dyno-chart.png',
    key: 'dataVirtualDyno',
    description: 'Virtual dyno chart with HP/TQ curves',
    homepage: 'garageData',
  },
  {
    filename: 'data-performance-metrics-scores.png',
    blobPath: 'site-design-v2/data-performance-metrics-scores.png',
    key: 'dataPerformanceMetrics',
    description: 'Performance metrics with experience scores',
    homepage: 'performanceMetrics',
  },
  {
    filename: 'data-power-breakdown-chart.png',
    blobPath: 'site-design-v2/data-power-breakdown-chart.png',
    key: 'dataPowerBreakdown',
    description: 'Power breakdown donut chart',
  },
  {
    filename: 'data-log-dyno-result-modal.png',
    blobPath: 'site-design-v2/data-log-dyno-result-modal.png',
    key: 'dataLogDyno',
    description: 'Log dyno result form modal',
  },

  // ============================================
  // DATA - Track & Lap Times
  // ============================================
  {
    filename: 'data-track-lap-time-estimator.png',
    blobPath: 'site-design-v2/data-track-lap-time-estimator.png',
    key: 'dataLapTimeEstimator',
    description: 'Track lap time estimator with skill selector',
    homepage: 'lapTimeEstimator',
  },
  {
    filename: 'data-track-personal-best.png',
    blobPath: 'site-design-v2/data-track-personal-best.png',
    key: 'dataPersonalBest',
    description: 'Your lap times with personal best',
  },
  {
    filename: 'data-log-lap-time-modal.png',
    blobPath: 'site-design-v2/data-log-lap-time-modal.png',
    key: 'dataLogLapTime',
    description: 'Log lap time form modal',
  },

  // ============================================
  // INSIGHTS
  // ============================================
  {
    filename: 'insights-recommended-upgrades.png',
    blobPath: 'site-design-v2/insights-recommended-upgrades.png',
    key: 'insightsRecommended',
    description: 'Recommended next upgrades with known issues',
    homepage: 'heroLeft',
  },
  {
    filename: 'insights-build-progression.png',
    blobPath: 'site-design-v2/insights-build-progression.png',
    key: 'insightsBuildProgression',
    description: 'Build insights with progression stages',
  },
  {
    filename: 'insights-build-stages-detail.png',
    blobPath: 'site-design-v2/insights-build-stages-detail.png',
    key: 'insightsBuildStages',
    description: 'Build stages detail with HP at completion',
  },
  {
    filename: 'insights-platform-tips.png',
    blobPath: 'site-design-v2/insights-platform-tips.png',
    key: 'insightsPlatformTips',
    description: 'Platform insights with tips',
  },

  // ============================================
  // COMMUNITY
  // ============================================
  {
    filename: 'community-builds-evo-x-track.png',
    blobPath: 'site-design-v2/community-builds-evo-x-track.png',
    key: 'communityBuildsFeed',
    description: 'Community builds feed with Evo X track build',
    homepage: 'communityFeed',
  },
  {
    filename: 'community-build-detail-metrics.png',
    blobPath: 'site-design-v2/community-build-detail-metrics.png',
    key: 'communityBuildMetrics',
    description: 'Community build detail with performance metrics',
  },
  {
    filename: 'community-comments-section.png',
    blobPath: 'site-design-v2/community-comments-section.png',
    key: 'communityComments',
    description: 'Community comments section',
  },
  {
    filename: 'community-events-calendar.png',
    blobPath: 'site-design-v2/community-events-calendar.png',
    key: 'communityEvents',
    description: 'Community events calendar',
  },
  {
    filename: 'community-monthly-leaderboard.png',
    blobPath: 'site-design-v2/community-monthly-leaderboard.png',
    key: 'communityLeaderboard',
    description: 'Monthly leaderboard',
  },

  // ============================================
  // PROFILE
  // ============================================
  {
    filename: 'profile-dashboard-stats.png',
    blobPath: 'site-design-v2/profile-dashboard-stats.png',
    key: 'profileDashboard',
    description: 'Profile dashboard with stats and achievements',
  },

  // ============================================
  // AL CHAT - Welcome & Query States
  // ============================================
  {
    filename: 'al-chat-welcome.png',
    blobPath: 'site-design-v2/al-chat-welcome.png',
    key: 'alChatWelcome',
    description: 'AL chat welcome screen with avatar',
  },
  {
    filename: 'al-chat-welcome-empty.png',
    blobPath: 'site-design-v2/al-chat-welcome-empty.png',
    key: 'alChatWelcomeEmpty',
    description: 'AL chat welcome empty state',
  },
  {
    filename: 'al-chat-thinking-state.png',
    blobPath: 'site-design-v2/al-chat-thinking-state.png',
    key: 'alChatThinking',
    description: 'AL thinking state',
  },
  {
    filename: 'al-chat-parts-analyzing.png',
    blobPath: 'site-design-v2/al-chat-parts-analyzing.png',
    key: 'alChatPartsAnalyzing',
    description: 'AL parts research analyzing',
  },
  {
    filename: 'al-chat-searching-vendors.png',
    blobPath: 'site-design-v2/al-chat-searching-vendors.png',
    key: 'alChatSearchingVendors',
    description: 'AL searching parts vendors',
  },
  {
    filename: 'al-chat-multi-step-search.png',
    blobPath: 'site-design-v2/al-chat-multi-step-search.png',
    key: 'alChatMultiStep',
    description: 'AL multi-step search progress',
  },

  // ============================================
  // AL CHAT - Exhaust Query Flow
  // ============================================
  {
    filename: 'al-chat-exhaust-recommendations.png',
    blobPath: 'site-design-v2/al-chat-exhaust-recommendations.png',
    key: 'alChatExhaustResponse',
    description: 'AL exhaust recommendations response',
    homepage: ['heroRight', 'alChatResponse'],
  },

  // ============================================
  // AL CHAT - Vehicle Comparison Flow
  // ============================================
  {
    filename: 'al-chat-comparison-query.png',
    blobPath: 'site-design-v2/al-chat-comparison-query.png',
    key: 'alChatComparisonQuery',
    description: 'AL vehicle comparison query input',
  },
  {
    filename: 'al-chat-comparison-thinking.png',
    blobPath: 'site-design-v2/al-chat-comparison-thinking.png',
    key: 'alChatComparisonThinking',
    description: 'AL comparison thinking state',
  },
  {
    filename: 'al-chat-car-discovery.png',
    blobPath: 'site-design-v2/al-chat-car-discovery.png',
    key: 'alChatCarDiscovery',
    description: 'AL car discovery analyzing',
  },
  {
    filename: 'al-chat-comparing-vehicles.png',
    blobPath: 'site-design-v2/al-chat-comparing-vehicles.png',
    key: 'alChatComparingVehicles',
    description: 'AL comparing vehicles state',
  },
  {
    filename: 'al-chat-vehicle-comparison-loading.png',
    blobPath: 'site-design-v2/al-chat-vehicle-comparison-loading.png',
    key: 'alChatComparisonLoading',
    description: 'AL searching car database',
  },
  {
    filename: 'al-chat-loading-vehicle-specs.png',
    blobPath: 'site-design-v2/al-chat-loading-vehicle-specs.png',
    key: 'alChatLoadingSpecs',
    description: 'AL loading vehicle specs',
  },
  {
    filename: 'al-chat-loading-specs-progress.png',
    blobPath: 'site-design-v2/al-chat-loading-specs-progress.png',
    key: 'alChatLoadingProgress',
    description: 'AL loading specs with progress',
  },
  {
    filename: 'al-chat-reading-experiences.png',
    blobPath: 'site-design-v2/al-chat-reading-experiences.png',
    key: 'alChatReadingExperiences',
    description: 'AL reading owner experiences',
  },
  {
    filename: 'al-chat-cayman-vs-gt350-response.png',
    blobPath: 'site-design-v2/al-chat-cayman-vs-gt350-response.png',
    key: 'alChatComparisonResponse',
    description: 'AL Cayman S vs GT350 comparison response',
  },
  {
    filename: 'al-chat-mod-potential-comparison.png',
    blobPath: 'site-design-v2/al-chat-mod-potential-comparison.png',
    key: 'alChatModPotential',
    description: 'AL modification potential comparison',
  },
  {
    filename: 'al-chat-comparison-recommendation.png',
    blobPath: 'site-design-v2/al-chat-comparison-recommendation.png',
    key: 'alChatComparisonRecommendation',
    description: 'AL comparison recommendation conclusion',
  },

  // ============================================
  // AL CHAT - Headers/Tune Query Flow
  // ============================================
  {
    filename: 'al-chat-headers-query.png',
    blobPath: 'site-design-v2/al-chat-headers-query.png',
    key: 'alChatHeadersQuery',
    description: 'AL headers tune query input',
  },
  {
    filename: 'al-chat-headers-tune-thinking.png',
    blobPath: 'site-design-v2/al-chat-headers-tune-thinking.png',
    key: 'alChatHeadersThinking',
    description: 'AL headers tune thinking',
  },
  {
    filename: 'al-chat-headers-tune-analyzing.png',
    blobPath: 'site-design-v2/al-chat-headers-tune-analyzing.png',
    key: 'alChatHeadersAnalyzing',
    description: 'AL headers tune parts research',
  },
  {
    filename: 'al-chat-headers-tune-response.png',
    blobPath: 'site-design-v2/al-chat-headers-tune-response.png',
    key: 'alChatHeadersResponse',
    description: 'AL headers tune response with garage context',
  },

  // ============================================
  // AL CHAT - Tire Fitment Query Flow
  // ============================================
  {
    filename: 'al-chat-tire-size-query.png',
    blobPath: 'site-design-v2/al-chat-tire-size-query.png',
    key: 'alChatTireQuery',
    description: 'AL tire size query input',
  },
  {
    filename: 'al-chat-tire-thinking.png',
    blobPath: 'site-design-v2/al-chat-tire-thinking.png',
    key: 'alChatTireThinking',
    description: 'AL tire query thinking',
  },
  {
    filename: 'al-chat-build-planning.png',
    blobPath: 'site-design-v2/al-chat-build-planning.png',
    key: 'alChatBuildPlanning',
    description: 'AL build planning analyzing',
  },
  {
    filename: 'al-chat-loading-specs.png',
    blobPath: 'site-design-v2/al-chat-loading-specs.png',
    key: 'alChatTireLoadingSpecs',
    description: 'AL loading vehicle specs for tire query',
  },
  {
    filename: 'al-chat-tire-fitment-response.png',
    blobPath: 'site-design-v2/al-chat-tire-fitment-response.png',
    key: 'alChatTireResponse',
    description: 'AL tire fitment response',
  },
  {
    filename: 'al-chat-tire-fitment-details.png',
    blobPath: 'site-design-v2/al-chat-tire-fitment-details.png',
    key: 'alChatTireDetails',
    description: 'AL tire fitment response with details',
  },

  // ============================================
  // AL CHAT - History & Settings
  // ============================================
  {
    filename: 'al-conversation-history-sidebar.png',
    blobPath: 'site-design-v2/al-conversation-history-sidebar.png',
    key: 'alChatHistory',
    description: 'AL conversation history sidebar',
  },
];

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

async function uploadToBlob(localPath, blobPath) {
  const { put } = await import('@vercel/blob');
  
  const fullPath = path.join(PROJECT_ROOT, localPath);
  const fileBuffer = fs.readFileSync(fullPath);
  
  const blob = await put(blobPath, fileBuffer, {
    access: 'public',
    contentType: 'image/png',
    token: BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  
  return blob.url;
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     AUTOREV SITE DESIGN v2 → VERCEL BLOB UPLOAD              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  if (!BLOB_READ_WRITE_TOKEN) {
    console.error('❌ ERROR: BLOB_READ_WRITE_TOKEN not found in environment');
    console.error('   Add BLOB_READ_WRITE_TOKEN to your .env.local file');
    process.exit(1);
  }
  
  // Check source folder exists
  const sourcePath = path.join(PROJECT_ROOT, SOURCE_FOLDER);
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ ERROR: Source folder not found: ${SOURCE_FOLDER}`);
    process.exit(1);
  }
  
  console.log(`📁 Source: ${SOURCE_FOLDER}`);
  console.log(`📤 Uploading ${IMAGES_TO_UPLOAD.length} images...\n`);
  
  const urls = {};
  let successCount = 0;
  let failCount = 0;
  let totalSize = 0;
  
  for (const image of IMAGES_TO_UPLOAD) {
    const localPath = path.join(SOURCE_FOLDER, image.filename);
    const fullPath = path.join(PROJECT_ROOT, localPath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ ${image.key} - File not found: ${image.filename}`);
      failCount++;
      continue;
    }
    
    const size = fs.statSync(fullPath).size;
    totalSize += size;
    process.stdout.write(`⬆️  ${image.key} (${formatBytes(size)})...`);
    
    try {
      const url = await uploadToBlob(localPath, image.blobPath);
      urls[image.key] = url;
      successCount++;
      console.log(` ✅`);
    } catch (error) {
      console.log(` ❌ ${error.message}`);
      failCount++;
    }
  }
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                      UPLOAD COMPLETE                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`✅ Success: ${successCount}  ❌ Failed: ${failCount}`);
  console.log(`📦 Total uploaded: ${formatBytes(totalSize)}\n`);
  
  // Generate the update for lib/images.js
  const BLOB_BASE = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com';
  
  const configSnippet = `
// =============================================================================
// SITE DESIGN IMAGES v2 - Jan 30, 2026 App Redesign
// Generated: ${new Date().toISOString()}
// =============================================================================

export const SITE_DESIGN_IMAGES_V2 = {
${Object.entries(urls).map(([key, url]) => `  ${key}: '${url}',`).join('\n')}
};

// Homepage mapping - which v2 images to use for each homepage section
export const HOMEPAGE_IMAGE_MAPPING = {
  // Hero section (3 phones)
  heroCenter: SITE_DESIGN_IMAGES_V2.garageHero,
  heroLeft: SITE_DESIGN_IMAGES_V2.insightsRecommended,
  heroRight: SITE_DESIGN_IMAGES_V2.alChatExhaustResponse,
  
  // Feature sections
  garageOverview: SITE_DESIGN_IMAGES_V2.garageHero,
  tuningOverview: SITE_DESIGN_IMAGES_V2.buildCategories,
  performanceMetrics: SITE_DESIGN_IMAGES_V2.dataPerformanceMetrics,
  garageData: SITE_DESIGN_IMAGES_V2.dataVirtualDyno,
  lapTimeEstimator: SITE_DESIGN_IMAGES_V2.dataLapTimeEstimator,
  communityFeed: SITE_DESIGN_IMAGES_V2.communityBuildsFeed,
  alChatResponse: SITE_DESIGN_IMAGES_V2.alChatExhaustResponse,
};
`;

  // Save the config snippet
  const snippetPath = path.join(PROJECT_ROOT, 'lib/siteDesignImagesV2.js');
  fs.writeFileSync(snippetPath, configSnippet.trim() + '\n');
  console.log(`📄 Config saved to: lib/siteDesignImagesV2.js`);
  
  console.log('\n📋 Next steps:');
  console.log('   1. Review lib/siteDesignImagesV2.js');
  console.log('   2. Import and merge into lib/images.js');
  console.log('   3. Update app/(marketing)/page.jsx to use new images');
  
  console.log('\n🔗 Sample URLs:\n');
  const sampleKeys = ['garageHero', 'buildCategories', 'alChatExhaustResponse', 'communityBuildsFeed'];
  for (const key of sampleKeys) {
    if (urls[key]) {
      console.log(`  ${key}: ${urls[key]}`);
    }
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
