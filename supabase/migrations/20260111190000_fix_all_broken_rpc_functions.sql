-- Migration: Fix All Broken RPC Functions After car_slug Column Removal
-- Date: January 11, 2026
-- Purpose: Fix all database functions that referenced car_slug on tables that no longer have that column
--
-- BACKGROUND:
-- The database cleanup on 2026-01-11 removed car_slug columns from many tables in favor of car_id.
-- However, numerous RPC functions were still referencing the removed columns.
--
-- TABLES THAT NO LONGER HAVE car_slug (use car_id instead):
-- - car_dyno_runs
-- - car_fuel_economy
-- - car_issues
-- - car_market_pricing
-- - car_recalls
-- - car_safety_data
-- - car_track_lap_times
-- - vehicle_maintenance_specs
-- - vehicle_service_intervals
-- - wheel_tire_fitment_options
-- - youtube_video_car_links
--
-- TABLES THAT STILL HAVE car_slug:
-- - user_favorites (car_slug + car_id)
-- - user_projects (car_slug + car_id)
-- - user_vehicles (matched_car_slug + matched_car_id)
-- - vehicle_known_issues (deprecated, still has car_slug)
-- - car_pipeline_runs (intentionally kept)
-- - al_articles (car_slugs array - references slugs, not a join column)

-- ============================================================================
-- 1. FIX: resolve_car_id_from_slug trigger function
-- ============================================================================
CREATE OR REPLACE FUNCTION resolve_car_id_from_slug()
RETURNS TRIGGER AS $$
DECLARE
  resolved_id UUID;
BEGIN
  -- Handle user_vehicles table (uses matched_car_slug/matched_car_id)
  IF TG_TABLE_NAME = 'user_vehicles' THEN
    IF NEW.matched_car_id IS NULL AND NEW.matched_car_slug IS NOT NULL THEN
      SELECT id INTO resolved_id FROM cars WHERE slug = NEW.matched_car_slug;
      IF resolved_id IS NOT NULL THEN
        NEW.matched_car_id := resolved_id;
      END IF;
    END IF;
  -- Handle youtube_ingestion_queue (uses target_car_slug/target_car_id)
  ELSIF TG_TABLE_NAME = 'youtube_ingestion_queue' THEN
    IF NEW.target_car_id IS NULL AND NEW.target_car_slug IS NOT NULL THEN
      SELECT id INTO resolved_id FROM cars WHERE slug = NEW.target_car_slug;
      IF resolved_id IS NOT NULL THEN
        NEW.target_car_id := resolved_id;
      END IF;
    END IF;
  -- Handle standard tables with car_slug/car_id columns
  ELSIF NEW.car_id IS NULL AND NEW.car_slug IS NOT NULL THEN
    SELECT id INTO resolved_id FROM cars WHERE slug = NEW.car_slug;
    IF resolved_id IS NOT NULL THEN
      NEW.car_id := resolved_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. FIX: get_vehicle_merged_specs
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
  SELECT id, matched_car_slug, matched_car_id, custom_specs
  INTO v_vehicle
  FROM user_vehicles
  WHERE id = p_vehicle_id;
  
  IF v_vehicle IS NULL THEN
    RETURN NULL;
  END IF;
  
  IF v_vehicle.matched_car_id IS NOT NULL THEN
    SELECT 
      wheel_size_front, wheel_size_rear, wheel_bolt_pattern,
      wheel_center_bore_mm, wheel_lug_torque_ft_lbs,
      tire_size_front, tire_size_rear,
      tire_pressure_front_psi, tire_pressure_rear_psi,
      oil_type, oil_viscosity, oil_capacity_liters,
      coolant_type, brake_fluid_type
    INTO v_stock_specs
    FROM vehicle_maintenance_specs
    WHERE car_id = v_vehicle.matched_car_id;
  END IF;
  
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

-- ============================================================================
-- 3. FIX: get_car_for_al
-- ============================================================================
CREATE OR REPLACE FUNCTION get_car_for_al(p_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  v_car_id UUID;
BEGIN
  SELECT id INTO v_car_id FROM cars WHERE slug = p_slug;
  IF v_car_id IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;

  SELECT jsonb_build_object(
    'car', jsonb_build_object(
      'slug', c.slug, 'name', c.name, 'brand', c.brand, 'years', c.years,
      'tier', c.tier, 'category', c.category, 'hp', c.hp, 'torque', c.torque,
      'engine', c.engine, 'trans', c.trans, 'drivetrain', c.drivetrain,
      'curb_weight', c.curb_weight, 'zero_to_sixty', c.zero_to_sixty,
      'quarter_mile', c.quarter_mile, 'braking_60_0', c.braking_60_0,
      'lateral_g', c.lateral_g, 'price_range', c.price_range, 'price_avg', c.price_avg,
      'manual_available', c.manual_available,
      'scores', jsonb_build_object(
        'sound', c.score_sound, 'interior', c.score_interior, 'track', c.score_track,
        'reliability', c.score_reliability, 'value', c.score_value,
        'driver_fun', c.score_driver_fun, 'aftermarket', c.score_aftermarket
      ),
      'essence', c.essence, 'highlight', c.highlight, 'ideal_owner', c.ideal_owner,
      'not_ideal_for', c.not_ideal_for, 'buyers_summary', c.buyers_summary,
      'pros', c.pros, 'cons', c.cons, 'common_issues_detailed', c.common_issues_detailed,
      'annual_ownership_cost', c.annual_ownership_cost, 'major_service_costs', c.major_service_costs,
      'upgrade_recommendations', c.upgrade_recommendations
    ),
    'maintenance', (SELECT get_car_maintenance_summary(p_slug)),
    'known_issues', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'type', ki.issue_type, 'title', ki.issue_title, 'severity', ki.severity,
        'description', ki.issue_description, 'fix', ki.fix_description,
        'cost_low', ki.estimated_repair_cost_low, 'cost_high', ki.estimated_repair_cost_high
      )), '[]'::jsonb)
      FROM vehicle_known_issues ki WHERE ki.car_slug = p_slug
    ),
    'videos', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'title', v.title, 'channel', v.channel_name, 'summary', v.summary,
        'one_liner', v.one_line_take, 'pros', v.pros_mentioned, 'cons', v.cons_mentioned
      ) ORDER BY v.view_count DESC NULLS LAST), '[]'::jsonb)
      FROM youtube_videos v
      JOIN youtube_video_car_links l ON v.video_id = l.video_id
      WHERE l.car_id = v_car_id AND l.role = 'primary' AND v.processing_status = 'processed'
      LIMIT 3
    )
  ) INTO result FROM cars c WHERE c.slug = p_slug;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;

-- ============================================================================
-- 4. FIX: get_wheel_tire_fitments
-- ============================================================================
CREATE OR REPLACE FUNCTION get_wheel_tire_fitments(p_car_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  v_car_id UUID;
BEGIN
  SELECT id INTO v_car_id FROM cars WHERE slug = p_car_slug;
  IF v_car_id IS NULL THEN
    RETURN jsonb_build_object('car_slug', p_car_slug, 'error', 'car_not_found');
  END IF;

  SELECT jsonb_build_object(
    'car_slug', p_car_slug,
    'oem_specs', (
      SELECT jsonb_build_object(
        'wheel_bolt_pattern', wheel_bolt_pattern, 'center_bore_mm', wheel_center_bore_mm,
        'wheel_size_front', wheel_size_front, 'wheel_size_rear', wheel_size_rear,
        'tire_size_front', tire_size_front, 'tire_size_rear', tire_size_rear,
        'lug_torque_ft_lbs', wheel_lug_torque_ft_lbs
      ) FROM vehicle_maintenance_specs WHERE car_id = v_car_id
    ),
    'fitment_options', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id, 'fitment_type', fitment_type, 'wheel_diameter', wheel_diameter_inches,
        'wheel_width_front', wheel_width_front, 'wheel_width_rear', wheel_width_rear,
        'wheel_offset_front', wheel_offset_front_mm, 'wheel_offset_rear', wheel_offset_rear_mm,
        'tire_size_front', tire_size_front, 'tire_size_rear', tire_size_rear,
        'requires_mods', (requires_fender_roll OR requires_fender_pull OR requires_camber_adjustment OR requires_coilovers),
        'clearance_notes', clearance_notes, 'recommended_for', recommended_for,
        'popularity_score', popularity_score, 'verified', verified
      ) ORDER BY 
        CASE fitment_type WHEN 'oem' THEN 1 WHEN 'oem_optional' THEN 2 WHEN 'plus_one' THEN 3 
        WHEN 'plus_two' THEN 4 WHEN 'aggressive' THEN 5 ELSE 6 END,
        popularity_score DESC
      ), '[]'::jsonb)
      FROM wheel_tire_fitment_options WHERE car_id = v_car_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- ============================================================================
-- 5. FIX: get_vehicle_health_data
-- ============================================================================
CREATE OR REPLACE FUNCTION get_vehicle_health_data(p_user_vehicle_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vehicle_data JSONB;
  v_car_id UUID;
  v_result JSONB;
BEGIN
  SELECT to_jsonb(uv.*), uv.matched_car_id
  INTO v_vehicle_data, v_car_id
  FROM user_vehicles uv WHERE uv.id = p_user_vehicle_id;

  IF v_vehicle_data IS NULL THEN
    RAISE EXCEPTION 'User vehicle with ID % not found.', p_user_vehicle_id;
  END IF;

  IF v_car_id IS NULL THEN
    RAISE EXCEPTION 'User vehicle with ID % is not matched to a car.', p_user_vehicle_id;
  END IF;

  SELECT jsonb_build_object(
    'vehicle', v_vehicle_data,
    'maintenance_specs', (SELECT to_jsonb(vms.*) FROM vehicle_maintenance_specs vms WHERE vms.car_id = v_car_id),
    'service_intervals', COALESCE((SELECT jsonb_agg(vsi.*) FROM vehicle_service_intervals vsi WHERE vsi.car_id = v_car_id), '[]'::jsonb),
    'car_issues', COALESCE((SELECT jsonb_agg(ci.*) FROM car_issues ci WHERE ci.car_id = v_car_id), '[]'::jsonb),
    'user_service_logs', COALESCE((SELECT jsonb_agg(usl.* ORDER BY usl.service_date DESC) FROM user_service_logs usl WHERE usl.user_vehicle_id = p_user_vehicle_id), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- 6. FIX: get_data_freshness
-- ============================================================================
CREATE OR REPLACE FUNCTION get_data_freshness(p_car_slug TEXT)
RETURNS TABLE(data_type VARCHAR, fetched_at TIMESTAMPTZ, hours_old DOUBLE PRECISION, is_stale BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_car_id UUID;
BEGIN
    SELECT id INTO v_car_id FROM cars WHERE slug = p_car_slug;
    IF v_car_id IS NULL THEN RETURN; END IF;

    RETURN QUERY
    SELECT 'fuel_economy'::VARCHAR, f.fetched_at, (EXTRACT(EPOCH FROM (NOW() - f.fetched_at))/3600)::double precision, f.fetched_at < NOW() - INTERVAL '7 days'
    FROM car_fuel_economy f WHERE f.car_id = v_car_id
    UNION ALL
    SELECT 'nhtsa_safety', s.nhtsa_fetched_at, (EXTRACT(EPOCH FROM (NOW() - s.nhtsa_fetched_at))/3600)::double precision, s.nhtsa_fetched_at < NOW() - INTERVAL '7 days'
    FROM car_safety_data s WHERE s.car_id = v_car_id
    UNION ALL
    SELECT 'iihs_safety', s.iihs_fetched_at, (EXTRACT(EPOCH FROM (NOW() - s.iihs_fetched_at))/3600)::double precision, s.iihs_fetched_at < NOW() - INTERVAL '30 days'
    FROM car_safety_data s WHERE s.car_id = v_car_id
    UNION ALL
    SELECT 'bat_pricing', p.bat_fetched_at, (EXTRACT(EPOCH FROM (NOW() - p.bat_fetched_at))/3600)::double precision, p.bat_fetched_at < NOW() - INTERVAL '7 days'
    FROM car_market_pricing p WHERE p.car_id = v_car_id
    UNION ALL
    SELECT 'hagerty_pricing', p.hagerty_fetched_at, (EXTRACT(EPOCH FROM (NOW() - p.hagerty_fetched_at))/3600)::double precision, p.hagerty_fetched_at < NOW() - INTERVAL '30 days'
    FROM car_market_pricing p WHERE p.car_id = v_car_id
    UNION ALL
    SELECT 'carscom_pricing', p.carscom_fetched_at, (EXTRACT(EPOCH FROM (NOW() - p.carscom_fetched_at))/3600)::double precision, p.carscom_fetched_at < NOW() - INTERVAL '3 days'
    FROM car_market_pricing p WHERE p.car_id = v_car_id;
END;
$$;

-- ============================================================================
-- 7. FIX: compute_consensus_price
-- ============================================================================
CREATE OR REPLACE FUNCTION compute_consensus_price(p_car_slug TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_car_id UUID;
    v_bat_price INTEGER;
    v_hagerty_price INTEGER;
    v_carscom_price INTEGER;
    v_total INTEGER := 0;
    v_weight DECIMAL := 0;
BEGIN
    SELECT id INTO v_car_id FROM cars WHERE slug = p_car_slug;
    IF v_car_id IS NULL THEN RETURN NULL; END IF;

    SELECT bat_avg_price, hagerty_good, carscom_avg_price
    INTO v_bat_price, v_hagerty_price, v_carscom_price
    FROM car_market_pricing WHERE car_id = v_car_id;
    
    IF v_bat_price IS NOT NULL THEN v_total := v_total + (v_bat_price * 1.2); v_weight := v_weight + 1.2; END IF;
    IF v_hagerty_price IS NOT NULL THEN v_total := v_total + (v_hagerty_price * 1.0); v_weight := v_weight + 1.0; END IF;
    IF v_carscom_price IS NOT NULL THEN v_total := v_total + (v_carscom_price * 0.8); v_weight := v_weight + 0.8; END IF;
    
    IF v_weight > 0 THEN RETURN ROUND(v_total / v_weight); ELSE RETURN NULL; END IF;
END;
$$;

-- ============================================================================
-- 8. FIX: analyze_vehicle_health_data
-- ============================================================================
CREATE OR REPLACE FUNCTION analyze_vehicle_health_data(p_user_id UUID, p_vehicle_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vehicle_record RECORD;
  v_car_id UUID;
  v_result JSONB;
BEGIN
  IF p_vehicle_id IS NOT NULL THEN
    SELECT * INTO v_vehicle_record FROM user_vehicles WHERE id = p_vehicle_id AND user_id = p_user_id;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('error', 'Vehicle not found or not owned by user', 'error_code', 'VEHICLE_NOT_FOUND');
    END IF;
  ELSE
    SELECT * INTO v_vehicle_record FROM user_vehicles WHERE user_id = p_user_id ORDER BY is_primary DESC NULLS LAST, created_at ASC LIMIT 1;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('error', 'No vehicles in garage. Add a vehicle first.', 'error_code', 'NO_VEHICLES');
    END IF;
  END IF;

  v_car_id := v_vehicle_record.matched_car_id;

  SELECT jsonb_build_object(
    'vehicle', jsonb_build_object(
      'id', v_vehicle_record.id, 'nickname', v_vehicle_record.nickname,
      'year', v_vehicle_record.year, 'make', v_vehicle_record.make,
      'model', v_vehicle_record.model, 'trim', v_vehicle_record.trim,
      'vin', v_vehicle_record.vin, 'current_mileage', COALESCE(v_vehicle_record.mileage, 0),
      'matched_car_slug', v_vehicle_record.matched_car_slug,
      'matched_car_id', v_vehicle_record.matched_car_id,
      'storage_mode', COALESCE(v_vehicle_record.storage_mode, false),
      'battery_status', v_vehicle_record.battery_status,
      'battery_installed_date', v_vehicle_record.battery_installed_date,
      'tire_tread_32nds', v_vehicle_record.tire_tread_32nds,
      'tire_installed_date', v_vehicle_record.tire_installed_date,
      'registration_due_date', v_vehicle_record.registration_due_date,
      'inspection_due_date', v_vehicle_record.inspection_due_date,
      'last_oil_change_date', v_vehicle_record.last_oil_change_date,
      'last_oil_change_mileage', v_vehicle_record.last_oil_change_mileage,
      'next_oil_due_mileage', v_vehicle_record.next_oil_due_mileage,
      'last_started_at', v_vehicle_record.last_started_at,
      'owner_notes', v_vehicle_record.owner_notes
    ),
    'car', CASE WHEN v_car_id IS NOT NULL THEN (SELECT to_jsonb(c.*) FROM cars c WHERE c.id = v_car_id) ELSE NULL END,
    'maintenance_specs', CASE WHEN v_car_id IS NOT NULL THEN (SELECT to_jsonb(vms.*) FROM vehicle_maintenance_specs vms WHERE vms.car_id = v_car_id) ELSE NULL END,
    'service_intervals', COALESCE((SELECT jsonb_agg(vsi.* ORDER BY vsi.interval_miles NULLS LAST) FROM vehicle_service_intervals vsi WHERE vsi.car_id = v_car_id), '[]'::jsonb),
    'known_issues', COALESCE((SELECT jsonb_agg(ci.* ORDER BY ci.severity DESC NULLS LAST, ci.affected_count DESC NULLS LAST) FROM car_issues ci WHERE ci.car_id = v_car_id), '[]'::jsonb),
    'service_logs', COALESCE((SELECT jsonb_agg(usl.* ORDER BY usl.service_date DESC) FROM user_service_logs usl WHERE usl.user_vehicle_id = v_vehicle_record.id), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- 9. FIX: get_car_track_lap_times
-- ============================================================================
CREATE OR REPLACE FUNCTION get_car_track_lap_times(p_car_slug TEXT, p_limit INTEGER DEFAULT 10)
RETURNS TABLE(
  track_slug TEXT, track_name TEXT, layout_key TEXT, layout_name TEXT,
  lap_time_ms INTEGER, lap_time_text TEXT, session_date DATE, is_stock BOOLEAN,
  tires TEXT, conditions JSONB, modifications JSONB, notes TEXT,
  source_url TEXT, verified BOOLEAN, confidence DECIMAL
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH car_lookup AS (SELECT id FROM cars WHERE slug = p_car_slug)
  SELECT tv.slug, tv.name, tl.layout_key, tl.name,
    lt.lap_time_ms, lt.lap_time_text, lt.session_date, lt.is_stock,
    lt.tires, lt.conditions, lt.modifications, lt.notes,
    COALESCE(lt.source_url, sd.source_url), lt.verified, lt.confidence
  FROM car_track_lap_times lt
  JOIN car_lookup cl ON lt.car_id = cl.id
  JOIN track_venues tv ON tv.id = lt.track_id
  LEFT JOIN track_layouts tl ON tl.id = lt.track_layout_id
  LEFT JOIN source_documents sd ON sd.id = lt.source_document_id
  ORDER BY lt.lap_time_ms ASC
  LIMIT GREATEST(1, LEAST(p_limit, 25));
$$;

-- ============================================================================
-- 10. FIX: get_car_dyno_runs
-- ============================================================================
CREATE OR REPLACE FUNCTION get_car_dyno_runs(p_car_slug TEXT, p_limit INTEGER DEFAULT 10, p_include_curve BOOLEAN DEFAULT false)
RETURNS TABLE(
  run_kind TEXT, recorded_at DATE, dyno_type TEXT, correction TEXT, fuel TEXT,
  is_wheel BOOLEAN, peak_hp INTEGER, peak_tq INTEGER, peak_whp INTEGER, peak_wtq INTEGER,
  boost_psi_max DECIMAL, conditions JSONB, modifications JSONB, notes TEXT,
  curve JSONB, source_url TEXT, verified BOOLEAN, confidence DECIMAL
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH car_lookup AS (SELECT id FROM cars WHERE slug = p_car_slug)
  SELECT dr.run_kind, dr.recorded_at, dr.dyno_type, dr.correction, dr.fuel,
    dr.is_wheel, dr.peak_hp, dr.peak_tq, dr.peak_whp, dr.peak_wtq, dr.boost_psi_max,
    dr.conditions, dr.modifications, dr.notes,
    CASE WHEN p_include_curve THEN dr.curve ELSE '{}'::jsonb END,
    COALESCE(dr.source_url, sd.source_url), dr.verified, dr.confidence
  FROM car_dyno_runs dr
  JOIN car_lookup cl ON dr.car_id = cl.id
  LEFT JOIN source_documents sd ON sd.id = dr.source_document_id
  ORDER BY dr.recorded_at DESC NULLS LAST, dr.created_at DESC
  LIMIT GREATEST(1, LEAST(p_limit, 25));
$$;

-- ============================================================================
-- 11. FIX: get_car_ai_context (remove car_slug fallbacks)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_car_ai_context(p_car_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_car_id UUID;
  v_result JSONB;
BEGIN
  SELECT id INTO v_car_id FROM cars WHERE slug = p_car_slug;
  IF v_car_id IS NULL THEN
    RETURN jsonb_build_object('error','car_not_found','car_slug',p_car_slug);
  END IF;

  SELECT jsonb_build_object(
    'car', to_jsonb(c),
    'fuelEconomy', (SELECT to_jsonb(f) FROM car_fuel_economy f WHERE f.car_id = v_car_id LIMIT 1),
    'safety', (SELECT to_jsonb(s) FROM car_safety_data s WHERE s.car_id = v_car_id LIMIT 1),
    'marketPricing', (SELECT to_jsonb(p) FROM car_market_pricing p WHERE p.car_id = v_car_id LIMIT 1),
    'priceHistorySample', (SELECT COALESCE(jsonb_agg(to_jsonb(h) ORDER BY h.recorded_at DESC), '[]'::jsonb) FROM (SELECT * FROM car_price_history h WHERE h.car_id = v_car_id ORDER BY h.recorded_at DESC LIMIT 24) h),
    'recallsSample', (SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.report_received_date DESC NULLS LAST), '[]'::jsonb) FROM (SELECT * FROM car_recalls r WHERE r.car_id = v_car_id ORDER BY r.report_received_date DESC NULLS LAST LIMIT 20) r),
    'expertReviewsSample', (SELECT COALESCE(jsonb_agg(to_jsonb(er) ORDER BY er.review_date DESC NULLS LAST), '[]'::jsonb) FROM (SELECT * FROM car_expert_reviews er WHERE er.car_id = v_car_id ORDER BY er.review_date DESC NULLS LAST LIMIT 10) er),
    'youtube', jsonb_build_object(
      'videoCount', (SELECT COUNT(*) FROM youtube_video_car_links y WHERE y.car_id = v_car_id),
      'topVideos', (SELECT COALESCE(jsonb_agg(to_jsonb(v) ORDER BY v.quality_score DESC NULLS LAST), '[]'::jsonb)
        FROM (SELECT yv.video_id, yv.url, yv.title, yv.channel_name, yv.published_at, yv.content_type, yv.one_line_take, yv.quality_score
          FROM youtube_video_car_links yl JOIN youtube_videos yv ON yv.video_id = yl.video_id
          WHERE yl.car_id = v_car_id AND yv.processing_status = 'processed' AND yv.is_hidden = false
          ORDER BY yv.quality_score DESC NULLS LAST, yv.published_at DESC NULLS LAST LIMIT 5) v)
    ),
    'knownIssuesCount', (SELECT COUNT(*) FROM vehicle_known_issues ki WHERE ki.car_slug = p_car_slug),
    'issuesCount', (SELECT COUNT(*) FROM car_issues i WHERE i.car_id = v_car_id),
    'maintenanceSummary', (SELECT get_car_maintenance_summary(p_car_slug))
  ) INTO v_result FROM cars c WHERE c.id = v_car_id;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

-- ============================================================================
-- 12. FIX: search_community_insights (community_insights no longer has car_slug)
-- ============================================================================
CREATE OR REPLACE FUNCTION search_community_insights(
  p_query_embedding vector(1536),
  p_car_slug TEXT DEFAULT NULL,
  p_insight_types TEXT[] DEFAULT NULL,
  p_min_confidence DECIMAL DEFAULT 0.5,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  car_id UUID,
  insight_type TEXT,
  title TEXT,
  summary TEXT,
  details JSONB,
  confidence DECIMAL,
  consensus_strength TEXT,
  source_forum TEXT,
  source_urls TEXT[],
  similarity DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_car_id UUID;
BEGIN
  -- Resolve car_slug to car_id if provided
  IF p_car_slug IS NOT NULL THEN
    SELECT c.id INTO v_car_id FROM cars c WHERE c.slug = p_car_slug;
  END IF;

  RETURN QUERY
  SELECT 
    ci.id, ci.car_id, ci.insight_type, ci.title, ci.summary,
    ci.details, ci.confidence, ci.consensus_strength,
    ci.source_forum, ci.source_urls,
    1 - (ci.embedding OPERATOR(extensions.<=>) p_query_embedding) AS similarity
  FROM public.community_insights ci
  WHERE ci.is_active = true
    AND ci.confidence >= p_min_confidence
    AND (v_car_id IS NULL OR ci.car_id = v_car_id)
    AND (p_insight_types IS NULL OR ci.insight_type = ANY(p_insight_types))
    AND ci.embedding IS NOT NULL
  ORDER BY ci.embedding OPERATOR(extensions.<=>) p_query_embedding
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- ENSURE TRIGGER EXISTS
-- ============================================================================
DROP TRIGGER IF EXISTS auto_car_id_user_vehicles ON user_vehicles;
CREATE TRIGGER auto_car_id_user_vehicles
  BEFORE INSERT OR UPDATE ON user_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION resolve_car_id_from_slug();
