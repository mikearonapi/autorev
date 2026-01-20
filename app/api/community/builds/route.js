/**
 * Community Builds API
 * 
 * GET /api/community/builds - List community builds
 * 
 * Query params:
 *   - limit: number of builds to return (default: 12, max: 50)
 *   - offset: pagination offset (default: 0)
 *   - featured: 'true' to only return featured builds
 *   - sort: 'latest' | 'popular' (default: 'latest')
 *   - car: filter by car slug
 * 
 * @route /api/community/builds
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Mark route as dynamic since it uses request.url
export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET /api/community/builds
 * List community builds with optional filters
 */
async function handleGet(request) {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const featured = searchParams.get('featured') === 'true';
    const sort = searchParams.get('sort') || 'latest';
    const carSlug = searchParams.get('car');

    // Fetch builds using the RPC function
    const { data, error } = await supabaseAdmin.rpc('get_community_posts', {
      p_post_type: 'build',
      p_car_slug: carSlug || null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      console.error('[CommunityBuilds API] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch builds' }, { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    let builds = data || [];

    // Filter by featured if requested
    if (featured) {
      builds = builds.filter(b => b.is_featured);
    }

    // Sort based on parameter
    if (sort === 'popular') {
      builds.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    }
    // 'latest' is default from the RPC (ordered by published_at DESC)

    // Enrich builds with car data (image, performance specs) and build data (modified metrics)
    const enrichedBuilds = await Promise.all(
      builds.map(async (build) => {
        // Fetch car specs (stock values) for fallback
        if (build.car_slug) {
          const { data: carData } = await supabaseAdmin
            .from('cars')
            .select('image_hero_url, hp, torque, zero_to_sixty, top_speed')
            .eq('slug', build.car_slug)
            .single();
          
          if (carData) {
            // Image fallback if build has no images
            if (!build.images || build.images.length === 0) {
              build.car_image_url = carData.image_hero_url;
            }
            
            // Add car specs for performance display (stock values as fallback)
            build.car_specs = {
              hp: carData.hp,
              torque: carData.torque,
              zero_to_sixty: carData.zero_to_sixty,
              top_speed: carData.top_speed,
            };
          }
        }
        
        // Fetch user's build data with modified performance metrics if available
        // The build.id is the community_post id, we need to get user_build_id first
        const { data: postData } = await supabaseAdmin
          .from('community_posts')
          .select('user_build_id')
          .eq('id', build.id)
          .single();
        
        if (postData?.user_build_id) {
          const { data: buildData } = await supabaseAdmin
            .from('user_projects')
            .select('final_hp, total_hp_gain, final_zero_to_sixty, final_braking_60_0, final_lateral_g')
            .eq('id', postData.user_build_id)
            .single();
          
          if (buildData) {
            build.build_data = buildData;
          }
        }
        
        return build;
      })
    );

    return NextResponse.json({
      builds: enrichedBuilds,
      count: enrichedBuilds.length,
      hasMore: builds.length === limit,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
}

export const GET = withErrorLogging(handleGet, { 
  route: 'community/builds', 
  feature: 'community-builds' 
});
