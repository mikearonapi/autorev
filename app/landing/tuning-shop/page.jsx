import { FeatureShowcase, LandingCTA, LandingHero, LandingProblem, LandingTracking } from '@/components/landing';
import styles from './page.module.css';

export const metadata = {
  title: 'Tuning Shop',
  description: 'Plan your build with our interactive mod planner. See estimated performance gains, configure upgrades, and visualize what your build could look like.',
  alternates: { canonical: '/landing/tuning-shop' },
};

const Icons = {
  chat: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  ),
  puzzle: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.69c.23-.23.556-.338.877-.29.493.074.84.504 1.02.968a2.5 2.5 0 1 0 3.237-3.237c-.464-.18-.894-.527-.967-1.02a1.026 1.026 0 0 1 .289-.877l1.568-1.568A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" />
    </svg>
  ),
  question: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  layers: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  gauge: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10" />
      <path d="M12 12 19 5" />
      <path d="M12 8v4" />
    </svg>
  ),
  wrench: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  wheel: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="8" />
      <line x1="12" y1="16" x2="12" y2="22" />
      <line x1="2" y1="12" x2="8" y2="12" />
      <line x1="16" y1="12" x2="22" y2="12" />
    </svg>
  ),
  chart: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 2 5-6" />
    </svg>
  ),
  save: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
};

export default function TuningShopLandingPage() {
  return (
    <div className={styles.page}>
      <LandingTracking pageId="tuning-shop" />

      <LandingHero
        pageId="tuning-shop"
        badgeText="For builders"
        headline="Plan Your Build Before You Buy"
        subhead="Visualize performance gains, configure upgrades, and plan a coherent build — so you're not just throwing parts at your car and hoping for the best."
        primaryCtaLabel="Open Tuning Shop"
        primaryCtaHref="/tuning-shop"
        secondaryCtaLabel="Ask AL for advice"
        secondaryCtaHref="/al"
      />

      <LandingProblem
        headline="Building a car is harder than it should be"
        items={[
          {
            icon: <Icons.chat />,
            title: 'Advice buried in forums',
            description: 'Which mods actually work together? What should you do first? The answers exist — scattered across years of forum threads.',
          },
          {
            icon: <Icons.puzzle />,
            title: "Mods that don't work together",
            description: "You buy parts piecemeal, then realize they conflict or don't make sense as a package.",
          },
          {
            icon: <Icons.question />,
            title: 'No way to visualize gains',
            description: 'What will an intake + tune actually do for your specific car? Hard to know before you spend the money.',
          },
          {
            icon: <Icons.layers />,
            title: 'No coherent build plan',
            description: "Most builds evolve randomly. Wouldn't it be nice to see the whole picture before you start?",
          },
        ]}
      />

      <div id="features" />
      <FeatureShowcase
        icon={<Icons.gauge />}
        headline="Select Your Car"
        description="Start by picking the car you want to build. We'll show you the factory specs and what's possible with modifications."
        bullets={[
          'Pick from your collection or any car in our database',
          'See factory power, torque, and performance specs',
          'Understand your baseline before you modify',
        ]}
        imageSrc="/images/onboarding/tuning-shop-01-overview.png"
        imageAlt="AutoRev Tuning Shop car selection"
        imageCaption="Select Your Car"
      />

      <FeatureShowcase
        reversed
        icon={<Icons.wrench />}
        headline="Configure Upgrades"
        description="Browse upgrade categories and select the mods you're considering. See estimated power gains as you build your configuration."
        bullets={[
          'Categories: intake, exhaust, tune, forced induction, and more',
          'Estimated HP and torque gains for each upgrade',
          "Running total shows your build's projected output",
        ]}
        imageSrc="/images/onboarding/tuning-shop-04-power-list.png"
        imageAlt="AutoRev Tuning Shop upgrade configuration"
        imageCaption="Configure Upgrades"
      />

      <FeatureShowcase
        icon={<Icons.wheel />}
        headline="Wheels & Tires"
        description="Configure your wheel and tire setup. See how different sizes affect your car's look and get fitment guidance."
        bullets={[
          'Visualize different wheel sizes',
          'Tire sizing recommendations',
          'Offset and width considerations',
        ]}
        imageSrc="/images/onboarding/tuning-shop-02-config-wheels.png"
        imageAlt="AutoRev Tuning Shop wheel configuration"
        imageCaption="Wheels & Tires"
      />

      <FeatureShowcase
        reversed
        icon={<Icons.chart />}
        headline="Visualize Performance"
        description="See your projected performance gains in one view. Understand what your build could achieve before you spend a dollar."
        bullets={[
          'Projected HP and torque after mods',
          'Cost tracking as you add upgrades',
          'Compare stock vs. modified specs',
        ]}
        imageSrc="/images/onboarding/tuning-shop-06-metrics.png"
        imageAlt="AutoRev Tuning Shop performance metrics"
        imageCaption="Performance Metrics"
      />

      <FeatureShowcase
        icon={<Icons.save />}
        headline="Save Your Builds"
        description="Save your build configurations to come back to later. Compare different builds and track your progress over time."
        bullets={[
          'Save unlimited build configurations',
          'Compare different build approaches',
          "Track what you've done vs. what's planned",
          'Requires free account',
        ]}
        imageSrc="/images/onboarding/tuning-shop-03-presets.png"
        imageAlt="AutoRev Tuning Shop saved builds"
        imageCaption="Saved Builds"
      />

      <LandingCTA
        pageId="tuning-shop"
        headline="Build with a plan"
        subhead="Stop throwing parts at your car. Visualize the gains, plan the build, then execute with confidence."
        primaryCtaLabel="Open Tuning Shop"
        primaryCtaHref="/tuning-shop"
        secondaryCtaLabel="Ask AL about your build"
        secondaryCtaHref="/al"
        note="Free to explore. Save builds with a free account."
      />
    </div>
  );
}
