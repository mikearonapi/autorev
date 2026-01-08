-- ============================================================================
-- Migration: 071_analyze_vehicle_health_rpc.sql
-- Purpose: Add RPC function for AL analyze_vehicle_health tool
-- Date: 2025-12-29
-- Notes:
--   - Fetches user vehicle with all tracking fields
--   - Cross-references service intervals, maintenance specs, known issues
--   - Fetches user service logs for completed maintenance
--   - Returns comprehensive data for health analysis
-- ============================================================================

-- ============================================================================
-- FUNCTION: analyze_vehicle_health_data
-- Fetches all data needed to analyze a user's vehicle health in one call
-- ============================================================================

CREATE OR REPLACE FUNCTION analyze_vehicle_health_data(
  p_user_id UUID,
  p_vehicle_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_vehicle RECORD;
  v_car_slug TEXT;
  v_result JSONB;
  v_service_intervals JSONB;
  v_maintenance_specs JSONB;
  v_known_issues JSONB;
  v_service_logs JSONB;
  v_car_info JSONB;
BEGIN
  -- Get the vehicle (either specified or first in garage)
  IF p_vehicle_id IS NOT NULL THEN
    SELECT * INTO v_vehicle
    FROM user_vehicles
    WHERE id = p_vehicle_id AND user_id = p_user_id;
  ELSE
    SELECT * INTO v_vehicle
    FROM user_vehicles
    WHERE user_id = p_user_id
    ORDER BY is_primary DESC, created_at DESC
    LIMIT 1;
  END IF;
  
  -- Return error if no vehicle found
  IF v_vehicle IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Vehicle not found',
      'error_code', 'NO_VEHICLE'
    );
  END IF;
  
  -- Determine car_slug (matched_car_slug or try to find a match)
  v_car_slug := v_vehicle.matched_car_slug;
  
  -- Build vehicle data object
  v_result := jsonb_build_object(
    'vehicle', jsonb_build_object(
      'id', v_vehicle.id,
      'user_id', v_vehicle.user_id,
      'nickname', v_vehicle.nickname,
      'year', v_vehicle.year,
      'make', v_vehicle.make,
      'model', v_vehicle.model,
      'trim', v_vehicle.trim,
      'vin', v_vehicle.vin,
      'matched_car_slug', v_vehicle.matched_car_slug,
      'current_mileage', v_vehicle.mileage,
      'color', v_vehicle.color,
      'purchase_date', v_vehicle.purchase_date,
      'ownership_status', v_vehicle.ownership_status,
      -- Tracking fields
      'last_started_at', v_vehicle.last_started_at,
      'battery_status', v_vehicle.battery_status,
      'battery_installed_date', v_vehicle.battery_installed_date,
      'storage_mode', v_vehicle.storage_mode,
      'tire_installed_date', v_vehicle.tire_installed_date,
      'tire_brand_model', v_vehicle.tire_brand_model,
      'tire_tread_32nds', v_vehicle.tire_tread_32nds,
      'registration_due_date', v_vehicle.registration_due_date,
      'inspection_due_date', v_vehicle.inspection_due_date,
      'last_inspection_date', v_vehicle.last_inspection_date,
      'last_oil_change_date', v_vehicle.last_oil_change_date,
      'last_oil_change_mileage', v_vehicle.last_oil_change_mileage,
      'next_oil_due_mileage', v_vehicle.next_oil_due_mileage,
      'owner_notes', v_vehicle.owner_notes,
      'health_last_analyzed_at', v_vehicle.health_last_analyzed_at
    )
  );
  
  -- Get car info if matched
  IF v_car_slug IS NOT NULL THEN
    SELECT jsonb_build_object(
      'slug', c.slug,
      'name', c.name,
      'years', c.years,
      'brand', c.brand,
      'engine', c.engine,
      'hp', c.hp,
      'tier', c.tier,
      'score_reliability', c.score_reliability
    ) INTO v_car_info
    FROM cars c
    WHERE c.slug = v_car_slug;
    
    v_result := v_result || jsonb_build_object('car', v_car_info);
  END IF;
  
  -- Get service intervals for this car
  IF v_car_slug IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'service_name', si.service_name,
        'service_description', si.service_description,
        'interval_miles', si.interval_miles,
        'interval_months', si.interval_months,
        'items_included', si.items_included,
        'dealer_cost_low', si.dealer_cost_low,
        'dealer_cost_high', si.dealer_cost_high,
        'diy_cost_low', si.diy_cost_low,
        'diy_cost_high', si.diy_cost_high,
        'is_critical', si.is_critical,
        'skip_consequences', si.skip_consequences
      ) ORDER BY si.interval_miles NULLS LAST, si.service_name
    ), '[]'::jsonb) INTO v_service_intervals
    FROM vehicle_service_intervals si
    WHERE si.car_slug = v_car_slug;
    
    v_result := v_result || jsonb_build_object('service_intervals', v_service_intervals);
  END IF;
  
  -- Get maintenance specs
  IF v_car_slug IS NOT NULL THEN
    SELECT jsonb_build_object(
      'oil', jsonb_build_object(
        'type', ms.oil_type,
        'viscosity', ms.oil_viscosity,
        'spec', ms.oil_spec,
        'capacity_quarts', ms.oil_capacity_quarts,
        'interval_miles', ms.oil_change_interval_miles,
        'interval_months', ms.oil_change_interval_months,
        'filter_oem_part', ms.oil_filter_oem_part
      ),
      'coolant', jsonb_build_object(
        'type', ms.coolant_type,
        'spec', ms.coolant_spec,
        'interval_miles', ms.coolant_change_interval_miles,
        'interval_years', ms.coolant_change_interval_years
      ),
      'brake_fluid', jsonb_build_object(
        'type', ms.brake_fluid_type,
        'spec', ms.brake_fluid_spec,
        'interval_miles', ms.brake_fluid_change_interval_miles,
        'interval_years', ms.brake_fluid_change_interval_years
      ),
      'spark_plugs', jsonb_build_object(
        'interval_miles', ms.spark_plug_change_interval_miles,
        'type', ms.spark_plug_type
      ),
      'trans_fluid', jsonb_build_object(
        'manual_type', ms.trans_fluid_manual,
        'auto_type', ms.trans_fluid_auto,
        'interval_miles', ms.trans_fluid_change_interval_miles
      ),
      'air_filter_interval_miles', ms.air_filter_change_interval_miles,
      'cabin_filter_interval_miles', ms.cabin_filter_change_interval_miles,
      'timing_type', ms.timing_type,
      'timing_interval_miles', ms.timing_change_interval_miles,
      'tire_rotation_interval_miles', ms.tire_rotation_interval_miles,
      'battery', jsonb_build_object(
        'group_size', ms.battery_group_size,
        'cca', ms.battery_cca,
        'agm', ms.battery_agm,
        'location', ms.battery_location
      )
    ) INTO v_maintenance_specs
    FROM vehicle_maintenance_specs ms
    WHERE ms.car_slug = v_car_slug;
    
    v_result := v_result || jsonb_build_object('maintenance_specs', v_maintenance_specs);
  END IF;
  
  -- Get known issues for this car (relevant to current mileage)
  IF v_car_slug IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'title', ci.title,
        'kind', ci.kind,
        'severity', ci.severity,
        'affected_years_text', ci.affected_years_text,
        'description', ci.description,
        'symptoms', ci.symptoms,
        'prevention', ci.prevention,
        'fix_description', ci.fix_description,
        'estimated_cost_low', ci.estimated_cost_low,
        'estimated_cost_high', ci.estimated_cost_high,
        'mileage_range_low', ci.mileage_range_low,
        'mileage_range_high', ci.mileage_range_high,
        'source_url', ci.source_url
      ) ORDER BY 
        CASE ci.severity 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
          ELSE 5 
        END,
        ci.sort_order NULLS LAST
    ), '[]'::jsonb) INTO v_known_issues
    FROM car_issues ci
    WHERE ci.car_slug = v_car_slug;
    
    v_result := v_result || jsonb_build_object('known_issues', v_known_issues);
  END IF;
  
  -- Get user's service logs for this vehicle
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', sl.id,
      'service_date', sl.service_date,
      'service_type', sl.service_type,
      'service_description', sl.service_description,
      'odometer_reading', sl.odometer_reading,
      'performed_by', sl.performed_by,
      'shop_name', sl.shop_name,
      'total_cost', sl.total_cost,
      'parts_used', sl.parts_used,
      'next_service_miles', sl.next_service_miles,
      'next_service_date', sl.next_service_date
    ) ORDER BY sl.service_date DESC
  ), '[]'::jsonb) INTO v_service_logs
  FROM user_service_logs sl
  WHERE sl.user_vehicle_id = v_vehicle.id;
  
  v_result := v_result || jsonb_build_object('service_logs', v_service_logs);
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION analyze_vehicle_health_data TO authenticated;

-- Update health_last_analyzed_at when tool is used
CREATE OR REPLACE FUNCTION update_vehicle_health_analyzed(p_vehicle_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_vehicles
  SET health_last_analyzed_at = NOW()
  WHERE id = p_vehicle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_vehicle_health_analyzed TO authenticated;

COMMENT ON FUNCTION analyze_vehicle_health_data IS 
  'Fetches comprehensive vehicle data for AL analyze_vehicle_health tool. Returns vehicle tracking fields, service intervals, maintenance specs, known issues, and service logs.';












