/**
 * Session Cache Module
 * 
 * Provides early session checking to reduce auth latency by 200-400ms.
 * 
 * Strategy:
 * - Start session check immediately when module loads (parallel with React render)
 * - Cache the session promise (singleton pattern)
 * - AuthProvider awaits the already-in-flight promise
 * - Ensures session check only happens once
 * 
 * Performance Impact:
 * - Before: AuthProvider mounts → calls getSession() → waits 300-800ms
 * - After: Session check starts at module load → AuthProvider awaits cached promise
 * - Saves: 200-400ms by overlapping session check with component mount
 */

import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Cached session promise (singleton)
 * Ensures getSession() is called only once
 */
let sessionPromise = null;

/**
 * Start timestamp for performance tracking
 */
let sessionStartTime = null;

/**
 * Get session early (before AuthProvider mounts)
 * 
 * On first call:
 * - Starts the session check
 * - Caches the promise
 * - Returns the promise
 * 
 * On subsequent calls:
 * - Returns the cached promise
 * - No duplicate session requests
 * 
 * @returns {Promise<{data: {session: Session|null}, error: Error|null}>}
 */
export function getSessionEarly() {
  // If Supabase is not configured, return null session immediately
  if (!isSupabaseConfigured || !supabase) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[sessionCache] Supabase not configured, returning null session');
    }
    return Promise.resolve({ data: { session: null }, error: null });
  }
  
  // If promise already exists, return it (prevents duplicate calls)
  if (sessionPromise) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      const elapsed = sessionStartTime ? Date.now() - sessionStartTime : 0;
      console.log('[sessionCache] Returning cached session promise (age:', elapsed, 'ms)');
    }
    return sessionPromise;
  }
  
  // Start timing
  sessionStartTime = Date.now();
  
  // Create and cache the session promise
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[sessionCache] Starting early session check at module load');
  }
  
  sessionPromise = supabase.auth.getSession()
    .then(result => {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        const elapsed = Date.now() - sessionStartTime;
        console.log('[sessionCache] Session check completed in', elapsed, 'ms');
      }
      return result;
    })
    .catch(error => {
      if (typeof window !== 'undefined') {
        console.error('[sessionCache] Session check failed:', error);
      }
      return { data: { session: null }, error };
    });
  
  return sessionPromise;
}

/**
 * Clear the cached session promise
 * 
 * Call this when:
 * - User signs out
 * - Session is invalidated
 * - Need to force a fresh session check
 * 
 * This ensures the next call to getSessionEarly() will create a new promise.
 */
export function clearSessionCache() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[sessionCache] Clearing cached session promise');
  }
  sessionPromise = null;
  sessionStartTime = null;
}

/**
 * Fire session check immediately on client-side module load
 * 
 * This runs as soon as the module is imported, which happens
 * early in the app bootstrap process, before AuthProvider mounts.
 * 
 * By the time AuthProvider needs the session, the request is
 * already in-flight or complete, saving 200-400ms.
 */
if (typeof window !== 'undefined') {
  // Fire immediately - don't await
  getSessionEarly();
}












