'use client';

import Link from 'next/link';
import styles from './page.module.css';

// Icons for each feature
const SparklesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const TargetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const GarageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <path d="M9 22V12h6v10"/>
  </svg>
);

const WrenchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </svg>
);

const FEATURES = [
  {
    slug: 'ask-al',
    icon: SparklesIcon,
    color: '#d4af37',
    label: 'AI-Powered',
    title: 'Ask AL',
    description: 'Your personal AI car expert. Ask anything about sports cars and get instant, knowledgeable answers.',
    cta: 'Meet AL',
    href: '/al',
  },
  {
    slug: 'browse-cars',
    icon: SearchIcon,
    color: '#3b82f6',
    label: 'Research',
    title: 'Browse Cars',
    description: 'Explore 2,500+ sports cars with detailed specs, photos, reviews, and everything you need to research.',
    cta: 'Start Browsing',
    href: '/browse-cars',
  },
  {
    slug: 'car-selector',
    icon: TargetIcon,
    color: '#10b981',
    label: 'Discovery',
    title: 'Car Selector',
    description: 'Not sure which sports car is right for you? Our quiz finds your perfect match based on your priorities.',
    cta: 'Take the Quiz',
    href: '/car-selector',
  },
  {
    slug: 'own',
    icon: GarageIcon,
    color: '#8b5cf6',
    label: 'Ownership',
    title: 'Own',
    description: 'Your digital garage. Track your collection, decode VINs, get recall alerts, and log maintenance.',
    cta: 'Build Your Garage',
    href: '/garage',
  },
  {
    slug: 'build',
    icon: WrenchIcon,
    color: '#ef4444',
    label: 'Modifications',
    title: 'Build',
    description: 'Plan your mods with real dyno data, conflict detection, and cost estimates. Build smarter.',
    cta: 'Start Building',
    href: '/garage/my-build',
  },
  {
    slug: 'connect',
    icon: CalendarIcon,
    color: '#f97316',
    label: 'Events',
    title: 'Connect',
    description: 'Find car shows, track days, meets, and rallies near you. Get connected to the car community.',
    cta: 'Find Events',
    href: '/events',
  },
  {
    slug: 'learn',
    icon: BookIcon,
    color: '#06b6d4',
    label: 'Knowledge',
    title: 'Learn',
    description: 'Dive into our encyclopedia. Articles, guides, history, and everything you need to expand your knowledge.',
    cta: 'Start Learning',
    href: '/encyclopedia',
  },
];

export default function FeaturesIndexPage() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground} />
        <div className={styles.heroGlow} />
        
        <div className={styles.heroContent}>
          <span className={styles.heroLabel}>Platform Features</span>
          
          <h1 className={styles.heroTitle}>
            Everything You Need for<br />
            <span className={styles.heroTitleAccent}>Sports Cars</span>
          </h1>
          
          <p className={styles.heroDescription}>
            AutoRev is the complete platform for sports car enthusiasts. 
            Research, own, build, and connect—all in one place.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className={styles.featuresSection} style={{ paddingTop: 0 }}>
        <div className={styles.sectionContainer}>
          <div className={styles.featuresGrid}>
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link 
                  key={feature.slug} 
                  href={`/features/${feature.slug}`}
                  className={styles.featureCard}
                  style={{ '--card-accent': feature.color }}
                >
                  <div 
                    className={styles.featureCardIcon}
                    style={{ 
                      background: `rgba(${hexToRgb(feature.color)}, 0.15)`,
                      color: feature.color 
                    }}
                  >
                    <Icon />
                  </div>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    color: feature.color,
                    marginBottom: '4px',
                    display: 'block'
                  }}>
                    {feature.label}
                  </span>
                  <h3 className={styles.featureCardTitle}>{feature.title}</h3>
                  <p className={styles.featureCardDescription}>{feature.description}</p>
                  <span style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: 'var(--space-md)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    color: feature.color
                  }}>
                    Learn More <ArrowRightIcon />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContainer}>
          <h2 className={styles.ctaTitle}>Ready to Explore?</h2>
          <p className={styles.ctaDescription}>
            Jump into any feature—no signup required for most.
          </p>
          <Link href="/browse-cars" className={styles.ctaButton}>
            Start with Browse Cars
            <ArrowRightIcon />
          </Link>
        </div>
      </section>
    </div>
  );
}

// Helper function to convert hex to rgb
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255, 255, 255';
}










