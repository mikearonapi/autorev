/**
 * GET /api/cars/[slug]
 * 
 * Returns a single car by its slug from the database.
 * Used as a fallback when the full cars list isn't available.
 */

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { errors } from '@/lib/apiErrors';

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
    const { data: car, error } = await supabase
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
        braking_60_0,
        lateral_g,
        layout,
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
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return errors.notFound(`Car with slug "${slug}" not found`);
      }
      console.error('[/api/cars/[slug]] Database error:', error);
      return errors.database('Failed to fetch car');
    }

    // Transform snake_case to camelCase for frontend compatibility
    const transformedCar = {
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
      zeroToSixty: car.zero_to_sixty ? parseFloat(car.zero_to_sixty) : null,
      topSpeed: car.top_speed,
      quarterMile: car.quarter_mile ? parseFloat(car.quarter_mile) : null,
      braking60To0: car.braking_60_0,
      lateralG: car.lateral_g ? parseFloat(car.lateral_g) : null,
      layout: car.layout,
      msrpNewLow: car.msrp_new_low,
      msrpNewHigh: car.msrp_new_high,
      scoreSound: car.score_sound,
      scoreInterior: car.score_interior,
      scoreTrack: car.score_track,
      scoreReliability: car.score_reliability,
      scoreValue: car.score_value,
      scoreDriverFun: car.score_driver_fun,
      scoreAftermarket: car.score_aftermarket,
      notes: car.notes,
      highlight: car.highlight,
      tagline: car.tagline,
      heroBlurb: car.hero_blurb,
      imageHeroUrl: car.image_hero_url,
      manualAvailable: car.manual_available,
      seats: car.seats,
      vehicleType: car.vehicle_type,
      dailyUsabilityTag: car.daily_usability_tag,
      commonIssues: car.common_issues,
      definingStrengths: car.defining_strengths,
      honestWeaknesses: car.honest_weaknesses,
    };

    return NextResponse.json({ car: transformedCar });
  } catch (error) {
    console.error('[/api/cars/[slug]] Error:', error);
    return errors.internal('Failed to fetch car');
  }
}

export const GET = withErrorLogging(handleGet);
