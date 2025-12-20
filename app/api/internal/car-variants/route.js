import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin, getAuthErrorStatus } from '@/lib/adminAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * GET /api/internal/car-variants?carSlug=&limit=
 * Admin-only list of car variants for tooling/QA.
 */
export async function GET(request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === 'Unauthorized' ? 401 : 500 });
    }
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const { searchParams } = new URL(request.url);
    const carSlug = searchParams.get('carSlug') || null;
    const limit = Math.max(1, Math.min(Number(searchParams.get('limit') || 200), 500));

    let carId = null;
    if (carSlug) {
      const { data: carRow, error: carErr } = await supabase
        .from('cars')
        .select('id,slug')
        .eq('slug', carSlug)
        .maybeSingle();
      if (carErr) throw carErr;
      carId = carRow?.id || null;
    }

    let q = supabase
      .from('car_variants')
      .select('id,car_id,variant_key,display_name,model_year_start,model_year_end,trim,drivetrain,transmission,engine,cars(slug,name)')
      .order('variant_key', { ascending: true })
      .limit(limit);

    if (carId) q = q.eq('car_id', carId);

    const { data, error } = await q;
    if (error) throw error;

    return NextResponse.json({
      count: (data || []).length,
      variants: data || [],
    });
  } catch (err) {
    console.error('[internal/car-variants] GET error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}













