'use client';

/**
 * PageViewTracker Component
 * 
 * Comprehensive analytics tracker that captures:
 * - Page views with full context
 * - Scroll depth tracking (25%, 50%, 75%, 90%, 100%)
 * - Time on page (total and engaged time)
 * - Click interactions
 * - Performance metrics
 * - Engagement scoring
 * 
 * All data is sent to /api/analytics/track and /api/analytics/engagement
 */

import { useEffect, useRef, useCallback } from 'react';
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

// Get or create visitor ID (persists across sessions)
function getVisitorId() {
  if (typeof window === 'undefined') return null;
  
  let visitorId = localStorage.getItem('_ar_vid');
  if (!visitorId) {
    visitorId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('_ar_vid', visitorId);
  }
  return visitorId;
}

// Convert pathname to route pattern
function getRoutePattern(pathname) {
  let route = pathname
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '[id]')
    .replace(/\/\d+(?=\/|$)/g, '/[id]')
    .replace(/\/\d{4}-[a-z0-9-]+-[a-z0-9-]+/gi, '/[slug]');
  
  return route;
}

// Parse UTM parameters from URL
function getUtmParams(searchParams) {
  return {
    utm_source: searchParams.get('utm_source'),
    utm_medium: searchParams.get('utm_medium'),
    utm_campaign: searchParams.get('utm_campaign'),
    utm_term: searchParams.get('utm_term'),
    utm_content: searchParams.get('utm_content')
  };
}

// Calculate scroll depth percentage
function getScrollDepth() {
  if (typeof window === 'undefined') return 0;
  
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollHeight = document.documentElement.scrollHeight;
  const clientHeight = document.documentElement.clientHeight;
  
  if (scrollHeight <= clientHeight) return 100;
  
  return Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
}

// Calculate engagement score (0-10)
function calculateEngagementScore(metrics) {
  let score = 0;
  
  // Time on page (max 3 points)
  if (metrics.timeOnPage > 180) score += 3;
  else if (metrics.timeOnPage > 60) score += 2;
  else if (metrics.timeOnPage > 15) score += 1;
  
  // Scroll depth (max 3 points)
  if (metrics.maxScrollDepth >= 90) score += 3;
  else if (metrics.maxScrollDepth >= 75) score += 2.5;
  else if (metrics.maxScrollDepth >= 50) score += 2;
  else if (metrics.maxScrollDepth >= 25) score += 1;
  
  // Interactions (max 2 points)
  const interactions = metrics.clickCount + metrics.copyCount;
  if (interactions >= 5) score += 2;
  else if (interactions >= 2) score += 1;
  else if (interactions >= 1) score += 0.5;
  
  // Engaged time ratio (max 2 points)
  if (metrics.timeOnPage > 0) {
    const engagedRatio = metrics.engagedTime / metrics.timeOnPage;
    if (engagedRatio > 0.7) score += 2;
    else if (engagedRatio > 0.5) score += 1.5;
    else if (engagedRatio > 0.3) score += 1;
  }
  
  return Math.min(10, Math.round(score * 10) / 10);
}

// Get engagement tier from score
function getEngagementTier(score, timeOnPage) {
  if (timeOnPage < 5) return 'bounced';
  if (score >= 7) return 'deep';
  if (score >= 4) return 'engaged';
  return 'light';
}

export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // Refs for tracking state
  const lastTrackedRef = useRef('');
  const pageViewIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const engagedTimeRef = useRef(0);
  const lastActivityRef = useRef(null);
  const isActiveRef = useRef(true);
  const maxScrollDepthRef = useRef(0);
  const scrollMilestonesRef = useRef(new Set());
  const clickCountRef = useRef(0);
  const copyCountRef = useRef(0);
  const formInteractionsRef = useRef(0);
  const intervalRef = useRef(null);
  
  // Reset engagement metrics for new page
  const resetMetrics = useCallback(() => {
    startTimeRef.current = Date.now();
    engagedTimeRef.current = 0;
    lastActivityRef.current = Date.now();
    isActiveRef.current = true;
    maxScrollDepthRef.current = 0;
    scrollMilestonesRef.current = new Set();
    clickCountRef.current = 0;
    copyCountRef.current = 0;
    formInteractionsRef.current = 0;
  }, []);
  
  // Send page view
  const trackPageView = useCallback(async (path) => {
    try {
      const sessionId = getSessionId();
      if (!sessionId) return;
      
      // Get performance timing
      let pageLoadTime = null;
      if (typeof window !== 'undefined' && window.performance) {
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (navEntry) {
          pageLoadTime = Math.round(navEntry.loadEventEnd - navEntry.startTime);
        }
      }
      
      const utmParams = getUtmParams(searchParams);
      
      const payload = {
        path,
        route: getRoutePattern(path),
        referrer: document.referrer || null,
        sessionId,
        visitorId: getVisitorId(),
        pageUrl: window.location.href,
        userId: user?.id || null,
        pageLoadTime: pageLoadTime > 0 ? pageLoadTime : null,
        ...utmParams
      };
      
      // Use fetch for page views (need response)
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const data = await response.json();
        pageViewIdRef.current = data.pageViewId;
      }
    } catch {
      // Silently fail
    }
  }, [searchParams, user?.id]);
  
  // Send engagement data
  const sendEngagement = useCallback(() => {
    try {
      const sessionId = getSessionId();
      if (!sessionId || !startTimeRef.current) return;
      
      const timeOnPage = Math.round((Date.now() - startTimeRef.current) / 1000);
      const engagedTime = Math.round(engagedTimeRef.current / 1000);
      
      const metrics = {
        timeOnPage,
        engagedTime,
        maxScrollDepth: maxScrollDepthRef.current,
        clickCount: clickCountRef.current,
        copyCount: copyCountRef.current,
        formInteractions: formInteractionsRef.current
      };
      
      const engagementScore = calculateEngagementScore(metrics);
      const engagementTier = getEngagementTier(engagementScore, timeOnPage);
      
      const payload = {
        pageViewId: pageViewIdRef.current,
        sessionId,
        path: pathname,
        timeOnPageSeconds: timeOnPage,
        engagedTimeSeconds: engagedTime,
        maxScrollDepthPercent: maxScrollDepthRef.current,
        scrollMilestones: Array.from(scrollMilestonesRef.current),
        clickCount: clickCountRef.current,
        copyCount: copyCountRef.current,
        formInteractions: formInteractionsRef.current,
        engagementScore,
        engagementTier
      };
      
      // Use sendBeacon for reliability on page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/engagement', JSON.stringify(payload));
      } else {
        fetch('/api/analytics/engagement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {});
      }
    } catch {
      // Silently fail
    }
  }, [pathname]);
  
  // Track scroll depth
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleScroll = () => {
      const depth = getScrollDepth();
      if (depth > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = depth;
        
        // Track milestone
        const milestones = [25, 50, 75, 90, 100];
        for (const milestone of milestones) {
          if (depth >= milestone && !scrollMilestonesRef.current.has(milestone)) {
            scrollMilestonesRef.current.add(milestone);
          }
        }
      }
      
      // Mark as active
      lastActivityRef.current = Date.now();
      isActiveRef.current = true;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);
  
  // Track clicks
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleTrackingClick = (e) => {
      clickCountRef.current++;
      lastActivityRef.current = Date.now();
      isActiveRef.current = true;
      
      // Track click for heatmap (throttled)
      const target = e.target;
      if (clickCountRef.current <= 50) { // Limit tracking
        const payload = {
          sessionId: getSessionId(),
          userId: user?.id,
          path: pathname,
          elementTag: target.tagName?.toLowerCase(),
          elementId: target.id || null,
          elementClass: target.className?.toString()?.substring(0, 100) || null,
          elementText: target.innerText?.substring(0, 50) || null,
          elementHref: target.href || null,
          xPercent: (e.clientX / window.innerWidth * 100).toFixed(2),
          yPercent: (e.clientY / window.innerHeight * 100).toFixed(2),
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight
        };
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/analytics/click', JSON.stringify(payload));
        }
      }
    };
    
    document.addEventListener('click', handleTrackingClick);
    return () => document.removeEventListener('click', handleTrackingClick);
  }, [pathname, user?.id]);
  
  // Track copy events
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleCopy = () => {
      copyCountRef.current++;
      lastActivityRef.current = Date.now();
      isActiveRef.current = true;
    };
    
    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, []);
  
  // Track form interactions
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleInput = () => {
      formInteractionsRef.current++;
      lastActivityRef.current = Date.now();
      isActiveRef.current = true;
    };
    
    document.addEventListener('input', handleInput);
    return () => document.removeEventListener('input', handleInput);
  }, []);
  
  // Track engaged time (user is actively interacting)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Update engaged time every second
    intervalRef.current = setInterval(() => {
      if (isActiveRef.current && lastActivityRef.current) {
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        
        // If no activity for 30 seconds, mark as inactive
        if (timeSinceActivity > 30000) {
          isActiveRef.current = false;
        } else {
          engagedTimeRef.current += 1000;
        }
      }
    }, 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Track visibility changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActiveRef.current = false;
      } else {
        lastActivityRef.current = Date.now();
        isActiveRef.current = true;
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  // Send engagement on page unload
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleBeforeUnload = () => {
      sendEngagement();
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sendEngagement]);
  
  // Main effect for page view tracking
  useEffect(() => {
    const fullPath = searchParams.toString() 
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    
    // Skip if same page
    if (lastTrackedRef.current === fullPath) return;
    
    // Send engagement for previous page
    if (lastTrackedRef.current) {
      sendEngagement();
    }
    
    // Reset metrics and track new page
    resetMetrics();
    
    // Debounce page view tracking
    const timeout = setTimeout(() => {
      trackPageView(pathname);
      lastTrackedRef.current = fullPath;
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [pathname, searchParams, trackPageView, sendEngagement, resetMetrics]);
  
  return null;
}
