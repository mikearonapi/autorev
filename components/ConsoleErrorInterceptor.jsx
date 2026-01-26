'use client';

/**
 * ConsoleErrorInterceptor
 * 
 * Patches console.error to automatically log errors to our feedback system.
 * This catches the common pattern where errors are "handled" with just console.error.
 * 
 * Pattern it catches:
 *   catch (err) {
 *     console.error('Something failed:', err);  // <-- Now logged to feedback
 *   }
 */

import { useEffect } from 'react';

import { logError } from '@/lib/errorLogger';

let isPatched = false;
let originalConsoleError = null;

// Patterns to skip (internal/noisy logs)
const SKIP_PATTERNS = [
  /^\[Fast Refresh\]/,
  /^\[HMR\]/,
  /^Warning:/,
  /^%c/,  // Styled console logs
  /Download the React DevTools/,
  /validateDOMNesting/,
  /ReactDOM.render is no longer supported/,
  /\[ErrorLogger\]/,  // Our own logs
  /\[ServerErrorLogger\]/,
  /\[ConsoleErrorInterceptor\]/,
];

// Throttle to avoid spam
const recentConsoleErrors = new Map();
const CONSOLE_DEDUPE_MS = 30_000; // 30 seconds

function shouldSkip(args) {
  const firstArg = args[0];
  if (typeof firstArg !== 'string') return false;
  
  return SKIP_PATTERNS.some(pattern => pattern.test(firstArg));
}

function getConsoleErrorHash(args) {
  const str = args.map(a => {
    if (a instanceof Error) return a.message;
    if (typeof a === 'object') return JSON.stringify(a).slice(0, 200);
    return String(a);
  }).join('|').slice(0, 500);
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
}

function isDuplicateConsoleError(hash) {
  const now = Date.now();
  
  // Clean old entries
  for (const [h, time] of recentConsoleErrors) {
    if (now - time > CONSOLE_DEDUPE_MS) {
      recentConsoleErrors.delete(h);
    }
  }
  
  if (recentConsoleErrors.has(hash)) {
    return true;
  }
  recentConsoleErrors.set(hash, now);
  return false;
}

function patchConsoleError() {
  if (isPatched || typeof window === 'undefined') return;
  
  originalConsoleError = console.error;
  isPatched = true;
  
  console.error = function patchedConsoleError(...args) {
    // Always call original first
    originalConsoleError.apply(console, args);
    
    // Skip in development (too noisy)
    if (process.env.NODE_ENV !== 'production') return;
    
    // Skip known noise patterns
    if (shouldSkip(args)) return;
    
    // Deduplicate
    const hash = getConsoleErrorHash(args);
    if (isDuplicateConsoleError(hash)) return;
    
    // Extract error info
    let errorObj = null;
    let message = '';
    
    for (const arg of args) {
      if (arg instanceof Error) {
        errorObj = arg;
        break;
      }
    }
    
    if (!errorObj) {
      // Create synthetic error from console.error arguments
      message = args.map(a => {
        if (typeof a === 'object') {
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        }
        return String(a);
      }).join(' ');
      
      errorObj = new Error(message.slice(0, 500));
    }
    
    // Log to our system (safely - don't crash if logger fails)
    try {
      logError(errorObj, {
        errorType: 'console_error',
        consoleArgs: args.slice(0, 3).map(a => {
          if (a instanceof Error) return a.message;
          if (typeof a === 'string') return a.slice(0, 200);
          return typeof a;
        }),
        severity: 'minor', // Console errors are usually handled, so minor
        componentName: 'ConsoleErrorInterceptor',
      });
    } catch (logErr) {
      // Silently ignore - don't let logging break the app
      if (originalConsoleError) {
        originalConsoleError.call(console, '[ConsoleErrorInterceptor] Failed to log:', logErr);
      }
    }
  };
}

function unpatchConsoleError() {
  if (!isPatched || typeof window === 'undefined' || !originalConsoleError) return;
  console.error = originalConsoleError;
  isPatched = false;
  originalConsoleError = null;
}

/**
 * Component that patches console.error on mount
 * Add this at the app root level
 */
export function ConsoleErrorInterceptor({ children }) {
  useEffect(() => {
    patchConsoleError();
    
    return () => {
      // Don't unpatch - component shouldn't unmount at root
    };
  }, []);
  
  return children;
}

export { patchConsoleError, unpatchConsoleError };
export default ConsoleErrorInterceptor;
