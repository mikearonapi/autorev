-- ============================================================================
-- Migration 034: Variant-specific maintenance overrides (car_variants)
--
-- Why:
-- - `vehicle_maintenance_specs` is keyed by car_slug (one row per model).
-- - Some OEM specs/intervals vary by year/trim/engine/trans.
-- - Store small, targeted JSON overrides keyed by car_variant.
--
-- Design:
-- - Additive, non-breaking
-- - Shallow-merge override onto existing get_car_maintenance_summary(car_slug)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS car_variant_maintenance_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_variant_id UUID NOT NULL REFERENCES car_variants(id) ON DELETE CASCADE,
  overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_url TEXT,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT ux_variant_maintenance_overrides UNIQUE (car_variant_id)
);

CREATE INDEX IF NOT EXISTS idx_variant_maint_overrides_variant_id ON car_variant_maintenance_overrides(car_variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_maint_overrides_overrides ON car_variant_maintenance_overrides USING GIN(overrides);

DROP TRIGGER IF EXISTS update_car_variant_maintenance_overrides_updated_at ON car_variant_maintenance_overrides;
CREATE TRIGGER update_car_variant_maintenance_overrides_updated_at
  BEFORE UPDATE ON car_variant_maintenance_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE car_variant_maintenance_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "car_variant_maintenance_overrides_select_public" ON car_variant_maintenance_overrides;
CREATE POLICY "car_variant_maintenance_overrides_select_public"
  ON car_variant_maintenance_overrides FOR SELECT
  TO public
  USING (true);

-- ---------------------------------------------------------------------------
-- RPC: get maintenance summary for a variant_key
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_car_maintenance_summary_variant(
  p_variant_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_variant_id UUID;
  v_car_slug TEXT;
  v_base JSONB;
  v_override JSONB;
BEGIN
  IF p_variant_key IS NULL OR btrim(p_variant_key) = '' THEN
    RETURN NULL;
  END IF;

  SELECT v.id, c.slug
    INTO v_variant_id, v_car_slug
  FROM car_variants v
  JOIN cars c ON c.id = v.car_id
  WHERE v.variant_key = p_variant_key
  LIMIT 1;

  IF v_variant_id IS NULL OR v_car_slug IS NULL THEN
    RETURN NULL;
  END IF;

  v_base := COALESCE(get_car_maintenance_summary(v_car_slug), '{}'::jsonb);

  SELECT o.overrides
    INTO v_override
  FROM car_variant_maintenance_overrides o
  WHERE o.car_variant_id = v_variant_id
  LIMIT 1;

  v_override := COALESCE(v_override, '{}'::jsonb);

  -- Shallow merge (top-level keys like oil/coolant/brake_fluid/etc)
  RETURN (v_base || v_override);
END;
$$;

GRANT EXECUTE ON FUNCTION get_car_maintenance_summary_variant(TEXT) TO anon, authenticated;















