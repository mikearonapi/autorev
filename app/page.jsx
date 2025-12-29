import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/Button';
import CarCarousel from '@/components/CarCarousel';
import HeroSection from '@/components/HeroSection';
import PillarsSection from '@/components/PillarsSection';
import FeatureBreakdown from '@/components/FeatureBreakdown';
import styles from './page.module.css';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Fetch car count directly from database (server-side, no caching layers)
async function getCarCount() {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return 100; // Fallback if Supabase not configured
    }
    
    const { count, error } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('[HomePage] Error fetching car count:', error);
      return 100;
    }
    
    return count || 100;
  } catch (err) {
    console.error('[HomePage] Error in getCarCount:', err);
    return 100; // Fallback count
  }
}

// Revalidate homepage every 60 seconds to pick up new car counts quickly
export const revalidate = 60;

// Homepage uses the default layout metadata but we can add specific homepage schema
export const metadata = {
  title: 'AutoRev | Find What Drives You',
  description: 'Excellence over ego. Find your perfect sports car with our intelligent selector, plan performance builds with purpose, and join a brotherhood of drivers who value mastery over materialism. From Miatas to GT3s—we lift up every enthusiast.',
  alternates: {
    canonical: '/',
  },
};

// AI-generated images (owned/licensed)
const BLOB_BASE = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com';
const valueImageUrl = `${BLOB_BASE}/pages/home/value-section.webp`;

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default async function Home() {
  const carCount = await getCarCount();
  
  return (
    <div className={styles.page}>
      {/* Hero Section with cycling text */}
      <HeroSection />

      {/* Pillars Section */}
      <PillarsSection carCount={carCount} />

      {/* Full Feature Breakdown */}
      <FeatureBreakdown />

      {/* Car Showcase Carousel */}
      <section className={styles.carShowcase}>
        <div className={styles.carShowcaseHeader}>
          <h2 className={styles.carShowcaseTitle}>{carCount} Sports Cars to Explore</h2>
          <p className={styles.carShowcaseSubtitle}>From weekend warriors to track machines</p>
        </div>
        <CarCarousel />
      </section>

      {/* Value Props Section */}
      <section className={styles.valueProps}>
        <div className={styles.container}>
          <div className={styles.valueGrid}>
            <div className={styles.valueContent}>
            <h2 className={styles.valueTitle}>
              Brotherhood Over<br />
              <span className={styles.valueAccent}>Gatekeeping</span>
            </h2>
            <p className={styles.valueDescription}>
              We lift up the driver with the $3K Miata the same as the one with 
              the $300K GT3RS. No flex culture, no clout chasing—just honest guidance 
              and genuine community.
            </p>
            <ul className={styles.valueList}>
              <li><CheckIcon /> Real ownership insights, not just spec sheet comparisons</li>
              <li><CheckIcon /> Honest advice—we&apos;re not selling you anything</li>
              <li><CheckIcon /> Community built on respect, not rivalry</li>
              <li><CheckIcon /> Mentorship from drivers who walk the walk</li>
            </ul>
              <Button href="/car-selector" variant="primary" size="lg">
                Your Sportscar Match
              </Button>
            </div>
            <div className={styles.valueImage}>
              <div className={styles.valueImageWrapper}>
                <Image
                  src={valueImageUrl}
                  alt="Car enthusiast working on their sports car in a home garage"
                  width={600}
                  height={400}
                  className={styles.valueImagePhoto}
                  style={{ objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
