#!/usr/bin/env node

/**
 * Process YouTube videos from a list of URLs (bypasses YouTube API search)
 * 
 * This script takes video URLs directly and:
 * 1. Fetches transcripts via Supadata API
 * 2. Processes with AI to extract summaries, pros/cons, quotes
 * 3. Links videos to cars in the database
 * 
 * Usage:
 *   node scripts/youtube-process-from-urls.js --car-slug toyota-gr-supra --urls "URL1,URL2,URL3"
 *   node scripts/youtube-process-from-urls.js --file videos.json
 * 
 * videos.json format:
 * [
 *   { "car_slug": "shelby-gt350", "urls": ["https://youtube.com/watch?v=xxx", ...] },
 *   ...
 * ]
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// ============================================================================
// Configuration
// ============================================================================

const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  carSlug: null,
  urls: [],
  file: null,
  dryRun: false,
  verbose: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--car-slug':
      options.carSlug = args[++i];
      break;
    case '--urls':
      options.urls = args[++i].split(',').map(u => u.trim());
      break;
    case '--file':
      options.file = args[++i];
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--verbose':
      options.verbose = true;
      break;
  }
}

// Logging helpers
const log = (...args) => console.log('[from-urls]', ...args);
const logVerbose = (...args) => options.verbose && console.log('[from-urls:verbose]', ...args);
const logError = (...args) => console.error('[from-urls:error]', ...args);

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// Helper Functions
// ============================================================================

function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function getVideoMetadata(videoId) {
  // Fetch basic metadata from YouTube page (no API needed)
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : `Video ${videoId}`;
    
    // Extract channel name
    const channelMatch = html.match(/"ownerChannelName":"([^"]+)"/);
    const channelName = channelMatch ? channelMatch[1] : 'Unknown Channel';
    
    // Extract duration
    const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
    const durationSeconds = durationMatch ? parseInt(durationMatch[1]) : null;
    
    // Extract thumbnail
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    
    return {
      video_id: videoId,
      url,
      title,
      channel_name: channelName,
      duration_seconds: durationSeconds,
      thumbnail_url: thumbnailUrl
    };
  } catch (error) {
    logError(`Failed to fetch metadata for ${videoId}:`, error.message);
    return {
      video_id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: `Video ${videoId}`,
      channel_name: 'Unknown',
      duration_seconds: null,
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    };
  }
}

async function fetchTranscript(videoId) {
  if (!SUPADATA_API_KEY) {
    throw new Error('SUPADATA_API_KEY not configured');
  }

  const url = `https://api.supadata.ai/v1/transcript?url=https://www.youtube.com/watch?v=${videoId}`;
  
  const response = await fetch(url, {
    headers: { 'x-api-key': SUPADATA_API_KEY }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supadata API failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.content || data.content.length === 0) {
    throw new Error('No transcript available');
  }

  const segments = data.content.map(item => ({
    start: (item.offset || 0) / 1000,
    duration: (item.duration || 0) / 1000,
    text: item.text || ''
  }));

  return {
    text: segments.map(s => s.text).join(' '),
    segments,
    language: data.lang || 'en',
    source: 'supadata_api'
  };
}

async function processWithAI(video, carSlug) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const prompt = `You are analyzing a car review video transcript. Extract structured data about the vehicle being reviewed.

VIDEO: "${video.title}"
CHANNEL: ${video.channel_name}
PRIMARY CAR: ${carSlug}

TRANSCRIPT:
${video.transcript_text.slice(0, 12000)}

Extract the following as JSON:
{
  "summary": "2-3 paragraph summary of the review",
  "one_line_take": "Single sentence verdict/opinion",
  "pros_mentioned": [{"text": "pro point", "category": "optional category like sound/interior/track"}],
  "cons_mentioned": [{"text": "con point", "category": "optional category"}],
  "notable_quotes": [{"quote": "exact quote", "speaker": "reviewer name if known"}],
  "sentiment_by_category": {
    "sound": 0.0,
    "interior": 0.0,
    "track": 0.0,
    "driver_fun": 0.0,
    "value": 0.0
  },
  "stock_strengths": ["array of praised aspects like 'power', 'handling'"],
  "stock_weaknesses": ["array of criticized aspects like 'brakes', 'visibility'"]
}

For sentiment, use -1.0 (very negative) to +1.0 (very positive), or null if not discussed.
Only include categories that are actually discussed in the review.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0].text;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');
  
  return JSON.parse(jsonMatch[0]);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  log('========================================');
  log('Process Videos from URLs');
  log('========================================');
  
  // Build list of videos to process
  let videosToProcess = [];
  
  if (options.file) {
    // Load from JSON file
    const data = JSON.parse(readFileSync(options.file, 'utf8'));
    videosToProcess = data;
    log(`Loaded ${videosToProcess.length} car(s) from ${options.file}`);
  } else if (options.carSlug && options.urls.length > 0) {
    // Single car from command line
    videosToProcess = [{ car_slug: options.carSlug, urls: options.urls }];
  } else {
    logError('Usage: --car-slug <slug> --urls "url1,url2" OR --file videos.json');
    process.exit(1);
  }

  // Validate configuration
  if (!SUPADATA_API_KEY) {
    logError('SUPADATA_API_KEY is required');
    process.exit(1);
  }
  if (!ANTHROPIC_API_KEY) {
    logError('ANTHROPIC_API_KEY is required');
    process.exit(1);
  }

  // Get existing video IDs
  const { data: existingVideos } = await supabase
    .from('youtube_videos')
    .select('video_id');
  const existingVideoIds = new Set((existingVideos || []).map(v => v.video_id));

  // Stats
  const stats = {
    videosProcessed: 0,
    videosSkipped: 0,
    transcriptsFetched: 0,
    transcriptsFailed: 0,
    aiProcessed: 0,
    errors: 0
  };

  // Process each car
  for (const item of videosToProcess) {
    const carSlug = item.car_slug;
    const urls = item.urls;
    
    log('');
    log(`🚗 ${carSlug} (${urls.length} URLs)`);
    
    for (const url of urls) {
      const videoId = extractVideoId(url);
      if (!videoId) {
        logError(`  Invalid URL: ${url}`);
        stats.errors++;
        continue;
      }

      if (existingVideoIds.has(videoId)) {
        log(`  ⏭️ Skipping ${videoId} - already in database`);
        stats.videosSkipped++;
        continue;
      }

      log(`  📼 Processing ${videoId}...`);

      try {
        // Get metadata
        log(`    📋 Fetching metadata...`);
        const metadata = await getVideoMetadata(videoId);
        log(`    ✓ "${metadata.title.slice(0, 50)}..."`);

        // Fetch transcript
        log(`    🔤 Fetching transcript...`);
        let transcript;
        try {
          transcript = await fetchTranscript(videoId);
          log(`    ✓ Transcript: ${transcript.text.length} chars`);
          stats.transcriptsFetched++;
        } catch (transcriptError) {
          log(`    ❌ No transcript: ${transcriptError.message}`);
          stats.transcriptsFailed++;
          continue;
        }

        // Save video to database
        if (!options.dryRun) {
          const { error: insertError } = await supabase
            .from('youtube_videos')
            .upsert({
              video_id: videoId,
              url: metadata.url,
              title: metadata.title,
              thumbnail_url: metadata.thumbnail_url,
              channel_id: null, // Will be null for manually added videos
              channel_name: metadata.channel_name,
              duration_seconds: metadata.duration_seconds,
              transcript_text: transcript.text,
              transcript_language: transcript.language,
              transcript_source: transcript.source,
              processing_status: 'transcript_fetched'
            }, { onConflict: 'video_id' });

          if (insertError) {
            logError(`    DB insert failed:`, insertError.message);
            stats.errors++;
            continue;
          }
        }

        existingVideoIds.add(videoId);

        // AI Processing
        log(`    🤖 AI processing...`);
        try {
          const video = { ...metadata, transcript_text: transcript.text };
          const aiData = await processWithAI(video, carSlug);
          
          log(`    ✓ Extracted: ${aiData.pros_mentioned?.length || 0} pros, ${aiData.cons_mentioned?.length || 0} cons`);
          stats.aiProcessed++;

          if (!options.dryRun) {
            // Update video with AI data
            await supabase
              .from('youtube_videos')
              .update({
                summary: aiData.summary,
                one_line_take: aiData.one_line_take,
                pros_mentioned: aiData.pros_mentioned,
                cons_mentioned: aiData.cons_mentioned,
                notable_quotes: aiData.notable_quotes,
                stock_strengths: aiData.stock_strengths,
                stock_weaknesses: aiData.stock_weaknesses,
                processing_status: 'processed',
                quality_score: 1.0
              })
              .eq('video_id', videoId);

            // Create car link
            await supabase
              .from('youtube_video_car_links')
              .upsert({
                video_id: videoId,
                car_slug: carSlug,
                role: 'primary',
                sentiment_sound: aiData.sentiment_by_category?.sound,
                sentiment_interior: aiData.sentiment_by_category?.interior,
                sentiment_track: aiData.sentiment_by_category?.track,
                sentiment_driver_fun: aiData.sentiment_by_category?.driver_fun,
                sentiment_value: aiData.sentiment_by_category?.value,
                match_confidence: 1.0
              }, { onConflict: 'video_id,car_slug' });
          }

        } catch (aiError) {
          logError(`    AI processing failed:`, aiError.message);
          stats.errors++;
        }

        stats.videosProcessed++;

        // Rate limit Supadata (1 req/sec on free tier)
        await new Promise(r => setTimeout(r, 1100));

      } catch (error) {
        logError(`  Error processing ${videoId}:`, error.message);
        stats.errors++;
      }
    }
  }

  // Run consensus aggregation
  if (!options.dryRun && stats.aiProcessed > 0) {
    log('');
    log('Running consensus aggregation...');
    const { spawn } = await import('child_process');
    await new Promise((resolve) => {
      const proc = spawn('node', ['scripts/youtube-aggregate-consensus.js'], { stdio: 'inherit' });
      proc.on('close', resolve);
    });
  }

  // Summary
  log('');
  log('========================================');
  log('Processing Complete!');
  log('========================================');
  log(`Videos processed:    ${stats.videosProcessed}`);
  log(`Videos skipped:      ${stats.videosSkipped}`);
  log(`Transcripts fetched: ${stats.transcriptsFetched}`);
  log(`Transcripts failed:  ${stats.transcriptsFailed}`);
  log(`AI processed:        ${stats.aiProcessed}`);
  log(`Errors:              ${stats.errors}`);

  if (options.dryRun) {
    log('');
    log('[DRY RUN] No changes were made to the database');
  }
}

main().catch(error => {
  logError('Fatal error:', error);
  process.exit(1);
});

