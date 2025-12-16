-- ============================================================================
-- Migration 044: car_recalls schema alignment for NHTSA integration
--
-- Goal:
-- - Keep existing `car_recalls` columns (campaign_number, report_received_date, ...)
-- - Add additional columns used by the "VIN-specific recall alerts" feature docs:
--   recall_campaign_number, recall_date, manufacturer, notes, source_url
--
-- This is additive and safe to run repeatedly.
-- ============================================================================

ALTER TABLE car_recalls
  ADD COLUMN IF NOT EXISTS recall_campaign_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS recall_date DATE,
  ADD COLUMN IF NOT EXISTS manufacturer TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Backfill new columns from existing ones where possible
UPDATE car_recalls
SET
  recall_campaign_number = COALESCE(recall_campaign_number, campaign_number),
  recall_date = COALESCE(recall_date, report_received_date)
WHERE recall_campaign_number IS NULL OR recall_date IS NULL;

-- Index for common query patterns
CREATE INDEX IF NOT EXISTS idx_car_recalls_recall_date ON car_recalls(recall_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_car_recalls_source_url ON car_recalls(source_url);

-- Keep de-dupe semantics compatible with existing unique constraint on (car_slug, campaign_number)
CREATE UNIQUE INDEX IF NOT EXISTS ux_car_recalls_recall_campaign_number
  ON car_recalls(car_slug, recall_campaign_number)
  WHERE recall_campaign_number IS NOT NULL;


