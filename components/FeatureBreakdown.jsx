'use client';

import React from 'react';

import Image from 'next/image';

import { Icons } from '@/components/ui/Icons';
import { UI_IMAGES } from '@/lib/images';

import styles from './FeatureBreakdown.module.css';

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

// Detailed feature breakdown - SIMPLIFIED MODEL (Jan 2026)
// Core principle: Full app for everyone, gate on AL usage & car count
const featureCategories = [
  {
    id: 'garage',
    name: 'My Garage',
    icon: Icons.garage,
    features: [
      { name: 'Cars in garage', free: '1', collector: '3', tuner: 'Unlimited' },
      { name: 'VIN Decode — identify your exact variant', free: true, collector: true, tuner: true },
      { name: 'My Specs — full vehicle specifications', free: true, collector: true, tuner: true },
      { name: 'My Build — plan your upgrades', free: true, collector: true, tuner: true },
      { name: 'My Performance — HP/metric gains', free: true, collector: true, tuner: true },
      { name: 'My Parts — research specific parts', free: true, collector: true, tuner: true },
      { name: 'My Install — track installation progress', free: true, collector: true, tuner: true },
      { name: 'My Photos — upload vehicle photos', free: true, collector: true, tuner: true },
    ],
  },
  {
    id: 'insights',
    name: 'Insights & Data',
    icon: Icons.analytics,
    features: [
      { name: 'Insights — health scores & recommendations', free: false, collector: true, tuner: true },
      { name: 'Virtual Dyno — HP/TQ curves', free: false, collector: true, tuner: true },
      { name: 'Lap Time Estimator — track time estimates', free: false, collector: true, tuner: true },
      { name: 'Dyno & Track logging', free: false, collector: true, tuner: true },
    ],
  },
  {
    id: 'community',
    name: 'Community & Events',
    icon: Icons.users,
    features: [
      { name: 'Browse community builds', free: true, collector: true, tuner: true },
      { name: 'Share your build publicly', free: true, collector: true, tuner: true },
      { name: 'Leaderboard & rankings', free: true, collector: true, tuner: true },
      { name: 'Browse & submit car events', free: true, collector: true, tuner: true },
      { name: 'Save events & export to calendar', free: true, collector: true, tuner: true },
    ],
  },
  {
    id: 'ai',
    name: 'AL — Your AI Co-Pilot',
    icon: AlIcon,
    features: [
      { name: 'Monthly AL budget', free: '$0.25', collector: '$2.00', tuner: '$5.00' },
      { name: 'Estimated chats (AL responses)', free: '~15', collector: '~130', tuner: '~350' },
      { name: 'Build planning assistance', free: true, collector: true, tuner: true },
      { name: 'Parts recommendations', free: true, collector: true, tuner: true },
    ],
  },
  {
    id: 'support',
    name: 'Support',
    icon: Icons.support,
    features: [
      { name: 'Community support', free: true, collector: true, tuner: true },
      { name: 'Priority support', free: false, collector: false, tuner: true },
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
              <span className={styles.tierHeaderPrice}>$9.99/mo</span>
            </div>
            <div className={`${styles.tableHeaderCell} ${styles.tableTierHeader} ${styles.tierHeaderTuner}`}>
              <span className={styles.tierHeaderName}>Pro</span>
              <span className={styles.tierHeaderPrice}>$19.99/mo</span>
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













