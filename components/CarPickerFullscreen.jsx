'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import CarImage from '@/components/CarImage';
import styles from './CarPickerFullscreen.module.css';
import { useSafeAreaColor, SAFE_AREA_COLORS } from '@/hooks/useSafeAreaColor';

/**
 * CarPickerFullscreen - Full-screen car selection experience
 * 
 * GRAVL-inspired design:
 * - Full-screen on mobile
 * - Large search input
 * - Clean, minimal car cards
 * - Recent cars section
 * - Popular platforms section
 */

const POPULAR_CARS = [
  'BMW M3', 'Porsche 911', 'Toyota Supra', 'Corvette C8',
  'Ford Mustang', 'Nissan 370Z', 'Mazda MX-5', 'Audi RS3'
];

export default function CarPickerFullscreen({
  isOpen,
  onClose,
  onSelect,
  cars = [],
  recentCars = [],
}) {
  // Set safe area color to match overlay background when modal is open
  useSafeAreaColor(SAFE_AREA_COLORS.OVERLAY, { enabled: isOpen });
  
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mount check for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Lock body scroll when open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);
  
  // Reset search on close
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);
  
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  // Filter cars by search term
  const filteredCars = useMemo(() => {
    if (!searchTerm) return cars.slice(0, 20); // Show top 20 by default
    
    const term = searchTerm.toLowerCase();
    return cars.filter(car => 
      car.name?.toLowerCase().includes(term) ||
      car.brand?.toLowerCase().includes(term) ||
      car.category?.toLowerCase().includes(term) ||
      car.year?.toString().includes(term)
    ).slice(0, 50);
  }, [searchTerm, cars]);
  
  // Handle car selection
  const handleSelect = useCallback((car) => {
    onSelect?.(car);
    onClose?.();
  }, [onSelect, onClose]);
  
  // Handle popular car click (sets search term)
  const handlePopularClick = useCallback((name) => {
    setSearchTerm(name);
  }, []);
  
  if (!mounted || !isOpen) return null;
  
  const content = (
    <div className={styles.overlay} data-overlay-modal>
      <div className={styles.picker}>
        {/* Header */}
        <header className={styles.header}>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
          <h1 className={styles.title}>Select a Car</h1>
          <div className={styles.headerSpacer} />
        </header>
        
        {/* Search */}
        <div className={styles.searchContainer}>
          <SearchIcon />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search make, model, or year..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button
              className={styles.clearButton}
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              <CloseIcon small />
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className={styles.content}>
          {/* Recent Cars */}
          {!searchTerm && recentCars.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Recent</h2>
              <div className={styles.recentGrid}>
                {recentCars.slice(0, 4).map((car) => (
                  <button
                    key={car.slug}
                    className={styles.recentCard}
                    onClick={() => handleSelect(car)}
                  >
                    <div className={styles.recentImage}>
                      <CarImage car={car} variant="thumbnail" showName={false} />
                    </div>
                    <span className={styles.recentName}>{car.name}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
          
          {/* Popular Platforms */}
          {!searchTerm && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Popular Platforms</h2>
              <div className={styles.popularGrid}>
                {POPULAR_CARS.map((name) => (
                  <button
                    key={name}
                    className={styles.popularCard}
                    onClick={() => handlePopularClick(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </section>
          )}
          
          {/* Search Results / All Cars */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {searchTerm ? `Results for "${searchTerm}"` : 'All Cars'}
            </h2>
            
            {filteredCars.length === 0 ? (
              <div className={styles.noResults}>
                <p>No cars found matching "{searchTerm}"</p>
                <button
                  className={styles.clearSearchBtn}
                  onClick={() => setSearchTerm('')}
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className={styles.carList}>
                {filteredCars.map((car) => (
                  <button
                    key={car.slug}
                    className={styles.carCard}
                    onClick={() => handleSelect(car)}
                  >
                    <div className={styles.carImage}>
                      <CarImage car={car} variant="thumbnail" showName={false} />
                    </div>
                    <div className={styles.carInfo}>
                      <span className={styles.carName}>{car.name}</span>
                      <span className={styles.carMeta}>
                        {car.hp} hp • {car.priceRange || car.category}
                      </span>
                    </div>
                    <ChevronIcon />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
  
  return createPortal(content, document.body);
}

// Icons
const CloseIcon = ({ small }) => (
  <svg width={small ? 16 : 24} height={small ? 16 : 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
