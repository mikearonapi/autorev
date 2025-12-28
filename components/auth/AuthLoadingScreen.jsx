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

// AL Mascot SVG component
function ALMascotIcon({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#1a1a1a" stroke="#ef4444" strokeWidth="2"/>
      <circle cx="35" cy="40" r="8" fill="#ef4444"/>
      <circle cx="65" cy="40" r="8" fill="#ef4444"/>
      <circle cx="35" cy="40" r="3" fill="#fff"/>
      <circle cx="65" cy="40" r="3" fill="#fff"/>
      <path d="M30 60 Q50 75 70 60" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M20 25 L35 35" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
      <path d="M80 25 L65 35" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// Close icon component
function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

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
 * @param {Object} props.loadingStates - Object with completion states for each data type
 * @param {boolean} props.loadingStates.profile - Profile completed (true = done loading)
 * @param {boolean} props.loadingStates.favorites - Favorites completed
 * @param {boolean} props.loadingStates.vehicles - Vehicles completed
 * @param {boolean} props.loadingStates.builds - Builds completed
 * @param {function} props.onComplete - Callback when all loading is complete
 * @param {function} props.onDismiss - Callback when user dismisses the screen
 * @param {string} props.userName - Optional user name to display
 * @param {string} props.userAvatar - Optional user avatar URL
 */
export default function AuthLoadingScreen({ 
  isVisible, 
  loadingStates = {}, 
  onComplete,
  onDismiss,
  userName,
  userAvatar,
}) {
  const [shouldShow, setShouldShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [hasMetMinTime, setHasMetMinTime] = useState(false);
  const [showTime, setShowTime] = useState(null);

  // Calculate progress
  // loadingStates uses "completed" model: true = done, false/undefined = still loading
  const { completedSteps, totalSteps, allComplete } = useMemo(() => {
    const total = LOADING_STEPS.length;
    let completed = 0;
    
    LOADING_STEPS.forEach(step => {
      // A step is complete when its state is true (completed)
      if (loadingStates[step.key] === true) {
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

  // Handle dismiss
  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShouldShow(false);
      setIsExiting(false);
      setShowTime(null);
      onDismiss?.();
    }, 400);
  };

  return (
    <div className={`${styles.overlay} ${isExiting ? styles.exiting : ''}`}>
      {/* Close button */}
      <button 
        className={styles.closeButton} 
        onClick={handleDismiss}
        aria-label="Close loading screen"
      >
        <CloseIcon />
      </button>

      <div className={styles.container}>
        {/* User avatar or AL mascot */}
        <div className={styles.avatarWrapper}>
          {userAvatar ? (
            <Image
              src={userAvatar}
              alt={userName || 'User'}
              width={80}
              height={80}
              className={styles.avatar}
              priority
            />
          ) : (
            <ALMascotIcon size={80} />
          )}
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
            // true = completed, false/undefined = still loading
            const isComplete = loadingStates[step.key] === true;
            const isLoading = !isComplete;
            
            return (
              <div 
                key={step.key}
                className={`${styles.step} ${isComplete ? styles.stepComplete : ''} ${isLoading ? styles.stepLoading : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={styles.stepIcon}>
                  {isComplete ? (
                    <CheckIcon />
                  ) : (
                    <SpinnerIcon />
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

