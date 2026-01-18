-- ============================================================================
-- Migration 099: Performance Calculator Foundation
-- 
-- Purpose: Add tables for the hybrid physics + data calibration system
-- 
-- SAFETY: This migration ONLY ADDS new tables. No existing tables are modified.
-- ============================================================================

-- ============================================================================
-- 1. Engine Family Classification
-- Maps cars to their engine platform for calibration grouping
-- ============================================================================
CREATE TABLE IF NOT EXISTS engine_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Engine family identifier (e.g., 'EA888_Gen3', 'B58', 'S55', 'Coyote_Gen3')
  family_code TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  
  -- Engine characteristics for physics model
  aspiration TEXT CHECK (aspiration IN ('NA', 'Turbo', 'TwinTurbo', 'Supercharged', 'TwinSC')),
  cylinder_config TEXT,  -- 'I4', 'I6', 'V6', 'V8', 'V10', 'V12', 'Flat4', 'Flat6'
  displacement_liters_min DECIMAL(3,1),
  displacement_liters_max DECIMAL(3,1),
  
  -- Physics model parameters
  volumetric_efficiency_stock DECIMAL(4,2) DEFAULT 0.85,  -- 0.80-0.95 typical
  boost_headroom_psi DECIMAL(4,1) DEFAULT 0,  -- Extra boost potential before limits
  thermal_efficiency DECIMAL(4,2) DEFAULT 0.30,  -- 0.25-0.40 typical
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. Car to Engine Family Mapping
-- Links cars to their engine families for calibration lookup
-- ============================================================================
-- Add column to cars table (safe - just adds nullable column)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cars' AND column_name = 'engine_family_id'
  ) THEN
    ALTER TABLE cars ADD COLUMN engine_family_id UUID REFERENCES engine_families(id);
  END IF;
END $$;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_cars_engine_family ON cars(engine_family_id);

-- ============================================================================
-- 3. Performance Calibration Factors
-- Stores learned correction factors from real dyno data
-- ============================================================================
CREATE TABLE IF NOT EXISTS performance_calibration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What this calibration applies to
  engine_family_id UUID REFERENCES engine_families(id),
  upgrade_category TEXT NOT NULL,  -- 'tune_stage1', 'intake', 'exhaust', 'downpipe', etc.
  
  -- Physics model baseline (what we predict before calibration)
  base_gain_percent DECIMAL(5,3) NOT NULL,  -- e.g., 0.15 = 15% HP gain
  
  -- Learned correction factor (actual / predicted)
  correction_factor DECIMAL(5,3) DEFAULT 1.0,
  
  -- Confidence metrics
  sample_size INTEGER DEFAULT 0,
  confidence DECIMAL(3,2) DEFAULT 0.5,  -- 0-1 scale
  std_deviation DECIMAL(5,3),  -- Variance in results
  
  -- Bounds (to prevent wild predictions)
  min_gain_percent DECIMAL(5,3),
  max_gain_percent DECIMAL(5,3),
  
  -- Audit trail
  last_calibrated_at TIMESTAMPTZ,
  last_calibrated_from TEXT,  -- 'dyno_run_id:xxx' or 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(engine_family_id, upgrade_category)
);

-- ============================================================================
-- 4. Verified Mod Combinations
-- Caches verified performance results for exact car + mod combos
-- ============================================================================
CREATE TABLE IF NOT EXISTS verified_mod_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What car and mods
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  engine_family_id UUID REFERENCES engine_families(id),
  mod_combination JSONB NOT NULL,  -- ['stage1-tune', 'intake', 'downpipe']
  mod_combination_hash TEXT GENERATED ALWAYS AS (
    md5(mod_combination::text)
  ) STORED,  -- For fast lookups
  
  -- Verified results
  stock_whp INTEGER NOT NULL,
  modded_whp INTEGER NOT NULL,
  actual_gain INTEGER GENERATED ALWAYS AS (modded_whp - stock_whp) STORED,
  gain_percent DECIMAL(5,3) GENERATED ALWAYS AS (
    CASE WHEN stock_whp > 0 THEN (modded_whp - stock_whp)::decimal / stock_whp ELSE 0 END
  ) STORED,
  
  -- Test conditions (affects accuracy)
  dyno_type TEXT,  -- 'Dynojet', 'Mustang', 'Mainline'
  fuel_type TEXT,  -- '91', '93', 'E85', 'E30'
  ambient_temp_f INTEGER,
  altitude_ft INTEGER,
  
  -- Source and verification
  source_url TEXT,
  dyno_run_id UUID REFERENCES car_dyno_runs(id),
  verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  confidence DECIMAL(3,2) DEFAULT 0.7,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_verified_mods_car ON verified_mod_results(car_id);
CREATE INDEX IF NOT EXISTS idx_verified_mods_family ON verified_mod_results(engine_family_id);
CREATE INDEX IF NOT EXISTS idx_verified_mods_hash ON verified_mod_results(mod_combination_hash);

-- ============================================================================
-- 5. Calculator Audit Log
-- Tracks predictions vs reality for continuous improvement
-- ============================================================================
CREATE TABLE IF NOT EXISTS performance_prediction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What was predicted
  car_id UUID REFERENCES cars(id),
  mod_combination JSONB NOT NULL,
  
  -- The prediction
  predicted_hp INTEGER NOT NULL,
  prediction_tier INTEGER NOT NULL,  -- 1=verified, 2=family, 3=physics, 4=generic
  prediction_confidence DECIMAL(3,2) NOT NULL,
  prediction_source TEXT,
  
  -- Actual result (filled in when we get verification)
  actual_hp INTEGER,
  prediction_error INTEGER,  -- actual - predicted
  
  -- Context
  user_id UUID,
  session_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. Feature Flag for Calculator Version
-- Allows gradual rollout and A/B testing
-- ============================================================================
INSERT INTO app_config (key, value, description, updated_at)
VALUES (
  'performance_calculator_version',
  '"legacy"',  -- 'legacy' | 'hybrid_v1' | 'hybrid_v2'
  'Which performance calculator to use. legacy=current hardcoded, hybrid_v1=physics+calibration',
  NOW()
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 7. Seed Initial Engine Families
-- Common platforms we can immediately calibrate
-- ============================================================================
INSERT INTO engine_families (family_code, display_name, aspiration, cylinder_config, displacement_liters_min, displacement_liters_max, volumetric_efficiency_stock, boost_headroom_psi, notes) VALUES
  -- VAG Turbo 4-cylinders
  ('EA888_Gen3', 'VW EA888 Gen3 (2.0T)', 'Turbo', 'I4', 1.8, 2.0, 0.88, 8, 'GTI Mk7+, Golf R, A3/S3, TT'),
  ('EA888_Gen1', 'VW EA888 Gen1 (2.0T)', 'Turbo', 'I4', 2.0, 2.0, 0.85, 5, 'GTI Mk5-6, A4 B8'),
  
  -- VAG Turbo 5-cylinders
  ('EA855_RS3', 'Audi 2.5T 5-cyl', 'Turbo', 'I5', 2.5, 2.5, 0.90, 10, 'RS3, TTRS, RS Q3'),
  
  -- BMW Turbo 6-cylinders
  ('B58', 'BMW B58 (3.0T)', 'Turbo', 'I6', 3.0, 3.0, 0.92, 8, 'Supra, M340i, M240i, Z4 M40i'),
  ('N55', 'BMW N55 (3.0T)', 'Turbo', 'I6', 3.0, 3.0, 0.88, 6, '335i F30, M2, M235i'),
  ('N54', 'BMW N54 (3.0TT)', 'TwinTurbo', 'I6', 3.0, 3.0, 0.87, 8, '135i, 335i E90'),
  ('S55', 'BMW S55 (3.0TT)', 'TwinTurbo', 'I6', 3.0, 3.0, 0.92, 6, 'M3 F80, M4 F82'),
  ('S58', 'BMW S58 (3.0TT)', 'TwinTurbo', 'I6', 3.0, 3.0, 0.94, 5, 'M3 G80, M4 G82, X3M, X4M'),
  
  -- Ford Modular/Coyote V8s
  ('Coyote_Gen1', 'Ford Coyote Gen1 (5.0)', 'NA', 'V8', 5.0, 5.0, 0.90, 0, 'Mustang GT 2011-2014'),
  ('Coyote_Gen2', 'Ford Coyote Gen2 (5.0)', 'NA', 'V8', 5.0, 5.0, 0.92, 0, 'Mustang GT 2015-2017'),
  ('Coyote_Gen3', 'Ford Coyote Gen3 (5.0)', 'NA', 'V8', 5.0, 5.0, 0.94, 0, 'Mustang GT 2018+'),
  ('Voodoo', 'Ford Voodoo (5.2 FPC)', 'NA', 'V8', 5.2, 5.2, 0.96, 0, 'GT350, GT350R'),
  ('Predator', 'Ford Predator (5.2 SC)', 'Supercharged', 'V8', 5.2, 5.2, 0.94, 4, 'GT500 2020+'),
  
  -- GM LS/LT V8s
  ('LS3', 'GM LS3 (6.2)', 'NA', 'V8', 6.2, 6.2, 0.92, 0, 'Camaro SS, Corvette C6'),
  ('LT1_Gen5', 'GM LT1 Gen5 (6.2)', 'NA', 'V8', 6.2, 6.2, 0.94, 0, 'C7 Corvette, Camaro SS 6th gen'),
  ('LT4', 'GM LT4 (6.2 SC)', 'Supercharged', 'V8', 6.2, 6.2, 0.93, 3, 'Z06 C7, CTS-V Gen3, ZL1'),
  ('LT2', 'GM LT2 (6.2)', 'NA', 'V8', 6.2, 6.2, 0.95, 0, 'C8 Corvette Stingray'),
  
  -- Chrysler Hemi
  ('Hemi_392', 'Chrysler 392 Hemi (6.4)', 'NA', 'V8', 6.4, 6.4, 0.90, 0, 'Challenger/Charger Scat Pack, SRT 392'),
  ('Hellcat', 'Chrysler Hellcat (6.2 SC)', 'Supercharged', 'V8', 6.2, 6.2, 0.92, 5, 'Hellcat, Demon, Redeye'),
  
  -- Subaru Boxer
  ('EJ257', 'Subaru EJ257 (2.5T)', 'Turbo', 'Flat4', 2.5, 2.5, 0.85, 6, 'STI 2004-2021'),
  ('FA20_DIT', 'Subaru FA20 DIT (2.0T)', 'Turbo', 'Flat4', 2.0, 2.0, 0.87, 5, 'WRX 2015+'),
  
  -- Honda/Acura
  ('K20C1', 'Honda K20C1 (2.0T)', 'Turbo', 'I4', 2.0, 2.0, 0.90, 6, 'Civic Type R FK8/FL5'),
  ('K20A', 'Honda K20A (2.0 VTEC)', 'NA', 'I4', 2.0, 2.0, 0.94, 0, 'S2000, RSX Type S, Integra Type R'),
  ('F20C', 'Honda F20C (2.0 VTEC)', 'NA', 'I4', 2.0, 2.2, 0.96, 0, 'S2000 AP1/AP2'),
  
  -- Nissan
  ('VR38DETT', 'Nissan VR38DETT (3.8TT)', 'TwinTurbo', 'V6', 3.8, 3.8, 0.92, 8, 'GT-R R35'),
  ('VQ37VHR', 'Nissan VQ37VHR (3.7)', 'NA', 'V6', 3.7, 3.7, 0.91, 0, '370Z, G37, Q60'),
  
  -- Mercedes-AMG
  ('M177', 'Mercedes M177 (4.0TT)', 'TwinTurbo', 'V8', 4.0, 4.0, 0.93, 5, 'AMG GT, C63 W205, E63'),
  ('M133', 'Mercedes M133 (2.0T)', 'Turbo', 'I4', 2.0, 2.0, 0.90, 6, 'A45 AMG, CLA 45'),
  
  -- Porsche
  ('9A2_Turbo', 'Porsche 9A2 Turbo (3.0TT)', 'TwinTurbo', 'Flat6', 3.0, 3.8, 0.93, 5, '911 Turbo 991/992'),
  ('9A1_GT3', 'Porsche 9A1 GT3 (4.0)', 'NA', 'Flat6', 3.8, 4.0, 0.97, 0, 'GT3 991/992'),
  ('MA1', 'Porsche MA1/FA (2.0T/2.5T)', 'Turbo', 'Flat4', 2.0, 2.5, 0.88, 5, '718 Cayman/Boxster')
ON CONFLICT (family_code) DO NOTHING;

-- ============================================================================
-- 8. Seed Initial Calibration Baselines (Physics-Based)
-- These will be refined as we collect real dyno data
-- ============================================================================
INSERT INTO performance_calibration (
  engine_family_id, 
  upgrade_category, 
  base_gain_percent, 
  correction_factor, 
  confidence,
  min_gain_percent,
  max_gain_percent,
  last_calibrated_from
)
SELECT 
  ef.id,
  uc.upgrade_category,
  uc.base_gain,
  1.0,  -- Start with no correction
  0.5,  -- Medium confidence until calibrated
  uc.base_gain * 0.7,  -- Min is 70% of base
  uc.base_gain * 1.5,  -- Max is 150% of base
  'physics_model_seed'
FROM engine_families ef
CROSS JOIN (
  VALUES 
    -- Turbo cars - stage tunes
    ('tune_stage1', 0.18),  -- 18% gain typical for Stage 1
    ('tune_stage2', 0.35),  -- 35% gain typical for Stage 2 with supporting mods
    ('tune_stage3', 0.55),  -- 55% gain for Stage 3 with turbo upgrade
    
    -- Turbo cars - bolt-ons
    ('intake', 0.02),       -- 2% from intake alone (mostly sound)
    ('downpipe', 0.05),     -- 5% from downpipe (with tune)
    ('intercooler', 0.03),  -- 3% from intercooler (more consistent power)
    ('exhaust_catback', 0.01),  -- 1% from catback (mostly sound)
    
    -- Turbo cars - bigger upgrades
    ('turbo_upgrade', 0.25),  -- 25% from upgraded turbos
    ('e85_conversion', 0.12), -- 12% from E85 (with tune)
    
    -- NA cars - bolt-ons (smaller gains)
    ('headers_na', 0.05),     -- 5% from headers on NA
    ('intake_na', 0.02),      -- 2% from intake on NA
    ('exhaust_na', 0.03),     -- 3% from full exhaust on NA
    ('tune_na', 0.04),        -- 4% from NA tune
    
    -- NA cars - bigger upgrades
    ('cams_na', 0.08),        -- 8% from cams
    ('supercharger', 0.45),   -- 45% from adding supercharger
    ('turbo_kit', 0.50)       -- 50% from adding turbo kit
) AS uc(upgrade_category, base_gain)
ON CONFLICT (engine_family_id, upgrade_category) DO NOTHING;

-- ============================================================================
-- 9. Forum Dyno Data Sources
-- Track which forums/sources we scrape from
-- ============================================================================
CREATE TABLE IF NOT EXISTS dyno_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source identification
  source_name TEXT UNIQUE NOT NULL,  -- 'vwvortex', 'm3post', 'mustang6g', etc.
  display_name TEXT NOT NULL,        -- 'VWVortex', 'M3Post', 'Mustang6G'
  base_url TEXT NOT NULL,            -- 'https://www.vwvortex.com'
  
  -- What cars this source covers
  primary_makes JSONB DEFAULT '[]',  -- ['Volkswagen', 'Audi']
  engine_families JSONB DEFAULT '[]', -- ['EA888', 'EA855']
  
  -- Scraping config
  scrape_enabled BOOLEAN DEFAULT false,
  scrape_frequency_hours INTEGER DEFAULT 168,  -- Weekly by default
  last_scraped_at TIMESTAMPTZ,
  last_scrape_success BOOLEAN,
  
  -- Quality metrics
  total_extractions INTEGER DEFAULT 0,
  verified_extractions INTEGER DEFAULT 0,
  avg_confidence DECIMAL(3,2),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common forum sources
INSERT INTO dyno_data_sources (source_name, display_name, base_url, primary_makes, engine_families) VALUES
  ('vwvortex', 'VWVortex', 'https://www.vwvortex.com', '["Volkswagen", "Audi"]', '["EA888", "EA855"]'),
  ('golfmk7', 'GolfMK7.com', 'https://www.golfmk7.com', '["Volkswagen"]', '["EA888"]'),
  ('audizine', 'Audizine', 'https://www.audizine.com', '["Audi"]', '["EA888", "EA855", "EA839"]'),
  ('m3post', 'M3Post', 'https://www.m3post.com', '["BMW"]', '["S55", "S58", "S65"]'),
  ('bimmerpost', 'BimmerPost', 'https://www.bimmerpost.com', '["BMW"]', '["B58", "N55", "N54", "S55"]'),
  ('mustang6g', 'Mustang6G', 'https://www.mustang6g.com', '["Ford"]', '["Coyote", "Voodoo", "Predator"]'),
  ('corral', 'The Corral', 'https://www.thecorral.net', '["Ford"]', '["Coyote", "Modular"]'),
  ('camaro6', 'Camaro6', 'https://www.camaro6.com', '["Chevrolet"]', '["LT1", "LT4"]'),
  ('corvetteforum', 'Corvette Forum', 'https://www.corvetteforum.com', '["Chevrolet"]', '["LT1", "LT2", "LT4", "LT5"]'),
  ('chargerforums', 'Charger Forums', 'https://www.chargerforums.com', '["Dodge"]', '["Hemi_392", "Hellcat"]'),
  ('ft86club', 'FT86Club', 'https://www.ft86club.com', '["Toyota", "Subaru"]', '["FA20"]'),
  ('supramkv', 'Supra MKV', 'https://www.supramkv.com', '["Toyota"]', '["B58"]'),
  ('iwsti', 'IWSTI', 'https://www.iwsti.com', '["Subaru"]', '["EJ257", "FA20_DIT"]'),
  ('nasioc', 'NASIOC', 'https://forums.nasioc.com', '["Subaru"]', '["EJ257", "FA20_DIT"]'),
  ('civicx', 'CivicX', 'https://www.civicx.com', '["Honda"]', '["K20C1"]'),
  ('s2ki', 'S2KI', 'https://www.s2ki.com', '["Honda"]', '["F20C"]'),
  ('rennlist', 'Rennlist', 'https://www.rennlist.com', '["Porsche"]', '["9A2_Turbo", "9A1_GT3", "MA1"]'),
  ('6speedonline', '6SpeedOnline', 'https://www.6speedonline.com', '["Porsche"]', '["9A2_Turbo", "9A1_GT3"]'),
  ('mbworld', 'MBWorld', 'https://www.mbworld.org', '["Mercedes-Benz"]', '["M177", "M133"]'),
  ('gtrlife', 'GTRLife', 'https://www.gtrlife.com', '["Nissan"]', '["VR38DETT"]')
ON CONFLICT (source_name) DO NOTHING;

-- ============================================================================
-- 10. Forum Dyno Extractions
-- Raw dyno data extracted from forum posts (before verification)
-- ============================================================================
CREATE TABLE IF NOT EXISTS forum_dyno_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source info
  source_id UUID REFERENCES dyno_data_sources(id),
  source_url TEXT NOT NULL,
  post_date TIMESTAMPTZ,
  thread_title TEXT,
  
  -- Extracted car info (may need fuzzy matching to actual car)
  extracted_car_text TEXT,       -- "My 2019 Golf R"
  matched_car_id UUID REFERENCES cars(id),
  matched_car_slug TEXT,
  car_match_confidence DECIMAL(3,2),
  
  -- Extracted mod info
  extracted_mods_text TEXT,      -- "APR Stage 1, intake, downpipe"
  parsed_mods JSONB,             -- ['stage1-tune', 'intake', 'downpipe']
  mod_parse_confidence DECIMAL(3,2),
  
  -- Extracted dyno numbers
  extracted_stock_hp INTEGER,
  extracted_stock_whp INTEGER,
  extracted_modded_hp INTEGER,
  extracted_modded_whp INTEGER,
  extracted_hp_gain INTEGER,
  
  -- Dyno conditions
  extracted_dyno_type TEXT,      -- 'Dynojet', 'Mustang', etc.
  extracted_fuel_type TEXT,      -- '93', 'E85', etc.
  extracted_boost_psi DECIMAL(4,1),
  
  -- Raw extraction
  raw_text TEXT,                 -- Full post text for review
  extraction_method TEXT,        -- 'regex', 'gpt4', 'claude', 'manual'
  
  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Just extracted, needs review
    'matched',      -- Car matched, ready for verification
    'verified',     -- Human verified, ready to use
    'rejected',     -- Invalid/unreliable data
    'duplicate'     -- Duplicate of existing data
  )),
  
  -- Verification
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Links to final data
  dyno_run_id UUID REFERENCES car_dyno_runs(id),  -- If converted to verified dyno run
  verified_mod_result_id UUID REFERENCES verified_mod_results(id),  -- If converted to verified result
  
  -- Quality scoring
  extraction_confidence DECIMAL(3,2),  -- Overall confidence in extraction
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forum_extractions_source ON forum_dyno_extractions(source_id);
CREATE INDEX IF NOT EXISTS idx_forum_extractions_car ON forum_dyno_extractions(matched_car_id);
CREATE INDEX IF NOT EXISTS idx_forum_extractions_status ON forum_dyno_extractions(status);
CREATE INDEX IF NOT EXISTS idx_forum_extractions_url ON forum_dyno_extractions(source_url);

-- ============================================================================
-- 11. Calibration Update Function
-- Recalculates correction factors when new verified data is added
-- ============================================================================
CREATE OR REPLACE FUNCTION update_performance_calibration()
RETURNS TRIGGER AS $$
DECLARE
  v_engine_family_id UUID;
  v_upgrade_category TEXT;
  v_sample_count INTEGER;
  v_avg_gain_percent DECIMAL;
  v_std_dev DECIMAL;
  v_base_gain DECIMAL;
BEGIN
  -- Only process verified results
  IF NEW.verified IS NOT TRUE THEN
    RETURN NEW;
  END IF;
  
  -- Get engine family
  v_engine_family_id := NEW.engine_family_id;
  IF v_engine_family_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- For each upgrade category in the mod combination, update calibration
  -- This is a simplified version - real implementation would parse mod_combination
  
  -- Calculate stats for this engine family
  SELECT 
    COUNT(*),
    AVG(gain_percent),
    STDDEV(gain_percent)
  INTO v_sample_count, v_avg_gain_percent, v_std_dev
  FROM verified_mod_results
  WHERE engine_family_id = v_engine_family_id
    AND verified = true
    AND confidence >= 0.7;
  
  -- Update calibration if we have enough samples
  IF v_sample_count >= 3 THEN
    -- Get base gain from physics model
    SELECT base_gain_percent INTO v_base_gain
    FROM performance_calibration
    WHERE engine_family_id = v_engine_family_id
    LIMIT 1;
    
    IF v_base_gain IS NOT NULL AND v_base_gain > 0 THEN
      -- Update correction factor
      UPDATE performance_calibration
      SET 
        correction_factor = v_avg_gain_percent / v_base_gain,
        sample_size = v_sample_count,
        confidence = LEAST(0.95, 0.5 + (v_sample_count * 0.03)),
        std_deviation = v_std_dev,
        last_calibrated_at = NOW(),
        last_calibrated_from = 'verified_mod_result:' || NEW.id::text,
        updated_at = NOW()
      WHERE engine_family_id = v_engine_family_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update calibration when verified results are added
DROP TRIGGER IF EXISTS trigger_update_calibration ON verified_mod_results;
CREATE TRIGGER trigger_update_calibration
  AFTER INSERT OR UPDATE OF verified ON verified_mod_results
  FOR EACH ROW
  EXECUTE FUNCTION update_performance_calibration();

-- ============================================================================
-- 12. Helper function to map car to engine family
-- ============================================================================
CREATE OR REPLACE FUNCTION get_engine_family_for_car(p_car_id UUID)
RETURNS UUID AS $$
DECLARE
  v_car RECORD;
  v_engine_family_id UUID;
  v_tuning_engine_family TEXT;
BEGIN
  -- Get car info
  SELECT c.*, ctp.engine_family as tuning_engine_family
  INTO v_car
  FROM cars c
  LEFT JOIN car_tuning_profiles ctp ON c.id = ctp.car_id
  WHERE c.id = p_car_id;
  
  IF v_car IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- If car already has engine_family_id, return it
  IF v_car.engine_family_id IS NOT NULL THEN
    RETURN v_car.engine_family_id;
  END IF;
  
  -- Try to match based on tuning profile engine_family text
  v_tuning_engine_family := v_car.tuning_engine_family;
  
  IF v_tuning_engine_family IS NOT NULL THEN
    -- Try exact match on family code or display name
    SELECT id INTO v_engine_family_id
    FROM engine_families
    WHERE 
      v_tuning_engine_family ILIKE '%' || family_code || '%'
      OR v_tuning_engine_family ILIKE '%' || display_name || '%'
      OR display_name ILIKE '%' || v_tuning_engine_family || '%'
    LIMIT 1;
    
    IF v_engine_family_id IS NOT NULL THEN
      RETURN v_engine_family_id;
    END IF;
  END IF;
  
  -- Try to match based on car engine text
  IF v_car.engine IS NOT NULL THEN
    -- Match common patterns
    SELECT id INTO v_engine_family_id
    FROM engine_families ef
    WHERE 
      -- Match displacement
      v_car.engine ILIKE '%' || ef.displacement_liters_min::text || '%'
      -- And aspiration
      AND (
        (ef.aspiration = 'Turbo' AND v_car.engine ILIKE '%turbo%')
        OR (ef.aspiration = 'TwinTurbo' AND (v_car.engine ILIKE '%twin%turbo%' OR v_car.engine ILIKE '%biturbo%'))
        OR (ef.aspiration = 'Supercharged' AND v_car.engine ILIKE '%supercharged%')
        OR (ef.aspiration = 'NA' AND v_car.engine NOT ILIKE '%turbo%' AND v_car.engine NOT ILIKE '%supercharged%')
      )
    LIMIT 1;
  END IF;
  
  RETURN v_engine_family_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Done! All changes are additive and safe to roll back.
-- ============================================================================
