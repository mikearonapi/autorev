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

import { rankFeed, buildUserContext, getLearnedPreferences } from '@/lib/feedAlgorithm';
import { calculateAllModificationGains } from '@/lib/performanceCalculator';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import {
  getBearerToken,
  createAuthenticatedClient,
  createServerSupabaseClient,
} from '@/lib/supabaseServer';

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
      ownedVehicles:
        vehicles?.map((v) => ({
          car_slug: v.car_slug,
          // Extract make from car name (first word, e.g., "BMW M3" -> "BMW")
          make: v.cars?.name?.split(' ')[0] || null,
          hp: v.cars?.hp,
        })) || [],
      favorites: favorites?.map((f) => ({ car_slug: f.car_slug })) || [],
      recentViews: recentViews?.map((v) => ({ car_slug: v.page_identifier })) || [],
      projects: projects?.map((p) => ({ objective: p.objective })) || [],
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

  // Get user ID from auth if available (supports both cookie and Bearer token)
  let userId = null;
  try {
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken
      ? createAuthenticatedClient(bearerToken)
      : await createServerSupabaseClient();

    if (supabase) {
      const {
        data: { user },
      } = bearerToken ? await supabase.auth.getUser(bearerToken) : await supabase.auth.getUser();
      userId = user?.id;
    }
  } catch (e) {
    // No auth, continue as anonymous
  }

  // Generate session seed if not provided
  // Use a combination of date (changes daily) and a random factor
  const today = new Date().toISOString().split('T')[0];
  const feedSeed =
    sessionSeed || `${today}-${userId || 'anon'}-${Math.floor(Math.random() * 1000)}`;

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
    return NextResponse.json(
      { error: 'Failed to fetch builds' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  let builds = data || [];

  // Filter by featured if requested
  if (featured) {
    builds = builds.filter((b) => b.is_featured);
  }

  // Enrich builds with car data and computed performance
  const enrichedBuilds = await Promise.all(
    builds.map(async (build) => {
      try {
        // Fetch car specs (stock values) for the stats display
        // IMPORTANT: Include ALL fields needed by performanceCalculator, especially:
        // - slug: Used by getPlatformDownpipeGain() for platform-specific HP gains
        // - engine: Used by detectAspiration() and getEngineType()
        // - drivetrain: Used by metrics calculator for 0-60 physics
        let carData = null;
        if (build.car_slug) {
          const { data: fetchedCarData, error: carError } = await supabaseAdmin
            .from('cars')
            .select(
              'slug, image_hero_url, hp, torque, engine, drivetrain, zero_to_sixty, top_speed, name, braking_60_0, lateral_g, quarter_mile, curb_weight'
            )
            .eq('slug', build.car_slug)
            .single();

          if (carError) {
            console.error(`[CommunityBuilds] Car fetch error for ${build.car_slug}:`, carError);
          } else if (fetchedCarData) {
            carData = fetchedCarData;
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
        // IMPORTANT: Use user_vehicle_id for DIRECT link to vehicle (SOURCE OF TRUTH)
        const { data: postData } = await supabaseAdmin
          .from('community_posts')
          .select('user_build_id, user_id, user_vehicle_id')
          .eq('id', build.id)
          .single();

        if (postData?.user_build_id) {
          const { data: projectData } = await supabaseAdmin
            .from('user_projects')
            .select(
              `
              final_hp, 
              stock_hp,
              total_hp_gain, 
              final_zero_to_sixty, 
              stock_zero_to_sixty,
              final_braking_60_0, 
              stock_braking_60_0,
              final_lateral_g,
              stock_lateral_g,
              objective,
              selected_upgrades
            `
            )
            .eq('id', postData.user_build_id)
            .single();

          if (projectData) {
            // Merge project data with existing build_data (from RPC) instead of replacing
            build.build_data = {
              ...build.build_data, // Keep existing RPC data
              ...projectData, // Override with project-specific data
            };
            build.build_objective = projectData.objective;
          }
        }

        // =======================================================================
        // COMPUTED PERFORMANCE (SOURCE OF TRUTH)
        //
        // ALWAYS calculate dynamically from the linked vehicle's installed_modifications.
        // This ensures Community builds show the SAME values as the user's Garage.
        //
        // NEVER use stored values like build_data.final_hp or user_projects.total_hp_gain
        // - those become stale when calculation logic improves or mods change.
        //
        // If no vehicle is linked, show STOCK values (not planned values from user_projects).
        // =======================================================================
        if (carData) {
          const isOwnBuild = userId && postData?.user_id === userId;

          // Get vehicle data for live performance calculation
          // Include custom_specs to check for user-provided dyno data
          let vehicleData = null;
          let latestDynoResult = null;
          if (postData?.user_vehicle_id) {
            const { data: vehicle } = await supabaseAdmin
              .from('user_vehicles')
              .select('installed_modifications, custom_specs')
              .eq('id', postData.user_vehicle_id)
              .single();
            vehicleData = vehicle;

            // Also fetch latest dyno result from user_dyno_results table
            const { data: dynoResult } = await supabaseAdmin
              .from('user_dyno_results')
              .select('whp, wtq, boost_psi, dyno_shop, dyno_date, is_verified')
              .eq('user_vehicle_id', postData.user_vehicle_id)
              .order('dyno_date', { ascending: false })
              .limit(1)
              .single();
            if (dynoResult) {
              latestDynoResult = dynoResult;
            }
          } else {
            // Log missing vehicle link - this means performance will show stock values
            // The ShareBuildModal should always link to the vehicle
            console.warn(
              `[CommunityBuilds] Build ${build.id} has no user_vehicle_id - showing stock values`
            );
          }

          const installedMods = vehicleData?.installed_modifications || [];

          // Get planned mods from build project (for status comparison only)
          let plannedMods = [];
          if (build.build_data?.selected_upgrades) {
            const rawSelected = build.build_data.selected_upgrades;
            const rawKeys = Array.isArray(rawSelected) ? rawSelected : rawSelected?.upgrades || [];
            plannedMods = (rawKeys || [])
              .map((u) => (typeof u === 'string' ? u : u?.key))
              .filter(Boolean);
          }

          // Calculate build status by comparing planned vs installed
          let buildStatus = null;
          if (plannedMods.length > 0) {
            const installedCount = plannedMods.filter((mod) => installedMods.includes(mod)).length;
            if (installedMods.length > 0 && installedCount >= plannedMods.length) {
              buildStatus = 'complete';
            } else if (installedCount > 0) {
              buildStatus = 'in_progress';
            } else if (installedMods.length > 0) {
              buildStatus = 'in_progress';
            } else {
              buildStatus = 'planned';
            }
          } else if (installedMods.length > 0) {
            buildStatus = 'complete';
          }

          // Calculate HP using the SAME calculator the garage uses
          // This ensures consistency across the app
          const normalizedCar = {
            ...carData,
            zeroToSixty: carData.zero_to_sixty,
            braking60To0: carData.braking_60_0,
            lateralG: carData.lateral_g,
            quarterMile: carData.quarter_mile,
            curbWeight: carData.curb_weight,
          };

          const modGains =
            installedMods.length > 0
              ? calculateAllModificationGains(installedMods, normalizedCar)
              : { hpGain: 0, torqueGain: 0, zeroToSixtyImprovement: 0 };

          const stockHp = carData.hp || 0;
          const stockTorque = carData.torque || 0;
          const hpGain = modGains.hpGain || 0;
          const torqueGain = modGains.torqueGain || 0;
          const zeroToSixtyImprovement = modGains.zeroToSixtyImprovement || 0;

          // Check for user-provided dyno data
          // Priority: user_dyno_results table > custom_specs.dyno > custom_specs.engine
          const dynoFromTable = latestDynoResult?.whp ? latestDynoResult : null;
          const dynoFromSpecs =
            vehicleData?.custom_specs?.dyno || vehicleData?.custom_specs?.engine;
          const dynoData = dynoFromTable || dynoFromSpecs;
          const hasUserDynoData = !!(dynoData?.whp && dynoData.whp > 0);

          // Use dyno data if available, otherwise use calculated values
          const finalHp = hasUserDynoData ? dynoData.whp : stockHp + hpGain;
          const finalTorque =
            hasUserDynoData && dynoData?.wtq ? dynoData.wtq : stockTorque + torqueGain;

          build.computedPerformance = {
            stock: {
              hp: stockHp,
              torque: stockTorque,
              zeroToSixty: carData.zero_to_sixty,
              braking60To0: carData.braking_60_0,
              lateralG: carData.lateral_g,
            },
            upgraded: {
              hp: finalHp,
              torque: finalTorque,
              zeroToSixty: carData.zero_to_sixty
                ? Math.max(2.0, carData.zero_to_sixty - zeroToSixtyImprovement)
                : null,
              braking60To0: carData.braking_60_0,
              lateralG: carData.lateral_g,
            },
            hpGain: hasUserDynoData ? finalHp - stockHp : hpGain,
            torqueGain: hasUserDynoData ? finalTorque - stockTorque : torqueGain,
            upgradeKeys: installedMods,
            installedMods,
            plannedMods,
            isCurrentUserBuild: isOwnBuild,
            // Data source tracking for UI badges
            isUserProvided: hasUserDynoData,
            dataSources: hasUserDynoData
              ? {
                  hp: dynoFromTable?.is_verified ? 'verified' : 'measured',
                  torque: dynoData?.wtq
                    ? dynoFromTable?.is_verified
                      ? 'verified'
                      : 'measured'
                    : 'estimated',
                }
              : null,
            dynoShop: hasUserDynoData ? dynoFromTable?.dyno_shop || dynoFromSpecs?.dynoShop : null,
          };
          build.buildStatus = buildStatus;
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

  return NextResponse.json(
    {
      builds: clientBuilds,
      count: clientBuilds.length,
      hasMore: enrichedBuilds.length >= fetchLimit,
      _meta: {
        sort,
        seed: feedSeed,
        personalized: !!userId,
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
    }
  );
}

export const GET = withErrorLogging(handleGet, {
  route: 'community/builds',
  feature: 'community-builds',
});
