'use client';

/**
 * PillarsSection Component
 * 
 * Displays the main feature pillars on the homepage.
 * Car count is passed from page.jsx to ensure consistency with headline.
 */

import { useState, useMemo } from 'react';
import Button from '@/components/Button';
import OnboardingPopup, { garageOnboardingSteps, tuningShopOnboardingSteps } from '@/components/OnboardingPopup';
import styles from '@/app/page.module.css';

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

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

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

const BookIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

export default function PillarsSection({ carCount = 100 }) {
  const [activeOnboarding, setActiveOnboarding] = useState(null);

  const pillars = useMemo(() => [
    {
      icon: <ExploreIcon />,
      title: 'Browse Cars',
      description: `Explore our collection of ${carCount} sports cars. Filter by make, price, and category. Find detailed specs, ownership insights, and performance data.`,
      cta: 'Browse Cars',
      href: '/browse-cars',
      accent: 'tertiary'
    },
    {
      icon: <CarIcon />,
      title: 'Your Sportscar Match',
      description: 'Match the perfect car to your goals, budget, and driving style. Our intelligent selector helps you find what actually fits—not what\'s trending.',
      cta: 'Find Your Match',
      href: '/car-selector',
      accent: 'primary'
    },
    {
      icon: <GarageIcon />,
      title: 'My Garage',
      description: 'Save your favorites, compare cars side-by-side, and track your build configurations. Your personal space to plan your automotive journey.',
      cta: 'View Garage',
      href: '/garage',
      accent: 'quaternary',
      onboardingKey: 'garage'
    },
    {
      icon: <ToolIcon />,
      title: 'Tuning Shop',
      description: 'Plan your build with purpose. Select your car, explore upgrade recommendations, and see how mods work together as a system.',
      cta: 'Plan Your Build',
      href: '/tuning-shop',
      accent: 'secondary',
      onboardingKey: 'tuning'
    },
    {
      icon: <BookIcon />,
      title: 'Encyclopedia',
      description: 'Understand the mechanics behind the mods. Learn how turbochargers, suspension geometry, and ECU tuning actually affect performance.',
      cta: 'Learn More',
      href: '/encyclopedia',
      accent: 'primary'
    }
  ], [carCount]);

  const handleOpenOnboarding = (key) => {
    setActiveOnboarding(key);
  };

  const handleCloseOnboarding = () => {
    setActiveOnboarding(null);
  };

  return (
    <section className={styles.pillars}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How We Help</h2>
          <p className={styles.sectionSubtitle}>
            Five tools to get more out of your driving experience
          </p>
        </div>
        <div className={styles.pillarsGrid}>
          {pillars.map((pillar, index) => (
            <div key={index} className={`${styles.pillarCard} ${styles[pillar.accent]}`}>
              <div className={styles.pillarIcon}>{pillar.icon}</div>
              <h3 className={styles.pillarTitle}>{pillar.title}</h3>
              <p className={styles.pillarDescription}>{pillar.description}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                <Button href={pillar.href} variant="ghost" size="sm" icon={<ArrowRightIcon />}>
                  {pillar.cta}
                </Button>
                {pillar.onboardingKey && (
                  <button 
                    onClick={() => handleOpenOnboarding(pillar.onboardingKey)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      padding: '0 12px', 
                      color: 'var(--color-gray-500)', 
                      fontSize: '0.875rem', 
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      marginTop: '-4px'
                    }}
                  >
                    See how it works
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <OnboardingPopup 
        isOpen={activeOnboarding === 'garage'}
        onClose={handleCloseOnboarding}
        steps={garageOnboardingSteps}
        storageKey="garage_onboarding_dismissed" // We might want to use a different key or ignore it for this preview mode, but the component handles it.
        // Actually, if we use the same key, it might not open if user already dismissed it.
        // But since we are forcing isOpen=true, the component logic I updated should respect that.
        accentColor="#e74c3c"
      />

      <OnboardingPopup 
        isOpen={activeOnboarding === 'tuning'}
        onClose={handleCloseOnboarding}
        steps={tuningShopOnboardingSteps}
        storageKey="tuningshop_onboarding_dismissed"
        accentColor="var(--sn-accent)"
      />
    </section>
  );
}

