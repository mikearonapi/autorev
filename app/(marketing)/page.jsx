'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import styles from './page.module.css';

// GRAVL-inspired homepage - Clean, focused, app showcase
export default function Home() {
  const authModal = useAuthModal();
  
  return (
    <div className={styles.landingPage}>
      {/* Minimal Logo - Top Left */}
      <header className={styles.minimalHeader}>
        <div className={styles.logo}>
          <span className={styles.logoText}>Auto</span>
          <span className={styles.logoAccent}>Rev</span>
        </div>
        <button 
          className={styles.loginBtn}
          onClick={() => authModal.openSignIn()}
        >
          Log In
        </button>
      </header>

      {/* Hero Section - App Showcase */}
      <main className={styles.hero}>
        {/* Badge */}
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Build Planning Platform
        </div>

        {/* Headline */}
        <h1 className={styles.headline}>
          Plan Your Perfect
          <br />
          <span className={styles.headlineAccent}>Car Build</span>
        </h1>

        {/* Subheadline */}
        <p className={styles.subheadline}>
          Research parts. Track costs. Get AI-powered recommendations.
          <br className={styles.desktopBreak} />
          From concept to completion—build with purpose.
        </p>

        {/* CTA Buttons */}
        <div className={styles.ctaGroup}>
          <button 
            className={styles.primaryCta}
            onClick={() => authModal.openSignUp()}
          >
            Get Started — Free
          </button>
          <Link href="/community/builds" className={styles.secondaryCta}>
            Browse Builds
          </Link>
        </div>

        {/* Phone Mockup Section */}
        <div className={styles.phoneMockupContainer}>
          {/* Left Phone - Garage View */}
          <div className={`${styles.phoneMockup} ${styles.phoneLeft}`}>
            <div className={styles.phoneFrame}>
              <div className={styles.phoneNotch} />
              <div className={styles.phoneScreen}>
                <Image
                  src="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/pages/home/app-screen-garage.webp"
                  alt="AutoRev Garage - Your vehicles and builds"
                  fill
                  className={styles.screenImage}
                  priority
                />
              </div>
            </div>
            <p className={styles.phoneLabel}>Your Garage</p>
          </div>

          {/* Center Phone - Build Planner (Featured) */}
          <div className={`${styles.phoneMockup} ${styles.phoneCenter}`}>
            <div className={styles.phoneFrame}>
              <div className={styles.phoneNotch} />
              <div className={styles.phoneScreen}>
                <Image
                  src="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/pages/home/app-screen-build.webp"
                  alt="AutoRev Build Planner - Configure upgrades"
                  fill
                  className={styles.screenImage}
                  priority
                />
              </div>
            </div>
            <p className={styles.phoneLabel}>Build Planner</p>
          </div>

          {/* Right Phone - Performance View */}
          <div className={`${styles.phoneMockup} ${styles.phoneRight}`}>
            <div className={styles.phoneFrame}>
              <div className={styles.phoneNotch} />
              <div className={styles.phoneScreen}>
                <Image
                  src="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/pages/home/app-screen-performance.webp"
                  alt="AutoRev Performance - Dyno and track estimates"
                  fill
                  className={styles.screenImage}
                  priority
                />
              </div>
            </div>
            <p className={styles.phoneLabel}>Performance Data</p>
          </div>
        </div>
      </main>

      {/* Features Strip */}
      <section className={styles.featuresStrip}>
        <div className={styles.feature}>
          <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span>188+ Sports Cars</span>
        </div>
        <div className={styles.featureDivider} />
        <div className={styles.feature}>
          <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <span>1000+ Parts</span>
        </div>
        <div className={styles.featureDivider} />
        <div className={styles.feature}>
          <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          </svg>
          <span>AI Build Assistant</span>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className={styles.minimalFooter}>
        <p>© 2026 AutoRev • <Link href="/privacy">Privacy</Link> • <Link href="/terms">Terms</Link></p>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />
    </div>
  );
}
