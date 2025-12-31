/**
 * Admin Users API
 * 
 * Returns comprehensive user data for the admin users dashboard.
 * Includes: profiles, tiers, attribution, activity metrics, AL usage.
 * 
 * GET /api/admin/users?search=&page=1&limit=25&sort=created_at&order=desc&tier=
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/adminAccess';

// Force dynamic rendering - this route uses request.headers and request.url
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const tierFilter = searchParams.get('tier') || '';
    
    const offset = (page - 1) * limit;
    
    // Build query for users with profiles and attribution
    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        display_name,
        preferred_units,
        subscription_tier,
        referral_tier_granted,
        referral_tier_expires_at,
        referral_tier_lifetime,
        referred_by_code,
        cars_viewed_count,
        comparisons_made_count,
        projects_saved_count,
        created_at,
        updated_at
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,id.eq.${isUUID(search) ? search : '00000000-0000-0000-0000-000000000000'}`);
    }

    // Apply tier filter
    if (tierFilter) {
      query = query.eq('subscription_tier', tierFilter);
    }

    // Apply sorting
    const validSortFields = ['created_at', 'updated_at', 'display_name', 'subscription_tier', 'cars_viewed_count'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    query = query.order(sortField, { ascending: order === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: profiles, count, error: profilesError } = await query;

    if (profilesError) {
      console.error('[AdminUsers] Profiles error:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    // Get user emails from auth.users using the Admin API
    // The auth schema cannot be queried via .from() - must use auth.admin methods
    const userIds = profiles.map(p => p.id);
    
    let usersMap = {};
    
    // Fetch auth data for each user using the Admin API
    // Use Promise.allSettled to handle any individual failures gracefully
    const authPromises = userIds.map(id => 
      supabase.auth.admin.getUserById(id)
        .then(({ data, error }) => {
          if (error || !data?.user) return null;
          return {
            id: data.user.id,
            email: data.user.email,
            created_at: data.user.created_at,
            last_sign_in_at: data.user.last_sign_in_at,
            raw_user_meta_data: data.user.user_metadata
          };
        })
        .catch(() => null)
    );
    
    const authResults = await Promise.all(authPromises);
    authResults.forEach(u => {
      if (u) usersMap[u.id] = u;
    });

    // Get attribution data
    const { data: attributions } = await supabase
      .from('user_attribution')
      .select('user_id, first_touch_source, first_touch_medium, first_touch_campaign, signup_device, signup_country, created_at')
      .in('user_id', userIds);

    const attributionMap = {};
    attributions?.forEach(a => {
      attributionMap[a.user_id] = a;
    });

    // Get AL credits data
    const { data: alCredits } = await supabase
      .from('al_user_credits')
      .select('user_id, current_credits, credits_used_this_month, is_unlimited')
      .in('user_id', userIds);

    const alCreditsMap = {};
    alCredits?.forEach(c => {
      alCreditsMap[c.user_id] = c;
    });

    // Get REAL AL conversation counts from al_conversations table
    const { data: alConversations } = await supabase
      .from('al_conversations')
      .select('user_id, id, last_message_at')
      .in('user_id', userIds);

    const alConversationsMap = {};
    alConversations?.forEach(c => {
      if (!alConversationsMap[c.user_id]) {
        alConversationsMap[c.user_id] = { count: 0, lastUsed: null };
      }
      alConversationsMap[c.user_id].count++;
      // Track most recent conversation
      if (!alConversationsMap[c.user_id].lastUsed || 
          new Date(c.last_message_at) > new Date(alConversationsMap[c.user_id].lastUsed)) {
        alConversationsMap[c.user_id].lastUsed = c.last_message_at;
      }
    });

    // Get saved builds count from user_projects
    const { data: projectsData } = await supabase
      .from('user_projects')
      .select('user_id')
      .in('user_id', userIds);

    const projectsMap = {};
    projectsData?.forEach(p => {
      projectsMap[p.user_id] = (projectsMap[p.user_id] || 0) + 1;
    });

    // Get saved events count from event_saves
    const { data: eventSavesData } = await supabase
      .from('event_saves')
      .select('user_id')
      .in('user_id', userIds);

    const eventSavesMap = {};
    eventSavesData?.forEach(e => {
      eventSavesMap[e.user_id] = (eventSavesMap[e.user_id] || 0) + 1;
    });

    // Get compare lists count
    const { data: compareListsData } = await supabase
      .from('user_compare_lists')
      .select('user_id')
      .in('user_id', userIds);

    const compareListsMap = {};
    compareListsData?.forEach(c => {
      compareListsMap[c.user_id] = (compareListsMap[c.user_id] || 0) + 1;
    });

    // Get service logs count (maintenance tracking)
    const { data: serviceLogsData } = await supabase
      .from('user_service_logs')
      .select('user_id')
      .in('user_id', userIds);

    const serviceLogsMap = {};
    serviceLogsData?.forEach(s => {
      serviceLogsMap[s.user_id] = (serviceLogsMap[s.user_id] || 0) + 1;
    });

    // Get feedback count
    const { data: feedbackData } = await supabase
      .from('user_feedback')
      .select('user_id')
      .in('user_id', userIds);

    const feedbackMap = {};
    feedbackData?.forEach(f => {
      if (f.user_id) {
        feedbackMap[f.user_id] = (feedbackMap[f.user_id] || 0) + 1;
      }
    });

    // Get recent activity counts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentActivity } = await supabase
      .from('user_activity')
      .select('user_id, event_type')
      .in('user_id', userIds)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const activityMap = {};
    recentActivity?.forEach(a => {
      if (!activityMap[a.user_id]) {
        activityMap[a.user_id] = { total: 0, types: {} };
      }
      activityMap[a.user_id].total++;
      activityMap[a.user_id].types[a.event_type] = (activityMap[a.user_id].types[a.event_type] || 0) + 1;
    });

    // Get favorites count
    const { data: favoritesData } = await supabase
      .from('user_favorites')
      .select('user_id')
      .in('user_id', userIds);

    const favoritesMap = {};
    favoritesData?.forEach(f => {
      favoritesMap[f.user_id] = (favoritesMap[f.user_id] || 0) + 1;
    });

    // Get garage count
    const { data: garageData } = await supabase
      .from('user_vehicles')
      .select('user_id')
      .in('user_id', userIds);

    const garageMap = {};
    garageData?.forEach(g => {
      garageMap[g.user_id] = (garageMap[g.user_id] || 0) + 1;
    });

    // Combine all data
    const users = profiles.map(profile => {
      const authUser = usersMap[profile.id] || {};
      const attribution = attributionMap[profile.id] || {};
      const credits = alCreditsMap[profile.id] || {};
      const alConvoData = alConversationsMap[profile.id] || { count: 0, lastUsed: null };
      const activity = activityMap[profile.id] || { total: 0, types: {} };
      
      // Determine effective tier
      let effectiveTier = profile.subscription_tier || 'free';
      if (profile.referral_tier_granted) {
        const tierPriority = { free: 0, collector: 1, tuner: 2, admin: 3 };
        const refTierValid = profile.referral_tier_lifetime || 
          (profile.referral_tier_expires_at && new Date(profile.referral_tier_expires_at) > new Date());
        if (refTierValid && tierPriority[profile.referral_tier_granted] > tierPriority[effectiveTier]) {
          effectiveTier = profile.referral_tier_granted;
        }
      }

      return {
        id: profile.id,
        email: authUser.email || null,
        displayName: profile.display_name || authUser.raw_user_meta_data?.full_name || 'Anonymous',
        avatar: authUser.raw_user_meta_data?.avatar_url || null,
        
        // Tier info
        tier: effectiveTier,
        subscriptionTier: profile.subscription_tier || 'free',
        referralTier: profile.referral_tier_granted,
        referralExpires: profile.referral_tier_expires_at,
        isUnlimited: credits.is_unlimited || false,
        
        // Dates
        createdAt: profile.created_at,
        lastSignIn: authUser.last_sign_in_at || null,
        
        // Attribution
        source: attribution.first_touch_source || 'Direct',
        medium: attribution.first_touch_medium || null,
        campaign: attribution.first_touch_campaign || null,
        signupDevice: attribution.signup_device || null,
        signupCountry: attribution.signup_country || null,
        
        // Engagement stats (REAL counts from actual tables)
        garageVehicles: garageMap[profile.id] || 0,       // user_vehicles
        favorites: favoritesMap[profile.id] || 0,         // user_favorites
        savedBuilds: projectsMap[profile.id] || 0,        // user_projects
        savedEvents: eventSavesMap[profile.id] || 0,      // event_saves
        compareLists: compareListsMap[profile.id] || 0,   // user_compare_lists
        serviceLogs: serviceLogsMap[profile.id] || 0,     // user_service_logs (maintenance)
        feedbackCount: feedbackMap[profile.id] || 0,      // user_feedback
        
        // AL usage (REAL conversation count from al_conversations)
        alCredits: credits.current_credits || 0,
        alCreditsUsed: credits.credits_used_this_month || 0,
        alConversations: alConvoData.count,               // REAL count from al_conversations
        alLastUsed: alConvoData.lastUsed,                 // from al_conversations.last_message_at
        
        // Recent activity
        recentActivityCount: activity.total,
        recentActivityTypes: activity.types,
        
        // Referral
        referredByCode: profile.referred_by_code || null,
      };
    });

    // Get summary stats
    const { data: tierCounts } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .then(res => {
        const counts = { free: 0, collector: 0, tuner: 0, admin: 0 };
        res.data?.forEach(p => {
          const tier = p.subscription_tier || 'free';
          counts[tier] = (counts[tier] || 0) + 1;
        });
        return { data: counts };
      });

    // Get total users and active users
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: activeUserIds } = await supabase
      .from('user_activity')
      .select('user_id')
      .gte('created_at', sevenDaysAgo.toISOString());
    
    const uniqueActiveUsers = new Set(activeUserIds?.map(a => a.user_id) || []).size;

    // Source breakdown
    const { data: sourceBreakdown } = await supabase
      .from('user_attribution')
      .select('first_touch_source');
    
    const sourceCounts = {};
    sourceBreakdown?.forEach(s => {
      const source = s.first_touch_source || 'Direct';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
      summary: {
        totalUsers: totalUsers || 0,
        activeUsers7d: uniqueActiveUsers,
        tierBreakdown: tierCounts || { free: 0, collector: 0, tuner: 0, admin: 0 },
        sourceBreakdown: sourceCounts,
      },
    });

  } catch (err) {
    console.error('[AdminUsers] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper to check if string is valid UUID
function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

