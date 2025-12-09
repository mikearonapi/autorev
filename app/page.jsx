import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/Button';
import CarCarousel from '@/components/CarCarousel';
import MethodologyStrip from '@/components/MethodologyStrip';
import styles from './page.module.css';

// Homepage uses the default layout metadata but we can add specific homepage schema
export const metadata = {
  title: 'SuperNatural Motorsports | Unleash Your Racing Spirit',
  description: 'Excellence over ego. Find your perfect sports car with our intelligent selector, plan performance builds with purpose, and join a brotherhood of drivers who value mastery over materialism. From Miatas to GT3s—we lift up every enthusiast.',
  alternates: {
    canonical: '/',
  },
};

// Blob URLs for page images
const BLOB_BASE = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com';
const heroImageUrl = `${BLOB_BASE}/pages/home/hero.webp`;
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

const pillars = [
  {
    icon: <CarIcon />,
    title: 'Car Selector',
    description: 'Own your lane. Find the right car for your goals—not someone else\'s Instagram feed. Sound, track capability, reliability, and real-world value.',
    cta: 'Find Your Car',
    href: '/car-selector',
    accent: 'primary'
  },
  {
    icon: <ToolIcon />,
    title: 'Performance HUB',
    description: 'Power under control. Plan your build the smart way—see how upgrades affect your car as a system, and spend your budget where it counts.',
    cta: 'Plan Your Build',
    href: '/performance',
    accent: 'secondary'
  },
  {
    icon: <WrenchIcon />,
    title: 'Education',
    description: 'Build your knowledge. Understand the fundamentals of modifications, connected systems, and why some builds work and others don\'t.',
    cta: 'Start Learning',
    href: '/education',
    accent: 'tertiary'
  }
];

const steps = [
  { number: '01', title: 'Define Your Mission', description: 'Track days? Canyon carving? Daily driver? We start with your real goals—not internet hype.' },
  { number: '02', title: 'Get Matched', description: 'Our tools match you with cars or upgrades based on real ownership experience, not just specs.' },
  { number: '03', title: 'Plan with Purpose', description: 'Whether buying or building, we help you prioritize for maximum impact on your actual budget.' },
  { number: '04', title: 'Drive with Confidence', description: 'Execute your plan knowing every decision was made with intention—not impulse.' }
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
            Find the perfect sports car. Plan the ultimate build. 
            SuperNatural Motorsports helps drivers at every budget 
            pursue mastery—not materialism. Build skills, not just ego.
          </p>
          <Button href="/car-selector" variant="secondary" size="lg" icon={<ArrowRightIcon />}>
            Find Your Car
          </Button>
        </div>
        <div className={styles.heroScroll}>
          <span>Scroll to explore</span>
          <div className={styles.scrollIndicator} />
        </div>
      </section>

      {/* Pillars Section */}
      <section className={styles.pillars}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>How We Help</h2>
            <p className={styles.sectionSubtitle}>
              Three ways to get more out of your driving experience
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

