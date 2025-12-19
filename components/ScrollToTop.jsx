'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ScrollToTop Component
 * 
 * Ensures the page scrolls to the top on every route change.
 * This fixes the issue where navigating between pages can load
 * in the middle of the page instead of at the top.
 * 
 * Note: We only track pathname changes, not search params.
 * Using useSearchParams here caused navigation errors during
 * route transitions due to Suspense boundary timing issues.
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // Only scroll if the pathname actually changed (not just a re-render)
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      
      // Use try-catch to handle any edge cases during navigation
      try {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant', // Use 'instant' to avoid janky scroll animation on navigation
        });
      } catch (err) {
        // Silently ignore scroll errors during navigation transitions
        console.warn('[ScrollToTop] Scroll failed:', err);
      }
    }
  }, [pathname]);

  return null; // This component doesn't render anything
}







