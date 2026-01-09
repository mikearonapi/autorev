import { FeatureShowcase, LandingAL, LandingCTA, LandingHero, LandingProblem, LandingTestimonial, LandingTracking } from '@/components/landing';
import { ONBOARDING_IMAGES } from '@/lib/images';
import styles from './page.module.css';

const siteUrl = 'https://autorev.app';
const pageUrl = `${siteUrl}/landing/your-garage`;

export const metadata = {
  title: 'My Garage - Digital Car Collection & Maintenance Hub | AutoRev',
  description: "Your car's complete reference in one place. Maintenance specs, oil types, fluid capacities, safety ratings, common issues, and service intervals — organized for YOUR specific vehicle. No more forum digging.",
  keywords: [
    'car maintenance tracker',
    'vehicle maintenance app',
    'car collection tracker',
    'digital garage',
    'car specs database',
    'maintenance schedule app',
    'oil type lookup',
    'car fluid capacity',
    'vehicle service intervals',
    'car safety ratings',
    'common car problems',
    'car known issues',
    'BMW maintenance specs',
    'Porsche owner reference',
    'sports car maintenance',
    'car recall lookup',
    'vehicle health tracker',
  ],
  alternates: { 
    canonical: pageUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: pageUrl,
    siteName: 'AutoRev',
    title: 'My Garage - Your Car Reference Hub | AutoRev',
    description: "Everything about your car in one place. Maintenance specs, safety ratings, known issues — no more digging through forums and PDFs.",
    images: [
      {
        url: `${pageUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'AutoRev My Garage - Digital Car Collection & Maintenance Hub',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@autorev',
    creator: '@autorev',
    title: 'My Garage - Your Car Reference Hub | AutoRev',
    description: "Your car's complete reference in one place. Specs, safety, issues — organized for YOUR vehicle.",
    images: [
      {
        url: `${pageUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'AutoRev My Garage - Digital Car Collection & Maintenance Hub',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// JSON-LD Structured Data for the My Garage Landing Page
const pageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'My Garage - Digital Car Collection & Maintenance Hub',
  description: "Your car's complete reference in one place. Maintenance specs, oil types, fluid capacities, safety ratings, common issues, and service intervals.",
  url: pageUrl,
  isPartOf: {
    '@type': 'WebSite',
    name: 'AutoRev',
    url: siteUrl,
  },
  mainEntity: {
    '@type': 'SoftwareApplication',
    name: 'AutoRev My Garage',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    description: 'Digital garage to track your car collection with complete maintenance specs, safety ratings, and known issues',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier includes car collection, favorites, and basic specs. Enthusiast+ unlocks full owner reference.',
    },
    featureList: [
      'Track cars you own in your digital collection',
      'Save cars you\'re researching as favorites',
      'View maintenance specs (oil type, fluid capacities)',
      'Access NHTSA safety ratings and crash test results',
      'Learn about common issues reported by owners',
      'Get service interval recommendations',
    ],
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'My Garage',
        item: pageUrl,
      },
    ],
  },
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
};

const TESTIMONIALS = [
  {
    name: 'Mike',
    role: 'Co-founder, AutoRev',
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJK1K-ufstc_sqBjvFJH5E7fVwd6rwlJCusBzF2Q7yxtHt1hzu0sQ=s96-c',
    quote: "Every time I needed to check something — oil specs, common issues, service intervals — I was digging through forums and PDFs. I built My Garage so all that information lives in one place, organized around my specific car.",
  },
  {
    name: 'Cory',
    role: 'Co-founder, AutoRev',
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocLBUVkqYd9vWLf09JgiBMlAe-amaPmyBD4WJJlXiNKSsmitnw=s96-c',
    quote: "I know maintenance intervals, common failures, and which years to avoid for dozens of cars. My Garage organizes all of that knowledge by your specific vehicle — the same info I'd pull from memory, but accessible to everyone instantly.",
  },
];

export default function YourGarageLandingPage() {
  return (
    <div className={styles.page}>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <LandingTracking pageId="your-garage" />

      <LandingHero
        pageId="your-garage"
        headline="Everything About Your Car. One Place."
        subhead="Maintenance specs, parts and records. Known issues, recalls, and recommendations based on VIN. No more digging through forums and PDFs."
        primaryCtaLabel="Add Your Car"
        primaryCtaHref="/garage"
        secondaryCtaLabel="See How It Works"
        secondaryCtaHref="#features"
        videoSrc="/videos/your-garage-demo.mp4"
        phoneSrc={ONBOARDING_IMAGES.garageDetails}
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
          "Save cars you're researching as favorites (free)",
          'See specs, variants, and trim details',
          'Track your entire collection in one spot',
        ]}
        imageSrc={ONBOARDING_IMAGES.garageDetails}
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
        imageSrc={ONBOARDING_IMAGES.garageReference}
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
        imageSrc={ONBOARDING_IMAGES.garageSafety}
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
        imageSrc={ONBOARDING_IMAGES.garageHealth}
        imageAlt="AutoRev Known Issues"
        imageCaption="Vehicle Health"
      />

      <LandingAL
        pageId="your-garage"
        headline="Ask AL About Your Car"
        description="Have a question about your specific car? AL knows your make, model, and year — and can answer maintenance questions, explain common issues, and help you understand what to watch for."
        exampleQuestions={[
          "What oil should I use in my 2015 BMW M3?",
          "What are the common issues with the E92 M3 S65 engine?",
          "How often should I change the diff fluid on my 996?",
        ]}
        videoSrc="/videos/al-your-garage-demo.mp4"
        imageSrc={ONBOARDING_IMAGES.aiAlThinking}
      />

      <LandingTestimonial testimonials={TESTIMONIALS} />

      <LandingCTA
        pageId="your-garage"
        headline="Know your car better"
        subhead="Add your cars and see all the details in one place. Start free — upgrade for full owner reference tools."
        primaryCtaLabel="Add Your Car"
        primaryCtaHref="/garage"
        note="Start free — add your cars and explore. Upgrade anytime for full features."
      />
    </div>
  );
}
