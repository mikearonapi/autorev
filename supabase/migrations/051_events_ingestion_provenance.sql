-- ============================================================================
-- Migration 051: Events ingestion provenance + approval guardrails
--
-- Goal:
-- - Ensure we can PROVE which pipeline/job + which configured source created/verified an event
-- - Prevent "approved" events from existing without verification metadata
--
-- Notes:
-- - We use scrape_jobs as the canonical ingestion run tracker (already exists)
-- - We do NOT make assumptions about user/admin identity for cron runs, so approved_by stays NULL
-- ============================================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS ingested_source_id uuid REFERENCES event_sources(id),
  ADD COLUMN IF NOT EXISTS ingested_by_job_id uuid REFERENCES scrape_jobs(id);

CREATE INDEX IF NOT EXISTS idx_events_ingested_source_id ON events(ingested_source_id);
CREATE INDEX IF NOT EXISTS idx_events_ingested_by_job_id ON events(ingested_by_job_id);
CREATE INDEX IF NOT EXISTS idx_events_last_verified_at ON events(last_verified_at);

-- Guardrail: "approved" events must have approval timestamp + verification timestamp,
-- and must be either:
--   (a) ingested by a configured source + linked to a scrape_job, OR
--   (b) user-submitted (submitted_by is set) and approved_at is set (admin tooling path)
--
-- We add as NOT VALID to avoid breaking existing data; we will validate once backfilled.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_approved_requires_provenance'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_approved_requires_provenance
      CHECK (
        status <> 'approved'
        OR (
          approved_at IS NOT NULL
          AND last_verified_at IS NOT NULL
          AND (
            (ingested_source_id IS NOT NULL AND ingested_by_job_id IS NOT NULL)
            OR submitted_by IS NOT NULL
          )
        )
      )
      NOT VALID;
  END IF;
END $$;






