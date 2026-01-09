'use client';

/**
 * Google Analytics 4 (GA4) Component
 * 
 * Loads the GA4 gtag.js script and initializes tracking.
 * Uses Next.js Script component with lazyOnload strategy for better LCP.
 * This delays loading until after hydration and idle time.
 * 
 * Environment variable: NEXT_PUBLIC_GA_MEASUREMENT_ID
 * 
 * @module components/GoogleAnalytics
 */

import Script from 'next/script';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
  // Don't render anything if no measurement ID configured
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      {/* Load gtag.js script - lazyOnload for better LCP */}
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      
      {/* Initialize gtag */}
      <Script
        id="google-analytics"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
              send_page_view: true
            });
          `,
        }}
      />
    </>
  );
}









