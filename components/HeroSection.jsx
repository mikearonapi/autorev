'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import styles from '@/app/page.module.css';
import { carData } from '@/data/cars.js';
import upgradeDetails from '@/data/upgradeEducation.js';

// AI-generated images (owned/licensed) - Dodge Viper overhead shot
const heroImageUrl = '/images/pages/home-hero.jpg';

// Brand suffix rotation: Revival → Revelation → Revolution
const brandSuffixes = ['ival', 'elation', 'olution'];

export default function HeroSection() {
  const [suffixIndex, setSuffixIndex] = useState(0);
  const [suffixVisible, setSuffixVisible] = useState(true);

  // Dynamic stats pulled from actual data
  const quickStats = useMemo(() => {
    const carCount = carData?.length || 98;
    const upgradeCount = Object.keys(upgradeDetails || {}).length || 77;
    
    return [
      { value: String(carCount), label: 'Sports Cars', suffix: '' },
      { value: String(upgradeCount), label: 'Upgrade Guides', suffix: '+' },
      { value: 'Miatas to GT3s', label: 'From', suffix: '', isText: true },
      { value: 'Every Service', label: 'Know', suffix: '', isText: true },
    ];
  }, []);

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

  return (
    <section className={styles.hero}>
      <div className={styles.heroImageWrapper}>
        <Image
          src={heroImageUrl}
          alt="Dodge Viper ACR overhead view with dramatic lighting"
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
          Join the auto <span className={styles.heroRevWord}><span className={styles.heroAccent}>rev</span><span className={`${styles.heroAccent} ${styles.heroBrandSuffix} ${suffixVisible ? styles.suffixVisible : styles.suffixHidden}`}>{brandSuffixes[suffixIndex]}</span></span>
        </p>
      </div>
      <div className={styles.heroScroll}>
        <span>Scroll to explore</span>
        <div className={styles.scrollIndicator} />
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
    </section>
  );
}
