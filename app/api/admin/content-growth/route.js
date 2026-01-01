/**
 * Content Growth API
 * 
 * Fetches content_metrics snapshots for historical growth visualization.
 * @route GET /api/admin/content-growth?days=30
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/adminAccess';
import { withErrorLogging } from '@/lib/serverErrorLogger';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30', 10);
  
  // Verify admin access
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Fetch content_metrics for the date range
    const { data: metrics, error: metricsError } = await supabase
      .from('content_metrics')
      .select('*')
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });
    
    if (metricsError) {
      console.error('[Content Growth] Metrics error:', metricsError);
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }
    
    if (!metrics || metrics.length === 0) {
      return NextResponse.json({
        metrics: [],
        summary: null,
        growth: null,
        period: { days, start: startDate.toISOString(), end: new Date().toISOString() },
      });
    }
    
    // Calculate growth between first and last snapshot
    const first = metrics[0];
    const last = metrics[metrics.length - 1];
    
    const calcGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };
    
    const growth = {
      vehicles: {
        absolute: last.total_vehicles - first.total_vehicles,
        percent: calcGrowth(last.total_vehicles, first.total_vehicles),
      },
      events: {
        absolute: last.total_events - first.total_events,
        percent: calcGrowth(last.total_events, first.total_events),
      },
      videos: {
        absolute: last.total_videos - first.total_videos,
        percent: calcGrowth(last.total_videos, first.total_videos),
      },
      insights: {
        absolute: last.total_insights - first.total_insights,
        percent: calcGrowth(last.total_insights, first.total_insights),
      },
      parts: {
        absolute: last.total_parts - first.total_parts,
        percent: calcGrowth(last.total_parts, first.total_parts),
      },
      kbChunks: {
        absolute: last.kb_chunks - first.kb_chunks,
        percent: calcGrowth(last.kb_chunks, first.kb_chunks),
      },
      forumThreads: {
        absolute: last.forum_threads_scraped - first.forum_threads_scraped,
        percent: calcGrowth(last.forum_threads_scraped, first.forum_threads_scraped),
      },
    };
    
    // Current summary (latest snapshot)
    const summary = {
      totalVehicles: last.total_vehicles,
      vehiclesWithImages: last.vehicles_with_hero_image,
      vehiclesWithEmbeddings: last.vehicles_with_embedding,
      totalEvents: last.total_events,
      approvedEvents: last.approved_events,
      upcomingEvents: last.upcoming_events,
      totalVideos: last.total_videos,
      processedVideos: last.processed_videos,
      pendingVideos: last.pending_videos,
      totalInsights: last.total_insights,
      kbChunks: last.kb_chunks,
      totalParts: last.total_parts,
      partsWithFitment: last.parts_with_fitment,
      forumThreads: last.forum_threads_scraped,
      snapshotDate: last.snapshot_date,
    };
    
    // Format metrics for chart display
    const chartData = metrics.map(m => ({
      date: m.snapshot_date,
      vehicles: m.total_vehicles,
      events: m.total_events,
      videos: m.total_videos,
      insights: m.total_insights,
      parts: m.total_parts,
      kbChunks: m.kb_chunks,
      forumThreads: m.forum_threads_scraped,
    }));
    
    return NextResponse.json({
      metrics: chartData,
      summary,
      growth,
      period: {
        days,
        start: first.snapshot_date,
        end: last.snapshot_date,
        dataPoints: metrics.length,
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (err) {
    console.error('[Content Growth] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch content growth data' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/content-growth', feature: 'internal' });

