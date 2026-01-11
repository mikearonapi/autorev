-- Migration: P0 Critical Fixes from Database Audit
-- Date: January 11, 2026
-- Purpose: Address critical issues identified in database architecture audit
-- Note: CONCURRENTLY removed as it cannot run inside transaction blocks

-- ============================================================================
-- 1. ADD MISSING INDEXES ON HIGH-TRAFFIC FK COLUMNS
-- ============================================================================

-- Index on click_events.user_id (14,518 rows)
-- Used for: User analytics queries
CREATE INDEX IF NOT EXISTS idx_click_events_user_id 
  ON click_events(user_id);

-- Index on page_views.user_id (4,768 rows)
-- Used for: User session tracking
CREATE INDEX IF NOT EXISTS idx_page_views_user_id 
  ON page_views(user_id);

-- Index on page_engagement.page_view_id (2,975 rows)
-- Used for: Joining engagement data to page views
CREATE INDEX IF NOT EXISTS idx_page_engagement_page_view_id 
  ON page_engagement(page_view_id);

-- Index on event_series.event_type_id (437 rows)
-- Used for: Event type filtering
CREATE INDEX IF NOT EXISTS idx_event_series_event_type_id 
  ON event_series(event_type_id);

-- ============================================================================
-- 2. FIX REMAINING community_insights WITH MISSING car_id
-- ============================================================================

-- Update community_insights where car_id is NULL but car_slug exists
UPDATE community_insights ci
SET car_id = c.id
FROM cars c
WHERE c.slug = ci.car_slug
AND ci.car_id IS NULL;

-- Add trigger to auto-populate car_id on future inserts/updates
DROP TRIGGER IF EXISTS auto_car_id_community_insights ON community_insights;
CREATE TRIGGER auto_car_id_community_insights
BEFORE INSERT OR UPDATE ON community_insights
FOR EACH ROW
EXECUTE FUNCTION resolve_car_id_from_slug();

-- ============================================================================
-- 3. ADD PARTIAL INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Index for unresolved errors (auto-error filtering)
CREATE INDEX IF NOT EXISTS idx_user_feedback_unresolved_bugs
  ON user_feedback(category, severity, created_at DESC)
  WHERE issue_addressed IS NOT TRUE AND category = 'bug';

-- Index for active parts only
CREATE INDEX IF NOT EXISTS idx_parts_active_category
  ON parts(category, brand_name)
  WHERE is_active = true;

-- Index for approved events by date
CREATE INDEX IF NOT EXISTS idx_events_approved_date
  ON events(start_date, city, state)
  WHERE status = 'approved';

-- ============================================================================
-- 4. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON INDEX idx_click_events_user_id IS 'FK index for user analytics queries - added 2026-01-11';
COMMENT ON INDEX idx_page_views_user_id IS 'FK index for user session tracking - added 2026-01-11';
COMMENT ON INDEX idx_page_engagement_page_view_id IS 'FK index for engagement joins - added 2026-01-11';
COMMENT ON INDEX idx_event_series_event_type_id IS 'FK index for event type filtering - added 2026-01-11';
COMMENT ON TRIGGER auto_car_id_community_insights ON community_insights IS 'Auto-resolves car_id from car_slug on INSERT/UPDATE';
