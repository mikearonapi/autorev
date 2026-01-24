/**
 * Sentry Edge Configuration
 * 
 * This file configures the initialization of Sentry for edge features (middleware, edge routes).
 * The config you add here will be used whenever one of the edge features is loaded.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment tagging
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  // Edge functions are lightweight, sample more aggressively in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
