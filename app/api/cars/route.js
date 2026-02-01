/**
 * GET /api/cars
 *
 * Returns all cars from the database for the browse-cars page.
 * Updated for Teoalida schema (Jan 2026).
 */

import { NextResponse } from 'next/server';

import { errors } from '@/lib/apiErrors';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Cache for 30 seconds, revalidate in background
export const revalidate = 30;

async function handleGet() {
  if (!isSupabaseConfigured || !supabase) {
    return errors.serviceUnavailable('Database not configured');
  }

  try {
    // Teoalida schema columns
    const { data: cars, error } = await supabase
      .from('cars')
      .select(
        `
        id,
        slug,
        name,
        year,
        make,
        model,
        trim,
        tier,
        category,
        body_type,
        country_of_origin,
        engine_type,
        engine_size,
        cylinders,
        hp,
        hp_rpm,
        torque,
        torque_rpm,
        transmission,
        drive_type,
        curb_weight,
        msrp,
        fuel_type,
        mpg_city,
        mpg_highway,
        mpg_combined,
        image_url,
        is_selectable,
        generation_id
      `
      )
      .eq('is_selectable', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('[/api/cars] Database error:', error);
      return errors.database('Failed to fetch cars');
    }

    // Transform snake_case to camelCase for frontend compatibility
    // Include legacy field aliases for backward compatibility
    const transformedCars = (cars || []).map((car) => ({
      // Core identifiers
      id: car.id,
      slug: car.slug,
      name: car.name,

      // YMMT (Teoalida)
      year: car.year,
      make: car.make,
      model: car.model,
      trim: car.trim,

      // Classification
      tier: car.tier,
      category: car.category,
      bodyType: car.body_type,
      isSelectable: car.is_selectable,
      generationId: car.generation_id,

      // Engine
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

      // Physical
      curbWeight: car.curb_weight,

      // Pricing
      msrp: car.msrp,

      // Fuel economy
      mpgCity: car.mpg_city,
      mpgHighway: car.mpg_highway,
      mpgCombined: car.mpg_combined,

      // Origin
      countryOfOrigin: car.country_of_origin,

      // Media
      imageUrl: car.image_url,
    }));

    return NextResponse.json(
      {
        cars: transformedCars,
        count: transformedCars.length,
        source: 'supabase',
        schema: 'teoalida',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err) {
    console.error('[/api/cars] Error:', err);
    return errors.internal('Internal server error');
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cars', feature: 'browse-cars' });
