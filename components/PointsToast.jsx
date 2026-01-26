'use client';

/**
 * PointsToast - Animated notification when users earn points
 * 
 * Shows briefly with the points earned and optional action label.
 * Uses a fun "pop-up and float" animation to feel rewarding.
 */

import { useState, useEffect } from 'react';
import styles from './PointsToast.module.css';

export default function PointsToast({ 
  points, 
  label = null,
  onDismiss,
  duration = 2500 
}) {
  // Start visible immediately - no delay for instant feedback
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Auto-dismiss after duration
    const hideTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onDismiss?.();
      }, 400); // Match exit animation duration
    }, duration);

    return () => {
      clearTimeout(hideTimer);
    };
  }, [duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss?.();
    }, 400);
  };

  return (
    <div 
      className={`${styles.toast} ${isVisible ? styles.visible : ''} ${isExiting ? styles.exiting : ''}`}
      onClick={handleDismiss}
      role="status"
      aria-live="polite"
    >
      <div className={styles.content}>
        <span className={styles.pointsValue}>+{points}</span>
        <span className={styles.pointsLabel}>points</span>
      </div>
      {label && <span className={styles.actionLabel}>{label}</span>}
      
      {/* Sparkle effects */}
      <div className={styles.sparkles} aria-hidden="true">
        <span className={styles.sparkle} style={{ '--delay': '0s', '--x': '-12px', '--y': '-8px' }} />
        <span className={styles.sparkle} style={{ '--delay': '0.1s', '--x': '14px', '--y': '-6px' }} />
        <span className={styles.sparkle} style={{ '--delay': '0.2s', '--x': '-8px', '--y': '10px' }} />
        <span className={styles.sparkle} style={{ '--delay': '0.15s', '--x': '10px', '--y': '8px' }} />
      </div>
    </div>
  );
}
