'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from '../page.module.css';

// Icons
const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const FileTextIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const GlossaryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
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
    icon: BookIcon,
    title: 'Sports Car Encyclopedia',
    description: 'Deep-dive articles on legendary cars, iconic models, and automotive history.',
  },
  {
    icon: FileTextIcon,
    title: 'Educational Guides',
    description: 'Learn about engines, drivetrains, suspension, and what makes sports cars tick.',
  },
  {
    icon: HistoryIcon,
    title: 'Automotive History',
    description: 'Explore the stories behind the cars, manufacturers, and racing legends.',
  },
  {
    icon: InfoIcon,
    title: 'Buying Guides',
    description: 'What to look for when shopping, common issues to watch out for, and fair prices.',
  },
  {
    icon: GlossaryIcon,
    title: 'Glossary & Terms',
    description: 'Understand the jargon—from LSD to DOHC, we explain it all in plain English.',
  },
];

export default function LearnFeaturePage() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground} />
        <div className={styles.heroGlow} style={{ '--feature-color': '#06b6d4' }} />
        
        <div className={styles.heroContent}>
          <div className={styles.heroIcon} style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
            <BookIcon />
          </div>
          
          <span className={styles.heroLabel}>Knowledge</span>
          
          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleAccent}>Learn</span> About<br />
            Sports Cars
          </h1>
          
          <p className={styles.heroDescription}>
            Dive into our encyclopedia of sports car knowledge. From engine 
            tech to racing history, buying guides to glossaries—expand your 
            automotive expertise.
          </p>
          
          <Link href="/encyclopedia" className={styles.heroCTA}>
            Start Learning
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
              <span>Add image: features/learn/hero.png (16:9 ratio)<br />Show encyclopedia browse page</span>
            </div>
            {/* <Image 
              src="/images/features/learn/hero.png" 
              alt="Encyclopedia interface showing car articles"
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
            <h2 className={styles.sectionTitle}>Expand Your Knowledge</h2>
            <p className={styles.sectionSubtitle}>From beginner to expert—content for every level</p>
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
            <h3>Written by Enthusiasts</h3>
            <p>
              Our content is crafted by people who live and breathe cars. 
              Every article is researched, fact-checked, and written to help 
              you understand not just what, but why—the engineering, the 
              history, and the culture behind these machines.
            </p>
            <Link href="/encyclopedia" className={styles.heroCTA}>
              Explore Articles
              <ArrowRightIcon />
            </Link>
          </div>
          
          <div className={styles.secondaryImageWrapper}>
            {/* Replace with actual image */}
            <div className={styles.showcasePlaceholder}>
              <ImagePlaceholder />
              <span>Add image: features/learn/article.png<br />Show article detail page example</span>
            </div>
            {/* <Image 
              src="/images/features/learn/article.png" 
              alt="Encyclopedia article page"
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
          <h2 className={styles.ctaTitle}>Ready to Dive In?</h2>
          <p className={styles.ctaDescription}>
            Start exploring the world of sports cars.
          </p>
          <Link href="/encyclopedia" className={styles.ctaButton}>
            Open Encyclopedia
            <ArrowRightIcon />
          </Link>
          
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <p className={styles.statValue}>200+</p>
              <p className={styles.statLabel}>Articles</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>50+</p>
              <p className={styles.statLabel}>Topics</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>Free</p>
              <p className={styles.statLabel}>Full Access</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

