/**
 * App Routes Configuration
 * 
 * Defines which routes are considered "app" routes where:
 * - Bottom tab bar navigation is shown
 * - Floating AL launcher is hidden (tab bar has AL button)
 */

// Pages where the tab bar should be shown (app routes)
export const APP_ROUTES = [
  '/dashboard',        // Dashboard: scores, achievements, engagement
  '/garage',           // Main garage + sub-routes (my-build, my-performance, my-parts)
  '/my-builds',        // Legacy - part of garage
  '/build',            // Legacy - part of garage
  '/tuning-shop',      // Legacy - redirects to /garage/my-build
  '/performance',      // Part of garage
  '/parts',            // Part of garage (upgrade flow)
  '/data',             // Data hub: track, OBD2, telemetry
  '/track',            // Legacy - redirects to /data
  '/community',
  '/al',
  '/profile',
  '/settings',
  '/encyclopedia',     // Reference - accessible from garage
];

/**
 * Check if a pathname is an app route (where bottom tab bar should be shown)
 * @param {string} pathname - The current pathname
 * @returns {boolean} True if pathname is an app route
 */
export function isAppRoute(pathname) {
  return APP_ROUTES.some(route => pathname?.startsWith(route));
}
