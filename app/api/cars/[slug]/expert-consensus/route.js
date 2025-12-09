import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/cars/[slug]/expert-consensus
 * 
 * Returns aggregated expert consensus data for a specific car.
 * Includes category sentiments, strength/weakness tags, and review count.
 */
export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Car slug is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ 
        consensus: null,
        message: 'Database not configured' 
      });
    }

    // Fetch car's consensus data
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select(`
        slug,
        name,
        expert_review_count,
        expert_consensus_summary,
        external_consensus
      `)
      .eq('slug', slug)
      .single();

    if (carError || !car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    // Fetch aggregated data from video links
    const { data: links, error: linksError } = await supabase
      .from('youtube_video_car_links')
      .select(`
        sentiment_sound,
        sentiment_interior,
        sentiment_track,
        sentiment_reliability,
        sentiment_value,
        sentiment_driver_fun,
        sentiment_aftermarket,
        overall_sentiment,
        stock_strength_tags,
        stock_weakness_tags
      `)
      .eq('car_slug', slug);

    if (linksError) {
      console.error('[expert-consensus] Error fetching links:', linksError);
    }

    // Aggregate sentiments
    const categoryMeans = {};
    const categories = ['sound', 'interior', 'track', 'reliability', 'value', 'driver_fun', 'aftermarket'];
    
    for (const cat of categories) {
      const key = `sentiment_${cat}`;
      const values = (links || [])
        .map(l => l[key])
        .filter(v => v !== null && v !== undefined);
      
      if (values.length > 0) {
        categoryMeans[cat] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    }

    // Aggregate strength/weakness tags
    const strengthCounts = {};
    const weaknessCounts = {};
    
    for (const link of (links || [])) {
      for (const tag of (link.stock_strength_tags || [])) {
        strengthCounts[tag] = (strengthCounts[tag] || 0) + 1;
      }
      for (const tag of (link.stock_weakness_tags || [])) {
        weaknessCounts[tag] = (weaknessCounts[tag] || 0) + 1;
      }
    }

    // Convert to sorted arrays
    const strengths = Object.entries(strengthCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const weaknesses = Object.entries(weaknessCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      slug: car.slug,
      name: car.name,
      reviewCount: car.expert_review_count || links?.length || 0,
      summary: car.expert_consensus_summary,
      consensus: {
        categoryMeans,
        strengths,
        weaknesses,
        ...(car.external_consensus || {})
      }
    });

  } catch (error) {
    console.error('[expert-consensus] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

