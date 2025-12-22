#!/usr/bin/env node

/**
 * YouTube Video Processing from URLs
 * 
 * Process YouTube videos directly from URLs using Supadata for transcripts.
 * This bypasses the need for YouTube API quota or Exa API key.
 * 
 * Usage:
 *   node scripts/youtube-process-from-urls.js --car-slug mclaren-720s --urls "url1,url2,url3"
 *   node scripts/youtube-process-from-urls.js --car-slug mclaren-720s --urls-file urls.txt
 * 
 * Options:
 *   --car-slug <slug>     Car to link videos to (required)
 *   --urls <urls>         Comma-separated YouTube URLs
 *   --urls-file <file>    File with URLs (one per line)
 *   --dry-run             Don't write to database
 *   --verbose             Enable verbose logging
 * 
 * Environment Variables:
 *   SUPADATA_API_KEY      Required: For fetching transcripts
 *   ANTHROPIC_API_KEY     Required: For AI processing
 *   SUPABASE_URL          Required: Database
 *   SUPABASE_SERVICE_KEY  Required: Database
 * 
 * @module scripts/youtube-process-from-urls
 */

import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// Configuration
// ============================================================================

const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  carSlug: null,
  urls: [],
  urlsFile: null,
  dryRun: false,
  verbose: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--car-slug':
      options.carSlug = args[++i];
      break;
    case '--urls':
      options.urls = args[++i].split(',').map(u => u.trim()).filter(Boolean);
      break;
    case '--urls-file':
      options.urlsFile = args[++i];
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
const log = (...args) => console.log('[youtube-urls]', ...args);
const logVerbose = (...args) => options.verbose && console.log('[youtube-urls:verbose]', ...args);
const logError = (...args) => console.error('[youtube-urls:error]', ...args);

// ============================================================================
// URL Parsing
// ============================================================================

/**
 * Extract video ID from various YouTube URL formats
 */
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/,
    /youtube\.com\/embed\/([^/?]+)/,
    /youtube\.com\/v\/([^/?]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// ============================================================================
// Supadata Transcript Fetching
// ============================================================================

/**
 * Fetch transcript using Supadata API
 */
async function fetchTranscript(videoId) {
  if (!SUPADATA_API_KEY) {
    throw new Error('SUPADATA_API_KEY not configured');
  }

  const url = `https://api.supadata.ai/v1/transcript?url=https://www.youtube.com/watch?v=${videoId}`;
  
  logVerbose(`  Fetching transcript...`);
  
  const response = await fetch(url, {
    headers: {
      'x-api-key': SUPADATA_API_KEY
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supadata API failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.content || data.content.length === 0) {
    return null;
  }

  // Convert format
  const segments = data.content.map(item => ({
    start: (item.offset || 0) / 1000,
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
}

// ============================================================================
// Video Metadata Fetching (via oEmbed - no API key needed)
// ============================================================================

/**
 * Fetch video title using oEmbed API (no API key required)
 */
async function fetchVideoMetadata(videoId) {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return { title: 'Unknown Title', author: 'Unknown' };
    }
    
    const data = await response.json();
    return {
      title: data.title || 'Unknown Title',
      author: data.author_name || 'Unknown',
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
    };
  } catch (err) {
    logVerbose(`  Could not fetch metadata: ${err.message}`);
    return { title: 'Unknown Title', author: 'Unknown' };
  }
}

// ============================================================================
// AI Processing
// ============================================================================

/**
 * Process transcript with AI to extract insights
 */
async function processWithAI(transcript, carName, videoTitle) {
  if (!ANTHROPIC_API_KEY) {
    logVerbose('  No Anthropic API key, skipping AI processing');
    return null;
  }

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  // Truncate if needed
  const maxChars = 30000;
  const truncatedTranscript = transcript.length > maxChars 
    ? transcript.substring(0, maxChars) + '...[truncated]'
    : transcript;

  const prompt = `You are an automotive analyst extracting insights from a video review about the ${carName}.

VIDEO TITLE: ${videoTitle}

TRANSCRIPT:
${truncatedTranscript}

Extract the following information as JSON:

{
  "is_relevant": true/false,
  "relevance_confidence": 0.0-1.0,
  "content_type": "review|comparison|pov_drive|track_test|buying_guide|ownership_update|other",
  "overall_sentiment": "positive|negative|mixed|neutral",
  "pros_mentioned": ["specific pro 1", "specific pro 2"],
  "cons_mentioned": ["specific con 1", "specific con 2"],
  "key_points": ["important point 1", "important point 2"],
  "comparisons_mentioned": ["competitor car 1", "competitor car 2"],
  "price_mentions": "any price discussion",
  "reliability_mentions": "any reliability discussion",
  "track_performance_mentions": "any track discussion",
  "recommended_for": "who the reviewer recommends this car for",
  "notable_quotes": ["memorable quote 1"]
}

RULES:
- is_relevant should be true only if the video is actually about the ${carName}
- Be specific with pros/cons - use actual mentions from the transcript
- Return ONLY valid JSON`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    logVerbose(`  AI processing error: ${err.message}`);
    return null;
  }
}

// ============================================================================
// Content Type Detection
// ============================================================================

function detectContentType(title, transcript = '') {
  const combined = `${title} ${transcript.substring(0, 500)}`.toLowerCase();

  if (combined.includes('drag race') || combined.includes('0-60')) return 'drag_race';
  if (combined.includes('track test') || combined.includes('lap time') || combined.includes('nurburgring')) return 'track_test';
  if (combined.includes('pov') || combined.includes('point of view')) return 'pov_drive';
  if (combined.includes(' vs ') || combined.includes('comparison')) return 'comparison';
  if (combined.includes('buying') || combined.includes("buyer's guide")) return 'buying_guide';
  if (combined.includes('long term') || combined.includes('ownership')) return 'ownership_update';
  if (combined.includes('review')) return 'review';

  return 'review';
}

// ============================================================================
// Database Operations
// ============================================================================

async function saveToDatabase(supabase, videoId, metadata, transcript, aiInsights, carSlug) {
  const contentType = detectContentType(metadata.title, transcript?.text || '');

  // Build summary from AI insights
  let summary = null;
  if (aiInsights) {
    const sentimentText = aiInsights.overall_sentiment ? `Overall sentiment: ${aiInsights.overall_sentiment}. ` : '';
    const recommendedText = aiInsights.recommended_for ? `Recommended for: ${aiInsights.recommended_for}` : '';
    summary = `${sentimentText}${recommendedText}`.trim() || null;
  }

  // Upsert video - use only columns that exist in the schema
  const videoRecord = {
    video_id: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: metadata.title,
    channel_name: metadata.author,
    thumbnail_url: metadata.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    transcript_text: transcript?.text || null,
    transcript_language: transcript?.language || null,
    transcript_source: transcript?.source || null,
    content_type: contentType,
    processing_status: aiInsights ? 'processed' : (transcript ? 'transcript_fetched' : 'pending'),
    // AI extracted data - matching actual schema columns
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
    throw new Error(`Failed to save video: ${videoError.message}`);
  }

  // Upsert car link
  const linkRecord = {
    video_id: videoId,
    car_slug: carSlug,
    role: contentType === 'comparison' ? 'comparison' : 'primary',
    match_confidence: aiInsights?.relevance_confidence || 0.8,
    match_method: 'manual'
  };

  const { error: linkError } = await supabase
    .from('youtube_video_car_links')
    .upsert(linkRecord, { onConflict: 'video_id,car_slug' });

  if (linkError) {
    throw new Error(`Failed to link video: ${linkError.message}`);
  }

  return true;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  log('========================================');
  log('YouTube Video Processing from URLs');
  log('========================================');

  // Load URLs from file if specified
  if (options.urlsFile) {
    try {
      const content = fs.readFileSync(options.urlsFile, 'utf-8');
      const fileUrls = content.split('\n').map(u => u.trim()).filter(u => u && !u.startsWith('#'));
      options.urls = [...options.urls, ...fileUrls];
    } catch (err) {
      logError(`Failed to read URLs file: ${err.message}`);
      process.exit(1);
    }
  }

  // Validate
  if (!options.carSlug) {
    logError('--car-slug is required');
    process.exit(1);
  }

  if (options.urls.length === 0) {
    logError('No URLs provided. Use --urls or --urls-file');
    process.exit(1);
  }

  if (!SUPADATA_API_KEY) {
    logError('SUPADATA_API_KEY is required');
    process.exit(1);
  }

  log(`Car: ${options.carSlug}`);
  log(`URLs: ${options.urls.length}`);
  if (options.dryRun) log('Mode: DRY RUN');

  // Initialize Supabase
  const supabase = options.dryRun 
    ? null 
    : createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get car name for AI context
  let carName = options.carSlug.replace(/-/g, ' ');
  if (!options.dryRun) {
    const { data: car } = await supabase
      .from('cars')
      .select('name')
      .eq('slug', options.carSlug)
      .single();
    if (car) carName = car.name;
  }

  // Stats
  const stats = {
    processed: 0,
    transcripts: 0,
    aiProcessed: 0,
    saved: 0,
    errors: 0
  };

  // Process each URL
  for (let i = 0; i < options.urls.length; i++) {
    const url = options.urls[i];
    const videoId = extractVideoId(url);
    
    if (!videoId) {
      log(`[${i + 1}/${options.urls.length}] ❌ Invalid URL: ${url}`);
      stats.errors++;
      continue;
    }

    log(`\n[${i + 1}/${options.urls.length}] Processing ${videoId}...`);
    stats.processed++;

    try {
      // Get metadata
      const metadata = await fetchVideoMetadata(videoId);
      log(`  📺 "${metadata.title.substring(0, 50)}..." by ${metadata.author}`);

      // Fetch transcript
      let transcript = null;
      try {
        transcript = await fetchTranscript(videoId);
        if (transcript) {
          stats.transcripts++;
          log(`  ✓ Transcript: ${transcript.charCount} chars`);
        } else {
          log(`  ⚠️ No transcript available`);
        }
      } catch (err) {
        log(`  ⚠️ Transcript error: ${err.message}`);
      }

      // AI processing
      let aiInsights = null;
      if (transcript && ANTHROPIC_API_KEY) {
        log(`  🤖 AI processing...`);
        aiInsights = await processWithAI(transcript.text, carName, metadata.title);
        
        if (aiInsights) {
          stats.aiProcessed++;
          const prosCount = aiInsights.pros_mentioned?.length || 0;
          const consCount = aiInsights.cons_mentioned?.length || 0;
          log(`  ✓ AI: ${prosCount} pros, ${consCount} cons, sentiment: ${aiInsights.overall_sentiment}`);
          
          if (aiInsights.is_relevant === false || (aiInsights.relevance_confidence && aiInsights.relevance_confidence < 0.5)) {
            log(`  ⚠️ Low relevance detected - video may not be about ${carName}`);
          }
        }
      }

      // Save to database
      if (!options.dryRun) {
        await saveToDatabase(supabase, videoId, metadata, transcript, aiInsights, options.carSlug);
        stats.saved++;
        log(`  ✓ Saved to database`);
      } else {
        log(`  [DRY RUN] Would save to database`);
        stats.saved++;
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 500));

    } catch (err) {
      logError(`  Error: ${err.message}`);
      stats.errors++;
    }
  }

  // Summary
  log('\n========================================');
  log('Processing Complete');
  log('========================================');
  log(`URLs processed:     ${stats.processed}`);
  log(`Transcripts:        ${stats.transcripts}`);
  log(`AI processed:       ${stats.aiProcessed}`);
  log(`Saved:              ${stats.saved}`);
  log(`Errors:             ${stats.errors}`);

  if (options.dryRun) {
    log('\n[DRY RUN] No changes were made');
  }

  return stats;
}

// Export for programmatic use
export { fetchTranscript, processWithAI, extractVideoId };

// Run
main().catch(err => {
  logError('Fatal error:', err);
  process.exit(1);
});
