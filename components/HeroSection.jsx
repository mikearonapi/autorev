/**
 * HeroSection - Server Component for homepage hero
 * 
 * PERFORMANCE OPTIMIZATION:
 * This component is a Server Component (no 'use client'), which means:
 * - The hero image renders in the initial HTML (critical for LCP)
 * - The browser can start fetching the image before JavaScript loads
 * - Next.js Image optimization converts to AVIF/WebP at optimal sizes
 * 
 * Interactive elements (CTA animation, scroll indicator) are separate client components
 * that hydrate after the critical content is visible.
 * 
 * LCP TARGET: < 2.5s
 * - Priority + fetchPriority="high" signals browser to fetch immediately
 * - Next.js optimizes image to ~50-80KB AVIF vs 246KB original WebP
 * - Preload hint added via generateMetadata in page.jsx
 */

import Image from 'next/image';
import styles from '@/app/(marketing)/page.module.css';
import HeroCta from '@/components/HeroCta';
import ScrollIndicator from '@/components/ScrollIndicator';

// Hero image dimensions (actual image size for aspect ratio calculation)
const HERO_WIDTH = 1920;
const HERO_HEIGHT = 1080;

// Hero image - Green 718 Cayman GT4 RS overhead view
// Next.js will optimize this to AVIF/WebP at appropriate sizes
const heroImageUrl = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/pages/home/hero-v2.webp';

export default function HeroSection({ carCount = 188 }) {
  return (
    <section className={styles.hero}>
      {/* Hero background image - Server rendered for optimal LCP */}
      <div className={styles.heroImageWrapper}>
        <Image
          src={heroImageUrl}
          alt="Green 718 Cayman GT4 RS overhead view with dramatic blue and red lighting"
          fill
          priority
          quality={75}
          className={styles.heroImage}
          sizes="100vw"
          fetchPriority="high"
          placeholder="empty"
        />
      </div>
      <div className={styles.heroOverlay} />
      
      {/* Main headline + subtitle - Server rendered static content */}
      {/* Build Pivot: Performance modification focus */}
      <div className={styles.heroHeadlines}>
        <h1 className={styles.heroTitle}>
          Plan Your <span className={styles.heroAccent}>Perfect Build</span>
        </h1>
        <p className={styles.heroSubtitle}>
          The complete platform for planning, tracking, and executing performance modifications — powered by verified parts data and real dyno results.
        </p>
        <p className={styles.heroJarvisTag}>
          Research parts. Plan your build. Track your progress. Ask <span className={styles.heroAccent}>AL</span>.
        </p>
      </div>
      
      {/* CTA button - Client component for animation */}
      <HeroCta />
      
      {/* Tagline - Server rendered static content */}
      {/* Build Pivot: Emphasize build data */}
      <div className={styles.heroBottom}>
        <p className={styles.heroTagline}>
          700+ parts. 300+ cars. Verified fitment data. Real performance gains.
        </p>
      </div>
      
      {/* Scroll Indicator - Client component */}
      <ScrollIndicator className={styles.heroScrollIndicator} />
    </section>
  );
}
