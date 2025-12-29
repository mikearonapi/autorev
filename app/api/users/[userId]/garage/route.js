/**
 * User Garage API
 * 
 * Endpoints:
 * - GET: Fetch user's vehicles (garage)
 * 
 * Auth: User must be authenticated and can only view their own garage
 */

import { NextResponse } from 'next/server';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';

/**
 * GET /api/users/[userId]/garage
 * Fetch user's garage vehicles
 * 
 * Returns:
 * - vehicles: Array of vehicle objects with make, model, year, etc.
 */
export async function GET(request, { params }) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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
        { error: 'Not authorized to view this user\'s garage' },
        { status: 403 }
      );
    }

    // Fetch user's vehicles
    const { data: vehicles, error } = await supabase
      .from('user_vehicles')
      .select(`
        id,
        vin,
        year,
        make,
        model,
        trim,
        matched_car_slug,
        nickname,
        color,
        mileage,
        purchase_date,
        purchase_price,
        is_primary,
        ownership_status,
        notes,
        vin_decode_data,
        created_at,
        updated_at,
        installed_modifications,
        active_build_id,
        total_hp_gain,
        modified_at,
        custom_specs
      `)
      .eq('user_id', userId)
      .eq('ownership_status', 'owned')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API/users/garage] Error fetching vehicles:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch garage' },
        { status: 500 }
      );
    }

    // Transform to client-friendly format
    const transformedVehicles = (vehicles || []).map(v => {
      const customSpecs = v.custom_specs || {};
      return {
        id: v.id,
        vin: v.vin,
        year: v.year,
        make: v.make,
        model: v.model,
        trim: v.trim,
        matchedCarSlug: v.matched_car_slug,
        nickname: v.nickname,
        color: v.color,
        mileage: v.mileage,
        purchaseDate: v.purchase_date,
        purchasePrice: v.purchase_price,
        isPrimary: v.is_primary,
        ownershipStatus: v.ownership_status,
        notes: v.notes,
        vinDecodeData: v.vin_decode_data,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
        installedModifications: v.installed_modifications || [],
        activeBuildId: v.active_build_id,
        totalHpGain: v.total_hp_gain || 0,
        modifiedAt: v.modified_at,
        isModified: Array.isArray(v.installed_modifications) && v.installed_modifications.length > 0,
        // Custom specs (user-specific modification details)
        customSpecs: customSpecs,
        hasCustomSpecs: Object.keys(customSpecs).length > 0,
      };
    });

    return NextResponse.json({
      vehicles: transformedVehicles,
      count: transformedVehicles.length,
    });

  } catch (err) {
    console.error('[API/users/garage] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

