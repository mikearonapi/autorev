'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import SportsCarComparison from '@/components/SportsCarComparison';
import ScrollIndicator from '@/components/ScrollIndicator';
import styles from './page.module.css';

// Carousel images - Top 15 highest-scoring cars by AutoRev scoring criteria
// Generated with gpt-image-1 using reference image for consistent styling
// Cache bust: v5 - new gpt-image-1 generated images (Dec 11, 2024)
const BLOB_BASE = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com';
const CACHE_BUST = '?v=5';
const carouselImages = [
  // Rank 1: Score 8.46
  { src: `${BLOB_BASE}/carousel/c8-corvette-stingray.webp${CACHE_BUST}`, alt: 'C8 Corvette Stingray', name: 'C8 CORVETTE STINGRAY' },
  // Rank 2: Score 8.44
  { src: `${BLOB_BASE}/carousel/718-cayman-gt4.webp${CACHE_BUST}`, alt: 'Porsche 718 Cayman GT4', name: '718 CAYMAN GT4' },
  // Rank 3: Score 8.40
  { src: `${BLOB_BASE}/carousel/c7-corvette-grand-sport.webp${CACHE_BUST}`, alt: 'C7 Corvette Grand Sport', name: 'C7 GRAND SPORT' },
  // Rank 4: Score 8.39
  { src: `${BLOB_BASE}/carousel/camaro-zl1.webp${CACHE_BUST}`, alt: 'Chevrolet Camaro ZL1', name: 'CAMARO ZL1' },
  // Rank 5: Score 8.36
  { src: `${BLOB_BASE}/carousel/981-cayman-gts.webp${CACHE_BUST}`, alt: 'Porsche 981 Cayman GTS', name: '981 CAYMAN GTS' },
  // Rank 6: Score 8.36
  { src: `${BLOB_BASE}/carousel/c6-corvette-grand-sport.webp${CACHE_BUST}`, alt: 'C6 Corvette Grand Sport', name: 'C6 GRAND SPORT' },
  // Rank 7: Score 8.34
  { src: `${BLOB_BASE}/carousel/c5-corvette-z06.webp${CACHE_BUST}`, alt: 'C5 Corvette Z06', name: 'C5 Z06' },
  // Rank 8: Score 8.34
  { src: `${BLOB_BASE}/carousel/civic-type-r-fl5.webp${CACHE_BUST}`, alt: 'Honda Civic Type R FL5', name: 'CIVIC TYPE R' },
  // Rank 9: Score 8.31
  { src: `${BLOB_BASE}/carousel/718-cayman-gts-40.webp${CACHE_BUST}`, alt: 'Porsche 718 Cayman GTS 4.0', name: '718 GTS 4.0' },
  // Rank 10: Score 8.31
  { src: `${BLOB_BASE}/carousel/cts-v-gen3.webp${CACHE_BUST}`, alt: 'Cadillac CTS-V', name: 'CTS-V' },
  // Rank 11: Score 8.30
  { src: `${BLOB_BASE}/carousel/c6-corvette-z06.webp${CACHE_BUST}`, alt: 'C6 Corvette Z06', name: 'C6 Z06' },
  // Rank 12: Score 8.27
  { src: `${BLOB_BASE}/carousel/mustang-gt-pp2.webp${CACHE_BUST}`, alt: 'Ford Mustang GT PP2', name: 'MUSTANG GT PP2' },
  // Rank 13: Score 8.24
  { src: `${BLOB_BASE}/carousel/981-cayman-s.webp${CACHE_BUST}`, alt: 'Porsche 981 Cayman S', name: '981 CAYMAN S' },
  // Rank 14: Score 8.21
  { src: `${BLOB_BASE}/carousel/c7-corvette-z06.webp${CACHE_BUST}`, alt: 'C7 Corvette Z06', name: 'C7 Z06' },
  // Rank 15: Score 8.21
  { src: `${BLOB_BASE}/carousel/camaro-ss-1le.webp${CACHE_BUST}`, alt: 'Chevrolet Camaro SS 1LE', name: 'CAMARO SS 1LE' },
];

export default function CarSelector() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance carousel every 1.5 seconds
  // Image, name, and dot all change at exactly the same moment
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % carouselImages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const currentImage = carouselImages[currentIndex];

  return (
    <div className={styles.page} data-no-main-offset>
      {/* Hero Section with Carousel */}
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          {/* All images rendered, crossfade via opacity - no flash */}
          {carouselImages.map((image, idx) => (
            <Image
              key={image.src}
              src={image.src}
              alt={image.alt}
              fill
              priority={idx < 3} // Prioritize first few images
              quality={85}
              className={`${styles.heroImage} ${idx === currentIndex ? styles.heroImageActive : ''}`}
              sizes="100vw"
            />
          ))}
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              Find Your<br />
              <span className={styles.titleAccent}>Perfect Match</span>
            </h1>
            <p className={styles.subtitle}>
              Find the car that fits your goals—not someone else&apos;s Instagram. 
              Tell us what actually matters to you, and we&apos;ll match you with 
              the right car. Real ownership insights from drivers who walk the walk.
            </p>
            
            {/* Carousel indicator showing current car */}
            <div className={styles.carouselIndicator}>
              <span key={currentIndex} className={styles.carouselCarName}>{currentImage.name}</span>
              <div className={styles.carouselDots}>
                {carouselImages.map((_, idx) => (
                  <button
                    key={idx}
                    className={`${styles.carouselDot} ${idx === currentIndex ? styles.carouselDotActive : ''}`}
                    onClick={() => setCurrentIndex(idx)}
                    aria-label={`View ${carouselImages[idx].name}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <ScrollIndicator />
      </section>

      {/* Sports Car Selector Tool */}
      <section id="selector" className={styles.tool}>
        <SportsCarComparison />
      </section>

    </div>
  );
}
