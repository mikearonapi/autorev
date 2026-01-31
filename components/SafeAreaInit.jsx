'use client';

/**
 * SafeAreaInit - Forces browser to recalculate safe area CSS after PWA launch
 *
 * PROBLEM: In PWAs (especially iOS), env(safe-area-inset-*) may return 0 on the
 * initial render before the browser calculates actual safe area values. This causes:
 * - Content to render without proper safe area padding
 * - Layout shift when safe areas are eventually calculated
 *
 * SOLUTION: After mount (using requestAnimationFrame to ensure the browser has
 * calculated safe areas), we set a data attribute on documentElement which:
 * 1. Triggers browser style recalculation
 * 2. env() values are now available and CSS re-evaluates correctly
 *
 * This is the same pattern used in BottomTabBar but applied globally so all
 * pages benefit from proper safe area handling on PWA launch.
 *
 * @see components/BottomTabBar.jsx for the original pattern
 */

import { useEffect } from 'react';

export default function SafeAreaInit() {
  useEffect(() => {
    // Skip in SSR
    if (typeof document === 'undefined') return;

    // requestAnimationFrame ensures we wait for the browser to calculate safe areas
    // This is the same timing used in BottomTabBar
    const timer = requestAnimationFrame(() => {
      // Set attribute to mark safe areas as ready
      // This triggers style recalculation on the entire document
      document.documentElement.setAttribute('data-safe-area-ready', '');

      // Force a style recalculation by reading a layout property
      // This ensures the browser has computed the safe area values
      // eslint-disable-next-line no-unused-expressions
      document.documentElement.offsetHeight;
    });

    return () => cancelAnimationFrame(timer);
  }, []);

  return null;
}
