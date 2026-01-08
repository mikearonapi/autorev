'use client';

/**
 * Image Gallery Editor
 * 
 * Component for managing build images with hero selection and reordering.
 */

import { useState, useCallback } from 'react';
import Image from 'next/image';
import ImageUploader from '@/components/ImageUploader';
import styles from './ImageGalleryEditor.module.css';

export default function ImageGalleryEditor({ 
  images = [], 
  onImagesChange, 
  onSetPrimary,
  onDeleteImage,
  maxImages = 10,
  readOnly = false 
}) {
  const [lightboxImage, setLightboxImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const primaryImage = images.find(img => img.is_primary) || images[0];
  const otherImages = images.filter(img => img.id !== primaryImage?.id);

  const handleUploadComplete = useCallback((uploadedImages) => {
    if (onImagesChange) {
      const newImages = uploadedImages.map((img, idx) => ({
        ...img,
        is_primary: images.length === 0 && idx === 0, // First image becomes primary if none exist
      }));
      onImagesChange([...images, ...newImages]);
    }
    setUploading(false);
  }, [images, onImagesChange]);

  const handleSetPrimary = useCallback((imageId) => {
    if (onSetPrimary) {
      onSetPrimary(imageId);
    } else if (onImagesChange) {
      // Local update if no server function provided
      const updated = images.map(img => ({
        ...img,
        is_primary: img.id === imageId,
      }));
      onImagesChange(updated);
    }
  }, [images, onImagesChange, onSetPrimary]);

  const handleDelete = useCallback((imageId) => {
    if (onDeleteImage) {
      onDeleteImage(imageId);
    } else if (onImagesChange) {
      const remaining = images.filter(img => img.id !== imageId);
      // If we deleted the primary, make the first remaining image primary
      if (remaining.length > 0 && !remaining.some(img => img.is_primary)) {
        remaining[0].is_primary = true;
      }
      onImagesChange(remaining);
    }
  }, [images, onImagesChange, onDeleteImage]);

  const remainingSlots = maxImages - images.length;

  return (
    <div className={styles.editor}>
      {/* Hero Image Section */}
      {primaryImage && (
        <div className={styles.heroSection}>
          <div className={styles.sectionHeader}>
            <h4>Hero Image</h4>
            <span className={styles.hint}>This image appears first on your build page</span>
          </div>
          <div 
            className={styles.heroImageWrapper}
            onClick={() => setLightboxImage(primaryImage)}
          >
            <Image
              src={primaryImage.blob_url || primaryImage.thumbnail_url}
              alt="Hero image"
              fill
              className={styles.heroImage}
              sizes="(max-width: 768px) 100vw, 600px"
            />
            <div className={styles.heroOverlay}>
              <span className={styles.heroBadge}>Hero Image</span>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {otherImages.length > 0 && (
        <div className={styles.gallerySection}>
          <div className={styles.sectionHeader}>
            <h4>Gallery Images</h4>
            <span className={styles.hint}>Click an image to set as hero</span>
          </div>
          <div className={styles.galleryGrid}>
            {otherImages.map((image) => (
              <div key={image.id} className={styles.galleryItem}>
                <div 
                  className={styles.galleryImageWrapper}
                  onClick={() => setLightboxImage(image)}
                >
                  <Image
                    src={image.blob_url || image.thumbnail_url}
                    alt={image.caption || 'Build image'}
                    fill
                    className={styles.galleryImage}
                    sizes="200px"
                  />
                </div>
                {!readOnly && (
                  <div className={styles.imageActions}>
                    <button
                      className={styles.setHeroBtn}
                      onClick={() => handleSetPrimary(image.id)}
                      title="Set as hero image"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      Set Hero
                    </button>
                    <button
                      className={styles.deleteImageBtn}
                      onClick={() => handleDelete(image.id)}
                      title="Delete image"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📷</div>
          <h4>No photos yet</h4>
          <p>Add photos to show off your build</p>
        </div>
      )}

      {/* Upload Section */}
      {!readOnly && remainingSlots > 0 && (
        <div className={styles.uploadSection}>
          <div className={styles.sectionHeader}>
            <h4>{images.length > 0 ? 'Add More Photos' : 'Upload Photos'}</h4>
            <span className={styles.hint}>{remainingSlots} of {maxImages} slots remaining</span>
          </div>
          <ImageUploader
            onUploadComplete={handleUploadComplete}
            onUploadError={(err) => console.error('Upload error:', err)}
            onUploadStart={() => setUploading(true)}
            maxFiles={Math.min(remainingSlots, 5)}
            existingImages={[]}
          />
          {uploading && (
            <div className={styles.uploadingOverlay}>
              <div className={styles.spinner} />
              <span>Uploading...</span>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div className={styles.lightbox} onClick={() => setLightboxImage(null)}>
          <button 
            className={styles.lightboxClose}
            onClick={() => setLightboxImage(null)}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightboxImage.blob_url}
              alt={lightboxImage.caption || 'Build image'}
              fill
              className={styles.lightboxImage}
              sizes="90vw"
            />
            {lightboxImage.caption && (
              <div className={styles.lightboxCaption}>{lightboxImage.caption}</div>
            )}
            {!readOnly && !lightboxImage.is_primary && (
              <button
                className={styles.lightboxSetHero}
                onClick={() => {
                  handleSetPrimary(lightboxImage.id);
                  setLightboxImage(null);
                }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                Set as Hero Image
              </button>
            )}
          </div>
          {/* Navigation arrows if multiple images */}
          {images.length > 1 && (
            <>
              <button
                className={`${styles.lightboxNav} ${styles.prev}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = images.findIndex(img => img.id === lightboxImage.id);
                  const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
                  setLightboxImage(images[prevIndex]);
                }}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <button
                className={`${styles.lightboxNav} ${styles.next}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const currentIndex = images.findIndex(img => img.id === lightboxImage.id);
                  const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                  setLightboxImage(images[nextIndex]);
                }}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

