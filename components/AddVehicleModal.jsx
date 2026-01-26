'use client';

/**
 * Add Vehicle Modal
 * 
 * Full-screen modal for adding a performance vehicle to user's garage.
 * Rendered via React Portal to document.body for proper stacking context.
 * 
 * Focused on tunable enthusiast cars from our database.
 * 
 * Optimized for quick vehicle identification with:
 * - No images (faster, cleaner)
 * - Rich identifying info (years, engine, HP, drivetrain)
 * - LIME CTA buttons per brand guidelines
 */

import { useState, useMemo, useEffect } from 'react';

import { createPortal } from 'react-dom';

import { Icons } from '@/components/ui/Icons';
import { fetchCars } from '@/lib/carsClient';
import { calculateWeightedScore, ENTHUSIAST_WEIGHTS } from '@/lib/scoring';

import styles from './AddVehicleModal.module.css';

export default function AddVehicleModal({ isOpen, onClose, onAdd, existingVehicles = [] }) {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [addingSlug, setAddingSlug] = useState(null);
  const [recentlyAdded, setRecentlyAdded] = useState(new Set());
  const [allCars, setAllCars] = useState([]);
  const [addError, setAddError] = useState(null);
  
  // Track if component is mounted (for portal - SSR compatibility)
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Fetch car data from database on mount
  useEffect(() => {
    fetchCars().then(setAllCars).catch(console.error);
  }, []);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Filter and sort cars based on search (from database)
  // Uses ENTHUSIAST_WEIGHTS from lib/scoring.js for consistent scoring across the app
  const filteredCars = useMemo(() => {
    let results = allCars;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = allCars.filter(car => 
        car.name?.toLowerCase().includes(query) ||
        car.brand?.toLowerCase().includes(query) ||
        car.category?.toLowerCase().includes(query) ||
        car.engine?.toLowerCase().includes(query) ||
        car.years?.toLowerCase().includes(query)
      );
    }
    
    // Sort by weighted score (highest scoring cars first)
    return results
      .map(car => ({
        car,
        score: calculateWeightedScore(car, ENTHUSIAST_WEIGHTS)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.car)
      .slice(0, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, allCars]);

  // Check if a car is already in My Collection
  const isOwned = (slug) => {
    return existingVehicles.some(v => v.matchedCarSlug === slug) || recentlyAdded.has(slug);
  };

  // Handle adding a car to My Garage
  const handleAddVehicle = async (car) => {
    if (isOwned(car.slug) || addingSlug) return;
    
    setAddingSlug(car.slug);
    setAddError(null);
    
    try {
      // Parse year from car data
      const yearMatch = car.years?.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      
      // Extract make and model from name
      let make = car.brand || '';
      let model = car.name;
      
      // Handle Porsche model numbers
      if (!make && (car.name.startsWith('718') || car.name.startsWith('911') || car.name.startsWith('981') || 
          car.name.startsWith('997') || car.name.startsWith('987') || car.name.startsWith('991') || 
          car.name.startsWith('992'))) {
        make = 'Porsche';
      } else if (!make) {
        const parts = car.name.split(' ');
        make = parts[0];
        model = parts.slice(1).join(' ');
      }

      const vehicleData = {
        year,
        make,
        model,
        matchedCarSlug: car.slug,
      };

      await onAdd(vehicleData);
      setRecentlyAdded(prev => new Set([...prev, car.slug]));
    } catch (err) {
      console.error('Error adding vehicle:', err);
      setAddError(err.message || 'Failed to add vehicle. Please try again or sign in.');
    } finally {
      setAddingSlug(null);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setSearchQuery('');
    setRecentlyAdded(new Set());
    setAddError(null);
    onClose();
  };

  if (!isOpen) return null;

  // Format engine string for display (truncate if too long)
  const formatEngine = (engine) => {
    if (!engine) return null;
    // Truncate long engine names
    if (engine.length > 20) {
      return engine.substring(0, 18) + '…';
    }
    return engine;
  };

  const modalContent = (
    <div className={styles.overlay} onClick={handleClose} data-overlay-modal>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Add to My Garage</h2>
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
              placeholder="Search performance vehicles..."
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
              Search our database of {allCars.length}+ enthusiast vehicles
            </p>
          )}

          {/* Error message */}
          {addError && (
            <div className={styles.addError}>
              <span>⚠️ {addError}</span>
              <button 
                onClick={() => setAddError(null)} 
                className={styles.errorDismiss}
                type="button"
              >
                ×
              </button>
            </div>
          )}

          {/* Car List */}
          <div className={styles.carList}>
            {filteredCars.map(car => {
              const alreadyOwned = isOwned(car.slug);
              const isAdding = addingSlug === car.slug;
              
              return (
                <button
                  key={car.slug}
                  className={`${styles.carOption} ${alreadyOwned ? styles.carOptionAdded : ''}`}
                  onClick={() => handleAddVehicle(car)}
                  disabled={alreadyOwned || isAdding}
                >
                  <div className={styles.carOptionInfo}>
                    <span className={styles.carOptionName}>{car.name}</span>
                    <span className={styles.carOptionMeta}>
                      {car.years && <span className={styles.metaItem}>{car.years}</span>}
                      {car.hp && <span className={styles.metaItem}>{car.hp} hp</span>}
                      {car.drivetrain && <span className={styles.metaItem}>{car.drivetrain}</span>}
                      {car.engine && <span className={styles.metaItem}>{formatEngine(car.engine)}</span>}
                    </span>
                  </div>
                  <span className={styles.carOptionAction}>
                    {alreadyOwned ? (
                      <span className={styles.addedBadge}>
                        <Icons.check size={14} />
                        Added
                      </span>
                    ) : isAdding ? (
                      <span className={styles.addingBadge}>
                        <Icons.loader size={14} />
                      </span>
                    ) : (
                      <span className={styles.addBadge}>
                        <Icons.car size={14} />
                        Add
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
            {filteredCars.length === 0 && searchQuery && (
              <div className={styles.noResults}>
                <Icons.car size={32} />
                <p className={styles.noResultsText}>No vehicles found for "{searchQuery}"</p>
                <p className={styles.noResultsHint}>
                  Try a different search term or check spelling
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with count */}
        {recentlyAdded.size > 0 && (
          <div className={styles.footer}>
            <span className={styles.addedCount}>
              <Icons.check size={16} />
              {recentlyAdded.size} vehicle{recentlyAdded.size !== 1 ? 's' : ''} added
            </span>
            <button onClick={handleClose} className={styles.doneButton}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
  
  // Use portal to render at document body level (above all other content)
  // This ensures the modal is not trapped inside any parent's stacking context
  // Only render when mounted AND open - prevents data-overlay-modal from affecting safe area when closed
  if (!isMounted || !isOpen) return null;
  return createPortal(modalContent, document.body);
}
