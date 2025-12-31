'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import IPhoneFrame from '../../IPhoneFrame';
import styles from './FeatureSlide.module.css';

/**
 * FeatureSlide Component
 * 
 * A simple, reusable template for showcasing a single feature during onboarding.
 * Shows: title + description + iPhone frame with auto-rotating screenshots
 * 
 * Features:
 * - Auto-rotates through images every 1.5 seconds with smooth dissolve
 * - Swipe support for manual navigation
 * - Pauses auto-rotation on user interaction
 * - Swipe hint animation below iPhone frame
 * 
 * @param {string} title - Feature title (e.g., "Browse & Research")
 * @param {string} description - Short, punchy description
 * @param {Array} images - Array of { src, alt } objects for the screenshots
 * @param {string} className - Animation class from parent
 */
export default function FeatureSlide({ 
  title, 
  description, 
  images = [],
  className 
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const autoPlayRef = useRef(null);
  const pauseTimeoutRef = useRef(null);

  // Minimum swipe distance to trigger navigation (in pixels)
  const minSwipeDistance = 50;

  // Reset to first image when navigating to a new feature
  useEffect(() => {
    setCurrentIndex(0);
    setIsPaused(false);
  }, [images]);

  // Auto-rotation logic - 1.5s display time
  useEffect(() => {
    if (images.length <= 1 || isPaused) {
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 1500);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [images.length, isPaused]);

  // Pause auto-rotation temporarily after user interaction
  const pauseAutoPlay = useCallback(() => {
    setIsPaused(true);
    
    // Clear any existing timeout
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    
    // Resume after 5 seconds of no interaction
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 5000);
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  // Touch handlers for swipe
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      // Swipe left = next image
      setCurrentIndex((prev) => (prev + 1) % images.length);
      pauseAutoPlay();
    } else if (isRightSwipe) {
      // Swipe right = previous image
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      pauseAutoPlay();
    }
  };

  // Go to specific image
  const goToImage = (index) => {
    setCurrentIndex(index);
    pauseAutoPlay();
  };

  const hasMultipleImages = images.length > 1;

  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Feature Title & Description */}
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
      </div>

      {/* iPhone Frame with Screenshot Carousel */}
      <div 
        className={styles.phoneWrapper}
        onTouchStart={hasMultipleImages ? onTouchStart : undefined}
        onTouchMove={hasMultipleImages ? onTouchMove : undefined}
        onTouchEnd={hasMultipleImages ? onTouchEnd : undefined}
      >
        <IPhoneFrame size="small">
          {/* Stacked images with dissolve transition */}
          <div className={styles.carousel}>
            {images.map((image, index) => (
              <div
                key={image.src}
                className={`${styles.imageWrapper} ${
                  index === currentIndex ? styles.active : styles.inactive
                }`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  style={{ objectFit: 'cover', objectPosition: 'top' }}
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        </IPhoneFrame>
      </div>

      {/* Swipe Hint & Dots - Only show for multiple images */}
      {hasMultipleImages && (
        <div className={styles.navigation}>
          {/* Indicator Dots */}
          <div className={styles.dots}>
            {images.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${index === currentIndex ? styles.dotActive : ''}`}
                onClick={() => goToImage(index)}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

          {/* Swipe Hint */}
          <div className={styles.swipeHint}>
            <span className={styles.swipeIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 8l-4 4 4 4"/>
                <path d="M10 8l-4 4 4 4"/>
              </svg>
            </span>
            <span className={styles.swipeText}>Swipe to preview</span>
            <span className={styles.swipeIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 16l4-4-4-4"/>
                <path d="M14 16l4-4-4-4"/>
              </svg>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
