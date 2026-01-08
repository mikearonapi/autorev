'use client';

/**
 * FetchInterceptor
 * 
 * Patches the global fetch to automatically log API errors.
 * This ensures ALL fetch calls in the app (existing and new) get error logging
 * without needing to modify each call site.
 * 
 * Logs:
 * - HTTP errors (4xx, 5xx)
 * - Network errors (offline, DNS failures)
 * - Timeouts (via AbortError)
 * - JSON parsing failures on responses
 * - Responses with error bodies (200 + { error: ... })
 * 
 * Does NOT log:
 * - Successful requests with valid data
 * - Requests to /api/feedback (to prevent infinite loops)
 * - External requests (non-API calls) by default
 */

import { useEffect } from 'react';
import { ErrorLogger, logError } from '@/lib/errorLogger';

// Track if we've already patched fetch
let isPatched = false;
let originalFetch = null;

function patchFetch() {
  if (isPatched || typeof window === 'undefined') return;
  
  originalFetch = window.fetch;
  isPatched = true;
  
  window.fetch = async function patchedFetch(input, init) {
    const startTime = Date.now();
    const url = typeof input === 'string' ? input : input?.url || String(input);
    const method = init?.method || 'GET';
    
    // Skip logging for feedback endpoint (prevent infinite loop)
    const isFeedbackEndpoint = url.includes('/api/feedback');
    // Skip logging for external URLs unless they're our API
    const isApiCall = url.startsWith('/api') || url.includes('/api/');
    
    try {
      const response = await originalFetch.call(window, input, init);
      const duration = Date.now() - startTime;
      
      // Log non-ok responses for API calls
      if (!response.ok && isApiCall && !isFeedbackEndpoint) {
        const errorMessage = `HTTP ${response.status}: ${response.statusText || 'Error'}`;
        const error = new Error(errorMessage);
        
        ErrorLogger.apiError(error, url, {
          status: response.status,
          method,
          duration,
          severity: response.status >= 500 ? 'major' : 'minor',
        });
      }
      
      // Wrap response.json() to catch parsing failures and error responses
      if (isApiCall && !isFeedbackEndpoint) {
        const originalJson = response.json.bind(response);
        let jsonCalled = false;
        
        response.json = async function patchedJson() {
          if (jsonCalled) {
            // Response body already consumed, call original (will throw)
            return originalJson();
          }
          jsonCalled = true;
          
          try {
            const data = await originalJson();
            
            // Detect "success" responses that contain error data
            // Common pattern: { error: "...", success: false }
            if (response.ok && data && typeof data === 'object') {
              if (data.error && !data.success) {
                logError(new Error(data.error), {
                  errorType: 'api_error_response',
                  apiRoute: url,
                  httpMethod: method,
                  status: response.status,
                  errorBody: typeof data.error === 'string' ? data.error.slice(0, 200) : 'error object',
                  severity: 'minor',
                });
              }
            }
            
            return data;
          } catch (parseError) {
            // JSON parsing failed
            logError(parseError, {
              errorType: 'json_parse_error',
              apiRoute: url,
              httpMethod: method,
              status: response.status,
              severity: 'major',
            });
            throw parseError;
          }
        };
      }
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Only log API calls, not external resources
      if (isApiCall && !isFeedbackEndpoint) {
        const isTimeout = error?.name === 'AbortError';
        
        if (isTimeout) {
          ErrorLogger.networkTimeout(error, url, {
            method,
            duration,
          });
        } else {
          // Network error
          ErrorLogger.apiError(error, url, {
            method,
            duration,
            errorCode: 'NETWORK_ERROR',
            severity: 'major',
          });
        }
      }
      
      // Re-throw so caller can still handle it
      throw error;
    }
  };
}

function unpatchFetch() {
  if (!isPatched || typeof window === 'undefined' || !originalFetch) return;
  window.fetch = originalFetch;
  isPatched = false;
  originalFetch = null;
}

/**
 * Component that patches fetch on mount
 * Add this once at the app root level
 */
export function FetchInterceptor({ children }) {
  useEffect(() => {
    patchFetch();
    
    return () => {
      // Don't unpatch on unmount in production
      // (component shouldn't unmount anyway since it's at root)
    };
  }, []);
  
  return children;
}

// Export for manual use if needed
export { patchFetch, unpatchFetch };

export default FetchInterceptor;









