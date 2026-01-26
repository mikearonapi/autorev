'use client';

/**
 * Meta Pixel (Facebook Pixel) Component
 * 
 * PERFORMANCE OPTIMIZATION: Defers Meta Pixel loading until after user interaction
 * or 5 seconds, whichever comes first. This eliminates ~90KB from initial load
 * and reduces main-thread blocking time significantly.
 * 
 * Strategy:
 * - Wait for first user interaction (click, scroll, keydown) OR 5 second timeout
 * - Then load Pixel scripts with lazyOnload strategy
 * - This ensures LCP is not blocked by tracking pixels
 * 
 * Environment variable: NEXT_PUBLIC_META_PIXEL_ID
 * 
 * @module components/MetaPixel
 */

import { useEffect, useState } from 'react';

import Script from 'next/script';

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function MetaPixel() {
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

  // Don't render anything if no pixel ID configured or not ready to load
  if (!META_PIXEL_ID || !shouldLoad) {
    return null;
  }

  return (
    <>
      {/* 
        Meta Pixel initialization with queue pattern.
        Sets up fbq as a queue function BEFORE loading the script,
        so calls to fbq() are queued and processed when the script loads.
        This prevents "fbq is not defined" errors.
      */}
      <Script
        id="meta-pixel-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            if (!window.fbq) {
              var n = window.fbq = function() {
                n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
              };
              if (!window._fbq) window._fbq = n;
              n.push = n;
              n.loaded = false;
              n.version = '2.0';
              n.queue = [];
            }
            if (!window._fbq_initialized) {
              window._fbq_initialized = true;
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            }
          `,
        }}
      />
      
      {/* Load Meta Pixel base script after queue is set up */}
      <Script
        id="meta-pixel-script"
        src="https://connect.facebook.net/en_US/fbevents.js"
        strategy="lazyOnload"
      />
      
      {/* Noscript fallback for tracking without JavaScript */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

