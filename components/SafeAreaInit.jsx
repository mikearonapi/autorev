'use client';

/**
 * SafeAreaInit - Forces browser to recalculate safe area CSS after PWA launch
 *
 * PROBLEM: In PWAs (especially iOS), env(safe-area-inset-*) may return 0 on the
 * initial render before the browser calculates actual safe area values. This causes:
 * - Content to render without proper safe area padding
 * - Layout shift when safe areas are eventually calculated
 * - Bottom nav appearing cut off or invisible
 * - Header content appearing under the notch
 *
 * SOLUTION: After mount, we wait for:
 * 1. A small delay (100ms) to let iOS calculate safe areas
 * 2. A requestAnimationFrame to sync with the next paint
 * Then set a data attribute on documentElement which:
 * - Triggers browser style recalculation
 * - Switches from fallback values to actual env() values
 *
 * CSS Strategy (in globals.css):
 * - Before data-safe-area-ready: Use fallback values (47px top, 34px bottom)
 * - After data-safe-area-ready: Use actual env() values
 *
 * @see app/globals.css for the PWA fallback CSS rules
 * @see components/BottomTabBar.jsx for component-level handling
 */

import { useEffect } from 'react';

export default function SafeAreaInit() {
  useEffect(() => {
    // Skip in SSR
    if (typeof document === 'undefined') return;

    // iOS PWAs need a small delay for safe area calculation
    // requestAnimationFrame alone isn't reliable enough
    const timeout = setTimeout(() => {
      requestAnimationFrame(() => {
        // Set attribute to mark safe areas as ready
        // This triggers style recalculation on the entire document
        // CSS rules switch from fallback values to actual env() values
        document.documentElement.setAttribute('data-safe-area-ready', '');

        // Force a style recalculation by reading a layout property
        // This ensures the browser has computed the safe area values
        // eslint-disable-next-line no-unused-expressions
        document.documentElement.offsetHeight;
      });
    }, 100); // 100ms delay for iOS safe area calculation

    return () => clearTimeout(timeout);
  }, []);

  return null;
}
