'use client';

/**
 * Image Gallery Component
 * 
 * Displays build images in a grid with lightbox for full-size viewing.
 */

import { useState, useCallback, useEffect } from 'react';

import Image from 'next/image';

import styles from './ImageGallery.module.css';

export default function ImageGallery({ images = [], title = 'Gallery', heroImageId = null }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Handle keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          setLightboxIndex(null);
          break;
        case 'ArrowLeft':
          setLightboxIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
          break;
        case 'ArrowRight':
          setLightboxIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, images.length]);

  const handlePrev = useCallback(() => {
    setLightboxIndex(prev => prev > 0 ? prev - 1 : images.length - 1);
  }, [images.length]);

  const handleNext = useCallback(() => {
    setLightboxIndex(prev => prev < images.length - 1 ? prev + 1 : 0);
  }, [images.length]);

  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null;

  return (
    <>
      <div className={styles.gallery}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.grid}>
          {images.map((image, index) => {
            const isHero = image.id === heroImageId || image.is_primary;
            return (
              <button
                key={image.id || index}
                className={`${styles.gridItem} ${isHero ? styles.heroItem : ''}`}
                onClick={() => setLightboxIndex(index)}
                aria-label={`View image ${index + 1}${isHero ? ' (Hero)' : ''}`}
              >
                <Image
                  src={image.blob_url || image.thumbnail_url}
                  alt={image.caption || `Image ${index + 1}`}
                  fill
                  className={styles.gridImage}
                  sizes="(max-width: 640px) 50vw, 200px"
                />
                {isHero && (
                  <span className={styles.heroBadge}>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    Hero
                  </span>
                )}
                <div className={styles.gridOverlay}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="11" y1="8" x2="11" y2="14"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && currentImage && (
        <div className={styles.lightbox} onClick={() => setLightboxIndex(null)}>
          {/* Close Button */}
          <button 
            className={styles.closeBtn}
            onClick={() => setLightboxIndex(null)}
            aria-label="Close lightbox"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          {/* Image Counter */}
          <div className={styles.counter}>
            {lightboxIndex + 1} / {images.length}
          </div>

          {/* Main Image - Full screen */}
          <div className={styles.imageContainer} onClick={(e) => e.stopPropagation()}>
            <Image
              src={currentImage.blob_url}
              alt={currentImage.caption || `Image ${lightboxIndex + 1}`}
              fill
              className={styles.lightboxImage}
              sizes="100vw"
              priority
              quality={90}
            />
          </div>

          {/* Caption */}
          {currentImage.caption && (
            <div className={styles.caption}>{currentImage.caption}</div>
          )}

          {/* Navigation */}
          {images.length > 1 && (
            <>
              <button
                className={`${styles.navBtn} ${styles.prevBtn}`}
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                aria-label="Previous image"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <button
                className={`${styles.navBtn} ${styles.nextBtn}`}
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                aria-label="Next image"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </>
          )}

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className={styles.thumbnails} onClick={(e) => e.stopPropagation()}>
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  className={`${styles.thumbnail} ${idx === lightboxIndex ? styles.active : ''}`}
                  onClick={() => setLightboxIndex(idx)}
                >
                  <Image
                    src={img.thumbnail_url || img.blob_url}
                    alt=""
                    fill
                    className={styles.thumbImage}
                    sizes="60px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

