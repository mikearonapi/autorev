/**
 * ImageCarousel Component
 * 
 * Auto-rotating image carousel with smooth dissolve transitions.
 * Default: 2s display + 0.8s fade transition.
 * 
 * Performance optimizations:
 * - Only renders current + next image (not all)
 * - Uses IntersectionObserver to start timer only when visible
 * - Preloads next image before transition
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
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval, isVisible]);

  // Preload next image before transition
  useEffect(() => {
    if (images.length <= 1) return;
    const nextIndex = (currentIndex + 1) % images.length;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = images[nextIndex];
    document.head.appendChild(link);
    return () => link.parentNode?.removeChild(link);
  }, [currentIndex, images]);

  if (!images || images.length === 0) {
    return null;
  }

  // Only render current and next images for performance
  const nextIndex = (currentIndex + 1) % images.length;
  const indicesToRender = images.length > 1 ? [currentIndex, nextIndex] : [0];

  return (
    <div className={styles.carousel} ref={containerRef}>
      {indicesToRender.map((idx, renderOrder) => (
        <div
          key={images[idx]}
          className={`${styles.imageWrapper} ${
            idx === currentIndex ? styles.active : styles.inactive
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
            priority={renderOrder === 0 && currentIndex === 0}
            loading={renderOrder === 0 ? 'eager' : 'lazy'}
          />
        </div>
      ))}
    </div>
  );
}

