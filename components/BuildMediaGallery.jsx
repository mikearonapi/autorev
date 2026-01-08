'use client';

/**
 * Build Media Gallery Component
 * 
 * A beautiful gallery for displaying build photos and videos with:
 * - Hero image selection (stock vs uploaded)
 * - Grid layout with lightbox view
 * - Video playback support
 * - Mobile-responsive design
 */

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import styles from './BuildMediaGallery.module.css';

// Icons
const Icons = {
  play: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <polygon points="8 5 19 12 8 19 8 5" />
    </svg>
  ),
  check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  star: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  x: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  chevronLeft: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  chevronRight: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  image: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
};

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
 * BuildMediaGallery Component
 */
export default function BuildMediaGallery({
  car,
  media = [],
  heroSource = 'stock', // 'stock' or 'uploaded'
  selectedHeroImageId = null,
  onHeroSourceChange,
  onHeroImageSelect,
  onVideoClick,
  onSetPrimary,
  showHeroSelector = true,
  readOnly = false,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Get the stock image URL
  const stockImageUrl = car?.hero_image_url || car?.thumbnail_url || `/images/cars/${car?.slug}.png`;

  // Filter images only (not videos) for hero selection
  const uploadedImages = media.filter(m => m.media_type !== 'video');
  const videos = media.filter(m => m.media_type === 'video');

  // Get the current hero image
  const heroImage = heroSource === 'stock' 
    ? { url: stockImageUrl, type: 'stock' }
    : uploadedImages.find(img => img.id === selectedHeroImageId) || uploadedImages[0] || { url: stockImageUrl, type: 'stock' };

  const handleOpenLightbox = useCallback((index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const handlePrevious = useCallback(() => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
  }, [media.length]);

  const handleNext = useCallback(() => {
    setLightboxIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
  }, [media.length]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') handleCloseLightbox();
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
  }, [handleCloseLightbox, handlePrevious, handleNext]);

  const handleSelectHeroImage = (imageId) => {
    if (readOnly) return;
    if (onHeroSourceChange) onHeroSourceChange('uploaded');
    if (onHeroImageSelect) onHeroImageSelect(imageId);
    if (onSetPrimary) onSetPrimary(imageId);
  };

  const handleSelectStockHero = () => {
    if (readOnly) return;
    if (onHeroSourceChange) onHeroSourceChange('stock');
    if (onHeroImageSelect) onHeroImageSelect(null);
  };

  // Don't render anything if no media and hero selector is hidden
  if (!showHeroSelector && media.length === 0) return null;

  return (
    <div className={styles.gallery}>
      {/* Hero Image Selector */}
      {showHeroSelector && (
        <div className={styles.heroSelector}>
          <h4 className={styles.sectionTitle}>
            <Icons.star />
            Hero Image
          </h4>
          <p className={styles.sectionHint}>
            Choose which image to display as your build's hero
          </p>
          
          <div className={styles.heroOptions}>
            {/* Stock Image Option */}
            <button
              type="button"
              className={`${styles.heroOption} ${heroSource === 'stock' ? styles.heroOptionSelected : ''}`}
              onClick={handleSelectStockHero}
              disabled={readOnly}
            >
              <div className={styles.heroOptionImage}>
                <Image
                  src={stockImageUrl}
                  alt="Stock image"
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className={styles.heroOptionLabel}>
                <span className={styles.heroOptionTitle}>Stock Photo</span>
                {heroSource === 'stock' && (
                  <span className={styles.heroOptionBadge}>
                    <Icons.check />
                    Selected
                  </span>
                )}
              </div>
            </button>

            {/* Uploaded Images as Hero Options */}
            {uploadedImages.map((img) => (
              <button
                key={img.id}
                type="button"
                className={`${styles.heroOption} ${heroSource === 'uploaded' && selectedHeroImageId === img.id ? styles.heroOptionSelected : ''}`}
                onClick={() => handleSelectHeroImage(img.id)}
                disabled={readOnly}
              >
                <div className={styles.heroOptionImage}>
                  <Image
                    src={img.blob_url || img.thumbnail_url}
                    alt={img.caption || 'Uploaded image'}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.heroOptionLabel}>
                  <span className={styles.heroOptionTitle}>Your Photo</span>
                  {heroSource === 'uploaded' && selectedHeroImageId === img.id && (
                    <span className={styles.heroOptionBadge}>
                      <Icons.check />
                      Selected
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Media Grid */}
      {media.length > 0 && (
        <div className={styles.mediaSection}>
          <h4 className={styles.sectionTitle}>
            <Icons.image />
            Gallery ({media.length})
          </h4>
          
          <div className={styles.mediaGrid}>
            {media.map((item, index) => {
              const isVideo = item.media_type === 'video';
              
              return (
                <div
                  key={item.id}
                  className={`${styles.mediaItem} ${isVideo ? styles.videoItem : ''}`}
                  onClick={() => isVideo ? onVideoClick?.(item) : handleOpenLightbox(index)}
                >
                  {isVideo ? (
                    <div className={styles.videoThumbnail}>
                      {item.video_thumbnail_url ? (
                        <Image
                          src={item.video_thumbnail_url}
                          alt={item.caption || 'Video'}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className={styles.videoPlaceholder}>
                          <Icons.play />
                        </div>
                      )}
                      <div className={styles.playOverlay}>
                        <Icons.play />
                      </div>
                      {item.duration_seconds && (
                        <span className={styles.duration}>
                          {formatDuration(item.duration_seconds)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <Image
                      src={item.blob_url || item.thumbnail_url}
                      alt={item.caption || `Image ${index + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  )}
                  
                  {/* Primary badge */}
                  {item.is_primary && !isVideo && (
                    <span className={styles.primaryBadge}>Hero</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && media.length > 0 && (
        <div 
          className={styles.lightbox} 
          onClick={handleCloseLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <button className={styles.lightboxClose} onClick={handleCloseLightbox}>
            <Icons.x />
          </button>
          
          {media.length > 1 && (
            <>
              <button 
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
              >
                <Icons.chevronLeft />
              </button>
              <button 
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
              >
                <Icons.chevronRight />
              </button>
            </>
          )}
          
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            {media[lightboxIndex]?.media_type === 'video' ? (
              <video
                src={media[lightboxIndex].blob_url}
                controls
                autoPlay
                className={styles.lightboxVideo}
              />
            ) : (
              <Image
                src={media[lightboxIndex]?.blob_url || media[lightboxIndex]?.thumbnail_url}
                alt={media[lightboxIndex]?.caption || 'Image'}
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            )}
          </div>
          
          {media.length > 1 && (
            <div className={styles.lightboxCounter}>
              {lightboxIndex + 1} / {media.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
