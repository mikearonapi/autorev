/**
 * Car Detail Page - Server Component
 * 
 * URL: /browse-cars/[slug]
 * 
 * This is a hybrid Server/Client architecture:
 * - Server: Fetches main car data at build time (SSG) or request time
 * - Client: Handles interactivity, enriched data fetching via React Query
 * 
 * Performance benefits:
 * - Instant first contentful paint (FCP) with pre-fetched data
 * - No client-side loading spinner for main content
 * - Enriched data streams in progressively
 * - Server-side caching with unstable_cache prevents duplicate DB calls
 * 
 * @module app/browse-cars/[slug]/page
 */

import { notFound } from 'next/navigation';
import { getCachedCarBySlug } from '@/lib/carsCache.js';
import CarDetailClient from './CarDetailClient';

// Enable ISR - revalidate every 5 minutes
export const revalidate = 300;

/**
 * Server Component - fetches car data and passes to client
 */
export default async function CarDetailPage({ params }) {
  const { slug } = await params;
  
  // Fetch car data server-side with caching
  const car = await getCachedCarBySlug(slug);
  
  // If car not found, show 404
  if (!car) {
    notFound();
  }
  
  // Pass pre-fetched data to client component
  return <CarDetailClient car={car} />;
}
