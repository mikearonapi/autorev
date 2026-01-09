'use client';

/**
 * DeferredProviders - Delays mounting of non-critical providers until after first paint
 * 
 * PERFORMANCE OPTIMIZATION:
 * Heavy providers like AIMechanicProvider (2100+ lines) and FeedbackProvider
 * are not needed for initial render. By deferring them until after first paint,
 * we reduce Total Blocking Time (TBT) and improve interactivity.
 * 
 * Uses requestIdleCallback for optimal scheduling:
 * - Waits for browser idle time before mounting
 * - Falls back to setTimeout for Safari (which doesn't support requestIdleCallback)
 * - Ensures LCP and FCP are not blocked by these heavy components
 */

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import heavy providers with no SSR
const AIMechanicProvider = dynamic(
  () => import('@/components/AIMechanicChat').then(mod => ({ default: mod.AIMechanicProvider })),
  { ssr: false }
);

const FeedbackProvider = dynamic(
  () => import('@/components/FeedbackWidget').then(mod => ({ default: mod.FeedbackProvider })),
  { ssr: false }
);

export default function DeferredProviders({ children }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Use requestIdleCallback if available (Chrome, Firefox, Edge)
    // Fall back to setTimeout for Safari
    const scheduleMount = (callback) => {
      if ('requestIdleCallback' in window) {
        return window.requestIdleCallback(callback, { timeout: 2000 });
      } else {
        return setTimeout(callback, 100);
      }
    };

    const cancelMount = (id) => {
      if ('requestIdleCallback' in window) {
        window.cancelIdleCallback(id);
      } else {
        clearTimeout(id);
      }
    };

    // Defer mounting until browser is idle or 2s timeout
    const id = scheduleMount(() => {
      setIsReady(true);
    });

    return () => cancelMount(id);
  }, []);

  // Before ready: render children without heavy providers
  // After ready: wrap children in heavy providers
  if (!isReady) {
    return children;
  }

  return (
    <FeedbackProvider>
      <AIMechanicProvider>
        {children}
      </AIMechanicProvider>
    </FeedbackProvider>
  );
}
