-- ============================================================================
-- Migration 023: Car Variants + Car ID Adoption (non-breaking)
--
-- Goals:
--   1) Add car_variants as the long-term home for year/trim-specific data
--   2) Add car_id foreign keys to key app tables that currently only store slugs
--      (keep slug columns for backwards compatibility)
--
-- NOTE: This migration is additive and safe to apply incrementally.
-- ============================================================================

-- ============================================================================
-- 1) YEAR RANGE PARSER (best-effort)
-- ============================================================================
CREATE OR REPLACE FUNCTION parse_years_range(p_years TEXT)
RETURNS TABLE(year_start INTEGER, year_end INTEGER)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  m TEXT[];
BEGIN
  year_start := NULL;
  year_end := NULL;

  IF p_years IS NULL OR btrim(p_years) = '' THEN
    RETURN NEXT;
    RETURN;
  END IF;

  -- Match patterns like "2016-2019" or "2016 – 2019" or "2016 to 2019"
  m := regexp_matches(p_years, '(\d{4})\D+(\d{4})');
  IF m IS NOT NULL THEN
    year_start := m[1]::INTEGER;
    year_end := m[2]::INTEGER;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Match single year like "2016"
  m := regexp_matches(p_years, '(\d{4})');
  IF m IS NOT NULL THEN
    year_start := m[1]::INTEGER;
    year_end := m[1]::INTEGER;
    RETURN NEXT;
    RETURN;
  END IF;

  RETURN NEXT;
END;
$$;

COMMENT ON FUNCTION parse_years_range IS 'Best-effort parser for years text (e.g., "2016-2019") into start/end integers';

-- ============================================================================
-- 2) CAR VARIANTS (canonical home for year/trim-specific data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS car_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,

  -- Stable key for app/RPC usage (e.g. "718-cayman-gt4:base" or "718-cayman-gt4:2018")
  variant_key TEXT NOT NULL UNIQUE,

  display_name TEXT,

  -- Year applicability
  years_text TEXT,
  model_year_start INTEGER,
  model_year_end INTEGER,

  -- Optional trim-level attributes
  trim TEXT,
  drivetrain TEXT,
  transmission TEXT,
  engine TEXT,

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_car_variants_car_id ON car_variants(car_id);
CREATE INDEX IF NOT EXISTS idx_car_variants_years ON car_variants(model_year_start, model_year_end);
CREATE INDEX IF NOT EXISTS idx_car_variants_metadata ON car_variants USING GIN(metadata);

DROP TRIGGER IF EXISTS update_car_variants_updated_at ON car_variants;
CREATE TRIGGER update_car_variants_updated_at
  BEFORE UPDATE ON car_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Public read; service role writes via admin workflows
ALTER TABLE car_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "car_variants_select_public" ON car_variants;
CREATE POLICY "car_variants_select_public"
  ON car_variants FOR SELECT
  TO public
  USING (true);

-- Backfill one "base" variant per car (placeholder until per-year/trim is populated)
INSERT INTO car_variants (
  car_id,
  variant_key,
  display_name,
  years_text,
  model_year_start,
  model_year_end,
  drivetrain,
  transmission,
  engine,
  metadata
)
SELECT
  c.id,
  c.slug || ':base' AS variant_key,
  c.name,
  c.years,
  yr.year_start,
  yr.year_end,
  c.drivetrain,
  c.trans,
  c.engine,
  jsonb_build_object('variant_type', 'base')
FROM cars c
CROSS JOIN LATERAL parse_years_range(c.years) yr
ON CONFLICT (variant_key) DO NOTHING;

-- ============================================================================
-- 3) CAR ID ADOPTION (app-facing tables)
-- ============================================================================

-- Leads: add car_interest_id alongside car_interest_slug
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS car_interest_id UUID;

UPDATE leads l
SET car_interest_id = c.id
FROM cars c
WHERE l.car_interest_id IS NULL
  AND l.car_interest_slug IS NOT NULL
  AND l.car_interest_slug = c.slug;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'leads_car_interest_id_fkey'
  ) THEN
    ALTER TABLE leads
      ADD CONSTRAINT leads_car_interest_id_fkey
      FOREIGN KEY (car_interest_id) REFERENCES cars(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_leads_car_interest_id ON leads(car_interest_id);

-- upgrade_packages: add car_id alongside car_slug
ALTER TABLE upgrade_packages
  ADD COLUMN IF NOT EXISTS car_id UUID;

UPDATE upgrade_packages up
SET car_id = c.id
FROM cars c
WHERE up.car_id IS NULL
  AND up.car_slug IS NOT NULL
  AND up.car_slug = c.slug;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'upgrade_packages_car_id_fkey'
  ) THEN
    ALTER TABLE upgrade_packages
      ADD CONSTRAINT upgrade_packages_car_id_fkey
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_upgrade_packages_car_id ON upgrade_packages(car_id);

-- user_favorites: add car_id alongside car_slug
ALTER TABLE user_favorites
  ADD COLUMN IF NOT EXISTS car_id UUID;

UPDATE user_favorites f
SET car_id = c.id
FROM cars c
WHERE f.car_id IS NULL
  AND f.car_slug = c.slug;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'user_favorites_car_id_fkey'
  ) THEN
    ALTER TABLE user_favorites
      ADD CONSTRAINT user_favorites_car_id_fkey
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_favorites_car_id ON user_favorites(car_id);

-- user_projects (or legacy user_saved_builds): add car_id alongside car_slug
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_projects') THEN
    ALTER TABLE user_projects ADD COLUMN IF NOT EXISTS car_id UUID;

    UPDATE user_projects p
    SET car_id = c.id
    FROM cars c
    WHERE p.car_id IS NULL
      AND p.car_slug = c.slug;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'user_projects_car_id_fkey'
    ) THEN
      ALTER TABLE user_projects
        ADD CONSTRAINT user_projects_car_id_fkey
        FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_user_projects_car_id ON user_projects(car_id);
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_saved_builds') THEN
    ALTER TABLE user_saved_builds ADD COLUMN IF NOT EXISTS car_id UUID;

    UPDATE user_saved_builds b
    SET car_id = c.id
    FROM cars c
    WHERE b.car_id IS NULL
      AND b.car_slug = c.slug;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'user_saved_builds_car_id_fkey'
    ) THEN
      ALTER TABLE user_saved_builds
        ADD CONSTRAINT user_saved_builds_car_id_fkey
        FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_user_saved_builds_car_id ON user_saved_builds(car_id);
  END IF;
END $$;

-- user_vehicles: add matched_car_id alongside matched_car_slug
ALTER TABLE user_vehicles
  ADD COLUMN IF NOT EXISTS matched_car_id UUID;

UPDATE user_vehicles v
SET matched_car_id = c.id
FROM cars c
WHERE v.matched_car_id IS NULL
  AND v.matched_car_slug IS NOT NULL
  AND v.matched_car_slug = c.slug;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'user_vehicles_matched_car_id_fkey'
  ) THEN
    ALTER TABLE user_vehicles
      ADD CONSTRAINT user_vehicles_matched_car_id_fkey
      FOREIGN KEY (matched_car_id) REFERENCES cars(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_vehicles_matched_car_id ON user_vehicles(matched_car_id);






