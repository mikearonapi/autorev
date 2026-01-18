-- ============================================================================
-- Migration 100: Vehicle Physics Parameters
-- 
-- Purpose: Store detailed physics parameters for comprehensive vehicle modeling
-- 
-- SAFETY: This migration ONLY ADDS new tables. No existing tables are modified.
-- ============================================================================

-- ============================================================================
-- 1. Vehicle Physics Parameters - Core physical characteristics
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_physics_params (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE UNIQUE,
  
  -- ==========================================================================
  -- WEIGHT & BALANCE
  -- ==========================================================================
  curb_weight_lbs INTEGER,
  front_weight_percent DECIMAL(4,1),  -- e.g., 52.5
  
  -- Center of gravity
  cg_height_inches DECIMAL(5,2),  -- Height from ground
  cg_longitudinal_inches DECIMAL(5,2),  -- From front axle
  
  -- Unsprung weight
  unsprung_weight_front_lbs INTEGER,  -- Per corner
  unsprung_weight_rear_lbs INTEGER,
  
  -- Moment of inertia
  yaw_moi_kg_m2 INTEGER,  -- Rotational inertia about vertical axis
  
  -- ==========================================================================
  -- DIMENSIONS
  -- ==========================================================================
  wheelbase_inches DECIMAL(5,1),
  track_width_front_inches DECIMAL(5,1),
  track_width_rear_inches DECIMAL(5,1),
  overall_length_inches DECIMAL(5,1),
  overall_width_inches DECIMAL(5,1),
  overall_height_inches DECIMAL(5,1),
  ground_clearance_inches DECIMAL(4,2),
  
  -- ==========================================================================
  -- DRIVETRAIN
  -- ==========================================================================
  drivetrain TEXT CHECK (drivetrain IN ('FWD', 'RWD', 'AWD', '4WD')),
  transmission_type TEXT CHECK (transmission_type IN ('manual', 'auto', 'dct', 'cvt', 'single-speed')),
  gear_count INTEGER,
  gear_ratios JSONB,  -- [3.5, 2.1, 1.4, 1.0, 0.8, 0.65]
  final_drive_ratio DECIMAL(4,2),
  limited_slip_type TEXT,  -- 'open', 'lsd', 'torsen', 'clutch', 'electronic'
  
  -- ==========================================================================
  -- ENGINE
  -- ==========================================================================
  peak_hp INTEGER,
  peak_hp_rpm INTEGER,
  peak_torque_lb_ft INTEGER,
  peak_torque_rpm INTEGER,
  redline_rpm INTEGER,
  rev_limit_rpm INTEGER,
  
  -- Aspiration
  aspiration TEXT CHECK (aspiration IN ('NA', 'Turbo', 'TwinTurbo', 'Supercharged', 'TwinSC', 'Electric', 'Hybrid')),
  boost_psi_stock DECIMAL(4,1),
  boost_psi_max DECIMAL(4,1),  -- With tune potential
  
  -- Forced induction details
  turbo_size_mm INTEGER,  -- Compressor wheel diameter
  turbo_type TEXT,  -- 'journal', 'ball-bearing', 'efr'
  supercharger_type TEXT,  -- 'roots', 'twin-screw', 'centrifugal'
  intercooler_type TEXT,  -- 'air-air', 'air-water'
  
  -- ==========================================================================
  -- AERODYNAMICS
  -- ==========================================================================
  drag_coefficient DECIMAL(4,3),  -- Cd, e.g., 0.320
  frontal_area_sqft DECIMAL(4,1),
  lift_coefficient_front DECIMAL(5,3),  -- Positive = lift, negative = downforce
  lift_coefficient_rear DECIMAL(5,3),
  downforce_100mph_lbs INTEGER,  -- Total at 100 mph
  
  -- ==========================================================================
  -- SUSPENSION
  -- ==========================================================================
  suspension_type_front TEXT,  -- 'macpherson', 'double-wishbone', 'multilink'
  suspension_type_rear TEXT,
  spring_rate_front_lbs_in INTEGER,
  spring_rate_rear_lbs_in INTEGER,
  sway_bar_front_mm INTEGER,
  sway_bar_rear_mm INTEGER,
  
  -- Geometry
  camber_front_deg DECIMAL(3,1),  -- Static, negative
  camber_rear_deg DECIMAL(3,1),
  toe_front_deg DECIMAL(3,2),
  toe_rear_deg DECIMAL(3,2),
  caster_deg DECIMAL(3,1),
  
  -- Roll centers
  roll_center_front_inches DECIMAL(4,2),
  roll_center_rear_inches DECIMAL(4,2),
  
  -- ==========================================================================
  -- BRAKES
  -- ==========================================================================
  brake_rotor_front_mm INTEGER,
  brake_rotor_rear_mm INTEGER,
  brake_caliper_pistons_front INTEGER,  -- e.g., 4 for 4-piston
  brake_caliper_pistons_rear INTEGER,
  brake_pad_type TEXT,  -- 'stock', 'sport', 'track', 'race'
  abs_type TEXT,  -- 'standard', 'performance', 'track', 'none'
  
  -- ==========================================================================
  -- TIRES & WHEELS
  -- ==========================================================================
  tire_width_front_mm INTEGER,
  tire_aspect_front INTEGER,
  wheel_diameter_front INTEGER,
  tire_width_rear_mm INTEGER,
  tire_aspect_rear INTEGER,
  wheel_diameter_rear INTEGER,
  tire_compound_stock TEXT,  -- 'all-season', 'summer', 'performance', etc.
  
  -- ==========================================================================
  -- COOLING
  -- ==========================================================================
  radiator_type TEXT,  -- 'stock', 'aluminum', 'dual-pass'
  oil_cooler BOOLEAN DEFAULT false,
  transmission_cooler BOOLEAN DEFAULT false,
  differential_cooler BOOLEAN DEFAULT false,
  
  -- ==========================================================================
  -- PERFORMANCE FIGURES (Verified/Documented)
  -- ==========================================================================
  zero_to_60_seconds DECIMAL(4,2),
  zero_to_100_seconds DECIMAL(4,2),
  quarter_mile_seconds DECIMAL(4,2),
  quarter_mile_mph DECIMAL(5,1),
  top_speed_mph INTEGER,
  lateral_g_skidpad DECIMAL(3,2),
  braking_60_0_ft INTEGER,
  braking_100_0_ft INTEGER,
  nurburgring_time_seconds INTEGER,  -- For cars with official times
  
  -- ==========================================================================
  -- METADATA
  -- ==========================================================================
  data_source TEXT,  -- 'manufacturer', 'tested', 'estimated'
  data_confidence DECIMAL(3,2) DEFAULT 0.7,  -- 0-1 confidence in data
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_physics_car_id ON vehicle_physics_params(car_id);

-- ==========================================================================
-- 2. Vehicle Modification Effects - How mods change physics params
-- ==========================================================================
CREATE TABLE IF NOT EXISTS modification_physics_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Modification identification
  mod_key TEXT NOT NULL,  -- e.g., 'coilovers-track', 'bbk-6piston'
  mod_category TEXT NOT NULL,  -- 'suspension', 'brakes', 'aero', 'weight', 'engine'
  
  -- Effects on physics parameters (as deltas or multipliers)
  effects JSONB NOT NULL,  -- {"spring_rate_front_multiplier": 1.5, "weight_change_lbs": -20}
  
  -- Conditions for the effect
  applies_to_drivetrain JSONB,  -- ['RWD', 'AWD'] or null for all
  applies_to_aspiration JSONB,  -- ['Turbo', 'TwinTurbo'] or null for all
  
  -- Description
  name TEXT NOT NULL,
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for mod lookups
CREATE INDEX IF NOT EXISTS idx_mod_effects_key ON modification_physics_effects(mod_key);
CREATE INDEX IF NOT EXISTS idx_mod_effects_category ON modification_physics_effects(mod_category);

-- ==========================================================================
-- 3. Seed common modification effects
-- ==========================================================================
INSERT INTO modification_physics_effects (mod_key, mod_category, name, effects, description) VALUES

-- SUSPENSION MODS
('springs-lowering-mild', 'suspension', 'Mild Lowering Springs', 
  '{"ground_clearance_change_inches": -1.0, "spring_rate_front_multiplier": 1.15, "spring_rate_rear_multiplier": 1.15, "cg_height_change_inches": -0.4}',
  '1" drop, 15% stiffer'),

('springs-lowering-aggressive', 'suspension', 'Aggressive Lowering Springs',
  '{"ground_clearance_change_inches": -2.0, "spring_rate_front_multiplier": 1.35, "spring_rate_rear_multiplier": 1.35, "cg_height_change_inches": -0.8}',
  '2" drop, 35% stiffer'),

('coilovers-street', 'suspension', 'Street Coilovers',
  '{"ground_clearance_change_inches": -1.5, "spring_rate_front_multiplier": 1.4, "spring_rate_rear_multiplier": 1.4, "cg_height_change_inches": -0.6, "adjustable": true}',
  'Height and damping adjustable'),

('coilovers-track', 'suspension', 'Track Coilovers',
  '{"ground_clearance_change_inches": -2.0, "spring_rate_front_multiplier": 2.0, "spring_rate_rear_multiplier": 2.0, "cg_height_change_inches": -0.8}',
  'High-performance track setup'),

('swaybar-front-upgrade', 'suspension', 'Front Sway Bar Upgrade',
  '{"sway_bar_front_multiplier": 1.3, "understeer_tendency": "increased"}',
  'Reduces body roll, adds understeer'),

('swaybar-rear-upgrade', 'suspension', 'Rear Sway Bar Upgrade',
  '{"sway_bar_rear_multiplier": 1.4, "oversteer_tendency": "increased"}',
  'Reduces body roll, adds oversteer'),

-- BRAKE MODS
('bbk-4piston', 'brakes', '4-Piston Big Brake Kit',
  '{"brake_rotor_front_change_mm": 30, "brake_caliper_pistons_front": 4, "unsprung_weight_front_change_lbs": 2}',
  'Significant stopping improvement'),

('bbk-6piston', 'brakes', '6-Piston Big Brake Kit',
  '{"brake_rotor_front_change_mm": 50, "brake_caliper_pistons_front": 6, "unsprung_weight_front_change_lbs": 4}',
  'Race-level braking'),

('brake-pads-track', 'brakes', 'Track Brake Pads',
  '{"brake_pad_type": "track", "braking_improvement_percent": 10}',
  'Better hot performance'),

-- AERO MODS
('wing-gt', 'aero', 'GT-Style Wing',
  '{"drag_coefficient_change": 0.02, "lift_coefficient_rear_change": -0.15}',
  'Adds rear downforce'),

('wing-high-downforce', 'aero', 'High Downforce Wing',
  '{"drag_coefficient_change": 0.04, "lift_coefficient_rear_change": -0.30}',
  'Maximum rear downforce'),

('splitter-race', 'aero', 'Race Splitter',
  '{"drag_coefficient_change": 0.015, "lift_coefficient_front_change": -0.15}',
  'Front downforce'),

('diffuser', 'aero', 'Rear Diffuser',
  '{"drag_coefficient_change": -0.01, "lift_coefficient_rear_change": -0.10}',
  'Reduces drag, adds downforce'),

('aero-kit-track', 'aero', 'Full Track Aero Package',
  '{"drag_coefficient_change": 0.03, "lift_coefficient_front_change": -0.20, "lift_coefficient_rear_change": -0.35}',
  'Splitter, wing, diffuser'),

-- WEIGHT MODS
('hood-carbon', 'weight', 'Carbon Fiber Hood',
  '{"weight_change_lbs": -20, "cg_height_change_inches": -0.3, "weight_change_location": "front"}',
  'Lightweight carbon hood'),

('wheels-lightweight', 'weight', 'Lightweight Wheels',
  '{"unsprung_weight_front_change_lbs": -4, "unsprung_weight_rear_change_lbs": -4}',
  '-4 lbs per wheel'),

('seats-bucket', 'weight', 'Lightweight Bucket Seats',
  '{"weight_change_lbs": -30, "cg_height_change_inches": -0.2}',
  'Racing bucket seats'),

('interior-strip', 'weight', 'Interior Strip',
  '{"weight_change_lbs": -80, "cg_height_change_inches": -0.2}',
  'Remove carpet, sound deadening'),

-- TIRE MODS
('tires-200tw', 'tires', '200TW Track Tires',
  '{"tire_compound_stock": "track-200tw", "lateral_g_improvement": 0.15}',
  'Street-legal track tires'),

('tires-wider-20mm', 'tires', '+20mm Wider Tires',
  '{"tire_width_front_change_mm": 20, "tire_width_rear_change_mm": 20, "lateral_g_improvement": 0.05}',
  'Wider contact patch')

ON CONFLICT DO NOTHING;

-- ==========================================================================
-- 4. Trigger to auto-update timestamp
-- ==========================================================================
CREATE OR REPLACE FUNCTION update_physics_params_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_physics_params_updated ON vehicle_physics_params;
CREATE TRIGGER trigger_physics_params_updated
  BEFORE UPDATE ON vehicle_physics_params
  FOR EACH ROW
  EXECUTE FUNCTION update_physics_params_timestamp();

-- ==========================================================================
-- Done! All changes are additive and safe.
-- ==========================================================================
