import { FeatureShowcase, LandingCTA, LandingHero, LandingProblem, LandingTracking } from '@/components/landing';
import styles from './page.module.css';

export const metadata = {
  title: 'Your Garage',
  description: "All the details about your car — maintenance specs, recalls, known issues — organized in one place. Stop digging through forums and PDFs.",
  alternates: { canonical: '/landing/your-garage' },
};

const Icons = {
  book: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  alert: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.3 4.3 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
  chat: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  ),
  clock: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  garage: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  wrench: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  shield: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  heart: ({ size = 22 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
};

export default function YourGarageLandingPage() {
  return (
    <div className={styles.page}>
      <LandingTracking pageId="your-garage" />

      <LandingHero
        pageId="your-garage"
        badgeText="For car owners"
        headline="All Your Car's Details in One Place"
        subhead="Maintenance specs, known issues, safety ratings, and owner reference info — organized around your specific car. No more digging through forums and PDFs."
        primaryCtaLabel="Add Your Car"
        primaryCtaHref="/garage"
        secondaryCtaLabel="See how it works"
        secondaryCtaHref="#features"
      />

      <LandingProblem
        headline="Ownership info is scattered everywhere"
        items={[
          {
            icon: <Icons.book />,
            title: 'Specs buried in manuals',
            description: "What oil does your car take? What's the torque spec for the drain plug? Good luck finding it quickly.",
          },
          {
            icon: <Icons.chat />,
            title: 'Known issues in forums',
            description: "Common problems for your car exist — but they're buried across dozens of forum threads and Reddit posts.",
          },
          {
            icon: <Icons.alert />,
            title: 'Safety info hard to find',
            description: "NHTSA ratings, crash test results, complaints — it's there, but not organized around YOUR specific car.",
          },
          {
            icon: <Icons.clock />,
            title: 'No central ownership hub',
            description: "Every detail lives in a different place. There's no single spot that keeps it all organized for you.",
          },
        ]}
      />

      <div id="features" />
      <FeatureShowcase
        icon={<Icons.garage />}
        headline="My Collection"
        description="Add your cars and see all their details organized in one place. Favorites and saved cars are free. Paid tiers unlock deeper ownership tools."
        bullets={[
          'Add cars to your collection (free)',
          "Save favorites while you're researching (free)",
          'See specs, variants, and production details',
        ]}
        imageSrc="/images/onboarding/garage-02-details.png"
        imageAlt="AutoRev My Collection showing car details"
        imageCaption="My Collection"
      />

      <FeatureShowcase
        reversed
        icon={<Icons.wrench />}
        headline="Owner Reference"
        description="Quick access to the maintenance specs you actually need — oil type, capacity, fluid specs, and service intervals. No more digging through PDFs."
        bullets={[
          'Oil type and capacity',
          'Fluid specifications',
          'Service intervals',
          'Enthusiast+ tier feature',
        ]}
        imageSrc="/images/onboarding/garage-03-reference.png"
        imageAlt="AutoRev Owner Reference showing maintenance specs"
        imageCaption="Owner Reference"
      />

      <FeatureShowcase
        icon={<Icons.shield />}
        headline="Safety & Ratings"
        description="NHTSA safety ratings and crash test results for your specific car — pulled from official sources and displayed clearly."
        bullets={[
          'NHTSA overall safety rating',
          'Frontal and side crash ratings',
          'Rollover rating when available',
          'Enthusiast+ tier feature',
        ]}
        imageSrc="/images/onboarding/garage-04-safety.png"
        imageAlt="AutoRev Safety ratings display"
        imageCaption="Safety Ratings"
      />

      <FeatureShowcase
        reversed
        icon={<Icons.heart />}
        headline="Vehicle Health"
        description="Known issues and common problems reported by owners of your specific car — so you know what to watch for."
        bullets={[
          'Common issues for your model',
          'What other owners report',
          'Helps you know what to inspect',
          'Enthusiast+ tier feature',
        ]}
        imageSrc="/images/onboarding/garage-05-health.png"
        imageAlt="AutoRev Vehicle Health showing known issues"
        imageCaption="Vehicle Health"
      />

      <LandingCTA
        pageId="your-garage"
        headline="Know your car better"
        subhead="Add your cars and see all the details in one place. Start with favorites for free — upgrade to unlock owner reference tools."
        primaryCtaLabel="Add Your Car"
        primaryCtaHref="/garage"
        secondaryCtaLabel="Browse cars first"
        secondaryCtaHref="/browse-cars"
        note="Free tier includes favorites. Enthusiast tier unlocks owner reference, safety, and health tools."
      />
    </div>
  );
}
