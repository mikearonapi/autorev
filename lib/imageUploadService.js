/**
 * Image Upload Service
 * 
 * Handles user image uploads to Vercel Blob storage.
 * 
 * @module lib/imageUploadService
 */

import { put, del } from '@vercel/blob';
import { supabase, isSupabaseConfigured } from './supabase';
import { compressFile, isCompressible } from './tinify';

// =============================================================================
// CONFIGURATION
// =============================================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// =============================================================================
// UPLOAD IMAGE
// =============================================================================

/**
 * Upload an image to Vercel Blob and save metadata to database
 * 
 * @param {File|Blob} file - The image file to upload
 * @param {Object} options - Upload options
 * @param {string} options.userId - User's UUID (required)
 * @param {string} [options.vehicleId] - Associated vehicle ID
 * @param {string} [options.buildId] - Associated build ID
 * @param {string} [options.postId] - Associated community post ID
 * @param {string} [options.caption] - Image caption
 * @param {boolean} [options.isPrimary] - Whether this is the primary image
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function uploadImage(file, options) {
  const { userId, vehicleId, buildId, postId, caption, isPrimary } = options;

  if (!userId) {
    return { data: null, error: new Error('User ID is required') };
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { data: null, error: new Error(`Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`) };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { data: null, error: new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`) };
  }

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
    const filename = `user-uploads/${userId}/${timestamp}.${ext}`;

    // Compress image with TinyPNG before uploading
    let fileToUpload = file;
    let originalFileSize = file.size;

    if (isCompressible(file.type)) {
      try {
        const compressed = await compressFile(file);
        if (compressed) {
          fileToUpload = compressed.blob;
          console.log(`[ImageUpload] Compressed: ${(originalFileSize / 1024).toFixed(0)}KB → ${(compressed.compressedSize / 1024).toFixed(0)}KB (-${(compressed.savings * 100).toFixed(1)}%)`);
        }
      } catch (compressError) {
        // Log but don't fail - upload original if compression fails
        console.warn('[ImageUpload] Compression failed, uploading original:', compressError.message);
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
    if (isSupabaseConfigured && supabase) {
      const { data: imageRecord, error: dbError } = await supabase
        .from('user_uploaded_images')
        .insert({
          user_id: userId,
          user_vehicle_id: vehicleId || null,
          user_build_id: buildId || null,
          community_post_id: postId || null,
          blob_url: blob.url,
          blob_pathname: blob.pathname,
          file_name: file.name,
          file_size: fileToUpload.size, // Store compressed size
          original_file_size: originalFileSize, // Store original for analytics
          content_type: file.type,
          caption: caption || null,
          is_primary: isPrimary || false,
          upload_source: 'web',
        })
        .select()
        .single();

      if (dbError) {
        // Try to clean up the blob if database insert fails
        try {
          await del(blob.url);
        } catch (delError) {
          console.error('[ImageUpload] Failed to cleanup blob after DB error:', delError);
        }
        return { data: null, error: dbError };
      }

      return { data: imageRecord, error: null };
    }

    // Return blob data if Supabase not configured
    return {
      data: {
        blob_url: blob.url,
        blob_pathname: blob.pathname,
      },
      error: null,
    };

  } catch (err) {
    console.error('[ImageUpload] Error:', err);
    return { data: null, error: err };
  }
}

/**
 * Upload multiple images
 * 
 * @param {Array<File>} files - Array of files to upload
 * @param {Object} options - Upload options (same as uploadImage)
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function uploadMultipleImages(files, options) {
  const results = [];
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const { data, error } = await uploadImage(file, {
      ...options,
      isPrimary: options.isPrimary && i === 0, // Only first image is primary
    });

    if (error) {
      errors.push({ file: file.name, error: error.message });
    } else {
      results.push(data);
    }
  }

  if (errors.length > 0 && results.length === 0) {
    return { data: null, error: new Error(`All uploads failed: ${errors.map(e => e.error).join(', ')}`) };
  }

  return {
    data: results,
    error: errors.length > 0 ? { partial: true, errors } : null,
  };
}

// =============================================================================
// DELETE IMAGE
// =============================================================================

/**
 * Delete an uploaded image from both blob storage and database
 * 
 * @param {string} imageId - Image record ID
 * @param {string} userId - User ID (for verification)
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deleteImage(imageId, userId) {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: new Error('Database not configured') };
  }

  try {
    // Get image record
    const { data: image, error: fetchError } = await supabase
      .from('user_uploaded_images')
      .select('blob_url, blob_pathname, user_id')
      .eq('id', imageId)
      .single();

    if (fetchError) {
      return { success: false, error: fetchError };
    }

    // Verify ownership
    if (image.user_id !== userId) {
      return { success: false, error: new Error('Unauthorized') };
    }

    // Delete from blob storage
    if (image.blob_url) {
      try {
        await del(image.blob_url);
      } catch (blobError) {
        console.error('[ImageUpload] Blob deletion failed:', blobError);
        // Continue with database deletion anyway
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('user_uploaded_images')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      return { success: false, error: deleteError };
    }

    return { success: true, error: null };

  } catch (err) {
    console.error('[ImageUpload] Delete error:', err);
    return { success: false, error: err };
  }
}

// =============================================================================
// UPDATE IMAGE
// =============================================================================

/**
 * Update image metadata (caption, primary status, etc.)
 * 
 * @param {string} imageId - Image record ID
 * @param {string} userId - User ID (for verification)
 * @param {Object} updates - Fields to update
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateImage(imageId, userId, updates) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  const allowedUpdates = ['caption', 'alt_text', 'is_primary', 'display_order'];
  const sanitizedUpdates = {};
  
  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      sanitizedUpdates[key] = updates[key];
    }
  }

  if (Object.keys(sanitizedUpdates).length === 0) {
    return { data: null, error: new Error('No valid updates provided') };
  }

  try {
    const { data, error } = await supabase
      .from('user_uploaded_images')
      .update(sanitizedUpdates)
      .eq('id', imageId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data, error: null };

  } catch (err) {
    console.error('[ImageUpload] Update error:', err);
    return { data: null, error: err };
  }
}

// =============================================================================
// FETCH IMAGES
// =============================================================================

/**
 * Fetch images for a specific entity (vehicle, build, or post)
 * 
 * @param {Object} params - Query parameters
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchImages(params) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Database not configured') };
  }

  const { userId, vehicleId, buildId, postId } = params;

  let query = supabase
    .from('user_uploaded_images')
    .select('*')
    .order('is_primary', { ascending: false })
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (userId) query = query.eq('user_id', userId);
  if (vehicleId) query = query.eq('user_vehicle_id', vehicleId);
  if (buildId) query = query.eq('user_build_id', buildId);
  if (postId) query = query.eq('community_post_id', postId);

  const { data, error } = await query;

  if (error) {
    return { data: null, error };
  }

  return { data: data || [], error: null };
}

