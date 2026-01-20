'use client';

/**
 * Auth Loading Screen
 * 
 * Full-screen loading overlay shown after authentication
 * while user data is being loaded. Shows progress for each
 * data type being fetched.
 * 
 * Features:
 * - Shows loading status per step (pending, loading, completed, failed, timeout)
 * - Retry button for failed/timed out steps
 * - Animated progress indicators
 * - Auto-dismiss when ALL steps reach a terminal state (completed/failed/timeout)
 * - User can dismiss manually at any time via close button
 * 
 * Note: Step timeouts are enforced by LoadingProgressProvider's global watchdog,
 * not by this component. This ensures deterministic completion.
 * 
 * @module components/auth/AuthLoadingScreen
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
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

// Status types (matching LoadingProgressProvider)
const StepStatus = {
  PENDING: 'pending',
  LOADING: 'loading',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
};

// Friendly Robot/Wrench Icon for loading - Brand teal color
function LoadingIcon({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Gear/cog background */}
      <circle cx="50" cy="50" r="40" fill="#1a1a1a" stroke="#10b981" strokeWidth="2"/>
      {/* Wrench icon */}
      <path 
        d="M35 65 L45 55 L55 55 L65 65 L60 70 L55 65 L45 65 L40 70 Z" 
        fill="#10b981" 
        opacity="0.3"
      />
      {/* Car silhouette */}
      <path 
        d="M30 50 L35 40 L65 40 L70 50 L75 50 L75 60 L70 60 L70 55 L30 55 L30 60 L25 60 L25 50 Z" 
        fill="#10b981"
      />
      {/* Wheels */}
      <circle cx="38" cy="55" r="5" fill="#1a1a1a" stroke="#10b981" strokeWidth="2"/>
      <circle cx="62" cy="55" r="5" fill="#1a1a1a" stroke="#10b981" strokeWidth="2"/>
      {/* Shine effect */}
      <path d="M40 45 L60 45" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
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
 * Error icon component
 */
function ErrorIcon() {
  return (
    <svg 
      className={styles.errorIcon} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

/**
 * Retry icon component
 */
function RetryIcon() {
  return (
    <svg 
      className={styles.retryIcon} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

/**
 * Helper to get status from step state
 * Handles both new object format and legacy boolean format
 */
function getStepStatus(stepState) {
  if (stepState === true) return StepStatus.COMPLETED;
  if (stepState === false || stepState === undefined) return StepStatus.PENDING;
  return stepState?.status || StepStatus.PENDING;
}

/**
 * Helper to check if step is done (completed, failed, or timeout)
 */
function isStepDone(stepState) {
  const status = getStepStatus(stepState);
  return status === StepStatus.COMPLETED || 
         status === StepStatus.FAILED || 
         status === StepStatus.TIMEOUT;
}

/**
 * Helper to check if step completed successfully
 */
function isStepCompleted(stepState) {
  return getStepStatus(stepState) === StepStatus.COMPLETED;
}

/**
 * AuthLoadingScreen Component
 * 
 * @param {Object} props
 * @param {boolean} props.isVisible - Whether to show the loading screen
 * @param {Object} props.loadingStates - Object with status states for each data type
 * @param {function} props.onComplete - Callback when all loading is complete
 * @param {function} props.onDismiss - Callback when user dismisses the screen
 * @param {function} props.onRetry - Optional callback to retry a specific step
 * @param {string} props.userName - Optional user name to display
 * @param {string} props.userAvatar - Optional user avatar URL
 */
export default function AuthLoadingScreen({ 
  isVisible, 
  loadingStates = {}, 
  onComplete,
  onDismiss,
  onRetry,
  userName,
  userAvatar,
}) {
  const [shouldShow, setShouldShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [hasMetMinTime, setHasMetMinTime] = useState(false);
  const [showTime, setShowTime] = useState(null);

  // Calculate progress with new status model
  const { completedSteps, totalSteps, failedSteps, allDone, allCompleted, currentStep } = useMemo(() => {
    const total = LOADING_STEPS.length;
    let completed = 0;
    let failed = 0;
    let current = null;
    
    LOADING_STEPS.forEach(step => {
      const status = getStepStatus(loadingStates[step.key]);
      if (status === StepStatus.COMPLETED) {
        completed++;
      } else if (status === StepStatus.FAILED || status === StepStatus.TIMEOUT) {
        failed++;
      } else if (status === StepStatus.LOADING && !current) {
        current = step.key;
      }
    });
    
    // All done = every step is either completed, failed, or timed out
    const done = LOADING_STEPS.every(step => isStepDone(loadingStates[step.key]));
    // All completed = every step is successfully completed
    const allSuccess = LOADING_STEPS.every(step => isStepCompleted(loadingStates[step.key]));
    
    return {
      completedSteps: completed,
      totalSteps: total,
      failedSteps: failed,
      allDone: done,
      allCompleted: allSuccess,
      currentStep: current,
    };
  }, [loadingStates]);

  const progressPercent = Math.round((completedSteps / totalSteps) * 100);

  // Handle retry for a specific step
  const handleRetry = useCallback((stepKey) => {
    onRetry?.(stepKey);
  }, [onRetry]);

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

  // Handle completion when all steps are done (completed, failed, or timeout)
  // The global watchdog in LoadingProgressProvider ensures every step reaches
  // a terminal state, so we can safely wait for allDone without a separate
  // max-time auto-dismiss here.
  useEffect(() => {
    if (allDone && hasMetMinTime && shouldShow && !isExiting) {
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
  }, [allDone, hasMetMinTime, shouldShow, isExiting, onComplete]);

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
            <LoadingIcon size={80} />
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
            const status = getStepStatus(loadingStates[step.key]);
            const error = loadingStates[step.key]?.error;
            const isFailed = status === StepStatus.FAILED || status === StepStatus.TIMEOUT;
            const isComplete = status === StepStatus.COMPLETED;
            const isLoading = status === StepStatus.LOADING;
            const isPending = status === StepStatus.PENDING;
            
            return (
              <div 
                key={step.key}
                className={`${styles.step} ${isComplete ? styles.stepComplete : ''} ${isLoading ? styles.stepLoading : ''} ${isFailed ? styles.stepFailed : ''} ${isPending ? styles.stepPending : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={styles.stepIcon}>
                  {isComplete && <CheckIcon />}
                  {isLoading && <SpinnerIcon />}
                  {isFailed && <ErrorIcon />}
                  {isPending && <div className={styles.pendingDot} />}
                </div>
                <div className={styles.stepContent}>
                  <span className={styles.stepLabel}>{step.label}</span>
                  {isFailed && error && (
                    <span className={styles.stepError}>{error}</span>
                  )}
                </div>
                {isFailed && onRetry && (
                  <button
                    className={styles.retryButton}
                    onClick={() => handleRetry(step.key)}
                    aria-label={`Retry ${step.label}`}
                  >
                    <RetryIcon />
                    <span>Retry</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Status message */}
        <div className={styles.progressText}>
          {failedSteps > 0 ? (
            <span className={styles.failedText}>
              {failedSteps} {failedSteps === 1 ? 'step' : 'steps'} failed · {progressPercent}% complete
            </span>
          ) : currentStep ? (
            <span>Loading... {progressPercent}% complete</span>
          ) : allCompleted ? (
            <span className={styles.successText}>All done!</span>
          ) : (
            <span>{progressPercent}% complete</span>
          )}
        </div>
      </div>
    </div>
  );
}

