import Image from 'next/image';
import SportsCarComparison from '@/components/SportsCarComparison';
import Button from '@/components/Button';
import ScoringInfo from '@/components/ScoringInfo';
import styles from './page.module.css';

// Blob URL for hero image
const BLOB_BASE = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com';
const heroImageUrl = `${BLOB_BASE}/pages/advisory/hero.webp`;

// Icon
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

export const metadata = {
  title: 'Sports Car Selector | Compare ~100 Performance Vehicles',
  description: 'Select your perfect sports car with our intelligent comparison tool. Compare ~100 vehicles from $12K-$100K based on sound, track capability, reliability, daily comfort, and value. Real owner insights included.',
  keywords: ['sports car selector', 'car comparison', 'track cars', 'sports car buying guide', 'Porsche comparison', 'BMW M comparison', 'Corvette comparison', 'best sports car under 100k', 'muscle cars', 'import tuners', 'drift cars'],
  openGraph: {
    title: 'Sports Car Selector | Compare ~100 Performance Vehicles',
    description: 'Select your perfect sports car. Compare ~100 vehicles based on what matters most to you.',
    url: '/car-selector',
    type: 'website',
  },
  twitter: {
    title: 'Sports Car Selector | Compare ~100 Performance Vehicles',
    description: 'Select your perfect sports car. Compare ~100 vehicles from $12K-$100K.',
  },
  alternates: {
    canonical: '/car-selector',
  },
};

export default function CarSelector() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={heroImageUrl}
            alt="Sports cars at a weekend meetup"
            fill
            priority
            quality={85}
            className={styles.heroImage}
            sizes="100vw"
          />
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <span className={styles.badge}>Car Selector</span>
            <h1 className={styles.title}>
              Own Your<br />
              <span className={styles.titleAccent}>Lane</span>
            </h1>
            <p className={styles.subtitle}>
              Find the car that fits your goals—not someone else&apos;s Instagram. 
              Tell us what actually matters to you, and we&apos;ll match you with 
              the right car. Real ownership insights from drivers who walk the walk.
            </p>
            <Button href="#selector" variant="secondary" size="lg" icon={<SearchIcon />}>
              Start the Selector
            </Button>
          </div>
        </div>
      </section>

      {/* Scoring Methodology */}
      <section className={styles.scoringSection}>
        <div className={styles.container}>
          <ScoringInfo variant="advisory" />
        </div>
      </section>

      {/* Sports Car Selector Tool */}
      <section id="selector" className={styles.tool}>
        <SportsCarComparison />
      </section>

      {/* Post-Selector CTA */}
      <section className={styles.postCta}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Found Your Match?</h2>
              <p className={styles.ctaSubtitle}>
                Now make it yours. We can help you inspect, acquire, or set up 
                your new ride. From pre-purchase inspections to full performance builds, 
                we&apos;re here to help you build with purpose.
              </p>
              <div className={styles.ctaButtons}>
                <Button href="/performance" variant="primary" size="lg">
                  Plan Your Build
                </Button>
                <Button href="/contact" variant="outlineLight" size="lg">
                  Talk to an Expert
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

