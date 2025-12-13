/**
 * CarImage Component
 * 
 * Displays car images with graceful fallback to styled placeholders.
 * Used across CarDetail, PerformanceHub, Advisory cards, etc.
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getCarHeroImage, getCarThumbnail, getCarGarageImage, getPlaceholderGradient } from '@/lib/images.js';
import styles from './CarImage.module.css';

/**
 * @typedef {Object} CarImageProps
 * @property {Object} car - Car object with name, slug, imageHeroUrl, etc.
 * @property {'hero' | 'thumbnail' | 'card' | 'garage'} [variant='hero'] - Image size variant
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
  const [usingFallback, setUsingFallback] = useState(false);
  
  // Reset error state when car changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
    setUsingFallback(false);
  }, [car?.slug]);
  
  // Get image URL based on variant
  const getImageUrl = () => {
    if (variant === 'thumbnail' || variant === 'card') {
      return getCarThumbnail(car);
    }
    // For garage variant, try exclusive garage image first
    if (variant === 'garage') {
      const garageImage = getCarGarageImage(car);
      // If we're using fallback (garage image failed), use hero instead
      if (usingFallback || !garageImage) {
        return getCarHeroImage(car);
      }
      return garageImage;
    }
    return getCarHeroImage(car);
  };
  
  const imageUrl = getImageUrl();
  // Show placeholder only if no image URL or image failed to load
  const showPlaceholder = imageError || !imageUrl;
  
  // Handle image load error
  const handleError = () => {
    // For garage variant, try fallback to hero image before showing placeholder
    if (variant === 'garage' && !usingFallback) {
      setUsingFallback(true);
      return;
    }
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
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={car?.name || 'Car image'}
          fill
          className={`${styles.image} ${imageLoaded ? styles.loaded : ''}`}
          onError={handleError}
          onLoad={handleLoad}
          priority={!lazy}
          // Mobile-optimized sizes: load smaller images on smaller screens
          sizes={
            variant === 'hero' || variant === 'garage'
              ? '(max-width: 480px) 100vw, (max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw'
              : variant === 'card' 
                ? '(max-width: 480px) 100vw, (max-width: 768px) 50vw, 400px'
                : '(max-width: 480px) 50vw, (max-width: 768px) 33vw, 200px'
          }
          quality={variant === 'garage' ? 90 : 75}
          style={{ objectFit: 'cover' }}
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

