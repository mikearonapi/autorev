/**
 * Image Service Utility
 * 
 * Handles image URLs for the SuperNatural Motorsports site.
 * Images are stored in Vercel Blob and referenced via URLs in Supabase.
 * 
 * This utility provides:
 * - URL builders for different image types
 * - Fallback images for missing assets
 * - Placeholder generation for development
 * - Image optimization helpers
 */

// =============================================================================
// Configuration
// =============================================================================

/**
 * Base URL for Vercel Blob storage
 * Set via environment variable in production
 */
const BLOB_BASE_URL = import.meta.env.VITE_VERCEL_BLOB_URL || '';

/**
 * Whether we're in development mode (no real images)
 */
const IS_DEV = import.meta.env.DEV;

/**
 * Default fallback gradient colors for placeholders
 * These match the brand color system
 */
const PLACEHOLDER_COLORS = {
  primary: ['#1a1a2e', '#16213e', '#0f3460'],
  accent: ['#e94560', '#ff6b6b', '#ffa502'],
  neutral: ['#2d3436', '#4a5568', '#718096'],
};

// =============================================================================
// Image Path Builders
// =============================================================================

/**
 * Standard image paths for cars stored in Vercel Blob
 * Structure: cars/{slug}/{type}.{ext}
 */
export const CAR_IMAGE_PATHS = {
  hero: (slug) => `cars/${slug}/hero.webp`,
  thumbnail: (slug) => `cars/${slug}/thumb.webp`,
  gallery: (slug, index) => `cars/${slug}/gallery-${index}.webp`,
  og: (slug) => `cars/${slug}/og.jpg`, // OpenGraph image
};

/**
 * Standard image paths for page-level images
 * Structure: pages/{page}/{type}.{ext}
 */
export const PAGE_IMAGE_PATHS = {
  // Home page
  homeHero: 'pages/home/hero.webp',
  homeValue: 'pages/home/value-section.webp',
  homeFeature: 'pages/home/feature-car.webp',
  
  // Upgrades page
  upgradesHero: 'pages/upgrades/hero.webp',
  upgradesPitLane: 'pages/upgrades/pit-lane.webp',
  
  // Services page
  servicesHero: 'pages/services/hero.webp',
  servicesWorkshop: 'pages/services/workshop.webp',
  
  // Contact page
  contactHero: 'pages/contact/hero.webp',
  
  // Shared
  trackBackground: 'shared/track-background.webp',
  logoMark: 'shared/logo-mark.svg',
};

// =============================================================================
// URL Builders
// =============================================================================

/**
 * Build the full URL for an image stored in Vercel Blob
 * @param {string} path - Relative path within the blob storage
 * @returns {string|null} - Full URL or null if not available
 */
export function getBlobUrl(path) {
  if (!BLOB_BASE_URL || !path) return null;
  return `${BLOB_BASE_URL}/${path}`;
}

/**
 * Get car hero image URL with fallback chain
 * @param {Object} car - Car object from database/local data
 * @returns {string|null} - Image URL or null for placeholder
 */
export function getCarHeroImage(car) {
  // 1. First try the explicit URL from database
  if (car.imageHeroUrl) {
    return car.imageHeroUrl;
  }
  
  // 2. Try Vercel Blob using slug
  if (car.slug && BLOB_BASE_URL) {
    return getBlobUrl(CAR_IMAGE_PATHS.hero(car.slug));
  }
  
  // 3. No image available - return null for placeholder
  return null;
}

/**
 * Get car thumbnail image URL
 * @param {Object} car - Car object
 * @returns {string|null}
 */
export function getCarThumbnail(car) {
  if (car.imageThumbnailUrl) {
    return car.imageThumbnailUrl;
  }
  
  if (car.slug && BLOB_BASE_URL) {
    return getBlobUrl(CAR_IMAGE_PATHS.thumbnail(car.slug));
  }
  
  // Fallback to hero image if no thumbnail
  return getCarHeroImage(car);
}

/**
 * Get car gallery images
 * @param {Object} car - Car object
 * @returns {string[]} - Array of image URLs
 */
export function getCarGalleryImages(car) {
  // From database JSONB array
  if (car.imageGallery && Array.isArray(car.imageGallery) && car.imageGallery.length > 0) {
    return car.imageGallery;
  }
  
  // No gallery available
  return [];
}

/**
 * Get page-level image URL
 * @param {string} key - Key from PAGE_IMAGE_PATHS
 * @returns {string|null}
 */
export function getPageImage(key) {
  const path = PAGE_IMAGE_PATHS[key];
  if (!path) return null;
  return getBlobUrl(path);
}

// =============================================================================
// Placeholder Generators
// =============================================================================

/**
 * Generate a gradient placeholder style for when images aren't available
 * @param {string} seed - Seed for deterministic gradient (e.g., car slug)
 * @param {string} variant - 'primary' | 'accent' | 'neutral'
 * @returns {Object} - CSS style object for background
 */
export function getPlaceholderGradient(seed = 'default', variant = 'primary') {
  const colors = PLACEHOLDER_COLORS[variant] || PLACEHOLDER_COLORS.primary;
  
  // Simple hash function for deterministic variation
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const angle = (hash % 360);
  
  return {
    background: `linear-gradient(${angle}deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
  };
}

/**
 * Generate placeholder with car name text
 * @param {Object} car - Car object
 * @returns {Object} - Props for a placeholder component
 */
export function getCarPlaceholderProps(car) {
  return {
    style: getPlaceholderGradient(car.slug || car.name, 'primary'),
    text: car.name,
    subtext: car.years,
  };
}

// =============================================================================
// Image Component Helpers
// =============================================================================

/**
 * Get image props with srcSet for responsive images
 * @param {string} baseUrl - Base image URL
 * @param {number[]} widths - Array of widths to generate
 * @returns {Object} - Props for img element
 */
export function getResponsiveImageProps(baseUrl, widths = [320, 640, 960, 1280]) {
  if (!baseUrl) return {};
  
  // For Vercel Blob, you can use image optimization parameters
  // Format: url?w=WIDTH&q=QUALITY
  const srcSet = widths
    .map(w => `${baseUrl}?w=${w} ${w}w`)
    .join(', ');
  
  return {
    src: baseUrl,
    srcSet,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  };
}

/**
 * Preload an image for better UX
 * @param {string} url - Image URL to preload
 */
export function preloadImage(url) {
  if (!url) return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  document.head.appendChild(link);
}

// =============================================================================
// Image Existence Check (for conditional rendering)
// =============================================================================

/**
 * Check if a car has any images available
 * @param {Object} car - Car object
 * @returns {boolean}
 */
export function hasCarImages(car) {
  return !!(
    car.imageHeroUrl ||
    (car.imageGallery && car.imageGallery.length > 0) ||
    (car.slug && BLOB_BASE_URL)
  );
}

/**
 * Check if we should show a placeholder instead of image
 * @param {Object} car - Car object  
 * @returns {boolean}
 */
export function shouldShowPlaceholder(car) {
  // In dev mode without blob URL configured, always show placeholder
  if (IS_DEV && !BLOB_BASE_URL) {
    return true;
  }
  
  // No images available
  return !hasCarImages(car);
}

// =============================================================================
// Image Generation Metadata (for scripts)
// =============================================================================

/**
 * Generate prompt metadata for AI image generation
 * This is used by the offline image generation script
 * @param {Object} car - Car object
 * @returns {Object} - Metadata for image generation
 */
export function getImageGenMetadata(car) {
  return {
    slug: car.slug,
    name: car.name,
    category: car.category,
    tier: car.tier,
    // Suggested prompt elements
    promptHints: {
      carType: car.category === 'Mid-Engine' ? 'mid-engine sports car' :
               car.category === 'Rear-Engine' ? 'rear-engine sports car' :
               'front-engine sports car',
      era: getEraFromYears(car.years),
      brand: extractBrand(car.name),
      style: car.tier === 'premium' ? 'exotic, dramatic' :
             car.tier === 'budget' ? 'approachable, sporty' :
             'performance-focused',
    },
    // Output paths
    outputPaths: {
      hero: CAR_IMAGE_PATHS.hero(car.slug),
      thumbnail: CAR_IMAGE_PATHS.thumbnail(car.slug),
      og: CAR_IMAGE_PATHS.og(car.slug),
    },
  };
}

/**
 * Extract era descriptor from year range
 * @param {string} years - Year range string (e.g., "2020-2024")
 * @returns {string} - Era description
 */
function getEraFromYears(years) {
  const match = years.match(/(\d{4})/);
  if (!match) return 'modern';
  const year = parseInt(match[1], 10);
  if (year >= 2020) return 'modern';
  if (year >= 2015) return 'contemporary';
  if (year >= 2010) return 'recent classic';
  return 'classic';
}

/**
 * Extract brand from car name
 * @param {string} name - Car name
 * @returns {string} - Brand name or 'sports car'
 */
function extractBrand(name) {
  const brands = [
    'Porsche', 'Ferrari', 'Lamborghini', 'Audi', 'BMW', 'Mercedes',
    'Chevrolet', 'Ford', 'Dodge', 'Nissan', 'Toyota', 'Lexus',
    'Lotus', 'Jaguar', 'Aston Martin', 'Maserati', 'Alfa Romeo',
  ];
  
  for (const brand of brands) {
    if (name.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  
  // Check for model names that imply brands
  if (name.includes('Cayman') || name.includes('Carrera') || name.includes('911')) return 'Porsche';
  if (name.includes('Corvette') || name.includes('Camaro')) return 'Chevrolet';
  if (name.includes('Mustang') || name.includes('GT350') || name.includes('GT500')) return 'Ford';
  if (name.includes('Viper')) return 'Dodge';
  if (name.includes('GT-R')) return 'Nissan';
  if (name.includes('Supra')) return 'Toyota';
  if (name.includes('Gallardo')) return 'Lamborghini';
  if (name.includes('R8')) return 'Audi';
  if (name.includes('Emira') || name.includes('Evora')) return 'Lotus';
  if (name.includes('F-Type')) return 'Jaguar';
  if (name.includes('Vantage')) return 'Aston Martin';
  if (name.includes('GranTurismo')) return 'Maserati';
  if (name.includes('4C')) return 'Alfa Romeo';
  if (name.includes('M2') || name.includes('M4')) return 'BMW';
  if (name.includes('C63') || name.includes('AMG')) return 'Mercedes';
  if (name.includes('RC F') || name.includes('LC 500')) return 'Lexus';
  
  return 'sports car';
}

// =============================================================================
// Export All
// =============================================================================

export default {
  getBlobUrl,
  getCarHeroImage,
  getCarThumbnail,
  getCarGalleryImages,
  getPageImage,
  getPlaceholderGradient,
  getCarPlaceholderProps,
  getResponsiveImageProps,
  preloadImage,
  hasCarImages,
  shouldShowPlaceholder,
  getImageGenMetadata,
  CAR_IMAGE_PATHS,
  PAGE_IMAGE_PATHS,
};

