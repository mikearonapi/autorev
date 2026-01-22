/**
 * Save Upload Metadata API
 * 
 * Processes and saves metadata for files uploaded directly to Vercel Blob.
 * 
 * Flow:
 * 1. Client uploads large image directly to Vercel Blob (bypasses 4.5MB limit)
 * 2. Client calls this endpoint with the blob URL
 * 3. Server fetches image from blob URL (no size limit - it's a URL fetch)
 * 4. Server compresses with TinyPNG
 * 5. Server uploads compressed version to Vercel Blob
 * 6. Server saves metadata to database
 * 
 * POST /api/uploads/save-metadata
 * 
 * @route /api/uploads/save-metadata
 */

import { NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import { compressImage, isCompressible } from '@/lib/tinify';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { errors } from '@/lib/apiErrors';
import { awardPoints } from '@/lib/pointsService';

/**
 * Get authenticated user from request (supports both cookie and Bearer token)
 */
async function getAuthenticatedUser(request) {
  const bearerToken = getBearerToken(request);
  const supabase = bearerToken 
    ? createAuthenticatedClient(bearerToken) 
    : await createServerSupabaseClient();

  if (!supabase) return null;

  const { data: { user } } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();
  return user;
}

/**
 * Determine media type from content type
 */
function getMediaType(contentType) {
  const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
  if (videoTypes.includes(contentType)) return 'video';
  return 'image';
}

async function handlePost(request) {
  // Verify authentication
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return errors.unauthorized();
  }

  const body = await request.json();
  const {
    blobUrl,
    blobPathname,
    fileName,
    fileSize,
    contentType,
    vehicleId,
    buildId,
    postId,
    caption,
    isPrimary,
    duration,
    carSlug,  // For cross-feature image sharing
  } = body;

  // Validate required fields
  if (!blobUrl) {
    return NextResponse.json({ error: 'Missing blob URL' }, { status: 400 });
  }

  // Extract pathname from blob URL - ALWAYS prefer URL extraction for reliability
  // The client upload() may return the original pathname with __USER__ placeholder
  // but the actual blob URL contains the correct path with the real user ID
  let validatedPathname = blobPathname;
  
  // Try to extract pathname from blob URL
  // URLs look like: https://xxxxx.public.blob.vercel-storage.com/user-uploads/userId/timestamp.jpg
  try {
    const url = new URL(blobUrl);
    let urlPathname = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
    
    console.log(`[SaveMetadata] URL pathname: ${urlPathname}, provided pathname: ${blobPathname}`);
    
    // Handle case where Vercel Blob didn't apply the pathname override
    // (the file was uploaded to __USER__ path instead of actual user ID)
    if (urlPathname.includes('__USER__')) {
      console.log(`[SaveMetadata] URL contains __USER__ placeholder, transforming to user ID`);
      urlPathname = urlPathname.replace('__USER__', user.id);
      
      // Note: This means the file is at a different URL than expected
      // We'll update the URL to point to where we expect it should be
      // This is a workaround for Vercel Blob SDK pathname override not working
      console.warn(`[SaveMetadata] File may be at wrong path. Original URL: ${blobUrl}`);
    }
    
    // ALWAYS use URL pathname as it's the source of truth for where the file was actually stored
    validatedPathname = urlPathname;
  } catch (urlError) {
    console.warn(`[SaveMetadata] Failed to parse blob URL: ${blobUrl}`, urlError.message);
    // Fall back to provided pathname if URL parsing fails
    validatedPathname = blobPathname;
    
    // Also try to transform __USER__ in provided pathname
    if (validatedPathname && validatedPathname.includes('__USER__')) {
      validatedPathname = validatedPathname.replace('__USER__', user.id);
    }
  }

  // Verify the blob pathname belongs to this user
  const expectedPrefix = `user-uploads/${user.id}/`;
  const videoPrefix = `user-videos/${user.id}/`;
  
  // Log for debugging
  console.log(`[SaveMetadata] Validating pathname: ${validatedPathname}`);
  console.log(`[SaveMetadata] Expected prefixes: ${expectedPrefix} or ${videoPrefix}`);
  
  if (!validatedPathname || (!validatedPathname.startsWith(expectedPrefix) && !validatedPathname.startsWith(videoPrefix))) {
    console.error(`[SaveMetadata] Invalid pathname: ${validatedPathname}, user: ${user.id}`);
    return NextResponse.json({ error: 'Invalid blob pathname' }, { status: 403 });
  }

  const mediaType = getMediaType(contentType);
  
  // Track sizes for logging
  let finalBlobUrl = blobUrl;
  let finalBlobPathname = validatedPathname;
  let finalFileSize = fileSize;
  let compressionApplied = false;
  let compressionSavings = 0;

  // Compress images with TinyPNG (skip videos)
  if (mediaType === 'image' && isCompressible(contentType)) {
    try {
      console.log(`[SaveMetadata] Fetching image for compression: ${blobUrl}`);
      
      // Fetch the uploaded image from Vercel Blob
      const imageResponse = await fetch(blobUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      console.log(`[SaveMetadata] Fetched ${(imageBuffer.length / 1024).toFixed(0)}KB, sending to TinyPNG...`);
      
      // Compress with TinyPNG
      const compressed = await compressImage(imageBuffer, {
        contentType,
        filename: fileName,
      });
      
      if (compressed) {
        // Upload compressed version to a new path
        const compressedPathname = validatedPathname.replace(/(\.[^.]+)$/, '-compressed$1');
        
        const compressedBlob = await put(compressedPathname, compressed.buffer, {
          access: 'public',
          contentType,
        });
        
        if (compressedBlob.url) {
          // Delete the original uncompressed blob
          try {
            await del(blobUrl);
            console.log(`[SaveMetadata] Deleted original: ${validatedPathname}`);
          } catch (delError) {
            console.warn(`[SaveMetadata] Failed to delete original: ${delError.message}`);
          }
          
          // Use compressed version
          finalBlobUrl = compressedBlob.url;
          finalBlobPathname = compressedBlob.pathname;
          finalFileSize = compressed.compressedSize;
          compressionApplied = true;
          compressionSavings = compressed.savings;
          
          console.log(
            `[SaveMetadata] TinyPNG: ${(fileSize / 1024).toFixed(0)}KB → ${(finalFileSize / 1024).toFixed(0)}KB ` +
            `(-${(compressionSavings * 100).toFixed(1)}%)`
          );
        }
      } else {
        console.log(`[SaveMetadata] TinyPNG skipped (minimal savings or not compressible)`);
      }
    } catch (compressError) {
      // Log but don't fail - keep original if compression fails
      console.warn(`[SaveMetadata] TinyPNG compression failed, keeping original: ${compressError.message}`);
    }
  }

  // Save metadata to database
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const insertData = {
    user_id: user.id,
    user_vehicle_id: vehicleId || null,
    user_build_id: buildId || null,
    community_post_id: postId || null,
    car_slug: carSlug || null,  // For cross-feature image sharing (Garage <-> Tuning Shop)
    blob_url: finalBlobUrl,
    blob_pathname: finalBlobPathname,
    file_name: fileName || `upload-${Date.now()}`,
    file_size: finalFileSize,
    original_file_size: fileSize, // Store original size for analytics
    content_type: contentType,
    caption: caption || null,
    is_primary: isPrimary || false,
    upload_source: 'web',
    media_type: mediaType,
  };

  // Add video-specific fields
  if (mediaType === 'video' && duration) {
    insertData.duration_seconds = parseInt(duration, 10);
  }

  const { data: imageRecord, error: dbError } = await supabase
    .from('user_uploaded_images')
    .insert(insertData)
    .select()
    .single();

  if (dbError) {
    console.error('[SaveMetadata] Database error:', dbError);
    return NextResponse.json({ error: 'Failed to save metadata' }, { status: 500 });
  }

  console.log(
    `[SaveMetadata] Saved: ${finalBlobPathname} ` +
    `(${(finalFileSize / 1024).toFixed(0)}KB${compressionApplied ? ', compressed' : ''})`
  );

  // Award points for uploading a photo to garage (non-blocking)
  if (vehicleId && mediaType === 'image') {
    awardPoints(user.id, 'garage_upload_photo', { imageId: imageRecord.id, vehicleId }).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    image: imageRecord,
    mediaType,
    compression: compressionApplied ? {
      originalSize: fileSize,
      compressedSize: finalFileSize,
      savings: compressionSavings,
    } : null,
  });
}

// Export wrapped handler with error logging
export const POST = withErrorLogging(handlePost, { route: 'uploads/save-metadata', feature: 'uploads' });
