/**
 * Server-side error logging utility
 * 
 * Logs errors to the user_feedback table from API routes.
 * Unlike client-side logging, this runs on the server and has
 * direct database access.
 * 
 * Usage in API routes (wrap entire handler):
 *   import { withErrorLogging } from '@/lib/serverErrorLogger';
 *   
 *   export const GET = withErrorLogging(async (request) => {
 *     // your code - errors auto-logged
 *     return Response.json({ data });
 *   });
 * 
 * Or manual logging:
 *   import { logServerError } from '@/lib/serverErrorLogger';
 *   
 *   catch (error) {
 *     await logServerError(error, request);
 *     return Response.json({ error: 'Failed' }, { status: 500 });
 *   }
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Simple hash for deduplication
function generateErrorHash(error, context) {
  const message = (error?.message || String(error || 'unknown')).slice(0, 300);
  const route = context?.apiRoute || context?.context || '';
  const str = `${message}|${route}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(16);
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

/**
 * Log a server-side error to the feedback system
 * 
 * @param {Error} error - The error object
 * @param {Request} request - The incoming request (optional)
 * @param {Object} context - Additional context
 * @param {string} context.apiRoute - The API route path
 * @param {string} context.context - Additional context string
 * @param {string} context.severity - 'blocking' | 'major' | 'minor'
 */
export async function logServerError(error, request = null, context = {}) {
  // Always log in production (Vercel sets NODE_ENV=production)
  // Only skip in local dev unless explicitly enabled
  if (process.env.NODE_ENV !== 'production' && !process.env.LOG_SERVER_ERRORS_DEV) {
    console.error('[ServerErrorLogger] Local dev - not logging to DB:', error?.message || error);
    return;
  }
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[ServerErrorLogger] Missing Supabase credentials');
    return;
  }
  
  try {
    const errorHash = generateErrorHash(error, context);
    
    if (isDuplicate(errorHash)) {
      console.log('[ServerErrorLogger] Duplicate error suppressed');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    
    // Extract request info if available
    let apiRoute = context.apiRoute || context.context || null;
    let httpMethod = null;
    let pageUrl = null;
    
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
    
    const errorMetadata = {
      errorType: 'server_error',
      errorCode: error?.code || error?.status || null,
      errorMessage: error?.message || String(error),
      stackTrace: error?.stack?.slice(0, 2000) || null,
      apiRoute,
      httpMethod,
      errorHash,
      serverSide: true,
    };
    
    const feedbackData = {
      feedback_type: 'bug',
      category: 'auto-error',
      message: `[Server] ${error?.message || 'Unknown server error'}`,
      severity: context.severity || 'major',
      page_url: pageUrl,
      feature_context: context.featureContext || apiRoute || 'api',
      error_metadata: errorMetadata,
      status: 'new',
      priority: 'normal',
    };
    
    const { error: dbError } = await supabase
      .from('user_feedback')
      .insert(feedbackData);
    
    if (dbError) {
      console.error('[ServerErrorLogger] Failed to log error:', dbError);
    }
  } catch (logError) {
    // Never let logging break the API
    console.error('[ServerErrorLogger] Exception while logging:', logError);
  }
}

/**
 * Wrapper to create an API route handler with automatic error logging
 * 
 * Usage:
 *   export const GET = withErrorLogging(async (request) => {
 *     // your handler code
 *     return Response.json({ data });
 *   }, 'my-route');
 */
export function withErrorLogging(handler, routeName = 'unknown') {
  return async function wrappedHandler(request, context) {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error(`[API/${routeName}] Error:`, error);
      await logServerError(error, request, { apiRoute: routeName });
      
      return Response.json(
        { error: error?.message || 'Internal server error' },
        { status: error?.status || 500 }
      );
    }
  };
}

export default { logServerError, withErrorLogging };

