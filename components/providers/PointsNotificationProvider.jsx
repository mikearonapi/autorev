'use client';

/**
 * PointsNotificationProvider
 * 
 * Global provider for showing points earned notifications.
 * Wrap your app with this provider and use the usePointsNotification hook
 * to show toast notifications when users earn points.
 * 
 * @example
 * // In a component:
 * const { showPointsEarned } = usePointsNotification();
 * 
 * // After awarding points:
 * showPointsEarned(5, 'Profile question');
 */

import { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Lazy load the toast component
const PointsToast = dynamic(() => import('@/components/PointsToast'), {
  ssr: false,
});

const PointsNotificationContext = createContext(null);

/**
 * Queue item for points notifications
 * @typedef {Object} PointsNotification
 * @property {string} id - Unique ID for the notification
 * @property {number} points - Points earned
 * @property {string|null} label - Optional label describing the action
 */

export function PointsNotificationProvider({ children }) {
  const [currentToast, setCurrentToast] = useState(null);
  const queueRef = useRef([]);
  const isShowingRef = useRef(false);
  
  // Process the next item in the queue
  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0) {
      isShowingRef.current = false;
      return;
    }
    
    isShowingRef.current = true;
    const next = queueRef.current.shift();
    setCurrentToast(next);
  }, []);
  
  // Dismiss current toast and process next
  const handleDismiss = useCallback(() => {
    setCurrentToast(null);
    // Small delay before showing next toast
    setTimeout(() => {
      processQueue();
    }, 200);
  }, [processQueue]);
  
  /**
   * Show a points earned notification
   * @param {number} points - Number of points earned
   * @param {string} [label] - Optional label for the action (e.g., "Profile question")
   */
  const showPointsEarned = useCallback((points, label = null) => {
    if (!points || points <= 0) return;
    
    const notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      points,
      label,
    };
    
    // Add to queue
    queueRef.current.push(notification);
    
    // If not currently showing, start processing
    if (!isShowingRef.current) {
      processQueue();
    }
  }, [processQueue]);
  
  const value = useMemo(() => ({
    showPointsEarned,
  }), [showPointsEarned]);
  
  return (
    <PointsNotificationContext.Provider value={value}>
      {children}
      
      {/* Toast - rendered at root level */}
      {currentToast && (
        <PointsToast
          key={currentToast.id}
          points={currentToast.points}
          label={currentToast.label}
          onDismiss={handleDismiss}
        />
      )}
    </PointsNotificationContext.Provider>
  );
}

/**
 * Hook to access points notification functions
 * @returns {{ showPointsEarned: (points: number, label?: string) => void }}
 */
export function usePointsNotification() {
  const context = useContext(PointsNotificationContext);
  
  if (!context) {
    // Return a no-op function if used outside provider (graceful degradation)
    return {
      showPointsEarned: () => {
        console.warn('[usePointsNotification] Used outside of PointsNotificationProvider');
      },
    };
  }
  
  return context;
}

export default PointsNotificationProvider;
