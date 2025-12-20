/**
 * Vehicle Modifications API
 * 
 * Endpoints:
 * - POST: Apply modifications to a vehicle
 * - PUT: Update modifications (same as POST)
 * - DELETE: Clear all modifications (reset to stock)
 * 
 * Auth: User must be authenticated and can only modify their own vehicles
 */

import { NextResponse } from 'next/server';
import { createAuthenticatedClient, getBearerToken } from '@/lib/supabaseServer';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * POST /api/users/[userId]/vehicles/[vehicleId]/modifications
 * Apply modifications to a vehicle
 * 
 * Request body:
 * - upgrades: string[] - Array of upgrade keys
 * - totalHpGain: number - Total HP gain from mods
 * - buildId?: string - Optional user_projects.id if applying from a build
 */
export async function POST(request, { params }) {
  try {
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
      : createRouteHandlerClient({ cookies });

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
    const { upgrades = [], totalHpGain = 0, buildId = null } = body;

    // Validate upgrades is an array
    if (!Array.isArray(upgrades)) {
      return NextResponse.json(
        { error: 'upgrades must be an array of strings' },
        { status: 400 }
      );
    }

    // If buildId provided, verify it belongs to this user
    if (buildId) {
      const { data: build, error: buildError } = await supabase
        .from('user_projects')
        .select('id')
        .eq('user_id', userId)
        .eq('id', buildId)
        .single();
      
      if (buildError || !build) {
        return NextResponse.json(
          { error: 'Build not found or does not belong to this user' },
          { status: 404 }
        );
      }
    }

    // Update the vehicle with modifications
    const { data, error } = await supabase
      .from('user_vehicles')
      .update({
        installed_modifications: upgrades,
        total_hp_gain: totalHpGain,
        active_build_id: buildId,
        modified_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) {
      console.error('[API/vehicles/modifications] Error applying mods:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to apply modifications' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      vehicle: data,
      message: upgrades.length > 0 
        ? `Applied ${upgrades.length} modification(s) to vehicle`
        : 'Vehicle reset to stock',
    });

  } catch (err) {
    console.error('[API/vehicles/modifications] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[userId]/vehicles/[vehicleId]/modifications
 * Update modifications (alias for POST)
 */
export async function PUT(request, context) {
  return POST(request, context);
}

/**
 * DELETE /api/users/[userId]/vehicles/[vehicleId]/modifications
 * Clear all modifications from a vehicle
 */
export async function DELETE(request, { params }) {
  try {
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
      : createRouteHandlerClient({ cookies });

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

    // Clear modifications
    const { data, error } = await supabase
      .from('user_vehicles')
      .update({
        installed_modifications: [],
        total_hp_gain: 0,
        active_build_id: null,
        modified_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) {
      console.error('[API/vehicles/modifications] Error clearing mods:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to clear modifications' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      vehicle: data,
      message: 'Vehicle reset to stock configuration',
    });

  } catch (err) {
    console.error('[API/vehicles/modifications] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/[userId]/vehicles/[vehicleId]/modifications
 * Get vehicle modifications (with optional build details)
 */
export async function GET(request, { params }) {
  try {
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
      : createRouteHandlerClient({ cookies });

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

    // Fetch vehicle with optional build join
    const { data, error } = await supabase
      .from('user_vehicles')
      .select(`
        id,
        installed_modifications,
        total_hp_gain,
        active_build_id,
        modified_at,
        active_build:user_projects(id, project_name, selected_upgrades, total_hp_gain)
      `)
      .eq('user_id', userId)
      .eq('id', vehicleId)
      .single();

    if (error) {
      console.error('[API/vehicles/modifications] Error fetching mods:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch modifications' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      vehicleId: data.id,
      modifications: data.installed_modifications || [],
      totalHpGain: data.total_hp_gain || 0,
      activeBuildId: data.active_build_id,
      activeBuild: data.active_build,
      modifiedAt: data.modified_at,
      isModified: (data.installed_modifications?.length || 0) > 0,
    });

  } catch (err) {
    console.error('[API/vehicles/modifications] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


