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
import { buildPagination, buildProfilesForAuthUsers, computeMissingUserProfileRows } from '@/lib/adminUsersService';

// Force dynamic rendering - this route uses request.headers and request.url
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function listUsersSafe(supabase, options) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers(options);
    if (error) return { users: [], total: null, error };
    return { users: data?.users || [], total: typeof data?.total === 'number' ? data.total : null, error: null };
  } catch (err) {
    // Some environments/SDK versions can throw if options are unsupported
    try {
      const { data, error } = await supabase.auth.admin.listUsers();
      if (error) return { users: [], total: null, error };
      return { users: data?.users || [], total: typeof data?.total === 'number' ? data.total : null, error: null };
    } catch (innerErr) {
      return { users: [], total: null, error: innerErr };
    }
  }
}

export async function GET(request) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[AdminUsers] Missing Supabase env vars', {
        hasUrl: Boolean(supabaseUrl),
        hasServiceKey: Boolean(supabaseServiceKey),
      });
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 });
    }

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
    const debug = searchParams.get('debug') === '1';
    
    const isFiltered = Boolean(search) || Boolean(tierFilter);

    // ------------------------------------------------------------------
    // Ensure `user_profiles` stays in sync with `auth.users`
    //
    // Admin panel should never "lose" users due to missing profile rows.
    // We do a light self-heal by:
    // - listing auth users (admin API)
    // - inserting any missing `user_profiles` rows (id + basic metadata)
    // ------------------------------------------------------------------
    // For the default view (no filters), we want the table rows to reflect auth-users
    // so the admin panel never "drops" users due to profile drift.
    // When filtered, we keep the existing DB-driven query so filters behave as expected.
    const { users: authUsersForPage, total: authUsersTotal, error: authListError } =
      await listUsersSafe(supabase, { page: isFiltered ? 1 : page, perPage: isFiltered ? 1000 : limit });

    if (authListError) {
      console.warn('[AdminUsers] auth.admin.listUsers error:', authListError);
    } else if (authUsersForPage.length) {
      const authIds = authUsersForPage.map(u => u.id);
      const { data: existingProfiles, error: existingProfilesError } = await supabase
        .from('user_profiles')
        .select('id')
        .in('id', authIds);

      if (existingProfilesError) {
        console.warn('[AdminUsers] Failed checking existing profiles:', existingProfilesError);
      } else {
        const existingIdSet = new Set((existingProfiles || []).map(p => p.id));
        const missingRows = computeMissingUserProfileRows(authUsersForPage, existingIdSet);

        if (missingRows.length) {
          const { error: insertError } = await supabase
            .from('user_profiles')
            .upsert(missingRows, { onConflict: 'id', ignoreDuplicates: true });

          if (insertError) {
            console.warn('[AdminUsers] Failed to backfill missing user_profiles:', insertError);
          } else {
            console.info('[AdminUsers] Backfilled missing user_profiles:', { count: missingRows.length });
          }
        }
      }
    }
    
    // ------------------------------------------------------------------
    // Select which users we're returning (page) + how we compute pagination
    // ------------------------------------------------------------------
    /** @type {any[]} */
    let profiles = [];
    /** @type {number|null} */
    let count = null;
    /** @type {string[]} */
    let userIds = [];

    const profileSelect = `
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
    `;

    // Apply sorting - only for database fields
    // Engagement fields (garage, favorites, etc.) will be sorted post-query
    const dbSortFields = ['created_at', 'updated_at', 'display_name', 'subscription_tier'];
    const engagementSortFields = ['garage', 'favorites', 'builds', 'events', 'al_chats', 'compares', 'service', 'feedback', 'recent_activity', 'last_sign_in'];
    const isDbSort = dbSortFields.includes(sort);
    const isEngagementSort = engagementSortFields.includes(sort);

    // Always query user_profiles directly for the most accurate/fresh data
    // auth.admin.listUsers can have replication lag causing stale counts
    if (!isFiltered) {
      // Default view: query user_profiles directly (more reliable than auth.admin.listUsers)
      const pagination = buildPagination({ page, limit, total: Number.MAX_SAFE_INTEGER });
      const offset = pagination.offset;

      let query = supabase
        .from('user_profiles')
        .select(profileSelect, { count: 'exact' });

      if (isDbSort) {
        query = query.order(sort, { ascending: order === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      query = query.range(offset, offset + limit - 1);

      const { data: pageProfiles, count: profileCount, error: pageProfilesError } = await query;

      if (pageProfilesError) {
        console.error('[AdminUsers] Profiles error:', pageProfilesError);
        return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
      }

      profiles = pageProfiles || [];
      count = typeof profileCount === 'number' ? profileCount : null;
      userIds = profiles.map(p => p.id);
    } else {
      // Filtered view: keep DB-driven query for correct filtering behavior
      const pagination = buildPagination({ page, limit, total: Number.MAX_SAFE_INTEGER });
      const offset = pagination.offset;

      let query = supabase
        .from('user_profiles')
        .select(profileSelect, { count: 'exact' });

      if (search) {
        query = query.or(`display_name.ilike.%${search}%,id.eq.${isUUID(search) ? search : '00000000-0000-0000-0000-000000000000'}`);
      }

      if (tierFilter) {
        query = query.eq('subscription_tier', tierFilter);
      }

      if (isDbSort) {
        query = query.order(sort, { ascending: order === 'asc' });
      } else {
        // Default to created_at for initial fetch, we'll sort later for engagement fields
        query = query.order('created_at', { ascending: false });
      }

      query = query.range(offset, offset + limit - 1);

      const { data: filteredProfiles, count: filteredCount, error: profilesError } = await query;

      if (profilesError) {
        console.error('[AdminUsers] Profiles error:', profilesError);
        return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
      }

      profiles = filteredProfiles || [];
      count = typeof filteredCount === 'number' ? filteredCount : null;
      userIds = profiles.map(p => p.id);
    }

    // Get user emails from auth.users using the Admin API
    // The auth schema cannot be queried via .from() - must use auth.admin methods
    const usersMap = {};

    // Prefer the single `listUsers` call we already made (avoids N calls).
    // Fallback to getUserById only for IDs not present in the list.
    if (!authListError) {
      for (const u of authUsersForPage) {
        if (!u?.id) continue;
        usersMap[u.id] = {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          raw_user_meta_data: u.user_metadata,
        };
      }
    }

    const idsNeedingLookup = userIds.filter(id => !usersMap[id]);
    if (idsNeedingLookup.length) {
      const authPromises = idsNeedingLookup.map(id =>
        supabase.auth.admin.getUserById(id)
          .then(({ data, error }) => {
            if (error || !data?.user) return null;
            return {
              id: data.user.id,
              email: data.user.email,
              created_at: data.user.created_at,
              last_sign_in_at: data.user.last_sign_in_at,
              raw_user_meta_data: data.user.user_metadata,
            };
          })
          .catch(() => null)
      );

      const authResults = await Promise.all(authPromises);
      for (const u of authResults) {
        if (u?.id) usersMap[u.id] = u;
      }
    }

    // Get attribution data
    const { data: attributions } = await supabase
      .from('user_attribution')
      .select('user_id, first_touch_source, first_touch_medium, first_touch_campaign, signup_device, signup_country, created_at')
      .in('user_id', userIds);

    const attributionMap = {};
    attributions?.forEach(a => {
      attributionMap[a.user_id] = a;
    });

    // Get AL credits data - include messages_this_month for more accurate usage display
    const { data: alCredits } = await supabase
      .from('al_user_credits')
      .select('user_id, current_credits, credits_used_this_month, messages_this_month, is_unlimited')
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
      // Priority: admin email > referral tier > subscription tier > free
      const tierPriority = { free: 0, collector: 1, tuner: 2, admin: 3 };
      let effectiveTier = profile.subscription_tier || 'free';
      
      // Check for referral tier upgrade
      if (profile.referral_tier_granted) {
        const refTierValid = profile.referral_tier_lifetime || 
          (profile.referral_tier_expires_at && new Date(profile.referral_tier_expires_at) > new Date());
        if (refTierValid && tierPriority[profile.referral_tier_granted] > tierPriority[effectiveTier]) {
          effectiveTier = profile.referral_tier_granted;
        }
      }
      
      // Admin email override - highest priority
      // If user's email is in ADMIN_EMAILS, they are always admin tier
      if (authUser.email && isAdminEmail(authUser.email)) {
        effectiveTier = 'admin';
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
        
        // AL usage (REAL data from al_user_credits and al_conversations)
        alCredits: credits.current_credits || 0,
        alCreditsUsed: credits.credits_used_this_month || 0,
        alMessagesThisMonth: credits.messages_this_month || 0,  // Actual message count
        alConversations: alConvoData.count,               // REAL count from al_conversations
        alLastUsed: alConvoData.lastUsed,                 // from al_conversations.last_message_at
        
        // Recent activity
        recentActivityCount: activity.total,
        recentActivityTypes: activity.types,
        
        // Referral
        referredByCode: profile.referred_by_code || null,
      };
    });

    // Apply post-query sorting for engagement fields
    const sortFieldMap = {
      'garage': 'garageVehicles',
      'favorites': 'favorites',
      'builds': 'savedBuilds',
      'events': 'savedEvents',
      'al_chats': 'alConversations',
      'compares': 'compareLists',
      'service': 'serviceLogs',
      'feedback': 'feedbackCount',
      'recent_activity': 'recentActivityCount',
      'last_sign_in': 'lastSignIn',
      // DB-ish sorts (needed when we source the page from auth.users)
      'created_at': 'createdAt',
      'display_name': 'displayName',
      'subscription_tier': 'subscriptionTier',
    };
    
    if (sortFieldMap[sort]) {
      const field = sortFieldMap[sort];
      users.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        // Handle dates
        if (field === 'lastSignIn' || field === 'createdAt') {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        }
        
        // Handle strings (displayName, subscriptionTier)
        if (typeof aVal === 'string' || typeof bVal === 'string') {
          const aStr = (aVal == null ? '' : String(aVal)).toLowerCase();
          const bStr = (bVal == null ? '' : String(bVal)).toLowerCase();
          if (order === 'asc') return aStr.localeCompare(bStr);
          return bStr.localeCompare(aStr);
        }

        // Handle nulls/undefined for numeric comparisons
        if (aVal == null) aVal = 0;
        if (bVal == null) bVal = 0;

        if (order === 'asc') return aVal - bVal;
        return bVal - aVal;
      });
    }

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
    const { count: totalProfileUsers } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true });

    // Prefer profile count (direct DB query is more reliable than auth.admin.listUsers which can lag)
    const totalUsers = totalProfileUsers || (typeof authUsersTotal === 'number' ? authUsersTotal : 0);

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

    // Return with explicit cache-control to prevent browser caching
    const responseBody = {
      users,
      pagination: {
        page,
        limit,
        total: 0, // filled below after we compute authoritative totals
        totalPages: 1,
      },
      summary: {
        totalUsers,
        activeUsers7d: uniqueActiveUsers,
        tierBreakdown: tierCounts || { free: 0, collector: 0, tuner: 0, admin: 0 },
        sourceBreakdown: sourceCounts,
      },
    };

    // Pagination totals:
    // - Use the count from query (profile count) - more reliable than auth.admin.listUsers
    const paginationTotal =
      (typeof count === 'number'
        ? count
        : (totalProfileUsers || (typeof authUsersTotal === 'number' ? authUsersTotal : 0)));
    responseBody.pagination.total = paginationTotal;
    responseBody.pagination.totalPages = Math.max(1, Math.ceil(paginationTotal / limit));

    // Optional debug for admins (helps confirm the admin panel is hitting the intended project)
    if (debug) {
      let supabaseHost = null;
      try {
        supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : null;
      } catch {
        supabaseHost = null;
      }
      responseBody.debug = {
        supabaseHost,
        authUsersTotal,
        userProfilesTotal: totalProfileUsers,
        pageCountFromProfilesQuery: count,
        isFiltered,
      };
    }

    return NextResponse.json(responseBody, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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

