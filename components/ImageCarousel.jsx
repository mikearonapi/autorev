/**
 * ImageCarousel Component
 * 
 * Auto-rotating image carousel with smooth dissolve transitions.
 * Default: 2s display + 0.8s fade transition.
 */

'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

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

