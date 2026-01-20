/**
 * AdvancedImageCarousel Component
 * 
 * Auto-rotating image carousel with per-image display control.
 * Each image shows for its specified duration, THEN transitions.
 * 
 * Performance optimizations:
 * - Only renders prev + current + next image (not all)
 * - Uses IntersectionObserver to start timer only when visible
 * - Preloads next image before transition
 * 
 * Crossfade implementation:
 * - Previous image fades OUT while current fades IN simultaneously
 * - This prevents the "flash to black" that occurs when only rendering 2 images
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import styles from './ImageCarousel.module.css';

/**
 * @typedef {Object} AdvancedImageCarouselProps
 * @property {string[]} images - Array of image paths to cycle through
 * @property {string} alt - Alt text for images
 * @property {number[]} displayDurations - How long each image shows (in ms) BEFORE transition starts
 * @property {number} [transitionDuration=3000] - Duration of fade transition in ms
 */

/**
 * @param {AdvancedImageCarouselProps} props
 */
export default function AdvancedImageCarousel({ 
  images, 
  alt,
  displayDurations,
  transitionDuration = 3000
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  // Only start carousel timer when visible in viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Auto-advance when visible
  useEffect(() => {
    if (images.length <= 1 || !isVisible) return;

    // Get the display duration for the current image
    // If displayDurations array is shorter than images, use the last duration
    const currentDuration = displayDurations[currentIndex] || displayDurations[displayDurations.length - 1];

    // Total time = display duration + transition duration
    const totalTime = currentDuration + transitionDuration;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => {
        setPrevIndex(prev); // Track previous for crossfade
        return (prev + 1) % images.length;
      });
    }, totalTime);

    return () => clearTimeout(timer);
  }, [images.length, displayDurations, transitionDuration, currentIndex, isVisible]);

  // Preload next image before transition
  useEffect(() => {
    if (images.length <= 1) return;
    const nextIdx = (currentIndex + 1) % images.length;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = images[nextIdx];
    document.head.appendChild(link);
    return () => {
      // Safe cleanup - check both link and parentNode exist
      if (link && link.parentNode) {
        try {
          link.parentNode.removeChild(link);
        } catch (e) {
          // Ignore - element may have been removed by HMR or browser extension
        }
      }
    };
  }, [currentIndex, images]);

  if (!images || images.length === 0) {
    return null;
  }

  // Render prev (fading out) + current (fading in) + next (preloaded)
  // This ensures smooth crossfade: old image fades out while new fades in
  const nextIdx = (currentIndex + 1) % images.length;
  const indicesToRender = new Set([currentIndex, nextIdx]);
  if (prevIndex !== null && prevIndex !== currentIndex) {
    indicesToRender.add(prevIndex);
  }

  return (
    <div className={styles.carousel} ref={containerRef}>
      {[...indicesToRender].map((idx) => {
        const isActive = idx === currentIndex;
        
        return (
          <div
            key={images[idx]}
            className={`${styles.imageWrapper} ${
              isActive ? styles.active : styles.inactive
            }`}
            style={{
              transition: `opacity ${transitionDuration / 1000}s ease-in-out`
            }}
          >
            <Image
              src={images[idx]}
              alt={`${alt} - Image ${idx + 1}`}
              fill
              sizes="390px"
              className={styles.image}
              // Only first image on initial render gets priority
              priority={isActive && currentIndex === 0 && prevIndex === null}
              loading={isActive ? 'eager' : 'lazy'}
            />
          </div>
        );
      })}
    </div>
  );
}

