'use client';

import { useEffect, useRef, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

// Use useLayoutEffect on client, useEffect for SSR safety
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * ScrollToTop Component
 * 
 * Ensures the page scrolls to the top on every route change.
 * This fixes the issue where navigating between pages can load
 * in the middle of the page instead of at the top.
 * 
 * Key improvements:
 * - Uses useLayoutEffect to run before paint
 * - Temporarily disables smooth scroll CSS to ensure instant scroll
 * - Uses requestAnimationFrame for proper timing
 * - Falls back to direct scrollTop manipulation if scrollTo fails
 * 
 * Note: We only track pathname changes, not search params.
 * Using useSearchParams here caused navigation errors during
 * route transitions due to Suspense boundary timing issues.
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const isFirstRender = useRef(true);

  // Use layout effect for immediate execution before paint
  useIsomorphicLayoutEffect(() => {
    // Skip on first render (initial page load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousPathname.current = pathname;
      return;
    }

    // Only scroll if the pathname actually changed (not just a re-render)
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      
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







