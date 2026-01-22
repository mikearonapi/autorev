/**
 * Wheel & Tire Fitment Options API Route
 * 
 * Returns wheel/tire fitment options for a specific car.
 * Used by Tuning Shop wheel configurator.
 * 
 * Data includes:
 * - OEM baseline specs
 * - OEM optional packages
 * - Plus-one, plus-two sizing
 * - Aggressive/square fitments
 * - Fitment warnings (fender roll, camber adjustment)
 * - Recommended use cases
 */

import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { resolveCarId } from '@/lib/carResolver';

/**
 * Fitment type priority for sorting
 */
const FITMENT_TYPE_ORDER = {
  oem: 1,
  oem_optional: 2,
  plus_one: 3,
  plus_two: 4,
  square: 5,
  aggressive: 6,
  conservative: 7,
};

/**
 * Transform database row to API response format
 */
function transformFitmentOption(row) {
  return {
    id: row.id,
    fitmentType: row.fitment_type,
    displayName: getFitmentDisplayName(row.fitment_type),
    
    // Wheel specs
    wheelDiameter: row.wheel_diameter_inches,
    wheelWidthFront: row.wheel_width_front,
    wheelWidthRear: row.wheel_width_rear,
    wheelOffsetFront: row.wheel_offset_front_mm,
    wheelOffsetRear: row.wheel_offset_rear_mm,
    wheelOffsetRangeFront: row.wheel_offset_range_front,
    wheelOffsetRangeRear: row.wheel_offset_range_rear,
    
    // Tire specs
    tireSizeFront: row.tire_size_front,
    tireSizeRear: row.tire_size_rear,
    tireWidthFront: row.tire_width_front_mm,
    tireWidthRear: row.tire_width_rear_mm,
    tireAspectFront: row.tire_aspect_front,
    tireAspectRear: row.tire_aspect_rear,
    
    // Size change impact
    diameterChangePercent: row.diameter_change_percent,
    speedometerErrorPercent: row.speedometer_error_percent,
    
    // Fitment warnings
    requiresFenderRoll: row.requires_fender_roll || false,
    requiresFenderPull: row.requires_fender_pull || false,
    requiresCamberAdjustment: row.requires_camber_adjustment || false,
    recommendedCamberFront: row.recommended_camber_front,
    recommendedCamberRear: row.recommended_camber_rear,
    requiresCoilovers: row.requires_coilovers || false,
    requiresSpacers: row.requires_spacers || false,
    spacerSizeFrontMm: row.spacer_size_front_mm,
    spacerSizeRearMm: row.spacer_size_rear_mm,
    clearanceNotes: row.clearance_notes,
    knownIssues: row.known_issues,
    
    // Use case recommendations
    recommendedFor: row.recommended_for || [],
    notRecommendedFor: row.not_recommended_for || [],
    
    // Community data
    popularityScore: row.popularity_score,
    communityVerified: row.community_verified || false,
    forumThreads: row.forum_threads || [],
    
    // Verification status
    verified: row.verified || false,
    verifiedBy: row.verified_by,
    verifiedAt: row.verified_at,
    confidence: row.confidence,
    
    // Source
    sourceType: row.source_type,
    sourceUrl: row.source_url,
  };
}

/**
 * Get human-readable display name for fitment type
 */
function getFitmentDisplayName(fitmentType) {
  const displayNames = {
    oem: 'OEM Stock',
    oem_optional: 'OEM Optional Package',
    plus_one: '+1 Size (1" Larger Diameter)',
    plus_two: '+2 Size (2" Larger Diameter)',
    square: 'Square Setup (Same Size All Around)',
    aggressive: 'Aggressive Fitment',
    conservative: 'Conservative Fitment',
  };
  return displayNames[fitmentType] || fitmentType;
}

async function handleGet(request, { params }) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json(
      { error: 'Car slug is required' },
      { status: 400 }
    );
  }

  // If Supabase isn't configured, return empty data
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({
      success: true,
      data: {
        carSlug: slug,
        oem: null,
        options: [],
      },
      message: 'Fitment data not available (database not configured)',
    });
  }

  try {
    // Resolve car_id from slug (car_slug column no longer exists on these tables)
    const carId = await resolveCarId(slug);
    if (!carId) {
      return NextResponse.json({
        success: true,
        data: {
          carSlug: slug,
          oem: null,
          options: [],
        },
        message: 'Car not found',
      });
    }
    
    // Fetch all fitment options for this car
    const { data: fitmentRows, error: fitmentError } = await supabase
      .from('wheel_tire_fitment_options')
      .select('*')
      .eq('car_id', carId);

    if (fitmentError) {
      console.error('[Fitments API] Database error:', fitmentError);
      return NextResponse.json(
        { error: 'Failed to fetch fitment options' },
        { status: 500 }
      );
    }

    // If no fitment data, try to get OEM specs from maintenance specs
    if (!fitmentRows || fitmentRows.length === 0) {
      // Fall back to vehicle_maintenance_specs for basic OEM tire info (using car_id)
      const { data: maintenanceSpecs } = await supabase
        .from('vehicle_maintenance_specs')
        .select('tire_size_front, tire_size_rear, wheel_size_front, wheel_size_rear, wheel_bolt_pattern')
        .eq('car_id', carId)
        .single();

      if (maintenanceSpecs) {
        return NextResponse.json({
          success: true,
          data: {
            carSlug: slug,
            oem: {
              id: null,
              fitmentType: 'oem',
              displayName: 'OEM Stock',
              tireSizeFront: maintenanceSpecs.tire_size_front,
              tireSizeRear: maintenanceSpecs.tire_size_rear,
              wheelSizeFront: maintenanceSpecs.wheel_size_front,
              wheelSizeRear: maintenanceSpecs.wheel_size_rear,
              wheelBoltPattern: maintenanceSpecs.wheel_bolt_pattern,
              // Basic data - no upgrade options available
              verified: false,
              recommendedFor: ['daily-driving'],
            },
            options: [],
            source: 'maintenance_specs',
          },
        });
      }

      // No data at all
      return NextResponse.json({
        success: true,
        data: {
          carSlug: slug,
          oem: null,
          options: [],
        },
        message: 'No fitment data available for this vehicle',
      });
    }

    // Sort by fitment type priority
    const sortedRows = fitmentRows.sort((a, b) => {
      const orderA = FITMENT_TYPE_ORDER[a.fitment_type] || 99;
      const orderB = FITMENT_TYPE_ORDER[b.fitment_type] || 99;
      return orderA - orderB;
    });

    // Transform all rows
    const transformedOptions = sortedRows.map(transformFitmentOption);

    // Extract OEM baseline (first OEM type)
    const oemOption = transformedOptions.find(opt => opt.fitmentType === 'oem');
    const upgradeOptions = transformedOptions.filter(opt => opt.fitmentType !== 'oem');

    return NextResponse.json({
      success: true,
      data: {
        carSlug: slug,
        oem: oemOption || null,
        options: upgradeOptions,
        totalOptions: transformedOptions.length,
      },
    });
  } catch (err) {
    console.error('[Fitments API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch fitment options' },
      { status: 500 }
    );
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cars/[slug]/fitments', feature: 'tuning-shop' });

