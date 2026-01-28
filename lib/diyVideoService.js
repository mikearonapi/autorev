/**
 * DIY Video Service
 * 
 * Finds DIY installation tutorial videos using a hybrid approach:
 * 1. First, query existing youtube_videos table for matching content
 * 2. Then, check diy_video_cache for previously found videos
 * 3. Finally, fall back to Exa API search for fresh results
 * 
 * This minimizes API costs while providing relevant content.
 * 
 * @module lib/diyVideoService
 */

import { supabase, isSupabaseConfigured } from './supabase.js';

// Cache duration for DIY videos (7 days)
const CACHE_TTL_DAYS = 7;

/**
 * Get DIY installation videos for a car + upgrade category
 * 
 * Uses priority order:
 * 1. youtube_videos table (existing expert reviews that match)
 * 2. diy_video_cache table (previously searched results)
 * 3. Exa API (fresh search, cached for future)
 * 
 * @param {string} carName - Vehicle name (e.g., "2020 Ford Mustang GT")
 * @param {string} category - Upgrade category (e.g., "intake", "exhaust", "suspension")
 * @param {Object} options - Options
 * @param {number} options.limit - Max videos to return (default: 5)
 * @param {boolean} options.skipExaSearch - Skip Exa API (client-side only)
 * @returns {Promise<{videos: Array, source: string}>}
 */
export async function getDIYVideos(carName, category, options = {}) {
  const { limit = 5, skipExaSearch = false } = options;
  
  if (!carName || !category) {
    return { videos: [], source: 'none' };
  }
  
  // Normalize inputs
  const normalizedCarName = carName.toLowerCase().trim();
  const normalizedCategory = category.toLowerCase().trim();
  
  // Build search terms
  const searchTerms = buildSearchTerms(normalizedCarName, normalizedCategory);
  
  // 1. Try youtube_videos table first (existing enriched data)
  const existingVideos = await searchExistingVideos(searchTerms, limit);
  if (existingVideos.length >= limit) {
    return { videos: existingVideos.slice(0, limit), source: 'youtube_videos' };
  }
  
  // 2. Check diy_video_cache
  const cachedVideos = await getCachedDIYVideos(normalizedCarName, normalizedCategory, limit);
  if (cachedVideos.length > 0) {
    // Merge with existing, dedupe
    const combined = dedupeVideos([...existingVideos, ...cachedVideos]);
    if (combined.length >= limit) {
      return { videos: combined.slice(0, limit), source: 'cache' };
    }
  }
  
  // 3. Fall back to Exa API (if not client-side)
  if (!skipExaSearch) {
    try {
      const exaVideos = await searchExaForDIYVideos(carName, category, limit);
      
      // Cache the results
      if (exaVideos.length > 0) {
        await cacheDIYVideos(normalizedCarName, normalizedCategory, exaVideos);
      }
      
      // Merge all sources, dedupe
      const combined = dedupeVideos([...existingVideos, ...cachedVideos, ...exaVideos]);
      return { videos: combined.slice(0, limit), source: 'exa' };
    } catch (err) {
      console.error('[diyVideoService] Exa search failed:', err);
      // Return whatever we have
      const combined = dedupeVideos([...existingVideos, ...cachedVideos]);
      return { videos: combined.slice(0, limit), source: 'partial' };
    }
  }
  
  // Return whatever we have (client-side mode)
  const combined = dedupeVideos([...existingVideos, ...cachedVideos]);
  return { videos: combined.slice(0, limit), source: 'partial' };
}

/**
 * Build search terms from car name and category
 */
function buildSearchTerms(carName, category) {
  // Extract key parts from car name
  // "2020 ford mustang gt" -> ["mustang", "gt", "ford"]
  const carParts = carName
    .replace(/\d{4}/g, '') // Remove year
    .split(/\s+/)
    .filter(p => p.length > 1);
  
  // Map category to common search variations
  const categoryVariations = {
    'intake': ['intake', 'cold air intake', 'cai'],
    'exhaust': ['exhaust', 'cat-back', 'axle-back', 'headers'],
    'suspension': ['suspension', 'coilovers', 'lowering springs', 'sway bars'],
    'tune': ['tune', 'tuning', 'flash tune', 'piggyback'],
    'turbo': ['turbo', 'turbocharger', 'turbo kit'],
    'supercharger': ['supercharger', 'blower', 'supercharger kit'],
    'brakes': ['brakes', 'brake pads', 'rotors', 'big brake kit'],
    'wheels': ['wheels', 'wheel install', 'tire mount'],
    'intercooler': ['intercooler', 'fmic', 'top mount'],
    'downpipe': ['downpipe', 'dp install', 'catted downpipe'],
    'headers': ['headers', 'header install', 'long tube headers'],
  };
  
  const categoryTerms = categoryVariations[category] || [category];
  
  return {
    carParts,
    categoryTerms,
    fullQuery: `${carName} ${category} install`,
    simpleQuery: `${carParts.slice(0, 2).join(' ')} ${category} install tutorial`,
  };
}

/**
 * Search existing youtube_videos table for matching DIY content
 */
async function searchExistingVideos(searchTerms, limit) {
  if (!isSupabaseConfigured) return [];
  
  try {
    // Search for videos that match car + category in title
    const { data, error } = await supabase
      .from('youtube_videos')
      .select('video_id, title, channel_name, thumbnail_url, duration_seconds')
      .or(searchTerms.categoryTerms.map(t => `title.ilike.%${t}%`).join(','))
      .or(searchTerms.carParts.map(p => `title.ilike.%${p}%`).join(','))
      .order('published_at', { ascending: false })
      .limit(limit * 2); // Get extra to filter
    
    if (error) {
      console.error('[diyVideoService] Error searching youtube_videos:', error);
      return [];
    }
    
    // Filter to those that look like install tutorials
    const filtered = (data || []).filter(v => {
      const title = v.title?.toLowerCase() || '';
      return (
        title.includes('install') ||
        title.includes('how to') ||
        title.includes('diy') ||
        title.includes('tutorial') ||
        title.includes('guide')
      );
    });
    
    return filtered.slice(0, limit).map(normalizeVideo);
  } catch (err) {
    console.error('[diyVideoService] searchExistingVideos error:', err);
    return [];
  }
}

/**
 * Get cached DIY videos from diy_video_cache table
 */
async function getCachedDIYVideos(carName, category, limit) {
  if (!isSupabaseConfigured) return [];
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CACHE_TTL_DAYS);
    
    const { data, error } = await supabase
      .from('diy_video_cache')
      .select('video_id, title, channel_name, thumbnail_url, duration_seconds')
      .eq('car_name', carName)
      .eq('category', category)
      .gte('cached_at', cutoffDate.toISOString())
      .order('cached_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        console.warn('[diyVideoService] diy_video_cache table not found');
        return [];
      }
      console.error('[diyVideoService] Error fetching cached videos:', error);
      return [];
    }
    
    return (data || []).map(normalizeVideo);
  } catch (err) {
    console.error('[diyVideoService] getCachedDIYVideos error:', err);
    return [];
  }
}

/**
 * Search Exa API for DIY videos
 * NOTE: This should only be called server-side via API route
 */
async function searchExaForDIYVideos(carName, category, limit) {
  // This is a placeholder - actual Exa search happens in the API route
  // Client-side code should call /api/diy-videos/search instead
  
  if (typeof window !== 'undefined') {
    // Client-side - use API route
    try {
      const response = await fetch('/api/diy-videos/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carName, category, limit }),
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      return data.videos || [];
    } catch (err) {
      console.error('[diyVideoService] API call failed:', err);
      return [];
    }
  }
  
  // Server-side - shouldn't reach here, Exa search happens in API route
  return [];
}

/**
 * Cache DIY videos for future use
 */
async function cacheDIYVideos(carName, category, videos) {
  if (!isSupabaseConfigured || videos.length === 0) return;
  
  try {
    const records = videos.map(v => ({
      video_id: v.videoId || v.video_id,
      car_name: carName,
      category: category,
      title: v.title,
      channel_name: v.channelName || v.channel_name,
      thumbnail_url: v.thumbnailUrl || v.thumbnail_url,
      duration_seconds: v.durationSeconds || v.duration_seconds,
      cached_at: new Date().toISOString(),
    }));
    
    // Upsert to handle duplicates
    const { error } = await supabase
      .from('diy_video_cache')
      .upsert(records, { 
        onConflict: 'video_id,car_name,category',
        ignoreDuplicates: false 
      });
    
    if (error) {
      // Table might not exist yet
      if (error.code !== '42P01') {
        console.error('[diyVideoService] Error caching videos:', error);
      }
    }
  } catch (err) {
    console.error('[diyVideoService] cacheDIYVideos error:', err);
  }
}

/**
 * Normalize video object to consistent format
 */
function normalizeVideo(video) {
  return {
    videoId: video.video_id || video.videoId,
    title: video.title,
    channelName: video.channel_name || video.channelName,
    thumbnailUrl: video.thumbnail_url || video.thumbnailUrl || 
      `https://img.youtube.com/vi/${video.video_id || video.videoId}/mqdefault.jpg`,
    durationSeconds: video.duration_seconds || video.durationSeconds,
  };
}

/**
 * Remove duplicate videos by videoId
 */
function dedupeVideos(videos) {
  const seen = new Set();
  return videos.filter(v => {
    const id = v.videoId || v.video_id;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/**
 * Extract YouTube video ID from URL
 */
export function extractVideoId(url) {
  if (!url) return null;
  
  // Already an ID (11 chars, alphanumeric + dash/underscore)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }
  
  // Various YouTube URL formats
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

const diyVideoService = {
  getDIYVideos,
  extractVideoId,
};

export default diyVideoService;
