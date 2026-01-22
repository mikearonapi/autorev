'use client';

/**
 * SplashScreen - Full-screen branded loading screen shown after login
 * 
 * Displays the AUTOREV logo centered on a navy background for ~1.5 seconds.
 * Acts as a loading buffer to let content prefetch in the background,
 * resulting in a snappier experience when the dashboard appears.
 * 
 * Features:
 * - Full-screen coverage including safe areas (notch, home indicator)
 * - Smooth fade-out animation
 * - Blocks interaction during display
 */

import { useState, useEffect } from 'react';
import styles from './SplashScreen.module.css';

export default function SplashScreen({ 
  duration = 1500, // How long to show before fading out (ms)
  onComplete,      // Callback when splash is fully hidden
}) {
  const [isExiting, setIsExiting] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    console.log('[SplashScreen] 🎬 React splash mounted - showing for', duration, 'ms');
    
    // Start exit animation after duration
    const exitTimer = setTimeout(() => {
      console.log('[SplashScreen] Starting fade out');
      setIsExiting(true);
    }, duration);

    // Fully hide after fade-out completes (500ms animation)
    const hideTimer = setTimeout(() => {
      console.log('[SplashScreen] Fade complete, hiding');
      setIsHidden(true);
      onComplete?.();
    }, duration + 500);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onComplete]);

  // Don't render anything once fully hidden
  if (isHidden) return null;

  return (
    <div 
      className={`${styles.splash} ${isExiting ? styles.exiting : ''}`}
      aria-hidden="true"
      data-testid="splash-screen"
    >
      <div className={styles.logoContainer}>
        <h1 className={styles.logo}>
          <span className={styles.auto}>AUTO</span>
          <span className={styles.rev}>REV</span>
        </h1>
      </div>
    </div>
  );
}
