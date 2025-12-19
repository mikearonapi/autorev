'use client';

import { ErrorLogger } from './errorLogger.js';

const DEFAULT_TIMEOUT_MS = 10_000;

function createTimeoutSignal(timeoutMs) {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }

  // Fallback for environments without AbortSignal.timeout
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function isClientErrorMessage(error) {
  // Matches "HTTP 4xx" strings we construct
  return typeof error?.message === 'string' && /^HTTP 4\d{2}/.test(error.message);
}

export async function fetchWithRetry(url, options = {}, maxRetries = 2) {
  let lastError;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: options.signal || createTimeoutSignal(options.timeout || DEFAULT_TIMEOUT_MS),
      });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);

        if (response.status >= 500) {
          // Server errors: retry, but log on final attempt
          if (attempt === maxRetries) {
            ErrorLogger.apiError(error, url, {
              status: response.status,
              method: options.method || 'GET',
              duration: Date.now() - startTime,
            });
          }
          throw error;
        } else {
          // 4xx: log and stop retrying
          ErrorLogger.apiError(error, url, {
            status: response.status,
            method: options.method || 'GET',
            duration: Date.now() - startTime,
            severity: 'minor',
          });
          throw error;
        }
      }

      return response;
    } catch (error) {
      lastError = error;

      const isTimeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';

      if (isTimeout && attempt === maxRetries) {
        ErrorLogger.networkTimeout(error, url, {
          method: options.method || 'GET',
          duration: Date.now() - startTime,
        });
      }

      // Do not retry on client errors
      if (isClientErrorMessage(error)) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt); // exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export default fetchWithRetry;

