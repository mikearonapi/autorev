/**
 * Community Builds API
 * 
 * GET /api/community/builds - List community builds with algorithmic ranking
 * 
 * Query params:
 *   - limit: number of builds to return (default: 20, max: 50)
 *   - offset: pagination offset (default: 0)
 *   - featured: 'true' to only return featured builds
 *   - sort: 'algorithm' | 'latest' | 'popular' (default: 'algorithm')
 *   - car: filter by car slug
 *   - seed: session seed for consistent randomness (optional)
 * 
 * @route /api/community/builds
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { rankFeed, buildUserContext, getLearnedPreferences } from '@/lib/feedAlgorithm';
import { cookies } from 'next/headers';

// Mark route as dynamic since it uses request.url
export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get user context for personalization
 */
async function getUserContext(userId) {
  if (!userId) return null;
  
  try {
    // Fetch user's owned vehicles
    // Note: cars table has 'name' not 'make' - name contains full car name like "2019 BMW M3"
    const { data: vehicles } = await supabaseAdmin
      .from('user_vehicles')
      .select('car_slug, car_id, cars(name, hp)')
      .eq('user_id', userId)
      .limit(10);
    
    // Fetch user's favorites
    const { data: favorites } = await supabaseAdmin
      .from('user_favorites')
      .select('car_slug')
      .eq('user_id', userId)
      .eq('favorite_type', 'car')
      .limit(50);
    
    // Fetch user's recent car page views (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentViews } = await supabaseAdmin
      .from('page_views')
      .select('page_identifier')
      .eq('user_id', userId)
      .eq('page_type', 'car')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(20);
    
    // Fetch user's projects/builds
    const { data: projects } = await supabaseAdmin
      .from('user_projects')
      .select('objective, car_id')
      .eq('user_id', userId)
      .limit(10);
    
    return buildUserContext({
      ownedVehicles: vehicles?.map(v => ({
        car_slug: v.car_slug,
        // Extract make from car name (first word, e.g., "BMW M3" -> "BMW")
        make: v.cars?.name?.split(' ')[0] || null,
        hp: v.cars?.hp,
      })) || [],
      favorites: favorites?.map(f => ({ car_slug: f.car_slug })) || [],
      recentViews: recentViews?.map(v => ({ car_slug: v.page_identifier })) || [],
      projects: projects?.map(p => ({ objective: p.objective })) || [],
    });
  } catch (error) {
    console.error('[CommunityBuilds] Error fetching user context:', error);
    return null;
  }
}

/**
 * GET /api/community/builds
 * List community builds with algorithmic ranking
 */
async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const offset = parseInt(searchParams.get('offset') || '0');
  const featured = searchParams.get('featured') === 'true';
  const sort = searchParams.get('sort') || 'algorithm';
  const carSlug = searchParams.get('car');
  const sessionSeed = searchParams.get('seed') || null;
  
  // Get user ID from auth if available
  let userId = null;
  try {
    const cookieStore = cookies();
    const supabaseAuthToken = cookieStore.get('sb-access-token')?.value;
    if (supabaseAuthToken) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(supabaseAuthToken);
      userId = user?.id;
    }
  } catch (e) {
    // No auth, continue as anonymous
  }
  
  // Generate session seed if not provided
  // Use a combination of date (changes daily) and a random factor
  const today = new Date().toISOString().split('T')[0];
  const feedSeed = sessionSeed || `${today}-${userId || 'anon'}-${Math.floor(Math.random() * 1000)}`;

  // Fetch more posts than needed for algorithm to work with
  const fetchLimit = Math.min(limit * 3, 100);
  
  // Fetch builds using the RPC function
  const { data, error } = await supabaseAdmin.rpc('get_community_posts', {
    p_post_type: 'build',
    p_car_slug: carSlug || null,
    p_limit: fetchLimit,
    p_offset: offset,
  });

  if (error) {
    console.error('[CommunityBuilds API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch builds' }, { 
      status: 500,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  let builds = data || [];

  // Filter by featured if requested
  if (featured) {
    builds = builds.filter(b => b.is_featured);
  }

  // Enrich builds with car data and build data
  const enrichedBuilds = await Promise.all(
    builds.map(async (build) => {
      try {
        // Fetch car specs (stock values) for the stats display
        if (build.car_slug) {
          const { data: carData, error: carError } = await supabaseAdmin
            .from('cars')
            .select('image_hero_url, hp, torque, zero_to_sixty, top_speed, name')
            .eq('slug', build.car_slug)
            .single();
          
          if (carError) {
            console.error(`[CommunityBuilds] Car fetch error for ${build.car_slug}:`, carError);
          } else if (carData) {
            if (!build.images || build.images.length === 0) {
              build.car_image_url = carData.image_hero_url;
            }
            
            build.car_specs = {
              hp: carData.hp,
              torque: carData.torque,
              zero_to_sixty: carData.zero_to_sixty,
              top_speed: carData.top_speed,
            };
            
            // Extract make from car name (first word)
            build.car_make = carData.name?.split(' ')[0] || null;
          }
        }
        
        // Fetch user's build data with modified performance metrics
        // IMPORTANT: Merge with existing build_data instead of replacing it
        const { data: postData } = await supabaseAdmin
          .from('community_posts')
          .select('user_build_id')
          .eq('id', build.id)
          .single();
        
        if (postData?.user_build_id) {
          const { data: projectData } = await supabaseAdmin
            .from('user_projects')
            .select('final_hp, total_hp_gain, final_zero_to_sixty, final_braking_60_0, final_lateral_g, objective, torque')
            .eq('id', postData.user_build_id)
            .single();
          
          if (projectData) {
            // Merge project data with existing build_data (from RPC) instead of replacing
            build.build_data = {
              ...build.build_data, // Keep existing RPC data
              ...projectData,      // Override with project-specific data
            };
            build.build_objective = projectData.objective;
          }
        }
        
      } catch (err) {
        console.error(`[CommunityBuilds] Enrichment error for build ${build.id}:`, err);
      }
      
      return build;
    })
  );

  // Apply ranking algorithm or simple sort
  let rankedBuilds;
  
  if (sort === 'algorithm') {
    // Get user context for personalization (from profile data)
    const userContext = await getUserContext(userId);
    
    // Get learned preferences (from interaction history)
    const learnedPreferences = await getLearnedPreferences(userId);
    
    // Run the feed algorithm with both static and learned personalization
    rankedBuilds = rankFeed(enrichedBuilds, {
      userContext,
      learnedPreferences,
      sessionSeed: feedSeed,
      limit,
      skipDiversity: false,
    });
  } else if (sort === 'popular') {
    rankedBuilds = enrichedBuilds
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, limit);
  } else {
    // 'latest' - default from RPC is already sorted by published_at DESC
    rankedBuilds = enrichedBuilds.slice(0, limit);
  }

  // Remove internal scoring data before sending to client
  const clientBuilds = rankedBuilds.map(({ _feedScore, _scoreBreakdown, ...build }) => build);

  return NextResponse.json({
    builds: clientBuilds,
    count: clientBuilds.length,
    hasMore: enrichedBuilds.length >= fetchLimit,
    _meta: {
      sort,
      seed: feedSeed,
      personalized: !!userId,
    },
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
}

export const GET = withErrorLogging(handleGet, { 
  route: 'community/builds', 
  feature: 'community-builds' 
});
