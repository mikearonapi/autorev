import { FeatureShowcase, LandingAL, LandingCTA, LandingHero, LandingProblem, LandingTestimonial, LandingTracking } from '@/components/landing';
import { ONBOARDING_IMAGES } from '@/lib/images';
import styles from './page.module.css';

// LCP Preload: The hero image path for this landing page
// Must match the phoneSrc passed to LandingHero (WebP for 86% size reduction)
const HERO_IMAGE_PATH = '/images/onboarding/car-selector-02-results.webp';

// Video poster images for instant visual feedback before video loads
const VIDEO_POSTERS = {
  hero: '/videos/find-your-car-poster.jpg',
  al: '/videos/al-find-your-car-poster.jpg',
};

const siteUrl = 'https://autorev.app';
const pageUrl = `${siteUrl}/landing/find-your-car`;

export const metadata = {
  title: 'Find Your Perfect Sports Car | Car Matching Tool | AutoRev',
  description: "Stop researching in circles. Tell us what matters — sound, track, reliability, comfort, value — and we'll match you with sports cars that actually fit YOUR priorities. 2,500+ cars scored against your preferences.",
  keywords: [
    'sports car finder',
    'car matching tool',
    'which sports car should I buy',
    'car comparison tool',
    'best sports car for me',
    'car selector quiz',
    'sports car recommendation',
    'find the right car',
    'car buying guide',
    'sports car priorities',
    'Porsche finder',
    'BMW M car comparison',
    'Corvette vs Cayman',
    'best track car',
    'best daily driver sports car',
  ],
  alternates: { 
    canonical: pageUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: pageUrl,
    siteName: 'AutoRev',
    title: 'Find Your Perfect Sports Car | AutoRev',
    description: "Set your priorities. Get matched with cars that fit. No more guessing — just cars scored against what YOU care about.",
    images: [
      {
        url: `${pageUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'AutoRev Car Selector - Find Your Perfect Sports Car Match',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@autorev',
    creator: '@autorev',
    title: 'Find Your Perfect Sports Car | AutoRev',
    description: "Set your priorities. Get matched with cars that fit. 2,500+ sports cars scored against what YOU care about.",
    images: [
      {
        url: `${pageUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'AutoRev Car Selector - Find Your Perfect Sports Car Match',
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

// JSON-LD Structured Data for the Car Selector Landing Page
const pageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Find Your Perfect Sports Car',
  description: "Tell us what matters — sound, track, reliability, comfort, value — and we'll match you with sports cars that actually fit YOUR priorities.",
  url: pageUrl,
  isPartOf: {
    '@type': 'WebSite',
    name: 'AutoRev',
    url: siteUrl,
  },
  mainEntity: {
    '@type': 'SoftwareApplication',
    name: 'AutoRev Car Selector',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    description: 'AI-powered car matching tool that scores sports cars against your personal priorities',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Set priorities across 7 categories (sound, track, reliability, comfort, value, fun, aftermarket)',
      'Get personalized car rankings',
      'See score breakdowns for each car',
      'Filter by price range and body style',
      'Compare multiple cars side-by-side',
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
        name: 'Find Your Car',
        item: pageUrl,
      },
    ],
  },
};

// FAQ Schema for rich snippets in Google search results
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does the AutoRev Car Selector work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Car Selector lets you set priorities across 7 categories: sound, track capability, reliability, daily comfort, value, driver fun, and aftermarket support. Our algorithm then scores every car in our database against YOUR priorities and shows you a ranked list of matches with score breakdowns.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many cars does AutoRev have in its database?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'AutoRev has over 2,500 sports and performance cars in our database, ranging from affordable entry-level sports cars to exotic supercars. We cover vehicles from $25,000 to $300,000+.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the Car Selector free to use?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! The Car Selector is completely free to use. You can set your priorities, see your matches, and compare cars without creating an account. Sign up free to save your results and access additional features.',
      },
    },
    {
      '@type': 'Question',
      name: 'What makes AutoRev different from other car comparison sites?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Unlike other sites that just list specs, AutoRev starts with YOUR priorities. Instead of searching through thousands of cars, you tell us what matters to you and we show you which cars actually fit. Plus, our AI assistant AL can answer any questions about the cars you\'re considering.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I compare specific cars side-by-side?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! After getting your matches, you can add any cars to your comparison list and see them side-by-side with detailed specs, scores, and our recommendations for who each car is best suited for.',
      },
    },
  ],
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
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJK1K-ufstc_sqBjvFJH5E7fVwd6rwlJCusBzF2Q7yxtHt1hzu0sQ=s96-c',
    quote: "I spent months researching sports cars — YouTube, forums, spreadsheets. Every source contradicted the last, and none of them asked what actually mattered to ME. I built the Car Selector because I needed a tool that started with my priorities, not someone else's opinion.",
  },
  {
    name: 'Cory',
    role: 'Co-founder, AutoRev',
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocLBUVkqYd9vWLf09JgiBMlAe-amaPmyBD4WJJlXiNKSsmitnw=s96-c',
    quote: "When friends ask me which car to buy, my first question is always 'what do you care about?' A Cayman is perfect for one person and wrong for another. The Car Selector captures that conversation — it asks the right questions and surfaces the cars that actually fit.",
  },
];

export default function FindYourCarLandingPage() {
  return (
    <>
      {/* PERF: Preload LCP image - critical for landing page performance */}
      {/* This tells the browser to fetch the hero image IMMEDIATELY */}
      <link 
        rel="preload" 
        href={HERO_IMAGE_PATH}
        as="image"
        type="image/webp"
        fetchPriority="high"
      />
      
      <div className={styles.page}>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
        <LandingTracking pageId="find-your-car" />

      <LandingHero
        pageId="find-your-car"
        headline="Find the Perfect Sports Car for You"
        subhead="Tell us what you care about — sound, track, reliability, comfort, value — and we'll match you with cars that actually fit YOUR priorities. No more guessing."
        primaryCtaLabel="Find Your Perfect Match"
        primaryCtaHref="/car-selector"
        secondaryCtaLabel="See How It Works"
        secondaryCtaHref="#features"
        videoSrc="/videos/find-your-car-demo.mp4"
        videoPoster={VIDEO_POSTERS.hero}
        phoneSrc={ONBOARDING_IMAGES.carSelectorResults}
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
        imageSrc={ONBOARDING_IMAGES.carSelectorPreferences}
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
        imageSrc={ONBOARDING_IMAGES.carSelectorResults}
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
        videoPoster={VIDEO_POSTERS.al}
        imageSrc={ONBOARDING_IMAGES.aiAlResponseAnalysis}
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
    </>
  );
}
