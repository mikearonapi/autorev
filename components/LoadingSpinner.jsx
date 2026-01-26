import React from 'react';

import Image from 'next/image';

import { LOGO_TRANSPARENT } from '@/lib/brandLogos';

import styles from './LoadingSpinner.module.css';

/**
 * Branded AutoRev Logo Loader
 * Lime perimeter ring with AutoRev logo in the center
 */
function BrandedLogoLoader({ size = 140 }) {
  return (
    <div className={styles.brandedLoaderWrapper} style={{ width: size, height: size }}>
      {/* Lime perimeter ring SVG */}
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={styles.perimeterRing}
      >
        {/* Outer subtle ring */}
        <circle 
          cx="50" cy="50" r="48" 
          stroke="rgba(212, 255, 0, 0.1)" 
          strokeWidth="1" 
          fill="none"
        />
        
        {/* Main lime ring - animated */}
        <circle 
          cx="50" cy="50" r="44" 
          stroke="#d4ff00" 
          strokeWidth="2" 
          fill="none"
          strokeDasharray="200 276"
          strokeLinecap="round"
          className={styles.limeRingAnimated}
        />
        
        {/* Secondary lime ring - counter rotate */}
        <circle 
          cx="50" cy="50" r="38" 
          stroke="rgba(212, 255, 0, 0.4)" 
          strokeWidth="1.5" 
          fill="none"
          strokeDasharray="120 238"
          strokeLinecap="round"
          className={styles.limeRingCounter}
        />
        
        {/* Inner subtle ring */}
        <circle 
          cx="50" cy="50" r="32" 
          stroke="rgba(212, 255, 0, 0.15)" 
          strokeWidth="1" 
          fill="none"
        />
      </svg>
      
      {/* AutoRev logo in center (from Vercel Blob CDN) */}
      <div className={styles.logoCenter}>
        <Image
          src={LOGO_TRANSPARENT}
          alt="AutoRev"
          width={70}
          height={47}
          className={styles.logoImage}
          priority
          unoptimized
        />
      </div>
    </div>
  );
}

/**
 * Unified loading spinner component for the entire app
 * 
 * Two variants:
 * - 'simple' (default): Clean spinner rings for inline/component loading
 * - 'branded': AutoRev wordmark logo with lime rings for full-page loading
 * 
 * Brand colors:
 * - Lime (#d4ff00) for branded loading indicators
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
        <BrandedLogoLoader size={120} />
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

