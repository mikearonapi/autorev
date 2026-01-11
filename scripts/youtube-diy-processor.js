#!/usr/bin/env node

/**
 * YouTube DIY Content Processor
 * 
 * Processes DIY/build-focused YouTube video transcripts to extract
 * practical automotive knowledge: known issues, maintenance tips,
 * parts mentioned, modification guides, and troubleshooting insights.
 * 
 * Usage:
 *   node scripts/youtube-diy-processor.js [options]
 * 
 * Options:
 *   --video-id <id>        Process a specific video by ID
 *   --queue                Process videos from ingestion queue
 *   --limit <n>            Max videos to process (default: 10)
 *   --dry-run              Don't write to database
 *   --verbose              Enable verbose logging
 * 
 * Environment Variables:
 *   SUPADATA_API_KEY       Required: Supadata API key for transcripts
 *   ANTHROPIC_API_KEY      Required: For AI processing
 *   SUPABASE_URL           Required: Supabase project URL
 *   SUPABASE_SERVICE_KEY   Required: Supabase service role key
 * 
 * @module scripts/youtube-diy-processor
 */

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
  videoId: null,
  processQueue: false,
  limit: 10,
  dryRun: false,
  verbose: false
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--video-id':
      options.videoId = args[++i];
      break;
    case '--queue':
      options.processQueue = true;
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
  }
}

// Logging helpers
const log = (...args) => console.log('[diy-processor]', ...args);
const logVerbose = (...args) => options.verbose && console.log('[diy-processor:verbose]', ...args);
const logError = (...args) => console.error('[diy-processor:error]', ...args);

// ============================================================================
// Supadata Transcript Fetching
// ============================================================================

/**
 * Fetch transcript for a YouTube video using Supadata API
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object|null>} Transcript data or null
 */
async function fetchTranscript(videoId) {
  if (!SUPADATA_API_KEY) {
    throw new Error('SUPADATA_API_KEY not configured');
  }

  const url = `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`;
  
  logVerbose(`  Fetching transcript for ${videoId}...`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': SUPADATA_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      logVerbose(`  Supadata failed: ${response.status} - ${errorText.substring(0, 100)}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.content || data.content.length === 0) {
      logVerbose(`  Empty transcript returned`);
      return null;
    }

    return {
      text: data.content,
      language: data.lang || 'en',
      source: 'supadata_api',
      charCount: data.content.length
    };
  } catch (err) {
    logVerbose(`  Transcript error: ${err.message}`);
    return null;
  }
}

// ============================================================================
// DIY-Focused AI Processing
// ============================================================================

/**
 * Build the DIY extraction prompt
 */
function buildDIYExtractionPrompt(carName, videoTitle, transcript) {
  // Truncate transcript if too long
  const maxChars = 30000;
  const truncatedTranscript = transcript.length > maxChars 
    ? transcript.substring(0, maxChars) + '...[truncated]'
    : transcript;

  return `You are an automotive technical analyst extracting practical knowledge from DIY and build video transcripts.

VIDEO TITLE: ${videoTitle}
PRIMARY VEHICLE: ${carName || 'Not specified'}

TRANSCRIPT:
${truncatedTranscript}

Extract detailed, actionable information for car enthusiasts. Return JSON with the following structure:

{
  "content_type": "build|tutorial|restoration|diagnostics|maintenance|review|comparison|other",
  "content_category": "diy",
  
  "primary_vehicle": {
    "make": "string or null",
    "model": "string or null", 
    "years": "string range or null",
    "generation": "string code like 'S550' or 'E46' or null"
  },
  
  "other_vehicles_mentioned": ["list of other cars discussed"],
  
  "known_issues_discovered": [
    {
      "title": "Brief issue name",
      "description": "Detailed description of the problem",
      "symptoms": ["symptom 1", "symptom 2"],
      "affected_years": "year range if mentioned",
      "severity": "low|medium|high|critical",
      "fix_difficulty": 1-5,
      "estimated_cost": "$X-$Y or null"
    }
  ],
  
  "maintenance_tips": [
    {
      "tip": "Specific actionable maintenance tip",
      "applies_to": "component or system",
      "frequency": "interval if mentioned",
      "difficulty": 1-5
    }
  ],
  
  "parts_mentioned": [
    {
      "name": "Part name",
      "brand": "Brand if mentioned",
      "part_number": "Part number if mentioned",
      "approx_cost": "$X or null",
      "purpose": "What the part is for",
      "quality_tier": "budget|mid|premium|oem"
    }
  ],
  
  "tools_required": ["List of tools mentioned for the job"],
  
  "modification_details": {
    "type": "intake|exhaust|suspension|tune|brakes|cooling|engine|drivetrain|exterior|interior|null",
    "name": "Name of the modification",
    "difficulty": 1-5,
    "time_estimate": "X hours",
    "cost_estimate": "$X-$Y",
    "performance_gains": "HP/TQ gains or other benefits if mentioned",
    "notes": "Important considerations"
  },
  
  "troubleshooting_insights": [
    {
      "symptom": "What the problem looks/sounds like",
      "likely_cause": "Root cause",
      "diagnostic_steps": ["step 1", "step 2"],
      "solution": "How to fix it"
    }
  ],
  
  "key_timestamps": [
    {
      "time": "MM:SS",
      "topic": "What's discussed at this point"
    }
  ],
  
  "quality_indicators": {
    "is_technical": true/false,
    "has_practical_value": true/false,
    "demonstrates_procedure": true/false,
    "mentions_costs": true/false,
    "provides_part_numbers": true/false
  },
  
  "summary": "2-3 sentence summary of the video's main content and value",
  
  "one_liner": "Single sentence describing what viewers will learn"
}

RULES:
- Be specific - extract actual values, numbers, and part names mentioned
- If something isn't mentioned, use null or empty array - don't make things up
- For costs, use the format "$X" or "$X-$Y" range
- Severity levels: low (cosmetic/minor), medium (functional impact), high (safety/expensive), critical (immediate attention)
- Difficulty 1-5: 1=beginner, 2=DIY capable, 3=intermediate, 4=advanced, 5=professional
- Return ONLY valid JSON, no additional text or markdown`;
}

/**
 * Process transcript with AI to extract DIY insights
 * @param {string} transcript - Full transcript text
 * @param {string} carName - Car name for context
 * @param {string} videoTitle - Video title for context
 * @returns {Promise<Object|null>} Extracted insights
 */
async function processWithAI(transcript, carName, videoTitle) {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const prompt = buildDIYExtractionPrompt(carName, videoTitle, transcript);

  try {
    log(`  Processing with AI...`);
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      logVerbose(`  AI returned no JSON`);
      return null;
    }

    const insights = JSON.parse(jsonMatch[0]);
    
    // Log summary of what was extracted
    const issueCount = insights.known_issues_discovered?.length || 0;
    const tipCount = insights.maintenance_tips?.length || 0;
    const partCount = insights.parts_mentioned?.length || 0;
    const troubleCount = insights.troubleshooting_insights?.length || 0;
    
    log(`  ✓ Extracted: ${issueCount} issues, ${tipCount} tips, ${partCount} parts, ${troubleCount} troubleshooting`);
    
    return insights;
  } catch (err) {
    logError(`  AI processing error: ${err.message}`);
    return null;
  }
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Get video metadata from oEmbed
 */
async function fetchVideoMetadata(videoId) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      title: data.title,
      channelName: data.author_name,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Get channel info from database
 */
async function getChannelInfo(supabase, channelName) {
  if (!channelName) return null;
  
  const { data } = await supabase
    .from('youtube_channels')
    .select('channel_id, channel_name, credibility_tier')
    .or(`channel_name.ilike.%${channelName}%,channel_handle.ilike.%${channelName}%`)
    .single();
  
  return data;
}

/**
 * Save processed video to database
 */
async function saveVideo(supabase, videoId, metadata, transcript, insights, carSlug, carId, channelInfo) {
  // Build video record
  const videoRecord = {
    video_id: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: metadata?.title || `Video ${videoId}`,
    channel_id: channelInfo?.channel_id || null,
    channel_name: metadata?.channelName || channelInfo?.channel_name || 'Unknown',
    thumbnail_url: metadata?.thumbnailUrl,
    transcript_text: transcript?.text,
    transcript_language: transcript?.language || 'en',
    transcript_source: transcript?.source,
    processing_status: insights ? 'processed' : 'transcript_fetched',
    processed_at: insights ? new Date().toISOString() : null,
    content_type: insights?.content_type,
    content_category: 'diy',
    summary: insights?.summary,
    one_line_take: insights?.one_liner,
    key_points: insights?.maintenance_tips?.map(t => t.tip) || [],
    pros_mentioned: insights?.quality_indicators?.has_practical_value 
      ? ['Practical DIY content', ...(insights.parts_mentioned?.map(p => p.name) || []).slice(0, 3)]
      : [],
    cons_mentioned: insights?.known_issues_discovered?.map(i => i.title) || [],
    notable_quotes: [],
    quality_score: calculateQualityScore(insights),
    diy_insights: insights
  };

  // Check if video exists
  const { data: existing } = await supabase
    .from('youtube_videos')
    .select('id')
    .eq('video_id', videoId)
    .single();

  let videoDbId;
  
  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('youtube_videos')
      .update(videoRecord)
      .eq('video_id', videoId)
      .select('id')
      .single();
    
    if (error) {
      logError(`  Failed to update video: ${error.message}`);
      return null;
    }
    videoDbId = data.id;
    log(`  ✓ Updated video record`);
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('youtube_videos')
      .insert(videoRecord)
      .select('id')
      .single();
    
    if (error) {
      logError(`  Failed to insert video: ${error.message}`);
      return null;
    }
    videoDbId = data.id;
    log(`  ✓ Created video record`);
  }

  // Create car link using car_id directly
  if (carId) {
    // Get the actual car slug from the cars table
    const { data: carData } = await supabase
      .from('cars')
      .select('slug')
      .eq('id', carId)
      .single();
    
    const actualCarSlug = carData?.slug;
    
    if (actualCarSlug) {
      const linkRecord = {
        video_id: videoId,
        car_id: carId,
        car_slug: actualCarSlug,
        role: 'primary',
        match_confidence: 0.9,
        match_method: 'diy_channel_scan'
      };

      const { error: linkError } = await supabase
        .from('youtube_video_car_links')
        .upsert(linkRecord, { onConflict: 'video_id,car_slug' });
      
      if (linkError) {
        logVerbose(`  Warning: Link failed: ${linkError.message}`);
      } else {
        log(`  ✓ Linked to car: ${actualCarSlug}`);
      }
    }
  }

  return videoDbId;
}

/**
 * Calculate quality score based on extracted insights
 */
function calculateQualityScore(insights) {
  if (!insights) return 0.3;
  
  let score = 0.5; // Base score
  
  // Add points for useful content
  if (insights.known_issues_discovered?.length > 0) score += 0.1;
  if (insights.maintenance_tips?.length > 0) score += 0.1;
  if (insights.parts_mentioned?.length > 0) score += 0.05;
  if (insights.troubleshooting_insights?.length > 0) score += 0.1;
  if (insights.modification_details?.name) score += 0.05;
  
  // Add points for quality indicators
  const qi = insights.quality_indicators || {};
  if (qi.is_technical) score += 0.05;
  if (qi.demonstrates_procedure) score += 0.05;
  if (qi.provides_part_numbers) score += 0.05;
  
  return Math.min(1.0, score);
}

/**
 * Update queue item status
 */
async function updateQueueStatus(supabase, videoId, status, error = null) {
  const update = {
    status,
    processed_at: new Date().toISOString()
  };
  
  if (error) {
    update.error_message = error.substring(0, 500);
  }

  await supabase
    .from('youtube_ingestion_queue')
    .update(update)
    .eq('video_id', videoId);
}

// ============================================================================
// Main Processing Functions
// ============================================================================

/**
 * Process a single video
 */
async function processVideo(supabase, videoId, targetCarSlug = null, targetCarId = null) {
  log(`\nProcessing video: ${videoId}`);
  
  // Get metadata
  const metadata = await fetchVideoMetadata(videoId);
  if (metadata) {
    log(`  Title: ${metadata.title}`);
    log(`  Channel: ${metadata.channelName}`);
  }
  
  // Get channel info
  const channelInfo = metadata?.channelName 
    ? await getChannelInfo(supabase, metadata.channelName)
    : null;
  
  // Fetch transcript
  const transcript = await fetchTranscript(videoId);
  if (!transcript) {
    log(`  ✗ No transcript available`);
    return { success: false, error: 'No transcript' };
  }
  log(`  ✓ Transcript: ${transcript.charCount} chars`);
  
  // Process with AI
  const carName = targetCarSlug?.replace(/-/g, ' ') || 'Unknown vehicle';
  const insights = await processWithAI(transcript.text, carName, metadata?.title || 'Unknown');
  
  if (!insights) {
    log(`  ✗ AI processing failed`);
    return { success: false, error: 'AI processing failed' };
  }
  
  // Save to database
  if (!options.dryRun) {
    const dbId = await saveVideo(supabase, videoId, metadata, transcript, insights, targetCarSlug, targetCarId, channelInfo);
    if (!dbId) {
      return { success: false, error: 'Database save failed' };
    }
  } else {
    log(`  [DRY RUN] Would save video with insights`);
  }
  
  return { success: true, insights };
}

/**
 * Process videos from the ingestion queue
 */
async function processQueue(supabase, limit) {
  log(`\nFetching videos from queue (limit: ${limit})...`);
  
  // Prioritize videos that have car_id linked
  const { data: queueItems, error } = await supabase
    .from('youtube_ingestion_queue')
    .select('*')
    .eq('status', 'pending')
    .not('target_car_id', 'is', null)
    .order('priority', { ascending: false })
    .order('discovered_at', { ascending: true })
    .limit(limit);
  
  if (error) {
    logError(`Failed to fetch queue: ${error.message}`);
    return [];
  }
  
  if (!queueItems || queueItems.length === 0) {
    log('No pending videos in queue with car_id');
    return [];
  }
  
  log(`Found ${queueItems.length} videos to process`);
  
  const results = [];
  
  for (const item of queueItems) {
    // Update status to processing
    if (!options.dryRun) {
      await updateQueueStatus(supabase, item.video_id, 'processing');
    }
    
    const result = await processVideo(
      supabase,
      item.video_id,
      item.target_car_slug,
      item.target_car_id  // Pass car_id directly
    );
    
    results.push({
      videoId: item.video_id,
      carSlug: item.target_car_slug,
      ...result
    });
    
    // Update queue status
    if (!options.dryRun) {
      await updateQueueStatus(
        supabase,
        item.video_id,
        result.success ? 'completed' : 'failed',
        result.error
      );
    }
    
    // Rate limiting between videos
    await new Promise(r => setTimeout(r, 1500));
  }
  
  return results;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  log('========================================');
  log('YouTube DIY Content Processor');
  log('========================================');
  log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
  log('');

  // Validate configuration
  if (!SUPADATA_API_KEY) {
    logError('SUPADATA_API_KEY is required');
    process.exit(1);
  }

  if (!ANTHROPIC_API_KEY) {
    logError('ANTHROPIC_API_KEY is required');
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

  // Track statistics
  const stats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    issues_extracted: 0,
    tips_extracted: 0,
    parts_extracted: 0
  };

  let results = [];

  if (options.videoId) {
    // Process single video
    const result = await processVideo(supabase, options.videoId);
    results.push({ videoId: options.videoId, ...result });
  } else if (options.processQueue) {
    // Process from queue
    results = await processQueue(supabase, options.limit);
  } else {
    logError('Specify --video-id <id> or --queue');
    process.exit(1);
  }

  // Calculate stats
  for (const result of results) {
    stats.processed++;
    if (result.success) {
      stats.succeeded++;
      if (result.insights) {
        stats.issues_extracted += result.insights.known_issues_discovered?.length || 0;
        stats.tips_extracted += result.insights.maintenance_tips?.length || 0;
        stats.parts_extracted += result.insights.parts_mentioned?.length || 0;
      }
    } else {
      stats.failed++;
    }
  }

  // Print summary
  log('\n========================================');
  log('Processing Complete');
  log('========================================');
  log(`Videos processed:    ${stats.processed}`);
  log(`Succeeded:           ${stats.succeeded}`);
  log(`Failed:              ${stats.failed}`);
  log(`Issues extracted:    ${stats.issues_extracted}`);
  log(`Tips extracted:      ${stats.tips_extracted}`);
  log(`Parts extracted:     ${stats.parts_extracted}`);

  if (options.dryRun) {
    log('');
    log('[DRY RUN] No changes were made to the database');
  }

  return stats;
}

// Export functions for use in other scripts
export { fetchTranscript, processWithAI, buildDIYExtractionPrompt };

// Run if called directly (not imported)
const isMainModule = process.argv[1]?.includes('youtube-diy-processor');
if (isMainModule) {
  main().catch(error => {
    logError('Fatal error:', error);
    process.exit(1);
  });
}
