import { Suspense } from 'react';

import { getPlatformStats } from '@/lib/statsService';

import ALPageClient from './ALPageClient';

/**
 * AL Chat Page
 * 
 * Server component wrapper with SEO metadata.
 * The actual chat UI is in ALPageClient.
 */

export async function generateMetadata() {
  let stats = { cars: 188, insights: 1226, fitments: 836 }; // Fallbacks
  try {
    stats = await getPlatformStats();
  } catch (e) {
    console.warn('[AL/page] Failed to fetch stats for metadata:', e.message);
  }

  return {
    title: 'AL | Your AI Car Expert — AutoRev',
    description: `Your AI car expert that actually knows cars. ${stats.cars} sports cars, ${stats.insights?.toLocaleString() || '1,200+'} owner insights. Specs, troubleshooting, mods, recalls — answered instantly.`,
    alternates: { canonical: '/al' },
    openGraph: {
      title: 'AL — Your AI Car Expert',
      description: `Your AI car expert that actually knows cars. ${stats.cars} sports cars, specs, mods, recalls — answered instantly.`,
      url: '/al',
      type: 'website',
    },
    keywords: [
      'car AI assistant',
      'automotive AI',
      'car research AI',
      'sports car AI',
      'car specs lookup',
      'car troubleshooting AI',
      'car modification advice',
      'recall lookup',
      'car maintenance help',
      'parts fitment search',
    ],
    // Don't index authenticated pages
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function ALPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
      <ALPageClient />
    </Suspense>
  );
}
