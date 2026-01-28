'use client';

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in child component tree, logs them,
 * and displays a fallback UI instead of crashing the entire app.
 * 
 * Integrates with Sentry for production error monitoring.
 * 
 * Usage:
 * <ErrorBoundary fallback={<CustomFallback />}>
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 */

import React, { Component } from 'react';

import * as Sentry from '@sentry/nextjs';

import { ErrorLogger } from '@/lib/errorLogger';

import styles from './ErrorBoundary.module.css';

// Fallback UI when no custom fallback provided
function DefaultFallback({ error, errorInfo, onRetry }) {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <div className={styles.errorIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2 className={styles.errorTitle}>Something went wrong</h2>
        <p className={styles.errorMessage}>
          We encountered an unexpected error. Please try refreshing the page.
        </p>
        {process.env.NODE_ENV === 'development' && error && (
          <details className={styles.errorDetails}>
            <summary>Error Details (Development Only)</summary>
            <pre className={styles.errorStack}>
              {error.toString()}
              {errorInfo?.componentStack}
            </pre>
          </details>
        )}
        <div className={styles.errorActions}>
          {onRetry && (
            <button className={styles.retryButton} onClick={onRetry}>
              Try Again
            </button>
          )}
          <button 
            className={styles.reloadButton} 
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact fallback for smaller sections
export function CompactFallback({ error: _error, onRetry }) {
  return (
    <div className={styles.compactError}>
      <span className={styles.compactIcon}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </span>
      <span className={styles.compactText}>Failed to load</span>
      {onRetry && (
        <button className={styles.compactRetry} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({ errorInfo });
    
    // Log to console in development
    console.error('[ErrorBoundary] Caught error:', {
      error: error?.message || error,
      componentStack: errorInfo?.componentStack,
      component: this.props.name || 'Unknown',
    });

    // Report to Sentry with component context
    Sentry.withScope((scope) => {
      scope.setTag('component', this.props.name || 'Unknown');
      scope.setTag('featureContext', this.props.featureContext || 'unknown');
      scope.setExtra('componentStack', errorInfo?.componentStack);
      Sentry.captureException(error);
    });

    // Call optional onError callback for additional logging
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-log to feedback system
    ErrorLogger.renderError(error, this.props.name || 'Unknown', {
      featureContext: this.props.featureContext,
      componentStack: errorInfo?.componentStack?.slice(0, 1000),
    });
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        // If fallback is a function, call it with error details
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({
            error: this.state.error,
            errorInfo: this.state.errorInfo,
            onRetry: this.handleRetry,
          });
        }
        // Otherwise render fallback element directly
        return this.props.fallback;
      }

      // Use default fallback
      return (
        <DefaultFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap any component with error boundary
 */
export function withErrorBoundary(WrappedComponent, fallback = null, name = '') {
  const displayName = name || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  function WithErrorBoundary(props) {
    return (
      <ErrorBoundary fallback={fallback} name={displayName}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  }
  
  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  return WithErrorBoundary;
}









