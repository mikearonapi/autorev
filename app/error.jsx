'use client';

/**
 * Error Page
 * 
 * This component catches errors that occur in route segments.
 * It displays a user-friendly error message and recovery options.
 * 
 * https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */

import { useEffect } from 'react';

import * as Sentry from '@sentry/nextjs';

import styles from './error.module.css';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Report the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        {/* Error Icon */}
        <div className={styles.errorIcon}>
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className={styles.errorTitle}>Something went wrong</h1>
        
        <p className={styles.errorMessage}>
          We encountered an unexpected error. Please try again or return to the homepage.
        </p>

        {/* Show error details in development */}
        {process.env.NODE_ENV === 'development' && error && (
          <details className={styles.errorDetails}>
            <summary>Error Details (Development Only)</summary>
            <pre className={styles.errorStack}>
              {error.message}
              {'\n\n'}
              {error.stack}
            </pre>
          </details>
        )}

        <div className={styles.errorActions}>
          <button 
            className={styles.retryButton} 
            onClick={() => reset()}
          >
            Try Again
          </button>
          <a href="/" className={styles.homeButton}>
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
