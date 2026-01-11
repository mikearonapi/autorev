import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { resolveCarId } from '@/lib/carResolver';

// Tier 1 channels - highest trust
const TIER_1_CHANNELS = [
  'Throttle House',
  'SavageGeese',
  'carwow',
  'Car Wow',
  'Doug DeMuro',
  'Donut Media'
];

/**
 * GET /api/cars/[slug]/expert-reviews
 * 
 * Fetches expert review videos for a specific car.
 * Returns videos with summaries, quotes, and metadata.
 * 
 * Query params:
 * - limit: Max videos to return (default: 10)
 * - role: Filter by role (primary, comparison, mention)
 * - min_confidence: Minimum match confidence (0-1)
 * - tier1_only: Only return Tier 1 channel videos
 * 
 * Updated 2026-01-11: Uses car_id for queries (car_slug column removed from youtube_video_car_links)
 */
async function handleGet(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    
    // Parse query params
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);
    const role = searchParams.get('role');
    const minConfidence = parseFloat(searchParams.get('min_confidence') || '0');
    const tier1Only = searchParams.get('tier1_only') === 'true';

    if (!slug) {
      return NextResponse.json(
        { error: 'Car slug is required' },
        { status: 400 }
      );
    }

    // If Supabase isn't configured, return empty result
    if (!isSupabaseConfigured) {
      return NextResponse.json({ 
        videos: [],
        message: 'Database not configured' 
      });
    }

    // Resolve car_id for efficient query (car_slug column no longer exists)
    const carId = await resolveCarId(slug);
    if (!carId) {
      return NextResponse.json({ videos: [], count: 0, total: 0 });
    }

    // Build query using car_id
    let query = supabase
      .from('youtube_video_car_links')
      .select(`
        video_id,
        role,
        match_confidence,
        overall_sentiment,
        sentiment_sound,
        sentiment_interior,
        sentiment_track,
        sentiment_reliability,
        sentiment_value,
        sentiment_driver_fun,
        sentiment_aftermarket,
        stock_strength_tags,
        stock_weakness_tags,
        youtube_videos!inner (
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
          is_editors_pick,
          processing_status
        )
      `)
      .eq('car_id', carId)
      .eq('youtube_videos.processing_status', 'processed')
      .gte('match_confidence', minConfidence);

    // Apply role filter
    if (role) {
      query = query.eq('role', role);
    }

    // Apply limit and order
    const { data: links, error } = await query
      .order('match_confidence', { ascending: false })
      .limit(limit * 2); // Fetch extra to filter tier1 if needed

    if (error) {
      console.error('[expert-reviews] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Helper to determine trust tier
    const getTrustTier = (channelName) => {
      if (TIER_1_CHANNELS.some(t1 => channelName?.toLowerCase().includes(t1.toLowerCase()))) {
        return 1;
      }
      return 2;
    };

    // Transform and filter the data
    let videos = (links || []).map(link => {
      const videoData = link.youtube_videos;
      const trustTier = getTrustTier(videoData?.channel_name);
      
      return {
        video_id: link.video_id,
        role: link.role,
        match_confidence: link.match_confidence,
        overall_sentiment: link.overall_sentiment,
        category_sentiments: {
          sound: link.sentiment_sound,
          interior: link.sentiment_interior,
          track: link.sentiment_track,
          reliability: link.sentiment_reliability,
          value: link.sentiment_value,
          driverFun: link.sentiment_driver_fun,
          aftermarket: link.sentiment_aftermarket,
        },
        stock_strength_tags: link.stock_strength_tags || [],
        stock_weakness_tags: link.stock_weakness_tags || [],
        trust_tier: trustTier,
        trust_score: trustTier === 1 ? 0.9 : 0.7,
        youtube_videos: videoData
      };
    });

    // Filter to tier 1 only if requested
    if (tier1Only) {
      videos = videos.filter(v => v.trust_tier === 1);
    }

    // Sort: Tier 1 first, then editors picks, then by quality score and confidence
    videos.sort((a, b) => {
      // Tier 1 channels first
      if (a.trust_tier !== b.trust_tier) return a.trust_tier - b.trust_tier;
      
      // Editors picks next
      if (a.youtube_videos?.is_editors_pick && !b.youtube_videos?.is_editors_pick) return -1;
      if (!a.youtube_videos?.is_editors_pick && b.youtube_videos?.is_editors_pick) return 1;
      
      // Then by quality score
      const qualityDiff = (b.youtube_videos?.quality_score || 0) - (a.youtube_videos?.quality_score || 0);
      if (Math.abs(qualityDiff) > 0.1) return qualityDiff > 0 ? 1 : -1;
      
      // Then by match confidence
      return (b.match_confidence || 0) - (a.match_confidence || 0);
    });

    // Apply final limit
    videos = videos.slice(0, limit);

    return NextResponse.json({ 
      videos,
      count: videos.length,
      total: links?.length || 0
    });

  } catch (error) {
    console.error('[expert-reviews] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cars/[slug]/expert-reviews', feature: 'browse-cars' });






