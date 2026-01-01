'use client';

/**
 * Meta Pixel (Facebook Pixel) Component
 * 
 * Loads the Meta Pixel script and initializes tracking.
 * Uses Next.js Script component with lazyOnload strategy to prevent double-firing.
 * 
 * Environment variable: NEXT_PUBLIC_META_PIXEL_ID
 * 
 * @module components/MetaPixel
 */

import Script from 'next/script';

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export default function MetaPixel() {
  // Don't render anything if no pixel ID configured
  if (!META_PIXEL_ID) {
    return null;
  }

  return (
    <>
      {/* Load Meta Pixel base script */}
      <Script
        id="meta-pixel-script"
        src="https://connect.facebook.net/en_US/fbevents.js"
        strategy="afterInteractive"
      />
      
      {/* Initialize Meta Pixel - separate script ensures single execution */}
      <Script
        id="meta-pixel-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if (!window._fbq_initialized) {
              window._fbq_initialized = true;
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            }
          `,
        }}
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

