/**
 * DIY Videos Search API
 * 
 * Searches for DIY installation tutorial videos using the Exa API.
 * Results are filtered to YouTube videos and cached to reduce API costs.
 * 
 * POST /api/diy-videos/search
 * Body: { carName, category, limit }
 * 
 * Returns: { videos: [...], source: 'exa' | 'cache' | 'error' }
 */

import { NextResponse } from 'next/server';

import { withErrorLogging } from '@/lib/serverErrorLogger';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const EXA_API_KEY = process.env.EXA_API_KEY;
const CACHE_TTL_DAYS = 7;

/**
 * Extract YouTube video ID from URL
 */
function extractVideoId(url) {
  if (!url) return null;
  
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

/**
 * Check cache for existing results
 */
async function checkCache(carName, category, limit) {
  if (!isSupabaseConfigured) return [];
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CACHE_TTL_DAYS);
    
    const { data, error } = await supabase
      .from('diy_video_cache')
      .select('video_id, title, channel_name, thumbnail_url, duration_seconds')
      .eq('car_name', carName.toLowerCase())
      .eq('category', category.toLowerCase())
      .gte('cached_at', cutoffDate.toISOString())
      .order('cached_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('[diy-videos/search] Cache check error:', error);
      return [];
    }
    
    return (data || []).map(v => ({
      videoId: v.video_id,
      title: v.title,
      channelName: v.channel_name,
      thumbnailUrl: v.thumbnail_url || `https://img.youtube.com/vi/${v.video_id}/mqdefault.jpg`,
      durationSeconds: v.duration_seconds,
    }));
  } catch (err) {
    console.error('[diy-videos/search] Cache error:', err);
    return [];
  }
}

/**
 * Save results to cache
 */
async function saveToCache(carName, category, videos) {
  if (!isSupabaseConfigured || videos.length === 0) return;
  
  try {
    const records = videos.map(v => ({
      video_id: v.videoId,
      car_name: carName.toLowerCase(),
      category: category.toLowerCase(),
      title: v.title,
      channel_name: v.channelName,
      thumbnail_url: v.thumbnailUrl,
      duration_seconds: v.durationSeconds || null,
      cached_at: new Date().toISOString(),
    }));
    
    const { error } = await supabase
      .from('diy_video_cache')
      .upsert(records, { 
        onConflict: 'video_id,car_name,category',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error('[diy-videos/search] Cache save error:', error);
    }
  } catch (err) {
    console.error('[diy-videos/search] Save cache error:', err);
  }
}

/**
 * Search Exa API for DIY videos
 * @returns {Object} { videos: [], error: string|null }
 */
async function searchExa(carName, category, limit) {
  if (!EXA_API_KEY) {
    console.warn('[diy-videos/search] EXA_API_KEY not configured');
    return { videos: [], error: 'api_not_configured' };
  }
  
  // Build a more targeted search query
  const searchQuery = `${carName} ${category} install tutorial`;
  
  console.log('[diy-videos/search] Searching Exa:', { carName, category, query: searchQuery });
  
  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY,
      },
      body: JSON.stringify({
        query: searchQuery,
        numResults: limit * 2,
        type: 'auto',
        includeDomains: ['youtube.com'],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[diy-videos/search] Exa API error:', response.status, errorText.substring(0, 300));
      
      // Parse specific error types
      if (response.status === 402 || errorText.includes('credits') || errorText.includes('NO_MORE_CREDITS')) {
        return { videos: [], error: 'credits_exhausted' };
      }
      if (response.status === 401 || response.status === 403) {
        return { videos: [], error: 'api_auth_error' };
      }
      return { videos: [], error: 'api_error' };
    }
    
    const data = await response.json();
    const results = data.results || [];
    
    console.log('[diy-videos/search] Exa returned', results.length, 'results');
    
    // Extract videos - be more lenient with filtering since Exa already handles relevance
    const videos = [];
    const seenIds = new Set();
    
    for (const result of results) {
      const videoId = extractVideoId(result.url);
      if (!videoId || seenIds.has(videoId)) continue;
      
      const title = result.title || '';
      
      seenIds.add(videoId);
      videos.push({
        videoId,
        title,
        channelName: result.author || null,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        durationSeconds: null,
      });
      
      if (videos.length >= limit) break;
    }
    
    console.log('[diy-videos/search] Returning', videos.length, 'videos');
    
    return { videos, error: null };
  } catch (err) {
    console.error('[diy-videos/search] Exa search error:', err);
    return { videos: [], error: 'search_failed' };
  }
}

async function handlePost(request) {
  try {
    const body = await request.json();
    const { carName, category, limit = 5 } = body;
    
    // Validate input
    if (!carName || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: carName, category', videos: [] },
        { status: 400 }
      );
    }
    
    const safeLimit = Math.min(Math.max(limit, 1), 10);
    
    // 1. Check cache first
    const cachedVideos = await checkCache(carName, category, safeLimit);
    if (cachedVideos.length >= safeLimit) {
      return NextResponse.json({
        videos: cachedVideos.slice(0, safeLimit),
        source: 'cache',
      });
    }
    
    // 2. Search Exa API
    const { videos: exaVideos, error: exaError } = await searchExa(carName, category, safeLimit);
    
    // 3. Handle specific API errors with helpful messages
    if (exaError === 'api_not_configured') {
      return NextResponse.json({
        videos: cachedVideos,
        source: 'cache',
        errorCode: 'api_not_configured',
        warning: 'Video search API not configured.',
      });
    }
    
    if (exaError === 'credits_exhausted') {
      return NextResponse.json({
        videos: cachedVideos,
        source: 'cache',
        errorCode: 'credits_exhausted',
        warning: 'Video search credits exhausted. Use the YouTube link below.',
      });
    }
    
    if (exaError) {
      return NextResponse.json({
        videos: cachedVideos,
        source: 'cache',
        errorCode: exaError,
        warning: 'Video search temporarily unavailable.',
      });
    }
    
    // 4. Cache the results
    if (exaVideos.length > 0) {
      await saveToCache(carName, category, exaVideos);
    }
    
    // 5. Combine and dedupe
    const seenIds = new Set(cachedVideos.map(v => v.videoId));
    const combined = [...cachedVideos];
    
    for (const video of exaVideos) {
      if (!seenIds.has(video.videoId)) {
        combined.push(video);
        seenIds.add(video.videoId);
      }
    }
    
    return NextResponse.json({
      videos: combined.slice(0, safeLimit),
      source: exaVideos.length > 0 ? 'exa' : 'cache',
    });
    
  } catch (err) {
    console.error('[diy-videos/search] Handler error:', err);
    return NextResponse.json(
      { error: 'Internal server error', videos: [] },
      { status: 500 }
    );
  }
}

export const POST = withErrorLogging(handlePost, { 
  route: 'diy-videos/search', 
  feature: 'garage' 
});

// Allow preflight for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
