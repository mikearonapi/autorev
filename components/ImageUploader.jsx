'use client';

/**
 * Media Uploader Component
 * 
 * Drag-and-drop image and video upload with preview.
 * Uses Vercel Blob client uploads to bypass serverless function size limits.
 * 
 * Supports:
 * - Images: JPEG, PNG, WebP, GIF (up to 25MB)
 * - Videos: MP4, WebM, MOV (up to 50MB)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';

import Image from 'next/image';

import { upload } from '@vercel/blob/client';

import styles from './ImageUploader.module.css';

// File size limits - can be larger now with client uploads
const MAX_IMAGE_SIZE = 25 * 1024 * 1024;  // 25MB for images
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;  // 50MB for videos

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

/**
 * Check if file is a video
 */
function isVideoFile(file) {
  return ALLOWED_VIDEO_TYPES.includes(file.type);
}

/**
 * Format duration in seconds to mm:ss
 */
function formatDuration(seconds) {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get video duration from file
 */
async function getVideoDuration(file) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration));
    };
    video.onerror = () => resolve(null);
    video.src = URL.createObjectURL(file);
  });
}

export default function ImageUploader({ 
  onUploadComplete,
  onUploadError,
  onVideoClick,
  maxFiles = 10,
  vehicleId,
  buildId,
  carSlug,  // For cross-feature image sharing (Garage <-> Tuning Shop)
  existingImages = [],
  disabled = false,
  showPreviews = true, // Set to false when using a separate gallery component
  compact = false, // Compact mode for smaller dropzone
}) {
  const [uploads, setUploads] = useState(existingImages);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Sync internal state when existingImages prop changes (e.g., loaded from database)
  useEffect(() => {
    // Only sync if we're not currently uploading (avoid overwriting in-progress uploads)
    if (!uploading) {
      setUploads(existingImages);
    }
  }, [existingImages, uploading]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Invalid file type. Allowed: JPEG, PNG, WebP, GIF, MP4, WebM, MOV`;
    }
    
    const isVideo = isVideoFile(file);
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    
    if (file.size > maxSize) {
      const sizeMB = maxSize / 1024 / 1024;
      return `File too large. Maximum size: ${sizeMB}MB for ${isVideo ? 'videos' : 'images'}`;
    }
    return null;
  };

  /**
   * Upload file using Vercel Blob client upload
   * This bypasses the 4.5MB serverless function limit
   */
  const uploadFile = async (file) => {
    const isVideo = isVideoFile(file);
    const timestamp = Date.now();
    
    // Determine extension
    let ext = file.type.split('/')[1];
    if (ext === 'jpeg') ext = 'jpg';
    if (ext === 'quicktime') ext = 'mov';
    
    // Build pathname for the blob (user folder is enforced server-side)
    const folder = isVideo ? 'user-videos' : 'user-uploads';
    // Note: userId will be added by the server token handler
    const filename = `${timestamp}.${ext}`;
    
    // Upload directly to Vercel Blob (bypasses serverless function limit)
    const blob = await upload(`${folder}/__USER__/${filename}`, file, {
      access: 'public',
      handleUploadUrl: '/api/uploads/client-token',
    });

    if (!blob.url) {
      throw new Error('Upload failed - no URL returned');
    }

    // Get video duration if applicable
    let duration = null;
    if (isVideo) {
      duration = await getVideoDuration(file);
    }

    // Determine if this should be primary
    const existingImages = uploads.filter(u => u.media_type !== 'video');
    const shouldBePrimary = !isVideo && existingImages.length === 0;

    // Save metadata to database via separate endpoint
    const metadataResponse = await fetch('/api/uploads/save-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blobUrl: blob.url,
        blobPathname: blob.pathname,
        fileName: file.name || filename,
        fileSize: file.size,
        contentType: file.type,
        vehicleId: vehicleId || null,
        buildId: buildId || null,
        carSlug: carSlug || null,  // For cross-feature image sharing
        isPrimary: shouldBePrimary,
        duration: duration,
      }),
    });

    if (!metadataResponse.ok) {
      const errorData = await metadataResponse.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to save upload metadata');
    }

    const data = await metadataResponse.json();
    return data.image;
  };

  const handleFiles = async (files) => {
    if (disabled) return;
    
    setError(null);
    const fileArray = Array.from(files);
    
    // Check max files
    if (uploads.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`);
      return;
    }

    // Validate all files first
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setUploading(true);

    try {
      const uploadedImages = [];
      
      for (const file of fileArray) {
        const image = await uploadFile(file);
        uploadedImages.push(image);
      }

      const newUploads = [...uploads, ...uploadedImages];
      setUploads(newUploads);
      
      if (onUploadComplete) {
        onUploadComplete(newUploads);
      }

    } catch (err) {
      console.error('[ImageUploader] Upload error:', err);
      setError(err.message || 'Upload failed');
      if (onUploadError) {
        onUploadError(err);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploads, maxFiles, disabled]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRemove = async (imageId) => {
    // Confirm before deleting
    const confirmed = window.confirm('Delete this photo? This cannot be undone.');
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/uploads?id=${imageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      const newUploads = uploads.filter(img => img.id !== imageId);
      setUploads(newUploads);
      
      if (onUploadComplete) {
        onUploadComplete(newUploads);
      }

    } catch (err) {
      console.error('[ImageUploader] Delete error:', err);
      setError(err.message);
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      // Update locally first for responsiveness
      const newUploads = uploads.map(img => ({
        ...img,
        is_primary: img.id === imageId,
      }));
      setUploads(newUploads);
      
      if (onUploadComplete) {
        onUploadComplete(newUploads);
      }

      // TODO: Update on server if needed
      
    } catch (err) {
      console.error('[ImageUploader] Set primary error:', err);
    }
  };

  return (
    <div className={styles.container}>
      {/* Drop Zone */}
      <div
        className={`${styles.dropzone} ${dragActive ? styles.active : ''} ${disabled ? styles.disabled : ''} ${compact ? styles.compact : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          multiple
          onChange={handleImageChange}
          className={styles.fileInput}
          disabled={disabled}
        />
        
        {uploading ? (
          <div className={styles.uploading}>
            <div className={styles.spinner} />
            <span>Uploading...</span>
          </div>
        ) : compact ? (
          <div className={styles.dropContentCompact}>
            <svg className={styles.uploadIconCompact} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div className={styles.dropTextCompact}>
              <span className={styles.dropTextMain}>
                {dragActive ? 'Drop files here' : 'Tap to upload photos or videos'}
              </span>
              <span className={styles.dropTextSub}>
                JPEG, PNG, WebP, GIF, MP4, WebM • Max 25MB
              </span>
            </div>
          </div>
        ) : (
          <div className={styles.dropContent}>
            <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className={styles.dropText}>
              {dragActive ? 'Drop files here' : 'Drag & drop images or videos, or click to browse'}
            </span>
            <span className={styles.dropHint}>
              JPEG, PNG, WebP, GIF • Max 10 images • 25MB each
            </span>
            <span className={styles.dropHint}>
              MP4, WebM, MOV • Max 50MB per video
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* Media Previews - only show if showPreviews is true */}
      {showPreviews && uploads.length > 0 && (
        <div className={styles.previews}>
          {uploads.map((media, index) => {
            const isVideo = media.media_type === 'video';
            
            return (
              <div 
                key={media.id || index} 
                className={`${styles.preview} ${media.is_primary ? styles.primary : ''} ${isVideo ? styles.videoPreview : ''}`}
                onClick={() => isVideo && onVideoClick && onVideoClick(media)}
              >
                {isVideo ? (
                  <>
                    {/* Video thumbnail or placeholder */}
                    <div className={styles.videoThumbnail}>
                      {media.video_thumbnail_url ? (
                        <Image
                          src={media.video_thumbnail_url}
                          alt={media.caption || `Video ${index + 1}`}
                          width={120}
                          height={80}
                          className={styles.previewImage}
                        />
                      ) : (
                        <div className={styles.videoPlaceholder}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="2" width="20" height="20" rx="2" />
                            <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                          </svg>
                        </div>
                      )}
                      {/* Play icon overlay */}
                      <div className={styles.playIconOverlay}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                          <polygon points="8 5 19 12 8 19 8 5" />
                        </svg>
                      </div>
                      {/* Duration badge */}
                      {media.duration_seconds && (
                        <span className={styles.durationBadge}>
                          {formatDuration(media.duration_seconds)}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <Image
                    src={media.blob_url || media.thumbnail_url}
                    alt={media.caption || `Upload ${index + 1}`}
                    width={120}
                    height={80}
                    className={styles.previewImage}
                  />
                )}
                
                <div className={styles.previewOverlay}>
                  {media.is_primary && (
                    <span className={styles.primaryBadge}>Hero</span>
                  )}
                  {isVideo && (
                    <span className={styles.videoBadge}>Video</span>
                  )}
                  
                  <div className={styles.previewActions}>
                    {!media.is_primary && !isVideo && (
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(media.id);
                        }}
                        title="Set as hero image"
                      >
                        ⭐
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(media.id);
                      }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Add more button */}
          {uploads.length < maxFiles && (
            <button
              type="button"
              className={styles.addMoreBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              <span>+</span>
              <span>Add</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

