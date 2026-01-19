import React from 'react';
import Image from 'next/image';
import styles from './LoadingSpinner.module.css';

/**
 * Unified loading spinner component for the entire app
 * 
 * Two variants:
 * - 'simple' (default): Clean spinner rings for inline/component loading
 * - 'branded': AutoRev logo with spinning ring for full-page loading
 * 
 * @param {Object} props
 * @param {string} [props.text] - Primary loading text (e.g., "Loading your garage...")
 * @param {string} [props.subtext] - Secondary text for branded variant (e.g., "Verifying session...")
 * @param {string} [props.size='medium'] - Size: 'small' | 'medium' | 'large'
 * @param {boolean} [props.fullPage=false] - Whether to center in full viewport
 * @param {'simple'|'branded'} [props.variant='simple'] - Visual style
 */
export default function LoadingSpinner({ 
  text = 'Loading...', 
  subtext,
  size = 'medium', 
  fullPage = false,
  variant = 'simple'
}) {
  // Branded variant - premium loading with AutoRev logo
  if (variant === 'branded') {
    return (
      <div className={`${styles.brandedContainer} ${fullPage ? styles.fullPage : ''}`}>
        <div className={styles.logoWrapper}>
          <Image 
            src="/images/autorev-logo-white.png" 
            alt="AutoRev"
            width={56}
            height={56}
            className={styles.logoImage}
            priority
          />
          <div className={styles.logoRing} />
        </div>
        {text && <h3 className={styles.brandedTitle}>{text}</h3>}
        {subtext && <p className={styles.brandedSubtext}>{subtext}</p>}
      </div>
    );
  }

  // Simple variant - clean spinner rings
  return (
    <div className={`${styles.container} ${fullPage ? styles.fullPage : ''}`}>
      <div className={`${styles.spinner} ${styles[size]}`}>
        <div className={styles.ring}></div>
        <div className={styles.ring}></div>
        <div className={styles.ring}></div>
      </div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );
}

