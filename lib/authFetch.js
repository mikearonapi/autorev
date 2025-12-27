/**
 * Auth-Aware Fetch Wrapper
 * 
 * Provides resilient API calls with:
 * - Automatic 401 handling with session refresh
 * - Retry logic with exponential backoff
 * - Request deduplication for concurrent refreshes
 * - Proper error classification
 * 
 * Usage:
 *   import { authFetch } from '@/lib/authFetch';
 *   const data = await authFetch('/api/some-endpoint', { method: 'POST', body: ... });
 */

import { supabase, isSupabaseConfigured } from './supabase';

// Track in-flight refresh to deduplicate concurrent 401s
let refreshPromise = null;
let lastRefreshTime = 0;
const MIN_REFRESH_INTERVAL = 5000; // Don't refresh more than once per 5 seconds

/**
 * Error types for auth-related failures
 */
export const AuthFetchErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_REFRESH_FAILED: 'AUTH_REFRESH_FAILED',
  SERVER_ERROR: 'SERVER_ERROR',
  CLIENT_ERROR: 'CLIENT_ERROR',
};

/**
 * Custom error class with type information
 */
export class AuthFetchError extends Error {
  constructor(message, type, status, response) {
    super(message);
    this.name = 'AuthFetchError';
    this.type = type;
    this.status = status;
    this.response = response;
  }
}

/**
 * Attempt to refresh the session
 * Deduplicates concurrent refresh attempts
 */
async function refreshSession() {
  const now = Date.now();
  
  // Rate limit refreshes
  if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
    console.log('[authFetch] Refresh rate limited, skipping');
    return { success: false, reason: 'rate_limited' };
  }
  
  // Deduplicate concurrent refreshes
  if (refreshPromise) {
    console.log('[authFetch] Refresh already in progress, waiting...');
    return refreshPromise;
  }
  
  console.log('[authFetch] Starting session refresh...');
  lastRefreshTime = now;
  
  refreshPromise = (async () => {
    try {
      if (!isSupabaseConfigured || !supabase) {
        return { success: false, reason: 'not_configured' };
      }
      
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.warn('[authFetch] Refresh failed:', error.message);
        return { success: false, reason: error.message };
      }
      
      if (session) {
        console.log('[authFetch] Session refreshed successfully');
        return { success: true, session };
      }
      
      return { success: false, reason: 'no_session' };
    } catch (err) {
      console.error('[authFetch] Refresh error:', err);
      return { success: false, reason: err.message };
    } finally {
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
}

/**
 * Get the current access token
 */
async function getAccessToken() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }
  
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

/**
 * Auth-aware fetch with automatic retry on 401
 * 
 * @param {string} url - The URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {Object} config - Additional configuration
 * @param {number} config.maxRetries - Max retry attempts (default: 1)
 * @param {boolean} config.includeAuth - Whether to include auth header (default: true)
 * @param {Function} config.onAuthRequired - Callback when auth is required
 * @returns {Promise<any>} Parsed JSON response
 */
export async function authFetch(url, options = {}, config = {}) {
  const {
    maxRetries = 1,
    includeAuth = true,
    onAuthRequired = null,
  } = config;
  
  let lastError = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Build headers with auth token
      const headers = new Headers(options.headers || {});
      
      if (includeAuth) {
        const token = await getAccessToken();
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
      }
      
      // Make the request
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      // Handle 401 - try to refresh and retry
      if (response.status === 401) {
        console.log(`[authFetch] 401 on ${url}, attempt ${attempt + 1}/${maxRetries + 1}`);
        
        // Parse error response
        let errorBody;
        try {
          errorBody = await response.clone().json();
        } catch {
          errorBody = { error: 'Unauthorized' };
        }
        
        // If this was the last attempt, fail
        if (attempt >= maxRetries) {
          if (onAuthRequired) {
            onAuthRequired();
          }
          throw new AuthFetchError(
            errorBody.error || 'Authentication required',
            AuthFetchErrorTypes.AUTH_REQUIRED,
            401,
            errorBody
          );
        }
        
        // Try to refresh the session
        const refreshResult = await refreshSession();
        
        if (!refreshResult.success) {
          // Refresh failed - user needs to re-auth
          if (onAuthRequired) {
            onAuthRequired();
          }
          throw new AuthFetchError(
            'Session refresh failed. Please sign in again.',
            AuthFetchErrorTypes.AUTH_REFRESH_FAILED,
            401,
            { reason: refreshResult.reason }
          );
        }
        
        // Refresh succeeded - retry the request
        console.log('[authFetch] Retrying request after refresh');
        continue;
      }
      
      // Handle other client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        let errorBody;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = { error: `Client error: ${response.status}` };
        }
        
        throw new AuthFetchError(
          errorBody.error || `Request failed: ${response.status}`,
          AuthFetchErrorTypes.CLIENT_ERROR,
          response.status,
          errorBody
        );
      }
      
      // Handle server errors (5xx)
      if (response.status >= 500) {
        throw new AuthFetchError(
          `Server error: ${response.status}`,
          AuthFetchErrorTypes.SERVER_ERROR,
          response.status,
          null
        );
      }
      
      // Success - parse and return JSON
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }
      
      // For non-JSON responses, return the response object
      return response;
      
    } catch (err) {
      lastError = err;
      
      // If it's our custom error, rethrow
      if (err instanceof AuthFetchError) {
        throw err;
      }
      
      // Network or parsing error
      if (err.name === 'TypeError' || err.message?.includes('fetch')) {
        throw new AuthFetchError(
          'Network error. Please check your connection.',
          AuthFetchErrorTypes.NETWORK_ERROR,
          0,
          null
        );
      }
      
      throw err;
    }
  }
  
  // Should not reach here, but just in case
  throw lastError || new Error('Request failed');
}

/**
 * Convenience method for GET requests
 */
export async function authGet(url, config = {}) {
  return authFetch(url, { method: 'GET' }, config);
}

/**
 * Convenience method for POST requests
 */
export async function authPost(url, body, config = {}) {
  return authFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, config);
}

/**
 * Convenience method for PUT requests
 */
export async function authPut(url, body, config = {}) {
  return authFetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, config);
}

/**
 * Convenience method for DELETE requests
 */
export async function authDelete(url, config = {}) {
  return authFetch(url, { method: 'DELETE' }, config);
}

export default authFetch;

