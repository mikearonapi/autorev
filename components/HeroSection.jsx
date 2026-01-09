/**
 * HeroSection - Server Component for homepage hero
 * 
 * PERFORMANCE OPTIMIZATION:
 * This component is a Server Component (no 'use client'), which means:
 * - The hero image renders in the initial HTML (critical for LCP)
 * - The browser can start fetching the image before JavaScript loads
 * - Combined with <link rel="preload"> in layout.jsx, this achieves optimal LCP
 * 
 * Interactive elements (CTA animation, scroll indicator) are separate client components
 * that hydrate after the critical content is visible.
 */

import Image from 'next/image';
import styles from '@/app/(marketing)/page.module.css';
import HeroCta from '@/components/HeroCta';
import ScrollIndicator from '@/components/ScrollIndicator';

// Hero image - Green 718 Cayman GT4 RS overhead view (246KB WebP)
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
          unoptimized // Skip Next.js Image Optimization - blob images are pre-compressed via TinyPNG
          className={styles.heroImage}
          sizes="100vw"
          fetchPriority="high"
        />
      </div>
      <div className={styles.heroOverlay} />
      
      {/* Main headline + subtitle - Server rendered static content */}
      <div className={styles.heroHeadlines}>
        <h1 className={styles.heroTitle}>
          Find What <span className={styles.heroAccent}>Drives You</span>
        </h1>
        <p className={styles.heroSubtitle}>
          The AI-powered research platform for sports car enthusiasts — like having the obsessive car nerd in your pocket who&apos;s done all the research and never forgets anything.
        </p>
        <p className={styles.heroJarvisTag}>
          Tony Stark had Jarvis. Now you have <span className={styles.heroAccent}>AL</span>.
        </p>
      </div>
      
      {/* CTA button - Client component for animation */}
      <HeroCta />
      
      {/* Tagline - Server rendered static content */}
      <div className={styles.heroBottom}>
        <p className={styles.heroTagline}>
          Research. Own. Build. Connect. Learn. — {carCount || 188} cars and counting.
        </p>
      </div>
      
      {/* Scroll Indicator - Client component */}
      <ScrollIndicator className={styles.heroScrollIndicator} />
    </section>
  );
}
