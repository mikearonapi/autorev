-- ============================================================================
-- Migration 033: VIN decode → car_variants resolution
--
-- Goal:
-- - Store exact variant linkage on user_vehicles (not just car slug)
-- - Provide a resolver RPC that maps decoded VIN fields to car_slug + variant_key
-- ============================================================================

-- Extend user_vehicles with variant linkage
ALTER TABLE user_vehicles
  ADD COLUMN IF NOT EXISTS matched_car_variant_id UUID,
  ADD COLUMN IF NOT EXISTS matched_car_variant_key TEXT,
  ADD COLUMN IF NOT EXISTS vin_match_confidence DECIMAL(3,2) CHECK (vin_match_confidence >= 0 AND vin_match_confidence <= 1),
  ADD COLUMN IF NOT EXISTS vin_match_notes TEXT,
  ADD COLUMN IF NOT EXISTS vin_matched_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_vehicles_matched_car_variant_id_fkey'
  ) THEN
    ALTER TABLE user_vehicles
      ADD CONSTRAINT user_vehicles_matched_car_variant_id_fkey
      FOREIGN KEY (matched_car_variant_id) REFERENCES car_variants(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_vehicles_matched_car_variant_id ON user_vehicles(matched_car_variant_id);

-- ============================================================================
-- Resolver RPC: decoded VIN fields → best car_slug + car_variant
-- ============================================================================

CREATE OR REPLACE FUNCTION resolve_car_and_variant_from_vin_decode(
  p_make TEXT,
  p_model TEXT,
  p_model_year INTEGER,
  p_trim TEXT DEFAULT NULL,
  p_series TEXT DEFAULT NULL,
  p_drive_type TEXT DEFAULT NULL,
  p_transmission TEXT DEFAULT NULL
)
RETURNS TABLE (
  car_slug TEXT,
  car_id UUID,
  car_variant_id UUID,
  car_variant_key TEXT,
  car_variant_display_name TEXT,
  confidence DECIMAL(3,2),
  reasons TEXT[]
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH inp AS (
    SELECT
      regexp_replace(lower(coalesce(p_make,'')), '[^a-z0-9]+', '', 'g') AS make_norm,
      regexp_replace(lower(coalesce(p_model,'')), '[^a-z0-9]+', '', 'g') AS model_norm,
      coalesce(p_model_year, NULL) AS model_year,
      lower(coalesce(p_trim,'')) AS trim_l,
      lower(coalesce(p_series,'')) AS series_l,
      upper(coalesce(p_drive_type,'')) AS drive_u,
      lower(coalesce(p_transmission,'')) AS trans_l
  ),
  candidates AS (
    SELECT
      c.slug AS car_slug,
      c.id AS car_id,
      v.id AS car_variant_id,
      v.variant_key AS car_variant_key,
      coalesce(v.display_name, c.name) AS car_variant_display_name,
      -- scoring
      (
        -- make match (brand or name contains)
        (CASE WHEN (SELECT make_norm FROM inp) <> '' AND (
           regexp_replace(lower(coalesce(c.brand,'')), '[^a-z0-9]+', '', 'g') LIKE '%' || (SELECT make_norm FROM inp) || '%'
           OR regexp_replace(lower(c.name), '[^a-z0-9]+', '', 'g') LIKE '%' || (SELECT make_norm FROM inp) || '%'
        ) THEN 0.35 ELSE 0 END)
        +
        -- model match (name contains model token)
        (CASE WHEN (SELECT model_norm FROM inp) <> '' AND (
           regexp_replace(lower(c.name), '[^a-z0-9]+', '', 'g') LIKE '%' || (SELECT model_norm FROM inp) || '%'
        ) THEN 0.35 ELSE 0 END)
        +
        -- year match
        (CASE WHEN (SELECT model_year FROM inp) IS NOT NULL
          AND v.model_year_start IS NOT NULL AND v.model_year_end IS NOT NULL
          AND (SELECT model_year FROM inp) BETWEEN v.model_year_start AND v.model_year_end
        THEN 0.20 ELSE 0 END)
        +
        -- trim / series hints
        (CASE WHEN (SELECT trim_l FROM inp) <> '' AND (
          lower(coalesce(v.trim,'')) LIKE '%' || (SELECT trim_l FROM inp) || '%'
          OR lower(coalesce(v.display_name,'')) LIKE '%' || (SELECT trim_l FROM inp) || '%'
          OR lower(v.variant_key) LIKE '%' || (SELECT trim_l FROM inp) || '%'
        ) THEN 0.05 ELSE 0 END)
        +
        (CASE WHEN (SELECT series_l FROM inp) <> '' AND (
          lower(coalesce(v.display_name,'')) LIKE '%' || (SELECT series_l FROM inp) || '%'
          OR lower(v.variant_key) LIKE '%' || (SELECT series_l FROM inp) || '%'
        ) THEN 0.03 ELSE 0 END)
        +
        -- drivetrain match
        (CASE WHEN (SELECT drive_u FROM inp) <> '' AND upper(coalesce(v.drivetrain,'')) = (SELECT drive_u FROM inp)
        THEN 0.02 ELSE 0 END)
        +
        -- transmission match
        (CASE WHEN (SELECT trans_l FROM inp) <> '' AND lower(coalesce(v.transmission,'')) = (SELECT trans_l FROM inp)
        THEN 0.00 ELSE 0 END)
      )::DECIMAL(3,2) AS confidence,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN (SELECT make_norm FROM inp) <> '' AND (
          regexp_replace(lower(coalesce(c.brand,'')), '[^a-z0-9]+', '', 'g') LIKE '%' || (SELECT make_norm FROM inp) || '%'
          OR regexp_replace(lower(c.name), '[^a-z0-9]+', '', 'g') LIKE '%' || (SELECT make_norm FROM inp) || '%'
        ) THEN 'make_match' END,
        CASE WHEN (SELECT model_norm FROM inp) <> '' AND (
          regexp_replace(lower(c.name), '[^a-z0-9]+', '', 'g') LIKE '%' || (SELECT model_norm FROM inp) || '%'
        ) THEN 'model_match' END,
        CASE WHEN (SELECT model_year FROM inp) IS NOT NULL
          AND v.model_year_start IS NOT NULL AND v.model_year_end IS NOT NULL
          AND (SELECT model_year FROM inp) BETWEEN v.model_year_start AND v.model_year_end
        THEN 'year_in_range' END,
        CASE WHEN (SELECT trim_l FROM inp) <> '' AND (
          lower(coalesce(v.trim,'')) LIKE '%' || (SELECT trim_l FROM inp) || '%'
          OR lower(coalesce(v.display_name,'')) LIKE '%' || (SELECT trim_l FROM inp) || '%'
          OR lower(v.variant_key) LIKE '%' || (SELECT trim_l FROM inp) || '%'
        ) THEN 'trim_hint' END,
        CASE WHEN (SELECT series_l FROM inp) <> '' AND (
          lower(coalesce(v.display_name,'')) LIKE '%' || (SELECT series_l FROM inp) || '%'
          OR lower(v.variant_key) LIKE '%' || (SELECT series_l FROM inp) || '%'
        ) THEN 'series_hint' END,
        CASE WHEN (SELECT drive_u FROM inp) <> '' AND upper(coalesce(v.drivetrain,'')) = (SELECT drive_u FROM inp)
        THEN 'drivetrain_match' END
      ], NULL) AS reasons
    FROM car_variants v
    JOIN cars c ON c.id = v.car_id
    WHERE v.variant_key IS NOT NULL
  )
  SELECT
    car_slug,
    car_id,
    car_variant_id,
    car_variant_key,
    car_variant_display_name,
    confidence,
    reasons
  FROM candidates
  ORDER BY confidence DESC, car_variant_key ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION resolve_car_and_variant_from_vin_decode(TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;



