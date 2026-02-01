import { NextResponse } from 'next/server';

import { withErrorLogging } from '@/lib/serverErrorLogger';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Force dynamic rendering since this route uses request.url for query params
export const dynamic = 'force-dynamic';

/**
 * GET /api/cars/expert-reviewed
 *
 * Returns cars with the highest expert review counts for homepage display.
 *
 * Query params:
 * - limit: Max cars to return (default: 8)
 */
async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20);

  if (!isSupabaseConfigured) {
    return NextResponse.json({
      cars: [],
      message: 'Database not configured',
    });
  }

  // Fetch cars with expert review data (include id for efficient video link queries)
  const { data: cars, error } = await supabase
    .from('cars')
    .select(
      `
        id,
        slug,
        name,
        year,
        tier,
        category,
        msrp,
        score_sound,
        score_interior,
        score_track,
        score_reliability,
        score_value,
        score_driver_fun,
        score_aftermarket,
        expert_review_count,
        expert_consensus_summary
      `
    )
    .gt('expert_review_count', 0)
    .order('expert_review_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[expert-reviewed] Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch cars' }, { status: 500 });
  }

  // For each car, fetch a sample quote from videos (uses car_id - car_slug column removed)
  const carsWithQuotes = await Promise.all(
    (cars || []).map(async (car) => {
      // Get a notable quote for this car
      let consensusQuote = null;

      try {
        const { data: link } = await supabase
          .from('youtube_video_car_links')
          .select(
            `
              youtube_videos!inner (
                one_line_take,
                notable_quotes
              )
            `
          )
          .eq('car_id', car.id)
          .limit(1)
          .single();

        if (link?.youtube_videos) {
          consensusQuote =
            link.youtube_videos.one_line_take || link.youtube_videos.notable_quotes?.[0]?.quote;
        }
      } catch {
        // Ignore errors - quote is optional
      }

      return {
        slug: car.slug,
        name: car.name,
        year: car.year,
        tier: car.tier,
        category: car.category,
        msrp: car.msrp,
        priceRange: car.msrp ? `$${car.msrp.toLocaleString()}` : null,
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
    count: carsWithQuotes.length,
  });
}

export const GET = withErrorLogging(handleGet, {
  route: 'cars/expert-reviewed',
  feature: 'browse-cars',
});
