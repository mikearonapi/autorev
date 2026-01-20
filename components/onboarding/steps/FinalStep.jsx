'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './FinalStep.module.css';

/**
 * FinalStep Component
 * 
 * Clean final step with just the logo and Get Started button.
 * Simple, bold, no personalization.
 * Takes user directly to their garage.
 * 
 * @param {Object} props
 * @param {string} props.className - CSS class name for animation
 * @param {Function} props.onComplete - Called when user clicks Get Started
 */
export default function FinalStep({ 
  className,
  onComplete,
}) {
  const router = useRouter();
  const [showButton, setShowButton] = useState(false);

  // Show button after short delay for smooth entrance
  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    onComplete?.();
    router.push('/garage');
  };

  return (
    <div className={`${className || ''} ${styles.container}`}>
      {/* Centered Brand Logo */}
      <div className={styles.brandContainer}>
        <h1 className={styles.brandTitle}>
          <span className={styles.brandAuto}>AUTO</span>
          <span className={styles.brandRev}>REV</span>
        </h1>
      </div>

      {/* CTA to Garage */}
      <button 
        className={`${styles.ctaButton} ${showButton ? styles.visible : ''}`}
        onClick={handleGetStarted}
        disabled={!showButton}
      >
        Enter Your Garage
      </button>
    </div>
  );
}
