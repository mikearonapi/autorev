/**
 * Sentry Server Configuration
 * 
 * This file configures the initialization of Sentry on the server.
 * The config you add here will be used whenever the server handles a request.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment tagging
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  // Capture 10% of transactions for performance monitoring in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enable profiling for performance insights
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Filter errors and apply fingerprinting for better grouping
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Ignore specific server-side errors
    if (error && error.message) {
      // Ignore ECONNREFUSED (external service unavailable)
      if (error.message.includes('ECONNREFUSED')) {
        return null;
      }
      // Ignore timeout errors from external APIs
      if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
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

      // Group API errors by route handler
      if (event.transaction?.includes('/api/')) {
        const apiPath = event.transaction.replace(/\/api\//, '').split('?')[0];
        event.fingerprint = ['api-error', apiPath, '{{ default }}'];
      }

      // Group auth errors together
      if (error.message.includes('auth') || error.message.includes('session') || error.message.includes('JWT')) {
        event.fingerprint = ['auth-error', '{{ default }}'];
      }

      // Group external service errors
      if (error.message.includes('OpenAI') || error.message.includes('Anthropic') || error.message.includes('Stripe')) {
        event.fingerprint = ['external-service-error', '{{ default }}'];
      }
    }

    return event;
  },

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
