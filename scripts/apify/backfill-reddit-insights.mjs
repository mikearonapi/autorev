#!/usr/bin/env node
/**
 * Backfill Reddit Community Insights via Apify
 * 
 * Scrapes Reddit posts from automotive subreddits and saves
 * meaningful insights to the community_insights table.
 * 
 * Usage:
 *   node scripts/apify/backfill-reddit-insights.mjs                     # Priority cars first
 *   node scripts/apify/backfill-reddit-insights.mjs --limit=5           # Process 5 cars
 *   node scripts/apify/backfill-reddit-insights.mjs --tier=1            # Only Tier 1 priority
 *   node scripts/apify/backfill-reddit-insights.mjs --car=bmw-m3-e92    # Single car
 *   node scripts/apify/backfill-reddit-insights.mjs --dry-run           # Preview without saving
 *   node scripts/apify/backfill-reddit-insights.mjs --all               # Include non-priority cars
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { ApifyClient } from 'apify-client';
import { isPriorityVehicle, getPriorityTier } from './priority-vehicles.mjs';
import { PipelineRun } from '../../lib/pipelineLogger.js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const apify = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

// Parse CLI args
const args = process.argv.slice(2);
const flags = {
  limit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1]) || 10,
  tier: parseInt(args.find(a => a.startsWith('--tier='))?.split('=')[1]) || null,
  car: args.find(a => a.startsWith('--car='))?.split('=')[1] || null,
  dryRun: args.includes('--dry-run'),
  all: args.includes('--all'),
  help: args.includes('--help') || args.includes('-h'),
};

if (flags.help) {
  console.log(`
Backfill Reddit Community Insights

Prioritizes vehicles from Top 100 Sports Sedans by US Modification Market.

Usage:
  node scripts/apify/backfill-reddit-insights.mjs [options]

Options:
  --limit=N      Process N cars (default: 10)
  --tier=N       Only process Tier N priority (1-4, 1=highest)
  --car=SLUG     Process single car by slug
  --all          Include non-priority vehicles
  --dry-run      Preview without saving to database
  --help, -h     Show this help

Priority Tiers:
  Tier 1: Civic Si/Type R, WRX STI, M3, Charger, etc. (highest demand)
  Tier 2: G70, RS3, CTS-V, M5, Stinger, etc.
  Tier 3: IS-F, GR Corolla, Giulia, Legacy GT, etc.
  Tier 4: Older Si generations, GS-F, etc.
  `);
  process.exit(0);
}

// Brand-specific subreddits for better targeting
const BRAND_SUBREDDITS = {
  bmw: ['BMW', 'BMWM', 'e46', 'e90', 'F80'],
  porsche: ['Porsche', 'Porsche911', 'Cayman'],
  toyota: ['Toyota', 'ft86club', 'GR86', 'Supra', 'ToyotaTacoma', '4Runner'],
  subaru: ['subaru', 'WRX', 'BRZ'],
  mazda: ['Mazda', 'Miata', 'MazdaRX7'],
  ford: ['Ford', 'Mustang', 'FordBronco', 'f150'],
  chevrolet: ['Corvette', 'Camaro', 'Silverado'],
  honda: ['Honda', 'civic', 'S2000', 'Acura'],
  nissan: ['Nissan', '350z', 'GTR', '370z'],
  dodge: ['Dodge', 'Challenger', 'Charger'],
  mercedes: ['mercedes_benz', 'AMG'],
  audi: ['Audi', 'AudiRS'],
  volkswagen: ['Volkswagen', 'GolfGTI', 'Golf_R'],
  lexus: ['Lexus', 'Lexus_ISF'],
  jeep: ['Jeep', 'JeepWrangler', 'GrandCherokee'],
  ram: ['ram_trucks', 'Ramtrucks'],
  gmc: ['GMC'],
  cadillac: ['Cadillac'],
  infiniti: ['infiniti', 'G37'],
  mitsubishi: ['mitsubishi', 'EvoX', 'Lancer'],
  hyundai: ['Hyundai', 'VelosterN', 'ElantraN'],
  kia: ['kia', 'Stinger'],
  genesis: ['GenesisMotors'],
  ferrari: ['Ferrari'],
  lamborghini: ['Lamborghini'],
  mclaren: ['mclaren'],
  lotus: ['lotus'],
  jaguar: ['Jaguar'],
  aston_martin: ['AstonMartin'],
  maserati: ['Maserati'],
  rivian: ['Rivian'],
  tesla: ['TeslaMotors'],
};

// General subreddits for all cars
const GENERAL_SUBREDDITS = ['cars', 'Autos', 'whatcarshouldIbuy', 'MechanicAdvice', 'projectcar', 'Cartalk'];

// =============================================================================
// PERFORMANCE-FOCUSED INSIGHT TYPES
// These map to data we actually need in the AutoRev database
// =============================================================================

const INSIGHT_KEYWORDS = {
  // DYNO & POWER - Most valuable for car_dyno_runs table
  dyno_result: [
    'dyno', 'whp', 'bhp', 'crank hp', 'wheel hp', 'horsepower', 'torque',
    'dynojet', 'mustang dyno', 'dyno sheet', 'dyno run', 'dyno day',
    'made power', 'putting down', 'before and after', 'stock dyno', 'tuned dyno'
  ],
  
  // LAP TIMES - For car_track_lap_times table
  lap_time: [
    'lap time', 'track time', 'best time', 'pb', 'personal best',
    'nurburgring', 'laguna seca', 'buttonwillow', 'willow springs', 'road atlanta',
    'hpde', 'time attack', 'autocross', 'track day', 'hot lap',
    'sector time', 'split time'
  ],
  
  // MODIFICATION BUILDS - For tuning_profiles and community_insights
  modification_build: [
    'build list', 'mod list', 'full bolt on', 'fbo', 'stage 1', 'stage 2', 'stage 3',
    'big turbo', 'turbo upgrade', 'supercharger', 'e85', 'flex fuel', 'meth injection',
    'downpipe', 'catless', 'headers', 'intake', 'intercooler', 'charge pipe',
    'tune', 'ecu tune', 'flash', 'piggyback', 'standalone', 'dyno tune', 'e-tune',
    'injectors', 'fuel pump', 'hpfp', 'lpfp', 'cam', 'cams', 'ported'
  ],
  
  // SUSPENSION & HANDLING - For tuning_profiles
  suspension_setup: [
    'coilovers', 'lowering springs', 'sway bar', 'end links', 'camber',
    'alignment', 'corner balance', 'roll center', 'control arms',
    'bushings', 'mounts', 'strut bar', 'chassis brace', 'subframe',
    'wheel fitment', 'offset', 'spacers', 'tire size', 'tire compound',
    'track setup', 'street setup', 'daily setup'
  ],
  
  // KNOWN ISSUES FOR MODDED CARS - Critical for car_issues table
  modding_issue: [
    'rod bearing', 'vanos', 'hpfp', 'wastegate', 'boost leak', 'blow off',
    'ringland', 'head gasket', 'timing chain', 'timing guide', 'spun bearing',
    'carbon buildup', 'walnut blast', 'catch can', 'pcv', 'oil consumption',
    'overheating', 'cooling', 'oil cooler', 'heat soak', 'knock', 'detonation',
    'clutch slip', 'synchro', 'diff', 'axle', 'driveshaft', 'motor mount'
  ],
  
  // BRAKE UPGRADES - For tuning_profiles
  brake_setup: [
    'bbk', 'big brake kit', 'brake pads', 'brake fluid', 'dot4', 'rbf',
    'rotors', 'slotted', 'drilled', 'two-piece', 'floating rotors',
    'brake lines', 'steel braided', 'master cylinder', 'brake fade',
    'track pads', 'street pads', 'bedding', 'brake bias'
  ],
  
  // REAL-WORLD PERFORMANCE DATA
  performance_data: [
    '0-60', '0 to 60', 'quarter mile', '1/4 mile', 'trap speed', 'et',
    '60-130', 'roll race', 'dig', 'from a dig', 'from a roll',
    'top speed', 'vmax', 'speed limiter', 'governor'
  ],
};

// Keywords that indicate NON-useful generic content (filter out)
const GENERIC_CONTENT_KEYWORDS = [
  'should i buy', 'is it worth', 'first car', 'daily driver advice',
  'insurance quote', 'financing', 'lease vs buy', 'depreciation',
  'color choice', 'which color', 'wrap or paint', 'detailing',
  'car wash', 'wax', 'ceramic coating', 'ppf', 'tint percentage'
];

/**
 * Get subreddits relevant to a car brand
 */
function getSubredditsForCar(carName) {
  const nameLower = carName.toLowerCase();
  const subreddits = [...GENERAL_SUBREDDITS];
  
  for (const [brand, brandSubs] of Object.entries(BRAND_SUBREDDITS)) {
    if (nameLower.includes(brand)) {
      subreddits.push(...brandSubs);
    }
  }
  
  // Dedupe and limit
  return [...new Set(subreddits)].slice(0, 8);
}

// Map our detailed types to allowed DB constraint values
const INSIGHT_TYPE_MAP = {
  dyno_result: 'performance_data',      // Dyno numbers → performance_data
  lap_time: 'performance_data',          // Lap times → performance_data
  modification_build: 'modification_guide', // Mod lists → modification_guide
  suspension_setup: 'modification_guide',   // Suspension → modification_guide
  brake_setup: 'modification_guide',        // Brakes → modification_guide
  modding_issue: 'known_issue',            // Tuning problems → known_issue
  performance_data: 'performance_data',    // Already correct
};

/**
 * Classify post into insight type - PERFORMANCE FOCUSED
 * Returns both the detailed type and the DB-compatible type
 */
function classifyInsightType(post) {
  const content = post.body || post.selftext || post.text || '';
  const text = `${post.title || ''} ${content}`.toLowerCase();
  
  let bestMatch = 'modification_build'; // Default for performance content
  let bestScore = 0;
  
  for (const [type, keywords] of Object.entries(INSIGHT_KEYWORDS)) {
    const score = keywords.filter(kw => text.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = type;
    }
  }
  
  return {
    detailed: bestMatch,
    dbType: INSIGHT_TYPE_MAP[bestMatch] || 'modification_guide', // Map to allowed value
  };
}

/**
 * Calculate confidence score based on engagement
 */
function calculateConfidence(post) {
  let score = 0.5;
  
  const upvotes = post.score || post.ups || 0;
  const comments = post.num_comments || post.numComments || 0;
  
  if (upvotes > 100) score += 0.2;
  else if (upvotes > 50) score += 0.15;
  else if (upvotes > 20) score += 0.1;
  else if (upvotes > 10) score += 0.05;
  
  if (comments > 50) score += 0.15;
  else if (comments > 20) score += 0.1;
  else if (comments > 10) score += 0.05;
  
  const textLength = (post.body || post.selftext || post.text || '').length;
  if (textLength > 1000) score += 0.1;
  else if (textLength > 500) score += 0.05;
  
  return Math.min(score, 0.95);
}

/**
 * Calculate consensus strength
 */
function calculateConsensusStrength(post) {
  const ratio = post.upvote_ratio || post.upvoteRatio || 0.5;
  const score = post.score || post.ups || 0;
  
  if (ratio > 0.9 && score > 50) return 'strong';
  if (ratio > 0.75 && score > 20) return 'moderate';
  return 'single_source';
}

/**
 * Extract PERFORMANCE-FOCUSED tags from content
 */
function extractTags(post) {
  const content = post.body || post.selftext || post.text || '';
  const text = `${post.title || ''} ${content}`.toLowerCase();
  const tags = [];
  
  // Performance-focused tag patterns
  const tagPatterns = {
    'dyno': ['dyno', 'whp', 'bhp', 'horsepower', 'torque'],
    'track': ['track', 'lap time', 'hpde', 'autocross', 'time attack'],
    'turbo': ['turbo', 'boost', 'wastegate', 'intercooler', 'downpipe'],
    'supercharger': ['supercharger', 'supercharged', 'centrifugal', 'roots', 'twin screw'],
    'e85': ['e85', 'flex fuel', 'ethanol', 'corn'],
    'tune': ['tune', 'tuned', 'flash', 'ecu', 'piggyback', 'standalone'],
    'fbo': ['fbo', 'full bolt on', 'bolt-ons', 'stage 2', 'stage 3'],
    'suspension': ['coilovers', 'suspension', 'handling', 'alignment', 'camber'],
    'brakes': ['bbk', 'brake', 'pads', 'rotors', 'fade'],
    'quarter-mile': ['quarter mile', '1/4 mile', 'drag', 'et', 'trap speed'],
    '0-60': ['0-60', '0 to 60', 'acceleration'],
    'reliability-modded': ['rod bearing', 'failure', 'broke', 'problem', 'issue'],
  };
  
  for (const [tag, keywords] of Object.entries(tagPatterns)) {
    if (keywords.some(kw => text.includes(kw))) {
      tags.push(tag);
    }
  }
  
  return tags.slice(0, 6);
}

/**
 * Extract specific performance numbers from text
 * Returns structured data when found
 */
function extractPerformanceNumbers(text) {
  const numbers = {};
  
  // HP/WHP patterns: "350 whp", "400bhp", "450 hp"
  const hpMatch = text.match(/(\d{2,4})\s*(whp|bhp|hp|crank hp|wheel hp)/i);
  if (hpMatch) numbers.horsepower = parseInt(hpMatch[1]);
  
  // Torque patterns: "400 lb-ft", "350 tq", "380 ft-lbs"
  const tqMatch = text.match(/(\d{2,4})\s*(lb-?ft|tq|ft-?lbs?|nm)/i);
  if (tqMatch) numbers.torque = parseInt(tqMatch[1]);
  
  // 0-60 patterns: "3.8 0-60", "0-60 in 4.2"
  const zeroSixtyMatch = text.match(/0-60[:\s]+(\d+\.?\d*)|(\d+\.?\d*)\s*(?:sec|s)?\s*0-60/i);
  if (zeroSixtyMatch) numbers.zeroToSixty = parseFloat(zeroSixtyMatch[1] || zeroSixtyMatch[2]);
  
  // Quarter mile: "11.5 @ 120", "12.1 quarter"
  const qmMatch = text.match(/(\d{1,2}\.\d+)\s*(?:@|at)?\s*(\d{2,3})?\s*(?:mph)?\s*(?:quarter|1\/4)/i);
  if (qmMatch) {
    numbers.quarterMile = parseFloat(qmMatch[1]);
    if (qmMatch[2]) numbers.trapSpeed = parseInt(qmMatch[2]);
  }
  
  // Boost: "22 psi", "18lbs boost"
  const boostMatch = text.match(/(\d{1,2})\s*(psi|lbs?)\s*(?:boost)?/i);
  if (boostMatch) numbers.boostPsi = parseInt(boostMatch[1]);
  
  return Object.keys(numbers).length > 0 ? numbers : null;
}

/**
 * Transform Reddit post to community_insights record - PERFORMANCE FOCUSED
 */
function transformToInsight(post, carId, carSlug) {
  const content = post.body || post.selftext || post.text || '';
  const title = post.title || '';
  const fullText = `${title} ${content}`;
  const subreddit = post.subreddit || post.subreddit_name_prefixed?.replace('r/', '') || 'unknown';
  const score = post.score || post.ups || 0;
  const numComments = post.num_comments || post.numComments || 0;
  
  // Build URL
  let url = post.url || post.permalink;
  if (url && !url.startsWith('http')) {
    url = `https://reddit.com${url}`;
  }
  
  // For comments without titles, create a title from content
  const displayTitle = title || content.substring(0, 100) + (content.length > 100 ? '...' : '');
  
  // Extract specific performance numbers if present
  const performanceNumbers = extractPerformanceNumbers(fullText);
  
  // Get insight type and tags
  const { detailed: detailedType, dbType: insightType } = classifyInsightType(post);
  const tags = extractTags(post);
  
  return {
    car_id: carId,
    insight_type: insightType, // DB-compatible type
    title: displayTitle.substring(0, 255),
    summary: content.length > 500 
      ? content.substring(0, 500) + '...'
      : content || displayTitle,
    details: {
      content: content,
      tags: tags,
      all_car_slugs: [carSlug],
      source_quotes: content ? [content.substring(0, 500)] : [],
      // Performance-specific data (when available)
      performance_numbers: performanceNumbers,
      detailed_type: detailedType, // dyno_result, lap_time, modification_build, etc.
      usefulness_score: post._usefulnessScore || 0,
      reddit: {
        author: post.author || post.author_fullname,
        score: score,
        numComments: numComments,
        upvoteRatio: post.upvote_ratio || post.upvoteRatio,
        subreddit: subreddit,
        createdUtc: post.created_utc || post.createdUtc || post.created,
        isComment: !title,
      },
    },
    confidence: calculateConfidence(post),
    consensus_strength: calculateConsensusStrength(post),
    source_forum: `reddit:${subreddit}`,
    source_urls: url ? [url] : [],
    // For AL semantic search - combine key searchable text
    embedding_text: [
      displayTitle,
      tags.join(' '),
      insightType.replace(/_/g, ' '),
      content.substring(0, 1500), // Cap content for embedding
    ].filter(Boolean).join(' | '),
    source_count: 1,
    is_verified: false,
    is_active: true,
  };
}

/**
 * Build PERFORMANCE-FOCUSED search queries for a car
 * Targets: dyno results, lap times, modification builds, tuning data
 */
function buildSearchQueries(carName) {
  // Extract key identifiers (e.g., "M3", "E92")
  const identifiers = extractModelIdentifiers(carName);
  
  // Build the most specific search term possible
  // E.g., "E92 M3" or "WRX STI" or "Civic Si"
  let searchBase;
  if (identifiers.length >= 2) {
    searchBase = identifiers.join(' ');
  } else if (identifiers.length === 1) {
    // Use brand + identifier: "BMW M3" or "Subaru WRX"
    const brand = carName.split(' ')[0];
    searchBase = `${brand} ${identifiers[0]}`;
  } else {
    // Fallback to full name
    searchBase = carName;
  }
  
  // Performance-focused queries with SPECIFIC car name
  const queries = [
    // Dyno results (most valuable) - include car name explicitly
    `"${searchBase}" dyno`,
    
    // Modification builds with specific terms
    `"${searchBase}" build mods`,
    
    // Track/lap times
    `"${searchBase}" track time`,
    
    // Known modding issues (critical for reliability when tuned)  
    `"${searchBase}" tuning problems`,
  ];
  
  return queries;
}

/**
 * Scrape Reddit for a car using Apify (trudax/reddit-scraper-lite)
 */
async function scrapeRedditForCar(carName, subreddits) {
  const searches = buildSearchQueries(carName);
  console.log(`  [Reddit] Searching for: ${searches.join(' | ')}`);
  
  try {
    const run = await apify.actor('trudax/reddit-scraper-lite').call({
      searches: searches,
      maxItems: 60, // Total items across all searches
      sort: 'relevance',
      time: 'all',
      proxy: { useApifyProxy: true },
    });
    
    const { items } = await apify.dataset(run.defaultDatasetId).listItems();
    return items || [];
  } catch (err) {
    console.error(`  [Reddit] Error:`, err.message);
    return [];
  }
}

/**
 * Extract model identifiers from car name
 * "BMW M3 E92" -> ["m3", "e92"]
 * "Porsche 911 GT3 996" -> ["911", "gt3", "996"]
 */
function extractModelIdentifiers(carName) {
  const name = carName.toLowerCase();
  const identifiers = [];
  
  // Model codes (M3, GT3, STI, etc.)
  const modelMatch = name.match(/\b(m[1-8]|gt[2-4]|rs[3-7]|sti|wrx|type[\s-]?r|amg|gtr?|z[0-9]{2,3})\b/gi);
  if (modelMatch) identifiers.push(...modelMatch.map(m => m.toLowerCase()));
  
  // Generation codes (E92, F80, 996, etc.)
  const genMatch = name.match(/\b([a-z]\d{2,3}|\d{3})\b/gi);
  if (genMatch) identifiers.push(...genMatch.map(m => m.toLowerCase()));
  
  // Car numbers (911, 350z, etc.)
  const numMatch = name.match(/\b(\d{3}[a-z]?)\b/gi);
  if (numMatch) identifiers.push(...numMatch.map(m => m.toLowerCase()));
  
  return [...new Set(identifiers)].filter(i => i.length >= 2);
}

/**
 * Filter posts that are relevant to the car
 */
function filterRelevantPosts(posts, carName) {
  const identifiers = extractModelIdentifiers(carName);
  const brandKeywords = ['bmw', 'porsche', 'toyota', 'subaru', 'mazda', 'ford', 'chevrolet', 
                          'honda', 'nissan', 'dodge', 'mercedes', 'audi', 'volkswagen', 'lexus'];
  
  // Extract brand from car name
  const carBrand = brandKeywords.find(b => carName.toLowerCase().includes(b));
  
  console.log(`   Filtering for identifiers: [${identifiers.join(', ')}]`);
  
  return posts.filter(post => {
    const content = post.body || post.selftext || post.text || '';
    const text = `${post.title || ''} ${content}`.toLowerCase();
    const subreddit = (post.subreddit || post.subreddit_name_prefixed || '').toLowerCase();
    
    // Check if post mentions any key identifiers
    const matchedIds = identifiers.filter(id => text.includes(id));
    
    // If in brand-specific subreddit AND mentions model code, it's relevant
    // e.g., in r/BMW and mentions "M3" or "E92"
    if (carBrand && subreddit.includes(carBrand.substring(0, 3))) {
      return matchedIds.length >= 1;
    }
    
    // For general subreddits, need more matches
    return matchedIds.length >= 1 || text.includes(carName.toLowerCase());
  });
}

/**
 * Check if content contains performance/modification data we need
 */
function hasPerformanceContent(text) {
  const textLower = text.toLowerCase();
  
  // Check for any performance-related keywords
  for (const keywords of Object.values(INSIGHT_KEYWORDS)) {
    if (keywords.some(kw => textLower.includes(kw))) {
      return true;
    }
  }
  return false;
}

/**
 * Check if content is generic/not useful
 */
function isGenericContent(text) {
  const textLower = text.toLowerCase();
  return GENERIC_CONTENT_KEYWORDS.some(kw => textLower.includes(kw));
}

/**
 * Calculate a "usefulness score" for performance data
 * Higher = more valuable for our database
 */
function calculateUsefulnessScore(post) {
  const content = post.body || post.selftext || post.text || '';
  const text = `${post.title || ''} ${content}`.toLowerCase();
  let score = 0;
  
  // Dyno data is GOLD - highest value
  if (INSIGHT_KEYWORDS.dyno_result.some(kw => text.includes(kw))) score += 10;
  
  // Lap times are very valuable
  if (INSIGHT_KEYWORDS.lap_time.some(kw => text.includes(kw))) score += 8;
  
  // Specific power numbers (regex for "XXX whp" patterns)
  if (/\d{2,3}\s*(whp|bhp|hp|lb-?ft|tq)/i.test(text)) score += 5;
  
  // Build lists with specific parts
  if (INSIGHT_KEYWORDS.modification_build.some(kw => text.includes(kw))) score += 4;
  
  // Known issues when modding
  if (INSIGHT_KEYWORDS.modding_issue.some(kw => text.includes(kw))) score += 4;
  
  // Suspension/brake setup details
  if (INSIGHT_KEYWORDS.suspension_setup.some(kw => text.includes(kw))) score += 3;
  if (INSIGHT_KEYWORDS.brake_setup.some(kw => text.includes(kw))) score += 3;
  
  // 0-60, quarter mile times
  if (INSIGHT_KEYWORDS.performance_data.some(kw => text.includes(kw))) score += 5;
  
  // Penalize generic content
  if (isGenericContent(text)) score -= 5;
  
  return score;
}

/**
 * Filter by quality thresholds - PERFORMANCE FOCUSED
 */
function filterByQuality(posts, options = {}) {
  const { minScore = 1, minContentLength = 150, minUsefulnessScore = 3 } = options;
  
  return posts.filter(post => {
    const score = post.score || post.ups || 0;
    const content = post.body || post.selftext || post.text || '';
    const fullText = `${post.title || ''} ${content}`;
    const contentLength = content.length;
    
    // Skip AutoModerator and bot posts
    const author = post.author || post.author_fullname || '';
    if (author === 'AutoModerator' || author.includes('Bot')) return false;
    
    // Skip sale/trade posts
    const title = (post.title || '').toLowerCase();
    if (title.includes('[wts]') || title.includes('[wtb]') || title.includes('for sale')) return false;
    
    // Skip very short content
    if (contentLength < minContentLength) return false;
    
    // CRITICAL: Must have performance-related content
    if (!hasPerformanceContent(fullText)) return false;
    
    // Skip if it's just generic advice
    if (isGenericContent(fullText) && !hasPerformanceContent(fullText)) return false;
    
    // Calculate usefulness for our database
    const usefulness = calculateUsefulnessScore(post);
    if (usefulness < minUsefulnessScore) return false;
    
    // Store usefulness score for later sorting
    post._usefulnessScore = usefulness;
    
    return true;
  }).sort((a, b) => (b._usefulnessScore || 0) - (a._usefulnessScore || 0)); // Most useful first
}

/**
 * Process a single car
 */
async function processCar(car, options = {}) {
  const { dryRun = false } = options;
  
  console.log(`\n📱 Processing: ${car.name} (${car.slug})`);
  
  // Get relevant subreddits
  const subreddits = getSubredditsForCar(car.name);
  console.log(`   Subreddits: ${subreddits.join(', ')}`);
  
  // Scrape Reddit
  const posts = await scrapeRedditForCar(car.name, subreddits);
  console.log(`   Found ${posts.length} total posts`);
  
  if (posts.length === 0) {
    return { car: car.slug, success: false, reason: 'No posts found' };
  }
  
  // Filter relevant posts
  const relevant = filterRelevantPosts(posts, car.name);
  console.log(`   ${relevant.length} mention ${car.name}`);
  
  // Filter by quality
  const quality = filterByQuality(relevant);
  console.log(`   ${quality.length} pass quality threshold`);
  
  if (quality.length === 0) {
    return { car: car.slug, success: true, postsFound: posts.length, insightsSaved: 0, reason: 'No quality posts' };
  }
  
  // Transform to insights
  const insights = quality.map(post => transformToInsight(post, car.id, car.slug));
  
  // Check for existing insights to avoid duplicates
  const { data: existing } = await supabase
    .from('community_insights')
    .select('source_urls')
    .eq('car_id', car.id)
    .ilike('source_forum', 'reddit:%');
  
  const existingUrls = new Set(
    existing?.flatMap(e => e.source_urls || []) || []
  );
  
  const newInsights = insights.filter(i => 
    !existingUrls.has(i.source_urls[0])
  );
  
  console.log(`   ${newInsights.length} new insights (${insights.length - newInsights.length} duplicates skipped)`);
  
  if (newInsights.length === 0) {
    return { car: car.slug, success: true, postsFound: posts.length, insightsSaved: 0, reason: 'All duplicates' };
  }
  
  if (dryRun) {
    console.log('   [DRY RUN] Would save:', newInsights.length, 'insights');
    console.log('   Sample insight:', JSON.stringify(newInsights[0], null, 2).substring(0, 500) + '...');
    return { car: car.slug, success: true, dryRun: true, insightsSaved: newInsights.length };
  }
  
  // Save to database
  const { data, error } = await supabase
    .from('community_insights')
    .insert(newInsights)
    .select('id');
  
  if (error) {
    console.error(`   ❌ Error saving:`, error.message);
    return { car: car.slug, success: false, error: error.message };
  }
  
  console.log(`   ✅ Saved ${data.length} insights`);
  return { car: car.slug, success: true, postsFound: posts.length, insightsSaved: data.length };
}

/**
 * Get cars with fewest Reddit insights, prioritized by market importance
 */
async function getCarsNeedingInsights(limit, options = {}) {
  const { tierFilter = null, includeNonPriority = false } = options;
  
  const { data: cars } = await supabase
    .from('cars')
    .select('id, slug, name')
    .order('name');
  
  const { data: insightCounts } = await supabase
    .from('community_insights')
    .select('car_id')
    .ilike('source_forum', 'reddit:%');
  
  const countMap = {};
  insightCounts?.forEach(i => {
    if (i.car_id) countMap[i.car_id] = (countMap[i.car_id] || 0) + 1;
  });
  
  // Add priority tier and insight count to each car
  const enriched = cars.map(c => ({
    ...c,
    insightCount: countMap[c.id] || 0,
    priorityTier: getPriorityTier(c.slug),
    isPriority: isPriorityVehicle(c.name),
  }));
  
  // Filter by tier if specified
  let filtered = enriched;
  if (tierFilter) {
    filtered = enriched.filter(c => c.priorityTier === tierFilter);
  } else if (!includeNonPriority) {
    // By default, only include priority vehicles (tiers 1-4)
    filtered = enriched.filter(c => c.priorityTier <= 4);
  }
  
  // Sort by: priority tier first, then fewest insights, then name
  const sorted = filtered.sort((a, b) => {
    // Priority tier (lower = higher priority)
    if (a.priorityTier !== b.priorityTier) {
      return a.priorityTier - b.priorityTier;
    }
    // Fewest insights first
    if (a.insightCount !== b.insightCount) {
      return a.insightCount - b.insightCount;
    }
    // Alphabetical
    return a.name.localeCompare(b.name);
  });
  
  return sorted.slice(0, limit);
}

/**
 * Main
 */
async function main() {
  console.log('📱 Reddit Community Insights Backfill\n');
  
  if (!process.env.APIFY_API_TOKEN) {
    console.error('❌ APIFY_API_TOKEN not set in .env.local');
    process.exit(1);
  }
  
  // Initialize pipeline logging (skip for dry runs)
  const pipelineRun = flags.dryRun ? null : new PipelineRun('backfill-reddit-insights', {
    params: { limit: flags.limit, tier: flags.tier, car: flags.car, all: flags.all },
    triggeredBy: 'manual',
  });
  
  if (pipelineRun) await pipelineRun.start();
  
  try {
    let cars = [];
    
    if (flags.car) {
      const { data: car, error } = await supabase
        .from('cars')
        .select('id, slug, name')
        .eq('slug', flags.car)
        .single();
      
      if (!car || error) {
        console.error(`❌ Car not found: ${flags.car}`);
        process.exit(1);
      }
      
      cars = [car];
    } else {
      cars = await getCarsNeedingInsights(flags.limit);
      console.log(`Found ${cars.length} cars needing Reddit insights\n`);
      cars.forEach((c, i) => console.log(`  ${i + 1}. ${c.name} (${c.insightCount} existing)`));
    }
    
    if (cars.length === 0) {
      console.log('✅ All cars have Reddit insights!');
      if (pipelineRun) await pipelineRun.complete();
      return;
    }
    
    if (flags.dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes will be saved\n');
    }
    
    const results = [];
    
    for (const car of cars) {
      const result = await processCar(car, { dryRun: flags.dryRun });
      results.push(result);
      
      // Track in pipeline run
      if (pipelineRun && result.success) {
        pipelineRun.recordCreated(result.insightsSaved || 0);
      } else if (pipelineRun && !result.success) {
        pipelineRun.recordFailed(1, result.reason || result.error);
      }
      
      // Rate limit: 5s between cars
      if (cars.indexOf(car) < cars.length - 1) {
        console.log('   Waiting 5s before next car...');
        await new Promise(r => setTimeout(r, 5000));
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const totalInsights = results.reduce((sum, r) => sum + (r.insightsSaved || 0), 0);
    
    console.log(`\n✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`📊 Total insights saved: ${totalInsights}`);
    
    if (failed.length > 0) {
      console.log('\nFailed cars:');
      failed.forEach(r => console.log(`  - ${r.car}: ${r.reason || r.error}`));
    }
    
    if (totalInsights > 0 && !flags.dryRun) {
      console.log('\n🎉 Reddit insights saved successfully!');
      console.log('   AL can now use these via search_community_insights tool');
    }
    
    // Complete pipeline run
    if (pipelineRun) await pipelineRun.complete();
    
  } catch (err) {
    if (pipelineRun) await pipelineRun.fail(err);
    throw err;
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
