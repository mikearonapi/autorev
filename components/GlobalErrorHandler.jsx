'use client';

import { useEffect } from 'react';
import { logError } from '@/lib/errorLogger';

// Debounce resource errors to avoid flooding on pages with many broken assets
const resourceErrorCache = new Map();
const RESOURCE_ERROR_DEDUPE_MS = 60_000; // 1 minute

function shouldLogResourceError(src) {
  if (!src) return false;
  const now = Date.now();
  const lastLogged = resourceErrorCache.get(src);
  if (lastLogged && (now - lastLogged) < RESOURCE_ERROR_DEDUPE_MS) {
    return false;
  }
  resourceErrorCache.set(src, now);
  // Clean old entries
  if (resourceErrorCache.size > 100) {
    for (const [key, time] of resourceErrorCache) {
      if (now - time > RESOURCE_ERROR_DEDUPE_MS) {
        resourceErrorCache.delete(key);
      }
    }
  }
  return true;
}

export function GlobalErrorHandler({ children }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      logError(event?.reason || new Error('Unhandled Promise Rejection'), {
        errorType: 'unhandled_exception',
        severity: 'major',
      });
    };

    // Handle JavaScript errors
    const handleError = (event) => {
      // Check if this is a resource loading error (script, img, link, etc.)
      const target = event?.target;
      if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
        const src = target.src || target.href || 'unknown';
        
        // Only log first-party resource errors (skip external CDNs we don't control)
        const isFirstParty = src.includes(window.location.origin) || 
                             src.startsWith('/') ||
                             src.includes('autorev.app');
        
        if (isFirstParty && shouldLogResourceError(src)) {
          logError(new Error(`Failed to load ${target.tagName.toLowerCase()}: ${src}`), {
            errorType: 'resource_load_error',
            resourceType: target.tagName.toLowerCase(),
            resourceSrc: src.slice(0, 500),
            severity: target.tagName === 'SCRIPT' ? 'major' : 'minor',
          });
        }
        return; // Don't log as generic error
      }
      
      // Regular JavaScript error
      logError(event?.error || new Error(event?.message || 'Unhandled Error'), {
        errorType: 'unhandled_exception',
        severity: 'blocking',
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError, true); // capture phase for resource errors

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError, true);
    };
  }, []);

  return children;
}

export default GlobalErrorHandler;








