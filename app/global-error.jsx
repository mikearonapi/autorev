'use client';

/**
 * Global Error Handler
 * 
 * This component catches errors that occur in the root layout.
 * It's a special error boundary that wraps the entire application.
 * 
 * NOTE: This component MUST define its own <html> and <body> tags
 * because it replaces the root layout when an error occurs.
 * 
 * https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Report the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        margin: 0,
        padding: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0d1b2a',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          maxWidth: '500px',
        }}>
          {/* Error Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#ef4444" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1 style={{
            color: '#ffffff',
            fontSize: '1.5rem',
            fontWeight: 600,
            margin: '0 0 0.75rem',
          }}>
            Something went wrong
          </h1>

          <p style={{
            color: '#94a3b8',
            fontSize: '1rem',
            lineHeight: 1.6,
            margin: '0 0 2rem',
          }}>
            We encountered an unexpected error. Our team has been notified and is working on a fix.
          </p>

          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => reset()}
              style={{
                backgroundColor: '#d4ff00',
                color: '#0d1b2a',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#bfe600'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#d4ff00'}
            >
              Try Again
            </button>

            <button
              onClick={() => window.location.href = '/'}
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onMouseOver={(e) => e.target.style.borderColor = '#475569'}
              onMouseOut={(e) => e.target.style.borderColor = '#334155'}
            >
              Go Home
            </button>
          </div>

          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && error && (
            <details style={{
              marginTop: '2rem',
              textAlign: 'left',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              padding: '1rem',
            }}>
              <summary style={{
                color: '#94a3b8',
                cursor: 'pointer',
                marginBottom: '0.5rem',
              }}>
                Error Details (Development)
              </summary>
              <pre style={{
                color: '#ef4444',
                fontSize: '0.75rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
              }}>
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </body>
    </html>
  );
}
