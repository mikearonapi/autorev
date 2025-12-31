'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from '../page.module.css';

// Icons
const GarageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <path d="M9 22V12h6v10"/>
  </svg>
);

const CarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H8L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
);

const QRCodeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="5" height="5"/>
    <rect x="16" y="3" width="5" height="5"/>
    <rect x="3" y="16" width="5" height="5"/>
    <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
    <path d="M21 21v.01"/>
    <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
    <path d="M3 12h.01"/>
    <path d="M12 3h.01"/>
    <path d="M12 16v.01"/>
    <path d="M16 12h1"/>
    <path d="M21 12v.01"/>
    <path d="M12 21v-1"/>
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const ClipboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    <path d="M9 12h6"/>
    <path d="M9 16h6"/>
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
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
    icon: CarIcon,
    title: 'Digital Garage',
    description: 'Add your sports cars and keep all their details organized in one place.',
  },
  {
    icon: QRCodeIcon,
    title: 'VIN Decoder',
    description: 'Decode your VIN to verify specs, production details, and hidden features.',
  },
  {
    icon: ShieldIcon,
    title: 'Recall Alerts',
    description: 'Get notified about safety recalls and technical service bulletins for your cars.',
  },
  {
    icon: ClipboardIcon,
    title: 'Maintenance Tracking',
    description: 'Log oil changes, repairs, and service history. Never miss scheduled maintenance.',
  },
  {
    icon: BellIcon,
    title: 'Service Reminders',
    description: 'Set reminders for upcoming maintenance based on mileage or time intervals.',
  },
];

export default function OwnFeaturePage() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground} />
        <div className={styles.heroGlow} style={{ '--feature-color': '#8b5cf6' }} />
        
        <div className={styles.heroContent}>
          <div className={styles.heroIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}>
            <GarageIcon />
          </div>
          
          <span className={styles.heroLabel}>Ownership</span>
          
          <h1 className={styles.heroTitle}>
            Your <span className={styles.heroTitleAccent}>Digital</span><br />
            Garage
          </h1>
          
          <p className={styles.heroDescription}>
            Track every detail of your sports car ownership. From VIN decoding 
            and recall alerts to maintenance logs and service reminders—
            everything you need to be a responsible owner.
          </p>
          
          <Link href="/garage" className={styles.heroCTA}>
            Open Your Garage
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
              <span>Add image: features/own/hero.png (16:9 ratio)<br />Show garage dashboard with car cards</span>
            </div>
            {/* <Image 
              src="/images/features/own/hero.png" 
              alt="Digital garage showing owned vehicles"
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
            <h2 className={styles.sectionTitle}>Ownership Made Easy</h2>
            <p className={styles.sectionSubtitle}>Everything you need to manage your sports cars</p>
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
            <h3>Stay Ahead of Issues</h3>
            <p>
              Our recall monitoring system checks NHTSA databases daily and 
              alerts you immediately when your car is affected. Plus, get 
              notified about TSBs (Technical Service Bulletins) that could 
              save you time and money at the shop.
            </p>
            <Link href="/garage" className={styles.heroCTA}>
              Add Your First Car
              <ArrowRightIcon />
            </Link>
          </div>
          
          <div className={styles.secondaryImageWrapper}>
            {/* Replace with actual image */}
            <div className={styles.showcasePlaceholder}>
              <ImagePlaceholder />
              <span>Add image: features/own/alerts.png<br />Show recall alerts or maintenance log</span>
            </div>
            {/* <Image 
              src="/images/features/own/alerts.png" 
              alt="Recall and maintenance alerts"
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
          <h2 className={styles.ctaTitle}>Start Tracking Your Cars</h2>
          <p className={styles.ctaDescription}>
            Create your free account and add your first vehicle.
          </p>
          <Link href="/garage" className={styles.ctaButton}>
            Build Your Garage
            <ArrowRightIcon />
          </Link>
          
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <p className={styles.statValue}>Free</p>
              <p className={styles.statLabel}>Unlimited Vehicles</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>Daily</p>
              <p className={styles.statLabel}>Recall Checks</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>Complete</p>
              <p className={styles.statLabel}>Service History</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


