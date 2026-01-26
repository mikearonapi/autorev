'use client';

/**
 * Build Media Gallery Component
 * 
 * A beautiful gallery for displaying build photos and videos with:
 * - Single hero image selection via tap/click on gallery images
 * - Grid layout with lightbox view
 * - Video playback support
 * - Mobile-responsive design
 * 
 * The hero image selected here will display at the top of the Upgrade Center
 * and in Projects/Community Builds.
 */

import React, { useState, useCallback } from 'react';

import Image from 'next/image';

import { Icons } from '@/components/ui/Icons';
import { getCarHeroImage } from '@/lib/images';

import styles from './BuildMediaGallery.module.css';

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
 * 
 * Simplified: Hero selection happens directly in the gallery.
 * Tap any image to set it as your hero (displayed at top of Upgrade Center).
 * Includes stock image option so users can switch back from their uploads.
 */
export default function BuildMediaGallery({
  car,
  media = [],
  onVideoClick,
  onSetPrimary,
  onSetStockHero,
  readOnly = false,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Get stock image URL
  const stockImageUrl = car ? getCarHeroImage(car) : null;
  
  // Filter images only (not videos)
  const uploadedImages = media.filter(m => m.media_type !== 'video');
  
  // Check if stock is currently the hero (no uploaded image has is_primary)
  const isStockHero = !uploadedImages.some(img => img.is_primary);

  const handleOpenLightbox = useCallback((index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const handleCloseLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  // Total items for lightbox (includes stock image if available)
  const lightboxTotal = media.length + (car && getCarHeroImage(car) ? 1 : 0);
  
  const handlePrevious = useCallback(() => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxTotal - 1));
  }, [lightboxTotal]);

  const handleNext = useCallback(() => {
    setLightboxIndex((prev) => (prev < lightboxTotal - 1 ? prev + 1 : 0));
  }, [lightboxTotal]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') handleCloseLightbox();
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
  }, [handleCloseLightbox, handlePrevious, handleNext]);

  // Set an image as hero (is_primary in DB)
  const handleSetHero = useCallback((e, imageId) => {
    e.stopPropagation(); // Don't open lightbox
    if (readOnly) return;
    if (onSetPrimary) onSetPrimary(imageId);
  }, [readOnly, onSetPrimary]);
  
  // Set stock image as hero (clear is_primary on all uploaded images)
  const handleSetStockHero = useCallback((e) => {
    e.stopPropagation();
    if (readOnly) return;
    if (onSetStockHero) onSetStockHero();
  }, [readOnly, onSetStockHero]);

  // Don't render if no media and no stock image
  if (media.length === 0 && !stockImageUrl) return null;

  // Total count includes stock image
  const totalCount = media.length + (stockImageUrl ? 1 : 0);

  return (
    <div className={styles.gallery}>
      {/* Media Grid with Hero Selection */}
      <div className={styles.mediaSection}>
        <h4 className={styles.sectionTitle}>
          <Icons.image />
          Gallery ({totalCount})
        </h4>
        {!readOnly && (
          <p className={styles.sectionHint}>
            Tap an image to set it as your hero (shown at top)
          </p>
        )}
        
        <div className={styles.mediaGrid}>
          {/* Stock Image - Always first */}
          {stockImageUrl && (
            <div
              className={`${styles.mediaItem} ${styles.stockItem} ${isStockHero ? styles.heroItem : ''}`}
              onClick={() => handleOpenLightbox(0)}
            >
              <Image
                src={stockImageUrl}
                alt={car?.name ? `${car.name} - Stock Photo` : 'Stock Photo'}
                fill
                style={{ objectFit: 'cover' }}
              />
              <span className={styles.stockLabel}>Stock</span>
              
              {/* Hero badge or Set as Hero button */}
              {isStockHero ? (
                <span className={styles.primaryBadge}>
                  <Icons.star />
                  Hero
                </span>
              ) : !readOnly && (
                <button
                  type="button"
                  className={styles.setHeroBtn}
                  onClick={handleSetStockHero}
                  title="Use stock image as hero"
                >
                  <Icons.star />
                  Set as Hero
                </button>
              )}
            </div>
          )}
          
          {/* User Uploaded Media */}
          {media.map((item, index) => {
            const isVideo = item.media_type === 'video';
            const isHero = item.is_primary && !isVideo;
            // Offset lightbox index by 1 if stock image exists
            const lightboxIdx = stockImageUrl ? index + 1 : index;
            
            return (
              <div
                key={item.id}
                className={`${styles.mediaItem} ${isVideo ? styles.videoItem : ''} ${isHero ? styles.heroItem : ''}`}
                onClick={() => isVideo ? onVideoClick?.(item) : handleOpenLightbox(lightboxIdx)}
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
                  <>
                    <Image
                      src={item.blob_url || item.thumbnail_url}
                      alt={item.caption || `Image ${index + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    
                    {/* Hero badge or Set as Hero button */}
                    {isHero ? (
                      <span className={styles.primaryBadge}>
                        <Icons.star />
                        Hero
                      </span>
                    ) : !readOnly && (
                      <button
                        type="button"
                        className={styles.setHeroBtn}
                        onClick={(e) => handleSetHero(e, item.id)}
                        title="Set as hero image"
                      >
                        <Icons.star />
                        Set as Hero
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox - includes stock image at index 0 if available */}
      {lightboxOpen && totalCount > 0 && (
        <div 
          className={styles.lightbox} 
          onClick={handleCloseLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <button className={styles.lightboxClose} onClick={handleCloseLightbox}>
            <Icons.x />
          </button>
          
          {totalCount > 1 && (
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
            {/* Stock image is at index 0, user media starts at index 1 */}
            {stockImageUrl && lightboxIndex === 0 ? (
              <Image
                src={stockImageUrl}
                alt={car?.name ? `${car.name} - Stock Photo` : 'Stock Photo'}
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            ) : (() => {
              const mediaIdx = stockImageUrl ? lightboxIndex - 1 : lightboxIndex;
              const item = media[mediaIdx];
              return item?.media_type === 'video' ? (
                <video
                  src={item.blob_url}
                  controls
                  autoPlay
                  className={styles.lightboxVideo}
                />
              ) : (
                <Image
                  src={item?.blob_url || item?.thumbnail_url}
                  alt={item?.caption || 'Image'}
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                />
              );
            })()}
            
            {/* Counter positioned inside content for image-relative placement */}
            {totalCount > 1 && (
              <div className={styles.lightboxCounter}>
                {lightboxIndex + 1} / {totalCount}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
