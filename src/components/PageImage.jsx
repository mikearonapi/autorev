/**
 * PageImage Component
 * 
 * Displays page-level images (hero backgrounds, section images) with
 * graceful fallback to styled placeholders.
 */

import React, { useState } from 'react';
import { getPageImage, getPlaceholderGradient } from '../lib/images.js';
import styles from './PageImage.module.css';

/**
 * @typedef {Object} PageImageProps
 * @property {string} imageKey - Key from PAGE_IMAGE_PATHS
 * @property {string} [alt] - Alt text for the image
 * @property {'hero' | 'section' | 'background'} [variant='section'] - Display variant
 * @property {string} [className] - Additional CSS class
 * @property {string} [placeholderText] - Text to show on placeholder
 * @property {string} [placeholderVariant='primary'] - Gradient variant
 * @property {React.ReactNode} [children] - Content to overlay on image
 */

export default function PageImage({ 
  imageKey,
  alt = '',
  variant = 'section',
  className = '',
  placeholderText = '',
  placeholderVariant = 'primary',
  children,
}) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const imageUrl = getPageImage(imageKey);
  const showPlaceholder = !imageUrl || imageError;
  
  // Get placeholder gradient
  const placeholderStyle = getPlaceholderGradient(imageKey || 'default', placeholderVariant);
  
  // Variant-specific classes
  const variantClass = styles[variant] || styles.section;
  
  return (
    <div className={`${styles.container} ${variantClass} ${className}`}>
      {/* Placeholder (always rendered, fades out when image loads) */}
      <div 
        className={`${styles.placeholder} ${!showPlaceholder && imageLoaded ? styles.hidden : ''}`}
        style={placeholderStyle}
      >
        {placeholderText && (
          <span className={styles.placeholderText}>{placeholderText}</span>
        )}
        <div className={styles.placeholderOverlay} />
        <div className={styles.placeholderPattern} />
      </div>
      
      {/* Actual image (if available) */}
      {imageUrl && !showPlaceholder && (
        <img
          src={imageUrl}
          alt={alt}
          className={`${styles.image} ${imageLoaded ? styles.loaded : ''}`}
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
          loading={variant === 'hero' ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
      
      {/* Content overlay */}
      {children && (
        <div className={styles.content}>
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Hero variant with built-in overlay gradient
 */
export function HeroImage({ imageKey, alt, className = '', children }) {
  return (
    <PageImage
      imageKey={imageKey}
      alt={alt}
      variant="hero"
      className={className}
      placeholderVariant="primary"
    >
      {children}
    </PageImage>
  );
}

/**
 * Background variant (full bleed, behind content)
 */
export function BackgroundImage({ imageKey, alt, className = '', children }) {
  return (
    <PageImage
      imageKey={imageKey}
      alt={alt}
      variant="background"
      className={className}
      placeholderVariant="neutral"
    >
      {children}
    </PageImage>
  );
}

