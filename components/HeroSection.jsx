'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '@/app/page.module.css';
import AuthModal, { useAuthModal } from '@/components/AuthModal';

// Hero image - Dodge Viper overhead shot
const heroImageUrl = '/images/pages/home-hero.jpg';

// Brand suffix rotation: Revival → Revelation → Revolution
const brandSuffixes = ['ival', 'elation', 'olution'];

export default function HeroSection({ carCount = 188 }) {
  const [suffixIndex, setSuffixIndex] = useState(0);
  const [suffixVisible, setSuffixVisible] = useState(true);
  
  // Auth modal (for potential future use)
  const authModal = useAuthModal();

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

  // Handle CTA button click
  const handleCtaClick = (e) => {
    e.preventDefault();
    window.location.href = '/join';
  };

  return (
    <section className={styles.hero}>
      <div className={styles.heroImageWrapper}>
        <Image
          src={heroImageUrl}
          alt="718 Cayman GT4 RS rear view with glowing taillights in dramatic studio lighting"
          fill
          priority
          quality={90}
          className={styles.heroImage}
          sizes="100vw"
        />
      </div>
      <div className={styles.heroOverlay} />
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>
          Find What<br />
          <span className={styles.heroAccent}>Drives You</span>
        </h1>
        <p className={styles.heroSubtitle}>
          The sports car research platform for buyers and builders.<br />
          Research. Track. Build. Learn. — {carCount || 188} cars and counting.
        </p>
        <button onClick={handleCtaClick} className={styles.heroJoinButton}>
          Join the autorev
          <span className={`${styles.heroJoinSuffix} ${suffixVisible ? styles.heroJoinSuffixVisible : ''}`}>
            {brandSuffixes[suffixIndex]}
          </span>
        </button>
      </div>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModal.isOpen}
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />
    </section>
  );
}
