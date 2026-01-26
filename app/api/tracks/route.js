/**
 * GET /api/tracks
 * 
 * Fetch all tracks from the database for lap time estimator
 */

import { createClient } from '@supabase/supabase-js';
import { errors } from '@/lib/apiErrors';
import { NextResponse } from 'next/server';
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
    
    const TRACK_COLS = 'id, slug, name, location, country, region, track_type, length_miles, lap_record_seconds, lap_record_car, website_url, image_url, is_popular, is_active, popularity_rank, created_at';
    
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
      shortName: track.short_name || track.name.split(' ')[0],
      city: track.city,
      state: track.state,
      country: track.country,
      region: track.region,
      length: parseFloat(track.length_miles),
      corners: track.corners,
      trackType: track.track_type,
      surfaceType: track.surface_type,
      // Track characteristics
      elevationChange: track.elevation_change_ft,
      longestStraight: track.longest_straight_ft,
      characterTags: track.character_tags || [],
      websiteUrl: track.website_url,
      // Physics parameters
      proTime: parseFloat(track.pro_reference_time),
      powerGainMax: parseFloat(track.power_gain_max),
      gripGainMax: parseFloat(track.grip_gain_max),
      suspGainMax: parseFloat(track.susp_gain_max),
      brakeGainMax: parseFloat(track.brake_gain_max),
      aeroGainMax: parseFloat(track.aero_gain_max),
      weightGainMax: parseFloat(track.weight_gain_max),
      beginnerPenalty: parseFloat(track.beginner_penalty),
      intermediatePenalty: parseFloat(track.intermediate_penalty),
      advancedPenalty: parseFloat(track.advanced_penalty),
      isPopular: track.is_popular,
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
