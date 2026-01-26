'use client';

/**
 * HeroCta - Client component for the animated CTA button
 * 
 * Extracted from HeroSection to allow server-rendering of the hero image.
 * This component handles only the animated brand suffix: Revival → Revelation → Revolution
 */

import { useState, useEffect } from 'react';

import styles from '@/app/(marketing)/page.module.css';

// Brand suffix rotation: Revival → Revelation → Revolution
const brandSuffixes = ['ival', 'elation', 'olution'];

export default function HeroCta() {
  const [suffixIndex, setSuffixIndex] = useState(0);
  const [suffixVisible, setSuffixVisible] = useState(true);

  // Cycle through brand suffixes every 1.5 seconds
  useEffect(() => {
    const suffixInterval = setInterval(() => {
      setSuffixVisible(false);
      setTimeout(() => {
        setSuffixIndex((prev) => (prev + 1) % brandSuffixes.length);
        setSuffixVisible(true);
      }, 300);
    }, 1500);

    return () => clearInterval(suffixInterval);
  }, []);

  // Handle CTA button click - Build Pivot: Go to My Build
  const handleCtaClick = (e) => {
    e.preventDefault();
    window.location.href = '/garage/my-build';
  };

  // Handle secondary CTA click
  const handleSecondaryClick = (e) => {
    e.preventDefault();
    window.location.href = '/community/builds';
  };

  return (
    <div className={styles.heroCta}>
      <button onClick={handleCtaClick} className={styles.heroJoinButton}>
        Start Building
      </button>
      <button onClick={handleSecondaryClick} className={styles.heroSecondaryButton}>
        Browse Community Builds
      </button>
    </div>
  );
}
