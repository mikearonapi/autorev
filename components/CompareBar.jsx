'use client';

/**
 * Floating Compare Bar
 * 
 * A persistent bar at the bottom of the screen that appears
 * when cars are added to the compare list. Works site-wide.
 * 
 * Now fetches car data from database via carsClient.
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CompareBar.module.css';
import { useCompare } from '@/components/providers/CompareProvider';
import { getCarHeroImage } from '@/lib/images';
import { fetchCars } from '@/lib/carsClient';
import CompareModal from './CompareModal';
import { useAIChat } from '@/components/AIChatContext';
import { Icons } from '@/components/ui/Icons';

export default function CompareBar() {
  const { cars, count, maxCars, removeFromCompare, clearAll, isHydrated, showCompareModal, setShowCompareModal } = useCompare();
  const [isExpanded, setIsExpanded] = useState(false);
  const [allCars, setAllCars] = useState([]);
  
  // AL chat integration for decision help
  const { openChatWithPrompt } = useAIChat();

  // Fetch car data from database on mount
  useEffect(() => {
    fetchCars().then(setAllCars).catch(console.error);
  }, []);

  // Get full car data for images (from database)
  // Must be called before any conditional returns to satisfy React hooks rules
  const carsWithImages = useMemo(() => {
    return cars.map(car => {
      const fullCar = allCars.find(c => c.slug === car.slug);
      return fullCar || car;
    });
  }, [cars, allCars]);

  // Don't show until hydrated or if no cars
  if (!isHydrated || count === 0) {
    return null;
  }

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
            <>
              <button 
                onClick={() => {
                  const carNames = carsWithImages.map(c => c.name).join(' vs ');
                  openChatWithPrompt(
                    `Compare ${carNames} - help me decide which is the better choice for my needs. Consider performance, reliability, ownership costs, and driving experience.`,
                    { category: 'Comparison' },
                    `Help me choose between ${carsWithImages.map(c => c.name).join(' and ')}`
                  );
                }}
                className={styles.askAlButton}
                title="Ask AL to help decide"
              >
                <Icons.sparkle size={14} />
                <span className={styles.askAlText}>Ask AL</span>
              </button>
              <button 
                onClick={() => setShowCompareModal(true)}
                className={styles.compareButton}
              >
                Compare Now
              </button>
            </>
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
              <Link href="/garage" className={styles.addMore}>
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
