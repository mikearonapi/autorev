/**
 * Next.js Instrumentation
 * 
 * This file is used to instrument Next.js for monitoring and error tracking.
 * It runs once when the server starts or when a new worker is created.
 * 
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry initialization
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime Sentry initialization
    await import('./sentry.edge.config');
  }
}

/**
 * Capture request errors in App Router
 * This function is called when an error occurs during request handling
 */
export const onRequestError = Sentry.captureRequestError;
