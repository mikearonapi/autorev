import { FeatureShowcase, LandingCTA, LandingHero, LandingProblem, LandingTracking } from '@/components/landing';
import styles from './page.module.css';

export const metadata = {
  title: 'Find Your Car',
  description: "Not sure which sports car is right for you? Our personalized selector matches you with cars based on what YOU care about — not just specs.",
  alternates: { canonical: '/landing/find-your-car' },
};

const Icons = {
  search: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  youtube: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="3" ry="3" />
      <polygon points="10 11 16 14 10 17 10 11" fill="currentColor" stroke="none" />
      <path d="M7 3h10" />
    </svg>
  ),
  compare: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  question: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  sliders: ({ size = 22 }) => (
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
  target: ({ size = 22 }) => (
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
        badgeText="For car shoppers"
        headline="Not Sure Which Sports Car Is Right for You?"
        subhead="Traditional car sites assume you already know what you want. We help you figure out which car actually fits your priorities — sound, track ability, reliability, daily comfort, and more."
        primaryCtaLabel="Take the Quiz"
        primaryCtaHref="/car-selector"
      />

      <LandingProblem
        headline="The problem with finding a sports car"
        items={[
          {
            icon: <Icons.search />,
            title: 'Search sites assume you know',
            description: "Cars.com and Autotrader let you filter by make and model — but what if you don't know which one fits you yet?",
          },
          {
            icon: <Icons.youtube />,
            title: 'Information is scattered',
            description: "Reviews on YouTube, opinions in forums, specs on manufacturer sites. It's hard to pull it all together and apply it to YOUR needs.",
          },
          {
            icon: <Icons.compare />,
            title: 'Comparing is overwhelming',
            description: 'How do you actually compare a Supra vs. a Z vs. a Cayman when each excels at different things?',
          },
          {
            icon: <Icons.question />,
            title: 'No one asks what YOU care about',
            description: 'Every car is "the best" for someone — but which one is the best for what you actually value?',
          },
        ]}
      />

      <div id="feature" />
      <FeatureShowcase
        icon={<Icons.sliders />}
        headline="Set Your Priorities"
        description="Tell us what matters most to you. Sound? Track performance? Reliability? Daily comfort? Value? Slide the priorities to match YOUR goals."
        bullets={[
          '7 priority categories you can adjust',
          'Weight what matters most to you',
          'No judgment — every priority is valid',
        ]}
        imageSrc="/images/onboarding/car-selector-01-preferences.png"
        imageAlt="AutoRev Car Selector priority sliders"
        imageCaption="Priority Sliders"
      />

      <FeatureShowcase
        reversed
        icon={<Icons.target />}
        headline="See Your Matches"
        description="We score every car in our database against YOUR priorities — and show you a ranked list of cars that fit what you're looking for."
        bullets={[
          'Cars scored against your specific priorities',
          'See why each car ranked where it did',
          'Filter by price range and body style',
          'Browse detailed specs and owner insights',
        ]}
        imageSrc="/images/onboarding/car-selector-02-results.png"
        imageAlt="AutoRev Car Selector results showing matched cars"
        imageCaption="Your Matches"
      />

      <section className={styles.how}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>How it works</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3 className={styles.stepTitle}>Set your priorities</h3>
              <p className={styles.stepDesc}>Adjust sliders for sound, track capability, reliability, daily comfort, value, driver fun, and aftermarket support.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3 className={styles.stepTitle}>See your matches</h3>
              <p className={styles.stepDesc}>We score cars against your priorities and show you the best fits — ranked by how well they match what you care about.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3 className={styles.stepTitle}>Explore and compare</h3>
              <p className={styles.stepDesc}>Dive into detailed specs, see why each car scored the way it did, and compare your top picks side-by-side.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.social}>
        <div className={styles.container}>
          <p className={styles.socialHeadline}>Sports cars from brands like:</p>
          <div className={styles.brands} aria-label="Popular sports car brands">
            {['Porsche', 'BMW', 'Toyota', 'Chevrolet', 'Nissan', 'Ford', 'Mazda', 'Honda'].map((b) => (
              <span key={b} className={styles.brandPill}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      <LandingCTA
        pageId="find-your-car"
        headline="Find the car that fits you"
        subhead="Stop researching in circles. Tell us what matters, and we'll show you which cars match."
        primaryCtaLabel="Take the Quiz"
        primaryCtaHref="/car-selector"
        note="Free. No account required."
      />
    </div>
  );
}
