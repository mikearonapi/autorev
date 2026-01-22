/**
 * API Route: GET /api/builds/[buildId]/images
 * 
 * Fetches images associated with a user build.
 * Supports optional carSlug parameter for cross-feature image sharing.
 * 
 * Query params:
 *   - carSlug: Optional. Include images linked by car_slug for sharing with garage
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { errors } from '@/lib/apiErrors';

// Service role client for fetching images (user must be authenticated)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handleGet(request, { params }) {
  const { buildId } = await params;
    
    if (!buildId) {
      return errors.missingField('buildId');
    }
    
    // Support both cookie and Bearer token auth
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken 
      ? createAuthenticatedClient(bearerToken) 
      : await createServerSupabaseClient();

    if (!supabase) {
      return errors.serviceUnavailable('Authentication service');
    }
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
      
    if (authError || !user) {
      return errors.unauthorized();
    }
    
    // Get optional carSlug for cross-feature image sharing
    const { searchParams } = new URL(request.url);
    const carSlug = searchParams.get('carSlug');
    
    // Fetch images for this build (includes video fields)
    const { data: buildImages, error } = await supabaseAdmin
      .from('user_uploaded_images')
      .select('id, blob_url, thumbnail_url, caption, is_primary, display_order, width, height, media_type, duration_seconds, video_thumbnail_url')
      .eq('user_build_id', buildId)
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('[API/builds/images] Supabase error:', error);
      return errors.database('Failed to fetch images');
    }
    
    let allImages = buildImages || [];
    const imageIds = new Set(allImages.map(img => img.id));
    
    // If carSlug provided, also fetch images linked by car_slug (for cross-feature sharing)
    if (carSlug) {
      try {
        const { data: carSlugImages, error: carSlugError } = await supabaseAdmin
          .from('user_uploaded_images')
          .select('id, blob_url, thumbnail_url, caption, is_primary, display_order, width, height, media_type, duration_seconds, video_thumbnail_url')
          .eq('user_id', user.id)
          .eq('car_slug', carSlug)
          .order('is_primary', { ascending: false })
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true });
        
        // Add images not already in the list (avoid duplicates)
        if (!carSlugError && carSlugImages) {
          carSlugImages.forEach(img => {
            if (!imageIds.has(img.id)) {
              allImages.push(img);
              imageIds.add(img.id);
            }
          });
        }
      } catch (carSlugErr) {
        // car_slug column may not exist yet - ignore
        console.log('[API/builds/images] car_slug query skipped');
      }
    }
    
    // Sort by is_primary DESC, then display_order ASC
    allImages.sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.display_order || 0) - (b.display_order || 0);
    });
    
    return NextResponse.json({ images: allImages });
}

export const GET = withErrorLogging(handleGet, { route: 'builds/images', feature: 'tuning-shop' });
