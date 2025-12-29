/**
 * ImageCarousel Component
 * 
 * Auto-rotating image carousel with smooth dissolve transitions.
 * Cycles through images every 3 seconds with fade effect.
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './ImageCarousel.module.css';

/**
 * @typedef {Object} ImageCarouselProps
 * @property {string[]} images - Array of image paths to cycle through
 * @property {string} alt - Alt text for images
 * @property {number} [interval=3000] - Time in ms between transitions (default 3 seconds)
 */

/**
 * @param {ImageCarouselProps} props
 */
export default function ImageCarousel({ 
  images, 
  alt,
  interval = 6000 // 6 seconds total: 3s visible + 3s transition
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

