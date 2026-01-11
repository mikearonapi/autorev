#!/usr/bin/env node

/**
 * YouTube Channel Video Fetcher
 * 
 * Fetches actual videos FROM each DIY channel, analyzes them to find
 * car-related content, and queues relevant videos for transcript extraction.
 * 
 * This is the CORRECT approach: look at what the channel has, then match to our cars.
 * 
 * Usage:
 *   node scripts/youtube-fetch-channel-videos.js [options]
 * 
 * Options:
 *   --channel <handle>   Process a single channel
 *   --limit <n>          Max videos to fetch per channel (default: 100)
 *   --dry-run            Don't write to database
 *   --verbose            Enable verbose logging
 * 
 * @module scripts/youtube-fetch-channel-videos
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
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: false,
  verbose: false,
  singleChannel: null,
  limit: 100
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
    case '--limit':
      options.limit = parseInt(args[++i], 10);
      break;
  }
}

// Logging helpers
const log = (...args) => console.log('[fetch-videos]', ...args);
const logVerbose = (...args) => options.verbose && console.log('[fetch-videos:verbose]', ...args);
const logError = (...args) => console.error('[fetch-videos:error]', ...args);

// ============================================================================
// YouTube Video Fetching
// ============================================================================

/**
 * Fetch videos from a YouTube channel using RSS feed
 * Returns up to 15 most recent videos
 */
async function fetchChannelVideosRSS(channelId) {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  
  try {
    const response = await fetch(rssUrl);
    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }
    
    const xml = await response.text();
    const videos = [];
    
    // Parse video entries from RSS
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      
      const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
      const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
      const descMatch = entry.match(/<media:description>([^<]*)<\/media:description>/);
      
      if (videoIdMatch && titleMatch) {
        videos.push({
          videoId: videoIdMatch[1],
          title: titleMatch[1],
          publishedAt: publishedMatch ? publishedMatch[1] : null,
          description: descMatch ? descMatch[1].substring(0, 500) : ''
        });
      }
    }
    
    return videos;
  } catch (err) {
    logError(`RSS fetch error: ${err.message}`);
    return [];
  }
}

/**
 * Fetch videos from YouTube channel page (gets more than RSS)
 * Scrapes ytInitialData from the Videos tab
 */
async function fetchChannelVideosPage(channelHandle, maxVideos = 100) {
  const url = `https://www.youtube.com/@${channelHandle}/videos`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      throw new Error(`Page fetch failed: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract ytInitialData JSON from page
    const dataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!dataMatch) {
      logError('Could not find ytInitialData in page');
      return [];
    }

    const data = JSON.parse(dataMatch[1]);
    const videos = [];

    // Navigate to video list in the data structure
    const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
    const videosTab = tabs.find(t => t.tabRenderer?.title === 'Videos');
    
    if (!videosTab) {
      logError('Could not find Videos tab');
      return [];
    }

    const contents = videosTab?.tabRenderer?.content?.richGridRenderer?.contents || [];
    
    for (const item of contents) {
      if (videos.length >= maxVideos) break;
      
      const videoRenderer = item?.richItemRenderer?.content?.videoRenderer;
      if (!videoRenderer) continue;
      
      const videoId = videoRenderer.videoId;
      const title = videoRenderer?.title?.runs?.[0]?.text || videoRenderer?.title?.simpleText;
      const viewCountText = videoRenderer?.viewCountText?.simpleText || '';
      const publishedText = videoRenderer?.publishedTimeText?.simpleText || '';
      const lengthText = videoRenderer?.lengthText?.simpleText || '';
      
      if (videoId && title) {
        videos.push({
          videoId,
          title,
          viewCount: viewCountText,
          publishedText,
          duration: lengthText
        });
      }
    }

    return videos;
  } catch (err) {
    logError(`Page scrape error: ${err.message}`);
    return [];
  }
}

/**
 * Combined approach: try page scraping first, fall back to RSS
 */
async function fetchChannelVideos(channelId, channelHandle, maxVideos = 100) {
  log(`  Fetching videos from @${channelHandle}...`);
  
  // Try page scraping first (gets more videos)
  let videos = await fetchChannelVideosPage(channelHandle, maxVideos);
  
  if (videos.length === 0) {
    log(`  Page scraping got 0 videos, trying RSS...`);
    videos = await fetchChannelVideosRSS(channelId);
  }
  
  log(`  Found ${videos.length} videos`);
  return videos;
}

// ============================================================================
// Car Matching with AI
// ============================================================================

/**
 * Use Claude to analyze video titles and match them to cars in our database
 */
async function matchVideosToCars(anthropic, videos, carSlugs) {
  if (videos.length === 0) return [];
  
  log(`  Analyzing ${videos.length} videos for car relevance...`);
  
  // Build the prompt
  const videoList = videos.map((v, i) => `${i + 1}. [${v.videoId}] ${v.title}`).join('\n');
  
  const prompt = `You are analyzing YouTube video titles to determine which videos are about specific cars.

Here are the cars in our database (slugs):
${carSlugs.slice(0, 200).join(', ')}

Here are the video titles to analyze:
${videoList}

For each video, determine:
1. Is this video primarily about a specific car/vehicle? (not just general automotive content)
2. If yes, which car slug from the list does it match? (or suggest a slug if it's a car not in the list)
3. What type of content is it? (build, tutorial, restoration, maintenance, diagnostics, review, comparison, other)

Respond with JSON only - an array of matches:
[
  {
    "videoId": "xxx",
    "title": "original title",
    "isCarSpecific": true/false,
    "matchedSlug": "car-slug" or null,
    "suggestedSlug": "suggested-slug" if car not in list,
    "carName": "Full car name mentioned",
    "contentType": "build|tutorial|restoration|maintenance|diagnostics|review|comparison|other",
    "relevanceScore": 1-10,
    "reasoning": "brief explanation"
  }
]

Only include videos that ARE about specific cars (isCarSpecific: true). Skip generic automotive content.
Focus on videos about builds, repairs, maintenance, modifications, and diagnostics - these are most valuable.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });
    
    const text = response.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      logError('Could not parse AI response as JSON');
      return [];
    }
    
    const matches = JSON.parse(jsonMatch[0]);
    const relevantVideos = matches.filter(m => m.isCarSpecific && m.relevanceScore >= 5);
    
    log(`  AI identified ${relevantVideos.length} car-specific videos`);
    return relevantVideos;
    
  } catch (err) {
    logError(`AI matching error: ${err.message}`);
    return [];
  }
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Get all car slugs from the database
 */
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

/**
 * Queue a video for transcript processing
 */
async function queueVideo(supabase, video, channel, matchInfo) {
  const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
  
  // Check if already in queue or videos table
  const { data: existingQueue } = await supabase
    .from('youtube_ingestion_queue')
    .select('id')
    .eq('video_url', videoUrl)
    .single();
    
  const { data: existingVideo } = await supabase
    .from('youtube_videos')
    .select('video_id')
    .eq('video_id', video.videoId)
    .single();
    
  if (existingQueue || existingVideo) {
    logVerbose(`    Skipping ${video.videoId} - already exists`);
    return { queued: false, reason: 'exists' };
  }
  
  // Add to queue
  const { error } = await supabase
    .from('youtube_ingestion_queue')
    .insert({
      video_url: videoUrl,
      target_car_slug: matchInfo.matchedSlug || matchInfo.suggestedSlug,
      priority: matchInfo.relevanceScore || 5,
      status: 'pending',
      source_channel_id: channel.channel_id,
      discovered_via: 'channel_scan',
      metadata: {
        title: video.title,
        channel_name: channel.channel_name,
        content_type: matchInfo.contentType,
        car_name: matchInfo.carName,
        reasoning: matchInfo.reasoning
      }
    });
    
  if (error) {
    logError(`    Failed to queue ${video.videoId}: ${error.message}`);
    return { queued: false, reason: 'error' };
  }
  
  return { queued: true };
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  log('========================================');
  log('YouTube Channel Video Fetcher');
  log('========================================');
  log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
  log(`Max videos per channel: ${options.limit}`);
  log('');
  
  // Validate configuration
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    logError('SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
    process.exit(1);
  }
  
  if (!ANTHROPIC_API_KEY) {
    logError('ANTHROPIC_API_KEY is required for video analysis');
    process.exit(1);
  }
  
  // Initialize clients
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  
  // Fetch DIY channels
  const { data: channels, error: channelError } = await supabase
    .from('youtube_channels')
    .select('*')
    .filter('content_focus', 'ov', '{"builds","tutorials","restorations","diagnostics","maintenance"}');
    
  if (channelError) {
    logError(`Failed to fetch channels: ${channelError.message}`);
    process.exit(1);
  }
  
  // Filter to single channel if specified
  const channelsToProcess = options.singleChannel
    ? channels.filter(c => c.channel_handle?.toLowerCase() === options.singleChannel.toLowerCase())
    : channels;
    
  if (channelsToProcess.length === 0) {
    logError('No channels to process');
    process.exit(1);
  }
  
  log(`Found ${channelsToProcess.length} DIY channels to process`);
  
  // Fetch car slugs for matching
  const carSlugs = await getCarSlugs(supabase);
  log(`Loaded ${carSlugs.length} car slugs for matching`);
  log('');
  
  // Track statistics
  const stats = {
    channelsProcessed: 0,
    videosFound: 0,
    videosMatched: 0,
    videosQueued: 0,
    videosSkipped: 0
  };
  
  // Process each channel
  for (const channel of channelsToProcess) {
    log(`\n--- Channel: ${channel.channel_name} (@${channel.channel_handle}) ---`);
    
    // Fetch videos from channel
    const videos = await fetchChannelVideos(
      channel.channel_id,
      channel.channel_handle,
      options.limit
    );
    
    stats.videosFound += videos.length;
    
    if (videos.length === 0) {
      log('  No videos found, skipping');
      stats.channelsProcessed++;
      continue;
    }
    
    // Batch videos for AI analysis (process in chunks of 50)
    const batchSize = 50;
    const allMatches = [];
    
    for (let i = 0; i < videos.length; i += batchSize) {
      const batch = videos.slice(i, i + batchSize);
      log(`  Analyzing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(videos.length / batchSize)}...`);
      
      const matches = await matchVideosToCars(anthropic, batch, carSlugs);
      allMatches.push(...matches);
      
      // Rate limit between batches
      if (i + batchSize < videos.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    stats.videosMatched += allMatches.length;
    
    // Queue matched videos
    log(`  Queueing ${allMatches.length} relevant videos...`);
    
    for (const match of allMatches) {
      const video = videos.find(v => v.videoId === match.videoId);
      if (!video) continue;
      
      if (options.dryRun) {
        log(`    [DRY RUN] Would queue: ${match.title}`);
        log(`      → Car: ${match.carName} (${match.matchedSlug || match.suggestedSlug})`);
        log(`      → Type: ${match.contentType}, Score: ${match.relevanceScore}`);
        stats.videosQueued++;
      } else {
        const result = await queueVideo(supabase, video, channel, match);
        if (result.queued) {
          stats.videosQueued++;
          logVerbose(`    + Queued: ${match.title}`);
        } else {
          stats.videosSkipped++;
        }
      }
    }
    
    stats.channelsProcessed++;
    
    // Rate limit between channels
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Print summary
  log('\n========================================');
  log('Fetch Complete');
  log('========================================');
  log(`Channels processed: ${stats.channelsProcessed}`);
  log(`Videos found:       ${stats.videosFound}`);
  log(`Videos matched:     ${stats.videosMatched}`);
  log(`Videos queued:      ${stats.videosQueued}`);
  log(`Videos skipped:     ${stats.videosSkipped}`);
  
  if (options.dryRun) {
    log('\n[DRY RUN] No changes were made to the database');
  } else {
    log(`\nRun the processor to extract transcripts:`);
    log(`  node scripts/youtube-diy-processor.js --queue --limit 50`);
  }
  
  return stats;
}

// Run main
main().catch(error => {
  logError('Fatal error:', error);
  process.exit(1);
});

export { fetchChannelVideos, matchVideosToCars };
