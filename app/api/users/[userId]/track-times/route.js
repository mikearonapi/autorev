import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/users/[userId]/track-times
 * Fetch user's track time history
 * 
 * Query params:
 * - track: Filter by track name
 * - carSlug: Filter by car
 * - limit: Number of results (default 20)
 */
export async function GET(request, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { userId } = params;
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
    
    // Use the helper function to get track history with improvements calculated
    const { data, error } = await supabase.rpc('get_user_track_history', {
      p_user_id: userId,
      p_track_name: track || null,
      p_car_slug: carSlug || null,
      p_limit: limit
    });
    
    if (error) {
      // If RPC doesn't exist yet (migration not run), fall back to direct query
      if (error.code === '42883') {
        const query = supabase
          .from('user_track_times')
          .select(`
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
          `)
          .eq('user_id', userId)
          .order('session_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (track) query.eq('track_name', track);
        if (carSlug) query.eq('car_slug', carSlug);
        
        const { data: fallbackData, error: fallbackError } = await query;
        
        if (fallbackError) {
          console.error('[TrackTimes] Error fetching track times:', fallbackError);
          return NextResponse.json({ error: 'Failed to fetch track times' }, { status: 500 });
        }
        
        return NextResponse.json({ times: fallbackData || [] });
      }
      
      console.error('[TrackTimes] RPC error:', error);
      return NextResponse.json({ error: 'Failed to fetch track times' }, { status: 500 });
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
export async function POST(request, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { userId } = params;
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const body = await request.json();
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
      timingSystem
    } = body;
    
    // Validate required fields
    if (!trackName || !lapTimeSeconds) {
      return NextResponse.json({ 
        error: 'Missing required fields: trackName, lapTimeSeconds' 
      }, { status: 400 });
    }
    
    // Validate lap time is reasonable (between 20 seconds and 20 minutes)
    if (lapTimeSeconds < 20 || lapTimeSeconds > 1200) {
      return NextResponse.json({ 
        error: 'Lap time must be between 20 seconds and 20 minutes' 
      }, { status: 400 });
    }
    
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
        timing_system: timingSystem || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('[TrackTimes] Error inserting track time:', error);
      return NextResponse.json({ error: 'Failed to save track time' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, trackTime: data });
    
  } catch (err) {
    console.error('[TrackTimes] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/users/[userId]/track-times?id=xxx
 * Delete a track time entry
 */
export async function DELETE(request, { params }) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { userId } = params;
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
