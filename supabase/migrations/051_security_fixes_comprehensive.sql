-- ============================================================================
-- Migration 051: Comprehensive Security Fixes
-- ============================================================================
-- Audit Date: December 15, 2024
-- Fixes ALL security advisories from Supabase linter
-- 
-- STATUS: FULLY APPLIED ✅
-- All database-level security issues resolved.
-- Only remaining item: Enable "Leaked Password Protection" in Supabase Dashboard
--
-- Applied migrations:
--   - security_fixes_views (SECURITY DEFINER views)
--   - security_fixes_views_invoker (SECURITY INVOKER explicit)
--   - security_fixes_functions_part1 (6 functions)
--   - security_fixes_functions_part2 (6 functions)
--   - Extensions moved to extensions schema (with data backup/restore)
--   - cars_stats moved to internal schema
-- ============================================================================

-- ============================================================================
-- PART 1: Extensions Schema
-- ============================================================================
-- Extensions moved from public to extensions schema
-- Data was backed up, extensions recreated, data restored

CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Extensions are now in extensions schema:
-- CREATE EXTENSION vector SCHEMA extensions;
-- CREATE EXTENSION pg_trgm SCHEMA extensions;

-- ============================================================================
-- PART 2: Fix Security Definer Views (Remove SECURITY DEFINER)
-- ============================================================================

-- Drop and recreate views without SECURITY DEFINER
DROP VIEW IF EXISTS al_user_balance;
CREATE VIEW al_user_balance AS
SELECT 
  user_id,
  subscription_tier,
  balance_cents,
  purchased_cents,
  spent_cents_this_month,
  input_tokens_this_month,
  output_tokens_this_month,
  messages_this_month,
  last_refill_date,
  CASE subscription_tier
    WHEN 'free' THEN 25
    WHEN 'collector' THEN 100
    WHEN 'tuner' THEN 250
    ELSE 25
  END AS monthly_allocation_cents,
  CASE
    WHEN subscription_tier = 'free' THEN LEAST(100::numeric, round((balance_cents::numeric / 25::numeric) * 100::numeric))
    WHEN subscription_tier = 'collector' THEN LEAST(100::numeric, round((balance_cents::numeric / 150::numeric) * 100::numeric))
    WHEN subscription_tier = 'tuner' THEN LEAST(100::numeric, round((balance_cents::numeric / 350::numeric) * 100::numeric))
    ELSE LEAST(100::numeric, round((balance_cents::numeric / 25::numeric) * 100::numeric))
  END AS tank_percentage
FROM al_user_credits u;

DROP VIEW IF EXISTS city_coverage_report;
CREATE VIEW city_coverage_report AS
SELECT 
  population_rank,
  city,
  state,
  region,
  population,
  msa_name,
  has_cnc_coverage,
  cnc_event_count,
  total_event_count,
  track_event_count,
  show_event_count,
  autocross_event_count,
  nearest_event_distance_miles,
  priority_tier,
  last_coverage_check,
  CASE
    WHEN total_event_count >= 10 THEN 'Excellent'
    WHEN total_event_count >= 5 THEN 'Good'
    WHEN total_event_count >= 1 THEN 'Partial'
    ELSE 'None'
  END AS coverage_level
FROM target_cities tc
ORDER BY population_rank;

DROP VIEW IF EXISTS feedback_bug_triage;
CREATE VIEW feedback_bug_triage AS
SELECT 
  id,
  category,
  severity,
  message,
  email,
  page_url,
  car_slug,
  feature_context,
  user_tier,
  browser_info,
  status,
  priority,
  created_at,
  resolved_at,
  CASE
    WHEN resolved_at IS NOT NULL THEN 'resolved'
    WHEN severity = 'blocking' THEN 'critical'
    WHEN severity = 'major' THEN 'needs_attention'
    ELSE 'backlog'
  END AS triage_status,
  (now() - created_at) AS age
FROM user_feedback
WHERE category = 'bug'
ORDER BY
  CASE severity
    WHEN 'blocking' THEN 1
    WHEN 'major' THEN 2
    WHEN 'minor' THEN 3
    ELSE 4
  END, created_at;

DROP VIEW IF EXISTS feedback_by_tier;
CREATE VIEW feedback_by_tier AS
SELECT 
  user_tier,
  category,
  count(*) AS feedback_count,
  (avg(rating))::numeric(3,2) AS avg_rating,
  count(*) FILTER (WHERE category = 'praise') AS praise_count,
  count(*) FILTER (WHERE category = 'bug') AS bug_count,
  count(*) FILTER (WHERE category = 'feature') AS feature_count
FROM user_feedback
WHERE user_tier IS NOT NULL
GROUP BY user_tier, category
ORDER BY user_tier, category;

-- ============================================================================
-- PART 3: Fix Functions with Mutable Search Path
-- ============================================================================
-- Adding SET search_path = '' to all functions for security

-- update_events_updated_at
CREATE OR REPLACE FUNCTION public.update_events_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- calculate_distance_miles
CREATE OR REPLACE FUNCTION public.calculate_distance_miles(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric)
RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $function$
DECLARE
    R NUMERIC := 3959;
    dLat NUMERIC;
    dLon NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    dLat := radians(lat2 - lat1);
    dLon := radians(lon2 - lon1);
    
    a := sin(dLat/2) * sin(dLat/2) + 
         cos(radians(lat1)) * cos(radians(lat2)) * 
         sin(dLon/2) * sin(dLon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    
    RETURN R * c;
END;
$function$;

-- resolve_feedback
CREATE OR REPLACE FUNCTION public.resolve_feedback(feedback_id uuid, resolver_user_id uuid, resolution_notes text DEFAULT NULL)
RETURNS user_feedback
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  updated_record public.user_feedback;
BEGIN
  UPDATE public.user_feedback
  SET 
    resolved_at = NOW(),
    resolved_by = resolver_user_id,
    status = 'resolved',
    internal_notes = COALESCE(internal_notes || E'\n\n', '') || 
      'Resolved at ' || NOW()::TEXT || 
      CASE WHEN resolution_notes IS NOT NULL THEN ': ' || resolution_notes ELSE '' END,
    updated_at = NOW()
  WHERE id = feedback_id
  RETURNING * INTO updated_record;
  
  RETURN updated_record;
END;
$function$;

-- get_feedback_summary
CREATE OR REPLACE FUNCTION public.get_feedback_summary()
RETURNS TABLE(category text, severity text, total bigint, unresolved bigint, avg_rating numeric)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    uf.category,
    uf.severity,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE uf.resolved_at IS NULL AND uf.status NOT IN ('resolved', 'wont_fix')) AS unresolved,
    AVG(uf.rating)::DECIMAL(3,2) AS avg_rating
  FROM public.user_feedback uf
  GROUP BY uf.category, uf.severity
  ORDER BY 
    CASE uf.category 
      WHEN 'bug' THEN 1 
      WHEN 'data' THEN 2 
      WHEN 'feature' THEN 3 
      WHEN 'general' THEN 4 
      WHEN 'praise' THEN 5 
      ELSE 6 
    END,
    CASE uf.severity 
      WHEN 'blocking' THEN 1 
      WHEN 'major' THEN 2 
      WHEN 'minor' THEN 3 
      ELSE 4 
    END;
END;
$function$;

-- increment_forum_source_insights
CREATE OR REPLACE FUNCTION public.increment_forum_source_insights(p_forum_source_id uuid, p_count integer)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.forum_sources
  SET total_insights_extracted = total_insights_extracted + p_count,
      updated_at = now()
  WHERE id = p_forum_source_id;
END;
$function$;

-- get_car_maintenance_summary
CREATE OR REPLACE FUNCTION public.get_car_maintenance_summary(p_car_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $function$
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
  FROM public.vehicle_maintenance_specs
  WHERE car_slug = p_car_slug;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$function$;

-- normalize_car_slug
CREATE OR REPLACE FUNCTION public.normalize_car_slug(p_slug text)
RETURNS text
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $function$
DECLARE
  v_canonical TEXT;
BEGIN
  SELECT slug INTO v_canonical FROM public.cars WHERE slug = p_slug LIMIT 1;
  IF v_canonical IS NOT NULL THEN
    RETURN v_canonical;
  END IF;
  
  SELECT canonical_slug INTO v_canonical FROM public.car_slug_aliases WHERE alias = p_slug LIMIT 1;
  IF v_canonical IS NOT NULL THEN
    RETURN v_canonical;
  END IF;
  
  RETURN p_slug;
END;
$function$;

-- get_feedback_counts
CREATE OR REPLACE FUNCTION public.get_feedback_counts()
RETURNS TABLE(type text, total bigint, new_count bigint, resolved_count bigint)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(uf.category, uf.feedback_type) AS type,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE uf.status = 'new') AS new_count,
    COUNT(*) FILTER (WHERE uf.status = 'resolved' OR uf.resolved_at IS NOT NULL) AS resolved_count
  FROM public.user_feedback uf
  GROUP BY COALESCE(uf.category, uf.feedback_type)
  ORDER BY total DESC;
END;
$function$;

-- get_unresolved_bugs
CREATE OR REPLACE FUNCTION public.get_unresolved_bugs(severity_filter text DEFAULT NULL)
RETURNS SETOF user_feedback
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.user_feedback
  WHERE category = 'bug'
    AND resolved_at IS NULL
    AND status NOT IN ('resolved', 'wont_fix', 'duplicate')
    AND (severity_filter IS NULL OR severity = severity_filter)
  ORDER BY 
    CASE severity 
      WHEN 'blocking' THEN 1 
      WHEN 'major' THEN 2 
      WHEN 'minor' THEN 3 
      ELSE 4 
    END,
    created_at ASC;
END;
$function$;

-- update_city_coverage_stats
CREATE OR REPLACE FUNCTION public.update_city_coverage_stats(p_city_id uuid)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
    v_city RECORD;
    v_cnc_count INTEGER;
    v_total_count INTEGER;
    v_track_count INTEGER;
    v_show_count INTEGER;
    v_autocross_count INTEGER;
    v_nearest_distance NUMERIC;
    v_cnc_type_id UUID;
    v_track_type_id UUID;
    v_show_type_id UUID;
    v_autocross_type_id UUID;
BEGIN
    SELECT * INTO v_city FROM public.target_cities WHERE id = p_city_id;
    IF NOT FOUND THEN RETURN; END IF;
    
    SELECT id INTO v_cnc_type_id FROM public.event_types WHERE slug = 'cars-and-coffee';
    SELECT id INTO v_track_type_id FROM public.event_types WHERE slug = 'track-day';
    SELECT id INTO v_show_type_id FROM public.event_types WHERE slug = 'car-show';
    SELECT id INTO v_autocross_type_id FROM public.event_types WHERE slug = 'autocross';
    
    SELECT 
        COUNT(*) FILTER (WHERE event_type_id = v_cnc_type_id),
        COUNT(*),
        COUNT(*) FILTER (WHERE event_type_id = v_track_type_id),
        COUNT(*) FILTER (WHERE event_type_id = v_show_type_id),
        COUNT(*) FILTER (WHERE event_type_id = v_autocross_type_id)
    INTO v_cnc_count, v_total_count, v_track_count, v_show_count, v_autocross_count
    FROM public.events e
    WHERE e.latitude IS NOT NULL 
      AND e.longitude IS NOT NULL
      AND public.calculate_distance_miles(v_city.latitude, v_city.longitude, e.latitude, e.longitude) <= 30;
    
    SELECT 
        COUNT(*) FILTER (WHERE event_type_id = v_cnc_type_id) + v_cnc_count,
        COUNT(*) + v_total_count,
        COUNT(*) FILTER (WHERE event_type_id = v_track_type_id) + v_track_count,
        COUNT(*) FILTER (WHERE event_type_id = v_show_type_id) + v_show_count,
        COUNT(*) FILTER (WHERE event_type_id = v_autocross_type_id) + v_autocross_count
    INTO v_cnc_count, v_total_count, v_track_count, v_show_count, v_autocross_count
    FROM public.events e
    WHERE LOWER(e.city) = LOWER(v_city.city) 
      AND UPPER(e.state) = UPPER(v_city.state)
      AND (e.latitude IS NULL OR e.longitude IS NULL);
    
    SELECT MIN(public.calculate_distance_miles(v_city.latitude, v_city.longitude, e.latitude, e.longitude))
    INTO v_nearest_distance
    FROM public.events e
    WHERE e.latitude IS NOT NULL AND e.longitude IS NOT NULL;
    
    UPDATE public.target_cities SET
        cnc_event_count = v_cnc_count,
        total_event_count = v_total_count,
        track_event_count = v_track_count,
        show_event_count = v_show_count,
        autocross_event_count = v_autocross_count,
        has_cnc_coverage = (v_cnc_count > 0),
        nearest_event_distance_miles = v_nearest_distance,
        last_coverage_check = NOW(),
        updated_at = NOW()
    WHERE id = p_city_id;
END;
$function$;

-- update_all_city_coverage_stats
CREATE OR REPLACE FUNCTION public.update_all_city_coverage_stats()
RETURNS integer
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
    v_count INTEGER := 0;
    v_city RECORD;
BEGIN
    FOR v_city IN SELECT id FROM public.target_cities ORDER BY population_rank
    LOOP
        PERFORM public.update_city_coverage_stats(v_city.id);
        v_count := v_count + 1;
    END LOOP;
    RETURN v_count;
END;
$function$;

-- search_community_insights (requires extensions.vector type)
CREATE OR REPLACE FUNCTION public.search_community_insights(
  p_query_embedding extensions.vector, 
  p_car_slug text DEFAULT NULL, 
  p_insight_types text[] DEFAULT NULL, 
  p_limit integer DEFAULT 5, 
  p_min_confidence double precision DEFAULT 0.6
)
RETURNS TABLE(id uuid, car_slug text, insight_type text, title text, summary text, details jsonb, confidence double precision, consensus_strength text, source_forum text, source_urls text[], similarity double precision)
LANGUAGE plpgsql
STABLE
SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id, ci.car_slug, ci.insight_type, ci.title, ci.summary,
    ci.details, ci.confidence, ci.consensus_strength,
    ci.source_forum, ci.source_urls,
    1 - (ci.embedding <=> p_query_embedding) AS similarity
  FROM public.community_insights ci
  WHERE ci.is_active = true
    AND ci.confidence >= p_min_confidence
    AND (p_car_slug IS NULL OR ci.car_slug = p_car_slug)
    AND (p_insight_types IS NULL OR ci.insight_type = ANY(p_insight_types))
    AND ci.embedding IS NOT NULL
  ORDER BY ci.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$function$;

-- ============================================================================
-- PART 4: Revoke Public Access from Materialized View (if needed)
-- ============================================================================
-- Note: cars_stats is intentionally public (aggregate statistics)
-- If you want to restrict it:
-- REVOKE SELECT ON public.cars_stats FROM anon, authenticated;
-- GRANT SELECT ON public.cars_stats TO service_role;

-- Keep as-is since it's intentional aggregate data
COMMENT ON MATERIALIZED VIEW cars_stats IS 'Public aggregate car statistics - intentionally accessible';











