-- ============================================================================
-- Migration 032: Dyno data layer (AI-AL differentiation)
--
-- Purpose:
-- - Store citeable dyno runs (baseline vs modded) with curves + conditions.
-- - Enable AL to answer “what gains?” with evidence and caveats.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Dyno runs (fact table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS car_dyno_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  car_slug TEXT,
  car_variant_id UUID REFERENCES car_variants(id) ON DELETE SET NULL,

  run_kind TEXT DEFAULT 'unknown' CHECK (run_kind IN ('baseline','modded','comparison','unknown')),
  recorded_at DATE,

  dyno_type TEXT,          -- Dynojet, Mustang, Mainline, etc
  correction TEXT,         -- SAE, STD, uncorrected, etc
  drivetrain TEXT,
  transmission TEXT,
  gear TEXT,
  fuel TEXT,

  is_wheel BOOLEAN DEFAULT true, -- wheel vs crank (when known)

  peak_hp INTEGER CHECK (peak_hp >= 0),
  peak_tq INTEGER CHECK (peak_tq >= 0),
  peak_whp INTEGER CHECK (peak_whp >= 0),
  peak_wtq INTEGER CHECK (peak_wtq >= 0),
  boost_psi_max DECIMAL(6,2),

  -- Curve payload (arrays) + metadata (units, smoothing, etc)
  curve JSONB DEFAULT '{}'::jsonb,

  -- Ambient + run conditions
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

CREATE INDEX IF NOT EXISTS idx_car_dyno_runs_car_id ON car_dyno_runs(car_id);
CREATE INDEX IF NOT EXISTS idx_car_dyno_runs_car_slug ON car_dyno_runs(car_slug);
CREATE INDEX IF NOT EXISTS idx_car_dyno_runs_recorded_at ON car_dyno_runs(recorded_at);
CREATE INDEX IF NOT EXISTS idx_car_dyno_runs_kind ON car_dyno_runs(run_kind);
CREATE INDEX IF NOT EXISTS idx_car_dyno_runs_verified ON car_dyno_runs(verified);
CREATE INDEX IF NOT EXISTS idx_car_dyno_runs_curve ON car_dyno_runs USING GIN(curve);
CREATE INDEX IF NOT EXISTS idx_car_dyno_runs_conditions ON car_dyno_runs USING GIN(conditions);
CREATE INDEX IF NOT EXISTS idx_car_dyno_runs_modifications ON car_dyno_runs USING GIN(modifications);

DROP TRIGGER IF EXISTS update_car_dyno_runs_updated_at ON car_dyno_runs;
CREATE TRIGGER update_car_dyno_runs_updated_at
  BEFORE UPDATE ON car_dyno_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE car_dyno_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "car_dyno_runs_select_public" ON car_dyno_runs;
CREATE POLICY "car_dyno_runs_select_public"
  ON car_dyno_runs FOR SELECT
  TO public
  USING (true);

-- ============================================================================
-- Read RPC for fast AL retrieval
-- ============================================================================
CREATE OR REPLACE FUNCTION get_car_dyno_runs(
  p_car_slug TEXT,
  p_limit INTEGER DEFAULT 6,
  p_include_curve BOOLEAN DEFAULT false
)
RETURNS TABLE (
  run_kind TEXT,
  recorded_at DATE,
  dyno_type TEXT,
  correction TEXT,
  fuel TEXT,
  is_wheel BOOLEAN,
  peak_hp INTEGER,
  peak_tq INTEGER,
  peak_whp INTEGER,
  peak_wtq INTEGER,
  boost_psi_max DECIMAL(6,2),
  conditions JSONB,
  modifications JSONB,
  notes TEXT,
  curve JSONB,
  source_url TEXT,
  verified BOOLEAN,
  confidence DECIMAL(3,2)
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    dr.run_kind,
    dr.recorded_at,
    dr.dyno_type,
    dr.correction,
    dr.fuel,
    dr.is_wheel,
    dr.peak_hp,
    dr.peak_tq,
    dr.peak_whp,
    dr.peak_wtq,
    dr.boost_psi_max,
    dr.conditions,
    dr.modifications,
    dr.notes,
    CASE WHEN p_include_curve THEN dr.curve ELSE '{}'::jsonb END AS curve,
    COALESCE(dr.source_url, sd.source_url) AS source_url,
    dr.verified,
    dr.confidence
  FROM car_dyno_runs dr
  LEFT JOIN source_documents sd ON sd.id = dr.source_document_id
  WHERE dr.car_slug = p_car_slug
  ORDER BY dr.recorded_at DESC NULLS LAST, dr.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 25));
$$;

GRANT EXECUTE ON FUNCTION get_car_dyno_runs(TEXT, INTEGER, BOOLEAN) TO anon, authenticated;













