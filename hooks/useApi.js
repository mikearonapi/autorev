'use client';

/**
 * useApi Hook
 * 
 * A React hook for making API calls with automatic error logging,
 * loading states, and error handling.
 * 
 * Usage:
 *   const { data, error, isLoading, execute } = useApi('/api/cars');
 *   
 *   // Or with manual trigger:
 *   const { execute, isLoading } = useApi('/api/cars', { manual: true });
 *   const handleClick = () => execute();
 *   
 *   // POST with data:
 *   const { execute } = useApi('/api/feedback', { method: 'POST', manual: true });
 *   execute({ message: 'hello' });
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ErrorLogger } from '@/lib/errorLogger';

export function useApi(url, options = {}) {
  const {
    method = 'GET',
    manual = false,
    initialData = null,
    onSuccess,
    onError,
    timeout = 15000,
  } = options;
  
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(!manual);
  const abortControllerRef = useRef(null);
  
  const execute = useCallback(async (body = null, overrideUrl = null) => {
    const requestUrl = overrideUrl || url;
    const startTime = Date.now();
    
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchOptions = {
        method: body ? 'POST' : method,
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
      };
      
      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }
      
      // Set up timeout
      const timeoutId = setTimeout(() => {
        abortControllerRef.current?.abort();
      }, timeout);
      
      const response = await fetch(requestUrl, fetchOptions);
      clearTimeout(timeoutId);
      
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        let errorBody = null;
        try {
          errorBody = await response.json();
        } catch {
          // Not JSON
        }
        
        const errorMessage = errorBody?.error || errorBody?.message || `HTTP ${response.status}`;
        const err = new Error(errorMessage);
        err.status = response.status;
        err.response = errorBody;
        
        // Log to feedback system (interceptor may also log, but deduplication handles it)
        ErrorLogger.apiError(err, requestUrl, {
          status: response.status,
          method: fetchOptions.method,
          duration,
          severity: response.status >= 500 ? 'major' : 'minor',
        });
        
        setError(err);
        onError?.(err);
        return { data: null, error: err };
      }
      
      const contentType = response.headers.get('content-type');
      const result = contentType?.includes('application/json')
        ? await response.json()
        : await response.text();
      
      setData(result);
      onSuccess?.(result);
      return { data: result, error: null };
      
    } catch (err) {
      // Don't update state if request was aborted intentionally
      if (err.name === 'AbortError') {
        return { data: null, error: null };
      }
      
      const duration = Date.now() - startTime;
      
      // Log network errors
      ErrorLogger.apiError(err, requestUrl, {
        method,
        duration,
        errorCode: 'NETWORK_ERROR',
        severity: 'major',
      });
      
      setError(err);
      onError?.(err);
      return { data: null, error: err };
      
    } finally {
      setIsLoading(false);
    }
  }, [url, method, timeout, onSuccess, onError]);
  
  // Auto-execute on mount if not manual
  useEffect(() => {
    if (!manual) {
      execute();
    }
    
    return () => {
      // Cleanup: abort any in-flight request
      abortControllerRef.current?.abort();
    };
  }, [manual, execute]);
  
  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setIsLoading(false);
  }, [initialData]);
  
  return {
    data,
    error,
    isLoading,
    execute,
    reset,
    // Convenience aliases
    loading: isLoading,
    refetch: execute,
  };
}

export default useApi;









