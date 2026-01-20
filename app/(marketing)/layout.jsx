/**
 * Marketing Layout
 * 
 * Wrapper for public marketing pages with SEO metadata for the homepage.
 * Routes: /, /community/builds, /community/events, /terms, /privacy, /contact
 */

import SchemaOrg from '@/components/SchemaOrg';
import { generateBreadcrumbSchema, SITE_URL } from '@/lib/seoUtils';

// Homepage metadata (since page.jsx is a client component)
export const metadata = {
  title: 'AutoRev | Build Planning for Performance Enthusiasts',
  description: 'Plan your perfect car build with verified parts, real dyno data, and expert recommendations. Research mods, track your project, join the community. AI-powered advice from AL, your car expert.',
  keywords: [
    // Core value proposition
    'car build planner',
    'performance mod planning',
    'car modification app',
    'dyno data lookup',
    'parts compatibility checker',
    // AI features
    'car AI assistant',
    'automotive AI',
    'car research AI',
    // Discovery
    'sports car database',
    'car specs lookup',
    'sports car comparison',
    // Popular searches
    'Porsche 911 mods',
    'BMW M3 upgrades',
    'Corvette C8 tuning',
    'Mustang GT performance',
    'Nissan Z build',
    'Toyota GR86 parts',
    'Mazda Miata upgrades',
    // Use cases
    'track day preparation',
    'street car build',
    'daily driver upgrades',
    'car modification guide',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'AutoRev',
    title: 'AutoRev | Build Planning for Performance Enthusiasts',
    description: 'Plan your perfect car build with verified parts, real dyno data, and AI-powered advice. Research, build, and connect with the community.',
    images: [
      {
        url: `${SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'AutoRev - Build Planning for Performance Enthusiasts',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@autorev',
    creator: '@autorev',
    title: 'AutoRev | Build Planning for Performance Enthusiasts',
    description: 'Plan your perfect car build with verified parts, real dyno data, and AI-powered advice from AL.',
    images: [
      {
        url: `${SITE_URL}/twitter-image`,
        width: 1200,
        height: 630,
        alt: 'AutoRev - Build Planning for Performance Enthusiasts',
      },
    ],
  },
  alternates: {
    canonical: SITE_URL,
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

// Homepage JSON-LD - WebPage schema for the landing page
const homepageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'AutoRev - Build Planning for Performance Enthusiasts',
  description: 'Plan your perfect car build with verified parts, real dyno data, and expert recommendations. AI-powered advice from AL.',
  url: SITE_URL,
  isPartOf: {
    '@type': 'WebSite',
    name: 'AutoRev',
    url: SITE_URL,
  },
  mainEntity: {
    '@type': 'SoftwareApplication',
    name: 'AutoRev',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    description: 'AI-powered build planning platform for performance car enthusiasts',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'AI car assistant (AL) for instant answers',
      'Build planning with verified parts',
      'Real dyno data and performance gains',
      'Parts compatibility checking',
      'Digital garage for your collection',
      'Local car event discovery',
    ],
  },
};

export default function MarketingLayout({ children }) {
  return (
    <>
      <SchemaOrg schema={homepageSchema} />
      {children}
    </>
  );
}
