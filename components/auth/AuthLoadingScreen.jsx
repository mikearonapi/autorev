'use client';

/**
 * Auth Loading Screen
 * 
 * Full-screen loading overlay shown after authentication
 * while user data is being loaded. Shows progress for each
 * data type being fetched.
 * 
 * @module components/auth/AuthLoadingScreen
 */

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import styles from './AuthLoadingScreen.module.css';

// Loading step configuration
const LOADING_STEPS = [
  { key: 'profile', label: 'Loading your profile', icon: '👤' },
  { key: 'favorites', label: 'Loading favorites', icon: '⭐' },
  { key: 'vehicles', label: 'Loading your garage', icon: '🚗' },
  { key: 'builds', label: 'Loading saved builds', icon: '🔧' },
];

// Minimum display time to prevent flash (ms)
const MIN_DISPLAY_TIME = 800;

/**
 * Check icon component
 */
function CheckIcon() {
  return (
    <svg 
      className={styles.checkIcon} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3"
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Spinner icon component
 */
function SpinnerIcon() {
  return (
    <div className={styles.spinner}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" opacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
    </div>
  );
}

/**
 * AuthLoadingScreen Component
 * 
 * @param {Object} props
 * @param {boolean} props.isVisible - Whether to show the loading screen
 * @param {Object} props.loadingStates - Object with loading states for each data type
 * @param {boolean} props.loadingStates.profile - Profile loading state
 * @param {boolean} props.loadingStates.favorites - Favorites loading state
 * @param {boolean} props.loadingStates.vehicles - Vehicles loading state
 * @param {boolean} props.loadingStates.builds - Builds loading state
 * @param {function} props.onComplete - Callback when all loading is complete
 * @param {string} props.userName - Optional user name to display
 */
export default function AuthLoadingScreen({ 
  isVisible, 
  loadingStates = {}, 
  onComplete,
  userName,
}) {
  const [shouldShow, setShouldShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [hasMetMinTime, setHasMetMinTime] = useState(false);
  const [showTime, setShowTime] = useState(null);

  // Calculate progress
  const { completedSteps, totalSteps, allComplete } = useMemo(() => {
    const total = LOADING_STEPS.length;
    let completed = 0;
    
    LOADING_STEPS.forEach(step => {
      // A step is complete when its loading state is false (not loading)
      // or if it's explicitly marked as loaded
      if (loadingStates[step.key] === false || loadingStates[`${step.key}Loaded`] === true) {
        completed++;
      }
    });
    
    return {
      completedSteps: completed,
      totalSteps: total,
      allComplete: completed >= total,
    };
  }, [loadingStates]);

  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  // Track when screen becomes visible
  useEffect(() => {
    if (isVisible && !shouldShow) {
      setShouldShow(true);
      setShowTime(Date.now());
      setHasMetMinTime(false);
      setIsExiting(false);
    }
  }, [isVisible, shouldShow]);

  // Minimum display time timer
  useEffect(() => {
    if (!showTime) return;
    
    const elapsed = Date.now() - showTime;
    const remaining = MIN_DISPLAY_TIME - elapsed;
    
    if (remaining <= 0) {
      setHasMetMinTime(true);
    } else {
      const timer = setTimeout(() => {
        setHasMetMinTime(true);
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [showTime]);

  // Handle completion
  useEffect(() => {
    if (allComplete && hasMetMinTime && shouldShow && !isExiting) {
      // Start exit animation
      setIsExiting(true);
      
      // Call onComplete after exit animation
      const timer = setTimeout(() => {
        setShouldShow(false);
        setIsExiting(false);
        setShowTime(null);
        onComplete?.();
      }, 400); // Match CSS transition duration
      
      return () => clearTimeout(timer);
    }
  }, [allComplete, hasMetMinTime, shouldShow, isExiting, onComplete]);

  // Don't render if not showing
  if (!shouldShow) return null;

  return (
    <div className={`${styles.overlay} ${isExiting ? styles.exiting : ''}`}>
      <div className={styles.container}>
        {/* Logo */}
        <div className={styles.logoWrapper}>
          <Image
            src="/images/autorev-icon.svg"
            alt="AutoRev"
            width={64}
            height={64}
            className={styles.logo}
            priority
          />
        </div>

        {/* Welcome message */}
        <h1 className={styles.title}>
          {userName ? `Welcome back, ${userName}!` : 'Welcome back!'}
        </h1>
        <p className={styles.subtitle}>Setting up your experience...</p>

        {/* Progress bar */}
        <div className={styles.progressBarContainer}>
          <div 
            className={styles.progressBar} 
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Loading steps */}
        <div className={styles.steps}>
          {LOADING_STEPS.map((step, index) => {
            const isLoading = loadingStates[step.key] === true;
            const isComplete = loadingStates[step.key] === false || loadingStates[`${step.key}Loaded`] === true;
            const isPending = !isLoading && !isComplete;
            
            return (
              <div 
                key={step.key}
                className={`${styles.step} ${isComplete ? styles.stepComplete : ''} ${isLoading ? styles.stepLoading : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={styles.stepIcon}>
                  {isComplete ? (
                    <CheckIcon />
                  ) : isLoading ? (
                    <SpinnerIcon />
                  ) : (
                    <span className={styles.stepEmoji}>{step.icon}</span>
                  )}
                </div>
                <span className={styles.stepLabel}>{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Progress percentage */}
        <div className={styles.progressText}>
          {progressPercent}% complete
        </div>
      </div>
    </div>
  );
}

