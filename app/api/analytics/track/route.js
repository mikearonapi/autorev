/**
 * Page View Tracking API
 * 
 * Tracks page views for the internal analytics dashboard.
 * Uses Vercel geo headers for location data.
 * Includes bot filtering to align with Vercel Analytics.
 * 
 * POST /api/analytics/track
 */

import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Create admin client for inserting page views (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Common bot/crawler user agent patterns
 * These are filtered out by Vercel Analytics, so we should too
 */
const BOT_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /slurp/i,
  /mediapartners/i,
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /baidu/i,
  /duckduckbot/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /twitterbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /discordbot/i,
  /applebot/i,
  /semrush/i,
  /ahrefs/i,
  /mj12bot/i,
  /dotbot/i,
  /petalbot/i,
  /bytespider/i,
  /gptbot/i,
  /claudebot/i,
  /anthropic/i,
  /chatgpt/i,
  /headless/i,
  /phantom/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /wget/i,
  /curl/i,
  /httpx/i,
  /python-requests/i,
  /axios/i,
  /node-fetch/i,
  /go-http-client/i,
  /java\//i,
  /okhttp/i,
  /postman/i,
  /insomnia/i,
  /preview/i,
  /prerender/i,
  /lighthouse/i,
  /pagespeed/i,
  /gtmetrix/i,
  /pingdom/i,
  /uptimerobot/i,
  /statuscake/i,
];

/**
 * Check if user agent is a bot/crawler
 */
function isBot(userAgent) {
  if (!userAgent) return false;
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent));
}

/**
 * Parse user agent to extract device, browser, and OS info
 */
function parseUserAgent(ua) {
  if (!ua) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown', isBot: false };
  
  const botDetected = isBot(ua);
  
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
    osVersion,
    isBot: botDetected
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

async function handlePost(request) {
  const headersList = await headers();
    const body = await request.json();
    
    const {
      path,
      route,
      referrer,
      sessionId,
      visitorId,  // Persistent across sessions (localStorage)
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
    const { device, browser, browserVersion, os, osVersion, isBot: botDetected } = parseUserAgent(userAgent);
    
    // Skip bot traffic entirely (like Vercel Analytics does)
    // This keeps our metrics aligned with Vercel's numbers
    if (botDetected) {
      return Response.json({ success: true, skipped: 'bot' });
    }
    
    // Get geo info from Vercel headers
    const country = headersList.get('x-vercel-ip-country') || null;
    const countryCode = headersList.get('x-vercel-ip-country') || null;
    const region = headersList.get('x-vercel-ip-country-region') || null;
    const city = headersList.get('x-vercel-ip-city') || null;
    
    // Parse referrer
    const referrerHostname = getHostname(referrer);
    
    // Parse UTM parameters
    const utmParams = parseUtmParams(pageUrl);
    
    // Insert page view with visitor_id for accurate unique visitor counting
    const { error } = await supabaseAdmin
      .from('page_views')
      .insert({
        path,
        route: route || path,
        session_id: sessionId,
        visitor_id: visitorId || null,  // Persistent visitor ID
        is_bot: false,  // Already filtered bots above
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
}

// Ignore GET requests
async function handleGet() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

export const POST = withErrorLogging(handlePost, { route: 'analytics/track', feature: 'analytics' });
export const GET = withErrorLogging(handleGet, { route: 'analytics/track', feature: 'analytics' });