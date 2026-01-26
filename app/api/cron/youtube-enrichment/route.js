/**
 * YouTube Enrichment Cron Job
 * 
 * Runs automatically via Vercel Cron (weekly on Mondays at 4 AM UTC)
 * Discovers new videos via Exa search, fetches transcripts, processes with AI, and aggregates consensus.
 * 
 * Uses Exa search instead of YouTube API to avoid quota limitations.
 * 
 * Can also be triggered manually via POST request with CRON_SECRET header.
 * 
 * Required Environment Variables:
 *   EXA_API_KEY           - Exa API key for video discovery
 *   SUPADATA_API_KEY      - (Optional) Supadata API key for transcript fallback
 *   ANTHROPIC_API_KEY     - For AI processing of transcripts
 *   SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { YoutubeTranscript } from 'youtube-transcript';

import { trackBackendAiUsage, AI_PURPOSES, AI_SOURCES } from '@/lib/backendAiLogger';
import { resolveCarId } from '@/lib/carResolver';
import { notifyCronEnrichment, notifyCronFailure } from '@/lib/discord';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;
const EXA_API_KEY = process.env.EXA_API_KEY;
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configuration
const CONFIG = {
  maxVideosPerCar: 3,
  maxVideosPerRun: 20,
  maxCarsPerRun: 10,
  transcriptBatchSize: 5,
  aiBatchSize: 3,
  aiModel: 'claude-sonnet-4-20250514',
};

export const maxDuration = 300; // 5 minutes max for Vercel Pro

async function handleGet(request) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const vercelCron = request.headers.get('x-vercel-cron');

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    if (vercelCron !== 'true') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const results = await runEnrichmentPipeline();
    notifyCronEnrichment('YouTube Expert Reviews', {
      duration: results.duration,
      table: 'youtube_videos',
      recordsAdded: results.discovery?.videosAdded || 0,
      recordsUpdated: results.ai?.success || 0,
      recordsProcessed: results.discovery?.videosFound || 0,
      errors: (results.ai?.failed || 0) + (results.transcripts?.failed || 0),
      details: [
        { label: '🎬 Videos Found', value: results.discovery?.videosFound || 0 },
        { label: '📝 Transcripts', value: results.transcripts?.success || 0 },
        { label: '🤖 AI Processed', value: results.ai?.success || 0 },
        { label: '📊 Cars Updated', value: results.consensus?.carsUpdated || 0 },
      ],
    });
    return Response.json({ success: true, results });
  } catch (error) {
    console.error('YouTube enrichment cron failed:', error);
    notifyCronFailure('YouTube Enrichment', error, { phase: 'pipeline' });
    return Response.json({ error: 'YouTube enrichment cron failed' }, { status: 500 });
  }
}

// Also support POST for manual triggers
async function handlePost(request) {
  return handleGet(request);
}

export const GET = withErrorLogging(handleGet, { route: 'cron/youtube-enrichment', feature: 'cron' });
export const POST = withErrorLogging(handlePost, { route: 'cron/youtube-enrichment', feature: 'cron' });

async function runEnrichmentPipeline() {
  const startTime = Date.now();
  const results = {
    discovery: { videosFound: 0, videosAdded: 0 },
    transcripts: { processed: 0, success: 0, failed: 0 },
    ai: { processed: 0, success: 0, failed: 0 },
    consensus: { carsUpdated: 0 },
    duration: 0,
  };

  console.log('🚀 Starting YouTube Enrichment Pipeline...');

  // Step 1: Discovery
  console.log('\n📺 Step 1: Discovering videos...');
  results.discovery = await discoverVideos();

  // Step 2: Fetch Transcripts
  console.log('\n📝 Step 2: Fetching transcripts...');
  results.transcripts = await fetchTranscripts();

  // Step 3: AI Processing
  console.log('\n🤖 Step 3: AI processing...');
  results.ai = await processWithAI();

  // Step 4: Aggregate Consensus
  console.log('\n📊 Step 4: Aggregating consensus...');
  results.consensus = await aggregateConsensus();

  results.duration = Date.now() - startTime;
  console.log(`\n✅ Pipeline completed in ${(results.duration / 1000).toFixed(1)}s`);

  return results;
}

// ============================================================================
// STEP 1: VIDEO DISCOVERY (via Exa Search)
// ============================================================================
async function discoverVideos() {
  const stats = { videosFound: 0, videosAdded: 0 };

  if (!EXA_API_KEY) {
    console.log('   ⚠️ EXA_API_KEY not configured - skipping video discovery');
    return stats;
  }

  // Get cars to search for - prioritize cars with fewer videos
  // Include id for efficient youtube_video_car_links upserts
  const { data: cars } = await supabase
    .from('cars')
    .select('id, slug, name, brand, generation_years, expert_review_count')
    .order('expert_review_count', { ascending: true, nullsFirst: true })
    .limit(50);

  if (!cars?.length) {
    console.log('   No cars found');
    return stats;
  }

  console.log(`   Processing ${Math.min(CONFIG.maxCarsPerRun, cars.length)} cars...`);

  // Search for videos using Exa
  for (const car of cars.slice(0, CONFIG.maxCarsPerRun)) {
    try {
      const videos = await searchYouTubeVideosWithExa(car.name, car.brand);
      
      for (const video of videos.slice(0, CONFIG.maxVideosPerCar)) {
        stats.videosFound++;

        // Check if video already exists
        const { data: existing } = await supabase
          .from('youtube_videos')
          .select('video_id')
          .eq('video_id', video.videoId)
          .single();

        if (!existing) {
          // Insert new video
          const { error: insertError } = await supabase.from('youtube_videos').insert({
            video_id: video.videoId,
            url: video.url,
            title: video.title,
            thumbnail_url: `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`,
            channel_name: video.channelName || null,
            processing_status: 'pending',
          });

          if (!insertError) {
            stats.videosAdded++;
            console.log(`   + Added: ${video.title.substring(0, 50)}...`);

            // Create preliminary car link using car_id (car_slug column no longer exists)
            await supabase.from('youtube_video_car_links').upsert({
              video_id: video.videoId,
              car_id: car.id,
              role: 'primary',
              match_confidence: 0.6, // Preliminary - will be refined by AI
              match_method: 'exa_search',
            }, { onConflict: 'video_id,car_id' });
          }
        }

        // Rate limiting
        if (stats.videosAdded >= CONFIG.maxVideosPerRun) {
          console.log(`   Reached max videos per run (${CONFIG.maxVideosPerRun})`);
          return stats;
        }
      }

      // Small delay between car searches
      await new Promise(r => setTimeout(r, 200));

    } catch (error) {
      console.error(`   Error searching for ${car.name}:`, error.message);
    }
  }

  return stats;
}

/**
 * Search for YouTube review videos using Exa
 * Uses multiple query strategies to find high-quality automotive review content
 * @param {string} carName - Full car name
 * @param {string} brand - Car brand
 * @returns {Promise<Array>} Array of video objects
 */
async function searchYouTubeVideosWithExa(carName, brand) {
  const videos = new Map();

  // Multiple search queries for comprehensive coverage
  // Target high-quality channels and content types
  const searchQueries = [
    // Direct car reviews
    `site:youtube.com "${carName}" review`,
    `site:youtube.com "${brand} ${carName}" owner review`,
    // Enthusiast content channels (these produce high-quality, detailed reviews)
    `site:youtube.com "${carName}" Throttle House`,
    `site:youtube.com "${carName}" savagegeese`,
    `site:youtube.com "${carName}" Doug DeMuro`,
    `site:youtube.com "${carName}" Everyday Driver`,
    `site:youtube.com "${carName}" The Straight Pipes`,
    `site:youtube.com "${carName}" Carwow`,
    // Track/driving content
    `site:youtube.com "${carName}" track test POV`,
    `site:youtube.com "${carName}" buyers guide`,
  ];

  // Dedupe queries and limit to avoid rate limits
  const uniqueQueries = [...new Set(searchQueries)].slice(0, 6);

  for (const query of uniqueQueries) {
    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': EXA_API_KEY
        },
        body: JSON.stringify({
          query: query,
          numResults: 15,
          type: 'auto', // Let Exa choose best search type
          includeDomains: ['youtube.com', 'youtu.be'],
          // Prefer recent content but don't exclude classics
          startPublishedDate: '2018-01-01T00:00:00.000Z',
        })
      });

      if (!response.ok) {
        console.log(`   Exa search failed for "${query}": ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      for (const result of data.results || []) {
        if (!result.url) continue;
        
        // Parse YouTube URL for video ID (handle multiple URL formats)
        let videoId = null;
        const watchMatch = result.url.match(/youtube\.com\/watch\?v=([^&\s]+)/);
        const shortMatch = result.url.match(/youtu\.be\/([^?&\s]+)/);
        const embedMatch = result.url.match(/youtube\.com\/embed\/([^?&\s]+)/);
        
        if (watchMatch) videoId = watchMatch[1];
        else if (shortMatch) videoId = shortMatch[1];
        else if (embedMatch) videoId = embedMatch[1];
        
        if (!videoId || videos.has(videoId)) continue;

        // Skip shorts (usually under 60 seconds, less valuable for deep reviews)
        if (result.url.includes('/shorts/')) continue;

        // Extract metadata
        const channelName = result.author || null;
        const title = result.title || 'Unknown Title';
        
        // Skip obvious non-review content
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('trailer') || 
            lowerTitle.includes('commercial') ||
            lowerTitle.includes('ad ') ||
            lowerTitle.includes('teaser')) {
          continue;
        }

        videos.set(videoId, {
          videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          title,
          channelName,
          publishedDate: result.publishedDate || null,
        });
      }

      // Small delay between queries to respect rate limits
      await new Promise(r => setTimeout(r, 150));

    } catch (err) {
      console.error(`   Exa search error: ${err.message}`);
    }
  }

  console.log(`   Found ${videos.size} unique videos for ${carName}`);
  return Array.from(videos.values());
}

// ============================================================================
// STEP 2: TRANSCRIPT FETCHING (with Supadata fallback)
// ============================================================================
async function fetchTranscripts() {
  const stats = { processed: 0, success: 0, failed: 0 };

  const VIDEO_COLS = 'id, video_id, channel_id, title, description, thumbnail_url, duration_seconds, published_at, view_count, processing_status, transcript_text, created_at';
  
  // Also check for videos stuck in 'transcript_fetched' with null transcripts
  const { data: videos } = await supabase
    .from('youtube_videos')
    .select(VIDEO_COLS)
    .or('processing_status.eq.pending,and(processing_status.eq.transcript_fetched,transcript_text.is.null)')
    .limit(CONFIG.transcriptBatchSize);

  if (!videos?.length) {
    console.log('   No videos pending transcript fetch');
    return stats;
  }

  console.log(`   Processing ${videos.length} videos for transcripts...`);

  for (const video of videos) {
    stats.processed++;
    let transcriptText = null;
    let transcriptSource = null;
    let transcriptLang = null;

    // Strategy 1: Try Supadata API first (more reliable, handles age-restricted videos better)
    if (SUPADATA_API_KEY) {
      try {
        console.log(`   Trying Supadata for ${video.video_id}...`);
        const supadata = await fetchTranscriptViaSupadata(video.video_id);
        if (supadata && supadata.text && supadata.text.length > 100) {
          transcriptText = supadata.text;
          transcriptSource = 'supadata_api';
          transcriptLang = supadata.language;
          console.log(`   ✓ Supadata transcript: ${supadata.text.length} chars`);
        }
      } catch (supadataError) {
        console.log(`   Supadata failed for ${video.video_id}: ${supadataError.message}`);
      }
    }

    // Strategy 2: Fallback to youtube-transcript library
    if (!transcriptText) {
      try {
        console.log(`   Trying youtube-transcript library for ${video.video_id}...`);
        const transcriptItems = await YoutubeTranscript.fetchTranscript(video.video_id);
        if (transcriptItems && transcriptItems.length > 0) {
          transcriptText = transcriptItems.map(item => item.text).join(' ');
          transcriptSource = 'youtube_library';
          console.log(`   ✓ youtube-transcript: ${transcriptText.length} chars`);
        }
      } catch (ytError) {
        console.log(`   youtube-transcript failed for ${video.video_id}: ${ytError.message}`);
      }
    }

    // Validate transcript quality before saving
    if (transcriptText && transcriptText.length > 100) {
      const { error: updateError } = await supabase
        .from('youtube_videos')
        .update({
          transcript_text: transcriptText,
          transcript_source: transcriptSource,
          transcript_lang: transcriptLang,
          is_auto_generated: true,
          processing_status: 'transcript_fetched',
          processing_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('video_id', video.video_id);

      if (updateError) {
        console.error(`   Error saving transcript for ${video.video_id}:`, updateError);
        stats.failed++;
      } else {
        stats.success++;
        console.log(`   ✓ Saved transcript (${transcriptSource}): ${video.title?.substring(0, 40) || video.video_id}...`);
      }
    } else {
      await supabase
        .from('youtube_videos')
        .update({
          processing_status: 'no_transcript',
          processing_error: transcriptText 
            ? 'Transcript too short (<100 chars)' 
            : 'No transcript available from any source',
          updated_at: new Date().toISOString(),
        })
        .eq('video_id', video.video_id);

      stats.failed++;
      console.log(`   ✗ No valid transcript: ${video.title?.substring(0, 40) || video.video_id}...`);
    }

    // Small delay between videos to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }

  return stats;
}

/**
 * Fetch transcript for a YouTube video using Supadata API
 * Supadata provides reliable transcripts with language detection and multiple source options
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object|null>} Transcript data or null if unavailable
 */
async function fetchTranscriptViaSupadata(videoId) {
  // Use the youtube-specific transcript endpoint
  const url = `https://api.supadata.ai/v1/youtube/transcript`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': SUPADATA_API_KEY
    },
    body: JSON.stringify({
      url: `https://www.youtube.com/watch?v=${videoId}`,
      text: true, // Return plain text for easier processing
      lang: 'en', // Prefer English transcripts
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supadata API error ${response.status}: ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();
  
  // Handle both text mode and content array mode
  if (data.text && data.text.length > 0) {
    return {
      text: data.text,
      language: data.lang || 'en',
    };
  }
  
  if (data.content && data.content.length > 0) {
    // Convert Supadata content array format to text
    const fullText = data.content.map(item => item.text || '').join(' ');
    return {
      text: fullText,
      language: data.lang || 'en',
    };
  }

  return null;
}

// ============================================================================
// STEP 3: AI PROCESSING
// ============================================================================
async function processWithAI() {
  const stats = { processed: 0, success: 0, failed: 0 };

  const AI_VIDEO_COLS = 'id, video_id, channel_id, title, description, transcript_text, processing_status, created_at';
  
  const { data: videos } = await supabase
    .from('youtube_videos')
    .select(AI_VIDEO_COLS)
    .eq('processing_status', 'transcript_fetched')
    .limit(CONFIG.aiBatchSize);

  if (!videos?.length) {
    console.log('   No videos pending AI processing');
    return stats;
  }

  // Get car list for matching
  const { data: cars } = await supabase
    .from('cars')
    .select('slug, name, brand');

  const carList = cars?.map(c => `${c.brand} ${c.name} (slug: ${c.slug})`).join('\n') || '';

  for (const video of videos) {
    stats.processed++;
    try {
      const prompt = buildAIPrompt(video.transcript_text, carList, video.title);
      
      const response = await anthropic.messages.create({
        model: CONFIG.aiModel,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });

      // Track AI usage for cost analytics
      await trackBackendAiUsage({
        purpose: AI_PURPOSES.YOUTUBE_ENRICHMENT,
        scriptName: 'youtube-enrichment-cron',
        inputTokens: response.usage?.input_tokens || 0,
        outputTokens: response.usage?.output_tokens || 0,
        model: CONFIG.aiModel,
        entityId: video.video_id,
        source: AI_SOURCES.CRON_JOB,
      });

      const content = response.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const aiOutput = JSON.parse(jsonMatch[0]);
        
        // Update video with AI outputs
        await supabase
          .from('youtube_videos')
          .update({
            summary: aiOutput.summary,
            one_line_take: aiOutput.one_line_take,
            key_points: aiOutput.key_points || [],
            pros_mentioned: aiOutput.pros || [],
            cons_mentioned: aiOutput.cons || [],
            notable_quotes: aiOutput.quotes || [],
            content_type: aiOutput.content_type || 'review',
            usage_context: aiOutput.usage_context || [],
            driver_profile: aiOutput.driver_profile,
            processing_status: 'processed',
            processed_at: new Date().toISOString(),
            processing_model: CONFIG.aiModel,
            quality_score: aiOutput.quality_score || 0.7,
            updated_at: new Date().toISOString(),
          })
          .eq('video_id', video.video_id);

        // Create car links (resolve car_slug to car_id as car_slug column no longer exists)
        if (aiOutput.primary_car_slug) {
          const resolvedCarId = await resolveCarId(aiOutput.primary_car_slug);
          if (resolvedCarId) {
            await supabase.from('youtube_video_car_links').upsert({
              video_id: video.video_id,
              car_id: resolvedCarId,
              role: 'primary',
              match_confidence: aiOutput.match_confidence || 0.8,
              match_method: 'transcript_extract',
              overall_sentiment: aiOutput.overall_sentiment,
              sentiment_sound: aiOutput.sentiments?.sound,
              sentiment_track: aiOutput.sentiments?.track,
              sentiment_value: aiOutput.sentiments?.value,
              sentiment_reliability: aiOutput.sentiments?.reliability,
              sentiment_interior: aiOutput.sentiments?.interior,
              sentiment_driver_fun: aiOutput.sentiments?.driver_fun,
              stock_strength_tags: aiOutput.strengths || [],
              stock_weakness_tags: aiOutput.weaknesses || [],
            }, { onConflict: 'video_id,car_id' });
          } else {
            console.warn(`   ⚠️ Could not resolve car_id for slug: ${aiOutput.primary_car_slug}`);
          }
        }

        stats.success++;
        console.log(`   ✓ AI processed: ${video.title.substring(0, 40)}...`);
      } else {
        throw new Error('Could not parse AI response');
      }
    } catch (error) {
      await supabase
        .from('youtube_videos')
        .update({
          processing_status: 'failed',
          processing_error: error.message,
          updated_at: new Date().toISOString(),
        })
        .eq('video_id', video.video_id);

      stats.failed++;
      console.log(`   ✗ AI failed: ${video.title.substring(0, 40)}...`);
    }
  }

  return stats;
}

function buildAIPrompt(transcript, carList, title) {
  return `Analyze this YouTube car review transcript and extract structured data.

VIDEO TITLE: ${title}

TRANSCRIPT:
${transcript.substring(0, 12000)}

AVAILABLE CARS (match to these slugs):
${carList}

Extract and return as JSON:
{
  "summary": "2-3 paragraph summary of the review",
  "one_line_take": "Single sentence verdict",
  "primary_car_slug": "slug from the car list above that best matches the main car reviewed",
  "match_confidence": 0.0-1.0,
  "content_type": "review|comparison|track_test|pov_drive|other",
  "overall_sentiment": -1.0 to 1.0 (negative to positive),
  "sentiments": {
    "sound": -1.0 to 1.0 or null,
    "track": -1.0 to 1.0 or null,
    "value": -1.0 to 1.0 or null,
    "reliability": -1.0 to 1.0 or null,
    "interior": -1.0 to 1.0 or null,
    "driver_fun": -1.0 to 1.0 or null
  },
  "key_points": [{"text": "...", "sentiment": "positive|negative|neutral"}],
  "pros": [{"text": "...", "strength": 1-5}],
  "cons": [{"text": "...", "strength": 1-5}],
  "quotes": [{"quote": "...", "context": "..."}],
  "strengths": ["steering", "brakes", "sound", etc.],
  "weaknesses": ["cooling", "brakes", etc.],
  "usage_context": ["track", "daily", "canyon", etc.],
  "driver_profile": "Who this car is best for",
  "quality_score": 0.0-1.0 (how useful is this review)
}

Return ONLY valid JSON, no other text.`;
}

// ============================================================================
// STEP 4: CONSENSUS AGGREGATION
// ============================================================================
async function aggregateConsensus() {
  const stats = { carsUpdated: 0 };

  // Get cars with linked videos (uses car_id - car_slug column no longer exists)
  const { data: carLinks } = await supabase
    .from('youtube_video_car_links')
    .select('car_id')
    .eq('role', 'primary');

  const uniqueCarIds = [...new Set(carLinks?.map(l => l.car_id).filter(Boolean) || [])];

  const LINK_COLS = 'id, video_id, car_id, role, relevance_score, sentiment, key_points, created_at';
  
  for (const carId of uniqueCarIds) {
    const { data: links } = await supabase
      .from('youtube_video_car_links')
      .select(LINK_COLS)
      .eq('car_id', carId)
      .eq('role', 'primary');

    if (!links?.length) continue;

    // Aggregate sentiments
    const consensus = {
      review_count: links.length,
      overall: average(links.map(l => l.overall_sentiment).filter(Boolean)),
      sound: average(links.map(l => l.sentiment_sound).filter(Boolean)),
      track: average(links.map(l => l.sentiment_track).filter(Boolean)),
      value: average(links.map(l => l.sentiment_value).filter(Boolean)),
      reliability: average(links.map(l => l.sentiment_reliability).filter(Boolean)),
      interior: average(links.map(l => l.sentiment_interior).filter(Boolean)),
      driver_fun: average(links.map(l => l.sentiment_driver_fun).filter(Boolean)),
      strengths: aggregateTags(links.flatMap(l => l.stock_strength_tags || [])),
      weaknesses: aggregateTags(links.flatMap(l => l.stock_weakness_tags || [])),
    };

    // Update using car_id (more efficient than slug lookup)
    await supabase
      .from('cars')
      .update({
        external_consensus: consensus,
        expert_review_count: links.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', carId);

    stats.carsUpdated++;
  }

  console.log(`   Updated consensus for ${stats.carsUpdated} cars`);
  return stats;
}

// ============================================================================
// HELPERS
// ============================================================================
function average(numbers) {
  if (!numbers.length) return null;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

function aggregateTags(tags) {
  const counts = {};
  tags.forEach(tag => {
    counts[tag] = (counts[tag] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));
}






