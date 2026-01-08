'use client';

import { useEffect } from 'react';
import { trackEvent, trackPageView } from '@/lib/ga4';

/**
 * Client-only landing page tracking (page view).
 * @param {{ pageId: string }} props
 */
export default function LandingTracking({ pageId }) {
  useEffect(() => {
    try {
      trackPageView(window.location.pathname, document.title);
      trackEvent('landing_page_view', { landing_page: pageId });
    } catch (err) {
      // Analytics should never break the page
      console.warn('[LandingTracking] Failed to track landing page view:', err);
    }
  }, [pageId]);

  return null;
}










