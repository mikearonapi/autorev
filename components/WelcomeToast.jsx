'use client';

/**
 * WelcomeToast - A brief, elegant welcome notification after login
 * 
 * Shows for ~3 seconds with the user's name and optional news/updates.
 * Dismisses automatically or on click.
 */

import { useState, useEffect } from 'react';

import styles from './WelcomeToast.module.css';

export default function WelcomeToast({ 
  userName, 
  message = null, // Optional message like "2 new cars added!" 
  onDismiss,
  duration = 3000 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Auto-dismiss after duration
    const hideTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onDismiss?.();
      }, 300); // Match exit animation duration
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  };

  // Get first name only
  const firstName = userName?.split(' ')[0] || userName || 'there';

  return (
    <div 
      className={`${styles.toast} ${isVisible ? styles.visible : ''} ${isExiting ? styles.exiting : ''}`}
      onClick={handleDismiss}
      role="status"
      aria-live="polite"
    >
      <div className={styles.content}>
        <span className={styles.wave}>👋</span>
        <div className={styles.text}>
          <span className={styles.greeting}>Welcome back, {firstName}!</span>
          {message && <span className={styles.message}>{message}</span>}
        </div>
      </div>
      <button className={styles.dismiss} onClick={handleDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}

