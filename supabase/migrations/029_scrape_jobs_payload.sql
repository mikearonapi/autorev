-- ============================================================================
-- Migration 029: scrape_jobs payload + source key
--
-- Goal:
-- - Make scrape_jobs usable as a general ingestion queue (cars, parts, docs)
-- - Support per-source rate limiting + retry introspection
-- - Keep backwards compatibility (all ADD COLUMN IF NOT EXISTS)
-- ============================================================================

ALTER TABLE scrape_jobs
  ADD COLUMN IF NOT EXISTS source_key TEXT,
  ADD COLUMN IF NOT EXISTS job_payload JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_source_key ON scrape_jobs(source_key);
CREATE INDEX IF NOT EXISTS idx_scrape_jobs_job_type ON scrape_jobs(job_type);




