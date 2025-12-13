'use client';

/**
 * Add Vehicle Modal
 * 
 * Modal for adding a new vehicle to user's garage.
 * Simple search interface - tap a car to add it to My Collection.
 */

import { useState, useMemo } from 'react';
import styles from './AddVehicleModal.module.css';
import { carData } from '@/data/cars.js';
import { calculateWeightedScore } from '@/lib/scoring';
import CarImage from './CarImage';

// Icons
const Icons = {
  x: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  search: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  car: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  check: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

export default function AddVehicleModal({ isOpen, onClose, onAdd, existingVehicles = [] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [addingSlug, setAddingSlug] = useState(null);
  const [recentlyAdded, setRecentlyAdded] = useState(new Set());

  // Default weights for scoring (balanced enthusiast preferences)
  const defaultWeights = {
    powerAccel: 1.5,
    gripCornering: 1.5,
    braking: 1.2,
    trackPace: 1.5,
    drivability: 1.0,
    reliabilityHeat: 1.0,
    soundEmotion: 1.2,
  };

  // Filter and sort cars based on search
  const filteredCars = useMemo(() => {
    let results = carData;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = carData.filter(car => 
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
        score: calculateWeightedScore(car, defaultWeights)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.car)
      .slice(0, 30);
  }, [searchQuery]);

  // Check if a car is already in My Collection
  const isOwned = (slug) => {
    return existingVehicles.some(v => v.matchedCarSlug === slug) || recentlyAdded.has(slug);
  };

  // Handle adding a car to My Collection
  const handleAddVehicle = async (car) => {
    if (isOwned(car.slug) || addingSlug) return;
    
    setAddingSlug(car.slug);
    
    try {
      // Parse year from car data
      const yearMatch = car.years?.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      
      // Extract make and model from name
      let make = '';
      let model = car.name;
      
      if (car.name.startsWith('718') || car.name.startsWith('911') || car.name.startsWith('981') || 
          car.name.startsWith('997') || car.name.startsWith('987') || car.name.startsWith('991') || 
          car.name.startsWith('992')) {
        make = 'Porsche';
      } else {
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
    } finally {
      setAddingSlug(null);
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setSearchQuery('');
    setRecentlyAdded(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>I Own This Car</h2>
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
                    {alreadyOwned ? (
                      <span className={styles.addedBadge}>
                        <Icons.check size={14} />
                        Added
                      </span>
                    ) : isAdding ? (
                      <span className={styles.addingBadge}>Adding...</span>
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
              {recentlyAdded.size} car{recentlyAdded.size !== 1 ? 's' : ''} added to My Collection
            </span>
            <button onClick={handleClose} className={styles.doneButton}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
