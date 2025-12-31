'use client';

/**
 * PageViewTracker Component
 * 
 * Tracks page views for the internal analytics dashboard.
 * Lightweight client component that sends data to /api/analytics/track
 * 
 * Features:
 * - Generates unique session ID (persisted in sessionStorage)
 * - Tracks page URL, referrer, and performance timing
 * - Sends user ID if authenticated
 * - Debounces rapid navigation
 */

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

// Generate a unique session ID
function getSessionId() {
  if (typeof window === 'undefined') return null;
  
  let sessionId = sessionStorage.getItem('_ar_sid');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('_ar_sid', sessionId);
  }
  return sessionId;
}

// Convert pathname to route pattern
function getRoutePattern(pathname) {
  // Replace UUIDs with [id]
  let route = pathname.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '[id]'
  );
  
  // Replace numeric IDs with [id]
  route = route.replace(/\/\d+(?=\/|$)/g, '/[id]');
  
  // Replace car slugs (year-make-model patterns)
  route = route.replace(
    /\/\d{4}-[a-z0-9-]+-[a-z0-9-]+/gi,
    '/[slug]'
  );
  
  return route;
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const lastTrackedRef = useRef('');
  const timeoutRef = useRef(null);
  
  useEffect(() => {
    // Build full path with query params
    const fullPath = searchParams.toString() 
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    
    // Debounce rapid navigation (300ms)
    if (lastTrackedRef.current === fullPath) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      trackPageView(pathname, fullPath);
      lastTrackedRef.current = fullPath;
    }, 300);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, searchParams, user?.id]);
  
  const trackPageView = async (path, fullPath) => {
    try {
      const sessionId = getSessionId();
      if (!sessionId) return;
      
      // Get performance timing if available
      let pageLoadTime = null;
      if (typeof window !== 'undefined' && window.performance) {
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (navEntry) {
          pageLoadTime = Math.round(navEntry.loadEventEnd - navEntry.startTime);
        }
      }
      
      const payload = {
        path,
        route: getRoutePattern(path),
        referrer: document.referrer || null,
        sessionId,
        pageUrl: window.location.href,
        userId: user?.id || null,
        pageLoadTime: pageLoadTime > 0 ? pageLoadTime : null
      };
      
      // Use sendBeacon if available for reliability, fallback to fetch
      const url = '/api/analytics/track';
      const body = JSON.stringify(payload);
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, body);
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true
        }).catch(() => {
          // Silently fail - analytics should not break the app
        });
      }
    } catch {
      // Silently fail
    }
  };
  
  // This component doesn't render anything
  return null;
}

