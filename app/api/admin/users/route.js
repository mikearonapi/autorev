/**
 * Admin Users API - SIMPLIFIED
 * 
 * Direct database queries for real-time accuracy.
 * No caching, no complex logic, just straight DB reads.
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { requireAdmin, isAdminEmail } from '@/lib/adminAccess';
import { getTotalUsersCount, getUserTierBreakdown } from '@/lib/adminMetricsService';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Force dynamic - never cache this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function handleGet(request) {
  try {
    // Verify admin access
    const denied = await requireAdmin(request);
    if (denied) return denied;

    // Validate environment
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const tierFilter = searchParams.get('tier') || '';
    const offset = (page - 1) * limit;

    // ========================================
    // STEP 1: Get ALL user profiles (simple query)
    // ========================================
    let profileQuery = supabase
      .from('user_profiles')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      profileQuery = profileQuery.or(`display_name.ilike.%${search}%`);
    }

    // Apply tier filter
    if (tierFilter) {
      profileQuery = profileQuery.eq('subscription_tier', tierFilter);
    }

    // Apply sorting (only for DB fields)
    const dbSortFields = ['created_at', 'updated_at', 'display_name', 'subscription_tier'];
    if (dbSortFields.includes(sort)) {
      profileQuery = profileQuery.order(sort, { ascending: order === 'asc' });
    } else {
      profileQuery = profileQuery.order('created_at', { ascending: false });
    }

    // Apply pagination
    profileQuery = profileQuery.range(offset, offset + limit - 1);

    const { data: profiles, count: totalCount, error: profileError } = await profileQuery;

    if (profileError) {
      console.error('[AdminUsers] Profile query error:', profileError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // If no profiles, return early
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        users: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        summary: { totalUsers: 0, activeUsers7d: 0, tierBreakdown: { free: 0, collector: 0, tuner: 0, admin: 0 } }
      }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const userIds = profiles.map(p => p.id);

    // ========================================
    // STEP 2: Get auth data for all users (emails, last_sign_in)
    // ========================================
    const authDataMap = {};
    
    // Fetch auth data for each user
    const authPromises = userIds.map(async (id) => {
      try {
        const { data, error } = await supabase.auth.admin.getUserById(id);
        if (!error && data?.user) {
          return {
            id: data.user.id,
            email: data.user.email,
            created_at: data.user.created_at,
            last_sign_in_at: data.user.last_sign_in_at,
            user_metadata: data.user.user_metadata || {}
          };
        }
      } catch (e) {
        console.warn(`[AdminUsers] Failed to get auth for ${id}:`, e.message);
      }
      return null;
    });

    const authResults = await Promise.all(authPromises);
    authResults.forEach(u => {
      if (u) authDataMap[u.id] = u;
    });

    // ========================================
    // STEP 3: Get engagement data in parallel
    // ========================================
    const [
      { data: garageData },
      { data: favoritesData },
      { data: projectsData },
      { data: eventSavesData },
      { data: alConversationsData },
      { data: compareListsData },
      { data: serviceLogsData },
      { data: feedbackData },
      { data: alCreditsData },
      { data: activityData },
      { data: attributionData }
    ] = await Promise.all([
      supabase.from('user_vehicles').select('user_id').in('user_id', userIds),
      supabase.from('user_favorites').select('user_id').in('user_id', userIds),
      supabase.from('user_projects').select('user_id').in('user_id', userIds),
      supabase.from('event_saves').select('user_id').in('user_id', userIds),
      supabase.from('al_conversations').select('user_id, last_message_at').in('user_id', userIds),
      supabase.from('user_compare_lists').select('user_id').in('user_id', userIds),
      supabase.from('user_service_logs').select('user_id').in('user_id', userIds),
      supabase.from('user_feedback').select('user_id').in('user_id', userIds),
      supabase.from('al_user_credits').select('user_id, current_credits, credits_used_this_month, messages_this_month, is_unlimited').in('user_id', userIds),
      supabase.from('user_activity').select('user_id').in('user_id', userIds).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('user_attribution').select('user_id, first_touch_source, first_touch_medium, first_touch_campaign').in('user_id', userIds)
    ]);

    // Build count maps
    const countMap = (data, key = 'user_id') => {
      const map = {};
      (data || []).forEach(item => {
        map[item[key]] = (map[item[key]] || 0) + 1;
      });
      return map;
    };

    const garageMap = countMap(garageData);
    const favoritesMap = countMap(favoritesData);
    const projectsMap = countMap(projectsData);
    const eventSavesMap = countMap(eventSavesData);
    const compareListsMap = countMap(compareListsData);
    const serviceLogsMap = countMap(serviceLogsData);
    const feedbackMap = countMap(feedbackData);
    const activityMap = countMap(activityData);

    // AL conversations with last used tracking
    const alConvoMap = {};
    (alConversationsData || []).forEach(c => {
      if (!alConvoMap[c.user_id]) {
        alConvoMap[c.user_id] = { count: 0, lastUsed: null };
      }
      alConvoMap[c.user_id].count++;
      if (!alConvoMap[c.user_id].lastUsed || new Date(c.last_message_at) > new Date(alConvoMap[c.user_id].lastUsed)) {
        alConvoMap[c.user_id].lastUsed = c.last_message_at;
      }
    });

    // AL credits map
    const alCreditsMap = {};
    (alCreditsData || []).forEach(c => {
      alCreditsMap[c.user_id] = c;
    });

    // Attribution map
    const attributionMap = {};
    (attributionData || []).forEach(a => {
      attributionMap[a.user_id] = a;
    });

    // ========================================
    // STEP 4: Build final user objects
    // ========================================
    const users = profiles.map(profile => {
      const authUser = authDataMap[profile.id] || {};
      const attribution = attributionMap[profile.id] || {};
      const credits = alCreditsMap[profile.id] || {};
      const alConvo = alConvoMap[profile.id] || { count: 0, lastUsed: null };

      // Determine effective tier
      let effectiveTier = profile.subscription_tier || 'free';
      if (profile.referral_tier_granted) {
        const refTierValid = profile.referral_tier_lifetime || 
          (profile.referral_tier_expires_at && new Date(profile.referral_tier_expires_at) > new Date());
        if (refTierValid) {
          const tierPriority = { free: 0, collector: 1, tuner: 2, admin: 3 };
          if (tierPriority[profile.referral_tier_granted] > tierPriority[effectiveTier]) {
            effectiveTier = profile.referral_tier_granted;
          }
        }
      }
      if (authUser.email && isAdminEmail(authUser.email)) {
        effectiveTier = 'admin';
      }

      return {
        id: profile.id,
        email: authUser.email || null,
        displayName: profile.display_name || authUser.user_metadata?.full_name || 'Anonymous',
        avatar: authUser.user_metadata?.avatar_url || null,
        tier: effectiveTier,
        subscriptionTier: profile.subscription_tier || 'free',
        isUnlimited: credits.is_unlimited || false,
        createdAt: profile.created_at,
        lastSignIn: authUser.last_sign_in_at || null,
        source: attribution.first_touch_source || 'Direct',
        medium: attribution.first_touch_medium || null,
        campaign: attribution.first_touch_campaign || null,
        garageVehicles: garageMap[profile.id] || 0,
        favorites: favoritesMap[profile.id] || 0,
        savedBuilds: projectsMap[profile.id] || 0,
        savedEvents: eventSavesMap[profile.id] || 0,
        alConversations: alConvo.count,
        alLastUsed: alConvo.lastUsed,
        compareLists: compareListsMap[profile.id] || 0,
        serviceLogs: serviceLogsMap[profile.id] || 0,
        feedbackCount: feedbackMap[profile.id] || 0,
        alCredits: credits.current_credits || 0,
        alMessagesThisMonth: credits.messages_this_month || 0,
        recentActivityCount: activityMap[profile.id] || 0,
        referredByCode: profile.referred_by_code || null,
      };
    });

    // ========================================
    // STEP 5: Get summary stats (single source of truth helpers)
    // ========================================
    const totalUsers = await getTotalUsersCount(supabase);
    const tierBreakdown = await getUserTierBreakdown(supabase);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: activeUsers } = await supabase
      .from('user_activity')
      .select('user_id')
      .gte('created_at', sevenDaysAgo);
    
    const uniqueActiveUsers = new Set((activeUsers || []).map(a => a.user_id)).size;

    // ========================================
    // STEP 6: Return response with no-cache headers
    // ========================================
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      },
      summary: {
        totalUsers,
        activeUsers7d: uniqueActiveUsers,
        tierBreakdown
      },
      _debug: {
        profilesReturned: profiles.length,
        totalInDb: totalCount,
        timestamp: new Date().toISOString()
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });

  } catch (err) {
    console.error('[AdminUsers] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/users', feature: 'admin' });
