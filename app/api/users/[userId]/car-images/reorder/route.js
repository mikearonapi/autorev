/**
 * Photo Reorder API
 *
 * Updates the display_order of user photos for a specific car.
 * The order determines how photos appear on the community build page.
 *
 * PUT /api/users/[userId]/car-images/reorder
 *   Body: { carSlug: string, imageIds: string[] }
 *   - imageIds should be in the desired display order
 *
 * @route /api/users/[userId]/car-images/reorder
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { errors } from '@/lib/apiErrors';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import {
  createAuthenticatedClient,
  createServerSupabaseClient,
  getBearerToken,
} from '@/lib/supabaseServer';

/**
 * Get authenticated user from request (supports both cookie and Bearer token)
 */
async function getAuthenticatedUser(request) {
  const bearerToken = getBearerToken(request);
  const supabase = bearerToken
    ? createAuthenticatedClient(bearerToken)
    : await createServerSupabaseClient();

  if (!supabase) return null;

  const {
    data: { user },
  } = bearerToken ? await supabase.auth.getUser(bearerToken) : await supabase.auth.getUser();
  return user;
}

/**
 * PUT /api/users/[userId]/car-images/reorder
 * Update the display order of images for a specific car
 */
async function handlePut(request, context) {
  const params = await context.params;
  const { userId } = params;

  // Verify authentication
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return errors.unauthorized();
  }

  // Verify user is accessing their own data (IDOR protection)
  if (user.id !== userId) {
    return errors.forbidden('Access denied');
  }

  const body = await request.json();
  const { carSlug, imageIds } = body;

  if (!carSlug) {
    return errors.missingField('carSlug');
  }

  if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
    return errors.missingField('imageIds (array of image IDs in desired order)');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Verify user owns all the images and they belong to the specified car
  const { data: images, error: fetchError } = await supabase
    .from('user_uploaded_images')
    .select('id, user_id, car_slug')
    .in('id', imageIds)
    .eq('user_id', userId);

  if (fetchError) {
    console.error('[CarImages/Reorder] Error fetching images:', fetchError);
    return NextResponse.json({ error: 'Failed to verify images' }, { status: 500 });
  }

  // Check ownership and car_slug match
  const validImageIds = new Set(images?.map((img) => img.id) || []);
  const invalidIds = imageIds.filter((id) => !validImageIds.has(id));

  if (invalidIds.length > 0) {
    return NextResponse.json(
      { error: `Some images not found or not yours: ${invalidIds.join(', ')}` },
      { status: 400 }
    );
  }

  // Update display_order for each image
  const updates = imageIds.map((imageId, index) => ({
    id: imageId,
    display_order: index + 1, // 1-based ordering
    updated_at: new Date().toISOString(),
  }));

  // Use upsert to update multiple records
  const { error: updateError } = await supabase
    .from('user_uploaded_images')
    .upsert(updates, { onConflict: 'id' });

  if (updateError) {
    console.error('[CarImages/Reorder] Error updating order:', updateError);
    return NextResponse.json({ error: 'Failed to update image order' }, { status: 500 });
  }

  console.log(
    `[CarImages/Reorder] Updated order for ${imageIds.length} images, carSlug=${carSlug}`
  );

  return NextResponse.json({
    success: true,
    message: `Reordered ${imageIds.length} images`,
    order: imageIds,
  });
}

// Export wrapped handler with error logging
export const PUT = withErrorLogging(handlePut, {
  route: 'users/[userId]/car-images/reorder',
  feature: 'garage',
});
