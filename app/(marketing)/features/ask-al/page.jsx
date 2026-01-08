'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from '../page.module.css';

// Icons
const SparklesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
  </svg>
);

const MessageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const BrainIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2z"/>
  </svg>
);

const CarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H8L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
);

const WrenchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </svg>
);

const ImagePlaceholder = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="9" cy="9" r="2"/>
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
  </svg>
);

const FEATURES = [
  {
    icon: MessageIcon,
    title: 'Skip the Forum Trolls',
    description: 'No more digging through 50-page threads. AL cuts straight to the answer with sources you can trust.',
  },
  {
    icon: BrainIcon,
    title: 'Never Forgets Anything',
    description: 'Every spec, every known issue, every owner insight — instantly recalled. No more "I read this somewhere..."',
  },
  {
    icon: CarIcon,
    title: 'Your Car, Your Context',
    description: 'AL knows your exact year, model, and mods. Answers are tailored to your specific situation.',
  },
  {
    icon: WrenchIcon,
    title: 'Mod Planning Made Easy',
    description: 'Planning upgrades? AL suggests compatible parts, warns about conflicts, and links relevant YouTube videos.',
  },
  {
    icon: ShieldIcon,
    title: 'Recalls & TSBs',
    description: 'Never miss a safety recall or technical service bulletin. AL keeps you informed.',
  },
];

export default function AskALFeaturePage() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground} />
        <div className={styles.heroGlow} style={{ '--feature-color': '#d4af37' }} />
        
        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>
            <SparklesIcon />
          </div>
          
          <span className={styles.heroLabel}>AI-Powered</span>
          
          <h1 className={styles.heroTitle}>
            Meet <span className={styles.heroTitleAccent}>AL</span>,<br />
            Your Car Expert
          </h1>
          
          <p className={styles.heroDescription}>
            Like having the obsessive car nerd in your pocket — who&apos;s done all the research 
            and never forgets anything. Tech specs, troubleshooting, aftermarket upgrades, recalls, 
            you name it. Avoid the forum trolls, cut straight to the answer.
          </p>
          
          <p className={styles.heroJarvisTag}>
            Tony Stark had Jarvis. Now you have AL.
          </p>
          
          <Link href="/al" className={styles.heroCTA}>
            Start Chatting with AL
            <ArrowRightIcon />
          </Link>
        </div>
      </section>

      {/* Main Feature Image */}
      <section className={styles.featureShowcase}>
        <div className={styles.showcaseContainer}>
          <div className={styles.showcaseImageWrapper}>
            {/* Replace with actual image */}
            <div className={styles.showcasePlaceholder}>
              <ImagePlaceholder />
              <span>Add image: features/ask-al/hero.png (16:9 ratio)<br />Show AL conversation interface</span>
            </div>
            {/* <Image 
              src="/images/features/ask-al/hero.png" 
              alt="AL AI assistant conversation interface"
              width={1200}
              height={675}
              className={styles.showcaseImage}
            /> */}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>What AL Can Do</h2>
            <p className={styles.sectionSubtitle}>Your personal automotive expert, available 24/7</p>
          </div>
          
          <div className={styles.featuresGrid}>
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className={styles.featureCard}>
                  <div className={styles.featureCardIcon}>
                    <Icon />
                  </div>
                  <h3 className={styles.featureCardTitle}>{feature.title}</h3>
                  <p className={styles.featureCardDescription}>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Secondary Image Section */}
      <section className={styles.secondaryShowcase}>
        <div className={styles.secondaryContainer}>
          <div className={styles.secondaryContent}>
            <h3>No Bias. No Guessing.</h3>
            <p>
              Unlike generic AI that makes things up, AL is grounded in AutoRev&apos;s 
              database of real specs, owner reviews, and verified mod data. 
              Ask about your specific car and get answers you can actually trust — 
              with sources, not hallucinations.
            </p>
            <Link href="/al" className={styles.heroCTA}>
              Try AL Now
              <ArrowRightIcon />
            </Link>
          </div>
          
          <div className={styles.secondaryImageWrapper}>
            {/* Replace with actual image */}
            <div className={styles.showcasePlaceholder}>
              <ImagePlaceholder />
              <span>Add image: features/ask-al/mobile.png<br />Show AL on mobile or example Q&A</span>
            </div>
            {/* <Image 
              src="/images/features/ask-al/mobile.png" 
              alt="AL on mobile device"
              width={600}
              height={400}
              className={styles.secondaryImage}
            /> */}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContainer}>
          <h2 className={styles.ctaTitle}>Ready to Ask AL?</h2>
          <p className={styles.ctaDescription}>
            Get instant answers about any sports car. No signup required.
          </p>
          <Link href="/al" className={styles.ctaButton}>
            Start a Conversation
            <ArrowRightIcon />
          </Link>
          
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <p className={styles.statValue}>2,500+</p>
              <p className={styles.statLabel}>Cars in Database</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>24/7</p>
              <p className={styles.statLabel}>Always Available</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>Instant</p>
              <p className={styles.statLabel}>Response Time</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

