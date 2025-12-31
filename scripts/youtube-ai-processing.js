#!/usr/bin/env node

/**
 * YouTube AI Processing Pipeline
 * 
 * Processes video transcripts using AI to extract:
 * - Summaries and one-line verdicts
 * - Key points, pros, and cons
 * - Notable quotes with timestamps
 * - Car comparisons and sentiments
 * - Stock strength/weakness tags
 * 
 * Updates youtube_videos and youtube_video_car_links tables.
 * 
 * Usage:
 *   node scripts/youtube-ai-processing.js [options]
 * 
 * Options:
 *   --video-id <id>       Process a specific video only
 *   --limit <n>           Limit number of videos to process (default: 10)
 *   --dry-run             Don't write to database, just log outputs
 *   --verbose             Enable verbose logging
 *   --model <name>        AI model to use (default: claude-sonnet-4-20250514)
 * 
 * Environment Variables:
 *   ANTHROPIC_API_KEY     Required: Anthropic API key for Claude
 *   SUPABASE_URL          Required: Supabase project URL
 *   SUPABASE_SERVICE_KEY  Required: Supabase service role key
 * 
 * @module scripts/youtube-ai-processing
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import { trackBackendAiUsage, AI_PURPOSES, AI_SOURCES } from '../lib/backendAiLogger.js';

// ============================================================================
// Configuration
// ============================================================================

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  videoId: null,
  limit: 10,
  dryRun: false,
  verbose: false,
  model: 'claude-sonnet-4-20250514'
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--video-id':
      options.videoId = args[++i];
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
    case '--model':
      options.model = args[++i];
      break;
  }
}

// Logging helpers
const log = (...args) => console.log('[ai-process]', ...args);
const logVerbose = (...args) => options.verbose && console.log('[ai-process:verbose]', ...args);
const logError = (...args) => console.error('[ai-process:error]', ...args);

// ============================================================================
// AI Processing
// ============================================================================

/**
 * Call Claude API with a prompt
 * @param {string} systemPrompt - System prompt
 * @param {string} userPrompt - User prompt
 * @param {string} [entityId] - Entity ID for tracking (e.g., video_id)
 * @returns {Promise<string>} AI response text
 */
async function callClaude(systemPrompt, userPrompt, entityId = null) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Claude API error: ${response.status} - ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  
  // Track AI usage for cost analytics
  if (data.usage) {
    await trackBackendAiUsage({
      purpose: AI_PURPOSES.YOUTUBE_PROCESSING,
      scriptName: 'youtube-ai-processing',
      inputTokens: data.usage.input_tokens || 0,
      outputTokens: data.usage.output_tokens || 0,
      model: options.model,
      entityId,
      source: AI_SOURCES.BACKEND_SCRIPT,
    });
  }
  
  return data.content?.[0]?.text || '';
}

/**
 * Extract JSON from AI response (handles markdown code blocks)
 * @param {string} text - AI response text
 * @returns {Object} Parsed JSON
 */
function extractJson(text) {
  // Try to find JSON in markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1].trim());
  }
  
  // Try to parse as raw JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  throw new Error('No valid JSON found in response');
}

/**
 * Chunk transcript into manageable pieces for AI processing
 * @param {string} transcript - Full transcript text
 * @param {number} maxChunkSize - Maximum characters per chunk
 * @returns {string[]} Array of chunks
 */
function chunkTranscript(transcript, maxChunkSize = 12000) {
  if (transcript.length <= maxChunkSize) {
    return [transcript];
  }

  const chunks = [];
  const sentences = transcript.split(/(?<=[.!?])\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// ============================================================================
// Extraction Prompts
// ============================================================================

const SYSTEM_PROMPT = `You are an expert automotive journalist and analyst. You're analyzing YouTube video transcripts about cars to extract structured data for a sports car advisory platform.

Be precise and factual. Only extract information that is explicitly stated or strongly implied in the transcript. Use the exact terminology from the transcript where possible.

Always respond with valid JSON matching the requested schema. Do not include any text outside the JSON.`;

/**
 * Generate the main extraction prompt
 * @param {string} videoTitle - Video title
 * @param {string} channelName - Channel name
 * @param {string} transcript - Video transcript
 * @param {string[]} knownCarSlugs - List of known car slugs for matching
 * @returns {string} Extraction prompt
 */
function buildExtractionPrompt(videoTitle, channelName, transcript, knownCarSlugs) {
  return `Analyze this YouTube video transcript and extract structured data.

VIDEO: "${videoTitle}"
CHANNEL: ${channelName}

TRANSCRIPT:
${transcript}

KNOWN CARS IN OUR DATABASE (use these slugs for matching):
${knownCarSlugs.join(', ')}

Extract and return a JSON object with this structure:

{
  "summary": "A 2-4 paragraph summary of the video's key content and conclusions",
  "oneLineTake": "A single sentence summarizing the reviewer's verdict",
  
  "primaryCarSlug": "The main car being reviewed (from known cars list, or null if not in list)",
  "primaryCarName": "The full name of the primary car as mentioned",
  
  "keyPoints": [
    {
      "category": "sound|interior|track|reliability|value|driverFun|aftermarket|general",
      "theme": "Brief theme (e.g., 'engine character', 'handling feel')",
      "text": "The key point text",
      "sentiment": -1.0 to 1.0 (negative to positive),
      "importance": 1-5
    }
  ],
  
  "prosMentioned": [
    {
      "text": "The positive point",
      "strength": 1-5
    }
  ],
  
  "consMentioned": [
    {
      "text": "The negative point",
      "strength": 1-5
    }
  ],
  
  "notableQuotes": [
    {
      "quote": "The exact or near-exact quote",
      "speaker": "Name if mentioned, or 'Host'",
      "theme": "What the quote is about",
      "sentiment": -1.0 to 1.0
    }
  ],
  
  "comparisons": [
    {
      "otherCarName": "Name of compared car",
      "otherCarSlug": "Slug if in known cars list, or null",
      "verdict": "Which car was preferred and why",
      "context": "track|daily|value|overall"
    }
  ],
  
  "stockStrengths": ["steering", "brakes", "chassis", "cooling", "power", "sound", "interior", "tech", "value", "reliability"],
  "stockWeaknesses": ["steering", "brakes", "chassis", "cooling", "power", "sound", "interior", "tech", "value", "reliability"],
  
  "usageContext": ["track", "canyon", "commute", "roadtrip", "highway", "city"],
  "driverProfile": "Description of ideal owner based on video content",
  
  "categorySentiments": {
    "sound": -1.0 to 1.0 or null if not discussed,
    "interior": -1.0 to 1.0 or null,
    "track": -1.0 to 1.0 or null,
    "reliability": -1.0 to 1.0 or null,
    "value": -1.0 to 1.0 or null,
    "driverFun": -1.0 to 1.0 or null,
    "aftermarket": -1.0 to 1.0 or null
  }
}

Only include stockStrengths and stockWeaknesses that are explicitly praised or criticized.
Only include usageContext categories that are explicitly discussed.
For comparisons, only include cars that are directly compared, not just mentioned.
For quotes, choose the most impactful and quotable statements.

Respond with ONLY the JSON object, no other text.`;
}

// ============================================================================
// Main Processing
// ============================================================================

/**
 * Process a single video's transcript
 * @param {Object} video - Video record from database
 * @param {string[]} knownCarSlugs - List of known car slugs
 * @param {Object} supabase - Supabase client
 * @returns {Promise<Object>} Processing result
 */
async function processVideo(video, knownCarSlugs, supabase) {
  const { video_id, title, channel_name, transcript_text } = video;

  log(`Processing: ${video_id} - "${title?.slice(0, 50)}..."`);

  // Chunk the transcript if needed
  const chunks = chunkTranscript(transcript_text);
  logVerbose(`  Transcript: ${transcript_text.length} chars, ${chunks.length} chunk(s)`);

  // For now, process only first chunk (most videos fit)
  // TODO: Implement multi-chunk processing with aggregation
  const transcriptToProcess = chunks[0];

  try {
    // Call AI for extraction
    const prompt = buildExtractionPrompt(title, channel_name, transcriptToProcess, knownCarSlugs);
    const response = await callClaude(SYSTEM_PROMPT, prompt, video_id);
    
    logVerbose(`  AI response length: ${response.length} chars`);

    // Parse JSON response
    const extracted = extractJson(response);
    
    log(`  ✓ Extracted: ${extracted.prosMentioned?.length || 0} pros, ${extracted.consMentioned?.length || 0} cons, ${extracted.notableQuotes?.length || 0} quotes`);

    if (options.verbose) {
      log(`  Summary preview: "${extracted.summary?.slice(0, 100)}..."`);
      log(`  One-line: "${extracted.oneLineTake}"`);
    }

    return {
      success: true,
      data: extracted
    };

  } catch (error) {
    logError(`  AI processing failed:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Calculate quality score based on extraction results
 * @param {Object} extracted - Extracted data
 * @returns {number} Quality score 0-1
 */
function calculateQualityScore(extracted) {
  let score = 0.5; // Base score

  // Summary quality
  if (extracted.summary && extracted.summary.length > 200) score += 0.1;
  if (extracted.oneLineTake) score += 0.05;

  // Content depth
  if (extracted.prosMentioned?.length >= 2) score += 0.1;
  if (extracted.consMentioned?.length >= 1) score += 0.05;
  if (extracted.notableQuotes?.length >= 1) score += 0.1;
  if (extracted.keyPoints?.length >= 3) score += 0.1;

  // Car matching
  if (extracted.primaryCarSlug) score += 0.1;

  return Math.min(1.0, score);
}

async function main() {
  log('Starting YouTube AI processing pipeline...');
  log('Options:', options);

  // Validate configuration
  if (!ANTHROPIC_API_KEY) {
    logError('ANTHROPIC_API_KEY environment variable is required');
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

  // Fetch known car slugs for matching
  log('Fetching known car slugs...');
  let knownCarSlugs = [];

  if (options.dryRun) {
    knownCarSlugs = [
      '718-cayman-gt4', '718-cayman-gts-40', 'c8-corvette-stingray',
      'c7-corvette-z06', 'shelby-gt350', 'bmw-m2-competition',
      'nissan-gt-r', 'audi-r8-v10', 'porsche-911-gt3'
    ];
  } else {
    const { data: cars } = await supabase
      .from('cars')
      .select('slug, name');
    
    knownCarSlugs = cars?.map(c => c.slug) || [];
  }

  log(`Found ${knownCarSlugs.length} known car slugs`);

  // Fetch videos with transcripts needing AI processing
  log('Fetching videos with transcripts...');
  let videos = [];

  if (options.dryRun) {
    videos = [{
      video_id: 'test123',
      title: 'Porsche 718 Cayman GT4 Review - The Best Sports Car?',
      channel_name: 'Throttle House',
      transcript_text: `Today we're testing the Porsche 718 Cayman GT4. This is the car that enthusiasts have been waiting for. The 4.0 liter naturally aspirated flat six produces 414 horsepower and sounds absolutely incredible. The steering feel is telepathic, and the chassis balance is perfect. On track, this thing is an absolute weapon. The brakes could be better for repeated heavy use, but for a street car this is near perfection. If I had to pick one car to drive every day on mountain roads, this would be it. It's simply the best driver's car Porsche makes right now.`
    }];

    if (options.videoId) {
      videos[0].video_id = options.videoId;
    }
  } else {
    let query = supabase
      .from('youtube_videos')
      .select('video_id, title, channel_name, transcript_text')
      .eq('processing_status', 'transcript_fetched')
      .not('transcript_text', 'is', null)
      .order('created_at', { ascending: true })
      .limit(options.limit);

    if (options.videoId) {
      query = supabase
        .from('youtube_videos')
        .select('video_id, title, channel_name, transcript_text')
        .eq('video_id', options.videoId);
    }

    const { data, error } = await query;
    if (error) {
      logError('Failed to fetch videos:', error);
      process.exit(1);
    }
    videos = data || [];
  }

  log(`Found ${videos.length} videos to process`);

  if (videos.length === 0) {
    log('No videos need AI processing. Exiting.');
    return;
  }

  // Track statistics
  const stats = {
    processed: 0,
    success: 0,
    errors: 0
  };

  // Process each video
  for (const video of videos) {
    stats.processed++;

    const result = await processVideo(video, knownCarSlugs, supabase);

    if (!result.success) {
      stats.errors++;

      if (!options.dryRun) {
        await supabase
          .from('youtube_videos')
          .update({
            processing_status: 'failed',
            processing_error: result.error
          })
          .eq('video_id', video.video_id);
      }
      continue;
    }

    stats.success++;
    const extracted = result.data;
    const qualityScore = calculateQualityScore(extracted);

    if (options.dryRun) {
      log(`  [DRY RUN] Would save:`);
      log(`    - Summary: ${extracted.summary?.length || 0} chars`);
      log(`    - Pros: ${extracted.prosMentioned?.length || 0}`);
      log(`    - Cons: ${extracted.consMentioned?.length || 0}`);
      log(`    - Quotes: ${extracted.notableQuotes?.length || 0}`);
      log(`    - Quality score: ${qualityScore.toFixed(2)}`);
      log(`    - Primary car: ${extracted.primaryCarSlug || 'none'}`);
    } else {
      try {
        // Update youtube_videos with AI outputs
        const videoUpdate = {
          summary: extracted.summary,
          one_line_take: extracted.oneLineTake,
          key_points: extracted.keyPoints,
          pros_mentioned: extracted.prosMentioned,
          cons_mentioned: extracted.consMentioned,
          notable_quotes: extracted.notableQuotes,
          comparisons: extracted.comparisons,
          stock_strengths: extracted.stockStrengths?.map(tag => ({ tag, mentions: 1 })),
          stock_weaknesses: extracted.stockWeaknesses?.map(tag => ({ tag, mentions: 1 })),
          usage_context: extracted.usageContext,
          driver_profile: extracted.driverProfile,
          processing_status: 'processed',
          processed_at: new Date().toISOString(),
          processing_model: options.model,
          quality_score: qualityScore
        };

        const { error: videoError } = await supabase
          .from('youtube_videos')
          .update(videoUpdate)
          .eq('video_id', video.video_id);

        if (videoError) {
          throw new Error(`Failed to update video: ${videoError.message}`);
        }

        // Update car links with sentiments
        if (extracted.primaryCarSlug && extracted.categorySentiments) {
          const linkUpdate = {
            sentiment_sound: extracted.categorySentiments.sound,
            sentiment_interior: extracted.categorySentiments.interior,
            sentiment_track: extracted.categorySentiments.track,
            sentiment_reliability: extracted.categorySentiments.reliability,
            sentiment_value: extracted.categorySentiments.value,
            sentiment_driver_fun: extracted.categorySentiments.driverFun,
            sentiment_aftermarket: extracted.categorySentiments.aftermarket,
            overall_sentiment: extracted.categorySentiments.overall || 
              calculateOverallSentiment(extracted.categorySentiments),
            stock_strength_tags: extracted.stockStrengths || [],
            stock_weakness_tags: extracted.stockWeaknesses || [],
            usage_context_tags: extracted.usageContext || []
          };

          // Also add compared car slugs if any
          if (extracted.comparisons?.length > 0) {
            linkUpdate.compared_to_slugs = extracted.comparisons
              .filter(c => c.otherCarSlug)
              .map(c => c.otherCarSlug);
          }

          await supabase
            .from('youtube_video_car_links')
            .update(linkUpdate)
            .eq('video_id', video.video_id)
            .eq('car_slug', extracted.primaryCarSlug);
        }

        // Add links for comparison cars
        for (const comparison of (extracted.comparisons || [])) {
          if (comparison.otherCarSlug && knownCarSlugs.includes(comparison.otherCarSlug)) {
            await supabase
              .from('youtube_video_car_links')
              .upsert({
                video_id: video.video_id,
                car_slug: comparison.otherCarSlug,
                role: 'comparison',
                match_confidence: 0.8,
                match_method: 'transcript_extract',
                comparison_verdict: comparison.verdict,
                comparison_context: comparison.context
              }, { onConflict: 'video_id,car_slug' });
          }
        }

        log(`  ✓ Saved to database (quality: ${qualityScore.toFixed(2)})`);

      } catch (error) {
        logError(`  Database save failed:`, error.message);
        stats.errors++;
      }
    }

    // Rate limiting - 2 seconds between AI calls
    await new Promise(r => setTimeout(r, 2000));
  }

  // Print summary
  log('\n========================================');
  log('AI Processing Pipeline Complete');
  log('========================================');
  log(`Processed:  ${stats.processed}`);
  log(`Success:    ${stats.success}`);
  log(`Errors:     ${stats.errors}`);

  if (options.dryRun) {
    log('\n[DRY RUN] No changes were made to the database');
  }
}

/**
 * Calculate overall sentiment from category sentiments
 * @param {Object} sentiments - Category sentiment object
 * @returns {number} Overall sentiment -1 to 1
 */
function calculateOverallSentiment(sentiments) {
  const values = Object.values(sentiments).filter(v => v !== null && v !== undefined);
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Run
main().catch(error => {
  logError('Fatal error:', error);
  process.exit(1);
});

