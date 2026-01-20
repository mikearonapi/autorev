import React from 'react';
import Image from 'next/image';
import styles from './LoadingSpinner.module.css';

/**
 * Branded AutoRev Logo Loader
 * Teal perimeter ring with AutoRev logo in the center
 */
function BrandedLogoLoader({ size = 120 }) {
  return (
    <div className={styles.brandedLoaderWrapper} style={{ width: size, height: size }}>
      {/* Teal perimeter ring SVG */}
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
          stroke="rgba(16, 185, 129, 0.1)" 
          strokeWidth="1" 
          fill="none"
        />
        
        {/* Main teal ring - animated */}
        <circle 
          cx="50" cy="50" r="44" 
          stroke="#10b981" 
          strokeWidth="2" 
          fill="none"
          strokeDasharray="200 276"
          strokeLinecap="round"
          className={styles.tealRingAnimated}
        />
        
        {/* Secondary teal ring - counter rotate */}
        <circle 
          cx="50" cy="50" r="38" 
          stroke="rgba(16, 185, 129, 0.4)" 
          strokeWidth="1.5" 
          fill="none"
          strokeDasharray="120 238"
          strokeLinecap="round"
          className={styles.tealRingCounter}
        />
        
        {/* Inner subtle ring */}
        <circle 
          cx="50" cy="50" r="32" 
          stroke="rgba(16, 185, 129, 0.15)" 
          strokeWidth="1" 
          fill="none"
        />
      </svg>
      
      {/* AutoRev logo in center */}
      <div className={styles.logoCenter}>
        <Image
          src="/images/autorev-logo-white.png"
          alt="AutoRev"
          width={60}
          height={60}
          className={styles.logoImage}
          priority
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
 * - 'branded': AutoRev gauge icon with animations for full-page loading
 * 
 * Brand colors:
 * - Teal (#10b981) for all loading indicators
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

