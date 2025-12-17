import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/cars/[slug]/safety-ratings
 * 
 * Fetches safety ratings (NHTSA/IIHS) for a specific car.
 * FREE tier - part of buying research, not ownership.
 */
export async function GET(request, { params }) {
  const { slug } = params;
  
  if (!slug) {
    return NextResponse.json({ error: 'Car slug is required' }, { status: 400 });
  }
  
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ safety: null }, { status: 200 });
  }
  
  try {
    const { data, error } = await supabase
      .from('car_safety_data')
      .select(`
        nhtsa_overall_rating,
        nhtsa_front_crash_rating,
        nhtsa_side_crash_rating,
        nhtsa_rollover_rating,
        recall_count,
        complaint_count,
        investigation_count,
        tsb_count,
        has_open_recalls,
        has_open_investigations,
        iihs_overall,
        iihs_small_overlap_front,
        iihs_moderate_overlap_front,
        iihs_side,
        iihs_roof_strength,
        iihs_head_restraints,
        iihs_front_crash_prevention,
        iihs_headlight_rating,
        iihs_top_safety_pick,
        iihs_top_safety_pick_plus,
        safety_score,
        safety_grade,
        nhtsa_fetched_at,
        iihs_fetched_at
      `)
      .eq('car_slug', slug)
      .maybeSingle();
    
    if (error) {
      console.error('[API/safety-ratings] Error:', error);
      throw error;
    }
    
    return NextResponse.json({ safety: data });
  } catch (err) {
    console.error('[API/safety-ratings] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch safety data' }, { status: 500 });
  }
}



