#!/usr/bin/env node

/**
 * YouTube DIY Enrichment Pipeline
 * 
 * Master orchestration script that combines channel scanning, transcript
 * fetching, and AI processing for DIY/build content enrichment.
 * 
 * Usage:
 *   node scripts/youtube-diy-pipeline.js [options]
 * 
 * Options:
 *   --channels <list>      Comma-separated channel handles (default: all DIY channels)
 *   --top-n <n>            Process top N vehicles (default: 25)
 *   --videos-per-car <n>   Max videos per car per channel (default: 3)
 *   --process-limit <n>    Max videos to AI-process (default: 50)
 *   --scan-only            Only scan for videos, don't process transcripts
 *   --process-only         Only process existing queue, don't scan
 *   --dry-run              Don't write to database
 *   --verbose              Enable verbose logging
 *   --output <file>        Write results to JSON file
 * 
 * Environment Variables:
 *   EXA_API_KEY            Required: Exa API key for video discovery
 *   SUPADATA_API_KEY       Required: Supadata API key for transcripts
 *   ANTHROPIC_API_KEY      Required: For AI processing
 *   SUPABASE_URL           Required: Supabase project URL
 *   SUPABASE_SERVICE_KEY   Required: Supabase service role key
 * 
 * Examples:
 *   # Full pipeline for top 10 vehicles across 3 channels
 *   node scripts/youtube-diy-pipeline.js --channels ChrisFix,throtl,Donut --top-n 10
 * 
 *   # Scan only (queue videos for later processing)
 *   node scripts/youtube-diy-pipeline.js --scan-only --top-n 50
 * 
 *   # Process existing queue
 *   node scripts/youtube-diy-pipeline.js --process-only --process-limit 20
 * 
 * @module scripts/youtube-diy-pipeline
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import sub-modules
import { searchChannelVideos, loadTop100Vehicles } from './youtube-channel-scanner.js';
import { fetchTranscript, processWithAI } from './youtube-diy-processor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  channels: null, // null = all DIY channels
  topN: 25,
  videosPerCar: 3,
  processLimit: 50,
  scanOnly: false,
  processOnly: false,
  dryRun: false,
  verbose: false,
  outputFile: null
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--channels':
      options.channels = args[++i].split(',').map(c => c.trim());
      break;
    case '--top-n':
      options.topN = parseInt(args[++i], 10);
      break;
    case '--videos-per-car':
      options.videosPerCar = parseInt(args[++i], 10);
      break;
    case '--process-limit':
      options.processLimit = parseInt(args[++i], 10);
      break;
    case '--scan-only':
      options.scanOnly = true;
      break;
    case '--process-only':
      options.processOnly = true;
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--verbose':
      options.verbose = true;
      break;
    case '--output':
      options.outputFile = args[++i];
      break;
  }
}

// Logging helpers
const log = (...args) => console.log('[diy-pipeline]', ...args);
const logVerbose = (...args) => options.verbose && console.log('[diy-pipeline:verbose]', ...args);
const logError = (...args) => console.error('[diy-pipeline:error]', ...args);

// ============================================================================
// Pipeline Statistics
// ============================================================================

const stats = {
  startTime: new Date(),
  
  // Scanning phase
  channelsScanned: 0,
  vehiclesScanned: 0,
  videosDiscovered: 0,
  videosQueued: 0,
  videosSkippedExisting: 0,
  
  // Processing phase
  videosProcessed: 0,
  transcriptsFetched: 0,
  transcriptsFailed: 0,
  aiProcessed: 0,
  aiFailed: 0,
  
  // Extracted content
  issuesExtracted: 0,
  tipsExtracted: 0,
  partsExtracted: 0,
  troubleshootingExtracted: 0,
  
  // Errors
  errors: []
};

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Check if video already exists
 */
async function videoExists(supabase, videoId) {
  const { data } = await supabase
    .from('youtube_videos')
    .select('video_id')
    .eq('video_id', videoId)
    .single();
  return !!data;
}

/**
 * Add video to ingestion queue
 */
async function addToQueue(supabase, video, channel) {
  const queueItem = {
    video_id: video.videoId,
    video_url: video.url,
    channel_id: channel.channel_id,
    discovered_via: 'diy_pipeline',
    target_car_slug: video.matchedSlug,
    status: 'pending',
    priority: Math.max(1, 11 - Math.ceil((video.matchedRank || 50) / 10)),
    metadata: {
      matched_vehicle: video.matchedVehicle,
      matched_rank: video.matchedRank,
      search_title: video.title,
      channel_name: channel.channel_name,
      discovered_at: new Date().toISOString()
    }
  };

  const { error } = await supabase
    .from('youtube_ingestion_queue')
    .upsert(queueItem, { onConflict: 'video_id' });

  return !error;
}

/**
 * Get pending queue items
 */
async function getPendingQueue(supabase, limit) {
  const { data, error } = await supabase
    .from('youtube_ingestion_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('discovered_at', { ascending: true })
    .limit(limit);

  if (error) {
    logError(`Failed to fetch queue: ${error.message}`);
    return [];
  }
  return data || [];
}

/**
 * Update queue item status
 */
async function updateQueueStatus(supabase, videoId, status, errorMsg = null) {
  const update = {
    status,
    processed_at: new Date().toISOString()
  };
  if (errorMsg) {
    update.error_message = errorMsg.substring(0, 500);
  }
  
  await supabase
    .from('youtube_ingestion_queue')
    .update(update)
    .eq('video_id', videoId);
}

/**
 * Fetch video metadata via oEmbed
 */
async function fetchVideoMetadata(videoId) {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (!response.ok) return null;
    const data = await response.json();
    return {
      title: data.title,
      channelName: data.author_name,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    };
  } catch {
    return null;
  }
}

/**
 * Calculate quality score from insights
 */
function calculateQualityScore(insights) {
  if (!insights) return 0.3;
  let score = 0.5;
  if (insights.known_issues_discovered?.length > 0) score += 0.1;
  if (insights.maintenance_tips?.length > 0) score += 0.1;
  if (insights.parts_mentioned?.length > 0) score += 0.05;
  if (insights.troubleshooting_insights?.length > 0) score += 0.1;
  if (insights.modification_details?.name) score += 0.05;
  const qi = insights.quality_indicators || {};
  if (qi.is_technical) score += 0.05;
  if (qi.demonstrates_procedure) score += 0.05;
  return Math.min(1.0, score);
}

/**
 * Save processed video to database
 */
async function saveProcessedVideo(supabase, videoId, metadata, transcript, insights, carSlug, channelId) {
  const videoRecord = {
    video_id: videoId,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    title: metadata?.title || `Video ${videoId}`,
    channel_id: channelId || null,
    channel_name: metadata?.channelName || 'Unknown',
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
      ? ['Practical DIY content']
      : [],
    cons_mentioned: insights?.known_issues_discovered?.map(i => i.title) || [],
    quality_score: calculateQualityScore(insights),
    diy_insights: insights
  };

  const { data: existing } = await supabase
    .from('youtube_videos')
    .select('id')
    .eq('video_id', videoId)
    .single();

  let videoDbId;
  if (existing) {
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
  } else {
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
  }

  // Create car link if we have a slug
  if (carSlug) {
    const { data: car } = await supabase
      .from('cars')
      .select('id')
      .eq('slug', carSlug)
      .single();

    if (car) {
      await supabase
        .from('youtube_video_car_links')
        .upsert({
          video_id: videoId,
          car_id: car.id,
          car_slug: carSlug,
          role: 'primary',
          match_confidence: 0.8,
          match_method: 'diy_pipeline'
        }, { onConflict: 'video_id,car_slug' });
    }
  }

  return videoDbId;
}

// ============================================================================
// Phase 1: Channel Scanning
// ============================================================================

async function runScanPhase(supabase, channels, vehicles) {
  log('\n========================================');
  log('PHASE 1: Video Discovery');
  log('========================================');
  log(`Channels: ${channels.length}`);
  log(`Vehicles: ${vehicles.length}`);
  log('');

  for (const channel of channels) {
    log(`\n--- Channel: ${channel.channel_name} (@${channel.channel_handle}) ---`);
    stats.channelsScanned++;

    for (const vehicle of vehicles) {
      if (!vehicle.searchTerms?.length) continue;

      logVerbose(`  [${vehicle.rank}] ${vehicle.name}...`);
      stats.vehiclesScanned++;

      try {
        const videos = await searchChannelVideos(
          channel.channel_handle,
          channel.channel_name,
          vehicle,
          options.videosPerCar
        );

        if (videos.length === 0) {
          logVerbose(`    No videos found`);
          continue;
        }

        log(`  [${vehicle.rank}] ${vehicle.name}: ${videos.length} video(s)`);
        stats.videosDiscovered += videos.length;

        for (const video of videos) {
          // Check if already exists
          const exists = await videoExists(supabase, video.videoId);
          if (exists) {
            stats.videosSkippedExisting++;
            logVerbose(`    SKIP: ${video.videoId} (exists)`);
            continue;
          }

          // Add to queue
          if (!options.dryRun) {
            const queued = await addToQueue(supabase, video, channel);
            if (queued) {
              stats.videosQueued++;
              log(`    + QUEUED: ${video.title.substring(0, 50)}...`);
            }
          } else {
            stats.videosQueued++;
            log(`    + [DRY] ${video.title.substring(0, 50)}...`);
          }
        }

        // Rate limiting
        await new Promise(r => setTimeout(r, 500));

      } catch (err) {
        logError(`  Error scanning ${vehicle.name}: ${err.message}`);
        stats.errors.push({ phase: 'scan', vehicle: vehicle.name, error: err.message });
      }
    }
  }
}

// ============================================================================
// Phase 2: Transcript & AI Processing
// ============================================================================

async function runProcessPhase(supabase) {
  log('\n========================================');
  log('PHASE 2: Transcript & AI Processing');
  log('========================================');

  const queueItems = await getPendingQueue(supabase, options.processLimit);
  
  if (queueItems.length === 0) {
    log('No pending videos to process');
    return;
  }

  log(`Processing ${queueItems.length} videos...`);
  log('');

  for (const item of queueItems) {
    const videoId = item.video_id;
    log(`\n[${stats.videosProcessed + 1}/${queueItems.length}] ${videoId}`);
    
    // Update status
    if (!options.dryRun) {
      await updateQueueStatus(supabase, videoId, 'processing');
    }

    try {
      // Get metadata
      const metadata = await fetchVideoMetadata(videoId);
      if (metadata) {
        log(`  Title: ${metadata.title?.substring(0, 60)}...`);
      }

      // Fetch transcript
      const transcript = await fetchTranscript(videoId);
      if (!transcript) {
        log(`  ✗ No transcript`);
        stats.transcriptsFailed++;
        if (!options.dryRun) {
          await updateQueueStatus(supabase, videoId, 'failed', 'No transcript available');
        }
        continue;
      }
      
      log(`  ✓ Transcript: ${transcript.charCount} chars`);
      stats.transcriptsFetched++;

      // AI Processing
      const carName = item.target_car_slug?.replace(/-/g, ' ') || item.metadata?.matched_vehicle || 'vehicle';
      const insights = await processWithAI(transcript.text, carName, metadata?.title || 'Unknown');
      
      if (!insights) {
        log(`  ✗ AI processing failed`);
        stats.aiFailed++;
        if (!options.dryRun) {
          await updateQueueStatus(supabase, videoId, 'failed', 'AI processing failed');
        }
        continue;
      }

      stats.aiProcessed++;
      
      // Count extracted content
      stats.issuesExtracted += insights.known_issues_discovered?.length || 0;
      stats.tipsExtracted += insights.maintenance_tips?.length || 0;
      stats.partsExtracted += insights.parts_mentioned?.length || 0;
      stats.troubleshootingExtracted += insights.troubleshooting_insights?.length || 0;

      // Log extraction summary
      const issueCount = insights.known_issues_discovered?.length || 0;
      const tipCount = insights.maintenance_tips?.length || 0;
      const partCount = insights.parts_mentioned?.length || 0;
      log(`  ✓ AI: ${issueCount} issues, ${tipCount} tips, ${partCount} parts`);

      // Save to database
      if (!options.dryRun) {
        const dbId = await saveProcessedVideo(
          supabase,
          videoId,
          metadata,
          transcript,
          insights,
          item.target_car_slug,
          item.channel_id
        );

        if (dbId) {
          await updateQueueStatus(supabase, videoId, 'completed');
          log(`  ✓ Saved to database`);
        } else {
          await updateQueueStatus(supabase, videoId, 'failed', 'Database save failed');
        }
      } else {
        log(`  [DRY RUN] Would save to database`);
      }

      stats.videosProcessed++;

      // Rate limiting
      await new Promise(r => setTimeout(r, 1500));

    } catch (err) {
      logError(`  Error: ${err.message}`);
      stats.errors.push({ phase: 'process', videoId, error: err.message });
      if (!options.dryRun) {
        await updateQueueStatus(supabase, videoId, 'failed', err.message);
      }
    }
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  console.log('');
  log('╔══════════════════════════════════════════════════════════╗');
  log('║        YouTube DIY Enrichment Pipeline                   ║');
  log('╚══════════════════════════════════════════════════════════╝');
  log('');
  log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
  log(`Scan: ${options.processOnly ? 'SKIP' : `Top ${options.topN} vehicles`}`);
  log(`Process: ${options.scanOnly ? 'SKIP' : `Up to ${options.processLimit} videos`}`);
  log('');

  // Validate configuration
  const missingKeys = [];
  if (!EXA_API_KEY && !options.processOnly) missingKeys.push('EXA_API_KEY');
  if (!SUPADATA_API_KEY && !options.scanOnly) missingKeys.push('SUPADATA_API_KEY');
  if (!ANTHROPIC_API_KEY && !options.scanOnly) missingKeys.push('ANTHROPIC_API_KEY');
  if (!options.dryRun && (!SUPABASE_URL || !SUPABASE_SERVICE_KEY)) {
    missingKeys.push('SUPABASE_URL/SUPABASE_SERVICE_KEY');
  }

  if (missingKeys.length > 0) {
    logError(`Missing required environment variables: ${missingKeys.join(', ')}`);
    process.exit(1);
  }

  // Initialize Supabase client
  const supabase = options.dryRun
    ? null
    : createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Load DIY channels
  let channels = [];
  if (!options.processOnly) {
    if (supabase) {
      const { data, error } = await supabase
        .from('youtube_channels')
        .select('*')
        .eq('is_active', true)
        .overlaps('content_focus', ['builds', 'tutorials', 'restorations', 'diagnostics', 'modifications', 'projects', 'maintenance']);

      if (error) {
        logError(`Failed to fetch channels: ${error.message}`);
        process.exit(1);
      }
      channels = data || [];
    }

    // Filter by specified channels if provided
    if (options.channels) {
      channels = channels.filter(c =>
        options.channels.some(h => 
          h.toLowerCase() === c.channel_handle?.toLowerCase() ||
          h.toLowerCase() === c.channel_name?.toLowerCase()
        )
      );
    }

    if (channels.length === 0 && !options.dryRun) {
      logError('No DIY channels found. Run youtube-register-diy-channels.js first.');
      process.exit(1);
    }

    // For dry run, create mock channels
    if (options.dryRun && channels.length === 0) {
      channels = (options.channels || ['ChrisFix']).map(h => ({
        channel_id: 'mock',
        channel_handle: h,
        channel_name: h
      }));
    }
  }

  // Load Top 100 vehicles
  const vehicles = loadTop100Vehicles().slice(0, options.topN);

  // Phase 1: Scan
  if (!options.processOnly) {
    await runScanPhase(supabase, channels, vehicles);
  }

  // Phase 2: Process
  if (!options.scanOnly && supabase) {
    await runProcessPhase(supabase);
  }

  // Calculate duration
  const duration = Math.round((Date.now() - stats.startTime.getTime()) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  // Print summary
  log('\n╔══════════════════════════════════════════════════════════╗');
  log('║                    Pipeline Complete                      ║');
  log('╚══════════════════════════════════════════════════════════╝');
  log('');
  log('Discovery Phase:');
  log(`  Channels scanned:      ${stats.channelsScanned}`);
  log(`  Vehicles scanned:      ${stats.vehiclesScanned}`);
  log(`  Videos discovered:     ${stats.videosDiscovered}`);
  log(`  Videos queued:         ${stats.videosQueued}`);
  log(`  Skipped (existing):    ${stats.videosSkippedExisting}`);
  log('');
  log('Processing Phase:');
  log(`  Videos processed:      ${stats.videosProcessed}`);
  log(`  Transcripts fetched:   ${stats.transcriptsFetched}`);
  log(`  Transcripts failed:    ${stats.transcriptsFailed}`);
  log(`  AI processed:          ${stats.aiProcessed}`);
  log(`  AI failed:             ${stats.aiFailed}`);
  log('');
  log('Content Extracted:');
  log(`  Known issues:          ${stats.issuesExtracted}`);
  log(`  Maintenance tips:      ${stats.tipsExtracted}`);
  log(`  Parts mentioned:       ${stats.partsExtracted}`);
  log(`  Troubleshooting:       ${stats.troubleshootingExtracted}`);
  log('');
  log(`Duration: ${minutes}m ${seconds}s`);
  log(`Errors: ${stats.errors.length}`);

  if (options.dryRun) {
    log('');
    log('[DRY RUN] No changes were made to the database');
  }

  // Write results to file if requested
  if (options.outputFile) {
    const results = {
      runDate: stats.startTime.toISOString(),
      options: { ...options },
      stats,
      errors: stats.errors
    };
    fs.writeFileSync(options.outputFile, JSON.stringify(results, null, 2));
    log(`\nResults written to: ${options.outputFile}`);
  }

  // Exit with error if there were failures
  if (stats.errors.length > 0) {
    log('\nErrors encountered:');
    for (const err of stats.errors.slice(0, 5)) {
      logError(`  - ${err.phase}: ${err.error}`);
    }
    if (stats.errors.length > 5) {
      logError(`  ... and ${stats.errors.length - 5} more`);
    }
  }

  return stats;
}

// Run if called directly
main().catch(error => {
  logError('Fatal error:', error);
  process.exit(1);
});
