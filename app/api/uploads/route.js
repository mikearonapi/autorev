/**
 * Media Uploads API
 * 
 * Handles user image and video uploads via Vercel Blob.
 * 
 * POST /api/uploads - Upload a new image or video
 * DELETE /api/uploads?id=xxx - Delete a media file
 * 
 * @route /api/uploads
 */

import { NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// File size limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10MB for images
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB for videos

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
 * POST /api/uploads
 * Upload a new image
 */
export async function POST(request) {
  try {
    // Verify authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');
    const vehicleId = formData.get('vehicleId');
    const buildId = formData.get('buildId');
    const postId = formData.get('postId');
    const caption = formData.get('caption');
    const isPrimary = formData.get('isPrimary') === 'true';

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed: images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, MOV)` 
      }, { status: 400 });
    }

    // Determine media type and validate size accordingly
    const mediaType = getMediaType(file.type);
    const maxSize = mediaType === 'video' ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB for ${mediaType}s` 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    let ext = file.type.split('/')[1];
    // Handle special cases
    if (ext === 'jpeg') ext = 'jpg';
    if (ext === 'quicktime') ext = 'mov';
    
    const folder = mediaType === 'video' ? 'user-videos' : 'user-uploads';
    const filename = `${folder}/${user.id}/${timestamp}.${ext}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
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
      blob_url: blob.url,
      blob_pathname: blob.pathname,
      file_name: file.name || `upload-${timestamp}`,
      file_size: file.size,
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

    return NextResponse.json({
      success: true,
      image: imageRecord,
      mediaType: mediaType,
    });

  } catch (error) {
    console.error('[Uploads API] Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

/**
 * DELETE /api/uploads?id=xxx
 * Delete an image
 */
export async function DELETE(request) {
  try {
    // Verify authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('id');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
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

  } catch (error) {
    console.error('[Uploads API] Error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}

