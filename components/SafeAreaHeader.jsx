'use client';

/**
 * SafeAreaHeader - Client component wrapper that ensures safe area CSS works in PWAs
 *
 * PROBLEM: In PWAs, env(safe-area-inset-top) returns 0 on initial render before
 * the browser calculates actual safe area values, causing content to shift up.
 *
 * SOLUTION: This component uses the same pattern as DataHeader:
 * - Suspense boundary for delayed initial render
 * - useSearchParams() to trigger Suspense behavior
 * - State-based re-render after mount to ensure env() values are calculated
 *
 * This matches the working pattern in app/(app)/data/DataHeader.jsx
 */

import { Suspense, useState, useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

/**
 * Inner component that triggers Suspense via useSearchParams
 * and forces a re-render after mount for safe area calculation
 */
function SafeAreaContent({ children, className, style, as: Component = 'section' }) {
  // useSearchParams triggers Suspense, which delays render
  // This is the same pattern used in DataHeader
  useSearchParams();

  // Force re-render after mount to ensure env() values are calculated
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  return (
    <Component className={className} style={style} data-safe-area-mounted={mounted || undefined}>
      {children}
    </Component>
  );
}

/**
 * SafeAreaHeader - Wrap content that needs safe area padding
 *
 * @param {React.ReactNode} children - Content to render
 * @param {React.ReactNode} fallback - Optional fallback to show during Suspense (skeleton)
 * @param {string} className - CSS class for the wrapper
 * @param {object} style - Inline styles for the wrapper
 * @param {string} as - HTML element to render (default: 'section')
 */
export default function SafeAreaHeader({ children, fallback, className, style, as = 'section' }) {
  // Default fallback renders same element type with same class (maintains layout during Suspense)
  const Component = as;
  const suspenseFallback = fallback || (
    <Component className={className} style={style}>
      {children}
    </Component>
  );

  return (
    <Suspense fallback={suspenseFallback}>
      <SafeAreaContent className={className} style={style} as={as}>
        {children}
      </SafeAreaContent>
    </Suspense>
  );
}
