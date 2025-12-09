import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/cars/expert-reviewed
 * 
 * Returns cars with the highest expert review counts for homepage display.
 * 
 * Query params:
 * - limit: Max cars to return (default: 8)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20);

    if (!isSupabaseConfigured) {
      return NextResponse.json({ 
        cars: [],
        message: 'Database not configured' 
      });
    }

    // Fetch cars with expert review data
    const { data: cars, error } = await supabase
      .from('cars')
      .select(`
        slug,
        name,
        years,
        tier,
        category,
        price_range,
        price_avg,
        score_sound,
        score_interior,
        score_track,
        score_reliability,
        score_value,
        score_driver_fun,
        score_aftermarket,
        expert_review_count,
        expert_consensus_summary
      `)
      .gt('expert_review_count', 0)
      .order('expert_review_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[expert-reviewed] Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cars' },
        { status: 500 }
      );
    }

    // For each car, fetch a sample quote from videos
    const carsWithQuotes = await Promise.all(
      (cars || []).map(async (car) => {
        // Get a notable quote for this car
        let consensusQuote = null;
        
        try {
          const { data: link } = await supabase
            .from('youtube_video_car_links')
            .select(`
              youtube_videos!inner (
                one_line_take,
                notable_quotes
              )
            `)
            .eq('car_slug', car.slug)
            .limit(1)
            .single();

          if (link?.youtube_videos) {
            consensusQuote = link.youtube_videos.one_line_take ||
              link.youtube_videos.notable_quotes?.[0]?.quote;
          }
        } catch {
          // Ignore errors - quote is optional
        }

        return {
          slug: car.slug,
          name: car.name,
          years: car.years,
          tier: car.tier,
          category: car.category,
          priceRange: car.price_range,
          priceAvg: car.price_avg,
          sound: car.score_sound,
          interior: car.score_interior,
          track: car.score_track,
          reliability: car.score_reliability,
          value: car.score_value,
          driverFun: car.score_driver_fun,
          aftermarket: car.score_aftermarket,
          expertReviewCount: car.expert_review_count || 0,
          expertConsensusSummary: car.expert_consensus_summary,
          consensusQuote: consensusQuote?.slice(0, 100) + (consensusQuote?.length > 100 ? '...' : ''),
        };
      })
    );

    return NextResponse.json({
      cars: carsWithQuotes,
      count: carsWithQuotes.length
    });

  } catch (error) {
    console.error('[expert-reviewed] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

