'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import styles from '@/app/page.module.css';
import { carData } from '@/data/cars.js';
import upgradeDetails from '@/data/upgradeEducation.js';
import { usePlatformStats } from '@/hooks/usePlatformStats';
import AuthModal, { useAuthModal } from '@/components/AuthModal';

// Hero image - Dodge Viper overhead shot
const heroImageUrl = '/images/pages/home-hero.jpg';

// Brand suffix rotation: Revival → Revelation → Revolution
const brandSuffixes = ['ival', 'elation', 'olution'];

export default function HeroSection() {
  const [suffixIndex, setSuffixIndex] = useState(0);
  const [suffixVisible, setSuffixVisible] = useState(true);
  
  // Auth modal (for potential future use)
  const authModal = useAuthModal();
  
  // Platform stats from database (with fallbacks to local data)
  const { stats } = usePlatformStats();

  // Dynamic stats pulled from database or local fallback
  const quickStats = useMemo(() => {
    const carCount = stats?.cars || carData?.length || 98;
    const upgradeCount = Object.keys(upgradeDetails || {}).length || 77;
    
    return [
      { value: String(carCount), label: 'Sports Cars', suffix: '' },
      { value: String(upgradeCount), label: 'Upgrade Guides', suffix: '+' },
      { value: 'Miatas to GT3s', label: 'From', suffix: '', isText: true },
      { value: 'Every Service', label: 'Know', suffix: '', isText: true },
    ];
  }, [stats]);

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

  // Handle join button click - always navigates to join page
  const handleJoinClick = (e) => {
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
        <button onClick={handleJoinClick} className={styles.heroJoinButton}>
          Join the auto <span className={styles.heroRevWord}><span className={styles.heroAccent}>rev</span><span className={`${styles.heroAccent} ${styles.heroBrandSuffix} ${suffixVisible ? styles.suffixVisible : styles.suffixHidden}`}>{brandSuffixes[suffixIndex]}</span></span>
        </button>
      </div>
      
      {/* Quick Stats Bar - Dynamic values from actual data */}
      <div className={styles.quickStatsBar}>
        {quickStats.map((stat, index) => (
          <div key={index} className={`${styles.quickStat} ${stat.isText ? styles.quickStatText : ''}`}>
            {stat.isText ? (
              <>
                <span className={styles.quickStatLabel}>{stat.label}</span>
                <span className={styles.quickStatValue}>{stat.value}</span>
              </>
            ) : (
              <>
                <span className={styles.quickStatValue}>
                  {stat.value}
                  {stat.suffix && <span className={styles.quickStatSuffix}>{stat.suffix}</span>}
                </span>
                <span className={styles.quickStatLabel}>{stat.label}</span>
              </>
            )}
          </div>
        ))}
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
