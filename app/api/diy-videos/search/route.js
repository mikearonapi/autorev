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
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { withErrorLogging } from '@/lib/serverErrorLogger';

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
 */
async function searchExa(carName, category, limit) {
  if (!EXA_API_KEY) {
    console.warn('[diy-videos/search] EXA_API_KEY not configured');
    return [];
  }
  
  // Build search query
  const searchQuery = `${carName} ${category} install tutorial DIY how to`;
  
  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY,
      },
      body: JSON.stringify({
        query: searchQuery,
        numResults: limit * 3, // Request extra to filter
        type: 'auto',
        includeDomains: ['youtube.com'],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[diy-videos/search] Exa API error:', response.status, errorText.substring(0, 200));
      return [];
    }
    
    const data = await response.json();
    const results = data.results || [];
    
    // Filter and normalize results
    const videos = [];
    const seenIds = new Set();
    
    for (const result of results) {
      const videoId = extractVideoId(result.url);
      if (!videoId || seenIds.has(videoId)) continue;
      
      // Check if title looks like a tutorial
      const title = result.title || '';
      const titleLower = title.toLowerCase();
      const isLikelyTutorial = (
        titleLower.includes('install') ||
        titleLower.includes('how to') ||
        titleLower.includes('diy') ||
        titleLower.includes('tutorial') ||
        titleLower.includes('guide') ||
        titleLower.includes('step by step')
      );
      
      // Also check if title mentions the car
      const carParts = carName.toLowerCase().split(/\s+/).filter(p => p.length > 2);
      const mentionsCar = carParts.some(part => titleLower.includes(part));
      
      // Prioritize results that match both criteria
      if (!isLikelyTutorial && !mentionsCar) continue;
      
      seenIds.add(videoId);
      videos.push({
        videoId,
        title,
        channelName: result.author || null,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        durationSeconds: null, // Exa doesn't provide duration
      });
      
      if (videos.length >= limit) break;
    }
    
    return videos;
  } catch (err) {
    console.error('[diy-videos/search] Exa search error:', err);
    return [];
  }
}

async function handlePost(request) {
  try {
    const body = await request.json();
    const { carName, category, limit = 5 } = body;
    
    // Validate input
    if (!carName || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: carName, category' },
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
    const exaVideos = await searchExa(carName, category, safeLimit);
    
    // 3. Cache the results
    if (exaVideos.length > 0) {
      await saveToCache(carName, category, exaVideos);
    }
    
    // 4. Combine and dedupe
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
