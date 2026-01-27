-- ============================================================================
-- Migration: User Dyno Results Table
-- 
-- Purpose:
-- - Store user-submitted dyno results for their vehicles
-- - Track data source (estimated vs measured) for all performance metrics
-- - Enable the app to prioritize user-provided data over estimates
--
-- Key Design Decisions:
-- 1. `data_source` enum distinguishes between user-provided and estimated data
-- 2. Linked to user_vehicles for vehicle-specific dyno data
-- 3. Supports multiple dyno runs per vehicle (before/after mods)
-- 4. Includes ambient conditions for accurate comparisons
-- ============================================================================

-- Create data_source enum if not exists
DO $$ BEGIN
  CREATE TYPE data_source_type AS ENUM ('estimated', 'measured', 'verified');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- User Dyno Results Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_dyno_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_vehicle_id UUID NOT NULL REFERENCES user_vehicles(id) ON DELETE CASCADE,
  
  -- Core dyno measurements
  whp DECIMAL(6,1) CHECK (whp >= 0 AND whp <= 5000),   -- Wheel horsepower
  wtq DECIMAL(6,1) CHECK (wtq >= 0 AND wtq <= 5000),   -- Wheel torque
  boost_psi DECIMAL(4,1),                              -- Boost pressure (turbo/SC)
  
  -- Calculated crank values (optional - user can provide or we calculate)
  crank_hp DECIMAL(6,1) CHECK (crank_hp >= 0 AND crank_hp <= 5000),
  crank_tq DECIMAL(6,1) CHECK (crank_tq >= 0 AND crank_tq <= 5000),
  
  -- Dyno session info
  dyno_date DATE DEFAULT CURRENT_DATE,
  dyno_shop TEXT,
  dyno_type TEXT,                                      -- Dynojet, Mustang, etc.
  fuel_type TEXT,                                      -- 91, 93, E85, etc.
  dyno_sheet_url TEXT,                                 -- Link to dyno sheet image/PDF
  
  -- Ambient conditions (for correction)
  ambient_temp_f DECIMAL(5,1),
  humidity_percent DECIMAL(4,1),
  altitude_ft INTEGER,
  correction_factor TEXT,                              -- SAE, STD, uncorrected
  
  -- Data quality tracking
  data_source data_source_type DEFAULT 'measured',
  is_verified BOOLEAN DEFAULT false,                   -- Admin verified
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Notes and context
  notes TEXT,
  modifications_at_time JSONB DEFAULT '[]'::jsonb,    -- Snapshot of mods when dyno was done
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_dyno_results_user_id ON user_dyno_results(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dyno_results_vehicle_id ON user_dyno_results(user_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_user_dyno_results_dyno_date ON user_dyno_results(dyno_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_dyno_results_verified ON user_dyno_results(is_verified) WHERE is_verified = true;

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_user_dyno_results_updated_at ON user_dyno_results;
CREATE TRIGGER update_user_dyno_results_updated_at
  BEFORE UPDATE ON user_dyno_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE user_dyno_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own dyno results
DROP POLICY IF EXISTS "user_dyno_results_select_own" ON user_dyno_results;
CREATE POLICY "user_dyno_results_select_own"
  ON user_dyno_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own dyno results
DROP POLICY IF EXISTS "user_dyno_results_insert_own" ON user_dyno_results;
CREATE POLICY "user_dyno_results_insert_own"
  ON user_dyno_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own dyno results
DROP POLICY IF EXISTS "user_dyno_results_update_own" ON user_dyno_results;
CREATE POLICY "user_dyno_results_update_own"
  ON user_dyno_results FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own dyno results
DROP POLICY IF EXISTS "user_dyno_results_delete_own" ON user_dyno_results;
CREATE POLICY "user_dyno_results_delete_own"
  ON user_dyno_results FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Public can view verified dyno results (for community features)
DROP POLICY IF EXISTS "user_dyno_results_select_verified_public" ON user_dyno_results;
CREATE POLICY "user_dyno_results_select_verified_public"
  ON user_dyno_results FOR SELECT
  TO anon, authenticated
  USING (is_verified = true);

-- ============================================================================
-- Add performance_data_source column to user_vehicles
-- This tracks the source of each performance metric for the vehicle
-- ============================================================================
ALTER TABLE user_vehicles 
ADD COLUMN IF NOT EXISTS performance_data_sources JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN user_vehicles.performance_data_sources IS 
'Tracks data source for each metric: { "hp": "measured", "torque": "estimated", "zeroToSixty": "measured" }';

-- ============================================================================
-- RPC: Get user vehicle with performance data
-- Returns the vehicle with the latest dyno data merged in
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_vehicle_with_dyno(
  p_user_vehicle_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_vehicle RECORD;
  v_dyno RECORD;
BEGIN
  -- Get the vehicle
  SELECT * INTO v_vehicle
  FROM user_vehicles
  WHERE id = p_user_vehicle_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Get the latest dyno result for this vehicle
  SELECT * INTO v_dyno
  FROM user_dyno_results
  WHERE user_vehicle_id = p_user_vehicle_id
  ORDER BY dyno_date DESC, created_at DESC
  LIMIT 1;
  
  -- Build result with merged data
  v_result := jsonb_build_object(
    'id', v_vehicle.id,
    'user_id', v_vehicle.user_id,
    'matched_car_slug', v_vehicle.matched_car_slug,
    'matched_car_id', v_vehicle.matched_car_id,
    'nickname', v_vehicle.nickname,
    'year', v_vehicle.year,
    'make', v_vehicle.make,
    'model', v_vehicle.model,
    'installed_modifications', v_vehicle.installed_modifications,
    'performance_data_sources', COALESCE(v_vehicle.performance_data_sources, '{}'::jsonb)
  );
  
  -- Merge dyno data if available
  IF v_dyno IS NOT NULL THEN
    v_result := v_result || jsonb_build_object(
      'dyno', jsonb_build_object(
        'hasResults', true,
        'whp', v_dyno.whp,
        'wtq', v_dyno.wtq,
        'boostPsi', v_dyno.boost_psi,
        'crankHp', v_dyno.crank_hp,
        'crankTq', v_dyno.crank_tq,
        'fuelType', v_dyno.fuel_type,
        'dynoType', v_dyno.dyno_type,
        'dynoDate', v_dyno.dyno_date,
        'dynoShop', v_dyno.dyno_shop,
        'isVerified', v_dyno.is_verified,
        'dataSource', v_dyno.data_source,
        'confidence', v_dyno.confidence
      ),
      'performance_data_sources', jsonb_build_object(
        'hp', CASE WHEN v_dyno.whp IS NOT NULL THEN 'measured' ELSE 'estimated' END,
        'torque', CASE WHEN v_dyno.wtq IS NOT NULL THEN 'measured' ELSE 'estimated' END,
        'boost', CASE WHEN v_dyno.boost_psi IS NOT NULL THEN 'measured' ELSE NULL END
      )
    );
  ELSE
    v_result := v_result || jsonb_build_object(
      'dyno', jsonb_build_object('hasResults', false)
    );
  END IF;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_vehicle_with_dyno(UUID) TO authenticated;

-- ============================================================================
-- RPC: Get latest dyno result for a vehicle
-- ============================================================================
CREATE OR REPLACE FUNCTION get_latest_user_dyno(
  p_user_vehicle_id UUID
)
RETURNS TABLE (
  id UUID,
  whp DECIMAL(6,1),
  wtq DECIMAL(6,1),
  boost_psi DECIMAL(4,1),
  crank_hp DECIMAL(6,1),
  crank_tq DECIMAL(6,1),
  fuel_type TEXT,
  dyno_type TEXT,
  dyno_date DATE,
  dyno_shop TEXT,
  is_verified BOOLEAN,
  data_source data_source_type,
  confidence DECIMAL(3,2)
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id, whp, wtq, boost_psi, crank_hp, crank_tq,
    fuel_type, dyno_type, dyno_date, dyno_shop,
    is_verified, data_source, confidence
  FROM user_dyno_results
  WHERE user_vehicle_id = p_user_vehicle_id
  ORDER BY dyno_date DESC, created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_latest_user_dyno(UUID) TO authenticated;
