/**
 * AdvancedImageCarousel Component
 * 
 * Auto-rotating image carousel with per-image display control.
 * Each image shows for its specified duration, THEN transitions.
 */

'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (images.length <= 1) return;

    // Get the display duration for the current image
    // If displayDurations array is shorter than images, use the last duration
    const currentDuration = displayDurations[currentIndex] || displayDurations[displayDurations.length - 1];

    // Total time = display duration + transition duration
    const totalTime = currentDuration + transitionDuration;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, totalTime);

    return () => clearTimeout(timer);
  }, [images.length, displayDurations, transitionDuration, currentIndex]);

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

