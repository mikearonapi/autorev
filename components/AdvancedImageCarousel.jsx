/**
 * AdvancedImageCarousel Component
 * 
 * Auto-rotating image carousel with per-image interval control.
 * Allows different display durations for each image in the sequence.
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './ImageCarousel.module.css';

/**
 * @typedef {Object} AdvancedImageCarouselProps
 * @property {string[]} images - Array of image paths to cycle through
 * @property {string} alt - Alt text for images
 * @property {number[]} intervals - Array of intervals (in ms) for each image. If shorter than images array, last interval is used for remaining images.
 * @property {number} [transitionDuration=3000] - Duration of fade transition in ms
 */

/**
 * @param {AdvancedImageCarouselProps} props
 */
export default function AdvancedImageCarousel({ 
  images, 
  alt,
  intervals,
  transitionDuration = 3000
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    // Get the interval for the current image
    // If intervals array is shorter than images, use the last interval
    const currentInterval = intervals[currentIndex] || intervals[intervals.length - 1];

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, currentInterval);

    return () => clearTimeout(timer);
  }, [images.length, intervals, currentIndex]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={styles.carousel}>
      {images.map((image, index) => (
        <div
          key={image}
          className={`${styles.imageWrapper} ${
            index === currentIndex ? styles.active : styles.inactive
          }`}
          style={{
            transition: `opacity ${transitionDuration / 1000}s ease-in-out`
          }}
        >
          <Image
            src={image}
            alt={`${alt} - Image ${index + 1}`}
            fill
            sizes="390px"
            className={styles.image}
            priority={index === 0}
          />
        </div>
      ))}
    </div>
  );
}

