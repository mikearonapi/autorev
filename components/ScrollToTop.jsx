'use client';

import { useEffect, useRef, useLayoutEffect } from 'react';

import { usePathname } from 'next/navigation';

// Use useLayoutEffect on client, useEffect for SSR safety
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Detect if running on Android
 */
const isAndroid = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
};

/**
 * Debug utility for scroll issues - can be called from browser console
 * Usage: window.__debugScroll()
 */
const debugScrollState = () => {
  if (typeof document === 'undefined') return null;
  
  const html = document.documentElement;
  const body = document.body;
  const computedBody = getComputedStyle(body);
  const computedHtml = getComputedStyle(html);
  
  const state = {
    // Device info
    isAndroid: isAndroid(),
    userAgent: navigator.userAgent,
    
    // Body inline styles (what's been set via JS)
    bodyInlineOverflow: body.style.overflow || '(not set)',
    bodyInlineOverscroll: body.style.overscrollBehavior || '(not set)',
    
    // Body computed styles (actual applied values)
    bodyComputedOverflow: computedBody.overflow,
    bodyComputedOverflowY: computedBody.overflowY,
    bodyComputedOverscrollY: computedBody.overscrollBehaviorY,
    bodyComputedHeight: computedBody.height,
    bodyComputedMinHeight: computedBody.minHeight,
    bodyComputedPosition: computedBody.position,
    
    // HTML computed styles
    htmlComputedOverflow: computedHtml.overflow,
    htmlComputedOverflowY: computedHtml.overflowY,
    
    // Scroll dimensions
    bodyScrollHeight: body.scrollHeight,
    bodyClientHeight: body.clientHeight,
    bodyScrollTop: body.scrollTop,
    windowScrollY: window.scrollY,
    windowInnerHeight: window.innerHeight,
    
    // Can we scroll?
    hasScrollableContent: body.scrollHeight > body.clientHeight,
    scrollBlocked: computedBody.overflow === 'hidden' || computedBody.overflowY === 'hidden',
  };
  
  console.log('[Scroll Debug]', state);
  return state;
};

/**
 * Force reset all scroll-blocking styles (emergency fix)
 * Usage: window.__forceResetScroll()
 */
const forceResetScroll = () => {
  if (typeof document === 'undefined') return;
  
  const body = document.body;
  const html = document.documentElement;
  
  // Reset body
  body.style.overflow = '';
  body.style.overflowY = '';
  body.style.overscrollBehavior = '';
  body.style.overscrollBehaviorY = '';
  body.style.position = '';
  body.style.height = '';
  body.style.top = '';
  
  // Reset html
  html.style.overflow = '';
  html.style.overflowY = '';
  
  console.log('[Scroll Debug] Force reset complete. Try scrolling now.');
  return debugScrollState();
};

// Expose debug utilities globally (only in browser)
if (typeof window !== 'undefined') {
  window.__debugScroll = debugScrollState;
  window.__forceResetScroll = forceResetScroll;
}

/**
 * ScrollToTop Component
 * 
 * Ensures the page scrolls to the top on every route change.
 * This fixes the issue where navigating between pages can load
 * in the middle of the page instead of at the top.
 * 
 * Also acts as a safety mechanism to unlock body scroll on route changes.
 * This catches cases where modals/overlays don't properly clean up their
 * overflow:hidden on body (especially important for Android Chrome).
 * 
 * Key improvements:
 * - Uses useLayoutEffect to run before paint
 * - Temporarily disables smooth scroll CSS to ensure instant scroll
 * - Uses requestAnimationFrame for proper timing
 * - Falls back to direct scrollTop manipulation if scrollTo fails
 * - Resets body overflow on every route change (Android scroll fix)
 * - More aggressive reset for Android devices
 * 
 * Note: We only track pathname changes, not search params.
 * Using useSearchParams here caused navigation errors during
 * route transitions due to Suspense boundary timing issues.
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const isFirstRender = useRef(true);

  // On mount, run debug log on Android to help diagnose issues
  useEffect(() => {
    if (isAndroid()) {
      console.log('[ScrollToTop] Android device detected, running initial scroll debug...');
      debugScrollState();
    }
  }, []);

  // Use layout effect for immediate execution before paint
  useIsomorphicLayoutEffect(() => {
    // Skip on first render (initial page load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousPathname.current = pathname;
      return;
    }

    // Only act if the pathname actually changed (not just a re-render)
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      
      // CRITICAL: Reset body scroll lock on every route change
      // This is a safety net for Android Chrome where modals/overlays
      // may not properly clean up overflow:hidden on unmount.
      // This MUST run synchronously before any RAF to prevent scroll jank.
      const body = document.body;
      const needsReset = body.style.overflow === 'hidden' || 
                         body.style.overflowY === 'hidden' ||
                         body.style.position === 'fixed';
      
      if (needsReset) {
        console.log('[ScrollToTop] Resetting body scroll lock (was blocked)');
        body.style.overflow = '';
        body.style.overflowY = '';
        body.style.position = '';
        body.style.top = '';
        body.style.width = '';
      }
      
      // On Android, be more aggressive about resetting scroll state
      if (isAndroid()) {
        // Also reset overscroll behavior which can cause issues on Android
        body.style.overscrollBehavior = '';
        body.style.overscrollBehaviorY = '';
        
        // Log debug info on route change for Android
        console.log('[ScrollToTop] Android route change to:', pathname);
        setTimeout(() => debugScrollState(), 100);
      }
      
      // Use requestAnimationFrame to ensure DOM is ready
      // and execute scroll before the next paint
      requestAnimationFrame(() => {
        try {
          // Temporarily disable smooth scroll to ensure instant scroll
          const html = document.documentElement;
          const originalScrollBehavior = html.style.scrollBehavior;
          html.style.scrollBehavior = 'auto';
          
          // Scroll to top using multiple methods for maximum compatibility
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
          html.scrollTop = 0;
          
          // Restore original scroll behavior after a microtask
          // This ensures the scroll completes before re-enabling smooth scroll
          requestAnimationFrame(() => {
            html.style.scrollBehavior = originalScrollBehavior;
          });
        } catch (err) {
          // Silently ignore scroll errors during navigation transitions
          console.warn('[ScrollToTop] Scroll failed:', err);
        }
      });
    }
  }, [pathname]);

  return null; // This component doesn't render anything
}

// Export debug utilities for use in other components
export { debugScrollState, forceResetScroll, isAndroid };







