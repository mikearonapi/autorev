-- ============================================================================
-- Migration 039: Fitment Tag Mapping Expansion
--
-- Expands fitment_tag_mappings from 4 VAG cars to cover all major brands.
-- This enables the parts ingestion pipeline to create fitments for more cars.
--
-- Coverage after migration:
-- - VAG: GTI Mk7, Golf R Mk7/Mk8, RS3 8V/8Y, TT RS 8S/8J, RS5 B9
-- - BMW: M3 E46/E92/F80, M4 F82, M2 Comp, 1M, M5 variants
-- - Porsche: 718 GT4/GTS 4.0, 981 variants, 997 variants
-- - Nissan: GT-R, 370Z, 350Z
-- - Toyota/Subaru: GR Supra, GR86/BRZ, 86/FR-S
-- - Domestic: C8/C7 Corvette, GT350/GT500, ZL1/SS 1LE
-- - Honda: Civic Type R FK8/FL5, S2000
-- - Mazda: Miata ND/NC
-- ============================================================================

-- Helper: insert tag mapping only if car exists
CREATE OR REPLACE FUNCTION insert_tag_mapping_if_car_exists(
  p_vendor_key TEXT,
  p_tag TEXT,
  p_tag_kind TEXT,
  p_car_slug TEXT,
  p_confidence DECIMAL,
  p_notes TEXT,
  p_source_url TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS VOID AS $$
DECLARE
  v_car_id UUID;
BEGIN
  SELECT id INTO v_car_id FROM cars WHERE slug = p_car_slug;
  IF v_car_id IS NULL THEN
    RAISE NOTICE 'Skipping tag mapping: car % not found', p_car_slug;
    RETURN;
  END IF;

  INSERT INTO fitment_tag_mappings (vendor_key, tag, tag_kind, car_id, confidence, notes, source_url, metadata)
  VALUES (p_vendor_key, p_tag, p_tag_kind, v_car_id, p_confidence, p_notes, p_source_url, p_metadata)
  ON CONFLICT (vendor_key, tag) DO UPDATE
    SET car_id = EXCLUDED.car_id,
        confidence = EXCLUDED.confidence,
        notes = EXCLUDED.notes,
        source_url = EXCLUDED.source_url,
        metadata = fitment_tag_mappings.metadata || EXCLUDED.metadata,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EXPANDED VAG MAPPINGS (performancebyie, eqtuning, bmptuning)
-- ============================================================================

DO $$
BEGIN
  -- VW Golf R Mk7 (performancebyie)
  PERFORM insert_tag_mapping_if_car_exists('performancebyie', 'MK7-Golf-R', 'platform', 'volkswagen-golf-r-mk7', 0.75, 'IE platform tag', 'https://performancebyie.com', '{"family":"vag"}');
  PERFORM insert_tag_mapping_if_car_exists('performancebyie', 'MK7.5-Golf-R', 'platform', 'volkswagen-golf-r-mk7', 0.72, 'IE platform tag (Mk7.5 = Mk7)', 'https://performancebyie.com', '{"family":"vag"}');
  PERFORM insert_tag_mapping_if_car_exists('performancebyie', 'MK7-R', 'platform', 'volkswagen-golf-r-mk7', 0.75, 'IE platform tag', 'https://performancebyie.com', '{"family":"vag"}');

  -- VW Golf R Mk8 (performancebyie)
  PERFORM insert_tag_mapping_if_car_exists('performancebyie', 'MK8-Golf-R', 'platform', 'volkswagen-golf-r-mk8', 0.75, 'IE platform tag', 'https://performancebyie.com', '{"family":"vag"}');
  PERFORM insert_tag_mapping_if_car_exists('performancebyie', 'MK8-R', 'platform', 'volkswagen-golf-r-mk8', 0.75, 'IE platform tag', 'https://performancebyie.com', '{"family":"vag"}');

  -- Audi TT RS 8S (performancebyie)
  PERFORM insert_tag_mapping_if_car_exists('performancebyie', '8S-TTRS', 'platform', 'audi-tt-rs-8s', 0.75, 'IE platform tag', 'https://performancebyie.com', '{"family":"vag"}');
  PERFORM insert_tag_mapping_if_car_exists('performancebyie', 'TTRS-8S', 'platform', 'audi-tt-rs-8s', 0.75, 'IE platform tag', 'https://performancebyie.com', '{"family":"vag"}');

  -- Audi TT RS 8J (performancebyie)
  PERFORM insert_tag_mapping_if_car_exists('performancebyie', '8J-TTRS', 'platform', 'audi-tt-rs-8j', 0.75, 'IE platform tag', 'https://performancebyie.com', '{"family":"vag"}');
  PERFORM insert_tag_mapping_if_car_exists('performancebyie', 'TTRS-8J', 'platform', 'audi-tt-rs-8j', 0.75, 'IE platform tag', 'https://performancebyie.com', '{"family":"vag"}');

  -- Audi RS5 B9 (performancebyie)
  PERFORM insert_tag_mapping_if_car_exists('performancebyie', 'B9-RS5', 'platform', 'audi-rs5-b9', 0.75, 'IE platform tag', 'https://performancebyie.com', '{"family":"vag"}');

  -- EQTuning additional mappings
  PERFORM insert_tag_mapping_if_car_exists('eqtuning', 'TT RS 2.5T (8S)', 'platform', 'audi-tt-rs-8s', 0.72, 'EQT platform tag', 'https://eqtuning.com', '{"family":"vag"}');
  PERFORM insert_tag_mapping_if_car_exists('eqtuning', 'Golf R 2.0T (Mk8)', 'platform', 'volkswagen-golf-r-mk8', 0.72, 'EQT platform tag', 'https://eqtuning.com', '{"family":"vag"}');

  -- BMP Tuning additional mappings
  PERFORM insert_tag_mapping_if_car_exists('bmptuning', 'MK7 R 2.0T I4 [MQB]', 'platform', 'volkswagen-golf-r-mk7', 0.70, 'BMP platform tag', 'https://www.bmptuning.com', '{"family":"vag"}');
  PERFORM insert_tag_mapping_if_car_exists('bmptuning', 'MK8 GTI 2.0T I4 [MQB EVO]', 'platform', 'volkswagen-golf-r-mk8', 0.68, 'BMP platform tag (MK8 GTI mapped to Golf R Mk8 for MQB parts)', 'https://www.bmptuning.com', '{"family":"vag"}');
  PERFORM insert_tag_mapping_if_car_exists('bmptuning', '8S TT RS 2.5T I5 [MQB]', 'platform', 'audi-tt-rs-8s', 0.70, 'BMP platform tag', 'https://www.bmptuning.com', '{"family":"vag"}');
  PERFORM insert_tag_mapping_if_car_exists('bmptuning', '8V RS3 2.5T I5 [MQB]', 'platform', 'audi-rs3-8v', 0.70, 'BMP platform tag', 'https://www.bmptuning.com', '{"family":"vag"}');
  PERFORM insert_tag_mapping_if_car_exists('bmptuning', '8Y RS3 2.5T I5 [MQB EVO]', 'platform', 'audi-rs3-8y', 0.70, 'BMP platform tag', 'https://www.bmptuning.com', '{"family":"vag"}');

  RAISE NOTICE 'VAG mappings expanded';
END $$;

-- ============================================================================
-- BMW MAPPINGS (placeholder vendor: generic_bmw)
-- These will be used when BMW vendors are integrated
-- ============================================================================

DO $$
BEGIN
  -- M3 generations
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'E46 M3', 'platform', 'bmw-m3-e46', 0.70, 'Generic BMW tag', NULL, '{"family":"bmw"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'E9x M3', 'platform', 'bmw-m3-e92', 0.70, 'Generic BMW tag (E9x = E90/E92/E93)', NULL, '{"family":"bmw"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'E92 M3', 'platform', 'bmw-m3-e92', 0.75, 'Generic BMW tag', NULL, '{"family":"bmw"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'F80 M3', 'platform', 'bmw-m3-f80', 0.75, 'Generic BMW tag', NULL, '{"family":"bmw"}');

  -- M4
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'F82 M4', 'platform', 'bmw-m4-f82', 0.75, 'Generic BMW tag', NULL, '{"family":"bmw"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'F8x M3/M4', 'platform', 'bmw-m3-f80', 0.68, 'Generic BMW tag (F8x shared)', NULL, '{"family":"bmw"}');

  -- M2
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'F87 M2', 'platform', 'bmw-m2-competition', 0.75, 'Generic BMW tag', NULL, '{"family":"bmw"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'M2 Competition', 'platform', 'bmw-m2-competition', 0.78, 'Generic BMW tag', NULL, '{"family":"bmw"}');

  -- 1M
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'E82 1M', 'platform', 'bmw-1m-coupe-e82', 0.75, 'Generic BMW tag', NULL, '{"family":"bmw"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', '1 Series M', 'platform', 'bmw-1m-coupe-e82', 0.72, 'Generic BMW tag', NULL, '{"family":"bmw"}');

  -- M5 generations
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'F90 M5', 'platform', 'bmw-m5-f90-competition', 0.75, 'Generic BMW tag', NULL, '{"family":"bmw"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'F10 M5', 'platform', 'bmw-m5-f10-competition', 0.75, 'Generic BMW tag', NULL, '{"family":"bmw"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'E60 M5', 'platform', 'bmw-m5-e60', 0.75, 'Generic BMW tag', NULL, '{"family":"bmw"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'E39 M5', 'platform', 'bmw-m5-e39', 0.75, 'Generic BMW tag', NULL, '{"family":"bmw"}');

  -- Z4M
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'E85/E86 Z4M', 'platform', 'bmw-z4m-e85-e86', 0.75, 'Generic BMW tag', NULL, '{"family":"bmw"}');

  -- Engine codes (lower confidence)
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'S55', 'engine', 'bmw-m3-f80', 0.62, 'Engine code (S55 in F8x M3/M4)', NULL, '{"family":"bmw","engine_code":"S55"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'S65', 'engine', 'bmw-m3-e92', 0.62, 'Engine code (S65 V8 in E9x M3)', NULL, '{"family":"bmw","engine_code":"S65"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_bmw', 'S54', 'engine', 'bmw-m3-e46', 0.62, 'Engine code (S54 I6 in E46 M3)', NULL, '{"family":"bmw","engine_code":"S54"}');

  RAISE NOTICE 'BMW mappings added';
END $$;

-- ============================================================================
-- PORSCHE MAPPINGS
-- ============================================================================

DO $$
BEGIN
  -- 718 Cayman
  PERFORM insert_tag_mapping_if_car_exists('generic_porsche', '718 GT4', 'platform', '718-cayman-gt4', 0.78, 'Generic Porsche tag', NULL, '{"family":"porsche"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_porsche', 'Cayman GT4', 'platform', '718-cayman-gt4', 0.75, 'Generic Porsche tag', NULL, '{"family":"porsche"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_porsche', '718 GTS 4.0', 'platform', '718-cayman-gts-40', 0.78, 'Generic Porsche tag', NULL, '{"family":"porsche"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_porsche', '982 Cayman', 'platform', '718-cayman-gt4', 0.68, 'Generic Porsche tag (982 = 718)', NULL, '{"family":"porsche"}');

  -- 981 Cayman
  PERFORM insert_tag_mapping_if_car_exists('generic_porsche', '981 GTS', 'platform', '981-cayman-gts', 0.78, 'Generic Porsche tag', NULL, '{"family":"porsche"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_porsche', '981 Cayman S', 'platform', '981-cayman-s', 0.78, 'Generic Porsche tag', NULL, '{"family":"porsche"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_porsche', '981 Cayman', 'platform', '981-cayman-s', 0.70, 'Generic Porsche tag', NULL, '{"family":"porsche"}');

  -- 987 Cayman
  PERFORM insert_tag_mapping_if_car_exists('generic_porsche', '987.2 Cayman', 'platform', '987-2-cayman-s', 0.75, 'Generic Porsche tag', NULL, '{"family":"porsche"}');

  -- 911 GT3
  PERFORM insert_tag_mapping_if_car_exists('generic_porsche', '997 GT3', 'platform', 'porsche-911-gt3-997', 0.78, 'Generic Porsche tag', NULL, '{"family":"porsche"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_porsche', '996 GT3', 'platform', 'porsche-911-gt3-996', 0.78, 'Generic Porsche tag', NULL, '{"family":"porsche"}');

  -- 911 Carrera
  PERFORM insert_tag_mapping_if_car_exists('generic_porsche', '991.1 Carrera', 'platform', '991-1-carrera-s', 0.75, 'Generic Porsche tag', NULL, '{"family":"porsche"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_porsche', '997.2 Carrera', 'platform', '997-2-carrera-s', 0.75, 'Generic Porsche tag', NULL, '{"family":"porsche"}');

  -- 911 Turbo
  PERFORM insert_tag_mapping_if_car_exists('generic_porsche', '997.2 Turbo', 'platform', 'porsche-911-turbo-997-2', 0.78, 'Generic Porsche tag', NULL, '{"family":"porsche"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_porsche', '997.1 Turbo', 'platform', 'porsche-911-turbo-997-1', 0.78, 'Generic Porsche tag', NULL, '{"family":"porsche"}');

  RAISE NOTICE 'Porsche mappings added';
END $$;

-- ============================================================================
-- NISSAN MAPPINGS
-- ============================================================================

DO $$
BEGIN
  -- GT-R
  PERFORM insert_tag_mapping_if_car_exists('generic_nissan', 'R35 GT-R', 'platform', 'nissan-gt-r', 0.78, 'Generic Nissan tag', NULL, '{"family":"nissan"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_nissan', 'GT-R R35', 'platform', 'nissan-gt-r', 0.78, 'Generic Nissan tag', NULL, '{"family":"nissan"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_nissan', 'Nissan GT-R', 'platform', 'nissan-gt-r', 0.72, 'Generic Nissan tag', NULL, '{"family":"nissan"}');

  -- 370Z
  PERFORM insert_tag_mapping_if_car_exists('generic_nissan', 'Z34 370Z', 'platform', 'nissan-370z-nismo', 0.75, 'Generic Nissan tag', NULL, '{"family":"nissan"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_nissan', '370Z NISMO', 'platform', 'nissan-370z-nismo', 0.78, 'Generic Nissan tag', NULL, '{"family":"nissan"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_nissan', '370Z', 'platform', 'nissan-370z-nismo', 0.68, 'Generic Nissan tag (mapped to NISMO)', NULL, '{"family":"nissan"}');

  -- 350Z
  PERFORM insert_tag_mapping_if_car_exists('generic_nissan', 'Z33 350Z', 'platform', 'nissan-350z', 0.75, 'Generic Nissan tag', NULL, '{"family":"nissan"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_nissan', '350Z', 'platform', 'nissan-350z', 0.70, 'Generic Nissan tag', NULL, '{"family":"nissan"}');

  -- New Z
  PERFORM insert_tag_mapping_if_car_exists('generic_nissan', 'RZ34 Nissan Z', 'platform', 'nissan-z-rz34', 0.78, 'Generic Nissan tag', NULL, '{"family":"nissan"}');

  RAISE NOTICE 'Nissan mappings added';
END $$;

-- ============================================================================
-- TOYOTA / SUBARU MAPPINGS
-- ============================================================================

DO $$
BEGIN
  -- GR Supra
  PERFORM insert_tag_mapping_if_car_exists('generic_toyota', 'A90 Supra', 'platform', 'toyota-gr-supra', 0.78, 'Generic Toyota tag', NULL, '{"family":"toyota"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_toyota', 'GR Supra', 'platform', 'toyota-gr-supra', 0.75, 'Generic Toyota tag', NULL, '{"family":"toyota"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_toyota', 'MK5 Supra', 'platform', 'toyota-gr-supra', 0.75, 'Generic Toyota tag', NULL, '{"family":"toyota"}');

  -- MK4 Supra
  PERFORM insert_tag_mapping_if_car_exists('generic_toyota', 'A80 Supra', 'platform', 'toyota-supra-mk4-a80-turbo', 0.78, 'Generic Toyota tag', NULL, '{"family":"toyota"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_toyota', 'MK4 Supra', 'platform', 'toyota-supra-mk4-a80-turbo', 0.75, 'Generic Toyota tag', NULL, '{"family":"toyota"}');

  -- GR86 / BRZ (2nd gen)
  PERFORM insert_tag_mapping_if_car_exists('generic_toyota', 'GR86', 'platform', 'toyota-gr86', 0.78, 'Generic Toyota tag', NULL, '{"family":"toyota"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_toyota', 'ZN8 GR86', 'platform', 'toyota-gr86', 0.78, 'Generic Toyota tag', NULL, '{"family":"toyota"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_toyota', 'ZD8 BRZ', 'platform', 'subaru-brz-zd8', 0.78, 'Generic Toyota tag', NULL, '{"family":"subaru"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_toyota', '2nd Gen BRZ', 'platform', 'subaru-brz-zd8', 0.75, 'Generic Toyota tag', NULL, '{"family":"subaru"}');

  -- 86 / FR-S / BRZ (1st gen)
  PERFORM insert_tag_mapping_if_car_exists('generic_toyota', 'ZN6 86', 'platform', 'toyota-86-scion-frs', 0.78, 'Generic Toyota tag', NULL, '{"family":"toyota"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_toyota', 'FR-S', 'platform', 'toyota-86-scion-frs', 0.75, 'Generic Toyota tag', NULL, '{"family":"toyota"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_toyota', 'ZC6 BRZ', 'platform', 'subaru-brz-zc6', 0.78, 'Generic Toyota tag', NULL, '{"family":"subaru"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_toyota', '86/FR-S/BRZ', 'platform', 'toyota-86-scion-frs', 0.70, 'Generic Toyota tag (shared platform)', NULL, '{"family":"toyota"}');

  -- Subaru WRX STI
  PERFORM insert_tag_mapping_if_car_exists('generic_subaru', 'VA STI', 'platform', 'subaru-wrx-sti-va', 0.78, 'Generic Subaru tag', NULL, '{"family":"subaru"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_subaru', '2015-2021 STI', 'platform', 'subaru-wrx-sti-va', 0.72, 'Generic Subaru tag', NULL, '{"family":"subaru"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_subaru', 'GR/GV STI', 'platform', 'subaru-wrx-sti-gr-gv', 0.75, 'Generic Subaru tag', NULL, '{"family":"subaru"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_subaru', 'Hatchback STI', 'platform', 'subaru-wrx-sti-gr-gv', 0.70, 'Generic Subaru tag', NULL, '{"family":"subaru"}');

  RAISE NOTICE 'Toyota/Subaru mappings added';
END $$;

-- ============================================================================
-- DOMESTIC (Corvette, Mustang, Camaro) MAPPINGS
-- ============================================================================

DO $$
BEGIN
  -- Corvette
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', 'C8 Corvette', 'platform', 'c8-corvette-stingray', 0.78, 'Generic domestic tag', NULL, '{"family":"domestic"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', 'C7 Z06', 'platform', 'c7-corvette-z06', 0.78, 'Generic domestic tag', NULL, '{"family":"domestic"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', 'C7 Grand Sport', 'platform', 'c7-corvette-grand-sport', 0.78, 'Generic domestic tag', NULL, '{"family":"domestic"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', 'C6 Z06', 'platform', 'chevrolet-corvette-c6-z06', 0.78, 'Generic domestic tag', NULL, '{"family":"domestic"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', 'C6 Grand Sport', 'platform', 'chevrolet-corvette-c6-grand-sport', 0.78, 'Generic domestic tag', NULL, '{"family":"domestic"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', 'C5 Z06', 'platform', 'chevrolet-corvette-c5-z06', 0.78, 'Generic domestic tag', NULL, '{"family":"domestic"}');

  -- Camaro
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', 'Camaro ZL1', 'platform', 'camaro-zl1', 0.78, 'Generic domestic tag', NULL, '{"family":"domestic"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', '6th Gen ZL1', 'platform', 'camaro-zl1', 0.75, 'Generic domestic tag', NULL, '{"family":"domestic"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', 'Camaro SS 1LE', 'platform', 'camaro-ss-1le', 0.78, 'Generic domestic tag', NULL, '{"family":"domestic"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', '6th Gen SS', 'platform', 'camaro-ss-1le', 0.72, 'Generic domestic tag', NULL, '{"family":"domestic"}');

  -- Mustang
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', 'Shelby GT350', 'platform', 'shelby-gt350', 0.78, 'Generic domestic tag', NULL, '{"family":"domestic"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', 'GT350', 'platform', 'shelby-gt350', 0.75, 'Generic domestic tag', NULL, '{"family":"domestic"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', 'Shelby GT500', 'platform', 'shelby-gt500', 0.78, 'Generic domestic tag', NULL, '{"family":"domestic"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', 'GT500', 'platform', 'shelby-gt500', 0.75, 'Generic domestic tag', NULL, '{"family":"domestic"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', 'S550 Mustang GT', 'platform', 'mustang-gt-pp2', 0.72, 'Generic domestic tag', NULL, '{"family":"domestic"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', 'Boss 302', 'platform', 'ford-mustang-boss-302', 0.78, 'Generic domestic tag', NULL, '{"family":"domestic"}');

  -- Hellcat
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', 'Challenger Hellcat', 'platform', 'dodge-challenger-hellcat', 0.78, 'Generic domestic tag', NULL, '{"family":"domestic"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_domestic', 'Charger Hellcat', 'platform', 'dodge-charger-hellcat', 0.78, 'Generic domestic tag', NULL, '{"family":"domestic"}');

  RAISE NOTICE 'Domestic mappings added';
END $$;

-- ============================================================================
-- HONDA MAPPINGS
-- ============================================================================

DO $$
BEGIN
  -- Civic Type R
  PERFORM insert_tag_mapping_if_car_exists('generic_honda', 'FK8 Type R', 'platform', 'honda-civic-type-r-fk8', 0.78, 'Generic Honda tag', NULL, '{"family":"honda"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_honda', 'FL5 Type R', 'platform', 'honda-civic-type-r-fl5', 0.78, 'Generic Honda tag', NULL, '{"family":"honda"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_honda', 'Civic Type R FK8', 'platform', 'honda-civic-type-r-fk8', 0.75, 'Generic Honda tag', NULL, '{"family":"honda"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_honda', 'Civic Type R FL5', 'platform', 'honda-civic-type-r-fl5', 0.75, 'Generic Honda tag', NULL, '{"family":"honda"}');

  -- S2000
  PERFORM insert_tag_mapping_if_car_exists('generic_honda', 'AP1 S2000', 'platform', 'honda-s2000', 0.75, 'Generic Honda tag', NULL, '{"family":"honda"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_honda', 'AP2 S2000', 'platform', 'honda-s2000', 0.75, 'Generic Honda tag', NULL, '{"family":"honda"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_honda', 'Honda S2000', 'platform', 'honda-s2000', 0.70, 'Generic Honda tag', NULL, '{"family":"honda"}');

  -- Integra Type R
  PERFORM insert_tag_mapping_if_car_exists('generic_honda', 'DC2 Integra Type R', 'platform', 'acura-integra-type-r-dc2', 0.78, 'Generic Honda tag', NULL, '{"family":"honda"}');

  RAISE NOTICE 'Honda mappings added';
END $$;

-- ============================================================================
-- MAZDA MAPPINGS
-- ============================================================================

DO $$
BEGIN
  -- Miata
  PERFORM insert_tag_mapping_if_car_exists('generic_mazda', 'ND Miata', 'platform', 'mazda-mx5-miata-nd', 0.78, 'Generic Mazda tag', NULL, '{"family":"mazda"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_mazda', 'NC Miata', 'platform', 'mazda-mx5-miata-nc', 0.78, 'Generic Mazda tag', NULL, '{"family":"mazda"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_mazda', 'NB Miata', 'platform', 'mazda-mx5-miata-nb', 0.78, 'Generic Mazda tag', NULL, '{"family":"mazda"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_mazda', 'NA Miata', 'platform', 'mazda-mx5-miata-na', 0.78, 'Generic Mazda tag', NULL, '{"family":"mazda"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_mazda', 'ND MX-5', 'platform', 'mazda-mx5-miata-nd', 0.78, 'Generic Mazda tag', NULL, '{"family":"mazda"}');

  -- RX-7
  PERFORM insert_tag_mapping_if_car_exists('generic_mazda', 'FD3S RX-7', 'platform', 'mazda-rx7-fd3s', 0.78, 'Generic Mazda tag', NULL, '{"family":"mazda"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_mazda', 'FD RX-7', 'platform', 'mazda-rx7-fd3s', 0.75, 'Generic Mazda tag', NULL, '{"family":"mazda"}');

  RAISE NOTICE 'Mazda mappings added';
END $$;

-- ============================================================================
-- MITSUBISHI MAPPINGS
-- ============================================================================

DO $$
BEGIN
  PERFORM insert_tag_mapping_if_car_exists('generic_mitsubishi', 'Evo X', 'platform', 'mitsubishi-lancer-evo-x', 0.78, 'Generic Mitsubishi tag', NULL, '{"family":"mitsubishi"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_mitsubishi', 'CZ4A Evo X', 'platform', 'mitsubishi-lancer-evo-x', 0.78, 'Generic Mitsubishi tag', NULL, '{"family":"mitsubishi"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_mitsubishi', 'Evo 8/9', 'platform', 'mitsubishi-lancer-evo-8-9', 0.75, 'Generic Mitsubishi tag', NULL, '{"family":"mitsubishi"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_mitsubishi', 'CT9A Evo', 'platform', 'mitsubishi-lancer-evo-8-9', 0.75, 'Generic Mitsubishi tag', NULL, '{"family":"mitsubishi"}');

  RAISE NOTICE 'Mitsubishi mappings added';
END $$;

-- ============================================================================
-- FORD (Focus RS) MAPPING
-- ============================================================================

DO $$
BEGIN
  PERFORM insert_tag_mapping_if_car_exists('performancebyie', 'MK3-Focus-RS', 'platform', 'ford-focus-rs', 0.75, 'IE platform tag', 'https://performancebyie.com', '{"family":"ford"}');
  PERFORM insert_tag_mapping_if_car_exists('generic_ford', 'Focus RS', 'platform', 'ford-focus-rs', 0.75, 'Generic Ford tag', NULL, '{"family":"ford"}');

  RAISE NOTICE 'Ford mappings added';
END $$;

-- ============================================================================
-- CLEANUP: Drop helper function
-- ============================================================================

DROP FUNCTION IF EXISTS insert_tag_mapping_if_car_exists;

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
  v_vendor_count INTEGER;
  v_car_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM fitment_tag_mappings;
  SELECT COUNT(DISTINCT vendor_key) INTO v_vendor_count FROM fitment_tag_mappings;
  SELECT COUNT(DISTINCT car_id) INTO v_car_count FROM fitment_tag_mappings WHERE car_id IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'FITMENT TAG MAPPING EXPANSION COMPLETE';
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Total mappings: %', v_count;
  RAISE NOTICE 'Vendors with mappings: %', v_vendor_count;
  RAISE NOTICE 'Cars with mappings: %', v_car_count;
  RAISE NOTICE '============================================================';
END $$;
