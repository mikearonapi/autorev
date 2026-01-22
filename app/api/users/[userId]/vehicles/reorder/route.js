/**
 * Vehicle Reorder API
 * 
 * Endpoints:
 * - PUT: Reorder user's vehicles in garage
 * 
 * Auth: User must be authenticated and can only modify their own vehicles
 */

import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import { withErrorLogging } from '@/lib/serverErrorLogger';

/**
 * PUT /api/users/[userId]/vehicles/reorder
 * Reorder user's garage vehicles
 * 
 * Request body:
 * - vehicleIds: Array of vehicle UUIDs in desired order
 * 
 * Returns:
 * - success: boolean
 * - message: string
 */
async function handlePut(request, { params }) {
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
      { error: 'Not authorized to modify this user\'s vehicles' },
      { status: 403 }
    );
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const { vehicleIds } = body;

  // Validate vehicleIds
  if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
    return NextResponse.json(
      { error: 'vehicleIds must be a non-empty array of vehicle UUIDs' },
      { status: 400 }
    );
  }

  // Validate all IDs are valid UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const id of vehicleIds) {
    if (typeof id !== 'string' || !uuidRegex.test(id)) {
      return NextResponse.json(
        { error: `Invalid vehicle ID format: ${id}` },
        { status: 400 }
      );
    }
  }

  // Verify all vehicles belong to this user
  const { data: existingVehicles, error: fetchError } = await supabase
    .from('user_vehicles')
    .select('id')
    .eq('user_id', userId)
    .eq('ownership_status', 'owned')
    .in('id', vehicleIds);

  if (fetchError) {
    console.error('[API/vehicles/reorder] Error fetching vehicles:', fetchError);
    return NextResponse.json(
      { error: 'Failed to verify vehicle ownership' },
      { status: 500 }
    );
  }

  const existingIds = new Set(existingVehicles?.map(v => v.id) || []);
  const invalidIds = vehicleIds.filter(id => !existingIds.has(id));
  
  if (invalidIds.length > 0) {
    return NextResponse.json(
      { error: `Vehicles not found or not owned by user: ${invalidIds.join(', ')}` },
      { status: 400 }
    );
  }

  // Update display_order for each vehicle
  // Using individual updates to maintain atomicity within RLS constraints
  const updates = vehicleIds.map((vehicleId, index) => 
    supabase
      .from('user_vehicles')
      .update({ display_order: index + 1 })
      .eq('id', vehicleId)
      .eq('user_id', userId) // RLS safety
  );

  try {
    const results = await Promise.all(updates);
    
    // Check for any errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('[API/vehicles/reorder] Update errors:', errors.map(e => e.error));
      return NextResponse.json(
        { error: 'Failed to update some vehicles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Reordered ${vehicleIds.length} vehicles successfully`,
    });
  } catch (err) {
    console.error('[API/vehicles/reorder] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to reorder vehicles' },
      { status: 500 }
    );
  }
}

export const PUT = withErrorLogging(handlePut, { route: 'users/vehicles/reorder', feature: 'garage' });
