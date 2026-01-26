/**
 * User Attribution API
 * 
 * Captures and updates user attribution data.
 * Called on signup to record first/last touch attribution.
 * 
 * POST /api/analytics/attribution
 */

import { headers } from 'next/headers';

import { createClient } from '@supabase/supabase-js';

import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Parse user agent for device type
 */
function getDeviceType(ua) {
  if (!ua) return 'Unknown';
  if (/Mobile|Android|iPhone|iPod/i.test(ua)) return 'Mobile';
  if (/iPad|Tablet/i.test(ua)) return 'Tablet';
  return 'Desktop';
}

async function handlePost(request) {
  const headersList = await headers();
    const body = await request.json();
    
    const {
      userId,
      source,
      medium,
      campaign,
      referrer,
      landingPage,
      signupPage,
      isFirstTouch = true
    } = body;
    
    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 });
    }
    
    const userAgent = headersList.get('user-agent') || '';
    const country = headersList.get('x-vercel-ip-country');
    const deviceType = getDeviceType(userAgent);
    const now = new Date().toISOString();
    
    // Check if attribution record exists
    const { data: existing } = await supabaseAdmin
      .from('user_attribution')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (existing) {
      // Update last touch only
      const { error } = await supabaseAdmin
        .from('user_attribution')
        .update({
          last_touch_source: source || null,
          last_touch_medium: medium || null,
          last_touch_campaign: campaign || null,
          last_touch_referrer: referrer || null,
          last_touch_landing_page: landingPage || null,
          last_touch_at: now,
          updated_at: now
        })
        .eq('user_id', userId);
      
      if (error) {
        console.error('[Attribution] Update error:', error);
        return Response.json({ error: 'Failed to update' }, { status: 500 });
      }
    } else {
      // Create new attribution record
      const { error } = await supabaseAdmin
        .from('user_attribution')
        .insert({
          user_id: userId,
          first_touch_source: source || null,
          first_touch_medium: medium || null,
          first_touch_campaign: campaign || null,
          first_touch_referrer: referrer || null,
          first_touch_landing_page: landingPage || null,
          first_touch_at: now,
          last_touch_source: source || null,
          last_touch_medium: medium || null,
          last_touch_campaign: campaign || null,
          last_touch_referrer: referrer || null,
          last_touch_landing_page: landingPage || null,
          last_touch_at: now,
          signup_page: signupPage || null,
          signup_device: deviceType,
          signup_country: country ? decodeURIComponent(country) : null
        });
      
      if (error) {
        console.error('[Attribution] Insert error:', error);
        return Response.json({ error: 'Failed to create' }, { status: 500 });
      }
    }
    
    return Response.json({ success: true });
}

export const POST = withErrorLogging(handlePost, { route: 'analytics/attribution', feature: 'analytics' });

