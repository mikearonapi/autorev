'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import IPhoneFrame from '@/components/IPhoneFrame';
import { ONBOARDING_IMAGES } from '@/lib/images';
import styles from './page.module.css';

/**
 * AutoRev Homepage - Premium Automotive Build Platform
 * 
 * Brand: Performance Orange (#ff4d00) + Tech Blue (#00d4ff) on Carbon Black
 * See: /docs/BRAND.md for full brand guidelines
 * 
 * Structure:
 * 1. Hero - App showcase with phone mockups
 * 2. Features Strip - Quick stats (300+ cars, 700+ parts, AI)
 * 3. Highlight Card - Value proposition
 * 4. FAQ Accordion - Common questions
 * 5. Why AutoRev - 4 core features (Garage, Data, Community, AL)
 * 6. Final CTA
 * 7. Footer
 * 
 * Core Focus: Build, upgrade, and optimize car performance
 */

// FAQ Data
const FAQ_ITEMS = [
  {
    id: 'free',
    question: 'START FOR FREE',
    answer: 'Start building for free, no credit card required. Explore the platform, browse cars, and plan your first build without any commitment.'
  },
  {
    id: 'garage',
    question: 'WHAT CAN I DO IN MY GARAGE?',
    answer: 'Track cars you own with VIN decoding, get variant-specific specs and fluid capacities, log maintenance, monitor recalls, and track market values. Your garage is your personal command center for every vehicle you own.'
  },
  {
    id: 'data',
    question: 'WHERE DOES THE DATA COME FROM?',
    answer: 'Our database includes 300+ sports cars with verified specs, 700+ parts with real fitment data, dyno results, lap times, and expert video reviews. We aggregate data from manufacturer specs, enthusiast communities, and performance shops.'
  },
  {
    id: 'al',
    question: 'HOW DOES AL WORK?',
    answer: 'AL is your AI co-pilot with access to our entire database. Ask about specs, reliability issues, mod recommendations, or maintenance schedules. AL searches our data and expert reviews to give you accurate, car-specific answers.'
  }
];

// Chevron Icon
const ChevronIcon = ({ isOpen }) => (
  <svg 
    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Download Icon
const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default function Home() {
  const authModal = useAuthModal();
  const [openFaq, setOpenFaq] = useState('free');
  
  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };
  
  return (
    <div className={styles.landingPage}>
      {/* Minimal Header */}
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

      {/* Hero Section */}
      <main className={styles.hero}>
        {/* Headline - GRAVL-style mixed accent/muted */}
        <h1 className={styles.headline}>
          <span className={styles.headlineAccent}>TAKE</span> <span className={styles.headlineMuted}>YOUR</span>
          <br />
          <span className={styles.headlineAccent}>BUILDS</span> <span className={styles.headlineMuted}>TO THE</span>
          <br />
          <span className={styles.headlineAccent}>NEXT LEVEL</span>
        </h1>

        {/* Subheadline - Softer gray */}
        <p className={styles.subheadline}>
          Get faster, build smarter, or track your mods with personalized tuning guides that adapt as you progress.
        </p>

        {/* Single CTA - Clean like GRAVL */}
        <button 
          className={styles.primaryCta}
          onClick={() => authModal.openSignUp()}
        >
          GET STARTED
        </button>

        {/* Phone Mockup Section - 3 phones fanned like GRAVL */}
        <div className={styles.phoneStack}>
          {/* Back Left Phone */}
          <div className={`${styles.stackedPhone} ${styles.phoneBackLeft}`}>
            <IPhoneFrame size="small">
              <Image
                src={ONBOARDING_IMAGES.garageDetails}
                alt="AutoRev Garage Details"
                fill
                className={styles.screenImage}
                priority
              />
            </IPhoneFrame>
          </div>

          {/* Center Phone (Front) */}
          <div className={`${styles.stackedPhone} ${styles.phoneFront}`}>
            <IPhoneFrame size="small">
              <Image
                src={ONBOARDING_IMAGES.tuningShopOverview}
                alt="AutoRev Tuning Shop"
                fill
                className={styles.screenImage}
                priority
              />
            </IPhoneFrame>
          </div>

          {/* Back Right Phone */}
          <div className={`${styles.stackedPhone} ${styles.phoneBackRight}`}>
            <IPhoneFrame size="small">
              <Image
                src={ONBOARDING_IMAGES.aiAlResponseMods}
                alt="AutoRev AL Assistant"
                fill
                className={styles.screenImage}
                priority
              />
            </IPhoneFrame>
          </div>
        </div>
      </main>

      {/* Highlight Card - Value Prop */}
      <section className={styles.highlightSection}>
        <div className={styles.highlightCard}>
          <p className={styles.highlightSubtext}>Build with confidence</p>
          <h2 className={styles.highlightHeadline}>
            <span className={styles.highlightAccent}>SMARTER BUILDS</span>
            <br />
            THAT LEAD TO RESULTS
          </h2>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        {FAQ_ITEMS.map((item) => (
          <div key={item.id} className={styles.faqItem}>
            <button 
              className={styles.faqQuestion}
              onClick={() => toggleFaq(item.id)}
              aria-expanded={openFaq === item.id}
            >
              <span className={styles.faqQuestionText}>{item.question}</span>
              <ChevronIcon isOpen={openFaq === item.id} />
            </button>
            <div 
              className={`${styles.faqAnswer} ${openFaq === item.id ? styles.faqAnswerOpen : ''}`}
            >
              <p>{item.answer}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Why AutoRev Section */}
      <section className={styles.whySection}>
        <h2 className={styles.whySectionTitle}>
          <span className={styles.highlightAccent}>WHY USE</span> AUTOREV
        </h2>

        {/* Feature 1: Your Garage */}
        <div className={styles.featureBlock}>
          <div className={styles.featureContent}>
            <h3 className={styles.featureTitle}>
              <span className={styles.highlightAccent}>YOUR PERSONAL GARAGE</span>
            </h3>
            <p className={styles.featureDescription}>
              Add vehicles you own or dream about. Track favorites, save research, 
              and keep everything organized. Your garage is your home base for 
              planning builds, tracking maintenance, and monitoring your car's health.
            </p>
          </div>
          <div className={styles.featurePhones}>
            <IPhoneFrame size="small">
              <Image
                src={ONBOARDING_IMAGES.garageDetails}
                alt="Your Garage - Vehicle management"
                fill
                className={styles.screenImage}
                loading="lazy"
              />
            </IPhoneFrame>
          </div>
        </div>

        {/* Feature 2: Garage Data */}
        <div className={styles.featureBlock}>
          <div className={styles.featureContent}>
            <h3 className={styles.featureTitle}>
              <span className={styles.highlightAccent}>REAL DATA</span> FOR REAL BUILDS
            </h3>
            <p className={styles.featureDescription}>
              VIN decode to get your exact variant. Access fluid capacities, 
              torque specs, and maintenance schedules. Track market values, 
              view recall alerts, and log every service. Data-driven ownership.
            </p>
          </div>
          <div className={styles.featurePhones}>
            <IPhoneFrame size="small">
              <Image
                src={ONBOARDING_IMAGES.garageReference}
                alt="Garage Data - Specs and maintenance"
                fill
                className={styles.screenImage}
                loading="lazy"
              />
            </IPhoneFrame>
          </div>
        </div>

        {/* Feature 3: Community */}
        <div className={styles.featureBlock}>
          <div className={styles.featureContent}>
            <h3 className={styles.featureTitle}>
              <span className={styles.highlightAccent}>JOIN THE COMMUNITY</span>
            </h3>
            <p className={styles.featureDescription}>
              Share your builds, discover events, and connect with enthusiasts. 
              Find Cars & Coffee meets, track days, and car shows near you. 
              Get inspired by what others are building.
            </p>
          </div>
          <div className={styles.featurePhones}>
            <IPhoneFrame size="small">
              <Image
                src={ONBOARDING_IMAGES.communityEventsList}
                alt="Community - Builds and events"
                fill
                className={styles.screenImage}
                loading="lazy"
              />
            </IPhoneFrame>
          </div>
        </div>

        {/* Feature 4: AI AL */}
        <div className={styles.featureBlock}>
          <div className={styles.featureContent}>
            <h3 className={styles.featureTitle}>
              <span className={styles.highlightAccent}>ASK AL</span> ANYTHING
            </h3>
            <p className={styles.featureDescription}>
              Your AI co-pilot with full access to specs, known issues, 
              expert reviews, and mod recommendations. Ask about reliability, 
              compare options, or get build advice. AL learns from our entire database.
            </p>
          </div>
          <div className={styles.featurePhones}>
            <IPhoneFrame size="small">
              <Image
                src={ONBOARDING_IMAGES.aiAlResponseAnalysis}
                alt="AL AI Assistant"
                fill
                className={styles.screenImage}
                loading="lazy"
              />
            </IPhoneFrame>
          </div>
        </div>
      </section>

      {/* Second Highlight Card */}
      <section className={styles.highlightSection}>
        <div className={styles.highlightCard}>
          <p className={styles.highlightSubtext}>Plan. Build. Optimize.</p>
          <h2 className={styles.highlightHeadline}>
            <span className={styles.highlightAccent}>BUILD MORE</span> AND
            <br />
            GET <span className={styles.highlightAccent}>RESULTS</span>
          </h2>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <p className={styles.finalCtaSubtext}>100% free to start, no credit card needed</p>
        <button 
          className={styles.finalCtaButton}
          onClick={() => authModal.openSignUp()}
        >
          GET STARTED <DownloadIcon />
        </button>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <div className={styles.footerSection}>
            <h4 className={styles.footerSectionTitle}>INFO</h4>
            <Link href="/terms">Terms & Conditions</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
          <div className={styles.footerSection}>
            <h4 className={styles.footerSectionTitle}>EXPLORE</h4>
            <Link href="/browse-cars">Browse Cars</Link>
            <Link href="/encyclopedia">Encyclopedia</Link>
            <Link href="/community/events">Events</Link>
          </div>
          <div className={styles.footerSection}>
            <h4 className={styles.footerSectionTitle}>CONTACT</h4>
            <Link href="/contact">Support</Link>
          </div>
        </div>
        <p className={styles.footerCopyright}>© 2026 AUTOREV</p>
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
