import { Suspense } from 'react';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomCta from '@/components/MobileBottomCta';
import ScrollToTop from '@/components/ScrollToTop';

const siteUrl = 'https://supernaturalmotorsports.com';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'SuperNatural Motorsports | Sports Car Finder & Performance Experts',
    template: '%s | SuperNatural Motorsports',
  },
  description: 'Find your perfect sports car with our expert advisory. Compare 35+ vehicles from $25K-$100K, plan performance upgrades, and access professional motorsports services. Porsche, BMW M, Corvette, and more.',
  keywords: [
    'sports cars',
    'track cars', 
    'performance upgrades',
    'motorsports',
    'car finder',
    'sports car comparison',
    'Porsche 911',
    'Porsche Cayman',
    'BMW M3',
    'BMW M4',
    'Corvette C7',
    'Corvette C8',
    'GT cars',
    'track day car',
    'weekend car',
    'sports car buying guide',
    'performance tuning',
    'suspension upgrades',
    'brake upgrades'
  ],
  authors: [{ name: 'SuperNatural Motorsports' }],
  creator: 'SuperNatural Motorsports',
  publisher: 'SuperNatural Motorsports',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'SuperNatural Motorsports',
    title: 'SuperNatural Motorsports | Sports Car Finder & Performance Experts',
    description: 'Find your perfect sports car with our expert advisory. Compare 35+ vehicles from $25K-$100K, plan performance upgrades, and access professional motorsports services.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SuperNatural Motorsports - Find Your Perfect Sports Car',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SuperNatural Motorsports | Sports Car Finder & Performance Experts',
    description: 'Find your perfect sports car. Compare 35+ vehicles, plan upgrades, and access expert motorsports services.',
    images: ['/og-image.jpg'],
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
  alternates: {
    canonical: siteUrl,
  },
  category: 'automotive',
};

// JSON-LD Structured Data for Organization
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SuperNatural Motorsports',
  url: siteUrl,
  logo: `${siteUrl}/logo.png`,
  description: 'Expert sports car advisory, performance upgrades, and motorsports services for enthusiasts.',
  sameAs: [
    'https://instagram.com/supernaturalmotorsports',
    'https://youtube.com/@supernaturalmotorsports'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'contact@supernaturalmotorsports.com',
  },
};

// JSON-LD for Website with SearchAction
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'SuperNatural Motorsports',
  url: siteUrl,
  description: 'Find your perfect sports car with expert recommendations and performance upgrades.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/car-finder?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#1a4d6e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>
        {/* Scroll to top on route change */}
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        <Header />
        <main style={{ 
          flex: 1, 
          paddingTop: 'var(--header-height-mobile)',
          minHeight: 'calc(100dvh - var(--header-height-mobile))',
        }}>
          {children}
        </main>
        <Footer />
        {/* Mobile sticky CTA bar - shows on scroll */}
        <MobileBottomCta />
      </body>
    </html>
  );
}

