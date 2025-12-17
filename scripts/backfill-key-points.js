#!/usr/bin/env node

/**
 * Backfill key_points for YouTube videos
 * 
 * Processes videos that have transcripts but empty key_points.
 * Uses Claude to extract structured key points from transcripts.
 * 
 * Usage:
 *   node scripts/backfill-key-points.js [options]
 * 
 * Options:
 *   --dry-run     Preview without saving (default: false)
 *   --limit N     Process at most N videos (default: all)
 *   --batch N     Batch size for processing (default: 5)
 *   --delay N     Delay between batches in ms (default: 2000)
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Parse CLI args
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  limit: parseInt(args.find((_, i, arr) => arr[i - 1] === '--limit') || '0') || Infinity,
  batchSize: parseInt(args.find((_, i, arr) => arr[i - 1] === '--batch') || '5'),
  delay: parseInt(args.find((_, i, arr) => arr[i - 1] === '--delay') || '2000'),
};

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-20250514';

// Key points extraction prompt
function buildPrompt(title, channelName, transcript) {
  return `Analyze this YouTube car review transcript and extract the KEY POINTS ONLY.

VIDEO: "${title}" by ${channelName}

TRANSCRIPT (first 12000 chars):
${transcript.substring(0, 12000)}

Extract 3-8 key points that represent the most important takeaways from this review.
Each key point should capture a significant opinion, fact, or observation.

Return a JSON array with this structure:
[
  {
    "category": "sound|interior|track|reliability|value|driverFun|aftermarket|general",
    "theme": "Brief theme (e.g., 'engine character', 'handling feel', 'build quality')",
    "text": "The key point text - a complete sentence summarizing the insight",
    "sentiment": -1.0 to 1.0 (negative to positive),
    "importance": 1-5 (how significant is this point)
  }
]

Guidelines:
- Include both positive and negative points if present
- Focus on substantive insights, not generic statements
- "importance" of 5 = defining characteristic, 1 = minor observation
- Match "category" to the most relevant score category
- Use "general" for cross-cutting observations

Return ONLY the JSON array, no other text.`;
}

// Extract JSON from AI response
function extractJson(text) {
  // Try direct parse first
  try {
    return JSON.parse(text.trim());
  } catch {
    // Extract JSON array from text
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Could not extract JSON from response');
  }
}

// Process a single video
async function processVideo(video) {
  const { video_id, title, channel_name, transcript_text } = video;
  
  if (!transcript_text || transcript_text.length < 100) {
    return { video_id, skipped: true, reason: 'No transcript' };
  }

  try {
    const prompt = buildPrompt(title, channel_name, transcript_text);
    
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].text;
    const keyPoints = extractJson(content);
    
    // Validate structure
    if (!Array.isArray(keyPoints)) {
      throw new Error('Response is not an array');
    }
    
    // Validate each key point has required fields
    const validKeyPoints = keyPoints.filter(kp => 
      kp.text && kp.category && typeof kp.sentiment === 'number'
    );

    return {
      video_id,
      success: true,
      keyPoints: validKeyPoints,
      count: validKeyPoints.length,
    };
  } catch (error) {
    return {
      video_id,
      success: false,
      error: error.message,
    };
  }
}

// Save key points to database
async function saveKeyPoints(videoId, keyPoints) {
  const { error } = await supabase
    .from('youtube_videos')
    .update({ 
      key_points: keyPoints,
      updated_at: new Date().toISOString()
    })
    .eq('video_id', videoId);

  if (error) {
    throw new Error(`Database update failed: ${error.message}`);
  }
}

// Sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main execution
async function main() {
  console.log('🔑 Key Points Backfill Script');
  console.log('=============================');
  console.log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Limit: ${options.limit === Infinity ? 'all' : options.limit}`);
  console.log(`Batch size: ${options.batchSize}`);
  console.log(`Delay: ${options.delay}ms\n`);

  // Fetch videos needing backfill (processed OR transcript_fetched with transcript)
  let query = supabase
    .from('youtube_videos')
    .select('video_id, title, channel_name, transcript_text')
    .in('processing_status', ['processed', 'transcript_fetched'])
    .not('transcript_text', 'is', null)
    .or('key_points.is.null,key_points.eq.[]');

  if (options.limit !== Infinity) {
    query = query.limit(options.limit);
  }

  const { data: videos, error } = await query;

  if (error) {
    console.error('❌ Failed to fetch videos:', error.message);
    process.exit(1);
  }

  console.log(`📊 Found ${videos.length} videos needing key_points backfill\n`);

  if (videos.length === 0) {
    console.log('✅ All videos already have key_points!');
    return;
  }

  const stats = {
    processed: 0,
    success: 0,
    skipped: 0,
    failed: 0,
    totalKeyPoints: 0,
  };

  // Process in batches
  for (let i = 0; i < videos.length; i += options.batchSize) {
    const batch = videos.slice(i, i + options.batchSize);
    const batchNum = Math.floor(i / options.batchSize) + 1;
    const totalBatches = Math.ceil(videos.length / options.batchSize);
    
    console.log(`\n📦 Batch ${batchNum}/${totalBatches}`);

    for (const video of batch) {
      stats.processed++;
      const result = await processVideo(video);
      
      if (result.skipped) {
        stats.skipped++;
        console.log(`  ⏭️  ${video.video_id}: Skipped (${result.reason})`);
        continue;
      }

      if (!result.success) {
        stats.failed++;
        console.log(`  ❌ ${video.video_id}: ${result.error}`);
        continue;
      }

      stats.success++;
      stats.totalKeyPoints += result.count;
      console.log(`  ✓ ${video.video_id}: ${result.count} key points`);

      if (!options.dryRun) {
        try {
          await saveKeyPoints(video.video_id, result.keyPoints);
        } catch (saveError) {
          console.log(`    ⚠️  Save failed: ${saveError.message}`);
          stats.failed++;
          stats.success--;
        }
      }
    }

    // Delay between batches (except last)
    if (i + options.batchSize < videos.length) {
      console.log(`  💤 Waiting ${options.delay}ms...`);
      await sleep(options.delay);
    }
  }

  // Summary
  console.log('\n=============================');
  console.log('📊 Summary');
  console.log('=============================');
  console.log(`Processed: ${stats.processed}`);
  console.log(`Success:   ${stats.success}`);
  console.log(`Skipped:   ${stats.skipped}`);
  console.log(`Failed:    ${stats.failed}`);
  console.log(`Total key points: ${stats.totalKeyPoints}`);
  console.log(`Avg per video: ${(stats.totalKeyPoints / stats.success).toFixed(1)}`);
  
  if (options.dryRun) {
    console.log('\n⚠️  DRY RUN - No changes were saved');
  }
}

main().catch(console.error);


