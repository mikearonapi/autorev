import { FeatureShowcase, LandingCTA, LandingHero, LandingProblem, LandingTracking } from '@/components/landing';
import styles from './page.module.css';

export const metadata = {
  title: 'Your Garage | AutoRev',
  description: "All the details about your car in one place — maintenance specs, safety ratings, known issues. Stop digging through forums and PDFs.",
  alternates: { canonical: '/landing/your-garage' },
};

const Icons = {
  book: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  chat: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  ),
  shield: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  layers: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  garage: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  wrench: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
};

export default function YourGarageLandingPage() {
  return (
    <div className={styles.page}>
      <LandingTracking pageId="your-garage" />

      <LandingHero
        pageId="your-garage"
        badgeText="My Garage"
        headline="All Your Car Details in One Place"
        subhead="Maintenance specs, safety ratings, known issues — organized around your specific car. No more digging through forums and PDFs."
        primaryCtaLabel="Add Your Car"
        primaryCtaHref="/garage"
        secondaryCtaLabel="Browse Cars"
        secondaryCtaHref="/browse-cars"
      />

      <LandingProblem
        headline="The problem"
        items={[
          {
            icon: <Icons.book />,
            title: 'Specs in manuals',
            description: 'Oil type? Torque spec? Buried in PDFs you have to dig for.',
          },
          {
            icon: <Icons.chat />,
            title: 'Issues in forums',
            description: 'Common problems exist — scattered across dozens of threads.',
          },
          {
            icon: <Icons.shield />,
            title: 'Safety data separate',
            description: "NHTSA ratings exist — but not organized for YOUR car.",
          },
          {
            icon: <Icons.layers />,
            title: 'No single source',
            description: 'Every detail lives somewhere different. No hub for your car.',
          },
        ]}
      />

      <div id="features" />
      <FeatureShowcase
        icon={<Icons.garage />}
        headline="My Collection"
        description="Add your cars and see all their details in one place. Specs, variants, production info — organized and accessible."
        bullets={[
          'Add cars to your collection (free)',
          'Save favorites while researching (free)',
          'See specs, variants, and trim details',
        ]}
        imageSrc="/images/onboarding/garage-02-details.png"
        imageAlt="AutoRev My Collection showing car details"
        imageCaption="My Collection"
      />

      <FeatureShowcase
        reversed
        icon={<Icons.wrench />}
        headline="Owner Reference"
        description="Quick access to the specs you need — oil type, fluid capacities, service intervals, safety ratings, and known issues."
        bullets={[
          'Maintenance specs (oil, fluids, intervals)',
          'NHTSA safety ratings and crash data',
          'Known issues other owners report',
          'Enthusiast+ tier unlocks full reference',
        ]}
        imageSrc="/images/onboarding/garage-03-reference.png"
        imageAlt="AutoRev Owner Reference"
        imageCaption="Owner Reference"
      />

      <LandingCTA
        pageId="your-garage"
        headline="Know your car better"
        subhead="Add your cars and see all the details in one place. Start free — upgrade for full owner reference tools."
        primaryCtaLabel="Add Your Car"
        primaryCtaHref="/garage"
        secondaryCtaLabel="Browse Cars First"
        secondaryCtaHref="/browse-cars"
        note="Free tier includes collection + favorites. Enthusiast+ unlocks owner reference."
      />
    </div>
  );
}
