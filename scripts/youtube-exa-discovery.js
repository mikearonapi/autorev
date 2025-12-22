#!/usr/bin/env node

/**
 * YouTube Video Discovery via Exa + Supadata
 * 
 * Alternative to YouTube Data API that avoids quota limits:
 * 1. Exa Search - Find YouTube video URLs by searching web
 * 2. Supadata API - Fetch transcripts for discovered videos
 * 3. AI Processing - Extract insights from transcripts
 * 
 * This is the RECOMMENDED approach when YouTube API quota is exceeded.
 * 
 * Usage:
 *   node scripts/youtube-exa-discovery.js --car-slug mclaren-720s [options]
 * 
 * Options:
 *   --car-slug <slug>     Process a specific car (required)
 *   --dry-run             Don't write to database, just log discoveries
 *   --verbose             Enable verbose logging
 *   --limit <n>           Limit number of videos to process (default: 5)
 * 
 * Environment Variables:
 *   EXA_API_KEY           Required: Exa API key for video discovery
 *   SUPADATA_API_KEY      Required: Supadata API key for transcripts
 *   ANTHROPIC_API_KEY     Required: For AI processing of transcripts
 *   SUPABASE_URL          Required: Supabase project URL
 *   SUPABASE_SERVICE_KEY  Required: Supabase service role key
 * 
 * @module scripts/youtube-exa-discovery
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// Configuration
// ============================================================================

const EXA_API_KEY = process.env.EXA_API_KEY;
const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  carSlug: null,
  dryRun: false,
  verbose: false,
  limit: 5
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--car-slug':
      options.carSlug = args[++i];
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--verbose':
      options.verbose = true;
      break;
    case '--limit':
      options.limit = parseInt(args[++i], 10);
      break;
  }
}

// Logging helpers
const log = (...args) => console.log('[exa-discovery]', ...args);
const logVerbose = (...args) => options.verbose && console.log('[exa-discovery:verbose]', ...args);
const logError = (...args) => console.error('[exa-discovery:error]', ...args);

// ============================================================================
// Exa Search for YouTube Videos
// ============================================================================

/**
 * Search for YouTube review videos using Exa
 * @param {string} carName - Full car name for search
 * @returns {Promise<Array>} Array of video objects with id, url, title
 */
async function searchYouTubeVideosWithExa(carName) {
  if (!EXA_API_KEY) {
    throw new Error('EXA_API_KEY not configured');
  }

  log(`Searching for "${carName}" review videos via Exa...`);

  // Multiple search queries for better coverage
  const searchQueries = [
    `site:youtube.com "${carName}" review`,
    `site:youtube.com "${carName}" buyer's guide`,
    `site:youtube.com "${carName}" POV drive test`,
  ];

  const allVideos = new Map(); // Use Map to dedupe by video ID

  for (const query of searchQueries) {
    try {
      logVerbose(`  Query: ${query}`);
      
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': EXA_API_KEY
        },
        body: JSON.stringify({
          query: query,
          numResults: 10,
          type: 'keyword',
          includeDomains: ['youtube.com'],
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logVerbose(`  Exa search failed for "${query}": ${response.status} - ${errorText}`);
        continue;
      }

      const data = await response.json();
      const results = data.results || [];
      
      logVerbose(`  Found ${results.length} results`);

      // Extract video info from URLs
      for (const result of results) {
        if (!result.url) continue;
        
        // Parse YouTube URL for video ID
        const videoIdMatch = result.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        if (!videoIdMatch) continue;
        
        const videoId = videoIdMatch[1];
        
        // Skip if already found
        if (allVideos.has(videoId)) continue;

        allVideos.set(videoId, {
          videoId,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          title: result.title || 'Unknown Title',
          snippet: result.text || result.snippet || '',
        });
      }

      // Small delay between searches
      await new Promise(r => setTimeout(r, 200));

    } catch (err) {
      logVerbose(`  Search error: ${err.message}`);
    }
  }

  const videos = Array.from(allVideos.values());
  log(`Found ${videos.length} unique videos via Exa`);
  
  return videos;
}

// ============================================================================
// Supadata Transcript Fetching
// ============================================================================

/**
 * Fetch transcript for a YouTube video using Supadata API
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object|null>} Transcript data or null if unavailable
 */
async function fetchTranscriptViaSupadata(videoId) {
  if (!SUPADATA_API_KEY) {
    throw new Error('SUPADATA_API_KEY not configured');
  }

  const url = `https://api.supadata.ai/v1/transcript?url=https://www.youtube.com/watch?v=${videoId}`;
  
  logVerbose(`  Fetching transcript for ${videoId}...`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': SUPADATA_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logVerbose(`  Supadata failed: ${response.status} - ${errorText}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.content || data.content.length === 0) {
      logVerbose(`  Empty transcript returned`);
      return null;
    }

    // Convert Supadata format to our standard format
    const segments = data.content.map(item => ({
      start: (item.offset || 0) / 1000, // Convert ms to seconds
      duration: (item.duration || 0) / 1000,
      text: item.text || ''
    }));

    const fullText = segments.map(s => s.text).join(' ');

    return {
      text: fullText,
      segments,
      language: data.lang || 'en',
      source: 'supadata_api',
      charCount: fullText.length
    };
  } catch (err) {
    logVerbose(`  Transcript error: ${err.message}`);
    return null;
  }
}

// ============================================================================
// AI Processing of Transcripts
// ============================================================================

/**
 * Process video transcript with AI to extract car-specific insights
 * @param {string} transcript - Full transcript text
 * @param {string} carName - Car name for context
 * @param {string} videoTitle - Video title for context
 * @returns {Promise<Object>} Extracted insights
 */
async function processTranscriptWithAI(transcript, carName, videoTitle) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  // Truncate transcript if too long (Claude has context limits)
  const maxChars = 30000;
  const truncatedTranscript = transcript.length > maxChars 
    ? transcript.substring(0, maxChars) + '...[truncated]'
    : transcript;

  const prompt = `You are an automotive analyst extracting insights from a video review about the ${carName}.

VIDEO TITLE: ${videoTitle}

TRANSCRIPT:
${truncatedTranscript}

Extract the following information as JSON. Be specific and quote key phrases when possible:

{
  "is_relevant": true/false,
  "relevance_confidence": 0.0-1.0,
  "content_type": "review|comparison|pov_drive|track_test|buying_guide|ownership_update|other",
  "overall_sentiment": "positive|negative|mixed|neutral",
  "pros_mentioned": ["specific pro 1", "specific pro 2"],
  "cons_mentioned": ["specific con 1", "specific con 2"],
  "key_points": ["important point 1", "important point 2"],
  "comparisons_mentioned": ["competitor car 1", "competitor car 2"],
  "price_mentions": "any price discussion or values mentioned",
  "reliability_mentions": "any reliability issues or praise mentioned",
  "track_performance_mentions": "any track testing or lap time discussion",
  "recommended_for": "who the reviewer recommends this car for",
  "notable_quotes": ["memorable quote 1", "memorable quote 2"]
}

RULES:
- is_relevant should be true only if the video is actually about the ${carName}
- Be specific - don't generalize, use actual mentions from the transcript
- pros_mentioned and cons_mentioned should be actual things said in the video
- Return ONLY valid JSON, no additional text`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logVerbose(`  AI returned no JSON`);
      return null;
    }

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    logVerbose(`  AI processing error: ${err.message}`);
    return null;
  }
}

// ============================================================================
// Content Type Detection
// ============================================================================

/**
 * Determine content type from video metadata
 * @param {string} title - Video title
 * @param {string} transcript - Transcript text (first portion)
 * @returns {string} Content type
 */
function detectContentType(title, transcript = '') {
  const combined = `${title} ${transcript.substring(0, 500)}`.toLowerCase();

  if (combined.includes('drag race') || combined.includes('0-60') || combined.includes('0 to 60')) {
    return 'drag_race';
  }
  if (combined.includes('track test') || combined.includes('lap time') || combined.includes('nurburgring') || combined.includes('circuit')) {
    return 'track_test';
  }
  if (combined.includes('pov') || combined.includes('point of view') || combined.includes('driver view')) {
    return 'pov_drive';
  }
  if (combined.includes(' vs ') || combined.includes('comparison') || combined.includes('head to head') || combined.includes('versus')) {
    return 'comparison';
  }
  if (combined.includes('buying') || combined.includes('should you buy') || combined.includes("buyer's guide") || combined.includes('worth it')) {
    return 'buying_guide';
  }
  if (combined.includes('long term') || combined.includes('ownership') || combined.includes('year update') || combined.includes('6 months')) {
    return 'ownership_update';
  }
  if (combined.includes('review')) {
    return 'review';
  }

  return 'review'; // Default
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Save video and link to car in database
 */
async function saveVideoToDatabase(supabase, video, carSlug, transcript, aiInsights) {
  // Check if video already exists
  const { data: existing } = await supabase
    .from('youtube_videos')
    .select('video_id')
    .eq('video_id', video.videoId)
    .single();

  if (existing) {
    logVerbose(`  Video ${video.videoId} already exists, updating...`);
  }

  const contentType = detectContentType(video.title, transcript?.text || '');

  // Build summary from AI insights
  let summary = null;
  if (aiInsights) {
    const sentimentText = aiInsights.overall_sentiment ? `Overall sentiment: ${aiInsights.overall_sentiment}. ` : '';
    const recommendedText = aiInsights.recommended_for ? `Recommended for: ${aiInsights.recommended_for}` : '';
    summary = `${sentimentText}${recommendedText}`.trim() || null;
  }

  // Upsert video record - use only columns that exist in the schema
  const videoRecord = {
    video_id: video.videoId,
    url: video.url,
    title: video.title,
    thumbnail_url: `https://i.ytimg.com/vi/${video.videoId}/maxresdefault.jpg`,
    transcript_text: transcript?.text || null,
    transcript_language: transcript?.language || null,
    transcript_source: transcript?.source || null,
    content_type: contentType,
    processing_status: aiInsights ? 'processed' : (transcript ? 'transcript_fetched' : 'pending'),
    // AI insights - matching actual schema columns
    summary: summary,
    pros_mentioned: aiInsights?.pros_mentioned || null,
    cons_mentioned: aiInsights?.cons_mentioned || null,
    key_points: aiInsights?.key_points || null,
    comparisons: aiInsights?.comparisons_mentioned || null,
    notable_quotes: aiInsights?.notable_quotes || null,
  };

  const { error: videoError } = await supabase
    .from('youtube_videos')
    .upsert(videoRecord, { onConflict: 'video_id' });

  if (videoError) {
    logError(`  Failed to save video: ${videoError.message}`);
    return false;
  }

  // Upsert car link
  const linkRecord = {
    video_id: video.videoId,
    car_slug: carSlug,
    role: contentType === 'comparison' ? 'comparison' : 'primary',
    match_confidence: aiInsights?.relevance_confidence || 0.7,
    match_method: 'description_match'
  };

  const { error: linkError } = await supabase
    .from('youtube_video_car_links')
    .upsert(linkRecord, { onConflict: 'video_id,car_slug' });

  if (linkError) {
    logError(`  Failed to link video to car: ${linkError.message}`);
    return false;
  }

  return true;
}

// ============================================================================
// Main Discovery Process
// ============================================================================

async function main() {
  log('========================================');
  log('YouTube Discovery via Exa + Supadata');
  log('========================================');
  log('Options:', JSON.stringify(options, null, 2));

  // Validate configuration
  if (!options.carSlug) {
    logError('--car-slug is required');
    console.log('Usage: node scripts/youtube-exa-discovery.js --car-slug mclaren-720s');
    process.exit(1);
  }

  if (!EXA_API_KEY) {
    logError('EXA_API_KEY environment variable is required');
    process.exit(1);
  }

  if (!SUPADATA_API_KEY) {
    logError('SUPADATA_API_KEY environment variable is required');
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

  // Fetch car info
  let carName = options.carSlug.replace(/-/g, ' ');
  
  if (!options.dryRun) {
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('name, brand, years')
      .eq('slug', options.carSlug)
      .single();

    if (carError || !car) {
      logError(`Car not found: ${options.carSlug}`);
      process.exit(1);
    }

    carName = car.name;
    log(`Processing: ${carName} (${car.years})`);
  } else {
    log(`Processing: ${carName} (dry run)`);
  }

  // Track statistics
  const stats = {
    videosFound: 0,
    transcriptsFetched: 0,
    aiProcessed: 0,
    videosSaved: 0,
    errors: 0
  };

  // Step 1: Search for videos with Exa
  const videos = await searchYouTubeVideosWithExa(carName);
  stats.videosFound = videos.length;

  if (videos.length === 0) {
    log('No videos found. Try different search terms.');
    process.exit(0);
  }

  // Limit videos to process
  const videosToProcess = videos.slice(0, options.limit);
  log(`Processing ${videosToProcess.length} of ${videos.length} videos...`);

  // Step 2: Process each video
  for (let i = 0; i < videosToProcess.length; i++) {
    const video = videosToProcess[i];
    log(`\n[${i + 1}/${videosToProcess.length}] ${video.title.substring(0, 60)}...`);
    log(`  URL: ${video.url}`);

    // Fetch transcript
    const transcript = await fetchTranscriptViaSupadata(video.videoId);
    
    if (transcript) {
      stats.transcriptsFetched++;
      log(`  ✓ Transcript: ${transcript.charCount} chars`);
    } else {
      log(`  ✗ No transcript available`);
    }

    // AI processing (only if transcript available and API key set)
    let aiInsights = null;
    if (transcript && ANTHROPIC_API_KEY) {
      log(`  🤖 Processing with AI...`);
      aiInsights = await processTranscriptWithAI(transcript.text, carName, video.title);
      
      if (aiInsights) {
        stats.aiProcessed++;
        
        if (!aiInsights.is_relevant || aiInsights.relevance_confidence < 0.5) {
          log(`  ⚠️ Low relevance (${aiInsights.relevance_confidence?.toFixed(2) || 'unknown'}) - may not be about ${carName}`);
        } else {
          const prosCount = aiInsights.pros_mentioned?.length || 0;
          const consCount = aiInsights.cons_mentioned?.length || 0;
          log(`  ✓ AI: ${prosCount} pros, ${consCount} cons, sentiment: ${aiInsights.overall_sentiment}`);
        }
      }
    }

    // Save to database
    if (!options.dryRun) {
      const saved = await saveVideoToDatabase(supabase, video, options.carSlug, transcript, aiInsights);
      if (saved) {
        stats.videosSaved++;
        log(`  ✓ Saved to database`);
      } else {
        stats.errors++;
      }
    } else {
      log(`  [DRY RUN] Would save video`);
      stats.videosSaved++;
    }

    // Rate limiting between videos
    await new Promise(r => setTimeout(r, 500));
  }

  // Print summary
  log('\n========================================');
  log('Discovery Complete');
  log('========================================');
  log(`Videos found:       ${stats.videosFound}`);
  log(`Transcripts:        ${stats.transcriptsFetched}`);
  log(`AI processed:       ${stats.aiProcessed}`);
  log(`Videos saved:       ${stats.videosSaved}`);
  log(`Errors:             ${stats.errors}`);

  if (options.dryRun) {
    log('\n[DRY RUN] No changes were made to the database');
  }

  // Return stats for programmatic use
  return stats;
}

// Export for use in other scripts
export { searchYouTubeVideosWithExa, fetchTranscriptViaSupadata, processTranscriptWithAI };

// Run if called directly
main().catch(error => {
  logError('Fatal error:', error);
  process.exit(1);
});

