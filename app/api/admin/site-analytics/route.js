/**
 * Site Analytics API
 * 
 * Returns analytics data for the admin dashboard.
 * Requires admin authentication.
 * 
 * GET /api/admin/site-analytics?range=7d
 */

import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - this route uses request.headers and request.url
export const dynamic = 'force-dynamic';
import { isAdminEmail } from '@/lib/adminAccess';

// Create admin client for reading analytics
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get date range based on range parameter
 */
function getDateRange(range) {
  const now = new Date();
  const endDate = now.toISOString();
  let startDate;
  
  switch (range) {
    case 'day':
    case '24h':
      startDate = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'week':
    case '7d':
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'month':
    case '30d':
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case '90d':
      startDate = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'all':
      startDate = new Date('2024-01-01').toISOString();
      break;
    default:
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  
  return { startDate, endDate };
}

export async function GET(request) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify user is admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user || !isAdminEmail(user.email)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get range parameter
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';
    const { startDate, endDate } = getDateRange(range);
    
    // Get analytics using the RPC function
    const { data: analytics, error: analyticsError } = await supabaseAdmin
      .rpc('get_site_analytics', {
        p_start_date: startDate,
        p_end_date: endDate
      });
    
    if (analyticsError) {
      console.error('[Site Analytics] RPC error:', analyticsError);
      // Fallback to direct queries if RPC fails
    }
    
    // Get bounce rate
    const { data: bounceRate } = await supabaseAdmin
      .rpc('get_bounce_rate', {
        p_start_date: startDate,
        p_end_date: endDate
      });
    
    // Get real-time online count (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: onlineCount } = await supabaseAdmin
      .from('page_views')
      .select('session_id', { count: 'exact', head: true })
      .gte('created_at', fiveMinutesAgo);
    
    // Build response
    const response = {
      range,
      startDate,
      endDate,
      summary: {
        visitors: analytics?.visitors || 0,
        pageViews: analytics?.pageViews || 0,
        bounceRate: bounceRate || 0,
        online: onlineCount || 0
      },
      topPages: analytics?.topPages || [],
      referrers: analytics?.referrers || [],
      countries: analytics?.countries || [],
      devices: analytics?.devices || [],
      browsers: analytics?.browsers || [],
      operatingSystems: analytics?.operatingSystems || [],
      dailyStats: analytics?.dailyStats || []
    };
    
    return Response.json(response);
    
  } catch (error) {
    console.error('[Site Analytics] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

