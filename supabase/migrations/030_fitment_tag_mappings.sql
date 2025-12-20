-- ============================================================================
-- Migration 030: Vendor fitment tag mappings + platform variants (pilot)
--
-- Why:
-- - Vendors use platform tags like "MK7-GTI", "8V-RS3", "8Y-RS3".
-- - We need a canonical mapping -> car_id + car_variant_id for accurate fitment.
-- - Start with VAG pilot tags from Integrated Engineering.
-- ============================================================================

CREATE TABLE IF NOT EXISTS fitment_tag_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  vendor_key TEXT NOT NULL,         -- e.g. "performancebyie"
  tag TEXT NOT NULL,                -- e.g. "MK7-GTI"
  tag_kind TEXT DEFAULT 'platform', -- platform/engine/chassis/etc

  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  car_variant_id UUID REFERENCES car_variants(id) ON DELETE SET NULL,

  notes TEXT,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  source_url TEXT,

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT ux_fitment_tag_mapping UNIQUE (vendor_key, tag)
);

CREATE INDEX IF NOT EXISTS idx_fitment_tag_mappings_vendor ON fitment_tag_mappings(vendor_key);
CREATE INDEX IF NOT EXISTS idx_fitment_tag_mappings_car_id ON fitment_tag_mappings(car_id);
CREATE INDEX IF NOT EXISTS idx_fitment_tag_mappings_variant_id ON fitment_tag_mappings(car_variant_id);
CREATE INDEX IF NOT EXISTS idx_fitment_tag_mappings_metadata ON fitment_tag_mappings USING GIN(metadata);

DROP TRIGGER IF EXISTS update_fitment_tag_mappings_updated_at ON fitment_tag_mappings;
CREATE TRIGGER update_fitment_tag_mappings_updated_at
  BEFORE UPDATE ON fitment_tag_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE fitment_tag_mappings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fitment_tag_mappings_select_public" ON fitment_tag_mappings;
CREATE POLICY "fitment_tag_mappings_select_public"
  ON fitment_tag_mappings FOR SELECT
  TO public
  USING (true);

-- ----------------------------------------------------------------------------
-- Pilot: create platform variants for VAG tags (if not already present)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_car_id UUID;
  v_variant_id UUID;
BEGIN
  -- MK7 GTI
  SELECT id INTO v_car_id FROM cars WHERE slug = 'volkswagen-gti-mk7';
  IF v_car_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM car_variants WHERE variant_key = 'volkswagen-gti-mk7:MK7-GTI') THEN
      INSERT INTO car_variants (car_id, variant_key, display_name, years_text, model_year_start, model_year_end, metadata)
      SELECT v_car_id, 'volkswagen-gti-mk7:MK7-GTI', 'Volkswagen GTI Mk7 (MK7-GTI)', c.years, yr.year_start, yr.year_end,
             jsonb_build_object('fitment_tags', jsonb_build_object('MK7-GTI', true), 'vendor_key', 'performancebyie')
      FROM cars c
      CROSS JOIN LATERAL parse_years_range(c.years) yr
      WHERE c.id = v_car_id;
    END IF;
  END IF;

  -- 8V RS3
  SELECT id INTO v_car_id FROM cars WHERE slug = 'audi-rs3-8v';
  IF v_car_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM car_variants WHERE variant_key = 'audi-rs3-8v:8V-RS3') THEN
      INSERT INTO car_variants (car_id, variant_key, display_name, years_text, model_year_start, model_year_end, metadata)
      SELECT v_car_id, 'audi-rs3-8v:8V-RS3', 'Audi RS3 8V (8V-RS3)', c.years, yr.year_start, yr.year_end,
             jsonb_build_object('fitment_tags', jsonb_build_object('8V-RS3', true), 'vendor_key', 'performancebyie')
      FROM cars c
      CROSS JOIN LATERAL parse_years_range(c.years) yr
      WHERE c.id = v_car_id;
    END IF;
  END IF;

  -- 8Y RS3
  SELECT id INTO v_car_id FROM cars WHERE slug = 'audi-rs3-8y';
  IF v_car_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM car_variants WHERE variant_key = 'audi-rs3-8y:8Y-RS3') THEN
      INSERT INTO car_variants (car_id, variant_key, display_name, years_text, model_year_start, model_year_end, metadata)
      SELECT v_car_id, 'audi-rs3-8y:8Y-RS3', 'Audi RS3 8Y (8Y-RS3)', c.years, yr.year_start, yr.year_end,
             jsonb_build_object('fitment_tags', jsonb_build_object('8Y-RS3', true), 'vendor_key', 'performancebyie')
      FROM cars c
      CROSS JOIN LATERAL parse_years_range(c.years) yr
      WHERE c.id = v_car_id;
    END IF;
  END IF;

  -- Upsert mappings
  -- MK7
  SELECT id INTO v_variant_id FROM car_variants WHERE variant_key = 'volkswagen-gti-mk7:MK7-GTI';
  INSERT INTO fitment_tag_mappings (vendor_key, tag, tag_kind, car_id, car_variant_id, notes, confidence, source_url, metadata)
  VALUES ('performancebyie', 'MK7-GTI', 'platform',
          (SELECT id FROM cars WHERE slug='volkswagen-gti-mk7'),
          v_variant_id,
          'Pilot mapping from IE platform tags', 0.70, 'https://performancebyie.com', jsonb_build_object('family','vag'))
  ON CONFLICT (vendor_key, tag) DO UPDATE
    SET car_id = EXCLUDED.car_id,
        car_variant_id = EXCLUDED.car_variant_id,
        updated_at = NOW();

  -- 8V RS3
  SELECT id INTO v_variant_id FROM car_variants WHERE variant_key = 'audi-rs3-8v:8V-RS3';
  INSERT INTO fitment_tag_mappings (vendor_key, tag, tag_kind, car_id, car_variant_id, notes, confidence, source_url, metadata)
  VALUES ('performancebyie', '8V-RS3', 'platform',
          (SELECT id FROM cars WHERE slug='audi-rs3-8v'),
          v_variant_id,
          'Pilot mapping from IE platform tags', 0.70, 'https://performancebyie.com', jsonb_build_object('family','vag'))
  ON CONFLICT (vendor_key, tag) DO UPDATE
    SET car_id = EXCLUDED.car_id,
        car_variant_id = EXCLUDED.car_variant_id,
        updated_at = NOW();

  -- 8Y RS3
  SELECT id INTO v_variant_id FROM car_variants WHERE variant_key = 'audi-rs3-8y:8Y-RS3';
  INSERT INTO fitment_tag_mappings (vendor_key, tag, tag_kind, car_id, car_variant_id, notes, confidence, source_url, metadata)
  VALUES ('performancebyie', '8Y-RS3', 'platform',
          (SELECT id FROM cars WHERE slug='audi-rs3-8y'),
          v_variant_id,
          'Pilot mapping from IE platform tags', 0.70, 'https://performancebyie.com', jsonb_build_object('family','vag'))
  ON CONFLICT (vendor_key, tag) DO UPDATE
    SET car_id = EXCLUDED.car_id,
        car_variant_id = EXCLUDED.car_variant_id,
        updated_at = NOW();
END $$;













