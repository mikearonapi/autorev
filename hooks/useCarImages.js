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
 * Updated to use React Query for caching and deduplication.
 *
 * @module hooks/useCarImages
 */

import { useMemo, useCallback } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/components/providers/AuthProvider';
import { getPrefetchedHeroImage } from '@/lib/prefetch';

// Cache time for car images (2 minutes)
const CAR_IMAGES_STALE_TIME = 2 * 60 * 1000;

// Query key factory
const carImageKeys = {
  all: ['car-images'],
  byCarSlug: (userId, carSlug) => [...carImageKeys.all, userId, carSlug],
};

/**
 * Fetch car images from API
 */
async function fetchCarImages(userId, carSlug) {
  const response = await fetch(
    `/api/users/${userId}/car-images?carSlug=${encodeURIComponent(carSlug)}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch images');
  }

  const data = await response.json();
  return data.images || [];
}

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
  const queryClient = useQueryClient();

  const queryKey = carImageKeys.byCarSlug(user?.id, carSlug);

  // Use React Query for data fetching with caching
  const {
    data: images = [],
    isLoading,
    error: queryError,
    refetch: refreshImages,
  } = useQuery({
    queryKey,
    queryFn: () => fetchCarImages(user.id, carSlug),
    staleTime: CAR_IMAGES_STALE_TIME,
    enabled: enabled && isAuthenticated && !!user?.id && !!carSlug,
  });

  // Mutation for setting hero image
  const setHeroMutation = useMutation({
    mutationFn: async (imageId) => {
      const response = await fetch(`/api/users/${user.id}/car-images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carSlug, imageId }),
      });

      if (!response.ok) {
        throw new Error('Failed to set hero image');
      }

      return response.json();
    },
    // Optimistic update
    onMutate: async (imageId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousImages = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) =>
        (old || []).map((img) => ({
          ...img,
          is_primary: img.id === imageId,
          isPrimary: img.id === imageId,
        }))
      );

      return { previousImages };
    },
    onError: (err, imageId, context) => {
      console.error('[useCarImages] Set hero error:', err);
      queryClient.setQueryData(queryKey, context?.previousImages);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Mutation for clearing hero image
  const clearHeroMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${user.id}/car-images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carSlug, imageId: null }),
      });

      if (!response.ok) {
        throw new Error('Failed to clear hero image');
      }

      return response.json();
    },
    // Optimistic update
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previousImages = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) =>
        (old || []).map((img) => ({
          ...img,
          is_primary: false,
          isPrimary: false,
        }))
      );

      return { previousImages };
    },
    onError: (err, variables, context) => {
      console.error('[useCarImages] Clear hero error:', err);
      queryClient.setQueryData(queryKey, context?.previousImages);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Check for prefetched hero image (instant, no loading)
  const prefetchedHero = useMemo(
    () => getPrefetchedHeroImage(carSlug, user?.id),
    [carSlug, user?.id]
  );

  // Get the current hero image from API data (is_primary = true, and is an image not a video)
  const heroImageFromApi = useMemo(
    () => images.find((img) => img.is_primary && img.media_type !== 'video') || null,
    [images]
  );

  // Use API data when available, otherwise fall back to prefetched
  // This ensures we always have the most up-to-date hero image after API loads
  const heroImage = heroImageFromApi;

  /**
   * Set a specific image as the hero image
   * @param {string} imageId - The ID of the image to set as hero
   * @returns {Promise<boolean>} - Success status
   */
  const setHeroImage = useCallback(
    async (imageId) => {
      if (!isAuthenticated || !user?.id || !carSlug) {
        return false;
      }

      try {
        await setHeroMutation.mutateAsync(imageId);
        return true;
      } catch {
        return false;
      }
    },
    [isAuthenticated, user?.id, carSlug, setHeroMutation]
  );

  /**
   * Clear the hero image (revert to stock)
   * @returns {Promise<boolean>} - Success status
   */
  const clearHeroImage = useCallback(async () => {
    if (!isAuthenticated || !user?.id || !carSlug) {
      return false;
    }

    try {
      await clearHeroMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  }, [isAuthenticated, user?.id, carSlug, clearHeroMutation]);

  // Mutation for reordering images
  const reorderMutation = useMutation({
    mutationFn: async (newOrder) => {
      const response = await fetch(`/api/users/${user.id}/car-images/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carSlug, imageIds: newOrder }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reorder images');
      }

      return response.json();
    },
    // Optimistic update
    onMutate: async (newOrder) => {
      // Cancel any in-flight queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey });
      const previousImages = queryClient.getQueryData(queryKey);

      // Reorder images locally based on newOrder array
      // Update both snake_case and camelCase versions for consistency
      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;
        const imageMap = new Map(old.map((img) => [img.id, img]));
        return newOrder
          .map((id, index) => {
            const img = imageMap.get(id);
            if (img) {
              return {
                ...img,
                display_order: index + 1,
                displayOrder: index + 1, // Keep both in sync
              };
            }
            return null;
          })
          .filter(Boolean);
      });

      return { previousImages };
    },
    onError: (err, newOrder, context) => {
      console.error('[useCarImages] Reorder error:', err);
      // Restore previous state on error
      if (context?.previousImages) {
        queryClient.setQueryData(queryKey, context.previousImages);
      }
    },
    // Don't invalidate on success - the optimistic update already has the correct state
    // Only invalidate on error, which is handled in onError above
    // Removing onSettled's invalidateQueries prevents the race condition where
    // the refetch returns stale data before the database write is fully visible
  });

  /**
   * Reorder images by providing new order of image IDs
   * @param {string[]} newOrder - Array of image IDs in desired order
   * @returns {Promise<boolean>} - Success status
   */
  const reorderImages = useCallback(
    async (newOrder) => {
      if (!isAuthenticated || !user?.id || !carSlug) {
        return false;
      }

      try {
        await reorderMutation.mutateAsync(newOrder);
        return true;
      } catch {
        return false;
      }
    },
    [isAuthenticated, user?.id, carSlug, reorderMutation]
  );

  /**
   * Add uploaded images to the local cache
   * Called by ImageUploader after successful upload
   *
   * @param {Array} newImages - Array of newly uploaded images
   */
  const addImages = useCallback(
    (newImages) => {
      queryClient.setQueryData(queryKey, (old) => {
        const existingIds = new Set((old || []).map((img) => img.id));
        const uniqueNew = newImages.filter((img) => !existingIds.has(img.id));
        return [...(old || []), ...uniqueNew];
      });
    },
    [queryClient, queryKey]
  );

  /**
   * Remove an image from local cache
   *
   * @param {string} imageId - The ID of the image to remove
   */
  const removeImage = useCallback(
    (imageId) => {
      queryClient.setQueryData(queryKey, (old) => (old || []).filter((img) => img.id !== imageId));
    },
    [queryClient, queryKey]
  );

  // Compute the best available hero image URL
  // Priority: API data > prefetched data
  const heroImageUrl = useMemo(() => {
    // If we have API data, use it (most up-to-date)
    if (heroImage?.blob_url || heroImage?.blobUrl) {
      return heroImage.blob_url || heroImage.blobUrl;
    }
    // While loading, use prefetched hero image URL (already in browser cache)
    if (prefetchedHero?.url) {
      return prefetchedHero.url;
    }
    return null;
  }, [heroImage, prefetchedHero]);

  return {
    images,
    heroImage,
    heroImageUrl,
    // Also expose prefetched URL separately for components that want to use it immediately
    prefetchedHeroUrl: prefetchedHero?.url || null,
    // isLoading is false if we have prefetched data
    isLoading: isLoading && !prefetchedHero,
    error: queryError?.message || null,
    setHeroImage,
    clearHeroImage,
    reorderImages,
    refreshImages,
    addImages,
    removeImage,
  };
}

export default useCarImages;
