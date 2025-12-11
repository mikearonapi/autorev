'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '@/app/page.module.css';

// AI-generated images (owned/licensed) - Dodge Viper overhead shot
const heroImageUrl = '/images/pages/home-hero.jpg';

// Cycling hero messages - punchy and to the point
const heroMessages = [
  'Explore sports cars and learn what makes them tick.',
  'Find the perfect match for your goals.',
  'Plan performance builds that deliver real results.',
  'Save favorites and compare options in your garage.',
];

// Quick Stats - Key metrics to build trust
const quickStats = [
  { value: '98', label: 'Sports Cars Analyzed', suffix: '+' },
  { value: '50', label: 'Upgrade Modules', suffix: '+' },
  { value: '7', label: 'Performance Categories', suffix: '' },
  { value: '24', label: 'Expert Sources Cited', suffix: '+' },
];

export default function HeroSection() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const cycleInterval = setInterval(() => {
      // Fade out
      setIsVisible(false);
      
      // After fade out, change message and fade in
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % heroMessages.length);
        setIsVisible(true);
      }, 500); // Half second for fade out
    }, 3750); // 3.75 seconds per message (including transitions)

    return () => clearInterval(cycleInterval);
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
          Unleash Your<br />
          <span className={styles.heroAccent}>Racing Spirit</span>
        </h1>
        <p className={`${styles.heroSubtitle} ${styles.cyclingText} ${isVisible ? styles.visible : styles.hidden}`}>
          {heroMessages[currentMessageIndex]}
        </p>
      </div>
      <div className={styles.heroScroll}>
        <span>Scroll to explore</span>
        <div className={styles.scrollIndicator} />
      </div>
      
      {/* Quick Stats Bar */}
      <div className={styles.quickStatsBar}>
        {quickStats.map((stat, index) => (
          <div key={index} className={styles.quickStat}>
            <span className={styles.quickStatValue}>
              {stat.value}
              {stat.suffix && <span className={styles.quickStatSuffix}>{stat.suffix}</span>}
            </span>
            <span className={styles.quickStatLabel}>{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
