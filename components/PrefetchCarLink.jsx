'use client';

/**
 * Prefetch Car Link Component
 * 
 * A Link wrapper that prefetches car enriched data on hover.
 * This ensures near-instant loading when navigating to car detail pages.
 * 
 * @module components/PrefetchCarLink
 */

import Link from 'next/link';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { carKeys } from '@/hooks/useCarData';

/**
 * Fetch function for bundled enriched data
 */
async function fetchEnrichedData(slug) {
  const res = await fetch(`/api/cars/${slug}/enriched`);
  if (!res.ok) throw new Error('Failed to fetch enriched data');
  return res.json();
}

/**
 * PrefetchCarLink Component
 * 
 * Wraps Next.js Link with hover prefetching for car detail pages.
 * 
 * @param {Object} props
 * @param {string} props.slug - Car slug to prefetch
 * @param {string} [props.href] - Override href (defaults to /browse-cars/[slug])
 * @param {React.ReactNode} props.children - Link children
 * @param {string} [props.className] - CSS class name
 * @param {Object} [props.style] - Inline styles
 * @param {Function} [props.onMouseEnter] - Additional onMouseEnter handler
 * 
 * @example
 * <PrefetchCarLink slug="porsche-911-gt3">
 *   Porsche 911 GT3
 * </PrefetchCarLink>
 */
export function PrefetchCarLink({
  slug,
  href,
  children,
  className,
  style,
  onMouseEnter,
  ...props
}) {
  const queryClient = useQueryClient();
  
  const handleMouseEnter = useCallback((e) => {
    // Prefetch enriched data
    if (slug) {
      queryClient.prefetchQuery({
        queryKey: carKeys.enriched(slug),
        queryFn: () => fetchEnrichedData(slug),
        staleTime: 10 * 60 * 1000, // Consider fresh for 10 minutes
      });
    }
    
    // Call additional handler if provided
    onMouseEnter?.(e);
  }, [slug, queryClient, onMouseEnter]);
  
  const linkHref = href || `/browse-cars/${slug}`;
  
  return (
    <Link
      href={linkHref}
      className={className}
      style={style}
      onMouseEnter={handleMouseEnter}
      prefetch={true} // Also enable Next.js route prefetching
      {...props}
    >
      {children}
    </Link>
  );
}

/**
 * Hook to create a prefetch handler
 * Use this when you need more control over when to prefetch
 * 
 * @returns {Function} Prefetch function
 * 
 * @example
 * const prefetchCar = usePrefetchCar();
 * <div onMouseEnter={() => prefetchCar('porsche-911-gt3')}>
 *   ...
 * </div>
 */
export function usePrefetchCar() {
  const queryClient = useQueryClient();
  
  return useCallback((slug) => {
    if (!slug) return;
    
    queryClient.prefetchQuery({
      queryKey: carKeys.enriched(slug),
      queryFn: () => fetchEnrichedData(slug),
      staleTime: 10 * 60 * 1000,
    });
  }, [queryClient]);
}

export default PrefetchCarLink;

