/**
 * Sentry Client Configuration
 * 
 * This file configures the initialization of Sentry on the client.
 * The config you add here will be used whenever a user loads a page in their browser.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment tagging
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  // Capture 10% of transactions for performance monitoring in production
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay
  // Sample 10% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Integrations
  integrations: [
    // Browser tracing for performance
    Sentry.browserTracingIntegration({
      // Enable Interaction to Next Paint tracking
      enableInp: true,
    }),
    // Session replay for debugging user issues
    Sentry.replayIntegration({
      // Mask all text for privacy
      maskAllText: true,
      // Block all media for privacy
      blockAllMedia: false,
      // Mask all inputs to prevent capturing sensitive data
      maskAllInputs: true,
    }),
  ],

  // Filter errors and apply fingerprinting for better grouping
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Ignore specific errors
    if (error && error.message) {
      // Ignore cancelled requests
      if (error.message.includes('AbortError') || error.message.includes('cancelled')) {
        return null;
      }
      // Ignore network errors from user connection issues
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return null;
      }
      // Ignore ResizeObserver errors (browser quirk)
      if (error.message.includes('ResizeObserver')) {
        return null;
      }

      // =====================
      // Error Fingerprinting
      // Group similar errors together for better noise reduction
      // =====================

      // Group database/Supabase errors together
      if (error.message.includes('database') || error.message.includes('supabase') || error.message.includes('PostgreSQL')) {
        event.fingerprint = ['database-error', '{{ default }}'];
      }

      // Group API errors by endpoint pattern
      if (event.request?.url?.includes('/api/')) {
        const apiPath = event.request.url.replace(/\/api\//, '').split('?')[0];
        event.fingerprint = ['api-error', apiPath, '{{ default }}'];
      }

      // Group auth errors together
      if (error.message.includes('auth') || error.message.includes('session') || error.message.includes('token')) {
        event.fingerprint = ['auth-error', '{{ default }}'];
      }

      // Group chunk loading errors (common in SPAs)
      if (error.message.includes('Loading chunk') || error.message.includes('ChunkLoadError')) {
        event.fingerprint = ['chunk-load-error'];
      }
    }

    return event;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
