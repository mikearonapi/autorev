/**
 * User Retention Metrics API
 * 
 * Calculates D1, D7, D30 retention rates and engagement metrics.
 * 
 * @route GET /api/admin/retention
 */

// Force dynamic to prevent static prerendering (uses cookies/headers)
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { isAdminEmail } from '@/lib/adminAccess';
import { rateLimit } from '@/lib/rateLimit';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function handleGet(request) {
  // Rate limit - prevent DoS on expensive analytics queries
  const limited = rateLimit(request, 'api');
  if (limited) return limited;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  // Verify admin access
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    const now = new Date();
    const _today = now.toISOString().split('T')[0];
    
    // =========================================================================
    // Get Historical Retention Data (last 30 days)
    const METRIC_COLS = 'id, metric_type, service_name, metric_date, metric_value, metadata, created_at';
    
    // =========================================================================
    const { data: retentionHistory } = await supabase
      .from('usage_metrics')
      .select(METRIC_COLS)
      .in('metric_type', ['D1_RETENTION', 'D7_RETENTION', 'D30_RETENTION', 'DAILY_ACTIVE_USERS'])
      .eq('service_name', 'PLATFORM')
      .gte('metric_date', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('metric_date', { ascending: false });
    
    // Group by type
    const d1Data = retentionHistory?.filter(r => r.metric_type === 'D1_RETENTION') || [];
    const d7Data = retentionHistory?.filter(r => r.metric_type === 'D7_RETENTION') || [];
    const d30Data = retentionHistory?.filter(r => r.metric_type === 'D30_RETENTION') || [];
    const dauData = retentionHistory?.filter(r => r.metric_type === 'DAILY_ACTIVE_USERS') || [];
    
    // =========================================================================
    // Calculate Current Retention (Real-time)
    // =========================================================================
    const d1Date = new Date(now);
    d1Date.setDate(d1Date.getDate() - 1);
    const d7Date = new Date(now);
    d7Date.setDate(d7Date.getDate() - 7);
    const d30Date = new Date(now);
    d30Date.setDate(d30Date.getDate() - 30);
    
    // Get all users
    const { data: allUsers } = await supabase
      .from('user_profiles')
      .select('id, created_at');
    
    // Get recently active users (from AL conversations, favorites, projects)
    const { data: recentActivity } = await supabase
      .from('al_conversations')
      .select('user_id, last_message_at')
      .gte('last_message_at', d1Date.toISOString());
    
    const activeUserIds = new Set((recentActivity || []).map(a => a.user_id));
    
    // Cohort analysis
    const d1Cohort = (allUsers || []).filter(u => {
      const created = new Date(u.created_at);
      return created >= d1Date && created < now;
    });
    const d7Cohort = (allUsers || []).filter(u => {
      const created = new Date(u.created_at);
      return created >= d7Date && created < d1Date;
    });
    const d30Cohort = (allUsers || []).filter(u => {
      const created = new Date(u.created_at);
      return created >= d30Date && created < d7Date;
    });
    
    const d1Retained = d1Cohort.filter(u => activeUserIds.has(u.id)).length;
    const d7Retained = d7Cohort.filter(u => activeUserIds.has(u.id)).length;
    const d30Retained = d30Cohort.filter(u => activeUserIds.has(u.id)).length;
    
    // =========================================================================
    // User Engagement Funnel
    // =========================================================================
    const totalUsers = allUsers?.length || 0;
    
    // Users who have viewed cars
    const { count: usersWithFavorites } = await supabase
      .from('user_favorites')
      .select('user_id', { count: 'exact', head: true });
    
    // Users who have projects
    const { count: usersWithProjects } = await supabase
      .from('user_projects')
      .select('user_id', { count: 'exact', head: true });
    
    // Users who have used AL
    const { data: alUsers } = await supabase
      .from('al_conversations')
      .select('user_id');
    const uniqueAlUsers = new Set((alUsers || []).map(a => a.user_id)).size;
    
    // Users who have added vehicles
    const { count: usersWithVehicles } = await supabase
      .from('user_vehicles')
      .select('user_id', { count: 'exact', head: true });
    
    // =========================================================================
    // Weekly/Monthly Trends
    // =========================================================================
    const weeklySignups = [];
    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7) - 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      
      const count = (allUsers || []).filter(u => {
        const created = new Date(u.created_at);
        return created >= weekStart && created < weekEnd;
      }).length;
      
      weeklySignups.unshift({
        week: weekStart.toISOString().split('T')[0],
        signups: count,
      });
    }
    
    return NextResponse.json({
      current: {
        d1: {
          cohortSize: d1Cohort.length,
          retained: d1Retained,
          rate: d1Cohort.length > 0 ? ((d1Retained / d1Cohort.length) * 100).toFixed(1) : 0,
        },
        d7: {
          cohortSize: d7Cohort.length,
          retained: d7Retained,
          rate: d7Cohort.length > 0 ? ((d7Retained / d7Cohort.length) * 100).toFixed(1) : 0,
        },
        d30: {
          cohortSize: d30Cohort.length,
          retained: d30Retained,
          rate: d30Cohort.length > 0 ? ((d30Retained / d30Cohort.length) * 100).toFixed(1) : 0,
        },
        dau: activeUserIds.size,
        wau: uniqueAlUsers, // approximation
        mau: totalUsers,
      },
      
      history: {
        d1: d1Data.map(d => ({ date: d.metric_date, rate: d.metric_value, meta: d.metadata })),
        d7: d7Data.map(d => ({ date: d.metric_date, rate: d.metric_value, meta: d.metadata })),
        d30: d30Data.map(d => ({ date: d.metric_date, rate: d.metric_value, meta: d.metadata })),
        dau: dauData.map(d => ({ date: d.metric_date, count: d.metric_value })),
      },
      
      funnel: {
        totalUsers,
        usersWithFavorites: usersWithFavorites || 0,
        usersWithProjects: usersWithProjects || 0,
        usersWithAL: uniqueAlUsers,
        usersWithVehicles: usersWithVehicles || 0,
        conversionRates: {
          favorites: totalUsers > 0 ? (((usersWithFavorites || 0) / totalUsers) * 100).toFixed(1) : 0,
          projects: totalUsers > 0 ? (((usersWithProjects || 0) / totalUsers) * 100).toFixed(1) : 0,
          al: totalUsers > 0 ? ((uniqueAlUsers / totalUsers) * 100).toFixed(1) : 0,
          vehicles: totalUsers > 0 ? (((usersWithVehicles || 0) / totalUsers) * 100).toFixed(1) : 0,
        },
      },
      
      trends: {
        weeklySignups,
      },
      
      timestamp: now.toISOString(),
    });
    
  } catch (err) {
    console.error('[Retention API] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch retention data' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/retention', feature: 'admin' });
