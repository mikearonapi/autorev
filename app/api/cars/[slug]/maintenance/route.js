/**
 * Vehicle Maintenance Specs API Route
 * 
 * Returns maintenance specifications for a specific car.
 * Used by AI Mechanic and car detail pages.
 * 
 * Updated 2026-01-15: Uses car_id for efficient queries, car_issues as source of truth
 */

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { resolveCarId } from '@/lib/carResolver';

async function handleGet(request, { params }) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json(
      { error: 'Car slug is required' },
      { status: 400 }
    );
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
    // Resolve car_id once for efficient queries
    // NOTE: All these tables use car_id ONLY (car_slug column was removed)
    const carId = await resolveCarId(slug);
    
    if (!carId) {
      return NextResponse.json({
        success: true,
        data: { specs: null, knownIssues: [], serviceIntervals: [] },
        message: 'Car not found',
      });
    }

    // Fetch maintenance specs (uses car_id - car_slug column no longer exists)
    const { data: specs } = await supabase
      .from('vehicle_maintenance_specs')
      .select('*')
      .eq('car_id', carId)
      .single();

    // Fetch known issues from car_issues (source of truth)
    // NOTE: vehicle_known_issues is DEPRECATED as of 2026-01-15
    const { data: issues } = await supabase
      .from('car_issues')
      .select('id, title, kind, severity, affected_years_text, description, symptoms, prevention, fix_description, estimated_cost_text, estimated_cost_low, estimated_cost_high, source_url, source_type')
      .eq('car_id', carId)
      .order('severity', { ascending: true })
      .order('sort_order', { ascending: true });

    // Fetch service intervals (uses car_id - car_slug column no longer exists)
    const { data: intervals } = await supabase
      .from('vehicle_service_intervals')
      .select('*')
      .eq('car_id', carId)
      .order('interval_miles', { ascending: true });

    // Map issues to consistent format (backward compatible with old vehicle_known_issues shape)
    const mappedIssues = (issues || []).map(issue => ({
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
    return NextResponse.json(
      { error: 'Failed to fetch maintenance specs' },
      { status: 500 }
    );
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cars/[slug]/maintenance', feature: 'browse-cars' });
