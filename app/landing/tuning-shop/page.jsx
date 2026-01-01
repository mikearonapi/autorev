import { FeatureShowcase, LandingCTA, LandingHero, LandingProblem, LandingTracking } from '@/components/landing';
import styles from './page.module.css';

export const metadata = {
  title: 'Tuning Shop | AutoRev',
  description: 'Plan your build before you buy. Configure upgrades, see estimated performance gains, and build with a plan instead of guessing.',
  alternates: { canonical: '/landing/tuning-shop' },
};

const Icons = {
  chat: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  ),
  puzzle: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.69c.23-.23.556-.338.877-.29.493.074.84.504 1.02.968a2.5 2.5 0 1 0 3.237-3.237c-.464-.18-.894-.527-.967-1.02a1.026 1.026 0 0 1 .289-.877l1.568-1.568A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z" />
    </svg>
  ),
  eye: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  layers: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  wrench: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  chart: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 2 5-6" />
    </svg>
  ),
};

export default function TuningShopLandingPage() {
  return (
    <div className={styles.page}>
      <LandingTracking pageId="tuning-shop" />

      <LandingHero
        pageId="tuning-shop"
        badgeText="Tuning Shop"
        headline="Plan Your Build Before You Buy"
        subhead="Configure upgrades, see estimated power gains, and build with a plan — instead of throwing parts at your car and hoping for the best."
        primaryCtaLabel="Open Tuning Shop"
        primaryCtaHref="/tuning-shop"
        secondaryCtaLabel="Ask AL for Advice"
        secondaryCtaHref="/al"
      />

      <LandingProblem
        headline="The problem"
        items={[
          {
            icon: <Icons.chat />,
            title: 'Advice in forums',
            description: 'Which mods work together? Buried in years of threads.',
          },
          {
            icon: <Icons.puzzle />,
            title: "Parts don't fit",
            description: "You buy piecemeal, then realize they conflict or don't make sense.",
          },
          {
            icon: <Icons.eye />,
            title: "Can't visualize gains",
            description: "What will intake + tune actually do? Hard to know before spending.",
          },
          {
            icon: <Icons.layers />,
            title: 'No build plan',
            description: 'Most builds evolve randomly. No way to see the whole picture.',
          },
        ]}
      />

      <div id="features" />
      <FeatureShowcase
        icon={<Icons.wrench />}
        headline="Configure Your Build"
        description="Browse upgrade categories, select the mods you're considering, and see how they add up. Intake, exhaust, tune, suspension, wheels — plan it all."
        bullets={[
          'Browse upgrades by category',
          'See estimated HP/torque gains per mod',
          'Running total of projected output',
          'Track estimated cost as you build',
        ]}
        imageSrc="/images/onboarding/tuning-shop-04-power-list.png"
        imageAlt="AutoRev Tuning Shop upgrade configuration"
        imageCaption="Configure Upgrades"
      />

      <FeatureShowcase
        reversed
        icon={<Icons.chart />}
        headline="Visualize the Results"
        description="See your projected performance in one view. Understand what your build could achieve before you spend a dollar."
        bullets={[
          'Projected HP and torque after mods',
          'Compare stock vs. modified specs',
          'Save builds to compare later',
          'Free to explore, save with account',
        ]}
        imageSrc="/images/onboarding/tuning-shop-06-metrics.png"
        imageAlt="AutoRev Tuning Shop performance visualization"
        imageCaption="Performance Metrics"
      />

      <LandingCTA
        pageId="tuning-shop"
        headline="Build with a plan"
        subhead="Stop guessing. See what your build could achieve before you start buying parts."
        primaryCtaLabel="Open Tuning Shop"
        primaryCtaHref="/tuning-shop"
        secondaryCtaLabel="Ask AL About Your Build"
        secondaryCtaHref="/al"
        note="Free to explore. Save builds with a free account."
      />
    </div>
  );
}
