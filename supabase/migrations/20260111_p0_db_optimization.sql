-- ============================================================================
-- P0 Database Optimization Migration
-- Date: January 11, 2026
-- Purpose: Critical fixes from database design review
-- ============================================================================

-- ============================================================================
-- 1. FIX REMAINING community_insights car_id VALUES
-- ============================================================================

-- Backfill the 26 rows missing car_id
UPDATE community_insights ci
SET car_id = c.id
FROM cars c
WHERE c.slug = ci.car_slug
AND ci.car_id IS NULL;

-- Add trigger to prevent future NULL car_id in community_insights
DROP TRIGGER IF EXISTS auto_car_id_community_insights ON community_insights;

CREATE TRIGGER auto_car_id_community_insights
BEFORE INSERT OR UPDATE ON community_insights
FOR EACH ROW
EXECUTE FUNCTION resolve_car_id_from_slug();

COMMENT ON TRIGGER auto_car_id_community_insights ON community_insights IS 
'Auto-populates car_id from car_slug to maintain data integrity';

-- ============================================================================
-- 2. ADD MISSING INDEXES ON HIGH-TRAFFIC FK COLUMNS
-- ============================================================================

-- These FK columns were identified as missing indexes in the audit
-- NOTE: Removed CONCURRENTLY as it cannot run inside a transaction
-- For production with large tables, run these manually outside transaction

-- click_events.user_id (14,518 rows)
CREATE INDEX IF NOT EXISTS idx_click_events_user_id 
  ON click_events(user_id);

-- page_views.user_id (4,768 rows)
CREATE INDEX IF NOT EXISTS idx_page_views_user_id 
  ON page_views(user_id);

-- page_engagement.page_view_id (2,975 rows)
CREATE INDEX IF NOT EXISTS idx_page_engagement_page_view_id 
  ON page_engagement(page_view_id);

-- event_series.event_type_id (437 rows)
CREATE INDEX IF NOT EXISTS idx_event_series_event_type_id 
  ON event_series(event_type_id);

-- ============================================================================
-- 3. ADD car_id TRIGGERS TO REMAINING TABLES
-- ============================================================================

-- car_dyno_runs
DROP TRIGGER IF EXISTS auto_car_id_car_dyno_runs ON car_dyno_runs;

CREATE TRIGGER auto_car_id_car_dyno_runs
BEFORE INSERT OR UPDATE ON car_dyno_runs
FOR EACH ROW
EXECUTE FUNCTION resolve_car_id_from_slug();

-- car_track_lap_times
DROP TRIGGER IF EXISTS auto_car_id_car_track_lap_times ON car_track_lap_times;

CREATE TRIGGER auto_car_id_car_track_lap_times
BEFORE INSERT OR UPDATE ON car_track_lap_times
FOR EACH ROW
EXECUTE FUNCTION resolve_car_id_from_slug();

-- document_chunks
DROP TRIGGER IF EXISTS auto_car_id_document_chunks ON document_chunks;

CREATE TRIGGER auto_car_id_document_chunks
BEFORE INSERT OR UPDATE ON document_chunks
FOR EACH ROW
EXECUTE FUNCTION resolve_car_id_from_slug();

-- ============================================================================
-- 4. BACKFILL car_id FOR TABLES WITH TRIGGERS
-- ============================================================================

-- Ensure all existing rows have car_id populated

UPDATE car_dyno_runs dr
SET car_id = c.id
FROM cars c
WHERE c.slug = dr.car_slug
AND dr.car_id IS NULL;

UPDATE car_track_lap_times lt
SET car_id = c.id
FROM cars c
WHERE c.slug = lt.car_slug
AND lt.car_id IS NULL;

UPDATE document_chunks dc
SET car_id = c.id
FROM cars c
WHERE c.slug = dc.car_slug
AND dc.car_id IS NULL
AND dc.car_slug IS NOT NULL;

-- ============================================================================
-- 5. VACUUM HIGH-BLOAT TABLES
-- ============================================================================

-- Note: VACUUM cannot be run inside a transaction, so run these separately:
-- VACUUM ANALYZE forum_scrape_runs;
-- VACUUM ANALYZE user_favorites;
-- VACUUM ANALYZE events;
-- VACUUM ANALYZE featured_content;
-- VACUUM ANALYZE forum_scraped_threads;

-- ============================================================================
-- 6. VERIFICATION QUERIES (Run after migration)
-- ============================================================================

-- Verify no NULL car_id in tables with triggers
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM community_insights WHERE car_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE WARNING 'community_insights has % rows with NULL car_id', null_count;
  ELSE
    RAISE NOTICE 'community_insights: All rows have car_id populated';
  END IF;
  
  SELECT COUNT(*) INTO null_count
  FROM car_dyno_runs WHERE car_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE WARNING 'car_dyno_runs has % rows with NULL car_id', null_count;
  ELSE
    RAISE NOTICE 'car_dyno_runs: All rows have car_id populated';
  END IF;
  
  SELECT COUNT(*) INTO null_count
  FROM car_track_lap_times WHERE car_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE WARNING 'car_track_lap_times has % rows with NULL car_id', null_count;
  ELSE
    RAISE NOTICE 'car_track_lap_times: All rows have car_id populated';
  END IF;
END $$;

-- Verify indexes were created
DO $$
DECLARE
  idx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE indexname IN (
    'idx_click_events_user_id',
    'idx_page_views_user_id',
    'idx_page_engagement_page_view_id',
    'idx_event_series_event_type_id'
  );
  
  RAISE NOTICE 'Created % of 4 expected indexes', idx_count;
END $$;
