/**
 * Click Tracking API
 * 
 * POST /api/analytics/click
 * 
 * Tracks click events for heatmap generation and UX analysis.
 * Records element info and position data.
 */

import { createClient } from '@supabase/supabase-js';
import { errors } from '@/lib/apiErrors';
import { headers } from 'next/headers';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse device type from user agent
function getDeviceType(userAgent) {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

async function handlePost(request) {
  const body = await request.json();
    const headersList = await headers();
    const userAgent = headersList.get('user-agent');
    
    const {
      sessionId,
      userId,
      path,
      elementTag,
      elementId,
      elementClass,
      elementText,
      elementHref,
      xPercent,
      yPercent,
      viewportWidth,
      viewportHeight
    } = body;
    
    // Validate required fields
    if (!sessionId || !path) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Insert click record
    const { error } = await supabase
      .from('click_events')
      .insert({
        session_id: sessionId,
        user_id: userId || null,
        path,
        element_tag: elementTag || null,
        element_id: elementId || null,
        element_class: elementClass || null,
        element_text: elementText || null,
        element_href: elementHref || null,
        x_percent: xPercent ? parseFloat(xPercent) : null,
        y_percent: yPercent ? parseFloat(yPercent) : null,
        viewport_width: viewportWidth || null,
        viewport_height: viewportHeight || null,
        device_type: getDeviceType(userAgent)
      });
    
    if (error) {
      console.error('[Click API] Insert error:', error);
    }
    
    return Response.json({ success: true });
}

export const POST = withErrorLogging(handlePost, { route: 'analytics/click', feature: 'analytics' });

