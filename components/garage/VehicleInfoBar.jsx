'use client';

/**
 * VehicleInfoBar Component
 * 
 * Displays vehicle info at the top of My Build/Performance/Parts pages.
 * NOT in the header - sits below the navigation as a content element.
 * 
 * Layout: [Image] [Name + Subtitle] [Page-specific stat]
 * 
 * Hero Image Priority:
 * 1. User's custom hero image (heroImageUrl prop)
 * 2. Stock car image (CarImage component)
 */

import React from 'react';
import Image from 'next/image';
import CarImage from '@/components/CarImage';
import styles from './VehicleInfoBar.module.css';
import { Icons } from '@/components/ui/Icons';

/**
 * VehicleInfoBar
 * 
 * @param {Object} car - The car object
 * @param {string} buildName - Optional build name to display as primary
 * @param {React.ReactNode} stat - Page-specific stat component
 * @param {string} heroImageUrl - Optional user's custom hero image URL (takes priority over stock)
 */
export default function VehicleInfoBar({ 
  car,
  buildName,
  stat,
  heroImageUrl,
}) {
  if (!car) return null;
  
  const displayName = buildName || car.name;
  const subtitle = buildName ? car.name : car.years;
  
  return (
    <div className={styles.container}>
      {/* Car Thumbnail - User hero image takes priority over stock */}
      <div className={styles.thumbnail}>
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt={displayName || 'Vehicle'}
            fill
            style={{ objectFit: 'cover' }}
            sizes="60px"
          />
        ) : (
          <CarImage car={car} variant="thumbnail" showName={false} />
        )}
      </div>
      
      {/* Name & Subtitle */}
      <div className={styles.info}>
        <span className={styles.name}>{displayName}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      
      {/* Page-specific stat */}
      {stat && (
        <div className={styles.stat}>
          {stat}
        </div>
      )}
    </div>
  );
}

/**
 * Pre-built stat components for each page
 */

// My Build: Shows upgrade count (teal = positive/improvements)
export function UpgradeCountStat({ count }) {
  if (!count && count !== 0) return null;
  return (
    <div className={styles.statBadge} data-color="teal">
      <Icons.wrench size={14} />
      <span>{count} upgrade{count !== 1 ? 's' : ''}</span>
    </div>
  );
}

// My Performance: Shows HP gain
export function HpGainStat({ hpGain, totalHp }) {
  if (!hpGain || hpGain <= 0) {
    return totalHp ? (
      <div className={styles.statBadge} data-color="neutral">
        <span>{totalHp} HP</span>
      </div>
    ) : null;
  }
  return (
    <div className={styles.statBadge} data-color="green">
      <Icons.bolt size={14} />
      <span>+{hpGain} HP</span>
    </div>
  );
}

// My Parts: Shows parts count
export function PartsCountStat({ count, total }) {
  if (total === 0) return null;
  return (
    <div className={styles.statBadge} data-color="yellow">
      <Icons.shoppingCart size={14} />
      <span>{count}/{total} parts</span>
    </div>
  );
}
