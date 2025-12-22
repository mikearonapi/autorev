import { Suspense } from 'react';
import './globals.css';
import { fontVariables } from '@/lib/fonts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomCta from '@/components/MobileBottomCta';
import ScrollToTop from '@/components/ScrollToTop';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AppConfigProvider } from '@/lib/hooks/useAppConfig';
import { CarSelectionProvider } from '@/components/providers/CarSelectionProvider';
import { FavoritesProvider } from '@/components/providers/FavoritesProvider';
import { CompareProvider } from '@/components/providers/CompareProvider';
import { SavedBuildsProvider } from '@/components/providers/SavedBuildsProvider';
import { OwnedVehiclesProvider } from '@/components/providers/OwnedVehiclesProvider';
import SelectedCarBanner from '@/components/SelectedCarBanner';
import SelectedCarFloatingWidget from '@/components/SelectedCarFloatingWidget';
import CompareBar from '@/components/CompareBar';
import { FeedbackProvider } from '@/components/FeedbackWidget';
import { AIMechanicProvider } from '@/components/AIMechanicChat';
import FeedbackCorner from '@/components/FeedbackCorner';
import GlobalErrorHandler from '@/components/GlobalErrorHandler';
import ErrorBoundary from '@/components/ErrorBoundary';
import FetchInterceptor from '@/components/FetchInterceptor';
import ConsoleErrorInterceptor from '@/components/ConsoleErrorInterceptor';

const siteUrl = 'https://autorev.app';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'AutoRev | Sports Car Selector & Performance Experts',
    template: '%s | AutoRev',
  },
  description: 'Unleash your racing spirit. Find your perfect sports car with our intelligent selector, plan performance builds with purpose, and join a community that values mastery over materialism. From Miatas to GT3s—we lift up every driver.',
  keywords: [
    'sports cars',
    'track cars', 
    'performance upgrades',
    'motorsports',
    'car selector',
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
    'brake upgrades',
    'muscle cars',
    'import tuners',
    'drift cars'
  ],
  authors: [{ name: 'AutoRev' }],
  creator: 'AutoRev',
  publisher: 'AutoRev',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'AutoRev',
    title: 'AutoRev | Find What Drives You',
    description: 'Find your perfect sports car, plan performance builds with purpose, and join a community that values mastery over materialism. Excellence over ego—we lift up every driver.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'AutoRev - Find Your Perfect Sports Car',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@autorev',
    creator: '@autorev',
    title: 'AutoRev | Find What Drives You',
    description: 'Find your perfect sports car, plan builds with purpose, and join a community that values mastery over materialism. Excellence over ego.',
    images: [
      {
        url: '/twitter-image',
        width: 1200,
        height: 630,
        alt: 'AutoRev - Find Your Perfect Sports Car',
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
  alternates: {
    canonical: siteUrl,
  },
  category: 'automotive',
  // Additional metadata for app installs and sharing
  applicationName: 'AutoRev',
  appleWebApp: {
    title: 'AutoRev',
    statusBarStyle: 'black-translucent',
    capable: true,
  },
  // Verification tags (can be updated with actual values)
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  // Additional SEO
  other: {
    'apple-mobile-web-app-title': 'AutoRev',
    'mobile-web-app-capable': 'yes',
  },
};

// JSON-LD Structured Data for Organization
const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AutoRev',
  url: siteUrl,
  logo: `${siteUrl}/apple-icon`,
  description: 'Unleash your racing spirit. Sports car selection, performance builds, and a community built on excellence over ego. From Miatas to GT3s—we lift up every driver.',
  sameAs: [
    'https://instagram.com/autorev',
    'https://youtube.com/@autorev'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'contact@autorev.app',
  },
};

// JSON-LD for Website with SearchAction
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AutoRev',
  url: siteUrl,
  description: 'Unleash your racing spirit. Find your perfect sports car, plan performance builds with purpose, and join a community that values mastery over materialism.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/car-selector?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={fontVariables}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#1a4d6e" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#0a1628" media="(prefers-color-scheme: light)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AutoRev" />
        
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://pcbkerqlfcjbnhaxjyqj.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pcbkerqlfcjbnhaxjyqj.supabase.co" />
        <link rel="preconnect" href="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com" />
        
        {/* Favicons - auto-generated by app/icon.tsx and app/apple-icon.tsx */}
        {/* Additional explicit links for browser compatibility */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icon" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon" />
        
        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Social sharing optimization for iMessage, WhatsApp, etc. */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
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
        <GlobalErrorHandler>
          <FetchInterceptor>
            <ConsoleErrorInterceptor>
            <ErrorBoundary name="RootLayout" featureContext="app">
              <QueryProvider>
              <AuthProvider>
            <AppConfigProvider>
            <FeedbackProvider>
            <CarSelectionProvider>
            <FavoritesProvider>
            <CompareProvider>
            <SavedBuildsProvider>
            <OwnedVehiclesProvider>
            <AIMechanicProvider>
              {/* Scroll to top on route change */}
              <Suspense fallback={null}>
                <ScrollToTop />
              </Suspense>
              <Header />
              
              {/* Feedback corner - discreet top-right feedback icon */}
              <FeedbackCorner />
              
              <main>
                {children}
              </main>
              <Footer />
              
              {/* Floating Compare Bar - shows when cars added to compare */}
              <Suspense fallback={null}>
                <CompareBar />
              </Suspense>
              
              {/* Mobile sticky CTA bar - shows on scroll */}
              <MobileBottomCta />
            </AIMechanicProvider>
            </OwnedVehiclesProvider>
            </SavedBuildsProvider>
            </CompareProvider>
            </FavoritesProvider>
            </CarSelectionProvider>
            </FeedbackProvider>
            </AppConfigProvider>
            </AuthProvider>
            </QueryProvider>
            </ErrorBoundary>
            </ConsoleErrorInterceptor>
          </FetchInterceptor>
        </GlobalErrorHandler>
      </body>
    </html>
  );
}

