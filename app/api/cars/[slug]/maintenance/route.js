/**
 * Vehicle Maintenance Specs API Route
 *
 * Returns maintenance specifications for a specific car.
 * Used by AI Mechanic and car detail pages.
 *
 * Updated 2026-01-15: Uses car_id for efficient queries, car_issues as source of truth
 */

// Disable caching to ensure fresh data
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

import { errors } from '@/lib/apiErrors';
import { resolveContentCarId } from '@/lib/carResolver';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

async function handleGet(request, { params }) {
  const { slug } = await params;

  if (!slug) {
    return errors.missingField('slug');
  }

  // If Supabase isn't configured, return empty specs
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({
      success: true,
      data: null,
      message: 'Maintenance specs not available (database not configured)',
    });
  }

  try {
    // Resolve to content car_id (v1 parent for v2 cars)
    // Maintenance data is linked to v1 cars
    const resolved = await resolveContentCarId(slug);

    if (!resolved) {
      return NextResponse.json({
        success: true,
        data: { specs: null, knownIssues: [], serviceIntervals: [] },
        message: 'Car not found',
      });
    }

    const carId = resolved.contentCarId;

    // NOTE: Column names must match actual DB schema exactly
    // Verified against information_schema.columns for vehicle_maintenance_specs
    const MAINT_COLS =
      'id, car_id, oil_type, oil_viscosity, oil_spec, oil_capacity_liters, oil_capacity_quarts, oil_change_interval_miles, oil_change_interval_months, oil_filter_oem_part, coolant_type, coolant_color, coolant_spec, coolant_capacity_liters, coolant_change_interval_miles, coolant_change_interval_years, brake_fluid_type, brake_fluid_spec, brake_fluid_change_interval_miles, brake_fluid_change_interval_years, trans_fluid_auto, trans_fluid_auto_capacity, trans_fluid_manual, trans_fluid_manual_capacity, trans_fluid_change_interval_miles, diff_fluid_type, diff_fluid_change_interval_miles, spark_plug_type, spark_plug_gap_mm, spark_plug_change_interval_miles, tire_size_front, tire_size_rear, tire_pressure_front_psi, tire_pressure_rear_psi, wheel_bolt_pattern, wheel_center_bore_mm, wheel_lug_torque_ft_lbs, wheel_lug_torque_nm, battery_group_size, battery_cca, battery_agm, wiper_driver_size_inches, wiper_passenger_size_inches, wiper_rear_size_inches, created_at';

    // Fetch maintenance specs (uses car_id - car_slug column no longer exists)
    const { data: specs } = await supabase
      .from('vehicle_maintenance_specs')
      .select(MAINT_COLS)
      .eq('car_id', carId)
      .single();

    // Fetch known issues from car_issues (source of truth)
    // NOTE: vehicle_known_issues is DEPRECATED as of 2026-01-15
    const { data: issues } = await supabase
      .from('car_issues')
      .select(
        'id, title, kind, severity, affected_years_text, description, symptoms, prevention, fix_description, estimated_cost_text, estimated_cost_low, estimated_cost_high, source_url, source_type'
      )
      .eq('car_id', carId)
      .order('severity', { ascending: true })
      .order('sort_order', { ascending: true });

    // NOTE: Column names must match actual DB schema exactly
    // Verified against information_schema.columns for vehicle_service_intervals
    const INTERVAL_COLS =
      'id, car_id, service_name, service_description, interval_miles, interval_months, items_included, dealer_cost_low, dealer_cost_high, independent_cost_low, independent_cost_high, diy_cost_low, diy_cost_high, labor_hours_estimate, is_critical, skip_consequences, created_at';

    // Fetch service intervals (uses car_id - car_slug column no longer exists)
    const { data: intervals } = await supabase
      .from('vehicle_service_intervals')
      .select(INTERVAL_COLS)
      .eq('car_id', carId)
      .order('interval_miles', { ascending: true });

    // Map issues to consistent format (backward compatible with old vehicle_known_issues shape)
    const mappedIssues = (issues || []).map((issue) => ({
      id: issue.id,
      issue_title: issue.title,
      title: issue.title,
      issue_type: issue.kind,
      kind: issue.kind,
      severity: issue.severity,
      affected_years_text: issue.affected_years_text,
      issue_description: issue.description,
      description: issue.description,
      symptoms: issue.symptoms,
      prevention: issue.prevention,
      fix_description: issue.fix_description,
      estimated_cost_text: issue.estimated_cost_text,
      estimated_repair_cost_low: issue.estimated_cost_low,
      estimated_repair_cost_high: issue.estimated_cost_high,
      source_url: issue.source_url,
      source_type: issue.source_type,
    }));

    return NextResponse.json({
      success: true,
      data: {
        specs: specs || null,
        knownIssues: mappedIssues,
        serviceIntervals: intervals || [],
      },
    });
  } catch (err) {
    console.error('[Maintenance API] Error:', err);
    return errors.internal('Failed to fetch maintenance specs');
  }
}

export const GET = withErrorLogging(handleGet, {
  route: 'cars/[slug]/maintenance',
  feature: 'browse-cars',
});
