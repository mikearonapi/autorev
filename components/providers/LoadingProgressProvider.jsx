'use client';

/**
 * Loading Progress Provider
 * 
 * Centralized tracking of loading states across all user data providers.
 * Used to show a unified loading progress screen after authentication.
 * 
 * @module components/providers/LoadingProgressProvider
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

/**
 * @typedef {Object} LoadingProgressState
 * @property {boolean} profile - Profile loading state
 * @property {boolean} favorites - Favorites loading state
 * @property {boolean} vehicles - Vehicles loading state
 * @property {boolean} builds - Builds loading state
 */

/**
 * @typedef {Object} LoadingProgressContextValue
 * @property {LoadingProgressState} loadingStates - Current loading states
 * @property {boolean} isShowingProgress - Whether progress screen should be shown
 * @property {function(string, boolean): void} setLoadingState - Set loading state for a key
 * @property {function(): void} startProgress - Start showing progress screen
 * @property {function(): void} endProgress - End progress screen
 * @property {function(): void} resetProgress - Reset all loading states
 */

const LoadingProgressContext = createContext(null);

const defaultLoadingStates = {
  profile: false,
  favorites: false,
  vehicles: false,
  builds: false,
};

/**
 * Loading Progress Provider Component
 */
export function LoadingProgressProvider({ children }) {
  const [loadingStates, setLoadingStates] = useState(defaultLoadingStates);
  const [isShowingProgress, setIsShowingProgress] = useState(false);
  const progressStartedRef = useRef(false);
  const completionCallbackRef = useRef(null);

  /**
   * Set loading state for a specific key
   * @param {string} key - The loading state key (profile, favorites, vehicles, builds)
   * @param {boolean} isLoading - Whether it's loading
   */
  const setLoadingState = useCallback((key, isLoading) => {
    setLoadingStates(prev => {
      // Only update if state actually changed
      if (prev[key] === isLoading) return prev;
      
      console.log(`[LoadingProgress] ${key}: ${isLoading ? 'loading' : 'complete'}`);
      return { ...prev, [key]: isLoading };
    });
  }, []);

  /**
   * Start showing the progress screen
   * Call this after successful authentication
   * @param {function} onComplete - Optional callback when all loading is complete
   */
  const startProgress = useCallback((onComplete) => {
    if (progressStartedRef.current) return;
    
    console.log('[LoadingProgress] Starting progress screen');
    progressStartedRef.current = true;
    completionCallbackRef.current = onComplete || null;
    
    // Reset all states to "loading" so we track fresh progress
    setLoadingStates({
      profile: true,
      favorites: true,
      vehicles: true,
      builds: true,
    });
    
    setIsShowingProgress(true);
  }, []);

  /**
   * End the progress screen
   * Usually called automatically when all loading completes
   */
  const endProgress = useCallback(() => {
    console.log('[LoadingProgress] Ending progress screen');
    setIsShowingProgress(false);
    progressStartedRef.current = false;
    
    // Call completion callback if set
    if (completionCallbackRef.current) {
      completionCallbackRef.current();
      completionCallbackRef.current = null;
    }
  }, []);

  /**
   * Reset all loading states
   * Call this on logout
   */
  const resetProgress = useCallback(() => {
    setLoadingStates(defaultLoadingStates);
    setIsShowingProgress(false);
    progressStartedRef.current = false;
    completionCallbackRef.current = null;
  }, []);

  const value = {
    loadingStates,
    isShowingProgress,
    setLoadingState,
    startProgress,
    endProgress,
    resetProgress,
  };

  return (
    <LoadingProgressContext.Provider value={value}>
      {children}
    </LoadingProgressContext.Provider>
  );
}

/**
 * Hook to access loading progress context
 * @returns {LoadingProgressContextValue}
 */
export function useLoadingProgress() {
  const context = useContext(LoadingProgressContext);
  
  if (!context) {
    // Return a no-op version if used outside provider (for testing)
    return {
      loadingStates: defaultLoadingStates,
      isShowingProgress: false,
      setLoadingState: () => {},
      startProgress: () => {},
      endProgress: () => {},
      resetProgress: () => {},
    };
  }
  
  return context;
}

export default LoadingProgressProvider;

