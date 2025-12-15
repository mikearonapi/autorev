-- ============================================================================
-- Migration 031: Track lap times (AI-AL differentiation)
--
-- Purpose:
-- - Store citeable, structured lap time data with conditions + provenance.
-- - Enable AL to answer track-oriented questions with evidence and context.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Track venues (circuits)
-- ============================================================================
CREATE TABLE IF NOT EXISTS track_venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country TEXT,
  region TEXT,
  city TEXT,
  length_km DECIMAL(6,3),
  surface TEXT,
  website TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_track_venues_updated_at ON track_venues;
CREATE TRIGGER update_track_venues_updated_at
  BEFORE UPDATE ON track_venues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE track_venues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "track_venues_select_public" ON track_venues;
CREATE POLICY "track_venues_select_public"
  ON track_venues FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- Track layouts (configuration variants)
-- ============================================================================
CREATE TABLE IF NOT EXISTS track_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES track_venues(id) ON DELETE CASCADE,
  layout_key TEXT NOT NULL, -- e.g. "gp", "short", "west", "full"
  name TEXT,
  length_km DECIMAL(6,3),
  turns INTEGER,
  direction TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ux_track_layout UNIQUE (track_id, layout_key)
);

CREATE INDEX IF NOT EXISTS idx_track_layouts_track_id ON track_layouts(track_id);

DROP TRIGGER IF EXISTS update_track_layouts_updated_at ON track_layouts;
CREATE TRIGGER update_track_layouts_updated_at
  BEFORE UPDATE ON track_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE track_layouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "track_layouts_select_public" ON track_layouts;
CREATE POLICY "track_layouts_select_public"
  ON track_layouts FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- Lap times (fact table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS car_track_lap_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  car_slug TEXT,
  car_variant_id UUID REFERENCES car_variants(id) ON DELETE SET NULL,

  track_id UUID NOT NULL REFERENCES track_venues(id) ON DELETE CASCADE,
  track_layout_id UUID REFERENCES track_layouts(id) ON DELETE SET NULL,

  lap_time_ms INTEGER NOT NULL CHECK (lap_time_ms > 0),
  lap_time_text TEXT,
  session_date DATE,

  is_stock BOOLEAN DEFAULT true,
  tires TEXT,
  fuel TEXT,
  transmission TEXT,

  -- Conditions + setup
  conditions JSONB DEFAULT '{}'::jsonb,
  modifications JSONB DEFAULT '{}'::jsonb,
  notes TEXT,

  -- Provenance (citation)
  source_url TEXT,
  source_document_id UUID REFERENCES source_documents(id) ON DELETE SET NULL,

  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_car_track_laps_car_id ON car_track_lap_times(car_id);
CREATE INDEX IF NOT EXISTS idx_car_track_laps_car_slug ON car_track_lap_times(car_slug);
CREATE INDEX IF NOT EXISTS idx_car_track_laps_track_id ON car_track_lap_times(track_id);
CREATE INDEX IF NOT EXISTS idx_car_track_laps_track_lap ON car_track_lap_times(track_id, lap_time_ms);
CREATE INDEX IF NOT EXISTS idx_car_track_laps_car_lap ON car_track_lap_times(car_id, lap_time_ms);
CREATE INDEX IF NOT EXISTS idx_car_track_laps_verified ON car_track_lap_times(verified);
CREATE INDEX IF NOT EXISTS idx_car_track_laps_conditions ON car_track_lap_times USING GIN(conditions);
CREATE INDEX IF NOT EXISTS idx_car_track_laps_modifications ON car_track_lap_times USING GIN(modifications);

DROP TRIGGER IF EXISTS update_car_track_lap_times_updated_at ON car_track_lap_times;
CREATE TRIGGER update_car_track_lap_times_updated_at
  BEFORE UPDATE ON car_track_lap_times
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE car_track_lap_times ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "car_track_lap_times_select_public" ON car_track_lap_times;
CREATE POLICY "car_track_lap_times_select_public"
  ON car_track_lap_times FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- Read RPC for fast AL retrieval
-- ============================================================================
CREATE OR REPLACE FUNCTION get_car_track_lap_times(
  p_car_slug TEXT,
  p_limit INTEGER DEFAULT 8
)
RETURNS TABLE (
  track_slug TEXT,
  track_name TEXT,
  layout_key TEXT,
  layout_name TEXT,
  lap_time_ms INTEGER,
  lap_time_text TEXT,
  session_date DATE,
  is_stock BOOLEAN,
  tires TEXT,
  conditions JSONB,
  modifications JSONB,
  notes TEXT,
  source_url TEXT,
  verified BOOLEAN,
  confidence DECIMAL(3,2)
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    tv.slug AS track_slug,
    tv.name AS track_name,
    tl.layout_key AS layout_key,
    tl.name AS layout_name,
    lt.lap_time_ms,
    lt.lap_time_text,
    lt.session_date,
    lt.is_stock,
    lt.tires,
    lt.conditions,
    lt.modifications,
    lt.notes,
    COALESCE(lt.source_url, sd.source_url) AS source_url,
    lt.verified,
    lt.confidence
  FROM car_track_lap_times lt
  JOIN track_venues tv ON tv.id = lt.track_id
  LEFT JOIN track_layouts tl ON tl.id = lt.track_layout_id
  LEFT JOIN source_documents sd ON sd.id = lt.source_document_id
  WHERE lt.car_slug = p_car_slug
  ORDER BY lt.lap_time_ms ASC
  LIMIT GREATEST(1, LEAST(p_limit, 25));
$$;

GRANT EXECUTE ON FUNCTION get_car_track_lap_times(TEXT, INTEGER) TO anon, authenticated;


