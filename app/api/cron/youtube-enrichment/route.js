/**
 * YouTube Enrichment Cron Job
 * 
 * Runs automatically via Vercel Cron (weekly on Mondays at 4 AM UTC)
 * Discovers new videos, fetches transcripts, processes with AI, and aggregates consensus.
 * 
 * Can also be triggered manually via POST request with CRON_SECRET header.
 */

import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import { YoutubeTranscript } from 'youtube-transcript';
import Anthropic from '@anthropic-ai/sdk';
import { notifyCronCompletion, notifyCronFailure } from '@/lib/discord';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.GOOGLE_AI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configuration
const CONFIG = {
  maxVideosPerCar: 3,
  maxVideosPerRun: 20,
  transcriptBatchSize: 5,
  aiBatchSize: 3,
  aiModel: 'claude-sonnet-4-20250514',
};

export const maxDuration = 300; // 5 minutes max for Vercel Pro

export async function GET(request) {
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
    notifyCronCompletion('YouTube Enrichment', {
      duration: results.duration,
      processed: results.discovery?.videosFound || 0,
      succeeded: results.discovery?.videosAdded || 0,
      failed: results.ai?.failed || 0,
      errors: results.transcripts?.failed || 0,
    });
    return Response.json({ success: true, results });
  } catch (error) {
    console.error('YouTube enrichment cron failed:', error);
    notifyCronFailure('YouTube Enrichment', error, { phase: 'pipeline' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request) {
  return GET(request);
}

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
// STEP 1: VIDEO DISCOVERY
// ============================================================================
async function discoverVideos() {
  const stats = { videosFound: 0, videosAdded: 0 };

  // Get active channels
  const { data: channels } = await supabase
    .from('youtube_channels')
    .select('*')
    .eq('is_active', true);

  if (!channels?.length) {
    console.log('   No active channels found');
    return stats;
  }

  // Get cars to search for
  const { data: cars } = await supabase
    .from('cars')
    .select('slug, name, brand, generation_years')
    .limit(50); // Process top 50 cars per run

  if (!cars?.length) {
    console.log('   No cars found');
    return stats;
  }

  // Search for videos
  for (const car of cars.slice(0, 10)) { // Limit to 10 cars per run for speed
    const searchQuery = `${car.brand} ${car.name} review`;
    
    for (const channel of channels.slice(0, 3)) { // Top 3 channels per car
      try {
        const response = await youtube.search.list({
          q: searchQuery,
          channelId: channel.channel_id,
          part: 'snippet',
          type: 'video',
          maxResults: 2,
          videoEmbeddable: 'true',
        });

        for (const item of response.data.items || []) {
          stats.videosFound++;
          const videoId = item.id.videoId;

          // Check if video already exists
          const { data: existing } = await supabase
            .from('youtube_videos')
            .select('video_id')
            .eq('video_id', videoId)
            .single();

          if (!existing) {
            // Get full video details
            const detailsResponse = await youtube.videos.list({
              id: videoId,
              part: 'snippet,contentDetails,statistics',
            });

            const details = detailsResponse.data.items?.[0];
            if (details) {
              await supabase.from('youtube_videos').insert({
                video_id: videoId,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                title: details.snippet.title,
                description: details.snippet.description,
                thumbnail_url: details.snippet.thumbnails?.high?.url,
                channel_id: channel.channel_id,
                channel_name: channel.channel_name,
                published_at: details.snippet.publishedAt,
                duration_seconds: parseDuration(details.contentDetails?.duration),
                view_count: parseInt(details.statistics?.viewCount || '0'),
                like_count: parseInt(details.statistics?.likeCount || '0'),
                processing_status: 'pending',
              });
              stats.videosAdded++;
              console.log(`   + Added: ${details.snippet.title.substring(0, 50)}...`);
            }
          }
        }
      } catch (error) {
        console.error(`   Error searching for ${car.name}:`, error.message);
      }
    }
  }

  return stats;
}

// ============================================================================
// STEP 2: TRANSCRIPT FETCHING
// ============================================================================
async function fetchTranscripts() {
  const stats = { processed: 0, success: 0, failed: 0 };

  const { data: videos } = await supabase
    .from('youtube_videos')
    .select('*')
    .eq('processing_status', 'pending')
    .limit(CONFIG.transcriptBatchSize);

  if (!videos?.length) {
    console.log('   No videos pending transcript fetch');
    return stats;
  }

  for (const video of videos) {
    stats.processed++;
    try {
      const transcriptItems = await YoutubeTranscript.fetchTranscript(video.video_id);
      const transcriptText = transcriptItems.map(item => item.text).join(' ');

      await supabase
        .from('youtube_videos')
        .update({
          transcript_text: transcriptText,
          transcript_source: 'youtube_library',
          is_auto_generated: true,
          processing_status: 'transcript_fetched',
          updated_at: new Date().toISOString(),
        })
        .eq('video_id', video.video_id);

      stats.success++;
      console.log(`   ✓ Transcript: ${video.title.substring(0, 40)}...`);
    } catch (error) {
      await supabase
        .from('youtube_videos')
        .update({
          processing_status: 'no_transcript',
          processing_error: error.message,
          updated_at: new Date().toISOString(),
        })
        .eq('video_id', video.video_id);

      stats.failed++;
      console.log(`   ✗ No transcript: ${video.title.substring(0, 40)}...`);
    }
  }

  return stats;
}

// ============================================================================
// STEP 3: AI PROCESSING
// ============================================================================
async function processWithAI() {
  const stats = { processed: 0, success: 0, failed: 0 };

  const { data: videos } = await supabase
    .from('youtube_videos')
    .select('*')
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

        // Create car links
        if (aiOutput.primary_car_slug) {
          await supabase.from('youtube_video_car_links').upsert({
            video_id: video.video_id,
            car_slug: aiOutput.primary_car_slug,
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
          }, { onConflict: 'video_id,car_slug' });
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

  // Get cars with linked videos
  const { data: carLinks } = await supabase
    .from('youtube_video_car_links')
    .select('car_slug')
    .eq('role', 'primary');

  const uniqueSlugs = [...new Set(carLinks?.map(l => l.car_slug) || [])];

  for (const slug of uniqueSlugs) {
    const { data: links } = await supabase
      .from('youtube_video_car_links')
      .select('*')
      .eq('car_slug', slug)
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

    await supabase
      .from('cars')
      .update({
        external_consensus: consensus,
        expert_review_count: links.length,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', slug);

    stats.carsUpdated++;
  }

  console.log(`   Updated consensus for ${stats.carsUpdated} cars`);
  return stats;
}

// ============================================================================
// HELPERS
// ============================================================================
function parseDuration(iso8601) {
  if (!iso8601) return null;
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

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






