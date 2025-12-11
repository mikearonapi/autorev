import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/Button';
import CarCarousel from '@/components/CarCarousel';
import MethodologyStrip from '@/components/MethodologyStrip';
import TrustIndicators from '@/components/TrustIndicators';
import styles from './page.module.css';

// Homepage uses the default layout metadata but we can add specific homepage schema
export const metadata = {
  title: 'SuperNatural Motorsports | Unleash Your Racing Spirit',
  description: 'Excellence over ego. Find your perfect sports car with our intelligent selector, plan performance builds with purpose, and join a brotherhood of drivers who value mastery over materialism. From Miatas to GT3s—we lift up every enthusiast.',
  alternates: {
    canonical: '/',
  },
};

// AI-generated images (owned/licensed)
const heroImageUrl = '/images/pages/home-hero.png';
const BLOB_BASE = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com';
const valueImageUrl = `${BLOB_BASE}/pages/home/value-section.webp`;

// Icons
const CarIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
);

const ToolIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const WrenchIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="7.5 4.21 12 6.81 16.5 4.21"/>
    <polyline points="7.5 19.79 7.5 14.6 3 12"/>
    <polyline points="21 12 16.5 14.6 16.5 19.79"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// Icons for pillars
const ExploreIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
    <path d="M11 8v6"/>
    <path d="M8 11h6"/>
  </svg>
);

const GarageIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const pillars = [
  {
    icon: <ExploreIcon />,
    title: 'Explore',
    description: 'Learn about sports cars and performance modifications. Browse our catalog, understand how upgrades work as a system, and build real knowledge.',
    cta: 'Start Exploring',
    href: '/explore',
    accent: 'tertiary'
  },
  {
    icon: <CarIcon />,
    title: 'Find Your Car',
    description: 'Match the perfect car to your goals, budget, and driving style. Our intelligent selector helps you find what actually fits—not what\'s trending.',
    cta: 'Find Your Match',
    href: '/car-selector',
    accent: 'primary'
  },
  {
    icon: <ToolIcon />,
    title: 'Performance HUB',
    description: 'Optimize any car for maximum performance. See how upgrades affect the whole system and plan builds that deliver real results.',
    cta: 'Plan Your Build',
    href: '/performance',
    accent: 'secondary'
  },
  {
    icon: <GarageIcon />,
    title: 'My Garage',
    description: 'Save your favorites, compare cars side-by-side, and track your build configurations. Your personal space to plan your automotive journey.',
    cta: 'View Garage',
    href: '/garage',
    accent: 'quaternary'
  }
];

const steps = [
  { number: '01', title: 'Define Your Mission', description: 'Track days? Canyon carving? Daily driver? We start with your real goals—not internet hype.' },
  { number: '02', title: 'Get Matched', description: 'Our tools match you with cars or upgrades based on real ownership experience, not just specs.' },
  { number: '03', title: 'Plan with Purpose', description: 'Whether buying or building, we help you prioritize for maximum impact on your actual budget.' },
  { number: '04', title: 'Drive with Confidence', description: 'Execute your plan knowing every decision was made with intention—not impulse.' }
];

// Quick Stats - Key metrics to build trust
const quickStats = [
  { value: '98', label: 'Sports Cars Analyzed', suffix: '+' },
  { value: '50', label: 'Upgrade Modules', suffix: '+' },
  { value: '7', label: 'Performance Categories', suffix: '' },
  { value: '24', label: 'Expert Sources Cited', suffix: '+' },
];

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={heroImageUrl}
            alt="Sports car on a winding mountain road at golden hour"
            fill
            priority
            quality={90}
            className={styles.heroImage}
            sizes="100vw"
          />
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Unleash Your<br />
            <span className={styles.heroAccent}>Racing Spirit</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Explore sports cars and learn what makes them tick. Find the 
            perfect match for your goals. Plan performance builds that 
            deliver real results. Save favorites and compare options in your garage.
          </p>
          <Button href="/car-selector" variant="secondary" size="lg" icon={<ArrowRightIcon />}>
            Find Your Car
          </Button>
        </div>
        <div className={styles.heroScroll}>
          <span>Scroll to explore</span>
          <div className={styles.scrollIndicator} />
        </div>
        
        {/* Quick Stats Bar */}
        <div className={styles.quickStatsBar}>
          {quickStats.map((stat, index) => (
            <div key={index} className={styles.quickStat}>
              <span className={styles.quickStatValue}>
                {stat.value}
                {stat.suffix && <span className={styles.quickStatSuffix}>{stat.suffix}</span>}
              </span>
              <span className={styles.quickStatLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pillars Section */}
      <section className={styles.pillars}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>How We Help</h2>
            <p className={styles.sectionSubtitle}>
              Four tools to get more out of your driving experience
            </p>
          </div>
          <div className={styles.pillarsGrid}>
            {pillars.map((pillar, index) => (
              <div key={index} className={`${styles.pillarCard} ${styles[pillar.accent]}`}>
                <div className={styles.pillarIcon}>{pillar.icon}</div>
                <h3 className={styles.pillarTitle}>{pillar.title}</h3>
                <p className={styles.pillarDescription}>{pillar.description}</p>
                <Button href={pillar.href} variant="ghost" size="sm" icon={<ArrowRightIcon />}>
                  {pillar.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Car Showcase Carousel */}
      <section className={styles.carShowcase}>
        <div className={styles.carShowcaseHeader}>
          <h2 className={styles.carShowcaseTitle}>~100 Sports Cars to Explore</h2>
          <p className={styles.carShowcaseSubtitle}>From weekend warriors to track machines</p>
        </div>
        <CarCarousel />
      </section>

      {/* Trust Indicators - Compact version for credibility */}
      <TrustIndicators variant="compact" />

      {/* Methodology - Transparent about our research process */}
      <MethodologyStrip />

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>How It Works</h2>
            <p className={styles.sectionSubtitle}>
              From first click to first drive, we&apos;re with you
            </p>
          </div>
          <div className={styles.stepsGrid}>
            {steps.map((step, index) => (
              <div key={index} className={styles.stepCard}>
                <div className={styles.stepNumber}>{step.number}</div>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className={styles.valueProps}>
        <div className={styles.container}>
          <div className={styles.valueGrid}>
            <div className={styles.valueContent}>
            <h2 className={styles.valueTitle}>
              Brotherhood Over<br />
              <span className={styles.valueAccent}>Gatekeeping</span>
            </h2>
            <p className={styles.valueDescription}>
              We lift up the driver with the $3K Miata the same as the one with 
              the $300K GT3RS. No flex culture, no clout chasing—just honest guidance 
              and genuine community.
            </p>
            <ul className={styles.valueList}>
              <li><CheckIcon /> Real ownership insights, not just spec sheet comparisons</li>
              <li><CheckIcon /> Honest advice—we&apos;re not selling you anything</li>
              <li><CheckIcon /> Community built on respect, not rivalry</li>
              <li><CheckIcon /> Mentorship from drivers who walk the walk</li>
            </ul>
              <Button href="/car-selector" variant="primary" size="lg">
                Find Your Car
              </Button>
            </div>
            <div className={styles.valueImage}>
              <div className={styles.valueImageWrapper}>
                <Image
                  src={valueImageUrl}
                  alt="Car enthusiast working on their sports car in a home garage"
                  width={600}
                  height={400}
                  className={styles.valueImagePhoto}
                  style={{ objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.finalCta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Ready to Own Your Lane?</h2>
            <p className={styles.ctaSubtitle}>
              No signup required. Free tools built for drivers who value substance over status.
            </p>
            <div className={styles.ctaButtons}>
              <Button href="/car-selector" variant="secondary" size="lg">
                Find Your Car
              </Button>
              <Button href="/contact" variant="outlineLight" size="lg">
                Have Questions?
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

