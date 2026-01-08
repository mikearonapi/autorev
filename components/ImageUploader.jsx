'use client';

/**
 * Media Uploader Component
 * 
 * Drag-and-drop image and video upload with preview.
 * Uploads to /api/uploads endpoint.
 * 
 * Supports:
 * - Images: JPEG, PNG, WebP, GIF (up to 10MB)
 * - Videos: MP4, WebM, MOV (up to 500MB)
 */

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from './ImageUploader.module.css';

// File size limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10MB for images
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB for videos

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
  existingImages = [],
  disabled = false,
}) {
  const [uploads, setUploads] = useState(existingImages);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

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

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    if (vehicleId) formData.append('vehicleId', vehicleId);
    if (buildId) formData.append('buildId', buildId);
    
    // Only set isPrimary for images (first image becomes hero)
    // Videos should not be primary
    const isVideo = isVideoFile(file);
    const existingImages = uploads.filter(u => u.media_type !== 'video');
    formData.append('isPrimary', (!isVideo && existingImages.length === 0) ? 'true' : 'false');

    // Get video duration if it's a video
    if (isVideo) {
      const duration = await getVideoDuration(file);
      if (duration) formData.append('duration', duration.toString());
    }

    const response = await fetch('/api/uploads', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Upload failed');
    }

    const data = await response.json();
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

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRemove = async (imageId) => {
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
        className={`${styles.dropzone} ${dragActive ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
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
          onChange={handleChange}
          className={styles.fileInput}
          disabled={disabled}
        />
        
        {uploading ? (
          <div className={styles.uploading}>
            <div className={styles.spinner} />
            <span>Uploading...</span>
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
              JPEG, PNG, WebP, GIF • Max 10 images • 10MB each
            </span>
            <span className={styles.dropHint}>
              MP4, WebM, MOV • Max 500MB per video
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

      {/* Media Previews */}
      {uploads.length > 0 && (
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

