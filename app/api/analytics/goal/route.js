/**
 * Goal Completion API
 * 
 * POST /api/analytics/goal
 * 
 * Records when users complete conversion goals.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    
    const {
      goalKey,
      sessionId,
      userId,
      pagePath,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      valueCents,
      attributionSource,
      attributionMedium
    } = body;
    
    // Validate required fields
    if (!goalKey || !sessionId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Get goal ID
    const { data: goal, error: goalError } = await supabase
      .from('analytics_goals')
      .select('id, default_value_cents')
      .eq('goal_key', goalKey)
      .eq('is_active', true)
      .single();
    
    if (goalError || !goal) {
      console.error('[Goal API] Goal not found:', goalKey);
      return Response.json({ error: 'Goal not found' }, { status: 404 });
    }
    
    // Check for duplicate completion (prevent spam)
    if (userId) {
      const { count } = await supabase
        .from('goal_completions')
        .select('id', { count: 'exact', head: true })
        .eq('goal_id', goal.id)
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 60000).toISOString()); // Last minute
      
      if (count > 0) {
        return Response.json({ success: true, duplicate: true });
      }
    }
    
    // Calculate days to convert if we have first touch data
    let daysToConvert = null;
    if (userId) {
      const { data: attribution } = await supabase
        .from('user_attribution')
        .select('first_touch_at')
        .eq('user_id', userId)
        .single();
      
      if (attribution?.first_touch_at) {
        const firstTouchDate = new Date(attribution.first_touch_at);
        daysToConvert = Math.floor((Date.now() - firstTouchDate.getTime()) / (1000 * 60 * 60 * 24));
      }
    }
    
    // Insert completion
    const { error } = await supabase
      .from('goal_completions')
      .insert({
        goal_id: goal.id,
        user_id: userId || null,
        session_id: sessionId,
        page_path: pagePath || null,
        referrer: referrer || null,
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null,
        value_cents: valueCents ?? goal.default_value_cents ?? 0,
        attribution_source: attributionSource || utmSource || null,
        attribution_medium: attributionMedium || utmMedium || null,
        days_to_convert: daysToConvert
      });
    
    if (error) {
      console.error('[Goal API] Insert error:', error);
    }
    
    return Response.json({ success: true });
    
  } catch (error) {
    console.error('[Goal API] Error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

