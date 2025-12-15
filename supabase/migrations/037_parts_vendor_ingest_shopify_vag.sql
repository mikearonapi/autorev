-- ============================================================================
-- Migration 037: Shopify VAG vendors (EQT + BMP) tag mappings + fitment upsert keys
--
-- Why:
-- - Add at least 2 more Shopify/feed-friendly vendors and normalize their tags to variants.
-- - Make part_fitments idempotent for ingestion via partial unique indexes.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Ensure platform variant exists: VW Golf R Mk7 (MK7-R)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_car_id UUID;
BEGIN
  SELECT id INTO v_car_id FROM cars WHERE slug = 'volkswagen-golf-r-mk7';
  IF v_car_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM car_variants WHERE variant_key = 'volkswagen-golf-r-mk7:MK7-R') THEN
      INSERT INTO car_variants (car_id, variant_key, display_name, years_text, model_year_start, model_year_end, metadata)
      SELECT v_car_id, 'volkswagen-golf-r-mk7:MK7-R', 'Volkswagen Golf R Mk7 (MK7-R)', c.years, yr.year_start, yr.year_end,
             jsonb_build_object('fitment_tags', jsonb_build_object('MK7-R', true), 'family', 'vag')
      FROM cars c
      CROSS JOIN LATERAL parse_years_range(c.years) yr
      WHERE c.id = v_car_id;
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Make part_fitments ingestion idempotent
-- ---------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS ux_part_fitments_part_variant
  ON part_fitments (part_id, car_variant_id)
  WHERE car_variant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_part_fitments_part_car
  ON part_fitments (part_id, car_id)
  WHERE car_variant_id IS NULL AND car_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Upsert fitment tag mappings for new vendors
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_mk7_gti UUID;
  v_8v_rs3 UUID;
  v_mk7_r UUID;
BEGIN
  SELECT id INTO v_mk7_gti FROM car_variants WHERE variant_key = 'volkswagen-gti-mk7:MK7-GTI';
  SELECT id INTO v_8v_rs3 FROM car_variants WHERE variant_key = 'audi-rs3-8v:8V-RS3';
  SELECT id INTO v_mk7_r  FROM car_variants WHERE variant_key = 'volkswagen-golf-r-mk7:MK7-R';

  -- EQTuning (Shopify tags like "GTI 2.0T (Mk7)")
  INSERT INTO fitment_tag_mappings (vendor_key, tag, tag_kind, car_id, car_variant_id, notes, confidence, source_url, metadata)
  VALUES
    ('eqtuning', 'GTI 2.0T (Mk7)',   'platform', (SELECT id FROM cars WHERE slug='volkswagen-gti-mk7'), v_mk7_gti, 'EQT platform tag', 0.70, 'https://eqtuning.com', jsonb_build_object('family','vag')),
    ('eqtuning', 'GTI 2.0T (Mk7.5)', 'platform', (SELECT id FROM cars WHERE slug='volkswagen-gti-mk7'), v_mk7_gti, 'EQT platform tag (Mk7.5 mapped to Mk7 for now)', 0.65, 'https://eqtuning.com', jsonb_build_object('family','vag')),
    ('eqtuning', 'Golf R 2.0T (Mk7)',   'platform', (SELECT id FROM cars WHERE slug='volkswagen-golf-r-mk7'), v_mk7_r, 'EQT platform tag', 0.70, 'https://eqtuning.com', jsonb_build_object('family','vag')),
    ('eqtuning', 'Golf R 2.0T (Mk7.5)', 'platform', (SELECT id FROM cars WHERE slug='volkswagen-golf-r-mk7'), v_mk7_r, 'EQT platform tag (Mk7.5 mapped to Mk7 for now)', 0.65, 'https://eqtuning.com', jsonb_build_object('family','vag')),
    ('eqtuning', 'RS3 2.5T (8V)',   'platform', (SELECT id FROM cars WHERE slug='audi-rs3-8v'), v_8v_rs3, 'EQT platform tag', 0.70, 'https://eqtuning.com', jsonb_build_object('family','vag')),
    ('eqtuning', 'RS3 2.5T (8V.2)', 'platform', (SELECT id FROM cars WHERE slug='audi-rs3-8v'), v_8v_rs3, 'EQT platform tag (8V.2 mapped to 8V for now)', 0.65, 'https://eqtuning.com', jsonb_build_object('family','vag'))
  ON CONFLICT (vendor_key, tag) DO UPDATE
    SET car_id = EXCLUDED.car_id,
        car_variant_id = EXCLUDED.car_variant_id,
        notes = EXCLUDED.notes,
        confidence = EXCLUDED.confidence,
        source_url = EXCLUDED.source_url,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();

  -- BMP Tuning (Shopify tags like "MK7 GTI 2.0T I4 [MQB]")
  INSERT INTO fitment_tag_mappings (vendor_key, tag, tag_kind, car_id, car_variant_id, notes, confidence, source_url, metadata)
  VALUES
    ('bmptuning', 'MK7 GTI 2.0T I4 [MQB]', 'platform', (SELECT id FROM cars WHERE slug='volkswagen-gti-mk7'), v_mk7_gti, 'BMP platform tag', 0.70, 'https://www.bmptuning.com', jsonb_build_object('family','vag')),
    ('bmptuning', 'MK7 R 2.0T I4 [MQB]',   'platform', (SELECT id FROM cars WHERE slug='volkswagen-golf-r-mk7'), v_mk7_r, 'BMP platform tag', 0.70, 'https://www.bmptuning.com', jsonb_build_object('family','vag'))
  ON CONFLICT (vendor_key, tag) DO UPDATE
    SET car_id = EXCLUDED.car_id,
        car_variant_id = EXCLUDED.car_variant_id,
        notes = EXCLUDED.notes,
        confidence = EXCLUDED.confidence,
        source_url = EXCLUDED.source_url,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();
END $$;


