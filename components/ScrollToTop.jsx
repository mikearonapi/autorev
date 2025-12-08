'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * ScrollToTop Component
 * 
 * Ensures the page scrolls to the top on every route change.
 * This fixes the issue where navigating between pages can load
 * in the middle of the page instead of at the top.
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant', // Use 'instant' to avoid janky scroll animation on navigation
    });
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}


