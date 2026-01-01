import { FeatureShowcase, LandingCTA, LandingHero, LandingProblem, LandingTestimonial, LandingTracking } from '@/components/landing';
import styles from './page.module.css';

export const metadata = {
  title: 'Your Garage | AutoRev',
  description: "Stop digging through forums and PDFs. All the details about your car — maintenance specs, safety ratings, known issues — in one place.",
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
  alert: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  heart: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ),
};

const TESTIMONIALS = [
  {
    name: 'Mike',
    role: 'Co-founder, AutoRev',
    quote: "I own a 996 and an E92 M3. Finding maintenance specs used to mean digging through forums and PDFs. I built My Garage so I could have everything about my cars in one place — specs, known issues, safety data, all of it.",
  },
  {
    name: 'Cory',
    role: 'Co-founder, AutoRev',
    quote: "Every time I wanted to check something about my car, I had to open 5 different tabs. What oil does it take? What are the common problems? Is there a recall? AutoRev puts it all in one spot.",
  },
];

export default function YourGarageLandingPage() {
  return (
    <div className={styles.page}>
      <LandingTracking pageId="your-garage" />

      <LandingHero
        pageId="your-garage"
        badgeText="My Garage"
        headline="Everything About Your Car. One Place."
        subhead="Maintenance specs, safety ratings, known issues — organized around YOUR specific car. No more digging through forums and PDFs."
        primaryCtaLabel="Add Your Car"
        primaryCtaHref="/garage"
        secondaryCtaLabel="Browse Cars First"
        secondaryCtaHref="/browse-cars"
        videoSrc="/videos/your-garage-demo.mp4"
        videoPoster="/images/onboarding/garage-02-details.png"
        phoneSrc="/images/onboarding/garage-02-details.png"
        phoneAlt="AutoRev My Garage showing car details"
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
        description="Add your cars and see all their details in one place. Specs, variants, production info — organized and always accessible. Save favorites while you're researching too."
        bullets={[
          'Add cars you own to your collection (free)',
          'Save cars you\'re researching as favorites (free)',
          'See specs, variants, and trim details',
          'Track your entire collection in one spot',
        ]}
        imageSrc="/images/onboarding/garage-02-details.png"
        imageAlt="AutoRev My Collection showing car details"
        imageCaption="My Collection"
      />

      <FeatureShowcase
        reversed
        icon={<Icons.wrench />}
        headline="Owner Reference"
        description="Quick access to the maintenance specs you actually need — oil type, fluid capacities, torque specs, service intervals. No more digging through PDFs."
        bullets={[
          'Oil type and capacity',
          'Fluid specs and capacities',
          'Service intervals',
          'Enthusiast+ tier unlocks full reference',
        ]}
        imageSrc="/images/onboarding/garage-03-reference.png"
        imageAlt="AutoRev Owner Reference"
        imageCaption="Owner Reference"
      />

      <FeatureShowcase
        icon={<Icons.shield />}
        headline="Safety &amp; Ratings"
        description="NHTSA safety ratings and crash test results for your specific car — pulled from official sources and displayed clearly. Know what you're driving."
        bullets={[
          'Official NHTSA safety ratings',
          'Crash test results by category',
          'Rollover risk assessment',
          'Included free for all users',
        ]}
        imageSrc="/images/onboarding/garage-04-safety.png"
        imageAlt="AutoRev Safety Ratings"
        imageCaption="Safety &amp; Ratings"
      />

      <FeatureShowcase
        reversed
        icon={<Icons.alert />}
        headline="Known Issues"
        description="Common problems reported by other owners of your exact car. Know what to watch for before it becomes expensive."
        bullets={[
          'Issues reported by real owners',
          'Organized by severity and frequency',
          'Know what to inspect and when',
          'Enthusiast+ tier unlocks detailed issues',
        ]}
        imageSrc="/images/onboarding/garage-05-health.png"
        imageAlt="AutoRev Known Issues"
        imageCaption="Vehicle Health"
      />

      <LandingTestimonial testimonials={TESTIMONIALS} />

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
