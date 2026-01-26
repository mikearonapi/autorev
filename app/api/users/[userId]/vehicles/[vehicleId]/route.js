/**
 * User Vehicle API
 * 
 * Endpoints:
 * - GET: Fetch specific vehicle details
 * - PATCH: Update vehicle tracking data (Car Concierge)
 * - DELETE: Remove vehicle from garage
 * 
 * Auth: User must be authenticated and can only access their own vehicles
 */

import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { rateLimit } from '@/lib/rateLimit';

// Allowed battery_status enum values (matches DATABASE.md)
const BATTERY_STATUS_ENUM = ['good', 'fair', 'weak', 'dead', 'unknown'];

/**
 * GET /api/users/[userId]/vehicles/[vehicleId]
 * Fetch specific vehicle with all details
 */
async function handleGet(request, { params }) {
    const { userId, vehicleId } = await params;
    
    if (!userId || !vehicleId) {
      return NextResponse.json(
        { error: 'User ID and Vehicle ID are required' },
        { status: 400 }
      );
    }
    
    // Get authenticated user
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken 
      ? createAuthenticatedClient(bearerToken) 
      : await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service not configured' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the authenticated user matches the userId param
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to view this user\'s vehicles' },
        { status: 403 }
      );
    }

    // Fetch the vehicle with full details
    const { data: vehicle, error } = await supabase
      .from('user_vehicles')
      .select(`
        id,
        vin,
        year,
        make,
        model,
        trim,
        matched_car_slug,
        matched_car_id,
        matched_car_variant_id,
        nickname,
        color,
        mileage,
        purchase_date,
        purchase_price,
        is_primary,
        ownership_status,
        notes,
        vin_decode_data,
        installed_modifications,
        active_build_id,
        total_hp_gain,
        modified_at,
        custom_specs,
        last_started_at,
        battery_status,
        battery_installed_date,
        storage_mode,
        tire_installed_date,
        tire_brand_model,
        tire_tread_32nds,
        registration_due_date,
        inspection_due_date,
        last_inspection_date,
        last_oil_change_date,
        last_oil_change_mileage,
        next_oil_due_mileage,
        owner_notes,
        health_last_analyzed_at,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .eq('id', vehicleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Vehicle not found' },
          { status: 404 }
        );
      }
      console.error('[API/vehicles/[vehicleId]] Error fetching vehicle:', error);
      return NextResponse.json(
        { error: 'Failed to fetch vehicle' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      vehicle,
    });
}

/**
 * PATCH /api/users/[userId]/vehicles/[vehicleId]
 * Update vehicle tracking data (Car Concierge maintenance tracking)
 * 
 * Request body fields (all optional):
 * - mileage: number - Current odometer reading
 * - last_started_at: ISO date string - Last time vehicle was started
 * - battery_status: enum - Battery health (good/fair/weak/dead/unknown)
 * - battery_installed_date: ISO date string - When battery was last replaced
 * - storage_mode: boolean - Is vehicle in storage/not driven regularly
 * - tire_installed_date: ISO date string - When current tires were installed
 * - tire_brand_model: string - Brand and model of current tires
 * - tire_tread_32nds: number - Tire tread depth in 32nds of an inch
 * - registration_due_date: ISO date string - Registration renewal date
 * - inspection_due_date: ISO date string - Next inspection due date
 * - last_inspection_date: ISO date string - Last inspection date
 * - last_oil_change_date: ISO date string - Last oil change date
 * - last_oil_change_mileage: number - Odometer reading at last oil change
 * - owner_notes: string - User notes about the vehicle
 * - nickname: string - Vehicle nickname
 * - color: string - Vehicle color
 * - purchase_date: ISO date string - Purchase date
 * - purchase_price: number - Purchase price
 * - is_primary: boolean - Is this the user's primary vehicle
 * - notes: string - General vehicle notes
 * 
 * Auto-computed fields:
 * - next_oil_due_mileage: Computed when last_oil_change_mileage is updated
 */
async function handlePatch(request, { params }) {
  const limited = rateLimit(request, 'api');
  if (limited) return limited;

  const { userId, vehicleId } = await params;
    
    if (!userId || !vehicleId) {
      return NextResponse.json(
        { error: 'User ID and Vehicle ID are required' },
        { status: 400 }
      );
    }
    
    // Get authenticated user
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken 
      ? createAuthenticatedClient(bearerToken) 
      : await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service not configured' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the authenticated user matches the userId param
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to modify this user\'s vehicles' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate battery_status if provided
    if (body.battery_status && !BATTERY_STATUS_ENUM.includes(body.battery_status)) {
      return NextResponse.json(
        { 
          error: `Invalid battery_status. Must be one of: ${BATTERY_STATUS_ENUM.join(', ')}`,
          allowedValues: BATTERY_STATUS_ENUM,
        },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updates = {};
    
    // Maintenance tracking fields
    if (body.mileage !== undefined) updates.mileage = body.mileage;
    if (body.last_started_at !== undefined) updates.last_started_at = body.last_started_at;
    if (body.battery_status !== undefined) updates.battery_status = body.battery_status;
    if (body.battery_installed_date !== undefined) updates.battery_installed_date = body.battery_installed_date;
    if (body.storage_mode !== undefined) updates.storage_mode = body.storage_mode;
    if (body.tire_installed_date !== undefined) updates.tire_installed_date = body.tire_installed_date;
    if (body.tire_brand_model !== undefined) updates.tire_brand_model = body.tire_brand_model;
    if (body.tire_tread_32nds !== undefined) updates.tire_tread_32nds = body.tire_tread_32nds;
    if (body.registration_due_date !== undefined) updates.registration_due_date = body.registration_due_date;
    if (body.inspection_due_date !== undefined) updates.inspection_due_date = body.inspection_due_date;
    if (body.last_inspection_date !== undefined) updates.last_inspection_date = body.last_inspection_date;
    if (body.last_oil_change_date !== undefined) updates.last_oil_change_date = body.last_oil_change_date;
    if (body.last_oil_change_mileage !== undefined) updates.last_oil_change_mileage = body.last_oil_change_mileage;
    if (body.owner_notes !== undefined) updates.owner_notes = body.owner_notes;

    // Basic vehicle info fields
    if (body.nickname !== undefined) updates.nickname = body.nickname;
    if (body.color !== undefined) updates.color = body.color;
    if (body.purchase_date !== undefined) updates.purchase_date = body.purchase_date;
    if (body.purchase_price !== undefined) updates.purchase_price = body.purchase_price;
    if (body.is_primary !== undefined) updates.is_primary = body.is_primary;
    if (body.notes !== undefined) updates.notes = body.notes;

    // Specs confirmation - user confirms specs are accurate
    if (body.specs_confirmed !== undefined) {
      updates.specs_confirmed = body.specs_confirmed;
      if (body.specs_confirmed) {
        updates.specs_confirmed_at = new Date().toISOString();
      } else {
        updates.specs_confirmed_at = null;
      }
    }

    // Auto-compute next_oil_due_mileage if oil change is being logged
    if (body.last_oil_change_mileage !== undefined) {
      // Fetch vehicle to get matched_car_id (car_slug column no longer exists on maintenance tables)
      const { data: vehicle } = await supabase
        .from('user_vehicles')
        .select('matched_car_id')
        .eq('user_id', userId)
        .eq('id', vehicleId)
        .single();

      if (vehicle?.matched_car_id) {
        // Get oil change interval from maintenance specs using car_id
        const { data: maintenanceSpecs } = await supabase
          .from('vehicle_maintenance_specs')
          .select('oil_change_interval_miles')
          .eq('car_id', vehicle.matched_car_id)
          .single();

        if (maintenanceSpecs?.oil_change_interval_miles) {
          const interval = maintenanceSpecs.oil_change_interval_miles;
          updates.next_oil_due_mileage = body.last_oil_change_mileage + interval;
        }
      }
    }

    // Check if any fields were provided
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No update fields provided' },
        { status: 400 }
      );
    }

    // Update the vehicle
    const { data, error } = await supabase
      .from('user_vehicles')
      .update(updates)
      .eq('user_id', userId)
      .eq('id', vehicleId)
      .select(`
        id,
        vin,
        year,
        make,
        model,
        trim,
        matched_car_slug,
        matched_car_id,
        matched_car_variant_id,
        nickname,
        color,
        mileage,
        purchase_date,
        purchase_price,
        is_primary,
        ownership_status,
        notes,
        vin_decode_data,
        installed_modifications,
        active_build_id,
        total_hp_gain,
        modified_at,
        custom_specs,
        last_started_at,
        battery_status,
        battery_installed_date,
        storage_mode,
        tire_installed_date,
        tire_brand_model,
        tire_tread_32nds,
        registration_due_date,
        inspection_due_date,
        last_inspection_date,
        last_oil_change_date,
        last_oil_change_mileage,
        next_oil_due_mileage,
        owner_notes,
        health_last_analyzed_at,
        specs_confirmed,
        specs_confirmed_at,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Vehicle not found' },
          { status: 404 }
        );
      }
      console.error('[API/vehicles/[vehicleId]] Error updating vehicle:', error);
      return NextResponse.json(
        { error: 'Failed to update vehicle' },
        { status: 500 }
      );
    }

    // If specs were confirmed, trigger score recalculation
    if (updates.specs_confirmed) {
      try {
        await supabase.rpc('update_garage_score', { p_vehicle_id: vehicleId });
      } catch (scoreError) {
        console.warn('[API/vehicles/[vehicleId]] Score update warning:', scoreError);
        // Non-critical, don't fail the request
      }
    }

    return NextResponse.json({
      success: true,
      vehicle: data,
      message: updates.specs_confirmed ? 'Specs confirmed successfully!' : 'Vehicle updated successfully',
    });
}

/**
 * DELETE /api/users/[userId]/vehicles/[vehicleId]
 * Remove vehicle from user's garage
 */
async function handleDelete(request, { params }) {
  const limited = rateLimit(request, 'api');
  if (limited) return limited;

  const { userId, vehicleId } = await params;
    
    if (!userId || !vehicleId) {
      return NextResponse.json(
        { error: 'User ID and Vehicle ID are required' },
        { status: 400 }
      );
    }
    
    // Get authenticated user
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken 
      ? createAuthenticatedClient(bearerToken) 
      : await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service not configured' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the authenticated user matches the userId param
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to modify this user\'s vehicles' },
        { status: 403 }
      );
    }

    // Delete the vehicle
    const { error } = await supabase
      .from('user_vehicles')
      .delete()
      .eq('user_id', userId)
      .eq('id', vehicleId);

    if (error) {
      console.error('[API/vehicles/[vehicleId]] Error deleting vehicle:', error);
      return NextResponse.json(
        { error: 'Failed to delete vehicle' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
}

// Export wrapped handlers with error logging
export const GET = withErrorLogging(handleGet, { route: 'users/vehicles/[vehicleId]', feature: 'garage' });
export const PATCH = withErrorLogging(handlePatch, { route: 'users/vehicles/[vehicleId]', feature: 'garage' });
export const DELETE = withErrorLogging(handleDelete, { route: 'users/vehicles/[vehicleId]', feature: 'garage' });












