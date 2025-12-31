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

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

export async function GET(request) {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user || !isAdminEmail(user.email)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const { startDate, endDate } = getDateRange(range);
    
    // Fetch all data in parallel
    const [funnelData, attributionData, cohortData, eventCounts, eventTrends] = await Promise.all([
      supabaseAdmin.rpc('get_funnel_metrics', { p_start_date: startDate, p_end_date: endDate }),
      supabaseAdmin.rpc('get_attribution_breakdown', { p_start_date: startDate, p_end_date: endDate }),
      supabaseAdmin.rpc('get_cohort_retention', { p_weeks: 8 }),
      supabaseAdmin.rpc('get_event_counts', { p_start_date: startDate, p_end_date: endDate }),
      supabaseAdmin.rpc('get_event_trends', { 
        p_event_names: ['signup_completed', 'onboarding_completed', 'car_selected', 'al_conversation_started'],
        p_start_date: startDate, 
        p_end_date: endDate 
      })
    ]);
    
    // Calculate conversion rates
    const funnel = funnelData.data || {};
    const conversionRates = {
      visitorToSignup: funnel.visitors > 0 
        ? ((funnel.signupCompleted / funnel.visitors) * 100).toFixed(1) 
        : 0,
      signupToOnboarding: funnel.signupCompleted > 0 
        ? ((funnel.onboardingCompleted / funnel.signupCompleted) * 100).toFixed(1) 
        : 0,
      onboardingToActivation: funnel.onboardingCompleted > 0 
        ? ((funnel.activated / funnel.onboardingCompleted) * 100).toFixed(1) 
        : 0,
      activationToConversion: funnel.activated > 0 
        ? ((funnel.converted / funnel.activated) * 100).toFixed(1) 
        : 0
    };
    
    return Response.json({
      range,
      startDate,
      endDate,
      funnel: {
        ...funnel,
        conversionRates
      },
      attribution: attributionData.data || {},
      cohorts: cohortData.data || [],
      events: eventCounts.data || [],
      eventTrends: eventTrends.data || []
    });
    
  } catch (error) {
    console.error('[Marketing Analytics] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

