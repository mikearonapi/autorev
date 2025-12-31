/**
 * Site Analytics API
 * 
 * Returns analytics data for the admin dashboard.
 * Requires admin authentication.
 * Excludes admin users from all metrics.
 * 
 * GET /api/admin/site-analytics?range=7d
 */

import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - this route uses request.headers and request.url
export const dynamic = 'force-dynamic';
import { isAdminEmail, getAdminUserIdsCached } from '@/lib/adminAccess';

// Create admin client for reading analytics
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Paths to exclude from analytics
const EXCLUDED_PATHS = ['/admin', '/internal'];

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
    
    // Get admin user IDs to exclude from analytics
    const adminUserIds = await getAdminUserIdsCached(supabaseAdmin);
    
    // Fetch page views excluding admin users and internal paths
    const { data: pageViews, error: pvError } = await supabaseAdmin
      .from('page_views')
      .select('id, session_id, user_id, path, referrer, country_code, device_type, browser, operating_system, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    if (pvError) {
      console.error('[Site Analytics] Page views error:', pvError);
    }
    
    // Filter out admin users and internal paths
    const filteredViews = (pageViews || []).filter(pv => {
      // Exclude admin users (by user_id)
      if (pv.user_id && adminUserIds.includes(pv.user_id)) {
        return false;
      }
      // Exclude internal paths
      if (EXCLUDED_PATHS.some(path => pv.path?.startsWith(path))) {
        return false;
      }
      return true;
    });
    
    // Calculate metrics from filtered data
    const uniqueSessions = new Set(filteredViews.map(pv => pv.session_id));
    const visitors = uniqueSessions.size;
    const pageViewCount = filteredViews.length;
    
    // Top pages (excluding internal)
    const pageMap = new Map();
    filteredViews.forEach(pv => {
      if (!pageMap.has(pv.path)) {
        pageMap.set(pv.path, { path: pv.path, views: 0, sessions: new Set() });
      }
      const entry = pageMap.get(pv.path);
      entry.views++;
      entry.sessions.add(pv.session_id);
    });
    const topPages = Array.from(pageMap.values())
      .map(p => ({ path: p.path, views: p.views, visitors: p.sessions.size }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);
    
    // Referrers
    const refMap = new Map();
    filteredViews.forEach(pv => {
      const source = pv.referrer || 'Direct';
      if (!refMap.has(source)) {
        refMap.set(source, { source, visitors: 0, sessions: new Set() });
      }
      const entry = refMap.get(source);
      if (!entry.sessions.has(pv.session_id)) {
        entry.visitors++;
        entry.sessions.add(pv.session_id);
      }
    });
    const referrers = Array.from(refMap.values())
      .map(r => ({ source: r.source, visitors: r.visitors }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);
    
    // Countries
    const countryMap = new Map();
    filteredViews.forEach(pv => {
      const country = pv.country_code || 'Unknown';
      if (!countryMap.has(country)) {
        countryMap.set(country, { country_code: country, country: country, visitors: 0, sessions: new Set() });
      }
      const entry = countryMap.get(country);
      if (!entry.sessions.has(pv.session_id)) {
        entry.visitors++;
        entry.sessions.add(pv.session_id);
      }
    });
    const countries = Array.from(countryMap.values())
      .map(c => ({ country_code: c.country_code, country: c.country, visitors: c.visitors }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);
    
    // Devices
    const deviceMap = new Map();
    filteredViews.forEach(pv => {
      const device = pv.device_type || 'Desktop';
      if (!deviceMap.has(device)) {
        deviceMap.set(device, { device, visitors: 0, sessions: new Set() });
      }
      const entry = deviceMap.get(device);
      if (!entry.sessions.has(pv.session_id)) {
        entry.visitors++;
        entry.sessions.add(pv.session_id);
      }
    });
    const devices = Array.from(deviceMap.values())
      .map(d => ({ device: d.device, visitors: d.visitors }))
      .sort((a, b) => b.visitors - a.visitors);
    
    // Browsers
    const browserMap = new Map();
    filteredViews.forEach(pv => {
      const browser = pv.browser || 'Unknown';
      if (!browserMap.has(browser)) {
        browserMap.set(browser, { browser, visitors: 0, sessions: new Set() });
      }
      const entry = browserMap.get(browser);
      if (!entry.sessions.has(pv.session_id)) {
        entry.visitors++;
        entry.sessions.add(pv.session_id);
      }
    });
    const browsers = Array.from(browserMap.values())
      .map(b => ({ browser: b.browser, visitors: b.visitors }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);
    
    // Operating Systems
    const osMap = new Map();
    filteredViews.forEach(pv => {
      const os = pv.operating_system || 'Unknown';
      if (!osMap.has(os)) {
        osMap.set(os, { os, visitors: 0, sessions: new Set() });
      }
      const entry = osMap.get(os);
      if (!entry.sessions.has(pv.session_id)) {
        entry.visitors++;
        entry.sessions.add(pv.session_id);
      }
    });
    const operatingSystems = Array.from(osMap.values())
      .map(o => ({ os: o.os, visitors: o.visitors }))
      .sort((a, b) => b.visitors - a.visitors);
    
    // Daily stats
    const dailyMap = new Map();
    filteredViews.forEach(pv => {
      const date = pv.created_at.split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, views: 0, sessions: new Set() });
      }
      const entry = dailyMap.get(date);
      entry.views++;
      entry.sessions.add(pv.session_id);
    });
    const dailyStats = Array.from(dailyMap.values())
      .map(d => ({ date: d.date, pageViews: d.views, visitors: d.sessions.size }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate bounce rate (sessions with only 1 page view)
    const sessionCounts = new Map();
    filteredViews.forEach(pv => {
      sessionCounts.set(pv.session_id, (sessionCounts.get(pv.session_id) || 0) + 1);
    });
    const bouncedSessions = Array.from(sessionCounts.values()).filter(c => c === 1).length;
    const bounceRate = uniqueSessions.size > 0 
      ? Math.round((bouncedSessions / uniqueSessions.size) * 1000) / 10 
      : 0;
    
    // Get real-time online count (last 5 minutes, excluding admins)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentViews } = await supabaseAdmin
      .from('page_views')
      .select('session_id, user_id, path')
      .gte('created_at', fiveMinutesAgo);
    
    const onlineSessions = new Set();
    (recentViews || []).forEach(pv => {
      if (pv.user_id && adminUserIds.includes(pv.user_id)) return;
      if (EXCLUDED_PATHS.some(path => pv.path?.startsWith(path))) return;
      onlineSessions.add(pv.session_id);
    });
    const onlineCount = onlineSessions.size;
    
    // Build response
    const response = {
      range,
      startDate,
      endDate,
      summary: {
        visitors,
        pageViews: pageViewCount,
        bounceRate,
        online: onlineCount
      },
      topPages,
      referrers,
      countries,
      devices,
      browsers,
      operatingSystems,
      dailyStats
    };
    
    return Response.json(response);
    
  } catch (error) {
    console.error('[Site Analytics] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

