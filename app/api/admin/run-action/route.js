/**
 * Admin Run Action API
 * 
 * Proxies cron job execution with admin authentication.
 * This allows admin users to trigger cron jobs without needing CRON_SECRET.
 * 
 * @route POST /api/admin/run-action
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/adminAccess';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

// Available actions and their corresponding internal endpoints
const ALLOWED_ACTIONS = {
  'refresh-content': {
    description: 'Refresh content metrics',
    handler: async (supabase) => {
      // Directly capture content metrics
      const now = new Date();
      
      // Fetch content counts
      const [
        vehiclesResult,
        eventsResult,
        videosResult,
        insightsResult,
        chunksResult,
        partsResult,
      ] = await Promise.all([
        supabase.from('cars').select('id, image_hero_url, embedding'),
        supabase.from('events').select('id, status, start_date'),
        supabase.from('youtube_videos').select('id, processing_status'),
        supabase.from('community_insights').select('id, is_active'),
        supabase.from('document_chunks').select('id', { count: 'exact', head: true }),
        supabase.from('parts').select('id, category'),
      ]);
      
      const vehicles = vehiclesResult.data || [];
      const events = eventsResult.data || [];
      const videos = videosResult.data || [];
      const insights = insightsResult.data || [];
      const parts = partsResult.data || [];
      
      const metrics = {
        total_vehicles: vehicles.length,
        vehicles_with_hero_image: vehicles.filter(v => v.image_hero_url).length,
        vehicles_with_embedding: vehicles.filter(v => v.embedding).length,
        approved_events: events.filter(e => e.status === 'approved').length,
        upcoming_events: events.filter(e => e.status === 'approved' && new Date(e.start_date) > now).length,
        processed_videos: videos.filter(v => v.processing_status === 'processed').length,
        pending_videos: videos.filter(v => v.processing_status === 'pending').length,
        active_insights: insights.filter(i => i.is_active).length,
        kb_chunks: chunksResult.count || 0,
        total_parts: parts.length,
        parts_with_fitment: parts.filter(p => p.category).length,
      };
      
      // Try to insert into content_metrics if table exists
      try {
        await supabase.from('content_metrics').upsert({
          snapshot_date: now.toISOString().split('T')[0],
          ...metrics,
          created_at: now.toISOString(),
        }, { onConflict: 'snapshot_date' });
      } catch {
        // Table might not exist, that's ok
      }
      
      return {
        success: true,
        action: 'refresh-content',
        metrics,
        timestamp: now.toISOString(),
      };
    },
  },
  
  'run-scrape': {
    description: 'Process pending scrape jobs',
    handler: async (supabase) => {
      // Get pending jobs (car_slug column no longer exists, use car_id)
      const { data: pendingJobs, error } = await supabase
        .from('scrape_jobs')
        .select('id, job_type, status, car_id')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(3);
      
      if (error) {
        throw new Error(`Failed to fetch jobs: ${error.message}`);
      }
      
      return {
        success: true,
        action: 'run-scrape',
        pendingJobs: pendingJobs?.length || 0,
        jobs: pendingJobs || [],
        message: pendingJobs?.length > 0 
          ? `Found ${pendingJobs.length} pending jobs. Use the internal tools to process them.`
          : 'No pending scrape jobs in queue.',
      };
    },
  },
  
  'refresh-events': {
    description: 'Check events status',
    handler: async (supabase) => {
      const now = new Date();
      
      // Get event stats
      const { data: events, error } = await supabase
        .from('events')
        .select('status, start_date');
      
      if (error) {
        throw new Error(`Failed to fetch events: ${error.message}`);
      }
      
      const stats = {
        total: events?.length || 0,
        approved: events?.filter(e => e.status === 'approved').length || 0,
        pending: events?.filter(e => e.status === 'pending').length || 0,
        rejected: events?.filter(e => e.status === 'rejected').length || 0,
        upcoming: events?.filter(e => e.status === 'approved' && new Date(e.start_date) > now).length || 0,
        past: events?.filter(e => e.status === 'approved' && new Date(e.start_date) <= now).length || 0,
      };
      
      return {
        success: true,
        action: 'refresh-events',
        stats,
        message: `Events: ${stats.approved} approved, ${stats.pending} pending, ${stats.upcoming} upcoming`,
      };
    },
  },
  
  'youtube-enrich': {
    description: 'Check YouTube enrichment status',
    handler: async (supabase) => {
      // Get video stats
      const { data: videos, error } = await supabase
        .from('youtube_videos')
        .select('processing_status');
      
      if (error) {
        throw new Error(`Failed to fetch videos: ${error.message}`);
      }
      
      const stats = (videos || []).reduce((acc, v) => {
        acc[v.processing_status] = (acc[v.processing_status] || 0) + 1;
        return acc;
      }, {});
      
      return {
        success: true,
        action: 'youtube-enrich',
        stats,
        total: videos?.length || 0,
        message: `Videos: ${stats.processed || 0} processed, ${stats.pending || 0} pending`,
      };
    },
  },
};

export async function POST(request) {
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
    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Get action from body
    const body = await request.json();
    const { action } = body;
    
    if (!action || !ALLOWED_ACTIONS[action]) {
      return NextResponse.json({
        error: 'Invalid action',
        allowedActions: Object.keys(ALLOWED_ACTIONS).map(key => ({
          id: key,
          description: ALLOWED_ACTIONS[key].description,
        })),
      }, { status: 400 });
    }
    
    // Run the action
    const result = await ALLOWED_ACTIONS[action].handler(supabase);
    
    return NextResponse.json(result);
    
  } catch (err) {
    console.error('[Admin Run Action] Error:', err);
    return NextResponse.json({
      success: false,
      error: err.message,
    }, { status: 500 });
  }
}

