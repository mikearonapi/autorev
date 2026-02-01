'use client';

/**
 * Media Uploader Component
 *
 * Drag-and-drop image and video upload with preview.
 * Uses direct server upload with client-side image resizing for reliability.
 *
 * Supports:
 * - Images: JPEG, PNG, WebP, GIF (up to 10MB after resize)
 * - Videos: MP4, WebM, MOV (up to 50MB via client upload)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';

import Image from 'next/image';

import { upload } from '@vercel/blob/client';

import styles from './ImageUploader.module.css';

// File size limits
// Accept large files - we'll resize them on client before upload
const MAX_IMAGE_SIZE = 25 * 1024 * 1024; // 25MB for images (resized on client)
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB for videos
// Images larger than this will be resized on client before upload
// Vercel serverless has 4.5MB body limit, so we must resize anything larger
const CLIENT_RESIZE_THRESHOLD = 2 * 1024 * 1024; // 2MB - resize anything larger
// Target size after resize (must stay under 4.5MB Vercel limit)
const TARGET_RESIZE_SIZE = 1.5 * 1024 * 1024; // 1.5MB target after resize

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

/**
 * Resize an image file on the client to reduce upload size
 * Returns a new File object with the resized image
 */
async function resizeImageIfNeeded(file) {
  // Skip if file is small enough or not an image
  if (file.size <= CLIENT_RESIZE_THRESHOLD || !file.type.startsWith('image/')) {
    return file;
  }

  // Skip GIFs (would lose animation)
  if (file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);

      // Calculate new dimensions (max 1920px on longest side for HD quality)
      const MAX_DIMENSION = 1920;
      let { width, height } = img;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output type and quality
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      // Start with high quality (0.92 is nearly imperceptible from original)
      // Only reduce quality as last resort for very complex images
      let quality = 0.92;

      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // Fallback to original
              return;
            }

            // If still too large, reduce quality incrementally
            // Stop at 0.70 - below this quality loss becomes noticeable
            if (blob.size > TARGET_RESIZE_SIZE && quality > 0.7) {
              quality -= 0.05; // Smaller steps to preserve quality
              tryCompress();
              return;
            }

            // Create new File from blob
            const resizedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });

            console.log(
              `[ImageUploader] Resized: ${(file.size / 1024).toFixed(0)}KB → ${(resizedFile.size / 1024).toFixed(0)}KB (${width}x${height}, q=${quality.toFixed(2)})`
            );

            resolve(resizedFile);
          },
          outputType,
          quality
        );
      };

      tryCompress();
    };

    img.onerror = () => {
      console.warn('[ImageUploader] Failed to load image for resize, using original');
      resolve(file);
    };

    img.src = URL.createObjectURL(file);
  });
}

export default function ImageUploader({
  onUploadComplete,
  onUploadError,
  onVideoClick,
  maxFiles = 10,
  vehicleId,
  buildId,
  carId, // For cross-feature image sharing (Garage <-> Tuning Shop)
  existingImages = [],
  disabled = false,
  showPreviews = true, // Set to false when using a separate gallery component
  compact = false, // Compact mode for smaller dropzone
}) {
  const [uploads, setUploads] = useState(existingImages);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
    percentage: 0,
    currentFileName: '',
  });
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
      if (isVideo) {
        return `Video too large. Maximum size: ${sizeMB}MB`;
      }
      return `Image too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: ${sizeMB}MB. Try a smaller image.`;
    }
    return null;
  };

  /**
   * Upload image directly to server (simpler, more reliable)
   * For images < 4MB, this uses direct FormData upload
   * @param {File} file - The file to upload
   * @param {Function} onProgress - Progress callback (percentage: number)
   */
  const uploadImageDirect = async (file, onProgress) => {
    // Resize large images on client to ensure fast uploads
    const processedFile = await resizeImageIfNeeded(file);

    // Determine if this should be primary
    const existingImages = uploads.filter((u) => u.media_type !== 'video');
    const shouldBePrimary = existingImages.length === 0;

    // Use FormData for direct server upload
    const formData = new FormData();
    formData.append('file', processedFile);
    if (vehicleId) formData.append('vehicleId', vehicleId);
    if (buildId) formData.append('buildId', buildId);
    if (carId) formData.append('carId', carId);
    formData.append('isPrimary', shouldBePrimary.toString());

    console.log(
      `[ImageUploader] Direct upload: ${processedFile.name}, ${(processedFile.size / 1024).toFixed(0)}KB`
    );

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentage = Math.round((e.loaded / e.total) * 100);
          onProgress(percentage);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success && data.image) {
              console.log('[ImageUploader] Upload complete:', data.image.blob_url);
              resolve(data.image);
            } else {
              reject(new Error(data.error || 'Upload failed'));
            }
          } catch (e) {
            reject(new Error('Invalid server response'));
          }
        } else if (xhr.status === 401) {
          reject(new Error('Please sign in to upload photos'));
        } else if (xhr.status === 413) {
          reject(new Error('File too large. Please try a smaller image.'));
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            reject(new Error(data.error || `Upload failed (${xhr.status})`));
          } catch (e) {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error. Please check your connection.'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timed out. Please try again.'));
      });

      xhr.open('POST', '/api/uploads');
      xhr.timeout = 60000; // 60 second timeout
      xhr.send(formData);
    });
  };

  /**
   * Upload video using Vercel Blob client upload (for large files)
   * @param {File} file - The video file to upload
   * @param {Function} onProgress - Progress callback (percentage: number)
   */
  const uploadVideoClient = async (file, onProgress) => {
    const timestamp = Date.now();
    let ext = file.type.split('/')[1];
    if (ext === 'quicktime') ext = 'mov';
    const filename = `${timestamp}.${ext}`;

    console.log(
      `[ImageUploader] Client upload video: ${filename}, ${(file.size / 1024 / 1024).toFixed(1)}MB`
    );

    let blob;
    try {
      blob = await upload(`user-videos/__USER__/${filename}`, file, {
        access: 'public',
        handleUploadUrl: '/api/uploads/client-token',
        onUploadProgress: (e) => {
          if (onProgress) {
            onProgress(e.percentage);
          }
        },
      });
    } catch (uploadError) {
      console.error('[ImageUploader] Video upload error:', uploadError);
      const errMsg = uploadError.message || '';
      if (errMsg.includes('401') || errMsg.includes('Unauthorized')) {
        throw new Error('Please sign in to upload videos');
      }
      if (errMsg.includes('413') || errMsg.includes('too large')) {
        throw new Error('Video is too large. Maximum size is 50MB.');
      }
      throw new Error(errMsg || 'Video upload failed. Please try again.');
    }

    if (!blob?.url) {
      throw new Error('Upload failed - no URL returned');
    }

    // Get video duration
    const duration = await getVideoDuration(file);

    // Save metadata
    const response = await fetch('/api/uploads/save-metadata', {
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
        carId: carId || null,
        isPrimary: false, // Videos are never primary
        duration: duration,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to save video');
    }

    const data = await response.json();
    return data.image;
  };

  /**
   * Main upload function - routes to appropriate upload method
   * @param {File} file - The file to upload
   * @param {Function} onProgress - Progress callback (percentage: number)
   */
  const uploadFile = async (file, onProgress) => {
    const isVideo = isVideoFile(file);

    if (isVideo) {
      // Videos use client SDK upload (large files)
      return uploadVideoClient(file, onProgress);
    } else {
      // Images use direct server upload (simpler, more reliable)
      return uploadImageDirect(file, onProgress);
    }
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
    setUploadProgress({ current: 0, total: fileArray.length, percentage: 0, currentFileName: '' });

    try {
      const uploadedImages = [];

      // Upload files with progress tracking
      // Use parallel uploads for multiple files (up to 3 concurrent)
      const CONCURRENT_UPLOADS = Math.min(3, fileArray.length);

      if (fileArray.length === 1) {
        // Single file - show detailed progress
        const file = fileArray[0];
        setUploadProgress((prev) => ({
          ...prev,
          current: 1,
          currentFileName: file.name || 'photo',
        }));

        const image = await uploadFile(file, (percentage) => {
          setUploadProgress((prev) => ({ ...prev, percentage: Math.round(percentage) }));
        });
        uploadedImages.push(image);
      } else {
        // Multiple files - process in batches for speed
        const fileProgressMap = new Map();
        fileArray.forEach((_, idx) => fileProgressMap.set(idx, 0));

        const updateOverallProgress = () => {
          const totalProgress = Array.from(fileProgressMap.values()).reduce((a, b) => a + b, 0);
          const overallPercentage = Math.round(totalProgress / fileArray.length);
          const completed = Array.from(fileProgressMap.values()).filter((p) => p === 100).length;
          setUploadProgress((prev) => ({
            ...prev,
            percentage: overallPercentage,
            current: completed,
          }));
        };

        // Process files in concurrent batches
        for (let i = 0; i < fileArray.length; i += CONCURRENT_UPLOADS) {
          const batch = fileArray.slice(i, i + CONCURRENT_UPLOADS);
          const batchPromises = batch.map(async (file, batchIdx) => {
            const fileIdx = i + batchIdx;
            setUploadProgress((prev) => ({
              ...prev,
              currentFileName: `${fileIdx + 1} of ${fileArray.length}`,
            }));

            const image = await uploadFile(file, (percentage) => {
              fileProgressMap.set(fileIdx, percentage);
              updateOverallProgress();
            });
            return image;
          });

          const batchResults = await Promise.all(batchPromises);
          uploadedImages.push(...batchResults);
        }
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
      setUploadProgress({ current: 0, total: 0, percentage: 0, currentFileName: '' });
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [uploads, maxFiles, disabled]
  );
  /* eslint-enable react-hooks/exhaustive-deps */

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

      const newUploads = uploads.filter((img) => img.id !== imageId);
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
      const newUploads = uploads.map((img) => ({
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
            <div className={styles.progressContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>
            <div className={styles.progressInfo}>
              <span className={styles.progressPercentage}>{uploadProgress.percentage}%</span>
              <span className={styles.progressText}>
                {uploadProgress.total > 1
                  ? `Uploading ${uploadProgress.currentFileName}`
                  : 'Uploading...'}
              </span>
            </div>
          </div>
        ) : compact ? (
          <div className={styles.dropContentCompact}>
            <svg
              className={styles.uploadIconCompact}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div className={styles.dropTextCompact}>
              <span className={styles.dropTextMain}>
                {dragActive ? 'Drop files here' : 'Tap to upload photos or videos'}
              </span>
              <span className={styles.dropTextSub}>JPEG, PNG, WebP, GIF, MP4, WebM • Max 25MB</span>
            </div>
          </div>
        ) : (
          <div className={styles.dropContent}>
            <svg
              className={styles.uploadIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
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
            <span className={styles.dropHint}>MP4, WebM, MOV • Max 50MB per video</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.error}>
          <span className={styles.errorText}>{error}</span>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={() => {
              setError(null);
              fileInputRef.current?.click();
            }}
          >
            Try Again
          </button>
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
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
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
                  {media.is_primary && <span className={styles.primaryBadge}>Hero</span>}
                  {isVideo && <span className={styles.videoBadge}>Video</span>}

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
