/**
 * Media Uploads API
 *
 * Handles user image and video uploads via Vercel Blob.
 *
 * NOTE: For files larger than 4.5MB, use the client upload flow instead:
 *   1. Client calls /api/uploads/client-token to get upload token
 *   2. Client uploads directly to Vercel Blob (bypasses serverless limit)
 *   3. Client calls /api/uploads/save-metadata to save metadata
 *
 * This endpoint is kept for backwards compatibility and small files.
 *
 * POST /api/uploads - Upload a new image or video (small files only)
 * DELETE /api/uploads?id=xxx - Delete a media file
 * PATCH /api/uploads - Link images to builds or set primary
 *
 * @route /api/uploads
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import { put, del } from '@vercel/blob';

import { errors } from '@/lib/apiErrors';
import { awardPoints } from '@/lib/pointsService';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import {
  createAuthenticatedClient,
  createServerSupabaseClient,
  getBearerToken,
} from '@/lib/supabaseServer';
import { compressFile, isCompressible } from '@/lib/tinify';

// File size limits
// NOTE: Vercel serverless has 4.5MB body limit, so this route can't handle large files
// Use client upload flow for files > 4MB (see /api/uploads/client-token)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB advertised (but 4.5MB effective)
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB (requires client upload)

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

/**
 * Determine media type from content type
 */
function getMediaType(contentType) {
  if (ALLOWED_VIDEO_TYPES.includes(contentType)) return 'video';
  return 'image';
}

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
 * POST /api/uploads
 * Upload a new image
 */
async function handlePost(request) {
  // Verify authentication
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return errors.unauthorized();
  }

  // Parse form data
  const formData = await request.formData();
  const file = formData.get('file');
  const vehicleId = formData.get('vehicleId');
  const buildId = formData.get('buildId');
  const postId = formData.get('postId');
  const carSlug = formData.get('carSlug'); // For cross-feature image sharing
  const caption = formData.get('caption');
  const isPrimary = formData.get('isPrimary') === 'true';

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        error: `Invalid file type. Allowed: images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, MOV)`,
      },
      { status: 400 }
    );
  }

  // Determine media type and validate size accordingly
  const mediaType = getMediaType(file.type);
  const maxSize = mediaType === 'video' ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

  if (file.size > maxSize) {
    return NextResponse.json(
      {
        error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB for ${mediaType}s`,
      },
      { status: 400 }
    );
  }

  // Generate unique filename
  const timestamp = Date.now();
  let ext = file.type.split('/')[1];
  // Handle special cases
  if (ext === 'jpeg') ext = 'jpg';
  if (ext === 'quicktime') ext = 'mov';

  const folder = mediaType === 'video' ? 'user-videos' : 'user-uploads';
  const filename = `${folder}/${user.id}/${timestamp}.${ext}`;

  // Compress image with TinyPNG before uploading (skip for videos)
  let fileToUpload = file;
  const originalFileSize = file.size;
  let _compressionApplied = false;
  let compressionSavings = 0;

  if (mediaType === 'image' && isCompressible(file.type)) {
    try {
      const compressed = await compressFile(file);
      if (compressed) {
        fileToUpload = compressed.blob;
        _compressionApplied = true;
        compressionSavings = compressed.savings;
        console.log(
          `[Uploads API] Compressed: ${(originalFileSize / 1024).toFixed(0)}KB → ${(compressed.compressedSize / 1024).toFixed(0)}KB (-${(compressionSavings * 100).toFixed(1)}%)`
        );
      }
    } catch (compressError) {
      // Log but don't fail - upload original if compression fails
      console.warn('[Uploads API] Compression failed, uploading original:', compressError.message);
    }
  }

  // Upload to Vercel Blob (compressed or original)
  const blob = await put(filename, fileToUpload, {
    access: 'public',
    contentType: file.type,
  });

  if (!blob.url) {
    throw new Error('Failed to upload to blob storage');
  }

  // Save metadata to database
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Build insert data
  const insertData = {
    user_id: user.id,
    user_vehicle_id: vehicleId || null,
    user_build_id: buildId || null,
    community_post_id: postId || null,
    car_slug: carSlug || null, // For cross-feature image sharing (Garage <-> Tuning Shop)
    blob_url: blob.url,
    blob_pathname: blob.pathname,
    file_name: file.name || `upload-${timestamp}`,
    file_size: fileToUpload.size, // Store compressed size
    original_file_size: originalFileSize, // Store original size for analytics
    content_type: file.type,
    caption: caption || null,
    is_primary: isPrimary,
    upload_source: 'web',
    media_type: mediaType,
  };

  // Add video-specific fields if applicable
  if (mediaType === 'video') {
    const duration = formData.get('duration');
    const videoResolution = formData.get('resolution');

    if (duration) insertData.duration_seconds = parseInt(duration, 10);
    if (videoResolution) insertData.video_resolution = videoResolution;
  }

  const { data: imageRecord, error: dbError } = await supabase
    .from('user_uploaded_images')
    .insert(insertData)
    .select()
    .single();

  if (dbError) {
    // Try to clean up blob on failure
    try {
      await del(blob.url);
    } catch (delError) {
      console.error('[Uploads API] Failed to cleanup blob:', delError);
    }

    console.error('[Uploads API] Database error:', dbError);
    return NextResponse.json({ error: 'Failed to save image' }, { status: 500 });
  }

  // Award points for uploading a photo to garage (non-blocking)
  if (vehicleId && mediaType === 'image') {
    awardPoints(user.id, 'garage_upload_photo', { imageId: imageRecord.id, vehicleId }).catch(
      () => {}
    );
  }

  return NextResponse.json({
    success: true,
    image: imageRecord,
    mediaType: mediaType,
  });
}

/**
 * PATCH /api/uploads
 * Link images to a build or update image properties
 * Body: { imageIds: string[], buildId: string } or { imageId: string, isPrimary: boolean }
 */
async function handlePatch(request) {
  // Verify authentication
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return errors.unauthorized();
  }

  const body = await request.json();
  const { imageIds, buildId, imageId, isPrimary } = body;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Handle linking multiple images to a build
  if (imageIds && buildId) {
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return NextResponse.json({ error: 'imageIds must be a non-empty array' }, { status: 400 });
    }

    // Verify user owns the build
    const { data: build, error: buildError } = await supabase
      .from('user_projects')
      .select('id, user_id')
      .eq('id', buildId)
      .single();

    if (buildError || !build) {
      return NextResponse.json({ error: 'Build not found' }, { status: 404 });
    }

    if (build.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized - not your build' }, { status: 403 });
    }

    // Verify user owns all the images
    const { data: images, error: imagesError } = await supabase
      .from('user_uploaded_images')
      .select('id, user_id')
      .in('id', imageIds);

    if (imagesError) {
      console.error('[Uploads API] Error fetching images:', imagesError);
      return NextResponse.json({ error: 'Failed to verify images' }, { status: 500 });
    }

    // Check ownership
    const unauthorizedImages = images?.filter((img) => img.user_id !== user.id) || [];
    if (unauthorizedImages.length > 0) {
      return NextResponse.json({ error: 'Unauthorized - some images not yours' }, { status: 403 });
    }

    // Update images to link to build
    const { error: updateError } = await supabase
      .from('user_uploaded_images')
      .update({ user_build_id: buildId })
      .in('id', imageIds)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[Uploads API] Error linking images:', updateError);
      return NextResponse.json({ error: 'Failed to link images' }, { status: 500 });
    }

    console.log(`[Uploads API] Linked ${imageIds.length} images to build ${buildId}`);
    return NextResponse.json({ success: true, linkedCount: imageIds.length });
  }

  // Handle setting primary image
  if (imageId && typeof isPrimary === 'boolean') {
    // Verify user owns the image
    const { data: image, error: fetchError } = await supabase
      .from('user_uploaded_images')
      .select('id, user_id, user_build_id')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    if (image.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // If setting as primary and image is part of a build, unset other primaries first
    if (isPrimary && image.user_build_id) {
      await supabase
        .from('user_uploaded_images')
        .update({ is_primary: false })
        .eq('user_build_id', image.user_build_id)
        .eq('user_id', user.id);
    }

    // Update the image
    const { error: updateError } = await supabase
      .from('user_uploaded_images')
      .update({ is_primary: isPrimary })
      .eq('id', imageId);

    if (updateError) {
      console.error('[Uploads API] Error updating primary:', updateError);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
}

/**
 * DELETE /api/uploads?id=xxx
 * Delete an image
 */
async function handleDelete(request) {
  // Verify authentication
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return errors.unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get('id');

  if (!imageId) {
    return errors.missingField('id');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get image record (verify ownership)
  const { data: image, error: fetchError } = await supabase
    .from('user_uploaded_images')
    .select('blob_url, user_id')
    .eq('id', imageId)
    .single();

  if (fetchError || !image) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  if (image.user_id !== user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Delete from blob storage
  if (image.blob_url) {
    try {
      await del(image.blob_url);
    } catch (blobError) {
      console.error('[Uploads API] Blob delete failed:', blobError);
      // Continue with DB delete anyway
    }
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('user_uploaded_images')
    .delete()
    .eq('id', imageId);

  if (deleteError) {
    console.error('[Uploads API] Database delete error:', deleteError);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Export wrapped handlers with error logging
export const POST = withErrorLogging(handlePost, { route: 'uploads', feature: 'uploads' });
export const PATCH = withErrorLogging(handlePatch, { route: 'uploads', feature: 'uploads' });
export const DELETE = withErrorLogging(handleDelete, { route: 'uploads', feature: 'uploads' });
