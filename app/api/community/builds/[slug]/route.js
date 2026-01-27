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

import { createClient } from '@supabase/supabase-js';

import { calculateAllModificationGains } from '@/lib/performanceCalculator';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import {
  getBearerToken,
  createAuthenticatedClient,
  createServerSupabaseClient,
} from '@/lib/supabaseServer';

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
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  // Get user ID from auth if available (for current user's build detection)
  let currentUserId = null;
  try {
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken
      ? createAuthenticatedClient(bearerToken)
      : await createServerSupabaseClient();

    if (supabase) {
      const {
        data: { user },
      } = bearerToken ? await supabase.auth.getUser(bearerToken) : await supabase.auth.getUser();
      currentUserId = user?.id;
    }
  } catch (e) {
    // No auth, continue as anonymous
  }

  try {
    // Use the RPC function to get full build data
    const { data: postData, error: postError } = await supabaseAdmin.rpc(
      'get_community_post_by_slug',
      { p_slug: slug }
    );

    if (postError) {
      console.error('[Build Detail API] RPC error:', postError);
      return NextResponse.json({ error: 'Failed to fetch build' }, { status: 500 });
    }

    if (!postData || postData.length === 0) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    const result = postData[0];
    const post = result.post;
    const buildData = result.build_data;
    const vehicleData = result.vehicle_data; // Direct link to user_vehicles via user_vehicle_id

    // Check if this is the current user's own build
    const isOwnBuild = currentUserId && post?.user_id === currentUserId;

    // Fetch car data for performance calculations if we have a car_slug
    let carData = null;
    if (post?.car_slug) {
      const { data: car, error: carError } = await supabaseAdmin
        .from('cars')
        .select(
          `
          id,
          slug,
          name,
          hp,
          torque,
          engine,
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
        `
        )
        .eq('slug', post.car_slug)
        .single();

      if (!carError && car) {
        carData = car;
      }
    }

    // Fetch latest dyno result if vehicle is linked
    let latestDynoResult = null;
    if (post?.user_vehicle_id) {
      const { data: dynoResult } = await supabaseAdmin
        .from('user_dyno_results')
        .select('whp, wtq, boost_psi, dyno_shop, dyno_date, is_verified')
        .eq('user_vehicle_id', post.user_vehicle_id)
        .order('dyno_date', { ascending: false })
        .limit(1)
        .single();
      if (dynoResult) {
        latestDynoResult = dynoResult;
      }
    }

    // =========================================================================
    // COMPUTED PERFORMANCE (SOURCE OF TRUTH)
    //
    // ARCHITECTURE: Use PRE-CALCULATED values from user_vehicles
    // The garage calculates performance when mods are installed and stores
    // total_hp_gain in user_vehicles. We just READ that value here.
    // =========================================================================
    let computedPerformance = null;
    let buildStatus = null;
    try {
      if (carData) {
        // Get mods from linked vehicle
        const installedMods = vehicleData?.installed_modifications || [];

        // Get planned mods from build project (for status comparison only)
        let plannedMods = [];
        if (buildData?.selected_upgrades) {
          const rawSelected = buildData.selected_upgrades;
          const rawKeys = Array.isArray(rawSelected) ? rawSelected : rawSelected?.upgrades || [];

          plannedMods = (rawKeys || [])
            .map((u) => (typeof u === 'string' ? u : u?.key))
            .filter(Boolean);
        }

        // Calculate build status by comparing planned vs installed
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
        const dynoFromSpecs = vehicleData?.custom_specs?.dyno || vehicleData?.custom_specs?.engine;
        const dynoData = dynoFromTable || dynoFromSpecs;
        const hasUserDynoData = !!(dynoData?.whp && dynoData.whp > 0);

        // Use dyno data if available, otherwise use calculated values
        const finalHp = hasUserDynoData ? dynoData.whp : stockHp + hpGain;
        const finalTorque =
          hasUserDynoData && dynoData?.wtq ? dynoData.wtq : stockTorque + torqueGain;

        computedPerformance = {
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
                zeroToSixty: 'calibrated',
                braking: 'estimated',
                lateralG: 'estimated',
              }
            : null,
          dynoShop: hasUserDynoData ? dynoFromTable?.dyno_shop || dynoFromSpecs?.dynoShop : null,
          dynoDate: hasUserDynoData ? dynoFromTable?.dyno_date || dynoFromSpecs?.dynoDate : null,
        };
      }
    } catch (e) {
      console.error('[Build Detail API] Failed to compute performance:', e);
      computedPerformance = null;
    }

    // Fetch community post parts if available
    let parts = [];
    if (post?.id) {
      const PARTS_COLS =
        'id, community_post_id, category, brand, part_name, part_number, price, notes, link_url, created_at';

      const { data: partsData } = await supabaseAdmin
        .from('community_post_parts')
        .select(PARTS_COLS)
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
        .select(
          `
          id,
          part_id,
          quantity,
          part_name,
          brand_name,
          price_cents,
          notes,
          category
        `
        )
        .eq('project_id', buildData.id);

      if (projectParts && projectParts.length > 0) {
        // Merge project parts with community parts
        const formattedProjectParts = projectParts.map((p) => ({
          ...p,
          mod_type: p.part_name,
          product_name: p.part_name,
          source: 'project',
        }));
        parts = [...parts, ...formattedProjectParts];
      }
    }

    return NextResponse.json(
      {
        build: {
          ...post,
          author: result.author,
          images: result.images || [],
        },
        buildData,
        carData,
        computedPerformance,
        buildStatus, // 'complete' | 'in_progress' | 'planned' | null
        vehicleData, // Current user's vehicle data
        parts,
      },
      {
        headers: {
          // Disable caching temporarily to ensure fresh data
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('[Build Detail API] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, {
  route: 'community/builds/[slug]',
  feature: 'community-build-detail',
});
