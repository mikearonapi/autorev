-- ============================================================================
-- Migration 036: Parts query performance indexes
--
-- Why:
-- - /api/parts/search and /api/parts/popular rely on car_id-scoped fitment sorting
--   and text search over parts name/brand/part_number.
-- - Add compound indexes for common sort patterns + trigram indexes for ILIKE.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Fitment: common access pattern is "car_id = ? ORDER BY verified desc, confidence desc, updated_at desc"
CREATE INDEX IF NOT EXISTS idx_part_fitments_car_id_verified_confidence_updated
  ON part_fitments (car_id, verified DESC, confidence DESC, updated_at DESC);

-- Variant-level lookups (car_variant_id = ?)
CREATE INDEX IF NOT EXISTS idx_part_fitments_variant_id_verified_confidence_updated
  ON part_fitments (car_variant_id, verified DESC, confidence DESC, updated_at DESC);

-- Pricing: common access pattern is "part_id IN (...) ORDER BY recorded_at desc"
CREATE INDEX IF NOT EXISTS idx_part_pricing_part_id_recorded_at
  ON part_pricing_snapshots (part_id, recorded_at DESC);

-- Parts search (ILIKE): trigram indexes
CREATE INDEX IF NOT EXISTS idx_parts_name_trgm
  ON parts USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_parts_brand_name_trgm
  ON parts USING GIN (brand_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_parts_part_number_trgm
  ON parts USING GIN (part_number gin_trgm_ops);

