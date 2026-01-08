/**
 * YouTube Enrichment Client
 * 
 * Provides database operations for the YouTube expert review enrichment system.
 * Handles channel whitelist, video metadata, car links, and consensus aggregation.
 * 
 * @module lib/youtubeClient
 */

import { supabase, isSupabaseConfigured } from './supabase.js';

// ============================================================================
// CHANNEL OPERATIONS
// ============================================================================

/**
 * Fetch all active YouTube channels from the whitelist
 * @param {Object} options - Query options
 * @param {string} [options.tier] - Filter by credibility tier ('tier1', 'tier2', 'tier3')
 * @param {boolean} [options.activeOnly=true] - Only return active channels
 * @returns {Promise<Array>} Array of channel objects
 */
export async function fetchChannels({ tier, activeOnly = true } = {}) {
  if (!isSupabaseConfigured) {
    console.warn('[youtubeClient] Supabase not configured, returning empty channels');
    return [];
  }

  let query = supabase
    .from('youtube_channels')
    .select('*')
    .order('credibility_tier', { ascending: true })
    .order('channel_name', { ascending: true });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  if (tier) {
    query = query.eq('credibility_tier', tier);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[youtubeClient] Error fetching channels:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a channel by ID
 * @param {string} channelId - YouTube channel ID
 * @returns {Promise<Object|null>} Channel object or null
 */
export async function getChannelById(channelId) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('youtube_channels')
    .select('*')
    .eq('channel_id', channelId)
    .single();

  if (error) {
    console.error('[youtubeClient] Error fetching channel:', error);
    return null;
  }

  return data;
}

/**
 * Update channel stats after ingestion run
 * @param {string} channelId - YouTube channel ID
 * @param {Object} stats - Stats to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateChannelStats(channelId, stats) {
  if (!isSupabaseConfigured) return false;

  const { error } = await supabase
    .from('youtube_channels')
    .update({
      ...stats,
      last_crawled_at: new Date().toISOString()
    })
    .eq('channel_id', channelId);

  if (error) {
    console.error('[youtubeClient] Error updating channel stats:', error);
    return false;
  }

  return true;
}

// ============================================================================
// VIDEO OPERATIONS
// ============================================================================

/**
 * Insert or update a video record
 * @param {Object} video - Video data
 * @returns {Promise<Object|null>} Inserted/updated video or null
 */
export async function upsertVideo(video) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('youtube_videos')
    .upsert(video, { onConflict: 'video_id' })
    .select()
    .single();

  if (error) {
    console.error('[youtubeClient] Error upserting video:', error);
    return null;
  }

  return data;
}

/**
 * Get a video by ID
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object|null>} Video object or null
 */
export async function getVideoById(videoId) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('youtube_videos')
    .select('*')
    .eq('video_id', videoId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[youtubeClient] Error fetching video:', error);
  }

  return data || null;
}

/**
 * Fetch videos for a specific car
 * @param {string} carSlug - Car slug
 * @param {Object} options - Query options
 * @param {number} [options.limit=5] - Maximum videos to return
 * @param {string} [options.role] - Filter by role ('primary', 'comparison', 'mention')
 * @param {boolean} [options.editorsPickOnly=false] - Only return editor's picks
 * @returns {Promise<Array>} Array of videos with link metadata
 */
export async function fetchVideosForCar(carSlug, { limit = 5, role, editorsPickOnly = false } = {}) {
  if (!isSupabaseConfigured) return [];

  // Query the join table with video details
  let query = supabase
    .from('youtube_video_car_links')
    .select(`
      *,
      youtube_videos!inner (
        id,
        video_id,
        url,
        title,
        thumbnail_url,
        channel_name,
        published_at,
        duration_seconds,
        view_count,
        content_type,
        summary,
        one_line_take,
        key_points,
        pros_mentioned,
        cons_mentioned,
        notable_quotes,
        quality_score,
        is_editors_pick
      )
    `)
    .eq('car_slug', carSlug)
    .order('match_confidence', { ascending: false })
    .limit(limit);

  if (role) {
    query = query.eq('role', role);
  }

  if (editorsPickOnly) {
    query = query.eq('youtube_videos.is_editors_pick', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[youtubeClient] Error fetching videos for car:', error);
    return [];
  }

  return data || [];
}

/**
 * Fetch videos pending processing
 * @param {number} limit - Maximum videos to return
 * @returns {Promise<Array>} Array of pending videos
 */
export async function fetchPendingVideos(limit = 10) {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('youtube_videos')
    .select('*')
    .in('processing_status', ['pending', 'transcript_fetched'])
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[youtubeClient] Error fetching pending videos:', error);
    return [];
  }

  return data || [];
}

/**
 * Update video processing status
 * @param {string} videoId - YouTube video ID
 * @param {string} status - New status
 * @param {Object} [additionalData] - Additional fields to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateVideoStatus(videoId, status, additionalData = {}) {
  if (!isSupabaseConfigured) return false;

  const updatePayload = {
    processing_status: status,
    ...additionalData
  };

  if (status === 'processed') {
    updatePayload.processed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('youtube_videos')
    .update(updatePayload)
    .eq('video_id', videoId);

  if (error) {
    console.error('[youtubeClient] Error updating video status:', error);
    return false;
  }

  return true;
}

// ============================================================================
// CAR LINK OPERATIONS
// ============================================================================

/**
 * Create or update a video-car link
 * @param {Object} link - Link data
 * @returns {Promise<Object|null>} Created/updated link or null
 */
export async function upsertVideoCarLink(link) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('youtube_video_car_links')
    .upsert(link, { onConflict: 'video_id,car_slug' })
    .select()
    .single();

  if (error) {
    console.error('[youtubeClient] Error upserting video-car link:', error);
    return null;
  }

  return data;
}

/**
 * Get all car links for a video
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Array>} Array of car links
 */
export async function getLinksForVideo(videoId) {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('youtube_video_car_links')
    .select('*')
    .eq('video_id', videoId);

  if (error) {
    console.error('[youtubeClient] Error fetching links for video:', error);
    return [];
  }

  return data || [];
}

/**
 * Get comparison videos where multiple specific cars appear together
 * @param {string[]} carSlugs - Array of car slugs (2+)
 * @returns {Promise<Array>} Array of videos with both cars
 */
export async function getComparisonVideos(carSlugs) {
  if (!isSupabaseConfigured || carSlugs.length < 2) return [];

  // First, get video IDs that contain the first car
  const { data: firstCarLinks } = await supabase
    .from('youtube_video_car_links')
    .select('video_id')
    .eq('car_slug', carSlugs[0])
    .in('role', ['primary', 'comparison']);

  if (!firstCarLinks || firstCarLinks.length === 0) return [];

  const videoIds = firstCarLinks.map(l => l.video_id);

  // Then find which of those also contain the second car
  const { data: comparisonLinks, error } = await supabase
    .from('youtube_video_car_links')
    .select(`
      *,
      youtube_videos!inner (
        id,
        video_id,
        url,
        title,
        channel_name,
        summary,
        content_type
      )
    `)
    .eq('car_slug', carSlugs[1])
    .in('video_id', videoIds)
    .in('role', ['primary', 'comparison']);

  if (error) {
    console.error('[youtubeClient] Error fetching comparison videos:', error);
    return [];
  }

  return comparisonLinks || [];
}

// ============================================================================
// CONSENSUS AGGREGATION
// ============================================================================

/**
 * Calculate external consensus for a car based on linked videos
 * @param {string} carSlug - Car slug
 * @returns {Promise<Object>} Consensus data
 */
export async function calculateCarConsensus(carSlug) {
  if (!isSupabaseConfigured) return null;

  // Fetch all links for this car with video quality info
  const { data: links, error } = await supabase
    .from('youtube_video_car_links')
    .select(`
      *,
      youtube_videos!inner (
        quality_score,
        processing_status,
        stock_strengths,
        stock_weaknesses
      ),
      youtube_channels!inner (
        credibility_tier
      )
    `)
    .eq('car_slug', carSlug)
    .eq('youtube_videos.processing_status', 'processed');

  if (error || !links || links.length === 0) {
    return {
      reviewCount: 0,
      categories: {},
      strengths: [],
      weaknesses: [],
      comparisons: []
    };
  }

  // Define weighting by tier
  const tierWeights = { tier1: 1.0, tier2: 0.7, tier3: 0.5 };

  // Aggregate category sentiments
  const categories = {};
  const categoryFields = [
    'sentiment_sound', 'sentiment_interior', 'sentiment_track',
    'sentiment_reliability', 'sentiment_value', 'sentiment_driver_fun',
    'sentiment_aftermarket'
  ];

  for (const field of categoryFields) {
    const categoryKey = field.replace('sentiment_', '');
    const values = [];
    
    for (const link of links) {
      if (link[field] !== null) {
        const weight = tierWeights[link.youtube_channels?.credibility_tier] || 0.5;
        values.push({ value: link[field], weight });
      }
    }

    if (values.length > 0) {
      const weightedSum = values.reduce((sum, v) => sum + v.value * v.weight, 0);
      const weightSum = values.reduce((sum, v) => sum + v.weight, 0);
      const mean = weightedSum / weightSum;
      
      // Calculate variance
      const variance = values.reduce((sum, v) => 
        sum + Math.pow(v.value - mean, 2) * v.weight, 0) / weightSum;

      categories[categoryKey] = {
        mean: Math.round(mean * 100) / 100,
        count: values.length,
        variance: Math.round(variance * 100) / 100,
        agreement: variance < 0.1 ? 'strong' : variance < 0.3 ? 'moderate' : 'weak'
      };
    }
  }

  // Aggregate strength/weakness tags
  const strengthCounts = {};
  const weaknessCounts = {};

  for (const link of links) {
    for (const tag of (link.stock_strength_tags || [])) {
      strengthCounts[tag] = (strengthCounts[tag] || 0) + 1;
    }
    for (const tag of (link.stock_weakness_tags || [])) {
      weaknessCounts[tag] = (weaknessCounts[tag] || 0) + 1;
    }
  }

  const strengths = Object.entries(strengthCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const weaknesses = Object.entries(weaknessCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Aggregate comparison slugs
  const comparisonCounts = {};
  for (const link of links) {
    for (const slug of (link.compared_to_slugs || [])) {
      comparisonCounts[slug] = (comparisonCounts[slug] || 0) + 1;
    }
  }

  const comparisons = Object.entries(comparisonCounts)
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    reviewCount: links.length,
    categories,
    strengths,
    weaknesses,
    comparisons
  };
}

/**
 * Update a car's external consensus fields
 * @param {string} carSlug - Car slug
 * @param {Object} consensus - Consensus data from calculateCarConsensus
 * @returns {Promise<boolean>} Success status
 */
export async function updateCarConsensus(carSlug, consensus) {
  if (!isSupabaseConfigured) return false;

  // Calculate score adjustments from sentiment means
  const adjustments = {};
  const adjustmentCap = 0.5;

  for (const [category, data] of Object.entries(consensus.categories || {})) {
    if (data.mean !== undefined) {
      // Convert -1 to +1 sentiment to bounded adjustment
      // Strong consensus (low variance) gets full adjustment
      const agreementMultiplier = data.agreement === 'strong' ? 1.0 : 
                                  data.agreement === 'moderate' ? 0.7 : 0.4;
      const rawAdjustment = data.mean * adjustmentCap * agreementMultiplier;
      adjustments[`score_adj_${category}`] = Math.max(-adjustmentCap, Math.min(adjustmentCap, rawAdjustment));
    }
  }

  // Generate summary sentence
  const summaryParts = [];
  if (consensus.strengths.length > 0) {
    const topStrengths = consensus.strengths.slice(0, 2).map(s => s.tag);
    summaryParts.push(`Praised for ${topStrengths.join(' and ')}`);
  }
  if (consensus.weaknesses.length > 0) {
    const topWeaknesses = consensus.weaknesses.slice(0, 2).map(w => w.tag);
    summaryParts.push(`watch for ${topWeaknesses.join(' and ')}`);
  }
  const summary = summaryParts.length > 0 ? summaryParts.join('; ') : null;

  const { error } = await supabase
    .from('cars')
    .update({
      external_consensus: consensus,
      expert_review_count: consensus.reviewCount,
      expert_consensus_summary: summary,
      ...adjustments
    })
    .eq('slug', carSlug);

  if (error) {
    console.error('[youtubeClient] Error updating car consensus:', error);
    return false;
  }

  return true;
}

// ============================================================================
// INGESTION QUEUE OPERATIONS
// ============================================================================

/**
 * Add a video to the ingestion queue
 * @param {Object} queueItem - Queue item data
 * @returns {Promise<Object|null>} Created queue item or null
 */
export async function addToIngestionQueue(queueItem) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('youtube_ingestion_queue')
    .upsert(queueItem, { onConflict: 'video_id' })
    .select()
    .single();

  if (error) {
    console.error('[youtubeClient] Error adding to queue:', error);
    return null;
  }

  return data;
}

/**
 * Get next items from ingestion queue
 * @param {number} limit - Maximum items to return
 * @returns {Promise<Array>} Array of queue items
 */
export async function getNextQueueItems(limit = 10) {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('youtube_ingestion_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('discovered_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[youtubeClient] Error fetching queue items:', error);
    return [];
  }

  return data || [];
}

/**
 * Update queue item status
 * @param {string} videoId - YouTube video ID
 * @param {string} status - New status
 * @param {Object} [additionalData] - Additional fields to update
 * @returns {Promise<boolean>} Success status
 */
export async function updateQueueStatus(videoId, status, additionalData = {}) {
  if (!isSupabaseConfigured) return false;

  const updatePayload = {
    status,
    attempts: supabase.raw('attempts + 1'),
    ...additionalData
  };

  if (status === 'completed' || status === 'failed' || status === 'skipped') {
    updatePayload.processed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('youtube_ingestion_queue')
    .update(updatePayload)
    .eq('video_id', videoId);

  if (error) {
    console.error('[youtubeClient] Error updating queue status:', error);
    return false;
  }

  return true;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract YouTube video ID from various URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null
 */
export function extractVideoId(url) {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // If it's already just an ID (11 chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  return null;
}

/**
 * Build YouTube video URL from ID
 * @param {string} videoId - YouTube video ID
 * @returns {string} Full YouTube URL
 */
export function buildVideoUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Build YouTube embed URL for iframe
 * @param {string} videoId - YouTube video ID
 * @param {Object} options - Embed options
 * @param {number} [options.start] - Start time in seconds
 * @param {boolean} [options.autoplay=false] - Autoplay video
 * @returns {string} Embed URL
 */
export function buildEmbedUrl(videoId, { start, autoplay = false } = {}) {
  const params = new URLSearchParams();
  if (start) params.set('start', start.toString());
  if (autoplay) params.set('autoplay', '1');
  params.set('rel', '0'); // Don't show related videos
  
  const queryString = params.toString();
  return `https://www.youtube.com/embed/${videoId}${queryString ? '?' + queryString : ''}`;
}

/**
 * Format video duration from seconds
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "12:34" or "1:02:34")
 */
export function formatDuration(seconds) {
  if (!seconds) return '';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

const youtubeClient = {
  // Channels
  fetchChannels,
  getChannelById,
  updateChannelStats,
  // Videos
  upsertVideo,
  getVideoById,
  fetchVideosForCar,
  fetchPendingVideos,
  updateVideoStatus,
  // Car Links
  upsertVideoCarLink,
  getLinksForVideo,
  getComparisonVideos,
  // Consensus
  calculateCarConsensus,
  updateCarConsensus,
  // Queue
  addToIngestionQueue,
  getNextQueueItems,
  updateQueueStatus,
  // Utilities
  extractVideoId,
  buildVideoUrl,
  buildEmbedUrl,
  formatDuration
};

export default youtubeClient;






