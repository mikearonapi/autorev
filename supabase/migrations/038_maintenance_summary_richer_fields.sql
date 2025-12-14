-- ============================================================================
-- Migration 038: Expand get_car_maintenance_summary() JSON keys
--
-- Why:
-- - vehicle_maintenance_specs contains interval months/years + capacities that
--   weren't exposed in the summary JSON.
-- - Frontend + AL rely on the summary for quick, structured answers.
-- - Provide both "change_interval_*" and "interval_*" aliases for compatibility.
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
      'spec', oil_spec,
      'capacity_quarts', oil_capacity_quarts,
      'capacity_liters', oil_capacity_liters,
      'change_interval_miles', oil_change_interval_miles,
      'change_interval_months', oil_change_interval_months,
      'interval_miles', oil_change_interval_miles,
      'interval_months', oil_change_interval_months
    ),
    'fuel', jsonb_build_object(
      'type', fuel_type,
      'octane_minimum', fuel_octane_minimum,
      'octane_recommended', fuel_octane_recommended,
      'tank_capacity_gallons', fuel_tank_capacity_gallons,
      'tank_capacity_liters', fuel_tank_capacity_liters
    ),
    'coolant', jsonb_build_object(
      'type', coolant_type,
      'spec', coolant_spec,
      'capacity_liters', coolant_capacity_liters,
      'change_interval_miles', coolant_change_interval_miles,
      'change_interval_years', coolant_change_interval_years,
      'interval_miles', coolant_change_interval_miles,
      'interval_years', coolant_change_interval_years
    ),
    'brake_fluid', jsonb_build_object(
      'type', brake_fluid_type,
      'spec', brake_fluid_spec,
      'change_interval_miles', brake_fluid_change_interval_miles,
      'change_interval_years', brake_fluid_change_interval_years,
      'interval_miles', brake_fluid_change_interval_miles,
      'interval_years', brake_fluid_change_interval_years
    ),
    'tires', jsonb_build_object(
      'front', tire_size_front,
      'rear', tire_size_rear,
      'size_front', tire_size_front,
      'size_rear', tire_size_rear,
      'pressure_front', tire_pressure_front_psi,
      'pressure_rear', tire_pressure_rear_psi,
      'pressure_front_psi', tire_pressure_front_psi,
      'pressure_rear_psi', tire_pressure_rear_psi
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

