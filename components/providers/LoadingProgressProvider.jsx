'use client';

/**
 * Loading Progress Provider
 * 
 * Centralized tracking of completion states across all user data providers.
 * Used to show a unified loading progress screen after authentication.
 * 
 * Uses a status model: 'pending' | 'loading' | 'completed' | 'failed' | 'timeout'
 * 
 * Features:
 * - Per-step timeout handling
 * - Retry capability for failed/timed out steps
 * - Detailed status tracking per step
 * 
 * @module components/providers/LoadingProgressProvider
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

/**
 * Step status types
 */
const StepStatus = {
  PENDING: 'pending',     // Not started
  LOADING: 'loading',     // In progress
  COMPLETED: 'completed', // Successfully done
  FAILED: 'failed',       // Failed with error
  TIMEOUT: 'timeout',     // Timed out
};

/**
 * Per-step timeout in milliseconds
 * Different steps may need different timeouts based on typical load times
 */
const STEP_TIMEOUTS = {
  profile: 5000,    // 5s - usually fast
  favorites: 8000,  // 8s - can be large lists
  vehicles: 8000,   // 8s - can be large lists
  builds: 10000,    // 10s - most complex data
};

/**
 * @typedef {Object} StepState
 * @property {'pending'|'loading'|'completed'|'failed'|'timeout'} status
 * @property {string|null} error - Error message if failed
 * @property {number} startTime - When loading started
 */

/**
 * @typedef {Object} LoadingProgressState
 * @property {StepState} profile
 * @property {StepState} favorites
 * @property {StepState} vehicles
 * @property {StepState} builds
 */

const createDefaultStepState = () => ({
  status: StepStatus.PENDING,
  error: null,
  startTime: 0,
});

const LoadingProgressContext = createContext(null);

// All start as pending
const defaultLoadingStates = {
  profile: createDefaultStepState(),
  favorites: createDefaultStepState(),
  vehicles: createDefaultStepState(),
  builds: createDefaultStepState(),
};

/**
 * Helper to check if a step is "done" (completed, failed, or timeout)
 */
const isStepDone = (step) => {
  const status = step?.status || step;
  return status === StepStatus.COMPLETED || 
         status === StepStatus.FAILED || 
         status === StepStatus.TIMEOUT ||
         status === true; // backwards compat
};

/**
 * Helper to check if step completed successfully
 */
const isStepCompleted = (step) => {
  const status = step?.status || step;
  return status === StepStatus.COMPLETED || status === true;
};

/**
 * Loading Progress Provider Component
 */
export function LoadingProgressProvider({ children }) {
  const [loadingStates, setLoadingStates] = useState(defaultLoadingStates);
  const [isShowingProgress, setIsShowingProgress] = useState(false);
  const progressStartedRef = useRef(false);
  const completionCallbackRef = useRef(null);
  const stepTimeoutsRef = useRef({}); // Track timeout timers per step
  const retryCallbacksRef = useRef({}); // Store retry callbacks per step

  // Clear all step timeouts
  const clearAllStepTimeouts = useCallback(() => {
    Object.values(stepTimeoutsRef.current).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    stepTimeoutsRef.current = {};
  }, []);

  /**
   * Mark a step as started loading
   * Sets up timeout handler
   * @param {string} key - The data type key
   * @param {function} retryCallback - Optional callback to retry this step
   */
  const markStarted = useCallback((key, retryCallback = null) => {
    // Store retry callback if provided
    if (retryCallback) {
      retryCallbacksRef.current[key] = retryCallback;
    }

    setLoadingStates(prev => {
      const step = prev[key];
      // Don't restart if already completed
      if (isStepCompleted(step)) return prev;
      
      console.log(`[LoadingProgress] ${key}: started loading...`);
      return {
        ...prev,
        [key]: {
          status: StepStatus.LOADING,
          error: null,
          startTime: Date.now(),
        },
      };
    });

    // Set up timeout for this step
    const timeout = STEP_TIMEOUTS[key] || 8000;
    
    // Clear existing timeout if any
    if (stepTimeoutsRef.current[key]) {
      clearTimeout(stepTimeoutsRef.current[key]);
    }
    
    stepTimeoutsRef.current[key] = setTimeout(() => {
      setLoadingStates(prev => {
        const step = prev[key];
        // Only timeout if still loading
        if (step?.status !== StepStatus.LOADING) return prev;
        
        console.warn(`[LoadingProgress] ${key}: TIMEOUT after ${timeout}ms`);
        return {
          ...prev,
          [key]: {
            ...step,
            status: StepStatus.TIMEOUT,
            error: `Loading timed out after ${Math.round(timeout / 1000)}s`,
          },
        };
      });
    }, timeout);
  }, []);

  /**
   * Mark a data type as completed (done loading)
   * @param {string} key - The data type key (profile, favorites, vehicles, builds)
   */
  const markComplete = useCallback((key) => {
    // Clear timeout for this step
    if (stepTimeoutsRef.current[key]) {
      clearTimeout(stepTimeoutsRef.current[key]);
      delete stepTimeoutsRef.current[key];
    }

    setLoadingStates(prev => {
      const step = prev[key];
      // Handle backwards compatibility (boolean values)
      if (step === true || step?.status === StepStatus.COMPLETED) return prev;
      
      const duration = step?.startTime ? Date.now() - step.startTime : 0;
      console.log(`[LoadingProgress] ${key}: complete ✓ (${duration}ms)`);
      
      return {
        ...prev,
        [key]: {
          status: StepStatus.COMPLETED,
          error: null,
          startTime: step?.startTime || Date.now(),
        },
      };
    });
  }, []);

  /**
   * Mark a step as failed
   * @param {string} key - The data type key
   * @param {string} error - Error message
   */
  const markFailed = useCallback((key, error = 'Unknown error') => {
    // Clear timeout for this step
    if (stepTimeoutsRef.current[key]) {
      clearTimeout(stepTimeoutsRef.current[key]);
      delete stepTimeoutsRef.current[key];
    }

    setLoadingStates(prev => {
      const step = prev[key];
      // Don't overwrite completed steps
      if (step?.status === StepStatus.COMPLETED || step === true) return prev;
      
      console.error(`[LoadingProgress] ${key}: FAILED - ${error}`);
      return {
        ...prev,
        [key]: {
          ...step,
          status: StepStatus.FAILED,
          error,
        },
      };
    });
  }, []);

  /**
   * Retry a failed or timed out step
   * @param {string} key - The data type key
   */
  const retryStep = useCallback((key) => {
    const retryCallback = retryCallbacksRef.current[key];
    
    if (!retryCallback) {
      console.warn(`[LoadingProgress] No retry callback for ${key}`);
      return;
    }
    
    console.log(`[LoadingProgress] Retrying ${key}...`);
    
    // Reset the step state to loading
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        status: StepStatus.LOADING,
        error: null,
        startTime: Date.now(),
      },
    }));
    
    // Set up new timeout
    const timeout = STEP_TIMEOUTS[key] || 8000;
    stepTimeoutsRef.current[key] = setTimeout(() => {
      setLoadingStates(prev => {
        const step = prev[key];
        if (step?.status !== StepStatus.LOADING) return prev;
        
        return {
          ...prev,
          [key]: {
            ...step,
            status: StepStatus.TIMEOUT,
            error: `Retry timed out after ${Math.round(timeout / 1000)}s`,
          },
        };
      });
    }, timeout);
    
    // Execute retry
    try {
      retryCallback();
    } catch (err) {
      console.error(`[LoadingProgress] Retry for ${key} threw:`, err);
      markFailed(key, err.message);
    }
  }, [markFailed]);

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
    
    // Clear any existing timeouts
    clearAllStepTimeouts();
    
    // Reset all states to pending
    setLoadingStates({
      profile: createDefaultStepState(),
      favorites: createDefaultStepState(),
      vehicles: createDefaultStepState(),
      builds: createDefaultStepState(),
    });
    
    setIsShowingProgress(true);
  }, [clearAllStepTimeouts]);

  /**
   * End the progress screen
   * Usually called automatically when all loading completes
   */
  const endProgress = useCallback(() => {
    console.log('[LoadingProgress] Ending progress screen');
    clearAllStepTimeouts();
    setIsShowingProgress(false);
    progressStartedRef.current = false;
    
    // Call completion callback if set
    if (completionCallbackRef.current) {
      completionCallbackRef.current();
      completionCallbackRef.current = null;
    }
  }, [clearAllStepTimeouts]);

  /**
   * Dismiss the progress screen (user clicked X)
   * Different from endProgress - this is user-initiated
   */
  const dismissProgress = useCallback(() => {
    console.log('[LoadingProgress] User dismissed progress screen');
    clearAllStepTimeouts();
    setIsShowingProgress(false);
    // Note: we keep progressStartedRef.current true so it won't show again
    // and keep tracking completion in background
  }, [clearAllStepTimeouts]);

  /**
   * Reset all loading states
   * Call this on logout
   */
  const resetProgress = useCallback(() => {
    clearAllStepTimeouts();
    retryCallbacksRef.current = {};
    setLoadingStates(defaultLoadingStates);
    setIsShowingProgress(false);
    progressStartedRef.current = false;
    completionCallbackRef.current = null;
  }, [clearAllStepTimeouts]);

  /**
   * Get counts of steps in each state
   */
  const getStepCounts = useCallback(() => {
    const steps = Object.values(loadingStates);
    return {
      total: steps.length,
      completed: steps.filter(s => isStepCompleted(s)).length,
      failed: steps.filter(s => s?.status === StepStatus.FAILED).length,
      timeout: steps.filter(s => s?.status === StepStatus.TIMEOUT).length,
      loading: steps.filter(s => s?.status === StepStatus.LOADING).length,
      pending: steps.filter(s => s?.status === StepStatus.PENDING).length,
      allDone: steps.every(s => isStepDone(s)),
      allCompleted: steps.every(s => isStepCompleted(s)),
    };
  }, [loadingStates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllStepTimeouts();
    };
  }, [clearAllStepTimeouts]);

  const value = {
    loadingStates,
    isShowingProgress,
    markStarted,
    markComplete,
    markFailed,
    retryStep,
    startProgress,
    endProgress,
    dismissProgress,
    resetProgress,
    getStepCounts,
    StepStatus,
    isStepDone,
    isStepCompleted,
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
      markStarted: () => {},
      markComplete: () => {},
      markFailed: () => {},
      retryStep: () => {},
      startProgress: () => {},
      endProgress: () => {},
      dismissProgress: () => {},
      resetProgress: () => {},
      getStepCounts: () => ({ total: 4, completed: 0, failed: 0, timeout: 0, loading: 0, pending: 4, allDone: false, allCompleted: false }),
      StepStatus,
      isStepDone,
      isStepCompleted,
    };
  }
  
  return context;
}

// Export helpers for use by other components
export { StepStatus, isStepDone, isStepCompleted };

export default LoadingProgressProvider;

