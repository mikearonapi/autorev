import { FeatureShowcase, LandingCTA, LandingHero, LandingProblem, LandingTracking } from '@/components/landing';
import styles from './page.module.css';

export const metadata = {
  title: 'Build Better',
  description: 'Build with confidence. Car-specific fitments, real dyno data, and AI build guidance for your platform.',
  alternates: { canonical: '/landing/build-better' },
};

const Icons = {
  wrench: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  chart: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 2 5-6" />
    </svg>
  ),
  fit: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 7h-7" />
      <path d="M14 3l-4 4 4 4" />
      <path d="M4 17h7" />
      <path d="M10 21l4-4-4-4" />
    </svg>
  ),
  ai: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M12 2v6" />
      <path d="M8.5 2h7" />
      <circle cx="8" cy="14" r="1.5" />
      <circle cx="16" cy="14" r="1.5" />
      <path d="M9 18h6" />
    </svg>
  ),
};

export default function BuildBetterLandingPage() {
  return (
    <div className={styles.page}>
      <LandingTracking pageId="build-better" />

      <LandingHero
        pageId="build-better"
        badgeText="For builders & track rats"
        headline="Stop Guessing. Start Building."
        subhead="Car-specific fitments, real dyno measurements, and build recommendations from AI that actually knows cars."
        primaryCtaLabel="Explore Parts"
        primaryCtaHref="/tuning-shop"
        secondaryCtaLabel="Ask AL"
        secondaryCtaHref="/al"
      />

      <LandingProblem
        headline="The tuning world runs on rumors"
        items={[
          { icon: <Icons.chart />, title: 'Dyno claims', description: 'Big numbers… with no context, no conditions, and no mod list.' },
          { icon: <Icons.fit />, title: '“Should fit” parts', description: 'Then you waste weekends returning parts that don’t actually fit your variant.' },
          { icon: <Icons.ai />, title: 'Bad advice', description: 'Build guidance from strangers who’ve never owned your platform.' },
          { icon: <Icons.wrench />, title: 'No plan', description: 'Mods that don’t work together — and a build that never feels complete.' },
        ]}
      />

      <FeatureShowcase
        icon={<Icons.fit />}
        headline="Parts & Fitments"
        description="Browse upgrades with car-specific context, so you can plan a coherent build — not a pile of random parts."
        bullets={[
          'Car-specific upgrade planning (Tuning Shop)',
          'Fitment-aware parts catalog (Tuner tier unlocks full catalog)',
          'Pricing + purchase links when available',
          'Build paths and upgrade packages',
          'Clear “what works together” mindset',
        ]}
        imageSrc="/images/onboarding/tuning-shop-05-part-detail.png"
        imageAlt="AutoRev tuning shop part detail screen"
        imageCaption="Parts & Fitments"
      />

      <FeatureShowcase
        reversed
        icon={<Icons.chart />}
        headline="Real Dyno Data"
        description="Actual wheel horsepower and torque measurements with full mod lists — not inflated claims."
        bullets={[
          'Real dyno runs from real cars (Tuner tier)',
          'Full mod list for each run',
          'Before/after comparisons when available',
          'Conditions documented when available',
        ]}
        imageSrc="/images/onboarding/tuning-shop-06-metrics.png"
        imageAlt="AutoRev tuning shop performance metrics screen"
        imageCaption="Dyno + Metrics"
      />

      <FeatureShowcase
        icon={<Icons.ai />}
        headline="AL Build Assistant"
        description="AI that knows your platform. Get recommendations that match your goals, budget, and constraints."
        bullets={[
          'Suggests staged build paths',
          'Warns about common compatibility pitfalls',
          'Recommends parts that work together',
          'Helps you prioritize the best $/smile upgrades',
        ]}
        imageSrc="/images/onboarding/ai-al-04-response-mods.png"
        imageAlt="AutoRev AL response about modifications"
        imageCaption="Ask AL"
      />

      <section className={styles.credibility}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>We cite our sources</h2>
          <div className={styles.exampleCard}>
            <div className={styles.exampleHeader}>
              <span className={styles.exampleTitle}>Example dyno entry</span>
              <span className={styles.exampleTag}>Tuner tier</span>
            </div>
            <div className={styles.exampleGrid}>
              <div className={styles.exampleRow}>
                <span className={styles.exampleLabel}>Mods</span>
                <span className={styles.exampleValue}>Tune • Intake • Intercooler (example)</span>
              </div>
              <div className={styles.exampleRow}>
                <span className={styles.exampleLabel}>Peak WHP / WTQ</span>
                <span className={styles.exampleValue}>Listed with context (not generated)</span>
              </div>
              <div className={styles.exampleRow}>
                <span className={styles.exampleLabel}>Conditions</span>
                <span className={styles.exampleValue}>Temp / altitude / fuel when available</span>
              </div>
            </div>
            <p className={styles.exampleNote}>Not generated. Researched. Labeled clearly.</p>
          </div>
        </div>
      </section>

      <LandingCTA
        pageId="build-better"
        headline="Build something great"
        subhead="Start with upgrade planning today. Unlock full parts + dyno databases with the Tuner tier when you're ready."
        primaryCtaLabel="Browse Tuning Shop"
        primaryCtaHref="/tuning-shop"
        secondaryCtaLabel="Ask AL about your build"
        secondaryCtaHref="/al"
        note="No stock photos. Just real product UI and real data workflows."
      />
    </div>
  );
}


