/**
 * Marketing Layout
 * 
 * Wrapper for marketing pages. Currently passes through to root layout.
 * Routes: /landing/*, /articles/*, /join, /features, /car-selector, /community/*, /al
 * 
 * Once all routes are migrated to route groups, this layout will:
 * - NOT include FavoritesProvider, CompareProvider, SavedBuildsProvider, etc.
 * - NOT include CompareBar, FeedbackCorner
 * 
 * For now, this is a pass-through while we migrate routes gradually.
 */

export default function MarketingLayout({ children }) {
  // Root layout handles all providers and UI elements during migration
  // This layout exists to mark which routes belong to the marketing group
  return children;
}
