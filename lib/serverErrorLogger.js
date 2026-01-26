/**
 * Server-side error logging utility
 * 
 * Comprehensive error tracking for API routes, cron jobs, and external API calls.
 * Logs to database with deduplication and sends critical errors to Discord.
 * 
 * Usage in API routes:
 *   import { withErrorLogging } from '@/lib/serverErrorLogger';
 *   
 *   export const GET = withErrorLogging(async (request) => {
 *     // your code - errors auto-logged
 *     return Response.json({ data });
 *   }, { route: 'cars', feature: 'browse-cars' });
 * 
 * For external API calls:
 *   import { logExternalApiError } from '@/lib/serverErrorLogger';
 *   
 *   try {
 *     const data = await fetch(nhtsaUrl);
 *   } catch (error) {
 *     await logExternalApiError('NHTSA', error, { endpoint: nhtsaUrl });
 *   }
 */

import { createClient } from '@supabase/supabase-js';

import { notifyCronFailure } from '@/lib/discord';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Get deployment version from Vercel or fallback
const APP_VERSION = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 
                    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
                    'local';

// Simple hash for deduplication
function generateErrorHash(error, context) {
  const message = (error?.message || String(error || 'unknown')).slice(0, 300);
  const route = context?.apiRoute || context?.route || context?.context || '';
  const source = context?.errorSource || 'api';
  const str = `${message}|${route}|${source}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16);
}

// Generate unique request ID
function generateRequestId() {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// In-memory cache for recent errors (reset on cold start)
const recentErrors = new Map();
const DEDUPE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isDuplicate(errorHash) {
  const now = Date.now();
  // Clean old entries
  for (const [hash, timestamp] of recentErrors) {
    if (now - timestamp > DEDUPE_TTL_MS) {
      recentErrors.delete(hash);
    }
  }
  if (recentErrors.has(errorHash)) {
    return true;
  }
  recentErrors.set(errorHash, now);
  return false;
}

// Determine severity based on error characteristics
function determineSeverity(error, context) {
  if (context?.severity) return context.severity;
  
  // Blocking: 500 errors, render failures, auth system failures
  if (context?.status >= 500) return 'blocking';
  if (context?.errorSource === 'auth') return 'major';
  if (error?.name === 'TypeError' || error?.name === 'ReferenceError') return 'blocking';
  
  // Major: 4xx client errors, external API failures
  if (context?.status >= 400 && context?.status < 500) return 'major';
  if (context?.errorSource === 'external_api') return 'major';
  
  // Minor: timeouts, rate limits
  if (error?.name === 'AbortError') return 'minor';
  if (context?.status === 429) return 'minor';
  
  return 'major';
}

// Extract feature context from route
function extractFeatureFromRoute(route) {
  if (!route) return 'api';
  
  const routeMap = {
    'cars': 'browse-cars',
    'events': 'events',
    'feedback': 'feedback',
    'ai-mechanic': 'al',
    'al': 'al',
    'vin': 'garage',
    'users': 'user-account',
    'contact': 'contact',
    'internal': 'internal',
    'cron': 'cron-jobs',
    'parts': 'tuning-shop',
    'stats': 'analytics',
    'webhooks': 'integrations',
  };
  
  for (const [key, feature] of Object.entries(routeMap)) {
    if (route.includes(key)) return feature;
  }
  return 'api';
}

/**
 * Log a server-side error to the database
 * 
 * @param {Error} error - The error object
 * @param {Request} request - The incoming request (optional)
 * @param {Object} context - Additional context
 * @param {string} context.route - The API route name
 * @param {string} context.errorSource - 'api' | 'cron' | 'external_api' | 'database' | 'auth'
 * @param {string} context.severity - 'blocking' | 'major' | 'minor'
 * @param {string} context.feature - Feature context for grouping
 * @param {number} context.status - HTTP status code
 * @param {number} context.duration - Request duration in ms
 */
export async function logServerError(error, request = null, context = {}) {
  // Always log in production
  // Only skip in local dev unless explicitly enabled
  if (process.env.NODE_ENV !== 'production' && !process.env.LOG_SERVER_ERRORS_DEV) {
    console.error('[ServerErrorLogger] Local dev - not logging to DB:', error?.message || error);
    return null;
  }
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[ServerErrorLogger] Missing Supabase credentials');
    return null;
  }
  
  try {
    const errorHash = generateErrorHash(error, context);
    
    // Skip if duplicate in memory (edge function may be reused)
    if (isDuplicate(errorHash)) {
      console.log('[ServerErrorLogger] Duplicate error suppressed');
      return null;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    
    // Extract request info if available
    let apiRoute = context.route || context.apiRoute || null;
    let httpMethod = context.method || null;
    let pageUrl = null;
    const requestId = context.requestId || generateRequestId();
    
    if (request) {
      try {
        const url = new URL(request.url);
        apiRoute = apiRoute || url.pathname;
        pageUrl = request.headers?.get('referer') || null;
        httpMethod = request.method;
      } catch {
        // Ignore URL parsing errors
      }
    }
    
    const errorSource = context.errorSource || 'api';
    const severity = determineSeverity(error, { ...context, status: context.status });
    const featureContext = context.feature || extractFeatureFromRoute(apiRoute);
    
    const errorMetadata = {
      errorType: context.errorType || 'server_error',
      errorCode: error?.code || context.status || null,
      errorMessage: error?.message || String(error),
      stackTrace: error?.stack?.slice(0, 3000) || null,
      apiRoute,
      httpMethod,
      requestDuration: context.duration || null,
      requestId,
      serverSide: true,
      errorSource,
      // Additional context
      externalService: context.externalService || null,
      externalEndpoint: context.externalEndpoint || null,
      responseStatus: context.responseStatus || null,
    };
    
    // Log to dedicated application_errors table ONLY
    // (user_feedback is now reserved for human-submitted feedback)
    const { data, error: dbError } = await supabase.rpc('upsert_application_error', {
      p_error_hash: errorHash,
      p_message: `[${errorSource.toUpperCase()}] ${error?.message || 'Unknown server error'}`,
      p_error_type: context.errorType || 'server_error',
      p_error_source: errorSource,
      p_severity: severity,
      p_page_url: pageUrl,
      p_api_route: apiRoute,
      p_feature_context: featureContext,
      p_stack_trace: error?.stack?.slice(0, 3000) || null,
      p_http_method: httpMethod,
      p_http_status: context.status || null,
      p_request_duration_ms: context.duration || null,
      p_request_id: requestId,
      p_external_service: context.externalService || null,
      p_external_endpoint: context.externalEndpoint || null,
      p_app_version: APP_VERSION,
      p_metadata: errorMetadata,
    });
    
    if (dbError) {
      console.error('[ServerErrorLogger] Failed to log to application_errors:', dbError.message);
    }
    
    return requestId;
  } catch (logError) {
    // Never let logging break the API
    console.error('[ServerErrorLogger] Exception while logging:', logError);
    return null;
  }
}

/**
 * Log an external API failure (NHTSA, YouTube, etc.)
 */
export async function logExternalApiError(serviceName, error, context = {}) {
  return logServerError(error, null, {
    ...context,
    errorSource: 'external_api',
    errorType: 'external_api_failure',
    externalService: serviceName,
    externalEndpoint: context.endpoint || context.url,
    responseStatus: context.status,
    severity: context.severity || 'major',
    feature: context.feature || 'data-enrichment',
  });
}

/**
 * Log a database error
 */
export async function logDatabaseError(error, context = {}) {
  return logServerError(error, null, {
    ...context,
    errorSource: 'database',
    errorType: 'database_error',
    severity: context.severity || 'blocking',
  });
}

/**
 * Log an authentication/authorization error
 */
export async function logAuthError(error, request = null, context = {}) {
  return logServerError(error, request, {
    ...context,
    errorSource: 'auth',
    errorType: context.type || 'auth_error',
    severity: context.severity || 'major',
  });
}

/**
 * Log a cron job failure
 */
export async function logCronError(jobName, error, context = {}) {
  // Log to database
  await logServerError(error, null, {
    ...context,
    errorSource: 'cron',
    errorType: 'cron_failure',
    route: `cron/${jobName}`,
    feature: 'cron-jobs',
    severity: context.severity || 'blocking',
  });
  
  // Also send to Discord for immediate visibility
  try {
    await notifyCronFailure(jobName, error, context);
  } catch (discordError) {
    console.error('[ServerErrorLogger] Discord notification failed:', discordError);
  }
}

/**
 * Track slow requests (not errors, but worth monitoring)
 */
export async function logSlowRequest(request, duration, context = {}) {
  // Only log requests over threshold (default 5 seconds)
  const threshold = context.threshold || 5000;
  if (duration < threshold) return null;
  
  if (!supabaseUrl || !supabaseServiceKey) return null;
  if (process.env.NODE_ENV !== 'production') return null;
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    
    let apiRoute = context.route || null;
    let httpMethod = context.method || null;
    
    if (request) {
      try {
        const url = new URL(request.url);
        apiRoute = apiRoute || url.pathname;
        httpMethod = request.method;
      } catch {
        // Ignore
      }
    }
    
    const errorHash = generateErrorHash(
      { message: `SLOW_${apiRoute}_${Math.floor(duration / 1000)}s` },
      { apiRoute, errorSource: 'api' }
    );
    
    // Log to application_errors table
    const { error: dbError } = await supabase.rpc('upsert_application_error', {
      p_error_hash: errorHash,
      p_message: `[SLOW] ${apiRoute} took ${(duration / 1000).toFixed(1)}s`,
      p_error_type: 'slow_request',
      p_error_source: 'api',
      p_severity: duration > 15000 ? 'major' : 'minor',
      p_api_route: apiRoute,
      p_feature_context: extractFeatureFromRoute(apiRoute),
      p_http_method: httpMethod,
      p_request_duration_ms: Math.round(duration),
      p_app_version: APP_VERSION,
      p_metadata: { threshold, actualDuration: duration },
    });
    
    if (dbError) {
      console.error('[ServerErrorLogger] Failed to log slow request:', dbError.message);
    }
  } catch (err) {
    console.error('[ServerErrorLogger] Exception logging slow request:', err);
  }
}

/**
 * Wrapper to create an API route handler with automatic error logging
 * 
 * Usage:
 *   export const GET = withErrorLogging(async (request) => {
 *     // your handler code
 *     return Response.json({ data });
 *   }, { route: 'cars', feature: 'browse-cars' });
 */
export function withErrorLogging(handler, options = {}) {
  const routeName = options.route || 'unknown';
  const featureContext = options.feature || extractFeatureFromRoute(routeName);
  const slowThreshold = options.slowThreshold || 5000;
  
  return async function wrappedHandler(request, routeContext) {
    const startTime = Date.now();
    const requestId = generateRequestId();
    
    try {
      const result = await handler(request, routeContext);
      
      // Check for slow request
      const duration = Date.now() - startTime;
      if (duration > slowThreshold) {
        logSlowRequest(request, duration, { 
          route: routeName, 
          feature: featureContext,
          threshold: slowThreshold,
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[API/${routeName}] Error:`, error);
      
      await logServerError(error, request, { 
        route: routeName,
        feature: featureContext,
        duration,
        requestId,
      });
      
      // Return appropriate error response
      const status = error?.status || error?.statusCode || 500;
      return Response.json(
        { 
          error: error?.message || 'Internal server error',
          requestId, // Include for support reference
        },
        { status }
      );
    }
  };
}

/**
 * Middleware-style wrapper for Next.js route handlers
 * Wraps all HTTP methods in a route file
 * 
 * Usage in route.js:
 *   import { withErrorLoggingAll } from '@/lib/serverErrorLogger';
 *   
 *   async function GET(request) { ... }
 *   async function POST(request) { ... }
 *   
 *   export const { GET: _GET, POST: _POST } = withErrorLoggingAll(
 *     { GET, POST },
 *     { route: 'cars' }
 *   );
 *   export { _GET as GET, _POST as POST };
 */
export function withErrorLoggingAll(handlers, options = {}) {
  const wrapped = {};
  for (const [method, handler] of Object.entries(handlers)) {
    if (typeof handler === 'function') {
      wrapped[method] = withErrorLogging(handler, { ...options, method });
    }
  }
  return wrapped;
}

const serverErrorLogger = { 
  logServerError, 
  logExternalApiError,
  logDatabaseError,
  logAuthError,
  logCronError,
  logSlowRequest,
  withErrorLogging,
  withErrorLoggingAll,
};

export default serverErrorLogger;



