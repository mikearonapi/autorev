/**
 * Marketing Analytics API
 *
 * Returns marketing-focused analytics: funnels, attribution, cohorts, events.
 * Requires admin authentication.
 *
 * GET /api/admin/marketing-analytics?range=30d
 */

import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - this route uses request.headers and request.url
export const dynamic = 'force-dynamic';
import { isAdminEmail } from '@/lib/adminAccess';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Paths to exclude from analytics
const EXCLUDED_PATHS = ['/admin', '/internal'];

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
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  return { startDate, endDate };
}

async function handleGet(request) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user || !isAdminEmail(user.email)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const { startDate, endDate } = getDateRange(range);

    // Calculate funnel metrics (include all users for consistent counts)
    const [pageViewsResult, usersResult, analyticsEventsResult, attributionData, cohortData] =
      await Promise.all([
        // Get page views for visitor count (excluding admin paths and users)
        supabaseAdmin
          .from('page_views')
          .select('session_id, user_id, path')
          .gte('created_at', startDate)
          .lte('created_at', endDate),

        // Get users (excluding admins) with their profiles
        supabaseAdmin
          .from('user_profiles')
          .select('id, created_at, onboarding_completed_at, subscription_tier'),

        // Get analytics events for funnel stages
        supabaseAdmin
          .from('analytics_events')
          .select('event_name, user_id, created_at')
          .in('event_name', [
            'signup_completed',
            'onboarding_completed',
            'car_selected',
            'first_al_conversation',
            'subscription_started',
          ])
          .gte('created_at', startDate)
          .lte('created_at', endDate),

        // Attribution (using RPC for now, will need migration to filter properly)
        supabaseAdmin.rpc('get_attribution_breakdown', {
          p_start_date: startDate,
          p_end_date: endDate,
        }),

        // Cohorts (using RPC for now)
        supabaseAdmin.rpc('get_cohort_retention', { p_weeks: 8 }),
      ]);

    // Filter page views to exclude internal paths only (include all users)
    const filteredViews = (pageViewsResult.data || []).filter((pv) => {
      if (EXCLUDED_PATHS.some((excluded) => pv.path?.startsWith(excluded))) return false;
      return true;
    });

    // Calculate unique visitors
    const uniqueSessions = new Set(filteredViews.map((pv) => pv.session_id));
    const visitors = uniqueSessions.size;

    // Include ALL users for consistent counts across dashboard
    const allUsers = usersResult.data || [];

    // Include ALL events for consistent counts
    const allEvents = analyticsEventsResult.data || [];

    // Calculate funnel stages
    const signupsInPeriod = allUsers.filter(
      (u) => u.created_at >= startDate && u.created_at <= endDate
    ).length;

    const onboardedCount =
      allEvents.filter((e) => e.event_name === 'onboarding_completed').length ||
      allUsers.filter(
        (u) =>
          u.onboarding_completed_at &&
          u.onboarding_completed_at >= startDate &&
          u.onboarding_completed_at <= endDate
      ).length;

    const activatedCount = allEvents.filter(
      (e) => e.event_name === 'car_selected' || e.event_name === 'first_al_conversation'
    ).length;

    const convertedCount =
      allEvents.filter((e) => e.event_name === 'subscription_started').length ||
      allUsers.filter((u) => u.subscription_tier && u.subscription_tier !== 'free').length;

    // Build funnel object
    const funnel = {
      visitors,
      signups: signupsInPeriod,
      onboarded: onboardedCount,
      activated: activatedCount,
      converted: convertedCount,
    };

    // Calculate conversion rates
    const conversionRates = {
      visitorToSignup:
        funnel.visitors > 0 ? ((funnel.signups / funnel.visitors) * 100).toFixed(1) : 0,
      signupToOnboarding:
        funnel.signups > 0 ? ((funnel.onboarded / funnel.signups) * 100).toFixed(1) : 0,
      onboardingToActivation:
        funnel.onboarded > 0 ? ((funnel.activated / funnel.onboarded) * 100).toFixed(1) : 0,
      activationToConversion:
        funnel.activated > 0 ? ((funnel.converted / funnel.activated) * 100).toFixed(1) : 0,
    };

    // Get event counts (excluding admin users)
    const eventCounts = {};
    allEvents.forEach((e) => {
      eventCounts[e.event_name] = (eventCounts[e.event_name] || 0) + 1;
    });
    const events = Object.entries(eventCounts).map(([name, count]) => ({
      event_name: name,
      count,
    }));

    return Response.json({
      range,
      startDate,
      endDate,
      funnel: {
        ...funnel,
        conversionRates,
      },
      attribution: attributionData.data || {},
      cohorts: cohortData.data || [],
      events,
      eventTrends: [],
    });
  } catch (error) {
    console.error('[Marketing Analytics] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, {
  route: 'admin/marketing-analytics',
  feature: 'admin',
});