/**
 * Root Layout
 * 
 * Contains ALL providers for backward compatibility during route group migration.
 * 
 * Migration strategy:
 * 1. Keep all providers in root layout
 * 2. Move routes into (marketing) or (app) groups
 * 3. Once all routes are in groups, remove unused providers from root
 * 
 * Route group layouts:
 * - app/(marketing)/layout.jsx - adds UI elements for marketing pages
 * - app/(app)/layout.jsx - adds UI elements for app pages
 */

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Analytics } from '@vercel/analytics/next';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import MetaPixel from '@/components/MetaPixel';
import './globals.css';
import { fontVariables } from '@/lib/fonts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AppConfigProvider } from '@/lib/hooks/useAppConfig';
import { CarSelectionProvider } from '@/components/providers/CarSelectionProvider';
import { FavoritesProvider } from '@/components/providers/FavoritesProvider';
import { CompareProvider } from '@/components/providers/CompareProvider';
import { SavedBuildsProvider } from '@/components/providers/SavedBuildsProvider';
import { OwnedVehiclesProvider } from '@/components/providers/OwnedVehiclesProvider';
import { LoadingProgressProvider } from '@/components/providers/LoadingProgressProvider';
import GlobalErrorHandler from '@/components/GlobalErrorHandler';
import ErrorBoundary from '@/components/ErrorBoundary';
import FetchInterceptor from '@/components/FetchInterceptor';
import ConsoleErrorInterceptor from '@/components/ConsoleErrorInterceptor';
import { BannerProvider } from '@/components/providers/BannerProvider';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import ScrollToTop from '@/components/ScrollToTop';
import PageViewTracker from '@/components/PageViewTracker';
import BetaBanner from '@/components/BetaBanner';

// =============================================================================
// LAZY-LOADED COMPONENTS (Deferred for better LCP)
// These components are not critical for initial render and can load after hydration
// =============================================================================

// Deferred Providers - Heavy providers (AIMechanic, Feedback) load after first paint
// This reduces Total Blocking Time (TBT) by deferring 2100+ lines of code
import { AIChatHost } from '@/components/AIChatContext';
import { FeedbackHost } from '@/components/FeedbackContext';

// Compare Bar - Only shows when user adds cars to compare
const CompareBar = dynamic(() => import('@/components/CompareBar'), { ssr: false });

// Mobile CTA - Only shows on scroll
const MobileBottomCta = dynamic(() => import('@/components/MobileBottomCta'), { ssr: false });

// Feedback Corner - Non-critical UI element
const FeedbackCorner = dynamic(() => import('@/components/FeedbackCorner'), { ssr: false });

const siteUrl = 'https://autorev.app';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'AutoRev | AI-Powered Sports Car Research Platform',
    template: '%s | AutoRev',
  },
  description: 'AI-powered research platform for sports car enthusiasts. Like having the obsessive car nerd in your pocket — specs, troubleshooting, mods, recalls, you name it. Research cars, manage your collection, plan mods, discover events. Tony Stark had Jarvis. Now you have AL.',
  keywords: [
    // Core positioning
    'car AI assistant',
    'automotive AI',
    'car research AI',
    'sports car database',
    'car specs lookup',
    // Sports car research
    'sports car comparison',
    'sports car buying guide',
    'best sports cars',
    'track day cars',
    'weekend sports car',
    // Popular models (high search volume)
    'Porsche 911',
    'Porsche Cayman GT4',
    'BMW M3',
    'BMW M4',
    'Corvette C8',
    'Ford Mustang GT',
    'Nissan Z',
    'Toyota GR86',
    'Mazda MX-5 Miata',
    'Audi RS',
    // Ownership & maintenance
    'car maintenance schedule',
    'car recall lookup',
    'common car problems',
    'car troubleshooting',
    // Modifications & tuning
    'car modification guide',
    'performance upgrades',
    'aftermarket parts',
    'car tuning',
    'suspension upgrades',
    'exhaust upgrades',
    // Events & community
    'car shows near me',
    'track days',
    'cars and coffee',
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
    title: 'AutoRev | Your AI Car Expert',
    description: 'Like having an obsessive car nerd in your pocket. Specs, troubleshooting, mods, recalls — answered instantly, without bias. Tony Stark had Jarvis. Now you have AL.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'AutoRev - AI-Powered Sports Car Research',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@autorev',
    creator: '@autorev',
    title: 'AutoRev | Your AI Car Expert',
    description: 'The obsessive car nerd in your pocket. Specs, mods, recalls — answered instantly. Tony Stark had Jarvis. Now you have AL.',
    images: [
      {
        url: '/twitter-image',
        width: 1200,
        height: 630,
        alt: 'AutoRev - AI-Powered Sports Car Research',
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
  description: 'AI-powered research platform for sports car enthusiasts. Like having the obsessive car nerd in your pocket — specs, troubleshooting, mods, recalls. Tony Stark had Jarvis, now you have AL.',
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
  description: 'AI-powered research platform for sports car enthusiasts. Research cars, manage your collection, plan mods, discover events — with AL, your AI car expert.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/car-selector?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

// JSON-LD for SoftwareApplication (PWA/App)
const softwareAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AutoRev',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description: 'AI-powered research platform for sports car enthusiasts. Research cars, manage your collection, plan mods, discover events.',
  featureList: [
    'AI car assistant (AL) for instant answers',
    'Sports car database with 2,500+ vehicles',
    'Digital garage for your collection',
    'Modification planner with dyno data',
    'Local car event discovery',
    'VIN decoder and recall alerts',
  ],
  screenshot: `${siteUrl}/opengraph-image`,
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '127',
    bestRating: '5',
    worstRating: '1',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={fontVariables} data-has-banner="true">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#1a4d6e" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#0a1628" media="(prefers-color-scheme: light)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AutoRev" />
        
        {/* Facebook Domain Verification */}
        <meta name="facebook-domain-verification" content="vu8n45bve2gdnsxj7x3leq648aci5e" />
        
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://pcbkerqlfcjbnhaxjyqj.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pcbkerqlfcjbnhaxjyqj.supabase.co" />
        <link rel="preconnect" href="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com" />
        
        {/* =============================================================================
            LCP IMAGE PRELOAD HINTS
            These preload hints tell the browser to fetch hero images IMMEDIATELY,
            before JavaScript hydrates. This is critical for LCP performance.
            
            Without preload: Browser discovers image after React hydrates (~5-10s)
            With preload: Browser fetches image in parallel with JS (~instant)
            ============================================================================= */}
        {/* Homepage hero - most critical LCP element */}
        <link 
          rel="preload" 
          href="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/pages/home/hero-v2.webp" 
          as="image" 
          type="image/webp"
          fetchPriority="high"
        />
        
        {/* Favicons - static files for maximum compatibility */}
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        
        {/* Apple Touch Icons - REQUIRED for "Add to Home Screen" on iOS */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        
        {/* PWA manifest - REQUIRED for "Add to Home Screen" prompt */}
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
        />
        
        {/* Google Analytics 4 */}
        <GoogleAnalytics />
        
        {/* Meta Pixel (Facebook Pixel) */}
        <MetaPixel />
      </head>
      <body>
        <GlobalErrorHandler>
          <FetchInterceptor>
            <ConsoleErrorInterceptor>
              <ErrorBoundary name="RootLayout" featureContext="app">
                <QueryProvider>
                  <LoadingProgressProvider>
                    <AuthProvider>
                      <AppConfigProvider>
                        <CarSelectionProvider>
                          <FavoritesProvider>
                            <CompareProvider>
                              <SavedBuildsProvider>
                                <OwnedVehiclesProvider>
                                  <BannerProvider>
                                    {/* Scroll to top on route change + Analytics tracking */}
                                    <Suspense fallback={null}>
                                      <ScrollToTop />
                                      <PageViewTracker />
                                    </Suspense>
                                    <Header />
                                    
                                    {/* Beta banner - shown during beta period */}
                                    <BetaBanner />
                                    
                                    {/* Feedback corner - discreet top-right feedback icon */}
                                    <FeedbackCorner />

                                    {/* On-demand heavy UI (does NOT wrap the whole app) */}
                                    <FeedbackHost />
                                    <AIChatHost />
                                    
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
                                  </BannerProvider>
                                </OwnedVehiclesProvider>
                              </SavedBuildsProvider>
                            </CompareProvider>
                          </FavoritesProvider>
                        </CarSelectionProvider>
                      </AppConfigProvider>
                    </AuthProvider>
                  </LoadingProgressProvider>
                </QueryProvider>
              </ErrorBoundary>
            </ConsoleErrorInterceptor>
          </FetchInterceptor>
        </GlobalErrorHandler>
        <Analytics />
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

