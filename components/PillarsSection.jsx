'use client';

/**
 * PillarsSection Component
 * 
 * Displays the main feature pillars on the homepage.
 * Car count is passed from page.jsx to ensure consistency with headline.
 */

import { useMemo } from 'react';

import Link from 'next/link';

import styles from '@/app/(marketing)/page.module.css';

// Icons
const CarIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
);

const ToolIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const ExploreIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
    <path d="M11 8v6"/>
    <path d="M8 11h6"/>
  </svg>
);

const GarageIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const BookIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

// Build Pivot: Focus on Build features only
export default function PillarsSection({ carCount = 100 }) {
  const pillars = useMemo(() => [
    {
      icon: <ToolIcon />,
      title: 'Plan Your Build',
      description: 'Select your car, explore upgrade recommendations, and see projected HP gains. Our intelligent system shows you how mods work together.',
      cta: 'Start Building',
      href: '/garage/my-build',
      accent: 'primary'
    },
    {
      icon: <ExploreIcon />,
      title: 'Research Parts',
      description: `Browse 700+ verified parts with real fitment data. Compare prices, check compatibility, and find exactly what you need for your build.`,
      cta: 'Browse Parts',
      href: '/parts',
      accent: 'secondary'
    },
    {
      icon: <GarageIcon />,
      title: 'Track Progress',
      description: 'Save your build projects, mark parts as installed, and track your total investment. Your personal space to manage every modification.',
      cta: 'My Garage',
      href: '/garage',
      accent: 'tertiary'
    },
    {
      icon: <BookIcon />,
      title: 'Learn Everything',
      description: 'Understand the mechanics behind the mods. Learn how turbochargers, suspension geometry, and ECU tuning actually affect performance.',
      cta: 'Encyclopedia',
      href: '/encyclopedia',
      accent: 'quaternary'
    },
    {
      icon: <CarIcon />,
      title: 'Join Community',
      description: 'Share your builds, get feedback from enthusiasts, and find inspiration. See what others are building and learn from their experiences.',
      cta: 'Community Builds',
      href: '/community/builds',
      accent: 'primary'
    }
  ], []);

  return (
    <section className={styles.pillars}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Build With Confidence</h2>
          <p className={styles.sectionSubtitle}>
            Everything you need to plan, execute, and track your performance build
          </p>
        </div>
        <div className={styles.pillarsGrid}>
          {pillars.map((pillar, index) => (
            <Link 
              key={index} 
              href={pillar.href}
              prefetch={false}
              className={`${styles.pillarCard} ${styles[pillar.accent]}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className={styles.pillarIcon}>{pillar.icon}</div>
              <h3 className={styles.pillarTitle}>{pillar.title}</h3>
              <p className={styles.pillarDescription}>{pillar.description}</p>
              <span className={styles.pillarCta}>
                <ArrowRightIcon /> {pillar.cta}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

