/**
 * FeaturePhoneShowcase Component
 * 
 * Displays 3 iPhone frames showcasing core features:
 * - My Garage (car tracking) - 5 images cycling
 * - Tuning Shop (build planning) - 6 images cycling
 * - AL (AI assistant) - 5 images cycling
 * 
 * Each feature auto-rotates through screenshots with smooth dissolve transitions.
 * Images sourced from /images/onboarding/ folder.
 * 
 * Responsive design:
 * - Desktop (≥1024px): 3 phones in a row, full size
 * - Tablet (768px-1023px): 3 phones, 90% scale
 * - Mobile (<768px): Stack vertically, 75% scale, centered
 */

'use client';

import IPhoneFrame from './IPhoneFrame';
import ImageCarousel from './ImageCarousel';
import AdvancedImageCarousel from './AdvancedImageCarousel';
import styles from './FeaturePhoneShowcase.module.css';

// Image paths for each feature (using onboarding screenshots)
const GARAGE_IMAGES = [
  '/images/onboarding/garage-01-hero.png',
  '/images/onboarding/garage-02-details.png',
  '/images/onboarding/garage-03-reference.png',
  '/images/onboarding/garage-04-safety.png',
  '/images/onboarding/garage-05-health.png'
];

const TUNING_IMAGES = [
  '/images/onboarding/tuning-shop-01-overview.png',
  '/images/onboarding/tuning-shop-02-config-wheels.png',
  '/images/onboarding/tuning-shop-03-presets.png',
  '/images/onboarding/tuning-shop-04-power-list.png',
  '/images/onboarding/tuning-shop-05-part-detail.png',
  '/images/onboarding/tuning-shop-06-metrics.png'
];

const AL_IMAGES = [
  '/images/onboarding/ai-al-01-intro.png',
  '/images/onboarding/ai-al-02-empty.png',
  '/images/onboarding/ai-al-03-thinking.png',
  '/images/onboarding/ai-al-04-response-mods.png',
  '/images/onboarding/ai-al-05-response-analysis.png'
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
                  interval={2800}
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
                  interval={2800}
                />
              </IPhoneFrame>
            </div>
            <h3 className={styles.featureTitle}>Plan Your Build</h3>
            <p className={styles.featureDescription}>
              See what parts fit your car. Explore mod tiers and projected performance gains.
            </p>
          </div>
          
          {/* Phone 3: AL Chat - Faster pace for buildup (intro, empty, thinking), slower for responses */}
          <div className={styles.phoneCard}>
            <div className={styles.phoneWrapper}>
              <IPhoneFrame size="small">
                <AdvancedImageCarousel 
                  images={AL_IMAGES}
                  alt="AL AI assistant"
                  displayDurations={[1500, 1500, 1500, 3000, 3000]}
                  transitionDuration={800}
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

