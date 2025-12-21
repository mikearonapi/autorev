-- Migration: 058_wheel_tire_fitment_options
-- Description: Add wheel/tire fitment options table for compatible sizes per vehicle
-- Purpose: Store OEM, plus-size, and aggressive fitment options with clearance notes
-- Related: vehicle_maintenance_specs (has OEM wheel_bolt_pattern, center_bore, etc.)

-- ============================================================================
-- WHEEL/TIRE FITMENT OPTIONS TABLE
-- ============================================================================
-- Stores multiple wheel/tire combinations per car that are known to fit
-- Types: oem (factory), plus_one (1" larger wheel), plus_two (2" larger),
--        aggressive (track/stance), square (same size front/rear)

CREATE TABLE IF NOT EXISTS wheel_tire_fitment_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Car reference (supports both slug and ID for flexibility)
  car_slug TEXT NOT NULL REFERENCES cars(slug) ON DELETE CASCADE,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  
  -- Fitment classification
  fitment_type TEXT NOT NULL CHECK (fitment_type IN (
    'oem',           -- Factory/stock fitment
    'oem_optional',  -- Factory option (larger wheels package)
    'plus_one',      -- +1" wheel diameter (e.g., 18" → 19")
    'plus_two',      -- +2" wheel diameter
    'aggressive',    -- Track/stance oriented, may require mods
    'conservative',  -- Smaller than OEM, more sidewall
    'square'         -- Same size front and rear (for rotation)
  )),
  
  -- Wheel specifications
  wheel_diameter_inches INTEGER NOT NULL,              -- e.g., 19
  wheel_width_front NUMERIC(4,1) NOT NULL,             -- e.g., 9.5
  wheel_width_rear NUMERIC(4,1) NOT NULL,              -- e.g., 10.5
  wheel_offset_front_mm INTEGER,                       -- e.g., 45 (ET45)
  wheel_offset_rear_mm INTEGER,                        -- e.g., 50
  wheel_offset_range_front TEXT,                       -- e.g., "ET35-ET45" for flexibility
  wheel_offset_range_rear TEXT,
  
  -- Tire specifications  
  tire_size_front TEXT NOT NULL,                       -- e.g., "265/35R19"
  tire_size_rear TEXT NOT NULL,                        -- e.g., "295/30R19"
  tire_width_front_mm INTEGER,                         -- e.g., 265 (parsed from size)
  tire_width_rear_mm INTEGER,                          -- e.g., 295
  tire_aspect_front INTEGER,                           -- e.g., 35 (aspect ratio)
  tire_aspect_rear INTEGER,
  
  -- Overall diameter change (affects speedo accuracy)
  diameter_change_percent NUMERIC(4,2),                -- e.g., +1.5% or -0.8%
  speedometer_error_percent NUMERIC(4,2),              -- Calculated from diameter change
  
  -- Fitment requirements & clearance
  requires_fender_roll BOOLEAN DEFAULT false,          -- Needs fender lips rolled
  requires_fender_pull BOOLEAN DEFAULT false,          -- Needs fender pulled/widened
  requires_camber_adjustment BOOLEAN DEFAULT false,    -- Needs camber kit/adjustment
  recommended_camber_front TEXT,                       -- e.g., "-1.5° to -2.0°"
  recommended_camber_rear TEXT,
  requires_coilovers BOOLEAN DEFAULT false,            -- May need height adjustment
  requires_spacers BOOLEAN DEFAULT false,
  spacer_size_front_mm INTEGER,                        -- If spacers needed, what size
  spacer_size_rear_mm INTEGER,
  
  -- Clearance notes
  clearance_notes TEXT,                                -- Free-form fitment notes
  known_issues TEXT,                                   -- Any known rubbing, etc.
  
  -- Use case recommendations
  recommended_for TEXT[],                              -- e.g., ['street', 'track', 'autocross']
  not_recommended_for TEXT[],                          -- e.g., ['daily_driver', 'rough_roads']
  
  -- Popularity & community data
  popularity_score INTEGER DEFAULT 0 CHECK (popularity_score >= 0 AND popularity_score <= 100),
  community_verified BOOLEAN DEFAULT false,
  forum_threads TEXT[],                                -- URLs to forum discussions
  
  -- Source & verification
  source_type TEXT CHECK (source_type IN ('oem', 'community', 'tire_rack', 'fitment_industries', 'forum', 'manual')),
  source_url TEXT,
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary lookup by car
CREATE INDEX idx_fitment_options_car_slug ON wheel_tire_fitment_options(car_slug);
CREATE INDEX idx_fitment_options_car_id ON wheel_tire_fitment_options(car_id);

-- Filter by fitment type
CREATE INDEX idx_fitment_options_type ON wheel_tire_fitment_options(fitment_type);

-- Common query: car + type combination
CREATE INDEX idx_fitment_options_car_type ON wheel_tire_fitment_options(car_slug, fitment_type);

-- Find aggressive/track fitments
CREATE INDEX idx_fitment_options_aggressive ON wheel_tire_fitment_options(car_slug) 
  WHERE fitment_type IN ('aggressive', 'plus_two');

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE wheel_tire_fitment_options ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can see fitment options)
CREATE POLICY "wheel_tire_fitment_options_public_read" 
  ON wheel_tire_fitment_options 
  FOR SELECT 
  USING (true);

-- Service role can do anything (for admin/data ingestion)
CREATE POLICY "wheel_tire_fitment_options_service_all" 
  ON wheel_tire_fitment_options 
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fitment_options_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fitment_options_updated_at
  BEFORE UPDATE ON wheel_tire_fitment_options
  FOR EACH ROW
  EXECUTE FUNCTION update_fitment_options_updated_at();

-- ============================================================================
-- HELPER FUNCTION: Get all fitment options for a car
-- ============================================================================

CREATE OR REPLACE FUNCTION get_wheel_tire_fitments(p_car_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'car_slug', p_car_slug,
    'oem_specs', (
      SELECT jsonb_build_object(
        'wheel_bolt_pattern', wheel_bolt_pattern,
        'center_bore_mm', wheel_center_bore_mm,
        'wheel_size_front', wheel_size_front,
        'wheel_size_rear', wheel_size_rear,
        'tire_size_front', tire_size_front,
        'tire_size_rear', tire_size_rear,
        'lug_torque_ft_lbs', wheel_lug_torque_ft_lbs
      )
      FROM vehicle_maintenance_specs
      WHERE car_slug = p_car_slug
    ),
    'fitment_options', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', id,
          'fitment_type', fitment_type,
          'wheel_diameter', wheel_diameter_inches,
          'wheel_width_front', wheel_width_front,
          'wheel_width_rear', wheel_width_rear,
          'wheel_offset_front', wheel_offset_front_mm,
          'wheel_offset_rear', wheel_offset_rear_mm,
          'tire_size_front', tire_size_front,
          'tire_size_rear', tire_size_rear,
          'requires_mods', (requires_fender_roll OR requires_fender_pull OR requires_camber_adjustment OR requires_coilovers),
          'clearance_notes', clearance_notes,
          'recommended_for', recommended_for,
          'popularity_score', popularity_score,
          'verified', verified
        ) ORDER BY 
          CASE fitment_type 
            WHEN 'oem' THEN 1 
            WHEN 'oem_optional' THEN 2
            WHEN 'plus_one' THEN 3 
            WHEN 'plus_two' THEN 4
            WHEN 'aggressive' THEN 5
            ELSE 6 
          END,
          popularity_score DESC
      ), '[]'::jsonb)
      FROM wheel_tire_fitment_options
      WHERE car_slug = p_car_slug
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE wheel_tire_fitment_options IS 
  'Compatible wheel and tire combinations per vehicle. Stores OEM, plus-size, and aggressive fitments with clearance requirements.';

COMMENT ON COLUMN wheel_tire_fitment_options.fitment_type IS 
  'Classification: oem (stock), oem_optional (factory option), plus_one/plus_two (upsized), aggressive (track), conservative (more sidewall), square (same f/r)';

COMMENT ON COLUMN wheel_tire_fitment_options.wheel_offset_range_front IS 
  'Acceptable offset range, e.g., "ET35-ET45". Useful when exact offset varies by wheel brand.';

COMMENT ON COLUMN wheel_tire_fitment_options.diameter_change_percent IS 
  'Overall tire diameter change vs OEM. Positive = taller, affects speedometer accuracy.';

COMMENT ON COLUMN wheel_tire_fitment_options.popularity_score IS 
  'Community popularity 0-100. Higher = more common/recommended setup.';

COMMENT ON FUNCTION get_wheel_tire_fitments(TEXT) IS 
  'Returns OEM wheel specs and all compatible fitment options for a car slug as JSONB.';

