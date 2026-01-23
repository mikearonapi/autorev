'use client';

/**
 * VehicleHealthCard Component
 * 
 * Compact vehicle status card showing key health indicators.
 * Part of the Whoop-inspired insights dashboard.
 */

import Link from 'next/link';
import styles from './VehicleHealthCard.module.css';

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const BoltIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

export default function VehicleHealthCard({ vehicle }) {
  const {
    id,
    name,
    year,
    make,
    model,
    slug,
    garageScore,
    hpGain,
    modCount,
  } = vehicle;
  
  // Determine score color
  const getScoreColor = (score) => {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#64748b';
  };
  
  return (
    <Link href={slug ? `/car/${slug}` : `/garage?vehicle=${id}`} className={styles.link}>
      <div className={styles.card}>
        <div className={styles.content}>
          <div className={styles.vehicleInfo}>
            <h3 className={styles.vehicleName}>{name}</h3>
            <span className={styles.vehicleSpec}>{year} {make}</span>
          </div>
          
          <div className={styles.stats}>
            {hpGain > 0 && (
              <div className={styles.stat}>
                <span className={styles.statValue} style={{ color: '#10b981' }}>
                  <BoltIcon />
                  +{hpGain}
                </span>
                <span className={styles.statLabel}>HP</span>
              </div>
            )}
            
            <div className={styles.stat}>
              <span className={styles.statValue}>{modCount}</span>
              <span className={styles.statLabel}>Mods</span>
            </div>
            
            <div className={styles.stat}>
              <span 
                className={styles.statValue}
                style={{ color: getScoreColor(garageScore) }}
              >
                {garageScore}
              </span>
              <span className={styles.statLabel}>Score</span>
            </div>
          </div>
        </div>
        
        <div className={styles.chevron}>
          <ChevronRight />
        </div>
      </div>
    </Link>
  );
}
