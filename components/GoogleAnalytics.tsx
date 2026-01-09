'use client';

/**
 * Google Analytics 4 (GA4) Component
 * 
 * PERFORMANCE OPTIMIZATION: Defers GA loading until after user interaction
 * or 5 seconds, whichever comes first. This eliminates ~140KB from initial load
 * and reduces main-thread blocking time significantly.
 * 
 * Strategy:
 * - Wait for first user interaction (click, scroll, keydown) OR 5 second timeout
 * - Then load GA scripts with lazyOnload strategy
 * - This ensures LCP is not blocked by analytics
 * 
 * Environment variable: NEXT_PUBLIC_GA_MEASUREMENT_ID
 * 
 * @module components/GoogleAnalytics
 */

import { useEffect, useState } from 'react';
import Script from 'next/script';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Don't run on server or if already triggered
    if (typeof window === 'undefined') return;

    let loaded = false;
    const triggerLoad = () => {
      if (loaded) return;
      loaded = true;
      setShouldLoad(true);
      // Cleanup listeners
      window.removeEventListener('click', triggerLoad);
      window.removeEventListener('scroll', triggerLoad);
      window.removeEventListener('keydown', triggerLoad);
      window.removeEventListener('touchstart', triggerLoad);
    };

    // Load after user interaction
    window.addEventListener('click', triggerLoad, { once: true, passive: true });
    window.addEventListener('scroll', triggerLoad, { once: true, passive: true });
    window.addEventListener('keydown', triggerLoad, { once: true, passive: true });
    window.addEventListener('touchstart', triggerLoad, { once: true, passive: true });

    // Fallback: load after 5 seconds regardless
    const timer = setTimeout(triggerLoad, 5000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', triggerLoad);
      window.removeEventListener('scroll', triggerLoad);
      window.removeEventListener('keydown', triggerLoad);
      window.removeEventListener('touchstart', triggerLoad);
    };
  }, []);

  // Don't render anything if no measurement ID configured
  if (!GA_MEASUREMENT_ID || !shouldLoad) {
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









