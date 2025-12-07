/**
 * CarImage Component
 * 
 * Displays car images with graceful fallback to styled placeholders.
 * Used across CarDetail, PerformanceHub, Advisory cards, etc.
 */

'use client';

import { useState, useEffect } from 'react';
import { getCarHeroImage, getCarThumbnail, shouldShowPlaceholder, getPlaceholderGradient } from '@/lib/images.js';
import styles from './CarImage.module.css';

/**
 * @typedef {Object} CarImageProps
 * @property {Object} car - Car object with name, slug, imageHeroUrl, etc.
 * @property {'hero' | 'thumbnail' | 'card'} [variant='hero'] - Image size variant
 * @property {string} [className] - Additional CSS class
 * @property {boolean} [showName=true] - Show car name on placeholder
 * @property {boolean} [lazy=true] - Use lazy loading
 */

export default function CarImage({ 
  car, 
  variant = 'hero',
  className = '',
  showName = true,
  lazy = true,
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Reset error state when car changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [car?.slug]);
  
  // Get image URL based on variant
  const getImageUrl = () => {
    if (variant === 'thumbnail' || variant === 'card') {
      return getCarThumbnail(car);
    }
    return getCarHeroImage(car);
  };
  
  const imageUrl = getImageUrl();
  const showPlaceholder = shouldShowPlaceholder(car) || imageError || !imageUrl;
  
  // Handle image load error
  const handleError = () => {
    setImageError(true);
  };
  
  // Handle image load success
  const handleLoad = () => {
    setImageLoaded(true);
  };
  
  // Get placeholder gradient based on car
  const placeholderStyle = getPlaceholderGradient(car?.slug || 'default', 'primary');
  
  // Variant-specific classes
  const variantClass = styles[variant] || styles.hero;
  
  return (
    <div className={`${styles.container} ${variantClass} ${className}`}>
      {/* Placeholder (always rendered, fades out when image loads) */}
      <div 
        className={`${styles.placeholder} ${!showPlaceholder && imageLoaded ? styles.hidden : ''}`}
        style={placeholderStyle}
      >
        {showName && (
          <div className={styles.placeholderContent}>
            <span className={styles.placeholderText}>{car?.name || 'Loading...'}</span>
            {car?.years && variant === 'hero' && (
              <span className={styles.placeholderSubtext}>{car.years}</span>
            )}
          </div>
        )}
        
        {/* Decorative elements */}
        <div className={styles.placeholderOverlay} />
        <div className={styles.placeholderGrid} />
      </div>
      
      {/* Actual image (if available) */}
      {imageUrl && !showPlaceholder && (
        <img
          src={imageUrl}
          alt={car?.name || 'Car image'}
          className={`${styles.image} ${imageLoaded ? styles.loaded : ''}`}
          onError={handleError}
          onLoad={handleLoad}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
        />
      )}
    </div>
  );
}

/**
 * Lightweight thumbnail version for lists and cards
 */
export function CarThumbnail({ car, className = '' }) {
  return (
    <CarImage 
      car={car} 
      variant="thumbnail" 
      className={className}
      showName={false}
      lazy={true}
    />
  );
}

/**
 * Card-sized image for recommendation cards
 */
export function CarCardImage({ car, className = '' }) {
  return (
    <CarImage 
      car={car} 
      variant="card" 
      className={className}
      showName={true}
      lazy={true}
    />
  );
}

