/**
 * FeaturePhoneShowcase Component
 * 
 * Displays 3 iPhone frames showcasing core features:
 * - My Garage (car tracking) - 2 images cycling
 * - Tuning Shop (build planning) - 4 images cycling
 * - AL (AI assistant) - 4 images cycling
 * 
 * Each feature auto-rotates through screenshots with smooth dissolve transitions.
 * 
 * Responsive design:
 * - Desktop (≥1024px): 3 phones in a row, full size
 * - Tablet (768px-1023px): 3 phones, 90% scale
 * - Mobile (<768px): Stack vertically, 75% scale, centered
 */

'use client';

import IPhoneFrame from './IPhoneFrame';
import ImageCarousel from './ImageCarousel';
import styles from './FeaturePhoneShowcase.module.css';

// Image paths for each feature
const GARAGE_IMAGES = [
  '/images/iphone-Garage-01-Favorites.png',
  '/images/iphone-Garage-02-Details.png'
];

const TUNING_IMAGES = [
  '/images/iphone-Tuning-Shop-01-Shop.png',
  '/images/iphone-Tuning-Shop-02-Performance.png',
  '/images/iphone-Tuning-Shop-03- Power.png',
  '/images/iphone-Tuning-Shop-04-Learn-More.png'
];

const AL_IMAGES = [
  '/images/iphone-AI-AL-01.png',
  '/images/iphone-AI-Al-02-Chat.png',
  '/images/iphone-AI-AL-03-Search.png',
  '/images/iphone-AI-AL-04-Response.png'
];

export default function FeaturePhoneShowcase() {
  return (
    <section className={styles.showcase}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>REAL DATA. REAL INSIGHTS.</h2>
          <p className={styles.subtitle}>
            See how AutoRev helps you research, track, and build.
          </p>
        </div>
        
        <div className={styles.phoneGrid}>
          {/* Phone 1: My Garage */}
          <div className={styles.phoneCard}>
            <div className={styles.phoneWrapper}>
              <IPhoneFrame size="small">
                <ImageCarousel 
                  images={GARAGE_IMAGES}
                  alt="My Garage feature"
                  interval={3000}
                />
              </IPhoneFrame>
            </div>
            <h3 className={styles.featureTitle}>Your Personal Garage</h3>
            <p className={styles.featureDescription}>
              Track cars you own and love. Get specs, maintenance schedules, and market values.
            </p>
          </div>
          
          {/* Phone 2: Tuning Shop */}
          <div className={styles.phoneCard}>
            <div className={styles.phoneWrapper}>
              <IPhoneFrame size="small">
                <ImageCarousel 
                  images={TUNING_IMAGES}
                  alt="Tuning Shop feature"
                  interval={3000}
                />
              </IPhoneFrame>
            </div>
            <h3 className={styles.featureTitle}>Plan Your Build</h3>
            <p className={styles.featureDescription}>
              See what parts fit your car. Explore mod tiers and projected performance gains.
            </p>
          </div>
          
          {/* Phone 3: AL Chat */}
          <div className={styles.phoneCard}>
            <div className={styles.phoneWrapper}>
              <IPhoneFrame size="small">
                <ImageCarousel 
                  images={AL_IMAGES}
                  alt="AL AI assistant"
                  interval={3000}
                />
              </IPhoneFrame>
            </div>
            <h3 className={styles.featureTitle}>Ask AL Anything</h3>
            <p className={styles.featureDescription}>
              Your AI co-pilot with access to specs, known issues, and expert video reviews.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

