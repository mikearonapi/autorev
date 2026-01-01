import { FeatureShowcase, LandingCTA, LandingHero, LandingProblem, LandingTracking } from '@/components/landing';
import styles from './page.module.css';

export const metadata = {
  title: 'Find Your Car',
  description: "Stop researching. Start deciding. Take the 2‑minute quiz and match with your ideal sports car.",
  alternates: { canonical: '/landing/find-your-car' },
};

const Icons = {
  youtube: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="3" ry="3" />
      <polygon points="10 11 16 14 10 17 10 11" fill="currentColor" stroke="none" />
      <path d="M7 3h10" />
    </svg>
  ),
  chat: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  ),
  sheet: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
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
  cards: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="6" rx="2" />
      <rect x="3" y="14" width="18" height="6" rx="2" />
      <path d="M7 7h6" />
      <path d="M7 17h10" />
    </svg>
  ),
  compare: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
};

export default function FindYourCarLandingPage() {
  return (
    <div className={styles.page}>
      <LandingTracking pageId="find-your-car" />

      <LandingHero
        pageId="find-your-car"
        badgeText="For overwhelmed car shoppers"
        headline="Find Your Perfect Sports Car in 2 Minutes"
        subhead="Tell us what matters to you. We'll match you with your ideal car from our full sports car database."
        primaryCtaLabel="Take the Quiz"
        primaryCtaHref="/car-selector"
      />

      <LandingProblem
        headline="Sound familiar?"
        items={[
          {
            icon: <Icons.youtube />,
            title: 'Contradicting reviews',
            description: 'Hours lost in YouTube rabbit holes… and the conclusions never match.',
          },
          {
            icon: <Icons.chat />,
            title: 'Forum doomscrolling',
            description: 'Threads that make every car sound like a ticking time bomb.',
          },
          {
            icon: <Icons.sheet />,
            title: 'Spreadsheets forever',
            description: "You’ve compared everything… except the one thing that matters: what’s right for you.",
          },
        ]}
      />

      <div id="feature" />
      <FeatureShowcase
        icon={<Icons.sliders />}
        headline="Car Selector"
        description="Match with your ideal sports car based on what actually matters to you — not just specs."
        bullets={[
          '7 priority categories (Sound, Track, Reliability, Value, and more)',
          'Weighted scoring algorithm',
          'Instant personalized recommendations',
          'Side-by-side comparisons',
          'Works on any device',
        ]}
        imageSrc="/images/onboarding/car-selector-02-results.png"
        imageAlt="AutoRev Car Selector results screen"
        imageCaption="Car Selector"
      />

      <section className={styles.how}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>How it works</h2>
          <div className={styles.steps}>
            <div className={styles.step}>
              <div className={styles.stepIcon}>
                <Icons.sliders />
              </div>
              <h3 className={styles.stepTitle}>Set your priorities</h3>
              <p className={styles.stepDesc}>Tell us what you care about most — sound, comfort, reliability, track, and more.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepIcon}>
                <Icons.cards />
              </div>
              <h3 className={styles.stepTitle}>See your matches</h3>
              <p className={styles.stepDesc}>Get a ranked list of cars that fit your priorities — instantly.</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepIcon}>
                <Icons.compare />
              </div>
              <h3 className={styles.stepTitle}>Compare with confidence</h3>
              <p className={styles.stepDesc}>Shortlist favorites, compare side-by-side, and move forward without second guessing.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.social}>
        <div className={styles.container}>
          <p className={styles.socialHeadline}>Every sports car. 7 scoring categories. Real enthusiast data.</p>
          <div className={styles.brands} aria-label="Popular sports car brands">
            {['Porsche', 'BMW', 'Toyota', 'Chevrolet', 'Nissan', 'Ford', 'Audi', 'Mazda'].map((b) => (
              <span key={b} className={styles.brandPill}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      <LandingCTA
        pageId="find-your-car"
        headline="Ready to find your car?"
        subhead="Stop researching in circles. Get a clear shortlist in minutes."
        primaryCtaLabel="Take the 2-Minute Quiz"
        primaryCtaHref="/car-selector"
        note="Free. No account required."
      />
    </div>
  );
}


