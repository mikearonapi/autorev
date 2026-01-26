/**
 * CarImage Component
 * 
 * Displays car images with graceful fallback to styled placeholders.
 * Used across CarDetail, PerformanceHub, Advisory cards, etc.
 * 
 * Performance optimizations:
 * - Uses placeholder="blur" with generated blurDataURL for instant visual feedback
 * - Priority images use fetchPriority="high" for faster loading
 * - Fast opacity transition for snappy load feel
 */

'use client';

import { useState, useEffect, useMemo } from 'react';

import Image from 'next/image';

import { getCarHeroImage, getCarThumbnail, getCarGarageImage, getPlaceholderGradient } from '@/lib/images.js';

import styles from './CarImage.module.css';

/**
 * Generate a tiny SVG-based blur placeholder for instant loading
 * This creates a colored gradient that approximates the image
 * @param {string} seed - Seed for deterministic color (e.g., car slug)
 * @returns {string} - Base64 encoded blur data URL
 */
function generateBlurDataURL(seed = 'default') {
  // Generate deterministic colors based on seed
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Create automotive-themed gradient colors (dark blues, grays)
  const hue1 = (hash % 40) + 200; // Blue-ish range (200-240)
  const hue2 = (hash % 30) + 210; // Slightly different blue
  const sat = 30 + (hash % 20); // 30-50% saturation
  const light1 = 15 + (hash % 10); // 15-25% lightness (dark)
  const light2 = 20 + (hash % 15); // 20-35% lightness
  
  const color1 = `hsl(${hue1}, ${sat}%, ${light1}%)`;
  const color2 = `hsl(${hue2}, ${sat}%, ${light2}%)`;
  
  // Create a tiny SVG gradient (10x6 for 16:9 aspect, very small for fast encoding)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 6">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color1}"/>
        <stop offset="100%" style="stop-color:${color2}"/>
      </linearGradient>
    </defs>
    <rect fill="url(#g)" width="10" height="6"/>
  </svg>`;
  
  // Encode to base64 data URL
  const encoded = typeof window !== 'undefined' 
    ? btoa(svg) 
    : Buffer.from(svg).toString('base64');
  
  return `data:image/svg+xml;base64,${encoded}`;
}

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
  
  // Generate blur placeholder for this car (memoized for performance)
  const blurDataURL = useMemo(() => {
    return generateBlurDataURL(car?.slug || 'default');
  }, [car?.slug]);
  
  // Reset error state when car changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
    setUsingFallback(false);
  }, [car?.slug]);
  
  // Timeout to catch hung image loads (10s for initial, 5s for fallback)
  useEffect(() => {
    // Only set timeout if we have an imageUrl and haven't loaded/errored yet
    const imageUrl = variant === 'garage' && !usingFallback 
      ? getCarGarageImage(car)
      : getCarHeroImage(car);
    
    if (!imageUrl || imageLoaded || imageError) return;
    
    const timeoutMs = usingFallback ? 5000 : 10000; // Shorter timeout for fallback
    const timeoutId = setTimeout(() => {
      if (!imageLoaded) {
        // Trigger fallback or error
        if (variant === 'garage' && !usingFallback) {
          setUsingFallback(true);
        } else {
          setImageError(true);
        }
      }
    }, timeoutMs);
    
    return () => clearTimeout(timeoutId);
  }, [car?.slug, variant, usingFallback, imageLoaded, imageError, car]);
  
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
        className={`${styles.placeholder} ${!showPlaceholder && imageLoaded ? styles.hidden : ''} ${imageError ? styles.error : ''}`}
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
          // Use blur placeholder for instant visual feedback
          placeholder="blur"
          blurDataURL={blurDataURL}
          // Mobile-optimized sizes: load appropriately sized images
          sizes={
            variant === 'hero' 
              ? '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px'
              : variant === 'garage'
                ? '(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 800px'
              : variant === 'card' 
                ? '(max-width: 480px) 90vw, (max-width: 768px) 45vw, 400px'
                : '(max-width: 480px) 45vw, (max-width: 768px) 30vw, 200px'
          }
          quality={variant === 'garage' ? 90 : 75}
          style={{ objectFit: 'cover' }}
          // High fetch priority for hero/priority images
          {...(!lazy && { fetchPriority: 'high' })}
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

