#!/usr/bin/env node

/**
 * YouTube Channel Video Fetcher - Full Catalog
 * 
 * Fetches ALL videos from a YouTube channel using YouTube's internal API.
 * This properly paginates through the entire catalog (not just first 30).
 * 
 * Usage:
 *   node scripts/youtube-fetch-all-channel-videos.js [options]
 * 
 * Options:
 *   --channel <handle>   Process a single channel (required for first run)
 *   --max-videos <n>     Max videos to fetch per channel (default: 500)
 *   --dry-run            Don't write to database
 *   --verbose            Enable verbose logging
 * 
 * @module scripts/youtube-fetch-all-channel-videos
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// YouTube Innertube API configuration
const INNERTUBE_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'; // Public key used by YouTube web
const INNERTUBE_CLIENT = {
  clientName: 'WEB',
  clientVersion: '2.20240101.00.00'
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: false,
  verbose: false,
  singleChannel: null,
  maxVideos: 500
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--verbose':
      options.verbose = true;
      break;
    case '--channel':
      options.singleChannel = args[++i];
      break;
    case '--max-videos':
      options.maxVideos = parseInt(args[++i], 10);
      break;
  }
}

// Logging helpers
const log = (...args) => console.log('[fetch-all]', ...args);
const logVerbose = (...args) => options.verbose && console.log('[fetch-all:verbose]', ...args);
const logError = (...args) => console.error('[fetch-all:error]', ...args);

// ============================================================================
// YouTube Innertube API
// ============================================================================

/**
 * Get channel page data including initial videos and continuation token
 */
async function getChannelInitialData(channelHandle) {
  const url = `https://www.youtube.com/@${channelHandle}/videos`;
  
  log(`  Fetching channel page: @${channelHandle}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    // Extract ytInitialData
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!match) {
      throw new Error('Could not find ytInitialData');
    }

    return JSON.parse(match[1]);
  } catch (err) {
    logError(`Failed to fetch channel: ${err.message}`);
    return null;
  }
}

/**
 * Extract videos and continuation token from YouTube data
 */
function extractVideosFromData(data, isInitial = true) {
  const videos = [];
  let continuationToken = null;
  
  try {
    let contents;
    
    if (isInitial) {
      // Initial page structure
      const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
      const videosTab = tabs.find(t => t.tabRenderer?.title === 'Videos');
      contents = videosTab?.tabRenderer?.content?.richGridRenderer?.contents || [];
    } else {
      // Continuation response structure
      contents = data?.onResponseReceivedActions?.[0]?.appendContinuationItemsAction?.continuationItems || [];
    }
    
    for (const item of contents) {
      // Extract video data
      const videoRenderer = item?.richItemRenderer?.content?.videoRenderer;
      if (videoRenderer) {
        const videoId = videoRenderer.videoId;
        const title = videoRenderer?.title?.runs?.[0]?.text || videoRenderer?.title?.simpleText || '';
        const viewCount = videoRenderer?.viewCountText?.simpleText || '';
        const publishedText = videoRenderer?.publishedTimeText?.simpleText || '';
        const duration = videoRenderer?.lengthText?.simpleText || '';
        const description = videoRenderer?.descriptionSnippet?.runs?.map(r => r.text).join('') || '';
        
        if (videoId && title) {
          videos.push({
            videoId,
            title,
            viewCount,
            publishedText,
            duration,
            description: description.substring(0, 300)
          });
        }
      }
      
      // Extract continuation token
      const continuationItem = item?.continuationItemRenderer;
      if (continuationItem) {
        continuationToken = continuationItem?.continuationEndpoint?.continuationCommand?.token;
      }
    }
  } catch (err) {
    logError(`Error parsing video data: ${err.message}`);
  }
  
  return { videos, continuationToken };
}

/**
 * Fetch more videos using continuation token
 */
async function fetchMoreVideos(continuationToken) {
  const url = `https://www.youtube.com/youtubei/v1/browse?key=${INNERTUBE_API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        context: {
          client: INNERTUBE_CLIENT
        },
        continuation: continuationToken
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    logError(`Continuation fetch error: ${err.message}`);
    return null;
  }
}

/**
 * Fetch ALL videos from a channel with pagination
 */
async function fetchAllChannelVideos(channelHandle, maxVideos = 500) {
  const allVideos = [];
  
  // Get initial page
  const initialData = await getChannelInitialData(channelHandle);
  if (!initialData) {
    return [];
  }
  
  let { videos, continuationToken } = extractVideosFromData(initialData, true);
  allVideos.push(...videos);
  
  log(`  Initial batch: ${videos.length} videos`);
  
  // Paginate through remaining videos
  let pageCount = 1;
  while (continuationToken && allVideos.length < maxVideos) {
    pageCount++;
    logVerbose(`  Fetching page ${pageCount}...`);
    
    // Rate limit
    await new Promise(r => setTimeout(r, 500));
    
    const moreData = await fetchMoreVideos(continuationToken);
    if (!moreData) break;
    
    const result = extractVideosFromData(moreData, false);
    if (result.videos.length === 0) break;
    
    allVideos.push(...result.videos);
    continuationToken = result.continuationToken;
    
    log(`  Page ${pageCount}: +${result.videos.length} videos (total: ${allVideos.length})`);
  }
  
  return allVideos.slice(0, maxVideos);
}

// ============================================================================
// Car Matching with AI
// ============================================================================

/**
 * Use Claude to analyze video titles and match them to cars
 */
async function matchVideosToCars(anthropic, videos, carSlugs) {
  if (videos.length === 0) return [];
  
  log(`  Analyzing ${videos.length} videos for car relevance...`);
  
  // Process in smaller batches to avoid truncated responses
  const batchSize = 40;
  const allMatches = [];
  
  for (let i = 0; i < videos.length; i += batchSize) {
    const batch = videos.slice(i, i + batchSize);
    log(`    Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(videos.length / batchSize)}...`);
    
    const videoList = batch.map((v, idx) => 
      `${i + idx + 1}. [${v.videoId}] ${v.title}`
    ).join('\n');
    
    const prompt = `Analyze these YouTube video titles. Find videos about SPECIFIC cars (mention make/model).

Videos:
${videoList}

Return ONLY a JSON array. For car-specific videos with score >= 5:
[{"videoId":"xxx","carName":"Year Make Model","contentType":"build|tutorial|maintenance|diagnostics|modification","relevanceScore":5-10,"suggestedSlug":"make-model"}]

Skip generic content. Only include videos that mention a specific vehicle.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      });
      
      const text = response.content[0].text;
      
      // Try to extract JSON, handling potential truncation
      let jsonStr = text;
      const jsonStart = text.indexOf('[');
      if (jsonStart !== -1) {
        jsonStr = text.substring(jsonStart);
        // If truncated, try to close the array
        if (!jsonStr.trim().endsWith(']')) {
          // Find last complete object
          const lastCompleteObj = jsonStr.lastIndexOf('}');
          if (lastCompleteObj !== -1) {
            jsonStr = jsonStr.substring(0, lastCompleteObj + 1) + ']';
          }
        }
      }
      
      try {
        const matches = JSON.parse(jsonStr);
        const validMatches = matches.filter(m => 
          m.videoId && m.relevanceScore && m.relevanceScore >= 5
        );
        allMatches.push(...validMatches);
        logVerbose(`      Found ${validMatches.length} matches in batch`);
      } catch (parseErr) {
        logError(`JSON parse error in batch: ${parseErr.message.substring(0, 50)}`);
      }
    } catch (err) {
      logError(`AI batch error: ${err.message}`);
    }
    
    // Rate limit between AI calls
    if (i + batchSize < videos.length) {
      await new Promise(r => setTimeout(r, 800));
    }
  }
  
  log(`  Found ${allMatches.length} car-specific videos`);
  return allMatches;
}

// ============================================================================
// Database Operations
// ============================================================================

async function getCarSlugs(supabase) {
  const { data, error } = await supabase
    .from('cars')
    .select('slug, name')
    .order('slug');
    
  if (error) {
    logError(`Failed to fetch car slugs: ${error.message}`);
    return [];
  }
  
  return data.map(c => c.slug);
}

async function queueVideo(supabase, video, channel, matchInfo) {
  const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
  
  // Check if already exists
  const { data: existing } = await supabase
    .from('youtube_videos')
    .select('video_id')
    .eq('video_id', video.videoId)
    .single();
    
  if (existing) {
    return { queued: false, reason: 'video_exists' };
  }
  
  const { data: queuedExisting } = await supabase
    .from('youtube_ingestion_queue')
    .select('id')
    .eq('video_url', videoUrl)
    .single();
    
  if (queuedExisting) {
    return { queued: false, reason: 'already_queued' };
  }
  
  // Add to queue
  const { error } = await supabase
    .from('youtube_ingestion_queue')
    .insert({
      video_id: video.videoId,
      video_url: videoUrl,
      target_car_slug: matchInfo.matchedSlug || matchInfo.suggestedSlug,
      priority: matchInfo.relevanceScore || 5,
      status: 'pending',
      channel_id: channel.channel_id,
      discovered_via: 'channel_scan',
      metadata: {
        title: video.title,
        channel_name: channel.channel_name,
        content_type: matchInfo.contentType,
        car_name: matchInfo.carName,
        reason: matchInfo.briefReason,
        view_count: video.viewCount,
        duration: video.duration
      }
    });
    
  if (error) {
    logError(`Queue insert error: ${error.message}`);
    return { queued: false, reason: 'error' };
  }
  
  return { queued: true };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  log('========================================');
  log('YouTube Full Channel Video Fetcher');
  log('========================================');
  log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
  log(`Max videos per channel: ${options.maxVideos}`);
  log('');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    logError('SUPABASE_URL and SUPABASE_SERVICE_KEY required');
    process.exit(1);
  }
  
  if (!ANTHROPIC_API_KEY) {
    logError('ANTHROPIC_API_KEY required');
    process.exit(1);
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  
  // Get DIY channels
  const { data: channels, error: channelError } = await supabase
    .from('youtube_channels')
    .select('*')
    .filter('content_focus', 'ov', '{"builds","tutorials","restorations","diagnostics","maintenance"}');
    
  if (channelError) {
    logError(`Channel fetch error: ${channelError.message}`);
    process.exit(1);
  }
  
  const channelsToProcess = options.singleChannel
    ? channels.filter(c => c.channel_handle?.toLowerCase() === options.singleChannel.toLowerCase())
    : channels;
    
  if (channelsToProcess.length === 0) {
    logError('No channels to process');
    process.exit(1);
  }
  
  log(`Processing ${channelsToProcess.length} channels`);
  
  // Get car slugs
  const carSlugs = await getCarSlugs(supabase);
  log(`Loaded ${carSlugs.length} car slugs`);
  log('');
  
  // Stats
  const stats = {
    channelsProcessed: 0,
    totalVideosFound: 0,
    videosMatched: 0,
    videosQueued: 0,
    videosSkipped: 0
  };
  
  // Process each channel
  for (const channel of channelsToProcess) {
    log(`\n========================================`);
    log(`Channel: ${channel.channel_name} (@${channel.channel_handle})`);
    log(`========================================`);
    
    // Fetch ALL videos from channel
    const videos = await fetchAllChannelVideos(channel.channel_handle, options.maxVideos);
    stats.totalVideosFound += videos.length;
    
    if (videos.length === 0) {
      log('  No videos found');
      stats.channelsProcessed++;
      continue;
    }
    
    log(`  Total videos fetched: ${videos.length}`);
    
    // Match to cars with AI
    const matches = await matchVideosToCars(anthropic, videos, carSlugs);
    stats.videosMatched += matches.length;
    
    // Queue matched videos
    log(`  Queueing ${matches.length} relevant videos...`);
    
    for (const match of matches) {
      const video = videos.find(v => v.videoId === match.videoId);
      if (!video) continue;
      
      if (options.dryRun) {
        log(`    [DRY] ${video.title}`);
        log(`          → ${match.carName} | ${match.contentType} | Score: ${match.relevanceScore}`);
        stats.videosQueued++;
      } else {
        const result = await queueVideo(supabase, video, channel, match);
        if (result.queued) {
          stats.videosQueued++;
          logVerbose(`    + ${match.title}`);
        } else {
          stats.videosSkipped++;
          logVerbose(`    - Skip (${result.reason}): ${match.title}`);
        }
      }
    }
    
    stats.channelsProcessed++;
    
    // Rate limit between channels
    if (channelsToProcess.indexOf(channel) < channelsToProcess.length - 1) {
      log('\n  Waiting before next channel...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  // Summary
  log('\n========================================');
  log('COMPLETE');
  log('========================================');
  log(`Channels processed:  ${stats.channelsProcessed}`);
  log(`Total videos found:  ${stats.totalVideosFound}`);
  log(`Car-specific videos: ${stats.videosMatched}`);
  log(`Videos queued:       ${stats.videosQueued}`);
  log(`Videos skipped:      ${stats.videosSkipped}`);
  
  if (!options.dryRun && stats.videosQueued > 0) {
    log(`\nNext: Process the queue with Supadata:`);
    log(`  node scripts/youtube-diy-processor.js --queue --limit 100`);
  }
  
  return stats;
}

main().catch(err => {
  logError('Fatal:', err);
  process.exit(1);
});
