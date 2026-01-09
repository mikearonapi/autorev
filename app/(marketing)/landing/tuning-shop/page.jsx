import { FeatureShowcase, LandingAL, LandingCTA, LandingHero, LandingProblem, LandingTestimonial, LandingTracking } from '@/components/landing';
import { ONBOARDING_IMAGES } from '@/lib/images';
import styles from './page.module.css';

const siteUrl = 'https://autorev.app';
const pageUrl = `${siteUrl}/landing/tuning-shop`;

export const metadata = {
  title: 'Tuning Shop - Car Modification Planner & Build Calculator | AutoRev',
  description: "Plan your build before you spend. Configure upgrades, see estimated horsepower gains, and visualize your complete build — intake, exhaust, tune, suspension, wheels. Stop throwing parts at your car and build with a plan.",
  keywords: [
    'car modification planner',
    'car build calculator',
    'horsepower calculator',
    'car tuning guide',
    'performance upgrade planner',
    'car mod builder',
    'intake exhaust tune calculator',
    'suspension upgrade guide',
    'wheel fitment calculator',
    'FBO build calculator',
    'E85 tune calculator',
    'BMW tuning guide',
    'Porsche modification planner',
    'Corvette build planner',
    'sports car mods',
    'best car upgrades',
    'dyno power gains',
    'car build cost estimator',
  ],
  alternates: { 
    canonical: pageUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: pageUrl,
    siteName: 'AutoRev',
    title: 'Tuning Shop - Plan Your Build | AutoRev',
    description: "Configure upgrades, see estimated power gains, and build with a plan. Stop guessing — visualize your complete build before spending a dollar.",
    images: [
      {
        url: `${pageUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'AutoRev Tuning Shop - Car Modification Planner & Build Calculator',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@autorev',
    creator: '@autorev',
    title: 'Tuning Shop - Plan Your Build | AutoRev',
    description: "Configure mods, see HP gains, build with a plan. Stop throwing parts at your car — visualize first.",
    images: [
      {
        url: `${pageUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'AutoRev Tuning Shop - Car Modification Planner & Build Calculator',
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

// JSON-LD Structured Data for the Tuning Shop Landing Page
const pageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Tuning Shop - Car Modification Planner & Build Calculator',
  description: "Plan your build before you spend. Configure upgrades, see estimated horsepower gains, and visualize your complete build.",
  url: pageUrl,
  isPartOf: {
    '@type': 'WebSite',
    name: 'AutoRev',
    url: siteUrl,
  },
  mainEntity: {
    '@type': 'SoftwareApplication',
    name: 'AutoRev Tuning Shop',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    description: 'Car modification planner that lets you configure upgrades, see estimated power gains, and visualize your complete build',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free to explore and plan builds. Save builds with a free account.',
    },
    featureList: [
      'Configure intake, exhaust, tune, suspension, wheels upgrades',
      'See estimated HP and torque gains per modification',
      'Track running total of projected output',
      'Estimate build cost as you configure',
      'Save and compare multiple build configurations',
      'Visualize wheel and tire setups',
      'Get AI-powered build advice from AL',
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
        name: 'Tuning Shop',
        item: pageUrl,
      },
    ],
  },
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
  car: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
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
  circle: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  save: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
};

const TESTIMONIALS = [
  {
    name: 'Mike',
    role: 'Co-founder, AutoRev',
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJK1K-ufstc_sqBjvFJH5E7fVwd6rwlJCusBzF2Q7yxtHt1hzu0sQ=s96-c',
    quote: "I wasted money on mods that didn't make sense together — parts that conflicted, upgrades in the wrong order. I built the Tuning Shop so you can see the whole build path before spending a dime, instead of learning expensive lessons the hard way.",
  },
  {
    name: 'Cory',
    role: 'Co-founder, AutoRev',
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocLBUVkqYd9vWLf09JgiBMlAe-amaPmyBD4WJJlXiNKSsmitnw=s96-c',
    quote: "I've seen too many builds go sideways — big turbo kits before fuel system upgrades, power mods when the suspension can't handle it. The Tuning Shop puts all that knowledge in one place so you can plan a build that actually makes sense.",
  },
];

export default function TuningShopLandingPage() {
  return (
    <div className={styles.page}>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <LandingTracking pageId="tuning-shop" />

      <LandingHero
        pageId="tuning-shop"
        headline="We've Done the Research For You"
        subhead="The information is out there, it's just hard to find. Configure upgrades, see estimated power gains, and build with a plan — without the forum trolls."
        primaryCtaLabel="Open Tuning Shop"
        primaryCtaHref="/tuning-shop"
        secondaryCtaLabel="See How It Works"
        secondaryCtaHref="#features"
        videoSrc="/videos/tuning-shop-demo.mp4"
        phoneSrc={ONBOARDING_IMAGES.tuningShopOverview}
        phoneAlt="AutoRev Tuning Shop overview"
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
        icon={<Icons.car />}
        headline="Select Your Car"
        description="Start by picking your car from our database. We'll show you the factory specs and what's possible with modifications for your specific platform."
        bullets={[
          'Browse our complete sports car database',
          'See factory horsepower and torque',
          'Understand what upgrades are available',
        ]}
        imageSrc={ONBOARDING_IMAGES.tuningShopOverview}
        imageAlt="AutoRev Tuning Shop car selection"
        imageCaption="Select Your Car"
      />

      <FeatureShowcase
        reversed
        icon={<Icons.wrench />}
        headline="Configure Upgrades"
        description="Browse upgrade categories and select the mods you're considering. See estimated power gains for each part and how they add up together."
        bullets={[
          'Intake, exhaust, tune, suspension, wheels',
          'See estimated HP/torque gains per mod',
          'Running total of projected output',
          'Track estimated cost as you build',
        ]}
        imageSrc={ONBOARDING_IMAGES.tuningShopPowerList}
        imageAlt="AutoRev Tuning Shop upgrade configuration"
        imageCaption="Configure Upgrades"
      />

      <FeatureShowcase
        icon={<Icons.circle />}
        headline="Wheels &amp; Tires"
        description="Visualize how different wheel setups look and perform. See how different sizes affect your car's handling and appearance."
        bullets={[
          'Browse wheel configurations',
          'See how different setups look',
          'Understand size and offset impacts',
        ]}
        imageSrc={ONBOARDING_IMAGES.tuningShopWheels}
        imageAlt="AutoRev Tuning Shop wheel configuration"
        imageCaption="Wheels &amp; Tires"
      />

      <FeatureShowcase
        reversed
        icon={<Icons.chart />}
        headline="Visualize Performance"
        description="See your projected performance in one view. Understand what your build could achieve before you spend a dollar."
        bullets={[
          'Projected HP and torque after mods',
          'Compare stock vs. modified specs',
          'See the complete build summary',
        ]}
        imageSrc={ONBOARDING_IMAGES.tuningShopMetrics}
        imageAlt="AutoRev Tuning Shop performance visualization"
        imageCaption="Performance Metrics"
      />

      <FeatureShowcase
        icon={<Icons.save />}
        headline="Save Your Builds"
        description="Save your build configurations to compare later. Create multiple builds for different goals — street, track, daily — and see how they stack up."
        bullets={[
          'Save builds to your account',
          'Compare different configurations',
          'Share builds with friends',
          'Free to explore, save with account',
        ]}
        imageSrc={ONBOARDING_IMAGES.tuningShopPresets}
        imageAlt="AutoRev Tuning Shop saved builds"
        imageCaption="Saved Builds"
      />

      <LandingAL
        pageId="tuning-shop"
        headline="Get Build Advice from AL"
        description="Not sure where to start? AL knows your platform and can recommend mods based on your goals and budget. Ask about compatibility, common build paths, and what to prioritize."
        exampleQuestions={[
          "What mods should I do first on my E92 M3 for track use?",
          "Is FBO worth it on the N54, or should I go straight to single turbo?",
          "What's a good 400whp build for a 370Z on a $5k budget?",
        ]}
        videoSrc="/videos/al-tuning-shop-demo.mp4"
        imageSrc={ONBOARDING_IMAGES.aiAlResponseMods}
      />

      <LandingTestimonial testimonials={TESTIMONIALS} />

      <LandingCTA
        pageId="tuning-shop"
        headline="Build with a plan"
        subhead="Stop guessing. See what your build could achieve before you start buying parts."
        primaryCtaLabel="Open Tuning Shop"
        primaryCtaHref="/tuning-shop"
        note="Start free — explore builds and save them with a free account"
      />
    </div>
  );
}
