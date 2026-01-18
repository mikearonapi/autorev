/**
 * useCarImages Hook
 * 
 * Manages car images that are shared across Garage and Tuning Shop.
 * Images are linked by car_slug so they appear in both features.
 * 
 * Features:
 * - Fetch all images for a specific car (from both vehicles and builds)
 * - Set/clear hero image (syncs across features)
 * - Optimistic updates for responsive UI
 * 
 * @module hooks/useCarImages
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

/**
 * Hook to manage car images shared across Garage and Tuning Shop
 * 
 * @param {string} carSlug - The car slug to fetch images for
 * @param {Object} options - Options
 * @param {boolean} options.enabled - Whether to fetch images (default: true)
 * @returns {Object} - { images, heroImage, isLoading, error, setHeroImage, clearHeroImage, refreshImages }
 */
export function useCarImages(carSlug, { enabled = true } = {}) {
  const { user, isAuthenticated } = useAuth();
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch images when carSlug changes
  const fetchImages = useCallback(async () => {
    if (!enabled || !isAuthenticated || !user?.id || !carSlug) {
      setImages([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/users/${user.id}/car-images?carSlug=${encodeURIComponent(carSlug)}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const data = await response.json();
      setImages(data.images || []);
    } catch (err) {
      console.error('[useCarImages] Fetch error:', err);
      setError(err.message);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  }, [carSlug, enabled, isAuthenticated, user?.id]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Get the current hero image (is_primary = true, and is an image not a video)
  const heroImage = images.find(img => img.is_primary && img.media_type !== 'video') || null;

  /**
   * Set a specific image as the hero image
   * Optimistically updates UI, then syncs with server
   * 
   * @param {string} imageId - The ID of the image to set as hero
   * @returns {Promise<boolean>} - Success status
   */
  const setHeroImage = useCallback(async (imageId) => {
    if (!isAuthenticated || !user?.id || !carSlug) {
      return false;
    }

    // Optimistic update
    setImages(prev => prev.map(img => ({
      ...img,
      is_primary: img.id === imageId,
      isPrimary: img.id === imageId,
    })));

    try {
      const response = await fetch(`/api/users/${user.id}/car-images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carSlug, imageId }),
      });

      if (!response.ok) {
        // Revert on failure
        await fetchImages();
        return false;
      }

      return true;
    } catch (err) {
      console.error('[useCarImages] Set hero error:', err);
      // Revert on failure
      await fetchImages();
      return false;
    }
  }, [carSlug, fetchImages, isAuthenticated, user?.id]);

  /**
   * Clear the hero image (revert to stock)
   * Clears is_primary from all images for this car
   * 
   * @returns {Promise<boolean>} - Success status
   */
  const clearHeroImage = useCallback(async () => {
    if (!isAuthenticated || !user?.id || !carSlug) {
      return false;
    }

    // Optimistic update
    setImages(prev => prev.map(img => ({
      ...img,
      is_primary: false,
      isPrimary: false,
    })));

    try {
      const response = await fetch(`/api/users/${user.id}/car-images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carSlug, imageId: null }),
      });

      if (!response.ok) {
        // Revert on failure
        await fetchImages();
        return false;
      }

      return true;
    } catch (err) {
      console.error('[useCarImages] Clear hero error:', err);
      // Revert on failure
      await fetchImages();
      return false;
    }
  }, [carSlug, fetchImages, isAuthenticated, user?.id]);

  /**
   * Add uploaded images to the local state
   * Called by ImageUploader after successful upload
   * 
   * @param {Array} newImages - Array of newly uploaded images
   */
  const addImages = useCallback((newImages) => {
    setImages(prev => {
      // Filter out any duplicates
      const existingIds = new Set(prev.map(img => img.id));
      const uniqueNew = newImages.filter(img => !existingIds.has(img.id));
      return [...prev, ...uniqueNew];
    });
  }, []);

  /**
   * Remove an image from local state
   * 
   * @param {string} imageId - The ID of the image to remove
   */
  const removeImage = useCallback((imageId) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  }, []);

  return {
    images,
    heroImage,
    heroImageUrl: heroImage?.blob_url || heroImage?.blobUrl || null,
    isLoading,
    error,
    setHeroImage,
    clearHeroImage,
    refreshImages: fetchImages,
    addImages,
    removeImage,
  };
}

export default useCarImages;
