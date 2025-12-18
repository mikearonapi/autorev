'use client';

/**
 * API Client with automatic error logging
 * 
 * Usage:
 *   import { api } from '@/lib/apiClient';
 *   const data = await api.get('/api/cars');
 *   const result = await api.post('/api/feedback', { message: 'test' });
 * 
 * All errors are automatically logged to the feedback system.
 * Errors are still thrown so callers can handle them for UI purposes.
 */

import { ErrorLogger } from '@/lib/errorLogger';

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Make an API request with automatic error logging
 */
async function request(url, options = {}) {
  const startTime = Date.now();
  const method = options.method || 'GET';
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch {
        // Response wasn't JSON
      }
      
      const errorMessage = errorBody?.error || errorBody?.message || response.statusText || `HTTP ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.response = errorBody;
      
      // Log to feedback system
      ErrorLogger.apiError(error, url, {
        status: response.status,
        method,
        duration,
        severity: response.status >= 500 ? 'major' : 'minor',
      });
      
      throw error;
    }
    
    // Try to parse JSON, fall back to text
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    return response.text();
    
  } catch (error) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    // Check if it's already been logged (non-ok response case above)
    if (error.status) {
      throw error;
    }
    
    // Network error or timeout
    const isTimeout = error.name === 'AbortError';
    
    if (isTimeout) {
      ErrorLogger.networkTimeout(new Error(`Request timed out after ${duration}ms`), url, {
        method,
        duration,
      });
    } else {
      // Network error (offline, DNS failure, CORS, etc.)
      ErrorLogger.apiError(error, url, {
        method,
        duration,
        errorCode: 'NETWORK_ERROR',
        severity: 'major',
      });
    }
    
    throw error;
  }
}

/**
 * Convenience methods
 */
export const api = {
  get: (url, options = {}) => request(url, { ...options, method: 'GET' }),
  
  post: (url, data, options = {}) => request(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  put: (url, data, options = {}) => request(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  patch: (url, data, options = {}) => request(url, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  delete: (url, options = {}) => request(url, { ...options, method: 'DELETE' }),
  
  // Raw request with full control
  request,
};

export default api;
