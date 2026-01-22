/**
 * Community Build Detail API
 * 
 * GET /api/community/builds/[slug] - Get full build details including car data
 * 
 * Returns:
 *   - build: Basic build info
 *   - buildData: Full user_projects data with selected_upgrades
 *   - carData: Car data needed for performance calculations
 *   - parts: Community post parts
 * 
 * @route /api/community/builds/[slug]
 */

import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { createClient } from '@supabase/supabase-js';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/community/builds/[slug]
 * Get detailed build data for premium display
 */
async function handleGet(request, { params }) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json(
      { error: 'Slug is required' },
      { status: 400 }
    );
  }

  try {
    // Use the RPC function to get full build data
    const { data: postData, error: postError } = await supabaseAdmin.rpc(
      'get_community_post_by_slug',
      { p_slug: slug }
    );

    if (postError) {
      console.error('[Build Detail API] RPC error:', postError);
      return NextResponse.json(
        { error: 'Failed to fetch build' },
        { status: 500 }
      );
    }

    if (!postData || postData.length === 0) {
      return NextResponse.json(
        { error: 'Build not found' },
        { status: 404 }
      );
    }

    const result = postData[0];
    const post = result.post;
    const buildData = result.build_data;
    
    // DEBUG: Log what we receive from RPC
    console.log('[Build API DEBUG] Raw RPC buildData metrics:', {
      slug,
      final_zero_to_sixty: buildData?.final_zero_to_sixty,
      stock_zero_to_sixty: buildData?.stock_zero_to_sixty,
      final_hp: buildData?.final_hp,
      stock_hp: buildData?.stock_hp,
      buildDataKeys: buildData ? Object.keys(buildData) : 'null',
    });

    // Fetch car data for performance calculations if we have a car_slug
    let carData = null;
    if (post?.car_slug) {
      const { data: car, error: carError } = await supabaseAdmin
        .from('cars')
        .select(`
          id,
          slug,
          name,
          hp,
          torque,
          zero_to_sixty,
          braking_60_0,
          lateral_g,
          quarter_mile,
          curb_weight,
          score_sound,
          score_interior,
          score_track,
          score_reliability,
          score_value,
          score_driver_fun,
          score_aftermarket,
          perf_power_accel,
          perf_grip_cornering,
          perf_braking,
          perf_track_pace,
          perf_drivability,
          perf_reliability_heat,
          perf_sound_emotion
        `)
        .eq('slug', post.car_slug)
        .single();

      if (!carError && car) {
        carData = car;
      }
    }

    // Fetch community post parts if available
    let parts = [];
    if (post?.id) {
      const { data: partsData } = await supabaseAdmin
        .from('community_post_parts')
        .select('*')
        .eq('community_post_id', post.id)
        .order('category');
      
      if (partsData) {
        parts = partsData;
      }
    }

    // Also fetch user_project_parts if we have a build_id
    if (buildData?.id) {
      const { data: projectParts } = await supabaseAdmin
        .from('user_project_parts')
        .select(`
          id,
          part_id,
          quantity,
          part_name,
          brand_name,
          price_cents,
          notes,
          category
        `)
        .eq('project_id', buildData.id);
      
      if (projectParts && projectParts.length > 0) {
        // Merge project parts with community parts
        const formattedProjectParts = projectParts.map(p => ({
          ...p,
          mod_type: p.part_name,
          product_name: p.part_name,
          source: 'project'
        }));
        parts = [...parts, ...formattedProjectParts];
      }
    }

    // Log build data for debugging performance metrics issue
    if (buildData) {
      console.log('[Build Detail API] Performance metrics:', {
        slug,
        stock_zero_to_sixty: buildData.stock_zero_to_sixty,
        final_zero_to_sixty: buildData.final_zero_to_sixty,
        stock_braking_60_0: buildData.stock_braking_60_0,
        final_braking_60_0: buildData.final_braking_60_0,
      });
    }

    return NextResponse.json({
      build: {
        ...post,
        author: result.author,
        images: result.images || [],
      },
      buildData,
      carData,
      parts,
    }, {
      headers: {
        // Disable caching temporarily to ensure fresh data
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (err) {
    console.error('[Build Detail API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withErrorLogging(handleGet, {
  route: 'community/builds/[slug]',
  feature: 'community-build-detail',
});
