import { FeatureShowcase, LandingCTA, LandingHero, LandingProblem, LandingTracking } from '@/components/landing';
import styles from './page.module.css';

export const metadata = {
  title: 'Your Garage',
  description: "Everything about your car. One place. Build a personal command center for maintenance, recalls, and known issues.",
  alternates: { canonical: '/landing/your-garage' },
};

const Icons = {
  tabs: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4h18v16H3z" />
      <path d="M3 8h18" />
      <path d="M7 4v4" />
      <path d="M12 4v4" />
      <path d="M17 4v4" />
    </svg>
  ),
  alert: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.3 4.3 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
  book: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  target: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  ),
  garage: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  chat: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  ),
  shield: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

export default function YourGarageLandingPage() {
  return (
    <div className={styles.page}>
      <LandingTracking pageId="your-garage" />

      <LandingHero
        pageId="your-garage"
        badgeText="For proud owners"
        headline="Your Car's Command Center"
        subhead="Maintenance specs, recall awareness, known issues, and more — organized around your specific car."
        primaryCtaLabel="Add Your Car"
        primaryCtaHref="/garage"
        secondaryCtaLabel="See the features"
        secondaryCtaHref="#features"
      />

      <LandingProblem
        headline="Owning a sports car shouldn't require 10 browser tabs"
        items={[
          { icon: <Icons.book />, title: 'Specs buried', description: 'Oil specs and intervals hidden inside PDFs and forums.' },
          { icon: <Icons.alert />, title: 'Recalls too late', description: 'You hear about issues after the window to act has passed.' },
          { icon: <Icons.tabs />, title: 'Scattered knowledge', description: 'Known issues live everywhere — and never match your exact car.' },
          { icon: <Icons.target />, title: 'No source of truth', description: 'There’s no single place that stays organized for YOUR platform.' },
        ]}
      />

      <div id="features" />
      <FeatureShowcase
        icon={<Icons.garage />}
        headline="My Garage"
        description="Your personal automotive command center. Add your cars and keep the important stuff in one place."
        bullets={[
          'Favorites and saved cars (Free)',
          'VIN decode to identify exact variant (Enthusiast+)',
          'Owner reference: oil type, capacity, intervals (Enthusiast+)',
          'VIN-matched recall awareness (Enthusiast+)',
          'Service log + market value tracking (Enthusiast+)',
        ]}
        imageSrc="/images/onboarding/garage-02-details.png"
        imageAlt="AutoRev My Garage screen"
        imageCaption="My Garage"
      />

      <FeatureShowcase
        reversed
        icon={<Icons.chat />}
        headline="AL — Your Car Expert"
        description="Ask anything about your car. AL answers with context for your model and cites sources whenever possible."
        bullets={[
          "Explains common issues in plain English",
          'Helps you understand service intervals and what’s due',
          'Builds confidence before you wrench (or book a shop)',
          'Cites sources — doesn’t make things up',
        ]}
        imageSrc="/images/onboarding/ai-al-05-response-analysis.png"
        imageAlt="AutoRev AL chat response"
        imageCaption="Ask AL"
      />

      <section className={styles.trust}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Real data. Not guesses.</h2>
          <div className={styles.trustGrid}>
            <div className={styles.trustCard}>
              <div className={styles.trustIcon}>
                <Icons.book />
              </div>
              <h3 className={styles.trustTitle}>OEM references</h3>
              <p className={styles.trustDesc}>We prioritize manufacturer specs and service guidance whenever available.</p>
            </div>
            <div className={styles.trustCard}>
              <div className={styles.trustIcon}>
                <Icons.shield />
              </div>
              <h3 className={styles.trustTitle}>Recall awareness</h3>
              <p className={styles.trustDesc}>Recall info is tied to official sources and your vehicle context when possible.</p>
            </div>
            <div className={styles.trustCard}>
              <div className={styles.trustIcon}>
                <Icons.target />
              </div>
              <h3 className={styles.trustTitle}>Enthusiast insights</h3>
              <p className={styles.trustDesc}>We surface patterns owners actually report — and label the source clearly.</p>
            </div>
          </div>
        </div>
      </section>

      <LandingCTA
        pageId="your-garage"
        headline="Know your car better"
        subhead="Start your Garage today. Save favorites for free — upgrade anytime to unlock VIN decode, recalls, and owner reference tools."
        primaryCtaLabel="Add Your Car Free"
        primaryCtaHref="/garage"
        secondaryCtaLabel="Explore cars first"
        secondaryCtaHref="/browse-cars"
        note="Free tier includes favorites + basic features. Upgrade anytime."
      />
    </div>
  );
}


