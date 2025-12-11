import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export const metadata = {
  title: 'Explore | SuperNatural Motorsports',
  description: 'Dive into the world of sports cars. Browse our catalog of 98+ vehicles or learn how performance modifications work as a system.',
  alternates: {
    canonical: '/explore',
  },
};

// Icons
const Icons = {
  car: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  book: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <line x1="12" y1="6" x2="12" y2="10"/>
      <line x1="10" y1="8" x2="14" y2="8"/>
    </svg>
  ),
  arrowRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  search: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
};

// AI-generated images (owned/licensed) - unique to this page
const heroImage = '/images/pages/canyon-road.png'; // Scenic driving road - exploration theme
const catalogImage = '/images/pages/cars-and-coffee.png'; // Cars & coffee meet - multiple cars, community feel
const educationImage = '/images/pages/engine-bay.png'; // Clean engine bay detail

export default function ExplorePage() {
  return (
    <div className={styles.page}>
      {/* Hero Section with backdrop */}
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={heroImage}
            alt="Scenic winding canyon road perfect for spirited driving"
            fill
            priority
            quality={90}
            className={styles.heroImage}
            sizes="100vw"
          />
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>Explore</span>
          <h1 className={styles.title}>Learn. Discover. Master.</h1>
          <p className={styles.subtitle}>
            Whether you&apos;re researching your next car or understanding how modifications 
            work together, we&apos;ve got you covered with expert insights and real data.
          </p>
        </div>
      </section>

      {/* Two Paths Section */}
      <section className={styles.pathsSection}>
        <div className={styles.pathsGrid}>
          {/* Car Catalog Path */}
          <Link href="/cars" className={styles.pathCard}>
            <div className={styles.pathImageWrapper}>
              <Image
                src={catalogImage}
                alt="Sports cars gathered at a cars and coffee community meet"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={styles.pathImage}
                priority
              />
              <div className={styles.pathImageOverlay} />
            </div>
            <div className={styles.pathContent}>
              <div className={styles.pathIcon}>
                <Icons.car />
              </div>
              <h2 className={styles.pathTitle}>Car Catalog</h2>
              <p className={styles.pathDescription}>
                Browse 98+ sports cars from every tier. Explore specs, compare models, 
                and find detailed information on everything from Miatas to GT3s.
              </p>
              <div className={styles.pathFeatures}>
                <span className={styles.feature}>
                  <Icons.search />
                  Filter by make, price, and category
                </span>
                <span className={styles.feature}>
                  <Icons.search />
                  Detailed specs and performance data
                </span>
                <span className={styles.feature}>
                  <Icons.search />
                  Real owner insights
                </span>
              </div>
              <span className={styles.pathCta}>
                Browse Cars
                <Icons.arrowRight />
              </span>
            </div>
          </Link>

          {/* Education Path */}
          <Link href="/education" className={styles.pathCard}>
            <div className={styles.pathImageWrapper}>
              <Image
                src={educationImage}
                alt="Learn about car modifications"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={styles.pathImage}
                priority
              />
              <div className={styles.pathImageOverlay} />
            </div>
            <div className={styles.pathContent}>
              <div className={styles.pathIconAlt}>
                <Icons.book />
              </div>
              <h2 className={styles.pathTitle}>Education</h2>
              <p className={styles.pathDescription}>
                Understand how modifications work as a connected system. Learn the 
                principles behind suspension, power, brakes, and more.
              </p>
              <div className={styles.pathFeatures}>
                <span className={styles.feature}>
                  <Icons.search />
                  Systems-based approach
                </span>
                <span className={styles.feature}>
                  <Icons.search />
                  Expert-written guides
                </span>
                <span className={styles.feature}>
                  <Icons.search />
                  Build knowledge, not just ego
                </span>
              </div>
              <span className={styles.pathCta}>
                Start Learning
                <Icons.arrowRight />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Quick Links */}
      <section className={styles.quickLinks}>
        <div className={styles.quickLinksContent}>
          <h3 className={styles.quickLinksTitle}>Ready to take action?</h3>
          <p className={styles.quickLinksSubtitle}>
            Once you&apos;ve explored, use our tools to find and build your perfect car.
          </p>
          <div className={styles.quickLinksButtons}>
            <Link href="/car-selector" className={styles.primaryButton}>
              Find Your Car
            </Link>
            <Link href="/performance" className={styles.secondaryButton}>
              Plan Your Build
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
