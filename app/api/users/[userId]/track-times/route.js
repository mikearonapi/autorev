import { NextResponse } from 'next/server';

import { awardPoints } from '@/lib/pointsService';
import { rateLimit } from '@/lib/rateLimit';
import { trackTimeSchema, validateWithSchema, validationErrorResponse } from '@/lib/schemas';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import {
  createAuthenticatedClient,
  createServerSupabaseClient,
  getBearerToken,
} from '@/lib/supabaseServer';

/**
 * GET /api/users/[userId]/track-times
 * Fetch user's track time history
 *
 * Query params:
 * - track: Filter by track name
 * - carSlug: Filter by car
 * - limit: Number of results (default 20)
 */
async function handleGet(request, { params }) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get authenticated user
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken
      ? createAuthenticatedClient(bearerToken)
      : await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const {
      data: { user },
      error: authError,
    } = bearerToken ? await supabase.auth.getUser(bearerToken) : await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can only access their own data
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const track = searchParams.get('track');
    const carSlug = searchParams.get('carSlug');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Try to use the helper function first
    const { data, error } = await supabase.rpc('get_user_track_history', {
      p_user_id: userId,
      p_track_name: track || null,
      p_car_slug: carSlug || null,
      p_limit: limit,
    });

    if (error) {
      // RPC function failed - fall back to direct query
      // Common reasons: function doesn't exist (42883, PGRST202), type mismatch (42804), etc.
      console.warn(
        '[TrackTimes] RPC error, falling back to direct query:',
        error.code,
        error.message
      );

      const query = supabase
        .from('user_track_times')
        .select(
          `
          id,
          track_name,
          track_config,
          lap_time_seconds,
          session_date,
          session_type,
          conditions,
          tire_compound,
          mods_summary,
          estimated_hp,
          notes,
          highlights,
          areas_to_improve,
          car_slug,
          estimated_time_seconds,
          driver_skill_level,
          al_analysis,
          created_at
        `
        )
        .eq('user_id', userId)
        .order('session_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (track) query.eq('track_name', track);
      if (carSlug) query.eq('car_slug', carSlug);

      const { data: fallbackData, error: fallbackError } = await query;

      if (fallbackError) {
        // Table might not exist yet
        if (fallbackError.code === '42P01') {
          return NextResponse.json({ times: [], message: 'Track times feature not yet enabled' });
        }
        console.error('[TrackTimes] Error fetching track times:', fallbackError);
        return NextResponse.json({ error: 'Failed to fetch track times' }, { status: 500 });
      }

      return NextResponse.json({ times: fallbackData || [] });
    }

    return NextResponse.json({ times: data || [] });
  } catch (err) {
    console.error('[TrackTimes] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/users/[userId]/track-times
 * Log a new track time
 */
async function handlePost(request, { params }) {
  const limited = rateLimit(request, 'api');
  if (limited) return limited;

  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get authenticated user
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken
      ? createAuthenticatedClient(bearerToken)
      : await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const {
      data: { user },
      error: authError,
    } = bearerToken ? await supabase.auth.getUser(bearerToken) : await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body with explicit error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[TrackTimes] JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body. Please try again.' },
        { status: 400 }
      );
    }

    // Validate with Zod schema
    const validation = validateWithSchema(trackTimeSchema, body);
    if (!validation.success) {
      return validationErrorResponse(validation.errors);
    }

    const {
      trackName,
      trackConfig,
      trackLengthMiles,
      lapTimeSeconds,
      sessionDate,
      sessionType,
      conditions,
      ambientTempF,
      trackTempF,
      tireCompound,
      tirePressureFront,
      tirePressureRear,
      modsSummary,
      estimatedHp,
      estimatedTimeSeconds,
      driverSkillLevel,
      notes,
      highlights,
      areasToImprove,
      carSlug,
      userVehicleId,
      timingSystem,
    } = validation.data;

    const { data, error } = await supabase
      .from('user_track_times')
      .insert({
        user_id: userId,
        track_name: trackName,
        track_config: trackConfig || null,
        track_length_miles: trackLengthMiles || null,
        lap_time_seconds: lapTimeSeconds,
        session_date: sessionDate || new Date().toISOString().split('T')[0],
        session_type: sessionType || 'track_day',
        conditions: conditions || 'dry',
        ambient_temp_f: ambientTempF || null,
        track_temp_f: trackTempF || null,
        tire_compound: tireCompound || null,
        tire_pressure_front: tirePressureFront || null,
        tire_pressure_rear: tirePressureRear || null,
        mods_summary: modsSummary || {},
        estimated_hp: estimatedHp || null,
        estimated_time_seconds: estimatedTimeSeconds || null,
        driver_skill_level: driverSkillLevel || null,
        notes: notes || null,
        highlights: highlights || null,
        areas_to_improve: areasToImprove || null,
        car_slug: carSlug || null,
        user_vehicle_id: userVehicleId || null,
        timing_system: timingSystem || null,
      })
      .select()
      .single();

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        return NextResponse.json(
          {
            error: 'Track times feature not yet enabled. Please run database migration.',
          },
          { status: 503 }
        );
      }

      // Foreign key constraint violation (e.g., invalid user_vehicle_id)
      if (error.code === '23503') {
        console.error('[TrackTimes] Foreign key violation:', error);
        return NextResponse.json(
          {
            error: 'Invalid vehicle reference. Please try selecting a different vehicle.',
          },
          { status: 400 }
        );
      }

      // Invalid enum value (e.g., session_type or conditions)
      if (error.code === '22P02' || error.message?.includes('invalid input value for enum')) {
        console.error('[TrackTimes] Invalid enum value:', error);
        return NextResponse.json(
          {
            error: 'Invalid session type or track conditions value.',
          },
          { status: 400 }
        );
      }

      // Not null constraint violation
      if (error.code === '23502') {
        console.error('[TrackTimes] Not null violation:', error);
        const field = error.message?.match(/column "([^"]+)"/)?.[1] || 'required field';
        return NextResponse.json(
          {
            error: `Missing required field: ${field}`,
          },
          { status: 400 }
        );
      }

      // Trigger function error (e.g., resolve_car_id_from_slug)
      if (error.code === 'P0001' || error.message?.includes('trigger')) {
        console.error('[TrackTimes] Trigger error:', error);
        return NextResponse.json(
          {
            error: 'Database processing error. Please try again or contact support.',
          },
          { status: 500 }
        );
      }

      // Check constraint violation
      if (error.code === '23514') {
        console.error('[TrackTimes] Check constraint violation:', error);
        return NextResponse.json(
          {
            error: 'Invalid data value. Please check your inputs.',
          },
          { status: 400 }
        );
      }

      console.error('[TrackTimes] Error inserting track time:', error);
      return NextResponse.json(
        {
          error: `Failed to save track time: ${error.message || 'Unknown database error'}`,
        },
        { status: 500 }
      );
    }

    // Award points for logging track time (non-blocking)
    awardPoints(userId, 'data_log_track_time', { trackTimeId: data.id, trackName }).catch(() => {});

    return NextResponse.json({ success: true, trackTime: data });
  } catch (err) {
    console.error('[TrackTimes] Unexpected error:', err);
    // Provide more specific error message based on error type
    const errorMessage = err?.message || 'An unexpected error occurred';
    return NextResponse.json(
      {
        error: `Failed to save track time: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[userId]/track-times?id=xxx
 * Delete a track time entry
 */
async function handleDelete(request, { params }) {
  const limited = rateLimit(request, 'api');
  if (limited) return limited;

  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get authenticated user
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken
      ? createAuthenticatedClient(bearerToken)
      : await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const {
      data: { user },
      error: authError,
    } = bearerToken ? await supabase.auth.getUser(bearerToken) : await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const trackTimeId = searchParams.get('id');

    if (!trackTimeId) {
      return NextResponse.json({ error: 'Missing track time ID' }, { status: 400 });
    }

    const { error } = await supabase
      .from('user_track_times')
      .delete()
      .eq('id', trackTimeId)
      .eq('user_id', userId); // Ensure user owns this record

    if (error) {
      console.error('[TrackTimes] Error deleting track time:', error);
      return NextResponse.json({ error: 'Failed to delete track time' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[TrackTimes] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'users-track-times', feature: 'garage' });
export const POST = withErrorLogging(handlePost, { route: 'users-track-times', feature: 'garage' });
export const DELETE = withErrorLogging(handleDelete, {
  route: 'users-track-times',
  feature: 'garage',
});
