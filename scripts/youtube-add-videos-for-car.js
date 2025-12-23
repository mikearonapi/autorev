#!/usr/bin/env node

/**
 * YouTube Video Addition Script
 * 
 * Adds YouTube videos for a specific car using Supadata for transcripts
 * and AI for processing. Designed to work with Exa search results.
 * 
 * Usage:
 *   node scripts/youtube-add-videos-for-car.js <car_slug> <video_url_1> <video_url_2> ...
 * 
 * Example:
 *   node scripts/youtube-add-videos-for-car.js honda-prelude-si-vtec-bb4 \
 *     https://www.youtube.com/watch?v=EdseFOxeGbI \
 *     https://www.youtube.com/watch?v=w5jk9N_1fvk
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Load environment variables
function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        let value = valueParts.join('=');
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!SUPADATA_API_KEY) {
  console.error('Missing SUPADATA_API_KEY - required for transcripts');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

// Parse args
const args = process.argv.slice(2);
const carSlug = args[0];
const videoUrls = args.slice(1);

if (!carSlug || videoUrls.length === 0) {
  console.log('Usage: node youtube-add-videos-for-car.js <car_slug> <video_url_1> [video_url_2] ...');
  console.log('');
  console.log('Example:');
  console.log('  node youtube-add-videos-for-car.js honda-prelude-si-vtec-bb4 \\');
  console.log('    https://www.youtube.com/watch?v=EdseFOxeGbI');
  process.exit(1);
}

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

/**
 * Extract video ID from YouTube URL
 */
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

/**
 * Fetch video metadata via oEmbed (no API key needed)
 */
async function fetchVideoMetadata(videoId) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      title: data.title,
      channel_name: data.author_name,
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
  } catch (err) {
    log(`  Warning: Could not fetch metadata for ${videoId}`);
    return null;
  }
}

/**
 * Fetch transcript using Supadata API
 */
async function fetchTranscript(videoId) {
  log(`  Fetching transcript via Supadata...`);
  
  const response = await fetch(`https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`, {
    headers: {
      'x-api-key': SUPADATA_API_KEY,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supadata API error (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  
  if (data.content) {
    return {
      text: data.content,
      language: data.lang || 'en',
      source: 'supadata_api',
    };
  }
  
  return null;
}

/**
 * Process transcript with AI to extract insights
 */
async function processTranscriptWithAI(transcript, carName) {
  if (!anthropic) {
    log('  Skipping AI processing (no ANTHROPIC_API_KEY)');
    return null;
  }
  
  log(`  Processing transcript with AI...`);
  
  const prompt = `Analyze this YouTube video transcript about the ${carName}. Extract structured insights.

TRANSCRIPT:
${transcript.substring(0, 15000)}

Return JSON with this structure:
{
  "content_type": "review|comparison|track_test|pov_drive|buying_guide|ownership_update|education|other",
  "summary": "2-3 sentence summary of the video content",
  "one_line_take": "Single sentence overall verdict/impression",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "pros_mentioned": ["Pro 1", "Pro 2"],
  "cons_mentioned": ["Con 1", "Con 2"],
  "notable_quotes": ["Quote 1", "Quote 2"],
  "quality_score": 0.0-1.0,
  "sentiment_overall": -1.0 to 1.0,
  "sentiment_sound": -1.0 to 1.0 or null,
  "sentiment_track": -1.0 to 1.0 or null,
  "sentiment_reliability": -1.0 to 1.0 or null,
  "sentiment_value": -1.0 to 1.0 or null,
  "sentiment_driver_fun": -1.0 to 1.0 or null
}

Return ONLY valid JSON.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });
    
    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    log(`  AI processing error: ${err.message}`);
  }
  
  return null;
}

/**
 * Add video to database
 */
async function addVideoToDatabase(videoId, metadata, transcript, aiInsights, carSlug) {
  log(`  Saving to database...`);
  
  // Check if video already exists
  const { data: existing } = await supabase
    .from('youtube_videos')
    .select('id')
    .eq('video_id', videoId)
    .single();
  
  let videoRecord;
  
  if (existing) {
    // Update existing video with transcript
    const { data, error } = await supabase
      .from('youtube_videos')
      .update({
        transcript_text: transcript?.text,
        transcript_language: transcript?.language || 'en',
        transcript_source: transcript?.source,
        processing_status: aiInsights ? 'processed' : 'transcript_fetched',
        processed_at: aiInsights ? new Date().toISOString() : null,
        content_type: aiInsights?.content_type,
        summary: aiInsights?.summary,
        one_line_take: aiInsights?.one_line_take,
        key_points: aiInsights?.key_points || [],
        pros_mentioned: aiInsights?.pros_mentioned || [],
        cons_mentioned: aiInsights?.cons_mentioned || [],
        notable_quotes: aiInsights?.notable_quotes || [],
        quality_score: aiInsights?.quality_score,
        updated_at: new Date().toISOString(),
      })
      .eq('video_id', videoId)
      .select()
      .single();
    
    if (error) throw new Error(`Update error: ${error.message}`);
    videoRecord = data;
    log(`  Updated existing video record`);
  } else {
    // Insert new video
    const { data, error } = await supabase
      .from('youtube_videos')
      .insert({
        video_id: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: metadata?.title || `Video ${videoId}`,
        channel_name: metadata?.channel_name || 'Unknown',
        thumbnail_url: metadata?.thumbnail_url,
        transcript_text: transcript?.text,
        transcript_language: transcript?.language || 'en',
        transcript_source: transcript?.source,
        processing_status: aiInsights ? 'processed' : 'transcript_fetched',
        processed_at: aiInsights ? new Date().toISOString() : null,
        content_type: aiInsights?.content_type,
        summary: aiInsights?.summary,
        one_line_take: aiInsights?.one_line_take,
        key_points: aiInsights?.key_points || [],
        pros_mentioned: aiInsights?.pros_mentioned || [],
        cons_mentioned: aiInsights?.cons_mentioned || [],
        notable_quotes: aiInsights?.notable_quotes || [],
        quality_score: aiInsights?.quality_score,
      })
      .select()
      .single();
    
    if (error) throw new Error(`Insert error: ${error.message}`);
    videoRecord = data;
    log(`  Created new video record`);
  }
  
  // Get car ID
  const { data: car } = await supabase
    .from('cars')
    .select('id')
    .eq('slug', carSlug)
    .single();
  
  if (!car) {
    throw new Error(`Car not found: ${carSlug}`);
  }
  
  // Check if link already exists
  const { data: existingLink } = await supabase
    .from('youtube_video_car_links')
    .select('id')
    .eq('video_id', videoId)
    .eq('car_slug', carSlug)
    .single();
  
  if (!existingLink) {
    // Create video-car link
    const { error: linkError } = await supabase
      .from('youtube_video_car_links')
      .insert({
        video_id: videoId,
        car_id: car.id,
        car_slug: carSlug,
        role: 'primary',
        match_confidence: 1.0,
        match_method: 'manual',
        overall_sentiment: aiInsights?.sentiment_overall,
        sentiment_sound: aiInsights?.sentiment_sound,
        sentiment_track: aiInsights?.sentiment_track,
        sentiment_reliability: aiInsights?.sentiment_reliability,
        sentiment_value: aiInsights?.sentiment_value,
        sentiment_driver_fun: aiInsights?.sentiment_driver_fun,
      });
    
    if (linkError) {
      log(`  Warning: Could not create car link: ${linkError.message}`);
    } else {
      log(`  ✅ Linked video to ${carSlug}`);
    }
  } else {
    log(`  Link already exists`);
  }
  
  return videoRecord;
}

/**
 * Process a single video
 */
async function processVideo(url, carSlug, carName) {
  const videoId = extractVideoId(url);
  if (!videoId) {
    log(`  ❌ Invalid YouTube URL: ${url}`);
    return null;
  }
  
  log(`Processing video: ${videoId}`);
  
  try {
    // Get metadata
    const metadata = await fetchVideoMetadata(videoId);
    if (metadata) {
      log(`  Title: ${metadata.title}`);
      log(`  Channel: ${metadata.channel_name}`);
    }
    
    // Fetch transcript
    let transcript = null;
    try {
      transcript = await fetchTranscript(videoId);
      if (transcript) {
        log(`  ✅ Transcript: ${transcript.text.length} chars`);
      }
    } catch (err) {
      log(`  ⚠️ No transcript: ${err.message}`);
    }
    
    // AI processing
    let aiInsights = null;
    if (transcript?.text && anthropic) {
      aiInsights = await processTranscriptWithAI(transcript.text, carName);
      if (aiInsights) {
        log(`  ✅ AI processed: ${aiInsights.content_type}, quality=${aiInsights.quality_score?.toFixed(2)}`);
      }
    }
    
    // Save to database
    const record = await addVideoToDatabase(videoId, metadata, transcript, aiInsights, carSlug);
    
    return record;
  } catch (err) {
    log(`  ❌ Error: ${err.message}`);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('');
  console.log('🎬 YouTube Video Addition');
  console.log('=========================');
  console.log(`Car: ${carSlug}`);
  console.log(`Videos: ${videoUrls.length}`);
  console.log('');
  
  // Get car name
  const { data: car } = await supabase
    .from('cars')
    .select('name')
    .eq('slug', carSlug)
    .single();
  
  if (!car) {
    console.error(`❌ Car not found: ${carSlug}`);
    process.exit(1);
  }
  
  const carName = car.name;
  log(`Found car: ${carName}`);
  console.log('');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const url of videoUrls) {
    const result = await processVideo(url, carSlug, carName);
    if (result) {
      successCount++;
    } else {
      failCount++;
    }
    console.log('');
  }
  
  console.log('=========================');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  
  // Show updated count
  const { data: links } = await supabase
    .from('youtube_video_car_links')
    .select('id')
    .eq('car_slug', carSlug);
  
  console.log(`📹 Total videos for ${carSlug}: ${links?.length || 0}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

