'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '@/app/(marketing)/page.module.css';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import ScrollIndicator from '@/components/ScrollIndicator';

// Hero image - Compressed blob version (238KB vs 2.4MB local)
const heroImageUrl = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/pages/home/hero.webp';

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
          quality={75}
          className={styles.heroImage}
          sizes="100vw"
          fetchPriority="high"
        />
      </div>
      <div className={styles.heroOverlay} />
      {/* Main headline + subtitle - centered on car */}
      <div className={styles.heroHeadlines}>
        <h1 className={styles.heroTitle}>
          Find What <span className={styles.heroAccent}>Drives You</span>
        </h1>
        <p className={styles.heroSubtitle}>
          The AI-powered research platform for sports car enthusiasts — like having the obsessive car nerd in your pocket who&apos;s done all the research and never forgets anything.
        </p>
        <p className={styles.heroJarvisTag}>
          Tony Stark had Jarvis. Now you have <span className={styles.heroAccent}>AL</span>.
        </p>
      </div>
      
      {/* CTA button - positioned in shadow below car */}
      <div className={styles.heroCta}>
        <button onClick={handleCtaClick} className={styles.heroJoinButton}>
          Join the auto
          <span className={styles.heroRevText}>rev</span>
          <span className={`${styles.heroJoinSuffix} ${suffixVisible ? styles.heroJoinSuffixVisible : ''}`}>
            {brandSuffixes[suffixIndex]}
          </span>
        </button>
      </div>
      
      {/* Tagline - positioned at 85% */}
      <div className={styles.heroBottom}>
        <p className={styles.heroTagline}>
          Research. Own. Build. Connect. Learn. — {carCount || 188} cars and counting.
        </p>
      </div>
      
      {/* Scroll Indicator - positioned at 90% */}
      <ScrollIndicator className={styles.heroScrollIndicator} />
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModal.isOpen}
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />
    </section>
  );
}
