/**
 * FeaturePhoneShowcase Component
 * 
 * Displays 3 iPhone frames showcasing core features:
 * - My Garage (car tracking)
 * - Tuning Shop (build planning)
 * - AL (AI assistant)
 * 
 * Responsive design:
 * - Desktop (≥1024px): 3 phones in a row, full size
 * - Tablet (768px-1023px): 3 phones, 90% scale
 * - Mobile (<768px): Stack vertically, 75% scale, centered
 */

'use client';

import IPhoneFrame from './IPhoneFrame';
import styles from './FeaturePhoneShowcase.module.css';

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
                <div className={styles.placeholderScreen}>
                  <div className={styles.placeholderContent}>
                    <svg className={styles.placeholderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span className={styles.placeholderText}>My Garage</span>
                    <span className={styles.placeholderSubtext}>Screenshot Coming Soon</span>
                  </div>
                </div>
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
                <div className={styles.placeholderScreen}>
                  <div className={styles.placeholderContent}>
                    <svg className={styles.placeholderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                    <span className={styles.placeholderText}>Tuning Shop</span>
                    <span className={styles.placeholderSubtext}>Screenshot Coming Soon</span>
                  </div>
                </div>
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
                <div className={styles.placeholderScreen}>
                  <div className={styles.placeholderContent}>
                    <svg className={styles.placeholderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      <path d="M8 10h.01M12 10h.01M16 10h.01"/>
                    </svg>
                    <span className={styles.placeholderText}>AL</span>
                    <span className={styles.placeholderSubtext}>Screenshot Coming Soon</span>
                  </div>
                </div>
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

