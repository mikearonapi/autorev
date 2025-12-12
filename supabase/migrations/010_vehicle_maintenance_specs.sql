-- ============================================================================
-- VEHICLE MAINTENANCE SPECIFICATIONS SCHEMA
-- AutoRev - Comprehensive OEM Maintenance Data
--
-- This schema captures all OEM maintenance specifications for vehicles,
-- enabling the AI Mechanic to provide accurate, model-specific advice.
--
-- Categories covered:
--   1. Fluids (oil, coolant, brake fluid, trans fluid, power steering, etc.)
--   2. Filters (oil, air, cabin, fuel)
--   3. Tires & Wheels (sizes, pressures, rotation patterns)
--   4. Brakes (pad types, rotor specs, caliper info)
--   5. Engine (timing components, spark plugs, belts)
--   6. Electrical (battery, alternator, bulb specs)
--   7. Wiper/Washer Systems
--   8. Service Intervals
--   9. Known Issues & TSBs (Technical Service Bulletins)
--   10. OEM Parts References
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- MAIN VEHICLE MAINTENANCE SPECS TABLE
-- Links to cars table via slug
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_maintenance_specs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_slug TEXT NOT NULL UNIQUE,
  
  -- -------------------------------------------------------------------------
  -- ENGINE OIL
  -- -------------------------------------------------------------------------
  oil_type TEXT,                              -- e.g., "0W-40 Full Synthetic"
  oil_viscosity TEXT,                         -- e.g., "0W-40"
  oil_spec TEXT,                              -- e.g., "API SN Plus", "BMW LL-01"
  oil_capacity_liters DECIMAL(4,2),           -- e.g., 8.5
  oil_capacity_quarts DECIMAL(4,2),           -- e.g., 9.0
  oil_filter_oem_part TEXT,                   -- OEM part number
  oil_filter_alternatives TEXT[],             -- Compatible alternatives
  oil_change_interval_miles INTEGER,          -- e.g., 7500
  oil_change_interval_months INTEGER,         -- e.g., 12
  
  -- -------------------------------------------------------------------------
  -- COOLANT / ANTIFREEZE
  -- -------------------------------------------------------------------------
  coolant_type TEXT,                          -- e.g., "OAT", "Dex-Cool", "G12"
  coolant_color TEXT,                         -- e.g., "Pink", "Orange", "Blue"
  coolant_spec TEXT,                          -- e.g., "VW G13", "Porsche G40"
  coolant_capacity_liters DECIMAL(4,2),
  coolant_change_interval_miles INTEGER,
  coolant_change_interval_years INTEGER,
  
  -- -------------------------------------------------------------------------
  -- BRAKE FLUID
  -- -------------------------------------------------------------------------
  brake_fluid_type TEXT,                      -- e.g., "DOT 4", "DOT 5.1"
  brake_fluid_spec TEXT,                      -- e.g., "BMW DOT4 LV"
  brake_fluid_change_interval_miles INTEGER,
  brake_fluid_change_interval_years INTEGER,
  
  -- -------------------------------------------------------------------------
  -- TRANSMISSION FLUID
  -- -------------------------------------------------------------------------
  trans_fluid_manual TEXT,                    -- Manual trans fluid spec
  trans_fluid_manual_capacity DECIMAL(4,2),
  trans_fluid_auto TEXT,                      -- Auto/DCT trans fluid spec
  trans_fluid_auto_capacity DECIMAL(4,2),
  trans_fluid_change_interval_miles INTEGER,
  
  -- -------------------------------------------------------------------------
  -- DIFFERENTIAL FLUID
  -- -------------------------------------------------------------------------
  diff_fluid_type TEXT,
  diff_fluid_front_capacity DECIMAL(4,2),
  diff_fluid_rear_capacity DECIMAL(4,2),
  diff_fluid_change_interval_miles INTEGER,
  
  -- -------------------------------------------------------------------------
  -- POWER STEERING FLUID
  -- -------------------------------------------------------------------------
  power_steering_type TEXT,                   -- e.g., "ATF", "CHF 11S"
  power_steering_capacity DECIMAL(4,2),
  
  -- -------------------------------------------------------------------------
  -- FUEL REQUIREMENTS
  -- -------------------------------------------------------------------------
  fuel_type TEXT,                             -- "Premium Unleaded", "E85 Compatible"
  fuel_octane_minimum INTEGER,                -- e.g., 91
  fuel_octane_recommended INTEGER,            -- e.g., 93
  fuel_tank_capacity_gallons DECIMAL(4,1),
  fuel_tank_capacity_liters DECIMAL(5,1),
  
  -- -------------------------------------------------------------------------
  -- AIR FILTERS
  -- -------------------------------------------------------------------------
  air_filter_oem_part TEXT,
  air_filter_alternatives TEXT[],
  air_filter_change_interval_miles INTEGER,
  cabin_filter_oem_part TEXT,
  cabin_filter_alternatives TEXT[],
  cabin_filter_change_interval_miles INTEGER,
  
  -- -------------------------------------------------------------------------
  -- FUEL FILTER
  -- -------------------------------------------------------------------------
  fuel_filter_oem_part TEXT,
  fuel_filter_in_tank BOOLEAN DEFAULT false,  -- Some are in-tank, not serviceable
  fuel_filter_change_interval_miles INTEGER,
  
  -- -------------------------------------------------------------------------
  -- TIRES
  -- -------------------------------------------------------------------------
  tire_size_front TEXT,                       -- e.g., "245/35ZR20"
  tire_size_rear TEXT,                        -- e.g., "305/30ZR20"
  tire_pressure_front_psi INTEGER,
  tire_pressure_rear_psi INTEGER,
  tire_pressure_spare_psi INTEGER,
  tire_rotation_pattern TEXT,                 -- e.g., "Front to Rear", "Cross Pattern"
  tire_rotation_interval_miles INTEGER,
  tire_oem_brand TEXT,                        -- OEM tire brand
  tire_recommended_brands TEXT[],             -- Recommended replacements
  
  -- -------------------------------------------------------------------------
  -- WHEELS
  -- -------------------------------------------------------------------------
  wheel_size_front TEXT,                      -- e.g., "20x8.5"
  wheel_size_rear TEXT,                       -- e.g., "20x11"
  wheel_bolt_pattern TEXT,                    -- e.g., "5x130"
  wheel_center_bore_mm DECIMAL(5,2),          -- e.g., 71.6
  wheel_lug_torque_ft_lbs INTEGER,            -- e.g., 118
  wheel_lug_torque_nm INTEGER,                -- e.g., 160
  
  -- -------------------------------------------------------------------------
  -- BRAKES - FRONT
  -- -------------------------------------------------------------------------
  brake_front_rotor_diameter_mm INTEGER,
  brake_front_rotor_thickness_mm DECIMAL(4,2),
  brake_front_rotor_min_thickness_mm DECIMAL(4,2),
  brake_front_rotor_oem_part TEXT,
  brake_front_pad_oem_part TEXT,
  brake_front_pad_wear_indicator BOOLEAN,
  brake_front_caliper_type TEXT,              -- e.g., "Brembo 6-piston"
  
  -- -------------------------------------------------------------------------
  -- BRAKES - REAR
  -- -------------------------------------------------------------------------
  brake_rear_rotor_diameter_mm INTEGER,
  brake_rear_rotor_thickness_mm DECIMAL(4,2),
  brake_rear_rotor_min_thickness_mm DECIMAL(4,2),
  brake_rear_rotor_oem_part TEXT,
  brake_rear_pad_oem_part TEXT,
  brake_rear_pad_wear_indicator BOOLEAN,
  brake_rear_caliper_type TEXT,
  
  -- -------------------------------------------------------------------------
  -- SPARK PLUGS
  -- -------------------------------------------------------------------------
  spark_plug_type TEXT,                       -- e.g., "Iridium", "Platinum"
  spark_plug_gap_mm DECIMAL(4,3),
  spark_plug_oem_part TEXT,
  spark_plug_alternatives TEXT[],
  spark_plug_change_interval_miles INTEGER,
  spark_plug_quantity INTEGER,
  
  -- -------------------------------------------------------------------------
  -- TIMING SYSTEM
  -- -------------------------------------------------------------------------
  timing_type TEXT,                           -- "Chain" or "Belt"
  timing_change_interval_miles INTEGER,       -- Null if chain (typically lifetime)
  timing_change_interval_years INTEGER,
  timing_tensioner_oem_part TEXT,
  
  -- -------------------------------------------------------------------------
  -- SERPENTINE / DRIVE BELTS
  -- -------------------------------------------------------------------------
  serpentine_belt_oem_part TEXT,
  serpentine_belt_change_interval_miles INTEGER,
  ac_belt_separate BOOLEAN DEFAULT false,
  ac_belt_oem_part TEXT,
  
  -- -------------------------------------------------------------------------
  -- BATTERY
  -- -------------------------------------------------------------------------
  battery_group_size TEXT,                    -- e.g., "H7", "94R"
  battery_cca INTEGER,                        -- Cold Cranking Amps
  battery_voltage INTEGER DEFAULT 12,
  battery_oem_brand TEXT,
  battery_location TEXT,                      -- e.g., "Trunk", "Engine Bay"
  battery_agm BOOLEAN DEFAULT false,
  
  -- -------------------------------------------------------------------------
  -- ALTERNATOR
  -- -------------------------------------------------------------------------
  alternator_output_amps INTEGER,
  alternator_oem_part TEXT,
  
  -- -------------------------------------------------------------------------
  -- WIPER BLADES
  -- -------------------------------------------------------------------------
  wiper_driver_size_inches INTEGER,
  wiper_passenger_size_inches INTEGER,
  wiper_rear_size_inches INTEGER,
  wiper_type TEXT,                            -- e.g., "Beam", "Conventional"
  wiper_oem_part_driver TEXT,
  wiper_oem_part_passenger TEXT,
  wiper_oem_part_rear TEXT,
  
  -- -------------------------------------------------------------------------
  -- WASHER FLUID
  -- -------------------------------------------------------------------------
  washer_fluid_capacity_liters DECIMAL(4,2),
  washer_fluid_type TEXT,                     -- e.g., "All-season", "Winter rated"
  
  -- -------------------------------------------------------------------------
  -- HEADLIGHT / BULB SPECS
  -- -------------------------------------------------------------------------
  headlight_low_beam_type TEXT,               -- e.g., "H7", "LED Module"
  headlight_high_beam_type TEXT,
  headlight_fog_type TEXT,
  turn_signal_front_type TEXT,
  turn_signal_rear_type TEXT,
  brake_light_type TEXT,
  reverse_light_type TEXT,
  
  -- -------------------------------------------------------------------------
  -- ALIGNMENT SPECS
  -- -------------------------------------------------------------------------
  alignment_camber_front_degrees DECIMAL(4,2),
  alignment_camber_rear_degrees DECIMAL(4,2),
  alignment_toe_front_degrees DECIMAL(4,3),
  alignment_toe_rear_degrees DECIMAL(4,3),
  alignment_caster_degrees DECIMAL(4,2),
  
  -- -------------------------------------------------------------------------
  -- SUSPENSION
  -- -------------------------------------------------------------------------
  shock_front_oem_part TEXT,
  shock_rear_oem_part TEXT,
  spring_front_oem_part TEXT,
  spring_rear_oem_part TEXT,
  sway_bar_front_diameter_mm INTEGER,
  sway_bar_rear_diameter_mm INTEGER,
  
  -- -------------------------------------------------------------------------
  -- METADATA
  -- -------------------------------------------------------------------------
  source_manual_year INTEGER,                 -- Year of owner's manual sourced
  source_url TEXT,                            -- Reference URL if from online source
  verified_by TEXT,                           -- Who verified this data
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key to cars table
  CONSTRAINT fk_car_slug FOREIGN KEY (car_slug) 
    REFERENCES cars(slug) ON DELETE CASCADE
);

-- Index for quick lookups
CREATE INDEX idx_maintenance_specs_car_slug ON vehicle_maintenance_specs(car_slug);

-- ============================================================================
-- KNOWN ISSUES TABLE
-- Tracks common problems, recalls, and TSBs for each vehicle
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_known_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_slug TEXT NOT NULL,
  
  issue_type TEXT NOT NULL,                   -- "Recall", "TSB", "Common Issue"
  issue_title TEXT NOT NULL,
  issue_description TEXT,
  affected_years TEXT,                        -- e.g., "2015-2018"
  affected_vins TEXT,                         -- VIN range if applicable
  severity TEXT,                              -- "Low", "Medium", "High", "Critical"
  
  -- For recalls/TSBs
  recall_number TEXT,
  tsb_number TEXT,
  nhtsa_campaign_number TEXT,
  
  -- Resolution
  fix_description TEXT,
  estimated_repair_cost_low INTEGER,
  estimated_repair_cost_high INTEGER,
  diy_difficulty TEXT,                        -- "Easy", "Moderate", "Advanced", "Pro Only"
  
  -- Symptoms to watch for
  symptoms TEXT[],
  
  -- Source
  source_url TEXT,
  source_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_known_issues_car FOREIGN KEY (car_slug) 
    REFERENCES cars(slug) ON DELETE CASCADE
);

CREATE INDEX idx_known_issues_car_slug ON vehicle_known_issues(car_slug);
CREATE INDEX idx_known_issues_type ON vehicle_known_issues(issue_type);

-- ============================================================================
-- SERVICE INTERVALS TABLE
-- Comprehensive service schedule based on mileage/time
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_service_intervals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_slug TEXT NOT NULL,
  
  service_name TEXT NOT NULL,                 -- e.g., "Oil Change", "Major Service"
  service_description TEXT,
  
  -- Interval triggers (whichever comes first)
  interval_miles INTEGER,
  interval_months INTEGER,
  
  -- What's included
  items_included TEXT[],                      -- e.g., ["Oil", "Oil Filter", "Inspection"]
  
  -- Cost estimates
  dealer_cost_low INTEGER,
  dealer_cost_high INTEGER,
  independent_cost_low INTEGER,
  independent_cost_high INTEGER,
  diy_cost_low INTEGER,
  diy_cost_high INTEGER,
  
  -- Time estimate
  labor_hours_estimate DECIMAL(4,2),
  
  -- Importance
  is_critical BOOLEAN DEFAULT false,         -- Skip at your peril
  skip_consequences TEXT,                     -- What happens if you skip this
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_service_intervals_car FOREIGN KEY (car_slug) 
    REFERENCES cars(slug) ON DELETE CASCADE
);

CREATE INDEX idx_service_intervals_car_slug ON vehicle_service_intervals(car_slug);

-- ============================================================================
-- OEM PARTS CATALOG
-- Reference table for commonly needed parts with alternatives
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_oem_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  car_slug TEXT NOT NULL,
  
  part_category TEXT NOT NULL,                -- "Filter", "Brake", "Fluid", etc.
  part_name TEXT NOT NULL,                    -- "Oil Filter", "Front Brake Pad Set"
  part_location TEXT,                         -- "Front", "Rear", "Driver Side"
  
  oem_part_number TEXT,
  oem_brand TEXT,                             -- e.g., "Genuine Porsche"
  oem_price_usd DECIMAL(10,2),
  
  -- Quality aftermarket alternatives
  alternatives JSONB,                         -- Array of {brand, part_number, price, quality_tier}
  
  -- Notes
  notes TEXT,
  interchange_numbers TEXT[],                 -- Cross-reference part numbers
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_oem_parts_car FOREIGN KEY (car_slug) 
    REFERENCES cars(slug) ON DELETE CASCADE
);

CREATE INDEX idx_oem_parts_car_slug ON vehicle_oem_parts(car_slug);
CREATE INDEX idx_oem_parts_category ON vehicle_oem_parts(part_category);

-- ============================================================================
-- USER SERVICE LOGS
-- Track user's actual service history on their vehicles
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_service_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_vehicle_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  service_date DATE NOT NULL,
  service_type TEXT NOT NULL,                 -- "Oil Change", "Brake Service", etc.
  service_description TEXT,
  
  -- Mileage at service
  odometer_reading INTEGER,
  
  -- Who performed
  performed_by TEXT,                          -- "Self", "Dealer", "Independent Shop"
  shop_name TEXT,
  
  -- Cost tracking
  parts_cost DECIMAL(10,2),
  labor_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  
  -- Parts used
  parts_used JSONB,                           -- Array of {name, part_number, brand, quantity}
  
  -- Receipts/docs
  receipt_url TEXT,
  notes TEXT,
  
  -- Next service reminder
  next_service_miles INTEGER,
  next_service_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_service_logs_vehicle FOREIGN KEY (user_vehicle_id) 
    REFERENCES user_vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_service_logs_user FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_service_logs_user_id ON user_service_logs(user_id);
CREATE INDEX idx_service_logs_vehicle_id ON user_service_logs(user_vehicle_id);

-- Enable RLS
ALTER TABLE user_service_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service logs
CREATE POLICY "Users can view own service logs" ON user_service_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service logs" ON user_service_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service logs" ON user_service_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own service logs" ON user_service_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTION: Get maintenance specs for AI Mechanic
-- ============================================================================

CREATE OR REPLACE FUNCTION get_car_maintenance_summary(p_car_slug TEXT)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'oil', jsonb_build_object(
      'type', oil_type,
      'viscosity', oil_viscosity,
      'capacity_quarts', oil_capacity_quarts,
      'change_interval_miles', oil_change_interval_miles
    ),
    'fuel', jsonb_build_object(
      'type', fuel_type,
      'octane_minimum', fuel_octane_minimum,
      'octane_recommended', fuel_octane_recommended,
      'tank_capacity_gallons', fuel_tank_capacity_gallons
    ),
    'coolant', jsonb_build_object(
      'type', coolant_type,
      'spec', coolant_spec
    ),
    'brake_fluid', jsonb_build_object(
      'type', brake_fluid_type
    ),
    'tires', jsonb_build_object(
      'front', tire_size_front,
      'rear', tire_size_rear,
      'pressure_front', tire_pressure_front_psi,
      'pressure_rear', tire_pressure_rear_psi
    ),
    'wipers', jsonb_build_object(
      'driver', wiper_driver_size_inches,
      'passenger', wiper_passenger_size_inches,
      'rear', wiper_rear_size_inches
    ),
    'battery', jsonb_build_object(
      'group_size', battery_group_size,
      'cca', battery_cca,
      'agm', battery_agm
    )
  ) INTO result
  FROM vehicle_maintenance_specs
  WHERE car_slug = p_car_slug;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- UPDATE TRIGGER
-- ============================================================================

CREATE TRIGGER update_maintenance_specs_timestamp
  BEFORE UPDATE ON vehicle_maintenance_specs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_known_issues_timestamp
  BEFORE UPDATE ON vehicle_known_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oem_parts_timestamp
  BEFORE UPDATE ON vehicle_oem_parts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_logs_timestamp
  BEFORE UPDATE ON user_service_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE vehicle_maintenance_specs IS 'Comprehensive OEM maintenance specifications for each vehicle in our database';
COMMENT ON TABLE vehicle_known_issues IS 'Common problems, recalls, and TSBs for vehicles';
COMMENT ON TABLE vehicle_service_intervals IS 'Recommended service schedules with cost estimates';
COMMENT ON TABLE vehicle_oem_parts IS 'OEM part numbers and quality aftermarket alternatives';
COMMENT ON TABLE user_service_logs IS 'User-entered service history for their personal vehicles';
