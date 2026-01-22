/**
 * Event Tracking API
 * 
 * Tracks custom user events for marketing analytics.
 * 
 * POST /api/analytics/event
 */

import { createClient } from '@supabase/supabase-js';
import { errors } from '@/lib/apiErrors';
import { headers } from 'next/headers';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Parse user agent to extract device info
 */
function parseUserAgent(ua) {
  if (!ua) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };
  
  let device = 'Desktop';
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
    device = /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Mobile';
  }
  
  let browser = 'Unknown';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'Mac';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';
  
  return { device, browser, os };
}

async function handlePost(request) {
  const headersList = await headers();
    const body = await request.json();
    
    const {
      eventName,
      eventCategory,
      properties,
      sessionId,
      userId,
      pagePath,
      pageTitle,
      utmSource,
      utmMedium,
      utmCampaign
    } = body;
    
    // Validate required fields
    if (!eventName || !sessionId) {
      return Response.json(
        { error: 'Missing required fields: eventName, sessionId' },
        { status: 400 }
      );
    }
    
    // Get device info
    const userAgent = headersList.get('user-agent') || '';
    const { device, browser, os } = parseUserAgent(userAgent);
    
    // Get geo from Vercel headers
    const country = headersList.get('x-vercel-ip-country');
    const countryCode = headersList.get('x-vercel-ip-country');
    
    // Insert event
    const { error } = await supabaseAdmin
      .from('user_events')
      .insert({
        event_name: eventName,
        event_category: eventCategory || null,
        properties: properties || {},
        session_id: sessionId,
        user_id: userId || null,
        page_path: pagePath || null,
        page_title: pageTitle || null,
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null,
        device_type: device,
        browser,
        os,
        country: country ? decodeURIComponent(country) : null,
        country_code: countryCode
      });
    
    if (error) {
      console.error('[Analytics] Failed to track event:', error);
      return Response.json({ error: 'Failed to track' }, { status: 500 });
    }
    
    // Update session events count
    await supabaseAdmin
      .from('user_sessions')
      .update({ 
        events_count: supabaseAdmin.rpc('increment', { row_id: sessionId }),
        last_activity_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);
    
    return Response.json({ success: true });
}

export const POST = withErrorLogging(handlePost, { route: 'analytics/event', feature: 'analytics' });

