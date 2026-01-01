import { FeatureShowcase, LandingCTA, LandingHero, LandingProblem, LandingTracking } from '@/components/landing';
import styles from './page.module.css';

export const metadata = {
  title: 'Find Your Car | AutoRev',
  description: "Not sure which sports car is right for you? Set your priorities and we'll match you with cars that fit what YOU care about.",
  alternates: { canonical: '/landing/find-your-car' },
};

const Icons = {
  search: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  youtube: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="3" ry="3" />
      <polygon points="10 11 16 14 10 17 10 11" fill="currentColor" stroke="none" />
    </svg>
  ),
  compare: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  user: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  sliders: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
  target: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
    </svg>
  ),
};

export default function FindYourCarLandingPage() {
  return (
    <div className={styles.page}>
      <LandingTracking pageId="find-your-car" />

      <LandingHero
        pageId="find-your-car"
        badgeText="Car Selector"
        headline="Which Sports Car Actually Fits You?"
        subhead="Tell us what you care about — sound, track, reliability, comfort, value — and we'll match you with cars that fit YOUR priorities."
        primaryCtaLabel="Find Your Perfect Match"
        primaryCtaHref="/car-selector"
      />

      <LandingProblem
        headline="The problem"
        items={[
          {
            icon: <Icons.search />,
            title: 'Sites assume you know',
            description: "Cars.com lets you search — but what if you don't know which car is right?",
          },
          {
            icon: <Icons.youtube />,
            title: 'Info is scattered',
            description: 'YouTube, forums, specs sites — hard to compare across sources.',
          },
          {
            icon: <Icons.compare />,
            title: 'Comparing is hard',
            description: 'Every car excels at something. How do you weigh the tradeoffs?',
          },
          {
            icon: <Icons.user />,
            title: 'No one asks YOU',
            description: "The best car depends on what you value. But who's asking?",
          },
        ]}
      />

      <div id="feature" />
      <FeatureShowcase
        icon={<Icons.sliders />}
        headline="Set Your Priorities"
        description="Adjust sliders for what matters to you: sound, track ability, reliability, daily comfort, value, driver fun, and aftermarket support."
        bullets={[
          '7 priority categories you can weight',
          'No right or wrong answers',
          'Takes about 2 minutes',
        ]}
        imageSrc="/images/onboarding/car-selector-01-preferences.png"
        imageAlt="AutoRev Car Selector priority sliders"
        imageCaption="Priority Sliders"
      />

      <FeatureShowcase
        reversed
        icon={<Icons.target />}
        headline="See Your Matches"
        description="We score every car against YOUR priorities and show you a ranked list. See why each car scored the way it did."
        bullets={[
          'Cars ranked by fit to your priorities',
          'Filter by price and body style',
          'Dive into specs and owner insights',
        ]}
        imageSrc="/images/onboarding/car-selector-02-results.png"
        imageAlt="AutoRev Car Selector results"
        imageCaption="Your Matches"
      />

      <LandingCTA
        pageId="find-your-car"
        headline="Find the car that fits you"
        subhead="Stop researching in circles. Tell us what matters and see which cars match."
        primaryCtaLabel="Find Your Perfect Match"
        primaryCtaHref="/car-selector"
        note="Free. No account required."
      />
    </div>
  );
}
