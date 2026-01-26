import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/al/stats
 * 
 * Returns live statistics about AL's data coverage.
 * Public endpoint - used on the /al landing page.
 * 
 * Response:
 *   {
 *     cars: number,           // Total cars in database
 *     ownerInsights: number,  // Community insights from forums
 *     knownIssues: number,    // Documented car issues
 *     verifiedFitments: number, // Part-to-car fitments
 *     parts: number,          // Parts in catalog
 *     youtubeReviews: number, // Analyzed YouTube videos
 *     knowledgeChunks: number, // Vector-embedded knowledge
 *     serviceIntervals: number, // Maintenance records
 *     updatedAt: string       // ISO timestamp
 *   }
 */
async function handleGet() {
  // Run all counts in parallel for performance
    const [
      carsResult,
      insightsResult,
      issuesResult,
      fitmentsResult,
      partsResult,
      videosResult,
      chunksResult,
      intervalsResult,
    ] = await Promise.all([
      supabase.from('cars').select('id', { count: 'exact', head: true }),
      supabase.from('community_insights').select('id', { count: 'exact', head: true }),
      supabase.from('car_issues').select('id', { count: 'exact', head: true }),
      supabase.from('part_fitments').select('id', { count: 'exact', head: true }),
      supabase.from('parts').select('id', { count: 'exact', head: true }),
      supabase.from('youtube_videos').select('id', { count: 'exact', head: true }),
      supabase.from('document_chunks').select('id', { count: 'exact', head: true }),
      supabase.from('vehicle_service_intervals').select('id', { count: 'exact', head: true }),
    ]);

    const stats = {
      cars: carsResult.count || 0,
      ownerInsights: insightsResult.count || 0,
      knownIssues: issuesResult.count || 0,
      verifiedFitments: fitmentsResult.count || 0,
      parts: partsResult.count || 0,
      youtubeReviews: videosResult.count || 0,
      knowledgeChunks: chunksResult.count || 0,
      serviceIntervals: intervalsResult.count || 0,
      updatedAt: new Date().toISOString(),
    };

    // Cache for 5 minutes (stats don't change frequently)
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
}

export const GET = withErrorLogging(handleGet, { route: 'al/stats', feature: 'al' });












