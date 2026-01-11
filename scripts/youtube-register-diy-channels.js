#!/usr/bin/env node

/**
 * YouTube DIY Channel Registration Script
 * 
 * Registers DIY/build-focused YouTube channels in the youtube_channels table.
 * Fetches channel IDs via YouTube page scraping (no API quota needed).
 * 
 * Usage:
 *   node scripts/youtube-register-diy-channels.js [options]
 * 
 * Options:
 *   --dry-run    Don't write to database, just log what would be done
 *   --verbose    Enable verbose logging
 *   --channel    Register a single channel by handle (e.g., --channel throtl)
 * 
 * Environment Variables:
 *   SUPABASE_URL          Required: Supabase project URL
 *   SUPABASE_SERVICE_KEY  Required: Supabase service role key
 * 
 * @module scripts/youtube-register-diy-channels
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: false,
  verbose: false,
  singleChannel: null
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--verbose':
      options.verbose = true;
      break;
    case '--channel':
      options.singleChannel = args[++i];
      break;
  }
}

// Logging helpers
const log = (...args) => console.log('[diy-channels]', ...args);
const logVerbose = (...args) => options.verbose && console.log('[diy-channels:verbose]', ...args);
const logError = (...args) => console.error('[diy-channels:error]', ...args);

// ============================================================================
// DIY Channel Definitions
// ============================================================================

/**
 * DIY/Build-focused YouTube channels to register
 * These channels focus on builds, tutorials, restorations, and diagnostics
 * rather than traditional car reviews.
 */
const DIY_CHANNELS = [
  {
    handle: 'throtl',
    name: 'throtl',
    tier: 'tier2',
    contentFocus: ['builds', 'projects', 'modifications'],
    notes: 'Budget builds and project cars. Great for build cost data and common issues.'
  },
  {
    handle: 'Donut',
    name: 'Donut Media',
    tier: 'tier2',
    contentFocus: ['education', 'entertainment', 'comparisons'],
    notes: 'Automotive education and entertainment. Engine/platform deep dives.'
  },
  {
    handle: 'TheHoonigans',
    name: 'Hoonigan',
    tier: 'tier2',
    contentFocus: ['motorsport', 'builds', 'drag_races'],
    notes: 'Motorsport and builds. Performance mods and track prep content.'
  },
  {
    handle: 'CleetusM',
    name: 'Cleetus McFarland',
    tier: 'tier2',
    contentFocus: ['builds', 'drag_races', 'motorsport'],
    notes: 'Racing and builds. LS swaps, drag builds, and track content.'
  },
  {
    handle: 'mightycarmods',
    name: 'Mighty Car Mods',
    tier: 'tier2',
    contentFocus: ['builds', 'tutorials', 'modifications'],
    notes: 'DIY modifications and builds. Install guides and practical tips.'
  },
  {
    handle: 'SuperfastMatt',
    name: 'Superfast Matt',
    tier: 'tier3',
    contentFocus: ['builds', 'restorations', 'education'],
    notes: 'EV conversions and projects. Restoration and fabrication content.'
  },
  {
    handle: '_Gingium_',
    name: 'Gingium',
    tier: 'tier3',
    contentFocus: ['builds', 'projects', 'modifications'],
    notes: 'Budget builds and affordable modification paths.'
  },
  {
    handle: 'JimmyOakes',
    name: 'Jimmy Oakes',
    tier: 'tier3',
    contentFocus: ['builds', 'tutorials', 'restorations'],
    notes: 'Wrenching and project cars. Repair tutorials and practical advice.'
  },
  {
    handle: 'M539Restorations',
    name: 'M539 Restorations',
    tier: 'tier3',
    contentFocus: ['restorations', 'builds', 'tutorials'],
    primaryBrands: ['BMW'],
    notes: 'BMW restorations. Known issues and parts sourcing for BMWs.'
  },
  {
    handle: 'ViceGripGarage',
    name: 'Vice Grip Garage',
    tier: 'tier2',
    contentFocus: ['restorations', 'tutorials', 'diagnostics'],
    notes: 'Vehicle revivals and repairs. Troubleshooting and diagnostics content.'
  },
  {
    handle: 'chrisfix',
    name: 'ChrisFix',
    tier: 'tier1',
    contentFocus: ['tutorials', 'maintenance', 'diagnostics'],
    notes: 'DIY tutorials and maintenance how-tos. Extremely detailed repair guides.'
  },
  {
    handle: 'SouthMainAuto',
    name: 'South Main Auto Repair',
    tier: 'tier2',
    contentFocus: ['diagnostics', 'tutorials', 'maintenance'],
    notes: 'Real-world diagnostics and repair. Professional shop perspective.'
  }
];

// ============================================================================
// YouTube Channel Info Fetching
// ============================================================================

/**
 * Fetch channel ID and metadata by scraping YouTube channel page
 * @param {string} handle - YouTube channel handle (without @)
 * @returns {Promise<Object|null>} Channel info or null
 */
async function fetchChannelInfo(handle) {
  const url = `https://www.youtube.com/@${handle}`;
  
  logVerbose(`  Fetching channel page: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      logError(`  Failed to fetch channel page: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Extract channel ID from page
    // Pattern: "channelId":"UC..." or browseId":"UC..."
    const channelIdMatch = html.match(/"(?:channelId|browseId)"\s*:\s*"(UC[a-zA-Z0-9_-]+)"/);
    if (!channelIdMatch) {
      logError(`  Could not find channel ID in page`);
      return null;
    }

    const channelId = channelIdMatch[1];

    // Extract subscriber count if available
    const subCountMatch = html.match(/"subscriberCountText"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/);
    const subscriberCount = subCountMatch ? subCountMatch[1] : null;

    // Extract channel description
    const descMatch = html.match(/"description"\s*:\s*"([^"]{0,500})"/);
    const description = descMatch ? descMatch[1].replace(/\\n/g, ' ').substring(0, 200) : null;

    return {
      channelId,
      subscriberCount,
      description
    };
  } catch (err) {
    logError(`  Error fetching channel: ${err.message}`);
    return null;
  }
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Register a channel in the youtube_channels table
 * @param {Object} supabase - Supabase client
 * @param {Object} channel - Channel definition
 * @param {Object} info - Fetched channel info
 * @returns {Promise<boolean>} Success status
 */
async function registerChannel(supabase, channel, info) {
  const record = {
    channel_id: info.channelId,
    channel_name: channel.name,
    channel_url: `https://www.youtube.com/@${channel.handle}`,
    channel_handle: channel.handle,
    credibility_tier: channel.tier,
    content_focus: channel.contentFocus,
    primary_brands: channel.primaryBrands || [],
    is_active: true,
    auto_ingest: true,
    max_videos_per_car: 5,
    notes: channel.notes
  };

  // Check if channel already exists
  const { data: existing } = await supabase
    .from('youtube_channels')
    .select('channel_id, channel_name')
    .eq('channel_id', info.channelId)
    .single();

  if (existing) {
    log(`  Channel already exists: ${existing.channel_name} (${info.channelId})`);
    
    // Update existing record
    const { error } = await supabase
      .from('youtube_channels')
      .update({
        channel_name: channel.name,
        channel_handle: channel.handle,
        credibility_tier: channel.tier,
        content_focus: channel.contentFocus,
        primary_brands: channel.primaryBrands || [],
        notes: channel.notes,
        updated_at: new Date().toISOString()
      })
      .eq('channel_id', info.channelId);

    if (error) {
      logError(`  Failed to update channel: ${error.message}`);
      return false;
    }
    
    log(`  ✓ Updated existing channel`);
    return true;
  }

  // Insert new channel
  const { error } = await supabase
    .from('youtube_channels')
    .insert(record);

  if (error) {
    logError(`  Failed to insert channel: ${error.message}`);
    return false;
  }

  log(`  ✓ Registered new channel: ${channel.name} (${info.channelId})`);
  return true;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  log('========================================');
  log('YouTube DIY Channel Registration');
  log('========================================');
  log(`Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
  log('');

  // Validate configuration
  if (!options.dryRun && (!SUPABASE_URL || !SUPABASE_SERVICE_KEY)) {
    logError('SUPABASE_URL and SUPABASE_SERVICE_KEY are required (or use --dry-run)');
    process.exit(1);
  }

  // Initialize Supabase client
  const supabase = options.dryRun
    ? null
    : createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Filter channels if single channel specified
  const channelsToProcess = options.singleChannel
    ? DIY_CHANNELS.filter(c => c.handle.toLowerCase() === options.singleChannel.toLowerCase())
    : DIY_CHANNELS;

  if (channelsToProcess.length === 0) {
    logError(`Channel not found: ${options.singleChannel}`);
    process.exit(1);
  }

  log(`Processing ${channelsToProcess.length} channels...`);
  log('');

  // Track statistics
  const stats = {
    processed: 0,
    registered: 0,
    updated: 0,
    failed: 0
  };

  // Process each channel
  for (const channel of channelsToProcess) {
    log(`[${stats.processed + 1}/${channelsToProcess.length}] ${channel.name} (@${channel.handle})`);
    
    // Fetch channel info
    const info = await fetchChannelInfo(channel.handle);
    
    if (!info) {
      stats.failed++;
      stats.processed++;
      log(`  ✗ Failed to fetch channel info`);
      log('');
      continue;
    }

    logVerbose(`  Channel ID: ${info.channelId}`);
    logVerbose(`  Subscribers: ${info.subscriberCount || 'unknown'}`);

    if (options.dryRun) {
      log(`  [DRY RUN] Would register channel:`);
      log(`    - ID: ${info.channelId}`);
      log(`    - Tier: ${channel.tier}`);
      log(`    - Focus: ${channel.contentFocus.join(', ')}`);
      stats.registered++;
    } else {
      const success = await registerChannel(supabase, channel, info);
      if (success) {
        stats.registered++;
      } else {
        stats.failed++;
      }
    }

    stats.processed++;
    log('');

    // Rate limiting between requests
    await new Promise(r => setTimeout(r, 500));
  }

  // Print summary
  log('========================================');
  log('Registration Complete');
  log('========================================');
  log(`Processed:  ${stats.processed}`);
  log(`Registered: ${stats.registered}`);
  log(`Failed:     ${stats.failed}`);

  if (options.dryRun) {
    log('');
    log('[DRY RUN] No changes were made to the database');
  }

  // Return stats for programmatic use
  return stats;
}

// Run if called directly
main().catch(error => {
  logError('Fatal error:', error);
  process.exit(1);
});

export { DIY_CHANNELS, fetchChannelInfo };
