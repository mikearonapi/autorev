-- ============================================================================
-- USER VEHICLE CUSTOM SPECS
-- Migration: 066
-- 
-- Adds support for user-specific modification details that override stock specs.
-- This allows users to record their actual wheel sizes, tire specs, and other
-- custom modifications that differ from the car's stock specifications.
--
-- Example use case: User installs 19x9.5 +22 aftermarket wheels instead of
-- stock 18x8. Their garage now shows their actual specs, not stock.
-- ============================================================================

-- Add custom_specs JSONB column
-- Stores user-specific specs that override vehicle_maintenance_specs
ALTER TABLE user_vehicles 
  ADD COLUMN IF NOT EXISTS custom_specs JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- CUSTOM_SPECS STRUCTURE
-- ============================================================================
-- {
--   "wheels": {
--     "front": {
--       "size": "19x9.5",
--       "offset": "+22",
--       "brand": "Volk",
--       "model": "TE37",
--       "finish": "Bronze",
--       "notes": "Purchased from Evasive Motorsports"
--     },
--     "rear": {
--       "size": "19x10.5",
--       "offset": "+25",
--       "brand": "Volk",
--       "model": "TE37",
--       "finish": "Bronze"
--     },
--     "boltPattern": "5x114.3",
--     "centerBore": "73.1",
--     "lugTorque": "85"
--   },
--   "tires": {
--     "front": {
--       "size": "265/35R19",
--       "brand": "Michelin",
--       "model": "Pilot Sport 4S",
--       "pressure": "36"
--     },
--     "rear": {
--       "size": "295/35R19",
--       "brand": "Michelin",
--       "model": "Pilot Sport 4S",
--       "pressure": "38"
--     }
--   },
--   "suspension": {
--     "type": "Coilovers",
--     "brand": "KW",
--     "model": "V3",
--     "frontRideHeight": "-1.2in",
--     "rearRideHeight": "-1.0in",
--     "notes": "Street comfort settings"
--   },
--   "brakes": {
--     "front": {
--       "rotorSize": "380mm",
--       "caliperBrand": "Brembo",
--       "padCompound": "Hawk HPS 5.0"
--     },
--     "rear": {
--       "rotorSize": "350mm",
--       "padCompound": "Hawk HPS 5.0"
--     }
--   },
--   "engine": {
--     "oilType": "Motul 300V 5W-40",
--     "oilCapacity": "6.5",
--     "coolant": "Evans Waterless",
--     "notes": "Track day prep"
--   },
--   "other": {
--     "notes": "Full bolt-on setup, tuned by XYZ"
--   }
-- }
-- ============================================================================

-- Index for finding vehicles with custom specs
CREATE INDEX IF NOT EXISTS idx_user_vehicles_has_custom_specs 
  ON user_vehicles ((custom_specs != '{}'::jsonb))
  WHERE custom_specs != '{}'::jsonb;

-- Documentation
COMMENT ON COLUMN user_vehicles.custom_specs IS 
  'User-specific specs that override stock values from vehicle_maintenance_specs. Stores wheel sizes, tire info, suspension settings, etc. Empty object {} means no custom specs.';

-- ============================================================================
-- HELPER FUNCTION: Get merged specs for a vehicle
-- Returns stock specs with user custom_specs overlaid
-- ============================================================================
CREATE OR REPLACE FUNCTION get_vehicle_merged_specs(p_vehicle_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vehicle RECORD;
  v_stock_specs RECORD;
  v_result JSONB;
BEGIN
  -- Get vehicle and its matched car slug
  SELECT id, matched_car_slug, custom_specs
  INTO v_vehicle
  FROM user_vehicles
  WHERE id = p_vehicle_id;
  
  IF v_vehicle IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get stock specs if car is matched
  IF v_vehicle.matched_car_slug IS NOT NULL THEN
    SELECT 
      wheel_size_front,
      wheel_size_rear,
      wheel_bolt_pattern,
      wheel_center_bore_mm,
      wheel_lug_torque_ft_lbs,
      tire_size_front,
      tire_size_rear,
      tire_pressure_front_psi,
      tire_pressure_rear_psi,
      oil_type,
      oil_viscosity,
      oil_capacity_liters,
      coolant_type,
      brake_fluid_type
    INTO v_stock_specs
    FROM vehicle_maintenance_specs
    WHERE car_slug = v_vehicle.matched_car_slug;
  END IF;
  
  -- Build result with stock specs as base
  v_result := jsonb_build_object(
    'stock', jsonb_build_object(
      'wheels', jsonb_build_object(
        'front', jsonb_build_object('size', COALESCE(v_stock_specs.wheel_size_front, '')),
        'rear', jsonb_build_object('size', COALESCE(v_stock_specs.wheel_size_rear, '')),
        'boltPattern', COALESCE(v_stock_specs.wheel_bolt_pattern, ''),
        'centerBore', COALESCE(v_stock_specs.wheel_center_bore_mm::text, ''),
        'lugTorque', COALESCE(v_stock_specs.wheel_lug_torque_ft_lbs::text, '')
      ),
      'tires', jsonb_build_object(
        'front', jsonb_build_object(
          'size', COALESCE(v_stock_specs.tire_size_front, ''),
          'pressure', COALESCE(v_stock_specs.tire_pressure_front_psi::text, '')
        ),
        'rear', jsonb_build_object(
          'size', COALESCE(v_stock_specs.tire_size_rear, ''),
          'pressure', COALESCE(v_stock_specs.tire_pressure_rear_psi::text, '')
        )
      ),
      'engine', jsonb_build_object(
        'oilType', COALESCE(v_stock_specs.oil_type, ''),
        'oilViscosity', COALESCE(v_stock_specs.oil_viscosity, ''),
        'oilCapacity', COALESCE(v_stock_specs.oil_capacity_liters::text, ''),
        'coolant', COALESCE(v_stock_specs.coolant_type, ''),
        'brakeFluid', COALESCE(v_stock_specs.brake_fluid_type, '')
      )
    ),
    'custom', COALESCE(v_vehicle.custom_specs, '{}'::jsonb),
    'hasCustomSpecs', v_vehicle.custom_specs IS NOT NULL AND v_vehicle.custom_specs != '{}'::jsonb
  );
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_vehicle_merged_specs(UUID) IS 
  'Returns stock specs from vehicle_maintenance_specs with user custom_specs for comparison/merging';



