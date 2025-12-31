'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from '../page.module.css';

// Icons
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const FlagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
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
    icon: MapPinIcon,
    title: 'Local Events',
    description: 'Find car shows, meets, track days, and rallies happening near you.',
  },
  {
    icon: CalendarIcon,
    title: 'Event Calendar',
    description: 'Browse events by date, filter by type, and never miss what matters to you.',
  },
  {
    icon: FlagIcon,
    title: 'Track Days',
    description: 'Discover autocross, HPDE, and time attack events at tracks in your region.',
  },
  {
    icon: UsersIcon,
    title: 'Car Meets',
    description: 'Connect with local enthusiasts at Cars & Coffee, cruise nights, and club meets.',
  },
  {
    icon: BellIcon,
    title: 'Event Alerts',
    description: 'Get notified when new events are added in your area or for your car type.',
  },
];

export default function ConnectFeaturePage() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground} />
        <div className={styles.heroGlow} style={{ '--feature-color': '#f97316' }} />
        
        <div className={styles.heroContent}>
          <div className={styles.heroIcon} style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}>
            <CalendarIcon />
          </div>
          
          <span className={styles.heroLabel}>Events</span>
          
          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleAccent}>Connect</span> With<br />
            Car Culture
          </h1>
          
          <p className={styles.heroDescription}>
            Discover car shows, track days, cruise nights, and meets happening 
            near you. The automotive community is waiting—find your next event 
            and get involved.
          </p>
          
          <Link href="/events" className={styles.heroCTA}>
            Find Events
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
              <span>Add image: features/connect/hero.png (16:9 ratio)<br />Show events map or calendar view</span>
            </div>
            {/* <Image 
              src="/images/features/connect/hero.png" 
              alt="Events map showing local car events"
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
            <h2 className={styles.sectionTitle}>Never Miss an Event</h2>
            <p className={styles.sectionSubtitle}>Your gateway to the local car scene</p>
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
            <h3>From Casual to Competitive</h3>
            <p>
              Whether you want to show off your build at a local meet, learn 
              to drive at the limit during an HPDE session, or compete in 
              autocross—we've got events for every type of enthusiast.
            </p>
            <Link href="/events" className={styles.heroCTA}>
              Browse All Events
              <ArrowRightIcon />
            </Link>
          </div>
          
          <div className={styles.secondaryImageWrapper}>
            {/* Replace with actual image */}
            <div className={styles.showcasePlaceholder}>
              <ImagePlaceholder />
              <span>Add image: features/connect/event.png<br />Show event detail page or car meet photo</span>
            </div>
            {/* <Image 
              src="/images/features/connect/event.png" 
              alt="Car meet event"
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
          <h2 className={styles.ctaTitle}>Find Your Next Event</h2>
          <p className={styles.ctaDescription}>
            Explore what's happening in your area this weekend.
          </p>
          <Link href="/events" className={styles.ctaButton}>
            Explore Events
            <ArrowRightIcon />
          </Link>
          
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <p className={styles.statValue}>500+</p>
              <p className={styles.statLabel}>Events Listed</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>50</p>
              <p className={styles.statLabel}>States Covered</p>
            </div>
            <div className={styles.stat}>
              <p className={styles.statValue}>Weekly</p>
              <p className={styles.statLabel}>New Additions</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

