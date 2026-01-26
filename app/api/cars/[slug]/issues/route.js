/**
 * Vehicle Known Issues API Route
 * 
 * Returns known issues for a specific car.
 * Used by the Analysis tab on the Data page.
 * 
 * NOTE: Uses car_issues as the source of truth (vehicle_known_issues is DEPRECATED)
 */

import { NextResponse } from 'next/server';

import { errors } from '@/lib/apiErrors';
import { resolveCarId } from '@/lib/carResolver';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

async function handleGet(request, { params }) {
  const { slug } = await params;

  if (!slug) {
    return errors.missingField('slug');
  }

  // If Supabase isn't configured, return empty issues
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({
      success: true,
      issues: [],
      message: 'Issues not available (database not configured)',
    });
  }

  try {
    // Resolve car_id for efficient queries
    const carId = await resolveCarId(slug);
    
    if (!carId) {
      return NextResponse.json({
        success: true,
        issues: [],
        message: 'Car not found',
      });
    }

    // Fetch known issues from car_issues (source of truth)
    const { data: issues, error } = await supabase
      .from('car_issues')
      .select(`
        id,
        title,
        kind,
        severity,
        affected_years_text,
        affected_year_start,
        affected_year_end,
        description,
        symptoms,
        prevention,
        fix_description,
        estimated_cost_text,
        estimated_cost_low,
        estimated_cost_high,
        source_url,
        source_type
      `)
      .eq('car_id', carId)
      .order('severity', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[Issues API] Error fetching issues:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      issues: issues || [],
      count: issues?.length || 0,
    });
  } catch (err) {
    console.error('[Issues API] Error:', err);
    return errors.internal('Failed to fetch known issues');
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cars/[slug]/issues', feature: 'data-analysis' });
