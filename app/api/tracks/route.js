/**
 * GET /api/tracks
 * 
 * Fetch all tracks from the database for lap time estimator
 */

// Force dynamic to prevent static prerendering
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { withErrorLogging } from '@/lib/serverErrorLogger';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handleGet(request) {
  try {
    const { searchParams } = new URL(request.url);
    const popularOnly = searchParams.get('popular') === 'true';
    const country = searchParams.get('country');
    const region = searchParams.get('region');
    const trackType = searchParams.get('type');
    
    // Select columns that actually exist in the tracks table
    const TRACK_COLS = `
      id, slug, name, short_name, city, state, country, region,
      track_type, length_miles, corners, elevation_change_ft, longest_straight_ft,
      surface_type, configuration,
      pro_reference_time, power_gain_max, grip_gain_max, susp_gain_max,
      brake_gain_max, aero_gain_max, weight_gain_max,
      beginner_penalty, intermediate_penalty, advanced_penalty,
      character_tags, website_url, image_url,
      is_popular, is_active, popularity_rank, created_at
    `;
    
    let query = supabase
      .from('tracks')
      .select(TRACK_COLS)
      .eq('is_active', true)
      .order('popularity_rank', { ascending: true, nullsLast: true });
    
    if (popularOnly) {
      query = query.eq('is_popular', true);
    }
    
    if (country) {
      query = query.eq('country', country);
    }
    
    if (region) {
      query = query.eq('region', region);
    }
    
    if (trackType) {
      query = query.eq('track_type', trackType);
    }
    
    const { data: tracks, error } = await query;
    
    if (error) {
      console.error('Error fetching tracks:', error);
      return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
    }
    
    // Transform to format expected by LapTimeEstimator
    const formattedTracks = tracks.map(track => ({
      id: track.id,
      slug: track.slug,
      name: track.name,
      shortName: track.short_name || track.name?.split(' ')[0],
      city: track.city,
      state: track.state,
      country: track.country,
      region: track.region,
      length: track.length_miles ? parseFloat(track.length_miles) : null,
      corners: track.corners,
      trackType: track.track_type,
      surfaceType: track.surface_type,
      configuration: track.configuration,
      // Track characteristics
      elevationChange: track.elevation_change_ft,
      longestStraight: track.longest_straight_ft,
      characterTags: track.character_tags || [],
      websiteUrl: track.website_url,
      imageUrl: track.image_url,
      // Physics parameters for lap time estimation
      proTime: track.pro_reference_time ? parseFloat(track.pro_reference_time) : null,
      powerGainMax: track.power_gain_max ? parseFloat(track.power_gain_max) : 4.0,
      gripGainMax: track.grip_gain_max ? parseFloat(track.grip_gain_max) : 5.0,
      suspGainMax: track.susp_gain_max ? parseFloat(track.susp_gain_max) : 3.5,
      brakeGainMax: track.brake_gain_max ? parseFloat(track.brake_gain_max) : 2.5,
      aeroGainMax: track.aero_gain_max ? parseFloat(track.aero_gain_max) : 2.0,
      weightGainMax: track.weight_gain_max ? parseFloat(track.weight_gain_max) : 2.0,
      beginnerPenalty: track.beginner_penalty ? parseFloat(track.beginner_penalty) : 25,
      intermediatePenalty: track.intermediate_penalty ? parseFloat(track.intermediate_penalty) : 10,
      advancedPenalty: track.advanced_penalty ? parseFloat(track.advanced_penalty) : 3,
      isPopular: track.is_popular,
      isActive: track.is_active,
      popularityRank: track.popularity_rank,
    }));
    
    return NextResponse.json({
      tracks: formattedTracks,
      count: formattedTracks.length
    });
    
  } catch (error) {
    console.error('Tracks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'tracks', feature: 'lap-times' });
