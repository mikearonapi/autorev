'use client';

import { useState, useEffect } from 'react';

import Image from 'next/image';

import AuthModal, { useAuthModal } from '@/components/AuthModal';
import IPhoneFrame from '@/components/IPhoneFrame';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import { Icons } from '@/components/ui/Icons';
import usePWAInstall from '@/hooks/usePWAInstall';
import { SITE_DESIGN_IMAGES, UI_IMAGES } from '@/lib/images';

import styles from './page.module.css';

/**
 * AutoRev Homepage - GRAVL-Inspired Design
 *
 * Structure:
 * 1. Hero - Logo centered, punchy headline, 3-phone display
 * 2. AL Introduction section
 * 3. Feature sections alternating text + single phone
 * 4. Final CTA
 * (Footer is provided by global layout)
 *
 * All images served from Vercel Blob CDN for optimal page speed
 */

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

// Local aliases for icons used in this file
const LocalIcons = {
  arrow: () => <Icons.arrowRight size={20} />,
  camera: () => <Icons.camera size={18} />,
  arrowUp: () => <Icons.arrowUp size={18} />,
};

export default function Home() {
  const authModal = useAuthModal();
  const [typedText, setTypedText] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [showPWAModal, setShowPWAModal] = useState(false);

  // PWA Install
  const { isInstalled, canPromptNatively, promptInstall } = usePWAInstall();

  // Handle download click - always available on homepage
  const handleDownload = async () => {
    if (canPromptNatively) {
      // Chrome/Edge - trigger native install prompt
      const result = await promptInstall();
      // If prompt was dismissed or unavailable, show instructions as fallback
      if (result.outcome !== 'accepted') {
        setShowPWAModal(true);
      }
    } else {
      // iOS/Safari/or prompt already used - show instructions modal
      setShowPWAModal(true);
    }
  };

  // Typing animation effect
  useEffect(() => {
    const currentQuestion = AL_SAMPLE_QUESTIONS[questionIndex];
    let charIndex = 0;
    let timeout;

    if (isTyping) {
      // Type characters one by one
      const typeChar = () => {
        if (charIndex <= currentQuestion.length) {
          setTypedText(currentQuestion.slice(0, charIndex));
          charIndex++;
          timeout = setTimeout(typeChar, 50 + Math.random() * 30); // Natural typing speed
        } else {
          // Pause at end of question, then clear and move to next
          timeout = setTimeout(() => {
            setIsTyping(false);
          }, 2000);
        }
      };
      typeChar();
    } else {
      // Clear text and move to next question
      timeout = setTimeout(() => {
        setTypedText('');
        setQuestionIndex((prev) => (prev + 1) % AL_SAMPLE_QUESTIONS.length);
        setIsTyping(true);
      }, 500);
    }

    return () => clearTimeout(timeout);
  }, [questionIndex, isTyping]);

  return (
    <div className={styles.page} data-no-main-offset>
      {/* Hero Section */}
      <section className={styles.hero}>
        {/* Centered Logo */}
        <div className={styles.logo}>
          <span className={styles.logoAuto}>AUTO</span>
          <span className={styles.logoRev}>REV</span>
        </div>

        {/* Punchy Headline - 2 colors only: white and lime */}
        <h1 className={styles.headline}>
          <span className={styles.headlineAccent}>OPTIMIZE</span>
          <span className={styles.headlineWhite}> YOUR CAR,</span>
          <br />
          <span className={styles.headlineAccent}>MAXIMIZE</span>
          <span className={styles.headlineWhite}> YOUR GAINS</span>
        </h1>

        {/* Subtext */}
        <p className={styles.subtext}>
          Research mods for your car, compare different brands, find deals, get straight answers —
          all in one app built for speed.
        </p>

        {/* CTA Button - slimmer */}
        <button className={styles.ctaButton} onClick={() => authModal.openSignIn()}>
          LOGIN / GET STARTED FREE
        </button>

        {/* Download link - always show unless already installed as PWA */}
        {!isInstalled && (
          <button className={styles.downloadLink} onClick={handleDownload}>
            Download
          </button>
        )}

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
                priority
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
                priority
              />
            </IPhoneFrame>
          </div>
        </div>
      </section>

      {/* AL Introduction Section */}
      <section className={styles.alIntro}>
        <div className={styles.alAvatar}>
          <Image
            src={UI_IMAGES.alMascotFull}
            alt="AL - Your AI Assistant"
            width={80}
            height={80}
            className={styles.alAvatarImage}
          />
        </div>
        <p className={styles.alGreeting}>
          Hi, I'm <span className={styles.alName}>AL</span>, your AutoRev AI.
        </p>
        <p className={styles.alTagline}>
          Tony Stark had Jarvis. <span className={styles.alHighlight}>You have AL.</span>
        </p>

        {/* Simulated Input Box */}
        <div className={styles.alInputDemo}>
          <div className={styles.alInputWrapper}>
            <button className={styles.alAttachmentBtn} aria-label="Add attachment">
              <LocalIcons.camera />
            </button>
            <div className={styles.alInputText}>
              {typedText || <span className={styles.alInputPlaceholder}>Ask AL anything...</span>}
              <span className={styles.alCursor} />
            </div>
            <button
              className={`${styles.alSendBtn} ${typedText ? styles.alSendBtnActive : ''}`}
              aria-label="Send"
            >
              <LocalIcons.arrowUp />
            </button>
          </div>
        </div>

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
        <button className={styles.finalCta} onClick={() => authModal.openSignUp()}>
          GET STARTED FREE <LocalIcons.arrow />
        </button>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />

      {/* PWA Install Modal (iOS instructions) */}
      {showPWAModal && (
        <PWAInstallPrompt
          variant="modal"
          forceShow={true}
          onDismissed={() => setShowPWAModal(false)}
        />
      )}
    </div>
  );
}
