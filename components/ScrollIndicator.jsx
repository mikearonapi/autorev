'use client';

import { useEffect, useState } from 'react';

import styles from './ScrollIndicator.module.css';

/**
 * Animated scroll indicator for hero sections
 * Provides a visual cue that users can scroll for more content
 */
export default function ScrollIndicator({ className = '' }) {
  const [isVisible, setIsVisible] = useState(true);

  // Hide the indicator once user scrolls past a threshold
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Fade out after scrolling 100px
      setIsVisible(scrollY < 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollDownClick = () => {
    if (typeof window === 'undefined') return;
    // Scroll down smoothly by viewport height minus header
    window.scrollBy({
      top: window.innerHeight * 0.8,
      behavior: 'smooth'
    });
  };

  return (
    <button 
      className={`${styles.scrollIndicator} ${isVisible ? styles.visible : styles.hidden} ${className}`}
      onClick={handleScrollDownClick}
      aria-label="Scroll down for more content"
    >
      <div className={styles.scrollContent}>
        <span className={styles.scrollText}>Scroll</span>
        <div className={styles.scrollIcon}>
          <div className={styles.mouse}>
            <div className={styles.wheel} />
          </div>
          <div className={styles.chevrons}>
            <svg className={styles.chevron} width="16" height="8" viewBox="0 0 16 8" fill="none">
              <path d="M1 1L8 7L15 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <svg className={styles.chevron} width="16" height="8" viewBox="0 0 16 8" fill="none">
              <path d="M1 1L8 7L15 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
}






















