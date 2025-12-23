/**
 * Vehicle Maintenance Specs API Route
 * 
 * Returns maintenance specifications for a specific car.
 * Used by AI Mechanic and car detail pages.
 */

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { withErrorLogging } from '@/lib/serverErrorLogger';

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
    // Fetch maintenance specs
    const { data: specs, error: specsError } = await supabase
      .from('vehicle_maintenance_specs')
      .select('*')
      .eq('car_slug', slug)
      .single();

    // Fetch known issues
    const { data: issues } = await supabase
      .from('vehicle_known_issues')
      .select('*')
      .eq('car_slug', slug)
      .order('severity', { ascending: false });

    // Fetch service intervals
    const { data: intervals } = await supabase
      .from('vehicle_service_intervals')
      .select('*')
      .eq('car_slug', slug)
      .order('interval_miles', { ascending: true });

    // Note: specsError will be thrown if no row exists, which is fine
    // We just return null in that case

    return NextResponse.json({
      success: true,
      data: {
        specs: specs || null,
        knownIssues: issues || [],
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
