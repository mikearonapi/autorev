'use client';

/**
 * Add Favorites Modal
 *
 * Modal for adding cars to user's favorites within the garage.
 * Simple search interface - tap a car to add it to favorites.
 * Rendered via React Portal to document.body for proper stacking context.
 *
 * Now fetches car data from database via carsClient.
 */

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './AddFavoritesModal.module.css';
import { fetchCars } from '@/lib/carsClient';
import { calculateWeightedScore, ENTHUSIAST_WEIGHTS } from '@/lib/scoring';
import CarImage from './CarImage';
import { Icons } from '@/components/ui/Icons';

export default function AddFavoritesModal({ isOpen, onClose, onAdd, existingFavorites = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [addingSlug, setAddingSlug] = useState(null);
  const [recentlyAdded, setRecentlyAdded] = useState(new Set());
  const [allCars, setAllCars] = useState([]);

  // Portal mounting - required for SSR compatibility
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch car data from database on mount
  useEffect(() => {
    fetchCars().then(setAllCars).catch(console.error);
  }, []);

  // Filter and sort cars based on search (from database)
  // Uses ENTHUSIAST_WEIGHTS from lib/scoring.js for consistent scoring across the app
  const filteredCars = useMemo(() => {
    let results = allCars;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = allCars.filter(
        (car) =>
          car.name?.toLowerCase().includes(query) ||
          car.brand?.toLowerCase().includes(query) ||
          car.category?.toLowerCase().includes(query) ||
          car.engine?.toLowerCase().includes(query) ||
          car.years?.toLowerCase().includes(query)
      );
    }

    // Sort by weighted score (highest scoring cars first)
    return results
      .map((car) => ({
        car,
        score: calculateWeightedScore(car, ENTHUSIAST_WEIGHTS),
      }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.car)
      .slice(0, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, allCars]);

  // Check if a car is already favorited
  const isFavorited = (slug) => {
    return existingFavorites.some((f) => f.slug === slug) || recentlyAdded.has(slug);
  };

  // Handle adding a car to favorites - Optimistic UI pattern
  const handleAddFavorite = async (car) => {
    if (isFavorited(car.slug) || addingSlug) return;

    // Optimistic: immediately mark as added
    setRecentlyAdded((prev) => new Set([...prev, car.slug]));

    // Brief visual feedback for tactile response
    setAddingSlug(car.slug);
    setTimeout(() => setAddingSlug(null), 100);

    // Save in background
    try {
      await onAdd(car);
    } catch (err) {
      console.error('Error adding favorite:', err);
      // Revert on error
      setRecentlyAdded((prev) => {
        const next = new Set(prev);
        next.delete(car.slug);
        return next;
      });
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setSearchQuery('');
    setRecentlyAdded(new Set());
    onClose();
  };

  if (!isOpen || !isMounted) return null;

  const modalContent = (
    <div className={styles.overlay} onClick={handleClose} data-overlay-modal>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Add to Favorites</h2>
          <button onClick={handleClose} className={styles.closeButton}>
            <Icons.x size={24} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Search */}
          <div className={styles.searchWrapper}>
            <Icons.search size={18} />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={styles.searchClear}
                type="button"
              >
                <Icons.x size={16} />
              </button>
            )}
          </div>

          {/* Search hint */}
          {!searchQuery && (
            <p className={styles.searchHint}>
              Search by make, model, category, or year • Tap to add
            </p>
          )}

          {/* Car List */}
          <div className={styles.carList}>
            {filteredCars.map((car) => {
              const alreadyFavorited = isFavorited(car.slug);
              const isAdding = addingSlug === car.slug;

              return (
                <button
                  key={car.slug}
                  className={`${styles.carOption} ${alreadyFavorited ? styles.carOptionAdded : ''}`}
                  onClick={() => handleAddFavorite(car)}
                  disabled={alreadyFavorited || isAdding}
                >
                  <div className={styles.carOptionImage}>
                    <CarImage car={car} variant="thumbnail" showName={false} />
                  </div>
                  <div className={styles.carOptionInfo}>
                    <span className={styles.carOptionName}>{car.name}</span>
                    <span className={styles.carOptionMeta}>
                      {car.hp} hp • {car.category || 'Sports Car'} • {car.priceRange || car.years}
                    </span>
                  </div>
                  <span className={styles.carOptionAction}>
                    {alreadyFavorited ? (
                      <span className={styles.addedBadge}>
                        <Icons.check size={14} />
                        Added
                      </span>
                    ) : isAdding ? (
                      <span className={styles.addingBadge}>Adding...</span>
                    ) : (
                      <span className={styles.addBadge}>
                        <Icons.heart size={14} />
                        Add
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
            {filteredCars.length === 0 && searchQuery && (
              <div className={styles.noResults}>
                <Icons.heart size={32} />
                <p className={styles.noResultsText}>No vehicles found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with count */}
        {recentlyAdded.size > 0 && (
          <div className={styles.footer}>
            <span className={styles.addedCount}>
              <Icons.check size={16} />
              {recentlyAdded.size} car{recentlyAdded.size !== 1 ? 's' : ''} added to favorites
            </span>
            <button onClick={handleClose} className={styles.doneButton}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(modalContent, document.body);
}
