'use client';

import React from 'react';
import Image from 'next/image';
import { UI_IMAGES } from '@/lib/images';
import styles from './FeatureBreakdown.module.css';

// Icons
const Icons = {
  check: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  minus: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  search: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  ),
  garage: ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <path d="M9 22V12h6v10"/>
    </svg>
  ),
  tool: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  users: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  book: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  sparkle: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"/>
    </svg>
  ),
};

const AlIcon = ({ size = 18 }) => (
  <Image
    src={UI_IMAGES.alMascot}
    alt="AL"
    width={size}
    height={size}
    className={styles.alTableIcon}
    loading="lazy"
  />
);

// Car count for display
const CAR_COUNT = '100+';

// Detailed feature breakdown - audited 2024-12-15 for 100% accuracy
const featureCategories = [
  {
    id: 'discovery',
    name: 'Browse Cars & Find Your Match',
    icon: Icons.search,
    features: [
      { name: `Full ${CAR_COUNT}-car sports car database`, free: true, collector: true, tuner: true },
      { name: 'Car Selector quiz with personalized matches', free: true, collector: true, tuner: true },
      { name: 'Specs, known issues & buying guides', free: true, collector: true, tuner: true },
      { name: 'Expert video reviews & safety ratings', free: true, collector: true, tuner: true },
      { name: 'Side-by-side comparison (up to 4 cars)', free: true, collector: true, tuner: true },
    ],
  },
  {
    id: 'garage',
    name: 'My Garage',
    icon: Icons.garage,
    features: [
      { name: 'Save favorite cars', free: true, collector: true, tuner: true },
      { name: 'Save cars you own', free: true, collector: true, tuner: true },
      { name: 'VIN Decode — identify your exact variant', free: false, collector: true, tuner: true, subsection: 'My Garage Intelligence' },
      { name: "Owner's Reference — oil specs, capacities, fluids", free: false, collector: true, tuner: true },
      { name: 'Maintenance schedules & service intervals', free: false, collector: true, tuner: true },
      { name: 'Service log — track your maintenance history', free: false, collector: true, tuner: true },
      { name: 'Recall alerts — active recalls for your VIN', free: false, collector: true, tuner: true },
      { name: 'Price guides & market position', free: false, collector: true, tuner: true },
    ],
  },
  {
    id: 'builds',
    name: 'Tuning Shop',
    icon: Icons.tool,
    features: [
      { name: 'Browse upgrade packages & mod tiers', free: true, collector: true, tuner: true },
      { name: 'Performance projections (HP/torque gains)', free: true, collector: true, tuner: true },
      { name: 'Popular parts preview', free: true, collector: true, tuner: true },
      { name: 'Full parts catalog with car-specific fitments', free: false, collector: false, tuner: true },
      { name: 'Save & organize build projects', free: false, collector: false, tuner: true },
      { name: 'Build cost calculator', free: false, collector: false, tuner: true },
    ],
  },
  {
    id: 'community',
    name: 'Community',
    icon: Icons.users,
    features: [
      { name: 'Browse & submit car events', free: true, collector: true, tuner: true },
      { name: 'Map & calendar views', free: false, collector: true, tuner: true },
      { name: 'Save events & export to calendar', free: false, collector: true, tuner: true },
    ],
  },
  {
    id: 'encyclopedia',
    name: 'Encyclopedia',
    icon: Icons.book,
    features: [
      { name: 'Automotive systems education', free: true, collector: true, tuner: true },
      { name: 'Modification guides & explanations', free: true, collector: true, tuner: true },
      { name: 'Build paths & learning guides', free: true, collector: true, tuner: true },
    ],
  },
  {
    id: 'ai',
    name: 'AL — Your AI Co-Pilot',
    icon: AlIcon,
    features: [
      { name: 'Monthly conversations', free: '~25', collector: '~75', tuner: '~150' },
      { name: 'Car search & basic questions', free: true, collector: true, tuner: true },
      { name: 'Reviews, reliability & maintenance lookup', free: false, collector: true, tuner: true },
      { name: 'Build recommendations & parts search', free: false, collector: false, tuner: true },
    ],
  },
];

export default function FeatureBreakdown() {
  return (
    <section className={styles.featureBreakdown}>
      <div className={styles.container}>
        <div className={styles.breakdownHeader}>
          <h2>Full Feature <span className={styles.accent}>Breakdown</span></h2>
          <p>Everything included in each tier — we believe in transparency</p>
        </div>

        {/* Tier headers */}
        <div className={styles.breakdownTable}>
          <div className={styles.tableHeader}>
            <div className={styles.tableHeaderCell}>Features</div>
            <div className={`${styles.tableHeaderCell} ${styles.tableTierHeader}`}>
              <span className={styles.tierHeaderName}>Free</span>
              <span className={styles.tierHeaderPrice}>$0</span>
            </div>
            <div className={`${styles.tableHeaderCell} ${styles.tableTierHeader} ${styles.tierHeaderCollector}`}>
              <span className={styles.tierHeaderName}>Enthusiast</span>
              <span className={styles.tierHeaderPrice}>$4.99/mo</span>
            </div>
            <div className={`${styles.tableHeaderCell} ${styles.tableTierHeader} ${styles.tierHeaderTuner}`}>
              <span className={styles.tierHeaderName}>Tuner</span>
              <span className={styles.tierHeaderPrice}>$9.99/mo</span>
            </div>
          </div>

          {/* Feature categories */}
          {featureCategories.map((category) => (
            <div key={category.id} className={styles.tableCategory}>
              <div className={styles.categoryHeader}>
                <category.icon size={18} />
                <span>{category.name}</span>
              </div>
              {category.features.map((feature, idx) => (
                <React.Fragment key={idx}>
                  {feature.subsection && (
                    <div className={styles.subsectionHeader}>
                      <span className={styles.subsectionLine} />
                      <span className={styles.subsectionLabel}><em>{feature.subsection}</em></span>
                      <span className={styles.subsectionLine} />
                    </div>
                  )}
                  <div className={styles.tableRow}>
                    <div className={styles.featureName}>
                      {feature.name}
                      {feature.note && <span className={styles.featureNote}> ({feature.note})</span>}
                    </div>
                    <div className={styles.featureCell}>
                      {feature.note ? (
                        <span className={styles.featureNotIncluded}><Icons.minus size={16} /></span>
                      ) : typeof feature.free === 'string' ? (
                        <span className={styles.featureLimit}>{feature.free}</span>
                      ) : feature.free ? (
                        <span className={styles.featureIncluded}><Icons.check size={16} /></span>
                      ) : (
                        <span className={styles.featureNotIncluded}><Icons.minus size={16} /></span>
                      )}
                    </div>
                    <div className={styles.featureCell}>
                      {feature.note ? (
                        <span className={styles.featureNotIncluded}><Icons.minus size={16} /></span>
                      ) : typeof feature.collector === 'string' ? (
                        <span className={styles.featureLimit}>{feature.collector}</span>
                      ) : feature.collector ? (
                        <span className={styles.featureIncluded}><Icons.check size={16} /></span>
                      ) : (
                        <span className={styles.featureNotIncluded}><Icons.minus size={16} /></span>
                      )}
                    </div>
                    <div className={styles.featureCell}>
                      {feature.note ? (
                        <span className={styles.featureNotIncluded}><Icons.minus size={16} /></span>
                      ) : typeof feature.tuner === 'string' ? (
                        <span className={styles.featureLimit}>{feature.tuner}</span>
                      ) : feature.tuner ? (
                        <span className={styles.featureIncluded}><Icons.check size={16} /></span>
                      ) : (
                        <span className={styles.featureNotIncluded}><Icons.minus size={16} /></span>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>

        <p className={styles.breakdownNote}>
          <Icons.sparkle size={14} />
          <span>During beta, all features are unlocked for free. Pricing applies after launch.</span>
        </p>
      </div>
    </section>
  );
}













