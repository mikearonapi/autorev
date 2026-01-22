/**
 * GET /api/internal/data-quality
 * 
 * Returns data quality metrics for the internal dashboard.
 * Includes table health, linkage stats, and active issues.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Parallel queries for efficiency
    const [
      carsResult,
      partFitmentsResult,
      lapTimesResult,
      dynoRunsResult,
      communityInsightsResult,
      youtubeLinksResult,
      partCategoriesResult,
      vendorStatsResult,
    ] = await Promise.all([
      // Total cars
      supabase.from('cars').select('id', { count: 'exact', head: true }),
      
      // Part fitments - count unique cars with fitments
      supabase.rpc('get_fitment_stats').catch(() => ({ data: null })),
      
      // Lap times linkage
      supabase.from('car_track_lap_times').select('id, car_id', { count: 'exact' }),
      
      // Dyno runs linkage
      supabase.from('car_dyno_runs').select('id, car_id', { count: 'exact' }),
      
      // Community insights linkage
      supabase.from('community_insights')
        .select('id, car_id, is_active')
        .eq('is_active', true),
      
      // YouTube links linkage
      supabase.from('youtube_video_car_links').select('id, car_id', { count: 'exact' }),
      
      // Part categories
      supabase.from('parts')
        .select('category')
        .eq('is_active', true)
        .then(({ data }) => {
          if (!data) return { data: [] };
          const counts = {};
          data.forEach(p => {
            counts[p.category] = (counts[p.category] || 0) + 1;
          });
          return { 
            data: Object.entries(counts)
              .map(([category, count]) => ({ category, count }))
              .sort((a, b) => b.count - a.count)
          };
        }),
      
      // Vendor stats
      supabase.rpc('get_vendor_stats').catch(() => ({ data: null })),
    ]);

    // Calculate table health
    const lapTimesData = lapTimesResult.data || [];
    const lapTimesTotal = lapTimesData.length;
    const lapTimesLinked = lapTimesData.filter(lt => lt.car_id).length;
    
    const dynoData = dynoRunsResult.data || [];
    const dynoTotal = dynoData.length;
    const dynoLinked = dynoData.filter(d => d.car_id).length;
    
    const insightsData = communityInsightsResult.data || [];
    const insightsTotal = insightsData.length;
    const insightsLinked = insightsData.filter(i => i.car_id).length;
    
    const youtubeData = youtubeLinksResult.data || [];
    const youtubeTotal = youtubeData.length;
    const youtubeLinked = youtubeData.filter(y => y.car_id).length;

    // Build response
    const metrics = {
      timestamp: new Date().toISOString(),
      
      summary: {
        totalCars: carsResult.count || 0,
        carsWithParts: partFitmentsResult.data?.cars_with_fitments || 0,
        carsWithPartsPercent: partFitmentsResult.data?.coverage_percent || 0,
        totalLapTimes: lapTimesTotal,
        totalInsights: insightsTotal,
      },
      
      tables: [
        {
          name: 'car_track_lap_times',
          total: lapTimesTotal,
          linked: lapTimesLinked,
          orphaned: lapTimesTotal - lapTimesLinked,
          linkedPercent: lapTimesTotal > 0 
            ? Math.round((lapTimesLinked / lapTimesTotal) * 100) 
            : 100,
        },
        {
          name: 'car_dyno_runs',
          total: dynoTotal,
          linked: dynoLinked,
          orphaned: dynoTotal - dynoLinked,
          linkedPercent: dynoTotal > 0 
            ? Math.round((dynoLinked / dynoTotal) * 100) 
            : 100,
        },
        {
          name: 'community_insights',
          total: insightsTotal,
          linked: insightsLinked,
          orphaned: insightsTotal - insightsLinked,
          linkedPercent: insightsTotal > 0 
            ? Math.round((insightsLinked / insightsTotal) * 100) 
            : 100,
        },
        {
          name: 'youtube_video_car_links',
          total: youtubeTotal,
          linked: youtubeLinked,
          orphaned: youtubeTotal - youtubeLinked,
          linkedPercent: youtubeTotal > 0 
            ? Math.round((youtubeLinked / youtubeTotal) * 100) 
            : 100,
        },
      ],
      
      partCategories: partCategoriesResult.data || [],
      
      vendors: vendorStatsResult.data || [],
      
      issues: generateIssues({
        lapTimesTotal,
        lapTimesLinked,
        dynoTotal,
        dynoLinked,
        insightsTotal,
        insightsLinked,
        youtubeTotal,
        youtubeLinked,
        partCategories: partCategoriesResult.data || [],
      }),
    };

    return NextResponse.json(metrics);
    
  } catch (error) {
    console.error('Data quality API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data quality metrics' },
      { status: 500 }
    );
  }
}

/**
 * Generate issue list based on metrics
 */
function generateIssues(data) {
  const issues = [];

  // Orphaned lap times
  const orphanedLapTimes = data.lapTimesTotal - data.lapTimesLinked;
  if (orphanedLapTimes > 0) {
    issues.push({
      severity: orphanedLapTimes > 100 ? 'critical' : 'high',
      message: 'Lap times missing car_id linkage',
      count: orphanedLapTimes,
    });
  }

  // Orphaned community insights
  const orphanedInsights = data.insightsTotal - data.insightsLinked;
  if (orphanedInsights > 0) {
    issues.push({
      severity: orphanedInsights > 50 ? 'high' : 'medium',
      message: 'Community insights missing car_id linkage',
      count: orphanedInsights,
    });
  }

  // Orphaned dyno runs
  const orphanedDyno = data.dynoTotal - data.dynoLinked;
  if (orphanedDyno > 0) {
    issues.push({
      severity: 'medium',
      message: 'Dyno runs missing car_id linkage',
      count: orphanedDyno,
    });
  }

  // Parts in "other" category
  const otherCategory = data.partCategories.find(c => c.category === 'other');
  if (otherCategory && otherCategory.count > 1000) {
    issues.push({
      severity: 'medium',
      message: 'Parts in "other" category need recategorization',
      count: otherCategory.count,
    });
  }

  return issues.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
