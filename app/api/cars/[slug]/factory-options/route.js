/**
 * Factory Options API Route
 * 
 * Returns available factory configuration options for a specific car.
 * Used by Tuning Shop factory configuration section.
 * 
 * Data includes:
 * - Transmission options (manual, auto, DCT, etc.)
 * - OEM wheel packages (from wheel_tire_fitment_options)
 * - Drivetrain variants
 * - Trim levels with different specs
 */

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { withErrorLogging } from '@/lib/serverErrorLogger';

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
        transmissions: [],
        wheelPackages: [],
        drivetrains: [],
        trims: [],
      },
      message: 'Factory options not available (database not configured)',
    });
  }

  try {
    // First, get the car_id from the cars table
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id, name, transmission, drivetrain')
      .eq('slug', slug)
      .single();

    if (carError || !car) {
      return NextResponse.json({
        success: true,
        data: {
          carSlug: slug,
          transmissions: [],
          wheelPackages: [],
          drivetrains: [],
          trims: [],
        },
        message: 'Car not found',
      });
    }

    // Fetch variants for this car to get transmission/drivetrain options
    const { data: variants } = await supabase
      .from('car_variants')
      .select('id, variant_key, display_name, transmission, drivetrain, trim, engine, model_year_start, model_year_end')
      .eq('car_id', car.id)
      .order('model_year_start', { ascending: false });

    // Fetch OEM wheel packages from fitment options
    const { data: wheelPackages } = await supabase
      .from('wheel_tire_fitment_options')
      .select('id, fitment_type, wheel_diameter_inches, wheel_width_front, wheel_width_rear, tire_size_front, tire_size_rear, recommended_for')
      .eq('car_slug', slug)
      .in('fitment_type', ['oem', 'oem_optional'])
      .order('fitment_type', { ascending: true });

    // Extract unique transmissions
    const transmissionSet = new Set();
    if (car.transmission) transmissionSet.add(car.transmission);
    variants?.forEach(v => {
      if (v.transmission) transmissionSet.add(v.transmission);
    });
    const transmissions = Array.from(transmissionSet).map(t => ({
      value: t,
      label: formatTransmissionLabel(t),
    }));

    // Extract unique drivetrains
    const drivetrainSet = new Set();
    if (car.drivetrain) drivetrainSet.add(car.drivetrain);
    variants?.forEach(v => {
      if (v.drivetrain) drivetrainSet.add(v.drivetrain);
    });
    const drivetrains = Array.from(drivetrainSet).map(d => ({
      value: d,
      label: formatDrivetrainLabel(d),
    }));

    // Extract unique trims
    const trimSet = new Set();
    variants?.forEach(v => {
      if (v.trim) trimSet.add(v.trim);
    });
    const trims = Array.from(trimSet).map(t => ({
      value: t,
      label: t,
    }));

    // Format wheel packages for response
    const formattedWheelPackages = (wheelPackages || []).map(wp => ({
      id: wp.id,
      type: wp.fitment_type,
      label: wp.fitment_type === 'oem' 
        ? `Stock ${wp.wheel_diameter_inches}"` 
        : `Optional ${wp.wheel_diameter_inches}"`,
      wheelDiameter: wp.wheel_diameter_inches,
      wheelWidthFront: wp.wheel_width_front,
      wheelWidthRear: wp.wheel_width_rear,
      tireSizeFront: wp.tire_size_front,
      tireSizeRear: wp.tire_size_rear,
      recommendedFor: wp.recommended_for || [],
    }));

    // Format variants for response (for advanced users who want to select exact spec)
    const formattedVariants = (variants || []).map(v => ({
      id: v.id,
      variantKey: v.variant_key,
      displayName: v.display_name,
      transmission: v.transmission,
      drivetrain: v.drivetrain,
      trim: v.trim,
      engine: v.engine,
      years: v.model_year_start === v.model_year_end 
        ? `${v.model_year_start}` 
        : `${v.model_year_start}-${v.model_year_end || 'present'}`,
    }));

    return NextResponse.json({
      success: true,
      data: {
        carSlug: slug,
        carName: car.name,
        transmissions,
        wheelPackages: formattedWheelPackages,
        drivetrains,
        trims,
        variants: formattedVariants,
        // Counts for UI display
        counts: {
          transmissions: transmissions.length,
          wheelPackages: formattedWheelPackages.length,
          drivetrains: drivetrains.length,
          trims: trims.length,
          variants: formattedVariants.length,
        },
      },
    });
  } catch (err) {
    console.error('[Factory Options API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch factory options' },
      { status: 500 }
    );
  }
}

/**
 * Format transmission string for display
 */
function formatTransmissionLabel(transmission) {
  if (!transmission) return 'Unknown';
  
  const labels = {
    'manual': 'Manual',
    '6-speed manual': '6-Speed Manual',
    '7-speed manual': '7-Speed Manual',
    'automatic': 'Automatic',
    '6-speed auto': '6-Speed Automatic',
    '7-speed auto': '7-Speed Automatic',
    '8-speed auto': '8-Speed Automatic',
    '9-speed auto': '9-Speed Automatic',
    '10-speed auto': '10-Speed Automatic',
    'dct': 'Dual-Clutch (DCT)',
    '7-speed dct': '7-Speed DCT',
    '8-speed dct': '8-Speed DCT',
    'pdk': 'PDK',
    '7-speed pdk': '7-Speed PDK',
    '8-speed pdk': '8-Speed PDK',
    'cvt': 'CVT',
    'smg': 'SMG (Sequential)',
  };

  const lower = transmission.toLowerCase();
  return labels[lower] || transmission;
}

/**
 * Format drivetrain string for display
 */
function formatDrivetrainLabel(drivetrain) {
  if (!drivetrain) return 'Unknown';
  
  const labels = {
    'rwd': 'Rear-Wheel Drive (RWD)',
    'fwd': 'Front-Wheel Drive (FWD)',
    'awd': 'All-Wheel Drive (AWD)',
    '4wd': 'Four-Wheel Drive (4WD)',
    'rear-wheel drive': 'Rear-Wheel Drive (RWD)',
    'front-wheel drive': 'Front-Wheel Drive (FWD)',
    'all-wheel drive': 'All-Wheel Drive (AWD)',
    'xdrive': 'xDrive (AWD)',
    'quattro': 'quattro (AWD)',
    's-awc': 'S-AWC (AWD)',
    'sh-awd': 'SH-AWD',
  };

  const lower = drivetrain.toLowerCase();
  return labels[lower] || drivetrain;
}

export const GET = withErrorLogging(handleGet, { route: 'cars/[slug]/factory-options', feature: 'tuning-shop' });

