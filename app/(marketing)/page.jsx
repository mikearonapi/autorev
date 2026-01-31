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
 * All images served from Vercel Blob CDN for optimal page speed
 */

import Image from 'next/image';

import { HeroCTA, FinalCTA, TypingAnimation } from '@/components/homepage';
import IPhoneFrame from '@/components/IPhoneFrame';
import { SITE_DESIGN_IMAGES, UI_IMAGES } from '@/lib/images';

import styles from './page.module.css';

// Feature sections data - 7 sections in order
const FEATURES = [
  // 1. My Garage - Your car cards and ownership
  {
    id: 'my-garage',
    title: 'YOUR GARAGE',
    titleAccent: 'YOUR COMMAND CENTER',
    description:
      'Add the cars you own and love. Track specs, mileage, and ownership history. Your garage is always ready when you are.',
    screen: SITE_DESIGN_IMAGES.garageOverview, // Car card with stats
  },
  // 2. My Garage Upgrades / Parts
  {
    id: 'garage-upgrades',
    title: 'PLAN YOUR BUILD',
    titleAccent: 'PARTS THAT FIT',
    description:
      'Curated upgrade paths for track, street, or daily driving. See exactly what each mod delivers — power gains, real-world feel, and compatibility.',
    screen: SITE_DESIGN_IMAGES.tuningOverview, // Upgrade categories
  },
  // 3. My Garage Performance
  {
    id: 'garage-performance',
    title: 'KNOW YOUR NUMBERS',
    titleAccent: 'PERFORMANCE METRICS',
    description:
      'See calculated 0-60, quarter mile, and experience scores. Understand exactly how your mods translate to real-world performance.',
    screen: SITE_DESIGN_IMAGES.performanceMetrics, // Performance metrics experience scores
  },
  // 4. My Data Dyno
  {
    id: 'data-dyno',
    title: 'VIRTUAL DYNO',
    titleAccent: 'SEE YOUR POWER',
    description:
      'Visualize estimated HP and torque curves based on your modifications. Track gains from each upgrade and log real dyno results.',
    screen: SITE_DESIGN_IMAGES.garageData, // Virtual dyno chart
  },
  // 5. My Data Track
  {
    id: 'data-track',
    title: 'LAP TIME ESTIMATOR',
    titleAccent: 'TRACK YOUR TIMES',
    description:
      'Predict lap times at popular tracks based on your build. Log real sessions and compare your progress over time.',
    screen: SITE_DESIGN_IMAGES.lapTimeEstimator, // Lap time estimator
  },
  // 6. Community
  {
    id: 'community',
    title: 'COMMUNITY BUILDS',
    titleAccent: 'REAL ENTHUSIASTS',
    description:
      'Get inspiration from real builds. Share your progress, find local events, and connect with owners who share your passion.',
    screen: SITE_DESIGN_IMAGES.communityFeed, // Community builds feed
  },
  // 7. AI AL
  {
    id: 'al',
    title: 'ASK AL ANYTHING',
    titleAccent: 'YOUR AI EXPERT',
    description:
      'No more hours of forum searching. AL knows your car, your mods, and your goals. Get instant answers to any question.',
    screen: SITE_DESIGN_IMAGES.alChatResponse, // AL chat response
  },
];

// Sample questions for typing animation - complex questions that showcase AL's depth
const AL_SAMPLE_QUESTIONS = [
  'What wheel fitment can I run without rubbing?',
  'If I upgrade my fuel pump, do I need a tune?',
  'What are the common failure points on this engine?',
  'What torque specs and tools do I need for this job?',
  'Can I run E85 with my current fuel system?',
  "What's the best mod order for a $5k budget?",
];

export default function Home() {
  return (
    <div className={styles.page} data-no-main-offset>
      {/* Hero Section */}
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
              loading="eager"
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

          {/* Center Phone (front) - HERO: Most compelling image */}
          <div className={styles.phoneCenter}>
            <IPhoneFrame size="small">
              <Image
                src={SITE_DESIGN_IMAGES.heroCenter}
                alt="Your Garage - Track Your Build"
                fill
                sizes="224px"
                className={styles.screenImage}
                priority
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

      {/* AL Introduction Section */}
      <section className={styles.alIntro}>
        <div className={styles.alAvatar}>
          <Image
            src={UI_IMAGES.alMascot}
            alt="AL - Your AI Assistant"
            width={88}
            height={88}
            sizes="(max-width: 768px) 88px, 100px"
            className={styles.alAvatarImage}
          />
        </div>
        <p className={styles.alGreeting}>
          Hi, I'm <span className={styles.alName}>AL</span>, your AutoRev AI.
        </p>
        <p className={styles.alTagline}>
          Tony Stark had Jarvis. <span className={styles.alHighlight}>You have AL.</span>
        </p>

        {/* Typing Animation - Client Component */}
        <TypingAnimation questions={AL_SAMPLE_QUESTIONS} />

        {/* AL Data Access List */}
        <div className={styles.alDataAccess}>
          <p className={styles.alDataLabel}>AL has instant access to:</p>
          <ul className={styles.alDataList}>
            <li>Platform-specific specs & known issues</li>
            <li>Modification compatibility & gains</li>
            <li>Torque specs & service intervals</li>
            <li>Real dyno results & owner experiences</li>
            <li>Part fitment & current pricing</li>
          </ul>
        </div>
      </section>

      {/* Feature Card Section */}
      <section className={styles.featureCard}>
        <p className={styles.featureCardLabel}>Built for enthusiasts who want more</p>
        <h2 className={styles.featureCardTitle}>
          <span className={styles.featureCardBold}>SMARTER BUILDS</span>
          <br />
          THAT LEAD TO RESULTS
        </h2>
      </section>

      {/* Feature Sections - Alternating text and phone */}
      {FEATURES.map((feature, index) => (
        <section key={feature.id} className={styles.featureSection}>
          <div className={styles.featureText}>
            <h3 className={styles.featureTitle}>
              <span className={styles.featureTitleAccent}>{feature.title}</span>
              {feature.titleAccent && (
                <>
                  <br />
                  <span className={styles.featureTitleWhite}>{feature.titleAccent}</span>
                </>
              )}
            </h3>
            <p className={styles.featureDescription}>{feature.description}</p>
          </div>
          <div className={styles.featurePhone}>
            <IPhoneFrame size="small">
              <Image
                src={feature.screen}
                alt={feature.title}
                fill
                sizes="224px"
                className={styles.screenImage}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </IPhoneFrame>
          </div>
        </section>
      ))}

      {/* Final CTA Section */}
      <section className={styles.finalSection}>
        <h2 className={styles.finalHeadline}>
          STOP GUESSING.
          <br />
          <span className={styles.finalAccent}>START BUILDING.</span>
        </h2>
        <p className={styles.finalSubtext}>100% free to start. No credit card required.</p>
        <FinalCTA />
      </section>
    </div>
  );
}
