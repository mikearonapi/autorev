/**
 * Car Pipeline Detail API Route
 * 
 * GET /api/internal/car-pipeline/[slug] - Get pipeline run by slug
 * PATCH /api/internal/car-pipeline/[slug] - Update pipeline run
 * DELETE /api/internal/car-pipeline/[slug] - Delete pipeline run
 * 
 * Auth: Admin only
 */

import { NextResponse } from 'next/server';
import { supabaseServiceRole, isSupabaseConfigured } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Check if user is admin
 */
async function isAdmin() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data: profile } = await supabaseServiceRole
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();
    
    return profile?.subscription_tier === 'admin';
  } catch (err) {
    console.error('[CarPipeline API] Auth check error:', err);
    return false;
  }
}

/**
 * GET /api/internal/car-pipeline/[slug]
 * Get pipeline run by car slug
 */
export async function GET(request, { params }) {
  const { slug } = await params;
  
  if (!isSupabaseConfigured || !supabaseServiceRole) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }
  
  // Allow internal requests
  const isInternalRequest = request.headers.get('referer')?.includes('/internal/');
  const adminCheck = await isAdmin();
  
  if (!isInternalRequest && !adminCheck) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { data: run, error } = await supabaseServiceRole
      .from('car_pipeline_runs')
      .select('*')
      .eq('car_slug', slug)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Pipeline run not found' }, { status: 404 });
      }
      throw error;
    }
    
    return NextResponse.json({ run });
  } catch (err) {
    console.error('[CarPipeline API] GET detail error:', err);
    return NextResponse.json({ error: 'Failed to fetch pipeline run' }, { status: 500 });
  }
}

/**
 * PATCH /api/internal/car-pipeline/[slug]
 * Update pipeline run
 */
export async function PATCH(request, { params }) {
  const { slug } = await params;
  
  if (!isSupabaseConfigured || !supabaseServiceRole) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }
  
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    
    // Build update object - only include allowed fields
    const allowedFields = [
      'status',
      'phase1_validated', 'phase1_validated_at', 'phase1_notes',
      'phase2_core_data', 'phase2_core_data_at', 'phase2_notes',
      'phase3_fuel_economy', 'phase3_safety_ratings', 'phase3_recalls', 'phase3_completed_at', 'phase3_notes',
      'phase4_known_issues', 'phase4_maintenance_specs', 'phase4_service_intervals', 'phase4_variants', 'phase4_completed_at', 'phase4_notes',
      'phase5_scores_assigned', 'phase5_strengths', 'phase5_weaknesses', 'phase5_alternatives', 'phase5_completed_at', 'phase5_notes',
      'phase6_hero_image', 'phase6_gallery_images', 'phase6_completed_at', 'phase6_notes',
      'phase7_videos_queued', 'phase7_videos_processed', 'phase7_car_links_verified', 'phase7_completed_at', 'phase7_notes',
      'phase8_data_complete', 'phase8_page_renders', 'phase8_al_tested', 'phase8_search_works', 'phase8_mobile_checked', 'phase8_completed_at', 'phase8_notes',
      'completed_at',
    ];
    
    const updateData = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    
    // Auto-set completed_at when status changes to completed
    if (updateData.status === 'completed' && !updateData.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }
    
    // Auto-clear completed_at when status changes away from completed
    if (updateData.status && updateData.status !== 'completed') {
      updateData.completed_at = null;
    }
    
    const { data: run, error } = await supabaseServiceRole
      .from('car_pipeline_runs')
      .update(updateData)
      .eq('car_slug', slug)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Pipeline run not found' }, { status: 404 });
      }
      throw error;
    }
    
    return NextResponse.json({ run });
  } catch (err) {
    console.error('[CarPipeline API] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update pipeline run' }, { status: 500 });
  }
}

/**
 * DELETE /api/internal/car-pipeline/[slug]
 * Delete pipeline run
 */
export async function DELETE(request, { params }) {
  const { slug } = await params;
  
  if (!isSupabaseConfigured || !supabaseServiceRole) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }
  
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { error } = await supabaseServiceRole
      .from('car_pipeline_runs')
      .delete()
      .eq('car_slug', slug);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[CarPipeline API] DELETE error:', err);
    return NextResponse.json({ error: 'Failed to delete pipeline run' }, { status: 500 });
  }
}

