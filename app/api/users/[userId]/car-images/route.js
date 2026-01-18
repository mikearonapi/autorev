/**
 * Car Images API
 * 
 * Unified API for managing car images across Garage and Tuning Shop.
 * Images are linked by car_slug so they appear in both features.
 * 
 * GET /api/users/[userId]/car-images?carSlug=xxx
 *   - Get all images for a specific car belonging to the user
 * 
 * PUT /api/users/[userId]/car-images
 *   - Set hero image or clear hero (revert to stock)
 * 
 * @route /api/users/[userId]/car-images
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { withErrorLogging } from '@/lib/serverErrorLogger';

/**
 * Get authenticated user from request
 */
async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * GET /api/users/[userId]/car-images?carSlug=xxx
 * Fetch all images for a specific car belonging to the user
 */
async function handleGet(request, context) {
  const params = await context.params;
  const { userId } = params;
  const { searchParams } = new URL(request.url);
  const carSlug = searchParams.get('carSlug');

  // Verify authentication
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is accessing their own data
  if (user.id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!carSlug) {
    return NextResponse.json({ error: 'carSlug parameter required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Use the RPC function to get images
  const { data, error } = await supabase.rpc('get_user_images_by_car_slug', {
    p_user_id: userId,
    p_car_slug: carSlug,
  });

  if (error) {
    console.error('[CarImages] Error fetching images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }

  // Transform snake_case to camelCase for frontend
  const images = (data || []).map(img => ({
    id: img.id,
    userId: img.user_id,
    userVehicleId: img.user_vehicle_id,
    userBuildId: img.user_build_id,
    communityPostId: img.community_post_id,
    carSlug: img.car_slug,
    carId: img.car_id,
    blobUrl: img.blob_url,
    blob_url: img.blob_url, // Keep snake_case for compatibility
    blobPathname: img.blob_pathname,
    thumbnailUrl: img.thumbnail_url,
    thumbnail_url: img.thumbnail_url,
    fileName: img.file_name,
    fileSize: img.file_size,
    contentType: img.content_type,
    caption: img.caption,
    isPrimary: img.is_primary,
    is_primary: img.is_primary,
    displayOrder: img.display_order,
    display_order: img.display_order,
    mediaType: img.media_type,
    media_type: img.media_type,
    durationSeconds: img.duration_seconds,
    duration_seconds: img.duration_seconds,
    videoThumbnailUrl: img.video_thumbnail_url,
    video_thumbnail_url: img.video_thumbnail_url,
    isApproved: img.is_approved,
    createdAt: img.created_at,
  }));

  return NextResponse.json({ images, carSlug });
}

/**
 * PUT /api/users/[userId]/car-images
 * Set or clear hero image for a car
 * 
 * Body:
 *   - carSlug: string (required)
 *   - imageId: string | null (set this image as hero, or null to clear/revert to stock)
 */
async function handlePut(request, context) {
  const params = await context.params;
  const { userId } = params;
  
  // Verify authentication
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is accessing their own data
  if (user.id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { carSlug, imageId } = body;

  if (!carSlug) {
    return NextResponse.json({ error: 'carSlug is required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (imageId) {
    // Set specific image as hero
    const { data, error } = await supabase.rpc('set_car_hero_image', {
      p_user_id: userId,
      p_car_slug: carSlug,
      p_image_id: imageId,
    });

    if (error) {
      console.error('[CarImages] Error setting hero:', error);
      return NextResponse.json({ error: 'Failed to set hero image' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Image not found or not eligible' }, { status: 404 });
    }

    return NextResponse.json({ success: true, heroImageId: imageId });
  } else {
    // Clear hero (revert to stock)
    const { data, error } = await supabase.rpc('clear_car_hero_image', {
      p_user_id: userId,
      p_car_slug: carSlug,
    });

    if (error) {
      console.error('[CarImages] Error clearing hero:', error);
      return NextResponse.json({ error: 'Failed to clear hero image' }, { status: 500 });
    }

    return NextResponse.json({ success: true, heroImageId: null, cleared: data });
  }
}

// Export wrapped handlers with error logging
export const GET = withErrorLogging(handleGet, { route: 'users/[userId]/car-images', feature: 'garage' });
export const PUT = withErrorLogging(handlePut, { route: 'users/[userId]/car-images', feature: 'garage' });
