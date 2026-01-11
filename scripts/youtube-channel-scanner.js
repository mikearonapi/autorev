#!/usr/bin/env node

/**
 * YouTube Channel Video Scanner
 * 
 * Discovers videos from specific channels that match our Top 100 vehicles.
 * Uses Exa search to find videos without YouTube API quota limits.
 * 
 * Usage:
 *   node scripts/youtube-channel-scanner.js [options]
 * 
 * Options:
 *   --channel <handle>     Scan a specific channel (e.g., --channel ChrisFix)
 *   --top-n <n>            Only scan top N vehicles (default: 25)
 *   --limit <n>            Max videos per car per channel (default: 5)
 *   --dry-run              Don't write to database
 *   --verbose              Enable verbose logging
 *   --output <file>        Write results to JSON file
 * 
 * Environment Variables:
 *   EXA_API_KEY            Required: Exa API key for video discovery
 *   SUPABASE_URL           Required: Supabase project URL
 *   SUPABASE_SERVICE_KEY   Required: Supabase service role key
 * 
 * @module scripts/youtube-channel-scanner
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const EXA_API_KEY = process.env.EXA_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  channel: null,
  topN: 25,
  limit: 5,
  dryRun: false,
  verbose: false,
  outputFile: null
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--channel':
      options.channel = args[++i];
      break;
    case '--top-n':
      options.topN = parseInt(args[++i], 10);
      break;
    case '--limit':
      options.limit = parseInt(args[++i], 10);
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--verbose':
      options.verbose = true;
      break;
    case '--output':
      options.outputFile = args[++i];
      break;
  }
}

// Logging helpers
const log = (...args) => console.log('[channel-scanner]', ...args);
const logVerbose = (...args) => options.verbose && console.log('[channel-scanner:verbose]', ...args);
const logError = (...args) => console.error('[channel-scanner:error]', ...args);

// ============================================================================
// Load Top 100 Vehicles
// ============================================================================

function loadTop100Vehicles() {
  const dataPath = path.join(__dirname, 'data', 'top-100-search-terms.json');
  
  if (!fs.existsSync(dataPath)) {
    logError(`Top 100 data file not found: ${dataPath}`);
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  return data.vehicles;
}

// ============================================================================
// Exa Search for Channel Videos
// ============================================================================

/**
 * Search for videos from a specific channel about a specific car
 * @param {string} channelHandle - YouTube channel handle
 * @param {string} channelName - YouTube channel name for search
 * @param {Object} vehicle - Vehicle object with searchTerms
 * @param {number} maxResults - Maximum results to return
 * @returns {Promise<Array>} Array of video objects
 */
async function searchChannelVideos(channelHandle, channelName, vehicle, maxResults = 5) {
  if (!EXA_API_KEY) {
    throw new Error('EXA_API_KEY not configured');
  }

  const allVideos = new Map();

  // Build search queries using vehicle search terms
  // Use channel name in query since Exa handles natural language well
  const searchQueries = [];
  
  // Primary search: youtube + channel name + car terms (more reliable than site: operator)
  searchQueries.push(`youtube "${channelName}" ${vehicle.searchTerms[0]}`);
  
  // Alternative searches with different terms
  if (vehicle.searchTerms.length > 1) {
    searchQueries.push(`youtube "${channelName}" ${vehicle.searchTerms[1]}`);
  }
  
  // Broader search without quotes if specific fails
  searchQueries.push(`site:youtube.com ${channelName} ${vehicle.name}`);

  for (const query of searchQueries) {
    try {
      logVerbose(`    Query: ${query}`);
      
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': EXA_API_KEY
        },
        body: JSON.stringify({
          query: query,
          numResults: 15,
          type: 'auto',
          includeDomains: ['youtube.com'],
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logVerbose(`    Exa search failed: ${response.status} - ${errorText.substring(0, 100)}`);
        continue;
      }

      const data = await response.json();
      const results = data.results || [];
      
      logVerbose(`    Found ${results.length} results`);

      for (const result of results) {
        if (!result.url) continue;
        
        // Parse YouTube URL for video ID
        const videoIdMatch = result.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        if (!videoIdMatch) continue;
        
        const videoId = videoIdMatch[1];
        
        // Skip if already found
        if (allVideos.has(videoId)) continue;
        
        // Filter: title or URL should contain channel name indicators
        const titleLower = (result.title || '').toLowerCase();
        const channelLower = channelName.toLowerCase();
        const handleLower = channelHandle.toLowerCase();
        
        // Check if this result is likely from the target channel
        const isFromChannel = 
          titleLower.includes(channelLower) ||
          titleLower.includes(handleLower) ||
          (result.url && result.url.toLowerCase().includes(handleLower));

        // Also check for car relevance
        const isRelevantCar = vehicle.searchTerms.some(term => 
          titleLower.includes(term.toLowerCase())
        );
        
        if (!isRelevantCar) {
          logVerbose(`    Skipping: not relevant to ${vehicle.name}`);
          continue;
        }

        allVideos.set(videoId, {
          videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          title: result.title || 'Unknown Title',
          snippet: result.text || result.snippet || '',
          matchedVehicle: vehicle.name,
          matchedSlug: vehicle.slug,
          matchedRank: vehicle.rank,
          channelHandle,
          needsChannelVerification: !isFromChannel
        });
      }

      // Small delay between searches
      await new Promise(r => setTimeout(r, 300));

    } catch (err) {
      logVerbose(`    Search error: ${err.message}`);
    }
    
    // Stop if we have enough videos
    if (allVideos.size >= maxResults) break;
  }

  return Array.from(allVideos.values()).slice(0, maxResults);
}

/**
 * Fetch video metadata via oEmbed API
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object|null>} Video metadata or null
 */
async function fetchVideoMetadata(videoId) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return {
      title: data.title || null,
      channelName: data.author_name || null,
      channelUrl: data.author_url || null,
      thumbnailUrl: data.thumbnail_url || null,
    };
  } catch (err) {
    return null;
  }
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Check if video already exists in database
 * @param {Object} supabase - Supabase client
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<boolean>} True if exists
 */
async function videoExists(supabase, videoId) {
  const { data, error } = await supabase
    .from('youtube_videos')
    .select('video_id')
    .eq('video_id', videoId)
    .single();

  return !!data && !error;
}

/**
 * Add video to ingestion queue
 * @param {Object} supabase - Supabase client
 * @param {Object} video - Video object
 * @param {Object} channel - Channel object
 * @returns {Promise<boolean>} Success status
 */
async function addToQueue(supabase, video, channel) {
  const queueItem = {
    video_id: video.videoId,
    video_url: video.url,
    channel_id: channel.channel_id,
    discovered_via: 'exa_channel_scan',
    target_car_slug: video.matchedSlug,
    status: 'pending',
    priority: Math.max(1, 11 - Math.ceil(video.matchedRank / 10)), // Higher rank = higher priority
    metadata: {
      matched_vehicle: video.matchedVehicle,
      matched_rank: video.matchedRank,
      search_title: video.title,
      discovered_at: new Date().toISOString()
    }
  };

  const { error } = await supabase
    .from('youtube_ingestion_queue')
    .upsert(queueItem, { onConflict: 'video_id' });

  if (error) {
    logError(`  Failed to add to queue: ${error.message}`);
    return false;
  }

  return true;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  log('========================================');
  log('YouTube Channel Video Scanner');
  log('========================================');
  log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
  log(`Top N vehicles: ${options.topN}`);
  log(`Max videos per car: ${options.limit}`);
  log('');

  // Validate configuration
  if (!EXA_API_KEY) {
    logError('EXA_API_KEY is required');
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

  // Load channels from database
  let channels = [];
  if (!options.dryRun) {
    const { data, error } = await supabase
      .from('youtube_channels')
      .select('*')
      .eq('is_active', true)
      .in('content_focus', [['builds'], ['tutorials'], ['restorations'], ['diagnostics'], ['modifications'], ['projects']]);

    if (error) {
      logError(`Failed to fetch channels: ${error.message}`);
      process.exit(1);
    }
    
    channels = data || [];
  }

  // If specific channel requested, filter
  if (options.channel) {
    if (!options.dryRun) {
      channels = channels.filter(c => 
        c.channel_handle?.toLowerCase() === options.channel.toLowerCase()
      );
    } else {
      // For dry run, create mock channel
      channels = [{
        channel_id: 'mock',
        channel_handle: options.channel,
        channel_name: options.channel
      }];
    }
  }

  if (channels.length === 0) {
    logError('No channels found to scan');
    process.exit(1);
  }

  log(`Scanning ${channels.length} channel(s)`);

  // Load Top 100 vehicles
  const vehicles = loadTop100Vehicles();
  const vehiclesToScan = vehicles.slice(0, options.topN);
  log(`Scanning for ${vehiclesToScan.length} vehicles`);
  log('');

  // Track statistics
  const stats = {
    channelsScanned: 0,
    vehiclesScanned: 0,
    videosFound: 0,
    videosNew: 0,
    videosQueued: 0,
    errors: 0
  };

  // Results for output
  const results = {
    scanDate: new Date().toISOString(),
    options: { ...options },
    channels: [],
    videos: []
  };

  // Scan each channel
  for (const channel of channels) {
    log(`\n=== Channel: ${channel.channel_name} (@${channel.channel_handle}) ===`);
    
    const channelResults = {
      channel: channel.channel_name,
      handle: channel.channel_handle,
      videos: []
    };
    
    stats.channelsScanned++;

    // Scan for each vehicle
    for (const vehicle of vehiclesToScan) {
      // Skip vehicles without search terms
      if (!vehicle.searchTerms || vehicle.searchTerms.length === 0) {
        logVerbose(`  Skipping ${vehicle.name}: no search terms`);
        continue;
      }

      log(`  [${vehicle.rank}] ${vehicle.name}...`);
      stats.vehiclesScanned++;

      try {
        const videos = await searchChannelVideos(
          channel.channel_handle,
          channel.channel_name,
          vehicle,
          options.limit
        );

        if (videos.length === 0) {
          logVerbose(`    No videos found`);
          continue;
        }

        log(`    Found ${videos.length} video(s)`);
        stats.videosFound += videos.length;

        for (const video of videos) {
          // Check if already exists
          let isNew = true;
          if (!options.dryRun) {
            isNew = !(await videoExists(supabase, video.videoId));
          }

          if (isNew) {
            stats.videosNew++;
            
            // Get metadata
            const metadata = await fetchVideoMetadata(video.videoId);
            if (metadata) {
              video.title = metadata.title || video.title;
              video.channelName = metadata.channelName;
            }

            log(`      + NEW: ${video.title.substring(0, 50)}...`);

            // Add to queue
            if (!options.dryRun) {
              const queued = await addToQueue(supabase, video, channel);
              if (queued) {
                stats.videosQueued++;
              }
            } else {
              stats.videosQueued++;
            }

            channelResults.videos.push({
              videoId: video.videoId,
              title: video.title,
              url: video.url,
              matchedVehicle: video.matchedVehicle,
              matchedRank: video.matchedRank
            });
            
            results.videos.push(video);
          } else {
            logVerbose(`      = EXISTS: ${video.videoId}`);
          }
        }

        // Rate limiting between vehicles
        await new Promise(r => setTimeout(r, 500));

      } catch (err) {
        logError(`    Error: ${err.message}`);
        stats.errors++;
      }
    }

    results.channels.push(channelResults);
  }

  // Print summary
  log('\n========================================');
  log('Scan Complete');
  log('========================================');
  log(`Channels scanned:   ${stats.channelsScanned}`);
  log(`Vehicles scanned:   ${stats.vehiclesScanned}`);
  log(`Videos found:       ${stats.videosFound}`);
  log(`New videos:         ${stats.videosNew}`);
  log(`Videos queued:      ${stats.videosQueued}`);
  log(`Errors:             ${stats.errors}`);

  if (options.dryRun) {
    log('');
    log('[DRY RUN] No changes were made to the database');
  }

  // Write results to file if requested
  if (options.outputFile) {
    results.stats = stats;
    fs.writeFileSync(options.outputFile, JSON.stringify(results, null, 2));
    log(`\nResults written to: ${options.outputFile}`);
  }

  return stats;
}

// Export functions for use in other scripts
export { searchChannelVideos, loadTop100Vehicles };

// Run if called directly (not imported)
const isMainModule = process.argv[1]?.includes('youtube-channel-scanner');
if (isMainModule) {
  main().catch(error => {
    logError('Fatal error:', error);
    process.exit(1);
  });
}
