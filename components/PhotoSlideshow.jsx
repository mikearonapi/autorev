'use client';

/**
 * Photo Slideshow Component
 *
 * Fullscreen immersive slideshow for vehicle photos with:
 * - Auto-advance every 5 seconds (configurable)
 * - Manual navigation (arrows, keyboard, touch swipe)
 * - Progress indicator
 * - Pause on hover/interaction
 * - Beautiful transitions
 *
 * @module components/PhotoSlideshow
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';

import Image from 'next/image';

import { Icons } from '@/components/ui/Icons';

import styles from './PhotoSlideshow.module.css';

// Default auto-advance interval (5 seconds)
const DEFAULT_INTERVAL = 5000;

/**
 * PhotoSlideshow Component
 *
 * @param {Object} props
 * @param {Array} props.images - Array of image objects with blob_url, caption, etc.
 * @param {boolean} props.isOpen - Whether slideshow is visible
 * @param {Function} props.onClose - Called when slideshow should close
 * @param {number} props.startIndex - Initial image index (default: 0)
 * @param {number} props.interval - Auto-advance interval in ms (default: 5000)
 */
export default function PhotoSlideshow({
  images = [],
  isOpen = false,
  onClose,
  startIndex = 0,
  interval = DEFAULT_INTERVAL,
}) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);
  const timerRef = useRef(null);

  // Reset to start index when slideshow opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, startIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose?.();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case ' ':
          e.preventDefault();
          setIsPaused((p) => !p);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onClose, images.length]);

  // Auto-advance timer
  useEffect(() => {
    if (!isOpen || isPaused || images.length <= 1) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    // Reset progress when moving to a new image
    setProgress(0);
    const startTime = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / interval) * 100, 100);
      setProgress(newProgress);

      if (elapsed >= interval) {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }
    }, 50); // Update progress every 50ms for smooth animation

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen, isPaused, currentIndex, images.length, interval]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setProgress(0);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setProgress(0);
  }, [images.length]);

  const goToIndex = useCallback((index) => {
    setCurrentIndex(index);
    setProgress(0);
  }, []);

  // Handle touch swipe
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // Minimum swipe distance

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext(); // Swipe left -> next
      } else {
        goToPrevious(); // Swipe right -> previous
      }
    }
  };

  if (!isOpen || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];
  const isVideo = currentImage?.media_type === 'video';

  return (
    <div
      className={styles.slideshow}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar - Controls */}
      <div className={styles.topBar}>
        <div className={styles.counter}>
          {currentIndex + 1} / {images.length}
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.controlBtn}
            onClick={() => setIsPaused((p) => !p)}
            title={isPaused ? 'Play (Space)' : 'Pause (Space)'}
          >
            {isPaused ? <Icons.play size={20} /> : <Icons.pause size={20} />}
          </button>
          <button type="button" className={styles.closeBtn} onClick={onClose} title="Close (Esc)">
            <Icons.x size={24} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {images.length > 1 && (
        <div className={styles.progressBar}>
          <div
            ref={progressRef}
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Main Image */}
      <div className={styles.imageContainer}>
        {isVideo ? (
          <video
            src={currentImage.blob_url}
            controls
            autoPlay
            className={styles.video}
            onPlay={() => setIsPaused(true)}
            onEnded={goToNext}
          />
        ) : (
          <Image
            src={currentImage.blob_url || currentImage.thumbnail_url}
            alt={currentImage.caption || `Photo ${currentIndex + 1}`}
            fill
            style={{ objectFit: 'contain' }}
            sizes="100vw"
            priority
            quality={95}
          />
        )}
      </div>

      {/* Caption */}
      {currentImage.caption && <div className={styles.caption}>{currentImage.caption}</div>}

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.prevBtn}`}
            onClick={goToPrevious}
            aria-label="Previous photo"
          >
            <Icons.chevronLeft size={32} />
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.nextBtn}`}
            onClick={goToNext}
            aria-label="Next photo"
          >
            <Icons.chevronRight size={32} />
          </button>
        </>
      )}

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className={styles.thumbnailStrip}>
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              className={`${styles.thumbnail} ${idx === currentIndex ? styles.active : ''}`}
              onClick={() => goToIndex(idx)}
              aria-label={`Go to photo ${idx + 1}`}
            >
              <Image
                src={img.thumbnail_url || img.blob_url}
                alt=""
                fill
                style={{ objectFit: 'cover' }}
                sizes="60px"
              />
              {img.is_primary && (
                <span className={styles.heroIndicator}>
                  <Icons.star size={8} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Pause Indicator */}
      {isPaused && images.length > 1 && (
        <div className={styles.pauseIndicator}>
          <Icons.pause size={16} />
          <span>Paused</span>
        </div>
      )}
    </div>
  );
}
