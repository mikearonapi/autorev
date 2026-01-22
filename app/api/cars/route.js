/**
 * GET /api/cars
 * 
 * Returns all cars from the database for the browse-cars page.
 * This replaces the static data/cars.js file as the source of truth.
 */

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { errors } from '@/lib/apiErrors';

// Cache for 30 seconds, revalidate in background
// Shorter cache to pick up new cars faster
export const revalidate = 30;

async function handleGet() {
  if (!isSupabaseConfigured || !supabase) {
    return errors.serviceUnavailable('Database not configured');
  }

  try {
    const { data: cars, error } = await supabase
      .from('cars')
      .select(`
        id,
        slug,
        name,
        years,
        tier,
        category,
        brand,
        country,
        engine,
        hp,
        torque,
        trans,
        drivetrain,
        price_range,
        price_avg,
        curb_weight,
        zero_to_sixty,
        top_speed,
        quarter_mile,
        msrp_new_low,
        msrp_new_high,
        score_sound,
        score_interior,
        score_track,
        score_reliability,
        score_value,
        score_driver_fun,
        score_aftermarket,
        notes,
        highlight,
        tagline,
        hero_blurb,
        image_hero_url,
        manual_available,
        seats,
        vehicle_type,
        daily_usability_tag,
        common_issues,
        defining_strengths,
        honest_weaknesses
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('[/api/cars] Database error:', error);
      return errors.database('Failed to fetch cars');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedCars = (cars || []).map(car => ({
      id: car.id,
      slug: car.slug,
      name: car.name,
      years: car.years,
      tier: car.tier,
      category: car.category,
      brand: car.brand,
      country: car.country,
      engine: car.engine,
      hp: car.hp,
      torque: car.torque,
      trans: car.trans,
      drivetrain: car.drivetrain,
      priceRange: car.price_range,
      priceAvg: car.price_avg,
      curbWeight: car.curb_weight,
      zeroToSixty: car.zero_to_sixty,
      topSpeed: car.top_speed,
      quarterMile: car.quarter_mile,
      msrpNewLow: car.msrp_new_low,
      msrpNewHigh: car.msrp_new_high,
      // Scores
      sound: parseFloat(car.score_sound) || 0,
      interior: parseFloat(car.score_interior) || 0,
      track: parseFloat(car.score_track) || 0,
      reliability: parseFloat(car.score_reliability) || 0,
      value: parseFloat(car.score_value) || 0,
      driverFun: parseFloat(car.score_driver_fun) || 0,
      aftermarket: parseFloat(car.score_aftermarket) || 0,
      // Content
      notes: car.notes,
      highlight: car.highlight,
      tagline: car.tagline,
      heroBlurb: car.hero_blurb,
      imageHeroUrl: car.image_hero_url,
      // Ownership
      manualAvailable: car.manual_available,
      seats: car.seats,
      vehicleType: car.vehicle_type,
      dailyUsabilityTag: car.daily_usability_tag,
      commonIssues: car.common_issues || [],
      definingStrengths: car.defining_strengths || [],
      honestWeaknesses: car.honest_weaknesses || [],
    }));

    // Return with cache headers for CDN optimization
    return NextResponse.json({
      cars: transformedCars,
      count: transformedCars.length,
      source: 'supabase'
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      }
    });

  } catch (err) {
    console.error('[/api/cars] Error:', err);
    return errors.internal('Internal server error');
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cars', feature: 'browse-cars' });