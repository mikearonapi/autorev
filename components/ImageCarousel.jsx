/**
 * ImageCarousel Component
 * 
 * Auto-rotating image carousel with smooth crossfade/dissolve transitions.
 * Default: 2s display + 0.8s fade transition.
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
 * @typedef {Object} ImageCarouselProps
 * @property {string[]} images - Array of image paths to cycle through
 * @property {string} alt - Alt text for images
 * @property {number} [interval=2800] - Time in ms between transitions (default 2.8 seconds)
 */

/**
 * @param {ImageCarouselProps} props
 */
export default function ImageCarousel({ 
  images, 
  alt,
  interval = 2800 // 2.8 seconds total: 2s visible + 0.8s transition
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

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        setPrevIndex(prev); // Track previous for crossfade
        return (prev + 1) % images.length;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval, isVisible]);

  // Preload next image before transition
  useEffect(() => {
    if (images.length <= 1) return;
    const nextIdx = (currentIndex + 1) % images.length;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = images[nextIdx];
    document.head.appendChild(link);
    return () => link.parentNode?.removeChild(link);
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
          >
            <Image
              src={images[idx]}
              alt={`${alt} - Image ${idx + 1}`}
              fill
              // Responsive sizes: phone frames are ~200px on mobile, ~300px on desktop
              sizes="(max-width: 768px) 200px, 300px"
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

