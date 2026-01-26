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
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { errors } from '@/lib/apiErrors';

/**
 * GET /api/users/[userId]/garage
 * Fetch user's garage vehicles
 * 
 * Returns:
 * - vehicles: Array of vehicle objects with make, model, year, etc.
 */
async function handleGet(request, { params }) {
  const { userId } = await params;
    
    if (!userId) {
      return errors.missingField('userId');
    }
    
    // Get authenticated user
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken 
      ? createAuthenticatedClient(bearerToken) 
      : await createServerSupabaseClient();

    if (!supabase) {
      return errors.serviceUnavailable('Authentication service');
    }

    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      return errors.unauthorized();
    }
    
    // Verify the authenticated user matches the userId param
    if (user.id !== userId) {
      return errors.forbidden('Not authorized to view this user\'s garage');
    }

    // Fetch user's vehicles with enrichment data and garage score
    const { data: vehicles, error } = await supabase
      .from('user_vehicles')
      .select(`
        id,
        vin,
        year,
        make,
        model,
        trim,
        matched_car_id,
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
        custom_specs,
        enrichment_id,
        enrichment_status,
        display_order,
        garage_score,
        score_breakdown,
        score_updated_at,
        daily_driver_enrichments (
          id,
          maintenance_specs,
          service_intervals,
          known_issues,
          image_url,
          status
        )
      `)
      .eq('user_id', userId)
      .eq('ownership_status', 'owned')
      .order('display_order', { ascending: true })
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API/users/garage] Error fetching vehicles:', error);
      return errors.database('Failed to fetch garage');
    }

    // Transform to client-friendly format
    const transformedVehicles = (vehicles || []).map(v => {
      const customSpecs = v.custom_specs || {};
      const enrichment = v.daily_driver_enrichments;
      return {
        id: v.id,
        vin: v.vin,
        year: v.year,
        make: v.make,
        model: v.model,
        trim: v.trim,
        matchedCarId: v.matched_car_id, // Include car_id for efficient downstream operations
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
        // Display order for custom garage sorting
        displayOrder: v.display_order ?? 0,
        // Daily driver enrichment data
        enrichmentId: v.enrichment_id,
        enrichmentStatus: v.enrichment_status || 'none',
        enrichment: enrichment ? {
          id: enrichment.id,
          maintenanceSpecs: enrichment.maintenance_specs,
          serviceIntervals: enrichment.service_intervals,
          knownIssues: enrichment.known_issues,
          imageUrl: enrichment.image_url,
          status: enrichment.status,
        } : null,
        // Garage score data (0-100 completeness)
        garageScore: v.garage_score || 0,
        scoreBreakdown: v.score_breakdown || { specs: 0, photos: 0, mods: 0, goals: 0, parts: 0 },
        scoreUpdatedAt: v.score_updated_at,
      };
    });

    // Calculate aggregate garage stats
    const totalScore = transformedVehicles.reduce((sum, v) => sum + v.garageScore, 0);
    const avgScore = transformedVehicles.length > 0 
      ? Math.round(totalScore / transformedVehicles.length) 
      : 0;

    return NextResponse.json({
      vehicles: transformedVehicles,
      count: transformedVehicles.length,
      // Aggregate garage score stats
      garageStats: {
        averageScore: avgScore,
        totalScore,
        vehicleCount: transformedVehicles.length,
        completeCount: transformedVehicles.filter(v => v.garageScore === 100).length,
      },
    });
}

export const GET = withErrorLogging(handleGet, { route: 'users/garage', feature: 'garage' });

