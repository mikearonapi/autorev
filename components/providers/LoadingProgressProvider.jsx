'use client';

/**
 * Loading Progress Provider
 * 
 * Centralized tracking of completion states across all user data providers.
 * Used to show a unified loading progress screen after authentication.
 * 
 * Uses a "completed" model: true = done loading, false = still loading
 * 
 * @module components/providers/LoadingProgressProvider
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react';

/**
 * @typedef {Object} LoadingProgressState
 * @property {boolean} profile - Profile completed (true = done)
 * @property {boolean} favorites - Favorites completed
 * @property {boolean} vehicles - Vehicles completed
 * @property {boolean} builds - Builds completed
 */

/**
 * @typedef {Object} LoadingProgressContextValue
 * @property {LoadingProgressState} loadingStates - Current completion states
 * @property {boolean} isShowingProgress - Whether progress screen should be shown
 * @property {function(string): void} markComplete - Mark a data type as loaded
 * @property {function(): void} startProgress - Start showing progress screen
 * @property {function(): void} endProgress - End progress screen
 * @property {function(): void} resetProgress - Reset all loading states
 */

const LoadingProgressContext = createContext(null);

// All start as false (not completed)
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
   * Mark a data type as completed (done loading)
   * @param {string} key - The data type key (profile, favorites, vehicles, builds)
   */
  const markComplete = useCallback((key) => {
    setLoadingStates(prev => {
      // Only update if not already complete
      if (prev[key] === true) return prev;
      
      console.log(`[LoadingProgress] ${key}: complete ✓`);
      return { ...prev, [key]: true };
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
    
    // Reset all states to "not completed" so we track fresh progress
    setLoadingStates({
      profile: false,
      favorites: false,
      vehicles: false,
      builds: false,
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
   * Dismiss the progress screen (user clicked X)
   * Different from endProgress - this is user-initiated
   */
  const dismissProgress = useCallback(() => {
    console.log('[LoadingProgress] User dismissed progress screen');
    setIsShowingProgress(false);
    // Note: we keep progressStartedRef.current true so it won't show again
    // and keep tracking completion in background
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
    markComplete,
    startProgress,
    endProgress,
    dismissProgress,
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
      markComplete: () => {},
      startProgress: () => {},
      endProgress: () => {},
      dismissProgress: () => {},
      resetProgress: () => {},
    };
  }
  
  return context;
}

export default LoadingProgressProvider;

