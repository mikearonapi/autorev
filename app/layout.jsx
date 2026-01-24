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
import { SpeedInsights } from '@vercel/speed-insights/next';
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
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import ScrollToTop from '@/components/ScrollToTop';
import PageViewTracker from '@/components/PageViewTracker';
import BetaBanner from '@/components/BetaBanner';
import SkipLink from '@/components/SkipLink';

// =============================================================================
// LAZY-LOADED COMPONENTS (Deferred for better LCP)
// These components are not critical for initial render and can load after hydration
// =============================================================================

// Deferred Providers - Heavy providers load after first paint
// This reduces Total Blocking Time (TBT) by deferring large code bundles
// NOTE: AIChatHost removed - AL chat now uses dedicated /al page (ALPageClient.jsx)
import { FeedbackHost } from '@/components/FeedbackContext';

// Compare Bar - Only shows when user adds cars to compare
const CompareBar = dynamic(() => import('@/components/CompareBar'), { ssr: false });

// Mobile CTA - Only shows on scroll
const MobileBottomCta = dynamic(() => import('@/components/MobileBottomCta'), { ssr: false });

// Feedback Corner - Non-critical UI element
const FeedbackCorner = dynamic(() => import('@/components/FeedbackCorner'), { ssr: false });

// Cookie Consent Banner - GDPR compliance
const CookieConsent = dynamic(() => import('@/components/CookieConsent'), { ssr: false });

const siteUrl = 'https://autorev.app';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'AutoRev | Build Planning for Performance Enthusiasts',
    template: '%s | AutoRev',
  },
  description: 'Plan your perfect car build with verified parts, real dyno data, and expert recommendations. The complete platform for performance modifications. Research parts, track your project, join the community.',
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
    'Sports car database with 300+ vehicles',
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
    <html lang="en" className={fontVariables} data-has-banner="false" suppressHydrationWarning>
      <head>
        {/* =============================================================================
            CRITICAL: Preconnects MUST be first in <head> for maximum effectiveness
            These establish TCP/TLS connections before the browser discovers resources
            ============================================================================= */}
        {/* Supabase - no crossOrigin for credentialed requests (API calls with auth) */}
        <link rel="preconnect" href="https://pcbkerqlfcjbnhaxjyqj.supabase.co" />
        <link rel="dns-prefetch" href="https://pcbkerqlfcjbnhaxjyqj.supabase.co" />
        {/* Vercel Blob - crossOrigin="anonymous" for public image assets */}
        <link rel="preconnect" href="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com" />
        {/* Google Analytics / Tag Manager - loaded via script (deferred until interaction) */}
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* Facebook Pixel - loaded via script (deferred until interaction) */}
        <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        
        {/* =============================================================================
            VIEWPORT CONFIGURATION - Optimized for iOS + Android
            
            Key settings:
            - width=device-width: Match device width
            - initial-scale=1: Start at 100% zoom
            - maximum-scale=5: Allow some zoom for accessibility (WCAG)
            - viewport-fit=cover: Support notched devices (iPhone X+)
            - interactive-widget=resizes-visual: Android Chrome keyboard handling
            
            NOTE: We do NOT use user-scalable=no (accessibility violation).
            Zoom prevention is handled via CSS touch-action on specific elements.
            ============================================================================= */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover, interactive-widget=resizes-visual" />
        <meta name="theme-color" content="#1a4d6e" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#0a1628" media="(prefers-color-scheme: light)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AutoRev" />
        
        {/* Facebook Domain Verification */}
        <meta name="facebook-domain-verification" content="vu8n45bve2gdnsxj7x3leq648aci5e" />
        
        {/* =============================================================================
            LCP IMAGE PRELOAD HINTS
            REMOVED from root layout - each page should handle its own LCP preload
            The homepage hero was being preloaded on ALL pages (246 KiB wasted)
            
            Page-specific preloads should be added via:
            - Homepage: app/(app)/page.jsx metadata or generateMetadata
            - Landing pages: handled by Next.js Image priority prop
            ============================================================================= */}
        
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
        {/* 
          CRITICAL: Inline script that runs BEFORE React hydrates
          Shows splash screen immediately if coming from OAuth callback
          This prevents any flash of loading/unauthenticated states
          
          The splash stays visible until AuthProvider calls window.dismissOAuthSplash()
          after auth is complete and minimum duration has passed.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Check for OAuth callback signals
                var params = new URLSearchParams(window.location.search);
                var authTs = params.get('auth_ts');
                var hasCallback = document.cookie.includes('auth_callback_complete=');
                
                // If we have fresh OAuth signals, show splash immediately
                if (authTs || hasCallback) {
                  var age = authTs ? Date.now() - parseInt(authTs, 10) : 0;
                  if (hasCallback || (age >= 0 && age < 60000)) {
                    // Record when splash started (for minimum duration calculation)
                    window.__splashStartTime = Date.now();
                    window.__hasSplash = true;
                    
                    // Create and inject splash screen
                    var splash = document.createElement('div');
                    splash.id = 'oauth-splash';
                    splash.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;width:100%;height:100vh;height:100dvh;background:#0d1b2a;display:flex;align-items:center;justify-content:center;z-index:999999;opacity:1;transition:opacity 0.5s ease-out;overflow:hidden;';
                    splash.innerHTML = '<div style="font-family:Oswald,sans-serif;font-size:clamp(48px,12vw,72px);font-weight:700;letter-spacing:-0.02em;text-transform:uppercase;animation:logoEnter 0.4s ease-out;"><span style="color:#fff;">AUTO</span><span style="color:#d4ff00;">REV</span></div><style>@keyframes logoEnter{from{opacity:0;transform:scale(0.95);}to{opacity:1;transform:scale(1);}}</style>';
                    document.body.appendChild(splash);
                    
                    // Global function for AuthProvider to dismiss splash
                    window.dismissOAuthSplash = function(callback) {
                      var splash = document.getElementById('oauth-splash');
                      if (splash) {
                        splash.style.opacity = '0';
                        setTimeout(function() {
                          splash.remove();
                          window.__hasSplash = false;
                          if (callback) callback();
                        }, 500);
                      } else if (callback) {
                        callback();
                      }
                    };
                    
                    console.log('[Splash] Inline script showed splash immediately');
                  }
                }
              })();
            `,
          }}
        />
        {/* Skip to main content link - WCAG 2.1 AA compliance */}
        <SkipLink />
        
        <ThemeProvider>
        <GlobalErrorHandler>
          <FetchInterceptor>
            <ConsoleErrorInterceptor>
              <ErrorBoundary name="RootLayout" featureContext="app">
                <QueryProvider>
                  <LoadingProgressProvider>
                    <AuthProvider>
                      <PostHogProvider>
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
                                    
                                    {/* Beta banner - DISABLED (launch mode) */}
                                    <BetaBanner visible={false} />
                                    
                                    {/* AI Chat removed - AL now uses dedicated /al page */}
                                    
                                    <main id="main-content" tabIndex={-1}>
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
                      </PostHogProvider>
                    </AuthProvider>
                  </LoadingProgressProvider>
                </QueryProvider>
              </ErrorBoundary>
            </ConsoleErrorInterceptor>
          </FetchInterceptor>
        </GlobalErrorHandler>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights sampleRate={0.5} />
        <ServiceWorkerRegistration />
        <CookieConsent />
      </body>
    </html>
  );
}

