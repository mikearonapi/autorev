/**
 * App Layout
 * 
 * Wrapper for interactive app pages. Currently passes through to root layout.
 * Routes: /browse-cars/*, /garage/*, /tuning-shop, /profile, /mod-planner
 * 
 * This layout will contain app-specific providers once all routes are migrated:
 * - FavoritesProvider
 * - CompareProvider
 * - SavedBuildsProvider
 * - OwnedVehiclesProvider
 * - CarSelectionProvider
 * - FeedbackProvider + FeedbackCorner
 * - CompareBar
 * 
 * For now, this is a pass-through while we migrate routes gradually.
 */

export default function AppLayout({ children }) {
  // Root layout handles all providers and UI elements during migration
  // This layout exists to mark which routes belong to the app group
  return children;
}
