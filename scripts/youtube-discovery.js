#!/usr/bin/env node

/**
 * YouTube Video Discovery Job
 * 
 * Discovers relevant YouTube videos for cars in the database by:
 * 1. Fetching active channels from the whitelist
 * 2. For each car, searching for videos from whitelisted channels
 * 3. Adding discovered videos to the ingestion queue
 * 
 * Usage:
 *   node scripts/youtube-discovery.js [options]
 * 
 * Options:
 *   --car-slug <slug>     Only process a specific car
 *   --channel-id <id>     Only process a specific channel
 *   --dry-run             Don't write to database, just log discoveries
 *   --limit <n>           Limit number of cars to process (default: all)
 *   --verbose             Enable verbose logging
 * 
 * Environment Variables:
 *   GOOGLE_AI_API_KEY     Required: Google API key (with YouTube Data API v3 enabled)
 *   SUPABASE_URL          Required: Supabase project URL
 *   SUPABASE_SERVICE_KEY  Required: Supabase service role key
 * 
 * @module scripts/youtube-discovery
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Configuration
// ============================================================================

// Use GOOGLE_AI_API_KEY for YouTube Data API (same Google Cloud project)
const YOUTUBE_API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.YOUTUBE_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  carSlug: null,
  channelId: null,
  dryRun: false,
  limit: null,
  verbose: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--car-slug':
      options.carSlug = args[++i];
      break;
    case '--channel-id':
      options.channelId = args[++i];
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--limit':
      options.limit = parseInt(args[++i], 10);
      break;
    case '--verbose':
      options.verbose = true;
      break;
  }
}

// Logging helpers
const log = (...args) => console.log('[discovery]', ...args);
const logVerbose = (...args) => options.verbose && console.log('[discovery:verbose]', ...args);
const logError = (...args) => console.error('[discovery:error]', ...args);

// ============================================================================
// YouTube API Client
// ============================================================================

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Make a YouTube API request
 * @param {string} endpoint - API endpoint (e.g., 'search', 'videos')
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} API response
 */
async function youtubeApiRequest(endpoint, params) {
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
  url.searchParams.set('key', YOUTUBE_API_KEY);
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  }

  logVerbose(`API request: ${endpoint}`, params);

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`YouTube API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  return response.json();
}

/**
 * Search for videos by query, optionally filtered by channel
 * @param {string} query - Search query
 * @param {Object} opts - Search options
 * @param {string} [opts.channelId] - Filter by channel ID
 * @param {number} [opts.maxResults=10] - Maximum results
 * @returns {Promise<Array>} Array of video items
 */
async function searchVideos(query, { channelId, maxResults = 10 } = {}) {
  const params = {
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults,
    order: 'relevance',
    relevanceLanguage: 'en'
  };

  if (channelId) {
    params.channelId = channelId;
  }

  const response = await youtubeApiRequest('search', params);
  return response.items || [];
}

/**
 * Get detailed video information
 * @param {string[]} videoIds - Array of video IDs
 * @returns {Promise<Array>} Array of video details
 */
async function getVideoDetails(videoIds) {
  if (!videoIds.length) return [];

  const response = await youtubeApiRequest('videos', {
    part: 'snippet,contentDetails,statistics',
    id: videoIds.join(',')
  });

  return response.items || [];
}

/**
 * Parse ISO 8601 duration to seconds
 * @param {string} duration - ISO 8601 duration (e.g., 'PT12M34S')
 * @returns {number} Duration in seconds
 */
function parseDuration(duration) {
  if (!duration) return 0;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);

  return hours * 3600 + minutes * 60 + seconds;
}

// ============================================================================
// Discovery Logic
// ============================================================================

/**
 * Generate search queries for a car
 * @param {Object} car - Car object from database
 * @returns {string[]} Array of search queries to try
 */
function generateSearchQueries(car) {
  const queries = [];
  const { name, brand, years, slug } = car;

  // Primary query: full name + review
  queries.push(`${name} review`);
  
  // Brand + model variations
  if (brand) {
    queries.push(`${brand} ${name} review`);
  }

  // With year range for specificity
  if (years) {
    const startYear = years.split('-')[0];
    queries.push(`${startYear} ${name} review`);
  }

  // Track-specific searches
  queries.push(`${name} track test`);
  queries.push(`${name} POV drive`);

  // Comparison searches
  queries.push(`${name} vs`);

  return queries;
}

/**
 * Filter candidate videos based on relevance criteria
 * @param {Object} video - Video object from YouTube API
 * @param {Object} car - Car object
 * @returns {Object|null} Filtered video with match confidence, or null
 */
function filterAndScoreVideo(video, car) {
  const title = video.snippet?.title?.toLowerCase() || '';
  const description = video.snippet?.description?.toLowerCase() || '';
  const carName = car.name.toLowerCase();
  const carSlug = car.slug.toLowerCase().replace(/-/g, ' ');
  
  // Generate alternative name variations for better matching
  // e.g., "Audi RS7 Sportback" -> ["audi rs7 sportback", "audi rs7", "rs7 sportback", "rs7"]
  const nameVariations = [carName, carSlug];
  
  // Add shorter variations (remove common suffixes like Sportback, Coupe, Sedan)
  const suffixes = ['sportback', 'coupe', 'sedan', 'wagon', 'convertible', 'roadster', 'cabriolet', 'gran coupe', 'competition'];
  for (const suffix of suffixes) {
    if (carName.includes(suffix)) {
      nameVariations.push(carName.replace(suffix, '').trim());
    }
  }
  
  // Also try brand + model without generation code (e.g., "Audi RS7" from "Audi RS7 Sportback")
  const brand = car.brand?.toLowerCase() || '';
  const words = carName.split(' ');
  if (words.length >= 2) {
    // Try "brand model" combo (e.g., "audi rs7")
    nameVariations.push(`${words[0]} ${words[1]}`);
    // Try just the model (e.g., "rs7")
    if (words[1]) nameVariations.push(words[1]);
  }

  // Check if video title or description contains any name variation
  const titleMatch = nameVariations.some(v => v && title.includes(v));
  const descMatch = nameVariations.some(v => v && description.includes(v));

  if (!titleMatch && !descMatch) {
    logVerbose(`Skipping "${video.snippet?.title}" - no car name match (tried: ${nameVariations.slice(0, 3).join(', ')}...)`);
    return null;
  }

  // Score the match
  let confidence = 0.5;

  if (titleMatch) confidence += 0.3;
  if (descMatch) confidence += 0.1;

  // Boost for "review" in title
  if (title.includes('review')) confidence += 0.1;

  // Check duration (prefer 5-30 minute videos for reviews)
  const duration = parseDuration(video.contentDetails?.duration);
  if (duration >= 300 && duration <= 1800) {
    confidence += 0.1;
  }

  // Cap at 1.0
  confidence = Math.min(1.0, confidence);

  return {
    ...video,
    matchConfidence: confidence,
    matchMethod: titleMatch ? 'exact_title' : 'description_match'
  };
}

/**
 * Determine content type from video metadata
 * @param {Object} video - Video object
 * @returns {string} Content type
 */
function detectContentType(video) {
  const title = video.snippet?.title?.toLowerCase() || '';
  const description = video.snippet?.description?.toLowerCase() || '';
  const combined = `${title} ${description}`;

  if (combined.includes('drag race') || combined.includes('0-60')) {
    return 'drag_race';
  }
  if (combined.includes('track test') || combined.includes('lap time') || combined.includes('nurburgring')) {
    return 'track_test';
  }
  if (combined.includes('pov') || combined.includes('point of view')) {
    return 'pov_drive';
  }
  if (combined.includes(' vs ') || combined.includes('comparison') || combined.includes('head to head')) {
    return 'comparison';
  }
  if (combined.includes('buying') || combined.includes('should you buy') || combined.includes("buyer's guide")) {
    return 'buying_guide';
  }
  if (combined.includes('long term') || combined.includes('ownership') || combined.includes('year update')) {
    return 'ownership_update';
  }
  if (combined.includes('review')) {
    return 'review';
  }

  return 'review'; // Default
}

// ============================================================================
// Main Discovery Process
// ============================================================================

async function main() {
  log('Starting YouTube video discovery...');
  log('Options:', options);

  // Validate configuration
  if (!YOUTUBE_API_KEY) {
    logError('GOOGLE_AI_API_KEY (or YOUTUBE_API_KEY) environment variable is required');
    process.exit(1);
  }

  if (!options.dryRun && (!SUPABASE_URL || !SUPABASE_SERVICE_KEY)) {
    logError('SUPABASE_URL and SUPABASE_SERVICE_KEY are required (or use --dry-run)');
    process.exit(1);
  }

  // Initialize Supabase client
  const supabase = options.dryRun 
    ? null 
    : createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Fetch channels
  log('Fetching active channels...');
  let channels = [];

  if (options.dryRun) {
    // Use hardcoded channel list for dry run
    channels = [
      { channel_id: 'UCsAegdhiYLEoaFGuJFVrqFQ', channel_name: 'Throttle House', credibility_tier: 'tier1' },
      { channel_id: 'UCbW18JZRgko_KbSITbHWlpQ', channel_name: 'carwow', credibility_tier: 'tier1' },
      { channel_id: 'UCsqjHFMB_JYTaEnf_vmTNqg', channel_name: 'Doug DeMuro', credibility_tier: 'tier2' }
    ];
  } else {
    let channelQuery = supabase
      .from('youtube_channels')
      .select('*')
      .eq('is_active', true);

    if (options.channelId) {
      channelQuery = channelQuery.eq('channel_id', options.channelId);
    }

    const { data, error } = await channelQuery;
    if (error) {
      logError('Failed to fetch channels:', error);
      process.exit(1);
    }
    channels = data || [];
  }

  log(`Found ${channels.length} active channels`);

  // Fetch cars
  log('Fetching cars...');
  let cars = [];

  if (options.dryRun) {
    // Use sample cars for dry run
    cars = [
      { slug: '718-cayman-gt4', name: '718 Cayman GT4', brand: 'Porsche', years: '2020-2024' },
      { slug: 'c8-corvette-stingray', name: 'C8 Corvette Stingray', brand: 'Chevrolet', years: '2020-2024' }
    ];
  } else {
    let carQuery = supabase
      .from('cars')
      .select('slug, name, brand, years, tier, category')
      .order('tier', { ascending: true });

    if (options.carSlug) {
      carQuery = carQuery.eq('slug', options.carSlug);
    }

    if (options.limit) {
      carQuery = carQuery.limit(options.limit);
    }

    const { data, error } = await carQuery;
    if (error) {
      logError('Failed to fetch cars:', error);
      process.exit(1);
    }
    cars = data || [];
  }

  log(`Found ${cars.length} cars to process`);

  // Track statistics
  const stats = {
    carsProcessed: 0,
    videosDiscovered: 0,
    videosQueued: 0,
    videosSkipped: 0,
    errors: 0
  };

  // Process each car
  for (const car of cars) {
    log(`\nProcessing: ${car.name} (${car.slug})`);
    stats.carsProcessed++;

    const queries = generateSearchQueries(car);
    const discoveredVideoIds = new Set();

    // Search each channel for this car
    for (const channel of channels) {
      logVerbose(`  Searching channel: ${channel.channel_name}`);

      // Try first two queries per channel to conserve API quota
      for (const query of queries.slice(0, 2)) {
        try {
          const searchResults = await searchVideos(query, {
            channelId: channel.channel_id,
            maxResults: 5
          });

          for (const result of searchResults) {
            const videoId = result.id?.videoId;
            if (videoId && !discoveredVideoIds.has(videoId)) {
              discoveredVideoIds.add(videoId);
            }
          }

          // Rate limiting - 100ms between requests
          await new Promise(r => setTimeout(r, 100));

        } catch (error) {
          logError(`  Search error for "${query}":`, error.message);
          stats.errors++;
        }
      }
    }

    if (discoveredVideoIds.size === 0) {
      log(`  No videos discovered for ${car.name}`);
      continue;
    }

    log(`  Found ${discoveredVideoIds.size} candidate videos`);
    stats.videosDiscovered += discoveredVideoIds.size;

    // Get video details
    const videoIds = Array.from(discoveredVideoIds);
    let videoDetails = [];

    try {
      videoDetails = await getVideoDetails(videoIds);
    } catch (error) {
      logError(`  Failed to get video details:`, error.message);
      stats.errors++;
      continue;
    }

    // Filter and score videos
    const scoredVideos = videoDetails
      .map(v => filterAndScoreVideo(v, car))
      .filter(v => v !== null)
      .sort((a, b) => b.matchConfidence - a.matchConfidence)
      .slice(0, 5); // Keep top 5 per car

    log(`  ${scoredVideos.length} videos passed filtering`);

    // Queue videos for ingestion
    for (const video of scoredVideos) {
      const queueItem = {
        video_id: video.id,
        video_url: `https://www.youtube.com/watch?v=${video.id}`,
        channel_id: video.snippet.channelId,
        discovered_via: 'search_api',
        search_query: video.searchQuery || `${car.name} review`,
        target_car_slug: car.slug,
        status: 'pending',
        priority: video.matchConfidence >= 0.8 ? 2 : 1
      };

      if (options.dryRun) {
        log(`  [DRY RUN] Would queue: "${video.snippet.title}" (confidence: ${video.matchConfidence.toFixed(2)})`);
        stats.videosQueued++;
      } else {
        try {
          // Check if video already exists
          const { data: existing } = await supabase
            .from('youtube_videos')
            .select('video_id')
            .eq('video_id', video.id)
            .single();

          if (existing) {
            logVerbose(`  Skipping existing video: ${video.id}`);
            stats.videosSkipped++;
            continue;
          }

          // Check if already in queue
          const { data: queued } = await supabase
            .from('youtube_ingestion_queue')
            .select('video_id')
            .eq('video_id', video.id)
            .single();

          if (queued) {
            logVerbose(`  Already in queue: ${video.id}`);
            stats.videosSkipped++;
            continue;
          }

          // Add to queue
          const { error: queueError } = await supabase
            .from('youtube_ingestion_queue')
            .insert(queueItem);

          if (queueError) {
            logError(`  Failed to queue video:`, queueError);
            stats.errors++;
          } else {
            log(`  Queued: "${video.snippet.title}" (confidence: ${video.matchConfidence.toFixed(2)})`);
            stats.videosQueued++;
          }

          // Also insert basic video metadata
          const videoRecord = {
            video_id: video.id,
            url: `https://www.youtube.com/watch?v=${video.id}`,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnail_url: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
            channel_id: video.snippet.channelId,
            channel_name: video.snippet.channelTitle,
            published_at: video.snippet.publishedAt,
            duration_seconds: parseDuration(video.contentDetails?.duration),
            view_count: parseInt(video.statistics?.viewCount || 0, 10),
            like_count: parseInt(video.statistics?.likeCount || 0, 10),
            comment_count: parseInt(video.statistics?.commentCount || 0, 10),
            content_type: detectContentType(video),
            processing_status: 'pending'
          };

          await supabase
            .from('youtube_videos')
            .upsert(videoRecord, { onConflict: 'video_id' });

          // Add car link
          const linkRecord = {
            video_id: video.id,
            car_slug: car.slug,
            role: detectContentType(video) === 'comparison' ? 'comparison' : 'primary',
            match_confidence: video.matchConfidence,
            match_method: video.matchMethod
          };

          await supabase
            .from('youtube_video_car_links')
            .upsert(linkRecord, { onConflict: 'video_id,car_slug' });

        } catch (error) {
          logError(`  Database error:`, error.message);
          stats.errors++;
        }
      }
    }
  }

  // Print summary
  log('\n========================================');
  log('Discovery Complete');
  log('========================================');
  log(`Cars processed:     ${stats.carsProcessed}`);
  log(`Videos discovered:  ${stats.videosDiscovered}`);
  log(`Videos queued:      ${stats.videosQueued}`);
  log(`Videos skipped:     ${stats.videosSkipped}`);
  log(`Errors:             ${stats.errors}`);

  if (options.dryRun) {
    log('\n[DRY RUN] No changes were made to the database');
  }
}

// Run
main().catch(error => {
  logError('Fatal error:', error);
  process.exit(1);
});

