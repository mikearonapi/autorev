-- ============================================================================
-- VACUUM Maintenance Script
-- Date: January 11, 2026
-- Purpose: Clean up dead rows in high-bloat tables
-- 
-- IMPORTANT: Run these commands one at a time outside of a transaction
-- These cannot be run inside migrations or transactions
-- ============================================================================

-- Tables with high dead row ratios identified in audit:

-- forum_scrape_runs: 204% dead row ratio (27 live, 55 dead)
VACUUM ANALYZE forum_scrape_runs;

-- user_favorites: 263% dead row ratio (19 live, 50 dead)
VACUUM ANALYZE user_favorites;

-- events: 16% dead row ratio (8,331 live, 1,337 dead)
VACUUM ANALYZE events;

-- forum_scraped_threads: 28% dead row ratio (199 live, 56 dead)
VACUUM ANALYZE forum_scraped_threads;

-- featured_content: 33% dead row ratio (166 live, 54 dead)
VACUUM ANALYZE featured_content;

-- al_articles: 126% dead row ratio (43 live, 54 dead)
VACUUM ANALYZE al_articles;

-- ============================================================================
-- Optional: Full VACUUM on heavily modified tables
-- Note: VACUUM FULL requires exclusive lock - run during low-traffic period
-- ============================================================================

-- Only run if table is severely bloated (>50% dead rows)
-- VACUUM FULL forum_scrape_runs;
-- VACUUM FULL user_favorites;
-- VACUUM FULL al_articles;

-- ============================================================================
-- Verify results
-- ============================================================================

SELECT 
  schemaname,
  relname as table_name,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  CASE WHEN n_live_tup > 0 
    THEN ROUND(100.0 * n_dead_tup / n_live_tup, 1)
    ELSE 0 
  END as dead_pct,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE relname IN (
  'forum_scrape_runs',
  'user_favorites',
  'events',
  'forum_scraped_threads',
  'featured_content',
  'al_articles'
)
ORDER BY dead_pct DESC;
