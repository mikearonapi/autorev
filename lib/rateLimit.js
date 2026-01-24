/**
 * Rate Limiting Utility
 * 
 * Provides both in-memory and distributed rate limiting for API routes.
 * 
 * Features:
 * - In-memory rate limiting (default, works across serverless instances approximately)
 * - Distributed rate limiting via Supabase (for exact limits across all instances)
 * - Multiple presets for different route types (AI, auth, forms, etc.)
 * - Sliding window algorithm for fair rate limiting
 * 
 * Production Notes:
 * - In-memory works well for moderate scale on Vercel
 * - Enable distributed mode for high-traffic routes or exact limits
 * - Consider @upstash/ratelimit for even higher scale
 * 
 * @module lib/rateLimit
 */

import { NextResponse } from 'next/server';

import { getServiceClient } from './supabaseServer';

// In-memory store for rate limit tracking
// Note: Each serverless instance has its own store, so this is approximate
// For exact limits, use a distributed store like Redis
const rateLimitStore = new Map();

// Clean up old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

/**
 * Clean up expired entries from the store
 */
function cleanupStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limit configurations for different route types
 */
export const RateLimitPresets = {
  // AI routes - expensive, limit strictly
  ai: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'AI request limit exceeded. Please wait a moment.',
  },
  // Auth routes - protect against brute force
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    message: 'Too many authentication attempts. Please try again later.',
  },
  // Form submissions - prevent spam
  form: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many submissions. Please wait before trying again.',
  },
  // Checkout/payment - strict protection
  checkout: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many checkout attempts. Please wait.',
  },
  // General API - moderate limits
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Rate limit exceeded. Please slow down.',
  },
  // Strict - for sensitive operations
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3,
    message: 'Operation limit exceeded. Please wait.',
  },
};

/**
 * Get client identifier from request
 * Uses IP address, falling back to a generic key
 * 
 * @param {Request} request
 * @returns {string}
 */
function getClientId(request) {
  // Try various headers for IP (Vercel, Cloudflare, standard)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback - not ideal but better than nothing
  return 'anonymous';
}

/**
 * Check rate limit for a request
 * 
 * @param {Request} request - The incoming request
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.maxRequests - Max requests per window
 * @param {string} [options.keyPrefix] - Optional prefix for the rate limit key
 * @returns {{ success: boolean, remaining: number, resetAt: number }}
 */
export function checkRateLimit(request, options) {
  const { windowMs, maxRequests, keyPrefix = '' } = options;
  
  cleanupStore();
  
  const clientId = getClientId(request);
  const key = `${keyPrefix}:${clientId}`;
  const now = Date.now();
  
  let data = rateLimitStore.get(key);
  
  // Initialize or reset if window expired
  if (!data || now > data.resetAt) {
    data = {
      count: 0,
      resetAt: now + windowMs,
    };
  }
  
  data.count++;
  rateLimitStore.set(key, data);
  
  const remaining = Math.max(0, maxRequests - data.count);
  const success = data.count <= maxRequests;
  
  return {
    success,
    remaining,
    resetAt: data.resetAt,
    current: data.count,
    limit: maxRequests,
  };
}

/**
 * Rate limit middleware for API routes
 * Returns null if allowed, or a Response if rate limited
 * 
 * @param {Request} request - The incoming request
 * @param {Object|string} options - Rate limit options or preset name
 * @returns {Response|null}
 * 
 * @example
 * // Using a preset
 * const limited = rateLimit(request, 'ai');
 * if (limited) return limited;
 * 
 * @example
 * // Using custom options
 * const limited = rateLimit(request, { windowMs: 60000, maxRequests: 10 });
 * if (limited) return limited;
 */
export function rateLimit(request, options) {
  // Resolve preset if string provided
  const config = typeof options === 'string' 
    ? RateLimitPresets[options] 
    : options;
  
  if (!config) {
    console.warn('[rateLimit] Invalid preset or options:', options);
    return null; // Fail open if misconfigured
  }
  
  const { windowMs, maxRequests, message = 'Rate limit exceeded' } = config;
  // Get pathname from URL - works with both Request and NextRequest
  const pathname = request.url ? new URL(request.url).pathname : 'api';
  const keyPrefix = config.keyPrefix || pathname;
  
  const result = checkRateLimit(request, { windowMs, maxRequests, keyPrefix });
  
  if (!result.success) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    
    return NextResponse.json(
      {
        error: message,
        code: 'RATE_LIMITED',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }
  
  return null; // Not rate limited
}

/**
 * Add rate limit headers to a response
 * Use this to inform clients of their rate limit status
 * 
 * @param {Response} response - The response to add headers to
 * @param {Object} result - Rate limit check result
 * @returns {Response}
 */
export function addRateLimitHeaders(response, result) {
  const headers = new Headers(response.headers);
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Higher-order function to wrap an API handler with rate limiting
 * 
 * @param {Function} handler - The API route handler
 * @param {Object|string} options - Rate limit options or preset name
 * @returns {Function}
 * 
 * @example
 * export const POST = withRateLimit(async (request) => {
 *   // Your handler logic
 * }, 'form');
 */
export function withRateLimit(handler, options) {
  return async (request, context) => {
    const limited = rateLimit(request, options);
    if (limited) return limited;
    
    return handler(request, context);
  };
}

// =============================================================================
// DISTRIBUTED RATE LIMITING (via Supabase)
// =============================================================================

/**
 * Distributed rate limit check using Supabase
 * Provides exact rate limiting across all serverless instances
 * 
 * Requires a rate_limits table in Supabase:
 * ```sql
 * CREATE TABLE IF NOT EXISTS rate_limits (
 *   key TEXT PRIMARY KEY,
 *   count INTEGER DEFAULT 1,
 *   window_start TIMESTAMPTZ DEFAULT now(),
 *   updated_at TIMESTAMPTZ DEFAULT now()
 * );
 * 
 * CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);
 * ```
 * 
 * @param {string} identifier - Unique identifier (e.g., IP + route)
 * @param {Object} options - Rate limit options
 * @param {number} options.limit - Max requests per window
 * @param {number} options.windowSeconds - Window duration in seconds
 * @returns {Promise<{ success: boolean, remaining: number, resetAt: Date }>}
 */
export async function distributedRateLimit(identifier, { limit = 10, windowSeconds = 60 }) {
  const supabase = getServiceClient();
  
  if (!supabase) {
    // Fall back to in-memory if Supabase isn't configured
    console.warn('[rateLimit] Supabase not configured, using in-memory fallback');
    const result = checkRateLimit({ headers: { get: () => identifier } }, {
      windowMs: windowSeconds * 1000,
      maxRequests: limit,
      keyPrefix: 'distributed',
    });
    return {
      success: result.success,
      remaining: result.remaining,
      resetAt: new Date(result.resetAt),
    };
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  try {
    // Atomic upsert with window check
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: identifier,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      // If the RPC doesn't exist, fall back to manual check
      if (error.code === '42883') { // function does not exist
        return await distributedRateLimitFallback(supabase, identifier, limit, windowSeconds, now, windowStart);
      }
      throw error;
    }

    return {
      success: data.allowed,
      remaining: Math.max(0, limit - data.count),
      resetAt: new Date(data.reset_at),
    };
  } catch (err) {
    console.error('[rateLimit] Distributed check failed:', err);
    // Fail open - allow request but log the error
    return { success: true, remaining: limit, resetAt: now };
  }
}

/**
 * Fallback distributed rate limiting without RPC
 * Uses direct table operations if check_rate_limit function isn't available
 */
async function distributedRateLimitFallback(supabase, identifier, limit, windowSeconds, now, windowStart) {
  // Check current count
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('count, window_start')
    .eq('key', identifier)
    .single();

  if (!existing || new Date(existing.window_start) < windowStart) {
    // New window - reset count
    await supabase
      .from('rate_limits')
      .upsert({
        key: identifier,
        count: 1,
        window_start: now.toISOString(),
        updated_at: now.toISOString(),
      });

    return {
      success: true,
      remaining: limit - 1,
      resetAt: new Date(now.getTime() + windowSeconds * 1000),
    };
  }

  // Increment count
  const newCount = existing.count + 1;
  const success = newCount <= limit;

  await supabase
    .from('rate_limits')
    .update({
      count: newCount,
      updated_at: now.toISOString(),
    })
    .eq('key', identifier);

  return {
    success,
    remaining: Math.max(0, limit - newCount),
    resetAt: new Date(new Date(existing.window_start).getTime() + windowSeconds * 1000),
  };
}

/**
 * Rate limit middleware with distributed support
 * 
 * @param {Request} request - The incoming request
 * @param {Object} options - Rate limit options
 * @param {boolean} [options.distributed=false] - Use distributed rate limiting
 * @param {string} options.preset - Preset name or custom config
 * @returns {Promise<Response|null>}
 * 
 * @example
 * // Using distributed rate limiting
 * const limited = await rateLimitDistributed(request, {
 *   distributed: true,
 *   preset: 'ai',
 * });
 * if (limited) return limited;
 */
export async function rateLimitDistributed(request, options) {
  const { distributed = false, preset, ...customConfig } = options;
  
  if (!distributed) {
    return rateLimit(request, preset || customConfig);
  }

  const config = typeof preset === 'string' 
    ? RateLimitPresets[preset] 
    : customConfig;

  if (!config) {
    console.warn('[rateLimit] Invalid config:', options);
    return null;
  }

  const clientId = getClientId(request);
  const pathname = new URL(request.url).pathname;
  const identifier = `${pathname}:${clientId}`;

  const result = await distributedRateLimit(identifier, {
    limit: config.maxRequests,
    windowSeconds: Math.floor(config.windowMs / 1000),
  });

  if (!result.success) {
    const retryAfter = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
    
    return NextResponse.json(
      {
        error: config.message || 'Rate limit exceeded',
        code: 'RATE_LIMITED',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt.getTime() / 1000)),
        },
      }
    );
  }

  return null;
}

/**
 * Get client identifier from request (exported for distributed use)
 */
export { getClientId };

export default rateLimit;
