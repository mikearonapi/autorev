/**
 * Page View Tracking API
 * 
 * Tracks page views for the internal analytics dashboard.
 * Uses Vercel geo headers for location data.
 * 
 * POST /api/analytics/track
 */

import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

// Create admin client for inserting page views (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Parse user agent to extract device, browser, and OS info
 */
function parseUserAgent(ua) {
  if (!ua) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };
  
  // Device type
  let device = 'Desktop';
  if (/Mobile|Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    device = /iPad|Tablet/i.test(ua) ? 'Tablet' : 'Mobile';
  }
  
  // Browser detection
  let browser = 'Unknown';
  let browserVersion = '';
  
  if (ua.includes('Firefox/')) {
    browser = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Edg/')) {
    browser = 'Edge';
    browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Chrome/')) {
    browser = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    browser = 'Safari';
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || '';
  } else if (ua.includes('Opera') || ua.includes('OPR/')) {
    browser = 'Opera';
    browserVersion = ua.match(/(?:Opera|OPR)\/(\d+)/)?.[1] || '';
  }
  
  // OS detection
  let os = 'Unknown';
  let osVersion = '';
  
  if (ua.includes('Windows')) {
    os = 'Windows';
    if (ua.includes('Windows NT 10')) osVersion = '10';
    else if (ua.includes('Windows NT 11')) osVersion = '11';
  } else if (ua.includes('Mac OS X')) {
    os = 'Mac';
    osVersion = ua.match(/Mac OS X (\d+[._]\d+)/)?.[1]?.replace('_', '.') || '';
  } else if (ua.includes('Android')) {
    os = 'Android';
    osVersion = ua.match(/Android (\d+)/)?.[1] || '';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = 'iOS';
    osVersion = ua.match(/OS (\d+)/)?.[1] || '';
  } else if (ua.includes('Linux')) {
    os = 'Linux';
  }
  
  return {
    device,
    browser,
    browserVersion,
    os,
    osVersion
  };
}

/**
 * Extract hostname from URL
 */
function getHostname(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Extract UTM parameters from URL
 */
function parseUtmParams(url) {
  if (!url) return {};
  try {
    const urlObj = new URL(url);
    return {
      utm_source: urlObj.searchParams.get('utm_source'),
      utm_medium: urlObj.searchParams.get('utm_medium'),
      utm_campaign: urlObj.searchParams.get('utm_campaign'),
      utm_term: urlObj.searchParams.get('utm_term'),
      utm_content: urlObj.searchParams.get('utm_content')
    };
  } catch {
    return {};
  }
}

export async function POST(request) {
  try {
    const headersList = await headers();
    const body = await request.json();
    
    const {
      path,
      route,
      referrer,
      sessionId,
      pageUrl,
      userId,
      pageLoadTime
    } = body;
    
    // Validate required fields
    if (!path || !sessionId) {
      return Response.json(
        { error: 'Missing required fields: path, sessionId' },
        { status: 400 }
      );
    }
    
    // Get user agent
    const userAgent = headersList.get('user-agent') || '';
    const { device, browser, browserVersion, os, osVersion } = parseUserAgent(userAgent);
    
    // Get geo info from Vercel headers
    const country = headersList.get('x-vercel-ip-country') || null;
    const countryCode = headersList.get('x-vercel-ip-country') || null;
    const region = headersList.get('x-vercel-ip-country-region') || null;
    const city = headersList.get('x-vercel-ip-city') || null;
    
    // Parse referrer
    const referrerHostname = getHostname(referrer);
    
    // Parse UTM parameters
    const utmParams = parseUtmParams(pageUrl);
    
    // Insert page view
    const { error } = await supabaseAdmin
      .from('page_views')
      .insert({
        path,
        route: route || path,
        session_id: sessionId,
        referrer: referrer || null,
        referrer_hostname: referrerHostname,
        device_type: device,
        browser,
        browser_version: browserVersion,
        os,
        os_version: osVersion,
        country: country ? decodeURIComponent(country) : null,
        country_code: countryCode,
        region: region ? decodeURIComponent(region) : null,
        city: city ? decodeURIComponent(city) : null,
        user_id: userId || null,
        page_load_time: pageLoadTime || null,
        ...utmParams
      });
    
    if (error) {
      console.error('[Analytics] Failed to track page view:', error);
      return Response.json({ error: 'Failed to track' }, { status: 500 });
    }
    
    return Response.json({ success: true });
    
  } catch (error) {
    console.error('[Analytics] Track error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Ignore GET requests
export async function GET() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

