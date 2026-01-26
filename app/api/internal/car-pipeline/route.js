/**
 * Car Pipeline API Route
 * 
 * GET /api/internal/car-pipeline - List all pipeline runs
 * POST /api/internal/car-pipeline - Create new pipeline run
 * 
 * Auth: Admin only (via service role or admin tier)
 */

import { NextResponse } from 'next/server';
import { supabaseServiceRole, isSupabaseConfigured } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { withErrorLogging } from '@/lib/serverErrorLogger';

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
    
    // Check user tier
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
 * GET /api/internal/car-pipeline
 * List all pipeline runs with optional filters
 */
async function handleGet(request) {
  if (!isSupabaseConfigured || !supabaseServiceRole) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }
  
  // Allow internal requests (from internal pages)
  const isInternalRequest = request.headers.get('referer')?.includes('/internal/');
  const adminCheck = await isAdmin();
  
  if (!isInternalRequest && !adminCheck) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(Number(searchParams.get('limit') || 100), 200);
    
    const PIPELINE_COLS = 'id, car_slug, status, steps_completed, steps_total, current_step, error_message, started_at, completed_at, metadata, created_at';
    
    let query = supabaseServiceRole
      .from('car_pipeline_runs')
      .select(PIPELINE_COLS)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data: runs, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json({
      runs: runs || [],
      count: runs?.length || 0,
    });
  } catch (err) {
    console.error('[CarPipeline API] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch pipeline runs' }, { status: 500 });
  }
}

/**
 * POST /api/internal/car-pipeline
 * Create new pipeline run
 */
async function handlePost(request) {
  if (!isSupabaseConfigured || !supabaseServiceRole) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }
  
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { car_slug, car_name } = body;
    
    if (!car_slug || !car_name) {
      return NextResponse.json(
        { error: 'car_slug and car_name are required' },
        { status: 400 }
      );
    }
    
    // Validate slug format
    const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!slugPattern.test(car_slug)) {
      return NextResponse.json(
        { error: 'Invalid slug format. Use lowercase letters, numbers, and hyphens only.' },
        { status: 400 }
      );
    }
    
    // Check for existing pipeline run
    const { data: existing } = await supabaseServiceRole
      .from('car_pipeline_runs')
      .select('id, car_slug')
      .eq('car_slug', car_slug)
      .single();
    
    if (existing) {
      return NextResponse.json(
        { error: `Pipeline already exists for ${car_slug}`, existingId: existing.id },
        { status: 409 }
      );
    }
    
    // Create pipeline run
    const { data: run, error } = await supabaseServiceRole
      .from('car_pipeline_runs')
      .insert({
        car_slug,
        car_name,
        status: 'in_progress',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      run,
    });
  } catch (err) {
    console.error('[CarPipeline API] POST error:', err);
    return NextResponse.json({ error: 'Failed to create pipeline run' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'internal-car-pipeline', feature: 'internal' });
export const POST = withErrorLogging(handlePost, { route: 'internal-car-pipeline', feature: 'internal' });
