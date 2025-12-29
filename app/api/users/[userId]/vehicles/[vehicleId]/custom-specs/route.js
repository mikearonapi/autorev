/**
 * Vehicle Custom Specs API
 * 
 * Endpoints:
 * - GET: Get custom specs for a vehicle
 * - POST: Update custom specs for a vehicle
 * - DELETE: Clear custom specs (reset to showing stock values)
 * 
 * Custom specs allow users to record their actual wheel sizes, tire specs,
 * and other modification details that override stock values in the display.
 * 
 * Auth: User must be authenticated and can only modify their own vehicles
 */

import { NextResponse } from 'next/server';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';

/**
 * Helper to clean custom specs object - remove empty strings and nulls
 */
function cleanCustomSpecs(specs) {
  if (!specs || typeof specs !== 'object') return {};

  const cleaned = {};

  for (const [key, value] of Object.entries(specs)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      const cleanedNested = cleanCustomSpecs(value);
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key] = cleanedNested;
      }
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

/**
 * GET /api/users/[userId]/vehicles/[vehicleId]/custom-specs
 * Get custom specs for a vehicle
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

    // Fetch vehicle custom specs
    const { data, error } = await supabase
      .from('user_vehicles')
      .select('id, custom_specs')
      .eq('user_id', userId)
      .eq('id', vehicleId)
      .single();

    if (error) {
      console.error('[API/vehicles/custom-specs] Error fetching specs:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch custom specs' },
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
      customSpecs: data.custom_specs || {},
      hasCustomSpecs: Object.keys(data.custom_specs || {}).length > 0,
    });

  } catch (err) {
    console.error('[API/vehicles/custom-specs] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/[userId]/vehicles/[vehicleId]/custom-specs
 * Update custom specs for a vehicle
 * 
 * Request body:
 * - customSpecs: object with wheel/tire/suspension/brake/engine/other specs
 * 
 * Example:
 * {
 *   "customSpecs": {
 *     "wheels": {
 *       "front": { "size": "19x9.5", "offset": "+22", "brand": "Volk", "model": "TE37" },
 *       "rear": { "size": "19x10.5", "offset": "+25", "brand": "Volk", "model": "TE37" }
 *     },
 *     "tires": {
 *       "front": { "size": "265/35R19", "brand": "Michelin", "model": "PS4S", "pressure": "36" },
 *       "rear": { "size": "295/35R19", "brand": "Michelin", "model": "PS4S", "pressure": "38" }
 *     }
 *   }
 * }
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
    const { customSpecs } = body;

    // Validate customSpecs is an object
    if (customSpecs && typeof customSpecs !== 'object') {
      return NextResponse.json(
        { error: 'customSpecs must be an object' },
        { status: 400 }
      );
    }

    // Clean the specs (remove empty values)
    const cleanedSpecs = cleanCustomSpecs(customSpecs || {});

    // Update the vehicle with custom specs
    const { data, error } = await supabase
      .from('user_vehicles')
      .update({
        custom_specs: cleanedSpecs,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) {
      console.error('[API/vehicles/custom-specs] Error updating specs:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update custom specs' },
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
      vehicle: {
        id: data.id,
        customSpecs: data.custom_specs || {},
        hasCustomSpecs: Object.keys(data.custom_specs || {}).length > 0,
      },
      message: 'Custom specs updated successfully',
    });

  } catch (err) {
    console.error('[API/vehicles/custom-specs] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[userId]/vehicles/[vehicleId]/custom-specs
 * Update custom specs (alias for POST)
 */
export async function PUT(request, context) {
  return POST(request, context);
}

/**
 * DELETE /api/users/[userId]/vehicles/[vehicleId]/custom-specs
 * Clear custom specs (reset to showing stock values)
 * 
 * Query params:
 * - section: (optional) Only clear a specific section (wheels, tires, etc.)
 */
export async function DELETE(request, { params }) {
  try {
    const { userId, vehicleId } = await params;
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    
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

    let newSpecs = {};

    // If clearing only a specific section, fetch current specs first
    if (section) {
      const validSections = ['wheels', 'tires', 'suspension', 'brakes', 'engine', 'other'];
      if (!validSections.includes(section)) {
        return NextResponse.json(
          { error: `Invalid section. Must be one of: ${validSections.join(', ')}` },
          { status: 400 }
        );
      }

      const { data: existing, error: fetchError } = await supabase
        .from('user_vehicles')
        .select('custom_specs')
        .eq('user_id', userId)
        .eq('id', vehicleId)
        .single();

      if (fetchError) {
        console.error('[API/vehicles/custom-specs] Error fetching existing specs:', fetchError);
        return NextResponse.json(
          { error: fetchError.message || 'Failed to fetch existing specs' },
          { status: 500 }
        );
      }

      newSpecs = { ...(existing?.custom_specs || {}) };
      delete newSpecs[section];
    }

    // Update the vehicle
    const { data, error } = await supabase
      .from('user_vehicles')
      .update({
        custom_specs: newSpecs,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('id', vehicleId)
      .select()
      .single();

    if (error) {
      console.error('[API/vehicles/custom-specs] Error clearing specs:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to clear custom specs' },
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
      vehicle: {
        id: data.id,
        customSpecs: data.custom_specs || {},
        hasCustomSpecs: Object.keys(data.custom_specs || {}).length > 0,
      },
      message: section 
        ? `Cleared ${section} custom specs` 
        : 'All custom specs cleared - showing stock values',
    });

  } catch (err) {
    console.error('[API/vehicles/custom-specs] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

