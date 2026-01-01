import { FeatureShowcase, LandingAL, LandingCTA, LandingHero, LandingProblem, LandingTestimonial, LandingTracking } from '@/components/landing';
import styles from './page.module.css';

export const metadata = {
  title: 'Find Your Car | AutoRev',
  description: "Not sure which sports car is right for you? Set your priorities and we'll match you with cars that actually fit what YOU care about.",
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

const TESTIMONIALS = [
  {
    name: 'Mike',
    role: 'Co-founder, AutoRev',
    quote: "I spent months researching sports cars — YouTube, forums, spreadsheets. Every source contradicted the last. I built the Car Selector because I needed a tool that asked what I cared about, not what some reviewer thought was important.",
  },
  {
    name: 'Cory',
    role: 'Co-founder, AutoRev',
    quote: "When I was shopping for my first sports car, I had no idea where to start. I knew I wanted something fun, but every site assumed I already knew what make and model. AutoRev is what I wish existed back then.",
  },
];

export default function FindYourCarLandingPage() {
  return (
    <div className={styles.page}>
      <LandingTracking pageId="find-your-car" />

      <LandingHero
        pageId="find-your-car"
        badgeText="Car Selector"
        headline="Find the Perfect Sports Car for You"
        subhead="Tell us what you care about — sound, track, reliability, comfort, value — and we'll match you with cars that actually fit YOUR priorities. No more guessing."
        primaryCtaLabel="Find Your Perfect Match"
        primaryCtaHref="/car-selector"
        secondaryCtaLabel="See How It Works"
        secondaryCtaHref="#features"
        videoSrc="/videos/find-your-car-demo.mp4"
        phoneSrc="/images/onboarding/car-selector-02-results.png"
        phoneAlt="AutoRev Car Selector showing matched cars"
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

      <div id="features" />
      <FeatureShowcase
        icon={<Icons.sliders />}
        headline="Set Your Priorities"
        description="Adjust sliders for what matters to you: sound, track ability, reliability, daily comfort, value, driver fun, and aftermarket support. There's no right or wrong — just what YOU care about."
        bullets={[
          '7 priority categories you can weight',
          'Drag sliders to match your preferences',
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
        description="We score every car in our database against YOUR priorities and show you a ranked list. See exactly why each car scored the way it did."
        bullets={[
          'Cars ranked by fit to your priorities',
          'See the score breakdown for each car',
          'Filter by price range and body style',
        ]}
        imageSrc="/images/onboarding/car-selector-02-results.png"
        imageAlt="AutoRev Car Selector results"
        imageCaption="Your Matches"
      />

      <LandingAL
        pageId="find-your-car"
        headline="Still Not Sure? Ask AL"
        description="Describe what you're looking for in plain English. AL knows every car in our database and can help you narrow down your options based on your specific situation."
        exampleQuestions={[
          "I want something fun but reliable for a daily driver under $50k",
          "What's the best first sports car for someone coming from an SUV?",
          "Compare the Supra vs 370Z vs Cayman for canyon driving",
        ]}
        videoSrc="/videos/al-find-your-car-demo.mp4"
        imageSrc="/images/onboarding/ai-al-05-response-analysis.png"
      />

      <LandingTestimonial testimonials={TESTIMONIALS} />

      <LandingCTA
        pageId="find-your-car"
        headline="Find your car in minutes"
        subhead="Stop researching in circles. Tell us what matters and see which cars actually match."
        primaryCtaLabel="Find Your Perfect Match"
        primaryCtaHref="/car-selector"
        note="Start free today — create an account to save your results"
      />
    </div>
  );
}
