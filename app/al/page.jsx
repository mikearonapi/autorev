import { Suspense } from 'react';
import PageClient from './PageClient';
import { getPlatformStats } from '@/lib/statsService';

export async function generateMetadata() {
  let stats = { cars: 188, insights: 1226, fitments: 836 }; // Fallbacks
  try {
    stats = await getPlatformStats();
  } catch (e) {
    console.warn('[AL/page] Failed to fetch stats for metadata:', e.message);
  }

  return {
    title: 'AL | Your AI Car Expert — Tony Stark Had Jarvis, Now You Have AL',
    description: `Like having the obsessive car nerd in your pocket who's done all the research and never forgets anything. ${stats.cars} sports cars, ${stats.insights?.toLocaleString() || '1,200+'} owner insights. Specs, troubleshooting, mods, recalls — answered instantly.`,
    alternates: { canonical: '/al' },
    openGraph: {
      title: 'AL — Your AI Car Expert',
      description: `Tony Stark had Jarvis. Now you have AL. The obsessive car nerd in your pocket. ${stats.cars} sports cars, specs, mods, recalls — answered instantly.`,
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
  };
}

export default function ALPage() {
  // Wrap in Suspense because PageClient uses useSearchParams()
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
      <PageClient />
    </Suspense>
  );
}












