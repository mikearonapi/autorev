/**
 * Dyno Results API
 * 
 * Handles CRUD operations for user dyno results.
 * Part of the "My Data" feedback loop system.
 * 
 * Table: user_dyno_results
 */

import { NextResponse } from 'next/server';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import { errors } from '@/lib/apiErrors';
import { awardPoints } from '@/lib/pointsService';

/**
 * Create Supabase client for route handlers (supports both cookie and Bearer token)
 */
async function createSupabaseClient(request) {
  const bearerToken = getBearerToken(request);
  return bearerToken 
    ? { supabase: createAuthenticatedClient(bearerToken), bearerToken }
    : { supabase: await createServerSupabaseClient(), bearerToken: null };
}

/**
 * GET /api/dyno-results
 * 
 * Fetch dyno results for the current user.
 * Optional query params:
 * - vehicleId: Filter by specific vehicle
 * - limit: Number of results (default 10)
 */
export async function GET(request) {
  try {
    const { supabase, bearerToken } = await createSupabaseClient(request);
    
    if (!supabase) {
      return errors.serviceUnavailable('Authentication service');
    }
    
    // Check authentication
    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    if (authError || !user) {
      return errors.unauthorized();
    }
    
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    // Build query
    let query = supabase
      .from('user_dyno_results')
      .select('*')
      .eq('user_id', user.id)
      .order('dyno_date', { ascending: false })
      .limit(limit);
    
    if (vehicleId) {
      query = query.eq('user_vehicle_id', vehicleId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('[API/dyno-results] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch dyno results' }, { status: 500 });
    }
    
    return NextResponse.json({ results: data });
  } catch (err) {
    console.error('[API/dyno-results] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/dyno-results
 * 
 * Create a new dyno result entry.
 * 
 * Body: {
 *   userVehicleId: string (required)
 *   whp: number (required)
 *   wtq: number (optional)
 *   boostPsi: number (optional)
 *   fuelType: string
 *   dynoType: string
 *   dynoDate: string (date)
 *   dynoShop: string
 *   dynoSheetUrl: string
 *   ambientTempF: number
 *   humidityPercent: number
 *   altitudeFt: number
 *   correctionFactor: string
 *   notes: string
 * }
 */
export async function POST(request) {
  try {
    const { supabase, bearerToken } = await createSupabaseClient(request);
    
    if (!supabase) {
      return errors.serviceUnavailable('Authentication service');
    }
    
    // Check authentication
    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    if (authError || !user) {
      return errors.unauthorized();
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.userVehicleId) {
      return NextResponse.json({ error: 'userVehicleId is required' }, { status: 400 });
    }
    if (!body.whp || body.whp < 1) {
      return NextResponse.json({ error: 'whp is required and must be positive' }, { status: 400 });
    }
    
    // Verify the vehicle belongs to the user
    const { data: vehicle, error: vehicleError } = await supabase
      .from('user_vehicles')
      .select('id')
      .eq('id', body.userVehicleId)
      .eq('user_id', user.id)
      .single();
    
    if (vehicleError || !vehicle) {
      return NextResponse.json({ error: 'Vehicle not found or not owned by user' }, { status: 404 });
    }
    
    // Insert dyno result
    const { data, error } = await supabase
      .from('user_dyno_results')
      .insert({
        user_id: user.id,
        user_vehicle_id: body.userVehicleId,
        whp: body.whp,
        wtq: body.wtq || null,
        boost_psi: body.boostPsi || null,
        fuel_type: body.fuelType || null,
        dyno_type: body.dynoType || null,
        dyno_date: body.dynoDate || new Date().toISOString().split('T')[0],
        dyno_shop: body.dynoShop || null,
        dyno_sheet_url: body.dynoSheetUrl || null,
        ambient_temp_f: body.ambientTempF || null,
        humidity_percent: body.humidityPercent || null,
        altitude_ft: body.altitudeFt || null,
        correction_factor: body.correctionFactor || null,
        notes: body.notes || null,
        is_verified: false,
      })
      .select()
      .single();
    
    if (error) {
      console.error('[API/dyno-results] Insert error:', error);
      return NextResponse.json({ error: 'Failed to save dyno result' }, { status: 500 });
    }
    
    // Award points for logging dyno data (non-blocking)
    awardPoints(user.id, 'data_log_dyno', { dynoResultId: data.id, whp: body.whp }).catch(() => {});
    
    return NextResponse.json({ result: data }, { status: 201 });
  } catch (err) {
    console.error('[API/dyno-results] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/dyno-results
 * 
 * Update an existing dyno result.
 * 
 * Body: {
 *   id: string (required)
 *   ...fields to update
 * }
 */
export async function PUT(request) {
  try {
    const { supabase, bearerToken } = await createSupabaseClient(request);
    
    if (!supabase) {
      return errors.serviceUnavailable('Authentication service');
    }
    
    // Check authentication
    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    if (authError || !user) {
      return errors.unauthorized();
    }
    
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    
    // Build update object (only include fields that were provided)
    const updateData = {
      updated_at: new Date().toISOString(),
    };
    
    if (body.whp !== undefined) updateData.whp = body.whp;
    if (body.wtq !== undefined) updateData.wtq = body.wtq;
    if (body.boostPsi !== undefined) updateData.boost_psi = body.boostPsi;
    if (body.fuelType !== undefined) updateData.fuel_type = body.fuelType;
    if (body.dynoType !== undefined) updateData.dyno_type = body.dynoType;
    if (body.dynoDate !== undefined) updateData.dyno_date = body.dynoDate;
    if (body.dynoShop !== undefined) updateData.dyno_shop = body.dynoShop;
    if (body.dynoSheetUrl !== undefined) updateData.dyno_sheet_url = body.dynoSheetUrl;
    if (body.ambientTempF !== undefined) updateData.ambient_temp_f = body.ambientTempF;
    if (body.humidityPercent !== undefined) updateData.humidity_percent = body.humidityPercent;
    if (body.altitudeFt !== undefined) updateData.altitude_ft = body.altitudeFt;
    if (body.correctionFactor !== undefined) updateData.correction_factor = body.correctionFactor;
    if (body.notes !== undefined) updateData.notes = body.notes;
    
    // Update (with user_id check for security)
    const { data, error } = await supabase
      .from('user_dyno_results')
      .update(updateData)
      .eq('id', body.id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('[API/dyno-results] Update error:', error);
      return NextResponse.json({ error: 'Failed to update dyno result' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Dyno result not found' }, { status: 404 });
    }
    
    return NextResponse.json({ result: data });
  } catch (err) {
    console.error('[API/dyno-results] PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/dyno-results
 * 
 * Delete a dyno result.
 * Query param: id
 */
export async function DELETE(request) {
  try {
    const { supabase, bearerToken } = await createSupabaseClient(request);
    
    if (!supabase) {
      return errors.serviceUnavailable('Authentication service');
    }
    
    // Check authentication
    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    if (authError || !user) {
      return errors.unauthorized();
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    
    // Delete (with user_id check for security)
    const { error } = await supabase
      .from('user_dyno_results')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('[API/dyno-results] Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete dyno result' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API/dyno-results] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
