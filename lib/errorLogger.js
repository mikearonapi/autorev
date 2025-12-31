'use client';

/**
 * Automatic client-side error logging to /api/feedback
 * - Deduplicates by hash
 * - Throttles per-session
 * - Adds client context
 * - Safe no-throw on failures
 * - Tracks app version for deployment correlation
 * - Filters noise patterns (network timeouts, expected behaviors)
 */

const THROTTLE_WINDOW_MS = 60_000;
const DEDUPE_TTL_MS = 5 * 60_000;

/**
 * Patterns that indicate noise rather than real bugs
 * These are expected behaviors or environmental issues, not code bugs
 */
const NOISE_PATTERNS = [
  // Network/timeout issues (user's connection, not our code)
  /request timeout/i,
  /network timeout/i,
  /timed out/i,
  /load failed/i,
  /failed to fetch/i,
  /fetch failed/i,
  /aborted/i,
  /abort/i,
  
  // Auth session issues (expected for logged-out users)
  /auth session missing/i,
  /not authenticated/i,
  /authentication required/i,
  /refresh token not found/i,
  /invalid refresh token/i,
  
  // Browser navigation (user left the page)
  /browsing context is going away/i,
  /cancelled/i,
  /canceled/i,
  
  // Chunk loading (slow network, user navigated away)
  /loading chunk.*failed/i,
  /chunk.*timeout/i,
  
  // Next.js dynamic routes (warnings, not errors)
  /dynamic server usage/i,
  
  // External API failures (not our code)
  /nhtsa api error/i,
  /external api/i,
];

/**
 * Check if an error message matches noise patterns
 * Returns true if it should be filtered out
 */
function isNoiseError(message) {
  if (!message) return false;
  const msg = String(message).toLowerCase();
  return NOISE_PATTERNS.some(pattern => pattern.test(msg));
}

// Get deployment version from environment
const APP_VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local';

const errorThrottle = {
  count: 0,
  resetTime: Date.now() + THROTTLE_WINDOW_MS,
  maxPerWindow: 5,
};

const recentErrors = new Map();

export function generateErrorHash(error, context = {}) {
  const message = (error?.message || String(error || 'unknown')).slice(0, 300);
  const page = context.pageUrl || context.apiRoute || '';
  const component = context.componentName || '';
  const str = `${message}|${page}|${component}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // force int32
  }
  return hash.toString(16);
}

function getBrowserName(ua) {
  if (!ua) return 'Unknown';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getOSName(ua) {
  if (!ua) return 'Unknown';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
}

function getClientContext() {
  if (typeof window === 'undefined') return {};
  const ua = navigator.userAgent || '';
  return {
    browser: getBrowserName(ua),
    os: getOSName(ua),
    screenSize: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
    isMobile: /Mobile|Android|iPhone/i.test(ua),
    viewportSize: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
    url: window.location?.href,
    referrer: typeof document !== 'undefined' ? document.referrer || null : null,
  };
}

function shouldThrottle() {
  const now = Date.now();
  if (now > errorThrottle.resetTime) {
    errorThrottle.count = 0;
    errorThrottle.resetTime = now + THROTTLE_WINDOW_MS;
  }
  errorThrottle.count += 1;
  return errorThrottle.count > errorThrottle.maxPerWindow;
}

function isDuplicate(errorHash) {
  if (!errorHash) return false;
  if (recentErrors.has(errorHash)) return true;
  const timeoutId = setTimeout(() => recentErrors.delete(errorHash), DEDUPE_TTL_MS);
  recentErrors.set(errorHash, timeoutId);
  return false;
}

function determineSeverity(error, context) {
  if (context?.severity) return context.severity;
  if (context?.errorType === 'api_failure' && Number(context?.errorCode) >= 500) {
    return 'major';
  }
  if (context?.errorType === 'render_error') return 'blocking';
  if (context?.errorType === 'network_timeout') return 'minor';
  return 'major';
}

function extractFeatureFromUrl(url) {
  if (!url) return null;
  if (url.includes('/tuning-shop')) return 'tuning-shop';
  if (url.includes('/browse-cars')) return 'browse-cars';
  if (url.includes('/garage')) return 'garage';
  if (url.includes('/community/events')) return 'events';
  if (url.includes('/encyclopedia')) return 'encyclopedia';
  if (url.includes('/car-selector')) return 'car-selector';
  return 'general';
}

export async function logError(errorInput, context = {}) {
  const error = errorInput instanceof Error ? errorInput : new Error(String(errorInput || 'Unknown error'));

  // Filter out noise errors (network issues, expected behaviors)
  if (isNoiseError(error.message)) {
    // Log locally for debugging but don't send to server
    if (process.env.NODE_ENV !== 'production') {
      console.log('[ErrorLogger] Filtered noise error:', error.message?.slice(0, 80));
    }
    return;
  }

  // Always log in production (Vercel sets NODE_ENV=production)
  // Only skip in local dev (npm run dev) unless explicitly enabled
  if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_LOG_ERRORS_DEV) {
    console.error('[ErrorLogger] Local dev - not sending to server:', error?.message || error);
    return;
  }

  if (shouldThrottle()) {
    console.warn('[ErrorLogger] Throttled - too many errors this minute');
    return;
  }

  const clientContext = getClientContext();
  const errorHash = generateErrorHash(error, { ...context, pageUrl: clientContext.url || context.pageUrl });

  if (isDuplicate(errorHash)) {
    console.log('[ErrorLogger] Duplicate error suppressed');
    return;
  }

  const errorMetadata = {
    errorType: context.errorType || 'unhandled_exception',
    errorCode: context.errorCode || null,
    errorMessage: error.message || String(error),
    stackTrace: error.stack ? error.stack.slice(0, 2000) : null,
    apiRoute: context.apiRoute || null,
    httpMethod: context.httpMethod || null,
    requestDuration: context.requestDuration || null,
    componentName: context.componentName || null,
    componentStack: context.componentStack || null,
    pageUrl: context.pageUrl || clientContext.url || null,
    errorHash,
    occurrenceCount: context.occurrenceCount || null,
    serverSide: false,
    ...clientContext,
  };

  // Determine error source based on error type
  const errorSource = context.errorType === 'api_failure' ? 'api' 
    : context.errorType === 'network_timeout' ? 'api'
    : context.errorType === 'render_error' ? 'client'
    : 'client';

  const payload = {
    message: `[${errorSource.toUpperCase()}] ${error.message || 'Unknown error'}`,
    category: 'auto-error',
    severity: determineSeverity(error, context),
    pageUrl: context.pageUrl || clientContext.url || null,
    featureContext: context.featureContext || extractFeatureFromUrl(clientContext.url),
    browserInfo: clientContext.browser || clientContext.os ? {
      browser: clientContext.browser,
      os: clientContext.os,
    } : null,
    errorMetadata,
    // New fields for enhanced tracking
    errorSource,
    errorHash,
    appVersion: APP_VERSION,
  };

  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[ErrorLogger] Failed to log error:', response.status);
    }
  } catch (logErr) {
    console.error('[ErrorLogger] Failed to send error log:', logErr);
  }
}

export const ErrorLogger = {
  apiError: (error, apiRoute, options = {}) =>
    logError(error, {
      errorType: 'api_failure',
      apiRoute,
      errorCode: options.status,
      httpMethod: options.method,
      requestDuration: options.duration,
      featureContext: options.featureContext,
      severity: options.severity,
    }),

  renderError: (error, componentName, options = {}) =>
    logError(error, {
      errorType: 'render_error',
      componentName,
      componentStack: options.componentStack,
      featureContext: options.featureContext,
      severity: options.severity || 'blocking',
    }),

  networkTimeout: (error, apiRoute, options = {}) =>
    logError(error, {
      errorType: 'network_timeout',
      apiRoute,
      httpMethod: options.method,
      requestDuration: options.duration,
      featureContext: options.featureContext,
      severity: options.severity || 'minor',
    }),
};

export default ErrorLogger;








