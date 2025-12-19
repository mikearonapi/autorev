'use client';

/**
 * useFetchWithRetry Hook
 * 
 * A React hook for fetching data with automatic retry on failure.
 * Designed to handle transient network/server errors gracefully.
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - Configurable retry count and delays
 * - Built-in loading, error, and data states
 * - Manual retry trigger
 * - Request cancellation on unmount
 * 
 * Usage:
 *   const { data, loading, error, refetch } = useFetchWithRetry(
 *     `/api/cars/${carSlug}/efficiency`,
 *     { maxRetries: 2, retryDelay: 1000 }
 *   );
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ErrorLogger } from '@/lib/errorLogger';

const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RETRY_DELAY = 1000; // ms
const DEFAULT_TIMEOUT = 15000; // 15 seconds

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (0-based)
 * @param {number} baseDelay - Base delay in ms
 * @returns {number} - Delay in ms
 */
function getBackoffDelay(attempt, baseDelay) {
  // Exponential backoff with jitter: baseDelay * 2^attempt + random(0-500ms)
  const exponential = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 500;
  return Math.min(exponential + jitter, 30000); // Cap at 30 seconds
}

/**
 * Check if an error is retryable
 * @param {Error} error - The error to check
 * @param {number} status - HTTP status code if available
 * @returns {boolean}
 */
function isRetryableError(error, status) {
  // Network errors (no status) are usually retryable
  if (!status) return true;
  
  // Server errors (5xx) are retryable
  if (status >= 500 && status <= 599) return true;
  
  // 429 (rate limited) is retryable
  if (status === 429) return true;
  
  // Client errors (4xx) except 429 are not retryable
  if (status >= 400 && status < 500) return false;
  
  return false;
}

/**
 * @typedef {Object} UseFetchWithRetryOptions
 * @property {number} [maxRetries=2] - Maximum number of retry attempts
 * @property {number} [retryDelay=1000] - Base delay between retries in ms
 * @property {number} [timeout=15000] - Request timeout in ms
 * @property {boolean} [immediate=true] - Fetch immediately on mount
 * @property {function} [transform] - Transform function for response data
 * @property {string} [errorMessage] - Custom error message prefix
 */

/**
 * @typedef {Object} UseFetchWithRetryResult
 * @property {*} data - The fetched data
 * @property {boolean} loading - Whether a request is in progress
 * @property {string|null} error - Error message if any
 * @property {number} retryCount - Current retry attempt
 * @property {function} refetch - Manually trigger a refetch
 * @property {function} reset - Reset state to initial
 */

/**
 * Hook for fetching data with automatic retry
 * 
 * @param {string|null} url - The URL to fetch (null skips fetch)
 * @param {UseFetchWithRetryOptions} [options] - Configuration options
 * @returns {UseFetchWithRetryResult}
 */
export function useFetchWithRetry(url, options = {}) {
  const {
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    timeout = DEFAULT_TIMEOUT,
    immediate = true,
    transform = null,
    errorMessage = 'Failed to load data',
  } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate && !!url);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs for cleanup and abort
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const timeoutIdRef = useRef(null);
  
  /**
   * Perform the fetch with retry logic
   */
  const fetchData = useCallback(async (attemptNumber = 0) => {
    if (!url) return;
    
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear any pending retry timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    // Set loading state only on first attempt
    if (attemptNumber === 0) {
      setLoading(true);
      setError(null);
    }
    setRetryCount(attemptNumber);
    
    // Create timeout
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, timeout);
    
    try {
      const response = await fetch(url, { signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const err = new Error(errorBody.error || errorBody.message || `HTTP ${response.status}`);
        err.status = response.status;
        throw err;
      }
      
      const json = await response.json();
      const transformedData = transform ? transform(json) : json;
      
      if (isMountedRef.current) {
        setData(transformedData);
        setLoading(false);
        setError(null);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      
      // Ignore abort errors (component unmounted or new request)
      if (err.name === 'AbortError') {
        return;
      }
      
      const canRetry = attemptNumber < maxRetries && isRetryableError(err, err.status);
      
      if (canRetry && isMountedRef.current) {
        // Schedule retry with backoff
        const delay = getBackoffDelay(attemptNumber, retryDelay);
        console.log(`[useFetchWithRetry] Retry ${attemptNumber + 1}/${maxRetries} for ${url} in ${delay}ms`);
        
        timeoutIdRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            fetchData(attemptNumber + 1);
          }
        }, delay);
      } else if (isMountedRef.current) {
        // Max retries exhausted or non-retryable error
        const finalError = `${errorMessage}${attemptNumber > 0 ? ` (after ${attemptNumber + 1} attempts)` : ''}`;
        setError(finalError);
        setLoading(false);
        
        // Log to error tracking
        ErrorLogger.apiError(err, url, {
          status: err.status,
          method: 'GET',
          severity: err.status >= 500 ? 'major' : 'minor',
        });
      }
    }
  }, [url, maxRetries, retryDelay, timeout, transform, errorMessage]);
  
  /**
   * Manually trigger a refetch
   */
  const refetch = useCallback(() => {
    fetchData(0);
  }, [fetchData]);
  
  /**
   * Reset state to initial
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    setData(null);
    setLoading(false);
    setError(null);
    setRetryCount(0);
  }, []);
  
  // Initial fetch on mount or URL change
  useEffect(() => {
    isMountedRef.current = true;
    
    if (immediate && url) {
      fetchData(0);
    }
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [url, immediate, fetchData]);
  
  return {
    data,
    loading,
    error,
    retryCount,
    refetch,
    reset,
  };
}

export default useFetchWithRetry;

