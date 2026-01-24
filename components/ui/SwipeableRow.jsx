'use client';

/**
 * SwipeableRow Component
 * 
 * Provides swipe-to-reveal actions for list items on mobile.
 * Supports left and right swipe actions with snap-back behavior.
 * 
 * @example
 * <SwipeableRow
 *   rightActions={[
 *     { icon: <TrashIcon />, label: 'Delete', onClick: handleDelete, variant: 'danger' }
 *   ]}
 * >
 *   <YourListItemContent />
 * </SwipeableRow>
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import styles from './SwipeableRow.module.css';

// Default threshold to reveal actions (pixels)
const DEFAULT_THRESHOLD = 80;

// Maximum swipe distance
const MAX_SWIPE = 160;

// Velocity threshold for quick swipe gesture (pixels/ms)
const VELOCITY_THRESHOLD = 0.3;

/**
 * SwipeableRow - Touch-based swipe-to-reveal actions
 * 
 * @param {Object} props
 * @param {Array} props.leftActions - Actions revealed when swiping right
 * @param {Array} props.rightActions - Actions revealed when swiping left  
 * @param {number} props.threshold - Distance to swipe before actions are revealed (default: 80px)
 * @param {boolean} props.disabled - Disable swipe functionality
 * @param {ReactNode} props.children - Row content
 * @param {string} props.className - Additional CSS class
 * 
 * Action object shape:
 * {
 *   icon: ReactNode,
 *   label: string,
 *   onClick: () => void,
 *   variant: 'default' | 'danger' | 'success' | 'primary'
 * }
 */
export default function SwipeableRow({
  leftActions = [],
  rightActions = [],
  threshold = DEFAULT_THRESHOLD,
  disabled = false,
  children,
  className = '',
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isOpen, setIsOpen] = useState(null); // 'left' | 'right' | null
  const [isSwiping, setIsSwiping] = useState(false);
  
  const rowRef = useRef(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startOffsetRef = useRef(0);
  const startTimeRef = useRef(0);
  const isHorizontalRef = useRef(null);

  // Calculate action widths
  const leftWidth = leftActions.length * threshold;
  const rightWidth = rightActions.length * threshold;

  const handleTouchStart = useCallback((e) => {
    if (disabled) return;
    
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    startOffsetRef.current = swipeOffset;
    startTimeRef.current = Date.now();
    isHorizontalRef.current = null;
    setIsSwiping(false);
  }, [disabled, swipeOffset]);

  const handleTouchMove = useCallback((e) => {
    if (disabled) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startXRef.current;
    const diffY = currentY - startYRef.current;
    
    // Determine swipe direction on first significant movement
    if (isHorizontalRef.current === null && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
      isHorizontalRef.current = Math.abs(diffX) > Math.abs(diffY);
    }
    
    // Only handle horizontal swipes
    if (!isHorizontalRef.current) return;
    
    e.preventDefault();
    setIsSwiping(true);
    
    let newOffset = startOffsetRef.current + diffX;
    
    // Apply constraints
    // Swiping right (positive offset) reveals left actions
    // Swiping left (negative offset) reveals right actions
    if (leftActions.length === 0 && newOffset > 0) {
      newOffset = newOffset * 0.2; // Resistance when no left actions
    } else if (rightActions.length === 0 && newOffset < 0) {
      newOffset = newOffset * 0.2; // Resistance when no right actions
    }
    
    // Limit to max swipe distance
    newOffset = Math.max(-Math.min(rightWidth, MAX_SWIPE), Math.min(leftWidth, MAX_SWIPE, newOffset));
    
    setSwipeOffset(newOffset);
  }, [disabled, leftActions.length, rightActions.length, leftWidth, rightWidth]);

  const handleTouchEnd = useCallback(() => {
    if (disabled || !isSwiping) return;
    
    setIsSwiping(false);
    isHorizontalRef.current = null;
    
    const endTime = Date.now();
    const velocity = Math.abs(swipeOffset - startOffsetRef.current) / (endTime - startTimeRef.current);
    const isQuickSwipe = velocity > VELOCITY_THRESHOLD;
    
    // Determine final position
    if (swipeOffset > 0) {
      // Swiping right - check if should open left actions
      if ((swipeOffset > threshold || isQuickSwipe) && leftActions.length > 0) {
        setSwipeOffset(leftWidth);
        setIsOpen('left');
      } else {
        setSwipeOffset(0);
        setIsOpen(null);
      }
    } else if (swipeOffset < 0) {
      // Swiping left - check if should open right actions
      if ((Math.abs(swipeOffset) > threshold || isQuickSwipe) && rightActions.length > 0) {
        setSwipeOffset(-rightWidth);
        setIsOpen('right');
      } else {
        setSwipeOffset(0);
        setIsOpen(null);
      }
    }
  }, [disabled, isSwiping, swipeOffset, threshold, leftActions.length, rightActions.length, leftWidth, rightWidth]);

  // Close on click outside
  const handleClickOutside = useCallback((e) => {
    if (isOpen && rowRef.current && !rowRef.current.contains(e.target)) {
      setSwipeOffset(0);
      setIsOpen(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('touchstart', handleClickOutside);
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isOpen, handleClickOutside]);

  // Handle action click - close after action
  const handleActionClick = useCallback((action) => {
    action.onClick?.();
    setSwipeOffset(0);
    setIsOpen(null);
  }, []);

  // Close row programmatically
  const close = useCallback(() => {
    setSwipeOffset(0);
    setIsOpen(null);
  }, []);

  // No actions - just render children
  if (leftActions.length === 0 && rightActions.length === 0) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      ref={rowRef}
      className={`${styles.container} ${className}`}
    >
      {/* Left actions (revealed when swiping right) */}
      {leftActions.length > 0 && (
        <div className={styles.actionsLeft}>
          {leftActions.map((action, index) => (
            <button
              key={index}
              className={`${styles.action} ${styles[action.variant || 'default']}`}
              onClick={() => handleActionClick(action)}
              style={{ width: threshold }}
            >
              {action.icon && <span className={styles.actionIcon}>{action.icon}</span>}
              {action.label && <span className={styles.actionLabel}>{action.label}</span>}
            </button>
          ))}
        </div>
      )}
      
      {/* Right actions (revealed when swiping left) */}
      {rightActions.length > 0 && (
        <div className={styles.actionsRight}>
          {rightActions.map((action, index) => (
            <button
              key={index}
              className={`${styles.action} ${styles[action.variant || 'default']}`}
              onClick={() => handleActionClick(action)}
              style={{ width: threshold }}
            >
              {action.icon && <span className={styles.actionIcon}>{action.icon}</span>}
              {action.label && <span className={styles.actionLabel}>{action.label}</span>}
            </button>
          ))}
        </div>
      )}
      
      {/* Main content */}
      <div 
        className={styles.content}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}

// Export a hook for programmatic control
export function useSwipeableRow() {
  const closeRef = useRef(null);
  
  return {
    setCloseHandler: (handler) => { closeRef.current = handler; },
    close: () => closeRef.current?.(),
  };
}
