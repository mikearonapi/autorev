-- ============================================================================
-- Migration 052: Add deterministic upsert key for scraped events
--
-- Problem:
-- - We need a UNIQUE constraint to support Postgres UPSERT.
-- - `source_url` alone is NOT unique because many sites use one page for a recurring series.
--
-- Solution:
-- - Deduplicate exact duplicates on (source_url, start_date)
-- - Add UNIQUE constraint on (source_url, start_date)
--
-- This allows ingestion to upsert and stamp provenance without inventing data.
-- ============================================================================

-- 1) Remove exact duplicates: keep the earliest created row per (source_url, start_date)
WITH ranked AS (
  SELECT
    id,
    source_url,
    start_date,
    ROW_NUMBER() OVER (
      PARTITION BY source_url, start_date
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM events
),
doomed AS (
  SELECT id FROM ranked WHERE rn > 1
)
DELETE FROM events e
USING doomed d
WHERE e.id = d.id;

-- 2) Add the unique constraint used for upsert conflict target
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'events_source_url_start_date_unique'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_source_url_start_date_unique
      UNIQUE (source_url, start_date);
  END IF;
END $$;







