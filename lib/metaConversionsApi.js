/**
 * Meta Conversions API (CAPI) Client
 * 
 * Sends server-side events to Meta for:
 * - Better ad attribution (bypasses iOS ATT, ad blockers)
 * - Event deduplication with browser pixel
 * - Enhanced audience building
 * 
 * @module lib/metaConversionsApi
 */

import crypto from 'crypto';

const META_PIXEL_ID = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
const META_ACCESS_TOKEN = process.env.META_CONVERSIONS_API_TOKEN;
const META_API_VERSION = 'v18.0';

/**
 * Hash a string with SHA256 (required for PII like email)
 * Meta requires all PII to be hashed before sending
 */
function hashSHA256(value) {
  if (!value || typeof value !== 'string') return null;
  
  // Normalize: lowercase and trim
  const normalized = value.toLowerCase().trim();
  
  return crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex');
}

/**
 * Generate a unique event ID for deduplication
 * Format: {eventName}_{timestamp}_{random}
 * 
 * This event_id should match the one sent from the browser pixel
 * to enable proper deduplication
 */
export function generateEventId(eventName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${eventName}_${timestamp}_${random}`;
}

/**
 * Send a conversion event to Meta Conversions API
 * 
 * @param {string} eventName - Standard or custom event name (e.g., 'Lead', 'Subscribe', 'Purchase')
 * @param {Object} options - Event options
 * @param {string} options.email - User email (will be hashed)
 * @param {string} [options.eventId] - Unique event ID for deduplication (auto-generated if not provided)
 * @param {string} [options.eventSourceUrl] - URL where event occurred
 * @param {string} [options.userAgent] - User agent string from request
 * @param {string} [options.clientIpAddress] - Client IP address from request
 * @param {string} [options.fbp] - Facebook browser ID cookie (_fbp)
 * @param {string} [options.fbc] - Facebook click ID cookie (_fbc)
 * @param {Object} [options.customData] - Custom data (value, currency, content_name, etc.)
 * @param {Object} [options.userData] - Additional user data to include
 * 
 * @returns {Promise<{success: boolean, eventId: string, error?: string}>}
 * 
 * @example
 * await sendMetaEvent('Lead', {
 *   email: 'user@example.com',
 *   eventSourceUrl: 'https://autorev.app/signup',
 *   userAgent: req.headers.get('user-agent'),
 *   clientIpAddress: req.headers.get('x-forwarded-for')
 * });
 */
export async function sendMetaEvent(eventName, options = {}) {
  // Don't send if not configured (fail silently)
  if (!META_PIXEL_ID || !META_ACCESS_TOKEN) {
    console.warn('[Meta CAPI] Not configured - skipping event:', eventName);
    return { success: false, eventId: null, error: 'Not configured' };
  }

  const {
    email,
    eventId = generateEventId(eventName),
    eventSourceUrl,
    userAgent,
    clientIpAddress,
    fbp, // Facebook browser ID cookie
    fbc, // Facebook click ID cookie
    customData = {},
    userData = {},
  } = options;

  try {
    // Build user_data object
    const user_data = {};
    
    // Email is required - hash it
    if (email) {
      user_data.em = [hashSHA256(email)];
    }
    
    // Add optional user data
    if (clientIpAddress) {
      user_data.client_ip_address = clientIpAddress;
    }
    
    if (userAgent) {
      user_data.client_user_agent = userAgent;
    }
    
    // Facebook browser/click IDs for better matching
    if (fbp) {
      user_data.fbp = fbp;
    }
    
    if (fbc) {
      user_data.fbc = fbc;
    }
    
    // Additional user data can be added
    Object.assign(user_data, userData);

    // Build event payload
    const eventData = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000), // Unix timestamp
      event_id: eventId,
      action_source: 'website',
      user_data,
    };
    
    // Add event source URL if provided
    if (eventSourceUrl) {
      eventData.event_source_url = eventSourceUrl;
    }
    
    // Add custom data if provided
    if (Object.keys(customData).length > 0) {
      eventData.custom_data = customData;
    }

    // Make API request
    const url = `https://graph.facebook.com/${META_API_VERSION}/${META_PIXEL_ID}/events`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [eventData],
        access_token: META_ACCESS_TOKEN,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Meta CAPI] API error:', result);
      return {
        success: false,
        eventId,
        error: result.error?.message || 'API request failed',
      };
    }

    console.log('[Meta CAPI] Event sent successfully:', {
      eventName,
      eventId,
      eventsReceived: result.events_received,
    });

    return {
      success: true,
      eventId,
      eventsReceived: result.events_received,
      fbTraceId: result.fbtrace_id,
    };
  } catch (error) {
    console.error('[Meta CAPI] Error sending event:', error);
    return {
      success: false,
      eventId,
      error: error.message,
    };
  }
}

/**
 * Send a Lead conversion event (user signup)
 * 
 * @param {Object} user - User object with email
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>}
 */
export async function sendLeadEvent(user, options = {}) {
  return sendMetaEvent('Lead', {
    email: user.email,
    eventSourceUrl: options.eventSourceUrl || 'https://autorev.app/signup',
    userAgent: options.userAgent,
    clientIpAddress: options.clientIpAddress,
    fbp: options.fbp,
    fbc: options.fbc,
    eventId: options.eventId,
    customData: {
      content_name: 'User Signup',
      ...options.customData,
    },
  });
}

/**
 * Send a Subscribe conversion event (paid subscription)
 * 
 * @param {Object} user - User object with email
 * @param {Object} subscription - Subscription details
 * @param {number} subscription.value - Subscription value in cents
 * @param {string} subscription.tier - Subscription tier name
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>}
 */
export async function sendSubscribeEvent(user, subscription, options = {}) {
  const valueDollars = (subscription.value || 0) / 100;
  
  return sendMetaEvent('Subscribe', {
    email: user.email,
    eventSourceUrl: options.eventSourceUrl || 'https://autorev.app/checkout',
    userAgent: options.userAgent,
    clientIpAddress: options.clientIpAddress,
    fbp: options.fbp,
    fbc: options.fbc,
    eventId: options.eventId,
    customData: {
      value: valueDollars,
      currency: 'USD',
      content_name: `${subscription.tier} Subscription`,
      predicted_ltv: valueDollars * 12, // Annual value
      ...options.customData,
    },
  });
}

/**
 * Send a Purchase conversion event (one-time payment)
 * 
 * @param {Object} user - User object with email
 * @param {Object} purchase - Purchase details
 * @param {number} purchase.value - Purchase value in cents
 * @param {string} purchase.contentName - Product/pack name
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object>}
 */
export async function sendPurchaseEvent(user, purchase, options = {}) {
  const valueDollars = (purchase.value || 0) / 100;
  
  return sendMetaEvent('Purchase', {
    email: user.email,
    eventSourceUrl: options.eventSourceUrl || 'https://autorev.app/checkout',
    userAgent: options.userAgent,
    clientIpAddress: options.clientIpAddress,
    fbp: options.fbp,
    fbc: options.fbc,
    eventId: options.eventId,
    customData: {
      value: valueDollars,
      currency: 'USD',
      content_name: purchase.contentName,
      num_items: 1,
      ...options.customData,
    },
  });
}

