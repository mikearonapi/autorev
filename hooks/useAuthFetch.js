/**
 * useAuthFetch Hook
 * 
 * Combines authFetch with the AuthProvider context for seamless integration.
 * Automatically handles auth errors and triggers UI updates.
 * 
 * Usage:
 *   const { fetch, get, post, isRefreshing, error } = useAuthFetch();
 *   const data = await get('/api/some-endpoint');
 */

'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
  authFetch, 
  authGet, 
  authPost, 
  authPut, 
  authDelete,
  AuthFetchError,
  AuthFetchErrorTypes,
} from '@/lib/authFetch';

/**
 * Hook for making authenticated API requests with automatic retry
 */
export function useAuthFetch() {
  const { refreshSession, isAuthenticated, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastError, setLastError] = useState(null);

  // Handle auth required callback
  const handleAuthRequired = useCallback(async () => {
    console.log('[useAuthFetch] Auth required, attempting refresh...');
    setIsRefreshing(true);
    
    try {
      const result = await refreshSession();
      if (result.error) {
        console.warn('[useAuthFetch] Refresh via context failed');
        // Don't auto-logout - let the UI handle it
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshSession]);

  // Wrapped fetch that integrates with auth context
  const wrappedFetch = useCallback(async (url, options = {}, config = {}) => {
    setLastError(null);
    
    try {
      return await authFetch(url, options, {
        ...config,
        onAuthRequired: handleAuthRequired,
      });
    } catch (err) {
      setLastError(err);
      
      // If auth completely failed, the user might need to re-login
      if (err instanceof AuthFetchError) {
        if (err.type === AuthFetchErrorTypes.AUTH_REFRESH_FAILED) {
          // Session is completely invalid
          console.warn('[useAuthFetch] Auth refresh failed completely');
        }
      }
      
      throw err;
    }
  }, [handleAuthRequired]);

  // Convenience methods
  const get = useCallback((url, config) => 
    wrappedFetch(url, { method: 'GET' }, config), [wrappedFetch]);
  
  const post = useCallback((url, body, config) => 
    wrappedFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, config), [wrappedFetch]);
  
  const put = useCallback((url, body, config) => 
    wrappedFetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, config), [wrappedFetch]);
  
  const del = useCallback((url, config) => 
    wrappedFetch(url, { method: 'DELETE' }, config), [wrappedFetch]);

  return {
    fetch: wrappedFetch,
    get,
    post,
    put,
    delete: del,
    isRefreshing,
    lastError,
    clearError: () => setLastError(null),
    isAuthenticated,
  };
}

export default useAuthFetch;

