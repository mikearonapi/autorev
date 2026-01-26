'use client';

/**
 * PullToRefresh Component
 * 
 * Provides native-feeling pull-to-refresh gesture for mobile list pages.
 * Only activates when scrolled to the top of the container.
 * 
 * @example
 * <PullToRefresh onRefresh={async () => { await refetch(); }}>
 *   <YourScrollableContent />
 * </PullToRefresh>
 */

import { useState, useRef, useCallback, useEffect } from 'react';

import styles from './PullToRefresh.module.css';

// Default threshold to trigger refresh (pixels pulled down)
const DEFAULT_THRESHOLD = 80;

// Maximum pull distance (pixels)
const MAX_PULL = 120;

// Spinner icon
const RefreshIcon = ({ size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

/**
 * PullToRefresh - Touch-based pull-to-refresh gesture handler
 * 
 * @param {Object} props
 * @param {Function} props.onRefresh - Async function called when refresh is triggered
 * @param {number} props.threshold - Distance to pull before refresh triggers (default: 80px)
 * @param {boolean} props.disabled - Disable pull-to-refresh functionality
 * @param {ReactNode} props.children - Content that can be refreshed
 * @param {string} props.className - Additional CSS class for the container
 */
export default function PullToRefresh({
  onRefresh,
  threshold = DEFAULT_THRESHOLD,
  disabled = false,
  children,
  className = '',
}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const isPullingRef = useRef(false);

  // Check if we're at the top of scroll
  const isAtTop = useCallback(() => {
    const container = containerRef.current;
    if (!container) return false;
    
    // Check both the container and document scroll position
    const containerScrollTop = container.scrollTop;
    const documentScrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    
    return containerScrollTop <= 0 && documentScrollTop <= 0;
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (disabled || isRefreshing || !isAtTop()) return;
    
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = e.touches[0].clientY;
    isPullingRef.current = false;
  }, [disabled, isRefreshing, isAtTop]);

  const handleTouchMove = useCallback((e) => {
    if (disabled || isRefreshing) return;
    
    currentYRef.current = e.touches[0].clientY;
    const diff = currentYRef.current - startYRef.current;
    
    // Only activate if pulling down and at top
    if (diff > 0 && isAtTop()) {
      // Apply resistance curve for natural feel
      const distance = Math.min(diff * 0.5, MAX_PULL);
      
      if (!isPullingRef.current && distance > 5) {
        isPullingRef.current = true;
        setIsPulling(true);
      }
      
      if (isPullingRef.current) {
        e.preventDefault();
        setPullDistance(distance);
      }
    }
  }, [disabled, isRefreshing, isAtTop]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || !isPullingRef.current) return;
    
    isPullingRef.current = false;
    setIsPulling(false);
    
    if (pullDistance >= threshold && onRefresh) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Hold at threshold during refresh
      
      try {
        await onRefresh();
      } catch (err) {
        console.error('[PullToRefresh] Refresh error:', err);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [disabled, pullDistance, threshold, onRefresh]);

  // Add touch event listeners with passive: false for preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const options = { passive: false };
    
    container.addEventListener('touchstart', handleTouchStart, options);
    container.addEventListener('touchmove', handleTouchMove, options);
    container.addEventListener('touchend', handleTouchEnd, options);
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart, options);
      container.removeEventListener('touchmove', handleTouchMove, options);
      container.removeEventListener('touchend', handleTouchEnd, options);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calculate progress for visual feedback
  const progress = Math.min(pullDistance / threshold, 1);
  const readyToRefresh = progress >= 1;

  return (
    <div 
      ref={containerRef}
      className={`${styles.container} ${className}`}
    >
      {/* Pull indicator */}
      <div 
        className={`${styles.indicator} ${isRefreshing ? styles.refreshing : ''}`}
        style={{
          opacity: isPulling || isRefreshing ? 1 : 0,
          transform: `translateY(${pullDistance - 40}px)`,
        }}
      >
        <div 
          className={`${styles.spinner} ${readyToRefresh ? styles.ready : ''}`}
          style={{
            transform: `rotate(${progress * 360}deg)`,
          }}
        >
          <RefreshIcon size={20} />
        </div>
        <span className={styles.text}>
          {isRefreshing ? 'Refreshing...' : readyToRefresh ? 'Release to refresh' : 'Pull to refresh'}
        </span>
      </div>
      
      {/* Content with pull offset */}
      <div 
        className={styles.content}
        style={{
          transform: isPulling || isRefreshing ? `translateY(${pullDistance}px)` : 'none',
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
