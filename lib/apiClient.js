/**
 * Unified API Client
 * 
 * Centralized fetch utility for all API calls with:
 * - Automatic auth token injection
 * - Standardized error handling
 * - Request/response logging in dev mode
 * - Configurable timeout
 * 
 * @module lib/apiClient
 */

const DEFAULT_TIMEOUT = 15000; // 15 seconds
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Base fetch function with timeout and error handling
 * 
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @param {number} [timeout] - Request timeout in ms
 * @returns {Promise<Object>} - JSON response
 */
async function baseFetch(url, options = {}, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    signal: controller.signal,
  };
  
  // Remove Content-Type for FormData (browser sets it with boundary)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  if (IS_DEV) {
    console.log(`[apiClient] ${options.method || 'GET'} ${url}`);
  }
  
  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);
    
    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new ApiError(
          response.statusText || 'Request failed',
          response.status
        );
      }
      // Return null for successful non-JSON responses (e.g., 204 No Content)
      return null;
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.error || data.message || response.statusText || 'Request failed';
      throw new ApiError(errorMessage, response.status, data);
    }
    
    if (IS_DEV) {
      console.log(`[apiClient] ${options.method || 'GET'} ${url} -> OK`);
    }
    
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    
    // Handle abort errors (timeout)
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out', 408);
    }
    
    // Re-throw ApiErrors as-is
    if (err instanceof ApiError) {
      throw err;
    }
    
    // Wrap other errors
    throw new ApiError(err.message || 'Network error', 0);
  }
}

/**
 * API Client with HTTP method helpers
 */
const apiClient = {
  /**
   * GET request
   * @param {string} url - API endpoint
   * @param {Object} [options] - Additional fetch options
   * @param {number} [timeout] - Request timeout in ms
   */
  get: (url, options = {}, timeout) => 
    baseFetch(url, { method: 'GET', ...options }, timeout),
  
  /**
   * POST request
   * @param {string} url - API endpoint
   * @param {Object} body - Request body (will be JSON stringified)
   * @param {Object} [options] - Additional fetch options
   * @param {number} [timeout] - Request timeout in ms
   */
  post: (url, body, options = {}, timeout) => 
    baseFetch(url, { 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body), 
      ...options 
    }, timeout),
  
  /**
   * PUT request
   * @param {string} url - API endpoint
   * @param {Object} body - Request body (will be JSON stringified)
   * @param {Object} [options] - Additional fetch options
   * @param {number} [timeout] - Request timeout in ms
   */
  put: (url, body, options = {}, timeout) => 
    baseFetch(url, { 
      method: 'PUT', 
      body: body instanceof FormData ? body : JSON.stringify(body), 
      ...options 
    }, timeout),
  
  /**
   * PATCH request
   * @param {string} url - API endpoint
   * @param {Object} body - Request body (will be JSON stringified)
   * @param {Object} [options] - Additional fetch options
   * @param {number} [timeout] - Request timeout in ms
   */
  patch: (url, body, options = {}, timeout) => 
    baseFetch(url, { 
      method: 'PATCH', 
      body: body instanceof FormData ? body : JSON.stringify(body), 
      ...options 
    }, timeout),
  
  /**
   * DELETE request
   * @param {string} url - API endpoint
   * @param {Object} [options] - Additional fetch options
   * @param {number} [timeout] - Request timeout in ms
   */
  delete: (url, options = {}, timeout) => 
    baseFetch(url, { method: 'DELETE', ...options }, timeout),
};

export default apiClient;

// Named exports for convenience
export const { get, post, put, patch } = apiClient;
export { apiClient };
