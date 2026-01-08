'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from '../page.module.css';

// Icons
const TargetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const SlidersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"/>
    <line x1="4" y1="10" x2="4" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12" y2="3"/>
    <line x1="20" y1="21" x2="20" y2="16"/>
    <line x1="20" y1="12" x2="20" y2="3"/>
    <line x1="1" y1="14" x2="7" y2="14"/>
    <line x1="9" y1="8" x2="15" y2="8"/>
    <line x1="17" y1="16" x2="23" y2="16"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const TrendingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const SparklesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </svg>
);

const ImagePlaceholder = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="9" cy="9" r="2"/>
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
  </svg>
);

const FEATURES = [
  {
    icon: SlidersIcon,
    title: 'Set Your Priorities',
    description: 'Tell us what matters most: speed, handling, daily drivability, budget, or all of the above.',
  },
  {
    icon: CheckCircleIcon,
    title: 'Answer Simple Questions',
    description: 'A few quick questions about your needs and preferences help us narrow down the options.',
  },
  {
    icon: TrendingIcon,
    title: 'Smart Matching',
    description: 'Our algorithm scores cars against your criteria and surfaces the best matches.',
  },
  {
    icon: SparklesIcon,
    title: 'Personalized Results',
    description: 'Get a curated list of sports cars that truly fit your lifestyle and goals.',
  },
];

export default function CarSelectorFeaturePage() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground} />
        <div className={styles.heroGlow} style={{ '--feature-color': '#10b981' }} />
        
        <div className={styles.heroContent}>
          <div className={styles.heroIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <TargetIcon />
          </div>
          
          <span className={styles.heroLabel}>Discovery</span>
          
          <h1 className={styles.heroTitle}>
            Find Your <span className={styles.heroTitleAccent}>Perfect</span><br />
            Sports Car Match
          </h1>
          
          <p className={styles.heroDescription}>
            Not sure which sports car is right for you? Our intelligent quiz 
            analyzes your priorities and recommends the cars that best match 
            your lifestyle, budget, and driving preferences.
          </p>
          
          <Link href="/car-selector" className={styles.heroCTA}>
            Take the Quiz
            <ArrowRightIcon />
          </Link>
        </div>
      </section>

      {/* Main Feature Image */}
      <section className={styles.featureShowcase}>
        <div className={styles.showcaseContainer}>
          <div className={styles.showcaseImageWrapper}>
            {/* Replace with actual image */}
            <div className={styles.showcasePlaceholder}>
              <ImagePlaceholder />
              <span>Add image: features/car-selector/hero.png (16:9 ratio)<br />Show the car selector quiz interface</span>
            </div>
            {/* <Image 
              src="/images/features/car-selector/hero.png" 
              alt="Car selector quiz interface"
              width={1200}
              height={675}
              className={styles.showcaseImage}
            /> */}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>How It Works</h2>
            <p className={styles.sectionSubtitle}>Four simple steps to find your ideal sports car</p>
          </div>
          
          <div className={styles.featuresGrid}>
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className={styles.featureCard}>
                  <div className={styles.featureCardIcon}>
                    <Icon />
                  </div>
                  <h3 className={styles.featureCardTitle}>{feature.title}</h3>
                  <p className={styles.featureCardDescription}>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Secondary Image Section */}
      <section className={styles.secondaryShowcase}>
        <div className={styles.secondaryContainer}>
          <div className={styles.secondaryContent}>
            <h3>Discover Hidden Gems</h3>
            <p>
              The Car Selector doesn't just show you obvious choices. It surfaces 
              underrated cars you might not have considered—sleeper picks that 
              punch above their weight in performance, reliability, or value.
            </p>
            <Link href="/car-selector" className={styles.heroCTA}>
              Find Your Match
              <ArrowRightIcon />
            </Link>
          </div>
          
          <div className={styles.secondaryImageWrapper}>
            {/* Replace with actual image */}
            <div className={styles.showcasePlaceholder}>
              <ImagePlaceholder />
              <span>Add image: features/car-selector/results.png<br />Show results page with car recommendations</span>
            </div>
            {/* <Image 
              src="/images/features/car-selector/results.png" 
              alt="Car selector results showing matched cars"
              width={600}
              height={400}
              className={styles.secondaryImage}
            /> */}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContainer}>
          <h2 className={styles.ctaTitle}>Ready to Find Your Match?</h2>
          <p className={styles.ctaDescription}>
            Takes about 2 minutes. No signup required.
          </p>
          <Link href="/car-selector" className={styles.ctaButton}>
            Start the Quiz
            <ArrowRightIcon />
          </Link>
          
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <p className={styles.statValue}>2 min</p>
              <p className={styles.statLabel}>Average Time</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>10+</p>
              <p className={styles.statLabel}>Match Factors</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>Free</p>
              <p className={styles.statLabel}>No Signup</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}










