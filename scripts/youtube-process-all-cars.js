#!/usr/bin/env node

/**
 * Process YouTube videos for ALL cars in the database
 * 
 * This script:
 * 1. Gets all 98 cars from the database
 * 2. For each car, discovers relevant YouTube videos from trusted channels
 * 3. Fetches transcripts via Supadata API
 * 4. Processes with AI to extract summaries, pros/cons, quotes
 * 5. Updates car consensus data
 * 
 * Progress is tracked and resumable - skips cars that already have reviews.
 * 
 * Usage:
 *   node scripts/youtube-process-all-cars.js [options]
 * 
 * Options:
 *   --start-at <slug>    Start processing from this car slug
 *   --limit <n>          Only process n cars (for testing)
 *   --videos-per-car <n> Max videos to discover per car (default: 3)
 *   --dry-run            Don't write to database
 *   --verbose            Enable verbose logging
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Configuration
// ============================================================================

const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  startAt: null,
  limit: null,
  videosPerCar: 3,
  dryRun: false,
  verbose: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--start-at':
      options.startAt = args[++i];
      break;
    case '--limit':
      options.limit = parseInt(args[++i], 10);
      break;
    case '--videos-per-car':
      options.videosPerCar = parseInt(args[++i], 10);
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
const log = (...args) => console.log('[process-all]', ...args);
const logVerbose = (...args) => options.verbose && console.log('[process-all:verbose]', ...args);
const logError = (...args) => console.error('[process-all:error]', ...args);

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// YouTube Discovery
// ============================================================================

async function discoverVideosForCar(car, channels, existingVideoIds) {
  const videos = [];
  
  // Build search queries for this car
  const searchQueries = [
    `${car.name} review`,
  ];
  
  // Add generation code if available
  if (car.generation_code) {
    searchQueries.push(`${car.brand} ${car.generation_code} review`);
  }

  log(`  Searching for: "${searchQueries[0]}"`);

  for (const channel of channels) {
    try {
      // Search YouTube for videos from this channel
      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('channelId', channel.channel_id);
      searchUrl.searchParams.set('q', searchQueries[0]);
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('maxResults', '3');
      searchUrl.searchParams.set('order', 'relevance');
      searchUrl.searchParams.set('key', GOOGLE_API_KEY);

      const response = await fetch(searchUrl.toString());
      
      if (!response.ok) {
        const error = await response.json();
        if (error.error?.errors?.[0]?.reason === 'quotaExceeded') {
          log(`  ⚠️ YouTube API quota exceeded - stopping discovery`);
          return { videos, quotaExceeded: true };
        }
        logVerbose(`  Channel ${channel.name} search failed:`, error.error?.message);
        continue;
      }

      const data = await response.json();
      
      for (const item of data.items || []) {
        const videoId = item.id.videoId;
        
        // Skip if we already have this video
        if (existingVideoIds.has(videoId)) {
          logVerbose(`    Skipping ${videoId} - already in database`);
          continue;
        }
        
        // Check if title is relevant to this car
        const title = item.snippet.title.toLowerCase();
        const carName = car.name.toLowerCase();
        const carBrand = (car.brand || '').toLowerCase();
        
        // Extract model name (car name often includes brand)
        const carNameParts = carName.split(' ').filter(p => p.length > 2);
        
        const isRelevant = 
          title.includes(carName) ||
          carNameParts.some(part => title.includes(part)) ||
          (carBrand && carNameParts.some(part => title.includes(carBrand) && title.includes(part)));
        
        if (!isRelevant) {
          logVerbose(`    Skipping "${item.snippet.title}" - not relevant`);
          continue;
        }

        videos.push({
          video_id: videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail_url: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
          channel_id: channel.channel_id,
          channel_name: channel.name,
          published_at: item.snippet.publishedAt,
          car_slug: car.slug
        });

        if (videos.length >= options.videosPerCar) break;
      }

      if (videos.length >= options.videosPerCar) break;
      
      // Rate limit between channels
      await new Promise(r => setTimeout(r, 200));
      
    } catch (error) {
      logError(`  Error searching channel ${channel.name}:`, error.message);
    }
  }

  return { videos, quotaExceeded: false };
}

// ============================================================================
// Transcript Fetching (Supadata)
// ============================================================================

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

// ============================================================================
// AI Processing
// ============================================================================

async function processWithAI(video, carSlug, allCarSlugs) {
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
// Main Processing Loop
// ============================================================================

async function main() {
  log('========================================');
  log('YouTube Processing for All Cars');
  log('========================================');
  log('Options:', options);
  log('');

  // Validate configuration
  const missing = [];
  if (!SUPADATA_API_KEY) missing.push('SUPADATA_API_KEY');
  if (!GOOGLE_API_KEY) missing.push('GOOGLE_AI_API_KEY');
  if (!ANTHROPIC_API_KEY) missing.push('ANTHROPIC_API_KEY');
  if (!SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_KEY');
  
  if (missing.length > 0) {
    logError('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }

  // Fetch all cars
  log('Fetching cars from database...');
  const { data: cars, error: carsError } = await supabase
    .from('cars')
    .select('id, slug, name, brand, years, generation_code, expert_review_count')
    .order('name');
  
  if (carsError) {
    logError('Failed to fetch cars:', carsError);
    process.exit(1);
  }

  log(`Found ${cars.length} cars`);

  // Fetch channels
  const { data: channels } = await supabase
    .from('youtube_channels')
    .select('*')
    .eq('is_active', true)
    .order('credibility_tier');

  log(`Found ${channels.length} active channels`);

  // Get existing video IDs
  const { data: existingVideos } = await supabase
    .from('youtube_videos')
    .select('video_id');
  
  const existingVideoIds = new Set((existingVideos || []).map(v => v.video_id));
  log(`${existingVideoIds.size} videos already in database`);

  // Get all car slugs for AI processing
  const allCarSlugs = cars.map(c => c.slug);

  // Filter cars to process
  let carsToProcess = cars;
  
  if (options.startAt) {
    const startIndex = cars.findIndex(c => c.slug === options.startAt);
    if (startIndex === -1) {
      logError(`Car slug "${options.startAt}" not found`);
      process.exit(1);
    }
    carsToProcess = cars.slice(startIndex);
    log(`Starting from: ${options.startAt} (${carsToProcess.length} cars remaining)`);
  }

  if (options.limit) {
    carsToProcess = carsToProcess.slice(0, options.limit);
    log(`Limited to ${carsToProcess.length} cars`);
  }

  // Track progress
  const stats = {
    carsProcessed: 0,
    carsSkipped: 0,
    videosDiscovered: 0,
    transcriptsFetched: 0,
    transcriptsFailed: 0,
    aiProcessed: 0,
    errors: 0
  };

  let quotaExceeded = false;

  // Process each car
  for (let i = 0; i < carsToProcess.length; i++) {
    const car = carsToProcess[i];
    const progress = `[${i + 1}/${carsToProcess.length}]`;
    
    log('');
    log(`${progress} 🚗 ${car.name} (${car.slug})`);
    
    // Skip if car already has reviews
    if (car.expert_review_count > 0) {
      log(`  ⏭️ Skipping - already has ${car.expert_review_count} reviews`);
      stats.carsSkipped++;
      continue;
    }

    if (quotaExceeded) {
      log(`  ⏭️ Skipping - YouTube quota exceeded`);
      stats.carsSkipped++;
      continue;
    }

    try {
      // Step 1: Discover videos
      log(`  📹 Discovering videos...`);
      const { videos, quotaExceeded: quota } = await discoverVideosForCar(car, channels, existingVideoIds);
      
      if (quota) {
        quotaExceeded = true;
        log(`  ⚠️ YouTube API quota exceeded`);
        continue;
      }

      if (videos.length === 0) {
        log(`  ❌ No relevant videos found`);
        stats.carsProcessed++;
        continue;
      }

      log(`  ✓ Found ${videos.length} videos`);
      stats.videosDiscovered += videos.length;

      // Step 2: Process each video
      for (const video of videos) {
        log(`    📼 "${video.title.slice(0, 50)}..."`);
        
        try {
          // Insert video record
          if (!options.dryRun) {
            const { error: insertError } = await supabase
              .from('youtube_videos')
              .upsert({
                video_id: video.video_id,
                url: video.url,
                title: video.title,
                description: video.description,
                thumbnail_url: video.thumbnail_url,
                channel_id: video.channel_id,
                channel_name: video.channel_name,
                published_at: video.published_at,
                processing_status: 'pending'
              }, { onConflict: 'video_id' });
            
            if (insertError) {
              logError(`    Insert failed:`, insertError.message);
              continue;
            }
          }

          existingVideoIds.add(video.video_id);

          // Fetch transcript
          log(`      🔤 Fetching transcript...`);
          let transcript;
          try {
            transcript = await fetchTranscript(video.video_id);
            log(`      ✓ Transcript: ${transcript.text.length} chars`);
            stats.transcriptsFetched++;
            
            // Rate limit Supadata (1 req/sec on free tier)
            await new Promise(r => setTimeout(r, 1100));
          } catch (transcriptError) {
            log(`      ❌ No transcript: ${transcriptError.message}`);
            stats.transcriptsFailed++;
            
            if (!options.dryRun) {
              await supabase
                .from('youtube_videos')
                .update({ processing_status: 'no_transcript', processing_error: transcriptError.message })
                .eq('video_id', video.video_id);
            }
            continue;
          }

          // Save transcript
          if (!options.dryRun) {
            await supabase
              .from('youtube_videos')
              .update({
                transcript_text: transcript.text,
                transcript_language: transcript.language,
                transcript_source: transcript.source,
                processing_status: 'transcript_fetched'
              })
              .eq('video_id', video.video_id);
          }

          // AI Processing
          log(`      🤖 AI processing...`);
          try {
            video.transcript_text = transcript.text;
            const aiData = await processWithAI(video, car.slug, allCarSlugs);
            
            log(`      ✓ Extracted: ${aiData.pros_mentioned?.length || 0} pros, ${aiData.cons_mentioned?.length || 0} cons`);
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
                .eq('video_id', video.video_id);

              // Create car link
              await supabase
                .from('youtube_video_car_links')
                .upsert({
                  video_id: video.video_id,
                  car_slug: car.slug,
                  role: 'primary',
                  sentiment_sound: aiData.sentiment_by_category?.sound,
                  sentiment_interior: aiData.sentiment_by_category?.interior,
                  sentiment_track: aiData.sentiment_by_category?.track,
                  sentiment_driver_fun: aiData.sentiment_by_category?.driver_fun,
                  sentiment_value: aiData.sentiment_by_category?.value,
                  match_confidence: 0.9
                }, { onConflict: 'video_id,car_slug' });
            }

          } catch (aiError) {
            logError(`      AI processing failed:`, aiError.message);
            stats.errors++;
          }

        } catch (videoError) {
          logError(`    Video processing failed:`, videoError.message);
          stats.errors++;
        }
      }

      stats.carsProcessed++;

    } catch (carError) {
      logError(`  Car processing failed:`, carError.message);
      stats.errors++;
    }

    // Progress update every 10 cars
    if ((i + 1) % 10 === 0) {
      log('');
      log(`--- Progress: ${i + 1}/${carsToProcess.length} cars ---`);
      log(`    Videos discovered: ${stats.videosDiscovered}`);
      log(`    Transcripts fetched: ${stats.transcriptsFetched}`);
      log(`    AI processed: ${stats.aiProcessed}`);
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

  // Final summary
  log('');
  log('========================================');
  log('Processing Complete!');
  log('========================================');
  log(`Cars processed:      ${stats.carsProcessed}`);
  log(`Cars skipped:        ${stats.carsSkipped}`);
  log(`Videos discovered:   ${stats.videosDiscovered}`);
  log(`Transcripts fetched: ${stats.transcriptsFetched}`);
  log(`Transcripts failed:  ${stats.transcriptsFailed}`);
  log(`AI processed:        ${stats.aiProcessed}`);
  log(`Errors:              ${stats.errors}`);
  
  if (quotaExceeded) {
    log('');
    log('⚠️ YouTube API quota exceeded. Run again tomorrow to continue.');
    log(`   Resume with: node scripts/youtube-process-all-cars.js --start-at ${carsToProcess[stats.carsProcessed]?.slug || 'next-car'}`);
  }

  if (options.dryRun) {
    log('');
    log('[DRY RUN] No changes were made to the database');
  }
}

// Run
main().catch(error => {
  logError('Fatal error:', error);
  process.exit(1);
});

