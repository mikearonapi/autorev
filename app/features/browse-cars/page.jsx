'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from '../page.module.css';

// Icons
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const BarChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const LayersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
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
    icon: SearchIcon,
    title: 'Powerful Search',
    description: 'Find cars by make, model, year, or search by performance specs like horsepower and 0-60 times.',
  },
  {
    icon: FilterIcon,
    title: 'Smart Filters',
    description: 'Filter by price range, drivetrain, body style, engine type, and dozens of other criteria.',
  },
  {
    icon: BarChartIcon,
    title: 'Detailed Specs',
    description: 'Every car page includes comprehensive specifications, performance data, and technical details.',
  },
  {
    icon: HeartIcon,
    title: 'Save Favorites',
    description: 'Create your personal collection of dream cars and compare them side-by-side.',
  },
  {
    icon: LayersIcon,
    title: 'Compare Cars',
    description: 'Put cars head-to-head with our comparison tool to see specs, pricing, and features side by side.',
  },
];

export default function BrowseCarsFeaturePage() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground} />
        <div className={styles.heroGlow} style={{ '--feature-color': '#3b82f6' }} />
        
        <div className={styles.heroContent}>
          <div className={styles.heroIcon} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' }}>
            <SearchIcon />
          </div>
          
          <span className={styles.heroLabel}>Research</span>
          
          <h1 className={styles.heroTitle}>
            Browse <span className={styles.heroTitleAccent}>2,500+</span><br />
            Sports Cars
          </h1>
          
          <p className={styles.heroDescription}>
            Explore our comprehensive database of sports cars. Find detailed specs, 
            high-resolution photos, owner reviews, and everything you need to 
            research your next dream car.
          </p>
          
          <Link href="/browse-cars" className={styles.heroCTA}>
            Start Browsing
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
              <span>Add image: features/browse-cars/hero.png (16:9 ratio)<br />Show browse/search interface with car cards</span>
            </div>
            {/* <Image 
              src="/images/features/browse-cars/hero.png" 
              alt="Browse cars interface showing sports car listings"
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
            <h2 className={styles.sectionTitle}>Find Your Perfect Car</h2>
            <p className={styles.sectionSubtitle}>Powerful tools to research and compare sports cars</p>
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
            <h3>Detailed Car Pages</h3>
            <p>
              Every car in our database has a dedicated page with full specifications, 
              performance data, owner reviews, common issues, and modification guides. 
              Get the complete picture before you buy or mod.
            </p>
            <Link href="/browse-cars" className={styles.heroCTA}>
              Explore Car Pages
              <ArrowRightIcon />
            </Link>
          </div>
          
          <div className={styles.secondaryImageWrapper}>
            {/* Replace with actual image */}
            <div className={styles.showcasePlaceholder}>
              <ImagePlaceholder />
              <span>Add image: features/browse-cars/detail.png<br />Show a car detail page example</span>
            </div>
            {/* <Image 
              src="/images/features/browse-cars/detail.png" 
              alt="Detailed car page showing specs and info"
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
          <h2 className={styles.ctaTitle}>Start Your Research</h2>
          <p className={styles.ctaDescription}>
            Explore every sports car from classic icons to modern supercars.
          </p>
          <Link href="/browse-cars" className={styles.ctaButton}>
            Browse All Cars
            <ArrowRightIcon />
          </Link>
          
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <p className={styles.statValue}>2,500+</p>
              <p className={styles.statLabel}>Sports Cars</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>50+</p>
              <p className={styles.statLabel}>Manufacturers</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>1960–2025</p>
              <p className={styles.statLabel}>Model Years</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

