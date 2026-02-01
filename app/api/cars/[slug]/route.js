/**
 * GET /api/cars/[slug]
 *
 * Returns a single car by its slug from the database.
 * Updated for Teoalida schema (Jan 2026).
 */

import { NextResponse } from 'next/server';

import { errors } from '@/lib/apiErrors';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Cache for 5 minutes
export const revalidate = 300;

async function handleGet(request, { params }) {
  const { slug } = await params;

  if (!slug) {
    return errors.badRequest('Car slug is required');
  }

  if (!isSupabaseConfigured || !supabase) {
    return errors.serviceUnavailable('Database not configured');
  }

  try {
    // Full Teoalida schema for detail view
    const { data: car, error } = await supabase.from('cars').select('*').eq('slug', slug).single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errors.notFound(`Car with slug "${slug}" not found`);
      }
      console.error('[/api/cars/[slug]] Database error:', error);
      return errors.database('Failed to fetch car');
    }

    // Transform snake_case to camelCase for frontend compatibility
    // Include legacy field aliases for backward compatibility
    const transformedCar = {
      // Core identifiers
      id: car.id,
      slug: car.slug,
      name: car.name,
      teoalidaId: car.teoalida_id,

      // YMMT (Teoalida)
      year: car.year,
      make: car.make,
      model: car.model,
      trim: car.trim,
      trimDescription: car.trim_description,

      // Classification
      tier: car.tier,
      category: car.category,
      bodyType: car.body_type,
      carClassification: car.car_classification,
      isSelectable: car.is_selectable,
      generationId: car.generation_id,

      // Engine specs
      hp: car.hp,
      hpRpm: car.hp_rpm,
      torque: car.torque,
      torqueRpm: car.torque_rpm,
      engineType: car.engine_type,
      engineSize: car.engine_size ? parseFloat(car.engine_size) : null,
      cylinders: car.cylinders,
      fuelType: car.fuel_type,

      // Drivetrain
      transmission: car.transmission,
      driveType: car.drive_type,

      // Physical dimensions
      curbWeight: car.curb_weight,
      lengthIn: car.length_in ? parseFloat(car.length_in) : null,
      widthIn: car.width_in ? parseFloat(car.width_in) : null,
      heightIn: car.height_in ? parseFloat(car.height_in) : null,
      wheelbaseIn: car.wheelbase_in ? parseFloat(car.wheelbase_in) : null,
      groundClearanceIn: car.ground_clearance_in ? parseFloat(car.ground_clearance_in) : null,

      // Pricing
      msrp: car.msrp,

      // Fuel economy
      mpgCity: car.mpg_city,
      mpgHighway: car.mpg_highway,
      mpgCombined: car.mpg_combined,
      fuelTankCapacity: car.fuel_tank_capacity ? parseFloat(car.fuel_tank_capacity) : null,

      // Capability (trucks)
      maxTowing: car.max_towing,
      maxPayload: car.max_payload,

      // Origin & platform
      countryOfOrigin: car.country_of_origin,
      platformCode: car.platform_code,

      // Media
      imageUrl: car.image_url,
      sourceUrl: car.source_url,
    };

    return NextResponse.json({ car: transformedCar });
  } catch (error) {
    console.error('[/api/cars/[slug]] Error:', error);
    return errors.internal('Failed to fetch car');
  }
}

export const GET = withErrorLogging(handleGet);
