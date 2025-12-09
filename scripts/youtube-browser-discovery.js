#!/usr/bin/env node

/**
 * YouTube Video Discovery via Browser Scraping
 * 
 * Searches YouTube directly (no API needed) to find videos for cars.
 * Uses Puppeteer to automate browser, then Supadata for transcripts.
 * 
 * Usage:
 *   node scripts/youtube-browser-discovery.js --car-slug shelby-gt350
 *   node scripts/youtube-browser-discovery.js --all --limit 5
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

// ============================================================================
// Configuration
// ============================================================================

const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Trusted channels to search (from user's list + extras)
const TRUSTED_CHANNELS = [
  'Throttle House',
  'Extra Throttle House',
  'savagegeese', 
  'SavageGeese',
  'Doug DeMuro',
  'carwow',
  'The Straight Pipes',
  'Top Gear',
  'MotorTrend',
  'Donut',
  'Donut Media',
  'Engineering Explained',
  'Cars with Miles',
  'CarswithMiles'
];

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  carSlug: null,
  all: false,
  limit: null,
  videosPerCar: 3,
  dryRun: false,
  verbose: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--car-slug':
      options.carSlug = args[++i];
      break;
    case '--all':
      options.all = true;
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
const log = (...args) => console.log('[browser-discovery]', ...args);
const logVerbose = (...args) => options.verbose && console.log('[browser-discovery:verbose]', ...args);
const logError = (...args) => console.error('[browser-discovery:error]', ...args);

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// Browser-based YouTube Search
// ============================================================================

async function searchYouTubeForCar(browser, carName, existingVideoIds) {
  const videos = [];
  const page = await browser.newPage();
  
  // Set a realistic user agent
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  try {
    // Search YouTube
    const searchQuery = encodeURIComponent(`${carName} review`);
    const searchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
    
    log(`  Searching: "${carName} review"`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for results to load
    await page.waitForSelector('ytd-video-renderer', { timeout: 10000 });
    
    // Extract video data from search results
    const results = await page.evaluate((trustedChannels, maxVideos) => {
      const videos = [];
      const videoElements = document.querySelectorAll('ytd-video-renderer');
      
      for (const el of videoElements) {
        if (videos.length >= maxVideos * 2) break; // Get extra to filter
        
        try {
          // Get video link
          const linkEl = el.querySelector('a#video-title');
          if (!linkEl) continue;
          
          const href = linkEl.getAttribute('href');
          if (!href || !href.includes('/watch?v=')) continue;
          
          const videoId = href.split('v=')[1]?.split('&')[0];
          if (!videoId) continue;
          
          // Get title
          const title = linkEl.textContent?.trim() || '';
          
          // Get channel name
          const channelEl = el.querySelector('ytd-channel-name a');
          const channelName = channelEl?.textContent?.trim() || '';
          
          // Get thumbnail
          const thumbEl = el.querySelector('img');
          const thumbnailUrl = thumbEl?.src || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          
          // Check if from trusted channel (case insensitive)
          const isTrusted = trustedChannels.some(tc => 
            channelName.toLowerCase().includes(tc.toLowerCase())
          );
          
          videos.push({
            videoId,
            title,
            channelName,
            thumbnailUrl,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            isTrusted
          });
        } catch (e) {
          // Skip this element
        }
      }
      
      return videos;
    }, TRUSTED_CHANNELS, options.videosPerCar);
    
    // Filter: prefer trusted channels, then by relevance
    const trustedVideos = results.filter(v => v.isTrusted && !existingVideoIds.has(v.videoId));
    const otherVideos = results.filter(v => !v.isTrusted && !existingVideoIds.has(v.videoId));
    
    // Take trusted first, then fill with others
    for (const video of [...trustedVideos, ...otherVideos]) {
      if (videos.length >= options.videosPerCar) break;
      if (!existingVideoIds.has(video.videoId)) {
        videos.push(video);
        existingVideoIds.add(video.videoId);
      }
    }
    
    log(`  ✓ Found ${videos.length} videos (${trustedVideos.length} from trusted channels)`);
    
  } catch (error) {
    logError(`  Search failed: ${error.message}`);
  } finally {
    await page.close();
  }
  
  return videos;
}

// ============================================================================
// Transcript & AI Processing (same as other scripts)
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
    throw new Error(`Supadata failed: ${response.status}`);
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

  const prompt = `You are analyzing a car review video transcript. Extract structured data.

VIDEO: "${video.title}"
CHANNEL: ${video.channelName}
PRIMARY CAR: ${carSlug}

TRANSCRIPT:
${video.transcript.slice(0, 12000)}

Extract as JSON:
{
  "summary": "2-3 paragraph summary",
  "one_line_take": "Single sentence verdict",
  "pros_mentioned": [{"text": "pro point", "category": "optional"}],
  "cons_mentioned": [{"text": "con point", "category": "optional"}],
  "notable_quotes": [{"quote": "exact quote"}],
  "sentiment_by_category": {
    "sound": 0.0, "interior": 0.0, "track": 0.0, "driver_fun": 0.0, "value": 0.0
  },
  "stock_strengths": ["praised aspects"],
  "stock_weaknesses": ["criticized aspects"]
}

Use -1.0 to +1.0 for sentiment, null if not discussed.`;

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
  log('YouTube Browser Discovery');
  log('========================================');
  log('Options:', options);
  log('');

  // Get cars to process
  let cars = [];
  
  if (options.carSlug) {
    const { data } = await supabase
      .from('cars')
      .select('slug, name')
      .eq('slug', options.carSlug)
      .single();
    if (data) cars = [data];
  } else if (options.all) {
    const { data } = await supabase
      .from('cars')
      .select('slug, name, expert_review_count')
      .order('name');
    
    // Filter to cars without reviews
    cars = (data || []).filter(c => !c.expert_review_count || c.expert_review_count === 0);
    
    if (options.limit) {
      cars = cars.slice(0, options.limit);
    }
  }

  if (cars.length === 0) {
    logError('No cars to process. Use --car-slug or --all');
    process.exit(1);
  }

  log(`Processing ${cars.length} car(s)`);

  // Get existing video IDs
  const { data: existingVideos } = await supabase
    .from('youtube_videos')
    .select('video_id');
  const existingVideoIds = new Set((existingVideos || []).map(v => v.video_id));
  log(`${existingVideoIds.size} videos already in database`);

  // Launch browser
  log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Stats
  const stats = {
    carsProcessed: 0,
    videosFound: 0,
    transcriptsFetched: 0,
    aiProcessed: 0,
    errors: 0
  };

  try {
    // Process each car
    for (let i = 0; i < cars.length; i++) {
      const car = cars[i];
      log('');
      log(`[${i + 1}/${cars.length}] 🚗 ${car.name}`);
      
      // Search YouTube
      const videos = await searchYouTubeForCar(browser, car.name, existingVideoIds);
      stats.videosFound += videos.length;
      
      if (videos.length === 0) {
        log('  No new videos found');
        stats.carsProcessed++;
        continue;
      }

      // Process each video
      for (const video of videos) {
        log(`  📼 "${video.title.slice(0, 50)}..." (${video.channelName})`);
        
        try {
          // Fetch transcript
          log(`    🔤 Fetching transcript...`);
          const transcript = await fetchTranscript(video.videoId);
          log(`    ✓ ${transcript.text.length} chars`);
          stats.transcriptsFetched++;
          
          video.transcript = transcript.text;
          
          // Save to database
          if (!options.dryRun) {
            await supabase.from('youtube_videos').upsert({
              video_id: video.videoId,
              url: video.url,
              title: video.title,
              thumbnail_url: video.thumbnailUrl,
              channel_id: null,
              channel_name: video.channelName,
              transcript_text: transcript.text,
              transcript_language: transcript.language,
              transcript_source: transcript.source,
              processing_status: 'transcript_fetched'
            }, { onConflict: 'video_id' });
          }
          
          // AI Processing
          log(`    🤖 AI processing...`);
          const aiData = await processWithAI(video, car.slug);
          log(`    ✓ ${aiData.pros_mentioned?.length || 0} pros, ${aiData.cons_mentioned?.length || 0} cons`);
          stats.aiProcessed++;
          
          if (!options.dryRun) {
            // Update video with AI data
            await supabase.from('youtube_videos').update({
              summary: aiData.summary,
              one_line_take: aiData.one_line_take,
              pros_mentioned: aiData.pros_mentioned,
              cons_mentioned: aiData.cons_mentioned,
              notable_quotes: aiData.notable_quotes,
              stock_strengths: aiData.stock_strengths,
              stock_weaknesses: aiData.stock_weaknesses,
              processing_status: 'processed',
              quality_score: 1.0
            }).eq('video_id', video.videoId);

            // Create car link
            await supabase.from('youtube_video_car_links').upsert({
              video_id: video.videoId,
              car_slug: car.slug,
              role: 'primary',
              sentiment_sound: aiData.sentiment_by_category?.sound,
              sentiment_interior: aiData.sentiment_by_category?.interior,
              sentiment_track: aiData.sentiment_by_category?.track,
              sentiment_driver_fun: aiData.sentiment_by_category?.driver_fun,
              sentiment_value: aiData.sentiment_by_category?.value,
              match_confidence: 1.0
            }, { onConflict: 'video_id,car_slug' });
          }
          
          // Rate limit Supadata
          await new Promise(r => setTimeout(r, 1100));
          
        } catch (error) {
          logError(`    Failed: ${error.message}`);
          stats.errors++;
        }
      }
      
      stats.carsProcessed++;
      
      // Small delay between cars
      await new Promise(r => setTimeout(r, 2000));
    }
    
  } finally {
    await browser.close();
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
  log('Discovery Complete!');
  log('========================================');
  log(`Cars processed:      ${stats.carsProcessed}`);
  log(`Videos found:        ${stats.videosFound}`);
  log(`Transcripts fetched: ${stats.transcriptsFetched}`);
  log(`AI processed:        ${stats.aiProcessed}`);
  log(`Errors:              ${stats.errors}`);
}

main().catch(error => {
  logError('Fatal error:', error);
  process.exit(1);
});
