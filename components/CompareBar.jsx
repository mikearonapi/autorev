'use client';

/**
 * Floating Compare Bar
 * 
 * A persistent bar at the bottom of the screen that appears
 * when cars are added to the compare list. Works site-wide.
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CompareBar.module.css';
import { useCompare } from '@/components/providers/CompareProvider';
import { getCarHeroImage } from '@/lib/images';
import { carData } from '@/data/cars.js';
import CompareModal from './CompareModal';

// Icons
const Icons = {
  x: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  compare: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  chevronUp: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
  chevronDown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  trash: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  plus: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
};

export default function CompareBar() {
  const { cars, count, maxCars, removeFromCompare, clearAll, isHydrated, showCompareModal, setShowCompareModal } = useCompare();
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show until hydrated or if no cars
  if (!isHydrated || count === 0) {
    return null;
  }

  // Get full car data for images
  const carsWithImages = cars.map(car => {
    const fullCar = carData.find(c => c.slug === car.slug);
    return fullCar || car;
  });

  return (
    <div className={`${styles.bar} ${isExpanded ? styles.expanded : ''}`}>
      {/* Collapsed View */}
      <div className={styles.collapsed}>
        <button 
          className={styles.expandToggle}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <Icons.chevronDown size={20} /> : <Icons.chevronUp size={20} />}
        </button>
        
        <div className={styles.summary}>
          <Icons.compare size={20} />
          <span className={styles.count}>{count} car{count !== 1 ? 's' : ''} selected</span>
        </div>

        {/* Mini Thumbnails */}
        <div className={styles.thumbnails}>
          {carsWithImages.slice(0, 4).map((car, index) => {
            const imageUrl = getCarHeroImage(car);
            return (
              <div 
                key={car.slug} 
                className={styles.thumbnail}
                style={{ zIndex: 4 - index }}
              >
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={car.name}
                    fill
                    sizes="40px"
                    className={styles.thumbnailImage}
                  />
                ) : (
                  <span className={styles.thumbnailPlaceholder}>
                    {car.name?.charAt(0)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className={styles.actions}>
          {count >= 2 && (
            <button 
              onClick={() => setShowCompareModal(true)}
              className={styles.compareButton}
            >
              Compare Now
            </button>
          )}
          <button 
            onClick={clearAll}
            className={styles.clearButton}
            title="Clear all"
          >
            <Icons.trash size={16} />
          </button>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className={styles.expandedContent}>
          <div className={styles.carList}>
            {carsWithImages.map(car => {
              const imageUrl = getCarHeroImage(car);
              return (
                <div key={car.slug} className={styles.carItem}>
                  <div className={styles.carImage}>
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={car.name}
                        fill
                        sizes="80px"
                        className={styles.carImageImg}
                      />
                    ) : (
                      <span className={styles.carImagePlaceholder}>
                        {car.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className={styles.carInfo}>
                    <span className={styles.carName}>{car.name}</span>
                    <span className={styles.carSpecs}>
                      {car.hp && `${car.hp} hp`}
                      {car.hp && car.zeroToSixty && ' • '}
                      {car.zeroToSixty && `${car.zeroToSixty}s`}
                    </span>
                  </div>
                  <button
                    onClick={() => removeFromCompare(car.slug)}
                    className={styles.removeButton}
                    title="Remove"
                  >
                    <Icons.x size={16} />
                  </button>
                </div>
              );
            })}

            {/* Add More Slot */}
            {count < maxCars && (
              <Link href="/browse-cars" className={styles.addMore}>
                <Icons.plus size={20} />
                <span>Add Car ({maxCars - count} slots left)</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Compare Modal */}
      <CompareModal 
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
      />
    </div>
  );
}
