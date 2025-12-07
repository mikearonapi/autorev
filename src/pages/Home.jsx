import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import PageImage from '../components/PageImage';
import styles from './Home.module.css';

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
    title: 'Sports Car Selector',
    description: 'Find your perfect sports car based on what actually matters to you—sound, track capability, reliability, value, and more.',
    cta: 'Explore Cars',
    to: '/advisory',
    accent: 'primary'
  },
  {
    icon: <ToolIcon />,
    title: 'Upgrade Advisory',
    description: 'Already have a car? We help you prioritize modifications that deliver the most driving joy per dollar spent.',
    cta: 'Learn About Upgrades',
    to: '/upgrades',
    accent: 'secondary'
  },
  {
    icon: <WrenchIcon />,
    title: 'Upgrade Services',
    description: 'Need hands-on help? Our team handles everything from suspension setup to full performance builds.',
    cta: 'See What We Offer',
    to: '/services',
    accent: 'tertiary'
  }
];

const steps = [
  { number: '01', title: 'Tell Us Your Goals', description: 'Track days? Canyon runs? Daily driving? We start with what you actually want.' },
  { number: '02', title: 'Get Recommendations', description: 'Our advisory tools match you with cars or upgrades based on real-world experience.' },
  { number: '03', title: 'Plan Your Path', description: 'Whether buying or modding, we help you prioritize for your budget.' },
  { number: '04', title: 'Hit the Road', description: 'Execute your plan with confidence—or let us handle the build.' }
];

export default function Home() {
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Unleash Your<br />
            <span className={styles.heroAccent}>Racing Spirit</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Find the perfect sports car. Plan the ultimate build. 
            SuperNatural Motorsports helps enthusiasts at every budget 
            make smarter performance decisions.
          </p>
          <div className={styles.heroCtas}>
            <Button to="/advisory" variant="secondary" size="lg" icon={<ArrowRightIcon />}>
              Explore the Advisory
            </Button>
            <Button to="/upgrades" variant="outline" size="lg">
              Learn About Upgrades
            </Button>
          </div>
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
                <Button to={pillar.to} variant="ghost" size="sm" icon={<ArrowRightIcon />}>
                  {pillar.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={styles.howItWorks}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>How It Works</h2>
            <p className={styles.sectionSubtitle}>
              From first click to first drive, we're with you
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
                Built for Enthusiasts,<br />
                <span className={styles.valueAccent}>At Every Budget</span>
              </h2>
              <p className={styles.valueDescription}>
                Whether you're eyeing a Miata or a GT3, we bring the same passion 
                and expertise. No gatekeeping—just honest advice based on real 
                ownership experience.
              </p>
              <ul className={styles.valueList}>
                <li><CheckIcon /> Real-world ownership insights, not just spec sheets</li>
                <li><CheckIcon /> Unbiased recommendations—we're not selling you a car</li>
                <li><CheckIcon /> Community-driven data from actual enthusiasts</li>
                <li><CheckIcon /> Approachable experts who love cars as much as you do</li>
              </ul>
              <Button to="/advisory" variant="primary" size="lg">
                Try the Advisory
              </Button>
            </div>
            <div className={styles.valueImage}>
              <PageImage 
                imageKey="homeValue"
                alt="Enthusiast inspecting a sports car"
                variant="section"
                placeholderText="Track Photo"
                className={styles.valueImageWrapper}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.finalCta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>Curious? Just Browse.</h2>
            <p className={styles.ctaSubtitle}>
              No signup required. Explore our free tools and see what catches your eye.
            </p>
            <div className={styles.ctaButtons}>
              <Button to="/advisory" variant="secondary" size="lg">
                Open Advisory
              </Button>
              <Button to="/contact" variant="outline" size="lg">
                Have Questions?
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

