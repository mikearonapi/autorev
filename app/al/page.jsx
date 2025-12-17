import PageClient from './PageClient';
import { getPlatformStats } from '@/lib/statsService';

export async function generateMetadata() {
  let stats = { cars: 98, insights: 1226, fitments: 836 }; // Fallbacks
  try {
    stats = await getPlatformStats();
  } catch (e) {
    console.warn('[AL/page] Failed to fetch stats for metadata:', e.message);
  }

  return {
    title: 'AL | Car AI That Actually Knows Cars',
    description: `Finally, an AI that doesn't guess. AL has ${stats.cars} sports cars, ${stats.insights?.toLocaleString() || '1,200+'} owner insights, ${stats.fitments?.toLocaleString() || '800+'} verified part fitments, and real performance data. Ask about specs, known issues, maintenance, or mods — and get answers with sources.`,
    alternates: { canonical: '/al' },
    openGraph: {
      title: 'AL — Finally, Car AI That Doesn\'t Guess',
      description: `ChatGPT invents specs. AL cites sources. ${stats.cars} sports cars, ${stats.insights?.toLocaleString() || '1,200+'} forum insights, ${stats.fitments?.toLocaleString() || '800+'} verified fitments. Try it free.`,
      url: '/al',
      type: 'website',
    },
    keywords: [
      'automotive ai',
      'car research ai',
      'sports car ai assistant',
      'car buying research',
      'parts fitment search',
      'car maintenance database',
      'owner insights ai',
    ],
  };
}

export default function ALPage() {
  return <PageClient />;
}

