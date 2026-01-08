'use client';

/**
 * Image Uploader Component
 * 
 * Drag-and-drop image upload with preview.
 * Uploads to /api/uploads endpoint.
 */

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from './ImageUploader.module.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ImageUploader({ 
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
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
      return `Invalid file type. Allowed: JPEG, PNG, WebP, GIF`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: 10MB`;
    }
    return null;
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    if (vehicleId) formData.append('vehicleId', vehicleId);
    if (buildId) formData.append('buildId', buildId);
    formData.append('isPrimary', uploads.length === 0 ? 'true' : 'false');

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
              {dragActive ? 'Drop images here' : 'Drag & drop images or click to browse'}
            </span>
            <span className={styles.dropHint}>
              JPEG, PNG, WebP, GIF • Max {maxFiles} images • 10MB each
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

      {/* Image Previews */}
      {uploads.length > 0 && (
        <div className={styles.previews}>
          {uploads.map((image, index) => (
            <div 
              key={image.id || index} 
              className={`${styles.preview} ${image.is_primary ? styles.primary : ''}`}
            >
              <Image
                src={image.blob_url || image.thumbnail_url}
                alt={image.caption || `Upload ${index + 1}`}
                width={120}
                height={80}
                className={styles.previewImage}
              />
              
              <div className={styles.previewOverlay}>
                {image.is_primary && (
                  <span className={styles.primaryBadge}>Primary</span>
                )}
                
                <div className={styles.previewActions}>
                  {!image.is_primary && (
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(image.id);
                      }}
                      title="Set as primary"
                    >
                      ⭐
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(image.id);
                    }}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
          
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

