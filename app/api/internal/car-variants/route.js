import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { requireAdmin } from '@/lib/adminAuth';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Force dynamic rendering - this route uses request.headers and request.url
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

/**
 * GET /api/internal/car-variants?carId=&limit=
 * Admin-only list of car variants for tooling/QA.
 *
 * @param {string} carId - Car UUID (preferred) or slug (backward compat)
 * @param {number} limit - Max results (default: 200, max: 500)
 */
async function handleGet(request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.error === 'Unauthorized' ? 401 : 500 }
      );
    }
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });

    const { searchParams } = new URL(request.url);
    // Prefer carId, fall back to carSlug for backward compatibility
    const carIdParam = searchParams.get('carId') || searchParams.get('carSlug') || null;
    const limit = Math.max(1, Math.min(Number(searchParams.get('limit') || 200), 500));

    let carId = null;
    if (carIdParam) {
      // Check if it's a UUID or a slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        carIdParam
      );

      if (isUuid) {
        // Verify UUID exists
        const { data: carRow, error: carErr } = await supabase
          .from('cars')
          .select('id')
          .eq('id', carIdParam)
          .maybeSingle();
        if (carErr) throw carErr;
        carId = carRow?.id || null;
      } else {
        // Resolve slug to UUID
        const { data: carRow, error: carErr } = await supabase
          .from('cars')
          .select('id')
          .eq('slug', carIdParam)
          .maybeSingle();
        if (carErr) throw carErr;
        carId = carRow?.id || null;
      }
    }

    let q = supabase
      .from('car_variants')
      .select(
        'id,car_id,variant_key,display_name,model_year_start,model_year_end,trim,drive_type,transmission,engine_type,cars(slug,name)'
      )
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
    return NextResponse.json({ error: 'Failed to fetch car variants' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, {
  route: 'internal/car-variants',
  feature: 'internal',
});
