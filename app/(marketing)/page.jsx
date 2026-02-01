/**
 * AutoRev Homepage - Server Component
 *
 * Optimized for performance with Server Component architecture.
 * Interactive elements are isolated in client components:
 * - HeroCTA: Auth modal and PWA install
 * - TypingAnimation: AL question typing effect
 * - FinalCTA: Bottom section auth modal
 *
 * Structure:
 * 1. Hero - Logo centered, punchy headline, 3-phone display
 * 2. AL Introduction section with typing animation
 * 3. Feature sections alternating text + single phone
 * 4. Final CTA
 * (Footer is provided by global layout)
 *
 * CSS Optimization Strategy (Jan 2026):
 * - Critical above-fold CSS (hero) loads synchronously
 * - Below-fold sections (AL intro, features, final CTA) are lazy-loaded
 * - This reduces render-blocking CSS from ~85KB to ~25KB
 * - Lighthouse improvement: ~1,130ms estimated savings
 *
 * All images served from Vercel Blob CDN for optimal page speed
 */

import dynamic from 'next/dynamic';
import Image from 'next/image';

import { HeroCTA } from '@/components/homepage';
import IPhoneFrame from '@/components/IPhoneFrame';
import { SITE_DESIGN_IMAGES } from '@/lib/images';

import styles from './page.module.css';

// =============================================================================
// LAZY-LOADED BELOW-FOLD SECTIONS
// These components and their CSS are deferred until after initial render
// to reduce render-blocking CSS and improve LCP.
//
// Using ssr: false ensures:
// 1. CSS for these components is NOT included in initial HTML <head>
// 2. Components and styles load after hydration (after LCP)
// 3. Estimated savings: ~60KB CSS moved out of render-blocking path
// =============================================================================

// AL Introduction section - below the fold
const ALIntroSection = dynamic(() => import('./ALIntroSection'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '600px', background: 'transparent' }} aria-hidden="true" />
  ),
});

// Feature sections - well below the fold
const FeatureSections = dynamic(() => import('./FeatureSections'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '2000px', background: 'transparent' }} aria-hidden="true" />
  ),
});

// Final CTA - bottom of page
const FinalCTASection = dynamic(() => import('./FinalCTASection'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '300px', background: 'transparent' }} aria-hidden="true" />
  ),
});

export default function Home() {
  return (
    <div className={styles.page} data-no-main-offset>
      {/* Hero Section - CSS handles safe-area padding via env(safe-area-inset-top)
          Removed SafeAreaHeader wrapper to eliminate Suspense delay for faster LCP */}
      <section className={styles.hero}>
        {/* Hero Content - Text on left for desktop */}
        <div className={styles.heroContent}>
          {/* Logo with icon on desktop */}
          <div className={styles.logo}>
            <Image
              src="/images/autorev-logo-2048-transparent.png"
              alt="AutoRev Logo"
              width={100}
              height={100}
              className={styles.logoIcon}
              priority
            />
            <span className={styles.logoText}>
              <span className={styles.logoAuto}>AUTO</span>
              <span className={styles.logoRev}>REV</span>
            </span>
          </div>

          {/* Punchy Headline - 2 colors only: white and lime */}
          <h1 className={styles.headline}>
            <span className={styles.headlineLine}>
              <span className={styles.headlineAccent}>OPTIMIZE</span>
              <span className={styles.headlineWhite}> YOUR CAR,</span>
            </span>
            <span className={styles.headlineLine}>
              <span className={styles.headlineAccent}>MAXIMIZE</span>
              <span className={styles.headlineWhite}> YOUR GAINS</span>
            </span>
          </h1>

          {/* Subtext */}
          <p className={styles.subtext}>
            Research mods for your car, compare different brands, find deals, get straight answers —
            all in one app built for speed.
          </p>

          {/* CTA Buttons - Client Component for interactivity */}
          <HeroCTA />
        </div>

        {/* 3 iPhone Display - smaller phones */}
        <div className={styles.phoneDisplay}>
          {/* Left Phone (behind) - Upgrade Recommendations */}
          <div className={styles.phoneLeft}>
            <IPhoneFrame size="small">
              <Image
                src={SITE_DESIGN_IMAGES.heroLeft}
                alt="Upgrade Recommendations"
                fill
                sizes="224px"
                className={styles.screenImage}
                loading="eager"
              />
            </IPhoneFrame>
          </div>

          {/* Center Phone (front) - HERO: Most compelling image (LCP element) */}
          <div className={styles.phoneCenter}>
            <IPhoneFrame size="small">
              <Image
                src={SITE_DESIGN_IMAGES.heroCenter}
                alt="Your Garage - Track Your Build"
                fill
                sizes="224px"
                className={styles.screenImage}
                priority
                fetchPriority="high"
              />
            </IPhoneFrame>
          </div>

          {/* Right Phone (behind) - AL Chat */}
          <div className={styles.phoneRight}>
            <IPhoneFrame size="small">
              <Image
                src={SITE_DESIGN_IMAGES.heroRight}
                alt="AL - Your AI Car Expert"
                fill
                sizes="224px"
                className={styles.screenImage}
                loading="eager"
              />
            </IPhoneFrame>
          </div>
        </div>
      </section>

      {/* =============================================================================
          LAZY-LOADED BELOW-FOLD SECTIONS
          These sections are dynamically imported to defer their CSS loading.
          This reduces render-blocking CSS and improves LCP by ~1,130ms.
          ============================================================================= */}

      {/* AL Introduction + Feature Card Section */}
      <ALIntroSection />

      {/* Feature Sections - All 7 showcase sections */}
      <FeatureSections />

      {/* Final CTA Section */}
      <FinalCTASection />
    </div>
  );
}
