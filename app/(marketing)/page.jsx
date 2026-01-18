import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Button from '@/components/Button';
import HeroSection from '@/components/HeroSection';
import styles from './page.module.css';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// =============================================================================
// DYNAMIC IMPORTS - Below-the-fold components with deferred loading
// =============================================================================
// Performance optimization: Setting ssr: false for below-fold components
// eliminates their JS from the initial bundle, reducing TBT significantly.
// These components hydrate after the hero section is visible.

// BUILD PIVOT: Featured Builds carousel replaces Car Carousel as primary social proof
const FeaturedBuildsCarousel = dynamic(() => import('@/components/FeaturedBuildsCarousel'), {
  loading: () => <div className={styles.buildsCarouselPlaceholder} />,
  ssr: false, // Deferred - not visible on initial viewport
});

const FeaturePhoneShowcase = dynamic(() => import('@/components/FeaturePhoneShowcase'), {
  loading: () => <div className={styles.phoneShowcasePlaceholder} />,
  ssr: false, // Deferred - below hero section
});

const PillarsSection = dynamic(() => import('@/components/PillarsSection'), {
  loading: () => <div className={styles.pillarsSectionPlaceholder} />,
  ssr: false, // Deferred - well below fold
});

const FeatureBreakdown = dynamic(() => import('@/components/FeatureBreakdown'), {
  loading: () => <div className={styles.featureBreakdownPlaceholder} />,
  ssr: false, // Deferred - at bottom of page
});

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

// =============================================================================
// Homepage Metadata with LCP Image Preload
// =============================================================================
// The hero image is the LCP element on this page. We use Next.js metadata
// to add a preload hint, which tells the browser to fetch it immediately.
// Combined with priority prop on Image component, this achieves optimal LCP.

const HERO_IMAGE_URL = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/pages/home/hero-v2.webp';

export const metadata = {
  title: 'AutoRev | AI-Powered Sports Car Research',
  description: 'Like having the obsessive car nerd in your pocket. Research cars, manage your collection, plan mods, discover events. Tech specs, troubleshooting, upgrades, recalls — answered instantly. Tony Stark had Jarvis. Now you have AL.',
  alternates: {
    canonical: '/',
  },
  // Preload the LCP hero image for faster initial render
  // Next.js Image component will handle optimization, so we preload the optimized version
  other: {
    // Note: Next.js Image with priority already adds preload, but this ensures it's
    // in the <head> before SSR content arrives. The browser will dedupe requests.
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
    <div className={styles.page} data-no-main-offset>
      {/* Hero Section with cycling text */}
      <HeroSection carCount={carCount} />

      {/* Feature Phone Showcase - Shows build planner UI */}
      <FeaturePhoneShowcase />

      {/* BUILD PIVOT: Featured Community Builds replaces Car Carousel */}
      <FeaturedBuildsCarousel 
        title="Featured Community Builds"
        subtitle="Get inspired by what other enthusiasts are building"
      />

      {/* Pillars Section - How We Help (Build-focused) */}
      <PillarsSection carCount={carCount} />

      {/* BUILD PIVOT: Value Props Section - Build Community Focus */}
      <section className={styles.valueProps}>
        <div className={styles.container}>
          <div className={styles.valueGrid}>
            <div className={styles.valueContent}>
            <h2 className={styles.valueTitle}>
              Build With<br />
              <span className={styles.valueAccent}>Purpose</span>
            </h2>
            <p className={styles.valueDescription}>
              Whether you&apos;re planning a weekend Miata or a full GT3 track build,
              we help you make informed decisions. No guesswork, no wasted money—just
              a clear path from concept to completion.
            </p>
            <ul className={styles.valueList}>
              <li><CheckIcon /> Plan upgrades with real performance data</li>
              <li><CheckIcon /> Track costs and avoid budget surprises</li>
              <li><CheckIcon /> Get AI-powered compatibility checks</li>
              <li><CheckIcon /> Learn from builds in our community</li>
            </ul>
            </div>
            <div className={styles.valueImage}>
              <div className={styles.valueImageWrapper}>
                <Image
                  src={valueImageUrl}
                  alt="Car enthusiast working on their sports car build in a home garage"
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

      {/* Full Feature Breakdown */}
      <FeatureBreakdown />

    </div>
  );
}
