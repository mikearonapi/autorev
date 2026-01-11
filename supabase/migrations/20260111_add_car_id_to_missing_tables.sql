-- Migration: Add car_id columns to tables that have car_slug but no car_id
-- Date: 2026-01-11
-- Purpose: Ensure proper car linkage across all core database tables
--
-- Tables affected:
--   1. al_conversations - add initial_car_id
--   2. car_slug_aliases - add car_id for canonical slug
--   3. al_articles - add car_ids UUID[]
--   4. featured_content - add related_car_ids UUID[]
--   5. user_compare_lists - add car_ids UUID[]
--   6. forum_sources - add car_ids UUID[]
--   7. forum_scraped_threads - add car_ids_detected UUID[]
--   8. daily_driver_enrichments - add car_id
--   9. vehicle_known_issues (deprecated) - add car_id for consistency

BEGIN;

-- ============================================================================
-- 1. al_conversations: Add initial_car_id
-- ============================================================================
ALTER TABLE al_conversations
ADD COLUMN IF NOT EXISTS initial_car_id UUID REFERENCES cars(id);

-- Create index for car-based queries
CREATE INDEX IF NOT EXISTS idx_al_conversations_initial_car_id 
ON al_conversations(initial_car_id) 
WHERE initial_car_id IS NOT NULL;

-- Backfill existing data
UPDATE al_conversations ac
SET initial_car_id = c.id
FROM cars c
WHERE ac.initial_car_slug = c.slug
  AND ac.initial_car_id IS NULL
  AND ac.initial_car_slug IS NOT NULL;

COMMENT ON COLUMN al_conversations.initial_car_id IS 'FK to cars.id - resolved from initial_car_slug';

-- ============================================================================
-- 2. car_slug_aliases: Add car_id for the canonical slug
-- ============================================================================
ALTER TABLE car_slug_aliases
ADD COLUMN IF NOT EXISTS car_id UUID REFERENCES cars(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_car_slug_aliases_car_id 
ON car_slug_aliases(car_id) 
WHERE car_id IS NOT NULL;

-- Backfill existing data
UPDATE car_slug_aliases csa
SET car_id = c.id
FROM cars c
WHERE csa.canonical_slug = c.slug
  AND csa.car_id IS NULL;

COMMENT ON COLUMN car_slug_aliases.car_id IS 'FK to cars.id - resolved from canonical_slug for faster lookups';

-- ============================================================================
-- 3. al_articles: Add car_ids UUID[] array
-- ============================================================================
ALTER TABLE al_articles
ADD COLUMN IF NOT EXISTS car_ids UUID[];

-- Create GIN index for array containment queries
CREATE INDEX IF NOT EXISTS idx_al_articles_car_ids 
ON al_articles USING GIN(car_ids) 
WHERE car_ids IS NOT NULL;

-- Backfill existing data - resolve car_slugs array to car_ids array
UPDATE al_articles aa
SET car_ids = (
  SELECT ARRAY_AGG(c.id)
  FROM unnest(aa.car_slugs) AS slug
  JOIN cars c ON c.slug = slug
)
WHERE aa.car_slugs IS NOT NULL 
  AND array_length(aa.car_slugs, 1) > 0
  AND aa.car_ids IS NULL;

COMMENT ON COLUMN al_articles.car_ids IS 'Array of car UUIDs - resolved from car_slugs for efficient joins';

-- ============================================================================
-- 4. featured_content: Add related_car_ids UUID[] array
-- ============================================================================
ALTER TABLE featured_content
ADD COLUMN IF NOT EXISTS related_car_ids UUID[];

-- Create GIN index
CREATE INDEX IF NOT EXISTS idx_featured_content_related_car_ids 
ON featured_content USING GIN(related_car_ids) 
WHERE related_car_ids IS NOT NULL;

-- Backfill existing data
UPDATE featured_content fc
SET related_car_ids = (
  SELECT ARRAY_AGG(c.id)
  FROM unnest(fc.related_car_slugs) AS slug
  JOIN cars c ON c.slug = slug
)
WHERE fc.related_car_slugs IS NOT NULL 
  AND array_length(fc.related_car_slugs, 1) > 0
  AND fc.related_car_ids IS NULL;

COMMENT ON COLUMN featured_content.related_car_ids IS 'Array of car UUIDs - resolved from related_car_slugs';

-- ============================================================================
-- 5. user_compare_lists: Add car_ids UUID[] array
-- ============================================================================
ALTER TABLE user_compare_lists
ADD COLUMN IF NOT EXISTS car_ids UUID[];

-- Create GIN index
CREATE INDEX IF NOT EXISTS idx_user_compare_lists_car_ids 
ON user_compare_lists USING GIN(car_ids) 
WHERE car_ids IS NOT NULL;

-- Backfill existing data (car_slugs is JSONB array in this table)
UPDATE user_compare_lists ucl
SET car_ids = (
  SELECT ARRAY_AGG(c.id)
  FROM jsonb_array_elements_text(ucl.car_slugs) AS slug
  JOIN cars c ON c.slug = slug
)
WHERE ucl.car_slugs IS NOT NULL 
  AND jsonb_array_length(ucl.car_slugs) > 0
  AND ucl.car_ids IS NULL;

COMMENT ON COLUMN user_compare_lists.car_ids IS 'Array of car UUIDs - resolved from car_slugs JSONB';

-- ============================================================================
-- 6. forum_sources: Add car_ids UUID[] array
-- ============================================================================
ALTER TABLE forum_sources
ADD COLUMN IF NOT EXISTS car_ids UUID[];

-- Create GIN index
CREATE INDEX IF NOT EXISTS idx_forum_sources_car_ids 
ON forum_sources USING GIN(car_ids) 
WHERE car_ids IS NOT NULL;

-- Backfill existing data
UPDATE forum_sources fs
SET car_ids = (
  SELECT ARRAY_AGG(c.id)
  FROM unnest(fs.car_slugs) AS slug
  JOIN cars c ON c.slug = slug
)
WHERE fs.car_slugs IS NOT NULL 
  AND array_length(fs.car_slugs, 1) > 0
  AND fs.car_ids IS NULL;

COMMENT ON COLUMN forum_sources.car_ids IS 'Array of car UUIDs - resolved from car_slugs';

-- ============================================================================
-- 7. forum_scraped_threads: Add car_ids_detected UUID[] array
-- ============================================================================
ALTER TABLE forum_scraped_threads
ADD COLUMN IF NOT EXISTS car_ids_detected UUID[];

-- Create GIN index
CREATE INDEX IF NOT EXISTS idx_forum_scraped_threads_car_ids_detected 
ON forum_scraped_threads USING GIN(car_ids_detected) 
WHERE car_ids_detected IS NOT NULL;

-- Backfill existing data
UPDATE forum_scraped_threads fst
SET car_ids_detected = (
  SELECT ARRAY_AGG(c.id)
  FROM unnest(fst.car_slugs_detected) AS slug
  JOIN cars c ON c.slug = slug
)
WHERE fst.car_slugs_detected IS NOT NULL 
  AND array_length(fst.car_slugs_detected, 1) > 0
  AND fst.car_ids_detected IS NULL;

COMMENT ON COLUMN forum_scraped_threads.car_ids_detected IS 'Array of car UUIDs - resolved from car_slugs_detected';

-- ============================================================================
-- 8. daily_driver_enrichments: Add car_id column
-- ============================================================================
ALTER TABLE daily_driver_enrichments
ADD COLUMN IF NOT EXISTS car_id UUID REFERENCES cars(id);

ALTER TABLE daily_driver_enrichments
ADD COLUMN IF NOT EXISTS car_slug TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_daily_driver_enrichments_car_id 
ON daily_driver_enrichments(car_id) 
WHERE car_id IS NOT NULL;

COMMENT ON COLUMN daily_driver_enrichments.car_id IS 'FK to cars.id - links enrichment data to AutoRev car';
COMMENT ON COLUMN daily_driver_enrichments.car_slug IS 'Car slug for lookup - auto-populated';

-- ============================================================================
-- 9. vehicle_known_issues (DEPRECATED): Add car_id for consistency
-- ============================================================================
ALTER TABLE vehicle_known_issues
ADD COLUMN IF NOT EXISTS car_id UUID REFERENCES cars(id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_vehicle_known_issues_car_id 
ON vehicle_known_issues(car_id) 
WHERE car_id IS NOT NULL;

-- Backfill existing data
UPDATE vehicle_known_issues vki
SET car_id = c.id
FROM cars c
WHERE vki.car_slug = c.slug
  AND vki.car_id IS NULL;

COMMENT ON COLUMN vehicle_known_issues.car_id IS 'FK to cars.id - DEPRECATED TABLE: use car_issues instead';

-- ============================================================================
-- Create individual trigger functions for auto-populating car_id
-- ============================================================================

-- Trigger function for al_conversations
CREATE OR REPLACE FUNCTION resolve_car_id_al_conversations()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.initial_car_slug IS NOT NULL AND NEW.initial_car_id IS NULL THEN
    SELECT id INTO NEW.initial_car_id FROM cars WHERE slug = NEW.initial_car_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for car_slug_aliases
CREATE OR REPLACE FUNCTION resolve_car_id_car_slug_aliases()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.canonical_slug IS NOT NULL AND NEW.car_id IS NULL THEN
    SELECT id INTO NEW.car_id FROM cars WHERE slug = NEW.canonical_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for daily_driver_enrichments
CREATE OR REPLACE FUNCTION resolve_car_id_daily_driver_enrichments()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.car_slug IS NOT NULL AND NEW.car_id IS NULL THEN
    SELECT id INTO NEW.car_id FROM cars WHERE slug = NEW.car_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for vehicle_known_issues
CREATE OR REPLACE FUNCTION resolve_car_id_vehicle_known_issues()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.car_slug IS NOT NULL AND NEW.car_id IS NULL THEN
    SELECT id INTO NEW.car_id FROM cars WHERE slug = NEW.car_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Create triggers for auto-populating car_id
-- ============================================================================

-- Trigger for al_conversations
DROP TRIGGER IF EXISTS auto_car_id_al_conversations ON al_conversations;
CREATE TRIGGER auto_car_id_al_conversations
BEFORE INSERT OR UPDATE ON al_conversations
FOR EACH ROW
EXECUTE FUNCTION resolve_car_id_al_conversations();

-- Trigger for car_slug_aliases
DROP TRIGGER IF EXISTS auto_car_id_car_slug_aliases ON car_slug_aliases;
CREATE TRIGGER auto_car_id_car_slug_aliases
BEFORE INSERT OR UPDATE ON car_slug_aliases
FOR EACH ROW
EXECUTE FUNCTION resolve_car_id_car_slug_aliases();

-- Trigger for daily_driver_enrichments
DROP TRIGGER IF EXISTS auto_car_id_daily_driver_enrichments ON daily_driver_enrichments;
CREATE TRIGGER auto_car_id_daily_driver_enrichments
BEFORE INSERT OR UPDATE ON daily_driver_enrichments
FOR EACH ROW
EXECUTE FUNCTION resolve_car_id_daily_driver_enrichments();

-- Trigger for vehicle_known_issues (deprecated but for consistency)
DROP TRIGGER IF EXISTS auto_car_id_vehicle_known_issues ON vehicle_known_issues;
CREATE TRIGGER auto_car_id_vehicle_known_issues
BEFORE INSERT OR UPDATE ON vehicle_known_issues
FOR EACH ROW
EXECUTE FUNCTION resolve_car_id_vehicle_known_issues();

COMMIT;

-- ============================================================================
-- Verification queries (run after migration)
-- ============================================================================
-- SELECT 'al_conversations' as table_name, COUNT(*) as total, COUNT(initial_car_id) as with_car_id FROM al_conversations WHERE initial_car_slug IS NOT NULL;
-- SELECT 'car_slug_aliases' as table_name, COUNT(*) as total, COUNT(car_id) as with_car_id FROM car_slug_aliases;
-- SELECT 'al_articles' as table_name, COUNT(*) as total, COUNT(car_ids) as with_car_ids FROM al_articles WHERE car_slugs IS NOT NULL;
-- SELECT 'featured_content' as table_name, COUNT(*) as total, COUNT(related_car_ids) as with_car_ids FROM featured_content WHERE related_car_slugs IS NOT NULL;
-- SELECT 'user_compare_lists' as table_name, COUNT(*) as total, COUNT(car_ids) as with_car_ids FROM user_compare_lists WHERE car_slugs IS NOT NULL;
-- SELECT 'forum_sources' as table_name, COUNT(*) as total, COUNT(car_ids) as with_car_ids FROM forum_sources WHERE car_slugs IS NOT NULL;
-- SELECT 'forum_scraped_threads' as table_name, COUNT(*) as total, COUNT(car_ids_detected) as with_car_ids FROM forum_scraped_threads WHERE car_slugs_detected IS NOT NULL;
-- SELECT 'daily_driver_enrichments' as table_name, COUNT(*) as total, COUNT(car_id) as with_car_id FROM daily_driver_enrichments;
-- SELECT 'vehicle_known_issues' as table_name, COUNT(*) as total, COUNT(car_id) as with_car_id FROM vehicle_known_issues;
